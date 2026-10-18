"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Activity, Pause, Play, Zap, RefreshCw } from "lucide-react";
import { POLYMARKET_REFERRAL_CODE, POLYMARKET_FEATURED_MARKETS } from "@/data/polymarket-data";
import { LIVE_STOCKS as FALLBACK_STOCKS, StockQuote } from "@/data/live-stocks";
import liveStocksData from "@/data/live-stocks.json";
import liveInputsData from "@/data/live-inputs.json";
import { evaluateBubbleModel, DEFAULT_MODEL_INPUTS } from "@/lib/model/engine";
import rawDeals from "@/data/deals.json";

// Safely load automated 24h stock quotes from live-stocks.json with fallback
const getStocks = (): StockQuote[] => {
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
    console.warn("Ticker tape fallback to static LIVE_STOCKS:", err);
  }
  return FALLBACK_STOCKS;
};

const activeStocks = getStocks();

interface TickerItem {
  id: string;
  label: string;
  value: string;
  change?: string;
  isPositive?: boolean;
  type: "stock" | "risk" | "polymarket" | "damper" | "deal" | "macro" | "autosync";
  href: string;
  isExternal?: boolean;
}

export function MarketTickerTape() {
  const [isPaused, setIsPaused] = useState(false);

  // Dynamic model result linked directly to engine
  const modelResult = evaluateBubbleModel(DEFAULT_MODEL_INPUTS);
  const probVal = `${modelResult.burstProbability.toFixed(1)}%`;
  const probBand = modelResult.band.toUpperCase();

  // Live crowd probabilities from 24h live-inputs.json
  const crowd2026Prob =
    (liveInputsData?.crowd?.bubble2026Probability ?? 0.103) * 100;
  const crowd2027Prob =
    (liveInputsData?.crowd?.bubble2027Probability ?? 0.165) * 100;

  // Polymarket contracts dynamically linked
  const poly2026Market =
    POLYMARKET_FEATURED_MARKETS.find((m) => m.id === "poly-bubble-2026") ||
    POLYMARKET_FEATURED_MARKETS[0];
  const poly2027Market =
    POLYMARKET_FEATURED_MARKETS.find((m) => m.id === "poly-bubble-2027") ||
    POLYMARKET_FEATURED_MARKETS[1];

  // Capital ledger stats dynamically computed
  const totalDealsCount = rawDeals.length;
  const totalDisclosedUsd = rawDeals.reduce((sum, d) => sum + (d.amount_usd || 0), 0);
  const disclosedCapDisplay = `$${(totalDisclosedUsd / 1e12).toFixed(3)}T`;

  // Macro & Credit spread inputs dynamically linked
  const orclCds = DEFAULT_MODEL_INPUTS.cds?.currentBps ?? 187;
  const us10y = DEFAULT_MODEL_INPUTS.macro?.us10yYieldPct ?? 4.42;
  const hygSpread = DEFAULT_MODEL_INPUTS.macro?.highYieldSpreadBps ?? 328;
  const cpi = DEFAULT_MODEL_INPUTS.macro?.cpiInflationYoY ?? 2.9;
  const fedFunds = DEFAULT_MODEL_INPUTS.macro?.fedFundsRatePct ?? 4.75;
  const debtPace = DEFAULT_MODEL_INPUTS.aiDebt?.annualDebtIssuanceUsd
    ? `$${(DEFAULT_MODEL_INPUTS.aiDebt.annualDebtIssuanceUsd / 1e9).toFixed(1)}B/yr`
    : "$85.0B/yr";

  // High-contrast live stock items read from live-stocks.json (with fallback)
  const stockItems: TickerItem[] = activeStocks.map((s) => ({
    id: `stock-${s.ticker}`,
    label: s.ticker,
    value: `$${s.priceUsd.toFixed(2)}`,
    change: `${s.change24hPct >= 0 ? "+" : ""}${s.change24hPct.toFixed(1)}%`,
    isPositive: s.change24hPct >= 0,
    type: "stock",
    href: `/companies?search=${encodeURIComponent(s.ticker)}`,
  }));

  // Institutional macro, credit spread, and live Polymarket items
  const macroItems: TickerItem[] = [
    {
      id: "us10y",
      label: "US10Y",
      value: `${us10y.toFixed(2)}%`,
      change: `+${((us10y - (DEFAULT_MODEL_INPUTS.macro?.us10yBaselinePct ?? 3.75)) * 100).toFixed(0)} bps`,
      isPositive: false, // rising yield = tightening stress
      type: "macro",
      href: "/sandbox",
    },
    {
      id: "hyg-oas",
      label: "HYG / HY-OAS",
      value: `${hygSpread} bps`,
      change: "Credit Spread",
      isPositive: false,
      type: "risk",
      href: "/companies",
    },
    {
      id: "prob",
      label: "BUBBLE PROB (12M)",
      value: probVal,
      change: `${probBand} (${modelResult.compositeScore.toFixed(0)} PTS)`,
      isPositive: modelResult.burstProbability < 45,
      type: "risk",
      href: "/",
    },
    {
      id: "orcl-cds",
      label: "ORCL 5Y CDS",
      value: `${orclCds} bps`,
      change: `+${Math.round(((orclCds - (DEFAULT_MODEL_INPUTS.cds?.baselineBps ?? 81)) / (DEFAULT_MODEL_INPUTS.cds?.baselineBps ?? 81)) * 100)}% stress`,
      isPositive: false,
      type: "risk",
      href: "/companies?search=ORCL",
    },
    {
      id: "ai-debt-pace",
      label: "AI DEBT PACE",
      value: debtPace,
      change: "$196.8B verified debt",
      isPositive: false,
      type: "risk",
      href: "/ledger",
    },
    {
      id: "cpi",
      label: "CPI INFLATION",
      value: `${cpi.toFixed(1)}% YoY`,
      change: "Sticky Core",
      isPositive: false,
      type: "macro",
      href: "/sandbox",
    },
    {
      id: "fedfunds",
      label: "FED FUNDS",
      value: `${fedFunds.toFixed(2)}%`,
      change: `+${DEFAULT_MODEL_INPUTS.macro?.rateHikeRiskBps ?? 25}bp hike`,
      isPositive: false,
      type: "macro",
      href: "/sandbox",
    },
    {
      id: "poly-26",
      label: "POLYMARKET '26 BUBBLE",
      value: `${crowd2026Prob.toFixed(1)}% YES`,
      change: `${Math.round(crowd2026Prob)}¢/sh`,
      type: "polymarket",
      href: `https://polymarket.com/event/ai-bubble-burst-by?r=${POLYMARKET_REFERRAL_CODE}`,
      isExternal: true,
    },
    {
      id: "poly-27",
      label: "POLYMARKET '27 BUBBLE",
      value: `${crowd2027Prob.toFixed(1)}% YES`,
      change: `${Math.round(crowd2027Prob)}¢/sh`,
      type: "polymarket",
      href: `https://polymarket.com/event/ai-bubble-burst-by?r=${POLYMARKET_REFERRAL_CODE}`,
      isExternal: true,
    },
    {
      id: "tokens",
      label: "TOKEN DEFLATION",
      value: "40× cheaper",
      change: "Gross Margin Headwind",
      isPositive: false,
      type: "damper",
      href: "/visualize",
    },
    {
      id: "disclosed-cap",
      label: "DISCLOSED CAPITAL",
      value: disclosedCapDisplay,
      change: `${totalDealsCount} verified deals`,
      isPositive: true,
      type: "deal",
      href: "/ledger",
    },
  ];

  // Interleave stocks and macro indicators for balanced tape density
  const interleaved: TickerItem[] = [];
  const maxLen = Math.max(stockItems.length, macroItems.length);
  for (let i = 0; i < maxLen; i++) {
    if (i < stockItems.length) interleaved.push(stockItems[i]);
    if (i < macroItems.length) interleaved.push(macroItems[i]);
  }

  // 24h Auto-Sync badges at the start and end of marquee cycles
  const autoSyncStart: TickerItem = {
    id: "sync-badge-start",
    label: "24H AUTO-SYNC",
    value: "ACTIVE",
    change: "Yahoo · SEC · Poly",
    isPositive: true,
    type: "autosync",
    href: "/methodology",
  };

  const autoSyncEnd: TickerItem = {
    id: "sync-badge-end",
    label: "24H AUTO-SYNC",
    value: "00:00 UTC",
    change: "GitHub Actions",
    isPositive: true,
    type: "autosync",
    href: "/methodology",
  };

  const cycleWithSync = [autoSyncStart, ...interleaved, autoSyncEnd];

  // Duplicate list to achieve seamless, continuous infinite CSS marquee loop
  const tapeItems = [...cycleWithSync, ...cycleWithSync];

  // High-contrast badge renderer with clean green/red trend dots and monospace typography
  const renderTrendBadge = (item: TickerItem) => {
    if (item.type === "autosync") {
      return (
        <span className="inline-flex items-center space-x-1.5 px-2 py-0.5 rounded text-[11px] font-mono font-bold whitespace-nowrap bg-emerald-950/90 text-emerald-300 border border-emerald-700/80">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
          <span>{item.change}</span>
        </span>
      );
    }

    if (item.type === "stock" || item.type === "macro") {
      const isPos = item.isPositive;
      return (
        <span
          className={`inline-flex items-center space-x-1.5 px-2 py-0.5 rounded text-[11px] font-mono font-bold whitespace-nowrap border ${
            isPos
              ? "bg-emerald-950/90 text-emerald-300 border-emerald-800/80"
              : "bg-rose-950/90 text-rose-300 border-rose-800/80"
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full shrink-0 ${
              isPos
                ? "bg-emerald-400 shadow-xs shadow-emerald-400/50"
                : "bg-rose-400 shadow-xs shadow-rose-400/50"
            }`}
          />
          <span>{item.change}</span>
        </span>
      );
    }

    if (item.type === "polymarket") {
      return (
        <span className="inline-flex items-center space-x-1.5 px-2 py-0.5 rounded text-[11px] font-mono font-bold whitespace-nowrap bg-indigo-950/90 text-indigo-300 border border-indigo-800/80">
          <Zap className="w-3 h-3 text-indigo-400 fill-current shrink-0" />
          <span>{item.change}</span>
        </span>
      );
    }

    if (item.type === "risk") {
      return (
        <span className="inline-flex items-center space-x-1.5 px-2 py-0.5 rounded text-[11px] font-mono font-bold whitespace-nowrap bg-rose-950/90 text-rose-300 border border-rose-800/80">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0" />
          <span>{item.change}</span>
        </span>
      );
    }

    if (item.type === "deal") {
      return (
        <span className="inline-flex items-center space-x-1.5 px-2 py-0.5 rounded text-[11px] font-mono font-bold whitespace-nowrap bg-cyan-950/90 text-cyan-300 border border-cyan-800/80">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0" />
          <span>{item.change}</span>
        </span>
      );
    }

    return (
      <span className="inline-flex items-center space-x-1.5 px-2 py-0.5 rounded text-[11px] font-mono font-bold whitespace-nowrap bg-zinc-900 text-zinc-300 border border-zinc-700">
        <span>{item.change}</span>
      </span>
    );
  };

  return (
    <div
      className="bg-[#09090b] border-b border-zinc-800 text-zinc-200 text-xs py-1.5 sm:py-2 overflow-hidden select-none relative z-40"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="w-full flex items-center">
        {/* Left Pinned Terminal Header Badge */}
        <div className="shrink-0 flex items-center space-x-1.5 sm:space-x-2 pl-3 sm:pl-4 pr-2.5 sm:pr-4 py-0.5 border-r border-zinc-800 z-20 bg-[#09090b]">
          {/* Pulsing Green Hardware Radar Light */}
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>

          <span className="font-mono text-[11px] sm:text-xs font-black tracking-wider text-zinc-100 uppercase flex items-center space-x-1 sm:space-x-1.5 whitespace-nowrap">
            <Activity className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="hidden sm:inline">LIVE WIRE</span>
            <span className="sm:hidden">TAPE</span>
          </span>

          {/* 24h Auto-Sync Pinned Badge */}
          <span className="hidden md:inline-flex items-center space-x-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-800/80 whitespace-nowrap">
            <RefreshCw className="w-2.5 h-2.5 text-emerald-400 animate-spin-slow shrink-0" />
            <span>24h Auto-Sync</span>
          </span>

          {/* Pause / Play Toggle Button */}
          <button
            onClick={() => setIsPaused(!isPaused)}
            title={isPaused ? "Resume ticker tape" : "Pause ticker tape"}
            className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors shrink-0"
          >
            {isPaused ? (
              <Play className="w-3 h-3 text-emerald-400" />
            ) : (
              <Pause className="w-3 h-3 text-zinc-400" />
            )}
          </button>
        </div>

        {/* Continuous Smooth Marquee Track */}
        <div className="overflow-hidden whitespace-nowrap w-full ml-3">
          <div
            className="animate-marquee inline-flex items-center space-x-6 sm:space-x-7"
            style={{
              animationPlayState: isPaused ? "paused" : "running",
            }}
          >
            {tapeItems.map((item, index) => {
              const tickerNode =
                item.type === "autosync" ? (
                  <div className="inline-flex items-center space-x-2 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 font-mono text-[11px] font-black uppercase tracking-wider whitespace-nowrap shadow-xs hover:bg-emerald-500/25 transition-colors">
                    <span className="relative flex h-2 w-2 shrink-0">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    <span>24h Auto-Sync</span>
                    <span className="text-emerald-400/80 font-mono text-[10px] normal-case">
                      ({item.change})
                    </span>
                    <span className="text-zinc-700 ml-2 font-mono select-none">•</span>
                  </div>
                ) : (
                  <div className="inline-flex items-center space-x-2.5 group cursor-pointer hover:bg-zinc-900/80 px-2 py-1 rounded transition-colors whitespace-nowrap">
                    {/* High Contrast Ticker Symbol */}
                    <span className="text-xs font-mono font-black text-zinc-300 group-hover:text-amber-400 transition-colors tracking-tight whitespace-nowrap">
                      {item.label}
                    </span>

                    {/* Value */}
                    <span className="font-mono font-black text-white font-tabular text-xs whitespace-nowrap">
                      {item.value}
                    </span>

                    {/* Trend Badge with dot */}
                    {item.change && renderTrendBadge(item)}

                    {/* External indicator for Polymarket / Web */}
                    {item.isExternal && (
                      <ArrowUpRight className="w-3 h-3 text-indigo-400 opacity-75 group-hover:opacity-100 shrink-0" />
                    )}

                    {/* High contrast divider dot */}
                    <span className="text-zinc-700 ml-3 font-mono select-none">•</span>
                  </div>
                );

              return item.isExternal ? (
                <a
                  key={`${item.id}-${index}`}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block"
                >
                  {tickerNode}
                </a>
              ) : (
                <Link key={`${item.id}-${index}`} href={item.href} className="inline-block">
                  {tickerNode}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
