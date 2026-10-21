import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Charts — where the AI money is going",
  description:
    "Visual charts tracking AI spending against revenue, chip prices, company valuations, and borrowing costs.",
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
    title: "Charts — where the AI money is going",
    description:
      "Visual charts tracking AI spending against revenue, chip prices, company valuations, and borrowing costs.",
    url: "/visualize",
    type: "website",
  },
};

export default function VisualizeLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}