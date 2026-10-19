import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "API reference — model output, deal ledger and research wire",
  description:
    "Five unauthenticated JSON endpoints with their parameters, sample responses and copy-paste cURL, JavaScript and Python snippets.",
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
    title: "API reference | AI Capital Tracker",
    description:
      "Parameters, sample responses and copy-paste snippets for every public JSON endpoint.",
    url: "/api-docs",
    type: "website",
  },
};

export default function ApiDocsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}