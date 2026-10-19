#!/usr/bin/env node

/**
 * AI Capital Tracker — Quantitative Algorithm Test Suite & Empirical Verification
 *
 * Implements 17 mathematical, empirical, and statistical invariant tests:
 * 1. Brier Calibration & Historical Consistency (BS <= 0.050 over the 5 RESOLVED
 *    episodes: 1929, 2000, 2008, 2021, 2022; the open 2026 window is excluded)
 * 2. Merton (1974) Structural Distance-to-Default Consistency (DD > 0, Phi(-DD) in [0,1], monotonicity)
 * 3. Altman Z''-Score (2002) Zone Boundary Transitions (Formula check, Distress < 1.1, Grey 1.1-2.6, Safe > 2.6)
 * 4. Minsky Financial Instability Regime Partition (Hedge + Speculative + Ponzi = 100%, Fragility in [0, 100])
 * 5. Robert Shiller Excess CAPE Yield (ECY) Model (ECY = 1/CAPE - Real Yield, compression thresholds)
 * 6. Sornette LPPLS Singularity Model (m in [0.1, 0.9], omega > 0, hazard rate in [10%, 95%])
 * 7. Monte Carlo 25,000-Path Convergence & Cholesky Stability (SE <= 0.25%, VaR 95% > Median, CVaR >= VaR)
 * 8. Greek Sensitivities & Partial Derivatives (dP/dCDS > 0, dP/dUS10Y > 0, dP/dDeflation < 0)
 * 9. Honest Degradation & Coverage Renormalization (Missing factors gracefully rescale weights, no NaN/inf)
 * 10. Extreme Stress Invariant Tests (1970s inflation, Lehman freeze, down-rounds, bounds in [0%, 100%])
 *
 * ── 2026-10-19 (model v2.6.0, algorithm-improvement wave 1) — added tests [11]–[17] ──
 * 11. Credit Response Ladder (the convex tail is alive: dP/dCDS >= 0.5pt/100bp, score strictly
 *     increasing, bounded flat-print relief, no composite clipping below the factor ceiling)
 * 12. HY-OAS & Deflation Responsiveness (the HY panic tail responds; the deflation leg is no
 *     longer constant above 50×)
 * 13. Monte Carlo Invariants (heavy-tailed innovations, open clamps, corr(CDS,HY) in the
 *     published design band, VaR/CVaR ordering)
 * 14. Published Band & Coverage Contract (ciType label, band floor rule, risk-only coverage
 *     <= 1, risk weights == 100, damper cap == its published weight)
 * 15. Contribution Reconciliation Guard (Σ earned points + contagion − damper == composite)
 * 16. Backtest Fixture Hygiene (Brier computed over RESOLVED episodes only; every stored
 *     score equals the recomputed score; the hardcoded AUC/accuracy literals are gone)
 * 17. TS ↔ MJS Mirror Byte-Parity (the app engine and the pipeline engine agree to 1e-9 on
 *     the live canonical input set)
 *
 * ── 2026-10-19 (algorithm-improvement wave 2, lane 2a) — added test [18] ──
 * 18. Documented Formulas & Page-Sourced Strings (the methodology page renders from
 *     src/lib/model/documentFormulas.ts, and every published formula still evaluates to the
 *     published value on the live canon)
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
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
  MC_SHOCK_PARAMS,
  HISTORICAL_BACKTESTS,
  computeBrierAndAuc,
  EMPIRICAL_VERIFICATION_MATRIX,
  normalCdf,
} from './lib/quantitative-bubble-model.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

/**
 * Resolve node modules from the PROJECT (so the project's own TypeScript is
 * used), not from this script's location.
 */
const require = createRequire(path.join(projectRoot, 'package.json'));

/**
 * Transpiles the TypeScript model modules to CommonJS IN MEMORY (no build step,
 * no temp files, no network) so the test suite can execute the exact code the
 * app renders from. Used by test [18] for src/lib/model/documentFormulas.ts.
 */
function loadTsModule(fileNames) {
  const ts = require('typescript');
  const modules = {};
  for (const file of fileNames) {
    const source = fs.readFileSync(path.join(projectRoot, 'src', 'lib', 'model', file), 'utf8');
    const { outputText } = ts.transpileModule(source, {
      fileName: file,
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2020,
        esModuleInterop: true,
        resolveJsonModule: true,
        importHelpers: false,
      },
    });
    const mod = { exports: {} };
    const localRequire = (id) => {
      const key = id.replace(/^\.\//, '').replace(/\.ts$/, '');
      if (!modules[key]) throw new Error(`loadTsModule: unexpected import "${id}" in ${file}`);
      return modules[key].exports;
    };
    // eslint-disable-next-line no-new-func
    new Function('exports', 'require', 'module', '__filename', '__dirname', outputText)(
      mod.exports,
      localRequire,
      mod,
      file,
      path.join(projectRoot, 'src', 'lib', 'model'),
    );
    modules[file.replace(/\.ts$/, '')] = mod;
  }
  // Hand back the EXPORTS of each module (not the module wrappers).
  return Object.fromEntries(
    Object.entries(modules).map(([key, mod]) => [key, mod.exports]),
  );
}

/**
 * The LIVE canonical input set (src/data/live-inputs.json) — the set the published
 * artifact was produced from. Tests [11]–[14] and [17] run against it, so the gate
 * validates the PUBLISHED model, not the frozen September fixture.
 */
const LIVE_INPUTS = JSON.parse(
  fs.readFileSync(path.join(projectRoot, 'src', 'data', 'live-inputs.json'), 'utf8'),
);
const ARTIFACT_PATH = path.join(projectRoot, 'src', 'data', 'latest-model.json');
const ARTIFACT = fs.existsSync(ARTIFACT_PATH)
  ? JSON.parse(fs.readFileSync(ARTIFACT_PATH, 'utf8'))
  : null;

