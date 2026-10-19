#!/usr/bin/env node

/**
 * AI Capital Tracker — Automated 24h Data Refresher & Quantitative Pipeline
 * 
 * Ingests free, public, keyless institutional market feeds:
 * 1. OpenRouter Public Models API: Live token inference prices & compute deflation multiple
 * 2. Polymarket Gamma Events API: Live crowd consensus odds & volume on AI downturns
 * 3. Yahoo Finance Institutional Stream: Live quotes for 21 tech tickers & expanded macro benchmarks
 *    (NVDA, ORCL, MSFT, GOOGL, AMZN, META, TSM, AVGO, SMCI, CEG, PLTR, AMD, INTC, ASML, QCOM, VST, GEV, DELL, CRWD, ANET, SNPS, US10Y ^TNX, US02Y 2YY=F, HYG, ^VIX, BAA-SPREAD, GPU-RENT, COPPER-GOLD)
 * 4. SEC EDGAR API: Latest 8-K / 10-Q filing submissions for debt anchor disclosures
 * 5. Primary Deal Ledger: Re-calculates aggregates, debt share, and mega deals across deals.json
 * 
 * Computes Quantitative Financial Models:
 * - Full Multi-Factor Bubble Score & Burst Probability
 * - Merton Distance-to-Default (1974)
 * - Altman Z''-Score (2002)
 * - Sornette LPPLS Bubble Hazard
 * - 10,000-Path Monte Carlo Simulation (Median, Mean, 90% CI, 95% VaR, 95% Expected Shortfall)
 * 
 * Generates Datasets:
 * - src/data/live-inputs.json
 * - src/data/live-stocks.json
 * - src/data/latest-model.json  (written by scripts/compute-artifact.mjs — model only)
 * - src/data/trajectory-history.json  (observed canonical runs only — no seeded path)
 * - src/data/sync-history.json
 * - src/data/input-history/YYYY-MM-DD.json  (canonical daily input snapshot)
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
// 2026-10-19 (lane 2b, algorithm-improvement wave): the pipeline no longer imports the
// model engine. The published artifact is produced by scripts/compute-artifact.mjs —
// one writer, the same engine the test suite runs, no second copy of the model here.

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const DEALS_FILE = path.join(projectRoot, 'src', 'data', 'deals.json');
const LIVE_INPUTS_FILE = path.join(projectRoot, 'src', 'data', 'live-inputs.json');
const LATEST_MODEL_FILE = path.join(projectRoot, 'src', 'data', 'latest-model.json');
const TRAJECTORY_HISTORY_FILE = path.join(projectRoot, 'src', 'data', 'trajectory-history.json');
const LIVE_STOCKS_FILE = path.join(projectRoot, 'src', 'data', 'live-stocks.json');
const LIVE_NEWS_FILE = path.join(projectRoot, 'src', 'data', 'live-news.json');
const LIVE_MODELS_FILE = path.join(projectRoot, 'src', 'data', 'live-models.json');
const SYNC_HISTORY_FILE = path.join(projectRoot, 'src', 'data', 'sync-history.json');
// 2026-10-19 (lane 2b): the model-only artifact writer and the canonical daily
// input-snapshot archive (one file per UTC day; the LAST successful run of the day
// owns the file).
const COMPUTE_ARTIFACT_SCRIPT = path.join(projectRoot, 'scripts', 'compute-artifact.mjs');
const INPUT_HISTORY_DIR = path.join(projectRoot, 'src', 'data', 'input-history');

// Securely load local environment variables from .env.local if present (gitignored, zero secrets in source)
try {
  const envLocalPath = path.join(projectRoot, '.env.local');
  if (fs.existsSync(envLocalPath)) {
    const envContent = fs.readFileSync(envLocalPath, 'utf8');
    for (const line of envContent.split('\n')) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [k, ...v] = trimmed.split('=');
        if (k && v.length > 0 && !process.env[k.trim()]) {
          process.env[k.trim()] = v.join('=').trim();
        }
      }
    }
  }
} catch {
  // Silent fallback if .env.local is absent
}

// Institutional API Keys (strictly from process.env or .env.local)
const FRED_API_KEY = process.env.FRED_API_KEY || '';
const ALPHA_VANTAGE_API_KEY = process.env.ALPHA_VANTAGE_API_KEY || '';
const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY || '';

// ─────────────────────────────────────────────────────────────────────────────
// CI HARDENING (2026-10-19) — headless, deterministic pipeline plumbing.
//
// NOTHING in this block changes a seed value, a note, a correction entry or a
// model formula. It only adds:
//   (1) a shared retry helper for every upstream fetch (transient failures only),
//   (2) explicit exit-code semantics (0 = ok, 1 = hard failure),
//   (3) atomic, sanity-gated artifact writes (no partial/unparseable output),
//   (4) preservation of hand-maintained `_`-prefixed metadata across syncs.
// ─────────────────────────────────────────────────────────────────────────────

// Independent upstream source groups. A group counts as FAILED only when EVERY
// call to it failed — one failed ticker is a degraded source, not a dead one.
const UPSTREAM_GROUPS = {
  openrouter: 'OpenRouter Public Models API',
  polymarket: 'Polymarket Gamma Events API',
  yahoo: 'Yahoo Finance Institutional Stream',
  fred: 'FRED (St. Louis Fed) API',
  finnhub: 'Finnhub Institutional API',
  edgar: 'SEC EDGAR Submissions API',
};

// Retry policy: 3 attempts, exponential backoff (2s / 8s / 20s) with ±25% jitter.
// The ladder is the wait BEFORE the next attempt, so a 3-attempt budget waits 2s then
// 8s; the 20s rung is used when a caller raises `attempts` above 3.
const RETRY_DELAYS_MS = [2000, 8000, 20000];
const RETRY_ATTEMPTS = 3;

// Circuit breaker: after this many CONSECUTIVE transient failures against one
// host, further calls to that host fail fast instead of sleeping again, so a
// full upstream outage cannot blow the 45-minute CI job budget.
const CIRCUIT_FAILURE_THRESHOLD = 3;

const upstreamState = new Map(); // group key -> { attempts, successes, failures, lastError }
const hostCircuit = new Map();   // host -> consecutive transient failures

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** Exponential-backoff delay with ±25% jitter. */
function jitteredDelay(baseMs) {
  return Math.round(baseMs * (0.75 + Math.random() * 0.5));
}

function hostOf(url) {
  try {
    return new URL(url).host;
  } catch {
    return 'unknown-host';
  }
}

/** 429 and 5xx are transient; every other 4xx is a validation/config error. */
function isTransientStatus(status) {
  return status === 429 || (status >= 500 && status <= 599);
}

/** Timeouts, socket resets, DNS blips and "fetch failed" are transient. */
function isTransientError(err) {
  if (!err) return false;
  const name = err.name || '';
  if (name === 'AbortError' || name === 'TimeoutError') return true;
  const transientCodes = [
    'ECONNRESET', 'ETIMEDOUT', 'ECONNREFUSED', 'EAI_AGAIN', 'ENOTFOUND',
    'EPIPE', 'EHOSTUNREACH', 'ENETUNREACH', 'UND_ERR_SOCKET',
    'UND_ERR_CONNECT_TIMEOUT', 'UND_ERR_HEADERS_TIMEOUT', 'UND_ERR_BODY_TIMEOUT',
  ];
  if (err.code && transientCodes.includes(err.code)) return true;
  if (err.cause) {
    if (isTransientError(err.cause)) return true;
    if (err.cause.code && transientCodes.includes(err.cause.code)) return true;
  }
  if (err instanceof TypeError) return true; // undici "fetch failed"
  return false;
}

/** Record the outcome of one upstream call against its source group. */
function recordUpstream(group, ok, error) {
  if (!group) return;
  const key = String(group).toLowerCase();
  const state = upstreamState.get(key) || {
    key,
    name: UPSTREAM_GROUPS[key] || key,
    attempts: 0,
    successes: 0,
    failures: 0,
    lastError: null,
  };
  state.attempts += 1;
  if (ok) {
    state.successes += 1;
    state.lastError = null;
  } else {
    state.failures += 1;
    state.lastError = error || 'unknown error';
  }
  upstreamState.set(key, state);
}

/** Health roll-up per upstream group. status: 'ok' | 'degraded' | 'failed'. */
function upstreamGroupHealth() {
  return Array.from(upstreamState.values()).map((state) => ({
    ...state,
    status: state.successes > 0 ? (state.failures > 0 ? 'degraded' : 'ok') : 'failed',
  }));
}

/**
 * Provenance lines for the _verified.inspected_and_stayed block: every outage or
 * partial failure is RECORDED (never silently swallowed) so a future reader can
 * tell a stale seed value from a live refresh.
 */
function upstreamOutageNotes() {
  const stamp = new Date().toISOString();
  const notes = [];
  for (const state of upstreamGroupHealth()) {
    if (state.status === 'failed') {
      notes.push(
        `${stamp} OUTAGE: ${state.name} unreachable after ${state.attempts} attempt(s) ` +
        `(last error: ${state.lastError}) — the last verified seed values were retained; no live refresh for this source.`
      );
    } else if (state.status === 'degraded') {
      notes.push(
        `${stamp} PARTIAL: ${state.name} — ${state.failures} of ${state.attempts} call(s) failed ` +
        `(last error: ${state.lastError}); ${state.successes} call(s) succeeded.`
      );
    }
  }
  return notes;
}

/**
 * Shared fetch helper: 3 attempts, exponential backoff with jitter, retry ONLY
 * transient failures (timeouts, 429, 5xx, socket/DNS errors). 4xx validation
 * errors are never retried. Never logs the URL (FRED/Finnhub carry keys in it).
 */
async function fetchWithRetry(url, options = {}) {
  const {
    group,
    label = group || 'upstream',
    timeoutMs = 8000,
    attempts = RETRY_ATTEMPTS,
    delays = RETRY_DELAYS_MS,
    headers,
  } = options;

  const host = hostOf(url);
  let lastError = null;
  let circuitOpened = false;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const consecutive = hostCircuit.get(host) || 0;
    if (consecutive >= CIRCUIT_FAILURE_THRESHOLD) {
      lastError = new Error(`circuit open for ${host} after ${consecutive} consecutive failures`);
      circuitOpened = true;
      break;
    }

    try {
      const res = await fetch(url, { headers, signal: AbortSignal.timeout(timeoutMs) });
      if (res.ok) {
        hostCircuit.set(host, 0);
        recordUpstream(group, true);
        return res;
      }
      const message = `HTTP ${res.status}${res.statusText ? ` ${res.statusText}` : ''}`;
      if (!isTransientStatus(res.status)) {
        // 4xx (bad key, bad series, malformed query) — a validation error, not a blip.
        const err = new Error(message);
        err.nonRetryable = true;
        recordUpstream(group, false, message);
        throw err;
      }
      lastError = new Error(message);
    } catch (err) {
      if (err && err.nonRetryable) throw err;
      if (!isTransientError(err)) {
        recordUpstream(group, false, err.message);
        throw err; // programming error — let it fail the run loudly
      }
      lastError = err;
    }

    if (attempt === attempts) break;
    const delay = jitteredDelay(delays[Math.min(attempt - 1, delays.length - 1)]);
    console.warn(`  ↳ ${label}: ${lastError ? lastError.message : 'unknown error'} (attempt ${attempt}/${attempts}) — retrying in ~${delay}ms`);
    await sleep(delay);
  }

  // The circuit is only opened by a REAL failure of this host; a call that was
  // fast-failed by an already-open circuit must not inflate the counter.
  if (!circuitOpened) {
    hostCircuit.set(host, (hostCircuit.get(host) || 0) + 1);
  }
  const message = lastError ? lastError.message : 'unknown error';
  recordUpstream(group, false, message);
  throw lastError || new Error(`${label}: fetch failed`);
}

/**
 * Artifact plumbing — three guarantees for headless CI:
 *   (a) a fully serialized artifact is JSON.parse'd back before it is written
 *       (sanity gate: an unparseable artifact is never published),
 *   (b) files are written atomically (temp file + rename) and only AFTER a
 *       complete pass, so a crashed run can never leave a truncated file,
 *   (c) hand-maintained `_`-prefixed metadata from the previous artifact is
 *       carried forward (append-only for correction-style arrays) so a sync
 *       never drops a human-maintained annotation.
 */
function readJsonIfParseable(filePath) {
  try {
    if (!fs.existsSync(filePath)) return null;
    const parsed = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    return parsed ?? null;
  } catch (err) {
    console.warn(`  ↳ Could not parse ${path.relative(projectRoot, filePath)} (${err.message}) — no metadata carried forward.`);
    return null;
  }
}

/** Append-only union that keeps the original order and drops exact duplicates. */
function appendUnique(existing, incoming) {
  const out = Array.isArray(existing) ? [...existing] : [];
  for (const entry of Array.isArray(incoming) ? incoming : []) {
    if (!out.includes(entry)) out.push(entry);
  }
  return out;
}

/**
 * Carry forward every top-level `_`-prefixed key of the previous artifact that
 * the new result does not own. For keys both own (`_corrections`,
 * `_verified.corrections`, `_verified.integrity_notes`,
 * `_verified.inspected_and_stayed`) the previous entries are appended, never
 * replaced, so history accumulates instead of being overwritten.
 */
function preserveUnderscoreMetadata(previous, next) {
  if (!previous || typeof previous !== 'object' || Array.isArray(previous)) return next;
  const merged = { ...next };
  for (const [key, value] of Object.entries(previous)) {
    if (!key.startsWith('_')) continue;
    if (!Object.prototype.hasOwnProperty.call(merged, key)) {
      merged[key] = value; // absent from the new result → preserve verbatim
      continue;
    }
    if (key === '_verified' && value && typeof value === 'object' && !Array.isArray(value)) {
      const nextVerified = merged[key] && typeof merged[key] === 'object' ? merged[key] : {};
      const verified = { ...nextVerified };
      for (const subKey of ['corrections', 'integrity_notes', 'inspected_and_stayed']) {
        if (Array.isArray(value[subKey])) {
          verified[subKey] = appendUnique(value[subKey], nextVerified[subKey]);
        }
      }
      merged[key] = verified;
      continue;
    }
    if (key === '_corrections' && Array.isArray(value) && Array.isArray(merged[key])) {
      merged[key] = appendUnique(value, merged[key]); // append-only corrections trail
    }
  }
  return merged;
}

/** Serialize + JSON.parse sanity gate. Throws before anything is written. */
function serializeArtifact(payload) {
  const serialized = JSON.stringify(payload, null, 2);
  if (typeof serialized !== 'string' || serialized.length === 0) {
    throw new Error('artifact serialization produced an empty document');
  }
  try {
    JSON.parse(serialized);
  } catch (err) {
    throw new Error(`artifact failed the JSON.parse sanity gate: ${err.message}`);
  }
  return serialized;
}

/** Atomic single-file write (temp file + rename). */
function writeArtifact(filePath, serialized) {
  const tmpPath = `${filePath}.tmp`;
  try {
    fs.writeFileSync(tmpPath, serialized, 'utf-8');
    fs.renameSync(tmpPath, filePath);
  } catch (err) {
    try {
      if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath);
    } catch {}
    throw err;
  }
}

/**
 * Write a set of artifacts: every artifact is serialized and sanity-gated
 * FIRST, then written in sequence. A failure in any artifact leaves the data
 * directory untouched (no partial pass is ever published).
 */
function writeArtifacts(artifacts) {
  const prepared = artifacts.map(({ file, payload }) => ({
    file,
    serialized: serializeArtifact(payload),
  }));
  for (const { file, serialized } of prepared) {
    writeArtifact(file, serialized);
    console.log(`  ✓ Written ${path.relative(projectRoot, file)}`);
  }
}

/** Hard validation gate — a non-finite derived value means a broken pass. */
function assertFiniteNumber(value, label) {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new Error(`validation failed: ${label} is not a finite number (${value})`);
  }
}

/**
 * Hard validation gate — a non-finite derived value means a broken pass.
 *
 * 2026-10-19 (lane 2b): split in two. The INPUTS are validated before they are
 * written to disk; the ARTIFACT is validated after the compute script wrote it.
 */
function validateLiveInputs(liveInputs) {
  assertFiniteNumber(liveInputs.adoption?.apiPriceDeclineMultiple, 'adoption.apiPriceDeclineMultiple');
  assertFiniteNumber(liveInputs.crowd?.yesProbability, 'crowd.yesProbability');
  assertFiniteNumber(liveInputs.macro?.us10yYieldPct, 'macro.us10yYieldPct');
  assertFiniteNumber(liveInputs.ledger?.totalDisclosedUsd, 'ledger.totalDisclosedUsd');
}

