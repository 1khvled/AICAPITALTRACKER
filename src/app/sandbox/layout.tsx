import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Macro Sensitivity Sandbox — Stress Test US10Y, Capex Spikes & Credit Spreads",
  description:
    "Interactive quantitative stress-testing sandbox. Adjust US10Y treasury yields, core inflation, debt growth rates, circularity dampeners, and hyperscaler capex to observe real-time delta shifts in AI bubble burst probability.",
  keywords: [
    "AI bubble simulator",
    "macro stress testing AI",
    "US10Y yield sensitivity AI",
    "GPU capex simulator",
    "AI credit freeze stress test",
    "hyperscaler debt elasticity",
    "burst probability sandbox",
    "AI financial fragility simulator",
  ],
  alternates: {
    canonical: "/sandbox",
  },
  openGraph: {
    title: "Macro Sensitivity & Stress Sandbox | AI Capital Tracker",
    description:
      "Simulate macro shocks, interest rate shifts, and datacenter debt spikes. Quantify dynamic changes in AI bubble burst probability in real time.",
    url: "/sandbox",
    type: "website",
  },
};

export default function SandboxLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
