import React from 'react';
import Link from 'next/link';
import { DataRepository } from '../lib/data/db';
import { DealTable, formatCurrency } from '../components/DealTable';
import {
  ArrowRight,
  ShieldCheck,
  Zap,
  Cpu,
  Server,
  Coins,
  Search,
  ExternalLink,
  CheckCircle2,
  Lock,
} from 'lucide-react';

export const revalidate = 3600;

export default async function HomePage() {
  const metrics = await DataRepository.getPlatformMetrics();
  const latestDeals = await DataRepository.getDeals();
  const companies = await DataRepository.getCompanies();

  return (
    <div className="space-y-14 pb-16">
      {/* Editorial Financial Masthead Hero */}
      <section className="relative border-b border-zinc-200/90 bg-white">
        <div className="absolute inset-0 bg-grid-pattern opacity-40 pointer-events-none" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          <div className="max-w-4xl space-y-6">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-zinc-100 border border-zinc-200 text-zinc-700 text-xs font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>INDEPENDENT RESEARCH DATABASE</span>
              <span className="text-zinc-400">•</span>
              <span className="text-zinc-500">100% CITED DISCLOSURES</span>
            </div>

            <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-zinc-950 leading-[1.08] font-sans">
              Follow the capital flows behind AI infrastructure.
            </h1>

            <p className="text-base sm:text-lg text-zinc-600 leading-relaxed max-w-3xl">
              A transparent, source-backed research database tracking GPU-collateralized private debt, hyperscaler equity commitments, specialized cloud compute contracts, and multi-gigawatt nuclear off-take agreements.
            </p>

            {/* Terminal Command Bar / Quick Search */}
            <div className="pt-2">
              <form action="/search" method="GET" className="flex flex-col sm:flex-row gap-2 max-w-2xl">
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-zinc-400" />
                  <input
                    type="text"
                    name="q"
                    placeholder="Search by counterparty, ticker, or deal type (e.g. CoreWeave, NVIDIA, CEG, GPU debt)..."
                    className="w-full pl-10 pr-4 py-2.5 rounded border border-zinc-300 bg-white text-zinc-900 placeholder-zinc-400 text-xs sm:text-sm focus:outline-hidden focus:ring-1 focus:ring-zinc-950 focus:border-zinc-950 font-sans shadow-xs"
                  />
                </div>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-zinc-950 hover:bg-zinc-800 text-white font-mono text-xs uppercase tracking-wider font-semibold rounded transition-colors shrink-0 shadow-xs"
                >
                  Query Ledger
                </button>
              </form>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-zinc-500 font-mono pt-2">
                <span className="text-zinc-400">QUICK FILTERS:</span>
                <Link href="/deals?dealType=debt_credit_facility" className="hover:text-zinc-950 underline decoration-zinc-300">
                  GPU Debt Facilities
                </Link>
                <span>/</span>
                <Link href="/deals?dealType=equity_investment" className="hover:text-zinc-950 underline decoration-zinc-300">
                  Hyperscaler Strategic Equity
                </Link>
                <span>/</span>
                <Link href="/deals?dealType=power_purchase_agreement" className="hover:text-zinc-950 underline decoration-zinc-300">
                  Nuclear PPAs (Three Mile Island)
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Live Capital Stats Bar */}
        <div className="border-t border-zinc-200/90 bg-zinc-50/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 divide-y md:divide-y-0 md:divide-x divide-zinc-200">
              <div className="pt-2 md:pt-0">
                <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 font-semibold">
                  Disclosed Volume Documented
                </div>
                <div className="text-2xl font-bold font-mono text-zinc-950 tabular-nums mt-0.5">
                  {formatCurrency(metrics.totalDisclosedVolume)}
                </div>
                <div className="text-[10px] text-zinc-400 font-mono mt-0.5">Primary SEC & IR releases</div>
              </div>

              <div className="pt-2 md:pt-0 md:pl-6">
                <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 font-semibold">
                  Verified Transactions
                </div>
                <div className="text-2xl font-bold font-mono text-zinc-950 tabular-nums mt-0.5">
                  {metrics.totalDeals}
                </div>
                <div className="text-[10px] text-emerald-600 font-mono mt-0.5">100% cited & audited</div>
              </div>

              <div className="pt-2 md:pt-0 md:pl-6">
                <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 font-semibold">
                  Tracked Counterparties
                </div>
                <div className="text-2xl font-bold font-mono text-zinc-950 tabular-nums mt-0.5">
                  {metrics.totalCompanies}
                </div>
                <div className="text-[10px] text-zinc-400 font-mono mt-0.5">Labs, hyperscalers, lenders</div>
              </div>

              <div className="pt-2 md:pt-0 md:pl-6">
                <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 font-semibold">
                  Primary Statutory Sources
                </div>
                <div className="text-2xl font-bold font-mono text-zinc-950 tabular-nums mt-0.5">
                  {metrics.totalSources}
                </div>
                <div className="text-[10px] text-zinc-400 font-mono mt-0.5">SEC 10-K, 10-Q, 8-K & IR</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* AI Capital Allocation Structure Blueprint */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 border-b border-zinc-200 pb-3">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 font-bold">
              CAPITAL TAXONOMY
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-zinc-950 tracking-tight">
              How Capital Flows Across the AI Ecosystem
            </h2>
          </div>
          <Link
            href="/relationships"
            className="text-xs font-mono font-medium text-zinc-600 hover:text-zinc-950 flex items-center gap-1"
          >
            <span>Inspect Counterparty Flow Map</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card 1: Asset-Backed GPU Debt */}
          <div className="p-5 bg-white border border-zinc-200 rounded-lg hover:border-zinc-400 transition-all flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="p-2 rounded bg-amber-500/10 text-amber-700">
                  <Coins className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                  CREDIT FACILITY
                </span>
              </div>
              <h3 className="font-bold text-zinc-950 text-sm">GPU-Collateralized Debt Facilities</h3>
              <p className="text-xs text-zinc-500 leading-relaxed">
                Specialized AI cloud providers (CoreWeave) pledge high-density NVIDIA H100 GPU clusters as physical hardware collateral to syndicate lenders (Blackstone, Magnetar) to fund cluster buildout.
              </p>
            </div>
            <div className="pt-3 border-t border-zinc-100 flex items-center justify-between text-[11px] font-mono">
              <span className="text-zinc-400">BENCHMARK: CoreWeave</span>
              <Link href="/deals/coreweave-2-3-billion-gpu-collateralized-debt-facility" className="text-zinc-900 font-semibold hover:underline">
                $2.3B Facility &rarr;
              </Link>
            </div>
          </div>

          {/* Card 2: Hyperscaler Equity & Compute */}
          <div className="p-5 bg-white border border-zinc-200 rounded-lg hover:border-zinc-400 transition-all flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="p-2 rounded bg-blue-500/10 text-blue-700">
                  <Server className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200">
                  EQUITY + CLOUD
                </span>
              </div>
              <h3 className="font-bold text-zinc-950 text-sm">Strategic Equity & Compute Commitments</h3>
              <p className="text-xs text-zinc-500 leading-relaxed">
                Hyperscalers (Microsoft, Amazon) provide multi-billion dollar capital rounds to foundation model labs (OpenAI, Anthropic), structured with exclusive or primary cloud infrastructure consumption terms.
              </p>
            </div>
            <div className="pt-3 border-t border-zinc-100 flex items-center justify-between text-[11px] font-mono">
              <span className="text-zinc-400">BENCHMARK: MSFT / OpenAI</span>
              <Link href="/deals/microsoft-openai-multi-billion-investment-2023" className="text-zinc-900 font-semibold hover:underline">
                $10.0B Round &rarr;
              </Link>
            </div>
          </div>

          {/* Card 3: Nuclear & Clean Energy PPAs */}
          <div className="p-5 bg-white border border-zinc-200 rounded-lg hover:border-zinc-400 transition-all flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="p-2 rounded bg-emerald-500/10 text-emerald-700">
                  <Zap className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                  POWER PURCHASE
                </span>
              </div>
              <h3 className="font-bold text-zinc-950 text-sm">Nuclear & Clean Power Off-Take PPAs</h3>
              <p className="text-xs text-zinc-500 leading-relaxed">
                20-year off-take agreements restarting commercial nuclear reactors (Crane Clean Energy Center / Three Mile Island Unit 1) to provide dedicated carbon-free baseload energy for gigawatt data center campuses.
              </p>
            </div>
            <div className="pt-3 border-t border-zinc-100 flex items-center justify-between text-[11px] font-mono">
              <span className="text-zinc-400">BENCHMARK: CEG / MSFT</span>
              <Link href="/deals/constellation-microsoft-crane-clean-energy-ppa-835mw" className="text-zinc-900 font-semibold hover:underline">
                835 MW PPA &rarr;
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Main Ledger Table */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 border-b border-zinc-200 pb-3">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 font-bold">
              VERIFIED LEDGER
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-zinc-950 tracking-tight">
              Recent Disclosed Transactions
            </h2>
          </div>
          <Link
            href="/deals"
            className="text-xs font-mono font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
          >
            <span>Open Searchable Deal Ledger ({latestDeals.length})</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        <DealTable deals={latestDeals} />
      </section>

      {/* Monitored Counterparties Matrix */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 border-b border-zinc-200 pb-3">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 font-bold">
              ENTITY DIRECTORY
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-zinc-950 tracking-tight">
              Ecosystem Participants
            </h2>
          </div>
          <Link
            href="/companies"
            className="text-xs font-mono font-medium text-zinc-600 hover:text-zinc-950 flex items-center gap-1"
          >
            <span>View All Entities ({companies.length})</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {companies.slice(0, 8).map((company) => (
            <Link
              key={company.id}
              href={`/companies/${company.slug}`}
              className="p-4 bg-white border border-zinc-200 rounded-lg hover:border-zinc-400 hover:shadow-xs transition-all flex flex-col justify-between group"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[10px] font-mono">
                  <span className="uppercase text-zinc-500 px-1.5 py-0.5 rounded bg-zinc-100">
                    {company.company_type.replace(/_/g, ' ')}
                  </span>
                  {company.ticker ? (
                    <span className="font-bold text-zinc-900 bg-zinc-50 border border-zinc-200 px-1.5 py-0.5 rounded">
                      ${company.ticker}
                    </span>
                  ) : (
                    <span className="text-zinc-400">Private</span>
                  )}
                </div>
                <h3 className="font-bold text-zinc-950 text-sm group-hover:text-blue-600 transition-colors">
                  {company.name}
                </h3>
                <p className="text-xs text-zinc-500 line-clamp-2 leading-relaxed">
                  {company.description}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-zinc-100 flex items-center justify-between text-[11px] font-mono text-zinc-400">
                <span>{company.headquarters_country || 'Global'}</span>
                <span className="text-zinc-900 font-medium group-hover:translate-x-0.5 transition-transform">
                  Profile &rarr;
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Zero-Slop Institutional Integrity Guarantee */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="border border-zinc-200 bg-zinc-950 text-zinc-100 rounded-lg p-8 sm:p-10 space-y-6">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <span className="text-xs font-mono uppercase tracking-wider text-zinc-400">
              AUDIT INTEGRITY STANDARD
            </span>
          </div>

          <div className="max-w-3xl space-y-3">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Zero fabricated deal amounts. Zero uncorroborated social speculation.
            </h2>
            <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
              Unlike generic news scrapers and speculative blogs, AICapitalTracker treats financial records with statutory rigor. If a deal term is undisclosed by the parties, we record it as <em>Not Disclosed</em>. We never invent implied valuations or present analyst gossip as verified cash flows.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-zinc-800 text-xs">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-white block font-mono text-[11px]">SEC EDGAR First</strong>
                <span className="text-zinc-400 text-[11px]">Official Form 10-K, 10-Q, 8-K filings anchor every corporate disclosure.</span>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-white block font-mono text-[11px]">Primary Citations</strong>
                <span className="text-zinc-400 text-[11px]">Every deal requires a persistent public URL and publication timestamp.</span>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-white block font-mono text-[11px]">Audit Logs</strong>
                <span className="text-zinc-400 text-[11px]">Transparent editorial review process with documented dispute tracking.</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
