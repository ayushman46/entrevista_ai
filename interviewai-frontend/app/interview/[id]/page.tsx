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
              startRecording(sendAudio);
            });
          } else {
            // No audio URL, go straight to listening
            setPhase("listening");
            resetTranscript();
            startListening();
            startRecording(sendAudio);
          }
        }
      }
    } else if (msg.type === "error") {
      setError(msg.message);
      if (msg.code === "transcription_failed") {
        setPhase("listening");
        resetTranscript();
        startListening();
        startRecording(sendAudio);
      } else {
        setPhase("listening"); // Attempt to recover
      }
    }
  }, [currentQuestionIndex, interviewId, liveTranscript, transcript, playAudio, recordAnswer, addQuestion, setFinalReport, setQuestionIndex, router, startRecording, startListening, resetTranscript]);

  const { isConnected, sendAudio, sendMessage } = useInterviewWebSocket(interviewId, handleWSMessage);

  // VAD logic: Detect end of user speaking
  useEffect(() => {
    // Only trigger VAD if we have some significant content and are in the listening phase
    if (phase === "listening" && transcript.trim().length > 1) {
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      
      silenceTimerRef.current = setTimeout(async () => {
        // Stop recording/listening and signal turn end
        setPhase("processing");
        await stopRecording();
        stopListening();
        sendMessage({ type: "end_of_turn", transcript });
      }, 2500); // 2.5 seconds of silence
    }
    
    return () => {
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    };
  }, [transcript, phase, stopRecording, stopListening, sendMessage]);

  const startInterview = () => {
    if (!currentQ) return;
    if (!isSpeechSupported) {
      setError("Speech recognition is not supported in this browser. Please use Chrome or Safari.");
      return;
    }
    
    setPhase("greeting");
    // Start mic/recognition immediately to ensure user gesture context is captured
    // but the system will ignore input until the AI finishes speaking
    startListening();
    startRecording(sendAudio);

    if (currentQ.audioUrl) {
      playAudio(currentQ.audioUrl, () => {
        setPhase("listening");
        resetTranscript();
      });
    } else {
      setPhase("listening");
      resetTranscript();
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
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-slate-900 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-slate-500 font-medium">Connecting to Interviewer...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-12 min-h-[85vh] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-12 border-b border-slate-100 pb-6">
        <div>
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Real-Time Technical Interview</h2>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${isConnected ? "bg-green-500 animate-pulse" : "bg-red-500"}`} />
              <span className="text-[10px] font-bold text-slate-400 uppercase">Server</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${isRecording ? "bg-green-500" : "bg-slate-300"}`} />
              <span className="text-[10px] font-bold text-slate-400 uppercase">Mic</span>
            </div>
            <span className="text-slate-900 font-medium capitalize ml-2">{role.replace("_", " ")}</span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-slate-900">{currentQuestionIndex + 1}<span className="text-slate-300 text-lg">/{totalPlanned}</span></div>
          <div className="text-[10px] font-bold text-slate-400 uppercase">Turn</div>
        </div>
      </div>

      {phase === "idle" ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center space-y-8 animate-in fade-in duration-1000">
          <div className="w-24 h-24 bg-slate-900 rounded-full flex items-center justify-center shadow-xl">
            <svg className="w-10 h-10 text-white translate-x-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Join the Conversation</h1>
            <p className="text-slate-500 max-w-sm">The interview will start with a greeting. Simply speak naturally as you would in a real interview.</p>
          </div>
          <button 
            onClick={startInterview} 
            disabled={!isConnected}
            className={`px-12 py-4 text-lg rounded-2xl font-bold shadow-lg hover:shadow-xl transition-all ${
              isConnected ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-400 cursor-not-allowed"
            }`}
          >
            {isConnected ? "Start Interview" : "Connecting..."}
          </button>
        </div>
      ) : (
        <div className="flex-1 flex flex-col space-y-12">
          {/* Question Display */}
          <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm min-h-[160px] flex flex-col justify-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-slate-900" />
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-4">
              {phase === "greeting" ? "Interviewer is Speaking" : "Current Context"}
            </h3>
            <p className="text-slate-900 text-2xl font-medium leading-relaxed tracking-tight">
              {currentQ.question}
            </p>
          </div>

          {/* Interaction Visualizer */}
          <div className="flex flex-col items-center justify-center space-y-6">
            <div className={`w-32 h-32 rounded-full flex items-center justify-center transition-all duration-700 shadow-2xl relative ${
              phase === "greeting" ? "bg-indigo-600 scale-110" : 
              phase === "listening" ? "bg-red-600 scale-110" : 
              "bg-slate-900"
            }`}>
              {/* Outer Waves */}
              {(phase === "greeting" || phase === "listening") && (
                <>
                  <div className={`absolute inset-0 rounded-full border-4 animate-ping opacity-20 ${phase === "greeting" ? "border-indigo-100" : "border-red-100"}`} />
                  <div className={`absolute inset-[-20%] rounded-full border-2 animate-pulse opacity-40 ${phase === "greeting" ? "border-indigo-50" : "border-red-50"}`} />
                </>
              )}

              {phase === "greeting" && (
                <div className="flex gap-1.5 items-end h-8">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="w-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: `${i * 0.1}s`, height: `${40 + Math.random() * 60}%` }} />
                  ))}
                </div>
              )}
              {phase === "listening" && (
                <div className="w-6 h-6 rounded-full bg-white animate-pulse" />
              )}
              {phase === "processing" && (
                <div className="w-10 h-10 border-4 border-white border-t-transparent rounded-full animate-spin" />
              )}
            </div>
            
            <div className="text-center">
              <span className={`text-xs font-bold uppercase tracking-[0.3em] transition-colors duration-500 ${
                phase === "greeting" ? "text-indigo-600" : 
                phase === "listening" ? "text-red-600" : 
                "text-slate-400"
              }`}>
                {phase === "greeting" ? "AI Interviewer Speaking" : 
                 phase === "listening" ? "Listening to You" : 
                 phase === "processing" ? "Agent is Thinking..." : 
                 "Initializing"}
              </span>
            </div>
          </div>

          {/* Real-Time Transcript Area */}
          <div className="min-h-[140px] flex flex-col items-center space-y-4">
            {error ? (
              <div className="p-4 bg-red-50 text-red-600 text-sm font-medium rounded-2xl animate-in shake">
                {error}
              </div>
            ) : phase === "listening" || phase === "processing" ? (
              <>
                <div className="max-w-md text-center text-slate-500 text-lg italic animate-in fade-in">
                  {transcript || liveTranscript || "Speak naturally, I'm listening..."}
                </div>
                
                {phase === "listening" && (
                  <div className="flex flex-col items-center gap-4 animate-in slide-in-from-bottom-4">
                    <button
                      onClick={() => {
                        setPhase("processing");
                        stopRecording();
                        stopListening();
                        sendMessage({ type: "end_of_turn", transcript });
                      }}
                      className="px-6 py-2 bg-slate-900 text-white text-sm font-bold rounded-full shadow-lg hover:bg-slate-800 transition-all"
                    >
                      Finish Speaking
                    </button>
                    <div className="text-[10px] text-slate-400 font-medium uppercase tracking-widest">
                      Manual Fallback if silence not detected
                    </div>
                  </div>
                )}
              </>
            ) : null}
            
            {/* Debug Info */}
            <div className="mt-4 flex gap-4 text-[8px] font-mono text-slate-300 uppercase">
              <span>Phase: {phase}</span>
              <span>Transcript Len: {transcript.length}</span>
              <span>WS: {isConnected ? "Open" : "Closed"}</span>
            </div>
          </div>
        </div>
      )}

      {/* Progress Footer */}
      <div className="mt-auto pt-12">
        <div className="max-w-xl mx-auto">
          <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">
            <span>Interview Progress</span>
            <span>{Math.round(((currentQuestionIndex + 1) / totalPlanned) * 100)}%</span>
          </div>
          <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner">
            <div 
              className="h-full bg-slate-900 transition-all duration-1000 ease-out shadow-lg" 
              style={{ width: `${((currentQuestionIndex + 1) / totalPlanned) * 100}%` }} 
            />
          </div>
        </div>
      </div>
    </div>
  );
}
