import asyncio
import os
from dotenv import load_dotenv
load_dotenv()
from groq import AsyncGroq

async def main():
    api_key = os.environ.get("GROQ_API_KEY")
    if not api_key:
        print("NO GROQ API KEY")
        return
    client = AsyncGroq(api_key=api_key)
    
    # create a dummy wav file
    # standard 44 byte wav header + some silence
    wav_header = bytes.fromhex("524946462400000057415645666d74201000000001000100803e0000007d0000020010006461746100000000")
    
    try:
        file_tuple = ("audio.wav", wav_header)
        res = await client.audio.transcriptions.create(
            file=file_tuple,
            model="whisper-large-v3-turbo",
            response_format="text"
        )
        print("STT SUCCESS:", res)
    except Exception as e:
        print("STT FAILED:", e)

if __name__ == "__main__":
    asyncio.run(main())
