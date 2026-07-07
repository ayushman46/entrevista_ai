from app.db import mongo
from app.schemas.models import SessionCreate, TranscriptDoc
from bson import ObjectId
from datetime import datetime, timezone

from bson.errors import InvalidId

async def create_session(session_data: SessionCreate) -> str:
    session_doc = {
        "candidate_name": session_data.name,
        "target_role": session_data.role,
        "resume_text": session_data.resume_text,
        "status": "active",
        "created_at": datetime.now(timezone.utc)
    }
    result = await mongo.db.sessions.insert_one(session_doc)
    return str(result.inserted_id)

async def get_session(session_id: str) -> dict:
    try:
        return await mongo.db.sessions.find_one({"_id": ObjectId(session_id)})
    except InvalidId:
        return None

async def append_transcript(session_id: str, role: str, content: str):
    doc = {
        "session_id": session_id,
        "role": role,
        "content": content,
        "timestamp": datetime.now(timezone.utc)
    }
    await mongo.db.transcripts.insert_one(doc)

async def get_transcripts(session_id: str) -> list:
    cursor = mongo.db.transcripts.find({"session_id": session_id}).sort("timestamp", 1)
    return await cursor.to_list(length=1000)

async def save_evaluation(session_id: str, eval_data: dict):
    doc = {
        "session_id": session_id,
        "score": eval_data.get("score"),
        "strengths": eval_data.get("strengths", []),
        "improvements": eval_data.get("improvements", []),
        "created_at": datetime.now(timezone.utc)
    }
    await mongo.db.evaluations.insert_one(doc)
    
async def get_evaluation(session_id: str) -> dict:
    return await mongo.db.evaluations.find_one({"session_id": session_id})
