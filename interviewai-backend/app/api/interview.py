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
