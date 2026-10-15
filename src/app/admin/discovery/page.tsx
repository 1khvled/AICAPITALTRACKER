import React from 'react';
import Link from 'next/link';
import { DiscoveryCandidate } from '../../../lib/types';

export const dynamic = 'force-dynamic';

const INITIAL_DISCOVERY_CANDIDATES: DiscoveryCandidate[] = [
  {
    id: 'disc-1',
    source_site: 'ai-circular-economy.com',
    source_url: 'https://ai-circular-economy.com/leads/crusoe-energy-gpu-credit',
    page_title: 'Crusoe Energy signs $3.4B joint venture for data center infrastructure',
    discovered_at: '2024-10-14T10:00:00Z',
    candidate_type: 'infrastructure_project_finance',
    candidate_company_names: ['Crusoe Energy', 'Blue Owl Capital'],
    candidate_summary: 'Discovered mention of a $3.4 billion joint venture to fund high-density AI data centers in Texas.',
    outbound_source_urls: ['https://www.reuters.com/technology/crusoe-blue-owl-joint-venture-2024'],
    review_status: 'needs_verification',
    review_notes: 'Requires reviewing the primary joint venture filing or official Blue Owl press release.',
  },
  {
    id: 'disc-2',
    source_site: 'sec.gov',
    source_url: 'https://www.sec.gov/Archives/edgar/data/1045810/000104581024000088/nvda-20241001.htm',
    page_title: 'NVIDIA Corp Form 8-K Current Report',
    discovered_at: '2024-10-15T08:30:00Z',
    candidate_type: 'equipment_purchase',
    candidate_company_names: ['NVIDIA Corporation'],
    candidate_summary: 'Form 8-K disclosure detailing multi-gigawatt power and cluster supply milestones.',
    outbound_source_urls: ['https://data.sec.gov/submissions/CIK0001045810.json'],
    review_status: 'new',
    review_notes: null,
  },
];

export default async function AdminDiscoveryPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      {/* Breadcrumb & Header */}
      <div>
        <nav className="text-xs text-slate-500 flex items-center space-x-2 mb-2">
          <Link href="/admin" className="hover:underline">Admin</Link>
          <span>/</span>
          <span className="text-slate-800 font-medium">Discovery Monitor</span>
        </nav>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Source Discovery & Lead Queue
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Polite monitor inspecting public regulatory endpoints and research sites for candidate transactions.
            </p>
          </div>
        </div>
      </div>

      {/* Mandatory Editorial Integrity Warning Banner */}
      <div className="p-4 bg-amber-50 border border-amber-300 rounded-lg flex items-start gap-3">
        <svg className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <div className="text-xs text-amber-900 leading-relaxed">
          <strong className="font-bold">Strict Editorial Rule:</strong> Discovery candidates are research leads only and are{' '}
          <strong>never published automatically</strong>. You cannot publish a candidate to the public site without independently verifying the original SEC filing or primary corporate disclosure. Competitor sites must never serve as the sole citation.
        </div>
      </div>

      {/* Candidates List */}
      <div className="space-y-4">
        {INITIAL_DISCOVERY_CANDIDATES.map((candidate) => (
          <div
            key={candidate.id}
            className="p-6 bg-white border border-slate-200 rounded-lg shadow-xs space-y-3"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                  {candidate.source_site}
                </span>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded uppercase font-semibold ${
                  candidate.review_status === 'new'
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                }`}>
                  {candidate.review_status.replace(/_/g, ' ')}
                </span>
              </div>
              <span className="text-[11px] font-mono text-slate-400">
                Discovered: {new Date(candidate.discovered_at).toLocaleString()}
              </span>
            </div>

            <h2 className="text-base font-bold text-slate-900">{candidate.page_title}</h2>
            <p className="text-xs text-slate-600 leading-relaxed">{candidate.candidate_summary}</p>

            {/* Candidate Entities Detected */}
            <div className="flex flex-wrap gap-1.5 items-center text-xs">
              <span className="text-slate-500 font-semibold text-[11px]">Entities Detected:</span>
              {candidate.candidate_company_names.map((name, i) => (
                <span key={i} className="px-2 py-0.5 rounded bg-slate-100 font-medium text-slate-800 text-[11px]">
                  {name}
                </span>
              ))}
            </div>

            {/* Outbound primary sources found on the page */}
            {candidate.outbound_source_urls.length > 0 && (
              <div className="pt-2 border-t border-slate-100 text-xs space-y-1">
                <span className="text-slate-500 font-semibold text-[11px]">Outbound Source Links Detected:</span>
                <ul className="space-y-0.5">
                  {candidate.outbound_source_urls.map((url, i) => (
                    <li key={i}>
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-brand-600 hover:underline font-mono text-[11px] break-all inline-flex items-center gap-1"
                      >
                        <span>{url}</span>
                        <svg className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Action buttons */}
            <div className="pt-3 border-t border-slate-100 flex flex-wrap gap-2 items-center justify-between">
              <div className="flex gap-2">
                <Link
                  href={`/admin/deals/new`}
                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs rounded transition-colors"
                >
                  Verify & Create Deal &rarr;
                </Link>
                <button
                  type="button"
                  className="px-3 py-1.5 border border-slate-300 text-slate-700 hover:bg-slate-50 font-medium text-xs rounded transition-colors"
                >
                  Mark Under Review
                </button>
              </div>

              <button
                type="button"
                className="text-xs text-rose-600 hover:underline font-medium"
              >
                Reject Lead
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
