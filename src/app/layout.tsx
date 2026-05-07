import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DMD Trials Change Tracker",
  description: "Monitor field-level monthly changes across all Duchenne Muscular Dystrophy clinical trials registered on ClinicalTrials.gov.",
  openGraph: {
    title: "DMD Trials Change Tracker",
    description: "Monitor field-level monthly changes across all Duchenne Muscular Dystrophy clinical trials registered on ClinicalTrials.gov.",
    type: "website",
  },
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🧬</text></svg>",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
