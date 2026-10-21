"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  type BuildOutMonth,
  type HistoryBundle,
  type HistoryEpisode,
  type MarketReading,
  type ModelPrint,
} from "@/lib/history-series";

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * The history, drawn as SVG with real HTML controls around it.
 *
 * Three panels, because the history is three different things and one axis
 * would lie about all three:
 *
 *   1. HOW THE MODEL READS A MARKET THAT HAS ALREADY RESOLVED - one column
 *      per historical episode, from 1929 to the present, with the model's
 *      probability and whether the episode burst.
 *   2. THE BUILD-OUT'S MONEY - the disclosed capital from the ledger, with
 *      the debt inside it. This is what the model reads; it is NOT the model's
 *      print. A range control chooses the years; a switch chooses whether the
 *      shape is the running total or each year's own spend.
 *   3. THE MARKET'S PRICE AGAINST THE MODEL'S PRINT - what Polymarket has
 *      charged for the same question, and the model's own print.
 *
 * Everything here is ordinary SVG and ordinary HTML: a range input the reader
 * can drag, a switch they can flip, marks they can point at, and a keyboard
 * path through all of it. The numbers are in the tables underneath as well, so
 * nothing is hover-only.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export interface HistoryChartProps {
  bundle: HistoryBundle;
  /** The model's current print, so the last point can be called out. */
  currentProbabilityPct: number;
}

const PADDING_LEFT = 52;
const PADDING_RIGHT = 24;
const TITLE_BAND = 40;
const PANEL1_H = 176;
const PANEL2_H = 150;
const PANEL3_H = 132;
const GAP = 34;

type Readout = {
  title: string;
  value: string;
  detail: string;
};

