"use client";
import { useState, useCallback, useRef } from "react";

interface UseServerAudioReturn {
  playAudio: (url: string, onEnd?: () => void) => void;
  stopAudio: () => void;
  isPlaying: boolean;
}

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export function useServerAudio(): UseServerAudioReturn {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const playAudio = useCallback((url: string, onEnd?: () => void) => {
    if (audioRef.current) {
      audioRef.current.pause();
    }

    const fullUrl = url.startsWith("http") ? url : `${BASE_URL}${url}`;
    const audio = new Audio(fullUrl);
    audioRef.current = audio;

    audio.onplay = () => setIsPlaying(true);
    audio.onended = () => {
      setIsPlaying(false);
      onEnd?.();
    };
    audio.onerror = (e) => {
      console.error("Audio playback error:", e);
      setIsPlaying(false);
      onEnd?.(); // Gracefully fail
    };

    audio.play().catch(e => {
      console.error("Autoplay blocked or audio failed:", e);
      setIsPlaying(false);
      onEnd?.();
    });
  }, []);

  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setIsPlaying(false);
  }, []);

  return { playAudio, stopAudio, isPlaying };
}
