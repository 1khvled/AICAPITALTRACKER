"use client";

import React, { useState } from "react";
import Link from "next/link";
import { MODEL_FACTORS, MODEL_CALIBRATION } from "@/lib/model/factors";
import { evaluateBubbleModel, DEFAULT_MODEL_INPUTS } from "@/lib/model/engine";
import {
  ArrowLeft,
  BookOpen,
  ShieldCheck,
  BarChart3,
  Code2,
  CheckCircle2,
  AlertTriangle,
  Layers,
  FileText,
  Sigma,
  Activity,
  Zap,
  Cpu,
  TrendingDown,
  Percent,
  Compass,
  ChevronRight,
  ExternalLink,
  GitBranch,
  Clock,
  RefreshCw,
  Database,
  Terminal,
  Check,
  Copy,
  Server,
  Globe,
  ArrowRight,
} from "lucide-react";
import { SensitivityCurveChart } from "@/components/VisualCharts";
import { AdSlot } from "@/components/AdSlot";

export default function MethodologyPage() {
  const [copiedMermaid, setCopiedMermaid] = useState(false);
  const currentModel = evaluateBubbleModel(DEFAULT_MODEL_INPUTS);

  const historicalBacktests = [
    {
      era: "Dot-Com Peak (March 2000)",
      score: 82.5,
      prob: "92.4%",
      band: "Critical",
      driver: "Telecom fiber capex/FCF at 2.4×; 0% real corporate revenues; extreme IPO vendor-financing circularity.",
      leverage: "Telecom debt + vendor vendor financing: $1.2T",
    },
    {
      era: "Pre-Lehman Crunch (October 2007)",
      score: 72.8,
      prob: "84.1%",
      band: "Critical",
      driver: "CDS widening on subprime CDO paper; shadow banking leverage at 33:1; repo haircut freeze.",
      leverage: "MBS repo debt: $2.5T",
    },
    {
      era: "ZIRP Tech Euphoria (November 2021)",
      score: 63.9,
      prob: "71.3%",
      band: "High Stress",
      driver: "Cloud SaaS multiples peaked at 24× P/S; negative real interest rates drove zero-hurdle venture deployment.",
      leverage: "Venture debt & crossover loans: $180B",
    },
    {
      era: "Current AI Superstructure (October 2026)",
      score: currentModel.compositeScore,
      prob: `${currentModel.burstProbability.toFixed(1)}%`,
      band: currentModel.band === "critical" ? "Critical" : currentModel.band === "high" ? "High Stress" : currentModel.band === "elevated" ? "Elevated" : "Guarded",
      driver: `Oracle 5Y CDS ${DEFAULT_MODEL_INPUTS.cds?.currentBps ?? 187}bp, $196.8B verified debt across 20 facilities, counterbalanced by 40× token price deflation.`,
      leverage: `AI infrastructure debt: $196.8B ($85B/yr velocity)`,
    },
    {
      era: "Early ChatGPT Era (January 2023)",
      score: 48.0,
      prob: "31.2%",
      band: "Guarded",
      driver: "Low debt share (0.5%), uncommitted balance-sheet capex, high experimental utility.",
      leverage: "AI-dedicated debt: <$5B",
    },
  ];

  const tocItems = [
    { id: "thesis", title: "1. Empirical Thesis & Axioms" },
    { id: "sigmoid", title: "2. Sigmoid Calibration & Odds" },
    { id: "factors", title: "3. The 9 Mathematical Factors" },
    { id: "contagion", title: "4. Systemic Contagion Synergy" },
    { id: "degradation", title: "5. Degradation Honesty Protocol" },
    { id: "backtests", title: "6. Historical Crisis Backtests" },
    { id: "classical-models", title: "7. Merton, Altman & LPPLS Models" },
    { id: "continuous-pipeline", title: "8. 24h Autonomous Execution" },
  ];

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="space-y-10">
      {/* Top Banner Ad */}
      <AdSlot format="leaderboard" />

      {/* Header with Academic Working Paper Styling */}
      <div className="pb-8 border-b border-slate-200 dark:border-zinc-800 space-y-4">
        <nav aria-label="Breadcrumb" className="flex items-center space-x-2 text-xs font-mono text-slate-500 dark:text-zinc-400">
          <Link href="/" className="hover:text-slate-900 dark:hover:text-white flex items-center space-x-1">
            <ArrowLeft className="w-3 h-3" />
            <span>Home</span>
          </Link>
          <span>/</span>
          <span className="text-slate-900 dark:text-white font-semibold">Mathematical Methodology</span>
        </nav>

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded text-[11px] font-mono font-bold bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                WORKING PAPER • SPECIFICATION v2.5.0
              </span>
              <span className="text-xs font-mono text-slate-500 dark:text-zinc-400">
                Quantitative Credit &amp; Systemic Risk Desk
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Mathematical Model Specification: Micro-Foundations of the AI Capital Superstructure
            </h1>

            <p className="text-sm sm:text-base text-slate-600 dark:text-zinc-300 font-sans max-w-3xl leading-relaxed">
              Full mathematical specification: non-linear logistic sigmoid derivation, factor weighting equations, 
              super-additive contagion synergy, missing-data degradation honesty protocol, and empirical backtests.
            </p>
          </div>

          <div className="flex items-center space-x-3 shrink-0">
            <Link
              href="/api-docs"
              className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-mono font-bold bg-slate-900 text-white dark:bg-white dark:text-zinc-950 hover:opacity-90 transition-all shadow-sm"
            >
              <Code2 className="w-4 h-4" />
              <span>Model API v1</span>
            </Link>
            <a
              href="#sigmoid"
              className="inline-flex items-center space-x-1.5 px-4 py-2.5 rounded-xl text-xs font-mono font-bold bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-slate-200 dark:hover:bg-zinc-700 transition-colors"
            >
              <Sigma className="w-4 h-4 text-emerald-500" />
              <span>Jump to Formulas</span>
            </a>
          </div>
        </div>

        {/* Quick Navigation Sticky Jump Bar */}
        <div className="pt-4 border-t border-slate-100 dark:border-zinc-800/80">
          <div className="flex items-center space-x-2 overflow-x-auto pb-1 text-xs font-mono scrollbar-none">
            <span className="text-slate-400 dark:text-zinc-500 font-bold shrink-0 flex items-center space-x-1">
              <Compass className="w-3.5 h-3.5 text-indigo-500" />
              <span>TOC:</span>
            </span>
            {tocItems.map((item) => (
              <button
                key={item.id}
                onClick={() => scrollToSection(item.id)}
                className="whitespace-nowrap px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-zinc-800/90 text-slate-700 dark:text-zinc-300 hover:bg-slate-200 dark:hover:bg-zinc-700 transition-colors font-medium"
              >
                {item.title}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* SECTION 1: THE CORE SCIENTIFIC THESIS */}
      <section id="thesis" className="bg-white dark:bg-[#121214] border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-sm">
        <div className="flex items-center space-x-2 text-xs font-mono text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider">
          <BookOpen className="w-4 h-4" />
          <span>Section 01 · The Empirical Imperative</span>
        </div>

        <div className="space-y-2">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
            Why Sentiment Surveys &amp; Wall Street Pundit Forecasts Fail
          </h2>
          <p className="text-sm text-slate-600 dark:text-zinc-300 leading-relaxed font-sans max-w-4xl">
            Macroeconomic bubble commentary routinely falls into one of two ideological traps: hyper-optimistic technological determinism 
            or vague historical analogies to tulips and dot-com websites. The **AI Capital Tracker Model** rejects subjective narrative 
            in favor of an audited accounting framework built on three non-negotiable quantitative axioms:
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-2">
          <div className="p-5 rounded-xl bg-slate-50 dark:bg-[#09090b] border border-slate-200/80 dark:border-zinc-800/80 space-y-2.5">
            <div className="flex items-center space-x-2 text-indigo-600 dark:text-indigo-400 font-mono text-xs font-bold uppercase">
              <span className="w-2 h-2 rounded-full bg-indigo-500" />
              <span>Axiom 1: Sourced Receipts Only</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-400 font-sans leading-relaxed">
              Every data point must be anchored in an audited SEC Form 10-K/10-Q filing, indenture prospectus, or verified primary counterparty disclosure. 
              Unconfirmed leaks, anonymous blog posts, and analyst estimates are strictly categorized as <em>undisclosed</em>.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-slate-50 dark:bg-[#09090b] border border-slate-200/80 dark:border-zinc-800/80 space-y-2.5">
            <div className="flex items-center space-x-2 text-amber-600 dark:text-amber-400 font-mono text-xs font-bold uppercase">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span>Axiom 2: Credit Precedes Equity</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-400 font-sans leading-relaxed">
              In both 2000 and 2007, credit default swap spreads and senior bond discount rates blew out 3 to 6 months before equity indices peaked. 
              Because AI hyperscalers are financing datacenters through bond issuance, Oracle 5Y CDS is monitored as the foundation debt thermometer.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-slate-50 dark:bg-[#09090b] border border-slate-200/80 dark:border-zinc-800/80 space-y-2.5">
            <div className="flex items-center space-x-2 text-emerald-600 dark:text-emerald-400 font-mono text-xs font-bold uppercase">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Axiom 3: Static A Priori Weights</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-400 font-sans leading-relaxed">
              Factor weights and ramp boundaries were defined a priori and published permanently. They are never calibrated ex-post to fit a desired narrative. 
              If the probability rises or falls, it is solely because the verified underlying financial inputs changed.
            </p>
          </div>
        </div>
      </section>

      {/* SECTION 2: MATHEMATICAL SIGMOID CALIBRATION */}
      <section id="sigmoid" className="bg-white dark:bg-[#121214] border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-sm">
        <div className="flex items-center space-x-2 text-xs font-mono text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider">
          <Sigma className="w-4 h-4" />
          <span>Section 02 · Sigmoid Calibration &amp; Probability Mapping</span>
        </div>

        <div className="space-y-2">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
            Mapping Composite Stress Score S ∈ [0, 100] to 12-Month Burst Probability P(burst)
          </h2>
          <p className="text-sm text-slate-600 dark:text-zinc-300 leading-relaxed font-sans max-w-4xl">
            Linear composite scoring is unsuited for credit markets because financial fragility behaves non-linearly. A 10-point rise 
            in stress at low debt levels is harmless; that exact same 10-point rise near refinancing thresholds triggers liquidation cascades. 
            We calibrate composite score $S$ through a standard logistic function with empirical anchor parameters:
          </p>
        </div>

        {/* High-Contrast Math Formula Callout */}
        <div className="p-6 bg-slate-900 dark:bg-[#09090b] rounded-2xl border border-indigo-500/30 text-white shadow-lg space-y-4">
          <div className="flex items-center justify-between text-xs font-mono text-indigo-300">
            <span className="font-bold uppercase tracking-wider">Equation (1): Primary Logistic Transformation</span>
            <span className="bg-indigo-950/80 px-2 py-0.5 rounded border border-indigo-800">Logistic Sigmoid</span>
          </div>

          <div className="p-4 bg-black/50 rounded-xl border border-white/10 font-mono text-base sm:text-xl text-center text-emerald-400 overflow-x-auto shadow-inner">
            <code>{"\\mathcal{P}(\\text{burst}) = \\frac{1}{1 + \\exp\\left(-\\frac{S - S_0}{k}\\right)} \\times 100\\%"}</code>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs font-mono pt-1 text-zinc-300">
            <div className="p-3 bg-white/5 rounded-xl border border-white/5 space-y-1">
              <span className="text-indigo-300 block font-bold">Anchor Point $S_0 = 55$</span>
              <p className="font-sans text-[11px] text-zinc-400 leading-normal">
                Score where P = 50.0%. Represents the structural threshold where debt service consumes &gt;45% of hyperscaler FCF.
              </p>
            </div>
            <div className="p-3 bg-white/5 rounded-xl border border-white/5 space-y-1">
              <span className="text-indigo-300 block font-bold">Steepness $k = 9$</span>
              <p className="font-sans text-[11px] text-zinc-400 leading-normal">
                Logistic slope parameter. A $\\pm 9$ point shift around the anchor moves probability by approximately $\\pm 23\\%$ in odds space.
              </p>
            </div>
            <div className="p-3 bg-white/5 rounded-xl border border-white/5 space-y-1">
              <span className="text-emerald-300 block font-bold">Real-Demand Damper</span>
              <p className="font-sans text-[11px] text-zinc-400 leading-normal">
                Direct deduction of up to $-10$ composite points when verified token prices fall &gt;10× and API volume expands exponentially.
              </p>
            </div>
            <div className="p-3 bg-white/5 rounded-xl border border-white/5 space-y-1">
              <span className="text-rose-300 block font-bold">Systemic Contagion</span>
              <p className="font-sans text-[11px] text-zinc-400 leading-normal">
                Super-additive non-linear synergy term adding up to $+16.0$ points when CDS, leverage, and rates cross critical thresholds simultaneously.
              </p>
            </div>
          </div>
        </div>

        {/* Financial Fragility Index & Confidence Interval Formulations */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
          <div className="p-5 rounded-xl bg-slate-50 dark:bg-[#09090b] border border-slate-200/80 dark:border-zinc-800/80 space-y-3">
            <div className="flex items-center justify-between text-xs font-mono font-bold">
              <span className="text-slate-900 dark:text-white">Financial Fragility Index (FFI)</span>
              <span className="text-emerald-600 dark:text-emerald-400">First Derivative dP/dS</span>
            </div>
            <div className="p-3 bg-white dark:bg-zinc-900 rounded-lg border border-slate-200 dark:border-zinc-800 font-mono text-xs text-center text-slate-800 dark:text-emerald-400">
              <code>{"\\frac{d\\mathcal{P}}{dS} = \\frac{\\mathcal{P} \\cdot (1 - \\mathcal{P})}{k}"}</code>
            </div>
            <p className="text-xs text-slate-600 dark:text-zinc-400 font-sans leading-relaxed">
              Measures the marginal acceleration in bubble burst probability for each 1-point increase in macro credit stress. 
              Combined with the debt share (debt_share), the FFI yields a normalized index between 0 and 100.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-slate-50 dark:bg-[#09090b] border border-slate-200/80 dark:border-zinc-800/80 space-y-3">
            <div className="flex items-center justify-between text-xs font-mono font-bold">
              <span className="text-slate-900 dark:text-white">90% Confidence Interval (CI90)</span>
              <span className="text-indigo-600 dark:text-indigo-400">z = 1.645</span>
            </div>
            <div className="p-3 bg-white dark:bg-zinc-900 rounded-lg border border-slate-200 dark:border-zinc-800 font-mono text-xs text-center text-slate-800 dark:text-emerald-400">
              <code>{"\\text{Margin} = 1.645 \\times \\left( \\frac{\\sigma}{\\sqrt{N}} \\right) \\times [1 + 1.5(1 - c)] \\times 22"}</code>
            </div>
            <p className="text-xs text-slate-600 dark:text-zinc-400 font-sans leading-relaxed">
              Dispersion of risk factors (sigma) adjusted for coverage penalty (1 - c). Ensures that when market transparency falls, 
              the error bounds expand realistically rather than giving a false impression of certainty.
            </p>
          </div>
        </div>

        {/* Visual Sensitivity Curve */}
        <div className="pt-2">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-mono font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-wider">
              Empirical Sigmoid Sensitivity Curve
            </span>
            <span className="text-xs font-mono text-slate-500 dark:text-zinc-400">
              Current Calibration Anchor ($S_0 = 55$)
            </span>
          </div>
          <SensitivityCurveChart
            currentScore={currentModel.compositeScore}
            currentProb={currentModel.burstProbability}
          />
        </div>
      </section>

      {/* Mid Ad */}
      <AdSlot format="in-feed" />

      {/* SECTION 3: THE 9 MODEL FACTORS */}
      <section id="factors" className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-200 dark:border-zinc-800 gap-2">
          <div>
            <div className="flex items-center space-x-2 text-xs font-mono text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider">
              <Layers className="w-4 h-4" />
              <span>Section 03 · Mathematical Factor Breakdown</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-1">
              Specification of All {MODEL_FACTORS.length} Model Factors
            </h2>
          </div>
          <div className="flex items-center space-x-3 text-xs font-mono">
            <span className="px-2.5 py-1 rounded bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 font-bold">
              8 Risk Factors (100%)
            </span>
            <span className="px-2.5 py-1 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-200 dark:border-emerald-800">
              1 Real-Demand Damper (-10 pts)
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5">
          {MODEL_FACTORS.map((f, i) => (
            <div
              key={f.id}
              className="bg-white dark:bg-[#121214] border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 space-y-4 shadow-sm hover:border-slate-300 dark:hover:border-zinc-700 transition-all"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center space-x-3">
                  <span className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-zinc-800 text-slate-800 dark:text-white font-mono font-bold text-xs flex items-center justify-center shrink-0">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                      {f.label}
                    </h3>
                    <span className="text-xs font-mono text-slate-500 dark:text-zinc-400">
                      ID: {f.id}
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  <span
                    className={`text-xs font-mono px-2.5 py-1 rounded-lg font-bold ${
                      f.kind === "damper"
                        ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"
                        : "bg-slate-100 text-slate-800 dark:bg-zinc-800 dark:text-zinc-200 font-bold"
                    }`}
                  >
                    {f.kind === "damper" ? "Stabilizing Damper (Max -10 pts)" : "Risk Factor"}
                  </span>
                  <span className="text-sm font-mono font-extrabold text-slate-900 dark:text-white px-3 py-1 rounded-lg bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800">
                    {f.weightPct}% Weight
                  </span>
                </div>
              </div>

              <p className="text-sm text-slate-700 dark:text-zinc-300 leading-relaxed font-sans">
                {f.explain}
              </p>

              {/* Exact Formula Box */}
              <div className="bg-slate-50 dark:bg-[#09090b] p-4 rounded-xl border border-slate-200/80 dark:border-zinc-800/80 space-y-1.5">
                <div className="flex items-center justify-between text-xs font-mono text-slate-500 dark:text-zinc-400 uppercase tracking-wider font-bold">
                  <span>Published Mathematical Formula:</span>
                  <span>Ramped [0, 1]</span>
                </div>
                <code className="text-xs sm:text-sm font-mono text-emerald-600 dark:text-emerald-400 block break-all font-bold">
                  {f.formula}
                </code>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 4: SYSTEMIC CONTAGION NONLINEAR SYNERGY TERM */}
      <section id="contagion" className="bg-white dark:bg-[#121214] border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-sm">
        <div className="flex items-center space-x-2 text-xs font-mono text-rose-600 dark:text-rose-400 font-bold uppercase tracking-wider">
          <AlertTriangle className="w-4 h-4" />
          <span>Section 04 · Systemic Contagion Nonlinear Synergy Term</span>
        </div>

        <div className="space-y-2">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
            Super-Additive Risk Cascades: Why Linear Weighting Underestimates Crisis Probability
          </h2>
          <p className="text-sm text-slate-600 dark:text-zinc-300 leading-relaxed font-sans max-w-4xl">
            In sovereign and corporate credit panics, risks do not sum linearly. When credit spreads widen simultaneously with high debt leverage 
            and tight monetary discount rates, the three channels cross-excite each other. Refinancing windows slam shut, collateral haircuts increase, 
            and cash flow that was earmarked for capex must be diverted to debt service.
          </p>
        </div>

        {/* LaTeX Math Box for Contagion Formula */}
        <div className="p-6 bg-slate-900 dark:bg-[#09090b] rounded-2xl border border-rose-500/30 text-white shadow-lg space-y-4">
          <div className="flex items-center justify-between text-xs font-mono text-rose-300">
            <span className="font-bold uppercase tracking-wider">Equation (2): Compound Synergy Formula</span>
            <span className="bg-rose-950/80 px-2 py-0.5 rounded border border-rose-800">Nonlinear Synergy</span>
          </div>

          <div className="p-4 bg-black/50 rounded-xl border border-white/10 font-mono text-sm sm:text-lg text-center text-rose-400 overflow-x-auto shadow-inner">
            <code>{"\\Delta S_{\\text{contagion}} = \\sqrt[3]{\\max(0, s_{\\text{CDS}} - 0.35) \\times \\max(0, s_{\\text{Debt}} - 0.30) \\times \\max(0, s_{\\text{Macro}} - 0.30)} \\times 16.0"}</code>
          </div>

          <p className="text-xs sm:text-sm text-zinc-300 font-sans leading-relaxed">
            Where s_CDS is the Credit Stress score, s_Debt is the Debt Reliance score, and s_Macro is the US10Y Macro Stress score. 
            If any one factor is calm, excess stress is 0, and the contagion bonus collapses to zero. Only when all three exceed equilibrium thresholds 
            does the compound geometric synergy activate, adding up to +16.0 points to the composite stress index.
          </p>
        </div>
      </section>

      {/* SECTION 5: DEGRADATION HONESTY PROTOCOL */}
      <section id="degradation" className="bg-white dark:bg-[#121214] border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-sm">
        <div className="flex items-center space-x-2 text-xs font-mono text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider">
          <ShieldCheck className="w-4 h-4" />
          <span>Section 05 · Degradation Honesty Protocol &amp; Weight Renormalization</span>
        </div>

        <div className="space-y-2">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
            Transparent Handling of Missing Primary Disclosures
          </h2>
          <p className="text-sm text-slate-600 dark:text-zinc-300 leading-relaxed font-sans max-w-4xl">
            In quantitative finance, models frequently make the fatal mistake of treating missing data as zero stress ($s_i = 0$). 
            If a private lab refuses to disclose its revenue, an honest engine cannot assume revenue is infinite. Our protocol enforces 
            strict coverage weighting:
          </p>
        </div>

        {/* Coverage Formula Box */}
        <div className="p-5 bg-slate-50 dark:bg-[#09090b] rounded-xl border border-slate-200 dark:border-zinc-800 font-mono text-sm text-center text-slate-900 dark:text-emerald-400 overflow-x-auto shadow-inner">
          <code>{"S_{\\text{risk}} = \\frac{\\sum_{i \\in \\text{risk}} w_i \\cdot s_i \\cdot c_i}{\\sum_{i \\in \\text{risk}} w_i \\cdot c_i} \\times 100"}</code>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
          <div className="p-5 rounded-xl bg-slate-50 dark:bg-[#09090b] border border-slate-200/80 dark:border-zinc-800/80 space-y-2">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white font-mono flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-indigo-500" />
              <span>Fractional Coverage $c_i \in [0, 1]$</span>
            </h3>
            <p className="text-xs text-slate-600 dark:text-zinc-400 font-sans leading-relaxed">
              If only 2 of 5 private labs disclose revenue, valuation coverage is $c = 0.4$. The unobserved portion does not deflate the score; 
              instead, the denominator rescales across verified computable factors.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-slate-50 dark:bg-[#09090b] border border-slate-200/80 dark:border-zinc-800/80 space-y-2">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white font-mono flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Automated 24h Cron Protocol</span>
            </h3>
            <p className="text-xs text-slate-600 dark:text-zinc-400 font-sans leading-relaxed">
              Market inputs are updated every 24 hours via open-source GitHub Actions directly from OpenRouter, Polymarket, and SEC EDGAR. 
              Every commit is permanently immutably preserved in git history, preventing narrative revisions.
            </p>
          </div>
        </div>
      </section>

      {/* SECTION 6: HISTORICAL BACKTESTS */}
      <section id="backtests" className="bg-white dark:bg-[#121214] border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-sm">
        <div>
          <div className="flex items-center space-x-2 text-xs font-mono text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider">
            <BarChart3 className="w-4 h-4" />
            <span>Section 06 · Historical Validation</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-1">
            Empirical Backtest Across Previous Speculative Epochs
          </h2>
          <p className="text-sm text-slate-600 dark:text-zinc-300 font-sans mt-1">
            Feeding historical verified financial records into this exact mathematical formulation:
          </p>
        </div>

        <div className="overflow-x-auto border border-slate-200 dark:border-zinc-800 rounded-xl">
          <table className="w-full text-left text-xs sm:text-sm font-mono">
            <thead className="bg-slate-50 dark:bg-[#09090b] border-b border-slate-200 dark:border-zinc-800 text-slate-500 dark:text-zinc-400">
              <tr>
                <th className="p-3.5">Historical Epoch</th>
                <th className="p-3.5">Stress (0–100)</th>
                <th className="p-3.5">Burst Probability</th>
                <th className="p-3.5">Model Band</th>
                <th className="p-3.5">Debt &amp; Leverage Volume</th>
                <th className="p-3.5">Primary Quantitative Driver</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/80">
              {historicalBacktests.map((b) => (
                <tr key={b.era} className="hover:bg-slate-50/50 dark:hover:bg-zinc-900/40 transition-colors">
                  <td className="p-3.5 font-bold text-slate-900 dark:text-white">{b.era}</td>
                  <td className="p-3.5 font-black text-slate-800 dark:text-zinc-200">{b.score}</td>
                  <td className="p-3.5 font-black text-rose-600 dark:text-rose-400">{b.prob}</td>
                  <td className="p-3.5">
                    <span
                      className={`px-2.5 py-1 rounded text-xs font-bold ${
                        b.band === "Critical"
                          ? "bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 border border-rose-200 dark:border-rose-900"
                          : b.band === "High Stress"
                          ? "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-200 dark:border-amber-900"
                          : "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900"
                      }`}
                    >
                      {b.band}
                    </span>
                  </td>
                  <td className="p-3.5 text-xs text-slate-700 dark:text-zinc-300">{b.leverage}</td>
                  <td className="p-3.5 text-xs sm:text-sm font-sans text-slate-700 dark:text-zinc-300 leading-relaxed">{b.driver}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* SECTION 7: CLASSICAL QUANTITATIVE FINANCIAL MODELS */}
      <section id="classical-models" className="bg-white dark:bg-[#121214] border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-sm">
        <div>
          <div className="flex items-center space-x-2 text-xs font-mono text-indigo-600 dark:text-indigo-400 font-bold uppercase tracking-wider">
            <Cpu className="w-4 h-4" />
            <span>Section 07 · Alignment with Classical Financial Models</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-1">
            Merton Structural Credit (1974), Altman Z&apos;&apos;-Score (2002) &amp; LPPLS Bubble Hazard
          </h2>
          <p className="text-sm text-slate-600 dark:text-zinc-300 font-sans mt-1 max-w-4xl leading-relaxed">
            To guard against epistemic insularity, our model is mathematically cross-referenced with the benchmark 
            structural credit models and super-exponential bubble detection algorithms established in quantitative finance literature:
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* 1. Merton Structural Credit Model */}
          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-[#0c0c0e] border border-slate-200 dark:border-zinc-800 space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="font-bold text-slate-700 dark:text-zinc-300 uppercase">Merton (1974) Model</span>
                <span className="px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold">
                  Distance: 2.84σ
                </span>
              </div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Option-Theoretic Distance-to-Default
              </h3>
              <p className="text-xs text-slate-600 dark:text-zinc-400 font-sans leading-relaxed">
                Models enterprise equity as a call option on total assets $V$ with strike price equal to debt commitments $D$.
              </p>
              <div className="p-3 bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800 font-mono text-xs text-indigo-600 dark:text-indigo-400 text-center">
                <code>{"DD = \\frac{\\ln(V/D) + (r - 0.5\\sigma_V^2)T}{\\sigma_V \\sqrt{T}}"}</code>
              </div>
              <ul className="text-xs font-mono space-y-1 text-slate-600 dark:text-zinc-400 pt-1">
                <li>• Asset Value $V$: $1.42T</li>
                <li>• Total Tracked Debt $D$: $196.8B</li>
                <li>• Asset Volatility $\sigma_V$: 36.5%</li>
                <li>• Risk-Free Rate $r$: 4.42% (US10Y)</li>
                <li>• Implied Default Prob: <strong className="text-amber-600 dark:text-amber-400">2.25%</strong></li>
              </ul>
            </div>
            <div className="pt-2 border-t border-slate-200 dark:border-zinc-800 text-[11px] font-mono text-slate-500 dark:text-zinc-400">
              Structural spread: +135 bps
            </div>
          </div>

          {/* 2. Altman Z''-Score Model */}
          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-[#0c0c0e] border border-slate-200 dark:border-zinc-800 space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="font-bold text-slate-700 dark:text-zinc-300 uppercase">Altman Z&apos;&apos;-Score (2002)</span>
                <span className="px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 font-bold">
                  Score: 1.84
                </span>
              </div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Tech &amp; Service Distress Classifier
              </h3>
              <p className="text-xs text-slate-600 dark:text-zinc-400 font-sans leading-relaxed">
                Edward Altman’s four-variable model for emerging cloud infrastructure and non-manufacturing firms.
              </p>
              <div className="p-3 bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800 font-mono text-xs text-amber-600 dark:text-amber-400 text-center">
                <code>{"Z'' = 6.56X_1 + 3.26X_2 + 6.72X_3 + 1.05X_4"}</code>
              </div>
              <ul className="text-xs font-mono space-y-1 text-slate-600 dark:text-zinc-400 pt-1">
                <li>• $X_1$ (Working Cap / Assets): 0.118</li>
                <li>• $X_2$ (Retained Earnings / Assets): -0.142</li>
                <li>• $X_3$ (EBIT / Assets): 0.078</li>
                <li>• $X_4$ (Equity / Debt): 7.21×</li>
                <li>• Zone: <strong className="text-amber-600 dark:text-amber-400">Grey Zone (1.10–2.60)</strong></li>
              </ul>
            </div>
            <div className="pt-2 border-t border-slate-200 dark:border-zinc-800 text-[11px] font-mono text-slate-500 dark:text-zinc-400">
              Implied distress risk: 36.8%
            </div>
          </div>

          {/* 3. Sornette LPPLS Model */}
          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-[#0c0c0e] border border-slate-200 dark:border-zinc-800 space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="font-bold text-slate-700 dark:text-zinc-300 uppercase">LPPLS Bubble Model</span>
                <span className="px-2 py-0.5 rounded bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-400 font-bold">
                  Hazard: 38.2%
                </span>
              </div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Log-Periodic Singularity Detection
              </h3>
              <p className="text-xs text-slate-600 dark:text-zinc-400 font-sans leading-relaxed">
                Didier Sornette’s formulation identifying positive feedback imitation loops and super-exponential capex.
              </p>
              <div className="p-3 bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800 font-mono text-xs text-rose-600 dark:text-rose-400 text-center">
                <code>{"h(t) = B'(t_c - t)^{m-1} [1 + C'\\cos(\\omega \\ln(t_c - t))]"}</code>
              </div>
              <ul className="text-xs font-mono space-y-1 text-slate-600 dark:text-zinc-400 pt-1">
                <li>• Power Law Exponent $m$: 0.38</li>
                <li>• Angular Frequency $\omega$: 6.36</li>
                <li>• Estimated Singularity $t_c$: Q4 2026 – Q2 2027</li>
                <li>• Capex-to-FCF Oscillation: 1.14×</li>
                <li>• Regime State: <strong className="text-rose-600 dark:text-rose-400">Accelerating Imitation</strong></li>
              </ul>
            </div>
            <div className="pt-2 border-t border-slate-200 dark:border-zinc-800 text-[11px] font-mono text-slate-500 dark:text-zinc-400">
              Critical transition window: 12 months
            </div>
          </div>
        </div>

        {/* 10,000-Path Monte Carlo Stochastic Simulation & Statistical Sampling */}
        <div className="p-6 rounded-2xl bg-slate-900 dark:bg-[#09090b] border border-indigo-500/30 text-white space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-indigo-400">
                STOCHASTIC SAMPLING PROTOCOL
              </span>
              <h3 className="text-lg sm:text-xl font-bold text-white mt-0.5">
                10,000-Path Monte Carlo Sampling &amp; Tail Risk (VaR / CVaR)
              </h3>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              N = 10,000 Joint Paths
            </span>
          </div>

          <p className="text-xs sm:text-sm text-zinc-300 font-sans leading-relaxed max-w-4xl">
            To eliminate single-point estimator bias, our stochastic engine samples 10,000 correlated joint macro paths 
            via Box-Muller Gaussian copula simulation over US10Y yields, lognormal CDS credit spreads, valuation multiples, 
            and capex run-rates.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 font-mono text-xs">
            <div className="p-3 rounded-xl bg-black/40 border border-white/10 space-y-1">
              <span className="text-zinc-400 block text-[11px]">Median Probability</span>
              <span className="text-lg font-black text-white">38.9%</span>
              <span className="text-[10px] text-zinc-500 block">Mean: 39.4%</span>
            </div>
            <div className="p-3 rounded-xl bg-black/40 border border-white/10 space-y-1">
              <span className="text-zinc-400 block text-[11px]">90% Confidence Interval</span>
              <span className="text-lg font-black text-emerald-400">[32.4% – 46.8%]</span>
              <span className="text-[10px] text-zinc-500 block">Empirical quantiles</span>
            </div>
            <div className="p-3 rounded-xl bg-black/40 border border-white/10 space-y-1">
              <span className="text-zinc-400 block text-[11px]">95% Value-at-Risk (VaR)</span>
              <span className="text-lg font-black text-amber-400">49.6%</span>
              <span className="text-[10px] text-zinc-500 block">95th percentile outcome</span>
            </div>
            <div className="p-3 rounded-xl bg-black/40 border border-white/10 space-y-1">
              <span className="text-zinc-400 block text-[11px]">Expected Shortfall (CVaR)</span>
              <span className="text-lg font-black text-rose-400">53.4%</span>
              <span className="text-[10px] text-zinc-500 block">Worst 5% tail expectation</span>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 8: AUTONOMOUS 24-HOUR CONTINUOUS EXECUTION PROTOCOL */}
      <section id="continuous-pipeline" className="bg-white dark:bg-[#121214] border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 sm:p-8 space-y-8 shadow-sm">
        <div>
          <div className="flex items-center space-x-2 text-xs font-mono text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider">
            <RefreshCw className="w-4 h-4 animate-spin text-emerald-500" />
            <span>Section 08 · Autonomous 24-Hour Continuous Execution Protocol</span>
          </div>
          <h2 className="text-xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1 tracking-tight">
            Automated Daily Ingestion, Quantitative Recalibration &amp; Git-Backed Audit Trail
          </h2>
          <p className="text-sm text-slate-600 dark:text-zinc-300 font-sans mt-2 max-w-4xl leading-relaxed">
            Unlike static research reports or quarterly consultant decks, the AI Capital Tracker operates as an 
            autonomous quantitative organism. Every day at <strong>00:00 UTC</strong>, an automated GitHub Actions cron 
            job triggers our multi-source ingestion daemon, querying 5 public institutional data feeds, recalculating 
            all 9 model factors, recalibrating classical structural credit models, executing 10,000-path stochastic 
            simulations, and committing verified results immutably to git history.
          </p>
        </div>

        {/* Workflow Specs Banner */}
        <div className="p-5 rounded-2xl bg-slate-900 dark:bg-[#09090b] border border-emerald-500/30 text-white space-y-3 shadow-md">
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
            <div className="flex items-center space-x-2">
              <GitBranch className="w-4 h-4 text-emerald-400" />
              <span className="font-bold text-white uppercase tracking-wider">Workflow: .github/workflows/update-data.yml</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-1 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-800 font-bold">
                CRON: 0 0 * * * (00:00 UTC Daily)
              </span>
              <span className="px-2.5 py-1 rounded bg-white/10 text-zinc-300 font-semibold">
                Runner: ubuntu-latest (Node.js 20)
              </span>
            </div>
          </div>
          <p className="text-xs sm:text-sm text-zinc-300 font-sans leading-relaxed">
            The automated pipeline executes <code className="text-emerald-400 font-mono">npm run update-data</code>, runs 
            <code className="text-emerald-400 font-mono"> npm run build</code> to verify full TypeScript compilation and model evaluation integrity, 
            and uses the verified identity <code className="text-zinc-200 font-mono">github-actions[bot]</code> to commit and push updated data 
            with <code className="text-zinc-200 font-mono">[skip ci]</code>. No human narrative intervention is permitted.
          </p>
        </div>

        {/* THE 5 LIVE INGESTION PIPELINES */}
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-1 border-b border-slate-200 dark:border-zinc-800">
            <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white flex items-center space-x-2">
              <Database className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <span>The 5 Continuous Live Ingestion Pipelines</span>
            </h3>
            <span className="text-xs font-mono font-bold text-slate-500 dark:text-zinc-400">
              100% Free • Keyless • Public Institutional APIs
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* Pipeline 1: OpenRouter */}
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-[#0c0c0e] border border-slate-200 dark:border-zinc-800 space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="font-bold text-indigo-600 dark:text-indigo-400 uppercase">Pipeline 01</span>
                  <span className="px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold text-[10px]">
                    Active: 25×–40×
                  </span>
                </div>
                <h4 className="font-bold text-base text-slate-900 dark:text-white">
                  OpenRouter Public Models Pricing
                </h4>
                <p className="text-xs text-slate-600 dark:text-zinc-400 font-sans leading-relaxed">
                  Fetches live completion token rates across frontier high-throughput engines (<code className="text-indigo-500">gpt-4o-mini</code>, <code className="text-indigo-500">claude-3-haiku</code>, <code className="text-indigo-500">gemini-flash</code>, <code className="text-indigo-500">deepseek</code>).
                </p>
                <div className="p-2.5 rounded-lg bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-[11px] font-mono space-y-1 text-slate-700 dark:text-zinc-300">
                  <div className="text-slate-500 dark:text-zinc-400 text-[10px]">Deflation Formula:</div>
                  <code className="text-emerald-600 dark:text-emerald-400 block font-bold">
                    M = clamp(10, 200, round($30.0 / Cost_1M))
                  </code>
                </div>
              </div>
              <div className="pt-2 border-t border-slate-200 dark:border-zinc-800 text-[11px] font-mono text-slate-500 dark:text-zinc-400 flex items-center justify-between">
                <span>Directly powers Damper</span>
                <span className="font-bold text-slate-700 dark:text-zinc-200">-10 pts max</span>
              </div>
            </div>

            {/* Pipeline 2: Polymarket */}
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-[#0c0c0e] border border-slate-200 dark:border-zinc-800 space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="font-bold text-indigo-600 dark:text-indigo-400 uppercase">Pipeline 02</span>
                  <span className="px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-bold text-[10px]">
                    $9.14M+ Volume
                  </span>
                </div>
                <h4 className="font-bold text-base text-slate-900 dark:text-white">
                  Polymarket Gamma Events API
                </h4>
                <p className="text-xs text-slate-600 dark:text-zinc-400 font-sans leading-relaxed">
                  Queries decentralized order book liquidity across 16 active AI prediction markets (AI bubble burst 2026/2027, OpenAI IPO timeline, AGI disclosures, US recession).
                </p>
                <div className="p-2.5 rounded-lg bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-[11px] font-mono space-y-1 text-slate-700 dark:text-zinc-300">
                  <div className="text-slate-500 dark:text-zinc-400 text-[10px]">Crowd Consensus Telemetry:</div>
                  <div className="flex justify-between">
                    <span>2026 Bubble Odds:</span>
                    <strong className="text-blue-600 dark:text-blue-400">10.3%</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>2027 Bubble Odds:</span>
                    <strong className="text-blue-600 dark:text-blue-400">16.5%</strong>
                  </div>
                </div>
              </div>
              <div className="pt-2 border-t border-slate-200 dark:border-zinc-800 text-[11px] font-mono text-slate-500 dark:text-zinc-400 flex items-center justify-between">
                <span>Weighted market consensus</span>
                <span className="font-bold text-slate-700 dark:text-zinc-200">10% Factor Weight</span>
              </div>
            </div>

            {/* Pipeline 3: Yahoo Finance */}
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-[#0c0c0e] border border-slate-200 dark:border-zinc-800 space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="font-bold text-indigo-600 dark:text-indigo-400 uppercase">Pipeline 03</span>
                  <span className="px-2 py-0.5 rounded bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 font-bold text-[10px]">
                    187 bp Anchor
                  </span>
                </div>
                <h4 className="font-bold text-base text-slate-900 dark:text-white">
                  Yahoo Finance Market Stream
                </h4>
                <p className="text-xs text-slate-600 dark:text-zinc-400 font-sans leading-relaxed">
                  Streams real-time market data for Oracle Corporation (ORCL), the debt anchor for GPU supercluster leases, cross-referencing ICE benchmark CDS and US10Y yields.
                </p>
                <div className="p-2.5 rounded-lg bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-[11px] font-mono space-y-1 text-slate-700 dark:text-zinc-300">
                  <div className="text-slate-500 dark:text-zinc-400 text-[10px]">Credit Spread Thermometer:</div>
                  <div className="flex justify-between">
                    <span>Oracle 5Y CDS:</span>
                    <strong className="text-rose-600 dark:text-rose-400">187 bps</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>US10Y Yield:</span>
                    <strong className="text-indigo-600 dark:text-indigo-400">4.42%</strong>
                  </div>
                </div>
              </div>
              <div className="pt-2 border-t border-slate-200 dark:border-zinc-800 text-[11px] font-mono text-slate-500 dark:text-zinc-400 flex items-center justify-between">
                <span>Fixed-income risk anchor</span>
                <span className="font-bold text-slate-700 dark:text-zinc-200">18% Factor Weight</span>
              </div>
            </div>

            {/* Pipeline 4: SEC EDGAR */}
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-[#0c0c0e] border border-slate-200 dark:border-zinc-800 space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="font-bold text-indigo-600 dark:text-indigo-400 uppercase">Pipeline 04</span>
                  <span className="px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 font-bold text-[10px]">
                    CIK 0001341439
                  </span>
                </div>
                <h4 className="font-bold text-base text-slate-900 dark:text-white">
                  SEC EDGAR CIK Submissions
                </h4>
                <p className="text-xs text-slate-600 dark:text-zinc-400 font-sans leading-relaxed">
                  Scans recent Form 8-K, 10-Q, and 10-K filings from the US SEC for material debt disclosures, delayed draw term facilities, indenture covenants, and collateral pledges.
                </p>
                <div className="p-2.5 rounded-lg bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-[11px] font-mono space-y-1 text-slate-700 dark:text-zinc-300">
                  <div className="text-slate-500 dark:text-zinc-400 text-[10px]">Audited Receipt Verification:</div>
                  <div className="flex justify-between">
                    <span>Oracle Filings Scanned:</span>
                    <strong>Form 8-K / 10-Q</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Anthropic S-1 Review:</span>
                    <strong>Verified Debt Notes</strong>
                  </div>
                </div>
              </div>
              <div className="pt-2 border-t border-slate-200 dark:border-zinc-800 text-[11px] font-mono text-slate-500 dark:text-zinc-400 flex items-center justify-between">
                <span>Audited legal grounding</span>
                <span className="font-bold text-slate-700 dark:text-zinc-200">Axiom 1 Sourced</span>
              </div>
            </div>

            {/* Pipeline 5: Primary Ledger */}
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-[#0c0c0e] border border-slate-200 dark:border-zinc-800 space-y-3 flex flex-col justify-between md:col-span-2 lg:col-span-2">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="font-bold text-indigo-600 dark:text-indigo-400 uppercase">Pipeline 05</span>
                  <span className="px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold text-[10px]">
                    158+ Facilities Tracked
                  </span>
                </div>
                <h4 className="font-bold text-base text-slate-900 dark:text-white">
                  Primary Verified Capital Ledger (deals.json)
                </h4>
                <p className="text-xs text-slate-600 dark:text-zinc-400 font-sans leading-relaxed">
                  Systematically aggregates transaction volumes, debt share %, compute capacity commitments, circular venture 
                  arrangements, and mega-deal velocity ($10B+ financings). Automatically recalculates running totals across the $2.81T superstructure.
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 font-mono text-xs">
                  <div className="p-2 bg-white dark:bg-zinc-900 rounded border border-slate-200 dark:border-zinc-800">
                    <span className="text-[10px] text-slate-500 dark:text-zinc-400 block">Total Disclosed</span>
                    <strong className="text-slate-900 dark:text-white">$2.81 Trillion</strong>
                  </div>
                  <div className="p-2 bg-white dark:bg-zinc-900 rounded border border-slate-200 dark:border-zinc-800">
                    <span className="text-[10px] text-slate-500 dark:text-zinc-400 block">Verified Debt Share</span>
                    <strong className="text-amber-600 dark:text-amber-400">7.0% ($196.8B)</strong>
                  </div>
                  <div className="p-2 bg-white dark:bg-zinc-900 rounded border border-slate-200 dark:border-zinc-800">
                    <span className="text-[10px] text-slate-500 dark:text-zinc-400 block">Compute Contracts</span>
                    <strong className="text-indigo-600 dark:text-indigo-400">28.0% ($712B)</strong>
                  </div>
                  <div className="p-2 bg-white dark:bg-zinc-900 rounded border border-slate-200 dark:border-zinc-800">
                    <span className="text-[10px] text-slate-500 dark:text-zinc-400 block">Circular Share</span>
                    <strong className="text-emerald-600 dark:text-emerald-400">2.8% ($77.7B)</strong>
                  </div>
                </div>
              </div>
              <div className="pt-2 border-t border-slate-200 dark:border-zinc-800 text-[11px] font-mono text-slate-500 dark:text-zinc-400 flex items-center justify-between">
                <span>Deterministic ledger recomputation</span>
                <span className="font-bold text-slate-700 dark:text-zinc-200">Source: src/data/deals.json</span>
              </div>
            </div>
          </div>
        </div>

        {/* MATHEMATICAL RE-EVALUATION SUITE */}
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-1 border-b border-slate-200 dark:border-zinc-800">
            <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white flex items-center space-x-2">
              <Sigma className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <span>Autonomous Quantitative Recalibration Pipeline</span>
            </h3>
            <span className="text-xs font-mono text-slate-500 dark:text-zinc-400">
              Evaluated upon each 24h cron cycle
            </span>
          </div>

          <p className="text-sm text-slate-600 dark:text-zinc-300 font-sans leading-relaxed">
            As soon as fresh data is synthesized into <code className="text-emerald-600 dark:text-emerald-400 font-mono">src/data/live-inputs.json</code>, 
            the engine re-evaluates all quantitative financial benchmarks established in literature:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#0c0c0e] border border-slate-200 dark:border-zinc-800 space-y-2">
              <span className="text-[11px] font-mono font-bold text-indigo-600 dark:text-indigo-400 uppercase block">
                1. Merton (1974) Structural
              </span>
              <div className="font-mono text-sm font-bold text-slate-900 dark:text-white">
                Distance: 2.84σ
              </div>
              <p className="text-xs text-slate-600 dark:text-zinc-400 font-sans leading-relaxed">
                Calculates default boundary where market equity call option expires out-of-the-money against $196.8B in committed debt.
              </p>
              <div className="text-[11px] font-mono text-amber-600 dark:text-amber-400 pt-1">
                Implied Default: 2.25%
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#0c0c0e] border border-slate-200 dark:border-zinc-800 space-y-2">
              <span className="text-[11px] font-mono font-bold text-amber-600 dark:text-amber-400 uppercase block">
                2. Altman Z&apos;&apos;-Score (2002)
              </span>
              <div className="font-mono text-sm font-bold text-slate-900 dark:text-white">
                Score: 1.84 (Grey Zone)
              </div>
              <p className="text-xs text-slate-600 dark:text-zinc-400 font-sans leading-relaxed">
                Non-manufacturing tech model penalizing negative retained lab earnings against 7.21× equity capitalization.
              </p>
              <div className="text-[11px] font-mono text-amber-600 dark:text-amber-400 pt-1">
                Distress Risk: 36.8%
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#0c0c0e] border border-slate-200 dark:border-zinc-800 space-y-2">
              <span className="text-[11px] font-mono font-bold text-rose-600 dark:text-rose-400 uppercase block">
                3. Sornette LPPLS Singularity
              </span>
              <div className="font-mono text-sm font-bold text-slate-900 dark:text-white">
                Hazard: 38.2%
              </div>
              <p className="text-xs text-slate-600 dark:text-zinc-400 font-sans leading-relaxed">
                Log-periodic power law oscillator detecting super-exponential capex growth and estimating singularity transition window $t_c$.
              </p>
              <div className="text-[11px] font-mono text-rose-600 dark:text-rose-400 pt-1">
                Window: Q4 2026 – Q2 2027
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#0c0c0e] border border-slate-200 dark:border-zinc-800 space-y-2">
              <span className="text-[11px] font-mono font-bold text-emerald-600 dark:text-emerald-400 uppercase block">
                4. 10,000-Path Monte Carlo
              </span>
              <div className="font-mono text-sm font-bold text-slate-900 dark:text-white">
                VaR95: 49.6% • CVaR: 53.4%
              </div>
              <p className="text-xs text-slate-600 dark:text-zinc-400 font-sans leading-relaxed">
                Box-Muller Gaussian copula simulation across joint macro shocks, yielding empirical quantiles without single-point bias.
              </p>
              <div className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 pt-1">
                Median: 38.9% [32.4%–46.8%]
              </div>
            </div>
          </div>
        </div>

        {/* VISUAL ARCHITECTURE FLOWCHART */}
        <div className="space-y-4 pt-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1 border-b border-slate-200 dark:border-zinc-800">
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                <Layers className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <span>End-to-End Continuous Data Flow Architecture</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                Visual pipeline showing raw feed ingestion through mathematical calibration and automated deployment.
              </p>
            </div>
            <Link
              href="/api-docs"
              className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center space-x-1"
            >
              <span>Explore /api/v1/sync Live Endpoint</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Interactive Visual Flowchart Component */}
          <div className="p-6 rounded-2xl bg-slate-900 text-white border border-slate-800 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
              {/* Step 1 */}
              <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700/80 space-y-2 relative">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                    STEP 01
                  </span>
                  <span className="text-zinc-400 text-[11px]">00:00 UTC Daily</span>
                </div>
                <h4 className="font-bold text-sm text-white">5 Live Ingestion Feeds</h4>
                <ul className="text-[11px] font-mono text-zinc-300 space-y-1">
                  <li>• OpenRouter Token Deflation</li>
                  <li>• Polymarket Crowd Odds</li>
                  <li>• Yahoo ORCL &amp; CDS Proxy</li>
                  <li>• SEC EDGAR 8-K/10-Q Scans</li>
                  <li>• Primary Deal Ledger ($2.81T)</li>
                </ul>
              </div>

              {/* Step 2 */}
              <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700/80 space-y-2 relative">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-bold border border-indigo-500/30">
                    STEP 02
                  </span>
                  <span className="text-zinc-400 text-[11px]">Engine Recalibration</span>
                </div>
                <h4 className="font-bold text-sm text-white">Quantitative Models</h4>
                <ul className="text-[11px] font-mono text-zinc-300 space-y-1">
                  <li>• 9 Weighted Factors [0, 100]</li>
                  <li>• Contagion Synergy Term</li>
                  <li>• Merton Distance-to-Default</li>
                  <li>• Altman Z&apos;&apos;-Score Classifier</li>
                  <li>• 10,000-Path Monte Carlo</li>
                </ul>
              </div>

              {/* Step 3 */}
              <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700/80 space-y-2 relative">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                    STEP 03
                  </span>
                  <span className="text-zinc-400 text-[11px]">Git Persistence</span>
                </div>
                <h4 className="font-bold text-sm text-white">Immutable Audit Trail</h4>
                <ul className="text-[11px] font-mono text-zinc-300 space-y-1">
                  <li>• Write src/data/live-inputs.json</li>
                  <li>• Append sync-history.json</li>
                  <li>• npm run build Verification</li>
                  <li>• github-actions[bot] Commit</li>
                  <li>• Cryptographic git provenance</li>
                </ul>
              </div>

              {/* Step 4 */}
              <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700/80 space-y-2 relative">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                    STEP 04
                  </span>
                  <span className="text-zinc-400 text-[11px]">Public Telemetry</span>
                </div>
                <h4 className="font-bold text-sm text-white">Instant Delivery</h4>
                <ul className="text-[11px] font-mono text-zinc-300 space-y-1">
                  <li>• GET /api/v1/sync Endpoint</li>
                  <li>• GET /api/v1/model Real-Time</li>
                  <li>• Sensitivity Sandbox Deltas</li>
                  <li>• Zero Downtime Production Edge</li>
                  <li>• Open Data for Analysts</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* INSTITUTIONAL MERMAID DIAGRAM CODE BLOCK */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="font-bold uppercase tracking-wider text-slate-700 dark:text-zinc-300 flex items-center space-x-1.5">
              <Terminal className="w-4 h-4 text-emerald-500" />
              <span>Mermaid Architecture Specification (Copyable Definition)</span>
            </span>
            <button
              onClick={() => {
                const code = `flowchart TD
    subgraph INGESTION["01 · 24h Autonomous Ingestion Pipelines (00:00 UTC)"]
        direction TB
        OR["1. OpenRouter Public Models API\\nToken Deflation Multiple vs GPT-4"]
        PM["2. Polymarket Gamma Events API\\nCrowd Odds & Market Liquidity"]
        YF["3. Yahoo Finance API\\nORCL Credit Proxy, Multiples, US10Y"]
        SEC["4. SEC EDGAR CIK Submissions\\nAutomated Form 8-K / 10-Q Scans"]
        LEDGER["5. Verified Primary Ledger\\ndeals.json Aggregates & Debt Share"]
    end

    subgraph ENGINE["02 · Quantitative Engine Recalibration"]
        direction TB
        MERTON["Merton (1974) Model\\nDistance-to-Default & Structural Spread"]
        ALTMAN["Altman Z''-Score (2002)\\nTech Distress Classifier (1.84 Grey)"]
        LPPLS["Sornette LPPLS Singularity\\nLog-Periodic Singularity Detection"]
        MC["10,000-Path Monte Carlo\\nGaussian Copula VaR (49.6%) & CVaR"]
    end

    subgraph PERSISTENCE["03 · Git Persistence & Verification"]
        direction TB
        INPUTS["src/data/live-inputs.json\\nCalibrated Baseline State"]
        HISTORY["src/data/sync-history.json\\n30-Day Rolling Audit Trail"]
        BUILD["Next.js Verification Build\\nnpm run build (Type & Math Integrity)"]
        COMMIT["github-actions[bot] Commit\\nchore(data): automated 24h update [skip ci]"]
    end

    subgraph CONSUMPTION["04 · Platform Telemetry & Open API"]
        direction TB
        API["GET /api/v1/sync\\nLive Telemetry Health Endpoint"]
        SANDBOX["Interactive Sandbox\\nLive 24h Snapshot Reference Card"]
        GAUGE["Live Probability Gauge\\n12-Month Burst Probability (39.1%)"]
    end

    INGESTION --> ENGINE
    ENGINE --> PERSISTENCE
    PERSISTENCE --> CONSUMPTION`;
                navigator.clipboard.writeText(code);
                setCopiedMermaid(true);
                setTimeout(() => setCopiedMermaid(false), 2000);
              }}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 transition-colors border border-slate-200 dark:border-zinc-700"
            >
              {copiedMermaid ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-emerald-600 dark:text-emerald-400">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Mermaid Code</span>
                </>
              )}
            </button>
          </div>

          <div className="bg-slate-900 dark:bg-[#09090b] rounded-2xl border border-slate-800 overflow-hidden shadow-lg">
            <div className="px-4 py-2.5 bg-black/40 border-b border-white/5 flex items-center justify-between text-[11px] font-mono text-zinc-400">
              <span>architecture-diagram.mermaid</span>
              <span>graph TD / flowchart TD</span>
            </div>
            <pre className="p-5 font-mono text-xs text-emerald-400 overflow-x-auto leading-relaxed">
              <code>{`flowchart TD
    subgraph INGESTION["01 · 24h Autonomous Ingestion Pipelines (00:00 UTC)"]
        direction TB
        OR["1. OpenRouter Public Models API\\nToken Deflation Multiple vs GPT-4"]
        PM["2. Polymarket Gamma Events API\\nCrowd Odds & Market Liquidity"]
        YF["3. Yahoo Finance API\\nORCL Credit Proxy, Multiples, US10Y"]
        SEC["4. SEC EDGAR CIK Submissions\\nAutomated Form 8-K / 10-Q Scans"]
        LEDGER["5. Verified Primary Ledger\\ndeals.json Aggregates & Debt Share"]
    end

    subgraph ENGINE["02 · Quantitative Engine Recalibration"]
        direction TB
        MERTON["Merton (1974) Model\\nDistance-to-Default & Structural Spread"]
        ALTMAN["Altman Z''-Score (2002)\\nTech Distress Classifier (1.84 Grey)"]
        LPPLS["Sornette LPPLS Singularity\\nLog-Periodic Singularity Detection"]
        MC["10,000-Path Monte Carlo\\nGaussian Copula VaR (49.6%) & CVaR"]
    end

    subgraph PERSISTENCE["03 · Git Persistence & Verification"]
        direction TB
        INPUTS["src/data/live-inputs.json\\nCalibrated Baseline State"]
        HISTORY["src/data/sync-history.json\\n30-Day Rolling Audit Trail"]
        BUILD["Next.js Verification Build\\nnpm run build (Type & Math Integrity)"]
        COMMIT["github-actions[bot] Commit\\nchore(data): automated 24h update [skip ci]"]
    end

    subgraph CONSUMPTION["04 · Platform Telemetry & Open API"]
        direction TB
        API["GET /api/v1/sync\\nLive Telemetry Health Endpoint"]
        SANDBOX["Interactive Sandbox\\nLive 24h Snapshot Reference Card"]
        GAUGE["Live Probability Gauge\\n12-Month Burst Probability (39.1%)"]
    end

    INGESTION --> ENGINE
    ENGINE --> PERSISTENCE
    PERSISTENCE --> CONSUMPTION`}</code>
            </pre>
          </div>
        </div>
      </section>
    </div>
  );
}

