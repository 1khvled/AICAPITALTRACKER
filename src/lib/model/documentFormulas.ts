// ── Documented formulas — the executable layer of the published specification ──
//
// 2026-10-19 (algorithm-improvement wave 2, lane 2a).
//
// PURPOSE: every number the methodology page publishes as a FORMULA is executed
// here and asserted by scripts/test-algo.mjs test [18]. The page renders from
// these constants — it never transcribes a formula by hand. If the engine
// moves, the page moves with it, and the test fails loudly if they drift.
//
// WHAT WAS WRONG BEFORE THIS FILE EXISTED (fixed here, not in the engine):
//   · the Minsky fragility box published a ratio formula (weights 2.8 / 1.2 over
//     a hedge-cushion divisor). The engine computes a weighted SUM —
//     0.90·Spec + 2.45·Ponzi + 2.065·CDS_excess + 10·(capexToOcf − 0.548).
//   · the refinancing-freeze box published a logistic of the fragility index
//     (midpoint 60, width 12). The engine computes a linear function of the
//     Ponzi share and the CDS excess ratio — 0.65·Ponzi + 4.394·CDS_excess.
// Both page formulas are now generated from the engine's own expressions.
//
// MIRRORED SOURCE: src/lib/model/quantitative.ts (Minsky, Merton, Altman, LPPLS,
// Shiller) and src/lib/model/engine.ts (contagion, logistic mapping, coverage).
// The coefficients below are transcribed from those files, and test [18] greps
// the pipeline mirror (scripts/lib/quantitative-bubble-model.mjs) to prove the
// two engines still agree on them.

import {
  marketImplied12mBand,
  MODEL_CALIBRATION,
  MODEL_FACTORS,
  MODEL_VERSION,
  SUM_RISK_WEIGHT_PCT,
  DAMPER_WEIGHT_PCT,
  MARKET_IMPLIED_12M_PCT,
  FRAGILITY_INDEX_BASIS,
} from './factors';

// ─────────────────────────────────────────────────────────────────────────────
// 1 · LOGISTIC MAPPING & THE ODDS SHIFT
// ─────────────────────────────────────────────────────────────────────────────

/**
 * The published logistic mapping is P(burst) = 1 / (1 + exp(−(S − 55) / 9)).
 * Its ODDS form is exp((S − 55) / 9), so a +9-point composite move multiplies
 * the odds by e ≈ 2.72. Derived from the published anchors, not typed in.
 */
export const ODDS_SHIFT_PER_9_PTS = Math.round(
  Math.exp(9 / MODEL_CALIBRATION.steepness) * 100,
) / 100;

/** The published one-line statement of the odds shift. */
export const ODDS_SHIFT_SENTENCE = `a +9-point composite move multiplies the odds by ${ODDS_SHIFT_PER_9_PTS.toFixed(
  2,
)}× (50.0%→${(MODEL_CALIBRATION.mapping(MODEL_CALIBRATION.anchorScore + 9) * 100).toFixed(1)}%)`;

/** Published weight narrative — derived, never hand-typed. */
export const RISK_FACTOR_COUNT = MODEL_FACTORS.filter((f) => f.kind === 'risk').length;

export const WEIGHTS_NARRATIVE = `${RISK_FACTOR_COUNT} risk factors (${SUM_RISK_WEIGHT_PCT} risk points) + 1 real-use damper (−${DAMPER_WEIGHT_PCT} pts outside the risk scale)`;

// ─────────────────────────────────────────────────────────────────────────────
// 2 · MINSKY — FRAGILITY INDEX AND REFINANCING-FREEZE PROBABILITY
// ─────────────────────────────────────────────────────────────────────────────

export interface MinskyDocInputs {
  /** Speculative share of tracked debt, % (published artifact lever). */
  speculativeSharePct: number;
  /** Ponzi share of tracked debt, % (published artifact lever). */
  ponziSharePct: number;
  /** Oracle 5Y CDS, bp (live print). */
  cdsCurrentBps: number;
  /** Long-run CDS baseline, bp. */
  cdsBaselineBps: number;
  /** Capex ÷ operating cash flow (0-1). */
  capexToOcfRatio: number;
}

