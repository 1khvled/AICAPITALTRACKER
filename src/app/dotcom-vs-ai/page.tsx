"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  ShieldAlert,
  Flame,
  Scale,
  Zap,
  TrendingDown,
  TrendingUp,
  Activity,
  Layers,
  ArrowRight,
  ArrowUpRight,
  Database,
  Building2,
  Server,
  DollarSign,
  Cpu,
  BarChart3,
  Sliders,
  CheckCircle2,
  XCircle,
  HelpCircle,
  AlertTriangle,
  FileText,
  Percent,
  Search,
  Filter,
  RefreshCw,
  Info,
  ChevronDown,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import { AdSlot } from "@/components/AdSlot";
import {
  evaluateBubbleModel,
  computeMertonModel,
  computeAltmanZScore,
  DEFAULT_MODEL_INPUTS,
} from "@/lib/model/engine";
import type { BubbleBand, BubbleModelInputs } from "@/lib/model/types";
import { POLYMARKET_BASE_URL } from "@/data/polymarket-data";

// ============================================================================
// DATA DEFINITIONS & COMPARISON SCORECARD
// ============================================================================

export interface MetricComparison {
  id: string;
  category: "cashflows" | "infrastructure" | "debt" | "macro" | "valuations" | "deflation";
  title: string;
  dotcom2000: {
    figure: string;
    description: string;
    status: "critical" | "warning" | "neutral";
  };
  ai2026: {
    figure: string;
    description: string;
    status: "healthy" | "warning" | "critical";
  };
  structuralVerdict: string;
  riskRating: "Low Divergence" | "Moderate Divergence" | "Extreme Structural Divergence";
  analyticalTakeaway: string;
}

const COMPARISON_METRICS: MetricComparison[] = [
  {
    id: "cash-flow",
    category: "cashflows",
    title: "Sector Operating Cash Flow (OCF) & Retained FCF",
    dotcom2000: {
      figure: "-$15.2B Burn",
      description: "80% of publicly listed dot-coms ran negative operating cash flow; median firm had <9 months of cash runway before bankruptcy.",
      status: "critical",
    },
    ai2026: {
      // 2026-10-19 fact-check (pass 3): capex basis corrected to $725B guided CY2026 (Jul 2026 calls: AMZN ~$220B,
      // GOOGL $195–205B, MSFT ~$175B incl. leases, META $130–145B; Forbes Oct 7 2026: "$700–725B"). OCF stays the
      // tracker-ledger SEC-filings sum (>$668B trailing, 5 companies); Forbes Oct 7 2026: 2026 capex consumes nearly
      // all big-4 OCF, Amazon 2026 FCF guided negative.
      figure: "+$668B+ FY OCF vs $725B Capex Guided",
      description: "Top 5 hyperscalers (MSFT, GOOGL, META, AMZN, AAPL) generate >$668B trailing operating cash flow and >$400B net profits (tracker ledger, SEC filings), but big-4 CY2026 capex is guided at ~$725B (Jul 2026 calls) — Forbes (Oct 7, 2026) reports 2026 capex consuming nearly all four companies' operating cash flow, with Amazon guided to negative FCF.",
      status: "healthy",
    },
    structuralVerdict: "Fortress Balance Sheets vs Zero-Cash Burners",
    riskRating: "Extreme Structural Divergence",
    analyticalTakeaway:
      "The dot-com bubble burst because startups literally ran out of dollar bills when capital markets froze. In 2026, Big Tech still generates multi-hundred-billion trailing operating cash flow every year (>$668B cohort, SEC filings) — but Forbes (Oct 7, 2026) reports guided CY2026 capex of ~$725B consuming nearly all big-4 OCF, with the marginal shortfall increasingly funded through $214.9B of tracked AI debt rather than pure organic cash.",
  },
  {
    id: "infra-utilization",
    category: "infrastructure",
    title: "Infrastructure Utility & Hardware Saturation Rate",
    dotcom2000: {
      figure: "3% – 5% Lit Fiber",
      description: "Telecom carriers laid 39 million miles of long-haul fiber optic cable ($30B+ capex); over 95% remained unlit 'dark fiber' for a decade.",
      status: "critical",
    },
    ai2026: {
      figure: "82% – 94% GPU Saturation",
      // 2026-10-19 fact-check: the stale "350M+ active weekly users" figure is
      // replaced by OpenAI's own number — 1.2B weekly ChatGPT users, DevDay
      // 2026 recap, 29 Sep 2026 (openai.com/index/devday-2026-recap: "our
      // collective 1.2B weekly users"; The Verge, 29 Sep 2026).
      description: "Frontier H100/H200/B200 GPU clusters operate at peak capacity across hyperscalers and neoclouds, serving 1.2B weekly users (OpenAI DevDay, Sep 29 2026).",
      status: "healthy",
    },
    structuralVerdict: "Real Immediate Demand vs Stranded Physical Assets",
    riskRating: "Extreme Structural Divergence",
    analyticalTakeaway:
      "Telecom fiber was laid ahead of user applications (streaming video, e-commerce broadband did not exist yet). AI GPUs, by contrast, are immediately saturated with generative inference and continuous frontier training.",
  },
  {
    id: "debt-collateral",
    category: "debt",
    title: "Debt Architecture & Credit Contagion Vector",
    dotcom2000: {
      figure: "$1.2T Public Junk Bonds",
      description: "Unsecured high-yield bonds issued by speculative telecom carriers (WorldCom, Global Crossing, 360networks); resulted in catastrophic defaults.",
      status: "critical",
    },
    ai2026: {
      figure: "$214.9B Tracked Debt (7.5% Share)",
      description: "Debt is concentrated in asset-backed GPU facilities (CoreWeave $25.1B, Blackstone SPVs) and high-grade corporate bonds (Oracle $130.1B).",
      status: "warning",
    },
    structuralVerdict: "Contained to Leveraged Neoclouds & SPVs",
    riskRating: "Moderate Divergence",
    analyticalTakeaway:
      "Debt is far smaller as a percentage of total tech capitalization (7.5% across our 169 verified deals). However, 3-year GPU depreciation cycles mean debt-financed neoclouds face severe refinancing pinches if spot compute rates fall.",
  },
  {
    id: "fed-rates",
    category: "macro",
    title: "Federal Reserve Monetary Policy & Discount Rates",
    dotcom2000: {
      figure: "6.50% Fed Funds Peak",
      description: "The Fed aggressively hiked rates by 175 bps into May 2000, inverting the yield curve (10Y reached 6.66%) and cutting off speculative capital.",
      status: "critical",
    },
    ai2026: {
      // FRED Oct 15-16 2026: DGS10 5.10%, T10YIE 2.35% → real 2.75%; FEDFUNDS Sep 2026 3.75% (cut cycle); BAMLH0A0HYM2 323bp (Oct 15)
      figure: "5.10% US 10Y / 3.75% Fed Funds",
      description: "US 10-Year yield sits at 5.10% (real yield ~2.75%). Elevated discount rates compress valuations, but corporate credit spreads remain tight at 323 bps.",
      status: "warning",
    },
    structuralVerdict: "Restrictive Hurdle Rate without Sudden Liquidity Shock",
    riskRating: "Moderate Divergence",
    analyticalTakeaway:
      "While a 5.10% 10-year yield sets a high capital hurdle rate, credit markets remain open and corporate spreads are historically tight, unlike the sharp liquidity freeze of summer 2000.",
  },
  {
    id: "software-revenue",
    category: "valuations",
    title: "Software Revenue & Monetization Scale",
    dotcom2000: {
      figure: "$0 Real ARR (Eyeballs Metric)",
      description: "Companies were valued on 'pageviews', 'click-throughs', and banner ad swaps. Pets.com had $619k in revenue on $147M spent.",
      status: "critical",
    },
    ai2026: {
      // 2026-10-19 fact-check: "$165B all verified ARR" was unsourced. Sourced named components:
      // OpenAI ~$50B annualized run-rate (FT/Reuters/Bloomberg, Oct 8-9 2026), Anthropic $65B
      // run-rate end-July 2026 (Bloomberg/CNBC, Aug 2026; was $47B in May — stale figure removed),
      // Microsoft AI $37B run-rate (official FY26 Q3 release, Apr 29 2026), Databricks $7B
      // (Databricks press release, Aug 13 2026). 50+65+37+7 = $159B GROSS of cloud-partner
      // overlap (Amazon's ~$25B AWS AI disclosure adds more; not de-duplicated anywhere).
      figure: "$159B+ Reported Enterprise AI ARR",
      description: "OpenAI runs at ~$50.0B annualized (FT/Reuters, Oct 2026), Anthropic's run-rate passed $65B by end-July 2026 (Bloomberg/CNBC), Microsoft's AI business reached $37.0B (official FY26 Q3), Databricks $7.0B — $159B+ gross of cloud-partner overlap.",
      status: "healthy",
    },
    structuralVerdict: "Real Enterprise Software Utility vs Virtual Eyeballs",
    riskRating: "Extreme Structural Divergence",
    analyticalTakeaway:
      "Generative AI has achieved the fastest software revenue acceleration in modern history, scaling from zero to $159B+ in reported enterprise ARR within 42 months of the 2023 commercial-API era.",
  },
  {
    id: "equity-multiples",
    category: "valuations",
    title: "Equity Multiples & Valuation Stretch",
    dotcom2000: {
      figure: "Cisco 38× P/S · Yahoo 100× P/S",
      description: "Cisco reached $555B valuation at 125× P/E. Unprofitable dot-coms traded at 100× sales without viable path to positive gross margins.",
      status: "critical",
    },
    ai2026: {
      figure: "NVIDIA 28× P/S · Big Tech 28–34× P/E",
      description: "NVIDIA ($5.27T cap on $185B ARR) trades at ~28× sales. Hyperscalers trade at 28–34× P/E. Private frontier labs trade at 19–42× ARR.",
      status: "warning",
    },
    structuralVerdict: "Elevated Multiples, but Grounded in 50%+ Operating Margins",
    riskRating: "Low Divergence",
    analyticalTakeaway:
      "While valuations are rich, NVIDIA delivers 75% gross margins and $185B in actual hardware shipments. Frontier labs are stretched, but aggregate tech valuations are 40% lower than Cisco's 2000 peak.",
  },
  {
    id: "unit-deflation",
    category: "deflation",
    title: "Unit Economics Deflation (Cost per Workload)",
    dotcom2000: {
      figure: "-25% Slow Dial-Up Decline",
      description: "Bandwidth costs fell modestly (~25% YoY). Dial-up modems (56kbps) physically choked rich applications; high transit fees persisted.",
      status: "critical",
    },
    ai2026: {
      // 2026-10-19 fact-check: input-basis recomputation. GPT-4 Mar 2023 input $30/1M; DeepSeek
      // V4.1 Flash input $0.0448/1M (OpenRouter live; aggregated open-weights serving — DeepSeek
      // first-party API: $0.15/$0.60 off-peak). 30 / 0.0448 ≈ 669.6 → 670×, i.e. 1 - 1/669.6
      // from the old $0.08 completion-basis "375×" figure and the stale "$0.50 Haiku 5.5" input claim
      // (Haiku 5.5 is actually $0.10 in / $0.50 out, Oct 7 2026).
      figure: "-99.85% Token Deflation (670× Cheaper, Input Basis)",
      description: "Inference input costs collapsed from $30.00/1M (GPT-4, Mar 2023) to $0.0448/1M (DeepSeek V4.1 Flash) and $0.10/1M input / $0.50 completion (Claude Haiku 5.5, Oct 2026).",
      status: "healthy",
    },
    structuralVerdict: "Massive Margin Expansion for Software Builders",
    riskRating: "Extreme Structural Divergence",
    analyticalTakeaway:
      "Exponential token deflation is the ultimate economic cushion: it allows end-user software applications to turn profitable rapidly, creating genuine business utility.",
  },
  {
    id: "systemic-vector",
    category: "debt",
    title: "Primary Systemic Vulnerability Vector",
    dotcom2000: {
      figure: "Systemic Public Equity Crash",
      description: "Broad retail equity crash wiping out $5T across Nasdaq (-78% peak-to-trough) and triggering a general US economic recession.",
      status: "critical",
    },
    ai2026: {
      figure: "Neocloud Credit Refinance Squeeze",
      description: "Vulnerability is concentrated in secondary GPU cloud providers and private debt facilities unable to roll over debt as hardware depreciates.",
      status: "warning",
    },
    structuralVerdict: "Isolated Credit Restructuring vs Macro Equity Collapse",
    riskRating: "Moderate Divergence",
    analyticalTakeaway:
      "An AI correction would look like a private credit restructuring wave among secondary compute providers (the 1999 CLEC parallel) rather than an existential solvency crisis for Microsoft, Google, or Apple.",
  },
];

