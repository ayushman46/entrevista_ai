"use client";
import { useState, useRef, useCallback } from "react";

interface UseAudioRecorderReturn {
  isRecording: boolean;
  audioBlob: Blob | null;
  startRecording: (onData?: (data: Blob) => void) => void;
  stopRecording: () => void;
  resetAudio: () => void;
}

export function useAudioRecorder(): UseAudioRecorderReturn {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const onDataRef = useRef<(data: Blob) => void>();

  const startRecording = useCallback(async (onData?: (data: Blob) => void) => {
    onDataRef.current = onData;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const supportedTypes = [
        "audio/webm;codecs=opus",
        "audio/webm",
        "audio/ogg;codecs=opus",
        "audio/mp4",
        "audio/aac",
      ];
      const mimeType = supportedTypes.find(type => MediaRecorder.isTypeSupported(type)) || "";

      console.log("Microphone access granted. Selected mimeType:", mimeType);
      const mediaRecorder = new MediaRecorder(stream, mimeType ? { mimeType } : {});
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          console.log(`Captured audio chunk. Size: ${event.data.size} bytes. Total chunks: ${audioChunksRef.current.length + 1}`);
          audioChunksRef.current.push(event.data);
          if (onDataRef.current) {
            onDataRef.current(event.data);
          }
        } else {
          console.warn("Captured audio chunk with size 0");
        }
      };

      mediaRecorder.start(1000); // Send chunks every 1 second
      setIsRecording(true);
    } catch (error) {
      console.error("Error accessing microphone:", error);
    }
  }, []);

  const stopRecording = useCallback(() => {
    return new Promise<void>((resolve) => {
      const recorder = mediaRecorderRef.current;
      if (recorder && recorder.state === "recording") {
        recorder.onstop = () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
          setAudioBlob(audioBlob);
          
          // Stop all tracks to release microphone
          recorder.stream.getTracks().forEach(track => track.stop());
          resolve();
        };
        recorder.stop();
        setIsRecording(false);
      } else {
        resolve();
      }
    });
  }, []);

  const resetAudio = useCallback(() => {
    setAudioBlob(null);
    audioChunksRef.current = [];
  }, []);

  return { isRecording, audioBlob, startRecording, stopRecording, resetAudio };
}
