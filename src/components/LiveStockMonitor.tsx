"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import {
  LIVE_STOCKS as FALLBACK_STOCKS,
  LIVE_MACRO_INDICATORS,
  StockQuote,
  MacroIndicator,
} from "@/data/live-stocks";
import liveStocksData from "@/data/live-stocks.json";
import { Reveal } from "@/components/Reveal";

/**
 * Quotes board for /markets.
 *
 * Presentation only: every price, change and macro value is read from the daily
 * feed in `live-stocks.json` (with the static table as a fallback). The board
 * describes itself as a daily snapshot because that is what it is — it does not
 * simulate a live tick, and it never invents a number.
 *
 * Colours carry meaning only: safe for a value that lowers risk, risk for one
 * that raises it, everything else plain ink.
 */

function getInitialStocks(): StockQuote[] {
  try {
    if (Array.isArray(liveStocksData) && liveStocksData.length > 0) {
      return liveStocksData as StockQuote[];
    }
    if (
      liveStocksData &&
      Array.isArray((liveStocksData as any).stocks) &&
      (liveStocksData as any).stocks.length > 0
    ) {
      return (liveStocksData as any).stocks as StockQuote[];
    }
  } catch {
    /* fall through to the static table */
  }
  return FALLBACK_STOCKS;
}

function getInitialMacro(): MacroIndicator[] {
  try {
    if (
      liveStocksData &&
      Array.isArray((liveStocksData as any).macro) &&
      (liveStocksData as any).macro.length > 0
    ) {
      return (liveStocksData as any).macro as MacroIndicator[];
    }
  } catch {
    /* fall through to the static table */
  }
  return LIVE_MACRO_INDICATORS;
}

const INITIAL_STOCKS: StockQuote[] = getInitialStocks();
const INITIAL_MACRO: MacroIndicator[] = getInitialMacro();

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

/** Deterministic UTC stamp — server and browser must agree byte for byte. */
function formatSyncStamp(iso: string | undefined): string {
  if (!iso) return "sync time unavailable";
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return "sync time unavailable";
  const day = parsed.getUTCDate();
  const month = MONTHS[parsed.getUTCMonth()];
  const hh = String(parsed.getUTCHours()).padStart(2, "0");
  const mm = String(parsed.getUTCMinutes()).padStart(2, "0");
  return `${day} ${month} ${parsed.getUTCFullYear()}, ${hh}:${mm} UTC`;
}

const SYNC_STAMP = formatSyncStamp(
  (liveStocksData as any)?.timestamp || (liveStocksData as any)?.last_synced_at
);

/**
 * Trend shapes for the sparklines. These are illustrative shapes kept from the
 * previous version — they are presentation, not a data feed, and are labelled
 * as such under the board.
 */
