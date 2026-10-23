import React from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { HistoryChart } from "@/components/HistoryChart";
import { buildHistoryBundle, type RawDeal } from "@/lib/history-series";
import { evaluateBubbleModel, DEFAULT_MODEL_INPUTS } from "@/lib/model/engine";
import rawDeals from "@/data/deals.json";
import rawTrajectory from "@/data/trajectory-history.json";

/**
 * The history, in three panels.
 *
 * Server component: the series are assembled at build time from the ledger,
 * the model's backtests, the published market history and the observed daily
 * prints, and the chart receives them as data. Nothing is computed in the
 * browser and nothing is typed.
 *
 * `collapsible` is for the home page: the record is the site's evidence, but
 * it is an appendix to the answer, not the answer. Collapsed it reads as one
 * honest line; opened it is the same three panels and two data tables.
 */
export function HistorySection({ collapsible = false }: { collapsible?: boolean }) {
  const raw = rawDeals as unknown;
  const deals = (
    Array.isArray(raw) ? raw : (raw as { deals: RawDeal[] }).deals
  ) as RawDeal[];
  const trajectory = rawTrajectory as Array<{
    date: string;
    dayLabel?: string;
    probability: number;
    compositeScore: number;
  }>;

  const bundle = buildHistoryBundle(deals, trajectory);
  const model = evaluateBubbleModel(DEFAULT_MODEL_INPUTS);

  const firstYear = bundle.months[0]?.iso.slice(0, 4) ?? "2023";

  const heading = (
    <>
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2
          id="history-heading"
          className="text-xl font-bold tracking-[-0.025em] text-ink sm:text-2xl"
        >
          How far back this goes
        </h2>
        <span className="label">the model, and the money it reads</span>
      </div>

      <p className="mb-4 mt-1.5 max-w-3xl text-[15px] leading-relaxed text-ink-muted">
        The model has been read against every episode in the consistency table, from the
        1929 crash to the last cycle before this one &mdash; it is the only honest way to show
        how it behaves on a market that has already resolved. Beside it: the money going in,
        month by month from {firstYear}, which is what the model actually reads. And the
        market&rsquo;s own price against the model&rsquo;s print.
      </p>
    </>
  );

  const body = (
    <>
      <HistoryChart bundle={bundle} currentProbabilityPct={model.burstProbability} />

      <p className="label mt-5 pt-1">What this chart is not</p>
      <ul className="not-this-body space-y-1.5 text-[15px] leading-relaxed text-ink-muted">
        <li>
          The money panel is the ledger, not the model&rsquo;s print. Those are different
          things, and the model&rsquo;s own daily history begins on 18 October 2026 &mdash;
          before that there is no print to draw, and the site will not invent one.
        </li>
        <li>
          The historical columns are the model&rsquo;s readings on episodes that have already
          resolved. They are not a backtest of the whole pipeline over 96 years of data, and
          they are not a forecast of anything.
        </li>
        <li>
          The ledger holds disclosed capital only. A commitment nobody has announced does
          not appear on it, so the money panel is a floor, not a total.
        </li>
      </ul>

      <p className="mt-3 text-[14px] leading-relaxed text-ink-faint">
        Every number on this chart is computed from the{" "}
        <Link
          href="/ledger"
          className="text-ink underline decoration-rule underline-offset-4 hover:decoration-ink"
        >
          deal ledger
        </Link>
        , the{" "}
        <Link
          href="/methodology#backtests"
          className="text-ink underline decoration-rule underline-offset-4 hover:decoration-ink"
        >
          consistency table
        </Link>{" "}
        and the{" "}
        <Link
          href="/prediction-markets"
          className="text-ink underline decoration-rule underline-offset-4 hover:decoration-ink"
        >
          published market history
        </Link>
        .
      </p>
    </>
  );

  if (collapsible) {
    return (
      <section aria-labelledby="history-heading" className="mt-10">
        <details className="group panel rounded-md border border-rule bg-surface px-4 py-3 sm:px-5">
          <summary className="flex min-h-11 cursor-pointer list-none items-start justify-between gap-4 [&::-webkit-details-marker]:hidden">
            <div>
              <p className="label">the model, and the money it reads</p>
              <h2
                id="history-heading"
                className="mt-1 text-xl font-bold tracking-[-0.025em] text-ink sm:text-2xl"
              >
                How far back this goes
              </h2>
              <p className="mt-1 max-w-2xl text-[14px] leading-relaxed text-ink-muted">
                Tested against every resolved episode since 1929, the money going in month by
                month, and the market&rsquo;s own price. Open the three panels.
              </p>
            </div>
            <ChevronRight
              className="mt-1 h-5 w-5 shrink-0 text-ink-subtle transition-transform group-open:rotate-90"
              aria-hidden="true"
            />
          </summary>
          <div className="mt-5 border-t border-rule pt-5">{body}</div>
        </details>
      </section>
    );
  }

  return (
    <section aria-labelledby="history-heading" className="mt-10">
      {heading}
      {body}
    </section>
  );
}

export default HistorySection;
