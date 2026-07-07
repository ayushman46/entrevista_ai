import edge_tts
import io

async def synthesize_sentence(text: str) -> bytes:
    """Takes a sentence and returns audio bytes (mp3 usually for edge_tts)."""
    # voice "en-US-AriaNeural", "en-US-GuyNeural"
    voice = "en-US-AriaNeural"
    communicate = edge_tts.Communicate(text, voice)
    
    audio_bytes = bytearray()
    async for chunk in communicate.stream():
        if chunk["type"] == "audio":
            audio_bytes.extend(chunk["data"])
            
    return bytes(audio_bytes)
