import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Percent, DollarSign, Activity, TrendingUp } from "lucide-react";
import { AnswerPageLayout } from "@/components/answer-pages/AnswerPageLayout";
import { evaluateBubbleModel, DEFAULT_MODEL_INPUTS } from "@/lib/model/engine";
import { formatBillions, formatAsOf } from "@/components/home/copy";
import {
  macroRampLegs,
  parseLegNumber,
  resolveContracts,
} from "@/components/answer-pages/answerData";
import trajectoryHistory from "@/data/trajectory-history.json";

/** The macro numbers in the metadata are the live FRED prints. */
export function generateMetadata(): Metadata {
  const macro = DEFAULT_MODEL_INPUTS.macro;
  const debtUsd = DEFAULT_MODEL_INPUTS.aiDebt?.totalTrackedDebtUsd ?? 0;
  const description = `CPI inflation at ${(macro?.cpiInflationYoY ?? 0).toFixed(2)}% keeps Treasury yields at ${(
    macro?.us10yYieldPct ?? 0
  ).toFixed(2)}%, increasing borrowing costs on $${(debtUsd / 1e9).toFixed(1)}B in debt and driving the model's largest single risk factor.`;

  return {
    title: "What is CPI doing to AI?",
    description,
    openGraph: {
      title: "What is CPI doing to AI?",
      description,
      url: "/what-is-cpi-doing-to-ai",
      type: "article",
      images: ["/opengraph-image.png"],
    },
    alternates: {
      canonical: "/what-is-cpi-doing-to-ai",
    },
  };
}

interface TrajectoryPointLite {
  date?: string;
}

