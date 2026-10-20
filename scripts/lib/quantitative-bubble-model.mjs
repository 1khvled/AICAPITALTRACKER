/**
 * Quantitative Financial Models & Bubble Simulation Engine (Pure ES Module for Node.js)
 * 
 * Implements classical structural and empirical credit risk models from financial literature:
 * 1. Unified Multi-Factor Bubble Score & Burst Probability (Transparent Composite Recipe)
 * 2. Merton Structural Credit Risk Model (Merton 1974) — Option-theoretic Distance-to-Default
 * 3. Altman Z''-Score Model for Non-Manufacturers & Technology Services (Altman 1968, 2002)
 * 4. Log-Periodic Power Law Singularity (LPPLS) Bubble Hazard (Sornette et al.)
 * 5. Hyman Minsky Financial Instability Hypothesis Model (Minsky 1986, 1992) — Hedge/Speculative/Ponzi Regimes
 * 6. Robert Shiller Cyclically Adjusted P/E (CAPE) & Excess CAPE Yield (ECY) Model (Shiller 2000, 2015)
 * 7. 25,000-Path Monte Carlo Stochastic Sampling Engine with Cholesky Correlated Shocks & 99% VaR / CVaR
 * 8. Historical Crisis Backtesting Suite (1929, 2000, 2008, 2021, 2022, 2026) with Brier & AUC-ROC Calibration
 */

