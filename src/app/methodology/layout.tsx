import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "How we calculate the AI bubble chance — methodology and formulas",
  description:
    "The exact formulas, factor weights, data sources, and historical backtests behind the 12-month AI bubble probability.",
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
    title: "How we calculate the AI bubble chance — methodology and formulas",
    description:
      "The exact formulas, factor weights, data sources, and historical backtests behind the 12-month AI bubble probability.",
    url: "/methodology",
    type: "website",
  },
};

export default function MethodologyLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}