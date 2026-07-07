import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from bson import ObjectId
from bson.errors import InvalidId
from datetime import datetime, timezone

from app.schemas.models import SessionCreate
from app.services.session_manager import (
    create_session,
    get_session,
    append_transcript,
    get_transcripts,
    save_evaluation,
    get_evaluation
)

@pytest.fixture
def mock_db():
    with patch("app.db.mongo.db") as mock_db_instance:
        yield mock_db_instance

@pytest.mark.asyncio
async def test_create_session(mock_db):
    mock_insert_result = MagicMock()
    mock_insert_result.inserted_id = ObjectId("60b9f150e21a2c3f88f12345")
    mock_db.sessions.insert_one = AsyncMock(return_value=mock_insert_result)

    session_data = SessionCreate(name="John Doe", role="Software Engineer", resume_text="Resume info")
    
    session_id = await create_session(session_data)
    
    assert session_id == "60b9f150e21a2c3f88f12345"
    mock_db.sessions.insert_one.assert_called_once()
    called_arg = mock_db.sessions.insert_one.call_args[0][0]
    assert called_arg["candidate_name"] == "John Doe"
    assert called_arg["target_role"] == "Software Engineer"
    assert called_arg["resume_text"] == "Resume info"
    assert called_arg["status"] == "active"
    assert "created_at" in called_arg

@pytest.mark.asyncio
async def test_get_session_valid_id(mock_db):
    mock_session = {
        "_id": ObjectId("60b9f150e21a2c3f88f12345"),
        "candidate_name": "John Doe",
        "target_role": "Software Engineer",
        "status": "active"
    }
    mock_db.sessions.find_one = AsyncMock(return_value=mock_session)
    
    result = await get_session("60b9f150e21a2c3f88f12345")
    assert result == mock_session
    mock_db.sessions.find_one.assert_called_once_with({"_id": ObjectId("60b9f150e21a2c3f88f12345")})

@pytest.mark.asyncio
async def test_get_session_invalid_id(mock_db):
    result = await get_session("invalid-object-id")
    assert result is None
    mock_db.sessions.find_one.assert_not_called()

@pytest.mark.asyncio
async def test_append_transcript(mock_db):
    mock_db.transcripts.insert_one = AsyncMock()
    
    await append_transcript("session123", "user", "Hello world")
    
    mock_db.transcripts.insert_one.assert_called_once()
    called_arg = mock_db.transcripts.insert_one.call_args[0][0]
    assert called_arg["session_id"] == "session123"
    assert called_arg["role"] == "user"
    assert called_arg["content"] == "Hello world"
    assert "timestamp" in called_arg

@pytest.mark.asyncio
async def test_get_transcripts(mock_db):
    mock_cursor = MagicMock()
    mock_transcripts = [
        {"session_id": "session123", "role": "user", "content": "Hello", "timestamp": datetime.now(timezone.utc)},
        {"session_id": "session123", "role": "ai", "content": "Hi", "timestamp": datetime.now(timezone.utc)}
    ]
    mock_cursor.to_list = AsyncMock(return_value=mock_transcripts)
    # mock the chaining .sort() method to return mock_cursor itself
    mock_cursor.sort = MagicMock(return_value=mock_cursor)
    mock_db.transcripts.find = MagicMock(return_value=mock_cursor)
    
    result = await get_transcripts("session123")
    assert result == mock_transcripts
    mock_db.transcripts.find.assert_called_once_with({"session_id": "session123"})
    mock_cursor.sort.assert_called_once_with("timestamp", 1)
    mock_cursor.to_list.assert_called_once_with(length=1000)

@pytest.mark.asyncio
async def test_save_evaluation(mock_db):
    mock_db.evaluations.insert_one = AsyncMock()
    eval_data = {
        "score": 85,
        "strengths": ["Communication"],
        "improvements": ["Technical depth"]
    }
    
    await save_evaluation("session123", eval_data)
    
    mock_db.evaluations.insert_one.assert_called_once()
    called_arg = mock_db.evaluations.insert_one.call_args[0][0]
    assert called_arg["session_id"] == "session123"
    assert called_arg["score"] == 85
    assert called_arg["strengths"] == ["Communication"]
    assert called_arg["improvements"] == ["Technical depth"]
    assert "created_at" in called_arg

@pytest.mark.asyncio
async def test_get_evaluation(mock_db):
    mock_eval = {
        "session_id": "session123",
        "score": 85,
        "strengths": ["Communication"],
        "improvements": ["Technical depth"]
    }
    mock_db.evaluations.find_one = AsyncMock(return_value=mock_eval)
    
    result = await get_evaluation("session123")
    assert result == mock_eval
    mock_db.evaluations.find_one.assert_called_once_with({"session_id": "session123"})
