from app.services.session_manager import session_manager


def get_interview_analytics(interview_id: str) -> dict:
    session = session_manager.get_session(interview_id)
    if not session:
        return {}

    evaluations = session.get("evaluations", [])
    questions = session.get("questions", [])

    if not evaluations:
        return {"message": "No evaluations yet"}

    avg_tech = sum(e.get("technical_score", 0) for e in evaluations) / len(evaluations)
    avg_comm = sum(e.get("communication_score", 0) for e in evaluations) / len(evaluations)
    avg_conf = sum(e.get("confidence_score", 0) for e in evaluations) / len(evaluations)

    topic_breakdown = {}
    for i, q in enumerate(questions):
        topic = q.get("topic", "General")
        if i < len(evaluations):
            ev = evaluations[i]
            if topic not in topic_breakdown:
                topic_breakdown[topic] = {"total_score": 0, "count": 0}
            topic_breakdown[topic]["total_score"] += ev.get("technical_score", 0)
            topic_breakdown[topic]["count"] += 1

    return {
        "interview_id": interview_id,
        "status": session.get("status"),
        "questions_completed": len(questions),
        "total_planned": session["interview_context"].get("total_planned", 12),
        "progress_pct": round(len(questions) / max(session["interview_context"].get("total_planned", 12), 1) * 100),
        "average_scores": {
            "technical": round(avg_tech, 1),
            "communication": round(avg_comm, 1),
            "confidence": round(avg_conf, 1),
            "overall": round((avg_tech + avg_comm + avg_conf) / 3, 1),
        },
        "strong_topics": session["interview_context"].get("strong_topics", []),
        "weak_topics": session["interview_context"].get("weak_topics", []),
        "current_difficulty": session["interview_context"].get("current_difficulty", "medium"),
        "topic_breakdown": {
            t: round(d["total_score"] / max(d["count"], 1), 1)
            for t, d in topic_breakdown.items()
        },
    }
