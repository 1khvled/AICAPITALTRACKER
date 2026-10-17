/**
 * AUTO-DISCOVERY PIPELINE — scrapes new AI-capital deal signals on its own.
 *
 * Run locally / in CI via `npm run discover` (cross-platform: `tsx scripts/auto-discover.ts`).
 * Automated runs: .github/workflows/ingest.yml (daily cron + manual dispatch).
 *
 * What it does (in ONE run):
 * 1. Reads the tracked-company roster from src/lib/data/dataset.ts (companies +
 *    their aliases) — no hardcoded entity list to keep in sync by hand.
 * 2. Pulls Google News RSS for each tracked company filtered to deal-signal
 *    keywords (raises / funding / acquires / bonds / partnership / gigawatt / IPO ...).
 *    Free, no API key. Honors a lookback window (`when:Nd`).
 * 3. Pulls a curated set of company newsroom RSS feeds directly (robots.txt-checked
 *    through the SSRF-safe fetcher).
 * 4. Classifies each headline into a candidate_type, extracts matched companies,
 *    scores it (money mention = higher score), dedupes against the existing queue.
 * 5. Writes:
 *    - data/discovery_queue.json  — review candidates merged into the existing queue
 *    - data/ingest_status.json    — run stats merged (discovery_* fields)
 *    NEVER invents deals or amounts. Titles/links/dates only; editors verify.
 *
 * Integrity rule: this script NEVER invents deals or amounts. It queues
 * SIGNALS for human verification. The public ledger (src/lib/data/*) is
 * only touched by humans after verification.
 *
 * Usage:
 *   npm run discover                       # last 2 days of news (default)
 *   npm run discover -- --since 7          # last 7 days
 *   npm run discover -- --since 2026-10-01 # explicit cutoff date
 *   npm run discover -- --dry-run          # fetch + log only, write nothing
 *   npm run discover -- --max 100          # cap newly queued items (default 80)
 *   npm run discover -- --json             # also print queued items as JSON to stdout
 *   npx tsx scripts/auto-discover.ts --help
 *
 * Options:
 *   --since <days|YYYY-MM-DD>  Lookback window as days count (1-30) or cutoff
 *                              date. Default: 2 days.
 *   --dry-run                  Fetch and log only; do not write data/*.json
 *   --max <n>                  Maximum new candidates to add this run (default 80)
 *   --json                     Print the new candidates as JSON to stdout
 *   --help, -h                 Print help and exit 0
 *
 * Exit codes: 0 success (even with per-feed failures), 1 total failure
 * (zero feeds succeeded), 2 CLI usage error.
 *
 * Politeness: sequential fetches with a delay, per-feed errors are logged and
 * tolerated, robots.txt respected for direct newsroom feeds.
 */

import fs from 'node:fs';
import path from 'node:path';
import { SafeUrlValidator } from '../src/lib/crawlers/ssrf-protection';
import { DiscoveryMonitor } from '../src/lib/crawlers/discovery-monitor';
import type { DiscoveryCandidate } from '../src/lib/types';
import { VERIFIED_COMPANIES } from '../src/lib/data/dataset';

// ---------------------------------------------------------------------------
// CLI parsing
// ---------------------------------------------------------------------------

interface DiscoverArgs {
  sinceDays: number;
  sinceCutoff: string | null;
  dryRun: boolean;
  maxNew: number;
  printJson: boolean;
  help: boolean;
}

function parseArgs(argv: string[]): { args: DiscoverArgs; error?: string } {
  const args: DiscoverArgs = { sinceDays: 2, sinceCutoff: null, dryRun: false, maxNew: 80, printJson: false, help: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const next = argv[i + 1];
    if (a === '--help' || a === '-h') {
      args.help = true;
    } else if (a === '--dry-run') {
      args.dryRun = true;
    } else if (a === '--json') {
      args.printJson = true;
    } else if (a === '--max' || a.startsWith('--max=')) {
      const v = a.includes('=') ? a.split('=')[1] : next;
      const n = Number(v);
      if (!Number.isFinite(n) || n < 1 || n > 500) return { args, error: `--max expects 1-500, got: ${v ?? '(missing)'}` };
      args.maxNew = Math.floor(n);
      if (!a.includes('=')) i++;
    } else if (a === '--since' || a.startsWith('--since=')) {
      const v = a.includes('=') ? a.split('=')[1] : next;
      if (!v) return { args, error: '--since expects a value (days 1-30 or YYYY-MM-DD)' };
      if (/^\d+$/.test(v)) {
        const n = Number(v);
        if (n < 1 || n > 30) return { args, error: '--since days must be 1-30 for news feeds, got: ' + v };
        args.sinceDays = n;
      } else if (/^\d{4}-\d{2}-\d{2}$/.test(v)) {
        if (Number.isNaN(Date.parse(v))) return { args, error: `--since date is not valid: ${v}` };
        args.sinceCutoff = v;
      } else {
        return { args, error: `--since expects days (1-30) or YYYY-MM-DD, got: ${v}` };
      }
      if (!a.includes('=')) i++;
    } else {
      return { args, error: `Unknown argument: ${a} (try --help)` };
    }
  }
  return { args };
}

