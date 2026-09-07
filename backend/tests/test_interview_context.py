from app.services.interview_context import (
    build_interview_context,
    build_interview_messages,
    default_interview_memory,
    default_interview_state,
    merge_answer_analysis,
    parse_json_object,
    record_question,
)


def test_context_keeps_source_sections_separate():
    context = build_interview_context(
        {
            "candidate_name": "Jane Doe",
            "target_role": "Backend Engineer",
            "resume_text": "Built a FastAPI service.",
            "job_description": "Experience with distributed systems.",
        },
        [{"role": "ai", "content": "Tell me about your service."}],
    )
    messages = build_interview_messages(context, "Ask the next question.")
    contents = [message["content"] for message in messages]

    assert "<RESUME>" in contents[2]
    assert "<JOB_DESCRIPTION>" in contents[3]
    assert "<INTERVIEW_STATE>" in contents[4]
    assert "<RECENT_CONVERSATION>" in contents[6]


def test_live_context_bounds_repeated_source_payloads():
    context = build_interview_context(
        {
            "candidate_name": "Jane Doe",
            "target_role": "Backend Engineer",
            "resume_text": "R" * 20_000,
            "job_description": "J" * 20_000,
        },
        [{"role": "user", "content": "A"}] * 10,
        live=True,
    )

    assert len(context["resume"]["source_text"]) <= 12_000 + len("\n[truncated]")
    assert len(context["job_description"]["source_text"]) <= 8_000 + len("\n[truncated]")
    assert len(context["recent_conversation"]) == 4


def test_question_state_adapts_phase_and_topic():
    state = default_interview_state()
    state = record_question(state, "How would you scale this distributed system?")

    assert state["question_number"] == 1
    assert state["phase"] == "opening"
    assert state["current_topic"] == "system design"
    assert state["topics_covered"] == ["system design"]


def test_answer_analysis_merges_evidence():
    state, memory = merge_answer_analysis(
        default_interview_state(),
        default_interview_memory(),
        "Tell me about your API.",
        "I built a FastAPI service.",
        {
            "summary": "Explained the implementation clearly.",
            "important_claims": ["Built a FastAPI service"],
            "strong_areas": ["backend fundamentals"],
            "competencies": [
                {
                    "name": "technical depth",
                    "score": 8,
                    "confidence": 0.8,
                    "evidence": ["Explained the service implementation"],
                }
            ],
        },
    )

    assert memory["important_claims"] == ["Built a FastAPI service"]
    assert memory["answer_evidence"][0]["answer"] == "I built a FastAPI service."
    assert state["competencies_assessed"][0]["score"] == 8


def test_parse_json_object_accepts_fenced_output():
    assert parse_json_object("```json\n{\"score\": 88}\n```") == {"score": 88}
