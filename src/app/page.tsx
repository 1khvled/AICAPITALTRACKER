import React from "react";
import Link from "next/link";
import { ArrowRight, ChevronRight } from "lucide-react";

import rawDeals from "@/data/deals.json";
import trajectoryHistory from "@/data/trajectory-history.json";
import { evaluateBubbleModel, DEFAULT_MODEL_INPUTS } from "@/lib/model/engine";
import { MODEL_FACTORS, marketImplied12mBand } from "@/lib/model/factors";
import { AdSlot } from "@/components/AdSlot";
import { ProbabilityGauge } from "@/components/ProbabilityGauge";
import { Reveal } from "@/components/Reveal";
import { AnswerBlock } from "@/components/home/AnswerBlock";
import { HistorySection } from "@/components/home/HistorySection";
import { DriverSection } from "@/components/home/DriverSection";
import { FlipSection } from "@/components/home/FlipSection";
import { ReceiptsBand } from "@/components/home/ReceiptsBand";
import { ModelNote } from "@/components/home/ModelNote";
import { DeskSection } from "@/components/home/DeskSection";
import { PrintScrubber, type ScrubPoint } from "@/components/home/PrintScrubber";
import { ScrollyDrivers, type DeskDriverRow } from "@/components/home/ScrollyDrivers";
import { DeskPosition } from "@/components/home/DeskPosition";
import {
  BAND_LABEL,
  factorPlain,
  formatAsOf,
  formatTrillions,
  formatBillions,
} from "@/components/home/copy";
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
  dayLabel?: string;
  probability?: number;
  compositeScore?: number;
  deltaVsYesterday?: string;
  originalPrintPct?: number;
  /** True when the pipeline seeded the point instead of observing it. */
  backfilled?: boolean;
}

/** The published explanation for each factor, keyed by id. */
const EXPLAIN_BY_ID = new Map(MODEL_FACTORS.map((factor) => [factor.id, factor.explain]));

