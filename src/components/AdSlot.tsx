"use client";

import React from "react";
import { ExternalLink, Zap } from "lucide-react";
import { POLYMARKET_BASE_URL, POLYMARKET_REFERRAL_CODE } from "@/data/polymarket-data";

interface AdSlotProps {
  format?: "leaderboard" | "in-feed" | "rectangle" | "banner";
  slotId?: string;
  className?: string;
}

export function AdSlot({ format = "leaderboard", slotId = "slot-default", className = "" }: AdSlotProps) {
  if (format === "in-feed") {
    return (
      <div className={`p-4 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/80 dark:bg-[#121214] transition-colors shadow-sm ${className}`}>
        <div className="flex items-center justify-between text-xs font-mono text-slate-500 dark:text-zinc-400 mb-2">
          <span className="flex items-center space-x-1.5 font-bold text-indigo-600 dark:text-indigo-400">
            <Zap className="w-3.5 h-3.5 fill-current" />
            <span className="uppercase tracking-wider">MARKET PARTNER SPOTLIGHT</span>
          </span>
          <span className="px-2 py-0.5 rounded bg-slate-200 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 font-mono text-xs font-semibold">
            Ref: {POLYMARKET_REFERRAL_CODE}
          </span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <a
              href={POLYMARKET_BASE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold text-base text-slate-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center space-x-1.5 transition-colors"
            >
              <span>Polymarket: Trade AI Bubble &amp; ORCL Debt Contracts with 0% Gas</span>
              <ExternalLink className="w-4 h-4 text-slate-400" />
            </a>
            <p className="text-sm text-slate-600 dark:text-zinc-300 leading-relaxed font-sans">
              Instant USDC limit orders on Polygon. Hedge macro AI tech drawdowns, lab IPO timelines, and datacenter credit spread blowouts.
            </p>
          </div>
          <a
            href={POLYMARKET_BASE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="self-start sm:self-center px-4 py-2 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white transition-colors whitespace-nowrap shadow-sm"
          >
            Open Market ›
          </a>
        </div>
      </div>
    );
  }

  if (format === "rectangle") {
    return (
      <div className={`w-full max-w-[320px] mx-auto p-4 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#121214] text-center space-y-3 transition-colors shadow-sm ${className}`}>
        <div className="flex items-center justify-between text-xs font-mono text-slate-500 dark:text-zinc-400 uppercase tracking-wider font-semibold">
          <span>SPONSORED BRIEF</span>
          <span className="text-indigo-500 font-bold">PARTNER</span>
        </div>
        <div className="rounded-lg bg-slate-50 dark:bg-zinc-900 p-4 border border-slate-100 dark:border-zinc-800/80 space-y-2.5">
          <div className="w-8 h-8 rounded-md bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto">
            <Zap className="w-4 h-4 fill-current" />
          </div>
          <span className="font-mono text-sm font-bold text-slate-900 dark:text-white block">
            Hedge AI Macro Risk
          </span>
          <p className="text-xs text-slate-600 dark:text-zinc-300 font-sans leading-relaxed">
            Trade decentralized prediction markets with deep liquidity and zero protocol gas fees.
          </p>
          <a
            href={POLYMARKET_BASE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline pt-1 font-mono"
          >
            Trade on Polymarket (Ref: {POLYMARKET_REFERRAL_CODE}) &rarr;
          </a>
        </div>
      </div>
    );
  }

  // Default: Leaderboard Banner (Solid, institutional, no wireframe dashed borders)
  return (
    <div className={`w-full rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#121214] p-3 transition-colors shadow-sm ${className}`}>
      <div className="flex items-center justify-between text-xs font-mono text-slate-500 dark:text-zinc-400 px-2 pb-1.5">
        <span className="uppercase tracking-wider font-bold text-slate-600 dark:text-zinc-400">INSTITUTIONAL PARTNER BRIEF</span>
        <span className="text-indigo-600 dark:text-indigo-400 font-bold">Ref Code: {POLYMARKET_REFERRAL_CODE}</span>
      </div>
      <div className="rounded-lg bg-slate-50 dark:bg-zinc-900/70 border border-slate-200/80 dark:border-zinc-800 flex flex-col sm:flex-row items-center justify-between px-4 sm:px-6 py-3 sm:py-2.5 gap-3">
        <div className="text-left">
          <div className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
            <span>Polymarket AI Prediction Markets &amp; Tech Downside Hedges</span>
            <span className="text-xs px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 font-mono font-bold">
              0% Gas
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-300 font-sans hidden sm:block mt-1">
            Trade live crowd consensus on the 2026 AI downturn, Oracle CDS spread thresholds, and OpenAI IPO valuations with instant USDC liquidity.
          </p>
        </div>
        <a
          href={POLYMARKET_BASE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white transition-colors whitespace-nowrap shadow-sm"
        >
          Trade Live Odds &rarr;
        </a>
      </div>
    </div>
  );
}
