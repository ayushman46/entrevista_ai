# AI Mock Interview Platform — Complete Build Prompt for Gemini CLI
# ============================================================
# USAGE: gemini < GEMINI_CLI_PROMPT.md
# Or paste this into Gemini CLI / Google AI Studio as a system prompt + user prompt.
# ============================================================

You are a senior full-stack engineer. Build a complete, production-inspired AI-powered voice mock interview platform called **InterviewAI**. Follow every instruction exactly. Do not skip any file. Do not summarize — write the full file contents.

---

## TECH STACK (100% FREE)

| Layer          | Tool                          | Why Free               |
|----------------|-------------------------------|------------------------|
| LLM Primary    | Gemini 1.5 Flash              | Google free tier       |
| LLM Fallback 1 | Groq (Llama 3 70B)            | Groq free tier         |
| LLM Fallback 2 | DeepSeek Chat                 | DeepSeek free API      |
| STT            | Browser SpeechRecognition API | Native browser, free   |
| TTS            | Browser SpeechSynthesis API   | Native browser, free   |
| Frontend       | Next.js + Tailwind CSS        | Vercel free tier       |
| Backend        | FastAPI + Uvicorn             | Render free tier       |
| PDF Reports    | ReportLab                     | Open source            |
| Session Store  | JSON files on disk            | No DB needed           |
| Resume Parse   | PyPDF2 + python-docx          | Open source            |

---

## PROJECT STRUCTURE

Generate TWO projects:

```
interviewai-backend/      ← FastAPI
interviewai-frontend/     ← Next.js
```

---

# ============================================================
# PART 1 — FASTAPI BACKEND
# ============================================================

## Directory Structure

```
interviewai-backend/
├── app/
│   ├── __init__.py
│   ├── main.py
│   ├── config.py
│   ├── api/
│   │   ├── __init__.py
│   │   ├── resume.py
│   │   ├── interview.py
│   │   └── report.py
│   ├── schemas/
│   │   ├── __init__.py
│   │   ├── resume.py
│   │   ├── interview.py
│   │   └── report.py
│   ├── services/
│   │   ├── __init__.py
│   │   ├── resume_parser.py
│   │   ├── interview_planner.py
│   │   ├── interview_engine.py
│   │   ├── evaluation_engine.py
│   │   ├── session_manager.py
│   │   ├── report_generator.py
│   │   └── analytics_service.py
│   ├── llm/
│   │   ├── __init__.py
│   │   ├── base.py
│   │   ├── gemini_provider.py
│   │   ├── groq_provider.py
│   │   ├── deepseek_provider.py
│   │   └── orchestrator.py
│   ├── prompts/
│   │   ├── __init__.py
│   │   ├── resume_analysis.py
│   │   ├── question_generation.py
│   │   ├── answer_evaluation.py
│   │   ├── final_evaluation.py
│   │   └── report_summary.py
│   └── utils/
│       ├── __init__.py
│       ├── file_utils.py
│       └── validators.py
├── sessions/
├── uploads/
├── reports/
├── requirements.txt
├── .env.example
├── render.yaml
└── README.md
```

---

## FILE: `requirements.txt`

```
fastapi==0.111.0
uvicorn[standard]==0.29.0
pydantic==2.7.1
python-multipart==0.0.9
PyPDF2==3.0.1
python-docx==1.1.2
reportlab==4.2.0
google-generativeai==0.5.4
groq==0.9.0
openai==1.30.1
httpx==0.27.0
python-dotenv==1.0.1
aiofiles==23.2.1
```

---

## FILE: `.env.example`

```
GEMINI_API_KEY=your_gemini_api_key_here
GROQ_API_KEY=your_groq_api_key_here
DEEPSEEK_API_KEY=your_deepseek_api_key_here
MAX_FILE_SIZE_MB=5
SESSION_DIR=sessions
UPLOAD_DIR=uploads
REPORT_DIR=reports
CORS_ORIGINS=http://localhost:3000,https://your-vercel-app.vercel.app
```

---

## FILE: `app/config.py`

```python
import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
    DEEPSEEK_API_KEY: str = os.getenv("DEEPSEEK_API_KEY", "")
    MAX_FILE_SIZE_MB: int = int(os.getenv("MAX_FILE_SIZE_MB", "5"))
    SESSION_DIR: str = os.getenv("SESSION_DIR", "sessions")
    UPLOAD_DIR: str = os.getenv("UPLOAD_DIR", "uploads")
    REPORT_DIR: str = os.getenv("REPORT_DIR", "reports")
    CORS_ORIGINS: list = os.getenv(
        "CORS_ORIGINS",
        "http://localhost:3000"
    ).split(",")

settings = Settings()

# Create directories on startup
for d in [settings.SESSION_DIR, settings.UPLOAD_DIR, settings.REPORT_DIR]:
    os.makedirs(d, exist_ok=True)
```

---

## FILE: `app/main.py`

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.config import settings
from app.api import resume, interview, report

app = FastAPI(
    title="InterviewAI",
    description="AI-powered voice mock interview platform",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(resume.router, prefix="/resume", tags=["Resume"])
app.include_router(interview.router, prefix="/interview", tags=["Interview"])
app.include_router(report.router, prefix="/report", tags=["Report"])

# Serve generated reports as static files
app.mount("/reports", StaticFiles(directory=settings.REPORT_DIR), name="reports")

@app.get("/health")
async def health():
    return {"status": "ok", "service": "InterviewAI Backend"}
```

---

## FILE: `app/schemas/resume.py`

```python
from pydantic import BaseModel
from typing import List, Optional

class ResumeData(BaseModel):
    name: str = ""
    email: str = ""
    phone: str = ""
    skills: List[str] = []
    technologies: List[str] = []
    projects: List[dict] = []
    experience: List[dict] = []
    education: List[dict] = []
    certifications: List[str] = []
    achievements: List[str] = []
    summary: str = ""

class ResumeUploadResponse(BaseModel):
    resume_id: str
    resume_data: ResumeData
    interview_topics: List[str]
    message: str
```

---

## FILE: `app/schemas/interview.py`

```python
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from enum import Enum

class RoleType(str, Enum):
    SDE_INTERN = "sde_intern"
    FRONTEND = "frontend_developer"
    BACKEND = "backend_developer"
    FULLSTACK = "fullstack_developer"
    DATA_ANALYST = "data_analyst"

class DifficultyLevel(str, Enum):
    EASY = "easy"
    MEDIUM = "medium"
    HARD = "hard"

class InterviewStartRequest(BaseModel):
    resume_id: str
    role: RoleType
    candidate_name: str = ""

class AnswerSubmitRequest(BaseModel):
    interview_id: str
    question_index: int
    answer_text: str
    time_taken_seconds: Optional[int] = None

class EvaluationResult(BaseModel):
    technical_score: int  # 1-10
    communication_score: int  # 1-10
    confidence_score: int  # 1-10
    answer_quality: str  # "Excellent" | "Good" | "Fair" | "Poor"
    missing_concepts: List[str]
    follow_up_required: bool
    difficulty_change: str  # "increase" | "maintain" | "decrease"
    topic: str
    next_question: str
    feedback: str

class InterviewState(BaseModel):
    interview_id: str
    resume_id: str
    candidate_name: str
    role: str
    status: str  # "active" | "paused" | "completed"
    current_question_index: int
    questions: List[Dict[str, Any]]
    evaluations: List[Dict[str, Any]]
    interview_context: Dict[str, Any]
    created_at: str
    updated_at: str

class InterviewStartResponse(BaseModel):
    interview_id: str
    first_question: str
    topic: str
    difficulty: str
    total_planned_questions: int

class AnswerResponse(BaseModel):
    evaluation: EvaluationResult
    interview_complete: bool
    next_question: Optional[str]
    question_index: int
```

---

## FILE: `app/schemas/report.py`

```python
from pydantic import BaseModel
from typing import List, Dict, Optional

class TopicScore(BaseModel):
    topic: str
    score: int
    questions_asked: int
    assessment: str

class FinalReport(BaseModel):
    interview_id: str
    candidate_name: str
    role: str
    date: str
    overall_score: float
    technical_score: float
    communication_score: float
    confidence_score: float
    topic_scores: List[TopicScore]
    strengths: List[str]
    weaknesses: List[str]
    learning_roadmap: List[str]
    hiring_recommendation: str
    summary: str
    pdf_url: Optional[str] = None
```

---

## FILE: `app/llm/base.py`

```python
from abc import ABC, abstractmethod
from typing import Optional

class BaseLLMProvider(ABC):
    """Abstract base class for all LLM providers."""

    @abstractmethod
    async def generate(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        max_tokens: int = 1000,
        temperature: float = 0.7,
    ) -> str:
        pass

    @abstractmethod
    def is_available(self) -> bool:
        pass
```

---

## FILE: `app/llm/gemini_provider.py`

```python
import google.generativeai as genai
from app.llm.base import BaseLLMProvider
from app.config import settings
from typing import Optional

class GeminiProvider(BaseLLMProvider):
    def __init__(self):
        if settings.GEMINI_API_KEY:
            genai.configure(api_key=settings.GEMINI_API_KEY)
            self.model = genai.GenerativeModel("gemini-1.5-flash")
        else:
            self.model = None

    def is_available(self) -> bool:
        return self.model is not None and bool(settings.GEMINI_API_KEY)

    async def generate(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        max_tokens: int = 1000,
        temperature: float = 0.7,
    ) -> str:
        if not self.is_available():
            raise RuntimeError("Gemini not configured")

        full_prompt = f"{system_prompt}\n\n{prompt}" if system_prompt else prompt

        generation_config = genai.types.GenerationConfig(
            max_output_tokens=max_tokens,
            temperature=temperature,
        )

        response = await self.model.generate_content_async(
            full_prompt,
            generation_config=generation_config,
        )
        return response.text
```

---

## FILE: `app/llm/groq_provider.py`

```python
from groq import AsyncGroq
from app.llm.base import BaseLLMProvider
from app.config import settings
from typing import Optional

class GroqProvider(BaseLLMProvider):
    def __init__(self):
        if settings.GROQ_API_KEY:
            self.client = AsyncGroq(api_key=settings.GROQ_API_KEY)
        else:
            self.client = None

    def is_available(self) -> bool:
        return self.client is not None and bool(settings.GROQ_API_KEY)

    async def generate(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        max_tokens: int = 1000,
        temperature: float = 0.7,
    ) -> str:
        if not self.is_available():
            raise RuntimeError("Groq not configured")

        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})

        response = await self.client.chat.completions.create(
            model="llama3-70b-8192",
            messages=messages,
            max_tokens=max_tokens,
            temperature=temperature,
        )
        return response.choices[0].message.content
