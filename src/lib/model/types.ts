// ── Burst Probability Model — typed inputs & outputs ─────────────────────────
//
// PURPOSE: convert the site's verified evidence (tracked ledger, reported CDS
// spreads, reported revenue/run-rates, adoption stats, crowd odds, capex data)
// into ONE number: the probability that the AI capital bubble bursts within
// the next 12 months. The model is a TRANSPARENT COMPOSITE INDICATOR — every
// factor has a published weight and formula (see modelRecipe). It is not a
// fitted statistical forecast and never claims to be one.
//
// Data policy: identical to the site ledger. Every input is sourced or
// computed from the tracked ledger. Missing data is handled by `coverage`
// weights — never fabricated.

export type TrendBand = 'falling_fast' | 'falling' | 'flat' | 'rising';

export interface CdsStressInput {
  /** Latest reported 5Y USD CDS mid-spread on Oracle, basis points. */
  currentBps: number;
  /** Pre-surge baseline (mid-2025) reading, basis points. */
  baselineBps: number;
  /** Reading from roughly 90 days earlier, basis points (momentum). */
  priorBps: number;
  /** Optional lidar: same metric on another AI-exposed borrower (bp), if reported. */
  otherBps?: number;
  /** Human source note, e.g. "Reuters, 2026-09-30". */
  note: string;
}

export interface LabValuationInput {
  company: string;
  /** Latest equity valuation, USD. */
  valuationUsd: number;
  /** Most recent verified annualized revenue (run-rate), USD — null if unreported. */
  runRateRevenueUsd: number | null;
  note: string;
}

export interface LedgerAggregateInput {
  /** Sum of amount_value across all disclosed deals, USD. */
  totalDisclosedUsd: number;
  /** Disclosed volume by announcement year. */
  byYear: Record<number, number>;
  /** Share of disclosed volume that is debt/credit/convertible-bond money, 0-1. */
  debtShare: number;
  /** Share of disclosed volume in compute contracts (cloud/GPU purchase commitments), 0-1. */
  computeContractShare: number;
  /** Share of disclosed volume in the 10 largest deals, 0-1. */
  top10Share: number;
  /**
   * Share of disclosed volume in identified CIRCULAR money — deals where the
   * counterparties fund each other (e.g. chipmaker invests in customer, customer
   * buys chips), 0-1. Maintained by hand from tracked relationships.
   */
  circularShare: number;
  /** Share of ALL tracked deals announced but not yet closed, 0-1. */
  announcedShare: number;
  /** Count of disclosed ≥$10B deals announced in the last 12 months. */
  megaCountLast12m: number;
  /** Days since the most recent ≥$10B announcement (fast decay after surge). */
  daysSinceLastMega: number;
}

export interface CrowdSignalInput {
  /** Blended YES probability from AI-bubble-adjacent prediction markets, 0-1. */
  yesProbability: number | null;
  /** Total liquidity backing those markets, USD (low volume = weaker signal). */
  volumeUsd: number | null;
  /** Live verified 2026 bubble downturn contract odds on Polymarket (0-1). */
  bubble2026Probability?: number | null;
  /** Live verified 2027 bubble downturn contract odds on Polymarket (0-1). */
  bubble2027Probability?: number | null;
  /** Number of active tracked Polymarket AI contracts. */
  activeContractsCount?: number;
  note: string;
}

export interface AdoptionInput {
  /** Weekly/monthly active users on the largest consumer AI product, null if unreported. */
  topProductUsers: number | null;
  /** Year-over-year growth in those users, 0-1, null if unreported. */
  annualUserGrowth: number | null;
  /**
   * How many times cheaper inference API tokens are today vs early-2023 for a
   * frontier-class task (e.g. 40 = "40× cheaper"), null if unreported.
   */
  apiPriceDeclineMultiple: number | null;
  /** Direction of frontier training cost at the edge (reliably costly = frothy arms race). */
  trainingCostBand: TrendBand | null;
  note: string;
}

export interface CapexInput {
  /** Aggregate reported capex of the tracked hyperscalers, latest full year, USD. */
  aggregateCapexUsd: number | null;
  /** Their aggregate free cash flow for the same year, USD. */
  aggregateFcfUsd: number | null;
  note: string;
}

export interface MacroInputs {
  /** 10-Year US Treasury benchmark yield (%), e.g. 5.10 */
  us10yYieldPct: number;
  /** 2-Year US Treasury benchmark yield (%), e.g. 4.75 */
  us02yYieldPct?: number;
  /** Baseline yield considered neutral/calm (%), e.g. 3.75 */
  us10yBaselinePct: number;
  /** Year-over-year headline CPI inflation (%), e.g. 2.9 */
  cpiInflationYoY: number;
  /** Upper bound of Federal Funds Effective Rate (%), e.g. 4.75 */
  fedFundsRatePct: number;
  /** Market-implied 12-month rate hike / tightening risk spread (bps), e.g. 25 */
  rateHikeRiskBps: number;
  /** 10-Year TIPS Real Yield (%), e.g. 2.70 */
  realYield10y: number;
  /** US High Yield Option-Adjusted Spread (bps), e.g. 336 */
  highYieldSpreadBps?: number;
  /** Sector or asset cyclically adjusted P/E multiple override */
  capeMultiple?: number;
  note: string;
}

export interface AiDebtMetricsInput {
  /** Annualized pace of dedicated AI debt and convertible bond issuance (USD) */
  annualDebtIssuanceUsd: number;
  /** Cumulative tracked AI debt and convertibles across ledger (USD) */
  totalTrackedDebtUsd: number;
  /** Capex as a percentage of aggregate hyperscaler operating cash flow (0-1) */
  capexToOcfRatio: number;
  /** Annualized GPU hardware depreciation and amortization drag (USD) */
  gpuDepreciationDragUsd: number;
  /** Ratio of hyperscaler capex to aggregate generative AI software revenues */
  capexToRevenueMultiple: number;
  note: string;
}

