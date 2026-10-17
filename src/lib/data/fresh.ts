/**
 * Fresh-data reader: file-backed bridge between `scripts/ingest.ts` output
 * and the public site. Server-only (uses node:fs) — import exclusively from
 * Server Components / Route Handlers, never from client components.
 *
 * Reads (all optional, never throws):
 * - data/fresh_filings.json   — real SEC filing metadata written by ingest
 * - data/discovery_queue.json — quarantined review candidates (NOT deals)
 * - data/ingest_status.json   — last ingest attempt timestamp + outcome
 *
 * If the JSON files are absent (e.g. ingest never ran), every getter falls
 * back gracefully so pages render the static verified dataset instead.
 */

import fs from 'node:fs';
import path from 'node:path';

export interface FreshFiling {
  cik: string;
  form: string;
  filed_at: string;
  accession: string;
  primary_doc_url: string;
  items?: string;
  title: string;
}

export interface FreshDiscoveryItem {
  source: string;
  entity: string;
  formType: string;
  filingDate: string;
  accessionNumber: string;
  url: string;
  description: string;
  detectedAt: string;
}

export interface IngestStatus {
  lastAttemptAt: string;
  since: string;
  status: 'success' | 'partial' | 'blocked';
  filingsCount: number;
  queueCount: number;
  errors: string[];
}

export interface PlatformFreshness {
  /** ISO timestamp of the last ingest attempt, or null when ingest never ran. */
  lastIngestAt: string | null;
  /** 'live-ingest' when fresh files exist, otherwise the static dataset fallback. */
  source: 'live-ingest' | 'static-dataset';
  filingsCount: number;
  queueCount: number;
  ingestStatus: IngestStatus['status'] | null;
}

function dataFile(name: string): string {
  return path.join(process.cwd(), 'data', name);
}

function readJsonFile<T>(name: string): T | null {
  try {
    const file = dataFile(name);
    if (!fs.existsSync(file)) return null;
    return JSON.parse(fs.readFileSync(file, 'utf8')) as T;
  } catch {
    return null;
  }
}

function readJsonArray<T>(name: string): T[] {
  const parsed = readJsonFile<unknown>(name);
  return Array.isArray(parsed) ? (parsed as T[]) : [];
}

/** Real SEC filing metadata from the last ingest. Empty array when unavailable. */
export function getFreshFilings(): FreshFiling[] {
  const filings = readJsonArray<FreshFiling>('fresh_filings.json');
  return filings
    .filter((f) => f && typeof f.accession === 'string' && typeof f.filed_at === 'string')
    .sort((a, b) => b.filed_at.localeCompare(a.filed_at));
}

/** Quarantined discovery candidates (research leads only, never deals). */
export function getFreshDiscovery(): FreshDiscoveryItem[] {
  return readJsonArray<FreshDiscoveryItem>('discovery_queue.json');
}

/**
 * Freshness summary for "Data as of" badges. Prefers the ingest status
 * record's timestamp; falls back to the freshest JSON file mtime; null when
 * ingest never ran (callers then render the static-dataset fallback).
 */
export function getPlatformFreshness(): PlatformFreshness {
  const filings = readJsonArray<FreshFiling>('fresh_filings.json');
  const queue = readJsonArray<FreshDiscoveryItem>('discovery_queue.json');
  const status = readJsonFile<IngestStatus>('ingest_status.json');

  let lastIngestAt: string | null = null;
  if (status && typeof status.lastAttemptAt === 'string') {
    lastIngestAt = status.lastAttemptAt;
  } else {
    try {
      const mtimes = ['fresh_filings.json', 'discovery_queue.json']
        .map((n) => {
          const file = dataFile(n);
          return fs.existsSync(file) ? fs.statSync(file).mtime : null;
        })
        .filter((d): d is Date => d instanceof Date);
      if (mtimes.length > 0) {
        lastIngestAt = new Date(Math.max(...mtimes.map((d) => d.getTime()))).toISOString();
      }
    } catch {
      lastIngestAt = null;
    }
  }

  const hasFreshData = filings.length > 0 || queue.length > 0 || status !== null;
  return {
    lastIngestAt,
    source: hasFreshData ? 'live-ingest' : 'static-dataset',
    filingsCount: filings.length,
    queueCount: queue.length,
    ingestStatus: status?.status ?? null,
  };
}

/** Short human-readable date (YYYY-MM-DD) for badges; 'static dataset' fallback. */
export function formatFreshnessDate(iso: string | null): string {
  if (!iso) return 'static dataset';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 'static dataset';
  return d.toISOString().slice(0, 10);
}

// ---------------------------------------------------------------------------
// Ledger-vs-live freshness (additive): distinguishes MAX(announcement_date)
// of the verified ledger from the live SEC ingest timestamp so readers stop
// conflating "latest verified deal" with "platform is stale".
// ---------------------------------------------------------------------------

import type { Deal } from '../types';
import type { Company } from '../types';
import { VERIFIED_COMPANIES } from './dataset';

export interface LedgerFreshness {
  /** YYYY-MM-DD of the latest verified deal announcement, or null when empty. */
  latestVerifiedDealDate: string | null;
  /** Full title of that latest verified deal (never invented — from the ledger). */
  latestVerifiedTitle: string | null;
}

/**
 * Derives the newest verified deal from ledger rows. Pure + total (no I/O),
 * safe to call from any Server Component that already fetched deals.
 */
