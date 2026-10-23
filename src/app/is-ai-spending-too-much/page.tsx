import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, AlertTriangle } from "lucide-react";
import { AnswerPageLayout } from "@/components/answer-pages/AnswerPageLayout";
import { evaluateBubbleModel, DEFAULT_MODEL_INPUTS } from "@/lib/model/engine";
import { formatBillions, formatAsOf } from "@/components/home/copy";
import { resolveContracts } from "@/components/answer-pages/answerData";
import trajectoryHistory from "@/data/trajectory-history.json";

/** The numbers in the metadata are the model's own inputs. */
export function generateMetadata(): Metadata {
  const capex = DEFAULT_MODEL_INPUTS.capex?.aggregateCapexUsd ?? 0;
  const fcf = DEFAULT_MODEL_INPUTS.capex?.aggregateFcfUsd ?? 0;
  const gap = capex - fcf;
  const description = `Big Tech is spending $${(capex / 1e9).toFixed(0)}B on 2026 capex against $${(
    fcf / 1e9
  ).toFixed(0)}B in free cash flow, creating a $${(gap / 1e9).toFixed(0)}B funding gap backed by corporate borrowing.`;

  return {
    title: "Is AI spending too much?",
    description,
    openGraph: {
      title: "Is AI spending too much?",
      description,
      url: "/is-ai-spending-too-much",
      type: "article",
      images: ["/opengraph-image.png"],
    },
    alternates: {
      canonical: "/is-ai-spending-too-much",
    },
  };
}

interface TrajectoryPointLite {
  date?: string;
}

