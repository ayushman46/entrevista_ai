from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class SessionCreate(BaseModel):
    name: str
    role: str
    resume_text: str = ""

class SessionResponse(BaseModel):
    session_id: str

class TranscriptDoc(BaseModel):
    session_id: str
    role: str # "user" or "ai"
    content: str
    timestamp: datetime = None

class ReportResponse(BaseModel):
    session_id: str
    score: int
    strengths: List[str]
    improvements: List[str]
