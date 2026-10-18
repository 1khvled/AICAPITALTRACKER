// ── Burst Probability Model — factor definitions ─────────────────────────────
//
// Eight factors, each a pure function from BubbleModelInputs to a normalized
// 0-1 stress score (risk factors add stress; the adoption damper subtracts).
// Weights are judgment calls made ONCE, published here, and never tweaked per
// refresh — that's what makes this an instrument rather than a vibe.
//
// Every factor degrades honestly: if an input is missing it shrinks the
// factor's coverage (0-1) and the aggregator renormalizes the remaining
// weights. No invented proxies.

import type {
  BubbleModelInputs,
  FactorKind,
  FactorReading,
} from './types';

export interface ModelFactor {
  id: string;
  label: string;
  kind: FactorKind;
  /** Percent of total model weight (risk weights + damper weight = 100). */
  weightPct: number;
  /** One-breath explanation for the methodology panel. */
  explain: string;
  /** Formula in plain text, for the published recipe. */
  formula: string;
  compute: (inputs: BubbleModelInputs) => FactorReading;
}

const clamp01 = (x: number): number => Math.min(1, Math.max(0, x));
/**
 * Linear map from [a, b] to [0, 1], clamped. `a` = reading considered calm
 * (score 0), `b` = reading considered extreme (score 1).
 */
const ramp = (value: number, a: number, b: number): number =>
  clamp01((value - a) / (b - a));

/** Median of a numeric array; empty → null. */
const median = (xs: number[]): number | null => {
  if (xs.length === 0) return null;
  const s = [...xs].sort((m, n) => m - n);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
};

const kellyAnchor = 55; // composite score that maps to 50% (judgment anchor, see modelRecipe)
const steepness = 9; // logistic slope: ±9 points ≈ ±50% odds shift

// ── 1 · CREDIT STRESS ────────────────────────────────────────────────────────
// The bond market re-prices AI borrowers first. Oracle is the system's biggest
// AI borrower, so its 5Y CDS is the primary thermometer: level vs the 2025
// baseline plus 3-month momentum. Reported levels only.
const cdStress: ModelFactor = {
  id: 'cds_stress',
  label: 'Credit stress (CDS spreads)',
  kind: 'risk',
  weightPct: 20,
  explain:
    'A CDS is the insurance price on a company\'s debt. When it jumps, bond investors are quietly pricing default risk on AI\'s biggest borrowers.',
  formula:
    'score = ramp(current ÷ baseline, ×1, ×3)·0.7 + ramp(90-day rise, +0bp, +80bp)·0.3',
  compute: (i) => {
    if (!i.cds) return { score: 0.35, reading: 'No verified CDS datapoint', coverage: 0 };
    const { currentBps, baselineBps, priorBps } = i.cds;
    const level = ramp(currentBps / baselineBps, 1, 3); // 1× baseline calm, 3× extreme
    const momentum = ramp(currentBps - priorBps, 0, 80); // +80bp in ~90 days = extreme
    const score = clamp01(level * 0.7 + momentum * 0.3);
    return {
      score,
      reading: `CDS ${currentBps}bp vs ${baselineBps}bp baseline (${Math.round(currentBps / baselineBps * 100)}% of baseline; prior ${priorBps}bp)`,
      coverage: 1,
    };
  },
};

// ── 2 · VALUATION STRETCH ────────────────────────────────────────────────
// Primary-lab equity prices measured against the only fundamental that exists:
// revenue. Median price/sales across the tracked labs. 8× a healthy premium;
// 60× is end-of-cycle Fantasyland.
const valuationStretch: ModelFactor = {
  id: 'valuation_stretch',
  label: 'Private valuation stretch',
  kind: 'risk',
  weightPct: 18,
  explain:
    'How expensive the top AI labs are relative to the revenue they actually book.',
  formula:
    'PS = median(valuation ÷ run-rate revenue); score = ramp(PS, 8×, 60×)',
  compute: (i) => {
    if (!i.valuations || i.valuations.length === 0)
      return { score: 0.35, reading: 'No verified valuations', coverage: 0 };
    const psValues = i.valuations
      .filter((v) => v.runRateRevenueUsd !== null && v.runRateRevenueUsd > 0)
      .map((v) => v.valuationUsd / (v.runRateRevenueUsd as number));
    const ps = median(psValues);
    if (ps === null)
      return { score: 0.35, reading: `Valuations tracked but no verified revenues`, coverage: 0.4 };
    const score = ramp(ps, 8, 60);
    return {
      score,
      reading: `Median price/sales across tracked labs: ${ps.toFixed(1)}×`,
      coverage: Math.min(1, psValues.length / 3),
    };
  },
};

