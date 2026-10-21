"use client";

import React, { useState, useId } from "react";
import type { FactorContribution } from "@/lib/model/types";
import { factorPlain } from "./copy";
import { Info, ChevronDown, ChevronUp } from "lucide-react";

export interface FactorContributionChartProps {
  contributions: FactorContribution[];
  compositeScore: number;
  systemicContagionPoints?: number;
}

export function FactorContributionChart({
  contributions,
  compositeScore,
  systemicContagionPoints = 2.8,
}: FactorContributionChartProps) {
  const chartId = useId();
  const [activeFactorId, setActiveFactorId] = useState<string | null>(null);
  const [showTable, setShowTable] = useState(false);

  // Separate risk factors from damper and sort by earnedPoints descending
  const riskFactors = contributions
    .filter((f) => f.kind === "risk")
    .sort((a, b) => b.earnedPoints - a.earnedPoints);

  const damperFactor = contributions.find((f) => f.kind === "damper") || null;

  // Maximum absolute contribution points for scaling bar lengths (typically ~8.7 to 10)
  const maxEarned = Math.max(
    ...contributions.map((f) => Math.abs(f.earnedPoints)),
    10
  );

  const activeFactor = contributions.find((f) => f.id === activeFactorId) || null;

  return (
    <figure
      className="card card-flush p-4 sm:p-5 shadow-card"
      role="img"
      aria-labelledby={`${chartId}-heading`}
      aria-describedby={`${chartId}-desc`}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-rule pb-3">
        <div>
          <p className="label">Contribution breakdown</p>
          <h2
            id={`${chartId}-heading`}
            className="text-[16px] font-bold tracking-tight text-ink sm:text-[18px]"
          >
            Factor contributions to the composite print
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="pill pill-risk text-[13px]">
            {riskFactors.length} risk legs
          </span>
          {damperFactor && (
            <span className="pill pill-safe text-[13px]">1 damper</span>
          )}
          <span className="num text-[14px] font-semibold text-ink">
            Score: {compositeScore.toFixed(1)} pts
          </span>
        </div>
      </div>

      <p id={`${chartId}-desc`} className="sr-only">
        Horizontal contribution bar chart showing points contributed by each factor to the {compositeScore.toFixed(1)} composite score. Top driver is {riskFactors[0]?.label} adding {riskFactors[0]?.earnedPoints.toFixed(1)} points.
      </p>

      {/* Chart Canvas: 1 horizontal bar per factor, ordered by contribution */}
      <div className="mt-4 space-y-2.5">
        {riskFactors.map((factor) => {
          const plain = factorPlain(factor.id);
          const widthPct = Math.min(100, Math.max(4, (factor.earnedPoints / maxEarned) * 100));
          const isActive = activeFactorId === factor.id;

          return (
            <div
              key={factor.id}
              tabIndex={0}
              role="button"
              aria-pressed={isActive}
              aria-label={`${plain.short}: +${factor.earnedPoints.toFixed(1)} points contributed, weight ${factor.weightPct} percent`}
              onClick={() => setActiveFactorId(isActive ? null : factor.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setActiveFactorId(isActive ? null : factor.id);
                }
              }}
              className={`group flex flex-col gap-1 rounded-md p-1.5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ink ${
                isActive ? "bg-surface-2" : "hover:bg-surface-2/60"
              }`}
            >
              <div className="flex items-baseline justify-between gap-2 text-[14px]">
                <div className="flex items-baseline gap-1.5 min-w-0">
                  <span className="font-semibold text-ink truncate">
                    {plain.short}
                  </span>
                  <span className="hidden sm:inline text-[13px] text-ink-muted truncate">
                    — {plain.gloss}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="num text-[13px] text-ink-faint">
                    {factor.weightPct}% wt
                  </span>
                  <span className="num font-mono font-semibold text-risk-600 dark:text-risk-400">
                    +{factor.earnedPoints.toFixed(1)} pts
                  </span>
                </div>
              </div>

              {/* Bar track */}
              <div className="relative h-6 w-full rounded bg-surface-3/80 overflow-hidden">
                <div
                  className="h-full rounded bg-[var(--c-risk)]/90 transition-all duration-300"
                  style={{ width: `${widthPct}%` }}
                />
                <span className="absolute inset-y-0 left-2 flex items-center num font-mono text-[12px] font-bold text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.6)]">
                  +{factor.earnedPoints.toFixed(1)}
                </span>
              </div>

              {/* Inline detail if active */}
              {isActive && (
                <div className="mt-1 rounded border border-rule bg-surface p-2.5 text-[13px] leading-relaxed text-ink-muted">
                  <div className="font-medium text-ink">{factor.label}</div>
                  <div className="font-mono text-[12px] text-ink-subtle mt-0.5">
                    {factor.reading.reading}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* Systemic Contagion Synergy bar */}
        {systemicContagionPoints > 0 && (
          <div className="flex flex-col gap-1 rounded-md p-1.5 bg-surface-2/40">
            <div className="flex items-baseline justify-between gap-2 text-[14px]">
              <div className="flex items-baseline gap-1.5 min-w-0">
                <span className="font-semibold text-ink">
                  Systemic credit contagion
                </span>
                <span className="hidden sm:inline text-[13px] text-ink-muted">
                  — Non-linear cross-debt refinancing interaction
                </span>
              </div>
              <span className="num font-mono font-semibold text-risk-600 dark:text-risk-400 shrink-0">
                +{systemicContagionPoints.toFixed(1)} pts
              </span>
            </div>
            <div className="relative h-6 w-full rounded bg-surface-3/80 overflow-hidden">
              <div
                className="h-full rounded bg-[var(--c-cat-navy)] transition-all duration-300"
                style={{
                  width: `${Math.min(100, Math.max(4, (systemicContagionPoints / maxEarned) * 100))}%`,
                }}
              />
              <span className="absolute inset-y-0 left-2 flex items-center num font-mono text-[12px] font-bold text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.6)]">
                +{systemicContagionPoints.toFixed(1)}
              </span>
            </div>
          </div>
        )}

        {/* Real-Use Damper bar (pulls score down) */}
        {damperFactor && (
          <div
            tabIndex={0}
            role="button"
            aria-pressed={activeFactorId === damperFactor.id}
            aria-label={`${factorPlain(damperFactor.id).short}: ${damperFactor.earnedPoints.toFixed(1)} points, pulls composite down`}
            onClick={() => setActiveFactorId(activeFactorId === damperFactor.id ? null : damperFactor.id)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setActiveFactorId(activeFactorId === damperFactor.id ? null : damperFactor.id);
              }
            }}
            className={`group flex flex-col gap-1 rounded-md p-1.5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ink ${
              activeFactorId === damperFactor.id ? "bg-surface-2" : "hover:bg-surface-2/60"
            }`}
          >
            <div className="flex items-baseline justify-between gap-2 text-[14px]">
              <div className="flex items-baseline gap-1.5 min-w-0">
                <span className="font-semibold text-safe-700 dark:text-safe-400">
                  {factorPlain(damperFactor.id).short} (damper)
                </span>
                <span className="hidden sm:inline text-[13px] text-ink-muted truncate">
                  — {factorPlain(damperFactor.id).gloss}
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="num text-[13px] text-ink-faint">
                  {damperFactor.weightPct}% wt
                </span>
                <span className="num font-mono font-semibold text-safe-700 dark:text-safe-400">
                  {damperFactor.earnedPoints.toFixed(1)} pts
                </span>
              </div>
            </div>

            {/* Damper track */}
            <div className="relative h-6 w-full rounded bg-surface-3/80 overflow-hidden">
              <div
                className="h-full rounded bg-safe-600 transition-all duration-300"
                style={{
                  width: `${Math.min(100, Math.max(4, (Math.abs(damperFactor.earnedPoints) / maxEarned) * 100))}%`,
                }}
              />
              <span className="absolute inset-y-0 left-2 flex items-center num font-mono text-[12px] font-bold text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.6)]">
                {damperFactor.earnedPoints.toFixed(1)}
              </span>
            </div>

            {activeFactorId === damperFactor.id && (
              <div className="mt-1 rounded border border-rule bg-surface p-2.5 text-[13px] leading-relaxed text-ink-muted">
                <div className="font-medium text-ink">{damperFactor.label}</div>
                <div className="font-mono text-[12px] text-ink-subtle mt-0.5">
                  {damperFactor.reading.reading}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Toggle raw table button */}
      <div className="mt-3 flex items-center justify-between border-t border-rule pt-2">
        <button
          type="button"
          onClick={() => setShowTable(!showTable)}
          className="flex min-h-[44px] items-center gap-1.5 text-[13px] font-medium text-ink-subtle hover:text-ink transition-colors"
        >
          <span>{showTable ? "Hide data table" : "Show data table"}</span>
          {showTable ? (
            <ChevronUp className="h-4 w-4" aria-hidden="true" />
          ) : (
            <ChevronDown className="h-4 w-4" aria-hidden="true" />
          )}
        </button>
        <span className="num text-[12px] text-ink-faint">
          Σ {riskFactors.reduce((s, f) => s + f.earnedPoints, 0).toFixed(1)} risk + {systemicContagionPoints.toFixed(1)} contagion − {Math.abs(damperFactor?.earnedPoints ?? 0).toFixed(1)} damper = {compositeScore.toFixed(1)} pts
        </span>
      </div>

      {/* Accessible Table Fallback / View */}
      <div className={showTable ? "mt-3 overflow-x-auto rounded-lg border border-rule" : "sr-only"}>
        <table className="w-full text-left text-[14px]">
          <caption className="sr-only">
            Factor contributions to the composite score: published weights, earned points, and readings.
          </caption>
          <thead className="bg-surface-2 text-ink-subtle">
            <tr>
              <th scope="col" className="p-2.5 font-medium">Factor</th>
              <th scope="col" className="p-2.5 font-medium">Kind</th>
              <th scope="col" className="p-2.5 text-right font-medium">Weight</th>
              <th scope="col" className="p-2.5 text-right font-medium">Earned Points</th>
              <th scope="col" className="p-2.5 font-medium">Reading</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-rule">
            {riskFactors.map((f) => (
              <tr key={f.id} className="hover:bg-surface-2/40">
                <th scope="row" className="p-2.5 font-medium text-ink">{f.label}</th>
                <td className="p-2.5 text-ink-muted">Risk</td>
                <td className="num p-2.5 text-right text-ink-muted">{f.weightPct}%</td>
                <td className="num p-2.5 text-right font-semibold text-risk-600">+{f.earnedPoints.toFixed(1)}</td>
                <td className="p-2.5 font-mono text-[12px] text-ink-faint">{f.reading.reading}</td>
              </tr>
            ))}
            {systemicContagionPoints > 0 && (
              <tr className="hover:bg-surface-2/40">
                <th scope="row" className="p-2.5 font-medium text-ink">Systemic credit contagion</th>
                <td className="p-2.5 text-ink-muted">Contagion</td>
                <td className="num p-2.5 text-right text-ink-muted">—</td>
                <td className="num p-2.5 text-right font-semibold text-risk-600">+{systemicContagionPoints.toFixed(1)}</td>
                <td className="p-2.5 font-mono text-[12px] text-ink-faint">Non-linear interaction term</td>
              </tr>
            )}
            {damperFactor && (
              <tr className="hover:bg-surface-2/40">
                <th scope="row" className="p-2.5 font-medium text-ink">{damperFactor.label}</th>
                <td className="p-2.5 text-safe-700">Damper</td>
                <td className="num p-2.5 text-right text-ink-muted">{damperFactor.weightPct}%</td>
                <td className="num p-2.5 text-right font-semibold text-safe-700">{damperFactor.earnedPoints.toFixed(1)}</td>
                <td className="p-2.5 font-mono text-[12px] text-ink-faint">{damperFactor.reading.reading}</td>
              </tr>
            )}
          </tbody>
          <tfoot className="bg-surface-3/60 font-semibold text-ink border-t border-rule">
            <tr>
              <th scope="row" className="p-2.5">Composite Score</th>
              <td className="p-2.5" colSpan={2}>9 evaluated factors</td>
              <td className="num p-2.5 text-right">{compositeScore.toFixed(1)} pts</td>
              <td className="p-2.5 text-[12px] text-ink-muted">Mapped through sigmoid to burst probability</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </figure>
  );
}
