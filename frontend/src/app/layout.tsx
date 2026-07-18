import type { Metadata } from "next";
import { EB_Garamond, Figtree } from "next/font/google";
import "./globals.css";
import { Navbar } from "../components/Navbar";

const ebGaramond = EB_Garamond({ subsets: ["latin"], variable: "--font-eb-garamond" });
const figtree = Figtree({ subsets: ["latin"], variable: "--font-figtree" });

export const metadata: Metadata = {
  title: "InterviewAI - AI Mock Interview Platform",
  description: "Low latency voice mock interviews built for students.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${ebGaramond.variable} ${figtree.variable} font-sans`}>
        <Navbar />
        {children}
      </body>
    </html>
  );
}
