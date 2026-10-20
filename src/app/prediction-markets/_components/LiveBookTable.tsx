"use client";

import React, { useState, useMemo } from "react";
import { ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";

export interface LiveCrowdMarket {
  id: string;
  question: string;
  slug: string;
  eventSlug: string;
  yesProbabilityPct: number;
  noProbabilityPct: number;
  volumeUsd: number;
  referralUrl: string;
  endDate?: string;
  closed?: boolean;
  active?: boolean;
  liquidityUsd?: number;
  oneDayPriceChangePct?: number;
  spreadPct?: number;
}

export interface BookRow {
  market: LiveCrowdMarket;
  yesUrl: string;
  noUrl: string;
  closed: boolean;
  closedReason: string;
  deadline: string;
  deadlineMs: number | null;
}

export type SortKey = "question" | "deadline" | "yes" | "no" | "volume" | "liquidity";
export type SortDirection = "asc" | "desc";

interface SortState {
  key: SortKey;
  direction: SortDirection;
}

function fmtPct(value: number | undefined | null, digits = 1): string {
  if (typeof value !== "number" || Number.isNaN(value)) return "—";
  return `${value.toFixed(digits)}%`;
}

function fmtUsd(value: number | undefined | null): string {
  if (typeof value !== "number" || Number.isNaN(value)) return "—";
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(2)}B`;
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}k`;
  return `$${value.toFixed(0)}`;
}

function sortDescription(key: SortKey, dir: SortDirection): string {
  switch (key) {
    case "volume":
      return `sorted by traded volume, ${dir === "desc" ? "largest first" : "smallest first"}`;
    case "question":
      return `sorted by contract name, ${dir === "asc" ? "A to Z" : "Z to A"}`;
    case "deadline":
      return `sorted by deadline, ${dir === "asc" ? "soonest first" : "latest first"}`;
    case "yes":
      return `sorted by YES price, ${dir === "desc" ? "highest first" : "lowest first"}`;
    case "no":
      return `sorted by NO price, ${dir === "desc" ? "highest first" : "lowest first"}`;
    case "liquidity":
      return `sorted by liquidity, ${dir === "desc" ? "largest first" : "smallest first"}`;
  }
}

function SortHeader({
  label,
  sortKey,
  sort,
  onSort,
  align = "left",
}: {
  label: string;
  sortKey: SortKey;
  sort: SortState;
  onSort: (key: SortKey) => void;
  align?: "left" | "right";
}) {
  const active = sort.key === sortKey;
  const direction = active ? sort.direction : null;
  const ariaSort = active
    ? direction === "asc"
      ? "ascending"
      : "descending"
    : "none";
  const accessibleName = active
    ? `Sort by ${label}, currently ${direction === "asc" ? "ascending" : "descending"}. Activate to sort ${
        direction === "asc" ? "descending" : "ascending"
      }.`
    : `Sort by ${label}`;

  return (
    <th
      scope="col"
      aria-sort={ariaSort}
      className={`p-2 sm:p-3 font-medium ${align === "right" ? "text-right" : "text-left"}`}
    >
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        aria-label={accessibleName}
        className={[
          "inline-flex min-h-11 min-w-11 items-center gap-1 text-[13px] font-medium uppercase tracking-[0.1em] transition-colors duration-150",
          align === "right" ? "w-full justify-end" : "",
          active ? "text-ink" : "text-ink-faint hover:text-ink-muted",
        ].join(" ")}
      >
        <span>{label}</span>
        {active && direction === "asc" ? (
          <ChevronUp className="h-3.5 w-3.5" aria-hidden="true" />
        ) : null}
        {active && direction === "desc" ? (
          <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
        ) : null}
        {!active ? <ChevronsUpDown className="h-3.5 w-3.5 opacity-60" aria-hidden="true" /> : null}
      </button>
    </th>
  );
}

