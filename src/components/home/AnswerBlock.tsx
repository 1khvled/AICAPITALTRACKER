import React from "react";
import Link from "next/link";
import { ArrowDown, ArrowRight, ChevronDown, Info } from "lucide-react";
import type { BubbleBand } from "@/lib/model/types";
import { BAND_LABEL, BAND_TONE, BAND_VERDICT, formatAsOf } from "./copy";
import { ScrollLink } from "./ScrollLink";
import { CountUp } from "@/components/CountUp";
import { Reveal } from "@/components/Reveal";
import rawTrajectoryHistory from "@/data/trajectory-history.json";

export interface HeadlineDriver {
  id: string;
  points: number;
}

/**
 * One row of the index of plain answers. The `answer` is the page's own
 * headline number, computed on the homepage — a reader who scans the list
 * should learn something, not just read a description of a page.
 */
export interface PlainAnswerEntry {
  href: string;
  question: string;
  answer: string;
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
  debtLabel: string;
  dealsCount: number;
  debtDealsCount: number;
  pricedFactors: number;
  totalFactors: number;
  /**
   * Plain-English disclosure: what this print is NOT. Rendered next to the number
   * (before the index of plain answers) so a reader who bounces early still sees it.
   */
  notThis: string[];
  /** The index of plain answers, with each page's own headline number. */
  plainAnswers: PlainAnswerEntry[];
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
  debtLabel,
  dealsCount,
  debtDealsCount,
  pricedFactors,
  totalFactors,
  notThis,
  plainAnswers,
}: AnswerBlockProps) {
  /**
   * The index of plain answers arrives as a prop, with each page's own headline
   * number computed on the homepage. A reader who scans the list should learn
   * something, not just read a description of a page.
   */

  const firstObservedDate = FIRST_OBSERVED?.date ?? null;

  // 2026-10-19 (lane 2b): the move is measured from the FIRST OBSERVED point, not from
  // a 90-day-old seed — the "in 90 days" wording is retired with the seeded path.
  const deltaText =
    delta90 === null
      ? null
      : firstObservedDate
        ? `${delta90 > 0 ? "+" : delta90 < 0 ? "−" : ""}${Math.abs(delta90).toFixed(1)} pts since ${formatAsOf(firstObservedDate)}`
        : `${delta90 > 0 ? "+" : delta90 < 0 ? "−" : ""}${Math.abs(delta90).toFixed(1)} pts`;

  // 2026-10-19 (lane 2b): the same-day revision range — the width of the prints that
  // resolved on the as-of day before the inputs settled. Disclosed next to the print.
  const revisionRangeText = (() => {
    if (
      !LATEST_OBSERVED ||
      typeof LATEST_OBSERVED.date !== "string" ||
      typeof LATEST_OBSERVED.probability !== "number" ||
      typeof LATEST_OBSERVED.revision_min_pct !== "number" ||
      typeof LATEST_OBSERVED.revision_max_pct !== "number"
    ) {
      return null;
    }
    const runs =
      typeof LATEST_OBSERVED.revision_runs === "number" ? LATEST_OBSERVED.revision_runs : null;
    const runLabel = runs === null ? "" : runs === 1 ? " in 1 resolved run" : ` in ${runs} resolved runs`;
    const min = LATEST_OBSERVED.revision_min_pct;
    const max = LATEST_OBSERVED.revision_max_pct;
    const range =
      min === max
        ? `${min.toFixed(1)}%`
        : `${min.toFixed(1)}–${max.toFixed(1)}%`;
    const rangeLabel = min === max ? "" : `, within a same-day range of ${range}`;
    const pending = min === max ? "" : " (input corrections pending resolved windows)";
    return `Today's canonical print settled at ${LATEST_OBSERVED.probability.toFixed(1)}%${runLabel}${rangeLabel}${pending}.`;
  })();

  return (
    <section id="answer" aria-labelledby="answer-heading" className="max-w-4xl">
      {/* Provenance strip */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
        <span className="label">12-month burst probability</span>
        <span className={`pill transition-colors duration-300 ${BAND_TONE[band].pillTone}`}>
          {BAND_LABEL[band]}
        </span>
        {(asOf || deltaText) && (
          <span className="num flex flex-wrap items-center gap-x-2 gap-y-1 text-[14px] text-ink-faint">
            {asOf ? (
              <span>
                As of <span className="whitespace-nowrap">{asOf}</span>
              </span>
            ) : null}
            {deltaText ? (
              <>
                <span className="hidden sm:inline" aria-hidden="true">
                  ·
                </span>
                <span className="whitespace-nowrap">{deltaText}</span>
              </>
            ) : null}
          </span>
        )}
      </div>

      {/* The Question */}
      <h1
        id="answer-heading"
        className="mt-2 text-[30px] font-bold leading-[1.08] tracking-[-0.03em] text-ink sm:text-[44px] sm:leading-[1.04]"
      >
        Will the AI bubble burst in the next 12 months?
      </h1>

      {/* Number + ONE plain-English meaning sentence */}
      <div className="mt-3 flex flex-col sm:flex-row sm:items-end gap-2 sm:gap-5">
        <CountUp
          value={probability}
          decimals={1}
          suffix="%"
          startFrom={Math.min(probability, 40)}
          duration={800}
          className="num text-[46px] font-bold leading-none tracking-[-0.045em] text-ink sm:text-[60px]"
        />
        <p className="max-w-xl pb-1 text-[15px] leading-snug text-ink-muted">
          There is an estimated <strong className="font-semibold text-ink">{probability.toFixed(1)}% chance</strong> the artificial intelligence build-out suffers a sharp market contraction or credit crisis in the next 12 months.
        </p>
      </div>

      {/* Meter bar */}
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

      {/* The Band in plain words */}
      <div className="mt-4 max-w-2xl text-[15px] leading-relaxed text-ink-muted">
        <p>
          <span className="font-semibold text-accent-strong dark:text-accent-ink">{BAND_LABEL[band]} risk:</span>{" "}
          {BAND_VERDICT[band]}
        </p>
        <p className="mt-1 text-[15px] text-ink-subtle">
          In plain English: Big Tech giants (Microsoft, Alphabet, Amazon, Meta) earn enough operating cash flow to fund chip purchases today, but heavy corporate borrowing and extreme lab valuations leave little margin for error if AI adoption slows.
        </p>
      </div>

      {/* What it means in dollars: from the ledger */}
      <div className="mt-5 panel border-l-2 border-l-ink p-4 space-y-1.5 max-w-2xl">
        <p className="label">What it means in dollars</p>
        <p className="text-[15px] leading-relaxed text-ink-muted">
          Behind this probability is <strong className="font-semibold text-ink">{trackedLabel}</strong> of tracked spending and <strong className="font-semibold text-ink">{debtLabel}</strong> of debt across <strong className="font-semibold text-ink">{dealsCount}</strong> verified transactions ({debtDealsCount} involving debt): companies are building data centers faster than AI software produces cash.
        </p>
      </div>

      {/* What this number is not: the doctrine. It sits here, beside the print,
          so the disclosure is never below a chart or an index. */}
      {notThis.length > 0 && (
        <div className="mt-4 max-w-2xl border-t border-rule pt-3.5">
          <p className="label">What {probability.toFixed(1)}% is not</p>
          <ul className="mt-1.5 space-y-1.5 text-[15px] leading-relaxed text-ink-muted">
            {notThis.map((item) => (
              <li key={item} className="flex items-start gap-2">
                <span className="select-none font-bold text-ink-faint" aria-hidden="true">
                  &bull;
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Seven plain-answer pages: the queries people actually search.
          An index, not a grid of boxes: the question first, the answer under
          it, a hairline between the rows, and the whole row is the target.
          It sits directly under the disclosure — the most useful thing after
          the answer, before any chart. */}
      <div className="mt-6 max-w-4xl">
        <p className="label">Answers to what readers search for</p>
        <ul className="mt-1 grid grid-cols-1 gap-x-10 sm:grid-cols-2">
          {plainAnswers.map((entry) => (
            <li key={entry.href} className="border-t border-rule">
              <Link
                href={entry.href}
                className="group flex flex-col gap-0.5 py-3.5"
              >
                <span className="text-[16px] font-semibold tracking-[-0.01em] text-ink underline decoration-transparent decoration-1 underline-offset-[5px] transition-colors group-hover:decoration-rule group-focus-visible:decoration-rule">
                  {entry.question}
                </span>
                <span className="text-[14px] leading-snug text-ink-subtle">
                  {entry.answer}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>

      {/* Single primary action to demoted machinery */}
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <ScrollLink
          targetId="breakdown"
          className="btn btn-primary min-h-11 w-full text-sm sm:w-auto"
        >
          <span>Inspect the quantitative machinery</span>
          <ArrowDown className="h-4 w-4" aria-hidden="true" />
        </ScrollLink>
        <Link
          href="/methodology"
          className="btn min-h-11 w-full text-sm sm:w-auto"
        >
          <span>Read the mathematical methodology</span>
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>

      {/* Context rule: tracked volume, deal count, priced factors */}
      <dl className="mt-6 grid grid-cols-3 gap-3 border-t border-rule pt-4 max-w-2xl">
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

      {/* The provenance of the print. It stays on the page and stays honest -
          it just does not stand between the reader and the answer any more. */}
      <details className="group mt-5 max-w-2xl border-t border-rule pt-3">
        <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 text-[14px] text-ink-muted [&::-webkit-details-marker]:hidden">
          <Info className="h-4 w-4 shrink-0 text-ink-faint" aria-hidden="true" />
          <span className="font-semibold text-ink">How this print was produced</span>
          <ChevronDown
            className="h-4 w-4 shrink-0 text-ink-faint transition-transform group-open:rotate-180"
            aria-hidden="true"
          />
        </summary>
        <div className="mt-2 space-y-1.5 text-[12px] leading-relaxed text-ink-faint">
          <p>
            Trajectory history: canonical daily runs begin {formatAsOf(CANONICAL_HISTORY_START)}
            {firstObservedDate ? ` (first observed point ${formatAsOf(firstObservedDate)})` : ""}.
            Prior seeded interpolation retired per algorithm summit (model v2.6.0).
          </p>
          {revisionRangeText && <p>{revisionRangeText}</p>}
          {backfilledCount > 0 && (
            <p>
              {backfilledCount} seeded backfill {backfilledCount === 1 ? "point is" : "points are"} still
              present in the history file.
            </p>
          )}
        </div>
      </details>
    </section>
  );
}
