import { NextResponse } from "next/server";
import { evaluateBubbleModel, DEFAULT_MODEL_INPUTS } from "@/lib/model/engine";
import { MODEL_CALIBRATION, MODEL_FACTORS, MODEL_VERSION, SUM_RISK_WEIGHT_PCT, DAMPER_WEIGHT_PCT } from "@/lib/model/factors";
import latestModel from "@/data/latest-model.json";

export const dynamic = "force-static";

export async function GET() {
  const result = evaluateBubbleModel(DEFAULT_MODEL_INPUTS);

  const psValues = (DEFAULT_MODEL_INPUTS.valuations || [])
    .filter((v) => v.runRateRevenueUsd !== null && (v.runRateRevenueUsd as number) >= 100_000_000)
    .map((v) => v.valuationUsd / (v.runRateRevenueUsd as number))
    .sort((a, b) => a - b);
  const mid = Math.floor(psValues.length / 2);
  // 2026-10-19 fact-check: the empty-input fallback was the stale 34.8× median.
  // The live median across the tracked frontier labs is 29.4× (OpenAI 1.2T/50B,
  // Anthropic 2.0T/65B, Databricks 190B/7B, xAI 250B/3.2B, Mistral 24B/0.45B,
  // Scale 29B/1.1B, Cohere 7B/0.25B, Perplexity 20B/0.5B).
  const medianPs =
    psValues.length === 0
      ? 29.4
      : psValues.length % 2 !== 0
      ? psValues[mid]
      : (psValues[mid - 1] + psValues[mid]) / 2;

  /**
   * 2026-10-19 (model v2.6.0): the published ranges are the Monte-Carlo
   * input-sensitivity quantiles, NOT a probability interval. The hand-rolled
   * factor-dispersion band (the old 90%-confidence-interval field) was
   * deleted — see src/lib/model/types.ts. The range block mirrors the field
   * names published in src/data/latest-model.json so the two can be diffed.
   */
  const inputSensitivityRange = {
    ci_type: latestModel.monteCarlo.ciType,
    ci90_pct: latestModel.monteCarlo.ci90Pct,
    ci95_pct: latestModel.monteCarlo.ci95Pct,
    band_low_pct: latestModel.monteCarlo.bandLowPct,
    iterations: latestModel.monteCarlo.iterationsCount,
    source: "25,000-path Monte Carlo input-sensitivity quantiles (src/data/latest-model.json)",
  };

  return NextResponse.json(
    {
      success: true,
      data: {
        // force-static route: label the response with the PUBLISHED snapshot time, not
  // the raw build clock, so the API agrees with every page's "as of" stamp
  // (security audit 10.3).
  timestamp: latestModel.timestamp,
        // 2026-10-19 (v2.6.0): the version comes from the published changelog /
        // MODEL_VERSION constant — never a hand-typed literal that can go stale.
        model_version: MODEL_VERSION,
        modelVersion: MODEL_VERSION,
        horizon_months: 12,
        burst_probability_pct: Math.round(result.burstProbability * 10) / 10,
        composite_score: Math.round(result.compositeScore * 10) / 10,
        risk_band: result.band,
        // Risk-only coverage: the 8 risk factors' weighted coverage, capped at 1.
        data_coverage_pct: Math.round(result.coverage * 100),
        coverage_label: `risk-factor coverage (${SUM_RISK_WEIGHT_PCT} risk points across ${MODEL_FACTORS.filter((f) => f.kind === "risk").length} risk factors); the real-use damper (max −${DAMPER_WEIGHT_PCT} pts) is reported separately and is not part of the risk scale`,
        damper_coverage_pct: Math.round(result.damperCoverage * 100),
        // The old 90%-confidence-interval field is gone (deleted in v2.6.0).
        ci_type: latestModel.monteCarlo.ciType,
        input_sensitivity_range: inputSensitivityRange,
        financial_fragility_index: result.fragilityIndex,
        financial_fragility_index_basis: result.fragilityIndexBasis,
        systemic_contagion_points: result.systemicContagionPoints,
        top_driver_ids: result.topDriverIds,
        calibration: {
          anchor_score: MODEL_CALIBRATION.anchorScore,
          logistic_steepness: MODEL_CALIBRATION.steepness,
          formula: "P(burst) = 1 / (1 + exp(-(Score - 55) / 9))",
        },
        contributions: result.contributions.map((c) => ({
          id: c.id,
          label: c.label,
          weight_pct: c.weightPct,
          kind: c.kind,
          raw_score: Math.round(c.reading.score * 1000) / 1000,
          earned_points: c.earnedPoints,
          coverage: c.reading.coverage,
        })),
        inputs_summary: {
          oracle_cds_5y_bps: DEFAULT_MODEL_INPUTS.cds?.currentBps,
          median_lab_ps_multiple: Math.round(medianPs * 10) / 10,
          debt_share_pct: Math.round((DEFAULT_MODEL_INPUTS.ledger?.debtShare || 0) * 1000) / 10,
          total_tracked_debt_usd: DEFAULT_MODEL_INPUTS.aiDebt?.totalTrackedDebtUsd ?? 214_890_400_000,
          annual_debt_issuance_usd: DEFAULT_MODEL_INPUTS.aiDebt?.annualDebtIssuanceUsd ?? 85_000_000_000,
          us10y_treasury_yield_pct: DEFAULT_MODEL_INPUTS.macro?.us10yYieldPct ?? 5.10,
          // 2026-10-19 fact-check: the 2.9% / 4.75% / 336bp literals were stale.
          // CPI 3.72% (FRED CPIAUCSL, Sep 2026 y/y), Fed funds 3.75% (FRED
          // FEDFUNDS, Sep 2026 monthly obs — 2026 cut cycle), HY OAS 323bp
          // (FRED BAMLH0A0HYM2, 15 Oct 2026).
          cpi_inflation_yoy_pct: DEFAULT_MODEL_INPUTS.macro?.cpiInflationYoY ?? 3.72,
          fed_funds_rate_pct: DEFAULT_MODEL_INPUTS.macro?.fedFundsRatePct ?? 3.75,
          rate_hike_risk_bps: DEFAULT_MODEL_INPUTS.macro?.rateHikeRiskBps ?? 25,
          high_yield_spread_bps: DEFAULT_MODEL_INPUTS.macro?.highYieldSpreadBps ?? 323,
          capex_to_ocf_ratio_pct: Math.round((DEFAULT_MODEL_INPUTS.aiDebt?.capexToOcfRatio ?? 0.548) * 1000) / 10,
          gpu_depreciation_drag_usd: DEFAULT_MODEL_INPUTS.aiDebt?.gpuDepreciationDragUsd ?? 38_500_000_000,
          capex_to_fcf_ratio:
            DEFAULT_MODEL_INPUTS.capex?.aggregateCapexUsd && DEFAULT_MODEL_INPUTS.capex?.aggregateFcfUsd
              ? Math.round((DEFAULT_MODEL_INPUTS.capex.aggregateCapexUsd / DEFAULT_MODEL_INPUTS.capex.aggregateFcfUsd) * 100) / 100
              : 2.79, // $725B guided CY2026 capex / $260B trailing-FY FCF
          // The model input is the live aggregator's reading, which swings with the
          // intraday DeepSeek V4.1 Flash input rate ($0.0344–$0.0448 per 1M).
          // 2026-10-19 pin: 670× input-basis (GPT-4 $30/1M → $0.0448/1M) is the
          // canonical published multiple — the drifted multiple is never published.
          token_price_decline_multiple: DEFAULT_MODEL_INPUTS.adoption?.apiPriceDeclineMultiple,
          token_price_decline_multiple_pinned: 670,
          polymarket_yes_probability: DEFAULT_MODEL_INPUTS.crowd?.yesProbability,
        },
      },
    },
    {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=7200",
      },
    }
  );
}
