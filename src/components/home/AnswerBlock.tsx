import React from "react";
import { ArrowDown } from "lucide-react";
import type { BubbleBand } from "@/lib/model/types";
import { BAND_LABEL, BAND_TONE, BAND_VERDICT, factorPlain, formatAsOf } from "./copy";
import { ScrollLink } from "./ScrollLink";
import { CountUp } from "@/components/CountUp";
import { Reveal } from "@/components/Reveal";
import rawTrajectoryHistory from "@/data/trajectory-history.json";

export interface HeadlineDriver {
  id: string;
  points: number;
}

interface AnswerBlockProps {
  probability: number;
  band: BubbleBand;
  asOf: string | null;
  /** Point change over the published trajectory, if available. */
  delta90: number | null;
  /**
   * How many points of the published trajectory were seeded/backfilled by the
   * pipeline rather than observed. 0 = the curve is fully recorded.
   */
  backfilledCount: number;
  trackedLabel: string;
  dealsCount: number;
  pricedFactors: number;
  totalFactors: number;
  drivers: HeadlineDriver[];
}

interface TrajectoryRowLite {
  date?: string;
  probability?: number;
  /** 'observed' = the row came from a real pipeline run. */
  modelRun?: string;
  backfilled?: boolean;
  /** Lowest burst probability resolved on that UTC day. */
  revision_min_pct?: number;
  /** Highest burst probability resolved on that UTC day. */
  revision_max_pct?: number;
  /** How many runs resolved on that UTC day. */
  revision_runs?: number;
}

/**
 * 2026-10-19 (lane 2b, algorithm-improvement wave): the published history is a run of
 * OBSERVED canonical prints. The 89-point seeded interpolation was retired per the
 * algorithm summit (model v2.6.0), so the file carries no synthetic path any more.
 * The two facts the answer block needs — the first observed point and the latest
 * print with its same-day revision range — are READ from that file, never re-derived.
 */
const TRAJECTORY_ROWS: TrajectoryRowLite[] = Array.isArray(rawTrajectoryHistory)
  ? (rawTrajectoryHistory as unknown as TrajectoryRowLite[])
  : [];
const OBSERVED_ROWS = TRAJECTORY_ROWS.filter(
  (r) =>
    r &&
    typeof r.date === "string" &&
    typeof r.probability === "number" &&
    r.modelRun === "observed",
);
const FIRST_OBSERVED = OBSERVED_ROWS.length ? OBSERVED_ROWS[0] : null;
// The rows are date-ascending, so the last one is the newest observed print.
const LATEST_OBSERVED = OBSERVED_ROWS.length ? OBSERVED_ROWS[OBSERVED_ROWS.length - 1] : null;

/**
 * The canonical daily run (the pipeline's daily snapshot + the trajectory row it
 * writes) starts on 2026-10-19 — the date the observed-history rule took effect.
 */
const CANONICAL_HISTORY_START = "2026-10-19";

/**
 * Section 1 — the answer, above the fold.
 *
 * Order is deliberate: question → number → plain-English meaning → one action.
 * Everything below the hairline is context, not a second call to action.
 */
