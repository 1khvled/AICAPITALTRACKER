"use client";

import React, { useState, useMemo } from "react";
import { BubbleModelInputs, BubbleModelResult } from "@/lib/model/types";
import { evaluateBubbleModel, DEFAULT_MODEL_INPUTS } from "@/lib/model/engine";
import latestModel from "@/data/latest-model.json";
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

export interface SensitivitySandboxProps {
  onStateChange?: (data: {
    inputs: BubbleModelInputs;
    result: BubbleModelResult;
    baselineResult: BubbleModelResult;
    scenarioName: string;
    delta: number;
  }) => void;
  externalResetTrigger?: number;
}

export function SensitivitySandbox({ onStateChange, externalResetTrigger }: SensitivitySandboxProps = {}) {
  const [inputs, setInputs] = useState<BubbleModelInputs>(DEFAULT_MODEL_INPUTS);
  const [scenarioName, setScenarioName] = useState<string>("baseline");

  const baselineResult = useMemo(() => evaluateBubbleModel(DEFAULT_MODEL_INPUTS), []);
  const currentResult = useMemo(() => evaluateBubbleModel(inputs), [inputs]);

  const delta = Math.round((currentResult.burstProbability - baselineResult.burstProbability) * 10) / 10;

  React.useEffect(() => {
    if (externalResetTrigger !== undefined && externalResetTrigger > 0) {
      setInputs(DEFAULT_MODEL_INPUTS);
      setScenarioName("baseline");
    }
  }, [externalResetTrigger]);

  React.useEffect(() => {
    onStateChange?.({
      inputs,
      result: currentResult,
      baselineResult,
      scenarioName,
      delta,
    });
  }, [inputs, currentResult, baselineResult, scenarioName, delta, onStateChange]);

  // Baseline calibration values for diffing & resets.
  // 2026-10-19 fact-check sweep: the CDS fallback was the stale 187bp (the live
  // 5Y Oracle CDS closed at a record 288bp on 15 Oct 2026), the user-growth
  // fallback was 0.65 (the model input is +50% YoY: 800M Oct 2025 → 1.2B Sep
  // 2026 weekly users, OpenAI DevDay) and the crowd fallback was 0.54.
  //
  // 2026-10-20: every baseline below is read from the LIVE input set the model
  // itself consumes (src/data/live-inputs.json via DEFAULT_MODEL_INPUTS) — the
  // Polymarket leg is the live 8.3% Dec-2026 print (19.5% on Jun-2027) and the
  // US10Y leg is the live 5.14% (FRED DGS10). Nothing here is typed.
  const baseCds = DEFAULT_MODEL_INPUTS.cds?.currentBps ?? 0;
  const baseCdsBaseline = DEFAULT_MODEL_INPUTS.cds?.baselineBps ?? 0;
  // Precise live debt share (7.5%) — the slider control and the model input
  // both run on this value, so the printed reading is never rounded away.
  const baseDebtPct = (DEFAULT_MODEL_INPUTS.ledger?.debtShare ?? 0) * 100;
  const baseTrackedDebtB = ((DEFAULT_MODEL_INPUTS.aiDebt?.totalTrackedDebtUsd ?? 0) / 1e9).toFixed(1);
  const baseUs10y = DEFAULT_MODEL_INPUTS.macro?.us10yYieldPct ?? 0;
  const baseAnnualDebtB = Math.round((DEFAULT_MODEL_INPUTS.aiDebt?.annualDebtIssuanceUsd ?? 0) / 1e9);
  // The published input-basis deflation multiple is pinned at 670× (GPT-4 $30/1M
  // input, Mar 2023 → DeepSeek V4.1 Flash $0.0448/1M, OpenRouter, 19 Oct 2026).
  // The live aggregator's intraday rate swings the raw reading (798× at the
  // 19 Oct 2026 print on a $0.0376 quote); the damper's deflation leg
  // (src/lib/model/factors.ts) saturates at 500×, so the score is identical
  // either way.
  const baseTokenDiscount = DEFAULT_MODEL_INPUTS.adoption?.apiPriceDeclineMultiple ?? 0;
  const baseUserGrowth = Math.round((DEFAULT_MODEL_INPUTS.adoption?.annualUserGrowth ?? 0) * 100);
  // Live crowd snapshot: the scored leg is the Dec-2026 Polymarket contract
  // (8.3% YES); the Jun-2027 contract prints 19.5% and is carried for context.
  const baseOddsPct =
    (DEFAULT_MODEL_INPUTS.crowd?.bubble2026Probability ??
      DEFAULT_MODEL_INPUTS.crowd?.yesProbability ??
      0) * 100;
  const baseOdds2027Pct = (DEFAULT_MODEL_INPUTS.crowd?.bubble2027Probability ?? 0) * 100;
  const baseCapexB = Math.round((DEFAULT_MODEL_INPUTS.capex?.aggregateCapexUsd ?? 0) / 1e9);

  // Active current values
  const currentCds = inputs.cds?.currentBps || baseCds;
  const currentDebt = Math.round((inputs.ledger?.debtShare ?? 0) * 1000) / 10;
  const currentUs10y = inputs.macro?.us10yYieldPct ?? baseUs10y;
  const currentAnnualDebtB = Math.round((inputs.aiDebt?.annualDebtIssuanceUsd ?? 0) / 1e9);
  const currentTokenDiscount = inputs.adoption?.apiPriceDeclineMultiple || baseTokenDiscount;
  const currentUserGrowth = Math.round((inputs.adoption?.annualUserGrowth ?? 0) * 100);
  const currentOdds = Math.round((inputs.crowd?.yesProbability ?? baseOddsPct / 100) * 1000) / 10;

  /** Median price/sales across the labs with a verified run-rate (same basis as /api/v1/model). */
  const medianPsMultiple = (base: BubbleModelInputs): number => {
    const ps = (base.valuations ?? [])
      .filter((v) => v.runRateRevenueUsd !== null && (v.runRateRevenueUsd as number) >= 100_000_000)
      .map((v) => v.valuationUsd / (v.runRateRevenueUsd as number))
      .sort((a, b) => a - b);
    if (ps.length === 0) return 0;
    const mid = Math.floor(ps.length / 2);
    return ps.length % 2 !== 0 ? ps[mid] : (ps[mid - 1] + ps[mid]) / 2;
  };

  // Live median price/sales (computed from the live valuation set).
  const baseMedianPs = medianPsMultiple(DEFAULT_MODEL_INPUTS);

  // 2026-10-19 (round-2 consolidation): the scenario preset set was REBUILT to mirror the
  // sandbox page's published stress table (src/app/sandbox/page.tsx → stressScenarios), which
  // is itself recomputed from the live model inputs at render time. The old presets were pinned
  // to a pre-rebaseline world — CDS 290/235/95bp, debt share 0.20/0.16/0.04, crowd odds
  // 0.80/0.70/0.28, token deflation 85× — levels that no longer exist on the live inputs and that
  // never matched the scenarios the page publishes.
  type PresetId =
    | "baseline"
    | "credit_freeze"
    | "multiple_compression"
    | "capex_retrenchment"
    | "soft_landing";

  const PRESET_META: Record<
    PresetId,
    { label: string; note: string; icon: React.ReactNode; tone: string }
  > = {
    baseline: {
      label: "Baseline Calibration",
      note: `Live verified inputs — CDS ${baseCds} bp · ledger debt share ${baseDebtPct.toFixed(1)}% ($${baseTrackedDebtB}B) · median lab P/S ${baseMedianPs.toFixed(1)}× · token deflation ${baseTokenDiscount}× · crowd odds ${baseOddsPct.toFixed(1)}% (Dec-2026) / ${baseOdds2027Pct.toFixed(1)}% (Jun-2027) · capex $${baseCapexB}B.`,
      icon: <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />,
      tone: "",
    },
    credit_freeze: {
      label: "AI Credit Freeze",
      note: `Credit freeze — CDS blows out to 400 bp (+${400 - baseCds} bp on the live print) and the ledger's borrowed share jumps to 12.0%.`,
      icon: <Flame className="h-3.5 w-3.5 text-risk-700" aria-hidden="true" />,
      tone: "hover:text-risk-700",
    },
    multiple_compression: {
      label: "Multiple Compression",
      note: `Multiple compression — median lab price/sales halves to 15.0× (from ${baseMedianPs.toFixed(1)}×): the 2022-style de-rating of frontier-lab equity.`,
      icon: <TrendingDown className="h-3.5 w-3.5 text-caution-700" aria-hidden="true" />,
      tone: "hover:text-caution-700",
    },
    capex_retrenchment: {
      label: "Capex Retrenchment",
      note: `Capex retrenchment — CY2026 hyperscaler capex cut 20% ($${baseCapexB}B → $${Math.round(baseCapexB * 0.8)}B) with the matching capex/OCF relief (${((DEFAULT_MODEL_INPUTS.aiDebt?.capexToOcfRatio ?? 0) * 100).toFixed(1)}% → ${((DEFAULT_MODEL_INPUTS.aiDebt?.capexToOcfRatio ?? 0) * 80).toFixed(1)}%).`,
      icon: <Zap className="h-3.5 w-3.5 text-caution-700" aria-hidden="true" />,
      tone: "hover:text-caution-700",
    },
    soft_landing: {
      label: "Soft Landing",
      note: `Soft landing — credit normalises to 150 bp (−${baseCds - 150} bp), leverage falls to 5.0%, multiples compress to 20.0× and tokens keep getting cheaper (200×).`,
      icon: <ShieldCheck className="h-3.5 w-3.5 text-safe-700" aria-hidden="true" />,
      tone: "hover:text-safe-700",
    },
  };

  const PRESET_ORDER: PresetId[] = [
    "baseline",
    "credit_freeze",
    "multiple_compression",
    "capex_retrenchment",
    "soft_landing",
  ];

  // Preset scenarios handler
  const applyPreset = (preset: PresetId) => {
    setScenarioName(preset);

    if (preset === "baseline") {
      setInputs(DEFAULT_MODEL_INPUTS);
      return;
    }

    const next = JSON.parse(JSON.stringify(DEFAULT_MODEL_INPUTS)) as BubbleModelInputs;
    const medianPs = medianPsMultiple(DEFAULT_MODEL_INPUTS);
    /** Rescale every tracked lab valuation so the median P/S hits `targetPs`. */
    const compressValuations = (targetPs: number) => {
      const factor = medianPs > 0 ? targetPs / medianPs : 1;
      next.valuations = (next.valuations || []).map((v) => ({
        ...v,
        valuationUsd: v.valuationUsd * factor,
      }));
    };

    if (preset === "credit_freeze") {
      // 2026-10-19 (round-2 consolidation): CDS 290bp → 400bp and debt share 0.20 → 0.12, i.e.
      // the sandbox page's "Credit Freeze / CDS Blowout" scenario (400bp on top of the live print).
      next.cds = { ...next.cds!, currentBps: 400 };
      next.ledger = { ...next.ledger!, debtShare: 0.12 };
    } else if (preset === "multiple_compression") {
      // 2026-10-19 (round-2 consolidation): the sandbox page's "Multiple Compression (15×)" row.
      compressValuations(15);
    } else if (preset === "capex_retrenchment") {
      // 2026-10-19 (round-2 consolidation): the sandbox page's "Capex Retrenchment (−20%)" row —
      // a real 20% cut of the live $725B CY2026 guide ($580B), NOT the old "capex spike" preset
      // that pushed the build-out the wrong way.
      next.capex = {
        ...next.capex!,
        aggregateCapexUsd: Math.round((next.capex?.aggregateCapexUsd ?? 0) * 0.8),
      };
      next.aiDebt = {
        ...next.aiDebt!,
        capexToOcfRatio: (next.aiDebt?.capexToOcfRatio ?? 0.548) * 0.8,
      };
    } else if (preset === "soft_landing") {
      // 2026-10-19 (round-2 consolidation): the sandbox page's "Ubiquitous Soft-Landing" row —
      // credit 150bp, debt share 5.0%, multiples 20×, token deflation 200×.
      next.cds = { ...next.cds!, currentBps: 150 };
      next.ledger = { ...next.ledger!, debtShare: 0.05 };
      compressValuations(20);
      next.adoption = { ...next.adoption!, apiPriceDeclineMultiple: 200 };
    }

    setInputs(next);
  };

  const activePreset: PresetId | null = PRESET_ORDER.includes(scenarioName as PresetId)
    ? (scenarioName as PresetId)
    : null;

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
      // Restores the PRECISE live debt share, not the rounded control value.
      ledger: { ...prev.ledger!, debtShare: baseDebtPct / 100 },
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
      crowd: {
        ...prev.crowd!,
        // The crowd factor scores the 2026 contract leg (bubble2026Probability),
        // so the reset restores BOTH crowd probability fields to the live
        // snapshot — otherwise the lever would appear to move while the model
        // kept reading the untouched contract price.
        yesProbability: baseOddsPct / 100,
        bubble2026Probability: baseOddsPct / 100,
      },
    }));
  };

  const bandStyles: Record<string, { label: string; badge: string; text: string }> = {
    critical: {
      label: "Critical Stress",
      badge: "bg-risk-50 text-risk-700 border-risk-300",
      text: "text-risk-700",
    },
    high: {
      label: "High Stress",
      badge: "bg-risk-50 text-risk-700 border-risk-200",
      text: "text-risk-700",
    },
    elevated: {
      label: "Elevated Risk",
      badge: "bg-caution-50 text-caution-700 border-caution-200",
      text: "text-caution-700",
    },
    guarded: {
      label: "Guarded",
      badge: "bg-surface-2 text-ink-muted border-rule",
      text: "text-ink-muted",
    },
    calm: {
      label: "Low Risk",
      badge: "bg-safe-50 text-safe-700 border-safe-200",
      text: "text-safe-700",
    },
  };

  const activeBand = bandStyles[currentResult.band] || bandStyles.high;

  return (
    <div className="card space-y-7 shadow-card">
      {/* Title & Scenario Preset Buttons */}
      <div className="flex flex-col gap-5 border-b border-rule pb-6 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="label">Stress Simulation Lab</span>
          </div>
          <h2 className="mt-1 text-xl font-bold tracking-tight text-ink">
            Model Sensitivity &amp; Stress Simulator
          </h2>
          <p className="prose mt-1 max-w-2xl text-sm">
            Test macroeconomic credit shocks, debt volume surges, token deflation dampers, or prediction crowd sentiment 
            to evaluate immediate non-linear shifts in 12-month burst probability.
          </p>
        </div>

        {/* 5 scenario presets — the same set the sandbox page's stress table publishes.
            2026-10-19 (round-2 consolidation): the four pre-rebaseline presets were replaced by
            the five live-anchored scenarios (baseline / credit freeze / multiple compression /
            capex retrenchment / soft landing). */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center overflow-x-auto pb-1 max-w-full scrollbar-none gap-2 touch-pan-x sm:flex-wrap">
            {PRESET_ORDER.map((id) => {
              const meta = PRESET_META[id];
              const active = scenarioName === id;
              return (
                <button
                  key={id}
                  onClick={() => applyPreset(id)}
                  aria-pressed={active}
                  className={`btn min-h-11 cursor-pointer active:scale-[0.98] ${active ? "btn-primary" : ""} ${meta.tone}`}
                >
                  {meta.icon}
                  <span>{meta.label}</span>
                </button>
              );
            })}
          </div>
          {activePreset && (
            <p className="max-w-md text-[13px] leading-relaxed text-ink-subtle">
              {PRESET_META[activePreset].note}
            </p>
          )}
        </div>
      </div>

      {/* Main Grid: Dual Slider Controls vs Real-Time Result Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Side: 7 Institutional Financial Sliders with Dual Numerical Inputs */}
        <div className="lg:col-span-7 space-y-6">
          {/* Slider 1: Oracle 5Y CDS */}
          <div className="panel space-y-2.5">
            <div className="flex items-center justify-between text-[14px] font-mono">
              <div className="flex items-center space-x-2">
                <span className="font-bold text-ink">
                  Oracle 5Y CDS Spread (Credit Risk Proxy)
                </span>
                {currentCds !== baseCds && (
                  <span className="text-[14px] font-bold text-risk-700">
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
                  className="num h-11 w-20 rounded-lg border border-rule-strong bg-surface px-2 text-right text-[14px] font-semibold text-ink"
                />
                <span className="text-ink-subtle font-bold">bp</span>
                {currentCds !== baseCds && (
                  <button
                    onClick={resetCds}
                    title="Reset to baseline"
                    className="flex h-11 w-11 items-center justify-center rounded-lg text-ink-subtle hover:bg-surface-2 hover:text-ink"
                  >
                    <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                )}
              </div>
            </div>

            <input
              type="range"
              min="50"
              max="400"
              step="5"
              value={currentCds}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                setScenarioName("custom");
                setInputs({ ...inputs, cds: { ...inputs.cds!, currentBps: val } });
              }}
              className="h-11 w-full cursor-pointer accent-risk-500"
            />

            {/* 2026-10-19 (round-2 consolidation): range max 350 → 400 and the right-hand label
                "350 bp (Crisis Spike)" → "400 bp (Credit Freeze)" — the rebuilt credit-freeze
                preset sets CDS to 400bp, which the old 350bp ceiling could not represent. */}
            <div className="num flex justify-between text-[14px] text-ink-subtle">
              <span>{baseCdsBaseline} bp (long-run norm)</span>
              <span className="font-semibold text-ink-muted">{baseCds} bp (Baseline)</span>
              <span>400 bp (Credit Freeze)</span>
            </div>
          </div>

          {/* Slider 2: Debt Share in Deal Ledger */}
          <div className="panel space-y-2.5">
            <div className="flex items-center justify-between text-[14px] font-mono">
              <div className="flex items-center space-x-2">
                <span className="font-bold text-ink">
                  Debt &amp; Convertible Share in Deal Ledger
                </span>
                {currentDebt !== baseDebtPct && (
                  <span className="text-[14px] font-bold text-caution-700">
                    ({currentDebt > baseDebtPct ? `+${(currentDebt - baseDebtPct).toFixed(1)}%` : `${(currentDebt - baseDebtPct).toFixed(1)}%`})
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-1.5">
                <input
                  type="number"
                  min="0"
                  max="50"
                  step="0.5"
                  value={currentDebt}
                  onChange={(e) => {
                    const val = Math.max(0, Math.min(50, parseFloat(e.target.value) || 0));
                    setScenarioName("custom");
                    setInputs({ ...inputs, ledger: { ...inputs.ledger!, debtShare: val / 100 } });
                  }}
                  className="num h-11 w-16 rounded-lg border border-rule-strong bg-surface px-2 text-right text-[14px] font-semibold text-ink"
                />
                <span className="text-ink-subtle font-bold">%</span>
                {currentDebt !== baseDebtPct && (
                  <button
                    onClick={resetDebt}
                    title="Reset to baseline"
                    className="flex h-11 w-11 items-center justify-center rounded-lg text-ink-subtle hover:bg-surface-2 hover:text-ink"
                  >
                    <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                )}
              </div>
            </div>

            <input
              type="range"
              min="0"
              max="50"
              step="0.5"
              value={currentDebt}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                setScenarioName("custom");
                setInputs({ ...inputs, ledger: { ...inputs.ledger!, debtShare: val / 100 } });
              }}
              className="h-11 w-full cursor-pointer accent-caution-500"
            />

            <div className="num flex justify-between text-[14px] text-ink-subtle">
              <span>0% (Equity-only)</span>
              <span className="font-bold text-caution-700">{baseDebtPct.toFixed(1)}% (${baseTrackedDebtB}B Baseline)</span>
              <span>50% (High Leverage)</span>
            </div>
          </div>

          {/* Slider 3: US 10-Year Benchmark Treasury Yield */}
          <div className="panel space-y-2.5">
            <div className="flex items-center justify-between text-[14px] font-mono">
              <div className="flex items-center space-x-2">
                <span className="font-bold text-ink">
                  US 10-Year Benchmark Treasury Yield (US10Y)
                </span>
                {Math.abs(currentUs10y - baseUs10y) > 0.01 && (
                  <span className="text-[14px] font-bold text-ink-subtle">
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
                  className="num h-11 w-20 rounded-lg border border-rule-strong bg-surface px-2 text-right text-[14px] font-semibold text-ink"
                />
                <span className="text-ink-subtle font-bold">%</span>
                {Math.abs(currentUs10y - baseUs10y) > 0.01 && (
                  <button
                    onClick={resetUs10y}
                    title="Reset to baseline"
                    className="flex h-11 w-11 items-center justify-center rounded-lg text-ink-subtle hover:bg-surface-2 hover:text-ink"
                  >
                    <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
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
              className="h-11 w-full cursor-pointer accent-ink"
            />

            <div className="num flex justify-between text-[14px] text-ink-subtle">
              <span>3.00% (Accommodative)</span>
              <span className="font-bold text-ink-subtle">{baseUs10y.toFixed(2)}% (Baseline)</span>
              <span>6.50% (Liquidity Freeze)</span>
            </div>
          </div>

          {/* Slider 4: Annual AI Debt Issuance Velocity */}
          <div className="panel space-y-2.5">
            <div className="flex items-center justify-between text-[14px] font-mono">
              <div className="flex items-center space-x-2">
                <span className="font-bold text-ink">
                  Annual Dedicated AI Debt Issuance Pace
                </span>
                {currentAnnualDebtB !== baseAnnualDebtB && (
                  <span className="text-[14px] font-bold text-risk-700">
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
                  className="num h-11 w-20 rounded-lg border border-rule-strong bg-surface px-2 text-right text-[14px] font-semibold text-ink"
                />
                <span className="text-ink-subtle font-bold">$B/yr</span>
                {currentAnnualDebtB !== baseAnnualDebtB && (
                  <button
                    onClick={resetAnnualDebt}
                    title="Reset to baseline"
                    className="flex h-11 w-11 items-center justify-center rounded-lg text-ink-subtle hover:bg-surface-2 hover:text-ink"
                  >
                    <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
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
              className="h-11 w-full cursor-pointer accent-risk-500"
            />

            <div className="num flex justify-between text-[14px] text-ink-subtle">
              <span>$10B/yr (Restrained)</span>
              <span className="font-bold text-risk-700">${baseAnnualDebtB}B/yr (Baseline)</span>
              <span>$150B/yr (Leveraged Surge)</span>
            </div>
          </div>

          {/* Slider 5: Token Price Deflation */}
          <div className="panel space-y-2.5">
            <div className="flex items-center justify-between text-[14px] font-mono">
              <div className="flex items-center space-x-2">
                <span className="font-bold text-ink">
                  Token Inference Cost Reduction (Stabilizing Damper)
                </span>
                {currentTokenDiscount !== baseTokenDiscount && (
                  <span className="text-[14px] font-bold text-safe-700">
                    ({currentTokenDiscount > baseTokenDiscount ? `+${currentTokenDiscount - baseTokenDiscount}×` : `${currentTokenDiscount - baseTokenDiscount}×`})
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-1.5">
                <input
                  type="number"
                  min="1"
                  max="700"
                  step="1"
                  value={currentTokenDiscount}
                  onChange={(e) => {
                    const val = Math.max(1, Math.min(700, parseInt(e.target.value, 10) || baseTokenDiscount));
                    setScenarioName("custom");
                    setInputs({
                      ...inputs,
                      adoption: { ...inputs.adoption!, apiPriceDeclineMultiple: val },
                    });
                  }}
                  className="num h-11 w-16 rounded-lg border border-rule-strong bg-surface px-2 text-right text-[14px] font-semibold text-ink"
                />
                <span className="text-ink-subtle font-bold">×</span>
                {currentTokenDiscount !== baseTokenDiscount && (
                  <button
                    onClick={resetTokenDiscount}
                    title="Reset to baseline"
                    className="flex h-11 w-11 items-center justify-center rounded-lg text-ink-subtle hover:bg-surface-2 hover:text-ink"
                  >
                    <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                )}
              </div>
            </div>

            {/* 2026-10-19 (round-2 consolidation): slider ceiling 120×/100× → 700× (and the right
                label "100× (Mass Commodity)" → "700× (Live Print)") — the LIVE baseline is 670×
                and the rebuilt soft-landing preset uses 200×, both of which the old ceiling could
                not represent. The damper itself saturates at 50×; this only widens the control. */}
            <input
              type="range"
              min="1"
              max="700"
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
              className="h-11 w-full cursor-pointer accent-safe-500"
            />

            <div className="num flex justify-between text-[14px] text-ink-subtle">
              <span>1× (No Price Drop)</span>
              <span className="font-bold text-safe-700">{baseTokenDiscount}× (Baseline)</span>
              <span>700× (Slider Ceiling)</span>
            </div>
          </div>

          {/* Slider 6: User Growth */}
          <div className="panel space-y-2.5">
            <div className="flex items-center justify-between text-[14px] font-mono">
              <div className="flex items-center space-x-2">
                <span className="font-bold text-ink">
                  Annual Consumer &amp; Enterprise User Growth (YoY)
                </span>
                {currentUserGrowth !== baseUserGrowth && (
                  <span className="text-[14px] font-bold text-safe-700">
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
                  className="num h-11 w-16 rounded-lg border border-rule-strong bg-surface px-2 text-right text-[14px] font-semibold text-ink"
                />
                <span className="text-ink-subtle font-bold">%</span>
                {currentUserGrowth !== baseUserGrowth && (
                  <button
                    onClick={resetUserGrowth}
                    title="Reset to baseline"
                    className="flex h-11 w-11 items-center justify-center rounded-lg text-ink-subtle hover:bg-surface-2 hover:text-ink"
                  >
                    <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
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
              className="h-11 w-full cursor-pointer accent-safe-500"
            />

            <div className="num flex justify-between text-[14px] text-ink-subtle">
              <span>0% (Stagnant)</span>
              <span className="font-bold text-safe-700">+{baseUserGrowth}% (Baseline)</span>
              <span>+150% (Exponential)</span>
            </div>
          </div>

          {/* Slider 7: Prediction Market Odds */}
          <div className="panel space-y-2.5">
            <div className="flex items-center justify-between text-[14px] font-mono">
              <div className="flex items-center space-x-2">
                <span className="font-bold text-ink">
                  Polymarket Crowd Consensus (Bubble Burst YES Odds)
                </span>
                {currentOdds !== baseOddsPct && (
                  <span className="text-[14px] font-bold text-ink-muted">
                    ({currentOdds > baseOddsPct ? `+${(currentOdds - baseOddsPct).toFixed(1)}%` : `${(currentOdds - baseOddsPct).toFixed(1)}%`})
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-1.5">
                <input
                  type="number"
                  min={1}
                  max="90"
                  step="0.1"
                  value={currentOdds}
                  onChange={(e) => {
                    const val = Math.max(1, Math.min(90, parseFloat(e.target.value) || baseOddsPct));
                    setScenarioName("custom");
                    setInputs({
                      ...inputs,
                      crowd: {
                        ...inputs.crowd!,
                        yesProbability: val / 100,
                        bubble2026Probability: val / 100,
                      },
                    });
                  }}
                  className="num h-11 w-16 rounded-lg border border-rule-strong bg-surface px-2 text-right text-[14px] font-semibold text-ink"
                />
                <span className="text-ink-subtle font-bold">%</span>
                {currentOdds !== baseOddsPct && (
                  <button
                    onClick={resetOdds}
                    title="Reset to baseline"
                    className="flex h-11 w-11 items-center justify-center rounded-lg text-ink-subtle hover:bg-surface-2 hover:text-ink"
                  >
                    <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                )}
              </div>
            </div>

            <input
              type="range"
              min={1}
              max="90"
              step="0.1"
              value={currentOdds}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                setScenarioName("custom");
                setInputs({
                  ...inputs,
                  crowd: {
                    ...inputs.crowd!,
                    yesProbability: val / 100,
                    bubble2026Probability: val / 100,
                  },
                });
              }}
              className="h-11 w-full cursor-pointer accent-ink"
            />

            {/* 2026-10-19 (round-2 consolidation): the baseline label showed the rounded
                integer "9%" — the live crowd reading is carried at two decimals now.
                2026-10-20: the label reads the LIVE Polymarket snapshot (Dec-2026
                contract 8.30%, Jun-2027 contract 19.50%) from src/data/live-inputs.json
                through DEFAULT_MODEL_INPUTS, so it can never drift from the model. */}
            <div className="num flex justify-between text-[14px] text-ink-subtle">
              <span>1% (Floor)</span>
              <span className="font-semibold text-ink-muted">
                {baseOddsPct.toFixed(2)}% (Baseline)
              </span>
              <span>90% (Consensus Panic)</span>
            </div>
            <p className="num text-[14px] leading-relaxed text-ink-subtle">
              Dec-2026 contract {baseOddsPct.toFixed(2)}% · Jun-2027 contract{" "}
              {baseOdds2027Pct.toFixed(2)}% (live Polymarket snapshot).
            </p>
          </div>
        </div>

        {/* Right Side: Live Simulator Result Card with Real-Time Delta Badges */}
        <div className="card sticky top-6 space-y-6 lg:col-span-5">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-rule pb-3">
            <div>
              <span className="label block">Simulated Burst Probability</span>
              <span className="text-[14px] text-ink-subtle">12-Month Real-Time Evaluation</span>
            </div>
            <button
              onClick={() => applyPreset("baseline")}
              className="btn min-h-11 cursor-pointer active:scale-[0.98]"
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Reset All</span>
            </button>
          </div>

          {/* Primary Simulated Metric & Dynamic Delta Badge */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-baseline gap-3">
              <span className="num text-6xl font-semibold tracking-tight text-ink sm:text-7xl">
                {currentResult.burstProbability.toFixed(1)}%
              </span>

              {/* Dynamic Real-Time Delta Badge */}
              {delta !== 0 ? (
                <div
                  className={`chip num text-[13px] sm:text-sm ${delta > 0 ? "chip-risk" : "chip-safe"}`}
                >
                  {delta > 0 ? (
                    <TrendingUp className="w-4 h-4 text-risk-700 shrink-0" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-safe-700 shrink-0" />
                  )}
                  <span>
                    {delta > 0 ? `+${delta.toFixed(1)}% STRESS SURGE` : `${delta.toFixed(1)}% RISK RELIEF`}
                  </span>
                </div>
              ) : (
                <div className="inline-flex items-center space-x-1 font-mono text-[14px] font-bold px-2.5 py-1 rounded-lg bg-surface-2 text-ink-subtle border border-rule-strong">
                  <span>EXACT BASELINE</span>
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1 text-[14px] font-mono">
              <span className={`px-2.5 py-0.5 rounded-md font-bold uppercase tracking-wider border ${activeBand.badge}`}>
                {activeBand.label}
              </span>
              <span className="text-ink-faint">•</span>
              <span className="num font-semibold text-ink-muted">
                Composite: {currentResult.compositeScore.toFixed(1)} / 100
              </span>
              {/*
                2026-10-19 (model v2.6.0): the old 90%-confidence-interval line rendered a
                hand-rolled factor-dispersion band that the engine no longer
                produces. The published range is the Monte-Carlo
                input-sensitivity range of the BASELINE snapshot; it is not
                recomputed for sandboxed inputs, so it is labelled as such.
              */}
              <span className="text-ink-faint">•</span>
              <span className="text-ink-subtle font-bold" title={latestModel.monteCarlo.ciType}>
                Input-sensitivity range (baseline): [{latestModel.monteCarlo.ci95Pct[0].toFixed(1)}% –{" "}
                {latestModel.monteCarlo.ci95Pct[1].toFixed(1)}%]
              </span>
            </div>
          </div>

          {/* Visual Shift Bar from Baseline */}
          <div className="space-y-2 pt-1">
            <div className="flex justify-between text-[14px] font-mono font-bold text-ink-muted">
              <span>Shift vs Baseline ({baselineResult.burstProbability.toFixed(1)}%)</span>
              <span className={delta > 0 ? "text-risk-700" : delta < 0 ? "text-safe-700" : "text-ink-subtle"}>
                {delta > 0 ? `+${delta.toFixed(1)}% Risk Expansion` : delta < 0 ? `${delta.toFixed(1)}% Risk Compression` : `Calibrated at ${baselineResult.burstProbability.toFixed(1)}%`}
              </span>
            </div>

            <div className="relative h-3 w-full overflow-hidden rounded-full bg-surface-3 p-0.5">
              <div
                className={`h-full rounded-full transition-[width] duration-[400ms] ease-out ${
                  currentResult.burstProbability >= 65
                    ? "bg-risk-500"
                    : currentResult.burstProbability >= 45
                    ? "bg-caution-500"
                    : "bg-safe-500"
                }`}
                style={{ width: `${Math.min(100, Math.max(5, currentResult.burstProbability))}%` }}
              />
            </div>
          </div>

          {/* Macro Regime Analytical Commentary */}
          <div className="panel space-y-2 text-[14px] leading-relaxed text-ink-muted">
            <div className="flex items-center space-x-1.5 font-mono text-[13px] font-bold uppercase tracking-wider text-ink-subtle">
              <Info className="h-3.5 w-3.5 text-ink-subtle" aria-hidden="true" />
              <span>Model Regime Transmission Analysis</span>
            </div>

            {delta >= 8 ? (
              <p className="prose text-risk-700">
                <strong>Severe Credit Crunch Regime:</strong> Surging CDS spreads and higher debt issuance velocity 
                trigger non-linear systemic refinancing contagion. Annual hyperscaler capex outstrips operating cash flow, 
                multiplying counterparty default risk across GPU hardware collateral.
              </p>
            ) : delta > 2 ? (
              <p className="prose text-caution-700">
                <strong>Elevated Multiple Compression:</strong> Rising interest rates and widening credit spreads 
                tighten liquidity conditions for private frontier AI labs, raising financing hurdle rates and putting downward pressure on multiples.
              </p>
            ) : delta <= -8 ? (
              <p className="prose text-safe-700">
                <strong>Structural Adoption Breakthrough:</strong> Massive inference API cost deflation and organic user monetization 
                rapidly convert heavy infrastructure investments into durable GDP productivity, successfully resolving the capital gap.
              </p>
            ) : delta < -2 ? (
              <p className="prose text-safe-700">
                <strong>Soft Landing Trajectory:</strong> Modest easing in benchmark yields coupled with healthy double-digit 
                user adoption cushions capital expenditures, stabilizing refinancing markets.
              </p>
            ) : (
              <p>
                <strong>Empirical Baseline Equilibrium:</strong> Sliders are calibrated to active 
                SEC 10-Q corporate disclosures, ICE benchmark CDS settlement spreads, and verified private debt facilities.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
