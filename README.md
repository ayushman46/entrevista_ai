# InterviewAI

InterviewAI is a voice-first AI interview practice platform for candidates who want to rehearse the interview they are actually preparing for, not a generic list of questions.

Give it a resume, a target role, and an optional job description. InterviewAI conducts a spoken interview, adapts its follow-up questions to the candidate's answers, and produces an evidence-backed report on what was demonstrated and what to improve.

## The Problem

Interview preparation is usually fragmented:

- Question banks teach recall, but do not simulate thinking aloud under pressure.
- Generic mock interviews ignore the candidate's actual experience and the requirements of the role.
- Peer and mentor practice can be valuable, but it depends on finding the right person, scheduling a session, and receiving consistent feedback.
- A final score without supporting evidence does not tell a candidate which answer, explanation, or gap affected the result.
- Live interview copilots may help someone get through a conversation, but they do not necessarily build the communication, reasoning, and self-awareness needed to perform independently.

Candidates need a repeatable practice loop that is realistic enough to expose weak answers, personalized enough to be relevant, and structured enough to turn each attempt into measurable improvement.

## Why It Is Needed

Interview performance is more than knowing the right fact. Candidates must explain decisions clearly, connect their experience to a role, handle follow-up questions, defend trade-offs, and recover when an answer is incomplete.

InterviewAI makes that practice available on demand:

1. The candidate brings the same resume and job description they are using in their search.
2. The interviewer asks questions grounded in those materials and the selected role.
3. The candidate answers aloud, which exposes clarity, structure, confidence, and depth that written practice can hide.
4. The next question responds to the quality and specificity of the previous answer.
5. The report connects strengths and improvements to observed interview evidence instead of presenting an unexplained number.

The goal is not to predict whether someone will get hired. The goal is to give candidates a self-directed, repeatable rehearsal environment that helps them become better interviewers of their own experience.

## What InterviewAI Does

### Personalized Setup

Candidates can upload a PDF resume, enter their name and target role, and paste the job description. The application uses those inputs as grounding material throughout the session.

### Voice-First Practice

The browser uses local Silero voice activity detection to capture natural utterances. Candidates speak instead of typing, hear the interviewer respond, and see a live transcript.

### Adaptive Interviewing

Each session keeps compact interview state and evidence memory. The system tracks the interview phase, question number, topics covered, difficulty, important claims, strong areas, weak areas, uncertainties, and candidate-specific evidence.

### Evidence-Based Review

The final report includes an overall score, strengths, improvements, competency scores, confidence, and supporting evidence. Candidate facts are grounded in the supplied resume and the interview transcript rather than invented by the model.

## How We Are Different

InterviewAI sits between static preparation, human mock interviews, AI practice tools, and live interview assistance. The distinction is the complete preparation loop rather than one isolated feature.

| Dimension | InterviewAI | Typical alternative |
| --- | --- | --- |
| Starting point | The candidate's resume, target role, and optional job description | A fixed question bank, a generic role, or a manually prepared prompt |
| Interview behavior | Adaptive follow-ups based on the answer, topic, difficulty, and stored evidence | Fixed questions or broad role-based practice |
| Practice format | Spoken, self-serve, repeatable sessions in the browser | Text-only practice, scheduled peers, or scheduled mentors |
| Feedback | A report tied to observed answer evidence and competency signals | A score, general advice, or feedback that depends on another person |
| Product purpose | Build independent interview ability through rehearsal and reflection | Match with a peer, coach a live session, or provide private assistance during an interview |
| Candidate experience | Bring your own materials and start immediately | Search for a partner, schedule a session, or configure a separate workspace |

This is a positioning difference, not a claim that other products lack useful features:

- [Huru](https://huru.ai/) focuses on AI-powered video interview practice, job-specific questions, and feedback on answers, body language, and vocal delivery.
- [interviewing.io](https://interviewing.io/) combines AI interviewing with anonymous technical interviews and mentor sessions.
- [Pramp / Exponent Practice](https://www.pramp.com/) emphasizes live peer-to-peer practice, matching, scheduling, and collaborative interview environments.
- [Final Round AI](https://www.finalroundai.com/) focuses on interview assistance and private, real-time answer guidance, in addition to preparation tools.

InterviewAI's intended wedge is candidate-owned preparation: use the exact materials for the role, practice aloud whenever needed, receive adaptive probing, and understand the evidence behind the debrief. It is not designed to covertly answer a real interview on the candidate's behalf.

## Product Workflow

### 1. Prepare

Upload a resume or start without one. Add the target role and paste the job description when role-specific preparation is needed.

### 2. Practice

The browser opens a persistent WebSocket session. The candidate speaks, the system transcribes the utterance, and the AI interviewer responds with a concise question or follow-up.

### 3. Review

End the session to generate a structured report. Review what was strong, what was unclear, which competencies were demonstrated, and which topics deserve another practice round.

## Technical Architecture

The repository contains two applications:

- `frontend`: Next.js 14 client with local Silero VAD, WebSocket audio transport, transcript UI, setup screens, and reports.
- `backend`: FastAPI service coordinating transcription, NVIDIA language generation, Edge TTS, MongoDB persistence, adaptive state, and report generation.

### Live Interview Pipeline

1. Silero VAD runs locally in the browser and detects the end of a candidate utterance.
2. The browser encodes the captured audio as 16 kHz mono PCM WAV.
3. The audio is sent over the persistent interview WebSocket.
4. Groq Whisper `whisper-large-v3-turbo` transcribes the completed utterance. Groq is used for speech-to-text only.
5. The backend persists the candidate transcript and builds a bounded live prompt from the candidate, resume, job description, state, memory, and recent conversation.
6. NVIDIA `nvidia/nemotron-3.5-lightning-30b-a3b` streams the interviewer response with live reasoning disabled.
7. Each sentence is displayed immediately and sent to TTS concurrently.
8. The browser queues audio using monotonic sequence numbers, so out-of-order TTS completion cannot reorder playback.
9. Candidate answer analysis waits for an idle window and is canceled when a new utterance arrives, keeping analysis off the live response path.

### Provider Responsibilities

- NVIDIA API Catalog: all language generation, adaptive interviewer responses, answer analysis, and reports.
- Groq Whisper: speech-to-text only.
- Microsoft Edge TTS: spoken playback.
- MongoDB: sessions, transcripts, evaluations, interview state, and evidence memory.

The live pipeline is optimized for fast perceived response, but it is not literally zero-latency. The current Whisper request begins after an utterance ends, and the first TTS sentence still needs to be synthesized. True full-duplex interaction would require a continuous streaming ASR/TTS transport.

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

Configure `backend/.env`:

```env
MONGODB_URI="mongodb+srv://<user>:<password>@<cluster>/<database>"
MONGODB_DB_NAME="interviewai"
GROQ_API_KEY="your_groq_key"
NVIDIA_API_KEY="your_nvidia_api_catalog_key"
CORS_ORIGINS="http://localhost:3000"
```

Optional NVIDIA settings:

```env
NVIDIA_REALTIME_MODEL="nvidia/nemotron-3.5-lightning-30b-a3b"
NVIDIA_ANALYSIS_MODEL="nvidia/nemotron-3-super-120b-a12b"
NVIDIA_REALTIME_THINKING="false"
NVIDIA_ANALYSIS_THINKING="true"
NVIDIA_REALTIME_TIMEOUT="15"
NVIDIA_ANALYSIS_TIMEOUT="45"
```

NVIDIA free endpoints and Groq free access are quota-limited development services. They are not unlimited production capacity. Review the current provider limits and terms before deployment.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend defaults to:

- REST API: `http://127.0.0.1:8000`
- WebSocket: `ws://127.0.0.1:8000`

For deployment, set:

```env
NEXT_PUBLIC_API_URL="https://your-backend.example.com"
NEXT_PUBLIC_WS_URL="wss://your-backend.example.com"
```

## Routes

- `/`: landing page and direct practice interview CTA.
- `/upload`: optional PDF resume upload and extraction.
- `/setup`: candidate name, target role, and optional job description.
- `/interview/[id]`: live voice interview.
- `/report/[id]`: evidence-based interview report.

Backend endpoints:

- `POST /api/resume/upload`
- `POST /api/interview/start`
- `GET /api/interview/{session_id}`
- `GET /api/report/{session_id}`
- `WS /ws/interview/{session_id}`

## Latency And Reliability Guardrails

The live path includes protections for common sources of lag and audio corruption:

- Warm NVIDIA clients are reused instead of opening a new HTTP connection for every generation.
- Live resume and job-description payloads are clipped, and only recent conversation is included.
- Live generation streams with reasoning disabled.
- TTS starts at the first sentence instead of waiting for the full answer.
- TTS sentences run concurrently but are played back in sequence order.
- Live turns are serialized so concurrent model responses cannot interleave.
- Audio sequence numbers remain monotonic for the full WebSocket session.
- TTS failures release their sequence so later audio cannot wait forever.
- Background answer analysis is delayed and cancelable.
- VAD does not upload new utterances while the interviewer is thinking or speaking.
- Independent database reads are performed concurrently where they are on the live path.

The first browser visit may spend time downloading local VAD/WebAssembly assets. That startup cost is not repeated for every answer.

## Verification

Run the backend suite:

```bash
cd backend
./venv/bin/pytest -q
python -m compileall -q app tests
```

Run frontend checks:

```bash
cd frontend
npx tsc --noEmit
npm run lint
npm run build
```

The tests cover API routes, session persistence, structured context, provider selection, NVIDIA request construction, Whisper behavior, TTS behavior, sentence splitting, WebSocket orchestration, ordered audio sequencing, TTS failure recovery, and cancellation of background analysis.

Live provider latency is environment-dependent and must be measured with valid provider keys, a running MongoDB instance, and the deployed network topology. Automated tests use provider mocks so they do not consume quotas or hide failures behind external services.

## Deployment And Security

The frontend can be deployed to Vercel and the backend to Render or another ASGI host. The backend host must provide:

- A Python 3.12-compatible runtime.
- MongoDB network access.
- NVIDIA and Groq environment variables.
- WebSocket support.
- CORS configured for the deployed frontend origin.

Resume text, transcripts, and interview evidence are sent through the configured application and AI providers. Add authentication, authorization, encryption, retention controls, and a privacy policy before using sensitive candidate data in production.

Never commit `.env` files or provider keys. Rotate any key exposed outside the intended secret store.

## Product Boundaries

InterviewAI is a practice and feedback tool. It does not make hiring decisions, guarantee an offer, verify every candidate claim, or replace professional coaching. AI feedback can be incomplete or incorrect; candidates should treat the report as a coaching signal and review the underlying transcript.