/** CDS excess ratio: how far the print sits above its own baseline. */
export function cdsExcessRatio(cdsCurrentBps: number, cdsBaselineBps: number): number {
  return cdsBaselineBps > 0 ? cdsCurrentBps / cdsBaselineBps - 1 : 0;
}

/**
 * Minsky Financial Fragility Index (0–100).
 * Engine expression (src/lib/model/quantitative.ts):
 *   raw = Spec·0.90 + Ponzi·2.45 + CDS_excess·2.065 + (capexToOcf − 0.548)·10
 * Mirrored here exactly; no term is dropped or re-weighted.
 */
export function minskyFragilityIndex(i: MinskyDocInputs): number {
  const raw =
    i.speculativeSharePct * 0.9 +
    i.ponziSharePct * 2.45 +
    cdsExcessRatio(i.cdsCurrentBps, i.cdsBaselineBps) * 2.065 +
    (i.capexToOcfRatio - 0.548) * 10;
  return Math.min(100, Math.max(0, Math.round(raw * 10) / 10));
}

/**
 * Refinancing-freeze probability over the 12-month horizon, 0–1.
 * Engine expression: freeze = Ponzi·0.65 + CDS_excess·4.394 (percent, clamped
 * to [1, 99] and rounded to one decimal before it is published).
 */
export function refiFreezeProbability(i: MinskyDocInputs): number {
  const raw =
    i.ponziSharePct * 0.65 + cdsExcessRatio(i.cdsCurrentBps, i.cdsBaselineBps) * 4.394;
  const pct = Math.min(99, Math.max(1, Math.round(raw * 10) / 10));
  return pct / 100;
}

/** The same probability in percent (the unit the page prints). */
export function refiFreezeProbabilityPct(i: MinskyDocInputs): number {
  return Math.round(refiFreezeProbability(i) * 1000) / 10;
}

// ─────────────────────────────────────────────────────────────────────────────
// 3 · SHILLER — EXCESS CAPE YIELD (TIPS BASIS, WITH THE CPI ALTERNATIVE)
// ─────────────────────────────────────────────────────────────────────────────

export interface EcyDocInputs {
  /** AI-sector CAPE multiple. */
  capeMultiple: number;
  /** US 10Y nominal yield, %. */
  us10yYieldPct: number;
  /** 10Y breakeven inflation (TIPS), %. */
  breakeven10yPct: number;
  /** Headline CPI, year over year, %. */
  cpiInflationYoY: number;
}

export type EcyBasis = 'tips' | 'cpi';

export const ECY_BANDS = {
  compressed: 'Compressed (<1.5%)',
  normal: 'Normal (1.5–3.5%)',
  elevated: 'Elevated (>3.5%)',
} as const;

/** Real 10Y yield on the TIPS basis: US10Y − 10Y breakeven. */
export function realYieldTipsPct(i: EcyDocInputs): number {
  return Math.round((i.us10yYieldPct - i.breakeven10yPct) * 100) / 100;
}

/** Real 10Y yield on the CPI basis: US10Y − CPI YoY. */
export function realYieldCpiPct(i: EcyDocInputs): number {
  return Math.round((i.us10yYieldPct - i.cpiInflationYoY) * 100) / 100;
}

/** The published label for the real-yield input the ECY is computed against. */
export function realYieldBasisLabel(i: EcyDocInputs, basis: EcyBasis = 'tips'): string {
  return basis === 'tips'
    ? `US10Y ${i.us10yYieldPct.toFixed(2)}% − 10Y breakeven (TIPS) ${i.breakeven10yPct.toFixed(2)}%`
    : `US10Y ${i.us10yYieldPct.toFixed(2)}% − CPI YoY ${i.cpiInflationYoY.toFixed(2)}%`;
}

