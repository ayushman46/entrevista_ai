import asyncio
import json
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.services.session_manager import get_session, append_transcript, get_transcripts
from app.services.stt_service import transcribe_audio
from app.services.llm_chain import generate_sentences
from app.services.tts_service import synthesize_sentence

router = APIRouter()

@router.websocket("/ws/interview/{session_id}")
async def websocket_endpoint(websocket: WebSocket, session_id: str):
    await websocket.accept()
    
    session = await get_session(session_id)
    if not session:
        await websocket.close(code=1008, reason="Session not found")
        return
        
    try:
        send_lock = asyncio.Lock()
        
        # Check if we need to start the conversation
        history = await get_transcripts(session_id)
        if not history:
            messages = [
                {"role": "system", "content": f"You are an expert interviewer. You are interviewing the candidate '{session['candidate_name']}' for the role of '{session['target_role']}'. Keep your responses concise and conversational, one or two sentences max. Do not output markdown, just plain spoken text.\nResume:\n{session.get('resume_text', 'No resume provided.')}"},
                {"role": "system", "content": f"Start the interview by greeting the candidate by name ({session['candidate_name']}) and asking the first interview question."}
            ]
            asyncio.create_task(process_ai_response(websocket, session_id, messages, send_lock))

        while True:
            # Receive binary utterance from VAD client
            audio_bytes = await websocket.receive_bytes()
            
            # STT
            user_text = await transcribe_audio(audio_bytes)
            if not user_text:
                continue
                
            # Send transcribed text back to client so they see it
            async with send_lock:
                await websocket.send_json({
                    "type": "transcript",
                    "role": "user",
                    "content": user_text
                })
            
            # Persist user turn
            await append_transcript(session_id, "user", user_text)
            
            # Build history for LLM
            history = await get_transcripts(session_id)
            messages = [
                {"role": "system", "content": f"You are an expert interviewer. You are interviewing the candidate '{session['candidate_name']}' for the role of '{session['target_role']}'. Keep your responses concise and conversational, one or two sentences max. Do not output markdown, just plain spoken text.\nResume:\n{session.get('resume_text', 'No resume provided.')}"}
            ]
            for msg in history:
                messages.append({"role": msg["role"] if msg["role"] == "user" else "assistant", "content": msg["content"]})
            
            # Start LLM sentence stream
            asyncio.create_task(process_ai_response(websocket, session_id, messages, send_lock))
            
    except WebSocketDisconnect:
        print(f"Client disconnected for session {session_id}")

async def process_ai_response(websocket: WebSocket, session_id: str, messages: list, send_lock: asyncio.Lock):
    full_ai_text = ""
    seq = 1
    
    tts_tasks = []
    
    try:
        async for sentence in generate_sentences(messages):
            full_ai_text += sentence + " "
            
            async with send_lock:
                await websocket.send_json({
                    "type": "transcript_chunk",
                    "role": "ai",
                    "content": sentence,
                    "seq": seq
                })
            
            task = asyncio.create_task(synthesize_and_send(websocket, sentence, seq, send_lock))
            tts_tasks.append(task)
            seq += 1
            
        if tts_tasks:
            await asyncio.gather(*tts_tasks)
            
        async with send_lock:
            await websocket.send_json({"type": "ai_turn_complete"})
    except RuntimeError as e:
        print(f"Socket closed during AI response: {e}")
    except Exception as e:
        print(f"Error in process_ai_response: {e}")
    
    await append_transcript(session_id, "ai", full_ai_text.strip())

async def synthesize_and_send(websocket: WebSocket, sentence: str, seq: int, send_lock: asyncio.Lock):
    try:
        audio_bytes = await synthesize_sentence(sentence)
        async with send_lock:
            await websocket.send_json({
                "type": "audio_chunk",
                "seq": seq,
                "text": sentence
            })
            await websocket.send_bytes(audio_bytes)
    except RuntimeError:
        pass # Socket closed
    except Exception as e:
        print(f"Error in TTS seq {seq}: {e}")
