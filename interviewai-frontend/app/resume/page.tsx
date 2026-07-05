
"use client";
import Link from "next/link";
import { useEffect } from "react";
import { setupClientLogic } from "@/lib/clientLogic";

export default function Page() {
  useEffect(() => {
    setupClientLogic();
  }, []);

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
        <a className="button button-secondary" href="/setup">Back</a>
      </header>

      <main className="page-main">
        <section className="section form-layout">
          <div className="form-copy reveal">
            <span className="eyebrow">Step 2 of 2</span>
            <h1>Upload your resume and begin with confidence.</h1>
            <p className="hero-text">
              The interview uses your resume to guide questions, so the practice feels closer to a real hiring conversation.
            </p>
          </div>

          <div className="form-card reveal" data-save="resume">
            <div className="upload-box">
              <p className="upload-title">Drop resume here</p>
              <p className="upload-subtitle">PDF, DOC, or DOCX</p>
              <input id="resume-file" type="file" />
            </div>

            <div className="resume-preview">
              <span>Resume detected</span>
              <strong>Ready for practice interview</strong>
              <p>Your session will use the uploaded file to shape follow-up questions and scoring.</p>
            </div>

            <div className="form-actions">
              <button className="button button-primary" type="button" data-next-interview>Start interview</button>
              <a className="button button-ghost" href="/setup">Edit details</a>
            </div>
          </div>
        </section>
      </main>
    </div>
    </>
  );
}
