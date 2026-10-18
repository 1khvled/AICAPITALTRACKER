import { NextResponse } from "next/server";
import { evaluateBubbleModel, DEFAULT_MODEL_INPUTS } from "@/lib/model/engine";
import { MODEL_CALIBRATION, MODEL_FACTORS } from "@/lib/model/factors";

export const dynamic = "force-static";

export async function GET() {
  const result = evaluateBubbleModel(DEFAULT_MODEL_INPUTS);

  const psValues = (DEFAULT_MODEL_INPUTS.valuations || [])
    .filter((v) => v.runRateRevenueUsd !== null && (v.runRateRevenueUsd as number) >= 100_000_000)
    .map((v) => v.valuationUsd / (v.runRateRevenueUsd as number))
    .sort((a, b) => a - b);
  const mid = Math.floor(psValues.length / 2);
  const medianPs =
    psValues.length === 0
      ? 34.8
      : psValues.length % 2 !== 0
      ? psValues[mid]
      : (psValues[mid - 1] + psValues[mid]) / 2;

  return NextResponse.json(
    {
      success: true,
      data: {
        timestamp: new Date().toISOString(),
        model_version: "2.5.0",
        horizon_months: 12,
        burst_probability_pct: Math.round(result.burstProbability * 10) / 10,
        composite_score: Math.round(result.compositeScore * 10) / 10,
        risk_band: result.band,
        data_coverage_pct: Math.round(result.coverage * 100),
        confidence_interval_90pct: result.confidenceInterval,
        financial_fragility_index: result.fragilityIndex,
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
          total_tracked_debt_usd: DEFAULT_MODEL_INPUTS.aiDebt?.totalTrackedDebtUsd ?? 196_822_500_000,
          annual_debt_issuance_usd: DEFAULT_MODEL_INPUTS.aiDebt?.annualDebtIssuanceUsd ?? 85_000_000_000,
          us10y_treasury_yield_pct: DEFAULT_MODEL_INPUTS.macro?.us10yYieldPct ?? 5.10,
          cpi_inflation_yoy_pct: DEFAULT_MODEL_INPUTS.macro?.cpiInflationYoY ?? 2.9,
          fed_funds_rate_pct: DEFAULT_MODEL_INPUTS.macro?.fedFundsRatePct ?? 4.75,
          rate_hike_risk_bps: DEFAULT_MODEL_INPUTS.macro?.rateHikeRiskBps ?? 25,
          high_yield_spread_bps: DEFAULT_MODEL_INPUTS.macro?.highYieldSpreadBps ?? 336,
          capex_to_ocf_ratio_pct: Math.round((DEFAULT_MODEL_INPUTS.aiDebt?.capexToOcfRatio ?? 0.548) * 1000) / 10,
          gpu_depreciation_drag_usd: DEFAULT_MODEL_INPUTS.aiDebt?.gpuDepreciationDragUsd ?? 38_500_000_000,
          capex_to_fcf_ratio:
            DEFAULT_MODEL_INPUTS.capex?.aggregateCapexUsd && DEFAULT_MODEL_INPUTS.capex?.aggregateFcfUsd
              ? Math.round((DEFAULT_MODEL_INPUTS.capex.aggregateCapexUsd / DEFAULT_MODEL_INPUTS.capex.aggregateFcfUsd) * 100) / 100
              : 1.14,
          token_price_decline_multiple: DEFAULT_MODEL_INPUTS.adoption?.apiPriceDeclineMultiple,
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
