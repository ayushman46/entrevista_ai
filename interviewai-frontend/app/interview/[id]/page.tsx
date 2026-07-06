"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Bot,
  Camera,
  CameraOff,
  ChevronLeft,
  ChevronRight,
  FileText,
  LoaderCircle,
  Mic,
  MicOff,
  PanelRightClose,
  PanelRightOpen,
  SquarePen,
  StopCircle,
  Video,
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
    idle: { label: "Ready", className: "bg-slate-100 text-slate-600" },
    greeting: { label: "Interviewer speaking", className: "bg-sky-100 text-sky-700" },
    listening: { label: "Recording response", className: "bg-emerald-100 text-emerald-700" },
    processing: { label: "Processing", className: "bg-amber-100 text-amber-700" },
    completed: { label: "Completed", className: "bg-slate-200 text-slate-700" },
  }[phase];

  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${config.className}`}>
      {config.label}
    </span>
  );
}

function PulseVisualizer({ phase, vol }: { phase: Phase; vol: number }) {
  const bars = phase === "greeting" ? [0.45, 0.75, 0.55, 0.85, 0.6, 0.7, 0.5] : [0.35, 0.5, 0.7, 0.85, 0.65, 0.45, 0.3];

  return (
    <div className="relative flex h-72 w-72 items-center justify-center">
      <div className={`absolute inset-0 rounded-full border border-slate-200/60 transition-transform duration-700 ${phase === "listening" || phase === "greeting" ? "scale-110" : "scale-100"}`} />
      <div className={`absolute inset-6 rounded-full border border-slate-200/50 transition-transform duration-1000 ${phase === "listening" || phase === "greeting" ? "scale-105" : "scale-100"}`} />
      <div className="absolute inset-10 rounded-full bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.95),rgba(226,232,240,0.75))] shadow-[0_24px_90px_-30px_rgba(15,23,42,0.45)]" />

      <div
        className="relative flex h-44 w-44 items-center justify-center rounded-full border border-white/70 bg-white/90 shadow-[0_24px_80px_-35px_rgba(15,23,42,0.5)]"
        style={{ transform: phase === "listening" ? `scale(${1 + vol / 260})` : "scale(1)" }}
      >
        <div className="flex h-28 items-end gap-1.5">
          {(phase === "listening" || phase === "greeting") ? (
            bars.map((bar, index) => (
              <span
                key={index}
                className={`w-2 rounded-full ${phase === "greeting" ? "bg-sky-500" : "bg-slate-700"}`}
                style={{
                  height: `${Math.max(18, bar * 78 * (phase === "listening" ? 1 + vol / 70 : 1))}px`,
                  animationDelay: `${index * 0.08}s`,
                }}
              />
            ))
          ) : phase === "processing" ? (
            <LoaderCircle className="h-8 w-8 animate-spin text-slate-300" />
          ) : (
            <Mic className="h-10 w-10 text-slate-300" />
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
  const [showTranscript, setShowTranscript] = useState(true);
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
  }, [questions, phase, transcript, liveTranscript, showTranscript]);

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
    } catch {
      // Ignore audio meter failures; the interview can still continue.
    }

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
    [
      addQuestion,
      camStream,
      currentQuestionIndex,
      interviewId,
      liveTranscript,
      playAudio,
      recordAnswer,
      resetTranscript,
      router,
      setFinalReport,
      setQuestionIndex,
      startListening,
      startRecording,
      transcript,
    ]
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

  useEffect(
    () => () => {
      stopAudio();
      stopRecording();
      stopListening();
      camStream?.getTracks().forEach((track) => track.stop());
    },
    [camStream, stopAudio, stopRecording, stopListening]
  );

  if (!currentQ) {
    return (
      <div className="flex min-h-screen items-center justify-center text-white">
        <div className="flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-5 py-3 shadow-[0_20px_80px_-40px_rgba(0,0,0,0.4)] backdrop-blur-xl">
          <LoaderCircle className="h-5 w-5 animate-spin text-white" />
          <span className="text-sm font-medium text-slate-300">Connecting to session</span>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="page-shell">
        <div className="ambient ambient-one"></div>
        <div className="ambient ambient-two"></div>

        <header className="topbar">
          <div className="brand">
            <div className="brand-mark">V</div>
            <div>
              <p className="brand-name">VitaHire</p>
              <p className="brand-tag">Live interview</p>
            </div>
          </div>
          <div className="topbar-actions">
            <div className="hidden items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300 md:flex">
              <span className="inline-flex items-center gap-2">
                <span className={`h-2.5 w-2.5 rounded-full ${isConnected ? "bg-emerald-500" : "bg-amber-400"}`} />
                {isConnected ? "Connected" : "Syncing"}
              </span>
            </div>
            <Link className="button button-secondary" href="/resume" onClick={() => camStream?.getTracks().forEach((track) => track.stop())}>Exit</Link>
            <button className="button button-primary" onClick={endInterview}>Finish session</button>
          </div>
        </header>

        <main className="page-main">
          <section className="section interview-layout">
            <div className="interview-main">
              <div className="session-banner">
                <span>Role: <strong>{useInterviewStore.getState().role.replace(/_/g, ' ')}</strong></span>
                <span>Candidate: <strong>{useInterviewStore.getState().candidateName || "Candidate"}</strong></span>
                <span>Question {currentQuestionIndex + 1} of {totalPlanned}</span>
              </div>

              {/* Central interaction area */}
              <div className="flex flex-col items-center justify-center rounded-[1.75rem] border border-white/10 bg-white/5 p-6 text-center backdrop-blur" style={{ minHeight: '400px' }}>
                  {phase === "idle" ? (
                    <div className="max-w-lg space-y-6">
                      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-950 text-white">
                        <Bot className="h-7 w-7" />
                      </div>
                      <div>
                        <h2 className="text-3xl font-semibold tracking-tight text-white">Ready to begin</h2>
                        <p className="mt-3 text-sm leading-7 text-slate-400">
                          Make sure your microphone is on, then start the session. The interviewer will begin with a question based on your resume and selected role.
                        </p>
                      </div>

                      {!isSupported && (
                        <div className="rounded-2xl border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-sm text-amber-200">
                          Speech recognition requires Chrome or Safari.
                        </div>
                      )}

                      <button
                        onClick={startInterview}
                        disabled={!isConnected}
                        className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3.5 text-sm font-semibold text-slate-950 transition hover:-translate-y-0.5 hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {isConnected ? "Start interview" : "Connecting"}
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-8 w-full relative pb-16">
                      <PulseVisualizer phase={phase} vol={vol} />

                      <div className="max-w-xl space-y-3 relative z-10">
                        <div className="flex items-center justify-center gap-2">
                          <PhaseChip phase={phase} />
                        </div>
                        <h2 className="text-2xl font-semibold tracking-tight text-white">
                          {phase === "listening"
                            ? "Speak naturally."
                            : phase === "greeting"
                              ? "Listening to the interviewer."
                              : phase === "processing"
                                ? "Processing your answer."
                                : "Interview completed."}
                        </h2>
                        <p className="text-sm leading-7 text-slate-400">
                          {phase === "listening"
                            ? "Answer in your own words. The live transcript updates as you speak."
                            : phase === "greeting"
                              ? "The AI is asking the question and the session is preparing for your reply."
                              : phase === "processing"
                                ? "Your answer is being evaluated before the next prompt is generated."
                                : "You can review the report in the next screen."}
                        </p>
                      </div>

                      {error && (
                        <div className="rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-200 relative z-10">
                          {error}
                        </div>
                      )}
                      
                      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 z-20">
                        <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 shadow-[0_20px_80px_-40px_rgba(0,0,0,0.4)] backdrop-blur-xl">
                          {phase === "listening" && (
                            <button
                              onClick={finishSpeaking}
                              className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-slate-200"
                            >
                              <MicOff className="h-4 w-4" />
                              Done speaking
                            </button>
                          )}
                          <button
                            onClick={endInterview}
                            className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-rose-600 transition hover:bg-rose-50"
                          >
                            <StopCircle className="h-4 w-4" />
                            End session
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
              </div>
              
              <div className="chat-panel" style={{ marginTop: '1rem', minHeight: '150px' }}>
                <div className="chat-bubble interviewer">
                  <strong>Current Prompt:</strong><br/>{currentQ.question}
                </div>
                { (phase === "listening" || phase === "processing") && (
                  <div className="chat-bubble candidate">
                    <strong>Live Transcript:</strong><br/>
                    {transcript || liveTranscript || "Start speaking and your answer will appear here."}
                  </div>
                )}
                { phase === "processing" && (
                  <div className="chat-bubble interviewer" style={{ opacity: 0.7 }}>
                    Evaluating response...
                  </div>
                )}
                <div ref={msgEnd} />
              </div>

            </div>

            <aside className="interview-side">
              <div className="side-card" style={{ padding: '0', overflow: 'hidden' }}>
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-300 p-4 border-b border-white/10">
                  <Video className="h-4 w-4" />
                  Camera preview
                </div>
                <div className="bg-slate-950 relative aspect-video">
                  {camStream ? (
                    <>
                      <video ref={videoRef} autoPlay playsInline muted className="h-full w-full object-cover" />
                      <button
                        onClick={toggleCam}
                        className="absolute right-3 top-3 rounded-full bg-black/50 p-2 text-white transition hover:bg-black/70"
                      >
                        <CameraOff className="h-4 w-4" />
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={toggleCam}
                      className="flex h-full w-full flex-col items-center justify-center gap-3 bg-white/5 text-white transition hover:bg-white/10"
                    >
                      <Camera className="h-6 w-6 text-sky-300" />
                      <span className="text-sm font-medium">Enable camera</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="side-card">
                <p className="simple-panel-label">Live scoring</p>
                <div className="score-list">
                  <div><span>Communication</span><strong>{currentQuestionIndex > 0 ? questions[currentQuestionIndex-1]?.evaluation?.communication_score || "--" : "--"}</strong></div>
                  <div><span>Technical</span><strong>{currentQuestionIndex > 0 ? questions[currentQuestionIndex-1]?.evaluation?.technical_score || "--" : "--"}</strong></div>
                  <div><span>Confidence</span><strong>{currentQuestionIndex > 0 ? questions[currentQuestionIndex-1]?.evaluation?.confidence_score || "--" : "--"}</strong></div>
                </div>
              </div>
            </aside>
          </section>
        </main>
      </div>
    </>
  );
}
