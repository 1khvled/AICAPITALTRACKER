import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mathematical Methodology & Factor Calibration — 8-Factor Structural Credit Model",
  description:
    "Rigorous quantitative mathematical framework behind the AI Bubble Burst Probability Index. Detailed formulation of the 8 weighted diagnostic factors, systemic contagion exponent, degradation honesty protocol, and empirical calibrations.",
  keywords: [
    "AI bubble methodology",
    "credit risk methodology AI",
    "systemic contagion formula",
    "Merton structural credit model AI",
    "degradation honesty protocol",
    "GPU economic lifespan formula",
    "AI capital model calibration",
    "hyperscaler debt risk mathematics",
  ],
  alternates: {
    canonical: "/methodology",
  },
  openGraph: {
    title: "Mathematical Methodology & Factor Calibration | AI Capital Tracker",
    description:
      "Explore the 8-factor mathematical framework, nonlinear systemic contagion terms, and empirical calibrations underpinning the AI Capital Tracker.",
    url: "/methodology",
    type: "website",
  },
};

export default function MethodologyLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
