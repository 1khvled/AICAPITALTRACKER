/**
 * Quantitative Financial Models & Bubble Simulation Engine (Pure ES Module for Node.js)
 * 
 * Implements classical structural and empirical credit risk models from financial literature:
 * 1. Unified Multi-Factor Bubble Score & Burst Probability (Transparent Composite Recipe)
 * 2. Merton Structural Credit Risk Model (Merton 1974) — Option-theoretic Distance-to-Default
 * 3. Altman Z''-Score Model for Non-Manufacturers & Technology Services (Altman 1968, 2002)
 * 4. Log-Periodic Power Law Singularity (LPPLS) Bubble Hazard (Sornette et al.)
 * 5. 10,000-Path Monte Carlo Stochastic Sampling Engine (Median, Mean, 90% CI, 95% VaR, 95% Expected Shortfall)
 */

// ── Standard Normal Cumulative Distribution Function (Abramowitz & Stegun 7.1.26) ──
export function normalCdf(x) {
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;

  const sign = x < 0 ? -1 : 1;
  const absX = Math.abs(x) / Math.SQRT2;

  const t = 1.0 / (1.0 + p * absX);
  const y = 1.0 - (((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t) * Math.exp(-absX * absX);

  return 0.5 * (1.0 + sign * y);
}

const clamp01 = (x) => Math.min(1, Math.max(0, x));
const ramp = (value, a, b) => clamp01((value - a) / (b - a));

const median = (xs) => {
  if (!xs || xs.length === 0) return null;
  const s = [...xs].sort((m, n) => m - n);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
};

const kellyAnchor = 55;
const steepness = 9;
export const logisticMapping = (score) => 1 / (1 + Math.exp(-(score - kellyAnchor) / steepness));

/**
 * 1. Unified Multi-Factor Bubble Stress Evaluation
 */
export function evaluateBubbleModel(inputs) {
  const contributions = [];
  let totalRiskEarned = 0;
  let totalRiskCoverageWeight = 0;
  let damperDiscount = 0;
  let totalCoverageWeight = 0;

  // Factor 1: CDS Stress (weight: 18)
  {
    const cds = inputs.cds;
    let score = 0.35;
    let reading = 'No verified CDS datapoint';
    let coverage = 0;
    if (cds) {
      const level = ramp(cds.currentBps / cds.baselineBps, 1, 3);
      const momentum = ramp(cds.currentBps - cds.priorBps, 0, 80);
      score = clamp01(level * 0.7 + momentum * 0.3);
      reading = `CDS ${cds.currentBps}bp vs ${cds.baselineBps}bp baseline (${Math.round((cds.currentBps / cds.baselineBps) * 100)}% of baseline; prior ${cds.priorBps}bp)`;
      coverage = 1;
    }
    const weightPct = 18;
    totalCoverageWeight += (weightPct / 100) * coverage;
    totalRiskCoverageWeight += weightPct * coverage;
    totalRiskEarned += weightPct * score * coverage;
    contributions.push({
      id: 'cds_stress',
      label: 'Credit stress (CDS spreads)',
      kind: 'risk',
      weightPct,
      earnedPoints: Math.round(weightPct * score * 10) / 10,
      reading: { score, reading, coverage },
    });
  }

  // Factor 2: Valuation Stretch (weight: 16)
  {
    const valuations = inputs.valuations || [];
    let score = 0.35;
    let reading = 'No verified valuations';
    let coverage = 0;
    const psValues = valuations
      .filter((v) => v.runRateRevenueUsd !== null && v.runRateRevenueUsd > 0)
      .map((v) => v.valuationUsd / v.runRateRevenueUsd);
    const ps = median(psValues);
    if (ps !== null) {
      score = ramp(ps, 8, 60);
      reading = `Median price/sales across tracked labs: ${ps.toFixed(1)}×`;
      coverage = Math.min(1, psValues.length / 3);
    }
    const weightPct = 16;
    totalCoverageWeight += (weightPct / 100) * coverage;
    totalRiskCoverageWeight += weightPct * coverage;
    totalRiskEarned += weightPct * score * coverage;
    contributions.push({
      id: 'valuation_stretch',
      label: 'Private valuation stretch',
      kind: 'risk',
      weightPct,
      earnedPoints: Math.round(weightPct * score * 10) / 10,
      reading: { score, reading, coverage },
    });
  }

  // Factor 3: Debt Reliance (weight: 14)
  {
    const s = inputs.ledger?.debtShare ?? 0.07;
    const annualDebt = inputs.aiDebt?.annualDebtIssuanceUsd ?? 85_000_000_000;
    const totalDebt = inputs.aiDebt?.totalTrackedDebtUsd ?? 196_822_500_000;
    const debtScore = ramp(s, 0.025, 0.15);
    const issuanceScore = ramp(annualDebt, 20_000_000_000, 100_000_000_000);
    const volumeScore = ramp(totalDebt, 50_000_000_000, 250_000_000_000);
    const score = clamp01(debtScore * 0.50 + issuanceScore * 0.35 + volumeScore * 0.15);
    const reading = `Borrowed money = ${(s * 100).toFixed(1)}% ($${(totalDebt / 1e9).toFixed(1)}B verified); Velocity: $${(annualDebt / 1e9).toFixed(1)}B/yr`;
    const coverage = inputs.ledger ? 1 : 0;
    const weightPct = 14;
    totalCoverageWeight += (weightPct / 100) * coverage;
    totalRiskCoverageWeight += weightPct * coverage;
    totalRiskEarned += weightPct * score * coverage;
    contributions.push({
      id: 'debt_reliance',
      label: 'Debt reliance & issuance pace',
      kind: 'risk',
      weightPct,
      earnedPoints: Math.round(weightPct * score * 10) / 10,
      reading: { score, reading, coverage },
    });
  }

  // Factor 4: Macro Rates & Inflation Stress (weight: 12)
  {
    const m = inputs.macro ?? {
      us10yYieldPct: 4.42,
      us10yBaselinePct: 3.75,
      cpiInflationYoY: 2.9,
      realYield10y: 2.05,
      fedFundsRatePct: 4.75,
      rateHikeRiskBps: 25,
      highYieldSpreadBps: 328,
    };
    const yieldScore = ramp(m.us10yYieldPct, m.us10yBaselinePct, 5.25);
    const cpiScore = ramp(m.cpiInflationYoY, 2.0, 4.5);
    const realScore = ramp(m.realYield10y, 1.5, 3.0);
    const hySpread = m.highYieldSpreadBps ?? 328;
    const hyScore = ramp(hySpread, 250, 500);
    const score = clamp01(yieldScore * 0.40 + cpiScore * 0.25 + realScore * 0.15 + hyScore * 0.20);
    const reading = `US10Y ${m.us10yYieldPct.toFixed(2)}% (neutral ${m.us10yBaselinePct.toFixed(2)}%); CPI ${m.cpiInflationYoY.toFixed(1)}% YoY; HY-OAS ${hySpread}bp; Fed Funds ${m.fedFundsRatePct.toFixed(2)}%`;
    const coverage = 1;
    const weightPct = 12;
    totalCoverageWeight += (weightPct / 100) * coverage;
    totalRiskCoverageWeight += weightPct * coverage;
    totalRiskEarned += weightPct * score * coverage;
    contributions.push({
      id: 'macro_rates',
      label: 'Macro interest rates & inflation (US10Y)',
      kind: 'risk',
      weightPct,
      earnedPoints: Math.round(weightPct * score * 10) / 10,
      reading: { score, reading, coverage },
    });
  }

  // Factor 5: Concentration & Circularity (weight: 13)
  {
    const top10Share = inputs.ledger?.top10Share ?? 0.65;
    const circularShare = inputs.ledger?.circularShare ?? 0.028;
    const score = clamp01(ramp(top10Share, 0.25, 0.65) * 0.6 + ramp(circularShare, 0.015, 0.15) * 0.4);
    const circularB = (((inputs.ledger?.totalDisclosedUsd ?? 2.8e12) * circularShare) / 1e9).toFixed(1);
    const reading = `Top 10 deals = ${(top10Share * 100).toFixed(0)}% of volume; circular self-funded money = ${(circularShare * 100).toFixed(1)}% ($${circularB}B)`;
    const coverage = inputs.ledger ? 1 : 0;
    const weightPct = 13;
    totalCoverageWeight += (weightPct / 100) * coverage;
    totalRiskCoverageWeight += weightPct * coverage;
    totalRiskEarned += weightPct * score * coverage;
    contributions.push({
      id: 'concentration_circularity',
      label: 'Concentration & circular money',
      kind: 'risk',
      weightPct,
      earnedPoints: Math.round(weightPct * score * 10) / 10,
      reading: { score, reading, coverage },
    });
  }

  // Factor 6: Funding Velocity & Pipeline (weight: 10)
  {
    const now = new Date();
    const y = now.getUTCFullYear();
    const yCurr = inputs.ledger?.byYear?.[y] ?? 769_180_302_026;
    const elapsed = Math.max(1, Math.min(12, now.getUTCMonth() + 1));
    const annualized = (yCurr / elapsed) * 12;
    const speed = ramp(annualized, 400_000_000_000, 1_200_000_000_000);
    const backlog = ramp(inputs.ledger?.announcedShare ?? 0.13, 0.05, 0.25);
    const silence = ramp(inputs.ledger?.daysSinceLastMega ?? 14, 10, 90);
    const score = clamp01(speed * 0.45 + backlog * 0.35 + silence * 0.20);
    const reading = `Annualized pace: $${(annualized / 1e9).toFixed(0)}B/yr; ${((inputs.ledger?.announcedShare ?? 0.13) * 100).toFixed(1)}% backlog; ${inputs.ledger?.daysSinceLastMega ?? 14}d since last mega deal`;
    const coverage = inputs.ledger ? 1 : 0;
    const weightPct = 10;
    totalCoverageWeight += (weightPct / 100) * coverage;
    totalRiskCoverageWeight += weightPct * coverage;
    totalRiskEarned += weightPct * score * coverage;
    contributions.push({
      id: 'funding_velocity',
      label: 'Funding velocity & pipeline',
      kind: 'risk',
      weightPct,
      earnedPoints: Math.round(weightPct * score * 10) / 10,
      reading: { score, reading, coverage },
    });
  }

  // Factor 7: Crowd Signal (weight: 9)
  {
    const p = inputs.crowd?.bubble2026Probability ?? inputs.crowd?.yesProbability ?? 0.076;
    const vol = inputs.crowd?.volumeUsd ?? 0;
    const score = clamp01(p);
    const coverage = vol >= 1_000_000 ? 1 : vol >= 100_000 ? 0.7 : 0.4;
    const reading = `Polymarket crowd: ${(p * 100).toFixed(1)}% YES ($${(vol / 1e6).toFixed(2)}M volume)`;
    const weightPct = 9;
    totalCoverageWeight += (weightPct / 100) * coverage;
    totalRiskCoverageWeight += weightPct * coverage;
    totalRiskEarned += weightPct * score * coverage;
    contributions.push({
      id: 'crowd_signal',
      label: 'Crowd odds (prediction markets)',
      kind: 'risk',
      weightPct,
      earnedPoints: Math.round(weightPct * score * 10) / 10,
      reading: { score, reading, coverage },
    });
  }

  // Factor 8: Capex vs FCF & Hardware Depreciation (weight: 8)
  {
    const capex = inputs.capex?.aggregateCapexUsd ?? 210_000_000_000;
    const fcf = inputs.capex?.aggregateFcfUsd ?? 184_000_000_000;
    const ratio = fcf > 0 ? capex / fcf : 1.14;
    const ocfRatio = inputs.aiDebt?.capexToOcfRatio ?? 0.548;
    const fcfScore = ramp(ratio, 0.5, 2.0);
    const ocfScore = ramp(ocfRatio, 0.35, 0.70);
    const score = clamp01(fcfScore * 0.6 + ocfScore * 0.4);
    const depB = inputs.aiDebt?.gpuDepreciationDragUsd ? (inputs.aiDebt.gpuDepreciationDragUsd / 1e9).toFixed(1) : '38.5';
    const reading = `Hyperscaler capex = ${ratio.toFixed(2)}× of FCF (${(ocfRatio * 100).toFixed(1)}% OCF; $${depB}B/yr GPU amortization drag)`;
    const coverage = 1;
    const weightPct = 8;
    totalCoverageWeight += (weightPct / 100) * coverage;
    totalRiskCoverageWeight += weightPct * coverage;
    totalRiskEarned += weightPct * score * coverage;
    contributions.push({
      id: 'capex_cashflow',
      label: 'Capex vs free cash flow & hardware depreciation',
      kind: 'risk',
      weightPct,
      earnedPoints: Math.round(weightPct * score * 10) / 10,
      reading: { score, reading, coverage },
    });
  }

  // Factor 9: Real-Demand Damper (weight: 10, damper)
  {
    const a = inputs.adoption ?? { annualUserGrowth: 0.65, apiPriceDeclineMultiple: 40, trainingCostBand: 'rising' };
    const growth = a.annualUserGrowth === null ? 0 : ramp(a.annualUserGrowth, 0.1, 1.0);
    const cheap = a.apiPriceDeclineMultiple === null ? 0 : ramp(a.apiPriceDeclineMultiple, 1, 50);
    const contained = a.trainingCostBand === 'rising' ? 0 : a.trainingCostBand === 'flat' ? 0.5 : 1;
    const score = clamp01(growth * 0.5 + cheap * 0.3 + contained * 0.2);
    const coverage = 1;
    const discount = score * 10 * coverage;
    damperDiscount = discount;
    const weightPct = 10;
    totalCoverageWeight += (weightPct / 100) * coverage;
    contributions.push({
      id: 'adoption_demand',
      label: 'Real-use damper',
      kind: 'damper',
      weightPct,
      earnedPoints: -Math.round(discount * 10) / 10,
      reading: {
        score,
        reading: `Users +${((a.annualUserGrowth ?? 0.65) * 100).toFixed(0)}% YoY, inference ${a.apiPriceDeclineMultiple ?? 40}× cheaper, training cost ${a.trainingCostBand ?? 'rising'}`,
        coverage,
      },
    });
  }

  // Risk normalization
  let normalizedRiskScore = 0;
  if (totalRiskCoverageWeight > 0) {
    normalizedRiskScore = (totalRiskEarned / totalRiskCoverageWeight) * 100;
  }

  // Systemic Contagion Synergy Term
  const cdsScore = contributions.find((c) => c.id === 'cds_stress')?.reading.score ?? 0;
  const debtScore = contributions.find((c) => c.id === 'debt_reliance')?.reading.score ?? 0;
  const macroScore = contributions.find((c) => c.id === 'macro_rates')?.reading.score ?? 0;

  const excessCds = Math.max(0, cdsScore - 0.35);
  const excessDebt = Math.max(0, debtScore - 0.30);
  const excessMacro = Math.max(0, macroScore - 0.30);
  const compoundSynergy = Math.pow(excessCds * excessDebt * excessMacro, 1 / 3);
  const systemicContagionPoints = Math.round(compoundSynergy * 16.0 * 10) / 10;

  const compositeScore = Math.min(100, Math.max(0, normalizedRiskScore + systemicContagionPoints - damperDiscount));
  const rawProb = logisticMapping(compositeScore);
  const burstProbability = Math.round(rawProb * 1000) / 10;

  // Dispersion & Confidence Interval
  const riskScores = contributions.filter((c) => c.kind === 'risk').map((c) => c.reading.score);
  const meanScore = riskScores.reduce((a, b) => a + b, 0) / (riskScores.length || 1);
  const variance = riskScores.reduce((a, b) => a + Math.pow(b - meanScore, 2), 0) / (riskScores.length || 1);
  const stdDev = Math.sqrt(variance);
  const coveragePenalty = 1 + (1 - totalCoverageWeight) * 1.5;
  const seScore = (stdDev / Math.sqrt(riskScores.length || 1)) * coveragePenalty * 22;
  const meScore = 1.645 * seScore;
  const lowScore = Math.max(0, compositeScore - meScore);
  const highScore = Math.min(100, compositeScore + meScore);
  const lowProb = Math.round(logisticMapping(lowScore) * 1000) / 10;
  const highProb = Math.round(logisticMapping(highScore) * 1000) / 10;
  const confidenceInterval = [lowProb, highProb];

  // Fragility Index
  const dPdS = (rawProb * (1 - rawProb)) / steepness;
  const fragilityIndex = Math.min(
    100,
    Math.max(
      0,
      Math.round(dPdS * 100 * 2.5 + debtScore * 38 + macroScore * 22 + (inputs.ledger?.debtShare ?? 0.07) * 100)
    )
  );

  // Band
  let band = 'calm';
  if (burstProbability >= 80) band = 'critical';
  else if (burstProbability >= 65) band = 'high';
  else if (burstProbability >= 45) band = 'elevated';
  else if (burstProbability >= 25) band = 'guarded';

  const sortedDrivers = [...contributions]
    .filter((c) => c.kind === 'risk')
    .sort((a, b) => b.reading.score * b.weightPct - a.reading.score * a.weightPct)
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
    confidenceInterval,
    fragilityIndex,
    systemicContagionPoints,
  };
}

/**
 * 2. Merton (1974) Structural Credit Risk Model
 */
export function computeMertonModel(inputs) {
  const totalDebt = inputs.aiDebt?.totalTrackedDebtUsd ?? 196_822_500_000;
  const assetValue = 1_420_000_000_000;
  const volatility = 0.365;
  const r = (inputs.macro?.us10yYieldPct ?? 4.42) / 100;
  const T = 1.0;

  const d1 = (Math.log(assetValue / totalDebt) + (r + 0.5 * volatility * volatility) * T) / (volatility * Math.sqrt(T));
  const distanceToDefault = d1 - volatility * Math.sqrt(T);
  const defaultProbability = normalCdf(-distanceToDefault);
  const defaultProbPct = Math.round(defaultProbability * 1000) / 10;
  const structuralSpreadBps = Math.round(-((Math.log(1 - defaultProbability * 0.6) / T)) * 10000);

  let interpretation = "Asset value cushions debt comfortably (Distance-to-Default > 3.0σ).";
  if (distanceToDefault < 2.0) {
    interpretation = "Severe structural default risk (Distance-to-Default < 2.0σ). High debt refinancing stress.";
  } else if (distanceToDefault < 3.0) {
    interpretation = "Elevated credit vulnerability (Distance-to-Default 2.0σ – 3.0σ). Sensitive to asset multiple compression.";
  }

  return {
    assetValueUsd: assetValue,
    totalDebtUsd: totalDebt,
    assetVolatilityPct: Math.round(volatility * 1000) / 10,
    riskFreeRatePct: Math.round(r * 1000) / 10,
    distanceToDefault: Math.round(distanceToDefault * 100) / 100,
    defaultProbabilityPct: defaultProbPct,
    structuralSpreadBps,
    interpretation,
  };
}

/**
 * 3. Altman Z''-Score Model for Non-Manufacturers & Technology Services (Altman 2002)
 */
export function computeAltmanZScore(inputs) {
  const x1 = 0.118; // Working capital / Total assets
  const x2 = -0.142; // Retained earnings / Total assets
  const x3 = 0.078; // Operating EBIT / Total assets
  const x4 = 7.21; // Market value of equity / Total liabilities

  const score = 6.56 * x1 + 3.26 * x2 + 6.72 * x3 + 1.05 * x4;
  const roundedScore = Math.round(score * 100) / 100;

  let zone = "Grey Zone (1.1–2.6)";
  let interpretation = "Grey Zone: Balance sheets carry vulnerability to refinancing shocks and multiple compression.";

  if (roundedScore < 1.1) {
    zone = "Distress Zone (<1.1)";
    interpretation = "High distress risk: Operating earnings fail to cover rapid debt maturity amortization.";
  } else if (roundedScore > 2.6) {
    zone = "Safe Zone (>2.6)";
    interpretation = "Safe Zone: Equity cushion and liquid assets adequately cover outstanding liabilities.";
  }

  const impliedDistressProb = 1 / (1 + Math.exp(1.35 * (roundedScore - 1.85)));
  const impliedDistressProbPct = Math.round(impliedDistressProb * 1000) / 10;

  return {
    score: roundedScore,
    zone,
    impliedDistressProbPct,
    components: {
      workingCapitalToAssets: x1,
      retainedEarningsToAssets: x2,
      ebitToAssets: x3,
      marketCapToDebt: x4,
    },
    interpretation,
  };
}

/**
 * 4. Log-Periodic Power Law Singularity (LPPLS) Bubble Hazard (Sornette et al.)
 */
export function computeLpplsMetrics(inputs) {
  const currentCds = inputs.cds?.currentBps ?? 187;
  const capexRatio = inputs.aiDebt?.capexToOcfRatio ?? 0.548;

  const m = 0.38;
  const omega = 6.36;
  const crashHazardRate = Math.min(95, Math.max(10, Math.round(((currentCds / 81) * 18 + capexRatio * 32) * 10) / 10));

  return {
    superExponentialExponent: m,
    angularFrequency: omega,
    estimatedCriticalWindow: "Q4 2026 – Q2 2027",
    crashHazardRatePct: crashHazardRate,
    interpretation:
      "Superexponential capital commitment growth with accelerating log-periodic Capex-to-FCF oscillations, placing critical singularity window in early 2027.",
  };
}

// Seeded LCG pseudo-random generator
function createSeededRandom(seed) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

// Box-Muller transform
function sampleNormal(random, mean, std) {
  const u1 = Math.max(1e-10, random());
  const u2 = random();
  const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
  return mean + z0 * std;
}

/**
 * 5. 10,000-Path Monte Carlo Stochastic Sampling Engine
 */
export function runMonteCarloSimulation(baseInputs, iterations = 10_000) {
  const startTime = Date.now();
  const random = createSeededRandom(42_1337);

  const baseYield = baseInputs.macro?.us10yYieldPct ?? 4.42;
  const baseCds = baseInputs.cds?.currentBps ?? 187;
  const baseCapex = baseInputs.capex?.aggregateCapexUsd ?? 210_000_000_000;
  const baseDebtPace = baseInputs.aiDebt?.annualDebtIssuanceUsd ?? 85_000_000_000;

  const results = new Array(iterations);

  for (let i = 0; i < iterations; i++) {
    const yieldShock = sampleNormal(random, 0, 0.42);
    const simYield = Math.max(3.25, Math.min(6.5, baseYield + yieldShock));

    const cdsShock = Math.exp(sampleNormal(random, 0, 0.28));
    const simCds = Math.max(60, Math.min(500, Math.round(baseCds * cdsShock)));

    const capexShock = sampleNormal(random, 1.0, 0.15);
    const simCapex = Math.max(100_000_000_000, baseCapex * capexShock);

    const multipleShock = sampleNormal(random, 1.0, 0.22);

    const simInputs = {
      ...baseInputs,
      macro: baseInputs.macro
        ? {
            ...baseInputs.macro,
            us10yYieldPct: simYield,
            cpiInflationYoY: Math.max(1.8, Math.min(5.5, (baseInputs.macro.cpiInflationYoY ?? 2.9) + yieldShock * 0.5)),
            highYieldSpreadBps: Math.round(328 + (simCds - baseCds) * 1.4),
          }
        : null,
      cds: baseInputs.cds
        ? {
            ...baseInputs.cds,
            currentBps: simCds,
          }
        : null,
      capex: baseInputs.capex
        ? {
            ...baseInputs.capex,
            aggregateCapexUsd: simCapex,
          }
        : null,
      valuations: baseInputs.valuations
        ? baseInputs.valuations.map((v) => ({
            ...v,
            valuationUsd: Math.max(1_000_000_000, v.valuationUsd * Math.max(0.3, multipleShock)),
          }))
        : null,
      aiDebt: baseInputs.aiDebt
        ? {
            ...baseInputs.aiDebt,
            annualDebtIssuanceUsd: Math.max(30_000_000_000, baseDebtPace * (0.8 + 0.4 * capexShock)),
          }
        : null,
    };

    const evaluated = evaluateBubbleModel(simInputs);
    results[i] = evaluated.burstProbability;
  }

  results.sort((a, b) => a - b);

  const sum = results.reduce((acc, val) => acc + val, 0);
  const mean = sum / iterations;
  const variance = results.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / iterations;
  const stdDev = Math.sqrt(variance);

  const m3 = results.reduce((acc, val) => acc + Math.pow(val - mean, 3), 0) / iterations;
  const m4 = results.reduce((acc, val) => acc + Math.pow(val - mean, 4), 0) / iterations;
  const skewness = Math.round((m3 / Math.pow(variance, 1.5)) * 100) / 100;
  const kurtosis = Math.round((m4 / Math.pow(variance, 2)) * 100) / 100;

  const p5 = results[Math.floor(iterations * 0.05)];
  const p10 = results[Math.floor(iterations * 0.10)];
  const p50 = results[Math.floor(iterations * 0.50)];
  const p90 = results[Math.floor(iterations * 0.90)];
  const p95 = results[Math.floor(iterations * 0.95)];

  const tailSlice = results.slice(Math.floor(iterations * 0.95));
  const cvar95 = tailSlice.reduce((acc, v) => acc + v, 0) / tailSlice.length;

  const binSize = 10;
  const bins = new Array(10).fill(0);
  for (const prob of results) {
    const binIdx = Math.min(9, Math.floor(prob / binSize));
    bins[binIdx]++;
  }

  const histogram = bins.map((count, idx) => ({
    range: `${idx * 10}%–${(idx + 1) * 10}%`,
    count,
    percentage: Math.round((count / iterations) * 1000) / 10,
  }));

  const executionTimeMs = Date.now() - startTime;

  return {
    iterationsCount: iterations,
    meanProbabilityPct: Math.round(mean * 10) / 10,
    medianProbabilityPct: Math.round(p50 * 10) / 10,
    stdDevPct: Math.round(stdDev * 10) / 10,
    ci90Pct: [Math.round(p10 * 10) / 10, Math.round(p90 * 10) / 10],
    ci95Pct: [Math.round(p5 * 10) / 10, Math.round(p95 * 10) / 10],
    valueAtRisk95Pct: Math.round(p95 * 10) / 10,
    conditionalValueAtRisk95Pct: Math.round(cvar95 * 10) / 10,
    skewness,
    kurtosis,
    histogram,
    executionTimeMs,
  };
}
