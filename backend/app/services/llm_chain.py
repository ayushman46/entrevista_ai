import os
import re
from typing import AsyncIterator

# Sentence splitting pattern
SENTENCE_END = re.compile(r'([.!?\n]+)')

NVIDIA_BASE_URL = "https://integrate.api.nvidia.com/v1"
NVIDIA_REALTIME_MODEL = "nvidia/nemotron-3.5-lightning-30b-a3b"
NVIDIA_ANALYSIS_MODEL = "nvidia/nemotron-3-super-120b-a12b"
_nvidia_clients = {}
_nvidia_client_configs = {}


def _env_bool(name: str, default: bool) -> bool:
    value = os.environ.get(name)
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


def _env_int(name: str, default: int) -> int:
    try:
        return int(os.environ.get(name, default))
    except (TypeError, ValueError):
        return default


def _env_float(name: str, default: float) -> float:
    try:
        return float(os.environ.get(name, default))
    except (TypeError, ValueError):
        return default


async def _nvidia_generate(messages: list, purpose: str = "realtime") -> AsyncIterator[str]:
    """Stream from NVIDIA's OpenAI-compatible hosted endpoint without blocking FastAPI."""
    from openai import AsyncOpenAI

    is_analysis = purpose == "analysis"
    model = os.environ.get(
        "NVIDIA_ANALYSIS_MODEL" if is_analysis else "NVIDIA_REALTIME_MODEL",
        NVIDIA_ANALYSIS_MODEL if is_analysis else NVIDIA_REALTIME_MODEL,
    )
    enable_thinking = _env_bool(
        "NVIDIA_ANALYSIS_THINKING" if is_analysis else "NVIDIA_REALTIME_THINKING",
        is_analysis,
    )
    base_url = os.environ.get("NVIDIA_BASE_URL", NVIDIA_BASE_URL)
    api_key = os.environ["NVIDIA_API_KEY"]
    client_config = (base_url, api_key)
    client_key = "analysis" if is_analysis else "realtime"
    global _nvidia_clients, _nvidia_client_configs
    if (
        client_key not in _nvidia_clients
        or _nvidia_client_configs.get(client_key) != client_config
    ):
        _nvidia_clients[client_key] = AsyncOpenAI(
            base_url=base_url,
            api_key=api_key,
            max_retries=0,
            timeout=_env_float(
                "NVIDIA_ANALYSIS_TIMEOUT" if is_analysis else "NVIDIA_REALTIME_TIMEOUT",
                45.0 if is_analysis else 15.0,
            ),
        )
        _nvidia_client_configs[client_key] = client_config
    client = _nvidia_clients[client_key]

    request = {
        "model": model,
        "messages": messages,
        "temperature": _env_float(
            "NVIDIA_ANALYSIS_TEMPERATURE" if is_analysis else "NVIDIA_REALTIME_TEMPERATURE",
            0.3 if is_analysis else 0.7,
        ),
        "top_p": _env_float("NVIDIA_TOP_P", 0.95),
        "max_tokens": _env_int(
            "NVIDIA_ANALYSIS_MAX_TOKENS" if is_analysis else "NVIDIA_REALTIME_MAX_TOKENS",
            2_048 if is_analysis else 512,
        ),
        "stream": True,
        "extra_body": {
            "chat_template_kwargs": {"enable_thinking": enable_thinking},
        },
    }
    if enable_thinking:
        request["extra_body"]["reasoning_budget"] = _env_int(
            "NVIDIA_ANALYSIS_REASONING_BUDGET" if is_analysis else "NVIDIA_REALTIME_REASONING_BUDGET",
            1_024 if is_analysis else 0,
        )

    completion = await client.chat.completions.create(**request)
    async for chunk in completion:
        if not chunk.choices:
            continue
        content = chunk.choices[0].delta.content
        # Reasoning content is deliberately ignored; only speak/display the final answer.
        if content:
            yield content


async def close_nvidia_clients() -> None:
    """Close pooled HTTP clients during application shutdown."""
    clients = list(_nvidia_clients.values())
    _nvidia_clients.clear()
    _nvidia_client_configs.clear()
    for client in clients:
        await client.close()

async def generate(messages: list, purpose: str = "realtime") -> AsyncIterator[str]:
    """Generate exclusively through NVIDIA's hosted API Catalog endpoint."""
    if not os.environ.get("NVIDIA_API_KEY"):
        yield "Error: NVIDIA_API_KEY is not configured."
        return

    try:
        async for chunk in _nvidia_generate(messages, purpose):
            yield chunk
    except Exception as exc:
        print(f"NVIDIA generation failed: {exc}")
        yield "Error: NVIDIA generation failed."

async def generate_sentences(messages: list, purpose: str = "realtime") -> AsyncIterator[str]:
    """Yields complete sentences as they stream from the LLM."""
    buffer = ""
    # Keep the default call signature compatible with existing provider adapters and tests.
    stream = generate(messages) if purpose == "realtime" else generate(messages, purpose=purpose)
    async for chunk in stream:
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
