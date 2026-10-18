"use client";

import React, { useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { SensitivitySandbox } from "@/components/SensitivitySandbox";
import { SensitivityCurveChart } from "@/components/VisualCharts";
import { AdSlot } from "@/components/AdSlot";
import { evaluateBubbleModel, DEFAULT_MODEL_INPUTS } from "@/lib/model/engine";
import type { BubbleModelInputs, BubbleModelResult } from "@/lib/model/types";
import liveInputsData from "@/data/live-inputs.json";
import syncHistoryData from "@/data/sync-history.json";
import {
  runMonteCarloSimulation,
  computeMertonModel,
  computeAltmanZScore,
  computeLpplsMetrics,
} from "@/lib/model/quantitative";
import {
  Sliders,
  ArrowLeft,
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

export default function SandboxPage() {
  const [sampleSeed, setSampleSeed] = useState(42);
  const [isSampling, setIsSampling] = useState(false);
  const [resetTrigger, setResetTrigger] = useState(0);

  // Baseline calibration from today's automated 24h cron execution
  const baselineModel = useMemo(() => evaluateBubbleModel(DEFAULT_MODEL_INPUTS), []);
  const baselineMonteCarlo = useMemo(() => runMonteCarloSimulation(DEFAULT_MODEL_INPUTS, 10_000, 42_1337), []);

  // Active state received dynamically from sandbox sliders
  const [activeInputs, setActiveInputs] = useState<BubbleModelInputs>(DEFAULT_MODEL_INPUTS);
  const [activeResult, setActiveResult] = useState<BubbleModelResult>(baselineModel);
  const [activeScenario, setActiveScenario] = useState<string>("baseline");

  // Compute classical financial models from literature using active inputs
  const merton = useMemo(() => computeMertonModel(activeInputs), [activeInputs]);
  const altman = useMemo(() => computeAltmanZScore(activeInputs), [activeInputs]);
  const lppls = useMemo(() => computeLpplsMetrics(activeInputs), [activeInputs]);

  // Compute 10,000-Path Monte Carlo Sampling (re-evaluates on resample seed OR inputs change)
  const monteCarlo = useMemo(() => {
    return runMonteCarloSimulation(activeInputs, 10_000, 42_1337 + (sampleSeed - 42) * 104729);
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
  const deltaCds = (activeInputs.cds?.currentBps ?? 187) - (DEFAULT_MODEL_INPUTS.cds?.currentBps ?? 187);
  const deltaDebtShare = Math.round(((activeInputs.ledger?.debtShare ?? 0.07) - (DEFAULT_MODEL_INPUTS.ledger?.debtShare ?? 0.07)) * 100);
  const deltaUs10y = Math.round(((activeInputs.macro?.us10yYieldPct ?? 4.42) - (DEFAULT_MODEL_INPUTS.macro?.us10yYieldPct ?? 4.42)) * 100) / 100;

  // Monte Carlo Deltas against 24h Baseline
  const deltaMCMedian = Math.round((monteCarlo.medianProbabilityPct - baselineMonteCarlo.medianProbabilityPct) * 10) / 10;
  const deltaMCVaR = Math.round((monteCarlo.valueAtRisk95Pct - baselineMonteCarlo.valueAtRisk95Pct) * 10) / 10;
  const deltaMCCVaR = Math.round((monteCarlo.conditionalValueAtRisk95Pct - baselineMonteCarlo.conditionalValueAtRisk95Pct) * 10) / 10;
  const isResampled = sampleSeed !== 42;
  const isSlidersModified = deltaBurstProb !== 0 || deltaCds !== 0 || deltaDebtShare !== 0 || deltaUs10y !== 0;

  const stressScenarios = [
    {
      name: "Current Verified Baseline",
      cds: "187 bp",
      debtShare: "7.0%",
      multiples: "34.8×",
      tokenDrop: "40×",
      prob: "39.1%",
      band: "Guarded",
      tag: "Live Reality",
      color: "border-slate-300 dark:border-zinc-700",
    },
    {
      name: "Credit Freeze / CDS Blowout",
      cds: "260 bp (+39%)",
      debtShare: "12.0%",
      multiples: "34.8×",
      tokenDrop: "40×",
      prob: "58.4%",
      band: "Elevated",
      tag: "2008 Parallel",
      color: "border-rose-300 dark:border-rose-900",
    },
    {
      name: "Multiple Compression (15×)",
      cds: "187 bp",
      debtShare: "7.0%",
      multiples: "15.0× (-57%)",
      tokenDrop: "40×",
      prob: "31.2%",
      band: "Guarded",
      tag: "2022 Parallel",
      color: "border-amber-300 dark:border-amber-900",
    },
    {
      name: "Ubiquitous Soft-Landing",
      cds: "110 bp",
      debtShare: "5.0%",
      multiples: "20.0×",
      tokenDrop: "90× (-99%)",
      prob: "22.4%",
      band: "Calm",
      tag: "Productivity Boom",
      color: "border-emerald-300 dark:border-emerald-900",
    },
  ];

  const elasticityRules = [
    { lever: "Oracle 5Y CDS Spread", change: "+10 bp", impact: "+1.8% Burst Odds", note: "Primary debt refinancing trigger for GPU cluster notes" },
    { lever: "Private Lab P/S Multiple", change: "-5.0×", impact: "-3.2% Burst Odds", note: "Earnings growth catches up to valuation run-rates" },
    { lever: "Token Price Deflation", change: "+10× Cheaper", impact: "-1.5% Burst Odds", note: "Real utility adoption expands unit margins" },
    { lever: "Debt Share in Ledger", change: "+5.0%", impact: "+2.4% Burst Odds", note: "Leverage increases sensitivity to rate volatility" },
    { lever: "US 10-Year Treasury Yield", change: "+50 bp", impact: "+4.1% Burst Odds", note: "Elevates long-duration DCF hurdle discount rates" },
    { lever: "Hyperscaler Capex/FCF Ratio", change: "+20%", impact: "+3.6% Burst Odds", note: "Depletes operating cash reserves relative to debt service" },
  ];

  return (
    <div className="space-y-8 sm:space-y-12 pb-12">
      {/* Top Banner Ad */}
      <AdSlot format="leaderboard" />

      {/* Header & Back Link */}
      <div className="space-y-3 pb-6 border-b border-slate-200 dark:border-zinc-800">
        <Link
          href="/"
          className="inline-flex items-center space-x-1.5 text-xs font-mono font-semibold text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Live Probability Gauge</span>
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center space-x-3">
              <Sliders className="w-8 h-8 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>Sensitivity Sandbox &amp; Stochastic Sampling Engine</span>
            </h1>
            <p className="text-sm sm:text-base text-slate-600 dark:text-zinc-300 font-sans mt-2 max-w-3xl leading-relaxed">
              Stress-test the model by manually tuning underlying levers or running a 10,000-path stochastic Monte Carlo 
              simulation across joint interest rate shocks, credit spreads, and multiple compression.
            </p>
          </div>
          <div className="flex items-center space-x-2 text-xs font-mono bg-slate-100 dark:bg-zinc-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-700 shrink-0">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-slate-700 dark:text-zinc-300 font-semibold">Stochastic Simulator Live</span>
          </div>
        </div>
      </div>

      {/* ── LIVE 24H AUTOMATED SNAPSHOT REFERENCE CARD ─────────────────────── */}
      <section aria-labelledby="live-snapshot-heading" className="bg-white dark:bg-[#121214] border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 sm:p-7 space-y-5 shadow-sm transition-all">
        {/* Header with Title and Calibrated Badge */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-zinc-800">
          <div className="space-y-1">
            <div className="flex items-center space-x-2 text-xs font-mono font-bold text-slate-500 dark:text-zinc-400">
              <Clock className="w-3.5 h-3.5 text-emerald-500" />
              <span className="uppercase tracking-wider">Automated Pipeline Telemetry • Daily 24h Baseline</span>
            </div>
            <h2 id="live-snapshot-heading" className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center space-x-2">
              <span>Live 24h Automated Snapshot</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-300 font-sans leading-relaxed max-w-2xl">
              Synthesized by GitHub Actions <code className="text-emerald-600 dark:text-emerald-400 font-mono">.github/workflows/update-data.yml</code> at 00:00 UTC. 
              Provides the institutional baseline against which all slider variations and stochastic iterations are measured.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-2 shrink-0">
            {/* Required Badge */}
            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full text-xs font-mono font-bold bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 shadow-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <span>Calibrated against today&apos;s 00:00 UTC automated cron snapshot</span>
            </div>

            {(isSlidersModified || isResampled) && (
              <button
                onClick={handleResetToBaseline}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 transition-colors border border-slate-300 dark:border-zinc-700 cursor-pointer"
                title="Reset sliders and Monte Carlo seed to today's 24h automated baseline"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                <span>Reset to 24h Baseline</span>
              </button>
            )}
          </div>
        </div>

        {/* 6 Key Baseline Metrics from 24h Cron Execution */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 font-mono text-xs">
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#09090b] border border-slate-200/80 dark:border-zinc-800 space-y-1">
            <span className="text-[10px] uppercase text-slate-500 dark:text-zinc-400 block font-semibold">24h Baseline Odds</span>
            <div className="text-xl font-black text-slate-900 dark:text-white tabular-nums">
              {baselineModel.burstProbability.toFixed(1)}%
            </div>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-bold inline-block uppercase">
              {baselineModel.band}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#09090b] border border-slate-200/80 dark:border-zinc-800 space-y-1">
            <span className="text-[10px] uppercase text-slate-500 dark:text-zinc-400 block font-semibold">Oracle 5Y CDS</span>
            <div className="text-xl font-black text-rose-600 dark:text-rose-400 tabular-nums">
              {DEFAULT_MODEL_INPUTS.cds?.currentBps ?? 187} bp
            </div>
            <span className="text-[10px] text-slate-500 dark:text-zinc-400 block truncate">
              vs 81 bp baseline
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#09090b] border border-slate-200/80 dark:border-zinc-800 space-y-1">
            <span className="text-[10px] uppercase text-slate-500 dark:text-zinc-400 block font-semibold">Ledger Debt Share</span>
            <div className="text-xl font-black text-amber-600 dark:text-amber-400 tabular-nums">
              {((DEFAULT_MODEL_INPUTS.ledger?.debtShare ?? 0.07) * 100).toFixed(1)}%
            </div>
            <span className="text-[10px] text-slate-500 dark:text-zinc-400 block truncate">
              $196.8B / $2.81T
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#09090b] border border-slate-200/80 dark:border-zinc-800 space-y-1">
            <span className="text-[10px] uppercase text-slate-500 dark:text-zinc-400 block font-semibold">Token Deflation</span>
            <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
              {DEFAULT_MODEL_INPUTS.adoption?.apiPriceDeclineMultiple ?? 40}×
            </div>
            <span className="text-[10px] text-slate-500 dark:text-zinc-400 block truncate">
              OpenRouter live
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#09090b] border border-slate-200/80 dark:border-zinc-800 space-y-1">
            <span className="text-[10px] uppercase text-slate-500 dark:text-zinc-400 block font-semibold">Polymarket Odds</span>
            <div className="text-xl font-black text-blue-600 dark:text-blue-400 tabular-nums">
              {((DEFAULT_MODEL_INPUTS.crowd?.yesProbability ?? 0.103) * 100).toFixed(1)}%
            </div>
            <span className="text-[10px] text-slate-500 dark:text-zinc-400 block truncate">
              $9.14M volume
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#09090b] border border-slate-200/80 dark:border-zinc-800 space-y-1">
            <span className="text-[10px] uppercase text-slate-500 dark:text-zinc-400 block font-semibold">10k Monte Carlo VaR</span>
            <div className="text-xl font-black text-indigo-600 dark:text-indigo-400 tabular-nums">
              {baselineMonteCarlo.valueAtRisk95Pct}%
            </div>
            <span className="text-[10px] text-slate-500 dark:text-zinc-400 block truncate">
              CVaR: {baselineMonteCarlo.conditionalValueAtRisk95Pct}%
            </span>
          </div>
        </div>

        {/* Dynamic Deltas Display Bar: Changes dynamically as user modifies sliders or resamples */}
        <div className={`p-4 rounded-xl border transition-all ${
          isSlidersModified || isResampled
            ? "bg-amber-50/50 dark:bg-amber-950/20 border-amber-300 dark:border-amber-900/60"
            : "bg-slate-50 dark:bg-[#09090b] border-slate-200 dark:border-zinc-800"
        }`}>
          {isSlidersModified || isResampled ? (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
                <span className="font-bold text-amber-800 dark:text-amber-300 flex items-center space-x-1.5 uppercase tracking-wider">
                  <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <span>Dynamic Deltas Against Today&apos;s 24h Baseline</span>
                </span>
                <span className="text-slate-500 dark:text-zinc-400 text-[11px]">
                  Active Scenario: <strong className="text-slate-800 dark:text-zinc-200 uppercase">{activeScenario}</strong>
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 font-mono text-xs">
                {/* 12M Burst Delta */}
                <div className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border font-bold ${
                  deltaBurstProb > 0
                    ? "bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border-rose-300 dark:border-rose-800"
                    : deltaBurstProb < 0
                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800"
                    : "bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-zinc-300 border-slate-300 dark:border-zinc-700"
                }`}>
                  {deltaBurstProb > 0 ? (
                    <TrendingUp className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                  ) : deltaBurstProb < 0 ? (
                    <TrendingDown className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  ) : null}
                  <span>
                    Δ Burst Odds: {deltaBurstProb > 0 ? `+${deltaBurstProb.toFixed(1)}%` : `${deltaBurstProb.toFixed(1)}%`}
                  </span>
                </div>

                {/* Composite Score Delta */}
                {deltaScore !== 0 && (
                  <div className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-white dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700 font-bold text-slate-800 dark:text-zinc-200">
                    <span>Δ Score:</span>
                    <span className={deltaScore > 0 ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"}>
                      {deltaScore > 0 ? `+${deltaScore.toFixed(1)}` : deltaScore.toFixed(1)} pts
                    </span>
                  </div>
                )}

                {/* CDS Spread Delta */}
                {deltaCds !== 0 && (
                  <div className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-white dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700 font-bold text-slate-800 dark:text-zinc-200">
                    <span>Δ Oracle CDS:</span>
                    <span className={deltaCds > 0 ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"}>
                      {deltaCds > 0 ? `+${deltaCds}` : deltaCds} bp
                    </span>
                  </div>
                )}

                {/* Debt Share Delta */}
                {deltaDebtShare !== 0 && (
                  <div className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-white dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700 font-bold text-slate-800 dark:text-zinc-200">
                    <span>Δ Debt Share:</span>
                    <span className={deltaDebtShare > 0 ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"}>
                      {deltaDebtShare > 0 ? `+${deltaDebtShare}%` : `${deltaDebtShare}%`}
                    </span>
                  </div>
                )}

                {/* US10Y Delta */}
                {Math.abs(deltaUs10y) > 0.01 && (
                  <div className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-white dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700 font-bold text-slate-800 dark:text-zinc-200">
                    <span>Δ US10Y:</span>
                    <span className={deltaUs10y > 0 ? "text-indigo-600 dark:text-indigo-400" : "text-emerald-600 dark:text-emerald-400"}>
                      {deltaUs10y > 0 ? `+${deltaUs10y.toFixed(2)}%` : `${deltaUs10y.toFixed(2)}%`}
                    </span>
                  </div>
                )}

                {/* Resample Monte Carlo Delta */}
                {isResampled && (
                  <div className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 font-bold">
                    <RefreshCw className="w-3.5 h-3.5 text-indigo-500 animate-spin-slow" />
                    <span>
                      10k Resample #{sampleSeed - 41}: Δ Median {deltaMCMedian > 0 ? `+${deltaMCMedian.toFixed(1)}%` : `${deltaMCMedian.toFixed(1)}%`} • Δ VaR95 {deltaMCVaR > 0 ? `+${deltaMCVaR.toFixed(1)}%` : `${deltaMCVaR.toFixed(1)}%`}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center space-x-2 text-xs font-mono text-slate-600 dark:text-zinc-400">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>
                <strong>Exact Baseline Equilibrium:</strong> The sandbox is currently aligned with today&apos;s 00:00 UTC automated cron execution (Δ 0.0%). 
                Modify any slider below or click <span className="text-indigo-600 dark:text-indigo-400 font-bold">&quot;Resample 10,000 Paths&quot;</span> to measure live variance against this baseline.
              </span>
            </div>
          )}
        </div>
      </section>

      {/* Primary Interactive Sandbox Component */}
      <SensitivitySandbox
        onStateChange={handleStateChange}
        externalResetTrigger={resetTrigger}
      />

      {/* ── CLASSICAL FINANCIAL MODELS BENCHMARK (MERTON, ALTMAN, LPPLS) ─────── */}
      <section aria-labelledby="classical-models-heading" className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 pb-1">
          <div>
            <h2 id="classical-models-heading" className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center space-x-2">
              <Scale className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <span>Classical Quantitative Financial Models Alignment</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5 font-sans">
              Mathematical cross-validation against established structural credit and bubble singularity literature.
            </p>
          </div>
          <Link
            href="/methodology#classical-models"
            className="text-xs font-mono text-indigo-600 dark:text-indigo-400 hover:underline flex items-center space-x-1"
          >
            <span>Read full mathematical formulas</span>
            <span aria-hidden="true">→</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Card 1: Merton Model */}
          <div className="p-5 rounded-2xl bg-white dark:bg-[#121214] border border-slate-200 dark:border-zinc-800 space-y-3 flex flex-col justify-between shadow-xs">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="font-bold text-slate-700 dark:text-zinc-300 uppercase">Merton (1974) Model</span>
                <span className="px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 font-bold border border-indigo-200 dark:border-indigo-800">
                  {merton.distanceToDefault}σ Distance
                </span>
              </div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Structural Distance-to-Default
              </h3>
              <p className="text-xs text-slate-600 dark:text-zinc-400 font-sans leading-relaxed">
                Evaluates corporate AI debt ($196.8B) against total guarantor asset value ($1.42T) under a 36.5% volatility environment.
              </p>
              <div className="p-3 bg-slate-50 dark:bg-zinc-900 rounded-xl border border-slate-200/80 dark:border-zinc-800 font-mono text-xs space-y-1 text-slate-700 dark:text-zinc-300">
                <div className="flex justify-between">
                  <span>Structural Default Prob:</span>
                  <strong className="text-amber-600 dark:text-amber-400">{merton.defaultProbabilityPct}%</strong>
                </div>
                <div className="flex justify-between">
                  <span>Theoretical Spread:</span>
                  <span>+{merton.structuralSpreadBps} bps</span>
                </div>
              </div>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-zinc-400 font-sans pt-2 border-t border-slate-100 dark:border-zinc-800">
              {merton.interpretation}
            </p>
          </div>

          {/* Card 2: Altman Z''-Score */}
          <div className="p-5 rounded-2xl bg-white dark:bg-[#121214] border border-slate-200 dark:border-zinc-800 space-y-3 flex flex-col justify-between shadow-xs">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="font-bold text-slate-700 dark:text-zinc-300 uppercase">Altman Z&apos;&apos;-Score (2002)</span>
                <span className="px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 font-bold border border-amber-200 dark:border-amber-800">
                  Z&apos;&apos; = {altman.score}
                </span>
              </div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Tech &amp; Cloud Distress Classifier
              </h3>
              <p className="text-xs text-slate-600 dark:text-zinc-400 font-sans leading-relaxed">
                Four-variable formula for emerging cloud tech: Working capital, negative retained earnings (lab burn), and 7.2× equity/debt.
              </p>
              <div className="p-3 bg-slate-50 dark:bg-zinc-900 rounded-xl border border-slate-200/80 dark:border-zinc-800 font-mono text-xs space-y-1 text-slate-700 dark:text-zinc-300">
                <div className="flex justify-between">
                  <span>Zone Classification:</span>
                  <strong className="text-amber-600 dark:text-amber-400">{altman.zone}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Implied Distress Risk:</span>
                  <span>{altman.impliedDistressProbPct}%</span>
                </div>
              </div>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-zinc-400 font-sans pt-2 border-t border-slate-100 dark:border-zinc-800">
              {altman.interpretation}
            </p>
          </div>

          {/* Card 3: Sornette LPPLS */}
          <div className="p-5 rounded-2xl bg-white dark:bg-[#121214] border border-slate-200 dark:border-zinc-800 space-y-3 flex flex-col justify-between shadow-xs">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="font-bold text-slate-700 dark:text-zinc-300 uppercase">Sornette LPPLS Model</span>
                <span className="px-2 py-0.5 rounded bg-rose-50 dark:bg-rose-950/80 text-rose-700 dark:text-rose-400 font-bold border border-rose-200 dark:border-rose-800">
                  Hazard: {lppls.crashHazardRatePct}%
                </span>
              </div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Log-Periodic Singularity Detection
              </h3>
              <p className="text-xs text-slate-600 dark:text-zinc-400 font-sans leading-relaxed">
                Super-exponential capex commitment growth with accelerating log-periodic oscillations prior to critical time $t_c$.
              </p>
              <div className="p-3 bg-slate-50 dark:bg-zinc-900 rounded-xl border border-slate-200/80 dark:border-zinc-800 font-mono text-xs space-y-1 text-slate-700 dark:text-zinc-300">
                <div className="flex justify-between">
                  <span>Critical Singularity Window:</span>
                  <strong className="text-rose-600 dark:text-rose-400">{lppls.estimatedCriticalWindow}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Power Exponent (m):</span>
                  <span>{lppls.superExponentialExponent}</span>
                </div>
              </div>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-zinc-400 font-sans pt-2 border-t border-slate-100 dark:border-zinc-800">
              {lppls.interpretation}
            </p>
          </div>
        </div>
      </section>

      {/* ── 10,000-PATH MONTE CARLO STOCHASTIC SAMPLING SUITE ────────────────── */}
      <section aria-labelledby="monte-carlo-heading" className="bg-slate-900 text-white border border-indigo-500/30 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div>
            <div className="flex items-center space-x-2 text-xs font-mono text-emerald-400 font-bold uppercase tracking-wider">
              <Activity className="w-4 h-4" />
              <span>Stochastic Latin Hypercube Simulation Engine</span>
            </div>
            <h2 id="monte-carlo-heading" className="text-xl sm:text-2xl font-bold text-white mt-1">
              10,000-Path Monte Carlo Sampling &amp; Tail Risk Distribution
            </h2>
            <p className="text-xs sm:text-sm text-zinc-300 font-sans mt-1 max-w-3xl leading-relaxed">
              Stochastically simulates 10,000 joint correlation paths across Gaussian interest rate variations, 
              lognormal credit spreads, and multiple shocks to calculate empirical Value-at-Risk (VaR) and Expected Shortfall.
            </p>
          </div>

          <button
            onClick={handleResample}
            disabled={isSampling}
            className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl font-mono text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-md cursor-pointer shrink-0 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSampling ? "animate-spin" : ""}`} />
            <span>{isSampling ? "Simulating..." : "Resample 10,000 Paths"}</span>
          </button>
        </div>

        {/* Statistical Moments Summary Cards with Live 24h Baseline Deltas */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 font-mono text-xs">
          <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-zinc-400 block text-[11px]">Median Probability</span>
              {deltaMCMedian !== 0 && (
                <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${deltaMCMedian > 0 ? "text-rose-400 bg-rose-950/60" : "text-emerald-400 bg-emerald-950/60"}`}>
                  {deltaMCMedian > 0 ? `+${deltaMCMedian.toFixed(1)}%` : `${deltaMCMedian.toFixed(1)}%`}
                </span>
              )}
            </div>
            <span className="text-2xl font-black text-white">{monteCarlo.medianProbabilityPct}%</span>
            <span className="text-[10px] text-zinc-500 block">
              Mean: {monteCarlo.meanProbabilityPct}% (±{monteCarlo.stdDevPct}%)
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 space-y-1">
            <span className="text-zinc-400 block text-[11px]">90% Confidence Interval</span>
            <span className="text-2xl font-black text-emerald-400">
              [{monteCarlo.ci90Pct[0]}% – {monteCarlo.ci90Pct[1]}%]
            </span>
            <span className="text-[10px] text-zinc-500 block">Empirical 10th to 90th %ile</span>
          </div>

          <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-zinc-400 block text-[11px]">95% Value-at-Risk (VaR)</span>
              {deltaMCVaR !== 0 && (
                <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${deltaMCVaR > 0 ? "text-amber-400 bg-amber-950/60" : "text-emerald-400 bg-emerald-950/60"}`}>
                  {deltaMCVaR > 0 ? `+${deltaMCVaR.toFixed(1)}%` : `${deltaMCVaR.toFixed(1)}%`}
                </span>
              )}
            </div>
            <span className="text-2xl font-black text-amber-400">{monteCarlo.valueAtRisk95Pct}%</span>
            <span className="text-[10px] text-zinc-500 block">
              {deltaMCVaR !== 0 ? `Δ vs baseline: ${deltaMCVaR > 0 ? `+${deltaMCVaR.toFixed(1)}%` : `${deltaMCVaR.toFixed(1)}%`}` : "95% of paths remain below"}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-zinc-400 block text-[11px]">Expected Shortfall (CVaR)</span>
              {deltaMCCVaR !== 0 && (
                <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${deltaMCCVaR > 0 ? "text-rose-400 bg-rose-950/60" : "text-emerald-400 bg-emerald-950/60"}`}>
                  {deltaMCCVaR > 0 ? `+${deltaMCCVaR.toFixed(1)}%` : `${deltaMCCVaR.toFixed(1)}%`}
                </span>
              )}
            </div>
            <span className="text-2xl font-black text-rose-400">{monteCarlo.conditionalValueAtRisk95Pct}%</span>
            <span className="text-[10px] text-zinc-500 block">
              {deltaMCCVaR !== 0 ? `Δ vs baseline: ${deltaMCCVaR > 0 ? `+${deltaMCCVaR.toFixed(1)}%` : `${deltaMCCVaR.toFixed(1)}%`}` : "Mean of worst 5% tail shock"}
            </span>
          </div>
        </div>

        {/* Visual Monte Carlo Distribution Histogram */}
        <div className="space-y-2 pt-2">
          <div className="flex items-center justify-between text-xs font-mono text-zinc-400">
            <span>Simulated Burst Probability Distribution (10,000 iterations):</span>
            <span>Skewness: {monteCarlo.skewness} • Kurtosis: {monteCarlo.kurtosis}</span>
          </div>

          <div className="grid grid-cols-10 gap-1.5 h-32 items-end p-3 rounded-xl bg-black/40 border border-white/10">
            {monteCarlo.histogram.map((bin) => {
              const maxPct = Math.max(...monteCarlo.histogram.map((h) => h.percentage));
              const heightPct = Math.max(8, (bin.percentage / maxPct) * 100);
              const isPeak = bin.percentage === maxPct;
              return (
                <div key={bin.range} className="flex flex-col items-center h-full justify-end group relative">
                  <div className="text-[10px] font-mono text-zinc-400 mb-1 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    {bin.percentage}%
                  </div>
                  <div
                    className={`w-full rounded-t transition-all ${
                      isPeak
                        ? "bg-emerald-400 shadow-md shadow-emerald-500/50"
                        : bin.range >= "50%"
                        ? "bg-rose-500/80 hover:bg-rose-400"
                        : "bg-indigo-500/80 hover:bg-indigo-400"
                    }`}
                    style={{ height: `${heightPct}%` }}
                  />
                  <span className="text-[9px] font-mono text-zinc-400 mt-1 truncate max-w-full">
                    {bin.range.split("–")[0]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Preset Macro Scenarios */}
      <div className="space-y-4">
        <div>
          <span className="text-xs font-mono text-slate-500 dark:text-zinc-400 font-bold uppercase tracking-wider">
            SCENARIO ARCHETYPE BENCHMARKS
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-0.5">
            Calibrated Macro Stresses &amp; Historical Parallels
          </h2>
          <p className="text-sm text-slate-600 dark:text-zinc-300 font-sans mt-0.5">
            Compare model sensitivity against famous market shocks: 2008 Lehman credit contagion, 2022 Fed rate hiking cycle, or productivity breakthrough.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stressScenarios.map((sc) => (
            <div
              key={sc.name}
              className={`bg-white dark:bg-[#121214] border ${sc.color} rounded-xl p-5 space-y-3 transition-colors shadow-xs flex flex-col justify-between`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
                    {sc.tag}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      sc.band === "Critical"
                        ? "bg-rose-100 text-rose-800 dark:bg-rose-950/70 dark:text-rose-300"
                        : sc.band === "High Stress"
                        ? "bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400"
                        : sc.band === "Elevated"
                        ? "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400"
                        : "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400"
                    }`}
                  >
                    {sc.band}
                  </span>
                </div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white leading-snug">
                  {sc.name}
                </h3>
                <div className="space-y-1 text-xs font-mono text-slate-600 dark:text-zinc-300 pt-1">
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-zinc-400">Oracle CDS:</span>
                    <span className="font-semibold">{sc.cds}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-zinc-400">Debt Share:</span>
                    <span className="font-semibold">{sc.debtShare}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-zinc-400">Lab Multiple:</span>
                    <span className="font-semibold">{sc.multiples}</span>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200 dark:border-zinc-800/80 flex items-baseline justify-between font-mono">
                <span className="text-xs font-mono font-medium text-slate-500 dark:text-zinc-400">12M Probability:</span>
                <span className={`text-2xl font-black font-tabular ${sc.prob >= "70%" ? "text-rose-600 dark:text-rose-400" : sc.prob >= "50%" ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"}`}>
                  {sc.prob}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Sensitivity Elasticity Table */}
      <div className="bg-white dark:bg-[#121214] border border-slate-200 dark:border-zinc-800 rounded-xl p-6 sm:p-8 space-y-4 transition-colors shadow-sm">
        <div>
          <span className="text-xs font-mono text-slate-500 dark:text-zinc-400 font-bold uppercase tracking-wider">
            QUANTITATIVE ELASTICITY
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-0.5">
            Marginal Sensitivity Elasticity Rulebook
          </h2>
          <p className="text-sm text-slate-600 dark:text-zinc-300 font-sans mt-0.5">
            Shows the exact marginal delta on 12-month burst probability for each unit change in input variables.
          </p>
        </div>

        <div className="overflow-x-auto border border-slate-100 dark:border-zinc-800 rounded-xl">
          <table className="w-full text-left text-xs sm:text-sm font-mono">
            <thead className="bg-slate-50 dark:bg-[#09090b] border-b border-slate-100 dark:border-zinc-800 text-slate-500 dark:text-zinc-400">
              <tr>
                <th className="p-3.5">Variable / Lever</th>
                <th className="p-3.5">Delta Tested</th>
                <th className="p-3.5">Impact on 12M Burst Odds</th>
                <th className="p-3.5">Transmission Mechanism</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/80">
              {elasticityRules.map((r) => (
                <tr key={r.lever} className="hover:bg-slate-50/50 dark:hover:bg-zinc-900/40 transition-colors">
                  <td className="p-3.5 font-bold text-slate-900 dark:text-white">{r.lever}</td>
                  <td className="p-3.5 text-slate-800 dark:text-zinc-200 font-bold">{r.change}</td>
                  <td className="p-3.5 font-black text-rose-600 dark:text-rose-400">{r.impact}</td>
                  <td className="p-3.5 text-xs sm:text-sm font-sans text-slate-700 dark:text-zinc-300">{r.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Sensitivity Logistic Curve visualization */}
      <section aria-labelledby="sigmoid-curve-heading" className="space-y-3">
        <h2 id="sigmoid-curve-heading" className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center space-x-2">
          <BarChart3 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          <span>Non-Linear Sigmoid Response Curve Calibration</span>
        </h2>
        <SensitivityCurveChart />
      </section>

      {/* Bottom Ad */}
      <AdSlot format="in-feed" />
    </div>
  );
}