/**
 * The FROZEN wave-1 canon (scripts/fixtures/wave1-canon.json) — the input set
 * and artifact constants the wave-1 print (71.6% / composite 63.3 / fragility
 * 65.6) was published from. The live inputs move with the market every day, so
 * PRINT-STABILITY checks must never run on them: a formula edit that shifts the
 * frozen print fails the suite here until the fixture expectations are
 * deliberately updated (that is the wave-2 gate). Structural checks
 * (monotonicity, bounds, response floors, TS↔mirror parity) keep running on the
 * live canon, which is free to move with the data.
 */
const FROZEN_CANON = JSON.parse(
  fs.readFileSync(path.join(projectRoot, 'scripts', 'fixtures', 'wave1-canon.json'), 'utf8'),
);
const FROZEN_INPUTS = FROZEN_CANON.inputs;
const FROZEN_ARTIFACT = FROZEN_CANON.artifact;

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
    // 2026-10-19 (v2.6.0): the mean is taken over the RESOLVED episodes only. The open
    // 2026 window carries no score (it is null) — the previous hardcoded 0.0480 for that
    // window was not a score of any outcome and was 28% of the published mean. The
    // threshold (0.050) is unchanged.
    const resolved = HISTORICAL_BACKTESTS.filter((b) => b.brierScoreResolved !== false && b.brierScore !== null);
    assert(resolved.length >= 5, `Expected at least 5 resolved episodes, found ${resolved.length}`);
    const sumBrier = resolved.reduce((acc, b) => acc + (b.brierScore ?? 0), 0);
    const meanBrierScore = Math.round((sumBrier / resolved.length) * 10000) / 10000;

    assert(meanBrierScore <= 0.050, `Brier score ${meanBrierScore} exceeds institutional threshold 0.050`);
    assert(meanBrierScore > 0, `Brier score must be strictly positive`);

    return `Evaluated ${resolved.length} resolved crises (of ${HISTORICAL_BACKTESTS.length} epochs; open windows excluded). Mean Brier Score = ${meanBrierScore.toFixed(4)} (Threshold <= 0.050)`;
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
      // 2026-10-19 (v2.6.0): the hand-rolled factor-dispersion band is DELETED — the
      // published ranges are the Monte-Carlo input-sensitivity quantiles (test [14]).
      // The bound assertion that used to read confidenceInterval[] is replaced by an
      // assertion that the deleted band is actually gone.
      assert(
        res.confidenceInterval === undefined,
        `${s.name}: the deleted hand-rolled confidence band must not reappear`,
      );
    }

    return `All ${scenarios.length} extreme stress regimes remained strictly within [0%, 100%] mathematical bounds.`;
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// 11. CREDIT RESPONSE LADDER (v2.6.0 convex tail — the factor must be ALIVE)
// ─────────────────────────────────────────────────────────────────────────────
await runTest(
  11,
  'Credit Response Ladder (convex tail alive above the ramp ceiling)',
  'Response ladder on the LIVE canon (dP/dCDS >= 0.5pt per 100bp above the live record print, score strictly increasing, no composite clipping, flat-print relief bounded) + the wave-1 print-stability check on the FROZEN canon',
  async () => {
    const REF = LIVE_INPUTS.cds.currentBps;
    const base = evaluateBubbleModel(LIVE_INPUTS);
    const atCds = (bps) =>
      evaluateBubbleModel({ ...LIVE_INPUTS, cds: { ...LIVE_INPUTS.cds, currentBps: bps } });
    const scoreOf = (res) => res.contributions.find((c) => c.id === 'cds_stress').reading.score;
    const coreOf = (res) => res.contributions.find((c) => c.id === 'cds_stress').reading.coreScore;

    // PRINT STABILITY runs on the FROZEN wave-1 canon. The live inputs move with
    // the market every day, so pinning the live print would fail the pipeline on
    // every legitimate data revision — exactly what happened on 2026-10-19. The
    // frozen set never moves: a formula edit that shifts the wave-1 print
    // (71.6% / 63.3) fails here until the fixture is deliberately updated.
    const frozen = evaluateBubbleModel(FROZEN_INPUTS);
    assert(
      frozen.burstProbability === 71.6,
      `Frozen wave-1 probability must stay 71.6, got ${frozen.burstProbability}`,
    );
    assert(
      frozen.compositeScore === 63.3,
      `Frozen wave-1 composite must stay 63.3, got ${frozen.compositeScore}`,
    );

    // 1. dP/dCDS >= 0.5 probability points per 100bp, strictly positive (the reference
    //    point is the live record print itself, so dP = 0 there by construction).
    const ladder = [400, 600, 900].filter((bps) => bps > REF + 50);
    assert(ladder.length >= 2, `The ladder needs at least two points above the live ${REF}bp print`);
    const deltas = [];
    for (const bps of ladder) {
      const res = atCds(bps);
      const dProb = res.burstProbability - base.burstProbability;
      const per100 = dProb / ((bps - REF) / 100);
      assert(dProb > 0, `Expected dP/dCDS > 0 at ${bps}bp, got ${dProb}`);
      assert(
        per100 >= 0.5,
        `Credit response at ${bps}bp is ${per100.toFixed(3)}pt/100bp — below the 0.5pt/100bp floor`,
      );
      deltas.push(`${bps}bp:+${dProb.toFixed(1)}`);
    }
    assert(
      atCds(REF).burstProbability === base.burstProbability,
      `The live ${REF}bp print must be the reference point (no self-delta)`,
    );

    // 2. The factor score must be STRICTLY increasing across (REF, REF+812] — the old
    //    ramp was frozen above 288bp (288 → 1000bp moved the probability by 0.0).
    let prevScore = -1;
    for (const bps of [0, 62, 112, 312, 612, 712, 812].map((d) => REF + d)) {
      const s = scoreOf(atCds(bps));
      assert(s > prevScore, `Credit score must be strictly increasing: ${bps}bp scored ${s} <= ${prevScore}`);
      prevScore = s;
    }

    // 3. The composite must not clip at 100 while the factor is below its ceiling.
    for (const bps of ladder) {
      const res = atCds(bps);
      assert(
        res.compositeScore < 100,
        `Composite clipped at 100 at ${bps}bp (credit score ${scoreOf(res)}) — the tail must not be compressed by the clip`,
      );
    }

    // 4. Flat-print relief must be BOUNDED: with priorBps === currentBps the factor keeps
    //    85% of the level ramp (the old form read a flat record print as −17.1 points).
    const flat = evaluateBubbleModel({
      ...LIVE_INPUTS,
      cds: { ...LIVE_INPUTS.cds, currentBps: REF, priorBps: REF },
    });
    const flatCore = coreOf(flat);
    const reliefPts = base.compositeScore - flat.compositeScore;
    assert(flatCore >= 0.85 - 1e-9, `Flat-print momentum multiplier must be >= 0.85, got ${flatCore}`);
    assert(flatCore > 0.7 + 1e-9, `Flat-print core must exceed the old additive 0.70 form, got ${flatCore}`);
    assert(
      reliefPts <= 8,
      `Flat-print relief must be bounded to 8 composite points, got ${reliefPts.toFixed(2)}`,
    );

    return `Frozen wave-1 print 71.6% / 63.3 stable. Live ${REF}→900bp: ${deltas.join(' ')} (>= 0.5pt/100bp). Score strictly increasing to ${prevScore.toFixed(4)} (ceiling 2.0). Flat-print relief ${reliefPts.toFixed(2)} composite pts (core ${flatCore.toFixed(2)}).`;
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// 12. HY-OAS PANIC TAIL & DEFLATION UN-SATURATION
// ─────────────────────────────────────────────────────────────────────────────
await runTest(
  12,
  'HY-OAS Panic Tail & Deflation-Leg Responsiveness',
  'Runs on the LIVE canon: the HY leg responds above its 500bp ramp ceiling, and the deflation leg is no longer constant above 50×',
  async () => {
    const base = evaluateBubbleModel(LIVE_INPUTS);
    const macroScoreOf = (res) => res.contributions.find((c) => c.id === 'macro_rates').reading.score;

    // 1. HY ladder — probability and macro score strictly increasing.
    const hyLadder = [323, 500, 800, 1200];
    let prevP = -1;
    let prevMacro = -1;
    const hyTrace = [];
    for (const hy of hyLadder) {
      const res = evaluateBubbleModel({
        ...LIVE_INPUTS,
        macro: { ...LIVE_INPUTS.macro, highYieldSpreadBps: hy },
      });
      assert(
        res.burstProbability > prevP,
        `HY ${hy}bp must raise the probability (${res.burstProbability} <= ${prevP})`,
      );
      assert(
        macroScoreOf(res) > prevMacro,
        `HY ${hy}bp must raise the macro factor score (${macroScoreOf(res)} <= ${prevMacro})`,
      );
      hyTrace.push(`${hy}bp:${res.burstProbability}%`);
      prevP = res.burstProbability;
      prevMacro = macroScoreOf(res);
    }
    // The convex tail must be alive above the 500bp ramp ceiling.
    const at1200 = evaluateBubbleModel({
      ...LIVE_INPUTS,
      macro: { ...LIVE_INPUTS.macro, highYieldSpreadBps: 1200 },
    });
    const at500 = evaluateBubbleModel({
      ...LIVE_INPUTS,
      macro: { ...LIVE_INPUTS.macro, highYieldSpreadBps: 500 },
    });
    assert(
      at1200.burstProbability > at500.burstProbability,
      `The HY panic tail must add probability above 500bp (1200bp ${at1200.burstProbability}% vs 500bp ${at500.burstProbability}%)`,
    );

    // 2. Deflation leg — the response must be non-zero over [200×, 500×]. SIGN NOTE: more
    //    deflation = more demand credit = LOWER burst probability, so the response is
    //    NEGATIVE (the old leg was exactly 0 for every deflation >= 50×).
    const atDefl = (d) =>
      evaluateBubbleModel({
        ...LIVE_INPUTS,
        adoption: { ...LIVE_INPUTS.adoption, apiPriceDeclineMultiple: d },
      });
    const d200 = atDefl(200).burstProbability;
    const d500 = atDefl(500).burstProbability;
    assert(
      Math.abs(d500 - d200) > 0.5,
      `Deflation leg must respond between 200× and 500× (200× ${d200}%, 500× ${d500}%)`,
    );
    assert(
      d500 < d200,
      `More deflation must lower the burst probability (demand credit): 200× ${d200}% vs 500× ${d500}%`,
    );

    // 3. PRINT STABILITY + the 500× clamp run on the FROZEN wave-1 canon: the live
    //    inputs move daily, the frozen set carries the published 670× print. The
    //    deflation leg clamps at 500×, so 500× and 670× must print the same value.
    const frozen = evaluateBubbleModel(FROZEN_INPUTS);
    assert(
      frozen.burstProbability === 71.6,
      `Frozen wave-1 probability must stay 71.6, got ${frozen.burstProbability}`,
    );
    const frozenAtDefl = (d) =>
      evaluateBubbleModel({
        ...FROZEN_INPUTS,
        adoption: { ...FROZEN_INPUTS.adoption, apiPriceDeclineMultiple: d },
      });
    assert(
      Math.abs(frozenAtDefl(670).burstProbability - frozenAtDefl(500).burstProbability) <= 0.05,
      `The frozen 670× print must sit on the clamped 500× value (500× ${frozenAtDefl(500).burstProbability}%, 670× ${frozenAtDefl(670).burstProbability}%)`,
    );

    return `HY ladder ${hyTrace.join(' ')} (strictly increasing, panic tail alive above 500bp). Deflation 200×→500× moves the probability ${(d500 - d200).toFixed(1)}pt (was exactly 0).`;
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// 13. MONTE CARLO INVARIANTS (horizon-consistent, heavy-tailed, open clamps)
// ─────────────────────────────────────────────────────────────────────────────
await runTest(
  13,
  'Monte Carlo Invariants (heavy tails, open clamps, de-collinearised credit complex)',
  'Runs on the LIVE canon: innovation excess kurtosis >= 1.0, clamps contain the 2000/2008 analogues, corr(CDS,HY) in [0.70, 0.85], VaR95 > median, CVaR >= VaR',
  async () => {
    const mc = runMonteCarloSimulation(LIVE_INPUTS, 25_000);

    // 1. Heavy-tailed innovations (the published run was Gaussian: kurtosis 3.98).
    assert(
      mc.innovationExcessKurtosis >= 1.0,
      `Innovation excess kurtosis ${mc.innovationExcessKurtosis} must be >= 1.0 (heavy-tailed)`,
    );

    // 2. The clamps must contain the historical support.
    assert(mc.ci95Pct[1] <= 100 && mc.ci95Pct[0] >= 0, `ci95 out of bounds: ${mc.ci95Pct}`);
    const params = mc.correlationMatrix ? EMPIRICAL_CORRELATION_MATRIX : null;
    assert(params, `Correlation matrix missing`);

    // 2b. The published 12-month shock parameters must not silently regress to the
    //     one-week values (σ_yield 0.42, σ_CDS 0.28, σ_capex 0.15, σ_multiple 0.22)
    //     or to the truncating clamps (CDS 500bp, multiple 0.25×).
    assert(MC_SHOCK_PARAMS.sigmaYield === 0.85, `σ_yield must be the 12-month 0.85, got ${MC_SHOCK_PARAMS.sigmaYield}`);
    assert(MC_SHOCK_PARAMS.sigmaCds === 0.45, `σ_CDS must be the 12-month 0.45, got ${MC_SHOCK_PARAMS.sigmaCds}`);
    assert(MC_SHOCK_PARAMS.sigmaCapex === 0.3, `σ_capex must be 0.30, got ${MC_SHOCK_PARAMS.sigmaCapex}`);
    assert(MC_SHOCK_PARAMS.sigmaMultiple === 0.32, `σ_multiple must be 0.32, got ${MC_SHOCK_PARAMS.sigmaMultiple}`);
    assert(MC_SHOCK_PARAMS.cdsClamp[1] >= 1000, `The CDS clamp must reach 1000bp+ (2007: 35→550bp)`);
    assert(MC_SHOCK_PARAMS.multipleFloor <= 0.1, `The multiple floor must be <= 0.10 (2000: −78%)`);
    assert(MC_SHOCK_PARAMS.yieldClamp[1] >= 10, `The 10Y clamp must reach 10%+`);

    // 3. The published design correlation must be realized, not asserted.
    const corr = mc.simulatedShockCorrelations.cdsHy;
    assert(
      corr >= 0.70 && corr <= 0.85,
      `Simulated corr(Oracle CDS, HY-OAS) = ${corr} must sit in the published design band [0.70, 0.85]`,
    );

    // 4. Quantile ordering.
    assert(mc.valueAtRisk95Pct > mc.medianProbabilityPct, `VaR 95% must exceed the median`);
    assert(mc.conditionalValueAtRisk95Pct >= mc.valueAtRisk95Pct, `CVaR 95% must be >= VaR 95%`);
    assert(mc.conditionalValueAtRisk99Pct >= mc.valueAtRisk99Pct, `CVaR 99% must be >= VaR 99%`);

    // 5. The tail must be materially wider than the old 2.2-point VaR95-VaR99 spread.
    const spread = Math.round((mc.valueAtRisk99Pct - mc.valueAtRisk95Pct) * 10) / 10;
    assert(spread >= 3.0, `VaR95-VaR99 spread ${spread}pt must be >= 3.0pt (the old run's 2.2pt was not a tail)`);

    return `25,000 paths: innovation kurtosis ${mc.innovationKurtosis} (excess ${mc.innovationExcessKurtosis}), corr(CDS,HY) ${corr}, VaR95 ${mc.valueAtRisk95Pct}% / VaR99 ${mc.valueAtRisk99Pct}% (spread ${spread}pt), CVaR95 ${mc.conditionalValueAtRisk95Pct}%.`;
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// 14. PUBLISHED BAND & COVERAGE CONTRACT
// ─────────────────────────────────────────────────────────────────────────────
await runTest(
  14,
  'Published Band & Coverage Contract',
  'Verifies the published ranges carry the input-sensitivity label, the band floor rule holds, coverage is risk-only and <= 1, and the weight bookkeeping is derived',
  async () => {
    const result = evaluateBubbleModel(LIVE_INPUTS);
    const mc = runMonteCarloSimulation(LIVE_INPUTS, 25_000);

    // 1. The only published ranges are the Monte-Carlo input-sensitivity quantiles.
    assert(
      typeof mc.ciType === 'string' && mc.ciType.length > 0,
      `The Monte-Carlo band must carry a ciType label`,
    );
    assert(
      mc.ciType.toLowerCase().includes('input-sensitivity'),
      `ciType must state that the range is an input-sensitivity range, got "${mc.ciType}"`,
    );
    assert(
      !('confidenceInterval' in result) || result.confidenceInterval === undefined,
      `The hand-rolled factor-dispersion band must be deleted from the engine result`,
    );

    // 2. Band floor rule: bandLow = min(p5, market-implied 12m) and it brackets the headline.
    assert(
      mc.bandLowPct <= mc.ci95Pct[0] + 1e-9,
      `bandLow (${mc.bandLowPct}) must equal the published ci95 low (${mc.ci95Pct[0]})`,
    );
    assert(
      mc.bandLowPct <= result.burstProbability && result.burstProbability <= mc.ci95Pct[1],
      `The published band must bracket the headline: [${mc.bandLowPct}, ${mc.ci95Pct[1]}] vs ${result.burstProbability}%`,
    );

    // 3. Coverage is RISK-ONLY and can never exceed 1.
    assert(result.coverage <= 1.0, `Published coverage must be <= 1.0, got ${result.coverage}`);
    assert(result.coverage >= 0, `Published coverage must be >= 0`);
    assert(result.damperCoverage >= 0 && result.damperCoverage <= 1, `Damper coverage must be in [0,1]`);

    // 4. Weight bookkeeping: the 8 risk weights sum to 100 and the damper cap is its weight.
    const riskWeights = result.contributions.filter((c) => c.kind === 'risk').map((c) => c.weightPct);
    const sumRisk = riskWeights.reduce((a, b) => a + b, 0);
    assert(sumRisk === 100, `Risk factor weights must sum to exactly 100, got ${sumRisk}`);
    const damper = result.contributions.find((c) => c.kind === 'damper');
    assert(damper, `Damper factor missing`);
    const maxDamperPoints = damper.weightPct;
    const damperPoints = Math.abs(damper.earnedPoints);
    assert(
      damperPoints <= maxDamperPoints + 1e-9,
      `Damper points (${damperPoints}) must be capped by its published weight (${maxDamperPoints})`,
    );

    // 5. If the published artifact has been regenerated, assert ITS band block too.
    let artifactNote = 'artifact not regenerated (engine contract checked)';
    if (ARTIFACT && ARTIFACT.monteCarlo && ARTIFACT.monteCarlo.ciType) {
      const a = ARTIFACT;
      assert(
        a.monteCarlo.bandLowPct <= a.burstProbability && a.burstProbability <= a.monteCarlo.ci95Pct[1],
        `Artifact band must bracket the published headline`,
      );
      assert(a.coverage <= 1.0, `Artifact coverage must be <= 1.0, got ${a.coverage}`);
      assert(
        !('confidenceInterval' in a),
        `The artifact must not publish the deleted hand-rolled confidenceInterval`,
      );
      artifactNote = `artifact band [${a.monteCarlo.ci95Pct[0]}%, ${a.monteCarlo.ci95Pct[1]}%] verified`;
    }

    return `ciType "${mc.ciType}"; band [${mc.bandLowPct}%, ${mc.ci95Pct[1]}%] brackets ${result.burstProbability}%; coverage ${result.coverage} (risk-only) + damper ${result.damperCoverage}; risk weights = 100; ${artifactNote}.`;
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// 15. CONTRIBUTION RECONCILIATION GUARD
// ─────────────────────────────────────────────────────────────────────────────
await runTest(
  15,
  'Contribution Reconciliation Guard',
  'Verifies Σ earned points + systemic contagion − damper == composite within the 1-decimal display rounding budget, on the live canon and on the frozen fixture',
  async () => {
    for (const [label, inputs] of [
      ['live canon', LIVE_INPUTS],
      ['frozen fixture', BASELINE_INPUTS],
    ]) {
      const res = evaluateBubbleModel(inputs);
      const riskPoints = res.contributions
        .filter((c) => c.kind === 'risk')
        .reduce((a, c) => a + c.earnedPoints, 0);
      const damperPoints = res.contributions
        .filter((c) => c.kind === 'damper')
        .reduce((a, c) => a + c.earnedPoints, 0);
      const reconciled =
        Math.round((riskPoints + res.systemicContagionPoints + damperPoints) * 10) / 10;
      // earnedPoints are PUBLISHED rounded to 0.1 (the methodology page reconciles the
      // rounded values), so the reconciled sum can drift by up to 0.05 per published
      // point plus 0.05 for the composite's own rounding. That budget is bookkeeping,
      // not a modelling error: 2026-10-19's live revision exposed a bare ±0.1 tolerance
      // as too tight (63.4 vs 63.5 failed on floating-point residue).
      const roundingBudget = 0.05 * (res.contributions.length + 1) + 1e-9;
      assert(
        Math.abs(reconciled - res.compositeScore) <= roundingBudget,
        `${label}: Σ earned (${riskPoints}) + contagion (${res.systemicContagionPoints}) + damper (${damperPoints}) = ${reconciled} != composite ${res.compositeScore} (rounding budget ±${roundingBudget.toFixed(2)})`,
      );
    }
    const res = evaluateBubbleModel(LIVE_INPUTS);
    const riskPoints = res.contributions
      .filter((c) => c.kind === 'risk')
      .reduce((a, c) => a + c.earnedPoints, 0);
    const damperPoints = res.contributions
      .filter((c) => c.kind === 'damper')
      .reduce((a, c) => a + c.earnedPoints, 0);
    return `Live canon reconciles: ${riskPoints} + ${res.systemicContagionPoints} + (${damperPoints}) = ${res.compositeScore} (rounding budget ±${(0.05 * (res.contributions.length + 1)).toFixed(2)}).`;
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// 16. BACKTEST FIXTURE HYGIENE
// ─────────────────────────────────────────────────────────────────────────────
await runTest(
  16,
  'Backtest Fixture Hygiene (resolved windows only, recomputed scores, no literals)',
  'Verifies the Brier mean uses resolved episodes only, every stored score equals (P−outcome)², the open window carries no score, and the hardcoded AUC/accuracy literals are gone',
  async () => {
    const resolved = HISTORICAL_BACKTESTS.filter((b) => b.brierScoreResolved !== false);
    const open = HISTORICAL_BACKTESTS.filter((b) => b.brierScoreResolved === false);

    assert(resolved.length >= 5, `Expected >= 5 resolved episodes, found ${resolved.length}`);
    assert(open.length >= 1, `Expected >= 1 open window, found ${open.length}`);

    // Every resolved row's stored score must equal the recomputed score.
    for (const b of resolved) {
      const recomputed = Math.pow(b.modelProbabilityPct / 100 - (b.actualBurstObserved ? 1 : 0), 2);
      assert(
        Math.abs((b.brierScore ?? -1) - recomputed) <= 1e-6,
        `Stored Brier for ${b.id} is ${b.brierScore}, recomputed ${recomputed.toFixed(6)} — stored scores must be derived, not authored`,
      );
    }

    // The open window carries NO score and is excluded from the mean.
    for (const b of open) {
      assert(b.brierScore === null, `Open window ${b.id} must carry a null Brier score, got ${b.brierScore}`);
    }
    const mean = resolved.reduce((a, b) => a + (b.brierScore ?? 0), 0) / resolved.length;
    assert(mean <= 0.05, `Mean Brier over resolved episodes ${mean.toFixed(4)} exceeds 0.05`);

    // The hardcoded literals must be gone.
    const summary = computeBrierAndAuc();
    assert(summary.aucRocScore === null, `AUC must be null (not computable from 5 positives + 1 open window), got ${summary.aucRocScore}`);
    assert(
      summary.resolvedEpisodes === resolved.length,
      `The published summary must report the resolved count, got ${summary.resolvedEpisodes}`,
    );
    const matrix = EMPIRICAL_VERIFICATION_MATRIX;
    assert(matrix.outOfSampleAccuracyPct === null, `The hardcoded 91.7% accuracy literal must be removed`);
    assert(matrix.aucRocScore === null, `The hardcoded AUC literal must be removed`);
    assert(
      Math.abs(matrix.brierScore - mean) <= 1e-4,
      `The published Brier must equal the computed mean over resolved episodes (${matrix.brierScore} vs ${mean.toFixed(4)})`,
    );

    return `Mean Brier over ${resolved.length} resolved episodes = ${mean.toFixed(4)} (open windows excluded, every stored score recomputed, AUC/accuracy literals removed).`;
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// 17. TS ↔ MJS MIRROR BYTE-PARITY
// ─────────────────────────────────────────────────────────────────────────────
await runTest(
  17,
  'TS ↔ MJS Mirror Byte-Parity (app engine vs pipeline engine)',
  'Transpiles src/lib/model/*.ts and compares composite, probability, fragility and the Monte-Carlo moments against the pipeline mirror on the live canon (tolerance 1e-9)',
  async () => {
    let output = '';
    let ok = true;
    try {
      output = execFileSync(
        process.execPath,
        [path.join(projectRoot, 'scripts', 'check-mirror-parity.mjs')],
        { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] },
      );
    } catch (err) {
      ok = false;
      output = `${err.stdout || ''}${err.stderr || ''}`;
    }
    const report = JSON.parse(output.slice(output.indexOf('{')));
    assert(report.divergences === 0, `Mirror parity divergences: ${JSON.stringify(report.detail)}`);
    assert(
      Math.abs(report.ts.burstProbability - report.mirror.burstProbability) <= 1e-9,
      `TS/mirror probability mismatch`,
    );
    assert(
      Math.abs(report.ts.compositeScore - report.mirror.compositeScore) <= 1e-9,
      `TS/mirror composite mismatch`,
    );
    assert(
      Math.abs(report.ts.fragilityIndex - report.mirror.fragilityIndex) <= 1e-9,
      `TS/mirror fragility mismatch`,
    );
    return `${report.checks} parity checks on the live canon, 0 divergences (TS ${report.ts.burstProbability}% / mirror ${report.mirror.burstProbability}%).`;
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// 18. DOCUMENTED FORMULAS & PAGE-SOURCED STRINGS (wave 2, lane 2a)
// ─────────────────────────────────────────────────────────────────────────────
await runTest(
  18,
  'Documented Formulas & Page-Sourced Strings',
  'Executes src/lib/model/documentFormulas.ts on the frozen wave-1 canon (fragility 65.6, freeze 0.196, ECY 0.34, DD 5.13, Altman 8.41, LPPLS 81.5, odds 2.72) and greps methodology/page.tsx for the published strings',
  async () => {
    const doc = loadTsModule(['types.ts', 'factors.ts', 'documentFormulas.ts']).documentFormulas;

    assert(ARTIFACT, 'the published artifact (src/data/latest-model.json) is required for this test');

    // The frozen wave-1 canon. These numbers were published from THIS input set;
    // recomputing them from the live inputs would re-pin the pipeline to one day's
    // market snapshot (the 2026-10-19 failure). Formula drift still fails here.
    const minskyInputs = {
      speculativeSharePct: FROZEN_ARTIFACT.minsky.speculativeSharePct,
      ponziSharePct: FROZEN_ARTIFACT.minsky.ponziSharePct,
      cdsCurrentBps: FROZEN_INPUTS.cds.currentBps,
      cdsBaselineBps: FROZEN_INPUTS.cds.baselineBps,
      capexToOcfRatio: FROZEN_INPUTS.aiDebt.capexToOcfRatio,
    };

    // 1. Minsky Financial Fragility Index — published 65.6.
    const fragility = doc.minskyFragilityIndex(minskyInputs);
    assert(
      Math.abs(fragility - 65.6) <= 0.05,
      `Minsky fragility ${fragility} must be 65.6 ± 0.05 on the frozen wave-1 canon`,
    );

    // 2. Refinancing-freeze probability — published 19.6% (0.196).
    const freezePct = doc.refiFreezeProbabilityPct(minskyInputs);
    const freezeProb = doc.refiFreezeProbability(minskyInputs);
    assert(
      Math.abs(freezePct - 19.6) <= 0.05,
      `Refinancing freeze ${freezePct}% must be 19.6 ± 0.05`,
    );
    assert(
      Math.abs(freezeProb - 0.196) <= 0.0005,
      `Refinancing freeze ${freezeProb} must be 0.196 ± 0.0005`,
    );

    // 3. Shiller Excess CAPE Yield — published +0.34% on the TIPS basis; the
    //    CPI-basis alternative (+1.71%, Normal band) is disclosed once on the page.
    const ecyInputs = {
      capeMultiple: FROZEN_ARTIFACT.shillerCape.aiCapeMultiple,
      us10yYieldPct: FROZEN_INPUTS.macro.us10yYieldPct,
      breakeven10yPct: Math.round((FROZEN_INPUTS.macro.us10yYieldPct - FROZEN_INPUTS.macro.realYield10y) * 100) / 100,
      cpiInflationYoY: FROZEN_INPUTS.macro.cpiInflationYoY,
    };
    const ecyTips = doc.excessCapeYieldPct(ecyInputs, 'tips');
    assert(Math.abs(ecyTips - 0.34) <= 0.05, `ECY (TIPS basis) ${ecyTips} must be 0.34 ± 0.05`);
    const ecyCpi = doc.excessCapeYieldPct(ecyInputs, 'cpi');
    assert(Math.abs(ecyCpi - 1.71) <= 0.05, `ECY (CPI basis) ${ecyCpi} must be 1.71 ± 0.05`);
    assert(
      doc.ecyBand(ecyCpi) === 'Normal (1.5–3.5%)',
      `the CPI-basis ECY must fall in the Normal band, got ${doc.ecyBand(ecyCpi)}`,
    );
    assert(
      doc.realYieldBasisLabel(ecyInputs, 'tips') === 'US10Y 5.10% − 10Y breakeven (TIPS) 2.35%',
      `the published real-yield label must name the TIPS basis, got "${doc.realYieldBasisLabel(ecyInputs, 'tips')}"`,
    );

    // 4. Merton distance-to-default — published 5.13σ, default probability below resolution.
    const mertonInputs = {
      assetValueUsd: FROZEN_ARTIFACT.merton.assetValueUsd,
      totalDebtUsd: FROZEN_INPUTS.aiDebt.totalTrackedDebtUsd,
      riskFreeRatePct: FROZEN_INPUTS.macro.us10yYieldPct,
      assetVolatilityPct: 36.5,
    };
    const dd = doc.mertonDistanceToDefault(mertonInputs);
    assert(Math.abs(dd - 5.13) <= 0.05, `Merton DD ${dd} must be 5.13 ± 0.05`);
    assert(
      doc.mertonDefaultProbabilityLabel(mertonInputs) === '<0.01%',
      `the default probability must be published as "<0.01%", got "${doc.mertonDefaultProbabilityLabel(mertonInputs)}"`,
    );

    // 5. Altman Z'' — published 8.41, with the X4 constant and its provenance exposed.
    const altmanZ = doc.altmanZScore();
    assert(Math.abs(altmanZ - 8.41) <= 0.005, `Altman Z'' ${altmanZ} must be 8.41`);
    assert(doc.ALTMAN_X4 === 7.21, `Altman X4 must be 7.21, got ${doc.ALTMAN_X4}`);
    assert(
      doc.ALTMAN_X4_PROVENANCE === 'assumed equity/debt, not ledger-derived',
      `the Altman X4 provenance label is wrong: "${doc.ALTMAN_X4_PROVENANCE}"`,
    );

    // 6. LPPLS hazard — published 81.5, and it is an index, never a probability.
    const hazard = doc.lpplsHazardIndex({
      cdsCurrentBps: FROZEN_INPUTS.cds.currentBps,
      capexToOcfRatio: FROZEN_INPUTS.aiDebt.capexToOcfRatio,
    });
    assert(Math.abs(hazard - 81.5) <= 0.05, `LPPLS hazard index ${hazard} must be 81.5 ± 0.05`);
    assert(
      doc.LPPLS_HAZARD_LABEL.includes('index, not a probability'),
      `the LPPLS label must say "index, not a probability", got "${doc.LPPLS_HAZARD_LABEL}"`,
    );

    // 7. The odds shift — an exact published constant.
    assert(doc.ODDS_SHIFT_PER_9_PTS === 2.72, `the odds shift must be exactly 2.72, got ${doc.ODDS_SHIFT_PER_9_PTS}`);
    assert(
      doc.ODDS_SHIFT_SENTENCE === 'a +9-point composite move multiplies the odds by 2.72× (50.0%→73.1%)',
      `the published odds sentence is wrong: "${doc.ODDS_SHIFT_SENTENCE}"`,
    );

    // 8. The two page formulas that were WRONG must now match the engine's own
    //    coefficients — checked against the pipeline mirror (the engine the
    //    pipeline and the test suite actually run).
    const mirror = fs.readFileSync(
      path.join(projectRoot, 'scripts', 'lib', 'quantitative-bubble-model.mjs'),
      'utf8',
    );
    for (const coefficient of ['* 0.90', '* 2.45', '* 2.065', '* 0.65', '* 4.394']) {
      assert(
        mirror.includes(coefficient),
        `the pipeline mirror must still carry the coefficient "${coefficient}" the page now publishes`,
      );
    }
    assert(
      doc.MODEL_DOC_FORMULAS.minsky_fragility.formula ===
        'F_Minsky = 0.90·Speculative% + 2.45·Ponzi% + 2.065·CDS_excess + 10·(capexToOcf − 0.548)',
      `the published Minsky formula is wrong: "${doc.MODEL_DOC_FORMULAS.minsky_fragility.formula}"`,
    );
    assert(
      doc.MODEL_DOC_FORMULAS.refi_freeze.formula === 'P(freeze) = 0.65·Ponzi% + 4.394·CDS_excess',
      `the published freeze formula is wrong: "${doc.MODEL_DOC_FORMULAS.refi_freeze.formula}"`,
    );

    // 9. The composite reconciliation the page prints (61.5 + 7.0 − 5.2 = 63.3)
    //    and the contagion term's leverage in probability points.
    const reconciliation = doc.reconcileComposite({
      riskPoints: 61.5,
      contagionPoints: 7.0,
      damperPoints: -5.2,
    });
    assert(reconciliation.compositeScore === 63.3, `the reconciled composite must be 63.3, got ${reconciliation.compositeScore}`);
    assert(
      Math.abs(reconciliation.leveragePoints - 17.9) <= 0.1,
      `the contagion leverage must be 17.9 ± 0.1 probability points, got ${reconciliation.leveragePoints}`,
    );

    // 10. The page must render the executed formulas, not a hand-typed copy.
    const page = fs.readFileSync(
      path.join(projectRoot, 'src', 'app', 'methodology', 'page.tsx'),
      'utf8',
    );
    assert(
      page.includes('MODEL_DOC_FORMULAS.minsky_fragility.formula') &&
        page.includes('MODEL_DOC_FORMULAS.refi_freeze.formula'),
      'the methodology page must render the executed Minsky and freeze formulas',
    );
    assert(
      page.includes('not ensemble members'),
      'the sub-model block must be labelled "not ensemble members"',
    );
    const lpplsPositions = [];
    const labelPositions = [];
    for (let i = page.indexOf('LPPLS'); i !== -1; i = page.indexOf('LPPLS', i + 1)) {
      lpplsPositions.push(i);
    }
    for (let i = page.indexOf('index, not a probability'); i !== -1; i = page.indexOf('index, not a probability', i + 1)) {
      labelPositions.push(i);
    }
    assert(
      lpplsPositions.length > 0 && labelPositions.length > 0,
      'the page must carry both the LPPLS panel and the "index, not a probability" label',
    );
    const labelIsNextToLppls = lpplsPositions.some((lp) =>
      labelPositions.some((lb) => Math.abs(lb - lp) < 2000),
    );
    assert(
      labelIsNextToLppls,
      'the LPPLS hazard label ("index, not a probability") must sit next to the LPPLS panel',
    );

    // 11. The 2000 episode note must say Lucent was ACQUIRED (Alcatel), not that
    //     it defaulted.
    assert(/Lucent[^\n]{0,240}acquired/i.test(page), 'the page must say Lucent was acquired');
    assert(
      !/Lucent[^\n]{0,240}defaulted/i.test(page),
      'the page must not claim Lucent defaulted',
    );

    // 12. Removed claims must be gone from the page.
    for (const stale of [
      '85%+',
      '±23%',
      '\\pm 23',
      '90% CI',
      '90% Conf Interval',
      '[64.7',
      '0.041',
      '91.7',
      '110%',
      '42.2, 79.0',
      '80.5',
      '82.7',
    ]) {
      assert(
        !page.includes(stale),
        `the methodology page must not publish the removed artifact "${stale}"`,
      );
    }

    // 13. The API route must publish the new shape: the changelog version, the
    //     coverage label, the ciType and the input-sensitivity range — and no
    //     deleted confidence interval.
    const route = fs.readFileSync(
      path.join(projectRoot, 'src', 'app', 'api', 'v1', 'model', 'route.ts'),
      'utf8',
    );
    assert(route.includes('model_version: MODEL_VERSION'), 'the route must publish the changelog model version');
    assert(route.includes('input_sensitivity_range'), 'the route must publish the input-sensitivity range');
    assert(route.includes('ci_type'), 'the route must publish the ciType label');
    assert(route.includes('coverage_label'), 'the route must publish the coverage label');
    assert(
      !route.includes('confidence_interval_90pct'),
      'the route must not publish the deleted confidence_interval_90pct field',
    );
    assert(
      !/model_version:\s*"2\.5\.0"/.test(route),
      'the route must not hardcode the old model version',
    );

    return `Fragility ${fragility.toFixed(1)} · freeze ${freezeProb.toFixed(3)} · ECY ${ecyTips.toFixed(2)}% (TIPS) / ${ecyCpi.toFixed(2)}% (CPI) · DD ${dd.toFixed(2)}σ · Altman ${altmanZ.toFixed(2)} · LPPLS ${hazard.toFixed(1)} · odds ${doc.ODDS_SHIFT_PER_9_PTS}× · composite ${reconciliation.compositeScore} (leverage ${reconciliation.leveragePoints} pts) · page strings verified.`;
  },
);

// ─────────────────────────────────────────────────────────────────────────────
// FORMATTED INSTITUTIONAL OUTPUT TABLE & SUMMARY
// ─────────────────────────────────────────────────────────────────────────────
console.log('');
console.log(`${c.cyan}${c.bold}╔══════════════════════════════════════════════════════════════════════════════════════════════╗${c.reset}`);
console.log(`${c.cyan}${c.bold}║       AI CAPITAL TRACKER — QUANTITATIVE ALGORITHM & MATHEMATICAL TEST SUITE (18/18)        ║${c.reset}`);
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
const totalTests = testResults.length;
const summaryBg = allPassed ? c.bgGreen : c.bgRed;
const summaryText = allPassed
  ? ` ALL ${passCount}/${totalTests} MATHEMATICAL TESTS PASSED `
  : ` FAILED ${failCount}/${totalTests} TESTS `;

console.log(`  ${summaryBg}${c.bold}${summaryText}${c.reset}  ${c.bold}Total Time: ${totalTimeMs.toFixed(1)}ms${c.reset}`);
console.log(`  ${c.dim}Brier over resolved episodes: BS <= 0.050 | Monte Carlo: 25k Paths Converged (SE <= 0.25%, heavy-tailed)${c.reset}`);
console.log('');

if (allPassed) {
  process.exit(0);
} else {
  process.exit(1);
}
