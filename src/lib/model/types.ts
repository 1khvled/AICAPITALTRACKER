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
  /** 10-Year US Treasury benchmark yield (%), e.g. 4.42 */
  us10yYieldPct: number;
  /** Baseline yield considered neutral/calm (%), e.g. 3.75 */
  us10yBaselinePct: number;
  /** Year-over-year headline CPI inflation (%), e.g. 2.9 */
  cpiInflationYoY: number;
  /** Upper bound of Federal Funds Effective Rate (%), e.g. 4.75 */
  fedFundsRatePct: number;
  /** Market-implied 12-month rate hike / tightening risk spread (bps), e.g. 25 */
  rateHikeRiskBps: number;
  /** 10-Year TIPS Real Yield (%), e.g. 2.05 */
  realYield10y: number;
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
}
