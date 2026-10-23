"use client";

import React, { useState, useMemo, useCallback, useEffect } from "react";
import Link from "next/link";
import { SensitivitySandbox } from "@/components/SensitivitySandbox";
import { SensitivityCurveChart } from "@/components/VisualCharts";
import { Reveal } from "@/components/Reveal";
import { AdSlot } from "@/components/AdSlot";
import { evaluateBubbleModel, DEFAULT_MODEL_INPUTS } from "@/lib/model/engine";
import type { BubbleModelInputs, BubbleModelResult } from "@/lib/model/types";
import liveInputsData from "@/data/live-inputs.json";
import syncHistoryData from "@/data/sync-history.json";
import latestModel from "@/data/latest-model.json";
import {
  runMonteCarloSimulation,
  computeMertonModel,
  computeAltmanZScore,
  computeLpplsMetrics,
  computeMinskyModel,
  computeShillerCapeModel,
} from "@/lib/model/engine";
import {
  Sliders,
  ArrowLeft,
  ChevronRight,
  BarChart3,
  AlertTriangle,
  ShieldAlert,
  Cpu,
  Sparkles,
  CheckCircle2,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Activity,
  Layers,
  Scale,
  Clock,
  Database,
  GitBranch,
  RotateCcw,
  ShieldCheck,
  Zap,
} from "lucide-react";

/**
 * LIVE Excess CAPE Yield — the model's own reading, never a typed number.
 *
 * Source: src/lib/model/quantitative.ts → computeShillerCapeModel() (re-exported
 * from @/lib/model/engine) evaluated on DEFAULT_MODEL_INPUTS, which resolves to
 * src/data/live-inputs.json. The live reading is +0.30% (AI CAPE 32.4×, earnings
 * yield 3.09% less the 2.79% real 10-year Treasury yield).
 */
const LIVE_EXCESS_CAPE_YIELD_PCT = computeShillerCapeModel(
  DEFAULT_MODEL_INPUTS
).excessCapeYieldPct;

/**
 * Live baseline readings, all read from the SAME live input set the model
 * consumes — src/data/live-inputs.json, surfaced through DEFAULT_MODEL_INPUTS
 * (src/lib/model/engine.ts). Nothing below is typed, so the snapshot panel can
 * never disagree with the published model.
 */
const LIVE_CDS_BPS = DEFAULT_MODEL_INPUTS.cds?.currentBps ?? 0;
const LIVE_CDS_BASELINE_BPS = DEFAULT_MODEL_INPUTS.cds?.baselineBps ?? 0;
const LIVE_DEBT_SHARE_PCT = (DEFAULT_MODEL_INPUTS.ledger?.debtShare ?? 0) * 100;
const LIVE_TRACKED_DEBT_B = (DEFAULT_MODEL_INPUTS.aiDebt?.totalTrackedDebtUsd ?? 0) / 1e9;
const LIVE_LEDGER_TOTAL_T = (DEFAULT_MODEL_INPUTS.ledger?.totalDisclosedUsd ?? 0) / 1e12;
const LIVE_TOKEN_DEFLATION = DEFAULT_MODEL_INPUTS.adoption?.apiPriceDeclineMultiple ?? 0;
const LIVE_CROWD_2026_PCT =
  (DEFAULT_MODEL_INPUTS.crowd?.bubble2026Probability ??
    DEFAULT_MODEL_INPUTS.crowd?.yesProbability ??
    0) * 100;
const LIVE_CROWD_2027_PCT = (DEFAULT_MODEL_INPUTS.crowd?.bubble2027Probability ?? 0) * 100;
const LIVE_CROWD_VOLUME_M = (DEFAULT_MODEL_INPUTS.crowd?.volumeUsd ?? 0) / 1e6;

