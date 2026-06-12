import os
import io
import pytest
from fastapi.testclient import TestClient
from reportlab.pdfgen import canvas
from app.main import app

client = TestClient(app)

@pytest.fixture(scope="module")
def dummy_resume_pdf():
    """Create a dummy PDF file in memory to simulate a resume upload."""
    pdf_buffer = io.BytesIO()
    c = canvas.Canvas(pdf_buffer)
    c.drawString(100, 750, "John Doe")
    c.drawString(100, 730, "Senior Software Engineer")
    c.drawString(100, 710, "Skills: Python, React, FastAPI, SQL, Docker")
    c.drawString(100, 690, "Experience: 5 years building scalable web applications.")
    c.save()
    pdf_buffer.seek(0)
    return pdf_buffer

def test_health_check():
    """Verify the health endpoint is active."""
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"

def test_end_to_end_interview_flow(dummy_resume_pdf):
    """
    Test the entire interview lifecycle:
    1. Upload resume
    2. Start interview
    3. Submit an answer
    4. Get analytics
    5. Complete interview (Generate PDF)
    """
    # 1. Upload Resume
    files = {"file": ("resume.pdf", dummy_resume_pdf, "application/pdf")}
    upload_response = client.post("/resume/upload", files=files)
    
    assert upload_response.status_code == 200, upload_response.text
    upload_data = upload_response.json()
    assert "resume_id" in upload_data
    assert "interview_topics" in upload_data
    
    resume_id = upload_data["resume_id"]
    
    # 2. Start Interview
    start_payload = {
        "resume_id": resume_id,
        "candidate_name": "John Doe Test",
        "role": "backend_developer"
    }
    start_response = client.post("/interview/start", json=start_payload)
    
    assert start_response.status_code == 200, start_response.text
    start_data = start_response.json()
    assert "interview_id" in start_data
    assert "first_question" in start_data
    
    interview_id = start_data["interview_id"]
    
    # 3. Submit an Answer
    answer_payload = {
        "interview_id": interview_id,
        "question_index": 0,
        "answer_text": "I would use a relational database like PostgreSQL for structured data and add a caching layer with Redis to optimize read queries and improve performance."
    }
    answer_response = client.post("/interview/answer", json=answer_payload)
    
    assert answer_response.status_code == 200, answer_response.text
    answer_data = answer_response.json()
    assert "evaluation" in answer_data
    assert "technical_score" in answer_data["evaluation"]
    
    # 4. Get Analytics
    analytics_response = client.get(f"/report/{interview_id}/analytics")
    assert analytics_response.status_code == 200, analytics_response.text
    analytics_data = analytics_response.json()
    assert analytics_data["questions_completed"] >= 1
    
    # 5. Complete Interview (Trigger Report Generation)
    complete_response = client.post(f"/interview/complete/{interview_id}")
    assert complete_response.status_code == 200, complete_response.text
    complete_data = complete_response.json()
    assert "overall_score" in complete_data
    assert "pdf_url" in complete_data
    
    # Verify PDF physically exists
    pdf_filename = complete_data["pdf_url"].split("/")[-1]
    assert os.path.exists(f"reports/{pdf_filename}")
