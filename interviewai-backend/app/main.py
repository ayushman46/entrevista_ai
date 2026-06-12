from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.config import settings
from app.api import resume, interview, report

app = FastAPI(
    title="InterviewAI",
    description="AI-powered voice mock interview platform",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(resume.router, prefix="/resume", tags=["Resume"])
app.include_router(interview.router, prefix="/interview", tags=["Interview"])
app.include_router(report.router, prefix="/report", tags=["Report"])

# Serve generated reports as static files
app.mount("/reports", StaticFiles(directory=settings.REPORT_DIR), name="reports")

@app.get("/health")
async def health():
    return {"status": "ok", "service": "InterviewAI Backend"}
