"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
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
import liveInputsData from "@/data/live-inputs.json";
import latestModel from "@/data/latest-model.json";
import {
  POLYMARKET_FEATURED_MARKETS,
  POLYMARKET_REFERRAL_CODE,
} from "@/data/polymarket-data";
import {
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  RotateCcw,
  Sliders,
  Activity,
  Clock,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useCountUp } from "@/components/CountUp";
import { useInView, usePrefersReducedMotion } from "@/components/Reveal";

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
  /** True when the point was seeded from the model rather than recorded. */
  backfilled?: boolean;
}

/**
 * Fallback trajectory — used ONLY when src/data/trajectory-history.json is
 * missing or empty (19 Oct 2026).
 *
 * Re-anchored to the published world: the recorded 90-day path runs 38.6% →
 * 71.6% burst probability on a composite score of 48.3 → 63.3, with Merton
 * distance-to-default 5.13σ and Monte Carlo VaR95 84.6% at the current point
 * (src/data/latest-model.json, model v2.6.0). The UI marks the panel as a
 * fallback whenever this array is the source.
 *
 * 2026-10-19 (round-2 consolidation): end-point re-synced to
 * src/data/latest-model.json (burst 71.6 / composite 63.3) — the values had
 * been pinned to the pre-rebaseline 71.7 / 63.4.
 */
const FALLBACK_TRAJECTORY: TrajectoryPoint[] = Array.from({ length: 90 }, (_, i) => {
  const t = i / 89;
  const prob = Math.round((38.6 + (71.6 - 38.6) * t) * 10) / 10;
  const composite = Math.round((48.3 + (63.3 - 48.3) * t) * 10) / 10;
  const delta90 = Math.round((prob - 38.6) * 10) / 10;
  return {
    dayIndex: i,
    date: `2026-${String(7 + Math.floor(i / 30)).padStart(2, "0")}-${String(1 + (i % 30)).padStart(2, "0")}`,
    dayLabel: i === 89 ? "Current" : `${89 - i}d ago`,
    probability: prob,
    compositeScore: composite,
    mertonDD: Math.round((5.82 + (5.13 - 5.82) * t) * 100) / 100,
    altmanZ: Math.round((8.8 + (8.41 - 8.8) * t) * 100) / 100,
    var95: Math.round((72 + (84.6 - 72) * t) * 10) / 10,
    // 2026-10-19 (round-2 consolidation): "pts" — the trajectory deltas are probability-point
    // changes, matching trajectory-history.json and the home page.
    deltaVs90d: delta90 >= 0 ? `+${delta90.toFixed(1)} pts` : `${delta90.toFixed(1)} pts`,
    deltaVsYesterday: "+0.2 pts",
  };
});

