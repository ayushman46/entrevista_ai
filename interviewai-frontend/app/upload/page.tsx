"use client";
import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/services/api";
import { useInterviewStore } from "@/store/interviewStore";
import type { RoleType } from "@/types/interview";
import Link from "next/link";

const ROLES: { value: RoleType; label: string; desc: string }[] = [
  { value: "sde_intern",          label: "Software Engineer Intern", desc: "Focus on algorithms & basics" },
  { value: "frontend_developer",  label: "Frontend Developer",       desc: "React, UI/UX, Web Core" },
  { value: "backend_developer",   label: "Backend Developer",        desc: "APIs, Databases, System Design" },
  { value: "fullstack_developer", label: "Full Stack Developer",     desc: "End-to-end architecture" },
  { value: "data_analyst",        label: "Data Analyst",             desc: "SQL, Python, Data Viz" },
];

export default function UploadPage() {
  const router = useRouter();
  const { setResume, setRole, role, resumeId, startInterview } = useInterviewStore();
  const [file, setFile] = useState<File | null>(null);
  const [candidateName, setCandidateName] = useState("");
  const [step, setStep] = useState<"upload" | "config" | "starting">("upload");
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [drag, setDrag] = useState(false);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDrag(false);
    const f = e.dataTransfer.files[0];
    if (f && (f.name.endsWith(".pdf") || f.name.endsWith(".docx") || f.name.endsWith(".doc"))) {
      setFile(f); setError(null);
    } else setError("Please upload a PDF or DOCX file.");
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
      setError(e.message || "Failed to start interview."); setStep("config");
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-slate-900 flex flex-col">
      <nav className="border-b border-slate-100 bg-white px-6 h-16 flex items-center justify-between shrink-0">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-slate-900 flex items-center justify-center">
            <div className="w-2 h-2 bg-white rounded-full" />
          </div>
          <span className="font-semibold text-slate-900">Entrevista</span>
        </Link>
        <div className="flex gap-2">
          {["Resume", "Configure", "Interview"].map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <span className={`text-xs font-medium px-2 py-1 rounded-md ${
                (step === "upload" && i === 0) || (step === "config" && i === 1) || (step === "starting" && i === 2)
                  ? "bg-slate-100 text-slate-900" 
                  : "text-slate-400"
              }`}>
                {s}
              </span>
              {i < 2 && <span className="text-slate-200">/</span>}
            </div>
          ))}
        </div>
      </nav>

      <main className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-xl bg-white p-8 sm:p-12 rounded-[2rem] border border-slate-100 shadow-sm animate-fade-up">
          
          {step === "upload" && (
            <div className="space-y-8">
              <div className="text-center">
                <h1 className="text-2xl font-bold tracking-tight mb-2">Upload your resume</h1>
                <p className="text-slate-500 text-sm">We'll use it to contextually generate your interview questions.</p>
              </div>

              <div
                className={`relative border-2 border-dashed rounded-3xl p-12 text-center transition-all cursor-pointer ${
                  drag ? "border-blue-400 bg-blue-50/50" : file ? "border-slate-300 bg-slate-50" : "border-slate-200 hover:bg-slate-50 hover:border-slate-300"
                }`}
                onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
                onDragLeave={() => setDrag(false)}
                onDrop={handleDrop}
                onClick={() => document.getElementById("file-input")?.click()}
              >
                <input
                  id="file-input" type="file" accept=".pdf,.docx,.doc" className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) { setFile(f); setError(null); } }}
                />
                
                <div className="w-16 h-16 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-center justify-center mx-auto mb-4 text-slate-400">
                  {file ? (
                    <svg className="w-8 h-8 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  ) : (
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                  )}
                </div>
                
                {file ? (
                  <div>
                    <p className="font-semibold text-slate-700 mb-1">{file.name}</p>
                    <p className="text-xs text-slate-400">{(file.size / 1024).toFixed(0)} KB</p>
                  </div>
                ) : (
                  <div>
                    <p className="font-medium text-slate-700 mb-1">Click to upload or drag and drop</p>
                    <p className="text-xs text-slate-400">PDF or DOCX (max 5MB)</p>
                  </div>
                )}
              </div>

              {error && <div className="p-4 rounded-xl bg-red-50 text-red-600 text-sm border border-red-100">{error}</div>}

              <button
                onClick={handleUpload}
                disabled={!file || uploading}
                className="w-full py-4 rounded-full bg-slate-900 text-white font-medium hover:bg-slate-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {uploading ? (
                  <>
                    <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing Resume...
                  </>
                ) : "Continue"}
              </button>
            </div>
          )}

          {step === "config" && (
            <div className="space-y-8">
              <div className="text-center relative">
                <button 
                  onClick={() => setStep("upload")}
                  className="absolute left-0 top-1 text-slate-400 hover:text-slate-900 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                </button>
                <h1 className="text-2xl font-bold tracking-tight mb-2">Configure Session</h1>
                <p className="text-slate-500 text-sm">Set up your target role for the mock interview.</p>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Candidate Name (Optional)</label>
                  <input
                    type="text"
                    value={candidateName}
                    onChange={(e) => setCandidateName(e.target.value)}
                    placeholder="e.g. Jane Doe"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-3">Target Role</label>
                  <div className="grid gap-3">
                    {ROLES.map((r) => (
                      <div
                        key={r.value}
                        onClick={() => setRole(r.value)}
                        className={`p-4 rounded-xl border cursor-pointer transition-all ${
                          role === r.value 
                            ? "border-slate-900 bg-slate-50 ring-1 ring-slate-900" 
                            : "border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className={`font-medium ${role === r.value ? "text-slate-900" : "text-slate-700"}`}>
                              {r.label}
                            </p>
                            <p className="text-xs text-slate-500 mt-1">{r.desc}</p>
                          </div>
                          <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                            role === r.value ? "border-slate-900 bg-slate-900" : "border-slate-300"
                          }`}>
                            {role === r.value && <div className="w-2 h-2 rounded-full bg-white" />}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {error && <div className="p-4 rounded-xl bg-red-50 text-red-600 text-sm border border-red-100">{error}</div>}

              <button
                onClick={handleStart}
                className="w-full py-4 rounded-full bg-slate-900 text-white font-medium hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/10 active:scale-[0.98]"
              >
                Begin Interview
              </button>
            </div>
          )}

          {step === "starting" && (
            <div className="py-12 flex flex-col items-center text-center space-y-6">
              <div className="relative w-20 h-20">
                <div className="absolute inset-0 border-4 border-slate-100 rounded-full" />
                <div className="absolute inset-0 border-4 border-slate-900 rounded-full border-t-transparent animate-spin" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Preparing your environment</h2>
                <p className="text-sm text-slate-500 mt-1">Analyzing resume and generating questions...</p>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
