"use client";

import Link from "next/link";
import { useEffect } from "react";
import { setupClientLogic } from "@/lib/clientLogic";
import { ArrowRight, Sparkles, CheckCircle2, Bot, Layers, ShieldCheck } from "lucide-react";
import { BrandMark } from "@/components/brand-mark";

export default function Page() {
  useEffect(() => {
    setupClientLogic();
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden selection:bg-violet-500/30">
      {/* Background Effects */}
      <div className="pointer-events-none absolute inset-0 bg-grid-white/[0.02] bg-[size:40px_40px]" />
      <div className="pointer-events-none absolute -top-1/2 left-1/2 -z-10 h-[800px] w-[800px] -translate-x-1/2 opacity-20 blur-[120px]">
        <div className="absolute inset-0 bg-hero-glow rounded-full mix-blend-screen" />
      </div>

      <header className="fixed top-0 z-50 w-full border-b border-white/5 bg-black/50 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <BrandMark />
            <span className="text-lg font-semibold tracking-tight text-white">VitaHire</span>
          </div>
          <Link
            href="/upload"
            className="rounded-full bg-white/10 px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-white/20"
          >
            Sign in
          </Link>
        </div>
      </header>

      <main className="pt-32">
        <section className="relative mx-auto max-w-7xl px-6 pt-20 text-center lg:pt-32">
          <div className="animate-slide-up flex flex-col items-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1 text-sm font-medium text-violet-300 backdrop-blur-md">
              <Sparkles className="h-4 w-4" />
              <span>VitaHire AI 2.0 is now live</span>
            </div>
            
            <h1 className="mt-8 max-w-4xl text-balance text-5xl font-bold tracking-tight text-white sm:text-7xl">
              Conduct technical interviews <br className="hidden sm:block"/> with perfect <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-emerald-400">precision.</span>
            </h1>
            
            <p className="mt-6 max-w-2xl text-lg leading-8 text-zinc-400">
              Upload a candidate's resume, select the target role, and let our AI agent conduct a fully interactive, voice-driven technical interview that feels completely human.
            </p>
            
            <div className="mt-10 flex flex-col sm:flex-row items-center gap-4">
              <Link
                href="/upload"
                className="group flex h-12 items-center justify-center gap-2 rounded-full bg-white px-8 text-sm font-semibold text-black transition-all hover:scale-105 hover:bg-zinc-200"
              >
                Start free interview
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                href="#how-it-works"
                className="flex h-12 items-center justify-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/50 px-8 text-sm font-semibold text-white backdrop-blur-sm transition-colors hover:bg-zinc-800"
              >
                View demo
              </Link>
            </div>
          </div>
        </section>

        <section id="how-it-works" className="mx-auto mt-32 max-w-7xl px-6 pb-24">
          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                icon: Layers,
                title: "Context-Aware",
                desc: "Parses the resume to tailor every question to the candidate's actual experience."
              },
              {
                icon: Bot,
                title: "Live Voice Agent",
                desc: "Full voice interaction with ultra-low latency, feeling exactly like a real human."
              },
              {
                icon: ShieldCheck,
                title: "Actionable Insights",
                desc: "Get a comprehensive scoring rubric, strengths, weaknesses, and a hire recommendation."
              }
            ].map((feature, idx) => (
              <div key={idx} className="glass-card rounded-[24px] p-8 transition-all hover:bg-zinc-900/80">
                <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-violet-500/10 text-violet-400">
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="mb-3 text-xl font-semibold text-white">{feature.title}</h3>
                <p className="text-zinc-400 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
