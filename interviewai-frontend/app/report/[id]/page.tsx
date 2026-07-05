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
import { BrandMark } from "@/components/brand-mark";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

function ScoreCard({
  score,
  label,
  icon: Icon,
}: {
  score: number;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  const color = score >= 7.5 ? "text-emerald-300" : score >= 5.5 ? "text-amber-300" : "text-rose-300";
  return (
    <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5 shadow-[0_30px_100px_-60px_rgba(0,0,0,0.95)]">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-slate-400">{label}</span>
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 text-white">
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <div className="mt-6 flex items-end gap-2">
        <span className={`text-4xl font-semibold tracking-tight ${color}`}>{score?.toFixed(1)}</span>
        <span className="pb-1 text-sm font-medium text-slate-500">/ 10</span>
      </div>
    </div>
  );
}

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
        <div className="flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-5 py-3">
          <RefreshCcw className="h-5 w-5 animate-spin text-white" />
          <span className="text-sm font-medium text-slate-300">Compiling your report</span>
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6 text-white">
        <div className="max-w-xl rounded-[2rem] border border-white/10 bg-white/5 p-8 text-center shadow-[0_40px_120px_-60px_rgba(0,0,0,0.95)]">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-400/10 text-rose-200">
            <TriangleAlert className="h-7 w-7" />
          </div>
          <h2 className="mt-6 text-2xl font-semibold tracking-tight">Could not load report</h2>
          <p className="mt-3 text-sm leading-7 text-slate-400">{error}</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <button
              onClick={() => router.refresh()}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-slate-200 transition hover:bg-white/10"
            >
              <RefreshCcw className="h-4 w-4" />
              Try again
            </button>
            <Link
              href="/upload"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-200"
            >
              Start new interview
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen text-white">
      <div className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:72px_72px] opacity-20" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(124,58,237,0.45),transparent_30%),radial-gradient(circle_at_top_right,rgba(16,185,129,0.16),transparent_24%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.12),transparent_28%)]" />

        <div className="relative mx-auto max-w-7xl px-6 py-6 lg:px-8">
          <header className="glass-panel flex items-center justify-between rounded-[2rem] px-5 py-4">
            <BrandMark />
            <div className="flex items-center gap-3">
              {report.pdf_url && (
                <a
                  href={pdfLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-white/10"
                >
                  <Download className="h-4 w-4" />
                  Download PDF
                </a>
              )}
              <Link
                href="/upload"
                className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-slate-200"
              >
                <ArrowLeft className="h-4 w-4" />
                New session
              </Link>
            </div>
          </header>

          <section className="mt-8 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="rounded-[2.25rem] border border-white/10 bg-[linear-gradient(180deg,rgba(14,18,34,0.96),rgba(8,10,22,0.98))] p-8 shadow-[0_40px_120px_-60px_rgba(0,0,0,0.95)] lg:p-10">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-200">
                <BookOpenCheck className="h-4 w-4 text-violet-300" />
                Diagnostic summary
              </div>

              <h1 className="mt-8 max-w-3xl text-5xl font-semibold tracking-tight sm:text-6xl lg:text-[4.8rem] lg:leading-[0.95]">
                {report.candidate_name || "Candidate"}’s interview results are ready.
              </h1>

              <p className="mt-6 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">
                Target role: <span className="capitalize text-white">{(report.role || "").replace(/_/g, " ")}</span>
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <RecommendationBadge rec={report.hiring_recommendation} />
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-300">
                  <Sparkles className="h-4 w-4 text-emerald-300" />
                  Interview complete
                </div>
              </div>
            </div>

            <div className="rounded-[2.25rem] border border-white/10 bg-[linear-gradient(180deg,rgba(10,14,28,0.98),rgba(14,18,34,0.96))] p-5 shadow-[0_40px_120px_-60px_rgba(0,0,0,0.95)]">
              <div className="rounded-[1.5rem] border border-white/10 bg-white/5 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Live report preview</p>
                <p className="mt-1 text-sm font-medium text-white">Candidate context</p>
              </div>

              <div className="mt-4 space-y-4">
                <div className="rounded-[1.5rem] bg-white/5 p-5">
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Interview ID</p>
                  <p className="mt-4 break-all font-mono text-sm text-slate-200">{report.interview_id}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Overall</p>
                    <p className="mt-4 text-4xl font-semibold">{report.overall_score?.toFixed(1)}</p>
                  </div>
                  <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Confidence</p>
                    <p className="mt-4 text-4xl font-semibold">{report.confidence_score?.toFixed(1)}</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {[
                    ["Technical", report.technical_score?.toFixed(1)],
                    ["Communication", report.communication_score?.toFixed(1)],
                    ["Role fit", report.overall_score?.toFixed(1)],
                  ].map(([label, value]) => (
                    <div key={label as string} className="rounded-[1.35rem] border border-white/10 bg-white/5 p-4">
                      <p className="text-xs text-slate-400">{label as string}</p>
                      <p className="mt-3 text-2xl font-semibold">{value as string}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className="mt-6 grid gap-4 lg:grid-cols-4">
            <ScoreCard score={report.overall_score} label="Overall score" icon={BarChart3} />
            <ScoreCard score={report.technical_score} label="Technical depth" icon={Sparkles} />
            <ScoreCard score={report.communication_score} label="Communication" icon={BookOpenCheck} />
            <ScoreCard score={report.confidence_score} label="Confidence" icon={Award} />
          </section>

          <section className="mt-6 grid gap-4 lg:grid-cols-2">
            <div className="rounded-[1.75rem] border border-emerald-400/15 bg-emerald-400/10 p-7 shadow-[0_30px_100px_-70px_rgba(16,185,129,0.6)]">
              <div className="flex items-center gap-2 text-emerald-300">
                <ShieldCheck className="h-5 w-5" />
                <h2 className="text-lg font-semibold">Strengths</h2>
              </div>
              <ul className="mt-5 space-y-3">
                {report.strengths?.map((item: string, index: number) => (
                  <li key={index} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm leading-7 text-slate-200">
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-[1.75rem] border border-amber-400/15 bg-amber-400/10 p-7 shadow-[0_30px_100px_-70px_rgba(245,158,11,0.5)]">
              <div className="flex items-center gap-2 text-amber-300">
                <Lightbulb className="h-5 w-5" />
                <h2 className="text-lg font-semibold">Areas to improve</h2>
              </div>
              <ul className="mt-5 space-y-3">
                {report.weaknesses?.map((item: string, index: number) => (
                  <li key={index} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm leading-7 text-slate-200">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <section className="mt-6 rounded-[1.75rem] border border-white/10 bg-white/5 p-7 shadow-[0_30px_100px_-70px_rgba(0,0,0,0.95)]">
            <div className="flex items-center gap-2 text-slate-200">
              <Sparkles className="h-5 w-5 text-violet-300" />
              <h2 className="text-lg font-semibold">Executive summary</h2>
            </div>
            <p className="mt-5 max-w-4xl text-lg leading-9 text-slate-300">“{report.summary}”</p>
          </section>

          {report.questions?.length > 0 && (
            <section className="mt-6 space-y-4 pb-10">
              <div className="flex items-center gap-2 text-slate-200">
                <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-white/10 text-white">
                  <BarChart3 className="h-4 w-4" />
                </div>
                <h2 className="text-lg font-semibold">Question breakdown</h2>
              </div>

              <div className="space-y-4">
                {report.questions.map((q: any, index: number) => (
                  <article key={index} className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6 shadow-[0_30px_100px_-70px_rgba(0,0,0,0.95)]">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="flex items-start gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-sm font-semibold text-slate-950">
                          {index + 1}
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-white">{q.question}</h3>
                          <span className="mt-2 inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-slate-300">
                            Score: {q.score}/10
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 grid gap-4 lg:grid-cols-2">
                      <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Candidate answer</p>
                        <p className="mt-3 text-sm leading-7 text-slate-200 italic">
                          “{q.candidate_answer || q.answer || "No response recorded"}”
                        </p>
                      </div>
                      {q.best_answer && (
                        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-violet-200">Ideal answer</p>
                          <p className="mt-3 text-sm leading-7 text-slate-200">{q.best_answer}</p>
                        </div>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </main>
  );
}
