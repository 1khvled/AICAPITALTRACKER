#!/usr/bin/env node

/**
 * AI Capital Tracker — MODEL-ONLY artifact recompute (no fetching, no input mutation).
 *
 * WHAT IT DOES
 *   Reads the canonical input set (src/data/live-inputs.json) and the published
 *   artifact (src/data/latest-model.json), runs the model engine + the 25,000-path
 *   Monte Carlo, and rewrites ONLY the model-output fields of the artifact.
 *
 * WHAT IT DOES NOT DO
 *   · No network access. No input is fetched, re-derived or altered.
 *   · `_corrections` and `_verified` are preserved verbatim (a new `_verified` row is
 *     APPENDED — never rewritten).
 *   · It does not run `npm run build` and it does not commit.
 *
 * ENGINE
 *   Uses scripts/lib/quantitative-bubble-model.mjs — the same mirror the daily
 *   pipeline executes. src/lib/model/*.ts is the app copy; the two are held to
 *   byte-parity by scripts/test-algo.mjs test [16].
 *
 * USAGE
 *   node scripts/compute-artifact.mjs            # rewrite src/data/latest-model.json
 *   node scripts/compute-artifact.mjs --dry-run  # print the new numbers, write nothing
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  evaluateBubbleModel,
  runMonteCarloSimulation,
  computeMertonModel,
  computeAltmanZScore,
  computeMinskyModel,
  computeShillerCapeModel,
  computeLpplsMetrics,
  MODEL_VERSION,
} from './lib/quantitative-bubble-model.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const DRY_RUN = process.argv.includes('--dry-run');
const LIVE_INPUTS_PATH = path.join(projectRoot, 'src', 'data', 'live-inputs.json');
const ARTIFACT_PATH = path.join(projectRoot, 'src', 'data', 'latest-model.json');

const liveInputs = JSON.parse(fs.readFileSync(LIVE_INPUTS_PATH, 'utf8'));
const artifact = JSON.parse(fs.readFileSync(ARTIFACT_PATH, 'utf8'));

// ── 1. Evaluate the model on the canonical input set ──────────────────────────
const result = evaluateBubbleModel(liveInputs);
const mc = runMonteCarloSimulation(liveInputs, 25_000);
const merton = computeMertonModel(liveInputs);
const altman = computeAltmanZScore(liveInputs);
const minsky = computeMinskyModel(liveInputs);
const shiller = computeShillerCapeModel(liveInputs);
const lppls = computeLpplsMetrics(liveInputs);

// ── 2. Build the model-output blocks (key order = published key order) ─────────
const contributions = result.contributions.map((c) => ({
  id: c.id,
  label: c.label,
  kind: c.kind,
  weightPct: c.weightPct,
  earnedPoints: c.earnedPoints,
  reading: {
    score: c.reading.score,
    ...(c.reading.coreScore !== undefined ? { coreScore: c.reading.coreScore } : {}),
    reading: c.reading.reading,
    coverage: c.reading.coverage,
  },
}));

const mertonBlock = {
  distanceToDefault: merton.distanceToDefault,
  defaultProbabilityPct: merton.defaultProbabilityPct,
  structuralSpreadBps: merton.structuralSpreadBps,
  assetValueUsd: merton.assetValueUsd,
  totalDebtUsd: merton.totalDebtUsd,
  interpretation: merton.interpretation,
};

const altmanBlock = {
  score: altman.score,
  zone: altman.zone,
  impliedDistressProbPct: altman.impliedDistressProbPct,
  interpretation: altman.interpretation,
};

const minskyBlock = {
  hedgeSharePct: minsky.hedgeSharePct,
  speculativeSharePct: minsky.speculativeSharePct,
  ponziSharePct: minsky.ponziSharePct,
  minskyFragilityIndex: minsky.minskyFragilityIndex,
  currentRegime: minsky.currentRegime,
  refinancingFreezeProbabilityPct: minsky.refinancingFreezeProbabilityPct,
  breakdown: minsky.breakdown,
  interpretation: minsky.interpretation,
  fragilityIndex: minsky.fragilityIndex,
  regime: minsky.regime,
  ponziDebtSharePct: minsky.ponziDebtSharePct,
};

const shillerBlock = {
  aiCapeMultiple: shiller.aiCapeMultiple,
  historicalMedianCape: shiller.historicalMedianCape,
  earningsYieldPct: shiller.earningsYieldPct,
  real10yYieldPct: shiller.real10yYieldPct,
  excessCapeYieldPct: shiller.excessCapeYieldPct,
  equityRiskPremiumBand: shiller.equityRiskPremiumBand,
  equityRiskPremiumStatus: shiller.equityRiskPremiumStatus,
  interpretation: shiller.interpretation,
};

const lpplsBlock = {
  superExponentialExponent: lppls.superExponentialExponent,
  angularFrequency: lppls.angularFrequency,
  estimatedCriticalWindow: lppls.estimatedCriticalWindow,
  crashHazardRatePct: lppls.crashHazardRatePct,
  interpretation: lppls.interpretation,
};

// The Monte-Carlo block: the published ranges are the ONLY ranges (the hand-rolled
// factor-dispersion band was deleted in v2.6.0).
const monteCarloBlock = {
  iterationsCount: mc.iterationsCount,
  meanProbabilityPct: mc.meanProbabilityPct,
  medianProbabilityPct: mc.medianProbabilityPct,
  stdDevPct: mc.stdDevPct,
  variance: mc.variance,
  ci90Pct: mc.ci90Pct,
  ci95Pct: mc.ci95Pct,
  ciType: mc.ciType,
  bandLowPct: mc.bandLowPct,
  simulatedShockCorrelations: mc.simulatedShockCorrelations,
  innovationKurtosis: mc.innovationKurtosis,
  innovationExcessKurtosis: mc.innovationExcessKurtosis,
  valueAtRisk95Pct: mc.valueAtRisk95Pct,
  conditionalValueAtRisk95Pct: mc.conditionalValueAtRisk95Pct,
  valueAtRisk99Pct: mc.valueAtRisk99Pct,
  conditionalValueAtRisk99Pct: mc.conditionalValueAtRisk99Pct,
  skewness: mc.skewness,
  kurtosis: mc.kurtosis,
  histogram: mc.histogram,
  executionTimeMs: mc.executionTimeMs,
};

// ── 3. Rewrite the artifact, preserving key order and the untouched blocks ─────
const next = {};
for (const [key, value] of Object.entries(artifact)) {
  switch (key) {
    case 'model_version':
      next[key] = MODEL_VERSION;
      break;
    case 'burstProbability':
      next[key] = result.burstProbability;
      break;
    case 'compositeScore':
      next[key] = result.compositeScore;
      break;
    case 'band':
      next[key] = result.band;
      break;
    case 'coverage':
      next[key] = result.coverage;
      break;
    case 'confidenceInterval':
      // REMOVED in v2.6.0: the hand-rolled factor-dispersion band is deleted. The only
      // published ranges are monteCarlo.ci90Pct / monteCarlo.ci95Pct (ciType-labelled).
      break;
    case 'fragilityIndex':
      next[key] = result.fragilityIndex;
      break;
    case 'systemicContagionPoints':
      next[key] = result.systemicContagionPoints;
      break;
    case 'topDriverIds':
      next[key] = result.topDriverIds;
      break;
    case 'contributions':
      next[key] = contributions;
      break;
    case 'merton':
      next[key] = mertonBlock;
      break;
    case 'altman':
      next[key] = altmanBlock;
      break;
    case 'lppls':
      next[key] = lpplsBlock;
      break;
    case 'minsky':
      next[key] = minskyBlock;
      break;
    case 'shillerCape':
      next[key] = shillerBlock;
      break;
    case 'monteCarlo':
      next[key] = monteCarloBlock;
      break;
    default:
      // timestamp, _corrections, _verified and any future key: preserved verbatim.
      next[key] = value;
  }
}

// Append the wave-1 verification row (never rewrite an existing one). The append is
// IDEMPOTENT: re-running this script replaces its own row instead of duplicating it.
const verifiedRow = {
  date: '2026-10-19',
  note: 'wave-1 algorithm summit: credit convex tail (ratio-space, cap 2.0, no print change), HY panic tail, deflation un-saturation, MC 12m σ + mixture + opened clamps + CORR(CDS,HY)≈0.8, sensitivity-band relabel — deterministic print bit-identical 71.6/63.3, MC re-derived, verified vs mirror',
};
const existingVerified = Array.isArray(next._verified) ? next._verified : [];
const withoutDuplicate = existingVerified.filter(
  (row) => !(row && row.date === verifiedRow.date && row.note === verifiedRow.note),
);
next._verified = [...withoutDuplicate, verifiedRow];

// ── 4. Write (or print) ───────────────────────────────────────────────────────
if (!DRY_RUN) {
  fs.writeFileSync(ARTIFACT_PATH, `${JSON.stringify(next, null, 2)}\n`, 'utf8');
}

// ── 5. Report the new published numbers ───────────────────────────────────────
const out = {
  model_version: next.model_version,
  probability: result.burstProbability,
  composite: result.compositeScore,
  band: result.band,
  coverage: result.coverage,
  damperCoverage: result.damperCoverage,
  fragilityIndex: result.fragilityIndex,
  systemicContagionPoints: result.systemicContagionPoints,
  mc: {
    iterationsCount: mc.iterationsCount,
    mean: mc.meanProbabilityPct,
    median: mc.medianProbabilityPct,
    stdDev: mc.stdDevPct,
    skewness: mc.skewness,
    kurtosis_output: mc.kurtosis,
    kurtosis_innovation: mc.innovationKurtosis,
    excessKurtosis_innovation: mc.innovationExcessKurtosis,
    var95: mc.valueAtRisk95Pct,
    cvar95: mc.conditionalValueAtRisk95Pct,
    var99: mc.valueAtRisk99Pct,
    cvar99: mc.conditionalValueAtRisk99Pct,
    var95_99_spread: Math.round((mc.valueAtRisk99Pct - mc.valueAtRisk95Pct) * 10) / 10,
    ci90: mc.ci90Pct,
    ci95: mc.ci95Pct,
    bandLow: mc.bandLowPct,
    ciType: mc.ciType,
    corrCdsHy: mc.simulatedShockCorrelations.cdsHy,
    executionTimeMs: mc.executionTimeMs,
  },
  written: !DRY_RUN ? ARTIFACT_PATH : '(dry run — nothing written)',
};

console.log('── compute-artifact ───────────────────────────────────────────────');
for (const [k, v] of Object.entries(out)) {
  if (k === 'mc') continue;
  console.log(`  ${k.padEnd(22)} ${JSON.stringify(v)}`);
}
console.log('  monteCarlo:');
for (const [k, v] of Object.entries(out.mc)) {
  console.log(`    ${k.padEnd(24)} ${JSON.stringify(v)}`);
}
console.log('───────────────────────────────────────────────────────────────────');
