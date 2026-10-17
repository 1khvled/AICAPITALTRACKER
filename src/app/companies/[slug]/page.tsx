import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { DataRepository } from '../../../lib/data/db';
import { DealTable } from '../../../components/DealTable';
import { formatCurrency, formatDealType } from '../../../lib/formatters';
import { EvidenceBadge } from '../../../components/EvidenceBadge';
import { dealTypeColor } from '../../../components/charts/chartTheme';
import { MiniDonut, Sparkline, StarNetwork } from '../../../components/charts/FlowMini';
import { ExternalLink, ArrowRight } from 'lucide-react';

interface CompanyPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export const revalidate = 3600;

export async function generateStaticParams() {
  const companies = await DataRepository.getCompanies();
  return companies.map((company) => ({ slug: company.slug }));
}

export async function generateMetadata({ params }: CompanyPageProps): Promise<Metadata> {
  const { slug } = await params;
  const company = await DataRepository.getCompanyBySlug(slug);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://aicapitaltracker.com';

  if (!company) {
    return {
      title: 'Company Not Found',
    };
  }

  const companyUrl = `${siteUrl}/companies/${company.slug}`;
  const description =
    company.description || `Verified financing, debt facilities, and counterparty relationships for ${company.name}.`;

  return {
    title: `${company.name} — Capital Structure, Debt Facilities & Counterparties`,
    description,
    alternates: {
      canonical: `/companies/${company.slug}`,
    },
    openGraph: {
      title: `${company.name} — Capital Structure & Counterparties`,
      description,
      url: companyUrl,
      siteName: 'AI Capital Tracker',
      locale: 'en_US',
      type: 'article',
      images: [{ url: '/opengraph-default.png', width: 1200, height: 630, alt: company.name }],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${company.name} — Capital Structure & Counterparties`,
      description,
      images: ['/opengraph-default.png'],
    },
  };
}

export default async function CompanyProfilePage({ params }: CompanyPageProps) {
  const { slug } = await params;
  const company = await DataRepository.getCompanyBySlug(slug);

  if (!company) {
    notFound();
  }

  const deals = await DataRepository.getDeals({ companySlug: slug });
  const relationships = await DataRepository.getRelationships(slug);

  const totalCapitalVolume = deals.reduce((sum, d) => sum + (d.amount_value || 0), 0);

  // Visual strip: deal-type mix, capital-over-quarters, counterparty star.
  const dealsByType = new Map<string, number>();
  for (const d of deals) {
    dealsByType.set(d.deal_type, (dealsByType.get(d.deal_type) ?? 0) + 1);
  }
  const donutSegments = [...dealsByType.entries()]
    .map(([t, count]) => ({ label: formatDealType(t), value: count, color: dealTypeColor(t) }))
    .sort((a, b) => b.value - a.value);

  const quarterTotals = new Map<string, number>();
  for (const d of deals) {
    const m = d.announcement_date ? /^(\d{4})-(\d{2})/.exec(d.announcement_date) : null;
    if (!m) continue;
    const q = Math.min(4, Math.floor((parseInt(m[2], 10) - 1) / 3) + 1);
    const key = `${m[1]}-Q${q}`;
    quarterTotals.set(key, (quarterTotals.get(key) ?? 0) + (d.amount_value || 0));
  }
  const quarterKeys = [...quarterTotals.keys()].sort();
  const quarterPoints = quarterKeys.map((k) => quarterTotals.get(k) ?? 0);

  const spokeAcc = new Map<string, { name: string; slug?: string; deals: number; rel: string | null }>();
  for (const d of deals) {
    for (const p of d.parties ?? []) {
      if (p.company_id === company.id || !p.company) continue;
      const e = spokeAcc.get(p.company_id) ?? { name: p.company.name, slug: p.company.slug, deals: 0, rel: null };
      e.deals += 1;
      spokeAcc.set(p.company_id, e);
    }
  }
  for (const rel of relationships) {
    const isFrom = rel.from_company?.slug === slug;
    const other = isFrom ? rel.to_company : rel.from_company;
    if (!other) continue;
    const key = isFrom ? rel.to_company_id : rel.from_company_id;
    const e = spokeAcc.get(key) ?? { name: other.name, slug: other.slug, deals: 0, rel: null };
    if (!e.rel) e.rel = rel.relationship_type.replace(/_/g, ' ');
    spokeAcc.set(key, e);
  }
  const spokes = [...spokeAcc.values()].map((e) => ({
    name: e.name,
    href: e.slug ? `/companies/${e.slug}` : undefined,
    weight: e.deals > 0 ? e.deals + (e.rel ? 0.5 : 0) : 0.5,
    label: e.deals > 0 ? `${e.deals} deal${e.deals === 1 ? '' : 's'}${e.rel ? ` · ${e.rel}` : ''}` : (e.rel ?? undefined),
  }));

  function getSafeHostname(rawUrl: string | null | undefined): string {
    if (!rawUrl) return 'Website';
    try {
      return new URL(rawUrl).hostname;
    } catch {
      return 'Website';
    }
  }

  function getSafeWebsiteHref(rawUrl: string | null | undefined): string {
    if (!rawUrl) return '#';
    try {
      const parsed = new URL(rawUrl);
      if (parsed.protocol === 'http:' || parsed.protocol === 'https:') return rawUrl;
      return '#';
    } catch {
      return '#';
    }
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://aicapitaltracker.com';
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: siteUrl },
      { '@type': 'ListItem', position: 2, name: 'Companies', item: `${siteUrl}/companies` },
      { '@type': 'ListItem', position: 3, name: company.name, item: `${siteUrl}/companies/${company.slug}` },
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
          <nav aria-label="Breadcrumb">
            <ol className="flex items-center gap-2 font-mono text-xs text-zinc-400">
              <li>
                <Link href="/" className="rounded transition-colors hover:text-white">
                  HOME
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li>
                <Link href="/companies" className="rounded transition-colors hover:text-white">
                  COMPANIES
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li aria-current="page" className="truncate font-medium text-emerald-300">
                {company.name}
              </li>
            </ol>
          </nav>

          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="pill pill-terminal">
                {company.company_type.replace(/_/g, ' ')}
              </span>
              {company.is_public ? (
                <span className="pill pill-terminal-mint">
                  Public &bull; {company.ticker ? `$${company.ticker}` : 'Listed'}
                </span>
              ) : (
                <span className="pill pill-terminal">Privately held</span>
              )}
            </div>

            {company.website_url && (
              <a
                href={getSafeWebsiteHref(company.website_url)}
                target="_blank"
                rel="noopener noreferrer"
                className="pill pill-terminal transition-colors hover:border-emerald-400/40 hover:text-white"
              >
                <span>{getSafeHostname(company.website_url)}</span>
                <ExternalLink aria-hidden="true" className="h-3 w-3 text-zinc-500" />
              </a>
            )}
          </div>

          <div className="space-y-3">
            <h1 className="text-3xl font-black leading-tight tracking-tight text-white sm:text-4xl lg:text-5xl">
              {company.name}
            </h1>
            <p className="max-w-4xl text-xs leading-relaxed text-zinc-400 sm:text-sm">
              {company.description}
            </p>
          </div>

          {/* Dossier metadata rail */}
          <div className="terminal-card grid grid-cols-2 gap-5 p-5 sm:grid-cols-4">
            <div>
              <div className="stat-label text-zinc-400">Tracked disclosed capital</div>
              <div className="num mt-1 text-xl font-bold leading-none text-emerald-300 sm:text-2xl">
                {formatCurrency(totalCapitalVolume)}
              </div>
              <div className="stat-note-terminal">
                Across {deals.length} transaction(s)
              </div>
            </div>

            <div>
              <div className="stat-label text-zinc-400">SEC EDGAR identifier</div>
              <div className="mt-1.5 font-mono text-xs font-bold text-white">
                {company.cik ? `CIK ${company.cik}` : 'Non-Reporting / Private'}
              </div>
              <div className="stat-note-terminal">
                U.S. Securities &amp; Exchange Comm.
              </div>
            </div>

            <div>
              <div className="stat-label text-zinc-400">Operational base</div>
              <div className="mt-1.5 font-mono text-xs font-bold text-white">
                {company.headquarters_city
                  ? `${company.headquarters_city}, ${company.headquarters_country}`
                  : company.headquarters_country || 'Global'}
              </div>
              <div className="stat-note-terminal">Primary headquarters</div>
            </div>

            <div>
              <div className="stat-label text-zinc-400">Documented ties</div>
              <div className="num mt-1 text-xl font-bold leading-none text-white sm:text-2xl">
                {relationships.length}
              </div>
              <div className="stat-note-terminal">Verified counterparties</div>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl space-y-8 px-4 py-10 sm:px-6 lg:px-8">
        {/* Visual entity strip */}
        <section aria-label="Company visuals" className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
          <div className="panel-interactive p-6">
            <div className="border-b border-zinc-100 pb-3">
              <h2 className="panel-title">Deal mix by type</h2>
              <p className="mt-1 text-xs text-zinc-500">
                This entity&apos;s {deals.length} tracked transaction(s).
              </p>
            </div>
            <div className="mt-4">
              <MiniDonut segments={donutSegments} centerLabel={String(deals.length)} centerSub="deals" />
            </div>
          </div>

          <div className="panel-interactive p-6">
            <div className="border-b border-zinc-100 pb-3">
              <h2 className="panel-title">Disclosed capital by quarter</h2>
              <p className="mt-1 text-xs text-zinc-500">
                Summed disclosed amounts per announcement quarter.
              </p>
            </div>
            <div className="mt-4">
              <Sparkline
                points={quarterPoints}
                labels={quarterKeys}
                currency="USD"
                unit="disclosed capital"
              />
            </div>
          </div>

          <div className="panel-interactive p-6">
            <div className="border-b border-zinc-100 pb-3">
              <h2 className="panel-title">Counterparty mini-network</h2>
              <p className="mt-1 text-xs text-zinc-500">
                Direct ties radiating from {company.name}.
              </p>
            </div>
            <div className="mt-4">
              <StarNetwork center={company.name} spokes={spokes} sub={`${spokes.length} counterparties`} />
            </div>
          </div>
        </section>

        {/* Counterparty graph */}
        <div className="panel p-6">
          <div className="flex items-center justify-between gap-4 border-b border-zinc-100 pb-3">
            <div>
              <div className="eyebrow eyebrow-mint">Counterparty graph</div>
              <h2 className="mt-0.5 text-base font-bold tracking-tight text-zinc-950 sm:text-lg">
                Documented counterparty network ({relationships.length})
              </h2>
              <p className="mt-0.5 text-xs text-zinc-500">
                Verified supplier, customer, debt syndicate, or equity ties.
              </p>
            </div>
            <Link href="/relationships" className="link-ledger-strong shrink-0">
              <span>View full ecosystem</span>
              <ArrowRight aria-hidden="true" className="h-3 w-3" />
            </Link>
          </div>

          {relationships.length === 0 ? (
            <p className="py-6 font-mono text-xs italic text-zinc-500">
              No standalone counterparty links indexed yet.
            </p>
          ) : (
            <div className="ledger-shell mt-4">
              <div
                role="region"
                aria-label="Counterparty relationships"
                tabIndex={0}
                className="ledger-scroll overflow-x-auto"
              >
                <table className="min-w-full text-left text-xs">
                  <caption className="sr-only">Documented counterparty relationships for {company.name}</caption>
                  <thead>
                    <tr className="ledger-head">
                      <th scope="col" className="ledger-head-cell">Connected entity</th>
                      <th scope="col" className="ledger-head-cell">Relationship flow</th>
                      <th scope="col" className="ledger-head-cell">Scope / description</th>
                      <th scope="col" className="ledger-head-cell">Evidence</th>
                      <th scope="col" className="ledger-head-cell text-right">Citation</th>
                    </tr>
                  </thead>
                  <tbody className="ledger-body">
                    {relationships.map((rel) => {
                      const isFrom = rel.from_company?.slug === slug;
                      const otherCompany = isFrom ? rel.to_company : rel.from_company;
                      const source = rel.sources?.[0]?.source;

                      return (
                        <tr key={rel.id} className="ledger-row align-top">
                          <td className="px-4 py-3.5 font-semibold text-zinc-950">
                            {otherCompany ? (
                              <Link
                                href={`/companies/${otherCompany.slug}`}
                                className="rounded transition-colors hover:text-emerald-800 hover:underline"
                              >
                                {otherCompany.name}
                              </Link>
                            ) : (
                              'Unknown'
                            )}
                            <span className="mt-0.5 block font-mono text-[10px] font-normal text-zinc-500">
                              {otherCompany?.company_type.replace(/_/g, ' ')}
                            </span>
                          </td>

                          <td className="whitespace-nowrap px-4 py-3.5">
                            <span className="pill pill-neutral">
                              {rel.relationship_type.replace(/_/g, ' ')}
                            </span>
                          </td>

                          <td className="max-w-sm px-4 py-3.5 leading-normal text-zinc-600">
                            {rel.description}
                          </td>

                          <td className="whitespace-nowrap px-4 py-3.5">
                            <EvidenceBadge level={rel.evidence_level} size="sm" />
                          </td>

                          <td className="whitespace-nowrap px-4 py-3.5 text-right">
                            {source ? (
                              <a
                                href={source.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="link-cite"
                              >
                                <span>{source.publisher || 'Link'}</span>
                                <ExternalLink aria-hidden="true" className="h-2.5 w-2.5" />
                              </a>
                            ) : (
                              <span className="font-mono text-zinc-500">&mdash;</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Deal ledger for this company */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-200 pb-3">
            <div>
              <div className="eyebrow eyebrow-mint">Primary transactions</div>
              <h2 className="mt-0.5 text-xl font-bold tracking-tight text-zinc-950 sm:text-2xl">
                Disclosed transactions involving {company.name} ({deals.length})
              </h2>
              <p className="mt-0.5 text-xs text-zinc-500">
                Debt financings, strategic capital injections, compute allocations, and PPAs.
              </p>
            </div>
          </div>

          <DealTable deals={deals} />
        </div>
      </div>
    </div>
  );
}