/** Real earnings yield 1/CAPE, %. */
export function realEarningsYieldPct(capeMultiple: number): number {
  return Math.round((1 / capeMultiple) * 10000) / 100;
}

/** Excess CAPE Yield = real earnings yield − real 10Y yield, %. */
export function excessCapeYieldPct(i: EcyDocInputs, basis: EcyBasis = 'tips'): number {
  const ey = realEarningsYieldPct(i.capeMultiple);
  const ry = basis === 'tips' ? realYieldTipsPct(i) : realYieldCpiPct(i);
  return Math.round((ey - ry) * 100) / 100;
}

/** The published ECY band for a given ECY value. */
export function ecyBand(ecyPct: number): string {
  if (ecyPct > 3.5) return ECY_BANDS.elevated;
  if (ecyPct >= 1.5) return ECY_BANDS.normal;
  return ECY_BANDS.compressed;
}

// ─────────────────────────────────────────────────────────────────────────────
// 4 · MERTON — STRUCTURAL DISTANCE-TO-DEFAULT
// ─────────────────────────────────────────────────────────────────────────────

export interface MertonDocInputs {
  /** Asset value V used by the DD meter, USD. */
  assetValueUsd: number;
  /** Tracked debt D, USD. */
  totalDebtUsd: number;
  /** Risk-free rate r (US10Y), %. */
  riskFreeRatePct: number;
  /** Asset volatility σ_V, %. */
  assetVolatilityPct: number;
  /** Maturity horizon T, years. */
  maturityYears?: number;
}

/** Merton (1974) distance-to-default in standard deviations. */
export function mertonDistanceToDefault(i: MertonDocInputs): number {
  const sigma = i.assetVolatilityPct / 100;
  const r = i.riskFreeRatePct / 100;
  const T = i.maturityYears ?? 1;
  const d1 =
    (Math.log(i.assetValueUsd / i.totalDebtUsd) + (r + 0.5 * sigma * sigma) * T) /
    (sigma * Math.sqrt(T));
  return Math.round((d1 - sigma * Math.sqrt(T)) * 100) / 100;
}

/**
 * Merton's implied default probability, printed at the model's own resolution.
 * The engine rounds the percent to one decimal, which collapses a sub-0.05%
 * probability to "0.0%"; the page publishes "<0.01%" instead of a fake zero.
 */
export function mertonDefaultProbabilityPct(i: MertonDocInputs): number {
  const sigma = i.assetVolatilityPct / 100;
  const r = i.riskFreeRatePct / 100;
  const T = i.maturityYears ?? 1;
  const d1 =
    (Math.log(i.assetValueUsd / i.totalDebtUsd) + (r + 0.5 * sigma * sigma) * T) /
    (sigma * Math.sqrt(T));
  const dd = d1 - sigma * Math.sqrt(T);
  // Φ(−DD) via the engine's Abramowitz & Stegun 7.1.26 approximation.
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;
  const x = -dd;
  const sign = x < 0 ? -1 : 1;
  const absX = Math.abs(x) / Math.SQRT2;
  const t = 1.0 / (1.0 + p * absX);
  const y = 1.0 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-absX * absX);
  const cdf = 0.5 * (1.0 + sign * y);
  return cdf * 100;
}

/**
 * The published default-probability display string (never a bare "0.0%").
 * A probability below the model's one-decimal resolution is printed as an
 * inequality instead of a fake zero.
 */
export function probabilityDisplayLabel(pct: number): string {
  if (pct < 0.01) return '<0.01%';
  if (pct < 0.1) return '<0.1%';
  return `${pct.toFixed(1)}%`;
}

/** The published default-probability display string (never a bare "0.0%"). */
export function mertonDefaultProbabilityLabel(i: MertonDocInputs): string {
  return probabilityDisplayLabel(mertonDefaultProbabilityPct(i));
}

