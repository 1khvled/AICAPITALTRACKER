import React from 'react';
import Link from 'next/link';
import { DataRepository } from '../../lib/data/db';
import { getPendingItems, filterPendingItems } from '../../lib/data/fresh';
import { DealTable } from '../../components/DealTable';
import { Pagination, parsePageParam } from '../../components/Pagination';
import { formatCurrency } from '../../lib/formatters';
import { MiniDonut } from '../../components/charts/MiniDonut';
import { DateHistogram } from '../../components/charts/DateHistogram';
import { DEAL_TYPE_ORDER, dealTypeColor, dealTypeLabel } from '../../components/charts/chartTheme';
import { Metadata } from 'next';
import { Search, Database, ExternalLink } from 'lucide-react';

export const metadata: Metadata = {
  title: 'AI Deal Ledger — Disclosed Financing, Debt & Infrastructure Contracts',
  description:
    'Searchable, source-backed ledger of equity investments, GPU debt facilities, compute contracts, and power agreements for AI infrastructure.',
};

export const revalidate = 1800;

const PAGE_SIZE = 20;

interface DealsPageProps {
  searchParams: Promise<{
    dealType?: string;
    status?: string;
    evidenceLevel?: string;
    sort?: 'date_desc' | 'date_asc' | 'amount_desc' | 'amount_asc';
    q?: string;
    page?: string;
    tab?: string;
  }>;
}

