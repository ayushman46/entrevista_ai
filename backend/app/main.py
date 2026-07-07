from dotenv import load_dotenv
load_dotenv(override=True)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.db.mongo import init_db, close_db
from app.api import websocket, resume, interview, report
from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield
    await close_db()

app = FastAPI(lifespan=lifespan)

import os

cors_origins = os.environ.get("CORS_ORIGINS", "*")
origins = [origin.strip() for origin in cors_origins.split(",")] if cors_origins else ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(websocket.router)
app.include_router(resume.router)
app.include_router(interview.router)
app.include_router(report.router)

@app.get("/")
def health_check():
    return {"status": "ok"}
