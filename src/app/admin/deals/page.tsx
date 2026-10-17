import React from 'react';
import Link from 'next/link';
import { DataRepository } from '../../../lib/data/db';
import { EvidenceBadge } from '../../../components/EvidenceBadge';
import { formatCurrency, formatDealType } from '../../../lib/formatters';
import { Plus, Database, ExternalLink } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminDealsListPage() {
  const deals = await DataRepository.getDeals();

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="space-y-6">
        <div className="flex flex-col justify-between gap-4 border-b border-zinc-200 pb-5 sm:flex-row sm:items-end">
          <div>
            <p className="eyebrow">
              <Database aria-hidden="true" className="h-3.5 w-3.5" />
              <span>Administrative desk</span>
            </p>
            <h1 className="mt-1 text-2xl font-black tracking-tight text-zinc-950 sm:text-3xl">
              Deal ledger management
            </h1>
            <p className="mt-1 text-xs text-zinc-500">
              Audit, update, or archive transactions. All published records require primary statutory
              citations.
            </p>
          </div>

          <Link href="/admin/deals/new" className="btn btn-primary shrink-0">
            <Plus aria-hidden="true" className="h-3.5 w-3.5" />
            <span>Record deal</span>
          </Link>
        </div>

        <div className="ledger-shell">
          <div
            role="region"
            aria-label="Administrative deal ledger"
            tabIndex={0}
            className="ledger-scroll overflow-x-auto"
          >
            <table className="min-w-full text-left text-xs">
              <caption className="sr-only">Administrative deal ledger</caption>
              <thead>
                <tr className="ledger-head">
                  <th scope="col" className="ledger-head-cell">Publication</th>
                  <th scope="col" className="ledger-head-cell">Transaction / title</th>
                  <th scope="col" className="ledger-head-cell">Classification</th>
                  <th scope="col" className="ledger-head-cell text-right">Disclosed value</th>
                  <th scope="col" className="ledger-head-cell">Audit standard</th>
                  <th scope="col" className="ledger-head-cell">Sources cited</th>
                  <th scope="col" className="ledger-head-cell text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="ledger-body">
                {deals.map((deal) => (
                  <tr key={deal.id} className="ledger-row align-top">
                    <td className="whitespace-nowrap px-4 py-3">
                      {deal.is_published ? (
                        <span className="pill pill-mint">Published</span>
                      ) : (
                        <span className="pill pill-amber">Internal draft</span>
                      )}
                    </td>
                    <td className="max-w-xs truncate px-4 py-3 font-bold text-zinc-950">
                      <Link
                        href={`/deals/${deal.slug}`}
                        className="rounded transition-colors hover:text-emerald-800 hover:underline"
                      >
                        {deal.title}
                      </Link>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 font-medium text-zinc-700">
                      {formatDealType(deal.deal_type)}
                    </td>
                    <td className="num whitespace-nowrap px-4 py-3 text-right font-bold text-zinc-950">
                      {formatCurrency(deal.amount_value, deal.amount_currency)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <EvidenceBadge level={deal.evidence_level} size="sm" />
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 font-mono text-[11px] text-zinc-600">
                      {deal.sources?.length || 0} cited document(s)
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right">
                      <Link href={`/deals/${deal.slug}`} className="link-cite">
                        <span>Inspect</span>
                        <ExternalLink aria-hidden="true" className="h-2.5 w-2.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}