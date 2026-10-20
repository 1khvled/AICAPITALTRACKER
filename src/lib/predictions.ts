/**
 * "Your Call" — the reader's own 12-month burst probability, and the small
 * amount of storage that keeps it.
 *
 * This module is the whole storage layer for the feature and nothing else:
 * the record shape, the guarded localStorage helpers, and the pure functions
 * that turn stored records into badges, a resolution state and a score. It
 * carries no React, so the same file can be imported by a server component
 * (for the types) and by a client component (for the browser helpers) with no
 * "use client" boundary in between.
 *
 * The rules that came with the storage — the same ones the shared watchlist
 * uses, and the same reasons:
 *
 *   1. localStorage is NEVER touched during render. The list is read in an
 *      effect (after mount) and written only from the reader's own action, so
 *      the server markup and the first client render agree and there is no
 *      hydration mismatch.
 *   2. JSON.parse is guarded. A corrupted or hand-edited value is treated as
 *      "no calls", never as a crash.
 *   3. A private-mode browser, a disabled storage API or a full quota must
 *      never break a page. Every storage call is wrapped; if the write fails
 *      the in-memory list still works for the session.
 *   4. The store is capped. The last 200 calls are kept; older ones are
 *      dropped, so the key can never grow without bound.
 *
 * Nothing here talks to a server. There is no account, no leaderboard and no
 * upload: the record is the reader's own, kept in their own browser.
 */

/** The one storage key this feature reads and writes. */
export const CALLS_STORAGE_KEY = "aict-calls-v1";

/** Hard cap on the stored history. The newest 200 calls are kept. */
export const MAX_CALL_RECORDS = 200;

/** The horizon a call is made on: 12 months, the site's standard window. */
export const HORIZON_MONTHS = 12;

/**
 * One stored call.
 *
 * The model print, the model band and the market price are FROZEN at the
 * moment of the call. That is the whole point: a call made in October 2026
 * must be scored against the print of October 2026, not against whatever the
 * model says when the reader comes back.
 */
export interface CallRecord {
  /** Stable id, unique within the store. */
  id: string;
  /** The reader's own probability, 0-100, whole points. */
  probabilityPct: number;
  /** When the call was made, ISO-8601 UTC. */
  submittedAt: string;
  /** The model's published print at the moment of the call, %. */
  modelPrintPct: number;
  /** The model's published band at the moment of the call. */
  modelBand: string;
  /** The prediction-market price for the same question at the moment of the call, %. */
  marketPct: number;
}

/**
 * One observed print from the model's own trajectory (src/data/trajectory-history.json).
 * Only `modelRun: "observed"` rows qualify — a seeded row is not a print.
 */
export interface ObservedPrint {
  /** UTC date, "YYYY-MM-DD". */
  date: string;
  /** The model's published probability on that date, %. */
  probability: number;
}

/** The outcome of a call, once the window has closed. */
export interface ResolvedOutcome {
  /** The UTC date of the resolving print. */
  date: string;
  /** The model's published probability on that date, %. */
  probability: number;
}

/* ── Shape guards ───────────────────────────────────────────────────────── */

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

/** Clamp a probability to 0-100 whole points. */
export function clampProbability(value: number): number {
  if (!Number.isFinite(value)) return 0;
  if (value < 0) return 0;
  if (value > 100) return 100;
  return Math.round(value);
}

/** A record is only accepted from storage if every field is sane. */
export function isCallRecord(value: unknown): value is CallRecord {
  if (!value || typeof value !== "object") return false;
  const rec = value as Partial<CallRecord>;
  if (typeof rec.id !== "string" || rec.id.length === 0) return false;
  if (!isFiniteNumber(rec.probabilityPct)) return false;
  if (rec.probabilityPct < 0 || rec.probabilityPct > 100) return false;
  if (typeof rec.submittedAt !== "string" || !Number.isFinite(Date.parse(rec.submittedAt))) {
    return false;
  }
  if (!isFiniteNumber(rec.modelPrintPct)) return false;
  if (typeof rec.modelBand !== "string") return false;
  if (!isFiniteNumber(rec.marketPct)) return false;
  return true;
}

/* ── Storage (client only, always guarded) ──────────────────────────────── */

/** True when this browser will let us keep a record at all. */
function storage(): Storage | null {
  try {
    if (typeof window === "undefined") return null;
    const store = window.localStorage;
    if (!store) return null;
    return store;
  } catch {
    // Private mode can throw on ACCESS to localStorage, not only on write.
    return null;
  }
}

