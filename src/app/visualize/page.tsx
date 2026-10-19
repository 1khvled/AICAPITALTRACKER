"use client";

import React, { useState } from "react";
import rawDeals from "@/data/deals.json";
import { evaluateBubbleModel, DEFAULT_MODEL_INPUTS } from "@/lib/model/engine";
import { DealBubbleChart, Deal } from "@/components/DealBubbleChart";
import {
  SensitivityCurveChart,
  AiRevenueGapChart,
  TokenPriceDeflationChart,
  LabMultiplesChart,
  CapitalCompositionChart,
  YearlySurgeChart,
  CdsTrajectoryChart,
} from "@/components/VisualCharts";
import { AdSlot } from "@/components/AdSlot";
import { PolymarketCharts } from "@/components/PolymarketCharts";
import {
  BarChart3,
  PieChart,
  TrendingUp,
  Layers,
  X,
  ChevronRight,
  Sparkles,
  Activity,
  DollarSign,
  AlertTriangle,
  ShieldAlert,
  ArrowUpRight,
  Sliders,
  Filter,
  Info,
  BookOpen,
  ArrowRight,
  Target,
  FileSpreadsheet,
  CircleDot,
  Scale,
  Cpu,
  Flame,
  LineChart,
} from "lucide-react";
import Link from "next/link";

export type VisualTab =
  | "all"
  | "bubble-universe"
  | "sensitivity-sigmoid"
  | "frontier-multiples"
  | "capital-composition"
  | "revenue-gap";

