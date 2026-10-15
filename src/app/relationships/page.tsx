import React from 'react';
import Link from 'next/link';
import { Metadata } from 'next';
import { DataRepository } from '../../lib/data/db';
import { EvidenceBadge } from '../../components/EvidenceBadge';

export const metadata: Metadata = {
  title: 'Relationship Explorer — AI Ecosystem Ties, Equity, Compute & Debt',
  description:
    'Search and inspect verified ties connecting AI foundation labs, GPU manufacturers, private lenders, and utility operators.',
};

export const revalidate = 1800;

export default async function RelationshipsPage() {
  const relationships = await DataRepository.getRelationships();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          AI Infrastructure Relationship Explorer
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Direct, verified interconnections between chipmakers, cloud hyperscalers, foundation model labs, and power suppliers.
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-xs">
          <thead className="bg-slate-50 uppercase font-semibold text-slate-600 text-[10px] tracking-wider">
            <tr>
              <th className="px-4 py-3 text-left">Entity Origin</th>
              <th className="px-4 py-3 text-left">Relationship Type</th>
              <th className="px-4 py-3 text-left">Connected Counterparty</th>
              <th className="px-4 py-3 text-left">Effective Date</th>
              <th className="px-4 py-3 text-left">Description</th>
              <th className="px-4 py-3 text-left">Evidence Standard</th>
              <th className="px-4 py-3 text-right">Primary Citation</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {relationships.map((rel) => {
              const source = rel.sources?.[0]?.source;
              return (
                <tr key={rel.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-4 py-3.5 whitespace-nowrap font-semibold text-slate-900">
                    {rel.from_company ? (
                      <Link href={`/companies/${rel.from_company.slug}`} className="hover:underline">
                        {rel.from_company.name}
                      </Link>
                    ) : (
                      'Unknown'
                    )}
                  </td>
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    <span className="font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px]">
                      {rel.relationship_type.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 whitespace-nowrap font-semibold text-slate-900">
                    {rel.to_company ? (
                      <Link href={`/companies/${rel.to_company.slug}`} className="hover:underline">
                        {rel.to_company.name}
                      </Link>
                    ) : (
                      'Unknown'
                    )}
                  </td>
                  <td className="px-4 py-3.5 whitespace-nowrap font-mono text-slate-500 text-[11px]">
                    {rel.start_date || 'Ongoing'}
                  </td>
                  <td className="px-4 py-3.5 text-slate-600 max-w-sm leading-relaxed">
                    {rel.description}
                  </td>
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    <EvidenceBadge level={rel.evidence_level} />
                  </td>
                  <td className="px-4 py-3.5 whitespace-nowrap text-right">
                    {source ? (
                      <a
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-brand-600 font-medium hover:underline inline-flex items-center gap-1"
                      >
                        <span>{source.publisher || 'Citation'}</span>
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
