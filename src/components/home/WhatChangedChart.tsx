"use client";

import React, { useState, useId, useEffect } from "react";
import rawTrajectoryHistory from "@/data/trajectory-history.json";
import { formatAsOf } from "./copy";

export interface TrajectoryPoint {
  date: string;
  dayLabel: string;
  probability: number;
  compositeScore: number;
  deltaVsYesterday?: string;
  modelVersion?: string;
}

export function WhatChangedChart() {
  const chartId = useId();
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setHoveredIdx(null);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const history = (Array.isArray(rawTrajectoryHistory)
    ? rawTrajectoryHistory
    : []) as TrajectoryPoint[];

  if (history.length === 0) return null;

  const latest = history[history.length - 1];
  const prior = history.length > 1 ? history[history.length - 2] : null;
  const first = history[0];

  const probDayDelta = prior
    ? Math.round((latest.probability - prior.probability) * 10) / 10
    : 0;
  const compDayDelta = prior
    ? Math.round((latest.compositeScore - prior.compositeScore) * 10) / 10
    : 0;

  // Chart dimensions for SVG
  const width = 360;
  const height = 110;
  const padX = 35;
  const padY = 22;

  // Probability bounds (e.g. 31.0 to 33.5 for tight high-resolution sparkline)
  const probMin = 31.0;
  const probMax = 33.2;
  const probRange = probMax - probMin;

  // Composite bounds (e.g. 47.8 to 49.0)
  const compMin = 47.8;
  const compMax = 49.0;
  const compRange = compMax - compMin;

  const getProbY = (val: number) =>
    height - padY - ((val - probMin) / probRange) * (height - 2 * padY);

  const getCompY = (val: number) =>
    height - padY - ((val - compMin) / compRange) * (height - 2 * padY);

  const getX = (idx: number) =>
    padX + (idx / (history.length - 1 || 1)) * (width - 2 * padX);

  const probPoints = history.map((pt, i) => `${getX(i).toFixed(1)},${getProbY(pt.probability).toFixed(1)}`).join(" ");
  const compPoints = history.map((pt, i) => `${getX(i).toFixed(1)},${getCompY(pt.compositeScore).toFixed(1)}`).join(" ");

  const activePt = hoveredIdx !== null ? history[hoveredIdx] : latest;

  return (
    <div
      className="space-y-4"
      role="img"
      aria-labelledby={`${chartId}-title`}
      aria-describedby={`${chartId}-desc`}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <div>
          <p className="label flex items-center gap-1.5">
            <span
              className="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--c-accent)]"
              aria-hidden="true"
            />
            Published trajectory history
          </p>
          <h4
            id={`${chartId}-title`}
            className="text-[15px] font-bold text-ink"
          >
            Probability and composite score across published days
          </h4>
        </div>
        <div className="flex items-center gap-2">
          <span className="pill text-[12px] font-mono">v{latest.modelVersion ?? "2.7.0"}</span>
          <span className="num text-[13px] font-semibold text-ink">
            Today: {latest.probability.toFixed(1)}% ({probDayDelta >= 0 ? "+" : ""}{probDayDelta.toFixed(1)} pts)
          </span>
        </div>
      </div>

      <p id={`${chartId}-desc`} className="sr-only">
        Sparkline showing 12-month burst probability moving from {first.probability.toFixed(1)}% on {first.date} to {latest.probability.toFixed(1)}% on {latest.date}, with composite score moving from {first.compositeScore.toFixed(1)} to {latest.compositeScore.toFixed(1)}. Today's move is {probDayDelta >= 0 ? "+" : ""}{probDayDelta.toFixed(1)} probability points.
      </p>

      {/* Small multiple: Probability sparkline on left, Composite sparkline on right */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {/* Panel 1: Probability Sparkline */}
        <div className="rounded-lg border border-rule bg-surface p-3">
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-[13px] font-semibold text-ink">
              12-Month Burst Probability
            </span>
            <span className="num font-mono text-[13px] font-bold text-accent-strong dark:text-accent-ink">
              {activePt.probability.toFixed(1)}%
              <span className="ml-1 text-[12px] font-normal text-ink-faint">
                ({activePt === latest ? `${probDayDelta >= 0 ? "+" : ""}${probDayDelta.toFixed(1)} pts` : activePt.dayLabel})
              </span>
            </span>
          </div>

          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="mt-2 w-full h-auto select-none overflow-visible"
            aria-hidden="true"
          >
            {/* Horizontal reference baseline */}
            <line
              x1={padX}
              y1={getProbY(first.probability)}
              x2={width - padX}
              y2={getProbY(first.probability)}
              stroke="var(--c-rule)"
              strokeDasharray="2 3"
              strokeWidth="1"
            />

            {/* Sparkline path */}
            <polyline
              fill="none"
              stroke="var(--c-accent)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={probPoints}
            />

            {/* Points */}
            {history.map((pt, i) => {
              const cx = getX(i);
              const cy = getProbY(pt.probability);
              const isToday = i === history.length - 1;
              const isHovered = hoveredIdx === i;

              return (
                <g
                  key={pt.date}
                  tabIndex={0}
                  role="button"
                  aria-label={`${formatAsOf(pt.date)}: ${pt.probability.toFixed(1)}%`}
                  onClick={() => setHoveredIdx(hoveredIdx === i ? null : i)}
                  onMouseEnter={() => setHoveredIdx(i)}
                  onMouseLeave={() => setHoveredIdx(null)}
                  onFocus={() => setHoveredIdx(i)}
                  onBlur={() => setHoveredIdx(null)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setHoveredIdx(hoveredIdx === i ? null : i);
                    } else if (e.key === "Escape") {
                      e.preventDefault();
                      setHoveredIdx(null);
                    }
                  }}
                  className="cursor-pointer focus:outline-none"
                >
                  <circle
                    cx={cx}
                    cy={cy}
                    r={isToday ? 5 : isHovered ? 4.5 : 3.5}
                    fill={isToday ? "var(--c-accent)" : "rgb(var(--c-surface))"}
                    stroke="var(--c-accent)"
                    strokeWidth={isToday ? 2.5 : 2}
                  />
                  {/* Point value label */}
                  <text
                    x={cx}
                    y={cy - 9}
                    textAnchor="middle"
                    className="num font-mono text-[12px] font-bold fill-ink"
                  >
                    {pt.probability.toFixed(1)}%
                  </text>
                  {/* Date label at bottom */}
                  <text
                    x={cx}
                    y={height - 4}
                    textAnchor="middle"
                    className="num text-[12px] fill-ink-faint"
                  >
                    {pt.date.slice(5)}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Panel 2: Composite Score Sparkline */}
        <div className="rounded-lg border border-rule bg-surface p-3">
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-[13px] font-semibold text-ink">
              Composite Stress Score
            </span>
            <span className="num font-mono text-[13px] font-bold text-ink">
              {activePt.compositeScore.toFixed(1)} pts
              <span className="ml-1 text-[12px] font-normal text-ink-faint">
                ({activePt === latest ? `${compDayDelta >= 0 ? "+" : ""}${compDayDelta.toFixed(1)} pts` : activePt.dayLabel})
              </span>
            </span>
          </div>

          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="mt-2 w-full h-auto select-none overflow-visible"
            aria-hidden="true"
          >
            {/* Reference line */}
            <line
              x1={padX}
              y1={getCompY(first.compositeScore)}
              x2={width - padX}
              y2={getCompY(first.compositeScore)}
              stroke="var(--c-rule)"
              strokeDasharray="2 3"
              strokeWidth="1"
            />

            {/* Sparkline path */}
            <polyline
              fill="none"
              stroke="var(--c-cat-steel)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={compPoints}
            />

            {/* Points */}
            {history.map((pt, i) => {
              const cx = getX(i);
              const cy = getCompY(pt.compositeScore);
              const isToday = i === history.length - 1;
              const isHovered = hoveredIdx === i;

              return (
                <g
                  key={pt.date}
                  tabIndex={0}
                  role="button"
                  aria-label={`${formatAsOf(pt.date)}: composite ${pt.compositeScore.toFixed(1)} pts`}
                  onClick={() => setHoveredIdx(hoveredIdx === i ? null : i)}
                  onMouseEnter={() => setHoveredIdx(i)}
                  onMouseLeave={() => setHoveredIdx(null)}
                  onFocus={() => setHoveredIdx(i)}
                  onBlur={() => setHoveredIdx(null)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setHoveredIdx(hoveredIdx === i ? null : i);
                    } else if (e.key === "Escape") {
                      e.preventDefault();
                      setHoveredIdx(null);
                    }
                  }}
                  className="cursor-pointer focus:outline-none"
                >
                  <circle
                    cx={cx}
                    cy={cy}
                    r={isToday ? 5 : isHovered ? 4.5 : 3.5}
                    fill={isToday ? "var(--c-cat-steel)" : "rgb(var(--c-surface))"}
                    stroke="var(--c-cat-steel)"
                    strokeWidth={isToday ? 2.5 : 2}
                  />
                  <text
                    x={cx}
                    y={cy - 9}
                    textAnchor="middle"
                    className="num font-mono text-[12px] font-bold fill-ink"
                  >
                    {pt.compositeScore.toFixed(1)}
                  </text>
                  <text
                    x={cx}
                    y={height - 4}
                    textAnchor="middle"
                    className="num text-[12px] fill-ink-faint"
                  >
                    {pt.date.slice(5)}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* Accessible Table Fallback */}
      <table className="sr-only">
        <caption>
          Published model trajectory: burst probability and composite score across published dates.
        </caption>
        <thead>
          <tr>
            <th scope="col">Date</th>
            <th scope="col">Burst Probability</th>
            <th scope="col">Composite Score</th>
            <th scope="col">Day Delta</th>
            <th scope="col">Model Version</th>
          </tr>
        </thead>
        <tbody>
          {history.map((row) => (
            <tr key={row.date}>
              <th scope="row">{row.date}</th>
              <td>{row.probability.toFixed(1)}%</td>
              <td>{row.compositeScore.toFixed(1)}</td>
              <td>{row.deltaVsYesterday ?? "—"}</td>
              <td>{row.modelVersion ?? "2.7.0"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