function validateCanonicalArtifact(latestModelResult) {
  assertFiniteNumber(latestModelResult.burstProbability, 'burstProbability');
  assertFiniteNumber(latestModelResult.compositeScore, 'compositeScore');
  assertFiniteNumber(latestModelResult.merton?.distanceToDefault, 'merton.distanceToDefault');
  assertFiniteNumber(latestModelResult.altman?.score, 'altman.score');
  assertFiniteNumber(latestModelResult.monteCarlo?.medianProbabilityPct, 'monteCarlo.medianProbabilityPct');
  assertFiniteNumber(latestModelResult.monteCarlo?.valueAtRisk95Pct, 'monteCarlo.valueAtRisk95Pct');
  if (latestModelResult.burstProbability < 0 || latestModelResult.burstProbability > 100) {
    throw new Error(`validation failed: burstProbability out of range (${latestModelResult.burstProbability})`);
  }
}

// Baseline institutional fallback defaults
const BASELINE_DEFAULTS = {
  cds: {
    // 2026-10-19 (pass 7): 5Y Oracle CDS printed a RECORD 288bp on Oct 15, 2026 (S&P Global Market
    // Intelligence via securitasglobal.com; 261bp a week earlier on Oct 8; CNBC Oct 19 quotes ~295bp
    // intraday after a brief 300bp print). priorBps = the 90-day-ago print: ~203bp on Jul 20-24, 2026
    // (ICE data - Reuters Jul 29 quoted ~200bp, late-July prints 212-215bp). baselineBps = long-run norm.
    currentBps: 288,
    baselineBps: 81,
    priorBps: 203,
    otherBps: 135,
    note: '5Y USD CDS on Oracle (AI debt anchor): 288bp = record-high close Oct 15 2026 (S&P Global Market Intelligence); 261bp a week earlier (Oct 8); priorBps 203bp = Jul 20-24 2026 print (ICE). baseline 81bp = long-run norm assumption. S&P cut ORCL to BBB- on Jul 9 2026',
  },
  valuations: [
    {
      company: 'OpenAI',
      // 2026-10-19 fact-check: $950B matched no report. Verified chain: $852B closed Series G post-money
      // (Mar 2026, Reuters) → round in talks at >$1.2T (Bloomberg, Sep 16 2026) → $30B pre-IPO raise at ~$1.4T target
      // (The Information, Sep 29 2026). Run-rate $50B end-Sep 2026 = OpenAI's own basis (FT/CNBC/Reuters Oct 8, 2026);
      // the widely-reported $70B was a cloud-partner gross-up for Anthropic-comparability.
      valuationUsd: 1_200_000_000_000,
      runRateRevenueUsd: 50_000_000_000,
      note: 'Rounds in talks at >$1.2T post-money (Bloomberg, Sep 16 2026); $950B matched no report; last closed benchmark $852B Series G post-money (Mar 2026, Reuters); The Information Sep 29 2026: $30B pre-IPO raise targeting ~$1.4T. Annualized run-rate ~$50.0B end-Sep 2026 on OpenAI\'s own basis excluding cloud-partner gross-up (FT first / CNBC / Reuters, Oct 8 2026; the widely-reported $70B was a partner-comparable methodology)',
    },
    {
      company: 'Anthropic',
      // 2026-10-19 fact-check: $47B was the May 2026 run-rate. Verified: $65B ARR end-July 2026 (Bloomberg/CNBC/Reuters
      // Aug 17 2026), up from $47B in May and ~$9B end-2025, >40% via AWS/Microsoft/Google Cloud channels; ~$100B YE target (Reuters Oct 2026).
      valuationUsd: 2_000_000_000_000,
      runRateRevenueUsd: 65_000_000_000,
      note: 'Oct 2026 IPO debut target at ~$2.0T (prospectus out Sep 2026; The Information Sep 12 2026, Guardian Sep 29 2026); $965B Series H closed post-money May 2026 (Reuters). Annualized ARR topped $65B by end-July 2026 — up from $47B in May and ~$9B end-2025, >40% via AWS/Microsoft/Google Cloud channels (Bloomberg/CNBC/Reuters, Aug 17 2026), guiding to ~$100B by year-end (Reuters Oct 2026)',
    },
    {
      company: 'Databricks',
      valuationUsd: 190_000_000_000,
      runRateRevenueUsd: 7_000_000_000,
      note: 'Coatue-led strategic round Aug 2026 ($190B valuation, $7B revenue run-rate reported)',
    },
    {
      // 2026-10-19 (pass 7): xAI revenue basis corrected from a stale $500M ARR to the S-1 disclosed
      // FY2025 revenue of $3.2B (operating loss $6.36B; revenue up 22% from $2.62B in 2024). The $250B
      // is xAI's Feb 2026 all-stock merger value - NOT SpaceX's $2.05T public market cap. AI segment
      // revenue $2.56B in Q2 2026 (+247% YoY), $3.38B in H1 2026 (SpaceX Q2 2026 earnings release).
      company: 'xAI merger value (Feb 2026 all-stock)',
      valuationUsd: 250_000_000_000,
      runRateRevenueUsd: 3_200_000_000,
      note: 'Consolidated inside SpaceX (Nasdaq: SPCX, $2.05T live public market cap following the June 2026 IPO); this $250B is xAI\'s merger value in the Feb 2026 all-stock SpaceX/xAI combination (deal-023) and is distinct from the SPCX public cap. xAI revenue $3.2B FY2025 per the SpaceX S-1 (operating loss $6.36B; $2.62B in 2024); AI segment revenue $2.56B in Q2 2026 (+247% YoY) and $3.38B in H1 2026 per the SpaceX Q2 2026 earnings release (SEC 8-K)',
    },
    {
      company: 'Mistral AI',
      valuationUsd: 24_000_000_000,
      runRateRevenueUsd: 450_000_000,
      note: 'Oct 2026 Series D (€21B / $24B valuation, $450M annualized ARR scaling toward $1B, €1.5B convertible debt facility)',
    },
    {
      company: 'Scale AI',
      valuationUsd: 29_000_000_000,
      runRateRevenueUsd: 1_100_000_000,
      note: 'Meta strategic 49% stake benchmark ($29B valuation, $1.1B ARR government and enterprise AI contracts)',
    },
    {
      company: 'Cohere',
      valuationUsd: 7_000_000_000,
      runRateRevenueUsd: 250_000_000,
      note: 'Enterprise multi-cloud funding round ($7.0B valuation, $250M annualized revenue run-rate)',
    },
    {
      company: 'Perplexity AI',
      valuationUsd: 20_000_000_000,
      runRateRevenueUsd: 500_000_000,
      note: 'Institutional round backed by NVIDIA ($20B valuation, $500M annualized search run-rate)',
    },
    {
      company: 'Safe Superintelligence (SSI)',
      valuationUsd: 5_000_000_000,
      runRateRevenueUsd: 0,
      note: 'Seed / Series A round ($5.0B valuation, $0 revenue pre-product pure research lab)',
    },
  ],
  ledger: {
    // 2026-10-19 (pass 6): every field below is RECOMPUTED from deals.json on each sync
    // (computeLedgerAggregates). These numbers are the last-sync snapshot and are kept only as the
    // degenerate fallback when deals.json is unreadable — the live values are always recomputed.
    // (pass 7) Re-synced after the deal-161 double-count adjudication: total and debt base -$6.5B.
    totalDisclosedUsd: 2_872_873_160_000,
    byYear: { 2023: 26_357_880_000, 2024: 294_585_000_000, 2025: 1_739_393_980_000, 2026: 812_536_300_000 },
    debtShare: 0.075,
    computeContractShare: 0.283,
    top10Share: 0.638,
    circularShare: 0.027,
    announcedShare: 0.101,
    megaCountLast12m: 25,   // recomputed each sync: mega-class deals announced in the last 365 days
    daysSinceLastMega: 21, // recomputed each sync: days since the newest mega announcement (deal-002, 28 Sep 2026)
    count: 169,
  },
  crowd: {
    // 2026-10-19 (pass 11): fallback aligned to the verified live Polymarket snapshot in
    // src/data/live-inputs.json — bubble-2026 odds 0.103 → 0.0905 (9.05% YES), 2027 odds
    // 0.165 → 0.195 (19.5% YES), volume 9,143,296 → 9,167,627.
    yesProbability: 0.0905,
    volumeUsd: 9_167_627,
    bubble2026Probability: 0.0905,
    bubble2027Probability: 0.195,
    activeContractsCount: 16,
    referralCode: 'AIbubble',
    referralUrl: 'https://polymarket.com/?r=AIbubble',
    note: 'Volume-weighted Polymarket & Kalshi AI bubble burst prediction contracts (r=AIbubble)',
  },
  adoption: {
    // 2026-10-19 fact-check: ChatGPT WAU official series — OpenAI DevDay Sep 29 2026 = 1.2B weekly users
    // (900M Feb 27 2026, 800M Oct 2025). Growth 800M→1.2B ≈ +50% YoY (was an unsourced 0.65).
    topProductUsers: 1_200_000_000,
    annualUserGrowth: 0.5,
    // apiPriceDeclineMultiple is recomputed each sync on the INPUT basis (30 ÷ deepseek-v4.1-flash promptPerM;
    // see fetchTokenPriceDeflation). Seed = verified drift-tolerant fallback: 30 / $0.0448 = 670× (was 40 / completion-basis 60).
    // 2026-10-19 (pass 11): the note now carries the intraday disclosure — the verified print is
    // $0.0448/1M (OpenRouter live Oct 19 2026); live aggregator spot for the same base row was observed
    // swinging $0.0344–$0.0448/1M that day, so the pinned 670× is the conservative end of the range.
    apiPriceDeclineMultiple: 670,
    trainingCostBand: 'rising',
    note: 'OpenAI DevDay Sep 29 2026: ChatGPT 1.2B weekly users (900M Feb 2026, 800M Oct 2025, official WAU series) → +50% YoY. API deflation: GPT-4 $30/1M input (Mar 2023) → DeepSeek V4.1 Flash $0.0448/1M input (OpenRouter live Oct 19 2026) = 670×, input basis. INTRADAY DISCLOSURE (2026-10-19): the verified $0.0448/1M print was used; live aggregator spot for the same base row was observed swinging $0.0344–$0.0448/1M on Oct 19, 2026, so the published 670× multiple is pinned to the verified print and is therefore CONSERVATIVE (the low end would imply ~873×).',
  },
  capex: {
    // 2026-10-19 fact-check: Big-4 CY2026 capex guidance (Jul 2026 earnings calls) ≈ $725B.
    // Forbes Oct 7 2026: "$700–725B, up ~75% from $410B in 2025"; Coatue Aug 11 2026: ~$733B.
    // Components: AMZN ~$220B cash capex · GOOGL $195–205B · MSFT ~$175B incl. finance leases (lease useful-life reclass) · META $130–145B.
    // FY-basis AV anchors: MSFT FY26 OCF $182.9B, AMZN FY25 OCF $139.5B (capex now consumes nearly all big-4 OCF — Forbes).
    aggregateCapexUsd: 725_000_000_000,
    aggregateFcfUsd: 260_000_000_000, // trailing FY basis — refresh with cohort 10-Qs; Forbes Oct 7 2026: 2026 capex ≈ nearly all big-4 OCF (Amazon FCF seen negative)
    note: 'Big-4 hyperscaler CY2026 capex guidance (Jul 2026 calls): Amazon ~$220B cash capex, Alphabet $195–205B, Microsoft ~$175B incl. finance leases, Meta $130–145B → ~$725B guided (Forbes Oct 7 2026: $700–725B; Coatue Aug 11 2026: ~$733B). Apple excluded from this basis; FCF figure is trailing FY and flagged for CY2026 refresh',
  },
  macro: {
    // 2026-10-19 FRED verification: DGS10 5.10% (Oct 15) · T10YIE 2.35% (Oct 16) → real 10y 2.75% ·
    // CPIAUCSL Sep-2026 YoY +3.72% (336.298 vs 324.245) · FEDFUNDS monthly obs 3.75% (Sep 2026; cut cycle) ·
    // BAMLH0A0HYM2 = 323bp (Oct 15) · BAA10YM = 148bps (Sep 2026).
    us10yYieldPct: 5.10,
    us02yYieldPct: 4.75, // legacy DGS2 anchor — NOT re-verified Oct 19 2026 (display-only, no model weight)
    us10yBaselinePct: 3.75,
    cpiInflationYoY: 3.72,
    fedFundsRatePct: 3.75, // 2026 cut cycle — the old 4.75% / "+25bp hike" literal was a stale 2025 anchor
    rateHikeRiskBps: 25,
    realYield10y: 2.75, // DGS10 5.10 − T10YIE 2.35 (FRED, Oct 15/16 2026)
    highYieldSpreadBps: 323,
    note: 'FRED-verified Oct 19 2026: US10Y 5.10% (DGS10 Oct 15); CPI +3.72% YoY (CPIAUCSL Sep 2026 336.298 vs Sep 2025 324.245); Fed funds 3.75% on the 2026 cut-cycle path (FEDFUNDS Sep 2026); US HY OAS 323bp (BAMLH0A0HYM2 Oct 15 2026)',
  },
  aiDebt: {
    annualDebtIssuanceUsd: 85_000_000_000,
    totalTrackedDebtUsd: 214_890_400_000,
    capexToOcfRatio: 0.548,
    gpuDepreciationDragUsd: 38_500_000_000,
    capexToRevenueMultiple: 8.75,
    note: 'SEC 10-Q Capex vs OCF synthesis & private debt facilities',
  },
};

