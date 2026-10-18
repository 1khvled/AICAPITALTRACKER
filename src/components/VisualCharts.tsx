"use client";

import React, { useState } from "react";
import { MODEL_CALIBRATION } from "@/lib/model/factors";
import { TrendingUp, BarChart2, PieChart, Activity, DollarSign, AlertCircle, Zap, ShieldAlert } from "lucide-react";

/**
 * 1. Visualizes the logistic sigmoid calibration curve:
 * P(burst) = 1 / (1 + exp(-(Score - 55) / 9))
 * Color: Monochromatic neutral grid with a single red live marker.
 */
export function SensitivityCurveChart({
  currentScore = 61.2,
  currentProb = 68.4,
}: {
  currentScore?: number;
  currentProb?: number;
}) {
  const points = [];
  for (let s = 20; s <= 90; s += 2) {
    const prob = MODEL_CALIBRATION.mapping(s) * 100;
    points.push({ score: s, prob });
  }

  const width = 600;
  const height = 230;
  const padding = 35;

  const toX = (score: number) => padding + ((score - 20) / (90 - 20)) * (width - padding * 2);
  const toY = (prob: number) => height - padding - (prob / 100) * (height - padding * 2);

  const pathD = points.reduce((acc, p, idx) => {
    const x = toX(p.score);
    const y = toY(p.prob);
    return idx === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
  }, "");

  const currX = toX(currentScore);
  const currY = toY(currentProb);

  return (
    <div className="p-5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#121214] space-y-3 transition-colors shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-mono text-slate-500 dark:text-zinc-400 font-bold uppercase tracking-wider">
            CALIBRATION SIGMOID
          </span>
          <h4 className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
            Score-to-Probability Mathematical Response
          </h4>
        </div>
        <span className="text-xs font-mono font-medium text-slate-500 dark:text-zinc-400">
          Anchor: 55 pts = 50% baseline
        </span>
      </div>

      <div className="relative overflow-x-auto">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto min-w-[480px]">
          {/* Y Gridlines */}
          {[0, 25, 50, 75, 100].map((p) => {
            const y = toY(p);
            return (
              <g key={p} opacity="0.3">
                <line x1={padding} y1={y} x2={width - padding} y2={y} stroke="#94a3b8" strokeDasharray="3 3" />
                <text x={padding - 6} y={y + 3} textAnchor="end" fontSize="10" fill="#94a3b8" fontFamily="monospace">
                  {p}%
                </text>
              </g>
            );
          })}

          {/* X Axis Labels */}
          {[30, 45, 55, 65, 80].map((s) => {
            const x = toX(s);
            return (
              <text key={s} x={x} y={height - 12} textAnchor="middle" fontSize="10" fill="#94a3b8" fontFamily="monospace">
                {s} pts
              </text>
            );
          })}

          {/* Sigmoid Curve Path (Clean slate-zinc neutral) */}
          <path d={pathD} fill="none" stroke="#64748b" strokeWidth="2.5" />

          {/* Critical inflection zone highlight (score 55 to 75) */}
          <rect
            x={toX(55)}
            y={toY(100)}
            width={toX(75) - toX(55)}
            height={height - padding * 2}
            fill="#f43f5e"
            fillOpacity="0.06"
          />

          {/* Live Point (ONLY place with bright red) */}
          <circle cx={currX} cy={currY} r="5" fill="#f43f5e" stroke="#ffffff" strokeWidth="2" />
          <line x1={currX} y1={toY(0)} x2={currX} y2={currY} stroke="#f43f5e" strokeDasharray="2 2" strokeWidth="1.5" />

          {/* Annotation */}
          <g transform={`translate(${currX - 55}, ${currY - 26})`}>
            <rect width="110" height="20" rx="4" fill="#18181b" stroke="#27272a" />
            <text x="55" y="14" textAnchor="middle" fill="#ffffff" fontSize="10" fontFamily="monospace" fontWeight="bold">
              LIVE: {currentProb.toFixed(1)}% (S={currentScore.toFixed(1)})
            </text>
          </g>
        </svg>
      </div>

      <div className="flex items-center justify-between text-xs sm:text-sm font-mono text-slate-500 dark:text-zinc-400 pt-2 border-t border-slate-100 dark:border-zinc-800">
        <span>Formula: P = 1 / (1 + e^-(S-55)/9)</span>
        <span className="text-rose-600 dark:text-rose-400 font-bold">
          High Stress Regime (Score &gt; 55)
        </span>
      </div>
    </div>
  );
}

/**
 * 2. Visualizes the AI Revenue Gap:
 * Hyperscaler Infrastructure Capex vs verified End-User Software Revenue.
 * Color discipline: Neutral dark bars, single red gap bar.
 */
