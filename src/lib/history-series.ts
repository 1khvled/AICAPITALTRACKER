/**
 * ─────────────────────────────────────────────────────────────────────────────
 * The history, assembled from what the site actually has.
 *
 * Four series, four different sources, and they are NOT the same thing:
 *
 * 1. THE MODEL'S READINGS ON PAST EPISODES (1929 to now) - the model's own
 *    probability for every historical episode it has been run against, with
 *    what actually happened. This is the model's history: how it reads a
 *    market that has already resolved.
 * 2. THE BUILD-OUT'S MONEY (2023 to now) - the disclosed capital from the
 *    169-record ledger, month by month. This is the INPUTS the model reads,
 *    not the model's print.
 * 3. THE MARKET'S PRICE (2024 to now) - what Polymarket has charged for the
 *    same question, from the published history.
 * 4. THE MODEL'S PRINT (October 2026 to now) - the observed daily prints.
 *    The model's own daily history begins on 18 October 2026, and saying so
 *    is part of the chart: before that, the site has no print to draw.
 *
 * The gap between (1) and (4) is the honest shape of this site's history, and
 * the chart is built to show it rather than paper over it.
 *
 * Everything here is computed. Nothing is typed.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { HISTORICAL_BACKTESTS } from "./model/quantitative";
import { POLYMARKET_HISTORICAL_TRENDS } from "../data/polymarket-data";
import { toIsoDate } from "../app/ledger/_components/ledgerData";

/** One historical episode the model has been read against. */
export interface HistoryEpisode {
  id: string;
  /** The era, e.g. "Dot-Com Telecom Peak". */
  era: string;
  /** The date, as the model published it, e.g. "March 2000". */
  date: string;
  /** The year, for the time axis. */
  year: number;
  /** The model's probability at that episode, %. */
  probabilityPct: number;
  /** The composite score the model printed, 0-100. */
  compositeScore: number;
  /** Whether the episode did in fact resolve in a burst. */
  burstObserved: boolean;
  /** What actually happened, in the model's words. */
  outcome: string;
  /** The macro triggers the model named, if it named any. */
  triggers: string[];
}

/** One month of the build-out's disclosed capital. */
export interface BuildOutMonth {
  /** "2023-04" */
  key: string;
  /** The first of the month, ISO. */
  iso: string;
  /** "Apr 2023" */
  label: string;
  /** The capital disclosed in THAT month. */
  newUsd: number;
  /** The capital disclosed up to and including that month. */
  cumulativeUsd: number;
  /** The debt portion, cumulative. */
  debtCumulativeUsd: number;
  /** The deals announced in that month. */
  newDealCount: number;
  /** The deals up to and including that month. */
  cumulativeDealCount: number;
}

/** A single disclosed deal, big enough to mark on the chart. */
export interface BuildOutEvent {
  iso: string;
  label: string;
  title: string;
  amountUsd: number;
  sector: string;
}

/** The market's price for the same question, over its published history. */
export interface MarketReading {
  iso: string;
  label: string;
  /** The 12-month contract's YES odds, %. */
  twelveMonthPct: number;
  /** The 6-month contract's YES odds, %. */
  sixMonthPct: number;
}

/** The model's own observed daily prints. */
export interface ModelPrint {
  iso: string;
  label: string;
  probabilityPct: number;
  compositeScore: number;
}

export interface HistoryBundle {
  episodes: HistoryEpisode[];
  months: BuildOutMonth[];
  events: BuildOutEvent[];
  market: MarketReading[];
  prints: ModelPrint[];
  /** The earliest year any series reaches. */
  fromYear: number;
  /** The latest year any series reaches. */
  toYear: number;
}

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

/** "15 Oct 2026" -> "2026-10-15". Returns null when the text is not a date. */
function isoOf(display: string): string | null {
  const iso = toIsoDate(display);
  return iso && /^\d{4}-\d{2}-\d{2}$/.test(iso) ? iso : null;
}

function yearOf(text: string): number {
  const match = text.match(/(1[89]\d{2}|20\d{2})/);
  return match ? Number.parseInt(match[1], 10) : 0;
}

export interface RawDeal {
  title: string;
  category: string;
  amount_usd: number;
  announced_date: string;
  is_debt: boolean;
}

/**
 * Assemble the whole history from the four sources.
 *
 * `deals` is the ledger (src/data/deals.json); `trajectory` is the published
 * daily history (src/data/trajectory-history.json).
 */
