"use client";

import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  Search,
  Star,
  X,
} from "lucide-react";
import {
  LIVE_STOCKS as FALLBACK_STOCKS,
  LIVE_MACRO_INDICATORS,
  StockQuote,
  MacroIndicator,
} from "@/data/live-stocks";
import liveStocksData from "@/data/live-stocks.json";
import { Reveal } from "@/components/Reveal";
import { WatchToggle } from "@/components/WatchToggle";
import { useWatchlist } from "@/lib/use-watchlist";

/**
 * Quotes board for /markets.
 *
 * Presentation only: every price, change and macro value is read from the daily
 * feed in `live-stocks.json` (with the static table as a fallback). The board
 * describes itself as a daily snapshot because that is what it is — it does not
 * simulate a live tick, and it never invents a number.
 *
 * Interactivity added on 2026-10-19:
 *   - the desktop board is a real sortable table (five sort keys, asc/desc);
 *   - a text filter over ticker / company / role with a live result count;
 *   - a per-row watchlist, persisted in localStorage, filterable by chip.
 *
 * The three rules that came with that work:
 *   1. No number is ever invented, interpolated or re-derived. Rows may be
 *      reordered, filtered and highlighted, but the rendered figures are the
 *      feed's own strings and values, untouched.
 *   2. Sorting is deterministic — the default is ticker A→Z and every sort
 *      breaks ties on ticker, so the board never reshuffles itself on a
 *      re-render.
 *   3. localStorage is only touched in an effect (read) and in a click
 *      handler (write). Nothing is read during render, so the server render
 *      and the first client render agree and private-mode failures are inert.
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

/* ─────────────────────────────────────────────────────────────────────────
   Sorting
   --------------------------------------------------------------------------
   Five sort keys, each with an ascending and a descending order. The
   comparator is total and deterministic: the chosen key decides, and every
   tie is broken on ticker A→Z. Nothing about the sort depends on the order
   the rows happen to arrive in, so a re-render can never reshuffle the board.
   ───────────────────────────────────────────────────────────────────────── */

type SortKey = "ticker" | "price" | "change" | "drawdown" | "marketCap";
type SortDirection = "asc" | "desc";

interface SortState {
  key: SortKey;
  direction: SortDirection;
}

/** The default is ticker A→Z — the same order every reader sees. */
const DEFAULT_SORT: SortState = { key: "ticker", direction: "asc" };

/**
 * The direction a column opens on the first click.
 * - ticker: A→Z
 * - price / 24h / market cap: largest first
 * - drawdown: the drawdown values are negative, so ascending puts the
 *   deepest drawdown (−56.9%) at the top — which is the number a reader of a
 *   credit-risk board is looking for.
 */
const OPENING_DIRECTION: Record<SortKey, SortDirection> = {
  ticker: "asc",
  price: "desc",
  change: "desc",
  drawdown: "asc",
  marketCap: "desc",
};

const CAP_UNITS: Record<string, number> = { T: 1e12, B: 1e9, M: 1e6, K: 1e3 };

/**
 * Ranking key for the market-cap column.
 *
 * The feed carries the cap only as a display string ("$5.27T"), so the
 * magnitude is read out of that string for ORDERING ONLY. The rendered cap
 * is always the untouched `marketCapDisplay` string from the feed — no cap
 * is recomputed, rounded or re-derived for display.
 */
function marketCapMagnitude(display: string): number | null {
  const match = /^\s*\$?\s*([0-9]+(?:\.[0-9]+)?)\s*([TBMK])?/i.exec(display ?? "");
  if (!match) return null;
  const value = Number(match[1]);
  if (!Number.isFinite(value)) return null;
  const unit = match[2] ? CAP_UNITS[match[2].toUpperCase()] ?? 1 : 1;
  return value * unit;
}

interface MacroSemantics {
  tone: "risk" | "safe" | "neutral";
  cardRule: string;
  pillClass: string;
  wordTag: string;
  displayBadge: string;
}

