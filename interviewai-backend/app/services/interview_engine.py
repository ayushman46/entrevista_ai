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
    
    clean = clean.strip()
    if clean.startswith("json"):
        clean = clean[4:].strip()
        
    return clean
