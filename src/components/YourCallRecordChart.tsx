"use client";

import React, { useState, useId, useMemo } from "react";
import type { CallRecord, ObservedPrint } from "@/lib/predictions";
import { utcDayKey } from "@/lib/predictions";
import { formatAsOf } from "@/components/home/copy";
import { Target, TrendingUp, Calendar, Clock, ChevronDown, ChevronUp } from "lucide-react";

export interface YourCallRecordChartProps {
  records: CallRecord[];
  observedRows: ObservedPrint[];
  currentModelPrint: number;
  currentAsOf: string;
}

const toDayKey = (s: string): string => utcDayKey(s) ?? s.slice(0, 10);

export function YourCallRecordChart({
  records,
  observedRows,
  currentModelPrint,
  currentAsOf,
}: YourCallRecordChartProps) {
  const chartId = useId();
  const [hoveredCallId, setHoveredCallId] = useState<string | null>(null);
  const [showTable, setShowTable] = useState(false);

  // If no calls recorded yet, render the clear guidance empty state (not an empty chart)
  if (records.length === 0) {
    return (
      <div
        className="rounded-lg border border-dashed border-rule-strong bg-surface-2/40 p-8 text-center space-y-3"
        role="region"
        aria-label="Your forecast record against the model"
      >
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-surface-3 text-ink-muted">
          <Target className="h-6 w-6" aria-hidden="true" />
        </div>
        <div className="space-y-1">
          <h3 className="text-base font-bold text-ink">
            No calls on record yet
          </h3>
          <p className="mx-auto max-w-md text-sm text-ink-muted leading-relaxed">
            Use the slider above to set your 12-month AI bubble burst probability and record your call.
            Your forecast will be plotted here as a point against the model&apos;s published trajectory,
            with your distance from the print tracked over time.
          </p>
        </div>
        <div className="pt-2">
          <button
            type="button"
            onClick={() => {
              const slider = document.getElementById("yc-slider");
              slider?.scrollIntoView({ behavior: "smooth", block: "center" });
              slider?.focus();
            }}
            className="btn btn-primary min-h-[44px] text-[13px] px-4 font-semibold"
          >
            Record your first call above
          </button>
        </div>
      </div>
    );
  }

  // Combine timeline dates from observed model prints and reader's calls
  const allDates = Array.from(
    new Set([
      ...observedRows.map((r) => r.date),
      ...records.map((r) => toDayKey(r.submittedAt)),
      currentAsOf,
    ])
  ).sort();

  // Model lookup by date
  const modelByDate = new Map<string, number>();
  observedRows.forEach((r) => modelByDate.set(r.date, r.probability));
  if (!modelByDate.has(currentAsOf)) {
    modelByDate.set(currentAsOf, currentModelPrint);
  }

  // Chart layout coordinates
  const W = 720;
  const H = 240;
  const padLeft = 45;
  const padRight = 45;
  const padTop = 25;
  const padBottom = 35;

  const chartW = W - padLeft - padRight;
  const chartH = H - padTop - padBottom;

  // Y scale bounds (typically 0% to 100%, or dynamic tight bounds with 10% padding)
  const allValues = [
    ...records.map((r) => r.probabilityPct),
    ...observedRows.map((r) => r.probability),
    currentModelPrint,
  ];
  const minVal = Math.max(0, Math.floor(Math.min(...allValues) / 10) * 10 - 10);
  const maxVal = Math.min(100, Math.ceil(Math.max(...allValues) / 10) * 10 + 10);
  const valRange = maxVal - minVal || 1;

  const getX = (dateStr: string) => {
    const idx = allDates.indexOf(dateStr);
    if (idx === -1 || allDates.length <= 1) return padLeft + chartW / 2;
    return padLeft + (idx / (allDates.length - 1)) * chartW;
  };

  const getY = (val: number) => {
    return padTop + chartH - ((val - minVal) / valRange) * chartH;
  };

  // Model line path
  const modelPoints = allDates
    .filter((d) => modelByDate.has(d))
    .map((d) => `${getX(d).toFixed(1)},${getY(modelByDate.get(d)!).toFixed(1)}`)
    .join(" ");

  const activeCall = records.find((r) => r.id === hoveredCallId) || records[records.length - 1];

  return (
    <figure
      className="space-y-4"
      role="img"
      aria-labelledby={`${chartId}-heading`}
      aria-describedby={`${chartId}-desc`}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <div>
          <p className="label flex items-center gap-1.5">
            <span
              className="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--c-accent)]"
              aria-hidden="true"
            />
            Personal Forecast Chart
          </p>
          <h3
            id={`${chartId}-heading`}
            className="text-[16px] font-bold text-ink sm:text-[18px]"
          >
            Your calls plotted against the model reference trajectory
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="pill text-[12px] font-semibold text-ink">
            {records.length} {records.length === 1 ? "call" : "calls"} plotted
          </span>
          <span className="num text-[13px] text-ink-muted">
            Latest: {records[records.length - 1].probabilityPct}% (Model: {records[records.length - 1].modelPrintPct.toFixed(1)}%)
          </span>
        </div>
      </div>

      <p id={`${chartId}-desc`} className="sr-only">
        Chart plotting your personal {records.length} probability calls as points against the model trajectory reference line. The vertical distance between your point and the model line represents your error or gap.
      </p>

      {/* SVG Visualization Canvas */}
      <div className="rounded-lg border border-rule bg-surface p-3 sm:p-4">
        {/* Legend */}
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2 border-b border-rule pb-2 text-[12px]">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span
                className="inline-block h-3 w-3 rounded-full border-2 border-white shadow-sm"
                style={{ backgroundColor: "var(--c-accent)" }}
                aria-hidden="true"
              />
              <span className="font-semibold text-ink">Your Calls (points)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span
                className="inline-block h-0.5 w-5 border-t-2 border-dashed"
                style={{ borderColor: "var(--c-cat-steel)" }}
                aria-hidden="true"
              />
              <span className="text-ink-muted">Model Trajectory (reference line)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span
                className="inline-block h-3.5 w-0.5"
                style={{ backgroundColor: "var(--c-accent)" }}
                aria-hidden="true"
              />
              <span className="text-ink-faint">Error / Gap distance</span>
            </div>
          </div>
          <span className="num text-ink-faint">
            Range: {minVal}% – {maxVal}%
          </span>
        </div>

        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full h-auto select-none overflow-visible"
          aria-hidden="true"
        >
          {/* Horizontal Grid lines */}
          {[minVal, minVal + Math.round(valRange * 0.33), minVal + Math.round(valRange * 0.66), maxVal].map((tick) => {
            const y = getY(tick);
            return (
              <g key={tick}>
                <line
                  x1={padLeft}
                  y1={y}
                  x2={W - padRight}
                  y2={y}
                  stroke="rgb(var(--c-rule))"
                  strokeWidth="1"
                  strokeDasharray="2 3"
                />
                <text
                  x={padLeft - 8}
                  y={y + 4}
                  textAnchor="end"
                  className="num font-mono text-[12px] fill-ink-faint"
                >
                  {tick}%
                </text>
              </g>
            );
          })}

          {/* Model Reference Line */}
          {modelPoints && (
            <polyline
              fill="none"
              stroke="var(--c-cat-steel)"
              strokeWidth="2.5"
              strokeDasharray="5 3"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={modelPoints}
            />
          )}

          {/* Vertical Error / Gap Distance stems for each reader call */}
          {records.map((call) => {
            const callDate = toDayKey(call.submittedAt);
            const cx = getX(callDate);
            const cy = getY(call.probabilityPct);
            const modelY = getY(call.modelPrintPct);
            const gap = call.probabilityPct - call.modelPrintPct;

            return (
              <g key={`stem-${call.id}`}>
                {/* Vertical distance line */}
                <line
                  x1={cx}
                  y1={cy}
                  x2={cx}
                  y2={modelY}
                  stroke="var(--c-accent)"
                  strokeWidth="1.75"
                  strokeOpacity="0.8"
                />
                {/* Distance label pill */}
                <rect
                  x={cx + 24}
                  y={(cy + modelY) / 2 - 8}
                  width="54"
                  height="16"
                  rx="3"
                  fill="rgb(var(--c-surface))"
                  stroke="rgb(var(--c-rule))"
                  strokeWidth="1"
                />
                <text
                  x={cx + 51}
                  y={(cy + modelY) / 2 + 4}
                  textAnchor="middle"
                  className="num font-mono text-[12px] font-bold fill-ink"
                >
                  {gap >= 0 ? "+" : ""}{gap.toFixed(1)} pt
                </text>
              </g>
            );
          })}

          {/* Reader Call Points */}
          {records.map((call) => {
            const callDate = toDayKey(call.submittedAt);
            const cx = getX(callDate);
            const cy = getY(call.probabilityPct);
            const isHovered = hoveredCallId === call.id;

            return (
              <g
                key={`point-${call.id}`}
                tabIndex={0}
                role="button"
                aria-label={`Call from ${callDate}: ${call.probabilityPct}%, model was ${call.modelPrintPct.toFixed(1)}%`}
                onMouseEnter={() => setHoveredCallId(call.id)}
                onMouseLeave={() => setHoveredCallId(null)}
                onFocus={() => setHoveredCallId(call.id)}
                onBlur={() => setHoveredCallId(null)}
                className="cursor-pointer focus:outline-none"
              >
                {/* Outer halo if active */}
                {isHovered && (
                  <circle
                    cx={cx}
                    cy={cy}
                    r="10"
                    fill="var(--c-accent)"
                    fillOpacity="0.25"
                  />
                )}
                <circle
                  cx={cx}
                  cy={cy}
                  r="6"
                  fill="var(--c-accent)"
                  stroke="rgb(var(--c-surface))"
                  strokeWidth="2"
                />
                <text
                  x={cx}
                  y={cy - 10}
                  textAnchor="middle"
                  className="num font-mono text-[12px] font-bold fill-ink drop-shadow-sm"
                >
                  {call.probabilityPct}%
                </text>
                <text
                  x={cx}
                  y={H - 12}
                  textAnchor="middle"
                  className="num text-[12px] font-medium fill-ink-muted"
                >
                  {callDate.slice(5)}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Selected call details bar */}
        {activeCall && (
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2 rounded-md border border-rule bg-surface-2 p-2.5 text-[13px]">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-ink">
                Call on {formatAsOf(toDayKey(activeCall.submittedAt))}:
              </span>
              <span className="num font-mono font-bold text-accent-strong dark:text-accent-ink">
                You: {activeCall.probabilityPct}%
              </span>
              <span>·</span>
              <span className="num font-mono text-ink-muted">
                Model: {activeCall.modelPrintPct.toFixed(1)}%
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="num font-mono font-semibold">
                Gap: {activeCall.probabilityPct - activeCall.modelPrintPct >= 0 ? "+" : ""}
                {(activeCall.probabilityPct - activeCall.modelPrintPct).toFixed(1)} pts
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Accessible Table Fallback / View */}
      <div className="flex items-center justify-between pt-1">
        <button
          type="button"
          onClick={() => setShowTable(!showTable)}
          className="flex min-h-[44px] items-center gap-1.5 text-[13px] font-medium text-ink-subtle hover:text-ink transition-colors"
        >
          <span>{showTable ? "Hide data table" : "Show data table of personal calls"}</span>
          {showTable ? (
            <ChevronUp className="h-4 w-4" aria-hidden="true" />
          ) : (
            <ChevronDown className="h-4 w-4" aria-hidden="true" />
          )}
        </button>
      </div>

      <div className={showTable ? "overflow-x-auto rounded-lg border border-rule" : "sr-only"}>
        <table className="w-full text-left text-[14px]">
          <caption className="sr-only">
            Personal call records: Date, Your Forecast, Model Print on that date, and Gap.
          </caption>
          <thead className="bg-surface-2 text-ink-subtle">
            <tr>
              <th scope="col" className="p-2.5 font-medium">Date</th>
              <th scope="col" className="p-2.5 text-right font-medium">Your Call</th>
              <th scope="col" className="p-2.5 text-right font-medium">Model Print</th>
              <th scope="col" className="p-2.5 text-right font-medium">Gap</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-rule">
            {records.map((r) => {
              const gap = r.probabilityPct - r.modelPrintPct;
              return (
                <tr key={r.id} className="hover:bg-surface-2/40">
                  <th scope="row" className="p-2.5 font-medium text-ink">{toDayKey(r.submittedAt)}</th>
                  <td className="num p-2.5 text-right font-semibold text-ink">{r.probabilityPct}%</td>
                  <td className="num p-2.5 text-right text-ink-muted">{r.modelPrintPct.toFixed(1)}%</td>
                  <td className="num p-2.5 text-right font-semibold">
                    {gap >= 0 ? "+" : ""}{gap.toFixed(1)} pts
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </figure>
  );
}
