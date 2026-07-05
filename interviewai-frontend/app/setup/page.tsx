"use client";
import Link from "next/link";
import { useEffect, useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { setupClientLogic } from "@/lib/clientLogic";
import { useInterviewStore } from "@/store/interviewStore";
import type { RoleType } from "@/types/interview";

export default function Page() {
  const router = useRouter();
  const { setRole, setCandidateName, role, candidateName } = useInterviewStore();
  const [localName, setLocalName] = useState(candidateName || "");
  const [localRole, setLocalRole] = useState(role || "sde_intern");

  useEffect(() => {
    setupClientLogic();
  }, []);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setCandidateName(localName || "Alex Morgan");
    setRole(localRole as RoleType);
    router.push("/resume");
  };

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
            <p className="brand-tag">Interview setup</p>
          </div>
        </div>
        <Link className="button button-secondary" href="/">Back home</Link>
      </header>

      <main className="page-main">
        <section className="section form-layout">
          <div className="form-copy reveal">
            <span className="eyebrow">Step 1 of 2</span>
            <h1>Tell us the role you are interviewing for.</h1>
            <p className="hero-text">
              This keeps the interview focused on your background, the role you want, and the expectations of the job description.
            </p>
          </div>

          <form className="form-card reveal" onSubmit={handleSubmit}>
            <label>
              <span>Your name</span>
              <input 
                id="candidate-name" 
                type="text" 
                placeholder="Enter your full name" 
                value={localName}
                onChange={(e) => setLocalName(e.target.value)}
              />
            </label>
            <label>
              <span>Target role</span>
              <select 
                id="candidate-role"
                value={localRole}
                onChange={(e) => setLocalRole(e.target.value as any)}
              >
                <option value="sde_intern">Software Engineer Intern</option>
                <option value="frontend_developer">Frontend Developer</option>
                <option value="backend_developer">Backend Developer</option>
                <option value="fullstack_developer">Full Stack Developer</option>
                <option value="data_analyst">Data Analyst</option>
              </select>
            </label>
            <label>
              <span>Experience level</span>
              <select id="candidate-level" defaultValue="Mid level">
                <option>Entry level</option>
                <option>Mid level</option>
                <option>Senior level</option>
              </select>
            </label>
            <label>
              <span>Job focus</span>
              <textarea id="candidate-focus" rows={4} placeholder="Paste the job description or key requirements here"></textarea>
            </label>
            <div className="form-actions">
              <button className="button button-primary" type="submit">Continue to resume upload</button>
            </div>
          </form>
        </section>
      </main>
    </div>
    </>
  );
}
