import React from "react";
import Link from "next/link";
import { SensitivitySandbox } from "@/components/SensitivitySandbox";
import { SensitivityCurveChart } from "@/components/VisualCharts";
import { AdSlot } from "@/components/AdSlot";
import { Sliders, ArrowLeft, BarChart3, AlertTriangle, ShieldAlert, Cpu, Sparkles, CheckCircle2 } from "lucide-react";

export default function SandboxPage() {
  const stressScenarios = [
    {
      name: "Current Verified Baseline",
      cds: "187 bp",
      debtShare: "29.1%",
      multiples: "42.4×",
      tokenDrop: "40×",
      prob: "68.4%",
      band: "High Stress",
      tag: "Live Reality",
      color: "border-slate-300 dark:border-zinc-700",
    },
    {
      name: "Credit Freeze / CDS Blowout",
      cds: "260 bp (+39%)",
      debtShare: "38.0%",
      multiples: "42.4×",
      tokenDrop: "40×",
      prob: "84.8%",
      band: "Critical",
      tag: "2008 Parallel",
      color: "border-rose-300 dark:border-rose-900",
    },
    {
      name: "Multiple Compression (18×)",
      cds: "187 bp",
      debtShare: "29.1%",
      multiples: "18.0× (-58%)",
      tokenDrop: "40×",
      prob: "48.2%",
      band: "Elevated",
      tag: "2022 Parallel",
      color: "border-amber-300 dark:border-amber-900",
    },
    {
      name: "Ubiquitous Soft-Landing",
      cds: "120 bp",
      debtShare: "22.0%",
      multiples: "25.0×",
      tokenDrop: "90× (-99%)",
      prob: "34.1%",
      band: "Guarded",
      tag: "Productivity Boom",
      color: "border-emerald-300 dark:border-emerald-900",
    },
  ];

  const elasticityRules = [
    { lever: "Oracle 5Y CDS Spread", change: "+10 bp", impact: "+1.8% Burst Odds", note: "Primary debt refinancing trigger for GPU cluster notes" },
    { lever: "Private Lab P/S Multiple", change: "-5.0×", impact: "-3.2% Burst Odds", note: "Earnings growth catches up to valuation run-rates" },
    { lever: "Token Price Deflation", change: "+10× Cheaper", impact: "-1.5% Burst Odds", note: "Real utility adoption expands unit margins" },
    { lever: "Debt Share in Ledger", change: "+5.0%", impact: "+2.4% Burst Odds", note: "Leverage increases sensitivity to rate volatility" },
    { lever: "Hyperscaler Capex / FCF", change: "+0.20×", impact: "+1.9% Burst Odds", note: "Infrastructure spending exceeds cash flow generation" },
  ];

  return (
    <div className="space-y-10">
      {/* Top Banner Ad */}
      <AdSlot format="leaderboard" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-200 dark:border-zinc-800">
        <div>
          <div className="flex items-center space-x-2 text-xs font-mono text-slate-500 dark:text-zinc-400">
            <Link href="/" className="hover:text-slate-900 dark:hover:text-white flex items-center space-x-1">
              <ArrowLeft className="w-3 h-3" />
              <span>Home</span>
            </Link>
            <span>/</span>
            <span className="text-slate-900 dark:text-white font-semibold">Macroeconomic Simulator</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight mt-1">
            Macroeconomic Sensitivity &amp; Stress Simulator
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-300 font-sans mt-1 max-w-3xl leading-relaxed">
            Test custom macroeconomic assumptions, debt maturity crunches, API token pricing deflation, 
            or private valuation re-ratings to observe the exact probability shift in real time.
          </p>
        </div>

        <Link
          href="/visualize"
          className="self-start sm:self-auto flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-semibold border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors shadow-sm"
        >
          <BarChart3 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>Bubble &amp; Radar Charts</span>
        </Link>
      </div>

      {/* Main Interactive Sandbox Component */}
      <SensitivitySandbox />

      {/* Stress Scenarios Comparison Matrix */}
      <div className="bg-white dark:bg-[#10141d] border border-slate-200 dark:border-zinc-800 rounded-xl p-6 sm:p-8 space-y-4 transition-colors shadow-sm">
        <div>
          <span className="text-xs font-mono text-slate-500 dark:text-zinc-400 font-bold uppercase tracking-wider">
            SCENARIO BENCHMARKS
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-0.5">
            Comparative Macroeconomic Stress Testing Matrix
          </h2>
          <p className="text-sm text-slate-600 dark:text-zinc-300 font-sans mt-0.5">
            Pre-computed probability distributions across verified market conditions and historical parallels.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
          {stressScenarios.map((sc) => (
            <div
              key={sc.name}
              className={`p-4 rounded-xl border ${sc.color} bg-slate-50/50 dark:bg-[#0c0f16]/60 space-y-3 flex flex-col justify-between`}
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="px-2 py-0.5 rounded bg-slate-200 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 font-bold">
                    {sc.tag}
                  </span>
                  <span className="font-bold text-slate-900 dark:text-white text-xs">{sc.band}</span>
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white leading-snug">
                  {sc.name}
                </h3>
              </div>

              <div className="space-y-1.5 text-xs sm:text-sm font-mono pt-1 border-t border-slate-200 dark:border-zinc-800/80">
                <div className="flex justify-between text-slate-500 dark:text-zinc-400">
                  <span>CDS Spread:</span>
                  <span className="text-slate-900 dark:text-zinc-100 font-bold">{sc.cds}</span>
                </div>
                <div className="flex justify-between text-slate-500 dark:text-zinc-400">
                  <span>Debt Share:</span>
                  <span className="text-slate-900 dark:text-zinc-100 font-bold">{sc.debtShare}</span>
                </div>
                <div className="flex justify-between text-slate-500 dark:text-zinc-400">
                  <span>Lab Multiple:</span>
                  <span className="text-slate-900 dark:text-zinc-100 font-bold">{sc.multiples}</span>
                </div>
                <div className="flex justify-between text-slate-500 dark:text-zinc-400">
                  <span>Token Drop:</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">{sc.tokenDrop}</span>
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
      <div className="bg-white dark:bg-[#10141d] border border-slate-200 dark:border-zinc-800 rounded-xl p-6 sm:p-8 space-y-4 transition-colors shadow-sm">
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
            <thead className="bg-slate-50 dark:bg-[#0c0f16] border-b border-slate-100 dark:border-zinc-800 text-slate-500 dark:text-zinc-400">
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
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center space-x-2">
          <BarChart3 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>Non-Linear Sigmoid Response Curve</span>
        </h3>
        <SensitivityCurveChart />
      </div>

      {/* Bottom Ad */}
      <AdSlot format="in-feed" />
    </div>
  );
}
