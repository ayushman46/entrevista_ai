import logging
import asyncio
from typing import Optional
from app.llm.gemini_provider import GeminiProvider
from app.llm.groq_provider import GroqProvider
from app.llm.deepseek_provider import DeepSeekProvider

logger = logging.getLogger(__name__)

class LLMOrchestrator:
    """
    Routes LLM calls through a fallback chain:
    Gemini Flash → Groq (Llama 3) → DeepSeek Chat
    """

    def __init__(self):
        self.providers = [
            ("gemini", GeminiProvider()),
            ("groq", GroqProvider()),
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
                start_time = asyncio.get_event_loop().time()
                logger.info(f"Attempting generation with provider: {name}")
                # Enforce explicit 7-second timeout
                result = await asyncio.wait_for(
                    provider.generate(
                        prompt=prompt,
                        system_prompt=system_prompt,
                        max_tokens=max_tokens,
                        temperature=temperature,
                    ),
                    timeout=7.0
                )
                latency = asyncio.get_event_loop().time() - start_time
                logger.info(f"Successfully generated with {name}. Latency: {latency:.2f}s")
                return result

            except asyncio.TimeoutError:
                latency = asyncio.get_event_loop().time() - start_time
                logger.warning(f"Provider {name} failed after {latency:.2f}s: Timeout. Triggering fallback.")
                last_error = "Timeout"
                continue
            except Exception as e:
                latency = asyncio.get_event_loop().time() - start_time
                logger.warning(f"Provider {name} failed after {latency:.2f}s: {str(e)}. Triggering fallback.")
                last_error = e
                continue

        raise RuntimeError(
            f"All LLM providers failed. Last error: {last_error}"
        )

# Singleton instance
llm = LLMOrchestrator()
