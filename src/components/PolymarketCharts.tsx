"use client";

import React, { useState } from "react";
import {
  POLYMARKET_REFERRAL_CODE,
  POLYMARKET_FEATURED_MARKETS,
  POLYMARKET_HISTORICAL_TRENDS,
  POLYMARKET_RESOLUTION_CONDITIONS,
} from "@/data/polymarket-data";
import {
  TrendingUp,
  ShieldAlert,
  BarChart2,
  ArrowUpRight,
  Sparkles,
  Zap,
  Calculator,
  Copy,
  Check,
  Clock,
  Flame,
} from "lucide-react";

export function PolymarketCharts() {
  const [activeTab, setActiveTab] = useState<"markets" | "trend" | "triggers" | "calculator">("markets");
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  // Calculator State
  const [calcMarketId, setCalcMarketId] = useState<string>(POLYMARKET_FEATURED_MARKETS[0].id);
  const [calcOutcome, setCalcOutcome] = useState<"YES" | "NO">("YES");
  const [calcAmount, setCalcAmount] = useState<number>(100);

  const flagshipMarket = POLYMARKET_FEATURED_MARKETS[0];
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

  const handleCopyCode = () => {
    navigator.clipboard?.writeText(POLYMARKET_REFERRAL_CODE);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

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
    <div className="bg-[#0b0e14] dark:bg-[#090b10] border border-zinc-800 text-zinc-100 rounded-2xl overflow-hidden shadow-xl transition-colors">
      {/* Polymarket Partner Integration Header */}
      <div className="border-b border-zinc-800/90 bg-[#0d1117] p-5 sm:p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center space-x-2.5 flex-wrap gap-y-1">
              <span className="inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-mono font-bold bg-indigo-950/80 text-indigo-300 border border-indigo-700/80 whitespace-nowrap">
                <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse"></span>
                <span>POLYMARKET LIVE DECENTRALIZED ORDER BOOK</span>
              </span>
              <span className="text-zinc-600 text-xs">•</span>
              <span className="text-xs sm:text-sm font-bold font-mono text-zinc-300 whitespace-nowrap">
                ${(totalVolume / 1_000_000).toFixed(1)}M Total Volume
              </span>
              <span className="text-zinc-600 text-xs hidden sm:inline">•</span>
              <span className="text-xs font-mono text-emerald-400 font-bold whitespace-nowrap hidden sm:inline">
                Zero Gas Fees on Polygon
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center space-x-3 flex-wrap">
              <span>AI Bubble &amp; Tech Prediction Markets</span>
              <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-md bg-emerald-950/90 text-emerald-300 border border-emerald-800/80 whitespace-nowrap">
                Partner Ref: {POLYMARKET_REFERRAL_CODE}
              </span>
            </h2>

            <p className="text-xs sm:text-sm text-zinc-400 font-sans max-w-2xl leading-relaxed">
              Real-time decentralized order-book probabilities from Polymarket. Trade outcomes directly with USDC 
              to express directional conviction or hedge semiconductor and credit downside.
            </p>
          </div>

          {/* High-Converting Referral CTA Button */}
          <div className="flex flex-wrap items-center gap-2.5">
            <a
              href={`https://polymarket.com/?r=${POLYMARKET_REFERRAL_CODE}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-mono font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition-all whitespace-nowrap"
            >
              <Zap className="w-4 h-4 fill-current text-indigo-200" />
              <span>Trade on Polymarket (Ref: {POLYMARKET_REFERRAL_CODE})</span>
              <ArrowUpRight className="w-4 h-4 ml-0.5" />
            </a>

            <button
              onClick={handleCopyCode}
              title="Copy Referral Code"
              className="inline-flex items-center space-x-1.5 px-3 py-2.5 rounded-xl text-xs font-mono font-bold bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-700 transition-colors whitespace-nowrap"
            >
              {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-zinc-400" />}
              <span>{copiedCode ? "Code Copied!" : "Copy Code"}</span>
            </button>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center space-x-2 mt-5 border-t border-zinc-800/80 pt-4 overflow-x-auto scrollbar-none text-xs font-mono">
          <button
            onClick={() => setActiveTab("markets")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center space-x-2 border ${
              activeTab === "markets"
                ? "bg-white text-zinc-950 border-white shadow-sm"
                : "text-zinc-400 border-transparent hover:text-white hover:bg-zinc-800/70"
            }`}
          >
            <BarChart2 className="w-4 h-4" />
            <span>Featured Contracts &amp; Odds</span>
          </button>

          <button
            onClick={() => setActiveTab("calculator")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center space-x-2 border ${
              activeTab === "calculator"
                ? "bg-white text-zinc-950 border-white shadow-sm"
                : "text-zinc-400 border-transparent hover:text-white hover:bg-zinc-800/70"
            }`}
          >
            <Calculator className="w-4 h-4 text-indigo-400" />
            <span>Odds &amp; Payout Calculator</span>
          </button>

          <button
            onClick={() => setActiveTab("trend")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center space-x-2 border ${
              activeTab === "trend"
                ? "bg-white text-zinc-950 border-white shadow-sm"
                : "text-zinc-400 border-transparent hover:text-white hover:bg-zinc-800/70"
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>Historical Trajectory</span>
          </button>

          <button
            onClick={() => setActiveTab("triggers")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center space-x-2 border ${
              activeTab === "triggers"
                ? "bg-white text-zinc-950 border-white shadow-sm"
                : "text-zinc-400 border-transparent hover:text-white hover:bg-zinc-800/70"
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            <span>UMA Resolution Rulebook</span>
          </button>
        </div>
      </div>

      {/* Main Tab Content */}
      <div className="p-5 sm:p-6 space-y-6">
        {/* TAB 1: Live Market Cards & Bar Distributions */}
        {activeTab === "markets" && (
          <div className="space-y-6">
            {/* FEATURED HERO CARD: The Live Polymarket AI Bubble Contract */}
            <div className="bg-[#121214] border border-indigo-900/80 rounded-2xl p-4 sm:p-6 space-y-4 shadow-sm relative overflow-hidden">

              {/* Top Meta Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 pb-3 border-b border-zinc-800/80">
                <div className="flex items-center space-x-2.5 flex-wrap">
                  <span className="px-2.5 py-1 rounded-md bg-indigo-500/20 text-indigo-300 font-mono text-[11px] font-black uppercase tracking-wider border border-indigo-500/40 whitespace-nowrap flex items-center space-x-1.5">
                    <Flame className="w-3.5 h-3.5 text-amber-400 fill-current" />
                    <span>FLAGSHIP PREDICTION CONTRACT</span>
                  </span>

                  <span className="px-2.5 py-1 rounded-md bg-zinc-800 text-zinc-300 font-mono text-[11px] font-bold whitespace-nowrap flex items-center space-x-1.5">
                    <Clock className="w-3.5 h-3.5 text-zinc-400" />
                    <span>EXPIRATION: DEC 31, 2026</span>
                  </span>
                </div>

                <div className="text-xs font-mono text-zinc-400 flex items-center space-x-2">
                  <span className="text-zinc-500">SETTLEMENT:</span>
                  <span className="font-bold text-zinc-200">UMA Oracle (90-Day Window)</span>
                </div>
              </div>

              {/* Main Headline & Description */}
              <div className="space-y-2">
                <a
                  href={flagshipMarket.referralUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex items-baseline space-x-2"
                >
                  <h3 className="text-xl sm:text-2xl font-black text-white group-hover:text-indigo-300 transition-colors tracking-tight">
                    {flagshipMarket.title}
                  </h3>
                  <ArrowUpRight className="w-5 h-5 text-indigo-400 opacity-80 group-hover:opacity-100 shrink-0" />
                </a>

                <p className="text-xs sm:text-sm text-zinc-300 font-sans leading-relaxed max-w-3xl">
                  {flagshipMarket.description}
                </p>
              </div>

              {/* Visual Odds Distribution Bar */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between text-xs sm:text-sm font-mono font-bold">
                  <div className="flex items-center space-x-2">
                    <span className="text-emerald-400">YES {flagshipMarket.yesProbabilityPct.toFixed(1)}%</span>
                    <span className="text-zinc-500 font-normal">({Math.round(flagshipMarket.yesPriceUsd * 100)}¢ / share)</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-zinc-500 font-normal">({Math.round(flagshipMarket.noPriceUsd * 100)}¢ / share)</span>
                    <span className="text-rose-400">NO {flagshipMarket.noProbabilityPct.toFixed(1)}%</span>
                  </div>
                </div>

                {/* Interactive Split Bar with Click-to-Trade */}
                <div className="flex h-9 w-full rounded-xl overflow-hidden font-mono font-black text-xs shadow-inner border border-zinc-700/80">
                  <a
                    href={flagshipMarket.tradeYesUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Trade YES on Polymarket at 8¢"
                    style={{ width: `${Math.max(10, flagshipMarket.yesProbabilityPct)}%` }}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center transition-colors cursor-pointer whitespace-nowrap px-2"
                  >
                    YES {flagshipMarket.yesProbabilityPct.toFixed(1)}% ({Math.round(flagshipMarket.yesPriceUsd * 100)}¢)
                  </a>
                  <a
                    href={flagshipMarket.tradeNoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Trade NO on Polymarket at 92¢"
                    style={{ width: `${Math.min(90, flagshipMarket.noProbabilityPct)}%` }}
                    className="bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center transition-colors cursor-pointer whitespace-nowrap px-2"
                  >
                    NO {flagshipMarket.noProbabilityPct.toFixed(1)}% ({Math.round(flagshipMarket.noPriceUsd * 100)}¢)
                  </a>
                </div>
              </div>

              {/* 24h Trading Stats Grid & Payout Multiplier */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                <div className="bg-zinc-950/80 border border-zinc-800/80 rounded-xl p-3">
                  <div className="text-[10px] font-mono uppercase text-zinc-400 font-semibold tracking-wider">
                    24h Total Volume
                  </div>
                  <div className="text-lg font-black font-mono text-white font-tabular mt-0.5 whitespace-nowrap">
                    ${(flagshipMarket.volumeUsd / 1_000_000).toFixed(2)}M USDC
                  </div>
                  <div className="text-[11px] font-mono text-emerald-400 mt-0.5">High Liquidity</div>
                </div>

                <div className="bg-zinc-950/80 border border-zinc-800/80 rounded-xl p-3">
                  <div className="text-[10px] font-mono uppercase text-zinc-400 font-semibold tracking-wider">
                    Order Book Depth
                  </div>
                  <div className="text-lg font-black font-mono text-white font-tabular mt-0.5 whitespace-nowrap">
                    ${(flagshipMarket.liquidityUsd / 1_000).toFixed(1)}k Book
                  </div>
                  <div className="text-[11px] font-mono text-zinc-400 mt-0.5">Zero slippage</div>
                </div>

                <div className="bg-zinc-950/80 border border-zinc-800/80 rounded-xl p-3">
                  <div className="text-[10px] font-mono uppercase text-zinc-400 font-semibold tracking-wider">
                    24h Price Change
                  </div>
                  <div className="text-lg font-black font-mono text-rose-400 font-tabular mt-0.5 whitespace-nowrap">
                    {flagshipMarket.change24hPct >= 0 ? "+" : ""}{flagshipMarket.change24hPct.toFixed(1)}%
                  </div>
                  <div className="text-[11px] font-mono text-zinc-400 mt-0.5">Consensus tightening</div>
                </div>

                <div className="bg-zinc-950/80 border border-zinc-800/80 rounded-xl p-3">
                  <div className="text-[10px] font-mono uppercase text-zinc-400 font-semibold tracking-wider">
                    $100 YES Payout
                  </div>
                  <div className="text-lg font-black font-mono text-emerald-400 font-tabular mt-0.5 whitespace-nowrap">
                    ${Math.round(100 / flagshipMarket.yesPriceUsd).toLocaleString()}
                  </div>
                  <div className="text-[11px] font-mono text-emerald-400 mt-0.5">
                    +{(Math.round((100 / flagshipMarket.yesPriceUsd - 100) / 100 * 100)).toLocaleString()}% ROI
                  </div>
                </div>
              </div>

              {/* High-Converting Action Banner */}
              <div className="bg-zinc-950/90 border border-indigo-500/30 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="text-xs font-mono text-zinc-300 text-center sm:text-left">
                  <span>Trade with referral code </span>
                  <span className="font-bold text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded border border-amber-400/30">
                    {POLYMARKET_REFERRAL_CODE}
                  </span>
                  <span> for 0% gas fees &amp; automatic volume rebate credit.</span>
                </div>

                <div className="flex items-center space-x-2 w-full sm:w-auto">
                  <a
                    href={flagshipMarket.tradeYesUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 sm:flex-none inline-flex items-center justify-center space-x-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-bold transition-all shadow-md whitespace-nowrap"
                  >
                    <span>Trade YES ({Math.round(flagshipMarket.yesPriceUsd * 100)}¢)</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </a>

                  <a
                    href={flagshipMarket.tradeNoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 sm:flex-none inline-flex items-center justify-center space-x-1.5 px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-mono text-xs font-bold transition-all shadow-md whitespace-nowrap"
                  >
                    <span>Trade NO ({Math.round(flagshipMarket.noPriceUsd * 100)}¢)</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>

            {/* Quick Comparative Odds Overview */}
            <div className="bg-zinc-900/60 p-5 rounded-2xl border border-zinc-800 space-y-4 shadow-sm">
              <div className="flex items-center justify-between text-xs sm:text-sm font-semibold text-zinc-300 pb-2.5 border-b border-zinc-800">
                <span className="font-mono font-bold text-white uppercase tracking-wider">Cross-Market Consensus Odds</span>
                <span className="text-xs font-mono text-zinc-400">Click outcome bar to execute on Polymarket</span>
              </div>

              <div className="space-y-4">
                {POLYMARKET_FEATURED_MARKETS.map((m) => (
                  <div key={m.id} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs sm:text-sm">
                      <a
                        href={m.referralUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-bold text-white hover:text-indigo-400 flex items-center space-x-1 truncate max-w-[65%]"
                      >
                        <span className="truncate">{m.title}</span>
                        <ArrowUpRight className="w-3.5 h-3.5 flex-shrink-0 text-zinc-500" />
                      </a>
                      <div className="flex items-center space-x-2 font-mono text-xs sm:text-sm font-bold whitespace-nowrap">
                        <span className="text-emerald-400">
                          YES {m.yesProbabilityPct.toFixed(1)}% ({Math.round(m.yesPriceUsd * 100)}¢)
                        </span>
                        <span className="text-zinc-600">/</span>
                        <span className="text-rose-400">
                          NO {m.noProbabilityPct.toFixed(1)}% ({Math.round(m.noPriceUsd * 100)}¢)
                        </span>
                      </div>
                    </div>

                    {/* Visual Probability Split Bar with Direct Click-to-Trade */}
                    <div className="flex h-7 w-full rounded-lg overflow-hidden text-xs font-mono font-bold shadow-inner border border-zinc-800">
                      <a
                        href={m.tradeYesUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={`Trade YES on ${m.title} at ${Math.round(m.yesPriceUsd * 100)}¢`}
                        style={{ width: `${Math.max(6, m.yesProbabilityPct)}%` }}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center transition-colors cursor-pointer text-xs whitespace-nowrap px-1"
                      >
                        YES {m.yesProbabilityPct.toFixed(0)}%
                      </a>
                      <a
                        href={m.tradeNoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={`Trade NO on ${m.title} at ${Math.round(m.noPriceUsd * 100)}¢`}
                        style={{ width: `${Math.min(94, m.noProbabilityPct)}%` }}
                        className="bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center transition-colors cursor-pointer text-xs whitespace-nowrap px-1"
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
                  className="bg-zinc-900/70 border border-zinc-800 rounded-2xl p-5 flex flex-col justify-between hover:border-zinc-700 transition-all shadow-sm hover:shadow-md space-y-4"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="px-2.5 py-1 rounded-md bg-zinc-800 text-zinc-300 font-bold text-xs whitespace-nowrap">
                        {market.category}
                      </span>
                      <span
                        className={`font-bold text-xs whitespace-nowrap ${
                          market.change24hPct >= 0 ? "text-emerald-400" : "text-rose-400"
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
                      <h3 className="text-base sm:text-lg font-bold text-white group-hover:text-indigo-400 transition-colors leading-snug">
                        {market.title}
                      </h3>
                    </a>

                    <p className="text-xs text-zinc-400 font-sans line-clamp-3 leading-relaxed">
                      {market.description}
                    </p>
                  </div>

                  <div className="space-y-3 pt-3 border-t border-zinc-800/80">
                    {/* Live Pricing Boxes */}
                    <div className="grid grid-cols-2 gap-2.5">
                      <a
                        href={market.tradeYesUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-800/80 rounded-xl p-3 text-center transition-all group shadow-sm"
                      >
                        <div className="text-[10px] font-mono uppercase text-emerald-400 font-bold tracking-wider whitespace-nowrap">
                          Trade YES
                        </div>
                        <div className="text-2xl font-black font-mono text-emerald-300 my-0.5 whitespace-nowrap">
                          {Math.round(market.yesPriceUsd * 100)}¢
                        </div>
                        <div className="text-xs font-mono text-emerald-400 font-bold whitespace-nowrap">
                          {market.yesProbabilityPct.toFixed(1)}% Odds
                        </div>
                      </a>

                      <a
                        href={market.tradeNoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-rose-950/40 hover:bg-rose-900/50 border border-rose-800/80 rounded-xl p-3 text-center transition-all group shadow-sm"
                      >
                        <div className="text-[10px] font-mono uppercase text-rose-400 font-bold tracking-wider whitespace-nowrap">
                          Trade NO
                        </div>
                        <div className="text-2xl font-black font-mono text-rose-300 my-0.5 whitespace-nowrap">
                          {Math.round(market.noPriceUsd * 100)}¢
                        </div>
                        <div className="text-xs font-mono text-rose-400 font-bold whitespace-nowrap">
                          {market.noProbabilityPct.toFixed(1)}% Odds
                        </div>
                      </a>
                    </div>

                    {/* Expiration and Volume indicators */}
                    <div className="bg-zinc-950 p-2.5 rounded-xl text-xs font-mono text-zinc-300 flex items-center justify-between border border-zinc-800/80">
                      <span className="text-zinc-500 font-semibold whitespace-nowrap">Vol / Exp:</span>
                      <span className="font-bold text-zinc-200 whitespace-nowrap">
                        ${(market.volumeUsd / 1_000).toFixed(0)}k • {market.endDate}
                      </span>
                    </div>

                    {/* Polymarket Link */}
                    <div className="flex items-center justify-between text-xs font-mono text-zinc-400 pt-1">
                      <span className="font-bold text-emerald-400 whitespace-nowrap">Ref: {POLYMARKET_REFERRAL_CODE}</span>
                      <a
                        href={market.referralUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-400 hover:text-indigo-300 hover:underline flex items-center space-x-1 font-bold whitespace-nowrap"
                      >
                        <span>Trade Order Book</span>
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
            <div className="bg-zinc-900/70 p-5 rounded-2xl border border-zinc-800 space-y-5">
              <div>
                <h3 className="text-base font-bold text-white flex items-center space-x-2">
                  <Calculator className="w-4 h-4 text-indigo-400" />
                  <span>Polymarket Potential Payout &amp; Leverage Simulator</span>
                </h3>
                <p className="text-xs text-zinc-400 font-sans mt-0.5">
                  Calculate real-time potential profit, return on investment, and share quantities for any AI contract.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* 1. Pick Market */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-zinc-300 font-mono">
                    1. Select Contract
                  </label>
                  <select
                    value={calcMarketId}
                    onChange={(e) => setCalcMarketId(e.target.value)}
                    className="w-full text-xs font-mono font-medium rounded-lg p-2.5 bg-zinc-950 border border-zinc-700 text-white focus:outline-none focus:border-indigo-500"
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
                  <label className="text-xs font-semibold text-zinc-300 font-mono">
                    2. Select Position
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setCalcOutcome("YES")}
                      className={`p-2 rounded-lg text-xs font-semibold transition-all flex flex-col items-center justify-center border ${
                        calcOutcome === "YES"
                          ? "bg-emerald-600 text-white border-emerald-500 shadow-sm"
                          : "bg-zinc-950 text-zinc-300 border-zinc-800"
                      }`}
                    >
                      <span className="whitespace-nowrap">YES ({Math.round(selectedCalcMarket.yesPriceUsd * 100)}¢)</span>
                      <span className="text-[10px] opacity-80 whitespace-nowrap">Asymmetric Upside</span>
                    </button>
                    <button
                      onClick={() => setCalcOutcome("NO")}
                      className={`p-2.5 rounded-lg text-xs font-semibold transition-all flex flex-col items-center justify-center border ${
                        calcOutcome === "NO"
                          ? "bg-rose-600 text-white border-rose-500 shadow-sm"
                          : "bg-zinc-950 text-zinc-300 border-zinc-800"
                      }`}
                    >
                      <span className="whitespace-nowrap">NO ({Math.round(selectedCalcMarket.noPriceUsd * 100)}¢)</span>
                      <span className="text-[10px] opacity-80 whitespace-nowrap">Consensus Yield</span>
                    </button>
                  </div>
                </div>

                {/* 3. Trade Sizing */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-zinc-300 font-mono">
                    3. Investment Amount (USDC)
                  </label>
                  <div className="flex items-center space-x-2">
                    <div className="relative flex-1">
                      <span className="absolute left-3 top-2.5 text-xs font-mono text-zinc-500">$</span>
                      <input
                        type="number"
                        min="5"
                        max="100000"
                        value={calcAmount}
                        onChange={(e) => setCalcAmount(Math.max(1, Number(e.target.value) || 0))}
                        className="w-full text-sm font-mono font-bold pl-7 pr-3 py-2 rounded-lg bg-zinc-950 border border-zinc-700 text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>
                  {/* Preset chips */}
                  <div className="flex items-center space-x-1.5 overflow-x-auto pt-1">
                    {[50, 100, 250, 500, 1000].map((amt) => (
                      <button
                        key={amt}
                        onClick={() => setCalcAmount(amt)}
                        className={`text-xs font-mono font-semibold px-2.5 py-1 rounded border transition-colors whitespace-nowrap ${
                          calcAmount === amt
                            ? "bg-indigo-600 text-white border-indigo-600"
                            : "bg-zinc-950 text-zinc-400 border-zinc-800 hover:border-zinc-700"
                        }`}
                      >
                        ${amt}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Real-Time Outcome Calculation Dashboard */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-zinc-800">
                <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800">
                  <div className="text-[10px] font-mono font-semibold text-zinc-400 uppercase tracking-wider whitespace-nowrap">
                    Shares Received
                  </div>
                  <div className="text-xl font-black font-mono text-white font-tabular mt-1 whitespace-nowrap">
                    {Math.round(numShares).toLocaleString()}
                  </div>
                  <div className="text-xs font-mono text-zinc-400 mt-0.5 whitespace-nowrap">
                    @ {Math.round(activePrice * 100)}¢ / share
                  </div>
                </div>

                <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800">
                  <div className="text-[10px] font-mono font-semibold text-zinc-400 uppercase tracking-wider whitespace-nowrap">
                    Total Payout on Resolution
                  </div>
                  <div className="text-xl font-black font-mono text-emerald-400 font-tabular mt-1 whitespace-nowrap">
                    ${totalPayout.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <div className="text-xs font-mono text-zinc-400 mt-0.5 whitespace-nowrap">
                    $1.00 per winning share
                  </div>
                </div>

                <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800">
                  <div className="text-[10px] font-mono font-semibold text-zinc-400 uppercase tracking-wider whitespace-nowrap">
                    Net Profit
                  </div>
                  <div className="text-xl font-black font-mono text-indigo-400 font-tabular mt-1 whitespace-nowrap">
                    +${netProfit.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <div className="text-xs font-mono text-zinc-400 mt-0.5 whitespace-nowrap">
                    Less initial ${calcAmount}
                  </div>
                </div>

                <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800">
                  <div className="text-[10px] font-mono font-semibold text-zinc-400 uppercase tracking-wider whitespace-nowrap">
                    Return on Investment
                  </div>
                  <div className="text-xl font-black font-mono text-emerald-400 font-tabular mt-1 whitespace-nowrap">
                    +{roiPct.toFixed(1)}%
                  </div>
                  <div className="text-xs font-mono text-zinc-400 mt-0.5 whitespace-nowrap">
                    Multiplier: {(totalPayout / Math.max(1, calcAmount)).toFixed(2)}×
                  </div>
                </div>
              </div>

              {/* Direct Execution Button */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                <div className="text-xs text-zinc-400 font-sans">
                  Zero gas fees on Polygon. Contracts settle automatically via UMA decentralized oracle.
                </div>
                <a
                  href={tradeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-5 py-2.5 rounded-lg text-xs font-mono font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md transition-colors whitespace-nowrap"
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
                <h3 className="text-sm font-bold text-white font-mono">
                  Historical Consensus Trajectory (Jan 2024 — Oct 2026)
                </h3>
                <p className="text-xs text-zinc-400 font-sans">
                  Crowd probability evolution across AI Bubble contracts, Oracle CDS refinancing stress, and OpenAI milestones.
                </p>
              </div>

              {/* Chart Legend */}
              <div className="flex flex-wrap items-center gap-3 text-xs font-mono">
                <span className="flex items-center space-x-1.5 text-zinc-300 whitespace-nowrap">
                  <span className="w-3 h-0.5 bg-rose-500"></span>
                  <span>AI Bubble 2026 (7.6%)</span>
                </span>
                <span className="flex items-center space-x-1.5 text-zinc-300 whitespace-nowrap">
                  <span className="w-3 h-0.5 bg-amber-500"></span>
                  <span>AI Bubble 2027 (15.5%)</span>
                </span>
                <span className="flex items-center space-x-1.5 text-zinc-300 whitespace-nowrap">
                  <span className="w-3 h-0.5 bg-indigo-500"></span>
                  <span>Oracle CDS Stress (38.0%)</span>
                </span>
                <span className="flex items-center space-x-1.5 text-zinc-300 whitespace-nowrap">
                  <span className="w-3 h-0.5 bg-emerald-500"></span>
                  <span>OpenAI AGI Odds (8.5%)</span>
                </span>
              </div>
            </div>

            {/* SVG Interactive Line Chart */}
            <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 overflow-x-auto">
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
                        className="text-zinc-800"
                        strokeDasharray={val === 0 ? "none" : "3 3"}
                        strokeWidth={val === 0 ? 1.5 : 1}
                      />
                      <text
                        x={padding.left - 8}
                        y={y + 4}
                        textAnchor="end"
                        className="text-xs font-mono font-medium fill-zinc-400"
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
                      className="text-xs font-mono font-medium fill-zinc-400"
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
                <div className="mt-3 p-3 rounded-lg bg-zinc-900 border border-zinc-800 text-xs font-mono flex flex-wrap items-center justify-between gap-3 shadow-sm">
                  <span className="font-bold text-white whitespace-nowrap">
                    {points[hoveredPoint].date}
                  </span>
                  <span className="text-rose-400 whitespace-nowrap">
                    Bubble 2026: {points[hoveredPoint].aiBubble2026}%
                  </span>
                  <span className="text-amber-400 whitespace-nowrap">
                    Bubble 2027: {points[hoveredPoint].aiBubble2027}%
                  </span>
                  <span className="text-indigo-400 whitespace-nowrap">
                    Oracle CDS Stress: {points[hoveredPoint].oracleCdsStress}%
                  </span>
                  <span className="text-emerald-400 whitespace-nowrap">
                    OpenAI AGI: {points[hoveredPoint].openaiAgiOdds}%
                  </span>
                  <span className="text-zinc-400 whitespace-nowrap">
                    Cumulative Vol: ${points[hoveredPoint].volumeCumulativeMillions}M
                  </span>
                </div>
              )}
            </div>

            {/* Insight Note */}
            <div className="text-xs text-zinc-300 font-sans leading-relaxed bg-zinc-900/50 p-4 rounded-xl border border-zinc-800">
              <span className="font-semibold text-white">Market Dynamic Insight:</span>{" "}
              Polymarket prices show that while 2026 downturn probability remains subdued at 7.6%, 2027 risk doubles to 15.5%, 
              mirroring the maturity profile of hyperscaler debt facilities and Oracle CDS spread widening (+131% since 2024).
            </div>
          </div>
        )}

        {/* TAB 4: Polymarket UMA 6-Condition Radar */}
        {activeTab === "triggers" && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-2 border-b border-zinc-800">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                  <ShieldAlert className="w-4 h-4 text-rose-400" />
                  <span>Polymarket Official Resolution Rulebook</span>
                </h3>
                <p className="text-xs text-zinc-400 font-sans mt-0.5">
                  The market resolves to YES if and only if <strong className="text-zinc-200">at least 3 of these 5 conditions</strong> occur within a single 90-day window.
                </p>
              </div>
              <div className="px-3 py-1 rounded bg-zinc-800 text-xs font-mono text-zinc-300 whitespace-nowrap">
                Trigger Status: <span className="font-bold text-emerald-400">0 of 3 Met</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {POLYMARKET_RESOLUTION_CONDITIONS.map((cond) => (
                <div
                  key={cond.id}
                  className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-4 space-y-2.5 transition-colors shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-sm">{cond.title}</span>
                    <span
                      className={`px-2.5 py-0.5 rounded text-xs font-mono font-semibold whitespace-nowrap ${
                        cond.riskLevel === "Low"
                          ? "bg-emerald-950/60 text-emerald-300 border border-emerald-800"
                          : cond.riskLevel === "Medium"
                          ? "bg-amber-950/60 text-amber-300 border border-amber-800"
                          : "bg-rose-950/60 text-rose-300 border border-rose-800"
                      }`}
                    >
                      {cond.riskLevel}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs font-mono bg-zinc-950 p-3 rounded-lg border border-zinc-800/80">
                    <div>
                      <div className="text-zinc-400 font-medium whitespace-nowrap">Trigger Target</div>
                      <div className="font-bold text-zinc-100 text-xs sm:text-sm mt-0.5">{cond.target}</div>
                    </div>
                    <div>
                      <div className="text-zinc-400 font-medium whitespace-nowrap">Live Reading</div>
                      <div className="font-bold text-zinc-100 text-xs sm:text-sm mt-0.5">{cond.currentValue}</div>
                    </div>
                  </div>

                  <p className="text-xs text-zinc-300 font-sans leading-relaxed">
                    {cond.weightDescription}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Affiliate Commission & Polymarket Partner Banner */}
        <div className="bg-gradient-to-r from-indigo-950/50 via-zinc-900 to-purple-950/40 border border-indigo-700/60 rounded-xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start space-x-2 text-xs font-mono text-indigo-300 font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Polymarket Referral Partner Integration</span>
            </div>
            <h4 className="text-base font-bold text-white">
              Hedge AI Capex &amp; Bubble Risk with Zero Gas Fees
            </h4>
            <p className="text-xs text-zinc-300 font-sans max-w-xl">
              Deposit USDC on Polygon, execute instant limit or market orders on AI Bubble contracts, and 
              earn trading volume rebates with referral code <strong className="font-mono text-amber-300">{POLYMARKET_REFERRAL_CODE}</strong>.
            </p>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={handleCopyCode}
              className="px-3.5 py-2.5 rounded-lg text-xs font-mono font-bold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition-colors whitespace-nowrap"
            >
              {copiedCode ? "Copied AIbubble" : "Copy Code: AIbubble"}
            </button>
            <a
              href={`https://polymarket.com/?r=${POLYMARKET_REFERRAL_CODE}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-1.5 px-4 py-2.5 rounded-lg text-xs sm:text-sm font-mono font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md transition-colors whitespace-nowrap"
            >
              <span>Trade on Polymarket ↗</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
