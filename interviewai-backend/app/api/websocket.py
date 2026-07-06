import asyncio
import json
import logging
import os
import uuid
import aiofiles
import tempfile
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
    
    session = await session_manager.get_session(interview_id)
    if not session:
        await websocket.send_json({"type": "error", "code": "session_not_found"})
        await websocket.close(code=4004)
        return
    if session.get("status") == "completed":
        await websocket.send_json({
            "type": "error",
            "code": "session_completed",
            "message": "This interview is already complete."
        })
        await websocket.close(code=4000)
        return

    audio_dir = os.path.join(settings.UPLOAD_DIR, "audio")
    os.makedirs(audio_dir, exist_ok=True)
    fd, temp_filepath = tempfile.mkstemp(suffix=".webm", dir=audio_dir)
    os.close(fd)

    audio_buffer = bytearray()
    
    # State tracking
    state = {
        "is_processing": False,
        "total_audio_received": 0,
        "temp_filepath": temp_filepath,
        "audio_buffer": audio_buffer
    }
    
    MAX_SESSION_AUDIO_BYTES = 100 * 1024 * 1024 # 100 MB limit per session
    send_lock = asyncio.Lock()

    async def safe_send_json(data):
        async with send_lock:
            try:
                await websocket.send_json(data)
            except Exception as e:
                logger.error(f"Error sending data to websocket: {e}")

    async def _process_task(filepath_to_process, live_transcript):
        try:
            await process_audio_turn(websocket, interview_id, filepath_to_process, live_transcript, safe_send_json)
        except Exception as e:
            logger.error(f"Background task processing error: {e}", exc_info=True)
            await safe_send_json({"type": "error", "message": "An error occurred while processing your answer."})
        finally:
            if os.path.exists(filepath_to_process):
                try:
                    os.remove(filepath_to_process)
                except Exception as rm_err:
                    logger.error(f"Error removing temp file: {rm_err}")
            state["is_processing"] = False

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
                state["total_audio_received"] += chunk_size
                if state["total_audio_received"] > MAX_SESSION_AUDIO_BYTES:
                    logger.warning(f"Session {interview_id} exceeded max audio quota.")
                    await websocket.close(code=1008) # Policy violation
                    break
                
                state["audio_buffer"].extend(message["bytes"])
                
                # Flush to temp file every 64KB
                if len(state["audio_buffer"]) >= 64 * 1024:
                    async with aiofiles.open(state["temp_filepath"], 'ab') as f:
                        await f.write(bytes(state["audio_buffer"]))
                    state["audio_buffer"] = bytearray()
            
            elif "text" in message:
                data = json.loads(message["text"])
                if data.get("type") == "ping":
                    await safe_send_json({"type": "pong"})
                elif data.get("type") == "end_of_turn":
                    logger.info(f"Received end_of_turn. Current buffer size: {len(state['audio_buffer'])}")
                    
                    fresh_session = await session_manager.get_session(interview_id)
                    if fresh_session and fresh_session.get("status") == "completed":
                        await safe_send_json({"type": "interview_complete"})
                        state["audio_buffer"] = bytearray()
                        continue

                    if not state["is_processing"]:
                        state["is_processing"] = True
                        
                        # Flush remaining buffer to temp file
                        if len(state["audio_buffer"]) > 0:
                            async with aiofiles.open(state["temp_filepath"], 'ab') as f:
                                await f.write(bytes(state["audio_buffer"]))
                            state["audio_buffer"] = bytearray()
                        
                        file_to_process = state["temp_filepath"]
                        
                        # Create a new temp file for the next turn immediately
                        fd, new_temp = tempfile.mkstemp(suffix=".webm", dir=audio_dir)
                        os.close(fd)
                        state["temp_filepath"] = new_temp
                        
                        live_transcript = data.get("transcript", "")
                        
                        # Process in background so the receive loop can continue (e.g. for pings)
                        asyncio.create_task(_process_task(file_to_process, live_transcript))
                        
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
    finally:
        if os.path.exists(state["temp_filepath"]):
            try:
                os.remove(state["temp_filepath"])
            except Exception as rm_err:
                logger.error(f"Error removing temp file on disconnect: {rm_err}")

async def process_audio_turn(websocket: WebSocket, interview_id: str, temp_path: str, live_transcript: str = "", safe_send_json=None):
    if safe_send_json is None:
        safe_send_json = websocket.send_json
    """Handles STT -> LLM -> TTS pipeline for a turn using the pre-flushed temp file."""
    session = await session_manager.get_session(interview_id)
    if not session or session["status"] == "completed":
        return

    logger.info(f"Using flushed audio at {temp_path} for transcription.")

    try:
        # 1. Transcribe (STT)
        logger.info("Calling Groq Whisper for transcription...")
        whisper_transcript = ""
        try:
            if os.path.exists(temp_path) and os.path.getsize(temp_path) > 0:
                whisper_transcript = await transcribe_audio(temp_path)
                logger.info(f"Whisper transcription result: '{whisper_transcript}'")
        except Exception as stt_err:
            logger.error(f"Whisper transcription failed: {stt_err}")

        whisper_transcript = whisper_transcript.strip()
        live_transcript = live_transcript.strip()

        if not whisper_transcript and not live_transcript:
            logger.warning("Both Whisper and live transcriptions are empty.")
            await safe_send_json({
                "type": "error",
                "code": "transcription_failed",
                "message": "Could not transcribe audio. Please check your microphone and try again."
            })
            return

        if not whisper_transcript and live_transcript:
            answer_text = live_transcript
            source = "browser_stt_fallback"
        else:
            answer_text = whisper_transcript
            source = "whisper"

        logger.info(f"Using transcript from source '{source}': '{answer_text}'")

        await safe_send_json({
            "type": "transcript",
            "text": answer_text,
            "source": source
        })

        # 2. Evaluate & Generate Next Question (LLM)
        questions = session.get("questions", [])
        current_idx = session.get("current_question_index", len(questions) - 1)
        if 0 <= current_idx < len(questions):
            current_q = questions[current_idx]
        else:
            current_q = questions[-1]

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
        await safe_send_json({
            "type": "turn_complete",
            "evaluation": evaluation,
            "interview_complete": is_complete,
            "next_question": next_q,
            "audio_url": audio_url,
            "topic": evaluation.get("topic"),
            "transcript": answer_text
        })

    except Exception as e:
        logger.error(f"Error processing turn: {e}")
        await safe_send_json({"type": "error", "message": str(e)})
