'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { DiscoveryCandidate } from '../../../lib/types';
import { ShieldAlert, ExternalLink, ArrowRight } from 'lucide-react';

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

export default function AdminDiscoveryPage() {
  const [candidates, setCandidates] = useState<DiscoveryCandidate[]>(INITIAL_DISCOVERY_CANDIDATES);

  const markUnderReview = (id: string) => {
    setCandidates((prev) =>
      prev.map((c) =>
        c.id === id ? { ...c, review_status: 'needs_verification' as const } : c
      )
    );
  };

  const rejectLead = (id: string) => {
    setCandidates((prev) => prev.filter((c) => c.id !== id));
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="space-y-6">
        {/* Breadcrumb & header */}
        <div>
          <nav aria-label="Breadcrumb" className="mb-2 flex items-center gap-2 font-mono text-xs text-zinc-500">
            <Link href="/admin" className="rounded transition-colors hover:text-zinc-900 hover:underline">
              ADMIN
            </Link>
            <span aria-hidden="true">/</span>
            <span className="font-medium text-zinc-800">DISCOVERY QUEUE</span>
          </nav>
          <div className="border-b border-zinc-200 pb-4">
            <h1 className="text-2xl font-black tracking-tight text-zinc-950 sm:text-3xl">
              Discovery monitor &amp; lead quarantine queue
            </h1>
            <p className="mt-1 text-xs text-zinc-500">
              Polite monitor inspecting public regulatory endpoints and research sites for candidate
              transactions.
            </p>
          </div>
        </div>

        {/* Quarantine enforcement */}
        <div className="notice notice-amber flex items-start gap-3">
          <ShieldAlert aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
          <div className="leading-relaxed">
            <strong className="eyebrow eyebrow-amber mb-1">Quarantine enforcement:</strong> Discovery
            candidates are research leads only and are{' '}
            <strong>never published automatically</strong>. You cannot publish a candidate to the public site
            without independently verifying the original SEC filing or primary corporate disclosure. Competitor
            sites must never serve as the sole citation.
          </div>
        </div>

        {/* Candidates */}
        <div className="space-y-4">
          {candidates.length === 0 && (
            <div className="empty-state">
              <p className="font-mono text-xs text-zinc-500">Queue clear — no pending discovery leads.</p>
            </div>
          )}
          {candidates.map((candidate) => (
            <div key={candidate.id} className="panel space-y-4 p-6">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-100 pb-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="pill pill-neutral">{candidate.source_site}</span>
                  <span
                    className={`pill ${
                      candidate.review_status === 'new' ? 'pill-sky' : 'pill-amber'
                    }`}
                  >
                    {candidate.review_status.replace(/_/g, ' ')}
                  </span>
                </div>
                <span className="font-mono text-[11px] text-zinc-500">
                  Discovered: {new Date(candidate.discovered_at).toLocaleString()}
                </span>
              </div>

              <div className="space-y-1">
                <h2 className="text-base font-bold text-zinc-950">{candidate.page_title}</h2>
                <p className="text-xs leading-relaxed text-zinc-600">{candidate.candidate_summary}</p>
              </div>

              {/* Detected entities */}
              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                <span className="panel-title">Entities detected:</span>
                {candidate.candidate_company_names.map((name, i) => (
                  <span key={i} className="pill pill-neutral">
                    {name}
                  </span>
                ))}
              </div>

              {/* Outbound primary sources */}
              {candidate.outbound_source_urls.length > 0 && (
                <div className="space-y-1 border-t border-zinc-100 pt-3 text-xs">
                  <span className="panel-title">Outbound document links detected:</span>
                  <ul className="space-y-1">
                    {candidate.outbound_source_urls.map((url, i) => (
                      <li key={i}>
                        <a href={url} target="_blank" rel="noopener noreferrer" className="link-cite break-all">
                          <span>{url}</span>
                          <ExternalLink aria-hidden="true" className="h-2.5 w-2.5 shrink-0" />
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-zinc-100 pt-3">
                <div className="flex flex-wrap gap-2">
                  <Link
                    href={`/admin/deals/new?candidate=${candidate.id}`}
                    className="btn btn-primary"
                  >
                    <span>Verify &amp; create deal</span>
                    <ArrowRight aria-hidden="true" className="h-3 w-3" />
                  </Link>
                  <button
                    type="button"
                    onClick={() => markUnderReview(candidate.id)}
                    className="btn btn-outline"
                  >
                    Mark under review
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => rejectLead(candidate.id)}
                  className="rounded font-mono text-xs font-semibold text-rose-600 transition-colors hover:text-rose-900 hover:underline"
                >
                  Reject lead
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
