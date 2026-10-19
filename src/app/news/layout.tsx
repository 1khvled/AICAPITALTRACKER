import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Research wire — AI capital, debt and infrastructure filings",
  description:
    "Verified financial dispatches on AI debt issuance, GPU capex and frontier lab capitalisation, refreshed daily from public filings and wires.",
  alternates: {
    canonical: "/news",
  },
  openGraph: {
    title: "Research wire | AI Capital Tracker",
    description:
      "Daily snapshot of verified AI capital, debt and infrastructure filings from public sources.",
    url: "/news",
    type: "website",
  },
};

export default function NewsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}