```

---

## FILE: `app/llm/deepseek_provider.py`

```python
from openai import AsyncOpenAI
from app.llm.base import BaseLLMProvider
from app.config import settings
from typing import Optional

class DeepSeekProvider(BaseLLMProvider):
    def __init__(self):
        if settings.DEEPSEEK_API_KEY:
            self.client = AsyncOpenAI(
                api_key=settings.DEEPSEEK_API_KEY,
                base_url="https://api.deepseek.com/v1",
            )
        else:
            self.client = None

    def is_available(self) -> bool:
        return self.client is not None and bool(settings.DEEPSEEK_API_KEY)

    async def generate(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        max_tokens: int = 1000,
        temperature: float = 0.7,
    ) -> str:
        if not self.is_available():
            raise RuntimeError("DeepSeek not configured")

        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})

        response = await self.client.chat.completions.create(
            model="deepseek-chat",
            messages=messages,
            max_tokens=max_tokens,
            temperature=temperature,
        )
        return response.choices[0].message.content
```

---

## FILE: `app/llm/orchestrator.py`

```python
import logging
from typing import Optional
from app.llm.gemini_provider import GeminiProvider
from app.llm.groq_provider import GroqProvider
from app.llm.deepseek_provider import DeepSeekProvider

logger = logging.getLogger(__name__)

class LLMOrchestrator:
    """
    Routes LLM calls through a fallback chain:
    Gemini Flash → Groq (Llama 3) → DeepSeek Chat
    """

    def __init__(self):
        self.providers = [
            ("gemini", GeminiProvider()),
            ("groq", GroqProvider()),
            ("deepseek", DeepSeekProvider()),
        ]

    async def generate(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        max_tokens: int = 1000,
        temperature: float = 0.7,
    ) -> str:
        last_error = None

        for name, provider in self.providers:
            if not provider.is_available():
                logger.info(f"Provider {name} not configured, skipping.")
                continue

            try:
                logger.info(f"Attempting generation with provider: {name}")
                result = await provider.generate(
                    prompt=prompt,
                    system_prompt=system_prompt,
                    max_tokens=max_tokens,
                    temperature=temperature,
                )
                logger.info(f"Successfully generated with {name}")
                return result

            except Exception as e:
                logger.warning(f"Provider {name} failed: {str(e)}")
                last_error = e
                continue

        raise RuntimeError(
            f"All LLM providers failed. Last error: {last_error}"
        )

# Singleton instance
llm = LLMOrchestrator()
```

---

## FILE: `app/prompts/resume_analysis.py`

```python
RESUME_ANALYSIS_SYSTEM = """You are an expert technical recruiter and resume analyst.
Extract structured information from resumes and identify the most important technical
skills and experiences. Always respond in valid JSON only."""

def get_resume_analysis_prompt(resume_text: str) -> str:
    return f"""Analyze this resume and extract structured information.

RESUME TEXT:
{resume_text}

Respond ONLY with valid JSON in this exact format:
{{
  "name": "candidate full name",
  "email": "email if present",
  "phone": "phone if present",
  "skills": ["skill1", "skill2"],
  "technologies": ["tech1", "tech2"],
  "projects": [
    {{
      "name": "project name",
      "description": "brief description",
      "tech_stack": ["tech1", "tech2"]
    }}
  ],
  "experience": [
    {{
      "company": "company name",
      "role": "job title",
      "duration": "time period",
      "key_points": ["point1", "point2"]
    }}
  ],
  "education": [
    {{
      "degree": "degree type",
      "institution": "university name",
      "year": "graduation year"
    }}
  ],
  "certifications": ["cert1", "cert2"],
  "achievements": ["achievement1", "achievement2"],
  "summary": "2-3 sentence professional summary of this candidate"
}}"""


def get_interview_plan_prompt(resume_data: dict, role: str) -> str:
    return f"""Based on this candidate's resume and target role, create an interview plan.

CANDIDATE PROFILE:
- Skills: {', '.join(resume_data.get('skills', []))}
- Technologies: {', '.join(resume_data.get('technologies', []))}
- Experience: {len(resume_data.get('experience', []))} positions
- Projects: {len(resume_data.get('projects', []))} projects

TARGET ROLE: {role}

Create an interview plan. Respond ONLY with valid JSON:
{{
  "topics": ["topic1", "topic2", "topic3", "topic4", "topic5"],
  "difficulty": "easy|medium|hard",
  "estimated_questions": 12,
  "focus_areas": ["area1", "area2"],
  "opening_question_topic": "which topic to start with"
}}"""
```

---

## FILE: `app/prompts/question_generation.py`

```python
def get_first_question_prompt(
    resume_summary: str,
    role: str,
    topics: list,
    difficulty: str,
    opening_topic: str,
) -> str:
    return f"""You are a professional technical interviewer conducting a mock interview.

CANDIDATE RESUME SUMMARY: {resume_summary}
TARGET ROLE: {role}
INTERVIEW TOPICS: {', '.join(topics)}
DIFFICULTY: {difficulty}
START TOPIC: {opening_topic}

Generate the opening interview question. Be conversational and professional.
Respond ONLY with valid JSON:
{{
  "question": "your interview question here",
  "topic": "{opening_topic}",
  "difficulty": "{difficulty}",
  "expected_concepts": ["concept1", "concept2", "concept3"]
}}"""


def get_next_question_prompt(context: dict) -> str:
    return f"""You are a professional technical interviewer.

INTERVIEW CONTEXT:
- Candidate: {context.get('candidate_name', 'Candidate')}
- Role: {context.get('role')}
- Resume summary: {context.get('resume_summary', '')}
- Topics covered so far: {', '.join(context.get('topics_covered', []))}
- Strong topics: {', '.join(context.get('strong_topics', []))}
- Weak topics: {', '.join(context.get('weak_topics', []))}
- Current difficulty: {context.get('current_difficulty', 'medium')}
- Remaining topics to cover: {', '.join(context.get('remaining_topics', []))}
- Last question asked: {context.get('last_question', '')}

Generate the next interview question. Choose a topic NOT yet covered thoroughly.
If there are weak topics, consider a follow-up question on those.
Respond ONLY with valid JSON:
{{
  "question": "your next interview question",
  "topic": "topic being tested",
  "difficulty": "easy|medium|hard",
  "expected_concepts": ["concept1", "concept2"],
  "question_type": "technical|behavioral|project-based|system-design"
}}"""
```

---

## FILE: `app/prompts/answer_evaluation.py`

```python
def get_evaluation_prompt(
    question: str,
    answer: str,
    expected_concepts: list,
    topic: str,
    role: str,
    current_difficulty: str,
) -> str:
    return f"""You are an expert technical interviewer evaluating a candidate's answer.

ROLE BEING INTERVIEWED FOR: {role}
TOPIC: {topic}
CURRENT DIFFICULTY: {current_difficulty}

QUESTION ASKED:
{question}

EXPECTED CONCEPTS TO COVER:
{', '.join(expected_concepts)}

CANDIDATE'S ANSWER:
{answer}

Evaluate this answer rigorously and fairly. Consider:
1. Technical correctness and accuracy
2. Completeness - did they cover the key concepts?
3. Communication clarity and structure
4. Practical understanding vs rote memorization
5. Confidence level inferred from the answer

Respond ONLY with valid JSON:
{{
  "technical_score": 7,
  "communication_score": 6,
  "confidence_score": 7,
  "answer_quality": "Good",
  "missing_concepts": ["concept not mentioned", "another gap"],
  "what_they_got_right": ["correct point 1", "correct point 2"],
  "follow_up_required": true,
  "follow_up_reason": "why follow-up is needed",
  "difficulty_change": "increase|maintain|decrease",
  "topic": "{topic}",
  "next_question": "if follow_up_required is true, write the follow-up question here, else write empty string",
  "feedback": "2-3 sentence constructive feedback on their answer"
}}

Scoring guide:
- 9-10: Exceptional, complete answer covering all concepts
- 7-8: Good answer with minor gaps
- 5-6: Adequate but missing important points
- 3-4: Significant gaps, major concepts missing
- 1-2: Very poor, mostly incorrect or irrelevant"""
```

---

## FILE: `app/prompts/final_evaluation.py`

```python
def get_final_evaluation_prompt(
    candidate_name: str,
    role: str,
    resume_summary: str,
    all_evaluations: list,
    questions_and_answers: list,
) -> str:
    qa_text = "\n".join([
        f"Q{i+1}: {qa['question']}\nA: {qa['answer']}\nScore: {qa.get('score', 'N/A')}/10"
        for i, qa in enumerate(questions_and_answers)
    ])

    avg_technical = sum(e.get('technical_score', 0) for e in all_evaluations) / max(len(all_evaluations), 1)
    avg_communication = sum(e.get('communication_score', 0) for e in all_evaluations) / max(len(all_evaluations), 1)
    avg_confidence = sum(e.get('confidence_score', 0) for e in all_evaluations) / max(len(all_evaluations), 1)

    return f"""You are a senior technical hiring manager writing a comprehensive interview assessment.

CANDIDATE: {candidate_name}
TARGET ROLE: {role}
RESUME SUMMARY: {resume_summary}

AGGREGATE SCORES:
- Average Technical Score: {avg_technical:.1f}/10
- Average Communication Score: {avg_communication:.1f}/10
- Average Confidence Score: {avg_confidence:.1f}/10

INTERVIEW TRANSCRIPT:
{qa_text}

Write a comprehensive final evaluation. Respond ONLY with valid JSON:
{{
  "overall_score": 7.2,
  "technical_score": 7.0,
  "communication_score": 6.8,
  "confidence_score": 7.5,
  "topic_scores": [
    {{
      "topic": "Python",
      "score": 8,
      "questions_asked": 3,
      "assessment": "Strong fundamentals, good with async concepts"
    }}
  ],
  "strengths": [
    "strength 1",
    "strength 2",
    "strength 3"
  ],
  "weaknesses": [
    "weakness 1",
    "weakness 2"
  ],
  "learning_roadmap": [
    "Study X to improve in Y",
    "Practice Z by doing A"
  ],
  "hiring_recommendation": "Strong Hire|Hire|Maybe|No Hire",
  "hiring_justification": "2-3 sentence justification for the recommendation",
  "summary": "3-4 sentence executive summary of this candidate"
}}"""
```

---

## FILE: `app/services/resume_parser.py`

```python
import io
import json
import logging
from typing import Optional
import PyPDF2
import docx
from app.llm.orchestrator import llm
from app.prompts.resume_analysis import (
    RESUME_ANALYSIS_SYSTEM,
    get_resume_analysis_prompt,
    get_interview_plan_prompt,
)
from app.schemas.resume import ResumeData

