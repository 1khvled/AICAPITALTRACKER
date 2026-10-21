"use client";

import React, { useState, useMemo, useId } from "react";
import {
  POLYMARKET_HISTORICAL_TRENDS,
  PolymarketHistoryPoint,
} from "@/data/polymarket-data";
import {
  getChartAriaProps,
  generateChartDescription,
  ChartAnnouncer,
} from "@/lib/chart-a11y";

export interface CategoryTrajectoryChartProps {
  live2026Pct?: number;
  live2027Pct?: number;
  liveNote?: string;
}

const SERIES_CONFIG = {
  aiBubble2026: {
    id: "aiBubble2026",
    label: "AI Bubble 2026",
    color: "var(--c-cat-teal)",
    dash: "none",
    marker: "circle",
  },
  aiBubble2027: {
    id: "aiBubble2027",
    label: "AI Bubble 2027",
    color: "var(--c-cat-navy)",
    dash: "6 3",
    marker: "rect",
  },
  oracleCdsStress: {
    id: "oracleCdsStress",
    label: "Oracle CDS Stress",
    color: "var(--c-cat-olive)",
    dash: "4 2 1 2",
    marker: "diamond",
  },
  openaiAgiOdds: {
    id: "openaiAgiOdds",
    label: "OpenAI AGI Odds",
    color: "var(--c-cat-cyan)",
    dash: "2 3",
    marker: "triangle",
  },
} as const;

type SeriesKey = keyof typeof SERIES_CONFIG;

