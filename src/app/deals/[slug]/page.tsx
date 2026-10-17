import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { DataRepository } from '../../../lib/data/db';
import { EvidenceBadge } from '../../../components/EvidenceBadge';
import { formatCurrency, formatDealType } from '../../../lib/formatters';
import { dealTypeColor } from '../../../components/charts/chartTheme';
import { DealTimeline } from '../../../components/charts/TimelineBar';
import { CounterpartyFlow, PeerBars } from '../../../components/charts/FlowMini';
import {
  ExternalLink,
  Building2,
  FileCheck2,
  Scale,
} from 'lucide-react';

interface DealPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export const revalidate = 3600;

export async function generateStaticParams() {
  const deals = await DataRepository.getDeals();
  return deals.map((deal) => ({ slug: deal.slug }));
}

export async function generateMetadata({ params }: DealPageProps): Promise<Metadata> {
  const { slug } = await params;
  const deal = await DataRepository.getDealBySlug(slug);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://aicapitaltracker.com';

  if (!deal) {
    return {
      title: 'Deal Not Found',
    };
  }

  const dealUrl = `${siteUrl}/deals/${deal.slug}`;

  return {
    title: `${deal.title} — Term Sheet & Capital Structure`,
    description: deal.summary,
    alternates: {
      canonical: `/deals/${deal.slug}`,
    },
    openGraph: {
      title: deal.title,
      description: deal.summary,
      url: dealUrl,
      siteName: 'AI Capital Tracker',
      locale: 'en_US',
      type: 'article',
      publishedTime: deal.published_at || deal.announcement_date || undefined,
      images: [{ url: '/opengraph-default.png', width: 1200, height: 630, alt: deal.title }],
    },
    twitter: {
      card: 'summary_large_image',
      title: deal.title,
      description: deal.summary,
      images: ['/opengraph-default.png'],
    },
  };
}