// ─────────────────────────────────────────────────────────────────────────────
// 5 · ALTMAN Z'' — DISTRESS CLASSIFIER
// ─────────────────────────────────────────────────────────────────────────────

/** Published component basis (src/data/latest-model.json, 19 Oct 2026). */
export const ALTMAN_X1 = 0.118; // working capital / total assets
export const ALTMAN_X2 = -0.142; // retained earnings / total assets
export const ALTMAN_X3 = 0.078; // EBIT / total assets
export const ALTMAN_X4 = 7.21; // market value of equity / total liabilities

/**
 * X₄ PROVENANCE — the one number in the box that is NOT read off a filing.
 * It is a published mirror-parity constant aligned on 19 Oct 2026 so the app
 * engine and the pipeline engine agree; it is not derived from the tracked
 * debt total, and it is not audited.
 */
export const ALTMAN_X4_PROVENANCE = 'assumed equity/debt, not ledger-derived';

/** Altman (2002) Z''-score for non-manufacturers and technology services. */
export function altmanZScore(
  x1: number = ALTMAN_X1,
  x2: number = ALTMAN_X2,
  x3: number = ALTMAN_X3,
  x4: number = ALTMAN_X4,
): number {
  const score = 6.56 * x1 + 3.26 * x2 + 6.72 * x3 + 1.05 * x4;
  return Math.round(score * 100) / 100;
}

/** Published zone for a Z''-score. */
export function altmanZone(score: number): string {
  if (score < 1.1) return 'Distress Zone (<1.1)';
  if (score > 2.6) return 'Safe Zone (>2.6)';
  return 'Grey Zone (1.1–2.6)';
}

/**
 * Altman's logistic mapping from Z'' to a 12-month distress probability, %.
 * Engine expression: 1 / (1 + exp(1.35 · (Z'' − 1.85))).
 */
export function altmanImpliedDistressProbabilityPct(score: number): number {
  return (1 / (1 + Math.exp(1.35 * (score - 1.85)))) * 100;
}

// ─────────────────────────────────────────────────────────────────────────────
// 6 · SORNETTE LPPLS — HAZARD INDEX
// ─────────────────────────────────────────────────────────────────────────────

/**
 * The LPPLS number is an INDEX, not a probability. It is published without a
 * percent sign so it can never be read as "81.5% chance of a crash".
 */
export const LPPLS_HAZARD_LABEL = 'index, not a probability — no % sign';

export interface LpplsDocInputs {
  /** Oracle 5Y CDS, bp. */
  cdsCurrentBps: number;
  /** Capex ÷ operating cash flow (0-1). */
  capexToOcfRatio: number;
}

/** LPPLS crash-hazard INDEX (0-100, no percent sign). */
export function lpplsHazardIndex(i: LpplsDocInputs): number {
  const value =
    Math.round((i.cdsCurrentBps / 81 * 18 + i.capexToOcfRatio * 32) * 10) / 10;
  return Math.min(95, Math.max(10, value));
}

// ─────────────────────────────────────────────────────────────────────────────
// 7 · COMPOSITE RECONCILIATION AND THE CONTAGION LEVERAGE
// ─────────────────────────────────────────────────────────────────────────────

export interface CompositeReconciliation {
  /** Sum of the 8 risk factors' earned points (0-100 risk scale). */
  riskPoints: number;
  /** Points added by the systemic contagion synergy. */
  contagionPoints: number;
  /** Points subtracted by the real-use damper (negative). */
  damperPoints: number;
}

export interface CompositeReconciliationResult {
  /** Sum of the 8 risk factors' earned points (0-100 risk scale). */
  riskPoints: number;
  /** Points added by the systemic contagion synergy. */
  contagionPoints: number;
  /** Points subtracted by the real-use damper (negative). */
  damperPoints: number;
  /** The published composite score. */
  compositeScore: number;
  /** Probability implied by the composite WITH the contagion term. */
  probabilityWithContagionPct: number;
  /** Probability implied by the same composite WITHOUT the contagion term. */
  probabilityWithoutContagionPct: number;
  /** How many probability points the contagion term is worth. */
  leveragePoints: number;
}

