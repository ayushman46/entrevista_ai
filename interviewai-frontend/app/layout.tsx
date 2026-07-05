import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Entrevista | AI Interview Platform",
  description:
    "A production-grade AI interview platform that tailors questions to the candidate's resume and target role.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
