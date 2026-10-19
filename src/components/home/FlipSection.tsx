import React from "react";
import type { BubbleModelInputs, BubbleModelResult } from "@/lib/model/types";

interface FlipSectionProps {
  inputs: BubbleModelInputs;
  result: BubbleModelResult;
}

interface WatchItem {
  key: string;
  label: string;
  value: string;
  note: string;
}

/**
 * Section 3 — "What would flip the answer".
 *
 * Every value below is read from the same inputs the model already publishes.
 * If an input is missing, that bullet is dropped rather than guessed.
 */
export function FlipSection({ inputs, result }: FlipSectionProps) {
  const items: WatchItem[] = [];

  if (inputs.cds) {
    items.push({
      key: "cds",
      label: "Credit insurance price (Oracle 5-year CDS)",
      value: `${inputs.cds.currentBps}bp vs ${inputs.cds.baselineBps}bp baseline, ${inputs.cds.priorBps}bp 90 days ago`,
      note: "CDS is an insurance price on debt. Another wide leg here raises the score quickly.",
    });
  }

  if (inputs.ledger) {
    items.push({
      key: "pipeline",
      label: "Unclosed pipeline",
      value: `${(inputs.ledger.announcedShare * 100).toFixed(1)}% of tracked deals announced but unfinished · ${inputs.ledger.daysSinceLastMega} days since the last $10B+ deal`,
      note: "A growing backlog means money is still accelerating. A draining one means it is slowing.",
    });
  }

  const valuationFactor = result.contributions.find(
    (contribution) => contribution.id === "valuation_stretch",
  );
  if (valuationFactor) {
    items.push({
      key: "valuations",
      label: "What investors pay per dollar of lab revenue",
      value: valuationFactor.reading.reading,
      note: "A down-round is the cleanest way to lower the score. A new print at today's price raises it.",
    });
  }

  if (inputs.capex?.aggregateCapexUsd && inputs.capex.aggregateFcfUsd) {
    const ratio = inputs.capex.aggregateCapexUsd / inputs.capex.aggregateFcfUsd;
    const ocf = inputs.aiDebt?.capexToOcfRatio;
    items.push({
      key: "capex",
      label: "Building cost against money earned",
      value: `${ratio.toFixed(2)}× free cash flow${ocf ? ` · ${(ocf * 100).toFixed(1)}% of operating cash flow` : ""}`,
      note: "Cuts in building lower the score. Building faster than sales raises it.",
    });
  }

  const crowdProbability = inputs.crowd?.bubble2026Probability ?? inputs.crowd?.yesProbability;
  if (typeof crowdProbability === "number") {
    const volume = inputs.crowd?.volumeUsd;
    items.push({
      key: "crowd",
      label: "Betting odds on a 2026 AI downturn",
      value: `${(crowdProbability * 100).toFixed(1)}% YES${volume ? ` · $${(volume / 1e6).toFixed(2)}M traded` : ""}`,
      note: "Crowd odds are a weak signal alone. They matter once they jump.",
    });
  }

  return (
    <section aria-labelledby="flip-heading" className="border-t border-rule pt-8 sm:pt-10">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 id="flip-heading" className="text-xl font-bold tracking-[-0.025em] text-ink sm:text-2xl">
          What would flip the answer
        </h2>
        <span className="label">The short honest list</span>
      </div>
      <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-ink-muted">
        No one knows the turn date. These are the readings worth watching, all already tracked here.
      </p>

      <ol className="mt-4 divide-y divide-rule border-y border-rule">
        {items.slice(0, 5).map((item, index) => (
          <li key={item.key} className="flex gap-3 py-3.5 sm:gap-4">
            <span className="num mt-0.5 text-[14px] text-ink-faint">
              {String(index + 1).padStart(2, "0")}
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-ink">{item.label}</p>
              <p className="num mt-0.5 break-words text-[14px] leading-relaxed text-ink-muted">
                {item.value}
              </p>
              <p className="mt-1 max-w-2xl text-sm leading-relaxed text-ink-subtle">{item.note}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
