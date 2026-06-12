from openai import AsyncOpenAI
from app.llm.base import BaseLLMProvider
from app.config import settings
from typing import Optional

class DeepSeekProvider(BaseLLMProvider):
    def __init__(self):
        if settings.DEEPSEEK_API_KEY:
            self.client = AsyncOpenAI(
                api_key=settings.DEEPSEEK_API_KEY,
                base_url="https://api.deepseek.com/v1",
            )
        else:
            self.client = None

    def is_available(self) -> bool:
        return self.client is not None and bool(settings.DEEPSEEK_API_KEY)

    async def generate(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        max_tokens: int = 1000,
        temperature: float = 0.7,
    ) -> str:
        if not self.is_available():
            raise RuntimeError("DeepSeek not configured")

        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})

        response = await self.client.chat.completions.create(
            model="deepseek-chat",
            messages=messages,
            max_tokens=max_tokens,
            temperature=temperature,
        )
        return response.choices[0].message.content