export function getLedgerFreshness(
  deals: Pick<Deal, 'announcement_date' | 'title'>[],
): LedgerFreshness {
  let latestDate: string | null = null;
  let latestTitle: string | null = null;
  for (const d of deals) {
    if (!d || typeof d.announcement_date !== 'string' || d.announcement_date === '') continue;
    if (latestDate === null || d.announcement_date > latestDate) {
      latestDate = d.announcement_date;
      latestTitle = typeof d.title === 'string' ? d.title : null;
    }
  }
  return { latestVerifiedDealDate: latestDate, latestVerifiedTitle: latestTitle };
}

const SHORT_MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
] as const;

/** '2026-03-24' (or full ISO) -> 'Mar 24 2026'. Locale-independent. */
export function formatLedgerDate(ymdOrIso: string | null): string {
  if (!ymdOrIso) return 'no verified deals';
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(ymdOrIso);
  if (!m) return 'no verified deals';
  const month = SHORT_MONTHS[Number(m[2]) - 1];
  if (!month) return 'no verified deals';
  return `${month} ${Number(m[3])} ${m[1]}`;
}

/**
 * Compact badge label derived from the real ledger title (never invented).
 * Prefers a '<Lead party> $<N>B' shape when the title contains one
 * (e.g. 'CoreWeave $8.5B'); otherwise truncates the verbatim title.
 */
export function shortDealLabel(title: string | null): string {
  if (!title) return 'untitled deal';
  const m = /([A-Za-z][\w&.'-]*)\b[^$()]{0,48}\$\s?([\d.,]+)\s?B/i.exec(title);
  if (m) return `${m[1]} $${m[2]}B`;
  return title.length > 48 ? `${title.slice(0, 48)}…` : title;
}

// ---------------------------------------------------------------------------
// Pending (unverified) rows: EVERYTHING the ingest pulled, surfaced for
// review. Merges discovery_queue candidates with fresh filings that never
// entered the queue, deduped by accession number. These are research leads
// only — never deals, never relationships, amounts always TBD.
// ---------------------------------------------------------------------------

export interface PendingItem {
  /** Accession number (dedupe key across queue + fresh filings). */
  key: string;
  /** Issuer display name as reported by EDGAR / the queue. */
  entity: string;
  /** Matched verified company, or null when the issuer isn't in the ledger. */
  company: Company | null;
  formType: string;
  filingDate: string;
  url: string;
  description: string;
  origin: 'discovery-queue' | 'fresh-filing';
}

/** Match a zero-padded CIK against the verified company ledger. */
export function matchCikToCompany(cik: string): Company | null {
  const norm = cik.replace(/^0+/, '');
  return VERIFIED_COMPANIES.find((c) => (c.cik ?? '').replace(/^0+/, '') === norm) ?? null;
}

const NAME_SUFFIX_RE =
  /\b(inc|corp|corporation|co|company|ltd|limited|plc|llc|lp|holdings|group|systems|technologies|energy|capital)\b\.?/g;

/** Lowercase alphanumeric signature: 'CoreWeave, Inc.' -> 'coreweave'. */
function nameSignature(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/[&]/g, ' and ')
    .replace(NAME_SUFFIX_RE, ' ')
    .replace(/[^a-z0-9]/g, '');
}

/**
 * Match a free-text issuer name (queue entity) against the verified ledger
 * by normalized signature over names + aliases + tickers. Null when unknown.
 */
export function matchEntityToCompany(entity: string): Company | null {
  const sig = nameSignature(entity);
  if (!sig) return null;
  for (const c of VERIFIED_COMPANIES) {
    const candidates = [c.name, ...c.aliases, c.ticker ?? ''].filter(Boolean);
    for (const cand of candidates) {
      const candSig = nameSignature(cand);
      if (!candSig) continue;
      if (candSig === sig || candSig.startsWith(sig) || sig.startsWith(candSig)) return c;
    }
  }
  return null;
}

/**
 * Every pulled filing as a pending review row: the full discovery queue plus
 * any fresh filing whose accession never entered the queue, newest first.
 * Pure read of data/*.json (never throws — empty array when ingest never ran).
 */
export function getPendingItems(): PendingItem[] {
  const queue = readJsonArray<FreshDiscoveryItem>('discovery_queue.json');
  const fresh = readJsonArray<FreshFiling>('fresh_filings.json');
  const seen = new Set<string>();
  const rows: PendingItem[] = [];

  for (const q of queue) {
    if (!q || typeof q.accessionNumber !== 'string') continue;
    seen.add(q.accessionNumber);
    rows.push({
      key: q.accessionNumber,
      entity: q.entity ?? 'Unknown issuer',
      company: matchEntityToCompany(q.entity ?? ''),
      formType: q.formType ?? '',
      filingDate: q.filingDate ?? '',
      url: q.url ?? '',
      description: q.description ?? '',
      origin: 'discovery-queue',
    });
  }
  for (const f of fresh) {
    if (!f || typeof f.accession !== 'string' || seen.has(f.accession)) continue;
    seen.add(f.accession);
    const company = matchCikToCompany(f.cik ?? '');
    rows.push({
      key: f.accession,
      entity: company?.name ?? `CIK ${f.cik}`,
      company,
      formType: f.form ?? '',
      filingDate: f.filed_at ?? '',
      url: f.primary_doc_url ?? '',
      description: f.title ?? '',
      origin: 'fresh-filing',
    });
  }
  rows.sort((a, b) => b.filingDate.localeCompare(a.filingDate));
  return rows;
}

/** Free-text filter over pending rows (entity + description + form). */
export function filterPendingItems(rows: PendingItem[], query: string | undefined): PendingItem[] {
  if (!query || query.trim() === '') return rows;
  const q = query.toLowerCase().trim();
  return rows.filter(
    (r) =>
      r.entity.toLowerCase().includes(q) ||
      r.description.toLowerCase().includes(q) ||
      r.formType.toLowerCase().includes(q),
  );
}
