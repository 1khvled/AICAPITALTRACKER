import React from 'react';
import Link from 'next/link';
import { DataRepository } from '../../../lib/data/db';
import { EvidenceBadge } from '../../../components/EvidenceBadge';
import { formatCurrency, formatDealType } from '../../../components/DealTable';
import { Plus, Database, ExternalLink } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminDealsListPage() {
  const deals = await DataRepository.getDeals();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-zinc-200 pb-5">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-wider text-zinc-500 font-bold">
            <Database className="w-3.5 h-3.5 text-zinc-400" />
            <span>ADMINISTRATIVE DESK</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-zinc-950 tracking-tight mt-1">
            Deal Ledger Management
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            Audit, update, or archive transactions. All published records require primary statutory citations.
          </p>
        </div>

        <Link
          href="/admin/deals/new"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-zinc-950 hover:bg-zinc-800 text-white font-mono text-xs uppercase tracking-wider font-semibold rounded transition-colors shadow-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Record Deal</span>
        </Link>
      </div>

      <div className="border border-zinc-200 rounded-lg bg-white overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="min-w-full text-xs text-left">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50 text-[10px] font-mono uppercase text-zinc-500 tracking-wider">
                <th className="py-2.5 px-4">Publication</th>
                <th className="py-2.5 px-4">Transaction / Title</th>
                <th className="py-2.5 px-4">Classification</th>
                <th className="py-2.5 px-4 text-right">Disclosed Value</th>
                <th className="py-2.5 px-4">Audit Standard</th>
                <th className="py-2.5 px-4">Sources Cited</th>
                <th className="py-2.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {deals.map((deal) => (
                <tr key={deal.id} className="hover:bg-zinc-50/70 transition-colors">
                  <td className="py-3 px-4 whitespace-nowrap">
                    {deal.is_published ? (
                      <span className="font-mono text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                        PUBLISHED
                      </span>
                    ) : (
                      <span className="font-mono text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                        INTERNAL DRAFT
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 font-bold text-zinc-950 max-w-xs truncate">
                    <Link href={`/deals/${deal.slug}`} className="hover:text-blue-600 hover:underline">
                      {deal.title}
                    </Link>
                  </td>
                  <td className="py-3 px-4 font-medium text-zinc-700 whitespace-nowrap">
                    {formatDealType(deal.deal_type)}
                  </td>
                  <td className="py-3 px-4 font-mono font-bold text-zinc-950 text-right whitespace-nowrap tabular-nums">
                    {formatCurrency(deal.amount_value, deal.amount_currency)}
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <EvidenceBadge level={deal.evidence_level} size="sm" />
                  </td>
                  <td className="py-3 px-4 font-mono text-[11px] text-zinc-600 whitespace-nowrap">
                    {deal.sources?.length || 0} cited document(s)
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap text-right">
                    <Link
                      href={`/deals/${deal.slug}`}
                      className="font-mono text-[11px] text-blue-600 hover:underline inline-flex items-center gap-1"
                    >
                      <span>Inspect</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
