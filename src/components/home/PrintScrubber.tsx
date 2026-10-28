"use client";

import React, { useId, useMemo, useRef, useState } from "react";
import { useInView, usePrefersReducedMotion } from "@/components/Reveal";

/**
 * PrintScrubber — the published run, as a chart you can drag.
 *
 * The observed daily prints are not enough to justify a 90-day curve, so the
 * chart says exactly what it is: every observed print in the file, in order.
 * Drag across it (or use the arrow keys) and the readout above follows.
 *
 * Built as HTML + one polyline rather than a viewBox full of SVG text: the
 * labels stay at their real size on a phone instead of shrinking with the
 * chart. The line keeps a non-scaling 2px stroke at every width.
 */

export interface ScrubPoint {
  date: string;
  dayLabel?: string;
  probability: number;
  compositeScore: number;
  deltaVsYesterday?: string;
}

interface PrintScrubberProps {
  points: ScrubPoint[];
  /** One line of provenance under the chart. */
  note?: string;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function formatDate(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return iso;
  const month = MONTHS[Number(m[2]) - 1] ?? m[2];
  return `${month} ${Number(m[3])}`;
}

export function PrintScrubber({ points, note }: PrintScrubberProps) {
  const chartId = useId();
  const plotRef = useRef<HTMLDivElement | null>(null);
  const figureRef = useRef<HTMLElement | null>(null);
  const inView = useInView(figureRef);
  const reduced = usePrefersReducedMotion();

  const count = points.length;
  const [activeIndex, setActiveIndex] = useState(Math.max(0, count - 1));

  const geometry = useMemo(() => {
    if (count === 0) return null;
    const values = points.map((p) => p.probability);
    const lo = Math.min(...values);
    const hi = Math.max(...values);
    const span = hi - lo;
    const pad = span > 0 ? span * 0.35 : Math.max(Math.abs(hi) * 0.05, 0.5);
    const min = lo - pad;
    const max = hi + pad;
    const range = max - min || 1;
    const top = 8;
    const height = 84;

    const coords = points.map((p, i) => ({
      x: count === 1 ? 50 : 2 + (i / (count - 1)) * 96,
      y: top + (1 - (p.probability - min) / range) * height,
    }));

    return { min, max, coords };
  }, [points, count]);

  if (count === 0 || !geometry) return null;

  const active = points[Math.min(activeIndex, count - 1)];
  const activeCoord = geometry.coords[Math.min(activeIndex, count - 1)];
  const drawn = inView || reduced;

  const setFromClientX = (clientX: number) => {
    const el = plotRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    if (rect.width <= 0) return;
    const fraction = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    setActiveIndex(Math.round(fraction * (count - 1)));
  };

  const dayMove = (() => {
    const i = points.findIndex((p) => p.date === active.date);
    if (i <= 0) return null;
    const deltaText = active.deltaVsYesterday
      ? active.deltaVsYesterday
      : (() => {
          const delta = Math.round((active.probability - points[i - 1].probability) * 10) / 10;
          return `${delta >= 0 ? "+" : "−"}${Math.abs(delta).toFixed(1)} pts`;
        })();
    return {
      text: deltaText.replace(/^-/, "−"),
      priorDate: points[i - 1].date,
    };
  })();

  const polyline = geometry.coords.map((c) => `${c.x.toFixed(2)},${c.y.toFixed(2)}`).join(" ");

  return (
    <figure
      ref={figureRef}
      className="card card-flush overflow-hidden"
      aria-labelledby={`${chartId}-title`}
      aria-describedby={`${chartId}-desc`}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-rule px-4 py-3">
        <div>
          <p className="label">Observed run</p>
          <p id={`${chartId}-title`} className="text-[15px] font-semibold text-ink">
            Every published 12-month print, in order
          </p>
        </div>
        <span className="desk-meta">
          {count} points / observed only
        </span>
      </div>

      <p id={`${chartId}-desc`} className="sr-only">
        Line chart of the {count} observed 12-month burst-probability prints, from{" "}
        {formatDate(points[0].date)} at {points[0].probability.toFixed(1)} percent to{" "}
        {formatDate(points[count - 1].date)} at {points[count - 1].probability.toFixed(1)} percent.
        Drag the chart or use the left and right arrow keys to read any point.
      </p>

      {/* Readout. Fixed min-height so changing the active point cannot shift
          the chart below it. */}
      <div className="flex min-h-[52px] flex-wrap items-baseline gap-x-4 gap-y-1 border-b border-rule bg-surface-2 px-4 py-2">
        <span className="num text-[14px] font-semibold text-ink">{formatDate(active.date)}</span>
        <span className="readout-value text-[15px]">{active.probability.toFixed(1)}%</span>
        <span className="num text-[13px] text-ink-muted">
          score {active.compositeScore.toFixed(1)}
        </span>
        {dayMove ? (
          <span className="num text-[13px] text-ink-muted">
            {dayMove.text} vs {formatDate(dayMove.priorDate)}
          </span>
        ) : null}
        <span className="desk-meta ml-auto hidden sm:flex">hover / drag / arrow keys</span>
      </div>

      <div className="px-4 pb-3 pt-4">
        <div className="grid grid-cols-[42px_minmax(0,1fr)] gap-x-2">
          {/* Y gutter: real HTML text, never scaled down with the SVG. */}
          <div className="relative h-[180px] text-right">
            <span className="num absolute right-0 top-0 text-[12px] leading-none text-ink-faint">
              {geometry.max.toFixed(1)}
            </span>
            <span className="num absolute right-0 top-1/2 -translate-y-1/2 text-[12px] leading-none text-ink-faint">
              {((geometry.max + geometry.min) / 2).toFixed(1)}
            </span>
            <span className="num absolute bottom-0 right-0 text-[12px] leading-none text-ink-faint">
              {geometry.min.toFixed(1)}
            </span>
          </div>

          <div
            ref={plotRef}
            role="slider"
            tabIndex={0}
            aria-label="Scrub the published prints"
            aria-valuemin={0}
            aria-valuemax={count - 1}
            aria-valuenow={Math.min(activeIndex, count - 1)}
            aria-valuetext={`${formatDate(active.date)}: ${active.probability.toFixed(1)} percent`}
            aria-orientation="horizontal"
            aria-describedby={`${chartId}-desc`}
            data-drawn={drawn}
            className="plot relative h-[180px] cursor-ew-resize select-none touch-pan-y"
            style={{
              backgroundImage:
                "linear-gradient(to bottom, rgb(var(--c-rule)) 1px, transparent 1px)",
              backgroundSize: "100% 25%",
            }}
            onPointerDown={(event) => {
              event.currentTarget.setPointerCapture(event.pointerId);
              setFromClientX(event.clientX);
            }}
            onPointerMove={(event) => {
              if (event.buttons !== 1 && event.pointerType !== "mouse") return;
              setFromClientX(event.clientX);
            }}
            onKeyDown={(event) => {
              const last = count - 1;
              if (event.key === "ArrowLeft" || event.key === "ArrowDown") {
                event.preventDefault();
                setActiveIndex((i) => Math.max(0, i - 1));
              } else if (event.key === "ArrowRight" || event.key === "ArrowUp") {
                event.preventDefault();
                setActiveIndex((i) => Math.min(last, i + 1));
              } else if (event.key === "Home") {
                event.preventDefault();
                setActiveIndex(0);
              } else if (event.key === "End") {
                event.preventDefault();
                setActiveIndex(last);
              }
            }}
          >
            {/* The line. The draw-in state lives in CSS behind html.js-reveal,
                so a no-JS reader gets the finished line, not a blank box. */}
            <div className="plot-draw absolute inset-0">
              <svg
                className="h-full w-full overflow-visible"
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                <polyline
                  points={polyline}
                  fill="none"
                  stroke="rgb(var(--c-ink))"
                  strokeWidth="2"
                  vectorEffect="non-scaling-stroke"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
              </svg>
            </div>

            {/* Day ticks */}
            {geometry.coords.map((c, i) => (
              <span
                key={points[i].date}
                aria-hidden="true"
                className="absolute h-2 w-px -translate-x-1/2 bg-rule-strong"
                style={{ left: `${c.x}%`, bottom: 0 }}
              />
            ))}

            {/* Points: square markers, HTML, so they stay 7px at any width.
                They are presentational; the slider itself is the control. */}
            {geometry.coords.map((c, i) => (
              <span
                key={points[i].date}
                aria-hidden="true"
                className="plot-dot absolute h-[7px] w-[7px] -translate-x-1/2 -translate-y-1/2 border border-canvas"
                style={{
                  left: `${c.x}%`,
                  top: `${c.y}%`,
                  backgroundColor: i === activeIndex ? "var(--c-accent)" : "rgb(var(--c-ink))",
                }}
              />
            ))}

            {/* Crosshair */}
            <span
              aria-hidden="true"
              className="plot-crosshair absolute top-0 h-full w-px -translate-x-1/2"
              style={{
                left: `${activeCoord.x}%`,
                backgroundColor: "rgb(var(--c-rule-strong))",
              }}
            />
          </div>
        </div>

        {/* X labels: first, middle, last. */}
        <div className="mt-1 flex justify-between pl-[50px]">
          <span className="num text-[12px] text-ink-faint">{formatDate(points[0].date)}</span>
          <span className="num text-[12px] text-ink-faint">
            {formatDate(points[Math.floor((count - 1) / 2)].date)}
          </span>
          <span className="num text-[12px] text-ink-faint">
            {formatDate(points[count - 1].date)}
          </span>
        </div>

        {note ? (
          <p className="mt-2 text-[12px] leading-relaxed text-ink-faint">{note}</p>
        ) : null}
      </div>
    </figure>
  );
}

export default PrintScrubber;
