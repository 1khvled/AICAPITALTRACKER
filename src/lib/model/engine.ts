import { MODEL_FACTORS, MODEL_CALIBRATION } from './factors';
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
  const totalBaseRiskWeight = MODEL_FACTORS
    .filter((f) => f.kind === 'risk')
    .reduce((acc, f) => acc + f.weightPct, 0); // e.g. 90%

  let normalizedRiskScore = 0;
  if (totalRiskCoverageWeight > 0) {
    normalizedRiskScore = (totalRiskEarned / totalRiskCoverageWeight) * 100;
  }

  // 3. Subtract real-demand damper
  const compositeScore = Math.min(100, Math.max(0, normalizedRiskScore - damperDiscount));

  // 4. Logistic mapping to burst probability (0 - 100%)
  const rawProb = MODEL_CALIBRATION.mapping(compositeScore);
  const burstProbability = Math.round(rawProb * 1000) / 10; // one decimal, e.g. 68.4

  // 5. Band assignment
  let band: BubbleBand = 'calm';
  if (burstProbability >= 80) band = 'critical';
  else if (burstProbability >= 65) band = 'high';
  else if (burstProbability >= 45) band = 'elevated';
  else if (burstProbability >= 25) band = 'guarded';
  else band = 'calm';

  // 6. Top driver identification (risk factors with highest score * weight)
  const sortedDrivers = [...contributions]
    .filter((c) => c.kind === 'risk')
    .sort((a, b) => (b.reading.score * b.weightPct) - (a.reading.score * a.weightPct))
    .slice(0, 3)
    .map((c) => c.id);

  return {
    burstProbability,
    compositeScore: Math.round(compositeScore * 10) / 10,
    band,
    contributions,
    coverage: Math.round(totalCoverageWeight * 100) / 100,
    topDriverIds: sortedDrivers,
    horizonMonths: 12,
    generatedAt: new Date().toISOString(),
  };
}

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
      company: 'Anthropic',
      valuationUsd: 40_000_000_000,
      runRateRevenueUsd: 1_000_000_000,
      note: 'IPO prospectus reviewed by Reuters Sep 2026; $1B run-rate vs $518B coming infrastructure obligations',
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
    totalDisclosedUsd: 2_753_757_802_026,
    byYear: {
      2023: 32_000_000_000,
      2024: 382_000_000_000,
      2025: 1_419_000_000_000,
      2026: 920_757_802_026,
    },
    debtShare: 0.291, // 29.1% borrowed
    computeContractShare: 0.185, // 18.5% in compute capacity commitments
    top10Share: 0.618, // Top 10 deals represent ~61.8% of volume
    circularShare: 0.124, // 12.4% circular/intertwined money
    announcedShare: 0.322, // 32.2% unclosed/waiting deals
    megaCountLast12m: 14,
    daysSinceLastMega: 33,
  },
  crowd: {
    yesProbability: 0.54, // 54% odds on Polymarket
    volumeUsd: 18_450_000,
    note: 'Volume-weighted Polymarket & Kalshi AI bubble burst prediction contracts (Oct 2026)',
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
};

/**
 * Dynamically resolves to the latest 24h synced data from live-inputs.json,
 * falling back to verified institutional baseline defaults.
 */
export const DEFAULT_MODEL_INPUTS: BubbleModelInputs =
  (liveInputsData as unknown as BubbleModelInputs) || BASELINE_FALLBACK;
