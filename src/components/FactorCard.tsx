"use client";

import React, { useState } from "react";
import { FactorContribution } from "@/lib/model/types";
import {
  ChevronDown,
  ChevronUp,
  Code2,
  TrendingUp,
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle2,
  Database,
  ShieldCheck,
  AlertTriangle,
} from "lucide-react";

interface FactorCardProps {
  factor: FactorContribution;
  explain: string;
  formula: string;
}

export function FactorCard({ factor, explain, formula }: FactorCardProps) {
  const [showMethodology, setShowMethodology] = useState(false);
  const isDamper = factor.kind === "damper";
  const intensity = Math.round(factor.reading.score * 100);

  // Status configuration
  let barColor = "bg-emerald-500";
  let barGlow = "shadow-[0_0_10px_rgba(16,185,129,0.5)]";
  let textColor = "text-emerald-600 dark:text-emerald-400";
  let badgeStyle = "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800";
  let badgeLabel = "STABILIZING DAMPER";
  let stressCategory = "Active Stabilization";
  let pillStyle = "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800";

  if (!isDamper) {
    if (factor.reading.score >= 0.7) {
      barColor = "bg-rose-500";
      barGlow = "shadow-[0_0_10px_rgba(244,63,94,0.5)]";
      textColor = "text-rose-600 dark:text-rose-400";
      badgeStyle = "bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-800";
      badgeLabel = "CRITICAL RISK";
      stressCategory = "Extreme Stress";
      pillStyle = "bg-rose-50 text-rose-700 dark:bg-rose-950/70 dark:text-rose-300 border-rose-300 dark:border-rose-800";
    } else if (factor.reading.score >= 0.45) {
      barColor = "bg-amber-500";
      barGlow = "shadow-[0_0_10px_rgba(245,158,11,0.5)]";
      textColor = "text-amber-600 dark:text-amber-400";
      badgeStyle = "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800";
      badgeLabel = "ELEVATED RISK";
      stressCategory = "Elevated Stress";
      pillStyle = "bg-amber-50 text-amber-700 dark:bg-amber-950/70 dark:text-amber-300 border-amber-300 dark:border-amber-800";
    } else {
      barColor = "bg-blue-500";
      barGlow = "shadow-[0_0_10px_rgba(59,130,246,0.5)]";
      textColor = "text-blue-600 dark:text-blue-400";
      badgeStyle = "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800";
      badgeLabel = "GUARDED RISK";
      stressCategory = "Moderate Stress";
      pillStyle = "bg-blue-50 text-blue-700 dark:bg-blue-950/70 dark:text-blue-300 border-blue-300 dark:border-blue-800";
    }
  }

  return (
    <div className="bg-white dark:bg-[#121214] border border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 rounded-2xl p-5 sm:p-6 transition-all duration-200 flex flex-col justify-between shadow-xs hover:shadow-md">
      <div className="space-y-4">
        {/* Top Badges & Earned Points Indicator Pill */}
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className={`text-[11px] font-mono px-2.5 py-0.5 rounded-md font-bold uppercase tracking-wider border ${badgeStyle}`}>
                {badgeLabel}
              </span>
              <span className="text-[11px] font-mono font-bold text-slate-600 dark:text-zinc-400 bg-slate-100 dark:bg-zinc-800/80 px-2 py-0.5 rounded-md border border-slate-200/80 dark:border-zinc-700/60">
                {factor.weightPct}% Weight
              </span>
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base sm:text-lg leading-snug pt-1">
              {factor.label}
            </h3>
          </div>

          {/* High-Contrast Earned Points Indicator Pill */}
          <div className="text-right shrink-0">
            <div
              className={`inline-flex items-center space-x-1 px-3 py-1.5 rounded-xl border font-mono font-black text-sm sm:text-base tabular-nums shadow-xs ${pillStyle}`}
            >
              {isDamper ? (
                <>
                  <ArrowDownRight className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>-{Math.abs(factor.earnedPoints).toFixed(1)} pts</span>
                </>
              ) : (
                <>
                  <ArrowUpRight className="w-4 h-4 shrink-0" />
                  <span>+{factor.earnedPoints.toFixed(1)} pts</span>
                </>
              )}
            </div>
            <span className="block text-[10px] font-mono text-slate-500 dark:text-zinc-400 uppercase tracking-wider mt-1">
              {isDamper ? "Damper Relief" : "Score Impact"}
            </span>
          </div>
        </div>

        {/* Verified Empirical Reading Callout */}
        <div className="bg-slate-50 dark:bg-[#09090b] rounded-xl p-3 border border-slate-200/70 dark:border-zinc-800/80 space-y-1">
          <div className="flex items-center justify-between text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
            <span>Verified Metric</span>
            <span className="text-slate-400 dark:text-zinc-500">
              Coverage: {(factor.reading.coverage * 100).toFixed(0)}%
            </span>
          </div>
          <div className="text-xs sm:text-sm font-mono font-bold text-slate-900 dark:text-zinc-100">
            {factor.reading.reading}
          </div>
        </div>

        {/* Visual Stress-Level Progress Bar (0 to 100%) */}
        <div className="space-y-1.5 pt-0.5">
          <div className="flex justify-between items-center text-xs font-mono">
            <span className="font-bold text-slate-700 dark:text-zinc-300">
              Factor Stress Intensity
            </span>
            <span className="font-bold font-tabular text-slate-900 dark:text-white">
              {intensity}% <span className={`text-[11px] font-medium ${textColor}`}>({stressCategory})</span>
            </span>
          </div>

          <div className="relative h-2.5 w-full bg-slate-100 dark:bg-zinc-950 rounded-full overflow-hidden border border-slate-200/80 dark:border-zinc-800">
            <div
              className={`h-full ${barColor} ${barGlow} rounded-full transition-all duration-500`}
              style={{ width: `${Math.min(100, Math.max(4, intensity))}%` }}
            />
          </div>

          {/* Scale Labels */}
          <div className="flex justify-between text-[10px] font-mono text-slate-400 dark:text-zinc-500 px-0.5">
            <span>0% Calm</span>
            <span>50% Neutral</span>
            <span>100% Crisis</span>
          </div>
        </div>

        {/* Analytical Explanation */}
        <p className="text-xs sm:text-sm text-slate-700 dark:text-zinc-300 leading-relaxed font-sans">
          {explain}
        </p>

        {/* Expandable Methodology & Data Sources Section */}
        {showMethodology && (
          <div className="p-3.5 bg-slate-50 dark:bg-[#09090b] rounded-xl border border-slate-200 dark:border-zinc-800 space-y-3 transition-all">
            {/* Mathematical Formula */}
            <div className="space-y-1.5">
              <div className="flex items-center space-x-1.5 text-slate-600 dark:text-zinc-400 text-xs font-mono font-bold">
                <Code2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Published Calibration Formula</span>
              </div>
              <div className="p-2.5 bg-white dark:bg-[#121214] rounded-lg border border-slate-200/80 dark:border-zinc-800">
                <code className="text-xs font-bold font-mono text-emerald-600 dark:text-emerald-400 block break-all">
                  {formula}
                </code>
              </div>
            </div>

            {/* Methodology & Data Sources */}
            <div className="space-y-1 text-xs font-sans text-slate-600 dark:text-zinc-300 pt-1 border-t border-slate-200/60 dark:border-zinc-800/80">
              <div className="flex items-center space-x-1.5 font-mono text-[11px] font-bold text-slate-700 dark:text-zinc-300">
                <Database className="w-3.5 h-3.5 text-blue-500" />
                <span>Verification &amp; Sourcing Methodology:</span>
              </div>
              <p className="text-[11px] leading-relaxed text-slate-600 dark:text-zinc-400 font-sans">
                Computed from public regulatory disclosures (SEC 10-Q), ICE Benchmark Administration CDS contracts, 
                and verified term sheets. Missing values scale coverage weights rather than fabricating phantom baselines.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Footer Toggle for Methodology */}
      <div className="pt-3 mt-4 border-t border-slate-100 dark:border-zinc-800/80 flex items-center justify-between text-xs">
        <span className="font-mono text-slate-500 dark:text-zinc-400 font-medium flex items-center space-x-1">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
          <span>Verified Receipt</span>
        </span>
        <button
          onClick={() => setShowMethodology(!showMethodology)}
          className="text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white flex items-center space-x-1 font-mono font-bold transition-colors py-1 px-2 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800"
          aria-expanded={showMethodology}
        >
          <span>{showMethodology ? "Hide Methodology" : "Methodology & Math"}</span>
          {showMethodology ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>
    </div>
  );
}
