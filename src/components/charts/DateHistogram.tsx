'use client';

import React, { useState } from 'react';
import type { Deal } from '@/lib/types';
import { formatCurrency } from '@/lib/formatters';
import { chartHitProps, pct } from './chartInteraction';

/**
 * Quarter buckets are `YYQn` keys. Exported so the interactive playground can
 * apply the very same bucket math to a client-side quarter filter instead of
 * re-deriving (and mis-deriving) the range.
 */
type QuarteredDeal = Pick<Deal, 'announcement_date' | 'id'> &
  Partial<Pick<Deal, 'amount_value' | 'amount_disclosed' | 'deal_type'>>;

interface DateHistogramProps {
  deals: QuarteredDeal[];
  title?: string;
  /** Wire up hover/focus highlighting. Default true. */
  interactive?: boolean;
  /** `YYQn` bucket the parent has selected (e.g. from another chart). */
  selectedQuarter?: string | null;
  /** Called when a bar is activated — click, Enter or Space. */
  onBarSelect?: (quarter: string | null) => void;
}

function quarterKey(dateStr: string | null): string | null {
  if (!dateStr || dateStr.length < 7) return null;
  const year = dateStr.slice(0, 4);
  const month = parseInt(dateStr.slice(5, 7), 10);
  if (!/^\d{4}$/.test(year) || Number.isNaN(month) || month < 1 || month > 12) return null;
  const q = Math.floor((month - 1) / 3) + 1;
  return `${year.slice(2)}Q${q}`;
}

/** `25Q3` → `2025-Q3`. Readable labels without inventing new formats. */
export function quarterLabel(key: string): string {
  const m = /^(\d{2})Q([1-4])$/.exec(key);
  return m ? `20${m[1]}-Q${m[2]}` : key;
}

/** Inclusive ISO bounds of a `YYQn` bucket — for client-side range filtering. */
export function quarterRange(key: string): { from: string; to: string } | null {
  const m = /^(\d{2})Q([1-4])$/.exec(key);
  if (!m) return null;
  const year = `20${m[1]}`;
  const q = Number(m[2]);
  const startMonth = (q - 1) * 3 + 1;
  const endMonth = startMonth + 2;
  const pad = (n: number) => String(n).padStart(2, '0');
  const lastDay = new Date(Date.UTC(Number(year), endMonth, 0)).getUTCDate();
  return {
    from: `${year}-${pad(startMonth)}-01`,
    to: `${year}-${pad(endMonth)}-${pad(lastDay)}`,
  };
}

interface Bucket {
  key: string;
  count: number;
  disclosed: number;
  byType: Map<string, number>;
}

/**
 * Zero-dependency interactive quarterly deal-count histogram.
 * Buckets deals by announcement_date quarter. Each bar is a control: hover or
 * keyboard-focus reveals count + disclosed dollars, and activating it selects
 * the quarter (reported through `onBarSelect`).
 */
