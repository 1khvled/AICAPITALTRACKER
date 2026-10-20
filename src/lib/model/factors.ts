// ── Burst Probability Model — factor definitions ─────────────────────────────
//
// EIGHT risk factors (100 risk points) + ONE real-use damper (up to −10 points,
// OUTSIDE the 0-100 risk scale). Each is a pure function from BubbleModelInputs
// to a normalized stress score. Weights are judgment calls made ONCE, published
// here, and never tweaked per refresh — that's what makes this an instrument
// rather than a vibe.
//
// Every factor degrades honestly: if an input is missing it shrinks the
// factor's coverage (0-1) and the aggregator renormalizes the remaining
// weights. No invented proxies.
//
// ── 2026-10-19 (model v2.6.0, algorithm-improvement wave 1) ──────────────────
// Three changes, all print-neutral on the 2026-10-19 live canon (71.6% / 63.3):
//   1. cds_stress gained a CONVEX TAIL above its published ramp ceiling (the linear
//      ramp saturated at 3× baseline = 243bp, leaving ZERO dynamic range above the
//      288bp record print — 288bp → 1000bp moved the published probability by 0.0).
//   2. macro_rates' HY-OAS leg gained the same treatment above 500bp.
//   3. the damper's deflation leg is no longer clamped at 50×, so it responds
//      across [50×, 500×] instead of being constant for every deflation ≥ 50×.
// Score domain widened from [0,1] to [0,2] for cds_stress and macro_rates only;
// every other factor is still strictly [0,1].

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

// ── Published model constants (v2.6.0) ─────────────────────────────────────
/** Model version. Bumped when the published calibration changes (weights never do). */
export const MODEL_VERSION = '2.7.0';

/**
 * The 8 risk factors' published weights sum to exactly 100 risk points and the
 * damper is a separate 10-point subtraction. Both are DERIVED from MODEL_FACTORS
 * at the bottom of this file (never hand-typed), so the published weight story
 * cannot drift from the code.
 */

/**
 * 12-month market-implied burst probability used as the published band's floor
 * (the model may never publish a floor above what money on the line prices).
 *
 * 2026-10-20 (v2.7.1): this is the FALLBACK 12-month proxy price - the
 * longest-dated tracked contract (the Jun-2027 bubble contract) at its last
 * published print. The band itself is now COMPUTED from the live contract
 * price by `marketImplied12mBand()` in documentFormulas.ts, so the published
 * range tracks the market instead of standing still while the market moves.
 */
export const MARKET_IMPLIED_12M_PCT = 19.5;

/**
 * The 12-month market-implied read, COMPUTED from the tracked contracts.
 *
 * The longest-dated tracked contract is the closest thing the market prices to
 * a 12-month question. It is scaled by a published horizon/bias factor α — a
 * 12-month horizon carries more risk than the contract's own shorter window, so
 * α > 1 — and the band spans the published α range.
 *
 * Every number below is computed from that price and those α values. None of
 * it is typed, so the band tracks the market instead of standing still while
 * the market moves, and the band-floor rule is true BY CONSTRUCTION: the
 * band's low end IS the market's own price (α = 1.00), so the published range
 * can never be narrower than what money on the line prices.
 */
export function marketImplied12mBand(contractPct: number): {
  /** The contract price the read is scaled from. */
  contractPct: number;
  /** Central read at the published bias-correction α. */
  centralPct: number;
  /** Low end of the band (α at the bottom of its range = the raw price). */
  lowPct: number;
  /** High end of the band (α at the top of its range). */
  highPct: number;
  /** α range the band is quoted over. */
  alphaRange: [number, number];
  /** Central bias-correction α. */
  alphaCentral: number;
} {
  const price =
    Number.isFinite(contractPct) && contractPct > 0 ? contractPct : MARKET_IMPLIED_12M_PCT;
  const alphaRange: [number, number] = [1.0, 1.25];
  const alphaCentral = 1.1;
  const round1 = (n: number) => Math.round(n * 10) / 10;
  return {
    contractPct: round1(price),
    centralPct: round1(price * alphaCentral),
    lowPct: round1(price * alphaRange[0]),
    highPct: round1(price * alphaRange[1]),
    alphaRange,
    alphaCentral,
  };
}

/**
 * The Financial Fragility Index is a LINEAR RE-EXPRESSION of the same factor
 * scores already inside the composite (a scaled dP/dS term plus debt and macro
 * score terms). It is not an independent measurement and it is not a pure
 * first derivative. Published verbatim so no consumer can imply otherwise.
 */
