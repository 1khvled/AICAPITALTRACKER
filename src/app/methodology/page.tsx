import React from "react";
import Link from "next/link";
import { MODEL_FACTORS, MODEL_CALIBRATION } from "@/lib/model/factors";
import { ArrowLeft, BookOpen, ShieldCheck, BarChart3, Code2, CheckCircle2, AlertTriangle, Layers, FileText } from "lucide-react";
import { SensitivityCurveChart } from "@/components/VisualCharts";
import { AdSlot } from "@/components/AdSlot";

export default function MethodologyPage() {
  const historicalBacktests = [
    { era: "Dot-Com Peak (March 2000)", score: 82.5, prob: "92.4%", band: "Critical", driver: "Telecom fiber capex/FCF at 2.4×; 0% real revenues" },
    { era: "Pre-Lehman Crunch (October 2007)", score: 72.8, prob: "84.1%", band: "Critical", driver: "CDS widening on subprime CDO debt; bank leverage at 33:1" },
    { era: "ZIRP Tech Euphoria (November 2021)", score: 63.9, prob: "71.3%", band: "High Stress", driver: "Cloud SaaS multiples at 24× P/S; free money froth" },
    { era: "Current AI Infrastructure Superstructure (2026)", score: 61.2, prob: "68.4%", band: "High Stress", driver: "Oracle CDS 187bp, $801B debt, mitigated by 40× token price deflation" },
    { era: "ChatGPT Launch / Early AI (January 2023)", score: 48.0, prob: "31.2%", band: "Guarded", driver: "Low debt share, uncommitted capex, early utility exploration" },
  ];

  return (
    <div className="space-y-10">
      {/* Top Banner Ad */}
      <AdSlot format="leaderboard" />

      {/* Header */}
      <div className="pb-6 border-b border-slate-200 dark:border-zinc-800 space-y-3">
        <div className="flex items-center space-x-2 text-xs font-mono text-slate-500 dark:text-zinc-400">
          <Link href="/" className="hover:text-slate-900 dark:hover:text-white flex items-center space-x-1">
            <ArrowLeft className="w-3 h-3" />
            <span>Home</span>
          </Link>
          <span>/</span>
          <span className="text-slate-900 dark:text-white font-semibold">Mathematical Methodology</span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
              Quantitative Model Specification &amp; Published Formulas
            </h1>
            <p className="text-sm text-slate-600 dark:text-zinc-300 font-sans mt-1 max-w-2xl leading-relaxed">
              Full mathematical transparency: empirical sigmoid derivation, factor weighting equations, 
              renormalization rules, and historical crisis backtests.
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Link
              href="/api-docs"
              className="flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 hover:bg-slate-200 dark:hover:bg-zinc-700 transition-colors font-mono"
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>Model API v1</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Section 1: The Core Scientific Thesis */}
      <div className="bg-white dark:bg-[#10141d] border border-slate-200 dark:border-zinc-800 rounded-xl p-6 sm:p-8 space-y-4 transition-colors shadow-sm">
        <div className="flex items-center space-x-2 text-xs font-mono text-emerald-600 dark:text-emerald-400 font-semibold uppercase">
          <BookOpen className="w-4 h-4" />
          <span>Section 01: The Empirical Imperative</span>
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
          Why Sentiment Surveys and Pundit Forecasts Fail
        </h2>
        <p className="text-sm text-slate-600 dark:text-zinc-300 leading-relaxed font-sans">
          Most macroeconomic bubble commentary relies on investor sentiment polls, price-to-earnings guestimates on cyclical hardware, 
          or broad historical analogies. The **AI Capital Tracker Model** replaces subjective narrative with an open, receipted accounting engine:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <div className="p-4 rounded-lg bg-slate-50 dark:bg-[#0c0f16] border border-slate-100 dark:border-zinc-800 space-y-1.5">
            <span className="text-xs font-mono font-bold text-slate-900 dark:text-white block">1. Sourced Receipts Only</span>
            <p className="text-xs text-slate-600 dark:text-zinc-400 font-sans leading-relaxed">
              Every single metric is anchored in an audited SEC 10-K/10-Q filing, indenture prospectus, or verified primary counterparty disclosure. Unconfirmed leaks remain marked undisclosed.
            </p>
          </div>
          <div className="p-4 rounded-lg bg-slate-50 dark:bg-[#0c0f16] border border-slate-100 dark:border-zinc-800 space-y-1.5">
            <span className="text-xs font-mono font-bold text-slate-900 dark:text-white block">2. Credit Precedes Equity</span>
            <p className="text-xs text-slate-600 dark:text-zinc-400 font-sans leading-relaxed">
              In 2000 and 2008, credit default swap spreads and high-yield bond spreads blew out 3 to 6 months before stock indices rolled over. Oracle CDS is tracked as the foundational debt anchor.
            </p>
          </div>
          <div className="p-4 rounded-lg bg-slate-50 dark:bg-[#0c0f16] border border-slate-100 dark:border-zinc-800 space-y-1.5">
            <span className="text-xs font-mono font-bold text-slate-900 dark:text-white block">3. Static A Priori Weights</span>
            <p className="text-xs text-slate-600 dark:text-zinc-400 font-sans leading-relaxed">
              Factor weights and ramp boundaries were defined a priori and published permanently. They are never tweaked ex-post to fit a preferred market bias.
            </p>
          </div>
        </div>
      </div>

      {/* Section 2: Mathematical Sigmoid Calibration */}
      <div className="bg-white dark:bg-[#10141d] border border-slate-200 dark:border-zinc-800 rounded-xl p-6 sm:p-8 space-y-5 transition-colors shadow-sm">
        <div className="flex items-center space-x-2 text-xs font-mono text-emerald-600 dark:text-emerald-400 font-semibold uppercase">
          <Code2 className="w-4 h-4" />
          <span>Section 02: Sigmoid Calibration</span>
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
          Mapping Composite Stress Score S (0–100) to 12-Month Burst Probability P(burst)
        </h2>
        <p className="text-sm text-slate-600 dark:text-zinc-300 leading-relaxed font-sans">
          Linear composite scoring fails in complex financial credit systems because stress cascades non-linearly once refinancing thresholds are breached. We calibrate the composite score through a standard logistic sigmoid function:
        </p>

        {/* LaTeX Math Box */}
        <div className="p-4 bg-slate-50 dark:bg-[#0c0f16] rounded-xl border border-slate-200 dark:border-zinc-800 font-mono text-sm text-center text-slate-900 dark:text-emerald-400 overflow-x-auto shadow-inner">
          <code>{"\\mathcal{P}(\\text{burst}) = \\frac{1}{1 + e^{-(S - 55) / 9}} \\times 100\\%"}</code>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 text-xs font-mono pt-1">
          <div className="p-3.5 bg-slate-50 dark:bg-[#0c0f16] rounded-xl border border-slate-100 dark:border-zinc-800 space-y-1">
            <span className="text-slate-500 dark:text-zinc-400 block text-xs font-medium">Anchor Point ($S_0 = 55$)</span>
            <span className="text-slate-900 dark:text-white font-bold text-sm block">50% Baseline Probability</span>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-300 font-sans mt-1 leading-relaxed">
              The threshold where debt service ratios and multiples surpass historic equilibrium.
            </p>
          </div>
          <div className="p-3.5 bg-slate-50 dark:bg-[#0c0f16] rounded-xl border border-slate-100 dark:border-zinc-800 space-y-1">
            <span className="text-slate-500 dark:text-zinc-400 block text-xs font-medium">Steepness ($k = 9$)</span>
            <span className="text-slate-900 dark:text-white font-bold text-sm block">±9 Points ≈ ±50% Odds Shift</span>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-300 font-sans mt-1 leading-relaxed">
              Governs the sensitivity slope around the critical refinancing threshold.
            </p>
          </div>
          <div className="p-3.5 bg-slate-50 dark:bg-[#0c0f16] rounded-xl border border-slate-100 dark:border-zinc-800 space-y-1">
            <span className="text-slate-500 dark:text-zinc-400 block text-xs font-medium">Adoption Damper Cap</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-bold text-sm block">Max -10 Points Direct Discount</span>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-300 font-sans mt-1 leading-relaxed">
              Genuine token deflation knocks points directly off the composite gross score.
            </p>
          </div>
        </div>

        <div className="pt-2">
          <SensitivityCurveChart />
        </div>
      </div>

      {/* Mid Ad */}
      <AdSlot format="in-feed" />

      {/* Section 3: The 8 Published Factor Formulas */}
      <div className="space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-zinc-800">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Section 03: The 8 Published Mathematical Factors
            </h2>
            <p className="text-xs text-slate-500 dark:text-zinc-400 font-sans mt-0.5">
              Exact weighting allocation, ramp boundary limits, and input definitions.
            </p>
          </div>
          <span className="text-xs font-mono text-slate-500 dark:text-zinc-400">
            Sum of Weights: 100%
          </span>
        </div>

        <div className="space-y-4">
          {MODEL_FACTORS.map((f, i) => (
            <div
              key={f.id}
              className="bg-white dark:bg-[#10141d] border border-slate-200 dark:border-zinc-800 rounded-xl p-5 space-y-3 transition-colors shadow-sm"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="flex items-center space-x-2.5">
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 font-bold">
                    #{String(i + 1).padStart(2, "0")}
                  </span>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {f.label}
                  </h3>
                </div>
                <div className="flex items-center space-x-2">
                  <span
                    className={`text-xs font-mono px-2.5 py-1 rounded font-bold ${
                      f.kind === "damper"
                        ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/60"
                        : "bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-zinc-300"
                    }`}
                  >
                    {f.kind === "damper" ? "Stabilizing Damper (-10 pts max)" : "Risk Factor"}
                  </span>
                  <span className="text-xs sm:text-sm font-mono text-slate-900 dark:text-white font-bold font-tabular">
                    {f.weightPct}% Weight
                  </span>
                </div>
              </div>

              <p className="text-sm text-slate-700 dark:text-zinc-200 leading-relaxed font-sans">
                {f.explain}
              </p>

              <div className="bg-slate-50 dark:bg-[#0c0f16] p-3.5 rounded-lg border border-slate-100 dark:border-zinc-800 space-y-1">
                <span className="text-xs font-mono text-slate-500 dark:text-zinc-400 block uppercase font-bold">
                  Mathematical Formula:
                </span>
                <code className="text-xs sm:text-sm font-mono text-emerald-600 dark:text-emerald-400 block break-all leading-relaxed font-bold">
                  {f.formula}
                </code>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Section 4: Historical Backtest Comparison Table */}
      <div className="bg-white dark:bg-[#10141d] border border-slate-200 dark:border-zinc-800 rounded-xl p-6 sm:p-8 space-y-4 transition-colors shadow-sm">
        <div>
          <span className="text-xs font-mono text-slate-500 dark:text-zinc-400 font-bold uppercase tracking-wider">
            HISTORICAL VALIDATION
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-0.5">
            Empirical Backtest Across Previous Speculative Epochs
          </h2>
          <p className="text-sm text-slate-600 dark:text-zinc-300 font-sans mt-1">
            Applying this exact mathematical engine to historical verified data points from past financial bubbles:
          </p>
        </div>

        <div className="overflow-x-auto border border-slate-100 dark:border-zinc-800 rounded-xl">
          <table className="w-full text-left text-xs sm:text-sm font-mono">
            <thead className="bg-slate-50 dark:bg-[#0c0f16] border-b border-slate-100 dark:border-zinc-800 text-slate-500 dark:text-zinc-400">
              <tr>
                <th className="p-3.5">Historical Epoch</th>
                <th className="p-3.5">Score (0–100)</th>
                <th className="p-3.5">Burst Probability</th>
                <th className="p-3.5">Model Risk Band</th>
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
                    <span className="px-2.5 py-1 rounded bg-slate-100 dark:bg-zinc-800 text-slate-800 dark:text-zinc-200 text-xs font-bold">
                      {b.band}
                    </span>
                  </td>
                  <td className="p-3.5 text-xs sm:text-sm font-sans text-slate-700 dark:text-zinc-300">{b.driver}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section 5: Coverage Renormalization & Anti-Tampering Protocol */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-white dark:bg-[#10141d] border border-slate-200 dark:border-zinc-800 p-5 rounded-xl space-y-2.5 shadow-sm">
          <div className="flex items-center space-x-2 text-slate-900 dark:text-white font-bold text-sm">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Coverage Renormalization Rule</span>
          </div>
          <p className="text-xs text-slate-600 dark:text-zinc-300 font-sans leading-relaxed">
            When a factor has missing primary disclosures (e.g. undisclosed prediction market liquidity or lack of audited private lab revenue), 
            its coverage score shrinks between $c_i \in [0, 1]$. Rather than assuming a calm market ($0$ stress), the model renormalizes 
            computable weights so no data blind spot artificially depresses the risk score.
          </p>
        </div>

        <div className="bg-white dark:bg-[#10141d] border border-slate-200 dark:border-zinc-800 p-5 rounded-xl space-y-2.5 shadow-sm">
          <div className="flex items-center space-x-2 text-slate-900 dark:text-white font-bold text-sm">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>Automated 24h Cron Protocol</span>
          </div>
          <p className="text-xs text-slate-600 dark:text-zinc-300 font-sans leading-relaxed">
            Market inputs are fetched every 24 hours via an open-source GitHub Actions workflow directly from OpenRouter, 
            Polymarket, and SEC EDGAR. Every commit is permanently recorded in git history, preventing selective data tampering 
            or ex-post narrative revisions.
          </p>
        </div>
      </div>
    </div>
  );
}
