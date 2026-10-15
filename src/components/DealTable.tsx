import React from 'react';
import Link from 'next/link';
import { Deal } from '../lib/types';
import { EvidenceBadge } from './EvidenceBadge';
import { formatCurrency, formatDealType } from '../lib/formatters';
import { ArrowRight, ExternalLink } from 'lucide-react';

interface DealTableProps {
  deals: Deal[];
}

export function DealTable({ deals }: DealTableProps) {
  if (deals.length === 0) {
    return (
      <div className="text-center py-16 border border-dashed border-zinc-300 rounded-lg bg-zinc-50/50">
        <p className="text-xs font-mono font-semibold uppercase tracking-wider text-zinc-500">
          No transactions match current filters
        </p>
        <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">
          Try resetting sector filters, evidence level, or search terms to see verified deals.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden border border-zinc-200/90 rounded-lg bg-white shadow-xs">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-xs">
          <thead>
            <tr className="border-b border-zinc-200 bg-zinc-50/70 text-[10px] font-mono uppercase text-zinc-500 tracking-wider">
              <th scope="col" className="py-2.5 px-4 font-semibold">Date</th>
              <th scope="col" className="py-2.5 px-4 font-semibold">Transaction / Scope</th>
              <th scope="col" className="py-2.5 px-4 font-semibold">Counterparty Flow</th>
              <th scope="col" className="py-2.5 px-4 font-semibold">Classification</th>
              <th scope="col" className="py-2.5 px-4 font-semibold text-right">Disclosed Value</th>
              <th scope="col" className="py-2.5 px-4 font-semibold">Evidence Level</th>
              <th scope="col" className="py-2.5 px-4 font-semibold text-right">Statutory / Citation</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 font-normal text-zinc-800">
            {deals.map((deal) => {
              const primarySource = deal.sources?.find((s) => s.is_primary_support)?.source || deal.sources?.[0]?.source;

              return (
                <tr key={deal.id} className="hover:bg-zinc-50/70 transition-colors group">
                  {/* Announcement Date */}
                  <td className="py-3 px-4 whitespace-nowrap font-mono text-[11px] text-zinc-500">
                    {deal.announcement_date || <span className="text-zinc-400">Undisclosed</span>}
                  </td>

                  {/* Title & Neutral Summary */}
                  <td className="py-3 px-4 max-w-xs sm:max-w-md">
                    <Link
                      href={`/deals/${deal.slug}`}
                      className="font-semibold text-zinc-900 group-hover:text-blue-600 transition-colors line-clamp-1 text-xs"
                    >
                      {deal.title}
                    </Link>
                    <p className="text-[11px] text-zinc-500 line-clamp-1 mt-0.5 leading-normal">
                      {deal.summary}
                    </p>
                  </td>

                  {/* Counterparties Flow */}
                  <td className="py-3 px-4 whitespace-nowrap">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {deal.parties && deal.parties.length >= 2 ? (
                        <>
                          <Link
                            href={`/companies/${deal.parties[0].company?.slug}`}
                            className="font-medium text-zinc-900 hover:underline"
                          >
                            {deal.parties[0].company?.name || 'Party A'}
                          </Link>
                          <span className="text-[9px] font-mono px-1 py-0.5 rounded bg-zinc-100 text-zinc-500">
                            {deal.parties[0].role}
                          </span>
                          <ArrowRight className="w-3 h-3 text-zinc-400 shrink-0" />
                          <Link
                            href={`/companies/${deal.parties[1].company?.slug}`}
                            className="font-medium text-zinc-900 hover:underline"
                          >
                            {deal.parties[1].company?.name || 'Party B'}
                          </Link>
                          <span className="text-[9px] font-mono px-1 py-0.5 rounded bg-zinc-100 text-zinc-500">
                            {deal.parties[1].role}
                          </span>
                        </>
                      ) : (
                        deal.parties?.map((p, idx) => (
                          <span key={p.id || idx} className="text-zinc-700 font-medium">
                            {p.company?.name} <span className="text-zinc-400">({p.role})</span>
                          </span>
                        ))
                      )}
                    </div>
                  </td>

                  {/* Category & Basis */}
                  <td className="py-3 px-4 whitespace-nowrap">
                    <div className="flex flex-col gap-0.5">
                      <span className="font-medium text-zinc-800 text-[11px]">
                        {formatDealType(deal.deal_type)}
                      </span>
                      {deal.amount_basis && (
                        <span className="font-mono text-[9px] uppercase tracking-wider text-zinc-400">
                          {deal.amount_basis.replace(/_/g, ' ')}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Disclosed Amount */}
                  <td className="py-3 px-4 whitespace-nowrap text-right">
                    {deal.amount_disclosed && deal.amount_value !== null ? (
                      <div className="font-mono font-bold text-zinc-950 text-xs tabular-nums">
                        {formatCurrency(deal.amount_value, deal.amount_currency)}
                      </div>
                    ) : (
                      <span className="font-mono text-[11px] text-zinc-400 italic">
                        Not Disclosed
                      </span>
                    )}
                  </td>

                  {/* Evidence Level Badge */}
                  <td className="py-3 px-4 whitespace-nowrap">
                    <EvidenceBadge level={deal.evidence_level} size="sm" />
                  </td>

                  {/* Primary Citation Link */}
                  <td className="py-3 px-4 whitespace-nowrap text-right">
                    {primarySource ? (
                      <a
                        href={primarySource.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 font-mono text-[11px] text-zinc-600 hover:text-zinc-950 hover:underline transition-colors"
                        title={primarySource.title}
                      >
                        <span className="truncate max-w-[120px]">{primarySource.publisher || 'Filing'}</span>
                        <ExternalLink className="w-2.5 h-2.5 text-zinc-400" />
                      </a>
                    ) : (
                      <span className="text-zinc-300 font-mono text-xs">—</span>
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
