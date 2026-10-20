import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import rawDeals from "@/data/deals.json";
import trajectoryHistory from "@/data/trajectory-history.json";
import { evaluateBubbleModel, DEFAULT_MODEL_INPUTS } from "@/lib/model/engine";
import { AdSlot } from "@/components/AdSlot";
import { ProbabilityGauge } from "@/components/ProbabilityGauge";
import { Reveal } from "@/components/Reveal";
import { AnswerBlock } from "@/components/home/AnswerBlock";
import { DriverSection } from "@/components/home/DriverSection";
import { FlipSection } from "@/components/home/FlipSection";
import { ReceiptsBand } from "@/components/home/ReceiptsBand";
import { ModelNote } from "@/components/home/ModelNote";
import { formatAsOf, formatTrillions } from "@/components/home/copy";
import liveInputs from "@/data/live-inputs.json";
import { POLYMARKET_REFERRAL_CODE } from "@/data/polymarket-data";

interface TrajectoryPointLite {
  date?: string;
  probability?: number;
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

  // ── The crowd's live price (the daily Polymarket snapshot) ─────────────────
  const crowd = liveInputs.crowd;
  const crowd2027 = crowd.bubble2027Probability ?? crowd.yesProbability ?? 0;
  const crowdVolumeUsd = crowd.volumeUsd ?? 0;
  const crowdGap = result.burstProbability - crowd2027 * 100;

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
  // 2026-10-19 (round-2 consolidation): the pipeline seeds the early part of the 90-day
  // curve (flagged "backfilled": true in trajectory-history.json) instead of observing it.
  // The count is disclosed next to the 90-day delta so the move is never read as 90 days
  // of recorded market history.
  const backfilledCount = history.filter((p) => p.backfilled === true).length;

  // ── Factor split: what pushes the score up, and the one that pushes it down ─
  const riskFactors = result.contributions
    .filter((factor) => factor.kind === "risk" && factor.earnedPoints > 0)
    .sort((a, b) => b.earnedPoints - a.earnedPoints);
  const damper = result.contributions.find((factor) => factor.kind === "damper") ?? null;

  const headlineDrivers = riskFactors
    .slice(0, HEADLINE_DRIVER_COUNT)
    .map((factor) => ({ id: factor.id, points: factor.earnedPoints }));

  // Lightest reading first, heaviest last — the list escalates to the top driver.
  const detailDrivers = riskFactors
    .slice(0, DETAIL_DRIVER_COUNT)
    .sort((a, b) => a.earnedPoints - b.earnedPoints);

  const pricedFactors = result.contributions.filter((factor) => factor.reading.coverage > 0).length;

  return (
    <div className="space-y-10 sm:space-y-14">
      {/* ── 1 · The answer, above the fold ─────────────────────────────────── */}
      <AnswerBlock
        probability={result.burstProbability}
        band={result.band}
        asOf={asOf}
        delta90={delta90}
        backfilledCount={backfilledCount}
        trackedLabel={trackedLabel}
        dealsCount={totalDeals}
        pricedFactors={pricedFactors}
        totalFactors={result.contributions.length}
        drivers={headlineDrivers}
      />

      {/* Leaderboard sits BELOW the answer — this page's promise is "the answer, above the fold" */}
      <AdSlot placementId="home-leaderboard" />

      {/* ── 2 · The full breakdown: the model, then what it is made of ──────── */}
      <section id="breakdown" aria-labelledby="breakdown-heading">
        <Reveal>
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <h2
              id="breakdown-heading"
              className="text-xl font-bold tracking-[-0.025em] text-ink sm:text-2xl"
            >
              The full breakdown
            </h2>
            <span className="label">12-month horizon</span>
          </div>
          <p className="mb-4 mt-1.5 max-w-2xl text-sm leading-relaxed text-ink-muted">
            Eight risk factors plus one damper, each with a fixed published weight. The scenarios below
            flex one input at a time.
          </p>
        </Reveal>

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
      <ReceiptsBand trackedLabel={trackedLabel} dealsCount={totalDeals} />

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
                  Prediction market
                </dt>
                <dd className="num mt-1 text-[17px] font-semibold text-ink">
                  {(crowd2027 * 100).toFixed(1)}%
                </dd>
                <dd className="mt-1 text-[14px] leading-snug text-ink-subtle">
                  Contract closing Jun 2027 &middot; ${(crowdVolumeUsd / 1e6).toFixed(2)}M traded
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
                  How far the model sits above the market&rsquo;s price
                </dd>
              </div>
            </dl>
            <p className="prose prose-p mt-3 max-w-reading text-[15px]">
              The market reads this question faster and with less machinery than we do, and it is
              published here because a research site that hides its disagreement with the crowd is
              not doing research. It enters our model as one factor of eight, and its resolution
              criteria are not identical to ours.
            </p>
            <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-[14px] text-ink-subtle">
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
                Outbound links carry our referral code ({POLYMARKET_REFERRAL_CODE}) and we may be paid.
                They never change a number on this site.
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
