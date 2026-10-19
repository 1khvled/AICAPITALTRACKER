import rawDeals from "@/data/deals.json";

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Ledger presentation helpers.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * This file holds DISPLAY logic only. It never edits, corrects or re-derives
 * the underlying numbers: every figure rendered on /ledger comes straight out of
 * `src/data/deals.json`, and every count is computed at render time.
 *
 * What lives here:
 *   - the Deal shape as stored in the dataset
 *   - entity extraction (which company a deal belongs to, and its counterparties)
 *   - plain-English labels for every category and status in the data
 *   - the "what does this word mean" glossary, so a finance term is defined once
 *   - number formatting (tabular, never jittering)
 * ─────────────────────────────────────────────────────────────────────────────
 */

export interface Deal {
  id: string;
  title: string;
  category: string;
  status: string;
  source_type: string;
  amount_display: string;
  amount_usd: number;
  announced_date: string;
  sources_count: number;
  description: string;
  year: number;
  is_debt: boolean;
  is_compute: boolean;
  is_circular: boolean;
  is_mega: boolean;
}

export const deals: Deal[] = rawDeals as Deal[];

/* ────────────────────────────────────────────────────────────────────────────
   Entity extraction
   ──────────────────────────────────────────────────────────────────────────── */

const KNOWN_ENTITIES = [
  "OpenAI", "Anthropic", "Microsoft", "NVIDIA", "Google", "Alphabet", "Amazon",
  "AWS", "Meta", "Oracle", "CoreWeave", "xAI", "Apple", "Databricks", "Mistral AI",
  "Groq", "Hugging Face", "Cohere", "Scale AI", "Crusoe", "Lambda Labs", "Lambda",
  "Blackstone", "SoftBank", "Broadcom", "Marvell", "AMD", "Intel", "Cisco",
  "Stargate", "Vantage", "QTS", "Equinix", "Nebius", "Applied Digital",
  "Cipher Mining", "TeraWulf", "Talen Energy", "Constellation Energy", "Cameco",
  "Centrus", "Kairos Power", "Kairos", "TerraPower", "Oklo", "NuScale", "Stripe",
  "ByteDance", "Tencent", "Alibaba", "Baidu", "Samsung", "ASML", "TSMC", "Tesla",
  "IBM", "Snowflake", "Palantir", "Salesforce", "Anduril", "Supermicro",
  "Safe Superintelligence", "AISLE", "OpenRouter", "Worldcoin", "Figure AI",
  "Figure", "Perplexity", "Suno", "Runway", "Together AI", "Nscale",
  "Anysphere (Cursor)", "Anysphere", "SpaceX", "Thinking Machines Lab",
  "Thinking Machines", "Energy Transfer", "CyrusOne", "STACK Infrastructure",
  "Alat", "Lenovo", "Saudi Arabia PIF", "PIF", "a16z", "Yondr Group",
  "Northern Data", "Tether", "Aker ASA", "Coatue", "BlackRock", "MGX",
  "Silver Lake", "EQT", "Macquarie", "Brookfield", "KKR", "Goldman Sachs",
  "Morgan Stanley", "JPMorgan",
];

export interface DealMeta {
  primaryCompany: string;
  counterparties: string[];
}

/** Best-effort: which company is this deal about, and who is on the other side? */
export function getDealMeta(deal: Deal): DealMeta {
  const title = deal.title;
  const desc = deal.description;

  let primaryCompany = "";
  for (const entity of KNOWN_ENTITIES) {
    if (title.toLowerCase().startsWith(entity.toLowerCase())) {
      primaryCompany = entity;
      break;
    }
  }
  if (!primaryCompany) {
    for (const entity of KNOWN_ENTITIES) {
      if (title.toLowerCase().includes(entity.toLowerCase())) {
        primaryCompany = entity;
        break;
      }
    }
  }
  if (!primaryCompany) {
    const firstWordMatch = title.match(/^([A-Z][A-Za-z0-9.&'\-]+(?:\s+[A-Z][A-Za-z0-9.&'\-]+)?)/);
    primaryCompany = firstWordMatch ? firstWordMatch[1] : "Undisclosed entity";
  }
  if (primaryCompany === "Anysphere (Cursor)" || primaryCompany === "Anysphere") {
    primaryCompany = "Cursor / Anysphere";
  } else if (primaryCompany === "Alphabet") {
    primaryCompany = "Alphabet / Google";
  }

  const counterparties: string[] = [];
  const primaryLower = primaryCompany.toLowerCase();
  for (const entity of KNOWN_ENTITIES) {
    const entityLower = entity.toLowerCase();
    if (primaryLower.includes(entityLower) || entityLower.includes(primaryLower)) continue;
    if (
      title.toLowerCase().includes(entityLower) ||
      desc.toLowerCase().includes(entityLower)
    ) {
      if (!counterparties.includes(entity)) counterparties.push(entity);
      if (counterparties.length >= 3) break;
    }
  }

  return { primaryCompany, counterparties };
}

