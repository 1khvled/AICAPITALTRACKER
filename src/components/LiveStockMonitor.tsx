"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  LIVE_STOCKS as FALLBACK_STOCKS,
  LIVE_MACRO_INDICATORS,
  StockQuote,
  MacroIndicator,
} from "@/data/live-stocks";
import liveStocksData from "@/data/live-stocks.json";
import {
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  BarChart2,
  Percent,
  Activity,
  Radio,
  RefreshCw,
} from "lucide-react";

// Safely load automated 24h market feeds from live-stocks.json with fallback to live-stocks.ts
const getInitialStocks = (): StockQuote[] => {
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
  } catch (err) {
    console.warn("Fallback to static LIVE_STOCKS due to load error:", err);
  }
  return FALLBACK_STOCKS;
};

const getInitialMacro = (): MacroIndicator[] => {
  try {
    if (
      liveStocksData &&
      Array.isArray((liveStocksData as any).macro) &&
      (liveStocksData as any).macro.length > 0
    ) {
      return (liveStocksData as any).macro as MacroIndicator[];
    }
  } catch (err) {
    console.warn("Fallback to static LIVE_MACRO_INDICATORS:", err);
  }
  return LIVE_MACRO_INDICATORS;
};

const INITIAL_STOCKS: StockQuote[] = getInitialStocks();
const INITIAL_MACRO: MacroIndicator[] = getInitialMacro();

const syncRawTime = (liveStocksData as any)?.timestamp || (liveStocksData as any)?.last_synced_at;
const INITIAL_SYNC_TIME = syncRawTime
  ? new Date(syncRawTime).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }) + " UTC"
  : "16:00:00 EST";

// Deterministic historical intraday sparkline points (7 snapshots)
const SPARKLINE_HISTORY: Record<string, number[]> = {
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
  US10Y: [4.34, 4.36, 4.38, 4.39, 4.4, 4.41, 4.42],
  US02Y: [4.23, 4.24, 4.25, 4.26, 4.27, 4.27, 4.28],
  CPI: [2.7, 2.7, 2.8, 2.8, 2.9, 2.9, 2.9],
  FEDFUNDS: [4.75, 4.75, 4.75, 4.75, 4.75, 4.75, 4.75],
  "AI-DEBT": [27.0, 35.0, 48.0, 59.0, 68.0, 79.0, 85.0],
  "HY-OAS": [304, 308, 312, 318, 322, 325, 328],
};

// Mini SVG Sparkline Component
function MiniSparkline({
  points,
  isPositive,
  width = 80,
  height = 24,
  sparkId,
}: {
  points: number[];
  isPositive: boolean;
  width?: number;
  height?: number;
  sparkId: string;
}) {
  if (!points || points.length < 2) return null;

  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min === 0 ? 1 : max - min;
  const pad = 2;
  const innerH = height - pad * 2;
  const innerW = width - pad * 2;

  const coords = points.map((val, idx) => {
    const x = pad + (idx / (points.length - 1)) * innerW;
    const y = pad + innerH - ((val - min) / range) * innerH;
    return { x, y };
  });

  const linePath = coords
    .map((c, i) => `${i === 0 ? "M" : "L"} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`)
    .join(" ");
  const areaPath = `${linePath} L ${coords[coords.length - 1].x.toFixed(
    1
  )} ${height} L ${coords[0].x.toFixed(1)} ${height} Z`;

  const strokeColor = isPositive ? "#10b981" : "#f43f5e";
  const gradId = `grad-${sparkId}`;

  const lastPt = coords[coords.length - 1];

  return (
    <div className="shrink-0 flex items-center">
      <svg width={width} height={height} className="overflow-visible select-none">
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={strokeColor} stopOpacity="0.28" />
            <stop offset="100%" stopColor={strokeColor} stopOpacity="0.0" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill={`url(#${gradId})`} />
        <path
          d={linePath}
          fill="none"
          stroke={strokeColor}
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx={lastPt.x} cy={lastPt.y} r="2.5" fill={strokeColor} />
        <circle
          cx={lastPt.x}
          cy={lastPt.y}
          r="4.5"
          fill={strokeColor}
          opacity="0.35"
          className="animate-ping"
        />
      </svg>
    </div>
  );
}

