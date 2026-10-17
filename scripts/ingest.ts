/**
 * Single-entry fresh-data ingestion pipeline.
 *
 * Run locally / in CI via `npm run ingest` (cross-platform: `tsx scripts/ingest.ts`).
 * Automated runs: .github/workflows/ingest.yml (if present).
 *
 * What it does:
 * 1. Fetches SEC EDGAR submissions JSON for each tracked CIK (free, no API key).
 * 2. Keeps filings within the lookback window (default: last 30 days, or `--since YYYY-MM-DD`).
 * 3. Keeps forms 8-K / 10-Q / 10-K. Flags the AI-infra-relevant subset via
 *    8-K items (1.01, 7.01, 8.01) or keywords (AI / data center / GPU / power / ...)
 *    matched against the filing's EDGAR description text.
 * 4. Writes BOTH:
 *    - data/fresh_filings.json   — real filing metadata only (never deal amounts)
 *    - data/discovery_queue.json — review candidates (relevant subset, merged/deduped)
 *    - data/ingest_status.json   — last attempt timestamp + outcome (even on SEC block)
 *
 * Integrity rule: this script NEVER invents deals or amounts. It records filing
 * metadata (accession, URL, date, items) that editors verify before any deal
 * is created. The public site reads these JSON files via src/lib/data/fresh.ts
 * to render the "Data as of" freshness badge.
 *
 * Usage:
 *   npm run ingest                        # last 30 days
 *   npm run ingest -- --since 2026-09-16 # explicit cutoff date (also: npx tsx scripts/ingest.ts --since 2026-09-16)
 *   npm run ingest -- --since 7          # last 7 days (days count also accepted)
 *   npm run ingest -- --since 7 --dry-run # fetch + log only, write no data files
 *   npx tsx scripts/ingest.ts --help     # print help
 *
 * Options:
 *   --since <days|YYYY-MM-DD>  Lookback window as days count (1-3650) or cutoff
 *                              date. Aliases: --since-days, --since=<value>.
 *                              Default: last 30 days.
 *   --dry-run                  Fetch and log only; do not write data/*.json
 *   --help, -h                 Print help and exit 0
 *
 * Exit codes: 0 success, 1 runtime failure, 2 CLI usage error
 *
 * Requires outbound HTTPS to data.sec.gov with a polite User-Agent
 * (set SEC_USER_AGENT, see .env.example). Honors SEC fair access (<10 req/sec).
 */

import fs from 'node:fs';
import path from 'node:path';
import { SecEdgarClient } from '../src/lib/crawlers/sec-edgar';

/** Tracked issuers: the 9 core AI-infra names (ticker -> CIK, zero-padded). */
const TRACKED_CIKS: Record<string, { cik: string; name: string }> = {
  NVDA: { cik: '0001045810', name: 'NVIDIA Corporation' },
  MSFT: { cik: '0000789019', name: 'Microsoft Corporation' },
  AMZN: { cik: '0001018724', name: 'Amazon.com, Inc.' },
  GOOGL: { cik: '0001652044', name: 'Alphabet Inc.' },
  META: { cik: '0001326801', name: 'Meta Platforms, Inc.' },
  ORCL: { cik: '0001341439', name: 'Oracle Corporation' },
  CEG: { cik: '0001868275', name: 'Constellation Energy' },
  TLN: { cik: '0001622228', name: 'Talen Energy' },
  VST: { cik: '0001692819', name: 'Vistra Corp.' },
};

const TRACKED_FORMS = new Set(['8-K', '10-Q', '10-K']);

/** 8-K items signalling material agreements / Reg FD / other events. */
const RELEVANT_ITEM_RE = /(^|[,;\s])(1\.01|7\.01|8\.01)([,;\s]|$)/;

/** Keyword screen applied to EDGAR description text (case-insensitive). */
const RELEVANT_KEYWORDS = [
  'ai',
  'artificial intelligence',
  'data center',
  'datacenter',
  'gpu',
  'power',
  'nuclear',
  'compute',
  'cloud',
  'chip',
  'semiconductor',
];

export interface FreshFiling {
  cik: string;
  form: string;
  filed_at: string;
  accession: string;
  primary_doc_url: string;
  items?: string;
  title: string;
}

interface QueueCandidate {
  source: string;
  entity: string;
  formType: string;
  filingDate: string;
  accessionNumber: string;
  url: string;
  description: string;
  detectedAt: string;
}

interface IngestStatus {
  lastAttemptAt: string;
  since: string;
  status: 'success' | 'partial' | 'blocked';
  filingsCount: number;
  queueCount: number;
  errors: string[];
}

interface CliOptions {
  /** Cutoff date in YYYY-MM-DD form: filings with filingDate >= since are kept. */
  since: string;
  /** When true, fetch + log only; no data/*.json files are written. */
  dryRun: boolean;
}

