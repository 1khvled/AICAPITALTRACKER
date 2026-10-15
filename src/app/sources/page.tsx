import React from 'react';
import { Metadata } from 'next';
import { DataRepository } from '../../lib/data/db';

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
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Source Registry & Primary Document Citations
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Every published deal requires verifiable primary documentation. We do not publish unsubstantiated rumors or scraped commentary.
        </p>
      </div>

      {/* Monitored Source Registry (Tier 1 & Tier 2) */}
      <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-xs space-y-4">
        <div>
          <h2 className="text-base font-bold text-slate-900">Configured Data Source Adapters</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Machine-readable APIs, official feeds, and research leads monitored by AICapitalTracker.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-xs">
            <thead className="bg-slate-50 uppercase font-semibold text-slate-600 text-[10px]">
              <tr>
                <th className="px-3 py-2 text-left">Source / Endpoint</th>
                <th className="px-3 py-2 text-left">Category</th>
                <th className="px-3 py-2 text-left">Method</th>
                <th className="px-3 py-2 text-left">Status</th>
                <th className="px-3 py-2 text-left">Rate Limits & Fair Access</th>
                <th className="px-3 py-2 text-right">Robots / Terms</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sourceRegistry.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50">
                  <td className="px-3 py-3 font-semibold text-slate-900">
                    <div>{item.name}</div>
                    <div className="text-[10px] text-slate-400 font-mono">{item.base_url}</div>
                  </td>
                  <td className="px-3 py-3 font-mono text-slate-600">
                    {item.source_category.replace(/_/g, ' ')}
                  </td>
                  <td className="px-3 py-3 font-mono text-slate-600 uppercase text-[10px]">
                    {item.access_method.replace(/_/g, ' ')}
                  </td>
                  <td className="px-3 py-3">
                    {item.is_enabled ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Active Monitoring
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600">
                        Manual / Disabled
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-3 text-slate-500 max-w-xs">
                    {item.rate_limit_notes || 'Standard polite request rates'}
                  </td>
                  <td className="px-3 py-3 text-right">
                    {item.terms_url && (
                      <a
                        href={item.terms_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-brand-600 hover:underline text-[11px]"
                      >
                        Terms Policy &rarr;
                      </a>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Individual Document Citations */}
      <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-xs space-y-4">
        <div>
          <h2 className="text-base font-bold text-slate-900">Recent Verified Primary Citations</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Original filings, regulatory documents, and company releases supporting active deal records.
          </p>
        </div>

        <ul className="divide-y divide-slate-100 text-xs">
          {sources.map((source) => (
            <li key={source.id} className="py-3 space-y-1">
              <div className="flex items-baseline justify-between gap-4">
                <a
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-brand-600 hover:underline inline-flex items-center gap-1"
                >
                  <span>{source.title}</span>
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
                <span className="font-mono text-[11px] text-slate-400">
                  {source.published_date || 'Date unrecorded'}
                </span>
              </div>
              <p className="text-slate-600">{source.notes}</p>
              <div className="text-[11px] text-slate-400 flex gap-2">
                <span>Publisher: {source.publisher || 'Unknown'}</span>
                <span>•</span>
                <span className="uppercase font-mono">{source.source_type.replace(/_/g, ' ')}</span>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