// ============================================================================
// REGIME RECORDS — the simulator is driven by the same engine as the site
// ============================================================================
//
// 2026-10-19 (B-F11, algorithm-improvement wave): the three regime cards are TYPED
// BubbleModelInputs records and every number the simulator prints is the engine's
// output at render time. The hand-authored literals are gone: there is no
// hand-written probability, score, band, Merton distance or Altman zone in this file.
//
// DOCUMENTED CHOICES (one line each — no invented field names, only the eight input
// groups the engine ingests: cds, valuations, ledger, crowd, adoption, capex, macro, aiDebt):
//  · 2000 CDS 600bp against an 80bp telecom norm — conservative, the worst 2001
//    telecom prints implied more than 1000bp.
//  · 2000 valuations: era market caps over era revenue, carried in the same
//    valuationUsd / runRateRevenueUsd fields the live input set uses.
//  · 2000 crowd: 0 — no prediction market existed in 2000, so the leg is zero (not missing).
//  · 2000 adoption: nulls — no comparable consumer series, so the damper is off (not invented).
//  · 2000 capex/FCF: $120B telecom capex against ~$15B of cohort operating cash flow
//    (kept positive: a zero FCF reads as "unreported" to the engine).
//  · 2000 macro: 10Y 6.66%, fed funds 6.50% (May 2000 peak), CPI 3.4%, HY-OAS 600bp,
//    CAPE 44 — the published era prints.
//  · 2000 aiDebt: $1.2T of 1990s telecom junk issuance (the scorecard figure above)
//    and no GPU depreciation drag (0 — there were no GPUs in 2000).
//  · 2000 ledger.byYear carries the 1996-2000 era years; the engine's velocity leg
//    reads the CURRENT year, so it falls back to the live 2026 pace. That understates
//    the 2000 boom — disclosed here rather than silently patched.
//  · Credit-freeze CDS 400bp (re-priced from the 288bp record close), HY-OAS 550bp,
//    US10Y 5.50%, fed funds 4.50% (emergency hold), CPI 3.9%.
//  · Credit-freeze crowd: 25% YES on the same 2026 contract the live feed reads ($25M traded).
//  · Credit-freeze capex: free cash flow compresses to $160B as GPU clusters are written down.
//  · Credit-freeze aiDebt: the tracked base grows to $450B (undrawn GPU-fleet facilities
//    are drawn to keep clusters alive before any restructuring).
//  · Credit-freeze valuations and adoption are carried over unchanged: a credit freeze
//    re-prices the financing, not the lab marks or the usage data.
const DOTCOM_2000_INPUTS: BubbleModelInputs = {
  cds: {
    currentBps: 600,
    baselineBps: 80,
    priorBps: 150,
    otherBps: 450,
    note: "Telecom-era credit: ~600bp implied 5Y spread on the 1999-2000 CLEC/telecom complex against an 80bp long-run norm (the worst 2001 prints implied >1000bp)",
  },
  valuations: [
    {
      company: "Cisco (Mar 2000 peak)",
      valuationUsd: 555_000_000_000,
      runRateRevenueUsd: 18_900_000_000,
      note: "Peak market cap ~$555B over FY2000 revenue $18.9B = 29.4x sales (era multiple, same fields the live input set uses)",
    },
    {
      company: "Nortel Networks (Jul 2000 peak)",
      valuationUsd: 250_000_000_000,
      runRateRevenueUsd: 17_400_000_000,
      note: "Peak market cap ~$250B over FY2000 revenue $17.4B = 14.4x sales",
    },
    {
      company: "Qualcomm (2000 peak)",
      valuationUsd: 100_000_000_000,
      runRateRevenueUsd: 4_000_000_000,
      note: "Peak market cap ~$100B over FY2000 revenue $4.0B = 25x sales",
    },
    {
      company: "Yahoo! (Sep 2000 peak)",
      valuationUsd: 115_000_000_000,
      runRateRevenueUsd: 1_085_000_000,
      note: "Peak market cap ~$115B over FY2000 revenue $1.085B = 106x sales",
    },
  ],
  ledger: {
    totalDisclosedUsd: 1_200_000_000_000,
    byYear: {
      1996: 40_000_000_000,
      1997: 80_000_000_000,
      1998: 150_000_000_000,
      1999: 300_000_000_000,
      2000: 630_000_000_000,
    },
    debtShare: 0.28,
    computeContractShare: 0.35,
    top10Share: 0.72,
    circularShare: 0.09,
    announcedShare: 0.18,
    megaCountLast12m: 42,
    daysSinceLastMega: 6,
  },
  crowd: {
    yesProbability: 0,
    volumeUsd: 0,
    bubble2026Probability: 0,
    bubble2027Probability: 0,
    activeContractsCount: 0,
    note: "No prediction market existed in 2000 — the crowd leg is zero, not missing",
  },
  adoption: {
    topProductUsers: null,
    annualUserGrowth: null,
    apiPriceDeclineMultiple: null,
    trainingCostBand: null,
    note: "No comparable consumer-adoption series in 2000 — the real-use damper is off, not fabricated",
  },
  capex: {
    aggregateCapexUsd: 120_000_000_000,
    aggregateFcfUsd: 15_000_000_000,
    note: "Telecom capex ~$120B/yr against ~$15B of cohort operating cash flow",
  },
  macro: {
    us10yYieldPct: 6.66,
    us02yYieldPct: 6.2,
    us10yBaselinePct: 3.75,
    cpiInflationYoY: 3.4,
    fedFundsRatePct: 6.5,
    rateHikeRiskBps: 100,
    realYield10y: 3.26,
    highYieldSpreadBps: 600,
    capeMultiple: 44,
    note: "Mar 2000: 10Y 6.66%, fed funds 6.50% (May 2000 peak), CPI ~3.4%, HY OAS ~600bp, CAPE ~44",
  },
  aiDebt: {
    annualDebtIssuanceUsd: 40_000_000_000,
    totalTrackedDebtUsd: 1_200_000_000_000,
    capexToOcfRatio: 0.75,
    gpuDepreciationDragUsd: 0,
    capexToRevenueMultiple: 6,
    note: "$1.2T of 1990s telecom junk issuance; no GPU amortization drag in 2000 (0)",
  },
};

