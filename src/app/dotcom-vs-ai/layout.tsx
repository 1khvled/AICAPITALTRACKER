import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "2000 vs 2026 — the last build-out measured the same way",
  description:
    "The 1999–2000 telecom build-out and the 2026 AI build-out side by side: cash flow, asset utilisation, debt structure and cost deflation.",
  alternates: {
    canonical: "/dotcom-vs-ai",
  },
  openGraph: {
    title: "2000 vs 2026 | AI Capital Tracker",
    description:
      "Cash flows, dark fiber against GPU clusters, and why the debt sits in different places this time.",
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