import asyncio
from unittest.mock import AsyncMock, patch

import pytest

from fastapi import WebSocketDisconnect

from app.api.websocket import process_ai_response, synthesize_and_send, websocket_endpoint


class FakeWebSocket:
    def __init__(self):
        self.events = []

    async def send_json(self, payload):
        self.events.append(("json", payload))

    async def send_bytes(self, payload):
        self.events.append(("bytes", payload))


class FakeConversationWebSocket(FakeWebSocket):
    def __init__(self):
        super().__init__()
        self.received = False
        self.accepted = False

    async def accept(self):
        self.accepted = True

    async def receive_bytes(self):
        if self.received:
            raise WebSocketDisconnect()
        self.received = True
        return b"wav-bytes"

    async def close(self, **kwargs):
        self.events.append(("close", kwargs))


@pytest.mark.asyncio
async def test_live_response_keeps_audio_sequences_monotonic():
    websocket = FakeWebSocket()

    async def mock_sentences(messages, purpose="realtime"):
        assert purpose == "realtime"
        yield "First sentence."
        yield "Second question?"

    async def mock_tts(sentence):
        await asyncio.sleep(0)
        return sentence.encode()

    with patch(
        "app.api.websocket.generate_sentences",
        side_effect=mock_sentences,
    ), patch(
        "app.api.websocket.synthesize_sentence",
        side_effect=mock_tts,
    ), patch(
        "app.api.websocket.append_transcript",
        new_callable=AsyncMock,
    ), patch(
        "app.api.websocket.get_session",
        new_callable=AsyncMock,
        return_value={"interview_state": {}, "interview_memory": {}},
    ), patch(
        "app.api.websocket.save_interview_context",
        new_callable=AsyncMock,
    ):
        next_sequence = await process_ai_response(
            websocket,
            "session-id",
            [{"role": "user", "content": "hello"}],
            asyncio.Lock(),
            seq_start=7,
        )

    json_events = [payload for kind, payload in websocket.events if kind == "json"]
    audio_events = [payload for payload in json_events if payload["type"] == "audio_chunk"]

    assert next_sequence == 9
    assert json_events[0] == {"type": "ai_turn_start"}
    assert [event["seq"] for event in audio_events] == [7, 8]
    assert json_events[-1] == {"type": "ai_turn_complete"}
    assert [payload for kind, payload in websocket.events if kind == "bytes"] == [
        b"First sentence.",
        b"Second question?",
    ]


@pytest.mark.asyncio
async def test_websocket_orchestrates_opening_and_candidate_turn_in_order():
    websocket = FakeConversationWebSocket()
    session = {
        "candidate_name": "Jane Doe",
        "target_role": "Backend Engineer",
        "resume_text": "Built APIs.",
        "job_description": "Build reliable services.",
    }
    process = AsyncMock(side_effect=[2, 3])

    with patch(
        "app.api.websocket.get_session",
        new_callable=AsyncMock,
        side_effect=[session, session],
    ), patch(
        "app.api.websocket.get_transcripts",
        new_callable=AsyncMock,
        side_effect=[[], [{"role": "user", "content": "candidate answer"}]],
    ), patch(
        "app.api.websocket.transcribe_audio",
        new_callable=AsyncMock,
        return_value="candidate answer",
    ) as transcribe, patch(
        "app.api.websocket.append_transcript",
        new_callable=AsyncMock,
    ) as append_transcript, patch(
        "app.api.websocket.process_ai_response",
        process,
    ):
        await websocket_endpoint(websocket, "session-id")

    assert websocket.accepted is True
    transcribe.assert_awaited_once_with(b"wav-bytes")
    append_transcript.assert_awaited_once_with(
        "session-id", "user", "candidate answer"
    )
    assert [call.kwargs["seq_start"] for call in process.await_args_list] == [1, 2]
    assert process.await_count == 2


@pytest.mark.asyncio
async def test_tts_failure_releases_audio_sequence():
    websocket = FakeWebSocket()

    with patch(
        "app.api.websocket.synthesize_sentence",
        new_callable=AsyncMock,
        side_effect=RuntimeError("TTS unavailable"),
    ):
        await synthesize_and_send(websocket, "Sentence.", 4, asyncio.Lock())

    assert websocket.events == [
        (
            "json",
            {"type": "audio_chunk_error", "seq": 4, "text": "Sentence."},
        )
    ]


@pytest.mark.asyncio
async def test_idle_analysis_can_be_canceled_before_provider_call():
    from app.api import websocket as websocket_api

    task = asyncio.create_task(
        websocket_api.analyze_when_idle("session-id", "candidate answer")
    )
    task.cancel()

    with patch(
        "app.api.websocket.analyze_candidate_answer",
        new_callable=AsyncMock,
    ) as analyze:
        with pytest.raises(asyncio.CancelledError):
            await task
        analyze.assert_not_awaited()
