from groq import AsyncGroq
from app.llm.base import BaseLLMProvider
from app.config import settings
from typing import Optional

class GroqProvider(BaseLLMProvider):
    def __init__(self):
        if settings.GROQ_API_KEY:
            self.client = AsyncGroq(api_key=settings.GROQ_API_KEY)
        else:
            self.client = None

    def is_available(self) -> bool:
        return self.client is not None and bool(settings.GROQ_API_KEY)

    async def generate(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        max_tokens: int = 1000,
        temperature: float = 0.7,
    ) -> str:
        if not self.is_available():
            raise RuntimeError("Groq not configured")

        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})

        response = await self.client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=messages,
            max_tokens=max_tokens,
            temperature=temperature,
        )
        return response.choices[0].message.content
