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
} from "lucide-react";
import Link from "next/link";

type TabView = "all" | "multiples" | "gap" | "sensitivity" | "allocation";

export default function VisualizePage() {
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [activeTab, setActiveTab] = useState<TabView>("all");

  const modelResult = evaluateBubbleModel(DEFAULT_MODEL_INPUTS);
  const totalCapUsd = rawDeals.reduce((sum, d) => sum + (d.amount_usd || 0), 0);
  const totalCapT = (totalCapUsd / 1e12).toFixed(2);
  const orclCds = DEFAULT_MODEL_INPUTS.cds?.currentBps ?? 187;

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
            <span className="text-slate-500 dark:text-zinc-400 font-medium">159 Deals Tracked</span>
          </div>
        </div>

        {/* Headline & CTAs */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
          <div className="space-y-1.5 max-w-3xl">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
              Visualizing the $2.81T AI Infrastructure Superstructure
            </h1>
            <p className="text-sm sm:text-base text-slate-600 dark:text-zinc-300 font-sans leading-relaxed">
              Real-time quantitative diagnostics tracking the $237B hyperscaler capex gap, private valuation multiples, 
              credit default swap contagion, and non-linear bubble burst probability.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 sm:self-start lg:self-auto shrink-0">
            <Link
              href="/ledger"
              className="flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-900 text-white dark:bg-white dark:text-zinc-950 hover:opacity-90 transition-opacity shadow-sm"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Open 159-Deal Ledger</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
            <Link
              href="/methodology"
              className="flex items-center space-x-1.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-zinc-800/80 text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-zinc-700 transition-colors"
            >
              <BookOpen className="w-4 h-4" />
              <span>Factor Recipe</span>
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
              ${totalCapT}T
            </div>
            <div className="text-[11px] font-mono text-slate-500 dark:text-zinc-400 truncate">
              {rawDeals.length} verified facilities
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
              <span className="font-bold">+131% Wide</span>
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

      {/* Segmented View Toggles / Filter Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 dark:bg-[#121214] p-1.5 rounded-xl sm:rounded-2xl border border-slate-200 dark:border-zinc-800">
        <div className="flex items-center overflow-x-auto pb-1 max-w-full scrollbar-none gap-1 touch-pan-x sm:flex-wrap">
          <button
            onClick={() => setActiveTab("all")}
            className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold transition-all ${
              activeTab === "all"
                ? "bg-slate-900 text-white dark:bg-zinc-800 dark:text-white shadow-sm"
                : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            All Analytics
          </button>
          <button
            onClick={() => setActiveTab("multiples")}
            className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold transition-all ${
              activeTab === "multiples"
                ? "bg-slate-900 text-white dark:bg-zinc-800 dark:text-white shadow-sm"
                : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            Valuations & Multiples
          </button>
          <button
            onClick={() => setActiveTab("gap")}
            className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold transition-all ${
              activeTab === "gap"
                ? "bg-slate-900 text-white dark:bg-zinc-800 dark:text-white shadow-sm"
                : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            Capex Gap & Deflation
          </button>
          <button
            onClick={() => setActiveTab("sensitivity")}
            className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold transition-all ${
              activeTab === "sensitivity"
                ? "bg-slate-900 text-white dark:bg-zinc-800 dark:text-white shadow-sm"
                : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            Macro & Risk Curves
          </button>
          <button
            onClick={() => setActiveTab("allocation")}
            className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold transition-all ${
              activeTab === "allocation"
                ? "bg-slate-900 text-white dark:bg-zinc-800 dark:text-white shadow-sm"
                : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            Capital Allocation
          </button>
        </div>

        {/* Quick jump navigation indicator */}
        <div className="text-xs font-mono text-slate-500 dark:text-zinc-400 px-3 hidden lg:block">
          {activeTab === "all" ? "Displaying Complete Executive Briefing" : `Filtered View: ${activeTab.toUpperCase()}`}
        </div>
      </div>

      {/* Flagship Feature: Finviz-Style Treemap & Category Bubble Pods */}
      {(activeTab === "all" || activeTab === "allocation") && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Interactive Finviz Treemap & Category Pods
              </h2>
            </div>
            <span className="text-xs font-mono text-slate-500 dark:text-zinc-400">
              Click any node for transaction details
            </span>
          </div>
          <DealBubbleChart
            deals={rawDeals as Deal[]}
            onSelectDeal={(d) => setSelectedDeal(d)}
          />
        </section>
      )}

      {/* Explanatory Callout 1: Multiple Compression Mechanics */}
      {(activeTab === "all" || activeTab === "multiples") && (
        <div className="p-4 sm:p-5 rounded-2xl bg-amber-50/50 dark:bg-amber-950/15 border border-amber-200/80 dark:border-amber-900/50 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start space-x-3.5">
            <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 shrink-0">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h4 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">
                Institutional Analysis: The Mechanics of Multiple Compression
              </h4>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-300 font-sans leading-relaxed max-w-3xl">
                In a 4.5% risk-free rate environment, long-duration cash flows cannot mathematically support 40×–100× P/S ratios without generating near-infinite terminal operating leverage. When public equity markets derate frontier suppliers, private marks face an abrupt 50%–70% valuation compression.
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
      )}

      {/* Valuation Multiples Scatter Plot & Yearly Deployment */}
      {(activeTab === "all" || activeTab === "multiples") && (
        <section className="space-y-6">
          <LabMultiplesChart />
        </section>
      )}

      {/* 2 Critical Microeconomic Charts: The AI Revenue Gap + Token Price Deflation */}
      {(activeTab === "all" || activeTab === "gap") && (
        <section className="space-y-4">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              The Fundamental Capex Gap vs Enterprise Adoption
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <AiRevenueGapChart />
            <TokenPriceDeflationChart />
          </div>
        </section>
      )}

      {/* Mid-Page In-Feed Sponsored Placement */}
      <AdSlot format="in-feed" slotId="viz-mid-native" />

      {/* Explanatory Callout 2: Sigmoid Inflection Zone */}
      {(activeTab === "all" || activeTab === "sensitivity") && (
        <div className="p-4 sm:p-5 rounded-2xl bg-rose-50/50 dark:bg-rose-950/15 border border-rose-200/80 dark:border-rose-900/50 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start space-x-3.5">
            <div className="p-2 rounded-xl bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-400 shrink-0">
              <Activity className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h4 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">
                Decoding the Sensitivity Curve: The Non-Linear Inflection Threshold
              </h4>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-300 font-sans leading-relaxed max-w-3xl">
                The calibration sigmoid function behaves linearly below 50 points, but exhibits convex acceleration once stress breaches 55 points. Because systemic risk compounds multiplicatively through counterparty leverage, an increase in composite stress directly amplifies the burst probability curve. Current model calibration puts composite stress at {modelResult.compositeScore.toFixed(1)} points, yielding a quantifiable 12-month burst probability of {modelResult.burstProbability.toFixed(1)}%.
              </p>
            </div>
          </div>
          <Link
            href="/methodology"
            className="shrink-0 flex items-center space-x-1 text-xs font-mono font-bold text-rose-700 dark:text-rose-400 hover:underline"
          >
            <span>Audit Model Math</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* Full-Width Sigmoid Calibration Curve & CDS Trajectory */}
      {(activeTab === "all" || activeTab === "sensitivity") && (
        <section className="space-y-6">
          <SensitivityCurveChart
            currentScore={modelResult.compositeScore}
            currentProb={modelResult.burstProbability}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <CdsTrajectoryChart />
            <YearlySurgeChart />
          </div>
        </section>
      )}

      {/* Capital Allocation Deep Dive */}
      {(activeTab === "all" || activeTab === "allocation") && (
        <section className="space-y-6">
          <CapitalCompositionChart />
        </section>
      )}

      {/* Polymarket Prediction Markets Intelligence */}
      {(activeTab === "all" || activeTab === "sensitivity") && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Prediction Market Crowdsourced Intelligence (Polymarket)
              </h2>
            </div>
            <span className="text-xs font-mono text-slate-500 dark:text-zinc-400">
              Real-money volume weighting
            </span>
          </div>
          <PolymarketCharts />
        </section>
      )}

      {/* Explanatory Callout 3: Credit Radar & Contagion */}
      {(activeTab === "all" || activeTab === "sensitivity" || activeTab === "multiples") && (
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-[#121214] border border-slate-200 dark:border-zinc-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start space-x-3.5">
            <div className="p-2 rounded-xl bg-slate-200 dark:bg-zinc-800 text-slate-800 dark:text-zinc-200 shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h4 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">
                Credit Markets as the Leading Indicator: The 90-Day Warning Window
              </h4>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-300 font-sans leading-relaxed max-w-3xl">
                Equity investors often ignore balance sheet distress until credit default swaps (CDS) force bond yield re-evaluations. Oracle’s CDS spread widening from 81 bp to 187 bp (+131%) reflects fixed-income market skepticism regarding AI datacenter debt servicing capacity.
              </p>
            </div>
          </div>
          <Link
            href="/ledger?type=debt"
            className="shrink-0 flex items-center space-x-1 text-xs font-mono font-bold text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white hover:underline"
          >
            <span>View $197B Debt Facilities</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
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
                <span>View in complete 159-deal ledger</span>
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
