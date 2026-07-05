import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Entrevista AI — Intelligent Interview Coach",
  description: "Practice job interviews with an AI that knows your resume. Real-time voice conversations, adaptive questions, and detailed feedback.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} h-full`}>
      <body className="font-[var(--font-inter),system-ui,sans-serif] min-h-screen bg-[#0C0C14] text-[#F1F5F9] antialiased">
        {children}
      </body>
    </html>
  );
}
