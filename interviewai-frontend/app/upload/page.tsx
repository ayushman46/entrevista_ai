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
      const res = await api.startInterview(resumeId, role, candidateName);
      startInterview(res.interview_id, res.first_question, res.topic, res.total_planned_questions, res.audio_url);
      router.push(`/interview/${res.interview_id}`);
    } catch (e: any) {
      setError(e.message || "Failed to start interview.");
      setStep("config");
    }
  };

  return (
    <main className="min-h-screen text-white">
      <div className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col px-6 py-6 lg:px-8">
        <header className="glass-panel flex items-center justify-between rounded-[2rem] px-5 py-4">
          <BrandMark />
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-slate-300 transition hover:text-white">
            <ArrowLeft className="h-4 w-4" />
            Back home
          </Link>
        </header>

        <div className="mt-8 grid flex-1 gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <aside className="rounded-[2.25rem] border border-white/10 bg-[linear-gradient(180deg,rgba(14,18,34,0.96),rgba(8,10,22,0.98))] p-8 shadow-[0_40px_120px_-60px_rgba(0,0,0,0.9)] lg:p-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-200">
              <MicVocal className="h-4 w-4 text-violet-300" />
              Candidate setup
            </div>

            <h1 className="mt-8 max-w-md text-4xl font-semibold tracking-tight sm:text-5xl">
              Add the candidate context, then launch a tailored interview.
            </h1>

            <p className="mt-5 max-w-lg text-base leading-8 text-slate-300">
              Upload a resume, enter the candidate name, choose the role, and start a clean practice flow built for real interviews.
            </p>

            <div className="mt-10 space-y-4">
              {[
                "Resume is parsed into interview topics",
                "Candidate name personalizes the session",
                "Target role shapes the questions",
              ].map((item) => (
                <div key={item} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  <ShieldCheck className="h-4 w-4 text-emerald-300" />
                  <span className="text-sm text-slate-200">{item}</span>
                </div>
              ))}
            </div>
          </aside>

          <section className="flex items-center justify-center">
            <div className="w-full max-w-2xl rounded-[2.25rem] border border-white/10 bg-[linear-gradient(180deg,rgba(10,14,28,0.96),rgba(14,18,34,0.88))] p-6 shadow-[0_40px_120px_-60px_rgba(0,0,0,0.9)] sm:p-8">
              <div className="flex items-center gap-3">
                {["Resume", "Profile", "Launch"].map((label, index) => {
                  const active =
                    (step === "upload" && index === 0) ||
                    (step === "config" && index === 1) ||
                    (step === "starting" && index === 2);
                  return (
                    <div key={label} className="flex flex-1 items-center gap-3">
                      <div
                        className={[
                          "flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold transition",
                          active ? "bg-white text-slate-950" : "bg-white/10 text-slate-400",
                        ].join(" ")}
                      >
                        {index + 1}
                      </div>
                      <span className={active ? "text-sm font-semibold text-white" : "text-sm text-slate-400"}>
                        {label}
                      </span>
                      {index < 2 ? <span className="hidden h-px flex-1 bg-white/10 sm:block" /> : null}
                    </div>
                  );
                })}
              </div>

              <div className="mt-8">
                {step === "upload" && (
                  <div className="space-y-7">
                    <div>
                      <h2 className="text-3xl font-semibold tracking-tight">Upload your resume</h2>
                      <p className="mt-2 max-w-xl text-sm leading-7 text-slate-400">
                        The file powers the interview topics and keeps the questions relevant to the candidate.
                      </p>
                    </div>

                    <div
                      className={[
                        "rounded-[1.75rem] border-2 border-dashed p-8 text-center transition",
                        drag
                          ? "border-violet-400 bg-white/5"
                          : file
                            ? "border-white/20 bg-white/5"
                            : "border-white/12 bg-white/3 hover:border-white/20 hover:bg-white/5",
                      ].join(" ")}
                      onDragOver={(e) => {
                        e.preventDefault();
                        setDrag(true);
                      }}
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
                      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#8b5cf6,#22c55e)] text-white shadow-lg shadow-violet-500/20">
                        <FileUp className="h-7 w-7" />
                      </div>

                      <div className="mt-5">
                        <p className="text-lg font-semibold text-white">
                          {file ? file.name : "Click to upload or drag and drop"}
                        </p>
                        <p className="mt-2 text-sm text-slate-400">PDF or DOCX files are supported.</p>
                        {file && (
                          <p className="mt-3 text-xs font-medium uppercase tracking-[0.24em] text-slate-500">
                            {(file.size / 1024).toFixed(0)} KB
                          </p>
                        )}
                      </div>
                    </div>

                    {error && (
                      <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                        {error}
                      </div>
                    )}

                    <button
                      onClick={handleUpload}
                      disabled={!file || uploading}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-white px-6 py-4 text-sm font-semibold text-slate-950 transition hover:-translate-y-0.5 hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {uploading ? (
                        <>
                          <LoaderCircle className="h-4 w-4 animate-spin" />
                          Processing resume
                        </>
                      ) : (
                        <>
                          Continue
                          <ArrowRight className="h-4 w-4" />
                        </>
                      )}
                    </button>
                  </div>
                )}

                {step === "config" && (
                  <div className="space-y-7">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h2 className="text-3xl font-semibold tracking-tight">Set up the candidate profile</h2>
                        <p className="mt-2 max-w-xl text-sm leading-7 text-slate-400">
                          Add a name and choose the role the AI should interview for.
                        </p>
                      </div>
                      <button
                        onClick={() => setStep("upload")}
                        className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-300 transition hover:border-white/20 hover:bg-white/10 hover:text-white"
                      >
                        <ArrowLeft className="h-4 w-4" />
                        Back
                      </button>
                    </div>

                    <div className="space-y-6">
                      <div>
                        <label className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-300">
                          <UserRound className="h-4 w-4 text-slate-500" />
                          Candidate name
                        </label>
                        <input
                          type="text"
                          value={candidateName}
                          onChange={(e) => setCandidateName(e.target.value)}
                          placeholder="Jane Doe"
                          className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3.5 text-sm outline-none transition placeholder:text-slate-500 focus:border-violet-400/70 focus:ring-2 focus:ring-violet-400/20"
                        />
                      </div>

                      <div>
                        <label className="mb-3 flex items-center gap-2 text-sm font-medium text-slate-300">
                          <BriefcaseBusiness className="h-4 w-4 text-slate-500" />
                          Target role
                        </label>
                        <div className="grid gap-3">
                          {ROLES.map((item) => {
                            const selected = role === item.value;
                            return (
                              <button
                                key={item.value}
                                type="button"
                                onClick={() => setRole(item.value)}
                                className={[
                                  "w-full rounded-[1.35rem] border p-4 text-left transition",
                                  selected
                                    ? "border-white/25 bg-white/10 shadow-lg shadow-black/20"
                                    : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10",
                                ].join(" ")}
                              >
                                <div className="flex items-start justify-between gap-4">
                                  <div>
                                    <p className="text-base font-semibold text-white">{item.label}</p>
                                    <p className="mt-1 text-sm text-slate-400">{item.desc}</p>
                                  </div>
                                  <div
                                    className={[
                                      "mt-1 h-5 w-5 rounded-full border-2",
                                      selected ? "border-white bg-white" : "border-slate-500",
                                    ].join(" ")}
                                  />
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {error && (
                      <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                        {error}
                      </div>
                    )}

                    <button
                      onClick={handleStart}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[linear-gradient(135deg,#8b5cf6,#7c3aed,#22c55e)] px-6 py-4 text-sm font-semibold text-white transition hover:-translate-y-0.5"
                    >
                      Begin interview
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                )}

                {step === "starting" && (
                  <div className="flex flex-col items-center justify-center gap-5 py-20 text-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full border border-white/10 bg-white/5">
                      <LoaderCircle className="h-6 w-6 animate-spin text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-white">Preparing your interview</h2>
                      <p className="mt-2 text-sm text-slate-400">We’re analyzing the resume and generating the first question.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
