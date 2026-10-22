import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { evaluateBubbleModel, DEFAULT_MODEL_INPUTS } from "@/lib/model/engine";
import { BAND_LABEL, BAND_VERDICT, formatAsOf, formatBillions, factorPlain } from "@/components/home/copy";
import { AnswerPageLayout } from "@/components/answer-pages/AnswerPageLayout";
import {
  oneInN,
  plainFactorReading,
  probabilityShiftPts,
  resolveContracts,
} from "@/components/answer-pages/answerData";
import { HistorySection } from "@/components/home/HistorySection";
import trajectoryHistory from "@/data/trajectory-history.json";
import rawDeals from "@/data/deals.json";

/**
 * The metadata numbers are computed from the ledger, exactly like the numbers on
 * the page. A search snippet that says $2.87T must mean the same $2.87T the
 * reader finds on the page.
 */
export function generateMetadata(): Metadata {
  const trackedUsd = rawDeals.reduce((sum, d) => sum + (d.amount_usd || 0), 0);
  const debtUsd = rawDeals
    .filter((d) => d.is_debt)
    .reduce((sum, d) => sum + (d.amount_usd || 0), 0);
  const description = `The 12-month chance of an AI bubble burst, computed from the $${(
    trackedUsd / 1e12
  ).toFixed(2)}T in tracked AI spending, the $${(debtUsd / 1e9).toFixed(1)}B of AI debt, and daily credit market data.`;

  return {
    title: "Will the AI bubble burst? — 12-month odds and risk score",
    description,
    openGraph: {
      title: "Will the AI bubble burst? — 12-month odds and risk score",
      description,
      url: "/will-the-ai-bubble-burst",
      type: "article",
      images: ["/opengraph-image.png"],
    },
    alternates: {
      canonical: "/will-the-ai-bubble-burst",
    },
  };
}

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

  // Combined revenue run-rate across the tracked labs — summed from the model
  // inputs, never typed, so the sensitivity table agrees with the spending page.
  const labRunRateDisplay = formatBillions(
    (DEFAULT_MODEL_INPUTS.valuations || []).reduce(
      (sum, v) => sum + ((v.runRateRevenueUsd as number) || 0),
      0,
    ),
  );

  // ── The tradeable contracts, priced from the live book ───────────────────
  const polymarketContracts = resolveContracts([
    "poly-bubble-2026",
    "poly-bubble-2027",
  ]);

  // ── The money behind the probability, computed from the model inputs ─────
  const fcfUsd = DEFAULT_MODEL_INPUTS.capex?.aggregateFcfUsd ?? 0;
  const debtUsd = DEFAULT_MODEL_INPUTS.aiDebt?.totalTrackedDebtUsd ?? 0;
  const cdsBps = DEFAULT_MODEL_INPUTS.cds?.currentBps ?? 0;
  const hyBps = DEFAULT_MODEL_INPUTS.macro?.highYieldSpreadBps ?? 0;
  const us10yPct = DEFAULT_MODEL_INPUTS.macro?.us10yYieldPct ?? 0;

  // ── The sensitivity table: the model is RE-RUN, never re-typed ───────────
  const sensitivityRows = [
    {
      shock: "Oracle debt insurance +50bp",
      plain:
        "The cost of insuring Oracle's debt against default rises by 0.50% (50 basis points — a hundredth of a percentage point).",
      currentLevel: `${cdsBps}bp`,
      currentPlain: `${(cdsBps / 100).toFixed(2)}% a year`,
      shiftPts: probabilityShiftPts((i) => {
        if (i.cds) i.cds.currentBps = i.cds.currentBps + 50;
      }),
    },
    {
      shock: "Junk-bond spread +50bp",
      plain:
        "Risky corporate loans ask 0.50% more than government bonds, which makes rolling over GPU-backed loans expensive.",
      currentLevel: `${hyBps}bp`,
      currentPlain: `${(hyBps / 100).toFixed(2)}% over Treasuries`,
      shiftPts: probabilityShiftPts((i) => {
        if (i.macro) i.macro.highYieldSpreadBps = (i.macro.highYieldSpreadBps ?? 0) + 50;
      }),
    },
    {
      shock: "10-year Treasury yield +50bp",
      plain:
        "Government 10-year borrowing costs rise 0.50%, which raises the discount rate applied to every future tech profit.",
      currentLevel: `${us10yPct.toFixed(2)}%`,
      currentPlain: `${us10yPct.toFixed(2)}% today`,
      shiftPts: probabilityShiftPts((i) => {
        if (i.macro) i.macro.us10yYieldPct = (i.macro.us10yYieldPct ?? 0) + 0.5;
      }),
    },
    {
      shock: "Lab revenue +20%",
      plain:
        "Annual revenue extrapolated from current sales rises 20% across the labs we track, which lowers what investors pay for each dollar of revenue.",
      currentLevel: `~${labRunRateDisplay}`,
      currentPlain: "combined annual run-rate",
      shiftPts: probabilityShiftPts((i) => {
        i.valuations = (i.valuations || []).map((v) => ({
          ...v,
          runRateRevenueUsd: ((v.runRateRevenueUsd as number) || 0) * 1.2,
        }));
      }),
    },
  ];

  // SVG dimensions for trajectory sparkline
  const svgWidth = 600;
  const svgHeight = 160;
  const padX = 40;
  const padY = 24;

  const validPoints = history.filter((p) => typeof p.probability === "number" && p.date);
  // The axis is derived from the recorded prints, never typed, so a new print can
  // never fall outside the frame (and no point is ever clipped).
  const observedProbs = validPoints.map((p) => p.probability as number);
  const minProb = observedProbs.length ? Math.floor((Math.min(...observedProbs) - 1) * 10) / 10 : 0;
  const maxProb = observedProbs.length ? Math.ceil((Math.max(...observedProbs) + 1) * 10) / 10 : 100;
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
      answerLead={`${result.burstProbability.toFixed(1)}% — ${oneInN(result.burstProbability)} — that the AI build-out suffers a sharp contraction or credit crisis within the next 12 months. The model calls that ${BAND_LABEL[result.band]}: real risk, not the base case.`}
      answerContext={`In plain English: cash flow still covers most of the spending. Microsoft, Alphabet, Amazon and Meta earn about ${formatBillions(fcfUsd)} a year from their existing businesses, which pays for a lot of the build-out. But ${formatBillions(debtUsd)} of borrowed debt and very high private valuations leave little room for error if companies slow their spending.`}
      polymarketContracts={polymarketContracts}
      notThisItems={[
        "It is not a certainty, a market-timing signal, or a stock-picking forecast. It calculates the statistical odds of an infrastructure correction from corporate debt and cash-flow filings.",
        "It is not an argument that artificial intelligence technology is useless or a fad; it measures whether the current corporate borrowing and hardware build-out can sustain itself without defaults or severe cutbacks.",
        "The published range is an input-sensitivity range (showing how far the score shifts when interest rates or credit default swaps change), not a statistical confidence interval.",
        "It is not a prediction of when a crash happens. It prices the chance that one happens inside 12 months, and it does not know which company or which lender would fail first.",
      ]}
    >
      {/* ── Section 1: The trajectory — where the print sits today ─────────── */}
      <section aria-labelledby="trajectory-heading" className="card space-y-4 shadow-card">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-rule pb-3">
          <div>
            <h2 id="trajectory-heading" className="text-lg font-bold tracking-tight text-ink">
              Where the odds sit today
            </h2>
            <p className="mt-0.5 text-[14px] text-ink-muted">
              The model&rsquo;s own daily prints, read from filed filings and daily credit data.
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
            className="w-full h-auto select-none min-w-[560px] overflow-visible"
            aria-hidden="true"
          >
            {/* Horizontal grid lines */}
            <line
              x1={padX}
              y1={getY(minProb + rangeProb / 3)}
              x2={svgWidth - padX}
              y2={getY(minProb + rangeProb / 3)}
              stroke="rgb(var(--c-rule))"
              strokeDasharray="2 3"
              strokeWidth="1"
            />
            <line
              x1={padX}
              y1={getY(minProb + (2 * rangeProb) / 3)}
              x2={svgWidth - padX}
              y2={getY(minProb + (2 * rangeProb) / 3)}
              stroke="rgb(var(--c-rule))"
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
                    className="num font-mono text-[13px] font-bold fill-ink"
                  >
                    {pt.probability?.toFixed(1)}%
                  </text>
                  <text
                    x={cx}
                    y={svgHeight - 4}
                    textAnchor="middle"
                    className="num text-[13px] fill-ink-faint"
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
            What would change the answer
          </h2>
          <p className="mt-1 text-[15px] leading-relaxed text-ink-muted">
            The model does not rely on intuition. It tracks {riskFactors.length} financial risk
            factors that push the score up and one adoption damper that pulls it down. Here is what
            each one measures, in plain English:
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {riskFactors.map((factor) => {
            const { short, gloss } = factorPlain(factor.id);
            const plain = plainFactorReading(factor.id, factor.reading.reading);
            return (
              <div key={factor.id} className="card p-4 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[15px] font-bold text-ink">{short}</span>
                  <span className="chip chip-risk num font-semibold">
                    +{factor.earnedPoints.toFixed(1)} pts
                  </span>
                </div>
                <p className="text-[14px] font-medium text-ink-muted">{gloss}</p>
                <p className="text-[14px] leading-relaxed text-ink-muted">{plain.text}</p>
                <p className="num text-[13px] text-ink-subtle leading-snug">
                  Model reading: {plain.technical}
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
                <span className="text-[15px] font-bold text-ink">
                  {factorPlain(damperFactor.id).short}
                </span>
                <span className="chip chip-safe num font-semibold">
                  &minus;{Math.abs(damperFactor.earnedPoints).toFixed(1)} pts
                </span>
              </div>
              <p className="text-[14px] font-medium text-ink-muted">
                Real customer use, token cost declines, and controlled model training costs knock
                points OFF the score.
              </p>
              <p className="text-[14px] leading-relaxed text-ink-muted">
                {plainFactorReading(damperFactor.id, damperFactor.reading.reading).text}
              </p>
              <div className="border-t border-rule pt-2 text-[13px] text-ink-faint">
                Subtracts up to {damperFactor.weightPct} points on the 0&ndash;100 risk scale when
                real customer adoption outpaces capex (capital expenditures on hardware and data
                center construction).
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── Section 3: Sensitivity Table: What Moves the Odds ───────────────── */}
      <section aria-labelledby="sensitivity-heading" className="card p-5 space-y-4 shadow-card">
        <h2 id="sensitivity-heading" className="text-lg font-bold tracking-tight text-ink">
          How sensitive is the probability to a real-world shock?
        </h2>
        <p className="text-[15px] text-ink-muted leading-relaxed">
          Each row below is the same model, re-run with one input moved and nothing else changed.
          The shock is not linear, so a 50 basis point move in credit costs (a hundredth of a
          percentage point) does not move the odds by a fixed amount.
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-[14px]">
            <caption className="sr-only">
              Simulated impact of market shocks on the 12-month burst probability
            </caption>
            <thead>
              <tr className="border-b border-rule text-ink-subtle">
                <th scope="col" className="py-2.5 pr-4 font-semibold">Shock</th>
                <th scope="col" className="py-2.5 pr-4 font-semibold">Level today</th>
                <th scope="col" className="py-2.5 pr-4 font-semibold">Change in odds</th>
                <th scope="col" className="py-2.5 font-semibold">What it means</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rule font-tabular">
              {sensitivityRows.map((row) => (
                <tr key={row.shock} className="hover:bg-surface-2 transition-colors">
                  <th scope="row" className="py-3 pr-4 font-medium text-ink">
                    {row.shock}
                  </th>
                  <td className="py-3 pr-4 num text-ink-muted">
                    {row.currentLevel}
                    <span className="block text-[13px] font-sans text-ink-faint">
                      {row.currentPlain}
                    </span>
                  </td>
                  <td
                    className={`py-3 pr-4 num font-semibold ${
                      row.shiftPts >= 0
                        ? "text-risk-600 dark:text-risk-400"
                        : "text-safe-600 dark:text-safe-400"
                    }`}
                  >
                    {row.shiftPts >= 0 ? "+" : ""}
                    {row.shiftPts.toFixed(1)} pts
                  </td>
                  <td className="py-3 text-ink-muted text-[13px]">{row.plain}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-[13px] leading-relaxed text-ink-faint">
          A point here is one percentage point of the 12-month probability, not one point of the
          0&ndash;100 risk score behind it.
        </p>
      </section>

      {/* ── Section 4: The history — the model on resolved episodes ─────────── */}
      <HistorySection />
    </AnswerPageLayout>
  );
}
