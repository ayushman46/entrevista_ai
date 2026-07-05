"use client";
import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/services/api";
import { useInterviewStore } from "@/store/interviewStore";
import type { RoleType } from "@/types/interview";
import Link from "next/link";

const ROLES: { value: RoleType; label: string; tag: string }[] = [
  { value: "sde_intern",          label: "SDE Intern",           tag: "Entry Level" },
  { value: "frontend_developer",  label: "Frontend Developer",   tag: "Mid Level"   },
  { value: "backend_developer",   label: "Backend Developer",    tag: "Mid Level"   },
  { value: "fullstack_developer", label: "Full Stack Developer", tag: "Mid Level"   },
  { value: "data_analyst",        label: "Data Analyst",         tag: "Analyst"     },
];

const STEPS = ["Resume", "Configure", "Ready"];

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-2 mb-10">
      {STEPS.map((s, i) => (
        <div key={s} className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all"
              style={{
                background: i < current ? "rgba(124,58,237,0.3)" : i === current ? "linear-gradient(135deg,#7C3AED,#6366F1)" : "rgba(255,255,255,0.06)",
                color: i <= current ? "#A78BFA" : "#475569",
                border: i < current ? "1px solid rgba(124,58,237,0.5)" : "none",
              }}
            >
              {i < current ? "✓" : i + 1}
            </div>
            <span
              className="text-xs font-medium"
              style={{ color: i <= current ? "#94A3B8" : "#475569" }}
            >
              {s}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div className="w-8 h-px" style={{ background: i < current ? "rgba(124,58,237,0.5)" : "rgba(255,255,255,0.08)" }} />
          )}
        </div>
      ))}
    </div>
  );
}