export function HistoryChart({ bundle, currentProbabilityPct }: HistoryChartProps) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [width, setWidth] = useState(900);
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

  /* ── Sizing: the SVG is drawn at CSS pixels so the type is always the
        size it says it is, at any width. ─────────────────────────────────── */
  useEffect(() => {
    const element = wrapRef.current;
    if (!element) return;
    const measure = () => setWidth(Math.max(320, element.clientWidth));
    measure();
    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", measure);
      return () => window.removeEventListener("resize", measure);
    }
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const height =
    TITLE_BAND + PANEL1_H + GAP + TITLE_BAND + PANEL2_H + GAP + TITLE_BAND + PANEL3_H + 28;

  const innerW = Math.max(60, width - PADDING_LEFT - PADDING_RIGHT);

  /**
   * The time scale. A year is not a position: four readings inside 2024 used
   * to land on the same pixel, which is what turned the area chart into a
   * staircase and stacked the market's points on top of each other.
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
  const p1Top = TITLE_BAND;
  const p1Bottom = p1Top + PANEL1_H;
  const p2Title = p1Bottom + GAP;
  const p2Top = p2Title + TITLE_BAND;
  const p2Bottom = p2Top + PANEL2_H;
  const p3Title = p2Bottom + GAP;
  const p3Top = p3Title + TITLE_BAND;
  const p3Bottom = p3Top + PANEL3_H;

  /* ── Panel 1: the episodes ─────────────────────────────────────────────── */
  const episodes = bundle.episodes;
  const slot = episodes.length ? innerW / episodes.length : innerW;
  const barW = Math.min(44, slot * 0.5);

  /* ── Panel 2: the money ────────────────────────────────────────────────── */
  const months = bundle.months.filter((m) => {
    const year = Number.parseInt(m.iso.slice(0, 4), 10);
    return year >= lo && year <= hi;
  });
  const maxUsd = useMemo(() => {
    const values = months.map((m) => (running ? m.cumulativeUsd : m.newUsd));
    return values.length ? Math.max(...values, 1) : 1;
  }, [months, running]);

  const x2 = scaleTime(`${lo}-01-01`, `${hi}-12-31`);
  const usdToY = (usd: number) =>
    p2Bottom - (usd / maxUsd) * (PANEL2_H - 18) - 4;

  /* ── Panel 3: the market against the print ─────────────────────────────── */
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
  const p3ToY = (pct: number) => p3Bottom - (pct / 100) * (PANEL3_H - 16);

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

  const readout = hover ?? picked;

  const onKey = useCallback(
    (event: React.KeyboardEvent<SVGSVGElement>) => {
      if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
      event.preventDefault();
      const marks: Readout[] = [
        ...episodes.map((e: HistoryEpisode) => ({
          title: `${e.era} (${e.date})`,
          value: `${e.probabilityPct.toFixed(1)}%`,
          detail: `${e.outcome} Composite ${e.compositeScore.toFixed(1)}.`,
        })),
        ...bundle.market.map((m: MarketReading) => ({
          title: `Market price - ${m.label}`,
          value: `${m.twelveMonthPct.toFixed(1)}%`,
          detail: `12-month contract; the 6-month contract is at ${m.sixMonthPct.toFixed(1)}%.`,
        })),
        ...bundle.prints.map((p: ModelPrint) => ({
          title: `Model print - ${p.label}`,
          value: `${p.probabilityPct.toFixed(1)}%`,
          detail: `Composite ${p.compositeScore.toFixed(1)}.`,
        })),
      ];
      const current = picked ? marks.findIndex((m) => m.title === picked.title) : -1;
      const next =
        event.key === "ArrowRight"
          ? Math.min(marks.length - 1, current + 1)
          : Math.max(0, current <= 0 ? 0 : current - 1);
      setPicked(marks[next]);
    },
    [episodes, bundle.market, bundle.prints, picked]
  );

  const description = `Three panels. The model's probability for each of the ${episodes.length} historical episodes it has been read against, from ${bundle.fromYear} to ${bundle.toYear}, with whether the episode burst. The disclosed capital from the ledger between ${lo} and ${hi}, with the debt inside it. And the market's price for the same question against the model's own print since 18 October 2026.`;

  return (
    <figure className="m-0">
      {/* ── The controls: plain HTML, so they work with a finger, a mouse
             and a keyboard, and so the chart can be read without them. ──── */}
      <div className="mb-3 flex flex-wrap items-end gap-x-6 gap-y-3 border-b border-rule pb-3">
        <div className="min-w-[15rem] flex-1">
          <label
            htmlFor="history-years"
            className="block text-[13px] font-medium text-ink-muted"
          >
            Years shown: {lo} to {hi}
          </label>
          <div className="mt-1.5 flex items-center gap-2">
            <input
              id="history-years"
              type="range"
              min={minYear}
              max={maxYear}
              value={lo}
              onChange={(event) => {
                const next = Number.parseInt(event.target.value, 10);
                setFromYear(next);
                if (next >= hi) setToYear(Math.min(maxYear, next + 1));
              }}
              className="h-11 w-full cursor-pointer accent-[var(--c-accent)]"
              aria-label="The first year shown on the money chart"
            />
            <input
              type="range"
              min={minYear}
              max={maxYear}
              value={hi}
              onChange={(event) => {
                const next = Number.parseInt(event.target.value, 10);
                setToYear(next);
                if (next <= lo) setFromYear(Math.max(minYear, next - 1));
              }}
              className="h-11 w-full cursor-pointer accent-[var(--c-accent)]"
              aria-label="The last year shown on the money chart"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[13px] font-medium text-ink-muted">The money chart shows</span>
          <div className="flex gap-1" role="group" aria-label="How the money chart is drawn">
            {(
              [
                { id: "running", label: "Running total" },
                { id: "year", label: "Each year" },
              ] as const
            ).map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => setRunning(option.id === "running")}
                aria-pressed={running === (option.id === "running")}
                className={`min-h-11 rounded-md border px-3 text-[13px] font-medium transition-colors ${
                  running === (option.id === "running")
                    ? "border-rule-strong bg-surface-2 text-ink"
                    : "border-rule text-ink-muted hover:text-ink"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
          {lo !== minYear || hi !== maxYear ? (
            <button
              type="button"
              onClick={() => {
                setFromYear(null);
                setToYear(null);
              }}
              className="min-h-11 text-[13px] font-medium text-ink underline decoration-rule underline-offset-4 hover:decoration-ink"
            >
              All years
            </button>
          ) : null}
        </div>
      </div>

      <div ref={wrapRef} className="w-full">
        <svg
          width={width}
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          role="img"
          tabIndex={0}
          aria-label={description}
          onKeyDown={onKey}
          onMouseLeave={() => setHover(null)}
          className="block w-full rounded-md border border-rule bg-surface"
        >
          {/* ══ PANEL 1 · the model on resolved episodes ══════════════════ */}
          <text x={PADDING_LEFT} y={16} className="fill-ink text-[13px] font-semibold">
            The model on markets that have already resolved
          </text>
          <text x={PADDING_LEFT} y={32} className="fill-ink-faint text-[12px]">
            its probability for each episode, and whether it burst
          </text>
          {[0, 25, 50, 75, 100].map((pct) => {
            const y = p1Bottom - (pct / 100) * PANEL1_H;
            return (
              <g key={pct}>
                <line
                  x1={PADDING_LEFT}
                  y1={y}
                  x2={width - PADDING_RIGHT}
                  y2={y}
                  stroke="rgb(var(--c-rule))"
                  strokeWidth={1}
                />
                <text
                  x={PADDING_LEFT - 8}
                  y={y + 4}
                  textAnchor="end"
                  className="num fill-ink-faint text-[12px]"
                >
                  {pct}%
                </text>
              </g>
            );
          })}
          {episodes.map((episode, index) => {
            const x = PADDING_LEFT + slot * index + (slot - barW) / 2;
            const barH = (episode.probabilityPct / 100) * PANEL1_H;
            const y = p1Bottom - barH;
            const isNow = episode.year >= 2026;
            return (
              <g
                key={episode.id}
                className="cursor-pointer"
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
              >
                <rect
                  x={x}
                  y={y}
                  width={barW}
                  height={barH}
                  fill={isNow ? "var(--c-accent)" : "rgb(var(--c-ink))"}
                />
                {episode.burstObserved ? (
                  <rect
                    x={x}
                    y={p1Bottom + 3}
                    width={barW}
                    height={3}
                    fill="rgb(var(--c-risk-500))"
                  />
                ) : null}
                <text
                  x={x + barW / 2}
                  y={y - 8}
                  textAnchor="middle"
                  className="num fill-ink text-[12px] font-semibold"
                >
                  {episode.probabilityPct.toFixed(1)}
                </text>
                <text
                  x={x + barW / 2}
                  y={p1Bottom + 15}
                  textAnchor="middle"
                  className="num fill-ink-faint text-[12px]"
                >
                  {episode.year}
                </text>
              </g>
            );
          })}

          {/* ══ PANEL 2 · the money ═══════════════════════════════════════ */}
          <text x={PADDING_LEFT} y={p2Title + 16} className="fill-ink text-[13px] font-semibold">
            The money going in
          </text>
          <text x={PADDING_LEFT} y={p2Title + 32} className="fill-ink-faint text-[12px]">
            disclosed capital from the ledger, and the debt inside it
          </text>
          <line
            x1={PADDING_LEFT}
            y1={p2Bottom}
            x2={width - PADDING_RIGHT}
            y2={p2Bottom}
            stroke="rgb(var(--c-rule))"
          />
          {Array.from(new Set(months.map((m) => m.iso.slice(0, 4)))).map((year) => {
            const x = x2(`${year}-01-01`);
            return (
              <g key={year}>
                <line
                  x1={x}
                  y1={p2Top + 12}
                  x2={x}
                  y2={p2Bottom}
                  stroke="rgb(var(--c-rule))"
                  strokeWidth={1}
                />
                <text
                  x={x}
                  y={p2Bottom + 15}
                  textAnchor="middle"
                  className="num fill-ink-faint text-[12px]"
                >
                  {year}
                </text>
              </g>
            );
          })}
          {areaPath ? (
            <path d={areaPath} fill="var(--c-accent)" fillOpacity={0.16} />
          ) : null}
          {debtPath ? (
            <path
              d={debtPath}
              fill="none"
              stroke="rgb(var(--c-caution-500))"
              strokeWidth={2}
            />
          ) : null}
          {moneyPath ? (
            <path
              d={moneyPath}
              fill="none"
              stroke="rgb(var(--c-ink))"
              strokeWidth={2}
            />
          ) : null}
          {running
            ? bundle.events.map((event) => {
                const year = Number.parseInt(event.iso.slice(0, 4), 10);
                if (year < lo || year > hi) return null;
                if (event.amountUsd < maxUsd * 0.05) return null;
                const month = months.find((m) => m.key === event.iso.slice(0, 7));
                if (!month) return null;
                const x = x2(event.iso);
                const y = usdToY(month.cumulativeUsd);
                return (
                  <circle
                    key={event.iso + event.title}
                    cx={x}
                    cy={y}
                    r={4}
                    fill="rgb(var(--c-ink))"
                    className="cursor-pointer"
                    onMouseEnter={() =>
                      setHover({
                        title: event.title,
                        value: `$${(event.amountUsd / 1e9).toFixed(1)}B`,
                        detail: `${event.sector} - announced ${event.label}.`,
                      })
                    }
                    onClick={() =>
                      setPicked({
                        title: event.title,
                        value: `$${(event.amountUsd / 1e9).toFixed(1)}B`,
                        detail: `${event.sector} - announced ${event.label}.`,
                      })
                    }
                  />
                );
              })
            : null}

          {/* ══ PANEL 3 · the market against the print ═════════════════════ */}
          <text x={PADDING_LEFT} y={p3Title + 16} className="fill-ink text-[13px] font-semibold">
            The market&apos;s price, and the model&apos;s print
          </text>
          <text x={PADDING_LEFT} y={p3Title + 32} className="fill-ink-faint text-[12px]">
            Polymarket since 2024; the model&apos;s own print since 18 October 2026
          </text>
          <g>
            <text
              x={width - PADDING_RIGHT}
              y={p3Title + 16}
              textAnchor="end"
              className="num fill-ink-faint text-[12px]"
            >
              — market
            </text>
            <text
              x={width - PADDING_RIGHT}
              y={p3Title + 32}
              textAnchor="end"
              className="num fill-ink-faint text-[12px]"
            >
              — model print
            </text>
          </g>
          {[0, 25, 50, 75, 100].map((pct) => {
            const y = p3Bottom - (pct / 100) * (PANEL3_H - 16);
            return (
              <g key={pct}>
                <line
                  x1={PADDING_LEFT}
                  y1={y}
                  x2={width - PADDING_RIGHT}
                  y2={y}
                  stroke="rgb(var(--c-rule))"
                  strokeWidth={1}
                />
                <text
                  x={PADDING_LEFT - 8}
                  y={y + 4}
                  textAnchor="end"
                  className="num fill-ink-faint text-[12px]"
                >
                  {pct}%
                </text>
              </g>
            );
          })}
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
                  className="cursor-pointer"
                  onMouseEnter={() =>
                    setHover({
                      title: `Market price - ${m.label}`,
                      value: `${m.twelveMonthPct.toFixed(1)}%`,
                      detail: `The 12-month contract; the 6-month contract is at ${m.sixMonthPct.toFixed(1)}%.`,
                    })
                  }
                  onClick={() =>
                    setPicked({
                      title: `Market price - ${m.label}`,
                      value: `${m.twelveMonthPct.toFixed(1)}%`,
                      detail: `The 12-month contract; the 6-month contract is at ${m.sixMonthPct.toFixed(1)}%.`,
                    })
                  }
                />
              ))}
            </>
          ) : null}
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
                  className="cursor-pointer"
                  onMouseEnter={() =>
                    setHover({
                      title: `Model print - ${p.label}`,
                      value: `${p.probabilityPct.toFixed(1)}%`,
                      detail: `Composite ${p.compositeScore.toFixed(1)}.`,
                    })
                  }
                  onClick={() =>
                    setPicked({
                      title: `Model print - ${p.label}`,
                      value: `${p.probabilityPct.toFixed(1)}%`,
                      detail: `Composite ${p.compositeScore.toFixed(1)}.`,
                    })
                  }
                />
              ))}
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

      {/* The readout: always on the page, so the numbers are reachable
          without pointing at anything. */}
      <div className="mt-2 flex flex-wrap items-baseline justify-between gap-2 border-t border-rule pt-2">
        <p className="text-[14px] text-ink-muted" aria-live="polite">
          {readout ? (
            <>
              <span className="font-semibold text-ink">{readout.title}</span> —{" "}
              <span className="num font-semibold text-ink">{readout.value}</span>
              {readout.detail ? `. ${readout.detail}` : ""}
            </>
          ) : (
            <span className="text-ink-faint">
              Point at a column, a dot or a deal to read it. Drag the year handles to
              change the window; with a keyboard, focus the chart and use the arrow keys.
            </span>
          )}
        </p>
      </div>

      <HistoryTable bundle={bundle} />
    </figure>
  );
}

/** The same numbers as the chart, as a table. Nothing here is hover-only. */
function HistoryTable({ bundle }: { bundle: HistoryBundle }) {
  return (
    <div className="mt-4 space-y-4">
      <div className="overflow-x-auto rounded-lg border border-rule">
        <table className="w-full text-left text-[14px]">
          <caption className="sr-only">
            The model&rsquo;s probability for each historical episode, with the composite
            score and whether the episode burst.
          </caption>
          <thead className="bg-surface-2 text-ink-subtle">
            <tr>
              <th scope="col" className="p-2 font-medium">Episode</th>
              <th scope="col" className="p-2 font-medium">Year</th>
              <th scope="col" className="p-2 text-right font-medium">Model probability</th>
              <th scope="col" className="p-2 text-right font-medium">Composite</th>
              <th scope="col" className="p-2 font-medium">Burst</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-rule">
            {bundle.episodes.map((episode: HistoryEpisode) => (
              <tr key={episode.id}>
                <th scope="row" className="p-2 font-semibold text-ink">{episode.era}</th>
                <td className="num p-2 text-ink-muted">{episode.year}</td>
                <td className="num p-2 text-right text-ink">{episode.probabilityPct.toFixed(1)}%</td>
                <td className="num p-2 text-right text-ink-muted">{episode.compositeScore.toFixed(1)}</td>
                <td className="p-2 text-ink-muted">{episode.burstObserved ? "Yes" : "No"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="overflow-x-auto rounded-lg border border-rule">
        <table className="w-full text-left text-[14px]">
          <caption className="sr-only">
            The market&rsquo;s price for the same question against the model&rsquo;s own print.
          </caption>
          <thead className="bg-surface-2 text-ink-subtle">
            <tr>
              <th scope="col" className="p-2 font-medium">Date</th>
              <th scope="col" className="p-2 text-right font-medium">Market, 12-month</th>
              <th scope="col" className="p-2 text-right font-medium">Model print</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-rule">
            {bundle.market.map((reading: MarketReading) => {
              const print = bundle.prints.find(
                (p: ModelPrint) => p.iso.slice(0, 7) === reading.iso.slice(0, 7)
              );
              return (
                <tr key={reading.iso}>
                  <th scope="row" className="p-2 font-semibold text-ink">{reading.label}</th>
                  <td className="num p-2 text-right text-ink">{reading.twelveMonthPct.toFixed(1)}%</td>
                  <td className="num p-2 text-right text-ink-muted">
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
