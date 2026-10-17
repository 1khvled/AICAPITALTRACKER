import React from 'react';
import type { FreshFiling } from '../../lib/data/fresh';
import type { Source } from '../../lib/types';

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
 * Purely derived from ingest output — no invented data.
 */
export function IngestTimeline({ filings, queueCount }: IngestTimelineProps) {
  const buckets = new Map<string, number>();
  for (const f of filings) {
    const ym = (f.filed_at || '').slice(0, 7);
    if (!/^\d{4}-\d{2}$/.test(ym)) continue;
    buckets.set(ym, (buckets.get(ym) ?? 0) + 1);
  }
  const entries = [...buckets.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  const max = Math.max(1, ...entries.map(([, n]) => n));

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
        <div
          className="flex h-36 items-end gap-2 border-b border-zinc-200 pb-0 sm:gap-3"
          role="img"
          aria-label={`Fresh SEC filings per month: ${entries.map(([ym, n]) => `${ym} ${n}`).join(', ')}. ${queueCount} candidates awaiting review.`}
        >
          {entries.map(([ym, n]) => (
            <div key={ym} className="flex h-full flex-1 flex-col items-center justify-end gap-1">
              <span className="num text-[10px] font-bold text-zinc-700">{n}</span>
              <div
                title={`${ym}: ${n} filing${n === 1 ? '' : 's'}`}
                style={{ height: `${Math.max(8, (n / max) * 88)}px` }}
                className="w-full max-w-16 rounded-t bg-gradient-to-t from-emerald-600 to-emerald-400 transition-opacity duration-150 hover:opacity-80"
              />
              <span className="micro-label whitespace-nowrap text-[9px]">{monthLabel(ym)}</span>
            </div>
          ))}
        </div>
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
 */
export function PublisherDonut({ sources }: { sources: Source[] }) {
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
          <circle cx="80" cy="80" r={R} fill="none" stroke="#f4f4f5" strokeWidth="22" />
          {segments.map((s) => (
            <circle
              key={s.t}
              cx="80"
              cy="80"
              r={R}
              fill="none"
              stroke={s.color}
              strokeWidth="22"
              strokeDasharray={`${Math.max(0, s.frac * C - 1.5)} ${C}`}
              strokeDashoffset={s.offset}
              transform="rotate(-90 80 80)"
            />
          ))}
          <text x="80" y="76" textAnchor="middle" className="fill-zinc-950" fontSize="22" fontWeight="800" fontFamily="monospace">
            {sources.length}
          </text>
          <text x="80" y="94" textAnchor="middle" className="fill-zinc-500" fontSize="10" fontFamily="monospace">
            CITATIONS
          </text>
        </svg>
        <ul className="w-full flex-1 space-y-1.5 text-xs">
          {segments.map((s) => (
            <li key={s.t} className="flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full ring-1 ring-inset ring-black/10"
                style={{ backgroundColor: s.color }}
                aria-hidden="true"
              />
              <span className="flex-1 truncate text-zinc-700">{typeLabel(s.t)}</span>
              <span className="num font-bold text-zinc-950">{s.n}</span>
              <span className="num w-10 text-right text-zinc-500">
                {Math.round((s.n / total) * 100)}%
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
