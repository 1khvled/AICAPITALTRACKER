import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Bubble (2026) vs Dot-Com Bubble (2000) — Macroeconomic Structural Comparison",
  description:
    "An authoritative, quantitative macroeconomic comparison between the 2026 AI infrastructure superstructure ($2.86T capital, $668B OCF) and the 1999–2000 dot-com bubble. Evaluates cash flows, dark fiber vs GPU clusters, debt structures, and neocloud CLEC parallels.",
  alternates: {
    canonical: "/dotcom-vs-ai",
  },
  openGraph: {
    title: "AI Superstructure (2026) vs Dot-Com Bubble (2000) | AI Capital Tracker",
    description:
      "Why Big Tech cash flows ($668B OCF) protect equity solvency, but leveraged neoclouds ($228.1B debt) carry classic 1999 CLEC refinancing risks.",
    url: "/dotcom-vs-ai",
    type: "website",
  },
};

export default function DotComVsAiLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
