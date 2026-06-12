import logging
from typing import Optional
from app.llm.gemini_provider import GeminiProvider
from app.llm.groq_provider import GroqProvider
from app.llm.deepseek_provider import DeepSeekProvider

logger = logging.getLogger(__name__)

class LLMOrchestrator:
    """
    Routes LLM calls through a fallback chain:
    Groq (Llama 3) → Gemini Flash → DeepSeek Chat
    """

    def __init__(self):
        self.providers = [
            ("groq", GroqProvider()),
            ("gemini", GeminiProvider()),
            ("deepseek", DeepSeekProvider()),
        ]

    async def generate(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        max_tokens: int = 1000,
        temperature: float = 0.7,
    ) -> str:
        last_error = None

        for name, provider in self.providers:
            if not provider.is_available():
                logger.info(f"Provider {name} not configured, skipping.")
                continue

            try:
                logger.info(f"Attempting generation with provider: {name}")
                result = await provider.generate(
                    prompt=prompt,
                    system_prompt=system_prompt,
                    max_tokens=max_tokens,
                    temperature=temperature,
                )
                logger.info(f"Successfully generated with {name}")
                return result

            except Exception as e:
                logger.warning(f"Provider {name} failed: {str(e)}")
                last_error = e
                continue

        raise RuntimeError(
            f"All LLM providers failed. Last error: {last_error}"
        )

# Singleton instance
llm = LLMOrchestrator()
