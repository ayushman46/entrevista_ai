from fastapi import APIRouter
from app.services.session_manager import get_evaluation, get_session, get_transcripts, save_evaluation
from app.services.interview_context import build_interview_context, build_interview_messages, parse_json_object
from app.services.llm_chain import generate

router = APIRouter()

@router.get("/api/report/{session_id}")
async def get_report(session_id: str):
    # Check if we already have an evaluation
    existing = await get_evaluation(session_id)
    if existing:
        result = {
            "score": existing["score"],
            "strengths": existing["strengths"],
            "improvements": existing["improvements"]
        }
        if "competency_scores" in existing:
            result["competency_scores"] = existing["competency_scores"]
        if "evidence" in existing:
            result["evidence"] = existing["evidence"]
        return result

    transcripts = await get_transcripts(session_id)
    if not transcripts:
        return {"error": "No transcripts found"}

    session = await get_session(session_id)
    if not session:
        return {"error": "Interview not found"}

    context = build_interview_context(session, transcripts)
    prompt = build_interview_messages(
        context,
        """This is the final evaluation pass for the completed practice interview.
Analyze the complete structured context and produce ONLY a valid JSON object with this shape:
{
  "score": 0,
  "strengths": ["short user-facing strength"],
  "improvements": ["short user-facing improvement"],
  "competency_scores": [
    {
      "name": "competency",
      "score": 0,
      "confidence": 0.0,
      "evidence": ["specific observed evidence"],
      "positive_signals": ["observed signal"],
      "negative_signals": ["observed gap"]
    }
  ],
  "evidence": [
    {"type": "strength or improvement", "statement": "specific evidence from the interview"}
  ]
}

Score from evidence in the interview, not keyword count. Do not invent candidate facts. A valid alternative technical approach must not be penalized merely because it differs from your preferred implementation. Keep the user-facing strengths and improvements concise, but make every competency score traceable to evidence.""",
    )
    
    response_text = ""
    async for chunk in generate(prompt, purpose="analysis"):
        response_text += chunk

    result = parse_json_object(response_text)
    if not result:
        print(f"Eval parsing error: invalid JSON, text: {response_text}")
        return {"score": 0, "strengths": ["Evaluation failed"], "improvements": []}

    try:
        score = max(0, min(100, int(result.get("score", 0))))
    except (TypeError, ValueError):
        score = 0

    normalized = {
        "score": score,
        "strengths": [str(item) for item in result.get("strengths", []) if item],
        "improvements": [str(item) for item in result.get("improvements", []) if item],
        "competency_scores": result.get("competency_scores", []),
        "evidence": result.get("evidence", []),
    }
    await save_evaluation(session_id, normalized)
    return normalized
