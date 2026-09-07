import os
from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.services.llm_chain import SENTENCE_END, _nvidia_generate, generate, generate_sentences


def test_sentence_end_regex():
    text = "Hello! How are you?\nFine. Good day."
    matches = [match.group(0) for match in SENTENCE_END.finditer(text)]
    assert any("!" in match for match in matches)
    assert any("?" in match for match in matches)
    assert any("\n" in match for match in matches)
    assert any("." in match for match in matches)


@pytest.mark.asyncio
async def test_generate_requires_nvidia_key():
    with patch.dict(os.environ, {}, clear=True):
        result = [
            chunk async for chunk in generate([{"role": "user", "content": "hi"}])
        ]

    assert result == ["Error: NVIDIA_API_KEY is not configured."]


@pytest.mark.asyncio
async def test_generate_uses_only_nvidia_when_configured():
    async def mock_nvidia(messages, purpose):
        assert messages == [{"role": "user", "content": "hi"}]
        assert purpose == "analysis"
        yield "NVIDIA success"

    with patch.dict(os.environ, {"NVIDIA_API_KEY": "nkey"}, clear=True):
        with patch("app.services.llm_chain._nvidia_generate", side_effect=mock_nvidia):
            result = [
                chunk
                async for chunk in generate(
                    [{"role": "user", "content": "hi"}], purpose="analysis"
                )
            ]

    assert result == ["NVIDIA success"]


@pytest.mark.asyncio
async def test_nvidia_request_uses_analysis_model_and_reasoning():
    async def mock_stream():
        yield SimpleNamespace(
            choices=[SimpleNamespace(delta=SimpleNamespace(content="analysis"))]
        )

    client = MagicMock()
    client.chat.completions.create = AsyncMock(return_value=mock_stream())
    client.close = AsyncMock()

    with patch.dict(os.environ, {"NVIDIA_API_KEY": "nkey"}, clear=True):
        with patch("openai.AsyncOpenAI", return_value=client) as mock_openai:
            result = [
                chunk
                async for chunk in _nvidia_generate(
                    [{"role": "user", "content": "evaluate this"}],
                    purpose="analysis",
                )
            ]

    request = client.chat.completions.create.call_args.kwargs
    assert result == ["analysis"]
    assert request["model"] == "nvidia/nemotron-3-super-120b-a12b"
    assert request["stream"] is True
    assert request["extra_body"] == {
            "chat_template_kwargs": {"enable_thinking": True},
            "reasoning_budget": 1024,
        }
    assert mock_openai.call_args.kwargs["timeout"] == 45.0


@pytest.mark.asyncio
async def test_generate_sentences_splitting():
    async def mock_generate(messages):
        yield "Hello! How "
        yield "are you?\n"
        yield "I am fine. Thanks"

    with patch.dict(os.environ, {"NVIDIA_API_KEY": "nkey"}):
        with patch("app.services.llm_chain.generate", side_effect=mock_generate):
            sentences = [
                sentence
                async for sentence in generate_sentences(
                    [{"role": "user", "content": "hi"}]
                )
            ]

    assert sentences == ["Hello!", "How are you?", "I am fine.", "Thanks"]