/**
 * Reconciles risk points + contagion − damper and measures the contagion
 * term's leverage in probability points (the same logistic the page publishes).
 */
export function reconcileComposite(r: CompositeReconciliation): CompositeReconciliationResult {
  const compositeScore = Math.round((r.riskPoints + r.contagionPoints + r.damperPoints) * 10) / 10;
  const pWith = MODEL_CALIBRATION.mapping(compositeScore) * 100;
  const pWithout = MODEL_CALIBRATION.mapping(
    Math.round((r.riskPoints + r.damperPoints) * 10) / 10,
  ) * 100;
  return {
    riskPoints: r.riskPoints,
    contagionPoints: r.contagionPoints,
    damperPoints: r.damperPoints,
    compositeScore,
    probabilityWithContagionPct: pWith,
    probabilityWithoutContagionPct: pWithout,
    leveragePoints: Math.round((pWith - pWithout) * 10) / 10,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 8 · HISTORICAL CONSISTENCY — CALIBRATION DRIFT
// ─────────────────────────────────────────────────────────────────────────────

export interface HistoricalRow {
  /** Composite stress score the episode produced. */
  compositeScore: number;
  /** Probability published for that episode under the earlier calibration. */
  modelProbabilityPct: number;
}

export interface CalibrationDriftResult {
  /** Probability each episode gets under the LIVE (55, 9) mapping. */
  liveProbabilitiesPct: number[];
  /** Live minus published, per episode. */
  deltasPct: number[];
  /** Smallest absolute drift. */
  minPct: number;
  /** Largest absolute drift. */
  maxPct: number;
}

/**
 * The historical consistency table was produced under an earlier calibration
 * (anchor ≈ 54, steepness ≈ 11.2). This measures how far the LIVE mapping
 * (anchor 55, steepness 9) moves each published row — the disclosure the
 * methodology page publishes next to the table.
 */
export function calibrationDrift(rows: HistoricalRow[]): CalibrationDriftResult {
  const liveProbabilitiesPct = rows.map(
    (r) => MODEL_CALIBRATION.mapping(r.compositeScore) * 100,
  );
  const deltasPct = rows.map(
    (r, i) => Math.round((liveProbabilitiesPct[i] - r.modelProbabilityPct) * 10) / 10,
  );
  const abs = deltasPct.map((d) => Math.abs(d));
  return {
    liveProbabilitiesPct: liveProbabilitiesPct.map((p) => Math.round(p * 10) / 10),
    deltasPct,
    minPct: Math.round(Math.min(...abs) * 10) / 10,
    maxPct: Math.round(Math.max(...abs) * 10) / 10,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 9 · IN-SAMPLE AUC OVER THE CONSISTENCY TABLE
// ─────────────────────────────────────────────────────────────────────────────

export interface ConsistencyRow {
  /** Model probability for the episode, %. */
  modelProbabilityPct: number;
  /** Whether a burst was actually observed in the episode. */
  actualBurstObserved: boolean;
}

/**
 * IN-SAMPLE AUC over the case-enriched consistency table.
 *
 * It is IN-SAMPLE (the table is the model's own output on hand-picked crises)
 * and it is computed over 6 points, five of which are resolved bursts. The
 * open 2026 window is counted as a non-burst, so the statistic is structurally
 * optimistic: it is reported as indicative, never as validation.
 */
export function inSampleAuc(rows: ConsistencyRow[]): number {
  const positives = rows.filter((r) => r.actualBurstObserved).map((r) => r.modelProbabilityPct);
  const negatives = rows.filter((r) => !r.actualBurstObserved).map((r) => r.modelProbabilityPct);
  if (positives.length === 0 || negatives.length === 0) return Number.NaN;
  let hits = 0;
  for (const p of positives) {
    for (const n of negatives) {
      hits += p > n ? 1 : p === n ? 0.5 : 0;
    }
  }
  return Math.round((hits / (positives.length * negatives.length)) * 1000) / 1000;
}

// ─────────────────────────────────────────────────────────────────────────────
// 10 · CROWD DIAGNOSTIC — MARKET-IMPLIED 12-MONTH FLOOR
// ─────────────────────────────────────────────────────────────────────────────

/**
 * The 12-month market-implied read, COMPUTED from the tracked contracts.
 *
 * The implementation lives in factors.ts (the leaf both the model and the
 * pages import) and is re-exported here so the published formula table and the
 * pages can reach it from one place.
 */
export { marketImplied12mBand };

/**
 * The fallback band, for a consumer that has no live contract price to hand
 * (the published fallback price in factors.ts). Pages pass the LIVE price.
 */
export const MARKET_IMPLIED_12M_BAND = marketImplied12mBand(MARKET_IMPLIED_12M_PCT);

/** The published band-floor rule, in one sentence. */
export const BAND_FLOOR_RULE_SENTENCE =
  'the published range can never be narrower than what money on the line prices.';

/**
 * Divergence between the model and the market's own readings, probability
 * points. The raw-contract gap is measured against the price the caller passes
 * in (the live Dec-2026 contract) — never a typed constant.
 */
export function crowdDivergencePoints(
  modelProbabilityPct: number,
  rawContractPct: number = MARKET_IMPLIED_12M_PCT,
): {
  vsBandHigh: number;
  vsBandLow: number;
  vsRawContract: number;
} {
  const band = marketImplied12mBand(rawContractPct);
  return {
    vsBandHigh: Math.round((modelProbabilityPct - band.highPct) * 10) / 10,
    vsBandLow: Math.round((modelProbabilityPct - band.lowPct) * 10) / 10,
    vsRawContract: Math.round((modelProbabilityPct - rawContractPct) * 10) / 10,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 11 · THE PUBLISHED FORMULA TABLE
// ─────────────────────────────────────────────────────────────────────────────

export interface DocumentFormula {
  id: string;
  label: string;
  /** The exact string the methodology page renders. */
  formula: string;
  /** Where the expression lives in the code. */
  source: string;
  /** Optional disclosure printed with the formula. */
  note?: string;
}

/**
 * The published formula table. The page renders this object; it does not
 * re-type any formula. The two entries marked REPLACED were wrong on the page
 * before 19 Oct 2026 and now mirror the engine exactly.
 */
export const MODEL_DOC_FORMULAS: Record<string, DocumentFormula> = {
  logistic_mapping: {
    id: 'logistic_mapping',
    label: 'Primary logistic transformation',
    formula: `P(burst) = 1 / (1 + exp(−(S − ${MODEL_CALIBRATION.anchorScore}) / ${MODEL_CALIBRATION.steepness})) × 100%`,
    source: 'src/lib/model/factors.ts — MODEL_CALIBRATION.mapping',
  },
  odds_shift: {
    id: 'odds_shift',
    label: 'Odds shift per 9 composite points',
    formula: ODDS_SHIFT_SENTENCE,
    source: 'src/lib/model/factors.ts — MODEL_CALIBRATION (odds form of the sigmoid)',
  },
  risk_score_renormalization: {
    id: 'risk_score_renormalization',
    label: 'Coverage-renormalized risk score',
    formula: 'S_risk = Σ(w_i · s_i · c_i) / Σ(w_i · c_i) × 100',
    source: 'src/lib/model/engine.ts — step 2',
  },
  systemic_contagion: {
    id: 'systemic_contagion',
    label: 'Systemic contagion synergy',
    formula:
      'ΔS_contagion = ∛(max(0, s_CDS − 0.35) × max(0, s_Debt − 0.30) × max(0, s_Macro − 0.30)) × 16.0',
    source: 'src/lib/model/engine.ts — step 3',
    note: 'The credit leg consumes the credit factor’s tail-free core score, so a convex credit tail is never counted twice.',
  },
  minsky_fragility: {
    id: 'minsky_fragility',
    label: 'Minsky Financial Fragility Index (0–100)',
    formula:
      'F_Minsky = 0.90·Speculative% + 2.45·Ponzi% + 2.065·CDS_excess + 10·(capexToOcf − 0.548)',
    source: 'src/lib/model/quantitative.ts — computeMinskyModel',
    note: 'REPLACED 19 Oct 2026: the page previously published a ratio formula (weights 2.8 / 1.2 over a hedge-cushion divisor) that the engine never used.',
  },
  refi_freeze: {
    id: 'refi_freeze',
    label: 'Refinancing-freeze probability (12-month)',
    formula: 'P(freeze) = 0.65·Ponzi% + 4.394·CDS_excess',
    source: 'src/lib/model/quantitative.ts — computeMinskyModel',
    note: 'REPLACED 19 Oct 2026: the page previously published a logistic of the fragility index (midpoint 60, width 12) that the engine never used.',
  },
  merton_dd: {
    id: 'merton_dd',
    label: 'Merton (1974) distance-to-default',
    formula: 'DD = [ln(V/D) + (r − 0.5σ_V²)·T] / (σ_V·√T)',
    source: 'src/lib/model/quantitative.ts — computeMertonModel',
  },
  altman_z: {
    id: 'altman_z',
    label: "Altman (2002) Z''-score",
    formula: "Z'' = 6.56·X₁ + 3.26·X₂ + 6.72·X₃ + 1.05·X₄",
    source: 'src/lib/model/quantitative.ts — computeAltmanZScore',
    note: `X₄ = ${ALTMAN_X4}× is an ${ALTMAN_X4_PROVENANCE}.`,
  },
  shiller_ecy: {
    id: 'shiller_ecy',
    label: 'Shiller Excess CAPE Yield',
    formula: 'ECY = 1 / CAPE_AI − (US10Y − 10Y breakeven)',
    source: 'src/lib/model/quantitative.ts — computeShillerCapeModel',
  },
  lppls_hazard: {
    id: 'lppls_hazard',
    label: 'Sornette LPPLS hazard index',
    formula: 'hazard index = round((CDS_bp ÷ 81 × 18 + capexToOcf × 32) × 10) ÷ 10',
    source: 'src/lib/model/quantitative.ts — computeLpplsMetrics',
    note: LPPLS_HAZARD_LABEL,
  },
  fragility_index: {
    id: 'fragility_index',
    label: 'Financial Fragility Index (0–100)',
    formula: 'FFI = clamp(dP/dS·100·2.5 + s_Debt·38 + s_Macro·22 + debtShare·100, 0, 100)',
    source: 'src/lib/model/engine.ts — step 6',
    note: FRAGILITY_INDEX_BASIS,
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// 12 · FACTOR SCORE DOMAIN (v2.6.0 widened two factors to [0, 2])
// ─────────────────────────────────────────────────────────────────────────────

/** Factors that carry a convex panic tail above their ramp ceiling. */
export const CONVEX_TAIL_FACTOR_IDS = ['cds_stress', 'macro_rates'] as const;

/** The published score domain of a factor. */
export function factorScoreDomain(factorId: string): string {
  return (CONVEX_TAIL_FACTOR_IDS as readonly string[]).includes(factorId)
    ? 'Ramped [0, 2] — convex tail above the ramp ceiling'
    : 'Ramped [0, 1]';
}

// ─────────────────────────────────────────────────────────────────────────────
// 13 · PUBLISHED CONSTANTS RE-EXPORTED FOR THE PAGES
// ─────────────────────────────────────────────────────────────────────────────

export {
  MODEL_VERSION,
  SUM_RISK_WEIGHT_PCT,
  DAMPER_WEIGHT_PCT,
  MARKET_IMPLIED_12M_PCT,
  FRAGILITY_INDEX_BASIS,
};
