import React from 'react';
import Link from 'next/link';
import { Metadata } from 'next';
import { DataRepository } from '../../lib/data/db';
import { Pagination, parsePageParam } from '../../components/Pagination';
import { formatCurrency } from '../../lib/formatters';
import { MiniDonut } from '../../components/charts/MiniDonut';
import { AmountBars } from '../../components/charts/AmountBars';
import { Search, Layers, ArrowRight, Globe2 } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Company Directory — AI Labs, Chipmakers, Hyperscalers, Sovereign Funds & Financiers',
  description:
    'Comprehensive directory of 64+ tracked artificial intelligence labs, specialized cloud operators, GPU chipmakers, utility power providers, and debt financiers.',
};

export const revalidate = 1800;

const PAGE_SIZE = 20;

interface CompaniesPageProps {
  searchParams: Promise<{
    companyType?: string;
    q?: string;
    page?: string;
  }>;
}

export default async function CompaniesPage({ searchParams }: CompaniesPageProps) {
  const params = await searchParams;
  const [companies, allCompanies, allDeals] = await Promise.all([
    DataRepository.getCompanies({
      companyType: params.companyType,
      query: params.q,
    }),
    DataRepository.getCompanies(),
    DataRepository.getDeals(),
  ]);

  const sectorCounts: Record<string, number> = {
    all: allCompanies.length,
    ai_lab: allCompanies.filter((c) => c.company_type === 'ai_lab').length,
    chipmaker: allCompanies.filter((c) => c.company_type === 'chipmaker').length,
    cloud_provider: allCompanies.filter((c) => c.company_type === 'cloud_provider').length,
    utility_power: allCompanies.filter((c) => c.company_type === 'utility_power').length,
    data_center_operator: allCompanies.filter((c) => c.company_type === 'data_center_operator').length,
    lender: allCompanies.filter((c) => c.company_type === 'lender').length,
    investor: allCompanies.filter((c) => c.company_type === 'investor').length,
    infrastructure_equipment: allCompanies.filter((c) => c.company_type === 'infrastructure_equipment').length,
  };

  const selectedSector = params.companyType || 'all';

  // Visual aggregates: sector mix from FILTERED companies; disclosed volume
  // per company summed from deal parties across all published deals.
  const COMPANY_TYPE_COLORS: Record<string, string> = {
    ai_lab: '#2563eb',
    chipmaker: '#db2777',
    cloud_provider: '#0d9488',
    data_center_operator: '#7c3aed',
    investor: '#d97706',
    lender: '#4f46e5',
    utility_power: '#059669',
    infrastructure_equipment: '#64748b',
    other: '#a3a3a3',
  };
  const filteredTypeCounts = new Map<string, number>();
  for (const c of companies) {
    filteredTypeCounts.set(c.company_type, (filteredTypeCounts.get(c.company_type) ?? 0) + 1);
  }
  const sectorDonut = [...filteredTypeCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([key, value]) => ({
      label: key
        .split('_')
        .map((w) => (w.length > 0 ? w[0].toUpperCase() + w.slice(1) : w))
        .join(' '),
      value,
      color: COMPANY_TYPE_COLORS[key] ?? '#a3a3a3',
    }));

  const volumeByCompanyId = new Map<string, number>();
  const dealCountByCompanyId = new Map<string, number>();
  for (const d of allDeals) {
    if (!d.amount_disclosed || !d.amount_value || d.amount_value <= 0) continue;
    for (const p of d.parties ?? []) {
      volumeByCompanyId.set(p.company_id, (volumeByCompanyId.get(p.company_id) ?? 0) + (d.amount_value ?? 0));
      dealCountByCompanyId.set(p.company_id, (dealCountByCompanyId.get(p.company_id) ?? 0) + 1);
    }
  }
  const topVolumeRows = companies
    .map((c) => ({
      company: c,
      vol: volumeByCompanyId.get(c.id) ?? 0,
      n: dealCountByCompanyId.get(c.id) ?? 0,
    }))
    .filter((r) => r.vol > 0)
    .sort((a, b) => b.vol - a.vol)
    .slice(0, 10)
    .map((r) => ({
      label: r.company.name,
      value: r.vol,
      href: `/companies/${r.company.slug}`,
      sub: `${r.n} deal${r.n === 1 ? '' : 's'}`,
      color: COMPANY_TYPE_COLORS[r.company.company_type] ?? '#09090b',
    }));
  const maxCompanyVolume = companies.reduce(
    (m, c) => Math.max(m, volumeByCompanyId.get(c.id) ?? 0),
    0
  );

  const totalPages = Math.max(1, Math.ceil(companies.length / PAGE_SIZE));
  const page = parsePageParam(params.page, totalPages);
  const pagedCompanies = companies.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const rangeStart = companies.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(page * PAGE_SIZE, companies.length);

  return (
    <div className="pb-16">
      {/* Terminal hero */}
      <section className="hero-terminal">
        <div className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <div className="max-w-3xl space-y-4">
              <span className="pill pill-terminal-mint">
                <Layers aria-hidden="true" className="h-3.5 w-3.5" />
                Global entity directory
              </span>
              <h1 className="text-3xl font-black leading-tight tracking-tight text-white sm:text-4xl lg:text-5xl">
                Tracked Companies &amp; Infrastructure Entities
              </h1>
              <p className="max-w-2xl text-xs leading-relaxed text-zinc-400 sm:text-sm">
                Auditing 64+ foundation labs, hyperscalers, chipmakers, sovereign funds, utility off-takers, and
                data center REITs.
              </p>
            </div>

            <div className="flex shrink-0 flex-wrap items-center gap-3">
              <div className="terminal-card px-3.5 py-2">
                <span className="micro-label-terminal">MATCHING:</span>{' '}
                <span className="num text-sm font-bold text-white">{companies.length}</span>
              </div>
              <span className="pill pill-terminal-mint px-3 py-1.5 text-[11px]">
                TOTAL CATALOG: <span className="num text-white">{allCompanies.length}</span>
              </span>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl space-y-8 px-4 py-10 sm:px-6 lg:px-8">
        {/* Sector quick filters */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="micro-label mr-1">Sector quick filters:</span>
          {[
            { key: 'all', label: 'All Entities' },
            { key: 'ai_lab', label: 'AI Labs' },
            { key: 'cloud_provider', label: 'Neoclouds & Hyperscalers' },
            { key: 'chipmaker', label: 'Chipmakers' },
            { key: 'utility_power', label: 'Power & Nuclear' },
            { key: 'data_center_operator', label: 'Data Center REITs' },
            { key: 'lender', label: 'Credit & Lenders' },
            { key: 'investor', label: 'Sovereign & Strategic' },
            { key: 'infrastructure_equipment', label: 'Thermal & Hardware' },
          ].map((tabItem) => {
            const isActive = selectedSector === tabItem.key;
            const href = tabItem.key === 'all' ? '/companies' : `/companies?companyType=${tabItem.key}`;

            return (
              <Link
                key={tabItem.key}
                href={href}
                aria-current={isActive ? 'true' : undefined}
                className={`chip ${isActive ? 'chip-active' : ''}`}
              >
                {tabItem.label}
                <span className="chip-count">({sectorCounts[tabItem.key] || 0})</span>
              </Link>
            );
          })}
        </div>

        {/* Search + sector console */}
        <div className="panel p-5 sm:p-6">
          <form method="GET" className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="sm:col-span-2">
              <label htmlFor="q" className="field-label">
                Search entities by keyword, ticker, or location
              </label>
              <div className="relative mt-1.5">
                <Search aria-hidden="true" className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-500" />
                <input
                  id="q"
                  name="q"
                  type="text"
                  defaultValue={params.q || ''}
                  placeholder="Name (e.g. CoreWeave, NVIDIA), ticker (CEG), or city…"
                  className="field-search pl-9"
                />
              </div>
            </div>

            <div className="flex items-end gap-2">
              <div className="flex-1">
                <label htmlFor="companyType" className="field-label">
                  Sector
                </label>
                <select
                  id="companyType"
                  name="companyType"
                  defaultValue={params.companyType || 'all'}
                  className="field-native mt-1.5"
                >
                  <option value="all">All Sectors ({allCompanies.length})</option>
                  <option value="ai_lab">Frontier AI Lab ({sectorCounts.ai_lab})</option>
                  <option value="cloud_provider">
                    Cloud &amp; Neocloud Provider ({sectorCounts.cloud_provider})
                  </option>
                  <option value="chipmaker">
                    Chipmaker &amp; Accelerators ({sectorCounts.chipmaker})
                  </option>
                  <option value="utility_power">
                    Utility &amp; Nuclear Power ({sectorCounts.utility_power})
                  </option>
                  <option value="data_center_operator">
                    Hyperscale Data Center Operator ({sectorCounts.data_center_operator})
                  </option>
                  <option value="lender">
                    Private Credit &amp; Syndicate Lender ({sectorCounts.lender})
                  </option>
                  <option value="investor">
                    Sovereign &amp; Strategic Investor ({sectorCounts.investor})
                  </option>
                  <option value="infrastructure_equipment">
                    Thermal &amp; Infrastructure Equipment ({sectorCounts.infrastructure_equipment})
                  </option>
                </select>
              </div>
              <button type="submit" className="btn btn-primary">
                Filter
              </button>
            </div>
          </form>
        </div>

        {/* Capital visuals */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="panel-interactive p-5">
            <h2 className="panel-title border-b border-zinc-100 pb-2">
              Filtered entities by sector
            </h2>
            <div className="mt-3">
              <MiniDonut data={sectorDonut} centerLabel="entities" />
            </div>
          </div>
          <div className="panel-interactive p-5">
            <AmountBars
              rows={topVolumeRows}
              title="Top 10 by Disclosed Deal Volume"
              emptyNote="No disclosed deal volume for the filtered entities."
            />
          </div>
        </div>

        {/* Companies grid */}
        {companies.length > 0 ? (
          <>
            <p className="caption">
              Showing {rangeStart}&ndash;{rangeEnd} of {companies.length} matching entities
            </p>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {pagedCompanies.map((company) => {
                const vol = volumeByCompanyId.get(company.id) ?? 0;
                const dealCount = dealCountByCompanyId.get(company.id) ?? 0;
                return (
                  <Link
                    key={company.id}
                    href={`/companies/${company.slug}`}
                    className="panel-interactive group flex flex-col justify-between p-5"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="pill pill-neutral">
                          {company.company_type.replace(/_/g, ' ')}
                        </span>
                        {company.ticker ? (
                          <span className="pill pill-neutral num text-zinc-900">${company.ticker}</span>
                        ) : (
                          <span className="pill pill-neutral">Private</span>
                        )}
                      </div>

                      <h2 className="text-base font-bold text-zinc-950 transition-colors group-hover:text-emerald-800">
                        {company.name}
                      </h2>
                      <p className="line-clamp-3 text-xs leading-relaxed text-zinc-500">
                        {company.description}
                      </p>
                      <div>
                        <div className="flex items-baseline justify-between gap-2">
                          <span className="micro-label">Disclosed volume</span>
                          <span className="num font-semibold text-zinc-700">
                            {vol > 0 ? formatCurrency(vol) : 'Undisclosed'}
                            {dealCount > 0 && <span className="text-zinc-500"> · {dealCount}</span>}
                          </span>
                        </div>
                        <div
                          role="img"
                          aria-label={`${company.name}: ${vol > 0 ? formatCurrency(vol) : 'no disclosed volume'} across ${dealCount} deals`}
                          className="bar-track h-1.5"
                        >
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-700"
                            style={{
                              width: `${
                                maxCompanyVolume > 0 && vol > 0
                                  ? Math.max((vol / maxCompanyVolume) * 100, 2)
                                  : 0
                              }%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 flex items-center justify-between gap-2 border-t border-zinc-100 pt-3">
                      <span className="inline-flex items-center gap-1.5">
                        <Globe2 aria-hidden="true" className="h-3 w-3 text-zinc-500" />
                        {company.headquarters_city
                          ? `${company.headquarters_city}, ${company.headquarters_country}`
                          : company.headquarters_country || 'Global'}
                      </span>
                      <span className="inline-flex items-center gap-1 font-mono text-[11px] font-semibold text-zinc-700 transition-colors group-hover:text-emerald-800">
                        Dossier
                        <ArrowRight aria-hidden="true" className="h-3 w-3" />
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
            <Pagination
              page={page}
              totalPages={totalPages}
              basePath="/companies"
              params={{ companyType: params.companyType, q: params.q }}
            />
          </>
        ) : (
          <div className="empty-state">
            <p className="font-mono text-label font-bold uppercase text-zinc-500">No entities match filter</p>
            <p className="mx-auto mt-2 max-w-sm text-xs text-zinc-500">
              Try broadening your search query or reset the sector filter.
            </p>
            <Link href="/companies" className="btn btn-primary mt-5">
              Reset filters
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}