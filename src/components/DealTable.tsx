import React from 'react';
import Link from 'next/link';
import { Deal } from '../lib/types';
import { EvidenceBadge } from './EvidenceBadge';
import { formatCurrency, formatDealType } from '../lib/formatters';
import { ArrowRight, ExternalLink, Inbox } from 'lucide-react';

interface DealTableProps {
  deals: Deal[];
}

export function DealTable({ deals }: DealTableProps) {
  if (deals.length === 0) {
    return (
      <div className="empty-state" role="status">
        <div
          className="mx-auto flex h-11 w-11 items-center justify-center rounded-full border border-zinc-200 bg-zinc-50"
          aria-hidden="true"
        >
          <Inbox className="h-4 w-4 text-zinc-500" />
        </div>
        <p className="micro-label mt-4 justify-center">No transactions match current filters</p>
        <p className="mx-auto mt-2 max-w-sm text-xs leading-relaxed text-zinc-500">
          Try resetting sector filters, evidence level, or search terms to see verified deals.
        </p>
        <Link href="/deals" className="btn btn-primary mt-5">
          Reset ledger filters
          <ArrowRight aria-hidden="true" className="h-3 w-3" />
        </Link>
      </div>
    );
  }

  return (
    <div className="ledger-shell">
      <div
        role="region"
        aria-label="Deal ledger table"
        tabIndex={0}
        className="ledger-scroll overflow-x-auto"
      >
        <table className="min-w-full text-left text-xs">
          <caption className="sr-only">Verified AI infrastructure financing transactions</caption>
          <thead className="ledger-head sticky top-0 z-10">
            <tr>
              <th scope="col" className="ledger-head-cell whitespace-nowrap">
                Date
              </th>
              <th scope="col" className="ledger-head-cell min-w-[220px]">
                Transaction / Scope
              </th>
              <th scope="col" className="ledger-head-cell">
                Counterparty Flow
              </th>
              <th scope="col" className="ledger-head-cell">
                Classification
              </th>
              <th scope="col" className="ledger-head-cell text-right">
                Disclosed Value
              </th>
              <th scope="col" className="ledger-head-cell">
                Evidence Level
              </th>
              <th scope="col" className="ledger-head-cell text-right">
                Statutory / Citation
              </th>
            </tr>
          </thead>
          <tbody className="ledger-body">
            {deals.map((deal) => {
              const primarySource =
                deal.sources?.find((s) => s.is_primary_support)?.source || deal.sources?.[0]?.source;

              return (
                <tr key={deal.id} className="ledger-row group align-top">
                  {/* Announcement date */}
                  <td className="whitespace-nowrap px-4 py-3.5 font-mono text-[11px] tabular-nums text-zinc-500">
                    {deal.announcement_date || <span className="text-zinc-500">Undisclosed</span>}
                  </td>

                  {/* Title + neutral summary */}
                  <td className="max-w-xs px-4 py-3.5 sm:max-w-md">
                    <Link
                      href={`/deals/${deal.slug}`}
                      className="line-clamp-1 rounded text-[13px] font-semibold text-zinc-900 underline-offset-2 transition-colors hover:text-emerald-800 hover:underline"
                    >
                      {deal.title}
                    </Link>
                    <p className="mt-0.5 line-clamp-1 text-[11px] leading-normal text-zinc-500">
                      {deal.summary}
                    </p>
                  </td>

                  {/* Counterparty flow — each name stays welded to its role pill so a
                      narrow column can never orphan the direction arrow. */}
                  <td className="px-4 py-3.5">
                    <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
                      {deal.parties && deal.parties.length >= 2 ? (
                        <>
                          <span className="inline-flex items-center gap-1.5">
                            {deal.parties[0].company?.slug ? (
                              <Link
                                href={`/companies/${deal.parties[0].company.slug}`}
                                className="rounded font-medium text-zinc-900 underline-offset-2 transition-colors hover:text-emerald-800 hover:underline"
                              >
                                {deal.parties[0].company?.name || 'Party A'}
                              </Link>
                            ) : (
                              <span className="font-medium text-zinc-900">
                                {deal.parties[0].company?.name || 'Party A'}
                              </span>
                            )}
                            <span className="pill pill-neutral px-1.5 text-[9px]">
                              {deal.parties[0].role}
                            </span>
                          </span>

                          <ArrowRight aria-hidden="true" className="h-3 w-3 shrink-0 text-zinc-500" />

                          <span className="inline-flex items-center gap-1.5">
                            {deal.parties[1].company?.slug ? (
                              <Link
                                href={`/companies/${deal.parties[1].company.slug}`}
                                className="rounded font-medium text-zinc-900 underline-offset-2 transition-colors hover:text-emerald-800 hover:underline"
                              >
                                {deal.parties[1].company?.name || 'Party B'}
                              </Link>
                            ) : (
                              <span className="font-medium text-zinc-900">
                                {deal.parties[1].company?.name || 'Party B'}
                              </span>
                            )}
                            <span className="pill pill-neutral px-1.5 text-[9px]">
                              {deal.parties[1].role}
                            </span>
                          </span>
                        </>
                      ) : (
                        deal.parties?.map((p, idx) => (
                          <span key={p.id || idx} className="font-medium text-zinc-700">
                            {p.company?.name} <span className="text-zinc-500">({p.role})</span>
                          </span>
                        ))
                      )}
                    </div>
                  </td>

                  {/* Category & basis */}
                  <td className="whitespace-nowrap px-4 py-3.5">
                    <div className="flex flex-col gap-1">
                      <span className="text-[11px] font-semibold text-zinc-800">
                        {formatDealType(deal.deal_type)}
                      </span>
                      {deal.amount_basis && (
                        <span className="micro-label text-[9px] tracking-wider">
                          {deal.amount_basis.replace(/_/g, ' ')}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Disclosed amount */}
                  <td className="whitespace-nowrap px-4 py-3.5 text-right">
                    {deal.amount_disclosed && deal.amount_value !== null ? (
                      <div className="num text-[13px] font-bold text-zinc-950">
                        {formatCurrency(deal.amount_value, deal.amount_currency)}
                      </div>
                    ) : (
                      <span className="pill pill-neutral font-normal not-italic">Not Disclosed</span>
                    )}
                  </td>

                  {/* Evidence level */}
                  <td className="whitespace-nowrap px-4 py-3.5">
                    <EvidenceBadge level={deal.evidence_level} size="sm" />
                  </td>

                  {/* Primary citation */}
                  <td className="whitespace-nowrap px-4 py-3.5 text-right">
                    {primarySource ? (
                      <a
                        href={primarySource.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={primarySource.title}
                        className="link-cite"
                      >
                        <span className="max-w-[120px] truncate">
                          {primarySource.publisher || 'Filing'}
                        </span>
                        <ExternalLink aria-hidden="true" className="h-2.5 w-2.5 text-zinc-500" />
                      </a>
                    ) : (
                      <span className="font-mono text-xs text-zinc-500">&mdash;</span>
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

/** Shimmering skeleton rows for ledger loading states (pure presentational). */
export function DealTableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="ledger-shell" aria-hidden="true">
      <div className="divide-y divide-zinc-100">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-3.5">
            <div className="skeleton h-3 w-20 rounded" />
            <div className="skeleton h-3 flex-1 rounded" />
            <div className="skeleton hidden h-3 w-32 rounded sm:block" />
            <div className="skeleton hidden h-5 w-24 rounded-full md:block" />
            <div className="skeleton ml-auto h-3 w-16 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}