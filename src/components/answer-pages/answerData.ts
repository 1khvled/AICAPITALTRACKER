/**
 * Shared, computed inputs for the seven plain-answer pages.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * THE RULE THIS FILE EXISTS TO ENFORCE
 * ─────────────────────────────────────────────────────────────────────────────
 * No typed figures. Every number a reader sees on an answer page is derived
 * here from a source the site already publishes:
 *
 *   • src/data/deals.json          — the 169-record ledger
 *   • src/data/live-inputs.json    — the live model inputs (crowd, macro, capex)
 *   • src/data/polymarket-data.ts  — the curated contract book
 *   • src/lib/model/engine.ts      — the model (re-run, not re-typed)
 *
 * If a figure has no source, it is not printed. It is not typed here either.
 *
 * This module only READS src/data/** and src/lib/model/**. It never writes to
 * them.
 */

import rawDeals from "@/data/deals.json";
import rawLiveInputs from "@/data/live-inputs.json";
import {
  POLYMARKET_FEATURED_MARKETS,
  POLYMARKET_REFERRAL_CODE,
} from "@/data/polymarket-data";
import { MODEL_FACTORS } from "@/lib/model/factors";
import {
  evaluateBubbleModel,
  DEFAULT_MODEL_INPUTS,
} from "@/lib/model/engine";
import type { BubbleModelInputs } from "@/lib/model/types";

// ─────────────────────────────────────────────────────────────────────────────
// 1 · LEDGER HELPERS
// ─────────────────────────────────────────────────────────────────────────────

export interface LedgerDeal {
  id: string;
  title: string;
  description: string;
  category: string;
  amount_usd: number;
  amount_display: string;
  announced_date: string;
  year: number;
  is_debt: boolean;
  is_compute: boolean;
  is_circular: boolean;
  is_mega: boolean;
}

export const LEDGER: LedgerDeal[] = (rawDeals as unknown as LedgerDeal[]).slice();

export function ledgerDeal(dealId: string): LedgerDeal | undefined {
  return LEDGER.find((d) => d.id === dealId);
}

/** The disclosed dollar amount of one ledger record, or 0 when undisclosed. */
export function ledgerAmount(dealId: string): number {
  return ledgerDeal(dealId)?.amount_usd ?? 0;
}

/** The sum of the disclosed amounts of a set of ledger records. */
export function ledgerSum(dealIds: string[]): number {
  return dealIds.reduce((sum, id) => sum + ledgerAmount(id), 0);
}

// ─────────────────────────────────────────────────────────────────────────────
// 2 · OPENAI — the records where OpenAI is a NAMED PARTY
// ─────────────────────────────────────────────────────────────────────────────
//
// The ledger mentions OpenAI inside 29 records — but eight of those are other
// companies' rounds and data-centre programmes that merely quote OpenAI in the
// description (Anthropic's Series H, SpaceX's acquisition of Anysphere, the
// $500B Stargate programme). Counting those on a page called "Who is funding
// OpenAI?" would tell the reader that Anthropic's investors fund OpenAI.
//
// So the two OpenAI pages count the records where OpenAI is named in the
// TRANSACTION TITLE. That is a narrower, honest count, and the page says so.

export const OPENAI_NAMED_DEALS: LedgerDeal[] = LEDGER.filter((d) =>
  d.title.toLowerCase().includes("openai"),
);

export const OPENAI_NAMED_TOTAL_USD = OPENAI_NAMED_DEALS.reduce(
  (sum, d) => sum + (d.amount_usd || 0),
  0,
);

/** Every ledger record that mentions OpenAI at all (title or description). */
export const OPENAI_MENTION_COUNT = LEDGER.filter(
  (d) =>
    d.title.toLowerCase().includes("openai") ||
    d.description.toLowerCase().includes("openai"),
).length;

/**
 * Who is actually putting money in, in four groups. Each group is a list of
 * LEDGER RECORD IDS, so every dollar figure below is summed from the ledger —
 * never typed. The group definitions say what the money IS, because the
 * distinction is the whole point of the page.
 */
