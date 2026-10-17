import React from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';
import { DataRepository } from '../../lib/data/db';
import { formatCurrency } from '../../lib/formatters';
import { VisualizeClient } from '../../components/charts/VisualizeClient';
import { BarChart3, ArrowRight, ShieldCheck, Terminal } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Capital Flow Visualizations — Bubbles, Circular Loops & Sector Bars',
  description:
    'Zero-estimate visual analysis of verified AI infrastructure deals: bubble chart of deal sizes, circular financing detector, and disclosed-dollar breakdowns by type and sector.',
  alternates: { canonical: '/visualize' },
};

export const revalidate = 3600;

interface VisualizePageProps {
  searchParams: Promise<{ q?: string }>;
}

export default async function VisualizePage({ searchParams }: VisualizePageProps) {
  const params = await searchParams;
  const [deals, relationships, companies] = await Promise.all([
    DataRepository.getDeals(),
    DataRepository.getRelationships(),
    DataRepository.getCompanies(),
  ]);
  const disclosedTotal = deals
    .filter((d) => d.amount_disclosed && typeof d.amount_value === 'number')
    .reduce((sum, d) => sum + (d.amount_value as number), 0);

  return (
    <div className="pb-4">
      {/* Flagship dark hero */}
      <section className="hero-terminal">
        <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-14 lg:px-8">
          <p className="eyebrow-terminal text-emerald-300">
            <BarChart3 aria-hidden="true" className="h-3.5 w-3.5" />
            <span>Visual analysis</span>
            <span className="text-zinc-600" aria-hidden="true">
              {'//'}
            </span>
            <span className="text-zinc-400">Zero-estimate ledger views</span>
          </p>

          <div className="mt-3 grid items-end gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <h1 className="text-3xl font-black leading-[1.05] tracking-tight sm:text-4xl lg:text-5xl">
                See the{' '}
                <span className="bg-gradient-to-r from-emerald-300 via-teal-200 to-sky-300 bg-clip-text text-transparent">
                  capital flows
                </span>
              </h1>
              <p className="mt-3 max-w-2xl text-xs leading-relaxed text-zinc-400 sm:text-sm">
                Three zero-estimate views over the same verified ledger you can audit in the{' '}
                <Link href="/deals" className="font-semibold text-emerald-300 hover:text-emerald-200 hover:underline">
                  deal ledger &rarr;
                </Link>
                . Share a filtered view with{' '}
                <code className="rounded border border-white/10 bg-white/[0.07] px-1.5 py-0.5 font-mono text-[11px] text-emerald-200">
                  /visualize?q=…
                </code>
                .{' '}
                <Link href="/methodology" className="font-semibold text-emerald-300 hover:text-emerald-200 hover:underline">
                  Evidence standards &rarr;
                </Link>
              </p>
            </div>
            <dl className="flex flex-wrap gap-2.5 lg:justify-end">
              <div className="terminal-card flex items-baseline gap-2 px-4 py-2">
                <dt className="micro-label-terminal">Deals</dt>
                <dd className="num text-sm font-bold text-white">{deals.length}</dd>
              </div>
              <div className="flex items-baseline gap-2 rounded-terminal bg-emerald-400 px-4 py-2 shadow-glow">
                <dt className="micro-label text-zinc-900">Disclosed $</dt>
                <dd className="num text-sm font-bold text-zinc-950">{formatCurrency(disclosedTotal)}</dd>
              </div>
              <div className="terminal-card flex items-baseline gap-2 border-emerald-500/25 px-4 py-2">
                <dt className="micro-label-terminal">Estimates used</dt>
                <dd className="num text-sm font-bold text-emerald-300">0</dd>
              </div>
            </dl>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-2">
            <span className="pill pill-terminal">
              <Terminal aria-hidden="true" className="h-3 w-3 text-emerald-400" />
              01 Scale &middot; 02 Circularity &middot; 03 Composition
            </span>
            <Link
              href="/deals"
              className="pill pill-terminal transition-colors hover:border-emerald-400/40 hover:text-emerald-200"
            >
              Audit the ledger
              <ArrowRight aria-hidden="true" className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl space-y-8 px-4 py-10 sm:px-6 lg:px-8">
        <VisualizeClient
          deals={deals}
          relationships={relationships}
          companies={companies}
          initialQuery={params.q ?? ''}
        />

        {/* Methodology note */}
        <section
          aria-label="Visualization methodology"
          className="terminal-panel terminal-ring relative overflow-hidden p-5 text-xs leading-relaxed sm:p-6"
        >
          <div className="relative flex items-center gap-2">
            <ShieldCheck aria-hidden="true" className="h-4 w-4 text-emerald-400" />
            <h2 className="panel-title text-emerald-300">Methodology note</h2>
          </div>
          <p className="relative mt-3">
            Bubble area scales with the square root of the disclosed amount, so area &mdash; not diameter
            &mdash; is proportional to dollars. Deals with undisclosed amounts appear as small dashed grey
            bubbles and are excluded from all sizing, totals, and chord widths; we never impute values.
          </p>
          <p className="relative mt-2 text-zinc-400">
            Circular-flow chords combine documented relationships with directed deal edges inferred from
            party roles (investor / lender / supplier &rarr; investee / borrower / customer). Loops
            (A&rarr;B&rarr;A, A&rarr;B&rarr;C&rarr;A) are computed live from the filtered dataset and
            highlighted amber. Sector totals group disclosed dollars by the capital
            recipient&apos;s company type. Full audit trail:{' '}
            <Link href="/methodology" className="font-semibold text-emerald-300 hover:text-emerald-200 hover:underline">
              evidence standards
            </Link>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
