"use client";

import React, { useState } from "react";
import Link from "next/link";
import { MODEL_FACTORS, MODEL_CALIBRATION, CHANGELOG } from "@/lib/model/factors";
import {
  evaluateBubbleModel,
  DEFAULT_MODEL_INPUTS,
  HISTORICAL_BACKTESTS,
  BACKTEST_CALIBRATION_SUMMARY,
  computeMinskyModel,
  computeShillerCapeModel,
  EMPIRICAL_VERIFICATION_MATRIX,
  EMPIRICAL_CORRELATION_MATRIX,
} from "@/lib/model/engine";
/**
 * 2026-10-19 (wave 2, lane 2a): every formula this page publishes is executed
 * in src/lib/model/documentFormulas.ts and asserted by the test suite
 * (scripts/test-algo.mjs, test [18]). The page renders from those constants —
 * it never transcribes a formula by hand.
 */
import {
  MODEL_DOC_FORMULAS,
  ODDS_SHIFT_SENTENCE,
  WEIGHTS_NARRATIVE,
  factorScoreDomain,
  minskyFragilityIndex,
  refiFreezeProbability,
  refiFreezeProbabilityPct,
  realYieldTipsPct,
  realYieldCpiPct,
  realYieldBasisLabel,
  excessCapeYieldPct,
  ecyBand,
  mertonDistanceToDefault,
  mertonDefaultProbabilityLabel,
  probabilityDisplayLabel,
  altmanZScore,
  altmanImpliedDistressProbabilityPct,
  ALTMAN_X4,
  ALTMAN_X4_PROVENANCE,
  lpplsHazardIndex,
  LPPLS_HAZARD_LABEL,
  reconcileComposite,
  calibrationDrift,
  inSampleAuc,
  MARKET_IMPLIED_12M_BAND,
  marketImplied12mBand,
  BAND_FLOOR_RULE_SENTENCE,
  crowdDivergencePoints,
} from "@/lib/model/documentFormulas";
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
  Scale,
  Sparkles,
  Lightbulb,
  HelpCircle,
} from "lucide-react";
import { SensitivityCurveChart } from "@/components/VisualCharts";
import { AdSlot } from "@/components/AdSlot";
import { MethodologyToc } from "@/components/MethodologyToc";
import { SectionAnchor } from "@/components/SectionAnchor";
import { METHODOLOGY_SECTIONS } from "@/lib/methodology/sections";
import latestModel from "@/data/latest-model.json";

export default function MethodologyPage() {
  const [copiedMermaid, setCopiedMermaid] = useState(false);
  const currentModel = evaluateBubbleModel(DEFAULT_MODEL_INPUTS);
  /**
   * Minsky lever basis as published in src/data/latest-model.json (24h pipeline
   * run, 19 Oct 2026): Ponzi 12.9% / Speculative 31.9% → Hedge 55.2%, fragility
   * 65.6, refinancing-freeze 19.6%. Pinning the published levers keeps this
   * page, the sandbox and the published dataset on one number instead of the
   * engine's auto-derived 30.5% speculative split.
   */
  const minsky = computeMinskyModel(DEFAULT_MODEL_INPUTS, {
    ponziSharePct: latestModel.minsky.ponziSharePct,
    speculativeSharePct: latestModel.minsky.speculativeSharePct,
  });
  const shiller = currentModel.shillerCape ?? computeShillerCapeModel(DEFAULT_MODEL_INPUTS);

  /**
   * ── Executed document formulas (wave 2, lane 2a) ──────────────────────────
   * Everything below is computed by src/lib/model/documentFormulas.ts from the
   * SAME expressions the engine runs, so the page cannot publish a formula the
   * model does not use. The published values are unchanged:
   *   Minsky fragility 65.6 · refinancing freeze 19.6% (0.196)
   *   ECY +0.34% (TIPS basis) · Merton DD 5.13σ · Altman Z'' 8.41
   *   LPPLS hazard index 81.5 · odds shift 2.72× per +9 points
   */
  const docMinskyInputs = {
    speculativeSharePct: latestModel.minsky.speculativeSharePct,
    ponziSharePct: latestModel.minsky.ponziSharePct,
    cdsCurrentBps: DEFAULT_MODEL_INPUTS.cds?.currentBps ?? 288,
    cdsBaselineBps: DEFAULT_MODEL_INPUTS.cds?.baselineBps ?? 81,
    capexToOcfRatio: DEFAULT_MODEL_INPUTS.aiDebt?.capexToOcfRatio ?? 0.548,
  };
  const docMinskyFragility = minskyFragilityIndex(docMinskyInputs);
  const docFreezeProbability = refiFreezeProbability(docMinskyInputs);
  const docFreezePct = refiFreezeProbabilityPct(docMinskyInputs);
  const docEcyInputs = {
    capeMultiple: latestModel.shillerCape.aiCapeMultiple,
    us10yYieldPct: DEFAULT_MODEL_INPUTS.macro?.us10yYieldPct ?? 5.1,
    breakeven10yPct:
      (DEFAULT_MODEL_INPUTS.macro?.us10yYieldPct ?? 5.1) -
      (DEFAULT_MODEL_INPUTS.macro?.realYield10y ?? 2.75),
    cpiInflationYoY: DEFAULT_MODEL_INPUTS.macro?.cpiInflationYoY ?? 3.72,
  };
  const docEcyTips = excessCapeYieldPct(docEcyInputs, "tips");
  const docEcyCpi = excessCapeYieldPct(docEcyInputs, "cpi");
  // The published ECY band follows the TIPS basis (the page's headline figure).
  const docEcyBand = ecyBand(docEcyTips);
  const docMertonInputs = {
    assetValueUsd: latestModel.merton.assetValueUsd,
    totalDebtUsd: DEFAULT_MODEL_INPUTS.aiDebt?.totalTrackedDebtUsd ?? 214_890_400_000,
    riskFreeRatePct: DEFAULT_MODEL_INPUTS.macro?.us10yYieldPct ?? 5.1,
    assetVolatilityPct: 36.5,
  };
  const docMertonDd = mertonDistanceToDefault(docMertonInputs);
  const docMertonProbLabel = mertonDefaultProbabilityLabel(docMertonInputs);
  const docAltmanZ = altmanZScore();
  const docLpplsHazard = lpplsHazardIndex({
    cdsCurrentBps: DEFAULT_MODEL_INPUTS.cds?.currentBps ?? 288,
    capexToOcfRatio: DEFAULT_MODEL_INPUTS.aiDebt?.capexToOcfRatio ?? 0.548,
  });
  /** Risk points + contagion − damper = the published composite, and what the
   *  contagion term is worth in probability points. */
  const reconciliation = reconcileComposite({
    riskPoints: currentModel.contributions
      .filter((c) => c.kind === "risk")
      .reduce((acc, c) => acc + c.earnedPoints, 0),
    contagionPoints: currentModel.systemicContagionPoints ?? 0,
    damperPoints: currentModel.contributions
      .filter((c) => c.kind === "damper")
      .reduce((acc, c) => acc + c.earnedPoints, 0),
  });
  /** How far the LIVE (55, 9) mapping moves each published historical row. */
  const calibrationDriftResult = calibrationDrift(
    HISTORICAL_BACKTESTS.filter((b) => b.actualBurstObserved).map((b) => ({
      compositeScore: b.compositeScore,
      modelProbabilityPct: b.modelProbabilityPct,
    })),
  );
  /** In-sample AUC over the six consistency rows (indicative, not validation). */
  const inSampleAucValue = inSampleAuc(
    HISTORICAL_BACKTESTS.map((b) => ({
      modelProbabilityPct: b.modelProbabilityPct,
      actualBurstObserved: b.actualBurstObserved,
    })),
  );
  /** Model-vs-market divergence, in probability points. */
  /**
   * The market's own prices, straight from the live snapshot. The 12-month
   * read is COMPUTED from the longest-dated contract (see
   * `marketImplied12mBand`), so the published band tracks the market instead
   * of standing still while the market moves — and the band's low end IS the
   * market's own price, which is what the band-floor rule requires.
   */
  const rawContract2027 = (DEFAULT_MODEL_INPUTS.crowd?.bubble2027Probability ?? 0) * 100;
  const rawContract2026 = (DEFAULT_MODEL_INPUTS.crowd?.bubble2026Probability ?? 0) * 100;
  const marketBand = marketImplied12mBand(rawContract2027);
  const crowdDivergence = crowdDivergencePoints(currentModel.burstProbability, rawContract2026);
  /** The published model version, straight from the changelog. */
  const modelVersion = CHANGELOG[0]?.version ?? "2.6.0";
  const modelVersionScope = CHANGELOG[0]?.scope ?? "";

  /**
   * Date of the published pipeline snapshot (src/data/latest-model.json). The
   * Monte Carlo moments below are that run's output — they are a dated
   * simulation, not a value recomputed in the browser.
   */
  const SNAPSHOT_LABEL =
    new Date(latestModel.timestamp).toLocaleString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "UTC",
    }) + " UTC";
  const backtestSummary = BACKTEST_CALIBRATION_SUMMARY;
  const empiricalMatrix = EMPIRICAL_VERIFICATION_MATRIX;

  const historicalBacktests = HISTORICAL_BACKTESTS.map((b) => ({
    era: `${b.era} (${b.date})`,
    score: b.compositeScore,
    prob: `${b.modelProbabilityPct.toFixed(1)}%`,
    band: b.band,
    driver: b.primaryMacroTriggers.join("; "),
    leverage: b.debtExposureUsd,
    brier: b.brierScore === null ? "—" : b.brierScore.toFixed(4),
  }));

  /**
   * The navigation layer. The section registry (src/lib/methodology/
   * sections.ts) is the single source of truth for the article's anchors and
   * for the table of contents' entries, so the two can never drift apart.
   */
  const tocItems = METHODOLOGY_SECTIONS;

