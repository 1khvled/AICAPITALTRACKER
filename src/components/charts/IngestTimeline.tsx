'use client';

import React, { useState } from 'react';
import type { FreshFiling } from '../../lib/data/fresh';
import type { Source } from '../../lib/types';
import { chartHitProps, pct } from './chartInteraction';

const SHORT_MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
] as const;

function monthLabel(ym: string): string {
  const [y, m] = ym.split('-');
  const month = SHORT_MONTHS[Number(m) - 1] ?? '';
  return `${month} ’${(y ?? '').slice(2)}`;
}

interface IngestTimelineProps {
  filings: FreshFiling[];
  queueCount: number;
}

/**
 * Monthly bars of real SEC filing metadata from the latest ingest
 * (grouped by `filed_at`), plus the quarantined discovery-queue count.
 * Purely derived from ingest output — no invented data. Bars are focusable and
 * report the month's volume + share of the peak.
 */
export function IngestTimeline({ filings, queueCount }: IngestTimelineProps) {
  const [active, setActive] = useState<string | null>(null);
  const buckets = new Map<string, number>();
  for (const f of filings) {
    const ym = (f.filed_at || '').slice(0, 7);
    if (!/^\d{4}-\d{2}$/.test(ym)) continue;
    buckets.set(ym, (buckets.get(ym) ?? 0) + 1);
  }
  const entries = [...buckets.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  const max = Math.max(1, ...entries.map(([, n]) => n));
  const total = entries.reduce((s, [, n]) => s + n, 0);
  const activeCount = active !== null ? buckets.get(active) ?? 0 : 0;

  return (
    <div className="space-y-3">
      <div className="border-b border-zinc-100 pb-2">
        <h3 className="panel-title">Ingest volume by filing month</h3>
        <p className="mt-1 text-xs text-zinc-500">
          Real filing metadata from the latest ingest run — review leads only, not verified deals.
        </p>
      </div>
      {entries.length === 0 ? (
        <p className="empty-note">
          No fresh filing metadata yet — run <code className="rounded bg-white px-1">npm run ingest</code>.
        </p>
      ) : (
        <>
          <div
            className="flex h-36 items-end gap-2 border-b border-zinc-200 pb-0 sm:gap-3"
            role="group"
            aria-label={`Fresh SEC filings per month: ${entries.map(([ym, n]) => `${ym} ${n}`).join(', ')}. ${queueCount} candidates awaiting review.`}
          >
            {entries.map(([ym, n]) => {
              const on = active === ym;
              return (
                <div
                  key={ym}
                  className="flex h-full flex-1 flex-col items-center justify-end gap-1"
                  data-active={on ? 'true' : undefined}
                  {...chartHitProps<HTMLDivElement>({
                    label: `${monthLabel(ym)} ${ym}: ${n} filing${n === 1 ? '' : 's'}, ${pct(n, max)} of the busiest month`,
                    interactive: false,
                    focusable: true,
                    onEnter: () => setActive(ym),
                    onLeave: () => setActive((cur) => (cur === ym ? null : cur)),
                  })}
                >
                  <span className={`num text-[10px] ${on ? 'font-bold text-emerald-700' : 'font-bold text-zinc-700'}`}>
                    {n}
                  </span>
                  <div
                    title={`${ym}: ${n} filing${n === 1 ? '' : 's'}`}
                    style={{
                      height: `${Math.max(8, (n / max) * 88)}px`,
                      width: on ? '100%' : '82%',
                      outline: on ? '2px solid var(--act)' : undefined,
                      outlineOffset: '1px',
                    }}
                    className={`chart-bar max-w-16 rounded-t bg-gradient-to-t from-emerald-600 to-emerald-400 ${
                      on ? 'shadow-[0_0_18px_-2px_rgba(16,185,129,0.85)]' : ''
                    }`}
                  />
                  <span className="micro-label whitespace-nowrap text-[9px]">{monthLabel(ym)}</span>
                </div>
              );
            })}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className={`chart-readout ${active ? '' : 'chart-readout-muted'}`}>
              {active ? (
                <>
                  {monthLabel(active)} {active} · {activeCount} filing{activeCount === 1 ? '' : 's'} ·{' '}
                  {pct(activeCount, max)} of peak
                </>
              ) : (
                `${total} filing${total === 1 ? '' : 's'} across ${entries.length} month${entries.length === 1 ? '' : 's'}`
              )}
            </span>
            <span className="micro-label ml-auto hidden sm:inline">Hover or Tab a month</span>
          </div>
        </>
      )}
      <p className="caption">
        <span className="font-bold text-amber-700">{queueCount} candidates</span> quarantined in the
        discovery queue awaiting human editorial review — never auto-published as deals.
      </p>
    </div>
  );
}

const TYPE_COLORS: Record<string, string> = {
  primary_filing: '#059669',
  company_release: '#0284c7',
  government_data: '#7c3aed',
  regulator_document: '#d97706',
  reputable_media: '#e11d48',
  research_report: '#64748b',
  other: '#a1a1aa',
};

function typeLabel(t: string): string {
  return t.replace(/_/g, ' ');
}

/**
 * Donut of citation mix by source type, computed live from the registry —
 * shows how much of the ledger rests on primary vs secondary evidence.
 * Hovering or focusing a slice swaps the centre readout for that source type
 * and lights its legend row.
 */
export function PublisherDonut({ sources }: { sources: Source[] }) {
  const [active, setActive] = useState<string | null>(null);
  const groups = new Map<string, number>();
  for (const s of sources) {
    const t = s.source_type || 'other';
    groups.set(t, (groups.get(t) ?? 0) + 1);
  }
  const ranked = [...groups.entries()].sort((a, b) => b[1] - a[1]);
  const total = Math.max(1, sources.length);

  const R = 60;
  const C = 2 * Math.PI * R;
  let acc = 0;
  const segments = ranked.map(([t, n]) => {
    const frac = n / total;
    const seg = { t, n, frac, offset: -acc * C, color: TYPE_COLORS[t] ?? TYPE_COLORS.other };
    acc += frac;
    return seg;
  });
  const activeSeg = active !== null ? segments.find((s) => s.t === active) : undefined;

  return (
    <div className="space-y-3">
      <div className="border-b border-zinc-100 pb-2">
        <h3 className="panel-title">Citation mix by source type</h3>
        <p className="mt-1 text-xs text-zinc-500">
          Where the {sources.length} ledger citations come from — primary filings first.
        </p>
      </div>
      <div className="flex flex-col items-center gap-5 sm:flex-row">
        <svg
          width="160"
          height="160"
          viewBox="0 0 160 160"
          role="img"
          aria-label={`Citation mix: ${ranked.map(([t, n]) => `${typeLabel(t)} ${n}`).join(', ')}`}
        >
          <circle cx="80" cy="80" r={R} fill="none" stroke="#f4f4f5" strokeWidth={22} />
          {segments.map((s) => {
            const on = active === s.t;
            const dim = active !== null && !on;
            return (
              <circle
                key={s.t}
                cx="80"
                cy="80"
                r={R}
                fill="none"
                stroke={s.color}
                strokeWidth={on ? 28 : 22}
                strokeDasharray={`${Math.max(0, s.frac * C - 1.5)} ${C}`}
                strokeDashoffset={s.offset}
                transform="rotate(-90 80 80)"
                className="chart-slice"
                data-dim={dim ? 'true' : undefined}
                {...chartHitProps<SVGCircleElement>({
                  label: `${typeLabel(s.t)}: ${s.n} citations, ${pct(s.n, total)} of the registry`,
                  interactive: false,
                  focusable: true,
                  onEnter: () => setActive(s.t),
                  onLeave: () => setActive((cur) => (cur === s.t ? null : cur)),
                })}
              >
                <title>{`${typeLabel(s.t)}: ${s.n} (${pct(s.n, total)})`}</title>
              </circle>
            );
          })}
          <text
            x="80"
            y="76"
            textAnchor="middle"
            className={activeSeg ? '' : 'fill-zinc-950'}
            fontSize={activeSeg ? 16 : 22}
            fontWeight={800}
            fontFamily="monospace"
            fill={activeSeg?.color}
          >
            {activeSeg ? activeSeg.n : sources.length}
          </text>
          <text x="80" y="94" textAnchor="middle" className="fill-zinc-500" fontSize="10" fontFamily="monospace">
            {activeSeg ? typeLabel(activeSeg.t).slice(0, 14).toUpperCase() : 'CITATIONS'}
          </text>
        </svg>
        <ul className="w-full flex-1 space-y-1.5 text-xs">
          {segments.map((s) => {
            const on = active === s.t;
            return (
              <li
                key={s.t}
                className="chart-row -mx-2 flex items-center gap-2 rounded-r px-2 py-1"
                data-active={on ? 'true' : undefined}
                data-dim={active !== null && !on ? 'true' : undefined}
                {...chartHitProps<HTMLLIElement>({
                  label: `${typeLabel(s.t)}: ${s.n} citations, ${pct(s.n, total)} of the registry`,
                  interactive: false,
                  focusable: true,
                  onEnter: () => setActive(s.t),
                  onLeave: () => setActive((cur) => (cur === s.t ? null : cur)),
                })}
              >
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full ring-1 ring-inset ring-black/10"
                  style={{ backgroundColor: s.color }}
                  aria-hidden="true"
                />
                <span className="flex-1 truncate text-zinc-700">{typeLabel(s.t)}</span>
                <span className="num font-bold text-zinc-950">{s.n}</span>
                <span className="num w-10 text-right text-zinc-500">
                  {pct(s.n, total)}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <span className={`chart-readout ${activeSeg ? '' : 'chart-readout-muted'}`}>
          {activeSeg
            ? `${typeLabel(activeSeg.t)} · ${activeSeg.n} of ${sources.length} · ${pct(activeSeg.n, total)}`
            : 'Hover, Tab or focus a slice'}
        </span>
      </div>
    </div>
  );
}