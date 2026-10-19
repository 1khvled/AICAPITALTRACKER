import React from "react";
import Link from "next/link";
import rawDeals from "@/data/deals.json";
import { evaluateBubbleModel, DEFAULT_MODEL_INPUTS } from "@/lib/model/engine";
import { ProbabilityGauge } from "@/components/ProbabilityGauge";
import { AdSlot } from "@/components/AdSlot";
import {
  Database,
  ArrowRight,
  BarChart3,
  Layers,
  Sliders,
  Building2,
  ShieldCheck,
  TrendingUp,
  FileSpreadsheet,
  Newspaper,
  ArrowUpRight,
  ExternalLink,
  Sparkles,
} from "lucide-react";

export default function HomePage() {
  const result = evaluateBubbleModel(DEFAULT_MODEL_INPUTS);

  const totalDeals = rawDeals.length;
  const totalDisclosedUsd = rawDeals.reduce((sum, d) => sum + (d.amount_usd || 0), 0);
  const totalDisclosedT = (totalDisclosedUsd / 1e12).toFixed(2);

  const orclCds = DEFAULT_MODEL_INPUTS.cds?.currentBps ?? 187;
  const orclBase = DEFAULT_MODEL_INPUTS.cds?.baselineBps ?? 81;
  const orclStressPct = Math.round(((orclCds - orclBase) / orclBase) * 100);

  const us10y = DEFAULT_MODEL_INPUTS.macro?.us10yYieldPct ?? 5.10;
  const cpi = DEFAULT_MODEL_INPUTS.macro?.cpiInflationYoY ?? 2.9;
  const annualDebtB = DEFAULT_MODEL_INPUTS.aiDebt?.annualDebtIssuanceUsd
    ? (DEFAULT_MODEL_INPUTS.aiDebt.annualDebtIssuanceUsd / 1e9).toFixed(1)
    : "85.0";
  const totalDebtB = DEFAULT_MODEL_INPUTS.aiDebt?.totalTrackedDebtUsd
    ? (DEFAULT_MODEL_INPUTS.aiDebt.totalTrackedDebtUsd / 1e9).toFixed(1)
    : "196.8";

  return (
    <div className="space-y-8 sm:space-y-10">
      {/* ── 1. TOP LEADERBOARD AD ────────────────────────────────────────────── */}
      <AdSlot format="leaderboard" />

      {/* ── 2. HERO HEADER & QUICK NAVIGATION ─────────────────────────────────── */}
      <div className="space-y-4 pb-6 border-b border-slate-200 dark:border-zinc-800">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-2 max-w-3xl">
            {/* Trust Markers */}
            <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-slate-500 dark:text-zinc-400">
              <span className="inline-flex items-center text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-900/60">
                <ShieldCheck className="w-3.5 h-3.5 mr-1" />
                Verified Credit Research
              </span>
              <span>•</span>
              <span className="font-semibold text-slate-800 dark:text-zinc-200">{totalDeals} Sourced Deals</span>
              <span>•</span>
              <span className="font-semibold text-slate-800 dark:text-zinc-200">${totalDisclosedT}T Disclosed</span>
              <span>•</span>
              <span className="font-semibold text-rose-600 dark:text-rose-400">${totalDebtB}B Debt Tracked</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
              Will the AI Bubble Burst in the Next 12 Months?
            </h1>

            <p className="text-sm sm:text-base text-slate-600 dark:text-zinc-300 font-sans leading-relaxed">
              A transparent, real-world tracker showing whether the AI boom is supported by real business profits — or borrowing and hype getting ahead of reality. Plain English, live financial receipts, and zero corporate spin.
            </p>
          </div>

          {/* Quick Action Navigation Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              href="/visualize"
              className="flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors shadow-xs"
            >
              <BarChart3 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Visual Analytics</span>
            </Link>
            <Link
              href="/ledger"
              className="flex items-center space-x-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold bg-slate-900 text-white dark:bg-white dark:text-zinc-950 hover:bg-slate-800 dark:hover:bg-zinc-200 transition-colors shadow-sm"
            >
              <Database className="w-4 h-4" />
              <span>{totalDeals} Deals</span>
              <ArrowRight className="w-4 h-4 ml-0.5" />
            </Link>
          </div>
        </div>

        {/* Quick Filter Jump Bar */}
        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs font-mono">
          <span className="text-slate-500 dark:text-zinc-500 font-bold uppercase tracking-wider text-[11px]">
            Direct Portals:
          </span>
          <Link
            href="/markets"
            className="px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800/80 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 transition-colors"
          >
            Live Markets &amp; Tickers
          </Link>
          <Link
            href="/news"
            className="px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800/80 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 transition-colors"
          >
            Breaking News Wire
          </Link>
          <Link
            href="/ledger?filter=debt"
            className="px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800/80 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 transition-colors"
          >
            Debt Only (${totalDebtB}B)
          </Link>
          <Link
            href="/companies"
            className="px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800/80 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 transition-colors"
          >
            Corporate Debt Profiles
          </Link>
          <Link
            href="/sandbox"
            className="px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800/80 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 transition-colors"
          >
            Macro Sensitivity Sandbox
          </Link>
          <Link
            href="/methodology"
            className="px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800/80 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 transition-colors"
          >
            8-Factor Recipe &amp; Formulas
          </Link>
        </div>

        {/* ── 2.5 PLAIN ENGLISH 60-SECOND CRASH COURSE (Collapsed by default) ── */}
        <div className="pt-1">
          <details className="group border border-amber-500/20 rounded-xl bg-amber-500/5 hover:bg-amber-500/10 transition-colors">
            <summary className="p-2.5 sm:px-3.5 cursor-pointer flex items-center justify-between text-xs font-bold text-amber-900 dark:text-amber-200 select-none list-none [&::-webkit-details-marker]:hidden">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span>🎓 New here? 60-Second Plain English Guide (No Finance Degree Required)</span>
              </div>
              <span className="font-mono text-[11px] text-amber-600 dark:text-amber-400 group-open:rotate-180 transition-transform">▾</span>
            </summary>
            <div className="p-3.5 sm:p-4 border-t border-amber-500/15">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-white/90 dark:bg-[#121214]/90 border border-slate-200/80 dark:border-zinc-800 space-y-1">
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center space-x-1.5">
                    <span>🛡️ 1. Big Tech is not going broke</span>
                  </span>
                  <p className="text-slate-600 dark:text-zinc-300 font-sans leading-relaxed text-[11px]">
                    Microsoft, Google, Apple, and Meta generate over <strong>$414 billion</strong> in operating cash flow every year ($315B+ net accounting profits). Unlike the 2000 Dot-Com crash, Big Tech has fortress balance sheets with plenty of real cash to survive.
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-white/90 dark:bg-[#121214]/90 border border-slate-200/80 dark:border-zinc-800 space-y-1">
                  <span className="font-bold text-rose-600 dark:text-rose-400 flex items-center space-x-1.5">
                    <span>⚠️ 2. The risk is borrowed loans &amp; hype</span>
                  </span>
                  <p className="text-slate-600 dark:text-zinc-300 font-sans leading-relaxed text-[11px]">
                    Over <strong>$196 billion</strong> of new AI data centers are built on borrowed debt. If outside businesses don&apos;t spend huge money on AI tools, that debt becomes hard to pay back.
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-white/90 dark:bg-[#121214]/90 border border-slate-200/80 dark:border-zinc-800 space-y-1">
                  <span className="font-bold text-blue-600 dark:text-blue-400 flex items-center space-x-1.5">
                    <span>📉 3. AI is getting 25× cheaper to run</span>
                  </span>
                  <p className="text-slate-600 dark:text-zinc-300 font-sans leading-relaxed text-[11px]">
                    The silver lining: AI computing costs are crashing fast. When AI is cheap like tap water, normal businesses can afford it, creating real profits that prevent a crash.
                  </p>
                </div>
              </div>
            </div>
          </details>
        </div>
      </div>

      {/* ── 3. FLAGSHIP PROBABILITY CALCULATOR & POLYMARKET COMPARISON ───────── */}
      <ProbabilityGauge
        probability={result.burstProbability}
        compositeScore={result.compositeScore}
        band={result.band}
        coverage={result.coverage}
        topDrivers={result.topDriverIds}
        confidenceInterval={result.confidenceInterval}
        fragilityIndex={result.fragilityIndex}
        contributions={result.contributions}
        initialInputs={DEFAULT_MODEL_INPUTS}
      />

      {/* ── 4. 4 EXECUTIVE DIAGNOSTIC PILLARS ─────────────────────────────────── */}
      <section aria-labelledby="executive-pillars-heading" className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 pb-1">
          <h2 id="executive-pillars-heading" className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Executive Diagnostic Pillars: Credit Stress, Valuation Multiples &amp; Macro Liquidity
          </h2>
          <span className="text-xs font-mono text-slate-500 dark:text-zinc-400">
            Weighted Structural Risk Components
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {/* Pillar 1: Credit Stress */}
          <div className="bg-white dark:bg-[#121214] border border-slate-200 dark:border-zinc-800 border-t-2 border-t-rose-500 rounded-2xl p-5 sm:p-6 space-y-3 transition-all shadow-sm hover:border-slate-300 dark:hover:border-zinc-700 hover:shadow-md flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs sm:text-sm">
                <span className="text-rose-600 dark:text-rose-400 font-bold flex items-center space-x-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  <span className="uppercase tracking-wider">Credit Stress</span>
                </span>
                <span className="font-mono font-bold text-slate-600 dark:text-zinc-400">18% Weight</span>
              </div>
              <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white">
                Oracle CDS at {orclCds} bp
              </h3>
              <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed font-sans">
                Oracle senior notes serve as AI&apos;s primary credit proxy. 5-year CDS default insurance trades at {orclCds}bp, pricing refinancing risk across GPU datacenter loans.
              </p>
              <details className="group">
                <summary className="list-none [&::-webkit-details-marker]:hidden cursor-pointer inline-flex items-center space-x-1 font-mono text-[11px] font-bold text-rose-600/80 hover:text-rose-600 dark:text-rose-400/80 dark:hover:text-rose-400 transition-colors py-0.5">
                  <Sparkles className="w-3 h-3 text-rose-500 shrink-0" />
                  <span>💡 Plain English</span>
                  <span className="text-[10px] group-open:rotate-180 transition-transform">▾</span>
                </summary>
                <div className="mt-1.5 p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200/80 dark:border-rose-900/50 text-[11px] font-sans text-rose-900 dark:text-rose-200 leading-relaxed">
                  <strong>In plain English:</strong> The insurance price against an AI datacenter loan default jumped {orclStressPct}%. Bond investors are quietly charging higher safety premiums.
                </div>
              </details>
            </div>
            <Link
              href="/companies"
              className="pt-2 text-xs font-mono font-semibold text-rose-600 dark:text-rose-400 hover:underline flex items-center space-x-1"
            >
              <span>Inspect Oracle &amp; peer debt</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {/* Pillar 2: Valuation Froth */}
          <div className="bg-white dark:bg-[#121214] border border-slate-200 dark:border-zinc-800 border-t-2 border-t-amber-500 rounded-2xl p-5 sm:p-6 space-y-3 transition-all shadow-sm hover:border-slate-300 dark:hover:border-zinc-700 hover:shadow-md flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs sm:text-sm">
                <span className="text-amber-600 dark:text-amber-400 font-bold flex items-center space-x-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  <span className="uppercase tracking-wider">Valuation Froth</span>
                </span>
                <span className="font-mono font-bold text-slate-600 dark:text-zinc-400">16% Weight</span>
              </div>
              <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white">
                Median Lab P/S: 27.5×
              </h3>
              <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed font-sans">
                OpenAI ($300B at 15.0× on $20B ARR), Anthropic ($150B at 13.0× with $57B in debt facilities), and Mistral ($11B at 31.4×) trade at multiples exceeding historical software bubbles.
              </p>
              <details className="group">
                <summary className="list-none [&::-webkit-details-marker]:hidden cursor-pointer inline-flex items-center space-x-1 font-mono text-[11px] font-bold text-amber-600/80 hover:text-amber-600 dark:text-amber-400/80 dark:hover:text-amber-400 transition-colors py-0.5">
                  <Sparkles className="w-3 h-3 text-amber-500 shrink-0" />
                  <span>💡 Plain English</span>
                  <span className="text-[10px] group-open:rotate-180 transition-transform">▾</span>
                </summary>
                <div className="mt-1.5 p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-900/50 text-[11px] font-sans text-amber-900 dark:text-amber-200 leading-relaxed">
                  <strong>In plain English:</strong> Investors pay $27 today for every $1 of startup sales. While frontier ARR has exploded past $20B, valuations require relentless exponential growth to hold.
                </div>
              </details>
            </div>
            <Link
              href="/companies"
              className="pt-2 text-xs font-mono font-semibold text-amber-600 dark:text-amber-400 hover:underline flex items-center space-x-1"
            >
              <span>View 20 corporate profiles</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {/* Pillar 3: Macro & US10Y */}
          <div className="bg-white dark:bg-[#121214] border border-slate-200 dark:border-zinc-800 border-t-2 border-t-indigo-500 rounded-2xl p-5 sm:p-6 space-y-3 transition-all shadow-sm hover:border-slate-300 dark:hover:border-zinc-700 hover:shadow-md flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs sm:text-sm">
                <span className="text-indigo-600 dark:text-indigo-400 font-bold flex items-center space-x-1.5">
                  <span className="w-2 h-2 rounded-full bg-indigo-500" />
                  <span className="uppercase tracking-wider">Macro &amp; US10Y</span>
                </span>
                <span className="font-mono font-bold text-slate-600 dark:text-zinc-400">12% Weight</span>
              </div>
              <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white">
                US10Y: {us10y.toFixed(2)}% • CPI: {cpi.toFixed(1)}%
              </h3>
              <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed font-sans">
                10-Year Treasury yields at {us10y.toFixed(2)}% elevate capital hurdle rates, making future profits worth far less in today&apos;s money.
              </p>
              <details className="group">
                <summary className="list-none [&::-webkit-details-marker]:hidden cursor-pointer inline-flex items-center space-x-1 font-mono text-[11px] font-bold text-indigo-600/80 hover:text-indigo-600 dark:text-indigo-400/80 dark:hover:text-indigo-400 transition-colors py-0.5">
                  <Sparkles className="w-3 h-3 text-indigo-500 shrink-0" />
                  <span>💡 Plain English</span>
                  <span className="text-[10px] group-open:rotate-180 transition-transform">▾</span>
                </summary>
                <div className="mt-1.5 p-2.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-900/50 text-[11px] font-sans text-indigo-900 dark:text-indigo-200 leading-relaxed">
                  <strong>In plain English:</strong> Safe US government bonds pay {us10y.toFixed(2)}% guaranteed interest, making risky, speculative AI investments harder to justify.
                </div>
              </details>
            </div>
            <Link
              href="/sandbox"
              className="pt-2 text-xs font-mono font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center space-x-1"
            >
              <span>Simulate macro rate shocks</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {/* Pillar 4: AI Debt Velocity */}
          <div className="bg-white dark:bg-[#121214] border border-slate-200 dark:border-zinc-800 border-t-2 border-t-rose-600 rounded-2xl p-5 sm:p-6 space-y-3 transition-all shadow-sm hover:border-slate-300 dark:hover:border-zinc-700 hover:shadow-md flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs sm:text-sm">
                <span className="text-rose-600 dark:text-rose-400 font-bold flex items-center space-x-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-600" />
                  <span className="uppercase tracking-wider">AI Debt Velocity</span>
                </span>
                <span className="font-mono font-bold text-slate-600 dark:text-zinc-400">14% Weight</span>
              </div>
              <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white">
                ${annualDebtB}B/yr Debt Pace
              </h3>
              <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed font-sans">
                ${totalDebtB}B verified AI debt tracked across 20 facilities (Anthropic, CoreWeave, Vantage, Oracle). Capex consumes 54.8% of operating cash flow.
              </p>
              <details className="group">
                <summary className="list-none [&::-webkit-details-marker]:hidden cursor-pointer inline-flex items-center space-x-1 font-mono text-[11px] font-bold text-rose-600/80 hover:text-rose-600 dark:text-rose-400/80 dark:hover:text-rose-400 transition-colors py-0.5">
                  <Sparkles className="w-3 h-3 text-rose-500 shrink-0" />
                  <span>💡 Plain English</span>
                  <span className="text-[10px] group-open:rotate-180 transition-transform">▾</span>
                </summary>
                <div className="mt-1.5 p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200/80 dark:border-rose-900/50 text-[11px] font-sans text-rose-900 dark:text-rose-200 leading-relaxed">
                  <strong>In plain English:</strong> Tech giants are borrowing over ${annualDebtB}B every year for data centers. Borrowed debt must be repaid with interest no matter what happens.
                </div>
              </details>
            </div>
            <Link
              href="/ledger"
              className="pt-2 text-xs font-mono font-semibold text-rose-600 dark:text-rose-400 hover:underline flex items-center space-x-1"
            >
              <span>Filter ${totalDebtB}B debt facilities</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── 5. LIVE INTELLIGENCE SPOTLIGHT: MARKETS & NEWS TEASER CARDS ─────── */}
      <section aria-labelledby="live-spotlight-heading" className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 pb-1">
          <div>
            <h2 id="live-spotlight-heading" className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <span>Real-Time Market Pulse &amp; Financial Wire</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5 font-sans">
              Dedicated full-screen financial monitors for AI bellwethers, Treasury yields, and breaking SEC disclosures.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
          {/* Spotlight Card 1: Markets Terminal */}
          <div className="bg-white dark:bg-[#121214] border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 sm:p-6 space-y-4 shadow-xs flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-mono font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
                    Consolidated Tape
                  </span>
                </div>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 font-bold border border-emerald-200 dark:border-emerald-900">
                  ITCH 5.0 Streaming
                </span>
              </div>

              <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white">
                AI Equities, Hyperscale Debt &amp; Fixed Income Monitor
              </h3>

              <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-300 font-sans leading-relaxed">
                Track live market prices and intraday trendlines for NVDA ($214.13), ORCL ($128.23 • 187bp CDS), MSFT, 
                and benchmark Treasury yields (US10Y at 5.10%, US02Y at 4.75%, High Yield OAS at 336 bps).
              </p>

              {/* Ticker Snapshot Pills */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 font-mono text-xs">
                <div className="bg-slate-50 dark:bg-zinc-900/80 p-2 rounded-lg border border-slate-200/60 dark:border-zinc-800">
                  <span className="text-slate-500 dark:text-zinc-400 block text-[10px]">NVDA</span>
                  <span className="font-bold text-slate-900 dark:text-white">$214.13</span>
                  <span className="text-rose-600 dark:text-rose-400 text-[10px] block font-semibold">-1.2%</span>
                </div>
                <div className="bg-slate-50 dark:bg-zinc-900/80 p-2 rounded-lg border border-slate-200/60 dark:border-zinc-800">
                  <span className="text-slate-500 dark:text-zinc-400 block text-[10px]">ORCL CDS</span>
                  <span className="font-bold text-rose-600 dark:text-rose-400">187 bp</span>
                  <span className="text-rose-600 dark:text-rose-400 text-[10px] block font-semibold">+131%</span>
                </div>
                <div className="bg-slate-50 dark:bg-zinc-900/80 p-2 rounded-lg border border-slate-200/60 dark:border-zinc-800">
                  <span className="text-slate-500 dark:text-zinc-400 block text-[10px]">US 10Y</span>
                  <span className="font-bold text-slate-900 dark:text-white">5.10%</span>
                  <span className="text-rose-600 dark:text-rose-400 text-[10px] block font-semibold">+1.0bp</span>
                </div>
                <div className="bg-slate-50 dark:bg-zinc-900/80 p-2 rounded-lg border border-slate-200/60 dark:border-zinc-800">
                  <span className="text-slate-500 dark:text-zinc-400 block text-[10px]">AI DEBT</span>
                  <span className="font-bold text-slate-900 dark:text-white">$85.0B/yr</span>
                  <span className="text-amber-600 dark:text-amber-400 text-[10px] block font-semibold">+22%</span>
                </div>
              </div>
            </div>

            <Link
              href="/markets"
              className="mt-2 inline-flex items-center justify-between px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-950 font-semibold text-xs sm:text-sm transition-all shadow-xs"
            >
              <span>Open Dedicated Markets Terminal</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </div>

          {/* Spotlight Card 2: News Wire */}
          <div className="bg-white dark:bg-[#121214] border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 sm:p-6 space-y-4 shadow-xs flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                  <span className="text-xs font-mono font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
                    Institutional News Wire
                  </span>
                </div>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 font-bold border border-blue-200 dark:border-blue-900">
                  SEC EDGAR • Reuters
                </span>
              </div>

              <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white">
                AI Capital, Debt &amp; Infrastructure Breaking News
              </h3>

              <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-300 font-sans leading-relaxed">
                Real-time verified dispatches on Anthropic&apos;s $518B cloud commitment disclosures, CoreWeave loan covenants, 
                nuclear power off-take agreements, and OpenAI convertible notes.
              </p>

              {/* Latest Headline Highlights */}
              <div className="space-y-2 pt-1">
                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-zinc-900/80 border border-slate-200/60 dark:border-zinc-800 text-xs">
                  <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-zinc-400 font-mono mb-1">
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">Reuters • 14m ago</span>
                    <span className="text-rose-600 dark:text-rose-400 font-bold">High Impact</span>
                  </div>
                  <span className="font-semibold text-slate-800 dark:text-zinc-200 line-clamp-1">
                    Anthropic S-1 Review: $4.6B Run-Rate Against $518B Long-Term Cloud Commitments
                  </span>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-zinc-900/80 border border-slate-200/60 dark:border-zinc-800 text-xs">
                  <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-zinc-400 font-mono mb-1">
                    <span className="font-bold text-blue-600 dark:text-blue-400">Bloomberg • 38m ago</span>
                    <span className="text-amber-600 dark:text-amber-400 font-bold">Material Filing</span>
                  </div>
                  <span className="font-semibold text-slate-800 dark:text-zinc-200 line-clamp-1">
                    Oracle 5Y CDS Swaps Blow Out to 187bps on Hyperscale GPU Debt Guarantees
                  </span>
                </div>
              </div>
            </div>

            <Link
              href="/news"
              className="mt-2 inline-flex items-center justify-between px-4 py-2.5 rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-900 dark:text-white font-semibold text-xs sm:text-sm transition-all shadow-xs"
            >
              <span>Open Dedicated Breaking News Wire</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── 6. SPECIALIZED INTELLIGENCE PORTALS (6 SPACIOUS CARDS) ────────────── */}
      <section aria-labelledby="portals-heading" className="space-y-4 pt-4 border-t border-slate-200 dark:border-zinc-800">
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 pb-1">
          <div>
            <h2 id="portals-heading" className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Explore Specialized Intelligence Portals
            </h2>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5 font-sans">
              Dedicated full-page analytical suites, complete deal databases, and interactive financial sandboxes.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {/* Portal 1: Live Markets */}
          <Link
            href="/markets"
            className="group bg-white dark:bg-[#121214] border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 space-y-3 hover:border-emerald-500 dark:hover:border-emerald-500 transition-all shadow-xs hover:shadow-md flex flex-col justify-between"
          >
            <div className="space-y-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <TrendingUp className="w-5 h-5" />
              </div>
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                Live Markets &amp; Debt Tickers
              </h3>
              <p className="text-xs text-slate-600 dark:text-zinc-400 font-sans leading-relaxed">
                Full-screen institutional monitor tracking NVDA, ORCL, MSFT, Treasury benchmark yields, and CDS credit default spreads.
              </p>
            </div>
            <div className="pt-2 text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 flex items-center space-x-1">
              <span>Open Markets Suite</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* Portal 2: News Wire */}
          <Link
            href="/news"
            className="group bg-white dark:bg-[#121214] border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 space-y-3 hover:border-blue-500 dark:hover:border-blue-500 transition-all shadow-xs hover:shadow-md flex flex-col justify-between"
          >
            <div className="space-y-2.5">
              <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-blue-600 dark:text-blue-400">
                <Newspaper className="w-5 h-5" />
              </div>
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                Breaking News Wire
              </h3>
              <p className="text-xs text-slate-600 dark:text-zinc-400 font-sans leading-relaxed">
                Searchable news dispatches with live category filtering, SEC filing citations, and debt covenant analysis.
              </p>
            </div>
            <div className="pt-2 text-xs font-mono font-bold text-blue-600 dark:text-blue-400 flex items-center space-x-1">
              <span>Read News Wire</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* Portal 3: Visual Analytics */}
          <Link
            href="/visualize"
            className="group bg-white dark:bg-[#121214] border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 space-y-3 hover:border-purple-500 dark:hover:border-purple-500 transition-all shadow-xs hover:shadow-md flex flex-col justify-between"
          >
            <div className="space-y-2.5">
              <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 flex items-center justify-center text-purple-600 dark:text-purple-400">
                <BarChart3 className="w-5 h-5" />
              </div>
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                Visual Analytics Suite
              </h3>
              <p className="text-xs text-slate-600 dark:text-zinc-400 font-sans leading-relaxed">
                Explore the {totalDeals}-deal interactive bubble physics map, sigmoid sensitivity curves, multiple scatter plots, and capex composition.
              </p>
            </div>
            <div className="pt-2 text-xs font-mono font-bold text-purple-600 dark:text-purple-400 flex items-center space-x-1">
              <span>Open Visual Suite</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* Portal 4: Deal Ledger */}
          <Link
            href="/ledger"
            className="group bg-white dark:bg-[#121214] border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 space-y-3 hover:border-indigo-500 dark:hover:border-indigo-500 transition-all shadow-xs hover:shadow-md flex flex-col justify-between"
          >
            <div className="space-y-2.5">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                {totalDeals}-Deal Capital Ledger
              </h3>
              <p className="text-xs text-slate-600 dark:text-zinc-400 font-sans leading-relaxed">
                Inspect every verified filing ($2.81T disclosed). Filter by $196.8B in debt, circular chip vendor financing, and export CSV/JSON.
              </p>
            </div>
            <div className="pt-2 text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400 flex items-center space-x-1">
              <span>Browse Deal Database</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* Portal 5: Macro Sandbox */}
          <Link
            href="/sandbox"
            className="group bg-white dark:bg-[#121214] border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 space-y-3 hover:border-rose-500 dark:hover:border-rose-500 transition-all shadow-xs hover:shadow-md flex flex-col justify-between"
          >
            <div className="space-y-2.5">
              <div className="w-9 h-9 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 flex items-center justify-center text-rose-600 dark:text-rose-400">
                <Sliders className="w-5 h-5" />
              </div>
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
                Macro Sensitivity Sandbox
              </h3>
              <p className="text-xs text-slate-600 dark:text-zinc-400 font-sans leading-relaxed">
                Tweak 8 financial sliders: US10Y bond yields, Oracle CDS blowout, private lab multiples, and hyperscaler capex cuts.
              </p>
            </div>
            <div className="pt-2 text-xs font-mono font-bold text-rose-600 dark:text-rose-400 flex items-center space-x-1">
              <span>Launch Simulator</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* Portal 6: 8-Factor Methodology */}
          <Link
            href="/methodology"
            className="group bg-white dark:bg-[#121214] border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 space-y-3 hover:border-amber-500 dark:hover:border-amber-500 transition-all shadow-xs hover:shadow-md flex flex-col justify-between"
          >
            <div className="space-y-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 flex items-center justify-center text-amber-600 dark:text-amber-400">
                <Layers className="w-5 h-5" />
              </div>
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                8-Factor Recipe &amp; Methodology
              </h3>
              <p className="text-xs text-slate-600 dark:text-zinc-400 font-sans leading-relaxed">
                Review the mathematical formulas, systemic contagion synergy equations, historical backtests (2000, 2008, 2021), and honesty protocol.
              </p>
            </div>
            <div className="pt-2 text-xs font-mono font-bold text-amber-600 dark:text-amber-400 flex items-center space-x-1">
              <span>Read Methodology</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        </div>
      </section>

      {/* ── 7. BOTTOM LEADERBOARD AD ─────────────────────────────────────────── */}
      <AdSlot format="leaderboard" />
    </div>
  );
}
