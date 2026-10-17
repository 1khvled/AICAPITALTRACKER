'use client';

import React, { useState } from 'react';
import type { Deal } from '@/lib/types';
import { formatCurrency } from '@/lib/formatters';
import { dealTypeColor, dealTypeLabel } from './chartTheme';
import { chartHitProps, pct } from './chartInteraction';

interface SectorBarsProps {
  deals: Deal[];
  /** Wire up hover/focus highlighting. Default true. */
  interactive?: boolean;
  /** Cross-highlight a deal type from a parent filter. */
  activeType?: string | null;
  /** Report the hovered/activated row back (e.g. to emphasise a bubble). */
  onTypeHover?: (dealType: string | null) => void;
}

const SINK_ROLES = new Set(['investee', 'borrower', 'customer', 'project_owner']);

function sectorOf(deal: Deal): string {
  const parties = deal.parties ?? [];
  const sink = parties.find((p) => SINK_ROLES.has(p.role)) ?? parties[0];
  const raw = sink?.company?.company_type ?? 'other';
  return raw.replace(/_/g, ' ');
}

interface BarRow {
  key: string;
  label: string;
  total: number;
  count: number;
  color?: string;
}

/**
 * One interactive bar group. Rows light up on hover *and* keyboard focus, and
 * the group keeps a live readout of the live row so the numbers are always
 * reachable without a pointer.
 */
