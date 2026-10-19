import type { Metadata } from "next";
import { formatTotal, ledgerStats } from "./_components/ledgerData";

/**
 * Route metadata, computed from the dataset rather than typed by hand, so the
 * title can never advertise a stale count or total.
 */
const stats = ledgerStats();
const capital = formatTotal(stats.totalUsd).replace("$", "");

export const metadata: Metadata = {
  title: `${stats.dealCount} sourced AI deals (${capital} disclosed) — the deal ledger`,
  description: `Every AI investment, loan and power deal we could source, in one searchable list. ${stats.dealCount} deals worth $${capital}, each traced to filings. CSV and JSON export.`,
  keywords: [
    "AI deal ledger",
    "AI capital database",
    "AI infrastructure financings",
    "Anthropic debt filing",
    "CoreWeave convertible notes",
    "Oracle cloud commitments",
    "AI compute contracts",
    "GPU datacenter debt",
    "circular vendor financing AI",
  ],
  alternates: {
    canonical: "/ledger",
  },
  openGraph: {
    title: `${stats.dealCount} sourced AI deals (${capital}) | AI Capital Tracker`,
    description: `Search ${stats.dealCount} verified AI financings worth ${capital}: equity rounds, debt facilities, GPU compute contracts, nuclear and power deals.`,
    url: "/ledger",
    type: "website",
  },
};

export default function LedgerLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}