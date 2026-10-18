import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "159-Deal AI Capital Ledger ($2.81T Disclosed) — SEC Filings & Debt Facilities",
  description:
    "Comprehensive institutional ledger of 159 verified AI infrastructure financings totaling $2.81T. Filter by debt facilities, GPU compute capacity, nuclear off-takes, and circular financing with full CSV/JSON export.",
  keywords: [
    "AI deal ledger",
    "AI capital database",
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
    title: "159-Deal AI Capital Ledger ($2.81T Disclosed) | AI Capital Tracker",
    description:
      "Audit all 159 tracked AI infrastructure deals. Filter by debt facilities, GPU compute contracts, nuclear off-takes, and circular money flows.",
    url: "/ledger",
    type: "website",
  },
};

export default function LedgerLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