/* ────────────────────────────────────────────────────────────────────────────
   Plain-language labels
   Categories are read out of the dataset itself (see `categoriesInUse`) so a
   new category can never become unreachable behind a filter.
   ──────────────────────────────────────────────────────────────────────────── */

export interface CategoryCopy {
  /** Short label used in chips and pills. */
  label: string;
  /** One sentence, no jargon. */
  gloss: string;
}

const CATEGORY_COPY: Record<string, CategoryCopy> = {
  "Bets & rounds": {
    label: "Equity round",
    gloss: "A company sells shares to investors for cash. Nothing has to be repaid.",
  },
  Borrowed: {
    label: "Debt",
    gloss: "Money borrowed as loans or bonds. It must be repaid with interest, whatever the business earns.",
  },
  "Compute contracts": {
    label: "Compute contract",
    gloss: "A multi-year promise to buy cloud or chip capacity. The bill arrives whether or not the capacity gets used.",
  },
  "Power & land": {
    label: "Power & land",
    gloss: "Electricity supply, sites and grid connections. A datacenter cannot run without them.",
  },
  "Buyouts & mergers": {
    label: "M&A",
    gloss: "One company buying another, outright or in part.",
  },
  "Big construction": {
    label: "Construction",
    gloss: "Datacenters, campuses and buildings being built out over months or years.",
  },
  "Share sales": {
    label: "Share sale",
    gloss: "Existing investors selling shares to each other. No new money reaches the company.",
  },
  "Compute & cloud": {
    label: "Compute & cloud",
    gloss: "Cloud or chip capacity bought on a contract rather than owned outright.",
  },
  Other: {
    label: "Other",
    gloss: "Disclosed financings that do not fit the categories above.",
  },
};

export function categoryCopy(id: string): CategoryCopy {
  return CATEGORY_COPY[id] ?? { label: id, gloss: "Disclosed financing, category as filed." };
}

/** Every category actually present in the dataset, most common first. */
export function categoriesInUse(list: Deal[] = deals): string[] {
  const counts = new Map<string, number>();
  list.forEach((d) => counts.set(d.category, (counts.get(d.category) ?? 0) + 1));
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([id]) => id);
}

/** Statuses present in the dataset, in the order a deal moves through them. */
const STATUS_ORDER = [
  "Completed",
  "Signed",
  "Running",
  "Announced",
  "Announced, not done",
  "Disputed",
];

export function statusesInUse(list: Deal[] = deals): string[] {
  const present = new Set(list.map((d) => d.status));
  const ordered = STATUS_ORDER.filter((s) => present.has(s));
  Array.from(present).forEach((s) => {
    if (ordered.indexOf(s) === -1) ordered.push(s);
  });
  return ordered;
}

/** Pill tone per status. Only safe / caution / risk / neutral are ever used. */
export function statusTone(status: string): string {
  if (status === "Completed" || status === "Signed") return "pill-safe";
  if (status === "Disputed") return "pill-risk";
  if (status === "Announced, not done") return "pill-caution";
  return "pill";
}

/** Years present in the dataset, newest first. */
export function yearsInUse(list: Deal[] = deals): string[] {
  const years = new Set(list.map((d) => String(d.year)));
  return Array.from(years).sort((a, b) => Number(b) - Number(a));
}

/* ────────────────────────────────────────────────────────────────────────────
   Glossary — every finance term on this page is defined exactly once, here.
   ──────────────────────────────────────────────────────────────────────────── */

