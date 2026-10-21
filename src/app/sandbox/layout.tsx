import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI bubble simulator — test your own numbers and scenarios",
  description:
    "Adjust interest rates, AI spending, debt levels, and chip costs to see how the 12-month bubble probability changes.",
  keywords: [
    "AI bubble simulator",
    "macro stress testing",
    "Treasury yield sensitivity",
    "debt share scenario",
    "Minsky fragility model",
    "Shiller CAPE",
    "Monte Carlo tail risk",
  ],
  alternates: {
    canonical: "/sandbox",
  },
  openGraph: {
    title: "AI bubble simulator — test your own numbers and scenarios",
    description:
      "Adjust interest rates, AI spending, debt levels, and chip costs to see how the 12-month bubble probability changes.",
    url: "/sandbox",
    type: "website",
  },
};

export default function SandboxLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}