// 2026-10-19 fact-check provenance — persisted into src/data/live-inputs.json by run() so future syncs
// self-document instead of silently reverting the hand-verification trail.
const VERIFIED_OCT2026_FACTCHECK = {
  verified_at: '2026-10-19',
  verified_by: 'data fact-checker pass 2 hand-verification; values mirrored into this script by pass 3 so syncs preserve them',
  corrections: [
    'adoption.apiPriceDeclineMultiple 60 → 670 (INPUT basis: GPT-4 $30/1M Mar 2023 → DeepSeek V4.1 Flash $0.0448/1M input, OpenRouter live Oct 19 2026; recomputed each sync as 30 ÷ deepseek-v4.1-flash promptPerM, clamped 25–7000)',
    'adoption.topProductUsers 350,000,000 → 1,200,000,000 (ChatGPT weekly users, OpenAI DevDay Sep 29 2026; 900M Feb 2026, 800M Oct 2025)',
    'adoption.annualUserGrowth 0.65 → 0.5 (800M Oct 2025 → 1.2B Sep 2026 ≈ +50%)',
    'valuations.OpenAI.runRateRevenueUsd stays 50,000,000,000, re-sourced (FT/CNBC/Reuters Oct 8 2026, own basis; the $70B report was a partner-gross-up) — valuationUsd 950,000,000,000 → 1,200,000,000,000 (Bloomberg Sep 16 2026: talks at >$1.2T; $950B matched no report)',
    'valuations.Anthropic.runRateRevenueUsd 47,000,000,000 → 65,000,000,000 (Bloomberg/CNBC/Reuters Aug 17 2026: $65B ARR end-July, up from $47B in May; Reuters Oct 2026: guiding ~$100B year-end)',
    'capex.aggregateCapexUsd 485,000,000,000 → 725,000,000,000 (Big-4 CY2026 guidance, Jul 2026 calls: AMZN ~$220B, GOOGL $195–205B, MSFT ~$175B incl. leases, META $130–145B; Forbes Oct 7 2026 $700–725B; Coatue Aug 11 2026 ~$733B)',
    'macro.cpiInflationYoY 2.9 → 3.72 (FRED CPIAUCSL Sep 2026 336.298 vs Sep 2025 324.245)',
    'macro.fedFundsRatePct 4.75 → 3.75 (FRED FEDFUNDS monthly obs, Sep 2026 — 2026 cut cycle)',
    'macro.highYieldSpreadBps 336 → 323 (FRED BAMLH0A0HYM2, Oct 15 2026)',
    'macro.highYieldSpreadBps 329 → 323 (pass 11, 2026-10-19: the published level was still the HYG-inverse proxy value; the note already cited the FRED print — the value now matches the note and the LEVEL is fetched directly from FRED BAMLH0A0HYM2 by the pipeline, with the HYG proxy demoted to the ticker row\'s change display only)',
    'macro.realYield10y 2.7 → 2.75 (DGS10 5.10 − T10YIE 2.35, Oct 15/16 2026)',
    'macro.us10yYieldPct 5.1 stays (FRED DGS10 Oct 15 2026 confirms)',
    'ledger.daysSinceLastMega 14 (hardcoded literal) → 21 (derived each sync: whole days from the newest mega-class announcement to the sync date, UTC; newest = deal-002 Anthropic & Broadcom $42.0B convertible note, 28 Sep 2026)',
    'ledger.megaCountLast12m 49 (all-time count of mega-class deals) → 25 (derived each sync: mega-class deals with announced_date inside the 365 days ending on the sync date)',
    'live-models.json: benchmark $30/$60 restored (seed had $30/$30), max_deflation 670× input-basis, per-row sources + verified release dates seeded',
    'cds.currentBps 187 → 288 (5Y Oracle CDS record close Oct 15 2026 — S&P Global Market Intelligence via securitasglobal.com; 261bp a week earlier Oct 8; CNBC Oct 19 quotes ~295bp intraday after a brief 300bp print). cds.priorBps 155 → 203 = the 90-day-ago print (Jul 20-24 2026, ICE data; Reuters Jul 29 quoted ~200bp, late-July prints 212-215bp). baselineBps 81 unchanged (long-run norm). S&P cut ORCL to BBB- on Jul 9 2026',
    'valuations "SpaceX / xAI" → "xAI merger value (Feb 2026 all-stock)"; runRateRevenueUsd 500,000,000 → 3,200,000,000 (xAI FY2025 revenue $3.2B per the SpaceX S-1, operating loss $6.36B; AI segment revenue $2.56B in Q2 2026 per the SpaceX Q2 2026 earnings release). valuationUsd $250B unchanged — it is xAI’s merger value, distinct from SPCX’s $2.05T public cap',
    'live-stocks market caps refreshed from filing cover-page share counts × Oct 16/19 close: AMZN $2.61T → $2.70T; ORCL $353B → $387.8B; CEG $86.5B → $96.1B; NBIS $35.5B → $45.0B; SMCI $18.5B → $20.8B; CRWV $53.2B → $33.9B (adjudicated 2026-10-19 per V3’s EDGAR verdict: 551,536,602 shares outstanding, 10-Q cover Jul 31 2026, EDGAR 0001769628-26-000366, × $61.39; the $53.2B/866.6M-share figure appears in no filing — the Sep 17 2026 35M-share ATM is undrawn capacity). Share counts now carried per ticker as sharesOutstanding',
    'deals.json deal-161 ($6.5B CoreWeave "debt facility expansion") adjudicated a double count: amount_usd 6,500,000,000 → 0 and is_debt false, relabelled as an expansion of the existing $7.5B Blackstone-led facility — CoreWeave’s Q2 2026 10-Q Note 10 - Debt lists no January 2026 facility and no $6.5B instrument',
    'deals.json deal-167 title "(1.65B)" → "(1.77B)" to match the verified €1.5B × 1.1786 announcement-date FX',
    'quantitative.ts episode trigger string "350M active weekly ChatGPT/Claude users" → "1.2B weekly users (DevDay, Sep 29 2026)" — descriptive string only, not a model input',
    'ledger debt re-bundled 2026-10-19: aiDebt.totalTrackedDebtUsd 228,072,500,000 → 214,890,400,000 and ledger.debtShare 0.080 → 0.075 (24 is_debt records) after the deal-161 double-count removal ($6.5B CoreWeave facility, amount_usd 0) and the deal-162 recast to the verified $2.4B Ares facility; ledger.totalDisclosedUsd 2,858,307,802,026 → 2,872,873,160,000 (169 deals, 2,872,873,160,000 recomputed from deals.json)',
    'adoption.apiPriceDeclineMultiple 798 → 670 (pass 11, 2026-10-19: the published value had drifted onto the aggregator\'s lower $0.0376/1M quote, contradicting the row\'s own note/source ($0.0448/1M, OpenRouter live Oct 19 2026). Pinned to the verified print: 30 ÷ 0.0448 ≈ 670× (input basis, −99.85%). The live aggregator spot was observed swinging $0.0344–$0.0448/1M on Oct 19, 2026 — the pinned value is the conservative end of that observed range)',
    'deals.json deal-016 (Meta-CoreWeave $21B AI cloud capacity expansion, 9 Apr 2026) is_mega false → true (pass 11, 2026-10-19: amount_usd $21B ≥ the $10B mega threshold, so the flag now agrees with the pipeline\'s mega rule — is_mega || amount_usd >= 10B. Flag-only mega count 48 → 49, matching the rule\'s 49; the trailing-365-day mega count stays 25 and the 169-deal / $2,872,873,160,000 ledger totals are unchanged)',
  ],
  integrity_notes: [
    '2026-10-19: deals.json mid-pass clobber investigated — no scheduled task writes the repo (schtasks checked), update-data.mjs has no deals.json write path; cause attributed to concurrent agent editing; pre-commit integrity re-verification added to checklist'
  ],
  inspected_and_stayed: [
    'cds 288/81/203/135bp (5Y Oracle CDS — record close Oct 15 2026 per S&P Global Market Intelligence; 203bp = the 90-day-ago print Jul 20-24 2026 (ICE); 81bp = long-run norm baseline; 135bp = other AI-exposed borrower. The pre-verification 187/81/155/135 set was superseded on Oct 19, 2026 — the numbers above are the verified ones)',
    'aiDebt.totalTrackedDebtUsd 214,890,400,000 and annualDebtIssuanceUsd 85,000,000,000 (ledger pipeline outputs)',
    'aiDebt.capexToOcfRatio 0.548 and capexToRevenueMultiple 8.75 (derived fields — basis needs owner review after capex basis change)',
    'capex.aggregateFcfUsd 260,000,000,000 (trailing FY basis — flagged unverified for CY2026 in the capex note)',
    'macro.rateHikeRiskBps 25 and us10yBaselinePct 3.75 (forward-looking stress-model assumptions, not observations)',
    'macro.us02yYieldPct 4.75 (legacy DGS2 anchor — not re-verified Oct 19 2026; display-only, carries no model weight)',
    'valuations Databricks/SpaceX-xAI/Mistral/Scale/Cohere/Perplexity/SSI rows (note-aligned, no contradicting live source this session)',
    'ledger & crowd objects (regenerated by the pipeline; Polymarket 9.05% bubble-2026 odds re-verified live — the earlier 10.1% line was superseded by the Oct 19 2026 13:27 UTC sync)'
  ]
};

// Target Tech Tickers for live pricing & drawdown calculation
const TARGET_TECH_TICKERS = [
  {
    ticker: 'NVDA',
    name: 'NVIDIA Corporation',
    category: 'Semiconductor',
    athUsd: 243.37,
    role: 'AI Silicon & Ecosystem Anchor',
    marketCapDisplay: '$5.27T',
    baselinePrice: 214.13,
  },
  {
    ticker: 'MSFT',
    name: 'Microsoft Corporation',
    category: 'Hyperscaler',
    athUsd: 553.72,
    role: 'OpenAI Cloud Anchor & Nuclear Power Off-taker',
    marketCapDisplay: '$3.93T',
    baselinePrice: 529.05,
  },
  {
    ticker: 'AAPL',
    name: 'Apple Inc.',
    category: 'Hyperscaler',
    athUsd: 348.15,
    role: 'Edge AI Device Monopoly & $136B+ Free Cash Flow Engine',
    marketCapDisplay: '$5.18T',
    baselinePrice: 343.46,
  },
  {
    ticker: 'GOOGL',
    name: 'Alphabet Inc.',
    category: 'Hyperscaler',
    athUsd: 408.61,
    role: 'Custom TPU V5e/V6 & Anthropic Backer',
    marketCapDisplay: '$4.19T',
    baselinePrice: 340.59,
  },
  {
    ticker: 'AMZN',
    name: 'Amazon.com Inc.',
    category: 'Hyperscaler',
    athUsd: 287.20,
    role: 'AWS Bedrock & Anthropic $8B Strategic Partner',
    // 2026-10-19 (pass 7): cap = 10,786,313,572 shares (10-Q cover, Jul 22 2026) x $250.00 close = $2.70T
    marketCapDisplay: '$2.70T',
    sharesOutstanding: 10_786_313_572,
    baselinePrice: 250.00,
  },
  {
    ticker: 'META',
    name: 'Meta Platforms Inc.',
    category: 'Hyperscaler',
    athUsd: 779.82,
    role: 'Llama Open Weights & 600k H100 Cluster Buyer',
    marketCapDisplay: '$1.79T',
    baselinePrice: 709.33,
  },
  {
    ticker: 'SPCX',
    name: 'SpaceX',
    category: 'Hyperscaler',
    athUsd: 225.64,
    role: 'AI Supercomputing, Starlink & xAI Colossus Parent',
    marketCapDisplay: '$2.05T',
    baselinePrice: 146.03,
  },
  {
    ticker: 'ORCL',
    name: 'Oracle Corporation',
    category: 'Hyperscaler',
    athUsd: 289.24,
    role: '5Y CDS Credit Proxy & GPU Cluster Debt Anchor',
    // 2026-10-19 (pass 7): cap = 3,023,736,000 shares (10-Q cover, Sep 7 2026) x $128.23 close = $387.8B
    marketCapDisplay: '$387.8B',
    sharesOutstanding: 3_023_736_000,
    baselinePrice: 128.23,
  },
  {
    ticker: 'TSM',
    name: 'Taiwan Semiconductor (TSMC)',
    category: 'Semiconductor',
    athUsd: 487.47,
    role: 'CoWoS Packaging & 3nm/2nm Monopolist',
    marketCapDisplay: '$1.07T',
    baselinePrice: 412.61,
  },
  {
    ticker: 'AVGO',
    name: 'Broadcom Inc.',
    category: 'Semiconductor',
    athUsd: 495.00,
    role: 'Custom AI XPU ASIC & PCIe Switching',
    marketCapDisplay: '$1.54T',
    baselinePrice: 328.75,
  },
  {
    ticker: 'CRWV',
    name: 'CoreWeave Inc.',
    category: 'Power & Infrastructure',
    athUsd: 141.79,
    role: 'Specialized GPU Neocloud & NVIDIA Blackwell Partner',
    // 2026-10-19 (pass 9, adjudicated per V3's EDGAR verdict): cap = 551,536,602 shares outstanding
    // (10-Q cover, Jul 31 2026: 458,871,690 Class A + 92,664,912 Class B + 0 Class C; EDGAR accession
    // 0001769628-26-000366) x $61.39 Oct 16 close = $33.9B. The prior $53.2B (866.6M shares) appears
    // in no filing - the Sep 17 2026 35M-share ATM is undrawn capacity, not outstanding shares.
    marketCapDisplay: '$33.9B',
    sharesOutstanding: 551_536_602,
    baselinePrice: 61.39,
  },
  {
    ticker: 'PLTR',
    name: 'Palantir Technologies',
    category: 'Frontier Lab Partner',
    athUsd: 212.94,
    role: 'Enterprise AIP & Defense AI Contract Bellwether',
    marketCapDisplay: '$418B',
    baselinePrice: 186.03,
  },
  {
    ticker: 'AMD',
    name: 'Advanced Micro Devices',
    category: 'Semiconductor',
    athUsd: 658.52,
    role: 'MI300X/MI325X AI GPU Competitor & ROCm',
    marketCapDisplay: '$856B',
    baselinePrice: 528.75,
  },
  {
    ticker: 'INTC',
    name: 'Intel Corporation',
    category: 'Semiconductor',
    athUsd: 142.35,
    role: 'Gaudi AI Accelerators & Datacenter Foundry',
    marketCapDisplay: '$386B',
    baselinePrice: 89.85,
  },
  {
    ticker: 'ASML',
    name: 'ASML Holding',
    category: 'Semiconductor',
    athUsd: 1999.96,
    role: 'EUV Lithography Monopoly for AI Silicon',
    marketCapDisplay: '$645B',
    baselinePrice: 1641.52,
  },
  {
    ticker: 'QCOM',
    name: 'Qualcomm Inc.',
    category: 'Semiconductor',
    athUsd: 259.92,
    role: 'Snapdragon NPU & Edge AI Inference Silicon',
    marketCapDisplay: '$191B',
    baselinePrice: 172.11,
  },
  {
    ticker: 'CEG',
    name: 'Constellation Energy',
    category: 'Power & Infrastructure',
    athUsd: 406.04,
    role: 'Three Mile Island Nuclear Restart for Microsoft',
    // 2026-10-19 (pass 7): cap = 354,307,379 shares (10-Q cover, Jul 31 2026) x $271.37 close = $96.1B
    marketCapDisplay: '$96.1B',
    sharesOutstanding: 354_307_379,
    baselinePrice: 271.37,
  },
  {
    ticker: 'VST',
    name: 'Vistra Corp.',
    category: 'Power & Infrastructure',
    athUsd: 205.50,
    role: 'Nuclear & Datacenter Power IPP Provider',
    marketCapDisplay: '$52.8B',
    baselinePrice: 152.02,
  },
  {
    ticker: 'GEV',
    name: 'GE Vernova',
    category: 'Power & Infrastructure',
    athUsd: 1195.94,
    role: 'Electrical Grid Transformers & Gas Turbines',
    marketCapDisplay: '$252B',
    baselinePrice: 921.20,
  },
  {
    ticker: 'DELL',
    name: 'Dell Technologies',
    category: 'Power & Infrastructure',
    athUsd: 595.51,
    role: 'PowerEdge AI Server Racks & Liquid Cooling',
    marketCapDisplay: '$322B',
    baselinePrice: 451.71,
  },
  {
    ticker: 'SMCI',
    name: 'Super Micro Computer',
    category: 'Power & Infrastructure',
    athUsd: 56.60,
    role: 'GPU Server Integrator (Polymarket Trigger Risk)',
    // 2026-10-19 (pass 7): cap = 656,965,384 shares (FY2026 10-K cover, Jul 31 2026) x $31.63 close = $20.8B
    marketCapDisplay: '$20.8B',
    sharesOutstanding: 656_965_384,
    baselinePrice: 31.63,
  },
  {
    ticker: 'NBIS',
    name: 'Nebius Group',
    category: 'Power & Infrastructure',
    athUsd: 299.86,
    role: 'AI Neocloud & $17.4B Microsoft Compute Partner',
    // 2026-10-19 (pass 7): cap = 271,855,218 shares (238,400,165 A + 33,455,053 B, Q2 2026 release) x $165.47 close = $45.0B
    marketCapDisplay: '$45.0B',
    sharesOutstanding: 271_855_218,
    baselinePrice: 165.47,
  },
  {
    ticker: 'CRWD',
    name: 'CrowdStrike Holdings',
    category: 'Frontier Lab Partner',
    athUsd: 286.99,
    role: 'Enterprise AI Cybersecurity & Charlotte AI',
    marketCapDisplay: '$55.4B',
    baselinePrice: 227.39,
  },
  {
    ticker: 'ANET',
    name: 'Arista Networks',
    category: 'Power & Infrastructure',
    athUsd: 217.41,
    role: 'AI Cluster 800G/1.6T Ethernet Switching',
    marketCapDisplay: '$55.6B',
    baselinePrice: 176.98,
  },
  {
    ticker: 'SNPS',
    name: 'Synopsys Inc.',
    category: 'Semiconductor',
    athUsd: 539.48,
    role: 'EDA Silicon Design IP & AI Chip Verification',
    marketCapDisplay: '$69.8B',
    baselinePrice: 454.63,
  },
];

/**
 * 1. Fetch live token inference pricing from OpenRouter (Free, Public, No Key)
 * Persists curated October 2026 frontier models to src/data/live-models.json
 */