logger = logging.getLogger(__name__)


def extract_text_from_pdf(file_bytes: bytes) -> str:
    reader = PyPDF2.PdfReader(io.BytesIO(file_bytes))
    text = ""
    for page in reader.pages:
        text += page.extract_text() + "\n"
    return text.strip()


def extract_text_from_docx(file_bytes: bytes) -> str:
    doc = docx.Document(io.BytesIO(file_bytes))
    text = "\n".join([para.text for para in doc.paragraphs])
    return text.strip()


def extract_text(file_bytes: bytes, filename: str) -> str:
    ext = filename.lower().split(".")[-1]
    if ext == "pdf":
        return extract_text_from_pdf(file_bytes)
    elif ext in ("docx", "doc"):
        return extract_text_from_docx(file_bytes)
    else:
        raise ValueError(f"Unsupported file type: {ext}")


async def parse_resume(file_bytes: bytes, filename: str) -> dict:
    """Extract text and parse resume with LLM."""
    raw_text = extract_text(file_bytes, filename)

    if not raw_text or len(raw_text) < 50:
        raise ValueError("Could not extract meaningful text from resume")

    # Truncate to avoid token limits (keep first 4000 chars)
    truncated = raw_text[:4000]

    prompt = get_resume_analysis_prompt(truncated)
    response = await llm.generate(
        prompt=prompt,
        system_prompt=RESUME_ANALYSIS_SYSTEM,
        max_tokens=1500,
        temperature=0.2,
    )

    # Clean JSON response (strip markdown fences if present)
    clean = response.strip()
    if clean.startswith("```"):
        clean = clean.split("\n", 1)[1]
        clean = clean.rsplit("```", 1)[0]

    parsed = json.loads(clean)
    return parsed


async def generate_interview_plan(resume_data: dict, role: str) -> dict:
    """Generate interview topics and plan based on resume."""
    prompt = get_interview_plan_prompt(resume_data, role)
    response = await llm.generate(
        prompt=prompt,
        max_tokens=500,
        temperature=0.3,
    )

    clean = response.strip()
    if clean.startswith("```"):
        clean = clean.split("\n", 1)[1]
        clean = clean.rsplit("```", 1)[0]

    return json.loads(clean)
```

---

## FILE: `app/services/session_manager.py`

```python
import json
import os
import uuid
from datetime import datetime
from typing import Optional
from app.config import settings


class SessionManager:
    """
    Lightweight JSON file-based session storage.
    Suitable for MVP on Render free tier.
    No database required.
    """

    def _path(self, interview_id: str) -> str:
        return os.path.join(settings.SESSION_DIR, f"{interview_id}.json")

    def create_session(self, resume_id: str, candidate_name: str, role: str, interview_plan: dict) -> dict:
        interview_id = str(uuid.uuid4())
        session = {
            "interview_id": interview_id,
            "resume_id": resume_id,
            "candidate_name": candidate_name,
            "role": role,
            "status": "active",
            "current_question_index": 0,
            "questions": [],
            "evaluations": [],
            "interview_context": {
                "candidate_name": candidate_name,
                "role": role,
                "resume_summary": "",
                "topics_covered": [],
                "strong_topics": [],
                "weak_topics": [],
                "remaining_topics": interview_plan.get("topics", []),
                "current_difficulty": interview_plan.get("difficulty", "medium"),
                "last_question": "",
                "total_planned": interview_plan.get("estimated_questions", 12),
            },
            "interview_plan": interview_plan,
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat(),
        }
        self._save(interview_id, session)
        return session

    def get_session(self, interview_id: str) -> Optional[dict]:
        path = self._path(interview_id)
        if not os.path.exists(path):
            return None
        with open(path, "r") as f:
            return json.load(f)

    def update_session(self, interview_id: str, updates: dict) -> dict:
        session = self.get_session(interview_id)
        if not session:
            raise ValueError(f"Session {interview_id} not found")
        session.update(updates)
        session["updated_at"] = datetime.utcnow().isoformat()
        self._save(interview_id, session)
        return session

    def add_question_answer(
        self,
        interview_id: str,
        question: str,
        answer: str,
        evaluation: dict,
        topic: str,
    ) -> dict:
        session = self.get_session(interview_id)
        if not session:
            raise ValueError(f"Session {interview_id} not found")

        session["questions"].append({
            "index": len(session["questions"]),
            "question": question,
            "answer": answer,
            "topic": topic,
            "timestamp": datetime.utcnow().isoformat(),
        })
        session["evaluations"].append(evaluation)
        session["current_question_index"] = len(session["questions"])

        # Update context for adaptive questioning
        ctx = session["interview_context"]
        if topic not in ctx["topics_covered"]:
            ctx["topics_covered"].append(topic)
        if topic in ctx["remaining_topics"]:
            ctx["remaining_topics"].remove(topic)

        tech_score = evaluation.get("technical_score", 5)
        if tech_score >= 7 and topic not in ctx["strong_topics"]:
            ctx["strong_topics"].append(topic)
        elif tech_score < 6 and topic not in ctx["weak_topics"]:
            ctx["weak_topics"].append(topic)

        # Adjust difficulty based on evaluation
        diff_change = evaluation.get("difficulty_change", "maintain")
        if diff_change == "increase" and ctx["current_difficulty"] != "hard":
            ctx["current_difficulty"] = "hard" if ctx["current_difficulty"] == "medium" else "medium"
        elif diff_change == "decrease" and ctx["current_difficulty"] != "easy":
            ctx["current_difficulty"] = "easy" if ctx["current_difficulty"] == "medium" else "medium"

        ctx["last_question"] = question
        session["updated_at"] = datetime.utcnow().isoformat()
        self._save(interview_id, session)
        return session

    def close_session(self, interview_id: str) -> dict:
        session = self.get_session(interview_id)
        if session:
            session["status"] = "completed"
            session["updated_at"] = datetime.utcnow().isoformat()
            self._save(interview_id, session)
        return session

    def _save(self, interview_id: str, session: dict):
        with open(self._path(interview_id), "w") as f:
            json.dump(session, f, indent=2)


session_manager = SessionManager()
```

---

## FILE: `app/services/interview_engine.py`

```python
import json
import logging
from app.llm.orchestrator import llm
from app.prompts.question_generation import get_first_question_prompt, get_next_question_prompt
from app.prompts.answer_evaluation import get_evaluation_prompt
from app.services.session_manager import session_manager

logger = logging.getLogger(__name__)

INTERVIEW_SYSTEM_PROMPT = """You are a professional senior software engineer conducting a technical mock interview.
You are evaluating candidates fairly and rigorously.
Always respond with valid JSON only. No markdown, no extra text."""

MAX_QUESTIONS = 15


async def start_interview(
    interview_id: str,
    resume_data: dict,
    role: str,
    candidate_name: str,
    interview_plan: dict,
) -> dict:
    """Generate the first question and initialize interview."""
    resume_summary = resume_data.get("summary", "")

    # Update session with resume summary
    session_manager.update_session(interview_id, {
        "interview_context": {
            **session_manager.get_session(interview_id)["interview_context"],
            "resume_summary": resume_summary,
        }
    })

    prompt = get_first_question_prompt(
        resume_summary=resume_summary,
        role=role,
        topics=interview_plan.get("topics", []),
        difficulty=interview_plan.get("difficulty", "medium"),
        opening_topic=interview_plan.get("opening_question_topic", interview_plan.get("topics", ["General"])[0]),
    )

    response = await llm.generate(
        prompt=prompt,
        system_prompt=INTERVIEW_SYSTEM_PROMPT,
        max_tokens=500,
        temperature=0.7,
    )

    clean = _clean_json(response)
    question_data = json.loads(clean)
    return question_data


async def evaluate_answer(
    interview_id: str,
    question: str,
    answer: str,
    expected_concepts: list,
    topic: str,
    role: str,
) -> dict:
    """Evaluate a candidate's answer and generate next question."""
    session = session_manager.get_session(interview_id)
    ctx = session["interview_context"]
    current_difficulty = ctx.get("current_difficulty", "medium")

    prompt = get_evaluation_prompt(
        question=question,
        answer=answer,
        expected_concepts=expected_concepts,
        topic=topic,
        role=role,
        current_difficulty=current_difficulty,
    )

    response = await llm.generate(
        prompt=prompt,
        system_prompt=INTERVIEW_SYSTEM_PROMPT,
        max_tokens=800,
        temperature=0.3,
    )

    clean = _clean_json(response)
    evaluation = json.loads(clean)

    # Update session
    session_manager.add_question_answer(
        interview_id=interview_id,
        question=question,
        answer=answer,
        evaluation=evaluation,
        topic=topic,
    )

    # Check if follow-up or new topic
    updated_session = session_manager.get_session(interview_id)
    question_count = len(updated_session["questions"])
    is_complete = question_count >= MAX_QUESTIONS

    if not is_complete and not evaluation.get("follow_up_required"):
        # Generate next question on a new topic
        next_q_data = await get_next_question(interview_id, role)
        evaluation["next_question"] = next_q_data.get("question", "")
        evaluation["next_topic"] = next_q_data.get("topic", "")
        evaluation["next_expected_concepts"] = next_q_data.get("expected_concepts", [])

    return evaluation, is_complete


async def get_next_question(interview_id: str, role: str) -> dict:
    """Generate the next adaptive question based on current interview context."""
    session = session_manager.get_session(interview_id)
    ctx = session["interview_context"]

    prompt = get_next_question_prompt(ctx)
    response = await llm.generate(
        prompt=prompt,
        system_prompt=INTERVIEW_SYSTEM_PROMPT,
        max_tokens=400,
        temperature=0.7,
    )

    clean = _clean_json(response)
    return json.loads(clean)


def _clean_json(response: str) -> str:
    clean = response.strip()
    if clean.startswith("```json"):
        clean = clean[7:]
    elif clean.startswith("```"):
        clean = clean[3:]
    if clean.endswith("```"):
        clean = clean[:-3]
    return clean.strip()
```

---

## FILE: `app/services/evaluation_engine.py`

```python
import json
import logging
from app.llm.orchestrator import llm
from app.prompts.final_evaluation import get_final_evaluation_prompt
from app.services.session_manager import session_manager

logger = logging.getLogger(__name__)

EVAL_SYSTEM = """You are a senior engineering hiring manager.
Write comprehensive, fair, and actionable candidate assessments.
Always respond with valid JSON only."""


