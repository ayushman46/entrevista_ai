import asyncio
import json
import logging
import os
import uuid
import aiofiles
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.config import settings
from app.services.session_manager import session_manager
from app.services.interview_engine import evaluate_answer
from app.services.audio_service import generate_tts, transcribe_audio

router = APIRouter()
logger = logging.getLogger(__name__)

@router.websocket("/ws/interview/{interview_id}")
async def interview_websocket(websocket: WebSocket, interview_id: str):
    await websocket.accept()
    logger.info(f"WebSocket connected for interview {interview_id}")
    
    session = session_manager.get_session(interview_id)
    if not session:
        await websocket.close(code=4004)
        return

    audio_buffer = bytearray()
    is_processing = False
    total_audio_received = 0
    MAX_SESSION_AUDIO_BYTES = 100 * 1024 * 1024 # 100 MB limit per session

    try:
        while True:
            try:
                message = await websocket.receive()
            except RuntimeError as e:
                if "receive" in str(e) and "disconnect" in str(e):
                    logger.info("WebSocket already disconnected, stopping receive loop.")
                    break
                raise e

            if "bytes" in message:
                chunk_size = len(message["bytes"])
                total_audio_received += chunk_size
                if total_audio_received > MAX_SESSION_AUDIO_BYTES:
                    logger.warning(f"Session {interview_id} exceeded max audio quota.")
                    await websocket.close(code=1008) # Policy violation
                    break
                
                audio_buffer.extend(message["bytes"])
                logger.debug(f"Received audio chunk of {chunk_size} bytes. Total buffer size: {len(audio_buffer)}")
            
            elif "text" in message:
                data = json.loads(message["text"])
                if data.get("type") == "ping":
                    await websocket.send_json({"type": "pong"})
                elif data.get("type") == "end_of_turn":
                    logger.info(f"Received end_of_turn. Current buffer size: {len(audio_buffer)}")
                    if len(audio_buffer) > 0 and not is_processing:
                        is_processing = True
                        try:
                            await process_audio_turn(websocket, interview_id, audio_buffer)
                        finally:
                            audio_buffer = bytearray()
                            is_processing = False
                elif message.get("type") == "websocket.disconnect":
                    logger.info("Received explicit disconnect message.")
                    break

    except WebSocketDisconnect:
        logger.info(f"WebSocket disconnected for interview {interview_id}")
    except Exception as e:
        logger.error(f"WebSocket error: {e}", exc_info=True)
        try:
            if websocket.client_state.name != "DISCONNECTED":
                await websocket.close(code=1011)
        except Exception:
            pass


async def process_audio_turn(websocket: WebSocket, interview_id: str, audio_data: bytes):
    """Handles STT -> LLM -> TTS pipeline for a turn."""
    session = session_manager.get_session(interview_id)
    if not session or session["status"] == "completed":
        return

    # Save audio to temp file for transcription
    temp_filename = f"ws_{uuid.uuid4().hex}.webm"
    temp_path = os.path.join(settings.UPLOAD_DIR, temp_filename)
    
    async with aiofiles.open(temp_path, 'wb') as f:
        await f.write(audio_data)

    logger.info(f"Saved audio to {temp_path} for transcription. Size: {len(audio_data)} bytes")

    try:
        # 1. Transcribe (STT)
        logger.info("Calling Groq Whisper for transcription...")
        answer_text = await transcribe_audio(temp_path)
        logger.info(f"Whisper transcription result: '{answer_text}'")
        
        if not answer_text.strip() or len(answer_text.strip()) < 2:
            logger.warning(f"Short or empty transcription received ('{answer_text}'). Skipping turn.")
            await websocket.send_json({
                "type": "error",
                "message": "I didn't quite catch that. Could you please repeat?"
            })
            return

        await websocket.send_json({
            "type": "transcript",
            "text": answer_text
        })

        # 2. Evaluate & Generate Next Question (LLM)
        questions = session.get("questions", [])
        current_idx = len(questions) - 1
        current_q = questions[current_idx]

        evaluation, is_complete = await evaluate_answer(
            interview_id=interview_id,
            question=current_q["question"],
            answer=answer_text,
            expected_concepts=current_q.get("expected_concepts", []),
            topic=current_q.get("topic", "General"),
            role=session["role"],
        )

        # 3. Generate TTS for next question
        next_q = evaluation.get("next_question")
        audio_url = None
        if not is_complete and next_q:
            audio_filename = await generate_tts(next_q)
            audio_url = f"/audio/{audio_filename}"

        # 4. Send response back to frontend
        await websocket.send_json({
            "type": "turn_complete",
            "evaluation": evaluation,
            "interview_complete": is_complete,
            "next_question": next_q,
            "audio_url": audio_url,
            "topic": evaluation.get("topic")
        })

    except Exception as e:
        logger.error(f"Error processing turn: {e}")
        await websocket.send_json({"type": "error", "message": str(e)})
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)
