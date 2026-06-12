"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { api } from "@/services/api";
import { useInterviewStore } from "@/store/interviewStore";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { useSpeechSynthesis } from "@/hooks/useSpeechSynthesis";
import type { EvaluationResult } from "@/types/interview";

export default function InterviewPage() {
  const params = useParams();
  const router = useRouter();
  const interviewId = params.id as string;

  const {
    questions, currentQuestionIndex, role, totalPlanned,
    recordAnswer, addQuestion, setFinalReport,
  } = useInterviewStore();

  const { transcript, isListening, startListening, stopListening, resetTranscript, isSupported, error: speechError } =
    useSpeechRecognition();
  const { speak, isSpeaking, cancel: cancelSpeech } = useSpeechSynthesis();

  const [phase, setPhase] = useState<"speaking" | "recording" | "reviewing" | "evaluating" | "feedback">("speaking");
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const currentQ = questions[currentQuestionIndex];
  const hasSpoken = useRef(false);

  useEffect(() => {
    if (currentQ && !hasSpoken.current) {
      hasSpoken.current = true;
      speak(currentQ.question, () => setPhase("recording"));
    }
    return () => cancelSpeech();
  }, [currentQ, speak, cancelSpeech]);

  const handleStartRecording = () => {
    cancelSpeech();
    startListening();
  };

  const handleStopRecording = () => {
    stopListening();
    setPhase("reviewing");
  };

  const handleSubmitAnswer = async () => {
    const finalTranscript = transcript.trim();
    
    if (!finalTranscript) {
      setError("Please provide a verbal answer before submitting.");
      return;
    }
    
    setError(null);
    setPhase("evaluating");

    try {
      recordAnswer(currentQuestionIndex, finalTranscript);
      const res = await api.submitAnswer(interviewId, currentQuestionIndex, finalTranscript);
      setEvaluation(res.evaluation);

      if (res.interview_complete) {
        setPhase("feedback");
        setTimeout(async () => {
          const report = await api.completeInterview(interviewId);
          setFinalReport(report);
          router.push(`/report/${interviewId}`);
        }, 3000);
      } else {
        setPhase("feedback");
        if (res.next_question) {
          addQuestion(res.next_question, res.evaluation.topic, []);
        }
      }
    } catch (e: any) {
      setError(e.message || "Evaluation failed. Please try again.");
      setPhase("reviewing");
    }
  };

  const handleNextQuestion = () => {
    hasSpoken.current = false;
    resetTranscript();
    setEvaluation(null);
    setPhase("speaking");
  };

  const progress = Math.round((currentQuestionIndex / totalPlanned) * 100);

  return (
    <div className="max-w-2xl mx-auto pb-20">
      {/* Header & Progress */}
      <div className="flex items-center justify-between mb-8 border-b border-slate-100 pb-4">
        <div>
          <span className="text-slate-500 font-medium text-sm">Question {currentQuestionIndex + 1} / {totalPlanned}</span>
          {currentQ && <span className="ml-3 px-2 py-1 bg-slate-100 text-slate-600 text-xs font-medium rounded-full">{currentQ.topic}</span>}
        </div>
        <div className="text-sm font-medium text-slate-500 capitalize">{role.replace("_", " ")}</div>
      </div>

      <div className="w-full h-1 bg-slate-100 rounded-full mb-12 overflow-hidden">
        <div className="h-full bg-slate-900 transition-all duration-500" style={{ width: `${progress}%` }} />
      </div>

      {/* AI Question */}
      <div className="mb-12">
        <div className="flex items-start gap-4 mb-4">
          <div className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">AI</div>
          <div className="pt-2">
            <p className="text-slate-900 text-xl font-medium leading-relaxed tracking-tight">{currentQ?.question || "Loading question..."}</p>
          </div>
        </div>
        {isSpeaking && (
          <div className="ml-14 flex items-center gap-3 text-slate-400 text-sm">
            <div className="flex gap-1">
              {[0, 0.1, 0.2].map(d => <span key={d} className="w-1 h-3 bg-slate-400 rounded-full animate-pulse" style={{ animationDelay: `${d}s` }} />)}
            </div>
            Interviewer is speaking...
          </div>
        )}
      </div>

      {/* Interaction Area */}
      {phase !== "speaking" && phase !== "evaluating" && !evaluation && (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          {/* Voice Input Section */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Spoken Response</h3>
              {isListening && <span className="flex items-center gap-2 text-red-500 text-xs font-bold animate-pulse"><span className="w-2 h-2 rounded-full bg-red-500" /> Recording Live</span>}
            </div>
            
            <div className={`p-6 rounded-2xl border transition-all duration-300 ${isListening ? 'border-red-100 bg-red-50/30' : 'border-slate-100 bg-slate-50'}`}>
              <p className={`min-h-[80px] leading-relaxed ${transcript ? 'text-slate-900' : 'text-slate-400 italic'}`}>
                {transcript || (isListening ? "Listening for your voice..." : "No speech detected yet.")}
              </p>
            </div>

            <div className="mt-4 flex gap-3">
              {!isListening ? (
                <button onClick={handleStartRecording} className="btn-primary">
                  {transcript ? "Re-record Voice" : "Start Speaking"}
                </button>
              ) : (
                <button onClick={handleStopRecording} className="btn-primary !bg-red-600 hover:!bg-red-700">
                  Stop Recording
                </button>
              )}
            </div>
            {(speechError || !isSupported) && (
              <p className="mt-3 text-xs text-red-500 font-medium">{!isSupported ? "Voice recognition not supported in this browser." : speechError}</p>
            )}
          </section>

          {/* Action Footer */}
          <div className="pt-6 border-t border-slate-100 flex flex-col items-center">
            <button 
              onClick={handleSubmitAnswer} 
              disabled={isListening || !transcript.trim()}
              className="btn-primary w-full md:w-64"
            >
              Submit Answer
            </button>
            {error && <p className="mt-4 text-sm text-red-500 font-medium">{error}</p>}
          </div>
        </div>
      )}

      {/* Evaluating/Feedback States */}
      {phase === "evaluating" && (
        <div className="py-20 text-center animate-pulse">
          <p className="text-slate-900 font-medium text-lg">Analyzing your response...</p>
          <p className="text-slate-400 text-sm mt-1">Comparing with technical benchmarks</p>
        </div>
      )}

      {evaluation && phase === "feedback" && (
        <div className="pt-12 border-t border-slate-100 animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-medium text-slate-900">Feedback</h2>
            <div className="px-4 py-1 bg-slate-900 text-white text-xs font-bold rounded-full uppercase tracking-tighter">{evaluation.answer_quality}</div>
          </div>
          
          <div className="grid grid-cols-3 gap-6 mb-10">
            {[
              { label: "Technical", score: evaluation.technical_score },
              { label: "Delivery", score: evaluation.communication_score },
              { label: "Confidence", score: evaluation.confidence_score },
            ].map(({ label, score }) => (
              <div key={label} className="bg-slate-50 p-6 rounded-3xl text-center">
                <div className="text-3xl font-bold text-slate-900 mb-1">{score}<span className="text-xs text-slate-400 font-normal">/10</span></div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</div>
              </div>
            ))}
          </div>

          <p className="text-slate-600 leading-relaxed text-lg mb-10">{evaluation.feedback}</p>

          <button onClick={handleNextQuestion} className="btn-primary w-full md:w-auto">
            {evaluation.follow_up_required ? "Answer Follow-up" : "Next Question"}
          </button>
        </div>
      )}
    </div>
  );
}