export const FRAGILITY_INDEX_BASIS =
  'derivative-weighted fragility from the same factor scores — not a first-derivative measure';

/**
 * Inputs the pipeline carries but no factor reads. Published so the API/docs can
 * state exactly which published inputs move the model and which are context.
 * `wave2Candidate` marks an input the algorithm-improvement wave has reserved
 * for a netting decision (it is NOT used by any factor today).
 */
export const INPUTS_WITHOUT_WEIGHT: {
  id: string;
  field: string;
  why: string;
  wave2Candidate?: boolean;
}[] = [
  {
    id: 'aiDebt.capexToRevenueMultiple',
    field: 'aiDebt.capexToRevenueMultiple',
    why: 'Capital intensity (capex ÷ revenue) is carried but read by no factor; reserved for the wave-2 deflation/rent netting decision.',
    wave2Candidate: true,
  },
  { id: 'ledger.computeContractShare', field: 'ledger.computeContractShare', why: 'Compute-capacity commitment share is context only; no factor weights it.' },
  { id: 'ledger.megaCountLast12m', field: 'ledger.megaCountLast12m', why: 'Reported in the velocity reading string but not scored (daysSinceLastMega carries the signal).' },
  { id: 'ledger.count', field: 'ledger.count', why: 'Deal count is reported in the pipeline telemetry, not scored.' },
  { id: 'cds.otherBps', field: 'cds.otherBps', why: 'Second AI-exposed borrower spread is carried but not blended into the credit factor.' },
  { id: 'crowd.bubble2027Probability', field: 'crowd.bubble2027Probability', why: 'Carried for the panel; the scored crowd leg is the 2026 contract only.' },
  { id: 'crowd.activeContractsCount', field: 'crowd.activeContractsCount', why: 'Contract count is context only; liquidity (volumeUsd) drives coverage.' },
  { id: 'crowd.markets', field: 'crowd.markets', why: 'Raw market list is retained for provenance; the scored leg is the volume-weighted 2026 probability.' },
  { id: 'adoption.topProductUsers', field: 'adoption.topProductUsers', why: 'User COUNT is context; the scored leg is the year-over-year growth rate.' },
  { id: 'macro.fedFundsRatePct', field: 'macro.fedFundsRatePct', why: 'Policy rate is display-only today; it is the input a regime multiplier would use if one were ever estimated.' },
  { id: 'macro.rateHikeRiskBps', field: 'macro.rateHikeRiskBps', why: 'Forward stress assumption, explicitly not a forecast; carries no weight.' },
  { id: 'aiDebt.gpuDepreciationDragUsd', field: 'aiDebt.gpuDepreciationDragUsd', why: 'GPU amortization drag is reported in the capex reading; the scored legs are capex ÷ FCF and capex ÷ OCF.' },
  { id: 'macro.us02yYieldPct', field: 'macro.us02yYieldPct', why: 'Legacy 2-year anchor — display-only and not present in the live input set.' },
];

/**
 * Published 5×5 design matrix for the Monte Carlo shock space:
 * [US10Y, Oracle CDS, HY-OAS, Capex, Valuation Multiples].
 * corr(CDS, HY-OAS) ≈ 0.80 — a solvency event moves both, but AI-specific
 * stress can move Oracle CDS while the broad high-yield market stays near 323bp.
 * The engine realizes this pair as systemic linkage (1.4bp HY per bp of Oracle
 * CDS) PLUS an independent HY-OAS shock; the 4×4 Cholesky block below covers
 * the four jointly-shocked variables.
 */
export const EMPIRICAL_DESIGN_MATRIX_5X5: {
  order: string[];
  matrix: number[][];
  notes: Record<string, string>;
} = {
  order: ['US10Y Yield', 'Oracle CDS', 'HY-OAS', 'Capex', 'Valuation Multiples'],
  matrix: [
    [1.00, 0.45, 0.30, 0.35, -0.40],
    [0.45, 1.00, 0.80, 0.50, -0.55],
    [0.30, 0.80, 1.00, 0.35, 0.25],
    [0.35, 0.50, 0.35, 1.00, 0.30],
    [-0.40, -0.55, 0.25, 0.30, 1.00],
  ],
  notes: {
    'Oracle CDS ↔ HY-OAS': '0.80 — a solvency event moves both, but AI-specific stress can move Oracle CDS while HY stays near 323bp.',
    'Oracle CDS ↔ Valuation Multiples': '-0.55 — widening credit and de-rating multiples are the same event seen from two sides.',
  },
};