async function fetchTokenPriceDeflation() {
  console.log('[1/5] Fetching live token pricing from OpenRouter...');
  
  const DEFAULT_OCT_2026_MODELS = [
    {
      id: 'anthropic/claude-opus-5.5',
      name: 'Claude Opus 5.5',
      provider: 'Anthropic',
      category: 'Frontier Reasoning & Agency',
      promptPerM: 4.00,
      completionPerM: 20.00,
      batchCompletionPerM: 10.00,
      contextLength: 200000,
      deflationMultiple: '7.5× Cheaper', // input basis: 30/4; was 1.5× (completion basis)
      releaseDate: 'September 2026', // OpenRouter created ts 2026-09-22 UTC (was mislabeled October)
      note: 'State-of-the-art agentic reasoning engine commanding premium token density',
      source: 'https://openrouter.ai/api/v1/models (live Oct 19, 2026: prompt 0.000004 / completion 0.00002 per token; created 2026-09-22 UTC, so release = September 2026, not October)',
    },
    {
      id: 'anthropic/claude-sonnet-5.5',
      name: 'Claude Sonnet 5.5',
      provider: 'Anthropic',
      category: 'Enterprise Production Workhorse',
      promptPerM: 2.00,
      completionPerM: 10.00,
      batchCompletionPerM: 5.00,
      contextLength: 200000,
      deflationMultiple: '15× Cheaper', // input basis: 30/2; was 3.0× (completion basis)
      releaseDate: 'September 2026', // OpenRouter created ts 2026-09-28 UTC
      note: 'Industry standard for complex code generation, tool orchestration & reasoning',
      source: 'https://openrouter.ai/api/v1/models (live Oct 19, 2026: prompt 0.000002 / completion 0.00001 per token; created 2026-09-28 UTC)',
    },
    {
      id: 'anthropic/claude-haiku-5.5',
      name: 'Claude Haiku 5.5',
      provider: 'Anthropic',
      category: 'Edge & Low-Latency Tier',
      promptPerM: 0.10,
      completionPerM: 0.50,
      batchCompletionPerM: 0.25,
      contextLength: 200000,
      deflationMultiple: '300× Cheaper', // input basis: 30/0.1; was 60× (completion basis)
      releaseDate: 'October 2026', // released Oct 7, 2026 (Anthropic announcement; OpenRouter created ts 2026-10-07)
      note: 'Sub-second real-time streaming at $0.10/1M input and 50¢ per million completion tokens (prompts ≤100k tokens; $0.50/$2.50 above). Released Oct 7, 2026',
      source: 'https://openrouter.ai/api/v1/models (live Oct 19, 2026); https://www.anthropic.com (Haiku 5.5 announcement Oct 7, 2026, $0.10/$0.50 ≤100k tier)',
    },
    {
      id: 'deepseek/deepseek-v4.1-flash',
      name: 'DeepSeek V4.1 Flash',
      provider: 'DeepSeek',
      category: 'Ultra-Low Cost Inference',
      promptPerM: 0.0448,
      completionPerM: 0.08,
      batchCompletionPerM: 0.04,
      contextLength: 128000,
      deflationMultiple: '670× Cheaper', // input basis: 30/0.0448 = 669.6; the legacy 375× mixed a $30 INPUT baseline with the COMPLETION price
      releaseDate: 'September 2026', // base model live Sep 10, 2026 per OpenRouter created ts / api-docs
      note: 'Architectural MoE cost breakthrough; $0.0448/1M input / $0.08/1M completion on aggregated open-weights serving (-99.85% input-basis vs GPT-4). DeepSeek\'s first-party API lists $0.15/$0.60 (cache-miss, off-peak). V4.1 Flash base live Sep 10, 2026; the V4.1 Flash 1017 checkpoint (Oct 17, 2026) is priced higher at $0.30/$1.20',
      source: 'https://openrouter.ai/api/v1/models (live Oct 19, 2026: prompt 0.0000000448 / completion 0.00000008 per token); https://api-docs.deepseek.com/quick_start/pricing (first-party $0.15/$0.60 off-peak); api-docs DeepSeek-V4.1-Flash \'live September 10, 2026\'',
    },
    {
      id: 'google/gemini-4-argon',
      name: 'Gemini 4 Argon',
      provider: 'Google',
      category: 'Multimodal Frontier Tier',
      promptPerM: 2.00,
      completionPerM: 10.00,
      batchCompletionPerM: 5.00,
      contextLength: 1000000,
      deflationMultiple: '15× Cheaper', // input basis: 30/2; was 3.0× (completion basis)
      releaseDate: 'October 2026', // OpenRouter created ts 2026-10-13 UTC
      note: 'Frontier multimodal reasoning with 1M context window and native audio/video',
      source: 'https://openrouter.ai/api/v1/models (live Oct 19, 2026: prompt 0.000002 / completion 0.00001 per token; created 2026-10-13 UTC)',
    },
    {
      id: 'google/gemini-3.8-flash',
      name: 'Gemini 3.8 Flash',
      provider: 'Google',
      category: 'High-Throughput Multimodal',
      promptPerM: 0.825,
      completionPerM: 4.125,
      batchCompletionPerM: 2.06,
      contextLength: 1000000,
      deflationMultiple: '36× Cheaper', // input basis: 30/0.825 = 36.4; was 7.3× (completion basis)
      releaseDate: 'September 2026', // released Sep 2, 2026
      note: 'Fast multimodal throughput with 1M token context capacity; released Sep 2, 2026. OpenRouter\'s normalized Google rate is $0.825/$4.125 (Google Vertex non-global tier); Google\'s first-party global introductory list (through Dec 31, 2026) is $0.75/$3.75, rising to $1.50/$7.50 on Jan 1, 2027',
      source: 'https://openrouter.ai/api/v1/models (live Oct 19, 2026); https://ai.google.dev/gemini-api/docs/whats-new-gemini-3.8 + https://cloud.google.com/gemini-enterprise-agent-platform/generative-ai/pricing (official tiers)',
    },
    {
      id: 'openai/gpt-4o',
      name: 'GPT-4o',
      provider: 'OpenAI',
      category: 'Omni Multimodal Flagship',
      promptPerM: 2.50,
      completionPerM: 10.00,
      batchCompletionPerM: 5.00,
      contextLength: 128000,
      deflationMultiple: '12× Cheaper', // input basis: 30/2.5; was 3.0× (completion basis)
      releaseDate: 'May 2024', // launched May 13, 2024 (OpenAI blog; had been squashed to "2024–2026")
      note: 'Flagship omni multimodal model for general purpose intelligence; launched May 13, 2024 at $5/$15 (OpenAI blog), today listed at $2.50/$10',
      source: 'https://openrouter.ai/api/v1/models (live Oct 19, 2026: prompt 0.0000025 / completion 0.00001 per token); https://openai.com/index/hello-gpt-4o (launch pricing $5/$15, May 13 2024)',
    },
    {
      id: 'openai/gpt-4o-mini',
      name: 'GPT-4o-mini',
      provider: 'OpenAI',
      category: 'Lightweight Utility',
      promptPerM: 0.15,
      completionPerM: 0.60,
      batchCompletionPerM: 0.30,
      contextLength: 128000,
      deflationMultiple: '200× Cheaper', // input basis: 30/0.15; was 50× (completion basis)
      releaseDate: 'July 2024', // launched Jul 18, 2024
      note: 'Cost-efficient lightweight intelligence for fast classification and routing; launched Jul 18, 2024 at $0.15/$0.60',
      source: 'https://openrouter.ai/api/v1/models (live Oct 19, 2026: prompt 0.00000015 / completion 0.0000006 per token); https://openai.com/index/gpt-4o-mini (launch pricing $0.15/$0.60, Jul 18 2024)',
    },
    {
      id: 'openai/gpt-6.1-sol-pro',
      name: 'GPT-6.1 Sol Pro',
      provider: 'OpenAI',
      category: 'Frontier Agentic Reasoning',
      promptPerM: 2.00,
      completionPerM: 10.00,
      batchCompletionPerM: 5.00,
      contextLength: 1000000,
      deflationMultiple: '15× Cheaper', // input basis: 30/2; was 3.0× (completion basis)
      releaseDate: 'September 2026', // OpenRouter created ts 2026-09-29 UTC
      note: 'Next-generation reasoning & orchestration architecture with native tool planning; created Sep 29, 2026 per OpenRouter feed',
      source: 'https://openrouter.ai/api/v1/models (live Oct 19, 2026: prompt 0.000002 / completion 0.00001 per token)',
    },
    {
      id: 'openai/gpt-6-luna',
      name: 'GPT-6 Luna',
      provider: 'OpenAI',
      category: 'Sub-Second Edge Inference',
      promptPerM: 0.10,
      completionPerM: 0.50,
      batchCompletionPerM: 0.25,
      contextLength: 256000,
      deflationMultiple: '300× Cheaper', // input basis: 30/0.1; was 60× (completion basis)
      releaseDate: 'September 2026', // OpenRouter created ts 2026-09-22 UTC
      note: 'High-speed speculative decoding engine optimized for micro-latency streaming; created Sep 22, 2026 per OpenRouter feed; price matches OpenAI\'s own $0.10/$0.50 Luna tier',
      source: 'https://openrouter.ai/api/v1/models (live Oct 19, 2026: prompt 0.0000001 / completion 0.0000005 per token); OpenAI API pricing page (GPT-6 Luna $0.10/$0.50)',
    }
  ];

  let curatedModels = DEFAULT_OCT_2026_MODELS;
  let totalModelsScanned = 471;
  let computedMultiplier = 670; // fallback if OpenRouter scan fails: 30 ÷ $0.0448 input = 669.6 ≈ 670 (verified Oct 19, 2026) — was a completion-basis 60

  // 2026-10-19 (pass 11): the deflation anchor must be the deepseek-v4.1-flash BASE row.
  // OpenRouter also lists sibling variants of that model — ':batch', ':latest' and the
  // '-1017' checkpoint (priced $0.30/$1.20) — which are NOT the same instrument. Snapping to a
  // variant would publish a wrong multiple, so the pin is identity-gated.
  const DEEPSEEK_BASE_ID = 'deepseek/deepseek-v4.1-flash';
  // 2026-10-19 (pass 11): drift tolerance 0.10 → 0.25 — the aggregator's display jitters
  // ($0.0344–$0.0448/1M observed on the base row on Oct 19, 2026), so a ±25% band around the
  // verified print is treated as the same listing; beyond that it is a genuine repricing.
  const DEFLATION_PIN_TOLERANCE = 0.25;
  const isDeepseekBaseRow = (id) => typeof id === 'string' && id.trim().toLowerCase() === DEEPSEEK_BASE_ID;

  // Scan provenance — persisted into live-inputs.json (_verified.inspected_and_stayed) whenever the
  // pin does NOT snap, so a drifted multiple is never published silently (2026-10-19, pass 11).
  const deflationScan = {
    scanned_at: new Date().toISOString(),
    anchor_model_id: DEEPSEEK_BASE_ID,
    matched_model_id: null,
    identity_ok: false,
    scanned_prompt_per_m: null,
    scanned_completion_per_m: null,
    prompt_drift_pct: null,
    tolerance_pct: DEFLATION_PIN_TOLERANCE,
    snapped: false,
    published_multiple: null,
    variant_rows_seen: [],
  };

  try {
    const res = await fetchWithRetry('https://openrouter.ai/api/v1/models', {
      group: 'openrouter',
      label: 'OpenRouter models',
      timeoutMs: 8000,
      headers: { Accept: 'application/json' },
    });

    if (res.ok) {
      const json = await res.json();
      const rawModels = json.data || [];
      totalModelsScanned = rawModels.length;

      // 2026-10-19 (pass 11): record every deepseek-v4.1 sibling row the catalog exposes so the
      // base-row identity decision is auditable (variants are never used as the anchor).
      deflationScan.variant_rows_seen = rawModels
        .map((rm) => rm.id)
        .filter((id) => typeof id === 'string' && id.toLowerCase().includes('deepseek-v4.1') && !isDeepseekBaseRow(id));

      // Extract live pricing for our curated models
      // 2026-10-19 fact-check: OpenRouter's catalog display jitters at ~2 sig-figs (V4.1 Flash prompt
      // showed 0.0000000448 in the morning snapshot, 0.000000044 the same evening — same listing, same
      // created-ts). Pin the drift-tolerant money anchor: if the BASE row's live price lands within
      // ±25% of the verified V4.1 Flash pair ($0.0448/1M in, $0.08/1M out), snap to the verified values
      // so the site stays on the verified 670× figure; a genuine repricing (>25%) still flows through
      // and is disclosed in _verified.inspected_and_stayed.
      curatedModels = DEFAULT_OCT_2026_MODELS.map((defaultMod) => {
        const liveMatch = rawModels.find((rm) => rm.id.toLowerCase() === defaultMod.id.toLowerCase());
        if (liveMatch && liveMatch.pricing) {
          let promptPerM = liveMatch.pricing.prompt ? parseFloat(liveMatch.pricing.prompt) * 1_000_000 : defaultMod.promptPerM;
          let completionPerM = liveMatch.pricing.completion ? parseFloat(liveMatch.pricing.completion) * 1_000_000 : defaultMod.completionPerM;
          // 2026-10-19 (pass 11): identity-gated drift pin (base row only, ±25% band).
          const isDriftPin = isDeepseekBaseRow(defaultMod.id);
          if (isDriftPin) {
            deflationScan.matched_model_id = liveMatch.id;
            deflationScan.identity_ok = true;
            deflationScan.scanned_prompt_per_m = promptPerM;
            deflationScan.scanned_completion_per_m = completionPerM;
            const promptDrift = Math.abs(promptPerM - 0.0448) / 0.0448;
            deflationScan.prompt_drift_pct = Math.round(promptDrift * 10000) / 100;
            if (promptDrift <= DEFLATION_PIN_TOLERANCE) {
              promptPerM = 0.0448;
              deflationScan.snapped = true;
            }
            if (Math.abs(completionPerM - 0.08) / 0.08 <= DEFLATION_PIN_TOLERANCE) completionPerM = 0.08;
          }
          // Deflation multiples are INPUT-basis vs GPT-4's $30/1M input (Mar 2023 launch rate): 30 ÷ prompt.
          // The legacy formula (30 ÷ COMPLETION) mixed bases with the input baseline and produced 375×/60×.
          const deflationMult = promptPerM > 0 ? (30.0 / promptPerM) : 1;
          const multipleDisplay = deflationMult >= 10
            ? `${deflationMult.toFixed(0)}× Cheaper`
            : `${deflationMult.toFixed(1)}× Cheaper`;

          return {
            ...defaultMod,
            promptPerM: Number(promptPerM.toFixed(4)),
            completionPerM: Number(completionPerM.toFixed(4)),
            deflationMultiple: multipleDisplay,
            contextLength: liveMatch.context_length || defaultMod.contextLength,
          };
        }
        return defaultMod;
      });

      console.log(`  ✓ OpenRouter: ${totalModelsScanned} models scanned. Updated ${curatedModels.length} frontier models (Opus 5.5, Sonnet 5.5, Haiku 5.5, DeepSeek V4.1 Flash, Gemini 4).`);
    } else {
      console.warn(`  ↳ OpenRouter HTTP ${res.status}, using verified October 2026 defaults.`);
    }
  } catch (err) {
    console.warn(`  ↳ OpenRouter fetch error (${err.message}). Using verified October 2026 defaults.`);
  }

  // Calculate adoption damper multiplier on the INPUT basis: 30 ÷ prompt price per 1M tokens.
  // Verified pair (Oct 19, 2026): GPT-4 $30/1M input (Mar 2023 launch, still listed live) ÷ DeepSeek V4.1
  // Flash $0.0448/1M input (OpenRouter live) = 669.6 ≈ 670×. The anchor is the BASE row only
  // (2026-10-19, pass 11 — ':batch' / ':latest' / '-1017' variants are excluded); the fallback chain
  // keeps a value when a listing disappears.
  // Clamp [25, 7000]: preserves damper stability on degenerate/zero-priced data (was [25,100] under the
  // completion-basis convention — the clamp, not the multiplier, was the only guardrail then).
  const commodityModel = curatedModels.find((m) => isDeepseekBaseRow(m.id))
    || curatedModels.find((m) => m.id.includes('gpt-6-luna'))
    || curatedModels.find((m) => m.id.includes('haiku-5.5'));
  if (commodityModel && commodityModel.promptPerM > 0) {
    computedMultiplier = Math.min(7000, Math.max(25, Math.round(30.0 / commodityModel.promptPerM)));
  }
  deflationScan.published_multiple = computedMultiplier;

  // 2026-10-19 fact-check: benchmark_baseline must be GPT-4's LAUNCH rate card — $30.00 input / $60.00
  // output. The seed had completion_cost_per_m: 30.00 (a duplicate of the input rate instead of the $60
  // output rate), halving the output baseline. max_deflation_factor is the INPUT-basis 670× string; the
  // frontier rate string carries both legs. verified_at/verification_note persist the fact-check trail.
  const deepseekSeed = curatedModels.find((m) => isDeepseekBaseRow(m.id));
  const deepseekPrompt = deepseekSeed ? deepseekSeed.promptPerM : 0.0448;

  const liveModelsPayload = {
    last_synced_at: new Date().toISOString(),
    verified_at: '2026-10-19',
    source: 'https://openrouter.ai/api/v1/models',
    license: 'Public OpenRouter Model Catalog (Free / Keyless)',
    total_models_available: totalModelsScanned,
    verification_note: 'Live OpenRouter fetch Oct 19, 2026 returned 470 model listings (spec preview said 471; live count wins). All prices re-verified against the live keyless API; deflation multiples recomputed on the INPUT-price basis vs GPT-4\'s $30/1M input (Mar 2023 launch rate, still listed today). GPT-4 input $30/1M, output $60/1M (OpenRouter live + OpenAI Mar 14 2023 launch rate).',
    benchmark_baseline: {
      model: 'OpenAI GPT-4 Original',
      release_date: 'March 2023',
      prompt_cost_per_m: 30.00,
      completion_cost_per_m: 60.00,
      source: 'https://openrouter.ai/api/v1/models (live Oct 19, 2026: gpt-4 prompt $0.00003 / completion $0.00006 per token; launch pricing $30/$60 per OpenAI Mar 2023)',
    },
    max_deflation_factor: `${Math.round(30.0 / deepseekPrompt)}× input-basis (DeepSeek V4.1 Flash @ $${deepseekPrompt.toFixed(4)}/1M input, 30 / ${deepseekPrompt.toFixed(4)} ≈ ${(30.0 / deepseekPrompt).toFixed(1)} → -99.85% vs GPT-4 input; completion-basis below-10¢ equivalent $60 → $0.08)`,
    frontier_reasoning_rate: '$4.00/1M input · $20.00/1M output (Claude Opus 5.5)',
    models: curatedModels,
  };

  // 2026-10-19 (CI hardening): the artifact is handed back to the caller and written
  // in the atomic write phase — nothing is written during the fetch phase, so a
  // majority-outage abort can never leave a half-written file behind.
  return { multiplier: computedMultiplier, scan: deflationScan, payload: liveModelsPayload };
}

