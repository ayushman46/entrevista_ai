"use client";
import { useState, useRef, useCallback } from "react";

interface UseAudioRecorderReturn {
  isRecording: boolean;
  audioBlob: Blob | null;
  startRecording: (onData?: (data: Blob) => void) => void;
  stopRecording: () => void;
  resetAudio: () => void;
  stream: MediaStream | null;
}

export function useAudioRecorder(): UseAudioRecorderReturn {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const onDataRef = useRef<(data: Blob) => void>();

  const startRecording = useCallback(async (onData?: (data: Blob) => void) => {
    onDataRef.current = onData;
    try {
      const audioStream = await navigator.mediaDevices.getUserMedia({ 
        audio: { 
          echoCancellation: true, 
          noiseSuppression: true, 
          autoGainControl: true 
        } 
      });

      setStream(audioStream);

      const supportedTypes = [
        "audio/webm;codecs=opus",
        "audio/webm",
        "audio/ogg;codecs=opus",
        "audio/mp4",
        "audio/aac",
      ];
      const mimeType = supportedTypes.find(type => MediaRecorder.isTypeSupported(type)) || "";

      console.log("Microphone access granted. Selected mimeType:", mimeType);
      const mediaRecorder = new MediaRecorder(audioStream, mimeType ? { mimeType } : {});
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
          setStream(null);
          resolve();
        };
        recorder.stop();
        setIsRecording(false);
      } else {
        setStream(null);
        resolve();
      }
    });
  }, []);

  const resetAudio = useCallback(() => {
    setAudioBlob(null);
    audioChunksRef.current = [];
  }, []);

  return { isRecording, audioBlob, startRecording, stopRecording, resetAudio, stream };
}
