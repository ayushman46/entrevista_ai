from fastapi import APIRouter
from app.schemas.models import SessionCreate, SessionResponse
from app.services.session_manager import create_session, get_session

router = APIRouter()

@router.post("/api/interview/start", response_model=SessionResponse)
async def start_interview(session_data: SessionCreate):
    session_id = await create_session(session_data)
    return {"session_id": session_id}

@router.get("/api/interview/{session_id}")
async def get_interview(session_id: str):
    session = await get_session(session_id)
    if not session:
        return {"error": "Not found"}
    return {
        "candidate_name": session["candidate_name"],
        "target_role": session["target_role"],
        "status": session["status"]
    }
