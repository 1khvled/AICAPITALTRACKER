"use client";

import React, { useState } from "react";
import { FactorContribution } from "@/lib/model/types";
import { ChevronDown, ChevronUp, Code2, ShieldAlert } from "lucide-react";

interface FactorCardProps {
  factor: FactorContribution;
  explain: string;
  formula: string;
}

export function FactorCard({ factor, explain, formula }: FactorCardProps) {
  const [showFormula, setShowFormula] = useState(false);
  const isDamper = factor.kind === "damper";
  const intensity = Math.round(factor.reading.score * 100);

  // Status color
  let barColor = "bg-emerald-500";
  let textColor = "text-emerald-600 dark:text-emerald-400";
  let badgeColor = "bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300";

  if (!isDamper) {
    if (factor.reading.score >= 0.7) {
      barColor = "bg-rose-500";
      textColor = "text-rose-600 dark:text-rose-400";
      badgeColor = "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200 dark:border-rose-900/60";
    } else if (factor.reading.score >= 0.45) {
      barColor = "bg-amber-500";
      textColor = "text-amber-600 dark:text-amber-400";
      badgeColor = "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200 dark:border-amber-900/60";
    } else {
      barColor = "bg-blue-500";
      textColor = "text-blue-600 dark:text-blue-400";
      badgeColor = "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 border border-blue-200 dark:border-blue-900/60";
    }
  } else {
    badgeColor = "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/60";
  }

  return (
    <div className="bg-white dark:bg-[#121214] border border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 rounded-xl p-5 transition-all flex flex-col justify-between shadow-sm">
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center space-x-2">
              <span className={`text-xs font-mono px-2.5 py-0.5 rounded font-semibold ${badgeColor}`}>
                {isDamper ? "Stabilizing Damper" : "Risk Factor"}
              </span>
              <span className="text-xs font-mono font-medium text-slate-500 dark:text-zinc-400">
                {factor.weightPct}% Weight
              </span>
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base mt-2 leading-snug">
              {factor.label}
            </h3>
          </div>

          <div className="text-right">
            <span className={`font-mono font-black text-base ${textColor} font-tabular`}>
              {isDamper ? `-${Math.abs(factor.earnedPoints)} pts` : `+${factor.earnedPoints} pts`}
            </span>
          </div>
        </div>

        {/* Mini Stress Intensity Bar */}
        <div className="space-y-1.5 pt-1">
          <div className="flex justify-between text-xs font-mono font-semibold text-slate-600 dark:text-zinc-400">
            <span>Factor Stress</span>
            <span>{intensity}%</span>
          </div>
          <div className="h-2 w-full bg-slate-100 dark:bg-zinc-950 rounded-full overflow-hidden border border-slate-200/50 dark:border-zinc-800">
            <div
              className={`h-full ${barColor} rounded-full transition-all duration-300`}
              style={{ width: `${intensity}%` }}
            ></div>
          </div>
        </div>

        {/* Explain */}
        <p className="text-sm text-slate-700 dark:text-zinc-200 leading-relaxed font-sans">
          {explain}
        </p>

        {/* Accordion for Formula */}
        {showFormula && (
          <div className="p-3 bg-slate-50 dark:bg-[#09090b] rounded-lg border border-slate-200 dark:border-zinc-800 text-xs font-mono text-slate-800 dark:text-zinc-200 space-y-1 transition-all">
            <div className="flex items-center space-x-1.5 text-slate-500 dark:text-zinc-400 text-xs font-semibold">
              <Code2 className="w-3.5 h-3.5" />
              <span>Published Formula</span>
            </div>
            <code className="text-xs font-bold text-emerald-600 dark:text-emerald-400 block break-all pt-1">
              {formula}
            </code>
          </div>
        )}
      </div>

      {/* Footer Toggle */}
      <div className="pt-3 mt-3 border-t border-slate-100 dark:border-zinc-800/80 flex items-center justify-between text-xs font-medium text-slate-600 dark:text-zinc-400">
        <span className="font-mono">
          Coverage: {(factor.reading.coverage * 100).toFixed(0)}%
        </span>
        <button
          onClick={() => setShowFormula(!showFormula)}
          className="hover:text-slate-900 dark:hover:text-white flex items-center space-x-1 font-mono transition-colors font-semibold"
        >
          <span>{showFormula ? "Hide Math" : "Show Math"}</span>
          {showFormula ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>
    </div>
  );
}