/** A unique id for one call. */
export function createCallId(): string {
  try {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return crypto.randomUUID();
    }
  } catch {
    /* fall through to the manual id */
  }
  return `call-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Read the stored calls, oldest first. Any failure — no storage, bad JSON,
 * a hand-edited value — is an empty list, never an exception.
 */
export function readCalls(): CallRecord[] {
  const store = storage();
  if (!store) return [];
  try {
    const raw = store.getItem(CALLS_STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const records: CallRecord[] = [];
    for (const entry of parsed) {
      if (!isCallRecord(entry)) continue;
      records.push(entry);
    }
    records.sort((a, b) => a.submittedAt.localeCompare(b.submittedAt));
    return records.slice(-MAX_CALL_RECORDS);
  } catch {
    return [];
  }
}

/**
 * Write the calls. The newest MAX_CALL_RECORDS are kept and the list is
 * stored oldest first. Returns false when the browser refused the write
 * (private mode, quota) — the caller keeps working from memory.
 */
export function writeCalls(records: CallRecord[]): boolean {
  const store = storage();
  if (!store) return false;
  try {
    const ordered = [...records]
      .sort((a, b) => a.submittedAt.localeCompare(b.submittedAt))
      .slice(-MAX_CALL_RECORDS);
    store.setItem(CALLS_STORAGE_KEY, JSON.stringify(ordered));
    return true;
  } catch {
    return false;
  }
}

/**
 * Add one call to the store and return the new list. `persisted` says
 * whether the browser actually kept it.
 */
export function appendCall(record: CallRecord): { records: CallRecord[]; persisted: boolean } {
  const existing = readCalls();
  const next = [...existing, record].sort((a, b) => a.submittedAt.localeCompare(b.submittedAt));
  const capped = next.slice(-MAX_CALL_RECORDS);
  const persisted = writeCalls(capped);
  return { records: capped, persisted };
}

/** Remove every stored call. A failure here is swallowed on purpose. */
export function clearCalls(): boolean {
  const store = storage();
  if (!store) return false;
  try {
    store.removeItem(CALLS_STORAGE_KEY);
    return true;
  } catch {
    return false;
  }
}

/* ── Pure helpers over the stored records ───────────────────────────────── */

/** The UTC calendar day of an ISO timestamp, "YYYY-MM-DD". */
export function utcDayKey(iso: string): string | null {
  const parsed = Date.parse(iso);
  if (!Number.isFinite(parsed)) return null;
  return new Date(parsed).toISOString().slice(0, 10);
}

/**
 * Add whole months to a UTC date, keeping the day of the month where the
 * target month has it and clamping to the last day where it does not
 * (29 Feb + 12 months lands on 28 Feb in a non-leap year).
 */
export function addMonthsUtc(dateIso: string, months: number): string | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(dateIso);
  if (!match) return null;
  const year = Number.parseInt(match[1], 10);
  const month = Number.parseInt(match[2], 10);
  const day = Number.parseInt(match[3], 10);
  if (!year || !month || !day) return null;

  const total = year * 12 + (month - 1) + months;
  const targetYear = Math.floor(total / 12);
  const targetMonth = ((total % 12) + 12) % 12; // 0-11
  const daysInTarget = new Date(Date.UTC(targetYear, targetMonth + 1, 0)).getUTCDate();
  const targetDay = Math.min(day, daysInTarget);

  return `${targetYear}-${String(targetMonth + 1).padStart(2, "0")}-${String(targetDay).padStart(2, "0")}`;
}

/**
 * The resolution rule.
 *
 * A call resolves when the model's own trajectory publishes an OBSERVED
 * print dated exactly 12 months after the call. Until then the call is open
 * and is never scored.
 */
export function resolveCall(
  record: CallRecord,
  observed: ObservedPrint[]
): ResolvedOutcome | null {
  const day = utcDayKey(record.submittedAt);
  if (!day) return null;
  const target = addMonthsUtc(day, HORIZON_MONTHS);
  if (!target) return null;
  const row = observed.find((r) => r.date === target);
  if (!row) return null;
  return { date: row.date, probability: row.probability };
}

/** The personal score. Both figures are measured against the same target. */
export interface CallScore {
  /** Calls stored on this device. */
  totalCalls: number;
  /** How many of them have a 12-month observed print behind them. */
  resolvedCalls: number;
  /** Mean absolute error of the reader, in probability points. */
  readerMae: number | null;
  /** Mean absolute error of the model, in probability points. */
  modelMae: number | null;
  /**
   * modelMae - readerMae. Positive means the reader's call landed closer to
   * the model's later print than the model's own call did.
   */
  readerAdvantage: number | null;
}

/**
 * Score the calls that have resolved.
 *
 * The target is the model's published print on the resolution date. This is
 * a "how close did each call track the model" measure, NOT a Brier score
 * against a yes/no event: the model does not publish a binary outcome, so
 * there is nothing else honest to score against.
 */
export function scoreCalls(records: CallRecord[], observed: ObservedPrint[]): CallScore {
  let readerSum = 0;
  let modelSum = 0;
  let resolved = 0;

  for (const record of records) {
    const outcome = resolveCall(record, observed);
    if (!outcome) continue;
    readerSum += Math.abs(record.probabilityPct - outcome.probability);
    modelSum += Math.abs(record.modelPrintPct - outcome.probability);
    resolved += 1;
  }

  const readerMae = resolved > 0 ? readerSum / resolved : null;
  const modelMae = resolved > 0 ? modelSum / resolved : null;
  const readerAdvantage =
    readerMae !== null && modelMae !== null ? modelMae - readerMae : null;

  return {
    totalCalls: records.length,
    resolvedCalls: resolved,
    readerMae,
    modelMae,
    readerAdvantage,
  };
}

/* ── Badges ─────────────────────────────────────────────────────────────── */

/** One badge: what it is, the exact rule that unlocks it, and its state. */
export interface BadgeDefinition {
  id: string;
  name: string;
  /** The rule, in the reader's words. */
  rule: string;
  /** What to do to earn it. */
  hint: string;
  /** True when the stored records satisfy the rule. */
  earned: boolean;
  /** How far along the reader is, for the locked state. */
  progress: string;
}

/** Ordered so the strip reads as a ladder, not a slot machine. */
export const BADGE_ORDER = [
  "first-call",
  "seven-days",
  "called-it",
  "against-the-crowd",
  "book-maker",
  "early-bird",
] as const;

export type BadgeId = (typeof BADGE_ORDER)[number];

function points(value: number): string {
  return `${Math.abs(value).toFixed(1)}`;
}

/**
 * Derive every badge from the stored records.
 *
 * Nothing here is awarded on a timer, a visit count or anything the reader
 * did not actually do: every rule is a property of the calls themselves.
 */
export function evaluateBadges(records: CallRecord[]): BadgeDefinition[] {
  const ordered = [...records].sort((a, b) => a.submittedAt.localeCompare(b.submittedAt));
  const count = ordered.length;

  const days = new Set<string>();
  for (const record of ordered) {
    const day = utcDayKey(record.submittedAt);
    if (day) days.add(day);
  }

  let bestModelGap: number | null = null;
  let bestMarketGap: number | null = null;
  let earlyBird = false;

  for (let i = 0; i < ordered.length; i += 1) {
    const record = ordered[i];
    const modelGap = Math.abs(record.probabilityPct - record.modelPrintPct);
    const marketGap = Math.abs(record.probabilityPct - record.marketPct);
    if (bestModelGap === null || modelGap < bestModelGap) bestModelGap = modelGap;
    if (bestMarketGap === null || marketGap > bestMarketGap) bestMarketGap = marketGap;

    // "Early Bird" needs two calls: the model must have moved more than a
    // point since the reader's previous call, and this call must have landed
    // within two points of the new print.
    if (i > 0) {
      const previous = ordered[i - 1];
      const modelMove = Math.abs(record.modelPrintPct - previous.modelPrintPct);
      if (modelMove > 1 && modelGap <= 2) earlyBird = true;
    }
  }

  const calledIt = bestModelGap !== null && bestModelGap <= 5;
  const againstCrowd = bestMarketGap !== null && bestMarketGap > 10;

  const badges: Record<BadgeId, BadgeDefinition> = {
    "first-call": {
      id: "first-call",
      name: "First Call",
      rule: "One call stored on this device.",
      hint: "Record a call to unlock this one.",
      earned: count >= 1,
      progress: `${Math.min(count, 1)} of 1 call`,
    },
    "seven-days": {
      id: "seven-days",
      name: "Seven Day Streak",
      rule: "Calls recorded on 7 different UTC days.",
      hint: "Seven different days. They do not have to be consecutive.",
      earned: days.size >= 7,
      progress: `${Math.min(days.size, 7)} of 7 days`,
    },
    "called-it": {
      id: "called-it",
      name: "Called It",
      rule: "A call within 5 points of the model's print.",
      hint: "Land within 5 points of the model on the day you call.",
      earned: calledIt,
      progress:
        bestModelGap === null
          ? "No call yet"
          : `Closest call: ${points(bestModelGap)} pts from the model`,
    },
    "against-the-crowd": {
      id: "against-the-crowd",
      name: "Against the Crowd",
      rule: "A call more than 10 points from the market price.",
      hint: "Move more than 10 points away from the market price.",
      earned: againstCrowd,
      progress:
        bestMarketGap === null
          ? "No call yet"
          : `Widest gap: ${points(bestMarketGap)} pts from the market`,
    },
    "book-maker": {
      id: "book-maker",
      name: "Book-Maker",
      rule: "10 calls stored on this device.",
      hint: "Keep ten calls on the record.",
      earned: count >= 10,
      progress: `${Math.min(count, 10)} of 10 calls`,
    },
    "early-bird": {
      id: "early-bird",
      name: "Early Bird",
      rule: "Within 2 points of the print on a day the model moved more than 1 point.",
      hint: "Call it within 2 points on a day the print moves.",
      earned: earlyBird,
      progress: earlyBird
        ? "You read a moving print"
        : "Needs a second call on a day the print moves",
    },
  };

  return BADGE_ORDER.map((id) => badges[id]);
}
