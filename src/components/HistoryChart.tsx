"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  type BuildOutMonth,
  type BuildOutEvent,
  type HistoryBundle,
  type HistoryEpisode,
  type MarketReading,
  type ModelPrint,
} from "@/lib/history-series";

export interface HistoryChartProps {
  bundle: HistoryBundle;
  /** The model's current print, so the last point can be called out. */
  currentProbabilityPct: number;
}

type Readout = {
  title: string;
  value: string;
  detail: string;
};

const PADDING_LEFT = 52;
const PADDING_RIGHT = 24;

export function HistoryChart({ bundle, currentProbabilityPct }: HistoryChartProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [width, setWidth] = useState(860);
  const [fromYear, setFromYear] = useState<number | null>(null);
  const [toYear, setToYear] = useState<number | null>(null);
  const [running, setRunning] = useState(true);
  const [hover, setHover] = useState<Readout | null>(null);
  const [picked, setPicked] = useState<Readout | null>(null);

  const years = useMemo(
    () => bundle.months.map((m) => Number.parseInt(m.iso.slice(0, 4), 10)),
    [bundle.months]
  );
  const [minYear, maxYear] = useMemo(() => {
    if (!years.length) return [2023, 2026];
    return [Math.min(...years), Math.max(...years)];
  }, [years]);
  const lo = fromYear ?? minYear;
  const hi = toYear ?? maxYear;

  /* Sizing: measure parent container width smoothly */
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const measure = () => setWidth(Math.max(320, el.clientWidth));
    measure();
    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", measure);
      return () => window.removeEventListener("resize", measure);
    }
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const innerW = Math.max(80, width - PADDING_LEFT - PADDING_RIGHT);

  /**
   * Continuous time scale helper. A year is not a point position:
   * exact timestamps are mapped to fractional positions across the width.
   */
  const timeOf = (iso: string) => {
    const parsed = Date.parse(iso.length === 7 ? `${iso}-01` : iso);
    return Number.isFinite(parsed) ? parsed : Number.NaN;
  };

  const scaleTime = (fromIso: string, toIso: string) => {
    const from = timeOf(fromIso);
    const to = timeOf(toIso);
    const span = to - from;
    return (iso: string) => {
      const t = timeOf(iso);
      if (!Number.isFinite(t) || !Number.isFinite(span) || span <= 0) return Number.NaN;
      return PADDING_LEFT + ((t - from) / span) * innerW;
    };
  };

  /* ── Panel 1 dimensions & scales (Episodes) ───────────────────────── */
  const p1Height = 220;
  const p1Top = 28;
  const p1PlotH = 120;
  const p1Bottom = p1Top + p1PlotH; // 148
  const episodes = bundle.episodes;
  const p1Slot = episodes.length ? innerW / episodes.length : innerW;
  const p1BarW = Math.min(42, Math.max(22, p1Slot * 0.48));

  /* ── Panel 2 dimensions & scales (Capital Build-Out) ──────────────── */
  const p2Height = 180;
  const p2Top = 20;
  const p2PlotH = 120;
  const p2Bottom = p2Top + p2PlotH; // 140
  const months = bundle.months.filter((m) => {
    const y = Number.parseInt(m.iso.slice(0, 4), 10);
    return y >= lo && y <= hi;
  });
  const maxUsd = useMemo(() => {
    const values = months.map((m) => (running ? m.cumulativeUsd : m.newUsd));
    return values.length ? Math.max(...values, 1) : 1;
  }, [months, running]);

  const x2 = scaleTime(`${lo}-01-01`, `${hi}-12-31`);
  const usdToY = (usd: number) =>
    p2Bottom - (usd / maxUsd) * (p2PlotH - 8);

  const moneyPath = useMemo(() => {
    if (!months.length) return "";
    const value = (m: BuildOutMonth) => (running ? m.cumulativeUsd : m.newUsd);
    return months
      .map((m, i) => {
        const x = x2(m.iso);
        const y = usdToY(value(m));
        if (!Number.isFinite(x)) return "";
        return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .filter(Boolean)
      .join(" ");
  }, [months, running, lo, hi, maxUsd]);

  const debtPath = useMemo(() => {
    if (!running || !months.length) return "";
    return months
      .map((m, i) => {
        const x = x2(m.iso);
        const y = usdToY(m.debtCumulativeUsd);
        if (!Number.isFinite(x)) return "";
        return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .filter(Boolean)
      .join(" ");
  }, [months, running, lo, hi, maxUsd]);

  const areaPath = useMemo(() => {
    if (!months.length || !moneyPath) return "";
    const last = months[months.length - 1];
    const lastX = x2(last.iso);
    const firstX = x2(months[0].iso);
    return `${moneyPath} L${lastX.toFixed(1)},${p2Bottom} L${firstX.toFixed(1)},${p2Bottom} Z`;
  }, [moneyPath, months, running, lo, hi, maxUsd]);

  /* ── Panel 3 dimensions & scales (Market vs Model) ────────────────── */
  const p3Height = 170;
  const p3Top = 20;
  const p3PlotH = 110;
  const p3Bottom = p3Top + p3PlotH; // 130
  const p3From = bundle.market.length
    ? Number.parseInt(bundle.market[0].iso.slice(0, 4), 10)
    : 2024;
  const p3To = Math.max(
    p3From + 1,
    bundle.prints.length
      ? Number.parseInt(bundle.prints[bundle.prints.length - 1].iso.slice(0, 4), 10)
      : p3From + 2
  );
  const x3 = scaleTime(`${p3From}-01-01`, `${p3To}-12-31`);
  const p3ToY = (pct: number) => p3Bottom - (pct / 100) * p3PlotH;

  const readout = hover ?? picked;

  // Keyboard navigation through all marks
  const allMarks = useMemo<Readout[]>(() => [
    ...episodes.map((e: HistoryEpisode) => ({
      title: `${e.era} (${e.date})`,
      value: `${e.probabilityPct.toFixed(1)}%`,
      detail: `${e.outcome} Composite ${e.compositeScore.toFixed(1)}.`,
    })),
    ...bundle.market.map((m: MarketReading) => ({
      title: `Market price — ${m.label}`,
      value: `${m.twelveMonthPct.toFixed(1)}%`,
      detail: `12-month contract; 6-month contract is at ${m.sixMonthPct.toFixed(1)}%.`,
    })),
    ...bundle.prints.map((p: ModelPrint) => ({
      title: `Model print — ${p.label}`,
      value: `${p.probabilityPct.toFixed(1)}%`,
      detail: `Composite ${p.compositeScore.toFixed(1)}.`,
    })),
  ], [episodes, bundle.market, bundle.prints]);

  const onKey = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
      event.preventDefault();
      const current = picked ? allMarks.findIndex((m) => m.title === picked.title) : -1;
      const next =
        event.key === "ArrowRight"
          ? Math.min(allMarks.length - 1, current + 1)
          : Math.max(0, current <= 0 ? 0 : current - 1);
      setPicked(allMarks[next]);
    },
    [allMarks, picked]
  );

  const description = `Three panels. Panel 1: model probabilities across ${episodes.length} historical episodes from ${bundle.fromYear} to ${bundle.toYear}. Panel 2: disclosed capital from the ledger between ${lo} and ${hi}, with cumulative debt. Panel 3: Polymarket 12-month pricing against the model's observed daily print.`;

  return (
    <figure
      ref={containerRef}
      className="m-0 space-y-6"
      role="region"
      aria-label="Historical model behavior and capital build-out"
      tabIndex={0}
      onKeyDown={onKey}
    >
      {/* ── Readout banner ────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-baseline justify-between gap-2 rounded-lg border border-rule bg-surface p-3">
        <p className="text-[14px] text-ink-muted" aria-live="polite">
          {readout ? (
            <>
              <span className="font-semibold text-ink">{readout.title}</span> —{" "}
              <span className="num font-semibold text-ink">{readout.value}</span>
              {readout.detail ? ` · ${readout.detail}` : ""}
            </>
          ) : (
            <span className="text-ink-faint">
              Point at or tap any column, line point or deal circle to inspect. Use Left/Right arrow keys to step through history.
            </span>
          )}
        </p>
        {readout ? (
          <button
            type="button"
            onClick={() => {
              setHover(null);
              setPicked(null);
            }}
            className="text-[12px] text-ink-muted hover:text-ink underline"
          >
            Clear selection
          </button>
        ) : null}
      </div>

      {/* ══ PANEL 1: Resolved Historical Episodes ═══════════════════════ */}
      <div className="rounded-lg border border-rule bg-surface p-4 sm:p-5 shadow-card">
        {/* HTML Header: Outside SVG so text never collides */}
        <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-rule pb-3">
          <div>
            <span className="label">The model's track record</span>
            <h3 className="text-[15px] font-bold tracking-tight text-ink sm:text-[16px]">
              The model on markets that have already resolved
            </h3>
            <p className="mt-0.5 text-[13px] text-ink-muted">
              Probability print for each epoch from 1929 to today, and whether a crash occurred within 12 months
            </p>
          </div>
          <div className="flex items-center gap-3 text-[12px] text-ink-muted">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-[rgb(var(--c-risk-500))]" aria-hidden="true" />
              Burst observed
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-[var(--c-accent)]" aria-hidden="true" />
              Live 2026 cycle
            </span>
          </div>
        </div>

        {/* SVG Canvas */}
        <div className="mt-3">
          <svg
            width={width}
            height={p1Height}
            viewBox={`0 0 ${width} ${p1Height}`}
            role="img"
            aria-label="Historical episodes probability comparison"
            className="block w-full overflow-visible"
            onMouseLeave={() => setHover(null)}
          >
            {/* Gridlines and Y-axis percentage labels */}
            {[0, 25, 50, 75, 100].map((pct) => {
              const y = p1Bottom - (pct / 100) * p1PlotH;
              return (
                <g key={pct}>
                  <line
                    x1={PADDING_LEFT}
                    y1={y}
                    x2={width - PADDING_RIGHT}
                    y2={y}
                    stroke="rgb(var(--c-rule))"
                    strokeWidth={1}
                    strokeDasharray={pct === 0 ? undefined : "3 3"}
                  />
                  <text
                    x={PADDING_LEFT - 10}
                    y={y + 4}
                    textAnchor="end"
                    className="num fill-ink-faint text-[12px]"
                  >
                    {pct}%
                  </text>
                </g>
              );
            })}

            {/* Episode Bars with guaranteed clearance */}
            {episodes.map((episode, index) => {
              const slotCenter = PADDING_LEFT + p1Slot * index + p1Slot / 2;
              const x = slotCenter - p1BarW / 2;
              const barH = (episode.probabilityPct / 100) * p1PlotH;
              const y = p1Bottom - barH;
              const isNow = episode.year >= 2026;
              const isHovered =
                readout?.title.startsWith(episode.era) ?? false;

              // Top value label sits cleanly above bar with reserved headroom
              const labelY = Math.max(14, y - 6);

              return (
                <g
                  key={episode.id}
                  className="cursor-pointer"
                  tabIndex={0}
                  role="button"
                  aria-label={`${episode.era}: ${episode.probabilityPct.toFixed(1)}% probability, ${episode.burstObserved ? "burst observed" : "open window"}`}
                  onMouseEnter={() =>
                    setHover({
                      title: `${episode.era} (${episode.date})`,
                      value: `${episode.probabilityPct.toFixed(1)}%`,
                      detail: `${episode.outcome} Composite ${episode.compositeScore.toFixed(1)}.`,
                    })
                  }
                  onClick={() =>
                    setPicked({
                      title: `${episode.era} (${episode.date})`,
                      value: `${episode.probabilityPct.toFixed(1)}%`,
                      detail: `${episode.outcome} Composite ${episode.compositeScore.toFixed(1)}.`,
                    })
                  }
                  onFocus={() =>
                    setHover({
                      title: `${episode.era} (${episode.date})`,
                      value: `${episode.probabilityPct.toFixed(1)}%`,
                      detail: `${episode.outcome} Composite ${episode.compositeScore.toFixed(1)}.`,
                    })
                  }
                >
                  {/* Bar */}
                  <rect
                    x={x}
                    y={y}
                    width={p1BarW}
                    height={Math.max(2, barH)}
                    rx={3}
                    fill={isNow ? "var(--c-accent)" : isHovered ? "rgb(var(--c-ink))" : "rgb(var(--c-ink-subtle))"}
                  />

                  {/* Value label on top with full headroom */}
                  <text
                    x={slotCenter}
                    y={labelY}
                    textAnchor="middle"
                    className={`num text-[12px] font-bold ${isNow ? "fill-accent" : "fill-ink"}`}
                  >
                    {episode.probabilityPct.toFixed(1)}%
                  </text>

                  {/* Year text below baseline (y = 168) */}
                  <text
                    x={slotCenter}
                    y={p1Bottom + 18}
                    textAnchor="middle"
                    className="num fill-ink text-[12px] font-medium"
                  >
                    {episode.year}
                  </text>

                  {/* Burst/Status indicator clearly separated (y = 196) */}
                  {episode.burstObserved ? (
                    <g>
                      <circle
                        cx={slotCenter - 20}
                        cy={p1Bottom + 35}
                        r={3}
                        fill="rgb(var(--c-risk-500))"
                      />
                      <text
                        x={slotCenter - 13}
                        y={p1Bottom + 39}
                        textAnchor="start"
                        className="fill-risk-500 text-[12px] font-semibold"
                      >
                        Burst
                      </text>
                    </g>
                  ) : (
                    <g>
                      <circle
                        cx={slotCenter - 16}
                        cy={p1Bottom + 35}
                        r={3}
                        fill="var(--c-accent)"
                      />
                      <text
                        x={slotCenter - 9}
                        y={p1Bottom + 39}
                        textAnchor="start"
                        className="fill-accent text-[12px] font-semibold"
                      >
                        Live
                      </text>
                    </g>
                  )}
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* ══ PANEL 2: The Money Going In ═════════════════════════════════ */}
      <div className="rounded-lg border border-rule bg-surface p-4 sm:p-5 shadow-card">
        {/* HTML Header & Controls */}
        <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-rule pb-3">
          <div>
            <span className="label">Where the money is going</span>
            <h3 className="text-[15px] font-bold tracking-tight text-ink sm:text-[16px]">
              The money going in
            </h3>
            <p className="mt-0.5 text-[13px] text-ink-muted">
              Disclosed capital from the 169-deal ledger, with cumulative debt facility borrowings
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-1.5 text-[12px] text-ink-muted">
              <span className="h-2 w-4 rounded-xs bg-[rgb(var(--c-ink))]" aria-hidden="true" />
              Total capital
            </span>
            <span className="inline-flex items-center gap-1.5 text-[12px] text-ink-muted">
              <span className="h-0.5 w-4 bg-[rgb(var(--c-caution-500))]" aria-hidden="true" />
              Debt borrowings
            </span>
            <span className="inline-flex items-center gap-1.5 text-[12px] text-ink-muted">
              <span className="h-2.5 w-2.5 rounded-full border border-ink bg-surface" aria-hidden="true" />
              Mega-deal (&ge;5%)
            </span>
          </div>
        </div>

        {/* HTML Controls */}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-4 rounded-md bg-surface-2/60 p-3">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-[13px] font-medium text-ink-muted">Timespan:</span>
            <div className="flex items-center gap-2">
              <label htmlFor="history-from-year" className="sr-only">Start year</label>
              <input
                id="history-from-year"
                type="range"
                min={minYear}
                max={maxYear}
                value={lo}
                onChange={(e) => {
                  const val = Number.parseInt(e.target.value, 10);
                  setFromYear(val);
                  if (val >= hi) setToYear(Math.min(maxYear, val + 1));
                }}
                className="h-11 w-24 cursor-pointer accent-[var(--c-accent)]"
                aria-label="Start year for capital window"
              />
              <span className="num text-[13px] font-semibold text-ink">{lo}</span>
              <span className="text-ink-muted">—</span>
              <label htmlFor="history-to-year" className="sr-only">End year</label>
              <input
                id="history-to-year"
                type="range"
                min={minYear}
                max={maxYear}
                value={hi}
                onChange={(e) => {
                  const val = Number.parseInt(e.target.value, 10);
                  setToYear(val);
                  if (val <= lo) setFromYear(Math.max(minYear, val - 1));
                }}
                className="h-11 w-24 cursor-pointer accent-[var(--c-accent)]"
                aria-label="End year for capital window"
              />
              <span className="num text-[13px] font-semibold text-ink">{hi}</span>
            </div>
            {lo !== minYear || hi !== maxYear ? (
              <button
                type="button"
                onClick={() => {
                  setFromYear(null);
                  setToYear(null);
                }}
                className="min-h-11 px-2 text-[13px] font-medium text-ink underline decoration-rule underline-offset-4 hover:decoration-ink"
              >
                Reset years
              </button>
            ) : null}
          </div>

          <div className="flex items-center gap-1.5" role="group" aria-label="Money display shape">
            <span className="mr-1 text-[13px] font-medium text-ink-muted">View:</span>
            {(
              [
                { id: "running", label: "Running total" },
                { id: "year", label: "Each year" },
              ] as const
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setRunning(opt.id === "running")}
                aria-pressed={running === (opt.id === "running")}
                className={`min-h-11 rounded-md border px-3 text-[13px] font-medium transition-colors ${
                  running === (opt.id === "running")
                    ? "border-rule-strong bg-surface text-ink shadow-xs"
                    : "border-transparent text-ink-muted hover:text-ink"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* SVG Canvas */}
        <div className="mt-4">
          <svg
            width={width}
            height={p2Height}
            viewBox={`0 0 ${width} ${p2Height}`}
            role="img"
            aria-label="Capital allocation build-out and debt volume over time"
            className="block w-full overflow-visible"
            onMouseLeave={() => setHover(null)}
          >
            {/* Y Axis Gridlines */}
            {[0, 0.5, 1.0].map((fraction) => {
              const usdVal = maxUsd * fraction;
              const y = p2Bottom - fraction * (p2PlotH - 8);
              const label =
                usdVal >= 1e12
                  ? `$${(usdVal / 1e12).toFixed(1)}T`
                  : `$${(usdVal / 1e9).toFixed(0)}B`;
              return (
                <g key={fraction}>
                  <line
                    x1={PADDING_LEFT}
                    y1={y}
                    x2={width - PADDING_RIGHT}
                    y2={y}
                    stroke="rgb(var(--c-rule))"
                    strokeWidth={1}
                    strokeDasharray={fraction === 0 ? undefined : "3 3"}
                  />
                  <text
                    x={PADDING_LEFT - 10}
                    y={y + 4}
                    textAnchor="end"
                    className="num fill-ink-faint text-[12px]"
                  >
                    {label}
                  </text>
                </g>
              );
            })}

            {/* Time Axis Gridlines & Year Labels */}
            {Array.from(new Set(months.map((m) => m.iso.slice(0, 4)))).map((yrStr) => {
              const yrNum = Number.parseInt(yrStr, 10);
              const x = x2(`${yrNum}-01-01`);
              if (!Number.isFinite(x) || x < PADDING_LEFT || x > width - PADDING_RIGHT) {
                return null;
              }
              return (
                <g key={yrStr}>
                  <line
                    x1={x}
                    y1={p2Top}
                    x2={x}
                    y2={p2Bottom}
                    stroke="rgb(var(--c-rule))"
                    strokeWidth={1}
                    strokeDasharray="2 3"
                  />
                  <text
                    x={x}
                    y={p2Bottom + 18}
                    textAnchor="middle"
                    className="num fill-ink text-[12px] font-medium"
                  >
                    {yrStr}
                  </text>
                </g>
              );
            })}

            {/* Filled area */}
            {areaPath ? (
              <path d={areaPath} fill="var(--c-accent)" fillOpacity={0.14} />
            ) : null}

            {/* Debt curve */}
            {debtPath ? (
              <path
                d={debtPath}
                fill="none"
                stroke="rgb(var(--c-caution-500))"
                strokeWidth={2}
              />
            ) : null}

            {/* Total money line */}
            {moneyPath ? (
              <path
                d={moneyPath}
                fill="none"
                stroke="rgb(var(--c-ink))"
                strokeWidth={2.5}
              />
            ) : null}

            {/* Significant deal markers */}
            {running
              ? bundle.events.map((event: BuildOutEvent) => {
                  const evYear = Number.parseInt(event.iso.slice(0, 4), 10);
                  if (evYear < lo || evYear > hi) return null;
                  if (event.amountUsd < maxUsd * 0.05) return null;
                  const month = months.find((m) => m.key === event.iso.slice(0, 7));
                  if (!month) return null;
                  const x = x2(event.iso);
                  const y = usdToY(month.cumulativeUsd);
                  if (!Number.isFinite(x) || !Number.isFinite(y)) return null;

                  return (
                    <circle
                      key={event.iso + event.title}
                      cx={x}
                      cy={y}
                      r={4.5}
                      fill="rgb(var(--c-surface))"
                      stroke="rgb(var(--c-ink))"
                      strokeWidth={2}
                      className="cursor-pointer hover:scale-125 transition-transform"
                      tabIndex={0}
                      role="button"
                      aria-label={`${event.title}: $${(event.amountUsd / 1e9).toFixed(1)}B`}
                      onMouseEnter={() =>
                        setHover({
                          title: event.title,
                          value: `$${(event.amountUsd / 1e9).toFixed(1)}B`,
                          detail: `${event.sector} · announced ${event.label}.`,
                        })
                      }
                      onClick={() =>
                        setPicked({
                          title: event.title,
                          value: `$${(event.amountUsd / 1e9).toFixed(1)}B`,
                          detail: `${event.sector} · announced ${event.label}.`,
                        })
                      }
                    />
                  );
                })
              : null}
          </svg>
        </div>
      </div>

      {/* ══ PANEL 3: Market Price Against Model Print ═══════════════════ */}
      <div className="rounded-lg border border-rule bg-surface p-4 sm:p-5 shadow-card">
        {/* HTML Header & Legend */}
        <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-rule pb-3">
          <div>
            <span className="label">The market against the model</span>
            <h3 className="text-[15px] font-bold tracking-tight text-ink sm:text-[16px]">
              The market&apos;s price against the model&apos;s print
            </h3>
            <p className="mt-0.5 text-[13px] text-ink-muted">
              Polymarket 12-month contract odds since 2024, alongside observed model prints since 18 October 2026
            </p>
          </div>
          <div className="flex items-center gap-4 text-[12px]">
            <span className="inline-flex items-center gap-1.5 font-medium text-ink">
              <span className="h-0.5 w-4 border-b-2 border-dashed border-[var(--c-cat-navy)]" aria-hidden="true" />
              Polymarket (12m contract)
            </span>
            <span className="inline-flex items-center gap-1.5 font-medium text-ink">
              <span className="h-0.5 w-4 bg-[var(--c-accent)]" aria-hidden="true" />
              Model print
            </span>
          </div>
        </div>

        {/* SVG Canvas */}
        <div className="mt-3">
          <svg
            width={width}
            height={p3Height}
            viewBox={`0 0 ${width} ${p3Height}`}
            role="img"
            aria-label="Comparison between Polymarket prediction contract odds and internal quantitative model prints"
            className="block w-full overflow-visible"
            onMouseLeave={() => setHover(null)}
          >
            {/* Y Axis Gridlines */}
            {[0, 25, 50, 75, 100].map((pct) => {
              const y = p3Bottom - (pct / 100) * p3PlotH;
              return (
                <g key={pct}>
                  <line
                    x1={PADDING_LEFT}
                    y1={y}
                    x2={width - PADDING_RIGHT}
                    y2={y}
                    stroke="rgb(var(--c-rule))"
                    strokeWidth={1}
                    strokeDasharray={pct === 0 ? undefined : "3 3"}
                  />
                  <text
                    x={PADDING_LEFT - 10}
                    y={y + 4}
                    textAnchor="end"
                    className="num fill-ink-faint text-[12px]"
                  >
                    {pct}%
                  </text>
                </g>
              );
            })}

            {/* Time Axis Year Ticks */}
            {[p3From, p3From + 1, p3To].map((year) => {
              const x = x3(`${year}-01-01`);
              if (!Number.isFinite(x) || x < PADDING_LEFT || x > width - PADDING_RIGHT) {
                return null;
              }
              return (
                <g key={year}>
                  <line
                    x1={x}
                    y1={p3Top}
                    x2={x}
                    y2={p3Bottom}
                    stroke="rgb(var(--c-rule))"
                    strokeWidth={1}
                    strokeDasharray="2 3"
                  />
                  <text
                    x={x}
                    y={p3Bottom + 18}
                    textAnchor="middle"
                    className="num fill-ink text-[12px] font-medium"
                  >
                    {year}
                  </text>
                </g>
              );
            })}

            {/* Polymarket dashed line */}
            {bundle.market.length ? (
              <>
                <path
                  d={bundle.market
                    .map((m, i) => `${i === 0 ? "M" : "L"}${x3(m.iso).toFixed(1)},${p3ToY(m.twelveMonthPct).toFixed(1)}`)
                    .join(" ")}
                  fill="none"
                  stroke="var(--c-cat-navy)"
                  strokeWidth={2}
                  strokeDasharray="5 4"
                />
                {bundle.market.map((m) => (
                  <circle
                    key={m.iso}
                    cx={x3(m.iso)}
                    cy={p3ToY(m.twelveMonthPct)}
                    r={4}
                    fill="var(--c-cat-navy)"
                    className="cursor-pointer hover:scale-125 transition-transform"
                    tabIndex={0}
                    role="button"
                    aria-label={`Market on ${m.label}: ${m.twelveMonthPct.toFixed(1)}%`}
                    onMouseEnter={() =>
                      setHover({
                        title: `Market price — ${m.label}`,
                        value: `${m.twelveMonthPct.toFixed(1)}%`,
                        detail: `12-month contract; 6-month contract is at ${m.sixMonthPct.toFixed(1)}%.`,
                      })
                    }
                    onClick={() =>
                      setPicked({
                        title: `Market price — ${m.label}`,
                        value: `${m.twelveMonthPct.toFixed(1)}%`,
                        detail: `12-month contract; 6-month contract is at ${m.sixMonthPct.toFixed(1)}%.`,
                      })
                    }
                  />
                ))}
              </>
            ) : null}

            {/* Model print solid line */}
            {bundle.prints.length ? (
              <>
                <path
                  d={bundle.prints
                    .map((p, i) => `${i === 0 ? "M" : "L"}${x3(p.iso).toFixed(1)},${p3ToY(p.probabilityPct).toFixed(1)}`)
                    .join(" ")}
                  fill="none"
                  stroke="var(--c-accent)"
                  strokeWidth={2.5}
                />
                {bundle.prints.map((p) => (
                  <circle
                    key={p.iso}
                    cx={x3(p.iso)}
                    cy={p3ToY(p.probabilityPct)}
                    r={5}
                    fill="var(--c-accent)"
                    stroke="rgb(var(--c-surface))"
                    strokeWidth={1.5}
                    className="cursor-pointer hover:scale-125 transition-transform"
                    tabIndex={0}
                    role="button"
                    aria-label={`Model on ${p.label}: ${p.probabilityPct.toFixed(1)}%`}
                    onMouseEnter={() =>
                      setHover({
                        title: `Model print — ${p.label}`,
                        value: `${p.probabilityPct.toFixed(1)}%`,
                        detail: `Composite ${p.compositeScore.toFixed(1)}.`,
                      })
                    }
                    onClick={() =>
                      setPicked({
                        title: `Model print — ${p.label}`,
                        value: `${p.probabilityPct.toFixed(1)}%`,
                        detail: `Composite ${p.compositeScore.toFixed(1)}.`,
                      })
                    }
                  />
                ))}
                {/* Horizontal reference to right edge for current probability */}
                <line
                  x1={x3(bundle.prints[bundle.prints.length - 1].iso)}
                  y1={p3ToY(currentProbabilityPct)}
                  x2={width - PADDING_RIGHT}
                  y2={p3ToY(currentProbabilityPct)}
                  stroke="var(--c-accent)"
                  strokeWidth={1}
                  strokeDasharray="2 3"
                />
              </>
            ) : null}
          </svg>
        </div>
      </div>

      {/* ── Accessible Tables Underneath ─────────────────────────────── */}
      <HistoryTable bundle={bundle} />
    </figure>
  );
}

/** The same numbers as the chart, in accessible HTML tables. */
function HistoryTable({ bundle }: { bundle: HistoryBundle }) {
  return (
    <div className="space-y-4 pt-2">
      <div className="overflow-x-auto rounded-lg border border-rule">
        <table className="w-full text-left text-[14px]">
          <caption className="sr-only">
            The model&rsquo;s probability for each historical episode, with composite score and burst outcome.
          </caption>
          <thead className="bg-surface-2 text-ink-subtle">
            <tr>
              <th scope="col" className="p-2.5 font-medium">Episode</th>
              <th scope="col" className="p-2.5 font-medium">Year</th>
              <th scope="col" className="p-2.5 text-right font-medium">Model probability</th>
              <th scope="col" className="p-2.5 text-right font-medium">Composite</th>
              <th scope="col" className="p-2.5 font-medium">Burst observed</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-rule">
            {bundle.episodes.map((episode: HistoryEpisode) => (
              <tr key={episode.id} className="hover:bg-surface-2/40">
                <th scope="row" className="p-2.5 font-semibold text-ink">{episode.era}</th>
                <td className="num p-2.5 text-ink-muted">{episode.year}</td>
                <td className="num p-2.5 text-right font-medium text-ink">{episode.probabilityPct.toFixed(1)}%</td>
                <td className="num p-2.5 text-right text-ink-muted">{episode.compositeScore.toFixed(1)}</td>
                <td className="p-2.5 text-ink-muted">
                  {episode.burstObserved ? (
                    <span className="inline-flex items-center gap-1 font-semibold text-risk-600">
                      Yes
                    </span>
                  ) : (
                    <span className="text-accent font-medium">Live ongoing</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="overflow-x-auto rounded-lg border border-rule">
        <table className="w-full text-left text-[14px]">
          <caption className="sr-only">
            Polymarket 12-month contract price alongside the model&rsquo;s observed print.
          </caption>
          <thead className="bg-surface-2 text-ink-subtle">
            <tr>
              <th scope="col" className="p-2.5 font-medium">Date</th>
              <th scope="col" className="p-2.5 text-right font-medium">Market 12-month</th>
              <th scope="col" className="p-2.5 text-right font-medium">Model print</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-rule">
            {bundle.market.map((reading: MarketReading) => {
              const print = bundle.prints.find(
                (p: ModelPrint) => p.iso.slice(0, 7) === reading.iso.slice(0, 7)
              );
              return (
                <tr key={reading.iso} className="hover:bg-surface-2/40">
                  <th scope="row" className="p-2.5 font-semibold text-ink">{reading.label}</th>
                  <td className="num p-2.5 text-right font-medium text-ink">{reading.twelveMonthPct.toFixed(1)}%</td>
                  <td className="num p-2.5 text-right text-ink-muted">
                    {print ? `${print.probabilityPct.toFixed(1)}%` : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default HistoryChart;