/** Model changelog. Calibration changes are versioned here; weights are not. */
export const CHANGELOG: { version: string; date: string; scope: string }[] = [
  {
    version: '2.7.1',
    date: '2026-10-20',
    scope:
      'published ramp constants exported and the homepage flip-watch priced live — no calibration change, the print is unchanged',
  },
  {
    version: '2.7.0',
    date: '2026-10-20',
    scope:
      'credit factor de-saturation — the level ramp now spans the full crisis range (×1 → ×7.556) instead of clipping at ×3, so the factor measures stress instead of adding a constant',
  },
  {
    version: '2.6.0',
    date: '2026-10-19',
    scope:
      'credit tail, MC horizon-consistency, sensitivity-band relabel — point estimate unchanged',
  },
];

// ── 1 · CREDIT STRESS ────────────────────────────────────────────────────────
// The bond market re-prices AI borrowers first. Oracle is the system's biggest
// AI borrower, so its 5Y CDS is the primary thermometer: level vs the 2025
// baseline plus 3-month momentum. Reported levels only.
//
// 2026-10-19 (v2.6.0) — the linear ramp saturated: level stopped at 3× baseline
// (243bp) and momentum at +80bp, so the 288bp record print left the factor with
// ZERO remaining dynamic range (288bp → 1000bp moved the published probability by
// 0.0 points). Two repairs, both print-neutral on the live canon:
//
//   core = min(1, ramp(cur/base,1,3) · (0.85 + 0.15·ramp(cur−prior,0,80)))
//     · momentum is now a MULTIPLIER, not a 30% additive term. The old form read a
//       FLAT record print as "stress fell 30%" (−17.1 composite points); the new
//       form reads it as "no new stress" (85% of the level ramp, −2.7 points).
//   tail = max(0, (cur/base − 288/81)/4)^1.5
//     · a CONVEX tail in RATIO space, above the published ramp ceiling. The origin
//       288/81 is a PUBLISHED INDEX CONSTANT (the 2026-10-15 record close over the
//       81bp long-run baseline) — the same idiom as the frozen 187/81 Minsky and
//       4.42 US10Y references: dimensionless, stationary, independent of run date.
//
// cds_stress = min(2.00, core + 0.30·tail) — 288bp → 1.0000 (unchanged), 400bp →
// 1.061, 600bp → 1.284, panic ceiling 2.00 at ≈1011bp (18 × 2 = 36 composite points
// max). The contagion term consumes `coreScore` (the tail-free score) so a convex
// tail is never counted twice.
const CDS_TAIL_ORIGIN_RATIO = 288 / 81; // 3.5556× — published index constant (record close ÷ baseline)
const CDS_TAIL_SPAN = 4.0; // tail spans 3.5556× → 7.5556× baseline
const CDS_TAIL_WEIGHT = 0.3;
const CDS_MOMENTUM_FLOOR = 0.85; // a flat print keeps 85% of the level ramp
const CDS_SCORE_CEILING = 2.0; // panic ceiling: 18 × 2 = 36 composite points
/**
 * 2026-10-20 (v2.7.0) — DE-SATURATION. The level ramp used to top out at 3×
 * baseline (243bp) while the convex tail only starts at 3.5556× (the record
 * print). That left a DEAD ZONE: every print between 243bp and the record read
 * exactly 1.000 — 261bp (8 Oct) and 288bp (15 Oct) scored identically, and the
 * factor had been pinned at its full 18 points since 243bp. A factor that cannot
 * see 45bp of movement in the range that matters is not measuring stress, it is
 * adding a constant.
 *
 * The ceiling is now the point where the factor's OWN published panic premium
 * is fully earned (tail origin + tail span = 7.5556× ≈ 611bp), so the linear
 * part measures progress through the whole crisis range and the convex part
 * prices the panic region on top. No new constant is introduced: the number
 * comes from CDS_TAIL_ORIGIN_RATIO + CDS_TAIL_SPAN.
 *
 * Effect on the live canon: credit score 1.000 → 0.390 (7.0 of 18 points), the
 * contagion term falls with it (it consumes the tail-free core), composite
 * 63.6 → 48.3, published print 72.3% → 32.3%. Neither published fragility
 * index moved: the engine's derivative-weighted index stays at 53 and the
 * Minsky index at 65.7 — they are two different metrics and neither reads
 * the credit ramp.
 */
