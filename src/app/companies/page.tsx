import React from 'react';
import Link from 'next/link';
import { Metadata } from 'next';
import { DataRepository } from '../../lib/data/db';

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
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          AI Infrastructure Company Directory
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Explore profiles for foundational labs, cloud operators, hardware vendors, and private lenders.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 border border-slate-200 rounded-lg shadow-xs">
        <form method="GET" className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2">
            <label htmlFor="q" className="block text-[11px] font-semibold text-slate-500 uppercase">Search</label>
            <input
              id="q"
              name="q"
              type="text"
              defaultValue={params.q || ''}
              placeholder="Search companies by name, ticker, or description..."
              className="mt-1 w-full px-3 py-1.5 border border-slate-300 rounded text-xs text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-brand-500"
            />
          </div>

          <div className="flex items-end gap-2">
            <div className="flex-1">
              <label htmlFor="companyType" className="block text-[11px] font-semibold text-slate-500 uppercase">Sector</label>
              <select
                id="companyType"
                name="companyType"
                defaultValue={params.companyType || 'all'}
                className="mt-1 w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-brand-500 bg-white"
              >
                <option value="all">All Sectors</option>
                <option value="ai_lab">AI Lab</option>
                <option value="chipmaker">Chipmaker</option>
                <option value="cloud_provider">Cloud Provider</option>
                <option value="utility_power">Utility / Power</option>
                <option value="lender">Lender / Private Credit</option>
                <option value="infrastructure_equipment">Infrastructure / Thermal</option>
              </select>
            </div>
            <button
              type="submit"
              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium rounded transition-colors"
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
            className="p-5 bg-white border border-slate-200 rounded-lg hover:border-slate-400 hover:shadow-xs transition-all flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-slate-100 text-slate-700 uppercase">
                  {company.company_type.replace('_', ' ')}
                </span>
                {company.ticker ? (
                  <span className="font-mono font-bold text-slate-700 bg-slate-50 px-2 py-0.5 border border-slate-200 rounded">
                    ${company.ticker}
                  </span>
                ) : (
                  <span className="text-[11px] text-slate-400">Private</span>
                )}
              </div>
              <h2 className="font-bold text-slate-900 text-base">{company.name}</h2>
              <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">{company.description}</p>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
              <span>{company.headquarters_country || 'Global'}</span>
              <span className="text-brand-600 font-medium">View Profile &rarr;</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