interface ProbabilityGaugeProps {
  probability: number;
  compositeScore: number;
  band: BubbleBand;
  coverage: number;
  topDrivers?: string[];
  /**
   * DEPRECATED (model v2.6.0): the hand-rolled factor-dispersion band was
   * deleted. The gauge now renders the published Monte-Carlo input-sensitivity
   * range (src/data/latest-model.json → monteCarlo.ci95Pct). The prop is kept
   * so existing callers keep compiling; it is no longer read.
   */
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

/** Median P/S across the labs with a verified run-rate (same basis as
 * /api/v1/model). 19 Oct 2026 live value: 29.4×. */
function medianPsMultiple(base: BubbleModelInputs): number {
  const ps = (base.valuations ?? [])
    .filter((v) => v.runRateRevenueUsd !== null && (v.runRateRevenueUsd as number) >= 100_000_000)
    .map((v) => v.valuationUsd / (v.runRateRevenueUsd as number))
    .sort((a, b) => a - b);
  if (ps.length === 0) return 29.4; // 19 Oct 2026 canonical live median
  const mid = Math.floor(ps.length / 2);
  return ps.length % 2 !== 0 ? ps[mid] : (ps[mid - 1] + ps[mid]) / 2;
}

/**
 * What-if levers are rebuilt from the LIVE model inputs at render time.
 *
 * 19 Oct 2026 fact-check: the old cards were pinned to a pre-verification
 * world — "Oracle CDS (187bp)", a "+63bp" blowout that was really a
 * relaxation (250 − 187), a "-20%" capex cut written as $168B against a $725B
 * live capex, and a 34.8× multiple median. Every label and every stressed
 * input below is now derived from the model inputs the gauge is rendering.
 */
function buildWhatIfScenarios(base: BubbleModelInputs): WhatIfScenario[] {
  const liveCds = base.cds?.currentBps ?? 288;
  const liveCapex = base.capex?.aggregateCapexUsd ?? 725_000_000_000;
  const liveUs10y = base.macro?.us10yYieldPct ?? 5.1;
  const liveHy = base.macro?.highYieldSpreadBps ?? 323;
  const liveDebtShare = base.ledger?.debtShare ?? 0.075;
  const liveMedianPs = medianPsMultiple(base);

  // Credit blowout: live spread +112bp → 400bp, a genuine stress level above
  // the 288bp record close (15 Oct 2026) rather than a move toward calm.
  const blowoutBps = liveCds + 112;
  // Capex retrenchment: a real 20% cut of the live guided capex.
  const cutCapex = Math.round(liveCapex * 0.8);
  // Multiple compression: half the live median.
  const targetPs = Math.round(liveMedianPs / 2);

  return [
    {
      id: "baseline",
      label: "Current Baseline",
      tag: "Verified Live",
      description: `Current audited SEC filings, Oracle CDS (${liveCds}bp), and ${liveUs10y.toFixed(2)}% US 10Y yield`,
      modify: (b) => b,
    },
    {
      id: "rate_hike",
      label: `+50bps US10Y Hike (${(liveUs10y + 0.5).toFixed(2)}%)`,
      tag: "Macro Shock",
      description: `Persistent inflation elevates yields to ${(liveUs10y + 0.5).toFixed(2)}% and widens HY spreads to ${liveHy + 92}bp`,
      modify: (b) => ({
        ...b,
        macro: b.macro
          ? {
              ...b.macro,
              us10yYieldPct: Number((liveUs10y + 0.5).toFixed(2)),
              highYieldSpreadBps: liveHy + 92,
              rateHikeRiskBps: 50,
            }
          : null,
      }),
    },
    {
      id: "cds_blowout",
      label: `Oracle CDS Blowout (+112bp → ${blowoutBps}bp)`,
      tag: "Credit Contagion",
      description: `Oracle 5Y CDS default swap surges from ${liveCds}bp to ${blowoutBps}bp on AI datacenter refinancing stress`,
      modify: (b) => ({
        ...b,
        cds: b.cds
          ? {
              ...b.cds,
              currentBps: blowoutBps,
            }
          : null,
      }),
    },
    {
      id: "capex_cut",
      label: "Capex Retrenchment (-20%)",
      tag: "CapEx Cooling",
      description: `Hyperscalers cut guided datacenter capex by 20% to $${(cutCapex / 1e9).toFixed(0)}B (from $${(liveCapex / 1e9).toFixed(0)}B) to restore free cash flow`,
      modify: (b) => ({
        ...b,
        capex: b.capex
          ? {
              ...b.capex,
              aggregateCapexUsd: cutCapex,
            }
          : null,
        aiDebt: b.aiDebt
          ? {
              ...b.aiDebt,
              capexToOcfRatio: Math.round((liveCapex > 0 ? (cutCapex / liveCapex) * (b.aiDebt.capexToOcfRatio ?? 0.548) : 0.548) * 1000) / 1000,
            }
          : null,
      }),
    },
    {
      id: "multiple_compression",
      label: `Lab Down-Rounds (${targetPs}× P/S)`,
      tag: "Valuation Reset",
      description: `Frontier lab multiples compress from median ${liveMedianPs.toFixed(1)}× to ${targetPs}× enterprise run-rate revenues`,
      modify: (b) => ({
        ...b,
        valuations: b.valuations
          ? b.valuations.map((v) => ({
              ...v,
              valuationUsd: v.runRateRevenueUsd ? v.runRateRevenueUsd * targetPs : v.valuationUsd * 0.45,
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
              debtShare: Math.max(liveDebtShare, 0.11),
              circularShare: 0.08,
              daysSinceLastMega: 65,
            }
          : null,
        macro: b.macro
          ? {
              ...b.macro,
              highYieldSpreadBps: liveHy + 137,
            }
          : null,
      }),
    },
  ];
}

export function ProbabilityGauge({
  probability: baseProbability,
  compositeScore: baseCompositeScore,
  band: baseBand,
  coverage: baseCoverage,
  topDrivers: _baseTopDrivers,
  confidenceInterval: _unusedConfidenceInterval,
  fragilityIndex: baseFragilityIndex = 74,
  contributions: baseContributions,
  initialInputs = DEFAULT_MODEL_INPUTS,
}: ProbabilityGaugeProps) {
  const [hoveredPointIndex, setHoveredPointIndex] = useState<number | null>(null);
  const [activeScenarioId, setActiveScenarioId] = useState<string>("baseline");
  const [showPlainEnglishGuide, setShowPlainEnglishGuide] = useState<boolean>(false);

  /**
   * 2026-10-19 (design pass): the gauge is a chart, so it earns its entrance.
   * The arc sweeps from empty to its published value the first time the card
   * scrolls into view, the printed number counts up beside it, and the
   * trajectory draws itself in. Nothing loops, and every number printed is
   * the same number the model published.
   */
  const gaugeRef = useRef<HTMLDivElement | null>(null);
  const [swept, setSwept] = useState(false);
  const inView = useInView(gaugeRef);
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    if (!inView || swept) return undefined;
    const frame = window.requestAnimationFrame(() => setSwept(true));
    return () => window.cancelAnimationFrame(frame);
  }, [inView, swept]);

  // Scenario levers are derived from the model inputs this gauge is rendering
  // (19 Oct 2026) — never from a hard-coded snapshot of an earlier world.
  const whatIfScenarios = useMemo(() => buildWhatIfScenarios(initialInputs), [initialInputs]);

  // Evaluate model dynamically when a What-If scenario lever is selected
  const activeScenario = useMemo(
    () => whatIfScenarios.find((s) => s.id === activeScenarioId) || whatIfScenarios[0],
    [activeScenarioId, whatIfScenarios]
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
  const currentFragility = scenarioResult ? scenarioResult.fragilityIndex ?? 74 : baseFragilityIndex;
  const currentContributions = scenarioResult ? scenarioResult.contributions : baseContributions;

  // The printed number counts up to the published value; it always lands on
  // exactly the same digits the model produced. The count is armed on mount
  // and fires with the arc sweep, the first time the card reaches the
  // reader — never before, and never without the arc.
  const displayProb = useCountUp(currentProb, {
    duration: 800,
    startFrom: Math.min(currentProb, 40),
    enabled: !reducedMotion && swept,
  });

  // Delta relative to baseline
  const probDelta = Math.round((currentProb - baseProbability) * 10) / 10;

  const bandConfig: Record<
    BubbleBand,
    {
      label: string;
      /** Tone modifier from the global token set: pill-risk / pill-caution / … */
      pillTone: string;
      desc: string;
    }
  > = {
    critical: {
      label: "Critical Risk (≥80%)",
      pillTone: "pill-risk",
      desc: "Severe debt saturation, widening CDS spreads, and unsustainable circular counterparty funding create extreme liquidation risk.",
    },
    high: {
      label: "High Stress (65–79%)",
      pillTone: "pill-risk",
      desc: "Valuation multiples and debt commitments significantly outpace verified commercial monetization, leaving capital structures vulnerable to credit shocks.",
    },
    elevated: {
      label: "Elevated Risk (45–64%)",
      pillTone: "pill-caution",
      desc: "Credit spreads widening and private valuations high, balanced by ongoing enterprise adoption and organic revenue generation.",
    },
    guarded: {
      label: "Guarded (25–44%)",
      pillTone: "",
      desc: "Moderate multiple expansion adequately covered by real utility, commercial software enterprise adoption, and healthy balance sheets.",
    },
    calm: {
      label: "Low Risk (<25%)",
      pillTone: "pill-safe",
      desc: "Revenues, cash flow, and token unit economics fully justify current capital investments with minimal default exposure.",
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
      // The scenario's own simulated input-sensitivity range (used when a
      // what-if lever is pulled; the baseline uses the published artifact).
      rangeLow: mc.ci95Pct[0],
      rangeHigh: mc.ci95Pct[1],
    };
  }, [activeInputs]);

  /**
   * The published band (model v2.6.0): the Monte-Carlo input-sensitivity
   * range, NOT a confidence interval. The old ±3.9-point fallback band is
   * deleted — it was an invented width that tracked the headline, and it could
   * read narrower than what the market itself prices.
   */
  const PUBLISHED_RANGE_LOW = latestModel.monteCarlo.ci95Pct[0];
  const PUBLISHED_RANGE_HIGH = latestModel.monteCarlo.ci95Pct[1];
  const PUBLISHED_RANGE_90_LOW = latestModel.monteCarlo.ci90Pct[0];
  const PUBLISHED_RANGE_90_HIGH = latestModel.monteCarlo.ci90Pct[1];
  const PUBLISHED_RANGE_TYPE = latestModel.monteCarlo.ciType;

  const isBaselineScenario = activeScenarioId === "baseline";
  const ciLow = isBaselineScenario ? PUBLISHED_RANGE_LOW : quantitativeData.rangeLow;
  const ciHigh = isBaselineScenario ? PUBLISHED_RANGE_HIGH : quantitativeData.rangeHigh;

  // Load 90-day trajectory from trajectory-history.json with fallback
  const usingFallbackTrajectory = !(
    rawTrajectoryHistory &&
    Array.isArray(rawTrajectoryHistory) &&
    rawTrajectoryHistory.length > 0
  );
  // Points the pipeline had to seed rather than observe (flagged "backfilled"
  // in trajectory-history.json) are disclosed under the chart.
  const backfilledPointCount = useMemo(
    () =>
      (Array.isArray(rawTrajectoryHistory) ? (rawTrajectoryHistory as TrajectoryPoint[]) : []).filter(
        (p) => p.backfilled === true
      ).length,
    []
  );

  const trajectoryPoints: TrajectoryPoint[] = useMemo(() => {
    const source: TrajectoryPoint[] = (rawTrajectoryHistory && Array.isArray(rawTrajectoryHistory) && rawTrajectoryHistory.length > 0)
      ? (rawTrajectoryHistory as TrajectoryPoint[])
      : FALLBACK_TRAJECTORY;

    // Clone array
    const points = source.map((pt) => ({ ...pt }));
    const baseFirstProb = points[0]?.probability ?? 38.6;
    const yesterdayProb = points[points.length - 2]?.probability ?? 71.5;

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
        // 2026-10-19 (round-2 consolidation): the unit suffix "%" → "pts". These are
        // probability-POINT changes (the published trajectory file, the home page's
        // "+33.0 pts in 90 days" and the net90DeltaBadge on this same card all use
        // "pts"); rendering them as "%" read as a relative move that is ~2.5× too small.
        deltaVs90d: delta90 >= 0 ? `+${delta90.toFixed(1)} pts` : `${delta90.toFixed(1)} pts`,
        deltaVsYesterday: deltaYest >= 0 ? `+${deltaYest.toFixed(1)} pts` : `${deltaYest.toFixed(1)} pts`,
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
  // 2026-10-19 (round-2 consolidation): "%" → "pts" — a probability-point move, matching the
  // per-point deltas above and the published trajectory file. As a "%" it read as a relative
  // change that is ~2.5× too small.
  const yesterdayDriftBadge = yesterdayDeltaNum >= 0 ? `+${yesterdayDeltaNum.toFixed(1)} pts` : `${yesterdayDeltaNum.toFixed(1)} pts`;
  // 2026-10-19 (orchestrator ruling): while the trajectory's early rows are seeded
  // ("backfilled": true), a "vs yesterday" chip would compare the observed print
  // against a synthetic ~42.7% row and dress a calibration jump up as a daily move.
  // Suppress it while the previous point is a seed — the 90-day badge above and the
  // backfill disclosure already carry the honest history.
  const yesterdayBackfilled = Boolean(yesterdayPoint?.backfilled);

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

  // Position of thumb pointer along the arc. Before the first sweep the thumb
  // waits at the zero end of the dial, so it travels with the arc.
  const theta = (Math.PI * clampedProb) / 100;
  const thumbTheta = swept ? theta : 0;
  const thumbX = cx - radius * Math.cos(thumbTheta);
  const thumbY = cy - radius * Math.sin(thumbTheta);

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
      // No contributions were supplied: evaluate the base inputs so the driver
      // list still carries model-derived points rather than stale placeholders.
      const base = evaluateBubbleModel(initialInputs);
      const byId = (id: string) => base.contributions.find((c) => c.id === id);
      const cdsFactor = byId("cds_stress");
      const valuationFactor = byId("valuation_stretch");
      const damperFactor = byId("adoption_demand");
      const liveCds = initialInputs.cds?.currentBps ?? 288;
      const liveMedianPs = medianPsMultiple(initialInputs);
      const signed = (pts: number | undefined) =>
        pts === undefined ? "" : `${pts >= 0 ? "+" : ""}${pts.toFixed(1)} pts`;
      return [
        {
          label: `Oracle 5Y CDS (${liveCds} bp)`,
          points: signed(cdsFactor?.earnedPoints) || "+0.0 pts",
          type: "risk" as const,
        },
        {
          label: `Lab Valuations (${liveMedianPs.toFixed(1)}× multiple)`,
          points: signed(valuationFactor?.earnedPoints) || "+0.0 pts",
          type: "risk" as const,
        },
        {
          // 19 Oct 2026 pin: the published input-basis deflation multiple is
          // 670× (GPT-4 $30/1M input, Mar 2023 → DeepSeek V4.1 Flash
          // $0.0448/1M, OpenRouter). The live aggregator's intraday rate swings
          // the raw reading, and a drifted multiple is never published.
          label: "Token Price Deflation (670× input-basis)",
          points: signed(damperFactor?.earnedPoints) || "-7.2 pts",
          type: "damper" as const,
        },
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
  }, [currentContributions, initialInputs]);

  // Polymarket Reference Data — the odds come from the live 24h crowd sync
  // (19 Oct 2026: 9.05% on the Dec-2026 contract, 19.5% on the Jun-2027
  // contract, $9,167,627 traded), not from the static contract table.
  const crowdInputs = liveInputsData?.crowd;
  const poly2026Market = POLYMARKET_FEATURED_MARKETS[0];
  const poly2027Market = POLYMARKET_FEATURED_MARKETS[1];
  const polyOdds2026 = (crowdInputs?.bubble2026Probability ?? 0.0905) * 100;
  const polyOdds2027 = (crowdInputs?.bubble2027Probability ?? 0.195) * 100;
  const polyVolumeTotal = crowdInputs?.volumeUsd ?? 9_167_627;

  // Divergence calculation between our institutional model and Polymarket crowd
  const divergenceDelta = Math.round((currentProb - polyOdds2026) * 10) / 10;
  const divergenceMultiplier = (currentProb / polyOdds2026).toFixed(1);

  // Flat, ink-first palette for the arc. Token values: the safe / caution /
  // risk scales from tailwind.config.ts, and the ink ramp for the guarded
  // band (read from the CSS variable so it follows the theme).
  const ARC_HEX: Record<BubbleBand, string> = {
    calm: "#0E9F6E", // safe-500
    guarded: "rgb(var(--c-ink-subtle))", // --c-ink-subtle
    elevated: "#B57F0A", // caution-500
    high: "#D1433C", // risk-500
    critical: "#B7352F", // risk-600
  };
  const arcColor = ARC_HEX[currentBand] ?? ARC_HEX.guarded;

  const fragilityBand =
    currentFragility > 65 ? "Fragile" : currentFragility >= 35 ? "Moderate" : "Resilient";

  const divergesUp = divergenceDelta > 0;
  const pricedCount = (currentContributions ?? []).filter((c) => c.reading.coverage > 0).length;
  const factorCount = (currentContributions ?? []).length;

  return (
    <div ref={gaugeRef} className="card card-flush rounded-lg shadow-card transition-shadow duration-200 hover:shadow-raised">
      {/* ── Provenance strip ───────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-rule px-4 py-2.5 sm:px-6">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className={`pill ${current.pillTone}`}>
            <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" aria-hidden="true" />
            {current.label}
          </span>
          <span className="chip">12-month horizon</span>
          <span className="chip">Live model</span>
          {!yesterdayBackfilled && (
            <span className="chip">
              <Activity className="h-3 w-3" aria-hidden="true" />
              {yesterdayDriftBadge} vs yesterday
            </span>
          )}
          <span className="chip">coverage {Math.round(baseCoverage * 100)}%</span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {probDelta !== 0 && (
            <span className={`chip ${probDelta > 0 ? "chip-risk" : "chip-safe"}`}>
              {probDelta > 0 ? (
                <TrendingUp className="h-3 w-3" aria-hidden="true" />
              ) : (
                <TrendingDown className="h-3 w-3" aria-hidden="true" />
              )}
              {probDelta > 0 ? `+${probDelta}` : probDelta} vs baseline
            </span>
          )}
          <span className="chip" title={PUBLISHED_RANGE_TYPE}>
            <ShieldCheck className="h-3 w-3" aria-hidden="true" />
            95% input-sensitivity range
            <span className="num font-semibold text-ink">
              {ciLow.toFixed(1)}–{ciHigh.toFixed(1)}%
            </span>
          </span>
          <span className="chip" title={PUBLISHED_RANGE_TYPE}>
            90% shock range
            <span className="num font-semibold text-ink">
              {PUBLISHED_RANGE_90_LOW.toFixed(1)}–{PUBLISHED_RANGE_90_HIGH.toFixed(1)}%
            </span>
          </span>
        </div>
      </div>

      {/* ── Scenario levers ────────────────────────────────────────────────── */}
      <div className="px-4 pt-4 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="label inline-flex items-center gap-1.5">
            <Sliders className="h-3.5 w-3.5" aria-hidden="true" />
            Scenario
          </span>
          {activeScenarioId !== "baseline" && (
            <button
              type="button"
              onClick={() => setActiveScenarioId("baseline")}
              className="btn btn-ghost min-h-11 text-ink-muted"
            >
              <RotateCcw className="h-3 w-3" aria-hidden="true" />
              Reset to baseline
            </button>
          )}
        </div>

        <div className="mt-1.5 grid grid-cols-2 gap-1.5 sm:grid-cols-3 lg:grid-cols-6">
          {whatIfScenarios.map((scen) => {
            const isActive = activeScenarioId === scen.id;
            return (
              <button
                key={scen.id}
                type="button"
                aria-pressed={isActive}
                onClick={() => setActiveScenarioId(scen.id)}
                className={`min-h-11 rounded-sm px-2.5 py-2 text-left text-[13px] leading-tight transition-colors ${
                  isActive
                    ? "bg-ink text-canvas"
                    : "border border-rule bg-surface text-ink-muted hover:border-rule-strong hover:text-ink"
                }`}
              >
                <span className={`block font-mono uppercase tracking-[0.12em] ${isActive ? "opacity-70" : "text-ink-faint"}`}>
                  {scen.tag}
                </span>
                <span className="mt-0.5 block font-semibold">{scen.label}</span>
              </button>
            );
          })}
        </div>

        <p className="mt-2 text-[14px] text-ink-subtle">
          <span className="font-semibold text-ink-muted">Active: </span>
          {activeScenario.description}
        </p>
      </div>

      {/* ── Gauge, trajectory, drivers ─────────────────────────────────────── */}
      <div className="mt-4 grid grid-cols-1 gap-3 px-4 pb-4 sm:px-6 lg:grid-cols-12">
        <div className="flex flex-col items-center gap-5 rounded-md border border-rule p-4 sm:flex-row sm:items-center lg:col-span-7">
          {/* Arc gauge */}
          <div className="shrink-0">
            <svg
              className="w-[252px] max-w-full sm:w-[318px]"
              viewBox="0 0 320 178"
              role="img"
              aria-label={`Burst probability ${currentProb.toFixed(1)} percent. Input-sensitivity range ${ciLow.toFixed(1)} to ${ciHigh.toFixed(1)} percent — not a confidence interval.`}
            >
              <path
                d="M 48 140 A 112 112 0 0 1 272 140"
                fill="none"
                stroke="currentColor"
                strokeWidth="14"
                strokeLinecap="round"
                className="text-surface-3"
              />
              <path
                d={ciArcPath}
                fill="none"
                stroke="currentColor"
                strokeWidth="14"
                strokeLinecap="butt"
                className="text-rule-strong"
              />
              <path
                d="M 48 140 A 112 112 0 0 1 272 140"
                fill="none"
                strokeWidth="14"
                strokeLinecap="round"
                strokeDasharray={arcLength}
                strokeDashoffset={swept ? activeOffset : arcLength}
                style={{
                  stroke: arcColor,
                  transition: "stroke-dashoffset 0.7s ease-in-out",
                }}
              />
              {[0, 25, 45, 65, 80, 100].map((pct) => {
                const tickTheta = (Math.PI * pct) / 100;
                const innerR = 124;
                const outerR = 131;
                return (
                  <line
                    key={pct}
                    x1={cx - innerR * Math.cos(tickTheta)}
                    y1={cy - innerR * Math.sin(tickTheta)}
                    x2={cx - outerR * Math.cos(tickTheta)}
                    y2={cy - outerR * Math.sin(tickTheta)}
                    stroke="currentColor"
                    strokeWidth="1"
                    className="text-rule-strong"
                  />
                );
              })}
              <circle
                cx={thumbX}
                cy={thumbY}
                r="7"
                strokeWidth="3"
                style={{
                  fill: "rgb(var(--c-canvas))",
                  stroke: arcColor,
                  transition: "cx 0.7s ease-in-out, cy 0.7s ease-in-out",
                }}
              />
              <text
                x={cx}
                y={cy - 14}
                textAnchor="middle"
                className={`num fill-ink text-[44px] font-bold fade-in${swept ? " fade-in-done" : ""}`}
              >
                {displayProb.toFixed(1)}%
              </text>
              <text
                x={cx}
                y={cy + 10}
                textAnchor="middle"
                className="fill-ink-faint font-sans text-[13px] uppercase tracking-[0.18em]"
              >
                12-month burst odds
              </text>
            </svg>
          </div>

          {/* Why it sits there */}
          <div className="min-w-0 flex-1">
            <span className="label">Composite stress score</span>
            <p className="num mt-0.5 text-2xl font-bold text-ink">
              {currentComposite.toFixed(1)}
              <span className="text-sm font-normal text-ink-faint"> / 100</span>
            </p>
            <p
              className={`mt-1 inline-flex items-center gap-1 text-[14px] font-medium ${
                net90DeltaNum >= 0 ? "text-risk-600 dark:text-risk-300" : "text-safe-600 dark:text-safe-300"
              }`}
            >
              {net90DeltaNum >= 0 ? (
                <TrendingUp className="h-3.5 w-3.5" aria-hidden="true" />
              ) : (
                <TrendingDown className="h-3.5 w-3.5" aria-hidden="true" />
              )}
              {net90DeltaBadge} since {firstPoint?.date ?? "first observed"}
            </p>
            <p className="mt-2.5 text-sm leading-relaxed text-ink-muted">{current.desc}</p>
            <dl className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[14px] text-ink-faint">
              <div className="flex gap-1.5">
                <dt>band</dt>
                <dd className="num font-semibold uppercase text-ink-muted">{currentBand}</dd>
              </div>
              <div className="flex gap-1.5">
                <dt>fragility</dt>
                <dd className="num font-semibold text-ink-muted">
                  {currentFragility}/100 · {fragilityBand.toLowerCase()}
                </dd>
              </div>
              <div className="flex gap-1.5">
                <dt>priced</dt>
                <dd className="num font-semibold text-ink-muted">
                  {pricedCount}/{factorCount} factors
                </dd>
              </div>
            </dl>
          </div>
        </div>

        {/* 90-day trajectory + active drivers */}
        <div className="panel rounded-md lg:col-span-5">
          <div className="flex items-baseline justify-between gap-2">
            <span className="label">observed trajectory</span>
            <span className="num text-sm font-semibold text-ink">{net90DeltaBadge}</span>
          </div>

          <div className={`mt-2 rounded-sm border border-rule bg-canvas p-2.5${inView ? " reveal-in" : ""}`}>
            <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-0.5 border-b border-rule pb-1.5 text-[14px] text-ink-faint">
              <span className="inline-flex items-center gap-1.5">
                <Clock className="h-3 w-3" aria-hidden="true" />
                <span className="num font-semibold text-ink">{activePoint.date}</span>
                <span>({activePoint.dayLabel})</span>
              </span>
              <span className="num flex items-center gap-2">
                <span>score {activePoint.compositeScore.toFixed(1)}</span>
                <span className="font-semibold text-ink">{activePoint.probability.toFixed(1)}%</span>
                <span>{activePoint.deltaVs90d}</span>
              </span>
            </div>

            <svg
              className="h-[84px] w-full cursor-crosshair overflow-visible"
              viewBox={`0 0 ${sparkWidth} ${sparkHeight}`}
              preserveAspectRatio="none"
              onMouseMove={handleSvgMouseMove}
              onMouseLeave={() => setHoveredPointIndex(null)}
              role="img"
              aria-label="Bubble probability over the last 90 days"
            >
              <path
                d={sparklinePath}
                fill="none"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
                className="draw-in"
                style={{ stroke: arcColor }}
              />
              {hoveredPointIndex !== null && activeSparkPoint && (
                <line
                  x1={activeSparkPoint.x}
                  y1={paddingTop}
                  x2={activeSparkPoint.x}
                  y2={sparkHeight - paddingBottom}
                  strokeWidth="1"
                  strokeDasharray="2 2"
                  vectorEffect="non-scaling-stroke"
                  style={{ stroke: arcColor }}
                />
              )}
              {[0, 30, 60, trajectoryPoints.length - 2, trajectoryPoints.length - 1].map((idx, slot) => {
                const pt = sparkPoints[idx];
                if (!pt) return null;
                const isLast = idx === trajectoryPoints.length - 1;
                const isActive = hoveredPointIndex === idx;
                return (
                  <circle
                    /* The slot is part of the key: with a short history the
                       same index can appear twice (first == yesterday), and
                       React needs a unique key per rendered node. */
                    key={`${pt.date}-${idx}-${slot}`}
                    cx={pt.x}
                    cy={pt.y}
                    r={isActive ? 4 : isLast ? 3 : 2}
                    style={{
                      fill: isActive || isLast ? arcColor : "rgb(var(--c-ink-faint))",
                    }}
                    className="pointer-events-none"
                  />
                );
              })}
            </svg>

            <div className="mt-1 flex justify-between border-t border-rule pt-1 text-[14px] text-ink-faint">
              {(() => {
                // 2026-10-19 (wave-1): history is observed canonical runs only
                // (seeded interpolation retired) — indexes 30/60 no longer exist
                // in a 2-row history. Milestones derive from the actual points
                // and duplicate indexes are dropped (First == Yesterday early on).
                const n = trajectoryPoints.length;
                const milestones = [
                  { label: "First", idx: 0 },
                  ...(n >= 5 ? [{ label: "Mid", idx: Math.floor((n - 1) / 2) }] : []),
                  ...(n >= 2 ? [{ label: "Yesterday", idx: n - 2 }] : []),
                  { label: "Current", idx: n - 1 },
                ];
                const seen = new Set<number>();
                return milestones.filter((m) =>
                  seen.has(m.idx) ? false : (seen.add(m.idx), true)
                );
              })().map((milestone) => (
                <button
                  key={milestone.label}
                  type="button"
                  onClick={() => setHoveredPointIndex(milestone.idx)}
                  onMouseEnter={() => setHoveredPointIndex(milestone.idx)}
                  onMouseLeave={() => setHoveredPointIndex(null)}
                  className={`num min-h-8 px-1 ${
                    hoveredPointIndex === milestone.idx
                      ? "font-semibold text-ink"
                      : "hover:text-ink"
                  }`}
                >
                  {milestone.label}
                </button>
              ))}
            </div>

            {/* Provenance of the line above — never let a seeded path read as
                recorded history. */}
            <p className="mt-1.5 border-t border-rule pt-1.5 text-[13px] leading-relaxed text-ink-subtle">
              {usingFallbackTrajectory
                ? "Fallback trajectory: a seeded model path (38.6% → 71.6%) shown because the recorded history file is unavailable — not recorded market history."
                : backfilledPointCount > 0
                ? `First ${backfilledPointCount} points backfilled from seed, live points thereafter.`
                : "Source: the 24h pipeline trajectory history (trajectory-history.json)."}
            </p>
          </div>

          <div className="mt-3 border-t border-rule pt-2.5">
            <span className="label">Active drivers</span>
            <ul className="mt-1.5 space-y-1.5">
              {dynamicDrivers.map((driver) => (
                <li key={driver.label} className="flex items-center justify-between gap-2">
                  <span className="flex min-w-0 items-center gap-2 text-[14px] text-ink-muted">
                    <span
                      className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                        driver.type === "damper" ? "bg-safe-500" : "bg-risk-500"
                      }`}
                      aria-hidden="true"
                    />
                    <span className="truncate">{driver.label}</span>
                  </span>
                  <span className={`num shrink-0 text-[14px] font-semibold ${driver.type === "damper" ? "text-safe-600" : "text-risk-600"}`}>
                    {driver.points}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* ── Fragility meter + cross-validation ─────────────────────────────── */}
      <div className="grid grid-cols-1 gap-3 px-4 pb-4 sm:px-6 lg:grid-cols-12">
        <div className="rounded-md border border-rule p-3.5 lg:col-span-5">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <span className="label">Financial fragility index</span>
            <span className="num text-sm font-semibold text-ink">
              {currentFragility}/100
              <span className="ml-2 text-[13px] font-normal uppercase tracking-[0.12em] text-ink-faint">
                {fragilityBand}
              </span>
            </span>
          </div>
          <div className="mt-2 h-1.5 w-full bg-surface-3">
            <div
              className={`bar-grow h-1.5 bg-risk-500${inView ? " bar-grow-in" : ""}`}
              style={{
                width: `${Math.min(100, Math.max(0, currentFragility))}%`,
                transition: "transform 600ms cubic-bezier(0.2, 0, 0, 1), width 500ms ease",
              }}
            />
          </div>
          <div className="mt-1 flex justify-between text-[14px] text-ink-faint">
            <span>Resilient &lt;35</span>
            <span>Moderate 35–65</span>
            <span>Fragile &gt;65</span>
          </div>
        </div>

        <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-md border border-rule bg-rule sm:grid-cols-3 lg:col-span-7 lg:grid-cols-5">
          <div
            title={`Merton (1974) distance-to-default: ${quantitativeData.mertonDD.toFixed(2)} standard deviations. Default probability ${quantitativeData.mertonProb.toFixed(1)}%. ${quantitativeData.mertonInterpretation}`}
            className="bg-surface p-2.5"
          >
            <dt className="text-[13px] uppercase tracking-[0.12em] text-ink-faint">Big Tech solvency</dt>
            <dd className="num mt-0.5 text-sm font-semibold text-ink">{quantitativeData.mertonDD.toFixed(2)}σ</dd>
          </div>
          <div
            title={`Altman Z''-score ${quantitativeData.altmanScore.toFixed(2)} (${quantitativeData.altmanZone}). Above 2.6 is the safe zone.`}
            className="bg-surface p-2.5"
          >
            <dt className="text-[13px] uppercase tracking-[0.12em] text-ink-faint">Balance sheet</dt>
            <dd className="num mt-0.5 text-sm font-semibold text-ink">{quantitativeData.altmanScore.toFixed(2)}</dd>
          </div>
          <div
            title={`Minsky fragility index ${quantitativeData.minskyIndex.toFixed(1)} (${quantitativeData.minskyRegime}). Ponzi-funded share ${quantitativeData.minskyPonziShare.toFixed(1)}%.`}
            className="bg-surface p-2.5"
          >
            <dt className="text-[13px] uppercase tracking-[0.12em] text-ink-faint">How AI is funded</dt>
            <dd className="num mt-0.5 text-sm font-semibold text-ink">{quantitativeData.minskyIndex.toFixed(1)}</dd>
          </div>
          <div
            title={`Shiller excess CAPE yield ${quantitativeData.shillerECY.toFixed(2)}% (${quantitativeData.shillerStatus}). Earnings yield minus the real 10-year Treasury yield.`}
            className="bg-surface p-2.5"
          >
            <dt className="text-[13px] uppercase tracking-[0.12em] text-ink-faint">Stocks vs bonds</dt>
            <dd className="num mt-0.5 text-sm font-semibold text-ink">
              {quantitativeData.shillerECY >= 0 ? "+" : ""}
              {quantitativeData.shillerECY.toFixed(2)}%
            </dd>
          </div>
          <div
            title="Monte Carlo stress test. In 95% of simulated futures, the score stays under this level."
            className="col-span-2 bg-surface p-2.5 sm:col-span-2 lg:col-span-1"
          >
            <dt className="text-[13px] uppercase tracking-[0.12em] text-ink-faint">Worst 5% of futures</dt>
            <dd className="num mt-0.5 text-sm font-semibold text-ink">{quantitativeData.var95.toFixed(1)}%</dd>
          </div>
        </dl>
      </div>

      {/* ── Plain-English disclosure ────────────────────────────────────────── */}
      <div className="px-4 pb-4 sm:px-6">
        <button
          type="button"
          onClick={() => setShowPlainEnglishGuide(!showPlainEnglishGuide)}
          aria-expanded={showPlainEnglishGuide}
          className="flex min-h-11 w-full items-center justify-between gap-3 rounded-sm border border-rule px-3 py-2 text-left hover:border-rule-strong"
        >
          <span className="min-w-0">
            <span className="block text-sm font-semibold text-ink">In plain English</span>
            <span className="block text-[14px] text-ink-muted">
              What {currentProb.toFixed(1)}% actually means, in four lines
            </span>
          </span>
          <span className="shrink-0 text-ink-faint">
            {showPlainEnglishGuide ? (
              <ChevronUp className="h-4 w-4" aria-hidden="true" />
            ) : (
              <ChevronDown className="h-4 w-4" aria-hidden="true" />
            )}
          </span>
        </button>

        {showPlainEnglishGuide && (
          <div className="notice mt-2">
            <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
              <div>
                <p className="font-semibold text-ink">What does {currentProb.toFixed(1)}% mean?</p>
                <p className="mt-1 leading-relaxed text-ink-muted">
                  A chance, not a date. It asks whether AI financing breaks within a year. Roughly half
                  of the tracked evidence currently points that way.
                </p>
              </div>
              <div>
                <p className="font-semibold text-ink">Can the big names go bankrupt?</p>
                <p className="mt-1 leading-relaxed text-ink-muted">
                  Unlikely. They fund spending from cash flow. Merton distance to default sits at{" "}
                  {quantitativeData.mertonDD.toFixed(1)} standard deviations, Altman at{" "}
                  {quantitativeData.altmanScore.toFixed(1)}.
                </p>
              </div>
              <div>
                <p className="font-semibold text-ink">Where is the real risk?</p>
                <p className="mt-1 leading-relaxed text-ink-muted">
                  With the borrowers, not the buyers. Much of the data-center build-out is on loans
                  that must be repaid whether or not customers keep paying.
                </p>
              </div>
              <div>
                <p className="font-semibold text-ink">Why is this above the crowd?</p>
                <p className="mt-1 leading-relaxed text-ink-muted">
                  A betting contract settles on a dated, headline crash. This model tracks the
                  financing itself: spreads, rates, debt and pipeline.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Crowd comparison ────────────────────────────────────────────────── */}
      <div className="border-t border-rule px-4 py-4 sm:px-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="text-base font-semibold tracking-[-0.02em] text-ink">Crowd odds, for contrast</h3>
          <a
            href={`https://polymarket.com/event/ai-bubble-burst-by?r=${POLYMARKET_REFERRAL_CODE}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 items-center gap-1 text-[13px] text-ink-muted underline underline-offset-2 hover:text-ink"
          >
            Polymarket event
          </a>
        </div>

        <div className="mt-2 grid grid-cols-1 gap-px overflow-hidden rounded-md border border-rule bg-rule sm:grid-cols-3">
          <div className="bg-surface p-3.5">
            <p className="text-[13px] uppercase tracking-[0.12em] text-ink-faint">This model</p>
            <p className="num mt-1 text-2xl font-bold text-ink">{currentProb.toFixed(1)}%</p>
            <p className="num mt-1 text-[14px] text-ink-faint">
              Range {ciLow.toFixed(1)}–{ciHigh.toFixed(1)}% · fragility {currentFragility}
            </p>
          </div>
          <div className="bg-surface p-3.5">
            <p className="text-[13px] uppercase tracking-[0.12em] text-ink-faint">Crowd contract, 2026</p>
            <p className="num mt-1 text-2xl font-bold text-ink">{polyOdds2026.toFixed(1)}%</p>
            <p className="num mt-1 text-[14px] text-ink-faint">
              ${(polyVolumeTotal / 1e6).toFixed(2)}M traded · {polyOdds2027.toFixed(1)}% on the 2027 contract
            </p>
          </div>
          <div className="bg-surface p-3.5">
            <p className="text-[13px] uppercase tracking-[0.12em] text-ink-faint">Gap</p>
            <p
              className={`num mt-1 text-2xl font-bold ${
                divergesUp ? "text-caution-600 dark:text-caution-300" : "text-safe-600 dark:text-safe-300"
              }`}
            >
              {divergenceDelta > 0 ? "+" : ""}
              {divergenceDelta.toFixed(1)} pts
            </p>
            <p className="num mt-1 text-[14px] text-ink-faint">{divergenceMultiplier}× the crowd reading</p>
          </div>
        </div>

        <div className="mt-3 space-y-2.5">
          <div>
            <div className="flex justify-between text-[14px] text-ink-muted">
              <span>This model, 12-month burst odds</span>
              <span className="num font-semibold text-ink">{currentProb.toFixed(1)}%</span>
            </div>
            <div className="mt-1 h-1.5 w-full bg-surface-3">
              <div
                className={`bar-grow h-1.5 bg-risk-500${inView ? " bar-grow-in" : ""}`}
                style={{
                  width: `${Math.min(100, Math.max(0, currentProb))}%`,
                  transition: "transform 600ms cubic-bezier(0.2, 0, 0, 1), width 500ms ease",
                  transitionDelay: "80ms",
                }}
              />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-[14px] text-ink-muted">
              <span>Crowd contract, same question</span>
              <span className="num font-semibold text-ink">{polyOdds2026.toFixed(1)}%</span>
            </div>
            <div className="mt-1 h-1.5 w-full bg-surface-3">
              <div
                className={`bar-grow h-1.5 bg-ink-subtle${inView ? " bar-grow-in" : ""}`}
                style={{
                  width: `${Math.min(100, Math.max(0, polyOdds2026))}%`,
                  transition: "transform 600ms cubic-bezier(0.2, 0, 0, 1), width 500ms ease",
                  transitionDelay: "160ms",
                }}
              />
            </div>
          </div>
        </div>

        <p className="mt-3 max-w-3xl text-[14px] leading-relaxed text-ink-subtle">
          The two measure different things. A betting contract needs a dated, visible trigger. This
          model reads the financing year round, so it can sit above the crowd for months without
          either being wrong. Referral links below ({POLYMARKET_REFERRAL_CODE}) go to Polymarket; the
          site earns a fee on trades opened there.
        </p>

        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
          <div className="rounded-md border border-rule p-3">
            <p className="num text-[14px] text-ink-faint">Dec 31, 2026 expiry</p>
            <p className="mt-0.5 text-sm font-semibold text-ink">
              {poly2026Market?.title ?? "AI Bubble Burst in 2026?"}
            </p>
            <p className="mt-1 text-[14px] text-ink-muted">
              Resolves YES on a defined equity or lab-restructuring trigger.
            </p>
            <div className="mt-2 flex gap-2">
              <a
                href={poly2026Market.tradeYesUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn min-h-11 flex-1 text-[13px]"
              >
                YES {polyOdds2026.toFixed(1)}¢
              </a>
              <a
                href={poly2026Market.tradeNoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn min-h-11 flex-1 text-[13px]"
              >
                NO {(100 - polyOdds2026).toFixed(1)}¢
              </a>
            </div>
          </div>
          <div className="rounded-md border border-rule p-3">
            <p className="num text-[14px] text-ink-faint">June 30, 2027 expiry</p>
            <p className="mt-0.5 text-sm font-semibold text-ink">
              {poly2027Market?.title ?? "AI Bubble Burst by June 30, 2027?"}
            </p>
            <p className="mt-1 text-[14px] text-ink-muted">
              A wider window, currently priced at {polyOdds2027.toFixed(1)}% YES.
            </p>
            <a
              href={`https://polymarket.com/event/ai-bubble-burst-by?r=${POLYMARKET_REFERRAL_CODE}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn mt-2 min-h-11 w-full text-[13px]"
            >
              Open both contracts
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