export function AnswerBlock({
  probability,
  band,
  asOf,
  delta90,
  backfilledCount,
  trackedLabel,
  dealsCount,
  pricedFactors,
  totalFactors,
  drivers,
}: AnswerBlockProps) {
  const firstObservedDate = FIRST_OBSERVED?.date ?? null;

  // 2026-10-19 (lane 2b): the move is measured from the FIRST OBSERVED point, not from
  // a 90-day-old seed — the "in 90 days" wording is retired with the seeded path.
  const deltaText =
    delta90 === null
      ? null
      : firstObservedDate
        ? `${delta90 >= 0 ? "+" : ""}${delta90.toFixed(1)} pts since ${formatAsOf(firstObservedDate)}`
        : `${delta90 >= 0 ? "+" : ""}${delta90.toFixed(1)} pts`;

  const provenance = [asOf ? `As of ${asOf}` : null, deltaText].filter(Boolean).join(" · ");

  // 2026-10-19 (lane 2b): the same-day revision range — the width of the prints that
  // resolved on the as-of day before the inputs settled. Disclosed next to the print.
  const revisionRangeText =
    LATEST_OBSERVED &&
    typeof LATEST_OBSERVED.date === "string" &&
    typeof LATEST_OBSERVED.probability === "number" &&
    typeof LATEST_OBSERVED.revision_min_pct === "number" &&
    typeof LATEST_OBSERVED.revision_max_pct === "number"
      ? `Today's canonical print settled at ${LATEST_OBSERVED.probability.toFixed(1)}% within a same-day revision range of ${LATEST_OBSERVED.revision_min_pct}–${LATEST_OBSERVED.revision_max_pct}%${typeof LATEST_OBSERVED.revision_runs === "number" ? ` over ${LATEST_OBSERVED.revision_runs} resolved runs` : ""} (input corrections pending resolved windows).`
      : null;

  return (
    <section id="answer" aria-labelledby="answer-heading" className="max-w-4xl">
      {/* Provenance strip */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
        <span className="label">12-month burst probability</span>
        <span className={`pill transition-colors duration-300 ${BAND_TONE[band].pillTone}`}>
          {BAND_LABEL[band]}
        </span>
        {provenance && (
          <span className="num text-[14px] text-ink-faint">{provenance}</span>
        )}
      </div>

      {/* 2026-10-19 (lane 2b): the history disclosure. The seeded 90-day interpolation
          is retired, so the answer never implies a reconstructed path: the history is
          a run of observed canonical prints, and the day it covers carries a published
          revision range. 12px metadata floor, existing ink tokens only. */}
      <div className="mt-1.5 space-y-0.5 text-[12px] leading-tight text-ink-faint">
        <p>
          Trajectory history: canonical daily runs begin {formatAsOf(CANONICAL_HISTORY_START)}
          {firstObservedDate ? ` (first observed point ${formatAsOf(firstObservedDate)})` : ""}.
          Prior seeded interpolation retired per algorithm summit (model v2.6.0).
        </p>
        {revisionRangeText && <p>{revisionRangeText}</p>}
        {backfilledCount > 0 && (
          <p>
            {backfilledCount} seeded backfill points are still present in the history file
          </p>
        )}
      </div>

      {/* Question */}
      <h1
        id="answer-heading"
        className="mt-2 text-[30px] font-bold leading-[1.08] tracking-[-0.03em] text-ink sm:text-[44px] sm:leading-[1.04]"
      >
        Will the AI bubble burst?
      </h1>

      {/* Number + plain-English meaning */}
      <div className="mt-3 flex items-end gap-3 sm:gap-5">
        <CountUp
          value={probability}
          decimals={1}
          suffix="%"
          startFrom={Math.min(probability, 40)}
          duration={800}
          className="num text-[46px] font-bold leading-none tracking-[-0.045em] text-ink sm:text-[60px]"
        />
        <span className="max-w-[13rem] pb-1 text-[14px] leading-snug text-ink-muted sm:max-w-xs sm:text-sm">
          Chance the AI build-out breaks, measured over the next 12 months.
        </span>
      </div>

      {/* The same number as a share of the twelve months: one rule, filled to
          the published probability, in the band's own tone. It is a meter,
          not decoration — the reader can see where the odds sit against the
          full range without reading the digits. The track is a fixed height,
          so the fill can never move the page. */}
      <Reveal as="div" className="reveal-flat" delay={160}>
        <div
          className="mt-3.5 h-1.5 w-full max-w-2xl bg-surface-3"
          aria-hidden="true"
        >
          <div
            className={`bar-grow h-full ${BAND_TONE[band].barTone}`}
            style={{ width: `${Math.min(100, Math.max(0, probability))}%` }}
          />
        </div>
      </Reveal>

      {/* Verdict */}
      <p className="mt-3 max-w-2xl text-base leading-relaxed text-ink-muted">
        <span className="font-semibold text-ink">{BAND_LABEL[band]} risk.</span>{" "}
        {BAND_VERDICT[band]}
      </p>

      {/* Single primary action */}
      <div className="mt-4">
        <ScrollLink
          targetId="breakdown"
          className="btn btn-primary min-h-11 w-full text-sm sm:w-auto"
        >
          <span>See the full breakdown</span>
          <ArrowDown className="h-4 w-4" aria-hidden="true" />
        </ScrollLink>
      </div>

      {/* Context rule: tracked volume, deal count, priced factors */}
      <dl className="mt-5 grid grid-cols-3 gap-3 border-t border-rule pt-4 sm:mt-6">
        <div className="min-w-0">
          <dt className="label">Tracked capital</dt>
          <dd className="num mt-0.5 text-base font-semibold text-ink">{trackedLabel}</dd>
        </div>
        <div className="min-w-0">
          <dt className="label">Tracked deals</dt>
          <dd className="num mt-0.5 text-base font-semibold text-ink">{dealsCount}</dd>
        </div>
        <div className="min-w-0">
          <dt className="label">Factors priced</dt>
          <dd className="num mt-0.5 text-base font-semibold text-ink">
            {pricedFactors}/{totalFactors}
          </dd>
        </div>
      </dl>

      {/* Top drivers, named plainly */}
      {drivers.length > 0 && (
        <div className="mt-3.5 flex flex-wrap items-center gap-x-2 gap-y-1.5">
          <span className="label">Pushing it up</span>
          <ul className="flex flex-wrap gap-1.5">
            {drivers.map((driver, index) => {
              const { short, gloss } = factorPlain(driver.id);
              return (
                <li key={driver.id}>
                  <Reveal as="span" className="inline-block" delay={index * 40}>
                    <span title={gloss} className="chip chip-risk">
                      {short}
                      <span className="num font-semibold">+{driver.points.toFixed(1)}</span>
                    </span>
                  </Reveal>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </section>
  );
}