export function AiRevenueGapChart() {
  const data = [
    { label: "Annual Hyperscaler Capex", amount: 210, display: "$210B", note: "GPUs, datacenters, fiber", isStress: true },
    { label: "Depreciation & Power Opex", amount: 65, display: "$65B", note: "Annual power & hardware wear", isStress: true },
    { label: "End-User Software Revenue", amount: 38, display: "$38B", note: "All LLM APIs & seat licenses", isRevenue: true },
  ];

  const gap = 210 + 65 - 38; // $237B gap

  return (
    <div className="p-5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#121214] space-y-4 transition-colors shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-mono text-rose-600 dark:text-rose-400 font-bold uppercase tracking-wider">
            STRUCTURAL IMBALANCE
          </span>
          <h4 className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
            The $237B Annual AI Revenue Gap
          </h4>
        </div>
        <span className="text-xs font-mono font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-2.5 py-1 rounded border border-rose-200 dark:border-rose-900/60">
          -$237B Net Deficit
        </span>
      </div>

      <div className="space-y-3">
        {data.map((item) => {
          const widthPct = (item.amount / 240) * 100;
          return (
            <div key={item.label} className="space-y-1.5">
              <div className="flex justify-between text-xs sm:text-sm font-mono">
                <span className="font-semibold text-slate-800 dark:text-zinc-200">
                  {item.label} <span className="text-xs text-slate-500 dark:text-zinc-400 font-normal">({item.note})</span>
                </span>
                <span className="font-bold text-slate-900 dark:text-white font-tabular">
                  {item.display}
                </span>
              </div>
              <div className="h-3 w-full bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    item.isRevenue
                      ? "bg-emerald-500"
                      : "bg-slate-700 dark:bg-zinc-400"
                  }`}
                  style={{ width: `${widthPct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="p-3 rounded-lg bg-slate-50 dark:bg-[#09090b] border border-slate-100 dark:border-zinc-800 flex items-start space-x-2 text-xs sm:text-sm">
        <span className="text-rose-500 font-bold shrink-0">⚠️ Gap Analysis:</span>
        <span className="text-slate-700 dark:text-zinc-300 font-sans leading-relaxed">
          Hyperscalers are investing $7.20 in compute infrastructure for every $1.00 of end-user software subscription revenue generated today.
        </span>
      </div>
    </div>
  );
}

/**
 * 3. Token Price Deflation Curve:
 * 200x collapse in inference cost per 1M tokens.
 * Color discipline: Single clean emerald curve.
 */
export function TokenPriceDeflationChart() {
  const milestones = [
    { date: "Mar 2023", model: "GPT-4 Original", cost: 30.0, display: "$30.00" },
    { date: "Nov 2023", model: "GPT-4 Turbo", cost: 10.0, display: "$10.00" },
    { date: "May 2024", model: "GPT-4o / Claude 3.5", cost: 5.0, display: "$5.00" },
    { date: "Dec 2024", model: "Gemini 1.5 Flash", cost: 0.35, display: "$0.35" },
    { date: "2026 Today", model: "GPT-4o-mini / Haiku", cost: 0.15, display: "$0.15" },
  ];

  return (
    <div className="p-5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#121214] space-y-4 transition-colors shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider">
            PRODUCTIVITY DAMPER
          </span>
          <h4 className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
            Inference Token Cost Collapse (200× Cheaper)
          </h4>
        </div>
        <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded border border-emerald-200 dark:border-emerald-900/60">
          -99.5% Unit Cost
        </span>
      </div>

      <div className="space-y-3">
        {milestones.map((m, idx) => {
          // Logarithmic bar length for visual balance
          const logPct = Math.max(8, (Math.log10(m.cost * 10) / Math.log10(300)) * 100);
          return (
            <div key={m.model} className="space-y-1.5">
              <div className="flex justify-between text-xs sm:text-sm font-mono">
                <span className="font-semibold text-slate-800 dark:text-zinc-200">
                  {m.model} <span className="text-xs text-slate-500 dark:text-zinc-400 font-normal">({m.date})</span>
                </span>
                <span className="font-bold text-slate-900 dark:text-white font-tabular">
                  {m.display} / 1M
                </span>
              </div>
              <div className="h-2.5 w-full bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                  style={{ width: `${logPct}%`, opacity: 0.4 + (idx * 0.15) }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-300 font-sans leading-relaxed">
        Unlike the 2000 fiber glut where bandwidth remained expensive to route, AI unit costs are plummeting, enabling genuine enterprise utility and cushioning the bubble probability by -7.2 points.
      </p>
    </div>
  );
}

/**
 * 4. Visualizes Private Lab Valuation Multiples:
 * Color discipline: Neutral dark bars, single red highlight on extreme multiples.
 */
export function LabMultiplesChart() {
  const labs = [
    { name: "Mistral AI", multiple: 139.4, val: "€21B", rev: "€150M", isExtreme: true },
    { name: "xAI Colossus", multiple: 100.0, val: "$50B", rev: "$500M", isExtreme: true },
    { name: "OpenAI", multiple: 42.4, val: "$157B", rev: "$3.7B", isMedian: true },
    { name: "Databricks", multiple: 27.1, val: "$190B", rev: "$7.0B" },
    { name: "Scale AI", multiple: 15.3, val: "$13.8B", rev: "$900M" },
    { name: "Anthropic", multiple: 14.1, val: "$65B", rev: "$4.6B", isDebtExposed: true },
    { name: "Historical Tech Peak (2000)", multiple: 32.0, val: "Benchmark", rev: "Equilibrium", isBenchmark: true },
  ];

  return (
    <div className="p-5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#121214] space-y-4 transition-colors shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-mono text-amber-600 dark:text-amber-400 font-bold uppercase tracking-wider">
            VALUATION MULTIPLES
          </span>
          <h4 className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
            Frontier Lab Price-to-Sales (P/S) Multiples
          </h4>
        </div>
        <span className="text-xs font-mono font-bold text-slate-900 dark:text-white bg-slate-100 dark:bg-zinc-800 px-2.5 py-1 rounded">
          Median: 34.8×
        </span>
      </div>

      <div className="space-y-3">
        {labs.map((lab) => {
          const barWidth = Math.min(100, Math.max(5, (lab.multiple / 140) * 100));
          return (
            <div key={lab.name} className="space-y-1.5">
              <div className="flex justify-between text-xs sm:text-sm font-mono">
                <span className={`font-semibold ${lab.isBenchmark ? "text-slate-400 dark:text-zinc-500 italic" : "text-slate-800 dark:text-zinc-200"}`}>
                  {lab.name} <span className="text-xs text-slate-500 dark:text-zinc-400 font-normal">({lab.val} / {lab.rev})</span>
                  {lab.isDebtExposed && (
                    <span className="ml-1.5 text-[10px] font-mono text-rose-500 font-semibold bg-rose-50 dark:bg-rose-950/40 px-1.5 py-0.5 rounded border border-rose-200 dark:border-rose-900/60">
                      $57B Debt
                    </span>
                  )}
                </span>
                <span className={`font-bold font-tabular ${lab.isExtreme ? "text-rose-600 dark:text-rose-400" : "text-slate-900 dark:text-white"}`}>
                  {lab.multiple.toFixed(1)}×
                </span>
              </div>
              <div className="h-2.5 w-full bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    lab.isExtreme
                      ? "bg-rose-500"
                      : lab.isBenchmark
                      ? "bg-slate-300 dark:bg-zinc-700"
                      : "bg-slate-700 dark:bg-zinc-400"
                  }`}
                  style={{ width: `${barWidth}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="pt-2 border-t border-slate-100 dark:border-zinc-800 flex justify-between text-xs sm:text-sm font-mono text-slate-500 dark:text-zinc-400">
        <span>Historical SaaS Median: 8× – 12×</span>
        <span className="text-rose-600 dark:text-rose-400 font-bold">3.0× – 11× above equilibrium</span>
      </div>
    </div>
  );
}

/**
 * 5. Visualizes Capital Breakdown by Deal Category:
 * Clean, disciplined styling.
 */
export function CapitalCompositionChart() {
  const slices = [
    { label: "Compute Capacity Contracts", share: 25.3, amount: "$712B", color: "#71717a" },
    { label: "Big Construction & Facilities", share: 23.9, amount: "$672B", color: "#52525b" },
    { label: "Equity Rounds & Strategic Bets", share: 19.0, amount: "$534B", color: "#3f3f46" },
    { label: "M&A & Platform Buyouts", share: 15.4, amount: "$432B", color: "#27272a" },
    { label: "Borrowed Debt & Converts", share: 7.0, amount: "$197B", color: "#f43f5e" },
    { label: "Power, Land & Other", share: 9.4, amount: "$264B", color: "#18181b" },
  ];

  return (
    <div className="p-5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#121214] space-y-4 transition-colors shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-mono text-slate-500 dark:text-zinc-400 font-bold uppercase tracking-wider">
            CAPITAL ALLOCATION
          </span>
          <h4 className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
            $2.81T Tracked Disclosures: Capital Composition
          </h4>
        </div>
        <span className="text-xs font-mono font-semibold text-slate-600 dark:text-zinc-400">
          159 Verified Deals
        </span>
      </div>

      {/* Stacked Horizontal Bar */}
      <div className="h-4 w-full bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden flex">
        {slices.map((s) => (
          <div
            key={s.label}
            style={{ width: `${s.share}%`, backgroundColor: s.color }}
            title={`${s.label}: ${s.share}% (${s.amount})`}
          />
        ))}
      </div>

      {/* Legend Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 pt-1 text-xs font-mono">
        {slices.map((s) => (
          <div key={s.label} className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-[#09090b] border border-slate-100 dark:border-zinc-800">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />
              <span className="text-slate-800 dark:text-zinc-200 text-xs font-medium truncate max-w-[140px]">
                {s.label}
              </span>
            </div>
            <div className="text-right">
              <span className={`font-bold font-tabular text-xs sm:text-sm ${s.label.includes("Debt") ? "text-rose-600 dark:text-rose-400" : "text-slate-900 dark:text-white"}`}>
                {s.amount}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * 6. Visualizes Yearly Surge:
 */
export function YearlySurgeChart() {
  const years = [
    { year: "2023", volume: 26, label: "$26B", count: 8, heightPct: 15 },
    { year: "2024", volume: 295, label: "$295B", count: 48, heightPct: 35 },
    { year: "2025", volume: 1720, label: "$1.72T", count: 77, heightPct: 100 },
    { year: "2026 (YTD)", volume: 769, label: "$769B", count: 26, heightPct: 55 },
  ];

  return (
    <div className="p-5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#121214] space-y-4 transition-colors shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-mono text-slate-500 dark:text-zinc-400 font-bold uppercase tracking-wider">
            VELOCITY ACCELERATION
          </span>
          <h4 className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
            Capital Deployment Surge by Year
          </h4>
        </div>
        <span className="text-xs font-mono font-medium text-slate-500 dark:text-zinc-400">
          2023 → 2026
        </span>
      </div>

      <div className="h-40 flex items-end justify-between gap-4 pt-4 px-4 pb-2 bg-slate-50 dark:bg-[#09090b] rounded-xl border border-slate-100 dark:border-zinc-800">
        {years.map((y) => (
          <div key={y.year} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
            <span className="text-xs sm:text-sm font-mono font-bold text-slate-900 dark:text-white font-tabular">
              {y.label}
            </span>
            <div
              className="w-full max-w-[50px] rounded-t-md bg-slate-700 dark:bg-zinc-400 hover:opacity-85 transition-all"
              style={{ height: `${y.heightPct}%` }}
              title={`${y.year}: ${y.label} across ${y.count} deals`}
            />
            <span className="text-xs font-mono font-semibold text-slate-600 dark:text-zinc-400 pt-1">
              {y.year}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * 7. Visualizes Oracle CDS spread timeline:
 * Color discipline: Red warning tag on latest 187 bp spike.
 */
export function CdsTrajectoryChart() {
  const steps = [
    { label: "Mid-2025 Baseline", value: 81, status: "Normal", isWarning: false },
    { label: "90 Days Prior", value: 155, status: "Widening", isWarning: false },
    { label: "Latest Reading", value: 187, status: "Extreme (+131%)", isWarning: true },
  ];

  return (
    <div className="p-5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#121214] space-y-4 transition-colors shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-mono text-rose-600 dark:text-rose-400 font-bold uppercase tracking-wider">
            CREDIT RADAR
          </span>
          <h4 className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
            Oracle 5Y CDS Spread Trajectory
          </h4>
        </div>
        <span className="text-xs font-mono font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-2.5 py-1 rounded border border-rose-200 dark:border-rose-900/60">
          +32 bp (90d)
        </span>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {steps.map((s) => (
          <div
            key={s.label}
            className={`p-3.5 rounded-xl border text-center space-y-1.5 ${
              s.isWarning
                ? "bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/60 shadow-sm"
                : "bg-slate-50 dark:bg-[#09090b] border-slate-100 dark:border-zinc-800"
            }`}
          >
            <span className="text-xs font-mono text-slate-500 dark:text-zinc-400 block truncate font-medium">
              {s.label}
            </span>
            <div
              className={`text-2xl font-black font-mono font-tabular ${
                s.isWarning ? "text-rose-600 dark:text-rose-400" : "text-slate-900 dark:text-white"
              }`}
            >
              {s.value} <span className="text-xs font-semibold">bp</span>
            </div>
            <span
              className={`text-xs font-mono block ${
                s.isWarning ? "text-rose-600 dark:text-rose-400 font-bold" : "text-slate-600 dark:text-zinc-400 font-medium"
              }`}
            >
              {s.status}
            </span>
          </div>
        ))}
      </div>

      <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-300 font-sans leading-relaxed">
        CDS spreads represent default insurance costs on debt. In 2008 and 2001, credit widening preceded stock market contractions by 3 to 6 months.
      </p>
    </div>
  );
}
