import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Methodology — how the burst probability is calculated",
  description:
    "The published weights, formulas, calibration anchors and backtests behind the 12-month AI burst probability, written out in full.",
  keywords: [
    "AI bubble methodology",
    "bubble probability model",
    "factor weights",
    "model backtesting",
    "Brier score",
    "degradation honesty protocol",
    "Merton distance to default",
    "AI credit risk mathematics",
  ],
  alternates: {
    canonical: "/methodology",
  },
  openGraph: {
    title: "Methodology | AI Capital Tracker",
    description:
      "The weights, formulas, calibration anchors and empirical backtests behind the burst probability.",
    url: "/methodology",
    type: "website",
  },
};

export default function MethodologyLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}