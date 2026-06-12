"use client";
import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/services/api";
import { useInterviewStore } from "@/store/interviewStore";
import type { RoleType } from "@/types/interview";

const ROLES: { value: RoleType; label: string }[] = [
  { value: "sde_intern", label: "SDE Intern" },
  { value: "frontend_developer", label: "Frontend Developer" },
  { value: "backend_developer", label: "Backend Developer" },
  { value: "fullstack_developer", label: "Full Stack Developer" },
  { value: "data_analyst", label: "Data Analyst" },
];

export default function UploadPage() {
  const router = useRouter();
  const { setResume, setRole, role, resumeId, resumeData, startInterview } = useInterviewStore();
  const [file, setFile] = useState<File | null>(null);
  const [candidateName, setCandidateName] = useState("");
  const [step, setStep] = useState<"upload" | "config" | "starting">("upload");
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f && (f.name.endsWith(".pdf") || f.name.endsWith(".docx"))) {
      setFile(f);
    } else {
      setError("Please upload a PDF or DOCX file");
    }
  }, []);

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const res = await api.uploadResume(file);
      setResume(res.resume_id, res.resume_data, res.interview_topics);
      setStep("config");
    } catch (e: any) {
      setError(e.message || "Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleStartInterview = async () => {
    if (!resumeId) return;
    setStep("starting");
    setError(null);
    try {
      const res = await api.startInterview(resumeId, role, candidateName);
      startInterview(res.interview_id, res.first_question, res.topic, res.total_planned_questions);
      router.push(`/interview/${res.interview_id}`);
    } catch (e: any) {
      setError(e.message || "Failed to start interview");
      setStep("config");
    }
  };

  if (step === "upload") {
    return (
      <div className="max-w-xl">
        <h1 className="text-3xl font-medium tracking-tight text-slate-900 mb-3">Resume</h1>
        <p className="text-slate-500 mb-10 text-lg">Let's start by understanding your background.</p>

        <div
          className={`py-12 border-b border-t border-slate-100 text-center cursor-pointer transition-colors ${
            dragOver ? "bg-slate-50" : "hover:bg-slate-50"
          }`}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => document.getElementById("file-input")?.click()}
        >
          <input
            id="file-input"
            type="file"
            accept=".pdf,.docx,.doc"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) setFile(f); }}
          />
          {file ? (
            <>
              <p className="text-slate-900 font-medium">{file.name}</p>
              <p className="text-slate-400 text-sm mt-1">{(file.size / 1024).toFixed(0)} KB</p>
            </>
          ) : (
            <>
              <p className="text-slate-900 font-medium mb-1">Select or drop your resume</p>
              <p className="text-slate-400 text-sm">PDF or DOCX</p>
            </>
          )}
        </div>

        {error && <p className="text-red-500 text-sm mt-6">{error}</p>}

        <div className="mt-10">
          <button
            onClick={handleUpload}
            disabled={!file || uploading}
            className="btn-primary"
          >
            {uploading ? "Analyzing..." : "Continue"}
          </button>
        </div>
      </div>
    );
  }

  if (step === "config") {
    return (
      <div className="max-w-xl">
        <h1 className="text-3xl font-medium tracking-tight text-slate-900 mb-3">Target Role</h1>
        <p className="text-slate-500 mb-10 text-lg">What position are you interviewing for?</p>

        <div className="mb-8">
          <label className="text-sm font-medium text-slate-900 mb-3 block">Full Name (optional)</label>
          <input
            type="text"
            placeholder="Your name"
            value={candidateName}
            onChange={(e) => setCandidateName(e.target.value)}
            className="w-full border-b border-slate-200 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-900 bg-transparent transition-colors"
          />
        </div>

        <div className="mb-10">
          <label className="text-sm font-medium text-slate-900 mb-4 block">Role</label>
          <div className="flex flex-col gap-1">
            {ROLES.map((r) => (
              <button
                key={r.value}
                onClick={() => setRole(r.value)}
                className={`py-3 text-left transition-colors border-b last:border-0 ${
                  role === r.value
                    ? "border-slate-900 font-medium text-slate-900"
                    : "border-slate-100 text-slate-500 hover:text-slate-900"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        {error && <p className="text-red-500 text-sm mb-6">{error}</p>}

        <button onClick={handleStartInterview} className="btn-primary">
          Begin Interview
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-xl py-20">
      <p className="text-slate-900 text-xl font-medium mb-2">Preparing your interview...</p>
      <p className="text-slate-500">Generating contextual questions</p>
    </div>
  );
}
