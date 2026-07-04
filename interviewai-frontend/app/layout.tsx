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
    <html lang="en" className="h-full">
      <body className={`${inter.className} bg-slate-100 text-slate-900 min-h-screen antialiased flex flex-col`}>
        {children}
      </body>
    </html>
  );
}
