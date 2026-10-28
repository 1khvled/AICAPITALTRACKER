import { evaluateBubbleModel } from "@/lib/model/engine";
import { PUBLISHED_RAMP_CONSTANTS } from "@/lib/model/factors";
import type { BubbleModelInputs, BubbleModelResult } from "@/lib/model/types";

/**
 * "What would flip the answer" — priced.
 *
 * The homepage's third section is the most credible thing the site publishes:
 * the list of readings that would move the number. It was, however, static
 * prose: it told a reader WHAT to watch but not what it was worth.
 *
 * Every row here is priced by re-running the PUBLISHED model with one shocked
 * input and reading the new print off the result. Nothing is estimated, and no
 * effect is typed: the "if credit widened 50bp, the print would be X" line is
 * the model's own output.
 *
 * The thresholds come from the factors' published ramp constants, so "the
 * factor stops responding at 486bp" is the model's own boundary rather than a
 * second copy of it.
 */

export interface FlipWatch {
  id: string;
  /** The reading, in the site's voice. */
  label: string;
  /** Where the reading stands today. */
  value: string;
  /** The move that was priced. */
  shock: string;
  /** What that move would do to the print. */
  effect: string;
  /** The signed point move, used for ordering and the magnitude chip. */
  delta: number;
  /** The boundary beyond which this factor stops responding. */
  threshold: string;
  /** Which way the shock moves the print. */
  direction: "up" | "down";
  /** One line on what the reading means. */
  note: string;
}

interface Scenario {
  id: string;
  label: string;
  value: string;
  shock: string;
  threshold: string;
  note: string;
  /** The shocked input set, or null when the input is not available. */
  shocked: (inputs: BubbleModelInputs) => BubbleModelInputs | null;
  /** The shock moves the print up (risk) or down (relief). */
  direction: "up" | "down";
}

const round1 = (n: number) => Math.round(n * 10) / 10;

/** Run the model on a shocked input set and price the move. */
function price(
  inputs: BubbleModelInputs,
  result: BubbleModelResult,
  shocked: BubbleModelInputs | null,
): { effect: string; delta: number } | null {
  if (!shocked) return null;
  const next = evaluateBubbleModel(shocked, { skipSubModels: true });
  const delta = round1(next.burstProbability - result.burstProbability);
  const sign = delta > 0 ? "+" : delta < 0 ? "−" : "";
  return {
    effect: `the print would be ${next.burstProbability.toFixed(1)}% (${sign}${Math.abs(delta).toFixed(1)} pts)`,
    delta,
  };
}

