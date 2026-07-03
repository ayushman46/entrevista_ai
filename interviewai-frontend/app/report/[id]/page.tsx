"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useInterviewStore } from "@/store/interviewStore";
import { api } from "@/services/api";
import Link from "next/link";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function ReportPage() {
  const params = useParams();
  const router = useRouter();
  const interviewId = params.id as string;
  const { finalReport, setFinalReport } = useInterviewStore();
  
  const [report, setReport] = useState<any>(finalReport);
  const [loading, setLoading] = useState(!finalReport);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (finalReport) {
      setReport(finalReport);
      setLoading(false);
    } else if (interviewId) {
      setLoading(true);
      setError(null);
      api.completeInterview(interviewId)
        .then((data) => {
          setReport(data);
          setFinalReport(data);
        })
        .catch((err) => {
          console.error("Error loading report from API:", err);
          setError("Failed to retrieve the report. Please make sure the backend is active.");
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [finalReport, interviewId, setFinalReport]);

  const getScoreColor = (score: number) => {
    if (score >= 7.5) return "text-emerald-400";
    if (score >= 5.5) return "text-amber-400";
    return "text-rose-400";
  };

  const getScoreBarColor = (score: number) => {
    if (score >= 7.5) return "bg-emerald-500 shadow-emerald-500/20";
    if (score >= 5.5) return "bg-amber-500 shadow-amber-500/20";
    return "bg-rose-500 shadow-rose-500/20";
  };

  const getRecommendationBadge = (recommendation: string) => {
    const rec = recommendation?.toLowerCase() || "";
    if (rec.includes("strong")) {
      return (
        <span className="px-4 py-1.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm font-bold uppercase tracking-wider rounded-full shadow-lg shadow-emerald-500/5 animate-pulse">
          🌟 Strong Hire
        </span>
      );
    }
    if (rec.includes("hire")) {
      return (
        <span className="px-4 py-1.5 bg-teal-500/10 border border-teal-500/30 text-teal-400 text-sm font-bold uppercase tracking-wider rounded-full shadow-lg shadow-teal-500/5">
          ✅ Hire
        </span>
      );
    }
    if (rec.includes("maybe")) {
      return (
        <span className="px-4 py-1.5 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-sm font-bold uppercase tracking-wider rounded-full shadow-lg shadow-amber-500/5">
          🤔 Maybe
        </span>
      );
    }
    return (
      <span className="px-4 py-1.5 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm font-bold uppercase tracking-wider rounded-full shadow-lg shadow-rose-500/5">
        ❌ Do Not Hire
      </span>
    );
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-12 flex flex-col items-center justify-center min-h-[70vh] text-center">
        <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-6" />
        <h2 className="text-xl font-semibold text-white mb-2">Analyzing Candidate Answers...</h2>
        <p className="text-slate-400 max-w-sm text-sm">
          Please wait while the LLM orchestrator aggregates grades, compiles feedback, and compiles the final diagnostics PDF.
        </p>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-16 text-center bg-slate-900/40 border border-slate-800/80 text-white rounded-3xl p-8 shadow-2xl backdrop-blur-md">
        <div className="w-16 h-16 bg-red-950/40 border border-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="text-2xl font-semibold text-white mb-3">Failed to load report</h2>
        <p className="text-slate-400 max-w-md mx-auto mb-8 text-sm leading-relaxed">
          {error || "We couldn't retrieve the report details for this interview session. Make sure you completed the assessment."}
        </p>
        <div className="flex justify-center gap-4">
          <button onClick={() => router.refresh()} className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-full transition-colors text-sm border border-slate-700">
            Retry Connection
          </button>
          <Link href="/upload" className="btn-primary text-sm">
            Start New Interview
          </Link>
        </div>
      </div>
    );
  }

  const pdfLink = report.pdf_url?.startsWith("http") 
    ? report.pdf_url 
    : `${BASE_URL}${report.pdf_url}`;

  return (
    <div className="max-w-3xl mx-auto px-6 py-8 bg-gradient-to-br from-slate-900 via-slate-950 to-indigo-950/20 text-white rounded-3xl border border-slate-800/80 shadow-2xl min-h-[85vh] flex flex-col justify-between space-y-8 animate-in fade-in duration-500">
      
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-slate-800/60 gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-md shadow-indigo-500/20 animate-pulse" />
            <h1 className="text-2xl font-bold tracking-tight text-white">Diagnostic Audit Report</h1>
          </div>
          <p className="text-slate-400 text-sm font-medium">
            Candidate: <span className="text-white font-semibold">{report.candidate_name}</span> · Role: <span className="text-indigo-400 capitalize">{report.role?.replace("_", " ")}</span>
          </p>
        </div>
        <div className="flex items-center gap-2 self-start md:self-auto">
          {getRecommendationBadge(report.hiring_recommendation)}
        </div>
      </div>

      {/* Overview/Executive Summary Card */}
      <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl shadow-inner backdrop-blur-md relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-500" />
        <h2 className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-2.5">Executive Summary</h2>
        <p className="text-slate-200 text-sm leading-relaxed italic">
          "{report.summary}"
        </p>
      </div>

      {/* Scores dashboard */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Overall Rating", score: report.overall_score, desc: "Aggregated score" },
          { label: "Technical Ability", score: report.technical_score, desc: "Code & theory correctness" },
          { label: "Communication", score: report.communication_score, desc: "Clarity & articulation" },
          { label: "Confidence Level", score: report.confidence_score, desc: "Security & speed" },
        ].map(({ label, score, desc }) => (
          <div key={label} className="bg-slate-900/40 border border-slate-800/60 p-5 rounded-2xl flex flex-col justify-between shadow-sm relative group hover:border-slate-800 transition-all">
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">{label}</span>
              <p className="text-slate-400 text-[9px] leading-tight mb-4">{desc}</p>
            </div>
            <div>
              <div className="flex items-baseline gap-1.5 mb-2">
                <span className={`text-3xl font-extrabold tracking-tight ${getScoreColor(score)}`}>
                  {score?.toFixed(1)}
                </span>
                <span className="text-slate-600 text-xs font-medium">/ 10.0</span>
              </div>
              <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800/30">
                <div 
                  className={`h-full rounded-full transition-all duration-1000 ${getScoreBarColor(score)}`}
                  style={{ width: `${(score || 0) * 10}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Diagnostic breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Strengths card */}
        <div className="bg-slate-900/40 border border-slate-800/50 p-6 rounded-2xl shadow-sm flex flex-col space-y-4">
          <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2 pb-3 border-b border-slate-800/60">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-md shadow-emerald-500/20" />
            Key Technical Strengths
          </h3>
          <ul className="space-y-3 flex-1">
            {report.strengths?.map((s: string, i: number) => (
              <li key={i} className="text-slate-300 text-xs leading-relaxed flex gap-2.5 items-start">
                <span className="text-emerald-400 font-bold text-sm leading-none pt-0.5">✓</span>
                <span>{s}</span>
              </li>
            ))}
            {(!report.strengths || report.strengths.length === 0) && (
              <p className="text-slate-500 text-xs italic">No specific strengths recorded.</p>
            )}
          </ul>
        </div>

        {/* Weaknesses card */}
        <div className="bg-slate-900/40 border border-slate-800/50 p-6 rounded-2xl shadow-sm flex flex-col space-y-4">
          <h3 className="text-sm font-bold text-rose-400 uppercase tracking-wider flex items-center gap-2 pb-3 border-b border-slate-800/60">
            <span className="w-2 h-2 rounded-full bg-rose-500 shadow-md shadow-rose-500/20" />
            Focus Areas to Improve
          </h3>
          <ul className="space-y-3 flex-1">
            {report.weaknesses?.map((w: string, i: number) => (
              <li key={i} className="text-slate-300 text-xs leading-relaxed flex gap-2.5 items-start">
                <span className="text-rose-400 font-bold text-sm leading-none pt-0.5">⚠</span>
                <span>{w}</span>
              </li>
            ))}
            {(!report.weaknesses || report.weaknesses.length === 0) && (
              <p className="text-slate-500 text-xs italic">No critical improvement areas identified.</p>
            )}
          </ul>
        </div>
      </div>

      {/* Learning Roadmap */}
      <div className="bg-slate-900/30 border border-slate-800/60 p-6 rounded-2xl shadow-sm space-y-5">
        <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2 pb-3 border-b border-slate-800/60">
          <span className="w-2 h-2 rounded-full bg-indigo-500 shadow-md shadow-indigo-500/20" />
          Recommended Learning Roadmap
        </h3>
        <div className="space-y-4">
          {report.learning_roadmap?.map((item: string, i: number) => (
            <div key={i} className="flex gap-4 items-start relative group">
              <div className="w-6 h-6 rounded-full bg-indigo-950 border border-indigo-500/30 flex items-center justify-center text-[10px] font-bold text-indigo-300 shrink-0 shadow-md">
                {i + 1}
              </div>
              <div className="space-y-1">
                <p className="text-slate-200 text-xs leading-relaxed">{item}</p>
              </div>
            </div>
          ))}
          {(!report.learning_roadmap || report.learning_roadmap.length === 0) && (
            <p className="text-slate-500 text-xs italic">No customized learning paths needed.</p>
          )}
        </div>
      </div>

      {/* Detailed Q&A Prep Guide */}
      <div className="bg-slate-900/30 border border-slate-800/60 p-6 rounded-2xl shadow-sm space-y-6">
        <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2 pb-3 border-b border-slate-800/60">
          <span className="w-2 h-2 rounded-full bg-indigo-500 shadow-md shadow-indigo-500/20" />
          Detailed Q&A Breakdown & Preparation Guide
        </h3>
        <div className="space-y-6">
          {report.questions?.map((q: any, i: number) => (
            <div key={i} className="space-y-3 pb-6 border-b border-slate-800/30 last:border-b-0 last:pb-0">
              <div className="flex gap-2 items-start">
                <span className="text-indigo-400 font-bold text-xs font-mono pt-0.5">Q{i + 1}.</span>
                <p className="text-white text-xs font-semibold leading-relaxed">{q.question}</p>
              </div>
              <div className="bg-slate-950/45 border border-slate-900/40 p-4 rounded-xl text-left">
                <span className="text-indigo-400 text-[9px] font-bold uppercase tracking-wider block mb-1">
                  Candidate Answer (Score: {q.score}/10)
                </span>
                <p className="text-slate-300 text-xs leading-relaxed italic">
                  "{q.candidate_answer || q.answer || "No answer recorded"}"
                </p>
              </div>
              <div className="bg-indigo-950/20 border border-indigo-900/30 p-4 rounded-xl text-left relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500" />
                <span className="text-indigo-400 text-[9px] font-bold uppercase tracking-wider block mb-1">
                  Best Possible Answer (For Prep)
                </span>
                <p className="text-slate-200 text-xs leading-relaxed">
                  {q.best_answer || "No model answer generated"}
                </p>
              </div>
            </div>
          ))}
          {(!report.questions || report.questions.length === 0) && (
            <p className="text-slate-500 text-xs italic">No detailed question diagnostics available.</p>
          )}
        </div>
      </div>

      {/* Footer controls */}
      <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-slate-800/60 justify-between items-center">
        <p className="text-[10px] text-slate-500 uppercase tracking-widest font-mono">
          Assessment Session ID: {report.interview_id?.slice(0, 8)}...
        </p>
        <div className="flex gap-3 w-full sm:w-auto">
          {report.pdf_url && (
            <a
              href={pdfLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 sm:flex-initial px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-full shadow-lg shadow-indigo-600/10 hover:shadow-indigo-600/20 transition-all text-center"
            >
              Download PDF Report ↓
            </a>
          )}
          <Link href="/upload" className="flex-1 sm:flex-initial px-6 py-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white text-xs font-bold rounded-full shadow-md transition-all text-center">
            New Interview →
          </Link>
        </div>
      </div>
    </div>
  );
}
