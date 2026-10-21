import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI data API — live model output, deal ledger and news feed",
  description:
    "Free public JSON endpoints for live AI bubble probabilities, verified debt deals, and research updates.",
  keywords: [
    "AI capital tracker API",
    "REST API documentation",
    "deal ledger API",
    "model output JSON endpoint",
    "research wire API",
  ],
  alternates: {
    canonical: "/api-docs",
  },
  openGraph: {
    title: "AI data API — live model output, deal ledger and news feed",
    description:
      "Free public JSON endpoints for live AI bubble probabilities, verified debt deals, and research updates.",
    url: "/api-docs",
    type: "website",
  },
};

export default function ApiDocsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}