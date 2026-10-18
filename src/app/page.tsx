"use client";

import React, { useState } from "react";
import Link from "next/link";
import rawDeals from "@/data/deals.json";
import { evaluateBubbleModel, DEFAULT_MODEL_INPUTS } from "@/lib/model/engine";
import { MODEL_FACTORS } from "@/lib/model/factors";
import { ProbabilityGauge } from "@/components/ProbabilityGauge";
import { FactorCard } from "@/components/FactorCard";
import { SensitivitySandbox } from "@/components/SensitivitySandbox";
import { DealBubbleChart, Deal } from "@/components/DealBubbleChart";
import {
  SensitivityCurveChart,
  CapitalCompositionChart,
  LabMultiplesChart,
} from "@/components/VisualCharts";
import { AdSlot } from "@/components/AdSlot";
import { PolymarketCharts } from "@/components/PolymarketCharts";
import { LiveStockMonitor } from "@/components/LiveStockMonitor";
import { LiveNewsFeed } from "@/components/LiveNewsFeed";
import { Database, ArrowRight, Layers, BarChart3, X, ChevronRight } from "lucide-react";

export default function HomePage() {
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const result = evaluateBubbleModel(DEFAULT_MODEL_INPUTS);
  const factorMap = new Map(MODEL_FACTORS.map((f) => [f.id, f]));

  return (
    <div className="space-y-10">
      {/* Top Responsive Leaderboard Ad Placement */}
      <AdSlot format="leaderboard" />

      {/* Page Title & Mission */}
      <div className="space-y-3 pb-6 border-b border-slate-200 dark:border-zinc-800">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-xs font-mono text-slate-500 dark:text-zinc-400">
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Verified Research</span>
              <span>•</span>
              <span>159 Sourced Deals</span>
              <span>•</span>
              <span>$2.81T Disclosed</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white tracking-tight mt-1">
              Will the AI Bubble Burst in the Next 12 Months?
            </h1>
            <p className="text-sm sm:text-base text-slate-600 dark:text-zinc-300 font-sans mt-2 max-w-2xl leading-relaxed">
              A transparent, open model that converts verified SEC filings, reported CDS spreads, 
              private lab revenues, and token economics into a single quantifiable probability.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <Link
              href="/visualize"
              className="flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors"
            >
              <BarChart3 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Visual Charts</span>
            </Link>
            <Link
              href="/ledger"
              className="flex items-center space-x-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold bg-slate-900 text-white dark:bg-white dark:text-zinc-950 hover:bg-slate-800 dark:hover:bg-zinc-200 transition-colors shadow-sm"
            >
              <Database className="w-4 h-4" />
              <span>Browse 159 Deals</span>
              <ArrowRight className="w-4 h-4 ml-0.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Main Probability Component */}
      <ProbabilityGauge
        probability={result.burstProbability}
        compositeScore={result.compositeScore}
        band={result.band}
        coverage={result.coverage}
        topDrivers={result.topDriverIds}
        confidenceInterval={result.confidenceInterval}
        fragilityIndex={result.fragilityIndex}
      />

      {/* 4 Executive Pillars - Solid, Clean Surfaces with Top Accents & Bold Typography */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <div className="bg-white dark:bg-[#121214] border border-slate-200 dark:border-zinc-800 border-t-2 border-t-rose-500 rounded-2xl p-5 sm:p-6 space-y-3 transition-all shadow-sm hover:border-slate-300 dark:hover:border-zinc-700 hover:shadow-md">
          <div className="flex items-center justify-between text-xs sm:text-sm">
            <span className="text-rose-600 dark:text-rose-400 font-bold flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500"></span>
              <span className="uppercase tracking-wider">Credit Stress</span>
            </span>
            <span className="font-mono font-bold text-slate-600 dark:text-zinc-400">18% Weight</span>
          </div>
          <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white">
            Oracle CDS at 187 bp
          </h3>
          <p className="text-xs sm:text-sm text-slate-700 dark:text-zinc-300 leading-relaxed font-sans">
            Oracle debt is AI’s primary credit proxy. 5-year CDS default insurance jumped from 81bp to 187bp (+131%), 
            pricing refinancing risk across GPU infrastructure.
          </p>
        </div>

        <div className="bg-white dark:bg-[#121214] border border-slate-200 dark:border-zinc-800 border-t-2 border-t-amber-500 rounded-2xl p-5 sm:p-6 space-y-3 transition-all shadow-sm hover:border-slate-300 dark:hover:border-zinc-700 hover:shadow-md">
          <div className="flex items-center justify-between text-xs sm:text-sm">
            <span className="text-amber-600 dark:text-amber-400 font-bold flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              <span className="uppercase tracking-wider">Valuation Froth</span>
            </span>
            <span className="font-mono font-bold text-slate-600 dark:text-zinc-400">16% Weight</span>
          </div>
          <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white">
            Median Lab P/S: 34.8×
          </h3>
          <p className="text-xs sm:text-sm text-slate-700 dark:text-zinc-300 leading-relaxed font-sans">
            OpenAI ($157B at 42.4×), Anthropic ($65B at 14.1× with $57B in Broadcom &amp; syndicate debt), and Mistral (€21B at &gt;100×) trade at multiples 
            vastly exceeding historical tech bubble peaks.
          </p>
        </div>

        <div className="bg-white dark:bg-[#121214] border border-slate-200 dark:border-zinc-800 border-t-2 border-t-indigo-500 rounded-2xl p-5 sm:p-6 space-y-3 transition-all shadow-sm hover:border-slate-300 dark:hover:border-zinc-700 hover:shadow-md">
          <div className="flex items-center justify-between text-xs sm:text-sm">
            <span className="text-indigo-600 dark:text-indigo-400 font-bold flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
              <span className="uppercase tracking-wider">Macro &amp; US10Y</span>
            </span>
            <span className="font-mono font-bold text-slate-600 dark:text-zinc-400">12% Weight</span>
          </div>
          <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white">
            US10Y: 4.42% • CPI: 2.9%
          </h3>
          <p className="text-xs sm:text-sm text-slate-700 dark:text-zinc-300 leading-relaxed font-sans">
            10-Year Treasury at 4.42% and sticky 2.9% CPI push cost of capital higher. Markets price +25bp rate hike risk, 
            crushing long-duration DCF cash flow horizons.
          </p>
        </div>

        <div className="bg-white dark:bg-[#121214] border border-slate-200 dark:border-zinc-800 border-t-2 border-t-rose-600 rounded-2xl p-5 sm:p-6 space-y-3 transition-all shadow-sm hover:border-slate-300 dark:hover:border-zinc-700 hover:shadow-md">
          <div className="flex items-center justify-between text-xs sm:text-sm">
            <span className="text-rose-600 dark:text-rose-400 font-bold flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-600"></span>
              <span className="uppercase tracking-wider">AI Debt Velocity</span>
            </span>
            <span className="font-mono font-bold text-slate-600 dark:text-zinc-400">14% Weight</span>
          </div>
          <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white">
            $85.0B/yr Debt Pace
          </h3>
          <p className="text-xs sm:text-sm text-slate-700 dark:text-zinc-300 leading-relaxed font-sans">
            $196.8B verified AI debt tracked across 20 facilities (Anthropic, CoreWeave, Vantage, Oracle). Capex consumes 54.8% of hyperscaler operating cash flow with 
            $38.5B/yr in GPU hardware amortization drag.
          </p>
        </div>
      </div>

      {/* Live AI Equities & Bellwether Stocks Feed */}
      <LiveStockMonitor />

      {/* Polymarket Live Crowd Odds & Prediction Charts */}
      <PolymarketCharts />

      {/* Flagship Feature: Institutional Capital Treemap & Visual Universe */}
      <div className="space-y-3">
        <DealBubbleChart
          deals={rawDeals as Deal[]}
          onSelectDeal={(deal) => setSelectedDeal(deal)}
        />
      </div>

      {/* Visual Models Section */}
      <div className="space-y-4 pt-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-slate-200 dark:border-zinc-800">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center space-x-2">
              <BarChart3 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Data Visualizations &amp; Mathematical Curves</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5 font-sans">
              Dynamic visual breakdown of calibration sigmoid curves, capital composition, and frontier lab multiples.
            </p>
          </div>
          <Link
            href="/visualize"
            className="text-xs font-mono text-emerald-600 dark:text-emerald-400 hover:underline flex items-center space-x-1"
          >
            <span>Explore all interactive charts</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2">
            <SensitivityCurveChart currentScore={result.compositeScore} currentProb={result.burstProbability} />
          </div>
          <div>
            <LabMultiplesChart />
          </div>
        </div>

        <div>
          <CapitalCompositionChart />
        </div>
      </div>

      {/* In-Feed Native Ad Slot */}
      <AdSlot format="in-feed" />

      {/* The 8 Factors */}
      <div className="space-y-4 pt-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-slate-200 dark:border-zinc-800">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center space-x-2">
              <Layers className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>The 8-Factor Transparent Recipe</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5 font-sans">
              Every factor is a pure function from verified filings to a 0–1 stress score. No hidden weights.
            </p>
          </div>
          <Link
            href="/methodology"
            className="text-xs font-mono text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white flex items-center space-x-1"
          >
            <span>Read full methodology</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {result.contributions.map((contribution) => {
            const def = factorMap.get(contribution.id);
            return (
              <FactorCard
                key={contribution.id}
                factor={contribution}
                explain={def?.explain || ""}
                formula={def?.formula || ""}
              />
            );
          })}
        </div>
      </div>

      {/* Live AI Breaking News Wire */}
      <LiveNewsFeed />

      {/* Interactive Simulator */}
      <SensitivitySandbox />

      {/* Sourced Deal Ledger Teaser */}
      <div className="bg-white dark:bg-[#121214] border border-slate-200 dark:border-zinc-800 rounded-xl p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 transition-colors shadow-sm">
        <div className="space-y-2 max-w-xl">
          <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
            100% Verified Receipts &amp; Institutional Capital Matrix
          </span>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">
            Inspect All 159 Tracked Deals ($2.81T Total Disclosed)
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-300 leading-relaxed font-sans">
            Every dollar in this model links to a filing or announcement. Visualize timeline volume distributions with 
            our Finviz-style squarified treemap or category bubble pods, and filter by debt facilities, GPU compute contracts, 
            nuclear power off-takes, and circular vendor funding.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-3 w-full md:w-auto">
          <Link
            href="/visualize"
            className="w-full sm:w-auto flex items-center justify-center space-x-2 px-4 py-2.5 rounded-lg text-sm font-semibold border border-slate-300 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900 text-slate-800 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <BarChart3 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Interactive Charts</span>
          </Link>
          <Link
            href="/ledger"
            className="w-full sm:w-auto flex items-center justify-center space-x-2 px-5 py-2.5 rounded-lg text-sm font-semibold bg-slate-900 text-white dark:bg-white dark:text-zinc-950 hover:bg-slate-800 dark:hover:bg-zinc-200 transition-colors shadow-sm"
          >
            <Database className="w-4 h-4" />
            <span>Open Deal Ledger</span>
          </Link>
        </div>
      </div>

      {/* Bottom Leaderboard Ad */}
      <AdSlot format="leaderboard" />

      {/* Deal Details Modal */}
      {selectedDeal && (
        <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#121214] border border-slate-200 dark:border-zinc-800 rounded-xl max-w-xl w-full p-6 space-y-5 shadow-2xl relative">
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
              <h2 className="text-lg font-bold text-slate-900 dark:text-white leading-snug">
                {selectedDeal.title}
              </h2>
              <div className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400 font-tabular pt-1">
                {selectedDeal.amount_display}
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-zinc-300 font-sans leading-relaxed bg-slate-50 dark:bg-zinc-950 p-3.5 rounded-lg border border-slate-100 dark:border-zinc-800/80">
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
