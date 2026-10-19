import {
  MODEL_FACTORS,
  MODEL_CALIBRATION,
  MODEL_VERSION,
  FRAGILITY_INDEX_BASIS,
} from './factors';
import {
  computeMertonModel,
  computeAltmanZScore,
  computeMinskyModel,
  computeShillerCapeModel,
} from './quantitative';
import type {
  BubbleBand,
  BubbleModelInputs,
  BubbleModelResult,
  FactorContribution,
} from './types';

/**
 * Computes the unified burst probability and per-factor contribution breakdown
 * according to the published transparent recipe.
 */
export function evaluateBubbleModel(
  inputs: BubbleModelInputs,
  options?: { skipSubModels?: boolean }
): BubbleModelResult {
  const contributions: FactorContribution[] = [];
  let totalRiskEarned = 0;
  let totalRiskCoverageWeight = 0;
  let damperDiscount = 0;
  let riskCoverageWeight = 0; // risk-only coverage (0-1), published as `coverage`
  let damperCoverage = 0;

  // 1. Evaluate all factors
  for (const factor of MODEL_FACTORS) {
    const reading = factor.compute(inputs);

    if (factor.kind === 'risk') {
      // Risk factor: 0 (calm) -> 1 (extreme); factors with a convex tail may reach 2.
      // Earned points initially proportional to factor weight and reading score
      const rawPoints = (factor.weightPct) * reading.score;
      totalRiskCoverageWeight += factor.weightPct * reading.coverage;
      totalRiskEarned += rawPoints * reading.coverage;
      // 2026-10-19 (v2.6.0): published coverage is RISK-ONLY and can never exceed 1.
      riskCoverageWeight += (factor.weightPct / 100) * reading.coverage;

      contributions.push({
        id: factor.id,
        label: factor.label,
        kind: 'risk',
        weightPct: factor.weightPct,
        earnedPoints: Math.round(rawPoints * 10) / 10,
        reading,
      });
    } else {
      // Damper factor: knock up to 10 points off composite score.
      // 2026-10-19 (v2.6.0): the cap is read from the damper factor's own published
      // weightPct (single source of truth — it used to be a hardcoded 10).
      const discount = reading.score * factor.weightPct * reading.coverage;
      damperDiscount += discount;
      damperCoverage = reading.coverage;

      contributions.push({
        id: factor.id,
        label: factor.label,
        kind: 'damper',
        weightPct: factor.weightPct,
        earnedPoints: -Math.round(discount * 10) / 10,
        reading,
      });
    }
  }

  // 2. Renormalize risk score across computable factors so a missing factor doesn't artificially calm the score
  let normalizedRiskScore = 0;
  if (totalRiskCoverageWeight > 0) {
    normalizedRiskScore = (totalRiskEarned / totalRiskCoverageWeight) * 100;
  }

  // 3. Nonlinear Systemic Contagion Synergy Term:
  // In sovereign and corporate credit panics, risk is super-additive: when credit spreads
  // widen simultaneously with high debt leverage and tight monetary rates, refinancing channels
  // freeze non-linearly.
  // 2026-10-19 (v2.6.0): the credit excess uses the factor's CORE score (tail-free), so the
  // convex credit tail is counted once (in the risk channel) and not re-amplified here.
  const cdsReading = contributions.find((c) => c.id === 'cds_stress')?.reading;
  const cdsScore = cdsReading?.coreScore ?? cdsReading?.score ?? 0;
  const debtScore = contributions.find((c) => c.id === 'debt_reliance')?.reading.score ?? 0;
  const macroScore = contributions.find((c) => c.id === 'macro_rates')?.reading.score ?? 0;

  const excessCds = Math.max(0, cdsScore - 0.35);
  const excessDebt = Math.max(0, debtScore - 0.30);
  const excessMacro = Math.max(0, macroScore - 0.30);
  const compoundSynergy = Math.pow(excessCds * excessDebt * excessMacro, 1 / 3);
  const systemicContagionPoints = Math.round(compoundSynergy * 16.0 * 10) / 10;

  // 4. Subtract real-demand damper and add systemic contagion
  const compositeScore = Math.min(100, Math.max(0, normalizedRiskScore + systemicContagionPoints - damperDiscount));

  // 5. Logistic mapping to burst probability (0 - 100%)
  const rawProb = MODEL_CALIBRATION.mapping(compositeScore);
  const burstProbability = Math.round(rawProb * 1000) / 10; // one decimal, e.g. 68.4

  // 6. Financial Fragility Index (0 - 100)
  // Measures vulnerability to an incremental 50bps rate hike or credit freeze.
  // 2026-10-19 (v2.6.0): the FORMULA is unchanged (published 52 stays 52); the index is
  // now labelled as derived from the same factor scores, not a first-derivative measure.
  const dPdS = (rawProb * (1 - rawProb)) / MODEL_CALIBRATION.steepness;
  const fragilityIndex = Math.min(
    100,
    Math.max(
      0,
      Math.round(dPdS * 100 * 2.5 + debtScore * 38 + macroScore * 22 + (inputs.ledger?.debtShare ?? 0.075) * 100)
    )
  );

  // 7. Band assignment
  let band: BubbleBand = 'calm';
  if (burstProbability >= 80) band = 'critical';
  else if (burstProbability >= 65) band = 'high';
  else if (burstProbability >= 45) band = 'elevated';
  else if (burstProbability >= 25) band = 'guarded';
  else band = 'calm';

  // 8. Top driver identification (risk factors with highest score * weight)
  const sortedDrivers = [...contributions]
    .filter((c) => c.kind === 'risk')
    .sort((a, b) => (b.reading.score * b.weightPct) - (a.reading.score * a.weightPct))
    .slice(0, 3)
    .map((c) => c.id);

  // 9. Quantitative Academic Models Integration (Merton 1974, Altman 2002, Minsky 1986, Shiller 2000)
  const mertonResult = options?.skipSubModels ? undefined : computeMertonModel(inputs);
  const altmanResult = options?.skipSubModels ? undefined : computeAltmanZScore(inputs);
  const minskyResult = options?.skipSubModels ? undefined : computeMinskyModel(inputs);
  const shillerCapeResult = options?.skipSubModels ? undefined : computeShillerCapeModel(inputs);

  return {
    burstProbability,
    compositeScore: Math.round(compositeScore * 10) / 10,
    band,
    contributions,
    // 2026-10-19 (v2.6.0): risk-only coverage, capped at 1 (it used to include the
    // damper's 10 points and publish 1.10 — a "coverage" above 100%).
    coverage: Math.round(Math.min(1, riskCoverageWeight) * 100) / 100,
    damperCoverage: Math.round(damperCoverage * 100) / 100,
    topDriverIds: sortedDrivers,
    horizonMonths: 12,
    generatedAt: new Date().toISOString(),
    fragilityIndex,
    fragilityIndexBasis: FRAGILITY_INDEX_BASIS,
    modelVersion: MODEL_VERSION,
    systemicContagionPoints,
    merton: mertonResult
      ? {
          distanceToDefault: mertonResult.distanceToDefault,
          defaultProbabilityPct: mertonResult.defaultProbabilityPct,
          structuralSpreadBps: mertonResult.structuralSpreadBps,
          interpretation: mertonResult.interpretation,
        }
      : undefined,
    altman: altmanResult
      ? {
          score: altmanResult.score,
          zone: altmanResult.zone,
          impliedDistressProbPct: altmanResult.impliedDistressProbPct,
          interpretation: altmanResult.interpretation,
        }
      : undefined,
    minsky: minskyResult,
    shillerCape: shillerCapeResult,
  };
}