function printHelp(): void {
  console.log(`auto-discover — scrape new AI-capital deal signals from the open web

USAGE
  npx tsx scripts/auto-discover.ts [--since <days|YYYY-MM-DD>] [--dry-run]
                                   [--max <n>] [--json] [--help]

WHAT IT SCRAPES
  * Google News RSS, per tracked company, filtered to deal-signal keywords
  * Curated company newsroom RSS feeds (robots.txt respected, SSRF-safe fetch)

WHAT IT WRITES
  * data/discovery_queue.json — new review candidates (deduped, capped)
  * data/ingest_status.json   — discovery run stats

IT NEVER WRITES DEALS. Signals queue for human verification, then editors
update the ledger manually (or via /admin/discovery review).
`);
}

// ---------------------------------------------------------------------------
// Deal-signal classification
// ---------------------------------------------------------------------------

interface SignalPattern {
  type: DiscoveryCandidate['candidate_type'] | string;
  re: RegExp;
  weight: number;
}

const SIGNAL_PATTERNS: SignalPattern[] = [
  { type: 'financing', re: /\b(raise[sd]?|raising|funding round|series [a-k]|seed round|pre-seed|valuation|invest(s|ment|ed)? in|back(ed)? by|closed a \$|in financing)\b/i, weight: 3 },
  { type: 'acquisition', re: /\b(acquir(e|es|ed|ing)|acquisition|buy(s|ing)? out|bought|merger|merges with|takeover|to buy|acqui-hir)\b/i, weight: 3 },
  { type: 'debt', re: /\b(bond(s)? offering|senior notes|convertible notes|notes offering|credit facility|term loan|debt raise|securitization|abs offering|junk bond|bond sale)\b/i, weight: 3 },
  { type: 'partnership', re: /\b(partnership|signs? deal|signed a deal|agreement to (supply|provide|deliver)|multi[- ]year (deal|contract|agreement)|procurement (deal|agreement)|strategic collaboration)\b/i, weight: 2 },
  { type: 'power', re: /\b(power purchase|ppa|nuclear (deal|agreement|plant)|small modular reactor|smr|gigawatt|\bGW\b|megawatt|\bMW\b|energy deal|grid (deal|capacity)|reactor)\b/i, weight: 2 },
  { type: 'ipo', re: /\b(IPO|initial public offering|S-1|prospectus|go(es)? public|going public|listing)\b/i, weight: 3 },
  { type: 'financing', re: /\b\$\d+(\.\d+)?\s?(billion|billion,|bn|trillion)\b/i, weight: 2 },
  { type: 'financing', re: /\$\d+(\.\d+)?[MBT]\b/, weight: 2 },
];

function classifyTitle(title: string): { type: string | null; weight: number } {
  let type: string | null = null;
  let weight = 0;
  for (const p of SIGNAL_PATTERNS) {
    if (p.re.test(title)) {
      if (!type) type = p.type;
      weight += p.weight;
    }
  }
  return { type, weight };
}

// ---------------------------------------------------------------------------
// Tracked roster (derived from the ledger) + curated newsroom feeds
// ---------------------------------------------------------------------------

interface TrackedEntity {
  slug: string;
  /** Names/aliases matched against headlines (lowercased). */
  names: string[];
  /** Google News query terms (defaults to the company name). */
  newsQuery: string;
}

