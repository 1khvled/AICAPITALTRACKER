import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, TrendingUp, AlertTriangle, ShieldCheck, Percent, DollarSign, Activity } from "lucide-react";
import { AnswerPageLayout } from "@/components/answer-pages/AnswerPageLayout";
import { evaluateBubbleModel, DEFAULT_MODEL_INPUTS } from "@/lib/model/engine";
import { formatBillions, formatAsOf } from "@/components/home/copy";
import trajectoryHistory from "@/data/trajectory-history.json";
import { POLYMARKET_REFERRAL_CODE } from "@/data/polymarket-data";

export const metadata: Metadata = {
  title: "What is CPI doing to AI?",
  description:
    "CPI inflation at 3.72% keeps Treasury yields at 5.10%, increasing borrowing costs on $214.9B in debt and driving 12% of the AI risk model.",
  openGraph: {
    title: "What is CPI doing to AI?",
    description:
      "CPI inflation at 3.72% keeps Treasury yields at 5.10%, increasing borrowing costs on $214.9B in debt and driving 12% of the AI risk model.",
    url: "/what-is-cpi-doing-to-ai",
    type: "article",
    images: ["/opengraph-image.png"],
  },
  alternates: {
    canonical: "/what-is-cpi-doing-to-ai",
  },
};

interface TrajectoryPointLite {
  date?: string;
}