export function LiveBookTable({
  openRows,
  closedRows,
}: {
  openRows: BookRow[];
  closedRows: BookRow[];
}) {
  const [sort, setSort] = useState<SortState>({ key: "volume", direction: "desc" });

  const handleSort = (key: SortKey) => {
    setSort((prev) => {
      if (prev.key === key) {
        return { key, direction: prev.direction === "asc" ? "desc" : "asc" };
      }
      return {
        key,
        direction: key === "question" || key === "deadline" ? "asc" : "desc",
      };
    });
  };

  const sortComparator = useMemo(() => {
    const dir = sort.direction === "asc" ? 1 : -1;
    return (a: BookRow, b: BookRow) => {
      let cmp = 0;
      switch (sort.key) {
        case "question":
          cmp = a.market.question.localeCompare(b.market.question);
          break;
        case "deadline": {
          const aMs = a.deadlineMs ?? Number.MAX_SAFE_INTEGER;
          const bMs = b.deadlineMs ?? Number.MAX_SAFE_INTEGER;
          cmp = aMs - bMs;
          break;
        }
        case "yes":
          cmp = a.market.yesProbabilityPct - b.market.yesProbabilityPct;
          break;
        case "no":
          cmp = a.market.noProbabilityPct - b.market.noProbabilityPct;
          break;
        case "volume":
          cmp = (a.market.volumeUsd ?? 0) - (b.market.volumeUsd ?? 0);
          break;
        case "liquidity":
          cmp = (a.market.liquidityUsd ?? 0) - (b.market.liquidityUsd ?? 0);
          break;
      }

      if (cmp !== 0) return cmp * dir;

      // Stable total order: break ties on the baseline column (volumeUsd, largest first)
      if (sort.key !== "volume") {
        const volumeDiff = (b.market.volumeUsd ?? 0) - (a.market.volumeUsd ?? 0);
        if (volumeDiff !== 0) return volumeDiff;
      }

      // If still tied, break on market ID, never on array index
      return a.market.id.localeCompare(b.market.id);
    };
  }, [sort]);

  const sortedOpen = useMemo(
    () => [...openRows].sort(sortComparator),
    [openRows, sortComparator]
  );
  const sortedClosed = useMemo(
    () => [...closedRows].sort(sortComparator),
    [closedRows, sortComparator]
  );

  return (
    <div className="overflow-x-auto rounded-xl border border-rule">
      <table className="w-full text-left text-[14px]">
        <caption className="sr-only">
          The tracked prediction-market contracts: the question, the deadline, the YES and NO
          prices, the traded volume, the liquidity where published, and an outbound link to
          trade the contract on Polymarket. Contracts that have closed are marked as closed
          and kept in the table.
        </caption>
        <thead className="bg-surface-2 text-ink-subtle">
          <tr>
            <SortHeader
              label="Contract"
              sortKey="question"
              sort={sort}
              onSort={handleSort}
              align="left"
            />
            <SortHeader
              label="Deadline"
              sortKey="deadline"
              sort={sort}
              onSort={handleSort}
              align="left"
            />
            <SortHeader
              label="YES"
              sortKey="yes"
              sort={sort}
              onSort={handleSort}
              align="right"
            />
            <SortHeader
              label="NO"
              sortKey="no"
              sort={sort}
              onSort={handleSort}
              align="right"
            />
            <SortHeader
              label="Traded volume"
              sortKey="volume"
              sort={sort}
              onSort={handleSort}
              align="right"
            />
            <SortHeader
              label="Liquidity"
              sortKey="liquidity"
              sort={sort}
              onSort={handleSort}
              align="right"
            />
            <th
              scope="col"
              className="p-3 text-right text-[13px] font-medium uppercase tracking-[0.1em] text-ink-faint"
            >
              Trade on Polymarket
            </th>
          </tr>
        </thead>

        {sortedOpen.length > 0 ? (
          <tbody className="divide-y divide-rule">
            <tr>
              <th
                scope="colgroup"
                colSpan={7}
                className="bg-surface-2 px-3 py-2 text-left text-[13px] font-semibold text-ink-muted"
              >
                Open contracts ({sortedOpen.length}) — {sortDescription(sort.key, sort.direction)}
              </th>
            </tr>
            {sortedOpen.map((row) => (
              <tr key={row.market.id} className="align-top">
                <th scope="row" className="p-3 font-semibold text-ink">
                  {row.market.question}
                  <span className="block text-[14px] font-normal text-ink-subtle">
                    #{row.market.id}
                  </span>
                </th>
                <td className="num p-3 text-ink-muted">{row.deadline}</td>
                <td className="num p-3 text-right font-semibold text-ink">
                  {fmtPct(row.market.yesProbabilityPct)}
                </td>
                <td className="num p-3 text-right text-ink-muted">
                  {fmtPct(row.market.noProbabilityPct)}
                </td>
                <td className="num p-3 text-right text-ink-muted">
                  {fmtUsd(row.market.volumeUsd)}
                </td>
                <td className="num p-3 text-right text-ink-muted">
                  {typeof row.market.liquidityUsd === "number"
                    ? fmtUsd(row.market.liquidityUsd)
                    : "—"}
                </td>
                <td className="p-3">
                  <div className="flex flex-wrap justify-end gap-2">
                    <a
                      href={row.yesUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn min-h-11 whitespace-nowrap"
                    >
                      <span aria-hidden="true">YES</span>
                      <span className="sr-only">
                        Trade on Polymarket: {row.market.question} — YES
                      </span>
                    </a>
                    <a
                      href={row.noUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn min-h-11 whitespace-nowrap"
                    >
                      <span aria-hidden="true">NO</span>
                      <span className="sr-only">
                        Trade on Polymarket: {row.market.question} — NO
                      </span>
                    </a>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        ) : null}

        {sortedClosed.length > 0 ? (
          <tbody className="divide-y divide-rule bg-surface-2">
            <tr>
              <th
                scope="colgroup"
                colSpan={7}
                className="bg-surface-3 px-3 py-2 text-left text-[13px] font-semibold text-ink-muted"
              >
                Closed contracts ({sortedClosed.length}) — kept for the record, not tradeable
              </th>
            </tr>
            {sortedClosed.map((row) => (
              <tr key={row.market.id} className="align-top">
                <th scope="row" className="p-3 font-semibold text-ink-subtle">
                  {row.market.question}
                  <span className="mt-1 flex flex-wrap items-center gap-2">
                    <span className="chip">Closed</span>
                    <span className="text-[14px] font-normal text-ink-faint">
                      {row.closedReason}
                    </span>
                    <span className="block text-[14px] font-normal text-ink-subtle">
                      #{row.market.id}
                    </span>
                  </span>
                </th>
                <td className="num p-3 text-ink-subtle">{row.deadline}</td>
                <td className="num p-3 text-right text-ink-subtle">
                  {fmtPct(row.market.yesProbabilityPct)}
                </td>
                <td className="num p-3 text-right text-ink-subtle">
                  {fmtPct(row.market.noProbabilityPct)}
                </td>
                <td className="num p-3 text-right text-ink-subtle">
                  {fmtUsd(row.market.volumeUsd)}
                </td>
                <td className="num p-3 text-right text-ink-subtle">
                  {typeof row.market.liquidityUsd === "number"
                    ? fmtUsd(row.market.liquidityUsd)
                    : "—"}
                </td>
                <td className="p-3">
                  <div className="flex flex-wrap justify-end gap-2">
                    <a
                      href={row.yesUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn min-h-11 whitespace-nowrap"
                    >
                      <span aria-hidden="true">YES</span>
                      <span className="sr-only">
                        Trade on Polymarket: {row.market.question} — YES
                      </span>
                    </a>
                    <a
                      href={row.noUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn min-h-11 whitespace-nowrap"
                    >
                      <span aria-hidden="true">NO</span>
                      <span className="sr-only">
                        Trade on Polymarket: {row.market.question} — NO
                      </span>
                    </a>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        ) : null}
      </table>
    </div>
  );
}
