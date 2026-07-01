import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DocScribe — AI Medical Scribe",
  description:
    "Digital prescription pad that listens to consultations, extracts clinical context, and lets doctors tap-type medicines in seconds.",
  keywords: ["medical scribe", "prescription", "AI", "doctor", "healthcare"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