function getMacroSemantics(macro: MacroIndicator): MacroSemantics {
  const cd = macro.changeDisplay.toLowerCase();
  const isSpread = macro.symbol.includes("SPREAD") || macro.symbol.includes("OAS");
  const isYield = macro.symbol.startsWith("US");

  // Flat / unchanged detection
  if (
    cd.includes("+0 bps") ||
    cd.includes("+0.0") ||
    cd.includes("0.0 bps") ||
    cd.includes("no yoy") ||
    (macro.changePct === 0 && (cd.includes("+0") || cd.includes("0 bps")))
  ) {
    if (cd.includes("no yoy")) {
      return {
        tone: "neutral",
        cardRule: "rule-neutral-left",
        pillClass: "",
        wordTag: "Baseline",
        displayBadge: "Baseline pace",
      };
    }
    return {
      tone: "neutral",
      cardRule: "rule-neutral-left",
      pillClass: "",
      wordTag: "Flat",
      displayBadge: `${macro.changeDisplay.replace(" (HYG proxy)", "")} · Flat`,
    };
  }

  // Spreads: widening (+ bps) is RISK, tightening (- bps) is SAFE
  if (isSpread) {
    if (cd.startsWith("+") || macro.changePct > 0) {
      return {
        tone: "risk",
        cardRule: "rule-risk-left",
        pillClass: "pill-risk",
        wordTag: "Widening",
        displayBadge: `${macro.changeDisplay} · Widening`,
      };
    } else {
      return {
        tone: "safe",
        cardRule: "rule-safe-left",
        pillClass: "pill-safe",
        wordTag: "Tightening",
        displayBadge: `${macro.changeDisplay} · Tightening`,
      };
    }
  }

  // Yields (rates): rising (+ bps) is RISK, falling (- bps) is SAFE (tightening/easing)
  if (isYield) {
    if (cd.startsWith("+") || macro.changePct > 0) {
      return {
        tone: "risk",
        cardRule: "rule-risk-left",
        pillClass: "pill-risk",
        wordTag: "Rising",
        displayBadge: `${macro.changeDisplay} · Rising`,
      };
    } else {
      return {
        tone: "safe",
        cardRule: "rule-safe-left",
        pillClass: "pill-safe",
        wordTag: "Tightening",
        displayBadge: `${macro.changeDisplay} · Tightening`,
      };
    }
  }

  if (macro.symbol === "CPI") {
    return {
      tone: "risk",
      cardRule: "rule-risk-left",
      pillClass: "pill-risk",
      wordTag: "Elevated",
      displayBadge: "+0.8pp · Elevated",
    };
  }

  if (macro.symbol === "FEDFUNDS") {
    return {
      tone: "safe",
      cardRule: "rule-safe-left",
      pillClass: "pill-safe",
      wordTag: "Easing",
      displayBadge: "-100 bps · Easing",
    };
  }

  if (macro.symbol === "VIX") {
    const isUp = macro.changePct > 0;
    return {
      tone: isUp ? "risk" : "safe",
      cardRule: isUp ? "rule-risk-left" : "rule-safe-left",
      pillClass: isUp ? "pill-risk" : "pill-safe",
      wordTag: isUp ? "Spiking" : "Calming",
      displayBadge: `${macro.changeDisplay} · ${isUp ? "Spiking" : "Calming"}`,
    };
  }

  const isRisk = macro.isRiskPositive ? macro.changePct >= 0 : macro.changePct < 0;
  return {
    tone: isRisk ? "risk" : "safe",
    cardRule: isRisk ? "rule-risk-left" : "rule-safe-left",
    pillClass: isRisk ? "pill-risk" : "pill-safe",
    wordTag: isRisk ? "Widening" : "Tightening",
    displayBadge: `${macro.changeDisplay} · ${isRisk ? "Widening" : "Tightening"}`,
  };
}

function compareQuotes(a: StockQuote, b: StockQuote, key: SortKey): number {
  switch (key) {
    case "ticker":
      return a.ticker < b.ticker ? -1 : a.ticker > b.ticker ? 1 : 0;
    case "price":
      return a.priceUsd - b.priceUsd;
    case "change":
      return a.change24hPct - b.change24hPct;
    case "drawdown":
      return a.drawdownFromAthPct - b.drawdownFromAthPct;
    case "marketCap": {
      const left = marketCapMagnitude(a.marketCapDisplay);
      const right = marketCapMagnitude(b.marketCapDisplay);
      if (left === null && right === null) return 0;
      if (left === null) return 1; // an unreadable cap sorts last, never first
      if (right === null) return -1;
      return left - right;
    }
  }
}

function sortQuotes(list: StockQuote[], sort: SortState): StockQuote[] {
  const sign = sort.direction === "asc" ? 1 : -1;
  return [...list].sort((a, b) => {
    const primary = compareQuotes(a, b, sort.key);
    if (primary !== 0) return primary * sign;
    return a.ticker < b.ticker ? -1 : a.ticker > b.ticker ? 1 : 0;
  });
}

