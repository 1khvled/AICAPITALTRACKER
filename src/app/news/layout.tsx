import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI news — funding, debt and data center filings",
  description:
    "Daily verified news and filings on AI borrowing, chip purchases, and data center infrastructure.",
  alternates: {
    canonical: "/news",
  },
  openGraph: {
    title: "AI news — funding, debt and data center filings",
    description:
      "Daily verified news and filings on AI borrowing, chip purchases, and data center infrastructure.",
    url: "/news",
    type: "website",
  },
};

export default function NewsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}