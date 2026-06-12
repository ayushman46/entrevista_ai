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