/** Everything the model reads; the adapter supplies this from live sources. */
export interface BubbleModelInputs {
  cds: CdsStressInput | null;
  valuations: LabValuationInput[] | null;
  ledger: LedgerAggregateInput | null;
  crowd: CrowdSignalInput | null;
  adoption: AdoptionInput | null;
  capex: CapexInput | null;
  macro?: MacroInputs | null;
  aiDebt?: AiDebtMetricsInput | null;
}

export type FactorKind = 'risk' | 'damper';

export interface FactorReading {
  /** Normalized factor score, 0 (calm) → 1 (extreme). */
  score: number;
  /** Human explanation of the current reading, e.g. "Oracle CDS 187bp vs 81bp baseline". */
  reading: string;
  /** 0-1: how fully this factor could be computed from supplied inputs. */
  coverage: number;
}

export interface FactorContribution {
  id: string;
  label: string;
  kind: FactorKind;
  /** Published weight, percent of total. */
  weightPct: number;
  /** Points actually earned after coverage renormalization (composite scale 0-100). */
  earnedPoints: number;
  reading: FactorReading;
}

export type BubbleBand = 'calm' | 'guarded' | 'elevated' | 'high' | 'critical';

export interface BubbleModelResult {
  /** Headline probability, %, 0-100, one decimal. */
  burstProbability: number;
  /** Composite stress score behind the probability, 0-100. */
  compositeScore: number;
  band: BubbleBand;
  /** Per-factor breakdown for the methodology display. */
  contributions: FactorContribution[];
  /**
   * Weighted coverage, 0-1: how much of the model was actually computable.
   * Below 0.6 the result is flagged as low-confidence.
   */
  coverage: number;
  /** Which factor kind dominated the score. */
  topDriverIds: string[];
  /** 12-month window the probability refers to. */
  horizonMonths: 12;
  generatedAt: string;
  /** 90% Confidence Interval [lowProbability, highProbability] based on data coverage & dispersion */
  confidenceInterval?: [number, number];
  /** Financial Fragility Index (0-100): vulnerability to rate hikes or credit freeze */
  fragilityIndex?: number;
  /** Points added by non-linear systemic credit-debt-macro refinancing synergy */
  systemicContagionPoints?: number;
  /** Merton (1974) Structural Distance-to-Default and Default Probability metrics */
  merton?: {
    distanceToDefault: number;
    defaultProbabilityPct: number;
    structuralSpreadBps: number;
    interpretation: string;
  };
  /** Altman (2002) Z''-Score distress metrics */
  altman?: {
    score: number;
    zone: string;
    impliedDistressProbPct: number;
    interpretation: string;
  };
  /** Minsky (1986, 1992) Financial Instability Hypothesis regime classification */
  minsky?: MinskyModelResult;
  /** Robert Shiller Cyclically Adjusted P/E (CAPE) & Excess CAPE Yield (ECY) */
  shillerCape?: ShillerCapeResult;
}

export type MinskyRegime = 'Hedge Dominant' | 'Speculative Transition' | 'Ponzi Instability';

export interface MinskyModelResult {
  /** Percentage of ecosystem debt held by cash-flow self-sufficient units (interest + principal amortization) */
  hedgeSharePct: number;
  /** Percentage of ecosystem debt where cash flows cover interest but principal must be rolled over */
  speculativeSharePct: number;
  /** Percentage of ecosystem debt where cash flows cannot cover interest without new equity or rising asset prices */
  ponziSharePct: number;
  /** Minsky Financial Fragility Index on a 0–100 scale */
  minskyFragilityIndex: number;
  /** Structural financing regime according to Minsky Financial Instability Hypothesis */
  currentRegime: MinskyRegime;
  /** Probability of credit rollover / refinancing seizure within 12 months (%) */
  refinancingFreezeProbabilityPct: number;
  /** Nominal debt exposure breakdown across the three regimes (USD) */
  breakdown: {
    hedgeDebtUsd: number;
    speculativeDebtUsd: number;
    ponziDebtUsd: number;
  };
  /** Academic contextual interpretation of the ecosystem financing structure */
  interpretation: string;

  // Compatibility aliases
  fragilityIndex: number;
  regime: MinskyRegime;
  ponziDebtSharePct: number;
}

export type EquityRiskPremiumBand = 'Compressed (<1.5%)' | 'Normal (1.5–3.5%)' | 'Elevated (>3.5%)';

export interface ShillerCapeResult {
  /** Cyclically adjusted price-to-earnings multiple for AI and mega-cap tech sector */
  aiCapeMultiple: number;
  /** Historical long-term median CAPE benchmark (17.2x) */
  historicalMedianCape: number;
  /** Real earnings yield: 1 / aiCapeMultiple (%) */
  earningsYieldPct: number;
  /** 10-Year Real Treasury Benchmark Yield: Nominal 10Y - CPI YoY (%) */
  real10yYieldPct: number;
  /** Excess CAPE Yield (ECY) = Real Earnings Yield - Real 10Y Treasury Yield (%) */
  excessCapeYieldPct: number;
  /** Classification of the equity risk premium cushion over real safe assets */
  equityRiskPremiumBand: EquityRiskPremiumBand;
  /** Economic interpretation of multiple vulnerability vs real yields */
  interpretation: string;

  // Compatibility alias
  equityRiskPremiumStatus: string;
  /** Boolean flag indicating equity risk premium compression (< 1.0%) */
  isCompressed?: boolean;
  /** Boolean flag indicating extreme risk premium inversion (< 0.0%) */
  isExtremelyCompressed?: boolean;
}



