from fastapi import APIRouter
from app.services.session_manager import get_transcripts, get_evaluation, save_evaluation
from app.services.llm_chain import generate
import json

router = APIRouter()

@router.get("/api/report/{session_id}")
async def get_report(session_id: str):
    # Check if we already have an evaluation
    existing = await get_evaluation(session_id)
    if existing:
        return {
            "score": existing["score"],
            "strengths": existing["strengths"],
            "improvements": existing["improvements"]
        }
        
    transcripts = await get_transcripts(session_id)
    if not transcripts:
        return {"error": "No transcripts found"}
        
    transcript_text = "\n".join([f"{msg['role']}: {msg['content']}" for msg in transcripts])
    
    prompt = [
        {"role": "system", "content": "You are an expert interviewer evaluating a candidate. Based on the following transcript, provide a JSON evaluation with 'score' (0-100), 'strengths' (list of strings), and 'improvements' (list of strings). Output ONLY valid JSON."},
        {"role": "user", "content": transcript_text}
    ]
    
    response_text = ""
    async for chunk in generate(prompt):
        response_text += chunk
        
    # basic json extraction
    try:
        import re
        match = re.search(r'\{.*\}', response_text.replace("\n", " "))
        if match:
            result = json.loads(match.group(0))
        else:
            result = json.loads(response_text)
            
        await save_evaluation(session_id, result)
        return result
    except Exception as e:
        print(f"Eval parsing error: {e}, text: {response_text}")
        return {"score": 0, "strengths": ["Evaluation failed"], "improvements": []}
