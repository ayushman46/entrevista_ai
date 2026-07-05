import { BrainCircuit, FileText, MicVocal } from "lucide-react";

const features = [
  {
    title: "Resume-aware questions",
    description:
      "The session adapts to the candidate's resume so the interview feels specific and grounded.",
    icon: FileText,
  },
  {
    title: "Natural speaking flow",
    description:
      "Candidates answer out loud while the AI listens and follows up like a real interviewer.",
    icon: MicVocal,
  },
  {
    title: "Clear feedback",
    description:
      "The report turns the interview into scores, strengths, and next steps in one place.",
    icon: BrainCircuit,
  },
];

export function FeatureTiles() {
  return (
    <section id="features" className="mt-4 grid gap-4 lg:grid-cols-3">
      {features.map((feature) => {
        const Icon = feature.icon;
        return (
          <article
            key={feature.title}
            className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6 transition duration-300 hover:-translate-y-1 hover:border-white/15 hover:bg-white/7 hover:shadow-[0_30px_100px_-55px_rgba(124,58,237,0.22)]"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-white">
              <Icon className="h-5 w-5" />
            </div>
            <h3 className="mt-5 text-xl font-semibold text-white">{feature.title}</h3>
            <p className="mt-3 text-sm leading-7 text-slate-400">{feature.description}</p>
          </article>
        );
      })}
    </section>
  );
}
