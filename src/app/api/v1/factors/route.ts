import { NextResponse } from "next/server";
import { MODEL_FACTORS, MODEL_CALIBRATION } from "@/lib/model/factors";

export const dynamic = "force-static";

export async function GET() {
  return NextResponse.json(
    {
      success: true,
      calibration: {
        anchor_score: MODEL_CALIBRATION.anchorScore,
        steepness: MODEL_CALIBRATION.steepness,
        sigmoid_formula: "P(burst) = 1 / (1 + exp(-(Score - anchorScore) / steepness))",
      },
      factors: MODEL_FACTORS.map((f, idx) => ({
        index: idx + 1,
        id: f.id,
        label: f.label,
        kind: f.kind,
        weight_pct: f.weightPct,
        formula: f.formula,
        description: f.explain,
      })),
    },
    {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, s-maxage=86400",
      },
    }
  );
}
