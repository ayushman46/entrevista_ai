"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { setupClientLogic } from "@/lib/clientLogic";
import { useInterviewStore } from "@/store/interviewStore";
import { api } from "@/services/api";
import { LoaderCircle } from "lucide-react";

export default function Page() {
  const router = useRouter();
  const { setResume, role, candidateName, startInterview } = useInterviewStore();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setupClientLogic();
  }, []);

  const handleStart = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.uploadResume(file);
      setResume(res.resume_id, res.resume_data, res.interview_topics);
      
      const startRes = await api.startInterview(res.resume_id, role, candidateName || "Candidate");
      startInterview(startRes.interview_id, startRes.first_question, startRes.topic, startRes.total_planned_questions, startRes.audio_url);
      router.push(`/interview/${startRes.interview_id}`);
    } catch (e: any) {
      setError(e.message || "Failed to start interview.");
      setLoading(false);
    }
  };

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
            <p className="brand-tag">Resume upload</p>
          </div>
        </div>
        <Link className="button button-secondary" href="/setup">Back</Link>
      </header>

      <main className="page-main">
        <section className="section form-layout">
          <div className="form-copy reveal">
            <span className="eyebrow">Step 2 of 2</span>
            <h1>Upload your resume and begin with confidence.</h1>
            <p className="hero-text">
              The interview uses your resume to guide questions, making the conversation highly relevant to your background.
            </p>
          </div>

          <div className="form-card reveal">
            <div 
              className="upload-box" 
              onClick={() => document.getElementById("resume-file")?.click()}
              style={{ cursor: "pointer" }}
            >
              <p className="upload-title" style={{ wordBreak: 'break-all' }}>{file ? file.name : "Drop resume here or click to upload"}</p>
              <p className="upload-subtitle">PDF, DOC, or DOCX</p>
              <input 
                id="resume-file" 
                type="file" 
                style={{ display: "none" }}
                accept=".pdf,.docx,.doc"
                onChange={(e) => {
                  const selected = e.target.files?.[0];
                  if (selected) {
                    setFile(selected);
                    setError(null);
                  }
                }}
              />
            </div>

            {file && (
              <div className="resume-preview">
                <span>Resume detected</span>
                <strong>Ready for interview</strong>
                <p>Your session will use the uploaded file to shape follow-up questions and scoring.</p>
              </div>
            )}

            {error && (
              <div style={{ color: "red", marginTop: "1rem", fontSize: "14px" }}>
                {error}
              </div>
            )}

            <div className="form-actions" style={{ marginTop: "2rem" }}>
              <button 
                className="button button-primary" 
                type="button" 
                onClick={handleStart}
                disabled={!file || loading}
                style={{ display: 'flex', gap: '8px', alignItems: 'center', opacity: (!file || loading) ? 0.7 : 1 }}
              >
                {loading && <LoaderCircle className="h-4 w-4 animate-spin" />}
                {loading ? "Starting..." : "Start interview"}
              </button>
              <Link className="button button-ghost" href="/setup">Edit details</Link>
            </div>
          </div>
        </section>
      </main>
    </div>
    </>
  );
}
