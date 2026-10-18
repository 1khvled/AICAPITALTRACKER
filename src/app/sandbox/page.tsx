"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { SensitivitySandbox } from "@/components/SensitivitySandbox";
import { SensitivityCurveChart } from "@/components/VisualCharts";
import { AdSlot } from "@/components/AdSlot";
import { DEFAULT_MODEL_INPUTS } from "@/lib/model/engine";
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
  Activity,
  Layers,
  Scale,
} from "lucide-react";

export default function SandboxPage() {
  const [sampleSeed, setSampleSeed] = useState(42);
  const [isSampling, setIsSampling] = useState(false);

  // Compute classical financial models from literature
  const merton = useMemo(() => computeMertonModel(DEFAULT_MODEL_INPUTS), []);
  const altman = useMemo(() => computeAltmanZScore(DEFAULT_MODEL_INPUTS), []);
  const lppls = useMemo(() => computeLpplsMetrics(DEFAULT_MODEL_INPUTS), []);

  // Compute 10,000-Path Monte Carlo Sampling
  const monteCarlo = useMemo(() => {
    return runMonteCarloSimulation(DEFAULT_MODEL_INPUTS, 10_000);
  }, [sampleSeed]);

  const handleResample = () => {
    setIsSampling(true);
    setTimeout(() => {
      setSampleSeed((prev) => prev + 1);
      setIsSampling(false);
    }, 200);
  };

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

      {/* Primary Interactive Sandbox Component */}
      <SensitivitySandbox />

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

        {/* Statistical Moments Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 font-mono text-xs">
          <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 space-y-1">
            <span className="text-zinc-400 block text-[11px]">Median Probability</span>
            <span className="text-2xl font-black text-white">{monteCarlo.medianProbabilityPct}%</span>
            <span className="text-[10px] text-zinc-500 block">Mean: {monteCarlo.meanProbabilityPct}% (±{monteCarlo.stdDevPct}%)</span>
          </div>

          <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 space-y-1">
            <span className="text-zinc-400 block text-[11px]">90% Confidence Interval</span>
            <span className="text-2xl font-black text-emerald-400">
              [{monteCarlo.ci90Pct[0]}% – {monteCarlo.ci90Pct[1]}%]
            </span>
            <span className="text-[10px] text-zinc-500 block">Empirical 10th to 90th %ile</span>
          </div>

          <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 space-y-1">
            <span className="text-zinc-400 block text-[11px]">95% Value-at-Risk (VaR)</span>
            <span className="text-2xl font-black text-amber-400">{monteCarlo.valueAtRisk95Pct}%</span>
            <span className="text-[10px] text-zinc-500 block">95% of paths remain below</span>
          </div>

          <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 space-y-1">
            <span className="text-zinc-400 block text-[11px]">Expected Shortfall (CVaR)</span>
            <span className="text-2xl font-black text-rose-400">{monteCarlo.conditionalValueAtRisk95Pct}%</span>
            <span className="text-[10px] text-zinc-500 block">Mean of worst 5% tail shock</span>
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
