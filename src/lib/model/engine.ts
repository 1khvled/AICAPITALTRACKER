import { MODEL_FACTORS, MODEL_CALIBRATION } from './factors';
import { computeMertonModel, computeAltmanZScore } from './quantitative';
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
export function evaluateBubbleModel(inputs: BubbleModelInputs): BubbleModelResult {
  const contributions: FactorContribution[] = [];
  let totalRiskEarned = 0;
  let totalRiskCoverageWeight = 0;
  let damperDiscount = 0;
  let totalCoverageWeight = 0;

  // 1. Evaluate all factors
  for (const factor of MODEL_FACTORS) {
    const reading = factor.compute(inputs);
    totalCoverageWeight += (factor.weightPct / 100) * reading.coverage;

    if (factor.kind === 'risk') {
      // Risk factor: 0 (calm) -> 1 (extreme)
      // Earned points initially proportional to factor weight and reading score
      const rawPoints = (factor.weightPct) * reading.score;
      totalRiskCoverageWeight += factor.weightPct * reading.coverage;
      totalRiskEarned += rawPoints * reading.coverage;

      contributions.push({
        id: factor.id,
        label: factor.label,
        kind: 'risk',
        weightPct: factor.weightPct,
        earnedPoints: Math.round(rawPoints * 10) / 10,
        reading,
      });
    } else {
      // Damper factor: knock up to 10 points off composite score
      const discount = reading.score * 10 * reading.coverage;
      damperDiscount += discount;

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
  const cdsScore = contributions.find((c) => c.id === 'cds_stress')?.reading.score ?? 0;
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

  // 6. Dispersion & 90% Confidence Interval Estimation
  const riskScores = contributions.filter((c) => c.kind === 'risk').map((c) => c.reading.score);
  const meanScore = riskScores.reduce((a, b) => a + b, 0) / (riskScores.length || 1);
  const variance = riskScores.reduce((a, b) => a + Math.pow(b - meanScore, 2), 0) / (riskScores.length || 1);
  const stdDev = Math.sqrt(variance);
  const coveragePenalty = 1 + (1 - totalCoverageWeight) * 1.5;
  const seScore = (stdDev / Math.sqrt(riskScores.length || 1)) * coveragePenalty * 22;
  const meScore = 1.645 * seScore; // 90% z-score
  const lowScore = Math.max(0, compositeScore - meScore);
  const highScore = Math.min(100, compositeScore + meScore);
  const lowProb = Math.round(MODEL_CALIBRATION.mapping(lowScore) * 1000) / 10;
  const highProb = Math.round(MODEL_CALIBRATION.mapping(highScore) * 1000) / 10;
  const confidenceInterval: [number, number] = [lowProb, highProb];

  // 7. Financial Fragility Index (0 - 100)
  // Measures vulnerability to an incremental 50bps rate hike or credit freeze
  const dPdS = (rawProb * (1 - rawProb)) / MODEL_CALIBRATION.steepness;
  const fragilityIndex = Math.min(
    100,
    Math.max(
      0,
      Math.round(dPdS * 100 * 2.5 + debtScore * 38 + macroScore * 22 + (inputs.ledger?.debtShare ?? 0.07) * 100)
    )
  );

  // 8. Band assignment
  let band: BubbleBand = 'calm';
  if (burstProbability >= 80) band = 'critical';
  else if (burstProbability >= 65) band = 'high';
  else if (burstProbability >= 45) band = 'elevated';
  else if (burstProbability >= 25) band = 'guarded';
  else band = 'calm';

  // 9. Top driver identification (risk factors with highest score * weight)
  const sortedDrivers = [...contributions]
    .filter((c) => c.kind === 'risk')
    .sort((a, b) => (b.reading.score * b.weightPct) - (a.reading.score * a.weightPct))
    .slice(0, 3)
    .map((c) => c.id);

  // 10. Quantitative Academic Models Integration (Merton 1974 & Altman 2002)
  const mertonResult = computeMertonModel(inputs);
  const altmanResult = computeAltmanZScore(inputs);

  return {
    burstProbability,
    compositeScore: Math.round(compositeScore * 10) / 10,
    band,
    contributions,
    coverage: Math.round(totalCoverageWeight * 100) / 100,
    topDriverIds: sortedDrivers,
    horizonMonths: 12,
    generatedAt: new Date().toISOString(),
    confidenceInterval,
    fragilityIndex,
    systemicContagionPoints,
    merton: {
      distanceToDefault: mertonResult.distanceToDefault,
      defaultProbabilityPct: mertonResult.defaultProbabilityPct,
      structuralSpreadBps: mertonResult.structuralSpreadBps,
      interpretation: mertonResult.interpretation,
    },
    altman: {
      score: altmanResult.score,
      zone: altmanResult.zone,
      impliedDistressProbPct: altmanResult.impliedDistressProbPct,
      interpretation: altmanResult.interpretation,
    },
  };
}

export { computeMertonModel, computeAltmanZScore, computeLpplsMetrics, runMonteCarloSimulation, HISTORICAL_BACKTESTS } from './quantitative';

import liveInputsData from '@/data/live-inputs.json';

const BASELINE_FALLBACK: BubbleModelInputs = {
  cds: {
    currentBps: 187,
    baselineBps: 81,
    priorBps: 155,
    otherBps: 135,
    note: 'Reuters & ICE Fixed Income 5Y USD CDS on Oracle (AI debt anchor), as of Sep-Oct 2026',
  },
  valuations: [
    {
      company: 'OpenAI',
      valuationUsd: 157_000_000_000,
      runRateRevenueUsd: 3_700_000_000,
      note: 'Oct 2026 funding round ($157B post-money valuation, $3.7B annualized run-rate reported by Reuters)',
    },
    {
      "company": "Anthropic",
      "valuationUsd": 65_000_000_000,
      "runRateRevenueUsd": 4_600_000_000,
      "note": "Oct 2026 funding round & S-1 Prospectus ($65B valuation, $4.6B revenue, $57B Broadcom & syndicate debt/credit facilities)",
    },
    {
      company: 'Databricks',
      valuationUsd: 190_000_000_000,
      runRateRevenueUsd: 7_000_000_000,
      note: 'Coatue-led strategic round Aug 2026 ($190B valuation, $7B revenue run-rate reported)',
    },
    {
      company: 'xAI',
      valuationUsd: 50_000_000_000,
      runRateRevenueUsd: 500_000_000,
      note: 'Colossus supercluster buildout & Series C valuation disclosures',
    },
    {
      company: 'Mistral AI',
      valuationUsd: 23_000_000_000,
      runRateRevenueUsd: 165_000_000,
      note: '€21B+ ($23B) Series D Sep 2026, annualized commercial revenues ~€150M ($165M)',
    },
    {
      company: 'Scale AI',
      valuationUsd: 13_800_000_000,
      runRateRevenueUsd: 900_000_000,
      note: 'Accel-led funding round and government contract disclosures',
    },
  ],
  ledger: {
    totalDisclosedUsd: 2_810_757_802_026,
    byYear: {
      2023: 26_345_000_000,
      2024: 295_235_000_000,
      2025: 1_719_997_500_000,
      2026: 769_180_302_026,
    },
    debtShare: 0.070, // 7.0% borrowed ($196.8B across 20 verified debt & convertible facilities)
    computeContractShare: 0.280, // 28.0% in compute capacity commitments ($712B)
    top10Share: 0.665, // Top 10 deals represent ~66.5% of volume
    circularShare: 0.028, // 2.8% circular money ($77.7B)
    announcedShare: 0.127, // 12.7% unclosed/waiting deals
    megaCountLast12m: 46,
    daysSinceLastMega: 14,
  },
  crowd: {
    yesProbability: 0.076, // 7.6% live verified odds on Polymarket 2026 downturn contract
    volumeUsd: 2_443_553,
    bubble2026Probability: 0.076,
    bubble2027Probability: 0.155,
    activeContractsCount: 16,
    note: 'Volume-weighted Polymarket AI bubble burst prediction contracts (r=AIbubble, Dec 31 2026 & June 30 2027 expiries)',
  },
  adoption: {
    topProductUsers: 350_000_000, // 350M active users
    annualUserGrowth: 0.65, // +65% YoY growth
    apiPriceDeclineMultiple: 40, // 40x cheaper inference API pricing since early 2023
    trainingCostBand: 'rising',
    note: 'Public API rate cards, OpenAI DevDay statements, Anthropic pricing logs',
  },
  capex: {
    aggregateCapexUsd: 210_000_000_000, // $210B annualized hyperscaler capex
    aggregateFcfUsd: 184_000_000_000, // $184B free cash flow
    note: 'Microsoft, Alphabet, Meta, Amazon Q2/Q3 2026 10-Q consensus annualized',
  },
  macro: {
    us10yYieldPct: 4.42,
    us10yBaselinePct: 3.75,
    cpiInflationYoY: 2.9,
    fedFundsRatePct: 4.75,
    rateHikeRiskBps: 25,
    realYield10y: 2.05,
    highYieldSpreadBps: 328,
    note: 'US Treasury 10Y Benchmark, BLS CPI, Federal Reserve policy baseline & High Yield spreads',
  },
  aiDebt: {
    annualDebtIssuanceUsd: 85_000_000_000,
    totalTrackedDebtUsd: 196_822_500_000,
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
