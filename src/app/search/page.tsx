import React from 'react';
import Link from 'next/link';
import { Metadata } from 'next';
import { DataRepository } from '../../lib/data/db';
import { DealTable } from '../../components/DealTable';
import { Pagination, parsePageParam } from '../../components/Pagination';
import { EvidenceBadge } from '../../components/EvidenceBadge';
import { dealTypeColor } from '../../components/charts/chartTheme';
import { CountBars, MiniDonut } from '../../components/charts/FlowMini';
import { formatDealType } from '../../lib/formatters';
import { Search, Database, Layers, Network, FileText, ExternalLink } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Global Search — AI Capital Tracker',
  description: 'Search deals, companies, counterparties, and filings across AI Capital Tracker.',
  alternates: { canonical: '/search' },
  robots: { index: false, follow: true },
};

const PAGE_SIZE = 20;

interface SearchPageProps {
  searchParams: Promise<{
    q?: string;
    page?: string;
  }>;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q = '', page: rawPage } = await searchParams;
  const cleanQuery = q.trim();

  const [matchingDeals, matchingCompanies, matchingRelationships, matchingSources] =
    await Promise.all([
      DataRepository.getDeals({ query: cleanQuery }),
      DataRepository.getCompanies({ query: cleanQuery }),
      cleanQuery !== ''
        ? DataRepository.getRelationships({ query: cleanQuery })
        : Promise.resolve([]),
      cleanQuery !== ''
        ? DataRepository.getSources({ query: cleanQuery })
        : Promise.resolve([]),
    ]);

  const totalDealPages = Math.max(1, Math.ceil(matchingDeals.length / PAGE_SIZE));
  const dealPage = parsePageParam(rawPage, totalDealPages);
  const pagedDeals = matchingDeals.slice((dealPage - 1) * PAGE_SIZE, dealPage * PAGE_SIZE);

  const hasQuery = cleanQuery !== '';
  const totalHits =
    matchingDeals.length +
    matchingCompanies.length +
    matchingRelationships.length +
    matchingSources.length;

  return (
    <div className="pb-16">
      {/* Terminal hero */}
      <section className="hero-terminal">
        <div className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
          <p className="eyebrow-terminal text-emerald-300">
            <Search aria-hidden="true" className="h-3.5 w-3.5" />
            <span>Global query terminal</span>
          </p>
          <h1 className="mt-2 text-2xl font-black tracking-tight text-white sm:text-3xl lg:text-4xl">
            Search ledger &amp; counterparty universe
          </h1>
          <p className="mt-2 max-w-3xl text-xs leading-relaxed text-zinc-400 sm:text-sm">
            Execute multi-entity queries across verified transactions, CIK filings, and financing agreements.
          </p>

          {/* Query bar */}
          <form
            method="GET"
            action="/search"
            role="search"
            aria-label="Global ledger search"
            className="mt-6 max-w-2xl"
          >
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative flex-1">
                <Search aria-hidden="true" className="absolute left-3.5 top-3 h-4 w-4 text-zinc-500" />
                <label htmlFor="global-search" className="sr-only">
                  Search deals, companies, and filings
                </label>
                <input
                  id="global-search"
                  type="text"
                  name="q"
                  defaultValue={cleanQuery}
                  placeholder="Entity (e.g. CoreWeave, NVIDIA), ticker (MSFT), or basis…"
                  className="field-terminal pl-10"
                />
              </div>
              <button type="submit" className="btn btn-accent">
                Execute
              </button>
            </div>
          </form>
        </div>
      </section>

      <div className="mx-auto max-w-7xl space-y-8 px-4 py-10 sm:px-6 lg:px-8">
        {hasQuery ? (
          <div className="space-y-8">
            <p className="font-mono text-[11px] text-zinc-500">
              <span className="num font-bold text-zinc-900">{totalHits}</span> result
              {totalHits === 1 ? '' : 's'} for <span className="text-zinc-700">&ldquo;{cleanQuery}&rdquo;</span>
              {' — '}
              {matchingCompanies.length} entities, {matchingDeals.length} transactions,{' '}
              {matchingRelationships.length} ties, {matchingSources.length} citations
            </p>

            {totalHits > 0 && (
              <section aria-label="Result distribution visuals" className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <div className="panel p-4 sm:p-5">
                  <div className="border-b border-zinc-100 pb-2">
                    <h2 className="panel-title">Result mix</h2>
                    <p className="mt-1 text-[11px] text-zinc-500">
                      Hit share across the four registries.
                    </p>
                  </div>
                  <div className="mt-4">
                    <MiniDonut
                      segments={[
                        { label: 'Transactions', value: matchingDeals.length, color: '#2563eb' },
                        { label: 'Entities', value: matchingCompanies.length, color: '#7c3aed' },
                        { label: 'Ties', value: matchingRelationships.length, color: '#d97706' },
                        { label: 'Citations', value: matchingSources.length, color: '#059669' },
                      ]}
                      centerLabel={String(totalHits)}
                      centerSub="hits"
                    />
                  </div>
                </div>

                <div className="panel p-4 sm:p-5">
                  <div className="border-b border-zinc-100 pb-2">
                    <h2 className="panel-title">Faceted hit counts</h2>
                    <p className="mt-1 text-[11px] text-zinc-500">
                      Per-registry totals plus matching-deal type split.
                    </p>
                  </div>
                  <div className="mt-4">
                    <CountBars
                      rows={[
                        { label: 'Transactions', count: matchingDeals.length, color: '#2563eb' },
                        { label: 'Entities', count: matchingCompanies.length, color: '#7c3aed' },
                        { label: 'Counterparty ties', count: matchingRelationships.length, color: '#d97706' },
                        { label: 'Citations', count: matchingSources.length, color: '#059669' },
                      ]}
                    />
                  </div>
                  {matchingDeals.length > 0 && (
                    <div className="mt-5">
                      <h3 className="panel-title mb-2">Matching deals by type</h3>
                      <CountBars
                        rows={(() => {
                          const byType = new Map<string, number>();
                          for (const d of matchingDeals) {
                            byType.set(d.deal_type, (byType.get(d.deal_type) ?? 0) + 1);
                          }
                          return [...byType.entries()]
                            .map(([t, count]) => ({
                              label: formatDealType(t),
                              count,
                              color: dealTypeColor(t),
                            }))
                            .sort((a, b) => b.count - a.count)
                            .slice(0, 6);
                        })()}
                      />
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* Matching entities */}
            {matchingCompanies.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Layers aria-hidden="true" className="h-4 w-4 text-emerald-600" />
                  <h2 className="panel-title">Matching entities ({matchingCompanies.length})</h2>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
                  {matchingCompanies.slice(0, 12).map((c) => (
                    <Link
                      key={c.id}
                      href={`/companies/${c.slug}`}
                      className="panel-interactive group flex flex-col justify-between p-3.5"
                    >
                      <div>
                        <div className="mb-1 flex items-center justify-between font-mono text-[10px]">
                          <span className="uppercase text-zinc-500">{c.company_type.replace(/_/g, ' ')}</span>
                          {c.ticker && <span className="num font-bold text-zinc-900">${c.ticker}</span>}
                        </div>
                        <div className="text-sm font-bold text-zinc-950 transition-colors group-hover:text-emerald-800">
                          {c.name}
                        </div>
                      </div>
                      <div className="mt-3 flex items-center justify-between gap-2">
                        <span className="micro-label">{c.headquarters_country || 'Global'}</span>
                        <span className="font-mono text-[10px] font-semibold text-zinc-700 transition-colors group-hover:text-emerald-800">
                          Profile &rarr;
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
                {matchingCompanies.length > 12 && (
                  <Link href={`/companies?q=${encodeURIComponent(cleanQuery)}`} className="link-ledger">
                    <span>View all {matchingCompanies.length} entities &rarr;</span>
                  </Link>
                )}
              </div>
            )}

            {/* Matching ledger transactions */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Database aria-hidden="true" className="h-4 w-4 text-emerald-600" />
                <h2 className="panel-title">
                  Matching ledger transactions ({matchingDeals.length})
                </h2>
              </div>
              <DealTable deals={pagedDeals} />
              <Pagination
                page={dealPage}
                totalPages={totalDealPages}
                basePath="/search"
                params={{ q: cleanQuery }}
              />
            </div>

            {/* Matching counterparty ties */}
            {matchingRelationships.length > 0 && (
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Network aria-hidden="true" className="h-4 w-4 text-emerald-600" />
                    <h2 className="panel-title">
                      Matching counterparty ties ({matchingRelationships.length})
                    </h2>
                  </div>
                  <Link href={`/relationships?q=${encodeURIComponent(cleanQuery)}`} className="link-ledger">
                    <span>Open in flow map &rarr;</span>
                  </Link>
                </div>
                <ul className="ledger-shell divide-y divide-zinc-100 text-xs">
                  {matchingRelationships.slice(0, 8).map((rel) => (
                    <li key={rel.id} className="ledger-row flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3">
                      <Link
                        href={`/companies/${rel.from_company?.slug}`}
                        className="rounded font-bold text-zinc-950 transition-colors hover:text-emerald-800"
                      >
                        {rel.from_company?.name}
                      </Link>
                      <span className="pill pill-neutral px-1.5 text-[9px]">
                        {rel.relationship_type.replace(/_/g, ' ')}
                      </span>
                      <span className="text-zinc-500" aria-hidden="true">
                        &rarr;
                      </span>
                      <Link
                        href={`/companies/${rel.to_company?.slug}`}
                        className="rounded font-bold text-zinc-950 transition-colors hover:text-emerald-800"
                      >
                        {rel.to_company?.name}
                      </Link>
                      <EvidenceBadge level={rel.evidence_level} size="sm" />
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Matching citations */}
            {matchingSources.length > 0 && (
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <FileText aria-hidden="true" className="h-4 w-4 text-emerald-600" />
                    <h2 className="panel-title">Matching citations ({matchingSources.length})</h2>
                  </div>
                  <Link href={`/sources?q=${encodeURIComponent(cleanQuery)}`} className="link-ledger">
                    <span>Open in source registry &rarr;</span>
                  </Link>
                </div>
                <ul className="ledger-shell divide-y divide-zinc-100 text-xs">
                  {matchingSources.slice(0, 8).map((source) => (
                    <li key={source.id} className="ledger-row space-y-1 px-4 py-3">
                      <div className="flex items-baseline justify-between gap-4">
                        <a
                          href={source.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 rounded font-bold text-zinc-950 transition-colors hover:text-emerald-800 hover:underline"
                        >
                          <span>{source.title}</span>
                          <ExternalLink aria-hidden="true" className="h-3 w-3 shrink-0 text-zinc-500" />
                        </a>
                        <span className="whitespace-nowrap font-mono text-[11px] text-zinc-500">
                          {source.published_date || 'Date unrecorded'}
                        </span>
                      </div>
                      <div className="font-mono text-[10px] text-zinc-500">
                        {source.publisher || 'Unknown'} &bull; {source.source_type.replace(/_/g, ' ')}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {totalHits === 0 && (
              <div className="empty-state space-y-2">
                <p className="font-mono text-label font-bold uppercase text-zinc-500">No results found</p>
                <p className="mx-auto max-w-sm text-xs text-zinc-500">
                  No entities, transactions, ties, or citations match &ldquo;{cleanQuery}&rdquo;. Try a
                  counterparty name, ticker, or deal type.
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="empty-state space-y-2">
            <p className="font-mono text-label font-bold uppercase text-zinc-500">Terminal awaiting query</p>
            <p className="mx-auto max-w-sm text-xs text-zinc-500">
              Enter an entity (e.g. CoreWeave, Blackstone), counterparty, or transaction type to search.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}