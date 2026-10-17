'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import type { Company, Deal, Relationship } from '@/lib/types';
import { BubbleChart } from './BubbleChart';
import { CircularFlow } from './CircularFlow';
import { SectorBars } from './SectorBars';
import { Search, RotateCcw, Waves, Repeat2, Layers, SlidersHorizontal } from 'lucide-react';

interface VisualizeClientProps {
  deals: Deal[];
  relationships: Relationship[];
  companies: Company[];
  initialQuery?: string;
}

const DEAL_TYPE_OPTIONS = [
  { key: 'all', label: 'All deal types' },
  { key: 'equity_investment', label: 'Equity Investment' },
  { key: 'debt_credit_facility', label: 'Debt / Credit Facility' },
  { key: 'cloud_compute_contract', label: 'Cloud Compute Contract' },
  { key: 'infrastructure_project_finance', label: 'Infrastructure Project Finance' },
  { key: 'power_purchase_agreement', label: 'Power Purchase Agreement' },
  { key: 'acquisition', label: 'Acquisition' },
  { key: 'strategic_partnership', label: 'Strategic Partnership' },
  { key: 'equipment_purchase', label: 'Equipment Purchase' },
  { key: 'other', label: 'Other' },
];

const EVIDENCE_OPTIONS = [
  { key: 'all', label: 'All evidence levels' },
  { key: 'confirmed_primary', label: 'Primary Filing' },
  { key: 'reported_secondary', label: 'Secondary Report' },
  { key: 'announced_not_completed', label: 'Announced (Pending)' },
  { key: 'estimated', label: 'Estimated' },
  { key: 'disputed', label: 'Disputed' },
  { key: 'superseded', label: 'Superseded' },
];

/** Shared section header: numbered terminal marker + eyebrow + title. */
function ViewHeading({
  id,
  step,
  label,
  title,
  Icon,
  tone,
}: {
  id: string;
  step: string;
  label: string;
  title: string;
  Icon: typeof Waves;
  tone: 'mint' | 'amber' | 'sky';
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
    </div>
  );
}

export function VisualizeClient({ deals, relationships, companies, initialQuery = '' }: VisualizeClientProps) {
  const [dealType, setDealType] = useState('all');
  const [evidence, setEvidence] = useState('all');
  const [query, setQuery] = useState(initialQuery);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return deals.filter((d) => {
      if (dealType !== 'all' && d.deal_type !== dealType) return false;
      if (evidence !== 'all' && d.evidence_level !== evidence) return false;
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
  }, [deals, dealType, evidence, query]);

  const hasFilters = dealType !== 'all' || evidence !== 'all' || query.trim() !== '';

  return (
    <div className="space-y-10">
      {/* Filter console */}
      <div className="panel space-y-4 p-4 sm:p-5">
        <div className="flex items-center gap-2 border-b border-zinc-100 pb-2">
          <SlidersHorizontal aria-hidden="true" className="h-3.5 w-3.5 text-emerald-600" />
          <h2 className="panel-title">Filter console</h2>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
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
            <label htmlFor="viz-type" className="field-label">
              Deal type
            </label>
            <select
              id="viz-type"
              value={dealType}
              onChange={(e) => setDealType(e.target.value)}
              className="field-native mt-1.5"
            >
              {DEAL_TYPE_OPTIONS.map((o) => (
                <option key={o.key} value={o.key}>
                  {o.label}
                </option>
              ))}
            </select>
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
        <div className="mt-3 flex items-center justify-between gap-3 border-t border-zinc-100 pt-3">
          <p className="font-mono text-[11px] tabular-nums text-zinc-500" role="status" aria-live="polite">
            <span className="num font-bold text-zinc-900">{filtered.length}</span> of{' '}
            <span className="num">{deals.length}</span> deals in view
          </p>
          {hasFilters && (
            <button
              type="button"
              onClick={() => {
                setDealType('all');
                setEvidence('all');
                setQuery('');
              }}
              className="pill pill-mint transition-colors hover:bg-emerald-100"
            >
              <RotateCcw aria-hidden="true" className="h-3 w-3" />
              Reset filters
            </button>
          )}
        </div>
      </div>

      {/* 01 — Scale */}
      <section aria-labelledby="viz-bubbles" className="space-y-3">
        <ViewHeading
          id="viz-bubbles"
          step="01 / Scale"
          label="Scale"
          title="Deal sizes at a glance"
          Icon={Waves}
          tone="mint"
        />
        <p className="max-w-3xl text-xs text-zinc-500 sm:text-sm">
          Every deal in view as a bubble. Area is proportional to disclosed dollars; dashed grey bubbles are
          undisclosed amounts. Select any bubble to open its cited deal record.
        </p>
        <div className="panel p-4 sm:p-6">
          <BubbleChart deals={filtered} />
        </div>
      </section>

      {/* 02 — Circularity */}
      <section aria-labelledby="viz-circular" className="space-y-3">
        <ViewHeading
          id="viz-circular"
          step="02 / Circularity"
          label="Circularity"
          title="Circular financing detector"
          Icon={Repeat2}
          tone="amber"
        />
        <p className="max-w-3xl text-xs text-zinc-500 sm:text-sm">
          The most connected companies on a ring, with capital flowing along the chords. Amber chords flag
          circular loops &mdash; e.g. Microsoft &harr; OpenAI &mdash; where money or binding commitments
          travel in a circle. See the{' '}
          <Link href="/relationships" className="link-ledger-strong">
            relationship flow map
          </Link>{' '}
          for the full tabular ledger.
        </p>
        <div className="panel p-4 sm:p-6">
          <CircularFlow deals={filtered} relationships={relationships} companies={companies} />
        </div>
      </section>

      {/* 03 — Composition */}
      <section aria-labelledby="viz-sectors" className="space-y-3">
        <ViewHeading
          id="viz-sectors"
          step="03 / Composition"
          label="Composition"
          title="Where the disclosed dollars concentrate"
          Icon={Layers}
          tone="sky"
        />
        <p className="max-w-3xl text-xs text-zinc-500 sm:text-sm">
          Totals aggregate only disclosed amounts &mdash; undisclosed deals are counted separately and never
          imputed.
        </p>
        <div className="panel p-4 sm:p-6">
          <SectorBars deals={filtered} />
        </div>
      </section>
    </div>
  );
}