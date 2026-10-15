import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { DataRepository } from '../../../lib/data/db';
import { DealTable } from '../../../components/DealTable';
import { EvidenceBadge } from '../../../components/EvidenceBadge';

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
    title: `${company.name} — AI Financing, Capital Deals & Relationships`,
    description: company.description || `Disclosed financing deals, loans, and counterparties for ${company.name}.`,
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Breadcrumbs */}
      <nav className="text-xs text-slate-500 flex items-center space-x-2">
        <Link href="/" className="hover:text-slate-800">Home</Link>
        <span>/</span>
        <Link href="/companies" className="hover:text-slate-800">Companies</Link>
        <span>/</span>
        <span className="text-slate-800 font-medium">{company.name}</span>
      </nav>

      {/* Profile Header */}
      <div className="bg-white border border-slate-200 rounded-lg p-6 sm:p-8 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 uppercase">
                {company.company_type.replace('_', ' ')}
              </span>
              {company.is_public ? (
                <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 border border-emerald-200 rounded">
                  Public ({company.ticker ? `$${company.ticker}` : 'Listed'})
                </span>
              ) : (
                <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                  Privately Held
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {company.name}
            </h1>
          </div>

          {company.website_url && (
            <a
              href={company.website_url}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 border border-slate-300 text-xs font-medium text-slate-700 rounded hover:bg-slate-50 transition-colors inline-flex items-center gap-1"
            >
              <span>Official Website</span>
              <svg className="w-3 h-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          )}
        </div>

        <p className="text-sm text-slate-600 leading-relaxed max-w-3xl">
          {company.description}
        </p>

        {/* CIK / Regulator identifier */}
        {company.cik && (
          <div className="text-xs text-slate-400 font-mono">
            SEC EDGAR CIK: {company.cik} • Headquarters: {company.headquarters_city}, {company.headquarters_country}
          </div>
        )}
      </div>

      {/* Counterparty Relationships Table */}
      <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-xs space-y-4">
        <div>
          <h2 className="text-base font-bold text-slate-900">Documented Counterparty Relationships</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Verified supplier, equity, debt, or off-take ties with other market participants.
          </p>
        </div>

        {relationships.length === 0 ? (
          <p className="text-xs text-slate-400 italic">No direct standalone relationships recorded yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-xs">
              <thead className="bg-slate-50 uppercase font-semibold text-slate-600 text-[10px]">
                <tr>
                  <th className="px-3 py-2 text-left">Connected Entity</th>
                  <th className="px-3 py-2 text-left">Relationship Type</th>
                  <th className="px-3 py-2 text-left">Description</th>
                  <th className="px-3 py-2 text-left">Evidence</th>
                  <th className="px-3 py-2 text-right">Citation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {relationships.map((rel) => {
                  const isFrom = rel.from_company?.slug === slug;
                  const otherCompany = isFrom ? rel.to_company : rel.from_company;
                  const source = rel.sources?.[0]?.source;

                  return (
                    <tr key={rel.id} className="hover:bg-slate-50">
                      <td className="px-3 py-2.5 font-medium text-slate-900">
                        {otherCompany ? (
                          <Link href={`/companies/${otherCompany.slug}`} className="hover:underline">
                            {otherCompany.name}
                          </Link>
                        ) : (
                          'Unknown'
                        )}
                      </td>
                      <td className="px-3 py-2.5 font-mono text-slate-600">
                        {rel.relationship_type.replace('_', ' ')}
                      </td>
                      <td className="px-3 py-2.5 text-slate-600 max-w-xs">{rel.description}</td>
                      <td className="px-3 py-2.5">
                        <EvidenceBadge level={rel.evidence_level} />
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        {source ? (
                          <a
                            href={source.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-brand-600 hover:underline"
                          >
                            {source.publisher || 'Link'}
                          </a>
                        ) : (
                          '—'
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

      {/* Disclosed Deals Involving this Company */}
      <div className="space-y-4">
        <div>
          <h2 className="text-base font-bold text-slate-900">
            Disclosed Transactions ({deals.length})
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Financing rounds, credit lines, cloud infrastructure commitments, and off-take agreements.
          </p>
        </div>
        <DealTable deals={deals} />
      </div>
    </div>
  );
}
