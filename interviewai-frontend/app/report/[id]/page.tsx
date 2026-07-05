"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useInterviewStore } from "@/store/interviewStore";
import { api } from "@/services/api";
import Link from "next/link";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

function ScoreRing({ score, label }: { score: number; label: string }) {
  const pct = Math.min(100, (score / 10) * 100);
  const color =
    score >= 7.5 ? "#10B981" :
    score >= 5.5 ? "#F59E0B" : "#EF4444";
  const radius = 28, circ = 2 * Math.PI * radius;
  const dash = (pct / 100) * circ;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-20 h-20 flex items-center justify-center">
        <svg className="absolute inset-0 -rotate-90" width="80" height="80">
          <circle cx="40" cy="40" r={radius} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="5" />
          <circle
            cx="40" cy="40" r={radius}
            fill="none"
            stroke={color}
            strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray={`${dash} ${circ - dash}`}
            style={{ filter: `drop-shadow(0 0 6px ${color})` }}
          />
        </svg>
        <span className="text-xl font-extrabold relative z-10" style={{ color }}>{score?.toFixed(1)}</span>
      </div>
      <span className="text-xs font-medium text-center" style={{ color: "#94A3B8" }}>{label}</span>
    </div>
  );
}

function Badge({ rec }: { rec: string }) {
  const r = (rec || "").toLowerCase();
  const cfg =
    r.includes("strong") ? { label: "⭐ Strong Hire",  color: "#10B981", bg: "rgba(16,185,129,0.12)", border: "rgba(16,185,129,0.3)" } :
    r.includes("hire")   ? { label: "✓ Hire",          color: "#10B981", bg: "rgba(16,185,129,0.1)",  border: "rgba(16,185,129,0.25)" } :
    r.includes("maybe")  ? { label: "◑ Maybe",         color: "#F59E0B", bg: "rgba(245,158,11,0.1)",  border: "rgba(245,158,11,0.25)" } :
                           { label: "✕ No Hire",        color: "#EF4444", bg: "rgba(239,68,68,0.1)",   border: "rgba(239,68,68,0.25)"  };
  return (
    <span
      className="px-4 py-1.5 rounded-full text-sm font-bold"
      style={{ background: cfg.bg, border: `1px solid ${cfg.border}`, color: cfg.color }}
    >
      {cfg.label}
    </span>
  );
}

