import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { DataRepository } from '../../../lib/data/db';
import { DealTable } from '../../../components/DealTable';
import { formatCurrency } from '../../../lib/formatters';
import { EvidenceBadge } from '../../../components/EvidenceBadge';
import {
  Building2,
  ExternalLink,
  ShieldCheck,
  TrendingUp,
  Coins,
  Layers,
  ArrowRight,
} from 'lucide-react';

interface CompanyPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({ params }: CompanyPageProps): Promise<Metadata> {
  const { slug } = await params;
  const company = await DataRepository.getCompanyBySlug(slug);

  if (!company) {
    return {
      title: 'Company Not Found',
    };
  }

  return {
    title: `${company.name} — Capital Structure, Debt Facilities & Counterparties`,
    description: company.description || `Verified financing, debt facilities, and counterparty relationships for ${company.name}.`,
    alternates: {
      canonical: `/companies/${company.slug}`,
    },
  };
}

export default async function CompanyProfilePage({ params }: CompanyPageProps) {
  const { slug } = await params;
  const company = await DataRepository.getCompanyBySlug(slug);

  if (!company) {
    notFound();
  }

  const deals = await DataRepository.getDeals({ companySlug: slug });
  const relationships = await DataRepository.getRelationships(slug);

  const totalCapitalVolume = deals.reduce((sum, d) => sum + (d.amount_value || 0), 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Breadcrumbs */}
      <nav className="text-xs text-zinc-500 font-mono flex items-center space-x-2">
        <Link href="/" className="hover:text-zinc-950">HOME</Link>
        <span>/</span>
        <Link href="/companies" className="hover:text-zinc-950">COMPANIES</Link>
        <span>/</span>
        <span className="text-zinc-800 font-medium truncate">{company.name}</span>
      </nav>

      {/* Entity Dossier Header */}
      <div className="border border-zinc-200 rounded-lg bg-white p-6 sm:p-8 space-y-6 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-100 pb-4">
          <div className="flex items-center gap-2.5">
            <span className="font-mono text-xs px-2.5 py-0.5 rounded bg-zinc-100 text-zinc-800 uppercase font-semibold">
              {company.company_type.replace(/_/g, ' ')}
            </span>
            {company.is_public ? (
              <span className="font-mono text-xs px-2.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold">
                PUBLIC • {company.ticker ? `$${company.ticker}` : 'LISTED'}
              </span>
            ) : (
              <span className="font-mono text-xs px-2.5 py-0.5 rounded bg-zinc-100 text-zinc-600 font-medium">
                PRIVATELY HELD
              </span>
            )}
          </div>

          {company.website_url && (
            <a
              href={company.website_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-mono text-zinc-700 border border-zinc-200 rounded hover:bg-zinc-50 transition-colors"
            >
              <span>{new URL(company.website_url).hostname}</span>
              <ExternalLink className="w-3 h-3 text-zinc-400" />
            </a>
          )}
        </div>

        <div className="space-y-3">
          <h1 className="text-3xl sm:text-4xl font-black text-zinc-950 tracking-tight">
            {company.name}
          </h1>
          <p className="text-sm text-zinc-600 leading-relaxed max-w-4xl">
            {company.description}
          </p>
        </div>

        {/* Financial Dossier Metadata Bar */}
        <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-lg grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 font-semibold">
              Tracked Disclosed Capital
            </div>
            <div className="text-xl font-bold font-mono text-zinc-950 tabular-nums mt-0.5">
              {formatCurrency(totalCapitalVolume)}
            </div>
            <div className="text-[10px] font-mono text-zinc-400 mt-0.5">Across {deals.length} transaction(s)</div>
          </div>

          <div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 font-semibold">
              SEC EDGAR Identifier
            </div>
            <div className="text-xs font-mono font-bold text-zinc-800 mt-1">
              {company.cik ? `CIK ${company.cik}` : 'Non-Reporting / Private'}
            </div>
            <div className="text-[10px] text-zinc-400 font-mono mt-0.5">U.S. Securities & Exchange Comm.</div>
          </div>

          <div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 font-semibold">
              Operational Base
            </div>
            <div className="text-xs font-mono font-bold text-zinc-800 mt-1">
              {company.headquarters_city ? `${company.headquarters_city}, ${company.headquarters_country}` : (company.headquarters_country || 'Global')}
            </div>
            <div className="text-[10px] text-zinc-400 font-mono mt-0.5">Primary headquarters</div>
          </div>

          <div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 font-semibold">
              Documented Ties
            </div>
            <div className="text-xl font-bold font-mono text-zinc-950 tabular-nums mt-0.5">
              {relationships.length}
            </div>
            <div className="text-[10px] text-zinc-400 font-mono mt-0.5">Verified counterparties</div>
          </div>
        </div>
      </div>

      {/* Counterparty Flow Network */}
      <div className="border border-zinc-200 rounded-lg bg-white p-6 space-y-4 shadow-xs">
        <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
          <div>
            <h2 className="text-sm font-mono uppercase tracking-wider text-zinc-950 font-bold">
              Documented Counterparty Network ({relationships.length})
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              Verified supplier, customer, debt syndicate, or equity ties.
            </p>
          </div>
          <Link href="/relationships" className="text-xs font-mono text-blue-600 hover:underline">
            View full ecosystem &rarr;
          </Link>
        </div>

        {relationships.length === 0 ? (
          <p className="text-xs text-zinc-400 font-mono italic py-4">No standalone counterparty links indexed yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-xs text-left">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50 text-[10px] font-mono uppercase text-zinc-500">
                  <th className="py-2.5 px-3">Connected Entity</th>
                  <th className="py-2.5 px-3">Relationship Flow</th>
                  <th className="py-2.5 px-3">Scope / Description</th>
                  <th className="py-2.5 px-3">Evidence</th>
                  <th className="py-2.5 px-3 text-right">Citation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {relationships.map((rel) => {
                  const isFrom = rel.from_company?.slug === slug;
                  const otherCompany = isFrom ? rel.to_company : rel.from_company;
                  const source = rel.sources?.[0]?.source;

                  return (
                    <tr key={rel.id} className="hover:bg-zinc-50/70 transition-colors">
                      <td className="py-3 px-3 font-semibold text-zinc-950">
                        {otherCompany ? (
                          <Link href={`/companies/${otherCompany.slug}`} className="hover:underline hover:text-blue-600">
                            {otherCompany.name}
                          </Link>
                        ) : (
                          'Unknown'
                        )}
                        <span className="block text-[10px] font-mono text-zinc-400 font-normal">
                          {otherCompany?.company_type.replace(/_/g, ' ')}
                        </span>
                      </td>

                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-zinc-100 text-zinc-800 uppercase font-medium">
                          {rel.relationship_type.replace(/_/g, ' ')}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-zinc-600 max-w-sm leading-normal">
                        {rel.description}
                      </td>

                      <td className="py-3 px-3 whitespace-nowrap">
                        <EvidenceBadge level={rel.evidence_level} size="sm" />
                      </td>

                      <td className="py-3 px-3 whitespace-nowrap text-right">
                        {source ? (
                          <a
                            href={source.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-mono text-[11px] text-blue-600 hover:underline"
                          >
                            {source.publisher || 'Link'}
                          </a>
                        ) : (
                          <span className="text-zinc-300 font-mono">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Verified Deals Ledger for this Company */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-200 pb-3">
          <div>
            <h2 className="text-lg font-bold text-zinc-950 tracking-tight">
              Disclosed Transactions Involving {company.name} ({deals.length})
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              Debt financings, strategic capital injections, compute allocations, and PPAs.
            </p>
          </div>
        </div>

        <DealTable deals={deals} />
      </div>
    </div>
  );
}