function printUsage(): void {
  console.log(`AI Capital Tracker - Fresh-Data Ingestion Crawler

Usage:
  npx tsx scripts/ingest.ts [options]

Options:
  --since <days|YYYY-MM-DD>  Lookback window as days count (1-3650) or cutoff
                             date (default: last 30 days).
                             Aliases: --since-days, --since=<value>
  --dry-run                  Fetch and log only; do not write data/*.json
  --help, -h                 Show this help message

Examples:
  npx tsx scripts/ingest.ts --since 30
  npx tsx scripts/ingest.ts --since 2026-09-16
  npx tsx scripts/ingest.ts --since 7 --dry-run

Exit codes: 0 success, 1 runtime failure, 2 usage error`);
}

function parseArgs(argv: string[]): CliOptions {
  const fail = (message: string): never => {
    console.error(`[USAGE] ${message}\n`);
    printUsage();
    process.exit(2);
  };

  const daysToDate = (days: number): string => {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - days);
    return d.toISOString().slice(0, 10);
  };

  const parseSinceValue = (raw: string): string => {
    if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
      const t = Date.parse(raw);
      if (Number.isNaN(t)) fail(`--since date is not a real calendar date: ${JSON.stringify(raw)}`);
      return raw;
    }
    const n = Number(raw);
    if (!Number.isInteger(n) || n <= 0 || n > 3650) {
      fail(`--since must be a days count (1-3650) or a date (YYYY-MM-DD), got: ${JSON.stringify(raw)}`);
    }
    return daysToDate(n);
  };

  let since: string | undefined;
  let dryRun = false;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--help' || arg === '-h') {
      printUsage();
      process.exit(0);
    } else if (arg === '--dry-run') {
      dryRun = true;
    } else if (arg === '--since' || arg === '--since-days') {
      const value = argv[i + 1];
      if (value === undefined || value.startsWith('-')) {
        fail(`${arg} requires a value, e.g. ${arg} 30 or ${arg} 2026-09-16`);
      }
      i++;
      since = parseSinceValue(value);
    } else if (arg.startsWith('--since=')) {
      since = parseSinceValue(arg.slice('--since='.length));
    } else if (arg.startsWith('--since-days=')) {
      since = parseSinceValue(arg.slice('--since-days='.length));
    } else {
      fail(`Unknown argument: ${JSON.stringify(arg)}`);
    }
  }

  return { since: since ?? daysToDate(30), dryRun };
}

function matchesKeywords(text: string): boolean {
  const lower = text.toLowerCase();
  return RELEVANT_KEYWORDS.some((kw) => {
    if (kw === 'ai') return /\bai\b/.test(lower);
    return lower.includes(kw);
  });
}

function isRelevant(items: string | undefined, haystack: string): boolean {
  if (items && RELEVANT_ITEM_RE.test(items)) return true;
  return matchesKeywords(haystack);
}

