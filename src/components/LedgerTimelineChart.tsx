"use client";

import React, { useMemo } from "react";
import { formatTotal, formatUsd, type Deal } from "@/app/ledger/_components/ledgerData";

/**
 * Capital-by-year strip for /ledger.
 *
 * Everything on screen is computed from the `deals` array it is handed — the
 * years shown, the counts, the totals, the category split. Nothing is hardcoded,
 * so the chart cannot drift away from the list underneath it.
 *
 * Sober by design: one ink bar per year, the debt slice in the risk colour,
 * plain category chips underneath. Clicking a year or a category filters the
 * ledger list above it.
 */

export interface LedgerTimelineChartProps {
  deals: Deal[];
  selectedYear: string;
  onSelectYear: (year: string) => void;
}

interface YearBucket {
  year: string;
  count: number;
  total: number;
  debt: number;
  largest: string;
}

export function LedgerTimelineChart({
  deals,
  selectedYear,
  onSelectYear,
}: LedgerTimelineChartProps) {
  const { years, grandTotal, debtTotal, megaCount, circularCount } = useMemo(() => {
    const buckets = new Map<string, YearBucket>();
    let total = 0;
    let debt = 0;
    let mega = 0;
    let circular = 0;

    deals.forEach((deal) => {
      const year = String(deal.year);
      const usd = deal.amount_usd || 0;
      total += usd;
      if (deal.is_debt) debt += usd;
      if (deal.is_mega) mega += 1;
      if (deal.is_circular) circular += 1;

      const bucket = buckets.get(year) ?? {
        year,
        count: 0,
        total: 0,
        debt: 0,
        largest: "",
      };
      bucket.count += 1;
      bucket.total += usd;
      if (deal.is_debt) bucket.debt += usd;
      if (usd > 0 && !bucket.largest) bucket.largest = deal.title;
      buckets.set(year, bucket);
    });

    return {
      years: Array.from(buckets.values()).sort((a, b) => a.year.localeCompare(b.year)),
      grandTotal: total,
      debtTotal: debt,
      megaCount: mega,
      circularCount: circular,
    };
  }, [deals]);

  const maxYearTotal = useMemo(
    () => Math.max(...years.map((y) => y.total), 1),
    [years]
  );

  return (
    <div className="card">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <p className="text-[15px] font-semibold tracking-tight text-ink">
          Disclosed capital by year
        </p>
        <p className="text-[14px] text-ink-subtle">
          <span className="num text-ink">{formatTotal(grandTotal)}</span> across{" "}
          <span className="num">{deals.length}</span> {deals.length === 1 ? "deal" : "deals"}. Tap a bar or a type to filter.
        </p>
      </div>

      {/* Year bars */}
      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {years.map((bucket) => {
          const active = selectedYear === bucket.year;
          const height = Math.max(6, Math.round((bucket.total / maxYearTotal) * 100));
          const debtShare = bucket.total > 0 ? Math.round((bucket.debt / bucket.total) * 100) : 0;
          return (
            <button
              key={bucket.year}
              type="button"
              onClick={() => onSelectYear(bucket.year)}
              aria-pressed={active}
              className={`flex min-w-0 flex-col gap-2 rounded-md border p-3 text-left transition-colors ${
                active
                  ? "border-ink bg-surface-2"
                  : "border-rule hover:border-rule-strong hover:bg-surface-2"
              }`}
            >
              <span className="flex items-baseline justify-between gap-2">
                <span className="num text-[14px] font-semibold text-ink">{bucket.year}</span>
                <span className="num text-[14px] text-ink-faint">
                  {bucket.count} deal{bucket.count === 1 ? "" : "s"}
                </span>
              </span>

              <span className="flex h-24 w-full items-end overflow-hidden rounded-sm bg-surface-3">
                <span
                  className="flex w-full flex-col-reverse"
                  style={{ height: `${height}%` }}
                >
                  <span className="block w-full bg-ink" style={{ height: `${100 - debtShare}%` }} />
                  <span className="block w-full bg-risk-500" style={{ height: `${debtShare}%` }} />
                </span>
              </span>

              <span className="block">
                <span className="num block text-[15px] font-semibold text-ink">
                  {formatTotal(bucket.total)}
                </span>
                <span className="num block text-[14px] text-ink-subtle">
                  {formatUsd(bucket.debt)} of it debt
                </span>
              </span>
            </button>
          );
        })}
      </div>

      <p className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[14px] text-ink-subtle">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-sm bg-ink" aria-hidden="true" />
          Equity, compute and construction
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-sm bg-risk-500" aria-hidden="true" />
          Debt that must be repaid
        </span>
      </p>

      {/* One line of context instead of a second filter row */}
      <p className="mt-3 border-t border-rule pt-3 text-[14px] text-ink-muted">
        Debt is{" "}
        <span className="num font-semibold text-ink">
          {grandTotal > 0 ? `${((debtTotal / grandTotal) * 100).toFixed(1)}%` : "0.0%"}
        </span>{" "}
        of everything tracked (<span className="num">{formatTotal(debtTotal)}</span>).{" "}
        <span className="num">{megaCount}</span> deals are single commitments of $10B or more, and{" "}
        <span className="num">{circularCount}</span> are circular — funded by a party the buyer then
        pays back.
      </p>
    </div>
  );
}

export default LedgerTimelineChart;