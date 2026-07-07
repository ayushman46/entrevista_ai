"use client";
import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

interface ReportData {
  score: number;
  strengths: string[];
  improvements: string[];
}

export default function ReportPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.id as string;
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        const res = await fetch(`${apiBase}/api/report/${sessionId}`);
        const data = await res.json();
        setReport(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    
    fetchReport();
  }, [sessionId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center text-vast font-serif text-3xl">
        Generating Report...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream text-vast p-6 md:p-12">
      <div className="max-w-6xl mx-auto">
        
        <button onClick={() => router.push('/')} className="mb-12 font-bold flex items-center gap-2 hover:underline">
          &larr; Back home
        </button>
        
        <h1 className="font-serif text-5xl md:text-6xl mb-16 text-center">
          Interview Complete. <br/>
          <span className="text-forest">Your Score: {report?.score}/100</span>
        </h1>

        <div className="grid md:grid-cols-2 gap-8 items-start">
          
          {/* Areas to improve */}
          <div className="bg-cream border-2 border-vast rounded-[32px] p-8 md:p-12 h-full">
            <h2 className="font-serif text-3xl mb-8 flex items-center gap-3">
              <div className="w-4 h-4 bg-red-500 rounded-full border-2 border-vast"></div>
              Areas to Improve
            </h2>
            <ul className="space-y-6">
              {report?.improvements?.map((imp, i) => (
                <li key={i} className="text-lg font-medium leading-relaxed pb-6 border-b-2 border-vast/10 last:border-0 last:pb-0">
                  {imp}
                </li>
              ))}
              {(!report?.improvements || report.improvements.length === 0) && (
                <li className="text-lg font-medium opacity-70">None noted. Great job!</li>
              )}
            </ul>
          </div>
          
          {/* Strengths */}
          <div className="bg-vast text-cream border-2 border-vast rounded-[40px] p-8 md:p-12 h-full">
             <h2 className="font-serif text-3xl mb-8 flex items-center gap-3">
              <div className="w-4 h-4 bg-green-400 rounded-full border-2 border-vast"></div>
              Strengths
            </h2>
            <ul className="space-y-6">
              {report?.strengths?.map((str, i) => (
                <li key={i} className="text-lg font-medium leading-relaxed pb-6 border-b-2 border-cream/20 last:border-0 last:pb-0">
                  {str}
                </li>
              ))}
              {(!report?.strengths || report.strengths.length === 0) && (
                <li className="text-lg font-medium opacity-70">No specific strengths noted.</li>
              )}
            </ul>
          </div>

        </div>
      </div>
    </div>
  );
}
