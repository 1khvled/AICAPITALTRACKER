import type { Metadata } from "next";
import { COMPANIES, companyStats, formatUsd } from "./_components/companyData";

/**
 * Route metadata, computed from the profile table so the count and totals can
 * never go stale.
 */
const stats = companyStats();
const biggest = [...COMPANIES].sort((a, b) => b.totalVolumeUsd - a.totalVolumeUsd).slice(0, 3);

export const metadata: Metadata = {
  title: {
    default: `Who's building AI, and who's lending to them — ${stats.count} companies`,
    template: "%s | AI Capital Tracker",
  },
  description: `Who is spending on AI and who is lending to them across ${stats.count} companies, with ${formatUsd(stats.totalDebtUsd)} in borrowed debt traced to filings.`,
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
    title: `Who's building AI, and who's lending to them — ${stats.count} companies`,
    description: `Debt facilities, valuation multiples and financing links across ${biggest
      .map((c) => c.name)
      .join(", ")} and the rest of the AI supply chain.`,
    url: "/companies",
    type: "website",
  },
};

export default function CompaniesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}