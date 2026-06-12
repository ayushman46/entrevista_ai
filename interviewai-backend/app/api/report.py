from fastapi import APIRouter, HTTPException
from app.services.session_manager import session_manager

router = APIRouter()


@router.get("/{interview_id}/analytics")
async def get_analytics(interview_id: str):
    session = session_manager.get_session(interview_id)
    if not session:
        raise HTTPException(404, "Interview not found")

    evaluations = session.get("evaluations", [])
    if not evaluations:
        return {"message": "No evaluations yet"}

    topic_performance = {}
    for i, q in enumerate(session.get("questions", [])):
        topic = q.get("topic", "General")
        if i < len(evaluations):
            ev = evaluations[i]
            if topic not in topic_performance:
                topic_performance[topic] = {"scores": [], "count": 0}
            topic_performance[topic]["scores"].append(ev.get("technical_score", 0))
            topic_performance[topic]["count"] += 1

    analytics = {
        "interview_id": interview_id,
        "status": session["status"],
        "questions_completed": len(session.get("questions", [])),
        "average_technical": round(
            sum(e.get("technical_score", 0) for e in evaluations) / max(len(evaluations), 1), 1
        ),
        "average_communication": round(
            sum(e.get("communication_score", 0) for e in evaluations) / max(len(evaluations), 1), 1
        ),
        "strong_topics": session["interview_context"].get("strong_topics", []),
        "weak_topics": session["interview_context"].get("weak_topics", []),
        "topic_performance": {
            t: {
                "avg_score": round(sum(d["scores"]) / max(d["count"], 1), 1),
                "questions": d["count"],
            }
            for t, d in topic_performance.items()
        },
        "difficulty_progression": [
            e.get("difficulty_change", "maintain") for e in evaluations
        ],
    }
    return analytics