export default function IsAiSpendingTooMuchPage() {
  const result = evaluateBubbleModel(DEFAULT_MODEL_INPUTS);
  const history = (Array.isArray(trajectoryHistory) ? trajectoryHistory : []) as TrajectoryPointLite[];
  const latestPoint = history[history.length - 1];
  const asOf = latestPoint?.date ? formatAsOf(latestPoint.date) : "21 Oct 2026";

  const capexUsd = DEFAULT_MODEL_INPUTS.capex?.aggregateCapexUsd ?? 0;
  const fcfUsd = DEFAULT_MODEL_INPUTS.capex?.aggregateFcfUsd ?? 0;
  const fundingGapUsd = capexUsd - fcfUsd;
  const capexToFcfRatio = (capexUsd / fcfUsd).toFixed(2);

  const capexDisplay = formatBillions(capexUsd);
  const fcfDisplay = formatBillions(fcfUsd);
  const gapDisplay = formatBillions(fundingGapUsd);

  // Combined revenue run-rate across the tracked labs and AI software companies —
  // summed from the model inputs, never typed.
  const labRunRateUsd = (DEFAULT_MODEL_INPUTS.valuations || []).reduce(
    (sum, v) => sum + ((v.runRateRevenueUsd as number) || 0),
    0,
  );
  const labRunRateDisplay = formatBillions(labRunRateUsd);

  // How many dollars of build-out there is for every dollar of software revenue.
  const spendPerRevenueDollar = labRunRateUsd > 0 ? capexUsd / labRunRateUsd : 0;

  const totalDebtUsd = DEFAULT_MODEL_INPUTS.aiDebt?.totalTrackedDebtUsd ?? 0;
  const totalDebtDisplay = formatBillions(totalDebtUsd);

  // The annual interest bill if the gap itself had to be borrowed at today's
  // long government yield.
  const tenYearYieldPct = DEFAULT_MODEL_INPUTS.macro?.us10yYieldPct ?? 0;
  const gapInterestUsd = fundingGapUsd * (tenYearYieldPct / 100);

  // The depreciation drag the model carries on the tracked chip fleet.
  const depreciationDragUsd = DEFAULT_MODEL_INPUTS.aiDebt?.gpuDepreciationDragUsd ?? 0;

  const polymarketContracts = resolveContracts([
    "poly-bubble-2026",
    "poly-bubble-2027",
    "poly-us-recession-2026",
  ]);

  // Capex comparison column data
  const comparisonData = [
    {
      label: "Big-4 Capex",
      sublabel: "2026 guidance",
      amountUsd: capexUsd,
      display: capexDisplay,
      color: "var(--c-accent)",
    },
    {
      label: "Big-4 Cash",
      sublabel: "free cash flow",
      amountUsd: fcfUsd,
      display: fcfDisplay,
      color: "var(--c-cat-steel)",
    },
    {
      label: "AI Software",
      sublabel: "annual run-rate",
      amountUsd: labRunRateUsd,
      display: labRunRateDisplay,
      color: "var(--c-cat-navy)",
    },
  ];

  const colSvgWidth = 520;
  const colSvgHeight = 180;
  const maxAmount = capexUsd;

  return (
    <AnswerPageLayout
      question="Is AI spending too much?"
      categoryLabel="Capital Expenditure"
      asOf={asOf}
      answerLead={`Yes. Amazon, Alphabet, Microsoft and Meta are spending ${capexDisplay} on 2026 capital expenditures (hardware and data centres) against ${fcfDisplay} in annual free cash flow (the cash left after running and maintaining the existing business) — an annual funding gap of ${gapDisplay}.`}
      answerContext={`While Big Tech generates real cash from its existing businesses in search, cloud hosting and digital advertising, total generative AI software revenue across the labs we track stands at about ${labRunRateDisplay} a year. The sector is spending about ${spendPerRevenueDollar.toFixed(
        1,
      )} dollars on hardware and data centres for every dollar that commercial AI software earns.`}
      polymarketContracts={polymarketContracts}
      notThisItems={[
        "It does not claim that artificial intelligence is technically flawed or useless; it measures whether physical construction costs are running ahead of verified software cash flows.",
        "It is not a prediction that Microsoft, Alphabet, Amazon, or Meta will default; their balance sheets hold fortress cash reserves and investment-grade credit ratings.",
        "It evaluates the vulnerability of specialized GPU cloud providers (neoclouds) and debt-backed infrastructure vehicles that lack Big Tech's legacy cash flow cushions.",
        "It is not a verdict on the technology. A company can be over-spending and still be right about the market — this page is about who pays for the gap and when.",
      ]}
    >
      {/* ── Key Metrics Summary Tiles ───────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="card p-4 space-y-1">
          <span className="label">Big-4 2026 Capex</span>
          <p className="num text-2xl font-bold text-ink">{capexDisplay}</p>
          <span className="text-[13px] text-ink-subtle">CY2026 corporate guidance</span>
        </div>
        <div className="card p-4 space-y-1">
          <span className="label">Free Cash Flow</span>
          <p className="num text-2xl font-bold text-ink">{fcfDisplay}</p>
          <span className="text-[13px] text-ink-subtle">Trailing cash cushion</span>
        </div>
        <div className="card p-4 space-y-1">
          <span className="label">Annual Deficit</span>
          <p className="num text-2xl font-bold text-risk-600 dark:text-risk-400">{gapDisplay}</p>
          <span className="text-[13px] text-ink-subtle">{capexToFcfRatio}× capex/cash ratio</span>
        </div>
        <div className="card p-4 space-y-1">
          <span className="label">12-Mo Burst Risk</span>
          <p className="num text-2xl font-bold text-accent-strong dark:text-accent-ink">
            {result.burstProbability.toFixed(1)}%
          </p>
          <span className="text-[13px] text-ink-subtle">From credit &amp; cash flows</span>
        </div>
      </div>

      {/* ── Section 1: The Spending vs. Cash Flow Gap Chart ─────────────────── */}
      <section aria-labelledby="gap-chart-heading" className="card p-5 space-y-4 shadow-card">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-rule pb-3">
          <div>
            <h2 id="gap-chart-heading" className="text-lg font-bold tracking-tight text-ink">
              The {gapDisplay} gap: spending vs. revenue realities
            </h2>
            <p className="mt-0.5 text-[14px] text-ink-muted">
              Comparing 2026 guided capital expenditure against free cash flow and AI revenues.
            </p>
          </div>
          <Link
            href="/how-much-is-being-spent-on-ai"
            className="inline-flex min-h-[44px] items-center gap-1 text-[13px] font-medium text-ink underline decoration-rule underline-offset-4 hover:decoration-ink"
          >
            All tracked AI spending
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </div>

        {/* SVG Column Chart */}
        <div
          role="img"
          aria-labelledby="col-chart-title"
          aria-describedby="col-chart-desc"
          className="overflow-x-auto"
        >
          <p id="col-chart-title" className="sr-only">
            Comparison of Big-4 capex, free cash flow, and generative AI revenues
          </p>
          <p id="col-chart-desc" className="sr-only">
            Chart showing {capexDisplay} in 2026 capex, {fcfDisplay} in free cash flow, and{" "}
            {labRunRateDisplay} in AI software revenues, highlighting a {gapDisplay} capital gap.
          </p>

          <svg
            viewBox={`0 0 ${colSvgWidth} ${colSvgHeight}`}
            className="w-full h-auto select-none min-w-[490px]"
            aria-hidden="true"
          >
            {comparisonData.map((d, i) => {
              const barW = 68;
              const spacing = 145;
              const x = 50 + i * spacing;
              const barH = Math.max(8, (d.amountUsd / maxAmount) * 115);
              const y = colSvgHeight - 35 - barH;

              return (
                <g key={d.label}>
                  <rect
                    x={x}
                    y={y}
                    width={barW}
                    height={barH}
                    rx={4}
                    fill={d.color}
                  />
                  <text
                    x={x + barW / 2}
                    y={y - 8}
                    textAnchor="middle"
                    className="num font-mono text-[13px] font-bold fill-ink"
                  >
                    {d.display}
                  </text>
                  <text
                    x={x + barW / 2}
                    y={colSvgHeight - 16}
                    textAnchor="middle"
                    className="text-[13px] font-semibold fill-ink"
                  >
                    {d.label}
                  </text>
                  <text
                    x={x + barW / 2}
                    y={colSvgHeight - 4}
                    textAnchor="middle"
                    className="text-[13px] fill-ink-muted"
                  >
                    {d.sublabel}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Accessible Table Fallback */}
        <div className="sr-only">
          <table>
            <caption>Capital expenditure vs free cash flow and software revenues</caption>
            <thead>
              <tr>
                <th scope="col">Category</th>
                <th scope="col">Disclosed Total</th>
              </tr>
            </thead>
            <tbody>
              {comparisonData.map((d) => (
                <tr key={d.label}>
                  <th scope="row">{d.label}</th>
                  <td>{d.display}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── Section 2: Who Pays for the Gap ─────────────────────────────────── */}
      <section aria-labelledby="gap-funding-heading" className="card p-5 space-y-4 shadow-card">
        <div className="border-b border-rule pb-3">
          <h2 id="gap-funding-heading" className="text-lg font-bold tracking-tight text-ink">
            Who pays for the {gapDisplay} gap
          </h2>
          <p className="mt-0.5 text-[14px] text-ink-muted">
            Computed from the same inputs as the model, so the arithmetic on this page and the score
            behind the homepage can never disagree.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="panel p-4 space-y-1">
            <span className="font-semibold text-ink text-[15px]">Big Tech cash cushions it</span>
            <p className="num text-[13px] font-bold text-ink">
              {capexToFcfRatio}× spending to cash
            </p>
            <p className="text-[13px] text-ink-muted leading-relaxed">
              The four largest cloud companies still earn {fcfDisplay} a year from their existing
              businesses, which covers {((fcfUsd / capexUsd) * 100).toFixed(0)}% of the build-out.
              That is why the gap has not become a crisis.
            </p>
          </div>
          <div className="panel p-4 space-y-1">
            <span className="font-semibold text-ink text-[15px]">The gap costs interest</span>
            <p className="num text-[13px] font-bold text-risk-600 dark:text-risk-400">
              {formatBillions(gapInterestUsd)}/yr at {tenYearYieldPct.toFixed(2)}%
            </p>
            <p className="text-[13px] text-ink-muted leading-relaxed">
              If the whole gap were borrowed at today&rsquo;s 10-year government yield, the annual
              interest bill would be {formatBillions(gapInterestUsd)} before a single chip is bought.
            </p>
          </div>
          <div className="panel p-4 space-y-1">
            <span className="font-semibold text-ink text-[15px]">Specialised lenders carry it</span>
            <p className="num text-[13px] font-bold text-ink">{totalDebtDisplay} tracked</p>
            <p className="text-[13px] text-ink-muted leading-relaxed">
              GPU cloud providers and data-centre vehicles without Big Tech&rsquo;s legacy cash flow
              borrow against the hardware instead. That is the {totalDebtDisplay} of AI debt on the
              debt page.
            </p>
          </div>
          <div className="panel p-4 space-y-1">
            <span className="font-semibold text-ink text-[15px]">Software has to catch up</span>
            <p className="num text-[13px] font-bold text-ink">
              {spendPerRevenueDollar.toFixed(1)}× today
            </p>
            <p className="text-[13px] text-ink-muted leading-relaxed">
              For every dollar of annual AI software revenue across the labs we track, the sector is
              building {spendPerRevenueDollar.toFixed(1)} dollars of hardware and data centres.
            </p>
          </div>
        </div>
      </section>

      {/* ── Section 3: The Depreciation Trap Table ──────────────────────────── */}
      <section aria-labelledby="depreciation-heading" className="panel p-5 space-y-4 rule-accent-left">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-accent-strong dark:text-accent-ink shrink-0" aria-hidden="true" />
          <h2 id="depreciation-heading" className="text-lg font-bold tracking-tight text-ink">
            The depreciation trap: silicon lifespans vs. multi-year loans
          </h2>
        </div>

        <div className="space-y-3 text-[15px] leading-relaxed text-ink-muted">
          <p>
            When corporations borrow hundreds of billions to construct factories or railways, those
            physical assets produce economic value for decades.
          </p>
          <p>
            <strong className="text-ink font-semibold">AI computing infrastructure depreciates
            rapidly:</strong> an Nvidia Blackwell or H100 GPU cluster loses most of its economic value
            within a few years, because a newer generation of chips arrives before the loan that
            secured it matures. The model carries an annual write-down of{" "}
            {formatBillions(depreciationDragUsd)} on the tracked chip fleet for exactly this reason.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 text-[14px]">
          <div className="card p-3.5 space-y-1">
            <span className="font-semibold text-ink">GPU Silicon Fleets</span>
            <p className="num text-[13px] text-risk-600 dark:text-risk-400 font-bold">
              {formatBillions(depreciationDragUsd)}/yr drag
            </p>
            <p className="text-[13px] text-ink-muted">
              The collateral. Worth a fraction of its purchase price before the loan matures.
            </p>
          </div>
          <div className="card p-3.5 space-y-1">
            <span className="font-semibold text-ink">Power &amp; Transformers</span>
            <p className="num text-[13px] text-caution-600 dark:text-caution-400 font-bold">
              Durable value
            </p>
            <p className="text-[13px] text-ink-muted">
              Utility interconnects and substations hold their value over decades, whatever the
              chips do.
            </p>
          </div>
          <div className="card p-3.5 space-y-1">
            <span className="font-semibold text-ink">Building Shells &amp; Fiber</span>
            <p className="num text-[13px] text-ink font-bold">Residual value</p>
            <p className="text-[13px] text-ink-muted">
              Real estate shells keep their value even if the computing tenants in them churn.
            </p>
          </div>
        </div>
      </section>
    </AnswerPageLayout>
  );
}