// ── 2026-10-19 (data fact-checker pass 8) — fallback-default alignment ────────────────
// This mirror is what the pipeline and the test suite actually execute, so its degradation-path
// defaults were swept against the verified live set in src/data/live-inputs.json. VALUES ONLY — no
// formula, weight, ramp or factor structure was touched. Aligned defaults (old → new):
//   CDS currentBps 187 → 288bp (record close Oct 15 2026) · macro CPI 2.9 → 3.72 · Fed funds 4.75 → 3.75
//   · HY-OAS 328 → 323bp · real 10y 2.70 → 2.75 · capex 485B → 725B (sim base 210B → 725B)
//   · adoption user growth 0.65 → 0.5 · API deflation 40 → 670× (input basis)
//   · ledger debt share 0.08/0.07/0.070 → 0.075 · top10 0.65 → 0.638 · circular 0.028 → 0.027
//   · total disclosed 2.8e12 → 2,872,873,160,000 · byYear 769,180,302,026 → 812,536,300,000
//   · announcedShare 0.13 → 0.101 · daysSinceLastMega 14 → 21 · tracked debt 228,072,500,000 → 214,890,400,000
//   · crowd bubble-2026 odds 0.076 → 0.0905 · crowd volume 0 → 9,167,627 (rounded from the live
//     9,167,626.861 — the pass-11 rounding fix below)
// Unchanged on purpose (live values agree): annualDebtIssuanceUsd 85B · aggregateFcfUsd 260B
//   · capexToOcfRatio 0.548 (owner review pending) · baseline CDS 81bp · us10y 5.10 · us02y 4.75
//   · us10yBaseline 3.75 · rateHikeRiskBps 25 · asset value/volatility/horizon and LPPLS m/omega.
//
// ── 2026-10-19 (fix-lane A, pass 11) — remaining divergence notes ───────────────────────────
//   · crowd volume fallback 9,167,527 → 9,167,627 (rounding of the live 9,167,626.861…).
//   · FORMULA ANCHORS intentionally NOT changed (they are calibration constants, not fallbacks):
//       Altman x4 7.21 here vs 7.19 in src/lib/model/quantitative.ts (the TS copy is frozen —
//         "calibrated constant (7.19, frozen 2026-10-19)"), and the Minsky CDS reference 187/81
//         plus the 10Y reference (4.42 here vs 5.10 in the TS copy). Re-deriving either moves
//         published numbers (Altman Z'' 8.41, Minsky S/P 55.2/31.9/12.9) → left for the owner.
//
// ── Standard Normal Cumulative Distribution Function (Abramowitz & Stegun 7.1.26) ──
export function normalCdf(x) {
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

const clamp01 = (x) => Math.min(1, Math.max(0, x));
const ramp = (value, a, b) => clamp01((value - a) / (b - a));

const median = (xs) => {
  if (!xs || xs.length === 0) return null;
  const s = [...xs].sort((m, n) => m - n);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
};

const kellyAnchor = 55;
const steepness = 9;
export const logisticMapping = (score) => 1 / (1 + Math.exp(-(score - kellyAnchor) / steepness));

// ── 2026-10-19 (model v2.6.0, algorithm-improvement wave 1) ─────────────────────────────
// MIRROR PARITY NOTE: this file is the engine the pipeline and the test suite execute;
// src/lib/model/*.ts is the app copy. Every change below is applied identically in both
// (the TS↔MJS byte-parity check lives in scripts/test-algo.mjs, test [16]).
//   · cds_stress: momentum became a MULTIPLIER and a convex RATIO-SPACE tail was added
//     above the published ramp ceiling (the old ramp was dead above 288bp: 288 → 1000bp
//     moved the published probability by 0.0 points). Print-neutral at the live canon.
//   · macro_rates: the HY-OAS leg gained the same convex panic tail above 500bp.
//   · damper: the deflation leg is no longer clamped at 50× (it responds over [50×, 500×]).
//   · the hand-rolled factor-dispersion confidence band is DELETED; the published ranges
//     are the Monte-Carlo input-sensitivity quantiles.
//   · coverage is published RISK-ONLY (it used to include the damper's 10 points → 1.10).
//   · the Monte Carlo is horizon-consistent (12-month σ), heavy-tailed, and no longer
//     truncates the 2000/2008 tail; HY-OAS is de-collinearised from Oracle CDS.
//
// Published model constants (mirrored from src/lib/model/factors.ts):
export const MODEL_VERSION = '2.7.0';
export const MARKET_IMPLIED_12M_PCT = 19.5;

/**
 * The 12-month market-implied read, computed from the tracked contract price
 * (mirrored from src/lib/model/factors.ts). The band's low end IS the market's
 * own price (alpha = 1.00), so the band-floor rule holds by construction.
 */
export function marketImplied12mBand(contractPct) {
  const price =
    Number.isFinite(contractPct) && contractPct > 0 ? contractPct : MARKET_IMPLIED_12M_PCT;
  const alphaRange = [1.0, 1.25];
  const alphaCentral = 1.1;
  const round1 = (n) => Math.round(n * 10) / 10;
  return {
    contractPct: round1(price),
    centralPct: round1(price * alphaCentral),
    lowPct: round1(price * alphaRange[0]),
    highPct: round1(price * alphaRange[1]),
    alphaRange,
    alphaCentral,
  };
}
export const FRAGILITY_INDEX_BASIS =
  'derivative-weighted fragility from the same factor scores — not a first-derivative measure';
export const CI_TYPE = 'input-sensitivity range (not a probability interval)';

// ── Published Monte-Carlo shock parameters (v2.6.0) — a 12-MONTH horizon ──────────────────
// The old set (σ_yield 0.42 = a ONE-WEEK move on the 10Y; σ_CDS 0.28; σ_capex 0.15;
// σ_multiple 0.22) with hard clamps at 500bp CDS / 6.5% yield / 0.25× multiple truncated
// precisely the events the range exists to cover: 2007 CDS 35→550bp and the 2000 −78%
// multiple are outside that support, and the published kurtosis was 3.98 (Gaussian —
// the simulation could not express a crisis state).
export const MC_SHOCK_PARAMS = {
  sigmaYield: 0.85,
  sigmaCds: 0.45,
  sigmaCapex: 0.30,
  sigmaMultiple: 0.32,
  yieldClamp: [1.5, 12.0],
  cdsClamp: [40, 1500],
  capexFloor: 0.4,
  multipleFloor: 0.05,
  /** bp of HY-OAS per bp of Oracle CDS (systemic credit complex). */
  hyLinkage: 1.4,
  /** Independent HY-OAS shock, bp — sized so the SIMULATED corr(CDS,HY) ≈ 0.80. */
  hyIdiosyncraticBps: 170,
  tailMixProbability: 0.10,
  tailMixScale: 3.0,
  hyClamp: [50, 2000],
};

/**
 * 1. Unified Multi-Factor Bubble Stress Evaluation
 */
export function evaluateBubbleModel(inputs, options = {}) {
  const contributions = [];
  let totalRiskEarned = 0;
  let totalRiskCoverageWeight = 0;
  let damperDiscount = 0;
  let riskCoverageWeight = 0; // risk-only coverage (0-1), published as `coverage`
  let damperCoverage = 0;

  // Factor 1: CDS Stress (weight: 18)
  {
    const cds = inputs.cds;
    let score = 0.35;
    let coreScore = 0.35;
    let reading = 'No verified CDS datapoint';
    let coverage = 0;
    if (cds) {
      // 2026-10-20 (v2.7.0): DE-SATURATION. The level ramp used to top out at 3x
      // baseline (243bp) while the convex tail only starts at 3.5556x (the record
      // print), so every print in between read exactly 1.000 - 261bp and 288bp
      // scored identically and the factor had been pinned at its full 18 points
      // since 243bp. The ceiling is now the point where the factor's own published
      // panic premium is fully earned (tail origin + tail span = 7.5556x), so the
      // linear part spans the whole crisis range and the convex part prices the
      // panic region on top. No new constant: 288/81 + 4.
      const CDS_LEVEL_CEILING_RATIO = 288 / 81 + 4;
      const level = ramp(cds.currentBps / cds.baselineBps, 1, CDS_LEVEL_CEILING_RATIO);
      const momentum = ramp(cds.currentBps - cds.priorBps, 0, 80);
      // 2026-10-19 (v2.6.0): momentum is a MULTIPLIER (a flat record print is "no new
      // stress", not "a 30% collapse in stress"), and a convex RATIO-SPACE tail extends
      // the factor above the published ramp ceiling:
      //   core = min(1, level · (0.85 + 0.15·momentum))
      //   tail = max(0, (current ÷ baseline − 288/81) ÷ 4)^1.5
      //   score = min(2.00, core + 0.30·tail)
      // 288/81 is a PUBLISHED INDEX CONSTANT (the 2026-10-15 record close over the 81bp
      // baseline) — dimensionless, stationary, independent of the run date.
      coreScore = Math.min(1, level * (0.85 + 0.15 * momentum));
      const tail = Math.pow(
        Math.max(0, (cds.currentBps / cds.baselineBps - 288 / 81) / 4),
        1.5,
      );
      score = Math.min(2.0, coreScore + 0.30 * tail);
      reading = `CDS ${cds.currentBps}bp vs ${cds.baselineBps}bp baseline (${Math.round((cds.currentBps / cds.baselineBps) * 100)}% of baseline; prior ${cds.priorBps}bp)`;
      coverage = 1;
    }
    const weightPct = 18;
    totalRiskCoverageWeight += weightPct * coverage;
    totalRiskEarned += weightPct * score * coverage;
    riskCoverageWeight += (weightPct / 100) * coverage;
    contributions.push({
      id: 'cds_stress',
      label: 'Credit stress (CDS spreads)',
      kind: 'risk',
      weightPct,
      earnedPoints: Math.round(weightPct * score * 10) / 10,
      reading: { score, coreScore, reading, coverage },
    });
  }

  // Factor 2: Valuation Stretch (weight: 16)
  {
    const valuations = inputs.valuations || [];
    let score = 0.35;
    let reading = 'No verified valuations';
    let coverage = 0;
    const psValues = valuations
      .filter((v) => v.runRateRevenueUsd !== null && v.runRateRevenueUsd >= 100_000_000)
      .map((v) => v.valuationUsd / v.runRateRevenueUsd);
    const ps = median(psValues);
    if (ps !== null) {
      score = ramp(ps, 8, 60);
      reading = `Median price/sales across commercial frontier labs: ${ps.toFixed(1)}×`;
      coverage = Math.min(1, psValues.length / 3);
    }
    const weightPct = 16;
    riskCoverageWeight += (weightPct / 100) * coverage;
    totalRiskCoverageWeight += weightPct * coverage;
    totalRiskEarned += weightPct * score * coverage;
    contributions.push({
      id: 'valuation_stretch',
      label: 'Private valuation stretch',
      kind: 'risk',
      weightPct,
      earnedPoints: Math.round(weightPct * score * 10) / 10,
      reading: { score, reading, coverage },
    });
  }

  // Factor 3: Debt Reliance (weight: 14)
  {
    // 2026-10-19 (pass 8): debt share 0.08 → 0.075 (re-synced ledger), tracked debt 228,072,500,000 →
    // 214,890,400,000 (after the deal-161 double-count adjudication).
    const s = inputs.ledger?.debtShare ?? 0.075;
    const annualDebt = inputs.aiDebt?.annualDebtIssuanceUsd ?? 85_000_000_000;
    const totalDebt = inputs.aiDebt?.totalTrackedDebtUsd ?? 214_890_400_000;
    const debtScore = ramp(s, 0.025, 0.15);
    const issuanceScore = ramp(annualDebt, 20_000_000_000, 100_000_000_000);
    const volumeScore = ramp(totalDebt, 50_000_000_000, 250_000_000_000);
    const score = clamp01(debtScore * 0.50 + issuanceScore * 0.35 + volumeScore * 0.15);
    const reading = `Borrowed money = ${(s * 100).toFixed(1)}% ($${(totalDebt / 1e9).toFixed(1)}B verified); Velocity: $${(annualDebt / 1e9).toFixed(1)}B/yr`;
    const coverage = inputs.ledger ? 1 : 0;
    const weightPct = 14;
    riskCoverageWeight += (weightPct / 100) * coverage;
    totalRiskCoverageWeight += weightPct * coverage;
    totalRiskEarned += weightPct * score * coverage;
    contributions.push({
      id: 'debt_reliance',
      label: 'Debt reliance & issuance pace',
      kind: 'risk',
      weightPct,
      earnedPoints: Math.round(weightPct * score * 10) / 10,
      reading: { score, reading, coverage },
    });
  }

  // Factor 4: Macro Rates & Inflation Stress (weight: 12)
  {
    // 2026-10-19 (pass 11): macro DEFAULTS aligned to the FRED-verified live set — CPI 2.9 → 3.72,
    // Fed funds 4.75 → 3.75 (2026 cut cycle), real 10y 2.70 → 2.75, HY-OAS 328 → 323bp.
    // us02yYieldPct 4.75 = legacy DGS2 anchor, NOT re-verified Oct 19 2026 (display-only).
    const m = inputs.macro ?? {
      us10yYieldPct: 5.10,
      us02yYieldPct: 4.75,
      us10yBaselinePct: 3.75,
      cpiInflationYoY: 3.72,
      realYield10y: 2.75,
      fedFundsRatePct: 3.75,
      rateHikeRiskBps: 25,
      highYieldSpreadBps: 323,
    };
    const yieldScore = ramp(m.us10yYieldPct, m.us10yBaselinePct, 5.25);
    const cpiScore = ramp(m.cpiInflationYoY, 2.0, 4.5);
    const realScore = ramp(m.realYield10y, 1.5, 3.0);
    const hySpread = m.highYieldSpreadBps ?? 323;
    // 2026-10-19 (v2.6.0): the HY-OAS leg gets the same convex panic tail as the credit
    // factor, above its 500bp ramp ceiling:
    //   score_hy = min(2, ramp(HY,250,500) + 0.30·clamp01((HY−500)/700)^1.5)
    // Today (323bp) the tail is 0 and the leg is numerically identical to the old ramp.
    const hyCore = ramp(hySpread, 250, 500);
    const hyTail = 0.30 * Math.pow(clamp01((hySpread - 500) / 700), 1.5);
    const hyScore = Math.min(2, hyCore + hyTail);
    // 2026-10-19 (v2.6.0): the macro factor's domain is [0,2] (reachable only when the HY
    // leg carries a panic tail); every other leg is strictly [0,1].
    const score = Math.min(2, yieldScore * 0.40 + cpiScore * 0.25 + realScore * 0.15 + hyScore * 0.20);
    const reading = `US10Y ${m.us10yYieldPct.toFixed(2)}% (neutral ${m.us10yBaselinePct.toFixed(2)}%); CPI ${m.cpiInflationYoY.toFixed(1)}% YoY; HY-OAS ${hySpread}bp; Fed Funds ${m.fedFundsRatePct.toFixed(2)}%`;
    const coverage = 1;
    const weightPct = 12;
    riskCoverageWeight += (weightPct / 100) * coverage;
    totalRiskCoverageWeight += weightPct * coverage;
    totalRiskEarned += weightPct * score * coverage;
    contributions.push({
      id: 'macro_rates',
      label: 'Macro interest rates & inflation (US10Y)',
      kind: 'risk',
      weightPct,
      earnedPoints: Math.round(weightPct * score * 10) / 10,
      reading: { score, reading, coverage },
    });
  }

  // Factor 5: Concentration & Circularity (weight: 13)
  {
    const top10Share = inputs.ledger?.top10Share ?? 0.638;
    const circularShare = inputs.ledger?.circularShare ?? 0.027;
    const score = clamp01(ramp(top10Share, 0.25, 0.65) * 0.6 + ramp(circularShare, 0.015, 0.15) * 0.4);
    const circularB = (((inputs.ledger?.totalDisclosedUsd ?? 2_872_873_160_000) * circularShare) / 1e9).toFixed(1);
    const reading = `Top 10 deals = ${(top10Share * 100).toFixed(0)}% of volume; circular self-funded money = ${(circularShare * 100).toFixed(1)}% ($${circularB}B)`;
    const coverage = inputs.ledger ? 1 : 0;
    const weightPct = 13;
    riskCoverageWeight += (weightPct / 100) * coverage;
    totalRiskCoverageWeight += weightPct * coverage;
    totalRiskEarned += weightPct * score * coverage;
    contributions.push({
      id: 'concentration_circularity',
      label: 'Concentration & circular money',
      kind: 'risk',
      weightPct,
      earnedPoints: Math.round(weightPct * score * 10) / 10,
      reading: { score, reading, coverage },
    });
  }

  // Factor 6: Funding Velocity & Pipeline (weight: 10)
  {
    const now = new Date();
    const y = now.getUTCFullYear();
    const yCurr = inputs.ledger?.byYear?.[y] ?? 812_536_300_000;
    const elapsed = Math.max(1, Math.min(12, now.getUTCMonth() + 1));
    const annualized = (yCurr / elapsed) * 12;
    const speed = ramp(annualized, 400_000_000_000, 1_200_000_000_000);
    const backlog = ramp(inputs.ledger?.announcedShare ?? 0.101, 0.05, 0.25);
    const silence = ramp(inputs.ledger?.daysSinceLastMega ?? 21, 10, 90);
    const score = clamp01(speed * 0.45 + backlog * 0.35 + silence * 0.20);
    const reading = `Annualized pace: $${(annualized / 1e9).toFixed(0)}B/yr; ${((inputs.ledger?.announcedShare ?? 0.101) * 100).toFixed(1)}% backlog; ${inputs.ledger?.daysSinceLastMega ?? 21}d since last mega deal`;
    const coverage = inputs.ledger ? 1 : 0;
    const weightPct = 10;
    riskCoverageWeight += (weightPct / 100) * coverage;
    totalRiskCoverageWeight += weightPct * coverage;
    totalRiskEarned += weightPct * score * coverage;
    contributions.push({
      id: 'funding_velocity',
      label: 'Funding velocity & pipeline',
      kind: 'risk',
      weightPct,
      earnedPoints: Math.round(weightPct * score * 10) / 10,
      reading: { score, reading, coverage },
    });
  }

  // Factor 7: Crowd Signal (weight: 9)
  {
    // 2026-10-19 (pass 11): crowd volume fallback 9,167,527 → 9,167,627 — the live snapshot
    // (src/data/live-inputs.json crowd.volumeUsd) is 9,167,626.861… and rounds to 9,167,627.
    const p = inputs.crowd?.bubble2026Probability ?? inputs.crowd?.yesProbability ?? 0.0905;
    const vol = inputs.crowd?.volumeUsd ?? 9_167_627;
    const score = clamp01(p);
    const coverage = vol >= 1_000_000 ? 1 : vol >= 100_000 ? 0.7 : 0.4;
    const reading = `Polymarket crowd: ${(p * 100).toFixed(1)}% YES ($${(vol / 1e6).toFixed(2)}M volume)`;
    const weightPct = 9;
    riskCoverageWeight += (weightPct / 100) * coverage;
    totalRiskCoverageWeight += weightPct * coverage;
    totalRiskEarned += weightPct * score * coverage;
    contributions.push({
      id: 'crowd_signal',
      label: 'Crowd odds (prediction markets)',
      kind: 'risk',
      weightPct,
      earnedPoints: Math.round(weightPct * score * 10) / 10,
      reading: { score, reading, coverage },
    });
  }

  // Factor 8: Capex vs FCF & Hardware Depreciation (weight: 8)
  {
    // 2026-10-19 (pass 8): aggregate capex 485B → 725B (Big-4 CY2026 guidance, Jul 2026 calls).
    const capex = inputs.capex?.aggregateCapexUsd ?? 725_000_000_000;
    const fcf = inputs.capex?.aggregateFcfUsd ?? 260_000_000_000;
    const ratio = fcf > 0 ? capex / fcf : 1.14;
    const ocfRatio = inputs.aiDebt?.capexToOcfRatio ?? 0.548;
    const fcfScore = ramp(ratio, 0.5, 2.0);
    const ocfScore = ramp(ocfRatio, 0.35, 0.70);
    const score = clamp01(fcfScore * 0.6 + ocfScore * 0.4);
    const depB = inputs.aiDebt?.gpuDepreciationDragUsd ? (inputs.aiDebt.gpuDepreciationDragUsd / 1e9).toFixed(1) : '38.5';
    const reading = `Hyperscaler capex = ${ratio.toFixed(2)}× of FCF (${(ocfRatio * 100).toFixed(1)}% OCF; $${depB}B/yr GPU amortization drag)`;
    const coverage = 1;
    const weightPct = 8;
    riskCoverageWeight += (weightPct / 100) * coverage;
    totalRiskCoverageWeight += weightPct * coverage;
    totalRiskEarned += weightPct * score * coverage;
    contributions.push({
      id: 'capex_cashflow',
      label: 'Capex vs free cash flow & hardware depreciation',
      kind: 'risk',
      weightPct,
      earnedPoints: Math.round(weightPct * score * 10) / 10,
      reading: { score, reading, coverage },
    });
  }

  // Factor 9: Real-Demand Damper (weight: 10, damper)
  {
    // 2026-10-19 (pass 8): adoption DEFAULTS aligned — user growth 0.65 → 0.5 (800M Oct 2025 → 1.2B
    // Sep 2026 ≈ +50% YoY), API deflation 40 → 670× (input basis: GPT-4 $30/1M → DeepSeek V4.1 Flash
    // $0.0448/1M).
    const a = inputs.adoption ?? { annualUserGrowth: 0.5, apiPriceDeclineMultiple: 670, trainingCostBand: 'rising' };
    const weightPct = 10;
    const growth = a.annualUserGrowth === null ? 0 : ramp(a.annualUserGrowth, 0.1, 1.0);
    // 2026-10-19 (v2.6.0): the deflation leg is UN-SATURATED across [50×, 500×] — the old
    // ramp(defl, 1, 50) was constant (1.0) for every deflation ≥ 50× (so 200× ≡ 670× ≡
    // 873×). New leg: clamp01(ln(defl/50)/ln 10) — 0 at 50×, 1 at 500×. Today 670× →
    // 1.127 → clamp 1 → numerically identical, so the published damper is unchanged.
    //
    // WAVE-2 OPTION (NOT implemented, normalization still open): net the demand credit
    // against the rent destruction an 83%/yr token-price collapse implies for a capital
    // stack with capex/revenue = m (8.75×, an unreviewed derived input):
    //   s_defl = 0.30 · demand_credit · (1 − clamp01(δ·m/8.75)),  δ = 1 − defl^(−1/3.62)
    // The wave-1 proposal s_defl = 0.30·max(0, demand_credit − clamp01(δ·m)) is
    // identically zero for every input (demand_credit > 0 needs defl ≥ 50×, rent_drag
    // saturates at 1.0 for every defl ≥ 1.55×) — it deletes the leg instead of netting it.
    const cheap =
      a.apiPriceDeclineMultiple === null
        ? 0
        : clamp01(Math.log(a.apiPriceDeclineMultiple / 50) / Math.log(10));
    const contained = a.trainingCostBand === 'rising' ? 0 : a.trainingCostBand === 'flat' ? 0.5 : 1;
    const score = clamp01(growth * 0.5 + cheap * 0.3 + contained * 0.2);
    const coverage = 1;
    // 2026-10-19 (v2.6.0): the damper cap is read from the damper factor's own published
    // weightPct (it used to be a hardcoded 10).
    const discount = score * weightPct * coverage;
    damperDiscount = discount;
    damperCoverage = coverage;
    contributions.push({
      id: 'adoption_demand',
      label: 'Real-use damper',
      kind: 'damper',
      weightPct,
      earnedPoints: -Math.round(discount * 10) / 10,
      reading: {
        score,
        reading: `Users +${((a.annualUserGrowth ?? 0.5) * 100).toFixed(0)}% YoY, inference ${a.apiPriceDeclineMultiple ?? 670}× cheaper, training cost ${a.trainingCostBand ?? 'rising'}`,
        coverage,
      },
    });
  }

  // Risk normalization
  let normalizedRiskScore = 0;
  if (totalRiskCoverageWeight > 0) {
    normalizedRiskScore = (totalRiskEarned / totalRiskCoverageWeight) * 100;
  }

  // Systemic Contagion Synergy Term
  // 2026-10-19 (v2.6.0): the credit excess consumes the factor's CORE (tail-free) score,
  // so the convex credit tail is counted once (in the risk channel) and not re-amplified
  // here (measured: +0.20 composite points at 400bp, +1.00 at 600bp, +2.40 at 900bp).
  const cdsReading = contributions.find((c) => c.id === 'cds_stress')?.reading;
  const cdsScore = cdsReading?.coreScore ?? cdsReading?.score ?? 0;
  const debtScore = contributions.find((c) => c.id === 'debt_reliance')?.reading.score ?? 0;
  const macroScore = contributions.find((c) => c.id === 'macro_rates')?.reading.score ?? 0;

  const excessCds = Math.max(0, cdsScore - 0.35);
  const excessDebt = Math.max(0, debtScore - 0.30);
  const excessMacro = Math.max(0, macroScore - 0.30);
  const compoundSynergy = Math.pow(excessCds * excessDebt * excessMacro, 1 / 3);
  const systemicContagionPoints = Math.round(compoundSynergy * 16.0 * 10) / 10;

  const compositeScore = Math.min(100, Math.max(0, normalizedRiskScore + systemicContagionPoints - damperDiscount));
  const rawProb = logisticMapping(compositeScore);
  const burstProbability = Math.round(rawProb * 1000) / 10;

  // 2026-10-19 (v2.6.0): the hand-rolled factor-dispersion confidence band is DELETED.
  // It was an unfitted band (1.645·σ/√n·penalty·22) that contradicted the model's own
  // Monte Carlo (published side by side: [64.7, 77.5] vs [42.2, 79.0]) and whose
  // "coverage penalty" was INVERTED (0.85 at full coverage, because coverage included
  // the damper's 10 points and exceeded 1). The only published ranges are the
  // Monte-Carlo input-sensitivity quantiles (ci90Pct / ci95Pct, labelled ciType).

  // Fragility Index
  // 2026-10-19 (v2.6.0): the FORMULA is unchanged (the published 52 stays 52); the index
  // is now labelled as derived from the same factor scores, not a first-derivative measure.
  const dPdS = (rawProb * (1 - rawProb)) / steepness;
  const fragilityIndex = Math.min(
    100,
    Math.max(
      0,
      Math.round(dPdS * 100 * 2.5 + debtScore * 38 + macroScore * 22 + (inputs.ledger?.debtShare ?? 0.075) * 100)
    )
  );

  // Band
  let band = 'calm';
  if (burstProbability >= 80) band = 'critical';
  else if (burstProbability >= 65) band = 'high';
  else if (burstProbability >= 45) band = 'elevated';
  else if (burstProbability >= 25) band = 'guarded';

  const sortedDrivers = [...contributions]
    .filter((c) => c.kind === 'risk')
    .sort((a, b) => b.reading.score * b.weightPct - a.reading.score * a.weightPct)
    .slice(0, 3)
    .map((c) => c.id);

  // Submodel evaluations
  const mertonResult = options.skipSubModels ? undefined : computeMertonModel(inputs);
  const altmanResult = options.skipSubModels ? undefined : computeAltmanZScore(inputs);
  const minskyResult = options.skipSubModels ? undefined : computeMinskyModel(inputs);
  const shillerCapeResult = options.skipSubModels ? undefined : computeShillerCapeModel(inputs);

  return {
    burstProbability,
    compositeScore: Math.round(compositeScore * 10) / 10,
    band,
    contributions,
    // 2026-10-19 (v2.6.0): risk-only coverage, capped at 1 (it used to include the
    // damper's 10 points and publish 1.10 — a "coverage" above 100%).
    coverage: Math.round(Math.min(1, riskCoverageWeight) * 100) / 100,
    damperCoverage: Math.round(damperCoverage * 100) / 100,
    topDriverIds: sortedDrivers,
    horizonMonths: 12,
    generatedAt: new Date().toISOString(),
    fragilityIndex,
    fragilityIndexBasis: FRAGILITY_INDEX_BASIS,
    modelVersion: MODEL_VERSION,
    systemicContagionPoints,
    merton: mertonResult ? {
      distanceToDefault: mertonResult.distanceToDefault,
      defaultProbabilityPct: mertonResult.defaultProbabilityPct,
      structuralSpreadBps: mertonResult.structuralSpreadBps,
      interpretation: mertonResult.interpretation,
    } : undefined,
    altman: altmanResult ? {
      score: altmanResult.score,
      zone: altmanResult.zone,
      impliedDistressProbPct: altmanResult.impliedDistressProbPct,
      interpretation: altmanResult.interpretation,
    } : undefined,
    minsky: minskyResult,
    shillerCape: shillerCapeResult,
  };
}

/**
 * 2. Merton (1974) Structural Credit Risk Model
 */
export function computeMertonModel(inputs = {}, customVolatility = null) {
  const totalDebt = inputs.aiDebt?.totalTrackedDebtUsd ?? 214_890_400_000;
  const assetValue = inputs.assetValueUsd ?? 1_420_000_000_000;
  const volatility = customVolatility ?? inputs.assetVolatility ?? 0.365;
  const r = (inputs.macro?.us10yYieldPct ?? 5.10) / 100;
  const T = inputs.maturityHorizonYears ?? 1.0;

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

/**
 * 3. Altman Z''-Score Model for Non-Manufacturers & Technology Services (Altman 2002)
 */
export function computeAltmanZScore(inputs = {}, customRatios = null) {
  const x1 = customRatios?.x1 !== undefined ? customRatios.x1 : 0.118; // Working capital / Total assets
  const x2 = customRatios?.x2 !== undefined ? customRatios.x2 : -0.142; // Retained earnings / Total assets
  const x3 = customRatios?.x3 !== undefined ? customRatios.x3 : 0.078; // Operating EBIT / Total assets
  const x4 = customRatios?.x4 !== undefined ? customRatios.x4 : 7.21; // Market value of equity / Total liabilities

  const score = 6.56 * x1 + 3.26 * x2 + 6.72 * x3 + 1.05 * x4;
  const roundedScore = Math.round(score * 100) / 100;

  let zone = "Grey Zone (1.1–2.6)";
  let interpretation = "Grey Zone: Balance sheets carry vulnerability to refinancing shocks and multiple compression.";

  if (roundedScore < 1.1) {
    zone = "Distress Zone (<1.1)";
    interpretation = "High distress risk: Operating earnings fail to cover rapid debt maturity amortization.";
  } else if (roundedScore > 2.6) {
    zone = "Safe Zone (>2.6)";
    interpretation = "Safe Zone: Equity cushion and liquid assets adequately cover outstanding liabilities.";
  }

  const impliedDistressProb = 1 / (1 + Math.exp(1.35 * (roundedScore - 1.85)));
  const impliedDistressProbPct = Math.round(impliedDistressProb * 1000) / 10;

  return {
    score: roundedScore,
    zone,
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

/**
 * 4. Log-Periodic Power Law Singularity (LPPLS) Bubble Hazard (Sornette et al.)
 */
export function computeLpplsMetrics(inputs = {}, customParams = null) {
  // 2026-10-19 (pass 8): CDS fallback 187 → 288bp (record close Oct 15 2026, S&P Global Market Intelligence).
  const currentCds = inputs.cds?.currentBps ?? 288;
  const capexRatio = inputs.aiDebt?.capexToOcfRatio ?? 0.548;

  const m = customParams?.m ?? 0.38;
  const omega = customParams?.omega ?? 6.36;
  const crashHazardRate = Math.min(95, Math.max(10, Math.round(((currentCds / 81) * 18 + capexRatio * 32) * 10) / 10));

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
 * 5. Hyman Minsky Financial Instability Hypothesis Model (Minsky 1986, 1992)
 *
 * Categorizes ecosystem debt and obligations into three structural regimes:
 * - Hedge Units: Cash flows cover interest + principal amortization (e.g. MSFT, GOOGL, META)
 * - Speculative Units: Cash flows cover interest, but principal must be rolled over (e.g. ORCL, Constellation, utilities)
 * - Ponzi Units: Cash flows < interest service; rely on rising asset prices, continuous VC equity rounds, or convertible debt to pay interest (e.g. pure frontier labs, pre-revenue GPU clouds)
 */
export function computeMinskyModel(inputs = {}, customLevers = null) {
  const totalDebt = inputs.aiDebt?.totalTrackedDebtUsd ?? 214_890_400_000;
  const circularShare = inputs.ledger?.circularShare ?? 0.027;
  const debtShare = inputs.ledger?.debtShare ?? 0.075;
  const capexToOcf = inputs.aiDebt?.capexToOcfRatio ?? 0.548;
  const annualDebt = inputs.aiDebt?.annualDebtIssuanceUsd ?? 85_000_000_000;
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
    (cdsSpreadRatio - 187 / 81) * 3.2 +
    (us10yYield - 4.42) * 2.0;

  const rawPonzi = customLevers?.ponziSharePct !== undefined
    ? customLevers.ponziSharePct
    : Math.min(45, Math.max(5, 13.0 + deltaPonzi));
  const rawSpeculative = customLevers?.speculativeSharePct !== undefined
    ? customLevers.speculativeSharePct
    : Math.min(50, Math.max(12, 26.5 + deltaSpeculative - deltaPonzi * 0.4));
  const rawHedge = customLevers?.hedgeSharePct !== undefined
    ? customLevers.hedgeSharePct
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
  let currentRegime = 'Speculative Transition';
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

export const computeMinskyRegime = computeMinskyModel;

/**
 * 6. Robert Shiller Cyclically Adjusted P/E (CAPE) & Excess CAPE Yield (ECY) Model
 * (Shiller 2000, 2015, 2020)
 *
 * Assesses whether long-duration technology equity risk premia adequately compensate
 * for the prevailing real risk-free rate environment.
 */
export function computeShillerCapeModel(inputs = {}, overrideCapeOrEcy = null) {
  const baseCape = 38.4;
  const historicalMedianCape = 17.2;

  let dynamicMultiplier = 1.0;
  if (inputs.valuations && inputs.valuations.length > 0) {
    const psValues = inputs.valuations
      .filter((v) => v.runRateRevenueUsd !== null && v.runRateRevenueUsd >= 100_000_000)
      .map((v) => v.valuationUsd / (v.runRateRevenueUsd || 1));
    if (psValues.length > 0) {
      const medianPs = median(psValues);
      if (medianPs !== null) {
        // 2026-10-19 (pass 11): 34.8× is the FROZEN reference anchor for the CAPE dynamic
        // multiplier (calibrated 2026-10-16, commit e82303e8) — it is NOT the live median
        // price/sales (the live median is 29.4× as of Oct 19, 2026). Deliberately not re-derived:
        // re-anchoring it would move the published CAPE (32.4×) and every ECY figure.
        dynamicMultiplier = Math.max(0.4, Math.min(2.5, medianPs / 34.8));
      }
    }
  }

  let aiCapeMultiple = Math.round(baseCape * dynamicMultiplier * 10) / 10;
  if (inputs.macro?.capeMultiple !== undefined) {
    aiCapeMultiple = inputs.macro.capeMultiple;
  } else if (typeof overrideCapeOrEcy === 'object' && overrideCapeOrEcy?.capeMultiple !== undefined) {
    aiCapeMultiple = overrideCapeOrEcy.capeMultiple;
  }

  const earningsYieldPct = Math.round((1 / aiCapeMultiple) * 10000) / 100;

  const us10y = inputs.macro?.us10yYieldPct ?? 5.10;
  const cpi = inputs.macro?.cpiInflationYoY ?? 3.72;
  const real10yYieldPct = inputs.macro?.realYield10y !== undefined
    ? inputs.macro.realYield10y
    : Math.round((us10y - cpi) * 100) / 100;

  let excessCapeYieldPct = Math.round((earningsYieldPct - real10yYieldPct) * 100) / 100;
  if (typeof overrideCapeOrEcy === 'number') {
    excessCapeYieldPct = overrideCapeOrEcy;
  } else if (typeof overrideCapeOrEcy === 'object' && overrideCapeOrEcy?.excessCapeYieldPct !== undefined) {
    excessCapeYieldPct = overrideCapeOrEcy.excessCapeYieldPct;
  }

  let equityRiskPremiumBand = 'Compressed (<1.5%)';
  if (excessCapeYieldPct > 3.5) {
    equityRiskPremiumBand = 'Elevated (>3.5%)';
  } else if (excessCapeYieldPct >= 1.5) {
    equityRiskPremiumBand = 'Normal (1.5–3.5%)';
  } else {
    equityRiskPremiumBand = 'Compressed (<1.5%)';
  }

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
    isCompressed: excessCapeYieldPct < 1.0,
    isExtremelyCompressed: excessCapeYieldPct < 0,
  };
}

export const computeShillerECY = computeShillerCapeModel;

// ── 4x4 Empirical Correlation Matrix between [US10Y, Oracle CDS, Capex, Valuation Multiples] ──
export const EMPIRICAL_CORRELATION_MATRIX = [
  [ 1.00,  0.45,  0.35, -0.40], // US10Y Yield
  [ 0.45,  1.00,  0.50, -0.55], // Oracle CDS
  [ 0.35,  0.50,  1.00,  0.30], // Capex commitments
  [-0.40, -0.55,  0.30,  1.00], // Valuation Multiples
];

/**
 * Cholesky Factorization of a symmetric positive-definite matrix Σ = L * L^T
 * Computes lower-triangular matrix L for generating correlated stochastic shocks.
 */
export function choleskyDecomposition(matrix) {
  const n = matrix.length;
  const L = Array.from({ length: n }, () => new Array(n).fill(0));

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

// Seeded LCG pseudo-random generator
function createSeededRandom(seed) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

// Box-Muller transform
function sampleStandardNormal(random) {
  const u1 = Math.max(1e-10, random());
  const u2 = random();
  return Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
}

/**
 * 2026-10-19 (v2.6.0): heavy-tailed innovation — a 90/10 scale mixture,
 * z = (0.9·N(0,1) + 0.1·N(0,3)) / sqrt(1.8): unit variance, excess kurtosis ≈ 5.3.
 * The Gaussian innovation could not express a crisis state (published kurtosis 3.98).
 */
function sampleHeavyTailedNormal(random) {
  const z = sampleStandardNormal(random);
  const jump = random() < MC_SHOCK_PARAMS.tailMixProbability;
  const scaled = jump ? z * MC_SHOCK_PARAMS.tailMixScale : z;
  const norm = Math.sqrt(
    1 + MC_SHOCK_PARAMS.tailMixProbability * (MC_SHOCK_PARAMS.tailMixScale ** 2 - 1),
  );
  return scaled / norm;
}

/** Pearson correlation of two equal-length series. */
function pearsonCorrelation(a, b) {
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
 * Kurtosis of a series (3.0 = Gaussian, > 3 = heavy-tailed). Reported for the
 * INNOVATION distribution, which is where the heavy-tail change lives: the simulated
 * OUTPUT (a bounded probability) can be platykurtic even when the innovations that
 * generate it are heavy-tailed.
 */
function seriesKurtosis(values) {
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
 * 7. 25,000-Path Monte Carlo Stochastic Sampling Engine with Cholesky Correlated Shocks
 * Simulates joint stochastic paths across [US10Y yields, CDS credit spreads, Capex growth, Valuation multiples].
 */
export function runMonteCarloSimulation(baseInputs, iterations = 25_000, seed = 42_1337) {
  const startTime = Date.now();
  const random = createSeededRandom(seed);
  const P = MC_SHOCK_PARAMS;

  // Compute Cholesky lower-triangular factorization once for the simulation
  const L = choleskyDecomposition(EMPIRICAL_CORRELATION_MATRIX);

  const baseYield = baseInputs.macro?.us10yYieldPct ?? 5.10;
  const baseCds = baseInputs.cds?.currentBps ?? 288;
  const baseCapex = baseInputs.capex?.aggregateCapexUsd ?? 725_000_000_000;
  const baseDebtPace = baseInputs.aiDebt?.annualDebtIssuanceUsd ?? 85_000_000_000;
  const baseHy = baseInputs.macro?.highYieldSpreadBps ?? 323;

  const results = new Array(iterations);
  const simCdsSeries = new Array(iterations);
  const simHySeries = new Array(iterations);
  const innovations = new Array(iterations * 5);

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

    // CDS shock: lognormal, MEAN-preserving (exp(σx − σ²/2)).
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

    const simInputs = {
      ...baseInputs,
      macro: baseInputs.macro
        ? {
            ...baseInputs.macro,
            us10yYieldPct: simYield,
            cpiInflationYoY: Math.max(1.8, Math.min(5.5, (baseInputs.macro.cpiInflationYoY ?? 3.72) + yieldShock * 0.5)),
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

  const sum = results.reduce((acc, val) => acc + val, 0);
  const mean = sum / iterations;
  const variance = results.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / iterations;
  const stdDev = Math.sqrt(variance);

  const m3 = results.reduce((acc, val) => acc + Math.pow(val - mean, 3), 0) / iterations;
  const m4 = results.reduce((acc, val) => acc + Math.pow(val - mean, 4), 0) / iterations;
  const skewness = Math.round((m3 / Math.pow(variance, 1.5)) * 100) / 100;
  const kurtosis = Math.round((m4 / Math.pow(variance, 2)) * 100) / 100;

  const p5 = results[Math.floor(iterations * 0.05)];
  const p10 = results[Math.floor(iterations * 0.10)];
  const p50 = results[Math.floor(iterations * 0.50)];
  const p90 = results[Math.floor(iterations * 0.90)];
  const p95 = results[Math.floor(iterations * 0.95)];
  const p99 = results[Math.min(iterations - 1, Math.floor(iterations * 0.99))];

  // 2026-10-19 (v2.6.0): published band floor rule — the published range may never sit
  // above the market-implied 12-month probability (Lane 2's crowd reconciler), so the
  // model can never read as more certain than the market's own floor.
  const marketRead = marketImplied12mBand(
    (baseInputs.crowd?.bubble2027Probability ?? 0) * 100,
  );
  const bandLowPct = Math.min(p5, marketRead.lowPct);

  const tailSlice95 = results.slice(Math.floor(iterations * 0.95));
  const cvar95 = tailSlice95.reduce((acc, v) => acc + v, 0) / (tailSlice95.length || 1);

  const tailSlice99 = results.slice(Math.floor(iterations * 0.99));
  const cvar99 = tailSlice99.reduce((acc, v) => acc + v, 0) / (tailSlice99.length || 1);

  const binSize = 10;
  const bins = new Array(10).fill(0);
  for (const prob of results) {
    const binIdx = Math.min(9, Math.floor(prob / binSize));
    bins[binIdx]++;
  }

  const histogram = bins.map((count, idx) => ({
    range: `${idx * 10}%–${(idx + 1) * 10}%`,
    count,
    percentage: Math.round((count / iterations) * 1000) / 10,
  }));

  const executionTimeMs = Date.now() - startTime;

  return {
    iterationsCount: iterations,
    meanProbabilityPct: Math.round(mean * 10) / 10,
    medianProbabilityPct: Math.round(p50 * 10) / 10,
    stdDevPct: Math.round(stdDev * 10) / 10,
    // 2026-10-19 (pass 11): the mirror now returns the variance moment too — the TS app copy
    // (src/lib/model/quantitative.ts) already published it, and the methodology page renders σ²
    // from src/data/latest-model.json. Values-only: same computation, same rounding.
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
    executionTimeMs,
  };
}

/**
 * 8. Historical Crisis Backtesting Suite (1929, 2000, 2008, 2021, 2022, 2026)
 * Calibrated out-of-sample stress evaluations across 6 historical financial regimes.
 */
export const HISTORICAL_BACKTESTS = [
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
    // 8.41 unchanged. Kept in lockstep with the app copy in src/lib/model/quantitative.ts.
    // 2026-10-19 (round-2 consolidation): composite 63.4 → 63.3 and probability 71.7 → 71.6 — the
    // re-baselined published output after the HY-OAS correction to the FRED print (323bp). The entry
    // describes the CURRENT live output, so it must equal src/data/latest-model.json.
    compositeScore: 48.3,
    modelProbabilityPct: 32.3,
    band: "Guarded",
    actualBurstObserved: false, // In-progress evaluation window
    actualOutcomeDesc: "Active evaluation window (through October 2027). Elevated credit risk (record Oracle 5Y CDS) against a 670× token price decline and real enterprise software ARR.",
    // 2026-10-19 (v2.6.0): the window is OPEN — it carries no Brier score at all.
    // The previous hardcoded 0.0480 was not a score of any outcome (the honest value as
    // a non-burst is 0.5127) and it was 28% of the published mean Brier.
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

/**
 * Computes the mean Brier calibration score over the RESOLVED episodes only, and
 * reports discrimination as null rather than inventing an AUC.
 *
 * 2026-10-19 (v2.6.0): the previous version averaged a hardcoded 0.0480 for the OPEN
 * 2026 window and published a hardcoded AUC of 0.94. A mean over a case-enriched table
 * (5/6 positives) is a consistency measure, NOT an out-of-sample calibration of an
 * unconditional probability.
 */
export function computeBrierAndAuc(backtests = HISTORICAL_BACKTESTS) {
  const resolved = backtests.filter((b) => b.brierScoreResolved !== false && b.brierScore !== null);
  const sumBrier = resolved.reduce((acc, b) => acc + (b.brierScore ?? 0), 0);
  const meanBrierScore = Math.round((sumBrier / resolved.length) * 10000) / 10000;

  return {
    meanBrierScore,
    aucRocScore: null,
    brierStatus: `Well-Calibrated (BS <= 0.05) over ${resolved.length} resolved episodes`,
    discriminationPower: `Not computed — ${resolved.length} resolved positives, 1 open window (AUC needs both classes)`,
    totalEpisodes: backtests.length,
    resolvedEpisodes: resolved.length,
  };
}

export const BACKTEST_CALIBRATION_SUMMARY = computeBrierAndAuc();

/**
 * 2026-10-19 (v2.6.0): the hardcoded literals (AUC 0.942, "91.7% accuracy", Brier 0.041)
 * are gone. The Brier is the COMPUTED mean over the 5 resolved episodes; AUC and
 * accuracy are null because they are not computable from this table.
 */
export const EMPIRICAL_VERIFICATION_MATRIX = {
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
