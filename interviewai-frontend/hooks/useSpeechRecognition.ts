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
  const finalTranscriptRef = useRef("");

  const isSupported =
    typeof window !== "undefined" &&
    ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);

  useEffect(() => {
    if (!isSupported) return;

    const SpeechRecognitionAPI =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognitionAPI();

    // Standard continuous mode. Let the browser manage the socket naturally.
    recognition.continuous = true; 
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
    };

    recognition.onresult = (event: any) => {
      let interim = "";
      let final = "";
      
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          final += event.results[i][0].transcript + " ";
        } else {
          interim += event.results[i][0].transcript;
        }
      }
      
      if (final) {
        finalTranscriptRef.current += final;
      }
      
      setTranscript((finalTranscriptRef.current + interim).trim());
    };

    recognition.onerror = (event: any) => {
      console.warn("Speech API Error:", event.error);
      
      if (event.error === "not-allowed") {
        setError("Microphone access denied. Please allow it in your browser settings.");
      } else if (event.error === "network") {
        setError("Network connection lost. Please click 'Start Speaking' to reconnect.");
      } else if (event.error !== "no-speech") {
        setError(`Speech error: ${event.error}`);
      }
      // Note: we do not automatically restart on error. We let the user click the button again.
      // This prevents the browser from permanently banning the mic due to rapid programmatic restarts.
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, [isSupported]);

  const startListening = useCallback(() => {
    if (!recognitionRef.current) return;
    
    setError(null);
    
    // Only clear transcript if we are starting fresh (not resuming from a network drop)
    if (!finalTranscriptRef.current && !transcript) {
       setTranscript("");
    }
    
    try {
      recognitionRef.current.start();
    } catch (e) {
      console.error("Could not start mic:", e);
    }
  }, [transcript]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
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
