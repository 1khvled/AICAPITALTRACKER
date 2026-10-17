'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { formatCurrency } from '@/lib/formatters';
import { chartHitProps, pct } from './chartInteraction';

export interface AmountBarRow {
  label: string;
  value: number;
  color?: string;
  href?: string;
  sub?: string;
}

interface AmountBarsProps {
  rows: AmountBarRow[];
  title?: string;
  emptyNote?: string;
  /** Wire up hover/focus highlighting. Default true. */
  interactive?: boolean;
}

/**
 * Zero-dependency interactive horizontal top-N bars.
 * Width is relative to the largest row. Every row is reachable by keyboard;
 * the hovered/focused row lights an emerald rail, swells the bar and drives the
 * live readout underneath.
 */
export function AmountBars({ rows, title, emptyNote, interactive = true }: AmountBarsProps) {
  const [active, setActive] = useState<number | null>(null);
  const max = rows.reduce((m, r) => Math.max(m, r.value), 0);
  const activeRow = active !== null ? rows[active] : undefined;
  const total = rows.reduce((s, r) => s + r.value, 0);

  return (
    <div>
      {title && (
        <div className="flex items-baseline justify-between gap-2 border-b border-zinc-100 pb-2">
          <h3 className="panel-title">{title}</h3>
          <span className="micro-label">{rows.length} rows</span>
        </div>
      )}
      {rows.length === 0 ? (
        <p className="empty-note mt-3">
          {emptyNote ?? 'No disclosed amounts under the current filters.'}
        </p>
      ) : (
        <>
          <ul className="mt-3 space-y-2.5">
            {rows.map((row, i) => {
              const on = active === i;
              const label = (
                <span className="truncate text-xs font-semibold text-zinc-900">{row.label}</span>
              );
              const width = `${max > 0 ? Math.max((row.value / max) * 100, 1.5) : 0}%`;
              return (
                <li
                  key={row.label}
                  className="chart-row -mx-2 rounded-r px-2 py-1"
                  data-active={on ? 'true' : undefined}
                  {...chartHitProps<HTMLLIElement>({
                    label: `${row.label}: ${formatCurrency(row.value)}${row.sub ? `, ${row.sub}` : ''} — ${pct(
                      row.value,
                      max
                    )} of the largest row`,
                    // Linked rows are activated by their inner <Link>; the
                    // highlight still follows keyboard focus via focusin.
                    interactive: !row.href && interactive,
                    focusable: false,
                    onEnter: () => interactive && setActive(i),
                    onLeave: () => setActive((cur) => (cur === i ? null : cur)),
                  })}
                >
                  <div className="flex items-baseline justify-between gap-2">
                    {row.href ? (
                      <Link href={row.href} className="min-w-0 flex-1 rounded transition-colors hover:text-emerald-800 hover:underline">
                        {label}
                      </Link>
                    ) : (
                      <span className="min-w-0 flex-1 truncate">{label}</span>
                    )}
                    <span className="num whitespace-nowrap text-xs text-zinc-600">
                      {formatCurrency(row.value)}
                      {row.sub && <span className="text-zinc-500"> · {row.sub}</span>}
                    </span>
                  </div>
                  <div
                    role="img"
                    aria-label={`${row.label}: ${formatCurrency(row.value)}${row.sub ? ` across ${row.sub}` : ''}`}
                    className="bar-track h-2.5"
                  >
                    <div
                      className="chart-bar chart-bar-x h-full rounded-full"
                      style={{
                        width,
                        backgroundColor: row.color ?? '#059669',
                        boxShadow: on ? `0 0 16px -4px ${row.color ?? '#059669'}` : undefined,
                      }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>

          {/* Live readout — always present, so hovering never reflows the panel. */}
          {interactive && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className={`chart-readout ${activeRow ? '' : 'chart-readout-muted'}`}>
                {activeRow ? (
                  <>
                    <span className="max-w-[18rem] truncate align-middle">{activeRow.label}</span> ·{' '}
                    {formatCurrency(activeRow.value)} · {pct(activeRow.value, max)} of top ·{' '}
                    {pct(activeRow.value, total, 1)} of total
                  </>
                ) : (
                  `${rows.length} rows · ${formatCurrency(total)} disclosed`
                )}
              </span>
              <span className="micro-label ml-auto hidden sm:inline">
                {activeRow?.href ? 'Open the record →' : 'Hover or Tab a row'}
              </span>
            </div>
          )}
        </>
      )}
    </div>
  );
}