export const GLOSSARY: { term: string; plain: string }[] = [
  {
    term: "Equity round",
    plain: "Investors buy shares in a company. The cash goes into the business and nothing has to be repaid.",
  },
  {
    term: "Debt",
    plain: "A loan or a bond. The borrower pays interest and repays the principal, whatever the business earns.",
  },
  {
    term: "Compute contract",
    plain: "A standing promise to buy cloud or chip capacity, usually for years. The cost is owed whether the capacity is used or not.",
  },
  {
    term: "Power & land",
    plain: "Electricity supply, sites and grid connections — the inputs a datacenter needs before it can run at all.",
  },
  {
    term: "Circular financing",
    plain: "A vendor or investor funds a customer who then spends that money straight back with the same vendor or its partner.",
  },
  {
    term: "Megadeal",
    plain: "A single disclosed commitment of $10B or more.",
  },
  {
    term: "Not disclosed",
    plain: "The parties confirmed a transaction but kept the price private. We log the event, never an invented figure.",
  },
];

/* ────────────────────────────────────────────────────────────────────────────
   Number formatting
   ──────────────────────────────────────────────────────────────────────────── */

/** "$2.87T" / "$214.9B" / "$42.0B" / "Not disclosed" — always tabular. */
export function formatUsd(usd: number): string {
  if (!usd || usd <= 0) return "Not disclosed";
  if (usd >= 1e12) return `$${(usd / 1e12).toFixed(2)}T`;
  if (usd >= 1e9) return `$${(usd / 1e9).toFixed(1)}B`;
  if (usd >= 1e6) return `$${(usd / 1e6).toFixed(0)}M`;
  return `$${usd.toFixed(0)}`;
}

/** Compact volume for totals: "$2.87T". */
export function formatTotal(usd: number): string {
  return usd >= 1e12 ? `$${(usd / 1e12).toFixed(2)}T` : `$${(usd / 1e9).toFixed(1)}B`;
}

/** "15 Oct 2026" — dates in the dataset are already display strings. */
export function toIsoDate(display: string): string {
  const MONTHS = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  const match = display.match(/^(\d{1,2})\s+([A-Za-z]{3})\s+(\d{4})$/);
  if (!match) return "";
  const monthIndex = MONTHS.indexOf(match[2]);
  if (monthIndex < 0) return "";
  return `${match[3]}-${String(monthIndex + 1).padStart(2, "0")}-${match[1].padStart(2, "0")}`;
}

export function sortDateKey(display: string): number {
  const iso = toIsoDate(display);
  if (!iso) return Date.parse(display) || 0;
  return Date.parse(`${iso}T00:00:00Z`) || 0;
}

/* ────────────────────────────────────────────────────────────────────────────
   Page-level statistics — computed, never hardcoded.
   ──────────────────────────────────────────────────────────────────────────── */

export interface LedgerStats {
  dealCount: number;
  totalUsd: number;
  debtUsd: number;
  debtCount: number;
  megaCount: number;
  circularCount: number;
  computeCount: number;
  entityCount: number;
  sourceCount: number;
  firstYear: string;
  lastYear: string;
  largest: { title: string; amountUsd: number; display: string; id: string } | null;
}

export function ledgerStats(list: Deal[] = deals): LedgerStats {
  let totalUsd = 0;
  let debtUsd = 0;
  let debtCount = 0;
  let megaCount = 0;
  let circularCount = 0;
  let computeCount = 0;
  let sourceCount = 0;
  let largestUsd = 0;
  let largest: NonNullable<LedgerStats["largest"]> | null = null;
  let minYear = Number.POSITIVE_INFINITY;
  let maxYear = 0;
  const entities = new Set<string>();

  for (let i = 0; i < list.length; i += 1) {
    const d = list[i];
    const usd = d.amount_usd || 0;
    totalUsd += usd;
    sourceCount += d.sources_count || 0;
    if (d.is_debt) {
      debtUsd += usd;
      debtCount += 1;
    }
    if (d.is_mega) megaCount += 1;
    if (d.is_circular) circularCount += 1;
    if (d.is_compute) computeCount += 1;
    if (d.year) {
      minYear = Math.min(minYear, d.year);
      maxYear = Math.max(maxYear, d.year);
    }
    entities.add(getDealMeta(d).primaryCompany);
    if (usd > largestUsd) {
      largestUsd = usd;
      largest = { title: d.title, amountUsd: usd, display: d.amount_display, id: d.id };
    }
  }

  return {
    dealCount: list.length,
    totalUsd,
    debtUsd,
    debtCount,
    megaCount,
    circularCount,
    computeCount,
    entityCount: entities.size,
    sourceCount,
    firstYear: minYear === Number.POSITIVE_INFINITY ? "—" : String(minYear),
    lastYear: maxYear ? String(maxYear) : "—",
    largest: largestUsd > 0 ? largest : null,
  };
}