import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "InterviewAI — AI Mock Interview Platform",
  description: "Practice technical interviews with an AI interviewer. Get real-time feedback, adaptive questions, and detailed reports.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-screen antialiased" style={{ background: "#eef0f8" }}>
        {children}
      </body>
    </html>
  );
}