async def generate_final_evaluation(interview_id: str) -> dict:
    """Generate the complete final evaluation report data."""
    session = session_manager.get_session(interview_id)
    if not session:
        raise ValueError(f"Session {interview_id} not found")

    questions_and_answers = []
    for i, q in enumerate(session["questions"]):
        eval_data = session["evaluations"][i] if i < len(session["evaluations"]) else {}
        questions_and_answers.append({
            "question": q["question"],
            "answer": q["answer"],
            "score": eval_data.get("technical_score", 0),
            "topic": q.get("topic", ""),
        })

    prompt = get_final_evaluation_prompt(
        candidate_name=session["candidate_name"],
        role=session["role"],
        resume_summary=session["interview_context"].get("resume_summary", ""),
        all_evaluations=session["evaluations"],
        questions_and_answers=questions_and_answers,
    )

    response = await llm.generate(
        prompt=prompt,
        system_prompt=EVAL_SYSTEM,
        max_tokens=1500,
        temperature=0.2,
    )

    clean = response.strip()
    if clean.startswith("```"):
        clean = clean.split("\n", 1)[1].rsplit("```", 1)[0]

    final_eval = json.loads(clean)

    # Close the session
    session_manager.close_session(interview_id)

    return final_eval
```

---

## FILE: `app/services/report_generator.py`

```python
import os
from datetime import datetime
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
)
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from app.config import settings


def generate_pdf_report(interview_id: str, report_data: dict, session: dict) -> str:
    """Generate a professional PDF interview report using ReportLab."""
    filename = f"report_{interview_id}.pdf"
    filepath = os.path.join(settings.REPORT_DIR, filename)

    doc = SimpleDocTemplate(
        filepath,
        pagesize=A4,
        rightMargin=0.75 * inch,
        leftMargin=0.75 * inch,
        topMargin=inch,
        bottomMargin=0.75 * inch,
    )

    styles = getSampleStyleSheet()
    story = []

    # Title
    title_style = ParagraphStyle(
        "Title", parent=styles["Title"],
        fontSize=24, textColor=colors.HexColor("#1a1a2e"),
        spaceAfter=6, alignment=TA_CENTER,
    )
    subtitle_style = ParagraphStyle(
        "Subtitle", parent=styles["Normal"],
        fontSize=12, textColor=colors.HexColor("#666"),
        alignment=TA_CENTER, spaceAfter=20,
    )
    heading_style = ParagraphStyle(
        "Heading", parent=styles["Heading2"],
        fontSize=14, textColor=colors.HexColor("#1a1a2e"),
        spaceBefore=16, spaceAfter=8, borderPad=4,
    )
    body_style = ParagraphStyle(
        "Body", parent=styles["Normal"],
        fontSize=10, leading=14, textColor=colors.HexColor("#333"),
    )
    bullet_style = ParagraphStyle(
        "Bullet", parent=styles["Normal"],
        fontSize=10, leading=14, textColor=colors.HexColor("#333"),
        leftIndent=16, bulletIndent=0,
    )

    # Header
    story.append(Paragraph("InterviewAI", title_style))
    story.append(Paragraph("Mock Interview Assessment Report", subtitle_style))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#4f46e5")))
    story.append(Spacer(1, 16))

    # Candidate Info
    story.append(Paragraph("Candidate Information", heading_style))
    info_data = [
        ["Candidate", report_data.get("candidate_name", "N/A")],
        ["Role Applied For", report_data.get("role", "N/A").replace("_", " ").title()],
        ["Interview Date", report_data.get("date", datetime.now().strftime("%B %d, %Y"))],
        ["Questions Answered", str(len(session.get("questions", [])))],
        ["Hiring Recommendation", report_data.get("hiring_recommendation", "N/A")],
    ]
    info_table = Table(info_data, colWidths=[2 * inch, 4.5 * inch])
    info_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (0, -1), colors.HexColor("#f1f0ff")),
        ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 10),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#ddd")),
        ("ROWBACKGROUNDS", (1, 0), (-1, -1), [colors.white, colors.HexColor("#fafafa")]),
        ("PADDING", (0, 0), (-1, -1), 8),
    ]))
    story.append(info_table)
    story.append(Spacer(1, 16))

    # Score Summary
    story.append(Paragraph("Performance Scores", heading_style))
    scores = [
        ["Category", "Score", "Rating"],
        ["Overall", f"{report_data.get('overall_score', 0):.1f}/10", _rating(report_data.get("overall_score", 0))],
        ["Technical", f"{report_data.get('technical_score', 0):.1f}/10", _rating(report_data.get("technical_score", 0))],
        ["Communication", f"{report_data.get('communication_score', 0):.1f}/10", _rating(report_data.get("communication_score", 0))],
        ["Confidence", f"{report_data.get('confidence_score', 0):.1f}/10", _rating(report_data.get("confidence_score", 0))],
    ]
    score_table = Table(scores, colWidths=[3 * inch, 1.5 * inch, 2 * inch])
    score_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#4f46e5")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 10),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#ddd")),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f9f9ff")]),
        ("PADDING", (0, 0), (-1, -1), 8),
        ("ALIGN", (1, 0), (2, -1), "CENTER"),
    ]))
    story.append(score_table)
    story.append(Spacer(1, 16))

    # Strengths
    story.append(Paragraph("Key Strengths", heading_style))
    for s in report_data.get("strengths", []):
        story.append(Paragraph(f"✓  {s}", bullet_style))
    story.append(Spacer(1, 10))

    # Weaknesses
    story.append(Paragraph("Areas for Improvement", heading_style))
    for w in report_data.get("weaknesses", []):
        story.append(Paragraph(f"•  {w}", bullet_style))
    story.append(Spacer(1, 10))

    # Learning Roadmap
    story.append(Paragraph("Recommended Learning Roadmap", heading_style))
    for i, item in enumerate(report_data.get("learning_roadmap", []), 1):
        story.append(Paragraph(f"{i}.  {item}", bullet_style))
    story.append(Spacer(1, 10))

    # Summary
    story.append(Paragraph("Evaluator Summary", heading_style))
    story.append(Paragraph(report_data.get("summary", ""), body_style))
    story.append(Spacer(1, 16))

    # Interview Transcript
    story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor("#ddd")))
    story.append(Paragraph("Interview Transcript", heading_style))
    for i, q in enumerate(session.get("questions", []), 1):
        story.append(Paragraph(f"<b>Q{i}: {q['question']}</b>", body_style))
        story.append(Spacer(1, 4))
        story.append(Paragraph(f"<i>Answer: {q.get('answer', 'No answer recorded')}</i>", body_style))
        story.append(Spacer(1, 12))

    # Footer
    story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor("#ddd")))
    story.append(Spacer(1, 8))
    story.append(Paragraph(
        f"Generated by InterviewAI · {datetime.now().strftime('%B %d, %Y at %H:%M UTC')}",
        ParagraphStyle("footer", parent=styles["Normal"], fontSize=8,
                       textColor=colors.HexColor("#999"), alignment=TA_CENTER)
    ))

    doc.build(story)
    return filename


def _rating(score: float) -> str:
    if score >= 8.5:
        return "Excellent"
    elif score >= 7:
        return "Good"
    elif score >= 5.5:
        return "Fair"
    else:
        return "Needs Work"
```

---

## FILE: `app/api/resume.py`

```python
import uuid
import os
import json
from fastapi import APIRouter, UploadFile, File, HTTPException
from app.config import settings
from app.services.resume_parser import parse_resume, generate_interview_plan
from app.schemas.resume import ResumeUploadResponse

router = APIRouter()
MAX_SIZE = settings.MAX_FILE_SIZE_MB * 1024 * 1024


@router.post("/upload", response_model=ResumeUploadResponse)
async def upload_resume(file: UploadFile = File(...)):
    # Validate file type
    if not file.filename.lower().endswith((".pdf", ".docx", ".doc")):
        raise HTTPException(400, "Only PDF and DOCX files are supported")

    # Read and validate size
    content = await file.read()
    if len(content) > MAX_SIZE:
        raise HTTPException(400, f"File too large. Max size: {settings.MAX_FILE_SIZE_MB}MB")

    try:
        # Parse resume with LLM
        resume_data = await parse_resume(content, file.filename)

        # Generate interview topics
        plan = await generate_interview_plan(resume_data, "general")

        # Save resume data
        resume_id = str(uuid.uuid4())
        resume_path = os.path.join(settings.UPLOAD_DIR, f"{resume_id}.json")
        with open(resume_path, "w") as f:
            json.dump({
                "resume_id": resume_id,
                "resume_data": resume_data,
                "interview_plan": plan,
                "filename": file.filename,
            }, f, indent=2)

        return ResumeUploadResponse(
            resume_id=resume_id,
            resume_data=resume_data,
            interview_topics=plan.get("topics", []),
            message="Resume parsed successfully",
        )

    except ValueError as e:
        raise HTTPException(422, str(e))
    except Exception as e:
        raise HTTPException(500, f"Resume processing failed: {str(e)}")
```

---

## FILE: `app/api/interview.py`

```python
import json
import os
from fastapi import APIRouter, HTTPException
from app.config import settings
from app.schemas.interview import (
    InterviewStartRequest, InterviewStartResponse,
    AnswerSubmitRequest, AnswerResponse,
)
from app.services.session_manager import session_manager
from app.services.interview_engine import start_interview, evaluate_answer
from app.services.evaluation_engine import generate_final_evaluation
from app.services.report_generator import generate_pdf_report

router = APIRouter()


def load_resume(resume_id: str) -> dict:
    path = os.path.join(settings.UPLOAD_DIR, f"{resume_id}.json")
    if not os.path.exists(path):
        raise HTTPException(404, f"Resume {resume_id} not found")
    with open(path) as f:
        return json.load(f)


@router.post("/start", response_model=InterviewStartResponse)
async def start_interview_session(request: InterviewStartRequest):
    resume_file = load_resume(request.resume_id)
    resume_data = resume_file["resume_data"]
    interview_plan = resume_file["interview_plan"]

    # Role-specific plan override
    role_plan = await _get_role_plan(interview_plan, request.role.value, resume_data)

    # Create session
    session = session_manager.create_session(
        resume_id=request.resume_id,
        candidate_name=request.candidate_name or resume_data.get("name", "Candidate"),
        role=request.role.value,
        interview_plan=role_plan,
    )

    # Generate first question
    first_q = await start_interview(
        interview_id=session["interview_id"],
        resume_data=resume_data,
        role=request.role.value,
        candidate_name=session["candidate_name"],
        interview_plan=role_plan,
    )

    return InterviewStartResponse(
        interview_id=session["interview_id"],
        first_question=first_q["question"],
        topic=first_q["topic"],
        difficulty=first_q.get("difficulty", role_plan.get("difficulty", "medium")),
        total_planned_questions=role_plan.get("estimated_questions", 12),
    )