const TREND_SHAPES: Record<string, number[]> = {
  NVDA: [216.8, 217.2, 215.4, 216.0, 214.9, 213.8, 214.13],
  ORCL: [134.4, 132.8, 131.2, 130.5, 129.0, 127.8, 128.23],
  MSFT: [539.0, 536.5, 534.2, 532.0, 530.8, 528.1, 529.05],
  GOOGL: [349.0, 347.2, 345.5, 343.8, 342.1, 339.8, 340.59],
  AMZN: [255.0, 254.2, 253.1, 252.0, 251.2, 249.5, 250.0],
  META: [736.0, 730.5, 725.2, 720.0, 715.4, 708.2, 709.32],
  TSM: [422.0, 420.5, 418.2, 416.0, 414.5, 411.8, 412.61],
  AVGO: [344.0, 341.2, 338.5, 335.0, 332.1, 327.9, 328.75],
  SMCI: [35.1, 34.6, 33.8, 33.0, 32.2, 31.2, 31.63],
  CEG: [275.0, 274.2, 273.5, 272.8, 272.0, 270.8, 271.37],
  PLTR: [200.5, 197.8, 194.2, 191.0, 188.5, 185.2, 186.03],
  AMD: [152.0, 153.5, 155.0, 154.2, 156.8, 155.9, 156.40],
  INTC: [23.1, 22.8, 22.4, 22.6, 22.2, 22.7, 22.50],
  ASML: [710.0, 718.0, 725.0, 722.0, 735.0, 728.0, 730.00],
  QCOM: [165.0, 166.2, 167.0, 169.1, 168.0, 167.5, 168.50],
  VST: [122.0, 124.5, 126.0, 127.2, 129.0, 128.1, 128.50],
  GEV: [265.0, 268.0, 270.5, 272.0, 274.0, 276.5, 275.00],
  DELL: [118.0, 119.5, 120.2, 121.0, 123.0, 121.5, 122.00],
  CRWD: [310.0, 312.5, 315.0, 314.2, 320.0, 317.5, 318.00],
  ANET: [375.0, 378.0, 382.0, 385.0, 389.0, 387.2, 388.00],
  SNPS: [505.0, 508.0, 510.5, 513.0, 515.0, 511.0, 512.00],
  US10Y: [5.02, 5.04, 5.06, 5.07, 5.08, 5.09, 5.1],
  US02Y: [4.7, 4.71, 4.72, 4.73, 4.74, 4.75, 4.75],
  CPI: [3.5, 3.55, 3.6, 3.63, 3.66, 3.69, 3.72],
  FEDFUNDS: [4.25, 4.15, 4.05, 3.95, 3.9, 3.8, 3.75],
  "AI-DEBT": [27, 35, 48, 59, 68, 79, 85],
  "HY-OAS": [318, 319, 320, 321, 322, 322.5, 323],
  "BAA-SPREAD": [151, 150, 149.5, 149, 148.5, 148, 148],
  "GPU-RENT": [2.45, 2.38, 2.3, 2.25, 2.2, 2.18, 2.15],
  "COPPER-GOLD": [0.204, 0.202, 0.201, 0.2, 0.199, 0.198, 0.198],
  VIX: [15.2, 16.1, 17, 17.8, 18.5, 19.4, 19.99],
  HYG: [77.5, 77.3, 77.1, 76.9, 77, 76.8, 76.86],
};

const FALLBACK_SHAPE = [100, 101, 99, 98, 99.5, 100.2];

