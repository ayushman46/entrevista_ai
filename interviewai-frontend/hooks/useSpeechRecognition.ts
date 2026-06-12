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
  const restartTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const isSupported =
    typeof window !== "undefined" &&
    ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);

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

  const startRecognition = useCallback(() => {
    if (!recognitionRef.current || isManuallyStoppedRef.current) return;
    
    try {
      recognitionRef.current.start();
    } catch (e) {
      // Already running or busy
    }
  }, []);

  const handleEnd = useCallback(() => {
    // If not manually stopped, attempt to restart after a brief delay
    // This handles 'network' disconnects or silent timeouts
    if (!isManuallyStoppedRef.current) {
      if (restartTimeoutRef.current) clearTimeout(restartTimeoutRef.current);
      restartTimeoutRef.current = setTimeout(() => {
        startRecognition();
      }, 300);
    } else {
      setIsListening(false);
    }
  }, [startRecognition]);

  const handleError = useCallback((event: any) => {
    // Log for production debugging
    console.error("Speech Recognition Error Event:", event.error);
    
    const errorType = event.error;

    if (errorType === "not-allowed") {
      setError("Microphone permission denied. Please allow mic access in your browser.");
      isManuallyStoppedRef.current = true;
      setIsListening(false);
    } else if (errorType === "network") {
      // Network errors are common in unstable connections. 
      // We don't stop; we let handleEnd attempt a restart.
      setError("Network issues detected. Attempting to reconnect voice...");
    } else if (errorType === "no-speech") {
      // This happens if the user stays silent. 
      // We don't show an error to the user, just let it cycle.
    } else if (errorType === "aborted") {
      // System or manual abort, usually harmless.
    } else {
      setError(`Voice error: ${errorType}. Still listening...`);
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

    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
    };
    recognition.onresult = handleResult;
    recognition.onerror = handleError;
    recognition.onend = handleEnd;

    recognitionRef.current = recognition;

    return () => {
      isManuallyStoppedRef.current = true;
      if (restartTimeoutRef.current) clearTimeout(restartTimeoutRef.current);
      if (recognitionRef.current) recognitionRef.current.abort();
    };
  }, [isSupported, handleResult, handleError, handleEnd]);

  const startListening = useCallback(() => {
    if (!recognitionRef.current) return;
    
    setError(null);
    setTranscript("");
    finalTranscriptRef.current = "";
    isManuallyStoppedRef.current = false;
    
    startRecognition();
  }, [startRecognition]);

  const stopListening = useCallback(() => {
    isManuallyStoppedRef.current = true;
    if (restartTimeoutRef.current) clearTimeout(restartTimeoutRef.current);
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