// ── 3 · DEBT RELIANCE ──────────────────────────────────────────────────────
// Equity froth burns paper. Borrowing burns real creditors — the 1929/2008
// channel. Debt+converts share of everything tracked.
const debtReliance: ModelFactor = {
  id: 'debt_reliance',
  label: 'Debt reliance',
  kind: 'risk',
  weightPct: 15,
  explain:
    'Share of tracked AI money that is borrowed (bonds, converts, bank facilities) rather than invested. Debt is how bubbles turn into crises.',
  formula: 'score = ramp(debtShare, 8%, 35%)',
  compute: (i) => {
    if (!i.ledger) return { score: 0.35, reading: 'Ledger aggregates unavailable', coverage: 0 };
    const s = i.ledger.debtShare;
    return {
      score: ramp(s, 0.08, 0.35),
      reading: `Borrowed money = ${(s * 100).toFixed(1)}% of the $${(i.ledger.totalDisclosedUsd / 1e12).toFixed(2)}T tracked`,
      coverage: 1,
    };
  },
};

// ── 4 · CONCENTRATION & CIRCULARITY ────────────────────────────────────────
// Ponzi geometry: few counterparties dominating the flow, and chip vendors
// investing in their own customers. Circular money is maintained by hand from
// the tracked relationships (e.g. a chipmaker invests in a lab that buys its
// chips, or in the reseller whose main buyer is that lab).
const concentration: ModelFactor = {
  id: 'concentration_circularity',
  label: 'Concentration & circular money',
  kind: 'risk',
  weightPct: 15,
  explain:
    'When ten counterparties carry a market, one hiccup is systemic. When those counterparties fund each other\'s purchases, price discovery starts to rot.',
  formula:
    'score = 0.6·ramp(top10Share, 25%, 65%) + 0.4·ramp(circularShare, 2%, 20%)',
  compute: (i) => {
    if (!i.ledger) return { score: 0.35, reading: 'Ledger aggregates unavailable', coverage: 0 };
    const { top10Share, circularShare } = i.ledger;
    const score = clamp01(
      ramp(top10Share, 0.25, 0.65) * 0.6 + ramp(circularShare, 0.02, 0.2) * 0.4,
    );
    return {
      score,
      reading: `Top 10 deals = ${(top10Share * 100).toFixed(0)}% of volume; circular self-funded money = ${(circularShare * 100).toFixed(0)}%`,
      coverage: 1,
    };
  },
};

// ── 5 · FUNDING VELOCITY & PIPELINE ────────────────────────────────────────
// Blow-off tops have signatures: money accelerating beyond even 2025's absurd
// base, a fat backlog of announced-but-unclosed deals, then sudden silence.
const velocity: ModelFactor = {
  id: 'funding_velocity',
  label: 'Funding velocity & pipeline',
  kind: 'risk',
  weightPct: 12,
  explain:
    'Is disclosed money still accelerating, is there an unclosed backlog, and has the megadeal flow gone quiet? Tops end with a bang or a hush.',
  formula:
    'score = 0.4·ramp(2026 run-rate ÷ 2025 total, 1×, 2.5×) + 0.4·ramp(announcedShare, 5%, 30%) + 0.2·ramp(daysSinceLastMega, 30, 120)',
  compute: (i) => {
    if (!i.ledger) return { score: 0.35, reading: 'Ledger aggregates unavailable', coverage: 0 };
    const now = new Date();
    const y = now.getUTCFullYear();
    const y26 = i.ledger.byYear[y] ?? 0;
    const y25 = i.ledger.byYear[y - 1] ?? 0;
    const elapsed = Math.max(1, Math.min(12, now.getUTCMonth() + 1));
    const runRate = y25 > 0 ? (y26 / elapsed) * 12 / y25 : 1;
    const speed = ramp(runRate, 1, 2.5);
    const backlog = ramp(i.ledger.announcedShare, 0.05, 0.3);
    const silence = ramp(i.ledger.daysSinceLastMega, 30, 120);
    const score = clamp01(speed * 0.4 + backlog * 0.4 + silence * 0.2);
    return {
      score,
      reading: `2026 run-rate ${(runRate).toFixed(2)}× of 2025; ${(i.ledger.announcedShare * 100).toFixed(0)}% of deals unclosed; ${i.ledger.daysSinceLastMega}d since last $10B+ deal (mega count: ${i.ledger.megaCountLast12m})`,
      coverage: 1,
    };
  },
};

