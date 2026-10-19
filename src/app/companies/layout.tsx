import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Corporate AI Debt Exposure & Counterparty Matrix — 20 Profiling Entities",
  description:
    "Audited debt breakdowns, balance sheet leverage ratios, valuation multiples, and circular counterparty financing networks across Anthropic, OpenAI, Oracle, CoreWeave, Blackstone, and NVIDIA.",
  keywords: [
    "Anthropic debt breakdown",
    "Oracle AI debt obligations",
    "CoreWeave private credit",
    "NVIDIA circular financing",
    "xAI Colossus debt tranches",
    "Blackstone AI infrastructure debt",
    "AI corporate credit risk",
  ],
  alternates: {
    canonical: "/companies",
  },
  openGraph: {
    title: "Corporate AI Debt Exposure & Counterparty Matrix | AI Capital Tracker",
    description:
      "Audited debt breakdowns, leverage ratios, and circular financing mapping across the foundational companies carrying the $2.86T AI superstructure.",
    url: "/companies",
    type: "website",
  },
};

export default function CompaniesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
