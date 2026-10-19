import type { BubbleBand } from "@/lib/model/types";

/**
 * Display-only copy for the home answer page.
 *
 * Every number shown comes from the model result or the tracked ledger.
 * Nothing here recalculates, re-weights or re-interprets model maths — these
 * are labels and one-line explanations only.
 */

export const BAND_LABEL: Record<BubbleBand, string> = {
  calm: "Low risk",
  guarded: "Guarded",
  elevated: "Elevated",
  high: "High stress",
  critical: "Critical",
};

/** One plain-English sentence per band. No forecasts, no adjectives. */
export const BAND_VERDICT: Record<BubbleBand, string> = {
  calm:
    "Cash flow covers the spending. The borrowing and pricing risks look contained.",
  guarded:
    "Mostly real cash flow, with a few expensive bets still priced in.",
  elevated:
    "Spending is running ahead of cash flow. Nothing is priced for a crash; the cushion is thinning.",
  high:
    "Debt costs and valuations are moving together, the classic setup for a sharp drop.",
  critical:
    "The financing structure itself is under pressure, not only the share prices.",
};

/**
 * Sober severity tone, using only the global token set:
 * `.pill-risk` / `.pill-caution` / `.pill-safe` and the plain `.pill` neutral.
 * These modifiers carry their own dark-mode colours, so one class works in
 * both themes.
 *
 * `barTone` is the matching fill for the one visual bar that carries the
 * probability (the meter under the answer). It uses the same semantic
 * families as the gauge arc, so the two surfaces never disagree.
 */
export const BAND_TONE: Record<BubbleBand, { pillTone: string; barTone: string }> = {
  calm: { pillTone: "pill-safe", barTone: "bg-safe-500" },
  guarded: { pillTone: "", barTone: "bg-ink-faint" },
  elevated: { pillTone: "pill-caution", barTone: "bg-caution-500" },
  high: { pillTone: "pill-risk", barTone: "bg-risk-500" },
  critical: { pillTone: "pill-risk", barTone: "bg-risk-600" },
};

/**
 * Plain-language factor labels + one-clause definitions.
 * Keys match the factor ids returned in `result.contributions`.
 */
export const FACTOR_PLAIN: Record<string, { short: string; gloss: string }> = {
  cds_stress: {
    short: "Credit stress",
    gloss: "Insurance price on AI's biggest borrowers.",
  },
  valuation_stretch: {
    short: "Lab valuations",
    gloss: "What investors pay per dollar of lab revenue.",
  },
  debt_reliance: {
    short: "Borrowed money",
    gloss: "Loans and bonds used instead of profits.",
  },
  macro_rates: {
    short: "Interest rates",
    gloss: "What safe government bonds pay, which sets the bar for risky bets.",
  },
  concentration_circularity: {
    short: "Concentration",
    gloss: "Few buyers, and some of them funding each other.",
  },
  funding_velocity: {
    short: "Deal pace",
    gloss: "Whether new money is still accelerating.",
  },
  crowd_signal: {
    short: "Betting odds",
    gloss: "What prediction-market money is priced at.",
  },
  capex_cashflow: {
    short: "Capex vs cash",
    gloss: "Building cost measured against money actually earned.",
  },
  adoption_demand: {
    short: "Real use",
    gloss: "Actual usage that argues the score down.",
  },
};

export function factorPlain(id: string): { short: string; gloss: string } {
  return (
    FACTOR_PLAIN[id] ?? { short: id, gloss: "" }
  );
}

/** 2872873160000 → "$2.87T" */
export function formatTrillions(usd: number): string {
  return `$${(usd / 1e12).toFixed(2)}T`;
}

/** 214890400000 → "$214.9B" */
export function formatBillions(usd: number): string {
  return `$${(usd / 1e9).toFixed(1)}B`;
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

/** "2026-10-19" → "19 Oct 2026" (parsed as UTC so the server and client agree). */
export function formatAsOf(iso: string): string {
  const [y, m, d] = iso.split("-").map((n) => Number.parseInt(n, 10));
  if (!y || !m || !d) return iso;
  return `${d} ${MONTHS[m - 1]} ${y}`;
}
