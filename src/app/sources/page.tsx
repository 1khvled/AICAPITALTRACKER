import React from 'react';
import { Metadata } from 'next';
import { DataRepository } from '../../lib/data/db';
import { FileText, ExternalLink, CheckCircle2, ShieldAlert } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Source Registry & Primary Citations — AI Capital Tracker',
  description:
    'Transparent registry of primary SEC filings, company investor relations feeds, and regulatory sources used to verify AI capital flows.',
};

export const revalidate = 3600;

export default async function SourcesPage() {
  const sources = await DataRepository.getSources();
  const sourceRegistry = await DataRepository.getSourceRegistry();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Header */}
      <div className="border-b border-zinc-200 pb-5">
        <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-wider text-zinc-500 font-bold">
          <FileText className="w-3.5 h-3.5 text-zinc-400" />
          <span>STATUTORY AUDIT REGISTRY</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-zinc-950 tracking-tight mt-1">
          Source Registry & Primary Document Citations
        </h1>
        <p className="text-xs sm:text-sm text-zinc-500 mt-1 max-w-3xl">
          Every transaction published on AICapitalTracker is anchored to statutory regulatory filings, official company releases, or verified tier-1 reporting.
        </p>
      </div>

      {/* Monitored Data Source Adapters (Tier 1 & Tier 2) */}
      <div className="border border-zinc-200 rounded-lg bg-white p-6 space-y-4 shadow-xs">
        <div>
          <h2 className="text-sm font-mono uppercase tracking-wider text-zinc-950 font-bold">
            Monitored Regulatory & Ingestion Adapters
          </h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            Public machine-readable endpoints and feeds polled under polite fair-access policies.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-xs text-left">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50 text-[10px] font-mono uppercase text-zinc-500">
                <th className="py-2.5 px-3">Source Endpoint</th>
                <th className="py-2.5 px-3">Classification</th>
                <th className="py-2.5 px-3">Access Protocol</th>
                <th className="py-2.5 px-3">Compliance Status</th>
                <th className="py-2.5 px-3">Rate Limits & Fair Access</th>
                <th className="py-2.5 px-3 text-right">Policy URL</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {sourceRegistry.map((item) => (
                <tr key={item.id} className="hover:bg-zinc-50/70">
                  <td className="py-3 px-3 font-semibold text-zinc-950">
                    <div>{item.name}</div>
                    <div className="text-[10px] text-zinc-400 font-mono">{item.base_url}</div>
                  </td>
                  <td className="py-3 px-3 font-mono text-zinc-600">
                    {item.source_category.replace(/_/g, ' ')}
                  </td>
                  <td className="py-3 px-3 font-mono uppercase text-[10px] text-zinc-600">
                    {item.access_method.replace(/_/g, ' ')}
                  </td>
                  <td className="py-3 px-3">
                    {item.is_enabled ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        ACTIVE
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-zinc-100 text-zinc-600">
                        MANUAL / QUEUE
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-zinc-500 max-w-xs text-[11px]">
                    {item.rate_limit_notes || 'Polite rate limits with custom User-Agent'}
                  </td>
                  <td className="py-3 px-3 text-right">
                    {item.terms_url && (
                      <a
                        href={item.terms_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 font-mono text-[11px] hover:underline inline-flex items-center gap-1"
                      >
                        <span>Terms</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Primary Statutory Citations Dossier */}
      <div className="border border-zinc-200 rounded-lg bg-white p-6 space-y-4 shadow-xs">
        <div>
          <h2 className="text-sm font-mono uppercase tracking-wider text-zinc-950 font-bold">
            Statutory Document Citations Docket ({sources.length})
          </h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            Direct regulatory documents, SEC accession entries, and company disclosures.
          </p>
        </div>

        <ul className="divide-y divide-zinc-100 text-xs">
          {sources.map((source) => (
            <li key={source.id} className="py-3.5 space-y-1.5">
              <div className="flex items-baseline justify-between gap-4">
                <a
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold text-zinc-950 hover:text-blue-600 hover:underline inline-flex items-center gap-1 text-sm"
                >
                  <span>{source.title}</span>
                  <ExternalLink className="w-3 h-3 text-zinc-400 shrink-0" />
                </a>
                <span className="font-mono text-[11px] text-zinc-400 whitespace-nowrap">
                  {source.published_date || 'Date unrecorded'}
                </span>
              </div>
              <p className="text-zinc-600 leading-normal">{source.notes}</p>
              <div className="flex items-center gap-2 text-[10px] font-mono text-zinc-400">
                <span>Publisher: {source.publisher || 'Unknown'}</span>
                <span>•</span>
                <span className="uppercase">{source.source_type.replace(/_/g, ' ')}</span>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