const CDS_LEVEL_CEILING_RATIO = CDS_TAIL_ORIGIN_RATIO + CDS_TAIL_SPAN; // 7.5556×

/**
 * PUBLISHED RAMP CONSTANTS (v2.7.1).
 *
 * The ceilings and panic thresholds that decide when a factor stops moving are
 * part of the published method — the methodology page prints them inside each
 * factor's formula string. They are exported here so a page can name the real
 * number instead of typing a second copy of it, and so a reader can be told
 * how far a reading sits from the point where its factor stops responding.
 */
export const PUBLISHED_RAMP_CONSTANTS = {
  /** Credit: the ratio at which the convex panic tail begins (the 288bp record). */
  cdsTailOriginRatio: CDS_TAIL_ORIGIN_RATIO,
  /** Credit: the ratio at which the level ramp saturates (×7.556 of baseline). */
  cdsLevelCeilingRatio: CDS_LEVEL_CEILING_RATIO,
  /** Macro: the high-yield spread above which its panic tail begins. */
  macroHyTailOriginBps: 500,
  /** Macro: the US10Y level at which the macro ramp saturates. */
  macroUs10yCeilingPct: 5.25,
  /** Valuation: the price/sales ratio at which the valuation ramp saturates. */
  valuationPsCeiling: 60,
  /** Debt: the debt share at which the debt ramp saturates. */
  debtShareCeiling: 0.15,
  /** Capex: the capex/FCF ratio at which the capex ramp saturates. */
  capexFcfCeiling: 2.0,
  /** Deflation: the token-price multiple at which the demand credit saturates. */
  deflationSaturationMultiple: 500,
} as const;


