"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  ShieldAlert,
  Flame,
  Scale,
  Zap,
  TrendingDown,
  TrendingUp,
  Activity,
  Layers,
  ArrowRight,
  ArrowUpRight,
  Database,
  Building2,
  Server,
  DollarSign,
  Cpu,
  BarChart3,
  Sliders,
  CheckCircle2,
  XCircle,
  HelpCircle,
  AlertTriangle,
  FileText,
  Percent,
  Search,
  Filter,
  RefreshCw,
  Info,
  ChevronDown,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import { AdSlot } from "@/components/AdSlot";
import { evaluateBubbleModel, DEFAULT_MODEL_INPUTS } from "@/lib/model/engine";
import rawDeals from "@/data/deals.json";
import liveStocksData from "@/data/live-stocks.json";
import liveModelsData from "@/data/live-models.json";
import { POLYMARKET_BASE_URL, POLYMARKET_REFERRAL_CODE } from "@/data/polymarket-data";

// ============================================================================
// DATA DEFINITIONS & COMPARISON SCORECARD
// ============================================================================

export interface MetricComparison {
  id: string;
  category: "cashflows" | "infrastructure" | "debt" | "macro" | "valuations" | "deflation";
  title: string;
  dotcom2000: {
    figure: string;
    description: string;
    status: "critical" | "warning" | "neutral";
  };
  ai2026: {
    figure: string;
    description: string;
    status: "healthy" | "warning" | "critical";
  };
  structuralVerdict: string;
  riskRating: "Low Divergence" | "Moderate Divergence" | "Extreme Structural Divergence";
  analyticalTakeaway: string;
}

const COMPARISON_METRICS: MetricComparison[] = [
  {
    id: "cash-flow",
    category: "cashflows",
    title: "Sector Operating Cash Flow (OCF) & Retained FCF",
    dotcom2000: {
      figure: "-$15.2B Burn",
      description: "80% of publicly listed dot-coms ran negative operating cash flow; median firm had <9 months of cash runway before bankruptcy.",
      status: "critical",
    },
    ai2026: {
      figure: "+$668B+ OCF / +$260B FCF",
      description: "Top 5 hyperscalers (MSFT, GOOGL, META, AMZN, AAPL) generate >$668B annual cash flow and >$400B net profits, self-funding $485B capex.",
      status: "healthy",
    },
    structuralVerdict: "Fortress Balance Sheets vs Zero-Cash Burners",
    riskRating: "Extreme Structural Divergence",
    analyticalTakeaway:
      "The dot-com bubble burst because startups literally ran out of dollar bills when capital markets froze. In 2026, Big Tech generates enough organic cash flow every 90 days to finance its entire annual AI infrastructure budget without touching debt.",
  },
  {
    id: "infra-utilization",
    category: "infrastructure",
    title: "Infrastructure Utility & Hardware Saturation Rate",
    dotcom2000: {
      figure: "3% – 5% Lit Fiber",
      description: "Telecom carriers laid 39 million miles of long-haul fiber optic cable ($30B+ capex); over 95% remained unlit 'dark fiber' for a decade.",
      status: "critical",
    },
    ai2026: {
      figure: "82% – 94% GPU Saturation",
      description: "Frontier H100/H200/B200 GPU clusters operate at peak capacity across hyperscalers and neoclouds, serving 350M+ active weekly users.",
      status: "healthy",
    },
    structuralVerdict: "Real Immediate Demand vs Stranded Physical Assets",
    riskRating: "Extreme Structural Divergence",
    analyticalTakeaway:
      "Telecom fiber was laid ahead of user applications (streaming video, e-commerce broadband did not exist yet). AI GPUs, by contrast, are immediately saturated with generative inference and continuous frontier training.",
  },
  {
    id: "debt-collateral",
    category: "debt",
    title: "Debt Architecture & Credit Contagion Vector",
    dotcom2000: {
      figure: "$1.2T Public Junk Bonds",
      description: "Unsecured high-yield bonds issued by speculative telecom carriers (WorldCom, Global Crossing, 360networks); resulted in catastrophic defaults.",
      status: "critical",
    },
    ai2026: {
      figure: "$228.1B Tracked Debt (8.0% Share)",
      description: "Debt is concentrated in asset-backed GPU facilities (CoreWeave $6.5B, Blackstone SPVs) and high-grade corporate bonds (Oracle $82B).",
      status: "warning",
    },
    structuralVerdict: "Contained to Leveraged Neoclouds & SPVs",
    riskRating: "Moderate Divergence",
    analyticalTakeaway:
      "Debt is far smaller as a percentage of total tech capitalization (8.0% across our 169 verified deals). However, 3-year GPU depreciation cycles mean debt-financed neoclouds face severe refinancing pinches if spot compute rates fall.",
  },
  {
    id: "fed-rates",
    category: "macro",
    title: "Federal Reserve Monetary Policy & Discount Rates",
    dotcom2000: {
      figure: "6.50% Fed Funds Peak",
      description: "The Fed aggressively hiked rates by 175 bps into May 2000, inverting the yield curve (10Y reached 6.66%) and cutting off speculative capital.",
      status: "critical",
    },
    ai2026: {
      figure: "5.10% US 10Y / 4.75% Fed Funds",
      description: "US 10-Year yield sits at 5.10% (real yield ~2.70%). Elevated discount rates compress valuations, but corporate credit spreads remain tight at 336 bps.",
      status: "warning",
    },
    structuralVerdict: "Restrictive Hurdle Rate without Sudden Liquidity Shock",
    riskRating: "Moderate Divergence",
    analyticalTakeaway:
      "While a 5.10% 10-year yield sets a high capital hurdle rate, credit markets remain open and corporate spreads are historically tight, unlike the sharp liquidity freeze of summer 2000.",
  },
  {
    id: "software-revenue",
    category: "valuations",
    title: "Software Revenue & Monetization Scale",
    dotcom2000: {
      figure: "$0 Real ARR (Eyeballs Metric)",
      description: "Companies were valued on 'pageviews', 'click-throughs', and banner ad swaps. Pets.com had $619k in revenue on $147M spent.",
      status: "critical",
    },
    ai2026: {
      figure: "$165B Enterprise AI ARR",
      description: "OpenAI generates $50.0B annualized run-rate, Anthropic targets $47.0B, Databricks $7.0B, Microsoft Copilot and AWS AI deliver tens of billions.",
      status: "healthy",
    },
    structuralVerdict: "Real Enterprise Software Utility vs Virtual Eyeballs",
    riskRating: "Extreme Structural Divergence",
    analyticalTakeaway:
      "Generative AI has achieved the fastest software revenue acceleration in modern history, scaling from zero to $165B+ in commercial enterprise ARR within 42 months.",
  },
  {
    id: "equity-multiples",
    category: "valuations",
    title: "Equity Multiples & Valuation Stretch",
    dotcom2000: {
      figure: "Cisco 38× P/S · Yahoo 100× P/S",
      description: "Cisco reached $555B valuation at 125× P/E. Unprofitable dot-coms traded at 100× sales without viable path to positive gross margins.",
      status: "critical",
    },
    ai2026: {
      figure: "NVIDIA 28× P/S · Big Tech 28–34× P/E",
      description: "NVIDIA ($5.27T cap on $185B ARR) trades at ~28× sales. Hyperscalers trade at 28–34× P/E. Private frontier labs trade at 19–42× ARR.",
      status: "warning",
    },
    structuralVerdict: "Elevated Multiples, but Grounded in 50%+ Operating Margins",
    riskRating: "Low Divergence",
    analyticalTakeaway:
      "While valuations are rich, NVIDIA delivers 75% gross margins and $185B in actual hardware shipments. Frontier labs are stretched, but aggregate tech valuations are 40% lower than Cisco's 2000 peak.",
  },
  {
    id: "unit-deflation",
    category: "deflation",
    title: "Unit Economics Deflation (Cost per Workload)",
    dotcom2000: {
      figure: "-25% Slow Dial-Up Decline",
      description: "Bandwidth costs fell modestly (~25% YoY). Dial-up modems (56kbps) physically choked rich applications; high transit fees persisted.",
      status: "critical",
    },
    ai2026: {
      figure: "-99.7% Token Deflation (375× Cheaper)",
      description: "Inference completion costs collapsed from $30.00/1M (GPT-4 in 2023) to $0.08/1M (DeepSeek V4.1 Flash) and $0.50/1M (Claude Haiku 5.5).",
      status: "healthy",
    },
    structuralVerdict: "Massive Margin Expansion for Software Builders",
    riskRating: "Extreme Structural Divergence",
    analyticalTakeaway:
      "Exponential token deflation is the ultimate economic cushion: it allows end-user software applications to turn profitable rapidly, creating genuine business utility.",
  },
  {
    id: "systemic-vector",
    category: "debt",
    title: "Primary Systemic Vulnerability Vector",
    dotcom2000: {
      figure: "Systemic Public Equity Crash",
      description: "Broad retail equity crash wiping out $5T across Nasdaq (-78% peak-to-trough) and triggering a general US economic recession.",
      status: "critical",
    },
    ai2026: {
      figure: "Neocloud Credit Refinance Squeeze",
      description: "Vulnerability is concentrated in secondary GPU cloud providers and private debt facilities unable to roll over debt as hardware depreciates.",
      status: "warning",
    },
    structuralVerdict: "Isolated Credit Restructuring vs Macro Equity Collapse",
    riskRating: "Moderate Divergence",
    analyticalTakeaway:
      "An AI correction would look like a private credit restructuring wave among secondary compute providers (the 1999 CLEC parallel) rather than an existential solvency crisis for Microsoft, Google, or Apple.",
  },
];

