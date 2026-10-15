import React from 'react';
import Link from 'next/link';
import { Metadata } from 'next';
import { DataRepository } from '../../lib/data/db';
import { DealTable } from '../../components/DealTable';

export const metadata: Metadata = {
  title: 'Global Search — AI Capital Tracker',
  description: 'Search deals, companies, counterparties, and filings across AI Capital Tracker.',
};

interface SearchPageProps {
  searchParams: Promise<{
    q?: string;
  }>;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q = '' } = await searchParams;
  const cleanQuery = q.trim();

  const [matchingDeals, matchingCompanies] = await Promise.all([
    DataRepository.getDeals({ query: cleanQuery }),
    DataRepository.getCompanies({ query: cleanQuery }),
  ]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Search Database
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Querying verified transactions, companies, and counterparties.
        </p>
      </div>

      {/* Search Input Box */}
      <form method="GET" action="/search" className="max-w-2xl">
        <div className="flex gap-2">
          <input
            type="text"
            name="q"
            defaultValue={cleanQuery}
            placeholder="Search deals, entities, tickers, or keywords..."
            className="flex-1 px-4 py-2 border border-slate-300 rounded-md text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-brand-500"
          />
          <button
            type="submit"
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs rounded-md transition-colors"
          >
            Search
          </button>
        </div>
      </form>

      {cleanQuery !== '' ? (
        <div className="space-y-8">
          {/* Companies match */}
          {matchingCompanies.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-base font-bold text-slate-900">
                Matching Companies ({matchingCompanies.length})
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {matchingCompanies.map((c) => (
                  <Link
                    key={c.id}
                    href={`/companies/${c.slug}`}
                    className="p-3 bg-white border border-slate-200 rounded hover:border-slate-400 transition-colors"
                  >
                    <div className="font-bold text-slate-900 text-sm">{c.name}</div>
                    <div className="text-[11px] font-mono text-slate-400 uppercase">
                      {c.company_type.replace('_', ' ')} {c.ticker ? `• $${c.ticker}` : ''}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Deals match */}
          <div className="space-y-3">
            <h2 className="text-base font-bold text-slate-900">
              Matching Deals ({matchingDeals.length})
            </h2>
            <DealTable deals={matchingDeals} />
          </div>
        </div>
      ) : (
        <div className="p-8 border border-dashed border-slate-200 rounded-lg text-center text-xs text-slate-500">
          Enter an entity name (e.g. NVIDIA, OpenAI, Constellation) or transaction keyword to search.
        </div>
      )}
    </div>
  );
}
