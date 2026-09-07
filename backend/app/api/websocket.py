import asyncio
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.services.session_manager import (
    append_transcript,
    get_session,
    get_transcripts,
    save_interview_context,
)
from app.services.stt_service import transcribe_audio
from app.services.llm_chain import generate, generate_sentences
from app.services.tts_service import synthesize_sentence
from app.services.interview_context import (
    build_interview_context,
    build_interview_messages,
    default_interview_memory,
    default_interview_state,
    merge_answer_analysis,
    parse_json_object,
    record_question,
)

router = APIRouter()
ANALYSIS_IDLE_DELAY_SECONDS = 1.5

@router.websocket("/ws/interview/{session_id}")
async def websocket_endpoint(websocket: WebSocket, session_id: str):
    await websocket.accept()
    
    session, history = await asyncio.gather(
        get_session(session_id),
        get_transcripts(session_id),
    )
    if not session:
        await websocket.close(code=1008, reason="Session not found")
        return
        
    try:
        send_lock = asyncio.Lock()
        analysis_task = None
        
        next_audio_seq = 1
        if not history:
            context = build_interview_context(session, history, live=True)
            messages = build_interview_messages(
                context,
                "Start the interview by greeting the candidate by name and asking one relevant opening question. Use the target role, job description, and resume only as grounding context.",
            )
            next_audio_seq = await process_ai_response(
                websocket,
                session_id,
                messages,
                send_lock,
                seq_start=next_audio_seq,
            )

        while True:
            # Receive binary utterance from VAD client
            audio_bytes = await websocket.receive_bytes()

            # A new utterance is higher priority than background answer analysis.
            if analysis_task and not analysis_task.done():
                analysis_task.cancel()
                try:
                    await analysis_task
                except asyncio.CancelledError:
                    pass
            
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

            # Build the next prompt from bounded, structured context rather than raw full history.
            session, history = await asyncio.gather(
                get_session(session_id),
                get_transcripts(session_id),
            )
            context = build_interview_context(session, history, live=True)
            messages = build_interview_messages(
                context,
                "Respond to the latest candidate answer, then ask exactly one adaptive follow-up question. Probe for concrete evidence when the answer is vague, increase difficulty when it is strong, and ask a neutral clarification when it is inconsistent. Keep the spoken response to one or two concise sentences.",
            )
            
            # Serialize live turns so transcript and audio frames cannot interleave.
            # Analysis starts only after the spoken turn has been delivered.
            next_audio_seq = await process_ai_response(
                websocket,
                session_id,
                messages,
                send_lock,
                seq_start=next_audio_seq,
            )
            analysis_task = asyncio.create_task(
                analyze_when_idle(session_id, user_text)
            )
            
    except WebSocketDisconnect:
        if analysis_task and not analysis_task.done():
            analysis_task.cancel()
            try:
                await analysis_task
            except asyncio.CancelledError:
                pass
        print(f"Client disconnected for session {session_id}")


async def analyze_when_idle(session_id: str, answer: str):
    """Run optional analysis only after the live path has had an idle window."""
    await asyncio.sleep(ANALYSIS_IDLE_DELAY_SECONDS)
    await analyze_candidate_answer(session_id, answer)


async def analyze_candidate_answer(session_id: str, answer: str):
    """Capture evidence for future turns without putting analysis text on the voice channel."""
    try:
        session, transcripts = await asyncio.gather(
            get_session(session_id),
            get_transcripts(session_id),
        )
        if not session:
            return
        context = build_interview_context(session, transcripts)
        previous_question = next(
            (
                message.get("content", "")
                for message in reversed(transcripts[:-1])
                if message.get("role") == "ai"
            ),
            "",
        )
        messages = build_interview_messages(
            context,
            f"""Analyze the latest candidate answer internally. The preceding interviewer question was:
{previous_question}

Return ONLY valid JSON with these keys:
{{
  "classification": {{"fact": [], "claim": [], "explanation": [], "example": [], "technical_detail": [], "uncertainty": [], "contradiction": [], "evasion": []}},
  "summary": "brief evidence-based summary",
  "facts": [],
  "claims": [],
  "technical_details": [],
  "important_claims": [],
  "strong_areas": [],
  "weak_areas": [],
  "unverified_claims": [],
  "topics_to_probe": [],
  "uncertainties": [],
  "contradictions": [],
  "competencies": [
    {{"name": "competency", "score": 0, "confidence": 0.0, "evidence": [], "positive_signals": [], "negative_signals": []}}
  ]
}}

Only record candidate-specific facts that are present in the resume or answer. Do not treat a preferred solution as the only valid solution. Do not include hidden reasoning.""",
        )
        response_text = ""
        async for chunk in generate(messages, purpose="analysis"):
            response_text += chunk
        analysis = parse_json_object(response_text)
        if not analysis:
            return

        latest_session = await get_session(session_id)
        if not latest_session:
            return
        state = latest_session.get("interview_state") or default_interview_state()
        memory = latest_session.get("interview_memory") or default_interview_memory()
        next_state, next_memory = merge_answer_analysis(
            state,
            memory,
            previous_question,
            answer,
            analysis,
        )
        await save_interview_context(session_id, next_state, next_memory)
    except Exception as exc:
        # Answer analysis is additive; a provider failure must never interrupt the live interview.
        print(f"Answer analysis failed for session {session_id}: {exc}")


async def process_ai_response(
    websocket: WebSocket,
    session_id: str,
    messages: list,
    send_lock: asyncio.Lock,
    seq_start: int = 1,
) -> int:
    full_ai_text = ""
    seq = seq_start
    persisted = False
    
    tts_tasks = []
    
    try:
        async with send_lock:
            await websocket.send_json({"type": "ai_turn_start"})

        async for sentence in generate_sentences(messages, purpose="realtime"):
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

        if full_ai_text.strip():
            await append_transcript(session_id, "ai", full_ai_text.strip())
            persisted = True
            session = await get_session(session_id)
            if session:
                state = record_question(
                    session.get("interview_state") or default_interview_state(),
                    full_ai_text.strip(),
                )
                memory = session.get("interview_memory") or default_interview_memory()
                await save_interview_context(session_id, state, memory)
            
    except RuntimeError as e:
        print(f"Socket closed during AI response: {e}")
    except Exception as e:
        print(f"Error in process_ai_response: {e}")
    finally:
        if full_ai_text.strip() and not persisted:
            try:
                await append_transcript(session_id, "ai", full_ai_text.strip())
            except Exception as exc:
                print(f"Failed to persist partial AI response: {exc}")

        try:
            async with send_lock:
                await websocket.send_json({"type": "ai_turn_complete"})
        except RuntimeError:
            pass

    return seq

async def synthesize_and_send(websocket: WebSocket, sentence: str, seq: int, send_lock: asyncio.Lock):
    try:
        audio_bytes = await synthesize_sentence(sentence)
    except Exception as e:
        print(f"Error in TTS seq {seq}: {e}")
        # Always release the sequence so one failed TTS request cannot stall
        # every later audio chunk in the browser queue.
        try:
            async with send_lock:
                await websocket.send_json({
                    "type": "audio_chunk_error",
                    "seq": seq,
                    "text": sentence,
                })
        except RuntimeError:
            pass
        return

    try:
        async with send_lock:
            await websocket.send_json({
                "type": "audio_chunk",
                "seq": seq,
                "text": sentence
            })
            await websocket.send_bytes(audio_bytes)
    except RuntimeError:
        pass  # Socket closed while sending the completed audio.
