import os
from groq import AsyncGroq

async def transcribe_audio(audio_bytes: bytes) -> str:
    """Transcribe candidate audio with Groq Whisper; no language generation happens here."""
    groq_api_key = os.environ.get("GROQ_API_KEY")
    if not groq_api_key:
        print("GROQ_API_KEY not set")
        return "I could not hear that, my API key is missing."
        
    client = AsyncGroq(api_key=groq_api_key)
    
    # We must provide a file-like object with a name so Groq recognizes it as audio
    # The client sends webm/opus
    try:
        # groq expects a tuple (filename, file_content)
        file_tuple = ("audio.wav", audio_bytes)
        
        response = await client.audio.transcriptions.create(
            file=file_tuple,
            model="whisper-large-v3-turbo",
            response_format="text",
            language="en",
            temperature=0.0,
        )
        return response.strip()
    except Exception as e:
        print(f"Error in transcription: {e}")
        return ""
