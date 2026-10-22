"use client";

import React, { useState, useId, useMemo } from "react";
import {
  getChartAriaProps,
  generateChartDescription,
  ChartAnnouncer,
} from "@/lib/chart-a11y";
import { ArrowUpRight, Scale, ShieldAlert, Info } from "lucide-react";

export interface ModelVsMarketGapChartProps {
  modelProbability: number;
  modelScore: number;
  contract2026Prob?: number;
  contract2027Prob?: number;
  marketBandLow: number;
  marketBandHigh: number;
  marketBandCentral: number;
  contract2026Label?: string;
  contract2027Label?: string;
}

export function ModelVsMarketGapChart({
  modelProbability,
  modelScore,
  contract2026Prob,
  contract2027Prob,
  marketBandLow,
  marketBandHigh,
  marketBandCentral,
  contract2026Label = "Dec 2026 Contract",
  contract2027Label = "Jun 2027 Contract",
}: ModelVsMarketGapChartProps) {
  const [hoveredPoint, setHoveredPoint] = useState<string | null>(null);

  /** A contract price the daily feed has not published yet prints as an em
   * dash - never a stale number carried forward. */
  const pct = (value: number | undefined) =>
    typeof value === "number" ? value.toFixed(1) : "—";
  const gapVsTwelveMonth =
    typeof contract2027Prob === "number"
      ? Math.round((modelProbability - contract2027Prob) * 10) / 10
      : null;
  const gapVsBandCentral = Math.round((modelProbability - marketBandCentral) * 10) / 10;

  const chartUid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const chartTitleId = `${chartUid}-title`;
  const chartDescId = `${chartUid}-desc`;
  const chartTitle = `Canonical Gap — Site Model (${modelProbability.toFixed(1)}%) vs Prediction Market (${pct(contract2027Prob)}% / ${marketBandLow.toFixed(1)}–${marketBandHigh.toFixed(1)}% Band)`;

  const chartDescription = `The site's quantitative model prints ${modelProbability.toFixed(1)}% bubble burst probability (score ${modelScore.toFixed(1)}). Polymarket prices the 12-month contract at ${pct(contract2027Prob)}% YES, with a published market-implied band of ${marketBandLow.toFixed(1)}% to ${marketBandHigh.toFixed(1)}% (central ${marketBandCentral.toFixed(1)}%). The Dec-2026 contract sits at ${pct(contract2026Prob)}%. ${
    gapVsTwelveMonth === null
      ? "The daily feed has not published the 12-month contract price, so the canonical gap cannot be stated today."
      : `The canonical gap is +${gapVsTwelveMonth.toFixed(1)} percentage points above the market contract.`
  }`;

  const chartAria = getChartAriaProps({
    title: chartTitle,
    description: chartDescription,
    labelledBy: chartTitleId,
    describedBy: chartDescId,
  });

  // SVG Geometry
  const width = 860;
  const height = 250;
  const pad = { left: 40, right: 40, top: 40, bottom: 45 };
  const innerW = width - pad.left - pad.right;
  const maxAxisVal = 50; // 0% to 50% scale covers all readings comfortably

  const scaleX = (val: number) => pad.left + (Math.min(Math.max(0, val), maxAxisVal) / maxAxisVal) * innerW;

  const x2026 = typeof contract2026Prob === "number" ? scaleX(contract2026Prob) : null;
  const x2027 = typeof contract2027Prob === "number" ? scaleX(contract2027Prob) : null;
  const xBandLow = scaleX(marketBandLow);
  const xBandHigh = scaleX(marketBandHigh);
  const xBandCentral = scaleX(marketBandCentral);
  const xModel = scaleX(modelProbability);

  const isClose =
    x2026 !== null && x2027 !== null && Math.abs(x2026 - x2027) < 85;

  const y2026Val = 135;
  const y2026Lbl = 150;
  const y2027Val = isClose ? 168 : 135;
  const y2027Lbl = isClose ? 183 : 150;
  const line2027Bottom = isClose ? 164 : 128;

  const axisTicks = [0, 10, 20, 30, 40, 50];

  const announcerText = hoveredPoint === "model"
    ? `Site Model print: ${modelProbability.toFixed(1)}% burst probability. Composite score: ${modelScore.toFixed(1)}.`
    : hoveredPoint === "band"
    ? `Published 12-month market band: ${marketBandLow.toFixed(1)}% to ${marketBandHigh.toFixed(1)}% (central ${marketBandCentral.toFixed(1)}%).`
    : hoveredPoint === "2027"
    ? `${contract2027Label}: ${pct(contract2027Prob)}% YES.`
    : hoveredPoint === "2026"
    ? `${contract2026Label}: ${pct(contract2026Prob)}% YES.`
    : chartDescription;

  return (
    <figure className="m-0 space-y-4">
      <ChartAnnouncer message={announcerText} />

      {/* Header and Gap Metric */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-rule pb-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="label">Canonical Model Gap</span>
            <span className="pill">Single Site Instance</span>
            <span className="num text-[14px] font-semibold text-ink">
              {gapVsTwelveMonth === null
                ? "— vs Contract"
                : `+${gapVsTwelveMonth.toFixed(1)} pts vs Contract`}
            </span>
          </div>
          <h3 className="text-lg sm:text-xl font-bold tracking-tight text-ink mt-1">
            Model vs. Market Consensus: The Canonical Gap
          </h3>
          <p className="text-[14px] text-ink-muted">
            Direct visual comparison of the model&rsquo;s 12-month receipt-based print against
            Polymarket&rsquo;s live capital-at-risk pricing and published horizon band.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="chip chip-caution text-[13px]">
            Gap: {gapVsTwelveMonth === null ? "—" : `+${gapVsTwelveMonth.toFixed(1)} pts`}
          </span>
        </div>
      </div>

      {/* SVG Range / Dumbbell Chart */}
      <div className="overflow-x-auto rounded-xl border border-rule bg-surface-2 p-3 sm:p-5">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto min-w-[620px] select-none"
          {...chartAria}
        >
          <title id={chartTitleId}>{chartTitle}</title>
          <desc id={chartDescId}>{chartDescription}</desc>

          {/* X-Axis Grid and Ticks */}
          {axisTicks.map((tick) => {
            const x = scaleX(tick);
            return (
              <g key={tick}>
                <line
                  x1={x}
                  y1={pad.top}
                  x2={x}
                  y2={height - pad.bottom}
                  stroke="rgb(var(--c-rule))"
                  strokeDasharray="2 3"
                  strokeWidth="1"
                />
                <text
                  x={x}
                  y={height - pad.bottom + 20}
                  textAnchor="middle"
                  className="num fill-ink-subtle text-[12px]"
                >
                  {tick}%
                </text>
              </g>
            );
          })}

          {/* Baseline track line */}
          <line
            x1={pad.left}
            y1={105}
            x2={width - pad.right}
            y2={105}
            stroke="rgb(var(--c-rule-strong))"
            strokeWidth="2"
          />

          {/* Shaded Market 12-Month Band Corridor */}
          <rect
            x={xBandLow}
            y={80}
            width={Math.max(2, xBandHigh - xBandLow)}
            height={50}
            fill="var(--c-cat-navy)"
            fillOpacity="0.18"
            stroke="var(--c-cat-navy)"
            strokeWidth="1"
            strokeDasharray="3 2"
            className="cursor-pointer"
            onMouseEnter={() => setHoveredPoint("band")}
            onMouseLeave={() => setHoveredPoint(null)}
          />

          {/* Gap Bracket Dimension Line */}
          <path
            d={`M ${x2027} 62 L ${x2027} 50 L ${xModel} 50 L ${xModel} 62`}
            fill="none"
            stroke="rgb(var(--c-ink))"
            strokeWidth="1.5"
          />
          {x2027 !== null && gapVsTwelveMonth !== null ? (
          <text
            x={(x2027 + xModel) / 2}
            y={42}
            textAnchor="middle"
            className="num fill-ink font-bold text-[13px]"
          >
            +{gapVsTwelveMonth.toFixed(1)} pt Disagreement Gap
          </text>
          ) : null}

          {/* 1. Dec 2026 Contract Point */}
          {x2026 !== null ? (
          <g
            className="cursor-pointer"
            onMouseEnter={() => setHoveredPoint("2026")}
            onMouseLeave={() => setHoveredPoint(null)}
          >
            <line x1={x2026} y1={85} x2={x2026} y2={125} stroke="#D1433C" strokeWidth="2" />
            <circle cx={x2026} cy={105} r={6} fill="#D1433C" stroke="rgb(var(--c-canvas))" strokeWidth="1.5" />
            <text x={x2026} y={y2026Val} textAnchor="middle" className="num fill-ink font-bold text-[13px]">
              {pct(contract2026Prob)}%
            </text>
            <text x={x2026} y={y2026Lbl} textAnchor="middle" className="fill-ink-muted text-[12px]">
              Dec-2026 (6m)
            </text>
          </g>
          ) : null}

          {/* 2. Jun 2027 Contract Point */}
          {x2027 !== null ? (
          <g
            className="cursor-pointer"
            onMouseEnter={() => setHoveredPoint("2027")}
            onMouseLeave={() => setHoveredPoint(null)}
          >
            <line x1={x2027} y1={75} x2={x2027} y2={line2027Bottom} stroke="var(--c-cat-navy)" strokeWidth="2.5" />
            <rect
              x={x2027 - 6}
              y={99}
              width={12}
              height={12}
              fill="var(--c-cat-navy)"
              stroke="rgb(var(--c-canvas))"
              strokeWidth="1.5"
            />
            <text x={x2027} y={y2027Val} textAnchor="middle" className="num fill-ink font-bold text-[13px]">
              {pct(contract2027Prob)}%
            </text>
            <text x={x2027} y={y2027Lbl} textAnchor="middle" className="fill-ink-muted text-[12px]">
              Jun-2027 (12m)
            </text>
          </g>
          ) : null}

          {/* Market Band Central Pip */}
          <circle cx={xBandCentral} cy={105} r={3} fill="var(--c-cat-navy)" opacity={0.8} />
          <text x={xBandCentral} y={75} textAnchor="middle" className="num fill-ink-subtle text-[12px]">
            Band Central {marketBandCentral.toFixed(1)}%
          </text>

          {/* 3. Site Model Point */}
          <g
            className="cursor-pointer"
            onMouseEnter={() => setHoveredPoint("model")}
            onMouseLeave={() => setHoveredPoint(null)}
          >
            <line
              x1={xModel}
              y1={70}
              x2={xModel}
              y2={128}
              stroke="rgb(var(--c-ink))"
              strokeWidth="3"
            />
            <polygon
              points={`${xModel},95 ${xModel + 8},105 ${xModel},115 ${xModel - 8},105`}
              fill="rgb(var(--c-ink))"
              stroke="rgb(var(--c-canvas))"
              strokeWidth="1.5"
            />
            <text x={xModel} y={142} textAnchor="middle" className="num fill-ink font-bold text-[15px]">
              {modelProbability.toFixed(1)}%
            </text>
            <text x={xModel} y={158} textAnchor="middle" className="fill-ink font-semibold text-[12px]">
              Site Model Print
            </text>
          </g>

          {/* Axis Title */}
          <text
            x={width - pad.right}
            y={height - pad.bottom + 36}
            textAnchor="end"
            className="num fill-ink-subtle text-[12px]"
          >
            Probability (%)
          </text>
        </svg>

        {/* Legend under chart */}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t border-rule pt-2 text-[13px]">
          <div className="flex flex-wrap items-center gap-4">
            <span className="flex items-center gap-1.5 text-ink">
              <span className="w-2.5 h-2.5 rotate-45 bg-ink inline-block shrink-0" aria-hidden="true" />
              <span>Model Print: <strong>{modelProbability.toFixed(1)}%</strong></span>
            </span>
            <span className="flex items-center gap-1.5 text-ink-muted">
              <span className="w-3 h-3 bg-cat-navy inline-block shrink-0" aria-hidden="true" />
              <span>Market 12m Contract: <strong>{pct(contract2027Prob)}%</strong></span>
            </span>
            <span className="flex items-center gap-1.5 text-ink-muted">
              <span className="w-3 h-2 bg-cat-navy/20 border border-cat-navy inline-block shrink-0" aria-hidden="true" />
              <span>Market-Implied Band: <strong>{marketBandLow.toFixed(1)}%–{marketBandHigh.toFixed(1)}%</strong></span>
            </span>
            <span className="flex items-center gap-1.5 text-ink-muted">
              <span className="w-2.5 h-2.5 rounded-full bg-risk-500 inline-block shrink-0" aria-hidden="true" />
              <span>Dec-2026 Contract: <strong>{pct(contract2026Prob)}%</strong></span>
            </span>
          </div>

          <span className="num text-ink-subtle text-[12px]">
            Canonical Gap:{" "}
            {gapVsTwelveMonth === null ? "—" : `+${gapVsTwelveMonth.toFixed(1)} pts`}
          </span>
        </div>
      </div>

      {/* Accessible Table Fallback */}
      <div className="overflow-x-auto rounded-xl border border-rule">
        <table className="w-full text-left text-[14px]">
          <caption className="sr-only">
            Canonical Gap Comparison: Model 12-month burst probability against Polymarket contract prices and implied band.
          </caption>
          <thead className="bg-surface-2 text-ink-subtle">
            <tr>
              <th scope="col" className="p-3 font-medium">Metric</th>
              <th scope="col" className="p-3 text-right font-medium">Probability</th>
              <th scope="col" className="p-3 text-right font-medium">Gap vs Market 12m</th>
              <th scope="col" className="p-3 font-medium">Definition</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-rule">
            <tr>
              <th scope="row" className="p-3 font-semibold text-ink">This Model (12-Month Print)</th>
              <td className="num p-3 text-right font-bold text-ink">{modelProbability.toFixed(1)}%</td>
              <td className="num p-3 text-right font-semibold text-ink">
                {gapVsTwelveMonth === null ? "—" : `+${gapVsTwelveMonth.toFixed(1)} pts`}
              </td>
              <td className="p-3 text-ink-muted text-[13px]">
                Computed from verified receipts across 8 factors less 1 adoption damper.
              </td>
            </tr>
            <tr>
              <th scope="row" className="p-3 font-semibold text-ink">{contract2027Label} (12-Month)</th>
              <td className="num p-3 text-right font-semibold text-ink">{pct(contract2027Prob)}%</td>
              <td className="num p-3 text-right text-ink-subtle">0.0 pts (Base)</td>
              <td className="p-3 text-ink-muted text-[13px]">
                Direct Polymarket market price for an industry downturn by June 30, 2027.
              </td>
            </tr>
            <tr>
              <th scope="row" className="p-3 font-semibold text-ink">Published Market-Implied Band</th>
              <td className="num p-3 text-right font-semibold text-ink">{marketBandLow.toFixed(1)}%–{marketBandHigh.toFixed(1)}%</td>
              <td className="num p-3 text-right text-ink-muted">+{gapVsBandCentral.toFixed(1)} pts (vs Central)</td>
              <td className="p-3 text-ink-muted text-[13px]">
                Contract price re-scaled to the 12-month horizon with liquidity adjustment.
              </td>
            </tr>
            <tr>
              <th scope="row" className="p-3 font-semibold text-ink">{contract2026Label} (6-Month)</th>
              <td className="num p-3 text-right font-semibold text-ink">{pct(contract2026Prob)}%</td>
              <td className="num p-3 text-right text-ink-muted">
                {typeof contract2026Prob === "number"
                  ? `+${(modelProbability - contract2026Prob).toFixed(1)} pts`
                  : "—"}
              </td>
              <td className="p-3 text-ink-muted text-[13px]">
                Shorter-window contract scoring official downturn by December 31, 2026.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </figure>
  );
}
