import React from 'react';
import Link from 'next/link';
import { DiscoveryCandidate } from '../../../lib/types';
import { ShieldAlert, ExternalLink, CheckCircle2, XCircle, ArrowRight } from 'lucide-react';

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
        <nav className="text-xs text-zinc-500 font-mono flex items-center space-x-2 mb-2">
          <Link href="/admin" className="hover:underline">ADMIN</Link>
          <span>/</span>
          <span className="text-zinc-800 font-medium">DISCOVERY QUEUE</span>
        </nav>
        <div className="border-b border-zinc-200 pb-4">
          <h1 className="text-2xl sm:text-3xl font-black text-zinc-950 tracking-tight">
            Discovery Monitor & Lead Quarantine Queue
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            Polite monitor inspecting public regulatory endpoints and research sites for candidate transactions.
          </p>
        </div>
      </div>

      {/* Mandatory Editorial Integrity Warning Banner */}
      <div className="p-4 bg-amber-500/10 border border-amber-600/30 rounded-lg flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
        <div className="text-xs text-amber-900 leading-relaxed">
          <strong className="font-mono font-bold block text-[11px]">QUARANTINE ENFORCEMENT:</strong>
          Discovery candidates are research leads only and are{' '}
          <strong>never published automatically</strong>. You cannot publish a candidate to the public site without independently verifying the original SEC filing or primary corporate disclosure. Competitor sites must never serve as the sole citation.
        </div>
      </div>

      {/* Candidates List */}
      <div className="space-y-4">
        {INITIAL_DISCOVERY_CANDIDATES.map((candidate) => (
          <div
            key={candidate.id}
            className="p-6 bg-white border border-zinc-200 rounded-lg shadow-xs space-y-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-zinc-100 text-zinc-700 font-medium">
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
              <span className="text-[11px] font-mono text-zinc-400">
                Discovered: {new Date(candidate.discovered_at).toLocaleString()}
              </span>
            </div>

            <div className="space-y-1">
              <h2 className="text-base font-bold text-zinc-950">{candidate.page_title}</h2>
              <p className="text-xs text-zinc-600 leading-relaxed">{candidate.candidate_summary}</p>
            </div>

            {/* Candidate Entities Detected */}
            <div className="flex flex-wrap gap-1.5 items-center text-xs">
              <span className="text-zinc-500 font-mono text-[11px] font-semibold">Entities Detected:</span>
              {candidate.candidate_company_names.map((name, i) => (
                <span key={i} className="px-2 py-0.5 rounded bg-zinc-100 font-mono text-zinc-800 text-[11px]">
                  {name}
                </span>
              ))}
            </div>

            {/* Outbound primary sources found on the page */}
            {candidate.outbound_source_urls.length > 0 && (
              <div className="pt-2 border-t border-zinc-100 text-xs space-y-1">
                <span className="text-zinc-500 font-mono text-[11px] font-semibold">Outbound Document Links Detected:</span>
                <ul className="space-y-1">
                  {candidate.outbound_source_urls.map((url, i) => (
                    <li key={i}>
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline font-mono text-[11px] break-all inline-flex items-center gap-1"
                      >
                        <span>{url}</span>
                        <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Action buttons */}
            <div className="pt-3 border-t border-zinc-100 flex flex-wrap gap-2 items-center justify-between">
              <div className="flex gap-2">
                <Link
                  href={`/admin/deals/new`}
                  className="px-3 py-1.5 bg-zinc-950 hover:bg-zinc-800 text-white font-mono text-xs uppercase tracking-wider font-semibold rounded transition-colors inline-flex items-center gap-1.5"
                >
                  <span>Verify & Create Deal</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
                <button
                  type="button"
                  className="px-3 py-1.5 border border-zinc-300 text-zinc-700 hover:bg-zinc-50 font-mono text-xs uppercase tracking-wider rounded transition-colors"
                >
                  Mark Under Review
                </button>
              </div>

              <button
                type="button"
                className="font-mono text-xs text-rose-600 hover:underline font-semibold"
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
