import React from 'react';
import Link from 'next/link';
import { DataRepository } from '../lib/data/db';
import { DealTable, formatCurrency } from '../components/DealTable';

export const revalidate = 3600; // Cache for 1 hour

export default async function HomePage() {
  const metrics = await DataRepository.getPlatformMetrics();
  const latestDeals = await DataRepository.getDeals();
  const companies = await DataRepository.getCompanies();

  return (
    <div className="space-y-16 pb-12">
      {/* Hero Section */}
      <section className="bg-slate-900 text-white border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-24">
          <div className="max-w-3xl space-y-5">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-slate-800 text-slate-300 text-xs font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Verified Financial Intelligence
            </div>
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
              Follow the money behind AI infrastructure.
            </h1>
            <p className="text-base sm:text-lg text-slate-300 leading-relaxed">
              A transparent, source-backed research database tracking GPU-collateralized loans, equity investments, hyperscaler cloud commitments, and multi-gigawatt power agreements.
            </p>

            {/* Quick Search */}
            <form action="/search" method="GET" className="pt-2 flex flex-col sm:flex-row gap-2 max-w-xl">
              <div className="relative flex-1">
                <input
                  type="text"
                  name="q"
                  placeholder="Search deals, companies, counterparties (e.g. CoreWeave, NVIDIA, nuclear)..."
                  className="w-full pl-4 pr-10 py-3 rounded-md bg-slate-800/90 border border-slate-700 text-white placeholder-slate-400 text-sm focus:outline-hidden focus:ring-2 focus:ring-brand-500"
                />
              </div>
              <button
                type="submit"
                className="px-6 py-3 bg-brand-500 hover:bg-brand-600 text-white font-medium text-sm rounded-md transition-colors"
              >
                Search Ledger
              </button>
            </form>
            <div className="text-xs text-slate-400 flex flex-wrap gap-2 pt-1">
              <span>Popular:</span>
              <Link href="/deals?dealType=debt_credit_facility" className="text-slate-300 underline hover:text-white">
                GPU Debt Facilities
              </Link>
              <span>•</span>
              <Link href="/companies/coreweave" className="text-slate-300 underline hover:text-white">
                CoreWeave
              </Link>
              <span>•</span>
              <Link href="/deals?dealType=power_purchase_agreement" className="text-slate-300 underline hover:text-white">
                Nuclear PPAs
              </Link>
              <span>•</span>
              <Link href="/companies/nvidia" className="text-slate-300 underline hover:text-white">
                NVIDIA Supply
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Metrics Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 bg-white border border-slate-200 rounded-lg shadow-xs">
          <div>
            <div className="text-xs text-slate-500 font-medium">Disclosed Capital Tracked</div>
            <div className="text-2xl font-bold font-mono text-slate-900 mt-1">
              {formatCurrency(metrics.totalDisclosedVolume)}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">Primary documented figures</div>
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium">Verified Transactions</div>
            <div className="text-2xl font-bold font-mono text-slate-900 mt-1">
              {metrics.totalDeals}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">Zero unverified rumors</div>
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium">Monitored Entities</div>
            <div className="text-2xl font-bold font-mono text-slate-900 mt-1">
              {metrics.totalCompanies}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">Labs, hyperscalers, lenders</div>
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium">Primary Citations</div>
            <div className="text-2xl font-bold font-mono text-slate-900 mt-1">
              {metrics.totalSources}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">SEC filings & company PR</div>
          </div>
        </div>
      </section>

      {/* Latest Verified Deals */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Latest Verified Deals</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Source-backed AI infrastructure investments, debt packages, and contracts.
            </p>
          </div>
          <Link
            href="/deals"
            className="text-xs font-semibold text-brand-600 hover:text-brand-800 flex items-center gap-1"
          >
            <span>View Full Ledger</span>
            <span>&rarr;</span>
          </Link>
        </div>

        <DealTable deals={latestDeals.slice(0, 10)} />
      </section>

      {/* Financing Categories */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Explore Financing Categories</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Understand how capital flows into hardware, compute clusters, and energy.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link
            href="/deals?dealType=debt_credit_facility"
            className="p-6 bg-white border border-slate-200 rounded-lg hover:border-brand-500 hover:shadow-xs transition-all group"
          >
            <div className="text-xs font-semibold uppercase tracking-wider text-brand-600 mb-1">
              Asset-Backed Credit
            </div>
            <h3 className="text-base font-bold text-slate-900 group-hover:text-brand-600 transition-colors">
              GPU-Collateralized Debt Facilities
            </h3>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              Specialized cloud providers pledging NVIDIA H100/H200/B200 clusters to private credit lenders (Blackstone, Magnetar, Coatue) to fund expansion.
            </p>
          </Link>

          <Link
            href="/deals?dealType=equity_investment"
            className="p-6 bg-white border border-slate-200 rounded-lg hover:border-brand-500 hover:shadow-xs transition-all group"
          >
            <div className="text-xs font-semibold uppercase tracking-wider text-emerald-600 mb-1">
              Hyperscaler Capital
            </div>
            <h3 className="text-base font-bold text-slate-900 group-hover:text-brand-600 transition-colors">
              Strategic Equity & Cloud Commitments
            </h3>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              Multi-billion dollar capital injections from Microsoft, Amazon, and Google into foundation model labs bundled with long-term cloud compute consumption terms.
            </p>
          </Link>

          <Link
            href="/deals?dealType=power_purchase_agreement"
            className="p-6 bg-white border border-slate-200 rounded-lg hover:border-brand-500 hover:shadow-xs transition-all group"
          >
            <div className="text-xs font-semibold uppercase tracking-wider text-amber-600 mb-1">
              Energy & Utilities
            </div>
            <h3 className="text-base font-bold text-slate-900 group-hover:text-brand-600 transition-colors">
              Nuclear & Clean Power Agreements (PPA)
            </h3>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              Long-term off-take contracts restarting nuclear reactors (Three Mile Island Crane Clean Energy Center) and contracting dedicated grid capacity for AI training data centers.
            </p>
          </Link>
        </div>
      </section>

      {/* Featured Companies */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Key Tracked Companies</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Review disclosed counterparties, suppliers, and investors.
            </p>
          </div>
          <Link
            href="/companies"
            className="text-xs font-semibold text-brand-600 hover:text-brand-800 flex items-center gap-1"
          >
            <span>Browse All {companies.length} Companies</span>
            <span>&rarr;</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {companies.slice(0, 8).map((company) => (
            <Link
              key={company.id}
              href={`/companies/${company.slug}`}
              className="p-4 bg-white border border-slate-200 rounded-md hover:border-slate-400 hover:shadow-xs transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                  <span className="uppercase font-mono">{company.company_type.replace('_', ' ')}</span>
                  {company.ticker && <span className="font-mono font-semibold text-slate-600">${company.ticker}</span>}
                </div>
                <h3 className="font-semibold text-slate-900 text-sm">{company.name}</h3>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">{company.description}</p>
              </div>
              <div className="mt-4 pt-2 border-t border-slate-100 text-[11px] text-brand-600 font-medium">
                View Financing History &rarr;
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* How We Verify Data (Methodology callout) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-slate-100 border border-slate-300 rounded-lg p-8">
          <div className="max-w-3xl space-y-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-600">
              Editorial Integrity & Methodology
            </span>
            <h2 className="text-2xl font-bold text-slate-900">
              Zero fabricated deal values. Every claim citation-backed.
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              AICapitalTracker does not rely on anonymous social media rumors or uncorroborated blog speculation. We only publish records supported by primary SEC filings (10-K, 10-Q, 8-K), company investor relations releases, and verified financial reporting. If an amount is undisclosed, we label it as such rather than presenting an estimate as fact.
            </p>
            <div className="pt-2">
              <Link
                href="/methodology"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium rounded transition-colors"
              >
                <span>Read Full Evidence & Verification Methodology</span>
                <span>&rarr;</span>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
