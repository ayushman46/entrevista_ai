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
    
    # Handle the case where the LLM might return "```json"
    if clean.startswith("json"):
        clean = clean[4:].strip()

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
    
    if clean.startswith("json"):
        clean = clean[4:].strip()

    return json.loads(clean)
