"use client";

import React, { useState } from "react";
import Link from "next/link";
import { LIVE_STOCKS, StockQuote } from "@/data/live-stocks";
import { TrendingUp, TrendingDown, ExternalLink, ArrowUpRight, BarChart2, ShieldAlert } from "lucide-react";
import { POLYMARKET_REFERRAL_CODE } from "@/data/polymarket-data";

export function LiveStockMonitor() {
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  const categories = ["All", "Hyperscaler", "Semiconductor", "Power & Infrastructure", "Frontier Lab Partner"];

  const filteredStocks = LIVE_STOCKS.filter((s) => {
    if (selectedCategory !== "All" && s.category !== selectedCategory) return false;
    return true;
  });

  return (
    <div className="bg-white dark:bg-[#10141d] border border-slate-200 dark:border-zinc-800 rounded-xl p-5 sm:p-6 space-y-5 transition-colors shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-200 dark:border-zinc-800">
        <div>
          <div className="flex items-center space-x-2 text-xs font-mono text-slate-500 dark:text-zinc-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="font-semibold text-slate-800 dark:text-zinc-200">Live Equities Feed</span>
            <span>•</span>
            <span>11 Bellwether AI Stocks</span>
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight mt-0.5">
            AI Infrastructure &amp; Hyperscaler Stock Tickers
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

      {/* Stock Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5">
        {filteredStocks.map((stock) => {
          const isNegative = stock.change24hPct < 0;
          return (
            <div
              key={stock.ticker}
              className="bg-slate-50 dark:bg-[#0c0f16] border border-slate-200/90 dark:border-zinc-800 rounded-2xl p-4 space-y-2.5 hover:border-slate-300 dark:hover:border-zinc-700 hover:shadow-md transition-all"
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
    </div>
  );
}
