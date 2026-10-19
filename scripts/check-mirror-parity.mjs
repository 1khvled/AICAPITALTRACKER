#!/usr/bin/env node

/**
 * AI Capital Tracker — TS ↔ MJS MIRROR BYTE-PARITY HARNESS.
 *
 * The pipeline and the test suite execute scripts/lib/quantitative-bubble-model.mjs;
 * the Next.js app executes src/lib/model/*.ts. Both are the same model, and this
 * harness PROVES it on the live canonical input set by:
 *   1. transpiling the four TS model files to CommonJS with the project's own
 *      TypeScript (no network, no build step),
 *   2. rewriting the single path-alias import ('@/data/live-inputs.json') to an
 *      absolute path,
 *   3. evaluating both engines on src/data/live-inputs.json,
 *   4. comparing composite score, burst probability, fragility index and the
 *      Monte-Carlo moments to 1e-9.
 *
 * Exit code 0 = parity, 1 = divergence. Prints a JSON report on stdout.
 */

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const require = createRequire(import.meta.url);

const TOLERANCE = 1e-9;

// Prefer the approved scratch directory; fall back to the OS temp dir.
const preferredTmp = path.join(
  process.env.LOCALAPPDATA || os.homedir(),
  'AppData',
  'Local',
  'Temp',
  'opencode',
);
const tmpRoot = fs.existsSync(preferredTmp) ? preferredTmp : os.tmpdir();
const workDir = path.join(tmpRoot, 'aict-mirror-parity');
const outDir = path.join(workDir, 'tsc-out');

const MODEL_FILES = ['types.ts', 'factors.ts', 'quantitative.ts', 'engine.ts'];
const LIVE_INPUTS_PATH = path.join(projectRoot, 'src', 'data', 'live-inputs.json');
const LIVE_INPUTS_JSON = path
  .relative(outDir, LIVE_INPUTS_PATH)
  .split(path.sep)
  .join('/');

function fail(message) {
  console.error(`mirror-parity: ${message}`);
  process.exit(1);
}

let ts;
try {
  ts = require('typescript');
} catch (err) {
  fail(`typescript is not installed (devDependency) — cannot run the parity harness: ${err.message}`);
}

// ── 1. Transpile the TS model to CommonJS ─────────────────────────────────────
fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(outDir, { recursive: true });

for (const file of MODEL_FILES) {
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
  let js = outputText;
  if (file === 'engine.ts') {
    // Rewrite the single path-alias import to an absolute relative path.
    js = js.replace(/require\(["']@\/data\/live-inputs\.json["']\)/g, `require("${LIVE_INPUTS_JSON}")`);
  }
  fs.writeFileSync(path.join(outDir, file.replace(/\.ts$/, '.js')), js, 'utf8');
}

if (!fs.readFileSync(path.join(outDir, 'engine.js'), 'utf8').includes('live-inputs.json')) {
  fail('the live-inputs.json import was not rewritten — parity harness is invalid');
}

// ── 2. Evaluate both engines on the live canon ────────────────────────────────
const liveInputs = JSON.parse(fs.readFileSync(LIVE_INPUTS_PATH, 'utf8'));

const tsEngine = require(path.join(outDir, 'engine.js'));
const mirror = await import('./lib/quantitative-bubble-model.mjs');

const tsResult = tsEngine.evaluateBubbleModel(liveInputs);
const mirrorResult = mirror.evaluateBubbleModel(liveInputs);

const tsMc = tsEngine.runMonteCarloSimulation(liveInputs, 25_000);
const mirrorMc = mirror.runMonteCarloSimulation(liveInputs, 25_000);

const comparisons = [
  ['compositeScore', tsResult.compositeScore, mirrorResult.compositeScore],
  ['burstProbability', tsResult.burstProbability, mirrorResult.burstProbability],
  ['fragilityIndex', tsResult.fragilityIndex, mirrorResult.fragilityIndex],
  ['systemicContagionPoints', tsResult.systemicContagionPoints, mirrorResult.systemicContagionPoints],
  ['coverage', tsResult.coverage, mirrorResult.coverage],
  ['damperCoverage', tsResult.damperCoverage, mirrorResult.damperCoverage],
  ['mc.meanProbabilityPct', tsMc.meanProbabilityPct, mirrorMc.meanProbabilityPct],
  ['mc.medianProbabilityPct', tsMc.medianProbabilityPct, mirrorMc.medianProbabilityPct],
  ['mc.valueAtRisk95Pct', tsMc.valueAtRisk95Pct, mirrorMc.valueAtRisk95Pct],
  ['mc.valueAtRisk99Pct', tsMc.valueAtRisk99Pct, mirrorMc.valueAtRisk99Pct],
  ['mc.ci95Pct[0]', tsMc.ci95Pct[0], mirrorMc.ci95Pct[0]],
  ['mc.ci95Pct[1]', tsMc.ci95Pct[1], mirrorMc.ci95Pct[1]],
  ['mc.simulatedShockCorrelations.cdsHy', tsMc.simulatedShockCorrelations.cdsHy, mirrorMc.simulatedShockCorrelations.cdsHy],
];

const divergences = comparisons
  .map(([name, tsValue, mirrorValue]) => ({
    name,
    ts: tsValue,
    mirror: mirrorValue,
    diff: Math.abs(Number(tsValue) - Number(mirrorValue)),
  }))
  .filter((c) => !(c.diff <= TOLERANCE));

const report = {
  tolerance: TOLERANCE,
  checks: comparisons.length,
  divergences: divergences.length,
  detail: divergences,
  ts: {
    compositeScore: tsResult.compositeScore,
    burstProbability: tsResult.burstProbability,
    fragilityIndex: tsResult.fragilityIndex,
  },
  mirror: {
    compositeScore: mirrorResult.compositeScore,
    burstProbability: mirrorResult.burstProbability,
    fragilityIndex: mirrorResult.fragilityIndex,
  },
};

console.log(JSON.stringify(report, null, 2));
process.exit(divergences.length === 0 ? 0 : 1);
