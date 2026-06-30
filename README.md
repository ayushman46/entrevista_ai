# InterviewAI technical screening platform

InterviewAI is an enterprise grade autonomous technical screening platform designed to replace the time consuming initial phone screen. By utilizing adaptive voice artificial intelligence and context aware resume matching, the system conducts realistic verbal mock assessments and delivers deep candidate diagnostic reports to reduce recruiter overhead and save engineering hours.

---

## Value proposition for recruiting and engineering teams

- Save engineering screening time
Eliminate the need for senior engineers to conduct basic technical screening rounds. Let InterviewAI identify candidate capabilities before you schedule a live loop.

- Real time voice stream
Candidates speak directly in the web browser. Low latency WebSocket connections stream audio chunks dynamically to the backend for sub second speech processing.

- High fidelity assessment
Grade candidates fairly and objectively. Assessments evaluate technical accuracy, communication clarity, and candidate confidence, helping recruiters identify top tier talent.

- Actionable diagnostics
Receive detailed PDF assessment reports including overall performance scores, key strengths, areas for improvement, and role specific hiring recommendations.

---

## Technical stack and capabilities

- Frontend
Next.js 14 App Router, TypeScript, and Zustand for state management. Provides a conversational chat interface with real time web speech transcription.

- Backend
FastAPI Python application server providing concurrent WebSocket connections and local session storage using SQLAlchemy and SQLite.

- Artificial intelligence orchestrator
Integrates Groq Whisper for speech to text transcription. Routes evaluations and question generation through a fallback chain prioritizing Groq, followed by DeepSeek, and Google Gemini as fallbacks.

- Voice synthesis
Uses Edge TTS to generate natural, human like voice questions with high quality neural models, creating a stress free conversational mock assessment.

- PDF report generator
Generates standard multi page executive summary sheets with ReportLab containing candidate data, timelines, and hiring recommendations.

---

## Local setup and deployment

To set up the platform locally:

1. Clone the repository and navigate to the project directory:
   cd AI_interview

2. Start the backend:
   cd interviewai-backend
   pip install -r requirements.txt
   uvicorn app.main:app --reload

3. Start the frontend:
   cd ../interviewai-frontend
   npm install
   npm run dev

4. Run tests:
   cd ../interviewai-backend
   PYTHONPATH=. ./venv/bin/pytest
