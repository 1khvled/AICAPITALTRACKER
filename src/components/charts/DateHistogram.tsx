import React from 'react';
import type { Deal } from '@/lib/types';

interface DateHistogramProps {
  deals: Pick<Deal, 'announcement_date' | 'id'>[];
  title?: string;
}

function quarterKey(dateStr: string | null): string | null {
  if (!dateStr || dateStr.length < 7) return null;
  const year = dateStr.slice(0, 4);
  const month = parseInt(dateStr.slice(5, 7), 10);
  if (!/^\d{4}$/.test(year) || Number.isNaN(month) || month < 1 || month > 12) return null;
  const q = Math.floor((month - 1) / 3) + 1;
  return `${year.slice(2)}Q${q}`;
}

/**
 * Zero-dependency quarterly deal-count histogram (pure divs + Tailwind).
 * Buckets deals by announcement_date quarter. Works in server components.
 */
export function DateHistogram({ deals, title = 'Deals per quarter' }: DateHistogramProps) {
  const counts = new Map<string, number>();
  let undated = 0;
  for (const d of deals) {
    const k = quarterKey(d.announcement_date);
    if (!k) {
      undated += 1;
      continue;
    }
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  // Sort chronologically: keys are YYQn so zero-padded comparable after expansion.
  const entries = [...counts.entries()].sort((a, b) => {
    const expand = (k: string) => `20${k.slice(0, 2)}${k.slice(2)}`;
    return expand(a[0]).localeCompare(expand(b[0]));
  });

  if (entries.length === 0) {
    return (
      <div>
        <h3 className="panel-title">{title}</h3>
        <p className="empty-note mt-3">No dated deals under the current filters.</p>
      </div>
    );
  }

  const max = entries.reduce((m, [, c]) => Math.max(m, c), 0);
  const showEvery = Math.max(1, Math.ceil(entries.length / 12));

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="panel-title">{title}</h3>
        <span className="pill pill-neutral">
          peak {max} &middot; {entries.length} quarters
        </span>
      </div>

      {/* Recessed plot area + baseline: the "instrument screen" read. */}
      <div
        role="img"
        aria-label={entries.map(([k, c]) => `${k}: ${c} deals`).join(', ')}
        className="panel-sunken mt-3 flex h-28 items-end gap-1 px-2 pb-1 pt-3"
      >
        {entries.map(([k, c]) => {
          const isPeak = c === max;
          return (
            <div
              key={k}
              className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1"
            >
              <span
                className={`num text-[10px] leading-none ${isPeak ? 'font-bold text-zinc-900' : 'text-zinc-500'}`}
              >
                {c}
              </span>
              {/* NB: tooltip is a `title` *attribute* — an HTML <title> element
                  here would be hoisted into <head> and hijack document.title. */}
              <div
                title={`${k}: ${c} deals`}
                style={{ height: `${max > 0 ? Math.max((c / max) * 100, 4) : 0}%` }}
                className={`w-full rounded-sm transition-colors duration-150 ${
                  isPeak
                    ? 'bg-emerald-600 shadow-[0_0_12px_-2px_rgba(16,185,129,0.6)]'
                    : 'bg-emerald-500/40 hover:bg-emerald-500'
                }`}
              />
            </div>
          );
        })}
      </div>

      {/* One slot per bar so ticks stay aligned, but the label is allowed
          to bleed symmetrically out of its slot instead of being clipped. */}
      <div className="mt-1.5 flex gap-1 px-2" aria-hidden="true">
        {entries.map(([k], i) => (
          <span key={k} className="flex min-w-0 flex-1 justify-center overflow-visible">
            <span className="micro-label whitespace-nowrap text-[9px]">
              {i % showEvery === 0 ? k : ''}
            </span>
          </span>
        ))}
      </div>

      {undated > 0 && (
        <p className="caption mt-1.5">
          {undated} undated deal{undated === 1 ? '' : 's'} excluded.
        </p>
      )}
    </div>
  );
}