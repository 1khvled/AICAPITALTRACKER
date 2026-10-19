import type { Metadata } from "next";
import { COMPANIES, companyStats, formatUsd } from "./_components/companyData";

/**
 * Route metadata, computed from the profile table so the count and totals can
 * never go stale.
 */
const stats = companyStats();
const biggest = [...COMPANIES].sort((a, b) => b.totalVolumeUsd - a.totalVolumeUsd).slice(0, 3);

export const metadata: Metadata = {
  title: `AI company debt and circularity — ${stats.count} profiles (${formatUsd(stats.totalDebtUsd)} debt)`,
  description: `Debt, committed capital, valuation multiples and circular counterparty links across ${stats.count} AI companies. ${formatUsd(stats.totalVolumeUsd)} committed, ${formatUsd(stats.totalDebtUsd)} borrowed.`,
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
    title: `AI company debt and circularity — ${stats.count} profiles | AI Capital Tracker`,
    description: `Debt facilities, valuation multiples and circular financing links across ${biggest
      .map((c) => c.name)
      .join(", ")} and the rest of the AI supply chain.`,
    url: "/companies",
    type: "website",
  },
};

export default function CompaniesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}