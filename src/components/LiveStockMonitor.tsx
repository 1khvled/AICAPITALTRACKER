"use client";

import React, { useState } from "react";
import Link from "next/link";
import { LIVE_STOCKS, LIVE_MACRO_INDICATORS, StockQuote } from "@/data/live-stocks";
import { TrendingUp, TrendingDown, ExternalLink, ArrowUpRight, BarChart2, ShieldAlert, Percent, Activity } from "lucide-react";
import { POLYMARKET_REFERRAL_CODE } from "@/data/polymarket-data";

export function LiveStockMonitor() {
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  const categories = ["All", "Macro & Rates", "Hyperscaler", "Semiconductor", "Power & Infrastructure", "Frontier Lab Partner"];

  const filteredStocks = LIVE_STOCKS.filter((s) => {
    if (selectedCategory !== "All" && s.category !== selectedCategory) return false;
    return true;
  });

  const showMacro = selectedCategory === "All" || selectedCategory === "Macro & Rates";
  const showEquities = selectedCategory !== "Macro & Rates";

  return (
    <div className="bg-white dark:bg-[#121214] border border-slate-200 dark:border-zinc-800 rounded-xl p-5 sm:p-6 space-y-5 transition-colors shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-200 dark:border-zinc-800">
        <div>
          <div className="flex items-center space-x-2 text-xs font-mono text-slate-500 dark:text-zinc-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="font-semibold text-slate-800 dark:text-zinc-200">Live Equities &amp; Macro Monitor</span>
            <span>•</span>
            <span>US10Y • CPI Inflation • AI Debt • 11 Tech Tickers</span>
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight mt-0.5">
            Macro Rates, AI Debt Velocity &amp; Public Tech Tickers
          </h3>
        </div>

        {/* Category Tabs */}
        <div className="flex items-center space-x-1.5 overflow-x-auto scrollbar-none text-xs sm:text-sm">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? "bg-slate-900 text-white dark:bg-white dark:text-zinc-950 shadow-sm"
                  : "bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-zinc-700"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Macro Indicators Panel */}
      {showMacro && (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="font-bold uppercase tracking-wider text-slate-600 dark:text-zinc-400 flex items-center space-x-1.5">
              <Percent className="w-3.5 h-3.5 text-amber-500" />
              <span>Macro Rates, Inflation &amp; AI Debt Benchmark</span>
            </span>
            <span className="text-slate-500 dark:text-zinc-500">Live Fixed Income &amp; BLS Feeds</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {LIVE_MACRO_INDICATORS.map((macro) => (
              <div
                key={macro.symbol}
                className="bg-slate-50 dark:bg-[#09090b] border border-slate-200/90 dark:border-zinc-800 rounded-xl p-3 space-y-1.5 hover:border-slate-300 dark:hover:border-zinc-700 transition-all"
              >
                <div className="flex items-center justify-between gap-1.5">
                  <span className="font-mono font-black text-xs text-slate-800 dark:text-zinc-200 truncate">
                    {macro.symbol}
                  </span>
                  <span className="text-[10px] sm:text-[11px] font-mono font-bold px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 border border-rose-200 dark:border-rose-900/60 whitespace-nowrap shrink-0">
                    {macro.changeDisplay}
                  </span>
                </div>
                <div className="text-lg sm:text-xl font-mono font-black text-slate-900 dark:text-white font-tabular">
                  {macro.valueDisplay}
                </div>
                <div className="text-[11px] text-slate-600 dark:text-zinc-400 truncate" title={macro.description}>
                  {macro.name}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stock Cards Grid */}
      {showEquities && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5">
        {filteredStocks.map((stock) => {
          const isNegative = stock.change24hPct < 0;
          return (
            <div
              key={stock.ticker}
              className="bg-slate-50 dark:bg-[#09090b] border border-slate-200/90 dark:border-zinc-800 rounded-2xl p-4 space-y-2.5 hover:border-slate-300 dark:hover:border-zinc-700 hover:shadow-md transition-all"
            >
              <div className="flex items-center justify-between">
                <span className="font-black text-slate-900 dark:text-white font-mono text-base sm:text-lg tracking-tight">
                  {stock.ticker}
                </span>
                <span
                  className={`font-mono text-xs sm:text-sm font-bold px-2 py-0.5 rounded-md flex items-center space-x-1 ${
                    isNegative
                      ? "bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 border border-rose-200 dark:border-rose-900/60"
                      : "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/60"
                  }`}
                >
                  {isNegative ? <TrendingDown className="w-3.5 h-3.5" /> : <TrendingUp className="w-3.5 h-3.5" />}
                  <span>{stock.change24hPct >= 0 ? "+" : ""}{stock.change24hPct.toFixed(1)}%</span>
                </span>
              </div>

              <div>
                <div className="text-2xl sm:text-3xl font-black font-mono text-slate-900 dark:text-white font-tabular tracking-tight">
                  ${stock.priceUsd.toFixed(2)}
                </div>
                <div className="text-xs sm:text-sm text-slate-700 dark:text-zinc-300 font-sans font-medium truncate mt-0.5" title={stock.name}>
                  {stock.name}
                </div>
              </div>

              <div className="pt-2.5 border-t border-slate-200/70 dark:border-zinc-800/80 flex items-center justify-between text-xs font-mono text-slate-600 dark:text-zinc-400">
                <span>ATH: ${stock.athUsd.toFixed(0)} ({stock.drawdownFromAthPct.toFixed(1)}%)</span>
                <span className="font-bold text-slate-700 dark:text-zinc-300">Cap: {stock.marketCapDisplay}</span>
              </div>
            </div>
          );
        })}
        </div>
      )}
    </div>
  );
}
