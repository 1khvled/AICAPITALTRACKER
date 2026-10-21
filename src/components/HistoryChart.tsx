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
 * The history, drawn on a canvas.
 *
 * Three panels, because the history is three different things and forcing
 * them onto one axis would lie about all three:
 *
 *   1. HOW THE MODEL READS A MARKET THAT HAS ALREADY RESOLVED - one column
 *      per historical episode, from 1929 to the present, with the model's
 *      probability for that episode and whether it burst.
 *   2. THE BUILD-OUT'S MONEY, 2023 TO NOW - the disclosed capital from the
 *      ledger, month by month, with the debt portion inside it. This is what
 *      the model reads; it is NOT the model's print.
 *   3. THE PRICE AGAINST THE PRINT - what the market has charged for the same
 *      question since 2024, and the model's own print since 18 October 2026.
 *
 * It is a canvas rather than SVG because it is a chart, not a picture of one:
 * a real hit-test, a real drag-to-zoom, a real readout, and a keyboard path
 * through the marks. The numbers are all in the table underneath, so nothing
 * here is the only way to reach a value.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export interface HistoryChartProps {
  bundle: HistoryBundle;
  /** The model's current print, so the last column can be marked as live. */
  currentProbabilityPct: number;
}

interface Mark {
  kind: "episode" | "market" | "print";
  index: number;
  x: number;
  y: number;
  label: string;
  value: number;
  detail: string;
  extra?: string;
}

const PANEL1_H = 190;
const PANEL2_H = 150;
const PANEL3_H = 130;
const PADDING_LEFT = 46;
const PADDING_RIGHT = 18;
const PADDING_TOP = 18;
const GAP = 34;