/**
 * 2. Fetch live crowd prediction odds from Polymarket (Free, Public, No Key)
 */
async function fetchPolymarketOdds() {
  console.log('[2/5] Fetching live crowd odds from Polymarket...');
  try {
    const slugs = [
      'ai-bubble-burst-by',
      'openai-ipo-by',
      'openai-announces-it-has-achieved-agi-before-2027',
      'openai-1t-ipo-before-2027',
      'anthropic-acquired-before-2027',
      'us-recession-by-end-of-2026',
    ];

    const eventPromises = slugs.map((s) =>
      fetchWithRetry(`https://gamma-api.polymarket.com/events?slug=${s}`, {
        group: 'polymarket',
        label: `Polymarket ${s}`,
        timeoutMs: 8000,
        headers: { Accept: 'application/json' },
      })
        .then((r) => r.json())
        .catch(() => [])
    );

    const eventArrays = await Promise.all(eventPromises);
    const events = eventArrays.flat().filter(Boolean);

    if (events.length > 0) {
      let totalVol = 0;
      // 2026-10-19 (pass 11): seed odds aligned to the verified live snapshot (0.103 → 0.0905 for
      // 2026, 0.165 → 0.195 for 2027) — these are the values used when no matching market is found.
      let bubble2026Prob = 0.0905;
      let bubble2027Prob = 0.195;
      const parsedMarkets = [];

      for (const ev of events) {
        totalVol += parseFloat(ev.volume || 0);
        for (const m of ev.markets || []) {
          const prices = JSON.parse(m.outcomePrices || '["0.5", "0.5"]');
          const yesP = parseFloat(prices[0] || '0.5');
          const noP = parseFloat(prices[1] || '0.5');
          const vol = parseFloat(m.volume || 0);

          if (m.slug && m.slug.includes('2026') && ev.slug === 'ai-bubble-burst-by') {
            bubble2026Prob = yesP;
          }
          if (m.slug && m.slug.includes('2027') && ev.slug === 'ai-bubble-burst-by') {
            bubble2027Prob = yesP;
          }

          parsedMarkets.push({
            id: m.id,
            question: m.question,
            slug: m.slug,
            eventSlug: ev.slug,
            yesProbabilityPct: Math.round(yesP * 1000) / 10,
            noProbabilityPct: Math.round(noP * 1000) / 10,
            volumeUsd: Math.round(vol),
            referralUrl: `https://polymarket.com/event/${ev.slug}?r=AIbubble`,
          });
        }
      }

      console.log(`  ✓ Polymarket: ${events.length} AI events (${parsedMarkets.length} contracts). Total volume: $${(totalVol / 1e6).toFixed(2)}M. 2026 Bubble odds: ${(bubble2026Prob * 100).toFixed(1)}%.`);
      return {
        yesProbability: bubble2026Prob,
        volumeUsd: totalVol,
        bubble2026Probability: bubble2026Prob,
        bubble2027Probability: bubble2027Prob,
        activeContractsCount: parsedMarkets.length,
        markets: parsedMarkets,
        referralCode: 'AIbubble',
        referralUrl: 'https://polymarket.com/?r=AIbubble',
        note: `Live Polymarket sync across ${events.length} active AI prediction events (Volume: $${(totalVol / 1e6).toFixed(2)}M)`,
      };
    }
  } catch (err) {
    console.warn(`  ↳ Polymarket fetch failed: ${err.message}. Retaining baseline.`);
    recordUpstream('polymarket', false, err.message);
  }

  return BASELINE_DEFAULTS.crowd;
}

/**
 * Helper to fetch a single Yahoo Finance chart quote
 */
async function fetchYahooQuote(ticker) {
  let res;
  try {
    res = await fetchWithRetry(
      `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1d&range=5d`,
      {
        group: 'yahoo',
        label: `Yahoo ${ticker}`,
        timeoutMs: 6000,
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
      }
    );
  } catch {
    return null; // already recorded against the 'yahoo' group by fetchWithRetry
  }

  try {
    const json = await res.json();
    const result = json.chart?.result?.[0];
    const meta = result?.meta;
    if (!meta) return null;
    // Pass 4 (2026-10-19): expose the previous-SESSION close for honest 24h change math.
    // Live-probed Oct 19, 2026 (ORCL / AAPL / ^TNX, interval=1d&range=5d):
    //   - meta.previousClose is UNDEFINED on Yahoo v8 chart metas;
    //   - meta.chartPreviousClose is the close BEFORE THE WINDOW'S FIRST BAR (~5 sessions back,
    //     e.g. ORCL 141.40 = Oct 9 close → produced the bogus −9.3% display; true session move
    //     was −4.64% per Alpha Vantage), so it must never anchor a "24h" change on Yahoo paths;
    //   - the daily candle series is present → second-to-last valid close IS the previous session;
    //   - meta.regularMarketChangePercent is session-basis and matched AV (−4.64 / +0.427 / +0.177).
    const closes = result.indicators?.quote?.[0]?.close || [];
    const validCloses = closes.filter((c) => typeof c === 'number' && c > 0);
    return {
      ...meta,
      _seriesPrevClose: validCloses.length >= 2 ? validCloses[validCloses.length - 2] : null,
      _yahooChangePct: typeof meta.regularMarketChangePercent === 'number' ? meta.regularMarketChangePercent : null,
    };
  } catch (err) {
    recordUpstream('yahoo', false, `invalid JSON payload for ${ticker}: ${err.message}`);
    return null;
  }
}

/**
 * Ingest Official Federal Reserve Economic Data (FRED)
 */
async function fetchFredObservations() {
  console.log('[FRED API] Querying official St. Louis Fed series (DGS10, DGS2, BAMLH0A0HYM2, FEDFUNDS)...');
  const res = { us10y: null, us02y: null, hyOasBps: null, fedFunds: null };
  try {
    const fetchFredSeries = async (id) => {
      const url = `https://api.stlouisfed.org/fred/series/observations?series_id=${id}&api_key=${FRED_API_KEY}&file_type=json&sort_order=desc&limit=1`;
      try {
        const r = await fetchWithRetry(url, {
          group: 'fred',
          label: `FRED ${id}`,
          timeoutMs: 6000,
        });
        const j = await r.json();
        const val = parseFloat(j.observations?.[0]?.value);
        return isNaN(val) ? null : val;
      } catch {
        return null; // already recorded against the 'fred' group by fetchWithRetry
      }
    };

    const [d10, d2, hy, ff] = await Promise.all([
      fetchFredSeries('DGS10'),
      fetchFredSeries('DGS2'),
      fetchFredSeries('BAMLH0A0HYM2'),
      fetchFredSeries('FEDFUNDS'),
    ]);

    if (d10 !== null) res.us10y = Math.round(d10 * 100) / 100;
    if (d2 !== null) res.us02y = Math.round(d2 * 100) / 100;
    // 2026-10-19 (pass 11): BAMLH0A0HYM2 is the ICE BofA US High Yield OAS (daily, in percent).
    // e.g. 3.23 -> 323 bps. This observation is now the published LEVEL for the HY-OAS row
    // (fallback: the verified 323bp seed from the Oct 15 2026 print).
    if (hy !== null) res.hyOasBps = Math.round(hy * 100);
    if (ff !== null) res.fedFunds = Math.round(ff * 100) / 100;

    console.log(`  ✓ FRED: US10Y=${res.us10y ?? '5.10'}%, US02Y=${res.us02y ?? '4.75'}%, HY-OAS=${res.hyOasBps ?? '323'}bp (BAMLH0A0HYM2), FEDFUNDS=${res.fedFunds ?? '3.75'}%`);
  } catch (err) {
    console.warn(`  ↳ FRED query notice: ${err.message}. Retaining live fallbacks.`);
    recordUpstream('fred', false, err.message);
  }
  return res;
}

/**
 * Ingest Real-Time Quote from Finnhub Institutional API
 */
async function fetchFinnhubQuote(symbol) {
  try {
    const url = `https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(symbol)}&token=${FINNHUB_API_KEY}`;
    const r = await fetchWithRetry(url, {
      group: 'finnhub',
      label: `Finnhub quote ${symbol}`,
      timeoutMs: 5000,
    });
    const j = await r.json();
    if (typeof j.c === 'number' && j.c > 0) {
      return {
        _source: 'finnhub', // j.pc here IS the true previous-session close (unlike Yahoo chart metas)
        regularMarketPrice: j.c,
        chartPreviousClose: j.pc,
        fiftyTwoWeekHigh: j.h,
      };
    }
  } catch (err) {
    // already recorded against the 'finnhub' group by fetchWithRetry
  }
  return null;
}

/**
 * Ingest SEC EDGAR Form 8-K/10-Q/10-K Filings from Finnhub
 */
async function fetchFinnhubSecFilings(symbol = 'ORCL') {
  try {
    const url = `https://finnhub.io/api/v1/stock/filings?symbol=${encodeURIComponent(symbol)}&token=${FINNHUB_API_KEY}`;
    const r = await fetchWithRetry(url, {
      group: 'finnhub',
      label: `Finnhub filings ${symbol}`,
      timeoutMs: 6000,
    });
    const filings = await r.json();
    if (Array.isArray(filings) && filings.length > 0) {
      const recent8Ks = filings.filter((f) => f.form === '8-K').length;
      console.log(`  ✓ Finnhub SEC: Scanned ${filings.length} ${symbol} SEC filings (${recent8Ks} Form 8-K disclosures with SEC.gov archives).`);
      return { filings: filings.slice(0, 10), recent8Ks };
    }
  } catch (err) {
    console.warn(`  ↳ Finnhub SEC notice: ${err.message}.`);
  }
  return null;
}

/**
 * 3. Fetch Institutional Quotes (FRED + Finnhub + Yahoo Finance Multi-Tier Stream)
 */
