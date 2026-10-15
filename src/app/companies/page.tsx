import React from 'react';
import Link from 'next/link';
import { Metadata } from 'next';
import { DataRepository } from '../../lib/data/db';
import { Search, Layers, Building2, ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Company Directory — AI Labs, Chipmakers, Hyperscalers & Financiers',
  description:
    'Comprehensive directory of artificial intelligence labs, specialized cloud operators, GPU chipmakers, utility power providers, and debt financiers.',
};

export const revalidate = 1800;

interface CompaniesPageProps {
  searchParams: Promise<{
    companyType?: string;
    q?: string;
  }>;
}

export default async function CompaniesPage({ searchParams }: CompaniesPageProps) {
  const params = await searchParams;
  const companies = await DataRepository.getCompanies({
    companyType: params.companyType,
    query: params.q,
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-zinc-200 pb-5">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-wider text-zinc-500 font-bold">
            <Layers className="w-3.5 h-3.5 text-zinc-400" />
            <span>ENTITY UNIVERSE</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-zinc-950 tracking-tight mt-1">
            Tracked Companies & Infrastructure Entities
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 mt-1">
            Foundation labs, hyperscalers, chipmakers, private credit lenders, and utility off-takers.
          </p>
        </div>

        <div className="font-mono text-xs text-zinc-500 bg-zinc-100 border border-zinc-200 px-3 py-1.5 rounded">
          ENTITIES: <span className="font-bold text-zinc-950">{companies.length}</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 border border-zinc-200 rounded-lg shadow-xs">
        <form method="GET" className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2">
            <label htmlFor="q" className="block text-[10px] font-mono uppercase tracking-wider text-zinc-500 font-bold">
              Search Entities
            </label>
            <div className="relative mt-1">
              <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-zinc-400" />
              <input
                id="q"
                name="q"
                type="text"
                defaultValue={params.q || ''}
                placeholder="Search by name, ticker, or sector description..."
                className="w-full pl-9 pr-3 py-1.5 border border-zinc-300 rounded text-xs text-zinc-900 focus:outline-hidden focus:ring-1 focus:ring-zinc-950"
              />
            </div>
          </div>

          <div className="flex items-end gap-2">
            <div className="flex-1">
              <label htmlFor="companyType" className="block text-[10px] font-mono uppercase tracking-wider text-zinc-500 font-bold">
                Sector
              </label>
              <select
                id="companyType"
                name="companyType"
                defaultValue={params.companyType || 'all'}
                className="mt-1 w-full px-2.5 py-1.5 border border-zinc-300 rounded text-xs text-zinc-900 bg-white font-mono"
              >
                <option value="all">All Sectors</option>
                <option value="ai_lab">AI Lab</option>
                <option value="chipmaker">Chipmaker</option>
                <option value="cloud_provider">Cloud Provider</option>
                <option value="utility_power">Utility / Power</option>
                <option value="lender">Lender / Private Credit</option>
                <option value="infrastructure_equipment">Thermal & Infrastructure</option>
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

      {/* Companies Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {companies.map((company) => (
          <Link
            key={company.id}
            href={`/companies/${company.slug}`}
            className="p-5 bg-white border border-zinc-200 rounded-lg hover:border-zinc-400 hover:shadow-xs transition-all flex flex-col justify-between group"
          >
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-mono text-[10px] font-semibold px-2 py-0.5 rounded bg-zinc-100 text-zinc-700 uppercase">
                  {company.company_type.replace(/_/g, ' ')}
                </span>
                {company.ticker ? (
                  <span className="font-mono font-bold text-zinc-900 bg-zinc-50 px-2 py-0.5 border border-zinc-200 rounded text-[11px]">
                    ${company.ticker}
                  </span>
                ) : (
                  <span className="text-[10px] font-mono text-zinc-400">Private</span>
                )}
              </div>

              <h2 className="font-bold text-zinc-950 text-base group-hover:text-blue-600 transition-colors">
                {company.name}
              </h2>
              <p className="text-xs text-zinc-500 line-clamp-3 leading-relaxed">
                {company.description}
              </p>
            </div>

            <div className="mt-5 pt-3 border-t border-zinc-100 flex items-center justify-between text-xs font-mono text-zinc-400">
              <span>{company.headquarters_country || 'Global'}</span>
              <span className="text-zinc-900 font-semibold group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                <span>Dossier</span>
                <ArrowRight className="w-3 h-3" />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
