"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";

export default function UploadPage() {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== "application/pdf") {
      setError("Please upload a PDF file.");
      return;
    }

    setIsUploading(true);
    setError(null);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(`${apiBase}/api/resume/upload`, {
        method: "POST",
        body: formData,
      });
      
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || "Upload failed");
      }
      
      // Store in session storage for the setup page to pick up
      sessionStorage.setItem("resume_text", data.text);
      router.push("/setup");
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "Error processing resume. Please try again.";
      setError(errMsg);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream text-vast flex items-center justify-center p-6">
      <div className="w-full max-w-xl bg-cream border-2 border-vast rounded-[32px] p-8 md:p-12 text-center relative">
        <h1 className="font-serif text-4xl mb-4">Upload your Resume</h1>
        <p className="text-vast/80 mb-8">We&apos;ll use this to contextualize your mock interview.</p>
        
        <div className="border-2 border-dashed border-vast/50 rounded-2xl p-12 hover:bg-vast/5 transition-colors relative cursor-pointer">
          <input 
            type="file" 
            accept="application/pdf"
            aria-label="Upload Resume PDF"
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            onChange={handleFileUpload}
            disabled={isUploading}
          />
          <div className="flex flex-col items-center justify-center pointer-events-none">
            {isUploading ? (
              <span className="font-semibold text-forest text-lg">Parsing PDF...</span>
            ) : (
              <>
                <svg className="w-12 h-12 mb-4 text-vast/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <span className="font-semibold text-lg">Drag & drop your PDF here</span>
                <span className="text-sm mt-2 text-vast/60">or click to browse</span>
              </>
            )}
          </div>
        </div>
        {error && <p className="text-red-600 mt-4 font-medium">{error}</p>}
      </div>
    </div>
  );
}