function readJsonArray<T>(filePath: string): T[] {
  try {
    if (!fs.existsSync(filePath)) return [];
    const parsed: unknown = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

async function runPipeline(options: CliOptions) {
  const { since, dryRun } = options;
  const runAt = new Date().toISOString();
  console.log('====================================================');
  console.log('   AI CAPITAL TRACKER - FRESH DATA INGESTION        ');
  console.log(`   Run at: ${runAt}  Since: ${since}`);
  console.log(`   Mode: ${dryRun ? 'DRY-RUN (no writes)' : 'LIVE (writes data/*.json)'}`);
  if (!process.env.SEC_USER_AGENT) {
    console.warn('[WARN] SEC_USER_AGENT is not set; using default polite User-Agent.');
    console.warn('[WARN] Set the SEC_USER_AGENT secret (format: "AICapitalTracker/1.0 (contact@aicapitaltracker.com)").');
  }
  console.log('====================================================\n');

  const dataDir = path.join(process.cwd(), 'data');
  fs.mkdirSync(dataDir, { recursive: true });
  const freshPath = path.join(dataDir, 'fresh_filings.json');
  const queuePath = path.join(dataDir, 'discovery_queue.json');
  const statusPath = path.join(dataDir, 'ingest_status.json');

  const errors: string[] = [];
  const fresh: FreshFiling[] = [];
  const relevant: QueueCandidate[] = [];
  let issuersReached = 0;

  for (const [ticker, { cik, name }] of Object.entries(TRACKED_CIKS)) {
    console.log(`[SEC EDGAR] ${ticker} ${name} (CIK ${cik})...`);
    try {
      const filings = await SecEdgarClient.getCompanySubmissions(cik);
      issuersReached++;
      for (const f of filings) {
        if (!TRACKED_FORMS.has(f.formType)) continue;
        if (f.filingDate < since) continue;
        const title = f.description || `${name} Form ${f.formType} statutory filing`;
        fresh.push({
          cik,
          form: f.formType,
          filed_at: f.filingDate,
          accession: f.accessionNumber,
          primary_doc_url: f.documentUrl,
          items: f.items,
          title,
        });
        if (isRelevant(f.items, `${title} ${f.companyName}`)) {
          relevant.push({
            source: 'SEC EDGAR',
            entity: name,
            formType: f.formType,
            filingDate: f.filingDate,
            accessionNumber: f.accessionNumber,
            url: f.documentUrl,
            description: title,
            detectedAt: runAt,
          });
        }
      }
      console.log(` -> ${ticker}: ${filings.length} recent filings scanned`);
    } catch (err: unknown) {
      const msg = `${ticker}: ${err instanceof Error ? err.message : String(err)}`;
      console.error(`[SEC EDGAR] Fetch failed for ${msg}`);
      errors.push(msg);
    }
    // SEC fair-access: well under 10 req/sec.
    await new Promise((r) => setTimeout(r, 300));
  }

  // Total SEC block / outage: keep existing JSON files untouched, record attempt.
  if (issuersReached === 0) {
    const existingFresh = readJsonArray<FreshFiling>(freshPath);
    const existingQueue = readJsonArray<QueueCandidate>(queuePath);
    const status: IngestStatus = {
      lastAttemptAt: runAt,
      since,
      status: 'blocked',
      filingsCount: existingFresh.length,
      queueCount: existingQueue.length,
      errors,
    };
    if (dryRun) {
      console.log('\n[DRY-RUN] Skipping write to ingest_status.json.');
    } else {
      fs.writeFileSync(statusPath, JSON.stringify(status, null, 2), 'utf8');
    }
    console.log('\n[SEC BLOCKED] All EDGAR requests failed (403/429/network).');
    console.log(` - Existing data preserved: ${existingFresh.length} fresh filings, ${existingQueue.length} queued.`);
    console.log(` - Attempt recorded in: ${statusPath}`);
    return;
  }

  fresh.sort((a, b) => b.filed_at.localeCompare(a.filed_at));

  // Merge relevant subset into the persistent discovery queue (dedupe by accession).
  const existingQueue = readJsonArray<QueueCandidate>(queuePath);
  const seen = new Set(existingQueue.map((e) => e.accessionNumber));
  let newEntries = 0;
  for (const c of relevant) {
    if (!seen.has(c.accessionNumber)) {
      existingQueue.unshift(c);
      seen.add(c.accessionNumber);
      newEntries++;
    }
  }

  const status: IngestStatus = {
    lastAttemptAt: runAt,
    since,
    status: errors.length > 0 ? 'partial' : 'success',
    filingsCount: fresh.length,
    queueCount: existingQueue.length,
    errors,
  };
  if (dryRun) {
    console.log('\n[DRY-RUN] Skipping writes to data/*.json.');
    console.log(`[DRY-RUN] Would write ${fresh.length} fresh filings -> ${freshPath}`);
    console.log(`[DRY-RUN] Would write ${existingQueue.length} queued candidates (${newEntries} new) -> ${queuePath}`);
    console.log(`[DRY-RUN] Would write status -> ${statusPath}`);
  } else {
    fs.writeFileSync(freshPath, JSON.stringify(fresh, null, 2), 'utf8');
    fs.writeFileSync(queuePath, JSON.stringify(existingQueue, null, 2), 'utf8');
    fs.writeFileSync(statusPath, JSON.stringify(status, null, 2), 'utf8');
  }

  console.log('\n====================================================');
  console.log('[SUCCESS] Ingestion pipeline finished!');
  console.log(` - Issuers reached: ${issuersReached}/${Object.keys(TRACKED_CIKS).length}`);
  if (dryRun) {
    console.log(`[DRY-RUN] Fresh filings (since ${since}): ${fresh.length} (not written)`);
    console.log(`[DRY-RUN] New queue candidates: ${newEntries} (${existingQueue.length} total, not written)`);
  } else {
    console.log(` - Fresh filings (since ${since}): ${fresh.length} -> ${freshPath}`);
    console.log(` - New queue candidates: ${newEntries} (${existingQueue.length} total) -> ${queuePath}`);
    console.log(` - Status written to: ${statusPath}`);
  }
  if (errors.length > 0) console.log(` - Partial errors: ${errors.length} (see ingest_status.json)`);
  console.log('====================================================');
}

const options = parseArgs(process.argv.slice(2));

runPipeline(options).catch((err) => {
  console.error('[FATAL] Ingestion pipeline failed:', err);
  process.exit(1);
});
