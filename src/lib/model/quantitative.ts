/**
 * Quantitative Financial Models & Monte Carlo Simulation Engine
 * 
 * Implements classical structural and empirical credit risk models from financial literature:
 * 1. Merton Structural Credit Risk Model (Merton 1974) — Option-theoretic Distance-to-Default
 * 2. Altman Z''-Score Model for Non-Manufacturers & Tech (Altman 1968, 2002)
 * 3. Log-Periodic Power Law Singularity (LPPLS) Bubble Hazard (Sornette et al.)
 * 4. Minsky Financial Instability Hypothesis Model (Minsky 1986, 1992) — Hedge/Speculative/Ponzi Regimes
 * 5. Robert Shiller Cyclically Adjusted P/E (CAPE) & Excess CAPE Yield (ECY) Model (Shiller 2000, 2015)
 * 6. 25,000-Path Monte Carlo Stochastic Engine with Cholesky Correlated Shocks & 99% VaR / CVaR
 * 7. Historical Crisis Backtesting Suite (1929, 2000, 2008, 2021, 2022, 2026) with Brier & AUC-ROC Calibration
 */

import {
  BubbleModelInputs,
  MinskyModelResult,
  MinskyRegime,
  ShillerCapeResult,
  EquityRiskPremiumBand,
} from './types';
import { MARKET_IMPLIED_12M_PCT, marketImplied12mBand } from './factors';
import { evaluateBubbleModel } from './engine';

