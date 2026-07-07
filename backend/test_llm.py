import asyncio
import os
from dotenv import load_dotenv
load_dotenv()
from app.services.llm_chain import generate_sentences

async def main():
    messages = [
        {"role": "user", "content": "Tell me a short joke."}
    ]
    try:
        async for sentence in generate_sentences(messages):
            print("SENTENCE:", sentence)
    except Exception as e:
        print("LLM FAILED:", e)

if __name__ == "__main__":
    asyncio.run(main())
