import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DMD Trials Change Tracker",
  description: "Track changes in Duchenne Muscular Dystrophy clinical trials over time",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
