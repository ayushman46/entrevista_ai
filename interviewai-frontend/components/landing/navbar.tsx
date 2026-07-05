import Link from "next/link";
import { BrandMark } from "@/components/brand-mark";

export function Navbar() {
  return (
    <header className="glass-panel sticky top-4 z-50 mx-auto flex max-w-[1320px] items-center justify-between rounded-[2.5rem] px-6 py-5">
      <BrandMark />
      <nav className="hidden items-center gap-12 text-sm font-medium text-slate-300 md:flex">
        <a href="#features" className="transition hover:text-white">Features</a>
        <a href="#workflow" className="transition hover:text-white">Workflow</a>
        <a href="#results" className="transition hover:text-white">Results</a>
        <a href="#faq" className="transition hover:text-white">FAQ</a>
      </nav>
      <Link
        href="/upload"
        className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-white/10"
      >
        Book a demo
      </Link>
    </header>
  );
}
