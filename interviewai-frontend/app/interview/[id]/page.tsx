"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { api } from "@/services/api";
import { useInterviewStore } from "@/store/interviewStore";
import { useAudioRecorder } from "@/hooks/useAudioRecorder";
import { useServerAudio } from "@/hooks/useServerAudio";
import { useInterviewWebSocket } from "@/hooks/useInterviewWebSocket";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";

type Phase = "idle" | "greeting" | "listening" | "processing" | "completed";

export default function InterviewPage() {
  const params = useParams();
  const router = useRouter();
  const interviewId = params.id as string;

  const {
    questions, currentQuestionIndex, role, totalPlanned,
    recordAnswer, addQuestion, setFinalReport, setQuestionIndex
  } = useInterviewStore();

  const { startRecording, stopRecording, isRecording } = useAudioRecorder();
  const { playAudio, stopAudio } = useServerAudio();
  const { 
    transcript, 
    startListening, 
    stopListening, 
    resetTranscript, 
    isSupported: isSpeechSupported, 
    error: speechError 
  } = useSpeechRecognition();

  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState<string | null>(null);
  const [liveTranscript, setLiveTranscript] = useState("");
  
  const currentQ = questions[currentQuestionIndex];
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Sync ref to check the current phase in asynchronous handlers
  const phaseRef = useRef(phase);
  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  // Handle auto-scroll to the bottom of the conversation
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [questions, phase, transcript, liveTranscript]);

  // WebSocket message handler
  const handleWSMessage = useCallback((msg: any) => {
    if (msg.type === "transcript") {
      setLiveTranscript(msg.text);
    } else if (msg.type === "turn_complete") {
      if (msg.interview_complete) {
        setPhase("completed");
        recordAnswer(currentQuestionIndex, liveTranscript || transcript || "Audio Response Submitted");
        // Generate final report
        api.completeInterview(interviewId).then(report => {
          setFinalReport(report);
          router.push(`/report/${interviewId}`);
        });
      } else {
        if (msg.next_question) {
          addQuestion(msg.next_question, msg.topic || "Technical", [], msg.audio_url);
          recordAnswer(currentQuestionIndex, liveTranscript || transcript || "Audio Response Submitted");
          setQuestionIndex(currentQuestionIndex + 1);
          setLiveTranscript("");
          
          // Auto-play the next question
          if (msg.audio_url) {
            setPhase("greeting"); // AI speaking
            playAudio(msg.audio_url, () => {
              setPhase("listening");
              resetTranscript();
              startListening();
              // startRecording is already running; its output chunks will now be sent
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
        // Keep recording active
      } else {
        setPhase("listening"); // Attempt to recover
      }
    }
  }, [currentQuestionIndex, interviewId, liveTranscript, transcript, playAudio, recordAnswer, addQuestion, setFinalReport, setQuestionIndex, router, startListening, resetTranscript]);

  const { isConnected, sendAudio, sendMessage } = useInterviewWebSocket(interviewId, handleWSMessage);

  // Conditional audio sender to completely discard chunks while AI is speaking
  const handleSendAudio = useCallback((chunk: Blob) => {
    if (phaseRef.current === "listening") {
      sendAudio(chunk);
    }
  }, [sendAudio]);

  // VAD logic: Detect end of user speaking
  useEffect(() => {
    // Only trigger VAD if we have some significant content and are in the listening phase
    if (phase === "listening" && transcript.trim().length > 1) {
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      
      silenceTimerRef.current = setTimeout(async () => {
        // Stop recording/listening and signal turn end
        setPhase("processing");
        stopListening();
        sendMessage({ type: "end_of_turn", transcript });
      }, 2500); // 2.5 seconds of silence
    }
    
    return () => {
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    };
  }, [transcript, phase, stopListening, sendMessage]);

  const startInterview = () => {
    if (!currentQ) return;
    if (!isSpeechSupported) {
      setError("Speech recognition is not supported in this browser. Please use Chrome or Safari.");
      return;
    }
    
    setPhase("greeting");
    setError(null);
    resetTranscript();

    // Start mic capture immediately to capture browser permission context,
    // but handleSendAudio will discard chunks until phase is "listening"
    startRecording(handleSendAudio);

    if (currentQ.audioUrl) {
      playAudio(currentQ.audioUrl, () => {
        setPhase("listening");
        resetTranscript();
        startListening(); // Only start transcribing locally when AI is done
      });
    } else {
      setPhase("listening");
      resetTranscript();
      startListening();
    }
  };

  // Cleanup
  useEffect(() => {
    return () => {
      stopAudio();
      stopRecording();
      stopListening();
    };
  }, [stopAudio, stopRecording, stopListening]);

  if (!currentQ) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] bg-slate-950 text-white rounded-3xl p-8 border border-slate-800">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-slate-400 font-medium">Connecting to Interviewer...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-8 bg-gradient-to-br from-slate-900 via-slate-950 to-indigo-950/20 text-white rounded-3xl border border-slate-800/80 shadow-2xl min-h-[85vh] flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 border-b border-slate-800/60 pb-6">
        <div>
          <h2 className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
            Adaptive Technical Assessment
          </h2>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? "bg-green-500" : "bg-red-500"}`} />
              <span className="text-[9px] font-bold text-slate-400 uppercase">Stream</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${isRecording ? "bg-green-500 animate-pulse" : "bg-slate-500"}`} />
              <span className="text-[9px] font-bold text-slate-400 uppercase">Mic</span>
            </div>
            <span className="text-slate-300 text-xs font-medium capitalize ml-2 bg-slate-800/50 px-2.5 py-0.5 rounded-full border border-slate-700/50">
              {role.replace("_", " ")}
            </span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-semibold tracking-tight text-white">
            {currentQuestionIndex + 1}
            <span className="text-slate-500 text-sm font-normal"> / {totalPlanned}</span>
          </div>
          <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Active Turn</div>
        </div>
      </div>

      {phase === "idle" ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center py-12 space-y-8 animate-in fade-in duration-700">
          <div className="w-20 h-20 bg-indigo-600/10 border border-indigo-500/20 rounded-full flex items-center justify-center shadow-inner relative group">
            <div className="absolute inset-0 rounded-full bg-indigo-500/10 blur-xl group-hover:bg-indigo-500/20 transition-all" />
            <svg className="w-8 h-8 text-indigo-400 translate-x-0.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-white mb-3">Begin Mock Assessment</h1>
            <p className="text-slate-400 max-w-md mx-auto text-sm leading-relaxed">
              We'll start with a warm greeting to check your connection. Respond naturally as you would to a live recruiter.
            </p>
          </div>
          <button 
            onClick={startInterview} 
            disabled={!isConnected}
            className={`px-8 py-3.5 text-sm rounded-full font-bold shadow-lg transition-all ${
              isConnected 
                ? "bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/10 hover:shadow-indigo-600/20 transform hover:-translate-y-0.5" 
                : "bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700"
            }`}
          >
            {isConnected ? "Start Interview" : "Establishing Stream..."}
          </button>
        </div>
      ) : (
        <div className="flex-1 flex flex-col justify-between space-y-6">
          {/* Conversational Dialogue Window */}
          <div className="flex-1 overflow-y-auto space-y-6 max-h-[360px] min-h-[220px] pr-2 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
            {questions.map((q, idx) => {
              const isCurrent = idx === currentQuestionIndex;
              // If it's the current question and the AI hasn't spoken yet or we are waiting, show it at the bottom actively
              if (isCurrent && phase !== "completed") return null;

              return (
                <div key={idx} className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
                  {/* AI Bubble */}
                  <div className="flex gap-3 items-start">
                    <div className="w-8 h-8 rounded-full bg-indigo-950 border border-indigo-500/30 flex items-center justify-center text-[10px] font-bold text-indigo-300 shrink-0 shadow-md">
                      AI
                    </div>
                    <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-2xl rounded-tl-none max-w-[85%] shadow-sm">
                      <span className="text-indigo-400 text-[9px] font-bold uppercase tracking-wider block mb-1">
                        Topic: {q.topic}
                      </span>
                      <p className="text-slate-200 text-sm leading-relaxed">{q.question}</p>
                    </div>
                  </div>
                  
                  {/* Candidate Bubble */}
                  {q.answer && (
                    <div className="flex gap-3 items-start justify-end">
                      <div className="bg-indigo-950/40 border border-indigo-900/40 p-4 rounded-2xl rounded-tr-none max-w-[85%] text-right shadow-sm">
                        <span className="text-indigo-400 text-[9px] font-bold uppercase tracking-wider block mb-1">
                          You
                        </span>
                        <p className="text-slate-300 text-sm leading-relaxed italic">
                          "{q.answer}"
                        </p>
                      </div>
                      <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-[10px] font-bold text-white shrink-0 shadow-md shadow-indigo-600/10">
                        YOU
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Current Active Bubble */}
            {phase !== "completed" && currentQ && (
              <div className="space-y-4 animate-in fade-in duration-500">
                <div className="flex gap-3 items-start">
                  <div className="w-8 h-8 rounded-full bg-indigo-900 border border-indigo-500 flex items-center justify-center text-[10px] font-bold text-indigo-200 shrink-0 shadow-lg animate-pulse">
                    AI
                  </div>
                  <div className="bg-slate-900 border border-slate-800/80 p-5 rounded-2xl rounded-tl-none max-w-[85%] shadow-md relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500" />
                    <span className="text-indigo-400 text-[9px] font-bold uppercase tracking-wider block mb-1">
                      Current Topic: {currentQ.topic}
                    </span>
                    <p className="text-white text-base font-medium leading-relaxed">
                      {currentQ.question}
                    </p>
                  </div>
                </div>

                {/* Candidate Active Speaking Bubble */}
                {(phase === "listening" || phase === "processing") && (
                  <div className="flex gap-3 items-start justify-end animate-in slide-in-from-bottom-2 duration-300">
                    <div className="bg-slate-900/40 border border-slate-800/60 p-4 rounded-2xl rounded-tr-none max-w-[85%] text-right min-w-[120px]">
                      <span className="text-indigo-400 text-[9px] font-bold uppercase tracking-wider block mb-1.5">
                        {phase === "listening" ? "Listening..." : "Evaluating..."}
                      </span>
                      <p className="text-slate-300 text-sm leading-relaxed italic">
                        {transcript || liveTranscript || "Speak naturally..."}
                      </p>
                    </div>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0 shadow-md ${
                      phase === "listening" ? "bg-red-600 animate-pulse shadow-red-600/15" : "bg-indigo-600 animate-spin"
                    }`}>
                      {phase === "listening" ? "REC" : "•••"}
                    </div>
                  </div>
                )}
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Central Dial & Visualizer Controls */}
          <div className="flex flex-col items-center justify-center border-t border-slate-900/60 pt-6">
            <div className={`w-28 h-28 rounded-full flex items-center justify-center transition-all duration-700 shadow-2xl relative border ${
              phase === "greeting" ? "bg-indigo-950/80 border-indigo-500 scale-105" : 
              phase === "listening" ? "bg-red-950/80 border-red-500 scale-105" : 
              "bg-slate-900 border-slate-800"
            }`}>
              {/* Outer Pulse rings */}
              {phase === "greeting" && (
                <>
                  <div className="absolute inset-0 rounded-full border-4 border-indigo-500/20 animate-ping" />
                  <div className="absolute inset-[-15%] rounded-full border border-indigo-400/10 animate-pulse" />
                </>
              )}
              {phase === "listening" && (
                <>
                  <div className="absolute inset-0 rounded-full border-4 border-red-500/20 animate-ping" />
                  <div className="absolute inset-[-15%] rounded-full border border-red-400/10 animate-pulse" />
                </>
              )}

              {phase === "greeting" && (
                <div className="flex gap-1 items-end h-6">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="w-1 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s`, height: `${40 + Math.random() * 60}%` }} />
                  ))}
                </div>
              )}
              {phase === "listening" && (
                <div className="w-4 h-4 rounded-full bg-red-500 animate-ping" />
              )}
              {phase === "processing" && (
                <div className="w-8 h-8 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
              )}
            </div>
            
            <div className="text-center mt-3 mb-4">
              <span className={`text-[10px] font-bold uppercase tracking-[0.25em] transition-colors duration-500 ${
                phase === "greeting" ? "text-indigo-400 animate-pulse" : 
                phase === "listening" ? "text-red-400" : 
                phase === "processing" ? "text-indigo-400" : 
                "text-slate-500"
              }`}>
                {phase === "greeting" ? "AI Interviewer Speaking" : 
                 phase === "listening" ? "Microphone Active" : 
                 phase === "processing" ? "Analyzing Response" : 
                 "System Idle"}
              </span>
            </div>

            {/* Error alerts / validation messages */}
            <div className="w-full max-w-md min-h-[48px] flex flex-col items-center justify-center">
              {error ? (
                <div className="px-4 py-2 bg-red-950/40 border border-red-900/60 text-red-200 text-xs font-medium rounded-xl animate-in shake">
                  ⚠️ {error}
                </div>
              ) : phase === "listening" ? (
                <div className="flex flex-col items-center gap-2 animate-in slide-in-from-bottom-2 duration-300">
                  <button
                    onClick={() => {
                      setPhase("processing");
                      stopListening();
                      sendMessage({ type: "end_of_turn", transcript });
                    }}
                    className="px-5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-full shadow-md transition-colors"
                  >
                    Finish Speaking
                  </button>
                  <span className="text-[9px] text-slate-500 uppercase tracking-wider">
                    Manual submit if silence detection delays
                  </span>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* Progress Footer */}
      <div className="mt-6 border-t border-slate-900/60 pt-6">
        <div className="max-w-xl mx-auto">
          <div className="flex justify-between text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-2">
            <span>Interview Completion Progress</span>
            <span>{Math.round(((currentQuestionIndex + 1) / totalPlanned) * 100)}%</span>
          </div>
          <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden shadow-inner border border-slate-800/20">
            <div 
              className="h-full bg-gradient-to-r from-indigo-600 to-indigo-500 transition-all duration-1000 ease-out shadow-lg shadow-indigo-500/20" 
              style={{ width: `${((currentQuestionIndex + 1) / totalPlanned) * 100}%` }} 
            />
          </div>
        </div>
      </div>
    </div>
  );
}
