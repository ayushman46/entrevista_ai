"use client";
import { useState, useRef, useCallback, useEffect } from "react";

interface UseSpeechRecognitionReturn {
  transcript: string;
  isListening: boolean;
  isSupported: boolean;
  error: string | null;
  startListening: () => void;
  stopListening: () => void;
  resetTranscript: () => void;
}

export function useSpeechRecognition(): UseSpeechRecognitionReturn {
  const [transcript, setTranscript] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const recognitionRef = useRef<any>(null);
  const isManuallyStoppedRef = useRef(true);
  const finalTranscriptRef = useRef("");

  const isSupported =
    typeof window !== "undefined" &&
    ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);

  // Rebuilds the entire transcript from all available result segments
  // This is the most reliable way to handle 'continuous' mode across browsers
  const handleResult = useCallback((event: any) => {
    let interimTranscript = "";
    
    for (let i = event.resultIndex; i < event.results.length; ++i) {
      if (event.results[i].isFinal) {
        finalTranscriptRef.current += event.results[i][0].transcript + " ";
      } else {
        interimTranscript += event.results[i][0].transcript;
      }
    }
    
    setTranscript((finalTranscriptRef.current + interimTranscript).trim());
  }, []);

  const handleEnd = useCallback(() => {
    // If we haven't manually stopped, restart immediately (Keep-Alive)
    if (!isManuallyStoppedRef.current && recognitionRef.current) {
      try {
        recognitionRef.current.start();
      } catch (e) {
        // Already started or busy
      }
    } else {
      setIsListening(false);
    }
  }, []);

  const handleError = useCallback((event: any) => {
    console.error("Speech Recognition Error:", event.error);
    if (event.error === "not-allowed") {
      setError("Microphone permission denied. Please enable it in browser settings.");
      isManuallyStoppedRef.current = true;
      setIsListening(false);
    } else if (event.error === "no-speech") {
      // ignore no-speech, onend will handle restart if needed
    } else {
      setError(`Speech error: ${event.error}`);
    }
  }, []);

  useEffect(() => {
    if (!isSupported) return;

    const SpeechRecognitionAPI =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognitionAPI();

    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onstart = () => setIsListening(true);
    recognition.onresult = handleResult;
    recognition.onerror = handleError;
    recognition.onend = handleEnd;

    recognitionRef.current = recognition;

    return () => {
      isManuallyStoppedRef.current = true;
      if (recognitionRef.current) recognitionRef.current.abort();
    };
  }, [isSupported, handleResult, handleError, handleEnd]);

  const startListening = useCallback(() => {
    if (!recognitionRef.current) return;
    
    setError(null);
    setTranscript("");
    finalTranscriptRef.current = "";
    isManuallyStoppedRef.current = false;
    
    try {
      recognitionRef.current.start();
    } catch (e) {
      // In case it's already active
      setIsListening(true);
    }
  }, []);

  const stopListening = useCallback(() => {
    isManuallyStoppedRef.current = true;
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
  }, []);

  const resetTranscript = useCallback(() => {
    setTranscript("");
    finalTranscriptRef.current = "";
  }, []);

  return { 
    transcript, 
    isListening, 
    isSupported, 
    error, 
    startListening, 
    stopListening, 
    resetTranscript 
  };
}