export function HistoryChart({ bundle, currentProbabilityPct }: HistoryChartProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [width, setWidth] = useState(900);
  const [hover, setHover] = useState<Mark | null>(null);
  const [selected, setSelected] = useState<Mark | null>(null);
  const [zoom, setZoom] = useState<{ from: number; to: number } | null>(null);
  const [drag, setDrag] = useState<{ x0: number; x1: number } | null>(null);
  const dragRef = useRef<{ x0: number; x1: number } | null>(null);

  const height = PADDING_TOP + PANEL1_H + GAP + PANEL2_H + GAP + PANEL3_H + 22;

  /* ── The zoom range for the time series (panel 2) ───────────────────── */
  const buildOutYears = useMemo(
    () => bundle.months.map((m) => Number.parseInt(m.iso.slice(0, 4), 10)),
    [bundle.months]
  );
  const [minYear, maxYear] = useMemo(() => {
    const years = buildOutYears.filter((y) => Number.isFinite(y));
    return years.length ? [Math.min(...years), Math.max(...years)] : [2023, 2026];
  }, [buildOutYears]);
  const range = zoom ?? { from: minYear, to: maxYear };

  /* ── The canvas draw ─────────────────────────────────────────────────── */
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = width;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = `${w}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, height);

    const styles = getComputedStyle(document.documentElement);
    const css = (name: string, fallback: string) =>
      (styles.getPropertyValue(name) || fallback).trim() || fallback;
    const ink = css("--c-ink", "12 14 17");
    const inkMuted = css("--c-ink-muted", "74 82 92");
    const inkFaint = css("--c-ink-faint", "100 108 118");
    const rule = css("--c-rule", "226 229 233");
    const accent = css("--c-accent", "#A9743A");
    const surface2 = css("--c-surface-2", "243 245 247");
    const catNavy = css("--c-cat-navy", "#3A4E7A");
    const caution = css("--c-caution-500", "#B57F0A");
    const risk = css("--c-risk-500", "#D1433C");

    const inkRgb = `rgb(${ink})`;
    const mutedRgb = `rgb(${inkMuted})`;
    const faintRgb = `rgb(${inkFaint})`;
    const ruleRgb = `rgb(${rule})`;

    const marks: Mark[] = [];
    const innerW = w - PADDING_LEFT - PADDING_RIGHT;

    ctx.font = "12px ui-monospace, SFMono-Regular, Menlo, monospace";
    ctx.textBaseline = "middle";

    /* ── PANEL 1: the model's readings on resolved episodes ─────────────── */
    const p1Top = PADDING_TOP;
    const p1Bottom = p1Top + PANEL1_H;

    ctx.strokeStyle = ruleRgb;
    ctx.lineWidth = 1;
    for (const pct of [0, 25, 50, 75, 100]) {
      const y = p1Bottom - (pct / 100) * PANEL1_H;
      ctx.beginPath();
      ctx.moveTo(PADDING_LEFT, y);
      ctx.lineTo(w - PADDING_RIGHT, y);
      ctx.stroke();
      ctx.fillStyle = faintRgb;
      ctx.textAlign = "right";
      ctx.fillText(`${pct}%`, PADDING_LEFT - 8, y);
    }

    ctx.fillStyle = ink;
    ctx.textAlign = "left";
    ctx.font = "600 13px ui-monospace, SFMono-Regular, Menlo, monospace";
    ctx.fillText("The model on markets that have already resolved", PADDING_LEFT, p1Top - 4);
    ctx.font = "12px ui-monospace, SFMono-Regular, Menlo, monospace";
    ctx.fillStyle = faintRgb;
    ctx.fillText(
      "its probability for each episode, and whether it burst",
      PADDING_LEFT,
      p1Top + 12
    );

    const episodes = bundle.episodes;
    const slot = episodes.length ? innerW / episodes.length : innerW;
    episodes.forEach((episode, index) => {
      const barW = Math.min(46, slot * 0.52);
      const x = PADDING_LEFT + slot * index + (slot - barW) / 2;
      const barH = (episode.probabilityPct / 100) * PANEL1_H;
      const y = p1Bottom - barH;
      const isNow = episode.year >= 2026;

      ctx.fillStyle = isNow ? accent : inkRgb;
      ctx.fillRect(x, y, barW, barH);

      // The tick under the bar: this episode DID break.
      if (episode.burstObserved) {
        ctx.fillStyle = risk;
        ctx.fillRect(x, p1Bottom + 3, barW, 3);
      }

      ctx.fillStyle = ink;
      ctx.textAlign = "center";
      ctx.font = "600 12px ui-monospace, SFMono-Regular, Menlo, monospace";
      ctx.fillText(`${episode.probabilityPct.toFixed(1)}`, x + barW / 2, y - 10);

      ctx.fillStyle = faintRgb;
      ctx.font = "11px ui-monospace, SFMono-Regular, Menlo, monospace";
      ctx.fillText(String(episode.year), x + barW / 2, p1Bottom + 14);

      marks.push({
        kind: "episode",
        index,
        x: x + barW / 2,
        y: y + barH / 2,
        label: `${episode.era} (${episode.date})`,
        value: episode.probabilityPct,
        detail: episode.outcome,
        extra: `composite ${episode.compositeScore.toFixed(1)}`,
      });
    });

    /* ── PANEL 2: the build-out's money ────────────────────────────────── */
    const p2Top = p1Bottom + GAP;
    const p2Bottom = p2Top + PANEL2_H;

    ctx.strokeStyle = ruleRgb;
    ctx.beginPath();
    ctx.moveTo(PADDING_LEFT, p2Bottom);
    ctx.lineTo(w - PADDING_RIGHT, p2Bottom);
    ctx.stroke();

    ctx.fillStyle = ink;
    ctx.textAlign = "left";
    ctx.font = "600 13px ui-monospace, SFMono-Regular, Menlo, monospace";
    ctx.fillText("The money going in, 2023 to now", PADDING_LEFT, p2Top - 4);
    ctx.font = "12px ui-monospace, SFMono-Regular, Menlo, monospace";
    ctx.fillStyle = faintRgb;
    ctx.fillText(
      "disclosed capital from the ledger, and the debt inside it",
      PADDING_LEFT,
      p2Top + 12
    );

    const months = bundle.months;
    const maxUsd = months.length ? Math.max(...months.map((m) => m.cumulativeUsd)) : 1;
    const yearToX = (year: number) =>
      PADDING_LEFT + ((year - range.from) / Math.max(1, range.to - range.from)) * innerW;
    const usdToY = (usd: number) => p2Bottom - (usd / Math.max(1, maxUsd)) * (PANEL2_H - 14);

    // Year gridlines and labels.
    ctx.textAlign = "center";
    ctx.font = "11px ui-monospace, SFMono-Regular, Menlo, monospace";
    for (let year = range.from; year <= range.to; year++) {
      const x = yearToX(year);
      if (x < PADDING_LEFT - 1 || x > w - PADDING_RIGHT + 1) continue;
      ctx.strokeStyle = ruleRgb;
      ctx.beginPath();
      ctx.moveTo(x, p2Top + 22);
      ctx.lineTo(x, p2Bottom);
      ctx.stroke();
      ctx.fillStyle = faintRgb;
      ctx.fillText(String(year), x, p2Bottom + 13);
    }

    // The area: the total, with the debt portion inside it.
    if (months.length) {
      ctx.beginPath();
      ctx.moveTo(yearToX(Number.parseInt(months[0].iso.slice(0, 4), 10)), p2Bottom);
      for (const month of months) {
        ctx.lineTo(
          yearToX(Number.parseInt(month.iso.slice(0, 4), 10)),
          usdToY(month.cumulativeUsd)
        );
      }
      ctx.lineTo(yearToX(Number.parseInt(months[months.length - 1].iso.slice(0, 4), 10)), p2Bottom);
      ctx.closePath();
      ctx.fillStyle = accent;
      ctx.globalAlpha = 0.18;
      ctx.fill();
      ctx.globalAlpha = 1;

      ctx.beginPath();
      months.forEach((month, index) => {
        const x = yearToX(Number.parseInt(month.iso.slice(0, 4), 10));
        const y = usdToY(month.debtCumulativeUsd);
        if (index === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.strokeStyle = caution;
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.beginPath();
      months.forEach((month, index) => {
        const x = yearToX(Number.parseInt(month.iso.slice(0, 4), 10));
        const y = usdToY(month.cumulativeUsd);
        if (index === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.strokeStyle = ink;
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // The big deals, marked on the line.
    for (const event of bundle.events) {
      const year = Number.parseInt(event.iso.slice(0, 4), 10);
      if (year < range.from || year > range.to) continue;
      if (event.amountUsd < maxUsd * 0.06) continue;
      const x = yearToX(year);
      const month = months.find((m) => m.key === event.iso.slice(0, 7));
      if (!month) continue;
      const y = usdToY(month.cumulativeUsd);
      ctx.fillStyle = ink;
      ctx.beginPath();
      ctx.arc(x, y, 3.5, 0, Math.PI * 2);
      ctx.fill();
      marks.push({
        kind: "episode",
        index: marks.length,
        x,
        y,
        label: event.title,
        value: event.amountUsd,
        detail: `${event.sector} - announced ${event.label}`,
      });
    }

    /* ── PANEL 3: the market's price against the model's print ─────────── */
    const p3Top = p2Bottom + GAP;
    const p3Bottom = p3Top + PANEL3_H;

    ctx.strokeStyle = ruleRgb;
    for (const pct of [0, 50, 100]) {
      const y = p3Bottom - (pct / 100) * PANEL3_H;
      ctx.beginPath();
      ctx.moveTo(PADDING_LEFT, y);
      ctx.lineTo(w - PADDING_RIGHT, y);
      ctx.stroke();
      ctx.fillStyle = faintRgb;
      ctx.textAlign = "right";
      ctx.font = "12px ui-monospace, SFMono-Regular, Menlo, monospace";
      ctx.fillText(`${pct}%`, PADDING_LEFT - 8, y);
    }

    ctx.fillStyle = ink;
    ctx.textAlign = "left";
    ctx.font = "600 13px ui-monospace, SFMono-Regular, Menlo, monospace";
    ctx.fillText("The market's price, and the model's print", PADDING_LEFT, p3Top - 4);
    ctx.font = "12px ui-monospace, SFMono-Regular, Menlo, monospace";
    ctx.fillStyle = faintRgb;
    ctx.fillText(
      "Polymarket since 2024; the model's own print since 18 October 2026",
      PADDING_LEFT,
      p3Top + 12
    );

    const p3InnerW = innerW;
    const p3From = bundle.market.length
      ? Number.parseInt(bundle.market[0].iso.slice(0, 4), 10)
      : 2024;
    const p3To = Math.max(
      p3From + 1,
      bundle.prints.length
        ? Number.parseInt(bundle.prints[bundle.prints.length - 1].iso.slice(0, 4), 10)
        : p3From + 2
    );
    const p3ToX = (iso: string) =>
      PADDING_LEFT +
      ((Number.parseInt(iso.slice(0, 4), 10) - p3From) / Math.max(1, p3To - p3From)) * p3InnerW;
    const p3ToY = (pct: number) => p3Bottom - (pct / 100) * PANEL3_H;

    // The market: a dashed line.
    if (bundle.market.length) {
      ctx.setLineDash([5, 4]);
      ctx.strokeStyle = catNavy;
      ctx.lineWidth = 2;
      ctx.beginPath();
      bundle.market.forEach((reading, index) => {
        const x = p3ToX(reading.iso);
        const y = p3ToY(reading.twelveMonthPct);
        if (index === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
      ctx.setLineDash([]);

      for (const reading of bundle.market) {
        const x = p3ToX(reading.iso);
        const y = p3ToY(reading.twelveMonthPct);
        ctx.fillStyle = catNavy;
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fill();
        marks.push({
          kind: "market",
          index: marks.length,
          x,
          y,
          label: `Market price - ${reading.label}`,
          value: reading.twelveMonthPct,
          detail: `12-month contract at ${reading.twelveMonthPct.toFixed(1)}%; the 6-month contract at ${reading.sixMonthPct.toFixed(1)}%`,
        });
      }
    }

    // The model's print: solid, in the accent.
    if (bundle.prints.length) {
      ctx.strokeStyle = accent;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      bundle.prints.forEach((print, index) => {
        const x = p3ToX(print.iso);
        const y = p3ToY(print.probabilityPct);
        if (index === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();

      for (const print of bundle.prints) {
        const x = p3ToX(print.iso);
        const y = p3ToY(print.probabilityPct);
        ctx.fillStyle = accent;
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fill();
        marks.push({
          kind: "print",
          index: marks.length,
          x,
          y,
          label: `Model print - ${print.label}`,
          value: print.probabilityPct,
          detail: `composite ${print.compositeScore.toFixed(1)}`,
        });
      }
    }

    // The current print, called out at the right edge.
    const lastPrint = bundle.prints[bundle.prints.length - 1];
    if (lastPrint) {
      const x = p3ToX(lastPrint.iso);
      const y = p3ToY(currentProbabilityPct);
      ctx.strokeStyle = accent;
      ctx.setLineDash([2, 3]);
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(w - PADDING_RIGHT, y);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // The legend.
    ctx.textAlign = "right";
    ctx.font = "12px ui-monospace, SFMono-Regular, Menlo, monospace";
    ctx.fillStyle = catNavy;
    ctx.fillText("— market", w - PADDING_RIGHT, p3Top + 4);
    ctx.fillStyle = accent;
    ctx.fillText("— model print", w - PADDING_RIGHT, p3Top + 20);

    marksRef.current = marks;
    // The mark count, for tests and for anyone poking at it in the console.
    canvas.dataset.marks = String(marks.length);
  }, [bundle, width, height, range, currentProbabilityPct]);

  const marksRef = useRef<Mark[]>([]);

  /* ── Sizing ──────────────────────────────────────────────────────────── */
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

  /* ── Draw ────────────────────────────────────────────────────────────── */
  useEffect(() => {
    let cancelled = false;
    const paint = () => {
      if (cancelled) return;
      draw();
    };
    if (document.fonts && document.fonts.ready) {
      void document.fonts.ready.then(paint);
    } else {
      paint();
    }
    return () => {
      cancelled = true;
    };
  }, [draw]);

  /* ── Hit testing ─────────────────────────────────────────────────────── */
  const markAt = useCallback((clientX: number, clientY: number): Mark | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    let best: Mark | null = null;
    let bestDistance = 26;
    for (const mark of marksRef.current) {
      const distance = Math.hypot(mark.x - x, mark.y - y);
      if (distance < bestDistance) {
        bestDistance = distance;
        best = mark;
      }
    }
    return best;
  }, []);

  const onPointerMove = useCallback(
    (event: React.PointerEvent<HTMLCanvasElement>) => {
      if (dragRef.current) {
        dragRef.current.x1 = event.clientX;
        setDrag({ ...dragRef.current });
        return;
      }
      setHover(markAt(event.clientX, event.clientY));
    },
    [markAt]
  );

  const onPointerDown = useCallback(
    (event: React.PointerEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const y = event.clientY - rect.top;
      // A drag zooms the money panel; a tap selects a mark.
      const p2Top = PADDING_TOP + PANEL1_H + GAP;
      const p2Bottom = p2Top + PANEL2_H;
      canvas.dataset.lastPointerDown = `${Math.round(event.clientX - rect.left)},${Math.round(y)}`;
      if (y < p2Top || y > p2Bottom) return;
      dragRef.current = { x0: event.clientX, x1: event.clientX };
      setDrag({ x0: event.clientX, x1: event.clientX });
      canvas.setPointerCapture(event.pointerId);
    },
    []
  );

  const onPointerUp = useCallback(
    (event: React.PointerEvent<HTMLCanvasElement>) => {
      const drag = dragRef.current;
      dragRef.current = null;
      setDrag(null);
      if (!drag) return;
      const widthPx = Math.abs(drag.x1 - drag.x0);
      if (widthPx < 24) {
        const mark = markAt(event.clientX, event.clientY);
        setSelected(mark);
        return;
      }
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const innerW = rect.width - PADDING_LEFT - PADDING_RIGHT;
      const yearAt = (clientX: number) => {
        const x = clientX - rect.left - PADDING_LEFT;
        return range.from + (x / Math.max(1, innerW)) * (range.to - range.from);
      };
      const a = yearAt(Math.min(drag.x0, drag.x1));
      const b = yearAt(Math.max(drag.x0, drag.x1));
      if (b - a < 0.4) return;
      setZoom({ from: Math.max(minYear, Math.floor(a)), to: Math.min(maxYear, Math.ceil(b)) });
    },
    [markAt, range, minYear, maxYear]
  );

  const onKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLCanvasElement>) => {
      if (event.key === "Escape") {
        setZoom(null);
        setSelected(null);
        return;
      }
      if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
        event.preventDefault();
        const marks = marksRef.current;
        if (!marks.length) return;
        const current = selected ? marks.findIndex((m) => m === selected) : -1;
        const next =
          event.key === "ArrowRight"
            ? Math.min(marks.length - 1, current + 1)
            : Math.max(0, current <= 0 ? 0 : current - 1);
        setSelected(marks[next]);
      }
    },
    [selected]
  );

  const readout = hover ?? selected;
  const description = `Three panels. The model's probability for each historical episode it has been read against, from ${bundle.fromYear} to ${bundle.toYear}, with whether the episode burst. The disclosed capital from the ${bundle.months.length > 0 ? "ledger" : "site"} between ${bundle.months[0]?.label ?? ""} and ${bundle.months[bundle.months.length - 1]?.label ?? ""}, with the debt inside it. And the market's price for the same question since ${bundle.market[0]?.label ?? ""} against the model's own print since ${bundle.prints[0]?.label ?? ""}.`;

  return (
    <figure className="m-0">
      <div ref={wrapRef} className="relative w-full">
        <canvas
          ref={canvasRef}
          role="img"
          tabIndex={0}
          aria-label={description}
          onPointerMove={onPointerMove}
          onPointerLeave={() => setHover(null)}
          onPointerDown={onPointerDown}
          onPointerUp={onPointerUp}
          onKeyDown={onKeyDown}
          className="block w-full cursor-crosshair touch-pan-y rounded-md border border-rule bg-surface"
        />
      </div>

      {/* The readout. Always visible, so the numbers are reachable without a hover. */}
      <div className="mt-2 flex flex-wrap items-baseline justify-between gap-2 border-t border-rule pt-2">
        <p className="text-[14px] text-ink-muted" aria-live="polite">
          {readout ? (
            <>
              <span className="font-semibold text-ink">{readout.label}</span>
              {" - "}
              {readout.kind === "episode" && readout.value <= 100
                ? `${readout.value.toFixed(1)}%`
                : `$${(readout.value / 1e9).toFixed(1)}B`}
              {readout.extra ? ` (${readout.extra})` : ""}
              {readout.detail ? `. ${readout.detail}` : ""}
            </>
          ) : (
            <span className="text-ink-faint">
              Tap or point at a bar, a dot or a deal to read it. Drag across the money panel to
              zoom; Escape resets. With a keyboard, focus the chart and use the arrow keys.
            </span>
          )}
        </p>
        {zoom ? (
          <button
            type="button"
            onClick={() => setZoom(null)}
            className="btn min-h-11 px-3 text-[13px]"
          >
            Reset the zoom
          </button>
        ) : null}
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
            The model&rsquo;s probability for each historical episode, with the composite score
            and whether the episode burst.
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
