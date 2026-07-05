import Link from "next/link";

function Nav() {
  return (
    <header className="border-b border-slate-200/60 bg-white/70 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center">
            <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/>
            </svg>
          </div>
          <span className="font-bold text-slate-800 text-base tracking-tight">InterviewAI</span>
        </div>
        <Link
          href="/upload"
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-full transition-all shadow-sm"
        >
          Get Started
        </Link>
      </div>
    </header>
  );
}

const features = [
  {
    icon: "🎯",
    title: "Resume-Aligned Questions",
    desc: "Every question is generated from your actual resume — projects, skills and experiences, nothing random.",
  },
  {
    icon: "🎙️",
    title: "Real-Time Voice Conversation",
    desc: "Speak naturally. The AI listens, responds with audio, and adapts — just like a real interviewer.",
  },
  {
    icon: "📊",
    title: "Instant Diagnostic Report",
    desc: "After every session, get a detailed PDF report with scores, ideal answers, and actionable feedback.",
  },
  {
    icon: "⚡",
    title: "Sub-Second Latency",
    desc: "WebSocket architecture keeps turns seamless — no awkward delays between your answer and the next question.",
  },
];

const roles = [
  "SDE Intern", "Frontend Developer", "Backend Developer",
  "Full Stack Developer", "Data Analyst",
];

export default function Home() {
  return (
    <>
      <Nav />
      <main className="max-w-5xl mx-auto px-6 py-16 space-y-24">

        {/* Hero */}
        <section className="text-center space-y-6 max-w-2xl mx-auto pt-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-xs font-semibold border border-indigo-100 mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
            AI-Powered Mock Interviews
          </div>
          <h1 className="text-5xl font-extrabold tracking-tight text-slate-900 leading-tight">
            Practice Interviews That<br />
            <span className="text-indigo-600">Actually Prepare You</span>
          </h1>
          <p className="text-lg text-slate-500 leading-relaxed">
            Upload your resume, choose your target role, and speak with an AI interviewer that asks exactly the right questions based on your background.
          </p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <Link
              href="/upload"
              className="px-7 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-full transition-all shadow-md hover:shadow-lg"
            >
              Start Free Interview →
            </Link>
            <a href="#features" className="px-7 py-3.5 bg-white hover:bg-slate-50 text-slate-700 text-sm font-semibold rounded-full transition-all border border-slate-200 shadow-sm">
              Learn More
            </a>
          </div>
        </section>

        {/* Stats */}
        <section className="grid grid-cols-3 gap-8 border-y border-slate-100 py-12">
          {[
            { num: "< 1s",  label: "Response latency"       },
            { num: "100%",  label: "Resume-grounded questions" },
            { num: "6",     label: "Questions per session"   },
          ].map(s => (
            <div key={s.label} className="text-center space-y-1">
              <div className="text-4xl font-extrabold text-indigo-600">{s.num}</div>
              <p className="text-slate-500 text-sm">{s.label}</p>
            </div>
          ))}
        </section>

        {/* Features */}
        <section id="features" className="space-y-10">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-bold text-slate-800 tracking-tight">How It Works</h2>
            <p className="text-slate-500 text-sm max-w-md mx-auto">
              Three steps from resume upload to a complete diagnostic report.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {features.map(f => (
              <div key={f.title} className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="text-3xl mb-3">{f.icon}</div>
                <h3 className="font-bold text-slate-800 text-base mb-1">{f.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Roles */}
        <section className="bg-white rounded-3xl border border-slate-100 p-8 shadow-sm space-y-5">
          <h3 className="font-bold text-slate-800 text-xl">Supported Roles</h3>
          <p className="text-slate-500 text-sm">
            Pick the role closest to your target position — the AI adjusts its technical depth and question types accordingly.
          </p>
          <div className="flex flex-wrap gap-2.5">
            {roles.map(r => (
              <span key={r} className="px-4 py-2 bg-slate-50 border border-slate-200 text-slate-700 text-sm font-medium rounded-full">
                {r}
              </span>
            ))}
          </div>
          <Link
            href="/upload"
            className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-full transition-all shadow-md mt-2"
          >
            Start Your Interview →
          </Link>
        </section>

      </main>
      <footer className="border-t border-slate-100 py-8 mt-8">
        <p className="text-center text-slate-400 text-xs">
          © {new Date().getFullYear()} InterviewAI · Powered by Gemini + Google Speech · Built for candidates who want to prepare better.
        </p>
      </footer>
    </>
  );
}
