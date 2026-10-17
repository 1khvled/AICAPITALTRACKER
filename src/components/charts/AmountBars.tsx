import React from 'react';
import Link from 'next/link';
import { formatCurrency } from '@/lib/formatters';

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
}

/**
 * Zero-dependency horizontal top-N bars (pure divs + Tailwind).
 * Width is relative to the largest row. Works in server components.
 */
export function AmountBars({ rows, title, emptyNote }: AmountBarsProps) {
  const max = rows.reduce((m, r) => Math.max(m, r.value), 0);

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
        <ul className="mt-3 space-y-2.5">
          {rows.map((row) => {
            const label = (
              <span className="truncate text-xs font-semibold text-zinc-900">{row.label}</span>
            );
            return (
              <li key={row.label}>
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
                    className="h-full rounded-full transition-[width] duration-300"
                    style={{
                      width: `${max > 0 ? Math.max((row.value / max) * 100, 1.5) : 0}%`,
                      backgroundColor: row.color ?? '#059669',
                    }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
