import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col justify-center min-h-[60vh] max-w-2xl">
      <div className="mb-16">
        <h1 className="text-4xl md:text-5xl font-medium tracking-tight text-slate-900 mb-6 leading-tight">
          Master your next <br/> technical interview.
        </h1>
        <p className="text-lg text-slate-500 mb-10 leading-relaxed max-w-lg">
          Upload your resume. Choose a role. Speak naturally. 
          Get instant, actionable feedback in a clean, distraction-free environment.
        </p>
        <Link href="/upload" className="btn-primary">
          Start Practice Session
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10 border-t border-slate-100 pt-12">
        {[
          {
            title: "Voice-Native",
            desc: "Speak directly into your browser. No third-party apps required.",
          },
          {
            title: "Context-Aware",
            desc: "Questions dynamically adjust to your resume and ongoing performance.",
          },
          {
            title: "Deep Analytics",
            desc: "Receive comprehensive reports highlighting strengths and exact areas for improvement.",
          },
        ].map((f) => (
          <div key={f.title}>
            <h3 className="font-medium text-slate-900 mb-2">{f.title}</h3>
            <p className="text-slate-500 text-sm leading-relaxed">{f.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