export default function UploadPage() {
  const router = useRouter();
  const { setResume, setRole, role, resumeId, startInterview } = useInterviewStore();
  const [file, setFile]               = useState<File | null>(null);
  const [candidateName, setCandidateName] = useState("");
  const [step, setStep]               = useState<"upload" | "config" | "starting">("upload");
  const [error, setError]             = useState<string | null>(null);
  const [uploading, setUploading]     = useState(false);
  const [drag, setDrag]               = useState(false);

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

  const stepIndex = step === "upload" ? 0 : step === "config" ? 1 : 2;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#0C0C14" }}>
      {/* Nav */}
      <nav
        className="border-b px-6 h-14 flex items-center justify-between shrink-0"
        style={{ borderColor: "rgba(255,255,255,0.06)", background: "rgba(12,12,20,0.9)" }}
      >
        <Link href="/" className="flex items-center gap-2">
          <span className="text-base font-bold" style={{ color: "#A78BFA" }}>Entrevista</span>
          <span className="text-xs font-semibold px-1.5 py-0.5 rounded" style={{ background: "rgba(124,58,237,0.2)", color: "#A78BFA", border: "1px solid rgba(124,58,237,0.3)" }}>AI</span>
        </Link>
        <span className="text-xs" style={{ color: "#475569" }}>Step {stepIndex + 1} of 3</span>
      </nav>

      {/* Main */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-lg">

          <StepIndicator current={stepIndex} />

          {/* ── UPLOAD STEP ─────────────────────────── */}
          {step === "upload" && (
            <div className="animate-[fade-up_0.4s_ease-out_forwards]">
              <h1 className="text-2xl font-bold mb-1" style={{ color: "#F1F5F9" }}>Upload your resume</h1>
              <p className="text-sm mb-8" style={{ color: "#94A3B8" }}>
                We'll use it to craft personalised interview questions just for you.
              </p>

              {/* Drop zone */}
              <div
                className="relative rounded-2xl p-10 flex flex-col items-center gap-4 cursor-pointer transition-all duration-200"
                style={{
                  background: drag ? "rgba(124,58,237,0.1)" : file ? "rgba(124,58,237,0.06)" : "rgba(28,28,46,0.6)",
                  border: `2px dashed ${drag ? "rgba(124,58,237,0.7)" : file ? "rgba(124,58,237,0.4)" : "rgba(255,255,255,0.1)"}`,
                }}
                onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
                onDragLeave={() => setDrag(false)}
                onDrop={handleDrop}
                onClick={() => document.getElementById("file-input")?.click()}
              >
                <input
                  id="file-input" type="file" accept=".pdf,.docx,.doc" className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) { setFile(f); setError(null); } }}
                />
                <div
                  className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl"
                  style={{ background: file ? "rgba(124,58,237,0.2)" : "rgba(255,255,255,0.05)" }}
                >
                  {file ? "📄" : "⬆"}
                </div>
                {file ? (
                  <div className="text-center">
                    <p className="font-semibold text-sm" style={{ color: "#F1F5F9" }}>{file.name}</p>
                    <p className="text-xs mt-0.5" style={{ color: "#94A3B8" }}>{(file.size / 1024).toFixed(0)} KB · Click to change</p>
                  </div>
                ) : (
                  <div className="text-center">
                    <p className="font-semibold text-sm" style={{ color: "#F1F5F9" }}>Drop your resume here</p>
                    <p className="text-xs mt-0.5" style={{ color: "#94A3B8" }}>or click to browse · PDF or DOCX</p>
                  </div>
                )}
              </div>

              {error && (
                <div className="mt-3 px-4 py-3 rounded-xl text-sm" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#FCA5A5" }}>
                  {error}
                </div>
              )}

              <button
                onClick={handleUpload}
                disabled={!file || uploading}
                className="mt-5 w-full py-3.5 rounded-full text-sm font-bold transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ background: "linear-gradient(135deg, #7C3AED, #6366F1)", color: "white", boxShadow: file ? "0 4px 20px rgba(124,58,237,0.3)" : "none" }}
              >
                {uploading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Analysing Resume…
                  </span>
                ) : "Continue →"}
              </button>

              <p className="text-center text-xs mt-4" style={{ color: "#475569" }}>
                No account required · Your data is only used for this session
              </p>
            </div>
          )}

          {/* ── CONFIG STEP ─────────────────────────── */}
          {step === "config" && (
            <div className="animate-[fade-up_0.4s_ease-out_forwards]">
              <button
                onClick={() => setStep("upload")}
                className="flex items-center gap-1.5 text-xs mb-6 transition-colors"
                style={{ color: "#94A3B8" }}
                onMouseEnter={e => (e.currentTarget.style.color = "#F1F5F9")}
                onMouseLeave={e => (e.currentTarget.style.color = "#94A3B8")}
              >
                ← Back
              </button>

              <h1 className="text-2xl font-bold mb-1" style={{ color: "#F1F5F9" }}>Configure your interview</h1>
              <p className="text-sm mb-8" style={{ color: "#94A3B8" }}>Tell us your name and the role you're targeting.</p>

              <div className="space-y-6">
                {/* Name */}
                <div>
                  <label className="text-xs font-semibold block mb-2" style={{ color: "#94A3B8" }}>
                    YOUR NAME <span style={{ color: "#475569" }}>(optional)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Ayush Sharma"
                    value={candidateName}
                    onChange={e => setCandidateName(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
                    style={{
                      background: "rgba(28,28,46,0.8)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      color: "#F1F5F9",
                    }}
                    onFocus={e => (e.currentTarget.style.borderColor = "rgba(124,58,237,0.5)")}
                    onBlur={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)")}
                  />
                </div>

                {/* Role */}
                <div>
                  <label className="text-xs font-semibold block mb-3" style={{ color: "#94A3B8" }}>TARGET ROLE</label>
                  <div className="space-y-2">
                    {ROLES.map(r => (
                      <button
                        key={r.value}
                        onClick={() => setRole(r.value)}
                        className="w-full flex items-center justify-between px-4 py-3.5 rounded-xl text-sm transition-all duration-150"
                        style={{
                          background: role === r.value ? "rgba(124,58,237,0.15)" : "rgba(28,28,46,0.6)",
                          border: `1px solid ${role === r.value ? "rgba(124,58,237,0.5)" : "rgba(255,255,255,0.07)"}`,
                          color: role === r.value ? "#A78BFA" : "#94A3B8",
                        }}
                      >
                        <span className="font-medium">{r.label}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs" style={{ color: "#475569" }}>{r.tag}</span>
                          {role === r.value && <span style={{ color: "#A78BFA" }}>✓</span>}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {error && (
                <div className="mt-4 px-4 py-3 rounded-xl text-sm" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#FCA5A5" }}>
                  {error}
                </div>
              )}

              <button
                onClick={handleStart}
                className="mt-6 w-full py-3.5 rounded-full text-sm font-bold transition-all hover:scale-[1.02]"
                style={{ background: "linear-gradient(135deg, #7C3AED, #6366F1)", color: "white", boxShadow: "0 4px 20px rgba(124,58,237,0.3)" }}
              >
                Begin Interview →
              </button>
            </div>
          )}

          {/* ── STARTING ─────────────────────────────── */}
          {step === "starting" && (
            <div className="flex flex-col items-center gap-6 py-12 text-center">
              <div className="relative">
                <div className="w-16 h-16 rounded-full" style={{ background: "rgba(124,58,237,0.1)", border: "1px solid rgba(124,58,237,0.2)" }} />
                <div className="absolute inset-0 w-16 h-16 border-2 border-transparent rounded-full animate-spin" style={{ borderTopColor: "#7C3AED" }} />
              </div>
              <div>
                <p className="font-semibold text-base" style={{ color: "#F1F5F9" }}>Preparing your interview…</p>
                <p className="text-sm mt-1" style={{ color: "#94A3B8" }}>Generating questions from your resume</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
