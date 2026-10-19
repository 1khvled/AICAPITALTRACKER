import React from "react";
import Link from "next/link";
import type { FactorContribution } from "@/lib/model/types";
import { MODEL_FACTORS } from "@/lib/model/factors";
import { factorPlain } from "./copy";

const EXPLAIN_BY_ID = new Map(MODEL_FACTORS.map((factor) => [factor.id, factor.explain]));

interface DriverSectionProps {
  /** Risk contributions, already ordered lightest → heaviest by the caller. */
  drivers: FactorContribution[];
  /** The one factor that argues the score down, if it is priced. */
  damper: FactorContribution | null;
  shownCount: number;
  totalCount: number;
}

function severityTone(score: number): string {
  if (score >= 0.6) return "bg-risk-500";
  if (score >= 0.35) return "bg-caution-500";
  return "bg-ink-faint";
}

/**
 * Section 2 — "What's driving it".
 *
 * A ruled list, not a card grid: the reading, the model's own explanation and
 * the published weight, so a reader can check the arithmetic themselves.
 */
export function DriverSection({
  drivers,
  damper,
  shownCount,
  totalCount,
}: DriverSectionProps) {
  const heaviestId = drivers.length > 0 ? drivers[drivers.length - 1].id : null;

  return (
    <div className="mt-8 sm:mt-10">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h3 className="text-lg font-bold tracking-[-0.02em] text-ink sm:text-xl">
          What&apos;s driving it
        </h3>
        <span className="label">{shownCount} of {totalCount} factors, lightest to heaviest</span>
      </div>

      <ol className="mt-2 divide-y divide-rule border-y border-rule">
        {drivers.map((factor) => {
          const plain = factorPlain(factor.id);
          const isHeaviest = factor.id === heaviestId;

          return (
            <li key={factor.id} className="py-4">
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <p className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                  <span className="text-[15px] font-semibold text-ink">{plain.short}</span>
                  <span className="text-[14px] text-ink-faint">{plain.gloss}</span>
                  {isHeaviest && <span className="chip">Heaviest</span>}
                </p>
                <p className="flex items-baseline gap-1.5">
                  <span className="chip chip-risk num font-semibold">
                    +{factor.earnedPoints.toFixed(1)} pts
                  </span>
                  <span className="num text-[14px] text-ink-faint">{factor.weightPct}% weight</span>
                </p>
              </div>

              {/* Severity meter: the model's own normalized reading, 0–100 */}
              <div className="mt-2 flex items-center gap-2">
                <span className="h-1 w-full max-w-[180px] bg-surface-3">
                  <span
                    className={`block h-1 ${severityTone(factor.reading.score)}`}
                    style={{ width: `${Math.round(factor.reading.score * 100)}%` }}
                  />
                </span>
                <span className="num text-[14px] text-ink-faint">
                  reading {Math.round(factor.reading.score * 100)}/100
                  {factor.reading.coverage < 1
                    ? ` · priced from ${Math.round(factor.reading.coverage * 100)}% of inputs`
                    : ""}
                </span>
              </div>

              <p className="mt-2 max-w-3xl text-sm leading-relaxed text-ink-muted">
                {EXPLAIN_BY_ID.get(factor.id)}
              </p>
              <p className="mt-1 break-words font-mono text-[14px] leading-relaxed text-ink-faint">
                {factor.reading.reading}
              </p>
            </li>
          );
        })}

        {damper && (
          <li className="py-4">
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
              <p className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                <span className="text-[15px] font-semibold text-ink">
                  {factorPlain(damper.id).short}
                </span>
                <span className="text-[14px] text-ink-faint">{factorPlain(damper.id).gloss}</span>
              </p>
              <p className="flex items-baseline gap-1.5">
                <span className="chip chip-safe num font-semibold">
                  {damper.earnedPoints.toFixed(1)} pts
                </span>
                <span className="num text-[14px] text-ink-faint">{damper.weightPct}% weight</span>
              </p>
            </div>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-ink-muted">
              {EXPLAIN_BY_ID.get(damper.id)}
            </p>
            <p className="mt-1 break-words font-mono text-[14px] leading-relaxed text-ink-faint">
              {damper.reading.reading}
            </p>
          </li>
        )}
      </ol>

      <p className="mt-3 text-[14px] text-ink-faint">
        Weights and formulas are published in full on the{" "}
        <Link href="/methodology" className="prose-a">
          methodology page
        </Link>
        .
      </p>
    </div>
  );
}
