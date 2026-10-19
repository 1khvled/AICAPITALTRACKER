import React from "react";
import { ArrowDown } from "lucide-react";
import type { BubbleBand } from "@/lib/model/types";
import { BAND_LABEL, BAND_TONE, BAND_VERDICT, factorPlain } from "./copy";
import { ScrollLink } from "./ScrollLink";

export interface HeadlineDriver {
  id: string;
  points: number;
}

interface AnswerBlockProps {
  probability: number;
  band: BubbleBand;
  asOf: string | null;
  /** Point change over the published 90-day trajectory, if available. */
  delta90: number | null;
  /**
   * How many points of the published 90-day trajectory were seeded/backfilled by
   * the pipeline rather than observed. 0 = the curve is fully recorded.
   */
  backfilledCount: number;
  trackedLabel: string;
  dealsCount: number;
  pricedFactors: number;
  totalFactors: number;
  drivers: HeadlineDriver[];
}

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
  const deltaText =
    delta90 === null
      ? null
      : `${delta90 >= 0 ? "+" : ""}${delta90.toFixed(1)} pts in 90 days`;

  const provenance = [asOf ? `As of ${asOf}` : null, deltaText].filter(Boolean).join(" · ");

  return (
    <section id="answer" aria-labelledby="answer-heading" className="max-w-4xl">
      {/* Provenance strip */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
        <span className="label">12-month burst probability</span>
        <span className={`pill ${BAND_TONE[band].pillTone}`}>{BAND_LABEL[band]}</span>
        {provenance && (
          <span className="num text-[14px] text-ink-faint">{provenance}</span>
        )}
        {/* 2026-10-19 (round-2 consolidation): the 90-day curve is partly seeded by the
            pipeline, not observed. Say so next to the delta it produces, so the move is
            never read as 90 days of recorded market history. 12px metadata floor,
            existing ink token only — renders only when backfilled rows exist. */}
        {backfilledCount > 0 && (
          <span className="text-[12px] leading-tight text-ink-faint">
            90-day history includes {backfilledCount} seeded backfill points
          </span>
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
        <span className="num text-[46px] font-bold leading-none tracking-[-0.045em] text-ink sm:text-[60px]">
          {probability.toFixed(1)}%
        </span>
        <span className="max-w-[13rem] pb-1 text-[14px] leading-snug text-ink-muted sm:max-w-xs sm:text-sm">
          Chance the AI build-out breaks, measured over the next 12 months.
        </span>
      </div>

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
            {drivers.map((driver) => {
              const { short, gloss } = factorPlain(driver.id);
              return (
                <li key={driver.id}>
                  <span title={gloss} className="chip chip-risk">
                    {short}
                    <span className="num font-semibold">+{driver.points.toFixed(1)}</span>
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </section>
  );
}