export default function WhatIsCpiDoingToAiPage() {
  const result = evaluateBubbleModel(DEFAULT_MODEL_INPUTS);
  const history = (Array.isArray(trajectoryHistory) ? trajectoryHistory : []) as TrajectoryPointLite[];
  const latestPoint = history[history.length - 1];
  const asOf = latestPoint?.date ? formatAsOf(latestPoint.date) : "21 Oct 2026";

  const macro = DEFAULT_MODEL_INPUTS.macro ?? {
    us10yYieldPct: 0,
    us10yBaselinePct: 0,
    cpiInflationYoY: 0,
    realYield10y: 0,
    fedFundsRatePct: 0,
    highYieldSpreadBps: 0,
    note: "",
  };

  const totalDebtUsd = DEFAULT_MODEL_INPUTS.aiDebt?.totalTrackedDebtUsd ?? 0;
  const totalDebtDisplay = formatBillions(totalDebtUsd);

  // Model contribution for interest rates & macro
  const macroFactor = result.contributions.find((c) => c.id === "macro_rates");
  const macroWeightPct = macroFactor?.weightPct ?? 0;
  const macroEarnedPoints = macroFactor?.earnedPoints ?? 0;
  const macroIsTopDriver = result.topDriverIds[0] === "macro_rates";

  const polymarketContracts = resolveContracts([
    "poly-us-recession-2026",
    "poly-bubble-2027",
  ]);

  // ── The four legs of the macro factor ────────────────────────────────────
  // The sub-weights and the ramp bounds are read out of the factor's own
  // published formula, so this page can never drift from the engine.
  const legMeta: Record<
    string,
    { plain: string; measures: string; current: number; currentLabel: string }
  > = {
    "US10Y": {
      plain: "10-year government bond yield",
      measures:
        "What the government pays to borrow for ten years. Every risky loan in the economy is priced against it.",
      current: macro.us10yYieldPct,
      currentLabel: `${macro.us10yYieldPct.toFixed(2)}%`,
    },
    "CPI YoY": {
      plain: "Consumer price inflation",
      measures:
        "How fast the prices households pay are rising, year on year. It is what the central bank is trying to bring down.",
      current: macro.cpiInflationYoY,
      currentLabel: `+${macro.cpiInflationYoY.toFixed(2)}%`,
    },
    "Real Yield": {
      plain: "10-year inflation-protected yield",
      measures:
        "The return an investor actually keeps after inflation, measured on TIPS — government bonds whose payments rise with prices.",
      current: macro.realYield10y,
      currentLabel: `+${macro.realYield10y.toFixed(2)}%`,
    },
    "HY Spread": {
      plain: "Junk bond spread",
      measures:
        "The extra interest a risky corporate borrower pays over government bonds. A wider spread means lenders think default is more likely.",
      current: macro.highYieldSpreadBps ?? 0,
      currentLabel: `${macro.highYieldSpreadBps ?? 0}bp`,
    },
  };

  const legs = macroRampLegs()
    .map((leg) => {
      const meta = legMeta[leg.name];
      const low = parseLegNumber(leg.low);
      const high = parseLegNumber(leg.high);
      const current = meta?.current ?? low;
      const span = high - low;
      const positionPct =
        span > 0 ? Math.min(100, Math.max(0, ((current - low) / span) * 100)) : 0;
      return {
        name: leg.name,
        plain: meta?.plain ?? leg.name,
        measures: meta?.measures ?? "",
        weightPct: Math.round(leg.weight),
        lowLabel: leg.low,
        highLabel: leg.high,
        currentLabel: meta?.currentLabel ?? String(current),
        positionPct,
      };
    })
    .filter((leg) => leg.plain);

  // ── Interest rate scenarios ──────────────────────────────────────────────
  const currentYieldPct = macro.us10yYieldPct;
  const rateScenarios = [
    { ratePct: 3.0, label: "3.0% (Historical Low)", desc: "Zero-rate era benchmark before 2022 inflation shock" },
    { ratePct: 5.0, label: "5.0% (Investment-Grade Baseline)", desc: "Typical coupon for a large, credit-worthy borrower" },
    { ratePct: 7.0, label: "7.0% (Neocloud & Private Debt)", desc: "Private credit facilities collateralized by GPU clusters" },
    { ratePct: 9.0, label: "9.0% (Distressed Refinancing)", desc: "Stress rollover rate if credit spreads widen by 200 basis points" },
  ];

  return (
    <AnswerPageLayout
      question="What is CPI doing to AI?"
      categoryLabel="Macro & Inflation"
      asOf={asOf}
      answerLead={`Consumer price inflation — CPI, the average rise in the prices households pay — is running at ${macro.cpiInflationYoY.toFixed(
        2,
      )}% a year, which is holding the 10-year government bond yield at ${macro.us10yYieldPct.toFixed(
        2,
      )}%. That makes the ${totalDebtDisplay} of AI debt more expensive to carry${
        macroIsTopDriver
          ? ", and it is the single largest contributor to today's risk score"
          : ""
      }.`}
      answerContext={`When inflation stays above the Federal Reserve's 2.0% target, central bankers cannot cut interest rates aggressively. Because AI data centers require hundreds of billions of dollars upfront with payoff windows 3 to 7 years in the future, high interest rates raise the cost of borrowed money and compress long-dated tech equity valuations.`}
      polymarketContracts={polymarketContracts}
      notThisItems={[
        "It is not a forecast of the next monthly BLS Consumer Price Index release or an editorial opinion on Federal Reserve monetary policy.",
        "It does not claim AI software is incapable of generating productivity gains; it measures the financial drag that higher bond yields impose on capital-intensive hardware construction.",
        "It is not an equity market-timing indicator; it evaluates how persistent inflation transmits through credit default swaps and corporate bond coupons.",
        "It does not say inflation is what will break the AI build-out. It is one of nine factors, and the model prints how many points each one contributes.",
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
          <span className="text-[13px] text-ink-subtle">
            vs. {macro.us10yBaselinePct.toFixed(2)}% baseline
          </span>
        </div>
        <div className="card p-4 space-y-1">
          <span className="label">10-Year Real Yield</span>
          <p className="num text-2xl font-bold text-ink">
            +{macro.realYield10y.toFixed(2)}%
          </p>
          <span className="text-[13px] text-ink-subtle">TIPS (inflation-protected bond) hurdle</span>
        </div>
        <div className="card p-4 space-y-1">
          <span className="label">Factor Contribution</span>
          <p className="num text-2xl font-bold text-accent-strong dark:text-accent-ink">
            +{macroEarnedPoints.toFixed(1)} pts
          </p>
          <span className="text-[13px] text-ink-subtle">
            {macroWeightPct}% of bubble model
          </span>
        </div>
      </div>

      {/* ── Section 1: The Inflation-to-AI Transmission Diagram ────────────── */}
      <section aria-labelledby="transmission-heading" className="card p-5 space-y-4 shadow-card">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-rule pb-3">
          <div>
            <h2 id="transmission-heading" className="text-lg font-bold tracking-tight text-ink">
              The transmission chain: how inflation reaches AI
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
            <h3 className="font-semibold text-ink text-[14px]">
              High CPI print (+{macro.cpiInflationYoY.toFixed(2)}%)
            </h3>
            <p className="text-[13px] text-ink-muted leading-relaxed">
              Elevated inflation prevents the Federal Reserve from slashing interest rates back to
              zero or low neutral levels.
            </p>
          </div>

          <div className="panel p-3.5 space-y-2 border-l-2 border-l-caution-500">
            <div className="flex items-center justify-between">
              <span className="num font-bold text-[13px] text-caution-600 dark:text-caution-400">Step 2</span>
              <Activity className="h-4 w-4 text-caution-500" aria-hidden="true" />
            </div>
            <h3 className="font-semibold text-ink text-[14px]">
              Bond yields stay high ({macro.us10yYieldPct.toFixed(2)}%)
            </h3>
            <p className="text-[13px] text-ink-muted leading-relaxed">
              Investors demand higher yields on Treasuries, raising benchmark discount rates across
              all risk assets.
            </p>
          </div>

          <div className="panel p-3.5 space-y-2 border-l-2 border-l-ink">
            <div className="flex items-center justify-between">
              <span className="num font-bold text-[13px] text-ink">Step 3</span>
              <DollarSign className="h-4 w-4 text-ink-muted" aria-hidden="true" />
            </div>
            <h3 className="font-semibold text-ink text-[14px]">Debt service expands</h3>
            <p className="text-[13px] text-ink-muted leading-relaxed">
              Borrowing on {totalDebtDisplay} in AI debt requires billions in higher annual interest
              payments instead of chip R&amp;D.
            </p>
          </div>

          <div className="panel p-3.5 space-y-2 border-l-2 border-l-accent-strong dark:border-l-accent-ink">
            <div className="flex items-center justify-between">
              <span className="num font-bold text-[13px] text-accent-strong dark:text-accent-ink">Step 4</span>
              <TrendingUp className="h-4 w-4 text-accent-strong dark:text-accent-ink" aria-hidden="true" />
            </div>
            <h3 className="font-semibold text-ink text-[14px]">Valuations compress</h3>
            <p className="text-[13px] text-ink-muted leading-relaxed">
              Higher discount rates shrink what investors pay for each dollar of a lab&rsquo;s
              revenue &mdash; the price-to-sales multiple &mdash; which raises the cost of the
              equity startups raise to build the same thing.
            </p>
          </div>
        </div>
      </section>

      {/* ── Section 2: Interest Expense Drag Sensitivity Table ──────────────── */}
      <section aria-labelledby="sensitivity-heading" className="card p-5 space-y-4 shadow-card">
        <div className="border-b border-rule pb-3">
          <h2 id="sensitivity-heading" className="text-lg font-bold tracking-tight text-ink">
            The interest drag: annual debt service at different rates
          </h2>
          <p className="mt-0.5 text-[14px] text-ink-muted">
            Annual interest expense calculated dynamically against the verified{" "}
            {totalDebtDisplay} corporate debt stock.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-[14px]">
            <caption className="sr-only">
              Annual interest payment burden on {totalDebtDisplay} in AI corporate debt across four
              interest rate scenarios
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
                const isBaseline = Math.abs(sc.ratePct - currentYieldPct) < 0.25;

                return (
                  <tr
                    key={sc.ratePct}
                    className={`hover:bg-surface-2 transition-colors ${isBaseline ? "bg-surface-2" : ""}`}
                  >
                    <th
                      scope="row"
                      className={`py-3 pr-4 font-medium ${isBaseline ? "font-bold text-ink" : "text-ink"}`}
                    >
                      {sc.label}
                      {isBaseline && (
                        <span className="block text-[13px] font-normal text-ink-subtle">
                          Closest to today&rsquo;s {currentYieldPct.toFixed(2)}% 10-year yield
                        </span>
                      )}
                    </th>
                    <td className="py-3 pr-4 num text-right text-ink-muted font-mono font-semibold">
                      {sc.ratePct.toFixed(1)}%
                    </td>
                    <td
                      className={`py-3 pr-4 num text-right font-mono font-bold ${
                        isBaseline ? "text-accent-strong dark:text-accent-ink" : "text-ink"
                      }`}
                    >
                      {formatBillions(annualInterestUsd)}/yr
                    </td>
                    <td className="py-3 text-[13px] text-ink-muted">{sc.desc}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="text-[13px] leading-relaxed text-ink-faint">
          This is the interest bill if the whole {totalDebtDisplay} refinanced at once. In practice
          only the maturing tranches reprice each year.
        </p>
      </section>

      {/* ── Section 3: The Model's Factor Weight Breakdown ──────────────────── */}
      <section aria-labelledby="weights-heading" className="panel p-5 space-y-4 rule-accent-left">
        <div>
          <h2 id="weights-heading" className="text-lg font-bold tracking-tight text-ink">
            How the model scores macro rates (factor weight: {macroWeightPct}%)
          </h2>
          <p className="mt-1 text-[15px] leading-relaxed text-ink-muted">
            The model does not rely on subjective economic forecasts. The macro factor weighs{" "}
            {legs.length} objective market indicators to produce its{" "}
            {macroEarnedPoints.toFixed(1)} point contribution. Each indicator counts up as it moves
            from its calm level to its stress level:
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 text-[14px]">
          {legs.map((leg) => (
            <div key={leg.name} className="card p-3.5 space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold text-ink">{leg.plain}</span>
                <span className="chip chip-steel num text-[13px]">
                  {leg.weightPct}% of the factor
                </span>
              </div>
              <p className="text-[13px] text-ink-muted leading-relaxed">{leg.measures}</p>
              <p className="num text-[13px] text-ink-muted">
                Today: <strong className="text-ink">{leg.currentLabel}</strong> &middot; counts from{" "}
                {leg.lowLabel} (calm) to {leg.highLabel} (full stress)
              </p>
              <div className="h-1.5 w-full bg-surface-3" aria-hidden="true">
                <div
                  className="h-full bg-caution-600"
                  style={{ width: `${leg.positionPct.toFixed(1)}%` }}
                />
              </div>
              <p className="num text-[12px] text-ink-faint">
                {leg.positionPct.toFixed(0)}% of the way from calm to full stress
              </p>
            </div>
          ))}
        </div>

        <p className="text-[14px] leading-relaxed text-ink-muted">
          A basis point is a hundredth of a percentage point: a 50 basis point move in a bond yield
          is a move of half a percentage point.
        </p>
      </section>
    </AnswerPageLayout>
  );
}