export function buildHistoryBundle(
  deals: RawDeal[],
  trajectory: Array<{
    date: string;
    dayLabel?: string;
    probability: number;
    compositeScore: number;
  }>
): HistoryBundle {
  /* ── 1. The model's readings on past episodes ─────────────────────────── */
  const episodes: HistoryEpisode[] = HISTORICAL_BACKTESTS.map((test) => ({
    id: test.id,
    era: test.era,
    date: test.date,
    year: yearOf(test.date),
    probabilityPct: test.modelProbabilityPct,
    compositeScore: test.compositeScore,
    burstObserved: test.actualBurstObserved,
    outcome: test.actualOutcomeDesc,
    triggers: test.primaryMacroTriggers ?? [],
  })).sort((a, b) => a.year - b.year);

  /* ── 2. The build-out's money, month by month ─────────────────────────── */
  const buckets = new Map<
    string,
    { newUsd: number; newDebtUsd: number; newDealCount: number }
  >();
  const events: BuildOutEvent[] = [];

  for (const deal of deals) {
    const iso = isoOf(deal.announced_date ?? "");
    if (!iso) continue;
    const key = iso.slice(0, 7);
    const bucket = buckets.get(key) ?? {
      newUsd: 0,
      newDebtUsd: 0,
      newDealCount: 0,
    };
    const amount = Number.isFinite(deal.amount_usd) ? deal.amount_usd : 0;
    bucket.newUsd += amount;
    if (deal.is_debt) bucket.newDebtUsd += amount;
    bucket.newDealCount += 1;
    buckets.set(key, bucket);

    if (amount > 0) {
      events.push({
        iso,
        label: deal.announced_date,
        title: deal.title,
        amountUsd: amount,
        sector: deal.category,
      });
    }
  }

  const months: BuildOutMonth[] = [];
  let cumulativeUsd = 0;
  let debtCumulativeUsd = 0;
  let cumulativeDealCount = 0;
  for (const key of Array.from(buckets.keys()).sort()) {
    const bucket = buckets.get(key)!;
    const [year, month] = key.split("-");
    cumulativeUsd += bucket.newUsd;
    debtCumulativeUsd += bucket.newDebtUsd;
    cumulativeDealCount += bucket.newDealCount;
    months.push({
      key,
      iso: `${key}-01`,
      label: `${MONTHS[Number.parseInt(month, 10) - 1]} ${year}`,
      newUsd: bucket.newUsd,
      cumulativeUsd,
      debtCumulativeUsd,
      newDealCount: bucket.newDealCount,
      cumulativeDealCount,
    });
  }

  /* ── 3. The market's price, over its published history ────────────────── */
  const market: MarketReading[] = POLYMARKET_HISTORICAL_TRENDS.map((point) => {
    const year = Number.parseInt(point.date.slice(0, 4), 10);
    const monthName = point.date.slice(5, 8).trim();
    const monthIndex = MONTHS.findIndex((m) => m.toLowerCase() === monthName.toLowerCase());
    const month = monthIndex >= 0 ? monthIndex + 1 : 1;
    return {
      iso: `${year}-${String(month).padStart(2, "0")}-01`,
      label: point.date.replace(" (Live)", ""),
      twelveMonthPct: point.aiBubble2027,
      sixMonthPct: point.aiBubble2026,
    };
  });

  /* ── 4. The model's observed daily prints ─────────────────────────────── */
  const prints: ModelPrint[] = trajectory
    .filter((row) => typeof row.probability === "number" && Number.isFinite(row.probability))
    .map((row) => ({
      iso: row.date,
      label: row.dayLabel ?? row.date,
      probabilityPct: row.probability,
      compositeScore: row.compositeScore,
    }))
    .sort((a, b) => a.iso.localeCompare(b.iso));

  const years = [
    ...episodes.map((e) => e.year),
    ...months.map((m) => Number.parseInt(m.iso.slice(0, 4), 10)),
    ...market.map((m) => Number.parseInt(m.iso.slice(0, 4), 10)),
    ...prints.map((p) => Number.parseInt(p.iso.slice(0, 4), 10)),
  ].filter((y) => Number.isFinite(y) && y > 0);

  return {
    episodes,
    months,
    events: events.sort((a, b) => a.iso.localeCompare(b.iso)),
    market,
    prints,
    fromYear: years.length ? Math.min(...years) : 2000,
    toYear: years.length ? Math.max(...years) : 2026,
  };
}
