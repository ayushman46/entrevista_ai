
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
            <p className="brand-tag">Live interview</p>
          </div>
        </div>
        <div className="topbar-actions">
          <a className="button button-secondary" href="/resume">Back</a>
          <a className="button button-primary" href="/">Finish session</a>
        </div>
      </header>

      <main className="page-main">
        <section className="section interview-layout">
          <div className="interview-main reveal">
            <div className="session-banner">
              <span>Role: <strong data-role>Product Designer</strong></span>
              <span>Candidate: <strong data-name>Alex Morgan</strong></span>
              <span>Timer: 08:24</span>
            </div>

            <div className="chat-panel">
              <div className="chat-bubble interviewer">
                Tell me about a project where you improved the user experience using feedback from real users.
              </div>
              <div className="chat-bubble candidate">
                I simplified a checkout flow after noticing users hesitated at the shipping step. I reduced the form fields, improved clarity, and raised completion by 18%.
              </div>
              <div className="chat-bubble interviewer">
                Good. What tradeoffs did you make while balancing usability and business goals?
              </div>
            </div>

            <div className="answer-box">
              <textarea rows={4} placeholder="Type your answer here..."></textarea>
              <div className="form-actions">
                <button className="button button-primary" type="button">Submit answer</button>
                <button className="button button-ghost" type="button">Next question</button>
              </div>
            </div>
          </div>

          <aside className="interview-side reveal">
            <div className="side-card">
              <p className="simple-panel-label">Live scoring</p>
              <div className="score-list">
                <div><span>Communication</span><strong>91</strong></div>
                <div><span>Problem solving</span><strong>87</strong></div>
                <div><span>Role fit</span><strong>89</strong></div>
              </div>
            </div>

            <div className="side-card">
              <p className="simple-panel-label">AI note</p>
              <p className="side-copy" data-focus-note>The candidate gives specific examples and strong outcome-based language.</p>
            </div>
          </aside>
        </section>
      </main>
    </div>
    </>
  );
}