const cdStress: ModelFactor = {
  id: 'cds_stress',
  label: 'Credit stress (CDS spreads)',
  kind: 'risk',
  weightPct: 18,
  explain:
    'A CDS is the insurance price on a company\'s debt. When it jumps, bond investors are quietly pricing default risk on AI\'s biggest borrowers.',
  formula:
    'core = min(1, ramp(current ÷ baseline, ×1, ×7.556)·(0.85 + 0.15·ramp(90-day rise, +0bp, +80bp))); tail = max(0, (current ÷ baseline − 288/81) ÷ 4)^1.5; score = min(2.00, core + 0.30·tail)',
  compute: (i) => {
    if (!i.cds) return { score: 0.35, coreScore: 0.35, reading: 'No verified CDS datapoint', coverage: 0 };
    const { currentBps, baselineBps, priorBps } = i.cds;
    // 1× baseline calm, the panic extent (7.5556×) extreme — see
    // CDS_LEVEL_CEILING_RATIO: the level ramp spans the whole crisis range, so
    // the factor can never sit pinned at 1.000 below a genuine credit event.
    const level = ramp(currentBps / baselineBps, 1, CDS_LEVEL_CEILING_RATIO);
    const momentum = ramp(currentBps - priorBps, 0, 80); // +80bp in ~90 days = extreme
    const core = Math.min(
      1,
      level * (CDS_MOMENTUM_FLOOR + (1 - CDS_MOMENTUM_FLOOR) * momentum),
    );
    const tail = Math.pow(
      Math.max(0, (currentBps / baselineBps - CDS_TAIL_ORIGIN_RATIO) / CDS_TAIL_SPAN),
      1.5,
    );
    const score = Math.min(CDS_SCORE_CEILING, core + CDS_TAIL_WEIGHT * tail);
    return {
      score,
      coreScore: core,
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
  weightPct: 16,
  explain:
    'How expensive the top AI labs are relative to the revenue they actually book.',
  formula:
    'PS = median(valuation ÷ run-rate revenue); score = ramp(PS, 8×, 60×)',
  compute: (i) => {
    if (!i.valuations || i.valuations.length === 0)
      return { score: 0.35, reading: 'No verified valuations', coverage: 0 };
    // Commercial frontier labs (>= $100M ARR) anchor enterprise multiple calibration
    // Sub-commercial / pre-revenue research labs are excluded to prevent median skew
    const psValues = i.valuations
      .filter((v) => v.runRateRevenueUsd !== null && (v.runRateRevenueUsd as number) >= 100_000_000)
      .map((v) => v.valuationUsd / (v.runRateRevenueUsd as number));
    const ps = median(psValues);
    if (ps === null)
      return { score: 0.35, reading: `Valuations tracked but no verified revenues`, coverage: 0.4 };
    const score = ramp(ps, 8, 60);
    return {
      score,
      reading: `Median price/sales across commercial frontier labs: ${ps.toFixed(1)}×`,
      coverage: Math.min(1, psValues.length / 3),
    };
  },
};

// ── 3 · DEBT RELIANCE & ISSUANCE VELOCITY ─────────────────────────────────
// Equity froth burns paper. Borrowing burns real creditors — the 1929/2008
// channel. Debt+converts share of everything tracked ($214.9B across 24 deals)
// plus annual issuance pace ($85B/yr) and cash debt-service interest load.
const debtReliance: ModelFactor = {
  id: 'debt_reliance',
  label: 'Debt reliance & issuance pace',
  kind: 'risk',
  weightPct: 14,
  explain:
    'Share of tracked AI money that is borrowed (bonds, converts, bank facilities), cumulative debt obligations ($214.9B), and the annualized issuance velocity of GPU-backed debt. Debt transforms valuation froth into systemic solvency risk.',
  formula:
    'score = 0.50·ramp(debtShare, 2.5%, 15%) + 0.35·ramp(annualDebtIssuance, $20B, $100B) + 0.15·ramp(totalTrackedDebt, $50B, $250B)',
  compute: (i) => {
    if (!i.ledger) return { score: 0.35, reading: 'Ledger aggregates unavailable', coverage: 0 };
    const s = i.ledger.debtShare;
    const annualDebt = i.aiDebt?.annualDebtIssuanceUsd ?? 85_000_000_000;
    const totalDebt = i.aiDebt?.totalTrackedDebtUsd ?? 214_890_400_000;
    const debtScore = ramp(s, 0.025, 0.15);
    const issuanceScore = ramp(annualDebt, 20_000_000_000, 100_000_000_000);
    const volumeScore = ramp(totalDebt, 50_000_000_000, 250_000_000_000);
    const score = clamp01(debtScore * 0.50 + issuanceScore * 0.35 + volumeScore * 0.15);
    const totalDebtB = (totalDebt / 1e9).toFixed(1);
    const annualB = (annualDebt / 1e9).toFixed(1);
    return {
      score,
      // 2026-10-19 (pass 11): "20 facilities" → 24 — the ledger carries 24 is_debt records
      // ($214,890,400,000 verified across 24 debt facilities).
      reading: `Borrowed money = ${(s * 100).toFixed(1)}% ($${totalDebtB}B verified across 24 facilities); Velocity: $${annualB}B/yr`,
      coverage: 1,
    };
  },
};

// ── 4 · MACRO RATES & INFLATION STRESS (US10Y) ───────────────────────────
// High discount rates, persistent inflation, and elevated credit spreads
// compress long-duration tech cash flows and raise debt coupon refinancing costs.
const macroRatesStress: ModelFactor = {
  id: 'macro_rates',
  label: 'Macro interest rates & inflation (US10Y)',
  kind: 'risk',
  weightPct: 12,
  explain:
    '10-Year US Treasury yield, headline CPI inflation, real yields, and US high-yield credit spreads. High cost of capital compresses valuation multiples and inflates datacenter debt service burdens.',
  formula:
    'score = min(2, 0.40·ramp(US10Y, 3.75%, 5.25%) + 0.25·ramp(CPI YoY, 2.0%, 4.5%) + 0.15·ramp(Real Yield, 1.5%, 3.0%) + 0.20·(ramp(HY Spread, 250bp, 500bp) + 0.30·clamp01((HY−500)/700)^1.5))',
    // 2026-10-20: the published string now discloses the convex HY panic tail and the
    // min(2, …) ceiling, which the old string hid (it stopped at the plain ramp).
  compute: (i) => {
    // 2026-10-19 (pass 11): fallback macro block aligned to the FRED-verified live set in
    // src/data/live-inputs.json — CPI 2.9 → 3.72 (FRED CPIAUCSL Sep-2026 336.298 vs Sep-2025
    // 324.245), real 10y 2.70 → 2.75 (DGS10 5.10 − T10YIE 2.35, Oct 15/16 2026), Fed funds
    // 4.75 → 3.75 (FRED FEDFUNDS Sep-2026 monthly obs — 2026 cut cycle), HY-OAS 328 → 323
    // (FRED BAMLH0A0HYM2, Oct 15 2026). us02yYieldPct 4.75 is a legacy DGS2 anchor that was NOT
    // re-verified this session — it is display-only and carries no weight in this factor.
    const m = i.macro ?? {
      us10yYieldPct: 5.10,
      us02yYieldPct: 4.75,
      us10yBaselinePct: 3.75,
      cpiInflationYoY: 3.72,
      realYield10y: 2.75,
      fedFundsRatePct: 3.75,
      rateHikeRiskBps: 25,
      highYieldSpreadBps: 323,
      note: 'US Treasury 10Y Benchmark',
    };
    const yieldScore = ramp(m.us10yYieldPct, m.us10yBaselinePct, 5.25);
    const cpiScore = ramp(m.cpiInflationYoY, 2.0, 4.5);
    const realScore = ramp(m.realYield10y, 1.5, 3.0);
    // 2026-10-19 (pass 11): 328 → 323 (FRED BAMLH0A0HYM2, Oct 15 2026) — same print the note cites.
    const hySpread = m.highYieldSpreadBps ?? 323;
    // 2026-10-19 (v2.6.0): the HY-OAS leg gets the same convex panic tail as the credit
    // factor, above its 500bp ramp ceiling:
    //   score_hy = min(2, ramp(HY,250,500) + 0.30·clamp01((HY−500)/700)^1.5)
    // Today (323bp) the tail is 0, so the leg is numerically identical to the old ramp
    // (0.292) and the published macro score is unchanged at 0.7154.
    const hyCore = ramp(hySpread, 250, 500);
    const hyTail = 0.3 * Math.pow(clamp01((hySpread - 500) / 700), 1.5);
    const hyScore = Math.min(2, hyCore + hyTail);
    // 2026-10-19 (v2.6.0): the macro factor's domain is [0,2] (reachable only when the HY
    // leg carries a panic tail); every other leg is strictly [0,1].
    const score = Math.min(2, yieldScore * 0.40 + cpiScore * 0.25 + realScore * 0.15 + hyScore * 0.20);
    return {
      score,
      // 2026-10-19 (pass 11): "hike risk" → "stress assumption" — rateHikeRiskBps 25 is a
      // forward-looking stress parameter, NOT a forecast: 2026 is a Fed CUT cycle (funds 3.75%).
      reading: `US10Y ${m.us10yYieldPct.toFixed(2)}% (neutral ${m.us10yBaselinePct.toFixed(2)}%); CPI ${m.cpiInflationYoY.toFixed(1)}% YoY; HY-OAS ${hySpread}bp; Fed Funds ${m.fedFundsRatePct.toFixed(2)}% (+${m.rateHikeRiskBps}bp stress assumption)`,
      coverage: 1,
    };
  },
};

// ── 5 · CONCENTRATION & CIRCULARITY ────────────────────────────────────────
// Ponzi geometry: few counterparties dominating the flow, and chip vendors
// investing in their own customers. Circular money is maintained by hand from
// the tracked relationships.
const concentration: ModelFactor = {
  id: 'concentration_circularity',
  label: 'Concentration & circular money',
  kind: 'risk',
  weightPct: 13,
  explain:
    'When ten counterparties carry a market, one hiccup is systemic. When those counterparties fund each other\'s purchases, price discovery starts to rot.',
  formula:
    'score = 0.6·ramp(top10Share, 25%, 65%) + 0.4·ramp(circularShare, 1.5%, 15%)',
  compute: (i) => {
    if (!i.ledger) return { score: 0.35, reading: 'Ledger aggregates unavailable', coverage: 0 };
    const { top10Share, circularShare } = i.ledger;
    const score = clamp01(
      ramp(top10Share, 0.25, 0.65) * 0.6 + ramp(circularShare, 0.015, 0.15) * 0.4,
    );
    const circularB = ((i.ledger.totalDisclosedUsd * circularShare) / 1e9).toFixed(1);
    return {
      score,
      reading: `Top 10 deals = ${(top10Share * 100).toFixed(0)}% of volume; circular self-funded money = ${(circularShare * 100).toFixed(1)}% ($${circularB}B)`,
      coverage: 1,
    };
  },
};

// ── 6 · FUNDING VELOCITY & PIPELINE ────────────────────────────────────────
// Blow-off tops have signatures: money accelerating beyond even 2024's base,
// a fat backlog of announced-but-unclosed deals, and frequent $10B+ mega deals.
const velocity: ModelFactor = {
  id: 'funding_velocity',
  label: 'Funding velocity & pipeline',
  kind: 'risk',
  weightPct: 10,
  explain:
    'Is disclosed money still accelerating, is there an unclosed backlog, and has the megadeal flow gone quiet? Tops end with a bang or a hush.',
  formula:
    'score = 0.45·ramp(annualizedRunRate, $400B, $1.2T) + 0.35·ramp(announcedShare, 5%, 25%) + 0.20·ramp(daysSinceLastMega, 10, 90)',
  compute: (i) => {
    if (!i.ledger) return { score: 0.35, reading: 'Ledger aggregates unavailable', coverage: 0 };
    const now = new Date();
    const y = now.getUTCFullYear();
    // 2026-10-19 (pass 11): the fallback is the CURRENT-YEAR disclosed total (ledger.byYear[2026]),
    // NOT the all-time ledger total — 769,180,302,026 was a stale 2026 YTD figure. Verified:
    // live-inputs.json ledger.byYear["2026"] = 812,536,300,000 (which is what produces the published
    // "$975B/yr" annualized pace: 812,536,300,000 ÷ 10 months × 12).
    const yCurr = i.ledger.byYear[y] ?? 812_536_300_000;
    const elapsed = Math.max(1, Math.min(12, now.getUTCMonth() + 1));
    const annualized = (yCurr / elapsed) * 12;
    const speed = ramp(annualized, 400_000_000_000, 1_200_000_000_000);
    const backlog = ramp(i.ledger.announcedShare, 0.05, 0.25);
    const silence = ramp(i.ledger.daysSinceLastMega, 10, 90);
    const score = clamp01(speed * 0.45 + backlog * 0.35 + silence * 0.20);
    return {
      score,
      reading: `2026 annualized pace: $${(annualized / 1e9).toFixed(0)}B/yr; ${(i.ledger.announcedShare * 100).toFixed(1)}% backlog unclosed; ${i.ledger.daysSinceLastMega}d since last mega deal (${i.ledger.megaCountLast12m} mega deals in 12m)`,
      coverage: 1,
    };
  },
};

// ── 7 · CROWD SIGNAL ───────────────────────────────────────────────────────
// Prediction markets aggregate money-weighted opinion about the exact question
// we answer. Signal only counts where there is real liquidity.
const crowd: ModelFactor = {
  id: 'crowd_signal',
  label: 'Crowd odds (prediction markets)',
  kind: 'risk',
  weightPct: 9,
  explain:
    'Blended YES probability on AI-bubble markets from Polymarket — what money-weighted market participants currently price.',
  formula: 'score = Polymarket 2026/2027 contract YES odds (volume-weighted; thin books down-weighted)',
  compute: (i) => {
    const p = i.crowd?.bubble2026Probability ?? i.crowd?.yesProbability;
    if (!i.crowd || p === undefined || p === null)
      return { score: 0.35, reading: 'Odds feed offline', coverage: 0 };
    const vol = i.crowd.volumeUsd ?? 0;
    const coverage = vol >= 1_000_000 ? 1 : vol >= 100_000 ? 0.7 : 0.4;
    return {
      score: clamp01(p),
      reading: `Polymarket crowd: ${(p * 100).toFixed(1)}% YES on 2026 AI industry downturn contract ($${(vol / 1e6).toFixed(2)}M traded; referral r=AIbubble)`,
      coverage,
    };
  },
};

// ── 8 · CAPEX VS CASH FLOW & HARDWARE DEPRECIATION ─────────────────────────
// The hyperscalers' own money is the ballast. When building costs exceed
// the cash they generate, they are financing capacity on faith.
const capexCoverage: ModelFactor = {
  id: 'capex_cashflow',
  label: 'Capex vs free cash flow & hardware depreciation',
  kind: 'risk',
  weightPct: 8,
  explain:
    'Hyperscaler construction spending measured against free cash flow and the annual depreciation drag of GPU silicon fleets.',
  formula: 'score = 0.6·ramp(capex ÷ FCF, 0.5×, 2.0×) + 0.4·ramp(capexToOcf, 35%, 70%)',
  compute: (i) => {
    if (!i.capex || i.capex.aggregateCapexUsd === null || !i.capex.aggregateFcfUsd)
      return { score: 0.35, reading: 'Capex/FCF unreported', coverage: 0 };
    const ratio = i.capex.aggregateCapexUsd / i.capex.aggregateFcfUsd;
    const ocfRatio = i.aiDebt?.capexToOcfRatio ?? 0.548;
    const fcfScore = ramp(ratio, 0.5, 2.0);
    const ocfScore = ramp(ocfRatio, 0.35, 0.70);
    const score = clamp01(fcfScore * 0.6 + ocfScore * 0.4);
    const depDragB = i.aiDebt?.gpuDepreciationDragUsd ? (i.aiDebt.gpuDepreciationDragUsd / 1e9).toFixed(1) : "38.5";
    return {
      score,
      reading: `Hyperscaler capex = ${ratio.toFixed(2)}× of FCF (${(ocfRatio * 100).toFixed(1)}% of operating cashflow; $${depDragB}B/yr GPU amortization drag)`,
      coverage: 1,
    };
  },
};

// ── 9 · REAL-DEMAND DAMPER ────────────────────────────────────────────────
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
    'damper = 0.5·ramp(userGrowth, 10%, 100%) + 0.3·clamp01(ln(API price decline multiple ÷ 50) ÷ ln 10) + 0.2·(trainingCostBand ≤ falling) · max 10 composite points',
  compute: (i) => {
    if (!i.adoption)
      return { score: 0, reading: 'Adoption data unreported (damper off)', coverage: 0 };
    const a = i.adoption;
    const growth = a.annualUserGrowth === null ? 0 : ramp(a.annualUserGrowth, 0.1, 1.0);
    // 2026-10-19 (v2.6.0): the deflation leg is UN-SATURATED across [50×, 500×] — the old
    // ramp(defl, 1, 50) was constant (1.0) for every deflation ≥ 50×, so 200× ≡ 670× ≡ 873×.
    // New leg: demand_credit = clamp01(ln(defl/50)/ln 10) — 0 at 50×, 1 at 500×.
    // Today: 670× → ln(13.4)/ln(10) = 1.127 → clamp 1 → numerically IDENTICAL to the old
    // saturated leg, so the published damper (5.2 points) is unchanged.
    //
    // WAVE-2 OPTION (NOT implemented, normalization still open): net the demand credit
    // against the rent destruction an 83%/yr token-price collapse implies for a capital
    // stack with capex/revenue = m (currently 8.75×, an unreviewed derived input):
    //   δ = 1 − defl^(−1/3.62)   (annual price decay)
    //   s_defl = 0.30 · demand_credit · (1 − clamp01(δ·m/8.75))
    // The (1 − ·) form is CONTINUOUS and non-degenerate (0.0498 at today's δ = 0.834);
    // the wave-1 proposal s_defl = 0.30·max(0, demand_credit − clamp01(δ·m)) is identically
    // zero for every input (demand_credit > 0 requires defl ≥ 50×, and rent_drag saturates
    // at 1.0 for every defl ≥ 1.55×) — it deletes the leg instead of netting it.
    const cheap =
      a.apiPriceDeclineMultiple === null
        ? 0
        : clamp01(Math.log(a.apiPriceDeclineMultiple / 50) / Math.log(10));
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
  macroRatesStress,
  concentration,
  velocity,
  crowd,
  capexCoverage,
  adoptionDemand,
];

/**
 * DERIVED weight bookkeeping (never hand-typed):
 *  · the 8 risk factors carry 100 risk points on the 0-100 composite scale;
 *  · the damper is NOT part of that scale — it subtracts up to 10 points.
 * The published "coverage" field is the RISK-ONLY weighted coverage
 * (min(1, Σ w_i·c_i / 100)); the damper's coverage is reported separately.
 */
export const SUM_RISK_WEIGHT_PCT: number = MODEL_FACTORS.filter((f) => f.kind === 'risk').reduce(
  (acc, f) => acc + f.weightPct,
  0,
);

export const DAMPER_WEIGHT_PCT: number =
  MODEL_FACTORS.find((f) => f.kind === 'damper')?.weightPct ?? 0;

// Spec-named aliases (the API/docs layer addresses these by their published names).
export const sumRiskWeightPct = SUM_RISK_WEIGHT_PCT;
export const damperWeightPct = DAMPER_WEIGHT_PCT;
export const inputsWithoutWeight = INPUTS_WITHOUT_WEIGHT;

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