@router.post("/answer", response_model=AnswerResponse)
async def submit_answer(request: AnswerSubmitRequest):
    session = session_manager.get_session(request.interview_id)
    if not session:
        raise HTTPException(404, "Interview session not found")
    if session["status"] == "completed":
        raise HTTPException(400, "Interview already completed")

    # Get the current question data
    questions = session.get("questions", [])
    if request.question_index >= 0 and request.question_index < len(questions):
        current_q = questions[request.question_index]
    else:
        # This should not happen but handle gracefully
        raise HTTPException(400, "Invalid question index")

    evaluation, is_complete = await evaluate_answer(
        interview_id=request.interview_id,
        question=current_q["question"],
        answer=request.answer_text,
        expected_concepts=current_q.get("expected_concepts", []),
        topic=current_q.get("topic", "General"),
        role=session["role"],
    )

    from app.schemas.interview import EvaluationResult
    eval_result = EvaluationResult(
        technical_score=evaluation.get("technical_score", 5),
        communication_score=evaluation.get("communication_score", 5),
        confidence_score=evaluation.get("confidence_score", 5),
        answer_quality=evaluation.get("answer_quality", "Fair"),
        missing_concepts=evaluation.get("missing_concepts", []),
        follow_up_required=evaluation.get("follow_up_required", False),
        difficulty_change=evaluation.get("difficulty_change", "maintain"),
        topic=evaluation.get("topic", ""),
        next_question=evaluation.get("next_question", ""),
        feedback=evaluation.get("feedback", ""),
    )

    return AnswerResponse(
        evaluation=eval_result,
        interview_complete=is_complete,
        next_question=evaluation.get("next_question") if not is_complete else None,
        question_index=len(session_manager.get_session(request.interview_id)["questions"]) - 1,
    )


@router.get("/{interview_id}")
async def get_interview(interview_id: str):
    session = session_manager.get_session(interview_id)
    if not session:
        raise HTTPException(404, "Interview not found")
    return session


@router.post("/complete/{interview_id}")
async def complete_interview(interview_id: str):
    """Trigger final evaluation and generate report."""
    session = session_manager.get_session(interview_id)
    if not session:
        raise HTTPException(404, "Interview not found")

    final_eval = await generate_final_evaluation(interview_id)

    # Re-fetch closed session
    closed_session = session_manager.get_session(interview_id)

    # Generate PDF
    pdf_filename = generate_pdf_report(
        interview_id=interview_id,
        report_data=final_eval,
        session=closed_session,
    )

    final_eval["pdf_url"] = f"/reports/{pdf_filename}"
    final_eval["interview_id"] = interview_id

    return final_eval


@router.post("/resume/{interview_id}")
async def resume_interview(interview_id: str):
    """Resume a paused/interrupted interview session."""
    session = session_manager.get_session(interview_id)
    if not session:
        raise HTTPException(404, "Interview not found")
    if session["status"] == "completed":
        raise HTTPException(400, "Cannot resume a completed interview")

    session_manager.update_session(interview_id, {"status": "active"})
    session = session_manager.get_session(interview_id)

    return {
        "interview_id": interview_id,
        "status": "active",
        "current_question_index": session["current_question_index"],
        "questions_asked": len(session["questions"]),
        "interview_context": session["interview_context"],
    }


async def _get_role_plan(base_plan: dict, role: str, resume_data: dict) -> dict:
    """Adjust interview plan based on selected role."""
    role_topics = {
        "frontend_developer": ["JavaScript", "React", "CSS", "Performance", "Accessibility"],
        "backend_developer": ["APIs", "Databases", "System Design", "Security", "Caching"],
        "fullstack_developer": ["React", "Node.js", "APIs", "Databases", "Deployment"],
        "sde_intern": ["Data Structures", "Algorithms", "OOP", "Git", "Problem Solving"],
        "data_analyst": ["SQL", "Python", "Statistics", "Data Visualization", "Excel/Pandas"],
    }

    # Merge role-specific topics with resume-extracted topics
    role_specific = role_topics.get(role, [])
    resume_skills = resume_data.get("skills", [])[:5]
    combined = list(dict.fromkeys(role_specific + resume_skills))

    return {
        **base_plan,
        "topics": combined[:8],
        "role": role,
    }
```

---

## FILE: `app/api/report.py`

```python
from fastapi import APIRouter, HTTPException
from app.services.session_manager import session_manager

router = APIRouter()


@router.get("/{interview_id}/analytics")
async def get_analytics(interview_id: str):
    session = session_manager.get_session(interview_id)
    if not session:
        raise HTTPException(404, "Interview not found")

    evaluations = session.get("evaluations", [])
    if not evaluations:
        return {"message": "No evaluations yet"}

    topic_performance = {}
    for i, q in enumerate(session.get("questions", [])):
        topic = q.get("topic", "General")
        if i < len(evaluations):
            ev = evaluations[i]
            if topic not in topic_performance:
                topic_performance[topic] = {"scores": [], "count": 0}
            topic_performance[topic]["scores"].append(ev.get("technical_score", 0))
            topic_performance[topic]["count"] += 1

    analytics = {
        "interview_id": interview_id,
        "status": session["status"],
        "questions_completed": len(session.get("questions", [])),
        "average_technical": round(
            sum(e.get("technical_score", 0) for e in evaluations) / max(len(evaluations), 1), 1
        ),
        "average_communication": round(
            sum(e.get("communication_score", 0) for e in evaluations) / max(len(evaluations), 1), 1
        ),
        "strong_topics": session["interview_context"].get("strong_topics", []),
        "weak_topics": session["interview_context"].get("weak_topics", []),
        "topic_performance": {
            t: {
                "avg_score": round(sum(d["scores"]) / max(d["count"], 1), 1),
                "questions": d["count"],
            }
            for t, d in topic_performance.items()
        },
        "difficulty_progression": [
            e.get("difficulty_change", "maintain") for e in evaluations
        ],
    }
    return analytics
```

---

## FILE: `render.yaml`

```yaml
services:
  - type: web
    name: interviewai-backend
    env: python
    buildCommand: pip install -r requirements.txt
    startCommand: uvicorn app.main:app --host 0.0.0.0 --port $PORT
    envVars:
      - key: GEMINI_API_KEY
        sync: false
      - key: GROQ_API_KEY
        sync: false
      - key: DEEPSEEK_API_KEY
        sync: false
      - key: CORS_ORIGINS
        sync: false
    disk:
      name: interviewai-data
      mountPath: /opt/render/project/src
      sizeGB: 1
```

---

# ============================================================
# PART 2 — NEXT.JS FRONTEND
# ============================================================

## Directory Structure

```
interviewai-frontend/
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   ├── upload/
│   │   └── page.tsx
│   ├── interview/
│   │   └── [id]/
│   │       └── page.tsx
│   └── report/
│       └── [id]/
│           └── page.tsx
├── components/
│   ├── ui/
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Badge.tsx
│   │   └── Progress.tsx
│   ├── ResumeUploader.tsx
│   ├── VoiceRecorder.tsx
│   ├── InterviewSession.tsx
│   ├── QuestionDisplay.tsx
│   ├── EvaluationCard.tsx
│   ├── ScoreCard.tsx
│   └── ReportViewer.tsx
├── hooks/
│   ├── useSpeechRecognition.ts
│   ├── useSpeechSynthesis.ts
│   └── useInterview.ts
├── services/
│   └── api.ts
├── store/
│   └── interviewStore.ts
├── types/
│   └── interview.ts
├── lib/
│   └── utils.ts
├── .env.local.example
├── tailwind.config.ts
├── tsconfig.json
├── package.json
└── next.config.ts
```

---

## FILE: `package.json`

```json
{
  "name": "interviewai-frontend",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "next": "14.2.3",
    "react": "^18",
    "react-dom": "^18",
    "typescript": "^5",
    "@types/node": "^20",
    "@types/react": "^18",
    "@types/react-dom": "^18",
    "tailwindcss": "^3.4.1",
    "autoprefixer": "^10.0.1",
    "postcss": "^8",
    "@tanstack/react-query": "^5.29.0",
    "zustand": "^4.5.2",
    "lucide-react": "^0.376.0",
    "clsx": "^2.1.1"
  }
}
```

---

## FILE: `.env.local.example`

```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## FILE: `types/interview.ts`

```typescript
export interface ResumeData {
  name: string;
  email: string;
  skills: string[];
  technologies: string[];
  projects: Array<{ name: string; description: string; tech_stack: string[] }>;
  experience: Array<{ company: string; role: string; duration: string }>;
  summary: string;
}

export interface ResumeUploadResponse {
  resume_id: string;
  resume_data: ResumeData;
  interview_topics: string[];
  message: string;
}

export type RoleType =
  | "sde_intern"
  | "frontend_developer"
  | "backend_developer"
  | "fullstack_developer"
  | "data_analyst";

export interface InterviewStartResponse {
  interview_id: string;
  first_question: string;
  topic: string;
  difficulty: string;
  total_planned_questions: number;
}

export interface EvaluationResult {
  technical_score: number;
  communication_score: number;
  confidence_score: number;
  answer_quality: "Excellent" | "Good" | "Fair" | "Poor";
  missing_concepts: string[];
  follow_up_required: boolean;
  difficulty_change: "increase" | "maintain" | "decrease";
  topic: string;
  next_question: string;
  feedback: string;
}

export interface AnswerResponse {
  evaluation: EvaluationResult;
  interview_complete: boolean;
  next_question: string | null;
  question_index: number;
}

export interface InterviewQuestion {
  question: string;
  topic: string;
  answer?: string;
  evaluation?: EvaluationResult;
  expectedConcepts?: string[];
}

export interface FinalReport {
  interview_id: string;
  candidate_name: string;
  role: string;
  date: string;
  overall_score: number;
  technical_score: number;
  communication_score: number;
  confidence_score: number;
  strengths: string[];
  weaknesses: string[];
  learning_roadmap: string[];
  hiring_recommendation: string;
  summary: string;
  pdf_url?: string;
}

export type InterviewStatus = "idle" | "uploading" | "planning" | "active" | "evaluating" | "completed";
```

---

## FILE: `services/api.ts`