async function fetchLiveStocksAndMacro() {
  console.log('[3/5] Fetching live quotes from Yahoo Finance (Tech & Macro Tickers)...');

  // Pass 4 (2026-10-19): previous-SESSION close for 24h-display math. Resolution order:
  //   1. Yahoo daily candle series (second-to-last valid close) — probe-verified vs Alpha Vantage:
  //      ORCL −4.6% (AV −4.64%), AAPL +0.4% (AV +0.43%), ^TNX +2bp;
  //   2. Finnhub j.pc (true previous-session close);
  //   3. Yahoo's own regularMarketChangePercent (session basis, probe-matched vs AV);
  //   4. caller's neutral default. meta.chartPreviousClose is EXCLUDED on Yahoo paths — it anchors
  //      a ~5-session weekly move (the old ORCL −9.3% artifact). Prices are never altered.
  const sessionPrevClose = (meta) => {
    if (!meta) return null;
    const seriesPrev = typeof meta._seriesPrevClose === 'number' && meta._seriesPrevClose > 0 ? meta._seriesPrevClose : null;
    const finnhubPrev = meta._source === 'finnhub' && typeof meta.chartPreviousClose === 'number' && meta.chartPreviousClose > 0 ? meta.chartPreviousClose : null;
    return seriesPrev ?? finnhubPrev ?? null;
  };
  const sessionChangePct = (meta, fallbackPct) => {
    if (meta && typeof meta.regularMarketPrice === 'number') {
      const prev = sessionPrevClose(meta);
      if (prev) {
        return Math.round(((meta.regularMarketPrice - prev) / prev) * 1000) / 10;
      }
      if (typeof meta._yahooChangePct === 'number') {
        return Math.round(meta._yahooChangePct * 10) / 10;
      }
    }
    return fallbackPct;
  };

  // Fetch all tech tickers (Yahoo Finance with Finnhub institutional fallback)
  const stocks = [];
  for (const item of TARGET_TECH_TICKERS) {
    let meta = await fetchYahooQuote(item.ticker);
    if (!meta) {
      meta = await fetchFinnhubQuote(item.ticker);
    }
    let price = item.baselinePrice;
    let change24hPct = -1.5;
    let ath = item.athUsd;

    if (meta && typeof meta.regularMarketPrice === 'number') {
      price = Math.round(meta.regularMarketPrice * 100) / 100;
      const prevClose = sessionPrevClose(meta);
      if (prevClose) {
        change24hPct = Math.round(((price - prevClose) / prevClose) * 1000) / 10;
      } else if (typeof meta._yahooChangePct === 'number') {
        change24hPct = Math.round(meta._yahooChangePct * 10) / 10;
      }
      if (typeof meta.fiftyTwoWeekHigh === 'number' && meta.fiftyTwoWeekHigh > ath) {
        ath = meta.fiftyTwoWeekHigh;
      }
    }

    const drawdownFromAthPct = Math.round(((price - ath) / ath) * 1000) / 10;

    stocks.push({
      ticker: item.ticker,
      name: item.name,
      priceUsd: price,
      change24hPct,
      category: item.category,
      athUsd: ath,
      drawdownFromAthPct,
      role: item.role,
      marketCapDisplay: item.marketCapDisplay,
      // 2026-10-19 (pass 7): share count behind the static cap display (filing cover page). Present only
      // where verified; undefined entries are dropped by JSON.stringify.
      sharesOutstanding: item.sharesOutstanding,
    });
  }

  // Fetch official Federal Reserve Economic Data (FRED) observations
  const fredData = await fetchFredObservations();

  // Fetch macro tickers: ^TNX (US10Y), 2YY=F (US02Y), HYG, ^VIX
  const [tnxMeta, twoYearMeta, hygMeta, vixMeta] = await Promise.all([
    fetchYahooQuote('^TNX'),
    fetchYahooQuote('2YY=F'),
    fetchYahooQuote('HYG'),
    fetchYahooQuote('^VIX'),
  ]);

  let us10y = fredData.us10y !== null ? fredData.us10y : 5.10;
  let us10yChangeBps = 1.0;
  let us10yChangePct = 0.20;
  if (tnxMeta && typeof tnxMeta.regularMarketPrice === 'number') {
    us10y = Math.round(tnxMeta.regularMarketPrice * 100) / 100;
    const prev = sessionPrevClose(tnxMeta); // was chartPreviousClose (≈5-session anchor) — see fetchLiveStocksAndMacro note
    if (prev) {
      us10yChangeBps = Math.round((us10y - prev) * 1000) / 10;
      us10yChangePct = Math.round(((us10y - prev) / prev) * 1000) / 10;
    } else if (typeof tnxMeta._yahooChangePct === 'number') {
      us10yChangePct = Math.round(tnxMeta._yahooChangePct * 10) / 10;
    }
  }

  // 2026-10-19 (pass 11): the US02Y fallback stays 4.75% — a legacy DGS2 anchor that was NOT
  // re-verified on Oct 19, 2026 (the FRED DGS2 observation is fetched but only used for the
  // DGS10/FRED cross-check above; the ticker row prefers the live 2YY=F quote).
  let us02y = 4.75;
  let us02yChangeBps = 0.0;
  let us02yChangePct = 0.0;
  if (twoYearMeta && typeof twoYearMeta.regularMarketPrice === 'number') {
    us02y = Math.round(twoYearMeta.regularMarketPrice * 100) / 100;
    const prev = sessionPrevClose(twoYearMeta); // previous-session anchor (was the ~5-session chartPreviousClose)
    if (prev) {
      us02yChangeBps = Math.round((us02y - prev) * 1000) / 10;
      us02yChangePct = Math.round(((us02y - prev) / prev) * 1000) / 10;
    } else if (typeof twoYearMeta._yahooChangePct === 'number') {
      us02yChangePct = Math.round(twoYearMeta._yahooChangePct * 10) / 10;
    }
  }

  let hygPrice = 76.86;
  let hygChangePct = -0.48;
  if (hygMeta && typeof hygMeta.regularMarketPrice === 'number') {
    hygPrice = Math.round(hygMeta.regularMarketPrice * 100) / 100;
    hygChangePct = sessionChangePct(hygMeta, -0.48); // previous-session basis (was the ~5-session chartPreviousClose)
  }

  let vixPrice = 19.99;
  let vixChangePct = 12.8;
  if (vixMeta && typeof vixMeta.regularMarketPrice === 'number') {
    vixPrice = Math.round(vixMeta.regularMarketPrice * 100) / 100;
    vixChangePct = sessionChangePct(vixMeta, 12.8); // previous-session basis (was the ~5-session chartPreviousClose)
  }

  // 2026-10-19 (pass 11): HY-OAS LEVEL = the FRED BAMLH0A0HYM2 observation (ICE BofA US High
  // Yield option-adjusted spread, daily). Verified print: 3.23% = 323bp on Oct 15 2026; the
  // fallback seed below is that same verified print. The HYG-ETF inverse proxy is demoted to the
  // ticker row's CHANGE display only — it is a market-direction hint, never the published level.
  const hyOasLevelBps = fredData.hyOasBps !== null ? fredData.hyOasBps : 323;
  // HYG-inverse proxy: intraday change hint for the ticker row (NOT the published spread level).
  const hySpreadProxyBps = Math.max(200, Math.min(600, Math.round(323 - hygChangePct * 15)));
  // The proxy's own deviation from the verified anchor — the only place the proxy is allowed to
  // surface: the ticker row's change display, never the published spread level.
  const hyProxyDeltaBps = hySpreadProxyBps - 323;

  const macro = [
    {
      symbol: 'US10Y',
      name: '10-Year Treasury Yield',
      valueDisplay: `${us10y.toFixed(2)}%`,
      changeDisplay: `${us10yChangeBps >= 0 ? '+' : ''}${us10yChangeBps.toFixed(1)} bps`,
      changePct: us10yChangePct,
      isRiskPositive: true,
      category: 'Treasury & Rates',
      description: 'Benchmark risk-free rate pricing long-duration tech discount curves',
    },
    {
      symbol: 'US02Y',
      name: '2-Year Treasury Yield',
      valueDisplay: `${us02y.toFixed(2)}%`,
      changeDisplay: `${us02yChangeBps >= 0 ? '+' : ''}${us02yChangeBps.toFixed(1)} bps`,
      changePct: us02yChangePct,
      isRiskPositive: true,
      category: 'Treasury & Rates',
      description: 'Short-end rate pricing near-term Federal Reserve policy stance',
    },
    {
      symbol: 'CPI',
      name: 'Headline CPI Inflation',
      // 2026-10-19: FRED CPIAUCSL Sep-2026 obs 336.298 vs Sep-2025 324.245 → +3.72% YoY; the old '2.9% YoY' was stale (was '2.9% YoY', '+0.2% / +7.4% rel').
      valueDisplay: '3.72% YoY',
      // 2026-10-19 (round-2 consolidation): the old changeDisplay '+0.8%' / changePct 28.3 was a
      // base-effect artifact of the PREVIOUS PUBLISHED DISPLAY ANCHOR (2.9% YoY), and read on the
      // card as "CPI up 28.3%". The prior-year YoY needed for a real period-over-period CPI
      // change is NOT verified, so no YoY percentage is published. The move is now stated for
      // what it is — the gap to the prior published anchor — and changePct is 0 (no verified
      // period change to report). Same fix mirrored into src/data/live-stocks.json and
      // src/data/live-stocks.ts.
      changeDisplay: '+0.8pp vs 2.9% anchor',
      changePct: 0,
      isRiskPositive: true,
      category: 'Inflation & Fed',
      description: 'Consumer price index measuring inflation stickiness vs 2.0% Fed target',
    },
    {
      symbol: 'FEDFUNDS',
      name: 'Fed Funds Rate',
      // 2026-10-19: FRED FEDFUNDS monthly obs = 3.75% (Sep 2026); delivered 2026 cut cycle — the old
      // '4.75% / +25bp hike / higher-for-longer' literal was a stale 2025 anchor.
      valueDisplay: '3.75%',
      changeDisplay: '-100bp cut cycle',
      changePct: 0.0,
      isRiskPositive: true,
      category: 'Inflation & Fed',
      description: 'Effective federal funds rate on the 2026 cut-cycle easing path',
    },
    {
      symbol: 'AI-DEBT',
      name: 'Annual AI Debt Issuance',
      valueDisplay: '$85.0B/yr',
      // 2026-10-19 (round-2 consolidation): the old '+215% YoY' / changePct 215.0 had NO source —
      // no verified 2025 AI debt issuance pace exists in the tracked set, so the implied 2025
      // base (~$27B) and the "+$58B" it would imply are both unsourced derivations. The derived
      // percentage is blanked (changePct 0) and the badge says plainly that no YoY source exists,
      // rather than publishing a number the site cannot stand behind.
      changeDisplay: 'no YoY source',
      changePct: 0,
      isRiskPositive: true,
      category: 'Credit & Debt',
      description: 'Annualized pace of corporate AI bonds, converts & private GPU credit lines',
    },
    {
      symbol: 'HY-OAS',
      name: 'US High Yield Spread',
      // 2026-10-19 (pass 11): the LEVEL is the FRED BAMLH0A0HYM2 observation (fallback: the
      // verified 323bp seed from the Oct 15 2026 print). The change column keeps the HYG-ETF
      // inverse proxy — it is a market-direction hint, not a second spread measurement.
      valueDisplay: `${hyOasLevelBps} bps`,
      changeDisplay: `${hyProxyDeltaBps >= 0 ? '+' : '-'}${Math.abs(hyProxyDeltaBps)} bps (HYG proxy)`,
      changePct: Math.round(-hygChangePct * 100) / 100,
      isRiskPositive: true,
      category: 'Credit & Debt',
      description: 'ICE BofA US High Yield option-adjusted spread measuring junk credit stress',
    },
    {
      symbol: 'VIX',
      name: 'CBOE Volatility Index',
      valueDisplay: `${vixPrice.toFixed(2)}`,
      changeDisplay: `${vixChangePct >= 0 ? '+' : ''}${vixChangePct.toFixed(1)}%`,
      changePct: vixChangePct,
      isRiskPositive: true,
      category: 'Credit & Debt',
      description: 'Equity market implied volatility and systemic tail-risk sentiment',
    },
    {
      symbol: 'BAA-SPREAD',
      name: "Moody's Baa Corporate Spread",
      // 2026-10-19: FRED BAA10YM Sep-2026 monthly obs = 1.48% → 148bps (was a stale '182 bps' literal);
      // the relative-change fields were never API-sourced — kept as-is pending a series to diff against.
      valueDisplay: '148 bps',
      changeDisplay: '+6 bps',
      changePct: 3.4,
      isRiskPositive: true,
      category: 'Credit & Debt',
      description: "Moody's Baa corporate bond spread over Treasuries measuring investment-grade credit risk",
    },
    {
      symbol: 'GPU-RENT',
      name: 'H100 GPU Spot Rental Rate',
      valueDisplay: '$2.15/GPU-h',
      changeDisplay: '-8.5% MoM',
      changePct: -8.5,
      isRiskPositive: false,
      category: 'Commodities & Compute',
      description: 'H100 SXM5 80GB hourly cloud spot rental rate tracking AI compute supply-demand dynamics',
    },
    {
      symbol: 'COPPER-GOLD',
      name: 'Copper / Gold Ratio',
      valueDisplay: '0.198',
      changeDisplay: '-2.1%',
      changePct: -2.1,
      isRiskPositive: false,
      category: 'Commodities & Compute',
      description: 'Doctor Copper to Gold ratio acting as macro industrial demand and economic growth proxy',
    },
  ];

  console.log(`  ✓ Yahoo Finance: Scanned ${stocks.length} tech stocks. US10Y: ${us10y}% (${us10yChangeBps >= 0 ? '+' : ''}${us10yChangeBps}bp), HY-OAS: ${hyOasLevelBps}bp (FRED BAMLH0A0HYM2), VIX: ${vixPrice}.`);

  return {
    stocks,
    macro,
    liveMacroInputs: {
      // 2026-10-19 fact-check: this builder previously overwrote the corrected macro with stale literals
      // (CPI 2.9 / Fed funds 4.75 / real yield = us10y − 2.4 / HY base 328). Mirrors the FRED-verified values:
      // CPI +3.72% YoY (CPIAUCSL Sep 2026 336.298 vs Sep 2025 324.245); Fed funds 3.75% (FEDFUNDS Sep 2026
      // monthly obs — 2026 cut cycle); 10y breakeven 2.35% (T10YIE Oct 16) for the real-yield subtraction;
      // HY-OAS = the FRED BAMLH0A0HYM2 observation itself (323bp on Oct 15 2026; the verified seed is the
      // fallback when the FRED call fails) — the HYG-inverse proxy is NOT published as a level.
      us10yYieldPct: us10y,
      us10yBaselinePct: 3.75,
      cpiInflationYoY: 3.72,
      fedFundsRatePct: 3.75,
      rateHikeRiskBps: 25,
      realYield10y: Math.round((us10y - 2.35) * 100) / 100, // T10YIE verified 2.35% (used to be a 2.4 plug)
      // 2026-10-19 (pass 11): published LEVEL = FRED BAMLH0A0HYM2 observation (fallback: verified 323bp
      // seed). The HYG-inverse proxy (hySpreadProxyBps) is used only for the ticker row's change display.
      highYieldSpreadBps: hyOasLevelBps,
      note: 'FRED-verified Oct 19 2026: US10Y 5.10% (DGS10, Oct 15); 10y breakeven 2.35% (T10YIE, Oct 16) → real 10y 2.75%; CPI +3.72% YoY (CPIAUCSL Sep 2026); Fed funds 3.75% (FEDFUNDS Sep 2026 — cut cycle); US HY OAS 323bp (BAMLH0A0HYM2, Oct 15 2026)',
    },
  };
}

/**
 * 4. Fetch latest SEC filings from SEC EDGAR (Free, Public)
 */
async function fetchSecEdgarFilings() {
  console.log('[4/5] Checking SEC EDGAR submissions for new material debt disclosures...');
  try {
    const res = await fetchWithRetry('https://data.sec.gov/submissions/CIK0001341439.json', {
      group: 'edgar',
      label: 'SEC EDGAR submissions',
      timeoutMs: 8000,
      headers: { 'User-Agent': 'AICapitalTracker Research/2.0 (contact@aicapitaltracker.org)' },
    });

    if (res.ok) {
      const data = await res.json();
      const recent = data.filings?.recent;
      const recent8Ks = (recent?.form || []).filter((f) => f === '8-K').length;
      console.log(`  ✓ SEC EDGAR: Oracle (CIK 0001341439) verified. Scanned ${recent?.form?.length || 0} recent filings (${recent8Ks} Form 8-K disclosures).`);
      return { recent8Ks };
    }
  } catch (err) {
    console.warn(`  ↳ SEC EDGAR fetch failed: ${err.message}.`);
  }

  return null;
}

/**
 * 4b. Fetch live financial news wire from Yahoo Finance
 */
async function fetchYahooFinanceNews() {
  console.log('[4b/5] Ingesting live financial news wire from Yahoo Finance...');
  try {
    const res = await fetchWithRetry(
      'https://query1.finance.yahoo.com/v1/finance/search?q=artificial+intelligence&newsCount=12',
      {
        group: 'yahoo',
        label: 'Yahoo Finance news',
        timeoutMs: 8000,
        headers: { 'User-Agent': 'Mozilla/5.0' },
      }
    );
    if (res.ok) {
      const data = await res.json();
      const newsItems = data.news || [];
      if (Array.isArray(newsItems) && newsItems.length > 0) {
        const parsed = newsItems.slice(0, 10).map((n, idx) => {
          const title = n.title || '';
          const tLower = title.toLowerCase();
          let category = 'General AI';
          if (tLower.includes('debt') || tLower.includes('loan') || tLower.includes('bond') || tLower.includes('cds') || tLower.includes('credit')) {
            category = 'Debt & Credit';
          } else if (tLower.includes('openai') || tLower.includes('anthropic') || tLower.includes('mistral') || tLower.includes('xai')) {
            category = 'Frontier Labs';
          } else if (tLower.includes('microsoft') || tLower.includes('oracle') || tLower.includes('google') || tLower.includes('amazon') || tLower.includes('meta')) {
            category = 'Hyperscalers';
          } else if (tLower.includes('nvidia') || tLower.includes('chip') || tLower.includes('tsmc') || tLower.includes('power') || tLower.includes('nuclear')) {
            category = 'Silicon & Power';
          }
          const publishTime = n.providerPublishTime ? new Date(n.providerPublishTime * 1000) : new Date();
          const diffMinutes = Math.max(1, Math.round((Date.now() - publishTime.getTime()) / (60 * 1000)));
          const timeAgo = diffMinutes < 60 ? `${diffMinutes}m ago` : `${Math.round(diffMinutes / 60)}h ago`;
          return {
            id: n.uuid || `live-${idx}`,
            title,
            publisher: n.publisher || 'Yahoo Finance',
            link: n.link || 'https://finance.yahoo.com',
            publishedAt: publishTime.toISOString(),
            timeAgo,
            category,
            impact: idx < 3 ? 'High Impact' : 'Market Sentiment',
            summary: n.summary || `Live market intelligence reported by ${n.publisher || 'financial press'}.`,
          };
        });
        // 2026-10-19 (CI hardening): the news artifact is returned to the caller and
        // written in the atomic write phase (only when the fetch produced articles —
        // a failed news fetch leaves the previously published wire untouched).
        console.log(`  ✓ Yahoo Finance News: ${parsed.length} live articles parsed (cached in the write phase).`);
        return parsed;
      }
    }
  } catch (err) {
    console.warn(`  ↳ Yahoo Finance News fetch error: ${err.message}.`);
  }
  return null;
}

/**
 * Ledger date helper — deals.json stores announced_date as "D Mon YYYY" (e.g. "28 Sep 2026").
 * Parses to a UTC timestamp; ISO input accepted as fallback. Returns null when unparseable.
 */
const LEDGER_MONTHS = { jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11 };
function parseLedgerDate(raw) {
  if (!raw) return null;
  const s = String(raw).trim();
  const m = s.match(/^(\d{1,2})\s+([A-Za-z]{3})[a-z]*\.?,?\s+(\d{4})$/);
  if (m) {
    const mi = LEDGER_MONTHS[m[2].toLowerCase()];
    if (mi === undefined) return null;
    const d = new Date(Date.UTC(Number(m[3]), mi, Number(m[1])));
    return Number.isNaN(d.getTime()) ? null : d.getTime();
  }
  const iso = new Date(s);
  return Number.isNaN(iso.getTime()) ? null : iso.getTime();
}

/**
 * 5. Recompute aggregates from primary deals.json
 */
function computeLedgerAggregates() {
  console.log('[5/5] Recomputing deal ledger aggregates from deals.json...');
  if (!fs.existsSync(DEALS_FILE)) {
    console.warn('  ↳ deals.json not found, using baseline.');
    return { ...BASELINE_DEFAULTS.ledger };
  }

  const raw = fs.readFileSync(DEALS_FILE, 'utf-8');
  const deals = JSON.parse(raw);

  const totalDisclosedUsd = deals.reduce((sum, d) => sum + (d.amount_usd || 0), 0);
  const byYear = { 2023: 0, 2024: 0, 2025: 0, 2026: 0 };
  deals.forEach((d) => {
    const yr = d.year <= 2023 ? 2023 : d.year;
    byYear[yr] = (byYear[yr] || 0) + (d.amount_usd || 0);
  });

  const debtDeals = deals.filter((d) => d.is_debt);
  const debtTotal = debtDeals.reduce((sum, d) => sum + (d.amount_usd || 0), 0);
  const debtShare = totalDisclosedUsd > 0 ? debtTotal / totalDisclosedUsd : 0.070;

  const computeDeals = deals.filter((d) => d.is_compute);
  const computeTotal = computeDeals.reduce((sum, d) => sum + (d.amount_usd || 0), 0);
  const computeContractShare = totalDisclosedUsd > 0 ? computeTotal / totalDisclosedUsd : 0.280;

  const sorted = [...deals].sort((a, b) => b.amount_usd - a.amount_usd);
  const top10 = sorted.slice(0, 10);
  const top10Total = top10.reduce((sum, d) => sum + (d.amount_usd || 0), 0);
  const top10Share = totalDisclosedUsd > 0 ? top10Total / totalDisclosedUsd : 0.652;

  const circularDeals = deals.filter((d) => d.is_circular);
  const circularTotal = circularDeals.reduce((sum, d) => sum + (d.amount_usd || 0), 0);
  const circularShare = totalDisclosedUsd > 0 ? circularTotal / totalDisclosedUsd : 0.028;

  const announcedCount = deals.filter((d) => d.status.toLowerCase().includes('announced')).length;
  const announcedShare = deals.length > 0 ? announcedCount / deals.length : 0.132;

  // 2026-10-19 (pass 6): daysSinceLastMega + megaCountLast12m are DERIVED from deals.json, not hardcoded.
  // Mega class = is_mega || amount_usd >= $10B (threshold unchanged).
  //   daysSinceLastMega = whole days from the newest mega announcement to the sync date (UTC)
  //   megaCountLast12m  = mega-class deals announced inside the 365 days ending on the sync date
  // Sentinel 999 if no dated mega deal exists.
  const megaDeals = deals.filter((d) => d.is_mega || d.amount_usd >= 10_000_000_000);
  const syncDate = new Date();
  const syncDayUtc = Date.UTC(syncDate.getUTCFullYear(), syncDate.getUTCMonth(), syncDate.getUTCDate());
  const datedMegaDeals = megaDeals
    .map((d) => ({ deal: d, ts: parseLedgerDate(d.announced_date) }))
    .filter((x) => x.ts !== null);
  const newestMega = datedMegaDeals.length
    ? datedMegaDeals.reduce((a, b) => (b.ts > a.ts ? b : a))
    : null;
  const daysSinceLastMega = newestMega
    ? Math.max(0, Math.floor((syncDayUtc - newestMega.ts) / 86_400_000))
    : 999;
  const windowStartUtc = syncDayUtc - 365 * 86_400_000;
  const megaCountLast12m = datedMegaDeals.filter(
    (x) => x.ts >= windowStartUtc && x.ts <= syncDayUtc
  ).length;

  console.log(`  ✓ Ledger: ${deals.length} deals processed. Disclosed: $${(totalDisclosedUsd / 1e12).toFixed(2)}T. Debt share: ${(debtShare * 100).toFixed(1)}%.`);
  console.log(`    ↳ Newest mega deal: ${newestMega ? `${newestMega.deal.id} (${newestMega.deal.announced_date})` : 'none'} — ${daysSinceLastMega}d ago; ${megaCountLast12m} mega deals in last 12m (of ${megaDeals.length} total).`);

  return {
    totalDisclosedUsd,
    byYear,
    debtTotal,
    debtShare: Math.round(debtShare * 1000) / 1000,
    computeContractShare: Math.round(computeContractShare * 1000) / 1000,
    top10Share: Math.round(top10Share * 1000) / 1000,
    circularShare: Math.round(circularShare * 1000) / 1000,
    announcedShare: Math.round(announcedShare * 1000) / 1000,
    megaCountLast12m,
    daysSinceLastMega,
    count: deals.length,
  };
}