const CREDIT_FREEZE_INPUTS: BubbleModelInputs = {
  ...DEFAULT_MODEL_INPUTS,
  cds: {
    currentBps: 400,
    baselineBps: 81,
    priorBps: 288,
    otherBps: 450,
    note: "Neocloud credit freeze: the 5Y Oracle CDS re-prices from the 288bp record close to ~400bp as GPU-cluster financing is repriced",
  },
  ledger: {
    ...(DEFAULT_MODEL_INPUTS.ledger as NonNullable<BubbleModelInputs["ledger"]>),
    debtShare: 0.09,
    top10Share: 0.66,
    circularShare: 0.05,
    announcedShare: 0.14,
    daysSinceLastMega: 30,
  },
  crowd: {
    ...(DEFAULT_MODEL_INPUTS.crowd as NonNullable<BubbleModelInputs["crowd"]>),
    yesProbability: 0.25,
    bubble2026Probability: 0.25,
    bubble2027Probability: 0.55,
    volumeUsd: 25_000_000,
  },
  capex: {
    ...(DEFAULT_MODEL_INPUTS.capex as NonNullable<BubbleModelInputs["capex"]>),
    aggregateFcfUsd: 160_000_000_000,
  },
  macro: {
    ...(DEFAULT_MODEL_INPUTS.macro as NonNullable<BubbleModelInputs["macro"]>),
    us10yYieldPct: 5.5,
    cpiInflationYoY: 3.9,
    fedFundsRatePct: 4.5,
    rateHikeRiskBps: 50,
    realYield10y: 2.4,
    highYieldSpreadBps: 550,
    capeMultiple: 26,
  },
  aiDebt: {
    ...(DEFAULT_MODEL_INPUTS.aiDebt as NonNullable<BubbleModelInputs["aiDebt"]>),
    annualDebtIssuanceUsd: 120_000_000_000,
    totalTrackedDebtUsd: 450_000_000_000,
    capexToOcfRatio: 0.68,
    gpuDepreciationDragUsd: 60_000_000_000,
    capexToRevenueMultiple: 12,
  },
};

/**
 * Altman Z'' components per regime. The engine's live constants describe the 2026
 * hyperscaler cohort; the 2000 telecom cohort and the neocloud freeze need their own
 * balance-sheet ratios, so they are passed through the engine's own API.
 */
const ALT_DOTCOM_2000 = { x1: 0.08, x2: -0.28, x3: 0.01, x4: 0.75 };
const ALT_CREDIT_FREEZE = { x1: 0.08, x2: -0.25, x3: 0.02, x4: 1.35 };

/** Engine band -> display label + the site's semantic tone tokens. */
const BAND_DISPLAY: Record<
  BubbleBand,
  { label: string; bandColor: string; badgeColor: string }
> = {
  calm: {
    label: "CALM",
    bandColor: "text-safe-700",
    badgeColor: "bg-safe-500/10 text-safe-700 border-safe-300/20",
  },
  guarded: {
    label: "GUARDED",
    bandColor: "text-caution-700",
    badgeColor: "bg-caution-500/10 text-caution-700 border-caution-300/20",
  },
  elevated: {
    label: "ELEVATED",
    bandColor: "text-caution-700",
    badgeColor: "bg-caution-500/10 text-caution-700 border-caution-300/20",
  },
  high: {
    label: "HIGH",
    bandColor: "text-risk-700",
    badgeColor: "bg-risk-500/10 text-risk-700 border-risk-300/20",
  },
  critical: {
    label: "CRITICAL",
    bandColor: "text-risk-700",
    badgeColor: "bg-risk-500/10 text-risk-700 border-risk-300/20",
  },
};

interface RegimeOutput {
  burstProb: number;
  score: number;
  band: string;
  bandColor: string;
  badgeColor: string;
  mertonDD: string;
  altmanZone: string;
}

/** Run a regime record through the engine and shape the result for display. */
function evaluateRegime(
  inputs: BubbleModelInputs,
  altmanComponents?: { x1?: number; x2?: number; x3?: number; x4?: number },
): RegimeOutput {
  const result = evaluateBubbleModel(inputs);
  const merton = computeMertonModel(inputs);
  const altman = computeAltmanZScore(inputs, altmanComponents);
  const band = BAND_DISPLAY[result.band];
  return {
    burstProb: result.burstProbability,
    score: result.compositeScore,
    band: band.label,
    bandColor: band.bandColor,
    badgeColor: band.badgeColor,
    mertonDD: `${merton.distanceToDefault.toFixed(2)}σ`,
    altmanZone: `${altman.zone.split("(")[0].trim()} (${altman.score.toFixed(2)})`,
  };
}

const LIVE_REGIME = evaluateRegime(DEFAULT_MODEL_INPUTS);
const DOTCOM_2000_REGIME = evaluateRegime(DOTCOM_2000_INPUTS, ALT_DOTCOM_2000);
const CREDIT_FREEZE_REGIME = evaluateRegime(CREDIT_FREEZE_INPUTS, ALT_CREDIT_FREEZE);