export default function WhatIsCpiDoingToAiPage() {
  const result = evaluateBubbleModel(DEFAULT_MODEL_INPUTS);
  const history = (Array.isArray(trajectoryHistory) ? trajectoryHistory : []) as TrajectoryPointLite[];
  const latestPoint = history[history.length - 1];
  const asOf = latestPoint?.date ? formatAsOf(latestPoint.date) : "21 Oct 2026";

  const macro = DEFAULT_MODEL_INPUTS.macro ?? {
    us10yYieldPct: 5.10,
    us10yBaselinePct: 3.75,
    cpiInflationYoY: 3.72,
    realYield10y: 2.75,
    fedFundsRatePct: 3.75,
    highYieldSpreadBps: 323,
    note: "FRED St. Louis Verified",
  };

  const totalDebtUsd = DEFAULT_MODEL_INPUTS.aiDebt?.totalTrackedDebtUsd ?? 214_890_400_000;
  const totalDebtDisplay = formatBillions(totalDebtUsd);

  // Model contribution for interest rates & macro
  const macroFactor = result.contributions.find((c) => c.id === "macro_rates");
  const macroWeightPct = macroFactor?.weightPct ?? 12;
  const macroEarnedPoints = macroFactor?.earnedPoints ?? 8.4;

  const polymarketContracts = [
    {
      question: "Will the US declare an economic recession before end of 2026?",
      probabilityPct: 7.0,
      volumeDisplay: "$2.3M",
      url: `https://polymarket.com/event/us-recession-by-end-of-2026?r=${POLYMARKET_REFERRAL_CODE}`,
    },
    {
      question: "Will the AI bubble burst before June 2027?",
      probabilityPct: 19.5,
      volumeDisplay: "$9.2M",
      url: `https://polymarket.com/event/ai-bubble-burst-by?r=${POLYMARKET_REFERRAL_CODE}`,
    },
    {
      question: "Will Oracle 5Y CDS trade above 250 bps before December 31, 2026?",
      probabilityPct: 38.0,
      volumeDisplay: "$1.4M",
      url: `https://polymarket.com/event/oracle-debt-ai-capex-stress?r=${POLYMARKET_REFERRAL_CODE}`,
    },
  ];

  // Interest rate sensitivity computations
  const rateScenarios = [
    { ratePct: 3.0, label: "3.0% (Historical Low)", desc: "Zero-rate era benchmark before 2022 inflation shock" },
    { ratePct: 5.0, label: "5.0% (Current Prime / IG)", desc: "Current investment-grade coupon baseline for tech anchors" },
    { ratePct: 7.0, label: "7.0% (Neocloud & Private Debt)", desc: "Private credit facilities collateralized by GPU clusters" },
    { ratePct: 9.0, label: "9.0% (Distressed Refinancing)", desc: "Stress rollover rate if credit spreads widen by 200bp" },
  ];

  return (
    <AnswerPageLayout
      question="What is CPI doing to AI?"
      categoryLabel="Macro & Inflation"
      asOf={asOf}
      answerLead={`Headline Consumer Price Index (CPI) inflation—currently running at ${macro.cpiInflationYoY.toFixed(2)}% year-over-year—forces benchmark 10-year Treasury yields to remain elevated at ${macro.us10yYieldPct.toFixed(2)}%, directly increasing annual interest burdens across ${totalDebtDisplay} in AI corporate debt and accounting for ${macroWeightPct}% of our model's risk score.`}
      answerContext={`When inflation stays above the Federal Reserve's 2.0% target, central bankers cannot cut interest rates aggressively. Because AI data centers require hundreds of billions of dollars upfront with payoff windows 3 to 7 years in the future, high interest rates raise the cost of borrowed money and compress long-dated tech equity valuations.`}
      polymarketContracts={polymarketContracts}
      notThisItems={[
        "It is not a forecast of the next monthly BLS Consumer Price Index release or an editorial opinion on Federal Reserve monetary policy.",
        "It does not claim AI software is incapable of generating productivity gains; it measures the financial drag that higher bond yields impose on capital-intensive hardware construction.",
        "It is not an equity market-timing indicator; it evaluates how persistent inflation transmits through credit default swaps and corporate bond coupons.",
      ]}
    >
      {/* ── Key Metrics Summary Tiles ───────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="card p-4 space-y-1">
          <span className="label">Headline CPI (YoY)</span>
          <p className="num text-2xl font-bold text-risk-600 dark:text-risk-400">
            +{macro.cpiInflationYoY.toFixed(2)}%
          </p>
          <span className="text-[13px] text-ink-subtle">FRED CPIAUCSL print</span>
        </div>
        <div className="card p-4 space-y-1">
          <span className="label">US 10-Year Yield</span>
          <p className="num text-2xl font-bold text-ink">
            {macro.us10yYieldPct.toFixed(2)}%
          </p>
          <span className="text-[13px] text-ink-subtle">vs. {macro.us10yBaselinePct.toFixed(2)}% baseline</span>
        </div>
        <div className="card p-4 space-y-1">
          <span className="label">10-Year Real Yield</span>
          <p className="num text-2xl font-bold text-ink">
            +{macro.realYield10y.toFixed(2)}%
          </p>
          <span className="text-[13px] text-ink-subtle">TIPS benchmark hurdle</span>
        </div>
        <div className="card p-4 space-y-1">
          <span className="label">Factor Contribution</span>
          <p className="num text-2xl font-bold text-accent-strong dark:text-accent-ink">
            +{macroEarnedPoints.toFixed(1)} pts
          </p>
          <span className="text-[13px] text-ink-subtle">{macroWeightPct}% of bubble model</span>
        </div>
      </div>

      {/* ── Section 1: The Inflation-to-AI Transmission Diagram ────────────── */}
      <section aria-labelledby="transmission-heading" className="card p-5 space-y-4 shadow-card">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-rule pb-3">
          <div>
            <h2 id="transmission-heading" className="text-lg font-bold tracking-tight text-ink">
              The Transmission Chain: How Inflation Hits AI
            </h2>
            <p className="mt-0.5 text-[14px] text-ink-muted">
              Why consumer price inflation directly impacts chip orders and data center loans.
            </p>
          </div>
          <Link
            href="/methodology"
            className="inline-flex min-h-[44px] items-center gap-1 text-[13px] font-medium text-ink underline decoration-rule underline-offset-4 hover:decoration-ink"
          >
            Factor formula in methodology
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </div>

        {/* Transmission Steps */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
          <div className="panel p-3.5 space-y-2 border-l-2 border-l-risk-500">
            <div className="flex items-center justify-between">
              <span className="num font-bold text-[13px] text-risk-600 dark:text-risk-400">Step 1</span>
              <Percent className="h-4 w-4 text-risk-500" aria-hidden="true" />
            </div>
            <h3 className="font-semibold text-ink text-[14px]">High CPI Print (+3.72%)</h3>
            <p className="text-[13px] text-ink-muted leading-relaxed">
              Elevated inflation prevents the Federal Reserve from slashing interest rates back to zero or low neutral levels.
            </p>
          </div>

          <div className="panel p-3.5 space-y-2 border-l-2 border-l-caution-500">
            <div className="flex items-center justify-between">
              <span className="num font-bold text-[13px] text-caution-600 dark:text-caution-400">Step 2</span>
              <Activity className="h-4 w-4 text-caution-500" aria-hidden="true" />
            </div>
            <h3 className="font-semibold text-ink text-[14px]">Bond Yields Stay High (5.10%)</h3>
            <p className="text-[13px] text-ink-muted leading-relaxed">
              Investors demand higher yields on Treasuries, raising benchmark discount rates across all risk assets.
            </p>
          </div>

          <div className="panel p-3.5 space-y-2 border-l-2 border-l-ink">
            <div className="flex items-center justify-between">
              <span className="num font-bold text-[13px] text-ink">Step 3</span>
              <DollarSign className="h-4 w-4 text-ink-muted" aria-hidden="true" />
            </div>
            <h3 className="font-semibold text-ink text-[14px]">Debt Service Expands</h3>
            <p className="text-[13px] text-ink-muted leading-relaxed">
              Borrowing on {totalDebtDisplay} in AI debt requires billions in higher annual interest payments instead of chip R&amp;D.
            </p>
          </div>

          <div className="panel p-3.5 space-y-2 border-l-2 border-l-accent-strong dark:border-l-accent-ink">
            <div className="flex items-center justify-between">
              <span className="num font-bold text-[13px] text-accent-strong dark:text-accent-ink">Step 4</span>
              <TrendingUp className="h-4 w-4 text-accent-strong dark:text-accent-ink" aria-hidden="true" />
            </div>
            <h3 className="font-semibold text-ink text-[14px]">Valuations Compress</h3>
            <p className="text-[13px] text-ink-muted leading-relaxed">
              Higher discount rates shrink price-to-sales multiples from 50× to 24×, raising equity dilution for startup funding.
            </p>
          </div>
        </div>
      </section>

      {/* ── Section 2: Interest Expense Drag Sensitivity Table ──────────────── */}
      <section aria-labelledby="sensitivity-heading" className="card p-5 space-y-4 shadow-card">
        <div className="border-b border-rule pb-3">
          <h2 id="sensitivity-heading" className="text-lg font-bold tracking-tight text-ink">
            The Interest Drag: Annual Debt Service at Different Rates
          </h2>
          <p className="mt-0.5 text-[14px] text-ink-muted">
            Annual interest expense calculated dynamically against the verified {totalDebtDisplay} corporate debt stock.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-[14px]">
            <caption className="sr-only">
              Annual interest payment burden on {totalDebtDisplay} in AI corporate debt across four interest rate scenarios
            </caption>
            <thead>
              <tr className="border-b border-rule text-ink-subtle">
                <th scope="col" className="py-2.5 pr-4 font-semibold">Coupon Rate Scenario</th>
                <th scope="col" className="py-2.5 pr-4 font-semibold text-right">Effective Rate</th>
                <th scope="col" className="py-2.5 pr-4 font-semibold text-right">Annual Interest Bill</th>
                <th scope="col" className="py-2.5 font-semibold">Real-World Context</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rule font-tabular">
              {rateScenarios.map((sc) => {
                const annualInterestUsd = totalDebtUsd * (sc.ratePct / 100);
                const isBaseline = sc.ratePct === 5.0;

                return (
                  <tr
                    key={sc.ratePct}
                    className={`hover:bg-surface-2 transition-colors ${isBaseline ? "bg-surface-2" : ""}`}
                  >
                    <th scope="row" className={`py-3 pr-4 font-medium ${isBaseline ? "font-bold text-ink" : "text-ink"}`}>
                      {sc.label}
                    </th>
                    <td className="py-3 pr-4 num text-right text-ink-muted font-mono font-semibold">
                      {sc.ratePct.toFixed(1)}%
                    </td>
                    <td className={`py-3 pr-4 num text-right font-mono font-bold ${isBaseline ? "text-accent-strong dark:text-accent-ink" : "text-ink"}`}>
                      {formatBillions(annualInterestUsd)}/yr
                    </td>
                    <td className="py-3 text-[13px] text-ink-muted">
                      {sc.desc}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── Section 3: The Model's Factor Weight Breakdown ──────────────────── */}
      <section aria-labelledby="weights-heading" className="panel p-5 space-y-4 rule-accent-left">
        <div>
          <h2 id="weights-heading" className="text-lg font-bold tracking-tight text-ink">
            How the Model Scores Macro Rates (Factor Weight: {macroWeightPct}%)
          </h2>
          <p className="mt-1 text-[15px] leading-relaxed text-ink-muted">
            The model does not rely on subjective economic forecasts. Factor <code className="font-mono text-ink">macro_rates</code> evaluates four objective market indicators to produce its {macroEarnedPoints.toFixed(1)} point contribution:
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 text-[14px]">
          <div className="card p-3.5 space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-ink">1. 10-Year US Treasury Yield</span>
              <span className="chip chip-steel text-[13px]">40% sub-weight</span>
            </div>
            <p className="num text-ink-muted">
              Current reading: <strong className="text-ink">{macro.us10yYieldPct.toFixed(2)}%</strong> (ramps from {macro.us10yBaselinePct.toFixed(2)}% baseline to 5.25% stress ceiling).
            </p>
          </div>

          <div className="card p-3.5 space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-ink">2. Headline CPI Inflation (YoY)</span>
              <span className="chip chip-steel text-[13px]">25% sub-weight</span>
            </div>
            <p className="num text-ink-muted">
              Current reading: <strong className="text-ink">+{macro.cpiInflationYoY.toFixed(2)}%</strong> (ramps from 2.0% central bank target to 4.5% persistent inflation).
            </p>
          </div>

          <div className="card p-3.5 space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-ink">3. 10-Year Real Yield (TIPS)</span>
              <span className="chip chip-steel text-[13px]">15% sub-weight</span>
            </div>
            <p className="num text-ink-muted">
              Current reading: <strong className="text-ink">+{macro.realYield10y.toFixed(2)}%</strong> (ramps from 1.5% neutral to 3.0% acute capital scarcity).
            </p>
          </div>

          <div className="card p-3.5 space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-ink">4. US High-Yield OAS Spread</span>
              <span className="chip chip-steel text-[13px]">20% sub-weight</span>
            </div>
            <p className="num text-ink-muted">
              Current reading: <strong className="text-ink">{macro.highYieldSpreadBps} bps</strong> (ramps from 250 bps calm to 500 bps credit market freeze).
            </p>
          </div>
        </div>
      </section>
    </AnswerPageLayout>
  );
}
