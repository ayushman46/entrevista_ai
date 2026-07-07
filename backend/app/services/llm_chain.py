import os
import re
import asyncio
from typing import AsyncIterator
from groq import AsyncGroq
import httpx
import google.generativeai as genai

# Sentence splitting pattern
SENTENCE_END = re.compile(r'([.!?\n]+)')

async def _groq_generate(messages: list) -> AsyncIterator[str]:
    client = AsyncGroq(api_key=os.environ["GROQ_API_KEY"])
    response = await client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=messages,
        stream=True
    )
    async for chunk in response:
        if chunk.choices and chunk.choices[0].delta.content:
            yield chunk.choices[0].delta.content

async def _deepseek_generate(messages: list) -> AsyncIterator[str]:
    api_key = os.environ["DEEPSEEK_API_KEY"]
    async with httpx.AsyncClient() as client:
        req = {
            "model": "deepseek-chat",
            "messages": messages,
            "stream": True
        }
        headers = {"Authorization": f"Bearer {api_key}"}
        async with client.stream("POST", "https://api.deepseek.com/chat/completions", json=req, headers=headers) as response:
            if response.status_code != 200:
                raise Exception(f"Deepseek error: {response.status_code}")
            async for line in response.aiter_lines():
                if line.startswith("data: ") and line != "data: [DONE]":
                    import json
                    data = json.loads(line[6:])
                    if data["choices"] and data["choices"][0]["delta"].get("content"):
                        yield data["choices"][0]["delta"]["content"]

async def _gemini_generate(messages: list) -> AsyncIterator[str]:
    genai.configure(api_key=os.environ["GEMINI_API_KEY"])
    # Convert OpenAI message format to Gemini format
    gemini_messages = []
    system_prompt = ""
    for m in messages:
        if m["role"] == "system":
            system_prompt += m["content"] + "\n"
        elif m["role"] == "user":
            gemini_messages.append({"role": "user", "parts": [m["content"]]})
        elif m["role"] == "assistant":
            gemini_messages.append({"role": "model", "parts": [m["content"]]})
            
    model = genai.GenerativeModel("gemini-2.0-flash", system_instruction=system_prompt)
    response = await asyncio.to_thread(
        model.generate_content, gemini_messages, stream=True
    )
    for chunk in response:
        yield chunk.text

async def generate(messages: list) -> AsyncIterator[str]:
    # Fallback chain: Groq -> DeepSeek -> Gemini
    generators = []
    if os.environ.get("GROQ_API_KEY"):
        generators.append(_groq_generate)
    if os.environ.get("DEEPSEEK_API_KEY"):
        generators.append(_deepseek_generate)
    if os.environ.get("GEMINI_API_KEY"):
        generators.append(_gemini_generate)
        
    if not generators:
        yield "Error: No LLM API keys configured."
        return

    for i, gen_func in enumerate(generators):
        try:
            # We must yield from it
            # If it fails before yielding the first chunk, we catch it
            # If it fails mid-stream, we might have partial responses.
            first = True
            async for chunk in gen_func(messages):
                first = False
                yield chunk
            # If we successfully completed the stream, break out of fallback chain
            break
        except Exception as e:
            print(f"Provider {gen_func.__name__} failed: {e}")
            if first:
                # Try next provider
                continue
            else:
                # We already yielded some chunks, so falling back would repeat text.
                # Just break.
                break

async def generate_sentences(messages: list) -> AsyncIterator[str]:
    """Yields complete sentences as they stream from the LLM."""
    buffer = ""
    async for chunk in generate(messages):
        buffer += chunk
        # Check if we have sentence terminators in the buffer
        while True:
            match = SENTENCE_END.search(buffer)
            if not match:
                break
            
            # Found a boundary
            end_idx = match.end()
            sentence = buffer[:end_idx].strip()
            buffer = buffer[end_idx:]
            
            if sentence:
                yield sentence
                
    # Yield remaining text
    buffer = buffer.strip()
    if buffer:
        yield buffer
