import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, AlertTriangle, TrendingUp, CheckCircle2 } from "lucide-react";
import { evaluateBubbleModel, DEFAULT_MODEL_INPUTS } from "@/lib/model/engine";
import { BAND_LABEL, BAND_VERDICT, formatAsOf, factorPlain } from "@/components/home/copy";
import { AnswerPageLayout } from "@/components/answer-pages/AnswerPageLayout";
import { HistorySection } from "@/components/home/HistorySection";
import trajectoryHistory from "@/data/trajectory-history.json";
import rawLiveInputs from "@/data/live-inputs.json";
import { POLYMARKET_REFERRAL_CODE } from "@/data/polymarket-data";

export const metadata: Metadata = {
  title: "Will the AI bubble burst? — 12-month odds and risk score",
  description:
    "The 12-month chance of an AI bubble burst computed from $2.87T in spending, $214.9B in debt, and daily credit market data.",
  openGraph: {
    title: "Will the AI bubble burst? — 12-month odds and risk score",
    description:
      "The 12-month chance of an AI bubble burst computed from $2.87T in spending, $214.9B in debt, and daily credit market data.",
    url: "/will-the-ai-bubble-burst",
    type: "article",
    images: ["/opengraph-image.png"],
  },
  alternates: {
    canonical: "/will-the-ai-bubble-burst",
  },
};

interface TrajectoryPointLite {
  date?: string;
  probability?: number;
  compositeScore?: number;
}

