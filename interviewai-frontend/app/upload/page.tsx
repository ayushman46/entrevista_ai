"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  BriefcaseBusiness,
  FileUp,
  LoaderCircle,
  MicVocal,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { api } from "@/services/api";
import { useInterviewStore } from "@/store/interviewStore";
import type { RoleType } from "@/types/interview";
import { BrandMark } from "@/components/brand-mark";

const ROLES: { value: RoleType; label: string; desc: string }[] = [
  { value: "sde_intern", label: "Software Engineer Intern", desc: "Algorithms, CS fundamentals, and reasoning" },
  { value: "frontend_developer", label: "Frontend Developer", desc: "React, UI systems, and web performance" },
  { value: "backend_developer", label: "Backend Developer", desc: "APIs, databases, and architecture" },
  { value: "fullstack_developer", label: "Full Stack Developer", desc: "End-to-end product ownership" },
  { value: "data_analyst", label: "Data Analyst", desc: "SQL, data storytelling, and insight quality" },
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

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDrag(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped && (dropped.name.endsWith(".pdf") || dropped.name.endsWith(".docx") || dropped.name.endsWith(".doc"))) {
      setFile(dropped);
      setError(null);
    } else {
      setError("Please upload a PDF or DOCX file.");
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

  const handleStart = async () => {
    if (!resumeId) return;
    setStep("starting");
    setError(null);
    try {
      const res = await api.startInterview(resumeId, role, candidateName || "Candidate");
      startInterview(res.interview_id, res.first_question, res.topic, res.total_planned_questions, res.audio_url);
      router.push(`/interview/${res.interview_id}`);
    } catch (e: any) {
      setError(e.message || "Failed to start interview.");
      setStep("config");
    }
  };

  return (
    <main className="min-h-screen bg-black text-white selection:bg-violet-500/30">
      <div className="mx-auto flex min-h-screen w-full max-w-[1400px] flex-col p-6">
        
        {/* Navigation Bar */}
        <header className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-3">
            <BrandMark />
            <span className="text-lg font-semibold tracking-tight text-white">VitaHire</span>
          </div>
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-zinc-400 transition hover:text-white">
            <ArrowLeft className="h-4 w-4" />
            Exit setup
          </Link>
        </header>

        <div className="mt-12 flex flex-1 flex-col lg:flex-row gap-12 lg:gap-24 items-start">
          
          {/* Left Panel Context */}
          <aside className="hidden lg:flex w-[400px] flex-col gap-8 shrink-0 sticky top-24">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1.5 text-xs font-semibold text-violet-300">
              <MicVocal className="h-3.5 w-3.5" />
              Interview Configuration
            </div>

            <div>
              <h1 className="text-4xl font-bold tracking-tight text-white leading-[1.1]">
                Tailor the interview <br/> to the candidate.
              </h1>
              <p className="mt-4 text-base leading-relaxed text-zinc-400">
                Provide a resume and the desired role. Our AI agent parses the background to build a completely unique, highly relevant interview flow.
              </p>
            </div>

            <div className="mt-4 flex flex-col gap-4">
              {[
                "Resume context sets the technical bar",
                "Role selection guides the grading rubric",
                "Personalized intro for a human touch",
              ].map((item, idx) => (
                <div key={idx} className="flex items-center gap-3 text-zinc-300">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
                    <ShieldCheck className="h-3.5 w-3.5" />
                  </div>
                  <span className="text-sm font-medium">{item}</span>
                </div>
              ))}
            </div>
          </aside>

          {/* Right Panel Main Form */}
          <section className="flex-1 w-full max-w-[600px] lg:mt-6">
            
            {/* Step Indicator */}
            <div className="mb-10 flex items-center gap-2">
              {["Resume", "Profile", "Launch"].map((label, index) => {
                const active =
                  (step === "upload" && index === 0) ||
                  (step === "config" && index === 1) ||
                  (step === "starting" && index === 2);
                const past = 
                  (step === "config" && index < 1) || 
                  (step === "starting" && index < 2);
                
                return (
                  <div key={label} className="flex items-center gap-2">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold transition-all duration-300 ${
                        active ? "bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.3)]" : 
                        past ? "bg-zinc-800 text-white" : "bg-zinc-900 text-zinc-600 border border-zinc-800"
                      }`}
                    >
                      {index + 1}
                    </div>
                    <span className={`text-sm font-medium ${active ? "text-white" : "text-zinc-500"}`}>
                      {label}
                    </span>
                    {index < 2 && <div className="h-px w-8 sm:w-16 mx-2 bg-zinc-800" />}
                  </div>
                );
              })}
            </div>

            {/* Form Content */}
            <div className="glass-card rounded-[24px] p-8 sm:p-10 shadow-2xl">
              
              {step === "upload" && (
                <div className="animate-fade-in flex flex-col gap-6">
                  <div>
                    <h2 className="text-2xl font-bold tracking-tight text-white">Upload resume</h2>
                    <p className="mt-1.5 text-sm text-zinc-400">PDF, DOCX, or DOC formats supported.</p>
                  </div>

                  <div
                    className={`group relative flex cursor-pointer flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed p-10 text-center transition-all duration-300 ${
                      drag
                        ? "border-violet-500 bg-violet-500/5"
                        : file
                          ? "border-emerald-500/50 bg-emerald-500/5"
                          : "border-zinc-800 bg-zinc-900/50 hover:border-zinc-600 hover:bg-zinc-800/50"
                    }`}
                    onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
                    onDragLeave={() => setDrag(false)}
                    onDrop={handleDrop}
                    onClick={() => document.getElementById("file-input")?.click()}
                  >
                    <input
                      id="file-input"
                      type="file"
                      accept=".pdf,.docx,.doc"
                      className="hidden"
                      onChange={(e) => {
                        const selected = e.target.files?.[0];
                        if (selected) {
                          setFile(selected);
                          setError(null);
                        }
                      }}
                    />
                    
                    <div className={`flex h-16 w-16 items-center justify-center rounded-2xl transition-colors ${file ? 'bg-emerald-500/20 text-emerald-400' : 'bg-zinc-800 text-zinc-400 group-hover:bg-zinc-700 group-hover:text-white'}`}>
                      <FileUp className="h-7 w-7" />
                    </div>

                    <div>
                      <p className={`text-base font-medium ${file ? 'text-emerald-400' : 'text-white'}`}>
                        {file ? file.name : "Click or drag file to upload"}
                      </p>
                      {file && (
                        <p className="mt-1 text-xs font-medium text-zinc-500 uppercase tracking-widest">
                          {(file.size / 1024).toFixed(0)} KB
                        </p>
                      )}
                    </div>
                  </div>

                  {error && (
                    <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm font-medium text-rose-400">
                      {error}
                    </div>
                  )}

                  <button
                    onClick={handleUpload}
                    disabled={!file || uploading}
                    className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-white text-sm font-semibold text-black transition-all hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {uploading ? (
                      <LoaderCircle className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        Continue to profile
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </button>
                </div>
              )}

              {step === "config" && (
                <div className="animate-fade-in flex flex-col gap-8">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold tracking-tight text-white">Candidate Details</h2>
                      <p className="mt-1.5 text-sm text-zinc-400">Who is taking the interview?</p>
                    </div>
                    <button onClick={() => setStep("upload")} className="text-zinc-400 hover:text-white transition-colors p-2 -mr-2">
                      <ArrowLeft className="h-5 w-5" />
                    </button>
                  </div>

                  <div className="flex flex-col gap-6">
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-sm font-medium text-zinc-300">
                        <UserRound className="h-4 w-4 text-zinc-500" />
                        Full Name
                      </label>
                      <input
                        type="text"
                        value={candidateName}
                        onChange={(e) => setCandidateName(e.target.value)}
                        placeholder="e.g. Alex Morgan"
                        className="h-12 w-full rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 text-sm text-white placeholder-zinc-500 outline-none transition-all focus:border-violet-500 focus:bg-zinc-900"
                      />
                    </div>

                    <div className="space-y-3">
                      <label className="flex items-center gap-2 text-sm font-medium text-zinc-300">
                        <BriefcaseBusiness className="h-4 w-4 text-zinc-500" />
                        Target Role
                      </label>
                      <div className="grid gap-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                        {ROLES.map((item) => {
                          const selected = role === item.value;
                          return (
                            <button
                              key={item.value}
                              onClick={() => setRole(item.value)}
                              className={`flex items-start gap-4 rounded-xl border p-4 text-left transition-all ${
                                selected
                                  ? "border-violet-500 bg-violet-500/10 shadow-[0_0_20px_rgba(139,92,246,0.15)]"
                                  : "border-zinc-800 bg-zinc-900/30 hover:border-zinc-700 hover:bg-zinc-900"
                              }`}
                            >
                              <div className={`mt-1 h-4 w-4 shrink-0 rounded-full border-2 flex items-center justify-center ${selected ? "border-violet-400" : "border-zinc-600"}`}>
                                {selected && <div className="h-2 w-2 rounded-full bg-violet-400" />}
                              </div>
                              <div>
                                <p className={`text-sm font-semibold ${selected ? "text-violet-300" : "text-zinc-200"}`}>{item.label}</p>
                                <p className="mt-0.5 text-xs text-zinc-500">{item.desc}</p>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {error && (
                    <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm font-medium text-rose-400">
                      {error}
                    </div>
                  )}

                  <button
                    onClick={handleStart}
                    className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-violet-600 text-sm font-semibold text-white transition-all hover:bg-violet-500 hover:shadow-[0_0_30px_rgba(139,92,246,0.4)]"
                  >
                    Launch Interview Environment
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              )}

              {step === "starting" && (
                <div className="animate-fade-in flex flex-col items-center justify-center py-16 text-center">
                  <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-zinc-900 shadow-xl">
                    <div className="absolute inset-0 rounded-full border border-violet-500/30 animate-ping" />
                    <LoaderCircle className="h-8 w-8 animate-spin text-violet-400" />
                  </div>
                  <h2 className="mt-8 text-xl font-semibold text-white">Initializing Session</h2>
                  <p className="mt-2 text-sm text-zinc-400">Compiling resume context and connecting to voice engine...</p>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
      
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: #3f3f46;
          border-radius: 10px;
        }
      `}</style>
    </main>
  );
}
