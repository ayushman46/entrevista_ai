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

/* ─── tiny icon components ──────────────────────────────────────────────── */
function RobotIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="10" rx="2" />
      <circle cx="12" cy="5" r="2" />
      <path d="M12 7v4" />
      <line x1="8" y1="16" x2="8" y2="16" strokeWidth="2.5" />
      <line x1="12" y1="16" x2="12" y2="16" strokeWidth="2.5" />
      <line x1="16" y1="16" x2="16" y2="16" strokeWidth="2.5" />
    </svg>
  );
}
function UserIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}
function ClockIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}
function CameraIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  );
}
function ChatIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}
function StopIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <rect x="4" y="4" width="16" height="16" rx="2" />
    </svg>
  );
}
function CheckCircleIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 12l2 2 4-4" />
      <circle cx="12" cy="12" r="10" />
    </svg>
  );
}

/* ─── Mercor-style gradient orb ─────────────────────────────────────────── */
function InterviewOrb({ phase, audioVolume }: { phase: Phase; audioVolume: number }) {
  const baseClass = "relative rounded-full flex items-center justify-center";
  const SIZE = 320; // px

  // Pick animation class + glow colour by phase
  const orbClass =
    phase === "greeting"   ? "orb-speaking"  :
    phase === "listening"  ? "orb-listening" :
    phase === "processing" ? "orb-thinking"  :
    "orb-idle";

  const extraScale = phase === "listening" ? 1 + audioVolume / 400 : 1;

  return (
    <div
      className={`${baseClass} ${orbClass}`}
      style={{
        width:  SIZE,
        height: SIZE,
        transform: `scale(${extraScale})`,
        transition: "transform 0.1s ease-out",
      }}
    >
      {/* ── Outer blur glow ── */}
      <div
        className="absolute inset-[-12px] rounded-full blur-3xl opacity-60"
        style={{
          background:
            "radial-gradient(ellipse at 30% 40%, #fde68a 0%, #f9a8d4 30%, #a78bfa 55%, #93c5fd 80%, #c4b5fd 100%)",
        }}
      />

      {/* ── Main orb circle ── */}
      <div
        className="absolute inset-0 rounded-full overflow-hidden"
        style={{
          background:
            "conic-gradient(from 0deg at 40% 55%, #fef08a 0deg, #fca5a5 60deg, #c084fc 120deg, #60a5fa 180deg, #34d399 240deg, #fbbf24 300deg, #fef08a 360deg)",
        }}
      >
        {/* white translucent inner shine */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background:
              "radial-gradient(ellipse at 35% 30%, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0.1) 50%, transparent 75%)",
          }}
        />
        {/* bottom shadow depth */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background:
              "radial-gradient(ellipse at 65% 80%, rgba(99,102,241,0.3) 0%, transparent 60%)",
          }}
        />
      </div>

      {/* ── Phase overlay content ── */}
      {phase === "listening" && (
        <div className="relative z-10 flex flex-col items-center gap-2">
          <div className="flex gap-1 items-end h-8">
            {[3, 6, 4, 7, 5, 3, 6].map((h, i) => (
              <div
                key={i}
                className="w-1 rounded-full bg-white/90"
                style={{
                  height: `${h * (1 + audioVolume / 80)}px`,
                  animationDelay: `${i * 0.1}s`,
                  transition: "height 0.1s ease",
                }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Transcript bubble ─────────────────────────────────────────────────── */
function AiBubble({ text }: { text: string }) {
  return (
    <div className="flex gap-2.5 items-start fade-in">
      <div className="w-7 h-7 rounded-full bg-indigo-100 border border-indigo-200/80 flex items-center justify-center shrink-0 mt-0.5">
        <RobotIcon className="w-3.5 h-3.5 text-indigo-600" />
      </div>
      <div className="flex-1">
        <p className="text-[11px] font-semibold text-indigo-600 mb-1">AI Interviewer</p>
        <div className="bg-white border border-slate-100 rounded-2xl rounded-tl-sm px-3.5 py-2.5 shadow-sm">
          <p className="text-[13px] text-slate-700 leading-relaxed">{text}</p>
        </div>
      </div>
    </div>
  );
}
function YouBubble({ text }: { text: string }) {
  return (
    <div className="flex gap-2.5 items-start fade-in">
      <div className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200/80 flex items-center justify-center shrink-0 mt-0.5">
        <UserIcon className="w-3.5 h-3.5 text-slate-500" />
      </div>
      <div className="flex-1">
        <p className="text-[11px] font-semibold text-slate-500 mb-1">You</p>
        <p className="text-[13px] text-slate-600 leading-relaxed">{text}</p>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════════════════════════════════ */
export default function InterviewPage() {
  const params   = useParams();
  const router   = useRouter();
  const interviewId = params.id as string;

  const {
    questions, currentQuestionIndex, totalPlanned,
    recordAnswer, addQuestion, setFinalReport, setQuestionIndex,
  } = useInterviewStore();

  const { startRecording, stopRecording, stream } = useAudioRecorder();
  const { playAudio, stopAudio }                  = useServerAudio();
  const {
    transcript, isListening, startListening, stopListening,
    resetTranscript, isSupported: isSpeechSupported,
  } = useSpeechRecognition();

  const [phase, setPhase]               = useState<Phase>("idle");
  const [error, setError]               = useState<string | null>(null);
  const [liveTranscript, setLiveTranscript] = useState("");
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [audioVolume, setAudioVolume]   = useState(0);
  const [showTranscript, setShowTranscript] = useState(true);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const videoRef    = useRef<HTMLVideoElement | null>(null);
  const messagesEnd = useRef<HTMLDivElement | null>(null);
  const silenceRef  = useRef<NodeJS.Timeout | null>(null);
  const sendAudioRef = useRef<(chunk: Blob) => void>();
  const phaseRef    = useRef<Phase>("idle");

  const currentQ = questions[currentQuestionIndex];

  /* keep phaseRef fresh */
  useEffect(() => { phaseRef.current = phase; }, [phase]);

  /* auto-scroll transcript */
  useEffect(() => {
    messagesEnd.current?.scrollIntoView({ behavior: "smooth" });
  }, [questions, phase, transcript, liveTranscript]);

  /* interview timer */
  useEffect(() => {
    if (phase === "idle" || phase === "completed") return;
    const id = setInterval(() => setTimerSeconds(s => s + 1), 1000);
    return () => clearInterval(id);
  }, [phase]);

  /* real-time mic volume */
  useEffect(() => {
    if (!stream) { setAudioVolume(0); return; }
    let ctx: AudioContext | null = null;
    let rafId: number;
    try {
      ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const src      = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      src.connect(analyser);
      const buf = new Uint8Array(analyser.frequencyBinCount);
      const tick = () => {
        analyser.getByteFrequencyData(buf);
        const avg = buf.reduce((a, b) => a + b, 0) / buf.length;
        setAudioVolume(Math.min(100, Math.round((avg / 128) * 100)));
        rafId = requestAnimationFrame(tick);
      };
      tick();
    } catch {}
    return () => {
      cancelAnimationFrame(rafId);
      ctx?.close().catch(() => {});
    };
  }, [stream]);

  /* camera ↔ video element */
  useEffect(() => {
    if (videoRef.current && cameraStream) videoRef.current.srcObject = cameraStream;
  }, [cameraStream]);

  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  const toggleCamera = async () => {
    if (cameraStream) { cameraStream.getTracks().forEach(t => t.stop()); setCameraStream(null); return; }
    try {
      setCameraStream(await navigator.mediaDevices.getUserMedia({ video: true }));
    } catch { setError("Camera access denied."); }
  };

  /* WebSocket message handler */
  const handleWSMessage = useCallback((msg: any) => {
    if (msg.type === "transcript") {
      setLiveTranscript(msg.text);
    } else if (msg.type === "turn_complete") {
      if (msg.interview_complete) {
        setPhase("completed");
        recordAnswer(currentQuestionIndex, msg.transcript || liveTranscript || transcript || "—");
        cameraStream?.getTracks().forEach(t => t.stop());
        api.completeInterview(interviewId).then(r => { setFinalReport(r); router.push(`/report/${interviewId}`); });
      } else if (msg.next_question) {
        addQuestion(msg.next_question, msg.topic || "Technical", [], msg.audio_url);
        recordAnswer(currentQuestionIndex, msg.transcript || liveTranscript || transcript || "—");
        setQuestionIndex(currentQuestionIndex + 1);
        setLiveTranscript("");
        startRecording(chunk => sendAudioRef.current?.(chunk));
        resetTranscript();
        if (msg.audio_url) {
          setPhase("greeting");
          startListening();
          playAudio(msg.audio_url, () => setPhase(p => p === "greeting" ? "listening" : p));
        } else {
          setPhase("listening");
          startListening();
        }
      }
    } else if (msg.type === "error") {
      setError(msg.message);
      setPhase("listening");
      resetTranscript();
      startListening();
      startRecording(chunk => sendAudioRef.current?.(chunk));
    }
  }, [currentQuestionIndex, interviewId, liveTranscript, transcript, playAudio, recordAnswer, addQuestion, setFinalReport, setQuestionIndex, router, startListening, resetTranscript, startRecording, cameraStream]);

  const { isConnected, sendAudio, sendMessage } = useInterviewWebSocket(interviewId, handleWSMessage);

  const handleSendAudio = useCallback((chunk: Blob) => {
    if (phaseRef.current === "listening" || phaseRef.current === "greeting") sendAudio(chunk);
  }, [sendAudio]);

  useEffect(() => { sendAudioRef.current = handleSendAudio; }, [handleSendAudio]);

  /* VAD – 2.2 s silence */
  useEffect(() => {
    if (phase !== "listening" || transcript.trim().length <= 1) return;
    if (silenceRef.current) clearTimeout(silenceRef.current);
    silenceRef.current = setTimeout(async () => {
      setPhase("processing");
      stopListening();
      await stopRecording();
      sendMessage({ type: "end_of_turn", transcript });
    }, 2200);
    return () => { if (silenceRef.current) clearTimeout(silenceRef.current); };
  }, [transcript, phase, stopListening, sendMessage, stopRecording]);

  /* barge-in */
  useEffect(() => {
    if (phase === "greeting" && transcript.trim().length > 1) { stopAudio(); setPhase("listening"); }
  }, [transcript, phase, stopAudio]);

  /* keep STT alive */
  useEffect(() => {
    if (phase !== "idle" && phase !== "completed" && phase !== "processing" && !isListening && isSpeechSupported)
      startListening();
  }, [isListening, phase, isSpeechSupported, startListening]);

  const startInterview = () => {
    if (!currentQ || !isSpeechSupported) {
      setError(isSpeechSupported ? "Not ready." : "Speech recognition needs Chrome or Safari.");
      return;
    }
    setPhase("greeting"); setError(null); resetTranscript();
    startRecording(chunk => sendAudioRef.current?.(chunk));
    startListening();
    if (currentQ.audioUrl) {
      playAudio(currentQ.audioUrl, () => setPhase(p => p === "greeting" ? "listening" : p));
    } else {
      setPhase("listening");
    }
  };

  const finishSpeaking = async () => {
    setPhase("processing");
    stopListening();
    await stopRecording();
    sendMessage({ type: "end_of_turn", transcript });
  };

  const endInterview = async () => {
    setPhase("processing"); stopAudio(); stopListening(); await stopRecording();
    cameraStream?.getTracks().forEach(t => t.stop());
    try {
      const r = await api.completeInterview(interviewId);
      setFinalReport(r); router.push(`/report/${interviewId}`);
    } catch { router.push(`/report/${interviewId}`); }
  };

  useEffect(() => () => {
    stopAudio(); stopRecording(); stopListening();
    cameraStream?.getTracks().forEach(t => t.stop());
  }, [stopAudio, stopRecording, stopListening, cameraStream]);

  /* Loading state before questions arrive */
  if (!currentQ) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ background: "#eef0f8" }}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-indigo-400 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-500 text-sm font-medium">Connecting to AI Interviewer…</p>
        </div>
      </div>
    );
  }

  /* ── status label ── */
  const statusLabel =
    phase === "greeting"   ? "AI Speaking"  :
    phase === "listening"  ? "Listening…"   :
    phase === "processing" ? "Processing…"  : "";

  const statusDotColor =
    phase === "greeting"   ? "#6366f1" :
    phase === "listening"  ? "#22c55e" :
    phase === "processing" ? "#f59e0b" : "transparent";

  /* ════════════════════════════ RENDER ════════════════════════════ */
  return (
    <div
      className="flex h-screen w-screen overflow-hidden"
      style={{ background: "#eef0f8" }}
    >
      {/* ══════════════ LEFT: main canvas ══════════════ */}
      <div className="flex-1 flex flex-col relative overflow-hidden">

        {/* ── Top bar ── */}
        <div className="flex items-center justify-between px-6 pt-5 pb-2 z-10">
          {/* Exit button */}
          <Link
            href="/upload"
            onClick={() => cameraStream?.getTracks().forEach(t => t.stop())}
            className="flex items-center gap-1.5 px-4 py-2 bg-white rounded-full text-slate-600 text-sm font-medium shadow-sm border border-slate-200/80 hover:bg-slate-50 transition-colors"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Exit Interview
          </Link>

          {/* Timer — shown only when active */}
          {phase !== "idle" && phase !== "completed" && (
            <div className="flex items-center gap-1.5 text-slate-500 text-sm font-medium bg-white/70 rounded-full px-3 py-1 border border-slate-200/60 shadow-sm">
              <ClockIcon className="w-3.5 h-3.5" />
              <span className="font-mono">{fmt(timerSeconds)}</span>
            </div>
          )}

          {/* Question counter */}
          <span className="text-indigo-600 font-bold text-base">
            Question {currentQuestionIndex + 1}/{totalPlanned}
          </span>
        </div>

        {/* ── Centre canvas ── */}
        <div className="flex-1 flex flex-col items-center justify-center gap-5">

          {phase === "idle" ? (
            /* ── Start screen ── */
            <div className="flex flex-col items-center gap-6 text-center px-8 max-w-sm">
              <div className="w-20 h-20 rounded-full bg-white shadow-lg border border-indigo-100 flex items-center justify-center">
                <svg className="w-9 h-9 text-indigo-500 translate-x-0.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-800 mb-2">Begin Interview</h1>
                <p className="text-slate-500 text-sm leading-relaxed">
                  A real-time voice interview based on your resume. Speak naturally — the AI interviewer is ready.
                </p>
              </div>
              <button
                onClick={startInterview}
                disabled={!isConnected}
                className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-full shadow-md transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isConnected ? "Start Interview" : "Connecting…"}
              </button>
              {!isSpeechSupported && (
                <p className="text-amber-600 text-xs">⚠️ Use Chrome or Safari for voice recognition.</p>
              )}
            </div>
          ) : (
            <>
              {/* ── Status pill ── */}
              {statusLabel && (
                <div
                  className="flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium shadow-sm"
                  style={{ background: "rgba(255,255,255,0.75)", border: "1px solid rgba(203,213,225,0.6)", backdropFilter: "blur(8px)" }}
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ background: statusDotColor, boxShadow: `0 0 6px ${statusDotColor}` }}
                  />
                  <span style={{ color: statusDotColor }}>{statusLabel}</span>
                </div>
              )}

              {/* ── The orb ── */}
              <InterviewOrb phase={phase} audioVolume={audioVolume} />

              {/* ── Error ── */}
              {error && (
                <div className="px-4 py-2 bg-red-50 border border-red-200 rounded-full text-red-600 text-xs font-medium shadow-sm">
                  ⚠️ {error}
                </div>
              )}
            </>
          )}
        </div>

        {/* ── Bottom control bar ── */}
        {phase !== "idle" && (
          <div className="flex flex-col items-center gap-3 pb-6 z-10">

            {/* Finish Speaking — only during listening */}
            {phase === "listening" && (
              <button
                onClick={finishSpeaking}
                className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-full shadow-md transition-all"
              >
                <CheckCircleIcon className="w-4 h-4" />
                Done Speaking
              </button>
            )}

            {/* End Interview + Hide/Show Transcript */}
            <div className="flex items-center gap-3">
              <button
                onClick={endInterview}
                className="flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-semibold text-white transition-all shadow-sm"
                style={{ background: "#c0392b" }}
                onMouseEnter={e => (e.currentTarget.style.background = "#a93226")}
                onMouseLeave={e => (e.currentTarget.style.background = "#c0392b")}
              >
                <StopIcon className="w-3.5 h-3.5" />
                End Interview
              </button>

              <button
                onClick={() => setShowTranscript(p => !p)}
                className="flex items-center gap-2 px-5 py-3 bg-white hover:bg-slate-50 rounded-2xl text-slate-600 text-sm font-semibold border border-slate-200 shadow-sm transition-all"
              >
                <ChatIcon className="w-3.5 h-3.5" />
                {showTranscript ? "Hide Transcript" : "Show Transcript"}
              </button>
            </div>
          </div>
        )}

        {/* ── Camera / help — bottom-left ── */}
        <div className="absolute bottom-6 left-6 flex items-center gap-2 z-20">
          {cameraStream ? (
            <div className="relative w-44 h-28 rounded-2xl overflow-hidden shadow-xl border border-white/40">
              <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
              <button
                onClick={toggleCamera}
                className="absolute top-1.5 right-1.5 w-5 h-5 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white transition-colors"
              >
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
              </button>
            </div>
          ) : (
            <button
              onClick={toggleCamera}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl text-white text-sm font-medium shadow-md transition-all"
              style={{ background: "#334155" }}
              onMouseEnter={e => (e.currentTarget.style.background = "#1e293b")}
              onMouseLeave={e => (e.currentTarget.style.background = "#334155")}
            >
              <CameraIcon className="w-4 h-4" />
              Turn On Camera
            </button>
          )}
          <button
            className="w-8 h-8 rounded-full border border-slate-300 bg-white/60 flex items-center justify-center text-slate-400 text-sm font-bold hover:border-slate-400 transition-colors"
            title="Help"
          >?</button>
        </div>
      </div>

      {/* ══════════════ RIGHT: Live Transcript panel ══════════════ */}
      {showTranscript && (
        <div
          className="w-[360px] shrink-0 flex flex-col slide-in-right"
          style={{
            background: "rgba(238,240,248,0.6)",
            backdropFilter: "blur(12px)",
            borderLeft: "1px solid rgba(203,213,225,0.4)",
          }}
        >
          {/* Panel header */}
          <div
            className="px-5 py-4 shrink-0"
            style={{ borderBottom: "1px solid rgba(203,213,225,0.35)" }}
          >
            <h3 className="font-semibold text-slate-700 text-base">Live Transcript</h3>
          </div>

          {/* Messages list */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 scrollbar-thin">

            {/* Past Q&A pairs */}
            {questions.map((q, idx) => {
              const isCurrent = idx === currentQuestionIndex && phase !== "completed";
              if (isCurrent) return null; // skip current question — shown below live
              return (
                <div key={idx} className="space-y-3">
                  <AiBubble text={q.question} />
                  {q.answer && <YouBubble text={q.answer} />}
                </div>
              );
            })}

            {/* Current question (always visible when not completed) */}
            {phase !== "completed" && currentQ && (
              <div className="space-y-3">
                <AiBubble text={currentQ.question} />

                {/* Live user transcript during listening/processing */}
                {(phase === "listening" || phase === "processing") && (
                  <YouBubble text={transcript || liveTranscript || "…"} />
                )}
              </div>
            )}

            <div ref={messagesEnd} />
          </div>
        </div>
      )}
    </div>
  );
}