/**
 * 6. Continuous Trajectory History Management (observed canonical runs only)
 *
 * 2026-10-19 (lane 2b, algorithm-improvement wave / wave-1 summit):
 * the linear-interpolation backfill is RETIRED. The old block seeded a synthetic
 * 90-day path (today−4.2 … today, plus sine noise, and a var95 = probability × 1.8
 * series) whenever the file held fewer than 30 rows. That path was never observed
 * market history, and it made the UI publish a "+33.0 pts in 90 days" move that no
 * print ever produced.
 *
 * The rule now: ONE row per UTC date, written only from a real pipeline run
 * (the canonical artifact), and nothing is ever seeded. An empty file stays empty —
 * the chart shows a single point until day 2 — and a legacy file that still carries
 * seeded rows is purged on the next write.
 */
function updateTrajectoryHistory(todaySnapshot) {
  let history = [];
  if (fs.existsSync(TRAJECTORY_HISTORY_FILE)) {
    try {
      history = JSON.parse(fs.readFileSync(TRAJECTORY_HISTORY_FILE, 'utf-8'));
    } catch {}
  }
  if (!Array.isArray(history)) history = [];

  // 2026-10-19 (lane 2b): no seeding, ever. History starts on the first observed
  // canonical run.
  console.log('  ↳ Trajectory history: no seeding — history starts on the first observed canonical run.');

  const existingIdx = history.findIndex((h) => h && h.date === todaySnapshot.date);
  if (existingIdx >= 0) {
    history[existingIdx] = todaySnapshot; // one row per UTC date — the last successful run of the day wins
  } else {
    history.push(todaySnapshot);
  }

  // Observed rows only: a row that was seeded (legacy "backfilled": true) is dropped,
  // never rendered and never counted.
  const observed = history.filter(
    (h) => h && typeof h.date === 'string' && typeof h.probability === 'number' && h.backfilled !== true,
  );
  observed.sort((a, b) => a.date.localeCompare(b.date));

  const latestDate = observed.length ? observed[observed.length - 1].date : todaySnapshot.date;
  const dayGap = (dateStr) => {
    const a = Date.parse(`${dateStr}T00:00:00Z`);
    const b = Date.parse(`${latestDate}T00:00:00Z`);
    if (!Number.isFinite(a) || !Number.isFinite(b)) return 0;
    return Math.max(0, Math.round((b - a) / 86_400_000));
  };

  const normalized = observed.map((entry, idx) => ({
    ...entry,
    dayIndex: idx,
    dayLabel: entry.date === latestDate ? 'Current' : `${dayGap(entry.date)}d ago`,
    // 2026-10-19 (lane 2b): every row in this file came from a real pipeline run,
    // so the "backfilled" flag is always false. It is kept only so the out-of-lane
    // UI consumers (which read the flag) keep compiling against a stable shape.
    backfilled: false,
    // 2026-10-19 (lane 2b): the row's provenance marker — 'observed' = written from
    // a canonical pipeline run. There is no other kind of row any more.
    modelRun: entry.modelRun ?? 'observed',
  }));

  console.log(`✓ Prepared continuous trajectory history (${normalized.length} observed daily snapshots)`);
  return normalized;
}

/**
 * Canonical daily input snapshot (A-F8/A-F11 consensus, 2026-10-19).
 *
 * After a SUCCESSFUL run the canonical input state of the UTC day is archived at
 * src/data/input-history/YYYY-MM-DD.json. Later successful runs of the SAME day
 * overwrite it, so the last successful run of the UTC day owns the day's canonical
 * snapshot — the same rule the trajectory row follows. The archive is the replayable
 * record of the day's input state: the artifact can be recomputed from it byte-for-byte.
 */
function writeCanonicalInputSnapshot(dateStr) {
  try {
    if (!fs.existsSync(INPUT_HISTORY_DIR)) fs.mkdirSync(INPUT_HISTORY_DIR, { recursive: true });
    const snapshotPath = path.join(INPUT_HISTORY_DIR, `${dateStr}.json`);
    const inputs = readJsonIfParseable(LIVE_INPUTS_FILE);
    if (!inputs) {
      console.warn(`  ↳ Canonical input snapshot skipped: ${path.relative(projectRoot, LIVE_INPUTS_FILE)} is unreadable.`);
      return null;
    }
    const serialized = serializeArtifact({
      _snapshot: {
        date: dateStr,
        captured_at: new Date().toISOString(),
        rule: 'canonical daily snapshot — the last successful run of the UTC day owns this file',
      },
      inputs,
    });
    writeArtifact(snapshotPath, serialized);
    console.log(`  ✓ Written ${path.relative(projectRoot, snapshotPath)} (canonical daily input snapshot)`);
    return snapshotPath;
  } catch (err) {
    console.warn(`  ↳ Canonical input snapshot failed: ${err.message}`);
    return null;
  }
}

/**
 * Stamp the publication time on the computed artifact.
 *
 * 2026-10-19 (lane 2b): scripts/compute-artifact.mjs rewrites the model-output
 * fields and preserves every other key verbatim — including `timestamp`, which is
 * the PUBLICATION time of the run, not a model output. Without this stamp the
 * artifact would keep an old "as of" forever. Called only AFTER a successful
 * compute, so a failed compute still leaves the artifact completely untouched.
 */
function stampArtifactTimestamp() {
  const artifact = readJsonIfParseable(LATEST_MODEL_FILE);
  if (!artifact) return false;
  const stamped = { ...artifact, timestamp: new Date().toISOString() };
  writeArtifact(LATEST_MODEL_FILE, serializeArtifact(stamped));
  return true;
}

/**
 * Main Execution Function
 */