export default function ReportPage() {
  const params      = useParams();
  const router      = useRouter();
  const interviewId = params.id as string;
  const { finalReport, setFinalReport } = useInterviewStore();

  const [report, setReport] = useState<any>(finalReport);
  const [loading, setLoading] = useState(!finalReport);
  const [error, setError]   = useState<string | null>(null);

  useEffect(() => {
    if (finalReport) { setReport(finalReport); setLoading(false); return; }
    if (!interviewId) return;
    setLoading(true);
    api.completeInterview(interviewId)
      .then(d => { setReport(d); setFinalReport(d); })
      .catch(() => setError("Failed to load report. Make sure the backend is running."))
      .finally(() => setLoading(false));
  }, [finalReport, interviewId, setFinalReport]);

  const pdfLink = report?.pdf_url?.startsWith("http") ? report.pdf_url : `${BASE_URL}${report?.pdf_url}`;

  const Shell = ({ children }: { children: React.ReactNode }) => (
    <div className="min-h-screen" style={{ background: "#0C0C14" }}>
      <nav
        className="border-b px-6 h-14 flex items-center justify-between"
        style={{ borderColor: "rgba(255,255,255,0.06)", background: "rgba(12,12,20,0.9)" }}
      >
        <Link href="/" className="flex items-center gap-2">
          <span className="font-bold text-base" style={{ color: "#A78BFA" }}>Entrevista</span>
          <span className="text-xs font-semibold px-1.5 py-0.5 rounded" style={{ background: "rgba(124,58,237,0.2)", color: "#A78BFA", border: "1px solid rgba(124,58,237,0.3)" }}>AI</span>
        </Link>
        <Link href="/upload" className="text-xs px-4 py-2 rounded-full transition-colors" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#94A3B8" }}>
          New Interview
        </Link>
      </nav>
      <main className="max-w-4xl mx-auto px-6 py-10">{children}</main>
    </div>
  );

  if (loading) return (
    <Shell>
      <div className="flex flex-col items-center justify-center py-32 gap-5">
        <div className="w-12 h-12 rounded-full border-2" style={{ borderColor: "rgba(124,58,237,0.2)", borderTopColor: "#7C3AED", animation: "spin 0.8s linear infinite" }} />
        <p className="font-semibold" style={{ color: "#F1F5F9" }}>Generating your report…</p>
        <p className="text-sm" style={{ color: "#94A3B8" }}>This usually takes a few seconds</p>
      </div>
    </Shell>
  );

  if (error || !report) return (
    <Shell>
      <div className="flex flex-col items-center justify-center py-32 gap-5 text-center">
        <div className="text-4xl">⚠</div>
        <p className="font-semibold" style={{ color: "#F1F5F9" }}>Could not load report</p>
        <p className="text-sm max-w-sm" style={{ color: "#94A3B8" }}>{error || "The report data could not be retrieved."}</p>
        <div className="flex gap-3 mt-2">
          <button onClick={() => router.refresh()} className="px-5 py-2.5 rounded-full text-sm font-medium" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "#94A3B8" }}>Retry</button>
          <Link href="/upload" className="px-5 py-2.5 rounded-full text-sm font-semibold" style={{ background: "linear-gradient(135deg,#7C3AED,#6366F1)", color: "white" }}>New Interview</Link>
        </div>
      </div>
    </Shell>
  );

  return (
    <Shell>
      <div className="space-y-6 animate-[fade-up_0.4s_ease-out_forwards]">

        {/* Header */}
        <div
          className="p-6 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          style={{ background: "rgba(28,28,46,0.6)", border: "1px solid rgba(255,255,255,0.07)" }}
        >
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-[#A78BFA] animate-pulse" />
              <h1 className="text-xl font-bold" style={{ color: "#F1F5F9" }}>Interview Report</h1>
            </div>
            <p className="text-sm" style={{ color: "#94A3B8" }}>
              <span style={{ color: "#F1F5F9" }}>{report.candidate_name || "Candidate"}</span>
              {" · "}
              <span style={{ color: "#A78BFA" }}>{(report.role || "").replace(/_/g, " ")}</span>
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge rec={report.hiring_recommendation} />
            {report.pdf_url && (
              <a
                href={pdfLink}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 rounded-full text-sm font-semibold transition-all hover:scale-105"
                style={{ background: "linear-gradient(135deg,#7C3AED,#6366F1)", color: "white", boxShadow: "0 4px 15px rgba(124,58,237,0.3)" }}
              >
                ↓ PDF Report
              </a>
            )}
          </div>
        </div>

        {/* Score rings */}
        <div
          className="p-6 rounded-2xl"
          style={{ background: "rgba(28,28,46,0.6)", border: "1px solid rgba(255,255,255,0.07)" }}
        >
          <h2 className="text-sm font-semibold mb-6" style={{ color: "#94A3B8" }}>PERFORMANCE SCORES</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            <ScoreRing score={report.overall_score}       label="Overall"       />
            <ScoreRing score={report.technical_score}     label="Technical"     />
            <ScoreRing score={report.communication_score} label="Communication" />
            <ScoreRing score={report.confidence_score}    label="Confidence"    />
          </div>
        </div>

        {/* Summary */}
        <div
          className="p-6 rounded-2xl relative overflow-hidden"
          style={{ background: "rgba(124,58,237,0.06)", border: "1px solid rgba(124,58,237,0.2)" }}
        >
          <div className="absolute top-0 left-0 w-1 h-full rounded-l-2xl" style={{ background: "linear-gradient(to bottom,#7C3AED,#6366F1)" }} />
          <h2 className="text-xs font-bold mb-3 uppercase tracking-widest" style={{ color: "#A78BFA" }}>Executive Summary</h2>
          <p className="text-sm leading-relaxed" style={{ color: "#E2E8F0" }}>"{report.summary}"</p>
        </div>

        {/* Strengths & Weaknesses */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div
            className="p-6 rounded-2xl"
            style={{ background: "rgba(16,185,129,0.05)", border: "1px solid rgba(16,185,129,0.15)" }}
          >
            <h3 className="text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-2" style={{ color: "#10B981" }}>
              <span className="w-2 h-2 rounded-full bg-[#10B981]" />
              Key Strengths
            </h3>
            <ul className="space-y-2.5">
              {report.strengths?.map((s: string, i: number) => (
                <li key={i} className="flex gap-2.5 items-start text-sm" style={{ color: "#CBD5E1" }}>
                  <span style={{ color: "#10B981" }} className="shrink-0 mt-0.5">✓</span>
                  {s}
                </li>
              )) || <p className="text-xs" style={{ color: "#475569" }}>No strengths recorded.</p>}
            </ul>
          </div>
          <div
            className="p-6 rounded-2xl"
            style={{ background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.15)" }}
          >
            <h3 className="text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-2" style={{ color: "#EF4444" }}>
              <span className="w-2 h-2 rounded-full bg-[#EF4444]" />
              Areas to Improve
            </h3>
            <ul className="space-y-2.5">
              {report.weaknesses?.map((w: string, i: number) => (
                <li key={i} className="flex gap-2.5 items-start text-sm" style={{ color: "#CBD5E1" }}>
                  <span style={{ color: "#EF4444" }} className="shrink-0 mt-0.5">⚠</span>
                  {w}
                </li>
              )) || <p className="text-xs" style={{ color: "#475569" }}>No areas identified.</p>}
            </ul>
          </div>
        </div>

        {/* Learning Roadmap */}
        {report.learning_roadmap?.length > 0 && (
          <div
            className="p-6 rounded-2xl"
            style={{ background: "rgba(28,28,46,0.6)", border: "1px solid rgba(255,255,255,0.07)" }}
          >
            <h3 className="text-xs font-bold uppercase tracking-widest mb-5" style={{ color: "#A78BFA" }}>Learning Roadmap</h3>
            <div className="space-y-4">
              {report.learning_roadmap.map((item: string, i: number) => (
                <div key={i} className="flex gap-4 items-start">
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                    style={{ background: "rgba(124,58,237,0.2)", border: "1px solid rgba(124,58,237,0.35)", color: "#A78BFA" }}
                  >
                    {i + 1}
                  </div>
                  <p className="text-sm leading-relaxed pt-0.5" style={{ color: "#CBD5E1" }}>{item}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Q&A Breakdown */}
        {report.questions?.length > 0 && (
          <div
            className="p-6 rounded-2xl"
            style={{ background: "rgba(28,28,46,0.6)", border: "1px solid rgba(255,255,255,0.07)" }}
          >
            <h3 className="text-xs font-bold uppercase tracking-widest mb-6" style={{ color: "#A78BFA" }}>
              Question-by-Question Breakdown
            </h3>
            <div className="space-y-8">
              {report.questions.map((q: any, i: number) => {
                const sc = q.score || 0;
                const scColor = sc >= 7.5 ? "#10B981" : sc >= 5.5 ? "#F59E0B" : "#EF4444";
                return (
                  <div key={i} className="space-y-3 pb-8 border-b last:pb-0 last:border-b-0" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                    <div className="flex items-start gap-2">
                      <span className="text-xs font-bold font-mono shrink-0 mt-0.5" style={{ color: "#A78BFA" }}>Q{i + 1}.</span>
                      <p className="text-sm font-semibold" style={{ color: "#F1F5F9" }}>{q.question}</p>
                      <span
                        className="ml-auto shrink-0 px-2 py-0.5 rounded-full text-xs font-bold"
                        style={{ background: `${scColor}18`, color: scColor, border: `1px solid ${scColor}40` }}
                      >
                        {sc}/10
                      </span>
                    </div>

                    {/* Candidate answer */}
                    <div
                      className="p-4 rounded-xl"
                      style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
                    >
                      <p className="text-xs font-semibold mb-1.5" style={{ color: "#94A3B8" }}>Your Answer</p>
                      <p className="text-sm leading-relaxed italic" style={{ color: "#94A3B8" }}>
                        "{q.candidate_answer || q.answer || "No answer recorded"}"
                      </p>
                    </div>

                    {/* Best answer */}
                    {q.best_answer && (
                      <div
                        className="p-4 rounded-xl relative overflow-hidden"
                        style={{ background: "rgba(124,58,237,0.06)", border: "1px solid rgba(124,58,237,0.18)" }}
                      >
                        <div className="absolute top-0 left-0 w-0.5 h-full" style={{ background: "linear-gradient(to bottom,#7C3AED,#6366F1)" }} />
                        <p className="text-xs font-semibold mb-1.5" style={{ color: "#A78BFA" }}>Ideal Answer</p>
                        <p className="text-sm leading-relaxed" style={{ color: "#CBD5E1" }}>{q.best_answer}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Footer CTA */}
        <div className="flex justify-between items-center pb-4">
          <p className="text-xs font-mono" style={{ color: "#475569" }}>
            Session: {report.interview_id?.slice(0, 12)}…
          </p>
          <div className="flex gap-3">
            {report.pdf_url && (
              <a
                href={pdfLink}
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-2.5 rounded-full text-sm font-semibold transition-all hover:scale-105"
                style={{ background: "linear-gradient(135deg,#7C3AED,#6366F1)", color: "white", boxShadow: "0 4px 15px rgba(124,58,237,0.25)" }}
              >
                ↓ Download PDF
              </a>
            )}
            <Link
              href="/upload"
              className="px-5 py-2.5 rounded-full text-sm font-semibold transition-all"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#94A3B8" }}
            >
              New Interview →
            </Link>
          </div>
        </div>

      </div>
    </Shell>
  );
}
