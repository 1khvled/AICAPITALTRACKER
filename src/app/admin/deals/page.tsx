import React from 'react';
import Link from 'next/link';
import { DataRepository } from '../../../lib/data/db';
import { EvidenceBadge } from '../../../components/EvidenceBadge';
import { formatCurrency, formatDealType } from '../../../components/DealTable';

export const dynamic = 'force-dynamic';

export default async function AdminDealsListPage() {
  const deals = await DataRepository.getDeals();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Admin Deal Ledger Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Review, edit, publish, and audit verified transactions.
          </p>
        </div>

        <Link
          href="/admin/deals/new"
          className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium rounded transition-colors"
        >
          + Create Deal
        </Link>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-xs">
          <thead className="bg-slate-50 uppercase font-semibold text-slate-600 text-[10px]">
            <tr>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Title</th>
              <th className="px-4 py-3 text-left">Type</th>
              <th className="px-4 py-3 text-left">Disclosed Amount</th>
              <th className="px-4 py-3 text-left">Evidence</th>
              <th className="px-4 py-3 text-left">Sources Cited</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {deals.map((deal) => (
              <tr key={deal.id} className="hover:bg-slate-50">
                <td className="px-4 py-3">
                  {deal.is_published ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Published
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
                      Draft / Pending
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 font-medium text-slate-900 max-w-xs truncate">
                  <Link href={`/deals/${deal.slug}`} className="hover:underline">
                    {deal.title}
                  </Link>
                </td>
                <td className="px-4 py-3 text-slate-600">{formatDealType(deal.deal_type)}</td>
                <td className="px-4 py-3 font-mono font-medium text-slate-800">
                  {formatCurrency(deal.amount_value, deal.amount_currency)}
                </td>
                <td className="px-4 py-3">
                  <EvidenceBadge level={deal.evidence_level} />
                </td>
                <td className="px-4 py-3 font-mono text-slate-600">
                  {deal.sources?.length || 0} citation(s)
                </td>
                <td className="px-4 py-3 text-right space-x-2">
                  <Link
                    href={`/deals/${deal.slug}`}
                    className="text-slate-600 hover:text-slate-900 font-medium"
                  >
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