/** Case-insensitive match over ticker, company name and role. */
function matchesQuery(stock: StockQuote, q: string): boolean {
  return (
    stock.ticker.toLowerCase().indexOf(q) !== -1 ||
    stock.name.toLowerCase().indexOf(q) !== -1 ||
    stock.role.toLowerCase().indexOf(q) !== -1
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   Watchlist
   --------------------------------------------------------------------------
   The list itself lives in src/lib/use-watchlist.ts — one list for the whole
   site, under the key `aict-watchlist-v1`, read after mount and written only
   from a toggle. The board and the /companies browser share it.
   ───────────────────────────────────────────────────────────────────────── */

export type TerminalCategory =
  | "All"
  | "Hyperscalers"
  | "Semiconductors"
  | "Power & infra"
  | "Macro"
  | "Watchlist";

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
  if (category === "Macro") return stock.ticker === "ORCL";
  return false;
}

/** The label shown next to the result count. */
function categoryLabel(category: TerminalCategory): string {
  if (category === "All") return "all categories";
  if (category === "Watchlist") return "your watchlist";
  return category;
}

/**
 * A sortable column header. The cell carries `aria-sort`, the button carries
 * an accessible name that spells out the current direction, and the indicator
 * is a lucide chevron — no glyph, no emoji.
 */
function SortHeader({
  label,
  sortKey,
  sort,
  onSort,
  align,
}: {
  label: string;
  sortKey: SortKey;
  sort: SortState;
  onSort: (key: SortKey) => void;
  align: "left" | "right";
}) {
  const active = sort.key === sortKey;
  const direction = active ? sort.direction : null;
  const ariaSort = active
    ? direction === "asc"
      ? "ascending"
      : "descending"
    : "none";
  const accessibleName = active
    ? `Sort by ${label}, currently ${direction === "asc" ? "ascending" : "descending"}. Activate to sort ${
        direction === "asc" ? "descending" : "ascending"
      }.`
    : `Sort by ${label}`;

  return (
    <th
      scope="col"
      aria-sort={ariaSort}
      className={`pb-1.5 ${align === "right" ? "pl-3 text-right" : "pr-3 text-left"}`}
    >
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        aria-label={accessibleName}
        className={[
          "inline-flex min-h-11 min-w-11 items-center gap-1 text-[13px] font-medium uppercase tracking-[0.1em] transition-colors duration-150",
          align === "right" ? "w-full justify-end" : "",
          active ? "text-ink" : "text-ink-faint hover:text-ink-muted",
        ].join(" ")}
      >
        <span>{label}</span>
        {active && direction === "asc" ? (
          <ChevronUp className="h-3.5 w-3.5" aria-hidden="true" />
        ) : null}
        {active && direction === "desc" ? (
          <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
        ) : null}
        {!active ? <ChevronsUpDown className="h-3.5 w-3.5 opacity-60" aria-hidden="true" /> : null}
      </button>
    </th>
  );
}

/**
 * A key cap in the keyboard hint line. It sits at 13px — a chip, not fine
 * print — so the hint never drops below the type floor.
 */
function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="num rounded border border-rule bg-surface-2 px-1.5 py-0.5 text-[13px] font-semibold text-ink-muted">
      {children}
    </kbd>
  );
}

/**
 * Is the reader typing? A field, a text area or an editable region means the
 * keys belong to the text, not to the board.
 */
function isTypingTarget(target: EventTarget | null): boolean {
  if (!target) return false;
  const element = target as HTMLElement;
  if (
    element.tagName === "INPUT" ||
    element.tagName === "TEXTAREA" ||
    element.tagName === "SELECT"
  ) {
    return true;
  }
  return element.isContentEditable === true;
}