export default async function DealsPage({ searchParams }: DealsPageProps) {
  const params = await searchParams;
  const tab = params.tab === 'fresh' ? 'fresh' : 'verified';
  const deals = await DataRepository.getDeals({
    dealType: params.dealType,
    status: params.status,
    evidenceLevel: params.evidenceLevel,
    sort: params.sort,
    query: params.q,
  });

  // Everything the ingest pulled that is not yet a verified deal: queue
  // candidates + fresh filings. Amounts are NEVER inferred — always TBD.
  const pendingAll = getPendingItems();
  const pending = filterPendingItems(pendingAll, params.q);

  const filteredVolume = deals.reduce((acc, d) => {
    if (d.amount_value) {
      if (d.amount_currency === 'EUR') return acc + d.amount_value * 1.08;
      if (d.amount_currency === 'AUD') return acc + d.amount_value * 0.65;
      return acc + d.amount_value;
    }
    return acc;
  }, 0);

  const selectedType = params.dealType || 'all';

  // Visual aggregates computed from the FILTERED deals (respect current filters).
  const EVIDENCE_COLORS: Record<string, string> = {
    confirmed_primary: '#059669',
    reported_secondary: '#2563eb',
    announced_not_completed: '#d97706',
    estimated: '#a3a3a3',
    disputed: '#dc2626',
    superseded: '#71717a',
  };
  const EVIDENCE_ORDER = [
    'confirmed_primary',
    'reported_secondary',
    'announced_not_completed',
    'estimated',
    'disputed',
    'superseded',
  ];
  const titleCase = (s: string) =>
    s
      .split('_')
      .map((w) => (w.length > 0 ? w[0].toUpperCase() + w.slice(1) : w))
      .join(' ');
  const typeCounts = new Map<string, number>();
  const evidenceCounts = new Map<string, number>();
  for (const d of deals) {
    typeCounts.set(d.deal_type, (typeCounts.get(d.deal_type) ?? 0) + 1);
    evidenceCounts.set(d.evidence_level, (evidenceCounts.get(d.evidence_level) ?? 0) + 1);
  }
  const typeDonut = DEAL_TYPE_ORDER.filter((t) => typeCounts.has(t)).map((t) => ({
    label: dealTypeLabel(t),
    value: typeCounts.get(t) ?? 0,
    color: dealTypeColor(t),
  }));
  const evidenceDonut = EVIDENCE_ORDER.filter((t) => evidenceCounts.has(t)).map((t) => ({
    label: titleCase(t),
    value: evidenceCounts.get(t) ?? 0,
    color: EVIDENCE_COLORS[t] ?? '#a3a3a3',
  }));

  const totalPages = Math.max(1, Math.ceil(deals.length / PAGE_SIZE));
  const page = parsePageParam(params.page, totalPages);
  const pagedDeals = deals.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const rangeStart = deals.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(page * PAGE_SIZE, deals.length);

  const pendingTotalPages = Math.max(1, Math.ceil(pending.length / PAGE_SIZE));
  const pendingPage = parsePageParam(params.page, pendingTotalPages);
  const pendingPaged = pending.slice((pendingPage - 1) * PAGE_SIZE, pendingPage * PAGE_SIZE);
  const pendingRangeStart = pending.length === 0 ? 0 : (pendingPage - 1) * PAGE_SIZE + 1;
  const pendingRangeEnd = Math.min(pendingPage * PAGE_SIZE, pending.length);

  const tabHref = (t: 'verified' | 'fresh'): string => {
    const search = new URLSearchParams();
    if (params.q) search.set('q', params.q);
    if (t === 'fresh') search.set('tab', 'fresh');
    const qs = search.toString();
    return qs ? `/deals?${qs}` : '/deals';
  };

  return (
    <div className="pb-16">
      {/* Terminal hero */}
      <section className="hero-terminal">
        <div className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <div className="max-w-3xl space-y-4">
              <span className="pill pill-terminal-mint">
                <Database aria-hidden="true" className="h-3.5 w-3.5" />
                Institutional capital ledger
              </span>
              <h1 className="text-3xl font-black leading-tight tracking-tight text-white sm:text-4xl lg:text-5xl">
                AI Infrastructure Financing Ledger
              </h1>
              <p className="max-w-2xl text-xs leading-relaxed text-zinc-400 sm:text-sm">
                Normalized ledger of private debt facilities, GPU asset-backed credit, hyperscaler equity,
                nuclear PPAs, and regulatory disputes.
              </p>
            </div>

            <div className="flex shrink-0 flex-wrap items-center gap-3">
              <div className="terminal-card px-3.5 py-2">
                <span className="micro-label-terminal">
                  {tab === 'verified' ? 'MATCHING: ' : 'PENDING: '}
                </span>
                <span className="num text-sm font-bold text-white">
                  {tab === 'verified' ? deals.length : pending.length}
                </span>
              </div>
              {tab === 'verified' ? (
                <span className="pill pill-terminal-mint px-3 py-1.5 text-[11px]">
                  FILTERED VOLUME: <span className="num text-white">{formatCurrency(filteredVolume)}</span>
                </span>
              ) : (
                <span className="pill border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-[11px] text-amber-300">
                  AMOUNT: <span className="text-white">TBD &mdash; never inferred</span>
                </span>
              )}
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl space-y-8 px-4 py-10 sm:px-6 lg:px-8">
        {/* Verified / Fresh tabs: the full pull, split by review state */}
        <div className="flex flex-wrap items-center gap-2" role="tablist" aria-label="Deal review state">
          <Link
            href={tabHref('verified')}
            role="tab"
            aria-selected={tab === 'verified'}
            className={`chip ${tab === 'verified' ? 'chip-active' : ''}`}
          >
            Verified deals ({deals.length})
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
            {deals.length} verified + {pendingAll.length} fresh / pending
          </span>
        </div>

        {tab === 'verified' ? (
          <>
            {/* Quick classification filters */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="micro-label mr-1">Quick filters:</span>
              {[
                { key: 'all', label: 'All Transactions' },
                { key: 'debt_credit_facility', label: 'GPU Debt & Credit Facilities' },
                { key: 'equity_investment', label: 'Hyperscaler Strategic Equity' },
                { key: 'power_purchase_agreement', label: 'Nuclear & Clean Energy PPAs' },
                { key: 'infrastructure_project_finance', label: 'Data Center Real Estate & ABS' },
                { key: 'strategic_partnership', label: 'Strategic JVs & Leaks' },
              ].map((tabItem) => {
                const isActive = selectedType === tabItem.key;
                const href = tabItem.key === 'all' ? '/deals' : `/deals?dealType=${tabItem.key}`;

                return (
                  <Link
                    key={tabItem.key}
                    href={href}
                    aria-current={isActive ? 'true' : undefined}
                    className={`chip ${isActive ? 'chip-active' : ''}`}
                  >
                    {tabItem.label}
                  </Link>
                );
              })}
            </div>

            {/* Query + filter console */}
            <div className="panel p-5 sm:p-6">
              <form method="GET" className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-6">
                <div className="lg:col-span-2">
                  <label htmlFor="q" className="field-label">
                    Search terms
                  </label>
                  <div className="relative mt-1.5">
                    <Search aria-hidden="true" className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-500" />
                    <input
                      id="q"
                      name="q"
                      type="text"
                      defaultValue={params.q || ''}
                      placeholder="Transaction, counterparty, or basis…"
                      className="field-search pl-9"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="dealType" className="field-label">
                    Classification
                  </label>
                  <select
                    id="dealType"
                    name="dealType"
                    defaultValue={params.dealType || 'all'}
                    className="field-native mt-1.5"
                  >
                    <option value="all">All Classifications</option>
                    <option value="debt_credit_facility">Debt / Credit Facility</option>
                    <option value="equity_investment">Equity Investment</option>
                    <option value="power_purchase_agreement">Power Purchase (PPA)</option>
                    <option value="cloud_compute_contract">Cloud Compute Contract</option>
                    <option value="infrastructure_project_finance">Project Finance &amp; JVs</option>
                    <option value="acquisition">Corporate Acquisition / Buyout</option>
                    <option value="strategic_partnership">
                      Strategic Partnership / Joint Venture
                    </option>
                    <option value="equipment_purchase">Hardware Procurement</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="evidenceLevel" className="field-label">
                    Audit standard
                  </label>
                  <select
                    id="evidenceLevel"
                    name="evidenceLevel"
                    defaultValue={params.evidenceLevel || 'all'}
                    className="field-native mt-1.5"
                  >
                    <option value="all">All Evidence Levels</option>
                    <option value="confirmed_primary">Confirmed Primary (SEC/IR)</option>
                    <option value="reported_secondary">Reported Secondary (Tier-1)</option>
                    <option value="announced_not_completed">Announced (Pending Approval)</option>
                    <option value="disputed">Regulatory Dispute (FERC)</option>
                    <option value="estimated">Estimated / Benchmark</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="status" className="field-label">
                    Deal status
                  </label>
                  <select
                    id="status"
                    name="status"
                    defaultValue={params.status || 'all'}
                    className="field-native mt-1.5"
                  >
                    <option value="all">All Statuses</option>
                    <option value="closed">Closed / Funded</option>
                    <option value="signed">Executed / Signed</option>
                    <option value="active">Active Operational</option>
                    <option value="announced">Publicly Announced</option>
                    <option value="proposed">Proposed / Term Sheet</option>
                    <option value="disputed">Disputed / Injunction</option>
                  </select>
                </div>

                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <label htmlFor="sort" className="field-label">
                      Sort
                    </label>
                    <select
                      id="sort"
                      name="sort"
                      defaultValue={params.sort || 'date_desc'}
                      className="field-native mt-1.5"
                    >
                      <option value="date_desc">Latest Date</option>
                      <option value="date_asc">Oldest Date</option>
                      <option value="amount_desc">Highest Value</option>
                    </select>
                  </div>
                  <button type="submit" className="btn btn-primary">
                    Filter
                  </button>
                </div>
              </form>
            </div>

            {/* Filter visuals (respect current filters) */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="panel-interactive p-5">
                <h2 className="panel-title border-b border-zinc-100 pb-2">
                  Filtered mix by deal type
                </h2>
                <div className="mt-3">
                  <MiniDonut data={typeDonut} centerLabel="deals" />
                </div>
              </div>
              <div className="panel-interactive p-5">
                <h2 className="panel-title border-b border-zinc-100 pb-2">
                  Filtered mix by evidence level
                </h2>
                <div className="mt-3">
                  <MiniDonut data={evidenceDonut} centerLabel="deals" />
                </div>
              </div>
              <div className="panel-interactive p-5">
                <DateHistogram deals={deals} title="Filtered deal flow per quarter" />
              </div>
            </div>

            {/* Ledger table */}
            <p className="caption">
              Showing {rangeStart}&ndash;{rangeEnd} of {deals.length} matching verified transactions
              <span className="text-zinc-500">
                {' '}
                ({deals.length} verified + {pendingAll.length} fresh / pending)
              </span>
            </p>
            <DealTable deals={pagedDeals} />
            <Pagination
              page={page}
              totalPages={totalPages}
              basePath="/deals"
              params={{
                dealType: params.dealType,
                status: params.status,
                evidenceLevel: params.evidenceLevel,
                sort: params.sort,
                q: params.q,
              }}
            />
          </>
        ) : (
          <>
            <div className="notice notice-amber">
              <p className="micro-label text-amber-900">
                Fresh / pending review &mdash; {pending.length} filing
                {pending.length === 1 ? '' : 's'} pulled by the SEC ingest, not yet verified as deals.
              </p>
              <p className="caption mt-1.5 text-amber-800">
                Each row is a real filing (8-K / 10-Q / 10-K) that may support a future deal record. Disclosed
                values are marked TBD until editorial review confirms them &mdash; amounts are never inferred
                from filing metadata. Deal-type filters apply to the verified ledger only.
              </p>
            </div>

            <p className="caption">
              Showing {pendingRangeStart}&ndash;{pendingRangeEnd} of {pending.length} fresh / pending filings
              <span className="text-zinc-500">
                {' '}
                ({deals.length} verified + {pendingAll.length} fresh / pending)
              </span>
            </p>

            {pendingPaged.length > 0 ? (
              <div className="ledger-shell">
                <div
                  role="region"
                  aria-label="Fresh pending deal leads"
                  tabIndex={0}
                  className="ledger-scroll overflow-x-auto"
                >
                  <table className="min-w-full text-left text-xs">
                    <caption className="sr-only">
                      Unverified filings that may support future deal records
                    </caption>
                    <thead>
                      <tr className="ledger-head">
                        <th scope="col" className="ledger-head-cell">
                          Date
                        </th>
                        <th scope="col" className="ledger-head-cell">
                          Issuer / Filing Scope
                        </th>
                        <th scope="col" className="ledger-head-cell">
                          Form
                        </th>
                        <th scope="col" className="ledger-head-cell text-right">
                          Disclosed Value
                        </th>
                        <th scope="col" className="ledger-head-cell">
                          Evidence Level
                        </th>
                        <th scope="col" className="ledger-head-cell text-right">
                          Statutory / Citation
                        </th>
                      </tr>
                    </thead>
                    <tbody className="ledger-body">
                      {pendingPaged.map((item) => (
                        <tr key={`pending-${item.key}`} className="ledger-row align-top">
                          <td className="whitespace-nowrap px-4 py-3 font-mono text-[11px] text-zinc-500">
                            {item.filingDate || <span className="text-zinc-500">Undisclosed</span>}
                          </td>
                          <td className="max-w-xs px-4 py-3 sm:max-w-md">
                            <span className="line-clamp-1 text-xs font-semibold text-zinc-900">
                              {item.entity} &mdash; {item.description}
                            </span>
                            <span className="micro-label mt-0.5 block">
                              {item.company
                                ? item.company.company_type.replace(/_/g, ' ')
                                : 'unmatched issuer'}
                              {' · '}via{' '}
                              {item.origin === 'discovery-queue' ? 'discovery queue' : 'fresh filing'}
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-4 py-3">
                            <span className="pill pill-neutral">{item.formType || 'unknown'}</span>
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-right font-mono text-[11px] font-bold text-amber-700">
                            TBD
                          </td>
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
              <div className="empty-state">
                <p className="font-mono text-label font-bold uppercase text-zinc-500">
                  No fresh leads match current search
                </p>
                <p className="mx-auto mt-2 max-w-sm text-xs text-zinc-500">
                  Try resetting search terms to see all pending filings.
                </p>
              </div>
            )}
            <Pagination
              page={pendingPage}
              totalPages={pendingTotalPages}
              basePath="/deals"
              params={{
                q: params.q,
                tab: 'fresh',
              }}
            />
          </>
        )}
      </div>
    </div>
  );
}