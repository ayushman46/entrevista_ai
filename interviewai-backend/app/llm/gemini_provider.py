import google.generativeai as genai
from app.llm.base import BaseLLMProvider
from app.config import settings
from typing import Optional

class GeminiProvider(BaseLLMProvider):
    def __init__(self):
        if settings.GEMINI_API_KEY:
            genai.configure(api_key=settings.GEMINI_API_KEY)
            self.model = genai.GenerativeModel("gemini-1.5-flash")
        else:
            self.model = None

    def is_available(self) -> bool:
        return self.model is not None and bool(settings.GEMINI_API_KEY)

    async def generate(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        max_tokens: int = 1000,
        temperature: float = 0.7,
    ) -> str:
        if not self.is_available():
            raise RuntimeError("Gemini not configured")

        full_prompt = f"{system_prompt}\n\n{prompt}" if system_prompt else prompt

        generation_config = genai.types.GenerationConfig(
            max_output_tokens=max_tokens,
            temperature=temperature,
        )

        response = await self.model.generate_content_async(
            full_prompt,
            generation_config=generation_config,
        )
        return response.text
