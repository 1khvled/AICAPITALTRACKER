"use client";

import React, { useState } from "react";
import rawDeals from "@/data/deals.json";
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
import { BarChart3, PieChart, TrendingUp, Layers, X, ChevronRight, Sparkles } from "lucide-react";
import Link from "next/link";

export default function VisualizePage() {
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);

  return (
    <div className="space-y-10">
      {/* Top Sponsored Ad Banner */}
      <AdSlot format="leaderboard" slotId="viz-top-banner" />

      {/* Title */}
      <div className="pb-6 border-b border-slate-200 dark:border-zinc-800">
        <div className="flex items-center space-x-2 text-xs font-mono text-slate-500 dark:text-zinc-400">
          <Link href="/" className="hover:text-slate-900 dark:hover:text-white">Home</Link>
          <span>/</span>
          <span className="text-slate-900 dark:text-white font-semibold">Visual Analytics</span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-1">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
              Visualizing the $2.75T AI Infrastructure Superstructure
            </h1>
            <p className="text-sm text-slate-600 dark:text-zinc-300 font-sans mt-1 max-w-2xl leading-relaxed">
              High-density institutional charts tracking the $237B revenue gap, token price collapse, 
              private multiples, and credit default insurance trajectory.
            </p>
          </div>
          <Link
            href="/ledger"
            className="self-start sm:self-auto flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-semibold bg-slate-900 text-white dark:bg-white dark:text-zinc-950 hover:opacity-90 transition-opacity"
          >
            <span>Open 158-Deal Ledger</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Flagship Feature: Finviz-Style Treemap & Category Bubble Pods */}
      <div className="space-y-2">
        <DealBubbleChart
          deals={rawDeals as Deal[]}
          onSelectDeal={(d) => setSelectedDeal(d)}
        />
      </div>

      {/* 2 Critical Microeconomic Charts: The AI Revenue Gap + Token Price Deflation */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <AiRevenueGapChart />
        <TokenPriceDeflationChart />
      </div>

      {/* Mid-Page In-Feed Sponsored Placement */}
      <AdSlot format="in-feed" slotId="viz-mid-native" />

      {/* Polymarket Prediction Markets Intelligence */}
      <PolymarketCharts />

      {/* Grid of 4 Macroeconomic Risk Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <CapitalCompositionChart />
        <YearlySurgeChart />
        <LabMultiplesChart />
        <CdsTrajectoryChart />
      </div>

      {/* Full-Width Sigmoid Calibration Curve */}
      <SensitivityCurveChart />

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
                <span>View in complete 158-deal ledger</span>
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