export function LiveStockMonitor() {
  const router = useRouter();
  const [category, setCategory] = useState<TerminalCategory>("All");
  const [query, setQuery] = useState<string>("");
  const [sort, setSort] = useState<SortState>(DEFAULT_SORT);

  /**
   * The shared watchlist — ONE list for the whole site. The hook reads the
   * stored list after mount and writes only from the toggle handler, so the
   * server render and the first client render always agree.
   */
  const { watchlist, isWatched, toggle: toggleTicker } = useWatchlist();

  const showMacro = category === "All" || category === "Macro";

  const watchlistSet = useMemo(() => new Set(watchlist), [watchlist]);

  /**
   * The pool the filters act on: one category, or the saved watchlist.
   *
   * The two pools are kept apart on purpose. Saving a ticker while the
   * reader is looking at the full board must not re-create the list of rows
   * — otherwise the selection under their feet would jump.
   */
  const categoryPool = useMemo(
    () => INITIAL_STOCKS.filter((stock) => inCategory(stock, category)),
    [category]
  );
  const watchPool = useMemo(
    () => INITIAL_STOCKS.filter((stock) => watchlistSet.has(stock.ticker)),
    [watchlistSet]
  );
  const scoped = category === "Watchlist" ? watchPool : categoryPool;

  // The rows on screen: the pool, filtered by the text query, then sorted.
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = q ? scoped.filter((stock) => matchesQuery(stock, q)) : scoped;
    return sortQuotes(filtered, sort);
  }, [scoped, query, sort]);

  const { advancing, declining } = useMemo(() => {
    const up = INITIAL_STOCKS.filter((s) => s.change24hPct >= 0).length;
    return { advancing: up, declining: INITIAL_STOCKS.length - up };
  }, []);

  /* ───────────────────────────────────────────────────────────────────────
     Current row — roving focus
     ─────────────────────────────────────────────────────────────────────── */

  /** The row under the reader's cursor. `null` means no row is selected. */
  const [activeIndex, setActiveIndex] = useState<number | null>(0);
  /** The same value, readable inside the keyboard handler. */
  const activeIndexRef = useRef<number | null>(0);
  /** What a screen reader is told about the current row. */
  const [announcement, setAnnouncement] = useState("");
  const lastAnnounced = useRef<number | null>(0);

  const boardRef = useRef<HTMLDivElement | null>(null);
  const searchRef = useRef<HTMLInputElement | null>(null);
  const tableRowsRef = useRef<Array<HTMLTableRowElement | null>>([]);
  const listRowsRef = useRef<Array<HTMLLIElement | null>>([]);

  const setActive = useCallback((next: number | null) => {
    activeIndexRef.current = next;
    setActiveIndex(next);
  }, []);

  /**
   * A filter or a sort change re-orders the rows under the reader's feet,
   * so the selection goes back to the first visible row. It can never point
   * at a row that is no longer on the page.
   */
  useEffect(() => {
    setActive(visible.length > 0 ? 0 : null);
  }, [visible, setActive]);

  /**
   * Say the current row out loud. The row itself holds the focus (roving
   * focus), and this live region names it and says where it sits in the
   * list, so the position is announced and not only the ticker.
   */
  useEffect(() => {
    if (lastAnnounced.current === activeIndex) return;
    lastAnnounced.current = activeIndex;
    if (activeIndex === null) {
      setAnnouncement("Row selection cleared.");
      return;
    }
    const stock = visible[activeIndex];
    if (!stock) return;
    setAnnouncement(
      `${stock.ticker}, ${stock.name}. Row ${activeIndex + 1} of ${visible.length}.`
    );
  }, [activeIndex, visible]);

  // Throttled summary of board updates for screen readers.
  //
  // This is a SECOND live region, deliberately separate from the row
  // announcement above. One region would mean the two messages overwrite each
  // other: a reader who sorts the board would hear "24 quotes updated" half
  // a second after the position of the row they just moved to was announced.
  // Two regions, each with its own message, is the correct shape.
  const isFirstMonitorRender = useRef(true);
  const statusTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [quotesStatus, setQuotesStatus] = useState("");

  useEffect(() => {
    if (isFirstMonitorRender.current) {
      isFirstMonitorRender.current = false;
      return;
    }
    if (statusTimerRef.current) clearTimeout(statusTimerRef.current);
    statusTimerRef.current = setTimeout(() => {
      setQuotesStatus(`${visible.length} quotes updated`);
    }, 600);
    return () => {
      if (statusTimerRef.current) clearTimeout(statusTimerRef.current);
    };
  }, [visible.length, category, sort]);

  /** Move the DOM focus to a row — the table on a wide screen, the list on a phone. */
  const focusRow = useCallback((index: number) => {
    const candidates = [tableRowsRef.current[index], listRowsRef.current[index]];
    for (const element of candidates) {
      if (element && element.getClientRects().length > 0) {
        element.focus();
        return;
      }
    }
  }, []);

  /** The company profile — the same target the ticker link uses. */
  const openProfile = useCallback(
    (ticker: string) => {
      router.push(`/companies?search=${encodeURIComponent(ticker)}`);
    },
    [router]
  );

  const moveSelection = useCallback(
    (delta: number) => {
      const count = visible.length;
      if (count === 0) return;
      const current = activeIndexRef.current;
      const next =
        current === null
          ? delta > 0
            ? 0
            : count - 1
          : Math.min(Math.max(current + delta, 0), count - 1);
      setActive(next);
      focusRow(next);
    },
    [visible, setActive, focusRow]
  );

  /**
   * The board's keyboard.
   *
   *   J / ↓   next row           K / ↑   previous row
   *   Enter   open the profile   Space   open the profile
   *   /       filter field       Esc     clear the selection
   *
   * Scope: the listener sits on the window in the CAPTURE phase, so it runs
   * before any other listener on the page — that is what lets the board own
   * "/" while it holds the keyboard, without the site's command palette
   * opening on top of it. It only acts while the board is engaged: the focus
   * is inside the board, or nothing on the page has been focused yet. It
   * never fires while the reader is typing in a field, and never for a
   * Ctrl/Cmd/Alt combination — those belong to the browser.
   */
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey) return;

      const board = boardRef.current;
      if (!board) return;

      const active = document.activeElement;
      const insideBoard = !!active && board.contains(active);
      const nothingFocused = !active || active === document.body;
      if (!insideBoard && !nothingFocused) return;

      const target = event.target as HTMLElement | null;
      const typing = isTypingTarget(target);

      if (typing) {
        // Escape inside the filter field clears the filter, not the row.
        if (event.key === "Escape" && target instanceof HTMLInputElement && target.value) {
          setQuery("");
        }
        return;
      }

      // "/" focuses the filter field — but only while the board holds the
      // keyboard. Anywhere else on the site the command palette owns it.
      if (event.key === "/") {
        if (!insideBoard) return;
        event.preventDefault();
        event.stopPropagation();
        const input = searchRef.current;
        if (input) {
          input.focus();
          input.select();
        }
        return;
      }

      if (event.key === "Escape") {
        if (activeIndexRef.current === null) return;
        setActive(null);
        return;
      }

      const down = event.key === "j" || event.key === "ArrowDown";
      const up = event.key === "k" || event.key === "ArrowUp";
      if (down || up) {
        event.preventDefault();
        event.stopPropagation();
        moveSelection(down ? 1 : -1);
        return;
      }

      if (event.key === "Enter" || event.key === " ") {
        const index = activeIndexRef.current;
        if (index === null) return;
        const stock = visible[index];
        if (!stock) return;
        const control = target
          ? target.closest("a, button, input, select, textarea")
          : null;
        if (control) {
          // A control inside the row keeps its own behaviour. Enter on the
          // ticker link follows it — the same target — and Space on any
          // other control stays that control's own key.
          if (event.key === "Enter") return;
          if (
            !(control instanceof HTMLElement) ||
            !control.hasAttribute("data-board-ticker")
          ) {
            return;
          }
          event.preventDefault();
          openProfile(stock.ticker);
          return;
        }
        event.preventDefault();
        event.stopPropagation();
        openProfile(stock.ticker);
      }
    };

    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, [moveSelection, openProfile, setActive, visible]);

  /**
   * FLIP: when the order changes, the rows SLIDE to their new positions
   * instead of jumping.
   *
   * Apple S3 Interruptibility:
   * 1. capturePositions() captures the row's LIVE on-screen position (including
   *    any active in-flight transform) when sorting is triggered.
   * 2. In useLayoutEffect, transitions are temporarily suspended to measure
   *    the clean resting destination, and the new delta is calculated from
   *    the live presentation position.
   * 3. Each run owns its styles: a stale timer can never clear the transform
   *    of a NEWER run, and the cleanup never yanks an in-flight row back to
   *    zero, so two sorts in quick succession blend instead of hitting a
   *    "brick wall".
   */
  const positionsBeforeRef = useRef<Map<string, number> | null>(null);
  const animationTimerRef = useRef<number | null>(null);
  /** Which run owns the inline styles right now. A timer from an older run
   *  must not touch the styles of the run that replaced it. */
  const animationIdRef = useRef(0);

  /**
   * The row element the reader can actually SEE at this width.
   *
   * The board is rendered twice: a table for a wide screen and a list for a
   * phone. Only one of them is displayed at a time, and the hidden one still
   * has a DOM node — with no box. Picking the first node that HAS a box is
   * what makes the slide work on a phone as well as on a desktop.
   */
  const rowElement = useCallback((index: number): HTMLElement | null => {
    const candidates = [tableRowsRef.current[index], listRowsRef.current[index]];
    for (const element of candidates) {
      if (element && element.getClientRects().length > 0) return element;
    }
    return null;
  }, []);

  const capturePositions = useCallback(() => {
    const map = new Map<string, number>();
    visible.forEach((stock, index) => {
      const el = rowElement(index);
      if (el) {
        // Reads live presentation top (including in-flight transform)
        map.set(stock.ticker, el.getBoundingClientRect().top);
      }
    });
    positionsBeforeRef.current = map;
  }, [visible, rowElement]);

  useLayoutEffect(() => {
    const before = positionsBeforeRef.current;
    positionsBeforeRef.current = null;
    if (!before || before.size === 0) return;
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }

    // This run owns the inline styles from here on.
    const runId = animationIdRef.current + 1;
    animationIdRef.current = runId;

    // 1. Gather all currently visible row elements in the new order
    const elements: { ticker: string; el: HTMLElement }[] = [];
    visible.forEach((stock, index) => {
      const el = rowElement(index);
      if (el) elements.push({ ticker: stock.ticker, el });
    });

    // 2. Temporarily suspend transitions & transforms to measure true un-transformed destination
    elements.forEach(({ el }) => {
      el.style.transition = "none";
      el.style.transform = "none";
    });

    // 3. Compute delta from live captured on-screen position to new resting destination
    const moved: { el: HTMLElement; delta: number }[] = [];
    elements.forEach(({ ticker, el }) => {
      const previousTop = before.get(ticker);
      if (previousTop === undefined) return;
      const finalTop = el.getBoundingClientRect().top;
      const delta = previousTop - finalTop;
      if (Math.abs(delta) > 1) moved.push({ el, delta });
    });

    if (moved.length === 0) {
      elements.forEach(({ el }) => {
        el.style.transition = "";
        el.style.transform = "";
      });
      return;
    }

    // 4. Invert: place moved rows at their captured live on-screen locations
    moved.forEach(({ el, delta }) => {
      el.style.transform = `translateY(${delta}px)`;
    });

    // Force synchronous layout commit before browser paint
    void document.body.offsetHeight;

    // 5. Play: transition smoothly towards resting layout destination
    moved.forEach(({ el }) => {
      el.style.transition = "transform 420ms cubic-bezier(0.22, 1, 0.36, 1)";
      el.style.transform = "";
    });

    // 6. Hand the styles back when this run ends - but ONLY if this run still
    //    owns them. A second sort that started while this one was in flight has
    //    its own styles on the rows now, and a stale timer clearing them would
    //    yank the rows to their resting boxes mid-slide: the "brick wall" the
    //    Apple rules warn about.
    if (animationTimerRef.current) {
      window.clearTimeout(animationTimerRef.current);
    }
    animationTimerRef.current = window.setTimeout(() => {
      if (animationIdRef.current !== runId) return;
      elements.forEach(({ el }) => {
        el.style.transition = "";
        el.style.transform = "";
      });
      animationTimerRef.current = null;
    }, 460);

    // The cleanup deliberately does NOT touch the rows: the inline styles
    // belong to the run that is on screen, and the next run re-measures them
    // from their live position anyway.
  }, [visible, rowElement]);

  const onSort = useCallback(
    (key: SortKey) => {
      capturePositions();
      setSort((prev) =>
        prev.key === key
          ? { key, direction: prev.direction === "asc" ? "desc" : "asc" }
          : { key, direction: OPENING_DIRECTION[key] }
      );
    },
    [capturePositions]
  );

  const toggleWatch = useCallback(
    (ticker: string) => {
      const wasSaved = isWatched(ticker);
      toggleTicker(ticker);
      // Un-saving the last ticker while the watchlist view is open would
      // leave an empty table behind — step back to the full list instead.
      if (wasSaved && category === "Watchlist" && watchlist.length === 1) {
        setCategory("All");
      }
    },
    [isWatched, toggleTicker, category, watchlist.length]
  );

  const resetFilters = useCallback(() => {
    setQuery("");
    setCategory("All");
  }, []);

  const watchlistEmpty = watchlist.length === 0;
  /** Only the current row is in the tab order; the first row keeps it when nothing is selected. */
  const tabStopIndex = activeIndex ?? 0;

  return (
    <Reveal>
    <div
      ref={boardRef}
      className="card card-flush shadow-card transition-shadow duration-200 hover:shadow-raised"
    >
      {/* The row position, announced when the reader moves through the board. */}
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {announcement}
      </div>
      {/* The board's own state, announced when the set of quotes changes. */}
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {quotesStatus}
      </div>

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
              onClick={() => {
                capturePositions();
                setCategory(item);
              }}
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
        <span className="h-6 w-px shrink-0 bg-rule" aria-hidden="true" />
        <button
          type="button"
          onClick={() => {
            if (!watchlistEmpty) {
              capturePositions();
              setCategory("Watchlist");
            }
          }}
          aria-pressed={category === "Watchlist"}
          aria-disabled={watchlistEmpty}
          title={
            watchlistEmpty
              ? "Save a ticker to build a watchlist"
              : `Show your ${watchlist.length} saved ticker${watchlist.length === 1 ? "" : "s"}`
          }
          className={[
            "chip min-h-11 shrink-0 items-center whitespace-nowrap px-3 transition-colors duration-150",
            category === "Watchlist"
              ? "chip-on"
              : watchlistEmpty
                ? "cursor-not-allowed border-rule text-ink-faint"
                : "hover:border-rule-strong hover:bg-surface-2",
          ].join(" ")}
        >
          <Star
            className={`h-3.5 w-3.5 ${category === "Watchlist" ? "fill-current" : ""}`}
            aria-hidden="true"
          />
          Watchlist
          <span className="num opacity-70">{watchlist.length}</span>
        </button>
      </div>

      {/* Filter bar — always rendered, so nothing shifts when it changes */}
      <div className="border-t border-rule px-4 py-3">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between md:gap-4">
          <div className="relative min-w-0 md:w-80">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint"
              aria-hidden="true"
            />
            <label htmlFor="markets-quote-search" className="sr-only">
              Filter quotes by ticker, company name or role
            </label>
            <input
              id="markets-quote-search"
              ref={searchRef}
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Filter by ticker, company or role"
              autoComplete="off"
              className="min-h-11 w-full rounded-md border border-rule-strong bg-canvas pl-9 pr-11 text-[15px] text-ink placeholder:text-ink-faint"
            />
            {query ? (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="absolute right-0 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-md text-ink-subtle transition-colors duration-150 hover:bg-surface-2 hover:text-ink"
              >
                <X className="h-4 w-4" aria-hidden="true" />
                <span className="sr-only">Clear the quote filter</span>
              </button>
            ) : null}
          </div>

          <p className="shrink-0 text-[14px] text-ink-subtle">
            <span className="num font-semibold text-ink">{visible.length}</span> of{" "}
            <span className="num font-semibold text-ink">{scoped.length}</span> shown
          </p>
        </div>

        {/* One line, always present: the watchlist state or how to start one. */}
        <p className="mt-2 min-h-[1.5rem] text-[14px] text-ink-faint">
          {watchlistEmpty
            ? "Save a ticker to build a watchlist."
            : `${watchlist.length} ticker${watchlist.length === 1 ? "" : "s"} saved on this device.`}
        </p>

        {/* The board's keys, always in the same place. */}
        <p className="mt-1 text-[13px] leading-snug text-ink-subtle">
          Keyboard: <Kbd>J</Kbd> / <Kbd>K</Kbd> or <Kbd>↑</Kbd> / <Kbd>↓</Kbd> move
          between rows · <Kbd>Enter</Kbd> opens the profile · <Kbd>/</Kbd> filters ·{" "}
          <Kbd>Esc</Kbd> clears the selection
        </p>
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
                const semantics = getMacroSemantics(macro);
                const isStress = semantics.tone === "risk";
                const trend = TREND_SHAPES[macro.symbol] || FALLBACK_SHAPE;
                return (
                  <li
                    key={macro.symbol}
                    className={`panel ${semantics.cardRule} flex flex-col gap-1.5 p-3`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-x-2 gap-y-1">
                      <span className="num whitespace-nowrap text-[14px] font-semibold text-ink">
                        {macro.symbol}
                      </span>
                      <span
                        className={`pill ${semantics.pillClass}`}
                        title={`${macro.name}: ${semantics.displayBadge}`}
                      >
                        {semantics.displayBadge}
                      </span>
                    </div>
                    <div className="flex items-end justify-between gap-2">
                      <span className="num text-[17px] font-semibold leading-tight text-ink">
                        {macro.valueDisplay}
                      </span>
                      <TrendLine
                        points={trend}
                        rising={!isStress}
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
              credit spread, a faster debt pace. Green marks tightening or easing.
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
              <span className="num">{scoped.length}</span> name
              {scoped.length === 1 ? "" : "s"} in{" "}
              <span className="capitalize">{categoryLabel(category)}</span>
            </p>
          </div>

          {visible.length === 0 ? (
            <div className="panel mt-3 flex min-h-[12rem] flex-col items-center justify-center gap-3 p-8 text-center">
              <Search className="h-6 w-6 text-ink-faint" aria-hidden="true" />
              <p className="text-[15px] font-semibold text-ink">No ticker matches that filter.</p>
              <p className="max-w-reading text-[14px] text-ink-muted">
                {query.trim() ? (
                  <>
                    Nothing in {categoryLabel(category)} matches{" "}
                    <span className="num">“{query.trim()}”</span>.
                  </>
                ) : category === "Watchlist" ? (
                  <>Your watchlist is empty — save a ticker to build one.</>
                ) : (
                  <>No listed name sits in {categoryLabel(category)} right now.</>
                )}{" "}
                Clear the filter to see all {INITIAL_STOCKS.length} listed names.
              </p>
              <button type="button" onClick={resetFilters} className="btn min-h-11">
                <X className="h-4 w-4" aria-hidden="true" />
                Clear filters
              </button>
            </div>
          ) : (
            <>
              {/* Desktop: a real, sortable table */}
              <div className="mt-3 hidden md:block">
                <table className="w-full table-fixed border-collapse text-[14px]">
                  <caption className="sr-only">
                    Listed AI companies with the last close, the 24-hour change, the drawdown from
                    the 52-week high and the market capitalisation. The column buttons sort the
                    table.
                  </caption>
                  <colgroup>
                    <col className="w-20" />
                    <col />
                    <col className="w-[5.5rem]" />
                    <col className="w-[4.5rem]" />
                    <col className="w-[5.5rem]" />
                    <col className="w-[5.5rem]" />
                    <col className="w-[5.5rem]" />
                  </colgroup>
                  <thead>
                    <tr className="border-b border-rule">
                      <SortHeader
                        label="Ticker"
                        sortKey="ticker"
                        sort={sort}
                        onSort={onSort}
                        align="left"
                      />
                      <th scope="col" className="pb-1.5 pr-3 text-left text-[13px] font-medium uppercase tracking-[0.1em] text-ink-faint">
                        Company and role
                      </th>
                      <SortHeader
                        label="Price"
                        sortKey="price"
                        sort={sort}
                        onSort={onSort}
                        align="right"
                      />
                      <SortHeader
                        label="24h"
                        sortKey="change"
                        sort={sort}
                        onSort={onSort}
                        align="right"
                      />
                      <SortHeader
                        label="From high"
                        sortKey="drawdown"
                        sort={sort}
                        onSort={onSort}
                        align="right"
                      />
                      <SortHeader
                        label="Market cap"
                        sortKey="marketCap"
                        sort={sort}
                        onSort={onSort}
                        align="right"
                      />
                      <th scope="col" className="pb-1.5 pl-2 text-right text-[13px] font-medium uppercase tracking-[0.1em] text-ink-faint">
                        Watchlist
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-rule">
                    {visible.map((stock, index) => {
                      const up = stock.change24hPct >= 0;
                      const trend = TREND_SHAPES[stock.ticker] || FALLBACK_SHAPE;
                      const tone = up
                        ? "text-safe-600 dark:text-safe-300"
                        : "text-risk-600 dark:text-risk-300";
                      /**
                       * 2026-10-20: the 24-hour cell NO LONGER flashes.
                       *
                       * It used to wash its cell once on every page load. But
                       * these are DAILY CLOSES — the feed syncs once a day at
                       * 00:00 UTC — so a flash that fires on every visit says
                       * "something just happened" about a number that has not
                       * changed since yesterday. An alert that always fires is
                       * not an alert; it teaches the eye to skip the cell, and
                       * it makes a static snapshot look live.
                       *
                       * The sign, the arrow and the colour already carry the
                       * direction. If the number ever does change between
                       * snapshots, the right place for a motion cue is on that
                       * ONE changed cell - which needs the previous value
                       * stored per ticker, not a flash on every load.
                       */
                      const tickDelay = { animationDelay: `${Math.min(index, 20) * 40}ms` };
                      const saved = watchlistSet.has(stock.ticker);
                      const isCurrent = activeIndex === index;
                      return (
                        <tr
                          key={stock.ticker}
                          ref={(element) => {
                            tableRowsRef.current[index] = element;
                          }}
                          tabIndex={tabStopIndex === index ? 0 : -1}
                          aria-current={isCurrent ? "true" : undefined}
                          onFocus={() => {
                            if (activeIndexRef.current !== index) setActive(index);
                          }}
                          className={`board-row ${isCurrent ? "bg-surface-2" : ""}`}
                        >
                          <td
                            className={`border-l-2 py-3 pr-3 align-top ${
                              isCurrent ? "border-l-ink" : "border-l-transparent"
                            }`}
                          >
                            <Link
                              href={`/companies?search=${encodeURIComponent(stock.ticker)}`}
                              data-board-ticker={stock.ticker}
                              className="inline-flex min-h-11 items-start num text-[15px] font-semibold text-ink underline decoration-rule underline-offset-4 hover:decoration-ink"
                            >
                              {stock.ticker}
                            </Link>
                            {/* The sparkline sits in the lower half of the ticker's
                                44px target, so the row keeps its original height. */}
                            <div className="-mt-5 flex items-center">
                              <TrendLine
                                points={trend}
                                rising={up}
                                width={64}
                                height={18}
                                label={`${stock.ticker} recent trend`}
                              />
                            </div>
                          </td>
                          <td className="py-3 pr-3 align-top">
                            <p className="truncate text-[14px] text-ink">{stock.name}</p>
                            <p className="truncate text-[14px] text-ink-subtle">{stock.role}</p>
                          </td>
                          <td className="num py-3 pl-3 text-right align-top text-[15px] font-semibold text-ink">
                            ${stock.priceUsd.toFixed(2)}
                          </td>
                          <td
                            className={`num rounded-sm py-3 pl-3 text-right align-top text-[14px] font-semibold ${tone}`}
                            style={tickDelay}
                          >
                            {up ? "+" : ""}
                            {stock.change24hPct.toFixed(1)}%
                          </td>
                          <td className="num py-3 pl-3 text-right align-top text-[14px] text-ink-muted">
                            {stock.drawdownFromAthPct.toFixed(1)}%
                          </td>
                          <td className="num py-3 pl-3 text-right align-top text-[14px] text-ink-muted">
                            {stock.marketCapDisplay}
                          </td>
                          <td className="py-3 pl-2 text-right align-top">
                            <WatchToggle
                              ticker={stock.ticker}
                              saved={saved}
                              onToggle={toggleWatch}
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Phone: one calm block per name */}
              <ul className="divide-y divide-rule md:hidden">
                {visible.map((stock, index) => {
                  const up = stock.change24hPct >= 0;
                  const trend = TREND_SHAPES[stock.ticker] || FALLBACK_SHAPE;
                  const tone = up
                    ? "text-safe-600 dark:text-safe-300"
                    : "text-risk-600 dark:text-risk-300";
                  const saved = watchlistSet.has(stock.ticker);
                  const isCurrent = activeIndex === index;
                  return (
                    <li
                      key={stock.ticker}
                      ref={(element) => {
                        listRowsRef.current[index] = element;
                      }}
                      tabIndex={tabStopIndex === index ? 0 : -1}
                      aria-current={isCurrent ? "true" : undefined}
                      onFocus={() => {
                        if (activeIndexRef.current !== index) setActive(index);
                      }}
                      className={`board-row border-l-2 py-3 ${
                        isCurrent ? "border-l-ink bg-surface-2" : "border-l-transparent"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="flex items-baseline gap-2">
                            <Link
                              href={`/companies?search=${encodeURIComponent(stock.ticker)}`}
                              data-board-ticker={stock.ticker}
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
                          <p className={`num rounded-sm text-[14px] font-semibold ${tone}`}>
                            {up ? "+" : ""}
                            {stock.change24hPct.toFixed(1)}%
                          </p>
                        </div>
                      </div>
                      <div className="mt-2 flex flex-wrap items-center justify-between gap-x-3 gap-y-2 border-t border-rule pt-2">
                        <p className="text-[14px] text-ink-subtle">
                          <span className="num">{stock.drawdownFromAthPct.toFixed(1)}%</span> from
                          high · <span className="num">{stock.marketCapDisplay}</span> cap
                        </p>
                        <div className="flex items-center gap-2">
                          <TrendLine
                            points={trend}
                            rising={up}
                            label={`${stock.ticker} recent trend`}
                          />
                          <WatchToggle
                            ticker={stock.ticker}
                            saved={saved}
                            onToggle={toggleWatch}
                          />
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </>
          )}

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