export function flipWatches(
  inputs: BubbleModelInputs,
  result: BubbleModelResult,
): FlipWatch[] {
  const scenarios: Scenario[] = [];

  if (inputs.cds) {
    const cds = inputs.cds;
    scenarios.push({
      id: "cds",
      label: "Credit insurance price (Oracle 5-year CDS)",
      value: `${cds.currentBps}bp vs ${cds.baselineBps}bp baseline, ${cds.priorBps}bp 90 days ago`,
      shock: "50bp wider",
      threshold: `the convex tail starts above ${Math.round(PUBLISHED_RAMP_CONSTANTS.cdsTailOriginRatio * cds.baselineBps)}bp, and the factor stops responding at ${Math.round(PUBLISHED_RAMP_CONSTANTS.cdsLevelCeilingRatio * cds.baselineBps)}bp`,
      note: "CDS is an insurance price on debt. Another wide leg here raises the score quickly.",
      direction: "up",
      shocked: (i) =>
        i.cds
          ? { ...i, cds: { ...i.cds, currentBps: i.cds.currentBps + 50 } }
          : null,
    });
  }

  if (inputs.macro) {
    const hy = inputs.macro.highYieldSpreadBps;
    scenarios.push({
      id: "hy",
      label: "High-yield credit spreads (HY-OAS)",
      value: `${hy}bp`,
      shock: "50bp wider",
      threshold: `the panic tail starts above ${PUBLISHED_RAMP_CONSTANTS.macroHyTailOriginBps}bp`,
      note: "Loan pricing for riskier borrowers. It is where a credit freeze shows up before equities.",
      direction: "up",
      shocked: (i) =>
        i.macro && typeof i.macro.highYieldSpreadBps === "number"
          ? { ...i, macro: { ...i.macro, highYieldSpreadBps: i.macro.highYieldSpreadBps + 50 } }
          : null,
    });

    const us10y = inputs.macro.us10yYieldPct;
    scenarios.push({
      id: "us10y",
      label: "The discount rate (US 10-year)",
      value: `${us10y.toFixed(2)}%`,
      shock: "50bp higher",
      threshold: `the macro ramp saturates at ${PUBLISHED_RAMP_CONSTANTS.macroUs10yCeilingPct.toFixed(2)}%`,
      note: "A higher discount rate compresses every long-duration valuation at once.",
      direction: "up",
      shocked: (i) =>
        i.macro
          ? { ...i, macro: { ...i.macro, us10yYieldPct: i.macro.us10yYieldPct + 0.5 } }
          : null,
    });
  }

  const valuationFactor = result.contributions.find(
    (contribution) => contribution.id === "valuation_stretch",
  );
  if (valuationFactor) {
    scenarios.push({
      id: "valuations",
      label: "What investors pay per dollar of lab revenue",
      value: valuationFactor.reading.reading,
      shock: "revenue +20% at today's price",
      threshold: `the price/sales ramp saturates at ${PUBLISHED_RAMP_CONSTANTS.valuationPsCeiling}×`,
      note: "A down-round is the cleanest way to lower the score. A new print at today's price raises it.",
      direction: "down",
      shocked: (i) =>
        i.valuations
          ? {
              ...i,
              valuations: i.valuations.map((v) => ({
                ...v,
                runRateRevenueUsd:
                  typeof v.runRateRevenueUsd === "number"
                    ? v.runRateRevenueUsd * 1.2
                    : v.runRateRevenueUsd,
              })),
            }
          : null,
    });
  }

  if (inputs.capex?.aggregateCapexUsd && inputs.capex.aggregateFcfUsd) {
    const ratio = inputs.capex.aggregateCapexUsd / inputs.capex.aggregateFcfUsd;
    const ocf = inputs.aiDebt?.capexToOcfRatio;
    scenarios.push({
      id: "capex",
      label: "Building cost against money earned",
      value: `${ratio.toFixed(2)}× free cash flow${ocf ? ` · ${(ocf * 100).toFixed(1)}% of operating cash flow` : ""}`,
      shock: "20% less building",
      threshold: `the capex/FCF ramp saturates at ${PUBLISHED_RAMP_CONSTANTS.capexFcfCeiling.toFixed(1)}×`,
      note: "Cuts in building lower the score. Building faster than sales raises it.",
      direction: "down",
      shocked: (i) =>
        i.capex?.aggregateCapexUsd
          ? { ...i, capex: { ...i.capex, aggregateCapexUsd: i.capex.aggregateCapexUsd * 0.8 } }
          : null,
    });
  }

  if (inputs.ledger) {
    scenarios.push({
      id: "debt",
      label: "How much of the tracked money is borrowed",
      value: `${(inputs.ledger.debtShare * 100).toFixed(1)}% of disclosed capital is debt`,
      shock: "2 points more debt",
      threshold: `the debt-share ramp saturates at ${(PUBLISHED_RAMP_CONSTANTS.debtShareCeiling * 100).toFixed(0)}%`,
      note: "Borrowed money has to be repaid. Paper has not.",
      direction: "up",
      shocked: (i) =>
        i.ledger
          ? { ...i, ledger: { ...i.ledger, debtShare: i.ledger.debtShare + 0.02 } }
          : null,
    });
  }

  const crowdProbability = inputs.crowd?.bubble2026Probability ?? inputs.crowd?.yesProbability;
  if (typeof crowdProbability === "number") {
    const volume = inputs.crowd?.volumeUsd;
    scenarios.push({
      id: "crowd",
      label: "Betting odds on a 2026 AI downturn",
      value: `${(crowdProbability * 100).toFixed(1)}% YES${
        volume ? ` · $${(volume / 1e6).toFixed(2)}M traded across the tracked book` : ""
      }`,
      shock: "10 points more on the contract",
      threshold: "the crowd factor IS this price — there is no ramp to reach",
      note: "Crowd odds are a weak signal alone. They matter once they jump.",
      direction: "up",
      shocked: (i) =>
        i.crowd
          ? {
              ...i,
              crowd: {
                ...i.crowd,
                bubble2026Probability: Math.min(1, (i.crowd.bubble2026Probability ?? 0) + 0.1),
                yesProbability: Math.min(1, (i.crowd.yesProbability ?? 0) + 0.1),
              },
            }
          : null,
    });
  }

  const watches: FlipWatch[] = [];
  for (const scenario of scenarios) {
    const priced = price(inputs, result, scenario.shocked(inputs));
    if (!priced) continue;
    // A move that does nothing is information, not a bug: say why.
    const inert = Math.abs(priced.delta) < 0.05;
    watches.push({
      id: scenario.id,
      label: scenario.label,
      value: scenario.value,
      shock: scenario.shock,
      effect: priced.effect,
      delta: priced.delta,
      threshold: scenario.threshold,
      direction: priced.delta >= 0 ? "up" : "down",
      note: inert
        ? `${scenario.note} This one does not move the print: that reading is already past the factor's published ceiling, so it has stopped responding.`
        : scenario.note,
    });
  }

  // Biggest lever first: the reading that moves the print most.
  watches.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));

  return watches;
}