export default function WillTheAiBubbleBurstPage() {
  const result = evaluateBubbleModel(DEFAULT_MODEL_INPUTS);
  const history = (Array.isArray(trajectoryHistory) ? trajectoryHistory : []) as TrajectoryPointLite[];
  const latestPoint = history[history.length - 1];
  const asOf = latestPoint?.date ? formatAsOf(latestPoint.date) : "21 Oct 2026";

  const liveInputs = rawLiveInputs as unknown as {
    crowd?: {
      bubble2026Probability?: number;
      bubble2027Probability?: number;
      volumeUsd?: number;
      markets?: { question: string; yesProbabilityPct: number; volumeUsd: number; referralUrl: string }[];
    };
  };

  const crowd2027Pct = ((liveInputs?.crowd?.bubble2027Probability ?? 0.195) * 100);
  const crowd2026Pct = ((liveInputs?.crowd?.bubble2026Probability ?? 0.0905) * 100);

  const polymarketContracts = [
    {
      question: "Will the AI bubble burst before June 2027?",
      probabilityPct: crowd2027Pct,
      volumeDisplay: `$${((liveInputs?.crowd?.volumeUsd ?? 9181369) / 1e6).toFixed(1)}M`,
      url: `https://polymarket.com/event/ai-bubble-burst-by?r=${POLYMARKET_REFERRAL_CODE}`,
    },
    {
      question: "Will the AI bubble burst before December 2026?",
      probabilityPct: crowd2026Pct,
      volumeDisplay: "$1.8M",
      url: `https://polymarket.com/event/ai-bubble-burst-by?r=${POLYMARKET_REFERRAL_CODE}`,
    },
  ];

  // SVG dimensions for trajectory sparkline
  const svgWidth = 600;
  const svgHeight = 160;
  const padX = 40;
  const padY = 24;

  const validPoints = history.filter((p) => typeof p.probability === "number" && p.date);
  const minProb = 30.0;
  const maxProb = 35.0;
  const rangeProb = maxProb - minProb || 1;

  const getX = (idx: number) =>
    padX + (idx / Math.max(1, validPoints.length - 1)) * (svgWidth - 2 * padX);
  const getY = (val: number) =>
    svgHeight - padY - ((val - minProb) / rangeProb) * (svgHeight - 2 * padY);

  const polylinePoints = validPoints
    .map((pt, i) => `${getX(i).toFixed(1)},${getY(pt.probability ?? 32).toFixed(1)}`)
    .join(" ");

  const riskFactors = result.contributions.filter((c) => c.kind === "risk");
  const damperFactor = result.contributions.find((c) => c.kind === "damper");

  return (
    <AnswerPageLayout
      question="Will the AI bubble burst?"
      categoryLabel="12-Month Outlook"
      asOf={asOf}
      answerLead={`The model calculates a ${result.burstProbability.toFixed(1)}% probability that the artificial intelligence infrastructure boom suffers a sharp contraction or debt crisis within the next 12 months, placing the current risk in the ${BAND_LABEL[result.band].toLowerCase()} category.`}
      answerContext={`In plain English: ${BAND_VERDICT[result.band]} Tech giants like Microsoft, Alphabet, and Amazon have deep pockets and generated $260B in free cash flow, which cushions the spending. However, $214.9B of borrowed debt and historic startup valuations leave little margin for error if real enterprise adoption slows.`}
      polymarketContracts={polymarketContracts}
      notThisItems={[
        "It is not a certainty, market-timing signal, or stock-picking forecast. It calculates the statistical odds of an infrastructure correction from corporate debt and cash flow filings.",
        "It is not an argument that artificial intelligence technology is useless or a fad; it measures whether the current corporate borrowing and hardware build-out can sustain itself without defaults or severe cutbacks.",
        "The published range is an input-sensitivity range (showing how far the score shifts when interest rates or credit default swaps change), not a statistical confidence interval.",
      ]}
    >
      {/* ── The history: the model on resolved episodes, and the money ───── */}
      <HistorySection />

      {/* ── Section 1: Probability Trajectory ───────────────────────────────── */}
      <section aria-labelledby="trajectory-heading" className="card space-y-4 shadow-card">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-rule pb-3">
          <div>
            <h2 id="trajectory-heading" className="text-lg font-bold tracking-tight text-ink">
              90-Day Trajectory: Where the Odds Sit
            </h2>
            <p className="mt-0.5 text-[14px] text-ink-muted">
              Observed daily canonical prints from filed filings and daily credit spreads.
            </p>
          </div>
          <span className="num font-mono text-[17px] font-bold text-accent-strong dark:text-accent-ink">
            {result.burstProbability.toFixed(1)}% today
          </span>
        </div>

        {/* SVG Sparkline */}
        <div
          role="img"
          aria-labelledby="trajectory-chart-title"
          aria-describedby="trajectory-chart-desc"
          className="overflow-x-auto"
        >
          <p id="trajectory-chart-title" className="sr-only">
            12-month burst probability trajectory chart
          </p>
          <p id="trajectory-chart-desc" className="sr-only">
            Chart showing the burst probability moving across recent daily runs from {validPoints[0]?.probability?.toFixed(1)}% to {latestPoint?.probability?.toFixed(1)}%.
          </p>

          <svg
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            className="w-full h-auto select-none overflow-visible"
            aria-hidden="true"
          >
            {/* Horizontal grid lines */}
            <line
              x1={padX}
              y1={getY(31.0)}
              x2={svgWidth - padX}
              y2={getY(31.0)}
              stroke="var(--c-rule)"
              strokeDasharray="2 3"
              strokeWidth="1"
            />
            <line
              x1={padX}
              y1={getY(33.0)}
              x2={svgWidth - padX}
              y2={getY(33.0)}
              stroke="var(--c-rule)"
              strokeDasharray="2 3"
              strokeWidth="1"
            />

            {/* Trajectory path */}
            <polyline
              fill="none"
              stroke="var(--c-accent)"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={polylinePoints}
            />

            {/* Points */}
            {validPoints.map((pt, i) => {
              const cx = getX(i);
              const cy = getY(pt.probability ?? 32);
              const isLatest = i === validPoints.length - 1;

              return (
                <g key={pt.date ?? i}>
                  <circle
                    cx={cx}
                    cy={cy}
                    r={isLatest ? 5 : 3.5}
                    fill={isLatest ? "var(--c-accent)" : "rgb(var(--c-surface))"}
                    stroke="var(--c-accent)"
                    strokeWidth="2"
                  />
                  <text
                    x={cx}
                    y={cy - 10}
                    textAnchor="middle"
                    className="num font-mono text-[12px] font-bold fill-ink"
                  >
                    {pt.probability?.toFixed(1)}%
                  </text>
                  <text
                    x={cx}
                    y={svgHeight - 4}
                    textAnchor="middle"
                    className="num text-[12px] fill-ink-faint"
                  >
                    {pt.date?.slice(5)}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Accessible Table Fallback */}
        <div className="sr-only">
          <table>
            <caption>Observed 12-month burst probability across published dates</caption>
            <thead>
              <tr>
                <th scope="col">Date</th>
                <th scope="col">Probability</th>
                <th scope="col">Composite Score</th>
              </tr>
            </thead>
            <tbody>
              {validPoints.map((p) => (
                <tr key={p.date}>
                  <th scope="row">{p.date}</th>
                  <td>{p.probability?.toFixed(1)}%</td>
                  <td>{p.compositeScore?.toFixed(1) ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── Section 2: What Would Change the Answer (The 9 Factors) ─────────── */}
      <section aria-labelledby="factors-heading" className="space-y-4">
        <div>
          <h2 id="factors-heading" className="text-xl font-bold tracking-tight text-ink sm:text-2xl">
            What Would Change the Answer: The 9 Factors Explained
          </h2>
          <p className="mt-1 text-[15px] leading-relaxed text-ink-muted">
            The model does not rely on intuition. It tracks 8 financial risk factors that push the score up and 1 adoption damper that pulls it down. Here is what each factor measures in plain English:
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {riskFactors.map((factor) => {
            const { short, gloss } = factorPlain(factor.id);
            return (
              <div key={factor.id} className="card p-4 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[15px] font-bold text-ink">{factor.label}</span>
                  <span className="chip chip-risk num font-semibold">
                    +{factor.earnedPoints.toFixed(1)} pts
                  </span>
                </div>
                <p className="text-[14px] font-medium text-ink-muted">{gloss}</p>
                <p className="num text-[13px] text-ink-subtle leading-snug">
                  Current reading: {factor.reading.reading}
                </p>
                <div className="border-t border-rule pt-2 text-[13px] text-ink-faint">
                  Weight: {factor.weightPct}% of model &middot;{" "}
                  <Link href="/methodology" className="underline hover:text-ink">
                    View formula
                  </Link>
                </div>
              </div>
            );
          })}

          {damperFactor && (
            <div className="card p-4 space-y-2 border-l-2 border-l-safe-500">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[15px] font-bold text-ink">{damperFactor.label}</span>
                <span className="chip chip-safe num font-semibold">
                  &minus;{Math.abs(damperFactor.earnedPoints).toFixed(1)} pts
                </span>
              </div>
              <p className="text-[14px] font-medium text-ink-muted">
                Real customer use, token cost declines, and controlled model training costs knock points OFF the score.
              </p>
              <p className="num text-[13px] text-ink-subtle leading-snug">
                Current reading: {damperFactor.reading.reading}
              </p>
              <div className="border-t border-rule pt-2 text-[13px] text-ink-faint">
                Subtracts up to {damperFactor.weightPct} composite points when adoption outpaces capex.
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── Section 3: Sensitivity Table: What Moves the Odds ───────────────── */}
      <section aria-labelledby="sensitivity-heading" className="card p-5 space-y-4 shadow-card">
        <h2 id="sensitivity-heading" className="text-lg font-bold tracking-tight text-ink">
          How Sensitive Is the Probability to Real-World Shocks?
        </h2>
        <p className="text-[15px] text-ink-muted leading-relaxed">
          Because the model is non-linear, a 50-basis-point move in credit costs or a 20% shift in revenue moves the probability by different amounts depending on the current baseline:
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-[14px]">
            <caption className="sr-only">
              Simulated impact of market shocks on the 12-month burst probability
            </caption>
            <thead>
              <tr className="border-b border-rule text-ink-subtle">
                <th scope="col" className="py-2.5 pr-4 font-semibold">Indicator &amp; Shock</th>
                <th scope="col" className="py-2.5 pr-4 font-semibold">Current Level</th>
                <th scope="col" className="py-2.5 pr-4 font-semibold">Impact on Score</th>
                <th scope="col" className="py-2.5 font-semibold">What It Means</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rule font-tabular">
              <tr className="hover:bg-surface-2 transition-colors">
                <th scope="row" className="py-3 pr-4 font-medium text-ink">
                  Oracle 5Y CDS (+50bp)
                </th>
                <td className="py-3 pr-4 num text-ink-muted">288bp</td>
                <td className="py-3 pr-4 num font-semibold text-risk-600 dark:text-risk-400">
                  +3.8% probability
                </td>
                <td className="py-3 text-ink-muted text-[13px]">
                  Higher debt insurance costs for the primary AI anchor raise funding pressure immediately.
                </td>
              </tr>
              <tr className="hover:bg-surface-2 transition-colors">
                <th scope="row" className="py-3 pr-4 font-medium text-ink">
                  High-Yield OAS (+50bp)
                </th>
                <td className="py-3 pr-4 num text-ink-muted">323bp</td>
                <td className="py-3 pr-4 num font-semibold text-risk-600 dark:text-risk-400">
                  +1.2% probability
                </td>
                <td className="py-3 text-ink-muted text-[13px]">
                  Widening spreads make it expensive for second-tier cloud providers to roll over loans.
                </td>
              </tr>
              <tr className="hover:bg-surface-2 transition-colors">
                <th scope="row" className="py-3 pr-4 font-medium text-ink">
                  US 10-Year Yield (+50bp)
                </th>
                <td className="py-3 pr-4 num text-ink-muted">5.10%</td>
                <td className="py-3 pr-4 num font-semibold text-risk-600 dark:text-risk-400">
                  +0.8% probability
                </td>
                <td className="py-3 text-ink-muted text-[13px]">
                  Higher risk-free benchmark discount rates compress long-duration tech valuations.
                </td>
              </tr>
              <tr className="hover:bg-surface-2 transition-colors">
                <th scope="row" className="py-3 pr-4 font-medium text-ink">
                  Lab Revenue (+20%)
                </th>
                <td className="py-3 pr-4 num text-ink-muted">~$125B run-rate</td>
                <td className="py-3 pr-4 num font-semibold text-safe-600 dark:text-safe-400">
                  &minus;2.1% probability
                </td>
                <td className="py-3 text-ink-muted text-[13px]">
                  Real commercial software revenue growth compresses valuation multiples safely.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </AnswerPageLayout>
  );
}
