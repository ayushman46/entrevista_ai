"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Award,
  BarChart3,
  BookOpenCheck,
  Download,
  Lightbulb,
  RefreshCcw,
  ShieldCheck,
  Sparkles,
  TriangleAlert,
} from "lucide-react";
import { useInterviewStore } from "@/store/interviewStore";
import { api } from "@/services/api";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

function RecommendationBadge({ rec }: { rec: string }) {
  const normalized = (rec || "").toLowerCase();
  if (normalized.includes("strong")) {
    return <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-sm font-semibold text-emerald-300"><ShieldCheck className="h-4 w-4" />Strong hire</span>;
  }
  if (normalized.includes("hire")) {
    return <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-sm font-semibold text-emerald-300"><Award className="h-4 w-4" />Hire</span>;
  }
  if (normalized.includes("maybe")) {
    return <span className="inline-flex items-center gap-2 rounded-full border border-amber-400/20 bg-amber-400/10 px-4 py-2 text-sm font-semibold text-amber-300"><Sparkles className="h-4 w-4" />Maybe</span>;
  }
  return <span className="inline-flex items-center gap-2 rounded-full border border-rose-400/20 bg-rose-400/10 px-4 py-2 text-sm font-semibold text-rose-300"><TriangleAlert className="h-4 w-4" />No hire</span>;
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
    if (finalReport) {
      setReport(finalReport);
      setLoading(false);
      return;
    }

    if (!interviewId) return;

    setLoading(true);
    api
      .completeInterview(interviewId)
      .then((data) => {
        setReport(data);
        setFinalReport(data);
      })
      .catch(() => setError("Failed to load the report. Make sure the backend server is running."))
      .finally(() => setLoading(false));
  }, [finalReport, interviewId, setFinalReport]);

  const pdfLink = report?.pdf_url?.startsWith("http") ? report.pdf_url : `${BASE_URL}${report?.pdf_url}`;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-white">
        <div className="flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-5 py-3 shadow-[0_20px_80px_-40px_rgba(0,0,0,0.4)] backdrop-blur-xl">
          <RefreshCcw className="h-5 w-5 animate-spin text-white" />
          <span className="text-sm font-medium text-slate-300">Compiling your report</span>
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="flex min-h-screen items-center justify-center text-white">
        <div className="flex flex-col items-center gap-4 rounded-[2rem] border border-white/10 bg-white/5 p-8 text-center shadow-[0_40px_120px_-60px_rgba(0,0,0,0.95)] max-w-lg">
          <TriangleAlert className="h-10 w-10 text-rose-400" />
          <h2 className="text-2xl font-semibold tracking-tight">Could not load report</h2>
          <p className="text-sm leading-7 text-slate-400">{error}</p>
          <div className="mt-4 flex gap-3">
            <button onClick={() => router.refresh()} className="button button-secondary">Try again</button>
            <Link href="/upload" className="button button-primary">Start new session</Link>
          </div>
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
              <p className="brand-tag">Interview results</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {report.pdf_url && (
              <a href={pdfLink} target="_blank" rel="noopener noreferrer" className="button button-secondary text-sm">
                <Download className="h-4 w-4 mr-2" /> Download PDF
              </a>
            )}
            <Link href="/upload" className="button button-primary text-sm">
              <ArrowLeft className="h-4 w-4 mr-2" /> New session
            </Link>
          </div>
        </header>

        <main className="page-main">
          <section className="section form-layout" style={{ marginTop: '3rem' }}>
            <div className="form-copy">
              <span className="eyebrow">Diagnostic summary</span>
              <h1>{report.candidate_name || "Candidate"}’s results are ready.</h1>
              <p style={{ marginTop: '1.5rem', fontSize: '1.1rem' }}>
                Target role: <span className="capitalize text-white">{(report.role || "").replace(/_/g, " ")}</span>
              </p>
              <div className="flex gap-3" style={{ marginTop: '1.5rem' }}>
                <RecommendationBadge rec={report.hiring_recommendation} />
              </div>
            </div>

            <div className="simple-panel">
              <p className="simple-panel-label">Live report preview</p>
              <h2 style={{ marginTop: '0.5rem', marginBottom: '1rem', fontSize: '1.2rem', fontWeight: 600 }}>Candidate context</h2>
              
              <div className="score-list">
                <div><span>Interview ID</span><strong style={{ fontSize: '0.75rem', opacity: 0.7, wordBreak: 'break-all', maxWidth: '60%', textAlign: 'right' }}>{report.interview_id}</strong></div>
                <div><span>Overall Score</span><strong>{report.overall_score?.toFixed(1)} <span style={{opacity:0.5}}>/ 10</span></strong></div>
                <div><span>Confidence</span><strong>{report.confidence_score?.toFixed(1)} <span style={{opacity:0.5}}>/ 10</span></strong></div>
                <div><span>Technical Depth</span><strong>{report.technical_score?.toFixed(1)} <span style={{opacity:0.5}}>/ 10</span></strong></div>
                <div><span>Communication</span><strong>{report.communication_score?.toFixed(1)} <span style={{opacity:0.5}}>/ 10</span></strong></div>
              </div>
            </div>
          </section>

          <section className="section compact-grid" style={{ marginTop: '2.5rem' }}>
            <div className="mini-card" style={{ background: 'linear-gradient(180deg, rgba(16,185,129,0.1), rgba(16,185,129,0.02))', borderColor: 'rgba(16,185,129,0.2)' }}>
              <span className="flex items-center gap-2 text-emerald-300"><ShieldCheck className="h-4 w-4" /> STRENGTHS</span>
              <ul className="space-y-3 mt-4">
                {report.strengths?.map((item: string, i: number) => (
                  <li key={i} className="text-sm opacity-90 leading-relaxed border-b border-emerald-500/10 pb-2 last:border-0">{item}</li>
                ))}
              </ul>
            </div>
            
            <div className="mini-card" style={{ background: 'linear-gradient(180deg, rgba(245,158,11,0.1), rgba(245,158,11,0.02))', borderColor: 'rgba(245,158,11,0.2)' }}>
              <span className="flex items-center gap-2 text-amber-300"><Lightbulb className="h-4 w-4" /> AREAS TO IMPROVE</span>
              <ul className="space-y-3 mt-4">
                {report.weaknesses?.map((item: string, i: number) => (
                  <li key={i} className="text-sm opacity-90 leading-relaxed border-b border-amber-500/10 pb-2 last:border-0">{item}</li>
                ))}
              </ul>
            </div>
            
            <div className="mini-card">
              <span className="flex items-center gap-2 text-violet-300"><Sparkles className="h-4 w-4" /> EXECUTIVE SUMMARY</span>
              <p className="text-sm opacity-90 leading-relaxed italic mt-4">"{report.summary}"</p>
            </div>
          </section>

          {report.questions?.length > 0 && (
            <section className="section" style={{ paddingBottom: '3rem' }}>
              <span className="eyebrow" style={{ marginBottom: '1.5rem' }}>Question breakdown</span>
              <div className="flex flex-col gap-5 mt-2">
                {report.questions.map((q: any, index: number) => (
                  <div key={index} className="simple-panel flex flex-col md:flex-row gap-6 items-start">
                    <div className="flex-1 w-full">
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="text-lg font-semibold pr-4">{index + 1}. {q.question}</h3>
                        <div className="px-3 py-1 rounded-full border border-white/10 bg-white/5 text-sm font-semibold whitespace-nowrap">
                          Score: {q.score}/10
                        </div>
                      </div>
                      
                      <div className="flex flex-col gap-3 mt-4">
                        <div className="chat-bubble candidate" style={{ maxWidth: '100%', borderRadius: '14px', background: 'rgba(255,255,255,0.03)', alignSelf: 'stretch' }}>
                          <strong className="text-[0.7rem] uppercase tracking-wider opacity-50 mb-1 block">Candidate Answer</strong>
                          <span className="italic text-sm leading-relaxed text-slate-300">“{q.candidate_answer || q.answer || "No response recorded"}”</span>
                        </div>
                        
                        {q.best_answer && (
                          <div className="chat-bubble interviewer" style={{ maxWidth: '100%', borderRadius: '14px', alignSelf: 'stretch' }}>
                            <strong className="text-[0.7rem] uppercase tracking-wider text-violet-300 opacity-80 mb-1 block">Ideal Answer</strong>
                            <span className="text-sm leading-relaxed">{q.best_answer}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </main>
      </div>
    </>
  );
}
