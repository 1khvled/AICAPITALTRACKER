"use client";

import React, { useState, useRef, useMemo, useCallback } from "react";
import { MODEL_CALIBRATION } from "@/lib/model/factors";
import {
  TrendingUp,
  BarChart2,
  PieChart,
  Activity,
  DollarSign,
  AlertCircle,
  Zap,
  ShieldAlert,
  Layers,
  ArrowUpRight,
  Info,
  Maximize2,
  Sliders,
  Sparkles,
  ArrowRight,
  HelpCircle,
  ChevronRight,
  CheckCircle2,
} from "lucide-react";

// ============================================================================
// 1. SENSITIVITY CURVE CHART (Cubic Bezier, Confidence Band, Interactive Crosshairs)
// ============================================================================

/**
 * Visualizes the logistic sigmoid calibration curve:
 * P(burst) = 1 / (1 + exp(-(Score - 55) / 9))
 * Upgraded with:
 * - Smooth cubic bezier curve rendering
 * - Shaded 90% confidence corridor / sensitivity band
 * - Interactive crosshairs with snapping coordinate tooltip
 * - Interactive score simulator slider
 * - High-contrast institutional dark styling
 */
export function SensitivityCurveChart({
  currentScore = 51.0,
  currentProb = 39.1,
}: {
  currentScore?: number;
  currentProb?: number;
}) {
  const [hoveredScore, setHoveredScore] = useState<number | null>(null);
  const [simulatedScore, setSimulatedScore] = useState<number>(currentScore);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const svgRef = useRef<SVGSVGElement | null>(null);

  const width = 720;
  const height = 300;
  const padding = { top: 30, right: 40, bottom: 45, left: 55 };

  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;

  const minScore = 20;
  const maxScore = 90;

  const toX = useCallback(
    (score: number) => padding.left + ((score - minScore) / (maxScore - minScore)) * plotWidth,
    [plotWidth, padding.left]
  );

  const toY = useCallback(
    (prob: number) => height - padding.bottom - (prob / 100) * plotHeight,
    [plotHeight, padding.bottom]
  );

  const fromX = useCallback(
    (x: number) => {
      const clampedX = Math.max(padding.left, Math.min(width - padding.right, x));
      return minScore + ((clampedX - padding.left) / plotWidth) * (maxScore - minScore);
    },
    [plotWidth, padding.left, padding.right, width]
  );

  // Model calibration mathematical evaluation
  const calcProb = useCallback((score: number) => {
    return MODEL_CALIBRATION.mapping(score) * 100;
  }, []);

  // 90% confidence interval / sensitivity bounds
  const calcUpperProb = useCallback((score: number) => {
    // Upper sensitivity bound (steeper slope, earlier inflection)
    const p = 1 / (1 + Math.exp(-(score - 52.5) / 7.8));
    return Math.min(99.5, p * 100 + 3.5);
  }, []);

  const calcLowerProb = useCallback((score: number) => {
    // Lower sensitivity bound (cushioned adoption damper)
    const p = 1 / (1 + Math.exp(-(score - 57.5) / 10.2));
    return Math.max(0.5, p * 100 - 3.5);
  }, []);

  // Sample dense points for smooth cubic curve and confidence polygon
  const { pathD, areaD, points } = useMemo(() => {
    const pts: { score: number; prob: number; upper: number; lower: number }[] = [];
    const step = 1;
    for (let s = minScore; s <= maxScore; s += step) {
      pts.push({
        score: s,
        prob: calcProb(s),
        upper: calcUpperProb(s),
        lower: calcLowerProb(s),
      });
    }

    // Cubic Bezier interpolation for silky smooth path
    let curvePath = "";
    for (let i = 0; i < pts.length; i++) {
      const x = toX(pts[i].score);
      const y = toY(pts[i].prob);
      if (i === 0) {
        curvePath += `M ${x.toFixed(2)} ${y.toFixed(2)}`;
      } else {
        const prevX = toX(pts[i - 1].score);
        const prevY = toY(pts[i - 1].prob);
        const cp1x = (prevX + (x - prevX) / 2).toFixed(2);
        const cp1y = prevY.toFixed(2);
        const cp2x = (prevX + (x - prevX) / 2).toFixed(2);
        const cp2y = y.toFixed(2);
        curvePath += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${x.toFixed(2)} ${y.toFixed(2)}`;
      }
    }

    // Confidence corridor polygon (Upper curve forward, Lower curve backward)
    let bandPath = "";
    for (let i = 0; i < pts.length; i++) {
      const x = toX(pts[i].score);
      const yUpper = toY(pts[i].upper);
      if (i === 0) {
        bandPath += `M ${x.toFixed(2)} ${yUpper.toFixed(2)}`;
      } else {
        bandPath += ` L ${x.toFixed(2)} ${yUpper.toFixed(2)}`;
      }
    }
    for (let i = pts.length - 1; i >= 0; i--) {
      const x = toX(pts[i].score);
      const yLower = toY(pts[i].lower);
      bandPath += ` L ${x.toFixed(2)} ${yLower.toFixed(2)}`;
    }
    bandPath += " Z";

    return { pathD: curvePath, areaD: bandPath, points: pts };
  }, [toX, toY, calcProb, calcUpperProb, calcLowerProb]);

  // Handle pointer tracking
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const scale = width / rect.width;
    const svgX = clientX * scale;
    const scoreVal = fromX(svgX);
    setHoveredScore(Math.round(scoreVal * 10) / 10);
  };

  const handleMouseLeave = () => {
    setHoveredScore(null);
  };

  // Determine active display values (Hovered > Simulated > Live)
  const activeScore = hoveredScore !== null ? hoveredScore : (isSimulating ? simulatedScore : currentScore);
  const activeProb = calcProb(activeScore);
  const activeUpper = calcUpperProb(activeScore);
  const activeLower = calcLowerProb(activeScore);
  const activeX = toX(activeScore);
  const activeY = toY(activeProb);

  // Regime classification
  const getRegime = (score: number) => {
    if (score < 42) return { label: "Sub-Critical / Low Risk", color: "text-emerald-500", bg: "bg-emerald-500/10 border-emerald-500/20" };
    if (score < 55) return { label: "Equilibrium Baseline", color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20" };
    if (score < 68) return { label: "Elevated Convex Inflection", color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" };
    return { label: "Hyperbolic Fragility Zone", color: "text-rose-500", bg: "bg-rose-500/10 border-rose-500/20" };
  };

  const currentRegime = getRegime(activeScore);

  return (
    <div className="p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#121214] space-y-5 transition-all shadow-sm">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-100 dark:border-zinc-800/80">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-[11px] font-mono font-bold tracking-wider uppercase text-rose-500 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded border border-rose-200 dark:border-rose-900/60">
              NON-LINEAR CALIBRATION
            </span>
            <span className="text-xs font-mono text-slate-500 dark:text-zinc-400">
              Sigmoid Mathematical Response
            </span>
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mt-1">
            Burst Probability vs Composite Stress Curve
          </h3>
        </div>

        {/* Live Status Chip */}
        <div className="flex items-center gap-3">
          <div className="flex items-center space-x-2 text-xs font-mono bg-slate-100 dark:bg-zinc-900/80 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-800">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            <span className="text-slate-600 dark:text-zinc-300">Live Reading:</span>
            <span className="font-bold text-slate-900 dark:text-white font-tabular">
              {currentProb.toFixed(1)}% ({currentScore.toFixed(1)} pts)
            </span>
          </div>
        </div>
      </div>

      {/* SVG Sensitivity Curve Chart */}
      <div className="relative select-none overflow-hidden rounded-xl bg-slate-50/70 dark:bg-[#0b0b0d] border border-slate-200/80 dark:border-zinc-800/80 p-2 sm:p-4">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto cursor-crosshair touch-none"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          <defs>
            {/* Confidence Band Gradient */}
            <linearGradient id="bandGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.08" />
              <stop offset="45%" stopColor="#f59e0b" stopOpacity="0.12" />
              <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.20" />
            </linearGradient>

            {/* Curve Line Gradient */}
            <linearGradient id="curveGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="50%" stopColor="#f59e0b" />
              <stop offset="85%" stopColor="#f43f5e" />
              <stop offset="100%" stopColor="#e11d48" />
            </linearGradient>

            {/* Glowing marker filter */}
            <filter id="glowMarker" x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow dx="0" dy="0" stdDeviation="3.5" floodColor="#f43f5e" floodOpacity="0.75" />
            </filter>
          </defs>

          {/* Regime Background Zones */}
          {/* Sub-critical Zone (<45) */}
          <rect
            x={toX(20)}
            y={padding.top}
            width={toX(45) - toX(20)}
            height={plotHeight}
            fill="#10b981"
            fillOpacity="0.02"
          />
          {/* Inflection Transition Zone (45 to 65) */}
          <rect
            x={toX(45)}
            y={padding.top}
            width={toX(65) - toX(45)}
            height={plotHeight}
            fill="#f59e0b"
            fillOpacity="0.035"
          />
          {/* High Convex Fragility Zone (>65) */}
          <rect
            x={toX(65)}
            y={padding.top}
            width={toX(90) - toX(65)}
            height={plotHeight}
            fill="#f43f5e"
            fillOpacity="0.06"
          />

          {/* Horizontal Gridlines & Y-Axis Labels */}
          {[0, 25, 50, 75, 100].map((prob) => {
            const y = toY(prob);
            const isMidline = prob === 50;
            return (
              <g key={prob}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={width - padding.right}
                  y2={y}
                  stroke={isMidline ? "#f59e0b" : "#71717a"}
                  strokeOpacity={isMidline ? 0.35 : 0.15}
                  strokeDasharray={isMidline ? "4 4" : "3 3"}
                  strokeWidth={isMidline ? 1.5 : 1}
                />
                <text
                  x={padding.left - 10}
                  y={y + 3.5}
                  textAnchor="end"
                  fontSize="11"
                  fill={isMidline ? "#f59e0b" : "#71717a"}
                  fontFamily="monospace"
                  fontWeight={isMidline ? "bold" : "normal"}
                >
                  {prob}%
                </text>
              </g>
            );
          })}

          {/* Vertical Gridlines & X-Axis Labels */}
          {[20, 30, 40, 50, 55, 60, 70, 80, 90].map((score) => {
            const x = toX(score);
            const isAnchor = score === 55;
            return (
              <g key={score}>
                <line
                  x1={x}
                  y1={padding.top}
                  x2={x}
                  y2={height - padding.bottom}
                  stroke={isAnchor ? "#f59e0b" : "#71717a"}
                  strokeOpacity={isAnchor ? 0.35 : 0.12}
                  strokeDasharray={isAnchor ? "4 4" : "2 2"}
                  strokeWidth={isAnchor ? 1.5 : 1}
                />
                <text
                  x={x}
                  y={height - padding.bottom + 18}
                  textAnchor="middle"
                  fontSize="11"
                  fill={isAnchor ? "#f59e0b" : "#71717a"}
                  fontFamily="monospace"
                  fontWeight={isAnchor ? "bold" : "normal"}
                >
                  {score}
                  {isAnchor ? " (Anchor)" : ""}
                </text>
              </g>
            );
          })}

          {/* 90% Confidence Interval Band Shading */}
          <path d={areaD} fill="url(#bandGradient)" />

          {/* Smooth Sigmoid Response Curve */}
          <path
            d={pathD}
            fill="none"
            stroke="url(#curveGradient)"
            strokeWidth="3.2"
            strokeLinecap="round"
          />

          {/* Anchor Tag at 55 pts */}
          <circle cx={toX(55)} cy={toY(50)} r="4" fill="#f59e0b" stroke="#18181b" strokeWidth="2" />

          {/* Live System Current Point Marker (Permanent) */}
          <g>
            <circle
              cx={toX(currentScore)}
              cy={toY(currentProb)}
              r="6"
              fill="#f43f5e"
              stroke="#ffffff"
              strokeWidth="2.5"
              filter="url(#glowMarker)"
            />
            {/* Live Indicator Callout Flag if not currently hovering */}
            {hoveredScore === null && (
              <g transform={`translate(${toX(currentScore) + 12}, ${toY(currentProb) - 24})`}>
                <rect
                  width="132"
                  height="26"
                  rx="5"
                  fill="#18181b"
                  stroke="#f43f5e"
                  strokeWidth="1.2"
                  opacity="0.95"
                />
                <text
                  x="66"
                  y="17"
                  textAnchor="middle"
                  fill="#ffffff"
                  fontSize="11"
                  fontFamily="monospace"
                  fontWeight="bold"
                >
                  LIVE: {currentProb.toFixed(1)}% ({currentScore.toFixed(1)}p)
                </text>
              </g>
            )}
          </g>

          {/* Interactive Crosshairs & Tracking Pointer */}
          {(hoveredScore !== null || isSimulating) && (
            <g>
              {/* Vertical Crosshair Line */}
              <line
                x1={activeX}
                y1={padding.top}
                x2={activeX}
                y2={height - padding.bottom}
                stroke="#f43f5e"
                strokeWidth="1.5"
                strokeDasharray="3 3"
                opacity="0.8"
              />

              {/* Horizontal Crosshair Line */}
              <line
                x1={padding.left}
                y1={activeY}
                x2={width - padding.right}
                y2={activeY}
                stroke="#f43f5e"
                strokeWidth="1.5"
                strokeDasharray="3 3"
                opacity="0.8"
              />

              {/* Active Inspection Dot */}
              <circle
                cx={activeX}
                cy={activeY}
                r="7"
                fill="#ffffff"
                stroke="#f43f5e"
                strokeWidth="3"
                filter="url(#glowMarker)"
              />

              {/* Dynamic Interactive Tooltip Card in SVG */}
              <g
                transform={`translate(${
                  activeX > width - 210 ? activeX - 195 : activeX + 15
                }, ${
                  activeY < padding.top + 70 ? activeY + 15 : activeY - 70
                })`}
              >
                <rect
                  width="180"
                  height="64"
                  rx="6"
                  fill="#121214"
                  stroke="#3f3f46"
                  strokeWidth="1.5"
                  filter="drop-shadow(0 4px 10px rgba(0,0,0,0.5))"
                />
                <text
                  x="12"
                  y="20"
                  fill="#94a3b8"
                  fontSize="11"
                  fontFamily="monospace"
                  fontWeight="600"
                >
                  SCORE: <tspan fill="#ffffff" fontWeight="bold">{activeScore.toFixed(1)} pts</tspan>
                </text>
                <text
                  x="12"
                  y="38"
                  fill="#f43f5e"
                  fontSize="13"
                  fontFamily="monospace"
                  fontWeight="bold"
                >
                  P(BURST): {activeProb.toFixed(1)}%
                </text>
                <text
                  x="12"
                  y="53"
                  fill="#71717a"
                  fontSize="9.5"
                  fontFamily="monospace"
                >
                  90% Band: [{activeLower.toFixed(0)}% – {activeUpper.toFixed(0)}%]
                </text>
              </g>
            </g>
          )}

          {/* Axis Titles */}
          <text
            x={padding.left + plotWidth / 2}
            y={height - 8}
            textAnchor="middle"
            fontSize="11"
            fill="#71717a"
            fontFamily="monospace"
            fontWeight="600"
          >
            Composite AI Risk Score (20 – 90 Points) →
          </text>
          <text
            transform={`rotate(-90) translate(-${padding.top + plotHeight / 2}, 16)`}
            textAnchor="middle"
            fontSize="11"
            fill="#71717a"
            fontFamily="monospace"
            fontWeight="600"
          >
            Burst Probability (%) →
          </text>
        </svg>
      </div>

      {/* Interactive Score Simulator & Regime Inspection */}
      <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <Sliders className="w-4 h-4 text-slate-500 dark:text-zinc-400" />
            <span className="text-xs font-mono font-bold text-slate-700 dark:text-zinc-200 uppercase tracking-wide">
              Scenario Stress Simulator
            </span>
            <span className="text-xs text-slate-500 dark:text-zinc-400">
              (Drag to test hypothetical shocks)
            </span>
          </div>
          <div className="flex items-center space-x-3 text-xs font-mono">
            <span className={`px-2.5 py-1 rounded-md border font-bold ${currentRegime.bg} ${currentRegime.color}`}>
              {currentRegime.label}
            </span>
            <button
              onClick={() => {
                setSimulatedScore(currentScore);
                setIsSimulating(false);
                setHoveredScore(null);
              }}
              className="text-slate-500 hover:text-slate-900 dark:hover:text-white underline text-[11px]"
            >
              Reset to Live
            </button>
          </div>
        </div>

        {/* Range Slider */}
        <div className="flex items-center gap-4">
          <span className="text-xs font-mono text-slate-500 dark:text-zinc-400">20 pts</span>
          <input
            type="range"
            min="20"
            max="90"
            step="0.5"
            value={isSimulating ? simulatedScore : currentScore}
            onChange={(e) => {
              setIsSimulating(true);
              setSimulatedScore(parseFloat(e.target.value));
            }}
            className="w-full h-2 bg-slate-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-rose-500"
          />
          <span className="text-xs font-mono text-slate-500 dark:text-zinc-400">90 pts</span>
          <span className="min-w-[70px] text-right font-mono font-bold text-sm text-slate-900 dark:text-white">
            {activeScore.toFixed(1)} pts
          </span>
        </div>

        {/* Formula & Quantitative Details */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 pt-2 border-t border-slate-200 dark:border-zinc-800/80 text-xs font-mono text-slate-600 dark:text-zinc-400">
          <div className="flex items-center space-x-1.5">
            <span className="text-slate-400 font-bold">Formula:</span>
            <span>P = 1 / (1 + e^-(S-55)/9)</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="text-slate-400 font-bold">Convexity:</span>
            <span>+9.0 pts shift = ~2.0× odds ratio</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="text-slate-400 font-bold">Baseline:</span>
            <span className="text-amber-500 font-semibold">55.0 pts = 50.0% probability</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 2. CAPITAL COMPOSITION CHART (Modern Stacked Bar & Segment Highlighting)
// ============================================================================

interface CapitalSegment {
  id: string;
  label: string;
  share: number;
  amount: string;
  amountUsd: number;
  dealCount: number;
  color: string;
  riskTier: "High" | "Medium" | "Neutral";
  description: string;
  topDeals: string;
}

const CAPITAL_SEGMENTS: CapitalSegment[] = [
  {
    id: "compute",
    label: "Compute Capacity Contracts",
    share: 25.3,
    amount: "$712B",
    amountUsd: 712_000_000_000,
    dealCount: 42,
    color: "#64748b",
    riskTier: "Medium",
    description: "Take-or-pay GPU cluster leasing contracts and hyperscaler compute reservations.",
    topDeals: "Oracle-OpenAI ($30B), CoreWeave-Anthropic ($12B), Crusoe AI ($4.5B)",
  },
  {
    id: "facilities",
    label: "Facilities & Gigawatt Power",
    share: 23.9,
    amount: "$672B",
    amountUsd: 672_000_000_000,
    dealCount: 38,
    color: "#475569",
    riskTier: "Medium",
    description: "Physical datacenter builds, high-voltage transformers, and turnkey campuses.",
    topDeals: "Vantage Data Centers ($14.8B), Blackstone QTS ($16B), Compass ($10B)",
  },
  {
    id: "equity",
    label: "Frontier Lab Equity Rounds",
    share: 19.0,
    amount: "$534B",
    amountUsd: 534_000_000_000,
    dealCount: 36,
    color: "#334155",
    riskTier: "Medium",
    description: "Direct equity rounds in frontier foundation model builders.",
    topDeals: "Anthropic Pre-IPO ($2.0T target), OpenAI ($950B / $1.4T target), Databricks ($190B)",
  },
  {
    id: "ma",
    label: "M&A & Platform Buyouts",
    share: 15.4,
    amount: "$432B",
    amountUsd: 432_000_000_000,
    dealCount: 17,
    color: "#1e293b",
    riskTier: "Neutral",
    description: "Consolidation acquisitions of AI silicon developers and enterprise SaaS pipelines.",
    topDeals: "Databricks MosaicML rollup, Cisco-Splunk AI ($28B), Scale AI buyout syndicate",
  },
  {
    id: "debt",
    label: "Borrowed Debt & Converts",
    share: 7.0,
    amount: "$197B",
    amountUsd: 196_822_500_000,
    dealCount: 20,
    color: "#f43f5e",
    riskTier: "High",
    description: "Senior secured debt, GPU-collateralized loan facilities, and convertible notes.",
    topDeals: "Anthropic Broadcom Debt ($57B), CoreWeave Blackstone ($7.5B), Oracle Bonds ($25B)",
  },
  {
    id: "power_land",
    label: "Nuclear PPAs & Land",
    share: 9.4,
    amount: "$264B",
    amountUsd: 264_000_000_000,
    dealCount: 6,
    color: "#0f172a",
    riskTier: "Neutral",
    description: "20-year off-grid nuclear power purchase agreements, SMR co-locations, and sub-stations.",
    topDeals: "Constellation-Microsoft Three Mile Island ($16B), Talen Energy AWS ($10.5B)",
  },
];

export function CapitalCompositionChart() {
  const [activeSegmentId, setActiveSegmentId] = useState<string | null>(null);

  const activeSegment = useMemo(
    () => CAPITAL_SEGMENTS.find((s) => s.id === activeSegmentId) || null,
    [activeSegmentId]
  );

  return (
    <div className="p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#121214] space-y-5 transition-all shadow-sm">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-100 dark:border-zinc-800/80">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-[11px] font-mono font-bold tracking-wider uppercase text-slate-500 dark:text-zinc-400 bg-slate-100 dark:bg-zinc-800 px-2 py-0.5 rounded">
              CAPITAL ALLOCATION
            </span>
            <span className="text-xs font-mono text-slate-500 dark:text-zinc-400">
              $2.81T across 159 Verified Deals
            </span>
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mt-1">
            Institutional Capital Stack Breakdown
          </h3>
        </div>

        <div className="flex items-center space-x-2 text-xs font-mono">
          <span className="text-slate-500 dark:text-zinc-400">Total Tracked:</span>
          <span className="font-bold text-emerald-600 dark:text-emerald-400 font-tabular text-sm">
            $2,810.8 Billion
          </span>
        </div>
      </div>

      {/* Modern Proportional Stacked Bar with Segment Hover */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs font-mono text-slate-500 dark:text-zinc-400 px-1">
          <span>Proportional Stacked Distribution</span>
          <span>Hover segments for asset details</span>
        </div>

        <div className="h-9 w-full bg-slate-100 dark:bg-zinc-900 rounded-xl overflow-hidden flex p-1 border border-slate-200 dark:border-zinc-800">
          {CAPITAL_SEGMENTS.map((seg) => {
            const isSelected = activeSegmentId === seg.id;
            const isOtherSelected = activeSegmentId !== null && !isSelected;

            return (
              <div
                key={seg.id}
                onMouseEnter={() => setActiveSegmentId(seg.id)}
                onMouseLeave={() => setActiveSegmentId(null)}
                className="relative h-full transition-all duration-300 cursor-pointer first:rounded-l-lg last:rounded-r-lg"
                style={{
                  width: `${seg.share}%`,
                  backgroundColor: seg.color,
                  opacity: isOtherSelected ? 0.35 : 1,
                  transform: isSelected ? "scaleY(1.15)" : "scaleY(1)",
                  zIndex: isSelected ? 10 : 1,
                }}
              >
                {/* Visual Segment Label if wide enough */}
                {seg.share >= 14 && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-[11px] font-mono font-bold text-white/90">
                    {seg.share.toFixed(1)}%
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Interactive Segment Deep-Dive Callout */}
      {activeSegment ? (
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 space-y-2 transition-all">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: activeSegment.color }} />
              <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                {activeSegment.label}
              </h4>
              {activeSegment.riskTier === "High" && (
                <span className="text-[10px] font-mono font-bold text-rose-500 bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded border border-rose-200 dark:border-rose-900/60">
                  ⚠️ Primary Solvency Risk Channel
                </span>
              )}
            </div>
            <div className="text-right">
              <span className="text-base font-bold font-mono text-slate-900 dark:text-white font-tabular">
                {activeSegment.amount}
              </span>
              <span className="text-xs font-mono text-slate-500 dark:text-zinc-400 ml-2">
                ({activeSegment.share}% of total)
              </span>
            </div>
          </div>
          <p className="text-xs text-slate-600 dark:text-zinc-300 font-sans leading-relaxed">
            {activeSegment.description}
          </p>
          <div className="text-[11px] font-mono text-slate-500 dark:text-zinc-400 pt-1">
            <span className="font-semibold text-slate-700 dark:text-zinc-300">Key Transactions: </span>
            <span>{activeSegment.topDeals}</span>
          </div>
        </div>
      ) : (
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#09090b] border border-slate-100 dark:border-zinc-800/80 flex items-center justify-between text-xs font-mono text-slate-500 dark:text-zinc-400">
          <span>💡 Tip: Click or hover any category tile below to isolate its capital contribution</span>
          <span className="text-rose-500 font-bold">$196.8B Debt (7.0%)</span>
        </div>
      )}

      {/* Grid of Category Legend Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {CAPITAL_SEGMENTS.map((seg) => {
          const isSelected = activeSegmentId === seg.id;
          return (
            <div
              key={seg.id}
              onClick={() => setActiveSegmentId(isSelected ? null : seg.id)}
              onMouseEnter={() => setActiveSegmentId(seg.id)}
              onMouseLeave={() => setActiveSegmentId(null)}
              className={`p-3 rounded-xl border transition-all cursor-pointer ${
                isSelected
                  ? "bg-slate-100 dark:bg-zinc-800/90 border-slate-400 dark:border-zinc-600 shadow-md scale-[1.02]"
                  : "bg-slate-50/70 dark:bg-[#09090b] border-slate-200/80 dark:border-zinc-800/80 hover:border-slate-300 dark:hover:border-zinc-700"
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center space-x-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: seg.color }}
                  />
                  <span className="text-xs font-medium text-slate-800 dark:text-zinc-200 truncate max-w-[130px]">
                    {seg.label}
                  </span>
                </div>
                <span className="text-xs font-mono font-bold text-slate-500 dark:text-zinc-400">
                  {seg.share}%
                </span>
              </div>

              <div className="flex items-baseline justify-between mt-2 pt-1.5 border-t border-slate-100 dark:border-zinc-800/60 font-mono">
                <span
                  className={`text-base font-bold font-tabular ${
                    seg.id === "debt"
                      ? "text-rose-600 dark:text-rose-400"
                      : "text-slate-900 dark:text-white"
                  }`}
                >
                  {seg.amount}
                </span>
                <span className="text-[11px] text-slate-500 dark:text-zinc-400">
                  {seg.dealCount} deals
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Institutional Explanatory Insight */}
      <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 flex items-start space-x-3 text-xs sm:text-sm">
        <ShieldAlert className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-bold text-slate-900 dark:text-white font-mono text-xs block">
            Institutional Capital Stack Interpretation:
          </span>
          <p className="text-slate-600 dark:text-zinc-300 font-sans leading-relaxed text-xs">
            While equity absorption cushions $534B of froth, the emergence of $197B in leveraged debt facilities (Broadcom, Blackstone, CoreWeave) transforms what was once pure venture upside into senior credit solvency risk with rigid coupon obligations.
          </p>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 3. LAB MULTIPLES CHART (2D Scatter Plot: Valuation vs Run-Rate Revenue)
// ============================================================================

interface LabPoint {
  name: string;
  valuationB: number; // in $B
  revenueB: number;   // in $B
  multiple: number;   // P/S ratio
  round: string;
  notes: string;
  isExtreme?: boolean;
  isDebtExposed?: boolean;
  color?: string;
}

const LAB_DATA: LabPoint[] = [
  {
    name: "Anthropic",
    valuationB: 2000.0,
    revenueB: 47.0,
    multiple: 42.5,
    round: "Oct 2026 Pre-IPO $2.0T Debut Target",
    notes: "$2.0T debut target ($965B Series H post-money) on $47.0B ARR (Claude Code >$2.5B). Carries $57B Broadcom & syndicate debt.",
    isDebtExposed: true,
    color: "#3b82f6",
  },
  {
    name: "OpenAI",
    valuationB: 950.0,
    revenueB: 50.0,
    multiple: 19.0,
    round: "Oct 2026 $852B Benchmark / $1.4T Round",
    notes: "$852B post-money valuation (targeting $1.0T–$1.4T) on $50.0B ARR. Flagship LLM anchor tenant.",
    color: "#10b981",
  },
  {
    name: "Databricks",
    valuationB: 190.0,
    revenueB: 7.00,
    multiple: 27.1,
    round: "Coatue Strategic AI Round",
    notes: "Largest private data & AI infrastructure provider with $7.0B revenue.",
    color: "#8b5cf6",
  },
  {
    name: "xAI Colossus",
    valuationB: 50.0,
    revenueB: 1.80,
    multiple: 27.8,
    round: "Series C Colossus Buildout",
    notes: "Memphis 100k H100 cluster expansion. 27.8× multiple on $1.8B ARR.",
    isExtreme: false,
    color: "#f59e0b",
  },
  {
    name: "Scale AI",
    valuationB: 13.8,
    revenueB: 0.90,
    multiple: 15.3,
    round: "Accel Strategic Round",
    notes: "Data engine, human-in-the-loop and defense AI contract pipeline.",
    color: "#06b6d4",
  },
  {
    name: "Mistral AI",
    valuationB: 11.0,
    revenueB: 0.35,
    multiple: 31.4,
    round: "Oct 2026 Commercial Benchmark",
    notes: "European sovereign champion trading at 31.4× P/S on $350M ARR with €1.5B debt facility.",
    isExtreme: true,
    color: "#f43f5e",
  },
  {
    name: "Perplexity AI",
    valuationB: 9.0,
    revenueB: 0.15,
    multiple: 60.0,
    round: "Institutional Series C",
    notes: "Search engine & enterprise LLM summarization trading at 60× sales on $150M ARR.",
    isExtreme: true,
    color: "#f59e0b",
  },
  {
    name: "Cohere",
    valuationB: 5.5,
    revenueB: 0.12,
    multiple: 45.8,
    round: "Enterprise Multi-Cloud Series D",
    notes: "Enterprise targeted frontier LLMs with $120M ARR and 45.8× multiple.",
    isExtreme: true,
    color: "#f59e0b",
  },
];

export function LabMultiplesChart() {
  const [scaleMode, setScaleMode] = useState<"log" | "linear">("log");
  const [hoveredLab, setHoveredLab] = useState<LabPoint | null>(null);
  const [selectedLab, setSelectedLab] = useState<LabPoint | null>(null);

  const activeLab = hoveredLab || selectedLab;

  // SVG dimensions
  const width = 740;
  const height = 380;
  const padding = { top: 35, right: 40, bottom: 50, left: 70 };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;

  // Domain extents
  // Revenue ($B): from 0.04 to 60
  const revMinLog = 0.04;
  const revMaxLog = 100.0;
  const valMinLog = 2.0;
  const valMaxLog = 3000.0;

  const revMinLin = 0;
  const revMaxLin = 60.0;
  const valMinLin = 0;
  const valMaxLin = 2200.0;

  // Coordinate projection functions
  const toX = useCallback(
    (rev: number) => {
      if (scaleMode === "log") {
        const logMin = Math.log10(revMinLog);
        const logMax = Math.log10(revMaxLog);
        const logVal = Math.log10(Math.max(revMinLog, rev));
        return padding.left + ((logVal - logMin) / (logMax - logMin)) * plotWidth;
      } else {
        return padding.left + ((rev - revMinLin) / (revMaxLin - revMinLin)) * plotWidth;
      }
    },
    [scaleMode, plotWidth, padding.left]
  );

  const toY = useCallback(
    (val: number) => {
      if (scaleMode === "log") {
        const logMin = Math.log10(valMinLog);
        const logMax = Math.log10(valMaxLog);
        const logVal = Math.log10(Math.max(valMinLog, val));
        return height - padding.bottom - ((logVal - logMin) / (logMax - logMin)) * plotHeight;
      } else {
        return height - padding.bottom - ((val - valMinLin) / (valMaxLin - valMinLin)) * plotHeight;
      }
    },
    [scaleMode, plotHeight, padding.bottom, height]
  );

  // Generate reference lines for multiples (e.g. 10x, 32x, 75x)
  const getReferenceLine = (multiple: number) => {
    const revStart = scaleMode === "log" ? revMinLog : 0.2;
    const revEnd = scaleMode === "log" ? revMaxLog : revMaxLin;

    const valStart = revStart * multiple;
    const valEnd = revEnd * multiple;

    // Clamp inside plot boundary
    const x1 = toX(revStart);
    const y1 = toY(valStart);
    const x2 = toX(revEnd);
    const y2 = toY(Math.min(valEnd, scaleMode === "log" ? valMaxLog : valMaxLin));

    return { x1, y1, x2, y2, multiple };
  };

  const refLines = [
    { multiple: 10, label: "10× SaaS Equilibrium", color: "#10b981" },
    { multiple: 32, label: "32× Dot-Com Peak (2000)", color: "#f59e0b" },
    { multiple: 75, label: "75× Hyper-Froth Boundary", color: "#f43f5e" },
  ];

  return (
    <div className="p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#121214] space-y-5 transition-all shadow-sm">
      {/* Header with Scale Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-100 dark:border-zinc-800/80">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-[11px] font-mono font-bold tracking-wider uppercase text-amber-500 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-900/60">
              VALUATION RADAR
            </span>
            <span className="text-xs font-mono text-slate-500 dark:text-zinc-400">
              Valuation vs Run-Rate Revenue
            </span>
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mt-1">
            Frontier AI Lab Multiples Scatter Plot
          </h3>
        </div>

        {/* Scale Toggle & Median Metric */}
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-slate-100 dark:bg-zinc-900 p-0.5 rounded-lg border border-slate-200 dark:border-zinc-800 text-xs font-mono">
            <button
              onClick={() => setScaleMode("log")}
              className={`px-3 py-1 rounded-md font-semibold transition-all ${
                scaleMode === "log"
                  ? "bg-white dark:bg-zinc-800 text-slate-900 dark:text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              Log Scale (Log-Log)
            </button>
            <button
              onClick={() => setScaleMode("linear")}
              className={`px-3 py-1 rounded-md font-semibold transition-all ${
                scaleMode === "linear"
                  ? "bg-white dark:bg-zinc-800 text-slate-900 dark:text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              Linear Scale
            </button>
          </div>
          <span className="text-xs font-mono font-bold text-slate-900 dark:text-white bg-slate-100 dark:bg-zinc-800 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-700">
            Median: 31.4×
          </span>
        </div>
      </div>

      {/* 2D Interactive Scatter Plot SVG */}
      <div className="relative select-none overflow-hidden rounded-xl bg-slate-50/70 dark:bg-[#0b0b0d] border border-slate-200/80 dark:border-zinc-800/80 p-2 sm:p-4">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto cursor-default">
          <defs>
            <filter id="bubbleGlow" x="-30%" y="-30%" width="160%" height="160%">
              <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#f43f5e" floodOpacity="0.8" />
            </filter>
          </defs>

          {/* Gridlines for Y Axis (Valuation $B) */}
          {(scaleMode === "log" ? [5, 20, 100, 500, 1000, 2000] : [0, 500, 1000, 1500, 2000]).map(
            (val) => {
              const y = toY(val);
              return (
                <g key={val}>
                  <line
                    x1={padding.left}
                    y1={y}
                    x2={width - padding.right}
                    y2={y}
                    stroke="#71717a"
                    strokeOpacity="0.12"
                    strokeDasharray="2 2"
                  />
                  <text
                    x={padding.left - 10}
                    y={y + 3.5}
                    textAnchor="end"
                    fontSize="10"
                    fill="#71717a"
                    fontFamily="monospace"
                  >
                    {val >= 1000 ? `$${(val / 1000).toFixed(val % 1000 === 0 ? 0 : 1)}T` : `$${val}B`}
                  </text>
                </g>
              );
            }
          )}

          {/* Gridlines for X Axis (Revenue) */}
          {(scaleMode === "log" ? [0.05, 0.2, 1.0, 5.0, 20.0, 50.0] : [0, 10, 20, 30, 40, 50, 60]).map(
            (rev) => {
              const x = toX(rev);
              const label = rev < 1 ? `$${Math.round(rev * 1000)}M` : `$${rev}B`;
              return (
                <g key={rev}>
                  <line
                    x1={x}
                    y1={padding.top}
                    x2={x}
                    y2={height - padding.bottom}
                    stroke="#71717a"
                    strokeOpacity="0.12"
                    strokeDasharray="2 2"
                  />
                  <text
                    x={x}
                    y={height - padding.bottom + 16}
                    textAnchor="middle"
                    fontSize="10"
                    fill="#71717a"
                    fontFamily="monospace"
                  >
                    {label}
                  </text>
                </g>
              );
            }
          )}

          {/* Reference Regression / Multiple Lines (10x, 32x, 75x) */}
          {refLines.map((ref) => {
            const line = getReferenceLine(ref.multiple);
            return (
              <g key={ref.multiple}>
                <line
                  x1={line.x1}
                  y1={line.y1}
                  x2={line.x2}
                  y2={line.y2}
                  stroke={ref.color}
                  strokeWidth="1.2"
                  strokeDasharray="4 3"
                  strokeOpacity="0.65"
                />
                <text
                  x={line.x2 - 8}
                  y={line.y2 - 6}
                  textAnchor="end"
                  fontSize="9.5"
                  fill={ref.color}
                  fontFamily="monospace"
                  fontWeight="bold"
                >
                  {ref.label}
                </text>
              </g>
            );
          })}

          {/* Active Lab Crosshair Projections */}
          {activeLab && (
            <g>
              <line
                x1={toX(activeLab.revenueB)}
                y1={toY(activeLab.valuationB)}
                x2={toX(activeLab.revenueB)}
                y2={height - padding.bottom}
                stroke={activeLab.isExtreme ? "#f43f5e" : "#64748b"}
                strokeWidth="1.5"
                strokeDasharray="2 2"
                strokeOpacity="0.75"
              />
              <line
                x1={padding.left}
                y1={toY(activeLab.valuationB)}
                x2={toX(activeLab.revenueB)}
                y2={toY(activeLab.valuationB)}
                stroke={activeLab.isExtreme ? "#f43f5e" : "#64748b"}
                strokeWidth="1.5"
                strokeDasharray="2 2"
                strokeOpacity="0.75"
              />
            </g>
          )}

          {/* Scatter Plot Bubbles */}
          {LAB_DATA.map((lab) => {
            const cx = toX(lab.revenueB);
            const cy = toY(lab.valuationB);
            const isActive = activeLab?.name === lab.name;

            // Size bubble slightly based on valuation
            const radius = Math.max(7, Math.min(18, 5 + Math.sqrt(lab.valuationB) * 0.9));

            return (
              <g
                key={lab.name}
                onMouseEnter={() => setHoveredLab(lab)}
                onMouseLeave={() => setHoveredLab(null)}
                onClick={() => setSelectedLab(selectedLab?.name === lab.name ? null : lab)}
                className="cursor-pointer transition-transform"
              >
                {/* Halo ring for active/hovered bubble */}
                {isActive && (
                  <circle
                    cx={cx}
                    cy={cy}
                    r={radius + 8}
                    fill="none"
                    stroke={lab.isExtreme ? "#f43f5e" : "#ffffff"}
                    strokeWidth="2"
                    strokeDasharray="3 3"
                    className="animate-spin-slow"
                  />
                )}

                {/* Main Bubble */}
                <circle
                  cx={cx}
                  cy={cy}
                  r={radius}
                  fill={lab.color || "#64748b"}
                  fillOpacity={isActive ? 0.95 : 0.8}
                  stroke="#ffffff"
                  strokeWidth={isActive ? 2.5 : 1.5}
                  filter={isActive ? "url(#bubbleGlow)" : undefined}
                />

                {/* Lab Name Label */}
                <text
                  x={cx}
                  y={cy - radius - 5}
                  textAnchor="middle"
                  fontSize="10"
                  fontFamily="monospace"
                  fontWeight="bold"
                  fill={isActive ? "#ffffff" : "#cbd5e1"}
                  stroke="#0b0b0d"
                  strokeWidth="2.5"
                  paintOrder="stroke"
                >
                  {lab.name} ({lab.multiple.toFixed(0)}×)
                </text>
              </g>
            );
          })}

          {/* Axis Labels */}
          <text
            x={padding.left + plotWidth / 2}
            y={height - 12}
            textAnchor="middle"
            fontSize="11"
            fill="#71717a"
            fontFamily="monospace"
            fontWeight="600"
          >
            Annual Run-Rate Revenue ($B) →
          </text>
          <text
            transform={`rotate(-90) translate(-${padding.top + plotHeight / 2}, 18)`}
            textAnchor="middle"
            fontSize="11"
            fill="#71717a"
            fontFamily="monospace"
            fontWeight="600"
          >
            Private Valuation ($B) →
          </text>
        </svg>
      </div>

      {/* Selected / Hovered Lab Deep-Dive Tooltip Banner */}
      {activeLab ? (
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: activeLab.color }} />
              <h4 className="text-base font-bold text-slate-900 dark:text-white">
                {activeLab.name}
              </h4>
              <span className="text-xs font-mono text-slate-500 dark:text-zinc-400">
                ({activeLab.round})
              </span>
              {activeLab.isExtreme && (
                <span className="text-[10px] font-mono font-bold text-rose-500 bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded border border-rose-200 dark:border-rose-900/60">
                  🔥 Extreme Multiple
                </span>
              )}
              {activeLab.isDebtExposed && (
                <span className="text-[10px] font-mono font-bold text-rose-500 bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded border border-rose-200 dark:border-rose-900/60">
                  $57B Debt Facilities
                </span>
              )}
            </div>

            <div className="flex items-center space-x-4 font-mono text-xs">
              <div>
                <span className="text-slate-400">Valuation: </span>
                <span className="font-bold text-slate-900 dark:text-white">
                  ${activeLab.valuationB}B
                </span>
              </div>
              <div>
                <span className="text-slate-400">Revenue: </span>
                <span className="font-bold text-emerald-500">
                  {activeLab.revenueB < 1
                    ? `$${Math.round(activeLab.revenueB * 1000)}M`
                    : `$${activeLab.revenueB}B`}
                </span>
              </div>
              <div>
                <span className="text-slate-400">Multiple: </span>
                <span className="font-bold text-rose-500 text-sm">
                  {activeLab.multiple.toFixed(1)}× P/S
                </span>
              </div>
            </div>
          </div>

          <p className="text-xs text-slate-600 dark:text-zinc-300 font-sans leading-relaxed">
            {activeLab.notes}
          </p>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs font-mono">
          <span className="text-slate-500 dark:text-zinc-400">Quick Highlight:</span>
          {LAB_DATA.map((l) => (
            <button
              key={l.name}
              onClick={() => setSelectedLab(l)}
              className="px-2.5 py-1 rounded bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-zinc-700 transition-colors"
            >
              {l.name} ({l.multiple.toFixed(0)}×)
            </button>
          ))}
        </div>
      )}

      {/* Footer Benchmark Comparison */}
      <div className="pt-2 border-t border-slate-100 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between text-xs font-mono text-slate-500 dark:text-zinc-400 gap-2">
        <div className="flex items-center space-x-2">
          <span>Historical SaaS Median: 8× – 12×</span>
          <span>•</span>
          <span>2000 Dot-Com Peak: 32.0×</span>
        </div>
        <span className="text-rose-600 dark:text-rose-400 font-bold">
          Frontier AI Median trades 3.5× higher than historical SaaS equilibrium
        </span>
      </div>
    </div>
  );
}

// ============================================================================
// 4. AI REVENUE GAP CHART (Hyperscaler Capex vs Real Software Revenue)
// ============================================================================

export function AiRevenueGapChart() {
  const data = [
    {
      label: "Annual Hyperscaler AI Capex",
      amount: 210,
      display: "$210B",
      note: "GPUs, datacenters, fiber, gigawatt substations",
      isStress: true,
      category: "Outlay",
    },
    {
      label: "Depreciation & Power Opex",
      amount: 65,
      display: "$65B",
      note: "Annual power consumption & 3-year silicon wear",
      isStress: true,
      category: "Outlay",
    },
    {
      label: "End-User Software Revenue",
      amount: 38,
      display: "$38B",
      note: "All verified LLM enterprise APIs & seat licenses",
      isRevenue: true,
      category: "Inflow",
    },
  ];

  const totalOutlay = 210 + 65; // $275B
  const revenue = 38;
  const netDeficit = totalOutlay - revenue; // $237B
  const burnRatio = (totalOutlay / revenue).toFixed(1); // 7.2x

  return (
    <div className="p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#121214] space-y-4 transition-all shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-mono text-rose-600 dark:text-rose-400 font-bold uppercase tracking-wider">
            STRUCTURAL IMBALANCE
          </span>
          <h4 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mt-0.5">
            The $237B Annual AI Revenue Gap
          </h4>
        </div>
        <span className="text-xs font-mono font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-3 py-1.5 rounded-lg border border-rose-200 dark:border-rose-900/60 font-tabular">
          -$237B Net Deficit
        </span>
      </div>

      {/* Spend Comparison Bars */}
      <div className="space-y-3 pt-1">
        {data.map((item) => {
          const widthPct = (item.amount / 240) * 100;
          return (
            <div key={item.label} className="space-y-1.5">
              <div className="flex justify-between text-xs sm:text-sm font-mono">
                <span className="font-semibold text-slate-800 dark:text-zinc-200">
                  {item.label}{" "}
                  <span className="text-xs text-slate-500 dark:text-zinc-400 font-normal hidden sm:inline">
                    ({item.note})
                  </span>
                </span>
                <span
                  className={`font-bold font-tabular ${
                    item.isRevenue ? "text-emerald-500" : "text-slate-900 dark:text-white"
                  }`}
                >
                  {item.display}
                </span>
              </div>
              <div className="h-3.5 w-full bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden p-0.5">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${
                    item.isRevenue
                      ? "bg-emerald-500 shadow-sm"
                      : "bg-slate-700 dark:bg-zinc-400"
                  }`}
                  style={{ width: `${widthPct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Burn Multiplier KPI Card */}
      <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 space-y-2 text-xs sm:text-sm">
        <div className="flex items-center justify-between">
          <span className="text-rose-500 font-bold font-mono">⚠️ Imbalance Ratio:</span>
          <span className="font-mono font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded border border-rose-200 dark:border-rose-900/60">
            ${burnRatio} Spent per $1.00 Software ARR
          </span>
        </div>
        <p className="text-slate-700 dark:text-zinc-300 font-sans leading-relaxed text-xs">
          Hyperscalers (Microsoft, Meta, Google, AWS) are deploying $275B annually in silicon procurement, datacenters, and electrical power to service $38B of enterprise software revenue.
        </p>
      </div>
    </div>
  );
}

// ============================================================================
// 5. TOKEN PRICE DEFLATION CHART (200x Collapse in Inference Cost)
// ============================================================================

export function TokenPriceDeflationChart() {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const milestones = [
    { date: "Mar 2023", model: "GPT-4 Original", cost: 30.0, display: "$30.00", multiple: "1.0× (Baseline)" },
    { date: "Nov 2023", model: "GPT-4 Turbo", cost: 10.0, display: "$10.00", multiple: "3.0× Cheaper" },
    { date: "May 2024", model: "GPT-4o / Claude 3.5", cost: 5.0, display: "$5.00", multiple: "6.0× Cheaper" },
    { date: "Dec 2024", model: "Gemini 1.5 Flash", cost: 0.35, display: "$0.35", multiple: "85× Cheaper" },
    { date: "2026 Today", model: "GPT-4o-mini / Haiku", cost: 0.15, display: "$0.15", multiple: "200× Cheaper" },
  ];

  return (
    <div className="p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#121214] space-y-4 transition-all shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider">
            PRODUCTIVITY DAMPER
          </span>
          <h4 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mt-0.5">
            Inference Token Cost Collapse (200× Cheaper)
          </h4>
        </div>
        <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1.5 rounded-lg border border-emerald-200 dark:border-emerald-900/60 font-tabular">
          -99.5% Unit Cost
        </span>
      </div>

      <div className="space-y-3 pt-1">
        {milestones.map((m, idx) => {
          const logPct = Math.max(8, (Math.log10(m.cost * 10) / Math.log10(300)) * 100);
          const isHovered = hoveredIdx === idx;

          return (
            <div
              key={m.model}
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
              className="space-y-1.5 cursor-pointer"
            >
              <div className="flex justify-between text-xs sm:text-sm font-mono">
                <span className="font-semibold text-slate-800 dark:text-zinc-200">
                  {m.model}{" "}
                  <span className="text-xs text-slate-500 dark:text-zinc-400 font-normal">
                    ({m.date})
                  </span>
                </span>
                <span className="font-bold text-slate-900 dark:text-white font-tabular">
                  {m.display} <span className="text-[11px] font-normal text-slate-400">/ 1M tokens</span>
                </span>
              </div>
              <div className="h-3 w-full bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden p-0.5">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    isHovered ? "bg-emerald-400 shadow-sm" : "bg-emerald-500"
                  }`}
                  style={{ width: `${logPct}%`, opacity: 0.35 + idx * 0.16 }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 text-xs sm:text-sm">
        <p className="text-slate-600 dark:text-zinc-300 font-sans leading-relaxed">
          <strong className="text-slate-900 dark:text-white font-mono">The Adoption Cushion: </strong>
          Unlike the 2000 telecom fiber glut where bandwidth remained prohibitively costly to light, AI token costs are dropping exponentially. This expands genuine enterprise utilization and knocks <strong className="text-emerald-500 font-mono">-7.2 points</strong> off the systemic burst score.
        </p>
      </div>
    </div>
  );
}

// ============================================================================
// 6. YEARLY SURGE CHART (Deployment Velocity 2023 → 2026)
// ============================================================================

export function YearlySurgeChart() {
  const [hoveredYear, setHoveredYear] = useState<string | null>(null);

  const years = [
    { year: "2023", volume: 26.3, label: "$26B", count: 8, heightPct: 15, yoy: "Baseline" },
    { year: "2024", volume: 295.2, label: "$295B", count: 48, heightPct: 35, yoy: "+1,022%" },
    { year: "2025", volume: 1720.0, label: "$1.72T", count: 77, heightPct: 100, yoy: "+482%" },
    { year: "2026 (YTD)", volume: 769.2, label: "$769B", count: 26, heightPct: 56, yoy: "$3.1T Run-Rate" },
  ];

  return (
    <div className="p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#121214] space-y-4 transition-all shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-mono text-slate-500 dark:text-zinc-400 font-bold uppercase tracking-wider">
            VELOCITY ACCELERATION
          </span>
          <h4 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mt-0.5">
            Capital Deployment Surge by Year
          </h4>
        </div>
        <span className="text-xs font-mono font-medium text-slate-500 dark:text-zinc-400 bg-slate-100 dark:bg-zinc-800 px-2.5 py-1 rounded">
          2023 → 2026 YTD
        </span>
      </div>

      <div className="h-44 flex items-end justify-between gap-4 pt-4 px-4 pb-2 bg-slate-50 dark:bg-[#09090b] rounded-xl border border-slate-200 dark:border-zinc-800">
        {years.map((y) => {
          const isHovered = hoveredYear === y.year;

          return (
            <div
              key={y.year}
              onMouseEnter={() => setHoveredYear(y.year)}
              onMouseLeave={() => setHoveredYear(null)}
              className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end cursor-pointer group"
            >
              <span className="text-xs sm:text-sm font-mono font-bold text-slate-900 dark:text-white font-tabular">
                {y.label}
              </span>
              <div
                className={`w-full max-w-[55px] rounded-t-lg transition-all duration-300 ${
                  isHovered
                    ? "bg-rose-500 shadow-lg scale-y-105"
                    : "bg-slate-700 dark:bg-zinc-400 hover:bg-slate-600 dark:hover:bg-zinc-300"
                }`}
                style={{ height: `${y.heightPct}%` }}
              />
              <span className="text-xs font-mono font-semibold text-slate-600 dark:text-zinc-400 pt-1">
                {y.year}
              </span>
            </div>
          );
        })}
      </div>

      {/* Interactive Year Details */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 font-mono text-xs">
        {years.map((y) => (
          <div
            key={y.year}
            className="p-2 rounded-lg bg-slate-50 dark:bg-[#09090b] border border-slate-100 dark:border-zinc-800 text-center"
          >
            <span className="text-slate-500 dark:text-zinc-400 block text-[10px]">{y.year}</span>
            <span className="font-bold text-slate-900 dark:text-white text-xs">{y.yoy}</span>
            <span className="text-[10px] text-slate-400 block">{y.count} deals</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// 7. CDS TRAJECTORY CHART (Credit Default Swaps as Leading Indicator)
// ============================================================================

export function CdsTrajectoryChart() {
  const steps = [
    { label: "Mid-2025 Baseline", value: 81, status: "Normal", isWarning: false, note: "Historical calm anchor" },
    { label: "90 Days Prior", value: 155, status: "Widening", isWarning: false, note: "Initial spread expansion" },
    { label: "Latest Reading", value: 187, status: "Extreme (+131%)", isWarning: true, note: "2008-scale divergence" },
  ];

  return (
    <div className="p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#121214] space-y-4 transition-all shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-mono text-rose-600 dark:text-rose-400 font-bold uppercase tracking-wider">
            CREDIT RADAR
          </span>
          <h4 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mt-0.5">
            Oracle 5Y CDS Spread Trajectory
          </h4>
        </div>
        <span className="text-xs font-mono font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-3 py-1.5 rounded-lg border border-rose-200 dark:border-rose-900/60 font-tabular">
          +32 bp in 90 Days
        </span>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {steps.map((s) => (
          <div
            key={s.label}
            className={`p-4 rounded-xl border text-center space-y-1.5 transition-all ${
              s.isWarning
                ? "bg-rose-50/60 dark:bg-rose-950/25 border-rose-200 dark:border-rose-900/60 shadow-sm"
                : "bg-slate-50 dark:bg-[#09090b] border-slate-200 dark:border-zinc-800"
            }`}
          >
            <span className="text-xs font-mono text-slate-500 dark:text-zinc-400 block truncate font-medium">
              {s.label}
            </span>
            <div
              className={`text-2xl sm:text-3xl font-black font-mono font-tabular ${
                s.isWarning ? "text-rose-600 dark:text-rose-400" : "text-slate-900 dark:text-white"
              }`}
            >
              {s.value} <span className="text-xs font-semibold">bp</span>
            </div>
            <span
              className={`text-xs font-mono block ${
                s.isWarning
                  ? "text-rose-600 dark:text-rose-400 font-bold"
                  : "text-slate-600 dark:text-zinc-400 font-medium"
              }`}
            >
              {s.status}
            </span>
          </div>
        ))}
      </div>

      <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 text-xs sm:text-sm">
        <p className="text-slate-600 dark:text-zinc-300 font-sans leading-relaxed">
          <strong className="text-slate-900 dark:text-white font-mono">The Credit Warning Window: </strong>
          Credit Default Swap (CDS) spreads measure bond default insurance premiums. In both 2000 and 2008, credit widening on prime infrastructure borrowers preceded equity multiple contraction by 3 to 6 months.
        </p>
      </div>
    </div>
  );
}
