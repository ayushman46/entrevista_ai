"use client";
import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/services/api";
import { useInterviewStore } from "@/store/interviewStore";
import type { RoleType } from "@/types/interview";
import Link from "next/link";

const ROLES: { value: RoleType; label: string; icon: string }[] = [
  { value: "sde_intern",          label: "SDE Intern",           icon: "💻" },
  { value: "frontend_developer",  label: "Frontend Developer",   icon: "🎨" },
  { value: "backend_developer",   label: "Backend Developer",    icon: "⚙️" },
  { value: "fullstack_developer", label: "Full Stack Developer", icon: "🔧" },
  { value: "data_analyst",        label: "Data Analyst",         icon: "📊" },
];

function UploadIcon() {
  return (
    <svg className="w-8 h-8 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg className="w-5 h-5 text-indigo-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

/* shared nav */
function Nav() {
  return (
    <header className="border-b border-slate-200/60 bg-white/70 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center">
            <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/>
            </svg>
          </div>
          <span className="font-bold text-slate-800 text-base tracking-tight">InterviewAI</span>
        </div>
        <Link href="/" className="text-sm text-slate-500 hover:text-slate-700 transition-colors">
          ← Home
        </Link>
      </div>
    </header>
  );
}

export default function UploadPage() {
  const router = useRouter();
  const { setResume, setRole, role, resumeId, startInterview } = useInterviewStore();
  const [file, setFile]                   = useState<File | null>(null);
  const [candidateName, setCandidateName] = useState("");
  const [step, setStep]                   = useState<"upload" | "config" | "starting">("upload");
  const [error, setError]                 = useState<string | null>(null);
  const [uploading, setUploading]         = useState(false);
  const [dragOver, setDragOver]           = useState(false);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f && (f.name.endsWith(".pdf") || f.name.endsWith(".docx"))) setFile(f);
    else setError("Please upload a PDF or DOCX file.");
  }, []);

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true); setError(null);
    try {
      const res = await api.uploadResume(file);
      setResume(res.resume_id, res.resume_data, res.interview_topics);
      setStep("config");
    } catch (e: any) {
      setError(e.message || "Upload failed. Please try again.");
    } finally { setUploading(false); }
  };

  const handleStart = async () => {
    if (!resumeId) return;
    setStep("starting"); setError(null);
    try {
      const res = await api.startInterview(resumeId, role, candidateName);
      startInterview(res.interview_id, res.first_question, res.topic, res.total_planned_questions, res.audio_url);
      router.push(`/interview/${res.interview_id}`);
    } catch (e: any) {
      setError(e.message || "Failed to start interview.");
      setStep("config");
    }
  };

  /* ── UPLOAD STEP ── */
  if (step === "upload") return (
    <>
      <Nav />
      <main className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-slate-800 mb-2">Upload Your Resume</h1>
            <p className="text-slate-500 text-sm">We'll use it to personalise your interview questions.</p>
          </div>

          {/* Drop zone */}
          <div
            className={`rounded-2xl border-2 border-dashed p-10 flex flex-col items-center gap-4 cursor-pointer transition-all ${
              dragOver
                ? "border-indigo-400 bg-indigo-50/60"
                : file
                  ? "border-indigo-300 bg-indigo-50/40"
                  : "border-slate-200 bg-white hover:border-indigo-300 hover:bg-indigo-50/20"
            }`}
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => document.getElementById("fi")?.click()}
          >
            <input id="fi" type="file" accept=".pdf,.docx,.doc" className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) { setFile(f); setError(null); } }} />
            {file ? (
              <>
                <div className="w-14 h-14 rounded-full bg-indigo-100 flex items-center justify-center">
                  <svg className="w-7 h-7 text-indigo-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                    <line x1="16" y1="13" x2="8" y2="13"/>
                    <line x1="16" y1="17" x2="8" y2="17"/>
                    <polyline points="10 9 9 9 8 9"/>
                  </svg>
                </div>
                <div className="text-center">
                  <p className="font-semibold text-slate-800">{file.name}</p>
                  <p className="text-slate-400 text-xs mt-0.5">{(file.size / 1024).toFixed(0)} KB · Click to change</p>
                </div>
              </>
            ) : (
              <>
                <UploadIcon />
                <div className="text-center">
                  <p className="font-semibold text-slate-700">Drop your resume here</p>
                  <p className="text-slate-400 text-sm mt-0.5">or click to browse · PDF or DOCX</p>
                </div>
              </>
            )}
          </div>

          {error && (
            <div className="mt-3 flex items-center gap-2 text-red-600 text-sm bg-red-50 rounded-xl px-4 py-3 border border-red-100">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <button
            onClick={handleUpload}
            disabled={!file || uploading}
            className="mt-5 w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-full transition-all shadow-md disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {uploading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25"/><path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="opacity-75"/></svg>
                Analysing Resume…
              </span>
            ) : "Continue →"}
          </button>

          <p className="text-center text-slate-400 text-xs mt-4">
            No account required · Data used only for this session
          </p>
        </div>
      </main>
    </>
  );

  /* ── CONFIG STEP ── */
  if (step === "config") return (
    <>
      <Nav />
      <main className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <button onClick={() => setStep("upload")} className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1 mb-6 transition-colors">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
              Back
            </button>
            <h1 className="text-3xl font-bold text-slate-800 mb-2">Set Up Your Interview</h1>
            <p className="text-slate-500 text-sm">Tell us a bit about yourself and the role you're practising for.</p>
          </div>

          <div className="space-y-6">
            {/* Name */}
            <div>
              <label className="text-sm font-semibold text-slate-700 block mb-2">Your Name <span className="text-slate-400 font-normal">(optional)</span></label>
              <input
                type="text"
                placeholder="e.g. Ayush Sharma"
                value={candidateName}
                onChange={e => setCandidateName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-transparent transition-all text-sm"
              />
            </div>

            {/* Role selector */}
            <div>
              <label className="text-sm font-semibold text-slate-700 block mb-2">Target Role</label>
              <div className="space-y-2">
                {ROLES.map(r => (
                  <button
                    key={r.value}
                    onClick={() => setRole(r.value)}
                    className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl text-sm font-medium border transition-all ${
                      role === r.value
                        ? "bg-indigo-50 border-indigo-300 text-indigo-700"
                        : "bg-white border-slate-200 text-slate-600 hover:border-indigo-200 hover:bg-indigo-50/40"
                    }`}
                  >
                    <span className="flex items-center gap-2.5">
                      <span>{r.icon}</span>
                      <span>{r.label}</span>
                    </span>
                    {role === r.value && <CheckIcon />}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {error && (
            <div className="mt-4 flex items-center gap-2 text-red-600 text-sm bg-red-50 rounded-xl px-4 py-3 border border-red-100">
              <span>⚠️</span><span>{error}</span>
            </div>
          )}

          <button
            onClick={handleStart}
            className="mt-6 w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-full transition-all shadow-md"
          >
            Begin Interview →
          </button>
        </div>
      </main>
    </>
  );

  /* ── STARTING STEP ── */
  return (
    <>
      <Nav />
      <main className="min-h-[calc(100vh-64px)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-400 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-600 font-medium">Preparing your interview…</p>
          <p className="text-slate-400 text-sm">Generating personalised questions from your resume</p>
        </div>
      </main>
    </>
  );
}
