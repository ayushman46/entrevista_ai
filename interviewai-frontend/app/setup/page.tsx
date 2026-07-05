
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
            <p className="brand-tag">Practice setup</p>
          </div>
        </div>
        <a className="button button-secondary" href="/">Back home</a>
      </header>

      <main className="page-main">
        <section className="section form-layout">
          <div className="form-copy reveal">
            <span className="eyebrow">Step 1 of 2</span>
            <h1>Tell us who you are practicing for.</h1>
            <p className="hero-text">
              This keeps the interview focused on your background, the role you want, and the expectations of the job description.
            </p>
          </div>

          <form className="form-card reveal" data-save="candidate">
            <label>
              <span>Your name</span>
              <input id="candidate-name" type="text" placeholder="Enter your full name" />
            </label>
            <label>
              <span>Target role</span>
              <input id="candidate-role" type="text" placeholder="For example: Frontend Engineer" />
            </label>
            <label>
              <span>Experience level</span>
              <select id="candidate-level">
                <option>Entry level</option>
                <option selected>Mid level</option>
                <option>Senior level</option>
              </select>
            </label>
            <label>
              <span>Job focus</span>
              <textarea id="candidate-focus" rows={4} placeholder="Paste the job description or key requirements here"></textarea>
            </label>
            <div className="form-actions">
              <button className="button button-primary" type="submit">Continue to resume upload</button>
              <a className="button button-ghost" href="/interview">Skip to interview</a>
            </div>
          </form>
        </section>
      </main>
    </div>
    </>
  );
}
