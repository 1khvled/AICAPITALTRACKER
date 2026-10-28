import React from "react";
import { Reveal } from "@/components/Reveal";
import { flipWatches } from "@/lib/flip-watches";
import type { BubbleModelInputs, BubbleModelResult } from "@/lib/model/types";

interface FlipSectionProps {
  inputs: BubbleModelInputs;
  result: BubbleModelResult;
}

/**
 * Section 3 — "What would flip the answer".
 *
 * 2026-10-20: this was static prose — it named the readings worth watching but
 * not what each one was worth. Every row is now PRICED: the model is re-run
 * with one shocked input and the new print is read off the result, so the line
 * "if credit widened 50bp, the print would be X" is the model's own output and
 * not an estimate. The threshold beside it is the factor's own published ramp
 * boundary — the point beyond which that factor stops responding.
 *
 * The rows are ordered by how much the priced move actually shifts the print,
 * so the biggest lever is first.
 */
export function FlipSection({ inputs, result }: FlipSectionProps) {
  const watches = flipWatches(inputs, result).slice(0, 5);

  return (
    <section aria-labelledby="flip-heading" className="border-t border-rule pt-8 sm:pt-10">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 id="flip-heading" className="text-xl font-bold tracking-[-0.025em] text-ink sm:text-2xl">
          What would flip the answer
        </h2>
        <span className="label">The short honest list</span>
      </div>
      <p className="mt-1.5 max-w-2xl text-[15px] leading-relaxed text-ink-muted">
        No one knows the turn date. These are the readings worth watching, all already tracked here —
        and each one is priced: the line below is what the model itself prints if that reading moves.
        Rows are ordered by the size of the priced move.
      </p>

      <ol className="mt-4 divide-y divide-rule border-y border-rule">
        {watches.map((item, index) => {
          const relief = item.direction === "down";
          const deltaLabel = `${item.delta > 0 ? "+" : item.delta < 0 ? "−" : ""}${Math.abs(
            item.delta,
          ).toFixed(1)} pts`;
          const scenarioLabel = item.effect.replace(/\s*\([^)]*\)\s*$/, "");
          return (
            <Reveal as="li" key={item.id} className="flex gap-3 py-3.5 sm:gap-4" delay={index * 50}>
              <span className="num mt-0.5 text-[14px] text-ink-faint">
                {String(index + 1).padStart(2, "0")}
              </span>
              <div className="min-w-0">
                <p className="text-[15px] font-semibold text-ink">{item.label}</p>
                <p className="num mt-0.5 break-words text-[14px] leading-relaxed text-ink-muted">
                  {item.value}
                </p>
                <p className="mt-1 max-w-2xl text-[14px] leading-relaxed text-ink-subtle">
                  {item.note}
                </p>
                <p className="mt-1.5 flex flex-wrap items-baseline gap-x-2 gap-y-1 text-[14px]">
                  <span
                    className={`chip num font-semibold ${relief ? "chip-safe" : "chip-risk"}`}
                  >
                    {deltaLabel}
                  </span>
                  <span className="text-ink-muted">
                    {item.shock} &rarr; {scenarioLabel}
                  </span>
                  <span className="text-ink-faint">until {item.threshold}</span>
                </p>
              </div>
            </Reveal>
          );
        })}
      </ol>
    </section>
  );
}
