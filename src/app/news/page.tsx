import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { LiveNewsFeed } from "@/components/LiveNewsFeed";
import { AdSlot } from "@/components/AdSlot";
import {
  Newspaper,
  ArrowRight,
  Database,
  Building2,
  TrendingUp,
  FileText,
  ShieldCheck,
} from "lucide-react";

export const metadata: Metadata = {
  title: "AI Capital & Debt Breaking News Wire — SEC Filings & Credit Dispatches",
  description:
    "Real-time institutional news wire tracking AI debt issuances, hyperscaler GPU purchase commitments, private lab valuation rounds, and regulatory filings from SEC EDGAR, Reuters, Bloomberg, and Dow Jones.",
  alternates: {
    canonical: "/news",
  },
};

export default function NewsPage() {
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
              Breaking News Wire
            </span>
            <span>/</span>
            <span className="text-emerald-600 dark:text-emerald-400">SEC EDGAR &amp; Institutional API</span>
          </nav>

          <div className="flex items-center space-x-2 bg-slate-100 dark:bg-zinc-900/90 px-2.5 py-1 rounded-full border border-slate-200 dark:border-zinc-800 text-[11px]">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-semibold text-slate-700 dark:text-zinc-300">DISPATCHES:</span>
            <span className="text-slate-500 dark:text-zinc-400 font-medium">18 Verified Filings</span>
          </div>
        </div>

        {/* Headline & Quick Summary */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-3xl">
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
              AI Capital, Debt &amp; Infrastructure Breaking News
            </h1>
            <p className="text-sm sm:text-base text-slate-600 dark:text-zinc-300 font-sans leading-relaxed">
              Verified financial news wire tracking cloud credit facilities, convertible bond indentures, 
              GPU infrastructure contracts, nuclear power off-takes, and frontier lab capitalization disclosures.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <Link
              href="/ledger"
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors shadow-xs"
            >
              <Database className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Browse 159 Deals</span>
            </Link>
            <Link
              href="/markets"
              className="flex items-center space-x-1.5 px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold bg-slate-900 text-white dark:bg-white dark:text-zinc-950 hover:bg-slate-800 dark:hover:bg-zinc-200 transition-colors shadow-sm"
            >
              <TrendingUp className="w-4 h-4" />
              <span>Live AI Tickers</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Full-Width Dedicated LiveNewsFeed Component */}
      <section aria-label="Institutional Financial News Wire" className="space-y-4">
        <LiveNewsFeed />
      </section>

      {/* Wire Verification Protocol Note */}
      <div className="p-5 rounded-2xl bg-white dark:bg-[#121214] border border-slate-200 dark:border-zinc-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start space-x-3.5">
          <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">
              Dual-Verification Wire Editorial Policy
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-300 font-sans leading-relaxed max-w-4xl">
              Every dispatch featured on the AI Capital Wire must be supported by official SEC filings (Forms 10-K, 10-Q, 8-K, S-1), 
              verified bank syndicate term sheets, or confirmed announcements from Tier-1 financial desks (Reuters, Bloomberg, Dow Jones). 
              Unverified social rumors and speculative hype are strictly excluded from our credit risk pipeline.
            </p>
          </div>
        </div>
        <Link
          href="/methodology"
          className="shrink-0 flex items-center space-x-1 text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
        >
          <span>Research Methodology</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Bottom Leaderboard Ad */}
      <AdSlot format="leaderboard" />
    </div>
  );
}
