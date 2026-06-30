import Link from "next/link";

export default function Home() {
  return (
    <div className="space-y-20 py-4 text-slate-900">
      {/* Hero Section */}
      <section className="text-left space-y-6 max-w-3xl">
        <h1 className="text-5xl font-semibold tracking-tight leading-tight text-slate-900">
          Automate your technical screening with voice native artificial intelligence
        </h1>
        <p className="text-xl text-slate-500 leading-relaxed max-w-2xl font-light">
          InterviewAI conducts autonomous mock assessments, evaluates resume depth, and generates deep diagnostic audits to save your engineering team hundreds of screening hours.
        </p>
        <div className="flex gap-4 pt-4">
          <Link href="/upload" className="btn-primary">
            Launch Candidate Demo
          </Link>
          <a href="#features" className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-900 font-medium rounded-full transition-colors">
            Learn More
          </a>
        </div>
      </section>

      {/* Product Metrics Grid */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-8 border-t border-b border-slate-100 py-12">
        <div className="space-y-2">
          <div className="text-4xl font-semibold text-indigo-600">80 percent</div>
          <h4 className="font-semibold text-slate-900">Engineering hours saved</h4>
          <p className="text-slate-500 text-sm leading-relaxed">
            Eliminate time wasted on initial technical recruiter loops. Let the AI conduct the first technical round automatically.
          </p>
        </div>
        <div className="space-y-2">
          <div className="text-4xl font-semibold text-indigo-600">Sub-second</div>
          <h4 className="font-semibold text-slate-900">Response latency</h4>
          <p className="text-slate-500 text-sm leading-relaxed">
            Low latency WebSocket architecture ensures candidates have a natural back and forth conversation without awkward pauses.
          </p>
        </div>
        <div className="space-y-2">
          <div className="text-4xl font-semibold text-indigo-600">100 percent</div>
          <h4 className="font-semibold text-slate-900">Bias free assessment</h4>
          <p className="text-slate-500 text-sm leading-relaxed">
            Every candidate is graded strictly on technical accuracy, communication clarity, and response depth.
          </p>
        </div>
      </section>

      {/* Core SaaS Capabilities */}
      <section id="features" className="space-y-12">
        <div className="space-y-3">
          <h2 className="text-3xl font-semibold tracking-tight text-slate-900">Platform Capabilities</h2>
          <p className="text-slate-500 max-w-xl">
            A comprehensive screening suite designed for recruiters and engineering managers.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
          <div className="space-y-2">
            <h3 className="font-semibold text-slate-900 text-lg">Resume Context Matching</h3>
            <p className="text-slate-500 text-sm leading-relaxed">
              Upload a candidate PDF. Our system parses their experience and automatically generates a custom interview plan mapped to their skills and target role.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold text-slate-900 text-lg">Adaptive Questioning</h3>
            <p className="text-slate-500 text-sm leading-relaxed">
              The AI interviewer listens to candidate answers and dynamically adjusts questions. It challenges strong topics and probes areas that need validation.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold text-slate-900 text-lg">Granular Evaluation Engine</h3>
            <p className="text-slate-500 text-sm leading-relaxed">
              Every turn is scored across multiple criteria including technical correctness, communication structure, and confidence level.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold text-slate-900 text-lg">Executive Reports</h3>
            <p className="text-slate-500 text-sm leading-relaxed">
              On interview completion, download a complete diagnostic PDF report featuring hiring recommendations, key strengths, and structured roadmaps.
            </p>
          </div>
        </div>
      </section>

      {/* Target Roles and Audiences */}
      <section className="bg-slate-50 rounded-3xl p-8 border border-slate-100 space-y-6">
        <h3 className="font-semibold text-slate-900 text-xl">Supported Screening Pipelines</h3>
        <p className="text-slate-500 text-sm leading-relaxed max-w-2xl">
          Deploy structured voice screens across multiple disciplines. Our orchestrator adjusts its technical depth depending on the target role selected.
        </p>
        <div className="flex flex-wrap gap-3">
          {["Software Development Engineer Intern", "Frontend Developer", "Backend Developer", "Full Stack Developer", "Data Analyst"].map((role) => (
            <span key={role} className="bg-white border border-slate-200 text-slate-700 text-xs font-semibold px-4 py-2 rounded-full shadow-sm">
              {role}
            </span>
          ))}
        </div>
      </section>
    </div>
  );
}
