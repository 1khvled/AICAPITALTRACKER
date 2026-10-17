import React from 'react';
import Link from 'next/link';
import { Metadata } from 'next';
import { DataRepository } from '../../lib/data/db';
import { getPendingItems, filterPendingItems } from '../../lib/data/fresh';
import { EvidenceBadge } from '../../components/EvidenceBadge';
import { Pagination, parsePageParam } from '../../components/Pagination';
import { CircularFlow } from '../../components/charts/CircularFlow';
import { MiniDonut } from '../../components/charts/FlowMini';
import { GanttLite } from '../../components/charts/TimelineBar';
import { ExternalLink, Network, Zap, Cpu, Server, Coins, Search } from 'lucide-react';

export const metadata: Metadata = {
  title: 'AI Relationship Explorer & Capital Flow Map',
  description:
    'Search and inspect verified ties connecting AI foundation labs, GPU manufacturers, private lenders, and utility operators.',
};

export const revalidate = 1800;

const PAGE_SIZE = 20;

const RELATIONSHIP_TYPES = [
  { key: 'all', label: 'All Types' },
  { key: 'equity_shareholder', label: 'Equity Shareholder' },
  { key: 'cloud_customer', label: 'Cloud Customer' },
  { key: 'chip_supplier', label: 'Chip Supplier' },
  { key: 'debt_lender', label: 'Debt Lender' },
  { key: 'power_offtaker', label: 'Power Off-Taker' },
  { key: 'strategic_partner', label: 'Strategic Partner' },
  { key: 'infrastructure_host', label: 'Infrastructure Host' },
  { key: 'other', label: 'Other' },
];

interface RelationshipsPageProps {
  searchParams: Promise<{
    q?: string;
    type?: string;
    page?: string;
    tab?: string;
  }>;
}

