import os
import uuid
import edge_tts
from groq import AsyncGroq
from app.config import settings

# Ensure audio directory exists
AUDIO_DIR = os.path.join(settings.UPLOAD_DIR, "audio")
os.makedirs(AUDIO_DIR, exist_ok=True)

# Initialize Groq client for Whisper STT
groq_client = AsyncGroq(api_key=settings.GROQ_API_KEY)

async def transcribe_audio(file_path: str) -> str:
    """Use Groq Whisper to transcribe an audio file."""
    if not settings.GROQ_API_KEY:
        raise ValueError("GROQ_API_KEY is not set.")
    
    with open(file_path, "rb") as file:
        transcription = await groq_client.audio.transcriptions.create(
            file=(os.path.basename(file_path), file.read()),
            model="whisper-large-v3",
            response_format="json",
            language="en"
        )
    return transcription.text

async def generate_tts(text: str) -> str:
    """Use Edge-TTS to generate speech from text and return the filename."""
    if not text:
        return ""
        
    filename = f"tts_{uuid.uuid4().hex}.mp3"
    filepath = os.path.join(AUDIO_DIR, filename)
    
    # "en-US-AriaNeural" or "en-US-ChristopherNeural" are high quality
    communicate = edge_tts.Communicate(text, "en-US-ChristopherNeural", rate="+0%")
    await communicate.save(filepath)
    
    return filename
