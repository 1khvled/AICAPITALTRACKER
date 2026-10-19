#!/usr/bin/env node

/**
 * AI Capital Tracker — Quantitative Algorithm Test Suite & Empirical Verification
 * 
 * Implements 10 mathematical, empirical, and statistical invariant tests:
 * 1. Brier Calibration & Historical Out-of-Sample Score (BS <= 0.050 across 1929, 2000, 2008, 2021, 2022, 2026)
 * 2. Merton (1974) Structural Distance-to-Default Consistency (DD > 0, Phi(-DD) in [0,1], monotonicity)
 * 3. Altman Z''-Score (2002) Zone Boundary Transitions (Formula check, Distress < 1.1, Grey 1.1-2.6, Safe > 2.6)
 * 4. Minsky Financial Instability Regime Partition (Hedge + Speculative + Ponzi = 100%, Fragility in [0, 100])
 * 5. Robert Shiller Excess CAPE Yield (ECY) Model (ECY = 1/CAPE - Real Yield, compression thresholds)
 * 6. Sornette LPPLS Singularity Model (m in [0.1, 0.9], omega > 0, hazard rate in [10%, 95%])
 * 7. Monte Carlo 25,000-Path Convergence & Cholesky Stability (SE <= 0.25%, VaR 95% > Median, CVaR >= VaR)
 * 8. Greek Sensitivities & Partial Derivatives (dP/dCDS > 0, dP/dUS10Y > 0, dP/dDeflation < 0)
 * 9. Honest Degradation & Coverage Renormalization (Missing factors gracefully rescale weights, no NaN/inf)
 * 10. Extreme Stress Invariant Tests (1970s inflation, Lehman freeze, down-rounds, bounds in [0%, 100%])
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  evaluateBubbleModel,
  computeMertonModel,
  computeAltmanZScore,
  computeLpplsMetrics,
  computeMinskyRegime,
  computeShillerECY,
  runMonteCarloSimulation,
  choleskyDecomposition,
  EMPIRICAL_CORRELATION_MATRIX,
  HISTORICAL_BACKTESTS,
  normalCdf,
} from './lib/quantitative-bubble-model.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

// ANSI Terminal Colors & Styling
const c = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  yellow: '\x1b[33m',
  magenta: '\x1b[35m',
  blue: '\x1b[34m',
  gray: '\x1b[90m',
  bgGreen: '\x1b[42m\x1b[30m',
  bgRed: '\x1b[41m\x1b[37m',
  bgBlue: '\x1b[44m\x1b[37m',
};

// Institutional Baseline Model Inputs
const BASELINE_INPUTS = {
  cds: {
    currentBps: 187,
    baselineBps: 81,
    priorBps: 155,
    otherBps: 135,
    note: 'Reuters & ICE Fixed Income 5Y USD CDS on Oracle (AI debt anchor), as of Sep-Oct 2026',
  },
  valuations: [
    { company: 'OpenAI', valuationUsd: 950_000_000_000, runRateRevenueUsd: 50_000_000_000 },
    { company: 'Anthropic', valuationUsd: 2_000_000_000_000, runRateRevenueUsd: 47_000_000_000 },
    { company: 'Databricks', valuationUsd: 190_000_000_000, runRateRevenueUsd: 7_000_000_000 },
    { company: 'SpaceX / xAI', valuationUsd: 250_000_000_000, runRateRevenueUsd: 500_000_000 },
    { company: 'Mistral AI', valuationUsd: 24_000_000_000, runRateRevenueUsd: 450_000_000 },
    { company: 'Scale AI', valuationUsd: 29_000_000_000, runRateRevenueUsd: 1_100_000_000 },
    { company: 'Cohere', valuationUsd: 7_000_000_000, runRateRevenueUsd: 250_000_000 },
    { company: 'Perplexity AI', valuationUsd: 20_000_000_000, runRateRevenueUsd: 500_000_000 },
  ],
  ledger: {
    totalDisclosedUsd: 2_810_757_802_026,
    byYear: { 2023: 26_345_000_000, 2024: 295_235_000_000, 2025: 1_719_997_500_000, 2026: 769_180_302_026 },
    debtShare: 0.07,
    computeContractShare: 0.28,
    top10Share: 0.665,
    circularShare: 0.028,
    announcedShare: 0.127,
    daysSinceLastMega: 14,
  },
  crowd: {
    yesProbability: 0.076,
    bubble2026Probability: 0.076,
    bubble2027Probability: 0.155,
    volumeUsd: 2_443_553,
  },
  adoption: {
    topProductUsers: 350_000_000,
    annualUserGrowth: 0.65,
    apiPriceDeclineMultiple: 40,
    trainingCostBand: 'rising',
  },
  capex: {
    aggregateCapexUsd: 485_000_000_000,
    aggregateFcfUsd: 260_000_000_000,
  },
  macro: {
    us10yYieldPct: 5.10,
    us02yYieldPct: 4.75,
    us10yBaselinePct: 3.75,
    cpiInflationYoY: 2.9,
    fedFundsRatePct: 4.75,
    rateHikeRiskBps: 25,
    realYield10y: 2.70,
    highYieldSpreadBps: 328,
    capeMultiple: 35.8,
  },
  aiDebt: {
    annualDebtIssuanceUsd: 85_000_000_000,
    totalTrackedDebtUsd: 196_822_500_000,
    capexToOcfRatio: 0.548,
    gpuDepreciationDragUsd: 38_500_000_000,
    capexToRevenueMultiple: 8.75,
  },
};

// Test Execution State
const testResults = [];

function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

async function runTest(id, name, description, testFn) {
  const startTime = performance.now();
  try {
    const details = await testFn();
    const durationMs = Math.round((performance.now() - startTime) * 10) / 10;
    testResults.push({
      id,
      name,
      description,
      status: 'PASS',
      durationMs,
      details,
    });
  } catch (err) {
    const durationMs = Math.round((performance.now() - startTime) * 10) / 10;
    testResults.push({
      id,
      name,
      description,
      status: 'FAIL',
      durationMs,
      error: err.message,
    });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. BRIER CALIBRATION & HISTORICAL OUT-OF-SAMPLE SCORE
// ─────────────────────────────────────────────────────────────────────────────
await runTest(
  1,
  'Brier Calibration & Historical Out-of-Sample Score',
  'Evaluates calibration across 1929, 2000, 2008, 2021, 2022, 2026. Asserts BS <= 0.050',
  async () => {
    assert(Array.isArray(HISTORICAL_BACKTESTS), 'HISTORICAL_BACKTESTS must be an array');
    assert(HISTORICAL_BACKTESTS.length >= 6, `Expected at least 6 historical episodes, found ${HISTORICAL_BACKTESTS.length}`);

    // Verify all 6 specific eras are present
    const expectedIds = ['great-crash-1929', 'dot-com-2000', 'gfc-lehman-2007', 'zirp-saas-2021', 'fed-shock-2022', 'ai-superstructure-2026'];
    for (const expectedId of expectedIds) {
      const match = HISTORICAL_BACKTESTS.find(b => b.id.includes(expectedId.replace('fed-shock-2022', 'fed')) || b.id === expectedId);
      assert(match, `Missing historical episode: ${expectedId}`);
    }

    // Calculate empirical Brier score: (1/N) * sum((P - Actual)^2)
    const sumBrier = HISTORICAL_BACKTESTS.reduce((acc, b) => acc + b.brierScore, 0);
    const meanBrierScore = Math.round((sumBrier / HISTORICAL_BACKTESTS.length) * 10000) / 10000;

    assert(meanBrierScore <= 0.050, `Brier score ${meanBrierScore} exceeds institutional threshold 0.050`);
    assert(meanBrierScore > 0, `Brier score must be strictly positive`);

    return `Evaluated ${HISTORICAL_BACKTESTS.length} crises. Mean Brier Score = ${meanBrierScore.toFixed(4)} (Threshold <= 0.050)`;
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// 2. MERTON (1974) DISTANCE-TO-DEFAULT CONSISTENCY
// ─────────────────────────────────────────────────────────────────────────────
await runTest(
  2,
  'Merton (1974) Distance-to-Default Consistency',
  'Verifies DD > 0, default prob in [0, 1], and monotonic decrease with asset volatility',
  async () => {
    const baseline = computeMertonModel(BASELINE_INPUTS);
    assert(baseline.distanceToDefault > 0, `Distance-to-Default must be positive, got ${baseline.distanceToDefault}`);
    assert(baseline.defaultProbabilityPct >= 0 && baseline.defaultProbabilityPct <= 100, `Default prob must be in [0, 100]`);

    const standardNormalProb = normalCdf(-baseline.distanceToDefault);
    assert(standardNormalProb >= 0 && standardNormalProb <= 1, `Normal CDF prob must be in [0, 1]`);

    // Strict Monotonicity Test: d(DD) / d(volatility) < 0
    const volatilityLadder = [0.15, 0.25, 0.365, 0.50, 0.75, 1.00, 1.40];
    let priorDD = Infinity;
    let priorProb = -1;

    for (const vol of volatilityLadder) {
      const res = computeMertonModel(BASELINE_INPUTS, vol);
      assert(res.distanceToDefault < priorDD, `DD failed monotonicity at vol=${vol}: ${res.distanceToDefault} >= ${priorDD}`);
      assert(res.defaultProbabilityPct >= priorProb, `Default probability failed monotonicity at vol=${vol}`);
      priorDD = res.distanceToDefault;
      priorProb = res.defaultProbabilityPct;
    }

    return `Baseline DD = ${baseline.distanceToDefault.toFixed(2)}σ. Monotonicity confirmed across ${volatilityLadder.length} volatility steps.`;
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// 3. ALTMAN Z''-SCORE (2002) ZONE BOUNDARY TRANSITIONS
// ─────────────────────────────────────────────────────────────────────────────
await runTest(
  3,
  'Altman Z\'\'-Score (2002) Zone Boundary Transitions',
  'Verifies formula Z\'\' = 6.56*X1 + 3.26*X2 + 6.72*X3 + 1.05*X4 and zone transitions',
  async () => {
    // 1. Exact mathematical formula check
    const x1 = 0.10, x2 = 0.20, x3 = 0.15, x4 = 3.00;
    const expectedManual = 6.56 * x1 + 3.26 * x2 + 6.72 * x3 + 1.05 * x4;
    const testRes = computeAltmanZScore({}, { x1, x2, x3, x4 });
    assert(Math.abs(testRes.score - expectedManual) < 0.01, `Formula mismatch: expected ${expectedManual}, got ${testRes.score}`);

    // 2. Zone threshold testing:
    // Distress: < 1.10
    const distress1 = computeAltmanZScore({}, { x1: -0.1, x2: -0.4, x3: -0.1, x4: 0.5 });
    assert(distress1.score < 1.10, `Expected score < 1.10, got ${distress1.score}`);
    assert(distress1.zone.includes('Distress'), `Expected Distress zone, got ${distress1.zone}`);

    // Grey Zone: 1.10 <= Z'' <= 2.60
    const grey1 = computeAltmanZScore({}, { x1: 0.05, x2: -0.05, x3: 0.02, x4: 1.5 });
    assert(grey1.score >= 1.10 && grey1.score <= 2.60, `Expected Grey score 1.1-2.6, got ${grey1.score}`);
    assert(grey1.zone.includes('Grey'), `Expected Grey zone, got ${grey1.zone}`);

    // Safe Zone: > 2.60
    const safe1 = computeAltmanZScore({}, { x1: 0.15, x2: 0.25, x3: 0.12, x4: 5.0 });
    assert(safe1.score > 2.60, `Expected Safe score > 2.60, got ${safe1.score}`);
    assert(safe1.zone.includes('Safe'), `Expected Safe zone, got ${safe1.zone}`);

    return `Formula validated. Verified boundaries: Distress (<1.1: ${distress1.score}), Grey (1.1–2.6: ${grey1.score}), Safe (>2.6: ${safe1.score})`;
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// 4. MINSKY FINANCIAL INSTABILITY REGIME PARTITION
// ─────────────────────────────────────────────────────────────────────────────
await runTest(
  4,
  'Minsky Financial Instability Regime Partition',
  'Verifies Hedge + Speculative + Ponzi = 100.0% (±0.1%) and Minsky Fragility Index in [0, 100]',
  async () => {
    const baseline = computeMinskyRegime(BASELINE_INPUTS);
    const sum = baseline.hedgeSharePct + baseline.speculativeSharePct + baseline.ponziSharePct;
    assert(Math.abs(sum - 100.0) <= 0.1, `Minsky shares sum must equal 100.0%, got ${sum}%`);
    assert(baseline.minskyFragilityIndex >= 0 && baseline.minskyFragilityIndex <= 100, `Fragility Index must be in [0, 100], got ${baseline.minskyFragilityIndex}`);

    // Stress regime test: heavy debt share and high capex-to-OCF
    const stressedInputs = {
      ...BASELINE_INPUTS,
      ledger: { ...BASELINE_INPUTS.ledger, debtShare: 0.35 },
      aiDebt: { ...BASELINE_INPUTS.aiDebt, capexToOcfRatio: 0.85 },
      macro: { ...BASELINE_INPUTS.macro, us10yYieldPct: 7.5 },
    };
    const stressed = computeMinskyRegime(stressedInputs);
    const stressedSum = stressed.hedgeSharePct + stressed.speculativeSharePct + stressed.ponziSharePct;
    assert(Math.abs(stressedSum - 100.0) <= 0.1, `Stressed shares sum must equal 100.0%, got ${stressedSum}%`);
    assert(stressed.ponziSharePct > baseline.ponziSharePct, `Ponzi share must expand under stress`);
    assert(stressed.minskyFragilityIndex > baseline.minskyFragilityIndex, `Fragility index must increase under stress`);

    return `Baseline: H=${baseline.hedgeSharePct}%, S=${baseline.speculativeSharePct}%, P=${baseline.ponziSharePct}% (Sum=${sum}%). MFI=${baseline.minskyFragilityIndex}`;
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// 5. ROBERT SHILLER EXCESS CAPE YIELD (ECY)
// ─────────────────────────────────────────────────────────────────────────────
await runTest(
  5,
  'Robert Shiller Excess CAPE Yield (ECY)',
  'Verifies formula ECY = 1/CAPE - Real Yield, and equity risk premium compression flags',
  async () => {
    const cape = 35.8;
    const realYield = 2.05;
    const ecyRes = computeShillerECY({ macro: { capeMultiple: cape, realYield10y: realYield } });

    const expectedEarningsYield = (1 / cape) * 100;
    const expectedECY = Math.round((expectedEarningsYield - realYield) * 100) / 100;

    assert(Math.abs(ecyRes.excessCapeYieldPct - expectedECY) < 0.05, `ECY calculation mismatch: expected ${expectedECY}, got ${ecyRes.excessCapeYieldPct}`);
    assert(ecyRes.isCompressed === (expectedECY < 1.0), `Compressed flag failed`);

    // Extreme Inversion Test (negative ECY)
    const invertedRes = computeShillerECY({ macro: { capeMultiple: 40.0, realYield10y: 4.50 } });
    assert(invertedRes.excessCapeYieldPct < 0, `Expected negative ECY, got ${invertedRes.excessCapeYieldPct}`);
    assert(invertedRes.isExtremelyCompressed === true, `Extremely compressed flag must trigger for negative ECY`);

    return `CAPE=${cape}x, Real Yield=${realYield}%, ECY=${ecyRes.excessCapeYieldPct}%. Compression flag validated.`;
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// 6. SORNETTE LPPLS SINGULARITY MODEL
// ─────────────────────────────────────────────────────────────────────────────
await runTest(
  6,
  'Sornette LPPLS Singularity Model',
  'Verifies super-exponential power exponent m in [0.1, 0.9], omega > 0, hazard rate in [10%, 95%]',
  async () => {
    const lppls = computeLpplsMetrics(BASELINE_INPUTS);

    assert(lppls.superExponentialExponent >= 0.1 && lppls.superExponentialExponent <= 0.9, `Exponent m must be in [0.1, 0.9], got ${lppls.superExponentialExponent}`);
    assert(lppls.angularFrequency > 0, `Angular frequency omega must be > 0, got ${lppls.angularFrequency}`);
    assert(lppls.crashHazardRatePct >= 10 && lppls.crashHazardRatePct <= 95, `Crash hazard rate must be in [10, 95], got ${lppls.crashHazardRatePct}`);
    assert(typeof lppls.estimatedCriticalWindow === 'string' && lppls.estimatedCriticalWindow.length > 0, `Critical window must be defined`);

    // Varying stress inputs
    const stressHigh = computeLpplsMetrics({ cds: { currentBps: 450 }, aiDebt: { capexToOcfRatio: 0.85 } });
    assert(stressHigh.crashHazardRatePct >= lppls.crashHazardRatePct, `Hazard rate must increase with credit spread`);

    const calmLow = computeLpplsMetrics({ cds: { currentBps: 50 }, aiDebt: { capexToOcfRatio: 0.30 } });
    assert(calmLow.crashHazardRatePct <= lppls.crashHazardRatePct, `Hazard rate must decrease with low credit spread`);

    return `Exponent m=${lppls.superExponentialExponent}, ω=${lppls.angularFrequency}, Baseline Hazard=${lppls.crashHazardRatePct}%, Window=${lppls.estimatedCriticalWindow}`;
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// 7. MONTE CARLO 25,000-PATH CONVERGENCE & CHOLESKY STABILITY
// ─────────────────────────────────────────────────────────────────────────────
await runTest(
  7,
  'Monte Carlo 25,000-Path Convergence & Cholesky Stability',
  'Simulates 25,000 paths, verifies SE <= 0.25%, VaR 95% > Median, CVaR 95% >= VaR 95%, Cholesky PD',
  async () => {
    const paths = 25_000;
    const mc = runMonteCarloSimulation(BASELINE_INPUTS, paths);

    // 1. Standard Error of Mean: SE = stdDev / sqrt(N)
    const sePct = mc.stdDevPct / Math.sqrt(paths);
    assert(sePct <= 0.25, `Standard error ${sePct.toFixed(4)}% exceeds target 0.25%`);

    // 2. Quantile consistency: VaR 95% > Median
    assert(mc.valueAtRisk95Pct > mc.medianProbabilityPct, `VaR 95% (${mc.valueAtRisk95Pct}%) must exceed Median (${mc.medianProbabilityPct}%)`);

    // 3. Expected Shortfall (CVaR 95%): CVaR >= VaR
    assert(mc.conditionalValueAtRisk95Pct >= mc.valueAtRisk95Pct, `CVaR 95% (${mc.conditionalValueAtRisk95Pct}%) must be >= VaR 95% (${mc.valueAtRisk95Pct}%)`);

    // 4. Cholesky Decomposition positive-definiteness & reconstruction check
    assert(Array.isArray(EMPIRICAL_CORRELATION_MATRIX), 'EMPIRICAL_CORRELATION_MATRIX must exist');
    const L = choleskyDecomposition(EMPIRICAL_CORRELATION_MATRIX);
    const n = EMPIRICAL_CORRELATION_MATRIX.length;

    // Check all diagonal elements L_ii > 0
    for (let i = 0; i < n; i++) {
      assert(L[i][i] > 0, `Cholesky diagonal element L[${i}][${i}] must be positive`);
    }

    // Reconstruct C' = L * L^T and compare with original C
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        let sum = 0;
        for (let k = 0; k < n; k++) {
          sum += L[i][k] * L[j][k];
        }
        const diff = Math.abs(sum - EMPIRICAL_CORRELATION_MATRIX[i][j]);
        assert(diff < 1e-4, `Cholesky reconstruction error at [${i},${j}]: diff=${diff}`);
      }
    }

    return `25,000 paths in ${mc.executionTimeMs}ms. Mean=${mc.meanProbabilityPct}%, SE=${sePct.toFixed(3)}%, VaR95=${mc.valueAtRisk95Pct}%, CVaR95=${mc.conditionalValueAtRisk95Pct}%`;
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// 8. GREEK SENSITIVITIES & PARTIAL DERIVATIVES
// ─────────────────────────────────────────────────────────────────────────────
await runTest(
  8,
  'Greek Sensitivities & Partial Derivatives',
  'Verifies dP/dCDS > 0 (credit risk), dP/dUS10Y > 0 (rate risk), dP/dDeflation < 0 (damper)',
  async () => {
    const baseRes = evaluateBubbleModel(BASELINE_INPUTS);
    const p0 = baseRes.burstProbability;

    // 1. Positive Credit Sensitivity: dP / dCDS > 0
    const cdsUp = JSON.parse(JSON.stringify(BASELINE_INPUTS));
    cdsUp.cds.currentBps += 35;
    const pCds = evaluateBubbleModel(cdsUp).burstProbability;
    const dP_dCDS = pCds - p0;
    assert(dP_dCDS > 0, `Expected dP/dCDS > 0, got ${dP_dCDS}`);

    // 2. Positive Macro Rate Sensitivity: dP / dUS10Y > 0
    const rateUp = JSON.parse(JSON.stringify(BASELINE_INPUTS));
    rateUp.macro.us10yYieldPct += 0.60;
    const pRate = evaluateBubbleModel(rateUp).burstProbability;
    const dP_dRate = pRate - p0;
    assert(dP_dRate > 0, `Expected dP/dUS10Y > 0, got ${dP_dRate}`);

    // 3. Negative Real-Demand Damper Sensitivity: dP / dDeflation < 0
    const deflUp = JSON.parse(JSON.stringify(BASELINE_INPUTS));
    deflUp.adoption.apiPriceDeclineMultiple += 25;
    const pDefl = evaluateBubbleModel(deflUp).burstProbability;
    const dP_dDefl = pDefl - p0;
    assert(dP_dDefl < 0, `Expected dP/dDeflation < 0, got ${dP_dDefl}`);

    return `dP/dCDS (+35bp)=+${dP_dCDS.toFixed(1)}%, dP/dUS10Y (+60bp)=+${dP_dRate.toFixed(1)}%, dP/dDefl (+25x)=${dP_dDefl.toFixed(1)}%`;
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// 9. HONEST DEGRADATION & COVERAGE RENORMALIZATION
// ─────────────────────────────────────────────────────────────────────────────
await runTest(
  9,
  'Honest Degradation & Coverage Renormalization',
  'Verifies that omitting factors rescales weights gracefully without crashing or producing NaN/inf',
  async () => {
    // 1. Missing CDS factor
    const noCds = { ...BASELINE_INPUTS, cds: null };
    const rNoCds = evaluateBubbleModel(noCds);
    assert(!isNaN(rNoCds.burstProbability), 'Burst probability was NaN without CDS');
    assert(rNoCds.coverage < 1.0, 'Coverage should reflect missing CDS');
    assert(rNoCds.burstProbability >= 0 && rNoCds.burstProbability <= 100, 'Prob out of bounds without CDS');

    // 2. Missing Valuations factor
    const noVal = { ...BASELINE_INPUTS, valuations: [] };
    const rNoVal = evaluateBubbleModel(noVal);
    assert(!isNaN(rNoVal.burstProbability), 'Burst probability was NaN without valuations');
    assert(rNoVal.burstProbability >= 0 && rNoVal.burstProbability <= 100, 'Prob out of bounds without valuations');

    // 3. Missing Ledger factor
    const noLedger = { ...BASELINE_INPUTS, ledger: null };
    const rNoLedger = evaluateBubbleModel(noLedger);
    assert(!isNaN(rNoLedger.burstProbability), 'Burst probability was NaN without ledger');

    // 4. Missing Adoption Damper
    const noAdoption = { ...BASELINE_INPUTS, adoption: null };
    const rNoAdoption = evaluateBubbleModel(noAdoption);
    assert(!isNaN(rNoAdoption.burstProbability), 'Burst probability was NaN without adoption');

    // 5. Complete empty input object
    const emptyRes = evaluateBubbleModel({});
    assert(!isNaN(emptyRes.burstProbability), 'Burst probability was NaN on empty input');
    assert(!isNaN(emptyRes.compositeScore), 'Composite score was NaN on empty input');
    assert(isFinite(emptyRes.burstProbability), 'Burst probability was Infinite on empty input');
    assert(isFinite(emptyRes.compositeScore), 'Composite score was Infinite on empty input');

    return `Graceful handling verified across missing CDS, Valuations, Ledger, Adoption, and empty inputs.`;
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// 10. EXTREME STRESS INVARIANT TESTS
// ─────────────────────────────────────────────────────────────────────────────
await runTest(
  10,
  'Extreme Stress Invariant Tests',
  'Evaluates 1970s Great Inflation, 2008 Lehman freeze, down-rounds, utopia; verifies strict bounds',
  async () => {
    const scenarios = [
      {
        name: '1970s Great Inflation',
        inputs: {
          ...BASELINE_INPUTS,
          macro: { ...BASELINE_INPUTS.macro, us10yYieldPct: 15.0, cpiInflationYoY: 14.5, fedFundsRatePct: 16.0 },
        },
      },
      {
        name: '2008 Lehman Liquidity Freeze',
        inputs: {
          ...BASELINE_INPUTS,
          cds: { ...BASELINE_INPUTS.cds, currentBps: 600, baselineBps: 81 },
          macro: { ...BASELINE_INPUTS.macro, highYieldSpreadBps: 1200 },
        },
      },
      {
        name: 'Complete Lab Down-Round (-80%)',
        inputs: {
          ...BASELINE_INPUTS,
          valuations: BASELINE_INPUTS.valuations.map(v => ({ ...v, valuationUsd: v.valuationUsd * 0.20 })),
        },
      },
      {
        name: 'Compound Global Solvency Crisis',
        inputs: {
          ...BASELINE_INPUTS,
          cds: { ...BASELINE_INPUTS.cds, currentBps: 850 },
          macro: { ...BASELINE_INPUTS.macro, us10yYieldPct: 18.0 },
          ledger: { ...BASELINE_INPUTS.ledger, debtShare: 0.50 },
          valuations: BASELINE_INPUTS.valuations.map(v => ({ ...v, valuationUsd: v.valuationUsd * 0.10 })),
        },
      },
      {
        name: 'Zero-Risk Macro Utopia',
        inputs: {
          ...BASELINE_INPUTS,
          cds: { ...BASELINE_INPUTS.cds, currentBps: 15, baselineBps: 81 },
          macro: { ...BASELINE_INPUTS.macro, us10yYieldPct: 0.5, cpiInflationYoY: 1.0 },
          ledger: { ...BASELINE_INPUTS.ledger, debtShare: 0.001 },
          adoption: { ...BASELINE_INPUTS.adoption, apiPriceDeclineMultiple: 150, annualUserGrowth: 2.0 },
        },
      },
    ];

    for (const s of scenarios) {
      const res = evaluateBubbleModel(s.inputs);
      assert(isFinite(res.burstProbability), `${s.name}: burstProbability is not finite`);
      assert(res.burstProbability >= 0 && res.burstProbability <= 100, `${s.name}: burstProbability out of [0, 100]: ${res.burstProbability}`);
      assert(isFinite(res.compositeScore), `${s.name}: compositeScore is not finite`);
      assert(res.compositeScore >= 0 && res.compositeScore <= 100, `${s.name}: compositeScore out of [0, 100]: ${res.compositeScore}`);
      assert(res.fragilityIndex >= 0 && res.fragilityIndex <= 100, `${s.name}: fragilityIndex out of [0, 100]: ${res.fragilityIndex}`);
      assert(res.confidenceInterval[0] >= 0 && res.confidenceInterval[1] <= 100, `${s.name}: CI out of bounds`);
      assert(res.confidenceInterval[0] <= res.confidenceInterval[1], `${s.name}: CI inversion`);
    }

    return `All ${scenarios.length} extreme stress regimes remained strictly within [0%, 100%] mathematical bounds.`;
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// FORMATTED INSTITUTIONAL OUTPUT TABLE & SUMMARY
// ─────────────────────────────────────────────────────────────────────────────
console.log('');
console.log(`${c.cyan}${c.bold}╔══════════════════════════════════════════════════════════════════════════════════════════════╗${c.reset}`);
console.log(`${c.cyan}${c.bold}║       AI CAPITAL TRACKER — QUANTITATIVE ALGORITHM & MATHEMATICAL TEST SUITE (10/10)        ║${c.reset}`);
console.log(`${c.cyan}${c.bold}║       Calibrated Probabilistic Invariants, Empirical Stress & Stochastic Verification        ║${c.reset}`);
console.log(`${c.cyan}${c.bold}╚══════════════════════════════════════════════════════════════════════════════════════════════╝${c.reset}`);
console.log('');

console.log(`${c.bold}${'#'.padEnd(4)} ${'STATUS'.padEnd(8)} ${'TIME'.padEnd(9)} ${'TEST NAME'.padEnd(52)} ${'TARGET INVARIANT / METHOD'}${c.reset}`);
console.log(`${c.gray}─`.repeat(105) + c.reset);

let passCount = 0;
let failCount = 0;
let totalTimeMs = 0;

for (const test of testResults) {
  totalTimeMs += test.durationMs;
  const isPass = test.status === 'PASS';
  if (isPass) passCount++;
  else failCount++;

  const statusBadge = isPass ? `${c.green}${c.bold}✔ PASS${c.reset}` : `${c.red}${c.bold}✖ FAIL${c.reset}`;
  const timeStr = `${test.durationMs.toFixed(1)}ms`.padEnd(9);
  const testId = `[${test.id.toString().padStart(2, '0')}]`.padEnd(4);
  const nameStr = test.name.padEnd(52);

  console.log(`${testId} ${statusBadge}  ${c.dim}${timeStr}${c.reset} ${c.bold}${nameStr}${c.reset} ${c.dim}${test.description}${c.reset}`);
  if (test.details) {
    console.log(`     ${c.gray}↳ Telemetry:${c.reset} ${c.cyan}${test.details}${c.reset}`);
  }
  if (test.error) {
    console.log(`     ${c.red}${c.bold}↳ Error:${c.reset} ${c.red}${test.error}${c.reset}`);
  }
}

console.log(`${c.gray}─`.repeat(105) + c.reset);
console.log('');

const allPassed = failCount === 0;
const summaryBg = allPassed ? c.bgGreen : c.bgRed;
const summaryText = allPassed
  ? ` ALL ${passCount}/10 MATHEMATICAL TESTS PASSED `
  : ` FAILED ${failCount}/10 TESTS `;

console.log(`  ${summaryBg}${c.bold}${summaryText}${c.reset}  ${c.bold}Total Time: ${totalTimeMs.toFixed(1)}ms${c.reset}`);
console.log(`  ${c.dim}Brier Out-of-Sample: BS <= 0.050 (Calibrated) | Monte Carlo: 25k Paths Converged (SE <= 0.25%)${c.reset}`);
console.log('');

if (allPassed) {
  process.exit(0);
} else {
  process.exit(1);
}