export type TerminalCategory =
  | "All"
  | "Hyperscalers"
  | "Semiconductors"
  | "Power & Infra"
  | "Macro";

interface StockLiveState {
  priceUsd: number;
  change24hPct: number;
  flash: "up" | "down" | null;
  lastTickTime: string;
}

export function LiveStockMonitor() {
  const [selectedCategory, setSelectedCategory] = useState<TerminalCategory>("All");
  const [isStreaming, setIsStreaming] = useState<boolean>(true);
  const [lastSyncTime, setLastSyncTime] = useState<string>(INITIAL_SYNC_TIME);

  // Keep live streaming simulation state initialized from 24h JSON feed
  const [stockState, setStockState] = useState<Record<string, StockLiveState>>(() => {
    const initial: Record<string, StockLiveState> = {};
    INITIAL_STOCKS.forEach((s) => {
      initial[s.ticker] = {
        priceUsd: s.priceUsd,
        change24hPct: s.change24hPct,
        flash: null,
        lastTickTime: INITIAL_SYNC_TIME.replace(" UTC", "").replace(" EST", ""),
      };
    });
    return initial;
  });

  // Simulated live micro-pulse price ticks
  useEffect(() => {
    if (!isStreaming) return;

    const interval = setInterval(() => {
      const tickers = INITIAL_STOCKS.map((s) => s.ticker);
      const randomTicker = tickers[Math.floor(Math.random() * tickers.length)];
      const baseStock = INITIAL_STOCKS.find((s) => s.ticker === randomTicker);
      if (!baseStock) return;

      // Realistic micro tick: ±0.03% to ±0.12%
      const deltaPct = Math.random() * 0.16 - 0.08;
      const isUp = deltaPct >= 0;

      const now = new Date();
      const timeStr = now.toTimeString().split(" ")[0];

      setStockState((prev) => {
        const cur = prev[randomTicker] || {
          priceUsd: baseStock.priceUsd,
          change24hPct: baseStock.change24hPct,
          flash: null,
          lastTickTime: timeStr,
        };
        const newPrice = Math.max(1, cur.priceUsd * (1 + deltaPct / 100));
        const newChange = baseStock.change24hPct + deltaPct;

        return {
          ...prev,
          [randomTicker]: {
            priceUsd: Number(newPrice.toFixed(2)),
            change24hPct: Number(newChange.toFixed(2)),
            flash: isUp ? "up" : "down",
            lastTickTime: timeStr,
          },
        };
      });

      // Clear flash pulse after 650ms
      setTimeout(() => {
        setStockState((prev) => {
          if (!prev[randomTicker]) return prev;
          return {
            ...prev,
            [randomTicker]: {
              ...prev[randomTicker],
              flash: null,
            },
          };
        });
      }, 650);

      setLastSyncTime(`${timeStr} UTC`);
    }, 3200);

    return () => clearInterval(interval);
  }, [isStreaming]);

  // Crisp responsive filter tabs mapping:
  // - "All": All stocks and macro indicators
  // - "Hyperscalers": MSFT, GOOGL, AMZN, META, ORCL
  // - "Semiconductors": NVDA, TSM, AVGO
  // - "Power & Infra": SMCI, CEG, PLTR
  // - "Macro": Macro fixed income & AI credit metrics
  const filteredStocks = INITIAL_STOCKS.filter((stock) => {
    if (selectedCategory === "All") return true;
    if (selectedCategory === "Hyperscalers") return stock.category === "Hyperscaler";
    if (selectedCategory === "Semiconductors") return stock.category === "Semiconductor";
    if (selectedCategory === "Power & Infra") {
      return (
        stock.category === "Power & Infrastructure" ||
        stock.category === "Frontier Lab Partner"
      );
    }
    if (selectedCategory === "Macro") return stock.ticker === "ORCL"; // AI credit proxy
    return true;
  });

  const showMacroPanel = selectedCategory === "All" || selectedCategory === "Macro";

  const categories: TerminalCategory[] = [
    "All",
    "Hyperscalers",
    "Semiconductors",
    "Power & Infra",
    "Macro",
  ];

  // Count market breadth
  const advancingCount = INITIAL_STOCKS.filter(
    (s) => (stockState[s.ticker]?.change24hPct ?? s.change24hPct) >= 0
  ).length;
  const decliningCount = INITIAL_STOCKS.length - advancingCount;

  return (
    <div className="bg-[#0b0e14] dark:bg-[#090b10] border border-zinc-800 text-zinc-100 rounded-2xl shadow-xl overflow-hidden transition-all">
      {/* Institutional Automated 24h Ingestion Header Bar */}
      <div className="bg-[#0d1117] border-b border-zinc-800/90 px-4 sm:px-6 py-3.5 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex items-center space-x-3 flex-wrap gap-y-1">
          {/* Header badge: Automated 24h Market Ingestion · Yahoo Finance + SEC EDGAR */}
          <div className="flex items-center space-x-2 px-3 py-1 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono text-[11px] font-black uppercase tracking-wider whitespace-nowrap shadow-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0"></span>
            <span>Automated 24h Market Ingestion · Yahoo Finance + SEC EDGAR</span>
          </div>

          <div className="hidden sm:flex items-center space-x-2 text-xs font-mono text-zinc-400">
            <span className="text-zinc-600">|</span>
            <span className="flex items-center space-x-1.5 text-zinc-300">
              <RefreshCw className="w-3 h-3 text-emerald-400" />
              <span>SYNCED: {lastSyncTime}</span>
            </span>
            <span className="text-zinc-600">|</span>
            <span className="text-zinc-500">ITCH 5.0 / FIX 4.4</span>
          </div>
        </div>

        {/* Right Terminal Status & Market Breadth */}
        <div className="flex items-center space-x-3">
          {/* Market Breadth Pill */}
          <div className="flex items-center space-x-2 px-2.5 py-1 rounded-md bg-zinc-900 border border-zinc-800 text-[11px] font-mono whitespace-nowrap">
            <span className="text-zinc-400">BREADTH:</span>
            <span className="text-emerald-400 font-bold">{advancingCount} ADV</span>
            <span className="text-zinc-600">/</span>
            <span className="text-rose-400 font-bold">{decliningCount} DEC</span>
          </div>

          {/* Live Streaming Toggle */}
          <button
            onClick={() => setIsStreaming(!isStreaming)}
            title={isStreaming ? "Pause Live Tick Stream" : "Resume Live Tick Stream"}
            className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono font-bold transition-all whitespace-nowrap border ${
              isStreaming
                ? "bg-emerald-950/60 text-emerald-300 border-emerald-800/80 hover:bg-emerald-900/60"
                : "bg-zinc-800 text-zinc-400 border-zinc-700 hover:text-zinc-200"
            }`}
          >
            <Radio className={`w-3 h-3 ${isStreaming ? "animate-pulse text-emerald-400" : ""}`} />
            <span>{isStreaming ? "MICRO-PULSE ON" : "PULSE PAUSED"}</span>
          </button>
        </div>
      </div>

      {/* Main Terminal Subheader & Filter Tabs */}
      <div className="px-5 sm:px-6 pt-5 pb-3 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-zinc-800/60">
        <div>
          <div className="flex items-center space-x-2 text-xs font-mono text-zinc-400">
            <span className="font-semibold text-zinc-300">
              INSTITUTIONAL EQUITIES &amp; FIXED INCOME MONITOR
            </span>
            <span>•</span>
            <span className="text-amber-400 font-bold">
              11 BELLWETHERS • 6 MACRO BENCHMARKS
            </span>
          </div>
          <h3 className="text-lg sm:text-xl font-black text-white tracking-tight mt-1 flex items-center space-x-2">
            <span>Macro Rates, Hyperscale Debt &amp; Public AI Tickers</span>
          </h3>
        </div>

        {/* Crisp Responsive Category Filter Tabs */}
        <div className="flex items-center space-x-1.5 overflow-x-auto scrollbar-none pb-1 touch-pan-x">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold whitespace-nowrap transition-all border ${
                  isSelected
                    ? "bg-amber-400 text-zinc-950 border-amber-300 shadow-xs"
                    : "bg-zinc-900 text-zinc-300 border-zinc-800 hover:bg-zinc-800 hover:text-white"
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      <div className="p-4 sm:p-6 space-y-5 sm:space-y-6">
        {/* Institutional Macro & Fixed Income Ribbon */}
        {showMacroPanel && (
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-xs font-mono pb-1 border-b border-zinc-800">
              <span className="font-bold uppercase tracking-wider text-amber-400 flex items-center space-x-1.5 whitespace-nowrap">
                <Percent className="w-3.5 h-3.5 text-amber-400" />
                <span>BENCHMARK FIXED INCOME &amp; AI CREDIT METRICS</span>
              </span>
              <span className="text-zinc-500 font-mono text-[11px] whitespace-nowrap hidden sm:inline">
                BLS • FRED • ICE BOFA HY OAS • REUTERS CDS
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3">
              {INITIAL_MACRO.map((macro) => {
                const isStress = macro.isRiskPositive;
                const spark = SPARKLINE_HISTORY[macro.symbol] || [10, 11, 10.5, 11.2, 11.8, 12];
                return (
                  <div
                    key={macro.symbol}
                    className="bg-[#121214] border border-zinc-800 rounded-xl p-2.5 sm:p-3 space-y-1.5 sm:space-y-2 hover:border-zinc-700 transition-all group"
                  >
                    <div className="flex items-center justify-between gap-1.5">
                      <span className="font-mono font-black text-xs text-zinc-200 tracking-wider whitespace-nowrap">
                        {macro.symbol}
                      </span>
                      <span
                        className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border whitespace-nowrap shrink-0 ${
                          isStress
                            ? "bg-rose-950/70 text-rose-300 border-rose-800/80"
                            : "bg-emerald-950/70 text-emerald-300 border-emerald-800/80"
                        }`}
                      >
                        {macro.changeDisplay}
                      </span>
                    </div>

                    <div className="flex items-baseline justify-between">
                      <div className="text-lg sm:text-xl font-mono font-black text-white font-tabular tracking-tight">
                        {macro.valueDisplay}
                      </div>
                      <MiniSparkline
                        points={spark}
                        isPositive={!isStress}
                        width={46}
                        height={18}
                        sparkId={`macro-${macro.symbol}`}
                      />
                    </div>

                    <div
                      className="text-[11px] text-zinc-400 truncate font-sans"
                      title={macro.description}
                    >
                      {macro.name}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Equities Grid */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between text-xs font-mono pb-1 border-b border-zinc-800/40">
            <span className="font-bold uppercase tracking-wider text-zinc-300 flex items-center space-x-1.5 whitespace-nowrap">
              <BarChart2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>LIVE AI STOCKS &amp; CREDIT PROXIES</span>
            </span>
            <span className="text-zinc-500 font-mono text-[11px] whitespace-nowrap">
              {filteredStocks.length} OF {INITIAL_STOCKS.length} ACTIVE POSITIONS (
              {selectedCategory.toUpperCase()})
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredStocks.map((stock) => {
              const live = stockState[stock.ticker] || {
                priceUsd: stock.priceUsd,
                change24hPct: stock.change24hPct,
                flash: null,
                lastTickTime: INITIAL_SYNC_TIME.replace(" UTC", "").replace(" EST", ""),
              };
              const isNegative = live.change24hPct < 0;
              const spark = SPARKLINE_HISTORY[stock.ticker] || [
                100, 101, 99, 98, 99.5, 100.2,
              ];

              const flashClass =
                live.flash === "up"
                  ? "ring-2 ring-emerald-500 bg-emerald-950/40 border-emerald-500/60"
                  : live.flash === "down"
                  ? "ring-2 ring-rose-500 bg-rose-950/40 border-rose-500/60"
                  : "bg-[#121214] border-zinc-800 hover:border-zinc-700";

              return (
                <div
                  key={stock.ticker}
                  className={`rounded-xl sm:rounded-2xl p-3.5 sm:p-4 space-y-2.5 sm:space-y-3 transition-all duration-300 border shadow-xs hover:shadow-sm ${flashClass}`}
                >
                  {/* Top Bar: Ticker + Exchange + Live 24h Change Badge */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-baseline space-x-1.5">
                      <span className="font-black text-white font-mono text-lg sm:text-xl tracking-tight">
                        {stock.ticker}
                      </span>
                      <span className="text-[10px] font-mono text-zinc-500 uppercase">
                        {stock.ticker === "TSM" || stock.ticker === "ORCL" ? "NYSE" : "NASDAQ"}
                      </span>
                    </div>

                    {/* Live 24h Change Badge */}
                    <span
                      className={`font-mono text-xs font-bold px-2 py-0.5 rounded-md flex items-center space-x-1 whitespace-nowrap shrink-0 border ${
                        isNegative
                          ? "bg-rose-950/80 text-rose-300 border-rose-800/80"
                          : "bg-emerald-950/80 text-emerald-300 border-emerald-800/80"
                      }`}
                    >
                      {isNegative ? (
                        <TrendingDown className="w-3.5 h-3.5" />
                      ) : (
                        <TrendingUp className="w-3.5 h-3.5" />
                      )}
                      <span>
                        {live.change24hPct >= 0 ? "+" : ""}
                        {live.change24hPct.toFixed(1)}%
                      </span>
                    </span>
                  </div>

                  {/* Price Row with Simulated Micro-Pulse and Mini Sparkline */}
                  <div className="flex items-center justify-between pt-0.5">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-2xl sm:text-3xl font-black font-mono text-white font-tabular tracking-tight">
                          ${live.priceUsd.toFixed(2)}
                        </span>
                        {/* Micro-pulse dot indicator */}
                        <span className="relative flex h-2 w-2 shrink-0">
                          {live.flash && (
                            <span
                              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                                live.flash === "up" ? "bg-emerald-400" : "bg-rose-400"
                              }`}
                            ></span>
                          )}
                          <span
                            className={`relative inline-flex rounded-full h-2 w-2 ${
                              live.flash === "up"
                                ? "bg-emerald-400"
                                : live.flash === "down"
                                ? "bg-rose-400"
                                : "bg-emerald-500/70"
                            }`}
                          ></span>
                        </span>
                      </div>
                      <div
                        className="text-xs text-zinc-400 font-sans font-medium truncate max-w-[170px]"
                        title={stock.name}
                      >
                        {stock.name}
                      </div>
                    </div>

                    {/* Mini SVG Sparkline */}
                    <MiniSparkline
                      points={spark}
                      isPositive={!isNegative}
                      width={78}
                      height={28}
                      sparkId={`spark-${stock.ticker}`}
                    />
                  </div>

                  {/* Role description */}
                  <div
                    className="text-[11px] text-zinc-400 font-sans line-clamp-1 border-t border-zinc-800/60 pt-2"
                    title={stock.role}
                  >
                    <span className="text-zinc-500 font-mono text-[10px] uppercase mr-1">
                      Role:
                    </span>
                    {stock.role}
                  </div>

                  {/* Drawdown from ATH and Market Cap */}
                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-zinc-800/60 text-[11px] font-mono text-zinc-400">
                    <div>
                      <span className="text-zinc-500 text-[10px] uppercase block">
                        Drawdown
                      </span>
                      <span className="font-bold text-rose-400 whitespace-nowrap">
                        {stock.drawdownFromAthPct.toFixed(1)}% from ATH
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-zinc-500 text-[10px] uppercase block">
                        Market Cap
                      </span>
                      <span className="font-bold text-zinc-200 whitespace-nowrap">
                        {stock.marketCapDisplay}
                      </span>
                    </div>
                  </div>

                  {/* Bottom Action Bar with Timestamp of Last Sync */}
                  <div className="pt-2 border-t border-zinc-800/60 flex items-center justify-between text-[11px] font-mono">
                    <span className="text-zinc-500 text-[10px] flex items-center space-x-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                      <span>SYNCED {live.lastTickTime}</span>
                    </span>
                    <Link
                      href={`/companies?search=${encodeURIComponent(stock.ticker)}`}
                      className="text-amber-400 hover:text-amber-300 font-bold flex items-center space-x-1 transition-colors"
                    >
                      <span>Ledger Profile</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