/** Sober sparkline: one hairline, no fill, no pulse. */
function TrendLine({
  points,
  rising,
  width = 72,
  height = 22,
  label,
}: {
  points: number[];
  rising: boolean;
  width?: number;
  height?: number;
  label: string;
}) {
  const values = points && points.length > 1 ? points : FALLBACK_SHAPE;
  const min = Math.min.apply(null, values);
  const max = Math.max.apply(null, values);
  const range = max - min === 0 ? 1 : max - min;
  const pad = 2;
  const innerW = width - pad * 2;
  const innerH = height - pad * 2;
  const d = values
    .map((value, index) => {
      const x = pad + (index / (values.length - 1)) * innerW;
      const y = pad + innerH - ((value - min) / range) * innerH;
      return `${index === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={label}
      className="shrink-0 overflow-visible"
    >
      {/* 2026-10-19 (design pass): the line draws itself in, once, over 1.5s
          when the board reaches the reader. It is a one-shot — the shape
          never redraws, and the line holds still afterwards. */}
      <path
        d={d}
        fill="none"
        stroke={rising ? "rgb(14 159 110)" : "rgb(209 67 60)"}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="draw-in draw-in-slow"
      />
    </svg>
  );
}

export type TerminalCategory =
  | "All"
  | "Hyperscalers"
  | "Semiconductors"
  | "Power & infra"
  | "Macro";

const CATEGORIES: TerminalCategory[] = [
  "All",
  "Hyperscalers",
  "Semiconductors",
  "Power & infra",
  "Macro",
];

function inCategory(stock: StockQuote, category: TerminalCategory): boolean {
  if (category === "All") return true;
  if (category === "Hyperscalers") return stock.category === "Hyperscaler";
  if (category === "Semiconductors") return stock.category === "Semiconductor";
  if (category === "Power & infra") {
    return stock.category === "Power & Infrastructure" || stock.category === "Frontier Lab Partner";
  }
  return stock.ticker === "ORCL";
}

export function LiveStockMonitor() {
  const [category, setCategory] = useState<TerminalCategory>("All");

  const showMacro = category === "All" || category === "Macro";

  const { rows, advancing, declining } = useMemo(() => {
    const visible = INITIAL_STOCKS.filter((stock) => inCategory(stock, category));
    const up = INITIAL_STOCKS.filter((s) => s.change24hPct >= 0).length;
    return { rows: visible, advancing: up, declining: INITIAL_STOCKS.length - up };
  }, [category]);

  return (
    <Reveal>
    <div className="card card-flush shadow-card transition-shadow duration-200 hover:shadow-raised">
      {/* Board header */}
      <div className="card-header flex-wrap gap-x-4 gap-y-2">
        <div className="min-w-0">
          <p className="label">Quotes</p>
          <p className="mt-1 text-[14px] text-ink-subtle">
            Daily snapshot from the market feed ·{" "}
            <span className="num text-ink-muted">{SYNC_STAMP}</span>
          </p>
        </div>
        <p className="flex items-center gap-2 text-[14px] text-ink-subtle">
          <span className="num">
            {advancing} up / {declining} down
          </span>
          <span aria-hidden="true">·</span>
          <span className="num">{INITIAL_STOCKS.length} listed</span>
        </p>
      </div>

      {/* Category chips */}
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-none px-4 py-2">
        {CATEGORIES.map((item) => {
          const active = category === item;
          return (
            <button
              key={item}
              type="button"
              onClick={() => setCategory(item)}
              aria-pressed={active}
              className={[
                "chip min-h-11 shrink-0 items-center whitespace-nowrap px-3 transition duration-150 active:scale-[0.97]",
                active ? "chip-on" : "hover:border-rule-strong hover:bg-surface-2",
              ].join(" ")}
            >
              {item}
            </button>
          );
        })}
      </div>

      <div className="border-t border-rule p-4">
        {/* Macro and credit metrics */}
        {showMacro ? (
          <section aria-label="Rates and credit metrics" className="mb-6">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h3 className="text-[15px] font-semibold tracking-tight text-ink">
                Rates and credit
              </h3>
              <p className="text-[14px] text-ink-subtle">
                The cost of money, and the price lenders charge for AI credit risk.
              </p>
            </div>

            <ul className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
              {INITIAL_MACRO.map((macro) => {
                const stress = macro.isRiskPositive;
                const trend = TREND_SHAPES[macro.symbol] || FALLBACK_SHAPE;
                return (
                  <li key={macro.symbol} className="panel flex flex-col gap-1.5 p-3">
                    <div className="flex items-start justify-between gap-2">
                      <span className="num whitespace-nowrap text-[14px] font-semibold text-ink">
                        {macro.symbol}
                      </span>
                      <span className={`pill ${stress ? "pill-risk" : "pill-safe"}`}>
                        {macro.changeDisplay}
                      </span>
                    </div>
                    <div className="flex items-end justify-between gap-2">
                      <span className="num text-[17px] font-semibold leading-tight text-ink">
                        {macro.valueDisplay}
                      </span>
                      <TrendLine
                        points={trend}
                        rising={!stress}
                        width={44}
                        height={16}
                        label={`${macro.name} recent trend`}
                      />
                    </div>
                    <p className="text-[14px] leading-snug text-ink-subtle">{macro.name}</p>
                  </li>
                );
              })}
            </ul>
            <p className="mt-2 text-[14px] text-ink-subtle">
              Red marks a series whose current move raises risk — a higher borrowing rate, a wider
              credit spread, a faster debt pace.
            </p>
          </section>
        ) : null}

        {/* Equities */}
        <section aria-label="Listed AI companies">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h3 className="text-[15px] font-semibold tracking-tight text-ink">
              Listed AI companies
            </h3>
            <p className="text-[14px] text-ink-subtle">
              <span className="num">{rows.length}</span> of{" "}
              <span className="num">{INITIAL_STOCKS.length}</span> shown ·{" "}
              <span className="capitalize">{category}</span>
            </p>
          </div>

          {/* Column headers, desktop only */}
          <div
            aria-hidden="true"
            className="mt-3 hidden grid-cols-[5rem_minmax(0,1fr)_5.5rem_4.5rem_6rem_6rem_5rem] items-center gap-3 border-b border-rule pb-1.5 text-[13px] uppercase tracking-[0.1em] text-ink-faint md:grid"
          >
            <span>Ticker</span>
            <span>Company and role</span>
            <span className="text-right">Price</span>
            <span className="text-right">24h</span>
            <span className="text-right">From high</span>
            <span className="text-right">Market cap</span>
            <span className="text-right">Trend</span>
          </div>

          <ul className="divide-y divide-rule">
            {rows.map((stock, index) => {
              const up = stock.change24hPct >= 0;
              const trend = TREND_SHAPES[stock.ticker] || FALLBACK_SHAPE;
              const tone = up
                ? "text-safe-600 dark:text-safe-300"
                : "text-risk-600 dark:text-risk-300";
              /**
               * 2026-10-19 (design pass): a 24-hour move washes its cell once
               * as the board ticks in — 600ms, in the row's own direction,
               * never a loop. The delay staggers it down the column so the
               * board reads as a tape, not a strobe.
               */
              const tickFlash = up ? "flash-safe" : "flash-risk";
              const tickDelay = { animationDelay: `${Math.min(index, 20) * 40}ms` };
              return (
                <li key={stock.ticker} className="py-3">
                  {/* Phone: one calm block */}
                  <div className="md:hidden">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="flex items-baseline gap-2">
                          <Link
                            href={`/companies?search=${encodeURIComponent(stock.ticker)}`}
                            className="-my-2.5 inline-flex min-h-11 items-center py-2.5 num text-[15px] font-semibold text-ink underline decoration-rule underline-offset-4 hover:decoration-ink"
                          >
                            {stock.ticker}
                          </Link>
                          <span className="text-[14px] text-ink-faint">
                            {stock.ticker === "TSM" || stock.ticker === "ORCL" ? "NYSE" : "NASDAQ"}
                          </span>
                        </p>
                        <p className="mt-0.5 truncate text-[14px] text-ink">{stock.name}</p>
                        <p className="truncate text-[14px] text-ink-subtle">{stock.role}</p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="num text-[15px] font-semibold text-ink">
                          ${stock.priceUsd.toFixed(2)}
                        </p>
                        <p
                          className={`num rounded-sm text-[14px] font-semibold ${tone} ${tickFlash}`}
                          style={tickDelay}
                        >
                          {up ? "+" : ""}
                          {stock.change24hPct.toFixed(1)}%
                        </p>
                      </div>
                    </div>
                    <div className="mt-2 flex items-center justify-between gap-3 border-t border-rule pt-2">
                      <p className="text-[14px] text-ink-subtle">
                        <span className="num">{stock.drawdownFromAthPct.toFixed(1)}%</span> from
                        high · <span className="num">{stock.marketCapDisplay}</span> cap
                      </p>
                      <TrendLine points={trend} rising={up} label={`${stock.ticker} recent trend`} />
                    </div>
                  </div>

                  {/* Desktop: a quiet table row */}
                  <div className="hidden grid-cols-[5rem_minmax(0,1fr)_5.5rem_4.5rem_6rem_6rem_5rem] items-center gap-3 md:grid">
                    <Link
                      href={`/companies?search=${encodeURIComponent(stock.ticker)}`}
                      className="-my-2.5 inline-flex min-h-11 items-center justify-start py-2.5 num text-[15px] font-semibold text-ink underline decoration-rule underline-offset-4 hover:decoration-ink md:justify-start"
                    >
                      {stock.ticker}
                    </Link>
                    <div className="min-w-0">
                      <p className="truncate text-[14px] text-ink">{stock.name}</p>
                      <p className="truncate text-[14px] text-ink-subtle">{stock.role}</p>
                    </div>
                    <span className="num text-right text-[15px] font-semibold text-ink">
                      ${stock.priceUsd.toFixed(2)}
                    </span>
                    <span
                      className={`num rounded-sm text-right text-[14px] font-semibold ${tone} ${tickFlash}`}
                      style={tickDelay}
                    >
                      {up ? "+" : ""}
                      {stock.change24hPct.toFixed(1)}%
                    </span>
                    <span className="num text-right text-[14px] text-ink-muted">
                      {stock.drawdownFromAthPct.toFixed(1)}%
                    </span>
                    <span className="num text-right text-[14px] text-ink-muted">
                      {stock.marketCapDisplay}
                    </span>
                    <span className="flex justify-end">
                      <TrendLine points={trend} rising={up} label={`${stock.ticker} recent trend`} />
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>

          <p className="mt-4 border-t border-rule pt-3 text-[14px] text-ink-subtle">
            Prices are the last close in the daily feed; sparklines are an indicative recent shape,
            not a tick-by-tick record. Tap any ticker for its{" "}
            <Link
              href="/companies"
              className="text-ink underline decoration-rule underline-offset-4 hover:decoration-ink"
            >
              company profile
            </Link>{" "}
            — debt, revenue and multiples behind these names.
          </p>
        </section>
      </div>
    </div>
    </Reveal>
  );
}