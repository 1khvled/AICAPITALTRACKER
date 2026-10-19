import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Public REST API",
  description:
    "Read the model output, the deal ledger, the factor weights and the research wire over plain JSON. No key required.",
  alternates: { canonical: "/api" },
  openGraph: {
    title: "Public REST API | AI Capital Tracker",
    description:
      "Five unauthenticated JSON endpoints over the model engine, the deal ledger and the research wire.",
    url: "/api",
    type: "website",
  },
};

export default function ApiLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}