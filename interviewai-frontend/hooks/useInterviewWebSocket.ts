"use client";
import { useEffect, useRef, useState, useCallback } from "react";

interface WebSocketMessage {
  type: "transcript" | "turn_complete" | "error" | "pong";
  text?: string;
  evaluation?: any;
  interview_complete?: boolean;
  next_question?: string;
  audio_url?: string;
  topic?: string;
  message?: string;
}

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000";

export function useInterviewWebSocket(interviewId: string | null, onMessage: (msg: WebSocketMessage) => void) {
  const socketRef = useRef<WebSocket | null>(null);
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;

  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reconnectTimerRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptRef = useRef(0);

  useEffect(() => {
    if (!interviewId) return;

    let socket: WebSocket;

    const connect = () => {
      const fullUrl = `${WS_URL}/ws/interview/${interviewId}`;
      socket = new WebSocket(fullUrl);
      socketRef.current = socket;

      socket.onopen = () => {
        setIsConnected(true);
        setError(null);
        reconnectAttemptRef.current = 0; // Reset on success
        console.log("WS Connected");
      };

      socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        onMessageRef.current(data);
      };

      socket.onclose = () => {
        setIsConnected(false);
        console.log("WS Disconnected");
        // Reconnect logic
        if (reconnectAttemptRef.current < 5) {
          const timeout = Math.min(10000, 1000 * Math.pow(2, reconnectAttemptRef.current));
          console.log(`Attempting to reconnect in ${timeout}ms...`);
          reconnectTimerRef.current = setTimeout(() => {
            reconnectAttemptRef.current += 1;
            connect();
          }, timeout);
        } else {
          setError("Connection lost. Please refresh the page.");
        }
      };

      socket.onerror = (e) => {
        setError("WebSocket connection failed");
        console.error("WS Error:", e);
      };
    };

    connect();

    return () => {
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
      }
      if (socket) {
        socket.onclose = null; // Prevent reconnect on unmount
        socket.close();
      }
    };
  }, [interviewId]);

  const sendAudio = useCallback((chunk: Blob) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      console.log(`Sending audio chunk via WebSocket. Size: ${chunk.size} bytes`);
      socketRef.current.send(chunk);
    } else {
      console.warn("WebSocket not open, cannot send audio chunk.");
    }
  }, []);

  const sendMessage = useCallback((msg: any) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(msg));
    }
  }, []);

  return { isConnected, error, sendAudio, sendMessage };
}
