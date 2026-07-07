import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock, AsyncMock
import io
import json

from app.main import app

@pytest.fixture(autouse=True)
def mock_db_lifespan():
    with patch("app.db.mongo.init_db", new_callable=AsyncMock), \
         patch("app.db.mongo.close_db", new_callable=AsyncMock):
        yield

client = TestClient(app)

# 1. Resume upload routes
def test_upload_resume_success():
    mock_page = MagicMock()
    mock_page.extract_text.return_value = "Python Developer with 5 years experience."
    mock_reader = MagicMock()
    mock_reader.pages = [mock_page]
    
    with patch("app.api.resume.PdfReader", return_value=mock_reader):
        pdf_content = b"%PDF-1.4 mock pdf content"
        response = client.post(
            "/api/resume/upload",
            files={"file": ("resume.pdf", pdf_content, "application/pdf")}
        )
        assert response.status_code == 200
        assert response.json() == {"text": "Python Developer with 5 years experience."}

def test_upload_resume_invalid_format():
    response = client.post(
        "/api/resume/upload",
        files={"file": ("resume.txt", b"plain text content", "text/plain")}
    )
    assert response.status_code == 200
    assert response.json() == {"error": "Only PDF allowed"}


# 2. Start session routes
@patch("app.api.interview.create_session", new_callable=AsyncMock)
def test_start_interview(mock_create_session):
    mock_create_session.return_value = "60b9f150e21a2c3f88f12345"
    
    payload = {
        "name": "Jane Doe",
        "role": "QA Automation Engineer",
        "resume_text": "Experienced QA professional"
    }
    response = client.post("/api/interview/start", json=payload)
    assert response.status_code == 200
    assert response.json() == {"session_id": "60b9f150e21a2c3f88f12345"}
    mock_create_session.assert_called_once()

@patch("app.api.interview.get_session", new_callable=AsyncMock)
def test_get_interview_success(mock_get_session):
    mock_get_session.return_value = {
        "candidate_name": "Jane Doe",
        "target_role": "QA Automation Engineer",
        "status": "active"
    }
    
    response = client.get("/api/interview/60b9f150e21a2c3f88f12345")
    assert response.status_code == 200
    assert response.json() == {
        "candidate_name": "Jane Doe",
        "target_role": "QA Automation Engineer",
        "status": "active"
    }
    mock_get_session.assert_called_once_with("60b9f150e21a2c3f88f12345")

@patch("app.api.interview.get_session", new_callable=AsyncMock)
def test_get_interview_not_found(mock_get_session):
    mock_get_session.return_value = None
    
    response = client.get("/api/interview/nonexistent_id")
    assert response.status_code == 200
    assert response.json() == {"error": "Not found"}


# 3. Get report routes
@patch("app.api.report.get_evaluation", new_callable=AsyncMock)
def test_get_report_existing_eval(mock_get_evaluation):
    mock_get_evaluation.return_value = {
        "score": 90,
        "strengths": ["Testing skill"],
        "improvements": ["Deployment knowledge"]
    }
    
    response = client.get("/api/report/60b9f150e21a2c3f88f12345")
    assert response.status_code == 200
    assert response.json() == {
        "score": 90,
        "strengths": ["Testing skill"],
        "improvements": ["Deployment knowledge"]
    }
    mock_get_evaluation.assert_called_once_with("60b9f150e21a2c3f88f12345")

@patch("app.api.report.get_evaluation", new_callable=AsyncMock)
@patch("app.api.report.get_transcripts", new_callable=AsyncMock)
def test_get_report_no_transcripts(mock_get_transcripts, mock_get_evaluation):
    mock_get_evaluation.return_value = None
    mock_get_transcripts.return_value = []
    
    response = client.get("/api/report/60b9f150e21a2c3f88f12345")
    assert response.status_code == 200
    assert response.json() == {"error": "No transcripts found"}

@patch("app.api.report.get_evaluation", new_callable=AsyncMock)
@patch("app.api.report.get_transcripts", new_callable=AsyncMock)
@patch("app.api.report.save_evaluation", new_callable=AsyncMock)
def test_get_report_generated_success(mock_save_evaluation, mock_get_transcripts, mock_get_evaluation):
    mock_get_evaluation.return_value = None
    mock_get_transcripts.return_value = [
        {"role": "ai", "content": "Tell me about yourself."},
        {"role": "user", "content": "I am a QA engineer."}
    ]
    
    # Mock llm generate function
    async def mock_generate(messages):
        yield '{"score": 88, '
        yield '"strengths": ["Fast communication"], '
        yield '"improvements": ["None"]}'
        
    with patch("app.api.report.generate", side_effect=mock_generate):
        response = client.get("/api/report/60b9f150e21a2c3f88f12345")
        assert response.status_code == 200
        result = response.json()
        assert result["score"] == 88
        assert result["strengths"] == ["Fast communication"]
        assert result["improvements"] == ["None"]
        mock_save_evaluation.assert_called_once_with("60b9f150e21a2c3f88f12345", result)

@patch("app.api.report.get_evaluation", new_callable=AsyncMock)
@patch("app.api.report.get_transcripts", new_callable=AsyncMock)
def test_get_report_parsing_failure(mock_get_transcripts, mock_get_evaluation):
    mock_get_evaluation.return_value = None
    mock_get_transcripts.return_value = [
        {"role": "ai", "content": "Tell me about yourself."},
        {"role": "user", "content": "I am a QA engineer."}
    ]
    
    async def mock_generate_broken(messages):
        yield 'invalid json format'
        
    with patch("app.api.report.generate", side_effect=mock_generate_broken):
        response = client.get("/api/report/60b9f150e21a2c3f88f12345")
        assert response.status_code == 200
        assert response.json() == {
            "score": 0,
            "strengths": ["Evaluation failed"],
            "improvements": []
        }
