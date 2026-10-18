"use client";

import React, { useState, useMemo } from "react";
import { BubbleModelInputs } from "@/lib/model/types";
import { evaluateBubbleModel, DEFAULT_MODEL_INPUTS } from "@/lib/model/engine";
import { RotateCcw, ArrowRight, SlidersHorizontal, Sparkles, TrendingUp, TrendingDown } from "lucide-react";

export function SensitivitySandbox() {
  const [inputs, setInputs] = useState<BubbleModelInputs>(DEFAULT_MODEL_INPUTS);
  const [scenarioName, setScenarioName] = useState<string>("baseline");

  const baselineResult = useMemo(() => evaluateBubbleModel(DEFAULT_MODEL_INPUTS), []);
  const currentResult = useMemo(() => evaluateBubbleModel(inputs), [inputs]);

  const delta = Math.round((currentResult.burstProbability - baselineResult.burstProbability) * 10) / 10;

  // Preset scenarios
  const applyPreset = (preset: "baseline" | "credit_shock" | "soft_landing" | "valuation_drop") => {
    setScenarioName(preset);
    if (preset === "baseline") {
      setInputs(DEFAULT_MODEL_INPUTS);
    } else if (preset === "credit_shock") {
      setInputs({
        ...DEFAULT_MODEL_INPUTS,
        cds: { ...DEFAULT_MODEL_INPUTS.cds!, currentBps: 260 },
        macro: {
          us10yYieldPct: 5.25,
          us10yBaselinePct: 3.75,
          cpiInflationYoY: 3.5,
          fedFundsRatePct: 5.25,
          rateHikeRiskBps: 50,
          realYield10y: 2.65,
          note: "Credit shock rate surge",
        },
        aiDebt: {
          annualDebtIssuanceUsd: 95_000_000_000,
          totalTrackedDebtUsd: 196_822_500_000,
          capexToOcfRatio: 0.65,
          gpuDepreciationDragUsd: 45_000_000_000,
          capexToRevenueMultiple: 12.0,
          note: "Elevated debt reliance",
        },
        ledger: { ...DEFAULT_MODEL_INPUTS.ledger!, debtShare: 0.15 },
        crowd: { ...DEFAULT_MODEL_INPUTS.crowd!, yesProbability: 0.75 },
      });
    } else if (preset === "soft_landing") {
      setInputs({
        ...DEFAULT_MODEL_INPUTS,
        macro: {
          us10yYieldPct: 3.80,
          us10yBaselinePct: 3.75,
          cpiInflationYoY: 2.2,
          fedFundsRatePct: 4.25,
          rateHikeRiskBps: 0,
          realYield10y: 1.65,
          note: "Easing rates & disinflation",
        },
        adoption: {
          ...DEFAULT_MODEL_INPUTS.adoption!,
          apiPriceDeclineMultiple: 90,
          annualUserGrowth: 1.2,
          trainingCostBand: "falling",
        },
        crowd: { ...DEFAULT_MODEL_INPUTS.crowd!, yesProbability: 0.3 },
      });
    } else if (preset === "valuation_drop") {
      setInputs({
        ...DEFAULT_MODEL_INPUTS,
        valuations: DEFAULT_MODEL_INPUTS.valuations!.map((v) => ({
          ...v,
          valuationUsd: (v.runRateRevenueUsd || 1e9) * 18,
        })),
      });
    }
  };

  const currentCds = inputs.cds?.currentBps || 187;
  const currentDebt = Math.round((inputs.ledger?.debtShare ?? 0.07) * 100);
  const currentUs10y = inputs.macro?.us10yYieldPct ?? 4.42;
  const currentAnnualDebtB = Math.round((inputs.aiDebt?.annualDebtIssuanceUsd ?? 85_000_000_000) / 1e9);
  const currentTokenDiscount = inputs.adoption?.apiPriceDeclineMultiple || 40;
  const currentUserGrowth = Math.round((inputs.adoption?.annualUserGrowth || 0.65) * 100);
  const currentOdds = Math.round((inputs.crowd?.yesProbability || 0.54) * 100);

  return (
    <div className="rounded-xl bg-white dark:bg-[#121214] border border-slate-200 dark:border-zinc-800 p-6 sm:p-8 space-y-6 transition-colors shadow-sm">
      {/* Title & Presets */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-slate-200 dark:border-zinc-800">
        <div>
          <div className="flex items-center space-x-2 text-xs font-mono text-slate-500 dark:text-zinc-400">
            <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Interactive Stress Lab</span>
            <span>•</span>
            <span>Real-Time Math Engine</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight mt-0.5">
            Model Sensitivity &amp; Stress Simulator
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-300 font-sans mt-1">
            Drag the empirical levers to evaluate how credit shocks, valuation multiple compressions, or deeper token price deflation alter the odds.
          </p>
        </div>

        {/* Preset Selector */}
        <div className="flex flex-wrap items-center gap-1.5 self-start md:self-auto">
          <button
            onClick={() => applyPreset("baseline")}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors ${
              scenarioName === "baseline"
                ? "bg-slate-900 text-white dark:bg-white dark:text-zinc-950 font-semibold shadow-sm"
                : "bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-zinc-300 hover:bg-slate-200 dark:hover:bg-zinc-700"
            }`}
          >
            Baseline (68.4%)
          </button>
          <button
            onClick={() => applyPreset("credit_shock")}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors ${
              scenarioName === "credit_shock"
                ? "bg-rose-600 text-white font-semibold shadow-sm"
                : "bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-zinc-300 hover:bg-slate-200 dark:hover:bg-zinc-700"
            }`}
          >
            Credit Shock
          </button>
          <button
            onClick={() => applyPreset("soft_landing")}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors ${
              scenarioName === "soft_landing"
                ? "bg-emerald-600 text-white font-semibold shadow-sm"
                : "bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-zinc-300 hover:bg-slate-200 dark:hover:bg-zinc-700"
            }`}
          >
            Soft Landing
          </button>
          <button
            onClick={() => applyPreset("valuation_drop")}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors ${
              scenarioName === "valuation_drop"
                ? "bg-amber-600 text-white font-semibold shadow-sm"
                : "bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-zinc-300 hover:bg-slate-200 dark:hover:bg-zinc-700"
            }`}
          >
            Multiple Compress (18×)
          </button>
        </div>
      </div>

      {/* Main Grid: Controls vs Live Output Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Side: 5 Responsive Sliders */}
        <div className="lg:col-span-7 space-y-5">
          {/* Slider 1: CDS */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-800 dark:text-zinc-200 font-medium">
                Oracle 5Y CDS Spread (Credit Proxy)
              </span>
              <span className="text-slate-900 dark:text-white font-bold font-tabular bg-slate-100 dark:bg-zinc-800 px-2 py-0.5 rounded">
                {currentCds} bp
              </span>
            </div>
            <input
              type="range"
              min="50"
              max="350"
              step="5"
              value={currentCds}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                setScenarioName("custom");
                setInputs({
                  ...inputs,
                  cds: { ...inputs.cds!, currentBps: val },
                });
              }}
              className="w-full accent-rose-500 h-1.5 bg-slate-200 dark:bg-zinc-800 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-xs font-mono font-medium text-slate-500 dark:text-zinc-400">
              <span>81 bp (2024 Baseline)</span>
              <span>187 bp (Current Verified)</span>
              <span>350 bp (Crisis Spike)</span>
            </div>
          </div>

          {/* Slider 2: Debt Share */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-800 dark:text-zinc-200 font-medium">
                Debt Share in Deal Ledger
              </span>
              <span className="text-slate-900 dark:text-white font-bold font-tabular bg-slate-100 dark:bg-zinc-800 px-2 py-0.5 rounded">
                {currentDebt}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="50"
              step="1"
              value={currentDebt}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                setScenarioName("custom");
                setInputs({
                  ...inputs,
                  ledger: { ...inputs.ledger!, debtShare: val / 100 },
                });
              }}
              className="w-full accent-amber-500 h-1.5 bg-slate-200 dark:bg-zinc-800 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-xs font-mono font-medium text-slate-500 dark:text-zinc-400">
              <span>0% Equity-only</span>
              <span className="text-amber-600 dark:text-amber-400 font-bold">7.0% (Current Verified: $197B)</span>
              <span>50% Leveraged</span>
            </div>
          </div>

          {/* Slider 3: US 10-Year Treasury Yield */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-800 dark:text-zinc-200 font-medium">
                US 10-Year Benchmark Yield (US10Y)
              </span>
              <span className="text-slate-900 dark:text-white font-bold font-tabular bg-slate-100 dark:bg-zinc-800 px-2 py-0.5 rounded">
                {currentUs10y.toFixed(2)}%
              </span>
            </div>
            <input
              type="range"
              min="300"
              max="650"
              step="5"
              value={Math.round(currentUs10y * 100)}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10) / 100;
                setScenarioName("custom");
                setInputs({
                  ...inputs,
                  macro: {
                    ...(inputs.macro || {
                      us10yYieldPct: 4.42,
                      us10yBaselinePct: 3.75,
                      cpiInflationYoY: 2.9,
                      fedFundsRatePct: 4.75,
                      rateHikeRiskBps: 25,
                      realYield10y: 2.05,
                      note: "US Treasury 10Y Benchmark",
                    }),
                    us10yYieldPct: val,
                  },
                });
              }}
              className="w-full accent-indigo-500 h-1.5 bg-slate-200 dark:bg-zinc-800 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-xs font-mono font-medium text-slate-500 dark:text-zinc-400">
              <span>3.00% (Accommodative)</span>
              <span className="text-indigo-600 dark:text-indigo-400 font-bold">4.42% (Current Verified)</span>
              <span>6.50% (Liquidity Crunch)</span>
            </div>
          </div>

          {/* Slider 4: Annual AI Debt Issuance Velocity */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-800 dark:text-zinc-200 font-medium">
                Annual AI Debt Issuance Velocity
              </span>
              <span className="text-slate-900 dark:text-white font-bold font-tabular bg-slate-100 dark:bg-zinc-800 px-2 py-0.5 rounded">
                ${currentAnnualDebtB}B/yr
              </span>
            </div>
            <input
              type="range"
              min="10"
              max="140"
              step="2"
              value={currentAnnualDebtB}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                setScenarioName("custom");
                setInputs({
                  ...inputs,
                  aiDebt: {
                    ...(inputs.aiDebt || {
                      annualDebtIssuanceUsd: 85_000_000_000,
                      totalTrackedDebtUsd: 196_822_500_000,
                      capexToOcfRatio: 0.548,
                      gpuDepreciationDragUsd: 38_500_000_000,
                      capexToRevenueMultiple: 8.75,
                      note: "SEC 10-Q Capex vs OCF synthesis",
                    }),
                    annualDebtIssuanceUsd: val * 1e9,
                  },
                });
              }}
              className="w-full accent-rose-500 h-1.5 bg-slate-200 dark:bg-zinc-800 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-xs font-mono font-medium text-slate-500 dark:text-zinc-400">
              <span>$10B/yr (Restrained)</span>
              <span className="text-rose-600 dark:text-rose-400 font-bold">$85B/yr (Current Pace)</span>
              <span>$140B/yr (Extreme Leverage)</span>
            </div>
          </div>

          {/* Slider 5: Token Price Deflation */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-800 dark:text-zinc-200 font-medium">
                Token Inference Cost Drop (Damper Factor)
              </span>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold font-tabular bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-900/60">
                {currentTokenDiscount}× Cheaper
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="100"
              step="1"
              value={currentTokenDiscount}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                setScenarioName("custom");
                setInputs({
                  ...inputs,
                  adoption: {
                    ...inputs.adoption!,
                    apiPriceDeclineMultiple: val,
                  },
                });
              }}
              className="w-full accent-emerald-500 h-1.5 bg-slate-200 dark:bg-zinc-800 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-xs font-mono font-medium text-slate-500 dark:text-zinc-400">
              <span>1× (No Cost Reduction)</span>
              <span>40× (Current Baseline)</span>
              <span>100× (Commoditized Utility)</span>
            </div>
          </div>

          {/* Slider 4: User Growth */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-800 dark:text-zinc-200 font-medium">
                Annual Active User Growth (YoY)
              </span>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold font-tabular bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-900/60">
                +{currentUserGrowth}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="150"
              step="5"
              value={currentUserGrowth}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                setScenarioName("custom");
                setInputs({
                  ...inputs,
                  adoption: {
                    ...inputs.adoption!,
                    annualUserGrowth: val / 100,
                  },
                });
              }}
              className="w-full accent-emerald-500 h-1.5 bg-slate-200 dark:bg-zinc-800 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-xs font-mono font-medium text-slate-500 dark:text-zinc-400">
              <span>0% Stagnant</span>
              <span>+65% (Current Baseline)</span>
              <span>+150% Viral Expansion</span>
            </div>
          </div>

          {/* Slider 5: Prediction Market Odds */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-800 dark:text-zinc-200 font-medium">
                Polymarket Crowd Consensus (Bubble Burst YES)
              </span>
              <span className="text-slate-900 dark:text-white font-bold font-tabular bg-slate-100 dark:bg-zinc-800 px-2 py-0.5 rounded">
                {currentOdds}%
              </span>
            </div>
            <input
              type="range"
              min="10"
              max="90"
              step="1"
              value={currentOdds}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                setScenarioName("custom");
                setInputs({
                  ...inputs,
                  crowd: { ...inputs.crowd!, yesProbability: val / 100 },
                });
              }}
              className="w-full accent-blue-500 h-1.5 bg-slate-200 dark:bg-zinc-800 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-xs font-mono font-medium text-slate-500 dark:text-zinc-400">
              <span>10% Low</span>
              <span>54% (Current Contract)</span>
              <span>90% Consensus Panic</span>
            </div>
          </div>
        </div>

        {/* Right Side: Live Simulator Result Card */}
        <div className="lg:col-span-5 bg-slate-50 dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 rounded-xl p-5 space-y-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-semibold text-slate-700 dark:text-zinc-300 uppercase tracking-wider">
              Simulated Probability
            </span>
            <button
              onClick={() => applyPreset("baseline")}
              className="text-xs font-mono text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white flex items-center space-x-1"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          </div>

          <div className="space-y-2">
            <div className="flex items-baseline space-x-3">
              <span className="font-mono text-5xl sm:text-6xl font-bold tracking-tight text-slate-900 dark:text-white font-tabular">
                {currentResult.burstProbability.toFixed(1)}%
              </span>
              {delta !== 0 && (
                <div
                  className={`flex items-center space-x-1 font-mono text-xs font-bold px-2 py-1 rounded ${
                    delta > 0
                      ? "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200 dark:border-rose-900/60"
                      : "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/60"
                  }`}
                >
                  {delta > 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                  <span>{delta > 0 ? `+${delta}%` : `${delta}%`}</span>
                </div>
              )}
            </div>

            <div className="flex items-center space-x-2 text-xs font-mono text-slate-500 dark:text-zinc-400">
              <span>Composite Score: {currentResult.compositeScore.toFixed(1)} / 100</span>
              <span>•</span>
              <span className="uppercase font-semibold text-slate-700 dark:text-zinc-300">
                {currentResult.band} Band
              </span>
            </div>
          </div>

          {/* Visual Shift Bar */}
          <div className="space-y-1.5 pt-1">
            <div className="flex justify-between text-xs font-mono font-semibold text-slate-600 dark:text-zinc-400">
              <span>Shift from Baseline (68.4%)</span>
              <span>{delta > 0 ? `+${delta}% Risk` : delta < 0 ? `${delta}% Relief` : "Exact Baseline"}</span>
            </div>
            <div className="h-2 w-full bg-slate-200 dark:bg-zinc-800 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  currentResult.burstProbability >= 70
                    ? "bg-rose-500"
                    : currentResult.burstProbability >= 50
                    ? "bg-amber-500"
                    : "bg-emerald-500"
                }`}
                style={{ width: `${Math.min(100, Math.max(5, currentResult.burstProbability))}%` }}
              ></div>
            </div>
          </div>

          {/* Dynamic Sensitivity Insight */}
          <div className="p-3 bg-white dark:bg-[#121214] rounded-lg border border-slate-200 dark:border-zinc-800 text-xs text-slate-600 dark:text-zinc-300 leading-relaxed font-sans">
            {delta > 5 ? (
              <span className="text-rose-600 dark:text-rose-400 font-medium">
                ⚠️ Stress regime: The combination of elevated debt leverage and higher credit spreads pushes the refinancing burden into dangerous territory.
              </span>
            ) : delta < -5 ? (
              <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                ✅ Relief regime: Rapid unit cost deflation and organic user growth convert infrastructure capex into lasting GDP utility, stabilizing the market.
              </span>
            ) : (
              <span>
                ℹ️ Equilibrium regime: Current inputs align closely with the empirical baseline derived from active SEC filings and public disclosures.
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
