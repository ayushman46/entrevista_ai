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
