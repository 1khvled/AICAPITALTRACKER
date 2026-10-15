import React from 'react';
import { DataRepository } from '../../lib/data/db';
import { DealTable } from '../../components/DealTable';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AI Deal Ledger — Disclosed Financing, Debt & Infrastructure Contracts',
  description:
    'Searchable, source-backed ledger of equity investments, GPU debt facilities, compute contracts, and power agreements for AI infrastructure.',
};

export const revalidate = 1800; // 30 minutes

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
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          AI Financing & Infrastructure Deal Ledger
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Search verified transactions with documented counterparty relationships, evidence levels, and primary citations.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 border border-slate-200 rounded-lg shadow-xs space-y-3">
        <form method="GET" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Query input */}
          <div className="lg:col-span-2">
            <label htmlFor="q" className="block text-[11px] font-semibold text-slate-500 uppercase">Search</label>
            <input
              id="q"
              name="q"
              type="text"
              defaultValue={params.q || ''}
              placeholder="Filter by deal title or counterparty..."
              className="mt-1 w-full px-3 py-1.5 border border-slate-300 rounded text-xs text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-brand-500"
            />
          </div>

          {/* Deal Type */}
          <div>
            <label htmlFor="dealType" className="block text-[11px] font-semibold text-slate-500 uppercase">Type</label>
            <select
              id="dealType"
              name="dealType"
              defaultValue={params.dealType || 'all'}
              className="mt-1 w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-brand-500 bg-white"
            >
              <option value="all">All Types</option>
              <option value="equity_investment">Equity Investment</option>
              <option value="debt_credit_facility">Debt / Credit Facility</option>
              <option value="cloud_compute_contract">Cloud Compute Contract</option>
              <option value="power_purchase_agreement">Power Purchase Agreement</option>
              <option value="infrastructure_project_finance">Project Finance</option>
            </select>
          </div>

          {/* Evidence Level */}
          <div>
            <label htmlFor="evidenceLevel" className="block text-[11px] font-semibold text-slate-500 uppercase">Evidence Level</label>
            <select
              id="evidenceLevel"
              name="evidenceLevel"
              defaultValue={params.evidenceLevel || 'all'}
              className="mt-1 w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-brand-500 bg-white"
            >
              <option value="all">All Evidence</option>
              <option value="confirmed_primary">Confirmed Primary</option>
              <option value="reported_secondary">Reported Secondary</option>
              <option value="announced_not_completed">Announced (Pending)</option>
            </select>
          </div>

          {/* Sort & Submit */}
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <label htmlFor="sort" className="block text-[11px] font-semibold text-slate-500 uppercase">Sort</label>
              <select
                id="sort"
                name="sort"
                defaultValue={params.sort || 'date_desc'}
                className="mt-1 w-full px-2 py-1.5 border border-slate-300 rounded text-xs text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-brand-500 bg-white"
              >
                <option value="date_desc">Latest Date</option>
                <option value="date_asc">Oldest Date</option>
                <option value="amount_desc">Highest Amount</option>
              </select>
            </div>
            <button
              type="submit"
              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium rounded transition-colors"
            >
              Apply
            </button>
          </div>
        </form>
      </div>

      {/* Results Count & Table */}
      <div className="space-y-2">
        <div className="text-xs text-slate-500 font-mono">
          Showing {deals.length} verified transaction{deals.length === 1 ? '' : 's'}
        </div>
        <DealTable deals={deals} />
      </div>
    </div>
  );
}