/** Companies whose deals matter most; the roster is their ledger aliases. */
const TRACKED_SLUGS = new Set([
  'nvidia', 'amd', 'microsoft', 'alphabet', 'meta', 'amazon', 'openai', 'anthropic',
  'oracle', 'coreweave', 'xai', 'broadcom', 'intel', 'softbank', 'supermicro',
  'marvell', 'nebius', 'crusoe-energy', 'lambda-labs', 'oklo', 'constellation-energy',
  'talen-energy', 'vistra', 'equinix', 'applied-digital', 'vantage-data-centers',
  'cipher-mining', 'terawulf', 'fluidstack', 'anysphere', 'perplexity', 'mistral-ai',
  'safe-superintelligence', 'thinking-machines-lab', 'databricks', 'groq', 'scale-ai',
  'cerebras', 'micron', 'tsmc', 'soundhound', 'together-ai', 'cohere',
]);

function buildRoster(): TrackedEntity[] {
  const roster: TrackedEntity[] = [];
  for (const c of VERIFIED_COMPANIES) {
    if (!TRACKED_SLUGS.has(c.slug)) continue;
    const names = Array.from(
      new Set(
        [c.name, c.slug.replace(/-/g, ' '), ...(c.aliases ?? [])]
          .map((n) => n.trim().toLowerCase())
          .filter((n) => n.length >= 3)
      )
    );
    roster.push({ slug: c.slug, names, newsQuery: `"${c.name}"` });
  }
  return roster;
}

/** Direct newsroom feeds for companies that publish official feeds (RSS). */
const NEWSROOM_FEEDS: { slug: string; name: string; url: string }[] = [
  { slug: 'openai', name: 'OpenAI Newsroom', url: 'https://openai.com/news/rss.xml' },
  { slug: 'meta', name: 'Meta Newsroom', url: 'https://about.fb.com/feed/' },
  { slug: 'microsoft', name: 'Microsoft Source', url: 'https://blogs.microsoft.com/feed/' },
  { slug: 'alphabet', name: 'Google Blog', url: 'https://blog.google/rss/' },
  { slug: 'nvidia', name: 'NVIDIA Newsroom', url: 'https://nvidianews.nvidia.com/releases.xml' },
];

// ---------------------------------------------------------------------------
// RSS fetching + parsing (regex-light; no XML dependency by design)
// ---------------------------------------------------------------------------

interface RssItem {
  title: string;
  link: string;
  pubDate: string | null;
  publisher: string | null;
}

function extractTag(block: string, tag: string): string | null {
  const m = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'i'));
  return m ? m[1].trim() : null;
}

function decodeEntities(s: string): string {
  return s
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&');
}

function parseRss(xml: string, limit = 12): RssItem[] {
  const items: RssItem[] = [];
  const blocks = xml.match(/<item[\s>][\s\S]*?<\/item>/gi) ?? [];
  for (const b of blocks) {
    const rawTitle = extractTag(b, 'title');
    const rawLink = extractTag(b, 'link');
    if (!rawTitle || !rawLink) continue;
    const title = decodeEntities(rawTitle.replace(/<!\[CDATA\[|\]\]>/g, '')).trim();
    const link = decodeEntities(rawLink.replace(/<!\[CDATA\[|\]\]>/g, '')).trim();
    if (!title || !/^https?:\/\//i.test(link)) continue;
    const sourceTag = b.match(/<source[^>]*url="([^"]+)"[^>]*>([\s\S]*?)<\/source>/i);
    items.push({
      title,
      link,
      pubDate: extractTag(b, 'pubDate'),
      publisher: sourceTag ? decodeEntities(sourceTag[2]).trim() || null : null,
    });
    if (items.length >= limit) break;
  }
  return items;
}