export default async function RelationshipsPage({ searchParams }: RelationshipsPageProps) {
  const params = await searchParams;
  const tab = params.tab === 'fresh' ? 'fresh' : 'verified';
  const [relationships, companies, allDeals, verifiedTotal] = await Promise.all([
    DataRepository.getRelationships({
      query: params.q,
      relationshipType: params.type,
    }),
    DataRepository.getCompanies(),
    DataRepository.getDeals(),
    DataRepository.getRelationships(),
  ]);

  // Everything the ingest pulled: queue candidates + fresh filings not yet in
  // the queue (research leads only — never presented as verified ties).
  const pendingAll = getPendingItems();
  const pending = filterPendingItems(pendingAll, params.q);

  // Visual strip: type mix across the full filtered set + network preview.
  const typeCounts = new Map<string, number>();
  for (const r of relationships) {
    typeCounts.set(r.relationship_type, (typeCounts.get(r.relationship_type) ?? 0) + 1);
  }
  const REL_TYPE_COLORS: Record<string, string> = {
    equity_shareholder: '#2563eb',
    cloud_customer: '#0284c7',
    chip_supplier: '#7c3aed',
    debt_lender: '#d97706',
    power_offtaker: '#059669',
    strategic_partner: '#4f46e5',
    infrastructure_host: '#ea580c',
    other: '#a3a3a3',
  };
  const typeSegments = [...typeCounts.entries()]
    .map(([t, count]) => ({
      label: t.replace(/_/g, ' '),
      value: count,
      color: REL_TYPE_COLORS[t] ?? '#a3a3a3',
    }))
    .sort((a, b) => b.value - a.value);

  const involvedIds = new Set(relationships.flatMap((r) => [r.from_company_id, r.to_company_id]));
  const previewDeals = allDeals
    .filter((d) => (d.parties ?? []).some((p) => involvedIds.has(p.company_id)))
    .slice(0, 40);
  const previewRels = relationships.slice(0, 60);

  const totalPages = Math.max(1, Math.ceil(relationships.length / PAGE_SIZE));
  const page = parsePageParam(params.page, totalPages);
  const paged = relationships.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const rangeStart = relationships.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(page * PAGE_SIZE, relationships.length);

  const pendingTotalPages = Math.max(1, Math.ceil(pending.length / PAGE_SIZE));
  const pendingPage = parsePageParam(params.page, pendingTotalPages);
  const pendingPaged = pending.slice((pendingPage - 1) * PAGE_SIZE, pendingPage * PAGE_SIZE);
  const pendingRangeStart = pending.length === 0 ? 0 : (pendingPage - 1) * PAGE_SIZE + 1;
  const pendingRangeEnd = Math.min(pendingPage * PAGE_SIZE, pending.length);

  const tabHref = (t: 'verified' | 'fresh'): string => {
    const search = new URLSearchParams();
    if (params.q) search.set('q', params.q);
    if (params.type && params.type !== 'all') search.set('type', params.type);
    if (t === 'fresh') search.set('tab', 'fresh');
    const qs = search.toString();
    return qs ? `/relationships?${qs}` : '/relationships';
  };

  return (
    <div className="pb-16">
      {/* Terminal hero */}
      <section className="hero-terminal">
        <div className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
          <p className="eyebrow-terminal text-emerald-300">
            <Network aria-hidden="true" className="h-3.5 w-3.5" />
            <span>Network intelligence</span>
          </p>
          <h1 className="mt-2 text-2xl font-black tracking-tight text-white sm:text-3xl lg:text-4xl">
            Counterparty relationship &amp; capital flow map
          </h1>
          <p className="mt-2 max-w-3xl text-xs leading-relaxed text-zinc-400 sm:text-sm">
            Documented interconnections across hardware allocation, cloud commitments, asset-backed debt, and
            nuclear energy off-take agreements.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-7xl space-y-8 px-4 py-10 sm:px-6 lg:px-8">
        {/* Category summary rail */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="panel-interactive p-4">
            <div className="eyebrow eyebrow-amber">
              <Coins aria-hidden="true" className="h-4 w-4" />
              Credit &amp; debt
            </div>
            <div className="mt-1.5 text-sm font-bold text-zinc-900">GPU asset-backed lines</div>
            <div className="mt-0.5 text-[10px] text-zinc-500">Blackstone &amp; Magnetar &rarr; CoreWeave</div>
          </div>

          <div className="panel-interactive p-4">
            <div className="eyebrow eyebrow-sky">
              <Server aria-hidden="true" className="h-4 w-4" />
              Cloud &amp; equity
            </div>
            <div className="mt-1.5 text-sm font-bold text-zinc-900">Hyperscaler injections</div>
            <div className="mt-0.5 text-[10px] text-zinc-500">Microsoft &amp; OpenAI / Amazon &amp; Anthropic</div>
          </div>

          <div className="panel-interactive p-4">
            <div className="eyebrow eyebrow-violet">
              <Cpu aria-hidden="true" className="h-4 w-4" />
              Hardware allocation
            </div>
            <div className="mt-1.5 text-sm font-bold text-zinc-900">Accelerated silicon</div>
            <div className="mt-0.5 text-[10px] text-zinc-500">NVIDIA &rarr; CoreWeave / Hyperscalers</div>
          </div>

          <div className="panel-interactive p-4">
            <div className="eyebrow eyebrow-mint">
              <Zap aria-hidden="true" className="h-4 w-4" />
              Energy &amp; grid
            </div>
            <div className="mt-1.5 text-sm font-bold text-zinc-900">Nuclear off-take PPAs</div>
            <div className="mt-0.5 text-[10px] text-zinc-500">Constellation &rarr; Microsoft (835 MW)</div>
          </div>
        </div>

        {/* Verified / Fresh tabs */}
        <div className="flex flex-wrap items-center gap-2" role="tablist" aria-label="Relationship review state">
          <Link
            href={tabHref('verified')}
            role="tab"
            aria-selected={tab === 'verified'}
            className={`chip ${tab === 'verified' ? 'chip-active' : ''}`}
          >
            Verified ties ({verifiedTotal.length})
          </Link>
          <Link
            href={tabHref('fresh')}
            role="tab"
            aria-selected={tab === 'fresh'}
            className={`chip ${tab === 'fresh' ? 'chip-active' : ''}`}
          >
            Fresh / pending ({pendingAll.length})
          </Link>
          <span className="micro-label ml-1">
            {verifiedTotal.length} verified + {pendingAll.length} fresh / pending
          </span>
        </div>

        {/* Visual ecosystem strip */}
        {tab === 'verified' && (
          <section aria-label="Relationship visuals" className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="panel p-4 sm:p-5">
              <div className="border-b border-zinc-100 pb-2">
                <h2 className="panel-title">Ties by type</h2>
                <p className="mt-1 text-[11px] text-zinc-500">
                  Full filtered set ({relationships.length} ties).
                </p>
              </div>
              <div className="mt-4">
                <MiniDonut
                  segments={typeSegments}
                  centerLabel={String(relationships.length)}
                  centerSub="ties"
                />
              </div>
            </div>

            <div className="panel p-4 sm:p-5 lg:col-span-2">
              <div className="border-b border-zinc-100 pb-2">
                <h2 className="panel-title">Network preview — most connected in view</h2>
                <p className="mt-1 text-[11px] text-zinc-500">
                  Solid chords = deal flows &middot; dashed = documented ties &middot; amber = circular loops.
                </p>
              </div>
              <div className="mt-4">
                <CircularFlow deals={previewDeals} relationships={previewRels} companies={companies} />
              </div>
            </div>
          </section>
        )}

        {/* Search + type console */}
        <div className="panel p-4 sm:p-5">
          <form method="GET" className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="sm:col-span-2">
              <label htmlFor="rel-q" className="field-label">
                Search counterparties or relationship scope
              </label>
              <div className="relative mt-1.5">
                <Search aria-hidden="true" className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-500" />
                <input
                  id="rel-q"
                  name="q"
                  type="text"
                  defaultValue={params.q || ''}
                  placeholder="Entity (e.g. NVIDIA, CoreWeave) or scope…"
                  className="field-search pl-9"
                />
              </div>
            </div>
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <label htmlFor="rel-type" className="field-label">
                  Relationship type
                </label>
                <select id="rel-type" name="type" defaultValue={params.type || 'all'} className="field-native mt-1.5">
                  {RELATIONSHIP_TYPES.map((t) => (
                    <option key={t.key} value={t.key}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
              <button type="submit" className="btn btn-primary">
                Filter
              </button>
            </div>
          </form>
        </div>

        {tab === 'verified' ? (
          <>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-mono text-[11px] text-zinc-500">
                Showing {rangeStart}&ndash;{rangeEnd} of {relationships.length} verified ties
                <span className="text-zinc-500">
                  {' '}
                  ({verifiedTotal.length} verified + {pendingAll.length} fresh / pending)
                </span>
              </p>
              {(params.q || (params.type && params.type !== 'all')) && (
                <Link href="/relationships" className="link-ledger">
                  <span>Reset filters</span>
                </Link>
              )}
            </div>

            {/* Gantt-lite strip */}
            <div className="panel p-4 sm:p-5">
              <div className="border-b border-zinc-100 pb-2">
                <h2 className="panel-title">Effective timeline — this page</h2>
                <p className="mt-1 text-[11px] text-zinc-500">
                  Start &rarr; end span per tie in the table below.
                </p>
              </div>
              <div className="mt-4">
                <GanttLite
                  rows={paged.map((rel) => ({
                    label: `${rel.from_company?.name ?? 'Unknown'} → ${rel.to_company?.name ?? 'Unknown'}`,
                    sub: rel.relationship_type.replace(/_/g, ' '),
                    start: rel.start_date,
                    end: rel.end_date,
                  }))}
                />
              </div>
            </div>

            {/* Flow table */}
            {paged.length > 0 ? (
              <div className="ledger-shell">
                <div
                  role="region"
                  aria-label="Counterparty relationship flow table"
                  tabIndex={0}
                  className="ledger-scroll overflow-x-auto"
                >
                  <table className="min-w-full text-left text-xs">
                    <caption className="sr-only">
                      Documented counterparty relationships and capital flows
                    </caption>
                    <thead>
                      <tr className="ledger-head">
                        <th scope="col" className="ledger-head-cell">Entity origin</th>
                        <th scope="col" className="ledger-head-cell">Relationship nature</th>
                        <th scope="col" className="ledger-head-cell">Target counterparty</th>
                        <th scope="col" className="ledger-head-cell">Effective timeline</th>
                        <th scope="col" className="ledger-head-cell">Verified scope</th>
                        <th scope="col" className="ledger-head-cell">Audit level</th>
                        <th scope="col" className="ledger-head-cell text-right">
                          Statutory citation
                        </th>
                      </tr>
                    </thead>
                    <tbody className="ledger-body">
                      {paged.map((rel) => {
                        const source = rel.sources?.[0]?.source;

                        return (
                          <tr key={rel.id} className="ledger-row align-top">
                            <td className="whitespace-nowrap px-4 py-3">
                              <Link
                                href={`/companies/${rel.from_company?.slug}`}
                                className="rounded font-bold text-zinc-950 transition-colors hover:text-emerald-800"
                              >
                                {rel.from_company?.name}
                              </Link>
                              <span className="block font-mono text-[10px] text-zinc-500">
                                {rel.from_company?.company_type.replace(/_/g, ' ')}
                              </span>
                            </td>

                            <td className="whitespace-nowrap px-4 py-3">
                              <span className="pill pill-neutral">
                                {rel.relationship_type.replace(/_/g, ' ')}
                              </span>
                            </td>

                            <td className="whitespace-nowrap px-4 py-3">
                              <Link
                                href={`/companies/${rel.to_company?.slug}`}
                                className="rounded font-bold text-zinc-950 transition-colors hover:text-emerald-800"
                              >
                                {rel.to_company?.name}
                              </Link>
                              <span className="block font-mono text-[10px] text-zinc-500">
                                {rel.to_company?.company_type.replace(/_/g, ' ')}
                              </span>
                            </td>

                            <td className="whitespace-nowrap px-4 py-3 font-mono text-[11px] text-zinc-500">
                              {rel.start_date || 'Ongoing'}
                            </td>

                            <td className="max-w-sm px-4 py-3 leading-normal text-zinc-600">
                              {rel.description}
                            </td>

                            <td className="whitespace-nowrap px-4 py-3">
                              <EvidenceBadge level={rel.evidence_level} size="sm" />
                            </td>

                            <td className="whitespace-nowrap px-4 py-3 text-right">
                              {source ? (
                                <a
                                  href={source.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="link-cite"
                                >
                                  <span>{source.publisher || 'Filing'}</span>
                                  <ExternalLink aria-hidden="true" className="h-2.5 w-2.5" />
                                </a>
                              ) : (
                                <span className="font-mono text-zinc-500">&mdash;</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="empty-state space-y-2">
                <p className="font-mono text-label font-bold uppercase text-zinc-500">
                  No ties match filter
                </p>
                <p className="mx-auto max-w-sm text-xs text-zinc-500">
                  Try broadening your search query or reset the relationship type filter.
                </p>
                <Link href="/relationships" className="btn btn-primary mt-3">
                  Reset filters
                </Link>
              </div>
            )}

            <Pagination
              page={page}
              totalPages={totalPages}
              basePath="/relationships"
              params={{ q: params.q, type: params.type }}
            />
          </>
        ) : (
          <>
            <div className="notice notice-amber">
              <p className="font-bold text-amber-900">
                Fresh / pending review &mdash; {pending.length} filing
                {pending.length === 1 ? '' : 's'} pulled by the SEC ingest, not yet verified.
              </p>
              <p className="mt-1.5 text-amber-800">
                Each row is a real filing (8-K / 10-Q / 10-K) that may document a counterparty tie.
                Counterparties marked TBD are confirmed only after editorial review &mdash; nothing here is a
                verified relationship yet.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-mono text-[11px] text-zinc-500">
                Showing {pendingRangeStart}&ndash;{pendingRangeEnd} of {pending.length} fresh / pending filings
                <span className="text-zinc-500">
                  {' '}
                  ({verifiedTotal.length} verified + {pendingAll.length} fresh / pending)
                </span>
              </p>
              {params.q && (
                <Link href="/relationships?tab=fresh" className="link-ledger">
                  <span>Reset filters</span>
                </Link>
              )}
            </div>

            {pendingPaged.length > 0 ? (
              <div className="ledger-shell">
                <div
                  role="region"
                  aria-label="Fresh pending relationship leads"
                  tabIndex={0}
                  className="ledger-scroll overflow-x-auto"
                >
                  <table className="min-w-full text-left text-xs">
                    <caption className="sr-only">
                      Unverified filing leads that may document counterparty relationships
                    </caption>
                    <thead>
                      <tr className="ledger-head">
                        <th scope="col" className="ledger-head-cell">Entity origin</th>
                        <th scope="col" className="ledger-head-cell">Relationship nature</th>
                        <th scope="col" className="ledger-head-cell">Target counterparty</th>
                        <th scope="col" className="ledger-head-cell">Effective timeline</th>
                        <th scope="col" className="ledger-head-cell">Filing scope</th>
                        <th scope="col" className="ledger-head-cell">Audit level</th>
                        <th scope="col" className="ledger-head-cell text-right">
                          Statutory citation
                        </th>
                      </tr>
                    </thead>
                    <tbody className="ledger-body">
                      {pendingPaged.map((item) => (
                        <tr key={`pending-${item.key}`} className="ledger-row align-top">
                          <td className="whitespace-nowrap px-4 py-3">
                            {item.company ? (
                              <Link
                                href={`/companies/${item.company.slug}`}
                                className="rounded font-bold text-zinc-950 transition-colors hover:text-emerald-800"
                              >
                                {item.entity}
                              </Link>
                            ) : (
                              <span className="font-bold text-zinc-950">{item.entity}</span>
                            )}
                            <span className="block font-mono text-[10px] text-zinc-500">
                              {item.company
                                ? item.company.company_type.replace(/_/g, ' ')
                                : 'unmatched issuer'}
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-4 py-3">
                            <span className="pill pill-neutral">Filing — {item.formType || 'unknown'}</span>
                            <span className="mt-1 block w-fit pill pill-amber">Needs verification</span>
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 italic text-zinc-500">TBD on verification</td>
                          <td className="whitespace-nowrap px-4 py-3 font-mono text-[11px] text-zinc-500">
                            {item.filingDate || 'Undisclosed'}
                          </td>
                          <td className="px-4 py-3 leading-normal text-zinc-600">{item.description}</td>
                          <td className="whitespace-nowrap px-4 py-3">
                            <span className="pill pill-amber">Needs verification</span>
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-right">
                            {item.url ? (
                              <a
                                href={item.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="link-cite"
                              >
                                <span>SEC EDGAR</span>
                                <ExternalLink aria-hidden="true" className="h-2.5 w-2.5" />
                              </a>
                            ) : (
                              <span className="font-mono text-zinc-500">&mdash;</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="empty-state space-y-2">
                <p className="font-mono text-label font-bold uppercase text-zinc-500">
                  No fresh leads match filter
                </p>
                <p className="mx-auto max-w-sm text-xs text-zinc-500">
                  Try broadening your search query.
                </p>
                <Link href="/relationships?tab=fresh" className="btn btn-primary mt-3">
                  Reset filters
                </Link>
              </div>
            )}

            <Pagination
              page={pendingPage}
              totalPages={pendingTotalPages}
              basePath="/relationships"
              params={{ q: params.q, type: params.type, tab: 'fresh' }}
            />
          </>
        )}
      </div>
    </div>
  );
}