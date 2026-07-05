import Link from "next/link";
import { ArrowRight, WandSparkles } from "lucide-react";
import { StatsCards } from "@/components/landing/stats-cards";
import { InterviewPreview } from "@/components/landing/interview-preview";

export function HeroSection() {
  return (
    <section className="mt-10 grid gap-6 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
      <div className="pt-8 lg:pt-16">
        <div className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-5 py-2 text-sm font-semibold tracking-[0.28em] text-slate-200">
          BUILT FOR SMARTER HIRING
        </div>

        <h1 className="mt-10 max-w-[760px] text-[clamp(4.2rem,7vw,7.6rem)] font-semibold leading-[0.92] tracking-tight text-white">
          Turn every interview into a focused, data-rich hiring signal.
        </h1>

        <p className="mt-8 max-w-[560px] text-xl leading-9 text-slate-300">
          VitaHire uses the job description and candidate resume to generate relevant interview flows, evaluate depth of knowledge, and surface clear hiring insights in minutes.
        </p>

        <div className="mt-10 flex flex-col gap-4 sm:flex-row">
          <Link
            href="/upload"
            className="inline-flex items-center justify-center rounded-full bg-[#7C3AED] px-8 py-4 text-lg font-semibold text-white shadow-[0_0_30px_-5px_rgba(124,58,237,0.4)] transition duration-300 hover:-translate-y-0.5 hover:bg-[#8B5CF6] active:scale-[0.98]"
          >
            Start an interview
          </Link>
          <a
            href="#workflow"
            className="inline-flex items-center justify-center rounded-full border border-white/12 bg-[#1A1D2E] px-8 py-4 text-lg font-semibold text-white transition duration-300 hover:-translate-y-0.5 hover:bg-white/10 active:scale-[0.98]"
          >
            See how it works
          </a>
        </div>

        <div className="mt-12">
          <StatsCards />
        </div>
      </div>

      <div className="pt-6 lg:pt-12">
        <InterviewPreview />
      </div>
    </section>
  );
}