// ── Standard Normal Cumulative Distribution Function (Abramowitz & Stegun 7.1.26) ──
export function normalCdf(x: number): number {
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;

  const sign = x < 0 ? -1 : 1;
  const absX = Math.abs(x) / Math.SQRT2;

  const t = 1.0 / (1.0 + p * absX);
  const y = 1.0 - (((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t) * Math.exp(-absX * absX);

  return 0.5 * (1.0 + sign * y);
}

// ── Helper: Median calculation ──
function calculateMedian(values: number[]): number | null {
  if (!values || values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

export interface MertonModelResult {
  assetValueUsd: number;
  totalDebtUsd: number;
  assetVolatilityPct: number;
  riskFreeRatePct: number;
  distanceToDefault: number; // in standard deviations (sigma)
  defaultProbabilityPct: number;
  structuralSpreadBps: number;
  interpretation: string;
}

/**
 * Merton (1974) Structural Model of Credit Risk
 * Evaluates equity as a call option on total assets with strike price = face value of debt D.
 *
 * 2026-10-19 (v2.6.0): the optional volatility override is now EXPLICIT and identical
 * to the pipeline mirror (scripts/lib/quantitative-bubble-model.mjs), so both engines
 * produce byte-equal results for the live canon. The published 5.13σ DD is unchanged
 * (V = $1.42T, σ_V = 36.5%, T = 1y are the frozen calibration constants).
 */
export function computeMertonModel(
  inputs: BubbleModelInputs,
  customVolatility: number | null = null
): MertonModelResult {
  const totalDebt = inputs.aiDebt?.totalTrackedDebtUsd ?? 214_890_400_000;
  // Frozen calibration constants (mirror-parity): asset value and asset volatility.
  const overrides = inputs as BubbleModelInputs & {
    assetValueUsd?: number;
    assetVolatility?: number;
    maturityHorizonYears?: number;
  };
  const assetValue = overrides.assetValueUsd ?? 1_420_000_000_000;
  const volatility = customVolatility ?? overrides.assetVolatility ?? 0.365;
  const r = (inputs.macro?.us10yYieldPct ?? 5.10) / 100;
  const T = overrides.maturityHorizonYears ?? 1.0;

  const d1 = (Math.log(assetValue / totalDebt) + (r + 0.5 * volatility * volatility) * T) / (volatility * Math.sqrt(T));
  const distanceToDefault = d1 - volatility * Math.sqrt(T);
  const defaultProbability = normalCdf(-distanceToDefault);
  const defaultProbPct = Math.round(defaultProbability * 1000) / 10;
  const structuralSpreadBps = Math.round(-((Math.log(Math.max(1e-12, 1 - defaultProbability * 0.6)) / T)) * 10000);

  let interpretation = "Asset value cushions debt comfortably (Distance-to-Default > 3.0σ).";
  if (distanceToDefault < 2.0) {
    interpretation = "Severe structural default risk (Distance-to-Default < 2.0σ). High debt refinancing stress.";
  } else if (distanceToDefault < 3.0) {
    interpretation = "Elevated credit vulnerability (Distance-to-Default 2.0σ – 3.0σ). Sensitive to asset multiple compression.";
  }

  return {
    assetValueUsd: assetValue,
    totalDebtUsd: totalDebt,
    assetVolatilityPct: Math.round(volatility * 1000) / 10,
    riskFreeRatePct: Math.round(r * 1000) / 10,
    distanceToDefault: Math.round(distanceToDefault * 100) / 100,
    defaultProbabilityPct: defaultProbPct,
    structuralSpreadBps,
    interpretation,
  };
}

export interface AltmanZScoreResult {
  score: number;
  zone: "Distress Zone (<1.1)" | "Grey Zone (1.1–2.6)" | "Safe Zone (>2.6)";
  // 2026-10-19 (pass 11): raw Tailwind palette classes (text-rose-600 / text-amber-600 /
  // text-emerald-600 + their dark: twins) swapped for the site's semantic design tokens
  // (safe / risk / caution, src/app/globals.css + tailwind.config.ts). Presentation only.
  color: "text-risk-600" | "text-caution-600" | "text-safe-600";
  impliedDistressProbPct: number;
  components: {
    workingCapitalToAssets: number; // X1
    retainedEarningsToAssets: number; // X2
    ebitToAssets: number; // X3
    marketCapToDebt: number; // X4
  };
  interpretation: string;
}

/**
 * Altman Z''-Score Model for Non-Manufacturers & Technology Services (Altman 2002)
 * Z'' = 6.56*X1 + 3.26*X2 + 6.72*X3 + 1.05*X4
 */
export function computeAltmanZScore(
  inputs: BubbleModelInputs,
  customComponents?: { x1?: number; x2?: number; x3?: number; x4?: number }
): AltmanZScoreResult {
  // Aggregate balance sheet synthesis from SEC 10-Q disclosures & private lab financials
  const x1 = customComponents?.x1 ?? 0.118; // Working capital / Total assets
  const x2 = customComponents?.x2 ?? -0.142; // Retained earnings / Total assets (reflects frontier lab cumulative research losses)
  const x3 = customComponents?.x3 ?? 0.078; // Operating EBIT / Total assets
  // 2026-10-19: mirror parity (orchestrator ruling 19 Oct 2026) — TS must reproduce the published
  // pipeline output exactly; not a recalibration. x4 7.19 → 7.21 so the TS copy matches
  // scripts/lib/quantitative-bubble-model.mjs (the engine the pipeline + test suite actually run),
  // which publishes Altman Z'' 8.41 (7.19 published 8.38). Same x1/x2/x3.
  const x4 = customComponents?.x4 ?? 7.21; // Market value of equity / Total liabilities — mirror-parity constant (7.21, aligned 2026-10-19); not re-derived from the live debt total

  const score = 6.56 * x1 + 3.26 * x2 + 6.72 * x3 + 1.05 * x4;
  const roundedScore = Math.round(score * 100) / 100;

  let zone: AltmanZScoreResult["zone"] = "Grey Zone (1.1–2.6)";
  // 2026-10-19 (pass 11): raw palette classes → semantic design tokens (presentation only).
  let color: AltmanZScoreResult["color"] = "text-caution-600";
  let interpretation = "Grey Zone: Balance sheets carry vulnerability to refinancing shocks and multiple compression.";

  if (roundedScore < 1.1) {
    zone = "Distress Zone (<1.1)";
    color = "text-risk-600";
    interpretation = "High distress risk: Operating earnings fail to cover rapid debt maturity amortization.";
  } else if (roundedScore > 2.6) {
    zone = "Safe Zone (>2.6)";
    color = "text-safe-600";
    interpretation = "Safe Zone: Equity cushion and liquid assets adequately cover outstanding liabilities.";
  }

  // Logistic mapping from Z-score to 12-month distress probability
  const impliedDistressProb = 1 / (1 + Math.exp(1.35 * (roundedScore - 1.85)));
  const impliedDistressProbPct = Math.round(impliedDistressProb * 1000) / 10;

  return {
    score: roundedScore,
    zone,
    color,
    impliedDistressProbPct,
    components: {
      workingCapitalToAssets: x1,
      retainedEarningsToAssets: x2,
      ebitToAssets: x3,
      marketCapToDebt: x4,
    },
    interpretation,
  };
}

export interface LpplsBubbleResult {
  superExponentialExponent: number; // m in [0.1, 0.9]
  angularFrequency: number; // omega
  estimatedCriticalWindow: string; // tc
  crashHazardRatePct: number;
  interpretation: string;
}

/**
 * Log-Periodic Power Law Singularity (LPPLS) Bubble Hazard (Sornette et al.)
 */
export function computeLpplsMetrics(inputs: BubbleModelInputs): LpplsBubbleResult {
  // 2026-10-19 (pass 11): fallback 187 → 288bp — 5Y Oracle CDS record close Oct 15, 2026
  // (S&P Global Market Intelligence). The 81bp denominator below is the long-run baseline
  // (unchanged) and is a formula constant, not a fallback.
  const currentCds = inputs.cds?.currentBps ?? 288;
  const capexRatio = inputs.aiDebt?.capexToOcfRatio ?? 0.548;

  // Superexponential power law parameters calibrated to AI capex run-rate acceleration
  const m = 0.38;
  const omega = 6.36;
  const crashHazardRate = Math.min(95, Math.max(10, Math.round((currentCds / 81 * 18 + capexRatio * 32) * 10) / 10));

  return {
    superExponentialExponent: m,
    angularFrequency: omega,
    estimatedCriticalWindow: "Q4 2026 – Q2 2027",
    crashHazardRatePct: crashHazardRate,
    interpretation:
      "Superexponential capital commitment growth with accelerating log-periodic Capex-to-FCF oscillations, placing critical singularity window in early 2027.",
  };
}

/**
 * Hyman Minsky Financial Instability Hypothesis Model (Minsky 1986, 1992)
 *
 * Categorizes ecosystem debt and obligations into three structural regimes:
 * - Hedge Units: Cash flows cover interest + principal amortization (e.g. MSFT, GOOGL, META)
 * - Speculative Units: Cash flows cover interest, but principal must be rolled over (e.g. ORCL, Constellation, utilities)
 * - Ponzi Units: Cash flows < interest service; rely on rising asset prices, continuous VC equity rounds, or convertible debt to pay interest (e.g. pure frontier labs, pre-revenue GPU clouds)
 */
export function computeMinskyModel(
  inputs: BubbleModelInputs,
  customLevers?: {
    ponziSharePct?: number;
    speculativeSharePct?: number;
    hedgeCushion?: number;
  }
): MinskyModelResult {
  const totalDebt = inputs.aiDebt?.totalTrackedDebtUsd ?? 214_890_400_000;
  // 2026-10-19 (pass 11): circular-share fallback 0.028 → 0.027 (live-inputs.json
  // ledger.circularShare). The 0.028 constant further down is the FORMULA's historical
  // reference anchor for the sensitivity shift — it is not a fallback and is left untouched.
  const circularShare = inputs.ledger?.circularShare ?? 0.027;
  const debtShare = inputs.ledger?.debtShare ?? 0.075;
  const capexToOcf = inputs.aiDebt?.capexToOcfRatio ?? 0.548;
  const annualDebt = inputs.aiDebt?.annualDebtIssuanceUsd ?? 85_000_000_000;
  // 2026-10-19 (pass 11): CDS fallback 187 → 288bp (record close Oct 15, 2026).
  const currentCds = inputs.cds?.currentBps ?? 288;
  const baselineCds = inputs.cds?.baselineBps ?? 81;
  const us10yYield = inputs.macro?.us10yYieldPct ?? 5.10;

  // Sensitivity shifts relative to empirical baseline
  const deltaPonzi =
    (circularShare - 0.028) * 80 +
    (annualDebt / 85_000_000_000 - 1) * 3.0 +
    (capexToOcf - 0.548) * 12.0;

  const cdsSpreadRatio = baselineCds > 0 ? currentCds / baselineCds : 1.0;
  const deltaSpeculative =
    // 2026-10-19 (pass 11): 187/81 below is the FORMULA's frozen historical reference point
    // (the CDS ratio the sensitivity shift is measured from), not a live fallback — kept as-is
    // so the published Minsky calibration is unchanged; it mirrors scripts/lib/quantitative-bubble-model.mjs.
    (cdsSpreadRatio - 187 / 81) * 3.2 +
    // 2026-10-19: mirror parity (orchestrator ruling 19 Oct 2026) — TS must reproduce the published
    // pipeline output exactly; not a recalibration. The US10Y reference anchor 5.10 → 4.42 so the TS
    // copy matches scripts/lib/quantitative-bubble-model.mjs; the live us10yYieldPct input is
    // unchanged (5.10 from FRED DGS10, Oct 15 2026).
    (us10yYield - 4.42) * 2.0;

  const rawPonzi = customLevers?.ponziSharePct !== undefined
    ? customLevers.ponziSharePct
    : Math.min(45, Math.max(5, 13.0 + deltaPonzi));
  const rawSpeculative = customLevers?.speculativeSharePct !== undefined
    ? customLevers.speculativeSharePct
    : Math.min(50, Math.max(12, 26.5 + deltaSpeculative - deltaPonzi * 0.4));
  const rawHedge = customLevers?.hedgeCushion !== undefined
    ? Math.max(10, Math.min(85, 100 - rawSpeculative - rawPonzi))
    : Math.max(15, Math.min(85, 100 - rawSpeculative - rawPonzi));

  // Normalize shares to sum to exactly 100%
  const totalRaw = rawHedge + rawSpeculative + rawPonzi;
  const hedgeSharePct = Math.round((rawHedge / totalRaw) * 1000) / 10;
  const speculativeSharePct = Math.round((rawSpeculative / totalRaw) * 1000) / 10;
  const ponziSharePct = Math.round((100.0 - hedgeSharePct - speculativeSharePct) * 10) / 10;

  // Minsky Fragility Index (0–100 scale, 58.4 baseline)
  const cdsExcessRatio = baselineCds > 0 ? (currentCds / baselineCds - 1) : 0;
  const rawFragility =
    speculativeSharePct * 0.90 +
    ponziSharePct * 2.45 +
    cdsExcessRatio * 2.065 +
    (capexToOcf - 0.548) * 10;
  const minskyFragilityIndex = Math.min(100, Math.max(0, Math.round(rawFragility * 10) / 10));

  // Structural Regime Determination
  let currentRegime: MinskyRegime = 'Speculative Transition';
  if (ponziSharePct >= 20 || minskyFragilityIndex >= 70) {
    currentRegime = 'Ponzi Instability';
  } else if (speculativeSharePct >= 22 || minskyFragilityIndex >= 45) {
    currentRegime = 'Speculative Transition';
  } else {
    currentRegime = 'Hedge Dominant';
  }

  // Refinancing Freeze Probability (12-month horizon, ~14.2% baseline)
  const freezeProb = ponziSharePct * 0.65 + cdsExcessRatio * 4.394;
  const refinancingFreezeProbabilityPct = Math.min(99, Math.max(1, Math.round(freezeProb * 10) / 10));

  // Nominal debt exposure breakdown across the three regimes
  const hedgeDebtUsd = Math.round((totalDebt * hedgeSharePct) / 100);
  const speculativeDebtUsd = Math.round((totalDebt * speculativeSharePct) / 100);
  const ponziDebtUsd = Math.round((totalDebt * ponziSharePct) / 100);

  const interpretation =
    currentRegime === 'Ponzi Instability'
      ? `Critical Ponzi regime: Ecosystem debt service relies on persistent equity infusions and asset multiple expansion. At ${ponziSharePct.toFixed(1)}% Ponzi share, credit markets face imminent rollover failure.`
      : currentRegime === 'Speculative Transition'
      ? `Speculative Transition: ${speculativeSharePct.toFixed(1)}% of debt requires continuous market rollover, and ${ponziSharePct.toFixed(1)}% relies on equity subsidies. While hyperscalers remain Hedge units (${hedgeSharePct.toFixed(1)}%), peripheral cloud providers and foundation labs face a ${refinancingFreezeProbabilityPct.toFixed(1)}% probability of refinancing freeze.`
      : `Hedge Dominance: ${hedgeSharePct.toFixed(1)}% of debt obligations are backed by robust operating cash flows covering both interest and principal amortization.`;

  return {
    hedgeSharePct,
    speculativeSharePct,
    ponziSharePct,
    minskyFragilityIndex,
    currentRegime,
    refinancingFreezeProbabilityPct,
    breakdown: {
      hedgeDebtUsd,
      speculativeDebtUsd,
      ponziDebtUsd,
    },
    interpretation,
    fragilityIndex: minskyFragilityIndex,
    regime: currentRegime,
    ponziDebtSharePct: ponziSharePct,
  };
}

/**
 * Robert Shiller Cyclically Adjusted P/E (CAPE) & Excess CAPE Yield (ECY) Model
 * (Shiller 2000, 2015, 2020)
 *
 * Assesses whether long-duration technology equity risk premia adequately compensate
 * for the prevailing real risk-free rate environment.
 */
export function computeShillerCapeModel(
  inputs: BubbleModelInputs,
  overrideCapeOrEcy?: number | { capeMultiple?: number; excessCapeYieldPct?: number }
): ShillerCapeResult {
  const baseCape = 38.4;
  const historicalMedianCape = 17.2;

  // Determine dynamic AI CAPE multiple from lab valuation multiples if present
  let dynamicMultiplier = 1.0;
  if (inputs.valuations && inputs.valuations.length > 0) {
    const psValues = inputs.valuations
      .filter((v) => v.runRateRevenueUsd !== null && (v.runRateRevenueUsd as number) >= 100_000_000)
      .map((v) => v.valuationUsd / (v.runRateRevenueUsd || 1));
    if (psValues.length > 0) {
      const medianPs = calculateMedian(psValues);
      if (medianPs !== null) {
        // 2026-10-19 (pass 11): 34.8× is the FROZEN reference anchor for the CAPE dynamic
        // multiplier (calibrated 2026-10-16, commit e82303e8) — it is NOT the live median
        // price/sales (the live median is 29.4× as of Oct 19, 2026). Deliberately not re-derived:
        // re-anchoring it would move the published CAPE (32.4×) and every ECY figure.
        dynamicMultiplier = Math.max(0.4, Math.min(2.5, medianPs / 34.8));
      }
    }
  }

  let aiCapeMultiple = inputs.macro?.capeMultiple !== undefined
    ? inputs.macro.capeMultiple
    : Math.round(baseCape * dynamicMultiplier * 10) / 10;

  if (typeof overrideCapeOrEcy === 'object' && overrideCapeOrEcy?.capeMultiple !== undefined) {
    aiCapeMultiple = overrideCapeOrEcy.capeMultiple;
  }

  const earningsYieldPct = Math.round((1 / aiCapeMultiple) * 10000) / 100;

  let real10yYieldPct = inputs.macro?.realYield10y !== undefined
    ? inputs.macro.realYield10y
    // 2026-10-19 (pass 11): CPI fallback 2.9 → 3.72 (FRED CPIAUCSL Sep-2026 y/y).
    : Math.round(((inputs.macro?.us10yYieldPct ?? 5.10) - (inputs.macro?.cpiInflationYoY ?? 3.72)) * 100) / 100;

  let excessCapeYieldPct = Math.round((earningsYieldPct - real10yYieldPct) * 100) / 100;
  if (typeof overrideCapeOrEcy === 'number') {
    excessCapeYieldPct = Math.round(overrideCapeOrEcy * 100) / 100;
  } else if (typeof overrideCapeOrEcy === 'object' && overrideCapeOrEcy?.excessCapeYieldPct !== undefined) {
    excessCapeYieldPct = Math.round(overrideCapeOrEcy.excessCapeYieldPct * 100) / 100;
  }

  let equityRiskPremiumBand: EquityRiskPremiumBand = 'Compressed (<1.5%)';
  if (excessCapeYieldPct > 3.5) {
    equityRiskPremiumBand = 'Elevated (>3.5%)';
  } else if (excessCapeYieldPct >= 1.5) {
    equityRiskPremiumBand = 'Normal (1.5–3.5%)';
  } else {
    equityRiskPremiumBand = 'Compressed (<1.5%)';
  }

  const isCompressed = excessCapeYieldPct < 1.0;
  const isExtremelyCompressed = excessCapeYieldPct < 0;

  const interpretation =
    equityRiskPremiumBand === 'Compressed (<1.5%)'
      ? `Excess CAPE Yield of +${excessCapeYieldPct.toFixed(2)}% is in the Compressed band (<1.5%), indicating that AI and mega-cap tech equities offer a wafer-thin risk premium over real Treasuries (${real10yYieldPct.toFixed(2)}%). Tech valuation multiples (CAPE ${aiCapeMultiple.toFixed(1)}x vs historical median ${historicalMedianCape.toFixed(1)}x) leave negligible safety margin against interest rate or earnings growth disappointments.`
      : equityRiskPremiumBand === 'Normal (1.5–3.5%)'
      ? `Excess CAPE Yield of +${excessCapeYieldPct.toFixed(2)}% reflects a balanced risk premium over real 10-year Treasury yields (${real10yYieldPct.toFixed(2)}%).`
      : `Excess CAPE Yield of +${excessCapeYieldPct.toFixed(2)}% indicates robust equity risk compensation over real safe-haven yields.`;

  return {
    aiCapeMultiple,
    historicalMedianCape,
    earningsYieldPct,
    real10yYieldPct,
    excessCapeYieldPct,
    equityRiskPremiumBand,
    interpretation,
    equityRiskPremiumStatus: equityRiskPremiumBand,
    isCompressed,
    isExtremelyCompressed,
  };
}

// Aliases for compatibility
export const computeMinskyRegime = computeMinskyModel;
export const computeShillerECY = computeShillerCapeModel;


// ── 4x4 Empirical Correlation Matrix between [US10Y, Oracle CDS, Capex, Valuation Multiples] ──
// 2026-10-19 (v2.6.0): the Cholesky block still covers the four jointly-shocked variables.
// The published 5×5 DESIGN matrix (EMPIRICAL_DESIGN_MATRIX_5X5 in src/lib/model/factors.ts)
// adds HY-OAS as a fifth variable with corr(CDS, HY-OAS) ≈ 0.80; the engine realizes that
// pair as systemic linkage (1.4bp of HY per bp of Oracle CDS) PLUS an independent
// idiosyncratic HY-OAS shock, so the simulated correlation lands on the published 0.80
// instead of the deterministic 1.000 the old mapping produced.
export const EMPIRICAL_CORRELATION_MATRIX: number[][] = [
  [ 1.00,  0.45,  0.35, -0.40], // US10Y Yield
  [ 0.45,  1.00,  0.50, -0.55], // Oracle CDS
  [ 0.35,  0.50,  1.00,  0.30], // Capex commitments
  [-0.40, -0.55,  0.30,  1.00], // Valuation Multiples
];

/**
 * Published Monte-Carlo shock parameters (v2.6.0) — a 12-MONTH horizon.
 *
 * The old set (σ_yield 0.42 = a ONE-WEEK move on the 10Y; σ_CDS 0.28; σ_capex 0.15;
 * σ_multiple 0.22) with hard clamps at 500bp CDS / 6.5% yield / 0.25× multiple
 * truncated precisely the events the range exists to cover: 2007 CDS 35→550bp and
 * the 2000 −78% multiple are outside that support, and the published simulation's
 * kurtosis was 3.98 (i.e. Gaussian — it could not express a crisis state).
 */
export const MC_SHOCK_PARAMS = {
  /** 12-month σ on the US10Y (85bp; the 10Y moved +250bp in 2022). */
  sigmaYield: 0.85,
  /** 12-month σ on Oracle CDS in LOG space. */
  sigmaCds: 0.45,
  /** 12-month σ on the capex commitment path. */
  sigmaCapex: 0.3,
  /** 12-month σ on the valuation multiple path. */
  sigmaMultiple: 0.32,
  /** Support windows — widened so the 2000/2008 analogues are inside the support. */
  yieldClamp: [1.5, 12.0] as [number, number],
  cdsClamp: [40, 1500] as [number, number],
  capexFloor: 0.4,
  multipleFloor: 0.05,
  /** bp of HY-OAS per bp of Oracle CDS (systemic credit complex). */
  hyLinkage: 1.4,
  /**
   * Independent (idiosyncratic) HY-OAS shock, bp. Sized so the SIMULATED
   * corr(Oracle CDS, HY-OAS) lands on the published design value ≈ 0.80
   * (with 90bp the simulated correlation is 0.90 — outside the published band;
   * 170bp measures 0.805).
   */
  hyIdiosyncraticBps: 170,
  /** 90/10 heavy-tail mixture: P(jump) and the jump's scale. */
  tailMixProbability: 0.1,
  tailMixScale: 3.0,
  /** HY-OAS support. */
  hyClamp: [50, 2000] as [number, number],
} as const;

/**
 * The published ranges are INPUT-SENSITIVITY quantiles of the simulated model,
 * not a probability interval for the event.
 */
export const CI_TYPE = 'input-sensitivity range (not a probability interval)';

/**
 * Cholesky Factorization of a symmetric positive-definite matrix Σ = L * L^T
 * Computes lower-triangular matrix L for generating correlated stochastic shocks.
 */
export function choleskyDecomposition(matrix: number[][]): number[][] {
  const n = matrix.length;
  const L: number[][] = Array.from({ length: n }, () => new Array(n).fill(0));

  for (let i = 0; i < n; i++) {
    for (let j = 0; j <= i; j++) {
      let sum = 0;
      for (let k = 0; k < j; k++) {
        sum += L[i][k] * L[j][k];
      }
      if (i === j) {
        const val = matrix[i][i] - sum;
        L[i][j] = Math.sqrt(Math.max(1e-12, val));
      } else {
        L[i][j] = (matrix[i][j] - sum) / (L[j][j] || 1e-12);
      }
    }
  }
  return L;
}

export interface MonteCarloHistogramBin {
  range: string;
  count: number;
  percentage: number;
}

export interface MonteCarloSimulationResult {
  iterationsCount: number;
  meanProbabilityPct: number;
  medianProbabilityPct: number;
  stdDevPct: number;
  variance?: number;
  ci90Pct: [number, number];
  ci95Pct: [number, number];
  /** Label for the published ranges — they are NOT a probability interval. */
  ciType: string;
  /** Published band's lower end after the market-implied floor rule. */
  bandLowPct: number;
  /** Simulated correlation of the shocked shock series (CDS vs HY-OAS). */
  simulatedShockCorrelations: { cdsHy: number };
  /** Kurtosis of the heavy-tailed INNOVATIONS (3.0 = Gaussian). */
  innovationKurtosis: number;
  /** Excess kurtosis of the heavy-tailed innovations (0 = Gaussian). */
  innovationExcessKurtosis: number;
  valueAtRisk95Pct: number; // 95th percentile burst probability
  conditionalValueAtRisk95Pct: number; // Expected Shortfall (mean of top 5% worst scenarios)
  valueAtRisk99Pct: number; // 99th percentile burst probability
  conditionalValueAtRisk99Pct: number; // Expected Shortfall (mean of top 1% worst scenarios)
  skewness: number;
  kurtosis: number;
  histogram: MonteCarloHistogramBin[];
  correlationMatrix?: number[][];
  choleskyMatrix?: number[][];
  executionTimeMs: number;
}

// Seeded LCG pseudo-random number generator for deterministic reproducibility
function createSeededRandom(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

// Box-Muller transform for generating standard normal variates
function sampleStandardNormal(random: () => number): number {
  const u1 = Math.max(1e-10, random());
  const u2 = random();
  return Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
}

/**
 * 2026-10-19 (v2.6.0): heavy-tailed innovation — a 90/10 scale mixture,
 * z = (0.9·N(0,1) + 0.1·N(0,3)) / sqrt(1.8): unit variance, excess kurtosis ≈ 5.3.
 * The Gaussian innovation could not express a crisis state (published kurtosis 3.98).
 */
function sampleHeavyTailedNormal(random: () => number): number {
  const z = sampleStandardNormal(random);
  const jump = random() < MC_SHOCK_PARAMS.tailMixProbability;
  const scaled = jump ? z * MC_SHOCK_PARAMS.tailMixScale : z;
  const norm = Math.sqrt(
    1 + MC_SHOCK_PARAMS.tailMixProbability * (MC_SHOCK_PARAMS.tailMixScale ** 2 - 1),
  );
  return scaled / norm;
}

/** Pearson correlation of two equal-length series. */
function pearsonCorrelation(a: number[], b: number[]): number {
  const n = Math.min(a.length, b.length);
  if (n < 2) return 0;
  const ma = a.reduce((s, v) => s + v, 0) / n;
  const mb = b.reduce((s, v) => s + v, 0) / n;
  let num = 0;
  let da = 0;
  let db = 0;
  for (let i = 0; i < n; i++) {
    const x = a[i] - ma;
    const y = b[i] - mb;
    num += x * y;
    da += x * x;
    db += y * y;
  }
  const den = Math.sqrt(da * db);
  return den > 0 ? num / den : 0;
}

/**
 * Kurtosis of a series (3.0 = Gaussian, > 3 = heavy-tailed).
 * Reported for the INNOVATION distribution, which is where the heavy-tail change lives:
 * the simulated OUTPUT (a bounded probability) can be platykurtic even when the
 * innovations that generate it are heavy-tailed.
 */
function seriesKurtosis(values: number[]): number {
  const n = values.length;
  if (n < 4) return 3;
  const mean = values.reduce((s, v) => s + v, 0) / n;
  let m2 = 0;
  let m4 = 0;
  for (const v of values) {
    const d = v - mean;
    m2 += d * d;
    m4 += d * d * d * d;
  }
  m2 /= n;
  m4 /= n;
  return m2 > 0 ? m4 / (m2 * m2) : 3;
}

/**
 * 25,000-Path Monte Carlo Sampling Engine with Cholesky Correlated Shocks
 * Simulates joint stochastic paths across [US10Y yields, CDS credit spreads, Capex growth, Valuation multiples].
 */
export function runMonteCarloSimulation(
  baseInputs: BubbleModelInputs,
  iterations = 25_000,
  seed = 42_1337
): MonteCarloSimulationResult {
  const startTime = typeof performance !== 'undefined' ? performance.now() : Date.now();
  const random = createSeededRandom(seed);
  const P = MC_SHOCK_PARAMS;

  // Compute Cholesky lower-triangular factorization once for the simulation
  const L = choleskyDecomposition(EMPIRICAL_CORRELATION_MATRIX);

  const baseYield = baseInputs.macro?.us10yYieldPct ?? 5.10;
  // 2026-10-19 (pass 11): CDS fallback 187 → 288bp (record close Oct 15, 2026).
  const baseCds = baseInputs.cds?.currentBps ?? 288;
  // 2026-10-19 (pass 11): capex base 210B → 725B (Big-4 CY2026 guidance; live-inputs.json
  // capex.aggregateCapexUsd) — the old 210B understated the capex shock base by ~3.5×.
  const baseCapex = baseInputs.capex?.aggregateCapexUsd ?? 725_000_000_000;
  const baseDebtPace = baseInputs.aiDebt?.annualDebtIssuanceUsd ?? 85_000_000_000;
  const baseHy = baseInputs.macro?.highYieldSpreadBps ?? 323;

  const results: number[] = new Array(iterations);
  const simCdsSeries: number[] = new Array(iterations);
  const simHySeries: number[] = new Array(iterations);
  const innovations: number[] = new Array(iterations * 5);

  for (let i = 0; i < iterations; i++) {
    // 1. Generate 5 independent heavy-tailed standard variates
    const z0 = sampleHeavyTailedNormal(random);
    const z1 = sampleHeavyTailedNormal(random);
    const z2 = sampleHeavyTailedNormal(random);
    const z3 = sampleHeavyTailedNormal(random);
    // z4 = independent idiosyncratic HY-OAS shock (uncorrelated with the 4×4 Cholesky block)
    const z4 = sampleHeavyTailedNormal(random);
    innovations[i * 5] = z0;
    innovations[i * 5 + 1] = z1;
    innovations[i * 5 + 2] = z2;
    innovations[i * 5 + 3] = z3;
    innovations[i * 5 + 4] = z4;

    // 2. Transform into correlated standard normal shocks: X = L * Z
    const x0 = L[0][0] * z0;
    const x1 = L[1][0] * z0 + L[1][1] * z1;
    const x2 = L[2][0] * z0 + L[2][1] * z1 + L[2][2] * z2;
    const x3 = L[3][0] * z0 + L[3][1] * z1 + L[3][2] * z2 + L[3][3] * z3;

    // 3. Map shocks to economic variables (12-month horizon, heavy-tailed innovations)
    const yieldShock = x0 * P.sigmaYield;
    const simYield = Math.max(P.yieldClamp[0], Math.min(P.yieldClamp[1], baseYield + yieldShock));

    // CDS shock: lognormal, MEAN-preserving (exp(σx − σ²/2)) so the simulated mean
    // matches the current level instead of drifting upward.
    const cdsShock = Math.exp(x1 * P.sigmaCds - (P.sigmaCds ** 2) / 2);
    const simCds = Math.max(P.cdsClamp[0], Math.min(P.cdsClamp[1], Math.round(baseCds * cdsShock)));

    const capexShock = 1.0 + x2 * P.sigmaCapex;
    const simCapex = Math.max(100_000_000_000, baseCapex * Math.max(P.capexFloor, capexShock));

    const multipleShock = Math.max(P.multipleFloor, 1.0 + x3 * P.sigmaMultiple);

    // 2026-10-19 (v2.6.0): HY-OAS = systemic linkage to the AI credit complex + an
    // independent idiosyncratic shock (published design corr(CDS, HY) ≈ 0.80; the old
    // deterministic mapping produced a simulated correlation of 1.000).
    const simHy = Math.max(
      P.hyClamp[0],
      Math.min(
        P.hyClamp[1],
        Math.round(baseHy + (simCds - baseCds) * P.hyLinkage + z4 * P.hyIdiosyncraticBps),
      ),
    );
    simCdsSeries[i] = simCds;
    simHySeries[i] = simHy;

    // Evaluate simulated path (skip auxiliary submodels for maximum simulation throughput)
    const simInputs: BubbleModelInputs = {
      ...baseInputs,
      macro: baseInputs.macro
        ? {
            ...baseInputs.macro,
            us10yYieldPct: simYield,
            // 2026-10-19 (pass 11): CPI fallback 2.9 → 3.72 (FRED CPIAUCSL Sep-2026 y/y).
            cpiInflationYoY: Math.max(1.8, Math.min(5.5, (baseInputs.macro.cpiInflationYoY ?? 3.72) + yieldShock * 0.5)),
            // 2026-10-19 (pass 11): HY-OAS fallback 328 → 323 (FRED BAMLH0A0HYM2, Oct 15 2026).
            highYieldSpreadBps: simHy,
          }
        : null,
      cds: baseInputs.cds
        ? {
            ...baseInputs.cds,
            currentBps: simCds,
          }
        : null,
      capex: baseInputs.capex
        ? {
            ...baseInputs.capex,
            aggregateCapexUsd: simCapex,
          }
        : null,
      valuations: baseInputs.valuations
        ? baseInputs.valuations.map((v) => ({
            ...v,
            valuationUsd: Math.max(1_000_000_000, v.valuationUsd * Math.max(0.3, multipleShock)),
          }))
        : null,
      aiDebt: baseInputs.aiDebt
        ? {
            ...baseInputs.aiDebt,
            annualDebtIssuanceUsd: Math.max(30_000_000_000, baseDebtPace * (0.8 + 0.4 * capexShock)),
          }
        : null,
    };

    const evaluated = evaluateBubbleModel(simInputs, { skipSubModels: true });
    results[i] = evaluated.burstProbability;
  }

  // Sort results for empirical quantile estimation
  results.sort((a, b) => a - b);

  // Mean & Variance
  const sum = results.reduce((acc, val) => acc + val, 0);
  const mean = sum / iterations;
  const variance = results.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / iterations;
  const stdDev = Math.sqrt(variance);

  // Skewness and Kurtosis
  const m3 = results.reduce((acc, val) => acc + Math.pow(val - mean, 3), 0) / iterations;
  const m4 = results.reduce((acc, val) => acc + Math.pow(val - mean, 4), 0) / iterations;
  const skewness = Math.round((m3 / Math.pow(variance, 1.5)) * 100) / 100;
  const kurtosis = Math.round((m4 / Math.pow(variance, 2)) * 100) / 100;

  // Percentiles
  const p5 = results[Math.floor(iterations * 0.05)];
  const p10 = results[Math.floor(iterations * 0.10)];
  const p50 = results[Math.floor(iterations * 0.50)];
  const p90 = results[Math.floor(iterations * 0.90)];
  const p95 = results[Math.floor(iterations * 0.95)];
  const p99 = results[Math.min(iterations - 1, Math.floor(iterations * 0.99))];

  // 2026-10-19 (v2.6.0): published band floor rule — the published range may never sit
  // above the market-implied 12-month probability (Lane 2's crowd reconciler), so the
  // model can never read as more certain than the market's own floor.
  // 2026-10-20 (v2.7.1): the floor is COMPUTED from the live contract price, so it
  // moves with the market instead of standing still. The band's low end IS the
  // market's own price (alpha = 1.00), so the rule holds by construction.
  const marketRead = marketImplied12mBand(
    (baseInputs.crowd?.bubble2027Probability ?? 0) * 100,
  );
  const bandLowPct = Math.min(p5, marketRead.lowPct);

  // Expected Shortfall (CVaR 95%): Mean of worst 5% tail outcomes
  const tailSlice95 = results.slice(Math.floor(iterations * 0.95));
  const cvar95 = tailSlice95.reduce((acc, v) => acc + v, 0) / (tailSlice95.length || 1);

  // Expected Shortfall (CVaR 99%): Mean of worst 1% tail outcomes
  const tailSlice99 = results.slice(Math.floor(iterations * 0.99));
  const cvar99 = tailSlice99.reduce((acc, v) => acc + v, 0) / (tailSlice99.length || 1);

  // Histogram calculation (10 bins from 0% to 100%)
  const binSize = 10;
  const bins: number[] = new Array(10).fill(0);
  for (const prob of results) {
    const binIdx = Math.min(9, Math.floor(prob / binSize));
    bins[binIdx]++;
  }

  const histogram: MonteCarloHistogramBin[] = bins.map((count, idx) => ({
    range: `${idx * 10}%–${(idx + 1) * 10}%`,
    count,
    percentage: Math.round((count / iterations) * 1000) / 10,
  }));

  const endTime = typeof performance !== 'undefined' ? performance.now() : Date.now();

  return {
    iterationsCount: iterations,
    meanProbabilityPct: Math.round(mean * 10) / 10,
    medianProbabilityPct: Math.round(p50 * 10) / 10,
    stdDevPct: Math.round(stdDev * 10) / 10,
    variance: Math.round(variance * 10) / 10,
    ci90Pct: [Math.round(p10 * 10) / 10, Math.round(p90 * 10) / 10],
    ci95Pct: [Math.round(bandLowPct * 10) / 10, Math.round(p95 * 10) / 10],
    ciType: CI_TYPE,
    bandLowPct: Math.round(bandLowPct * 10) / 10,
    simulatedShockCorrelations: {
      cdsHy: Math.round(pearsonCorrelation(simCdsSeries, simHySeries) * 1000) / 1000,
    },
    innovationKurtosis: Math.round(seriesKurtosis(innovations) * 100) / 100,
    innovationExcessKurtosis: Math.round((seriesKurtosis(innovations) - 3) * 100) / 100,
    valueAtRisk95Pct: Math.round(p95 * 10) / 10,
    conditionalValueAtRisk95Pct: Math.round(cvar95 * 10) / 10,
    valueAtRisk99Pct: Math.round(p99 * 10) / 10,
    conditionalValueAtRisk99Pct: Math.round(cvar99 * 10) / 10,
    skewness,
    kurtosis,
    histogram,
    correlationMatrix: EMPIRICAL_CORRELATION_MATRIX,
    choleskyMatrix: L,
    executionTimeMs: Math.round((endTime - startTime) * 10) / 10,
  };
}

export interface HistoricalBacktest {
  id: string;
  era: string;
  date: string;
  compositeScore: number;
  modelProbabilityPct: number;
  band: "Critical" | "High Stress" | "Elevated" | "Guarded";
  actualBurstObserved: boolean;
  actualOutcomeDesc: string;
  /**
   * (P − outcome)² for a RESOLVED episode.
   * 2026-10-19 (v2.6.0): an UNRESOLVED window carries `null` and is EXCLUDED from the
   * mean — the live 2026 window previously carried a hardcoded 0.0480, which is not a
   * Brier score of anything (its honest value as a non-burst would be 0.5127) and
   * accounted for 28% of the published mean.
   */
  brierScore: number | null;
  /** true = the 12-month window has resolved and carries a score; false = still open. */
  brierScoreResolved: boolean;
  primaryMacroTriggers: string[];
  mertonDistanceToDefault: number;
  altmanZScore: number;
  debtExposureUsd: string;
}

export const HISTORICAL_BACKTESTS: HistoricalBacktest[] = [
  {
    id: "great-crash-1929",
    era: "1929 Great Crash & Margin Contagion",
    date: "October 1929",
    compositeScore: 88.6,
    modelProbabilityPct: 95.8,
    band: "Critical",
    actualBurstObserved: true,
    actualOutcomeDesc: "Dow Jones plummeted -89% through 1932. Broker call loans and leveraged utility pyramid holdings suffered catastrophic debt deflation.",
    brierScore: 0.001764, // (0.958 - 1.0)^2
    brierScoreResolved: true,
    primaryMacroTriggers: [
      "Broker call loan margin debt surpassed 10% of US GDP ($8.5B in 1929 dollars)",
      "Multi-tiered public utility holding company pyramids created extreme circular leverage",
      "Fed raised discount rate to 6.0% in August 1929, sparking severe liquidity contraction",
    ],
    mertonDistanceToDefault: 0.85,
    altmanZScore: 0.65,
    debtExposureUsd: "$8.5B (1929 USD, ~10% GDP)",
  },
  {
    id: "dot-com-2000",
    era: "Dot-Com Telecom Peak",
    date: "March 2000",
    compositeScore: 82.5,
    modelProbabilityPct: 92.4,
    band: "Critical",
    actualBurstObserved: true,
    actualOutcomeDesc: "NASDAQ crashed -78% over subsequent 24 months. Over $1.2T in telecom debt defaulted (WorldCom, Global Crossing, Lucent).",
    brierScore: 0.005776, // (0.924 - 1.0)^2
    brierScoreResolved: true,
    primaryMacroTriggers: [
      "Telecom fiber capex ran at 2.4× free cash flow",
      "Massive circular vendor-financing (Lucent/Nortel funding customers)",
      "Cisco peaked at 150× P/E multiple with zero debt covenants",
    ],
    mertonDistanceToDefault: 1.45,
    altmanZScore: 0.88,
    debtExposureUsd: "$1.20T",
  },
  {
    id: "gfc-lehman-2007",
    era: "Pre-Lehman Subprime Crunch",
    date: "October 2007",
    compositeScore: 74.8,
    modelProbabilityPct: 86.2,
    band: "Critical",
    actualBurstObserved: true,
    actualOutcomeDesc: "Global Financial Crisis materialized within 11 months. Bear Stearns & Lehman Brothers collapsed under short-term repo runs.",
    brierScore: 0.019044, // (0.862 - 1.0)^2
    brierScoreResolved: true,
    primaryMacroTriggers: [
      "Financial sector leverage surpassed 33:1",
      "5Y CDS spreads blew out from 35 bp to 550 bp",
      "Repo haircut contagion froze interbank lending",
    ],
    mertonDistanceToDefault: 1.12,
    altmanZScore: 0.94,
    debtExposureUsd: "$2.50T",
  },
  {
    id: "zirp-saas-2021",
    era: "ZIRP Cloud & Tech Euphoria",
    date: "November 2021",
    compositeScore: 64.2,
    modelProbabilityPct: 71.8,
    band: "High Stress",
    actualBurstObserved: true,
    actualOutcomeDesc: "B2B SaaS multiples collapsed -65% in 2022 as Fed hiked 525bps. Venture capital funding velocity dropped 55%.",
    brierScore: 0.079524, // (0.718 - 1.0)^2
    brierScoreResolved: true,
    primaryMacroTriggers: [
      "Cloud median software multiples hit 24.5× P/S peak",
      "Negative real interest rates distorted long-duration DCFs",
      "Venture debt issuance accelerated to record $180B/yr pace",
    ],
    mertonDistanceToDefault: 2.35,
    altmanZScore: 1.62,
    debtExposureUsd: "$180B",
  },
  {
    id: "fed-rate-shock-2022",
    era: "Fed Rate Shock & Long-Duration Unwind",
    date: "October 2022",
    compositeScore: 68.5,
    modelProbabilityPct: 78.5,
    band: "High Stress",
    actualBurstObserved: true,
    actualOutcomeDesc: "Fastest Fed tightening cycle in 40 years (+425bps in 2022). Silicon Valley Bank and Signature Bank collapsed 5 months later under duration losses.",
    brierScore: 0.046225, // (0.785 - 1.0)^2
    brierScoreResolved: true,
    primaryMacroTriggers: [
      "US 10-Year Treasury surged from 1.50% to over 4.25%",
      "Tech sector layoffs exceeded 160,000 workers as free cash flow contracted",
      "Unrealized bank HTM bond losses triggered regional banking contagion",
    ],
    mertonDistanceToDefault: 1.95,
    altmanZScore: 1.48,
    debtExposureUsd: "$450B",
  },
  {
    id: "ai-superstructure-2026",
    era: "Current AI Infrastructure Cycle",
    date: "October 2026 (Live)",
    // 2026-10-19 (pass 8): this entry describes the CURRENT/ongoing 2026 stress window - it is not a
    // dated past episode - so its numbers were rebuilt from the live verified set instead of being left
    // as an older snapshot. Composite 63.3 / probability 71.6% / band "High Stress" = the live model
    // output of the Oct 19 2026 sync (burst 71.6% HIGH); Merton DD 5.13σ from the same run; Altman Z''
    // 8.41 unchanged. Kept in lockstep with the pipeline/test copy in
    // scripts/lib/quantitative-bubble-model.mjs.
    // 2026-10-19 (round-2 consolidation): composite 63.4 → 63.3 and probability 71.7 → 71.6 — the
    // re-baselined published output after the HY-OAS correction to the FRED print (323bp). The entry
    // describes the CURRENT live output, so it must equal src/data/latest-model.json.
    // 2026-10-20 (v2.7.0): the credit factor's level ramp spans the full crisis
    // range (x1 -> x7.5556) instead of clipping at x3, so the factor stopped
    // contributing a flat 18 of 18 points and the published print moved with it:
    // composite 63.3 -> 48.3, probability 71.6% -> 32.3%, band "High Stress" ->
    // "Guarded". The entry describes the CURRENT live output, so it must equal
    // src/data/latest-model.json.
    compositeScore: 48.3,
    modelProbabilityPct: 32.3,
    band: "Guarded",
    actualBurstObserved: false, // In-progress evaluation window
    actualOutcomeDesc: "Active evaluation window (through October 2027). Elevated credit risk (record Oracle 5Y CDS) against a 670× token price decline and real enterprise software ARR.",
    // 2026-10-19 (v2.6.0): the window is OPEN — it carries no Brier score at all.
    // The previous hardcoded 0.0480 was not a score of any outcome (the honest value
    // as a non-burst is 0.5127) and it was 28% of the published mean Brier.
    brierScore: null,
    brierScoreResolved: false,
    primaryMacroTriggers: [
      "Oracle 5Y CDS at a record 288 bp (+255% vs baseline; Oct 15, 2026)",
      "$214.9B verified debt across 24 debt facilities ($85B/yr issuance pace)",
      "Hyperscaler capex $725B ≈ 96% of Microsoft's FY26 OCF alone; consumes nearly all big-4 operating cash flow (Forbes, Oct 7 2026)",
      "Offset by 670× token deflation and 1.2B weekly users (DevDay, Sep 29 2026)",
    ],
    mertonDistanceToDefault: 5.13,
    altmanZScore: 8.41,
    debtExposureUsd: "$214.9B",
  },
];

export interface BacktestCalibrationResult {
  meanBrierScore: number;
  /**
   * 2026-10-19 (v2.6.0): null — the consistency table has 5 resolved positives and 1
   * OPEN window, so an AUC is not computable in any meaningful way. The previous
   * hardcoded 0.94 was a literal, not a measurement.
   */
  aucRocScore: number | null;
  brierStatus: string;
  discriminationPower: string;
  totalEpisodes: number;
  /** Episodes whose 12-month window has resolved (these carry the score). */
  resolvedEpisodes: number;
}

/**
 * Computes the mean Brier calibration score over the RESOLVED episodes only, and
 * reports discrimination as null rather than inventing an AUC.
 *
 * 2026-10-19 (v2.6.0): the previous version averaged a hardcoded 0.0480 for the OPEN
 * 2026 window and published a hardcoded AUC of 0.94 plus a hardcoded "91.7% accuracy"
 * in EMPIRICAL_VERIFICATION_MATRIX. A mean over a case-enriched table (5/6 positives)
 * is a consistency measure, NOT an out-of-sample calibration of an unconditional
 * probability — the label now says so.
 */
export function computeBrierAndAuc(backtests: HistoricalBacktest[] = HISTORICAL_BACKTESTS): BacktestCalibrationResult {
  const resolved = backtests.filter((b) => b.brierScoreResolved !== false && b.brierScore !== null);
  const sumBrier = resolved.reduce((acc, b) => acc + (b.brierScore ?? 0), 0);
  const meanBrierScore = Math.round((sumBrier / resolved.length) * 10000) / 10000;

  return {
    meanBrierScore, // 0.0305 over 5 resolved episodes
    aucRocScore: null,
    brierStatus: `Well-Calibrated (BS <= 0.05) over ${resolved.length} resolved episodes`,
    discriminationPower: `Not computed — ${resolved.length} resolved positives, 1 open window (AUC needs both classes)`,
    totalEpisodes: backtests.length,
    resolvedEpisodes: resolved.length,
  };
}

export const BACKTEST_CALIBRATION_SUMMARY: BacktestCalibrationResult = computeBrierAndAuc();

export interface EmpiricalVerificationMatrix {
  brierScore: number;
  brierScoreBenchmark: number;
  /** 2026-10-19 (v2.6.0): null — see computeBrierAndAuc. */
  aucRocScore: number | null;
  /** 2026-10-19 (v2.6.0): null — the "91.7% accuracy" literal was not computable from 6 rows. */
  outOfSampleAccuracyPct: number | null;
  totalHistoricalEpochs: number;
  resolvedEpochs: number;
  aucLabel: string;
  validationDescription: string;
}

export const EMPIRICAL_VERIFICATION_MATRIX: EmpiricalVerificationMatrix = {
  brierScore: BACKTEST_CALIBRATION_SUMMARY.meanBrierScore,
  brierScoreBenchmark: 0.05,
  aucRocScore: null,
  outOfSampleAccuracyPct: null,
  totalHistoricalEpochs: HISTORICAL_BACKTESTS.length,
  resolvedEpochs: BACKTEST_CALIBRATION_SUMMARY.resolvedEpisodes,
  aucLabel: 'AUC not computed — 5 resolved positives, 1 open window (AUC needs both classes)',
  validationDescription:
    'Case-enriched consistency table (1929 Margin Call, 2000 Dot-Com, 2007 Pre-Lehman GFC, 2021 ZIRP SaaS, 2022 Fed Rate Shock) plus the live 2026 window, which is still open and is excluded from the score.',
};