```typescript
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(error.detail || "API request failed");
  }
  return res.json();
}

export const api = {
  async uploadResume(file: File) {
    const form = new FormData();
    form.append("file", file);
    const res = await fetch(`${BASE_URL}/resume/upload`, {
      method: "POST",
      body: form,
    });
    if (!res.ok) throw new Error("Resume upload failed");
    return res.json();
  },

  async startInterview(resumeId: string, role: string, candidateName: string) {
    return request("/interview/start", {
      method: "POST",
      body: JSON.stringify({ resume_id: resumeId, role, candidate_name: candidateName }),
    });
  },

  async submitAnswer(interviewId: string, questionIndex: number, answerText: string) {
    return request("/interview/answer", {
      method: "POST",
      body: JSON.stringify({
        interview_id: interviewId,
        question_index: questionIndex,
        answer_text: answerText,
      }),
    });
  },

  async getInterview(interviewId: string) {
    return request(`/interview/${interviewId}`);
  },

  async completeInterview(interviewId: string) {
    return request(`/interview/complete/${interviewId}`, { method: "POST" });
  },

  async resumeInterview(interviewId: string) {
    return request(`/interview/resume/${interviewId}`, { method: "POST" });
  },

  async getAnalytics(interviewId: string) {
    return request(`/report/${interviewId}/analytics`);
  },
};
```

---

## FILE: `hooks/useSpeechRecognition.ts`

```typescript
"use client";
import { useState, useRef, useCallback, useEffect } from "react";

interface UseSpeechRecognitionReturn {
  transcript: string;
  isListening: boolean;
  isSupported: boolean;
  error: string | null;
  startListening: () => void;
  stopListening: () => void;
  resetTranscript: () => void;
}

export function useSpeechRecognition(): UseSpeechRecognitionReturn {
  const [transcript, setTranscript] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const isSupported =
    typeof window !== "undefined" &&
    ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);

  useEffect(() => {
    if (!isSupported) return;
    const SpeechRecognitionAPI =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = "";
      let interimTranscript = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const text = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += text;
        } else {
          interimTranscript += text;
        }
      }
      setTranscript((prev) => prev + finalTranscript || interimTranscript);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      setError(`Speech recognition error: ${event.error}`);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    return () => recognition.abort();
  }, [isSupported]);

  const startListening = useCallback(() => {
    if (!recognitionRef.current || isListening) return;
    setError(null);
    setTranscript("");
    recognitionRef.current.start();
    setIsListening(true);
  }, [isListening]);

  const stopListening = useCallback(() => {
    if (!recognitionRef.current || !isListening) return;
    recognitionRef.current.stop();
    setIsListening(false);
  }, [isListening]);

  const resetTranscript = useCallback(() => {
    setTranscript("");
  }, []);

  return { transcript, isListening, isSupported, error, startListening, stopListening, resetTranscript };
}
```

---

## FILE: `hooks/useSpeechSynthesis.ts`

```typescript
"use client";
import { useState, useCallback } from "react";

interface UseSpeechSynthesisReturn {
  speak: (text: string, onEnd?: () => void) => void;
  cancel: () => void;
  isSpeaking: boolean;
  isSupported: boolean;
}

export function useSpeechSynthesis(): UseSpeechSynthesisReturn {
  const [isSpeaking, setIsSpeaking] = useState(false);

  const isSupported =
    typeof window !== "undefined" && "speechSynthesis" in window;

  const speak = useCallback((text: string, onEnd?: () => void) => {
    if (!isSupported) return;
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    // Prefer a natural English voice
    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find(
      (v) => v.lang === "en-US" && v.name.includes("Google")
    ) || voices.find((v) => v.lang.startsWith("en"));
    if (preferred) utterance.voice = preferred;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => {
      setIsSpeaking(false);
      onEnd?.();
    };
    utterance.onerror = () => {
      setIsSpeaking(false);
      onEnd?.();
    };

    window.speechSynthesis.speak(utterance);
  }, [isSupported]);

  const cancel = useCallback(() => {
    if (!isSupported) return;
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, [isSupported]);

  return { speak, cancel, isSpeaking, isSupported };
}
```

---

## FILE: `store/interviewStore.ts`

```typescript
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  ResumeData, InterviewQuestion, FinalReport, InterviewStatus, RoleType
} from "@/types/interview";

interface InterviewStore {
  // Resume state
  resumeId: string | null;
  resumeData: ResumeData | null;
  interviewTopics: string[];

  // Interview state
  interviewId: string | null;
  status: InterviewStatus;
  role: RoleType;
  currentQuestionIndex: number;
  questions: InterviewQuestion[];
  totalPlanned: number;

  // Report
  finalReport: FinalReport | null;

  // Actions
  setResume: (id: string, data: ResumeData, topics: string[]) => void;
  setRole: (role: RoleType) => void;
  startInterview: (id: string, firstQuestion: string, topic: string, total: number) => void;
  addQuestion: (question: string, topic: string, expectedConcepts: string[]) => void;
  recordAnswer: (index: number, answer: string) => void;
  setStatus: (status: InterviewStatus) => void;
  setFinalReport: (report: FinalReport) => void;
  reset: () => void;
}

const initialState = {
  resumeId: null,
  resumeData: null,
  interviewTopics: [],
  interviewId: null,
  status: "idle" as InterviewStatus,
  role: "sde_intern" as RoleType,
  currentQuestionIndex: 0,
  questions: [],
  totalPlanned: 12,
  finalReport: null,
};

export const useInterviewStore = create<InterviewStore>()(
  persist(
    (set) => ({
      ...initialState,
      setResume: (id, data, topics) =>
        set({ resumeId: id, resumeData: data, interviewTopics: topics }),
      setRole: (role) => set({ role }),
      startInterview: (id, firstQuestion, topic, total) =>
        set({
          interviewId: id,
          status: "active",
          totalPlanned: total,
          questions: [{ question: firstQuestion, topic }],
          currentQuestionIndex: 0,
        }),
      addQuestion: (question, topic, expectedConcepts) =>
        set((state) => ({
          questions: [...state.questions, { question, topic, expectedConcepts }],
        })),
      recordAnswer: (index, answer) =>
        set((state) => ({
          questions: state.questions.map((q, i) =>
            i === index ? { ...q, answer } : q
          ),
          currentQuestionIndex: index + 1,
        })),
      setStatus: (status) => set({ status }),
      setFinalReport: (report) => set({ finalReport: report, status: "completed" }),
      reset: () => set(initialState),
    }),
    {
      name: "interviewai-session",
      partialize: (state) => ({
        resumeId: state.resumeId,
        interviewId: state.interviewId,
        role: state.role,
        questions: state.questions,
        status: state.status,
        currentQuestionIndex: state.currentQuestionIndex,
      }),
    }
  )
);
```

---

## FILE: `app/layout.tsx`

```tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "InterviewAI — AI Mock Interview Platform",
  description: "Practice technical interviews with an AI interviewer. Get real-time feedback, adaptive questions, and detailed reports.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-slate-950 text-white min-h-screen`}>
        <nav className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-sm sticky top-0 z-50">
          <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center font-bold text-sm">AI</div>
              <span className="font-semibold text-white">InterviewAI</span>
            </div>
            <div className="text-sm text-slate-400">100% Free · Powered by Gemini</div>
          </div>
        </nav>
        <main className="max-w-6xl mx-auto px-4 py-8">
          {children}
        </main>
      </body>
    </html>
  );
}
```

---

## FILE: `app/globals.css`

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 224 71% 4%;
    --foreground: 213 31% 91%;
  }
}

@layer components {
  .card {
    @apply bg-slate-900 border border-slate-800 rounded-xl p-6;
  }
  .btn-primary {
    @apply bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-6 py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed;
  }
  .btn-secondary {
    @apply bg-slate-800 hover:bg-slate-700 text-white font-medium px-6 py-3 rounded-lg transition-colors;
  }
  .score-ring {
    @apply inline-flex items-center justify-center w-16 h-16 rounded-full border-4 font-bold text-lg;
  }
}
```

---

## FILE: `app/page.tsx`

```tsx
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center text-center">
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 bg-indigo-950 border border-indigo-800 rounded-full px-4 py-2 text-sm text-indigo-300 mb-6">
          <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse"></span>
          100% Free · Powered by Gemini Flash
        </div>
        <h1 className="text-5xl md:text-6xl font-bold text-white mb-4 leading-tight">
          Practice interviews with
          <span className="text-indigo-400"> AI</span>
        </h1>
        <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-8">
          Upload your resume, choose your target role, and practice a fully
          adaptive voice interview. Get real-time feedback and a detailed PDF report.
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <Link href="/upload" className="btn-primary text-lg">
            Start Interview →
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 w-full max-w-4xl">
        {[
          {
            icon: "🎤",
            title: "Voice-Based",
            desc: "Speak your answers naturally using your browser's built-in microphone. No external tools needed.",
          },
          {
            icon: "🧠",
            title: "Adaptive AI",
            desc: "Questions adapt to your answers. Strong on React? Expect harder questions. Gaps detected? Follow-ups generated.",
          },
          {
            icon: "📊",
            title: "Detailed Reports",
            desc: "Every session generates a PDF report with scores, strengths, weaknesses, and a learning roadmap.",
          },
        ].map((f) => (
          <div key={f.title} className="card text-left">
            <div className="text-3xl mb-3">{f.icon}</div>
            <h3 className="font-semibold text-white mb-2">{f.title}</h3>
            <p className="text-slate-400 text-sm leading-relaxed">{f.desc}</p>
          </div>
        ))}
      </div>

      <div className="mt-12 text-sm text-slate-600">
        Supports SDE Intern · Frontend · Backend · Full Stack · Data Analyst
      </div>
    </div>
  );
}
```

---

## FILE: `app/upload/page.tsx`

