import pytest
from unittest.mock import patch, AsyncMock, MagicMock
import os
import re

from app.services.llm_chain import (
    SENTENCE_END,
    generate,
    generate_sentences
)

# Test sentence splitter regex
def test_sentence_end_regex():
    text = "Hello! How are you?\nFine. Good day."
    # Find all matches using SENTENCE_END
    matches = [m.group(0) for m in SENTENCE_END.finditer(text)]
    assert any("!" in m for m in matches)
    assert any("?" in m for m in matches)
    assert any("\n" in m for m in matches)
    assert any("." in m for m in matches)

@pytest.mark.asyncio
async def test_generate_no_keys():
    # Test with no API keys configured
    with patch.dict(os.environ, {}, clear=True):
        res = []
        async for chunk in generate([{"role": "user", "content": "hi"}]):
            res.append(chunk)
        assert len(res) == 1
        assert "Error: No LLM API keys configured." in res[0]

@pytest.mark.asyncio
async def test_generate_fallback_success():
    # Setup: GROQ_API_KEY and DEEPSEEK_API_KEY are configured.
    # Groq fails immediately, Deepseek succeeds.
    async def mock_groq(messages):
        if False: yield # make it an async generator
        raise Exception("Groq failed")
        
    async def mock_deepseek(messages):
        yield "Deep"
        yield "seek"
        yield " success"

    with patch.dict(os.environ, {"GROQ_API_KEY": "gkey", "DEEPSEEK_API_KEY": "dkey"}):
        with patch("app.services.llm_chain._groq_generate", side_effect=mock_groq) as mock_g, \
             patch("app.services.llm_chain._deepseek_generate", side_effect=mock_deepseek) as mock_d:
            mock_g.__name__ = "_groq_generate"
            mock_d.__name__ = "_deepseek_generate"
            res = []
            async for chunk in generate([{"role": "user", "content": "hi"}]):
                res.append(chunk)
            assert "".join(res) == "Deepseek success"

@pytest.mark.asyncio
async def test_generate_mid_stream_failure():
    # Setup: GROQ_API_KEY and DEEPSEEK_API_KEY are configured.
    # Groq yields some contents and then fails mid-stream.
    # Deepseek should NOT be called.
    async def mock_groq(messages):
        yield "Groq"
        yield " partial"
        raise Exception("Groq mid-stream crash")

    mock_deepseek = AsyncMock()

    with patch.dict(os.environ, {"GROQ_API_KEY": "gkey", "DEEPSEEK_API_KEY": "dkey"}):
        with patch("app.services.llm_chain._groq_generate", side_effect=mock_groq) as mock_g, \
             patch("app.services.llm_chain._deepseek_generate", mock_deepseek) as mock_d:
            mock_g.__name__ = "_groq_generate"
            mock_d.__name__ = "_deepseek_generate"
            res = []
            async for chunk in generate([{"role": "user", "content": "hi"}]):
                res.append(chunk)
            assert "".join(res) == "Groq partial"
            mock_deepseek.assert_not_called()

@pytest.mark.asyncio
async def test_generate_sentences_splitting():
    # Test sentence generation split logic
    async def mock_gen(messages):
        yield "Hello! How "
        yield "are you?\n"
        yield "I am fine. Thanks"

    with patch.dict(os.environ, {"GROQ_API_KEY": "gkey"}):
        with patch("app.services.llm_chain.generate", side_effect=mock_gen):
            sentences = []
            async for s in generate_sentences([{"role": "user", "content": "hi"}]):
                sentences.append(s)
            
            assert sentences == [
                "Hello!",
                "How are you?",
                "I am fine.",
                "Thanks"
            ]
