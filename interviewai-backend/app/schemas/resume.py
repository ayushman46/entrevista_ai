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
