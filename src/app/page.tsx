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
import { marketImplied12mBand } from "@/lib/model/factors";
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
  /**
   * ONE gap, one comparison object: the model print against the market-implied
   * 12-month read (the tracked contracts with their horizon correction
   * applied). The raw contract prices are shown beside it as context - they ask
   * a dated, differently-scoped question.
   */
  const marketRead = marketImplied12mBand(crowd2027 * 100);
  const crowdGap = result.burstProbability - marketRead.centralPct;

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
  //
  // 2026-10-20: the detail list shows EVERY risk factor, not the top five. A
  // page that says "9/9 factors priced" while showing five of them makes the
  // reader hunt for the other four, and a model that hides 40% of itself is
  // less credible than one that shows all of it. The sort axis is stated on the
  // list: by CONTRIBUTION to the print, not by published weight.
  const detailDrivers = [...riskFactors].sort((a, b) => a.earnedPoints - b.earnedPoints);

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

      {/* ── 1b · What changed, and what this number is not ─────────────────────
          The caveats used to live on /methodology, which is where a reader who
          goes looking for them finds them. The number is here, so the
          qualifications belong here too: what moved, and what the print is not. */}
      <Reveal>
        <div className="panel space-y-3">
          <p className="label">What changed on 20 Oct 2026</p>
          <p className="text-[15px] leading-relaxed text-ink-muted">
            Model v2.7.0 raised the credit factor&apos;s ramp ceiling from ×3 to ×7.556 of
            baseline after the factor was found <em>pinned at its maximum</em>. It had been
            adding a flat 18 of 18 points — 46.3 of the 72.3 probability points — for every
            print above 243bp, so a record credit spread and a merely elevated one scored
            identically. The print moved{" "}
            <strong className="font-semibold text-ink">72.3% → 32.3%</strong> with no input
            change. The factor moves again across the range that matters now, and the published
            band follows the market.{" "}
            <Link href="/methodology#sigmoid" className="text-ink underline decoration-rule underline-offset-4 hover:decoration-ink">
              See the method
            </Link>
            .
          </p>
          <p className="label pt-1">What {result.burstProbability.toFixed(1)}% is not</p>
          <ul className="space-y-1.5 text-[15px] leading-relaxed text-ink-muted">
            <li>
              It is not a validated probability. The composite maps through a chosen sigmoid
              (anchor 55, slope 9) — a published judgement, not a parameter set fitted to
              outcomes.
            </li>
            <li>
              It carries no false-positive record. All five resolved episodes in the
              consistency table burst; there is no episode in which a stressed regime failed to
              break, so the table cannot tell you how often the model cries wolf.
            </li>
            <li>
              The range beside it is an input-sensitivity range, not a confidence interval: it
              is how far the print moves when the inputs move, not a 95% interval.
            </li>
          </ul>
        </div>
      </Reveal>

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
