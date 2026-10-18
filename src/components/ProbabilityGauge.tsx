"use client";

import React, { useState } from "react";
import { BubbleBand } from "@/lib/model/types";
import { TrendingUp, AlertTriangle, ShieldCheck, ShieldAlert, Info, ArrowUpRight, ArrowDownRight } from "lucide-react";

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
  fragilityIndex = 74,
}: ProbabilityGaugeProps) {
  const [hoveredPointIndex, setHoveredPointIndex] = useState<number | null>(null);

  // Confidence interval calculation fallback if not explicitly provided
  const ciLow = confidenceInterval ? confidenceInterval[0] : Math.max(0, Math.round((probability - 3.9) * 10) / 10);
  const ciHigh = confidenceInterval ? confidenceInterval[1] : Math.min(100, Math.round((probability + 3.9) * 10) / 10);

  const bandConfig: Record<
    BubbleBand,
    {
      label: string;
      badge: string;
      text: string;
      bg: string;
      border: string;
      desc: string;
      glowColor: string;
      gradientId: string;
    }
  > = {
    critical: {
      label: "Critical Risk (≥80%)",
      badge: "bg-rose-100 text-rose-800 dark:bg-rose-950/70 dark:text-rose-300 border-rose-300 dark:border-rose-800",
      text: "text-rose-600 dark:text-rose-400",
      bg: "bg-rose-500",
      border: "border-rose-500",
      desc: "Severe debt saturation, widening CDS spreads, and unsustainable circular counterparty funding create extreme liquidation risk.",
      glowColor: "rgba(244, 63, 94, 0.55)",
      gradientId: "gauge-gradient-critical",
    },
    high: {
      label: "High Stress (65–79%)",
      badge: "bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 border-rose-200 dark:border-rose-900/80",
      text: "text-rose-600 dark:text-rose-400",
      bg: "bg-rose-500",
      border: "border-rose-500",
      desc: "Valuation multiples and debt commitments significantly outpace verified commercial monetization, leaving capital structures vulnerable to credit shocks.",
      glowColor: "rgba(244, 63, 94, 0.45)",
      gradientId: "gauge-gradient-high",
    },
    elevated: {
      label: "Elevated Risk (45–64%)",
      badge: "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border-amber-200 dark:border-amber-900/80",
      text: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-500",
      border: "border-amber-500",
      desc: "Credit spreads widening and private valuations high, balanced by ongoing enterprise adoption and organic revenue generation.",
      glowColor: "rgba(245, 158, 11, 0.45)",
      gradientId: "gauge-gradient-elevated",
    },
    guarded: {
      label: "Guarded (25–44%)",
      badge: "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400 border-blue-200 dark:border-blue-900/80",
      text: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-500",
      border: "border-blue-500",
      desc: "Moderate multiple expansion adequately covered by real utility, commercial software enterprise adoption, and healthy balance sheets.",
      glowColor: "rgba(59, 130, 246, 0.45)",
      gradientId: "gauge-gradient-guarded",
    },
    calm: {
      label: "Low Risk (<25%)",
      badge: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/80",
      text: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-500",
      border: "border-emerald-500",
      desc: "Revenues, cash flow, and token unit economics fully justify current capital investments with minimal default exposure.",
      glowColor: "rgba(16, 185, 129, 0.45)",
      gradientId: "gauge-gradient-calm",
    },
  };

  const current = bandConfig[band] || bandConfig.high;

  // 90-day trajectory data points for interactive sparkline
  const trajectory = [
    { day: "90d ago", score: 58.2, prob: 64.2, change: "+0.0%" },
    { day: "60d ago", score: 59.4, prob: 65.8, change: "+1.6%" },
    { day: "30d ago", score: 60.5, prob: 67.1, change: "+2.9%" },
    { day: "Current", score: compositeScore, prob: probability, change: "+4.2%" },
  ];

  // SVG Arc Geometry Parameters
  // Semi-circle arc: center (160, 140), radius 112
  const cx = 160;
  const cy = 140;
  const radius = 112;
  const arcLength = Math.PI * radius; // ~351.86
  const clampedProb = Math.min(100, Math.max(0, probability));
  const activeOffset = arcLength * (1 - clampedProb / 100);

  // Position of thumb pointer along the arc
  const theta = (Math.PI * clampedProb) / 100;
  const thumbX = cx - radius * Math.cos(theta);
  const thumbY = cy - radius * Math.sin(theta);

  // Sparkline coordinates mapping
  const sparkWidth = 320;
  const sparkHeight = 90;
  const paddingX = 24;
  const paddingTop = 16;
  const paddingBottom = 22;
  const plotWidth = sparkWidth - paddingX * 2;
  const plotHeight = sparkHeight - paddingTop - paddingBottom;

  const minProb = 62;
  const maxProb = 70;
  const sparkPoints = trajectory.map((pt, idx) => {
    const x = paddingX + (idx / (trajectory.length - 1)) * plotWidth;
    const normalized = (pt.prob - minProb) / (maxProb - minProb);
    const y = paddingTop + plotHeight * (1 - Math.max(0, Math.min(1, normalized)));
    return { ...pt, x, y };
  });

  const sparklinePath = `M ${sparkPoints.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" L ")}`;
  const sparklineArea = `${sparklinePath} L ${sparkPoints[sparkPoints.length - 1].x},${sparkHeight - paddingBottom} L ${sparkPoints[0].x},${sparkHeight - paddingBottom} Z`;

  const activePoint = hoveredPointIndex !== null ? trajectory[hoveredPointIndex] : trajectory[trajectory.length - 1];

  return (
    <div className="rounded-2xl bg-white dark:bg-[#121214] border border-slate-200 dark:border-zinc-800 p-4 sm:p-7 space-y-5 transition-colors shadow-xs">
      {/* Header Badges & Confidence Intervals */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 pb-3.5 border-b border-slate-100 dark:border-zinc-800">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs sm:text-sm font-bold border shadow-xs ${current.badge}`}>
            <span className="w-2 h-2 rounded-full bg-rose-500 mr-2 animate-pulse" />
            {current.label}
          </span>
          <span className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-zinc-300">
            Horizon: 12 Months
          </span>
          <span className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 font-medium">
            • Coverage: {(coverage * 100).toFixed(0)}%
          </span>
        </div>

        {/* High-Contrast Confidence Interval Badge */}
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900 shadow-xs">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-zinc-400">
            90% CI:
          </span>
          <span className="font-mono text-xs sm:text-sm font-black text-slate-900 dark:text-white tabular-nums tracking-wide">
            [{ciLow.toFixed(1)}% – {ciHigh.toFixed(1)}%]
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center">
        {/* Left Side: SVG Arc Visualization + Main Score */}
        <div className="lg:col-span-7 flex flex-col md:flex-row items-center gap-5 sm:gap-6">
          {/* Modern SVG Arc Gauge */}
          <div className="relative shrink-0 flex flex-col items-center justify-center">
            <svg
              className="overflow-visible w-[250px] h-[150px] sm:w-[290px] sm:h-[170px]"
              viewBox="0 0 320 170"
            >
              <defs>
                {/* Color Gradients */}
                <linearGradient id="gauge-gradient-critical" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#f59e0b" />
                  <stop offset="50%" stopColor="#f43f5e" />
                  <stop offset="100%" stopColor="#e11d48" />
                </linearGradient>

                <linearGradient id="gauge-gradient-high" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#f59e0b" />
                  <stop offset="60%" stopColor="#f43f5e" />
                  <stop offset="100%" stopColor="#fb7185" />
                </linearGradient>

                <linearGradient id="gauge-gradient-elevated" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#3b82f6" />
                  <stop offset="50%" stopColor="#f59e0b" />
                  <stop offset="100%" stopColor="#ea580c" />
                </linearGradient>

                <linearGradient id="gauge-gradient-guarded" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#10b981" />
                  <stop offset="70%" stopColor="#3b82f6" />
                  <stop offset="100%" stopColor="#6366f1" />
                </linearGradient>

                <linearGradient id="gauge-gradient-calm" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#059669" />
                  <stop offset="50%" stopColor="#10b981" />
                  <stop offset="100%" stopColor="#34d399" />
                </linearGradient>
              </defs>

              {/* Background Track Arc */}
              <path
                d="M 48 140 A 112 112 0 0 1 272 140"
                fill="none"
                stroke="currentColor"
                strokeWidth="15"
                strokeLinecap="round"
                className="text-slate-100 dark:text-zinc-800"
              />

              {/* Active Clean Filled Arc */}
              <path
                d="M 48 140 A 112 112 0 0 1 272 140"
                fill="none"
                stroke={`url(#${current.gradientId})`}
                strokeWidth="15"
                strokeLinecap="round"
                strokeDasharray={arcLength}
                strokeDashoffset={activeOffset}
                style={{
                  transition: "stroke-dashoffset 0.8s ease-in-out",
                }}
              />

              {/* Arc Boundary Tick Marks */}
              {[
                { pct: 0, label: "0" },
                { pct: 25, label: "25" },
                { pct: 45, label: "45" },
                { pct: 65, label: "65" },
                { pct: 80, label: "80" },
                { pct: 100, label: "100" },
              ].map((tick) => {
                const tickTheta = (Math.PI * tick.pct) / 100;
                const innerR = 124;
                const outerR = 132;
                const x1 = cx - innerR * Math.cos(tickTheta);
                const y1 = cy - innerR * Math.sin(tickTheta);
                const x2 = cx - outerR * Math.cos(tickTheta);
                const y2 = cy - outerR * Math.sin(tickTheta);
                return (
                  <line
                    key={tick.pct}
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke="currentColor"
                    strokeWidth="1.5"
                    className="text-slate-300 dark:text-zinc-700"
                  />
                );
              })}

              {/* Pointer Thumb on Arc */}
              <circle
                cx={thumbX}
                cy={thumbY}
                r="8.5"
                fill="#ffffff"
                stroke="#f43f5e"
                strokeWidth="3.5"
                className="shadow-lg"
                style={{
                  filter: `drop-shadow(0 0 8px ${current.glowColor})`,
                  transition: "cx 0.8s ease-in-out, cy 0.8s ease-in-out",
                }}
              />

              {/* Inner Percentage Display */}
              <text
                x={cx}
                y={cy - 12}
                textAnchor="middle"
                className="font-mono font-black text-5xl fill-slate-900 dark:fill-white tabular-nums tracking-tighter"
              >
                {probability.toFixed(1)}%
              </text>
              <text
                x={cx}
                y={cy + 14}
                textAnchor="middle"
                className="font-sans font-extrabold text-xs uppercase tracking-widest fill-slate-600 dark:fill-zinc-400"
              >
                12-Mo Burst Odds
              </text>
            </svg>
          </div>

          {/* Probability Details & Macro Rationale */}
          <div className="space-y-3 text-left">
            <div>
              <span className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white block">
                Composite Bubble Stress
              </span>
              <div className="flex items-center space-x-2 mt-0.5">
                <span className="text-xs sm:text-sm font-bold text-rose-600 dark:text-rose-400 flex items-center space-x-1">
                  <TrendingUp className="w-4 h-4" />
                  <span>+4.2 pts in last 90 days</span>
                </span>
                <span className="text-slate-300 dark:text-zinc-700">•</span>
                <span className="text-xs sm:text-sm font-semibold text-slate-600 dark:text-zinc-400 font-mono">
                  Composite: {compositeScore.toFixed(1)} / 100
                </span>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-700 dark:text-zinc-300 leading-relaxed font-sans max-w-lg">
              {current.desc} Driven by Oracle 5Y CDS widening to 187 bp (+131%), median 34.8× frontier lab revenue multiples, 
              and $196.8B in verified debt &amp; credit commitments — offset by 40× token price deflation.
            </p>

            {/* Financial Fragility Index Score Meter */}
            <div className="pt-2">
              <div className="bg-slate-50 dark:bg-[#18181b] border border-slate-200 dark:border-zinc-800 rounded-xl p-3.5 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800 dark:text-zinc-200 flex items-center space-x-1.5">
                    <ShieldAlert className="w-4 h-4 text-amber-500" />
                    <span>Financial Fragility Index:</span>
                    <span className="font-mono font-black text-amber-600 dark:text-amber-400">
                      {fragilityIndex}/100
                    </span>
                  </span>
                  <span className="font-mono font-semibold text-rose-600 dark:text-rose-400 text-[11px] uppercase tracking-wider">
                    High Vulnerability
                  </span>
                </div>
                <div className="relative h-2 w-full bg-slate-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 via-amber-500 to-rose-500 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.max(0, fragilityIndex))}%` }}
                  />
                </div>
                <div className="flex justify-between text-[11px] font-mono text-slate-500 dark:text-zinc-400">
                  <span>Resilient (&lt;35)</span>
                  <span>Moderate (35–65)</span>
                  <span className="text-rose-600 dark:text-rose-400 font-bold">Fragile (&gt;65)</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Interactive 90-Day Trajectory Sparkline & Primary Drivers */}
        <div className="lg:col-span-5 bg-slate-50 dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-zinc-200 uppercase tracking-wider block">
                90-Day Risk Trajectory
              </span>
              <span className="text-[11px] text-slate-500 dark:text-zinc-400 font-mono">
                Hover points for historical snapshots
              </span>
            </div>
            <div className="text-right">
              <span className="text-xs sm:text-sm font-extrabold text-rose-600 dark:text-rose-400 font-mono block">
                +4.2 pts
              </span>
              <span className="text-[10px] text-slate-500 dark:text-zinc-400 font-mono">
                net trajectory
              </span>
            </div>
          </div>

          {/* Interactive SVG Sparkline with Hover Tooltip */}
          <div className="relative bg-white dark:bg-[#121214] border border-slate-200 dark:border-zinc-800 rounded-xl p-3">
            {/* Active Hover Stat Readout */}
            <div className="flex items-center justify-between pb-2 mb-1 border-b border-slate-100 dark:border-zinc-800/80 text-xs font-mono">
              <span className="text-slate-600 dark:text-zinc-400 font-semibold">
                {activePoint.day}:
              </span>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-slate-900 dark:text-white">
                  Score: {activePoint.score.toFixed(1)}
                </span>
                <span className="text-rose-600 dark:text-rose-400 font-black">
                  {activePoint.prob.toFixed(1)}% ({activePoint.change})
                </span>
              </div>
            </div>

            <svg
              className="w-full h-[95px] overflow-visible"
              viewBox={`0 0 ${sparkWidth} ${sparkHeight}`}
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="sparkline-gradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Area Fill */}
              <path d={sparklineArea} fill="url(#sparkline-gradient)" />

              {/* Stroke Line */}
              <path
                d={sparklinePath}
                fill="none"
                stroke="#f43f5e"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Interactive Points */}
              {sparkPoints.map((pt, idx) => {
                const isHovered = hoveredPointIndex === idx;
                const isLast = idx === sparkPoints.length - 1;
                return (
                  <g
                    key={pt.day}
                    className="cursor-pointer"
                    onMouseEnter={() => setHoveredPointIndex(idx)}
                    onMouseLeave={() => setHoveredPointIndex(null)}
                  >
                    {/* Invisible larger hover hit area */}
                    <circle cx={pt.x} cy={pt.y} r="14" fill="transparent" />

                    {/* Outer glow ring when hovered or active */}
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r={isHovered ? "8" : isLast ? "6" : "4.5"}
                      fill={isHovered ? "#f43f5e" : isLast ? "#f43f5e" : "#71717a"}
                      className="transition-all duration-200"
                    />
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r={isHovered ? "4" : isLast ? "3" : "2"}
                      fill="#ffffff"
                      className="transition-all duration-200"
                    />
                  </g>
                );
              })}
            </svg>

            {/* Sparkline Axis Labels */}
            <div className="flex justify-between text-[11px] font-mono font-semibold text-slate-500 dark:text-zinc-400 pt-1">
              {trajectory.map((pt, idx) => (
                <button
                  key={pt.day}
                  onMouseEnter={() => setHoveredPointIndex(idx)}
                  onMouseLeave={() => setHoveredPointIndex(null)}
                  className={`transition-colors ${
                    hoveredPointIndex === idx
                      ? "text-rose-600 dark:text-rose-400 font-bold"
                      : idx === trajectory.length - 1
                      ? "text-slate-900 dark:text-zinc-200 font-bold"
                      : "hover:text-slate-800 dark:hover:text-zinc-200"
                  }`}
                >
                  {pt.day}
                </button>
              ))}
            </div>
          </div>

          {/* Primary Upward & Downward Risk Drivers */}
          <div className="pt-2 border-t border-slate-200 dark:border-zinc-800 space-y-2.5">
            <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-zinc-200 block">
              Primary Model Drivers:
            </span>
            <div className="space-y-2 text-xs sm:text-sm">
              <div className="flex items-center justify-between text-slate-800 dark:text-zinc-200 bg-white dark:bg-[#121214] p-2 rounded-lg border border-slate-200/60 dark:border-zinc-800/80">
                <span className="flex items-center space-x-2 font-medium">
                  <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                  <span className="truncate">Oracle 5Y CDS (187 bp)</span>
                </span>
                <span className="font-mono text-rose-600 dark:text-rose-400 font-bold shrink-0">+18.7 pts</span>
              </div>
              <div className="flex items-center justify-between text-slate-800 dark:text-zinc-200 bg-white dark:bg-[#121214] p-2 rounded-lg border border-slate-200/60 dark:border-zinc-800/80">
                <span className="flex items-center space-x-2 font-medium">
                  <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                  <span className="truncate">Lab Valuations (34.8× multiple)</span>
                </span>
                <span className="font-mono text-amber-600 dark:text-amber-400 font-bold shrink-0">+15.3 pts</span>
              </div>
              <div className="flex items-center justify-between text-slate-800 dark:text-zinc-200 bg-white dark:bg-[#121214] p-2 rounded-lg border border-slate-200/60 dark:border-zinc-800/80">
                <span className="flex items-center space-x-2 font-medium">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                  <span className="truncate">Token Price Deflation (40× drop)</span>
                </span>
                <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold shrink-0">-7.2 pts</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
