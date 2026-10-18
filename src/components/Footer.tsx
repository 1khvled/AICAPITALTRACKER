import React from "react";
import Link from "next/link";
import { ArrowUpRight, Zap } from "lucide-react";
import { POLYMARKET_BASE_URL, POLYMARKET_REFERRAL_CODE } from "@/data/polymarket-data";

export function Footer() {
  return (
    <footer className="border-t border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#09090b] mt-20 text-slate-600 dark:text-zinc-400 text-sm transition-colors">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 space-y-10">
        {/* Polymarket Referral Callout Box */}
        <div className="p-5 sm:p-6 rounded-2xl bg-slate-50 dark:bg-[#121214] border border-slate-200 dark:border-zinc-800 flex flex-col md:flex-row items-center justify-between gap-5 shadow-sm">
          <div className="space-y-1.5 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start space-x-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">
                Polymarket Prediction Markets Partner
              </span>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                Ref: {POLYMARKET_REFERRAL_CODE}
              </span>
            </div>
            <p className="text-slate-600 dark:text-zinc-300 text-xs sm:text-sm font-sans max-w-xl leading-relaxed">
              Trade real-time AI bubble burst odds, Oracle debt default benchmarks, and OpenAI IPO contracts with zero gas fees on Polygon.
            </p>
          </div>

          <a
            href={POLYMARKET_BASE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-shrink-0 inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-all"
          >
            <Zap className="w-4 h-4 fill-current" />
            <span>Trade on Polymarket (Ref: {POLYMARKET_REFERRAL_CODE})</span>
            <ArrowUpRight className="w-4 h-4" />
          </a>
        </div>

        {/* 4-Column Directory Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-3">
            <span className="font-extrabold text-slate-900 dark:text-white text-base">
              AI Capital Tracker
            </span>
            <p className="text-slate-600 dark:text-zinc-400 text-xs sm:text-sm leading-relaxed font-sans">
              An open quantitative instrument tracking AI infrastructure debt, private lab sales multiples, 
              counterparty circularity, and credit stress. We calculate empirical probabilities from receipted disclosures 
              — not opinion, analyst sentiment, or promotional forecasts.
            </p>
          </div>

          <div>
            <h4 className="text-slate-900 dark:text-white text-sm font-bold mb-3.5">Navigation</h4>
            <ul className="space-y-2.5 text-xs sm:text-sm font-medium">
              <li>
                <Link href="/" className="hover:text-slate-900 dark:hover:text-white transition-colors">
                  Model &amp; Odds
                </Link>
              </li>
              <li>
                <Link href="/ledger" className="hover:text-slate-900 dark:hover:text-white transition-colors">
                  Deal Ledger (158 Deals)
                </Link>
              </li>
              <li>
                <Link href="/visualize" className="hover:text-slate-900 dark:hover:text-white transition-colors">
                  Interactive Bubble Charts
                </Link>
              </li>
              <li>
                <Link href="/sandbox" className="hover:text-slate-900 dark:hover:text-white transition-colors">
                  Interactive Simulator
                </Link>
              </li>
              <li>
                <Link href="/companies" className="hover:text-slate-900 dark:hover:text-white transition-colors">
                  Corporate Exposure
                </Link>
              </li>
              <li>
                <Link href="/api-docs" className="hover:text-slate-900 dark:hover:text-white transition-colors">
                  Developer API v1
                </Link>
              </li>
              <li>
                <Link href="/methodology" className="hover:text-slate-900 dark:hover:text-white transition-colors">
                  Mathematical Methodology
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-slate-900 dark:text-white text-sm font-bold mb-3.5 flex items-center space-x-2">
              <span>Polymarket Odds</span>
              <span className="text-xs font-mono font-bold px-1.5 py-0.2 rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                0% Gas
              </span>
            </h4>
            <ul className="space-y-2.5 text-xs sm:text-sm font-medium">
              <li>
                <a
                  href={`https://polymarket.com/event/ai-bubble-burst-by?r=${POLYMARKET_REFERRAL_CODE}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors flex items-center space-x-1"
                >
                  <span>AI Bubble Burst 2026/2027</span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
                </a>
              </li>
              <li>
                <a
                  href={`https://polymarket.com/?r=${POLYMARKET_REFERRAL_CODE}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors flex items-center space-x-1"
                >
                  <span>Oracle (ORCL) Debt Stress Odds</span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
                </a>
              </li>
              <li>
                <a
                  href={`https://polymarket.com/event/openai-ipo-by?r=${POLYMARKET_REFERRAL_CODE}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors flex items-center space-x-1"
                >
                  <span>OpenAI IPO Odds by Date</span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
                </a>
              </li>
              <li>
                <a
                  href={`https://polymarket.com/event/openai-announces-it-has-achieved-agi-before-2027?r=${POLYMARKET_REFERRAL_CODE}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors flex items-center space-x-1"
                >
                  <span>Achieve AGI Before 2027</span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
                </a>
              </li>
              <li>
                <a
                  href={`https://polymarket.com/event/openai-1t-ipo-before-2027?r=${POLYMARKET_REFERRAL_CODE}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors flex items-center space-x-1"
                >
                  <span>OpenAI $1T+ IPO Market Cap</span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
                </a>
              </li>
              <li>
                <a
                  href={`https://polymarket.com/event/anthropic-acquired-before-2027?r=${POLYMARKET_REFERRAL_CODE}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors flex items-center space-x-1"
                >
                  <span>Anthropic Acquired Before 2027</span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
                </a>
              </li>
              <li>
                <a
                  href={`https://polymarket.com/event/us-recession-by-end-of-2026?r=${POLYMARKET_REFERRAL_CODE}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors flex items-center space-x-1"
                >
                  <span>US Recession by End of 2026</span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-slate-900 dark:text-white text-sm font-bold mb-3.5">Data Integrity</h4>
            <p className="text-slate-600 dark:text-zinc-400 text-xs sm:text-sm leading-relaxed font-sans mb-3.5">
              Every figure is linked to an SEC filing, press release, or regulatory record. Undisclosed deals remain undisclosed. 
              Nothing on this site is financial advice.
            </p>
            <div className="p-3 rounded-xl bg-slate-100 dark:bg-zinc-900 text-xs font-mono text-slate-700 dark:text-zinc-300">
              Affiliate disclosure: Links to Polymarket use referral tag <span className="text-indigo-600 dark:text-indigo-400 font-bold">{POLYMARKET_REFERRAL_CODE}</span>.
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 border-t border-slate-200 dark:border-zinc-800/80 flex flex-col sm:flex-row items-center justify-between text-slate-600 dark:text-zinc-400 text-xs sm:text-sm gap-3">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>24h Automated Market Sync: OpenRouter, Polymarket, Yahoo &amp; SEC EDGAR</span>
          </div>
          <div className="flex items-center space-x-3 font-mono text-xs font-semibold">
            <a
              href={POLYMARKET_BASE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-600 dark:text-indigo-400 hover:underline flex items-center space-x-1"
            >
              <span>Polymarket (r={POLYMARKET_REFERRAL_CODE})</span>
            </a>
            <span>•</span>
            <Link href="/api-docs" className="hover:text-slate-900 dark:hover:text-white transition-colors">
              Developer API v1 →
            </Link>
            <span>•</span>
            <span>v2.5.0</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