// ── 6 · CROWD SIGNAL ───────────────────────────────────────────────────────
// Prediction markets aggregate money-weighted opinion about the exact question
// we answer. Signal only counts where there is real liquidity.
const crowd: ModelFactor = {
  id: 'crowd_signal',
  label: 'Crowd odds (prediction markets)',
  kind: 'risk',
  weightPct: 10,
  explain:
    'Blended YES probability on AI-bubble markets from Polymarket — what money-weighted strangers currently believe.',
  formula: 'score = blended YES probability (volume-weighted; thin books down-weighted)',
  compute: (i) => {
    if (!i.crowd || i.crowd.yesProbability === null)
      return { score: 0.35, reading: 'Odds feed offline', coverage: 0 };
    const vol = i.crowd.volumeUsd ?? 0;
    const coverage = vol >= 1_000_000 ? 1 : vol >= 100_000 ? 0.7 : 0.4;
    return {
      score: clamp01(i.crowd.yesProbability),
      reading: `Prediction markets: ${(i.crowd.yesProbability * 100).toFixed(0)}% YES on bubble-pop questions ($${Math.round(vol / 1000)}k traded)`,
      coverage,
    };
  },
};

// ── 7 · CAPEX VS CASH FLOW ─────────────────────────────────────────────────
// The hyperscalers' own money is the高级 ballast. When building costs exceed
// the cash they generate, they are financing capacity on faith — the 2001
// fiber-overbuild channel.
const capexCoverage: ModelFactor = {
  id: 'capex_cashflow',
  label: 'Capex vs free cash flow',
  kind: 'risk',
  weightPct: 5,
  explain:
    'Hyperscaler construction spending measured against the cash those companies actually earned to pay for it.',
  formula: 'score = ramp(capex ÷ FCF, 0.5×, 2.0×)',
  compute: (i) => {
    if (!i.capex || i.capex.aggregateCapexUsd === null || !i.capex.aggregateFcfUsd)
      return { score: 0.35, reading: 'Capex/FCF unreported', coverage: 0 };
    const ratio = i.capex.aggregateCapexUsd / i.capex.aggregateFcfUsd;
    return {
      score: clamp01(ramp(ratio, 0.5, 2)),
      reading: `Hyperscaler capex = ${ratio.toFixed(2)}× of their free cash flow`,
      coverage: 1,
    };
  },
};

// ── 8 · REAL-DEMAND DAMPER ────────────────────────────────────────────────
// The one factor that argues DOWN. If hundreds of millions of people keep
// growing usage and inference keeps getting radically cheaper while frontier
// training costs stay contained, froth has a foundation. It can subtract up to
// 10 points from the composite.
const adoptionDemand: ModelFactor = {
  id: 'adoption_demand',
  label: 'Real-use damper',
  kind: 'damper',
  weightPct: 10,
  explain:
    'Evidence of genuine, growing demand — users rising, tokens getting cheaper, training costs contained — knocks points OFF the burst score.',
  formula:
    'damper = 0.5·ramp(userGrowth, 10%, 100%) + 0.3·ramp(API price decline multiple, 1×, 50×) + 0.2·(trainingCostBand ≤ falling) · max 10 composite points',
  compute: (i) => {
    if (!i.adoption)
      return { score: 0, reading: 'Adoption data unreported (damper off)', coverage: 0 };
    const a = i.adoption;
    const growth = a.annualUserGrowth === null ? 0 : ramp(a.annualUserGrowth, 0.1, 1.0);
    const cheap = a.apiPriceDeclineMultiple === null ? 0 : ramp(a.apiPriceDeclineMultiple, 1, 50);
    const contained =
      a.trainingCostBand === null ? 0 : a.trainingCostBand === 'rising' ? 0 : a.trainingCostBand === 'flat' ? 0.5 : 1;
    const score = clamp01(growth * 0.5 + cheap * 0.3 + contained * 0.2);
    const filled = [a.annualUserGrowth, a.apiPriceDeclineMultiple, a.trainingCostBand].filter(
      (x) => x !== null,
    ).length;
    return {
      score,
      reading: `Users ${a.annualUserGrowth === null ? '?' : `+${(a.annualUserGrowth * 100).toFixed(0)}% YoY`}, inference ${a.apiPriceDeclineMultiple === null ? '?' : `${a.apiPriceDeclineMultiple}× cheaper`}, training cost ${a.trainingCostBand ?? '?'}`,
      coverage: filled / 3,
    };
  },
};

export const MODEL_FACTORS: ModelFactor[] = [
  cdStress,
  valuationStretch,
  debtReliance,
  concentration,
  velocity,
  crowd,
  capexCoverage,
  adoptionDemand,
];

/** The published recipe, in one line per factor — rendered by the methodology section. */
export const modelRecipe = MODEL_FACTORS.map((f) => ({
  id: f.id,
  label: f.label,
  kind: f.kind,
  weightPct: f.weightPct,
  explain: f.explain,
  formula: f.formula,
}));

/** Logistic anchors — exported so the methodology can publish the exact mapping. */
export const MODEL_CALIBRATION = {
  anchorScore: kellyAnchor,
  steepness,
  mapping: (score: number): number =>
    1 / (1 + Math.exp(-(score - kellyAnchor) / steepness)),
};
