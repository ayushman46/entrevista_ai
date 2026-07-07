import pytest
from unittest.mock import patch, MagicMock
from app.services.tts_service import synthesize_sentence

@pytest.mark.asyncio
async def test_synthesize_sentence_success():
    mock_chunks = [
        {"type": "audio", "data": b"chunk1"},
        {"type": "non-audio", "data": b"metadata"},
        {"type": "audio", "data": b"chunk2"}
    ]
    
    async def mock_stream():
        for chunk in mock_chunks:
            yield chunk

    mock_communicate_instance = MagicMock()
    mock_communicate_instance.stream = mock_stream

    with patch("app.services.tts_service.edge_tts.Communicate", return_value=mock_communicate_instance) as mock_communicate_cls:
        result = await synthesize_sentence("Hello testing")
        
        assert result == b"chunk1chunk2"
        mock_communicate_cls.assert_called_once_with("Hello testing", "en-US-AriaNeural")
