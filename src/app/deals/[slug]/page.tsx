import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { DataRepository } from '../../../lib/data/db';
import { EvidenceBadge } from '../../../components/EvidenceBadge';
import { formatCurrency, formatDealType } from '../../../components/DealTable';
import {
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  Calendar,
  Building2,
  FileCheck2,
  Scale,
} from 'lucide-react';

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
    title: `${deal.title} — Term Sheet & Capital Structure`,
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

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Breadcrumbs */}
      <nav className="text-xs text-zinc-500 font-mono flex items-center space-x-2">
        <Link href="/" className="hover:text-zinc-950">HOME</Link>
        <span>/</span>
        <Link href="/deals" className="hover:text-zinc-950">DEALS</Link>
        <span>/</span>
        <span className="text-zinc-800 font-medium truncate max-w-sm">{deal.slug}</span>
      </nav>

      {/* Main Term Sheet Dossier Header */}
      <div className="border border-zinc-200 rounded-lg bg-white p-6 sm:p-8 space-y-6 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-100 pb-4">
          <div className="flex items-center gap-2 flex-wrap">
            <EvidenceBadge level={deal.evidence_level} />
            <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-zinc-100 text-zinc-700 uppercase font-medium">
              {formatDealType(deal.deal_type)}
            </span>
            <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-zinc-100 text-zinc-700 uppercase font-medium">
              STATUS: {deal.status}
            </span>
          </div>

          <div className="text-[11px] font-mono text-zinc-400">
            RECORD ID: <span className="text-zinc-600">{deal.id.slice(0, 8)}...</span>
          </div>
        </div>

        <div className="space-y-3">
          <h1 className="text-2xl sm:text-4xl font-black text-zinc-950 tracking-tight leading-tight">
            {deal.title}
          </h1>
          <p className="text-sm sm:text-base text-zinc-600 leading-relaxed max-w-4xl">
            {deal.summary}
          </p>
        </div>

        {/* Amount & Capital Basis Callout Box */}
        <div className="p-4 sm:p-5 bg-zinc-50 border border-zinc-200 rounded-lg grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 font-semibold">
              Disclosed Amount
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold font-mono text-zinc-950 tabular-nums mt-0.5">
              {deal.amount_disclosed ? formatCurrency(deal.amount_value, deal.amount_currency) : 'Undisclosed'}
            </div>
            <div className="text-[10px] font-mono text-zinc-400 mt-0.5">
              {deal.amount_disclosed ? 'Documented figure' : 'Amount terms non-disclosed'}
            </div>
          </div>

          <div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 font-semibold">
              Capital Basis
            </div>
            <div className="text-sm font-bold font-mono text-zinc-800 uppercase mt-1">
              {deal.amount_basis ? deal.amount_basis.replace(/_/g, ' ') : 'N/A'}
            </div>
            <div className="text-[10px] text-zinc-400 font-mono mt-0.5">
              {deal.amount_period || 'Standard term'}
            </div>
          </div>

          <div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 font-semibold">
              Announcement Date
            </div>
            <div className="text-sm font-bold font-mono text-zinc-800 mt-1">
              {deal.announcement_date || 'Undisclosed'}
            </div>
            <div className="text-[10px] text-zinc-400 font-mono mt-0.5">
              Effective: {deal.effective_date || 'N/A'}
            </div>
          </div>

          <div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 font-semibold">
              Jurisdiction / Grid
            </div>
            <div className="text-sm font-bold text-zinc-800 mt-1">
              {deal.geography || 'Global'}
            </div>
            <div className="text-[10px] text-zinc-400 font-mono mt-0.5">
              Maturity: {deal.maturity_date || 'N/A'}
            </div>
          </div>
        </div>

        {/* Verification & Editorial Note */}
        {deal.confidence_note && (
          <div className="p-3.5 bg-amber-500/10 border border-amber-600/20 rounded text-xs text-amber-900 flex items-start gap-2.5">
            <Scale className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <strong className="font-semibold font-mono text-[11px] block">AUDIT VERIFICATION NOTE:</strong>
              {deal.confidence_note}
            </div>
          </div>
        )}
      </div>

      {/* Two-Column Grid: Counterparties and Primary Citations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Counterparty Structure */}
        <div className="border border-zinc-200 rounded-lg bg-white p-6 space-y-4 shadow-xs">
          <div className="flex items-center gap-2 border-b border-zinc-100 pb-3">
            <Building2 className="w-4 h-4 text-zinc-500" />
            <h2 className="text-xs font-mono uppercase tracking-wider text-zinc-950 font-bold">
              Transaction Counterparties & Roles
            </h2>
          </div>

          <div className="space-y-3">
            {deal.parties?.map((party) => (
              <div
                key={party.id}
                className="p-4 border border-zinc-200 rounded-md bg-zinc-50/50 hover:bg-zinc-50 transition-colors flex flex-col justify-between"
              >
                <div className="flex items-center justify-between gap-2">
                  <Link
                    href={`/companies/${party.company?.slug}`}
                    className="font-bold text-zinc-950 hover:text-blue-600 transition-colors text-sm"
                  >
                    {party.company?.name}
                  </Link>
                  <span className="font-mono text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-zinc-200 text-zinc-800">
                    {party.role}
                  </span>
                </div>
                <p className="text-xs text-zinc-500 mt-1 leading-normal">
                  {party.direction_note || 'Direct counterparty in disclosed agreement.'}
                </p>
                <div className="mt-2 text-[10px] font-mono text-zinc-400">
                  Sector: {party.company?.company_type.replace(/_/g, ' ')}
                  {party.company?.ticker && ` • Ticker: $${party.company.ticker}`}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Primary Citations & Statutory Filings */}
        <div className="border border-zinc-200 rounded-lg bg-white p-6 space-y-4 shadow-xs">
          <div className="flex items-center gap-2 border-b border-zinc-100 pb-3">
            <FileCheck2 className="w-4 h-4 text-zinc-500" />
            <h2 className="text-xs font-mono uppercase tracking-wider text-zinc-950 font-bold">
              Primary Statutory Citations ({deal.sources?.length || 0})
            </h2>
          </div>

          <ul className="divide-y divide-zinc-100 space-y-3">
            {deal.sources?.map((ds, idx) => (
              <li key={idx} className="pt-3 first:pt-0 space-y-1.5 text-xs">
                <div className="flex items-baseline justify-between gap-4">
                  <a
                    href={ds.source?.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-bold text-blue-600 hover:underline flex items-center gap-1 leading-snug"
                  >
                    <span>{ds.source?.title || 'Document Link'}</span>
                    <ExternalLink className="w-3 h-3 shrink-0" />
                  </a>
                  <span className="text-zinc-400 font-mono text-[10px] whitespace-nowrap">
                    {ds.source?.published_date || 'Date unrecorded'}
                  </span>
                </div>
                <p className="text-zinc-600 leading-normal text-xs">
                  <span className="font-semibold text-zinc-900">Documented claim:</span> {ds.supporting_note}
                </p>
                <div className="flex items-center gap-2 text-[10px] font-mono text-zinc-400">
                  <span>Publisher: {ds.source?.publisher || 'Official issuer'}</span>
                  <span>•</span>
                  <span className="uppercase">{ds.source?.source_type.replace(/_/g, ' ')}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
