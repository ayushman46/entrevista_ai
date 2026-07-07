from fastapi import APIRouter, File, UploadFile, HTTPException
from pypdf import PdfReader
import io

router = APIRouter()

@router.post("/api/resume/upload")
async def upload_resume(file: UploadFile = File(...)):
    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF allowed")
        
    try:
        content = await file.read()
        reader = PdfReader(io.BytesIO(content))
        text = ""
        for page in reader.pages:
            extracted = page.extract_text()
            if extracted:
                text += extracted + "\n"
                
        # we don't save it to a separate collection here to keep it simple,
        # the frontend will hold the text and send it when starting the interview.
        return {"text": text.strip()}
    except Exception as e:
        print(f"Error parsing PDF: {e}")
        raise HTTPException(status_code=422, detail="Failed to parse PDF. The file may be corrupt or encrypted.")