/** "+8.4 pts" / "−3.2 pts" — typographic minus, one decimal. */
function formatPts(value: number): string {
  return `${value > 0 ? "+" : value < 0 ? "−" : ""}${Math.abs(value).toFixed(1)} pts`;
}

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

  // ── Published trajectory: the "as of" date and the published move ─────────
  const history = Array.isArray(trajectoryHistory)
    ? (trajectoryHistory as unknown as TrajectoryPointLite[])
    : [];
  const latestPoint = history[history.length - 1];
  const firstPoint = history[0];
  const observedHistory = history.filter((point) => point.backfilled !== true);
  const firstObservedPoint = observedHistory[0] ?? firstPoint;
  const latestObservedPoint = observedHistory[observedHistory.length - 1] ?? latestPoint;
  const asOf = latestPoint?.date ? formatAsOf(latestPoint.date) : null;
  const delta90 =
    typeof latestObservedPoint?.probability === "number" &&
    typeof firstObservedPoint?.probability === "number"
      ? Math.round((latestObservedPoint.probability - firstObservedPoint.probability) * 10) / 10
      : null;
  // The count is disclosed next to the 90-day delta so the move is never read as 90 days
  // of recorded market history.
  const backfilledCount = history.filter((p) => p.backfilled === true).length;
  const observedCount = history.filter((p) => p.backfilled !== true).length;

  const scrubPoints: ScrubPoint[] = [];
  for (const point of history) {
    if (typeof point.date !== "string") continue;
    if (typeof point.probability !== "number") continue;
    if (typeof point.compositeScore !== "number") continue;
    // The chart is labelled "observed", so seeded points never enter it.
    // The note below discloses any that the file carries.
    if (point.backfilled === true) continue;
    scrubPoints.push({
      date: point.date,
      dayLabel: point.dayLabel,
      probability: point.probability,
      compositeScore: point.compositeScore,
      deltaVsYesterday: point.deltaVsYesterday,
    });
  }

  const lastMovePts =
    scrubPoints.length >= 2
      ? Math.round(
          (scrubPoints[scrubPoints.length - 1].probability -
            scrubPoints[scrubPoints.length - 2].probability) *
            10
        ) / 10
      : null;
  const priorScrubPoint = scrubPoints.length >= 2 ? scrubPoints[scrubPoints.length - 2] : null;
  const scrubIntro =
    lastMovePts === null
      ? `The print is not a daily ticker with a hundred points behind it. It is ${scrubPoints.length} observed prints. Drag the line to read any day.`
      : lastMovePts === 0
        ? `The print is not a daily ticker with a hundred points behind it. It is ${scrubPoints.length} observed prints; the latest was unchanged. Drag the line to read any day.`
        : `The print is not a daily ticker with a hundred points behind it. It is ${scrubPoints.length} observed prints; the latest moved ${formatPts(
            lastMovePts,
          )}. Drag the line to read any day.`;

  // ── Factor split: what pushes the score up, and the one that pushes it down ─
  const riskFactors = result.contributions
    .filter((factor) => factor.kind === "risk" && factor.earnedPoints > 0)
    .sort((a, b) => b.earnedPoints - a.earnedPoints);
  const damper = result.contributions.find((factor) => factor.kind === "damper") ?? null;

  // Detail list shows all factors ordered by contribution
  const detailDrivers = [...riskFactors].sort((a, b) => a.earnedPoints - b.earnedPoints);

  const pricedFactors = result.contributions.filter((factor) => factor.reading.coverage > 0).length;

  // The scroll-driven briefing consumes the model's own factors, not a copy.
  const driverRows: DeskDriverRow[] = result.contributions.map((factor) => {
    const plain = factorPlain(factor.id);
    return {
      id: factor.id,
      short: plain.short,
      gloss: plain.gloss,
      explain: EXPLAIN_BY_ID.get(factor.id) ?? "",
      points: factor.earnedPoints,
      weightPct: factor.weightPct,
      score: factor.reading.score,
      reading: factor.reading.reading,
      kind: factor.kind,
    };
  });

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

  const scrubNote =
    backfilledCount > 0
      ? `${observedCount} observed prints shown; ${backfilledCount} earlier ${
          backfilledCount === 1 ? "point is" : "points are"
        } backfilled and excluded from this chart.`
      : `${observedCount} observed prints; no backfilled points. The line is the published file, exactly.`;

  return (
    <div className="space-y-12 sm:space-y-16">
      {/* ── 01 · The answer, above the fold (in plain English) ──────────────── */}
      <section id="print" className="desk-grid">
        <div className="mb-4 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
          <span className="index-tag">01 / The print</span>
          <div className="desk-meta">
            <span>AI Capital Tracker</span>
            <span>Desk note {asOf ?? "undated"}</span>
            {result.modelVersion ? <span>Model v{result.modelVersion}</span> : null}
            <span>
              {pricedFactors}/{result.contributions.length} factors priced
            </span>
          </div>
        </div>

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
            "Not a certainty, a market-timing signal, or a trading recommendation.",
            "It measures whether the build-out can sustain itself, not whether AI is overhyped or unviable.",
            "It is an input-sensitivity reading: it moves when rates, credit spreads, or the crowd price move, but it is not a statistical confidence interval.",
          ]}
          plainAnswers={plainAnswers}
        />
      </section>

      {/* Leaderboard sits BELOW the answer — this page's promise is "the answer, above the fold".
          The home page carries two units only: this one and the footer. The native in-feed
          and mid MPU were removed because their four-tile creatives broke the reading flow. */}
      <AdSlot placementId="home-leaderboard" />

      {/* ── 02 · The move: every published print, and the two changes behind it ── */}
      <DeskSection
        id="move"
        index="02"
        title="The move"
        meta={`${scrubPoints.length} points / observed`}
        intro={scrubIntro}
      >
        <PrintScrubber points={scrubPoints} note={scrubNote} />

        <Reveal>
          <div className="panel mt-4 max-w-3xl rule-accent-left pl-4">
            <p className="label">What changed</p>
            <dl className="mt-2 grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-[13px] font-semibold uppercase tracking-[0.08em] text-ink-faint">
                  Latest observed move
                </dt>
                <dd className="num mt-1 text-[20px] font-semibold text-ink">
                  {lastMovePts === null ? "—" : formatPts(lastMovePts)}
                </dd>
                <dd className="mt-1 text-[14px] leading-snug text-ink-subtle">
                  {priorScrubPoint && latestPoint?.date
                    ? `from ${formatAsOf(priorScrubPoint.date)} to ${formatAsOf(latestPoint.date)}`
                    : "No prior observed print"}
                </dd>
              </div>
              {firstObservedPoint &&
              typeof firstObservedPoint.originalPrintPct === "number" &&
              typeof firstObservedPoint.probability === "number" ? (
                <div>
                  <dt className="text-[13px] font-semibold uppercase tracking-[0.08em] text-ink-faint">
                    Model recalibration
                  </dt>
                  <dd className="num mt-1 text-[20px] font-semibold text-ink">
                    {firstObservedPoint.originalPrintPct.toFixed(1)}% →{" "}
                    {firstObservedPoint.probability.toFixed(1)}%
                  </dd>
                  <dd className="mt-1 text-[14px] leading-snug text-ink-subtle">
                    v2.7.0 credit-ramp correction on{" "}
                    {firstObservedPoint.date ? formatAsOf(firstObservedPoint.date) : "the first observed print"}.
                    A model change, not a market move.
                  </dd>
                </div>
              ) : null}
            </dl>
            <p className="mt-3 max-w-2xl text-[14px] leading-relaxed text-ink-muted">
              The line above is the published file. The recalibration explains why the first v2.7
              print sits far below the v2.6 print; it does not explain the latest day.{" "}
              <Link
                href="/methodology#sigmoid"
                className="text-ink underline decoration-rule underline-offset-4 hover:decoration-ink"
              >
                See the method
              </Link>
              .
            </p>
          </div>
        </Reveal>
      </DeskSection>

      {/* ── 03 · The machine: scroll the factors, then the flip list ────────── */}
      <DeskSection
        id="machine"
        index="03"
        title="What moves the number"
        meta={`composite ${result.compositeScore.toFixed(1)} / 100`}
        intro="The print is a weighted sum, not a vibe. Four readings carry most of the risk; one pulls it down. Scroll — the instrument follows the chapter you are reading."
      >
        <ScrollyDrivers
          rows={driverRows}
          composite={result.compositeScore}
          probability={result.burstProbability}
        />

        <div className="mt-6">
          <FlipSection inputs={DEFAULT_MODEL_INPUTS} result={result} />
        </div>

        {/* The dial and the full factor table are the audit trail, so they
            stay — one tap down, after the reader has seen the argument. */}
        <details id="breakdown" className="group mt-8 scroll-mt-24 border-t border-rule pt-4">
          <summary className="flex min-h-11 cursor-pointer list-none items-start justify-between gap-4 [&::-webkit-details-marker]:hidden">
            <div>
              <p className="label">For researchers</p>
              <p className="mt-1 text-[15px] font-semibold text-ink">
                The full machinery: stress dial, fragility meters, every factor reading
              </p>
              <p className="mt-0.5 text-[14px] leading-relaxed text-ink-muted">
                Composite score, Minsky fragility, Merton and Altman solvency tiles, the observed
                trajectory, and all {result.contributions.length} factor readings with their inputs.
              </p>
            </div>
            <ChevronRight
              className="mt-1 h-5 w-5 shrink-0 text-ink-subtle transition-transform group-open:rotate-90"
              aria-hidden="true"
            />
          </summary>
          <div className="mt-5 space-y-4">
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
          </div>
        </details>
      </DeskSection>

      {/* ── 04 · The record: the receipts, then the history ─────────────────── */}
      <DeskSection
        id="record"
        index="04"
        title="The record"
        meta={`${totalDeals} deals / ${debtDeals.length} debt facilities`}
        intro="Everything below is a tracked filing, not an estimate. The long history of bubbles — and how this model would have scored them — is one tap down."
      >
        <ReceiptsBand
          trackedLabel={trackedLabel}
          dealsCount={totalDeals}
          totalDisclosedUsd={totalDisclosedUsd}
          totalDebtUsd={totalDebtUsd}
          debtLabel={debtLabel}
        />

        <div className="mt-4">
          <HistorySection collapsible />
        </div>
      </DeskSection>

      {/* ── 05 · The market and your own number ─────────────────────────────── */}
      <DeskSection
        id="market"
        index="05"
        title="The market"
        meta={`${marketRead.centralPct.toFixed(1)}% implied / 12mo`}
        intro="What money is betting on this question, and where you sit next to it. The gap between the model and the crowd is published, not hidden."
      >
        <div className="card card-flush shadow-card">
          <div className="card-header flex-wrap gap-x-4 gap-y-2">
            <div className="min-w-0">
              <p className="label">The market&rsquo;s price</p>
              <h3 className="mt-1 text-[15px] font-bold tracking-tight text-ink">
                What money is betting on this question
              </h3>
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
              not doing research. Prediction-market odds reflect the real-money trading price of
              contracts on Polymarket, not an analyst&rsquo;s opinion. It enters our model as one
              factor of eight, and its resolution criteria are not identical to ours.
            </p>

            {/* ── What the market is betting on: Live tradeable contracts ── */}
            {tradeableMarkets.length > 0 && (
              <div className="mt-6 space-y-3 border-t border-rule pt-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="label">Live contracts in plain words</p>
                    <h3 className="mt-0.5 text-[16px] font-bold text-ink">
                      What the market is betting on
                    </h3>
                  </div>
                  <span className="pill">Polymarket live book</span>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {tradeableMarkets.map((m: any) => (
                    <a
                      key={m.id}
                      href={
                        m.referralUrl ||
                        `https://polymarket.com/event/${m.eventSlug}?r=${POLYMARKET_REFERRAL_CODE}`
                      }
                      target="_blank"
                      rel="noopener noreferrer sponsored"
                      className="panel block p-3.5 transition-all hover:border-ink focus:outline-none focus-visible:ring-1 focus-visible:ring-ink"
                    >
                      <p className="text-[14px] font-semibold leading-snug text-ink">{m.question}</p>
                      <div className="mt-2.5 flex items-baseline justify-between border-t border-rule pt-2">
                        <span className="text-[12px] font-semibold uppercase text-ink-faint">
                          The market says
                        </span>
                        <span className="num text-[16px] font-bold text-accent-strong dark:text-accent-ink">
                          {m.yesProbabilityPct.toFixed(1)}% YES
                        </span>
                      </div>
                      {m.volumeUsd > 0 && (
                        <div className="mt-0.5 text-right text-[12px] text-ink-subtle">
                          $
                          {m.volumeUsd / 1e6 >= 1
                            ? `${(m.volumeUsd / 1e6).toFixed(1)}M`
                            : `${Math.round(m.volumeUsd / 1e3)}k`}{" "}
                          traded
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
                Outbound links carry our referral code (
                <strong className="font-mono text-ink">{POLYMARKET_REFERRAL_CODE}</strong>) and we
                may be paid a referral fee if you trade. Referral arrangements never change a number
                or model probability on this site.
              </span>
            </p>
          </div>
        </div>

        <div className="mt-6">
          <DeskPosition
            modelPct={result.burstProbability}
            marketPct={marketRead.centralPct}
            marketLabel="Market-implied 12m"
            bandLabel={BAND_LABEL[result.band]}
          />
        </div>
      </DeskSection>

      <ModelNote asOf={asOf} />
    </div>
  );
}
