"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useInterviewStore } from "@/store/interviewStore";
import { api } from "@/services/api";
import Link from "next/link";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

function ScoreCard({ score, label }: { score: number; label: string }) {
  const color = score >= 7.5 ? "text-emerald-600" : score >= 5.5 ? "text-amber-500" : "text-red-500";
  return (
    <div className="p-6 rounded-3xl bg-slate-50 border border-slate-100 flex flex-col justify-between">
      <span className="text-sm font-medium text-slate-500">{label}</span>
      <div className="mt-4 flex items-baseline gap-1">
        <span className={`text-4xl font-bold tracking-tight ${color}`}>{score?.toFixed(1)}</span>
        <span className="text-sm font-medium text-slate-400">/ 10</span>
      </div>
    </div>
  );
}

function RecommendationBadge({ rec }: { rec: string }) {
  const r = (rec || "").toLowerCase();
  if (r.includes("strong")) return <span className="px-4 py-2 rounded-full bg-emerald-100 text-emerald-700 font-semibold text-sm">Strong Hire</span>;
  if (r.includes("hire")) return <span className="px-4 py-2 rounded-full bg-emerald-50 text-emerald-600 font-semibold text-sm">Hire</span>;
  if (r.includes("maybe")) return <span className="px-4 py-2 rounded-full bg-amber-50 text-amber-600 font-semibold text-sm">Maybe</span>;
  return <span className="px-4 py-2 rounded-full bg-red-50 text-red-600 font-semibold text-sm">No Hire</span>;
}

export default function ReportPage() {
  const params = useParams();
  const router = useRouter();
  const interviewId = params.id as string;
  const { finalReport, setFinalReport } = useInterviewStore();

  const [report, setReport] = useState<any>(finalReport);
  const [loading, setLoading] = useState(!finalReport);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (finalReport) { setReport(finalReport); setLoading(false); return; }
    if (!interviewId) return;
    setLoading(true);
    api.completeInterview(interviewId)
      .then(d => { setReport(d); setFinalReport(d); })
      .catch(() => setError("Failed to load report. Ensure the backend server is running."))
      .finally(() => setLoading(false));
  }, [finalReport, interviewId, setFinalReport]);

  const pdfLink = report?.pdf_url?.startsWith("http") ? report.pdf_url : `${BASE_URL}${report?.pdf_url}`;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex flex-col items-center justify-center space-y-6">
        <div className="w-12 h-12 rounded-full border-4 border-slate-200 border-t-slate-900 animate-spin" />
        <div className="text-center">
          <h2 className="text-lg font-semibold text-slate-900">Compiling Report</h2>
          <p className="text-slate-500 text-sm mt-1">Analyzing responses and generating feedback...</p>
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center text-red-500 mb-6">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">Could not load report</h2>
        <p className="text-slate-500 max-w-md mx-auto mb-8">{error}</p>
        <div className="flex gap-4">
          <button onClick={() => router.refresh()} className="px-6 py-3 rounded-full bg-white border border-slate-200 text-slate-700 font-medium hover:bg-slate-50 transition-colors">Try Again</button>
          <Link href="/upload" className="px-6 py-3 rounded-full bg-slate-900 text-white font-medium hover:bg-slate-800 transition-colors">Start New Interview</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-slate-900">
      <nav className="border-b border-slate-100 bg-white px-6 h-16 flex items-center justify-between sticky top-0 z-50">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-slate-900 flex items-center justify-center">
            <div className="w-2 h-2 bg-white rounded-full" />
          </div>
          <span className="font-semibold text-slate-900">Entrevista</span>
        </Link>
        <div className="flex gap-4 items-center">
          {report.pdf_url && (
            <a href={pdfLink} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-slate-600 hover:text-slate-900 flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              Download PDF
            </a>
          )}
          <Link href="/upload" className="px-4 py-2 rounded-full text-sm font-medium bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors">
            New Session
          </Link>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-12 space-y-12 animate-fade-up">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-slate-200">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-100 rounded-full text-xs font-semibold text-slate-600 mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
              Diagnostic Report
            </div>
            <h1 className="text-4xl font-bold tracking-tight mb-2">{report.candidate_name || "Candidate"}</h1>
            <p className="text-lg text-slate-500 capitalize">Target Role: {(report.role || "").replace(/_/g, " ")}</p>
          </div>
          <div className="shrink-0">
            <RecommendationBadge rec={report.hiring_recommendation} />
          </div>
        </div>

        {/* Executive Summary */}
        <section className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-slate-900" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4">Executive Summary</h2>
          <p className="text-lg leading-relaxed text-slate-700">"{report.summary}"</p>
        </section>

        {/* Metrics Grid */}
        <section>
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-6">Performance Metrics</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <ScoreCard score={report.overall_score} label="Overall Score" />
            <ScoreCard score={report.technical_score} label="Technical Depth" />
            <ScoreCard score={report.communication_score} label="Communication" />
            <ScoreCard score={report.confidence_score} label="Confidence" />
          </div>
        </section>

        {/* Strengths & Weaknesses */}
        <section className="grid md:grid-cols-2 gap-6">
          <div className="bg-emerald-50/50 border border-emerald-100 p-8 rounded-3xl">
            <h3 className="flex items-center gap-2 text-emerald-800 font-semibold mb-6">
              <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              Key Strengths
            </h3>
            <ul className="space-y-4">
              {report.strengths?.map((s: string, i: number) => (
                <li key={i} className="text-emerald-900/80 text-sm leading-relaxed">{s}</li>
              ))}
            </ul>
          </div>
          <div className="bg-amber-50/50 border border-amber-100 p-8 rounded-3xl">
            <h3 className="flex items-center gap-2 text-amber-800 font-semibold mb-6">
              <svg className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              Areas for Improvement
            </h3>
            <ul className="space-y-4">
              {report.weaknesses?.map((w: string, i: number) => (
                <li key={i} className="text-amber-900/80 text-sm leading-relaxed">{w}</li>
              ))}
            </ul>
          </div>
        </section>

        {/* Detailed Q&A */}
        {report.questions?.length > 0 && (
          <section>
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-6">Detailed Q&A Breakdown</h2>
            <div className="space-y-6">
              {report.questions.map((q: any, i: number) => (
                <div key={i} className="bg-white border border-slate-100 rounded-3xl p-8 shadow-sm">
                  <div className="flex items-start gap-4 mb-6">
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-semibold text-sm shrink-0">
                      {i + 1}
                    </div>
                    <div className="flex-1">
                      <h4 className="text-lg font-medium text-slate-900 mb-1">{q.question}</h4>
                      <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">
                        Score: {q.score}/10
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-6 pl-12">
                    <div>
                      <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Candidate Answer</h5>
                      <p className="text-sm text-slate-600 leading-relaxed italic bg-slate-50 p-4 rounded-xl">"{q.candidate_answer || q.answer || "No response recorded"}"</p>
                    </div>
                    {q.best_answer && (
                      <div>
                        <h5 className="text-xs font-bold uppercase tracking-wider text-blue-500 mb-2">Ideal Answer</h5>
                        <p className="text-sm text-slate-700 leading-relaxed bg-blue-50/50 p-4 rounded-xl border border-blue-100">{q.best_answer}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
        
        {/* Footer */}
        <div className="pt-8 border-t border-slate-200 text-center pb-20">
          <p className="text-sm text-slate-400 font-mono">Session ID: {report.interview_id}</p>
        </div>

      </main>
    </div>
  );
}
