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
}: AnswerBlockProps) {
  /**
   * The questions people actually type, and what each page answers.
   *
   * The order is the order a reader arrives in: the verdict, then the money,
   * then the debt, then the two questions about OpenAI, then the macro
   * question, then the one the whole site is really asking.
   */
  const plainAnswers: { href: string; question: string; answer: string }[] = [
    {
      href: "/will-the-ai-bubble-burst",
      question: "Will the AI bubble burst?",
      answer: "The 12-month outlook, the trajectory, and what would flip the odds",
    },
    {
      href: "/how-much-is-being-spent-on-ai",
      question: "How much is being spent?",
      answer: `All of it - ${trackedLabel} across compute, data centers and GPU hardware`,
    },
    {
      href: "/how-much-ai-debt-there-is",
      question: "How much AI debt is there?",
      answer: `${debtLabel} in 24 loans, convertible bonds and credit facilities`,
    },
    {
      href: "/will-openai-ipo",
      question: "Will OpenAI IPO in 2026?",
      answer: "The market odds, the valuation talks, and the S-1 checklist",
    },
    {
      href: "/what-is-cpi-doing-to-ai",
      question: "What is CPI doing to AI?",
      answer: "How inflation and bond yields drive the cost of data center debt",
    },
    {
      href: "/who-is-funding-openai",
      question: "Who is funding OpenAI?",
      answer: "Disclosed rounds, Microsoft, SoftBank, and the circularity question",
    },
    {
      href: "/is-ai-spending-too-much",
      question: "Is AI spending too much?",
      answer: "The gap between what the build-out costs and what it earns",
    },
  ];

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
        <p className="mt-1 text-[14px] text-ink-subtle">
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

      {/* The provenance of the print. It stays on the page and stays honest -
          it just does not stand between the reader and the answer any more. */}
      <details className="mt-5 max-w-2xl border-t border-rule pt-3">
        <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 text-[14px] text-ink-muted [&::-webkit-details-marker]:hidden">
          <Info className="h-4 w-4 shrink-0 text-ink-faint" aria-hidden="true" />
          <span className="font-semibold text-ink">How this print was produced</span>
          <ChevronDown className="h-4 w-4 shrink-0 text-ink-faint" aria-hidden="true" />
        </summary>
        <div className="mt-2 space-y-1.5 text-[12px] leading-relaxed text-ink-faint">
          <p>
            Trajectory history: canonical daily runs begin {formatAsOf(CANONICAL_HISTORY_START)}
            {firstObservedDate ? ` (first observed point ${formatAsOf(firstObservedDate)})` : ""}.
            Prior seeded interpolation retired per algorithm summit (model v2.6.0).
          </p>
          {revisionRangeText && <p>{revisionRangeText}</p>}
          {backfilledCount > 0 && (
            <p>{backfilledCount} seeded backfill points are still present in the history file</p>
          )}
        </div>
      </details>

      {/* Seven plain-answer pages: the queries people actually search.
          An index, not a grid of boxes: the question first, the answer under
          it, a hairline between the rows, and the whole row is the target. */}
      <div className="mt-7 max-w-4xl">
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
    </section>
  );
}
