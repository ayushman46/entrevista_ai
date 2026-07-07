from fastapi import APIRouter, File, UploadFile
from pypdf import PdfReader
import io

router = APIRouter()

@router.post("/api/resume/upload")
async def upload_resume(file: UploadFile = File(...)):
    if not file.filename.endswith('.pdf'):
        return {"error": "Only PDF allowed"}
        
    content = await file.read()
    reader = PdfReader(io.BytesIO(content))
    text = ""
    for page in reader.pages:
        text += page.extract_text() + "\n"
        
    # we don't save it to a separate collection here to keep it simple,
    # the frontend will hold the text and send it when starting the interview.
    return {"text": text.strip()}
