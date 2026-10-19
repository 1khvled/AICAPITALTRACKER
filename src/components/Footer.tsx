import React from "react";
import Link from "next/link";
import { ArrowUpRight, Zap, ShieldCheck, Database, FileText, Code2, Activity, ExternalLink, AlertTriangle } from "lucide-react";
import { POLYMARKET_BASE_URL, POLYMARKET_REFERRAL_CODE } from "@/data/polymarket-data";
import { evaluateBubbleModel, DEFAULT_MODEL_INPUTS } from "@/lib/model/engine";

export function Footer() {
  const liveProb = `${evaluateBubbleModel(DEFAULT_MODEL_INPUTS).burstProbability.toFixed(1)}%`;
  return (
    <footer className="border-t border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-[#09090b] mt-16 sm:mt-24 text-slate-600 dark:text-zinc-400 text-sm transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-8 sm:space-y-12">
        {/* High-Contrast Polymarket Referral CTA Box */}
        <div className="relative overflow-hidden rounded-2xl bg-slate-900 text-white p-5 sm:p-8 border border-indigo-900/80 shadow-md">
          <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="flex flex-wrap items-center gap-2.5">
                <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-mono font-semibold">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>PREDICTION MARKETS PARTNER</span>
                </div>
                <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-md bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                  Ref Tag: <span className="text-white font-extrabold">{POLYMARKET_REFERRAL_CODE}</span>
                </span>
                <span className="text-xs font-mono text-zinc-300 bg-white/10 px-2 py-0.5 rounded">
                  0% Gas Fees (Polygon)
                </span>
              </div>

              <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Hedge AI Infrastructure Credit &amp; Bubble Risk on Polymarket
              </h3>

              <p className="text-zinc-300 text-xs sm:text-sm font-sans leading-relaxed">
                Take directional positions on real-world probability contracts: Oracle senior debt stress, 
                Anthropic M&amp;A odds, OpenAI IPO valuation thresholds, and the 2026/2027 AI downturn timeline.
              </p>

              {/* Live Contract Teaser Pills */}
              <div className="flex flex-wrap items-center gap-2 pt-1 font-mono text-xs">
                <span className="px-2.5 py-1 rounded-lg bg-black/40 border border-white/10 text-zinc-300">
                  Bubble Burst 2026: <strong className="text-indigo-300">7.6¢</strong>
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-black/40 border border-white/10 text-zinc-300">
                  Oracle CDS Stress: <strong className="text-amber-300">38.0¢</strong>
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-black/40 border border-white/10 text-zinc-300">
                  OpenAI IPO by 2026: <strong className="text-rose-300">4.3¢</strong>
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto shrink-0">
              <a
                href={POLYMARKET_BASE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center space-x-2.5 px-6 py-3.5 rounded-xl font-bold text-sm bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-400 hover:to-indigo-500 text-white shadow-lg shadow-indigo-600/30 hover:shadow-indigo-600/50 transition-all text-center"
              >
                <Zap className="w-4 h-4 fill-current text-amber-300" />
                <span>Trade on Polymarket</span>
                <ArrowUpRight className="w-4 h-4 ml-0.5" />
              </a>
              <Link
                href="/methodology"
                className="inline-flex items-center justify-center space-x-1.5 px-4 py-3.5 rounded-xl text-xs sm:text-sm font-semibold bg-white/10 hover:bg-white/15 text-zinc-200 border border-white/10 transition-colors text-center"
              >
                <FileText className="w-3.5 h-3.5 text-zinc-400" />
                <span>Model Logic</span>
              </Link>
            </div>
          </div>
        </div>

        {/* 4-Column Directory Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10">
          {/* Column 1: Platform Overview */}
          <div className="space-y-4">
            <div className="space-y-1.5">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-sm bg-emerald-500" />
                <span className="font-black text-slate-900 dark:text-white text-base tracking-tight">
                  AI Capital Tracker
                </span>
              </div>
              <p className="text-xs font-mono text-slate-500 dark:text-zinc-400">
                Independent Quantitative Research Desk
              </p>
            </div>
            <p className="text-slate-600 dark:text-zinc-400 text-xs sm:text-sm leading-relaxed font-sans">
              An open quantitative instrument tracking $2.86T in AI infrastructure financings, private lab sales multiples, 
              counterparty circularity, and credit stress. Sourced directly from audited SEC EDGAR disclosures, 
              indentures, and verified filings.
            </p>
            <div className="flex items-center space-x-2 text-xs font-mono text-emerald-600 dark:text-emerald-400">
              <Activity className="w-3.5 h-3.5" />
              <span>Real-Time Model Engine Active</span>
            </div>
          </div>

          {/* Column 2: Navigation & Core Instruments */}
          <div>
            <h4 className="text-slate-900 dark:text-white text-sm font-bold mb-3.5 uppercase tracking-wider font-mono">
              Core Instruments
            </h4>
            <ul className="space-y-2.5 text-xs sm:text-sm font-medium">
              <li>
                <Link href="/" className="hover:text-slate-900 dark:hover:text-white transition-colors flex items-center justify-between group">
                  <span>Model &amp; Burst Probability</span>
                  <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity">{liveProb}</span>
                </Link>
              </li>
              <li>
                <Link href="/dotcom-vs-ai" className="hover:text-slate-900 dark:hover:text-white transition-colors flex items-center justify-between group">
                  <span className="text-amber-600 dark:text-amber-400 font-bold">AI vs Dot-Com (2000 vs 2026)</span>
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30">NEW</span>
                </Link>
              </li>
              <li>
                <Link href="/ledger" className="hover:text-slate-900 dark:hover:text-white transition-colors flex items-center justify-between group">
                  <span>Deal Ledger (169 Deals)</span>
                  <span className="text-xs font-mono text-slate-400 dark:text-zinc-500 opacity-0 group-hover:opacity-100 transition-opacity">$2.86T</span>
                </Link>
              </li>
              <li>
                <Link href="/companies" className="hover:text-slate-900 dark:hover:text-white transition-colors flex items-center justify-between group">
                  <span>Corporate Exposure Matrix</span>
                  <span className="text-xs font-mono text-slate-400 dark:text-zinc-500 opacity-0 group-hover:opacity-100 transition-opacity">20 Firms</span>
                </Link>
              </li>
              <li>
                <Link href="/markets" className="hover:text-slate-900 dark:hover:text-white transition-colors">
                  Live Markets &amp; Debt Monitor
                </Link>
              </li>
              <li>
                <Link href="/visualize" className="hover:text-slate-900 dark:hover:text-white transition-colors">
                  Interactive Bubble Charts
                </Link>
              </li>
              <li>
                <Link href="/sandbox" className="hover:text-slate-900 dark:hover:text-white transition-colors">
                  Interactive Stress Simulator
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Documentation & Developer API */}
          <div>
            <h4 className="text-slate-900 dark:text-white text-sm font-bold mb-3.5 uppercase tracking-wider font-mono">
              Methodology &amp; API
            </h4>
            <ul className="space-y-2.5 text-xs sm:text-sm font-medium">
              <li>
                <Link href="/methodology" className="hover:text-slate-900 dark:hover:text-white transition-colors flex items-center space-x-1.5">
                  <FileText className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Mathematical Methodology</span>
                </Link>
              </li>
              <li>
                <Link href="/api-docs" className="hover:text-slate-900 dark:hover:text-white transition-colors flex items-center space-x-1.5">
                  <Code2 className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Developer API v1 (REST)</span>
                </Link>
              </li>
              <li>
                <a
                  href="/api/v1/model"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-slate-900 dark:hover:text-white transition-colors flex items-center space-x-1.5 font-mono text-xs text-slate-500 dark:text-zinc-400"
                >
                  <span>GET /api/v1/model</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </li>
              <li>
                <a
                  href="/api/v1/deals"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-slate-900 dark:hover:text-white transition-colors flex items-center space-x-1.5 font-mono text-xs text-slate-500 dark:text-zinc-400"
                >
                  <span>GET /api/v1/deals</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </li>
              <li>
                <a
                  href="/api/v1/factors"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-slate-900 dark:hover:text-white transition-colors flex items-center space-x-1.5 font-mono text-xs text-slate-500 dark:text-zinc-400"
                >
                  <span>GET /api/v1/factors</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </li>
              <li>
                <a
                  href="/api/v1/news"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-slate-900 dark:hover:text-white transition-colors flex items-center space-x-1.5 font-mono text-xs text-slate-500 dark:text-zinc-400"
                >
                  <span>GET /api/v1/news</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </li>
            </ul>
          </div>

          {/* Column 4: Data Integrity & Verified Disclosures */}
          <div className="space-y-3.5">
            <h4 className="text-slate-900 dark:text-white text-sm font-bold uppercase tracking-wider font-mono flex items-center space-x-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>Data Integrity</span>
            </h4>
            <p className="text-slate-600 dark:text-zinc-400 text-xs sm:text-sm leading-relaxed font-sans">
              Every data point is anchored in an audited SEC 10-K/10-Q filing, indenture prospectus, or verified primary counterparty disclosure. Unconfirmed rumors remain excluded.
            </p>
            <div className="p-3 rounded-xl bg-slate-100 dark:bg-zinc-900/80 border border-slate-200/80 dark:border-zinc-800 text-xs font-mono space-y-1">
              <div className="text-slate-700 dark:text-zinc-300">
                Affiliate Tag: <span className="text-indigo-600 dark:text-indigo-400 font-bold">{POLYMARKET_REFERRAL_CODE}</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400 leading-normal font-sans">
                Links to Polymarket support independent research via affiliate referral fees. Not financial advice.
              </p>
            </div>
          </div>
        </div>

        {/* Regulatory & Institutional Compliance Disclaimer */}
        <div className="p-4 sm:p-5 rounded-2xl bg-amber-500/5 border border-amber-500/20 text-xs text-slate-600 dark:text-zinc-400 space-y-2">
          <div className="flex items-center space-x-2 text-amber-600 dark:text-amber-400 font-mono font-bold uppercase tracking-wider text-[11px]">
            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
            <span>Regulatory Notice — Not Financial Advice</span>
          </div>
          <p className="leading-relaxed font-sans text-xs text-slate-600 dark:text-zinc-400">
            All data, probabilities, fragility metrics, and quantitative simulations published on AI Capital Tracker are strictly for informational, educational, and quantitative research purposes. Nothing on this website constitutes financial, investment, legal, tax, or credit advice. The metrics presented are algorithmic outputs based on public SEC disclosures, secondary trading data, and prediction market quotes as of October 2026. Investing in financial markets, equities, credit facilities, or prediction markets carries risk of capital loss. Always conduct independent due diligence or consult a licensed professional before making investment decisions.
          </p>
        </div>

        {/* Live Research Status Bar & Bottom Meta */}
        <div className="pt-8 border-t border-slate-200 dark:border-zinc-800 flex flex-col md:flex-row items-center justify-between text-xs text-slate-500 dark:text-zinc-400 gap-4">
          {/* Live Status Badge */}
          <div className="flex items-center space-x-2.5 bg-slate-100 dark:bg-zinc-900/90 px-3.5 py-1.5 rounded-full border border-slate-200 dark:border-zinc-800">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="font-mono font-medium text-slate-700 dark:text-zinc-300">
              Live Research Desk: SEC EDGAR • OpenRouter • Polymarket • Yahoo Finance Sync Active (Daily 00:00 UTC)
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 font-mono text-xs">
            <Link href="/methodology" className="hover:text-slate-900 dark:hover:text-white transition-colors">
              Methodology
            </Link>
            <span>•</span>
            <Link href="/api-docs" className="hover:text-slate-900 dark:hover:text-white transition-colors">
              API Docs
            </Link>
            <span>•</span>
            <a
              href={POLYMARKET_BASE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-600 dark:text-indigo-400 hover:underline flex items-center space-x-0.5"
            >
              <span>Polymarket (Ref: {POLYMARKET_REFERRAL_CODE})</span>
            </a>
            <span>•</span>
            <span>v2.5.0</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
