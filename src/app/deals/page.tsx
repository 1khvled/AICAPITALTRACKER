import React from 'react';
import { DataRepository } from '../../lib/data/db';
import { DealTable } from '../../components/DealTable';
import { Metadata } from 'next';
import { Search, Filter, Database } from 'lucide-react';

export const metadata: Metadata = {
  title: 'AI Deal Ledger — Disclosed Financing, Debt & Infrastructure Contracts',
  description:
    'Searchable, source-backed ledger of equity investments, GPU debt facilities, compute contracts, and power agreements for AI infrastructure.',
};

export const revalidate = 1800;

interface DealsPageProps {
  searchParams: Promise<{
    dealType?: string;
    status?: string;
    evidenceLevel?: string;
    sort?: 'date_desc' | 'date_asc' | 'amount_desc' | 'amount_asc';
    q?: string;
  }>;
}

export default async function DealsPage({ searchParams }: DealsPageProps) {
  const params = await searchParams;
  const deals = await DataRepository.getDeals({
    dealType: params.dealType,
    status: params.status,
    evidenceLevel: params.evidenceLevel,
    sort: params.sort,
    query: params.q,
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      {/* Ledger Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-zinc-200 pb-5">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-wider text-zinc-500 font-bold">
            <Database className="w-3.5 h-3.5 text-zinc-400" />
            <span>FINANCIAL DATABASE LEDGER</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-zinc-950 tracking-tight mt-1">
            AI Infrastructure Financing Ledger
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 mt-1">
            Normalized ledger of debt facilities, GPU asset-backed credit, hyperscaler equity, and nuclear power agreements.
          </p>
        </div>

        <div className="font-mono text-xs text-zinc-500 bg-zinc-100 border border-zinc-200 px-3 py-1.5 rounded">
          INDEXED RECORDS: <span className="font-bold text-zinc-950">{deals.length}</span>
        </div>
      </div>

      {/* Terminal Query & Filter Strip */}
      <div className="bg-white p-4 border border-zinc-200 rounded-lg shadow-xs space-y-3">
        <form method="GET" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Query input */}
          <div className="lg:col-span-2">
            <label htmlFor="q" className="block text-[10px] font-mono uppercase tracking-wider text-zinc-500 font-bold">
              Search Terms
            </label>
            <div className="relative mt-1">
              <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-zinc-400" />
              <input
                id="q"
                name="q"
                type="text"
                defaultValue={params.q || ''}
                placeholder="Search transaction, counterparty, or basis..."
                className="w-full pl-9 pr-3 py-1.5 border border-zinc-300 rounded text-xs text-zinc-900 focus:outline-hidden focus:ring-1 focus:ring-zinc-950 font-sans"
              />
            </div>
          </div>

          {/* Deal Category */}
          <div>
            <label htmlFor="dealType" className="block text-[10px] font-mono uppercase tracking-wider text-zinc-500 font-bold">
              Classification
            </label>
            <select
              id="dealType"
              name="dealType"
              defaultValue={params.dealType || 'all'}
              className="mt-1 w-full px-2.5 py-1.5 border border-zinc-300 rounded text-xs text-zinc-900 bg-white font-mono"
            >
              <option value="all">All Classifications</option>
              <option value="debt_credit_facility">Debt / Credit Facility</option>
              <option value="equity_investment">Equity Investment</option>
              <option value="power_purchase_agreement">Power Purchase (PPA)</option>
              <option value="cloud_compute_contract">Cloud Compute Contract</option>
              <option value="infrastructure_project_finance">Project Finance</option>
            </select>
          </div>

          {/* Evidence Standard */}
          <div>
            <label htmlFor="evidenceLevel" className="block text-[10px] font-mono uppercase tracking-wider text-zinc-500 font-bold">
              Audit Standard
            </label>
            <select
              id="evidenceLevel"
              name="evidenceLevel"
              defaultValue={params.evidenceLevel || 'all'}
              className="mt-1 w-full px-2.5 py-1.5 border border-zinc-300 rounded text-xs text-zinc-900 bg-white font-mono"
            >
              <option value="all">All Evidence Levels</option>
              <option value="confirmed_primary">Confirmed Primary</option>
              <option value="reported_secondary">Reported Secondary</option>
              <option value="announced_not_completed">Announced (Pending)</option>
            </select>
          </div>

          {/* Sort & Trigger */}
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <label htmlFor="sort" className="block text-[10px] font-mono uppercase tracking-wider text-zinc-500 font-bold">
                Sort Order
              </label>
              <select
                id="sort"
                name="sort"
                defaultValue={params.sort || 'date_desc'}
                className="mt-1 w-full px-2 py-1.5 border border-zinc-300 rounded text-xs text-zinc-900 bg-white font-mono"
              >
                <option value="date_desc">Latest Date</option>
                <option value="date_asc">Oldest Date</option>
                <option value="amount_desc">Highest Amount</option>
              </select>
            </div>
            <button
              type="submit"
              className="px-4 py-1.5 bg-zinc-950 hover:bg-zinc-800 text-white font-mono text-xs font-semibold uppercase tracking-wider rounded transition-colors"
            >
              Filter
            </button>
          </div>
        </form>
      </div>

      {/* Ledger Table */}
      <DealTable deals={deals} />
    </div>
  );
}
