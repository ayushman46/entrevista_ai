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
