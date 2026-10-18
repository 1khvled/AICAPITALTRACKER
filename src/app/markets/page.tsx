import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { LiveStockMonitor } from "@/components/LiveStockMonitor";
import { PolymarketCharts } from "@/components/PolymarketCharts";
import { AdSlot } from "@/components/AdSlot";
import {
  TrendingUp,
  Activity,
  ArrowLeft,
  ArrowRight,
  ShieldAlert,
  BarChart2,
  Database,
  Building2,
  ExternalLink,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Live Markets & AI Debt Tickers — Real-Time Rates, CDS & Equities",
  description:
    "Institutional financial monitor tracking public AI bellwethers (NVDA, ORCL, MSFT), US Treasury benchmark yields (US10Y, US02Y), credit default swaps, and annual AI debt issuance pace.",
  alternates: {
    canonical: "/markets",
  },
};

export default function MarketsPage() {
  return (
    <div className="space-y-8 sm:space-y-10 pb-12">
      {/* Top Sponsored Ad Banner */}
      <AdSlot format="leaderboard" />

      {/* Hero Header & Breadcrumb */}
      <div className="pb-6 border-b border-slate-200 dark:border-zinc-800 space-y-4">
        {/* Navigation Breadcrumb */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
          <nav aria-label="Breadcrumb" className="flex items-center space-x-2 text-slate-500 dark:text-zinc-400">
            <Link href="/" className="hover:text-slate-900 dark:hover:text-white transition-colors">
              Home
            </Link>
            <span>/</span>
            <span className="text-slate-900 dark:text-white font-semibold">
              Live Markets &amp; Debt Monitor
            </span>
            <span>/</span>
            <span className="text-emerald-600 dark:text-emerald-400">Institutional Terminal</span>
          </nav>

          <div className="flex items-center space-x-2 bg-slate-100 dark:bg-zinc-900/90 px-2.5 py-1 rounded-full border border-slate-200 dark:border-zinc-800 text-[11px]">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-semibold text-slate-700 dark:text-zinc-300">STREAMING:</span>
            <span className="text-slate-500 dark:text-zinc-400 font-medium">11 Equities • 6 Macro Benchmarks</span>
          </div>
        </div>

        {/* Headline & Quick Summary */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-3xl">
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
              Live AI Equities, Debt Velocity &amp; Macro Rates Monitor
            </h1>
            <p className="text-sm sm:text-base text-slate-600 dark:text-zinc-300 font-sans leading-relaxed">
              Consolidated institutional tape monitoring public AI bellwethers (NVDA, ORCL, MSFT), 10-Year Treasury hurdle yields, 
              Oracle 5Y credit default swap (CDS) spreads, and High Yield OAS spreads.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <Link
              href="/companies"
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors shadow-xs"
            >
              <Building2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Corporate Debt Sheets</span>
            </Link>
            <Link
              href="/ledger?filter=debt"
              className="flex items-center space-x-1.5 px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold bg-slate-900 text-white dark:bg-white dark:text-zinc-950 hover:bg-slate-800 dark:hover:bg-zinc-200 transition-colors shadow-sm"
            >
              <Database className="w-4 h-4" />
              <span>$197B Debt Facilities</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Full-Width Dedicated LiveStockMonitor Component */}
      <section aria-label="Consolidated Financial Terminal" className="space-y-4">
        <LiveStockMonitor />
      </section>

      {/* Real-Money Prediction Market Crowds (Polymarket) */}
      <section aria-label="Polymarket Prediction Contracts" className="space-y-4 pt-4 border-t border-slate-200 dark:border-zinc-800">
        <PolymarketCharts />
      </section>

      {/* Institutional Explanatory Callouts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-[#121214] border border-slate-200 dark:border-zinc-800 space-y-2.5">
          <div className="flex items-center space-x-2 text-rose-600 dark:text-rose-400">
            <ShieldAlert className="w-4 h-4" />
            <h3 className="font-bold text-sm uppercase tracking-wider font-mono">
              The Oracle CDS Leading Indicator
            </h3>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-300 font-sans leading-relaxed">
            Equity markets often price short-term GPU order backlogs while ignoring balance sheet leverage. 
            Oracle’s 5-year CDS spread surging +131% (from 81 bp baseline to 187 bp) signals that credit markets are already pricing 
            refinancing resistance on long-duration datacenter debt notes. Historically, fixed-income widening leads equity repricing by 3 to 6 months.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-[#121214] border border-slate-200 dark:border-zinc-800 space-y-2.5">
          <div className="flex items-center space-x-2 text-indigo-600 dark:text-indigo-400">
            <BarChart2 className="w-4 h-4" />
            <h3 className="font-bold text-sm uppercase tracking-wider font-mono">
              Cost of Capital &amp; Long-Duration Hurdle Rates
            </h3>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-300 font-sans leading-relaxed">
            With the US 10-Year Treasury hovering around 5.10% and headline CPI at 2.9%, hurdle rates for frontier AI buildouts 
            remain elevated. Every 50 basis points of rate tightening increases annual interest expense across tracked debt facilities by ~$1.2B, 
            disproportionately impacting pre-revenue compute startups and asset-heavy datacenters.
          </p>
        </div>
      </div>

      {/* Bottom Leaderboard Ad */}
      <AdSlot format="leaderboard" />
    </div>
  );
}
