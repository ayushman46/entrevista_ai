"use client";
import { useState, useCallback, useEffect } from "react";

interface UseSpeechSynthesisReturn {
  speak: (text: string, onEnd?: () => void) => void;
  cancel: () => void;
  isSpeaking: boolean;
  isSupported: boolean;
}

export function useSpeechSynthesis(): UseSpeechSynthesisReturn {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voicesLoaded, setVoicesLoaded] = useState(false);

  const isSupported =
    typeof window !== "undefined" && "speechSynthesis" in window;

  useEffect(() => {
    if (!isSupported) return;
    
    const loadVoices = () => {
      if (window.speechSynthesis.getVoices().length > 0) {
        setVoicesLoaded(true);
      }
    };
    
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }, [isSupported]);

  const speak = useCallback((text: string, onEnd?: () => void) => {
    if (!isSupported) {
      onEnd?.();
      return;
    }
    
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find(
      (v) => v.lang === "en-US" && v.name.includes("Google")
    ) || voices.find((v) => v.lang.startsWith("en"));
    
    if (preferred) {
      utterance.voice = preferred;
    }

    utterance.onstart = () => setIsSpeaking(true);
    
    utterance.onend = () => {
      setIsSpeaking(false);
      onEnd?.();
    };
    
    utterance.onerror = (e) => {
      console.error("Speech Synthesis Error:", e);
      setIsSpeaking(false);
      onEnd?.();
    };

    // Call synchronously inside the click handler to satisfy browser security
    window.speechSynthesis.speak(utterance);
  }, [isSupported]);

  const cancel = useCallback(() => {
    if (!isSupported) return;
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, [isSupported]);

  return { speak, cancel, isSpeaking, isSupported };
}