async function fetchFeed(feedUrl: string, label: string): Promise<RssItem[]> {
  const safety = SafeUrlValidator.isSafeUrl(feedUrl);
  if (!safety.safe) throw new Error(`Blocked by SSRF policy: ${safety.reason}`);
  const res = await SafeUrlValidator.safeFetch(feedUrl, {
    timeoutMs: 10000,
    headers: {
      'User-Agent': 'AICapitalTracker-AutoDiscover/1.0 (+https://aicapitaltracker.com; contact@aicapitaltracker.com)',
      Accept: 'application/rss+xml, application/xml, text/xml, */*',
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} from ${label}`);
  const text = await res.text();
  return parseRss(text);
}

// ---------------------------------------------------------------------------
// Candidate construction
// ---------------------------------------------------------------------------

function withinWindow(pubDate: string | null, cutoffMs: number): boolean {
  if (!pubDate) return true; // undated items: keep, editor filters
  const t = Date.parse(pubDate);
  if (Number.isNaN(t)) return true;
  return t >= cutoffMs;
}

function matchCompanies(title: string, roster: TrackedEntity[]): string[] {
  const lower = ' ' + title.toLowerCase() + ' ';
  const matched: string[] = [];
  for (const e of roster) {
    if (e.names.some((n) => lower.includes(' ' + n + ' ') || lower.includes(' ' + n + "'s "))) {
      matched.push(e.slug);
    }
  }
  return matched.slice(0, 4);
}

interface Discovered {
  candidate: DiscoveryCandidate;
  weight: number;
}

function toCandidate(
  item: RssItem,
  sourceSite: string,
  matchedSlugs: string[],
  sigType: string | null,
  seq: number
): DiscoveryCandidate {
  const now = new Date().toISOString();
  return {
    id: `disc-${Date.now()}-${seq}`,
    source_site: sourceSite,
    source_url: item.link,
    page_title: item.title,
    discovered_at: now,
    candidate_type: sigType,
    candidate_company_names: matchedSlugs,
    candidate_summary: item.title,
    outbound_source_urls: [item.link],
    review_status: 'new',
    review_notes: null,
    reviewed_by: null,
    reviewed_at: null,
  };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const { args, error } = parseArgs(process.argv.slice(2));
  if (error) {
    console.error(`CLI error: ${error}`);
    console.error('Try --help');
    process.exit(2);
  }
  if (args.help) {
    printHelp();
    process.exit(0);
  }

  const startedAt = new Date().toISOString();
  console.log(`[discover] start ${startedAt} since=${args.sinceCutoff ?? args.sinceDays + 'd'} max=${args.maxNew} dryRun=${args.dryRun}`);

  const roster = buildRoster();
  console.log(`[discover] tracked roster: ${roster.length} companies (from ledger)`);

  const cutoffMs = args.sinceCutoff ? Date.parse(args.sinceCutoff) : Date.now() - args.sinceDays * 86400000;

  // ---- Build the feed plan -------------------------------------------------
  interface FeedPlan {
    label: string;
    url: string;
    kind: 'google_news' | 'newsroom';
    slug: string | null;
  }
  const feeds: FeedPlan[] = [];

  // Per-company Google News RSS with deal-signal terms OR'd in.
  const signals = encodeURIComponent('(raise OR funding OR "round" OR acquires OR acquisition OR "bonds" OR "notes offering" OR partnership OR contract OR "IPO" OR gigawatt OR "power purchase")');
  for (const e of roster) {
    const q = encodeURIComponent(e.newsQuery.replace(/"/g, '') + ' ' + signals.replace(/%28|%29/g, ''));
    feeds.push({
      label: `google-news:${e.slug}`,
      url: `https://news.google.com/rss/search?q=${q}+when:${args.sinceDays}d&hl=en-US&gl=US&ceid=US:en`,
      kind: 'google_news',
      slug: e.slug,
    });
  }
  // Curated newsroom feeds (all recent items; classification filters them).
  for (const nf of NEWSROOM_FEEDS) {
    feeds.push({ label: `newsroom:${nf.slug}`, url: nf.url, kind: 'newsroom', slug: nf.slug });
  }

  // ---- Fetch all feeds (sequential, polite) --------------------------------
  const found: Discovered[] = [];
  let feedsOk = 0;
  let feedsErr = 0;

  for (const f of feeds) {
    try {
      const items = await fetchFeed(f.url, f.label);
      for (const item of items) {
        if (!withinWindow(item.pubDate, cutoffMs)) continue;
        const { type, weight } = classifyTitle(item.title);
        if (!type) continue; // not deal-relevant
        const matchedSlugs = f.kind === 'google_news'
          ? Array.from(new Set([f.slug as string, ...matchCompanies(item.title, roster)]))
          : Array.from(new Set([f.slug as string, ...matchCompanies(item.title, roster)]));
        found.push({ candidate: toCandidate(item, f.kind === 'google_news' ? 'news.google.com' : new URL(f.url).hostname, matchedSlugs, type, found.length + 1), weight });
      }
      feedsOk++;
      console.log(`[discover] ${f.label}: ${items.length} items`);
    } catch (err: unknown) {
      feedsErr++;
      console.warn(`[discover] ${f.label}: FAILED — ${err instanceof Error ? err.message : String(err)}`);
    }
    await new Promise((r) => setTimeout(r, 400)); // politeness delay
  }

  console.log(`[discover] feeds ok=${feedsOk} err=${feedsErr}, signal hits=${found.length}`);

  if (feedsOk === 0) {
    console.error('[discover] every feed failed — network or blocking issue; exiting 1');
    process.exit(1);
  }

  // ---- Rank + dedupe --------------------------------------------------------
  found.sort((a, b) => b.weight - a.weight);
  const existing = loadQueue();
  const seen = new Set<string>();
  for (const c of existing) {
    seen.add(normalizeUrl(c.source_url));
  }
  const fresh: DiscoveryCandidate[] = [];
  for (const { candidate } of found) {
    const key = normalizeUrl(candidate.source_url);
    if (seen.has(key)) continue;
    if (fresh.some((x) => normalizeUrl(x.source_url) === key)) continue;
    seen.add(key);
    fresh.push(candidate);
    if (fresh.length >= args.maxNew) break;
  }

  console.log(`[discover] new candidates: ${fresh.length} (queue had ${existing.length})`);

  if (args.printJson && fresh.length > 0) {
    console.log(JSON.stringify(fresh, null, 2));
  }

  if (args.dryRun) {
    console.log('[discover] dry-run — no files written. Top 10:');
    for (const c of fresh.slice(0, 10)) console.log(`  - [${c.candidate_type}] ${c.page_title}`);
    console.log(`[discover] done (dry) ${new Date().toISOString()}`);
    process.exit(0);
  }

  if (fresh.length > 0) {
    const merged = [...fresh, ...existing]; // newest first
    writeQueue(merged);
    console.log(`[discover] queue: ${existing.length} -> ${merged.length}`);
  }

  // ---- Status --------------------------------------------------------------
  const statusPath = path.join(process.cwd(), 'data', 'ingest_status.json');
  let status: Record<string, unknown> = {};
  try {
    status = JSON.parse(await fs.promises.readFile(statusPath, 'utf8'));
  } catch {
    // first run
  }
  status.discovery_last_run_at = startedAt;
  status.discovery_last_status = feedsErr === 0 ? 'success' : 'success_with_feed_errors';
  status.discovery_feeds_ok = feedsOk;
  status.discovery_feeds_err = feedsErr;
  status.discovery_new_candidates = fresh.length;
  status.discovery_queue_size = existing.length + fresh.length;
  status.discovery_errors = [];
  try {
    await fs.promises.writeFile(statusPath, JSON.stringify(status, null, 2) + '\n', 'utf8');
    console.log(`[discover] status updated: ${statusPath}`);
  } catch (err: unknown) {
    console.warn(`[discover] could not write status: ${err instanceof Error ? err.message : String(err)}`);
  }

  console.log(`[discover] done ${new Date().toISOString()}`);
  process.exit(0);
}

// ---------------------------------------------------------------------------
// Queue file helpers (dedupe-safe merge, never destructive)
// ---------------------------------------------------------------------------

const QUEUE_PATH = path.join(process.cwd(), 'data', 'discovery_queue.json');

function loadQueue(): DiscoveryCandidate[] {
  try {
    const parsed: unknown = JSON.parse(fs.readFileSync(QUEUE_PATH, 'utf8'));
    return Array.isArray(parsed) ? (parsed as DiscoveryCandidate[]) : [];
  } catch {
    return [];
  }
}

function writeQueue(items: DiscoveryCandidate[]): void {
  fs.mkdirSync(path.dirname(QUEUE_PATH), { recursive: true });
  fs.writeFileSync(QUEUE_PATH, JSON.stringify(items, null, 2) + '\n', 'utf8');
}

function normalizeUrl(u: string): string {
  try {
    const url = new URL(u);
    url.hash = '';
    return url.origin + url.pathname.replace(/\/+$/, '') + url.search;
  } catch {
    return u;
  }
}

// eslint-disable-next-line @typescript-eslint/no-floating-promises
main().catch((err: unknown) => {
  console.error('[discover] fatal:', err instanceof Error ? err.stack : String(err));
  process.exit(1);
});