function BarGroup({
  title,
  rows,
  note,
  interactive,
  crossHighlightKey,
  crossHighlightOf,
  onRowHover,
}: {
  title: string;
  rows: BarRow[];
  note: string;
  interactive: boolean;
  /** Row key namespace for the parent's cross-highlight (`type:` / `sector:`). */
  crossHighlightKey?: (row: BarRow) => string | null;
  crossHighlightOf?: string | null;
  onRowHover?: (row: BarRow | null) => void;
}) {
  const [active, setActive] = useState<number | null>(null);
  const max = rows.reduce((m, r) => Math.max(m, r.total), 0);
  const total = rows.reduce((s, r) => s + r.total, 0);
  const activeRow = active !== null ? rows[active] : undefined;

  const setRow = (i: number) => {
    setActive(i);
    if (onRowHover) onRowHover(rows[i] ?? null);
  };
  const clearRow = (i: number) => {
    setActive((cur) => (cur === i ? null : cur));
    if (onRowHover) onRowHover(null);
  };

  return (
    <div>
      <div className="flex items-baseline justify-between gap-2 border-b border-zinc-100 pb-2">
        <h3 className="panel-title">{title}</h3>
        <span className="micro-label">{rows.length} groups</span>
      </div>
      {rows.length === 0 ? (
        <p className="empty-note mt-3">No disclosed amounts in this group under the current filters.</p>
      ) : (
        <>
          <ul className="mt-3 space-y-2.5">
            {rows.map((row, i) => {
              const on = active === i;
              const dim =
                crossHighlightOf !== undefined &&
                crossHighlightOf !== null &&
                crossHighlightKey?.(row) !== crossHighlightOf;
              return (
                <li
                  key={row.key}
                  className="chart-row -mx-2 rounded-r px-2 py-1"
                  data-active={on ? 'true' : undefined}
                  data-dim={dim ? 'true' : undefined}
                  {...chartHitProps<HTMLLIElement>({
                    label: `${row.label}: ${formatCurrency(row.total)} across ${row.count} deal${
                      row.count === 1 ? '' : 's'
                    } — ${pct(row.total, max)} of the largest group`,
                    interactive,
                    onEnter: () => setRow(i),
                    onLeave: () => clearRow(i),
                  })}
                >
                  <div className="flex items-baseline justify-between gap-2 text-xs">
                    <span className="flex min-w-0 items-center gap-1.5 truncate font-semibold text-zinc-900">
                      <span
                        aria-hidden="true"
                        className="inline-block h-2 w-2 shrink-0 rounded-full ring-1 ring-inset ring-black/10"
                        style={{ backgroundColor: row.color ?? '#059669' }}
                      />
                      {row.label}
                    </span>
                    <span className="num whitespace-nowrap text-zinc-600">
                      {formatCurrency(row.total)}{' '}
                      <span className="text-zinc-500">&middot; {row.count} deals</span>
                    </span>
                  </div>
                  <div
                    role="img"
                    aria-label={`${row.label}: ${formatCurrency(row.total)} across ${row.count} deals`}
                    className="bar-track h-3"
                  >
                    <div
                      className="chart-bar chart-bar-x h-full rounded-full"
                      style={{
                        width: `${max > 0 ? Math.max((row.total / max) * 100, 1.5) : 0}%`,
                        backgroundColor: row.color ?? '#059669',
                        boxShadow: on ? `0 0 18px -4px ${row.color ?? '#059669'}` : undefined,
                      }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className={`chart-readout ${activeRow ? '' : 'chart-readout-muted'}`}>
              {activeRow ? (
                <>
                  <span className="max-w-[14rem] truncate align-middle">{activeRow.label}</span> ·{' '}
                  {formatCurrency(activeRow.total)} · {pct(activeRow.total, max)} of top ·{' '}
                  {pct(activeRow.total, total, 1)} of group
                </>
              ) : (
                `${formatCurrency(total)} across ${rows.length} groups`
              )}
            </span>
            <span className="micro-label ml-auto hidden sm:inline">
              {interactive ? 'Hover or Tab a bar' : ''}
            </span>
          </div>
        </>
      )}
      <p className="caption mt-3">{note}</p>
    </div>
  );
}

/**
 * Horizontal bar breakdowns: disclosed dollars by deal type and by recipient
 * sector. Both groups are keyboard-navigable and cross-highlight each other
 * (hovering a deal type also emphasises that type's counterpart sector bar).
 */
export function SectorBars({ deals, interactive = true, activeType = null, onTypeHover }: SectorBarsProps) {
  const disclosed = deals.filter((d) => d.amount_disclosed && d.amount_value && d.amount_value > 0);
  const undisclosedCount = deals.length - disclosed.length;

  const byType = new Map<string, { total: number; count: number }>();
  for (const d of disclosed) {
    const e = byType.get(d.deal_type) ?? { total: 0, count: 0 };
    e.total += d.amount_value ?? 0;
    e.count += 1;
    byType.set(d.deal_type, e);
  }
  const typeRows: BarRow[] = [...byType.entries()]
    .map(([key, v]) => ({ key, label: dealTypeLabel(key), total: v.total, count: v.count, color: dealTypeColor(key) }))
    .sort((a, b) => b.total - a.total);

  const bySector = new Map<string, { total: number; count: number }>();
  for (const d of disclosed) {
    const sector = sectorOf(d);
    const e = bySector.get(sector) ?? { total: 0, count: 0 };
    e.total += d.amount_value ?? 0;
    e.count += 1;
    bySector.set(sector, e);
  }
  const sectorRows: BarRow[] = [...bySector.entries()]
    .map(([key, v]) => ({ key, label: key.replace(/\b\w/g, (c) => c.toUpperCase()), total: v.total, count: v.count }))
    .sort((a, b) => b.total - a.total);

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
      <BarGroup
        title="Disclosed $ by deal type"
        rows={typeRows}
        note={`${undisclosedCount} deal${undisclosedCount === 1 ? '' : 's'} with undisclosed amounts excluded from sizing.`}
        interactive={interactive}
        crossHighlightOf={activeType && activeType !== 'all' ? activeType : null}
        crossHighlightKey={(row) => row.key}
        onRowHover={onTypeHover ? (row) => onTypeHover(row ? row.key : null) : undefined}
      />
      <BarGroup
        title="Disclosed $ by recipient sector"
        rows={sectorRows}
        note="Sector = company type of the capital recipient (investee / borrower / customer). Undisclosed amounts excluded."
        interactive={interactive}
      />
    </div>
  );
}