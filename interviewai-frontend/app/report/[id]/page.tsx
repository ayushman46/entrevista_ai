"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Award,
  BarChart3,
  Download,
  Lightbulb,
  RefreshCcw,
  ShieldCheck,
  Sparkles,
  TriangleAlert,
  Bot
} from "lucide-react";
import { useInterviewStore } from "@/store/interviewStore";
import { api } from "@/services/api";
import { BrandMark } from "@/components/brand-mark";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

function RecommendationBadge({ rec }: { rec: string }) {
  const normalized = (rec || "").toLowerCase();
  if (normalized.includes("strong")) {
    return <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-400"><ShieldCheck className="h-4 w-4" />Strong Hire</span>;
  }
  if (normalized.includes("hire")) {
    return <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-400"><Award className="h-4 w-4" />Hire</span>;
  }
  if (normalized.includes("maybe")) {
    return <span className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-sm font-semibold text-amber-400"><Sparkles className="h-4 w-4" />Maybe</span>;
  }
  return <span className="inline-flex items-center gap-2 rounded-full border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-sm font-semibold text-rose-400"><TriangleAlert className="h-4 w-4" />No Hire</span>;
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
      <div className="flex min-h-screen items-center justify-center bg-black">
        <div className="flex flex-col items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-zinc-900 border border-white/5 shadow-2xl">
            <RefreshCcw className="h-6 w-6 animate-spin text-zinc-400" />
          </div>
          <span className="text-sm font-medium text-zinc-400">Compiling analytics report...</span>
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black p-6">
        <div className="flex w-full max-w-md flex-col items-center gap-4 rounded-3xl border border-white/5 bg-zinc-900/50 p-8 text-center shadow-2xl backdrop-blur-xl">
          <TriangleAlert className="h-10 w-10 text-rose-500" />
          <h2 className="text-2xl font-bold tracking-tight text-white">Report Unavailable</h2>
          <p className="text-sm leading-relaxed text-zinc-400">{error}</p>
          <div className="mt-4 flex w-full flex-col gap-3">
            <button onClick={() => router.refresh()} className="w-full rounded-xl bg-white px-4 py-3 text-sm font-semibold text-black transition hover:bg-zinc-200">
              Try Again
            </button>
            <Link href="/upload" className="w-full rounded-xl border border-white/10 bg-transparent px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/5">
              Start New Session
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white selection:bg-violet-500/30">
      {/* Topbar */}
      <header className="sticky top-0 z-50 flex h-16 items-center justify-between border-b border-white/5 bg-black/50 px-6 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <BrandMark />
          <div className="h-4 w-px bg-white/10" />
          <span className="text-sm font-medium text-zinc-400">Diagnostic Report</span>
        </div>
        <div className="flex items-center gap-3">
          {report.pdf_url && (
            <a
              href={pdfLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm font-semibold transition hover:bg-white/10"
            >
              <Download className="h-4 w-4" />
              Download PDF
            </a>
          )}
          <Link
            href="/upload"
            className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-1.5 text-sm font-semibold text-black transition hover:bg-zinc-200"
          >
            <ArrowLeft className="h-4 w-4" />
            New Session
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-12 lg:py-20">
        {/* Header Section */}
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-violet-300">
              <BarChart3 className="h-3.5 w-3.5" /> Interview Results
            </div>
            <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
              {report.candidate_name || "Candidate"}
            </h1>
            <p className="mt-2 text-lg text-zinc-400 capitalize">
              Target Role: {(report.role || "").replace(/_/g, " ")}
            </p>
          </div>
          <div className="flex shrink-0">
            <RecommendationBadge rec={report.hiring_recommendation} />
          </div>
        </div>

        {/* Top Stats Grid */}
        <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { label: "Overall Score", value: report.overall_score },
            { label: "Confidence", value: report.confidence_score },
            { label: "Technical Depth", value: report.technical_score },
            { label: "Communication", value: report.communication_score },
          ].map((stat, idx) => (
            <div key={idx} className="flex flex-col justify-between rounded-2xl border border-white/5 bg-zinc-900/50 p-6 shadow-lg">
              <span className="text-sm font-medium text-zinc-400">{stat.label}</span>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-3xl font-bold tracking-tight text-white">{stat.value?.toFixed(1) || "-"}</span>
                <span className="text-sm font-medium text-zinc-500">/ 10</span>
              </div>
            </div>
          ))}
        </div>

        {/* Executive Summary */}
        <div className="mt-4 rounded-2xl border border-violet-500/20 bg-gradient-to-br from-violet-500/10 to-transparent p-6 sm:p-8">
          <div className="flex items-center gap-3 text-violet-300 mb-4">
            <Sparkles className="h-5 w-5" />
            <h2 className="text-lg font-semibold">Executive Summary</h2>
          </div>
          <p className="text-base leading-relaxed text-zinc-300">
            {report.summary || "No summary provided."}
          </p>
        </div>

        {/* Strengths and Weaknesses Grid */}
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-6 sm:p-8">
            <div className="flex items-center gap-3 text-emerald-400 mb-6">
              <ShieldCheck className="h-5 w-5" />
              <h2 className="text-lg font-semibold">Key Strengths</h2>
            </div>
            <ul className="space-y-4">
              {report.strengths?.map((item: string, i: number) => (
                <li key={i} className="flex items-start gap-3 text-sm leading-relaxed text-zinc-300">
                  <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                  {item}
                </li>
              ))}
              {(!report.strengths || report.strengths.length === 0) && (
                <li className="text-sm text-zinc-500 italic">No specific strengths recorded.</li>
              )}
            </ul>
          </div>

          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-6 sm:p-8">
            <div className="flex items-center gap-3 text-amber-400 mb-6">
              <Lightbulb className="h-5 w-5" />
              <h2 className="text-lg font-semibold">Areas for Improvement</h2>
            </div>
            <ul className="space-y-4">
              {report.weaknesses?.map((item: string, i: number) => (
                <li key={i} className="flex items-start gap-3 text-sm leading-relaxed text-zinc-300">
                  <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                  {item}
                </li>
              ))}
              {(!report.weaknesses || report.weaknesses.length === 0) && (
                <li className="text-sm text-zinc-500 italic">No specific areas for improvement recorded.</li>
              )}
            </ul>
          </div>
        </div>

        {/* Detailed Breakdown */}
        {report.questions?.length > 0 && (
          <div className="mt-16">
            <h2 className="text-2xl font-bold tracking-tight text-white mb-8">Detailed Q&A Breakdown</h2>
            <div className="space-y-6">
              {report.questions.map((q: any, index: number) => (
                <div key={index} className="rounded-3xl border border-white/5 bg-zinc-900/40 p-6 sm:p-8 transition-colors hover:bg-zinc-900/60">
                  
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
                    <h3 className="text-lg font-medium leading-relaxed text-white">
                      <span className="text-zinc-500 mr-2">{index + 1}.</span>
                      {q.question}
                    </h3>
                    <div className="inline-flex h-fit shrink-0 items-center justify-center rounded-full border border-white/10 bg-black px-3 py-1 text-sm font-semibold text-white shadow-sm">
                      Score: {q.score}/10
                    </div>
                  </div>

                  <div className="space-y-4">
                    {/* Candidate Answer */}
                    <div className="rounded-2xl bg-zinc-950 p-5 border border-white/5">
                      <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                        <div className="h-2 w-2 rounded-full bg-zinc-600" />
                        Candidate Response
                      </div>
                      <p className="text-sm leading-relaxed text-zinc-300 italic">
                        "{q.candidate_answer || q.answer || "No response recorded"}"
                      </p>
                    </div>

                    {/* Ideal Answer */}
                    {q.best_answer && (
                      <div className="rounded-2xl bg-violet-500/5 p-5 border border-violet-500/10">
                        <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-violet-400">
                          <Bot className="h-3.5 w-3.5" />
                          Ideal Answer
                        </div>
                        <p className="text-sm leading-relaxed text-zinc-300">
                          {q.best_answer}
                        </p>
                      </div>
                    )}
                  </div>

                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
