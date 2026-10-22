import React from "react";
import Link from "next/link";
import { ArrowDown, ArrowRight } from "lucide-react";

import rawDeals from "@/data/deals.json";
import trajectoryHistory from "@/data/trajectory-history.json";
import { evaluateBubbleModel, DEFAULT_MODEL_INPUTS } from "@/lib/model/engine";
import { AdSlot } from "@/components/AdSlot";
import { ProbabilityGauge } from "@/components/ProbabilityGauge";
import { Reveal } from "@/components/Reveal";
import { AnswerBlock } from "@/components/home/AnswerBlock";
import { HistorySection } from "@/components/home/HistorySection";
import { DriverSection } from "@/components/home/DriverSection";
import { FlipSection } from "@/components/home/FlipSection";
import { ReceiptsBand } from "@/components/home/ReceiptsBand";
import { ModelNote } from "@/components/home/ModelNote";
import { formatAsOf, formatTrillions, formatBillions } from "@/components/home/copy";
import { WhatChangedChart } from "@/components/home/WhatChangedChart";
import { FactorContributionChart } from "@/components/home/FactorContributionChart";
import { marketImplied12mBand } from "@/lib/model/factors";
import liveInputs from "@/data/live-inputs.json";
import { POLYMARKET_REFERRAL_CODE } from "@/data/polymarket-data";
import {
  OPENAI_NAMED_DEALS,
  OPENAI_NAMED_TOTAL_USD,
  liveContracts,
} from "@/components/answer-pages/answerData";
import type { PlainAnswerEntry } from "@/components/home/AnswerBlock";

interface TrajectoryPointLite {
  date?: string;
  probability?: number;
  originalPrintPct?: number;
  /** True when the pipeline seeded the point instead of observing it. */
  backfilled?: boolean;
}

const HEADLINE_DRIVER_COUNT = 3;
const DETAIL_DRIVER_COUNT = 5;

