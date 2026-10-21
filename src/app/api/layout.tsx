import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI data API endpoints — model output, debt ledger and dispatches",
  description:
    "Five free public JSON endpoints for live AI bubble probabilities, verified debt deals, and research dispatches.",
  alternates: { canonical: "/api" },
  openGraph: {
    title: "AI data API endpoints — model output, debt ledger and dispatches",
    description:
      "Five free public JSON endpoints for live AI bubble probabilities, verified debt deals, and research dispatches.",
    url: "/api",
    type: "website",
  },
};

export default function ApiLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}