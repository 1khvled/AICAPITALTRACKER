/**
 * The two React pieces of the chart accessibility layer.
 *
 * They live in a .tsx file because they render markup; the public entry
 * point for a chart is "@/lib/chart-a11y", which re-exports both.
 */

import React from "react";
import type { ChartAnnouncerProps, ChartDataTableProps } from "./chart-a11y";

/**
 * The numbers behind a chart, as a real table.
 *
 * A screen reader that cannot read an SVG can always read a table, so every
 * chart on this site ships one: the same rows, the same order, the same
 * figures as the marks it draws. The markup is deliberately plain — a
 * <caption>, scope="col" on every header, scope="row" on the first cell of
 * every row — because that is what makes the table navigable by cell and by
 * row.
 *
 * By default the table is hidden visually (it is still in the accessibility
 * tree). A small chart can pass `visible` to show it, which is what the
 * prediction-market charts do.
 */
export function ChartDataTable({
  caption,
  columns,
  rows,
  visible = false,
  numericColumns,
  className,
}: ChartDataTableProps) {
  const numeric = new Set<number>(numericColumns ?? []);

  const table = (
    <table className={visible ? "w-full text-left text-[14px]" : "text-left text-[14px]"}>
      <caption className="sr-only">{caption}</caption>
      <thead className={visible ? "bg-surface-2 text-ink-subtle" : undefined}>
        <tr>
          {columns.map((column, columnIndex) => (
            <th
              key={column}
              scope="col"
              className={
                visible
                  ? `p-3 font-medium${numeric.has(columnIndex) ? " text-right" : ""}`
                  : `px-3 py-2 font-medium${numeric.has(columnIndex) ? " text-right" : ""}`
              }
            >
              {column}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className={visible ? "divide-y divide-rule" : undefined}>
        {rows.map((row, rowIndex) => (
          <tr key={`${rowIndex}-${String(row[0] ?? "")}`}>
            {row.map((cell, cellIndex) => {
              const isRowHeader = cellIndex === 0;
              const isNumeric = typeof cell === "number" || numeric.has(cellIndex);
              const cellClass = visible
                ? isRowHeader
                  ? "p-3 font-semibold text-ink"
                  : isNumeric
                    ? "num p-3 text-right text-ink-muted"
                    : "p-3 text-ink-muted"
                : isRowHeader
                  ? "px-3 py-2 font-semibold"
                  : isNumeric
                    ? "num px-3 py-2 text-right"
                    : "px-3 py-2";
              const content = typeof cell === "number" ? cell.toLocaleString("en-US") : cell;

              return isRowHeader ? (
                <th key={cellIndex} scope="row" className={cellClass}>
                  {content}
                </th>
              ) : (
                <td key={cellIndex} className={cellClass}>
                  {content}
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );

  if (!visible) {
    return <div className="sr-only">{table}</div>;
  }

  return (
    <div className={`overflow-x-auto rounded-xl border border-rule${className ? ` ${className}` : ""}`}>
      {table}
    </div>
  );
}

/**
 * A polite live region for chart data that changes.
 *
 * role="status" with aria-live="polite" and aria-atomic="true": the reader
 * hears the new value when they are not doing anything else, and the whole
 * message is read rather than the changed fragment. It is NEVER assertive —
 * a chart that shouts interrupts whatever the reader was doing.
 */
export function ChartAnnouncer({ message, className = "sr-only" }: ChartAnnouncerProps) {
  return (
    <div role="status" aria-live="polite" aria-atomic="true" className={className}>
      {message}
    </div>
  );
}
