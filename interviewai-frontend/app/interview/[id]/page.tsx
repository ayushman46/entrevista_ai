"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Bot,
  Camera,
  CameraOff,
  ChevronRight,
  LoaderCircle,
  Mic,
  MicOff,
  StopCircle,
  Video,
  Activity,
  Award,
  Zap
} from "lucide-react";
import { api } from "@/services/api";
import { useInterviewStore } from "@/store/interviewStore";
import { useAudioRecorder } from "@/hooks/useAudioRecorder";
import { useServerAudio } from "@/hooks/useServerAudio";
import { useInterviewWebSocket } from "@/hooks/useInterviewWebSocket";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { BrandMark } from "@/components/brand-mark";

type Phase = "idle" | "greeting" | "listening" | "processing" | "completed";

function PhaseChip({ phase }: { phase: Phase }) {
  const config = {
    idle: { label: "Ready", className: "border-zinc-800 bg-zinc-900/50 text-zinc-400" },
    greeting: { label: "AI is speaking", className: "border-violet-500/30 bg-violet-500/10 text-violet-300" },
    listening: { label: "Recording response", className: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300 animate-pulse-slow" },
    processing: { label: "Processing", className: "border-amber-500/30 bg-amber-500/10 text-amber-300" },
    completed: { label: "Completed", className: "border-zinc-800 bg-zinc-900 text-white" },
  }[phase];

  return (
    <div className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold backdrop-blur-md ${config.className}`}>
      {phase === "listening" && <div className="mr-2 h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />}
      {config.label}
    </div>
  );
}

function PulseVisualizer({ phase, vol }: { phase: Phase; vol: number }) {
  const bars = phase === "greeting" ? [0.45, 0.75, 0.55, 0.85, 0.6, 0.7, 0.5] : [0.35, 0.5, 0.7, 0.85, 0.65, 0.45, 0.3];

  return (
    <div className="relative flex h-64 w-64 items-center justify-center">
      <div className={`absolute inset-0 rounded-full border border-violet-500/20 transition-transform duration-700 ${phase === "listening" || phase === "greeting" ? "scale-110" : "scale-100"}`} />
      <div className={`absolute inset-4 rounded-full border border-violet-500/30 transition-transform duration-1000 ${phase === "listening" || phase === "greeting" ? "scale-105" : "scale-100"}`} />
      
      <div className="absolute inset-8 rounded-full bg-gradient-to-br from-zinc-800 to-zinc-900 shadow-[0_0_60px_rgba(139,92,246,0.15)]" />

      <div
        className="relative flex h-36 w-36 items-center justify-center rounded-full border border-zinc-700 bg-zinc-950 shadow-2xl transition-transform duration-75"
        style={{ transform: phase === "listening" ? `scale(${1 + vol / 300})` : "scale(1)" }}
      >
        <div className="flex h-16 items-end gap-1.5">
          {(phase === "listening" || phase === "greeting") ? (
            bars.map((bar, index) => (
              <span
                key={index}
                className={`w-1.5 rounded-full ${phase === "greeting" ? "bg-violet-400 shadow-[0_0_10px_rgba(167,139,250,0.5)]" : "bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.5)]"}`}
                style={{
                  height: `${Math.max(12, bar * 60 * (phase === "listening" ? 1 + vol / 80 : 1))}px`,
                  animationDelay: `${index * 0.08}s`,
                }}
              />
            ))
          ) : phase === "processing" ? (
            <LoaderCircle className="h-8 w-8 animate-spin text-zinc-500" />
          ) : (
            <Mic className="h-8 w-8 text-zinc-600" />
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
    questions,
    currentQuestionIndex,
    totalPlanned,
    recordAnswer,
    addQuestion,
    setFinalReport,
    setQuestionIndex,
  } = useInterviewStore();

  const { startRecording, stopRecording, stream } = useAudioRecorder();
  const { playAudio, stopAudio } = useServerAudio();
  const { transcript, isListening, startListening, stopListening, resetTranscript, isSupported } = useSpeechRecognition();

  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState<string | null>(null);
  const [liveTranscript, setLiveTranscript] = useState("");
  const [vol, setVol] = useState(0);
  const [camStream, setCamStream] = useState<MediaStream | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const msgEnd = useRef<HTMLDivElement | null>(null);
  const silenceRef = useRef<NodeJS.Timeout | null>(null);
  const sendAudioRef = useRef<(chunk: Blob) => void>();
  const phaseRef = useRef<Phase>("idle");

  const currentQ = questions[currentQuestionIndex];

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  useEffect(() => {
    msgEnd.current?.scrollIntoView({ behavior: "smooth" });
  }, [questions, phase, transcript, liveTranscript]);

  useEffect(() => {
    if (!stream) {
      setVol(0);
      return;
    }
    let ctx: AudioContext | null = null;
    let rafId = 0;
    try {
      ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);

      const buffer = new Uint8Array(analyser.frequencyBinCount);
      const tick = () => {
        analyser.getByteFrequencyData(buffer);
        const avg = buffer.reduce((acc, value) => acc + value, 0) / buffer.length;
        setVol(Math.min(100, Math.round((avg / 128) * 100)));
        rafId = requestAnimationFrame(tick);
      };
      tick();
    } catch {}
    return () => {
      cancelAnimationFrame(rafId);
      ctx?.close().catch(() => {});
    };
  }, [stream]);

  useEffect(() => {
    if (videoRef.current && camStream) {
      videoRef.current.srcObject = camStream;
    }
  }, [camStream]);

  const toggleCam = async () => {
    if (camStream) {
      camStream.getTracks().forEach((track) => track.stop());
      setCamStream(null);
      return;
    }
    try {
      setCamStream(await navigator.mediaDevices.getUserMedia({ video: true }));
    } catch {
      setError("Camera access was denied.");
    }
  };

  const handleWSMessage = useCallback(
    (msg: any) => {
      if (msg.type === "transcript") {
        setLiveTranscript(msg.text);
        return;
      }

      if (msg.type === "turn_complete") {
        if (msg.interview_complete) {
          setPhase("completed");
          recordAnswer(currentQuestionIndex, msg.transcript || liveTranscript || transcript || "—", msg.evaluation);
          camStream?.getTracks().forEach((track) => track.stop());
          api.completeInterview(interviewId).then((report) => {
            setFinalReport(report);
            router.push(`/report/${interviewId}`);
          });
          return;
        }

        if (msg.next_question) {
          addQuestion(msg.next_question, msg.topic || "Technical", [], msg.audio_url);
          recordAnswer(currentQuestionIndex, msg.transcript || liveTranscript || transcript || "—", msg.evaluation);
          setQuestionIndex(currentQuestionIndex + 1);
          setLiveTranscript("");
          startRecording((chunk) => sendAudioRef.current?.(chunk));
          resetTranscript();

          if (msg.audio_url) {
            setPhase("greeting");
            startListening();
            playAudio(msg.audio_url, () => setPhase((value) => (value === "greeting" ? "listening" : value)));
          } else {
            setPhase("listening");
            startListening();
          }
        }
        return;
      }

      if (msg.type === "error") {
        setError(msg.message);
        setPhase("listening");
        resetTranscript();
        startListening();
        startRecording((chunk) => sendAudioRef.current?.(chunk));
      }
    },
    [addQuestion, camStream, currentQuestionIndex, interviewId, liveTranscript, playAudio, recordAnswer, resetTranscript, router, setFinalReport, setQuestionIndex, startListening, startRecording, transcript]
  );

  const { isConnected, sendAudio, sendMessage } = useInterviewWebSocket(interviewId, handleWSMessage);

  const handleSendAudio = useCallback(
    (chunk: Blob) => {
      if (phaseRef.current === "listening" || phaseRef.current === "greeting") {
        sendAudio(chunk);
      }
    },
    [sendAudio]
  );

  useEffect(() => {
    sendAudioRef.current = handleSendAudio;
  }, [handleSendAudio]);

  useEffect(() => {
    if (phase !== "listening" || transcript.trim().length <= 1) return;
    if (silenceRef.current) clearTimeout(silenceRef.current);
    silenceRef.current = setTimeout(async () => {
      setPhase("processing");
      stopListening();
      await stopRecording();
      sendMessage({ type: "end_of_turn", transcript });
    }, 2200);
    return () => {
      if (silenceRef.current) clearTimeout(silenceRef.current);
    };
  }, [phase, sendMessage, stopListening, stopRecording, transcript]);

  useEffect(() => {
    if (phase === "greeting" && transcript.trim().length > 1) {
      stopAudio();
      setPhase("listening");
    }
  }, [phase, stopAudio, transcript]);

  useEffect(() => {
    if (phase !== "idle" && phase !== "completed" && phase !== "processing" && !isListening && isSupported) {
      startListening();
    }
  }, [isListening, isSupported, phase, startListening]);

  const startInterview = () => {
    if (!currentQ) return;
    if (!isSupported) {
      setError("Speech recognition requires Chrome or Safari.");
      return;
    }
    setPhase("greeting");
    setError(null);
    resetTranscript();
    startRecording((chunk) => sendAudioRef.current?.(chunk));
    startListening();

    if (currentQ.audioUrl) {
      playAudio(currentQ.audioUrl, () => setPhase((value) => (value === "greeting" ? "listening" : value)));
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
    setPhase("processing");
    stopAudio();
    stopListening();
    await stopRecording();
    camStream?.getTracks().forEach((track) => track.stop());
    try {
      const report = await api.completeInterview(interviewId);
      setFinalReport(report);
      router.push(`/report/${interviewId}`);
    } catch {
      router.push(`/report/${interviewId}`);
    }
  };

  useEffect(() => () => {
    stopAudio();
    stopRecording();
    stopListening();
    camStream?.getTracks().forEach((track) => track.stop());
  }, [camStream, stopAudio, stopRecording, stopListening]);

  if (!currentQ) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <div className="flex items-center gap-3 rounded-full border border-zinc-800 bg-zinc-900 px-5 py-3 shadow-2xl">
          <LoaderCircle className="h-5 w-5 animate-spin text-zinc-400" />
          <span className="text-sm font-medium text-zinc-300">Connecting to secure session...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-black text-white">
      {/* Top Navigation */}
      <header className="flex h-16 items-center justify-between border-b border-white/5 bg-black/50 px-6 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <BrandMark />
          <div className="h-4 w-px bg-white/10" />
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              {isConnected && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>}
              <span className={`relative inline-flex h-2 w-2 rounded-full ${isConnected ? "bg-emerald-500" : "bg-amber-500"}`}></span>
            </span>
            <span className="text-xs font-medium uppercase tracking-wider text-zinc-400">
              {isConnected ? "Live Session" : "Syncing"}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden text-sm font-medium text-zinc-500 sm:block">
            Question {currentQuestionIndex + 1} of {totalPlanned}
          </span>
          <button
            onClick={endInterview}
            className="rounded-full bg-rose-500/10 px-4 py-1.5 text-sm font-semibold text-rose-400 transition hover:bg-rose-500/20"
          >
            End Interview
          </button>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="flex flex-1 overflow-hidden">
        
        {/* Left Column: Interaction & Transcript */}
        <section className="flex flex-1 flex-col overflow-hidden border-r border-white/5">
          
          {/* Visualizer Area */}
          <div className="relative flex min-h-[360px] flex-col items-center justify-center border-b border-white/5 bg-zinc-950/50 p-8">
            {phase === "idle" ? (
              <div className="animate-fade-in flex max-w-sm flex-col items-center text-center">
                <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-b from-zinc-800 to-zinc-900 shadow-2xl border border-zinc-700">
                  <Bot className="h-10 w-10 text-white" />
                </div>
                <h2 className="text-2xl font-bold tracking-tight text-white">Start the interview</h2>
                <p className="mt-2 text-sm text-zinc-400 leading-relaxed">
                  Make sure you are in a quiet environment. The AI agent will begin with a question based on your resume.
                </p>
                <button
                  onClick={startInterview}
                  disabled={!isConnected}
                  className="mt-8 inline-flex items-center gap-2 rounded-full bg-white px-8 py-3 text-sm font-semibold text-black transition-all hover:scale-105 disabled:opacity-50"
                >
                  {isConnected ? "Begin Now" : "Connecting..."}
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-6">
                <PulseVisualizer phase={phase} vol={vol} />
                <div className="flex flex-col items-center gap-2 mt-4">
                  <PhaseChip phase={phase} />
                  {phase === "listening" && (
                    <button
                      onClick={finishSpeaking}
                      className="mt-2 inline-flex items-center gap-2 rounded-full border border-zinc-700 bg-zinc-800 px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-zinc-700"
                    >
                      <MicOff className="h-3.5 w-3.5" />
                      Done Speaking
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Transcript Area */}
          <div className="flex-1 overflow-y-auto bg-black p-6 custom-scrollbar">
            <div className="mx-auto max-w-3xl space-y-6">
              
              <div className="group flex gap-4">
                <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-600 shadow-[0_0_15px_rgba(139,92,246,0.3)]">
                  <Bot className="h-4 w-4 text-white" />
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-zinc-200">AI Interviewer</span>
                  </div>
                  <p className="text-[15px] leading-relaxed text-zinc-300 bg-zinc-900/50 p-4 rounded-2xl rounded-tl-sm border border-white/5 inline-block">
                    {currentQ.question}
                  </p>
                </div>
              </div>

              {(phase === "listening" || phase === "processing") && (
                <div className="group flex gap-4 flex-row-reverse">
                  <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-800">
                    <span className="text-xs font-medium text-white">You</span>
                  </div>
                  <div className="flex-1 space-y-1 flex flex-col items-end">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-zinc-200">Candidate</span>
                    </div>
                    <p className="text-[15px] leading-relaxed text-white bg-zinc-800 p-4 rounded-2xl rounded-tr-sm inline-block max-w-[85%] text-left">
                      {transcript || liveTranscript || <span className="text-zinc-500 italic">Listening...</span>}
                    </p>
                  </div>
                </div>
              )}
              
              {phase === "processing" && (
                <div className="flex items-center gap-3 text-sm text-zinc-500 justify-center py-4">
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                  Generating follow-up question...
                </div>
              )}
              <div ref={msgEnd} />
            </div>
          </div>
        </section>

        {/* Right Column: Telemetry & Camera */}
        <aside className="w-80 bg-zinc-950/30 flex flex-col hidden lg:flex">
          
          {/* Camera View */}
          <div className="border-b border-white/5 p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                <Video className="h-3.5 w-3.5" /> Camera Preview
              </span>
            </div>
            <div className="group relative overflow-hidden rounded-2xl bg-zinc-900 aspect-video border border-white/5">
              {camStream ? (
                <>
                  <video ref={videoRef} autoPlay playsInline muted className="h-full w-full object-cover" />
                  <button
                    onClick={toggleCam}
                    className="absolute right-2 top-2 rounded-full bg-black/60 p-1.5 text-white opacity-0 backdrop-blur transition group-hover:opacity-100 hover:bg-black/80"
                  >
                    <CameraOff className="h-3.5 w-3.5" />
                  </button>
                </>
              ) : (
                <button
                  onClick={toggleCam}
                  className="flex h-full w-full flex-col items-center justify-center gap-2 bg-zinc-900 text-zinc-500 transition hover:bg-zinc-800 hover:text-white"
                >
                  <Camera className="h-5 w-5" />
                  <span className="text-xs font-medium">Enable Camera</span>
                </button>
              )}
            </div>
          </div>

          {/* Telemetry */}
          <div className="flex-1 p-4 overflow-y-auto custom-scrollbar">
            <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-4">
              <Activity className="h-3.5 w-3.5" /> Live Metrics
            </span>
            
            <div className="space-y-3">
              {[
                { label: "Communication", icon: Mic, value: currentQuestionIndex > 0 ? questions[currentQuestionIndex-1]?.evaluation?.communication_score : "--" },
                { label: "Technical Depth", icon: Zap, value: currentQuestionIndex > 0 ? questions[currentQuestionIndex-1]?.evaluation?.technical_score : "--" },
                { label: "Confidence", icon: Award, value: currentQuestionIndex > 0 ? questions[currentQuestionIndex-1]?.evaluation?.confidence_score : "--" },
              ].map((metric, idx) => (
                <div key={idx} className="flex items-center justify-between rounded-xl border border-white/5 bg-zinc-900/50 p-3">
                  <div className="flex items-center gap-2">
                    <metric.icon className="h-4 w-4 text-zinc-500" />
                    <span className="text-sm font-medium text-zinc-300">{metric.label}</span>
                  </div>
                  <span className="text-sm font-semibold text-white">{metric.value}</span>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-xl border border-violet-500/20 bg-violet-500/5 p-4">
              <h4 className="text-xs font-semibold text-violet-300 uppercase tracking-wider mb-2">Session Info</h4>
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Candidate</span>
                  <span className="font-medium text-zinc-200">{useInterviewStore.getState().candidateName || "Candidate"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Target Role</span>
                  <span className="font-medium text-zinc-200 capitalize">{useInterviewStore.getState().role.replace(/_/g, ' ')}</span>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </main>
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: #3f3f46;
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
}