export function CategoryTrajectoryChart({
  live2026Pct,
  live2027Pct,
  liveNote = "last point = live snapshot",
}: CategoryTrajectoryChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [activeSeries, setActiveSeries] = useState<Record<SeriesKey, boolean>>({
    aiBubble2026: true,
    aiBubble2027: true,
    oracleCdsStress: true,
    openaiAgiOdds: true,
  });

  const toggleSeries = (key: SeriesKey) => {
    setActiveSeries((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Bind live points to terminal historical observation without inventing any intermediate points
  const points = useMemo(() => {
    return POLYMARKET_HISTORICAL_TRENDS.map((p, idx) => {
      const isLast = idx === POLYMARKET_HISTORICAL_TRENDS.length - 1;
      if (!isLast) return { ...p, isLive: false };
      return {
        ...p,
        aiBubble2026: live2026Pct !== undefined ? live2026Pct : p.aiBubble2026,
        aiBubble2027: live2027Pct !== undefined ? live2027Pct : p.aiBubble2027,
        isLive: true,
      };
    });
  }, [live2026Pct, live2027Pct]);

  // Chart dimensions
  const width = 860;
  const height = 340;
  const pad = { top: 30, right: 40, bottom: 50, left: 60 };
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;
  const maxVal = 50; // max Y percentage

  const getX = (i: number) => pad.left + (i / (points.length - 1)) * innerW;
  const getY = (val: number) => pad.top + innerH - (Math.min(maxVal, Math.max(0, val)) / maxVal) * innerH;

  const makePath = (key: SeriesKey) => {
    return points
      .map((p, i) => `${i === 0 ? "M" : "L"} ${getX(i).toFixed(1)} ${getY(p[key]).toFixed(1)}`)
      .join(" ");
  };

  const chartUid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const chartTitleId = `${chartUid}-title`;
  const chartDescId = `${chartUid}-desc`;
  const chartTitle = "Prediction Market Category View — 4 Tracked Series over 10 Published Observation Dates";

  const chartDescription = useMemo(
    () =>
      generateChartDescription({
        title: chartTitle,
        kind: "line",
        series: (Object.keys(SERIES_CONFIG) as SeriesKey[])
          .filter((k) => activeSeries[k])
          .map((k) => ({
            name: SERIES_CONFIG[k].label,
            points: points.map((p) => ({ x: p.date, y: p[k] })),
          })),
        formatValue: (v) => `${v.toFixed(1)}%`,
      }),
    [chartTitle, activeSeries, points]
  );

  const chartAria = getChartAriaProps({
    title: chartTitle,
    description: chartDescription,
    labelledBy: chartTitleId,
    describedBy: chartDescId,
  });

  const activeHoverPoint = hoveredIndex !== null ? points[hoveredIndex] : points[points.length - 1];

  const announcerText = activeHoverPoint
    ? `${activeHoverPoint.date}: 2026 Bubble: ${activeHoverPoint.aiBubble2026.toFixed(1)}%, 2027 Bubble: ${activeHoverPoint.aiBubble2027.toFixed(1)}%, Oracle CDS Stress: ${activeHoverPoint.oracleCdsStress.toFixed(1)}%, OpenAI AGI: ${activeHoverPoint.openaiAgiOdds.toFixed(1)}%.`
    : chartDescription;

  const yTicks = [0, 10, 20, 30, 40, 50];

  return (
    <figure className="m-0 space-y-4">
      <ChartAnnouncer message={announcerText} />

      {/* Header and Series Filter Toggles */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between border-b border-rule pb-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="label">10-Point Published Trajectory</span>
            <span className="pill">Jan 2024 — Oct 2026</span>
            <span className="num text-[14px] text-ink-subtle">{liveNote}</span>
          </div>
          <h3 className="text-lg sm:text-xl font-bold tracking-tight text-ink mt-1">
            Category Trajectory: 4 Key Series over Published History
          </h3>
          <p className="text-[14px] text-ink-muted">
            The four tracked series across bubble contracts, debt refinancing stress, and frontier lab milestones.
            Every point is an official published observation with no interpolated values.
          </p>
        </div>

        {/* Series Visibility Toggles */}
        <div className="flex flex-wrap items-center gap-2">
          {(Object.keys(SERIES_CONFIG) as SeriesKey[]).map((key) => {
            const conf = SERIES_CONFIG[key];
            const isOn = activeSeries[key];
            return (
              <button
                key={key}
                onClick={() => toggleSeries(key)}
                className={`min-h-[44px] px-3 py-1.5 rounded-lg border text-[13px] font-medium transition-colors flex items-center gap-2 ${
                  isOn
                    ? "border-ink bg-surface-3 font-semibold text-ink"
                    : "border-rule bg-surface text-ink-faint hover:text-ink hover:border-rule-strong line-through"
                }`}
              >
                <span
                  className="w-3 h-1.5 inline-block shrink-0 rounded-full"
                  style={{ backgroundColor: conf.color }}
                  aria-hidden="true"
                />
                <span>{conf.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* SVG Line Chart */}
      <div className="overflow-x-auto rounded-xl border border-rule bg-surface-2 p-3 sm:p-5">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto min-w-[620px] select-none"
          {...chartAria}
        >
          <title id={chartTitleId}>{chartTitle}</title>
          <desc id={chartDescId}>{chartDescription}</desc>

          {/* Y-Axis Gridlines & Labels */}
          {yTicks.map((val) => {
            const y = getY(val);
            return (
              <g key={val}>
                <line
                  x1={pad.left}
                  y1={y}
                  x2={width - pad.right}
                  y2={y}
                  stroke="rgb(var(--c-rule))"
                  strokeDasharray={val === 0 ? "none" : "2 3"}
                  strokeWidth="1"
                />
                <text
                  x={pad.left - 10}
                  y={y + 4}
                  textAnchor="end"
                  className="num fill-ink-muted text-[12px]"
                >
                  {val}%
                </text>
              </g>
            );
          })}

          {/* X-Axis Observation Ticks */}
          {points.map((p, i) => {
            const x = getX(i);
            const isHovered = hoveredIndex === i;
            return (
              <g key={p.date}>
                <line
                  x1={x}
                  y1={pad.top}
                  x2={x}
                  y2={height - pad.bottom}
                  stroke={isHovered ? "rgb(var(--c-ink))" : "rgb(var(--c-rule))"}
                  strokeWidth={isHovered ? 1.5 : 0.8}
                  strokeDasharray="2 2"
                />
                <text
                  x={x}
                  y={height - pad.bottom + 20}
                  textAnchor="middle"
                  className={`num text-[12px] ${
                    isHovered ? "fill-ink font-bold" : "fill-ink-subtle"
                  }`}
                >
                  {p.date.replace(" (Live)", "")}
                </text>
              </g>
            );
          })}

          {/* Active Series Paths */}
          {(Object.keys(SERIES_CONFIG) as SeriesKey[]).map((key) => {
            if (!activeSeries[key]) return null;
            const conf = SERIES_CONFIG[key];
            return (
              <path
                key={key}
                d={makePath(key)}
                fill="none"
                stroke={conf.color}
                strokeWidth={2.5}
                strokeDasharray={conf.dash}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            );
          })}

          {/* Series Markers */}
          {points.map((p, i) => {
            const x = getX(i);
            return (
              <g key={`markers-${p.date}`}>
                {/* 2026 Bubble (Circle) */}
                {activeSeries.aiBubble2026 && (
                  <circle
                    cx={x}
                    cy={getY(p.aiBubble2026)}
                    r={p.isLive ? 5 : 3.5}
                    fill={SERIES_CONFIG.aiBubble2026.color}
                    stroke="rgb(var(--c-canvas))"
                    strokeWidth={1}
                  />
                )}

                {/* 2027 Bubble (Square) */}
                {activeSeries.aiBubble2027 && (
                  <rect
                    x={x - (p.isLive ? 4.5 : 3)}
                    y={getY(p.aiBubble2027) - (p.isLive ? 4.5 : 3)}
                    width={p.isLive ? 9 : 6}
                    height={p.isLive ? 9 : 6}
                    fill={SERIES_CONFIG.aiBubble2027.color}
                    stroke="rgb(var(--c-canvas))"
                    strokeWidth={1}
                  />
                )}

                {/* Oracle CDS (Diamond) */}
                {activeSeries.oracleCdsStress && (
                  <polygon
                    points={`${x},${getY(p.oracleCdsStress) - 4} ${x + 4},${getY(p.oracleCdsStress)} ${x},${
                      getY(p.oracleCdsStress) + 4
                    } ${x - 4},${getY(p.oracleCdsStress)}`}
                    fill={SERIES_CONFIG.oracleCdsStress.color}
                    stroke="rgb(var(--c-canvas))"
                    strokeWidth={1}
                  />
                )}

                {/* OpenAI AGI (Triangle) */}
                {activeSeries.openaiAgiOdds && (
                  <polygon
                    points={`${x},${getY(p.openaiAgiOdds) - 4} ${x + 3.5},${getY(p.openaiAgiOdds) + 3} ${
                      x - 3.5
                    },${getY(p.openaiAgiOdds) + 3}`}
                    fill={SERIES_CONFIG.openaiAgiOdds.color}
                    stroke="rgb(var(--c-canvas))"
                    strokeWidth={1}
                  />
                )}

                {/* Terminal Live Ring */}
                {p.isLive && (
                  <circle
                    cx={x}
                    cy={getY(p.aiBubble2027)}
                    r={9}
                    fill="none"
                    stroke="rgb(var(--c-ink))"
                    strokeWidth={1.5}
                    strokeDasharray="2 2"
                  />
                )}

                {/* Invisible hover capture band */}
                <rect
                  x={x - innerW / (points.length * 2)}
                  y={pad.top}
                  width={innerW / points.length}
                  height={innerH}
                  fill="transparent"
                  className="cursor-pointer"
                  onMouseEnter={() => setHoveredIndex(i)}
                  onMouseLeave={() => setHoveredIndex(null)}
                />
              </g>
            );
          })}

          {/* Axis Titles */}
          <text x={pad.left} y={16} className="num fill-ink-subtle text-[12px] font-semibold">
            Probability / Stress (%)
          </text>
          <text x={width - pad.right} y={height - pad.bottom + 36} textAnchor="end" className="num fill-ink-subtle text-[12px]">
            Observation Date
          </text>
        </svg>

        {/* Readout bar for hovered/active point */}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-rule pt-3 text-[13px]">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-ink">
              {activeHoverPoint.date}
              {activeHoverPoint.isLive ? " (Live Snapshot)" : ""}:
            </span>
            <div className="flex flex-wrap items-center gap-3">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-cat-teal inline-block" />
                <span className="num font-semibold text-ink">{activeHoverPoint.aiBubble2026.toFixed(1)}%</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 bg-cat-navy inline-block" />
                <span className="num font-semibold text-ink">{activeHoverPoint.aiBubble2027.toFixed(1)}%</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rotate-45 bg-cat-olive inline-block" />
                <span className="num font-semibold text-ink">{activeHoverPoint.oracleCdsStress.toFixed(1)}%</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 bg-cat-cyan inline-block" />
                <span className="num font-semibold text-ink">{activeHoverPoint.openaiAgiOdds.toFixed(1)}%</span>
              </span>
            </div>
          </div>

          <span className="text-ink-subtle text-[12px]">
            Hover any column to inspect the 10 published dates.
          </span>
        </div>
      </div>

      {/* Accessible Table Fallback */}
      <div className="overflow-x-auto rounded-xl border border-rule">
        <table className="w-full text-left text-[14px]">
          <caption className="sr-only">
            Published History of 4 Tracked Series over 10 Observation Points: Date, AI Bubble 2026, AI Bubble 2027, Oracle CDS Stress, OpenAI AGI Odds.
          </caption>
          <thead className="bg-surface-2 text-ink-subtle">
            <tr>
              <th scope="col" className="p-3 font-medium">Observation Date</th>
              <th scope="col" className="p-3 text-right font-medium">AI Bubble 2026 (%)</th>
              <th scope="col" className="p-3 text-right font-medium">AI Bubble 2027 (%)</th>
              <th scope="col" className="p-3 text-right font-medium">Oracle CDS Stress (%)</th>
              <th scope="col" className="p-3 text-right font-medium">OpenAI AGI Odds (%)</th>
              <th scope="col" className="p-3 font-medium">Type</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-rule">
            {points.map((p) => (
              <tr key={p.date} className="hover:bg-surface-2/40">
                <th scope="row" className="p-3 font-semibold text-ink">{p.date}</th>
                <td className="num p-3 text-right font-semibold text-ink">{p.aiBubble2026.toFixed(1)}%</td>
                <td className="num p-3 text-right font-semibold text-ink">{p.aiBubble2027.toFixed(1)}%</td>
                <td className="num p-3 text-right text-ink-muted">{p.oracleCdsStress.toFixed(1)}%</td>
                <td className="num p-3 text-right text-ink-muted">{p.openaiAgiOdds.toFixed(1)}%</td>
                <td className="p-3 text-ink-subtle text-[12px]">
                  {p.isLive ? (
                    <span className="pill pill-safe text-[13px]">Live Snapshot</span>
                  ) : (
                    "Published History"
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </figure>
  );
}
