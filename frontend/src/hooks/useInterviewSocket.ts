import { useEffect, useRef, useCallback } from 'react';
import { useInterviewStore } from '../store/interviewStore';

// Helper to convert Float32Array from VAD to WAV blob
function encodeWAV(samples: Float32Array, sampleRate: number = 16000): Blob {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);
  
  const writeString = (view: DataView, offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + samples.length * 2, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(view, 36, 'data');
  view.setUint32(40, samples.length * 2, true);

  let offset = 44;
  for (let i = 0; i < samples.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
  }

  return new Blob([buffer], { type: 'audio/wav' });
}

export function useInterviewSocket(sessionId: string) {
  const socketRef = useRef<WebSocket | null>(null);
  const { setConnectionStatus, addTranscriptChunk, setIsAiSpeaking } = useInterviewStore();
  const audioQueue = useRef<{seq: number, buffer: ArrayBuffer}[]>([]);
  const isPlaying = useRef(false);
  const currentExpectedSeq = useRef(1);
  const audioContext = useRef<AudioContext | null>(null);

  const playNextInQueue = async () => {
    if (isPlaying.current || audioQueue.current.length === 0) return;
    
    // Sort queue by seq
    audioQueue.current.sort((a, b) => a.seq - b.seq);
    
    const nextChunk = audioQueue.current[0];
    if (nextChunk.seq !== currentExpectedSeq.current) {
        // Wait for the correct sequence chunk
        return;
    }
    
    audioQueue.current.shift(); // remove from queue
    isPlaying.current = true;
    setIsAiSpeaking(true);
    
    if (!audioContext.current) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      audioContext.current = new AudioCtx();
    }
    
    try {
      if (audioContext.current.state === 'suspended') {
        await audioContext.current.resume();
      }
      const audioBuffer = await audioContext.current.decodeAudioData(nextChunk.buffer);
      const source = audioContext.current.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContext.current.destination);
      source.onended = () => {
        isPlaying.current = false;
        currentExpectedSeq.current += 1;
        
        if (audioQueue.current.length === 0) {
            setIsAiSpeaking(false);
        } else {
            playNextInQueue();
        }
      };
      source.start(0);
    } catch (e) {
      console.error("Error playing audio chunk", e);
      isPlaying.current = false;
      currentExpectedSeq.current += 1;
      
      if (audioQueue.current.length === 0) {
          setIsAiSpeaking(false);
      } else {
          playNextInQueue();
      }
    }
  };

  useEffect(() => {
    if (!sessionId) return;
    
    // Default to localhost:8000 for local dev
    // Use NEXT_PUBLIC_WS_URL or fallback to localhost
    const wsBase = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000";
    const wsUrl = `${wsBase}/ws/interview/${sessionId}`;
    const ws = new WebSocket(wsUrl);
    socketRef.current = ws;
    
    ws.onopen = () => {
      setConnectionStatus('connected');
    };
    
    ws.onclose = () => {
      setConnectionStatus('disconnected');
    };
    
    ws.onerror = () => {
      setConnectionStatus('error');
    };
    
    let pendingChunkMeta: { seq: number, text: string } | null = null;
    
    ws.onmessage = async (event) => {
      if (typeof event.data === 'string') {
        const data = JSON.parse(event.data);
        if (data.type === 'audio_chunk') {
          pendingChunkMeta = data;
        } else if (data.type === 'transcript_chunk') {
          addTranscriptChunk('ai', data.content);
        } else if (data.type === 'transcript') {
          addTranscriptChunk('user', data.content, true);
        } else if (data.type === 'ai_turn_complete') {
          currentExpectedSeq.current = 1; // reset for next turn
        }
      } else if (event.data instanceof Blob) {
        if (pendingChunkMeta) {
          const buffer = await event.data.arrayBuffer();
          audioQueue.current.push({ seq: pendingChunkMeta.seq, buffer });
          pendingChunkMeta = null;
          playNextInQueue();
        }
      }
    };
    
    return () => {
      ws.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  const sendAudio = useCallback((audioSamples: Float32Array) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      const wavBlob = encodeWAV(audioSamples);
      socketRef.current.send(wavBlob);
    }
  }, []);

  return { sendAudio };
}