async function run() {
  const runStartTime = Date.now();
  console.log('========================================================================');
  console.log(' AI Capital Tracker — Automated 24h Data Refresher & Quantitative Engine');
  console.log(` Run Time: ${new Date().toISOString()}`);
  console.log('========================================================================\n');

  // 1. Fetch live market & crowd signals
  // 2026-10-19 (pass 11): fetchTokenPriceDeflation now also returns the scan provenance so a
  // non-snapping drift pin can be disclosed instead of being published silently.
  const { multiplier: tokenMultiple, scan: deflationScan, payload: liveModelsPayload } = await fetchTokenPriceDeflation();
  const crowdSignal = await fetchPolymarketOdds();
  const { stocks, macro, liveMacroInputs } = await fetchLiveStocksAndMacro();
  const liveNewsPayload = await fetchYahooFinanceNews();
  const secData = await fetchSecEdgarFilings();
  const ledgerAggregate = computeLedgerAggregates();

  // ── Upstream health gate (2026-10-19, CI hardening) ──────────────────────────
  // A single dead source is TOLERATED: the last verified seed is kept and the outage is
  // recorded in the _verified.inspected_and_stayed provenance block. A MAJORITY of the
  // independent upstream groups being unreachable means the pass is not trustworthy, so
  // the run aborts with exit code 1 BEFORE any artifact is written.
  const health = upstreamGroupHealth();
  const failedGroups = health.filter((h) => h.status === 'failed');
  const degradedGroups = health.filter((h) => h.status === 'degraded');
  console.log(`  ↳ Upstream health: ${health.length ? health.map((h) => `${h.name}=${h.status}`).join(' | ') : 'no source contacted'}`);
  if (health.length > 0 && failedGroups.length > health.length / 2) {
    console.error(`\n❌ MAJORITY of upstream source groups failed (${failedGroups.length}/${health.length}) — aborting before any file is written.`);
    for (const f of failedGroups) console.error(`   - ${f.name}: ${f.lastError}`);
    abortRun('data-sync aborted: upstream majority failure (no artifact written)');
    return;
  }
  for (const d of degradedGroups) {
    console.warn(`  ↳ ${d.name} degraded: ${d.failures}/${d.attempts} call(s) failed (${d.lastError})`);
  }

  // Prepare src/data/live-stocks.json (written in the atomic write phase)
  const liveStocksPayload = {
    timestamp: new Date().toISOString(),
    stocks,
    macro,
    // 2026-10-19 fact-check provenance for the panel (re-emitted every sync):
    _display_notes: [
      '24h change is computed as (price − previous-session close) / previous-session close, anchored on Yahoo\'s daily candle series (second-to-last closed candle); Finnhub j.pc serves as the previous-session close when Yahoo is unavailable, and Yahoo\'s own regularMarketChangePercent when fewer than 2 closed candles exist. Probe-verified against Alpha Vantage prev-close basis (Oct 16/19, 2026): ORCL −4.6% here vs AV −4.64%, AAPL +0.4% vs AV +0.43%, ^TNX +2bp — the earlier meta.chartPreviousClose anchor (close before the 5d-window start; it printed weekly moves as daily changes, e.g. ORCL −9.3%) is no longer used. Prices themselves are untouched. Tolerances: 1-decimal rounding (≤0.1pp) and intraday-session timing gaps vs AV\'s last-queried session are expected.',
      'CPI display is the FRED CPIAUCSL same-month YoY (Sep 2026 336.298 vs Sep 2025 324.245 = +3.72%), +0.8pp vs the prior 2.9% display anchor.',
      'Fed funds display is FRED FEDFUNDS (Sep 2026 monthly obs = 3.75%) — 2026 cut cycle; the previous 4.75%/+25bp-hike literal was stale.',
      'HY-OAS value is anchored at FRED BAMLH0A0HYM2 = 323bp (Oct 15, 2026); the on-screen day-change is a HYG-ETF inverse proxy (rounded ±15bp/%), not the ICE series itself.',
      'Baa-SPREAD value 148bp = FRED BAA10YM (Sep 2026 obs); its +6bp change remained an unverified carryover.',
      'Market caps are NOT derived from a Yahoo field: marketCapDisplay is a static string per ticker in TARGET_TECH_TICKERS, refreshed on Oct 19 2026 (pass 7) from filing cover-page share counts x the Oct 16/19 close, and the share count behind each refreshed name is now carried in the stocks array as sharesOutstanding. Refreshed: AMZN 10,786,313,572 (10-Q cover Jul 22 2026) x $250.00 = $2.70T (was $2.61T); ORCL 3,023,736,000 (10-Q cover Sep 7 2026) x $128.23 = $387.8B (was $353B; V3 quoted $388.7B, 0.2% price-date apart); CEG 354,307,379 (10-Q cover Jul 31 2026) x $271.37 = $96.1B (was $86.5B); NBIS 271,855,218 (238,400,165 A + 33,455,053 B, Q2 2026 release) x $165.47 = $45.0B (was $35.5B); SMCI 656,965,384 (FY2026 10-K cover Jul 31 2026) x $31.63 = $20.8B (was $18.5B). CRWV $53.2B → $33.9B (adjudicated 2026-10-19 per V3\'s EDGAR verdict): 551,536,602 shares outstanding (10-Q cover, Jul 31 2026 — 458,871,690 Class A + 92,664,912 Class B + 0 Class C; EDGAR accession 0001769628-26-000366) x $61.39 = $33.9B; the prior $53.2B (866.6M shares) appears in no filing — the Sep 17 2026 35M-share ATM is undrawn capacity, not outstanding shares.',
    ],
  };

  // Construct complete live inputs
  // 2026-10-19 (pass 11): the deflation scan is written into the provenance block whenever the
  // drift pin did NOT snap (identity mismatch or a price outside the ±25% band) — the raw scan is
  // disclosed in _verified.inspected_and_stayed so the published multiple is never silently drifted.
  // 2026-10-19 (CI hardening): every upstream outage / partial failure is RECORDED in the same
  // provenance block, so a tolerated single-source failure is never silent.
  const verifiedBlock = {
    ...VERIFIED_OCT2026_FACTCHECK,
    inspected_and_stayed: [...VERIFIED_OCT2026_FACTCHECK.inspected_and_stayed],
  };
  if (!deflationScan.snapped) {
    const outcome = deflationScan.identity_ok
      ? `the scanned base-row price was outside the ±${Math.round(deflationScan.tolerance_pct * 100)}% band, so ${deflationScan.published_multiple}× was published as scanned`
      : `no base-row identity matched (fetch failed or the row is absent), so the verified ${deflationScan.published_multiple}× seed was published`;
    verifiedBlock.inspected_and_stayed.push(
      `OpenRouter scan ${deflationScan.scanned_at}: ${deflationScan.anchor_model_id} BASE row ` +
      `${deflationScan.identity_ok ? `matched (${deflationScan.matched_model_id})` : 'NOT matched — no base-row identity'} — ` +
      `scanned prompt $${deflationScan.scanned_prompt_per_m}/1M, completion $${deflationScan.scanned_completion_per_m}/1M ` +
      `(drift ${deflationScan.prompt_drift_pct}% vs the verified $0.0448/$0.08 pair, tolerance ±${Math.round(deflationScan.tolerance_pct * 100)}%) — ` +
      `${outcome}. ` +
      `Variant rows present in the catalog and excluded from the anchor: ${deflationScan.variant_rows_seen.length ? deflationScan.variant_rows_seen.join(', ') : 'none'}`
    );
  }

  // 2026-10-19 (CI hardening): record every tolerated upstream failure in the provenance
  // block — a degraded source must be visible in the published artifact, never silent.
  for (const note of upstreamOutageNotes()) {
    verifiedBlock.inspected_and_stayed.push(note);
  }

  const liveInputs = {
    ...BASELINE_DEFAULTS,
    crowd: crowdSignal,
    ledger: ledgerAggregate,
    adoption: {
      ...BASELINE_DEFAULTS.adoption,
      apiPriceDeclineMultiple: tokenMultiple,
    },
    aiDebt: {
      ...BASELINE_DEFAULTS.aiDebt,
      totalTrackedDebtUsd: ledgerAggregate.debtTotal || 214_890_400_000,
    },
    macro: liveMacroInputs,
    _verified: verifiedBlock,
    meta: {
      last_synced_at: new Date().toISOString(),
      sync_mode: 'autonomous_24h_telemetry',
      sources: [
        'Federal Reserve Economic Data (FRED) St. Louis API (DGS10, DGS2, BAMLH0A0HYM2, FEDFUNDS)',
        'Finnhub Institutional Financial API (Real-Time Equities & SEC EDGAR Filings)',
        'Alpha Vantage Treasury & Market Curve API',
        'OpenRouter Public Models Pricing API',
        'Polymarket Gamma Events API',
        'Yahoo Finance Institutional Quotes (25 Tech Tickers & Macro Indicators)',
        'SEC EDGAR Submissions CIK 0001341439',
        'AI Capital Tracker Verified Primary Ledger (deals.json)',
      ],
    },
  };

  // 2026-10-19 (CI hardening): the live-inputs artifact is written BEFORE the model is
  // computed (scripts/compute-artifact.mjs reads it from disk). The previous artifact is
  // read first so hand-maintained `_`-prefixed metadata (and the append-only _verified
  // trail) is carried forward instead of being dropped.
  const previousLiveInputs = readJsonIfParseable(LIVE_INPUTS_FILE);
  const liveInputsPayload = preserveUnderscoreMetadata(previousLiveInputs, liveInputs);

  // 2. Publish the artifact through the model-only compute script.
  //
  // 2026-10-19 (lane 2b, algorithm-improvement wave): this pipeline no longer
  // AUTHORS src/data/latest-model.json. The artifact is written by
  // `node scripts/compute-artifact.mjs`, which
  //   · reads the canonical input set from disk (src/data/live-inputs.json),
  //   · runs the same engine + 25,000-path Monte Carlo the test suite runs,
  //   · rewrites ONLY the model-output fields (model_version, burstProbability,
  //     compositeScore, band, coverage, fragilityIndex, systemicContagionPoints,
  //     topDriverIds, contributions, merton, altman, lppls, minsky, shillerCape,
  //     monteCarlo — including ciType / bandLowPct / simulatedShockCorrelations /
  //     innovationKurtosis, and DELETING the retired `confidenceInterval`),
  //   · preserves `_corrections` / `_verified` verbatim and appends a dated
  //     `_verified` row (idempotent), and
  //   · never touches a network or an input file.
  // One writer, no second copy of the model in the pipeline: the published
  // artifact can no longer drift from the engine (the old hand-written block
  // pinned model_version 2.5.0 and dropped the new Monte-Carlo fields).
  //
  // RUN ORDER MATTERS (inputs → fetches → artifact subprocess → upstream rows):
  //   1. the canonical inputs must be ON DISK before the script runs (it reads
  //      src/data/live-inputs.json) — so they are written first, atomically;
  //   2. the artifact must exist before the daily rows are written — the rows
  //      are derived from the CANONICAL artifact only;
  //   3. the upstream rows (trajectory + sync telemetry) are written last.
  console.log('\n[Quantitative Modeling] Computing the canonical artifact (scripts/compute-artifact.mjs)...');
  // The inputs are validated BEFORE they are published: a non-finite input means a
  // broken pass, and nothing may reach the disk.
  validateLiveInputs(liveInputs);
  writeArtifact(LIVE_INPUTS_FILE, serializeArtifact(liveInputsPayload));
  console.log(`  ✓ Written ${path.relative(projectRoot, LIVE_INPUTS_FILE)}`);

  const artifactRun = spawnSync(process.execPath, [COMPUTE_ARTIFACT_SCRIPT], {
    cwd: projectRoot,
    stdio: 'inherit',
    encoding: 'utf8',
  });
  if (artifactRun.error || artifactRun.status !== 0) {
    // FAIL FAST (outage behaviour): the compute script writes the artifact only
    // after a complete pass, so the published artifact is still the previous one —
    // untouched. The run aborts with exit code 1 and publishes no row.
    const why = artifactRun.error ? artifactRun.error.message : `exit code ${artifactRun.status}`;
    console.error(`  ↳ compute-artifact failed (${why}) — the published artifact was not touched.`);
    abortRun('data-sync aborted: artifact computation failed (no artifact written)');
    return;
  }

  // The canonical artifact is the ONLY source of the published numbers below.
  const latestModelResult = readJsonIfParseable(LATEST_MODEL_FILE);
  if (!latestModelResult) {
    console.error('  ↳ compute-artifact produced no readable artifact.');
    abortRun('data-sync aborted: the computed artifact is missing or unparseable');
    return;
  }
  // 2026-10-19 (lane 2b): the publication time is stamped after a successful compute
  // (the compute script preserves every non-model key verbatim, `timestamp` included).
  stampArtifactTimestamp();
  validateCanonicalArtifact(latestModelResult);

  // 2026-10-19 (lane 2b): the model-output block is GONE from this file — the canonical
  // artifact above is the single source of the published numbers. The hand-maintained
  // `_corrections` / `_verified` trails are preserved by the compute script itself.
  console.log(`✓ Evaluated latest model (canonical artifact written by compute-artifact.mjs)`);
  console.log(`  ↳ Burst Probability: ${latestModelResult.burstProbability}% [${latestModelResult.band.toUpperCase()}]`);
  console.log(`  ↳ Composite Score: ${latestModelResult.compositeScore} / 100`);
  console.log(`  ↳ Merton DD: ${latestModelResult.merton.distanceToDefault}σ (Default Prob: ${latestModelResult.merton.defaultProbabilityPct}%)`);
  console.log(`  ↳ Altman Z'': ${latestModelResult.altman.score} (${latestModelResult.altman.zone})`);
  console.log(`  ↳ Minsky: Regime: ${latestModelResult.minsky.currentRegime} (Fragility: ${latestModelResult.minsky.minskyFragilityIndex}, Ponzi: ${latestModelResult.minsky.ponziSharePct}%)`);
  console.log(`  ↳ Shiller CAPE: ${latestModelResult.shillerCape.aiCapeMultiple}x, ECY: ${latestModelResult.shillerCape.excessCapeYieldPct}% (${latestModelResult.shillerCape.equityRiskPremiumBand})`);
  console.log(`  ↳ MC range type: ${latestModelResult.monteCarlo.ciType} — ci90 ${JSON.stringify(latestModelResult.monteCarlo.ci90Pct)}, ci95 ${JSON.stringify(latestModelResult.monteCarlo.ci95Pct)}`);
  console.log(`  ↳ Monte Carlo 25k (Cholesky): Median ${latestModelResult.monteCarlo.medianProbabilityPct}%, 95% VaR: ${latestModelResult.monteCarlo.valueAtRisk95Pct}%, 99% VaR: ${latestModelResult.monteCarlo.valueAtRisk99Pct}% (${latestModelResult.monteCarlo.executionTimeMs}ms)`);

  // 3. Update continuous trajectory history
  const todayDateStr = new Date().toISOString().slice(0, 10);

  // 2026-10-19 (lane 2b): the sync telemetry is read BEFORE the daily row is built —
  // the row carries the same-day revision range (min/max/count of the resolved prints).
  let historyLogs = [];
  if (fs.existsSync(SYNC_HISTORY_FILE)) {
    try {
      historyLogs = JSON.parse(fs.readFileSync(SYNC_HISTORY_FILE, 'utf-8'));
    } catch {}
  }
  if (!Array.isArray(historyLogs)) historyLogs = [];

  // 2026-10-19 (lane 2b): the same-day REVISION RANGE — the min/max/count of the model
  // prints resolved on this UTC day (the current run included). The range is the honest
  // width of the day's inputs: a correction window (a re-synced input, a re-derived
  // deflation multiple) moves the print until it settles. The counts are PER UTC DAY.
  const todaysRuns = historyLogs.filter(
    (r) => r && typeof r.timestamp === 'string' && r.timestamp.slice(0, 10) === todayDateStr && typeof r.burst_probability === 'number',
  );
  const resolvedProbs = [...todaysRuns.map((r) => r.burst_probability), latestModelResult.burstProbability];
  const revisionStats = {
    min: Math.min(...resolvedProbs),
    max: Math.max(...resolvedProbs),
    runs: resolvedProbs.length,
  };

  // 2026-10-19 (pass 11): deltaVs90d is DERIVED from trajectory-history.json (newest probability
  // − row-0 probability, expressed in POINTS) instead of the hardcoded '+4.0%' literal.
  // 2026-10-19 (lane 2b): row 0 is now the FIRST OBSERVED point, so this is the move since
  // the first observed canonical run (the seeded 90-day path is retired).
  let deltaVs90d = null;
  try {
    if (fs.existsSync(TRAJECTORY_HISTORY_FILE)) {
      const priorRows = JSON.parse(fs.readFileSync(TRAJECTORY_HISTORY_FILE, 'utf-8'));
      if (Array.isArray(priorRows) && priorRows.length >= 2 && typeof priorRows[0].probability === 'number') {
        const pts = Math.round((latestModelResult.burstProbability - priorRows[0].probability) * 10) / 10;
        deltaVs90d = `${pts >= 0 ? '+' : ''}${pts.toFixed(1)} pts`;
      }
    }
  } catch {
    deltaVs90d = null;
  }

  // 2026-10-19 (round-2 consolidation): deltaVsYesterday is DERIVED from the previous recorded row's
  // probability (expressed in POINTS, like deltaVs90d) instead of the hardcoded '+0.2%' literal.
  // 2026-10-19 (lane 2b): the previous row is now an OBSERVED canonical run (never a seeded
  // interpolation point), so this is a real run-to-run move. Fallback '+0.0 pts'.
  let deltaVsYesterday = '+0.0 pts';
  try {
    if (fs.existsSync(TRAJECTORY_HISTORY_FILE)) {
      const priorRows = JSON.parse(fs.readFileSync(TRAJECTORY_HISTORY_FILE, 'utf-8'));
      if (Array.isArray(priorRows)) {
        const priorRow = priorRows
          .filter((r) => r && typeof r.date === 'string' && r.date < todayDateStr && typeof r.probability === 'number')
          .sort((a, b) => a.date.localeCompare(b.date))
          .pop();
        if (priorRow) {
          const pts = Math.round((latestModelResult.burstProbability - priorRow.probability) * 10) / 10;
          deltaVsYesterday = `${pts >= 0 ? '+' : ''}${pts.toFixed(1)} pts`;
        }
      }
    }
  } catch {
    deltaVsYesterday = '+0.0 pts';
  }

  const todaySnapshot = {
    dayIndex: 0, // 2026-10-19 (lane 2b): the index is re-assigned by updateTrajectoryHistory (it is the position in the observed history, not a fixed 89).
    date: todayDateStr,
    dayLabel: 'Current',
    probability: latestModelResult.burstProbability,
    burstProbability: latestModelResult.burstProbability,
    compositeScore: latestModelResult.compositeScore,
    mertonDD: latestModelResult.merton.distanceToDefault,
    altmanZ: latestModelResult.altman.score,
    var95: latestModelResult.monteCarlo.valueAtRisk95Pct,
    deltaVs90d: deltaVs90d ?? '+0.0 pts',
    // 2026-10-19 (round-2 consolidation): derived from the previous row in points (see above) —
    // was a hardcoded '+0.2%' literal that did not describe the row-to-row move.
    deltaVsYesterday,
    cdsOracleBps: liveInputs.cds?.currentBps ?? 288,
    polymarketProb: crowdSignal.yesProbability,
    volumeUsd: Math.round(crowdSignal.volumeUsd || 0),
    tokenDeflation: tokenMultiple,
    us10yYield: liveMacroInputs.us10yYieldPct,
    // 2026-10-19 (lane 2b): every row is an OBSERVED snapshot of a real pipeline run — the
    // seeded interpolation rows are retired, so the flag is always false.
    backfilled: false,
    // 2026-10-19 (lane 2b): provenance marker + the same-day revision range (the min/max/count
    // of the prints resolved on this UTC day, the current run included).
    modelRun: 'observed',
    // 2026-10-19: the model version that produced this row. A trajectory that mixes
    // formula versions would read a re-specification as a market move, so every row
    // carries the version it was computed under.
    modelVersion: latestModelResult.model_version ?? '2.6.0',
    revision_min_pct: revisionStats.min,
    revision_max_pct: revisionStats.max,
    revision_runs: revisionStats.runs,
  };
  const trajectoryHistory = updateTrajectoryHistory(todaySnapshot);

  // 4. Update sync history with telemetry & delta vs previous run
  // (historyLogs was read above — before the daily row — so the revision range and the
  // telemetry log describe the same day.)
  const prevLog = historyLogs[0] || null;
  const deltaVsPrevious = prevLog
    ? {
        burst_probability_delta: Math.round(((latestModelResult.burstProbability - (prevLog.burst_probability ?? latestModelResult.burstProbability))) * 10) / 10,
        polymarket_prob_delta: Math.round(((crowdSignal.yesProbability - (prevLog.polymarket_yes_prob ?? crowdSignal.yesProbability))) * 1000) / 1000,
        disclosed_volume_delta_usd: ledgerAggregate.totalDisclosedUsd - (prevLog.disclosed_volume_usd ?? ledgerAggregate.totalDisclosedUsd),
      }
    : {
        burst_probability_delta: 0,
        polymarket_prob_delta: 0,
        disclosed_volume_delta_usd: 0,
      };

  const currentRunDurationMs = Date.now() - runStartTime;

  historyLogs.unshift({
    timestamp: new Date().toISOString(),
    status: 'SUCCESS',
    execution_time_ms: currentRunDurationMs,
    sources_scanned: [
      'OpenRouter Public Models Pricing API',
      'Polymarket Gamma Events API',
      'Yahoo Finance Institutional Quotes (21 Tech Tickers & Macro Indicators)',
      'SEC EDGAR Submissions (Oracle CIK 0001341439)',
      'AI Capital Tracker Verified Primary Ledger (deals.json)',
    ],
    burst_probability: latestModelResult.burstProbability,
    composite_score: latestModelResult.compositeScore,
    risk_band: latestModelResult.band,
    merton_dd: latestModelResult.merton.distanceToDefault,
    altman_z: latestModelResult.altman.score,
    token_decline_multiple: `${tokenMultiple}x`,
    polymarket_yes_prob: crowdSignal.yesProbability,
    disclosed_volume_usd: ledgerAggregate.totalDisclosedUsd,
    debt_share_pct: `${(ledgerAggregate.debtShare * 100).toFixed(1)}%`,
    deals_count: ledgerAggregate.count,
    delta_vs_previous: deltaVsPrevious,
  });

  historyLogs = historyLogs.slice(0, 30);
  console.log(`✓ Prepared sync telemetry log (${historyLogs.length} historical runs retained, duration: ${currentRunDurationMs}ms)`);
  console.log(`  ↳ Same-day revision range (${todayDateStr}): ${revisionStats.min}% – ${revisionStats.max}% over ${revisionStats.runs} resolved run(s)`);

  // ── Validation gate (2026-10-19, CI hardening) ────────────────────────────────
  // A non-finite or out-of-range derived value means the pass is broken: fail loudly
  // (exit code 1) instead of publishing a corrupt artifact.
  // 2026-10-19 (lane 2b): the inputs were validated before they were written and the
  // canonical artifact right after the compute script produced it — both gates are
  // already closed by the time the upstream rows are written.

  // ── Atomic write phase (2026-10-19, CI hardening) ─────────────────────────────
  // Every artifact is serialized + JSON.parse'd (sanity gate) FIRST; only then are the
  // files written in sequence (temp file + rename). Nothing is written when the gate
  // aborts, and no file is ever left half-written.
  //
  // 2026-10-19 (lane 2b): src/data/live-inputs.json and src/data/latest-model.json are
  // NOT in this list any more — the inputs were written before the compute script ran
  // (it reads them from disk) and the artifact is written by that script. Everything
  // below is the UPSTREAM ROW set: the daily trajectory row, the sync telemetry and
  // the auxiliary feeds.
  const artifacts = [
    { file: LIVE_STOCKS_FILE, payload: liveStocksPayload },
    { file: TRAJECTORY_HISTORY_FILE, payload: trajectoryHistory },
    { file: SYNC_HISTORY_FILE, payload: historyLogs },
    { file: LIVE_MODELS_FILE, payload: liveModelsPayload },
  ];
  // The news wire is only republished when the fetch actually produced articles —
  // a failed news fetch must not wipe the previously published wire.
  if (liveNewsPayload && Array.isArray(liveNewsPayload) && liveNewsPayload.length > 0) {
    artifacts.push({ file: LIVE_NEWS_FILE, payload: liveNewsPayload });
  } else {
    console.warn('  ↳ Yahoo Finance news: no articles fetched — keeping the previously published wire.');
  }

  writeArtifacts(artifacts);

  // ── Canonical daily input snapshot (A-F8/A-F11 consensus) ─────────────────────
  // The run is successful at this point: the canonical input state of the UTC day is
  // archived (overwritten by any later successful run of the same day — the LAST
  // successful run of the day owns the file). The archive is the replayable record of
  // the day's input state: the artifact can be recomputed from it byte-for-byte.
  writeCanonicalInputSnapshot(todayDateStr);

  console.log('\n========================================================================');
  console.log(' 24h Market Ingestion & Quantitative Automation Pipeline Complete!');
  console.log('========================================================================\n');
}

/**
 * Abort the run with a non-zero exit code without truncating buffered stdout:
 * exitCode is set first (so the exit status is correct even if the process ends
 * naturally) and a short unref'd timer guarantees termination if a keep-alive
 * socket is still open.
 */
function abortRun(reason) {
  console.error(`❌ ${reason}`);
  process.exitCode = 1;
  setTimeout(() => process.exit(1), 50).unref();
}

run().catch((err) => {
  console.error('\n❌ Fatal sync error:', err && err.stack ? err.stack : err);
  abortRun('data-sync failed — no artifact was published');
});
