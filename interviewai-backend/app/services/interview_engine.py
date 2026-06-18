import json
import logging
from datetime import datetime
from app.llm.orchestrator import llm
from app.prompts.question_generation import get_greeting_prompt, get_first_question_prompt, get_next_question_prompt
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

    session = session_manager.get_session(interview_id)
    if not session:
        raise ValueError(f"Session {interview_id} not found")

    # Update session with resume summary
    session_manager.update_session(interview_id, {
        "interview_context": {
            **session["interview_context"],
            "resume_summary": resume_summary,
        }
    })

    # Generate a warm greeting first
    prompt = get_greeting_prompt(candidate_name=candidate_name, role=role)

    response = await llm.generate(
        prompt=prompt,
        system_prompt=INTERVIEW_SYSTEM_PROMPT,
        max_tokens=200,
        temperature=0.7,
    )

    clean = _clean_json(response)
    question_data = json.loads(clean)
    
    # Store the greeting in the session
    session_manager.add_question(
        interview_id=interview_id,
        question=question_data.get("question", ""),
        topic="Introduction"
    )
    
    return question_data


async def evaluate_answer(
    interview_id: str,
    question: str,
    answer: str,
    expected_concepts: list,
    topic: str,
    role: str,
) -> tuple[dict, bool]:
    """Evaluate a candidate's answer and generate next question."""
    session = session_manager.get_session(interview_id)
    if not session:
        raise ValueError(f"Session {interview_id} not found")

    ctx = session["interview_context"]
    current_difficulty = ctx.get("current_difficulty", "medium")

    # Special handling for greeting turn
    if topic == "Introduction" and len(session["questions"]) == 1:
        # Acknowledge social response and ask first technical question
        first_q_data = await _get_first_technical_question(interview_id, role, answer)
        evaluation = {
            "technical_score": 10,
            "communication_score": 10,
            "confidence_score": 10,
            "answer_quality": "Natural",
            "missing_concepts": [],
            "follow_up_required": False,
            "difficulty_change": "maintain",
            "topic": "Introduction",
            "next_question": first_q_data.get("question", ""),
            "feedback": "Great to meet you!",
        }
        
        # Record the social answer
        session_manager.record_answer(
            interview_id=interview_id,
            answer=answer,
            evaluation=evaluation
        )
        
        # Add the first technical question to the session
        session_manager.add_question(
            interview_id=interview_id,
            question=first_q_data.get("question", ""),
            topic=first_q_data.get("topic", "Technical")
        )
        
        return evaluation, False

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

    # Record the answer
    session_manager.record_answer(
        interview_id=interview_id,
        answer=answer,
        evaluation=evaluation
    )

    # Check if follow-up or new topic
    updated_session = session_manager.get_session(interview_id)
    if not updated_session:
        raise ValueError(f"Session {interview_id} not found")

    question_count = len(updated_session["questions"])
    is_complete = question_count >= MAX_QUESTIONS

    if not is_complete and not evaluation.get("follow_up_required"):
        # Generate next question on a new topic
        next_q_data = await get_next_question(interview_id, role)
        evaluation["next_question"] = next_q_data.get("question", "")
        evaluation["next_topic"] = next_q_data.get("topic", "")
        evaluation["next_expected_concepts"] = next_q_data.get("expected_concepts", [])
        
        # Add the next question to the session
        session_manager.add_question(
            interview_id=interview_id,
            question=evaluation["next_question"],
            topic=evaluation["next_topic"]
        )

    return evaluation, is_complete


async def _get_first_technical_question(interview_id: str, role: str, social_response: str) -> dict:
    """Generate the actual first technical question."""
    session = session_manager.get_session(interview_id)
    ctx = session["interview_context"]
    plan = session.get("interview_plan", {})
    
    prompt = get_first_question_prompt(
        resume_summary=ctx.get("resume_summary", ""),
        role=role,
        topics=plan.get("topics", []),
        difficulty=plan.get("difficulty", "medium"),
        opening_topic=plan.get("opening_question_topic", plan.get("topics", ["General"])[0]),
        candidate_name=ctx.get("candidate_name", "Candidate"),
        social_response=social_response
    )
    
    response = await llm.generate(
        prompt=prompt,
        system_prompt=INTERVIEW_SYSTEM_PROMPT,
        max_tokens=400,
        temperature=0.7,
    )
    return json.loads(_clean_json(response))


async def get_next_question(interview_id: str, role: str) -> dict:
    """Generate the next adaptive question based on current interview context."""
    session = session_manager.get_session(interview_id)
    if not session:
        raise ValueError(f"Session {interview_id} not found")

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
