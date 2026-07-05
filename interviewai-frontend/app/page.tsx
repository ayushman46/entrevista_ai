import Link from "next/link";

const FEATURES = [
  {
    icon: "◎",
    title: "Resume-Grounded Questions",
    desc: "Every question is generated directly from your resume. No generic trivia — only what you've actually done.",
  },
  {
    icon: "◈",
    title: "Real-Time Voice Conversation",
    desc: "Speak naturally. The AI listens, responds with audio, and adapts — just like a real panel interview.",
  },
  {
    icon: "◇",
    title: "Instant Diagnostic Report",
    desc: "Get a full PDF breakdown: scores, ideal answers, learning roadmap, and hire/no-hire recommendation.",
  },
  {
    icon: "◉",
    title: "Zero Latency Pipeline",
    desc: "WebSocket streaming keeps turns seamless — sub-second AI responses with no awkward pauses.",
  },
];

const ROLES = [
  "SDE Intern", "Frontend Developer", "Backend Developer",
  "Full Stack Developer", "Data Analyst",
];

export default function HomePage() {
  return (
    <div className="min-h-screen" style={{ background: "#0C0C14" }}>
      {/* ── Nav ───────────────────────────────────── */}
      <nav
        className="sticky top-0 z-50 border-b"
        style={{
          background: "rgba(12,12,20,0.85)",
          backdropFilter: "blur(20px)",
          borderColor: "rgba(255,255,255,0.06)",
        }}
      >
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className="text-lg font-bold tracking-tight"
              style={{ color: "#A78BFA" }}
            >
              Entrevista
            </span>
            <span
              className="text-xs font-semibold px-1.5 py-0.5 rounded"
              style={{ background: "rgba(124,58,237,0.2)", color: "#A78BFA", border: "1px solid rgba(124,58,237,0.3)" }}
            >
              AI
            </span>
          </div>
          <Link
            href="/upload"
            className="px-5 py-2 rounded-full text-sm font-semibold transition-all duration-200"
            style={{
              background: "linear-gradient(135deg, #7C3AED, #6366F1)",
              color: "white",
              boxShadow: "0 0 20px rgba(124,58,237,0.3)",
            }}
          >
            Start Free
          </Link>
        </div>
      </nav>

      {/* ── Hero ──────────────────────────────────── */}
      <section className="relative overflow-hidden">
        {/* Ambient blobs */}
        <div
          className="absolute -top-32 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full pointer-events-none"
          style={{
            background: "radial-gradient(ellipse, rgba(124,58,237,0.15) 0%, transparent 70%)",
            filter: "blur(40px)",
          }}
        />

        <div className="relative max-w-4xl mx-auto px-6 pt-24 pb-20 text-center">
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-8"
            style={{
              background: "rgba(124,58,237,0.12)",
              border: "1px solid rgba(124,58,237,0.3)",
              color: "#A78BFA",
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#A78BFA] animate-pulse" />
            AI-Powered Interview Coach
          </div>

          <h1
            className="text-5xl md:text-6xl font-extrabold tracking-tight mb-6 leading-tight"
            style={{ color: "#F1F5F9" }}
          >
            Interview prep that{" "}
            <span
              style={{
                background: "linear-gradient(135deg, #A78BFA 0%, #7C3AED 50%, #818CF8 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              actually knows you
            </span>
          </h1>

          <p className="text-lg mb-10 max-w-xl mx-auto leading-relaxed" style={{ color: "#94A3B8" }}>
            Upload your resume. Have a real voice conversation with an AI interviewer.
            Get a detailed report of exactly where you stand — and how to improve.
          </p>

          <div className="flex items-center justify-center gap-4">
            <Link
              href="/upload"
              className="px-8 py-3.5 rounded-full text-sm font-bold transition-all duration-200 hover:scale-105"
              style={{
                background: "linear-gradient(135deg, #7C3AED, #6366F1)",
                color: "white",
                boxShadow: "0 4px 30px rgba(124,58,237,0.35)",
              }}
            >
              Start Interview →
            </Link>
            <a
              href="#features"
              className="px-8 py-3.5 rounded-full text-sm font-semibold transition-all duration-200"
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.08)",
                color: "#94A3B8",
              }}
            >
              See How It Works
            </a>
          </div>
        </div>
      </section>

      {/* ── Stats ─────────────────────────────────── */}
      <section className="max-w-4xl mx-auto px-6 py-12">
        <div
          className="grid grid-cols-3 divide-x divide-white/5 rounded-2xl overflow-hidden"
          style={{ background: "rgba(28,28,46,0.5)", border: "1px solid rgba(255,255,255,0.06)" }}
        >
          {[
            { num: "< 1s",  label: "AI response time"        },
            { num: "100%",  label: "Resume-grounded questions" },
            { num: "5–8",   label: "Questions per session"    },
          ].map((s, i) => (
            <div key={i} className="py-8 text-center" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
              <div
                className="text-3xl font-extrabold mb-1"
                style={{
                  background: "linear-gradient(135deg, #A78BFA, #7C3AED)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                {s.num}
              </div>
              <p className="text-xs" style={{ color: "#94A3B8" }}>{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ──────────────────────────────── */}
      <section id="features" className="max-w-6xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-3" style={{ color: "#F1F5F9" }}>
            Everything you need to ace your interview
          </h2>
          <p style={{ color: "#94A3B8" }}>Built for candidates who want real, targeted preparation.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="p-6 rounded-2xl transition-all duration-200 hover:scale-[1.01]"
              style={{
                background: "rgba(28,28,46,0.6)",
                border: "1px solid rgba(255,255,255,0.07)",
              }}
            >
              <div
                className="text-2xl mb-4 w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: "rgba(124,58,237,0.15)", color: "#A78BFA" }}
              >
                {f.icon}
              </div>
              <h3 className="font-bold text-base mb-2" style={{ color: "#F1F5F9" }}>{f.title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: "#94A3B8" }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Roles ─────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 pb-16">
        <div
          className="p-8 rounded-2xl"
          style={{ background: "rgba(124,58,237,0.06)", border: "1px solid rgba(124,58,237,0.2)" }}
        >
          <h3 className="font-bold text-lg mb-2" style={{ color: "#F1F5F9" }}>Supported Roles</h3>
          <p className="text-sm mb-6" style={{ color: "#94A3B8" }}>
            The AI calibrates its depth and question types based on your chosen target role.
          </p>
          <div className="flex flex-wrap gap-2 mb-8">
            {ROLES.map((r) => (
              <span
                key={r}
                className="px-4 py-2 rounded-full text-sm font-medium"
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  color: "#94A3B8",
                }}
              >
                {r}
              </span>
            ))}
          </div>
          <Link
            href="/upload"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-bold transition-all hover:scale-105"
            style={{
              background: "linear-gradient(135deg, #7C3AED, #6366F1)",
              color: "white",
              boxShadow: "0 4px 20px rgba(124,58,237,0.3)",
            }}
          >
            Get Started →
          </Link>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────── */}
      <footer
        className="border-t py-8"
        style={{ borderColor: "rgba(255,255,255,0.06)" }}
      >
        <p className="text-center text-xs" style={{ color: "#475569" }}>
          © {new Date().getFullYear()} Entrevista AI · Powered by Gemini & Google Speech · Built for serious candidates
        </p>
      </footer>
    </div>
  );
}
