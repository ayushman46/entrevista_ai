# InterviewAI

InterviewAI is a voice-first practice interview platform. A candidate uploads a resume, optionally adds a job description, chooses a target role, and completes an adaptive interview with a generated report.

## Architecture

The project has two applications:

- `frontend`: Next.js 14 client with local Silero VAD, WebSocket audio transport, transcript UI, and report screens.
- `backend`: FastAPI service that coordinates transcription, NVIDIA language generation, speech synthesis, MongoDB persistence, adaptive state, and reports.

## Live Interview Pipeline

The live path is optimized for fast time-to-first-response while preserving ordered audio:

1. Silero VAD runs in the browser and detects the end of a candidate utterance.
2. The browser encodes the captured audio as 16 kHz mono PCM WAV and sends it over the persistent interview WebSocket.
3. Groq Whisper `whisper-large-v3-turbo` transcribes the completed utterance. Groq is used for speech-to-text only.
4. The backend persists the candidate transcript and builds a bounded live prompt from the candidate, resume, job description, interview state, memory, and recent conversation.
5. NVIDIA `nvidia/nemotron-3.5-lightning-30b-a3b` streams the interviewer response with live reasoning disabled.
6. Each completed sentence is sent to the browser immediately and synthesized concurrently with the other sentences.
7. The browser queues audio by a monotonic sequence number, so out-of-order TTS completion cannot reorder playback.
8. Candidate answer analysis is delayed until an idle window and canceled when a new utterance arrives. It never competes with the critical live response.

The pipeline is low-latency, not literally zero-latency: the current Whisper endpoint receives a completed utterance rather than a continuous audio stream, and TTS must still synthesize the first sentence. True sub-second full-duplex interaction would require a streaming ASR/TTS transport or NVIDIA Nemotron VoiceChat early access.

## Provider Boundary

Language generation uses NVIDIA exclusively through its OpenAI-compatible API Catalog endpoint:

- Live interviewer turns: `nvidia/nemotron-3.5-lightning-30b-a3b` for speed.
- Answer analysis and final reports: `nvidia/nemotron-3-super-120b-a12b` for deeper reasoning.
- NVIDIA reasoning output is never sent to the candidate or spoken by TTS.
- Groq is limited to Whisper speech transcription in `backend/app/services/stt_service.py`.
- Microsoft Edge TTS is used for spoken playback.

NVIDIA free endpoints and Groq free access are quota-limited trial/development services. They are not unlimited production capacity. Check each provider's current limits before deployment.

## Local Setup

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --port 8000
```

Configure these values in `backend/.env`:

```env
MONGODB_URI="mongodb+srv://<user>:<password>@<cluster>/<database>"
MONGODB_DB_NAME="interviewai"
GROQ_API_KEY="your_groq_key"
NVIDIA_API_KEY="your_nvidia_api_catalog_key"
CORS_ORIGINS="http://localhost:3000"
```

Optional NVIDIA performance settings:

```env
NVIDIA_REALTIME_MODEL="nvidia/nemotron-3.5-lightning-30b-a3b"
NVIDIA_ANALYSIS_MODEL="nvidia/nemotron-3-super-120b-a12b"
NVIDIA_REALTIME_THINKING="false"
NVIDIA_ANALYSIS_THINKING="true"
NVIDIA_REALTIME_TIMEOUT="15"
NVIDIA_ANALYSIS_TIMEOUT="45"
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend defaults to `http://127.0.0.1:8000` for the REST API and `ws://127.0.0.1:8000` for WebSockets. Set these when using a deployed backend:

```env
NEXT_PUBLIC_API_URL="https://your-backend.example.com"
NEXT_PUBLIC_WS_URL="wss://your-backend.example.com"
```

## Routes

- `/`: landing page and direct interview CTA.
- `/upload`: optional PDF resume upload and text extraction.
- `/setup`: candidate name, target role, and optional job description.
- `/interview/[id]`: live voice interview.
- `/report/[id]`: evidence-based interview report.

Backend endpoints:

- `POST /api/resume/upload`
- `POST /api/interview/start`
- `GET /api/interview/{session_id}`
- `GET /api/report/{session_id}`
- `WS /ws/interview/{session_id}`

## Latency Guardrails

The implementation avoids common live-path bottlenecks:

- NVIDIA HTTP clients are reused so every turn does not establish a new connection.
- Live prompts clip large resume and job-description payloads and keep only recent conversation context.
- Live generation uses streaming and disables reasoning.
- TTS starts at the first sentence rather than waiting for the full answer.
- Analysis is deferred and cancelable.
- Live turns are serialized to prevent overlapping model requests and corrupted audio ordering.
- Audio sequence numbers never reset during a WebSocket session.
- VAD does not upload new utterances while the interviewer is thinking or speaking.

The first browser visit can still spend time downloading the local VAD/WebAssembly assets. That cost is paid at startup, not on each answer.

## Verification

Run backend tests:

```bash
cd backend
./venv/bin/pytest -q
```

Run frontend checks:

```bash
cd frontend
npx tsc --noEmit
npm run build
```

The test suite covers API routes, session persistence, context bounding, provider selection, NVIDIA request construction, Whisper behavior, TTS behavior, sentence streaming, ordered live audio sequencing, and cancellation of background analysis.

## Deployment

The frontend can be deployed to Vercel and the backend to Render or another ASGI host. The backend host must provide:

- Python 3.12-compatible runtime.
- MongoDB network access.
- NVIDIA and Groq environment variables.
- WebSocket support.
- CORS configured for the deployed frontend origin.

Never commit `.env` files or provider keys. Rotate any key that has been exposed outside the intended secret store.
