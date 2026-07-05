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

/* ─── Visualizer Orb ──────────────────────────────────────────── */
function Orb({ phase, vol }: { phase: Phase; vol: number }) {
  const scale = phase === "listening" ? 1 + vol / 350 : 1;
  const animClass =
    phase === "greeting"   ? "orb-speaking"  :
    phase === "listening"  ? "orb-listening" :
    phase === "processing" ? "orb-thinking"  :
    phase === "idle"       ? "orb-idle"      : "orb-idle";

  return (
    <div className="relative flex items-center justify-center" style={{ width: 280, height: 280 }}>
      {/* Outer ambient glow rings */}
      {(phase === "listening" || phase === "greeting") && (
        <>
          <div
            className="absolute rounded-full"
            style={{
              inset: "-30px",
              background: "radial-gradient(ellipse, rgba(124,58,237,0.15) 0%, transparent 70%)",
              animation: "ring-expand 2s ease-out infinite",
            }}
          />
          <div
            className="absolute rounded-full"
            style={{
              inset: "-15px",
              background: "radial-gradient(ellipse, rgba(99,102,241,0.2) 0%, transparent 70%)",
              animation: "ring-expand 2s ease-out 0.7s infinite",
            }}
          />
        </>
      )}

      {/* Main orb */}
      <div
        className={`relative rounded-full overflow-hidden ${animClass}`}
        style={{
          width: 220,
          height: 220,
          transform: `scale(${scale})`,
          transition: "transform 0.08s ease-out",
          boxShadow: phase === "listening"
            ? "0 0 60px rgba(124,58,237,0.4), 0 0 120px rgba(99,102,241,0.2)"
            : phase === "greeting"
              ? "0 0 50px rgba(99,102,241,0.35), 0 0 100px rgba(168,85,247,0.15)"
              : "0 0 30px rgba(124,58,237,0.2)",
        }}
      >
        {/* Conic gradient base */}
        <div
          className="absolute inset-0"
          style={{
            background: "conic-gradient(from 0deg at 45% 50%, #fde68a 0deg, #fb7185 60deg, #a78bfa 120deg, #60a5fa 180deg, #34d399 240deg, #fbbf24 300deg, #fde68a 360deg)",
          }}
        />
        {/* Overlay for depth and shine */}
        <div
          className="absolute inset-0"
          style={{
            background: "radial-gradient(ellipse at 35% 30%, rgba(255,255,255,0.45) 0%, rgba(255,255,255,0.05) 50%, transparent 75%)",
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background: "radial-gradient(ellipse at 65% 75%, rgba(99,102,241,0.4) 0%, transparent 55%)",
          }}
        />
        {/* Dark overlay for non-idle phases */}
        <div
          className="absolute inset-0"
          style={{ background: "rgba(12,12,20,0.08)" }}
        />

        {/* EQ Bars when listening */}
        {phase === "listening" && (
          <div className="absolute inset-0 flex items-center justify-center gap-1">
            {[0.7, 1.0, 0.55, 1.2, 0.8, 1.0, 0.65].map((h, i) => (
              <div
                key={i}
                className="eq-bar"
                style={{
                  height: `${Math.max(8, h * 28 * (1 + vol / 80))}px`,
                  animationDelay: `${i * 0.12}s`,
                  opacity: 0.9,
                }}
              />
            ))}
          </div>
        )}

        {/* Spinner when processing */}
        {phase === "processing" && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-12 rounded-full border-4" style={{ borderColor: "rgba(255,255,255,0.2)", borderTopColor: "white", animation: "spin 0.8s linear infinite" }} />
          </div>
        )}

        {/* AI Speaking bars */}
        {phase === "greeting" && (
          <div className="absolute inset-0 flex items-center justify-center gap-1.5">
            {[1, 1.5, 0.8, 1.8, 1.2, 1.6, 0.9].map((h, i) => (
              <div
                key={i}
                className="eq-bar"
                style={{
                  height: `${h * 16}px`,
                  animationDelay: `${i * 0.1}s`,
                  opacity: 0.85,
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Mic icon hint under orb when listening */}
      {phase === "listening" && vol < 5 && (
        <div
          className="absolute bottom-0 text-xs font-medium px-3 py-1 rounded-full"
          style={{ background: "rgba(28,28,46,0.9)", color: "#94A3B8", border: "1px solid rgba(255,255,255,0.08)" }}
        >
          Start speaking…
        </div>
      )}
    </div>
  );
}

/* ─── Transcript Bubbles ──────────────────────────────────────── */
function AiBubble({ text, active = false }: { text: string; active?: boolean }) {
  return (
    <div className="flex gap-3 items-start animate-[fade-up_0.3s_ease-out_forwards]">
      <div
        className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5"
        style={{ background: active ? "linear-gradient(135deg,#7C3AED,#6366F1)" : "rgba(124,58,237,0.2)", color: "#A78BFA", border: active ? "none" : "1px solid rgba(124,58,237,0.3)" }}
      >
        AI
      </div>
      <div>
        <p className="text-xs font-semibold mb-1.5" style={{ color: "#7C3AED" }}>AI Interviewer</p>
        <div
          className="px-4 py-3 rounded-2xl rounded-tl-sm text-sm leading-relaxed"
          style={{ background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.15)", color: "#E2E8F0" }}
        >
          {text}
        </div>
      </div>
    </div>
  );
}

function YouBubble({ text, label }: { text: string; label?: string }) {
  return (
    <div className="flex gap-3 items-start animate-[fade-up_0.3s_ease-out_forwards]">
      <div
        className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5"
        style={{ background: "rgba(255,255,255,0.06)", color: "#94A3B8", border: "1px solid rgba(255,255,255,0.08)" }}
      >
        U
      </div>
      <div>
        <p className="text-xs font-semibold mb-1.5" style={{ color: "#94A3B8" }}>{label || "You"}</p>
        <p className="text-sm leading-relaxed" style={{ color: "#94A3B8" }}>{text}</p>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   INTERVIEW PAGE
═══════════════════════════════════════════════════════════════ */
export default function InterviewPage() {
  const params      = useParams();
  const router      = useRouter();
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
  const [timerSec, setTimerSec]         = useState(0);
  const [vol, setVol]                   = useState(0);
  const [showTranscript, setShowTranscript] = useState(true);
  const [camStream, setCamStream]       = useState<MediaStream | null>(null);
  const videoRef    = useRef<HTMLVideoElement | null>(null);
  const msgEnd      = useRef<HTMLDivElement | null>(null);
  const silenceRef  = useRef<NodeJS.Timeout | null>(null);
  const sendAudioRef = useRef<(chunk: Blob) => void>();
  const phaseRef    = useRef<Phase>("idle");

  const currentQ = questions[currentQuestionIndex];

  useEffect(() => { phaseRef.current = phase; }, [phase]);
  useEffect(() => { msgEnd.current?.scrollIntoView({ behavior: "smooth" }); }, [questions, phase, transcript, liveTranscript]);

  /* Timer */
  useEffect(() => {
    if (phase === "idle" || phase === "completed") return;
    const id = setInterval(() => setTimerSec(s => s + 1), 1000);
    return () => clearInterval(id);
  }, [phase]);

  /* Mic volume analyser */
  useEffect(() => {
    if (!stream) { setVol(0); return; }
    let ctx: AudioContext | null = null; let rafId: number;
    try {
      ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const src = ctx.createMediaStreamSource(stream);
      const an  = ctx.createAnalyser(); an.fftSize = 256;
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

  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

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
    if (phase !== "idle" && phase !== "completed" && phase !== "processing" && !isListening && isSpeechSupported)
      startListening();
  }, [isListening, phase, isSpeechSupported, startListening]);

  const startInterview = () => {
    if (!currentQ) return;
    if (!isSpeechSupported) { setError("Speech recognition requires Chrome or Safari."); return; }
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
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0C0C14" }}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-2" style={{ borderColor: "rgba(124,58,237,0.3)", borderTopColor: "#7C3AED", animation: "spin 0.8s linear infinite" }} />
          <p className="text-sm" style={{ color: "#94A3B8" }}>Connecting to AI Interviewer…</p>
        </div>
      </div>
    );
  }

  const statusMap = {
    greeting:   { label: "AI Speaking",  color: "#818CF8", bg: "rgba(99,102,241,0.1)",  border: "rgba(99,102,241,0.25)"  },
    listening:  { label: "Listening",    color: "#10B981", bg: "rgba(16,185,129,0.1)",  border: "rgba(16,185,129,0.25)"  },
    processing: { label: "Processing…",  color: "#F59E0B", bg: "rgba(245,158,11,0.1)",  border: "rgba(245,158,11,0.25)"  },
    idle:       { label: "",             color: "#475569", bg: "transparent",            border: "transparent"            },
    completed:  { label: "Complete",     color: "#10B981", bg: "rgba(16,185,129,0.1)",  border: "rgba(16,185,129,0.25)"  },
  };
  const status = statusMap[phase];

  /* ── RENDER ─────────────────────────────────────────────────── */
  return (
    <div className="h-screen w-screen flex overflow-hidden" style={{ background: "#0C0C14" }}>

      {/* ════ LEFT PANEL ════ */}
      <div className="flex-1 flex flex-col overflow-hidden relative">

        {/* Top bar */}
        <div
          className="flex items-center justify-between px-5 py-3 shrink-0 border-b"
          style={{ borderColor: "rgba(255,255,255,0.05)", background: "rgba(12,12,20,0.8)", backdropFilter: "blur(10px)" }}
        >
          <Link
            href="/upload"
            onClick={() => camStream?.getTracks().forEach(t => t.stop())}
            className="flex items-center gap-1.5 text-sm transition-colors px-3 py-1.5 rounded-full"
            style={{ color: "#94A3B8", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
            onMouseEnter={e => (e.currentTarget.style.color = "#F1F5F9")}
            onMouseLeave={e => (e.currentTarget.style.color = "#94A3B8")}
          >
            ← Exit
          </Link>

          {/* Timer */}
          {phase !== "idle" && phase !== "completed" && (
            <div
              className="flex items-center gap-1.5 text-xs font-mono px-3 py-1.5 rounded-full"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", color: "#94A3B8" }}
            >
              ◷ {fmt(timerSec)}
            </div>
          )}

          {/* Question counter */}
          <div
            className="text-sm font-bold px-3 py-1.5 rounded-full"
            style={{
              background: "rgba(124,58,237,0.12)",
              border: "1px solid rgba(124,58,237,0.25)",
              color: "#A78BFA",
            }}
          >
            Q{currentQuestionIndex + 1}/{totalPlanned}
          </div>
        </div>

        {/* Main canvas */}
        <div className="flex-1 flex flex-col items-center justify-center gap-6 relative px-6">

          {/* Ambient background glow */}
          {phase !== "idle" && (
            <div
              className="absolute pointer-events-none"
              style={{
                inset: 0,
                background: "radial-gradient(ellipse at 50% 50%, rgba(124,58,237,0.06) 0%, transparent 70%)",
              }}
            />
          )}

          {phase === "idle" ? (
            /* ── Start screen ── */
            <div className="flex flex-col items-center gap-6 text-center max-w-sm animate-[fade-up_0.5s_ease-out_forwards]">
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center text-3xl animate-float"
                style={{ background: "rgba(124,58,237,0.1)", border: "1px solid rgba(124,58,237,0.25)", boxShadow: "0 0 40px rgba(124,58,237,0.15)" }}
              >
                🎙
              </div>
              <div>
                <h1 className="text-2xl font-bold mb-2" style={{ color: "#F1F5F9" }}>Ready to begin?</h1>
                <p className="text-sm leading-relaxed" style={{ color: "#94A3B8" }}>
                  Your AI interviewer will ask questions based on your resume. Speak naturally when prompted.
                </p>
              </div>
              {!isSpeechSupported && (
                <div className="px-4 py-2 rounded-xl text-xs" style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.2)", color: "#FCD34D" }}>
                  ⚠ Voice recognition requires Chrome or Safari
                </div>
              )}
              <button
                onClick={startInterview}
                disabled={!isConnected}
                className="px-8 py-3.5 rounded-full text-sm font-bold transition-all hover:scale-105 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
                style={{ background: "linear-gradient(135deg, #7C3AED, #6366F1)", color: "white", boxShadow: "0 4px 30px rgba(124,58,237,0.35)" }}
              >
                {isConnected ? "Start Interview →" : "Connecting…"}
              </button>
            </div>
          ) : (
            <>
              {/* Status pill */}
              {status.label && (
                <div
                  className="flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold"
                  style={{ background: status.bg, border: `1px solid ${status.border}`, color: status.color }}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ background: status.color, boxShadow: `0 0 6px ${status.color}`, animation: "pulse 1.5s ease-in-out infinite" }}
                  />
                  {status.label}
                </div>
              )}

              {/* Orb */}
              <Orb phase={phase} vol={vol} />

              {/* Error */}
              {error && (
                <div className="px-4 py-2 rounded-xl text-xs" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", color: "#FCA5A5" }}>
                  ⚠ {error}
                </div>
              )}
            </>
          )}
        </div>

        {/* Bottom controls */}
        {phase !== "idle" && (
          <div className="flex flex-col items-center gap-3 pb-5 shrink-0">
            {phase === "listening" && (
              <button
                onClick={finishSpeaking}
                className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all hover:scale-105"
                style={{ background: "rgba(124,58,237,0.15)", border: "1px solid rgba(124,58,237,0.35)", color: "#A78BFA" }}
              >
                ✓ Done Speaking
              </button>
            )}
            <div className="flex items-center gap-2.5">
              <button
                onClick={endInterview}
                className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-semibold transition-all hover:scale-105"
                style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", color: "#FCA5A5" }}
              >
                ▪ End Interview
              </button>
              <button
                onClick={() => setShowTranscript(p => !p)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-semibold transition-all"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#94A3B8" }}
              >
                ☰ {showTranscript ? "Hide" : "Show"} Transcript
              </button>
            </div>
          </div>
        )}

        {/* Camera PiP — bottom left */}
        <div className="absolute bottom-5 left-5 flex items-center gap-2 z-20">
          {camStream ? (
            <div className="relative w-40 h-24 rounded-xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 8px 32px rgba(0,0,0,0.5)" }}>
              <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
              <button
                onClick={toggleCam}
                className="absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center text-white text-xs transition-all"
                style={{ background: "rgba(0,0,0,0.6)" }}
                onMouseEnter={e => (e.currentTarget.style.background = "rgba(239,68,68,0.8)")}
                onMouseLeave={e => (e.currentTarget.style.background = "rgba(0,0,0,0.6)")}
              >
                ✕
              </button>
            </div>
          ) : (
            <button
              onClick={toggleCam}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium transition-all"
              style={{ background: "rgba(28,28,46,0.9)", border: "1px solid rgba(255,255,255,0.08)", color: "#94A3B8" }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = "#F1F5F9"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = "#94A3B8"; }}
            >
              📷 Camera
            </button>
          )}
        </div>
      </div>

      {/* ════ RIGHT TRANSCRIPT PANEL ════ */}
      {showTranscript && (
        <div
          className="w-[340px] shrink-0 flex flex-col animate-[slide-right_0.25s_ease-out_forwards]"
          style={{ background: "rgba(19,19,31,0.95)", borderLeft: "1px solid rgba(255,255,255,0.06)" }}
        >
          {/* Header */}
          <div
            className="px-5 py-4 flex items-center justify-between shrink-0"
            style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
          >
            <h3 className="text-sm font-semibold" style={{ color: "#F1F5F9" }}>Live Transcript</h3>
            {phase !== "idle" && phase !== "completed" && (
              <span
                className="flex items-center gap-1.5 text-xs"
                style={{ color: "#94A3B8" }}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
                Live
              </span>
            )}
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5" style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(255,255,255,0.06) transparent" }}>
            {questions.map((q, idx) => {
              const isCurrent = idx === currentQuestionIndex && phase !== "completed";
              if (isCurrent) return null;
              return (
                <div key={idx} className="space-y-3">
                  <AiBubble text={q.question} />
                  {q.answer && <YouBubble text={q.answer} />}
                </div>
              );
            })}

            {phase !== "completed" && currentQ && (
              <div className="space-y-3">
                <AiBubble text={currentQ.question} active />
                {(phase === "listening" || phase === "processing") && (
                  <YouBubble
                    text={transcript || liveTranscript || "…"}
                    label={phase === "listening" ? "You · Listening…" : "You · Processing…"}
                  />
                )}
              </div>
            )}
            <div ref={msgEnd} />
          </div>
        </div>
      )}
    </div>
  );
}
