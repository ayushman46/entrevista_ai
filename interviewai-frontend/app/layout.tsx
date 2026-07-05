import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Entrevista | AI Interview Practice",
  description:
    "A modern AI interview platform that tailors practice to the candidate's resume and target role.",
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
