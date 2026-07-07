"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function Navbar() {
  const pathname = usePathname();

  // Hide navbar in the actual interview room to avoid distractions/overlaps
  if (pathname?.startsWith("/interview/")) {
    return null;
  }

  return (
    <div className="fixed top-6 left-0 right-0 flex justify-center z-50 pointer-events-none">
      <nav className="w-[90%] max-w-5xl bg-cream border-2 border-vast rounded-full h-16 flex items-center justify-between px-2 pointer-events-auto">
        <Link href="/" className="font-bold text-xl tracking-tight pl-6 hover:opacity-80">
          InterviewAI
        </Link>
        <div className="hidden md:flex items-center gap-8 text-sm font-medium">
          <Link href="/#features" className="hover:opacity-70 transition-opacity">Features</Link>
          <Link href="/#pricing" className="hover:opacity-70 transition-opacity">Pricing</Link>
        </div>
        <Link href="/upload" className="bg-lavender text-vast font-bold text-sm px-6 h-[44px] flex items-center rounded-[14px] border-2 border-vast transition-transform hover:-translate-y-0.5">
          Start Interview
        </Link>
      </nav>
    </div>
  );
}