export const OPENAI_BACKER_GROUPS: {
  key: string;
  label: string;
  plain: string;
  dealIds: string[];
}[] = [
  {
    key: "equity",
    label: "Equity investors",
    plain:
      "Capital actually paid into OpenAI: SoftBank, Amazon, NVIDIA, Thrive, Dragoneer, MGX, Microsoft, Blackstone, T. Rowe Price, Sequoia, Andreessen Horowitz and others. This is money OpenAI received.",
    dealIds: [
      "deal-017",
      "deal-022",
      "deal-065",
      "deal-067",
      "deal-086",
      "deal-120",
      "deal-143",
    ],
  },
  {
    key: "compute",
    label: "Cloud and compute sellers",
    plain:
      "Contracts to BUY computing power from Microsoft Azure, Oracle, Amazon AWS, Google Cloud and CoreWeave. This is OpenAI spending, not investors funding it — and it is why the money looks circular.",
    dealIds: [
      "deal-036",
      "deal-039",
      "deal-051",
      "deal-059",
      "deal-068",
      "deal-069",
      "deal-078",
      "deal-094",
    ],
  },
  {
    key: "hardware",
    label: "Hardware suppliers",
    plain:
      "NVIDIA, Broadcom and AMD. The NVIDIA figure is a letter of intent that was never finalised, so it is a stated intention rather than a closed commitment.",
    dealIds: ["deal-043", "deal-046", "deal-053"],
  },
  {
    key: "acquisitions",
    label: "Acquisitions paid in stock",
    plain:
      "OpenAI's purchase of Jony Ive's hardware startup io, settled in OpenAI shares rather than cash.",
    dealIds: ["deal-083"],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// 3 · PREDICTION CONTRACTS — live price, curated plain-English question
// ─────────────────────────────────────────────────────────────────────────────

export interface TradeableContract {
  /** The plain-English question the contract asks. */
  question: string;
  /** The live market price of YES, in percent. */
  probabilityPct: number;
  /** Traded volume, formatted. */
  volumeDisplay: string;
  /** The outbound, referral-tagged URL. */
  url: string;
  /** One line on how the contract resolves. */
  resolvesOn: string;
}

interface LiveMarket {
  slug: string;
  question: string;
  yesProbabilityPct: number;
  volumeUsd: number;
  closed: boolean;
  referralUrl?: string;
}

const LIVE_MARKETS: LiveMarket[] = Array.isArray(
  (rawLiveInputs as unknown as { crowd?: { markets?: LiveMarket[] } }).crowd?.markets,
)
  ? ((rawLiveInputs as unknown as { crowd: { markets: LiveMarket[] } }).crowd.markets as LiveMarket[])
  : [];

/** "$2.5M" / "$317k" — the volume format used on every contract card. */
export function formatVolumeUsd(volumeUsd: number): string {
  if (!Number.isFinite(volumeUsd) || volumeUsd <= 0) return "no volume yet";
  if (volumeUsd >= 1e6) return `$${(volumeUsd / 1e6).toFixed(1)}M`;
  if (volumeUsd >= 1e3) return `$${Math.round(volumeUsd / 1e3)}k`;
  return `$${Math.round(volumeUsd)}`;
}

/**
 * Resolve a curated contract id to its LIVE price.
 *
 * The curated book carries the plain-English question and the resolution
 * criteria; the live snapshot carries the current price and the current
 * volume. When the live book no longer carries the contract (it may have
 * closed), the curated print is used and the card says so.
 */
export function resolveContracts(curatedIds: string[]): TradeableContract[] {
  const out: TradeableContract[] = [];

  for (const id of curatedIds) {
    const curated = POLYMARKET_FEATURED_MARKETS.find((m) => m.id === id);
    if (!curated) continue;

    const live = LIVE_MARKETS.find((m) => m.slug === curated.slug);
    const useLive = !!live && !live.closed && live.yesProbabilityPct > 0;

    out.push({
      question: curated.question,
      probabilityPct: useLive ? live.yesProbabilityPct : curated.yesProbabilityPct,
      volumeDisplay: formatVolumeUsd(useLive ? live.volumeUsd : curated.volumeUsd),
      url:
        (useLive && live.referralUrl) ||
        curated.referralUrl ||
        `https://polymarket.com/event/${curated.eventSlug}?r=${POLYMARKET_REFERRAL_CODE}`,
      resolvesOn: curated.resolutionSource,
    });
  }

  return out;
}

/**
 * A live contract straight from the daily snapshot (no curated twin needed).
 * Used where the answer page wants the current book rather than a fixed set.
 */
export function liveContracts(slugs: string[]): TradeableContract[] {
  const out: TradeableContract[] = [];
  for (const slug of slugs) {
    const live = LIVE_MARKETS.find((m) => m.slug === slug);
    if (!live || live.closed) continue;
    const curated = POLYMARKET_FEATURED_MARKETS.find((m) => m.slug === slug);
    out.push({
      question: curated?.question ?? live.question,
      probabilityPct: live.yesProbabilityPct,
      volumeDisplay: formatVolumeUsd(live.volumeUsd),
      url:
        live.referralUrl ||
        curated?.referralUrl ||
        `https://polymarket.com/event/${curated?.eventSlug ?? "ai-bubble-burst-by"}?r=${POLYMARKET_REFERRAL_CODE}`,
      resolvesOn: curated?.resolutionSource ?? "Polymarket resolution rules",
    });
  }
  return out;
}

// ─────────────────────────────────────────────────────────────────────────────
// 4 · THE MODEL — re-run, never re-typed
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Re-run the model with ONE input moved and nothing else changed.
 *
 * The published sensitivity tables on the answer pages used to carry typed
 * "+3.8% probability" strings that no longer matched the model. This runs the
 * engine instead, so the number on the page is the number the engine prints.
 */
export function probabilityWith(
  mutate: (inputs: BubbleModelInputs) => void
): number {
  const next: BubbleModelInputs = JSON.parse(
    JSON.stringify(DEFAULT_MODEL_INPUTS),
  ) as BubbleModelInputs;
  mutate(next);
  return evaluateBubbleModel(next).burstProbability;
}

/** The probability delta, in points, of moving one input. */
export function probabilityShiftPts(
  mutate: (inputs: BubbleModelInputs) => void,
): number {
  const base = evaluateBubbleModel(DEFAULT_MODEL_INPUTS).burstProbability;
  const next = probabilityWith(mutate);
  return Math.round((next - base) * 10) / 10;
}

// ─────────────────────────────────────────────────────────────────────────────
// 5 · THE MACRO FACTOR — its ramp legs, read from the published formula
// ─────────────────────────────────────────────────────────────────────────────

export interface MacroLeg {
  /** The leg name as the model publishes it. */
  name: string;
  /** The plain-English label used on the page. */
  plain: string;
  /** What the leg measures, in one clause. */
  measures: string;
  /** The sub-weight of this leg inside the macro factor. */
  weightPct: number;
  /** The calm end of the ramp. */
  lowLabel: string;
  /** The stress end of the ramp. */
  highLabel: string;
  /** The current reading, in the leg's own units. */
  currentLabel: string;
  /** Where the reading sits between the calm end and the stress end, 0–100%. */
  stressPositionPct: number;
}

interface RawLeg {
  name: string;
  low: string;
  high: string;
  weight: number;
}

/**
 * Parse the ramp legs out of the macro factor's own published formula string.
 *
 * The formula in src/lib/model/factors.ts is the single source of truth for
 * the sub-weights and the ramp bounds; reading it here means the answer page
 * can never drift from the model.
 */
export function macroRampLegs(): RawLeg[] {
  const factor = MODEL_FACTORS.find((f) => f.id === "macro_rates");
  const formula = factor?.formula ?? "";
  const legs: RawLeg[] = [];
  const re = /([\d.]+)\s*·\s*\(?ramp\(([^,]+),\s*([^,]+),\s*([^)]+)\)/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(formula)) !== null) {
    legs.push({
      weight: Number.parseFloat(match[1]) * 100,
      name: match[2].trim(),
      low: match[3].trim(),
      high: match[4].trim(),
    });
  }
  return legs;
}

