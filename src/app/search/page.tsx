import React from 'react';
import Link from 'next/link';
import { Metadata } from 'next';
import { DataRepository } from '../../lib/data/db';
import { DealTable } from '../../components/DealTable';
import { Search, Database, Layers, ArrowRight } from 'lucide-react';

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
      {/* Header */}
      <div className="border-b border-zinc-200 pb-5">
        <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-wider text-zinc-500 font-bold">
          <Search className="w-3.5 h-3.5 text-zinc-400" />
          <span>GLOBAL QUERY TERMINAL</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-zinc-950 tracking-tight mt-1">
          Search Ledger & Counterparty Universe
        </h1>
        <p className="text-xs sm:text-sm text-zinc-500 mt-1">
          Execute multi-entity queries across verified transactions, CIK filings, and financing agreements.
        </p>
      </div>

      {/* Search Input Box */}
      <form method="GET" action="/search" className="max-w-2xl">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              name="q"
              defaultValue={cleanQuery}
              placeholder="Query entity (e.g. CoreWeave, NVIDIA), ticker (MSFT), or basis..."
              className="w-full pl-10 pr-4 py-2 border border-zinc-300 rounded text-xs sm:text-sm text-zinc-900 focus:outline-hidden focus:ring-1 focus:ring-zinc-950 font-sans shadow-xs"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2 bg-zinc-950 hover:bg-zinc-800 text-white font-mono text-xs uppercase tracking-wider font-semibold rounded transition-colors shrink-0 shadow-xs"
          >
            Execute
          </button>
        </div>
      </form>

      {cleanQuery !== '' ? (
        <div className="space-y-8">
          {/* Companies match */}
          {matchingCompanies.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-zinc-500" />
                <h2 className="text-sm font-mono uppercase tracking-wider text-zinc-950 font-bold">
                  Matching Entities ({matchingCompanies.length})
                </h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {matchingCompanies.map((c) => (
                  <Link
                    key={c.id}
                    href={`/companies/${c.slug}`}
                    className="p-3.5 bg-white border border-zinc-200 rounded-lg hover:border-zinc-400 transition-colors group flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between text-[10px] font-mono mb-1">
                        <span className="uppercase text-zinc-500">{c.company_type.replace(/_/g, ' ')}</span>
                        {c.ticker && <span className="font-bold text-zinc-900">${c.ticker}</span>}
                      </div>
                      <div className="font-bold text-zinc-950 text-sm group-hover:text-blue-600 transition-colors">
                        {c.name}
                      </div>
                    </div>
                    <div className="mt-2 text-[10px] font-mono text-zinc-400 flex items-center justify-between">
                      <span>{c.headquarters_country || 'Global'}</span>
                      <span className="text-zinc-900 font-medium">Profile &rarr;</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Deals match */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-zinc-500" />
              <h2 className="text-sm font-mono uppercase tracking-wider text-zinc-950 font-bold">
                Matching Ledger Transactions ({matchingDeals.length})
              </h2>
            </div>
            <DealTable deals={matchingDeals} />
          </div>
        </div>
      ) : (
        <div className="p-12 border border-dashed border-zinc-300 rounded-lg text-center space-y-2 bg-zinc-50/50">
          <p className="text-xs font-mono uppercase text-zinc-500 font-bold">Terminal Awaiting Query</p>
          <p className="text-xs text-zinc-400 max-w-sm mx-auto">
            Enter an entity (e.g. CoreWeave, Blackstone), counterparty, or transaction type to search.
          </p>
        </div>
      )}
    </div>
  );
}
