import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "VitaHire | AI Interview Platform",
  description:
    "A production-grade AI interview platform that tailors questions to the candidate's resume and target role.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} dark`}>
      <body className="bg-black text-white font-sans antialiased min-h-screen flex flex-col">
        {children}
      </body>
    </html>
  );
}
