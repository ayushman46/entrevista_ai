import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "InterviewAI — AI Mock Interview Platform",
  description: "Practice technical interviews with an AI interviewer. Get real-time feedback, adaptive questions, and detailed reports.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-white text-slate-900 min-h-screen antialiased`}>
        <nav className="bg-white/80 backdrop-blur-md sticky top-0 z-50">
          <div className="max-w-4xl mx-auto px-6 py-8 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="font-semibold tracking-tight text-lg">InterviewAI</span>
            </div>
            <div className="text-xs font-medium text-slate-400 uppercase tracking-widest">Powered by AI</div>
          </div>
        </nav>
        <main className="max-w-4xl mx-auto px-6 py-12">
          {children}
        </main>
      </body>
    </html>
  );
}