// The live input blocks the simulator levers write into (non-null in the live set).
const liveCapex = DEFAULT_MODEL_INPUTS.capex as NonNullable<BubbleModelInputs["capex"]>;
const liveAiDebt = DEFAULT_MODEL_INPUTS.aiDebt as NonNullable<BubbleModelInputs["aiDebt"]>;
const liveMacro = DEFAULT_MODEL_INPUTS.macro as NonNullable<BubbleModelInputs["macro"]>;
const liveAdoption = DEFAULT_MODEL_INPUTS.adoption as NonNullable<BubbleModelInputs["adoption"]>;

// The three card captions are READ from the regime records — no hand-typed numbers.
const LIVE_CARD_SUMMARY = `$${((liveCapex.aggregateFcfUsd ?? 0) / 1e9).toFixed(0)}B FCF · ${liveMacro.us10yYieldPct.toFixed(2)}% US10Y · ${liveAdoption.apiPriceDeclineMultiple}× Cheaper`;
const DOTCOM_2000_CARD_SUMMARY = `${DOTCOM_2000_INPUTS.cds?.currentBps}bp CDS · ${DOTCOM_2000_INPUTS.macro?.fedFundsRatePct.toFixed(2)}% Fed Funds · $${((DOTCOM_2000_INPUTS.aiDebt?.totalTrackedDebtUsd ?? 0) / 1e12).toFixed(1)}T Junk Debt`;
const CREDIT_FREEZE_CARD_SUMMARY = `${CREDIT_FREEZE_INPUTS.cds?.currentBps}bp CDS · ${CREDIT_FREEZE_INPUTS.macro?.highYieldSpreadBps}bp HY-OAS · $${((CREDIT_FREEZE_INPUTS.aiDebt?.totalTrackedDebtUsd ?? 0) / 1e9).toFixed(0)}B Tracked Debt`;

// INVARIANT (asserted here in code, never in the page copy): every preset labelled a
// STRESS must score at or above the live baseline once the modes compute from the
// engine. Live baseline 32.3% (score 48.3) · neocloud credit freeze 90.3% (75.1) ·
// 2000 dot-com peak 97.4% (87.5). A preset that fell below the baseline would be a
// stress that scores calmer than reality — a broken simulator, not a finding.
if (process.env.NODE_ENV !== "production") {
  const stressPresets: { id: string; out: RegimeOutput }[] = [
    { id: "neocloud-credit-freeze", out: CREDIT_FREEZE_REGIME },
    { id: "dot-com-2000", out: DOTCOM_2000_REGIME },
  ];
  for (const preset of stressPresets) {
    if (preset.out.burstProb < LIVE_REGIME.burstProb) {
      console.error(
        `[dotcom-vs-ai] regime invariant broken: ${preset.id} (${preset.out.burstProb}%) scores BELOW the live baseline (${LIVE_REGIME.burstProb}%)`,
      );
    }
  }
}

