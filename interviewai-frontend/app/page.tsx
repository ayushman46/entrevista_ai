
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
            <p className="brand-tag">Production-grade AI interviews</p>
          </div>
        </div>
        <a className="button button-secondary" href="/setup">Start interview</a>
      </header>

      <main className="page-main">
        <section className="hero hero-simple section">
          <div className="hero-copy reveal">
            <span className="eyebrow">AI interview platform</span>
            <h1>Interview for the role you want, using the resume you already have.</h1>
            <p className="hero-text">
              Upload your resume, enter your name, choose the role, and start a focused interview built to match the job description.
            </p>
            <div className="hero-actions">
              <a className="button button-primary" href="/setup">Start interview</a>
              <a className="button button-ghost" href="#how-it-works">How it works</a>
            </div>
          </div>

          <div className="hero-card reveal">
            <div className="simple-panel">
              <p className="simple-panel-label">Today’s session</p>
              <h2>Product Designer</h2>
              <p>Resume-driven interview flow with role-specific prompts and follow-up questions.</p>
              <div className="simple-stats">
                <span>8 min setup</span>
                <span>Adaptive questions</span>
                <span>Instant feedback</span>
              </div>
            </div>
          </div>
        </section>

        <section className="section compact-grid" id="how-it-works">
          <article className="mini-card reveal">
            <span>01</span>
            <h2>Add your details</h2>
            <p>Enter your name and the role you want to interview for.</p>
          </article>
          <article className="mini-card reveal">
            <span>02</span>
            <h2>Upload your resume</h2>
            <p>Bring in your current resume so the interview can stay relevant.</p>
          </article>
          <article className="mini-card reveal">
            <span>03</span>
            <h2>Start interviewing</h2>
            <p>Go straight into the interview UI and begin your interview right away.</p>
          </article>
        </section>
      </main>
    </div>
    </>
  );
}
