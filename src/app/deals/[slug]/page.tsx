import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { DataRepository } from '../../../lib/data/db';
import { EvidenceBadge } from '../../../components/EvidenceBadge';
import { formatCurrency, formatDealType } from '../../../components/DealTable';

interface DealPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({ params }: DealPageProps): Promise<Metadata> {
  const { slug } = await params;
  const deal = await DataRepository.getDealBySlug(slug);

  if (!deal) {
    return {
      title: 'Deal Not Found',
    };
  }

  return {
    title: `${deal.title} — AI Capital Tracker`,
    description: deal.summary,
    alternates: {
      canonical: `/deals/${deal.slug}`,
    },
    openGraph: {
      title: deal.title,
      description: deal.summary,
      type: 'article',
    },
  };
}

export default async function DealDetailPage({ params }: DealPageProps) {
  const { slug } = await params;
  const deal = await DataRepository.getDealBySlug(slug);

  if (!deal) {
    notFound();
  }

  const primarySource = deal.sources?.find((s) => s.is_primary_support)?.source || deal.sources?.[0]?.source;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Breadcrumbs */}
      <nav className="text-xs text-slate-500 flex items-center space-x-2">
        <Link href="/" className="hover:text-slate-800">Home</Link>
        <span>/</span>
        <Link href="/deals" className="hover:text-slate-800">Deals</Link>
        <span>/</span>
        <span className="text-slate-800 font-medium truncate max-w-xs">{deal.slug}</span>
      </nav>

      {/* Main Header */}
      <div className="bg-white border border-slate-200 rounded-lg p-6 sm:p-8 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <EvidenceBadge level={deal.evidence_level} />
          <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 uppercase">
            {formatDealType(deal.deal_type)}
          </span>
          <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 uppercase">
            Status: {deal.status}
          </span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
          {deal.title}
        </h1>

        <p className="text-sm sm:text-base text-slate-700 leading-relaxed max-w-3xl">
          {deal.summary}
        </p>

        {/* Confidence note */}
        {deal.confidence_note && (
          <div className="p-3 bg-slate-50 border-l-2 border-slate-400 text-xs text-slate-600 italic">
            <strong>Verification Note:</strong> {deal.confidence_note}
          </div>
        )}
      </div>

      {/* Structured Terms Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Deal Terms */}
        <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-xs space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-900 border-b border-slate-100 pb-2">
            Disclosed Terms & Amount
          </h2>
          <dl className="grid grid-cols-2 gap-y-3 text-xs">
            <dt className="text-slate-500">Disclosed Amount</dt>
            <dd className="font-semibold text-slate-900 font-mono">
              {deal.amount_disclosed ? formatCurrency(deal.amount_value, deal.amount_currency) : 'Undisclosed'}
            </dd>

            <dt className="text-slate-500">Amount Basis</dt>
            <dd className="text-slate-800 font-mono">
              {deal.amount_basis ? deal.amount_basis.replace(/_/g, ' ') : 'N/A'}
            </dd>

            <dt className="text-slate-500">Period / Term</dt>
            <dd className="text-slate-800">
              {deal.amount_period || 'N/A'}
            </dd>

            <dt className="text-slate-500">Geography</dt>
            <dd className="text-slate-800">
              {deal.geography || 'Global'}
            </dd>
          </dl>
        </div>

        {/* Chronology */}
        <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-xs space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-900 border-b border-slate-100 pb-2">
            Timeline & Dates
          </h2>
          <dl className="grid grid-cols-2 gap-y-3 text-xs">
            <dt className="text-slate-500">Announcement Date</dt>
            <dd className="font-mono text-slate-800">{deal.announcement_date || 'Undisclosed'}</dd>

            <dt className="text-slate-500">Effective Date</dt>
            <dd className="font-mono text-slate-800">{deal.effective_date || 'Undisclosed'}</dd>

            <dt className="text-slate-500">Maturity / Expiry</dt>
            <dd className="font-mono text-slate-800">{deal.maturity_date || 'N/A'}</dd>

            <dt className="text-slate-500">Last Reviewed</dt>
            <dd className="font-mono text-slate-500">
              {deal.last_reviewed_at ? new Date(deal.last_reviewed_at).toLocaleDateString() : 'Recent'}
            </dd>
          </dl>
        </div>
      </div>

      {/* Counterparties & Roles */}
      <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-xs space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-900 border-b border-slate-100 pb-2">
          Participating Entities & Transaction Roles
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {deal.parties?.map((party) => (
            <div key={party.id} className="p-4 border border-slate-200 rounded bg-slate-50/50 space-y-1">
              <div className="flex items-center justify-between">
                <Link
                  href={`/companies/${party.company?.slug}`}
                  className="font-bold text-slate-900 hover:text-brand-600 transition-colors text-sm"
                >
                  {party.company?.name}
                </Link>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-200 text-slate-800 uppercase">
                  {party.role}
                </span>
              </div>
              <p className="text-xs text-slate-500">{party.direction_note || 'Participant in transaction.'}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Sources & Citations */}
      <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-900">
            Source Citations & Evidence
          </h2>
          <span className="text-xs text-slate-400 font-mono">
            {deal.sources?.length || 0} cited document{(deal.sources?.length || 0) === 1 ? '' : 's'}
          </span>
        </div>

        <ul className="divide-y divide-slate-100 space-y-3">
          {deal.sources?.map((ds, idx) => (
            <li key={idx} className="pt-3 first:pt-0 space-y-1 text-xs">
              <div className="flex items-baseline justify-between gap-4">
                <a
                  href={ds.source?.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-brand-600 hover:underline flex items-center gap-1"
                >
                  <span>{ds.source?.title || 'External Citation'}</span>
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
                <span className="text-slate-400 font-mono text-[11px] whitespace-nowrap">
                  {ds.source?.published_date || 'Date unrecorded'}
                </span>
              </div>
              <p className="text-slate-600">
                <strong>Supporting claim:</strong> {ds.supporting_note}
              </p>
              <div className="text-[11px] text-slate-400 flex gap-2">
                <span>Publisher: {ds.source?.publisher || 'Primary issuer'}</span>
                <span>•</span>
                <span className="uppercase font-mono">{ds.source?.source_type.replace('_', ' ')}</span>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