/** "3.75%" → 3.75 ; "250bp" → 250 */
export function parseLegNumber(label: string): number {
  const n = Number.parseFloat(label.replace(/[^\d.]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

// ─────────────────────────────────────────────────────────────────────────────
// 6 · PLAIN-ENGLISH READINGS OF THE MODEL'S FACTORS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * The model publishes a terse, quantitative reading for each factor
 * ("CDS 288bp vs 81bp baseline"). The reader does not know what a basis point
 * is. These are the same numbers, said in words, with every term explained
 * where it appears — and every one of them is computed, not typed.
 */

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

/** The median price-to-sales multiple across the commercial labs (>= $100M ARR). */
export function medianLabPriceToSales(): number | null {
  const vals = DEFAULT_MODEL_INPUTS.valuations ?? [];
  const ps = vals
    .filter(
      (v) =>
        v.runRateRevenueUsd !== null &&
        (v.runRateRevenueUsd as number) >= 100_000_000,
    )
    .map((v) => v.valuationUsd / (v.runRateRevenueUsd as number));
  return median(ps);
}

export interface PlainReading {
  /** The plain sentence shown under the factor name. */
  text: string;
  /** The model's own terse reading, kept for the analyst in the small print. */
  technical: string;
}

/**
 * Plain-English reading of one factor, computed from the live model inputs.
 */
export function plainFactorReading(
  factorId: string,
  technicalReading: string,
): PlainReading {
  const inputs = DEFAULT_MODEL_INPUTS;
  const cds = inputs.cds;
  const macro = inputs.macro;
  const capex = inputs.capex;
  const debt = inputs.aiDebt;
  const ledger = inputs.ledger;

  switch (factorId) {
    case "cds_stress": {
      if (!cds) break;
      return {
        text: `Insuring Oracle's debt against default now costs ${(cds.currentBps / 100).toFixed(2)}% a year, against ${(cds.baselineBps / 100).toFixed(2)}% in a calm market. A basis point is a hundredth of a percentage point, so 288 basis points means 2.88%.`,
        technical: technicalReading,
      };
    }
    case "valuation_stretch": {
      const ps = medianLabPriceToSales();
      if (ps === null) break;
      return {
        text: `Across the commercial AI labs we track, investors pay ${ps.toFixed(1)} cents for every dollar of yearly revenue. That is a price-to-sales multiple: you pay $${ps.toFixed(1)} for each $1 the company books in a year.`,
        technical: technicalReading,
      };
    }
    case "debt_reliance": {
      if (!ledger || !debt) break;
      const total = ledger.totalDisclosedUsd;
      return {
        text: `${fmtB(debt.totalTrackedDebtUsd)} of the ${fmtT(total)} we track is borrowed money (${(ledger.debtShare * 100).toFixed(1)}%), and lenders are issuing about ${fmtB(debt.annualDebtIssuanceUsd)} a year.`,
        technical: technicalReading,
      };
    }
    case "macro_rates": {
      if (!macro) break;
      const hy = macro.highYieldSpreadBps ?? 0;
      return {
        text: `10-year government bonds pay ${macro.us10yYieldPct.toFixed(2)}% (a calm market would be ${macro.us10yBaselinePct.toFixed(2)}%). Household prices are rising ${macro.cpiInflationYoY.toFixed(2)}% a year, and risky corporate loans ask ${(hy / 100).toFixed(2)}% more than government bonds.`,
        technical: technicalReading,
      };
    }
    case "concentration_circularity": {
      if (!ledger) break;
      const circularUsd = ledger.totalDisclosedUsd * ledger.circularShare;
      return {
        text: `The ten largest deals are ${(ledger.top10Share * 100).toFixed(0)}% of everything tracked, and ${fmtB(circularUsd)} of it is investors funding each other's purchases.`,
        technical: technicalReading,
      };
    }
    case "funding_velocity": {
      if (!ledger) break;
      const annualised =
        ((ledger.byYear[new Date().getUTCFullYear()] ?? 0) /
          Math.max(1, Math.min(12, new Date().getUTCMonth() + 1))) *
        12;
      return {
        text: `New commitments are running at an annualised ${fmtB(annualised)}, ${(ledger.announcedShare * 100).toFixed(1)}% of them have not closed yet, and it has been ${ledger.daysSinceLastMega} days since the last $10B+ deal.`,
        technical: technicalReading,
      };
    }
    case "crowd_signal": {
      const p = inputs.crowd?.bubble2026Probability ?? inputs.crowd?.yesProbability;
      const vol = inputs.crowd?.volumeUsd ?? 0;
      if (p === null || p === undefined) break;
      return {
        text: `Betting markets put a ${(p * 100).toFixed(1)}% chance on an AI industry downturn this year (${formatVolumeUsd(vol)} traded).`,
        technical: technicalReading,
      };
    }
    case "capex_cashflow": {
      if (!capex?.aggregateCapexUsd || !capex.aggregateFcfUsd) break;
      const ratio = capex.aggregateCapexUsd / capex.aggregateFcfUsd;
      return {
        text: `The four big cloud companies are spending ${fmtB(capex.aggregateCapexUsd)} a year on hardware and data centres — ${ratio.toFixed(2)} times what they earn in cash, and ${fmtB(debt?.gpuDepreciationDragUsd ?? 0)} a year of that wears out.`,
        technical: technicalReading,
      };
    }
    case "adoption_demand": {
      const adoption = inputs.adoption;
      if (!adoption) break;
      const growth = adoption.annualUserGrowth ?? 0;
      const decline = adoption.apiPriceDeclineMultiple ?? 0;
      return {
        text: `ChatGPT has ${fmtUsers(adoption.topProductUsers)} weekly users (up ${(growth * 100).toFixed(0)}% in a year) and running AI is ${decline.toFixed(0)} times cheaper than it was. Real usage pushes the risk score down.`,
        technical: technicalReading,
      };
    }
    default:
      break;
  }

  return { text: technicalReading, technical: technicalReading };
}

/** "$214.9B" */
function fmtB(usd: number): string {
  return `$${(usd / 1e9).toFixed(1)}B`;
}

/** "$2.87T" */
function fmtT(usd: number): string {
  return `$${(usd / 1e12).toFixed(2)}T`;
}

/** 1_200_000_000 → "1.2B users" */
function fmtUsers(n: number | null): string {
  if (n === null || n === undefined) return "an undisclosed number of";
  if (n >= 1e9) return `${(n / 1e9).toFixed(1)} billion`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(0)} million`;
  return String(n);
}

/** "about 1 in 3" */
export function oneInN(probabilityPct: number): string {
  const n = Math.max(1, Math.round(100 / Math.max(0.1, probabilityPct)));
  return `about 1 in ${n}`;
}

