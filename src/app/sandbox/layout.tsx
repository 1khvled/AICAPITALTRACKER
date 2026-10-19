import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sandbox — stress the model with your own inputs",
  description:
    "Move the interest rates, capex, debt share and token deflation sliders and watch the 12-month burst probability move, with the Monte Carlo tail risk beside it.",
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
    title: "Sensitivity sandbox | AI Capital Tracker",
    description:
      "Stress the model with your own macro inputs and see the probability and the tail risk move together.",
    url: "/sandbox",
    type: "website",
  },
};

export default function SandboxLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}