```tsx
"use client";
import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/services/api";
import { useInterviewStore } from "@/store/interviewStore";
import type { RoleType } from "@/types/interview";

const ROLES: { value: RoleType; label: string }[] = [
  { value: "sde_intern", label: "SDE Intern" },
  { value: "frontend_developer", label: "Frontend Developer" },
  { value: "backend_developer", label: "Backend Developer" },
  { value: "fullstack_developer", label: "Full Stack Developer" },
  { value: "data_analyst", label: "Data Analyst" },
];

export default function UploadPage() {
  const router = useRouter();
  const { setResume, setRole, role, resumeId, resumeData, startInterview } = useInterviewStore();
  const [file, setFile] = useState<File | null>(null);
  const [candidateName, setCandidateName] = useState("");
  const [step, setStep] = useState<"upload" | "config" | "starting">("upload");
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f && (f.name.endsWith(".pdf") || f.name.endsWith(".docx"))) {
      setFile(f);
    } else {
      setError("Please upload a PDF or DOCX file");
    }
  }, []);

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const res = await api.uploadResume(file);
      setResume(res.resume_id, res.resume_data, res.interview_topics);
      setStep("config");
    } catch (e: any) {
      setError(e.message || "Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleStartInterview = async () => {
    if (!resumeId) return;
    setStep("starting");
    setError(null);
    try {
      const res = await api.startInterview(resumeId, role, candidateName);
      startInterview(res.interview_id, res.first_question, res.topic, res.total_planned_questions);
      router.push(`/interview/${res.interview_id}`);
    } catch (e: any) {
      setError(e.message || "Failed to start interview");
      setStep("config");
    }
  };

  if (step === "upload") {
    return (
      <div className="max-w-xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-2">Upload Your Resume</h1>
        <p className="text-slate-400 mb-8">We'll analyze it and build a personalized interview plan.</p>

        <div
          className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors ${
            dragOver ? "border-indigo-400 bg-indigo-950/30" : "border-slate-700 hover:border-slate-600"
          }`}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => document.getElementById("file-input")?.click()}
        >
          <input
            id="file-input"
            type="file"
            accept=".pdf,.docx,.doc"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) setFile(f); }}
          />
          <div className="text-4xl mb-3">📄</div>
          {file ? (
            <>
              <p className="text-white font-medium">{file.name}</p>
              <p className="text-slate-400 text-sm mt-1">{(file.size / 1024).toFixed(0)} KB</p>
            </>
          ) : (
            <>
              <p className="text-white mb-1">Drop your resume here</p>
              <p className="text-slate-400 text-sm">PDF or DOCX · Max 5MB</p>
            </>
          )}
        </div>

        {error && <p className="text-red-400 text-sm mt-3">{error}</p>}

        <button
          onClick={handleUpload}
          disabled={!file || uploading}
          className="btn-primary w-full mt-6"
        >
          {uploading ? "Analyzing resume..." : "Upload & Analyze →"}
        </button>
      </div>
    );
  }

  if (step === "config") {
    return (
      <div className="max-w-xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-2">Configure Interview</h1>
        <p className="text-slate-400 mb-8">Resume analyzed. Choose your target role to start.</p>

        {resumeData && (
          <div className="card mb-6">
            <h3 className="font-semibold text-white mb-3">Resume Summary</h3>
            <p className="text-slate-400 text-sm mb-3">{resumeData.summary}</p>
            <div className="flex flex-wrap gap-2">
              {resumeData.skills.slice(0, 8).map((s) => (
                <span key={s} className="px-2 py-1 bg-indigo-950 text-indigo-300 text-xs rounded-md border border-indigo-800">
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="mb-4">
          <label className="text-sm text-slate-400 mb-2 block">Your Name (optional)</label>
          <input
            type="text"
            placeholder="Enter your name"
            value={candidateName}
            onChange={(e) => setCandidateName(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="mb-6">
          <label className="text-sm text-slate-400 mb-2 block">Target Role</label>
          <div className="grid grid-cols-1 gap-2">
            {ROLES.map((r) => (
              <button
                key={r.value}
                onClick={() => setRole(r.value)}
                className={`px-4 py-3 rounded-lg text-left transition-colors border ${
                  role === r.value
                    ? "bg-indigo-950 border-indigo-500 text-indigo-300"
                    : "bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-600"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

        <button onClick={handleStartInterview} className="btn-primary w-full">
          Start Interview →
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto text-center py-20">
      <div className="text-4xl mb-4 animate-spin">⚙️</div>
      <p className="text-white text-xl font-medium">Setting up your interview...</p>
      <p className="text-slate-400 mt-2">Generating your first question</p>
    </div>
  );
}
```

---

## FILE: `app/interview/[id]/page.tsx`

```tsx
"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { api } from "@/services/api";
import { useInterviewStore } from "@/store/interviewStore";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { useSpeechSynthesis } from "@/hooks/useSpeechSynthesis";
import type { EvaluationResult } from "@/types/interview";

export default function InterviewPage() {
  const params = useParams();
  const router = useRouter();
  const interviewId = params.id as string;

  const {
    questions, currentQuestionIndex, role, totalPlanned,
    recordAnswer, addQuestion, setFinalReport, setStatus,
  } = useInterviewStore();

  const { transcript, isListening, startListening, stopListening, resetTranscript, isSupported } =
    useSpeechRecognition();
  const { speak, isSpeaking } = useSpeechSynthesis();

  const [phase, setPhase] = useState<"speaking" | "recording" | "evaluating" | "feedback">("speaking");
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [manualAnswer, setManualAnswer] = useState("");
  const currentQ = questions[currentQuestionIndex];
  const hasSpoken = useRef(false);

  useEffect(() => {
    if (currentQ && !hasSpoken.current) {
      hasSpoken.current = true;
      speak(currentQ.question, () => setPhase("recording"));
    }
  }, [currentQ]);

  const handleStopRecording = () => {
    stopListening();
    setPhase("feedback");
  };

  const handleSubmitAnswer = async () => {
    const answer = isSupported ? transcript : manualAnswer;
    if (!answer.trim()) {
      setError("Please provide an answer before submitting.");
      return;
    }
    setError(null);
    setPhase("evaluating");

    try {
      recordAnswer(currentQuestionIndex, answer);
      const res = await api.submitAnswer(interviewId, currentQuestionIndex, answer);
      setEvaluation(res.evaluation);

      if (res.interview_complete) {
        setPhase("feedback");
        setTimeout(async () => {
          const report = await api.completeInterview(interviewId);
          setFinalReport(report);
          router.push(`/report/${interviewId}`);
        }, 3000);
      } else {
        setPhase("feedback");
        if (res.next_question) {
          addQuestion(res.next_question, res.evaluation.topic, []);
        }
      }
    } catch (e: any) {
      setError(e.message || "Evaluation failed. Please try again.");
      setPhase("recording");
    }
  };

  const handleNextQuestion = () => {
    hasSpoken.current = false;
    resetTranscript();
    setManualAnswer("");
    setEvaluation(null);
    setPhase("speaking");
  };

  const progress = Math.round((currentQuestionIndex / totalPlanned) * 100);

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <span className="text-slate-400 text-sm">
            Question {currentQuestionIndex + 1} of ~{totalPlanned}
          </span>
          {currentQ && (
            <span className="ml-3 px-2 py-1 bg-indigo-950 text-indigo-300 text-xs rounded border border-indigo-800">
              {currentQ.topic}
            </span>
          )}
        </div>
        <div className="text-sm text-slate-400 capitalize">{role.replace("_", " ")}</div>
      </div>

      {/* Progress bar */}
      <div className="w-full h-1.5 bg-slate-800 rounded-full mb-8">
        <div
          className="h-full bg-indigo-500 rounded-full transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Question Card */}
      <div className="card mb-6">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-sm flex-shrink-0">
            AI
          </div>
          <div>
            <div className="text-xs text-slate-500 mb-1">AI Interviewer</div>
            <p className="text-white leading-relaxed text-lg">
              {currentQ?.question || "Loading question..."}
            </p>
          </div>
        </div>
        {isSpeaking && (
          <div className="flex items-center gap-2 text-indigo-400 text-sm">
            <span className="flex gap-1">
              {[0, 0.1, 0.2].map((d) => (
                <span
                  key={d}
                  className="w-1 h-4 bg-indigo-400 rounded-full animate-pulse"
                  style={{ animationDelay: `${d}s` }}
                />
              ))}
            </span>
            Speaking...
          </div>
        )}
      </div>

      {/* Answer Section */}
      {phase !== "speaking" && phase !== "evaluating" && !evaluation && (
        <div className="card mb-6">
          <h3 className="font-medium text-white mb-4">Your Answer</h3>

          {isSupported ? (
            <>
              <div className="bg-slate-800 rounded-lg p-4 min-h-[120px] mb-4 text-slate-300 text-sm leading-relaxed">
                {transcript || (isListening ? "Listening..." : "Click 'Start Speaking' to begin")}
              </div>
              <div className="flex gap-3">
                {!isListening ? (
                  <button onClick={startListening} className="btn-primary flex items-center gap-2">
                    🎤 Start Speaking
                  </button>
                ) : (
                  <button onClick={handleStopRecording} className="bg-red-600 hover:bg-red-500 text-white font-medium px-6 py-3 rounded-lg transition-colors flex items-center gap-2">
                    ⏹ Stop Recording
                  </button>
                )}
                {transcript && !isListening && (
                  <button onClick={handleSubmitAnswer} className="btn-primary">
                    Submit Answer →
                  </button>
                )}
              </div>
            </>
          ) : (
            <>
              <textarea
                value={manualAnswer}
                onChange={(e) => setManualAnswer(e.target.value)}
                placeholder="Type your answer here..."
                rows={6}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-4 text-white placeholder-slate-500 resize-none focus:outline-none focus:border-indigo-500 mb-4"
              />
              <button onClick={handleSubmitAnswer} disabled={!manualAnswer.trim()} className="btn-primary">
                Submit Answer →
              </button>
            </>
          )}
          {error && <p className="text-red-400 text-sm mt-3">{error}</p>}
        </div>
      )}

      {/* Evaluating state */}
      {phase === "evaluating" && (
        <div className="card text-center py-12">
          <div className="text-3xl animate-spin mb-4">🧠</div>
          <p className="text-white font-medium">Evaluating your answer...</p>
          <p className="text-slate-400 text-sm mt-1">This takes 1-3 seconds</p>
        </div>
      )}

      {/* Evaluation Result */}
      {evaluation && phase === "feedback" && (
        <div className="card mb-6">
          <h3 className="font-medium text-white mb-4">Evaluation</h3>
          <div className="grid grid-cols-3 gap-4 mb-4">
            {[
              { label: "Technical", score: evaluation.technical_score },
              { label: "Communication", score: evaluation.communication_score },
              { label: "Confidence", score: evaluation.confidence_score },
            ].map(({ label, score }) => (
              <div key={label} className="text-center">
                <div className={`text-2xl font-bold ${score >= 7 ? "text-green-400" : score >= 5 ? "text-yellow-400" : "text-red-400"}`}>
                  {score}/10
                </div>
                <div className="text-slate-400 text-xs mt-1">{label}</div>
              </div>
            ))}
          </div>

          <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium mb-4 ${
            evaluation.answer_quality === "Excellent" ? "bg-green-900 text-green-300" :
            evaluation.answer_quality === "Good" ? "bg-blue-900 text-blue-300" :
            evaluation.answer_quality === "Fair" ? "bg-yellow-900 text-yellow-300" :
            "bg-red-900 text-red-300"
          }`}>
            {evaluation.answer_quality}
          </div>

          <p className="text-slate-300 text-sm mb-4">{evaluation.feedback}</p>

          {evaluation.missing_concepts.length > 0 && (
            <div className="bg-slate-800 rounded-lg p-3 mb-4">
              <p className="text-slate-400 text-xs mb-2">Concepts to explore:</p>
              <div className="flex flex-wrap gap-2">
                {evaluation.missing_concepts.map((c) => (
                  <span key={c} className="px-2 py-1 bg-red-950 text-red-300 text-xs rounded border border-red-800">{c}</span>
                ))}
              </div>
            </div>
          )}

          <button onClick={handleNextQuestion} className="btn-primary">
            {evaluation.follow_up_required ? "Answer Follow-up →" : "Next Question →"}
          </button>
        </div>
      )}
    </div>
  );
}
```

---

## FILE: `app/report/[id]/page.tsx`

```tsx
"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useInterviewStore } from "@/store/interviewStore";
import Link from "next/link";

export default function ReportPage() {
  const params = useParams();
  const { finalReport } = useInterviewStore();
  const [report, setReport] = useState(finalReport);

  useEffect(() => {
    if (finalReport) setReport(finalReport);
  }, [finalReport]);

  if (!report) {
    return (
      <div className="text-center py-20">
        <p className="text-slate-400">Report not found. Please complete an interview first.</p>
        <Link href="/" className="btn-primary mt-4 inline-block">Go Home</Link>
      </div>
    );
  }

  const getScoreColor = (score: number) =>
    score >= 7.5 ? "text-green-400" : score >= 5.5 ? "text-yellow-400" : "text-red-400";

  const getRecommendationStyle = (rec: string) => {
    if (rec === "Strong Hire") return "bg-green-900 text-green-300 border-green-700";
    if (rec === "Hire") return "bg-blue-900 text-blue-300 border-blue-700";
    if (rec === "Maybe") return "bg-yellow-900 text-yellow-300 border-yellow-700";
    return "bg-red-900 text-red-300 border-red-700";
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-white mb-2">Interview Report</h1>
        <p className="text-slate-400">{report.candidate_name} · {report.role?.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())}</p>
      </div>

      {/* Hiring Recommendation */}
      <div className={`card text-center mb-6 border ${getRecommendationStyle(report.hiring_recommendation)}`}>
        <div className="text-4xl mb-2">
          {report.hiring_recommendation === "Strong Hire" ? "🌟" :
           report.hiring_recommendation === "Hire" ? "✅" :
           report.hiring_recommendation === "Maybe" ? "🤔" : "❌"}
        </div>
        <div className="text-xl font-bold">{report.hiring_recommendation}</div>
        <p className="text-sm mt-2 opacity-80">{report.summary}</p>
      </div>

      {/* Scores */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: "Overall", score: report.overall_score },
          { label: "Technical", score: report.technical_score },
          { label: "Communication", score: report.communication_score },
          { label: "Confidence", score: report.confidence_score },
        ].map(({ label, score }) => (
          <div key={label} className="card text-center">
            <div className={`text-2xl font-bold ${getScoreColor(score)}`}>{score?.toFixed(1)}</div>
            <div className="text-slate-400 text-xs mt-1">{label}</div>
          </div>
        ))}
      </div>

      {/* Strengths & Weaknesses */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="card">
          <h3 className="font-semibold text-green-400 mb-3">✓ Strengths</h3>
          <ul className="space-y-2">
            {report.strengths?.map((s, i) => (
              <li key={i} className="text-slate-300 text-sm">{s}</li>
            ))}
          </ul>
        </div>
        <div className="card">
          <h3 className="font-semibold text-red-400 mb-3">△ Areas to Improve</h3>
          <ul className="space-y-2">
            {report.weaknesses?.map((w, i) => (
              <li key={i} className="text-slate-300 text-sm">{w}</li>
            ))}
          </ul>
        </div>
      </div>

      {/* Learning Roadmap */}
      <div className="card mb-6">
        <h3 className="font-semibold text-white mb-4">📚 Learning Roadmap</h3>
        <ol className="space-y-2">
          {report.learning_roadmap?.map((item, i) => (
            <li key={i} className="text-slate-300 text-sm flex gap-3">
              <span className="text-indigo-400 font-mono">{i + 1}.</span>
              {item}
            </li>
          ))}
        </ol>
      </div>

      {/* Actions */}
      <div className="flex gap-4">
        {report.pdf_url && (
          <a
            href={`${process.env.NEXT_PUBLIC_API_URL}${report.pdf_url}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary"
          >
            Download PDF Report ↓
          </a>
        )}
        <Link href="/upload" className="btn-secondary">
          New Interview →
        </Link>
      </div>
    </div>
  );
}
```

---

## FILE: `tailwind.config.ts`

```typescript
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        slate: {
          950: "#0a0f1e",
        },
      },
    },
  },
  plugins: [],
};
export default config;
```

---

## FILE: `next.config.ts`

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
};

export default nextConfig;
```

---

# ============================================================
# PART 3 — DEPLOYMENT & SETUP
# ============================================================

## FILE: `interviewai-backend/README.md`

````markdown
# InterviewAI Backend

FastAPI backend for AI-powered mock interview platform.

## Local Setup

```bash
cd interviewai-backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Add your API keys to .env
uvicorn app.main:app --reload
```

## API Keys Required (All Free Tier)

| Key | Where to get | Free tier |
|-----|-------------|-----------|
| GEMINI_API_KEY | aistudio.google.com | 1500 req/day |
| GROQ_API_KEY | console.groq.com | Free tier |
| DEEPSEEK_API_KEY | platform.deepseek.com | Free credits |

## Deploy to Render

1. Push to GitHub
2. New Web Service on render.com
3. Connect repo
4. Build: `pip install -r requirements.txt`
5. Start: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
6. Add env vars from .env
7. Add a 1GB disk at `/opt/render/project/src`

## Architecture Notes

- Sessions stored as JSON files in `sessions/` directory
- Resumes stored in `uploads/` directory
- PDF reports in `reports/` directory
- Render free tier sleeps after 15 mins of inactivity
  → Add a ping service (cron-job.org) to keep alive
````

---

## FILE: `interviewai-frontend/README.md`

````markdown
# InterviewAI Frontend

Next.js frontend for the AI mock interview platform.

## Local Setup

```bash
cd interviewai-frontend
npm install
cp .env.local.example .env.local
# Set NEXT_PUBLIC_API_URL=http://localhost:8000
npm run dev
```

## Deploy to Vercel

```bash
npx vercel
# Set NEXT_PUBLIC_API_URL=https://your-backend.onrender.com
```

## Key Features

- Voice interviews using Browser Web Speech API (free, no Whisper/ElevenLabs)
- Session persistence via Zustand + localStorage (survives browser refresh)
- Adaptive questioning — follow-ups generated based on answer quality
- PDF report download after interview completes
- Zero cost to run
````

---

# ============================================================
# PART 4 — ADDITIONAL SERVICE FILES
# ============================================================

## FILE: `app/services/analytics_service.py`

```python
from app.services.session_manager import session_manager


def get_interview_analytics(interview_id: str) -> dict:
    session = session_manager.get_session(interview_id)
    if not session:
        return {}

    evaluations = session.get("evaluations", [])
    questions = session.get("questions", [])

    if not evaluations:
        return {"message": "No evaluations yet"}

    avg_tech = sum(e.get("technical_score", 0) for e in evaluations) / len(evaluations)
    avg_comm = sum(e.get("communication_score", 0) for e in evaluations) / len(evaluations)
    avg_conf = sum(e.get("confidence_score", 0) for e in evaluations) / len(evaluations)

    topic_breakdown = {}
    for i, q in enumerate(questions):
        topic = q.get("topic", "General")
        if i < len(evaluations):
            ev = evaluations[i]
            if topic not in topic_breakdown:
                topic_breakdown[topic] = {"total_score": 0, "count": 0}
            topic_breakdown[topic]["total_score"] += ev.get("technical_score", 0)
            topic_breakdown[topic]["count"] += 1

    return {
        "interview_id": interview_id,
        "status": session.get("status"),
        "questions_completed": len(questions),
        "total_planned": session["interview_context"].get("total_planned", 12),
        "progress_pct": round(len(questions) / max(session["interview_context"].get("total_planned", 12), 1) * 100),
        "average_scores": {
            "technical": round(avg_tech, 1),
            "communication": round(avg_comm, 1),
            "confidence": round(avg_conf, 1),
            "overall": round((avg_tech + avg_comm + avg_conf) / 3, 1),
        },
        "strong_topics": session["interview_context"].get("strong_topics", []),
        "weak_topics": session["interview_context"].get("weak_topics", []),
        "current_difficulty": session["interview_context"].get("current_difficulty", "medium"),
        "topic_breakdown": {
            t: round(d["total_score"] / max(d["count"], 1), 1)
            for t, d in topic_breakdown.items()
        },
    }
```

---

## FILE: `app/utils/validators.py`

```python
from fastapi import HTTPException
import re


def validate_file_extension(filename: str):
    allowed = {".pdf", ".docx", ".doc"}
    ext = "." + filename.lower().rsplit(".", 1)[-1] if "." in filename else ""
    if ext not in allowed:
        raise HTTPException(
            400,
            f"File type '{ext}' not supported. Allowed: {', '.join(allowed)}"
        )


def sanitize_text(text: str, max_length: int = 10000) -> str:
    """Remove potential prompt injection attempts from resume text."""
    # Remove common injection patterns
    injection_patterns = [
        r"ignore previous instructions",
        r"ignore all previous",
        r"system prompt",
        r"<\|.*?\|>",
        r"\[\[.*?\]\]",
    ]
    for pattern in injection_patterns:
        text = re.sub(pattern, "", text, flags=re.IGNORECASE)

    # Truncate
    return text[:max_length].strip()


def validate_answer_text(text: str) -> str:
    if not text or not text.strip():
        raise HTTPException(400, "Answer cannot be empty")
    if len(text) > 5000:
        raise HTTPException(400, "Answer too long (max 5000 characters)")
    return text.strip()
```

---

# ============================================================
# END OF PROMPT
# ============================================================

After generating all files:

1. Print the complete directory tree for both projects
2. List the 3 API keys needed and where to get them
3. Show the exact commands to run locally
4. Show the Render and Vercel deployment steps

Generate every file in full. Do not truncate. Do not summarize any file with comments like "// rest of implementation". Write the complete implementation.
