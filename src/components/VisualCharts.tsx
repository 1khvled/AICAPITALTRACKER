"use client";

import React, { useState, useRef, useMemo, useCallback } from "react";
import { MODEL_CALIBRATION } from "@/lib/model/factors";
import { evaluateBubbleModel, DEFAULT_MODEL_INPUTS } from "@/lib/model/engine";
import { Reveal } from "@/components/Reveal";
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
  ExternalLink,
  Radio,
  Search,
} from "lucide-react";
import liveModelsData from "@/data/live-models.json";
import rawDeals from "@/data/deals.json";

/**
 * Chart palette — the design tokens from tailwind.config.ts + globals.css
 * (19 Oct 2026). SVG attributes need literal colours, so the token values are
 * mirrored here once instead of being re-hexed at every call site.
 *
 * The semantic scales (safe / risk / caution) are fixed values that hold on
 * both the light reading canvas and the dark terminal chrome. Ink and surface
 * values are read from the CSS variables so the charts follow the theme.
 */
const TOKEN = {
  safe500: "#0E9F6E", // tailwind safe-500
  safe600: "#0B7F58", // tailwind safe-600
  safe300: "#6FC9A4", // tailwind safe-300
  risk500: "#D1433C", // tailwind risk-500
  risk600: "#B7352F", // tailwind risk-600
  risk300: "#EE9C96", // tailwind risk-300
  caution500: "#B57F0A", // tailwind caution-500
  caution400: "#D89B18", // tailwind caution-400
  caution300: "#EFC050", // tailwind caution-300
  ink: "rgb(var(--c-ink))", // globals.css --c-ink
  inkMuted: "rgb(var(--c-ink-muted))", // globals.css --c-ink-muted
  inkSubtle: "rgb(var(--c-ink-subtle))", // globals.css --c-ink-subtle
  inkFaint: "rgb(var(--c-ink-faint))", // globals.css --c-ink-faint
  canvas: "rgb(var(--c-canvas))", // globals.css --c-canvas
  surface2: "rgb(var(--c-surface-2))", // globals.css --c-surface-2
  surface3: "rgb(var(--c-surface-3))", // globals.css --c-surface-3
  rule: "rgb(var(--c-rule))", // globals.css --c-rule
  ruleStrong: "rgb(var(--c-rule-strong))", // globals.css --c-rule-strong
} as const;

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
  // 2026-10-20: these defaults were the pre-v2.7.0 print (51.0 / 39.1%) and
  // contradicted the number the site publishes. The live model's own output is
  // the default; a caller can still pass its own pair.
  currentScore = evaluateBubbleModel(DEFAULT_MODEL_INPUTS).compositeScore,
  currentProb = evaluateBubbleModel(DEFAULT_MODEL_INPUTS).burstProbability,
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

  // Regime classification — tone is a chip modifier from the token system.
  //
  // 2026-10-20: the labels were renamed to the vocabulary the rest of the site
  // publishes. "Elevated Convex Inflection" and "Hyperbolic Fragility Zone" read
  // as decoration to anyone who knows the maths; the same states are called
  // "elevated" and "high" in the model's own band, and a label that matches the
  // published band is checkable.
  const getRegime = (score: number) => {
    if (score < 42) return { label: "Calm", tone: "chip-safe" };
    if (score < 55) return { label: "Guarded", tone: "" };
    if (score < 68) return { label: "Elevated", tone: "chip-caution" };
    return { label: "High", tone: "chip-risk" };
  };

  const currentRegime = getRegime(activeScore);

  return (
    <div className="card space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-3 border-b border-rule pb-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="chip chip-risk">NON-LINEAR CALIBRATION</span>
            <span className="text-[14px] text-ink-subtle">Sigmoid Mathematical Response</span>
          </div>
          <h3 className="mt-1 text-lg font-bold text-ink">Burst Probability vs Composite Stress Curve</h3>
        </div>

        {/* Live status — no pulsing dot */}
        <div className="flex items-center gap-2 rounded-lg border border-rule bg-surface-2 px-3 py-2 text-[14px]">
          <span className="label">Live reading</span>
          <span className="num font-semibold text-ink">
            {currentProb.toFixed(1)}% ({currentScore.toFixed(1)} pts)
          </span>
        </div>
      </div>

      {/* SVG Sensitivity Curve Chart */}
      <div className="relative select-none overflow-hidden rounded-xl border border-rule bg-surface-2 p-2 sm:p-4">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto cursor-crosshair touch-none"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          {/* Flat fills only — no gradients, no glow filters. The band and the
              curve carry literal chart colours; the chrome stays token-based. */}

          {/* Regime Background Zones */}
          {/* Sub-critical Zone (<45) */}
          <rect
            x={toX(20)}
            y={padding.top}
            width={toX(45) - toX(20)}
            height={plotHeight}
            fill={TOKEN.safe500}
            fillOpacity="0.02"
          />
          {/* Inflection Transition Zone (45 to 65) */}
          <rect
            x={toX(45)}
            y={padding.top}
            width={toX(65) - toX(45)}
            height={plotHeight}
            fill={TOKEN.caution500}
            fillOpacity="0.035"
          />
          {/* High Convex Fragility Zone (>65) */}
          <rect
            x={toX(65)}
            y={padding.top}
            width={toX(90) - toX(65)}
            height={plotHeight}
            fill={TOKEN.risk500}
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
                  stroke={isMidline ? TOKEN.caution500 : TOKEN.inkFaint}
                  strokeOpacity={isMidline ? 0.35 : 0.15}
                  strokeDasharray={isMidline ? "4 4" : "3 3"}
                  strokeWidth={isMidline ? 1.5 : 1}
                />
                <text
                  x={padding.left - 10}
                  y={y + 3.5}
                  textAnchor="end"
                  fontSize="13"
                  style={{ fill: isMidline ? TOKEN.caution500 : TOKEN.inkFaint }}
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
                  stroke={isAnchor ? TOKEN.caution500 : TOKEN.inkFaint}
                  strokeOpacity={isAnchor ? 0.35 : 0.12}
                  strokeDasharray={isAnchor ? "4 4" : "2 2"}
                  strokeWidth={isAnchor ? 1.5 : 1}
                />
                <text
                  x={x}
                  y={height - padding.bottom + 18}
                  textAnchor="middle"
                  fontSize="13"
                  style={{ fill: isAnchor ? TOKEN.caution500 : TOKEN.inkFaint }}
                  fontFamily="monospace"
                  fontWeight={isAnchor ? "bold" : "normal"}
                >
                  {score}
                </text>
                {isAnchor ? (
                  // The anchor's caption sits INSIDE the plot, above the axis. On
                  // the axis line it collided with its neighbours and the row read
                  // "50 55 (Anchor) 60" as one smear.
                  <text
                    x={x}
                    y={height - padding.bottom - 8}
                    textAnchor="middle"
                    fontSize="12"
                    style={{ fill: TOKEN.caution500 }}
                    fontFamily="monospace"
                  >
                    anchor
                  </text>
                ) : null}
              </g>
            );
          })}

          {/* 90% Confidence Interval Band Shading */}
          <path d={areaD} fill={TOKEN.caution500} fillOpacity="0.10" className="draw-in draw-in-in" />

          {/* Sigmoid Response Curve — draws itself in once, then holds. */}
          <path
            d={pathD}
            fill="none"
            stroke={TOKEN.risk500}
            strokeWidth="2.5"
            strokeLinecap="round"
            className="draw-in draw-in-in"
          />

          {/* Anchor Tag at 55 pts */}
          <circle cx={toX(55)} cy={toY(50)} r="4" fill={TOKEN.caution500} style={{ stroke: TOKEN.canvas }} strokeWidth="2" />

          {/* Live System Current Point Marker (Permanent) */}
          <g>
            <circle
              cx={toX(currentScore)}
              cy={toY(currentProb)}
              r="6"
              fill={TOKEN.risk500}
              style={{ stroke: TOKEN.canvas }}
              strokeWidth="2.5"
            />
            {/* Live Indicator Callout Flag if not currently hovering */}
            {hoveredScore === null && (
              <g transform={`translate(${toX(currentScore) + 12}, ${toY(currentProb) - 24})`}>
                <rect
                  width="160"
                  height="26"
                  rx="5"
                  style={{ fill: TOKEN.ink, stroke: TOKEN.risk500 }}
                  strokeWidth="1.2"
                  opacity="0.95"
                />
                <text
                  x="80"
                  y="17"
                  textAnchor="middle"
                  style={{ fill: TOKEN.canvas }}
                  fontSize="12"
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
                stroke={TOKEN.risk500}
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
                stroke={TOKEN.risk500}
                strokeWidth="1.5"
                strokeDasharray="3 3"
                opacity="0.8"
              />

              {/* Active Inspection Dot */}
              <circle
                cx={activeX}
                cy={activeY}
                r="7"
                style={{ fill: TOKEN.canvas, stroke: TOKEN.risk500 }}
                strokeWidth="3"
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
                  style={{ fill: TOKEN.surface2, stroke: TOKEN.ruleStrong }}
                  strokeWidth="1.5"
                />
                <text
                  x="12"
                  y="20"
                  style={{ fill: TOKEN.inkSubtle }}
                  fontSize="14"
                  fontFamily="monospace"
                  fontWeight="600"
                >
                  SCORE: <tspan style={{ fill: TOKEN.ink }} fontWeight="bold">{activeScore.toFixed(1)} pts</tspan>
                </text>
                <text
                  x="12"
                  y="38"
                  style={{ fill: TOKEN.risk500 }}
                  fontSize="14"
                  fontFamily="monospace"
                  fontWeight="bold"
                >
                  P(BURST): {activeProb.toFixed(1)}%
                </text>
                <text
                  x="12"
                  y="53"
                  style={{ fill: TOKEN.inkFaint }}
                  fontSize="13"
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
            fontSize="14"
            style={{ fill: TOKEN.inkSubtle }}
            fontFamily="monospace"
            fontWeight="600"
          >
            Composite AI Risk Score (20 – 90 Points) →
          </text>
          <text
            transform={`rotate(-90) translate(-${padding.top + plotHeight / 2}, 16)`}
            textAnchor="middle"
            fontSize="14"
            style={{ fill: TOKEN.inkSubtle }}
            fontFamily="monospace"
            fontWeight="600"
          >
            Burst Probability (%) →
          </text>
        </svg>
      </div>

      {/* Interactive Score Simulator & Regime Inspection */}
      <div className="panel space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <Sliders className="w-4 h-4 text-ink-subtle" />
            <span className="label">
              Scenario Stress Simulator
            </span>
            <span className="text-[14px] text-ink-subtle">
              (Drag to test hypothetical shocks)
            </span>
          </div>
<div className="flex items-center gap-3 text-[14px]">
            <span className={`chip ${currentRegime.tone}`}>{currentRegime.label}</span>
            <button
              onClick={() => {
                setSimulatedScore(currentScore);
                setIsSimulating(false);
                setHoveredScore(null);
              }}
              className="min-h-11 py-2 text-[13px] font-semibold text-ink-muted underline underline-offset-4 hover:text-ink"
            >
              Reset to Live
            </button>
          </div>
        </div>

        {/* Range Slider — full-width 44px hit area */}
        <div className="flex items-center gap-3">
          <span className="num text-[14px] text-ink-subtle">20 pts</span>
          <input
            type="range"
            aria-label="Simulated composite stress score"
            min="20"
            max="90"
            step="0.5"
            value={isSimulating ? simulatedScore : currentScore}
            onChange={(e) => {
              setIsSimulating(true);
              setSimulatedScore(parseFloat(e.target.value));
            }}
            className="h-11 w-full cursor-pointer accent-risk-500"
          />
          <span className="num text-[14px] text-ink-subtle">90 pts</span>
          <span className="num min-w-[70px] text-right text-sm font-semibold text-ink">
            {activeScore.toFixed(1)} pts
          </span>
        </div>

        {/* Formula & Quantitative Details */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 pt-2 border-t border-rule text-[14px] font-mono text-ink-muted">
          <div className="flex items-center space-x-1.5">
            <span className="text-ink-faint font-bold">Formula:</span>
            <span>P = 1 / (1 + e^-(S-55)/9)</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="text-ink-faint font-bold">Convexity:</span>
            <span>+9.0 pts shift = ~2.0× odds ratio</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="text-ink-faint font-bold">Baseline:</span>
            <span className="text-caution-700 font-semibold">55.0 pts = 50.0% probability</span>
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
  /** Ink colour for the label printed on top of the segment fill. */
  labelInk: "text-canvas" | "text-ink";
  riskTier: "High" | "Medium" | "Neutral";
  description: string;
  topDeals: string;
}

/**
 * Capital stack — rebuilt 19 Oct 2026 from src/data/deals.json.
 *
 * Mapping (each segment is a DISJOINT set of ledger records, so the shares
 * sum to 100% of the $2,872,873,160,000 ledger across all 169 deals):
 *   compute      → is_compute flag, less the 7 records that also carry the
 *                  debt flag (counted once, under debt): 28 records
 *   facilities   → ledger category "Big construction", less its 2 debt records
 *   equity       → ledger category "Bets & rounds", less its 4 compute records
 *   ma           → ledger category "Buyouts & mergers", less its 3 compute records
 *   other        → ledger category "Other", less its 2 compute records
 *   debt         → is_debt flag (24 records, all of them)
 *   power_land   → ledger category "Power & land"
 *   share_sales  → ledger category "Share sales"
 *
 * Flag overlays (dated 19 Oct 2026): is_compute = $813,795,780,000 (28.3%) over
 * 35 records; is_debt = $214,890,400,000 (7.5%) over 24 records; the two flags
 * overlap on 7 GPU-collateralized facilities worth $62,692,900,000 (2.2%) —
 * Anthropic–Broadcom $42.0B convert, xAI $12.5B SPV, CoreWeave $2.3B, Crusoe
 * $225M, Lambda $500M, Mistral €1.5B convert, Crusoe JV $3.4B. Each of those
 * dollars is counted exactly once here (under debt), which is why the compute
 * segment prints $751.1B rather than the raw $813.8B flag total.
 */
const CAPITAL_SEGMENTS: CapitalSegment[] = [
  {
    id: "compute",
    label: "Compute Capacity Contracts",
    share: 26.14,
    amount: "$751.1B",
    amountUsd: 751_102_880_000,
    dealCount: 28,
    color: TOKEN.ink,
    labelInk: "text-canvas",
    riskTier: "Medium",
    description:
      "Take-or-pay GPU cluster leasing contracts and hyperscaler compute reservations. The ledger's is_compute flag spans $813,795,780,000 (28.3%) across 35 records; $62,692,900,000 across 7 GPU-collateralized facilities also carries the debt flag and is counted once, under Borrowed Debt & Converts.",
    topDeals:
      "OpenAI-Oracle $300B Stargate compute contract, Microsoft-OpenAI $250B Azure commitment, OpenAI $38B AWS compute contract",
  },
  {
    id: "facilities",
    label: "Datacenter Buildout & Infrastructure",
    share: 23.29,
    amount: "$669.0B",
    amountUsd: 668_960_000_000,
    dealCount: 16,
    color: TOKEN.inkMuted,
    labelInk: "text-canvas",
    riskTier: "Medium",
    description:
      "Physical datacenter builds, high-voltage transformers, and turnkey campuses (ledger category: Big construction).",
    topDeals:
      "Stargate Project $500B US AI supercomputing build, Saudi PIF & a16z $40B AI mega-fund, BlackRock/Microsoft/MGX/GIP $30B global AI infrastructure",
  },
  {
    id: "equity",
    label: "Private Equity & Growth Rounds",
    share: 18.07,
    amount: "$519.2B",
    amountUsd: 519_249_580_000,
    dealCount: 52,
    color: TOKEN.inkSubtle,
    labelInk: "text-canvas",
    riskTier: "Medium",
    description:
      "Direct equity rounds in frontier foundation model builders and their infrastructure sponsors (ledger category: Bets & rounds).",
    topDeals:
      "OpenAI $122B round at $852B post-money, Alphabet ~$85B equity raise, Anthropic $65B Series H at $965B post-money",
  },
  {
    id: "ma",
    label: "M&A & Platform Buyouts",
    share: 15.02,
    amount: "$431.5B",
    amountUsd: 431_495_300_000,
    dealCount: 16,
    color: TOKEN.inkFaint,
    labelInk: "text-canvas",
    riskTier: "Neutral",
    description:
      "Consolidation acquisitions of AI silicon developers and enterprise SaaS pipelines (ledger category: Buyouts & mergers).",
    topDeals:
      "SpaceX acquires xAI in an all-stock ~$1.25T merger, SpaceX completes $60B all-stock acquisition of Anthropic, xAI acquires X in an all-stock deal valued at $33B",
  },
  {
    id: "other",
    label: "Vendor Partnerships & Licences",
    share: 7.84,
    amount: "$225.1B",
    amountUsd: 225_100_000_000,
    dealCount: 8,
    color: TOKEN.ruleStrong,
    labelInk: "text-ink",
    riskTier: "Neutral",
    description:
      "Chip-vendor capacity commitments, licensing-and-hire deals and venture vehicles (ledger category: Other). Several are letters of intent, not closed capital.",
    topDeals:
      "NVIDIA-OpenAI up-to-$100B 10 GW letter of intent, SoftBank $100B AI semiconductor venture, NVIDIA ~$20B Groq licence-and-hire",
  },
  {
    id: "debt",
    label: "Borrowed Debt & Converts",
    share: 7.48,
    amount: "$214.9B",
    amountUsd: 214_890_400_000,
    dealCount: 24,
    color: TOKEN.risk600,
    labelInk: "text-canvas",
    riskTier: "High",
    description:
      "Senior secured debt, GPU-collateralized loan facilities, and convertible notes (ledger flag: is_debt). Includes the $62.7B of facilities that also carry the compute flag, counted once here.",
    topDeals:
      "Anthropic & Broadcom $42.0B convertible note, Meta $30B senior notes offering, Alphabet $25B global bond sale for AI capex",
  },
  {
    id: "power_land",
    label: "Nuclear PPAs, Power & Land",
    share: 1.62,
    amount: "$46.5B",
    amountUsd: 46_475_000_000,
    dealCount: 21,
    color: TOKEN.surface3,
    labelInk: "text-ink",
    riskTier: "Neutral",
    description:
      "20-year off-grid nuclear power purchase agreements, SMR co-locations, and sub-stations (ledger category: Power & land).",
    topDeals:
      "Talen Energy & AWS revised 17-year 1,920 MW front-of-the-meter deal, Amazon AWS $11.0B Indiana campus, Microsoft & Brookfield Renewable 10.5 GW agreement",
  },
  {
    id: "share_sales",
    label: "Secondary & Strategic Share Sales",
    share: 0.54,
    amount: "$15.6B",
    amountUsd: 15_600_000_000,
    dealCount: 4,
    color: TOKEN.rule,
    labelInk: "text-ink",
    riskTier: "Neutral",
    description:
      "Employee liquidity events and strategic cross-holdings (ledger category: Share sales).",
    topDeals:
      "OpenAI $6.6B employee secondary sale, NVIDIA $5B equity investment in Intel, NVIDIA $2B purchase of Synopsys common stock",
  },
];

/** Segment lookups — the debt and equity numbers are quoted in the page copy,
 * so they are read from the segment table rather than re-typed. */
const SEGMENT_BY_ID = (id: string): CapitalSegment =>
  CAPITAL_SEGMENTS.find((s) => s.id === id) ?? CAPITAL_SEGMENTS[0];
const DEBT_SEGMENT = SEGMENT_BY_ID("debt");
const EQUITY_SEGMENT = SEGMENT_BY_ID("equity");

/** Exported so the /visualize page copy quotes the same numbers the chart
 * prints — the callout can never disagree with the bars beside it. */
export const CAPITAL_SEGMENT_TOTALS = {
  compute: SEGMENT_BY_ID("compute"),
  facilities: SEGMENT_BY_ID("facilities"),
  equity: EQUITY_SEGMENT,
  ma: SEGMENT_BY_ID("ma"),
  other: SEGMENT_BY_ID("other"),
  debt: DEBT_SEGMENT,
  powerLand: SEGMENT_BY_ID("power_land"),
  shareSales: SEGMENT_BY_ID("share_sales"),
};
/** Derived from the segment table so the header can never drift from the bar. */
const LEDGER_TOTAL_USD = CAPITAL_SEGMENTS.reduce((sum, s) => sum + s.amountUsd, 0);
const LEDGER_DEAL_COUNT = CAPITAL_SEGMENTS.reduce((n, s) => n + s.dealCount, 0);

export function CapitalCompositionChart() {
  const [activeSegmentId, setActiveSegmentId] = useState<string | null>(null);

  const activeSegment = useMemo(
    () => CAPITAL_SEGMENTS.find((s) => s.id === activeSegmentId) || null,
    [activeSegmentId]
  );

  return (
    <div className="card space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-rule">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-[13px] font-semibold tracking-wider uppercase text-ink-subtle bg-surface-2 px-2 py-0.5 rounded">
              CAPITAL ALLOCATION
            </span>
            <span className="text-[14px] font-mono text-ink-subtle">
              $2.87T across {LEDGER_DEAL_COUNT} Verified Deals
            </span>
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-ink mt-1">
            Institutional Capital Stack Breakdown
          </h3>
        </div>

        <div className="flex items-center space-x-2 text-[14px] font-mono">
          <span className="text-ink-subtle">Total Tracked:</span>
          <span className="font-bold text-safe-700 font-tabular text-sm">
            ${(LEDGER_TOTAL_USD / 1e9).toFixed(1)} Billion
          </span>
        </div>
      </div>

      {/* Modern Proportional Stacked Bar with Segment Hover */}
      <div className="space-y-2">
        <div className="flex justify-between text-[14px] font-mono text-ink-subtle px-1">
          <span>Proportional Stacked Distribution</span>
          <span>Hover segments for asset details</span>
        </div>

        <div className="h-9 w-full bg-surface-2 rounded-xl overflow-hidden flex p-1 border border-rule">
          {CAPITAL_SEGMENTS.map((seg) => {
            const isSelected = activeSegmentId === seg.id;
            const isOtherSelected = activeSegmentId !== null && !isSelected;

            return (
              <div
                key={seg.id}
                onMouseEnter={() => setActiveSegmentId(seg.id)}
                onMouseLeave={() => setActiveSegmentId(null)}
                className="relative h-full transition-colors cursor-pointer first:rounded-l-lg last:rounded-r-lg"
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
                  <div
                    className={`absolute inset-0 flex items-center justify-center pointer-events-none text-[14px] font-semibold ${seg.labelInk}`}
                  >
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
        <div className="panel space-y-2 transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: activeSegment.color }} />
              <h4 className="font-bold text-ink text-sm">
                {activeSegment.label}
              </h4>
              {activeSegment.riskTier === "High" && (
                <span className="chip chip-risk">Primary Solvency Risk Channel</span>
              )}
            </div>
            <div className="text-right">
              <span className="text-base font-bold font-mono text-ink font-tabular">
                {activeSegment.amount}
              </span>
              <span className="text-[14px] font-mono text-ink-subtle ml-2">
                ({activeSegment.share.toFixed(1)}% of total)
              </span>
            </div>
          </div>
          <p className="text-[14px] text-ink-muted leading-relaxed">
            {activeSegment.description}
          </p>
          <div className="text-[14px] text-ink-subtle pt-1">
            <span className="font-semibold text-ink-muted">Key Transactions: </span>
            <span>{activeSegment.topDeals}</span>
          </div>
        </div>
      ) : (
        <div className="panel flex flex-wrap items-center justify-between gap-2 text-[14px]">
          <span className="text-ink-muted">
            Click or hover any category tile below to isolate its capital contribution
          </span>
          <span className="num font-semibold text-risk-700">
            {DEBT_SEGMENT.amount} Debt ({DEBT_SEGMENT.share.toFixed(1)}%)
          </span>
        </div>
      )}

      {/* Grid of Category Legend Cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {CAPITAL_SEGMENTS.map((seg) => {
          const isSelected = activeSegmentId === seg.id;
          return (
            <button
              type="button"
              key={seg.id}
              aria-pressed={isSelected}
              onClick={() => setActiveSegmentId(isSelected ? null : seg.id)}
              onMouseEnter={() => setActiveSegmentId(seg.id)}
              onMouseLeave={() => setActiveSegmentId(null)}
              className={`min-h-11 rounded-lg border p-3 text-left transition-colors ${
                isSelected
                  ? "border-rule-strong bg-surface-2"
                  : "border-rule bg-surface hover:border-rule-strong"
              }`}
            >
              <span className="mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: seg.color }}
                  />
                  <span className="max-w-[130px] truncate text-[14px] font-medium text-ink">
                    {seg.label}
                  </span>
                </span>
                <span className="num text-[14px] font-semibold text-ink-subtle">
                  {seg.share.toFixed(1)}%
                </span>
              </span>

              <span className="mt-2 flex items-baseline justify-between border-t border-rule pt-1.5">
                <span
                  className={`num text-base font-semibold ${
                    seg.id === "debt" ? "text-risk-700" : "text-ink"
                  }`}
                >
                  {seg.amount}
                </span>
                {/* 2026-10-19 (round-2 consolidation): conditional plural — a single-record
                    segment must not read as "1 deals". */}
                <span className="text-[14px] text-ink-subtle">
                  {seg.dealCount} {seg.dealCount === 1 ? "deal" : "deals"}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      {/* Institutional Explanatory Insight */}
      <div className="notice notice-risk">
        <p className="notice-title">Institutional Capital Stack Interpretation</p>
        <p className="mt-1.5 text-[14px] leading-relaxed">
          While equity absorption cushions {EQUITY_SEGMENT.amount} of froth, the emergence of{" "}
          {DEBT_SEGMENT.amount} in leveraged debt facilities (Broadcom, Blackstone, CoreWeave)
          transforms what was once pure venture upside into senior credit solvency risk with rigid
          coupon obligations.
        </p>
        <p className="mt-2 text-[13px] leading-relaxed text-ink-subtle">
          Ledger reconciliation (19 Oct 2026): the eight segments are disjoint sets of the 169
          records in src/data/deals.json and add up to $2,872,873,160,000 — every share above is a
          percentage of that ledger total, not of the segment sum. The ledger&apos;s is_compute flag
          spans $813,795,780,000 (28.3%) over 35 records and its is_debt flag $214,890,400,000
          (7.5%) over 24 records; the two overlap on 7 GPU-collateralized facilities worth
          $62,692,900,000, each counted once here under Borrowed Debt &amp; Converts.
        </p>
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
  revenueB: number; // in $B
  round: string;
  notes: string;
  isExtreme?: boolean;
  isDebtExposed?: boolean;
  color?: string;
  labelOffset?: { dx: number; dy: number; anchor: "start" | "middle" | "end" };
}

/** Price-to-sales is always derived from the two numbers shown on screen, so
 * the multiple can never drift from the valuation and revenue beside it. */
const psMultiple = (p: LabPoint): number => p.valuationB / p.revenueB;

/**
 * Frontier lab multiples — 19 Oct 2026 fact-check pass.
 *
 * OpenAI: the $950B valuation was REJECTED by the fact-check (it matched no
 * report) and is replaced by the $1.2T in talks (Bloomberg, 16 Sep 2026);
 * the last CLOSED benchmark is the $852B Series G post-money (Mar 2026).
 * Anthropic: annualized run-rate passed $65B by end-July 2026 (Bloomberg,
 * then Reuters/CNBC, 17 Aug 2026), up from $47B in May.
 * xAI: revenue is the $3.2B FY2025 figure disclosed in the SpaceX S-1
 * (not the stale $500M ARR); $250B is the Feb 2026 all-stock merger value,
 * distinct from SPCX's $2.05T public cap.
 */
const LAB_DATA: LabPoint[] = [
  {
    name: "Anthropic",
    valuationB: 2000.0,
    revenueB: 65.0,
    round: "Oct 2026 Pre-IPO $2.0T Debut Target",
    notes:
      "$2.0T debut target ($965B Series H post-money) on $65.0B annualized run-rate (Bloomberg/CNBC/Reuters, 17 Aug 2026; up from $47B in May). Carries $57B Broadcom & syndicate debt.",
    isDebtExposed: true,
    color: TOKEN.risk500,
    labelOffset: { dx: 0, dy: -24, anchor: "middle" },
  },
  {
    name: "OpenAI",
    valuationB: 1200.0,
    revenueB: 50.0,
    round: "Sep 2026 $1.2T Talks / $852B Closed",
    notes:
      "Rounds in talks at >$1.2T post-money (Bloomberg, 16 Sep 2026); last closed benchmark $852B Series G post-money (Mar 2026). $50.0B annualized run-rate (FT/CNBC/Reuters, 8 Oct 2026). The $950B figure was rejected by the fact-check — it matched no report.",
    color: TOKEN.safe500,
    labelOffset: { dx: 0, dy: 24, anchor: "middle" },
  },
  {
    name: "Databricks",
    valuationB: 190.0,
    revenueB: 7.0,
    round: "Coatue Strategic AI Round",
    notes: "Largest private data & AI infrastructure provider with $7.0B revenue.",
    color: TOKEN.inkMuted,
    labelOffset: { dx: 0, dy: -24, anchor: "middle" },
  },
  {
    name: "SpaceX / xAI Colossus",
    valuationB: 250.0,
    revenueB: 3.2,
    round: "SpaceX (Nasdaq: SPCX $2.05T)",
    notes:
      "Memphis 100k+ Colossus cluster: $250B is xAI's Feb 2026 all-stock merger value (distinct from SPCX's $2.05T public cap) on $3.2B FY2025 revenue disclosed in the SpaceX S-1.",
    isExtreme: true,
    color: TOKEN.risk600,
    labelOffset: { dx: 0, dy: -24, anchor: "middle" },
  },
  {
    name: "Scale AI",
    valuationB: 29.0,
    revenueB: 1.1,
    round: "Meta Strategic 49% Stake",
    notes: "Data engine, RLHF human-in-the-loop and defense AI pipeline with $1.1B ARR.",
    isExtreme: false,
    color: TOKEN.caution500,
    labelOffset: { dx: 18, dy: 4, anchor: "start" },
  },
  {
    name: "Mistral AI",
    valuationB: 24.0,
    revenueB: 0.45,
    round: "Oct 2026 Series D (€21B / $24B)",
    notes:
      "European sovereign champion trading at 53.3× P/S on $450M ARR with €1.5B convertible debt facility.",
    isExtreme: true,
    color: TOKEN.caution400,
    labelOffset: { dx: -18, dy: -6, anchor: "end" },
  },
  {
    name: "Perplexity AI",
    valuationB: 20.0,
    revenueB: 0.5,
    round: "Institutional Series D (Nvidia)",
    notes: "Conversational search & enterprise citations trading at 40× sales on $500M ARR.",
    isExtreme: true,
    color: TOKEN.safe600,
    labelOffset: { dx: 0, dy: 24, anchor: "middle" },
  },
  {
    name: "Cohere",
    valuationB: 7.0,
    revenueB: 0.25,
    round: "Enterprise Multi-Cloud Series D",
    notes: "Enterprise frontier LLM provider with $250M ARR and 28.0× multiple.",
    isExtreme: false,
    color: TOKEN.inkSubtle,
    labelOffset: { dx: -14, dy: 18, anchor: "end" },
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
    { multiple: 10, label: "10× SaaS Equilibrium", color: TOKEN.safe500 },
    { multiple: 32, label: "32× Dot-Com Peak (2000)", color: TOKEN.caution500 },
    { multiple: 75, label: "75× Hyper-Froth Boundary", color: TOKEN.risk500 },
  ];

  // Median P/S is derived from the plotted points (19 Oct 2026: 29.4× across the
  // eight labs with a verified run-rate — the same median the model scores).
  const medianPs = useMemo(() => {
    const vals = LAB_DATA.map(psMultiple).sort((a, b) => a - b);
    const mid = Math.floor(vals.length / 2);
    return vals.length % 2 !== 0 ? vals[mid] : (vals[mid - 1] + vals[mid]) / 2;
  }, []);

  return (
    <div className="card space-y-5">
      {/* Header with Scale Switcher */}
      <div className="flex flex-col gap-3 border-b border-rule pb-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="chip chip-caution">VALUATION RADAR</span>
            <span className="text-[14px] text-ink-subtle">Valuation vs Run-Rate Revenue</span>
          </div>
          <h3 className="mt-1 text-lg font-bold text-ink">Frontier AI Lab Multiples Scatter Plot</h3>
        </div>

        {/* Scale Toggle & Median Metric */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center rounded-lg border border-rule bg-surface-2 p-0.5 text-[14px]">
            {(
              [
                { id: "log", label: "Log Scale (Log-Log)" },
                { id: "linear", label: "Linear Scale" },
              ] as const
            ).map(({ id, label }) => (
              <button
                key={id}
                onClick={() => setScaleMode(id)}
                aria-pressed={scaleMode === id}
                className={`min-h-11 whitespace-nowrap rounded-md px-3 py-2 font-semibold transition-colors ${
                  scaleMode === id
                    ? "bg-surface text-ink"
                    : "text-ink-muted hover:text-ink"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <span className="chip num font-semibold">Median: {medianPs.toFixed(1)}×</span>
        </div>
      </div>

      {/* Clean Multiple Band Legend (eliminates text collision on lines) */}
      <div className="flex flex-wrap items-center gap-2 pt-0.5">
        <span className="text-[14px] text-ink-subtle font-semibold">Valuation Multiples:</span>
        {refLines.map((ref) => (
          <span
            key={ref.multiple}
            className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-[13px] font-semibold border"
            style={{
              backgroundColor: `${ref.color}15`,
              borderColor: `${ref.color}40`,
              color: ref.color,
            }}
          >
            <span className="w-2.5 h-0.5" style={{ backgroundColor: ref.color }} />
            <span>{ref.label}</span>
          </span>
        ))}
      </div>

      {/* 2D Interactive Scatter Plot SVG */}
      <div className="relative select-none overflow-hidden rounded-xl border border-rule bg-surface-2 p-2 sm:p-4">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto cursor-default">
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
                    stroke={TOKEN.inkFaint}
                    strokeOpacity="0.12"
                    strokeDasharray="2 2"
                  />
                  <text
                    x={padding.left - 10}
                    y={y + 3.5}
                    textAnchor="end"
                    fontSize="13"
                    style={{ fill: TOKEN.inkFaint }}
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
                    stroke={TOKEN.inkFaint}
                    strokeOpacity="0.12"
                    strokeDasharray="2 2"
                  />
                  <text
                    x={x}
                    y={height - padding.bottom + 16}
                    textAnchor="middle"
                    fontSize="13"
                    style={{ fill: TOKEN.inkFaint }}
                    fontFamily="monospace"
                  >
                    {label}
                  </text>
                </g>
              );
            }
          )}

          {/* Reference Regression / Multiple Lines (10x, 32x, 75x) without colliding end text */}
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
                stroke={activeLab.isExtreme ? TOKEN.risk500 : TOKEN.inkFaint}
                strokeWidth="1.5"
                strokeDasharray="2 2"
                strokeOpacity="0.75"
              />
              <line
                x1={padding.left}
                y1={toY(activeLab.valuationB)}
                x2={toX(activeLab.revenueB)}
                y2={toY(activeLab.valuationB)}
                stroke={activeLab.isExtreme ? TOKEN.risk500 : TOKEN.inkFaint}
                strokeWidth="1.5"
                strokeDasharray="2 2"
                strokeOpacity="0.75"
              />
            </g>
          )}

          {/* Scatter Plot Bubbles with Collision-Free Positioned Labels */}
          {LAB_DATA.map((lab) => {
            const cx = toX(lab.revenueB);
            const cy = toY(lab.valuationB);
            const isActive = activeLab?.name === lab.name;
            const multiple = psMultiple(lab);

            // Size bubble slightly based on valuation
            const radius = Math.max(7, Math.min(18, 5 + Math.sqrt(lab.valuationB) * 0.9));
            const offset = lab.labelOffset || { dx: 0, dy: -20, anchor: "middle" };

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
                    stroke={lab.isExtreme ? TOKEN.risk500 : TOKEN.canvas}
                    strokeWidth="2"
                    strokeDasharray="3 3"
                    className=""
                  />
                )}

                {/* Main Bubble */}
                <circle
                  cx={cx}
                  cy={cy}
                  r={radius}
                  fill={lab.color || TOKEN.inkMuted}
                  fillOpacity={isActive ? 0.95 : 0.8}
                  style={{ stroke: TOKEN.canvas }}
                  strokeWidth={isActive ? 2.5 : 1.5}
                />

                {/* Smart Offset Lab Name Label (Zero Collision) */}
                <text
                  x={cx + offset.dx}
                  y={cy + offset.dy}
                  textAnchor={offset.anchor}
                  fontSize="13"
                  fontFamily="monospace"
                  fontWeight="bold"
                  style={{ fill: isActive ? TOKEN.ink : TOKEN.inkMuted }}
                  stroke={TOKEN.canvas}
                  strokeWidth="3.5"
                  paintOrder="stroke"
                >
                  {lab.name}{" "}
                  <tspan
                    style={{
                      fill:
                        multiple >= 50
                          ? TOKEN.risk500
                          : multiple >= 30
                          ? TOKEN.caution500
                          : TOKEN.safe500,
                    }}
                  >
                    ({multiple.toFixed(0)}×)
                  </tspan>
                </text>
              </g>
            );
          })}

          {/* Axis Labels */}
          <text
            x={padding.left + plotWidth / 2}
            y={height - 12}
            textAnchor="middle"
            fontSize="14"
            style={{ fill: TOKEN.inkSubtle }}
            fontFamily="monospace"
            fontWeight="600"
          >
            Annual Run-Rate Revenue ($B) →
          </text>
          <text
            transform={`rotate(-90) translate(-${padding.top + plotHeight / 2}, 18)`}
            textAnchor="middle"
            fontSize="14"
            style={{ fill: TOKEN.inkSubtle }}
            fontFamily="monospace"
            fontWeight="600"
          >
            Private Valuation ($B) →
          </text>
        </svg>
      </div>

      {/* Selected / Hovered Lab Deep-Dive Tooltip Banner */}
      {activeLab ? (
        <div className="panel space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: activeLab.color }} />
              <h4 className="text-base font-bold text-ink">
                {activeLab.name}
              </h4>
              <span className="text-[14px] font-mono text-ink-subtle">
                ({activeLab.round})
              </span>
              {activeLab.isExtreme && <span className="chip chip-risk">Extreme Multiple</span>}
              {activeLab.isDebtExposed && <span className="chip">$57B Debt Facilities</span>}
            </div>

            <div className="flex items-center space-x-4 font-mono text-[14px]">
              <div>
                <span className="text-ink-faint">Valuation: </span>
                <span className="font-bold text-ink">
                  ${activeLab.valuationB}B
                </span>
              </div>
              <div>
                <span className="text-ink-faint">Revenue: </span>
                <span className="font-bold text-safe-700">
                  {activeLab.revenueB < 1
                    ? `$${Math.round(activeLab.revenueB * 1000)}M`
                    : `$${activeLab.revenueB}B`}
                </span>
              </div>
              <div>
                <span className="text-ink-faint">Multiple: </span>
                <span className="font-bold text-risk-700 text-sm">
                  {psMultiple(activeLab).toFixed(1)}× P/S
                </span>
              </div>
            </div>
          </div>

          <p className="text-[14px] text-ink-muted leading-relaxed">
            {activeLab.notes}
          </p>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-2 pt-1 text-[14px] font-mono">
          <span className="text-ink-subtle">Quick Highlight:</span>
          {LAB_DATA.map((l) => (
            <button
              key={l.name}
              onClick={() => setSelectedLab(l)}
              className="num min-h-11 whitespace-nowrap rounded-lg border border-rule bg-surface px-2.5 py-2 text-[13px] text-ink-muted transition-colors hover:border-rule-strong hover:bg-surface-2 hover:text-ink"
            >
              {l.name} ({psMultiple(l).toFixed(0)}×)
            </button>
          ))}
        </div>
      )}

      {/* Footer Benchmark Comparison */}
      <div className="pt-2 border-t border-rule flex flex-col sm:flex-row sm:items-center justify-between text-[14px] font-mono text-ink-subtle gap-2">
        <div className="flex items-center space-x-2">
          <span>Historical SaaS Median: 8× – 12×</span>
          <span>•</span>
          <span>2000 Dot-Com Peak: 32.0×</span>
        </div>
        <span className="text-risk-700 font-bold">
          Frontier AI Median trades {(medianPs / 10).toFixed(1)}× higher than historical SaaS equilibrium
        </span>
      </div>
    </div>
  );
}

// ============================================================================
// 4. AI REVENUE GAP CHART (Hyperscaler Capex vs Real Software Revenue)
// ============================================================================

export function AiRevenueGapChart() {
  // 2026-10-19 fact-check (pass 3): capex basis corrected $485B (stale FY mix) → $725B guided CY2026
  // big-4 capex (Jul 2026 earnings calls: AMZN ~$220B cash capex · GOOGL $195–205B · MSFT ~$175B incl.
  // finance leases · META $130–145B; Forbes Oct 7 2026: "$700–725B, up ~75% from $410B in 2025";
  // Coatue Aug 11 2026: ~$733B). Bar scale denominator widened 500 → 800 to fit the new outlay total.
  const data = [
    {
      label: "Annual Hyperscaler AI Capex",
      amount: 725,
      display: "$725B",
      note: "Guided CY2026 (big-4): GPUs, datacenters, fiber, gigawatt substations",
      isStress: true,
      category: "Outlay",
    },
    {
      label: "Depreciation & Power Opex",
      amount: 140,
      display: "$140B",
      note: "Annual power consumption & 3-year silicon wear",
      isStress: true,
      category: "Outlay",
    },
    {
      label: "Named-Player Enterprise AI ARR",
      amount: 159,
      display: "$159B+",
      // 2026-10-19 fact-check: $165B "all verified" aggregate was unsourced. Sourced components
      // (each independently reported): OpenAI ~$50B annualized run-rate (FT/Reuters/Bloomberg,
      // Oct 8-9 2026), Anthropic $65B run-rate end-July 2026 (Bloomberg/CNBC), Microsoft AI
      // business $37B run-rate (official FY26 Q3 release, Apr 29 2026), Databricks $7B
      // (Databricks press release Aug 13 2026) => 50+65+37+7 = $159B GROSS of cloud-partner
      // overlap; Amazon's AWS AI (~$25B disclosed) adds more and is not de-duplicated here.
      note: "OpenAI $50B + Anthropic $65B + Microsoft AI $37B + Databricks $7B reported run-rates (gross, pre-dedup)",
      isRevenue: true,
      category: "Inflow",
    },
  ];

  const totalOutlay = 725 + 140; // $865B (2026-10-19: was $485B + $140B = $625B)
  const revenue = 159;
  const netDeficit = totalOutlay - revenue; // $706B (was $466B)
  const burnRatio = (totalOutlay / revenue).toFixed(1); // 5.4x (was 3.9x)

  return (
    <Reveal>
      <div className="card space-y-4 shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <span className="label">STRUCTURAL IMBALANCE</span>
          <h4 className="mt-0.5 text-base font-bold text-ink">
            The $706B Annual AI Infrastructure vs Revenue Gap
          </h4>
        </div>
        <span className="chip chip-risk num">-$706B Net Deficit</span>
      </div>

      {/* Spend Comparison Bars */}
      <div className="space-y-3 pt-1">
        {data.map((item, index) => {
          const widthPct = (item.amount / 800) * 100; // scale widened 500 → 800 with the corrected $725B capex basis
          return (
            <div key={item.label} className="space-y-1.5">
              <div className="flex flex-wrap items-baseline justify-between gap-x-3 text-[14px] sm:text-sm">
                <span className="text-sm font-semibold text-ink">
                  {item.label}{" "}
                  <span className="hidden text-[14px] font-normal text-ink-subtle sm:inline">
                    ({item.note})
                  </span>
                </span>
                <span className={`num font-semibold ${item.isRevenue ? "text-safe-700" : "text-ink"}`}>
                  {item.display}
                </span>
              </div>
              <div className="h-3.5 w-full overflow-hidden rounded-full bg-surface-2 p-0.5">
                <div
                  className={`bar-grow h-full rounded-full ${item.isRevenue ? "bg-safe-500" : "bg-surface-3"}`}
                  style={{ width: `${widthPct}%`, transitionDelay: `${index * 60}ms` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Burn Multiplier KPI Card */}
      <div className="panel space-y-2 text-[14px] sm:text-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="label">Imbalance Ratio</span>
          <span className="chip chip-risk num font-semibold">
            ${burnRatio} Spent per $1.00 Software ARR
          </span>
        </div>
        <p className="text-ink-muted leading-relaxed text-[14px]">
          {/* 2026-10-19 fact-check: basis moved to $725B guided CY2026 capex (+$140B power/depreciation run-rate) = $865B.
          OCF decision: no verified aggregate big-4 CY2026 OCF was obtainable this session (Finnhub fundamentals fields empty
          on the free tier; Alpha Vantage CASH_FLOW rate-limited after two ticks). Verified partials used instead: Forbes Oct 7 2026
          ("capex projected to consume nearly all operating cash flow"; analysts see Amazon 2026 FCF negative) and Alpha
          Vantage FY anchors — Microsoft FY2026 OCF $182.9B (SEC filer data via AV) vs its ~$175B CY2026 capex guide (≈96%). */}
          Hyperscalers (Microsoft, Meta, Google, Amazon) and neoclouds are deploying ~$865B — $725B of guided CY2026 capex plus $140B in power/depreciation — to service $159B+ of reported enterprise AI ARR (OpenAI, Anthropic, Microsoft AI, Databricks; gross of cloud-partner overlap). Guided capex now consumes nearly all four companies' operating cash flow (Forbes, Oct 7 2026); Microsoft's trailing FY26 OCF of $182.9B ≈ 96% of its ~$175B CY2026 guide (Alpha Vantage / SEC filings), with Amazon already guided to negative FCF.
        </p>
      </div>
      </div>
    </Reveal>
  );
}

// ============================================================================
// 5. TOKEN PRICE DEFLATION CHART (collapse in inference cost — input basis)
// ============================================================================
//
// 2026-10-20: the headline multiple and the damper's contribution were typed
// here from an earlier snapshot. They are now read from the SAME engine the
// published print comes from, so the chart can never disagree with the number
// above it.
const LIVE_DEFLATION_MULTIPLE = DEFAULT_MODEL_INPUTS.adoption?.apiPriceDeclineMultiple ?? 670;
const LIVE_DAMPER_POINTS =
  evaluateBubbleModel(DEFAULT_MODEL_INPUTS).contributions.find((c) => c.kind === "damper")
    ?.earnedPoints ?? -5.2;

export function TokenPriceDeflationChart() {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<"workhorse" | "frontier-sota" | "live-feed">("workhorse");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Tier 1: Workhorse & Utility Deflation Ladder — LAUNCH pricing, LAUNCH dates.
  // FACT-CHECKED Oct 19, 2026 (OpenRouter live API + official pricing pages). All rows use
  // INPUT (prompt) launch price for the bar; completion launch price shown alongside.
  // Multiples = 30 / input ($30/1M = GPT-4, Mar 14 2023 launch; unchanged to this day on OpenRouter).
  // Evidence per row in notes; historicals verified vs OpenAI/Anthropic/DeepSeek launch announcements.
  const workhorseMilestones = [
    {
      date: "Mar 2023",
      model: "OpenAI GPT-4 (Original)",
      provider: "OpenAI",
      cost: 30.0,
      display: "$30.00",
      outDisplay: "$60.00",
      multiple: "1.0× (Baseline)",
      badge: "Baseline",
      color: "bg-surface-3",
      notes: "Launch Mar 14, 2023: $30 in / $60 out per 1M. Still the listed rate today — the baseline every multiple below divides by. Sources: OpenAI Mar 2023 launch rate sheet + OpenRouter live (Oct 19, 2026)."
    },
    {
      date: "Nov 2023",
      model: "OpenAI GPT-4 Turbo",
      provider: "OpenAI",
      cost: 10.0,
      display: "$10.00",
      outDisplay: "$30.00",
      multiple: "3.0× Cheaper",
      badge: "-67%",
      color: "bg-safe-500",
      notes: "DevDay Nov 6, 2023: $10/$30 — 3× cheaper input, 2× output vs GPT-4, unlocking multi-step autonomous agent loops economically. Source: OpenAI DevDay launch pricing."
    },
    {
      date: "May 2024",
      model: "OpenAI GPT-4o",
      provider: "OpenAI",
      cost: 5.0,
      display: "$5.00",
      outDisplay: "$15.00",
      multiple: "6.0× Cheaper",
      badge: "-83.3%",
      color: "bg-surface-3",
      notes: "Omni flagship launch May 13, 2024: $5/$15 — half GPT-4's input, a quarter of its output (currently listed lower at $2.50/$10). Sources: OpenAI launch blog + Reuters (May 13, 2024)."
    },
    {
      date: "Jun 2024",
      model: "Anthropic Claude 3.5 Sonnet",
      provider: "Anthropic",
      cost: 3.0,
      display: "$3.00",
      outDisplay: "$15.00",
      multiple: "10× Cheaper",
      badge: "-90.0%",
      color: "bg-risk-500",
      notes: "Jun 20, 2024: $3/$15 — matched or beat original GPT-4 benchmarks at 1/10th the input price. Source: Anthropic launch pricing."
    },
    {
      date: "Jul 2024",
      model: "OpenAI GPT-4o-mini",
      provider: "OpenAI",
      cost: 0.15,
      display: "$0.15",
      outDisplay: "$0.60",
      multiple: "200× Cheaper",
      badge: "-99.5%",
      color: "bg-safe-500",
      notes: "Jul 18, 2024: $0.15/$0.60 — GPT-4 MMLU-class quality at 0.5% of GPT-4's input rate, making real-time classification ubiquitous. Source: OpenAI launch pricing."
    },
    {
      date: "Jan 2025",
      model: "DeepSeek R1",
      provider: "DeepSeek",
      cost: 0.55,
      display: "$0.55",
      outDisplay: "$2.19",
      multiple: "55× Cheaper",
      badge: "-98.2%",
      color: "bg-safe-500",
      notes: "MIT open-weights reasoning launch Jan 20, 2025: $0.55 in / $2.19 out ($0.14 cached-in). Forced industry-wide price compression. Today OpenRouter normalizes the legacy R1 listing to $0.70/$2.50. Sources: DeepSeek release news + OpenRouter live."
    },
    {
      date: "Sep 2025",
      model: "DeepSeek V3.2-Exp",
      provider: "DeepSeek",
      cost: 0.28,
      display: "$0.28",
      outDisplay: "$0.42",
      multiple: "107× Cheaper",
      badge: "-99.1%",
      color: "bg-surface-3",
      notes: "Sep 29, 2025: sparse-attention release halved API pricing to $0.28 in / $0.42 out. 30 / 0.28 ≈ 107×. Source: DeepSeek official launch announcement."
    },
    {
      date: "Oct 2025",
      model: "Anthropic Claude Haiku 4.5",
      provider: "Anthropic",
      cost: 1.0,
      display: "$1.00",
      outDisplay: "$5.00",
      multiple: "30× Cheaper",
      badge: "-96.7%",
      color: "bg-surface-3",
      notes: "Oct 15, 2025: extended thinking reached the Haiku line — SWE-bench Verified 73%+ at $1/$5 (1/30th GPT-4's input rate). Source: Anthropic news."
    },
    {
      date: "Sep 2026",
      model: "Google Gemini 3.8 Flash",
      provider: "Google",
      cost: 0.825,
      display: "$0.825",
      outDisplay: "$4.125",
      multiple: "36× Cheaper",
      badge: "-97.3%",
      color: "bg-safe-500",
      notes: "Released Sep 2, 2026: 1M-token multimodal streaming at OpenRouter's normalized Google rate $0.825 in / $4.125 out (Vertex non-global tier; Google's first-party global intro list is $0.75/$3.75 through Dec 31, 2026, then $1.50/$7.50). Sources: OpenRouter live + ai.google.dev pricing."
    },
    {
      date: "Sep 2026",
      model: "DeepSeek V4.1 Flash",
      provider: "DeepSeek",
      cost: 0.0448,
      display: "$0.0448",
      outDisplay: "$0.08",
      multiple: "670× Cheaper",
      badge: "-99.85%",
      color: "bg-safe-500",
      notes: "V4.1 Flash base live Sep 10, 2026: $0.0448/$0.08 on OpenRouter's aggregated open-weights serving (DeepSeek first-party API: $0.15/$0.60 off-peak). 30 / 0.0448 ≈ 670× input-basis. The Oct 17, 2026 V4.1 Flash 1017 checkpoint costs more: $0.30/$1.20. Sources: OpenRouter live + api-docs.deepseek.com."
    },
    {
      // 2026-10-20: the pipeline's live OpenRouter scan matched the base row at
      // $0.028/1M in and $0.08/1M out. That is outside the ±25% tolerance the
      // scanner applies to the verified $0.0448 pair, so the model publishes the
      // scanned price as scanned and says so. This row is that price, and it is
      // the one the published multiple comes from.
      date: "Oct 2026",
      model: "DeepSeek V4.1 Flash (today's scan)",
      provider: "DeepSeek",
      cost: 0.028,
      display: "$0.028",
      outDisplay: "$0.08",
      multiple: `${LIVE_DEFLATION_MULTIPLE.toLocaleString("en-US")}× Cheaper`,
      badge: "-99.91%",
      color: "bg-safe-500",
      notes: "The 20 Oct 2026 OpenRouter scan matched the base row at $0.028 in / $0.08 out. That is 37.5% below the verified $0.0448 pair - outside the scanner's ±25% tolerance - so the published multiple uses the scanned price as scanned, with the drift disclosed rather than smoothed. 30 / 0.028 ≈ 1,071× input-basis. Source: the daily pipeline's OpenRouter scan (src/data/live-inputs.json, adoption.apiPriceDeclineMultiple)."
    },
    {
      date: "Oct 2026",
      model: "Anthropic Claude Haiku 5.5",
      provider: "Anthropic",
      cost: 0.1,
      display: "$0.10",
      outDisplay: "$0.50",
      multiple: "300× Cheaper",
      badge: "-99.7%",
      color: "bg-surface-3",
      notes: "Anthropic's cheapest model ever, Oct 7, 2026: $0.10/$0.50 for prompts ≤100k tokens ($0.50/$2.50 above). 30 / 0.10 = 300× input-basis. Sources: Anthropic announcement + OpenRouter live (Oct 19, 2026)."
    },
  ];

  // Tier 2: Frontier SOTA Reasoning & Agency (Comparing the elite flagship models).
  // FACT-CHECKED Oct 19, 2026 — input-basis multiples vs Claude 3 Opus $15/1M input (Mar 4, 2024 launch).
  // Bar value = INPUT launch price; completion launch price shown alongside.
  const frontierReasoningMilestones = [
    {
      date: "Mar 2024",
      model: "Anthropic Claude 3 Opus",
      provider: "Anthropic",
      cost: 15.0,
      display: "$15.00",
      outDisplay: "$75.00",
      multiple: "1.0× (SOTA Baseline)",
      badge: "SOTA Baseline",
      color: "bg-surface-3",
      notes: "Premier flagship intelligence of early 2024 (Mar 4, 2024): $15 in / $75 out per 1M established the frontier ceiling. Bar = input price; all multiples below are input-basis vs $15. Sources: Anthropic launch + contemporaneous pricing pages."
    },
    {
      date: "Sep 2024",
      model: "OpenAI o1 (Full Reasoning)",
      provider: "OpenAI",
      cost: 15.0,
      display: "$15.00",
      outDisplay: "$60.00",
      multiple: "1.0× (Input Parity)",
      badge: "Input Parity",
      color: "bg-safe-500",
      notes: "First commercial test-time-compute model (Sep 12, 2024): $15/$60 — matched Opus 3's input rate while cutting output 20%; reasoning was a premium, not a price cut. Source: OpenAI launch coverage."
    },
    {
      date: "Feb 2025",
      model: "Anthropic Claude 3.7 Sonnet (Thinking)",
      provider: "Anthropic",
      cost: 3.0,
      display: "$3.00",
      outDisplay: "$15.00",
      multiple: "5.0× Cheaper",
      badge: "-80%",
      color: "bg-surface-3",
      notes: "First hybrid extended-thinking model (Feb 24, 2025): $3/$15 — one-fifth of Opus 3's input cost, with thinking tokens billed as output. Source: Anthropic launch pricing."
    },
    {
      date: "Sep 2026",
      model: "Anthropic Claude Opus 5.5",
      provider: "Anthropic",
      cost: 4.0,
      display: "$4.00",
      outDisplay: "$20.00",
      multiple: "3.75× Cheaper vs Opus 3",
      badge: "-73.3%",
      color: "bg-surface-3",
      notes: "State-of-the-art agentic software engineering (Sep 2026) at $4/$20 with 1M context — more capable than Opus 3 at a quarter of the input price. Verified live on OpenRouter Oct 19, 2026."
    },
    {
      date: "Sep 2026",
      model: "OpenAI GPT-6.1 Sol Pro",
      provider: "OpenAI",
      cost: 2.0,
      display: "$2.00",
      outDisplay: "$10.00",
      multiple: "7.5× Cheaper vs Opus 3",
      badge: "-86.7%",
      color: "bg-safe-500",
      notes: "Flagship orchestrated reasoning (Sep 2026) at $2/$10 short-context rates — 7.5× cheaper input than Opus 3 at flagship benchmark level. Verified live on OpenRouter + OpenAI pricing (Oct 19, 2026)."
    },
    {
      date: "Oct 2026",
      model: "Google Gemini 4 Argon",
      provider: "Google",
      cost: 2.0,
      display: "$2.00",
      outDisplay: "$10.00",
      multiple: "7.5× Cheaper vs Opus 3",
      badge: "-86.7%",
      color: "bg-safe-500",
      notes: "1M native multimodal reasoning flagship (Oct 2026) at $2/$10 — 7.5× cheaper input than Opus 3. Verified live on OpenRouter Oct 19, 2026."
    },
  ];

  const currentMilestones = activeTab === "frontier-sota" ? frontierReasoningMilestones : workhorseMilestones;
  const modelsList = (liveModelsData?.models || []).filter((m) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      m.name.toLowerCase().includes(q) ||
      m.provider.toLowerCase().includes(q) ||
      m.category.toLowerCase().includes(q)
    );
  });

  return (
    <Reveal>
      <div className="card space-y-4 shadow-card">
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="label">REAL-USE DAMPER</span>
            <span className="chip">OpenRouter Snapshot</span>
          </div>
          <h4 className="mt-0.5 text-base font-bold text-ink">Token Inference Deflation (Up to {LIVE_DEFLATION_MULTIPLE.toLocaleString("en-US")}× Cheaper on Input)</h4>
        </div>
        
{/* Metric badge & 3-way tab toggle */}
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <div className="-mx-1 flex min-w-0 max-w-full overflow-x-auto rounded-lg border border-rule bg-surface-2 px-1 py-0.5 scrollbar-none">
            {(
              [
                { id: "workhorse", label: `Workhorse (${LIVE_DEFLATION_MULTIPLE.toLocaleString("en-US")}×)` },
                { id: "frontier-sota", label: "Frontier Reasoning" },
                { id: "live-feed", label: `Snapshot Rates (${modelsList.length})` },
              ] as const
            ).map(({ id, label }) => (
              <button
                key={id}
                onClick={() => {
                  setActiveTab(id);
                  setHoveredIdx(null);
                }}
                aria-pressed={activeTab === id}
                className={`min-h-11 shrink-0 whitespace-nowrap rounded-md px-2.5 py-2 text-[13px] font-semibold transition-colors ${
                  activeTab === id ? "bg-surface text-ink" : "text-ink-muted hover:text-ink"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          {/* `.chip` sets its own display, so the responsive hide lives on a wrapper. */}
          <span className="hidden lg:block">
            <span className="chip chip-safe num whitespace-nowrap">
              {activeTab === "frontier-sota" ? "-86.7% SOTA Deflation (input)" : "-99.85% Max Deflation (input)"}
            </span>
          </span>
        </div>
      </div>

      {activeTab !== "live-feed" ? (
        <div className="space-y-3 pt-1">
          {currentMilestones.map((m, idx) => {
            // Strict logarithmic bar scaling for beautiful, monotonic visual decay.
            // Bar basis = INPUT launch price on both tabs (fact-checked Oct 19, 2026).
            // Frontier denominator is Opus 3's $15 input (was 75 when bars were completion-basis).
            const logPct = activeTab === "frontier-sota"
              ? Math.max(12, (Math.log10(m.cost) / Math.log10(15)) * 100)
              : Math.max(6, (Math.log10(m.cost * 10) / Math.log10(300)) * 100);
            const isHovered = hoveredIdx === idx;

            return (
              <div
                key={m.model}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
                className="space-y-1.5 cursor-pointer group"
              >
                <div className="flex justify-between items-center text-[14px] sm:text-sm font-mono">
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="truncate font-semibold text-ink">{m.model}</span>
                    <span className="shrink-0 text-ink-subtle">({m.date})</span>
                    <span className="chip shrink-0">{m.multiple}</span>
                  </div>
                  <span className="num ml-2 text-sm font-semibold text-ink">
                    {m.display} in / {m.outDisplay} out{" "}
                    <span className="block text-[14px] font-normal text-ink-faint">
                      per 1M tokens (bar = input)
                    </span>
                  </span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-surface-2 p-0.5">
                  <div
                    className={`bar-grow h-full rounded-full ${isHovered ? "bg-safe-500" : m.color}`}
                    style={{
                      width: `${logPct}%`,
                      opacity: 0.6 + idx * 0.05,
                      transitionDelay: `${Math.min(idx, 14) * 40}ms`,
                    }}
                  />
                </div>
                {isHovered && (
                  <p className="border-l-2 border-safe-300 py-1 pl-2 text-[14px] text-ink-muted">{m.notes}</p>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        /* OpenRouter Model Rates Snapshot with Search */
        <div className="space-y-2.5 pt-1">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
            <input
              type="text"
              placeholder="Search snapshot models (e.g. Claude, GPT, DeepSeek, Gemini, Flash)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="min-h-11 w-full rounded-lg border border-rule bg-surface py-2 pl-9 pr-3 text-[13px] text-ink placeholder:text-ink-faint"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-b border-rule pb-1 text-[14px]">
            <span className="label">MODEL (OCTOBER 2026 SNAPSHOT)</span>
            <div className="flex gap-6">
              <span className="hidden sm:inline">PROMPT / 1M</span>
              <span>COMPLETION / 1M</span>
              <span className="w-20 text-right">VS GPT-4</span>
            </div>
          </div>

          <div className="max-h-[300px] space-y-2 overflow-y-auto pr-1">
            {modelsList.map((mod) => (
              <div
                key={mod.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-rule bg-surface-2 p-2.5 text-[14px]"
              >
                <div className="min-w-0 space-y-0.5 pr-2">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-semibold text-ink">{mod.name}</span>
                    <span className="chip shrink-0">{mod.provider}</span>
                  </div>
                  <div className="truncate text-ink-subtle">
                    {mod.category} · {mod.contextLength ? `${(mod.contextLength / 1000).toFixed(0)}k ctx` : "Frontier"}
                  </div>
                </div>

                <div className="num flex shrink-0 items-center gap-4">
                  <span className="hidden text-ink-muted sm:inline">
                    ${mod.promptPerM.toFixed(mod.promptPerM < 0.1 ? 4 : 2)}
                  </span>
                  <span className="font-semibold text-ink">
                    ${mod.completionPerM.toFixed(mod.completionPerM < 0.1 ? 4 : 2)}
                  </span>
                  <span className="w-20 text-right font-semibold text-safe-700">
                    {mod.deflationMultiple}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between pt-1 text-[14px] text-ink-subtle">
            <span>Source: OpenRouter Public API (No key required · 470 live models, verified Oct 19, 2026)</span>
            <a
              href="https://openrouter.ai/models"
              target="_blank"
              rel="noopener noreferrer"
              className="prose-a inline-flex min-h-11 items-center gap-1 py-2 text-[13px]"
            >
              <span>Catalog</span>
              <ExternalLink className="h-3 w-3" aria-hidden="true" />
            </a>
          </div>
        </div>
      )}

      {/* Dynamic Analytical Explanation depending on Active View */}
      <div className="panel text-[14px] sm:text-sm">
        {activeTab === "workhorse" ? (
          <p className="text-ink-muted leading-relaxed">
            <strong className="text-ink">The Productivity Damper: </strong>
            Unlike the 2000 telecom fiber crash where bandwidth remained dark and transit costs did not drop fast enough to rescue burning startups, AI token inference costs have collapsed up to <strong className="text-safe-700 font-mono">670× on input</strong> (down to <span className="font-mono text-safe-600 font-bold">$0.0448 in / $0.08 out per 1M</span> on DeepSeek V4.1 Flash and <span className="font-mono text-safe-600 font-bold">$0.10 in / $0.50 out per 1M</span> on Claude Haiku 5.5; multiples vs GPT-4&apos;s $30/1M input, launch basis). This massive deflation allows software gross margins to expand rapidly, knocking <strong className="text-safe-700 font-mono">{LIVE_DAMPER_POINTS.toFixed(1)} points</strong> off the systemic bubble burst score.
          </p>
        ) : activeTab === "frontier-sota" ? (
          <p className="text-ink-muted leading-relaxed">
            <strong className="text-ink">Frontier SOTA Deflation: </strong>
            Even at the absolute cognitive frontier, test-time compute scaling and architectural distillation have compressed flagship <strong className="text-ink-muted font-mono">input rates by 7.5×</strong> (from $15.00 in / 1M on Claude 3 Opus down to $2.00 in / 1M on GPT-6.1 Sol Pro &amp; Gemini 4 Argon, and $4.00 in / 1M on Claude Opus 5.5), while expanding agentic coding capabilities and multimodal context windows by over 10×.
          </p>
        ) : (
          <p className="text-ink-muted leading-relaxed">
            <strong className="text-ink">Autonomous Ingestion Feed: </strong>
            Real-time model rate cards ingested daily at 00:00 UTC across 470 public endpoints on OpenRouter (verified Oct 19, 2026). Deflation factors are calibrated against the March 2023 GPT-4 benchmark ($30.00 in / $60.00 out per 1M tokens; multiples use the input rate).
          </p>
        )}
      </div>
      </div>
    </Reveal>
  );
}

// ============================================================================
// 6. YEARLY SURGE CHART (Deployment Velocity 2023 → 2026)
// ============================================================================

export function YearlySurgeChart() {
  const [hoveredYear, setHoveredYear] = useState<string | null>(null);

  // 19 Oct 2026: the yearly buckets are recomputed from src/data/deals.json at
  // render time instead of being typed in (the old literals were stale: 2025
  // showed $1.72T / 77 deals against a ledger $1,739,393,980,000 / 81 deals,
  // and 2026 showed $769B / 26 against $812,536,300,000 / 32).
  const years = useMemo(() => {
    const buckets = new Map<number, { n: number; sum: number }>();
    for (const d of rawDeals) {
      const b = buckets.get(d.year) ?? { n: 0, sum: 0 };
      b.n += 1;
      b.sum += d.amount_usd || 0;
      buckets.set(d.year, b);
    }

    const order = [2023, 2024, 2025, 2026];
    const maxB = Math.max(...order.map((y) => (buckets.get(y)?.sum ?? 0) / 1e9));

    return order.map((year, i) => {
      const b = buckets.get(year) ?? { n: 0, sum: 0 };
      const volumeB = b.sum / 1e9;
      const prevB = i > 0 ? (buckets.get(order[i - 1])?.sum ?? 0) / 1e9 : 0;
      const yoy =
        i === 0
          ? "Baseline"
          : year === 2026
          ? `$${(volumeB * 4).toFixed(1)}T Run-Rate`
          : `+${Math.round(((volumeB - prevB) / prevB) * 100)}%`;
      return {
        year: year === 2026 ? "2026 (YTD)" : String(year),
        label: volumeB >= 1000 ? `$${(volumeB / 1000).toFixed(2)}T` : `$${volumeB.toFixed(0)}B`,
        count: b.n,
        // Square-root scale so the early years stay legible without
        // overstating their share of the 2025 peak.
        heightPct: Math.max(8, Math.round(Math.sqrt(volumeB / maxB) * 100)),
        yoy,
      };
    });
  }, []);

  return (
    <div className="card space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[13px] font-mono text-ink-subtle font-bold uppercase tracking-wider">
            VELOCITY ACCELERATION
          </span>
          <h4 className="text-base sm:text-lg font-bold text-ink mt-0.5">
            Capital Deployment Surge by Year
          </h4>
        </div>
<span className="chip num">2023 → 2026 YTD</span>
      </div>

      <div className="flex h-44 items-end justify-between gap-4 rounded-xl border border-rule bg-surface-2 px-4 pb-2 pt-4">
        {years.map((y) => {
          const isHovered = hoveredYear === y.year;

          return (
            <div
              key={y.year}
              onMouseEnter={() => setHoveredYear(y.year)}
              onMouseLeave={() => setHoveredYear(null)}
              className="group flex h-full flex-1 cursor-pointer flex-col items-center justify-end gap-1.5"
            >
              <span className="num text-[14px] font-semibold text-ink sm:text-sm">{y.label}</span>
              <div
                className={`w-full max-w-[55px] rounded-t-lg transition-colors ${
                  isHovered ? "bg-risk-500" : "bg-surface-3"
                }`}
                style={{ height: `${y.heightPct}%` }}
              />
              <span className="text-[14px] text-ink-muted">{y.year}</span>
            </div>
          );
        })}
      </div>

      {/* Interactive Year Details */}
      <dl className="grid grid-cols-2 gap-2 pt-1 text-[14px] sm:grid-cols-4">
        {years.map((y) => (
          <div key={y.year} className="rounded-lg border border-rule bg-surface-2 p-2 text-center">
            <dt className="text-ink-subtle">{y.year}</dt>
            <dd className="num text-[14px] font-semibold text-ink">{y.yoy}</dd>
            {/* 2026-10-19 (round-2 consolidation): conditional plural — a single-deal year must
                not read as "1 deals". */}
            <dd className="num text-ink-faint">
              {y.count} {y.count === 1 ? "deal" : "deals"}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

// ============================================================================
// 7. CDS TRAJECTORY CHART (Credit Default Swaps as Leading Indicator)
// ============================================================================

export function CdsTrajectoryChart() {
  // 19 Oct 2026 fact-check: the 187bp reading (+131%) and the 155bp 90-day print
  // were stale. The 5Y Oracle CDS closed at a record 288bp on 15 Oct 2026 (S&P
  // Global Market Intelligence); the 90-day-ago print was 203bp (Jul 20–24
  // 2026, ICE); the long-run norm assumption is 81bp. 288 / 81 − 1 = +256%.
  const steps = [
    { label: "Long-run norm", value: 81, status: "Normal", isWarning: false, note: "Historical calm anchor" },
    { label: "90 Days Prior", value: 203, status: "Widening", isWarning: false, note: "Jul 20–24 2026 print (ICE)" },
    { label: "Latest Reading", value: 288, status: "Extreme (+256%)", isWarning: true, note: "Record close, 15 Oct 2026" },
  ];

  return (
    <div className="card space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <span className="label">CREDIT RADAR</span>
          <h4 className="mt-0.5 text-base font-bold text-ink">Oracle 5Y CDS Spread Trajectory</h4>
        </div>
        <span className="chip chip-risk num">+85 bp in 90 Days</span>
      </div>

      <dl className="grid grid-cols-3 gap-3">
        {steps.map((s) => (
          <div
            key={s.label}
            className={`space-y-1.5 rounded-lg border p-3 text-center ${
              s.isWarning ? "border-risk-200 bg-risk-50" : "border-rule bg-surface-2"
            }`}
          >
            <dt className="truncate text-[14px] text-ink-subtle">{s.label}</dt>
            <dd className="num text-2xl font-semibold text-ink">
              {s.value} <span className="text-[14px] text-ink-subtle">bp</span>
            </dd>
            <dd className={`text-[14px] ${s.isWarning ? "font-semibold text-risk-700" : "text-ink-muted"}`}>
              {s.status}
            </dd>
          </div>
        ))}
      </dl>

      <div className="notice notice-caution">
        <p className="notice-title">The Credit Warning Window</p>
        <p className="mt-1.5 text-[14px] leading-relaxed">
          Credit Default Swap (CDS) spreads measure bond default insurance premiums. In both 2000 and
          2008, credit widening on prime infrastructure borrowers preceded equity multiple
          contraction by 3 to 6 months.
        </p>
      </div>
    </div>
  );
}