export default function HomePage() {
  // Same call, same inputs, same output as every other surface on the site.
  const result = evaluateBubbleModel(DEFAULT_MODEL_INPUTS);

  // ── Ledger aggregates (tracked deals, not estimates) ──────────────────────
  const totalDeals = rawDeals.length;
  const totalDisclosedUsd = rawDeals.reduce((sum, deal) => sum + (deal.amount_usd || 0), 0);
  const trackedLabel = formatTrillions(totalDisclosedUsd);

  // ── Debt aggregates (computed directly from tracked deals) ────────────────
  const debtDeals = rawDeals.filter((deal) => deal.is_debt);
  const totalDebtUsd = debtDeals.reduce((sum, deal) => sum + (deal.amount_usd || 0), 0);
  const debtLabel = formatBillions(totalDebtUsd);

  // ── The crowd's live price (the daily Polymarket snapshot) ─────────────────
  const crowd = liveInputs.crowd;
  const crowd2027 = crowd.bubble2027Probability ?? crowd.yesProbability ?? 0;
  const crowdVolumeUsd = crowd.volumeUsd ?? 0;
  /**
   * ONE gap, one comparison object: the model print against the market-implied
   * 12-month read (the tracked contracts with their horizon correction
   * applied). The raw contract prices are shown beside it as context - they ask
   * a dated, differently-scoped question.
   */
  const marketRead = marketImplied12mBand(crowd2027 * 100);
  const crowdGap = result.burstProbability - marketRead.centralPct;

  // ── Top active prediction contracts for the homepage affiliate module ─────
  const tradeableMarkets = ((crowd?.markets ?? []) as any[])
    .filter((m: any) => m.active && !m.closed && m.yesProbabilityPct > 0)
    .sort((a: any, b: any) => (b.volumeUsd || 0) - (a.volumeUsd || 0))
    .slice(0, 4);

  // ── Published 90-day trajectory: the "as of" date and the 90-day move ──────
  const history = Array.isArray(trajectoryHistory)
    ? (trajectoryHistory as unknown as TrajectoryPointLite[])
    : [];
  const latestPoint = history[history.length - 1];
  const firstPoint = history[0];
  const asOf = latestPoint?.date ? formatAsOf(latestPoint.date) : null;
  const delta90 =
    typeof latestPoint?.probability === "number" && typeof firstPoint?.probability === "number"
      ? Math.round((latestPoint.probability - firstPoint.probability) * 10) / 10
      : null;
  // The count is disclosed next to the 90-day delta so the move is never read as 90 days
  // of recorded market history.
  const backfilledCount = history.filter((p) => p.backfilled === true).length;

  // ── Factor split: what pushes the score up, and the one that pushes it down ─
  const riskFactors = result.contributions
    .filter((factor) => factor.kind === "risk" && factor.earnedPoints > 0)
    .sort((a, b) => b.earnedPoints - a.earnedPoints);
  const damper = result.contributions.find((factor) => factor.kind === "damper") ?? null;

  // Detail list shows all factors ordered by contribution
  const detailDrivers = [...riskFactors].sort((a, b) => a.earnedPoints - b.earnedPoints);

  const pricedFactors = result.contributions.filter((factor) => factor.reading.coverage > 0).length;

  // ── The index of plain answers, each with its OWN headline number ────────
  // Every figure below is computed from the ledger, the live model inputs or
  // the live contract book — the same sources the answer pages use.
  const ipoContract = liveContracts(["will-openai-ipo-by-december-31-2026"])[0];
  const cpiPct = DEFAULT_MODEL_INPUTS.macro?.cpiInflationYoY ?? 0;
  const tenYearPct = DEFAULT_MODEL_INPUTS.macro?.us10yYieldPct ?? 0;
  const big4Capex = DEFAULT_MODEL_INPUTS.capex?.aggregateCapexUsd ?? 0;
  const big4Fcf = DEFAULT_MODEL_INPUTS.capex?.aggregateFcfUsd ?? 0;

  const plainAnswers: PlainAnswerEntry[] = [
    {
      href: "/will-the-ai-bubble-burst",
      question: "Will the AI bubble burst?",
      answer: `${result.burstProbability.toFixed(1)}% chance within 12 months — what would change it`,
    },
    {
      href: "/how-much-is-being-spent-on-ai",
      question: "How much is being spent on AI?",
      answer: `${trackedLabel} across ${totalDeals} verified filings`,
    },
    {
      href: "/how-much-ai-debt-there-is",
      question: "How much AI debt is there?",
      answer: `${debtLabel} across ${debtDeals.length} loans, notes and credit lines`,
    },
    {
      href: "/will-openai-ipo",
      question: "Will OpenAI IPO in 2026?",
      answer: `${(ipoContract?.probabilityPct ?? 0).toFixed(1)}% priced for 2026 — and what would change it`,
    },
    {
      href: "/what-is-cpi-doing-to-ai",
      question: "What is CPI doing to AI?",
      answer: `CPI at ${cpiPct.toFixed(2)}%, 10-year yield at ${tenYearPct.toFixed(2)}%`,
    },
    {
      href: "/who-is-funding-openai",
      question: "Who is funding OpenAI?",
      answer: `${formatBillions(OPENAI_NAMED_TOTAL_USD)} across ${OPENAI_NAMED_DEALS.length} named transactions`,
    },
    {
      href: "/is-ai-spending-too-much",
      question: "Is AI spending too much?",
      answer: `${formatBillions(big4Capex)} of capex against ${formatBillions(big4Fcf)} of cash`,
    },
  ];

  return (
    <div className="space-y-10 sm:space-y-14">
      {/* ── 1 · The answer, above the fold (in plain English) ──────────────── */}
      <AnswerBlock
        probability={result.burstProbability}
        band={result.band}
        asOf={asOf}
        delta90={delta90}
        backfilledCount={backfilledCount}
        trackedLabel={trackedLabel}
        debtLabel={debtLabel}
        dealsCount={totalDeals}
        debtDealsCount={debtDeals.length}
        pricedFactors={pricedFactors}
        totalFactors={result.contributions.length}
        notThis={[
          "It is not a certainty, market timing signal, or trading recommendation. It calculates statistical odds of an infrastructure correction from filed debt and corporate cash flows.",
          "It does not predict that artificial intelligence technology is overhyped or unviable; it measures whether the current corporate borrowing and hardware build-out can sustain itself without defaults or severe cutbacks.",
          "The published range beside it is an input-sensitivity range (showing how far the score shifts when interest rates or credit default swaps change), not a statistical confidence interval.",
        ]}
        plainAnswers={plainAnswers}
      />

      {/* Leaderboard sits BELOW the answer — this page's promise is "the answer, above the fold" */}
      <AdSlot placementId="home-leaderboard" />

      {/* ── 1c · The history: the model on resolved episodes, and the money ── */}
      <Reveal>
        <HistorySection />
      </Reveal>

      {/* ── 1b · Why the print moved (it belongs with the machinery) ───────── */}
      <Reveal>
        <div className="panel space-y-4 rule-accent-left pl-4">
          <WhatChangedChart />
          <p className="label flex items-center gap-1.5 pt-2">
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--c-accent)]" aria-hidden="true" />
            Why the print moved
          </p>
          <p className="text-[15px] leading-relaxed text-ink-muted">
            The print moved because the credit reading was found to be scoring two very different situations the same way, and it now separates them.
            {firstPoint?.originalPrintPct && (
              <span>
                {" "}The model recalibrated from{" "}
                <strong className="font-semibold text-ink">
                  {firstPoint.originalPrintPct.toFixed(1)}%
                </strong>{" "}
                to{" "}
                <strong className="font-semibold text-ink">
                  {result.burstProbability.toFixed(1)}%
                </strong>{" "}
                with no change in underlying market data, restoring sensitivity above extreme credit spreads so the published band follows the market.
              </span>
            )}
            {" "}
            <Link href="/methodology#sigmoid" className="text-ink underline decoration-rule underline-offset-4 hover:decoration-ink">
              See the method
            </Link>
            .
          </p>
        </div>
      </Reveal>

      {/* ── 2 · Demoted machinery: factor weights, composite scores & models ─ */}
      <section id="breakdown" aria-labelledby="breakdown-heading">
        <Reveal>
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <h2
              id="breakdown-heading"
              className="text-xl font-bold tracking-[-0.025em] text-ink sm:text-2xl"
            >
              The quantitative machinery
            </h2>
            <Link
              href="/methodology"
              className="inline-flex min-h-[44px] items-center gap-1 text-[13px] font-medium text-ink underline decoration-rule underline-offset-4 hover:decoration-ink"
            >
              See full mathematical methodology &amp; formulas
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </div>
          <p className="mb-4 mt-1.5 max-w-2xl text-[15px] leading-relaxed text-ink-muted">
            For researchers and quantitative analysts: the composite score (0–100, combining 8 financial risk factors and 1 real-use adoption damper; higher score means greater stress), Minsky fragility index (partitioning debt into hedge, speculative, and Ponzi regimes), and systemic contagion points that produce the {result.burstProbability.toFixed(1)}% print.
          </p>
        </Reveal>

        {/* Factor contributions chart: demoted from hero to machinery section */}
        <div className="mb-6">
          <FactorContributionChart
            contributions={result.contributions}
            compositeScore={result.compositeScore}
            systemicContagionPoints={result.systemicContagionPoints}
          />
        </div>

        <ProbabilityGauge
          probability={result.burstProbability}
          compositeScore={result.compositeScore}
          band={result.band}
          coverage={result.coverage}
          topDrivers={result.topDriverIds}
          fragilityIndex={result.fragilityIndex}
          contributions={result.contributions}
          initialInputs={DEFAULT_MODEL_INPUTS}
        />

        <DriverSection
          drivers={detailDrivers}
          damper={damper}
          shownCount={detailDrivers.length}
          totalCount={result.contributions.length}
        />

        <div className="mt-8">
          <AdSlot placementId="home-infeed-1" />
        </div>
      </section>

      {/* ── 3 · What would flip the answer ─────────────────────────────────── */}
      <FlipSection inputs={DEFAULT_MODEL_INPUTS} result={result} />

      {/* Second in-feed unit — the deep page keeps two native blocks at most. */}
      <div className="mt-8">
        <AdSlot placementId="home-infeed-2" />
      </div>

      {/* ── 4 · Receipts ───────────────────────────────────────────────────── */}
      <ReceiptsBand
        trackedLabel={trackedLabel}
        dealsCount={totalDeals}
        totalDisclosedUsd={totalDisclosedUsd}
        totalDebtUsd={totalDebtUsd}
        debtLabel={debtLabel}
      />

      <AdSlot placementId="home-mid" className="mt-8" />

      <ModelNote asOf={asOf} />

      {/* ── 5 · What the market is pricing ──────────────────────────────────── */}
      {/* The one live price for this exact question, next to the model's own
          print. The gap between them is published, not hidden. */}
      <section aria-labelledby="market-price-heading" className="mt-10">
        <div className="card card-flush shadow-card">
          <div className="card-header flex-wrap gap-x-4 gap-y-2">
            <div className="min-w-0">
              <p className="label">The market&rsquo;s price</p>
              <h2
                id="market-price-heading"
                className="mt-1 text-[15px] font-bold tracking-tight text-ink"
              >
                What money is betting on this question
              </h2>
            </div>
            <Link href="/prediction-markets" className="btn min-h-11 shrink-0">
              Full board
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
          <div className="px-4 py-4">
            <dl className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="panel">
                <dt className="text-[13px] font-semibold uppercase tracking-[0.08em] text-ink-faint">
                  This model
                </dt>
                <dd className="num mt-1 text-[17px] font-semibold text-ink">
                  {result.burstProbability.toFixed(1)}%
                </dd>
                <dd className="mt-1 text-[14px] leading-snug text-ink-subtle">
                  12-month probability, from filed receipts and daily credit prints
                </dd>
              </div>
              <div className="panel">
                <dt className="text-[13px] font-semibold uppercase tracking-[0.08em] text-ink-faint">
                  Market-implied 12-month read
                </dt>
                <dd className="num mt-1 text-[17px] font-semibold text-ink">
                  {marketRead.centralPct.toFixed(1)}%
                </dd>
                <dd className="mt-1 text-[14px] leading-snug text-ink-subtle">
                  The tracked contracts with their horizon correction &middot; raw Jun 2027
                  contract {(crowd2027 * 100).toFixed(1)}% &middot; $
                  {(crowdVolumeUsd / 1e6).toFixed(2)}M traded
                </dd>
              </div>
              <div className="panel">
                <dt className="text-[13px] font-semibold uppercase tracking-[0.08em] text-ink-faint">
                  The gap
                </dt>
                <dd className="num mt-1 text-[17px] font-semibold text-ink">
                  {crowdGap >= 0 ? "+" : ""}
                  {crowdGap.toFixed(1)} pts
                </dd>
                <dd className="mt-1 text-[14px] leading-snug text-ink-subtle">
                  How far the model sits above the market-implied 12-month read
                </dd>
              </div>
            </dl>
            <p className="prose prose-p mt-3 max-w-reading text-[15px]">
              The market reads this question faster and with less machinery than we do, and it is
              published here because a research site that hides its disagreement with the crowd is
              not doing research. Prediction-market odds reflect the real-money trading price of contracts on Polymarket, not an analyst&rsquo;s opinion. It enters our model as one factor of eight, and its resolution criteria are not identical to ours.
            </p>

            {/* ── What the market is betting on: Live tradeable contracts ── */}
            {tradeableMarkets.length > 0 && (
              <div className="mt-6 border-t border-rule pt-5 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="label">Live contracts in plain words</p>
                    <h3 className="text-[16px] font-bold text-ink mt-0.5">
                      What the market is betting on
                    </h3>
                  </div>
                  <span className="pill text-[12px]">Polymarket live book</span>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {tradeableMarkets.map((m: any) => (
                    <a
                      key={m.id}
                      href={m.referralUrl || `https://polymarket.com/event/${m.eventSlug}?r=${POLYMARKET_REFERRAL_CODE}`}
                      target="_blank"
                      rel="noopener noreferrer sponsored"
                      className="panel block p-3.5 transition-all hover:border-ink focus:outline-hidden focus:ring-1 focus:ring-ink"
                    >
                      <p className="text-[14px] font-semibold text-ink leading-snug">
                        {m.question}
                      </p>
                      <div className="mt-2.5 flex items-baseline justify-between border-t border-rule pt-2">
                        <span className="text-[12px] uppercase font-semibold text-ink-faint">
                          The market says
                        </span>
                        <span className="num text-[16px] font-bold text-accent-strong dark:text-accent-ink">
                          {m.yesProbabilityPct.toFixed(1)}% YES
                        </span>
                      </div>
                      {m.volumeUsd > 0 && (
                        <div className="mt-0.5 text-right text-[12px] text-ink-subtle">
                          ${(m.volumeUsd / 1e6 >= 1 ? `${(m.volumeUsd / 1e6).toFixed(1)}M` : `${Math.round(m.volumeUsd / 1e3)}k`)} traded
                        </div>
                      )}
                    </a>
                  ))}
                </div>
              </div>
            )}

            <p className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 text-[14px] text-ink-subtle">
              <a
                href={`https://polymarket.com/event/ai-bubble-burst-by?r=${POLYMARKET_REFERRAL_CODE}`}
                target="_blank"
                rel="noopener noreferrer sponsored"
                className="inline-flex min-h-11 items-center rounded-md border border-rule-strong px-3 text-[14px] font-medium text-ink transition-colors hover:bg-surface-2"
              >
                Read the live book on Polymarket
                <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
              </a>
              <span className="max-w-reading">
                Outbound links carry our referral code (<strong className="font-mono text-ink">{POLYMARKET_REFERRAL_CODE}</strong>) and we may be paid a referral fee if you trade.
                Referral arrangements never change a number or model probability on this site.
              </span>
            </p>
          </div>
        </div>
      </section>

      {/* ── 6 · Your own call ───────────────────────────────────────────────── */}
      {/* The model publishes its number; the reader may disagree. This is the
          invitation to say so and keep a private scoreboard against it. */}
      <section aria-labelledby="your-call-heading" className="mt-10">
        <div className="card card-flush shadow-card">
          <div className="card-header flex-wrap gap-x-4 gap-y-2">
            <div className="min-w-0">
              <p className="label">Your call</p>
              <h2 id="your-call-heading" className="mt-1 text-[15px] font-bold tracking-tight text-ink">
                Put your own number on the record
              </h2>
            </div>
            <Link href="/your-call" className="btn btn-primary min-h-11 shrink-0">
              Make your call
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
          <div className="px-4 py-4">
            <p className="prose prose-p max-w-reading text-[15px]">
              The model prints {result.burstProbability.toFixed(1)}% from the inputs it can verify.
              If you think that is wrong, say so: your number is stored on this device, scored
              against the model&rsquo;s own print as the window resolves, and never uploaded.
            </p>
          </div>
        </div>
      </section>

      <AdSlot placementId="home-footer" />
    </div>
  );
}
