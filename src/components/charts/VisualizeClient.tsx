'use client';

import React, { useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import type { Company, Deal, Relationship } from '@/lib/types';
import { formatCurrency } from '@/lib/formatters';
import { BubbleChart } from './BubbleChart';
import { CircularFlow } from './CircularFlow';
import { SectorBars } from './SectorBars';
import { DateHistogram, quarterLabel, quarterRange } from './DateHistogram';
import { Sparkline } from './Sparkline';
import { AmountBars } from './AmountBars';
import { DEAL_TYPE_ORDER, dealTypeColor, dealTypeLabel } from './chartTheme';
import { chartHitProps, pct } from './chartInteraction';
import {
  Search,
  RotateCcw,
  Waves,
  Repeat2,
  Layers,
  SlidersHorizontal,
  CalendarRange,
  Network,
  BarChart3,
} from 'lucide-react';

interface VisualizeClientProps {
  deals: Deal[];
  relationships: Relationship[];
  companies: Company[];
  initialQuery?: string;
}

const EVIDENCE_OPTIONS = [
  { key: 'all', label: 'All evidence levels' },
  { key: 'confirmed_primary', label: 'Primary Filing' },
  { key: 'reported_secondary', label: 'Secondary Report' },
  { key: 'announced_not_completed', label: 'Announced (Pending)' },
  { key: 'estimated', label: 'Estimated' },
  { key: 'disputed', label: 'Disputed' },
  { key: 'superseded', label: 'Superseded' },
];

const EVIDENCE_LABELS: Record<string, string> = {
  confirmed_primary: 'Primary filing',
  reported_secondary: 'Secondary report',
  announced_not_completed: 'Announced',
  estimated: 'Estimated',
  disputed: 'Disputed',
  superseded: 'Superseded',
};

/** View tabs. One dataset, five framings — switched in place, never re-fetched. */
const VIEWS = [
  { id: 'overview', label: 'Overview', Icon: BarChart3, tone: 'mint' as const },
  { id: 'bubbles', label: 'Scale', Icon: Waves, tone: 'mint' as const },
  { id: 'circular', label: 'Circularity', Icon: Repeat2, tone: 'amber' as const },
  { id: 'sectors', label: 'Composition', Icon: Layers, tone: 'sky' as const },
  { id: 'timeline', label: 'Timeline', Icon: CalendarRange, tone: 'sky' as const },
];

/** Shared section header: numbered terminal marker + eyebrow + title. */
function ViewHeading({
  id,
  step,
  label,
  title,
  Icon,
  tone,
  hint,
}: {
  id: string;
  step: string;
  label: string;
  title: string;
  Icon: typeof Waves;
  tone: 'mint' | 'amber' | 'sky';
  hint?: string;
}) {
  // Tone name maps 1:1 onto the shared `.icon-tile-*` primitives, so a new
  // colour never needs another inline class string here.
  const iconTone = `icon-tile icon-tile-${tone === 'mint' ? 'ink' : tone}`;
  const eyebrowTone =
    tone === 'amber' ? 'eyebrow-amber' : tone === 'sky' ? 'eyebrow-sky' : 'eyebrow-mint';

  return (
    <div className="section-head">
      <div className="flex items-center gap-3">
        <span className={iconTone} aria-hidden="true">
          <Icon className="h-4 w-4" />
        </span>
        <div>
          <div className={`eyebrow ${eyebrowTone}`}>{step}</div>
          <h2 id={id} className="mt-1 text-xl font-bold tracking-tight text-zinc-950 sm:text-2xl">
            {title}
          </h2>
          <span className="sr-only">{label}</span>
        </div>
      </div>
      {hint && <span className="micro-label max-w-xs sm:text-right">{hint}</span>}
    </div>
  );
}

export function VisualizeClient({ deals, relationships, companies, initialQuery = '' }: VisualizeClientProps) {
  const [view, setView] = useState('overview');
  const [dealType, setDealType] = useState('all');
  const [evidence, setEvidence] = useState('all');
  const [query, setQuery] = useState(initialQuery);
  /** `YYQn` quarter pinned from the timeline view; filters every chart. */
  const [quarter, setQuarter] = useState<string | null>(null);
  /** Deal type hovered in one chart, emphasised in the others. */
  const [hoverType, setHoverType] = useState<string | null>(null);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const quarterBounds = useMemo(() => (quarter ? quarterRange(quarter) : null), [quarter]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return deals.filter((d) => {
      if (dealType !== 'all' && d.deal_type !== dealType) return false;
      if (evidence !== 'all' && d.evidence_level !== evidence) return false;
      if (quarterBounds && d.announcement_date) {
        // Compare on the date prefix so ISO, ISO-timestamp and YYYY-MM all
        // resolve the same way without pulling in a date library.
        const day = d.announcement_date.slice(0, 10);
        if (day < quarterBounds.from || day > quarterBounds.to) return false;
      } else if (quarterBounds && !d.announcement_date) {
        return false;
      }
      if (q !== '') {
        const hay = [
          d.title,
          d.summary,
          d.geography ?? '',
          ...(d.parties ?? []).map((p) => p.company?.name ?? ''),
        ]
          .join(' ')
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [deals, dealType, evidence, query, quarterBounds]);

  const hasFilters = dealType !== 'all' || evidence !== 'all' || query.trim() !== '' || quarter !== null;

  // Derived stats for the overview tab. Disclosed-only; nothing is imputed.
  const overview = useMemo(() => {
    const disclosed = filtered.filter((d) => d.amount_disclosed && d.amount_value);
    const disclosedTotal = disclosed.reduce((s, d) => s + (d.amount_value ?? 0), 0);
    const byType = new Map<string, { total: number; count: number }>();
    for (const d of disclosed) {
      const e = byType.get(d.deal_type) ?? { total: 0, count: 0 };
      e.total += d.amount_value ?? 0;
      e.count += 1;
      byType.set(d.deal_type, e);
    }
    const typeRows = [...byType.entries()]
      .map(([key, v]) => ({ key, label: dealTypeLabel(key), value: v.total, count: v.count, color: dealTypeColor(key) }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);

    const quarters = new Map<string, number>();
    for (const d of filtered) {
      const key = d.announcement_date;
      if (!key || key.length < 7) continue;
      const month = parseInt(key.slice(5, 7), 10);
      const year = key.slice(0, 4);
      if (!/^\d{4}$/.test(year) || Number.isNaN(month) || month < 1 || month > 12) continue;
      const q = Math.floor((month - 1) / 3) + 1;
      const k = `${year.slice(2)}Q${q}`;
      quarters.set(k, (quarters.get(k) ?? 0) + (d.amount_disclosed ? (d.amount_value ?? 0) : 0));
    }
    const quarterEntries = [...quarters.entries()].sort((a, b) => {
      const expand = (k: string) => `20${k.slice(0, 2)}${k.slice(2)}`;
      return expand(a[0]).localeCompare(expand(b[0]));
    });
    const topDeal = disclosed.reduce<(typeof disclosed)[number] | null>(
      (best, d) => (!best || (d.amount_value ?? 0) > (best.amount_value ?? 0) ? d : best),
      null
    );
    const evidenceCounts = new Map<string, number>();
    for (const d of filtered) {
      evidenceCounts.set(d.evidence_level, (evidenceCounts.get(d.evidence_level) ?? 0) + 1);
    }
    const evidenceRows = [...evidenceCounts.entries()]
      .map(([key, count]) => ({ key, label: EVIDENCE_LABELS[key] ?? key, count }))
      .sort((a, b) => b.count - a.count);

    return { disclosedTotal, typeRows, quarterEntries, topDeal, evidenceRows, undisclosed: filtered.length - disclosed.length };
  }, [filtered]);

  const presentTypes = useMemo(
    () => DEAL_TYPE_ORDER.filter((t) => deals.some((d) => d.deal_type === t)),
    [deals]
  );

  const toggleQuarter = (q: string | null) => setQuarter((cur) => (cur === q ? null : q));
  const activeTabIndex = VIEWS.findIndex((v) => v.id === view);

  /** Roving arrow-key navigation across the view tabs (WAI-ARIA tabs). */
  const onTabKeyDown = (ev: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
    let next: number | null = null;
    if (ev.key === 'ArrowRight' || ev.key === 'ArrowDown') next = (index + 1) % VIEWS.length;
    else if (ev.key === 'ArrowLeft' || ev.key === 'ArrowUp') next = (index - 1 + VIEWS.length) % VIEWS.length;
    else if (ev.key === 'Home') next = 0;
    else if (ev.key === 'End') next = VIEWS.length - 1;
    if (next === null) return;
    ev.preventDefault();
    setView(VIEWS[next].id);
    tabRefs.current[next]?.focus();
  };

  return (
    <div className="space-y-8">
      {/* Filter console */}
      <div className="panel space-y-4 p-4 sm:p-5">
        <div className="flex items-center gap-2 border-b border-zinc-100 pb-2">
          <SlidersHorizontal aria-hidden="true" className="h-3.5 w-3.5 text-emerald-600" />
          <h2 className="panel-title">Filter console</h2>
          <span className="micro-label ml-auto">Filters every chart below, live</span>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="sm:col-span-2">
            <label htmlFor="viz-q" className="field-label">
              Search deals
            </label>
            <div className="relative mt-1.5">
              <Search aria-hidden="true" className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-500" />
              <input
                id="viz-q"
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="e.g. CoreWeave, NVIDIA, nuclear…"
                className="field-search pl-9"
              />
            </div>
          </div>
          <div>
            <label htmlFor="viz-evidence" className="field-label">
              Evidence
            </label>
            <select
              id="viz-evidence"
              value={evidence}
              onChange={(e) => setEvidence(e.target.value)}
              className="field-native mt-1.5"
            >
              {EVIDENCE_OPTIONS.map((o) => (
                <option key={o.key} value={o.key}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Deal-type chips: real client-side filtering, shared by every chart. */}
        <div className="border-t border-zinc-100 pt-3">
          <div className="flex items-baseline justify-between gap-2">
            <span className="field-label">Deal type</span>
            <span className="micro-label">Click to isolate · click again to clear</span>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-1.5" role="group" aria-label="Filter by deal type">
            {presentTypes.map((t) => {
              const count = deals.filter((d) => d.deal_type === t).length;
              const pressed = dealType === t;
              const emphasised = hoverType === t;
              return (
                <button
                  key={t}
                  type="button"
                  className="chip"
                  aria-pressed={pressed ? 'true' : 'false'}
                  data-active={emphasised ? 'true' : undefined}
                  onClick={() => setDealType(pressed ? 'all' : t)}
                  onMouseEnter={() => setHoverType(t)}
                  onMouseLeave={() => setHoverType(null)}
                  onFocus={() => setHoverType(t)}
                  onBlur={() => setHoverType(null)}
                  style={emphasised && !pressed ? { borderColor: dealTypeColor(t), boxShadow: `0 0 0 1px ${dealTypeColor(t)}55` } : undefined}
                >
                  <span
                    aria-hidden="true"
                    className="inline-block h-2 w-2 shrink-0 rounded-full"
                    style={{ backgroundColor: dealTypeColor(t) }}
                  />
                  {dealTypeLabel(t)}
                  <span className="chip-count">{count}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* View tabs: switch framing in place, no reload, no refetch. */}
        <div className="border-t border-zinc-100 pt-3">
          <div className="flex items-baseline justify-between gap-2">
            <span className="field-label">View</span>
            <span className="micro-label">← → to move between views</span>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-1.5" role="tablist" aria-label="Visualization view">
            {VIEWS.map((v, i) => (
              <button
                key={v.id}
                type="button"
                role="tab"
                id={`viz-tab-${v.id}`}
                aria-selected={view === v.id}
                aria-controls={`viz-panel-${v.id}`}
                tabIndex={activeTabIndex === i ? 0 : -1}
                ref={(el) => {
                  tabRefs.current[i] = el;
                }}
                onClick={() => setView(v.id)}
                onKeyDown={(ev) => onTabKeyDown(ev, i)}
                className={view === v.id ? 'chip chip-active' : 'chip'}
              >
                <v.Icon aria-hidden="true" className="h-3 w-3" />
                {v.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-zinc-100 pt-3">
          <p className="font-mono text-[11px] tabular-nums text-zinc-500" role="status" aria-live="polite">
            <span className="num font-bold text-zinc-900">{filtered.length}</span> of{' '}
            <span className="num">{deals.length}</span> deals in view
            {dealType !== 'all' && <> · {dealTypeLabel(dealType)}</>}
            {quarter && (
              <>
                {' '}
                · {quarterLabel(quarter)}
                <button
                  type="button"
                  className="ml-1.5 rounded underline underline-offset-2 hover:text-emerald-800"
                  onClick={() => setQuarter(null)}
                >
                  clear
                </button>
              </>
            )}
          </p>
          {hasFilters && (
            <button
              type="button"
              onClick={() => {
                setDealType('all');
                setEvidence('all');
                setQuery('');
                setQuarter(null);
              }}
              className="pill pill-mint transition-colors hover:bg-emerald-100"
            >
              <RotateCcw aria-hidden="true" className="h-3 w-3" />
              Reset filters
            </button>
          )}
        </div>
      </div>

      {/* 00 — Overview: the cross-chart summary. */}
      {view === 'overview' && (
        <section
          role="tabpanel"
          id="viz-panel-overview"
          aria-labelledby="viz-tab-overview"
          className="space-y-6"
        >
          <div className="panel p-4 sm:p-6">
            <ViewHeading
              id="viz-overview"
              step="00 / Summary"
              label="Summary"
              title="What the current filter set contains"
              Icon={BarChart3}
              tone="mint"
              hint="Hover any bar to read its share of the disclosed pool"
            />
            <dl className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
              {[
                {
                  label: 'Deals in view',
                  value: String(filtered.length),
                  note: `${pct(filtered.length, deals.length)} of the ledger`,
                },
                {
                  label: 'Disclosed $',
                  value: formatCurrency(overview.disclosedTotal),
                  note: `${overview.undisclosed} undisclosed excluded`,
                },
                {
                  label: 'Largest single deal',
                  value: overview.topDeal ? formatCurrency(overview.topDeal.amount_value, overview.topDeal.amount_currency) : '—',
                  note: overview.topDeal ? overview.topDeal.title : 'no disclosed amounts',
                },
                {
                  label: 'Quarter pinned',
                  value: quarter ? quarterLabel(quarter) : '—',
                  note: quarter ? 'filtering every chart' : 'select a quarter in Timeline',
                },
              ].map((stat) => (
                <div key={stat.label} className="panel-sunken px-4 py-3">
                  <dt className="stat-label">{stat.label}</dt>
                  <dd className="stat-value text-xl">{stat.value}</dd>
                  <dd className="stat-note line-clamp-2">{stat.note}</dd>
                </div>
              ))}
            </dl>

            <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-2">
              <AmountBars
                rows={overview.typeRows.map((r) => ({
                  label: `${r.label} · ${r.count} deal${r.count === 1 ? '' : 's'}`,
                  value: r.value,
                  color: r.color,
                }))}
                title="Disclosed $ by type (filtered)"
                emptyNote="No disclosed amounts in the current filter set."
              />
              <div>
                <Sparkline
                  data={overview.quarterEntries.map(([, v]) => v)}
                  labels={overview.quarterEntries.map(([k]) => quarterLabel(k))}
                  stroke="#059669"
                />
                <div className="mt-4">
                  <h3 className="panel-title border-b border-zinc-100 pb-2">Evidence mix (filtered)</h3>
                  <ul className="mt-3 space-y-1.5">
                    {overview.evidenceRows.map((row) => (
                      <li
                        key={row.key}
                        className="chart-row -mx-2 flex items-center gap-3 rounded-r px-2 py-1"
                        {...chartHitProps<HTMLLIElement>({
                          label: `${row.label}: ${row.count} deals, ${pct(row.count, filtered.length)} of the filter set`,
                          interactive: false,
                          focusable: true,
                          onEnter: () => setEvidence(row.key),
                          onLeave: () => setEvidence((cur) => (cur === row.key ? 'all' : cur)),
                        })}
                      >
                        <span className="min-w-0 flex-1 truncate text-xs font-medium text-zinc-800">{row.label}</span>
                        <span className="num text-xs font-semibold text-zinc-600">{row.count}</span>
                        <span className="h-1.5 w-24 shrink-0 overflow-hidden rounded-full bg-zinc-100">
                          <span
                            className="block h-full rounded-full bg-emerald-500"
                            style={{ width: `${pct(row.count, filtered.length)}` }}
                          />
                        </span>
                      </li>
                    ))}
                  </ul>
                  <p className="caption mt-2">Hover or focus a level to filter the whole page to it.</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 01 — Scale */}
      {view === 'bubbles' && (
        <section role="tabpanel" id="viz-panel-bubbles" aria-labelledby="viz-tab-bubbles" className="space-y-3">
          <ViewHeading
            id="viz-bubbles"
            step="01 / Scale"
            label="Scale"
            title="Deal sizes at a glance"
            Icon={Waves}
            tone="mint"
            hint="Hover or Tab a bubble for its full record card"
          />
          <p className="max-w-3xl text-xs text-zinc-500 sm:text-sm">
            Every deal in view as a bubble. Area is proportional to disclosed dollars; dashed grey bubbles are
            undisclosed amounts. Select any bubble to open its cited deal record, or click a legend entry to
            isolate one deal type.
          </p>
          <div className="panel p-4 sm:p-6">
            <BubbleChart
              deals={filtered}
              activeType={dealType === 'all' ? (hoverType ?? null) : dealType}
              onTypeToggle={(t) => setDealType(t ?? 'all')}
            />
          </div>
        </section>
      )}

      {/* 02 — Circularity */}
      {view === 'circular' && (
        <section role="tabpanel" id="viz-panel-circular" aria-labelledby="viz-tab-circular" className="space-y-3">
          <ViewHeading
            id="viz-circular"
            step="02 / Circularity"
            label="Circularity"
            title="Circular financing detector"
            Icon={Repeat2}
            tone="amber"
            hint="Hover a node to list its counterparties"
          />
          <p className="max-w-3xl text-xs text-zinc-500 sm:text-sm">
            The most connected companies on a ring, with capital flowing along the chords. Amber chords flag
            circular loops &mdash; e.g. Microsoft &harr; OpenAI &mdash; where money or binding commitments
            travel in a circle. Hover a node to isolate its ties; click to open the company record. See the{' '}
            <Link href="/relationships" className="link-ledger-strong">
              relationship flow map
            </Link>{' '}
            for the full tabular ledger.
          </p>
          <div className="panel p-4 sm:p-6">
            <CircularFlow deals={filtered} relationships={relationships} companies={companies} />
          </div>
        </section>
      )}

      {/* 03 — Composition */}
      {view === 'sectors' && (
        <section role="tabpanel" id="viz-panel-sectors" aria-labelledby="viz-tab-sectors" className="space-y-3">
          <ViewHeading
            id="viz-sectors"
            step="03 / Composition"
            label="Composition"
            title="Where the disclosed dollars concentrate"
            Icon={Layers}
            tone="sky"
            hint="Hover a type to trace it through the page"
          />
          <p className="max-w-3xl text-xs text-zinc-500 sm:text-sm">
            Totals aggregate only disclosed amounts &mdash; undisclosed deals are counted separately and never
            imputed.
          </p>
          <div className="panel p-4 sm:p-6">
            <SectorBars deals={filtered} activeType={dealType} onTypeHover={setHoverType} />
          </div>
        </section>
      )}

      {/* 04 — Timeline */}
      {view === 'timeline' && (
        <section role="tabpanel" id="viz-panel-timeline" aria-labelledby="viz-tab-timeline" className="space-y-3">
          <ViewHeading
            id="viz-timeline"
            step="04 / Timeline"
            label="Timeline"
            title="Deal flow through time"
            Icon={CalendarRange}
            tone="sky"
            hint="Select a quarter to filter the whole page"
          />
          <p className="max-w-3xl text-xs text-zinc-500 sm:text-sm">
            Quarterly deal counts with the disclosed dollars behind them. Selecting a bar pins that quarter as
            a filter across every view.
          </p>
          <div className="panel p-4 sm:p-6">
            <DateHistogram
              deals={filtered}
              title="Filtered deal flow per quarter"
              selectedQuarter={quarter}
              onBarSelect={toggleQuarter}
            />
            {quarter && (
              <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-zinc-100 pt-4">
                <Network aria-hidden="true" className="h-3.5 w-3.5 text-emerald-600" />
                <span className="caption">
                  Pinned to {quarterLabel(quarter)} ({quarterBounds?.from} → {quarterBounds?.to}) &mdash;{' '}
                  <span className="num font-bold text-zinc-900">{filtered.length}</span> of {deals.length}{' '}
                  deals.
                </span>
                <button
                  type="button"
                  className="pill pill-neutral transition-colors hover:border-zinc-400 hover:text-zinc-900"
                  onClick={() => setQuarter(null)}
                >
                  Clear quarter
                </button>
              </div>
            )}
          </div>
        </section>
      )}

      {filtered.length === 0 && view !== 'overview' && (
        <p className="empty-note">
          Nothing matches the current filters &mdash; widen the search text or clear a chip to repopulate the charts.
        </p>
      )}
    </div>
  );
}