export default function VisualizePage() {
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [activeTab, setActiveTab] = useState<VisualTab>("all");

  const modelResult = evaluateBubbleModel(DEFAULT_MODEL_INPUTS);
  const totalDeals = rawDeals.length;
  const totalDisclosedUsd = rawDeals.reduce((sum, d) => sum + (d.amount_usd || 0), 0);
  const totalDisclosedT = (totalDisclosedUsd / 1e12).toFixed(2);

  const orclCds = DEFAULT_MODEL_INPUTS.cds?.currentBps ?? 187;
  const orclBase = DEFAULT_MODEL_INPUTS.cds?.baselineBps ?? 81;
  const orclStressPct = Math.round(((orclCds - orclBase) / orclBase) * 100);

  const tabs: { id: VisualTab; label: string; icon: React.ReactNode; shortDesc: string }[] = [
    {
      id: "all",
      label: "All Visualizations",
      icon: <Layers className="w-4 h-4" />,
      shortDesc: "Complete Institutional Deck",
    },
    {
      id: "bubble-universe",
      label: "Bubble Universe",
      icon: <CircleDot className="w-4 h-4 text-emerald-500" />,
      shortDesc: "Interactive Deal Physics Map",
    },
    {
      id: "sensitivity-sigmoid",
      label: "Sensitivity Sigmoid",
      icon: <Activity className="w-4 h-4 text-rose-500" />,
      shortDesc: "Non-Linear Stress Response",
    },
    {
      id: "frontier-multiples",
      label: "Frontier Lab Multiples",
      icon: <TrendingUp className="w-4 h-4 text-amber-500" />,
      shortDesc: "Valuations vs Revenues 2D Scatter",
    },
    {
      id: "capital-composition",
      label: "Capital Composition",
      icon: <PieChart className="w-4 h-4 text-blue-500" />,
      shortDesc: "Debt vs Equity Capital Stack",
    },
    {
      id: "revenue-gap",
      label: "Revenue Gap & Capex",
      icon: <Scale className="w-4 h-4 text-rose-400" />,
      shortDesc: "Deficit & Credit Default Spreads",
    },
  ];

  return (
    <div className="space-y-8 sm:space-y-10 pb-12">
      {/* Top Sponsored Ad Banner */}
      <AdSlot format="leaderboard" slotId="viz-top-banner" />

      {/* Hero Header & Breadcrumb */}
      <div className="pb-6 border-b border-slate-200 dark:border-zinc-800 space-y-4">
        {/* Navigation Breadcrumb & Live Marker */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
          <div className="flex items-center space-x-2 text-slate-500 dark:text-zinc-400">
            <Link href="/" className="hover:text-slate-900 dark:hover:text-white transition-colors">
              Home
            </Link>
            <span>/</span>
            <span className="text-slate-900 dark:text-white font-semibold">
              Visual Analytics Suite
            </span>
            <span>/</span>
            <span className="text-emerald-600 dark:text-emerald-400">Institutional Terminal</span>
          </div>

          <div className="flex items-center space-x-2 bg-slate-100 dark:bg-zinc-900/90 px-2.5 py-1 rounded-full border border-slate-200 dark:border-zinc-800 text-[11px]">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-semibold text-slate-700 dark:text-zinc-300">LIVE INTELLIGENCE:</span>
            <span className="text-slate-500 dark:text-zinc-400 font-medium">{totalDeals} Deals Verified</span>
          </div>
        </div>

        {/* Headline & CTAs */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
          <div className="space-y-1.5 max-w-3xl">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
              Visualizing the ${totalDisclosedT}T AI Infrastructure Superstructure
            </h1>
            <p className="text-sm sm:text-base text-slate-600 dark:text-zinc-300 font-sans leading-relaxed">
              Institutional visual diagnostics tracking the $237B hyperscaler capex gap, private valuation multiples, 
              credit default swap contagion, and non-linear bubble burst probability.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 sm:self-start lg:self-auto shrink-0">
            <Link
              href="/ledger"
              className="flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-900 text-white dark:bg-white dark:text-zinc-950 hover:opacity-90 transition-opacity shadow-sm"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Open {totalDeals}-Deal Ledger</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
            <Link
              href="/methodology"
              className="flex items-center space-x-1.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-zinc-800/80 text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-zinc-700 transition-colors"
            >
              <BookOpen className="w-4 h-4" />
              <span>Factor Methodology</span>
            </Link>
          </div>
        </div>

        {/* High-Impact Macroeconomic KPI Metrics Bar */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 pt-2">
          {/* KPI 1: Capital */}
          <div className="p-3.5 rounded-xl bg-white dark:bg-[#121214] border border-slate-200 dark:border-zinc-800 shadow-sm space-y-1">
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 dark:text-zinc-400">
              <span className="uppercase font-semibold">Total Capital</span>
              <span className="text-emerald-500 font-bold">+482% YoY</span>
            </div>
            <div className="text-xl sm:text-2xl font-black font-mono text-slate-900 dark:text-white font-tabular">
              ${totalDisclosedT}T
            </div>
            <div className="text-[11px] font-mono text-slate-500 dark:text-zinc-400 truncate">
              {totalDeals} verified transactions
            </div>
          </div>

          {/* KPI 2: Annual Revenue Gap */}
          <div className="p-3.5 rounded-xl bg-white dark:bg-[#121214] border border-slate-200 dark:border-zinc-800 shadow-sm space-y-1">
            <div className="flex items-center justify-between text-[11px] font-mono text-rose-500 dark:text-rose-400">
              <span className="uppercase font-semibold">Annual Capex Gap</span>
              <span className="font-bold">7.2× Outlay</span>
            </div>
            <div className="text-xl sm:text-2xl font-black font-mono text-rose-600 dark:text-rose-400 font-tabular">
              -$237B
            </div>
            <div className="text-[11px] font-mono text-slate-500 dark:text-zinc-400 truncate">
              $275B Outlay vs $38B Rev
            </div>
          </div>

          {/* KPI 3: Median Valuation Multiple */}
          <div className="p-3.5 rounded-xl bg-white dark:bg-[#121214] border border-slate-200 dark:border-zinc-800 shadow-sm space-y-1">
            <div className="flex items-center justify-between text-[11px] font-mono text-amber-500 dark:text-amber-400">
              <span className="uppercase font-semibold">Median AI Multiple</span>
              <span className="font-bold">vs 10× SaaS</span>
            </div>
            <div className="text-xl sm:text-2xl font-black font-mono text-amber-500 font-tabular">
              34.8× P/S
            </div>
            <div className="text-[11px] font-mono text-slate-500 dark:text-zinc-400 truncate">
              Frontier lab equity stretch
            </div>
          </div>

          {/* KPI 4: Oracle CDS Spread */}
          <div className="p-3.5 rounded-xl bg-white dark:bg-[#121214] border border-slate-200 dark:border-zinc-800 shadow-sm space-y-1">
            <div className="flex items-center justify-between text-[11px] font-mono text-rose-500 dark:text-rose-400">
              <span className="uppercase font-semibold">Oracle 5Y CDS</span>
              <span className="font-bold">+{orclStressPct}% Wide</span>
            </div>
            <div className="text-xl sm:text-2xl font-black font-mono text-rose-600 dark:text-rose-400 font-tabular">
              {orclCds} bp
            </div>
            <div className="text-[11px] font-mono text-slate-500 dark:text-zinc-400 truncate">
              Anchor debt insurance cost
            </div>
          </div>

          {/* KPI 5: Burst Probability */}
          <div className="p-3.5 rounded-xl bg-white dark:bg-[#121214] border border-slate-200 dark:border-zinc-800 shadow-sm space-y-1 col-span-2 md:col-span-1">
            <div className="flex items-center justify-between text-[11px] font-mono text-rose-500 dark:text-rose-400">
              <span className="uppercase font-semibold">Burst Probability</span>
              <span className="font-bold">S={modelResult.compositeScore.toFixed(1)} pts</span>
            </div>
            <div className="text-xl sm:text-2xl font-black font-mono text-rose-600 dark:text-rose-400 font-tabular">
              {modelResult.burstProbability.toFixed(1)}%
            </div>
            <div className="text-[11px] font-mono text-slate-500 dark:text-zinc-400 truncate">
              {modelResult.band.toUpperCase()} stress regime
            </div>
          </div>
        </div>
      </div>

      {/* Segmented View Toggles / Dedicated Visualization Tabs */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 dark:bg-[#121214] p-1.5 rounded-xl sm:rounded-2xl border border-slate-200 dark:border-zinc-800">
          <div className="flex items-center overflow-x-auto pb-1 max-w-full scrollbar-none gap-1 touch-pan-x sm:flex-wrap">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-mono font-bold whitespace-nowrap transition-all ${
                    isActive
                      ? "bg-slate-900 text-white dark:bg-zinc-800 dark:text-white shadow-sm"
                      : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800/50"
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          <div className="text-xs font-mono text-slate-500 dark:text-zinc-400 px-3 hidden lg:flex items-center space-x-1.5 shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>
              {tabs.find((t) => t.id === activeTab)?.shortDesc}
            </span>
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 1. BUBBLE UNIVERSE: Interactive DealBubbleChart Physics Map          */}
      {/* ==================================================================== */}
      {(activeTab === "all" || activeTab === "bubble-universe") && (
        <section id="bubble-universe" className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1 border-b border-slate-100 dark:border-zinc-800/80">
            <div className="flex items-center space-x-2">
              <CircleDot className="w-5 h-5 text-emerald-500" />
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                Bubble Universe: Interactive Deal Physics Map &amp; Treemap
              </h2>
            </div>
            <span className="text-xs font-mono text-slate-500 dark:text-zinc-400">
              {totalDeals} Sourced Deals • Finviz-Grade Category Pods
            </span>
          </div>

          {/* Institutional Interpretation Callout for Bubble Universe */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-[#121214] border border-slate-200 dark:border-zinc-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start space-x-3.5">
              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
                <Target className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="text-[11px] font-mono font-bold tracking-wider uppercase text-emerald-600 dark:text-emerald-400">
                    HEDGE FUND &amp; VENTURE RISK ANALYSIS
                  </span>
                  <span className="text-xs text-slate-400">• Counterparty Geometry</span>
                </div>
                <h4 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">
                  How Portfolio Desks Read the Deal Universe Map
                </h4>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-300 font-sans leading-relaxed max-w-4xl">
                  Analysts examine cluster density and counterparty concentration: the top 10 deals command <strong>66.5%</strong> of the total $2.81T volume. 
                  When bubble pods group around vendor-financed take-or-pay capacity agreements (CoreWeave, Oracle, Crusoe), it signals circular capital loops 
                  where equity froth is converting into debt service obligations.
                </p>
              </div>
            </div>
            <Link
              href="/ledger"
              className="shrink-0 flex items-center space-x-1 text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
            >
              <span>Audit Raw Deal Ledger</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Interactive Physics / Treemap / Timeline Chart */}
          <DealBubbleChart
            deals={rawDeals as Deal[]}
            onSelectDeal={(d) => setSelectedDeal(d)}
          />
        </section>
      )}

      {/* ==================================================================== */}
      {/* 2. SENSITIVITY SIGMOID: Non-Linear Mathematical Response             */}
      {/* ==================================================================== */}
      {(activeTab === "all" || activeTab === "sensitivity-sigmoid") && (
        <section id="sensitivity-sigmoid" className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1 border-b border-slate-100 dark:border-zinc-800/80">
            <div className="flex items-center space-x-2">
              <Activity className="w-5 h-5 text-rose-500" />
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                Sensitivity Sigmoid: Non-Linear Fragility &amp; Confidence Bands
              </h2>
            </div>
            <span className="text-xs font-mono text-slate-500 dark:text-zinc-400">
              Continuous Cubic Bézier • 90% Confidence Corridor
            </span>
          </div>

          {/* Institutional Interpretation Callout for Sigmoid Curve */}
          <div className="p-4 sm:p-5 rounded-2xl bg-rose-50/50 dark:bg-rose-950/15 border border-rose-200/80 dark:border-rose-900/50 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start space-x-3.5">
              <div className="p-2.5 rounded-xl bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-400 shrink-0">
                <Activity className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="text-[11px] font-mono font-bold tracking-wider uppercase text-rose-600 dark:text-rose-400">
                    QUANTITATIVE RISK MANAGEMENT
                  </span>
                  <span className="text-xs text-slate-400">• Convex Inflection Physics</span>
                </div>
                <h4 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">
                  Why Risk Compounds Multiplicatively Past 55 Points
                </h4>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-300 font-sans leading-relaxed max-w-4xl">
                  Linear models fail in financial super-cycles because debt refinancing fragility accelerates non-linearly. Below 50 points, liquidity absorbs shocks smoothly. 
                  Beyond the 55-point Kelly anchor, probability spikes hyperbolically (moving from 55 to 61.2 points vaults probability from 50.0% to 68.4%). 
                  Quantitative desks use first derivative dP/dS to dynamically ramp tail-risk hedge ratios before markets re-price credit illiquidity.
                </p>
              </div>
            </div>
            <Link
              href="/methodology#sigmoid"
              className="shrink-0 flex items-center space-x-1 text-xs font-mono font-bold text-rose-700 dark:text-rose-400 hover:underline"
            >
              <span>Read Model Math</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Upgraded Cubic Bezier Sensitivity Chart */}
          <SensitivityCurveChart
            currentScore={modelResult.compositeScore}
            currentProb={modelResult.burstProbability}
          />
        </section>
      )}

      {/* ==================================================================== */}
      {/* 3. FRONTIER LAB MULTIPLES: 2D Valuation vs Revenue Scatter Plot      */}
      {/* ==================================================================== */}
      {(activeTab === "all" || activeTab === "frontier-multiples") && (
        <section id="frontier-multiples" className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1 border-b border-slate-100 dark:border-zinc-800/80">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-amber-500" />
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                Frontier Lab Multiples: Valuation vs Run-Rate Revenue (2D Scatter)
              </h2>
            </div>
            <span className="text-xs font-mono text-slate-500 dark:text-zinc-400">
              Log-Log &amp; Linear Projections • Benchmark Regression Lines
            </span>
          </div>

          {/* Institutional Interpretation Callout for Multiples */}
          <div className="p-4 sm:p-5 rounded-2xl bg-amber-50/50 dark:bg-amber-950/15 border border-amber-200/80 dark:border-amber-900/50 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start space-x-3.5">
              <div className="p-2.5 rounded-xl bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 shrink-0">
                <Scale className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="text-[11px] font-mono font-bold tracking-wider uppercase text-amber-700 dark:text-amber-400">
                    LONG/SHORT EQUITY &amp; GROWTH INVESTORS
                  </span>
                  <span className="text-xs text-slate-400">• Multiple Compression</span>
                </div>
                <h4 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">
                  The Impossibility of Sustaining 30×+ P/S at a 5.1% Risk-Free Rate
                </h4>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-300 font-sans leading-relaxed max-w-4xl">
                  Frontier labs trade at a 27.5× median P/S multiple (with labs like Perplexity at 60× and Mistral at 31.4×). Even with OpenAI scaling to $20.0B ARR and Anthropic to $11.5B ARR, justifying these valuations 
                  without massive multiple contraction toward the 10× historical SaaS equilibrium requires continuous hypergrowth. 
                  In a 5.10% US10Y regime, tech cash flows face severe duration discount penalties whenever growth deceleration hits.
                </p>
              </div>
            </div>
            <Link
              href="/compare"
              className="shrink-0 flex items-center space-x-1 text-xs font-mono font-bold text-amber-700 dark:text-amber-400 hover:underline"
            >
              <span>Compare 2000 vs 2026</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Upgraded 2D Scatter Plot */}
          <LabMultiplesChart />
        </section>
      )}

      {/* Mid-Page In-Feed Sponsored Placement */}
      <AdSlot format="in-feed" slotId="viz-mid-native" />

      {/* ==================================================================== */}
      {/* 4. CAPITAL COMPOSITION: Stacked Allocation & Creditor Claims         */}
      {/* ==================================================================== */}
      {(activeTab === "all" || activeTab === "capital-composition") && (
        <section id="capital-composition" className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1 border-b border-slate-100 dark:border-zinc-800/80">
            <div className="flex items-center space-x-2">
              <PieChart className="w-5 h-5 text-blue-500" />
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                Capital Composition: Debt vs Equity in the $2.81T Superstructure
              </h2>
            </div>
            <span className="text-xs font-mono text-slate-500 dark:text-zinc-400">
              Interactive Proportional Stack • Capital Stack Seniority
            </span>
          </div>

          {/* Institutional Interpretation Callout for Capital Composition */}
          <div className="p-4 sm:p-5 rounded-2xl bg-blue-50/50 dark:bg-blue-950/15 border border-blue-200/80 dark:border-blue-900/50 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start space-x-3.5">
              <div className="p-2.5 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 shrink-0">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="text-[11px] font-mono font-bold tracking-wider uppercase text-blue-700 dark:text-blue-400">
                    CREDIT RATING AGENCIES &amp; DISTRESSED DEBT
                  </span>
                  <span className="text-xs text-slate-400">• Capital Stack Seniority</span>
                </div>
                <h4 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">
                  Senior Creditor Claims vs First-Loss Equity Cushions
                </h4>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-300 font-sans leading-relaxed max-w-4xl">
                  Credit desks partition the $2.81T stack into two regimes: $534B in venture equity acts as loss-absorbing cushion, but the $197B in borrowed debt 
                  (Broadcom, Blackstone, CoreWeave) and $712B in take-or-pay compute leases carry rigid cash interest and delivery penalties. 
                  When debt share crosses 7% during an era of 5% terminal rates, default cascades can be triggered even while models remain technically impressive.
                </p>
              </div>
            </div>
            <Link
              href="/ledger?type=debt"
              className="shrink-0 flex items-center space-x-1 text-xs font-mono font-bold text-blue-700 dark:text-blue-400 hover:underline"
            >
              <span>Inspect $197B Debt Facilities</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Upgraded Stacked Distribution Bar & Category Grid */}
          <CapitalCompositionChart />
        </section>
      )}

      {/* ==================================================================== */}
      {/* 5. REVENUE GAP & CAPEX: Deficit, CDS Spreads & Token Collapse        */}
      {/* ==================================================================== */}
      {(activeTab === "all" || activeTab === "revenue-gap") && (
        <section id="revenue-gap" className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1 border-b border-slate-100 dark:border-zinc-800/80">
            <div className="flex items-center space-x-2">
              <Scale className="w-5 h-5 text-rose-500" />
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                Revenue Gap, Credit Default Swaps &amp; Token Price Deflation
              </h2>
            </div>
            <span className="text-xs font-mono text-slate-500 dark:text-zinc-400">
              -$237B Deficit • 187 bp Oracle CDS • -99.5% Inference Cost
            </span>
          </div>

          {/* Institutional Interpretation Callout for Revenue Gap & CDS */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-[#121214] border border-slate-200 dark:border-zinc-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start space-x-3.5">
              <div className="p-2.5 rounded-xl bg-rose-100 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400 shrink-0">
                <Flame className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="text-[11px] font-mono font-bold tracking-wider uppercase text-rose-600 dark:text-rose-400">
                    MACRO CREDIT STRATEGISTS
                  </span>
                  <span className="text-xs text-slate-400">• The 90-Day Warning Window</span>
                </div>
                <h4 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">
                  Why Credit Default Swaps Precede Equity Deratings
                </h4>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-300 font-sans leading-relaxed max-w-4xl">
                  With hyperscalers spending $7.20 on compute infrastructure for every $1.00 of end-user software ARR, the $237B net cash deficit is sustained 
                  by Big Tech balance sheets. Bond investors re-price first: Oracle 5Y CDS widening +131% (from 81 bp to 187 bp) signals credit market skepticism. 
                  In both 2000 and 2008, credit widening preceded stock market contractions by 3 to 6 months. Conversely, token price collapse (-99.5%) 
                  acts as a critical economic damper that accelerates real-world utility.
                </p>
              </div>
            </div>
            <Link
              href="/companies"
              className="shrink-0 flex items-center space-x-1 text-xs font-mono font-bold text-rose-600 dark:text-rose-400 hover:underline"
            >
              <span>Examine Oracle CDS History</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Grid of Microeconomic Charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <AiRevenueGapChart />
            <TokenPriceDeflationChart />
          </div>

          {/* Credit Radar & Velocity Surge */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <CdsTrajectoryChart />
            <YearlySurgeChart />
          </div>
        </section>
      )}

      {/* Polymarket Prediction Markets Intelligence */}
      {(activeTab === "all" || activeTab === "sensitivity-sigmoid") && (
        <section className="space-y-3 pt-4 border-t border-slate-200 dark:border-zinc-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Prediction Market Crowdsourced Intelligence (Polymarket)
              </h2>
            </div>
            <span className="text-xs font-mono text-slate-500 dark:text-zinc-400">
              Real-Money Volume Weighted Odds
            </span>
          </div>
          <PolymarketCharts />
        </section>
      )}

      {/* Deal Details Modal */}
      {selectedDeal && (
        <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#121214] border border-slate-200 dark:border-zinc-800 rounded-2xl max-w-xl w-full p-6 space-y-5 shadow-2xl relative">
            <button
              onClick={() => setSelectedDeal(null)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-900 dark:hover:text-white p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1.5">
              <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300">
                {selectedDeal.category}
              </span>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white leading-snug">
                {selectedDeal.title}
              </h2>
              <div className="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400 font-tabular pt-1">
                {selectedDeal.amount_display}
              </div>
            </div>

            <p className="text-sm text-slate-700 dark:text-zinc-200 font-sans leading-relaxed bg-slate-50 dark:bg-zinc-950 p-4 rounded-xl border border-slate-100 dark:border-zinc-800/80">
              {selectedDeal.description}
            </p>

            <div className="flex items-center justify-between pt-2">
              <Link
                href={`/ledger?search=${encodeURIComponent(selectedDeal.title)}`}
                className="text-xs font-mono text-emerald-600 dark:text-emerald-400 hover:underline flex items-center space-x-1"
              >
                <span>View in complete {totalDeals}-deal ledger</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
              <button
                onClick={() => setSelectedDeal(null)}
                className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 dark:bg-white text-white dark:text-zinc-950"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
