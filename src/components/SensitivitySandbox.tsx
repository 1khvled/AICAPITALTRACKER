"use client";

import React, { useState, useMemo } from "react";
import { BubbleModelInputs } from "@/lib/model/types";
import { evaluateBubbleModel, DEFAULT_MODEL_INPUTS } from "@/lib/model/engine";
import {
  RotateCcw,
  SlidersHorizontal,
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  ShieldAlert,
  Flame,
  Zap,
  BarChart2,
  RefreshCw,
  Info,
} from "lucide-react";

export function SensitivitySandbox() {
  const [inputs, setInputs] = useState<BubbleModelInputs>(DEFAULT_MODEL_INPUTS);
  const [scenarioName, setScenarioName] = useState<string>("baseline");

  const baselineResult = useMemo(() => evaluateBubbleModel(DEFAULT_MODEL_INPUTS), []);
  const currentResult = useMemo(() => evaluateBubbleModel(inputs), [inputs]);

  const delta = Math.round((currentResult.burstProbability - baselineResult.burstProbability) * 10) / 10;

  // Baseline calibration values for diffing & resets
  const baseCds = DEFAULT_MODEL_INPUTS.cds?.currentBps || 187;
  const baseDebt = Math.round((DEFAULT_MODEL_INPUTS.ledger?.debtShare ?? 0.07) * 100);
  const baseUs10y = DEFAULT_MODEL_INPUTS.macro?.us10yYieldPct ?? 4.42;
  const baseAnnualDebtB = Math.round((DEFAULT_MODEL_INPUTS.aiDebt?.annualDebtIssuanceUsd ?? 85_000_000_000) / 1e9);
  const baseTokenDiscount = DEFAULT_MODEL_INPUTS.adoption?.apiPriceDeclineMultiple || 40;
  const baseUserGrowth = Math.round((DEFAULT_MODEL_INPUTS.adoption?.annualUserGrowth || 0.65) * 100);
  const baseOdds = Math.round((DEFAULT_MODEL_INPUTS.crowd?.yesProbability || 0.54) * 100);

  // Active current values
  const currentCds = inputs.cds?.currentBps || baseCds;
  const currentDebt = Math.round((inputs.ledger?.debtShare ?? 0.07) * 100);
  const currentUs10y = inputs.macro?.us10yYieldPct ?? baseUs10y;
  const currentAnnualDebtB = Math.round((inputs.aiDebt?.annualDebtIssuanceUsd ?? 85_000_000_000) / 1e9);
  const currentTokenDiscount = inputs.adoption?.apiPriceDeclineMultiple || baseTokenDiscount;
  const currentUserGrowth = Math.round((inputs.adoption?.annualUserGrowth || 0.65) * 100);
  const currentOdds = Math.round((inputs.crowd?.yesProbability || 0.54) * 100);

  // Preset scenarios handler
  const applyPreset = (preset: "baseline" | "credit_freeze" | "capex_spike" | "adoption_breakthrough") => {
    setScenarioName(preset);

    if (preset === "baseline") {
      setInputs(DEFAULT_MODEL_INPUTS);
    } else if (preset === "credit_freeze") {
      setInputs({
        ...DEFAULT_MODEL_INPUTS,
        cds: {
          ...DEFAULT_MODEL_INPUTS.cds!,
          currentBps: 290,
        },
        macro: {
          ...DEFAULT_MODEL_INPUTS.macro!,
          us10yYieldPct: 5.25,
          rateHikeRiskBps: 50,
          realYield10y: 2.75,
        },
        aiDebt: {
          ...DEFAULT_MODEL_INPUTS.aiDebt!,
          annualDebtIssuanceUsd: 125_000_000_000,
          capexToOcfRatio: 0.75,
        },
        ledger: {
          ...DEFAULT_MODEL_INPUTS.ledger!,
          debtShare: 0.20,
        },
        crowd: {
          ...DEFAULT_MODEL_INPUTS.crowd!,
          yesProbability: 0.80,
        },
      });
    } else if (preset === "capex_spike") {
      setInputs({
        ...DEFAULT_MODEL_INPUTS,
        cds: {
          ...DEFAULT_MODEL_INPUTS.cds!,
          currentBps: 235,
        },
        aiDebt: {
          ...DEFAULT_MODEL_INPUTS.aiDebt!,
          annualDebtIssuanceUsd: 135_000_000_000,
          capexToOcfRatio: 0.85,
          capexToRevenueMultiple: 15.0,
        },
        ledger: {
          ...DEFAULT_MODEL_INPUTS.ledger!,
          debtShare: 0.16,
          computeContractShare: 0.38,
        },
        crowd: {
          ...DEFAULT_MODEL_INPUTS.crowd!,
          yesProbability: 0.70,
        },
      });
    } else if (preset === "adoption_breakthrough") {
      setInputs({
        ...DEFAULT_MODEL_INPUTS,
        cds: {
          ...DEFAULT_MODEL_INPUTS.cds!,
          currentBps: 95,
        },
        macro: {
          ...DEFAULT_MODEL_INPUTS.macro!,
          us10yYieldPct: 3.80,
          rateHikeRiskBps: 0,
          realYield10y: 1.50,
        },
        adoption: {
          ...DEFAULT_MODEL_INPUTS.adoption!,
          apiPriceDeclineMultiple: 85,
          annualUserGrowth: 1.25,
          trainingCostBand: "falling",
        },
        ledger: {
          ...DEFAULT_MODEL_INPUTS.ledger!,
          debtShare: 0.04,
        },
        crowd: {
          ...DEFAULT_MODEL_INPUTS.crowd!,
          yesProbability: 0.28,
        },
      });
    }
  };

  // Individual reset helpers
  const resetCds = () => {
    setScenarioName("custom");
    setInputs((prev) => ({
      ...prev,
      cds: { ...prev.cds!, currentBps: baseCds },
    }));
  };

  const resetDebt = () => {
    setScenarioName("custom");
    setInputs((prev) => ({
      ...prev,
      ledger: { ...prev.ledger!, debtShare: baseDebt / 100 },
    }));
  };

  const resetUs10y = () => {
    setScenarioName("custom");
    setInputs((prev) => ({
      ...prev,
      macro: { ...(prev.macro || DEFAULT_MODEL_INPUTS.macro!), us10yYieldPct: baseUs10y },
    }));
  };

  const resetAnnualDebt = () => {
    setScenarioName("custom");
    setInputs((prev) => ({
      ...prev,
      aiDebt: { ...(prev.aiDebt || DEFAULT_MODEL_INPUTS.aiDebt!), annualDebtIssuanceUsd: baseAnnualDebtB * 1e9 },
    }));
  };

  const resetTokenDiscount = () => {
    setScenarioName("custom");
    setInputs((prev) => ({
      ...prev,
      adoption: { ...prev.adoption!, apiPriceDeclineMultiple: baseTokenDiscount },
    }));
  };

  const resetUserGrowth = () => {
    setScenarioName("custom");
    setInputs((prev) => ({
      ...prev,
      adoption: { ...prev.adoption!, annualUserGrowth: baseUserGrowth / 100 },
    }));
  };

  const resetOdds = () => {
    setScenarioName("custom");
    setInputs((prev) => ({
      ...prev,
      crowd: { ...prev.crowd!, yesProbability: baseOdds / 100 },
    }));
  };

  const bandStyles: Record<string, { label: string; badge: string; text: string }> = {
    critical: {
      label: "Critical Stress",
      badge: "bg-rose-100 text-rose-800 dark:bg-rose-950/70 dark:text-rose-300 border-rose-300 dark:border-rose-800",
      text: "text-rose-600 dark:text-rose-400",
    },
    high: {
      label: "High Stress",
      badge: "bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 border-rose-200 dark:border-rose-900/80",
      text: "text-rose-600 dark:text-rose-400",
    },
    elevated: {
      label: "Elevated Risk",
      badge: "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border-amber-200 dark:border-amber-900/80",
      text: "text-amber-600 dark:text-amber-400",
    },
    guarded: {
      label: "Guarded",
      badge: "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400 border-blue-200 dark:border-blue-900/80",
      text: "text-blue-600 dark:text-blue-400",
    },
    calm: {
      label: "Low Risk",
      badge: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/80",
      text: "text-emerald-600 dark:text-emerald-400",
    },
  };

  const activeBand = bandStyles[currentResult.band] || bandStyles.high;

  return (
    <div className="rounded-2xl bg-white dark:bg-[#121214] border border-slate-200 dark:border-zinc-800 p-6 sm:p-8 space-y-7 transition-colors shadow-sm">
      {/* Title & Scenario Preset Buttons */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5 pb-6 border-b border-slate-200 dark:border-zinc-800">
        <div>
          <div className="flex items-center space-x-2 text-xs font-mono font-bold text-slate-500 dark:text-zinc-400">
            <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span className="uppercase tracking-wider">Institutional Stress Lab</span>
            <span>•</span>
            <span>Live Transparent Engine</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight mt-1">
            Model Sensitivity &amp; Stress Simulator
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-300 font-sans mt-1 max-w-2xl leading-relaxed">
            Test macroeconomic credit shocks, debt volume surges, token deflation dampers, or prediction crowd sentiment 
            to evaluate immediate non-linear shifts in 12-month burst probability.
          </p>
        </div>

        {/* 4 Required Scenario Preset Buttons */}
        <div className="flex flex-wrap items-center gap-2 self-start lg:self-auto">
          <button
            onClick={() => applyPreset("baseline")}
            className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold transition-all flex items-center space-x-1.5 border ${
              scenarioName === "baseline"
                ? "bg-slate-900 text-white dark:bg-white dark:text-zinc-950 border-slate-900 dark:border-white shadow-sm"
                : "bg-slate-50 text-slate-700 dark:bg-zinc-900 dark:text-zinc-300 border-slate-200 dark:border-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-800"
            }`}
          >
            <RotateCcw className="w-3 h-3" />
            <span>Baseline Calibration</span>
          </button>

          <button
            onClick={() => applyPreset("credit_freeze")}
            className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold transition-all flex items-center space-x-1.5 border ${
              scenarioName === "credit_freeze"
                ? "bg-rose-600 text-white border-rose-600 shadow-sm"
                : "bg-slate-50 text-slate-700 dark:bg-zinc-900 dark:text-zinc-300 border-slate-200 dark:border-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-rose-600 dark:hover:text-rose-400"
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-rose-500" />
            <span>AI Credit Freeze</span>
          </button>

          <button
            onClick={() => applyPreset("capex_spike")}
            className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold transition-all flex items-center space-x-1.5 border ${
              scenarioName === "capex_spike"
                ? "bg-amber-600 text-white border-amber-600 shadow-sm"
                : "bg-slate-50 text-slate-700 dark:bg-zinc-900 dark:text-zinc-300 border-slate-200 dark:border-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-amber-600 dark:hover:text-amber-400"
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            <span>Hyperscaler Capex Spike</span>
          </button>

          <button
            onClick={() => applyPreset("adoption_breakthrough")}
            className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold transition-all flex items-center space-x-1.5 border ${
              scenarioName === "adoption_breakthrough"
                ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                : "bg-slate-50 text-slate-700 dark:bg-zinc-900 dark:text-zinc-300 border-slate-200 dark:border-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-emerald-600 dark:hover:text-emerald-400"
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Adoption Breakthrough</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Dual Slider Controls vs Real-Time Result Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Side: 7 Institutional Financial Sliders with Dual Numerical Inputs */}
        <div className="lg:col-span-7 space-y-6">
          {/* Slider 1: Oracle 5Y CDS */}
          <div className="bg-slate-50/70 dark:bg-[#09090b] border border-slate-200/80 dark:border-zinc-800 rounded-xl p-4 space-y-2.5">
            <div className="flex items-center justify-between text-xs font-mono">
              <div className="flex items-center space-x-2">
                <span className="font-bold text-slate-800 dark:text-zinc-200">
                  Oracle 5Y CDS Spread (Credit Risk Proxy)
                </span>
                {currentCds !== baseCds && (
                  <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400">
                    ({currentCds > baseCds ? `+${currentCds - baseCds} bp` : `${currentCds - baseCds} bp`})
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-1.5">
                <input
                  type="number"
                  min="50"
                  max="400"
                  step="5"
                  value={currentCds}
                  onChange={(e) => {
                    const val = Math.max(50, Math.min(400, parseInt(e.target.value, 10) || baseCds));
                    setScenarioName("custom");
                    setInputs({ ...inputs, cds: { ...inputs.cds!, currentBps: val } });
                  }}
                  className="w-16 px-2 py-1 text-right font-mono font-bold text-xs bg-white dark:bg-[#121214] border border-slate-300 dark:border-zinc-700 rounded text-slate-900 dark:text-white"
                />
                <span className="text-slate-500 dark:text-zinc-400 font-bold">bp</span>
                {currentCds !== baseCds && (
                  <button
                    onClick={resetCds}
                    title="Reset to baseline"
                    className="p-1 text-slate-400 hover:text-slate-800 dark:hover:text-white"
                  >
                    <RotateCcw className="w-3 h-3" />
                  </button>
                )}
              </div>
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
                setInputs({ ...inputs, cds: { ...inputs.cds!, currentBps: val } });
              }}
              className="w-full accent-rose-500 h-2 bg-slate-200 dark:bg-zinc-800 rounded-lg cursor-pointer"
            />

            <div className="flex justify-between text-[11px] font-mono text-slate-500 dark:text-zinc-400">
              <span>81 bp (2024 Baseline)</span>
              <span className="font-bold text-slate-700 dark:text-zinc-300">187 bp (Baseline)</span>
              <span>350 bp (Crisis Spike)</span>
            </div>
          </div>

          {/* Slider 2: Debt Share in Deal Ledger */}
          <div className="bg-slate-50/70 dark:bg-[#09090b] border border-slate-200/80 dark:border-zinc-800 rounded-xl p-4 space-y-2.5">
            <div className="flex items-center justify-between text-xs font-mono">
              <div className="flex items-center space-x-2">
                <span className="font-bold text-slate-800 dark:text-zinc-200">
                  Debt &amp; Convertible Share in Deal Ledger
                </span>
                {currentDebt !== baseDebt && (
                  <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400">
                    ({currentDebt > baseDebt ? `+${currentDebt - baseDebt}%` : `${currentDebt - baseDebt}%`})
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-1.5">
                <input
                  type="number"
                  min="0"
                  max="50"
                  step="1"
                  value={currentDebt}
                  onChange={(e) => {
                    const val = Math.max(0, Math.min(50, parseInt(e.target.value, 10) || 0));
                    setScenarioName("custom");
                    setInputs({ ...inputs, ledger: { ...inputs.ledger!, debtShare: val / 100 } });
                  }}
                  className="w-14 px-2 py-1 text-right font-mono font-bold text-xs bg-white dark:bg-[#121214] border border-slate-300 dark:border-zinc-700 rounded text-slate-900 dark:text-white"
                />
                <span className="text-slate-500 dark:text-zinc-400 font-bold">%</span>
                {currentDebt !== baseDebt && (
                  <button
                    onClick={resetDebt}
                    title="Reset to baseline"
                    className="p-1 text-slate-400 hover:text-slate-800 dark:hover:text-white"
                  >
                    <RotateCcw className="w-3 h-3" />
                  </button>
                )}
              </div>
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
                setInputs({ ...inputs, ledger: { ...inputs.ledger!, debtShare: val / 100 } });
              }}
              className="w-full accent-amber-500 h-2 bg-slate-200 dark:bg-zinc-800 rounded-lg cursor-pointer"
            />

            <div className="flex justify-between text-[11px] font-mono text-slate-500 dark:text-zinc-400">
              <span>0% (Equity-only)</span>
              <span className="font-bold text-amber-600 dark:text-amber-400">7.0% ($197B Baseline)</span>
              <span>50% (High Leverage)</span>
            </div>
          </div>

          {/* Slider 3: US 10-Year Benchmark Treasury Yield */}
          <div className="bg-slate-50/70 dark:bg-[#09090b] border border-slate-200/80 dark:border-zinc-800 rounded-xl p-4 space-y-2.5">
            <div className="flex items-center justify-between text-xs font-mono">
              <div className="flex items-center space-x-2">
                <span className="font-bold text-slate-800 dark:text-zinc-200">
                  US 10-Year Benchmark Treasury Yield (US10Y)
                </span>
                {Math.abs(currentUs10y - baseUs10y) > 0.01 && (
                  <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
                    ({currentUs10y > baseUs10y ? `+${(currentUs10y - baseUs10y).toFixed(2)}%` : `${(currentUs10y - baseUs10y).toFixed(2)}%`})
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-1.5">
                <input
                  type="number"
                  min="2.5"
                  max="7.0"
                  step="0.05"
                  value={currentUs10y}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) || baseUs10y;
                    setScenarioName("custom");
                    setInputs({
                      ...inputs,
                      macro: { ...(inputs.macro || DEFAULT_MODEL_INPUTS.macro!), us10yYieldPct: val },
                    });
                  }}
                  className="w-16 px-2 py-1 text-right font-mono font-bold text-xs bg-white dark:bg-[#121214] border border-slate-300 dark:border-zinc-700 rounded text-slate-900 dark:text-white"
                />
                <span className="text-slate-500 dark:text-zinc-400 font-bold">%</span>
                {Math.abs(currentUs10y - baseUs10y) > 0.01 && (
                  <button
                    onClick={resetUs10y}
                    title="Reset to baseline"
                    className="p-1 text-slate-400 hover:text-slate-800 dark:hover:text-white"
                  >
                    <RotateCcw className="w-3 h-3" />
                  </button>
                )}
              </div>
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
                  macro: { ...(inputs.macro || DEFAULT_MODEL_INPUTS.macro!), us10yYieldPct: val },
                });
              }}
              className="w-full accent-indigo-500 h-2 bg-slate-200 dark:bg-zinc-800 rounded-lg cursor-pointer"
            />

            <div className="flex justify-between text-[11px] font-mono text-slate-500 dark:text-zinc-400">
              <span>3.00% (Accommodative)</span>
              <span className="font-bold text-indigo-600 dark:text-indigo-400">4.42% (Baseline)</span>
              <span>6.50% (Liquidity Freeze)</span>
            </div>
          </div>

          {/* Slider 4: Annual AI Debt Issuance Velocity */}
          <div className="bg-slate-50/70 dark:bg-[#09090b] border border-slate-200/80 dark:border-zinc-800 rounded-xl p-4 space-y-2.5">
            <div className="flex items-center justify-between text-xs font-mono">
              <div className="flex items-center space-x-2">
                <span className="font-bold text-slate-800 dark:text-zinc-200">
                  Annual Dedicated AI Debt Issuance Pace
                </span>
                {currentAnnualDebtB !== baseAnnualDebtB && (
                  <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400">
                    ({currentAnnualDebtB > baseAnnualDebtB ? `+$${currentAnnualDebtB - baseAnnualDebtB}B` : `-$${baseAnnualDebtB - currentAnnualDebtB}B`})
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-1.5">
                <input
                  type="number"
                  min="10"
                  max="160"
                  step="2"
                  value={currentAnnualDebtB}
                  onChange={(e) => {
                    const val = Math.max(10, Math.min(160, parseInt(e.target.value, 10) || baseAnnualDebtB));
                    setScenarioName("custom");
                    setInputs({
                      ...inputs,
                      aiDebt: { ...(inputs.aiDebt || DEFAULT_MODEL_INPUTS.aiDebt!), annualDebtIssuanceUsd: val * 1e9 },
                    });
                  }}
                  className="w-16 px-2 py-1 text-right font-mono font-bold text-xs bg-white dark:bg-[#121214] border border-slate-300 dark:border-zinc-700 rounded text-slate-900 dark:text-white"
                />
                <span className="text-slate-500 dark:text-zinc-400 font-bold">$B/yr</span>
                {currentAnnualDebtB !== baseAnnualDebtB && (
                  <button
                    onClick={resetAnnualDebt}
                    title="Reset to baseline"
                    className="p-1 text-slate-400 hover:text-slate-800 dark:hover:text-white"
                  >
                    <RotateCcw className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            <input
              type="range"
              min="10"
              max="150"
              step="2"
              value={currentAnnualDebtB}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                setScenarioName("custom");
                setInputs({
                  ...inputs,
                  aiDebt: { ...(inputs.aiDebt || DEFAULT_MODEL_INPUTS.aiDebt!), annualDebtIssuanceUsd: val * 1e9 },
                });
              }}
              className="w-full accent-rose-500 h-2 bg-slate-200 dark:bg-zinc-800 rounded-lg cursor-pointer"
            />

            <div className="flex justify-between text-[11px] font-mono text-slate-500 dark:text-zinc-400">
              <span>$10B/yr (Restrained)</span>
              <span className="font-bold text-rose-600 dark:text-rose-400">$85B/yr (Baseline)</span>
              <span>$150B/yr (Leveraged Surge)</span>
            </div>
          </div>

          {/* Slider 5: Token Price Deflation */}
          <div className="bg-slate-50/70 dark:bg-[#09090b] border border-slate-200/80 dark:border-zinc-800 rounded-xl p-4 space-y-2.5">
            <div className="flex items-center justify-between text-xs font-mono">
              <div className="flex items-center space-x-2">
                <span className="font-bold text-slate-800 dark:text-zinc-200">
                  Token Inference Cost Reduction (Stabilizing Damper)
                </span>
                {currentTokenDiscount !== baseTokenDiscount && (
                  <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                    ({currentTokenDiscount > baseTokenDiscount ? `+${currentTokenDiscount - baseTokenDiscount}×` : `${currentTokenDiscount - baseTokenDiscount}×`})
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-1.5">
                <input
                  type="number"
                  min="1"
                  max="120"
                  step="1"
                  value={currentTokenDiscount}
                  onChange={(e) => {
                    const val = Math.max(1, Math.min(120, parseInt(e.target.value, 10) || baseTokenDiscount));
                    setScenarioName("custom");
                    setInputs({
                      ...inputs,
                      adoption: { ...inputs.adoption!, apiPriceDeclineMultiple: val },
                    });
                  }}
                  className="w-14 px-2 py-1 text-right font-mono font-bold text-xs bg-white dark:bg-[#121214] border border-slate-300 dark:border-zinc-700 rounded text-slate-900 dark:text-white"
                />
                <span className="text-slate-500 dark:text-zinc-400 font-bold">×</span>
                {currentTokenDiscount !== baseTokenDiscount && (
                  <button
                    onClick={resetTokenDiscount}
                    title="Reset to baseline"
                    className="p-1 text-slate-400 hover:text-slate-800 dark:hover:text-white"
                  >
                    <RotateCcw className="w-3 h-3" />
                  </button>
                )}
              </div>
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
                  adoption: { ...inputs.adoption!, apiPriceDeclineMultiple: val },
                });
              }}
              className="w-full accent-emerald-500 h-2 bg-slate-200 dark:bg-zinc-800 rounded-lg cursor-pointer"
            />

            <div className="flex justify-between text-[11px] font-mono text-slate-500 dark:text-zinc-400">
              <span>1× (No Price Drop)</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">40× (Baseline)</span>
              <span>100× (Mass Commodity)</span>
            </div>
          </div>

          {/* Slider 6: User Growth */}
          <div className="bg-slate-50/70 dark:bg-[#09090b] border border-slate-200/80 dark:border-zinc-800 rounded-xl p-4 space-y-2.5">
            <div className="flex items-center justify-between text-xs font-mono">
              <div className="flex items-center space-x-2">
                <span className="font-bold text-slate-800 dark:text-zinc-200">
                  Annual Consumer &amp; Enterprise User Growth (YoY)
                </span>
                {currentUserGrowth !== baseUserGrowth && (
                  <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                    ({currentUserGrowth > baseUserGrowth ? `+${currentUserGrowth - baseUserGrowth}%` : `${currentUserGrowth - baseUserGrowth}%`})
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-1.5">
                <input
                  type="number"
                  min="0"
                  max="150"
                  step="5"
                  value={currentUserGrowth}
                  onChange={(e) => {
                    const val = Math.max(0, Math.min(150, parseInt(e.target.value, 10) || 0));
                    setScenarioName("custom");
                    setInputs({
                      ...inputs,
                      adoption: { ...inputs.adoption!, annualUserGrowth: val / 100 },
                    });
                  }}
                  className="w-14 px-2 py-1 text-right font-mono font-bold text-xs bg-white dark:bg-[#121214] border border-slate-300 dark:border-zinc-700 rounded text-slate-900 dark:text-white"
                />
                <span className="text-slate-500 dark:text-zinc-400 font-bold">%</span>
                {currentUserGrowth !== baseUserGrowth && (
                  <button
                    onClick={resetUserGrowth}
                    title="Reset to baseline"
                    className="p-1 text-slate-400 hover:text-slate-800 dark:hover:text-white"
                  >
                    <RotateCcw className="w-3 h-3" />
                  </button>
                )}
              </div>
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
                  adoption: { ...inputs.adoption!, annualUserGrowth: val / 100 },
                });
              }}
              className="w-full accent-emerald-500 h-2 bg-slate-200 dark:bg-zinc-800 rounded-lg cursor-pointer"
            />

            <div className="flex justify-between text-[11px] font-mono text-slate-500 dark:text-zinc-400">
              <span>0% (Stagnant)</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">+65% (Baseline)</span>
              <span>+150% (Exponential)</span>
            </div>
          </div>

          {/* Slider 7: Prediction Market Odds */}
          <div className="bg-slate-50/70 dark:bg-[#09090b] border border-slate-200/80 dark:border-zinc-800 rounded-xl p-4 space-y-2.5">
            <div className="flex items-center justify-between text-xs font-mono">
              <div className="flex items-center space-x-2">
                <span className="font-bold text-slate-800 dark:text-zinc-200">
                  Polymarket Crowd Consensus (Bubble Burst YES Odds)
                </span>
                {currentOdds !== baseOdds && (
                  <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400">
                    ({currentOdds > baseOdds ? `+${currentOdds - baseOdds}%` : `${currentOdds - baseOdds}%`})
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-1.5">
                <input
                  type="number"
                  min="10"
                  max="90"
                  step="1"
                  value={currentOdds}
                  onChange={(e) => {
                    const val = Math.max(10, Math.min(90, parseInt(e.target.value, 10) || baseOdds));
                    setScenarioName("custom");
                    setInputs({
                      ...inputs,
                      crowd: { ...inputs.crowd!, yesProbability: val / 100 },
                    });
                  }}
                  className="w-14 px-2 py-1 text-right font-mono font-bold text-xs bg-white dark:bg-[#121214] border border-slate-300 dark:border-zinc-700 rounded text-slate-900 dark:text-white"
                />
                <span className="text-slate-500 dark:text-zinc-400 font-bold">%</span>
                {currentOdds !== baseOdds && (
                  <button
                    onClick={resetOdds}
                    title="Reset to baseline"
                    className="p-1 text-slate-400 hover:text-slate-800 dark:hover:text-white"
                  >
                    <RotateCcw className="w-3 h-3" />
                  </button>
                )}
              </div>
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
              className="w-full accent-blue-500 h-2 bg-slate-200 dark:bg-zinc-800 rounded-lg cursor-pointer"
            />

            <div className="flex justify-between text-[11px] font-mono text-slate-500 dark:text-zinc-400">
              <span>10% (Complacency)</span>
              <span className="font-bold text-blue-600 dark:text-blue-400">54% (Baseline)</span>
              <span>90% (Consensus Panic)</span>
            </div>
          </div>
        </div>

        {/* Right Side: Live Simulator Result Card with Real-Time Delta Badges */}
        <div className="lg:col-span-5 bg-slate-50 dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 sm:p-7 space-y-6 sticky top-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-zinc-800">
            <div>
              <span className="text-xs font-mono font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-wider block">
                Simulated Burst Probability
              </span>
              <span className="text-[11px] font-mono text-slate-500 dark:text-zinc-400">
                12-Month Real-Time Evaluation
              </span>
            </div>
            <button
              onClick={() => applyPreset("baseline")}
              className="text-xs font-mono font-bold text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white flex items-center space-x-1.5 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-zinc-800 hover:bg-white dark:hover:bg-zinc-800 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset All</span>
            </button>
          </div>

          {/* Primary Simulated Metric & Dynamic Delta Badge */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-baseline gap-3">
              <span className="font-mono text-6xl sm:text-7xl font-black tracking-tight text-slate-900 dark:text-white tabular-nums">
                {currentResult.burstProbability.toFixed(1)}%
              </span>

              {/* Dynamic Real-Time Delta Badge */}
              {delta !== 0 ? (
                <div
                  className={`inline-flex items-center space-x-1.5 font-mono text-xs sm:text-sm font-black px-3 py-1.5 rounded-xl border shadow-xs ${
                    delta > 0
                      ? "bg-rose-50 text-rose-700 dark:bg-rose-950/70 dark:text-rose-300 border-rose-300 dark:border-rose-800"
                      : "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800"
                  }`}
                >
                  {delta > 0 ? (
                    <TrendingUp className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  )}
                  <span>
                    {delta > 0 ? `+${delta.toFixed(1)}% STRESS SURGE` : `${delta.toFixed(1)}% RISK RELIEF`}
                  </span>
                </div>
              ) : (
                <div className="inline-flex items-center space-x-1 font-mono text-xs font-bold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 border border-slate-300 dark:border-zinc-700">
                  <span>EXACT BASELINE</span>
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs font-mono">
              <span className={`px-2.5 py-0.5 rounded-md font-bold uppercase tracking-wider border ${activeBand.badge}`}>
                {activeBand.label}
              </span>
              <span className="text-slate-400 dark:text-zinc-600">•</span>
              <span className="font-semibold text-slate-700 dark:text-zinc-300">
                Composite: {currentResult.compositeScore.toFixed(1)} / 100
              </span>
              {currentResult.confidenceInterval && (
                <>
                  <span className="text-slate-400 dark:text-zinc-600">•</span>
                  <span className="text-slate-600 dark:text-zinc-400 font-bold">
                    90% CI: [{currentResult.confidenceInterval[0].toFixed(1)}% – {currentResult.confidenceInterval[1].toFixed(1)}%]
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Visual Shift Bar from Baseline */}
          <div className="space-y-2 pt-1">
            <div className="flex justify-between text-xs font-mono font-bold text-slate-700 dark:text-zinc-300">
              <span>Shift vs Baseline (68.4%)</span>
              <span className={delta > 0 ? "text-rose-600 dark:text-rose-400" : delta < 0 ? "text-emerald-600 dark:text-emerald-400" : "text-slate-500"}>
                {delta > 0 ? `+${delta.toFixed(1)}% Risk Expansion` : delta < 0 ? `${delta.toFixed(1)}% Risk Compression` : "Calibrated at 68.4%"}
              </span>
            </div>

            <div className="relative h-3 w-full bg-slate-200 dark:bg-zinc-800 rounded-full overflow-hidden border border-slate-300 dark:border-zinc-700 p-0.5">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  currentResult.burstProbability >= 80
                    ? "bg-rose-600"
                    : currentResult.burstProbability >= 65
                    ? "bg-rose-500"
                    : currentResult.burstProbability >= 45
                    ? "bg-amber-500"
                    : "bg-emerald-500"
                }`}
                style={{ width: `${Math.min(100, Math.max(5, currentResult.burstProbability))}%` }}
              />
            </div>
          </div>

          {/* Macro Regime Analytical Commentary */}
          <div className="p-4 bg-white dark:bg-[#121214] rounded-xl border border-slate-200 dark:border-zinc-800 text-xs text-slate-700 dark:text-zinc-300 leading-relaxed font-sans space-y-2">
            <div className="flex items-center space-x-1.5 font-mono text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
              <Info className="w-3.5 h-3.5 text-blue-500" />
              <span>Model Regime Transmission Analysis</span>
            </div>

            {delta >= 8 ? (
              <p className="text-rose-600 dark:text-rose-400 font-medium">
                ⚠️ <strong className="font-bold">Severe Credit Crunch Regime:</strong> Surging CDS spreads and higher debt issuance velocity 
                trigger non-linear systemic refinancing contagion. Annual hyperscaler capex outstrips operating cash flow, 
                multiplying counterparty default risk across GPU hardware collateral.
              </p>
            ) : delta > 2 ? (
              <p className="text-amber-600 dark:text-amber-400 font-medium">
                ⚡ <strong className="font-bold">Elevated Multiple Compression:</strong> Rising interest rates and widening credit spreads 
                tighten liquidity conditions for private frontier AI labs, raising financing hurdle rates and putting downward pressure on multiples.
              </p>
            ) : delta <= -8 ? (
              <p className="text-emerald-600 dark:text-emerald-400 font-medium">
                ✅ <strong className="font-bold">Structural Adoption Breakthrough:</strong> Massive inference API cost deflation and organic user monetization 
                rapidly convert heavy infrastructure investments into durable GDP productivity, successfully resolving the capital gap.
              </p>
            ) : delta < -2 ? (
              <p className="text-emerald-600 dark:text-emerald-400 font-medium">
                🌿 <strong className="font-bold">Soft Landing Trajectory:</strong> Modest easing in benchmark yields coupled with healthy double-digit 
                user adoption cushions capital expenditures, stabilizing refinancing markets.
              </p>
            ) : (
              <p>
                ℹ️ <strong className="font-bold">Empirical Baseline Equilibrium:</strong> Sliders are calibrated to active 
                SEC 10-Q corporate disclosures, ICE benchmark CDS settlement spreads, and verified private debt facilities.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