export default function SandboxPage() {
  const [sampleSeed, setSampleSeed] = useState(42);
  const [isSampling, setIsSampling] = useState(false);
  const [resetTrigger, setResetTrigger] = useState(0);

  // Wall-clock numbers are measured with performance.now(), which the server
  // cannot know. Rendering them only after mount keeps hydration clean.
  const [isRuntimeKnown, setIsRuntimeKnown] = useState(false);
  useEffect(() => setIsRuntimeKnown(true), []);

  // Minsky Instability Regime interactive levers.
  // Defaults are the published 24h snapshot (src/data/latest-model.json,
  // 20 Oct 2026 sync): Ponzi 12.9% / Speculative 32.0% → Hedge 55.1%, fragility
  // 65.7, refinancing-freeze probability 19.6%.
  const [ponziDebtShare, setPonziDebtShare] = useState<number>(latestModel.minsky.ponziSharePct);
  const [speculativeDebtShare, setSpeculativeDebtShare] = useState<number>(latestModel.minsky.speculativeSharePct);
  const [hedgeCashFlowCushion, setHedgeCashFlowCushion] = useState<number>(1.42);

  // Shiller Excess CAPE Yield interactive lever.
  // Default is the LIVE model's own excess CAPE yield (0.30% on the live
  // inputs) — computed above from computeShillerCapeModel(DEFAULT_MODEL_INPUTS),
  // not typed. The reset buttons restore the same live value.
  const [shillerECY, setShillerECY] = useState<number>(LIVE_EXCESS_CAPE_YIELD_PCT);

  // Baseline calibration from today's automated 24h cron execution
  const baselineModel = useMemo(() => evaluateBubbleModel(DEFAULT_MODEL_INPUTS), []);
  const baselineMonteCarlo = useMemo(() => runMonteCarloSimulation(DEFAULT_MODEL_INPUTS, 25_000, 42_1337), []);

  // Active state received dynamically from sandbox sliders
  const [activeInputs, setActiveInputs] = useState<BubbleModelInputs>(DEFAULT_MODEL_INPUTS);
  const [activeResult, setActiveResult] = useState<BubbleModelResult>(baselineModel);
  const [activeScenario, setActiveScenario] = useState<string>("baseline");

  // Compute classical financial models from literature using active inputs
  const merton = useMemo(() => computeMertonModel(activeInputs), [activeInputs]);
  const altman = useMemo(() => computeAltmanZScore(activeInputs), [activeInputs]);
  const lppls = useMemo(() => computeLpplsMetrics(activeInputs), [activeInputs]);

  // Compute Minsky model with live interactive levers
  const minsky = useMemo(() => {
    return computeMinskyModel(activeInputs, {
      ponziSharePct: ponziDebtShare,
      speculativeSharePct: speculativeDebtShare,
      hedgeCushion: hedgeCashFlowCushion,
    });
  }, [activeInputs, ponziDebtShare, speculativeDebtShare, hedgeCashFlowCushion]);

  // Compute Shiller Excess CAPE Yield model with interactive slider
  const shiller = useMemo(() => {
    return computeShillerCapeModel(activeInputs, shillerECY);
  }, [activeInputs, shillerECY]);

  // Compute 25,000-Path Monte Carlo Sampling with Cholesky Copula (re-evaluates on resample seed OR inputs change)
  const monteCarlo = useMemo(() => {
    return runMonteCarloSimulation(activeInputs, 25_000, 42_1337 + (sampleSeed - 42) * 104729);
  }, [activeInputs, sampleSeed]);

  const handleStateChange = useCallback(
    (data: {
      inputs: BubbleModelInputs;
      result: BubbleModelResult;
      baselineResult: BubbleModelResult;
      scenarioName: string;
      delta: number;
    }) => {
      setActiveInputs(data.inputs);
      setActiveResult(data.result);
      setActiveScenario(data.scenarioName);
    },
    []
  );

  const handleResetToBaseline = () => {
    setResetTrigger((prev) => prev + 1);
    setSampleSeed(42);
    setActiveInputs(DEFAULT_MODEL_INPUTS);
    setActiveResult(baselineModel);
    setActiveScenario("baseline");
    setPonziDebtShare(latestModel.minsky.ponziSharePct);
    setSpeculativeDebtShare(latestModel.minsky.speculativeSharePct);
    setHedgeCashFlowCushion(1.42);
    setShillerECY(LIVE_EXCESS_CAPE_YIELD_PCT);
  };

  const handleResample = () => {
    setIsSampling(true);
    setTimeout(() => {
      setSampleSeed((prev) => prev + 1);
      setIsSampling(false);
    }, 200);
  };

  // Dynamic Deltas against Today's Automated 24h Baseline
  const deltaBurstProb = Math.round((activeResult.burstProbability - baselineModel.burstProbability) * 10) / 10;
  const deltaScore = Math.round((activeResult.compositeScore - baselineModel.compositeScore) * 10) / 10;
  const deltaFragility = (activeResult.fragilityIndex ?? 0) - (baselineModel.fragilityIndex ?? 0);
  // Live anchors: the Oracle 5Y CDS print, the ledger debt share, the US10Y
  // yield and the Polymarket crowd odds are all read from the live input set
  // (src/data/live-inputs.json) through DEFAULT_MODEL_INPUTS — never typed.
  const deltaCds = (activeInputs.cds?.currentBps ?? 0) - (DEFAULT_MODEL_INPUTS.cds?.currentBps ?? 0);
  const deltaDebtShare = Math.round(((activeInputs.ledger?.debtShare ?? 0) - (DEFAULT_MODEL_INPUTS.ledger?.debtShare ?? 0)) * 100);
  const deltaUs10y = Math.round(((activeInputs.macro?.us10yYieldPct ?? 0) - (DEFAULT_MODEL_INPUTS.macro?.us10yYieldPct ?? 0)) * 100) / 100;

  // Monte Carlo Deltas against 24h Baseline
  const deltaMCMedian = Math.round((monteCarlo.medianProbabilityPct - baselineMonteCarlo.medianProbabilityPct) * 10) / 10;
  const deltaMCVaR = Math.round((monteCarlo.valueAtRisk95Pct - baselineMonteCarlo.valueAtRisk95Pct) * 10) / 10;
  const deltaMCVaR99 = Math.round((monteCarlo.valueAtRisk99Pct - baselineMonteCarlo.valueAtRisk99Pct) * 10) / 10;
  const deltaMCCVaR = Math.round((monteCarlo.conditionalValueAtRisk95Pct - baselineMonteCarlo.conditionalValueAtRisk95Pct) * 10) / 10;
  const isResampled = sampleSeed !== 42;
  const isMinskyModified =
    ponziDebtShare !== latestModel.minsky.ponziSharePct ||
    speculativeDebtShare !== latestModel.minsky.speculativeSharePct ||
    hedgeCashFlowCushion !== 1.42;
  const isShillerModified = shillerECY !== LIVE_EXCESS_CAPE_YIELD_PCT;
  const isSlidersModified = deltaBurstProb !== 0 || deltaCds !== 0 || deltaDebtShare !== 0 || deltaUs10y !== 0 || isMinskyModified || isShillerModified;
  // Refinancing-freeze trigger. The CDS leg was 260bp — a level calibrated
  // against the old 187bp reading. The verified 288bp record close (Oct 15 2026)
  // sits ABOVE 260bp, so the old trigger fired on every baseline while the model
  // itself reported a 19.6% freeze probability and a "Speculative Transition"
  // regime. Raised to 400bp on 19 Oct 2026 — a genuine blowout on top of the
  // live print, and the same level as the credit-freeze preset below.
  const REFINANCING_FREEZE_CDS_TRIGGER_BPS = 400;
  const isRefinancingFreeze =
    minsky.refinancingFreezeProbabilityPct >= 20 ||
    minsky.currentRegime === "Ponzi Instability" ||
    ponziDebtShare >= 22.0 ||
    (activeInputs.cds?.currentBps ?? 0) >= REFINANCING_FREEZE_CDS_TRIGGER_BPS;

  // ── Preset stress-scenario benchmarks ─────────────────────────────────────
  // Every number in this table is recomputed from DEFAULT_MODEL_INPUTS (the live
  // input set: src/data/live-inputs.json) at render time, so it can never drift
  // from the live model.
  const stressScenarios = useMemo(() => {
    const base = DEFAULT_MODEL_INPUTS;
    const clone = (): BubbleModelInputs =>
      JSON.parse(JSON.stringify(base)) as BubbleModelInputs;

    const psValues = (base.valuations || [])
      .filter((v) => v.runRateRevenueUsd !== null && (v.runRateRevenueUsd as number) >= 100_000_000)
      .map((v) => v.valuationUsd / (v.runRateRevenueUsd as number))
      .sort((a, b) => a - b);
    const medianPs = psValues.length
      ? psValues.length % 2
        ? psValues[Math.floor(psValues.length / 2)]
        : (psValues[Math.floor(psValues.length / 2) - 1] + psValues[Math.floor(psValues.length / 2)]) / 2
      : 0;

    /** Rescale every tracked lab valuation so the median P/S hits `targetPs`. */
    const compressValuations = (i: BubbleModelInputs, targetPs: number) => {
      const factor = medianPs > 0 ? targetPs / medianPs : 1;
      i.valuations = (i.valuations || []).map((v) => ({ ...v, valuationUsd: v.valuationUsd * factor }));
    };

    const run = (i: BubbleModelInputs) => evaluateBubbleModel(i, { skipSubModels: true });

    const liveCds = base.cds?.currentBps ?? 0;
    const liveDebtShare = ((base.ledger?.debtShare ?? 0) * 100).toFixed(1);
    const liveCapexB = Math.round((base.capex?.aggregateCapexUsd ?? 0) / 1e9);
    const liveDeflation = base.adoption?.apiPriceDeclineMultiple ?? 0;

    const baseline = clone();
    const baselineResult = run(baseline);

    // Credit freeze: CDS blows out to 400bp on top of the live print and the
    // ledger's debt share jumps to 12%.
    const credit = clone();
    credit.cds = { ...credit.cds!, currentBps: 400 };
    credit.ledger = { ...credit.ledger!, debtShare: 0.12 };
    const creditResult = run(credit);

    // Multiple compression: the median lab P/S halves to 15×.
    const multiple = clone();
    compressValuations(multiple, 15);
    const multipleResult = run(multiple);

    // Capex retrenchment: 20% off the live CY2026 capex guide (and the matching
    // 20% drop in capex/OCF) — NOT the old $168B, which was a 77% cut
    // mislabelled as 20%.
    const capex = clone();
    capex.capex = { ...capex.capex!, aggregateCapexUsd: Math.round((capex.capex?.aggregateCapexUsd ?? 0) * 0.8) };
    capex.aiDebt = { ...capex.aiDebt!, capexToOcfRatio: (capex.aiDebt?.capexToOcfRatio ?? 0) * 0.8 };
    const capexResult = run(capex);

    // Soft landing: credit normalises to 150bp, leverage halves, multiples
    // compress to 20× and tokens keep getting cheaper.
    const soft = clone();
    soft.cds = { ...soft.cds!, currentBps: 150 };
    soft.ledger = { ...soft.ledger!, debtShare: 0.05 };
    compressValuations(soft, 20);
    soft.adoption = { ...soft.adoption!, apiPriceDeclineMultiple: 200 };
    const softResult = run(soft);

    const pct = (from: number, to: number) => `${to > from ? "+" : ""}${Math.round(((to - from) / from) * 100)}%`;

    return [
      {
        id: "baseline",
        name: "Current Verified Baseline",
        tag: "Live Reality",
        cds: `${liveCds} bp`,
        debtShare: `${liveDebtShare}%`,
        multiples: `${medianPs.toFixed(1)}×`,
        tokenDrop: `${liveDeflation}×`,
        capex: `$${liveCapexB}B`,
        prob: baselineResult.burstProbability,
        band: baselineResult.band,
        colorTone: "border-t-rule-strong",
      },
      {
        id: "credit-freeze",
        name: "Credit Freeze / CDS Blowout",
        tag: "2008 Parallel",
        cds: `400 bp (+${400 - liveCds} bp)`,
        debtShare: "12.0%",
        multiples: `${medianPs.toFixed(1)}×`,
        tokenDrop: `${liveDeflation}×`,
        capex: `$${liveCapexB}B`,
        prob: creditResult.burstProbability,
        band: creditResult.band,
        colorTone: "border-t-risk-500",
      },
      {
        id: "multiple-compression",
        name: "Multiple Compression (15×)",
        tag: "2022 Parallel",
        cds: `${liveCds} bp`,
        debtShare: `${liveDebtShare}%`,
        multiples: `15.0× (${pct(medianPs, 15)})`,
        tokenDrop: `${liveDeflation}×`,
        capex: `$${liveCapexB}B`,
        prob: multipleResult.burstProbability,
        band: multipleResult.band,
        colorTone: "border-t-caution-500",
      },
      {
        id: "capex-retrenchment",
        name: "Capex Retrenchment (−20%)",
        tag: "Cash-Flow Relief",
        cds: `${liveCds} bp`,
        debtShare: `${liveDebtShare}%`,
        multiples: `${medianPs.toFixed(1)}×`,
        tokenDrop: `${liveDeflation}×`,
        capex: `$${Math.round(liveCapexB * 0.8)}B (−20%)`,
        prob: capexResult.burstProbability,
        band: capexResult.band,
        colorTone: "border-t-safe-500",
      },
      {
        id: "soft-landing",
        name: "Ubiquitous Soft-Landing",
        tag: "Productivity Boom",
        cds: `150 bp (−${liveCds - 150} bp)`,
        debtShare: "5.0%",
        multiples: `20.0× (${pct(medianPs, 20)})`,
        tokenDrop: "200×",
        capex: `$${liveCapexB}B`,
        prob: softResult.burstProbability,
        band: softResult.band,
        colorTone: "border-t-safe-500",
      },
    ];
  }, []);

  // ── Marginal sensitivity elasticity ───────────────────────────────────────
  // EVERY number in this table is produced by the published model itself: each
  // row re-runs evaluateBubbleModel() on a perturbed copy of the live input set
  // (src/data/live-inputs.json via DEFAULT_MODEL_INPUTS) and reports the change
  // in the 12-month burst probability. No impact is typed, and a row that cannot
  // be computed is removed rather than printed.
  const elasticityRules = useMemo(() => {
    const base = DEFAULT_MODEL_INPUTS;
    const clone = (): BubbleModelInputs =>
      JSON.parse(JSON.stringify(base)) as BubbleModelInputs;
    const run = (i: BubbleModelInputs) => evaluateBubbleModel(i, { skipSubModels: true });

    const baseline = run(clone());

    /**
     * Change in 12-month burst probability (pts) caused by moving one input from
     * `from` to `to` — both runs go through the published model.
     */
    const step = (
      mutate: (i: BubbleModelInputs, value: number) => void,
      from: number,
      to: number
    ) => {
      const a = clone();
      mutate(a, from);
      const b = clone();
      mutate(b, to);
      const d = Math.round((run(b).burstProbability - run(a).burstProbability) * 10) / 10;
      return d === 0 ? 0 : d;
    };

    // Median price/sales across the labs with a verified run-rate (same basis as
    // /api/v1/model) — computed from the live valuation set.
    const psValues = (base.valuations || [])
      .filter((v) => v.runRateRevenueUsd !== null && (v.runRateRevenueUsd as number) >= 100_000_000)
      .map((v) => v.valuationUsd / (v.runRateRevenueUsd as number))
      .sort((a, b) => a - b);
    const medianPs = psValues.length
      ? psValues.length % 2
        ? psValues[Math.floor(psValues.length / 2)]
        : (psValues[Math.floor(psValues.length / 2) - 1] + psValues[Math.floor(psValues.length / 2)]) / 2
      : 0;
    const compressTo = (i: BubbleModelInputs, targetPs: number) => {
      const factor = medianPs > 0 ? targetPs / medianPs : 1;
      i.valuations = (i.valuations || []).map((v) => ({ ...v, valuationUsd: v.valuationUsd * factor }));
    };

    // Live inputs (src/data/live-inputs.json).
    const liveCds = base.cds?.currentBps ?? 0;
    const liveCdsBaseline = base.cds?.baselineBps ?? 0;
    const liveDebtSharePct = (base.ledger?.debtShare ?? 0) * 100;
    const liveUs10y = base.macro?.us10yYieldPct ?? 0;
    const liveUs10yNeutral = base.macro?.us10yBaselinePct ?? 0;
    const liveDeflation = base.adoption?.apiPriceDeclineMultiple ?? 0;
    const liveCapexUsd = base.capex?.aggregateCapexUsd ?? 0;
    const liveCapexB = Math.round(liveCapexUsd / 1e9);
    const liveCapexFcf = liveCapexUsd / (base.capex?.aggregateFcfUsd || 1);
    const liveOcfRatioPct = (base.aiDebt?.capexToOcfRatio ?? 0) * 100;

    // The credit factor's own state, straight from the engine's contribution
    // list (src/lib/model/engine.ts → evaluateBubbleModel().contributions).
    const creditFactor = baseline.contributions.find((c) => c.id === "cds_stress");
    const creditScore = creditFactor?.reading.score ?? 0;
    const creditPoints = creditFactor?.earnedPoints ?? 0;
    const creditWeight = creditFactor?.weightPct ?? 0;
    const creditRatio = liveCdsBaseline > 0 ? liveCds / liveCdsBaseline : 0;

    // Token deflation: the damper's deflation leg (src/lib/model/factors.ts) is
    // scored across 50×–500×, so the live reading sits past it. One row probes
    // the middle of the scored range, one probes the live reading itself.
    const deflationProbe = 200;

    const cdsImpact = step(
      (i, v) => { i.cds = { ...i.cds!, currentBps: v }; },
      liveCds,
      liveCds + 10
    );
    const psImpact = step((i, v) => compressTo(i, v), medianPs, medianPs - 5);
    const deflationInsideImpact = step(
      (i, v) => { i.adoption = { ...i.adoption!, apiPriceDeclineMultiple: v }; },
      deflationProbe,
      deflationProbe + 10
    );
    const deflationLiveImpact = step(
      (i, v) => { i.adoption = { ...i.adoption!, apiPriceDeclineMultiple: v }; },
      liveDeflation,
      liveDeflation + 10
    );
    const debtShareImpact = step(
      (i, v) => { i.ledger = { ...i.ledger!, debtShare: v }; },
      liveDebtSharePct / 100,
      liveDebtSharePct / 100 + 0.05
    );
    const us10yImpact = step(
      (i, v) => { i.macro = { ...i.macro!, us10yYieldPct: v }; },
      liveUs10y,
      liveUs10y + 0.5
    );
    const capexImpact = step(
      (i, v) => { i.capex = { ...i.capex!, aggregateCapexUsd: Math.round(v) }; },
      liveCapexUsd,
      liveCapexUsd * 1.2
    );

    return [
      {
        id: "cds",
        lever: "Oracle 5Y CDS Spread",
        change: `+10 bp (${liveCds} bp → ${liveCds + 10} bp)`,
        impact: cdsImpact,
        note: `Primary debt refinancing trigger for GPU cluster notes. The credit factor scores ${creditScore.toFixed(2)} on its level ramp and contributes ${creditPoints.toFixed(1)} of its ${creditWeight} published points — ${liveCds} bp is ${creditRatio.toFixed(2)}× the ${liveCdsBaseline} bp baseline, so the factor is NOT maxed and the marginal +10 bp move is worth ${cdsImpact.toFixed(1)} pts.`,
      },
      {
        id: "ps",
        lever: "Private Lab P/S Multiple",
        change: `−5.0× (${medianPs.toFixed(1)}× → ${(medianPs - 5).toFixed(1)}×)`,
        impact: psImpact,
        note: `Earnings growth catches up to valuation run-rates. The factor ramps linearly over 8×–60× (src/lib/model/factors.ts), and the live ${medianPs.toFixed(1)}× median is still inside the ramp, so a 5× move is worth ${Math.abs(psImpact).toFixed(1)} pts of burst odds.`,
      },
      {
        id: "deflation-scored-leg",
        lever: "Token Price Deflation (inside the damper's scored leg)",
        change: `+10× cheaper (${deflationProbe}× → ${deflationProbe + 10}×)`,
        impact: deflationInsideImpact,
        note: `Real utility adoption expands unit margins. The damper's deflation leg (src/lib/model/factors.ts) is scored across 50×–500×, so this row probes the middle of the scored range: cheaper tokens are worth ${Math.abs(deflationInsideImpact).toFixed(1)} pts of burst odds per 10×.`,
      },
      {
        id: "deflation-live",
        lever: "Token Price Deflation (at the live reading)",
        change: `+10× cheaper (${liveDeflation}× → ${liveDeflation + 10}×)`,
        impact: deflationLiveImpact,
        note: `The live ${liveDeflation}× reading is past the damper's scored leg, so the damper's contribution cannot move: additional cheapening changes the odds ${deflationLiveImpact.toFixed(1)} pts.`,
      },
      {
        id: "debt-share",
        lever: "Debt Share in Ledger",
        change: `+5.0 pts (${liveDebtSharePct.toFixed(1)}% → ${(liveDebtSharePct + 5).toFixed(1)}%)`,
        impact: debtShareImpact,
        note: `Leverage increases sensitivity to rate volatility. The factor ramps over 2.5%–15% (src/lib/model/factors.ts), and ${(liveDebtSharePct + 5).toFixed(1)}% is still inside the ramp — worth ${debtShareImpact.toFixed(1)} pts of burst odds.`,
      },
      {
        id: "us10y",
        lever: "US 10-Year Treasury Yield",
        change: `+50 bp (${liveUs10y.toFixed(2)}% → ${(liveUs10y + 0.5).toFixed(2)}%)`,
        impact: us10yImpact,
        note: `Elevates long-duration DCF hurdle discount rates. The published yield ramp (${liveUs10yNeutral.toFixed(2)}%–5.25%, src/lib/model/factors.ts) is already ${(((liveUs10y - liveUs10yNeutral) / (5.25 - liveUs10yNeutral)) * 100).toFixed(0)}% of its range, so only a sliver of headroom is left — the +50 bp step is worth ${us10yImpact.toFixed(1)} pts.`,
      },
      {
        id: "capex",
        lever: "Hyperscaler Capex/FCF Ratio",
        change: `+20% ($${liveCapexB}B → $${Math.round(liveCapexB * 1.2)}B)`,
        impact: capexImpact,
        note: `Capex is ${liveCapexFcf.toFixed(2)}× free cash flow, past the 2.0× ramp ceiling (src/lib/model/factors.ts), so the free-cash-flow leg is saturated and a 20% build-out moves the odds ${capexImpact.toFixed(1)} pts. A 20% cut to $${Math.round(liveCapexB * 0.8)}B (${(liveCapexFcf * 0.8).toFixed(2)}× FCF) stays saturated too; the operating-cash-flow leg (${liveOcfRatioPct.toFixed(1)}% of OCF) is the only leg still inside its ramp.`,
      },
    ];
  }, []);

  return (
<div className="section-sm">
      {/* Top banner ad */}
      <AdSlot placementId="sandbox-top" />

      {/* Page head */}
      <header className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
          <span className="label">Sensitivity sandbox</span>
          <Link href="/" className="text-[14px] text-ink-muted underline underline-offset-4 hover:text-ink">
            Back to Live Probability Gauge
          </Link>
        </div>

        <h1 className="max-w-reading text-3xl font-bold tracking-tight text-ink sm:text-4xl">
          Sensitivity Sandbox &amp; Stochastic Sampling Engine
        </h1>

        <p className="prose prose-lead max-w-reading">
          Test &quot;what-if&quot; scenarios in real time. Move the sliders below to see what happens to the
          AI bubble risk if interest rates jump, cloud costs fall, or debt markets panic.
        </p>

        {/* How the sandbox works — collapsed */}
        <details className="notice notice-caution">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-2 [&::-webkit-details-marker]:hidden">
            <span className="text-[14px] font-semibold text-ink">
              How this sandbox works: Try tweaking reality (No Finance Degree Required)
            </span>
            <ChevronRight
              className="h-4 w-4 shrink-0 text-ink-subtle transition-transform group-open:rotate-90"
              aria-hidden="true"
            />
          </summary>
          <div className="mt-2.5 border-t border-rule pt-2.5 text-[14px] leading-relaxed text-ink-muted">
            Every slider below represents a real-world financial lever. For example, drag <strong className="text-ink">US 10-Year Treasury Yield</strong> higher to see what happens if inflation forces the Fed to hike rates, or drag <strong className="text-ink">Token Price Deflation</strong> higher to simulate AI getting even cheaper and spreading to more businesses!
          </div>
        </details>
      </header>

<section aria-labelledby="live-snapshot-heading" className="card mt-6 space-y-5 shadow-card transition-shadow duration-200 hover:shadow-raised">
        {/* Header with title and calibration stamp */}
        <div className="flex flex-col gap-4 border-b border-rule pb-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Clock className="h-3.5 w-3.5 text-ink-subtle" aria-hidden="true" />
              <span className="label">Automated Pipeline Telemetry • Daily 24h Baseline</span>
            </div>
            <h2 id="live-snapshot-heading" className="text-xl font-bold tracking-tight text-ink">
              Live 24h Automated Snapshot
            </h2>
            <p className="prose max-w-2xl text-sm">
              Autonomous quantitative model snapshot calibrated daily at 00:00 UTC across live market
              feeds (OpenRouter, Polymarket, Yahoo Finance, and SEC EDGAR). Provides the institutional
              baseline against which all stress variations and stochastic iterations are measured.
            </p>
          </div>

          <div className="flex shrink-0 flex-col items-start gap-2 sm:flex-row sm:items-center">
            <span className="pill pill-safe !whitespace-normal">Calibrated daily at 00:00 UTC baseline</span>

            {(isSlidersModified || isResampled) && (
              <button
                onClick={handleResetToBaseline}
                className="btn min-h-11"
                title="Reset sliders and Monte Carlo seed to today's 24h automated baseline"
              >
                <RotateCcw className="h-4 w-4" aria-hidden="true" />
                <span>Reset to 24h Baseline</span>
              </button>
            )}
          </div>
        </div>

{/* 6 key baseline metrics from the 24h cron execution */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
          <div className="panel space-y-1">
            <p className="label">24h Baseline Odds</p>
            <p className="num mt-1 text-xl font-semibold text-ink">
              {baselineModel.burstProbability.toFixed(1)}%
            </p>
            <p className="mt-0.5">
              <span className="chip">{baselineModel.band}</span>
            </p>
          </div>

          <div className="panel space-y-1">
            <p className="label">Oracle 5Y CDS</p>
            <p className="num mt-1 text-xl font-semibold text-risk-700">
              {LIVE_CDS_BPS} bp
            </p>
            <p className="mt-0.5 text-ink-subtle">vs {LIVE_CDS_BASELINE_BPS} bp baseline</p>
          </div>

          <div className="panel space-y-1">
            <p className="label">Ledger Debt Share</p>
            <p className="num mt-1 text-xl font-semibold text-caution-700">
              {LIVE_DEBT_SHARE_PCT.toFixed(1)}%
            </p>
            <p className="num mt-0.5 text-ink-subtle">
              ${LIVE_TRACKED_DEBT_B.toFixed(1)}B / ${LIVE_LEDGER_TOTAL_T.toFixed(2)}T
            </p>
          </div>

          <div className="panel space-y-1">
            <p className="label">Token Deflation</p>
            <p className="num mt-1 text-xl font-semibold text-safe-700">
              {LIVE_TOKEN_DEFLATION}×
            </p>
            <p className="mt-0.5 text-xs text-ink-subtle">OpenRouter input basis</p>
          </div>

          <div className="panel space-y-1">
            <p className="label">Polymarket Odds</p>
            <p className="num mt-1 text-xl font-semibold text-ink">
              {LIVE_CROWD_2026_PCT.toFixed(1)}%
            </p>
            <p className="num mt-0.5 text-ink-subtle">
              Dec-2026 · ${LIVE_CROWD_VOLUME_M.toFixed(2)}M volume
            </p>
            <p className="num mt-0.5 text-ink-subtle">
              Jun-2027: {LIVE_CROWD_2027_PCT.toFixed(1)}%
            </p>
          </div>

          <div className="panel space-y-1">
            <p className="label">25k MC VaR95</p>
            <p className="num mt-1 text-xl font-semibold text-ink">
              {baselineMonteCarlo.valueAtRisk95Pct}%
            </p>
            <p className="num mt-0.5 text-ink-subtle">
              CVaR: {baselineMonteCarlo.conditionalValueAtRisk95Pct}%
            </p>
          </div>
        </div>

        {/* Dynamic deltas — what moved since today's automated baseline */}
        <div
          className={
            isSlidersModified || isResampled ? "notice notice-caution" : "notice"
          }
        >
          {isSlidersModified || isResampled ? (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="flex items-center gap-1.5">
                  <AlertTriangle className="h-4 w-4 text-caution-700" aria-hidden="true" />
                  <span className="notice-title">Dynamic Deltas Against Today&apos;s 24h Baseline</span>
                </span>
                <span className="text-[14px] text-ink-muted">
                  Active Scenario: <strong className="uppercase text-ink">{activeScenario}</strong>
                </span>
              </div>

<div className="flex flex-wrap items-center gap-2 text-[14px]">
                {/* 12M burst delta */}
                <span
                  className={`chip num ${
                    deltaBurstProb > 0 ? "chip-risk" : deltaBurstProb < 0 ? "chip-safe" : ""
                  }`}
                >
                  {deltaBurstProb > 0 ? (
                    <TrendingUp className="h-3.5 w-3.5" aria-hidden="true" />
                  ) : deltaBurstProb < 0 ? (
                    <TrendingDown className="h-3.5 w-3.5" aria-hidden="true" />
                  ) : null}
                  Δ Burst Odds: {deltaBurstProb > 0 ? `+${deltaBurstProb.toFixed(1)}%` : `${deltaBurstProb.toFixed(1)}%`}
                </span>

                {/* Composite score delta */}
                {deltaScore !== 0 && (
                  <span className="chip num">
                    Δ Score:
                    <span className={deltaScore > 0 ? "text-risk-700" : "text-safe-700"}>
                      {deltaScore > 0 ? `+${deltaScore.toFixed(1)}` : deltaScore.toFixed(1)} pts
                    </span>
                  </span>
                )}

                {/* CDS spread delta */}
                {deltaCds !== 0 && (
                  <span className="chip num">
                    Δ Oracle CDS:
                    <span className={deltaCds > 0 ? "text-risk-700" : "text-safe-700"}>
                      {deltaCds > 0 ? `+${deltaCds}` : deltaCds} bp
                    </span>
                  </span>
                )}

                {/* Debt share delta */}
                {deltaDebtShare !== 0 && (
                  <span className="chip num">
                    Δ Debt Share:
                    <span className={deltaDebtShare > 0 ? "text-caution-700" : "text-safe-700"}>
                      {deltaDebtShare > 0 ? `+${deltaDebtShare}%` : `${deltaDebtShare}%`}
                    </span>
                  </span>
                )}

                {/* US10Y delta */}
                {Math.abs(deltaUs10y) > 0.01 && (
                  <span className="chip num">
                    Δ US10Y:
                    <span className={deltaUs10y > 0 ? "text-ink" : "text-safe-700"}>
                      {deltaUs10y > 0 ? `+${deltaUs10y.toFixed(2)}%` : `${deltaUs10y.toFixed(2)}%`}
                    </span>
                  </span>
                )}

                {/* Ponzi debt share delta */}
                {ponziDebtShare !== latestModel.minsky.ponziSharePct && (
                  <span className="chip num">
                    Δ Ponzi Debt:
                    <span className={ponziDebtShare > latestModel.minsky.ponziSharePct ? "text-risk-700" : "text-safe-700"}>
                      {ponziDebtShare > latestModel.minsky.ponziSharePct
                        ? `+${(ponziDebtShare - latestModel.minsky.ponziSharePct).toFixed(1)}%`
                        : `${(ponziDebtShare - latestModel.minsky.ponziSharePct).toFixed(1)}%`}
                    </span>
                  </span>
                )}

                {/* Shiller ECY delta */}
                {shillerECY !== LIVE_EXCESS_CAPE_YIELD_PCT && (
                  <span className="chip num">
                    Δ Shiller ECY:
                    <span className={shillerECY < LIVE_EXCESS_CAPE_YIELD_PCT ? "text-risk-700" : "text-safe-700"}>
                      {shillerECY > LIVE_EXCESS_CAPE_YIELD_PCT
                        ? `+${(shillerECY - LIVE_EXCESS_CAPE_YIELD_PCT).toFixed(2)}%`
                        : `${(shillerECY - LIVE_EXCESS_CAPE_YIELD_PCT).toFixed(2)}%`}
                    </span>
                  </span>
                )}

                {/* Refinancing freeze alert */}
                {isRefinancingFreeze && (
                  <span className="pill pill-risk">
                    <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>REFINANCING FREEZE ACTIVE</span>
                  </span>
                )}

                {/* Resample Monte Carlo delta */}
                {isResampled && (
                  <span className="chip num">
                    <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
                    25k Resample #{sampleSeed - 41}: Δ Median {deltaMCMedian > 0 ? `+${deltaMCMedian.toFixed(1)}%` : `${deltaMCMedian.toFixed(1)}%`} • Δ VaR95 {deltaMCVaR > 0 ? `+${deltaMCVaR.toFixed(1)}%` : `${deltaMCVaR.toFixed(1)}%`}
                  </span>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-2 text-[14px] text-ink-muted">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-safe-700" aria-hidden="true" />
              <p>
                <strong className="text-ink">Exact Baseline Equilibrium:</strong> The sandbox is currently
                aligned with today&apos;s 00:00 UTC automated cron execution (Δ 0.0%). Modify any slider
                below or click{" "}
                <span className="font-semibold text-ink">&quot;Resample 25,000 Paths (Cholesky Copula)&quot;</span>{" "}
                to measure live variance against this baseline.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Primary Interactive Sandbox Component */}
      <SensitivitySandbox
        onStateChange={handleStateChange}
        externalResetTrigger={resetTrigger}
      />

      {/* ── MINSKY INSTABILITY REGIME & SHILLER EXCESS CAPE YIELD LEVERS ──────── */}
      <section aria-labelledby="minsky-shiller-sandbox-heading" className="card mt-6 space-y-6 shadow-card transition-shadow duration-200 hover:shadow-raised">
        <div className="flex flex-col gap-4 border-b border-rule pb-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Layers className="h-3.5 w-3.5 text-ink-subtle" aria-hidden="true" />
              <span className="label">Structural Credit Levers • Advanced Macro Primitives</span>
            </div>
            <h2 id="minsky-shiller-sandbox-heading" className="text-xl font-bold tracking-tight text-ink">
              <span>Minsky Instability Regime &amp; Shiller Excess CAPE Levers</span>
            </h2>
            <p className="prose max-w-3xl text-sm">
              Model non-linear refinancing freezes across Hyman Minsky&apos;s tri-partite debt taxonomy (Hedge, Speculative, and Ponzi finance)
              and calibrate Robert Shiller&apos;s Excess CAPE Yield (ECY = 1/CAPE − Real Yield) against equity risk premia.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Dynamic Regime Indicator Pill */}
            <span className={`pill ${
              isRefinancingFreeze || minsky.currentRegime === 'Ponzi Instability'
                ? 'pill-risk'
                : minsky.currentRegime === 'Speculative Transition'
                  ? 'pill-caution'
                  : 'pill-safe'
            }`}>
              {isRefinancingFreeze ? 'CRITICAL: Refinancing Freeze' : minsky.currentRegime}
            </span>

            {(isMinskyModified || isShillerModified) && (
              <button
                onClick={() => {
                  setPonziDebtShare(latestModel.minsky.ponziSharePct);
                  setSpeculativeDebtShare(latestModel.minsky.speculativeSharePct);
                  setHedgeCashFlowCushion(1.42);
                  setShillerECY(LIVE_EXCESS_CAPE_YIELD_PCT);
                }}
                className="btn min-h-11 cursor-pointer"
                title="Reset Minsky and Shiller sliders to baseline"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Levers</span>
              </button>
            )}
          </div>
        </div>

        {/* Dynamic Transition Banner for Refinancing Freeze */}
        {isRefinancingFreeze && (
          <div className="notice notice-risk flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-risk-700" aria-hidden="true" />
            <div className="space-y-1">
              <span className="notice-title block">
                Refinancing Freeze Transition Triggered ({minsky.refinancingFreezeProbabilityPct}% 12M Seizure Odds)
              </span>
              <p className="leading-relaxed">
                When Ponzi debt share reaches <strong>{ponziDebtShare.toFixed(1)}%</strong> (${(minsky.breakdown.ponziDebtUsd / 1e9).toFixed(1)}B), operating cash flows across non-hyperscaler frontier labs fail to cover interest obligations.
                Private debt facilities freeze, syndicated convertible note markets close to sub-investment grade AI borrowers, and circular counterparty equity subsidies halt.
              </p>
            </div>
          </div>
        )}

        {/* Sliders Grid: 3 Minsky Levers + 1 Shiller ECY Lever */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-1">
          {/* LEFT COLUMN: Minsky Instability Levers */}
          <div className="panel space-y-5">
            <div className="flex items-center justify-between border-b border-rule pb-2">
              <div className="flex items-center gap-2">
                <Scale className="h-4 w-4 text-caution-700" aria-hidden="true" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-ink">
                  Minsky Debt Taxonomy Levers
                </h3>
              </div>
              <span className="num text-[14px] font-semibold text-caution-700">
                Fragility: {minsky.minskyFragilityIndex}/100
              </span>
            </div>

            {/* Lever 1: Ponzi Debt Share */}
            <div className="space-y-2">
              <div className="flex justify-between items-baseline text-[14px] font-mono">
                <label htmlFor="ponzi-slider" className="font-bold text-ink flex items-center space-x-1.5">
                  <span>1. Ponzi Debt Share</span>
                  <span className="text-ink-subtle">(0% to 30%)</span>
                </label>
                <div className="flex items-center space-x-1.5 font-bold">
                  <span className={ponziDebtShare >= 20 ? "text-risk-700 font-semibold" : "text-caution-700"}>
                    {ponziDebtShare.toFixed(1)}%
                  </span>
                  <span className="num text-ink-subtle">(${ (minsky.breakdown.ponziDebtUsd / 1e9).toFixed(1) }B)</span>
                </div>
              </div>
              <input
                id="ponzi-slider"
                type="range"
                min={0}
                max={30}
                step={0.5}
                value={ponziDebtShare}
                onChange={(e) => setPonziDebtShare(parseFloat(e.target.value))}
                className="h-11 w-full cursor-pointer accent-risk-500"
              />
              <p className="text-[14px] leading-relaxed text-ink-subtle">
                Units where operating cash flow &lt; interest. Relies strictly on equity infusions or new debt to service existing liabilities.
              </p>
            </div>

            {/* Lever 2: Speculative Debt Share */}
            <div className="space-y-2">
              <div className="flex justify-between items-baseline text-[14px] font-mono">
                <label htmlFor="speculative-slider" className="font-bold text-ink flex items-center space-x-1.5">
                  <span>2. Speculative Debt Share</span>
                  <span className="text-ink-subtle">(10% to 60%)</span>
                </label>
                <div className="flex items-center space-x-1.5 font-bold">
                  <span className="text-caution-700 font-bold">
                    {speculativeDebtShare.toFixed(1)}%
                  </span>
                  <span className="num text-ink-subtle">(${ (minsky.breakdown.speculativeDebtUsd / 1e9).toFixed(1) }B)</span>
                </div>
              </div>
              <input
                id="speculative-slider"
                type="range"
                min={10}
                max={60}
                step={0.5}
                value={speculativeDebtShare}
                onChange={(e) => setSpeculativeDebtShare(parseFloat(e.target.value))}
                className="h-11 w-full cursor-pointer accent-caution-500"
              />
              <p className="text-[14px] leading-relaxed text-ink-subtle">
                Cash flows cover interest payments, but principal must be perpetually rolled over or refinanced upon maturity.
              </p>
            </div>

            {/* Lever 3: Hedge Cash Flow Cushion */}
            <div className="space-y-2">
              <div className="flex justify-between items-baseline text-[14px] font-mono">
                <label htmlFor="hedge-cushion-slider" className="font-bold text-ink flex items-center space-x-1.5">
                  <span>3. Hedge Cash Flow Cushion</span>
                  <span className="text-ink-subtle">(0.5× to 4.0×)</span>
                </label>
                <div className="flex items-center space-x-1.5 font-bold">
                  <span className={hedgeCashFlowCushion < 1.0 ? "text-risk-700" : "text-safe-700"}>
                    {hedgeCashFlowCushion.toFixed(2)}×
                  </span>
                  <span className="num text-ink-subtle">({minsky.hedgeSharePct}% debt)</span>
                </div>
              </div>
              <input
                id="hedge-cushion-slider"
                type="range"
                min={0.5}
                max={4.0}
                step={0.05}
                value={hedgeCashFlowCushion}
                onChange={(e) => setHedgeCashFlowCushion(parseFloat(e.target.value))}
                className="h-11 w-full cursor-pointer accent-safe-500"
              />
              <p className="text-[14px] leading-relaxed text-ink-subtle">
                Operating cash flow multiple covering combined principal amortization + interest service (Big Tech balance-sheet anchor).
              </p>
            </div>

            {/* Minsky Breakdown Summary Strip */}
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-rule text-center font-mono text-[14px]">
              <div className="p-2 bg-surface bg-surface-2 rounded-lg border border-rule/80 border-rule">
                <span className="num text-ink-subtle block">Hedge Share</span>
                <strong className="text-safe-700">{minsky.hedgeSharePct}%</strong>
              </div>
              <div className="p-2 bg-surface bg-surface-2 rounded-lg border border-rule/80 border-rule">
                <span className="num text-ink-subtle block">Speculative</span>
                <strong className="text-caution-700">{minsky.speculativeSharePct}%</strong>
              </div>
              <div className="p-2 bg-surface bg-surface-2 rounded-lg border border-rule/80 border-rule">
                <span className="num text-ink-subtle block">Ponzi Share</span>
                <strong className="text-risk-700">{minsky.ponziSharePct}%</strong>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Shiller Excess CAPE Yield Lever */}
          <div className="space-y-5 panel flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-rule pb-2">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-ink-subtle" aria-hidden="true" />
                  <h3 className="text-sm font-bold uppercase tracking-wider text-ink">
                    Robert Shiller Excess CAPE Yield
                  </h3>
                </div>
                <span className={`chip ${
                  shiller.equityRiskPremiumBand === 'Compressed (<1.5%)'
                    ? "bg-caution-50 text-caution-700 bg-caution-50/80 text-caution-600"
                    : shiller.equityRiskPremiumBand === 'Normal (1.5–3.5%)'
                    ? "bg-surface-2 text-ink"
                    : "bg-safe-50 text-safe-700 bg-safe-50/80 text-safe-600"
                }`}>
                  {shiller.equityRiskPremiumBand}
                </span>
              </div>

              {/* Shiller ECY Slider */}
              <div className="space-y-2">
                <div className="flex justify-between items-baseline text-[14px] font-mono">
                  <label htmlFor="shiller-slider" className="font-bold text-ink flex items-center space-x-1.5">
                    <span>Excess CAPE Yield (ECY)</span>
                    <span className="text-ink-subtle">(-2.0% to +5.0%)</span>
                  </label>
                  <div className="flex items-center space-x-1.5 font-bold">
                    <span className={`num text-base font-semibold ${
                      shillerECY < 0 ? "text-risk-700" : shillerECY < 1.5 ? "text-caution-700" : "text-safe-700"
                    }`}>
                      {shillerECY >= 0 ? `+${shillerECY.toFixed(2)}%` : `${shillerECY.toFixed(2)}%`}
                    </span>
                  </div>
                </div>
                <input
                  id="shiller-slider"
                  type="range"
                  min={-2.0}
                  max={5.0}
                  step={0.05}
                  value={shillerECY}
                  onChange={(e) => setShillerECY(parseFloat(e.target.value))}
                  className="h-11 w-full cursor-pointer accent-ink"
                />
                <p className="text-[14px] leading-relaxed text-ink-subtle">
                  Formula: <code className="font-mono text-ink-muted">ECY = (1 / CAPE) - 10Y Real Yield</code>.
                  Measures long-term equity risk compensation beyond risk-free inflation-protected Treasuries.
                </p>
              </div>

              {/* Dynamic Formula Display Card */}
              <div className="panel space-y-2">
                <div className="flex justify-between items-center text-ink-muted">
                  <span>AI Tech CAPE Multiple:</span>
                  <strong className="text-ink">{shiller.aiCapeMultiple}× (Hist Median: {shiller.historicalMedianCape}×)</strong>
                </div>
                <div className="flex justify-between items-center text-ink-muted">
                  <span>Earnings Yield (1/CAPE):</span>
                  <strong>{shiller.earningsYieldPct}%</strong>
                </div>
                <div className="flex justify-between items-center text-ink-muted">
                  <span>10-Year Real Treasury Yield:</span>
                  <strong className="text-ink-muted">{shiller.real10yYieldPct}%</strong>
                </div>
                <div className="pt-1 border-t border-rule flex justify-between items-center">
                  <span className="font-bold">Net Equity Risk Premium:</span>
                  <span className={`num font-semibold ${
                    shillerECY < 0 ? "text-risk-700" : shillerECY < 1.5 ? "text-caution-700" : "text-safe-700"
                  }`}>
                    {shillerECY >= 0 ? `+${shillerECY.toFixed(2)}%` : `${shillerECY.toFixed(2)}%`}
                  </span>
                </div>
              </div>
            </div>

            <p className="text-ink-subtle font-sans pt-2 border-t border-rule">
              {shiller.interpretation}
            </p>
          </div>
        </div>
      </section>

      <AdSlot placementId="sandbox-infeed" className="mt-6" />

      {/* ── CLASSICAL FINANCIAL MODELS BENCHMARK (MERTON, ALTMAN, LPPLS) ─────── */}
      <section aria-labelledby="classical-models-heading" className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 pb-1">
          <div>
            <h2 id="classical-models-heading" className="text-xl sm:text-2xl font-bold text-ink tracking-tight flex items-center space-x-2">
              <Scale className="w-5 h-5 text-ink-muted" />
              <span>Classical Quantitative Financial Models Alignment</span>
            </h2>
            <p className="text-[14px] text-ink-subtle mt-0.5 font-sans">
              Mathematical cross-validation against established structural credit and bubble singularity literature.
            </p>
          </div>
          <Link
            href="/methodology#classical-models"
            className="prose-a flex min-h-11 items-center gap-1 text-[13px] font-semibold"
          >
            <span>Read full mathematical formulas</span>
            <span aria-hidden="true">→</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Card 1: Merton Model */}
          <div className="card space-y-3 flex flex-col justify-between shadow-xs">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[14px] font-mono">
                <span className="font-bold text-ink-muted uppercase">Merton (1974) Model</span>
                <span className="chip">
                  {merton.distanceToDefault}σ Distance
                </span>
              </div>
              <h3 className="font-bold text-base text-ink">
                Structural Distance-to-Default
              </h3>
              <p className="text-[14px] text-ink-muted leading-relaxed">
                Evaluates corporate AI debt (${(merton.totalDebtUsd / 1e9).toFixed(1)}B) against total guarantor asset value (${(merton.assetValueUsd / 1e12).toFixed(2)}T) under a {merton.assetVolatilityPct}% volatility environment.
              </p>
              <div className="panel space-y-1">
                <div className="flex justify-between">
                  <span>Structural Default Prob:</span>
                  <strong className="text-caution-700">{merton.defaultProbabilityPct}%</strong>
                </div>
                <div className="flex justify-between">
                  <span>Theoretical Spread:</span>
                  <span>+{merton.structuralSpreadBps} bps</span>
                </div>
              </div>
            </div>
            <p className="text-ink-subtle font-sans pt-2 border-t border-rule">
              {merton.interpretation}
            </p>
          </div>

          {/* Card 2: Altman Z''-Score */}
          <div className="card space-y-3 flex flex-col justify-between shadow-xs">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[14px] font-mono">
                <span className="font-bold text-ink-muted uppercase">Altman Z&apos;&apos;-Score (2002)</span>
                <span className="px-2 py-0.5 rounded bg-caution-50 bg-caution-50/80 text-caution-700 font-bold border border-caution-200 border-caution-500">
                  Z&apos;&apos; = {altman.score}
                </span>
              </div>
              <h3 className="font-bold text-base text-ink">
                Tech &amp; Cloud Distress Classifier
              </h3>
              <p className="text-[14px] text-ink-muted leading-relaxed">
                Four-variable formula for emerging cloud tech: Working capital, negative retained earnings (lab burn), and {altman.components.marketCapToDebt}× equity/debt.
              </p>
              <div className="panel space-y-1">
                <div className="flex justify-between">
                  <span>Zone Classification:</span>
                  <strong className="text-caution-700">{altman.zone}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Implied Distress Risk:</span>
                  <span>{altman.impliedDistressProbPct}%</span>
                </div>
              </div>
            </div>
            <p className="text-ink-subtle font-sans pt-2 border-t border-rule">
              {altman.interpretation}
            </p>
          </div>

          {/* Card 3: Sornette LPPLS */}
          <div className="card space-y-3 flex flex-col justify-between shadow-xs">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[14px] font-mono">
                <span className="font-bold text-ink-muted uppercase">Sornette LPPLS Model</span>
                <span className="px-2 py-0.5 rounded bg-risk-50 bg-risk-50/80 text-risk-700 font-bold border border-risk-200 border-risk-500">
                  Hazard: {lppls.crashHazardRatePct}%
                </span>
              </div>
              <h3 className="font-bold text-base text-ink">
                Log-Periodic Singularity Detection
              </h3>
              <p className="text-[14px] text-ink-muted leading-relaxed">
                Super-exponential capex commitment growth with accelerating log-periodic oscillations prior to critical time $t_c$.
              </p>
              <div className="panel space-y-1">
                <div className="flex justify-between">
                  <span>Critical Singularity Window:</span>
                  <strong className="text-risk-700">{lppls.estimatedCriticalWindow}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Power Exponent (m):</span>
                  <span>{lppls.superExponentialExponent}</span>
                </div>
              </div>
            </div>
            <p className="text-ink-subtle font-sans pt-2 border-t border-rule">
              {lppls.interpretation}
            </p>
          </div>
        </div>
      </section>

      {/* ── 25,000-PATH MONTE CARLO STOCHASTIC SAMPLING SUITE ────────────────── */}
      <section aria-labelledby="monte-carlo-heading" className="card mt-6 space-y-6 shadow-card transition-shadow duration-200 hover:shadow-raised">
        <div className="flex flex-col gap-4 border-b border-rule pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4" />
              <span>Stochastic Cholesky Copula Simulation Engine</span>
            </div>
            <h2 id="monte-carlo-heading" className="text-xl sm:text-2xl font-bold text-ink mt-1">
              25,000-Path Monte Carlo Sampling &amp; Tail Risk Distribution
            </h2>
            <p className="text-[14px] sm:text-sm text-ink-muted font-sans mt-1 max-w-3xl leading-relaxed">
              Stochastically simulates 25,000 joint correlation paths using empirical Cholesky copula correlation (<code className="text-safe-600 font-mono">L·Lᵀ = Σ</code>) across Gaussian interest rate variations,
              lognormal credit spreads, and multiple shocks to calculate empirical Value-at-Risk (VaR) and Expected Shortfall.
            </p>
          </div>

          <button
            onClick={handleResample}
            disabled={isSampling}
            className="btn btn-primary min-h-11 shrink-0 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSampling ? "animate-spin" : ""}`} />
            <span>{isSampling ? "Simulating..." : "Resample 25,000 Paths (Cholesky Copula)"}</span>
          </button>
        </div>

        {/* Statistical Moments Summary Cards with Live 24h Baseline Deltas (6 Columns) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 font-mono text-[14px]">
          {/* Card 1: Median & Mean */}
          <div className="panel space-y-1">
            <div className="flex items-center justify-between">
              <span className="label">Median Probability</span>
              {deltaMCMedian !== 0 && (
                <span className={`chip num font-semibold ${deltaMCMedian > 0 ? "text-risk-600 bg-risk-50/60" : "text-safe-600 bg-safe-50/60"}`}>
                  {deltaMCMedian > 0 ? `+${deltaMCMedian.toFixed(1)}%` : `${deltaMCMedian.toFixed(1)}%`}
                </span>
              )}
            </div>
            <span className="text-xl sm:text-2xl num text-xl font-semibold text-ink">{monteCarlo.medianProbabilityPct}%</span>
            <span className="num text-ink-subtle block">
              Mean: {monteCarlo.meanProbabilityPct}% (±{monteCarlo.stdDevPct}%)
            </span>
          </div>

          {/* Card 2: 90% input-sensitivity range */}
          <div className="panel space-y-1">
            <span className="label">90% Input-Sensitivity Range</span>
            <span className="text-lg sm:text-xl num text-lg font-semibold text-safe-700">
              [{monteCarlo.ci90Pct[0]}%–{monteCarlo.ci90Pct[1]}%]
            </span>
            <span className="num text-ink-subtle block">Empirical 10th to 90th %ile</span>
          </div>

          {/* Card 3: VaR 95% */}
          <div className="panel space-y-1">
            <div className="flex items-center justify-between">
              <span className="label">95% Value-at-Risk</span>
              {deltaMCVaR !== 0 && (
                <span className={`chip num font-semibold ${deltaMCVaR > 0 ? "text-caution-600 bg-caution-50/60" : "text-safe-600 bg-safe-50/60"}`}>
                  {deltaMCVaR > 0 ? `+${deltaMCVaR.toFixed(1)}%` : `${deltaMCVaR.toFixed(1)}%`}
                </span>
              )}
            </div>
            <span className="text-xl sm:text-2xl num text-xl font-semibold text-caution-700">{monteCarlo.valueAtRisk95Pct}%</span>
            <span className="num text-ink-subtle block">
              {deltaMCVaR !== 0 ? `Δ baseline: ${deltaMCVaR > 0 ? `+${deltaMCVaR.toFixed(1)}%` : `${deltaMCVaR.toFixed(1)}%`}` : "95% of paths remain below"}
            </span>
          </div>

          {/* Card 4: VaR 99% Extreme Tail */}
          <div className="panel space-y-1">
            <div className="flex items-center justify-between">
              <span className="label">99% Extreme VaR</span>
              {deltaMCVaR99 !== 0 && (
                <span className={`chip num font-semibold ${deltaMCVaR99 > 0 ? "text-risk-600 bg-risk-50/60" : "text-safe-600 bg-safe-50/60"}`}>
                  {deltaMCVaR99 > 0 ? `+${deltaMCVaR99.toFixed(1)}%` : `${deltaMCVaR99.toFixed(1)}%`}
                </span>
              )}
            </div>
            <span className="text-xl sm:text-2xl num text-xl font-semibold text-risk-700">{monteCarlo.valueAtRisk99Pct}%</span>
            <span className="num text-ink-subtle block">
              {deltaMCVaR99 !== 0 ? `Δ baseline: ${deltaMCVaR99 > 0 ? `+${deltaMCVaR99.toFixed(1)}%` : `${deltaMCVaR99.toFixed(1)}%`}` : "Extreme 99th %ile shock"}
            </span>
          </div>

          {/* Card 5: CVaR 95% Expected Shortfall */}
          <div className="panel space-y-1">
            <div className="flex items-center justify-between">
              <span className="label">Expected Shortfall (CVaR)</span>
              {deltaMCCVaR !== 0 && (
                <span className={`chip num font-semibold ${deltaMCCVaR > 0 ? "text-risk-600 bg-risk-50/60" : "text-safe-600 bg-safe-50/60"}`}>
                  {deltaMCCVaR > 0 ? `+${deltaMCCVaR.toFixed(1)}%` : `${deltaMCCVaR.toFixed(1)}%`}
                </span>
              )}
            </div>
            <span className="text-xl sm:text-2xl num text-xl font-semibold text-risk-700">{monteCarlo.conditionalValueAtRisk95Pct}%</span>
            <span className="num text-ink-subtle block">
              {deltaMCCVaR !== 0 ? `Δ baseline: ${deltaMCCVaR > 0 ? `+${deltaMCCVaR.toFixed(1)}%` : `${deltaMCCVaR.toFixed(1)}%`}` : "Worst 5% tail scenario mean"}
            </span>
          </div>

          {/* Card 6: Statistical Moments (Variance, Skew, Kurt) */}
          <div className="panel space-y-1">
            <span className="label">Variance &amp; Moments</span>
            <span className="text-xl sm:text-2xl num text-xl font-semibold text-ink">σ²: {monteCarlo.variance}</span>
            <span className="text-ink-subtle block">
              Skew: {monteCarlo.skewness} • Kurt: {monteCarlo.kurtosis}
            </span>
          </div>
        </div>

        {/* Visual Monte Carlo Distribution Histogram */}
        <div className="space-y-2 pt-2">
          <div className="flex items-center justify-between text-[14px] font-mono text-ink-subtle">
            <span>Simulated Burst Probability Distribution (25,000 iterations):</span>
            <span>
              Skewness: {monteCarlo.skewness} • Kurtosis: {monteCarlo.kurtosis} • Runtime:{" "}
              {/* measured with performance.now(), so it only exists after hydration */}
              {isRuntimeKnown ? `${monteCarlo.executionTimeMs}ms` : "measuring…"}
            </span>
          </div>

          <Reveal>
            <div className="grid h-32 grid-cols-10 items-end gap-1.5 rounded-xl border border-rule bg-surface-2 p-3">
            {monteCarlo.histogram.map((bin, index) => {
              const maxPct = Math.max(...monteCarlo.histogram.map((h) => h.percentage));
              const heightPct = Math.max(8, (bin.percentage / maxPct) * 100);
              const isPeak = bin.percentage === maxPct;
              return (
                <div key={bin.range} className="flex flex-col items-center h-full justify-end group relative">
                  <div className="text-[14px] text-ink-subtle mb-1 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    {bin.percentage}%
                  </div>
                  <div
                    className={`bar-drop w-full rounded-t transition-colors ${
                      isPeak
                        ? "bg-safe-500 "
                        : bin.range >= "50%"
                        ? "bg-risk-500/80 hover:bg-risk-500"
                        : "bg-surface-3/80 hover:bg-surface-3"
                    }`}
                    style={{ height: `${heightPct}%`, transitionDelay: `${index * 45}ms` }}
                  />
                  <span className="text-[14px] text-ink-subtle mt-1 truncate max-w-full">
                    {bin.range.split("–")[0]}
                  </span>
                </div>
              );
            })}
            </div>
          </Reveal>
        </div>
      </section>

      {/* Preset Macro Scenarios */}
      <div className="space-y-4">
        <div>
          <span className="label">SCENARIO ARCHETYPE BENCHMARKS</span>
          <h2 className="mt-0.5 text-xl font-bold text-ink">Calibrated Macro Stresses &amp; Historical Parallels</h2>
          <p className="prose prose-p max-w-2xl text-sm">
            Compare model sensitivity against famous market shocks: 2008 Lehman credit contagion,
            2022 Fed rate hiking cycle, or productivity breakthrough. Each preset is re-run through the
            published model from the live inputs, so the odds shown are the model&apos;s own output.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {stressScenarios.map((sc, index) => (
            <Reveal key={sc.id} delay={index * 60}>
            <div className={`card border-t-2 ${sc.colorTone}`}>
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="label">{sc.tag}</span>
                  <span
                    className={`chip ${
                      sc.band === "critical" || sc.band === "high"
                        ? "chip-risk"
                        : sc.band === "elevated"
                          ? "chip-caution"
                          : "chip-safe"
                    }`}
                  >
                    {sc.band.charAt(0).toUpperCase() + sc.band.slice(1)}
                  </span>
                </div>
                <h3 className="text-base font-semibold leading-snug text-ink">{sc.name}</h3>
                <div className="num space-y-1 pt-1 text-[14px] text-ink-muted">
                  <div className="flex justify-between">
                    <span>Oracle CDS:</span>
                    <span className="font-semibold">{sc.cds}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-ink-subtle">Debt Share:</span>
                    <span className="font-semibold">{sc.debtShare}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-ink-subtle">Lab Multiple:</span>
                    <span className="font-semibold">{sc.multiples}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-ink-subtle">Token Deflation:</span>
                    <span className="font-semibold">{sc.tokenDrop}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-ink-subtle">CY2026 Capex:</span>
                    <span className="font-semibold">{sc.capex}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-baseline justify-between border-t border-rule pt-2">
                <span className="label">12M Probability</span>
                <span className={`num text-2xl font-semibold ${sc.prob >= 65 ? "text-risk-700" : sc.prob >= 45 ? "text-caution-700" : "text-safe-700"}`}>
                  {sc.prob.toFixed(1)}%
                </span>
              </div>
            </div>
            </Reveal>
          ))}
        </div>
      </div>

      {/* Sensitivity Elasticity Table */}
      <div className="card mt-6 shadow-card">
        <div>
          <span className="label">QUANTITATIVE ELASTICITY</span>
          <h2 className="mt-0.5 text-xl font-bold text-ink">Marginal Sensitivity Elasticity Rulebook</h2>
          <p className="prose prose-p max-w-2xl text-sm">
            Shows the exact marginal delta on 12-month burst probability for each unit change in input
            variables. Every figure is re-measured against today&apos;s 24h baseline at render time;
            where a factor is already saturated at the live reading the honest answer is 0.0 pts, and
            the note says which factors those are.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-[14px] sm:text-sm">
            <caption className="sr-only">
              Marginal sensitivity of the 12-month burst probability to each model lever: the
              delta tested, the measured impact on burst odds, and the transmission mechanism.
            </caption>
            <thead className="border-b border-rule-strong text-ink-subtle">
              <tr>
                <th scope="col" className="p-3.5">Variable / Lever</th>
                <th scope="col" className="p-3.5">Delta Tested</th>
                <th scope="col" className="p-3.5">Impact on 12M Burst Odds</th>
                <th scope="col" className="p-3.5">Transmission Mechanism</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rule divide-rule/80">
              {elasticityRules.map((r) => (
                <tr key={r.id} className="hover:bg-surface-2/50 hover:bg-surface-2/40 transition-colors">
                  <th scope="row" className="p-3.5 font-semibold text-ink">{r.lever}</th>
                  <td className="num p-3.5 font-semibold text-ink">{r.change}</td>
                  <td
                    className={`num p-3.5 font-semibold ${
                      r.impact > 0 ? "text-risk-700" : r.impact < 0 ? "text-safe-700" : "text-ink-muted"
                    }`}
                  >
                    {r.impact > 0 ? "+" : ""}{r.impact.toFixed(1)} pts Burst Odds
                  </td>
                  <td className="p-3.5 text-[14px] leading-relaxed text-ink-muted">{r.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Sensitivity Logistic Curve visualization */}
      <section aria-labelledby="sigmoid-curve-heading" className="mt-6 space-y-3">
        <h2 id="sigmoid-curve-heading" className="flex items-center gap-2 text-xl font-bold text-ink">
          <BarChart3 className="h-5 w-5 text-ink-subtle" aria-hidden="true" />
          <span>Non-Linear Sigmoid Response Curve Calibration</span>
        </h2>
        {/* The chart's "Live reading" chip is fed the LIVE model's own output for the
            current sandbox state (src/lib/model/engine.ts → evaluateBubbleModel),
            never a hard-coded print. */}
        <SensitivityCurveChart
          currentScore={activeResult.compositeScore}
          currentProb={activeResult.burstProbability}
        />
      </section>

      <AdSlot placementId="sandbox-bottom" className="mt-6" />

      {/* Regulatory & Institutional Compliance Disclaimer */}
      <div className="notice notice-caution mt-6">
        <p className="notice-title flex items-center gap-1.5">
          <AlertTriangle className="h-3.5 w-3.5 text-caution-700" aria-hidden="true" />
          <span>Regulatory Notice — Not Financial Advice</span>
        </p>
        <p className="mt-1.5 text-[14px] leading-relaxed">
          The interactive sensitivity sliders, scenario presets, stress parameters, and 25,000-path Monte
          Carlo simulations displayed in this sandbox are mathematical risk-modeling exercises based on
          public disclosures as of October 2026. They do not constitute financial, investment, or legal
          advice, nor do they solicit any trading actions or securities recommendations.
        </p>
      </div>
    </div>
  );
}
