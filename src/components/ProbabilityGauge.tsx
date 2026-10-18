"use client";

import React, { useState } from "react";
import { BubbleBand } from "@/lib/model/types";
import { TrendingUp, AlertTriangle, ShieldCheck, Info, ChevronRight } from "lucide-react";
import Link from "next/link";

interface ProbabilityGaugeProps {
  probability: number;
  compositeScore: number;
  band: BubbleBand;
  coverage: number;
  topDrivers: string[];
  confidenceInterval?: [number, number];
  fragilityIndex?: number;
}

export function ProbabilityGauge({
  probability,
  compositeScore,
  band,
  coverage,
  confidenceInterval,
  fragilityIndex,
}: ProbabilityGaugeProps) {
  const [selectedDriver, setSelectedDriver] = useState<string | null>(null);

  const bandConfig: Record<
    BubbleBand,
    { label: string; badge: string; text: string; bg: string; border: string; desc: string }
  > = {
    critical: {
      label: "Critical Risk (≥80%)",
      badge: "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-400 border-rose-300 dark:border-rose-900",
      text: "text-rose-600 dark:text-rose-400",
      bg: "bg-rose-500",
      border: "border-rose-500",
      desc: "Severe debt saturation, widening CDS spreads, and unsustainable circular counterparty funding.",
    },
    high: {
      label: "High Stress (65–79%)",
      badge: "bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400 border-rose-200 dark:border-rose-900/60",
      text: "text-rose-600 dark:text-rose-400",
      bg: "bg-rose-500",
      border: "border-rose-500",
      desc: "Valuation multiples and debt commitments significantly outpace verified commercial monetization.",
    },
    elevated: {
      label: "Elevated Risk (45–64%)",
      badge: "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400 border-amber-200 dark:border-amber-900/60",
      text: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-500",
      border: "border-amber-500",
      desc: "Credit spreads widening and private valuations high, balanced by ongoing enterprise adoption.",
    },
    guarded: {
      label: "Guarded (25–44%)",
      badge: "bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400 border-blue-200 dark:border-blue-900/60",
      text: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-500",
      border: "border-blue-500",
      desc: "Moderate multiple expansion adequately covered by real utility and revenue growth.",
    },
    calm: {
      label: "Low Risk (<25%)",
      badge: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/60",
      text: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-500",
      border: "border-emerald-500",
      desc: "Revenues, cash flow, and token unit economics fully justify current capital investments.",
    },
  };

  const current = bandConfig[band] || bandConfig.high;

  // 90-day trajectory data points for mini sparkline
  const trajectory = [
    { day: "90d ago", score: 58.2, prob: 64.2 },
    { day: "60d ago", score: 59.4, prob: 65.8 },
    { day: "30d ago", score: 60.5, prob: 67.1 },
    { day: "Now", score: compositeScore, prob: probability },
  ];

  return (
    <div className="rounded-2xl bg-white dark:bg-[#121214] border border-slate-200 dark:border-zinc-800 p-6 sm:p-8 space-y-6 transition-colors shadow-sm">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left Side: Probability Display & Executive Summary */}
        <div className="lg:col-span-7 space-y-5">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs sm:text-sm font-bold border ${current.badge}`}>
              <span className="w-2 h-2 rounded-full bg-rose-500 mr-2 animate-pulse"></span>
              {current.label}
            </span>
            <span className="text-xs sm:text-sm text-slate-600 dark:text-zinc-300 font-semibold">
              Horizon: Next 12 Months
            </span>
            <span className="text-xs sm:text-sm text-slate-600 dark:text-zinc-300 font-semibold">
              • Confidence: {(coverage * 100).toFixed(0)}% Disclosed Data
            </span>
            {confidenceInterval && (
              <span className="text-xs sm:text-sm text-slate-600 dark:text-zinc-300 font-semibold font-mono">
                • 90% CI: [{confidenceInterval[0]}%, {confidenceInterval[1]}%]
              </span>
            )}
            {fragilityIndex !== undefined && (
              <span className="text-xs sm:text-sm text-amber-600 dark:text-amber-400 font-bold font-mono">
                • Fragility: {fragilityIndex}/100
              </span>
            )}
          </div>

          <div className="flex items-baseline space-x-5">
            <span className="font-mono text-7xl sm:text-8xl font-black tracking-tighter text-slate-900 dark:text-white font-tabular">
              {probability.toFixed(1)}%
            </span>
            <div className="flex flex-col space-y-1">
              <span className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white">
                12-Month Burst Probability
              </span>
              <span className="text-xs sm:text-sm font-bold text-rose-600 dark:text-rose-400 flex items-center space-x-1">
                <TrendingUp className="w-4 h-4" />
                <span>+4.2% in last 90 days</span>
              </span>
              <span className="text-xs sm:text-sm font-semibold text-slate-600 dark:text-zinc-400 font-mono">
                Composite Score: {compositeScore.toFixed(1)} / 100
              </span>
            </div>
          </div>

          <p className="text-sm sm:text-base text-slate-700 dark:text-zinc-300 leading-relaxed font-sans">
            {current.desc} Driven by Oracle 5Y CDS default spreads widening to 187 bp (+131% increase), 
            a median 34.8× private frontier lab sales multiple, and $196.8B in verified debt facilities (including Anthropic's $57B Broadcom convertible note and credit facility) — partially 
            cushioned by a 40× drop in token inference costs.
          </p>

          {/* Calibrated Segmented Risk Bar */}
          <div className="space-y-2 pt-2">
            <div className="flex justify-between text-xs sm:text-sm font-bold text-slate-700 dark:text-zinc-300">
              <span>Calm (&lt;25%)</span>
              <span>Guarded</span>
              <span>Elevated</span>
              <span className="font-extrabold text-rose-600 dark:text-rose-400">High Stress (Now: 68.4%)</span>
              <span>Critical (&gt;80%)</span>
            </div>

            {/* Segmented meter tracks */}
            <div className="relative h-4 w-full bg-slate-100 dark:bg-zinc-950 rounded-full overflow-hidden flex border border-slate-300 dark:border-zinc-700 p-0.5">
              <div className="h-full w-[25%] bg-emerald-400/80 rounded-l-full mr-0.5" title="Calm: 0-25%"></div>
              <div className="h-full w-[20%] bg-blue-400/80 mr-0.5" title="Guarded: 25-45%"></div>
              <div className="h-full w-[20%] bg-amber-400/80 mr-0.5" title="Elevated: 45-65%"></div>
              <div className="h-full w-[15%] bg-rose-500 mr-0.5" title="High Stress: 65-80%"></div>
              <div className="h-full w-[20%] bg-red-600 rounded-r-full" title="Critical: 80-100%"></div>

              {/* Exact Pointer Needle */}
              <div
                className="absolute top-0 bottom-0 w-2 bg-slate-900 dark:bg-white rounded-full shadow-lg transform -translate-x-1/2"
                style={{ left: `${Math.min(98, Math.max(2, probability))}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Right Side: 90-Day Trajectory Sparkline & Top Risk Drivers */}
        <div className="lg:col-span-5 bg-slate-50 dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-zinc-200 uppercase tracking-wider">
              90-Day Risk Trajectory
            </span>
            <span className="text-xs sm:text-sm font-extrabold text-rose-600 dark:text-rose-400 font-mono">
              +4.2 pts
            </span>
          </div>

          {/* Mini Sparkline Chart */}
          <div className="h-24 flex items-end justify-between gap-3 pt-2">
            {trajectory.map((point, idx) => {
              const heightPct = ((point.prob - 50) / (75 - 50)) * 100;
              const isLast = idx === trajectory.length - 1;
              return (
                <div key={point.day} className="flex-1 flex flex-col items-center space-y-1.5">
                  <span className={`text-xs font-mono font-bold font-tabular ${isLast ? "text-rose-600 dark:text-rose-400" : "text-slate-600 dark:text-zinc-400"}`}>
                    {point.prob}%
                  </span>
                  <div className="w-full bg-slate-200 dark:bg-zinc-800 rounded-t-md overflow-hidden h-14 flex items-end">
                    <div
                      className={`w-full transition-all rounded-t-md ${
                        isLast ? "bg-rose-500" : "bg-slate-400 dark:bg-zinc-600"
                      }`}
                      style={{ height: `${Math.min(100, Math.max(15, heightPct))}%` }}
                    ></div>
                  </div>
                  <span className="text-xs font-semibold text-slate-600 dark:text-zinc-400">
                    {point.day}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Top 3 Drivers Quick Peek */}
          <div className="pt-3 border-t border-slate-200 dark:border-zinc-800 space-y-2.5">
            <span className="text-xs sm:text-sm font-bold text-slate-700 dark:text-zinc-300 block">
              Primary Upward Drivers:
            </span>
            <div className="space-y-2 text-xs sm:text-sm">
              <div className="flex items-center justify-between text-slate-800 dark:text-zinc-200">
                <span className="flex items-center space-x-2 font-medium">
                  <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                  <span>Oracle 5Y CDS (187 bp)</span>
                </span>
                <span className="font-mono text-rose-600 dark:text-rose-400 font-bold">+18.7 pts</span>
              </div>
              <div className="flex items-center justify-between text-slate-800 dark:text-zinc-200">
                <span className="flex items-center space-x-2 font-medium">
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                  <span>Lab Valuation Multiples (42.4×)</span>
                </span>
                <span className="font-mono text-amber-600 dark:text-amber-400 font-bold">+15.3 pts</span>
              </div>
              <div className="flex items-center justify-between text-slate-800 dark:text-zinc-200">
                <span className="flex items-center space-x-2 font-medium">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span>Token Price Deflation (40× cheaper)</span>
                </span>
                <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">-7.2 pts</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
