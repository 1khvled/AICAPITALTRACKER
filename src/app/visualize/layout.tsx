import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Charts — capex gap, valuations, token deflation and credit spreads",
  description:
    "The same numbers the site reports, drawn: the hyperscaler capex gap, frontier lab multiples, inference price deflation and the Oracle credit spread.",
  keywords: [
    "AI capex chart",
    "hyperscaler capex gap",
    "AI lab valuation multiples",
    "inference token price deflation",
    "Oracle credit default swap chart",
    "AI bubble charts",
  ],
  alternates: {
    canonical: "/visualize",
  },
  openGraph: {
    title: "Charts | AI Capital Tracker",
    description:
      "Capex against revenue, frontier lab multiples, token price deflation and credit spreads, drawn from the published dataset.",
    url: "/visualize",
    type: "website",
  },
};

export default function VisualizeLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}