import React from "react";
import type { Metadata } from "next";
import { YourCall } from "@/components/YourCall";
import { evaluateBubbleModel, DEFAULT_MODEL_INPUTS } from "@/lib/model/engine";
import { BAND_LABEL } from "@/components/home/copy";
import { POLYMARKET_FEATURED_MARKETS } from "@/data/polymarket-data";
import latestModel from "@/data/latest-model.json";
import liveInputs from "@/data/live-inputs.json";
import trajectoryHistory from "@/data/trajectory-history.json";
import type { ObservedPrint } from "@/lib/predictions";

/**
 * /your-call — the reader's own 12-month burst probability, kept next to the
 * model's and the market's.
 *
 * A server component shell. It computes the same model print every other
 * surface on the site computes (the same call, the same inputs, the same
 * output) and hands it to the client component, which owns the local
 * storage. Nothing is sent anywhere: the calls never leave the reader's
 * browser.
 */

export const metadata: Metadata = {
  title: "Your call — put your own 12-month number on the record",
  description:
    "Record your own 12-month AI bubble burst probability, keep it next to the model's print and the prediction-market price, and see how close you tracked the model once the window closes. Stored on your own device — no account, no leaderboard.",
  alternates: {
    canonical: "/your-call",
  },
  openGraph: {
    title: "Your call — put your own 12-month number on the record",
    description:
      "Your own 12-month AI bubble burst probability, next to the model's print and the prediction-market price. On your device, on your own record.",
    url: "/your-call",
    type: "website",
    // 2026-10-19: an explicit openGraph block suppresses the file-convention
    // image cascade (root opengraph-image.png stops merging), so the card must
    // be named here.
    images: ["/opengraph-image.png"],
  },
};

interface TrajectoryRowLite {
  date?: string;
  probability?: number;
  /** 'observed' = the row came from a real pipeline run. */
  modelRun?: string;
}

const TRAJECTORY_ROWS = (Array.isArray(trajectoryHistory)
  ? trajectoryHistory
  : []) as unknown as TrajectoryRowLite[];

/**
 * The resolution source: the model's own OBSERVED trajectory prints. A seeded
 * row is not a print, so it can never close a call.
 */
const OBSERVED_ROWS: ObservedPrint[] = TRAJECTORY_ROWS.filter(
  (row) =>
    row &&
    typeof row.date === "string" &&
    typeof row.probability === "number" &&
    row.modelRun === "observed"
)
  .map((row) => ({ date: row.date as string, probability: row.probability as number }))
  .sort((a, b) => a.date.localeCompare(b.date));

export default function YourCallPage() {
  // Same call, same inputs, same output as every other surface on the site.
  const model = evaluateBubbleModel(DEFAULT_MODEL_INPUTS);

  /** The date the published print belongs to (UTC). */
  const modelAsOf = (latestModel.timestamp ?? "").slice(0, 10) || OBSERVED_ROWS[OBSERVED_ROWS.length - 1]?.date || "";

  /**
   * The prediction-market price for the same question: the 12-month contract
   * ("AI bubble burst by June 30, 2027"), read from the live crowd sync.
   */
  const marketPct = (liveInputs.crowd.bubble2027Probability ?? 0) * 100;
  const marketContract = (
    POLYMARKET_FEATURED_MARKETS.find((m) => m.id === "poly-bubble-2027")?.title ??
    "AI bubble burst by June 30, 2027"
  ).replace(/\?+$/, "");
  const marketAsOf = (liveInputs.meta.last_synced_at ?? "").slice(0, 10) || modelAsOf;

  return (
    <div className="space-y-8">
      <header className="max-w-3xl">
        <div className="flex flex-wrap items-center gap-2">
          <span className="label">Your call</span>
          <span className="pill">12-month horizon</span>
        </div>

        <h1 className="mt-2 text-[30px] font-bold leading-[1.1] tracking-[-0.03em] text-ink sm:text-[40px]">
          What do you think the odds are?
        </h1>

        <p className="mt-3 text-[15px] leading-relaxed text-ink-muted sm:text-base">
          The model publishes one number: the chance the AI build-out breaks within 12 months. Put
          your own number on the same question and keep it. Every call is stored with the model
          print and the market price as they stood that day, so a year from now you can see whether
          you read it better than the model did.
        </p>

        <p className="mt-2 text-[15px] leading-relaxed text-ink-muted sm:text-base">
          There is no account, no leaderboard and nothing uploaded. A call is a record of your
          estimate, not a forecast: it stays open until the model&apos;s own trajectory publishes a
          print 12 months after you made it, and only then is it scored.
        </p>
      </header>

      <YourCall
        modelPrintPct={model.burstProbability}
        modelBand={model.band}
        modelBandLabel={BAND_LABEL[model.band]}
        modelAsOf={modelAsOf}
        marketPct={marketPct}
        marketLabel={marketContract}
        marketAsOf={marketAsOf}
        observedRows={OBSERVED_ROWS}
      />
    </div>
  );
}
