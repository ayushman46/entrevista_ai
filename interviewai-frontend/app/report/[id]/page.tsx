"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useInterviewStore } from "@/store/interviewStore";
import Link from "next/link";

export default function ReportPage() {
  const params = useParams();
  const { finalReport } = useInterviewStore();
  const [report, setReport] = useState(finalReport);

  useEffect(() => {
    if (finalReport) setReport(finalReport);
  }, [finalReport]);

  if (!report) {
    return (
      <div className="text-center py-20">
        <p className="text-slate-400">Report not found. Please complete an interview first.</p>
        <Link href="/" className="btn-primary mt-4 inline-block">Go Home</Link>
      </div>
    );
  }

  const getScoreColor = (score: number) =>
    score >= 7.5 ? "text-green-600" : score >= 5.5 ? "text-yellow-600" : "text-red-600";

  return (
    <div className="max-w-3xl mx-auto py-8">
      <div className="mb-12">
        <h1 className="text-4xl font-medium tracking-tight text-slate-900 mb-2">Interview Report</h1>
        <p className="text-slate-500 text-lg">{report.candidate_name} · {report.role?.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())}</p>
      </div>

      {/* Hiring Recommendation */}
      <div className="mb-16 border-b border-slate-100 pb-12">
        <h2 className="text-sm font-medium text-slate-500 uppercase tracking-widest mb-4">Recommendation</h2>
        <div className="flex items-end gap-6">
          <div className="text-5xl font-medium tracking-tight text-slate-900">{report.hiring_recommendation}</div>
          <div className="text-4xl pb-1">
            {report.hiring_recommendation === "Strong Hire" ? "🌟" :
             report.hiring_recommendation === "Hire" ? "✅" :
             report.hiring_recommendation === "Maybe" ? "🤔" : "❌"}
          </div>
        </div>
        <p className="text-lg text-slate-600 mt-6 leading-relaxed max-w-2xl">{report.summary}</p>
      </div>

      {/* Scores */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16">
        {[
          { label: "Overall", score: report.overall_score },
          { label: "Technical", score: report.technical_score },
          { label: "Communication", score: report.communication_score },
          { label: "Confidence", score: report.confidence_score },
        ].map(({ label, score }) => (
          <div key={label}>
            <div className={`text-4xl font-medium tracking-tight mb-2 ${getScoreColor(score)}`}>{score?.toFixed(1)}</div>
            <div className="text-slate-500 font-medium">{label}</div>
          </div>
        ))}
      </div>

      {/* Strengths & Weaknesses */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-16">
        <div>
          <h3 className="font-medium text-slate-900 mb-6 flex items-center gap-2">
            <span className="text-green-600 font-bold">✓</span> Strengths
          </h3>
          <ul className="space-y-3">
            {report.strengths?.map((s, i) => (
              <li key={i} className="text-slate-600 leading-relaxed">{s}</li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="font-medium text-slate-900 mb-6 flex items-center gap-2">
            <span className="text-red-600 font-bold">△</span> Areas to Improve
          </h3>
          <ul className="space-y-3">
            {report.weaknesses?.map((w, i) => (
              <li key={i} className="text-slate-600 leading-relaxed">{w}</li>
            ))}
          </ul>
        </div>
      </div>

      {/* Learning Roadmap */}
      <div className="mb-16">
        <h3 className="font-medium text-slate-900 mb-6">Learning Roadmap</h3>
        <ol className="space-y-4">
          {report.learning_roadmap?.map((item, i) => (
            <li key={i} className="text-slate-600 leading-relaxed flex gap-4">
              <span className="text-slate-300 font-medium font-mono pt-1">{i + 1}.</span>
              <span>{item}</span>
            </li>
          ))}
        </ol>
      </div>

      {/* Actions */}
      <div className="flex gap-4 pt-8 border-t border-slate-100">
        {report.pdf_url && (
          <a
            href={`${process.env.NEXT_PUBLIC_API_URL}${report.pdf_url}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary"
          >
            Download PDF Report ↓
          </a>
        )}
        <Link href="/upload" className="btn-secondary">
          New Interview →
        </Link>
      </div>
    </div>
  );
}
