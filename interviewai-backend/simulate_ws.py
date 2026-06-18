import asyncio
import websockets
import json
import logging
import time
from app.services.audio_service import generate_tts
from app.services.session_manager import session_manager
from app.config import settings
import os

logging.basicConfig(level=logging.INFO)

async def run_simulation():
    # 1. Create a dummy session
    session = session_manager.create_session(
        resume_id="test_resume",
        candidate_name="Test Candidate",
        role="frontend_developer",
        interview_plan={"topics": ["React"], "difficulty": "medium", "estimated_questions": 5}
    )
    
    interview_id = session["interview_id"]
    
    # 2. Add a question so there's context
    session_manager.add_question(
        interview_id,
        "What is the virtual DOM in React?",
        "React"
    )
    
    # 3. Generate a fake audio answer using TTS
    answer_text = "The virtual DOM is a lightweight copy of the actual DOM. React uses it to improve performance by doing reconciliation and only updating the changed parts."
    tts_filename = await generate_tts(answer_text)
    tts_path = os.path.join(settings.UPLOAD_DIR, "audio", tts_filename)
    logging.info(f"Generated test audio at {tts_path}")
    
    # 4. Connect to websocket
    uri = f"ws://localhost:8000/ws/interview/{interview_id}"
    logging.info(f"Connecting to {uri}")
    
    try:
        async with websockets.connect(uri) as websocket:
            logging.info("Connected!")
            
            # Read audio file and send in chunks
            with open(tts_path, "rb") as f:
                while chunk := f.read(1024 * 16): # 16KB chunks
                    await websocket.send(chunk)
                    logging.info(f"Sent {len(chunk)} bytes of audio")
                    await asyncio.sleep(0.1) # Simulate real-time streaming
            
            # Send end_of_turn
            end_msg = {"type": "end_of_turn"}
            start_time = time.time()
            await websocket.send(json.dumps(end_msg))
            logging.info("Sent end_of_turn")
            
            # Wait for responses
            while True:
                try:
                    response = await asyncio.wait_for(websocket.recv(), timeout=25.0)
                    if isinstance(response, str):
                        data = json.loads(response)
                        logging.info(f"Received JSON response: {data.get('type')}")
                        if data.get('type') == 'turn_complete':
                            end_time = time.time()
                            logging.info(f"Evaluation: {data.get('evaluation')}")
                            logging.info(f"Next question: {data.get('next_question')}")
                            logging.info(f"Latency: {end_time - start_time:.2f} seconds")
                            break
                        elif data.get('type') == 'transcript':
                            logging.info(f"Transcript: {data.get('text')}")
                    else:
                        logging.info(f"Received binary response: {len(response)} bytes")
                except asyncio.TimeoutError:
                    logging.error("Timeout waiting for response from server")
                    break
    except Exception as e:
        logging.error(f"WebSocket error: {e}")

if __name__ == "__main__":
    asyncio.run(run_simulation())