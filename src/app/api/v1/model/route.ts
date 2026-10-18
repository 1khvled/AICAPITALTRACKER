import { NextResponse } from "next/server";
import { evaluateBubbleModel, DEFAULT_MODEL_INPUTS } from "@/lib/model/engine";
import { MODEL_CALIBRATION, MODEL_FACTORS } from "@/lib/model/factors";

export const dynamic = "force-static";

export async function GET() {
  const result = evaluateBubbleModel(DEFAULT_MODEL_INPUTS);

  return NextResponse.json(
    {
      success: true,
      data: {
        timestamp: new Date().toISOString(),
        model_version: "2.4.0",
        horizon_months: 12,
        burst_probability_pct: Math.round(result.burstProbability * 10) / 10,
        composite_score: Math.round(result.compositeScore * 10) / 10,
        risk_band: result.band,
        data_coverage_pct: Math.round(result.coverage * 100),
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
          median_lab_ps_multiple: 42.4,
          debt_share_pct: Math.round((DEFAULT_MODEL_INPUTS.ledger?.debtShare || 0) * 1000) / 10,
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
