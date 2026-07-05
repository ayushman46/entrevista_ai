const bubbles = [
  {
    text: "Walk me through the architecture tradeoffs you made on your latest backend project.",
    tone: "interviewer",
  },
  {
    text: "I optimized for latency and observability by splitting read and write paths, then added tracing and queue-based retries.",
    tone: "candidate",
  },
  {
    text: "Good. Now explain how you would scale that system for a 10x traffic spike.",
    tone: "interviewer",
  },
];

const metrics = [
  ["Technical depth", "88"],
  ["Communication", "91"],
  ["Role fit", "86"],
];

export function InterviewPreview() {
  return (
    <div id="results" className="rounded-[2.25rem] border border-white/10 bg-[linear-gradient(180deg,rgba(11,15,28,0.98),rgba(17,23,42,0.92))] p-8 shadow-[0_40px_120px_-60px_rgba(0,0,0,0.95)] lg:p-8">
      <div className="flex items-center justify-between gap-3">
        <span className="rounded-full bg-violet-500/18 px-5 py-2.5 text-base font-semibold text-violet-200">
          Live interview preview
        </span>
        <span className="rounded-full bg-emerald-400/15 px-5 py-2.5 text-base font-semibold text-emerald-300">
          Adaptive mode
        </span>
      </div>

      <div className="mt-8 space-y-4">
        {bubbles.map((bubble, index) => {
          const isCandidate = bubble.tone === "candidate";
          const isHighlighted = index === 1;
          return (
            <div
              key={bubble.text}
              className={[
                "rounded-[1.75rem] px-6 py-6 shadow-[0_20px_60px_-45px_rgba(0,0,0,0.7)]",
                isCandidate
                  ? "bg-[linear-gradient(135deg,rgba(14,165,233,0.18),rgba(34,197,94,0.14))]"
                  : "bg-white/5",
                isHighlighted ? "border border-white/10" : "",
              ].join(" ")}
            >
              <p className="max-w-[95%] text-[1.15rem] leading-8 text-slate-100">{bubble.text}</p>
            </div>
          );
        })}

        <div className="grid gap-4 sm:grid-cols-[0.82fr_1.18fr] rounded-[1.8rem] bg-white/5 p-6">
          <div>
            <p className="text-sm uppercase tracking-[0.32em] text-slate-400">AI insight</p>
            <p className="mt-4 text-[2.1rem] font-semibold leading-[0.98] text-white">
              Strong systems thinking
            </p>
          </div>
          <div className="flex items-center">
            <p className="text-[1.1rem] leading-7 text-slate-300">
              Candidate shows practical tradeoff awareness, scaling intuition, and strong ownership language.
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {metrics.map(([label, value]) => (
            <div key={label} className="rounded-[1.8rem] border border-white/10 bg-white/5 p-5">
              <p className="text-sm text-slate-400">{label}</p>
              <p className="mt-3 text-4xl font-semibold text-white">{value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
