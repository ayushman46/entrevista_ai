"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SetupPage() {
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [resumeText, setResumeText] = useState("");
  const router = useRouter();

  useEffect(() => {
    const text = sessionStorage.getItem("resume_text");
    if (text) {
      setResumeText(text);
    }
  }, []);

  const handleStart = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !role) return;
    setIsLoading(true);

    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
      const res = await fetch(`${apiBase}/api/interview/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, role, resume_text: resumeText }),
      });
      const data = await res.json();
      if (data.session_id) {
        router.push(`/interview/${data.session_id}`);
      }
    } catch (err) {
      console.error(err);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream text-vast flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-cream border-2 border-vast rounded-[32px] p-8 md:p-12 shadow-none">
        <h1 className="font-serif text-4xl mb-2 text-center">Interview Details</h1>
        <p className="text-center text-vast/80 mb-8">Tell us who you are and what role you&apos;re aiming for.</p>
        
        {resumeText && (
          <div className="mb-6 flex justify-center">
            <span className="bg-forest text-cream px-4 py-1.5 rounded-full text-sm font-bold tracking-wide">
              Resume Attached
            </span>
          </div>
        )}

        <form onSubmit={handleStart} className="space-y-6">
          <div>
            <label htmlFor="full-name" className="block font-semibold mb-2">Full Name</label>
            <input 
              id="full-name"
              type="text" 
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-cream border-2 border-vast rounded-xl px-4 py-3 outline-none focus:bg-white transition-colors"
              placeholder="Jane Doe"
            />
          </div>
          <div>
            <label htmlFor="target-role" className="block font-semibold mb-2">Target Role</label>
            <input 
              id="target-role"
              type="text" 
              required
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full bg-cream border-2 border-vast rounded-xl px-4 py-3 outline-none focus:bg-white transition-colors"
              placeholder="Senior Frontend Engineer"
            />
          </div>
          <div className="pt-4 flex gap-4">
            <button 
              type="button" 
              onClick={() => router.back()}
              className="flex-1 border-2 border-vast text-vast font-bold py-3 rounded-xl hover:bg-vast/5 transition-colors"
            >
              Back
            </button>
            <button 
              type="submit" 
              disabled={isLoading}
              className="flex-1 bg-lavender border-2 border-vast text-vast font-bold py-3 rounded-xl hover:-translate-y-0.5 transition-transform disabled:opacity-70 disabled:hover:translate-y-0"
            >
              {isLoading ? "Starting..." : "Continue"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
