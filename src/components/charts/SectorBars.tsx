import React from 'react';
import type { Deal } from '@/lib/types';
import { formatCurrency } from '@/lib/formatters';
import { dealTypeColor, dealTypeLabel } from './chartTheme';

interface SectorBarsProps {
  deals: Deal[];
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

function BarGroup({ title, rows, note }: { title: string; rows: BarRow[]; note: string }) {
  const max = rows.reduce((m, r) => Math.max(m, r.total), 0);
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2 border-b border-zinc-100 pb-2">
        <h3 className="panel-title">{title}</h3>
        <span className="micro-label">{rows.length} groups</span>
      </div>
      {rows.length === 0 ? (
        <p className="empty-note mt-3">No disclosed amounts in this group under the current filters.</p>
      ) : (
        <ul className="mt-3 space-y-2.5">
          {rows.map((row) => (
            <li key={row.key}>
              <div className="flex items-baseline justify-between gap-2 text-xs">
                <span className="truncate font-semibold text-zinc-900">{row.label}</span>
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
                  className="h-full rounded-full transition-[width] duration-300"
                  style={{
                    width: `${max > 0 ? Math.max((row.total / max) * 100, 1.5) : 0}%`,
                    backgroundColor: row.color ?? '#059669',
                  }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
      <p className="caption mt-3">{note}</p>
    </div>
  );
}

/** Horizontal bar breakdowns: disclosed dollars by deal type and by recipient sector. */
export function SectorBars({ deals }: SectorBarsProps) {
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
      />
      <BarGroup
        title="Disclosed $ by recipient sector"
        rows={sectorRows}
        note="Sector = company type of the capital recipient (investee / borrower / customer). Undisclosed amounts excluded."
      />
    </div>
  );
}