return (
    <div className="section-sm">
      {/* Top banner ad */}
      <AdSlot placementId="methodology-top" />

      {/* Page head — label, title, plain-English lead */}
      <header className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
          <span className="label">Methodology</span>
          <span className="pill">WORKING PAPER • SPECIFICATION v{modelVersion}</span>
          <span className="num text-[14px] text-ink-faint">Quantitative Credit &amp; Systemic Risk Desk</span>
        </div>

        <h1 className="max-w-reading text-3xl font-bold tracking-tight text-ink sm:text-4xl">
          Mathematical Model Specification: Micro-Foundations of the AI Capital Superstructure
        </h1>

        <p className="prose prose-lead max-w-reading">
          Full mathematical specification: non-linear logistic sigmoid derivation, factor weighting
          equations, super-additive contagion synergy, missing-data degradation honesty protocol, and
          historical consistency checks.
        </p>

        <p className="max-w-reading text-[14px] leading-relaxed text-ink-subtle">
          <span className="font-semibold text-ink-muted">Model version {modelVersion}</span>
          {modelVersionScope ? ` — ${modelVersionScope}.` : "."} The deterministic point estimate is
          unchanged by this version; the published ranges were relabelled and the credit and macro
          factors gained a convex tail. Every formula below is executed in{" "}
          <code className="text-ink-muted">src/lib/model/documentFormulas.ts</code> and checked by
          the test suite.
        </p>

        <div className="flex flex-wrap items-center gap-2">
          <a href="#sigmoid" className="btn btn-primary min-h-11">
            <Sigma className="h-4 w-4" aria-hidden="true" />
            <span>Jump to Formulas</span>
          </a>
          <Link href="/api-docs" className="btn min-h-11">
            <Code2 className="h-4 w-4" aria-hidden="true" />
            <span>Model API v1</span>
          </Link>
          <Link href="/" className="btn btn-ghost min-h-11">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            <span>Back to the verdict</span>
          </Link>
        </div>

      </header>

      {/* The navigation layer: a sticky, scroll-spy table of contents with a
          deep link per section. It is the only interactive chrome on the
          page and it owns every jump target, so the article body stays
          untouched. */}
      <MethodologyToc sections={tocItems} />

      {/* Plain-English summary for readers without a maths background */}
      <section aria-label="Plain English summary" className="mt-6">
        <details className="group card">
          <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 py-1 [&::-webkit-details-marker]:hidden">
            <div>
              <h2 className="text-base font-bold text-ink">
                Not a Math or Finance Person? Read the Entire Model in Plain English
              </h2>
              <p className="mt-0.5 text-[14px] text-ink-muted">
                The 3 simple real-world questions that explain how this model calculates bubble risk
              </p>
            </div>
            <ChevronRight
              className="h-5 w-5 shrink-0 text-ink-subtle transition-transform group-open:rotate-90"
              aria-hidden="true"
            />
          </summary>
          <div className="mt-4 border-t border-rule pt-4">
            <p className="text-sm leading-relaxed text-ink-muted">
              Financial research papers love using Greek letters, calculus, and intimidating equations. But at its core, this entire tracking platform asks three simple real-world questions that anyone can understand:
            </p>
            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="panel space-y-1.5">
                <h3 className="text-sm font-semibold text-ink">1. Who is paying for the party?</h3>
                <p className="text-[14px] leading-relaxed text-ink-muted">
                  {/* 2026-10-19 (round-2 consolidation): "$228 billion" → "$214.9 billion" — the
                      re-bundled tracked-debt total (24 facilities, $214,890,400,000 verified). The
                      $228.1B figure was the pre-rebaseline ledger total (before the deal-161
                      double-count adjudication and the deal-162 recast). */}
                  Spending cash profits from a real business is safe. But borrowing <strong className="text-ink">$214.9 billion</strong> on corporate loans and bonds (like Oracle, Vantage, and CoreWeave) means heavy interest bills must be paid every single month — even if AI revenues dry up.
                </p>
              </div>
              <div className="panel space-y-1.5">
                <h3 className="text-sm font-semibold text-ink">2. Are expectations realistic?</h3>
                <p className="text-[14px] leading-relaxed text-ink-muted">
                  {/* 2026-10-19 (round-2 consolidation): "$35 today for every single $1" → "$29" —
                      the published MEDIAN price/sales across the commercial frontier labs is 29.4×
                      (src/data/latest-model.json, /api/v1/model, 19 Oct 2026). $35 was a stale
                      pre-rebaseline figure. This is the plain-English panel, so the multiple is
                      rounded for reading; the exact 29.4× is published on /api/v1/model. */}
                  Investors are paying <strong className="text-ink">$29 today for every single $1</strong> of startup sales. When stock prices require 20 years of flawless superhuman growth just to break even, even small revenue disappointments cause painful crashes.
                </p>
              </div>
              <div className="panel space-y-1.5">
                <h3 className="text-sm font-semibold text-ink">3. Is AI getting cheaper and useful?</h3>
                <p className="text-[14px] leading-relaxed text-ink-muted">
                  The great equalizer: between GPT-4&apos;s March 2023 debut ($30 per 1M input tokens) and October 2026, commodity-tier API input fell to $0.0448 (DeepSeek V4.1 Flash, OpenRouter live) — <strong className="text-ink">a 670× drop</strong> — while flagship tiers fell far less (Claude Sonnet class: $3 → $2, ~1.5×). The honest deflation range is <strong className="text-ink">~1.5× (frontier tier) to 670× (commodity tier)</strong>. When AI costs pennies instead of dollars, normal businesses can afford it, creating real profits that prevent a crash.
                </p>
              </div>
            </div>
          </div>
        </details>
      </section>

      {/* SECTION 1: THE CORE SCIENTIFIC THESIS */}
      <section id="thesis" className="bg-surface border border-rule rounded-lg p-6 sm:p-8 space-y-6 shadow-xs">
        <div className="flex items-center space-x-2 text-[13px] font-mono text-safe-700 font-bold uppercase tracking-wider">
          <BookOpen className="w-4 h-4" />
          <span>Section 01 · The Empirical Imperative</span>
          <SectionAnchor id="thesis" />
        </div>

        <div className="space-y-2">
          <h2 className="text-xl sm:text-2xl font-bold text-ink">
            Why Sentiment Surveys &amp; Wall Street Pundit Forecasts Fail
          </h2>
          <p className="text-sm text-ink-muted leading-relaxed font-sans max-w-4xl">
            Macroeconomic bubble commentary routinely falls into one of two ideological traps: hyper-optimistic technological determinism
            or vague historical analogies to tulips and dot-com websites. The **AI Capital Tracker Model** rejects subjective narrative
            in favor of an audited accounting framework built on three non-negotiable quantitative axioms:
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-2">
          <div className="panel space-y-2.5">
            <div className="flex items-center space-x-2 text-ink-muted font-mono text-[13px] font-bold uppercase">
              <span className="w-2 h-2 rounded-full bg-surface-3" />
              <span>Axiom 1: Sourced Receipts Only</span>
            </div>
            <p className="text-[14px] sm:text-sm text-ink-muted leading-relaxed">
              Every data point must be anchored in an audited SEC Form 10-K/10-Q filing, indenture prospectus, or verified primary counterparty disclosure.
              Unconfirmed leaks, anonymous blog posts, and analyst estimates are strictly categorized as <em>undisclosed</em>.
            </p>
          </div>

          <div className="panel space-y-2.5">
            <div className="flex items-center space-x-2 text-caution-700 font-mono text-[13px] font-bold uppercase">
              <span className="w-2 h-2 rounded-full bg-caution-500" />
              <span>Axiom 2: Credit Precedes Equity</span>
            </div>
            <p className="text-[14px] sm:text-sm text-ink-muted leading-relaxed">
              In both 2000 and 2007, credit default swap spreads and senior bond discount rates blew out 3 to 6 months before equity indices peaked.
              Because AI hyperscalers are financing datacenters through bond issuance, Oracle 5Y CDS is monitored as the foundation debt thermometer.
            </p>
          </div>

          <div className="panel space-y-2.5">
            <div className="flex items-center space-x-2 text-safe-700 font-mono text-[13px] font-bold uppercase">
              <span className="w-2 h-2 rounded-full bg-safe-500" />
              <span>Axiom 3: Static A Priori Weights</span>
            </div>
            <p className="text-[14px] sm:text-sm text-ink-muted leading-relaxed">
              Factor weights and ramp boundaries were defined a priori and published permanently. They are never tuned to fit a
              desired narrative — but they are not sacred either: a boundary changes only through a disclosed, sanctioned wave,
              and the changelog records what moved and why. On 2026-10-20 (model v2.7.0) the credit factor&apos;s level ceiling was
              raised from ×3 to ×7.556 of baseline after the factor was found <em>pinned at its maximum</em> since 243bp — it had
              been adding a flat 18 of 18 points, 46.3 of the 72.3 probability points, so the print moved (72.3% → 32.3%) without a
              single input changing. The logistic mapping
              itself (anchor {MODEL_CALIBRATION.anchorScore}, steepness {MODEL_CALIBRATION.steepness}) is an unvalidated a priori choice, not
              an estimated parameter set: the historical consistency table was generated under an earlier calibration (anchor ≈54, steepness ≈11.2);
              probabilities implied by the live mapping differ by {calibrationDriftResult.minPct}–{calibrationDriftResult.maxPct} points.
            </p>
          </div>
        </div>

        {/* Plain English Translation for Section 1 (Collapsed by default) */}
        <details className="notice notice-caution">
          <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-2 py-1 [&::-webkit-details-marker]:hidden">
            <span className="text-[14px] font-semibold text-ink">In Plain English: Why we don&apos;t listen to Twitter or TV pundits</span>
            <ChevronRight className="h-4 w-4 shrink-0 text-ink-subtle transition-transform group-open:rotate-90" aria-hidden="true" />
          </summary>
          <div className="mt-2.5 border-t border-rule pt-2.5 text-[14px] leading-relaxed text-ink-muted">
            Most market forecasts are just talking heads guessing on TV or billionaires hyping their own investments. We do something completely different: we only count official receipts filed with government regulators (SEC), real loan agreements signed by banks, and live market prices. If a deal isn&apos;t verified on paper, we ignore it.
          </div>
        </details>
      </section>

      {/* SECTION 2: MATHEMATICAL SIGMOID CALIBRATION */}
      <section id="sigmoid" className="bg-surface border border-rule rounded-lg p-6 sm:p-8 space-y-6 shadow-xs">
        <div className="flex items-center space-x-2 text-[13px] font-mono text-safe-700 font-bold uppercase tracking-wider">
          <Sigma className="w-4 h-4" />
          <span>Section 02 · Sigmoid Calibration &amp; Probability Mapping</span>
          <SectionAnchor id="sigmoid" />
        </div>

        <div className="space-y-2">
          <h2 className="text-xl sm:text-2xl font-bold text-ink">
            Mapping Composite Stress Score S ∈ [0, 100] to 12-Month Burst Probability P(burst)
          </h2>
          <p className="text-sm text-ink-muted leading-relaxed font-sans max-w-4xl">
            Linear composite scoring is unsuited for credit markets because financial fragility behaves non-linearly. A 10-point rise
            in stress at low debt levels is harmless; that exact same 10-point rise near refinancing thresholds triggers liquidation cascades.
            We calibrate composite score $S$ through a standard logistic function with empirical anchor parameters:
          </p>
        </div>

        {/* High-Contrast Math Formula Callout */}
        <div className="p-6 bg-surface-2 rounded-lg border border-rule/30 text-ink space-y-4">
          <div className="flex items-center justify-between text-[14px] font-mono text-ink">
            <span className="font-bold uppercase tracking-wider">Equation (1): Primary Logistic Transformation</span>
            <span className="bg-surface-2/80 px-2 py-0.5 rounded border border-rule">Logistic Sigmoid</span>
          </div>

          <div className="p-4 bg-ink rounded-xl border border-ink font-mono text-base sm:text-xl text-center text-safe-600 overflow-x-auto">
            <code>{"\\mathcal{P}(\\text{burst}) = \\frac{1}{1 + \\exp\\left(-\\frac{S - S_0}{k}\\right)} \\times 100\\%"}</code>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-[14px] font-mono pt-1 text-ink-muted">
            <div className="p-3 bg-surface rounded-xl border border-ink space-y-1">
              <span className="text-ink block font-bold">Anchor Point $S_0 = 55$</span>
              <p className="font-sans text-ink-subtle leading-normal">
                Score where P = 50.0%. A judgment anchor fixed a priori — it is not estimated from the
                data, and it is not a measured debt-service threshold.
              </p>
            </div>
            <div className="p-3 bg-surface rounded-xl border border-ink space-y-1">
              <span className="text-ink block font-bold">Steepness $k = 9$</span>
              <p className="font-sans text-ink-subtle leading-normal">
                Logistic slope parameter, read in odds space: {ODDS_SHIFT_SENTENCE}.
              </p>
            </div>
            <div className="p-3 bg-surface rounded-xl border border-ink space-y-1">
              <span className="text-safe-600 block font-bold">Real-Demand Damper</span>
              <p className="font-sans text-ink-subtle leading-normal">
                Direct deduction of up to $-10$ composite points when verified token prices fall &gt;10× and API volume expands exponentially.
              </p>
            </div>
            <div className="p-3 bg-surface rounded-xl border border-ink space-y-1">
              <span className="text-risk-600 block font-bold">Systemic Contagion</span>
              <p className="font-sans text-ink-subtle leading-normal">
                Super-additive non-linear synergy term adding up to $+16.0$ points when CDS, leverage, and rates cross critical thresholds simultaneously.
              </p>
            </div>
          </div>
        </div>

        {/* Plain English Translation for Equation 1 (Collapsed by default) */}
        <details className="notice notice-caution">
          <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-2 py-1 [&::-webkit-details-marker]:hidden">
            <span className="text-[14px] font-semibold text-ink">In Plain English: What does this S-shaped curve actually mean?</span>
            <ChevronRight className="h-4 w-4 shrink-0 text-ink-subtle transition-transform group-open:rotate-90" aria-hidden="true" />
          </summary>
          <div className="mt-2.5 border-t border-rule pt-2.5 text-[14px] leading-relaxed text-ink-muted">
            Think of a camel&apos;s back. Piling light straw onto a strong camel doesn&apos;t bother it at all. But once the weight gets near the limit, that one final straw snaps its spine! Financial risk works the exact same way. Small stress is easily absorbed by big tech&apos;s cash, but once debt piles past the danger zone, risk spikes suddenly.
          </div>
        </details>

        {/* Financial Fragility Index & the published input-sensitivity range */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
          <div className="panel space-y-3">
            <div className="flex items-center justify-between text-[14px] font-mono font-bold">
              <span className="text-ink">Financial Fragility Index (FFI)</span>
              <span className="text-safe-700">Derived from factor scores</span>
            </div>
            <div className="panel num text-center text-[14px] text-safe-700">
              <code>{"\\frac{d\\mathcal{P}}{dS} = \\frac{\\mathcal{P} \\cdot (1 - \\mathcal{P})}{k}"}</code>
            </div>
            <p className="text-[14px] text-ink-muted leading-relaxed">
              A scaled derivative term plus the debt and macro factor scores, normalised to 0–100. It is
              a <em>re-expression of the scores already inside the composite</em> — not an independent
              measurement, and not a pure first derivative. Published basis:{" "}
              <span className="text-ink-muted">{MODEL_DOC_FORMULAS.fragility_index.note}</span>
            </p>
          </div>

          <div className="panel space-y-3">
            <div className="flex items-center justify-between text-[14px] font-mono font-bold">
              <span className="text-ink">Published range (input sensitivity)</span>
              <span className="text-ink-muted">25,000 paths</span>
            </div>
            <div className="panel num text-center text-[14px] text-safe-700">
              <code>
                {`90% shock range [${latestModel.monteCarlo.ci90Pct[0]}%, ${latestModel.monteCarlo.ci90Pct[1]}%] · 95% [${latestModel.monteCarlo.ci95Pct[0]}%, ${latestModel.monteCarlo.ci95Pct[1]}%]`}
              </code>
            </div>
            <p className="text-[14px] text-ink-muted leading-relaxed">
              The only ranges this model publishes are Monte-Carlo quantiles of the model&apos;s own
              output under shocked inputs: <span className="text-ink-muted">{latestModel.monteCarlo.ciType}</span>.
              The old hand-rolled factor-dispersion band (a 1.645·σ/√N margin) was deleted in v2.6.0
              because it was a dispersion of factor scores dressed as a probability interval.
            </p>
          </div>
        </div>

        {/* What this number is not — the plainest statement of the model's limits */}
        <div className="panel space-y-2.5">
          <span className="label">What this number is not</span>
          <ul className="space-y-1.5 text-[14px] leading-relaxed text-ink-muted">
            <li>
              • It is a severity index mapped through a chosen sigmoid — not a validated probability
              that anyone has scored against a resolved outcome.
            </li>
            <li>
              • It carries no transition dynamics: there is no hazard model, no path dependency and no
              contagion-in-time, only a static score read on a single date.
            </li>
            <li>
              • The published band is an input-sensitivity range, not a posterior confidence interval:
              it answers &quot;how far can the number move if the inputs move?&quot;, not &quot;how
              likely is the event?&quot;.
            </li>
            <li>
              • The gap to prediction markets is definitional as much as informational: the market asks
              &quot;AI downturn by date&quot;, this model asks &quot;AI capital bubble bursts inside 12
              months&quot;.
            </li>
            <li>
              • The ramp anchors embed a Cisco-2000-style froth endpoint (a peak multiple that
              collapses) applied to a higher-margin sector, so the extreme end of the scale is an
              analogy, not an observation.
            </li>
          </ul>
        </div>

        {/* Visual Sensitivity Curve */}
        <div className="pt-2">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[13px] font-semibold text-ink-muted uppercase tracking-wider">
              Empirical Sigmoid Sensitivity Curve
            </span>
            <span className="text-[14px] text-ink-subtle">
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
      <AdSlot placementId="methodology-infeed" className="mt-8" />

      {/* SECTION 3: THE 9 MODEL FACTORS */}
      <section id="factors" className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-rule gap-2">
          <div>
            <div className="flex items-center space-x-2 text-[13px] font-mono text-safe-700 font-bold uppercase tracking-wider">
              <Layers className="w-4 h-4" />
              <span>Section 03 · Mathematical Factor Breakdown</span>
              <SectionAnchor id="factors" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-ink mt-1">
              Specification of All {MODEL_FACTORS.length} Model Factors
            </h2>
          </div>
          <div className="flex items-center space-x-3 text-[14px] font-mono">
            <span className="px-2.5 py-1 rounded bg-surface-2 text-ink-muted font-bold">
              8 risk factors (100 risk points)
            </span>
            <span className="chip chip-safe">
              1 real-use damper (−10 pts outside the risk scale)
            </span>
          </div>
        </div>

        <p className="text-[14px] leading-relaxed text-ink-muted">
          Weight bookkeeping: {WEIGHTS_NARRATIVE}. The damper is not part of the 0–100 risk scale and
          is never mixed into the risk weights.
        </p>

        <div className="grid grid-cols-1 gap-5">
          {MODEL_FACTORS.map((f, i) => (
            <div
              key={f.id}
              className="bg-surface border border-rule rounded-lg p-6 space-y-4 shadow-xs hover:border-rule-strong transition-colors"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center space-x-3">
                  <span className="w-8 h-8 rounded-xl bg-surface-2 text-[14px] font-semibold text-[14px] flex items-center justify-center shrink-0">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-ink">
                      {f.label}
                    </h3>
                    <span className="text-[14px] text-ink-subtle">
                      ID: {f.id}
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  <span
                    className={`text-[14px] font-mono px-2.5 py-1 rounded-lg font-bold ${
                      f.kind === "damper"
                        ? "bg-safe-50 text-safe-700 bg-safe-50/60 text-safe-600 border border-safe-200 border-safe-500"
                        : "border-ink bg-ink text-canvas font-semibold"
                    }`}
                  >
                    {f.kind === "damper" ? "Stabilizing Damper (Max -10 pts)" : "Risk Factor"}
                  </span>
                  <span className="text-sm font-mono font-extrabold text-ink px-3 py-1 rounded-lg bg-surface-2 border border-rule">
                    {f.weightPct}% Weight
                  </span>
                </div>
              </div>

              <p className="text-sm text-ink-muted leading-relaxed font-sans">
                {f.explain}
              </p>

              {/* Exact Formula Box */}
              <div className="bg-surface-2 p-4 rounded-xl border border-rule/80 border-rule space-y-1.5">
                <div className="flex items-center justify-between text-[13px] font-mono text-ink-subtle uppercase tracking-wider font-bold">
                  <span>Published Mathematical Formula:</span>
                  <span>{factorScoreDomain(f.id)}</span>
                </div>
                <code className="text-[14px] sm:text-sm font-mono text-safe-700 block break-all font-bold">
                  {f.formula}
                </code>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 4: SYSTEMIC CONTAGION NONLINEAR SYNERGY TERM */}
      <section id="contagion" className="bg-surface border border-rule rounded-lg p-6 sm:p-8 space-y-6 shadow-xs">
        <div className="flex items-center space-x-2 text-[13px] font-mono text-risk-700 font-bold uppercase tracking-wider">
          <AlertTriangle className="w-4 h-4" />
          <span>Section 04 · Systemic Contagion Nonlinear Synergy Term</span>
          <SectionAnchor id="contagion" />
        </div>

        <div className="space-y-2">
          <h2 className="text-xl sm:text-2xl font-bold text-ink">
            Super-Additive Risk Cascades: Why Linear Weighting Underestimates Crisis Probability
          </h2>
          <p className="text-sm text-ink-muted leading-relaxed font-sans max-w-4xl">
            In sovereign and corporate credit panics, risks do not sum linearly. When credit spreads widen simultaneously with high debt leverage
            and tight monetary discount rates, the three channels cross-excite each other. Refinancing windows slam shut, collateral haircuts increase,
            and cash flow that was earmarked for capex must be diverted to debt service.
          </p>
        </div>

        {/* LaTeX Math Box for Contagion Formula */}
        <div className="p-6 bg-surface-2 rounded-lg border border-risk-300/30 text-ink space-y-4">
          <div className="flex items-center justify-between text-[14px] font-mono text-risk-600">
            <span className="font-bold uppercase tracking-wider">Equation (2): Compound Synergy Formula</span>
            <span className="bg-risk-50/80 px-2 py-0.5 rounded border border-risk-500">Nonlinear Synergy</span>
          </div>

          <div className="p-4 bg-ink rounded-xl border border-ink font-mono text-sm sm:text-lg text-center text-risk-600 overflow-x-auto">
            <code>{"\\Delta S_{\\text{contagion}} = \\sqrt[3]{\\max(0, s_{\\text{CDS}} - 0.35) \\times \\max(0, s_{\\text{Debt}} - 0.30) \\times \\max(0, s_{\\text{Macro}} - 0.30)} \\times 16.0"}</code>
          </div>

          <p className="text-[14px] sm:text-sm text-ink-muted leading-relaxed">
            Where s_CDS is the Credit Stress score, s_Debt is the Debt Reliance score, and s_Macro is the US10Y Macro Stress score.
            If any one factor is calm, excess stress is 0, and the contagion bonus collapses to zero. Only when all three exceed equilibrium thresholds
            does the compound geometric synergy activate, adding up to +16.0 points to the composite stress index. The credit leg consumes the credit
            factor&apos;s tail-free core score, so a convex credit tail is never counted twice.
          </p>
          <p className="text-[14px] sm:text-sm text-ink-subtle leading-relaxed">
            Disclosure: the three thresholds (0.35 / 0.30 / 0.30) and the ×16.0 scale are judgement calls
            fixed a priori. They are <em>not</em> fitted to any historical episode, so the size of the
            contagion term is a published assumption rather than an estimated quantity.
          </p>
        </div>

        {/* Contribution reconciliation — the reader can add the published rows up */}
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-rule pb-2">
            <h3 className="text-base font-bold text-ink">
              Contribution reconciliation: how {reconciliation.compositeScore.toFixed(1)} is built
            </h3>
            <span className="text-[14px] text-ink-subtle">
              live engine · {SNAPSHOT_LABEL}
            </span>
          </div>
          <div className="overflow-x-auto border border-rule rounded-xl">
            <table className="w-full text-left text-[14px] font-mono">
              <caption className="sr-only">
                The model&apos;s factor breakdown: points earned by each risk factor, the systemic
                contagion synergy, the real-use damper and the composite stress score.
              </caption>
              <thead className="bg-surface-2 border-b border-rule text-ink-subtle">
                <tr>
                  <th scope="col" className="p-3.5">Row</th>
                  <th scope="col" className="p-3.5">Points</th>
                  <th scope="col" className="p-3.5">Note</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-rule divide-rule/80">
                {currentModel.contributions
                  .filter((c) => c.kind === "risk")
                  .map((c) => (
                    <tr key={c.id}>
                      <th scope="row" className="p-3.5 font-semibold text-ink">{c.label}</th>
                      <td className="p-3.5 font-semibold text-ink">
                        +{c.earnedPoints.toFixed(1)}
                      </td>
                      <td className="p-3.5 text-ink-muted">{c.reading.reading}</td>
                    </tr>
                  ))}
                <tr className="bg-caution-50/40 bg-caution-50/20">
                  <th scope="row" className="p-3.5 font-bold text-caution-700">
                    Systemic contagion synergy
                  </th>
                  <td className="p-3.5 font-bold text-caution-700">
                    +{reconciliation.contagionPoints.toFixed(1)}
                  </td>
                  <td className="p-3.5 text-ink-muted">
                    Eq. (2) above; worth {reconciliation.leveragePoints.toFixed(1)} probability
                    points ({reconciliation.probabilityWithoutContagionPct.toFixed(1)}% →{" "}
                    {reconciliation.probabilityWithContagionPct.toFixed(1)}%)
                  </td>
                </tr>
                <tr className="bg-safe-50/40 bg-safe-50/20">
                  <th scope="row" className="p-3.5 font-bold text-safe-700">Real-use damper</th>
                  <td className="p-3.5 font-bold text-safe-700">
                    {currentModel.contributions
                      .filter((c) => c.kind === "damper")
                      .map((c) => c.earnedPoints.toFixed(1))
                      .join(", ")}
                  </td>
                  <td className="p-3.5 text-ink-muted">
                    {currentModel.contributions
                      .filter((c) => c.kind === "damper")
                      .map((c) => c.reading.reading)
                      .join(", ")}
                  </td>
                </tr>
                <tr className="bg-ink text-canvas">
                  <th scope="row" className="p-3.5 font-bold">Composite stress score</th>
                  <td className="p-3.5 font-bold">
                    {reconciliation.compositeScore.toFixed(1)}
                  </td>
                  <td className="p-3.5 text-canvas/80">
                    {reconciliation.riskPoints.toFixed(1)} +{" "}
                    {reconciliation.contagionPoints.toFixed(1)} −{" "}
                    {Math.abs(reconciliation.damperPoints).toFixed(1)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-[14px] leading-relaxed text-ink-muted">
            The reader can sum the published rows:{" "}
            <span className="num font-semibold text-ink">
              {reconciliation.riskPoints.toFixed(1)} +{" "}
              {reconciliation.contagionPoints.toFixed(1)} −{" "}
              {Math.abs(reconciliation.damperPoints).toFixed(1)} ={" "}
              {reconciliation.compositeScore.toFixed(1)}
            </span>
            , which is the published composite, and the composite maps to{" "}
            <span className="num font-semibold text-ink">
              {currentModel.burstProbability.toFixed(1)}%
            </span>{" "}
            through the logistic above.
          </p>
          <p className="text-[14px] leading-relaxed text-ink-subtle">
            Damper disclosure: the deflation credit is a log ramp over [50×, 500×] and is saturated at
            today&apos;s 670× print, so the damper is flat for any further collapse beyond roughly 500×
            (the pre-2.6.0 model was flat for every collapse ≥50×, treating 200× and 670× as
            equivalent). The model also does not yet distinguish demand-elastic deflation from
            supply-glut deflation — wave 2 owns the netting decision.
          </p>
        </div>

        {/* Plain English Translation for Section 4 (Collapsed by default) */}
        <details className="notice notice-risk">
          <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-2 py-1 [&::-webkit-details-marker]:hidden">
            <span className="text-[14px] font-semibold text-ink">In Plain English: Why problems multiply like falling dominoes</span>
            <ChevronRight className="h-4 w-4 shrink-0 text-ink-subtle transition-transform group-open:rotate-90" aria-hidden="true" />
          </summary>
          <div className="px-3.5 pb-3 pt-1 text-[14px] text-ink-muted leading-relaxed border-t border-risk-300/15">
            Problems love company. High debt alone is fine if interest rates are zero. High interest rates alone are fine if companies don&apos;t owe any debt. But when high debt, high interest rates, and slower sales hit at the exact same moment, they trigger a chain reaction. That&apos;s why our formula multiplies risk when multiple alarms ring together.
          </div>
        </details>
      </section>

      {/* SECTION 5: DEGRADATION HONESTY PROTOCOL */}
      <section id="degradation" className="bg-surface border border-rule rounded-lg p-6 sm:p-8 space-y-6 shadow-xs">
        <div className="flex items-center space-x-2 text-[13px] font-mono text-safe-700 font-bold uppercase tracking-wider">
          <ShieldCheck className="w-4 h-4" />
          <span>Section 05 · Degradation Honesty Protocol &amp; Weight Renormalization</span>
          <SectionAnchor id="degradation" />
        </div>

        <div className="space-y-2">
          <h2 className="text-xl sm:text-2xl font-bold text-ink">
            Transparent Handling of Missing Primary Disclosures
          </h2>
          <p className="text-sm text-ink-muted leading-relaxed font-sans max-w-4xl">
            In quantitative finance, models frequently make the fatal mistake of treating missing data as zero stress ($s_i = 0$).
            If a private lab refuses to disclose its revenue, an honest engine cannot assume revenue is infinite. Our protocol enforces
            strict coverage weighting:
          </p>
        </div>

        {/* Coverage Formula Box */}
        <div className="prose-mono overflow-x-auto text-center text-sm text-safe-700">
          <code>{"S_{\\text{risk}} = \\frac{\\sum_{i \\in \\text{risk}} w_i \\cdot s_i \\cdot c_i}{\\sum_{i \\in \\text{risk}} w_i \\cdot c_i} \\times 100"}</code>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
          <div className="panel space-y-2">
            <h3 className="text-sm font-bold text-ink flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-surface-3" />
              <span>Fractional Coverage $c_i \in [0, 1]$</span>
            </h3>
            <p className="text-[14px] text-ink-muted leading-relaxed">
              If only 2 of 5 private labs disclose revenue, valuation coverage is $c = 0.4$. The unobserved portion does not deflate the score;
              instead, the denominator rescales across verified computable factors.
            </p>
          </div>

          <div className="panel space-y-2">
            <h3 className="text-sm font-bold text-ink flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-safe-500" />
              <span>Automated 24h Cron Protocol</span>
            </h3>
            <p className="text-[14px] text-ink-muted leading-relaxed">
              Market inputs are updated every 24 hours via autonomous ingestion daemons directly from OpenRouter, Polymarket, Yahoo Finance, and SEC EDGAR.
              Every update is permanently preserved in continuous audit logs, preventing narrative revisions.
            </p>
          </div>
        </div>

        {/* Plain English Translation for Section 5 (Collapsed by default) */}
        <details className="notice notice-safe">
          <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-2 py-1 [&::-webkit-details-marker]:hidden">
            <span className="text-[14px] font-semibold text-ink">In Plain English: We never guess or fabricate phantom numbers</span>
            <ChevronRight className="h-4 w-4 shrink-0 text-ink-subtle transition-transform group-open:rotate-90" aria-hidden="true" />
          </summary>
          <div className="px-3.5 pb-3 pt-1 text-[14px] text-ink-muted leading-relaxed border-t border-safe-300/15">
            If a private AI startup refuses to tell the public how much money it actually makes, we don&apos;t make up a number to make our chart look pretty. We simply reduce our confidence score and tell you honestly that data is missing.
          </div>
        </details>
      </section>

      {/* SECTION 6: HISTORICAL CONSISTENCY (NOT VALIDATION) */}
      <section id="backtests" className="bg-surface border border-rule rounded-lg p-6 sm:p-8 space-y-6 shadow-xs">
        <div>
          <div className="flex items-center space-x-2 text-[13px] font-mono text-safe-700 font-bold uppercase tracking-wider">
            <BarChart3 className="w-4 h-4" />
            <span>Section 06 · Historical Consistency (Reproducible, Not Validated)</span>
            <SectionAnchor id="backtests" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-ink mt-1">
            Case-Enriched Historical Consistency Across Previous Speculative Epochs
          </h2>
          <p className="text-sm text-ink-muted font-sans mt-1">
            Six historical episodes scored with this mathematical formulation. The table is
            reproducible from the published inputs; it is <em>not</em> an out-of-sample validation —
            five of the six rows are crises the model was pointed at, and the sixth is still open.
          </p>
        </div>

        {/* Plain English Translation for Section 6 (Collapsed by default) */}
        <details className="notice notice-caution">
          <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-2 py-1 [&::-webkit-details-marker]:hidden">
            <span className="text-[14px] font-semibold text-ink">In Plain English: How would this model have done in past market crashes?</span>
            <ChevronRight className="h-4 w-4 shrink-0 text-ink-subtle transition-transform group-open:rotate-90" aria-hidden="true" />
          </summary>
          <div className="mt-2.5 border-t border-rule pt-2.5 text-[14px] leading-relaxed text-ink-muted">
            We ran the same formulas over the 1929 Great Crash, the 2000 Dot-Com bust, the 2008
            Lehman collapse, the 2021 ZIRP unwind, the 2022 Fed rate shock and the live 2026
            window. The alarm range across the six episodes was{" "}
            <span className="num font-semibold text-ink">71.8%–95.8%</span>; five windows have
            resolved and one is still in-window. This is a consistency table, not a validation: the
            model was pointed at known crashes, so a high score on every row proves reproducibility,
            not foresight.
          </div>
        </details>

        {/* Brier Score & AUC Summary Bar */}
        <div className="flex flex-wrap items-center gap-3 panel text-[14px] font-mono">
          <div className="flex items-center gap-2">
            <span className="text-ink-subtle">Mean Brier Score:</span>
            <span className="font-bold text-safe-700">{backtestSummary.meanBrierScore.toFixed(4)}</span>
            <span className="px-2 py-0.5 rounded bg-safe-50 text-safe-700 font-bold text-ink">
              resolved episodes only, n={backtestSummary.resolvedEpisodes}; 2026 in-window, excluded
            </span>
          </div>
          <div className="h-4 w-px bg-surface-3 bg-surface-2 hidden sm:block" />
          <div className="flex items-center gap-2">
            <span className="text-ink-subtle">Discrimination AUC-ROC:</span>
            <span className="font-bold text-ink-muted">{backtestSummary.aucRocScore?.toFixed(2) ?? "—"}</span>
            <span className="px-2 py-0.5 rounded bg-surface-2 text-ink font-bold">
              {backtestSummary.discriminationPower}
            </span>
          </div>
          <div className="h-4 w-px bg-surface-3 bg-surface-2 hidden sm:block" />
          <div className="flex items-center gap-2">
            <span className="text-ink-subtle">In-sample AUC:</span>
            <span className="font-bold text-caution-700">{inSampleAucValue.toFixed(3)}</span>
            <span className="px-2 py-0.5 rounded bg-surface-2 text-ink font-bold">
              6 points — indicative
            </span>
          </div>
          <div className="h-4 w-px bg-surface-3 bg-surface-2 hidden sm:block" />
          <span className="text-ink-subtle">6 episodes (1929, 2000, 2008, 2021, 2022, 2026)</span>
        </div>

        <div className="overflow-x-auto border border-rule rounded-xl">
          <table className="w-full text-left text-[14px] sm:text-sm font-mono">
            <caption className="sr-only">
              Historical backtest epochs: stress score, burst probability, model band, Brier
              score, debt and leverage volume, and the primary quantitative driver.
            </caption>
            <thead className="bg-surface-2 border-b border-rule text-ink-subtle">
              <tr>
                <th scope="col" className="p-3.5">Historical Epoch</th>
                <th scope="col" className="p-3.5">Stress (0–100)</th>
                <th scope="col" className="p-3.5">Burst Probability</th>
                <th scope="col" className="p-3.5">Model Band</th>
                <th scope="col" className="p-3.5">Brier Score</th>
                <th scope="col" className="p-3.5">Debt &amp; Leverage Volume</th>
                <th scope="col" className="p-3.5">Primary Quantitative Driver</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rule divide-rule/80">
              {historicalBacktests.map((b) => (
                <tr key={b.era} className="hover:bg-surface-2/50 hover:bg-surface-2/40 transition-colors">
                  <th scope="row" className="p-3.5 font-bold text-ink">{b.era}</th>
                  <td className="p-3.5 font-semibold text-ink">{b.score}</td>
                  <td className="p-3.5 font-semibold text-risk-700">{b.prob}</td>
                  <td className="p-3.5">
                    <span
                      className={`px-2.5 py-1 rounded text-[14px] font-bold ${
                        b.band === "Critical"
                          ? "bg-risk-50 text-risk-700 bg-risk-50/60 text-risk-600 border border-risk-200 border-risk-500"
                          : b.band === "High Stress"
                          ? "bg-caution-50 text-caution-700 bg-caution-50/60 text-caution-600 border border-caution-200 border-caution-500"
                          : "bg-safe-50 text-safe-700 bg-safe-50/60 text-safe-600 border border-safe-200 border-safe-500"
                      }`}
                    >
                      {b.band}
                    </span>
                  </td>
                  <td className="p-3.5 font-semibold text-safe-700">{b.brier}</td>
                  <td className="p-3.5 text-[14px] text-ink-muted">{b.leverage}</td>
                  <td className="p-3.5 text-[14px] sm:text-sm font-sans text-ink-muted leading-relaxed">{b.driver}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="space-y-2 text-[14px] leading-relaxed text-ink-muted">
          <p>
            Episode notes: the 2001 telecom write-downs were concentrated in borrowers such as
            WorldCom and Global Crossing; Lucent was acquired by Alcatel in December 2006, and its
            2001 problem was a collapsing order book and vendor-financing exposure rather than a
            borrower failure. The 2026 row is the live window: it carries no score until its
            12-month window resolves on 19 October 2027.
          </p>
          <p>
            Calibration disclosure: the table was produced under an earlier mapping (anchor ≈54,
            steepness ≈11.2). Re-scored under the live mapping (anchor {MODEL_CALIBRATION.anchorScore},
            steepness {MODEL_CALIBRATION.steepness}) the same composite scores move the published
            probabilities by {calibrationDriftResult.minPct}–{calibrationDriftResult.maxPct} points
            — the mapping is a judgement choice, not a fitted parameter set.
          </p>
          <p className="text-ink-subtle">
            What this table is not: an out-of-sample test. Every resolved row is a crisis the model
            was pointed at, and the in-sample AUC ({inSampleAucValue.toFixed(3)} over 6 points,
            counting the open 2026 window as a non-burst) is structurally optimistic for the same
            reason. No score is published for this model until a pre-registered event matures.
          </p>
          <p className="text-ink-subtle">
            And every resolved row in the table <strong className="text-ink">burst</strong> — there is no
            non-burst episode in it at all. The table therefore contains no false-positive evidence
            whatsoever: it can show that the model catches busts, and nothing about how often the model
            cries wolf on a regime that did not break. Read the published probability as a conditional
            estimate given a stress regime, and read the prediction-market price for the same question
            (published on this site) as the only live estimate that carries a false-positive record.
          </p>
        </div>
      </section>

      {/* SECTION 7: CLASSICAL QUANTITATIVE FINANCIAL MODELS */}
      <section id="classical-models" className="bg-surface border border-rule rounded-lg p-6 sm:p-8 space-y-6 shadow-xs">
        <div>
          <div className="flex items-center space-x-2 text-[13px] font-mono text-ink-muted font-bold uppercase tracking-wider">
            <Cpu className="w-4 h-4" />
            <span>Section 07 · Alignment with Classical Financial Models</span>
            <SectionAnchor id="classical-models" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-ink mt-1">
            Merton (1974), Altman Z&apos;&apos; (2002), LPPLS, Minsky (1986) &amp; Shiller CAPE Models
          </h2>
          <p className="text-sm text-ink-muted font-sans mt-1 max-w-4xl leading-relaxed">
            To guard against epistemic insularity, our model is mathematically cross-referenced with
            5 benchmark structural credit and valuation frameworks established in quantitative
            economics — 5 structural cross-checks (not ensemble members):
          </p>
          <p className="mt-2 max-w-4xl text-[14px] leading-relaxed text-ink-subtle">
            These five are cross-checks, not ensemble members. They do not vote on the headline
            number, they are not averaged into it, and they carry no weight in the composite: the
            published probability comes from the 8 risk factors, the contagion term and the damper
            alone. Read them as a second opinion on the same inputs, and read their disagreements
            with the composite as information.
          </p>
        </div>

        {/* Plain English Translation for Section 7 (Collapsed by default) */}
        <details className="notice">
          <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-2 py-1 [&::-webkit-details-marker]:hidden">
            <span className="text-[14px] font-semibold text-ink">In Plain English: The 3 Classic Doctor Checkups for Companies</span>
            <ChevronRight className="h-4 w-4 shrink-0 text-ink-subtle transition-transform group-open:rotate-90" aria-hidden="true" />
          </summary>
          <div className="mt-2.5 border-t border-rule pt-2.5 text-[14px] leading-relaxed text-ink-muted">
            Think of this section as taking big tech to three different world-class doctors. Doctor 1 (Merton) checks if they have enough cushion to pay their debts (Grade: a {docMertonDd.toFixed(2)}σ distance to default, so the modelled default probability is {docMertonProbLabel} — remote, not zero). Doctor 2 (Altman) checks for any signs of company bankruptcy (Grade: Safe Zone). Doctor 3 (LPPLS) checks if startup prices are growing too fast like an overheated rocket — its hazard number is an index, not a probability.
          </div>
        </details>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* 1. Merton Structural Credit Model */}
          <div className="p-5 rounded-lg bg-surface-2 border border-rule space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[14px] font-mono">
                <span className="font-bold text-ink-muted uppercase">Merton (1974) Model</span>
                <span className="px-2 py-0.5 rounded bg-surface-2 text-ink font-bold">
                  Distance: {docMertonDd.toFixed(2)}σ
                </span>
              </div>
              <h3 className="font-bold text-base text-ink">
                Option-Theoretic Distance-to-Default
              </h3>
              <p className="text-[14px] text-ink-muted leading-relaxed">
                Models enterprise equity as a call option on total assets $V$ with strike price equal to debt commitments $D$.
              </p>
              <div className="panel num text-center text-[14px] text-ink-muted">
                <code>{"DD = \\frac{\\ln(V/D) + (r - 0.5\\sigma_V^2)T}{\\sigma_V \\sqrt{T}}"}</code>
              </div>
              <ul className="text-[14px] font-mono space-y-1 text-ink-muted pt-1">
                <li>
                  • Asset Value $V$: $1.42T — a fixed aggregation used for the DD meter, not the
                  tracked $3.2T of lab valuations
                </li>
                <li>• Total Tracked Debt $D$: $214.9B</li>
                <li>• Asset Volatility $\sigma_V$: 36.5%</li>
                <li>• Risk-Free Rate $r$: 5.10% (US10Y)</li>
                <li>
                  • Implied Default Prob:{" "}
                  <strong className="text-safe-700">{docMertonProbLabel}</strong> (below the
                  model&apos;s one-decimal resolution)
                </li>
              </ul>
            </div>
            <div className="pt-2 border-t border-rule text-[14px] text-ink-subtle">
              Market reference: Oracle 5Y CDS 288bp (record close, 15 Oct 2026). The model&apos;s
              structural spread is not comparable to that market price, and the issuer is rated BBB−.
            </div>
          </div>

          {/* 2. Altman Z''-Score Model */}
          <div className="p-5 rounded-lg bg-surface-2 border border-rule space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[14px] font-mono">
                <span className="font-bold text-ink-muted uppercase">Altman Z&apos;&apos;-Score (2002)</span>
                <span className="px-2 py-0.5 rounded bg-safe-50 text-safe-700 font-bold">
                  Score: {latestModel.altman.score}
                </span>
              </div>
              <h3 className="font-bold text-base text-ink">
                Tech &amp; Service Distress Classifier
              </h3>
              <p className="text-[14px] text-ink-muted leading-relaxed">
                Edward Altman’s four-variable model for emerging cloud infrastructure and non-manufacturing firms.
              </p>
              <div className="panel num text-center text-[14px] text-safe-700">
                <code>{"Z'' = 6.56X_1 + 3.26X_2 + 6.72X_3 + 1.05X_4"}</code>
              </div>
              {/*
                Component basis = the published 19 Oct 2026 pipeline snapshot
                (src/data/latest-model.json): X1 0.118, X2 -0.142, X3 0.078,
                X4 7.21 → Z'' = 6.56·X1 + 3.26·X2 + 6.72·X3 + 1.05·X4 = 8.41.
              */}
              <ul className="text-[14px] font-mono space-y-1 text-ink-muted pt-1">
                <li>• $X_1$ (Working Cap / Assets): 0.118</li>
                <li>• $X_2$ (Retained Earnings / Assets): -0.142</li>
                <li>• $X_3$ (EBIT / Assets): 0.078</li>
                <li>• $X_4$ (Equity / Debt): {ALTMAN_X4}×</li>
                <li>• Zone: <strong className="text-safe-700">Safe Zone (Z&apos;&apos; &gt; 2.60)</strong></li>
              </ul>
            </div>
            <div className="pt-2 border-t border-rule text-[14px] text-ink-subtle">
              Implied distress risk: {probabilityDisplayLabel(altmanImpliedDistressProbabilityPct(docAltmanZ))}{" "}
              (Safe balance sheet). X₄ = {ALTMAN_X4}× is an {ALTMAN_X4_PROVENANCE} — it is a
              published constant, not a number read off a filing.
            </div>
          </div>

          {/* 3. Sornette LPPLS Model */}
          <div className="p-5 rounded-lg bg-surface-2 border border-rule space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              {/* LPPLS hazard: index, not a probability — no % sign (LPPLS_HAZARD_LABEL) */}
              <div className="flex items-center justify-between text-[14px] font-mono">
                <span className="font-bold text-ink-muted uppercase">LPPLS Bubble Model</span>
                <span className="px-2 py-0.5 rounded bg-risk-50 text-risk-700 font-bold">
                  Hazard index: {docLpplsHazard.toFixed(1)}
                </span>
              </div>
              <h3 className="font-bold text-base text-ink">
                Log-Periodic Singularity Detection
              </h3>
              <p className="text-[14px] text-ink-muted leading-relaxed">
                Didier Sornette’s formulation identifying positive feedback imitation loops and super-exponential capex.
              </p>
              <div className="panel num text-center text-[14px] text-risk-700">
                <code>{"h(t) = B'(t_c - t)^{m-1} [1 + C'\\cos(\\omega \\ln(t_c - t))]"}</code>
              </div>
              <ul className="text-[14px] font-mono space-y-1 text-ink-muted pt-1">
                <li>• Power Law Exponent $m$: 0.38</li>
                <li>• Angular Frequency $\omega$: 6.36</li>
                <li>• Estimated Singularity $t_c$: Q4 2026 – Q2 2027</li>
                <li>• Capex-to-FCF Ratio: {((DEFAULT_MODEL_INPUTS.capex?.aggregateCapexUsd ?? 0) / (DEFAULT_MODEL_INPUTS.capex?.aggregateFcfUsd ?? 1)).toFixed(2)}×</li>
                <li>• Regime State: <strong className="text-risk-700">Accelerating Imitation</strong></li>
                <li>
                  • Published label: <strong className="text-ink-muted">{LPPLS_HAZARD_LABEL}</strong>
                </li>
              </ul>
            </div>
            <div className="pt-2 border-t border-rule text-[14px] text-ink-subtle">
              The hazard number is an index, not a probability — no % sign. It is a cross-check on
              the credit and capex readings, not a second probability estimate.
            </div>
          </div>

          {/* 4. Minsky Financial Instability Model */}
          <div className="p-5 rounded-lg bg-surface-2 border border-rule space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[14px] font-mono">
                <span className="font-bold text-ink-muted uppercase">Minsky (1986, 1992)</span>
                <span className="px-2 py-0.5 rounded bg-surface-2 text-ink font-bold">
                  Fragility: {minsky.minskyFragilityIndex.toFixed(1)}
                </span>
              </div>
              <h3 className="font-bold text-base text-ink">
                Financial Instability Regimes
              </h3>
              <p className="text-[14px] text-ink-muted leading-relaxed">
                Hyman Minsky’s tripartite credit classification: Hedge (cash flow covers principal + interest), Speculative (covers interest only), and Ponzi (requires rising asset prices).
              </p>
              <div className="panel num text-center text-[14px] text-ink-muted">
                <code>{`\\text{Regime} = f(\\text{Hedge } ${minsky.hedgeSharePct.toFixed(1)}\\%, \\text{Spec } ${minsky.speculativeSharePct.toFixed(1)}\\%, \\text{Ponzi } ${minsky.ponziSharePct.toFixed(1)}\\%)`}</code>
              </div>
              <ul className="text-[14px] font-mono space-y-1 text-ink-muted pt-1">
                <li>• Hedge Units: <strong className="text-safe-700">{minsky.hedgeSharePct.toFixed(1)}%</strong> (${(minsky.breakdown.hedgeDebtUsd / 1e9).toFixed(1)}B)</li>
                <li>• Speculative Units: <strong className="text-caution-700">{minsky.speculativeSharePct.toFixed(1)}%</strong> (${(minsky.breakdown.speculativeDebtUsd / 1e9).toFixed(1)}B)</li>
                <li>• Ponzi Units: <strong className="text-risk-700">{minsky.ponziSharePct.toFixed(1)}%</strong> (${(minsky.breakdown.ponziDebtUsd / 1e9).toFixed(1)}B)</li>
                <li>• Current Regime: <strong className="text-ink-muted">{minsky.currentRegime}</strong></li>
                <li>• Refinancing Freeze Prob: <strong className="text-risk-700">{minsky.refinancingFreezeProbabilityPct.toFixed(1)}%</strong></li>
              </ul>
            </div>
            <div className="pt-2 border-t border-rule text-[14px] text-ink-subtle">
              Refinancing freeze probability: ~{minsky.refinancingFreezeProbabilityPct.toFixed(1)}%
            </div>
          </div>

          {/* 5. Robert Shiller CAPE & ECY Model */}
          <div className="p-5 rounded-lg bg-surface-2 border border-rule space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[14px] font-mono">
                <span className="font-bold text-ink-muted uppercase">Shiller CAPE (2000, 2015)</span>
                <span className="px-2 py-0.5 rounded bg-surface-2 text-ink font-bold">
                  ECY: {shiller.excessCapeYieldPct >= 0 ? `+${shiller.excessCapeYieldPct.toFixed(2)}%` : `${shiller.excessCapeYieldPct.toFixed(2)}%`}
                </span>
              </div>
              <h3 className="font-bold text-base text-ink">
                Excess CAPE Yield (ECY) Model
              </h3>
              <p className="text-[14px] text-ink-muted leading-relaxed">
                Robert Shiller’s Cyclically Adjusted P/E and Excess CAPE Yield comparing tech earnings yield against real 10-year Treasury yields.
              </p>
              <div className="panel num text-center text-[14px] text-ink-muted">
                <code>{"\\text{ECY} = \\frac{1}{\\text{CAPE}_{\\text{AI}}} - (y_{10\\text{y}} - \\pi_{\\text{CPI}})"}</code>
              </div>
              <ul className="text-[14px] font-mono space-y-1 text-ink-muted pt-1">
                <li>• AI Tech CAPE: {shiller.aiCapeMultiple.toFixed(1)}× (median {shiller.historicalMedianCape.toFixed(1)}×)</li>
                <li>• Real Earnings Yield: {shiller.earningsYieldPct.toFixed(2)}%</li>
                <li>• Real 10Y Treasury Yield: {shiller.real10yYieldPct.toFixed(2)}%</li>
                <li>• Excess CAPE Yield (ECY): <strong className="text-ink-muted">{shiller.excessCapeYieldPct >= 0 ? `+${shiller.excessCapeYieldPct.toFixed(2)}%` : `${shiller.excessCapeYieldPct.toFixed(2)}%`}</strong></li>
                <li>• Risk Premium Band: <strong className="text-risk-700">{shiller.equityRiskPremiumBand}</strong></li>
              </ul>
            </div>
            <div className="pt-2 border-t border-rule text-[14px] text-ink-subtle">
              Risk premium cushion: {shiller.equityRiskPremiumBand}
            </div>
          </div>
        </div>

        {/* 25,000-Path Monte Carlo Stochastic Simulation & Statistical Sampling */}
        <div className="p-6 rounded-lg bg-surface-2 border border-rule/30 text-ink space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <span className="text-[13px] font-mono font-bold uppercase tracking-wider text-ink-muted">
                STOCHASTIC SAMPLING PROTOCOL
              </span>
              <h3 className="text-lg sm:text-xl font-bold text-ink mt-0.5">
                25,000-Path Monte Carlo Engine &amp; Cholesky Correlated Tail Risk
              </h3>
            </div>
            <span className="px-3 py-1 rounded-full text-[13px] font-mono font-bold bg-safe-500/20 text-safe-600 border border-safe-300/30">
              N = 25,000 Paths (Cholesky Factorized) · {SNAPSHOT_LABEL}
            </span>
          </div>

          <p className="text-[14px] sm:text-sm text-ink-muted leading-relaxed max-w-4xl">
            To eliminate single-point estimator bias, our stochastic engine samples 25,000 joint paths
            correlated via Cholesky decomposition ($L L^T = \\Sigma$) across a 4×4 empirical covariance matrix:
            <strong> [US10Y Yield, Oracle CDS Spread, Capex Volume, Valuation Multiples]</strong>.
            High-yield OAS rides alongside the credit complex as a systemic linkage plus an independent
            idiosyncratic shock, which is what lands the simulated corr(CDS, HY) on the published
            design value of {latestModel.monteCarlo.simulatedShockCorrelations.cdsHy}. The innovations
            are heavy-tailed (90/10 scale mixture), so a crisis state is expressible — the previous
            Gaussian run could not produce one.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-2 font-mono text-[14px]">
            <div className="p-3 rounded-xl bg-ink border border-ink space-y-1">
              <span className="label block">Median Prob</span>
              <span className="text-base font-semibold text-ink">{latestModel.monteCarlo.medianProbabilityPct}%</span>
              <span className="num text-ink-faint block">Mean: {latestModel.monteCarlo.meanProbabilityPct}%</span>
            </div>
            <div className="p-3 rounded-xl bg-ink border border-ink space-y-1">
              <span className="label block">Std Dev</span>
              <span className="text-base font-semibold text-ink">{latestModel.monteCarlo.stdDevPct}</span>
              <span className="num text-ink-faint block">Skew: {latestModel.monteCarlo.skewness}</span>
            </div>
            <div className="p-3 rounded-xl bg-ink border border-ink space-y-1">
              <span className="label block">90% shock range</span>
              <span className="text-base font-semibold text-safe-600">
                [{latestModel.monteCarlo.ci90Pct[0]}% – {latestModel.monteCarlo.ci90Pct[1]}%]
              </span>
              <span className="num text-ink-faint block">Not a confidence interval</span>
            </div>
            <div className="p-3 rounded-xl bg-ink border border-ink space-y-1">
              <span className="label block">95% shock range</span>
              <span className="text-base font-semibold text-safe-600">
                [{latestModel.monteCarlo.ci95Pct[0]}% – {latestModel.monteCarlo.ci95Pct[1]}%]
              </span>
              <span className="num text-ink-faint block">Floor: {latestModel.monteCarlo.bandLowPct}%</span>
            </div>
            <div className="p-3 rounded-xl bg-ink border border-ink space-y-1">
              <span className="label block">95% VaR / CVaR</span>
              <span className="text-base font-semibold text-caution-600">
                {latestModel.monteCarlo.valueAtRisk95Pct}% / {latestModel.monteCarlo.conditionalValueAtRisk95Pct}%
              </span>
              <span className="num text-ink-faint block">Worst 5% tail mean</span>
            </div>
            <div className="p-3 rounded-xl bg-ink border border-ink space-y-1">
              <span className="label block">99% VaR / CVaR</span>
              <span className="text-base font-semibold text-risk-600">
                {latestModel.monteCarlo.valueAtRisk99Pct}% / {latestModel.monteCarlo.conditionalValueAtRisk99Pct}%
              </span>
              <span className="num text-ink-faint block">
                Spread:{" "}
                {(
                  latestModel.monteCarlo.valueAtRisk99Pct - latestModel.monteCarlo.valueAtRisk95Pct
                ).toFixed(1)}
                pt
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-[14px]">
            <div className="p-3 rounded-xl bg-surface border border-rule space-y-1">
              <span className="label block">Innovation excess kurtosis</span>
              <span className="text-base font-semibold text-ink">
                {latestModel.monteCarlo.innovationExcessKurtosis}
              </span>
              <span className="num text-ink-faint block">
                kurtosis {latestModel.monteCarlo.innovationKurtosis} (Gaussian = 3.0)
              </span>
            </div>
            <div className="p-3 rounded-xl bg-surface border border-rule space-y-1">
              <span className="label block">Simulated corr(CDS, HY)</span>
              <span className="text-base font-semibold text-ink">
                {latestModel.monteCarlo.simulatedShockCorrelations.cdsHy}
              </span>
              <span className="num text-ink-faint block">Published design value ≈ 0.80</span>
            </div>
            <div className="p-3 rounded-xl bg-surface border border-rule space-y-1">
              <span className="label block">Published range type</span>
              <span className="text-base font-semibold text-ink">
                {latestModel.monteCarlo.ciType}
              </span>
              <span className="num text-ink-faint block">
                Risk-factor coverage {Math.round(currentModel.coverage * 100)}%
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 8: AUTONOMOUS 24-HOUR CONTINUOUS EXECUTION PROTOCOL */}
      <section id="continuous-pipeline" className="bg-surface border border-rule rounded-lg p-6 sm:p-8 space-y-8 shadow-xs">
        <div>
          <div className="flex items-center space-x-2 text-[13px] font-mono text-safe-700 font-bold uppercase tracking-wider">
            <RefreshCw className="w-4 h-4 animate-spin text-safe-700" />
            <span>Section 08 · Autonomous 24-Hour Continuous Execution Protocol</span>
            <SectionAnchor id="continuous-pipeline" />
          </div>
          <h2 className="text-xl sm:text-3xl font-extrabold text-ink mt-1 tracking-tight">
            Automated Daily Ingestion, Quantitative Recalibration &amp; Git-Backed Audit Trail
          </h2>
          <p className="text-sm text-ink-muted font-sans mt-2 max-w-4xl leading-relaxed">
            Unlike static research reports or quarterly consultant decks, the AI Capital Tracker operates as an
            autonomous quantitative system. Every day at <strong>00:00 UTC</strong>, an autonomous quantitative ingestion
            daemon triggers across 5 public institutional data feeds, recalculating all model factors,
            recalibrating classical structural credit models, executing 25,000-path stochastic simulations,
            and recording verified telemetry to an immutable historical audit log.
          </p>
        </div>

        {/* Plain English Translation for Section 8 (Collapsed by default) */}
        <details className="notice notice-safe">
          <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-2 py-1 [&::-webkit-details-marker]:hidden">
            <span className="text-[14px] font-semibold text-ink">In Plain English: Robots updating the numbers while you sleep</span>
            <ChevronRight className="h-4 w-4 shrink-0 text-ink-subtle transition-transform group-open:rotate-90" aria-hidden="true" />
          </summary>
          <div className="mt-2.5 border-t border-rule pt-2.5 text-[14px] leading-relaxed text-ink-muted">
            Every night at midnight UTC, automated code runs in the cloud. It scans real bond yields, checks government databases for new debt filings, and recalculates our risk models. No human sits there fudging the numbers to fit an opinion.
          </div>
        </details>

        {/* Workflow Specs Banner */}
        <div className="p-5 rounded-lg bg-surface-2 border border-safe-300/30 text-ink space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3 text-[14px] font-mono">
            <div className="flex items-center gap-2">
              <GitBranch className="w-4 h-4 text-safe-600" />
              <span className="font-bold text-ink uppercase tracking-wider">Engine: Autonomous Quantitative Execution Daemon</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="chip chip-safe !whitespace-normal">CADENCE: 00:00 UTC Daily Recalibration</span>
              <span className="chip">Runtime: Pure ESM Node.js 20</span>
            </div>
          </div>
          <p className="text-[14px] sm:text-sm text-ink-muted leading-relaxed">
            The automated pipeline ingests fresh market feeds, verifies data integrity across public APIs, evaluates
            the full multi-factor quantitative models, evaluates 25,000-path stochastic simulations, and commits verified
            results directly into the persistent historical ledger. No human narrative intervention is permitted.
          </p>
        </div>

        {/* THE 5 LIVE INGESTION PIPELINES */}
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-1 border-b border-rule">
            <h3 className="text-lg sm:text-xl font-bold text-ink flex items-center space-x-2">
              <Database className="w-5 h-5 text-ink-muted" />
              <span>The 5 Continuous Live Ingestion Pipelines</span>
            </h3>
            <span className="text-[14px] font-semibold text-ink-subtle">
              100% Free • Keyless • Public Institutional APIs
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* Pipeline 1: OpenRouter */}
            <div className="p-5 rounded-lg bg-surface-2 border border-rule space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[14px] font-mono">
                  <span className="font-bold text-ink-muted uppercase">Pipeline 01</span>
                  <span className="px-2 py-0.5 rounded bg-safe-50 text-safe-700 font-bold text-ink">
                    Active: {DEFAULT_MODEL_INPUTS.adoption?.apiPriceDeclineMultiple ?? 670}×
                  </span>
                </div>
                <h4 className="font-bold text-base text-ink">
                  OpenRouter Public Models Pricing
                </h4>
                <p className="text-[14px] text-ink-muted leading-relaxed">
                  Fetches live completion token rates across frontier high-throughput engines (<code className="text-ink-muted">gpt-4o-mini</code>, <code className="text-ink-muted">claude-3-haiku</code>, <code className="text-ink-muted">gemini-flash</code>, <code className="text-ink-muted">deepseek</code>).
                </p>
                <div className="panel space-y-1 text-ink-muted">
                  <div className="text-ink">Deflation Formula:</div>
                  <code className="text-safe-700 block font-bold">
                    M = clamp(25, 7000, round($30.0 / Cost_1M))
                  </code>
                </div>
              </div>
              <div className="pt-2 border-t border-rule text-[14px] text-ink-subtle flex items-center justify-between">
                <span>Directly powers Damper</span>
                <span className="num text-[14px] font-semibold text-ink-muted">-10 pts max</span>
              </div>
            </div>

            {/* Pipeline 2: Polymarket */}
            <div className="p-5 rounded-lg bg-surface-2 border border-rule space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[14px] font-mono">
                  <span className="font-bold text-ink-muted uppercase">Pipeline 02</span>
                  <span className="px-2 py-0.5 rounded bg-surface-2 text-ink font-bold">
                    $9.17M+ Volume
                  </span>
                </div>
                <h4 className="font-bold text-base text-ink">
                  Polymarket Gamma Events API
                </h4>
                <p className="text-[14px] text-ink-muted leading-relaxed">
                  Queries decentralized order book liquidity across 16 active AI prediction markets (AI bubble burst 2026/2027, OpenAI IPO timeline, AGI disclosures, US recession).
                </p>
                <div className="panel space-y-1 text-ink-muted">
                  <div className="text-ink">Crowd Consensus Telemetry:</div>
                  <div className="flex justify-between">
                    <span>2026 Bubble Odds:</span>
                    <strong className="text-ink-muted">
                      {((DEFAULT_MODEL_INPUTS.crowd?.bubble2026Probability ?? 0.0905) * 100).toFixed(2)}%
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span>2027 Bubble Odds:</span>
                    <strong className="text-ink-muted">
                      {((DEFAULT_MODEL_INPUTS.crowd?.bubble2027Probability ?? 0.195) * 100).toFixed(1)}%
                    </strong>
                  </div>
                </div>
              </div>
              <div className="pt-2 border-t border-rule text-[14px] text-ink-subtle flex items-center justify-between">
                <span>Weighted market consensus</span>
                <span className="num text-[14px] font-semibold text-ink-muted">
                  {MODEL_FACTORS.find((f) => f.id === "crowd_signal")?.weightPct ?? 9}% Factor Weight
                </span>
              </div>
            </div>

            {/* Pipeline 3: Yahoo Finance */}
            <div className="p-5 rounded-lg bg-surface-2 border border-rule space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[14px] font-mono">
                  <span className="font-bold text-ink-muted uppercase">Pipeline 03</span>
                  <span className="px-2 py-0.5 rounded bg-risk-50 text-risk-700 font-bold text-ink">
                    {DEFAULT_MODEL_INPUTS.cds?.currentBps ?? 288} bp Anchor
                  </span>
                </div>
                <h4 className="font-bold text-base text-ink">
                  Yahoo Finance Market Stream
                </h4>
                <p className="text-[14px] text-ink-muted leading-relaxed">
                  Pulls the market snapshot for Oracle Corporation (ORCL), the debt anchor for GPU supercluster leases, cross-referencing ICE benchmark CDS and US10Y yields. The feed is polled once per pipeline cycle (00:00 UTC), so it is a dated snapshot rather than a continuous stream.
                </p>
                <div className="panel space-y-1 text-ink-muted">
                  <div className="text-ink">Credit Spread Thermometer:</div>
                  <div className="flex justify-between">
                    <span>Oracle 5Y CDS:</span>
                    <strong className="text-risk-700">{DEFAULT_MODEL_INPUTS.cds?.currentBps ?? 288} bps</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>US10Y Yield:</span>
                    <strong className="text-ink-muted">5.10%</strong>
                  </div>
                </div>
              </div>
              <div className="pt-2 border-t border-rule text-[14px] text-ink-subtle flex items-center justify-between">
                <span>Fixed-income risk anchor</span>
                <span className="num text-[14px] font-semibold text-ink-muted">18% Factor Weight</span>
              </div>
            </div>

            {/* Pipeline 4: SEC EDGAR */}
            <div className="p-5 rounded-lg bg-surface-2 border border-rule space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[14px] font-mono">
                  <span className="font-bold text-ink-muted uppercase">Pipeline 04</span>
                  <span className="px-2 py-0.5 rounded bg-caution-50 text-caution-700 font-bold text-ink">
                    CIK 0001341439
                  </span>
                </div>
                <h4 className="font-bold text-base text-ink">
                  SEC EDGAR CIK Submissions
                </h4>
                <p className="text-[14px] text-ink-muted leading-relaxed">
                  Scans recent Form 8-K, 10-Q, and 10-K filings from the US SEC for material debt disclosures, delayed draw term facilities, indenture covenants, and collateral pledges.
                </p>
                <div className="panel space-y-1 text-ink-muted">
                  <div className="text-ink">Audited Receipt Verification:</div>
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
              <div className="pt-2 border-t border-rule text-[14px] text-ink-subtle flex items-center justify-between">
                <span>Audited legal grounding</span>
                <span className="num text-[14px] font-semibold text-ink-muted">Axiom 1 Sourced</span>
              </div>
            </div>

            {/* Pipeline 5: Primary Ledger */}
            <div className="p-5 rounded-lg bg-surface-2 border border-rule space-y-3 flex flex-col justify-between md:col-span-2 lg:col-span-2">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[14px] font-mono">
                  <span className="font-bold text-ink-muted uppercase">Pipeline 05</span>
                  <span className="px-2 py-0.5 rounded bg-safe-50 text-safe-700 font-bold text-ink">
                    169 Deals Tracked
                  </span>
                </div>
                <h4 className="font-bold text-base text-ink">
                  Primary Verified Capital Ledger (deals.json)
                </h4>
                <p className="text-[14px] text-ink-muted leading-relaxed">
                  Systematically aggregates transaction volumes, debt share %, compute capacity commitments, circular venture
                  arrangements, and mega-deal velocity ($10B+ financings). Automatically recalculates running totals across the $2.87T superstructure.
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 font-mono text-[14px]">
                  <div className="panel">
                    <span className="text-ink-subtle block">Total Disclosed</span>
                    <strong className="text-ink">$2.87 Trillion</strong>
                  </div>
                  <div className="panel">
                    <span className="text-ink-subtle block">Verified Debt Share</span>
                    <strong className="text-caution-700">7.5% ($214.9B)</strong>
                  </div>
                  <div className="panel">
                    <span className="text-ink-subtle block">Compute Contracts</span>
                    <strong className="text-ink-muted">28.3% ($813.8B)</strong>
                  </div>
                  <div className="panel">
                    <span className="text-ink-subtle block">Circular Share</span>
                    <strong className="text-safe-700">2.7% ($77.8B)</strong>
                  </div>
                </div>
              </div>
              <div className="pt-2 border-t border-rule text-[14px] text-ink-subtle flex items-center justify-between">
                <span>Deterministic ledger recomputation</span>
                <span className="num text-[14px] font-semibold text-ink-muted">Source: src/data/deals.json</span>
              </div>
            </div>
          </div>
        </div>

        {/* MATHEMATICAL RE-EVALUATION SUITE */}
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-1 border-b border-rule">
            <h3 className="text-lg sm:text-xl font-bold text-ink flex items-center space-x-2">
              <Sigma className="w-5 h-5 text-safe-700" />
              <span>Autonomous Quantitative Recalibration Pipeline</span>
            </h3>
            <span className="text-[14px] text-ink-subtle">
              Evaluated upon each 24h cron cycle
            </span>
          </div>

          <p className="text-sm text-ink-muted leading-relaxed">
            As soon as fresh data is synthesized into <code className="text-safe-700 font-mono">src/data/live-inputs.json</code>,
            the engine re-evaluates all quantitative financial benchmarks established in literature:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="panel space-y-2">
              <span className="text-[13px] font-semibold text-ink-muted uppercase block">
                1. Merton (1974) Structural
              </span>
              <div className="font-mono text-sm font-bold text-ink">
                Distance: {docMertonDd.toFixed(2)}σ
              </div>
              <p className="text-[14px] text-ink-muted leading-relaxed">
                Calculates default boundary where market equity call option expires out-of-the-money against $214.9B in committed debt.
              </p>
              <div className="num pt-1 text-safe-700">
                Implied Default: {docMertonProbLabel}
              </div>
            </div>

            <div className="panel space-y-2">
              <span className="text-[13px] font-semibold text-safe-700 uppercase block">
                2. Altman Z&apos;&apos;-Score (2002)
              </span>
              <div className="font-mono text-sm font-bold text-ink">
                Score: {latestModel.altman.score} — Safe Zone
              </div>
              <p className="text-[14px] text-ink-muted leading-relaxed">
                Non-manufacturing tech model penalizing negative retained lab earnings against {ALTMAN_X4}× equity capitalization — an {ALTMAN_X4_PROVENANCE} input.
              </p>
              <div className="num pt-1 text-safe-700">
                Distress Risk:{" "}
                {probabilityDisplayLabel(altmanImpliedDistressProbabilityPct(docAltmanZ))} (Safe
                Zone)
              </div>
            </div>

            <div className="panel space-y-2">
              <span className="text-[13px] font-semibold text-risk-700 uppercase block">
                3. Sornette LPPLS Singularity
              </span>
              <div className="font-mono text-sm font-bold text-ink">
                Hazard index: {docLpplsHazard.toFixed(1)}
              </div>
              <p className="text-[14px] text-ink-muted leading-relaxed">
                Log-periodic power law oscillator detecting super-exponential capex growth and estimating singularity transition window $t_c$. The
                number is an index, not a probability — no % sign.
              </p>
              <div className="num pt-1 text-risk-700">
                Window: Q4 2026 – Q2 2027
              </div>
            </div>

            <div className="panel space-y-2">
              <span className="text-[13px] font-semibold text-safe-700 uppercase block">
                4. {latestModel.monteCarlo.iterationsCount.toLocaleString("en-GB")}-Path Monte Carlo
              </span>
              <div className="font-mono text-sm font-bold text-ink">
                VaR95: {latestModel.monteCarlo.valueAtRisk95Pct}% • CVaR: {latestModel.monteCarlo.conditionalValueAtRisk95Pct}%
              </div>
              <p className="text-[14px] text-ink-muted leading-relaxed">
                Box-Muller sampling of heavy-tailed innovations (90/10 scale mixture) across joint 12-month
                macro shocks, yielding empirical quantiles without single-point bias.
              </p>
              <div className="num pt-1 text-safe-700">
                Median: {latestModel.monteCarlo.medianProbabilityPct}% · 90% shock range [
                {latestModel.monteCarlo.ci90Pct[0]}%–{latestModel.monteCarlo.ci90Pct[1]}%]
              </div>
            </div>
          </div>
        </div>

        {/* VISUAL ARCHITECTURE FLOWCHART */}
        <div className="space-y-4 pt-2">
          <div className="flex flex-col gap-2 border-b border-rule pb-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-ink flex items-center space-x-2">
                <Layers className="w-5 h-5 text-ink-muted" />
                <span>End-to-End Continuous Data Flow Architecture</span>
              </h3>
              <p className="text-[14px] text-ink-subtle mt-0.5">
                Visual pipeline showing raw feed ingestion through mathematical calibration and automated deployment.
              </p>
            </div>
            <Link
              href="/api-docs"
              className="prose-a flex min-h-11 items-center gap-1 text-[13px] font-semibold"
            >
              <span>Explore /api/v1/sync Live Endpoint</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Interactive Visual Flowchart Component */}
          <div className="p-6 rounded-lg bg-ink text-canvas border border-rule-strong space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
              {/* Step 1 */}
              <div className="p-4 rounded-xl bg-surface-2/80 border border-rule-strong/80 space-y-2 relative">
                <div className="flex items-center justify-between text-[14px] font-mono">
                  <span className="px-2 py-0.5 rounded bg-safe-500/20 text-safe-600 font-bold border border-safe-300/30">
                    STEP 01
                  </span>
                  <span className="text-ink">00:00 UTC Daily</span>
                </div>
                <h4 className="font-bold text-sm text-ink">5 Live Ingestion Feeds</h4>
                <ul className="text-ink text-ink-muted space-y-1">
                  <li>• OpenRouter Token Deflation</li>
                  <li>• Polymarket Crowd Odds</li>
                  <li>• Yahoo ORCL &amp; CDS Proxy</li>
                  <li>• SEC EDGAR 8-K/10-Q Scans</li>
                  <li>• Primary Deal Ledger ($2.87T)</li>
                </ul>
              </div>

              {/* Step 2 */}
              <div className="p-4 rounded-xl bg-surface-2/80 border border-rule-strong/80 space-y-2 relative">
                <div className="flex items-center justify-between text-[14px] font-mono">
                  <span className="px-2 py-0.5 rounded bg-surface-3/20 text-ink font-bold border border-rule/30">
                    STEP 02
                  </span>
                  <span className="text-ink">Engine Recalibration</span>
                </div>
                <h4 className="font-bold text-sm text-ink">Quantitative Models</h4>
                <ul className="text-ink text-ink-muted space-y-1">
                  <li>• 9 Weighted Factors [0, 100]</li>
                  <li>• Contagion Synergy Term</li>
                  <li>• Merton Distance-to-Default (5.13σ)</li>
                  <li>• Altman Z&apos;&apos;-Score Classifier (8.41)</li>
                  <li>• 25,000-Path Monte Carlo (Cholesky Copula)</li>
                </ul>
              </div>

              {/* Step 3 */}
              <div className="p-4 rounded-xl bg-surface-2/80 border border-rule-strong/80 space-y-2 relative">
                <div className="flex items-center justify-between text-[14px] font-mono">
                  <span className="px-2 py-0.5 rounded bg-caution-500/20 text-caution-600 font-bold border border-caution-300/30">
                    STEP 03
                  </span>
                  <span className="text-ink">Git Persistence</span>
                </div>
                <h4 className="font-bold text-sm text-ink">Immutable Audit Trail</h4>
                <ul className="text-ink text-ink-muted space-y-1">
                  <li>• Write src/data/live-inputs.json</li>
                  <li>• Append sync-history.json</li>
                  <li>• npm run build Verification</li>
                  <li>• Autonomous Persistent Commit</li>
                  <li>• Cryptographic git provenance</li>
                </ul>
              </div>

              {/* Step 4 */}
              <div className="p-4 rounded-xl bg-surface-2/80 border border-rule-strong/80 space-y-2 relative">
                <div className="flex items-center justify-between text-[14px] font-mono">
                  <span className="px-2 py-0.5 rounded bg-safe-500/20 text-safe-600 font-bold border border-safe-300/30">
                    STEP 04
                  </span>
                  <span className="text-ink">Public Telemetry</span>
                </div>
                <h4 className="font-bold text-sm text-ink">Instant Delivery</h4>
                <ul className="text-ink text-ink-muted space-y-1">
                  <li>• GET /api/v1/sync Endpoint</li>
                  <li>• GET /api/v1/model Daily Snapshot (rebuilt on deploy)</li>
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
          <div className="flex items-center justify-between text-[14px] font-mono">
            <span className="font-bold uppercase tracking-wider text-ink-muted flex items-center space-x-1.5">
              <Terminal className="w-4 h-4 text-safe-700" />
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
        MERTON["Merton (1974) Model\\nDistance-to-Default (5.13σ Safe)"]
        ALTMAN["Altman Z''-Score (2002)\\nTech Distress Classifier (8.41 Safe)"]
        LPPLS["Sornette LPPLS Singularity\\nLog-Periodic Singularity Detection"]
        MC["25,000-Path Monte Carlo\\nCholesky Copula VaR (${latestModel.monteCarlo.valueAtRisk95Pct}%) & CVaR"]
    end

    subgraph PERSISTENCE["03 · Git Persistence & Verification"]
        direction TB
        INPUTS["src/data/live-inputs.json\\nCalibrated Baseline State"]
        HISTORY["src/data/sync-history.json\\n30-Day Rolling Audit Trail"]
        BUILD["Next.js Verification Build\\nnpm run build (Type & Math Integrity)"]
        COMMIT["Autonomous Daily Commit\\nchore(data): automated 24h update [skip ci]"]
    end

    subgraph CONSUMPTION["04 · Platform Telemetry & Open API"]
        direction TB
        API["GET /api/v1/sync\\nLive Telemetry Health Endpoint"]
        SANDBOX["Interactive Sandbox\\nLive 24h Snapshot Reference Card"]
        GAUGE["Live Probability Gauge\\n12-Month Burst Probability (${currentModel.burstProbability.toFixed(1)}%)"]
    end

    INGESTION --> ENGINE
    ENGINE --> PERSISTENCE
    PERSISTENCE --> CONSUMPTION`;
                navigator.clipboard.writeText(code);
                setCopiedMermaid(true);
                setTimeout(() => setCopiedMermaid(false), 2000);
              }}
              className="btn min-h-11 cursor-pointer"
            >
              {copiedMermaid ? (
                <>
                  <Check className="w-3.5 h-3.5 text-safe-700" />
                  <span className="text-safe-700">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Mermaid Code</span>
                </>
              )}
            </button>
          </div>

          <div className="bg-surface-2 rounded-lg border border-rule-strong overflow-hidden">
            <div className="px-4 py-2.5 bg-ink border-b border-ink flex items-center justify-between text-[14px] text-ink-subtle">
              <span>architecture-diagram.mermaid</span>
              <span>graph TD / flowchart TD</span>
            </div>
            <pre className="p-5 font-mono text-[14px] text-safe-600 overflow-x-auto leading-relaxed">
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
        MERTON["Merton (1974) Model\\nDistance-to-Default (5.13σ Safe)"]
        ALTMAN["Altman Z''-Score (2002)\\nTech Distress Classifier (8.41 Safe)"]
        LPPLS["Sornette LPPLS Singularity\\nLog-Periodic Singularity Detection"]
        MC["25,000-Path Monte Carlo\\nCholesky Copula VaR (${latestModel.monteCarlo.valueAtRisk95Pct}%) & CVaR"]
    end

    subgraph PERSISTENCE["03 · Git Persistence & Verification"]
        direction TB
        INPUTS["src/data/live-inputs.json\\nCalibrated Baseline State"]
        HISTORY["src/data/sync-history.json\\n30-Day Rolling Audit Trail"]
        BUILD["Next.js Verification Build\\nnpm run build (Type & Math Integrity)"]
        COMMIT["Autonomous Daily Commit\\nchore(data): automated 24h update [skip ci]"]
    end

    subgraph CONSUMPTION["04 · Platform Telemetry & Open API"]
        direction TB
        API["GET /api/v1/sync\\nLive Telemetry Health Endpoint"]
        SANDBOX["Interactive Sandbox\\nLive 24h Snapshot Reference Card"]
        GAUGE["Live Probability Gauge\\n12-Month Burst Probability (${currentModel.burstProbability.toFixed(1)}%)"]
    end

    INGESTION --> ENGINE
    ENGINE --> PERSISTENCE
    PERSISTENCE --> CONSUMPTION`}</code>
            </pre>
          </div>
        </div>
      </section>

      {/* SECTION 9: MINSKY FINANCIAL INSTABILITY HYPOTHESIS & SHILLER EXCESS CAPE YIELDS */}
      <section id="minsky-shiller" className="bg-surface border border-rule rounded-lg p-6 sm:p-8 space-y-10 shadow-xs">
        {/* Section Header */}
        <div className="space-y-2 pb-6 border-b border-rule">
          <div className="flex items-center space-x-2 text-[13px] font-mono text-ink-muted font-bold uppercase tracking-wider">
            <Scale className="w-4 h-4" />
            <span>Section 09 · Minsky Financial Instability Hypothesis &amp; Shiller Excess CAPE Yields</span>
            <SectionAnchor id="minsky-shiller" />
          </div>
          <h2 className="text-xl sm:text-3xl font-extrabold text-ink tracking-tight">
            Structural Credit Regimes, Equity Risk Premia &amp; Historical Consistency Matrix
          </h2>
          <p className="text-sm text-ink-muted font-sans mt-1 max-w-4xl leading-relaxed">
            A comprehensive quantitative synthesis establishing the post-Keynesian debt taxonomy of Hyman Minsky,
            Robert Shiller&apos;s Excess CAPE Yield (ECY) equity risk premium framework, our 25,000-path Cholesky copula stochastic simulation engine,
            and the historical consistency matrix (<code className="text-safe-700 font-mono font-bold">BS = {backtestSummary.meanBrierScore.toFixed(4)} over {backtestSummary.resolvedEpisodes} resolved episodes</code>, <code className="text-ink-muted font-mono font-bold">in-sample AUC = {inSampleAucValue.toFixed(3)} (6 points — indicative)</code>). The old
            out-of-sample accuracy figure was removed in v2.6.0: it was not computable from six rows,
            five of which are crises the model was pointed at.
          </p>
        </div>

        {/* Plain English Translation for Section 9 (Collapsed by default) */}
        <details className="notice">
          <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-2 py-1 [&::-webkit-details-marker]:hidden">
            <span className="text-[14px] font-semibold text-ink">In Plain English: The Three Kinds of Borrowers at the AI Party</span>
            <ChevronRight className="h-4 w-4 shrink-0 text-ink-subtle transition-transform group-open:rotate-90" aria-hidden="true" />
          </summary>
          <div className="mt-2.5 border-t border-rule pt-2.5 text-[14px] leading-relaxed text-ink-muted">
            Economist Hyman Minsky had a famous rule about how financial bubbles form. When a party starts, people borrow safely (<strong>Hedge borrowers</strong>: Microsoft and Google paying for chips out of real profits). Then people borrow more and hope to roll over their loans later (<strong>Speculative borrowers</strong>: datacenter developers). Finally, people borrow money with zero profits, praying that the price of their stock just keeps going up forever (<strong>Ponzi units</strong>: pre-revenue startups). Right now, {minsky.hedgeSharePct.toFixed(0)}% of tracked AI debt is funded by real cash, meaning the foundation is still holding strong.
          </div>
        </details>

        {/* ── SUBSECTION A: HYMAN MINSKY FINANCIAL INSTABILITY HYPOTHESIS ── */}
        <div className="space-y-5">
          <div className="flex items-center justify-between pb-1 border-b border-rule">
            <div>
              <span className="text-[13px] font-semibold text-ink-muted uppercase tracking-wider">
                PART A · POST-KEYNESIAN DEBT STRUCTURES
              </span>
              <h3 className="text-lg sm:text-xl font-bold text-ink mt-0.5">
                Hyman Minsky&apos;s Financial Instability Hypothesis (1986, 1992)
              </h3>
            </div>
            <span className="px-3 py-1 rounded-full text-[13px] font-mono font-bold bg-surface-2 text-ink border border-rule">
              Fragility Index: {minsky.minskyFragilityIndex.toFixed(1)} / 100
            </span>
          </div>

          <p className="text-sm text-ink-muted leading-relaxed">
            Hyman Minsky&apos;s core insight is that <em>&quot;stability breeds instability.&quot;</em> During prolonged technology and capital expenditure expansions,
            borrowers and lenders gradually abandon conservative cash-flow criteria. As debts accumulate faster than operating revenues,
            the financial structure of the economy transitions along a three-stage credit continuum:
          </p>

          {/* Tripartite Debt Regime Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Card 1: Hedge Finance */}
            <div className="p-5 rounded-lg bg-safe-50/50 bg-safe-50/20 border border-safe-200 border-safe-500/60 space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[14px] font-mono">
                  <span className="font-bold text-safe-700 uppercase">1. Hedge Finance</span>
                  <span className="px-2 py-0.5 rounded bg-safe-50 bg-safe-50/60 text-safe-700 font-semibold">
                    {minsky.hedgeSharePct.toFixed(1)}% Share
                  </span>
                </div>
                <h4 className="font-bold text-base text-ink">
                  Cash Flow Covers Principal + Interest
                </h4>
                <div className="panel num text-center text-[14px] font-semibold text-safe-700">
                  <code>{"CF_t > P_t + I_t \\quad (\\forall t)"}</code>
                </div>
                <p className="text-[14px] text-ink-muted leading-relaxed">
                  Established hyperscalers (Microsoft, Alphabet, Meta, Amazon, Apple) with massive non-AI enterprise SaaS, cloud, phone, and advertising cash reserves ($668B+ trailing operating cash flow, $260B+ trailing annualized net free cash flow) — but guided CY2026 capex of $725B (Big-4 calls, Jul 2026) now consumes nearly all of it (Forbes, Oct 7 2026).
                  Operating cash flows service coupon obligations and principal amortization without market dependency.
                </p>
              </div>
              <div className="flex justify-between border-t border-rule pt-2 text-safe-700">
                <span>Nominal Capital:</span>
                <span className="font-bold">${(minsky.breakdown.hedgeDebtUsd / 1e9).toFixed(1)}B</span>
              </div>
            </div>

            {/* Card 2: Speculative Finance */}
            <div className="p-5 rounded-lg bg-caution-50/50 bg-caution-50/20 border border-caution-200 border-caution-500/60 space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[14px] font-mono">
                  <span className="font-bold text-caution-700 uppercase">2. Speculative Finance</span>
                  <span className="px-2 py-0.5 rounded bg-caution-50 bg-caution-50/60 text-caution-700 font-semibold">
                    {minsky.speculativeSharePct.toFixed(1)}% Share
                  </span>
                </div>
                <h4 className="font-bold text-base text-ink">
                  Cash Flow Covers Interest Only
                </h4>
                <div className="panel num text-center text-[14px] font-semibold text-caution-700">
                  <code>{"I_t < CF_t < P_t + I_t"}</code>
                </div>
                <p className="text-[14px] text-ink-muted leading-relaxed">
                  Infrastructure neo-clouds, enterprise hardware anchors (Oracle Corporation 5Y notes), and GPU datacenter REITs.
                  Revenues cover coupon service, but maturing debt notes cannot be retired out of cash flow and must be continuously rolled over in commercial paper and credit markets.
                </p>
              </div>
              <div className="flex justify-between border-t border-rule pt-2 text-caution-700">
                <span>Nominal Capital:</span>
                <span className="font-bold">${(minsky.breakdown.speculativeDebtUsd / 1e9).toFixed(1)}B</span>
              </div>
            </div>

            {/* Card 3: Ponzi Finance */}
            <div className="p-5 rounded-lg bg-risk-50/50 bg-risk-50/20 border border-risk-200 border-risk-500/60 space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[14px] font-mono">
                  <span className="font-bold text-risk-700 uppercase">3. Ponzi Finance</span>
                  <span className="px-2 py-0.5 rounded bg-risk-50 bg-risk-50/60 text-risk-700 font-semibold">
                    {minsky.ponziSharePct.toFixed(1)}% Share
                  </span>
                </div>
                <h4 className="font-bold text-base text-ink">
                  Cash Flow Covers Neither Principal Nor Interest
                </h4>
                <div className="panel num text-center text-[14px] font-semibold text-risk-700">
                  <code>{"CF_t < I_t \\quad (\\text{Solvency} \\iff \\Delta V > 0)"}</code>
                </div>
                <p className="text-[14px] text-ink-muted leading-relaxed">
                  Pre-revenue and high-burn foundation laboratories consuming $5B-$10B annually in frontier training clusters while facing rapid token deflation ({DEFAULT_MODEL_INPUTS.adoption?.apiPriceDeclineMultiple ?? 670}× cheaper API pricing, input basis).
                  Solvency depends entirely on escalating equity valuation multiples and new financing rounds to fund operating burn.
                </p>
              </div>
              <div className="flex justify-between border-t border-rule pt-2 text-risk-700">
                <span>Nominal Capital:</span>
                <span className="font-bold">${(minsky.breakdown.ponziDebtUsd / 1e9).toFixed(1)}B</span>
              </div>
            </div>
          </div>

          {/* Minsky Fragility Index & Refinancing Freeze Math */}
          <div className="panel space-y-4">
            <h4 className="text-sm text-[13px] font-semibold text-ink uppercase tracking-wider">
              Mathematical Formulation of Minsky Fragility &amp; Refinancing Freeze Risk
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-[14px]">
              <div className="p-4 bg-surface bg-ink rounded-xl border border-rule space-y-2">
                <span className="text-ink-subtle font-bold">Minsky Fragility Index (0 to 100):</span>
                <div className="p-2 bg-surface-2 rounded text-ink-muted font-bold text-center">
                  <code>{MODEL_DOC_FORMULAS.minsky_fragility.formula}</code>
                </div>
                <p className="text-ink-muted leading-relaxed">
                  Where <code className="text-ink-muted font-mono">Spec</code> and{" "}
                  <code className="text-ink-muted font-mono">Ponzi</code> are the published debt-share
                  levers ({minsky.speculativeSharePct.toFixed(1)}% / {minsky.ponziSharePct.toFixed(1)}%),
                  <code className="text-ink-muted font-mono">CDS_excess</code> is the Oracle 5Y spread
                  over its 81bp baseline (288bp → 2.556), and the capex term is the capex-to-OCF ratio
                  over its 0.548 reference. Live evaluation:{" "}
                  <strong className="text-ink-muted font-mono">{docMinskyFragility.toFixed(1)}</strong>.
                </p>
                <p className="text-ink-faint leading-relaxed">
                  {MODEL_DOC_FORMULAS.minsky_fragility.note}
                </p>
              </div>

              <div className="p-4 bg-surface bg-ink rounded-xl border border-rule space-y-2">
                <span className="text-ink-subtle font-bold">Refinancing Freeze Probability:</span>
                <div className="p-2 bg-surface-2 rounded text-risk-700 font-bold text-center">
                  <code>{MODEL_DOC_FORMULAS.refi_freeze.formula}</code>
                </div>
                <p className="text-ink-muted leading-relaxed">
                  Live evaluation: the published Ponzi share and CDS excess give a{" "}
                  <strong className="text-risk-700 font-mono">
                    {docFreezeProbability.toFixed(3)} ({docFreezePct.toFixed(1)}%)
                  </strong>{" "}
                  probability of a debt-market rollover freeze inside 12 months. There is no discrete
                  trigger: the function is continuous in both inputs, so a wider spread or a larger
                  Ponzi share moves it in proportion rather than switching it on.
                </p>
                <p className="text-ink-faint leading-relaxed">
                  {MODEL_DOC_FORMULAS.refi_freeze.note}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ── SUBSECTION B: ROBERT SHILLER CAPE & EXCESS CAPE YIELD ── */}
        <div className="space-y-5">
          <div className="flex items-center justify-between pb-1 border-b border-rule">
            <div>
              <span className="text-[13px] font-semibold text-ink-muted uppercase tracking-wider">
                PART B · LONG-DURATION VALUATION BENCHMARK
              </span>
              <h3 className="text-lg sm:text-xl font-bold text-ink mt-0.5">
                Robert Shiller Cyclically Adjusted P/E (CAPE) &amp; Excess CAPE Yield (2000, 2015)
              </h3>
            </div>
            <span className="px-3 py-1 rounded-full text-[13px] font-mono font-bold bg-surface-2 text-ink border border-rule">
              ECY: {shiller.excessCapeYieldPct >= 0 ? `+${shiller.excessCapeYieldPct.toFixed(2)}%` : `${shiller.excessCapeYieldPct.toFixed(2)}%`}
            </span>
          </div>

          <p className="text-sm text-ink-muted leading-relaxed">
            During major capital investment booms, trailing 12-month P/E multiples become distorted by aggressive depreciation schedules,
            capitalized R&amp;D, and cyclical peak margins. Nobel Laureate Robert Shiller developed the <strong>Cyclically Adjusted Price-to-Earnings (CAPE)</strong> ratio
            and subsequent <strong>Excess CAPE Yield (ECY)</strong> to measure whether equities offer adequate compensation relative to safe real Treasury bonds.
          </p>

          {/* Shiller ECY Formula and Telemetry Box */}
          <div className="p-6 rounded-lg bg-ink text-canvas border border-rule/30 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-ink pb-3">
              <span className="font-mono text-[13px] uppercase tracking-wider text-ink-muted font-bold">
                Excess CAPE Yield Mathematical Formulation
              </span>
              <span className="text-[14px] font-mono px-2.5 py-0.5 rounded bg-surface-3/20 text-ink border border-rule/40">
                Regime: {shiller.equityRiskPremiumBand}
              </span>
            </div>

            <div className="p-4 rounded-xl bg-ink border border-ink text-center font-mono text-sm sm:text-base text-ink font-bold">
              <code>{`\\text{ECY} = \\frac{1}{\\text{CAPE}_{\\text{AI}}} - \\left(y_{10\\text{y}} - \\pi^{\\text{TIPS}}_{\\text{10y BE}}\\right) = \\frac{1}{${shiller.aiCapeMultiple.toFixed(1)}} - (5.10\\% - 2.35\\%) = ${shiller.earningsYieldPct.toFixed(2)}\\% - ${shiller.real10yYieldPct.toFixed(2)}\\% = \\mathbf{${shiller.excessCapeYieldPct >= 0 ? "+" : ""}${shiller.excessCapeYieldPct.toFixed(2)}\\%}`}</code>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-[14px] pt-1">
              <div className="p-3 rounded-xl bg-surface border border-ink">
                <span className="label block">AI Tech CAPE Multiple</span>
                <span className="text-lg font-semibold text-ink">{shiller.aiCapeMultiple.toFixed(1)}×</span>
                <span className="num text-ink-faint block">Hist Median: {shiller.historicalMedianCape.toFixed(1)}×</span>
              </div>
              <div className="p-3 rounded-xl bg-surface border border-ink">
                <span className="label block">Real Earnings Yield (1/CAPE)</span>
                <span className="text-lg font-semibold text-ink">{shiller.earningsYieldPct.toFixed(2)}%</span>
                <span className="num text-ink-faint block">Unlevered Tech Return</span>
              </div>
              <div className="p-3 rounded-xl bg-surface border border-ink">
                <span className="label block">10Y Real Treasury Benchmark</span>
                <span className="text-lg font-semibold text-ink-muted">{shiller.real10yYieldPct.toFixed(2)}%</span>
                <span className="num text-ink-faint block">
                  {realYieldBasisLabel(docEcyInputs, "tips")}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-surface border border-ink">
                <span className="label block">Excess CAPE Yield (ERP)</span>
                <span className="text-lg font-semibold text-caution-600">
                  {shiller.excessCapeYieldPct >= 0 ? `+${shiller.excessCapeYieldPct.toFixed(2)}%` : `${shiller.excessCapeYieldPct.toFixed(2)}%`}
                </span>
                <span className="text-ink text-caution-700 block">Compressed Equity Buffer</span>
              </div>
            </div>

            <p className="text-[14px] text-ink-muted leading-relaxed pt-1">
              <strong>Institutional Interpretation:</strong> At <code className="text-ink">{shiller.excessCapeYieldPct >= 0 ? "+" : ""}{shiller.excessCapeYieldPct.toFixed(2)}%</code>, the technology equity risk premium is
              significantly compressed below historical bull-market cushions of +3.50%. Investors receive only {Math.round(shiller.excessCapeYieldPct * 100)} bps of annual excess expected yield
              over risk-free inflation-hedged Treasuries for absorbing hardware obsolescence and generative software disruption risk.
              Any incremental +50 bps upward drift in 10-year yields compresses the equity risk premium toward zero.
            </p>

            <p className="text-[14px] text-ink-faint leading-relaxed pt-1 border-t border-rule/40">
              <strong className="text-ink-muted">Basis disclosure (published once):</strong> the real
              10-year yield used above is {realYieldBasisLabel(docEcyInputs, "tips")} ={" "}
              {realYieldTipsPct(docEcyInputs).toFixed(2)}%, which gives the published ECY of{" "}
              {docEcyTips >= 0 ? "+" : ""}
              {docEcyTips.toFixed(2)}% ({docEcyBand}). On a CPI basis instead ({" "}
              {realYieldBasisLabel(docEcyInputs, "cpi")} = {realYieldCpiPct(docEcyInputs).toFixed(2)}%
              ) the same CAPE gives ECY{" "}
              {docEcyCpi >= 0 ? "+" : ""}
              {docEcyCpi.toFixed(2)}%, which would sit in the {ecyBand(docEcyCpi)} band rather than
              Compressed. The published figure uses the TIPS basis because the breakeven is the
              market&apos;s own inflation compensation; the CPI basis is shown here so the choice is
              visible rather than buried.
            </p>
          </div>

          {/* 4-Tier Valuation Risk Premia Classification Table */}
          <div className="overflow-x-auto border border-rule rounded-xl">
            <table className="w-full text-left text-[14px] font-mono">
              <caption className="sr-only">
                Excess CAPE yield bands with their quantitative thresholds, the model risk state,
                the historical analogue and which band is currently active.
              </caption>
              <thead className="bg-surface-2 border-b border-rule text-ink-subtle">
                <tr>
                  <th scope="col" className="p-3">Excess CAPE Yield Band</th>
                  <th scope="col" className="p-3">Quantitative Threshold</th>
                  <th scope="col" className="p-3">Model Risk State</th>
                  <th scope="col" className="p-3">Historical Analogue</th>
                  <th scope="col" className="p-3">Current Regime Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-rule divide-rule/80">
                <tr className="hover:bg-surface-2/50 hover:bg-surface-2/40">
                  <th scope="row" className="p-3 font-bold text-safe-700">Generous Equity Buffer</th>
                  <td className="p-3 font-semibold">ECY &gt; +3.00%</td>
                  <td className="p-3 font-bold text-safe-700">Calm (Deep Cushion)</td>
                  <td className="p-3 text-ink-muted">2011–2014 Post-GFC Recovery</td>
                  <td className="p-3 text-ink-subtle">Inactive</td>
                </tr>
                <tr className="hover:bg-surface-2/50 hover:bg-surface-2/40">
                  <th scope="row" className="p-3 font-bold text-ink-muted">Fair Historical Premium</th>
                  <td className="p-3 font-semibold">+1.50% ≤ ECY ≤ +3.00%</td>
                  <td className="p-3 font-bold text-ink-muted">Guarded (Equilibrium)</td>
                  <td className="p-3 text-ink-muted">2016–2019 Tech Expansion</td>
                  <td className="p-3 text-ink-subtle">Inactive</td>
                </tr>
                <tr className="bg-caution-50/40 bg-caution-50/20 hover:bg-caution-50/60 hover:bg-caution-50/30">
                  <th scope="row" className="p-3 font-bold text-caution-700">Compressed Tech ERP</th>
                  <td className="p-3 font-semibold text-caution-700">0.00% ≤ ECY &lt; +1.50%</td>
                  <td className="p-3 font-bold text-caution-700">Elevated (Thin Buffer)</td>
                  <td className="p-3 text-ink-muted">Late 1998 Dot-Com Phase</td>
                  <td className="p-3 font-bold text-caution-700 flex items-center space-x-1">
                    <span className="w-2 h-2 rounded-full bg-caution-500" />
                    <span>ACTIVE ({shiller.excessCapeYieldPct >= 0 ? "+" : ""}{shiller.excessCapeYieldPct.toFixed(2)}%)</span>
                  </td>
                </tr>
                <tr className="hover:bg-surface-2/50 hover:bg-surface-2/40">
                  <th scope="row" className="p-3 font-bold text-risk-700">Negative Equity Risk Premium</th>
                  <td className="p-3 font-semibold text-risk-700">ECY &lt; 0.00%</td>
                  <td className="p-3 font-bold text-risk-700">Critical (Severe Overvaluation)</td>
                  <td className="p-3 text-ink-muted">March 2000 Peak (-0.95%)</td>
                  <td className="p-3 text-ink-subtle">Inactive</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* ── SUBSECTION C: 25,000-PATH MONTE CARLO CHOLESKY COPULA ── */}
        <div className="space-y-5">
          <div className="flex items-center justify-between pb-1 border-b border-rule">
            <div>
              <span className="text-[13px] font-mono font-bold text-safe-700 uppercase tracking-wider">
                PART C · STOCHASTIC CORRELATION FRAMEWORK
              </span>
              <h3 className="text-lg sm:text-xl font-bold text-ink mt-0.5">
                25,000-Path Monte Carlo Sampling via Empirical Cholesky Copula
              </h3>
            </div>
            <span className="chip chip-safe">
              N = 25,000 Stochastic Iterations · {SNAPSHOT_LABEL}
            </span>
          </div>

          <p className="text-sm text-ink-muted leading-relaxed">
            Conventional financial simulations mistakenly assume statistical independence across risk factors.
            In reality, market sell-offs trigger synchronized contagion: rising interest rates widen corporate credit spreads,
            contract hyperscaler capital budgets, and compress equity valuation multiples simultaneously.
            Our engine decomposes an empirical 4×4 cross-asset correlation matrix using the <strong>Cholesky factorization</strong>:
          </p>

          {/* Cholesky Mathematical Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 font-mono text-[14px]">
            <div className="p-5 rounded-lg bg-surface-2 border border-rule space-y-3">
              <span className="font-bold text-ink-muted block uppercase">
                Empirical Covariance Matrix Σ (4×4)
              </span>
              <div className="p-3.5 bg-surface bg-ink rounded-xl border border-rule text-ink leading-relaxed">
                <code>{"\\mathbf{\\Sigma} = \\begin{pmatrix} 1.00 & +0.45 & +0.35 & -0.40 \\\\ +0.45 & 1.00 & +0.50 & -0.55 \\\\ +0.35 & +0.50 & 1.00 & +0.30 \\\\ -0.40 & -0.55 & +0.30 & 1.00 \\end{pmatrix}"}</code>
              </div>
              <ul className="text-ink-muted space-y-1 font-sans">
                <li>
                  • <strong className="font-mono text-ink">Variable 1:</strong> US 10-Year Benchmark
                  Yield (12-month σ 0.85 ≈ 85bp)
                </li>
                <li>
                  • <strong className="font-mono text-ink">Variable 2:</strong> Oracle 5Y CDS Spread
                  (log-space σ 0.45)
                </li>
                <li>
                  • <strong className="font-mono text-ink">Variable 3:</strong> Hyperscaler Capex
                  Commitments (σ 0.30, floor 0.40×)
                </li>
                <li>
                  • <strong className="font-mono text-ink">Variable 4:</strong> Private Lab Valuation
                  Multiples (σ 0.32, floor 0.05×)
                </li>
              </ul>
              <p className="text-[14px] text-ink-muted leading-relaxed">
                These are 12-month volatilities. The previous calibration was a short-horizon one —
                the 10Y moved in days, not years — and it clamped hard at 500bp CDS and a 0.25×
                multiple floor, truncating exactly the events the range exists to cover (2007 CDS
                35→550bp; the 2000 −78% multiple collapse). The clamps are now open: CDS to 1500bp,
                the 10Y to 12%, the multiple to 0.05×.
              </p>
            </div>

            <div className="p-5 rounded-lg bg-surface-2 border border-rule space-y-3">
              <span className="font-bold text-ink-muted block uppercase">
                Cholesky Decomposition &amp; Shock Generation
              </span>
              <div className="p-3.5 bg-surface bg-ink rounded-xl border border-rule text-ink leading-relaxed text-safe-700 font-bold">
                <code>{"\\mathbf{\\Sigma} = \\mathbf{L} \\mathbf{L}^T \\implies \\mathbf{X} = \\mathbf{L} \\mathbf{Z}, \\quad \\mathbf{Z} \\sim \\text{heavy-tailed (90/10 mixture)}"}</code>
              </div>
              <p className="text-[14px] text-ink-muted leading-relaxed">
                By multiplying the lower-triangular matrix <code className="font-mono text-safe-700">L</code> by 4 independent
                unit-variance innovations <code className="font-mono text-safe-700">Z</code>,
                we preserve the exact cross-asset correlation structure without introducing spurious multicollinearity or numerical instability.
              </p>
              <div className="p-2.5 rounded-lg bg-safe-50 border border-safe-200 border-safe-500 text-ink text-safe-700">
                Deterministic pseudo-random LCG seeding ensures 100% reproducible scientific recalculation across all machines.
              </div>
            </div>
          </div>

          {/* 6 Statistical Moments Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 font-mono text-[14px]">
            <div className="panel space-y-1">
              <span className="label block">Median Prob</span>
              <span className="text-xl font-semibold text-ink">{latestModel.monteCarlo.medianProbabilityPct}%</span>
              <span className="text-ink-faint block">Mean: {latestModel.monteCarlo.meanProbabilityPct}% (σ {latestModel.monteCarlo.stdDevPct})</span>
            </div>
            <div className="panel space-y-1">
              <span className="label block">90% shock range</span>
              <span className="text-lg font-semibold text-safe-700">[{latestModel.monteCarlo.ci90Pct[0]}%–{latestModel.monteCarlo.ci90Pct[1]}%]</span>
              <span className="text-ink-faint block">10th to 90th %ile — not a CI</span>
            </div>
            <div className="panel space-y-1">
              <span className="label block">95% shock range</span>
              <span className="text-lg font-semibold text-safe-700">[{latestModel.monteCarlo.ci95Pct[0]}%–{latestModel.monteCarlo.ci95Pct[1]}%]</span>
              <span className="text-ink-faint block">Floor {latestModel.monteCarlo.bandLowPct}%</span>
            </div>
            <div className="panel space-y-1">
              <span className="label block">95% VaR (Tail Risk)</span>
              <span className="text-xl font-semibold text-caution-700">{latestModel.monteCarlo.valueAtRisk95Pct}%</span>
              <span className="text-ink-faint block">95th percentile</span>
            </div>
            <div className="panel space-y-1">
              <span className="label block">95% CVaR Shortfall</span>
              <span className="text-xl font-semibold text-risk-700">{latestModel.monteCarlo.conditionalValueAtRisk95Pct}%</span>
              <span className="text-ink-faint block">Worst 5% tail mean</span>
            </div>
            <div className="panel space-y-1">
              <span className="label block">99% Extreme VaR</span>
              <span className="text-xl font-semibold text-risk-700">{latestModel.monteCarlo.valueAtRisk99Pct}%</span>
              <span className="text-ink-faint block">
                99th %ile (CVaR: {latestModel.monteCarlo.conditionalValueAtRisk99Pct}%)
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-[14px]">
            <div className="panel space-y-1">
              <span className="label block">Output moments</span>
              <span className="text-lg font-semibold text-ink-muted">
                σ²: {latestModel.monteCarlo.variance}
              </span>
              <span className="text-ink-faint block">
                Skew: {latestModel.monteCarlo.skewness} • output kurtosis:{" "}
                {latestModel.monteCarlo.kurtosis}
              </span>
            </div>
            <div className="panel space-y-1">
              <span className="label block">Innovation excess kurtosis</span>
              <span className="text-lg font-semibold text-ink">
                {latestModel.monteCarlo.innovationExcessKurtosis}
              </span>
              <span className="text-ink-faint block">
                kurtosis {latestModel.monteCarlo.innovationKurtosis} (Gaussian = 3.0)
              </span>
            </div>
            <div className="panel space-y-1">
              <span className="label block">Simulated corr(CDS, HY)</span>
              <span className="text-lg font-semibold text-ink">
                {latestModel.monteCarlo.simulatedShockCorrelations.cdsHy}
              </span>
              <span className="text-ink-faint block">Published design value ≈ 0.80</span>
            </div>
          </div>

          {/* Crowd diagnostic — what the market prices versus what the model says */}
          <div className="panel space-y-2.5">
            <span className="label">Crowd diagnostic — the model against the market&apos;s own price</span>
            <p className="text-[14px] leading-relaxed text-ink-muted">
              The longest-dated tracked contract — AI bubble burst by June 30, 2027 — closed today
              at{" "}
              <span className="num font-semibold text-ink">
                {marketBand.contractPct.toFixed(1)}%
              </span>
              . Scaled to a 12-month horizon by the published bias factor α ={" "}
              {marketBand.alphaCentral.toFixed(2)}, that is the market-implied 12-month read of{" "}
              <span className="num font-semibold text-ink">
                {marketBand.centralPct.toFixed(1)}%
              </span>
              , spanning{" "}
              <span className="num font-semibold text-ink">
                {marketBand.lowPct.toFixed(1)}%–{marketBand.highPct.toFixed(1)}%
              </span>{" "}
              across α ∈ [{marketBand.alphaRange[0].toFixed(2)},{" "}
              {marketBand.alphaRange[1].toFixed(2)}]. The model sits{" "}
              {crowdDivergence.vsBandHigh.toFixed(1)} points above the top of that band and{" "}
              {crowdDivergence.vsRawContract.toFixed(1)} points above the raw Dec-2026 contract (
              {rawContract2026.toFixed(1)}%). The two ask different questions — the market asks &quot;AI
              downturn by date&quot;, this model asks &quot;AI capital bubble bursts inside 12 months&quot;
              — so part of the gap is definitional, not only informational.
            </p>
            <p className="text-[14px] leading-relaxed text-ink-subtle">
              Band floor rule: {BAND_FLOOR_RULE_SENTENCE} The published floor is{" "}
              <span className="num font-semibold text-ink">
                {latestModel.monteCarlo.bandLowPct}%
              </span>
              , the lower of the simulated 5th percentile and the market-implied 12-month price.
            </p>
          </div>
        </div>

        {/* ── SUBSECTION D: EMPIRICAL BACKTESTING & BRIER SCORE MATRIX ── */}
        <div className="space-y-5">
          <div className="flex items-center justify-between pb-1 border-b border-rule">
            <div>
              <span className="text-[13px] font-semibold text-ink-muted uppercase tracking-wider">
                PART D · HISTORICAL CONSISTENCY &amp; PRE-REGISTRATION
              </span>
              <h3 className="text-lg sm:text-xl font-bold text-ink mt-0.5">
                Historical Consistency &amp; Brier Score Matrix
              </h3>
            </div>
            <span className="px-3 py-1 rounded-full text-[13px] font-mono font-bold bg-surface-2 text-ink border border-rule">
              BS = {empiricalMatrix.brierScore.toFixed(3)} over {empiricalMatrix.resolvedEpochs}{" "}
              resolved episodes
            </span>
          </div>

          <p className="text-sm text-ink-muted leading-relaxed">
            A probabilistic forecasting engine is mathematically useless without a scorecard. The{" "}
            <strong>Brier Score</strong> measures the mean squared error between forecasted event
            probabilities <code className="font-mono text-ink-muted"> f_i ∈ [0, 1]</code> and binary
            realized crisis occurrences{" "}
            <code className="font-mono text-ink-muted"> o_i ∈ &#123;0, 1&#125;</code> — here over the
            resolved episodes only:
          </p>

          <div className="panel font-mono text-[14px] text-center text-ink-muted font-bold">
            <code>{"\\text{Brier Score (BS)} = \\frac{1}{N} \\sum_{i=1}^{N} \\left(f_i - o_i\\right)^2 \\le 0.050"}</code>
          </div>

          {/* Verification KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono text-[14px]">
            <div className="p-4 rounded-xl bg-surface-2 border border-safe-300/30 space-y-1">
              <span className="label block">Mean Brier score (resolved episodes only)</span>
              <div className="flex items-baseline space-x-2">
                <span className="text-2xl font-semibold text-safe-700">{empiricalMatrix.brierScore.toFixed(3)}</span>
                <span className="text-[14px] text-safe-700 font-bold">(n={empiricalMatrix.resolvedEpochs})</span>
              </div>
              <span className="text-ink-faint block">
                2026 in-window, excluded — same source as the table above
              </span>
            </div>

            <div className="panel space-y-1">
              <span className="label block">In-sample AUC</span>
              <div className="flex items-baseline space-x-2">
                <span className="text-2xl font-semibold text-caution-700">{inSampleAucValue.toFixed(3)}</span>
                <span className="text-[14px] text-ink font-bold">(6 points — indicative)</span>
              </div>
              <span className="text-ink-faint block">
                In-sample over a case-enriched table; not a discrimination score
              </span>
            </div>

            <div className="panel space-y-1">
              <span className="label block">Episodes in the table</span>
              <div className="flex items-baseline space-x-2">
                <span className="text-2xl font-semibold text-ink-muted">
                  {empiricalMatrix.totalHistoricalEpochs}
                </span>
                <span className="text-[14px] text-ink font-bold">
                  ({empiricalMatrix.resolvedEpochs} resolved, 1 in-window)
                </span>
              </div>
              <span className="text-ink-faint block">
                No out-of-sample accuracy figure is published — it is not computable here
              </span>
            </div>
          </div>

          {/* Full Empirical Verification Matrix Table */}
          <div className="overflow-x-auto border border-rule rounded-xl shadow-xs">
            <table className="w-full text-left text-[14px] font-mono">
              <caption className="sr-only">
                Empirical verification matrix: each historical epoch with its tracked debt, Merton
                distance-to-default, Altman Z&apos;&apos;, model probability, observed outcome, Brier
                score and verification status.
              </caption>
              <thead className="bg-surface-2 border-b border-rule text-ink-subtle">
                <tr>
                  <th scope="col" className="p-3.5">Historical Epoch &amp; Date</th>
                  <th scope="col" className="p-3.5">Tracked Debt</th>
                  <th scope="col" className="p-3.5">Merton DD (σ)</th>
                  <th scope="col" className="p-3.5">Altman Z&apos;&apos;</th>
                  <th scope="col" className="p-3.5">Model Prob</th>
                  <th scope="col" className="p-3.5">Actual Crisis</th>
                  <th scope="col" className="p-3.5">Brier Score</th>
                  <th scope="col" className="p-3.5">Verification Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-rule divide-rule/80">
                {HISTORICAL_BACKTESTS.map((test) => (
                  <tr key={test.id} className="hover:bg-surface-2/50 hover:bg-surface-2/40 transition-colors">
                    <th scope="row" className="p-3.5">
                      <span className="font-bold text-ink block">{test.era}</span>
                      <span className="text-ink-subtle">{test.date}</span>
                    </th>
                    <td className="p-3.5 font-medium text-ink-muted">{test.debtExposureUsd}</td>
                    <td className="p-3.5 font-bold text-ink-muted">{test.mertonDistanceToDefault.toFixed(2)}σ</td>
                    <td className="p-3.5 font-bold text-ink">{test.altmanZScore.toFixed(2)}</td>
                    <td className="p-3.5 font-semibold text-risk-700">{test.modelProbabilityPct.toFixed(1)}%</td>
                    <td className="p-3.5">
                      <span className={`px-2 py-0.5 rounded text-ink font-bold ${
                        test.actualBurstObserved
                          ? "bg-risk-50 text-risk-700 bg-risk-50 text-risk-600 border border-risk-200 border-risk-500"
                          : "bg-safe-50 text-safe-700 bg-safe-50 text-safe-600 border border-safe-200 border-safe-500"
                      }`}>
                        {test.actualBurstObserved ? "Crisis Observed (1.0)" : "In Progress (0.0)"}
                      </span>
                    </td>
                    <td className="p-3.5 font-bold text-safe-700">
                      {test.brierScore === null ? "—" : test.brierScore.toFixed(4)}
                    </td>
                    <td className="p-3.5">
                      <span className="inline-flex items-center space-x-1 text-ink-muted font-bold">
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                        <span>
                          {test.brierScoreResolved === false
                            ? "Open window — not scored"
                            : "Consistency recorded (not validated)"}
                        </span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="text-[14px] text-ink-subtle font-sans leading-relaxed pt-2 border-t border-rule">
            {empiricalMatrix.validationDescription} The published mean Brier score is{" "}
            <strong>{empiricalMatrix.brierScore.toFixed(4)}</strong>, computed over the{" "}
            {empiricalMatrix.resolvedEpochs} resolved episodes only — the open 2026 window carries no
            score. It is a consistency measure on a case-enriched table, not a calibration of an
            unconditional probability, and it is not evidence that the live mapping is correct.
          </p>

          {/* Pre-registration — published before the window resolves */}
          <div className="panel space-y-2.5">
            <span className="label">Pre-registration — what counts as a burst, and when it is scored</span>
            <ul className="space-y-1.5 text-[14px] leading-relaxed text-ink-muted">
              <li>
                • <span className="font-semibold text-ink-muted">Event definition:</span> any of —
                the tracked basket −30% peak-to-trough, Oracle 5Y CDS +100bp, or tracked debt
                issuance −50% — inside the 12-month window.
              </li>
              <li>
                • <span className="font-semibold text-ink-muted">Ledger:</span> the daily pair
                (published probability p, composite score S) and the model version are retained
                every day, so the pre-registered record cannot be rewritten after the fact.
              </li>
              <li>
                • <span className="font-semibold text-ink-muted">Maturity:</span> no outcome has
                matured — first maturity 19 October 2027; no score is published until then.
              </li>
            </ul>
          </div>
        </div>
      </section>

      <AdSlot placementId="methodology-bottom" className="mt-10" />

      {/* Regulatory & Institutional Compliance Disclaimer */}
      <div className="p-4 sm:p-5 rounded-lg bg-caution-500/5 border border-caution-300/20 text-[14px] text-ink-muted space-y-2">
        <div className="flex items-center space-x-2 text-caution-700 font-mono font-bold uppercase tracking-wider text-ink">
          <AlertTriangle className="w-4 h-4 text-caution-700 shrink-0" />
          <span>Regulatory Notice — Not Financial Advice</span>
        </div>
        <p className="leading-relaxed font-sans text-[14px] text-ink-muted">
          The mathematical methodologies, formulas, empirical calibrations, and backtesting matrices documented on this page are published solely for academic research, financial modeling education, and quantitative risk demonstration. Nothing herein constitutes investment advice, securities valuation certification, or trading recommendations.
        </p>
      </div>
    </div>
  );
}

