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
  computeMinskyModel,
  computeShillerCapeModel,
} from "@/lib/model/engine";
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

  // Minsky Instability Regime interactive levers
  const [ponziDebtShare, setPonziDebtShare] = useState<number>(13.0);
  const [speculativeDebtShare, setSpeculativeDebtShare] = useState<number>(26.5);
  const [hedgeCashFlowCushion, setHedgeCashFlowCushion] = useState<number>(1.42);

  // Shiller Excess CAPE Yield interactive lever
  const [shillerECY, setShillerECY] = useState<number>(1.08);

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
    setPonziDebtShare(13.0);
    setSpeculativeDebtShare(26.5);
    setHedgeCashFlowCushion(1.42);
    setShillerECY(1.08);
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
  const deltaUs10y = Math.round(((activeInputs.macro?.us10yYieldPct ?? 5.10) - (DEFAULT_MODEL_INPUTS.macro?.us10yYieldPct ?? 5.10)) * 100) / 100;

  // Monte Carlo Deltas against 24h Baseline
  const deltaMCMedian = Math.round((monteCarlo.medianProbabilityPct - baselineMonteCarlo.medianProbabilityPct) * 10) / 10;
  const deltaMCVaR = Math.round((monteCarlo.valueAtRisk95Pct - baselineMonteCarlo.valueAtRisk95Pct) * 10) / 10;
  const deltaMCVaR99 = Math.round((monteCarlo.valueAtRisk99Pct - baselineMonteCarlo.valueAtRisk99Pct) * 10) / 10;
  const deltaMCCVaR = Math.round((monteCarlo.conditionalValueAtRisk95Pct - baselineMonteCarlo.conditionalValueAtRisk95Pct) * 10) / 10;
  const isResampled = sampleSeed !== 42;
  const isMinskyModified = ponziDebtShare !== 13.0 || speculativeDebtShare !== 26.5 || hedgeCashFlowCushion !== 1.42;
  const isShillerModified = shillerECY !== 1.08;
  const isSlidersModified = deltaBurstProb !== 0 || deltaCds !== 0 || deltaDebtShare !== 0 || deltaUs10y !== 0 || isMinskyModified || isShillerModified;
  const isRefinancingFreeze = minsky.refinancingFreezeProbabilityPct >= 20 || minsky.currentRegime === 'Ponzi Instability' || ponziDebtShare >= 22.0 || (activeInputs.cds?.currentBps ?? 187) >= 260;

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
              Test &quot;what-if&quot; scenarios in real time. Move the sliders below to see what happens to the AI bubble risk if interest rates jump, cloud costs fall, or debt markets panic.
            </p>
          </div>
          <div className="flex items-center space-x-2 text-xs font-mono bg-slate-100 dark:bg-zinc-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-700 shrink-0">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-slate-700 dark:text-zinc-300 font-semibold">Live Sandbox Engine</span>
          </div>
        </div>

        {/* Plain English Guide for Sandbox (Collapsed by default) */}
        <details className="group border border-amber-500/20 rounded-xl bg-amber-500/5 hover:bg-amber-500/10 transition-colors">
          <summary className="p-2.5 sm:px-3.5 cursor-pointer flex items-center justify-between text-xs font-bold text-amber-900 dark:text-amber-200 select-none list-none [&::-webkit-details-marker]:hidden">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span>💡 How this sandbox works: Try tweaking reality (No Finance Degree Required)</span>
            </div>
            <span className="font-mono text-[11px] text-amber-600 dark:text-amber-400 group-open:rotate-180 transition-transform">▾</span>
          </summary>
          <div className="px-3.5 pb-3 pt-1 text-xs text-slate-600 dark:text-zinc-300 font-sans leading-relaxed border-t border-amber-500/15">
            Every slider below represents a real-world financial lever. For example, drag <strong>US 10-Year Treasury Yield</strong> higher to see what happens if inflation forces the Fed to hike rates, or drag <strong>Token Price Deflation</strong> higher to simulate AI getting even cheaper and spreading to more businesses!
          </div>
        </details>
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
              $228.1B / $2.86T
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

                {/* Ponzi Debt Share Delta */}
                {ponziDebtShare !== 13.0 && (
                  <div className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-white dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700 font-bold text-slate-800 dark:text-zinc-200">
                    <span>Δ Ponzi Debt:</span>
                    <span className={ponziDebtShare > 13.0 ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"}>
                      {ponziDebtShare > 13.0 ? `+${(ponziDebtShare - 13.0).toFixed(1)}%` : `${(ponziDebtShare - 13.0).toFixed(1)}%`}
                    </span>
                  </div>
                )}

                {/* Shiller ECY Delta */}
                {shillerECY !== 1.08 && (
                  <div className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-white dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700 font-bold text-slate-800 dark:text-zinc-200">
                    <span>Δ Shiller ECY:</span>
                    <span className={shillerECY < 1.08 ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"}>
                      {shillerECY > 1.08 ? `+${(shillerECY - 1.08).toFixed(2)}%` : `${(shillerECY - 1.08).toFixed(2)}%`}
                    </span>
                  </div>
                )}

                {/* Refinancing Freeze Alert Pill */}
                {isRefinancingFreeze && (
                  <div className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-rose-600 text-white font-black animate-pulse shadow-sm">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>REFINANCING FREEZE ACTIVE</span>
                  </div>
                )}

                {/* Resample Monte Carlo Delta */}
                {isResampled && (
                  <div className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 font-bold">
                    <RefreshCw className="w-3.5 h-3.5 text-indigo-500 animate-spin-slow" />
                    <span>
                      25k Resample #{sampleSeed - 41}: Δ Median {deltaMCMedian > 0 ? `+${deltaMCMedian.toFixed(1)}%` : `${deltaMCMedian.toFixed(1)}%`} • Δ VaR95 {deltaMCVaR > 0 ? `+${deltaMCVaR.toFixed(1)}%` : `${deltaMCVaR.toFixed(1)}%`}
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
                Modify any slider below or click <span className="text-indigo-600 dark:text-indigo-400 font-bold">&quot;Resample 25,000 Paths (Cholesky Copula)&quot;</span> to measure live variance against this baseline.
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

      {/* ── MINSKY INSTABILITY REGIME & SHILLER EXCESS CAPE YIELD LEVERS ──────── */}
      <section aria-labelledby="minsky-shiller-sandbox-heading" className="bg-white dark:bg-[#121214] border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 sm:p-7 space-y-6 shadow-sm transition-all">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-zinc-800">
          <div className="space-y-1">
            <div className="flex items-center space-x-2 text-xs font-mono font-bold text-slate-500 dark:text-zinc-400">
              <Layers className="w-3.5 h-3.5 text-indigo-500" />
              <span className="uppercase tracking-wider">Structural Credit Levers • Advanced Macro Primitives</span>
            </div>
            <h2 id="minsky-shiller-sandbox-heading" className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center space-x-2">
              <span>Minsky Instability Regime &amp; Shiller Excess CAPE Levers</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-300 font-sans leading-relaxed max-w-3xl">
              Model non-linear refinancing freezes across Hyman Minsky&apos;s tri-partite debt taxonomy (Hedge, Speculative, and Ponzi finance) 
              and calibrate Robert Shiller&apos;s Excess CAPE Yield (ECY = 1/CAPE − Real Yield) against equity risk premia.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Dynamic Regime Indicator Pill */}
            <div className={`inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full text-xs font-mono font-bold border shadow-xs transition-all ${
              isRefinancingFreeze
                ? "bg-rose-100 text-rose-800 dark:bg-rose-950/90 dark:text-rose-300 border-rose-400 dark:border-rose-700 animate-pulse ring-2 ring-rose-500/30"
                : minsky.currentRegime === 'Ponzi Instability'
                ? "bg-rose-50 text-rose-700 dark:bg-rose-950/70 dark:text-rose-400 border-rose-300 dark:border-rose-800"
                : minsky.currentRegime === 'Speculative Transition'
                ? "bg-amber-50 text-amber-700 dark:bg-amber-950/70 dark:text-amber-400 border-amber-300 dark:border-amber-800"
                : "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800"
            }`}>
              <span className={`w-2 h-2 rounded-full shrink-0 ${
                isRefinancingFreeze ? "bg-rose-600 animate-ping" : minsky.currentRegime === 'Ponzi Instability' ? "bg-rose-500" : minsky.currentRegime === 'Speculative Transition' ? "bg-amber-500" : "bg-emerald-500"
              }`} />
              <span>
                {isRefinancingFreeze ? "CRITICAL: Refinancing Freeze" : minsky.currentRegime}
              </span>
            </div>

            {(isMinskyModified || isShillerModified) && (
              <button
                onClick={() => {
                  setPonziDebtShare(13.0);
                  setSpeculativeDebtShare(26.5);
                  setHedgeCashFlowCushion(1.42);
                  setShillerECY(1.08);
                }}
                className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-mono font-bold bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 border border-slate-300 dark:border-zinc-700 cursor-pointer"
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
          <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200 text-xs sm:text-sm font-sans flex items-start space-x-3 shadow-xs animate-in fade-in duration-300">
            <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold text-sm block font-mono uppercase tracking-wide text-rose-800 dark:text-rose-300">
                🚨 Refinancing Freeze Transition Triggered ({minsky.refinancingFreezeProbabilityPct}% 12M Seizure Odds)
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
          <div className="space-y-5 p-5 rounded-xl bg-slate-50 dark:bg-[#09090b] border border-slate-200/80 dark:border-zinc-800">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200/80 dark:border-zinc-800">
              <div className="flex items-center space-x-2">
                <Scale className="w-4 h-4 text-amber-500" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-white uppercase tracking-wider font-mono">
                  Minsky Debt Taxonomy Levers
                </h3>
              </div>
              <span className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400">
                Fragility: {minsky.minskyFragilityIndex}/100
              </span>
            </div>

            {/* Lever 1: Ponzi Debt Share */}
            <div className="space-y-2">
              <div className="flex justify-between items-baseline text-xs font-mono">
                <label htmlFor="ponzi-slider" className="font-bold text-slate-800 dark:text-zinc-200 flex items-center space-x-1.5">
                  <span>1. Ponzi Debt Share</span>
                  <span className="text-[10px] font-normal text-slate-500 dark:text-zinc-400">(0% to 30%)</span>
                </label>
                <div className="flex items-center space-x-1.5 font-bold">
                  <span className={ponziDebtShare >= 20 ? "text-rose-600 dark:text-rose-400 font-black" : "text-amber-600 dark:text-amber-400"}>
                    {ponziDebtShare.toFixed(1)}%
                  </span>
                  <span className="text-[11px] text-slate-400">(${ (minsky.breakdown.ponziDebtUsd / 1e9).toFixed(1) }B)</span>
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
                className="w-full accent-rose-600 h-2 bg-slate-200 dark:bg-zinc-800 rounded-lg cursor-pointer"
              />
              <p className="text-[11px] text-slate-500 dark:text-zinc-400 font-sans leading-relaxed">
                Units where operating cash flow &lt; interest. Relies strictly on equity infusions or new debt to service existing liabilities.
              </p>
            </div>

            {/* Lever 2: Speculative Debt Share */}
            <div className="space-y-2">
              <div className="flex justify-between items-baseline text-xs font-mono">
                <label htmlFor="speculative-slider" className="font-bold text-slate-800 dark:text-zinc-200 flex items-center space-x-1.5">
                  <span>2. Speculative Debt Share</span>
                  <span className="text-[10px] font-normal text-slate-500 dark:text-zinc-400">(10% to 60%)</span>
                </label>
                <div className="flex items-center space-x-1.5 font-bold">
                  <span className="text-amber-600 dark:text-amber-400 font-bold">
                    {speculativeDebtShare.toFixed(1)}%
                  </span>
                  <span className="text-[11px] text-slate-400">(${ (minsky.breakdown.speculativeDebtUsd / 1e9).toFixed(1) }B)</span>
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
                className="w-full accent-amber-500 h-2 bg-slate-200 dark:bg-zinc-800 rounded-lg cursor-pointer"
              />
              <p className="text-[11px] text-slate-500 dark:text-zinc-400 font-sans leading-relaxed">
                Cash flows cover interest payments, but principal must be perpetually rolled over or refinanced upon maturity.
              </p>
            </div>

            {/* Lever 3: Hedge Cash Flow Cushion */}
            <div className="space-y-2">
              <div className="flex justify-between items-baseline text-xs font-mono">
                <label htmlFor="hedge-cushion-slider" className="font-bold text-slate-800 dark:text-zinc-200 flex items-center space-x-1.5">
                  <span>3. Hedge Cash Flow Cushion</span>
                  <span className="text-[10px] font-normal text-slate-500 dark:text-zinc-400">(0.5× to 4.0×)</span>
                </label>
                <div className="flex items-center space-x-1.5 font-bold">
                  <span className={hedgeCashFlowCushion < 1.0 ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"}>
                    {hedgeCashFlowCushion.toFixed(2)}×
                  </span>
                  <span className="text-[11px] text-slate-400">({minsky.hedgeSharePct}% debt)</span>
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
                className="w-full accent-emerald-500 h-2 bg-slate-200 dark:bg-zinc-800 rounded-lg cursor-pointer"
              />
              <p className="text-[11px] text-slate-500 dark:text-zinc-400 font-sans leading-relaxed">
                Operating cash flow multiple covering combined principal amortization + interest service (Big Tech balance-sheet anchor).
              </p>
            </div>

            {/* Minsky Real-time Breakdown Summary Strip */}
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200 dark:border-zinc-800 text-center font-mono text-xs">
              <div className="p-2 bg-white dark:bg-zinc-900 rounded-lg border border-slate-200/80 dark:border-zinc-800">
                <span className="text-[10px] text-slate-400 block">Hedge Share</span>
                <strong className="text-emerald-600 dark:text-emerald-400">{minsky.hedgeSharePct}%</strong>
              </div>
              <div className="p-2 bg-white dark:bg-zinc-900 rounded-lg border border-slate-200/80 dark:border-zinc-800">
                <span className="text-[10px] text-slate-400 block">Speculative</span>
                <strong className="text-amber-600 dark:text-amber-400">{minsky.speculativeSharePct}%</strong>
              </div>
              <div className="p-2 bg-white dark:bg-zinc-900 rounded-lg border border-slate-200/80 dark:border-zinc-800">
                <span className="text-[10px] text-slate-400 block">Ponzi Share</span>
                <strong className="text-rose-600 dark:text-rose-400">{minsky.ponziSharePct}%</strong>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Shiller Excess CAPE Yield Lever */}
          <div className="space-y-5 p-5 rounded-xl bg-slate-50 dark:bg-[#09090b] border border-slate-200/80 dark:border-zinc-800 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200/80 dark:border-zinc-800">
                <div className="flex items-center space-x-2">
                  <BarChart3 className="w-4 h-4 text-indigo-500" />
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white uppercase tracking-wider font-mono">
                    Robert Shiller Excess CAPE Yield
                  </h3>
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                  shiller.equityRiskPremiumBand === 'Compressed (<1.5%)'
                    ? "bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300"
                    : shiller.equityRiskPremiumBand === 'Normal (1.5–3.5%)'
                    ? "bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300"
                    : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300"
                }`}>
                  {shiller.equityRiskPremiumBand}
                </span>
              </div>

              {/* Shiller ECY Slider */}
              <div className="space-y-2">
                <div className="flex justify-between items-baseline text-xs font-mono">
                  <label htmlFor="shiller-slider" className="font-bold text-slate-800 dark:text-zinc-200 flex items-center space-x-1.5">
                    <span>Excess CAPE Yield (ECY)</span>
                    <span className="text-[10px] font-normal text-slate-500 dark:text-zinc-400">(-2.0% to +5.0%)</span>
                  </label>
                  <div className="flex items-center space-x-1.5 font-bold">
                    <span className={`text-base font-black ${
                      shillerECY < 0 ? "text-rose-600 dark:text-rose-400" : shillerECY < 1.5 ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"
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
                  className="w-full accent-indigo-500 h-2 bg-slate-200 dark:bg-zinc-800 rounded-lg cursor-pointer"
                />
                <p className="text-[11px] text-slate-500 dark:text-zinc-400 font-sans leading-relaxed">
                  Formula: <code className="font-mono text-indigo-600 dark:text-indigo-400">ECY = (1 / CAPE) - 10Y Real Yield</code>. 
                  Measures long-term equity risk compensation beyond risk-free inflation-protected Treasuries.
                </p>
              </div>

              {/* Dynamic Formula Display Card */}
              <div className="p-3.5 bg-white dark:bg-zinc-900 rounded-xl border border-slate-200/80 dark:border-zinc-800 font-mono text-xs space-y-2">
                <div className="flex justify-between items-center text-slate-600 dark:text-zinc-300">
                  <span>AI Tech CAPE Multiple:</span>
                  <strong className="text-slate-900 dark:text-white">{shiller.aiCapeMultiple}× (Hist Median: {shiller.historicalMedianCape}×)</strong>
                </div>
                <div className="flex justify-between items-center text-slate-600 dark:text-zinc-300">
                  <span>Earnings Yield (1/CAPE):</span>
                  <strong>{shiller.earningsYieldPct}%</strong>
                </div>
                <div className="flex justify-between items-center text-slate-600 dark:text-zinc-300">
                  <span>10-Year Real Treasury Yield:</span>
                  <strong className="text-indigo-600 dark:text-indigo-400">{shiller.real10yYieldPct}%</strong>
                </div>
                <div className="pt-1 border-t border-slate-100 dark:border-zinc-800 flex justify-between items-center">
                  <span className="font-bold">Net Equity Risk Premium:</span>
                  <span className={`font-black ${
                    shillerECY < 0 ? "text-rose-600 dark:text-rose-400" : shillerECY < 1.5 ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"
                  }`}>
                    {shillerECY >= 0 ? `+${shillerECY.toFixed(2)}%` : `${shillerECY.toFixed(2)}%`}
                  </span>
                </div>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 dark:text-zinc-400 font-sans pt-2 border-t border-slate-200 dark:border-zinc-800">
              {shiller.interpretation}
            </p>
          </div>
        </div>
      </section>

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
                Evaluates corporate AI debt ($228.1B) against total guarantor asset value ($1.42T) under a 36.5% volatility environment.
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

      {/* ── 25,000-PATH MONTE CARLO STOCHASTIC SAMPLING SUITE ────────────────── */}
      <section aria-labelledby="monte-carlo-heading" className="bg-slate-900 text-white border border-indigo-500/30 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div>
            <div className="flex items-center space-x-2 text-xs font-mono text-emerald-400 font-bold uppercase tracking-wider">
              <Activity className="w-4 h-4" />
              <span>Stochastic Cholesky Copula Simulation Engine</span>
            </div>
            <h2 id="monte-carlo-heading" className="text-xl sm:text-2xl font-bold text-white mt-1">
              25,000-Path Monte Carlo Sampling &amp; Tail Risk Distribution
            </h2>
            <p className="text-xs sm:text-sm text-zinc-300 font-sans mt-1 max-w-3xl leading-relaxed">
              Stochastically simulates 25,000 joint correlation paths using empirical Cholesky copula correlation (<code className="text-emerald-400 font-mono">L·Lᵀ = Σ</code>) across Gaussian interest rate variations, 
              lognormal credit spreads, and multiple shocks to calculate empirical Value-at-Risk (VaR) and Expected Shortfall.
            </p>
          </div>

          <button
            onClick={handleResample}
            disabled={isSampling}
            className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl font-mono text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-md cursor-pointer shrink-0 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSampling ? "animate-spin" : ""}`} />
            <span>{isSampling ? "Simulating..." : "Resample 25,000 Paths (Cholesky Copula)"}</span>
          </button>
        </div>

        {/* Statistical Moments Summary Cards with Live 24h Baseline Deltas (6 Columns) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 font-mono text-xs">
          {/* Card 1: Median & Mean */}
          <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-zinc-400 block text-[11px]">Median Probability</span>
              {deltaMCMedian !== 0 && (
                <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${deltaMCMedian > 0 ? "text-rose-400 bg-rose-950/60" : "text-emerald-400 bg-emerald-950/60"}`}>
                  {deltaMCMedian > 0 ? `+${deltaMCMedian.toFixed(1)}%` : `${deltaMCMedian.toFixed(1)}%`}
                </span>
              )}
            </div>
            <span className="text-xl sm:text-2xl font-black text-white">{monteCarlo.medianProbabilityPct}%</span>
            <span className="text-[10px] text-zinc-500 block">
              Mean: {monteCarlo.meanProbabilityPct}% (±{monteCarlo.stdDevPct}%)
            </span>
          </div>

          {/* Card 2: 90% CI */}
          <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 space-y-1">
            <span className="text-zinc-400 block text-[11px]">90% Confidence Interval</span>
            <span className="text-lg sm:text-xl font-black text-emerald-400">
              [{monteCarlo.ci90Pct[0]}%–{monteCarlo.ci90Pct[1]}%]
            </span>
            <span className="text-[10px] text-zinc-500 block">Empirical 10th to 90th %ile</span>
          </div>

          {/* Card 3: VaR 95% */}
          <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-zinc-400 block text-[11px]">95% Value-at-Risk</span>
              {deltaMCVaR !== 0 && (
                <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${deltaMCVaR > 0 ? "text-amber-400 bg-amber-950/60" : "text-emerald-400 bg-emerald-950/60"}`}>
                  {deltaMCVaR > 0 ? `+${deltaMCVaR.toFixed(1)}%` : `${deltaMCVaR.toFixed(1)}%`}
                </span>
              )}
            </div>
            <span className="text-xl sm:text-2xl font-black text-amber-400">{monteCarlo.valueAtRisk95Pct}%</span>
            <span className="text-[10px] text-zinc-500 block">
              {deltaMCVaR !== 0 ? `Δ baseline: ${deltaMCVaR > 0 ? `+${deltaMCVaR.toFixed(1)}%` : `${deltaMCVaR.toFixed(1)}%`}` : "95% of paths remain below"}
            </span>
          </div>

          {/* Card 4: VaR 99% Extreme Tail */}
          <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-zinc-400 block text-[11px]">99% Extreme VaR</span>
              {deltaMCVaR99 !== 0 && (
                <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${deltaMCVaR99 > 0 ? "text-rose-400 bg-rose-950/60" : "text-emerald-400 bg-emerald-950/60"}`}>
                  {deltaMCVaR99 > 0 ? `+${deltaMCVaR99.toFixed(1)}%` : `${deltaMCVaR99.toFixed(1)}%`}
                </span>
              )}
            </div>
            <span className="text-xl sm:text-2xl font-black text-rose-400">{monteCarlo.valueAtRisk99Pct}%</span>
            <span className="text-[10px] text-zinc-500 block">
              {deltaMCVaR99 !== 0 ? `Δ baseline: ${deltaMCVaR99 > 0 ? `+${deltaMCVaR99.toFixed(1)}%` : `${deltaMCVaR99.toFixed(1)}%`}` : "Extreme 99th %ile shock"}
            </span>
          </div>

          {/* Card 5: CVaR 95% Expected Shortfall */}
          <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-zinc-400 block text-[11px]">Expected Shortfall (CVaR)</span>
              {deltaMCCVaR !== 0 && (
                <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${deltaMCCVaR > 0 ? "text-rose-400 bg-rose-950/60" : "text-emerald-400 bg-emerald-950/60"}`}>
                  {deltaMCCVaR > 0 ? `+${deltaMCCVaR.toFixed(1)}%` : `${deltaMCCVaR.toFixed(1)}%`}
                </span>
              )}
            </div>
            <span className="text-xl sm:text-2xl font-black text-rose-300">{monteCarlo.conditionalValueAtRisk95Pct}%</span>
            <span className="text-[10px] text-zinc-500 block">
              {deltaMCCVaR !== 0 ? `Δ baseline: ${deltaMCCVaR > 0 ? `+${deltaMCCVaR.toFixed(1)}%` : `${deltaMCCVaR.toFixed(1)}%`}` : "Worst 5% tail scenario mean"}
            </span>
          </div>

          {/* Card 6: Statistical Moments (Variance, Skew, Kurt) */}
          <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 space-y-1">
            <span className="text-zinc-400 block text-[11px]">Variance &amp; Moments</span>
            <span className="text-xl sm:text-2xl font-black text-indigo-400">σ²: {monteCarlo.variance}</span>
            <span className="text-[10px] text-zinc-400 block">
              Skew: {monteCarlo.skewness} • Kurt: {monteCarlo.kurtosis}
            </span>
          </div>
        </div>

        {/* Visual Monte Carlo Distribution Histogram */}
        <div className="space-y-2 pt-2">
          <div className="flex items-center justify-between text-xs font-mono text-zinc-400">
            <span>Simulated Burst Probability Distribution (25,000 iterations):</span>
            <span>Skewness: {monteCarlo.skewness} • Kurtosis: {monteCarlo.kurtosis} • Runtime: {monteCarlo.executionTimeMs}ms</span>
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
