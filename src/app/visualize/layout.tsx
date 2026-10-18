import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Visual Charts & Bubble Dynamics — Sensitivity Curves, Capex Gap & Multiples",
  description:
    "Interactive quantitative visualizations of the AI capital bubble: nonlinear burst probability sensitivity curves, hyperscaler capex vs enterprise revenue gap, capital composition distributions, and AI lab valuation multiples.",
  keywords: [
    "AI bubble charts",
    "AI capex gap visualization",
    "hyperscaler capex chart",
    "OpenAI valuation multiple",
    "Anthropic revenue multiple",
    "AI sensitivity curves",
    "GPU depreciation risk chart",
    "AI credit contagion visualizer",
  ],
  alternates: {
    canonical: "/visualize",
  },
  openGraph: {
    title: "Visual Charts & Bubble Dynamics | AI Capital Tracker",
    description:
      "Explore nonlinear sensitivity curves, capex gap trajectories, and lab multiple compression charts tracking systemic AI infrastructure risk.",
    url: "/visualize",
    type: "website",
  },
};

export default function VisualizeLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
