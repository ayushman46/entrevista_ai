import Link from "next/link";
import React from "react";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-cream text-vast flex flex-col items-center">

      {/* Hero */}
      <section className="pt-48 pb-24 px-6 max-w-5xl text-center flex flex-col items-center w-full relative">
        <h1 className="font-serif text-[48px] md:text-[96px] leading-[0.95] tracking-tight mb-10 text-vast relative z-10">
          Practice interviews that <br/>
          <span className="relative inline-block mt-4">
            actually talk back
            <svg 
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[20%] w-[110%] h-[120%] text-lavender -z-10" 
              viewBox="0 0 400 100" 
              fill="none" 
              preserveAspectRatio="none"
            >
              <path 
                d="M10,50 Q200,30 390,60" 
                stroke="currentColor" 
                strokeWidth="45" 
                strokeLinecap="round" 
              />
            </svg>
          </span>
        </h1>
        <p className="text-2xl md:text-[22px] text-vast max-w-2xl mb-12 font-medium leading-relaxed mt-4">
          A truly low-latency voice AI that listens, thinks, and responds like a real hiring manager. Zero lag, maximum prep.
        </p>
        <div className="flex items-center gap-4">
          <Link href="/upload" className="bg-lavender text-vast font-bold text-[17px] px-8 py-4 rounded-xl border-2 border-vast transition-transform hover:-translate-y-1">
            Upload Resume
          </Link>
          <Link href="#demo" className="bg-cream text-vast font-bold text-[17px] px-8 py-4 rounded-xl border-2 border-vast transition-transform hover:-translate-y-1">
            See how it works
          </Link>
        </div>
      </section>

      {/* Dark Chamber */}
      <section className="w-full px-4 md:px-8 pb-8 mt-12">
        <div className="bg-vast text-cream w-full rounded-[60px] rounded-b-none p-12 md:p-24 flex flex-col md:flex-row items-start justify-between gap-12 border-2 border-vast min-h-[600px]">
          <div className="flex-1 max-w-xl">
            <h2 className="font-serif text-5xl md:text-[64px] leading-tight mb-6">
              Hear the difference instantly.
            </h2>
            <p className="text-xl opacity-90 mb-8 font-light leading-relaxed">
              No more waiting 10 seconds for the AI to type out a response. We pipelined the STT, LLM streaming, and TTS into one seamless voice loop.
            </p>
            <Link href="/upload" className="inline-block bg-cream text-vast font-bold text-lg px-8 py-4 rounded-xl border-2 border-vast transition-transform hover:-translate-y-0.5">
              Try it now
            </Link>
          </div>
          <div className="flex-1 relative border-2 border-vast bg-cream rounded-[40px] p-6 max-w-sm w-full aspect-[9/16] flex flex-col overflow-hidden mx-auto md:mr-0 md:mt-0 mt-8">
            <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-vast text-cream px-5 py-2 rounded-full text-xs font-bold tracking-wide">
              Interview Room
            </div>
            <div className="mt-20 flex-1 flex flex-col gap-4">
              <div className="self-start bg-lavender border-2 border-vast text-vast px-4 py-3 rounded-2xl rounded-bl-none font-medium text-sm leading-relaxed max-w-[85%]">
                Tell me about a time you had to optimize a slow backend system.
              </div>
              <div className="self-end bg-cream border-2 border-vast text-vast px-4 py-3 rounded-2xl rounded-br-none font-medium text-sm leading-relaxed max-w-[85%]">
                I noticed our main DB queries were missing indexes, causing massive slowdowns...
              </div>
            </div>
            {/* Waveform Mock */}
            <div className="mx-auto mt-4 mb-4 flex items-center justify-center gap-1.5 h-12 px-6 rounded-full border-2 border-vast bg-cream">
              <div className="w-1.5 h-5 bg-forest rounded-full"></div>
              <div className="w-1.5 h-8 bg-forest rounded-full"></div>
              <div className="w-1.5 h-4 bg-forest rounded-full"></div>
              <div className="w-1.5 h-6 bg-forest rounded-full"></div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