export function DateHistogram({
  deals,
  title = 'Deals per quarter',
  interactive = true,
  selectedQuarter = null,
  onBarSelect,
}: DateHistogramProps) {
  const [active, setActive] = useState<string | null>(null);

  const { entries, undated, max } = (() => {
    const buckets = new Map<string, Bucket>();
    let undatedCount = 0;
    let peak = 0;
    let peakMoney = 0;
    for (const d of deals) {
      const k = quarterKey(d.announcement_date);
      if (!k) {
        undatedCount += 1;
        continue;
      }
      const bucket = buckets.get(k) ?? { key: k, count: 0, disclosed: 0, byType: new Map<string, number>() };
      bucket.count += 1;
      if (d.amount_disclosed && d.amount_value) bucket.disclosed += d.amount_value;
      if (d.deal_type) bucket.byType.set(d.deal_type, (bucket.byType.get(d.deal_type) ?? 0) + 1);
      buckets.set(k, bucket);
    }
    const sorted = [...buckets.values()].sort((a, b) => {
      const expand = (k: string) => `20${k.slice(0, 2)}${k.slice(2)}`;
      return expand(a.key).localeCompare(expand(b.key));
    });
    for (const b of sorted) {
      peak = Math.max(peak, b.count);
      peakMoney = Math.max(peakMoney, b.disclosed);
    }
    return { entries: sorted, undated: undatedCount, max: { count: peak, money: peakMoney } };
  })();

  if (entries.length === 0) {
    return (
      <div>
        <h3 className="panel-title">{title}</h3>
        <p className="empty-note mt-3">No dated deals under the current filters.</p>
      </div>
    );
  }

  const showEvery = Math.max(1, Math.ceil(entries.length / 12));
  const activeBucket = entries.find((b) => b.key === active) ?? null;
  const selectables = interactive && Boolean(onBarSelect);
  const topTypeOf = (b: Bucket): string => {
    let best: string | null = null;
    let bestN = 0;
    for (const [t, n] of b.byType) {
      if (n > bestN) {
        best = t;
        bestN = n;
      }
    }
    return best ? best.replace(/_/g, ' ') : '—';
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="panel-title">{title}</h3>
        <span className="pill pill-neutral">
          peak {max.count} · {entries.length} quarters
        </span>
      </div>

      {/* Recessed plot area + baseline: the "instrument screen" read. */}
      <div
        role="group"
        aria-label={`${title}. ${entries.map((b) => `${quarterLabel(b.key)}: ${b.count} deals`).join(', ')}.`}
        className="panel-sunken mt-3 flex h-28 items-end gap-1 px-2 pb-1 pt-3"
      >
        {entries.map((b) => {
          const isPeak = b.count === max.count;
          const on = active === b.key;
          const selected = selectedQuarter === b.key;
          const dimmed = (active !== null || Boolean(selectedQuarter)) && !on && !selected;
          const heightPct = max.count > 0 ? Math.max((b.count / max.count) * 100, 4) : 0;
          return (
            <div
              key={b.key}
              className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1"
              {...(selectables
                ? chartHitProps<HTMLDivElement>({
                    label: `${quarterLabel(b.key)}: ${b.count} deals, ${
                      b.disclosed > 0 ? formatCurrency(b.disclosed) : 'no disclosed amount'
                    }. Select to filter the page to this quarter.`,
                    interactive: true,
                    onEnter: () => setActive(b.key),
                    onLeave: () => setActive((cur) => (cur === b.key ? null : cur)),
                    onActivate: () => onBarSelect?.(selected ? null : b.key),
                  })
                : chartHitProps<HTMLDivElement>({
                    label: `${quarterLabel(b.key)}: ${b.count} deals, ${
                      b.disclosed > 0 ? formatCurrency(b.disclosed) : 'no disclosed amount'
                    }`,
                    interactive: false,
                    focusable: interactive,
                    onEnter: () => interactive && setActive(b.key),
                    onLeave: () => setActive((cur) => (cur === b.key ? null : cur)),
                  }))}
              data-active={on || selected ? 'true' : undefined}
              style={{ opacity: dimmed ? 0.4 : 1, borderRadius: 6 }}
            >
              <span
                className={`num text-[10px] leading-none ${
                  on || selected ? 'font-bold text-zinc-900' : isPeak ? 'font-bold text-zinc-700' : 'text-zinc-500'
                }`}
              >
                {b.count}
              </span>
              {/* NB: tooltip is a `title` *attribute* — an HTML <title> element
                  here would be hoisted into <head> and hijack document.title. */}
              <div
                title={`${quarterLabel(b.key)}: ${b.count} deal${b.count === 1 ? '' : 's'}${
                  b.disclosed > 0 ? ` · ${formatCurrency(b.disclosed)} disclosed` : ' · no disclosed amount'
                }`}
                style={{
                  height: `${heightPct}%`,
                  width: selected ? '100%' : '86%',
                  outline: selected ? '2px solid var(--act)' : undefined,
                  outlineOffset: '1px',
                }}
                className={`chart-bar rounded-sm ${on || selected ? 'bg-emerald-600 shadow-[0_0_14px_-2px_rgba(16,185,129,0.8)]' : isPeak ? 'bg-emerald-600 shadow-[0_0_12px_-2px_rgba(16,185,129,0.6)]' : 'bg-emerald-500/45'}`}
              />
            </div>
          );
        })}
      </div>

      {/* One slot per bar so ticks stay aligned, but the label is allowed
          to bleed symmetrically out of its slot instead of being clipped. */}
      <div className="mt-1.5 flex gap-1 px-2" aria-hidden="true">
        {entries.map((b, i) => (
          <span key={b.key} className="flex min-w-0 flex-1 justify-center overflow-visible">
            <span
              className={`micro-label whitespace-nowrap text-[9px] ${
                active === b.key || selectedQuarter === b.key ? 'text-emerald-700' : ''
              }`}
            >
              {i % showEvery === 0 ? b.key : ''}
            </span>
          </span>
        ))}
      </div>

      {/* Readout — always rendered so the panel never reflows on hover. */}
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <span className={`chart-readout ${activeBucket ? '' : 'chart-readout-muted'}`}>
          {activeBucket ? (
            <>
              {quarterLabel(activeBucket.key)} · {activeBucket.count} deal
              {activeBucket.count === 1 ? '' : 's'} ·{' '}
              {activeBucket.disclosed > 0 ? formatCurrency(activeBucket.disclosed) : 'undisclosed'} ·{' '}
              {pct(activeBucket.count, max.count)} of peak
            </>
          ) : (
            'Hover, Tab or select a quarter'
          )}
        </span>
        {selectedQuarter && (
          <span className="pill pill-mint">
            Filtered to {quarterLabel(selectedQuarter)}
            <button
              type="button"
              className="ml-1 rounded text-emerald-800 underline underline-offset-2"
              onClick={() => onBarSelect?.(null)}
            >
              clear
            </button>
          </span>
        )}
      </div>

      {activeBucket && activeBucket.byType.size > 0 && (
        <p className="mt-1.5 caption">
          Most common type in {quarterLabel(activeBucket.key)}: {topTypeOf(activeBucket)} · undisclosed
          amounts are counted in the bar but excluded from the dollar total.
        </p>
      )}

      {undated > 0 && (
        <p className="caption mt-1.5">
          {undated} undated deal{undated === 1 ? '' : 's'} excluded.
        </p>
      )}
    </div>
  );
}