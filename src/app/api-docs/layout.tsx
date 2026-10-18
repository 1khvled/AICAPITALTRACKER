import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Institutional REST API Documentation — Real-time AI Risk & Deal Feeds",
  description:
    "Institutional programmatic API endpoints for real-time model outputs, 159-deal infrastructure ledger, 8 diagnostic stress factors, live market monitoring, and research wire feeds.",
  keywords: [
    "AI capital tracker API",
    "AI credit risk API",
    "datacenter financing API",
    "GPU debt database API",
    "AI bubble index endpoint",
    "REST API AI infrastructure",
    "algorithmic finance AI data",
  ],
  alternates: {
    canonical: "/api-docs",
  },
  openGraph: {
    title: "Institutional REST API Documentation | AI Capital Tracker",
    description:
      "Programmatic REST API documentation for real-time AI risk factors, deal flow data, macroeconomic sensitivities, and live research feeds.",
    url: "/api-docs",
    type: "website",
  },
};

export default function ApiDocsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
