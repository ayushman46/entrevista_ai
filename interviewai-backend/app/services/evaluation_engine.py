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
    
    if clean.startswith("json"):
        clean = clean[4:].strip()

    final_eval = json.loads(clean)

    # Close the session
    session_manager.close_session(interview_id)

    return final_eval
