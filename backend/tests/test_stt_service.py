import pytest
from unittest.mock import patch, AsyncMock
import os
from app.services.stt_service import transcribe_audio

@pytest.mark.asyncio
async def test_transcribe_audio_missing_key():
    with patch.dict(os.environ, {}, clear=True):
        result = await transcribe_audio(b"fake audio data")
        assert result == "I could not hear that, my API key is missing."

@pytest.mark.asyncio
async def test_transcribe_audio_success():
    mock_client = AsyncMock()
    mock_client.audio.transcriptions.create = AsyncMock(return_value=" Hello, this is a test. ")

    with patch.dict(os.environ, {"GROQ_API_KEY": "fake_groq_key"}):
        with patch("app.services.stt_service.AsyncGroq", return_value=mock_client):
            result = await transcribe_audio(b"some audio bytes")
            assert result == "Hello, this is a test."
            mock_client.audio.transcriptions.create.assert_called_once_with(
                file=("audio.wav", b"some audio bytes"),
                model="whisper-large-v3-turbo",
                response_format="text"
            )

@pytest.mark.asyncio
async def test_transcribe_audio_exception():
    mock_client = AsyncMock()
    mock_client.audio.transcriptions.create = AsyncMock(side_effect=Exception("Groq STT error"))

    with patch.dict(os.environ, {"GROQ_API_KEY": "fake_groq_key"}):
        with patch("app.services.stt_service.AsyncGroq", return_value=mock_client):
            result = await transcribe_audio(b"some audio bytes")
            assert result == ""