export default async function DealDetailPage({ params }: DealPageProps) {
  const { slug } = await params;
  const deal = await DataRepository.getDealBySlug(slug);

  if (!deal) {
    notFound();
  }

  // Chronological neighbors + related deals sharing a counterparty.
  // Single cached getDeals() call covers all three (module-level 60s cache).
  const allDeals = await DataRepository.getDeals();
  const currentIndex = allDeals.findIndex((d) => d.slug === deal.slug);
  const newerDeal = currentIndex > 0 ? allDeals[currentIndex - 1] : null;
  const olderDeal = currentIndex >= 0 && currentIndex < allDeals.length - 1 ? allDeals[currentIndex + 1] : null;

  const dealCompanyIds = new Set((deal.parties ?? []).map((p) => p.company_id));
  const relatedDeals = allDeals
    .filter(
      (d) =>
        d.slug !== deal.slug &&
        (d.parties ?? []).some((p) => dealCompanyIds.has(p.company_id))
    )
    .slice(0, 4);

  // Visual strip: same-type peers ranked by disclosed amount (current deal highlighted).
  const sameTypePeers = allDeals
    .filter(
      (d) =>
        d.deal_type === deal.deal_type &&
        d.amount_disclosed &&
        d.amount_value !== null &&
        (d.amount_value ?? 0) > 0
    )
    .sort((a, b) => (b.amount_value ?? 0) - (a.amount_value ?? 0));
  const peerRows = [
    ...(deal.amount_disclosed && deal.amount_value && deal.amount_value > 0
      ? [
          {
            label: deal.title,
            value: deal.amount_value,
            sub: deal.announcement_date || 'Undated',
            href: `/deals/${deal.slug}`,
            highlight: true,
          },
        ]
      : []),
    ...sameTypePeers
      .filter((d) => d.slug !== deal.slug)
      .slice(0, 10)
      .map((d) => ({
        label: d.title,
        value: d.amount_value ?? 0,
        sub: d.announcement_date || 'Undated',
        href: `/deals/${d.slug}`,
        highlight: false as const,
        color: dealTypeColor(d.deal_type),
      })),
  ]
    .sort((a, b) => b.value - a.value)
    .slice(0, 11);
  const peerDealTypeLabel = formatDealType(deal.deal_type);

  const flowNodes = (deal.parties ?? []).map((p) => ({
    name: p.company?.name ?? 'Unknown counterparty',
    role: p.role,
    href: p.company?.slug ? `/companies/${p.company.slug}` : undefined,
    note:
      p.company?.ticker
        ? `$${p.company.ticker}`
        : p.company?.company_type.replace(/_/g, ' '),
  }));

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://aicapitaltracker.com';
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: siteUrl },
      { '@type': 'ListItem', position: 2, name: 'Deals', item: `${siteUrl}/deals` },
      { '@type': 'ListItem', position: 3, name: deal.title, item: `${siteUrl}/deals/${deal.slug}` },
    ],
  };

  return (
    <div className="pb-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      {/* Terminal hero */}
      <section className="hero-terminal">
        <div className="relative mx-auto max-w-7xl space-y-6 px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
          {/* Breadcrumbs */}
          <nav aria-label="Breadcrumb">
            <ol className="flex items-center gap-2 font-mono text-xs text-zinc-400">
              <li>
                <Link href="/" className="rounded transition-colors hover:text-white">
                  HOME
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li>
                <Link href="/deals" className="rounded transition-colors hover:text-white">
                  DEALS
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li aria-current="page" className="max-w-sm truncate font-medium text-emerald-300">
                {deal.slug}
              </li>
            </ol>
          </nav>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <EvidenceBadge level={deal.evidence_level} />
              <span className="pill pill-terminal">{formatDealType(deal.deal_type)}</span>
              <span className="pill pill-terminal">Status: {deal.status}</span>
            </div>

            <p className="font-mono text-[11px] text-zinc-400">
              RECORD ID: <span className="text-zinc-300">{deal.id.slice(0, 8)}&hellip;</span>
            </p>
          </div>

          <div className="space-y-3">
            <h1 className="text-2xl font-black leading-tight tracking-tight text-white sm:text-4xl lg:text-5xl">
              {deal.title}
            </h1>
            <p className="max-w-4xl text-sm leading-relaxed text-zinc-400 sm:text-base">{deal.summary}</p>
          </div>

          {/* Capital dossier */}
          <div className="terminal-card grid grid-cols-1 gap-5 p-5 sm:grid-cols-4">
            <div>
              <div className="stat-label text-zinc-400">Disclosed amount</div>
              <div className="num mt-1 text-2xl font-extrabold leading-none text-emerald-300 sm:text-3xl">
                {deal.amount_disclosed ? formatCurrency(deal.amount_value, deal.amount_currency) : 'Undisclosed'}
              </div>
              <div className="mt-1 font-mono text-[10px] text-zinc-400">
                {deal.amount_disclosed ? 'Documented figure' : 'Amount terms non-disclosed'}
              </div>
            </div>

            <div>
              <div className="stat-label text-zinc-400">Capital basis</div>
              <div className="mt-1.5 font-mono text-sm font-bold uppercase text-white">
                {deal.amount_basis ? deal.amount_basis.replace(/_/g, ' ') : 'N/A'}
              </div>
              <div className="mt-1 font-mono text-[10px] text-zinc-400">
                {deal.amount_period || 'Standard term'}
              </div>
            </div>

            <div>
              <div className="stat-label text-zinc-400">Announcement date</div>
              <div className="mt-1.5 font-mono text-sm font-bold text-white">
                {deal.announcement_date || 'Undisclosed'}
              </div>
              <div className="mt-1 font-mono text-[10px] text-zinc-400">
                Effective: {deal.effective_date || 'N/A'}
              </div>
            </div>

            <div>
              <div className="stat-label text-zinc-400">Jurisdiction / grid</div>
              <div className="mt-1.5 text-sm font-bold text-white">{deal.geography || 'Global'}</div>
              <div className="mt-1 font-mono text-[10px] text-zinc-400">
                Maturity: {deal.maturity_date || 'N/A'}
              </div>
            </div>
          </div>

          {/* Verification note */}
          {deal.confidence_note && (
            <div className="flex items-start gap-2.5 rounded-terminal border border-amber-500/25 bg-amber-500/10 p-4 text-xs text-amber-200">
              <Scale aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
              <div className="leading-relaxed">
                <strong className="mb-0.5 block font-mono text-[11px] font-semibold text-amber-300">
                  AUDIT VERIFICATION NOTE:
                </strong>
                {deal.confidence_note}
              </div>
            </div>
          )}
        </div>
      </section>

      <div className="mx-auto max-w-7xl space-y-8 px-4 py-10 sm:px-6 lg:px-8">
        {/* Lifecycle + peer scale + counterparty flow */}
        <section aria-label="Deal visuals" className="space-y-6">
          <div className="panel-interactive p-6">
            <div className="border-b border-zinc-100 pb-3">
              <h2 className="panel-title">Transaction lifecycle</h2>
              <p className="mt-1 text-xs text-zinc-500">
                Announce &rarr; effective &rarr; maturity milestones for this agreement.
              </p>
            </div>
            <div className="mt-4">
              <DealTimeline
                announce={deal.announcement_date}
                effective={deal.effective_date}
                maturity={deal.maturity_date}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="panel-interactive p-6">
              <div className="border-b border-zinc-100 pb-3">
                <h2 className="panel-title">Amount vs top {peerDealTypeLabel} peers</h2>
                <p className="mt-1 text-xs text-zinc-500">
                  Disclosed amounts among same-type transactions, largest first.
                </p>
              </div>
              <div className="mt-4">
                <PeerBars
                  rows={peerRows}
                  format={(v) => formatCurrency(v, deal.amount_currency)}
                  note={
                    deal.amount_disclosed
                      ? `${sameTypePeers.length} disclosed ${peerDealTypeLabel.toLowerCase()} deal(s) in universe · undisclosed excluded.`
                      : 'This deal is undisclosed — shown against disclosed same-type peers for scale.'
                  }
                />
              </div>
            </div>

            <div className="panel-interactive p-6">
              <div className="border-b border-zinc-100 pb-3">
                <h2 className="panel-title">Counterparty flow ({flowNodes.length})</h2>
                <p className="mt-1 text-xs text-zinc-500">
                  Capital direction across recorded parties, in filing order.
                </p>
              </div>
              <div className="mt-4">
                <CounterpartyFlow nodes={flowNodes} />
              </div>
            </div>
          </div>
        </section>

        {/* Counterparties + citations */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="panel p-6">
            <div className="flex items-center gap-2 border-b border-zinc-100 pb-3">
              <Building2 aria-hidden="true" className="h-4 w-4 text-emerald-600" />
              <h2 className="panel-title">Transaction counterparties &amp; roles</h2>
            </div>

            <div className="space-y-3">
              {deal.parties?.map((party) => (
                <div
                  key={party.id}
                  className="panel-sunken flex flex-col justify-between p-4 transition-colors hover:bg-zinc-50"
                >
                  <div className="flex items-center justify-between gap-2">
                    {party.company?.slug ? (
                      <Link
                        href={`/companies/${party.company.slug}`}
                        className="rounded text-sm font-bold text-zinc-950 transition-colors hover:text-emerald-800"
                      >
                        {party.company?.name}
                      </Link>
                    ) : (
                      <span className="text-sm font-bold text-zinc-950">{party.company?.name}</span>
                    )}
                    <span className="pill pill-neutral">{party.role}</span>
                  </div>
                  <p className="mt-1.5 text-xs leading-normal text-zinc-500">
                    {party.direction_note || 'Direct counterparty in disclosed agreement.'}
                  </p>
                  <div className="mt-2 font-mono text-[10px] text-zinc-500">
                    Sector: {party.company?.company_type.replace(/_/g, ' ')}
                    {party.company?.ticker && ` • Ticker: $${party.company.ticker}`}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="panel p-6">
            <div className="flex items-center gap-2 border-b border-zinc-100 pb-3">
              <FileCheck2 aria-hidden="true" className="h-4 w-4 text-emerald-600" />
              <h2 className="panel-title">
                Primary statutory citations ({deal.sources?.length || 0})
              </h2>
            </div>

            <ul className="divide-y divide-zinc-100 space-y-3">
              {deal.sources?.map((ds, idx) => (
                <li key={idx} className="space-y-1.5 pt-3 text-xs first:pt-0">
                  <div className="flex items-baseline justify-between gap-4">
                    <a
                      href={ds.source?.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 rounded font-bold leading-snug text-emerald-700 hover:text-emerald-900 hover:underline"
                    >
                      <span>{ds.source?.title || 'Document Link'}</span>
                      <ExternalLink aria-hidden="true" className="h-3 w-3 shrink-0 text-emerald-600" />
                    </a>
                    <span className="whitespace-nowrap font-mono text-[10px] text-zinc-500">
                      {ds.source?.published_date || 'Date unrecorded'}
                    </span>
                  </div>
                  <p className="text-xs leading-normal text-zinc-600">
                    <span className="font-semibold text-zinc-900">Documented claim:</span> {ds.supporting_note}
                  </p>
                  <div className="flex items-center gap-2 font-mono text-[10px] text-zinc-500">
                    <span>Publisher: {ds.source?.publisher || 'Official issuer'}</span>
                    <span aria-hidden="true">•</span>
                    <span className="uppercase">{ds.source?.source_type.replace(/_/g, ' ')}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Related transactions */}
        {relatedDeals.length > 0 && (
          <div className="panel p-6">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <h2 className="panel-title">Related transactions — shared counterparties ({relatedDeals.length})</h2>
              <Link href="/deals" className="link-ledger-strong">
                <span>Full ledger &rarr;</span>
              </Link>
            </div>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {relatedDeals.map((related) => (
                <Link
                  key={related.id}
                  href={`/deals/${related.slug}`}
                  className="panel-interactive group p-4"
                >
                  <div className="flex items-center justify-between gap-2 font-mono text-[10px] text-zinc-500">
                    <span>{related.announcement_date || 'Undisclosed date'}</span>
                    <span className="num font-bold text-zinc-900">
                      {related.amount_disclosed && related.amount_value !== null
                        ? formatCurrency(related.amount_value, related.amount_currency)
                        : 'Not Disclosed'}
                    </span>
                  </div>
                  <div className="mt-1.5 line-clamp-2 text-sm font-bold text-zinc-950 transition-colors group-hover:text-emerald-800">
                    {related.title}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Prev / next chronological navigation */}
        <nav aria-label="Adjacent transactions" className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {newerDeal ? (
            <Link href={`/deals/${newerDeal.slug}`} className="panel-interactive p-5">
              <div className="eyebrow eyebrow-mint">&larr; Newer transaction</div>
              <div className="mt-1.5 line-clamp-2 text-sm font-bold text-zinc-950">
                {newerDeal.title}
              </div>
            </Link>
          ) : (
            <span />
          )}
          {olderDeal && (
            <Link href={`/deals/${olderDeal.slug}`} className="panel-interactive p-5 sm:text-right">
              <div className="eyebrow eyebrow-mint">Older transaction &rarr;</div>
              <div className="mt-1.5 line-clamp-2 text-sm font-bold text-zinc-950">{olderDeal.title}</div>
            </Link>
          )}
        </nav>
      </div>
    </div>
  );
}