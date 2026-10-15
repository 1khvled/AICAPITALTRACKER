import React from 'react';
import Link from 'next/link';
import { Deal } from '../lib/types';
import { EvidenceBadge } from './EvidenceBadge';

interface DealTableProps {
  deals: Deal[];
  showPagination?: boolean;
}

export function formatCurrency(amount: number | null, currency: string | null = 'USD'): string {
  if (amount === null || amount === undefined) {
    return 'Not disclosed';
  }

  if (amount >= 1_000_000_000) {
    return `$${(amount / 1_000_000_000).toFixed(amount % 1_000_000_000 === 0 ? 0 : 1)}B`;
  }
  if (amount >= 1_000_000) {
    return `$${(amount / 1_000_000).toFixed(amount % 1_000_000 === 0 ? 0 : 1)}M`;
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency || 'USD',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDealType(dealType: string): string {
  return dealType
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function DealTable({ deals }: DealTableProps) {
  if (deals.length === 0) {
    return (
      <div className="text-center py-12 border border-dashed border-slate-300 rounded-lg bg-slate-50">
        <p className="text-sm font-medium text-slate-700">No verified deals matching the criteria.</p>
        <p className="text-xs text-slate-500 mt-1">Adjust filters or search query to see other records.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto border border-slate-200 rounded-lg shadow-xs bg-white">
      <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
        <thead className="bg-slate-50 text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
          <tr>
            <th scope="col" className="px-4 py-3">Date</th>
            <th scope="col" className="px-4 py-3">Transaction</th>
            <th scope="col" className="px-4 py-3">Parties</th>
            <th scope="col" className="px-4 py-3">Type</th>
            <th scope="col" className="px-4 py-3">Amount</th>
            <th scope="col" className="px-4 py-3">Evidence</th>
            <th scope="col" className="px-4 py-3 text-right">Source</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 font-normal text-slate-800">
          {deals.map((deal) => {
            const primarySource = deal.sources?.[0]?.source;
            return (
              <tr key={deal.id} className="hover:bg-slate-50/80 transition-colors">
                <td className="px-4 py-3.5 whitespace-nowrap text-xs font-mono text-slate-500">
                  {deal.announcement_date || 'Undisclosed'}
                </td>
                <td className="px-4 py-3.5">
                  <Link
                    href={`/deals/${deal.slug}`}
                    className="font-medium text-slate-900 hover:text-brand-600 transition-colors line-clamp-1"
                  >
                    {deal.title}
                  </Link>
                  <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{deal.summary}</p>
                </td>
                <td className="px-4 py-3.5 whitespace-nowrap">
                  <div className="flex flex-wrap gap-1 items-center">
                    {deal.parties?.map((p, idx) => (
                      <span key={p.id || idx} className="inline-flex items-center text-xs">
                        {p.company ? (
                          <Link
                            href={`/companies/${p.company.slug}`}
                            className="font-medium text-slate-700 hover:underline"
                          >
                            {p.company.name}
                          </Link>
                        ) : (
                          'Unknown'
                        )}
                        <span className="text-[10px] text-slate-400 ml-1">({p.role})</span>
                        {idx < (deal.parties?.length || 1) - 1 && <span className="text-slate-300 mx-1">•</span>}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3.5 whitespace-nowrap text-xs text-slate-600">
                  {formatDealType(deal.deal_type)}
                </td>
                <td className="px-4 py-3.5 whitespace-nowrap">
                  {deal.amount_disclosed ? (
                    <span className="font-semibold text-slate-900 font-mono text-xs">
                      {formatCurrency(deal.amount_value, deal.amount_currency)}
                    </span>
                  ) : (
                    <span className="text-xs text-slate-400 italic">Not disclosed</span>
                  )}
                </td>
                <td className="px-4 py-3.5 whitespace-nowrap">
                  <EvidenceBadge level={deal.evidence_level} />
                </td>
                <td className="px-4 py-3.5 whitespace-nowrap text-right">
                  {primarySource ? (
                    <a
                      href={primarySource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-xs text-brand-600 hover:text-brand-800 font-medium hover:underline"
                      title={primarySource.title}
                    >
                      <span>{primarySource.publisher || 'Citation'}</span>
                      <svg className="w-3 h-3 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  ) : (
                    <span className="text-xs text-slate-400">—</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