export {
  computeMertonModel,
  computeAltmanZScore,
  computeLpplsMetrics,
  computeMinskyModel,
  computeMinskyRegime,
  computeShillerCapeModel,
  computeShillerECY,
  choleskyDecomposition,
  runMonteCarloSimulation,
  EMPIRICAL_CORRELATION_MATRIX,
  MC_SHOCK_PARAMS,
  CI_TYPE,
  HISTORICAL_BACKTESTS,
  computeBrierAndAuc,
  BACKTEST_CALIBRATION_SUMMARY,
  EMPIRICAL_VERIFICATION_MATRIX,
} from './quantitative';

// 2026-10-19 (v2.6.0): published model constants, re-exported for the API/docs layer.
export {
  MODEL_VERSION,
  SUM_RISK_WEIGHT_PCT,
  DAMPER_WEIGHT_PCT,
  MARKET_IMPLIED_12M_PCT,
  FRAGILITY_INDEX_BASIS,
  INPUTS_WITHOUT_WEIGHT,
  EMPIRICAL_DESIGN_MATRIX_5X5,
  CHANGELOG,
} from './factors';


import liveInputsData from '@/data/live-inputs.json';

const BASELINE_FALLBACK: BubbleModelInputs = {
  cds: {
    // VALUE FIX Oct 19, 2026 (pass 7): 5Y Oracle CDS record close 288bp on Oct 15 2026 (S&P Global
    // Market Intelligence via securitasglobal.com; 261bp a week earlier; CNBC Oct 19 ~295bp intraday).
    // priorBps = the 90-day-ago print: 203bp (Jul 20-24 2026, ICE). baselineBps = long-run norm.
    currentBps: 288,
    baselineBps: 81,
    priorBps: 203,
    otherBps: 135,
    note: '5Y USD CDS on Oracle (AI debt anchor): 288bp = record-high close Oct 15 2026 (S&P Global Market Intelligence); 261bp a week earlier (Oct 8); priorBps 203bp = Jul 20-24 2026 print (ICE). baseline 81bp = long-run norm assumption. S&P cut ORCL to BBB- on Jul 9 2026',
  },
  valuations: [
    {
      company: 'OpenAI',
      // 2026-10-19 (pass 11): 950B → 1.2T. $950B matched no report; the verified chain is
      // $852B closed Series G post-money (Mar 2026, Reuters) → round in talks at >$1.2T
      // (Bloomberg, Sep 16 2026) → $30B pre-IPO raise targeting ~$1.4T (The Information, Sep 29 2026).
      // Run-rate $50.0B end-Sep 2026 = OpenAI's own basis (FT/CNBC/Reuters Oct 8, 2026).
      valuationUsd: 1_200_000_000_000,
      runRateRevenueUsd: 50_000_000_000,
      note: 'Rounds in talks at >$1.2T post-money (Bloomberg, Sep 16 2026); $950B matched no report; last closed benchmark $852B Series G post-money (Mar 2026, Reuters); The Information Sep 29 2026: $30B pre-IPO raise targeting ~$1.4T. Annualized run-rate ~$50.0B end-Sep 2026 on OpenAI\'s own basis excluding cloud-partner gross-up (FT first / CNBC / Reuters, Oct 8 2026; the widely-reported $70B was a partner-comparable methodology)',
    },
    {
      company: 'Anthropic',
      valuationUsd: 2_000_000_000_000,
      // VALUE FIX Oct 19, 2026: was 47_000_000_000 (May 2026 run-rate). Anthropic's disclosed
      // annualized run-rate passed $65B by end-July 2026 (Bloomberg first, confirmed by Reuters/
      // CNBC, Aug 2026). Evidence: https://www.benzinga.com/markets/tech/26/08/61265293/anthropic-65-billion-annualized-revenue-claude-ipo
      // NOTE: the runtime path resolves live-inputs.json first (now 65B there as well — the pipeline
      // seeds were fixed the same day); this fallback keeps the verified baseline honest on its own.
      runRateRevenueUsd: 65_000_000_000,
      note: 'Oct 2026 pre-IPO banker valuation target ($2.0T debut target / $965B Series H post-money); annualized run-rate passed $65B by end-July 2026 (Bloomberg/CNBC), up from $47B in May 2026, propelled by Claude Code; $57B Broadcom convert & syndicate debt/credit facilities',
    },
    {
      company: 'Databricks',
      valuationUsd: 190_000_000_000,
      runRateRevenueUsd: 7_000_000_000,
      note: 'Coatue-led strategic round Aug 2026 ($190B valuation, $7B revenue run-rate reported)',
    },
    {
      // VALUE FIX Oct 19, 2026 (pass 7): the $250B is xAI's Feb 2026 all-stock merger value (deal-023),
      // distinct from SPCX's $2.05T public cap; revenue basis corrected from a stale $500M ARR to the
      // S-1 disclosed FY2025 revenue of $3.2B (operating loss $6.36B; AI segment revenue $2.56B in
      // Q2 2026 per the SpaceX Q2 2026 earnings release).
      company: 'xAI merger value (Feb 2026 all-stock)',
      valuationUsd: 250_000_000_000,
      runRateRevenueUsd: 3_200_000_000,
      note: 'Consolidated inside SpaceX (Nasdaq: SPCX, $2.05T live public market cap following the June 2026 IPO); this $250B is xAI\'s merger value in the Feb 2026 all-stock SpaceX/xAI combination (deal-023) and is distinct from the SPCX public cap. xAI revenue $3.2B FY2025 per the SpaceX S-1 (operating loss $6.36B; $2.62B in 2024); AI segment revenue $2.56B in Q2 2026 (+247% YoY) and $3.38B in H1 2026 per the SpaceX Q2 2026 earnings release (SEC 8-K)',
    },
    {
      company: 'Mistral AI',
      valuationUsd: 24_000_000_000,
      runRateRevenueUsd: 450_000_000,
      note: 'Oct 2026 Series D (€21B / $24B valuation, $450M annualized ARR scaling toward $1B, €1.5B convertible debt facility)',
    },
    {
      company: 'Scale AI',
      valuationUsd: 29_000_000_000,
      runRateRevenueUsd: 1_100_000_000,
      note: 'Meta strategic 49% stake benchmark ($29B valuation, $1.1B ARR government and enterprise AI contracts)',
    },
    {
      company: 'Cohere',
      valuationUsd: 7_000_000_000,
      runRateRevenueUsd: 250_000_000,
      note: 'Enterprise multi-cloud funding round ($7.0B valuation, $250M annualized revenue run-rate)',
    },
    {
      company: 'Perplexity AI',
      valuationUsd: 20_000_000_000,
      runRateRevenueUsd: 500_000_000,
      note: 'Institutional round backed by NVIDIA ($20B valuation, $500M annualized search run-rate)',
    },
    {
      company: 'Safe Superintelligence (SSI)',
      valuationUsd: 5_000_000_000,
      runRateRevenueUsd: 0,
      note: 'Seed / Series A round ($5.0B valuation, $0 revenue pre-product pure research lab)',
    },
  ],
  ledger: {
    // 2026-10-19 (pass 7): re-synced after the deal-161 double-count adjudication (CoreWeave $6.5B
    // expansion -> amount_usd 0), so the ledger total and debt base moved down by $6.5B.
    totalDisclosedUsd: 2_872_873_160_000,
    byYear: {
      2023: 26_357_880_000,
      2024: 294_585_000_000,
      2025: 1_739_393_980_000,
      2026: 812_536_300_000,
    },
    debtShare: 0.075, // 7.5% borrowed
    computeContractShare: 0.283, // 28.3% in compute capacity commitments
    top10Share: 0.638, // Top 10 deals represent ~63.8% of volume
    circularShare: 0.027, // 2.7% circular money
    announcedShare: 0.101, // 10.1% unclosed/waiting deals
    // 2026-10-19 (pass 6): recomputed from deals.json on every sync — whole days since the newest
    // mega-class announcement (deal-002, 28 Sep 2026) and the mega count inside the trailing 365 days.
    megaCountLast12m: 25,
    daysSinceLastMega: 21,
  },
  crowd: {
    // 2026-10-19 (pass 11): crowd fallback aligned to the live Polymarket snapshot in
    // src/data/live-inputs.json — bubble-2026 odds 0.076 → 0.0905 (9.05% YES), 2027 odds
    // 0.155 → 0.195 (19.5% YES), volume 2,443,553 → 9,167,627.
    yesProbability: 0.0905,
    volumeUsd: 9_167_627,
    bubble2026Probability: 0.0905,
    bubble2027Probability: 0.195,
    activeContractsCount: 16,
    note: 'Volume-weighted Polymarket AI bubble burst prediction contracts (r=AIbubble, Dec 31 2026 & June 30 2027 expiries)',
  },
  adoption: {
    // VALUE FIX Oct 19, 2026 (pass 4): 350M was stale. OpenAI DevDay (Sep 29, 2026) put ChatGPT
    // weekly actives at 1.2B on the official WAU series (800M Oct 2025 → 900M Feb 2026 → 1.2B Sep 2026).
    topProductUsers: 1_200_000_000, // 1.2B ChatGPT weekly users (OpenAI DevDay, Sep 2026)
    annualUserGrowth: 0.5, // +50% YoY (800M Oct 2025 → 1.2B Sep 2026)
    // VALUE FIX Oct 19, 2026: was `40 // 40x cheaper inference API pricing since early 2023`.
    // 40× didn't correspond to any verifiable rate sheet. Corrected INPUT-BASIS deflation vs the
    // GPT-4 benchmark ($30/1M input, Mar 14 2023 launch): DeepSeek V4.1 Flash lists $0.0448/1M
    // input on OpenRouter's aggregated open-weights serving (live Oct 19, 2026) → 30 / 0.0448 ≈ 670×
    // (1 - 1/669.6 ≈ -99.85% input cost). Completion-basis equivalent: $60 → $0.08 = 750×.
    // Evidence: https://openrouter.ai/api/v1/models + https://api-docs.deepseek.com/quick_start/pricing.
    // Structural note: the MODEL_FACTORS damper ramps over (1×, 50×), so the live feed's 670
    // already saturates this input — changing the fallback value does not alter any model output; it
    // just stops the verified-baseline ledge from understating realized deflation by ~17×.
    apiPriceDeclineMultiple: 670,
    trainingCostBand: 'rising',
    // 2026-10-19 (pass 11): note aligned word-for-word with src/data/live-inputs.json so the
    // fallback carries the same deflation basis + intraday disclosure as the live feed.
    note: 'OpenAI DevDay Sep 29 2026: ChatGPT 1.2B weekly users (900M Feb 2026, 800M Oct 2025, official WAU series) → +50% YoY. API deflation: GPT-4 $30/1M input (Mar 2023) → DeepSeek V4.1 Flash $0.0448/1M input (OpenRouter live Oct 19 2026) = 670×, input basis. INTRADAY DISCLOSURE (2026-10-19): the verified $0.0448/1M print was used; live aggregator spot for the same base row was observed swinging $0.0344–$0.0448/1M on Oct 19, 2026, so the published 670× multiple is pinned to the verified print and is therefore CONSERVATIVE (the low end would imply ~873×).',
  },
  capex: {
    // VALUE FIX Oct 19, 2026 (pass 4, mirrors _verified in live-inputs.json): was 485_000_000_000
    // (stale FY-mix basis). Corrected to Big-4 CY2026 capex guidance (Jul 2026 earnings calls:
    // AMZN ~$220B cash capex · GOOGL $195–205B · MSFT ~$175B incl. finance leases · META $130–145B
    // → ~$725B; Forbes Oct 7, 2026: "$700–725B, up ~75% from $410B in 2025"; Coatue Aug 11: ~$733B).
    aggregateCapexUsd: 725_000_000_000, // $725B guided CY2026 big-4 hyperscaler capex
    // Trailing FY basis retained per fact-check protocol (Forbes Oct 7, 2026: 2026 capex consumes
    // nearly all big-4 OCF, Amazon 2026 FCF guided negative — refresh with cohort 10-Qs).
    aggregateFcfUsd: 260_000_000_000, // $260B retained free cash flow cushion (trailing FY basis)
    note: 'Big-4 hyperscaler CY2026 capex guidance (Jul 2026 calls): ~$725B (Forbes Oct 7 2026: $700–725B; Coatue ~$733B); $260B trailing FY retained FCF',
  },
  macro: {
    us10yYieldPct: 5.10, // FRED DGS10 5.10% (Oct 15, 2026) — matches live
    us02yYieldPct: 4.75, // legacy DGS2 anchor — NOT re-verified Oct 19 2026 (display-only, no model weight)
    us10yBaselinePct: 3.75,
    // VALUE FIX Oct 19, 2026 (pass 4, mirrors _verified in live-inputs.json): CPI 2.9 → 3.72
    // (FRED CPIAUCSL Sep-2026 y/y: 336.298 vs Sep 2025 324.245); Fed funds 4.75 → 3.75 (FRED FEDFUNDS
    // Sep-2026 monthly obs — 2026 cut path); HY spread 328 → 323 (FRED BAMLH0A0HYM2, Oct 15, 2026);
    // real 10y 2.70 → 2.75 (DGS10 5.10 − T10YIE 2.35, Oct 15/16, 2026).
    cpiInflationYoY: 3.72,
    fedFundsRatePct: 3.75,
    rateHikeRiskBps: 25,
    realYield10y: 2.75,
    highYieldSpreadBps: 323,
    note: 'FRED-verified Oct 19 2026: DGS10 5.10% (cut-cycle Fed funds 3.75%); CPI +3.72% y/y; US HY OAS 323bp; real 10y 2.75%',
  },
  aiDebt: {
    annualDebtIssuanceUsd: 85_000_000_000,
    totalTrackedDebtUsd: 214_890_400_000,
    capexToOcfRatio: 0.548,
    gpuDepreciationDragUsd: 38_500_000_000,
    capexToRevenueMultiple: 8.75,
    note: 'SEC 10-Q Capex vs OCF synthesis & private debt facilities',
  },
};

/**
 * Dynamically resolves to the latest 24h synced data from live-inputs.json,
 * falling back to verified institutional baseline defaults.
 */
export const DEFAULT_MODEL_INPUTS: BubbleModelInputs =
  (liveInputsData as unknown as BubbleModelInputs) || BASELINE_FALLBACK;
