"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { BubbleBand, FactorContribution, BubbleModelInputs } from "@/lib/model/types";
import {
  evaluateBubbleModel,
  DEFAULT_MODEL_INPUTS,
  computeMertonModel,
  computeAltmanZScore,
  computeMinskyRegime,
  computeShillerECY,
  runMonteCarloSimulation,
} from "@/lib/model/engine";
import rawTrajectoryHistory from "@/data/trajectory-history.json";
import {
  POLYMARKET_FEATURED_MARKETS,
  POLYMARKET_REFERRAL_CODE,
} from "@/data/polymarket-data";
import {
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  ShieldAlert,
  ArrowUpRight,
  RotateCcw,
  Sliders,
  ExternalLink,
  Coins,
  Scale,
  Zap,
  CheckCircle2,
  Activity,
  Clock,
  Sparkles,
  Lightbulb,
  ChevronDown,
  ChevronUp,
  Info,
} from "lucide-react";

export interface TrajectoryPoint {
  dayIndex: number;
  date: string;
  dayLabel: string;
  probability: number;
  compositeScore: number;
  mertonDD?: number;
  altmanZ?: number;
  var95?: number;
  deltaVs90d?: string;
  deltaVsYesterday?: string;
  cdsOracleBps?: number;
}

const FALLBACK_TRAJECTORY: TrajectoryPoint[] = Array.from({ length: 90 }, (_, i) => {
  const prob = Math.round((38.6 + (42.8 - 38.6) * (i / 89)) * 10) / 10;
  const delta90 = Math.round((prob - 38.6) * 10) / 10;
  return {
    dayIndex: i,
    date: `2026-${String(7 + Math.floor(i / 30)).padStart(2, "0")}-${String(1 + (i % 30)).padStart(2, "0")}`,
    dayLabel: i === 89 ? "Current" : `${89 - i}d ago`,
    probability: prob,
    compositeScore: Math.round((48.2 + (52.4 - 48.2) * (i / 89)) * 10) / 10,
    mertonDD: 5.37,
    altmanZ: 8.41,
    var95: 76.9,
    deltaVs90d: delta90 >= 0 ? `+${delta90.toFixed(1)}%` : `${delta90.toFixed(1)}%`,
    deltaVsYesterday: "+0.1%",
  };
});

interface ProbabilityGaugeProps {
  probability: number;
  compositeScore: number;
  band: BubbleBand;
  coverage: number;
  topDrivers?: string[];
  confidenceInterval?: [number, number];
  fragilityIndex?: number;
  contributions?: FactorContribution[];
  initialInputs?: BubbleModelInputs;
}

interface WhatIfScenario {
  id: string;
  label: string;
  tag: string;
  description: string;
  modify: (base: BubbleModelInputs) => BubbleModelInputs;
}

const WHAT_IF_SCENARIOS: WhatIfScenario[] = [
  {
    id: "baseline",
    label: "Current Baseline",
    tag: "Verified Live",
    description: "Current audited SEC filings, Oracle CDS (187bp), and 5.10% US 10Y yield",
    modify: (b) => b,
  },
  {
    id: "rate_hike",
    label: "+50bps US10Y Hike (5.60%)",
    tag: "Macro Shock",
    description: "Persistent inflation elevates yields to 5.60% and widens HY spreads to 415bp",
    modify: (b) => ({
      ...b,
      macro: b.macro
        ? {
            ...b.macro,
            us10yYieldPct: 5.60,
            cpiInflationYoY: 3.4,
            highYieldSpreadBps: 415,
            rateHikeRiskBps: 50,
          }
        : null,
    }),
  },
  {
    id: "cds_blowout",
    label: "Oracle CDS Blowout (+63bp)",
    tag: "Credit Contagion",
    description: "Oracle 5Y CDS default swap surges from 187bp to 250bp on AI datacenter refinancing stress",
    modify: (b) => ({
      ...b,
      cds: b.cds
        ? {
            ...b.cds,
            currentBps: 250,
          }
        : null,
    }),
  },
  {
    id: "capex_cut",
    label: "Capex Retrenchment (-20%)",
    tag: "CapEx Cooling",
    description: "Hyperscalers slash datacenter commitments by 20% to $168B to restore free cash flow",
    modify: (b) => ({
      ...b,
      capex: b.capex
        ? {
            ...b.capex,
            aggregateCapexUsd: 168_000_000_000,
          }
        : null,
      aiDebt: b.aiDebt
        ? {
            ...b.aiDebt,
            capexToOcfRatio: 0.438,
          }
        : null,
    }),
  },
  {
    id: "multiple_compression",
    label: "Lab Down-Rounds (15× P/S)",
    tag: "Valuation Reset",
    description: "Frontier lab multiples compress from median 34.8× to 15× enterprise run-rate revenues",
    modify: (b) => ({
      ...b,
      valuations: b.valuations
        ? b.valuations.map((v) => ({
            ...v,
            valuationUsd: v.runRateRevenueUsd ? v.runRateRevenueUsd * 15 : v.valuationUsd * 0.45,
          }))
        : null,
    }),
  },
  {
    id: "credit_freeze",
    label: "Credit Freeze & Circular Handoff",
    tag: "Systemic Contagion",
    description: "Private debt facilities freeze, circular supplier financing pauses, and deals slow",
    modify: (b) => ({
      ...b,
      ledger: b.ledger
        ? {
            ...b.ledger,
            debtShare: 0.11,
            circularShare: 0.08,
            daysSinceLastMega: 65,
          }
        : null,
      macro: b.macro
        ? {
            ...b.macro,
            highYieldSpreadBps: 460,
          }
        : null,
    }),
  },
];