export default function DotComVsAiPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"scorecard" | "clec-parallel" | "cashflows" | "simulator">("scorecard");
  
  // Interactive Simulator State
  const [simRegime, setSimRegime] = useState<"dotcom2000" | "ai2026" | "creditFreeze">("ai2026");
  const [customFcf, setCustomFcf] = useState<number>(260); // $B
  const [customDebt, setCustomDebt] = useState<number>(228); // $B
  const [customYield, setCustomYield] = useState<number>(5.10); // %
  const [customDeflation, setCustomDeflation] = useState<number>(60); // x cheaper

  // Current verified model result
  const baselineModel = useMemo(() => evaluateBubbleModel(DEFAULT_MODEL_INPUTS), []);

  // Filtered metrics
  const filteredMetrics = useMemo(() => {
    return COMPARISON_METRICS.filter((m) => {
      const matchesCategory = selectedCategory === "all" || m.category === selectedCategory;
      const matchesSearch =
        m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.structuralVerdict.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.analyticalTakeaway.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  // Dynamic simulation score calculation
  const simResult = useMemo(() => {
    if (simRegime === "dotcom2000") {
      return {
        burstProb: 91.4,
        score: 84.2,
        band: "CRITICAL",
        bandColor: "text-rose-500",
        badgeColor: "bg-rose-500/10 text-rose-500 border-rose-500/20",
        mertonDD: "0.85σ",
        altmanZone: "Distress Zone (0.42)",
        interpretation: "Dot-Com 2000 scenario: Negative cash flows, zero software ARR, and 6.50% Fed rate spike make systemic liquidation inevitable.",
      };
    } else if (simRegime === "creditFreeze") {
      return {
        burstProb: 68.2,
        score: 64.8,
        band: "HIGH STRESS",
        bandColor: "text-amber-500",
        badgeColor: "bg-amber-500/10 text-amber-500 border-amber-500/20",
        mertonDD: "3.20σ",
        altmanZone: "Grey Zone (1.85)",
        interpretation: "Neocloud Credit Freeze scenario: Secondary GPU clouds default on debt facilities; Big Tech absorbs distressed clusters at 40¢ on the dollar.",
      };
    } else {
      // Dynamic calculation based on sliders
      // Cash flow buffer reduces probability
      const fcfDelta = (customFcf - 260) / 20; // each $20B FCF changes prob by ~1.2%
      // Debt increases risk
      const debtDelta = (customDebt - 228) / 30; // each $30B debt adds ~1.5%
      // Yield increases hurdle
      const yieldDelta = (customYield - 5.10) * 4.0; // each 50bps adds 2%
      // Deflation acts as adoption cushion
      const deflDelta = -Math.log10(customDeflation / 60) * 8.0;

      const dynamicProb = Math.min(95, Math.max(15, baselineModel.burstProbability - fcfDelta + debtDelta + yieldDelta + deflDelta));
      const dynamicScore = Math.min(95, Math.max(20, baselineModel.compositeScore + (dynamicProb - baselineModel.burstProbability) * 0.7));

      const band = dynamicProb >= 70 ? "CRITICAL" : dynamicProb >= 50 ? "ELEVATED" : "MODERATE";
      const bandColor = dynamicProb >= 70 ? "text-rose-500" : dynamicProb >= 50 ? "text-amber-500" : "text-emerald-500";
      const badgeColor = dynamicProb >= 70 ? "bg-rose-500/10 text-rose-500 border-rose-500/20" : dynamicProb >= 50 ? "bg-amber-500/10 text-amber-500 border-amber-500/20" : "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";

      return {
        burstProb: Number(dynamicProb.toFixed(1)),
        score: Number(dynamicScore.toFixed(1)),
        band,
        bandColor,
        badgeColor,
        mertonDD: "4.97σ",
        altmanZone: "Safe Zone (8.41)",
        interpretation: "2026 Baseline: Massive hyperscaler cash flows protect equity solvency, counterbalancing $228.1B in private debt facilities.",
      };
    }
  }, [simRegime, customFcf, customDebt, customYield, customDeflation, baselineModel]);

  return (
    <div className="space-y-10 pb-16">
      {/* Top Sponsored Ad */}
      <AdSlot format="leaderboard" />

      {/* Breadcrumb & Live Research Indicator */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-mono pb-2 border-b border-slate-200 dark:border-zinc-800">
        <nav aria-label="Breadcrumb" className="flex items-center space-x-2 text-slate-500 dark:text-zinc-400">
          <Link href="/" className="hover:text-slate-900 dark:hover:text-white transition-colors">
            Home
          </Link>
          <span>/</span>
          <span className="text-slate-900 dark:text-white font-semibold">
            Institutional Research
          </span>
          <span>/</span>
          <span className="text-amber-600 dark:text-amber-400 font-bold">AI Superstructure vs Dot-Com</span>
        </nav>

        <div className="flex items-center space-x-2 bg-slate-100 dark:bg-zinc-900 px-3 py-1 rounded-full border border-slate-200 dark:border-zinc-800 text-[11px]">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-bold text-slate-700 dark:text-zinc-300">OCTOBER 19, 2026:</span>
          <span className="text-slate-500 dark:text-zinc-400 font-medium">Live Macro &amp; SEC Filing Synthesis</span>
        </div>
      </div>

      {/* Hero Header */}
      <div className="space-y-4">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs font-mono font-bold uppercase tracking-wider">
          <Flame className="w-3.5 h-3.5" />
          <span>Episodic Market History &amp; Structural Architecture</span>
        </div>

        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
          AI Superstructure (2026) vs. Dot-Com Bubble (2000)
        </h1>

        <p className="text-base sm:text-lg text-slate-600 dark:text-zinc-400 max-w-4xl font-sans leading-relaxed">
          A quantitative macroeconomic investigation contrasting the 1999–2000 telecom crash against the 2026 generative AI deployment supercycle. Why <strong className="text-slate-900 dark:text-white">$668B in organic hyperscaler cash flows</strong> shields public equities, but <strong className="text-amber-500">$228.1B in debt-financed GPU neoclouds</strong> exhibits classic dot-com telecom refinancing fragility.
        </p>

        {/* 3 Core Analytical Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-3">
          <div className="p-4 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#121214] shadow-xs space-y-2">
            <div className="flex items-center space-x-2 text-emerald-600 dark:text-emerald-400 text-xs font-mono font-bold">
              <CheckCircle2 className="w-4 h-4" />
              <span>THE FORTRESS SOLVENCY CUSHION</span>
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              +$668B Hyperscaler Cash Flows
            </h3>
            <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
              Unlike 2000 dot-coms that burnt -$15B annually with zero profits, Microsoft, Google, Meta, Amazon, and Apple produce <span className="font-bold text-slate-900 dark:text-white">$400B+ net profit</span> and <span className="font-bold text-slate-900 dark:text-white">$260B+ retained FCF</span>, self-funding $485B capex organically.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#121214] shadow-xs space-y-2">
            <div className="flex items-center space-x-2 text-amber-500 text-xs font-mono font-bold">
              <AlertTriangle className="w-4 h-4" />
              <span>THE 1999 CLEC REFINANCE TRAP</span>
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              $228.1B Private GPU Debt Risk
            </h3>
            <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
              The real fragility resides in secondary GPU cloud providers (CoreWeave $6.5B debt, Crusoe $3.4B JV) mirroring 1999 Competitive Local Exchange Carriers (CLECs) whose physical assets depreciated faster than loan amortizations.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#121214] shadow-xs space-y-2">
            <div className="flex items-center space-x-2 text-teal-600 dark:text-teal-400 text-xs font-mono font-bold">
              <Zap className="w-4 h-4" />
              <span>REAL HARDWARE UTILIZATION</span>
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              85%+ Saturation vs 5% Dark Fiber
            </h3>
            <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
              Telecom carriers laid 39M miles of dark fiber that stayed unlit for a decade. Frontier GPU clusters run at peak utilization while token costs have deflated <span className="font-bold text-teal-500">375×</span>, unlocking $165B in commercial software ARR.
            </p>
          </div>
        </div>
      </div>

      {/* Interactive Navigation Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-zinc-800 pb-3">
        <div className="flex items-center space-x-1.5 p-1 rounded-xl bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800">
          <button
            onClick={() => setActiveTab("scorecard")}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
              activeTab === "scorecard"
                ? "bg-white dark:bg-zinc-800 text-slate-900 dark:text-white shadow-xs"
                : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            Scorecard Matrix (8 Metrics)
          </button>
          <button
            onClick={() => setActiveTab("clec-parallel")}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
              activeTab === "clec-parallel"
                ? "bg-white dark:bg-zinc-800 text-slate-900 dark:text-white shadow-xs"
                : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            The Neocloud &ldquo;CLEC&rdquo; Parallel
          </button>
          <button
            onClick={() => setActiveTab("cashflows")}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
              activeTab === "cashflows"
                ? "bg-white dark:bg-zinc-800 text-slate-900 dark:text-white shadow-xs"
                : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            Cash Flows &amp; Dark Fiber
          </button>
          <button
            onClick={() => setActiveTab("simulator")}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
              activeTab === "simulator"
                ? "bg-white dark:bg-zinc-800 text-slate-900 dark:text-white shadow-xs"
                : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            Regime Simulator
          </button>
        </div>

        {/* Live Polymarket Referral Badge */}
        <a
          href={POLYMARKET_BASE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/60 text-xs font-mono font-bold hover:bg-indigo-100 transition-all"
        >
          <Zap className="w-3.5 h-3.5 fill-current text-indigo-500" />
          <span>Hedge Bubble Risk on Polymarket</span>
          <ArrowUpRight className="w-3.5 h-3.5 ml-0.5" />
        </a>
      </div>

      {/* TAB 1: SIDE-BY-SIDE SCORECARD MATRIX */}
      {activeTab === "scorecard" && (
        <div className="space-y-6">
          {/* Category Filter Chips & Search Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-1.5 text-xs font-mono">
              {[
                { id: "all", label: "All Dimensions" },
                { id: "cashflows", label: "Cash Flows" },
                { id: "infrastructure", label: "Hardware & Fiber" },
                { id: "debt", label: "Debt & Credit" },
                { id: "valuations", label: "Multiples & ARR" },
                { id: "deflation", label: "Token Deflation" },
              ].map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedCategory(c.id)}
                  className={`px-2.5 py-1 rounded-lg transition-all ${
                    selectedCategory === c.id
                      ? "bg-slate-900 dark:bg-zinc-700 text-white font-bold"
                      : "bg-slate-100 dark:bg-zinc-900 text-slate-600 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-zinc-800"
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Filter metrics & takeaways..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#121214] text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-emerald-500 font-mono"
              />
            </div>
          </div>

          {/* High-Impact Side-by-Side Comparison Grid */}
          <div className="space-y-4">
            {filteredMetrics.map((m) => (
              <div
                key={m.id}
                className="p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#121214] space-y-4 shadow-xs hover:border-slate-300 dark:hover:border-zinc-700 transition-all"
              >
                {/* Metric Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-zinc-800">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                      {m.category.toUpperCase()}
                    </span>
                    <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                      {m.title}
                    </h3>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                        m.riskRating === "Extreme Structural Divergence"
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                          : m.riskRating === "Moderate Divergence"
                          ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
                          : "bg-indigo-500/10 text-indigo-500 border-indigo-500/20"
                      }`}
                    >
                      {m.riskRating}
                    </span>
                  </div>
                </div>

                {/* Side-by-Side Comparison Columns */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Dot-Com 2000 Column */}
                  <div className="p-4 rounded-xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 space-y-2">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="font-bold text-rose-700 dark:text-rose-400 flex items-center space-x-1">
                        <TrendingDown className="w-3.5 h-3.5" />
                        <span>1999–2000 DOT-COM BUBBLE</span>
                      </span>
                      <span className="px-1.5 py-0.2 rounded bg-rose-200/60 dark:bg-rose-900/60 text-rose-800 dark:text-rose-200 text-[10px] font-bold">
                        HISTORICAL CRASH
                      </span>
                    </div>
                    <div className="text-xl sm:text-2xl font-black text-rose-900 dark:text-rose-200 font-mono">
                      {m.dotcom2000.figure}
                    </div>
                    <p className="text-xs text-rose-800/80 dark:text-rose-300/80 leading-relaxed font-sans">
                      {m.dotcom2000.description}
                    </p>
                  </div>

                  {/* AI 2026 Column */}
                  <div
                    className={`p-4 rounded-xl border space-y-2 ${
                      m.ai2026.status === "healthy"
                        ? "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40"
                        : "bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/40"
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span
                        className={`font-bold flex items-center space-x-1 ${
                          m.ai2026.status === "healthy"
                            ? "text-emerald-700 dark:text-emerald-400"
                            : "text-amber-700 dark:text-amber-400"
                        }`}
                      >
                        {m.ai2026.status === "healthy" ? (
                          <TrendingUp className="w-3.5 h-3.5" />
                        ) : (
                          <AlertTriangle className="w-3.5 h-3.5" />
                        )}
                        <span>2025–2026 AI SUPERSTRUCTURE</span>
                      </span>
                      <span
                        className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                          m.ai2026.status === "healthy"
                            ? "bg-emerald-200/60 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200"
                            : "bg-amber-200/60 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200"
                        }`}
                      >
                        {m.ai2026.status === "healthy" ? "SOLVENT BUFFER" : "CREDIT WATCH"}
                      </span>
                    </div>
                    <div
                      className={`text-xl sm:text-2xl font-black font-mono ${
                        m.ai2026.status === "healthy"
                          ? "text-emerald-900 dark:text-emerald-200"
                          : "text-amber-900 dark:text-amber-200"
                      }`}
                    >
                      {m.ai2026.figure}
                    </div>
                    <p
                      className={`text-xs leading-relaxed font-sans ${
                        m.ai2026.status === "healthy"
                          ? "text-emerald-800/80 dark:text-emerald-300/80"
                          : "text-amber-800/80 dark:text-amber-300/80"
                      }`}
                    >
                      {m.ai2026.description}
                    </p>
                  </div>
                </div>

                {/* Structural Verdict & Analytical Takeaway */}
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-zinc-900/80 border border-slate-200 dark:border-zinc-800 space-y-1">
                  <div className="flex items-center space-x-2 text-xs font-mono font-bold text-slate-900 dark:text-white">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span>STRUCTURAL VERDICT: {m.structuralVerdict}</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-zinc-300 leading-relaxed font-sans pl-3.5">
                    {m.analyticalTakeaway}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: THE NEOCLOUD "CLEC" PARALLEL (Deep Dive) */}
      {activeTab === "clec-parallel" && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#121214] space-y-6">
            <div>
              <span className="text-xs font-mono text-amber-500 font-bold uppercase tracking-wider">
                FINANCIAL ANATOMY · EPISODIC CASE STUDY
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1">
                The Neocloud &ldquo;CLEC&rdquo; Parallel (1999 vs 2026)
              </h2>
              <p className="text-sm text-slate-600 dark:text-zinc-400 mt-2 font-sans leading-relaxed">
                While Microsoft, Alphabet, and Meta resemble sovereign digital utilities with massive balance sheet equity, the secondary GPU compute cloud providers exhibit structural mechanics almost identical to the 1999 Competitive Local Exchange Carriers (CLECs).
              </p>
            </div>

            {/* Side-by-side Historical Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              <div className="p-5 rounded-xl border border-rose-200 dark:border-rose-900/40 bg-rose-50/40 dark:bg-rose-950/20 space-y-3">
                <div className="flex items-center justify-between text-xs font-mono text-rose-600 dark:text-rose-400 font-bold">
                  <span>THE 1999 CLEC BOOM &amp; COLLAPSE</span>
                  <span className="px-2 py-0.5 rounded bg-rose-200/60 dark:bg-rose-900/60 text-rose-900 dark:text-rose-200">
                    Winstar · Teligent · Covad
                  </span>
                </div>
                <h4 className="text-base font-bold text-slate-900 dark:text-white">
                  Debt-Funded Local Fiber Loops
                </h4>
                <ul className="space-y-2 text-xs text-slate-700 dark:text-zinc-300 leading-relaxed list-disc pl-4 font-sans">
                  <li>
                    <strong>Vendor Financing:</strong> Equipment makers (Lucent, Nortel) lent billions directly to CLECs to buy their switching gear.
                  </li>
                  <li>
                    <strong>Junk Bond Capital:</strong> Over $80B in high-yield debt was issued to lay metropolitan fiber rings under the assumption of 100%+ annual internet traffic growth.
                  </li>
                  <li>
                    <strong>The Collapse:</strong> As transit prices plunged and bandwidth supply flooded the market, revenues collapsed. Within 18 months, 24 of the top 25 CLECs entered Chapter 11 bankruptcy.
                  </li>
                </ul>
              </div>

              <div className="p-5 rounded-xl border border-amber-200 dark:border-amber-900/40 bg-amber-50/40 dark:bg-amber-950/20 space-y-3">
                <div className="flex items-center justify-between text-xs font-mono text-amber-600 dark:text-amber-400 font-bold">
                  <span>THE 2026 GPU NEOCLOUD SUPERSTRUCTURE</span>
                  <span className="px-2 py-0.5 rounded bg-amber-200/60 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200">
                    CoreWeave · Crusoe · Lambda
                  </span>
                </div>
                <h4 className="text-base font-bold text-slate-900 dark:text-white">
                  Asset-Backed GPU Facilities
                </h4>
                <ul className="space-y-2 text-xs text-slate-700 dark:text-zinc-300 leading-relaxed list-disc pl-4 font-sans">
                  <li>
                    <strong>Compute Collateral:</strong> Neoclouds pledge NVIDIA H100/H200/B200 servers as collateral to private debt syndicates (Blackstone, Coatue, Carlyle, Blue Owl).
                  </li>
                  <li>
                    <strong>Depreciation Drag:</strong> High-performance GPUs lose 60–75% of their economic value within 36 months as next-gen Blackwell and Rubin architectures ship.
                  </li>
                  <li>
                    <strong>Refinancing Hurdle:</strong> With $228.1B in tracked debt across the ecosystem, any softening in compute rental spot rates ($2.15/GPU-hr) impairs loan-to-value ratios, creating refinancing pressure.
                  </li>
                </ul>
              </div>
            </div>

            {/* Institutional Neocloud Debt Breakdown */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 space-y-3">
              <h4 className="text-xs font-mono font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Institutional Verified Debt Exposure in Secondary Compute Tier
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                <div className="p-3 rounded-lg bg-white dark:bg-[#121214] border border-slate-200 dark:border-zinc-800 space-y-1">
                  <span className="text-slate-500">CoreWeave Debt</span>
                  <div className="text-base font-bold text-slate-900 dark:text-white">$6.5B+</div>
                  <span className="text-[10px] text-amber-500">Blackstone / Coatue SPV</span>
                </div>
                <div className="p-3 rounded-lg bg-white dark:bg-[#121214] border border-slate-200 dark:border-zinc-800 space-y-1">
                  <span className="text-slate-500">Crusoe Energy JV</span>
                  <div className="text-base font-bold text-slate-900 dark:text-white">$3.4B</div>
                  <span className="text-[10px] text-amber-500">Blue Owl Capital Facility</span>
                </div>
                <div className="p-3 rounded-lg bg-white dark:bg-[#121214] border border-slate-200 dark:border-zinc-800 space-y-1">
                  <span className="text-slate-500">Oracle AI Debt</span>
                  <div className="text-base font-bold text-slate-900 dark:text-white">$82.0B</div>
                  <span className="text-[10px] text-slate-400">Senior Unsecured (187bp CDS)</span>
                </div>
                <div className="p-3 rounded-lg bg-white dark:bg-[#121214] border border-slate-200 dark:border-zinc-800 space-y-1">
                  <span className="text-slate-500">Anthropic Debt</span>
                  <div className="text-base font-bold text-slate-900 dark:text-white">$57.0B</div>
                  <span className="text-[10px] text-indigo-400">Broadcom Convert &amp; Facility</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: CASH FLOWS & DARK FIBER (Detailed Economic Analysis) */}
      {activeTab === "cashflows" && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#121214] space-y-6">
            <div>
              <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider">
                MACROECONOMIC BALANCE SHEET DECONSTRUCTION
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1">
                The Cash Flow Engine: Hyperscaler Solvency vs. 2000 Burn
              </h2>
              <p className="text-sm text-slate-600 dark:text-zinc-400 mt-2 font-sans leading-relaxed">
                The single most decisive empirical differentiator between 2000 and 2026 is corporate cash generation. In the dot-com era, tech companies burned cash to fund operations. In 2026, tech hyperscalers are the most profitable commercial enterprises in world history.
              </p>
            </div>

            {/* Hyperscaler Cash Flow Breakdown Matrix */}
            <div className="space-y-3">
              <h4 className="text-xs font-mono font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Hyperscaler FY2025/2026 Cash Flows vs. Capex (SEC 10-K Consensus)
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-xs font-mono border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-zinc-800 text-left text-slate-500">
                      <th className="py-2.5 px-3">Company</th>
                      <th className="py-2.5 px-3">Operating Cash Flow</th>
                      <th className="py-2.5 px-3">Annual AI Capex</th>
                      <th className="py-2.5 px-3">Retained Free Cash Flow</th>
                      <th className="py-2.5 px-3">Capex / OCF Ratio</th>
                      <th className="py-2.5 px-3">Credit Rating</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/60 text-slate-800 dark:text-zinc-200">
                    <tr className="hover:bg-slate-50 dark:hover:bg-zinc-900/50">
                      <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white">Microsoft (MSFT)</td>
                      <td className="py-2.5 px-3 text-emerald-600 dark:text-emerald-400">$136.2B</td>
                      <td className="py-2.5 px-3">$80.0B</td>
                      <td className="py-2.5 px-3 font-bold">$56.2B</td>
                      <td className="py-2.5 px-3">58.7%</td>
                      <td className="py-2.5 px-3"><span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-500 font-bold">AAA</span></td>
                    </tr>
                    <tr className="hover:bg-slate-50 dark:hover:bg-zinc-900/50">
                      <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white">Alphabet (GOOGL)</td>
                      <td className="py-2.5 px-3 text-emerald-600 dark:text-emerald-400">$128.5B</td>
                      <td className="py-2.5 px-3">$75.0B</td>
                      <td className="py-2.5 px-3 font-bold">$53.5B</td>
                      <td className="py-2.5 px-3">58.4%</td>
                      <td className="py-2.5 px-3"><span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-500 font-bold">AA+</span></td>
                    </tr>
                    <tr className="hover:bg-slate-50 dark:hover:bg-zinc-900/50">
                      <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white">Meta Platforms (META)</td>
                      <td className="py-2.5 px-3 text-emerald-600 dark:text-emerald-400">$98.4B</td>
                      <td className="py-2.5 px-3">$65.0B</td>
                      <td className="py-2.5 px-3 font-bold">$33.4B</td>
                      <td className="py-2.5 px-3">66.1%</td>
                      <td className="py-2.5 px-3"><span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-500 font-bold">AA-</span></td>
                    </tr>
                    <tr className="hover:bg-slate-50 dark:hover:bg-zinc-900/50">
                      <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white">Amazon AWS (AMZN)</td>
                      <td className="py-2.5 px-3 text-emerald-600 dark:text-emerald-400">$142.0B</td>
                      <td className="py-2.5 px-3">$105.0B</td>
                      <td className="py-2.5 px-3 font-bold">$37.0B</td>
                      <td className="py-2.5 px-3">73.9%</td>
                      <td className="py-2.5 px-3"><span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-500 font-bold">AA</span></td>
                    </tr>
                    <tr className="hover:bg-slate-50 dark:hover:bg-zinc-900/50">
                      <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white">Apple (AAPL)</td>
                      <td className="py-2.5 px-3 text-emerald-600 dark:text-emerald-400">$163.0B</td>
                      <td className="py-2.5 px-3">$35.0B</td>
                      <td className="py-2.5 px-3 font-bold">$128.0B</td>
                      <td className="py-2.5 px-3">21.5%</td>
                      <td className="py-2.5 px-3"><span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-500 font-bold">AAA</span></td>
                    </tr>
                    <tr className="bg-slate-100/60 dark:bg-zinc-800/60 font-bold">
                      <td className="py-2.5 px-3 text-slate-900 dark:text-white">Total Hyperscaler Engine</td>
                      <td className="py-2.5 px-3 text-emerald-600 dark:text-emerald-400">$668.1B</td>
                      <td className="py-2.5 px-3">$360.0B</td>
                      <td className="py-2.5 px-3 text-emerald-500">+$308.1B</td>
                      <td className="py-2.5 px-3">53.9% Average</td>
                      <td className="py-2.5 px-3">Fortress Tier</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Telecom Fiber vs GPU Datacenters Deep Dive */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-zinc-900/80 border border-slate-200 dark:border-zinc-800 space-y-2">
              <h4 className="text-xs font-mono font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                The Engineering Truth: Dark Fiber vs. Live GPU Clusters
              </h4>
              <p className="text-xs text-slate-600 dark:text-zinc-300 leading-relaxed font-sans">
                In 2000, laying long-haul fiber optic conduit under roads and oceans was a binary infrastructure bet: once fiber was laid in the ground, it earned zero revenue unless both ends were lit by expensive optical transceivers and consumer broadband demand materialized. Because the average home had a 56k dial-up modem, the bandwidth was utterly unusable, leading to a 95% unlit rate and $2T in asset write-downs.
              </p>
              <p className="text-xs text-slate-600 dark:text-zinc-300 leading-relaxed font-sans pt-1">
                In 2026, GPU clusters are fundamentally modular and dynamic: compute hours are rented by the second to thousands of software enterprises, universities, defense agencies, and internal product teams. GPU capacity is not stranded under asphalt; it is continuously consuming megawatts to generate tokens for 350M+ users daily.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: INTERACTIVE REGIME SIMULATOR */}
      {activeTab === "simulator" && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#121214] space-y-6">
            <div>
              <span className="text-xs font-mono text-indigo-500 font-bold uppercase tracking-wider">
                QUANTITATIVE STRESS TESTING TOOL
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1">
                Interactive Regime Simulator: Dot-Com vs. 2026 AI
              </h2>
              <p className="text-sm text-slate-600 dark:text-zinc-400 mt-2 font-sans leading-relaxed">
                Test the structural mechanics yourself. Switch between historical regime presets or calibrate custom levers for cash flows, private debt, interest rates, and token cost deflation to see real-time shifts in systemic burst probability.
              </p>
            </div>

            {/* Regime Presets */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                onClick={() => setSimRegime("ai2026")}
                className={`p-3.5 rounded-xl border text-left transition-all ${
                  simRegime === "ai2026"
                    ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 shadow-sm"
                    : "bg-slate-50 dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 hover:border-slate-300"
                }`}
              >
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">REGIME 1</span>
                  {simRegime === "ai2026" && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                </div>
                <div className="font-bold text-slate-900 dark:text-white text-sm mt-1">2026 Live Baseline</div>
                <div className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">$668B OCF · 5.10% US10Y · 60× Defl</div>
              </button>

              <button
                onClick={() => setSimRegime("dotcom2000")}
                className={`p-3.5 rounded-xl border text-left transition-all ${
                  simRegime === "dotcom2000"
                    ? "bg-rose-50 dark:bg-rose-950/40 border-rose-500 shadow-sm"
                    : "bg-slate-50 dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 hover:border-slate-300"
                }`}
              >
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="font-bold text-rose-600 dark:text-rose-400">REGIME 2</span>
                  {simRegime === "dotcom2000" && <CheckCircle2 className="w-4 h-4 text-rose-500" />}
                </div>
                <div className="font-bold text-slate-900 dark:text-white text-sm mt-1">2000 Dot-Com Peak</div>
                <div className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">-$15B Burn · 6.50% Rates · Zero ARR</div>
              </button>

              <button
                onClick={() => setSimRegime("creditFreeze")}
                className={`p-3.5 rounded-xl border text-left transition-all ${
                  simRegime === "creditFreeze"
                    ? "bg-amber-50 dark:bg-amber-950/40 border-amber-500 shadow-sm"
                    : "bg-slate-50 dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 hover:border-slate-300"
                }`}
              >
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="font-bold text-amber-600 dark:text-amber-400">REGIME 3</span>
                  {simRegime === "creditFreeze" && <CheckCircle2 className="w-4 h-4 text-amber-500" />}
                </div>
                <div className="font-bold text-slate-900 dark:text-white text-sm mt-1">Neocloud Credit Freeze</div>
                <div className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">Secondary Cloud Default · CDS Spike</div>
              </button>
            </div>

            {/* Live Model Output Display */}
            <div className="p-5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-xs font-mono text-slate-500 dark:text-zinc-400 uppercase font-bold">
                  SIMULATED SYSTEMIC BURST PROBABILITY (12-MONTH HORIZON)
                </span>
                <div className="flex items-baseline space-x-3">
                  <span className={`text-3xl sm:text-4xl font-black font-mono ${simResult.bandColor}`}>
                    {simResult.burstProb}%
                  </span>
                  <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded-full border ${simResult.badgeColor}`}>
                    {simResult.band}
                  </span>
                  <span className="text-xs font-mono text-slate-500">
                    Score: {simResult.score} / 100
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-zinc-300 pt-1 font-sans">
                  {simResult.interpretation}
                </p>
              </div>

              <div className="flex items-center space-x-4 border-t md:border-t-0 md:border-l border-slate-200 dark:border-zinc-800 pt-3 md:pt-0 md:pl-5 text-xs font-mono shrink-0">
                <div>
                  <span className="text-slate-500 text-[10px] block">Merton DD</span>
                  <span className="font-bold text-slate-900 dark:text-white">{simResult.mertonDD}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block">Altman Z&apos;&apos; Zone</span>
                  <span className="font-bold text-slate-900 dark:text-white">{simResult.altmanZone}</span>
                </div>
              </div>
            </div>

            {/* Custom Parameter Sliders */}
            <div className="space-y-4 pt-2">
              <h4 className="text-xs font-mono font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Adjust Custom Macro &amp; Balance Sheet Variables
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Slider 1: Retained FCF */}
                <div className="p-4 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#121214] space-y-2">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-slate-600 dark:text-zinc-300 font-semibold">Hyperscaler Retained FCF Cushion</span>
                    <span className="font-bold text-emerald-500">${customFcf}B / yr</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="400"
                    step="10"
                    value={customFcf}
                    onChange={(e) => setCustomFcf(Number(e.target.value))}
                    className="w-full accent-emerald-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] font-mono text-slate-400">
                    <span>$0 (Zero Buffer)</span>
                    <span>$260B (Current)</span>
                    <span>$400B (High Cash)</span>
                  </div>
                </div>

                {/* Slider 2: Private Tracked Debt */}
                <div className="p-4 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#121214] space-y-2">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-slate-600 dark:text-zinc-300 font-semibold">Tracked Private &amp; Neocloud Debt</span>
                    <span className="font-bold text-amber-500">${customDebt}B</span>
                  </div>
                  <input
                    type="range"
                    min="100"
                    max="500"
                    step="10"
                    value={customDebt}
                    onChange={(e) => setCustomDebt(Number(e.target.value))}
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] font-mono text-slate-400">
                    <span>$100B (Low Debt)</span>
                    <span>$228B (Current)</span>
                    <span>$500B (High Leverage)</span>
                  </div>
                </div>

                {/* Slider 3: US 10-Year Yield */}
                <div className="p-4 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#121214] space-y-2">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-slate-600 dark:text-zinc-300 font-semibold">US 10-Year Treasury Yield</span>
                    <span className="font-bold text-indigo-500">{customYield.toFixed(2)}%</span>
                  </div>
                  <input
                    type="range"
                    min="3.00"
                    max="7.00"
                    step="0.10"
                    value={customYield}
                    onChange={(e) => setCustomYield(Number(e.target.value))}
                    className="w-full accent-indigo-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] font-mono text-slate-400">
                    <span>3.00% (ZIRP-like)</span>
                    <span>5.10% (Live Today)</span>
                    <span>7.00% (1990s Spike)</span>
                  </div>
                </div>

                {/* Slider 4: Token Price Deflation */}
                <div className="p-4 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#121214] space-y-2">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-slate-600 dark:text-zinc-300 font-semibold">Inference Token Cost Deflation</span>
                    <span className="font-bold text-teal-500">{customDeflation}× Cheaper</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="375"
                    step="5"
                    value={customDeflation}
                    onChange={(e) => setCustomDeflation(Number(e.target.value))}
                    className="w-full accent-teal-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] font-mono text-slate-400">
                    <span>1× (GPT-4 2023)</span>
                    <span>60× (Haiku 5.5)</span>
                    <span>375× (DeepSeek Flash)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Institutional Synthesis & Summary Grid */}
      <div className="p-6 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-[#09090b] space-y-4">
        <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
          Institutional Conclusions &amp; Strategic Implications for Capital Allocators
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-600 dark:text-zinc-400 font-sans leading-relaxed">
          <div className="space-y-1.5 p-3.5 rounded-xl bg-white dark:bg-[#121214] border border-slate-200 dark:border-zinc-800">
            <strong className="text-slate-900 dark:text-white font-mono block">
              1. Hyperscalers Are Sovereign Infrastructure Utilities:
            </strong>
            Unlike the dot-com era where tech leaders had fragile balance sheets, Microsoft, Alphabet, Meta, and Amazon can sustain $485B in annual capex indefinitely out of retained operating profits. An equity bear market in AI does not threaten hyperscaler solvency.
          </div>

          <div className="space-y-1.5 p-3.5 rounded-xl bg-white dark:bg-[#121214] border border-slate-200 dark:border-zinc-800">
            <strong className="text-slate-900 dark:text-white font-mono block">
              2. Neoclouds Carry The Credit Risk:
            </strong>
            The vulnerable link in the capital chain is the secondary GPU cloud provider segment. With $228.1B in private and asset-backed credit and 3-year GPU obsolescence, neoclouds that borrowed heavily at 10–12% yields face debt restructuring if software token prices continue collapsing.
          </div>

          <div className="space-y-1.5 p-3.5 rounded-xl bg-white dark:bg-[#121214] border border-slate-200 dark:border-zinc-800">
            <strong className="text-slate-900 dark:text-white font-mono block">
              3. Token Deflation Is The Software Savior:
            </strong>
            In 2000, high telecom transit costs choked internet applications. In 2026, 375× token price deflation is accelerating real enterprise productization. Software application companies enjoy rapid margin expansion as inference costs drop to sub-10¢ per million tokens.
          </div>

          <div className="space-y-1.5 p-3.5 rounded-xl bg-white dark:bg-[#121214] border border-slate-200 dark:border-zinc-800">
            <strong className="text-slate-900 dark:text-white font-mono block">
              4. The Liquidation Outcome:
            </strong>
            If an AI capital correction occurs, it will not result in abandoned datacenters. Rather, Big Tech hyperscalers and sovereign wealth funds will acquire distressed neocloud clusters and private frontier lab assets at 30–50% discounts, further consolidating technological power.
          </div>
        </div>

        {/* Regulatory & Institutional Compliance Disclaimer */}
        <div className="p-4 sm:p-5 rounded-2xl bg-amber-500/5 border border-amber-500/20 text-xs text-slate-600 dark:text-zinc-400 space-y-2">
          <div className="flex items-center space-x-2 text-amber-600 dark:text-amber-400 font-mono font-bold uppercase tracking-wider text-[11px]">
            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
            <span>Regulatory Notice — Not Financial Advice</span>
          </div>
          <p className="leading-relaxed font-sans text-xs text-slate-600 dark:text-zinc-400">
            This historical comparative analysis and risk scorecard are provided strictly for educational and quantitative research purposes. Historical bubble dynamics (1998–2002 Dot-Com vs 2024–2026 Generative AI) are empirical approximations based on disclosed financial statements and do not constitute investment advice, financial planning, or securities endorsement.
          </p>
        </div>

        {/* Quick Cross-Links */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-200 dark:border-zinc-800 text-xs font-mono">
          <div className="flex items-center space-x-4">
            <Link href="/ledger" className="text-emerald-600 dark:text-emerald-400 hover:underline flex items-center space-x-1">
              <span>View 169 Verified Deals ($2.86T)</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
            <Link href="/companies" className="text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white flex items-center space-x-1">
              <span>Corporate Debt Sheets</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
            <Link href="/methodology" className="text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white flex items-center space-x-1">
              <span>Minsky &amp; Merton Math</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <a
            href={POLYMARKET_BASE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline flex items-center space-x-1"
          >
            <span>Trade AI Downturn Odds on Polymarket (r=AIbubble)</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
}
