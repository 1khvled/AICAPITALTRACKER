"use client";

import React, { useState } from "react";
import {
  POLYMARKET_BASE_URL,
  POLYMARKET_REFERRAL_CODE,
  POLYMARKET_FEATURED_MARKETS,
  POLYMARKET_HISTORICAL_TRENDS,
  POLYMARKET_RESOLUTION_CONDITIONS,
  PolymarketMarket,
} from "@/data/polymarket-data";
import {
  TrendingUp,
  ExternalLink,
  ShieldAlert,
  Layers,
  BarChart2,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  Sparkles,
  Zap,
  Calculator,
  DollarSign,
  Percent,
} from "lucide-react";

export function PolymarketCharts() {
  const [activeTab, setActiveTab] = useState<"markets" | "trend" | "triggers" | "calculator">("markets");
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);

  // Calculator State
  const [calcMarketId, setCalcMarketId] = useState<string>(POLYMARKET_FEATURED_MARKETS[0].id);
  const [calcOutcome, setCalcOutcome] = useState<"YES" | "NO">("YES");
  const [calcAmount, setCalcAmount] = useState<number>(100);

  const totalVolume = POLYMARKET_FEATURED_MARKETS.reduce((s, m) => s + m.volumeUsd, 0);

  // Calculator Math
  const selectedCalcMarket =
    POLYMARKET_FEATURED_MARKETS.find((m) => m.id === calcMarketId) || POLYMARKET_FEATURED_MARKETS[0];
  const activePrice = calcOutcome === "YES" ? selectedCalcMarket.yesPriceUsd : selectedCalcMarket.noPriceUsd;
  const numShares = activePrice > 0 ? calcAmount / activePrice : 0;
  const totalPayout = numShares * 1.0;
  const netProfit = totalPayout - calcAmount;
  const roiPct = calcAmount > 0 ? (netProfit / calcAmount) * 100 : 0;
  const tradeUrl =
    calcOutcome === "YES" ? selectedCalcMarket.tradeYesUrl : selectedCalcMarket.tradeNoUrl;

  // SVG Chart dimensions
  const chartWidth = 720;
  const chartHeight = 260;
  const padding = { top: 20, right: 30, bottom: 40, left: 45 };
  const innerWidth = chartWidth - padding.left - padding.right;
  const innerHeight = chartHeight - padding.top - padding.bottom;

  // Max percentage scale is 50% for good vertical resolution
  const maxPct = 50;

  const points = POLYMARKET_HISTORICAL_TRENDS;
  const getX = (index: number) => padding.left + (index / (points.length - 1)) * innerWidth;
  const getY = (val: number) => padding.top + innerHeight - (Math.min(val, maxPct) / maxPct) * innerHeight;

  // Generate SVG path for a metric
  const makePath = (key: "aiBubble2026" | "aiBubble2027" | "oracleCdsStress" | "openaiAgiOdds") => {
    return points
      .map((p, i) => `${i === 0 ? "M" : "L"} ${getX(i).toFixed(1)} ${getY(p[key]).toFixed(1)}`)
      .join(" ");
  };

  const bubble2026Path = makePath("aiBubble2026");
  const bubble2027Path = makePath("aiBubble2027");
  const oracleCdsPath = makePath("oracleCdsStress");
  const openaiAgiPath = makePath("openaiAgiOdds");

  return (
    <div className="bg-white dark:bg-[#121214] border border-slate-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm transition-colors">
      {/* Polymarket Partner Integration Header */}
      <div className="border-b border-slate-200 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-900/40 p-5 sm:p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center space-x-2.5">
              <span className="inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
                <span>Polymarket Live Crowd Odds</span>
              </span>
              <span className="text-slate-400 dark:text-zinc-600 text-xs">•</span>
              <span className="text-xs sm:text-sm font-bold font-mono text-slate-700 dark:text-zinc-300">
                ${(totalVolume / 1_000_000).toFixed(1)}M Total Volume
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center space-x-2.5">
              <span>AI Bubble &amp; ORCL Prediction Markets</span>
              <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                Ref: {POLYMARKET_REFERRAL_CODE}
              </span>
            </h2>
            <p className="text-sm text-slate-700 dark:text-zinc-300 font-sans max-w-2xl leading-relaxed">
              Real-time decentralized order-book probabilities from Polymarket. Trade outcomes directly with zero gas fees 
              using USDC to express your conviction or hedge tech credit exposure.
            </p>
          </div>

          {/* Referral Call to Action Button */}
          <div className="flex flex-wrap items-center gap-2.5">
            <a
              href={POLYMARKET_BASE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-all"
            >
              <Zap className="w-4 h-4 fill-current" />
              <span>Trade on Polymarket (Ref: {POLYMARKET_REFERRAL_CODE})</span>
              <ArrowUpRight className="w-4 h-4 ml-0.5" />
            </a>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center space-x-2 mt-5 border-t border-slate-200 dark:border-zinc-800/80 pt-4 overflow-x-auto scrollbar-none text-xs sm:text-sm">
          <button
            onClick={() => setActiveTab("markets")}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all flex items-center space-x-2 ${
              activeTab === "markets"
                ? "bg-slate-900 text-white dark:bg-white dark:text-zinc-950 shadow-sm"
                : "text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/70 dark:hover:bg-zinc-800"
            }`}
          >
            <BarChart2 className="w-4 h-4" />
            <span>Live Market Odds &amp; Quick Trade</span>
          </button>

          <button
            onClick={() => setActiveTab("calculator")}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all flex items-center space-x-2 ${
              activeTab === "calculator"
                ? "bg-slate-900 text-white dark:bg-white dark:text-zinc-950 shadow-sm"
                : "text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/70 dark:hover:bg-zinc-800"
            }`}
          >
            <Calculator className="w-4 h-4 text-indigo-500" />
            <span>Odds &amp; Payout Calculator</span>
          </button>

          <button
            onClick={() => setActiveTab("trend")}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all flex items-center space-x-2 ${
              activeTab === "trend"
                ? "bg-slate-900 text-white dark:bg-white dark:text-zinc-950 shadow-sm"
                : "text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/70 dark:hover:bg-zinc-800"
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>Historical Probability Trend</span>
          </button>

          <button
            onClick={() => setActiveTab("triggers")}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all flex items-center space-x-2 ${
              activeTab === "triggers"
                ? "bg-slate-900 text-white dark:bg-white dark:text-zinc-950 shadow-sm"
                : "text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/70 dark:hover:bg-zinc-800"
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            <span>Polymarket UMA 6-Condition Radar</span>
          </button>
        </div>
      </div>

      {/* Main Tab Content */}
      <div className="p-5 sm:p-6 space-y-6">
        {/* TAB 1: Live Market Cards & Bar Distributions */}
        {activeTab === "markets" && (
          <div className="space-y-6">
            {/* Quick Comparative Odds Overview */}
            <div className="bg-slate-50 dark:bg-zinc-950 p-5 rounded-2xl border border-slate-200 dark:border-zinc-800 space-y-3.5 shadow-sm">
              <div className="flex items-center justify-between text-xs sm:text-sm font-semibold text-slate-700 dark:text-zinc-300 pb-2.5 border-b border-slate-200 dark:border-zinc-800">
                <span className="font-bold text-slate-900 dark:text-white">Cross-Market Consensus Odds</span>
                <span>Click outcome to trade on Polymarket</span>
              </div>

              <div className="space-y-3.5">
                {POLYMARKET_FEATURED_MARKETS.slice(0, 5).map((m) => (
                  <div key={m.id} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs sm:text-sm">
                      <a
                        href={m.referralUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-bold text-slate-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center space-x-1 truncate max-w-[65%]"
                      >
                        <span className="truncate">{m.title}</span>
                        <ArrowUpRight className="w-3.5 h-3.5 flex-shrink-0 text-slate-400" />
                      </a>
                      <div className="flex items-center space-x-2 font-mono text-xs sm:text-sm font-bold">
                        <span className="text-emerald-600 dark:text-emerald-400">
                          YES {m.yesProbabilityPct.toFixed(1)}% ({Math.round(m.yesPriceUsd * 100)}¢)
                        </span>
                        <span className="text-slate-400 dark:text-zinc-600">/</span>
                        <span className="text-rose-600 dark:text-rose-400">
                          NO {m.noProbabilityPct.toFixed(1)}% ({Math.round(m.noPriceUsd * 100)}¢)
                        </span>
                      </div>
                    </div>

                    {/* Visual Probability Split Bar with Direct Click-to-Trade */}
                    <div className="flex h-6 w-full rounded-lg overflow-hidden text-xs font-mono font-bold shadow-inner">
                      <a
                        href={m.tradeYesUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={`Trade YES on ${m.title} at ${Math.round(m.yesPriceUsd * 100)}¢`}
                        style={{ width: `${Math.max(6, m.yesProbabilityPct)}%` }}
                        className="bg-emerald-500 hover:bg-emerald-600 text-white flex items-center justify-center transition-colors cursor-pointer text-xs"
                      >
                        YES {m.yesProbabilityPct.toFixed(0)}%
                      </a>
                      <a
                        href={m.tradeNoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={`Trade NO on ${m.title} at ${Math.round(m.noPriceUsd * 100)}¢`}
                        style={{ width: `${Math.min(94, m.noProbabilityPct)}%` }}
                        className="bg-rose-500 hover:bg-rose-600 text-white flex items-center justify-center transition-colors cursor-pointer text-xs"
                      >
                        NO {m.noProbabilityPct.toFixed(0)}%
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Grid of Individual Market Trading Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {POLYMARKET_FEATURED_MARKETS.map((market) => (
                <div
                  key={market.id}
                  className="bg-white dark:bg-[#121214] border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 flex flex-col justify-between hover:border-slate-300 dark:hover:border-zinc-700 transition-all shadow-sm hover:shadow-md space-y-4"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="px-2.5 py-1 rounded-md bg-slate-100 dark:bg-zinc-800 text-slate-800 dark:text-zinc-200 font-bold text-xs">
                        {market.category}
                      </span>
                      <span
                        className={`font-bold text-xs sm:text-sm ${
                          market.change24hPct >= 0
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-rose-600 dark:text-rose-400"
                        }`}
                      >
                        24h: {market.change24hPct >= 0 ? "+" : ""}
                        {market.change24hPct.toFixed(1)}%
                      </span>
                    </div>

                    <a
                      href={market.referralUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group block"
                    >
                      <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors leading-snug">
                        {market.title}
                      </h3>
                    </a>

                    <p className="text-sm text-slate-700 dark:text-zinc-300 font-sans line-clamp-3 leading-relaxed">
                      {market.description}
                    </p>
                  </div>

                  <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-zinc-800/80">
                    {/* Live Pricing Boxes */}
                    <div className="grid grid-cols-2 gap-2.5">
                      <a
                        href={market.tradeYesUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800/80 rounded-xl p-3 text-center transition-all group shadow-sm"
                      >
                        <div className="text-xs font-mono uppercase text-emerald-700 dark:text-emerald-400 font-bold tracking-wider">
                          Trade YES
                        </div>
                        <div className="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-300 my-0.5">
                          {Math.round(market.yesPriceUsd * 100)}¢
                        </div>
                        <div className="text-xs font-mono text-emerald-700 dark:text-emerald-400 font-bold">
                          {market.yesProbabilityPct.toFixed(1)}% Odds
                        </div>
                      </a>

                      <a
                        href={market.tradeNoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-950/80 border border-rose-200 dark:border-rose-800/80 rounded-xl p-3 text-center transition-all group shadow-sm"
                      >
                        <div className="text-xs font-mono uppercase text-rose-700 dark:text-rose-400 font-bold tracking-wider">
                          Trade NO
                        </div>
                        <div className="text-2xl font-black font-mono text-rose-600 dark:text-rose-300 my-0.5">
                          {Math.round(market.noPriceUsd * 100)}¢
                        </div>
                        <div className="text-xs font-mono text-rose-700 dark:text-rose-400 font-bold">
                          {market.noProbabilityPct.toFixed(1)}% Odds
                        </div>
                      </a>
                    </div>

                    {/* Interactive Quick Payout Teaser */}
                    <div className="bg-slate-50 dark:bg-zinc-950 p-2.5 rounded-xl text-xs sm:text-sm font-mono text-slate-700 dark:text-zinc-300 flex items-center justify-between border border-slate-200 dark:border-zinc-800">
                      <span className="font-semibold text-slate-500 dark:text-zinc-400">$100 Payout:</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">
                        YES pays ${Math.round(100 / market.yesPriceUsd).toLocaleString()} (+{Math.round((100 / market.yesPriceUsd - 100) / 100 * 100)}%)
                      </span>
                    </div>

                    {/* Volume and Polymarket Link */}
                    <div className="flex items-center justify-between text-xs sm:text-sm font-mono text-slate-600 dark:text-zinc-400 pt-1">
                      <span className="font-bold">Vol: ${(market.volumeUsd / 1_000).toFixed(0)}k</span>
                      <a
                        href={market.referralUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-600 dark:text-indigo-400 hover:underline flex items-center space-x-1 font-bold"
                      >
                        <span>Open on Polymarket</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: Odds & Profit Calculator */}
        {activeTab === "calculator" && (
          <div className="space-y-6">
            <div className="bg-slate-50 dark:bg-zinc-950 p-5 rounded-xl border border-slate-200 dark:border-zinc-800 space-y-5">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                  <Calculator className="w-4 h-4 text-indigo-500" />
                  <span>Polymarket Potential Payout &amp; Leverage Simulator</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-zinc-400 font-sans mt-0.5">
                  Calculate real-time potential profit, return on investment, and share quantities for any AI contract.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* 1. Pick Market */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 font-mono">
                    1. Select Contract
                  </label>
                  <select
                    value={calcMarketId}
                    onChange={(e) => setCalcMarketId(e.target.value)}
                    className="w-full text-xs font-medium rounded-lg p-2.5 bg-white dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700 text-slate-900 dark:text-white"
                  >
                    {POLYMARKET_FEATURED_MARKETS.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.title} ({Math.round(m.yesPriceUsd * 100)}¢)
                      </option>
                    ))}
                  </select>
                </div>

                {/* 2. Pick Outcome */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 font-mono">
                    2. Select Position
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setCalcOutcome("YES")}
                      className={`p-2 rounded-lg text-xs font-semibold transition-all flex flex-col items-center justify-center border ${
                        calcOutcome === "YES"
                          ? "bg-emerald-600 text-white border-emerald-500 shadow-sm"
                          : "bg-white dark:bg-zinc-900 text-slate-700 dark:text-zinc-300 border-slate-200 dark:border-zinc-800"
                      }`}
                    >
                      <span>YES ({Math.round(selectedCalcMarket.yesPriceUsd * 100)}¢)</span>
                      <span className="text-xs opacity-80">Asymmetric Upside</span>
                    </button>
                    <button
                      onClick={() => setCalcOutcome("NO")}
                      className={`p-2.5 rounded-lg text-xs font-semibold transition-all flex flex-col items-center justify-center border ${
                        calcOutcome === "NO"
                          ? "bg-rose-600 text-white border-rose-500 shadow-sm"
                          : "bg-white dark:bg-zinc-900 text-slate-700 dark:text-zinc-300 border-slate-200 dark:border-zinc-800"
                      }`}
                    >
                      <span>NO ({Math.round(selectedCalcMarket.noPriceUsd * 100)}¢)</span>
                      <span className="text-xs opacity-80">Consensus Yield</span>
                    </button>
                  </div>
                </div>

                {/* 3. Trade Sizing */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 font-mono">
                    3. Investment Amount (USDC)
                  </label>
                  <div className="flex items-center space-x-2">
                    <div className="relative flex-1">
                      <span className="absolute left-3 top-2.5 text-xs font-mono text-slate-400">$</span>
                      <input
                        type="number"
                        min="5"
                        max="100000"
                        value={calcAmount}
                        onChange={(e) => setCalcAmount(Math.max(1, Number(e.target.value) || 0))}
                        className="w-full text-sm font-bold pl-7 pr-3 py-2 rounded-lg bg-white dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700 text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>
                  {/* Preset chips */}
                  <div className="flex items-center space-x-1.5 overflow-x-auto pt-1">
                    {[50, 100, 250, 500, 1000].map((amt) => (
                      <button
                        key={amt}
                        onClick={() => setCalcAmount(amt)}
                        className={`text-xs font-mono font-semibold px-2.5 py-1 rounded border transition-colors ${
                          calcAmount === amt
                            ? "bg-indigo-600 text-white border-indigo-600"
                            : "bg-white dark:bg-zinc-900 text-slate-600 dark:text-zinc-400 border-slate-200 dark:border-zinc-800 hover:border-slate-300"
                        }`}
                      >
                        ${amt}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Real-Time Outcome Calculation Dashboard */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-200 dark:border-zinc-800">
                <div className="bg-white dark:bg-[#121214] p-3 rounded-xl border border-slate-200 dark:border-zinc-800">
                  <div className="text-xs font-mono font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">Shares Received</div>
                  <div className="text-xl font-black font-mono text-slate-900 dark:text-white font-tabular mt-1">
                    {Math.round(numShares).toLocaleString()}
                  </div>
                  <div className="text-xs font-mono text-slate-600 dark:text-zinc-400 mt-0.5">@ {Math.round(activePrice * 100)}¢ / share</div>
                </div>

                <div className="bg-white dark:bg-[#121214] p-3 rounded-xl border border-slate-200 dark:border-zinc-800">
                  <div className="text-xs font-mono font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">Total Payout on Resolution</div>
                  <div className="text-xl font-black font-mono text-emerald-600 dark:text-emerald-400 font-tabular mt-1">
                    ${totalPayout.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <div className="text-xs font-mono text-slate-600 dark:text-zinc-400 mt-0.5">$1.00 per winning share</div>
                </div>

                <div className="bg-white dark:bg-[#121214] p-3 rounded-xl border border-slate-200 dark:border-zinc-800">
                  <div className="text-xs font-mono font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">Net Profit</div>
                  <div className="text-xl font-black font-mono text-indigo-600 dark:text-indigo-400 font-tabular mt-1">
                    +${netProfit.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <div className="text-xs font-mono text-slate-600 dark:text-zinc-400 mt-0.5">Less initial ${calcAmount}</div>
                </div>

                <div className="bg-white dark:bg-[#121214] p-3 rounded-xl border border-slate-200 dark:border-zinc-800">
                  <div className="text-xs font-mono font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">Return on Investment (ROI)</div>
                  <div className="text-xl font-black font-mono text-emerald-600 dark:text-emerald-400 font-tabular mt-1">
                    +{roiPct.toFixed(1)}%
                  </div>
                  <div className="text-xs font-mono text-slate-600 dark:text-zinc-400 mt-0.5">Multiplier: {(totalPayout / Math.max(1, calcAmount)).toFixed(2)}×</div>
                </div>
              </div>

              {/* Direct Execution Button */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                <div className="text-xs text-slate-600 dark:text-zinc-400 font-sans">
                  Zero gas fees on Polygon. Contracts settle automatically via UMA decentralized oracle.
                </div>
                <a
                  href={tradeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-5 py-2.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-colors"
                >
                  <Zap className="w-3.5 h-3.5 fill-current" />
                  <span>Execute {calcOutcome} on Polymarket (Ref: {POLYMARKET_REFERRAL_CODE}) ↗</span>
                </a>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: Historical Timeline Probability Chart */}
        {activeTab === "trend" && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Historical Consensus Trajectory (Jan 2024 — Oct 2026)
                </h3>
                <p className="text-xs text-slate-500 dark:text-zinc-400 font-sans">
                  Crowd probability evolution across AI Bubble contracts, Oracle CDS refinancing stress, and OpenAI milestones.
                </p>
              </div>

              {/* Chart Legend */}
              <div className="flex flex-wrap items-center gap-3 text-xs font-mono">
                <span className="flex items-center space-x-1.5 text-slate-700 dark:text-zinc-300">
                  <span className="w-3 h-0.5 bg-rose-500"></span>
                  <span>AI Bubble 2026 (7.6%)</span>
                </span>
                <span className="flex items-center space-x-1.5 text-slate-700 dark:text-zinc-300">
                  <span className="w-3 h-0.5 bg-amber-500"></span>
                  <span>AI Bubble 2027 (15.5%)</span>
                </span>
                <span className="flex items-center space-x-1.5 text-slate-700 dark:text-zinc-300">
                  <span className="w-3 h-0.5 bg-indigo-500"></span>
                  <span>Oracle CDS Stress (38.0%)</span>
                </span>
                <span className="flex items-center space-x-1.5 text-slate-700 dark:text-zinc-300">
                  <span className="w-3 h-0.5 bg-emerald-500"></span>
                  <span>OpenAI AGI Odds (8.5%)</span>
                </span>
              </div>
            </div>

            {/* SVG Interactive Line Chart */}
            <div className="bg-slate-50 dark:bg-zinc-950 p-4 rounded-xl border border-slate-200 dark:border-zinc-800 overflow-x-auto">
              <svg
                viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                className="w-full h-auto min-w-[600px] select-none"
              >
                {/* Y-axis gridlines */}
                {[0, 10, 20, 30, 40, 50].map((val) => {
                  const y = getY(val);
                  return (
                    <g key={val}>
                      <line
                        x1={padding.left}
                        y1={y}
                        x2={chartWidth - padding.right}
                        y2={y}
                        stroke="currentColor"
                        className="text-slate-200 dark:text-zinc-800"
                        strokeDasharray={val === 0 ? "none" : "3 3"}
                        strokeWidth={val === 0 ? 1.5 : 1}
                      />
                      <text
                        x={padding.left - 8}
                        y={y + 4}
                        textAnchor="end"
                        className="text-xs font-mono font-medium fill-slate-500 dark:fill-zinc-400"
                      >
                        {val}%
                      </text>
                    </g>
                  );
                })}

                {/* X-axis labels */}
                {points.map((p, i) => {
                  const x = getX(i);
                  return (
                    <text
                      key={p.date}
                      x={x}
                      y={chartHeight - 12}
                      textAnchor="middle"
                      className="text-xs font-mono font-medium fill-slate-500 dark:fill-zinc-400"
                    >
                      {p.date}
                    </text>
                  );
                })}

                {/* Series Lines */}
                <path
                  d={bubble2026Path}
                  fill="none"
                  stroke="#f43f5e"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
                <path
                  d={bubble2027Path}
                  fill="none"
                  stroke="#f59e0b"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
                <path
                  d={oracleCdsPath}
                  fill="none"
                  stroke="#6366f1"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
                <path
                  d={openaiAgiPath}
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />

                {/* Data Points / Interactive nodes */}
                {points.map((p, i) => {
                  const x = getX(i);
                  const isHovered = hoveredPoint === i;
                  return (
                    <g key={p.date} onMouseEnter={() => setHoveredPoint(i)} onMouseLeave={() => setHoveredPoint(null)}>
                      {/* Vertical highlight line on hover */}
                      {isHovered && (
                        <line
                          x1={x}
                          y1={padding.top}
                          x2={x}
                          y2={chartHeight - padding.bottom}
                          stroke="#6366f1"
                          strokeWidth="1"
                          strokeDasharray="2 2"
                        />
                      )}
                      <circle cx={x} cy={getY(p.aiBubble2026)} r={isHovered ? 5 : 3} fill="#f43f5e" />
                      <circle cx={x} cy={getY(p.aiBubble2027)} r={isHovered ? 5 : 3} fill="#f59e0b" />
                      <circle cx={x} cy={getY(p.oracleCdsStress)} r={isHovered ? 5 : 3} fill="#6366f1" />
                      <circle cx={x} cy={getY(p.openaiAgiOdds)} r={isHovered ? 5 : 3} fill="#10b981" />
                    </g>
                  );
                })}
              </svg>

              {/* Tooltip Readout */}
              {hoveredPoint !== null && (
                <div className="mt-3 p-3 rounded-lg bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs font-mono flex flex-wrap items-center justify-between gap-3 shadow-sm">
                  <span className="font-bold text-slate-900 dark:text-white">
                    {points[hoveredPoint].date}
                  </span>
                  <span className="text-rose-600 dark:text-rose-400">
                    Bubble 2026: {points[hoveredPoint].aiBubble2026}%
                  </span>
                  <span className="text-amber-600 dark:text-amber-400">
                    Bubble 2027: {points[hoveredPoint].aiBubble2027}%
                  </span>
                  <span className="text-indigo-600 dark:text-indigo-400">
                    Oracle CDS Stress: {points[hoveredPoint].oracleCdsStress}%
                  </span>
                  <span className="text-emerald-600 dark:text-emerald-400">
                    OpenAI AGI: {points[hoveredPoint].openaiAgiOdds}%
                  </span>
                  <span className="text-slate-500 dark:text-zinc-400">
                    Cumulative Vol: ${points[hoveredPoint].volumeCumulativeMillions}M
                  </span>
                </div>
              )}
            </div>

            {/* Insight Note */}
            <div className="text-xs text-slate-600 dark:text-zinc-400 font-sans leading-relaxed bg-slate-50 dark:bg-zinc-900/50 p-4 rounded-xl border border-slate-200 dark:border-zinc-800">
              <span className="font-semibold text-slate-900 dark:text-white">Market Dynamic Insight:</span>{" "}
              Polymarket prices show that while 2026 downturn probability remains subdued at 7.6%, 2027 risk doubles to 15.5%, 
              mirroring the maturity profile of hyperscaler debt facilities and Oracle CDS spread widening (+131% since 2024).
            </div>
          </div>
        )}

        {/* TAB 4: Polymarket UMA 6-Condition Radar */}
        {activeTab === "triggers" && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-2 border-b border-slate-200 dark:border-zinc-800">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                  <ShieldAlert className="w-4 h-4 text-rose-500" />
                  <span>Polymarket Official Resolution Rulebook</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-zinc-400 font-sans mt-0.5">
                  The market resolves to YES if and only if <strong className="text-slate-800 dark:text-zinc-200">at least 3 of these 5 conditions</strong> occur within a single 90-day window.
                </p>
              </div>
              <div className="px-3 py-1 rounded bg-slate-100 dark:bg-zinc-800 text-xs font-mono text-slate-700 dark:text-zinc-300">
                Trigger Status: <span className="font-bold text-emerald-600 dark:text-emerald-400">0 of 3 Met</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {POLYMARKET_RESOLUTION_CONDITIONS.map((cond) => (
                <div
                  key={cond.id}
                  className="bg-white dark:bg-[#121214] border border-slate-200 dark:border-zinc-800 rounded-xl p-4 space-y-2.5 transition-colors shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 dark:text-white text-sm">{cond.title}</span>
                    <span
                      className={`px-2.5 py-0.5 rounded text-xs font-mono font-semibold ${
                        cond.riskLevel === "Low"
                          ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"
                          : cond.riskLevel === "Medium"
                          ? "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800"
                          : "bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800"
                      }`}
                    >
                      {cond.riskLevel}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs font-mono bg-slate-50 dark:bg-zinc-950 p-3 rounded-lg border border-slate-100 dark:border-zinc-800/80">
                    <div>
                      <div className="text-slate-500 dark:text-zinc-400 font-medium">Trigger Target</div>
                      <div className="font-bold text-slate-900 dark:text-zinc-100 text-xs sm:text-sm mt-0.5">{cond.target}</div>
                    </div>
                    <div>
                      <div className="text-slate-500 dark:text-zinc-400 font-medium">Live Reading</div>
                      <div className="font-bold text-slate-900 dark:text-zinc-100 text-xs sm:text-sm mt-0.5">{cond.currentValue}</div>
                    </div>
                  </div>

                  <p className="text-sm text-slate-700 dark:text-zinc-300 font-sans leading-relaxed">
                    {cond.weightDescription}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Affiliate Commission & Polymarket Partner Banner */}
        <div className="bg-gradient-to-r from-indigo-900/10 via-indigo-950/20 to-purple-900/10 dark:from-indigo-950/40 dark:via-zinc-900 dark:to-purple-950/30 border border-indigo-200 dark:border-indigo-800/80 rounded-xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start space-x-2 text-xs font-mono text-indigo-700 dark:text-indigo-400 font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Polymarket Referral Partner Integration</span>
            </div>
            <h4 className="text-base font-bold text-slate-900 dark:text-white">
              Hedge AI Capex &amp; Bubble Risk with Zero Gas Fees
            </h4>
            <p className="text-xs text-slate-600 dark:text-zinc-300 font-sans max-w-xl">
              Deposit USDC on Polygon, execute instant limit or market orders on AI Bubble contracts, and 
              earn trading volume rebates with referral code <strong className="font-mono text-indigo-600 dark:text-indigo-300">{POLYMARKET_REFERRAL_CODE}</strong>.
            </p>
          </div>

          <a
            href={POLYMARKET_BASE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-shrink-0 inline-flex items-center space-x-2 px-5 py-2.5 rounded-lg text-xs sm:text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-colors"
          >
            <span>Trade on Polymarket ↗</span>
          </a>
        </div>
      </div>
    </div>
  );
}