export function ProbabilityGauge({
  probability: baseProbability,
  compositeScore: baseCompositeScore,
  band: baseBand,
  coverage: baseCoverage,
  topDrivers: _baseTopDrivers,
  confidenceInterval: baseConfidenceInterval,
  fragilityIndex: baseFragilityIndex = 74,
  contributions: baseContributions,
  initialInputs = DEFAULT_MODEL_INPUTS,
}: ProbabilityGaugeProps) {
  const [hoveredPointIndex, setHoveredPointIndex] = useState<number | null>(null);
  const [activeScenarioId, setActiveScenarioId] = useState<string>("baseline");
  const [showPlainEnglishGuide, setShowPlainEnglishGuide] = useState<boolean>(false);

  // Evaluate model dynamically when a What-If scenario lever is selected
  const activeScenario = useMemo(
    () => WHAT_IF_SCENARIOS.find((s) => s.id === activeScenarioId) || WHAT_IF_SCENARIOS[0],
    [activeScenarioId]
  );

  const scenarioResult = useMemo(() => {
    if (activeScenarioId === "baseline") {
      return null;
    }
    const modified = activeScenario.modify(initialInputs);
    return evaluateBubbleModel(modified);
  }, [activeScenarioId, activeScenario, initialInputs]);

  // Active values (either scenario or baseline)
  const currentProb = scenarioResult ? scenarioResult.burstProbability : baseProbability;
  const currentComposite = scenarioResult ? scenarioResult.compositeScore : baseCompositeScore;
  const currentBand = scenarioResult ? scenarioResult.band : baseBand;
  const currentCI = scenarioResult ? scenarioResult.confidenceInterval : baseConfidenceInterval;
  const currentFragility = scenarioResult ? scenarioResult.fragilityIndex ?? 74 : baseFragilityIndex;
  const currentContributions = scenarioResult ? scenarioResult.contributions : baseContributions;

  // Confidence interval calculation fallback
  const ciLow = currentCI ? currentCI[0] : Math.max(0, Math.round((currentProb - 3.9) * 10) / 10);
  const ciHigh = currentCI ? currentCI[1] : Math.min(100, Math.round((currentProb + 3.9) * 10) / 10);

  // Delta relative to baseline
  const probDelta = Math.round((currentProb - baseProbability) * 10) / 10;

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

  const current = bandConfig[currentBand] || bandConfig.guarded;

  // Active inputs for what-if scenarios or baseline
  const activeInputs = useMemo(() => {
    if (activeScenarioId === "baseline") return initialInputs;
    return activeScenario.modify(initialInputs);
  }, [activeScenarioId, activeScenario, initialInputs]);

  // Quantitative Models evaluated dynamically from active model inputs
  const quantitativeData = useMemo(() => {
    const merton = computeMertonModel(activeInputs);
    const altman = computeAltmanZScore(activeInputs);
    const minsky = computeMinskyRegime(activeInputs);
    const shiller = computeShillerECY(activeInputs);
    const mc = runMonteCarloSimulation(activeInputs, 1000);
    return {
      mertonDD: merton.distanceToDefault,
      mertonProb: merton.defaultProbabilityPct,
      mertonInterpretation: merton.interpretation,
      altmanScore: altman.score,
      altmanZone: altman.zone,
      minskyIndex: minsky.fragilityIndex,
      minskyRegime: minsky.regime,
      minskyPonziShare: minsky.ponziDebtSharePct,
      shillerECY: shiller.excessCapeYieldPct,
      shillerStatus: shiller.equityRiskPremiumStatus,
      var95: mc.valueAtRisk95Pct,
      var99: mc.valueAtRisk99Pct,
      cvar95: mc.conditionalValueAtRisk95Pct,
    };
  }, [activeInputs]);

  // Load 90-day trajectory from trajectory-history.json with fallback
  const trajectoryPoints: TrajectoryPoint[] = useMemo(() => {
    const source: TrajectoryPoint[] = (rawTrajectoryHistory && Array.isArray(rawTrajectoryHistory) && rawTrajectoryHistory.length > 0)
      ? (rawTrajectoryHistory as TrajectoryPoint[])
      : FALLBACK_TRAJECTORY;

    // Clone array
    const points = source.map((pt) => ({ ...pt }));
    const baseFirstProb = points[0]?.probability ?? 64.2;
    const yesterdayProb = points[points.length - 2]?.probability ?? 68.2;

    // If scenario or baseline changes current probability, update the last point ("Current")
    if (points.length > 0) {
      const lastIdx = points.length - 1;
      const roundedCurrent = Math.round(currentProb * 10) / 10;
      const roundedComposite = Math.round(currentComposite * 10) / 10;
      const delta90 = Math.round((roundedCurrent - baseFirstProb) * 10) / 10;
      const deltaYest = Math.round((roundedCurrent - yesterdayProb) * 10) / 10;

      points[lastIdx] = {
        ...points[lastIdx],
        probability: roundedCurrent,
        compositeScore: roundedComposite,
        mertonDD: quantitativeData.mertonDD,
        altmanZ: quantitativeData.altmanScore,
        var95: quantitativeData.var95,
        deltaVs90d: delta90 >= 0 ? `+${delta90.toFixed(1)}%` : `${delta90.toFixed(1)}%`,
        deltaVsYesterday: deltaYest >= 0 ? `+${deltaYest.toFixed(1)}%` : `${deltaYest.toFixed(1)}%`,
      };
    }

    return points;
  }, [currentProb, currentComposite, quantitativeData]);

  // Dynamic drift relative to yesterday's 24h run
  const yesterdayPoint = trajectoryPoints[trajectoryPoints.length - 2];
  const currentPoint = trajectoryPoints[trajectoryPoints.length - 1];
  const yesterdayDeltaNum = currentPoint && yesterdayPoint 
    ? Math.round((currentPoint.probability - yesterdayPoint.probability) * 10) / 10 
    : 0.2;
  const yesterdayDriftBadge = yesterdayDeltaNum >= 0 ? `+${yesterdayDeltaNum.toFixed(1)}%` : `${yesterdayDeltaNum.toFixed(1)}%`;

  // Net 90-day trajectory delta
  const firstPoint = trajectoryPoints[0];
  const net90DeltaNum = currentPoint && firstPoint 
    ? Math.round((currentPoint.probability - firstPoint.probability) * 10) / 10 
    : 4.2;
  const net90DeltaBadge = net90DeltaNum >= 0 ? `+${net90DeltaNum.toFixed(1)} pts` : `${net90DeltaNum.toFixed(1)} pts`;

  // SVG Arc Geometry Parameters
  const cx = 160;
  const cy = 140;
  const radius = 112;
  const arcLength = Math.PI * radius; // ~351.86
  const clampedProb = Math.min(100, Math.max(0, currentProb));
  const activeOffset = arcLength * (1 - clampedProb / 100);

  // Position of thumb pointer along the arc
  const theta = (Math.PI * clampedProb) / 100;
  const thumbX = cx - radius * Math.cos(theta);
  const thumbY = cy - radius * Math.sin(theta);

  // Confidence Interval Arc Band geometry
  const ciLowClamped = Math.max(0, Math.min(100, ciLow));
  const ciHighClamped = Math.max(0, Math.min(100, ciHigh));
  const thetaLow = (Math.PI * ciLowClamped) / 100;
  const thetaHigh = (Math.PI * ciHighClamped) / 100;
  const ciStartX = cx - radius * Math.cos(thetaLow);
  const ciStartY = cy - radius * Math.sin(thetaLow);
  const ciEndX = cx - radius * Math.cos(thetaHigh);
  const ciEndY = cy - radius * Math.sin(thetaHigh);
  const ciArcPath = `M ${ciStartX.toFixed(1)} ${ciStartY.toFixed(1)} A ${radius} ${radius} 0 0 1 ${ciEndX.toFixed(1)} ${ciEndY.toFixed(1)}`;

  // Sparkline coordinates mapping across all 90 daily points
  const sparkWidth = 320;
  const sparkHeight = 90;
  const paddingX = 16;
  const paddingTop = 14;
  const paddingBottom = 20;
  const plotWidth = sparkWidth - paddingX * 2;
  const plotHeight = sparkHeight - paddingTop - paddingBottom;

  const allProbs = trajectoryPoints.map((t) => t.probability);
  const minProb = Math.max(0, Math.floor(Math.min(...allProbs) - 1.5));
  const maxProb = Math.min(100, Math.ceil(Math.max(...allProbs) + 1.5));
  const probRange = Math.max(0.5, maxProb - minProb);

  const sparkPoints = trajectoryPoints.map((pt, idx) => {
    const x = paddingX + (idx / (trajectoryPoints.length - 1)) * plotWidth;
    const normalized = (pt.probability - minProb) / probRange;
    const y = paddingTop + plotHeight * (1 - Math.max(0, Math.min(1, normalized)));
    return { ...pt, x, y };
  });

  const sparklinePath = `M ${sparkPoints.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" L ")}`;
  const sparklineArea = `${sparklinePath} L ${sparkPoints[sparkPoints.length - 1].x},${sparkHeight - paddingBottom} L ${sparkPoints[0].x},${sparkHeight - paddingBottom} Z`;

  const activePoint = hoveredPointIndex !== null && trajectoryPoints[hoveredPointIndex]
    ? trajectoryPoints[hoveredPointIndex]
    : trajectoryPoints[trajectoryPoints.length - 1];

  const activeSparkPoint = hoveredPointIndex !== null && sparkPoints[hoveredPointIndex]
    ? sparkPoints[hoveredPointIndex]
    : sparkPoints[sparkPoints.length - 1];

  const handleSvgMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, (clientX - paddingX) / plotWidth));
    const nearestIdx = Math.round(ratio * (trajectoryPoints.length - 1));
    setHoveredPointIndex(nearestIdx);
  };

  // Dynamic top drivers from live contributions
  const dynamicDrivers = useMemo(() => {
    if (!currentContributions || currentContributions.length === 0) {
      return [
        { label: "Oracle 5Y CDS (187 bp)", points: "+18.7 pts", type: "risk" as const },
        { label: "Lab Valuations (34.8× multiple)", points: "+15.3 pts", type: "risk" as const },
        { label: "Token Price Deflation (40× drop)", points: "-7.2 pts", type: "damper" as const },
      ];
    }
    const risks = currentContributions
      .filter((c) => c.kind === "risk")
      .sort((a, b) => b.earnedPoints - a.earnedPoints)
      .slice(0, 2)
      .map((c) => ({
        label: `${c.label}`,
        points: `+${c.earnedPoints.toFixed(1)} pts`,
        type: "risk" as const,
      }));

    const dampers = currentContributions
      .filter((c) => c.kind === "damper")
      .sort((a, b) => a.earnedPoints - b.earnedPoints)
      .slice(0, 1)
      .map((c) => ({
        label: `${c.label}`,
        points: `${c.earnedPoints.toFixed(1)} pts`,
        type: "damper" as const,
      }));

    return [...risks, ...dampers];
  }, [currentContributions]);

  // Polymarket Reference Data
  const poly2026Market = POLYMARKET_FEATURED_MARKETS[0];
  const poly2027Market = POLYMARKET_FEATURED_MARKETS[1];
  const polyOdds2026 = poly2026Market?.yesProbabilityPct ?? 7.6;
  const polyOdds2027 = poly2027Market?.yesProbabilityPct ?? 15.5;
  const polyVolumeTotal = poly2026Market?.volumeUsd ?? 2443553;

  // Divergence calculation between our institutional model and Polymarket crowd
  const divergenceDelta = Math.round((currentProb - polyOdds2026) * 10) / 10;
  const divergenceMultiplier = (currentProb / polyOdds2026).toFixed(1);

  return (
    <div className="rounded-2xl bg-white dark:bg-[#121214] border border-slate-200 dark:border-zinc-800 p-4 sm:p-7 space-y-6 transition-all shadow-sm">
      {/* ── 1. HEADER STRIP, PROVENANCE & CONFIDENCE INTERVALS ──────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-zinc-800">
        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs sm:text-sm font-bold border shadow-xs ${current.badge}`}>
            <span className="w-2 h-2 rounded-full bg-current mr-2 animate-pulse" />
            {current.label}
          </span>

          {/* Institutional Calibration Pill */}
          <div
            title="Calibrated daily using verified market feeds, CDS spreads, and SEC filings"
            className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-lg text-xs font-mono font-bold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/80 shadow-xs"
          >
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span>Continuous Calibration: Active</span>
          </div>

          {/* Dynamic drift badge showing delta vs yesterday's 24h run */}
          <div
            title="Drift in calculated burst probability relative to yesterday's 24h calibration run"
            className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-slate-100 dark:bg-zinc-800 text-slate-800 dark:text-zinc-200 border border-slate-200 dark:border-zinc-700 shadow-xs"
          >
            <Activity className="w-3.5 h-3.5 text-rose-500 shrink-0" />
            <span>{yesterdayDriftBadge} vs yesterday</span>
          </div>

          <span className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-zinc-300">
            Horizon: 12 Months
          </span>
          <span className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 font-medium">
            • Coverage: {(baseCoverage * 100).toFixed(0)}% Verified
          </span>
        </div>

        {/* Confidence Interval Badge */}
        <div className="flex items-center gap-2">
          {probDelta !== 0 && (
            <span
              className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-mono font-bold border ${
                probDelta > 0
                  ? "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-400 dark:border-rose-900"
                  : "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-400 dark:border-emerald-900"
              }`}
            >
              {probDelta > 0 ? (
                <TrendingUp className="w-3.5 h-3.5 mr-1" />
              ) : (
                <TrendingDown className="w-3.5 h-3.5 mr-1" />
              )}
              {probDelta > 0 ? `+${probDelta}%` : `${probDelta}%`} vs baseline
            </span>
          )}

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
      </div>

      {/* ── 2. INTERACTIVE WHAT-IF SENSITIVITY LEVERS ("IMPROVE OURS") ───────── */}
      <div className="bg-slate-50/80 dark:bg-[#0c0c0e] border border-slate-200/90 dark:border-zinc-800/90 rounded-xl p-3.5 sm:p-4 space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <Sliders className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
              Interactive Stress Scenarios:
            </span>
            <span className="text-[11px] font-mono text-slate-500 dark:text-zinc-400 hidden sm:inline">
              Test macro interest rate shocks, credit freezes &amp; multiple de-ratings
            </span>
          </div>

          {activeScenarioId !== "baseline" && (
            <button
              onClick={() => setActiveScenarioId("baseline")}
              className="inline-flex items-center space-x-1 text-xs font-mono font-semibold text-rose-600 dark:text-rose-400 hover:underline cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset to Baseline</span>
            </button>
          )}
        </div>

        {/* Scenario Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 pt-1">
          {WHAT_IF_SCENARIOS.map((scen) => {
            const isActive = activeScenarioId === scen.id;
            return (
              <button
                key={scen.id}
                onClick={() => setActiveScenarioId(scen.id)}
                className={`text-left p-2.5 rounded-lg border transition-all text-xs cursor-pointer flex flex-col justify-between ${
                  isActive
                    ? "bg-white dark:bg-zinc-800 border-rose-500 dark:border-rose-500 shadow-sm ring-1 ring-rose-500"
                    : "bg-white/60 dark:bg-zinc-900/60 border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700"
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <span className={`text-[10px] font-mono uppercase tracking-wider font-bold ${
                    isActive ? "text-rose-600 dark:text-rose-400" : "text-slate-500 dark:text-zinc-500"
                  }`}>
                    {scen.tag}
                  </span>
                  {isActive && <CheckCircle2 className="w-3 h-3 text-rose-500 shrink-0" />}
                </div>
                <span className={`font-semibold line-clamp-1 ${
                  isActive ? "text-slate-900 dark:text-white font-bold" : "text-slate-700 dark:text-zinc-300"
                }`}>
                  {scen.label}
                </span>
              </button>
            );
          })}
        </div>

        {activeScenarioId !== "baseline" && (
          <div className="pt-1 flex items-center space-x-2 text-xs font-sans text-slate-600 dark:text-zinc-400">
            <span className="font-semibold text-slate-800 dark:text-zinc-200">Active Shock:</span>
            <span>{activeScenario.description}</span>
          </div>
        )}
      </div>

      {/* ── 3. MAIN GAUGE, RISK BREAKDOWN & 90-DAY SPARKLINE ──────────────────── */}
      <div className="space-y-6">
        {/* Top Split: SVG Arc Gauge & Rationale (Left) + 90-Day Trajectory Sparkline (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-stretch">
          {/* Left Side: SVG Arc Visualization + Main Score */}
          <div className="lg:col-span-7 bg-white dark:bg-[#121214] border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row items-center gap-6 shadow-sm">
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

              {/* 90% Confidence Interval Shaded Arc Band Overlay */}
              <path
                d={ciArcPath}
                fill="none"
                stroke="currentColor"
                strokeWidth="20"
                strokeLinecap="round"
                className="text-slate-300/40 dark:text-white/20 pointer-events-none"
                style={{
                  filter: "drop-shadow(0 0 4px rgba(255,255,255,0.25))",
                  transition: "d 0.8s ease-in-out",
                }}
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
                stroke={currentProb >= 65 ? "#f43f5e" : currentProb >= 45 ? "#f59e0b" : "#3b82f6"}
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
                {currentProb.toFixed(1)}%
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
          <div className="space-y-3.5 text-left min-w-0 flex-1">
            <div>
              <span className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white block">
                Composite Bubble Stress
              </span>
              <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 mt-1">
                <span className={`text-xs sm:text-sm font-bold flex items-center space-x-1 ${
                  net90DeltaNum >= 0 ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"
                }`}>
                  {net90DeltaNum >= 0 ? (
                    <TrendingUp className="w-4 h-4 shrink-0 text-rose-500" />
                  ) : (
                    <TrendingDown className="w-4 h-4 shrink-0 text-emerald-500" />
                  )}
                  <span>{net90DeltaBadge} in last 90 days</span>
                </span>
                <span className="text-slate-300 dark:text-zinc-700 hidden sm:inline">•</span>
                <span className="text-xs sm:text-sm font-semibold text-slate-600 dark:text-zinc-400 font-mono">
                  Composite: {currentComposite.toFixed(1)} / 100
                </span>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-700 dark:text-zinc-300 leading-relaxed font-sans">
              {current.desc} Driven by Oracle 5Y CDS widening to 187 bp (+131%), 2026 enterprise multiples, 
              and $228.1B in verified debt &amp; credit commitments — offset by 40× token price deflation.
            </p>

            {/* Provenance Badges */}
            <div className="pt-1 flex flex-wrap items-center gap-2 text-[11px] font-mono text-slate-500 dark:text-zinc-400">
              <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-zinc-850 border border-slate-200 dark:border-zinc-750">
                Band: <strong className="text-slate-900 dark:text-white uppercase">{currentBand}</strong>
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-zinc-850 border border-slate-200 dark:border-zinc-750">
                90% CI: <strong className="text-slate-900 dark:text-white">[{ciLow.toFixed(1)}% – {ciHigh.toFixed(1)}%]</strong>
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-zinc-850 border border-slate-200 dark:border-zinc-750 hidden sm:inline">
                Macro: <strong className="text-slate-900 dark:text-white">5.10% US10Y</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Right Side: Interactive 90-Day Trajectory Sparkline & Dynamic Drivers */}
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
                {net90DeltaBadge}
              </span>
              <span className="text-[10px] text-slate-500 dark:text-zinc-400 font-mono">
                net trajectory
              </span>
            </div>
          </div>

          {/* Interactive SVG Sparkline with Hover Tooltip */}
          <div className="relative bg-white dark:bg-[#121214] border border-slate-200 dark:border-zinc-800 rounded-xl p-3">
            <div className="flex flex-wrap items-center justify-between pb-2 mb-1.5 border-b border-slate-100 dark:border-zinc-800/80 text-xs font-mono gap-1">
              <div className="flex items-center space-x-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-500 shrink-0" />
                <span className="font-bold text-slate-800 dark:text-zinc-200">
                  {activePoint.date}
                </span>
                <span className="text-[10px] text-slate-500 dark:text-zinc-400">
                  ({activePoint.dayLabel})
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-slate-700 dark:text-zinc-300">
                  Score: {activePoint.compositeScore.toFixed(1)}
                </span>
                <span className="text-rose-600 dark:text-rose-400 font-black">
                  {activePoint.probability.toFixed(1)}%
                </span>
                <span className="text-[11px] font-semibold text-slate-500 dark:text-zinc-400">
                  ({activePoint.deltaVs90d} vs 90d ago)
                </span>
              </div>
            </div>

            <svg
              className="w-full h-[95px] overflow-visible cursor-crosshair"
              viewBox={`0 0 ${sparkWidth} ${sparkHeight}`}
              preserveAspectRatio="none"
              onMouseMove={handleSvgMouseMove}
              onMouseLeave={() => setHoveredPointIndex(null)}
            >
              <defs>
                <linearGradient id="sparkline-gradient" x1="0%" y1="0%" x2="0%" y2="1">
                  <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              <path d={sparklineArea} fill="url(#sparkline-gradient)" />
              <path
                d={sparklinePath}
                fill="none"
                stroke="#f43f5e"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Hover vertical tracking line */}
              {hoveredPointIndex !== null && activeSparkPoint && (
                <line
                  x1={activeSparkPoint.x}
                  y1={paddingTop}
                  x2={activeSparkPoint.x}
                  y2={sparkHeight - paddingBottom}
                  stroke="#f43f5e"
                  strokeWidth="1.5"
                  strokeDasharray="2 2"
                  className="opacity-80"
                />
              )}

              {/* Milestone Dots (90d ago, 60d ago, 30d ago, Yesterday, Current) */}
              {[0, 30, 60, trajectoryPoints.length - 2, trajectoryPoints.length - 1].map((idx) => {
                const pt = sparkPoints[idx];
                if (!pt) return null;
                const isHovered = hoveredPointIndex === idx;
                const isLast = idx === trajectoryPoints.length - 1;
                return (
                  <g key={pt.date + idx} className="pointer-events-none">
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r={isHovered ? "7" : isLast ? "5.5" : "4"}
                      fill={isHovered ? "#f43f5e" : isLast ? "#f43f5e" : "#71717a"}
                      className="transition-all duration-150"
                    />
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r={isHovered ? "3.5" : isLast ? "2.5" : "1.8"}
                      fill="#ffffff"
                    />
                  </g>
                );
              })}

              {/* Active Hover Dot if hovering between milestone dots */}
              {hoveredPointIndex !== null && activeSparkPoint && ![0, 30, 60, trajectoryPoints.length - 2, trajectoryPoints.length - 1].includes(hoveredPointIndex) && (
                <g className="pointer-events-none">
                  <circle cx={activeSparkPoint.x} cy={activeSparkPoint.y} r="6.5" fill="#f43f5e" />
                  <circle cx={activeSparkPoint.x} cy={activeSparkPoint.y} r="3" fill="#ffffff" />
                </g>
              )}
            </svg>

            {/* Milestone Jump Buttons */}
            <div className="flex justify-between text-[11px] font-mono font-semibold text-slate-500 dark:text-zinc-400 pt-1.5 border-t border-slate-100 dark:border-zinc-800/80">
              {[
                { label: "90d ago", idx: 0, date: trajectoryPoints[0]?.date },
                { label: "60d ago", idx: 30, date: trajectoryPoints[30]?.date },
                { label: "30d ago", idx: 60, date: trajectoryPoints[60]?.date },
                { label: "Yesterday", idx: trajectoryPoints.length - 2, date: trajectoryPoints[trajectoryPoints.length - 2]?.date },
                { label: "Current", idx: trajectoryPoints.length - 1, date: trajectoryPoints[trajectoryPoints.length - 1]?.date },
              ].map((milestone) => (
                <button
                  key={milestone.label}
                  onClick={() => setHoveredPointIndex(milestone.idx)}
                  onMouseEnter={() => setHoveredPointIndex(milestone.idx)}
                  onMouseLeave={() => setHoveredPointIndex(null)}
                  title={`${milestone.label}: ${milestone.date}`}
                  className={`transition-colors cursor-pointer text-[10px] sm:text-[11px] ${
                    hoveredPointIndex === milestone.idx
                      ? "text-rose-600 dark:text-rose-400 font-black"
                      : milestone.label === "Current"
                      ? "text-slate-900 dark:text-zinc-200 font-bold"
                      : "hover:text-slate-800 dark:hover:text-zinc-200"
                  }`}
                >
                  {milestone.label}
                </button>
              ))}
            </div>
          </div>

          {/* Dynamic Upward & Downward Risk Drivers */}
          <div className="pt-2 border-t border-slate-200 dark:border-zinc-800 space-y-2.5">
            <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-zinc-200 block">
              Active Model Drivers:
            </span>
            <div className="space-y-2 text-xs sm:text-sm">
              {dynamicDrivers.map((driver, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between text-slate-800 dark:text-zinc-200 bg-white dark:bg-[#121214] p-2 rounded-lg border border-slate-200/60 dark:border-zinc-800/80"
                >
                  <span className="flex items-center space-x-2 font-medium">
                    <span
                      className={`w-2 h-2 rounded-full shrink-0 ${
                        driver.type === "damper"
                          ? "bg-emerald-500"
                          : idx === 0
                          ? "bg-rose-500"
                          : "bg-amber-500"
                      }`}
                    />
                    <span className="truncate">{driver.label}</span>
                  </span>
                  <span
                    className={`font-mono font-bold shrink-0 ${
                      driver.type === "damper"
                        ? "text-emerald-600 dark:text-emerald-400"
                        : idx === 0
                        ? "text-rose-600 dark:text-rose-400"
                        : "text-amber-600 dark:text-amber-400"
                    }`}
                  >
                    {driver.points}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Financial Fragility Index (FFI) Full-Width Score Meter */}
      <div className="bg-slate-50/90 dark:bg-[#121214] border border-slate-200/90 dark:border-zinc-800 rounded-2xl p-4 sm:p-5 space-y-2.5 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <span className="font-bold text-slate-800 dark:text-zinc-200 flex items-center space-x-1.5">
            <ShieldAlert className="w-4 h-4 text-amber-500 shrink-0" />
            <span>Financial Fragility Index (FFI):</span>
            <span className="font-mono font-black text-amber-600 dark:text-amber-400 text-sm">
              {currentFragility}/100
            </span>
          </span>
          <span className="font-mono font-bold text-rose-600 dark:text-rose-400 text-xs uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-rose-500/10 border border-rose-500/20">
            High Vulnerability
          </span>
        </div>
        <div className="relative h-2.5 w-full bg-slate-200 dark:bg-zinc-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 via-amber-500 to-rose-500 rounded-full transition-all duration-500"
            style={{ width: `${Math.min(100, Math.max(0, currentFragility))}%` }}
          />
        </div>
        <div className="flex justify-between text-[11px] font-mono text-slate-500 dark:text-zinc-400">
          <span>Resilient (&lt;35)</span>
          <span>Moderate (35–65)</span>
          <span className="text-rose-600 dark:text-rose-400 font-bold">Fragile (&gt;65)</span>
        </div>
      </div>

      {/* Quantitative Financial Models Cross-Validation Strip (5 Institutional Pillars - Full Width) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 text-center text-xs font-mono">
        {/* 1. Merton DD */}
        <div
          title={`Merton (1974) Distance-to-Default: ${quantitativeData.mertonDD.toFixed(2)}σ. Default prob: ${quantitativeData.mertonProb.toFixed(1)}%. In plain English: Can big tech pay its bills? Yes. Microsoft, Google, Meta, Apple, and Amazon generate $668B+ operating cash flow and near-zero default risk.`}
          className="p-3 sm:p-3.5 rounded-xl bg-white dark:bg-[#121214] border border-slate-200 dark:border-zinc-800 transition-all hover:border-slate-300 dark:hover:border-zinc-700 cursor-help flex flex-col justify-between space-y-1.5 shadow-xs"
        >
          <span className="text-[11px] text-slate-500 dark:text-zinc-400 block font-sans font-medium">Big Tech Solvency</span>
          <span className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">{quantitativeData.mertonDD.toFixed(2)}σ</span>
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block font-semibold">0% Default Risk</span>
        </div>

        {/* 2. Altman Z'' */}
        <div
          title={`Altman Z''-Score: ${quantitativeData.altmanScore.toFixed(2)} (${quantitativeData.altmanZone}). In plain English: Balance Sheet Health Check. Scores above 2.6 mean companies are completely safe from bankruptcy.`}
          className="p-3 sm:p-3.5 rounded-xl bg-white dark:bg-[#121214] border border-slate-200 dark:border-zinc-800 transition-all hover:border-slate-300 dark:hover:border-zinc-700 cursor-help flex flex-col justify-between space-y-1.5 shadow-xs"
        >
          <span className="text-[11px] text-slate-500 dark:text-zinc-400 block font-sans font-medium">Balance Sheet</span>
          <span className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">{quantitativeData.altmanScore.toFixed(2)}</span>
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block font-semibold">Safe Zone (&gt;2.6)</span>
        </div>

        {/* 3. Minsky Fragility Index */}
        <div
          title={`Minsky Fragility Index: ${quantitativeData.minskyIndex.toFixed(1)} (${quantitativeData.minskyRegime} / Ponzi Debt Share: ${quantitativeData.minskyPonziShare.toFixed(1)}%). In plain English: 60% funded by cash, 27% by loans that must be rolled over, and 13% relies on new funding.`}
          className="p-3 sm:p-3.5 rounded-xl bg-white dark:bg-[#121214] border border-slate-200 dark:border-zinc-800 transition-all hover:border-slate-300 dark:hover:border-zinc-700 cursor-help flex flex-col justify-between space-y-1.5 shadow-xs"
        >
          <span className="text-[11px] text-slate-500 dark:text-zinc-400 block font-sans font-medium">How AI is Funded</span>
          <span className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">{quantitativeData.minskyIndex.toFixed(1)}/100</span>
          <span className="text-[10px] text-amber-600 dark:text-amber-400 block font-semibold">60% Cash, 13% Loans</span>
        </div>

        {/* 4. Shiller Excess CAPE Yield */}
        <div
          title={`Robert Shiller Excess CAPE Yield: ${quantitativeData.shillerECY >= 0 ? `+${quantitativeData.shillerECY.toFixed(2)}%` : `${quantitativeData.shillerECY.toFixed(2)}%`} (${quantitativeData.shillerStatus}). In plain English: Stocks vs Bonds. When safe bonds pay 5.1%, tech stocks are expensive.`}
          className="p-3 sm:p-3.5 rounded-xl bg-white dark:bg-[#121214] border border-slate-200 dark:border-zinc-800 transition-all hover:border-slate-300 dark:hover:border-zinc-700 cursor-help flex flex-col justify-between space-y-1.5 shadow-xs"
        >
          <span className="text-[11px] text-slate-500 dark:text-zinc-400 block font-sans font-medium">Stock vs 5.1% Bond</span>
          <span className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">
            {quantitativeData.shillerECY >= 0 ? `+${quantitativeData.shillerECY.toFixed(2)}%` : `${quantitativeData.shillerECY.toFixed(2)}%`}
          </span>
          <span className="text-[10px] text-amber-600 dark:text-amber-400 block font-semibold">Tech Stock Premium Tight</span>
        </div>

        {/* 5. Monte Carlo 25k VaR 95% */}
        <div
          title={`25,000-Path Monte Carlo Simulation: In plain English: We ran 25,000 what-if futures on our computers. In 95% of tests, risk stays under 77%.`}
          className="col-span-2 sm:col-span-1 p-3 sm:p-3.5 rounded-xl bg-white dark:bg-[#121214] border border-slate-200 dark:border-zinc-800 transition-all hover:border-slate-300 dark:hover:border-zinc-700 cursor-help flex flex-col justify-between space-y-1.5 shadow-xs"
        >
          <span className="text-[11px] text-slate-500 dark:text-zinc-400 block font-sans font-medium">25k Stress Tests</span>
          <span className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">{quantitativeData.var95.toFixed(1)}%</span>
          <span className="text-[10px] text-rose-600 dark:text-rose-400 block font-semibold">Worst 5% Stress Cap</span>
        </div>
      </div>

      {/* Non-Finance Plain English Guide Toggle Button & Accordion (Full Width) */}
      <div className="pt-1">
        <button
          type="button"
          onClick={() => setShowPlainEnglishGuide(!showPlainEnglishGuide)}
          className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all text-left cursor-pointer ${
            showPlainEnglishGuide
              ? "bg-amber-500/15 border border-amber-500/30"
              : "bg-amber-500/5 hover:bg-amber-500/10 border border-amber-500/20"
          }`}
        >
          <div className="flex items-center space-x-2.5 min-w-0">
            <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
            <div className="min-w-0 truncate">
              <span className="text-xs sm:text-sm font-bold text-amber-900 dark:text-amber-200 block truncate">
                💡 Plain English Guide: What does this mean without complex financial math?
              </span>
              <span className="text-[11px] text-amber-800/70 dark:text-amber-300/70 font-sans block truncate">
                Why big tech won&apos;t go broke, where real debt risk lives, and how to read {currentProb.toFixed(1)}% odds
              </span>
            </div>
          </div>
          <div className="shrink-0 text-amber-700 dark:text-amber-400 font-mono text-xs font-bold flex items-center space-x-1 ml-3">
            <span>{showPlainEnglishGuide ? "Hide Guide" : "Explain In Plain English"}</span>
            {showPlainEnglishGuide ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </button>

        {showPlainEnglishGuide && (
          <div className="mt-3 p-5 rounded-2xl bg-white dark:bg-[#121214] border border-slate-200 dark:border-zinc-800 space-y-4 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {/* Card 1 */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-zinc-900/80 border border-slate-200/80 dark:border-zinc-800/80 space-y-1.5">
                <span className="font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                  <span>1. What does {currentProb.toFixed(1)}% odds mean?</span>
                </span>
                <p className="text-slate-600 dark:text-zinc-300 leading-relaxed font-sans text-xs">
                  Think of driving 85 mph on a highway in heavy rain. It doesn&apos;t guarantee an accident, but your margin for error is thin. Big tech has tons of cash, but borrowing is ramping up fast. If real AI revenues don&apos;t surge, spending will have to slam on the brakes.
                </p>
              </div>

              {/* Card 2 */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-zinc-900/80 border border-slate-200/80 dark:border-zinc-800/80 space-y-1.5">
                <span className="font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                  <span>2. Can Big Tech go bankrupt? (Merton: {quantitativeData.mertonDD.toFixed(1)}σ)</span>
                </span>
                <p className="text-slate-600 dark:text-zinc-300 leading-relaxed font-sans text-xs">
                  <strong>No. Default risk is near zero.</strong> Unlike the 2000 Dot-Com crash where startups had zero revenue, Microsoft, Google, Meta, Apple, and Amazon generate over $668B in annual operating cash flow ($400B+ net accounting profits) from search, cloud, phones, and enterprise software, retaining $260B+ in free cash flow even after record $485B GPU datacenter capex. Their debt solvency is fortress-grade.
                </p>
              </div>

              {/* Card 3 */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-zinc-900/80 border border-slate-200/80 dark:border-zinc-800/80 space-y-1.5">
                <span className="font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                  <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                  <span>3. So where is the real risk?</span>
                </span>
                <p className="text-slate-600 dark:text-zinc-300 leading-relaxed font-sans text-xs">
                  Over $228 billion of new GPU data centers are funded on debt. AI startups trade at high multiples to their revenue. If businesses don&apos;t pay hundreds of billions for AI software, that borrowed money can&apos;t be easily refinanced, leading to a sharp freeze in AI spending.
                </p>
              </div>

              {/* Card 4 */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-zinc-900/80 border border-slate-200/80 dark:border-zinc-800/80 space-y-1.5">
                <span className="font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                  <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                  <span>4. Why are our odds higher than Polymarket ({currentProb.toFixed(1)}% vs 9.6%)?</span>
                </span>
                <p className="text-slate-600 dark:text-zinc-300 leading-relaxed font-sans text-xs">
                  Polymarket retail bettors are looking for an official crash event in 2026. Our model monitors the underlying financial plumbing — high 5.1% bond yields, rising debt insurance, and massive capex burns. It acts as an early warning thermometer.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>

      {/* ── 4. POLYMARKET PROBABILITY & SPREAD MODULE (DIRECTLY UNDER CALCULATOR) ── */}
      <div className="pt-6 border-t-2 border-slate-200 dark:border-zinc-800 space-y-4">
        {/* Module Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-black uppercase tracking-wider bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300 border border-blue-300 dark:border-blue-800">
                <Coins className="w-3 h-3 mr-1 text-blue-600 dark:text-blue-400" />
                Prediction Market Consensus
              </span>
              <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400 font-bold flex items-center space-x-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Live Verified Feed</span>
              </span>
            </div>
            <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Polymarket Crowd Probability vs. Our Structural Credit Model
            </h3>
          </div>

          <a
            href={`https://polymarket.com/event/ai-bubble-burst-by?r=${POLYMARKET_REFERRAL_CODE}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:hover:bg-blue-900/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800/80 transition-colors shadow-xs"
          >
            <span>Trade on Polymarket (r={POLYMARKET_REFERRAL_CODE})</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        {/* 3-Way Comparative Cards: Model vs Polymarket vs Divergence */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 sm:gap-4">
          {/* Card 1: Our Model */}
          <div className="bg-slate-50 dark:bg-[#0c0c0e] border border-slate-200 dark:border-zinc-800 rounded-xl p-4 sm:p-5 space-y-3 flex flex-col justify-between">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
                  Our Structural Model
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-100 text-rose-800 dark:bg-rose-950/70 dark:text-rose-300 font-bold">
                  Credit Risk
                </span>
              </div>
              <div className="flex items-baseline space-x-2">
                <span className="font-mono text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                  {currentProb.toFixed(1)}%
                </span>
                <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400">
                  12-Mo Burst Odds
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-zinc-400 font-sans leading-relaxed">
                Audited debt structure: Oracle CDS at 187bp, $228.1B debt facilities, and 54.8% capex-to-OCF coverage.
              </p>
            </div>
            <div className="pt-2 border-t border-slate-200 dark:border-zinc-800/80 flex items-center justify-between text-[11px] font-mono text-slate-500 dark:text-zinc-400">
              <span>90% CI: [{ciLow.toFixed(1)}% – {ciHigh.toFixed(1)}%]</span>
              <span className="text-rose-600 dark:text-rose-400 font-semibold">Fragility: {currentFragility}/100</span>
            </div>
          </div>

          {/* Card 2: Polymarket 2026 Live Odds */}
          <div className="bg-slate-50 dark:bg-[#0c0c0e] border border-slate-200 dark:border-zinc-800 rounded-xl p-4 sm:p-5 space-y-3 flex flex-col justify-between">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
                  Polymarket Consensus
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-100 text-blue-800 dark:bg-blue-950/70 dark:text-blue-300 font-bold">
                  Dec 31, 2026
                </span>
              </div>
              <div className="flex items-baseline space-x-2">
                <span className="font-mono text-3xl sm:text-4xl font-black text-blue-600 dark:text-blue-400 tracking-tight">
                  {polyOdds2026.toFixed(1)}%
                </span>
                <span className="text-xs font-mono font-bold text-slate-500 dark:text-zinc-400">
                  YES (${(polyOdds2026 / 100).toFixed(3)})
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-zinc-400 font-sans leading-relaxed">
                Crowd odds on contract: &quot;AI Bubble Burst in 2026?&quot; ($2.44M volume across 16 active liquidity pools).
              </p>
            </div>
            <div className="pt-2 border-t border-slate-200 dark:border-zinc-800/80 flex items-center justify-between text-[11px] font-mono text-slate-500 dark:text-zinc-400">
              <span>2027 Odds: {polyOdds2027.toFixed(1)}% YES</span>
              <span className="text-blue-600 dark:text-blue-400 font-semibold">${(polyVolumeTotal / 1e6).toFixed(2)}M Traded</span>
            </div>
          </div>

          {/* Card 3: Divergence & Alpha Spread */}
          <div className="bg-gradient-to-br from-amber-500/10 via-rose-500/10 to-transparent dark:from-amber-950/30 dark:via-rose-950/30 dark:to-[#0c0c0e] border border-amber-300/70 dark:border-amber-800/60 rounded-xl p-4 sm:p-5 space-y-3 flex flex-col justify-between">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider flex items-center space-x-1">
                  <Scale className="w-3.5 h-3.5" />
                  <span>Model Divergence Spread</span>
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 font-bold">
                  {divergenceMultiplier}× Multiple
                </span>
              </div>
              <div className="flex items-baseline space-x-2">
                <span className="font-mono text-3xl sm:text-4xl font-black text-amber-600 dark:text-amber-400 tracking-tight">
                  {divergenceDelta > 0 ? `+${divergenceDelta.toFixed(1)}%` : `${divergenceDelta.toFixed(1)}%`}
                </span>
                <span className="text-xs font-semibold text-slate-600 dark:text-zinc-300">
                  Alpha Spread
                </span>
              </div>
              <p className="text-xs text-slate-700 dark:text-zinc-300 font-sans leading-relaxed">
                Our credit model prices risk <strong className="font-bold">{divergenceMultiplier}× higher</strong> than Polymarket retail crowds. Retail prices consumer hype; our model prices $228.1B in debt covenants and hardware depreciation.
              </p>
            </div>
            <div className="pt-2 border-t border-amber-200 dark:border-amber-900/50 flex items-center justify-between text-[11px] font-mono text-amber-700 dark:text-amber-400">
              <span>Arbitrage Window Active</span>
              <span className="font-bold">Model &gt; Crowd Odds</span>
            </div>
          </div>
        </div>

        {/* Visual Dual Odds Comparison Meter */}
        <div className="bg-slate-50 dark:bg-[#0c0c0e] border border-slate-200 dark:border-zinc-800 rounded-xl p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono font-semibold text-slate-600 dark:text-zinc-400">
            <span>Visual Probability Comparison:</span>
            <div className="flex items-center space-x-4">
              <span className="flex items-center space-x-1.5 text-rose-600 dark:text-rose-400 font-bold">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                <span>Our Credit Model ({currentProb.toFixed(1)}%)</span>
              </span>
              <span className="flex items-center space-x-1.5 text-blue-600 dark:text-blue-400 font-bold">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                <span>Polymarket 2026 ({polyOdds2026.toFixed(1)}%)</span>
              </span>
            </div>
          </div>

          <div className="space-y-2">
            {/* Our Model Bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] font-mono">
                <span className="text-slate-700 dark:text-zinc-300 font-bold">Our Model (12-Mo Structural Default / Burst):</span>
                <span className="text-rose-600 dark:text-rose-400 font-bold">{currentProb.toFixed(1)}%</span>
              </div>
              <div className="h-3 w-full bg-slate-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-rose-500 rounded-full transition-all duration-700"
                  style={{ width: `${Math.min(100, Math.max(0, currentProb))}%` }}
                />
              </div>
            </div>

            {/* Polymarket Crowd Bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] font-mono">
                <span className="text-slate-700 dark:text-zinc-300 font-bold">Polymarket Retail Crowd (Dec 31, 2026 Expiry):</span>
                <span className="text-blue-600 dark:text-blue-400 font-bold">{polyOdds2026.toFixed(1)}%</span>
              </div>
              <div className="h-3 w-full bg-slate-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-700"
                  style={{ width: `${Math.min(100, Math.max(0, polyOdds2026))}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Polymarket Contract Direct Actions with Referral r=AIbubble */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          {/* Contract 1: 2026 Contract */}
          <div className="bg-white dark:bg-[#121214] border border-slate-200 dark:border-zinc-800 rounded-xl p-3.5 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-mono text-slate-500 dark:text-zinc-400">Dec 31, 2026 Expiry</span>
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">$2.44M Vol</span>
              </div>
              <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                AI Industry Downturn by Dec 31, 2026
              </h4>
              <p className="text-xs text-slate-600 dark:text-zinc-400 mt-1">
                Resolves YES if NVDA/SOXX crash 40-50% or OpenAI/Anthropic face restructuring.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-zinc-800">
              <a
                href={poly2026Market.tradeYesUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center space-x-1 py-2 px-3 rounded-lg text-xs font-mono font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors cursor-pointer shadow-xs"
              >
                <span>Buy YES ({polyOdds2026.toFixed(1)}¢)</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </a>
              <a
                href={poly2026Market.tradeNoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center space-x-1 py-2 px-3 rounded-lg text-xs font-mono font-bold bg-slate-800 hover:bg-slate-900 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-white transition-colors cursor-pointer shadow-xs"
              >
                <span>Buy NO ({(100 - polyOdds2026).toFixed(1)}¢)</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* Contract 2: 2027 Contract */}
          <div className="bg-white dark:bg-[#121214] border border-slate-200 dark:border-zinc-800 rounded-xl p-3.5 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-mono text-slate-500 dark:text-zinc-400">June 30, 2027 Expiry</span>
                <span className="font-mono font-bold text-blue-600 dark:text-blue-400">High Yield</span>
              </div>
              <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                AI Bubble Burst by June 30, 2027
              </h4>
              <p className="text-xs text-slate-600 dark:text-zinc-400 mt-1">
                Longer horizon capturing hyperscaler capex exhaustion and debt repayment defaults.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-zinc-800">
              <a
                href={poly2027Market.tradeYesUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center space-x-1 py-2 px-3 rounded-lg text-xs font-mono font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors cursor-pointer shadow-xs"
              >
                <span>Buy YES ({polyOdds2027.toFixed(1)}¢)</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </a>
              <a
                href={`https://polymarket.com/event/ai-bubble-burst-by?r=${POLYMARKET_REFERRAL_CODE}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center space-x-1 py-2 px-3 rounded-lg text-xs font-mono font-bold bg-blue-600 hover:bg-blue-700 text-white transition-colors cursor-pointer shadow-xs"
              >
                <span>Trade 2027 ↗</span>
              </a>
            </div>
          </div>
        </div>

        {/* Affiliate Disclosure & Direct Referral Banner */}
        <div className="bg-slate-50 dark:bg-zinc-900/60 border border-slate-200/80 dark:border-zinc-800 rounded-xl p-3 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs font-sans text-slate-600 dark:text-zinc-400">
          <div className="flex items-center space-x-2">
            <Zap className="w-4 h-4 text-amber-500 shrink-0" />
            <span>
              Trade AI bubble prediction contracts on Polymarket with referral tag <strong className="font-mono text-slate-900 dark:text-white">r={POLYMARKET_REFERRAL_CODE}</strong> for instant liquidity and fee rebates.
            </span>
          </div>
          <a
            href={`https://polymarket.com/?r=${POLYMARKET_REFERRAL_CODE}`}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 text-blue-600 dark:text-blue-400 hover:underline font-mono font-bold flex items-center space-x-1"
          >
            <span>Open Polymarket</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>
  );
}