export default function DotComVsAiPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"scorecard" | "clec-parallel" | "cashflows" | "simulator">("scorecard");
  
  // Interactive Simulator State
  // 2026-10-19 (B-F11): the lever defaults ARE the live input values, so the live mode
  // reproduces the canonical print (32.3%) instead of a hand-rolled approximation.
  const [simRegime, setSimRegime] = useState<"dotcom2000" | "ai2026" | "creditFreeze">("ai2026");
  const [customFcf, setCustomFcf] = useState<number>(Math.round((liveCapex.aggregateFcfUsd ?? 0) / 1e9)); // $B
  const [customDebt, setCustomDebt] = useState<number>(Math.round((liveAiDebt.totalTrackedDebtUsd / 1e9) * 10) / 10); // $B — ledger totalTrackedDebtUsd
  const [customYield, setCustomYield] = useState<number>(liveMacro.us10yYieldPct); // %
  const [customDeflation, setCustomDeflation] = useState<number>(liveAdoption.apiPriceDeclineMultiple ?? 670); // x cheaper

  // Current verified model result
  // 2026-10-19 (B-F11): the baseline model is evaluated once at module scope
  // (LIVE_REGIME) — the simulator no longer keeps a second, hand-rolled copy of the
  // live numbers.

  // Filtered metrics
  const filteredMetrics = useMemo(() => {
    return COMPARISON_METRICS.filter((m) => {
      const matchesCategory = selectedCategory === "all" || m.category === selectedCategory;
      const matchesSearch =
        m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.structuralVerdict.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.analyticalTakeaway.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  // 2026-10-19 (B-F11): the live mode runs the SAME engine on the live input set with
  // the four levers applied — the old hand-rolled deltas (each $20B of FCF = 1.2%, each
  // $30B of debt = 1.5%) are gone; the published model produces the number.
  const liveSimInputs: BubbleModelInputs = useMemo(
    () => ({
      ...DEFAULT_MODEL_INPUTS,
      capex: { ...liveCapex, aggregateFcfUsd: customFcf * 1_000_000_000 },
      aiDebt: { ...liveAiDebt, totalTrackedDebtUsd: customDebt * 1_000_000_000 },
      macro: { ...liveMacro, us10yYieldPct: customYield },
      adoption: { ...liveAdoption, apiPriceDeclineMultiple: customDeflation },
    }),
    [customFcf, customDebt, customYield, customDeflation],
  );

  // Dynamic simulation score calculation
  const simResult = useMemo<RegimeOutput & { interpretation: string }>(() => {
    if (simRegime === "dotcom2000") {
      return {
        ...DOTCOM_2000_REGIME,
        interpretation:
          "Dot-Com 2000 scenario: Negative cash flows, zero software ARR, and 6.50% Fed rate spike make systemic liquidation inevitable.",
      };
    } else if (simRegime === "creditFreeze") {
      return {
        ...CREDIT_FREEZE_REGIME,
        interpretation:
          "Neocloud Credit Freeze scenario: Secondary GPU clouds default on debt facilities; Big Tech absorbs distressed clusters at 40¢ on the dollar.",
      };
    }
    return {
      ...evaluateRegime(liveSimInputs),
      interpretation: `2026 Baseline: Massive hyperscaler cash flows protect equity solvency, counterbalancing $${customDebt}B in private debt facilities.`,
    };
  }, [simRegime, liveSimInputs, customDebt]);

  return (
<div className="section-sm">
      {/* Top banner ad */}
      <AdSlot placementId="dotcom-top" />

      {/* Page head */}
      <header className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
          <span className="label">2000 vs 2026</span>
          <span className="pill">Episodic market history</span>
          <span className="num text-[14px] text-ink-faint">OCTOBER 19, 2026 - macro &amp; SEC filing synthesis</span>
        </div>

        <h1 className="max-w-reading text-3xl font-bold tracking-tight text-ink sm:text-4xl">
          AI Superstructure (2026) vs. Dot-Com Bubble (2000)
        </h1>

        <p className="prose prose-lead max-w-reading">
          A quantitative macroeconomic investigation contrasting the 1999–2000 telecom crash against the
          2026 generative AI deployment supercycle. Why{" "}
          <strong className="text-ink">$668B in organic hyperscaler cash flows</strong> shields public
          equities, but <strong className="text-caution-700">$214.9B in debt-financed GPU neoclouds</strong>{" "}
          exhibits classic dot-com telecom refinancing fragility.
        </p>
      </header>

      {/* Three analytical pillars */}
      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="card space-y-2">
          <p className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-safe-700" aria-hidden="true" />
            <span className="label">THE FORTRESS SOLVENCY CUSHION</span>
          </p>
          <h2 className="text-[15px] font-semibold text-ink">
            +$668B+ Hyperscaler Cash Flows vs $725B Guided Capex
          </h2>
          <p className="prose text-[14px]">
            {/* 2026-10-19 fact-check: capex basis corrected $485B → $725B guided CY2026 (Jul 2026 calls); "self-funding organically" re-scoped per Forbes Oct 7 2026 (capex ≈ nearly all big-4 OCF, Amazon 2026 FCF guided negative). MSFT FY26 OCF $182.9B (Alpha Vantage / SEC filer data). */}
            Unlike 2000 dot-coms that burnt -$15B annually with zero profits, Microsoft, Google, Meta, Amazon, and Apple still produce <span className="font-semibold text-ink">&gt;$668B trailing OCF</span> and <span className="font-semibold text-ink">$400B+ net profit</span> (tracker ledger, SEC filings) — but <span className="font-semibold text-ink">$725B of guided CY2026 capex</span> plus $140B in power/depreciation now consumes nearly all of it (Forbes, Oct 7 2026), with Amazon guided to negative FCF in 2026.
          </p>
        </div>

        <div className="card space-y-2">
          <p className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-caution-700" aria-hidden="true" />
            <span className="label">THE 1999 CLEC REFINANCE TRAP</span>
          </p>
          <h2 className="text-[15px] font-semibold text-ink">$214.9B Private GPU Debt Risk</h2>
          <p className="prose text-[14px]">
            The real fragility resides in secondary GPU cloud providers (CoreWeave $25.1B debt, Crusoe $3.4B
            JV) mirroring 1999 Competitive Local Exchange Carriers (CLECs) whose physical assets
            depreciated faster than loan amortizations.
          </p>
        </div>

        <div className="card space-y-2">
          <p className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-ink-subtle" aria-hidden="true" />
            <span className="label">REAL HARDWARE UTILIZATION</span>
          </p>
          <h2 className="text-[15px] font-semibold text-ink">85%+ Saturation vs 5% Dark Fiber</h2>
          <p className="prose text-[14px]">
            Telecom carriers laid 39M miles of dark fiber that stayed unlit for a decade. Frontier GPU
            clusters run at peak utilization while token input costs have deflated up to{" "}
            <span className="font-semibold text-ink">670×</span> (input-basis; Mar 2023 GPT-4 $30/1M →
            DeepSeek V4.1 Flash $0.0448/1M), powering $159B+ of reported enterprise ARR.
          </p>
        </div>
      </div>

      {/* Section tabs — 44px targets */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-b border-rule pb-3">
        <div className="-mx-1 flex items-center gap-1 overflow-x-auto px-1 pb-1 scrollbar-none">
          {(
            [
              { id: "scorecard", label: "Scorecard Matrix (8 Metrics)" },
              { id: "clec-parallel", label: "The Neocloud “CLEC” Parallel" },
              { id: "cashflows", label: "Cash Flows & Dark Fiber" },
              { id: "simulator", label: "Regime Simulator" },
            ] as const
          ).map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              aria-pressed={activeTab === id}
              className={`min-h-11 shrink-0 whitespace-nowrap rounded-lg border px-3 py-2 text-[13px] font-semibold transition-colors ${
                activeTab === id
                  ? "border-ink bg-ink text-canvas"
                  : "border-rule bg-surface text-ink-muted hover:border-rule-strong hover:text-ink"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Prediction-market link */}
        <a
          href={POLYMARKET_BASE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="btn min-h-11 whitespace-nowrap"
        >
          <span>Hedge Bubble Risk on Polymarket</span>
          <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
        </a>
      </div>

      {/* TAB 1: SIDE-BY-SIDE SCORECARD MATRIX */}
      {activeTab === "scorecard" && (
        <div className="space-y-6">
          {/* Category Filter Chips & Search Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="-mx-1 flex flex-wrap items-center gap-1.5 px-1">
              {[
                { id: "all", label: "All Dimensions" },
                { id: "cashflows", label: "Cash Flows" },
                { id: "infrastructure", label: "Hardware & Fiber" },
                { id: "debt", label: "Debt & Credit" },
                { id: "valuations", label: "Multiples & ARR" },
                { id: "deflation", label: "Token Deflation" },
              ].map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedCategory(c.id)}
                  className={`min-h-11 shrink-0 whitespace-nowrap rounded-lg border px-3 py-2 text-[13px] font-semibold transition-colors ${
                    selectedCategory === c.id
                      ? "border-ink bg-ink text-canvas"
                      : "border-rule bg-surface text-ink-muted hover:border-rule-strong hover:text-ink"
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-subtle" aria-hidden="true" />
              <input
                type="text"
                placeholder="Filter metrics & takeaways..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="min-h-11 w-full rounded-lg border border-rule bg-surface py-2 pl-9 pr-3 text-sm text-ink placeholder:text-ink-faint"
              />
            </div>
          </div>

          {/* High-Impact Side-by-Side Comparison Grid */}
          <div className="space-y-4">
            {filteredMetrics.map((m) => (
              <div
                key={m.id}
                className="card space-y-4 shadow-xs hover:border-rule-strong transition-colors"
              >
                {/* Metric Header */}
                <div className="flex flex-col gap-2 border-b border-rule pb-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-0.5">
                    <span className="text-[13px] font-semibold uppercase tracking-wider text-ink-subtle">
                      {m.category.toUpperCase()}
                    </span>
                    <h3 className="text-base sm:text-lg font-bold text-ink">
                      {m.title}
                    </h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[13px] font-semibold px-2 py-0.5 rounded-full border ${
                        m.riskRating === "Extreme Structural Divergence"
                          ? "bg-safe-500/10 text-safe-700 border-safe-300/20"
                          : m.riskRating === "Moderate Divergence"
                          ? "bg-caution-500/10 text-caution-700 border-caution-300/20"
                          : "bg-surface-3/10 text-ink-muted border-rule/20"
                      }`}
                    >
                      {m.riskRating}
                    </span>
                  </div>
                </div>

{/* Side-by-side comparison columns */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {/* Dot-Com 2000 column */}
                  <div className="panel space-y-2 border-l-2 border-l-risk-500">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="flex items-center gap-1 text-[14px] font-semibold text-risk-700">
                        <TrendingDown className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>1999–2000 DOT-COM BUBBLE</span>
                      </span>
                      <span className="chip chip-risk">HISTORICAL CRASH</span>
                    </div>
                    <div className="num text-xl font-semibold text-risk-700 sm:text-2xl">
                      {m.dotcom2000.figure}
                    </div>
                    <p className="prose text-[14px]">{m.dotcom2000.description}</p>
                  </div>

                  {/* AI 2026 column */}
                  <div
                    className={`panel space-y-2 border-l-2 ${
                      m.ai2026.status === "healthy" ? "border-l-safe-500" : "border-l-caution-500"
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="flex items-center gap-1 text-[14px] font-semibold text-ink">
                        {m.ai2026.status === "healthy" ? (
                          <TrendingUp className="h-3.5 w-3.5 text-safe-700" aria-hidden="true" />
                        ) : (
                          <AlertTriangle className="h-3.5 w-3.5 text-caution-700" aria-hidden="true" />
                        )}
                        <span>2025–2026 AI SUPERSTRUCTURE</span>
                      </span>
                      <span className={`chip ${m.ai2026.status === "healthy" ? "chip-safe" : "chip-caution"}`}>
                        {m.ai2026.status === "healthy" ? "SOLVENT BUFFER" : "CREDIT WATCH"}
                      </span>
                    </div>
                    <div
                      className={`num text-xl font-semibold sm:text-2xl ${
                        m.ai2026.status === "healthy" ? "text-safe-700" : "text-caution-700"
                      }`}
                    >
                      {m.ai2026.figure}
                    </div>
                    <p className="prose text-[14px]">{m.ai2026.description}</p>
                  </div>
                </div>

                {/* Structural Verdict & Analytical Takeaway */}
                <div className="panel space-y-1">
                  <div className="flex items-center space-x-2 text-[14px] font-semibold text-ink">
                    <span className="w-1.5 h-1.5 rounded-full bg-safe-500" />
                    <span>STRUCTURAL VERDICT: {m.structuralVerdict}</span>
                  </div>
                  <p className="prose pl-3.5 text-[14px]">
                    {m.analyticalTakeaway}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: THE NEOCLOUD "CLEC" PARALLEL (Deep Dive) */}
      {activeTab === "clec-parallel" && (
        <div className="space-y-6">
          <div className="card space-y-6">
            <div>
              <span className="label">FINANCIAL ANATOMY · EPISODIC CASE STUDY</span>
              <h2 className="mt-1 text-2xl font-bold tracking-tight text-ink">
                The Neocloud &ldquo;CLEC&rdquo; Parallel (1999 vs 2026)
              </h2>
              <p className="prose mt-2 max-w-3xl text-sm">
                While Microsoft, Alphabet, and Meta resemble sovereign digital utilities with massive balance sheet equity, the secondary GPU compute cloud providers exhibit structural mechanics almost identical to the 1999 Competitive Local Exchange Carriers (CLECs).
              </p>
            </div>

            {/* Side-by-side Historical Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              <div className="panel space-y-3 border-l-2 border-l-risk-500">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="label">THE 1999 CLEC BOOM &amp; COLLAPSE</span>
                  <span className="chip">Winstar · Teligent · Covad</span>
                </div>
                <h4 className="text-base font-semibold text-ink">
                  Debt-Funded Local Fiber Loops
                </h4>
                <ul className="prose-ul text-[14px]">
                  <li>
                    <strong>Vendor Financing:</strong> Equipment makers (Lucent, Nortel) lent billions directly to CLECs to buy their switching gear.
                  </li>
                  <li>
                    <strong>Junk Bond Capital:</strong> Over $80B in high-yield debt was issued to lay metropolitan fiber rings under the assumption of 100%+ annual internet traffic growth.
                  </li>
                  <li>
                    <strong>The Collapse:</strong> As transit prices plunged and bandwidth supply flooded the market, revenues collapsed. Within 18 months, 24 of the top 25 CLECs entered Chapter 11 bankruptcy.
                  </li>
                </ul>
              </div>

              <div className="panel space-y-3 border-l-2 border-l-caution-500">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="label">THE 2026 GPU NEOCLOUD SUPERSTRUCTURE</span>
                  <span className="chip chip-caution">CoreWeave · Crusoe · Lambda</span>
                </div>
                <h4 className="text-base font-semibold text-ink">
                  Asset-Backed GPU Facilities
                </h4>
                <ul className="prose-ul text-[14px]">
                  <li>
                    <strong>Compute Collateral:</strong> Neoclouds pledge NVIDIA H100/H200/B200 servers as collateral to private debt syndicates (Blackstone, Coatue, Carlyle, Blue Owl).
                  </li>
                  <li>
                    <strong>Depreciation Drag:</strong> High-performance GPUs lose 60–75% of their economic value within 36 months as next-gen Blackwell and Rubin architectures ship.
                  </li>
                  <li>
                    <strong>Refinancing Hurdle:</strong> With $214.9B in tracked debt across the ecosystem, any softening in compute rental spot rates ($2.15/GPU-hr) impairs loan-to-value ratios, creating refinancing pressure.
                  </li>
                </ul>
              </div>
            </div>

            {/* Institutional Neocloud Debt Breakdown */}
            <div className="panel space-y-3">
              <h4 className="text-[13px] font-semibold text-ink uppercase tracking-wider">
                Institutional Verified Debt Exposure in Secondary Compute Tier
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[14px] font-mono">
                <div className="rounded-lg border border-rule bg-surface p-3 space-y-1">
                  <span className="text-ink-subtle">CoreWeave Debt</span>
                  <div className="num text-base font-semibold text-ink">$25.1B</div>
                  <span className="text-caution-700">Blackstone / Coatue SPV</span>
                </div>
                <div className="rounded-lg border border-rule bg-surface p-3 space-y-1">
                  <span className="text-ink-subtle">Crusoe Energy JV</span>
                  <div className="num text-base font-semibold text-ink">$3.4B</div>
                  <span className="text-caution-700">Blue Owl Capital Facility</span>
                </div>
                <div className="rounded-lg border border-rule bg-surface p-3 space-y-1">
                  <span className="text-ink-subtle">Oracle Borrowings</span>
                  <div className="num text-base font-semibold text-ink">$130.1B</div>
                  <span className="text-ink text-ink-faint">Senior Unsecured (288bp CDS)</span>
                </div>
                <div className="rounded-lg border border-rule bg-surface p-3 space-y-1">
                  <span className="text-ink-subtle">Anthropic Debt</span>
                  <div className="num text-base font-semibold text-ink">$57.0B</div>
                  <span className="text-ink-muted">Broadcom Convert &amp; Facility</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: CASH FLOWS & DARK FIBER (Detailed Economic Analysis) */}
      {activeTab === "cashflows" && (
        <div className="space-y-6">
          <div className="card space-y-6">
            <div>
              <span className="text-[13px] font-mono text-safe-700 font-bold uppercase tracking-wider">
                MACROECONOMIC BALANCE SHEET DECONSTRUCTION
              </span>
              <h2 className="mt-1 text-2xl font-bold tracking-tight text-ink">
                The Cash Flow Engine: Hyperscaler Solvency vs. 2000 Burn
              </h2>
              <p className="prose mt-2 max-w-3xl text-sm">
                The single most decisive empirical differentiator between 2000 and 2026 is corporate cash generation. In the dot-com era, tech companies burned cash to fund operations. In 2026, tech hyperscalers are the most profitable commercial enterprises in world history.
              </p>
            </div>

            {/* Hyperscaler Cash Flow Breakdown Matrix */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-ink">
                Hyperscaler Cash Flows vs. Capex (SEC 10-K Consensus)
              </h4>
              <p className="text-[14px] text-ink-subtle">
                Basis: FY2025 filed capex and trailing twelve-month operating cash flow, as reported in
                each company&apos;s SEC filings. These are not the CY2026 guidance figures quoted in the
                narrative above ($725B guided big-4 capex, Jul 2026 earnings calls).
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-[14px] font-mono border-collapse">
                  <caption className="sr-only">
                    Hyperscaler cash flows against filed AI capex: operating cash flow, annual AI
                    capex, retained free cash flow, capex-to-operating-cash-flow ratio and credit
                    rating.
                  </caption>
                  <thead>
                    <tr className="border-b border-rule text-left text-ink-subtle">
                      <th scope="col" className="py-2.5 px-3">Company</th>
                      <th scope="col" className="py-2.5 px-3">Operating Cash Flow (trailing FY)</th>
                      <th scope="col" className="py-2.5 px-3">Annual AI Capex (FY2025 filed)</th>
                      <th scope="col" className="py-2.5 px-3">Retained Free Cash Flow</th>
                      <th scope="col" className="py-2.5 px-3">Capex / OCF Ratio</th>
                      <th scope="col" className="py-2.5 px-3">Credit Rating</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-rule divide-rule/60 text-ink">
                    <tr className="hover:bg-surface-2 hover:bg-surface-2">
                      <th scope="row" className="py-2.5 px-3 font-bold text-ink">Microsoft (MSFT)</th>
                      <td className="py-2.5 px-3 text-safe-700">$136.2B</td>
                      <td className="py-2.5 px-3">$80.0B</td>
                      <td className="py-2.5 px-3 font-bold">$56.2B</td>
                      <td className="py-2.5 px-3">58.7%</td>
                      <td className="py-2.5 px-3"><span className="chip chip-safe">AAA</span></td>
                    </tr>
                    <tr className="hover:bg-surface-2 hover:bg-surface-2">
                      <th scope="row" className="py-2.5 px-3 font-bold text-ink">Alphabet (GOOGL)</th>
                      <td className="py-2.5 px-3 text-safe-700">$128.5B</td>
                      <td className="py-2.5 px-3">$75.0B</td>
                      <td className="py-2.5 px-3 font-bold">$53.5B</td>
                      <td className="py-2.5 px-3">58.4%</td>
                      <td className="py-2.5 px-3"><span className="chip chip-safe">AA+</span></td>
                    </tr>
                    <tr className="hover:bg-surface-2 hover:bg-surface-2">
                      <th scope="row" className="py-2.5 px-3 font-bold text-ink">Meta Platforms (META)</th>
                      <td className="py-2.5 px-3 text-safe-700">$98.4B</td>
                      <td className="py-2.5 px-3">$65.0B</td>
                      <td className="py-2.5 px-3 font-bold">$33.4B</td>
                      <td className="py-2.5 px-3">66.1%</td>
                      <td className="py-2.5 px-3"><span className="chip chip-safe">AA-</span></td>
                    </tr>
                    <tr className="hover:bg-surface-2 hover:bg-surface-2">
                      <th scope="row" className="py-2.5 px-3 font-bold text-ink">Amazon AWS (AMZN)</th>
                      <td className="py-2.5 px-3 text-safe-700">$142.0B</td>
                      <td className="py-2.5 px-3">$105.0B</td>
                      <td className="py-2.5 px-3 font-bold">$37.0B</td>
                      <td className="py-2.5 px-3">73.9%</td>
                      <td className="py-2.5 px-3"><span className="chip chip-safe">AA</span></td>
                    </tr>
                    <tr className="hover:bg-surface-2 hover:bg-surface-2">
                      <th scope="row" className="py-2.5 px-3 font-bold text-ink">Apple (AAPL)</th>
                      <td className="py-2.5 px-3 text-safe-700">$163.0B</td>
                      <td className="py-2.5 px-3">$35.0B</td>
                      <td className="py-2.5 px-3 font-bold">$128.0B</td>
                      <td className="py-2.5 px-3">21.5%</td>
                      <td className="py-2.5 px-3"><span className="chip chip-safe">AAA</span></td>
                    </tr>
                    <tr className="bg-surface-2/60 font-bold">
                      <th scope="row" className="py-2.5 px-3 text-ink">Total Hyperscaler Engine</th>
                      <td className="py-2.5 px-3 text-safe-700">$668.1B</td>
                      <td className="py-2.5 px-3">$360.0B</td>
                      <td className="py-2.5 px-3 text-safe-700">+$308.1B</td>
                      <td className="py-2.5 px-3">53.9% Average</td>
                      <td className="py-2.5 px-3">Fortress Tier</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Telecom Fiber vs GPU Datacenters Deep Dive */}
            <div className="panel space-y-2">
              <h4 className="text-[13px] font-semibold text-ink uppercase tracking-wider">
                The Engineering Truth: Dark Fiber vs. Live GPU Clusters
              </h4>
              <p className="text-[14px] text-ink-muted leading-relaxed font-sans">
                In 2000, laying long-haul fiber optic conduit under roads and oceans was a binary infrastructure bet: once fiber was laid in the ground, it earned zero revenue unless both ends were lit by expensive optical transceivers and consumer broadband demand materialized. Because the average home had a 56k dial-up modem, the bandwidth was utterly unusable, leading to a 95% unlit rate and $2T in asset write-downs.
              </p>
              {/* 2026-10-19 fact-check: "350M+ users daily" replaced with
                  OpenAI's own figure — 1.2B weekly users, DevDay 2026 recap,
                  29 Sep 2026 (openai.com/index/devday-2026-recap; The Verge,
                  29 Sep 2026). "daily" is dropped because the new figure is
                  weekly and the two cannot both stand. */}
              <p className="prose pt-1 text-[14px]">
                In 2026, GPU clusters are fundamentally modular and dynamic: compute hours are rented by the second to thousands of software enterprises, universities, defense agencies, and internal product teams. GPU capacity is not stranded under asphalt; it is continuously consuming megawatts to generate tokens for 1.2B weekly users (OpenAI DevDay, Sep 29 2026).
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: INTERACTIVE REGIME SIMULATOR */}
      {activeTab === "simulator" && (
        <div className="space-y-6">
          <div className="card space-y-6">
            <div>
              <span className="label">QUANTITATIVE STRESS TESTING TOOL</span>
              <h2 className="mt-1 text-2xl font-bold tracking-tight text-ink">
                Interactive Regime Simulator: Dot-Com vs. 2026 AI
              </h2>
              <p className="prose mt-2 max-w-3xl text-sm">
                Test the structural mechanics yourself. Switch between historical regime presets or calibrate custom levers for cash flows, private debt, interest rates, and token cost deflation to see real-time shifts in systemic burst probability.
              </p>
            </div>

            {/* Regime Presets */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                onClick={() => setSimRegime("ai2026")}
                className={`card min-h-11 border-l-4 text-left transition-colors ${
                  simRegime === "ai2026"
                    ? "border-l-safe-500 bg-surface"
                    : "bg-surface hover:border-rule-strong"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="label">REGIME 1</span>
                  {simRegime === "ai2026" && <CheckCircle2 className="h-4 w-4 text-safe-700" aria-hidden="true" />}
                </div>
                <p className="mt-1 text-sm font-semibold text-ink">2026 Live Baseline</p>
                <p className="num mt-0.5 text-[14px] text-ink-subtle">{LIVE_CARD_SUMMARY}</p>
              </button>

              <button
                onClick={() => setSimRegime("dotcom2000")}
                className={`card min-h-11 border-l-4 text-left transition-colors ${
                  simRegime === "dotcom2000"
                    ? "border-l-risk-500 bg-surface"
                    : "bg-surface hover:border-rule-strong"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="label">REGIME 2</span>
                  {simRegime === "dotcom2000" && <CheckCircle2 className="w-4 h-4 text-risk-700" />}
                </div>
                <p className="mt-1 text-sm font-semibold text-ink">2000 Dot-Com Peak</p>
                <p className="num mt-0.5 text-[14px] text-ink-subtle">{DOTCOM_2000_CARD_SUMMARY}</p>
              </button>

              <button
                onClick={() => setSimRegime("creditFreeze")}
                className={`card min-h-11 border-l-4 text-left transition-colors ${
                  simRegime === "creditFreeze"
                    ? "border-l-caution-500 bg-surface"
                    : "bg-surface hover:border-rule-strong"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="label">REGIME 3</span>
                  {simRegime === "creditFreeze" && <CheckCircle2 className="w-4 h-4 text-caution-700" />}
                </div>
                <p className="mt-1 text-sm font-semibold text-ink">Neocloud Credit Freeze</p>
                <p className="num mt-0.5 text-[14px] text-ink-subtle">{CREDIT_FREEZE_CARD_SUMMARY}</p>
              </button>
            </div>

            {/* Live Model Output Display */}
            <div className="p-5 rounded-xl border border-rule bg-surface-2 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="label">
                  SIMULATED SYSTEMIC BURST PROBABILITY (12-MONTH HORIZON)
                </span>
                <div className="flex items-baseline space-x-3">
                  <span className={`num text-3xl font-semibold sm:text-4xl ${simResult.bandColor}`}>
                    {simResult.burstProb}%
                  </span>
                  <span className={`pill ${simResult.badgeColor}`}>
                    {simResult.band}
                  </span>
                  <span className="text-[14px] text-ink-subtle">
                    Score: {simResult.score} / 100
                  </span>
                </div>
                <p className="prose pt-1 max-w-2xl text-[14px]">
                  {simResult.interpretation}
                </p>
              </div>

              <div className="flex items-center space-x-4 border-t md:border-t-0 md:border-l border-rule pt-3 md:pt-0 md:pl-5 text-[14px] font-mono shrink-0">
                <div>
                  <span className="text-ink block">Merton DD</span>
                  <span className="font-bold text-ink">{simResult.mertonDD}</span>
                </div>
                <div>
                  <span className="text-ink block">Altman Z&apos;&apos; Zone</span>
                  <span className="font-bold text-ink">{simResult.altmanZone}</span>
                </div>
              </div>
            </div>

            {/* Custom Parameter Sliders */}
            <div className="space-y-4 pt-2">
              <h4 className="text-[13px] font-semibold text-ink uppercase tracking-wider">
                Adjust Custom Macro &amp; Balance Sheet Variables
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Slider 1: Retained FCF */}
                <div className="panel space-y-2">
                  <div className="flex justify-between gap-2 text-[14px]">
                    <span className="text-ink-muted font-semibold">Hyperscaler Retained FCF Cushion</span>
                    <span className="num font-semibold text-safe-700">${customFcf}B / yr</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="400"
                    step="10"
                    value={customFcf}
                    onChange={(e) => setCustomFcf(Number(e.target.value))}
                    className="h-11 w-full cursor-pointer accent-safe-500"
                  />
                  <div className="num flex justify-between text-[14px] text-ink-subtle">
                    <span>$10B (Engine floor)</span>
                    <span>$260B (Current)</span>
                    <span>$400B (High Cash)</span>
                  </div>
                  {/* 2026-10-19 (B-F11): the published capex leg saturates at 2.0× capex ÷ FCF,
                      so below ~$360B of FCF the score no longer moves. The floor is $10B, not
                      $0: the engine reads a zero FCF as "unreported" and drops the leg. */}
                  <p className="text-[13px] leading-snug text-ink-subtle">
                    The published capex leg saturates once capex reaches 2.0× free cash flow, so
                    the print stops moving below roughly $360B of FCF.
                  </p>
                </div>

                {/* Slider 2: Private Tracked Debt */}
                <div className="panel space-y-2">
                  <div className="flex justify-between gap-2 text-[14px]">
                    <span className="text-ink-muted font-semibold">Tracked Private &amp; Neocloud Debt</span>
                    <span className="num font-semibold text-caution-700">${customDebt}B</span>
                  </div>
                  <input
                    type="range"
                    min="100"
                    max="500"
                    step="0.1"
                    value={customDebt}
                    onChange={(e) => setCustomDebt(Number(e.target.value))}
                    className="h-11 w-full cursor-pointer accent-caution-500"
                  />
                  <div className="num flex justify-between text-[14px] text-ink-subtle">
                    <span>$100B (Low Debt)</span>
                    <span>$214.9B (Current)</span>
                    <span>$500B (High Leverage)</span>
                  </div>
                </div>

                {/* Slider 3: US 10-Year Yield */}
                <div className="panel space-y-2">
                  <div className="flex justify-between gap-2 text-[14px]">
                    <span className="text-ink-muted font-semibold">US 10-Year Treasury Yield</span>
                    <span className="num font-semibold text-ink-muted">{customYield.toFixed(2)}%</span>
                  </div>
                  <input
                    type="range"
                    min="3.00"
                    max="7.00"
                    step="0.10"
                    value={customYield}
                    onChange={(e) => setCustomYield(Number(e.target.value))}
                    className="h-11 w-full cursor-pointer accent-ink"
                  />
                  <div className="num flex justify-between text-[14px] text-ink-subtle">
                    <span>3.00% (ZIRP-like)</span>
                    <span>5.10% (Live Today)</span>
                    <span>7.00% (1990s Spike)</span>
                  </div>
                </div>

                {/* Slider 4: Token Price Deflation */}
                <div className="panel space-y-2">
                  <div className="flex justify-between gap-2 text-[14px]">
                    <span className="text-ink-muted font-semibold">Inference Token Cost Deflation</span>
                    <span className="num font-semibold text-safe-700">{customDeflation}× Cheaper</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="700"
                    step="5"
                    value={customDeflation}
                    onChange={(e) => setCustomDeflation(Number(e.target.value))}
                    className="h-11 w-full cursor-pointer accent-safe-500"
                  />
                  <div className="num flex justify-between text-[14px] text-ink-subtle">
                    {/*
                      Fact-checked Oct 19, 2026 (input-basis vs GPT-4 $30/1M):
                      Haiku 5.5 $0.10 in → 300×; DeepSeek V4.1 Flash $0.0448 in → ~670×.
                      Slider max raised 375 → 700 so the real input-basis frontier fits.
                      2026-10-19 (B-F11): the default is now the LIVE deflation multiple
                      (670×) — the lever drives the model's damper leg directly, so the
                      default has to be the published value for the live mode to reproduce
                      the canonical print.
                    */}
                    <span>1× (GPT-4 2023)</span>
                    <span>300× (Haiku 5.5)</span>
                    <span>670× (DeepSeek V4.1 Flash)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <AdSlot placementId="dotcom-infeed" className="mt-6" />

      {/* Institutional Synthesis & Summary Grid */}
      <div className="p-6 rounded-lg border border-rule bg-surface-2 space-y-4">
        <h3 className="text-base sm:text-lg font-bold text-ink">
          Institutional Conclusions &amp; Strategic Implications for Capital Allocators
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[14px] text-ink-muted leading-relaxed">
          <div className="space-y-1.5 panel">
            <strong className="text-ink block">
              1. Hyperscalers Are Sovereign Infrastructure Utilities:
            </strong>
            Unlike the dot-com era where tech leaders had fragile balance sheets, Microsoft, Alphabet, Meta, and Amazon can still absorb $725B in guided CY2026 capex out of retained operating cash flow — but Forbes (Oct 7, 2026) now reports that capex consumes nearly ALL of big-4 operating cash flow, leaving little slack ($214.9B of tracked AI debt sits at the margin). An equity bear market in AI does not threaten hyperscaler solvency, though the self-funding cushion is materially thinner than in 2025.
          </div>

          <div className="space-y-1.5 panel">
            <strong className="text-ink block">
              2. Neoclouds Carry The Credit Risk:
            </strong>
            The vulnerable link in the capital chain is the secondary GPU cloud provider segment. With $214.9B in private and asset-backed credit and 3-year GPU obsolescence, neoclouds that borrowed heavily at 10–12% yields face debt restructuring if software token prices continue collapsing.
          </div>

          <div className="space-y-1.5 panel">
            <strong className="text-ink block">
              3. Token Deflation Is The Software Savior:
            </strong>
            In 2000, high telecom transit costs choked internet applications. In 2026, 670× token price deflation (input-basis; Mar 2023 GPT-4 $30/1M vs DeepSeek V4.1 Flash $0.0448/1M) is accelerating real enterprise productization. Software application companies enjoy rapid margin expansion as inference input costs drop to sub-5¢ per million tokens (completions ~8¢).
          </div>

          <div className="space-y-1.5 panel">
            <strong className="text-ink block">
              4. The Liquidation Outcome:
            </strong>
            If an AI capital correction occurs, it will not result in abandoned datacenters. Rather, Big Tech hyperscalers and sovereign wealth funds will acquire distressed neocloud clusters and private frontier lab assets at 30–50% discounts, further consolidating technological power.
          </div>
        </div>

        {/* Regulatory & Institutional Compliance Disclaimer */}
        <div className="p-4 sm:p-5 rounded-lg bg-caution-500/5 border border-caution-300/20 text-[14px] text-ink-muted space-y-2">
          <div className="flex items-center space-x-2 text-caution-700 font-mono font-bold uppercase tracking-wider text-ink">
            <AlertTriangle className="w-4 h-4 text-caution-700 shrink-0" />
            <span>Regulatory Notice — Not Financial Advice</span>
          </div>
          <p className="leading-relaxed font-sans text-[14px] text-ink-muted">
            This historical comparative analysis and risk scorecard are provided strictly for educational and quantitative research purposes. Historical bubble dynamics (1998–2002 Dot-Com vs 2024–2026 Generative AI) are empirical approximations based on disclosed financial statements and do not constitute investment advice, financial planning, or securities endorsement.
          </p>
        </div>

        {/* Quick Cross-Links */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-rule pt-3 text-[14px]">
          <div className="flex items-center space-x-4">
            <Link href="/ledger" className="prose-a flex min-h-11 items-center gap-1">
              <span>View 169 Verified Deals ($2.87T)</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
            <Link href="/companies" className="prose-a flex min-h-11 items-center gap-1">
              <span>Corporate Debt Sheets</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
            <Link href="/methodology" className="prose-a flex min-h-11 items-center gap-1">
              <span>Minsky &amp; Merton Math</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <a
            href={POLYMARKET_BASE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="prose-a flex min-h-11 items-center gap-1 font-semibold"
          >
            <span>Trade AI Downturn Odds on Polymarket (r=AIbubble)</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      <AdSlot placementId="dotcom-bottom" className="mt-6" />
    </div>
  );
}
