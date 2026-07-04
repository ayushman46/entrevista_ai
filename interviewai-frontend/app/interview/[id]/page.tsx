"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { api } from "@/services/api";
import { useInterviewStore } from "@/store/interviewStore";
import { useAudioRecorder } from "@/hooks/useAudioRecorder";
import { useServerAudio } from "@/hooks/useServerAudio";
import { useInterviewWebSocket } from "@/hooks/useInterviewWebSocket";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import Link from "next/link";

type Phase = "idle" | "greeting" | "listening" | "processing" | "completed";

export default function InterviewPage() {
  const params = useParams();
  const router = useRouter();
  const interviewId = params.id as string;

  const {
    questions, currentQuestionIndex, role, totalPlanned,
    recordAnswer, addQuestion, setFinalReport, setQuestionIndex
  } = useInterviewStore();

  const { startRecording, stopRecording, isRecording, stream } = useAudioRecorder();
  const { playAudio, stopAudio } = useServerAudio();
  const { 
    transcript, 
    isListening,
    startListening, 
    stopListening, 
    resetTranscript, 
    isSupported: isSpeechSupported, 
    error: speechError 
  } = useSpeechRecognition();

  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState<string | null>(null);
  const [liveTranscript, setLiveTranscript] = useState("");
  
  // Timer state
  const [timerSeconds, setTimerSeconds] = useState(0);

  // Audio volume state (0 to 100)
  const [audioVolume, setAudioVolume] = useState(0);

  // Transcript visibility state
  const [showTranscript, setShowTranscript] = useState(true);

  // Visualizer rotation degree
  const [rotationDegree, setRotationDegree] = useState(0);

  // Camera preview state
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const currentQ = questions[currentQuestionIndex];
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const handleSendAudioRef = useRef<(chunk: Blob) => void>();

  // Sync ref to check the current phase in asynchronous handlers
  const phaseRef = useRef(phase);
  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  // Keep chat sidebar scrolled to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [questions, phase, transcript, liveTranscript, showTranscript]);

  // Start ticking timer when interview starts
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (phase !== "idle" && phase !== "completed") {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [phase]);

  // Swirling color effect rotation loop
  useEffect(() => {
    let animationId: number;
    const rotate = () => {
      setRotationDegree((prev) => (prev + 0.4) % 360);
      animationId = requestAnimationFrame(rotate);
    };
    if (phase !== "idle" && phase !== "completed") {
      rotate();
    }
    return () => cancelAnimationFrame(animationId);
  }, [phase]);

  // Real-time audio volume analyzer
  useEffect(() => {
    if (!stream) {
      setAudioVolume(0);
      return;
    }

    let audioContext: AudioContext | null = null;
    let source: MediaStreamAudioSourceNode | null = null;
    let analyser: AnalyserNode | null = null;
    let animationId: number;

    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      audioContext = new AudioContextClass();
      source = audioContext.createMediaStreamSource(stream);
      analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const checkVolume = () => {
        if (!analyser) return;
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const average = sum / bufferLength;
        // Scale and cap the volume percentage (0 to 100)
        const vol = Math.min(100, Math.round((average / 128) * 100));
        setAudioVolume(vol);
        animationId = requestAnimationFrame(checkVolume);
      };

      checkVolume();
    } catch (err) {
      console.warn("Web Audio API not fully supported or blocked:", err);
    }

    return () => {
      if (animationId) cancelAnimationFrame(animationId);
      if (audioContext) {
        audioContext.close().catch(e => console.warn("Error closing AudioContext:", e));
      }
    };
  }, [stream]);

  const formatTime = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  // Toggle Camera logic
  const toggleCamera = async () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        setCameraStream(stream);
      } catch (err) {
        console.error("Error accessing camera:", err);
        setError("Could not access camera. Please check permissions.");
      }
    }
  };

  // Sync camera stream to video tag
  useEffect(() => {
    if (videoRef.current && cameraStream) {
      videoRef.current.srcObject = cameraStream;
    }
  }, [cameraStream]);

  // WebSocket message handler
  const handleWSMessage = useCallback((msg: any) => {
    if (msg.type === "transcript") {
      setLiveTranscript(msg.text);
    } else if (msg.type === "turn_complete") {
      if (msg.interview_complete) {
        setPhase("completed");
        recordAnswer(currentQuestionIndex, msg.transcript || liveTranscript || transcript || "Audio Response Submitted");
        
        // Stop camera tracks before redirect
        if (cameraStream) {
          cameraStream.getTracks().forEach(t => t.stop());
        }

        // Generate final report
        api.completeInterview(interviewId).then(report => {
          setFinalReport(report);
          router.push(`/report/${interviewId}`);
        });
      } else {
        if (msg.next_question) {
          addQuestion(msg.next_question, msg.topic || "Technical", [], msg.audio_url);
          recordAnswer(currentQuestionIndex, msg.transcript || liveTranscript || transcript || "Audio Response Submitted");
          setQuestionIndex(currentQuestionIndex + 1);
          setLiveTranscript("");
          
          // Start recording a fresh file (with valid WebM headers) for the next turn
          startRecording((chunk) => handleSendAudioRef.current?.(chunk));
          
          // Auto-play the next question
          if (msg.audio_url) {
            setPhase("greeting"); // AI speaking
            resetTranscript();
            startListening(); // Start listening immediately to allow barge-in
            
            playAudio(msg.audio_url, () => {
              setPhase((prev) => {
                if (prev === "greeting") {
                  return "listening";
                }
                return prev;
              });
            });
          } else {
            // No audio URL, go straight to listening
            setPhase("listening");
            resetTranscript();
            startListening();
          }
        }
      }
    } else if (msg.type === "error") {
      setError(msg.message);
      if (msg.code === "transcription_failed") {
        setPhase("listening");
        resetTranscript();
        startListening();
        // Restart recording so they can try again
        startRecording((chunk) => handleSendAudioRef.current?.(chunk));
      } else {
        setPhase("listening"); // Attempt to recover
      }
    }
  }, [currentQuestionIndex, interviewId, liveTranscript, transcript, playAudio, recordAnswer, addQuestion, setFinalReport, setQuestionIndex, router, startListening, resetTranscript, startRecording, cameraStream]);

  const { isConnected, sendAudio, sendMessage } = useInterviewWebSocket(interviewId, handleWSMessage);

  // Conditional audio sender: allow streaming during greeting or listening to catch barge-in
  const handleSendAudio = useCallback((chunk: Blob) => {
    if (phaseRef.current === "listening" || phaseRef.current === "greeting") {
      sendAudio(chunk);
    }
  }, [sendAudio]);

  useEffect(() => {
    handleSendAudioRef.current = handleSendAudio;
  }, [handleSendAudio]);

  // VAD logic: Detect end of user speaking
  useEffect(() => {
    if (phase === "listening" && transcript.trim().length > 1) {
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      
      silenceTimerRef.current = setTimeout(async () => {
        setPhase("processing");
        stopListening();
        await stopRecording();
        sendMessage({ type: "end_of_turn", transcript });
      }, 2200); // 2.2s silence detector
    }
    
    return () => {
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    };
  }, [transcript, phase, stopListening, sendMessage, stopRecording]);

  // Barge-in logic: detect user speaking over AI
  useEffect(() => {
    if (phase === "greeting" && transcript.trim().length > 1) {
      console.log("User barged in! Stopping AI audio.");
      stopAudio();
      setPhase("listening");
    }
  }, [transcript, phase, stopAudio]);

  // Auto-restart speech recognition if it ends unexpectedly during the active interview
  useEffect(() => {
    if (
      phase !== "idle" &&
      phase !== "completed" &&
      phase !== "processing" &&
      !isListening &&
      isSpeechSupported
    ) {
      console.log("Speech recognition stopped, restarting to keep conversation real-time...");
      startListening();
    }
  }, [isListening, phase, isSpeechSupported, startListening]);

  const startInterview = () => {
    if (!currentQ) return;
    if (!isSpeechSupported) {
      setError("Speech recognition is not supported in this browser. Please use Chrome or Safari.");
      return;
    }
    
    setPhase("greeting");
    setError(null);
    resetTranscript();

    // Start mic capture immediately
    startRecording((chunk) => handleSendAudioRef.current?.(chunk));

    // Start speech recognition immediately
    startListening();

    if (currentQ.audioUrl) {
      playAudio(currentQ.audioUrl, () => {
        setPhase((prev) => {
          if (prev === "greeting") {
            return "listening";
          }
          return prev;
        });
      });
    } else {
      setPhase("listening");
    }
  };

  const handleEndInterview = async () => {
    setPhase("processing");
    stopAudio();
    stopListening();
    await stopRecording();
    
    if (cameraStream) {
      cameraStream.getTracks().forEach(t => t.stop());
    }

    try {
      const report = await api.completeInterview(interviewId);
      setFinalReport(report);
      router.push(`/report/${interviewId}`);
    } catch (err) {
      console.error("Error completing interview early:", err);
      router.push(`/report/${interviewId}`);
    }
  };

  // Cleanup on leave
  useEffect(() => {
    return () => {
      stopAudio();
      stopRecording();
      stopListening();
      if (cameraStream) {
        cameraStream.getTracks().forEach(t => t.stop());
      }
    };
  }, [stopAudio, stopRecording, stopListening, cameraStream]);

  if (!currentQ) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[100vh] bg-slate-100 text-slate-800 p-8">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-slate-500 font-semibold">Connecting to AI Interviewer...</p>
      </div>
    );
  }

  // Calculate dynamic scale and glowing values based on active volume
  const scaleValue = phase === "listening" ? 1 + audioVolume / 350 : 1;
  const glowValue = phase === "listening" ? 20 + audioVolume / 1.2 : 25;

  return (
    <div className="min-h-screen w-full bg-slate-100/90 flex items-center justify-center p-4 sm:p-6 md:p-8 font-sans overflow-hidden">
      
      {/* MAIN CONTAINER CARD WITH ACCURATE SHADOW AND ROUNDED CORNERS */}
      <div className="w-full max-w-[1400px] h-[85vh] md:h-[90vh] bg-gradient-to-tr from-[#faf5ff]/40 via-[#f0f9ff]/30 to-[#f8fafc] border border-slate-200/80 rounded-[32px] shadow-2xl flex overflow-hidden relative backdrop-blur-sm">
        
        {/* LEFT COLUMN: INTERVIEW INTERFACE CONTAINER */}
        <div className="flex-1 flex flex-col justify-between p-6 relative">
          
          {/* Top Header Row */}
          <div className="flex items-center justify-between z-10">
            <Link
              href="/upload"
              onClick={() => {
                if (cameraStream) {
                  cameraStream.getTracks().forEach(t => t.stop());
                }
              }}
              className="flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-full border border-slate-200/80 shadow-sm transition-all"
            >
              <span>← Exit Interview</span>
            </Link>

            {/* Time Counter */}
            {phase !== "idle" && phase !== "completed" && (
              <div className="px-4 py-1.5 bg-white/80 border border-slate-200/60 rounded-full flex items-center gap-1.5 text-xs font-bold text-slate-700 shadow-sm backdrop-blur-sm">
                <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
                <span>{formatTime(timerSeconds)}</span>
              </div>
            )}

            {/* Question Progress in deep indigo color */}
            <div className="text-indigo-600 font-extrabold text-base tracking-tight">
              Question {currentQuestionIndex + 1}/{totalPlanned}
            </div>
          </div>

          {/* Center visualizer canvas */}
          <div className="flex-1 flex flex-col items-center justify-center relative">
            
            {phase === "idle" ? (
              <div className="flex flex-col items-center justify-center text-center space-y-8 max-w-md animate-in fade-in duration-700">
                <div className="w-24 h-24 bg-indigo-600/10 border border-indigo-500/20 rounded-full flex items-center justify-center shadow-lg relative group">
                  <div className="absolute inset-0 rounded-full bg-indigo-500/15 blur-xl group-hover:bg-indigo-500/25 transition-all animate-pulse" />
                  <svg className="w-10 h-10 text-indigo-500 translate-x-0.5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
                <div className="space-y-3">
                  <h1 className="text-3xl font-extrabold tracking-tight text-slate-800">Begin Voice Assessment</h1>
                  <p className="text-slate-500 text-sm leading-relaxed">
                    Start a real-time conversational interview based strictly on your resume. Speak naturally when answering the questions.
                  </p>
                </div>
                <button 
                  onClick={startInterview} 
                  disabled={!isConnected}
                  className={`px-8 py-3.5 text-sm rounded-full font-bold shadow-lg shadow-indigo-500/10 transition-all ${
                    isConnected 
                      ? "bg-indigo-600 hover:bg-indigo-500 text-white transform hover:-translate-y-0.5" 
                      : "bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300"
                  }`}
                >
                  {isConnected ? "Start Interview" : "Connecting to Host..."}
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                
                {/* Dynamic Status Indicator */}
                <div className="flex justify-center mb-6">
                  <div className={`px-4 py-1.5 rounded-full flex items-center gap-2 text-xs font-semibold shadow-sm border transition-all duration-500 ${
                    phase === "greeting" ? "bg-indigo-50 border-indigo-100 text-indigo-600" :
                    phase === "listening" ? "bg-emerald-50 border-emerald-100 text-emerald-600" :
                    phase === "processing" ? "bg-amber-50 border-amber-100 text-amber-600" :
                    "bg-slate-100 border-slate-200 text-slate-500"
                  }`}>
                    <span className={`w-2 h-2 rounded-full ${
                      phase === "greeting" ? "bg-indigo-500 animate-pulse" :
                      phase === "listening" ? "bg-emerald-500 animate-ping" :
                      phase === "processing" ? "bg-amber-500 animate-bounce" :
                      "bg-slate-400"
                    }`} />
                    <span>
                      {phase === "greeting" ? "AI Speaking" :
                       phase === "listening" ? "Listening..." :
                       phase === "processing" ? "Thinking..." :
                       "Idle"}
                    </span>
                  </div>
                </div>

                {/* Pulsing Visualizer Orb */}
                <div className="relative w-80 h-80 flex items-center justify-center">
                  
                  {/* Glowing fluid outer layer with dynamic color wash rotation */}
                  <div 
                    className="absolute inset-0 rounded-full blur-3xl opacity-75 filter transition-all duration-300"
                    style={{
                      background: `linear-gradient(${rotationDegree}deg, #fef08a 0%, #f472b6 30%, #6366f1 70%, #38bdf8 100%)`,
                      transform: `scale(${scaleValue * 1.1})`,
                      boxShadow: `0 0 ${glowValue}px rgba(99, 102, 241, 0.4)`
                    }} 
                  />

                  {/* Main Orb Center */}
                  <div 
                    className="w-72 h-72 rounded-full shadow-2xl relative overflow-hidden flex items-center justify-center border border-white/40 transition-all duration-300"
                    style={{
                      background: `linear-gradient(${rotationDegree}deg, #fef08a 0%, #f472b6 30%, #6366f1 70%, #38bdf8 100%)`,
                      transform: `scale(${scaleValue})`
                    }}
                  >
                    <div className="absolute inset-0 bg-white/10 backdrop-blur-[2px]" />
                    
                    {/* Equalizer overlay when AI is speaking */}
                    {phase === "greeting" && (
                      <div className="flex gap-2 items-end h-16 relative z-10 animate-pulse">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <div key={i} className="w-1.5 bg-white/80 rounded-full animate-bounce" style={{
                            animationDelay: `${i * 0.12}s`,
                            height: `${40 + Math.random() * 60}%`
                          }} />
                        ))}
                      </div>
                    )}

                    {/* Microphone status icon when listening */}
                    {phase === "listening" && (
                      <div className="flex flex-col items-center justify-center relative z-10 text-emerald-600 animate-pulse">
                        <svg className="w-8 h-8 text-white drop-shadow-md" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z" />
                        </svg>
                        {audioVolume > 10 && (
                          <span className="text-[10px] text-white font-bold tracking-wider mt-2 bg-emerald-500/20 px-2 py-0.5 rounded-full">
                            Capturing Voice
                          </span>
                        )}
                      </div>
                    )}

                    {/* Loading spinner when processing */}
                    {phase === "processing" && (
                      <div className="w-10 h-10 border-4 border-white border-t-transparent rounded-full animate-spin relative z-10" />
                    )}
                  </div>
                </div>

                {/* Error alerts / validation messages */}
                {error && (
                  <div className="mt-6 px-4 py-2 bg-rose-50 border border-rose-200 text-rose-600 text-xs font-semibold rounded-full shadow-sm animate-bounce">
                    ⚠️ {error}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Center Bottom Controls */}
          {phase !== "idle" && (
            <div className="flex flex-col items-center gap-4 z-10 mb-2">
              
              {/* Tap to finish speaking (manual trigger option) */}
              {phase === "listening" && (
                <button
                  onClick={async () => {
                    setPhase("processing");
                    stopListening();
                    await stopRecording();
                    sendMessage({ type: "end_of_turn", transcript });
                  }}
                  className="px-8 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold uppercase tracking-wider rounded-full shadow-lg shadow-indigo-600/10 hover:shadow-indigo-600/20 transition-all flex items-center gap-2 animate-in zoom-in-95 duration-200"
                >
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                  </svg>
                  <span>Finish Speaking</span>
                </button>
              )}

              {/* Action pill buttons identical to the mockup image */}
              <div className="flex justify-center gap-4">
                <button
                  onClick={handleEndInterview}
                  className="px-6 py-3 bg-[#dc2626] hover:bg-[#b91c1c] text-white text-xs font-bold uppercase tracking-wider rounded-2xl shadow-sm transition-all flex items-center gap-2"
                >
                  {/* Square Stop Icon */}
                  <span className="w-2.5 h-2.5 border-2 border-white rounded-sm shrink-0" />
                  <span>End Interview</span>
                </button>

                <button
                  onClick={() => setShowTranscript((prev) => !prev)}
                  className="px-6 py-3 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold uppercase tracking-wider rounded-2xl shadow-sm border border-slate-200/80 transition-all flex items-center gap-2"
                >
                  {/* Speech Bubble Icon */}
                  <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
                  </svg>
                  <span>{showTranscript ? "Hide Transcript" : "Show Transcript"}</span>
                </button>
              </div>
            </div>
          )}

          {/* Floating Webcam Overlay (Picture-in-Picture) */}
          <div className="absolute bottom-6 left-6 z-20 flex items-center gap-3">
            {cameraStream ? (
              <div className="relative w-48 h-32 bg-slate-900 border border-slate-200 shadow-2xl rounded-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                <video 
                  ref={videoRef} 
                  autoPlay 
                  playsInline 
                  muted 
                  className="w-full h-full object-cover" 
                />
                <button 
                  onClick={toggleCamera}
                  className="absolute top-2 right-2 p-1.5 bg-black/40 hover:bg-black/60 rounded-full text-white transition-colors"
                  title="Turn off camera"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ) : (
              <>
                <button
                  onClick={toggleCamera}
                  className="flex items-center gap-2 px-5 py-3 bg-[#475569] hover:bg-[#334155] text-white text-xs font-bold rounded-2xl shadow-sm transition-all"
                >
                  {/* Camera Icon */}
                  <svg className="w-4 h-4 text-slate-200" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
                  </svg>
                  <span>Turn On Camera</span>
                </button>
                <div className="w-8 h-8 rounded-full border border-slate-300 flex items-center justify-center text-slate-400 font-bold text-xs hover:border-slate-400 transition-colors cursor-pointer" title="Help">
                  ?
                </div>
              </>
            )}
          </div>
        </div>

        {/* RIGHT LIVE TRANSCRIPT PANEL (MATCHES THE SIDEBAR CARD DESIGN EXACLY) */}
        {showTranscript && (
          <div className="w-[380px] border-l border-slate-200/60 bg-white flex flex-col shadow-lg animate-in slide-in-from-right duration-300 z-10">
            
            {/* Transcript Panel Title */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between shrink-0">
              <h3 className="font-bold text-[#1e3a8a] text-lg tracking-tight">Live Transcript</h3>
              <span className="inline-flex w-2 h-2 rounded-full bg-indigo-500 shadow-md shadow-indigo-500/20 animate-pulse" />
            </div>

            {/* Transcript Messages Stream */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
              {questions.map((q, idx) => {
                const isCurrent = idx === currentQuestionIndex;
                if (isCurrent && phase !== "completed") return null;

                return (
                  <div key={idx} className="space-y-4">
                    {/* AI Bubble */}
                    <div className="flex gap-3 items-start">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 border border-indigo-200 flex items-center justify-center shrink-0">
                        {/* Robot Icon */}
                        <svg className="w-4.5 h-4.5 text-indigo-500" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 21v-4.875c0-.621.504-1.125 1.125-1.125h5.25c.621 0 1.125.504 1.125 1.125V21m0 0h4.5V3.545M12.75 7.5h.008v.008h-.008V7.5Zm0 2.25h.008v.008h-.008V9.75ZM3.75 21h.007v-.008H3.75V21Zm.007-.008H3.75V21h.007v-.008Zm0 0V3.545c0-.66.538-1.2 1.2-1.2h14.1c.66 0 1.2.538 1.2 1.2V21" />
                        </svg>
                      </div>
                      <div className="bg-[#eff6ff] border border-indigo-100/60 p-4 rounded-2xl rounded-tl-none text-left">
                        <span className="text-indigo-900 text-xs font-bold block mb-1">
                          AI Interviewer
                        </span>
                        <p className="text-slate-700 text-[13px] leading-relaxed font-medium">{q.question}</p>
                      </div>
                    </div>

                    {/* Candidate Bubble */}
                    {q.answer && (
                      <div className="flex gap-3 items-start justify-end">
                        <div className="bg-[#f8fafc] border border-slate-100 p-4 rounded-2xl rounded-tr-none text-right">
                          <span className="text-slate-600 text-xs font-bold block mb-1">
                            You
                          </span>
                          <p className="text-slate-700 text-[13px] leading-relaxed italic">
                            "{q.answer}"
                          </p>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
                          {/* User Icon */}
                          <svg className="w-4.5 h-4.5 text-slate-500" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7 0 3.75 3.75 0 0 1 7 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                          </svg>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Active Question Bubble */}
              {phase !== "completed" && currentQ && (
                <div className="space-y-4 animate-in fade-in duration-300">
                  
                  {/* AI Active Bubble */}
                  <div className="flex gap-3 items-start">
                    <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center shrink-0 shadow-md shadow-indigo-500/20">
                      <svg className="w-4.5 h-4.5 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 21v-4.875c0-.621.504-1.125 1.125-1.125h5.25c.621 0 1.125.504 1.125 1.125V21m0 0h4.5V3.545M12.75 7.5h.008v.008h-.008V7.5Zm0 2.25h.008v.008h-.008V9.75ZM3.75 21h.007v-.008H3.75V21Zm.007-.008H3.75V21h.007v-.008Zm0 0V3.545c0-.66.538-1.2 1.2-1.2h14.1c.66 0 1.2.538 1.2 1.2V21" />
                      </svg>
                    </div>
                    <div className="bg-[#eff6ff] border border-indigo-100/60 p-4 rounded-2xl rounded-tl-none text-left relative shadow-sm">
                      <span className="text-indigo-900 text-xs font-bold block mb-1">
                        AI Interviewer
                      </span>
                      <p className="text-slate-800 text-[13px] leading-relaxed font-semibold">
                        {currentQ.question}
                      </p>
                    </div>
                  </div>

                  {/* Candidate Active Voice Output */}
                  {(phase === "listening" || phase === "processing") && (
                    <div className="flex gap-3 items-start justify-end animate-in fade-in duration-300">
                      <div className="bg-[#f8fafc] border border-slate-100 p-4 rounded-2xl rounded-tr-none text-right min-w-[120px] max-w-[85%] shadow-sm">
                        <span className="text-slate-600 text-xs font-bold block mb-1">
                          {phase === "listening" ? "Listening..." : "Thinking..."}
                        </span>
                        <p className="text-slate-600 text-[13px] leading-relaxed italic">
                          {transcript || liveTranscript || "..."}
                        </p>
                      </div>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm ${
                        phase === "listening" ? "bg-red-500 text-white animate-pulse" : "bg-indigo-500 text-white animate-spin"
                      }`}>
                        {phase === "listening" ? (
                          <span className="w-2.5 h-2.5 bg-white rounded-full" />
                        ) : (
                          <span className="text-xs">•••</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
