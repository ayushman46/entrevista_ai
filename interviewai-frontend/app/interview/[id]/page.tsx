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

function PhaseIndicator({ phase }: { phase: Phase }) {
  const config = {
    idle: { label: "Ready", color: "bg-slate-200", text: "text-slate-600" },
    greeting: { label: "Interviewer Speaking", color: "bg-blue-500", text: "text-blue-700 bg-blue-50" },
    listening: { label: "Listening", color: "bg-emerald-500", text: "text-emerald-700 bg-emerald-50" },
    processing: { label: "Processing", color: "bg-amber-500", text: "text-amber-700 bg-amber-50" },
    completed: { label: "Completed", color: "bg-slate-500", text: "text-slate-700 bg-slate-50" }
  }[phase];

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${config.text} border border-black/5`}>
      <span className={`w-2 h-2 rounded-full ${config.color} ${phase !== "idle" && phase !== "completed" ? "animate-pulse" : ""}`} />
      {config.label}
    </div>
  );
}

function Visualizer({ phase, vol }: { phase: Phase; vol: number }) {
  return (
    <div className="relative w-64 h-64 flex items-center justify-center">
      {/* Background Rings */}
      <div className={`absolute inset-0 rounded-full border border-slate-100 transition-transform duration-700 ${phase === "listening" || phase === "greeting" ? "scale-110" : "scale-100"}`} />
      <div className={`absolute inset-4 rounded-full border border-slate-100 transition-transform duration-1000 ${phase === "listening" || phase === "greeting" ? "scale-105" : "scale-100"}`} />
      
      {/* Core */}
      <div 
        className={`relative w-40 h-40 rounded-full bg-white shadow-xl shadow-slate-200/50 flex items-center justify-center transition-all duration-300 ${
          phase === "processing" ? "animate-pulse" : ""
        }`}
        style={{ transform: phase === "listening" ? `scale(${1 + vol / 300})` : "scale(1)" }}
      >
        <div className="absolute inset-2 rounded-full bg-slate-50 flex items-center justify-center overflow-hidden">
          {phase === "listening" ? (
            <div className="flex items-center gap-1.5">
              {[1, 2, 1.5, 2.5, 1.5, 2, 1].map((h, i) => (
                <div 
                  key={i} 
                  className="w-1.5 bg-slate-400 rounded-full animate-wave" 
                  style={{ height: `${Math.max(12, h * 12 * (1 + vol / 50))}px`, animationDelay: `${i * 0.1}s` }} 
                />
              ))}
            </div>
          ) : phase === "greeting" ? (
            <div className="flex items-center gap-1.5">
              {[2, 3, 2.5, 3.5, 2.5, 3, 2].map((h, i) => (
                <div 
                  key={i} 
                  className="w-1.5 bg-blue-400 rounded-full animate-wave" 
                  style={{ height: `${h * 12}px`, animationDelay: `${i * 0.15}s` }} 
                />
              ))}
            </div>
          ) : phase === "processing" ? (
            <svg className="w-8 h-8 text-slate-300 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            <svg className="w-10 h-10 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          )}
        </div>
      </div>
    </div>
  );
}

export default function InterviewPage() {
  const params = useParams();
  const router = useRouter();
  const interviewId = params.id as string;

  const {
    questions, currentQuestionIndex, totalPlanned,
    recordAnswer, addQuestion, setFinalReport, setQuestionIndex,
  } = useInterviewStore();

  const { startRecording, stopRecording, stream } = useAudioRecorder();
  const { playAudio, stopAudio } = useServerAudio();
  const { transcript, isListening, startListening, stopListening, resetTranscript, isSupported } = useSpeechRecognition();

  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState<string | null>(null);
  const [liveTranscript, setLiveTranscript] = useState("");
  const [vol, setVol] = useState(0);
  const [showTranscript, setShowTranscript] = useState(false);
  const [camStream, setCamStream] = useState<MediaStream | null>(null);
  
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const msgEnd = useRef<HTMLDivElement | null>(null);
  const silenceRef = useRef<NodeJS.Timeout | null>(null);
  const sendAudioRef = useRef<(chunk: Blob) => void>();
  const phaseRef = useRef<Phase>("idle");

  const currentQ = questions[currentQuestionIndex];

  useEffect(() => { phaseRef.current = phase; }, [phase]);
  useEffect(() => { msgEnd.current?.scrollIntoView({ behavior: "smooth" }); }, [questions, phase, transcript, liveTranscript, showTranscript]);

  /* Mic volume analyser */
  useEffect(() => {
    if (!stream) { setVol(0); return; }
    let ctx: AudioContext | null = null; let rafId: number;
    try {
      ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const src = ctx.createMediaStreamSource(stream);
      const an = ctx.createAnalyser(); an.fftSize = 256;
      src.connect(an);
      const buf = new Uint8Array(an.frequencyBinCount);
      const tick = () => {
        an.getByteFrequencyData(buf);
        const avg = buf.reduce((a, b) => a + b, 0) / buf.length;
        setVol(Math.min(100, Math.round((avg / 128) * 100)));
        rafId = requestAnimationFrame(tick);
      };
      tick();
    } catch {}
    return () => { cancelAnimationFrame(rafId); ctx?.close().catch(() => {}); };
  }, [stream]);

  useEffect(() => {
    if (videoRef.current && camStream) videoRef.current.srcObject = camStream;
  }, [camStream]);

  const toggleCam = async () => {
    if (camStream) { camStream.getTracks().forEach(t => t.stop()); setCamStream(null); return; }
    try { setCamStream(await navigator.mediaDevices.getUserMedia({ video: true })); }
    catch { setError("Camera access denied."); }
  };

  const handleWSMessage = useCallback((msg: any) => {
    if (msg.type === "transcript") {
      setLiveTranscript(msg.text);
    } else if (msg.type === "turn_complete") {
      if (msg.interview_complete) {
        setPhase("completed");
        recordAnswer(currentQuestionIndex, msg.transcript || liveTranscript || transcript || "—");
        camStream?.getTracks().forEach(t => t.stop());
        api.completeInterview(interviewId).then(r => { setFinalReport(r); router.push(`/report/${interviewId}`); });
      } else if (msg.next_question) {
        addQuestion(msg.next_question, msg.topic || "Technical", [], msg.audio_url);
        recordAnswer(currentQuestionIndex, msg.transcript || liveTranscript || transcript || "—");
        setQuestionIndex(currentQuestionIndex + 1);
        setLiveTranscript("");
        startRecording(chunk => sendAudioRef.current?.(chunk));
        resetTranscript();
        if (msg.audio_url) {
          setPhase("greeting"); startListening();
          playAudio(msg.audio_url, () => setPhase(p => p === "greeting" ? "listening" : p));
        } else { setPhase("listening"); startListening(); }
      }
    } else if (msg.type === "error") {
      setError(msg.message); setPhase("listening"); resetTranscript(); startListening();
      startRecording(chunk => sendAudioRef.current?.(chunk));
    }
  }, [currentQuestionIndex, interviewId, liveTranscript, transcript, playAudio, recordAnswer, addQuestion, setFinalReport, setQuestionIndex, router, startListening, resetTranscript, startRecording, camStream]);

  const { isConnected, sendAudio, sendMessage } = useInterviewWebSocket(interviewId, handleWSMessage);

  const handleSendAudio = useCallback((chunk: Blob) => {
    if (phaseRef.current === "listening" || phaseRef.current === "greeting") sendAudio(chunk);
  }, [sendAudio]);

  useEffect(() => { sendAudioRef.current = handleSendAudio; }, [handleSendAudio]);

  /* VAD */
  useEffect(() => {
    if (phase !== "listening" || transcript.trim().length <= 1) return;
    if (silenceRef.current) clearTimeout(silenceRef.current);
    silenceRef.current = setTimeout(async () => {
      setPhase("processing"); stopListening(); await stopRecording();
      sendMessage({ type: "end_of_turn", transcript });
    }, 2200);
    return () => { if (silenceRef.current) clearTimeout(silenceRef.current); };
  }, [transcript, phase, stopListening, sendMessage, stopRecording]);

  /* Barge-in */
  useEffect(() => {
    if (phase === "greeting" && transcript.trim().length > 1) { stopAudio(); setPhase("listening"); }
  }, [transcript, phase, stopAudio]);

  /* Keep STT alive */
  useEffect(() => {
    if (phase !== "idle" && phase !== "completed" && phase !== "processing" && !isListening && isSupported)
      startListening();
  }, [isListening, phase, isSupported, startListening]);

  const startInterview = () => {
    if (!currentQ) return;
    if (!isSupported) { setError("Speech recognition requires Chrome or Safari."); return; }
    setPhase("greeting"); setError(null); resetTranscript();
    startRecording(chunk => sendAudioRef.current?.(chunk));
    startListening();
    if (currentQ.audioUrl) {
      playAudio(currentQ.audioUrl, () => setPhase(p => p === "greeting" ? "listening" : p));
    } else { setPhase("listening"); }
  };

  const finishSpeaking = async () => {
    setPhase("processing"); stopListening(); await stopRecording();
    sendMessage({ type: "end_of_turn", transcript });
  };

  const endInterview = async () => {
    setPhase("processing"); stopAudio(); stopListening(); await stopRecording();
    camStream?.getTracks().forEach(t => t.stop());
    try {
      const r = await api.completeInterview(interviewId);
      setFinalReport(r); router.push(`/report/${interviewId}`);
    } catch { router.push(`/report/${interviewId}`); }
  };

  useEffect(() => () => {
    stopAudio(); stopRecording(); stopListening();
    camStream?.getTracks().forEach(t => t.stop());
  }, [stopAudio, stopRecording, stopListening, camStream]);

  if (!currentQ) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA]">
        <div className="flex flex-col items-center gap-4 text-slate-400">
          <svg className="w-8 h-8 animate-spin text-slate-300" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-sm font-medium">Connecting to Session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex bg-[#FAFAFA] text-slate-900 overflow-hidden">
      
      {/* Main Area */}
      <div className="flex-1 flex flex-col relative transition-all duration-300">
        {/* Header */}
        <header className="px-6 h-16 flex items-center justify-between border-b border-slate-100 bg-white/50 backdrop-blur-md z-10">
          <Link href="/upload" onClick={() => camStream?.getTracks().forEach(t => t.stop())} className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            Exit
          </Link>
          
          <div className="text-sm font-semibold px-3 py-1 bg-slate-100 text-slate-600 rounded-md">
            Question {currentQuestionIndex + 1} of {totalPlanned}
          </div>
        </header>

        {/* Studio Canvas */}
        <main className="flex-1 flex flex-col items-center justify-center p-6 relative">
          
          {phase === "idle" ? (
            <div className="max-w-md text-center animate-fade-up">
              <div className="w-20 h-20 bg-white border border-slate-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold mb-3">Ready when you are</h2>
              <p className="text-slate-500 text-sm mb-8 leading-relaxed">
                Ensure your microphone is connected and you are in a quiet environment. The AI will guide the conversation naturally.
              </p>
              
              {!isSupported && <div className="mb-6 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">Speech recognition requires Chrome or Safari.</div>}
              
              <button
                onClick={startInterview}
                disabled={!isConnected}
                className="px-8 py-3.5 rounded-full bg-slate-900 text-white font-medium hover:bg-slate-800 transition-all shadow-md active:scale-95 disabled:opacity-50"
              >
                {isConnected ? "Start Interview" : "Connecting..."}
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center animate-fade-in">
              <PhaseIndicator phase={phase} />
              
              <div className="my-12">
                <Visualizer phase={phase} vol={vol} />
              </div>

              {error && <div className="mt-4 px-4 py-2 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">{error}</div>}
              
              {phase === "listening" && (
                <p className="text-sm text-slate-400 mt-4 animate-pulse">Listening to your response...</p>
              )}
            </div>
          )}

        </main>

        {/* Bottom Controls */}
        {phase !== "idle" && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-white/80 backdrop-blur-md border border-slate-200 p-2 rounded-full shadow-lg">
            {phase === "listening" && (
              <button onClick={finishSpeaking} className="px-4 py-2 text-sm font-medium bg-slate-900 text-white rounded-full hover:bg-slate-800 transition-colors">
                Done Speaking
              </button>
            )}
            <button onClick={() => setShowTranscript(!showTranscript)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-full transition-colors flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" /></svg>
              Transcript
            </button>
            <div className="w-px h-6 bg-slate-200 mx-1" />
            <button onClick={endInterview} className="px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-full transition-colors">
              End Session
            </button>
          </div>
        )}

        {/* Camera PiP */}
        <div className="absolute bottom-6 left-6 z-20">
          {camStream ? (
            <div className="relative w-48 h-32 rounded-xl overflow-hidden border border-slate-200 shadow-lg bg-black">
              <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
              <button onClick={toggleCam} className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/50 text-white flex items-center justify-center text-xs hover:bg-red-500 transition-colors">
                ✕
              </button>
            </div>
          ) : (
            <button onClick={toggleCam} className="p-3 bg-white border border-slate-200 rounded-full shadow-sm text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
            </button>
          )}
        </div>
      </div>

      {/* Transcript Sidebar */}
      <div className={`w-96 bg-white border-l border-slate-100 flex flex-col transition-all duration-300 ${showTranscript ? "translate-x-0" : "translate-x-full absolute right-0 h-full"}`} style={{ zIndex: 40 }}>
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-100">
          <h3 className="font-semibold text-slate-900">Live Transcript</h3>
          <button onClick={() => setShowTranscript(false)} className="text-slate-400 hover:text-slate-600 p-1">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {questions.map((q, idx) => {
            const isCurrent = idx === currentQuestionIndex && phase !== "completed";
            if (isCurrent) return null;
            return (
              <div key={idx} className="space-y-4">
                <div>
                  <span className="text-xs font-semibold text-blue-600 mb-1 block">AI Interviewer</span>
                  <p className="text-sm bg-slate-50 p-3 rounded-tr-xl rounded-b-xl rounded-tl-sm text-slate-700">{q.question}</p>
                </div>
                {q.answer && (
                  <div className="flex flex-col items-end">
                    <span className="text-xs font-semibold text-slate-500 mb-1 block">You</span>
                    <p className="text-sm bg-slate-900 text-white p-3 rounded-tl-xl rounded-b-xl rounded-tr-sm text-right">{q.answer}</p>
                  </div>
                )}
              </div>
            );
          })}

          {phase !== "completed" && currentQ && (
            <div className="space-y-4">
              <div>
                <span className="text-xs font-semibold text-blue-600 mb-1 block flex items-center gap-2">
                  AI Interviewer {phase === "greeting" && <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />}
                </span>
                <p className="text-sm bg-blue-50/50 border border-blue-100 p-3 rounded-tr-xl rounded-b-xl rounded-tl-sm text-slate-800">{currentQ.question}</p>
              </div>
              
              {(phase === "listening" || phase === "processing") && (
                <div className="flex flex-col items-end">
                  <span className="text-xs font-semibold text-slate-500 mb-1 block flex items-center gap-2">
                    {phase === "listening" && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />} You
                  </span>
                  <p className="text-sm bg-slate-900 text-white p-3 rounded-tl-xl rounded-b-xl rounded-tr-sm text-right">
                    {transcript || liveTranscript || <span className="opacity-50">Listening...</span>}
                  </p>
                </div>
              )}
            </div>
          )}
          <div ref={msgEnd} />
        </div>
      </div>
    </div>
  );
}
