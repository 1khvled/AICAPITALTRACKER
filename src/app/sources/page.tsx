import React from 'react';
import Link from 'next/link';
import { Metadata } from 'next';
import { DataRepository } from '../../lib/data/db';
import { getFreshFilings, getPlatformFreshness, formatFreshnessDate, getLedgerFreshness, formatLedgerDate, shortDealLabel } from '../../lib/data/fresh';
import { IngestTimeline, PublisherDonut } from '../../components/charts/IngestTimeline';
import { FileText, ExternalLink, CheckCircle2, RefreshCw, Search } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Source Registry & Primary Citations — AI Capital Tracker',
  description:
    'Transparent registry of primary SEC filings, company investor relations feeds, and regulatory sources used to verify AI capital flows.',
};

export const revalidate = 3600;

interface SourcesPageProps {
  searchParams: Promise<{
    q?: string;
  }>;
}

export default async function SourcesPage({ searchParams }: SourcesPageProps) {
  const { q = '' } = await searchParams;
  const cleanQuery = q.trim();
  const [sources, sourceRegistry, ledgerDeals] = await Promise.all([
    DataRepository.getSources({ query: cleanQuery }),
    DataRepository.getSourceRegistry({ query: cleanQuery }),
    DataRepository.getDeals(),
  ]);
  const freshness = getPlatformFreshness();
  const ledger = getLedgerFreshness(ledgerDeals);
  const freshFilings = getFreshFilings().slice(0, 25);
  const allFreshFilings = getFreshFilings();

  return (
    <div className="pb-16">
      {/* Terminal hero */}
      <section className="hero-terminal">
        <div className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
          <p className="eyebrow-terminal text-emerald-300">
            <FileText aria-hidden="true" className="h-3.5 w-3.5" />
            <span>Statutory audit registry</span>
          </p>
          <h1 className="mt-2 text-2xl font-black tracking-tight text-white sm:text-3xl lg:text-4xl">
            Source registry &amp; primary document citations
          </h1>
          <p className="mt-2 max-w-3xl text-xs leading-relaxed text-zinc-400 sm:text-sm">
            Every transaction published on AICapitalTracker is anchored to statutory regulatory filings,
            official company releases, or verified tier-1 reporting.
          </p>

          {/* Citation search */}
          <form method="GET" className="mt-6 max-w-2xl">
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative flex-1">
                <Search aria-hidden="true" className="absolute left-3.5 top-3 h-4 w-4 text-zinc-500" />
                <label htmlFor="sources-search" className="sr-only">
                  Search citations and registry endpoints
                </label>
                <input
                  id="sources-search"
                  type="text"
                  name="q"
                  defaultValue={cleanQuery}
                  placeholder="Citations or endpoints (e.g. SEC, 10-K, press release)…"
                  className="field-terminal pl-10"
                />
              </div>
              <button type="submit" className="btn btn-accent">
                Search
              </button>
            </div>
            {cleanQuery !== '' && (
              <p className="pt-2 font-mono text-[11px] text-zinc-400">
                Filtering by &ldquo;{cleanQuery}&rdquo; &mdash;{' '}
                <Link href="/sources" className="rounded text-emerald-300 hover:text-emerald-200 hover:underline">
                  Reset
                </Link>
              </p>
            )}
          </form>
        </div>
      </section>

      <div className="mx-auto max-w-7xl space-y-8 px-4 py-10 sm:px-6 lg:px-8">
        {/* Live ingest freshness */}
        <div className="notice notice-mint">
          <div className="eyebrow eyebrow-mint">
            <RefreshCw aria-hidden="true" className="h-3.5 w-3.5" />
            <span>Live ingest freshness</span>
          </div>
          <div className="mt-3 space-y-3">
            {freshness.source === 'live-ingest' && freshness.lastIngestAt ? (
              <>
                <p className="text-sm text-zinc-900">
                  <strong className="font-mono">Data as of {formatFreshnessDate(freshness.lastIngestAt)}</strong>
                  <span className="ml-1 font-mono text-xs text-zinc-500">
                    ({new Date(freshness.lastIngestAt).toUTCString()})
                  </span>
                </p>
                <p className="border-l-2 border-emerald-500 pl-3 text-xs leading-relaxed text-emerald-900">
                  Ledger latest verified deal:{' '}
                  <strong>
                    {formatLedgerDate(ledger.latestVerifiedDealDate)} ({shortDealLabel(ledger.latestVerifiedTitle)})
                  </strong>{' '}
                  &mdash; that date is MAX(announcement_date), not staleness.{' '}
                  <strong>
                    Live SEC filings as of {formatLedgerDate(freshness.lastIngestAt.slice(0, 10))} (
                    {freshness.filingsCount} new)
                  </strong>{' '}
                  with <strong>{freshness.queueCount} candidates</strong> awaiting editorial review.
                </p>
                <p className="text-xs leading-relaxed text-zinc-600">
                  Last SEC EDGAR ingest indexed <strong>{freshness.filingsCount} fresh filings</strong> across
                  tracked issuers (NVDA, MSFT, AMZN, GOOGL, META, ORCL, CEG, TLN, VST) with{' '}
                  <strong>{freshness.queueCount} candidates</strong> awaiting editorial review.
                  {freshness.ingestStatus === 'blocked'
                    ? ' The most recent attempt was rate-limited by EDGAR, so the figures below reflect the last successful run — no data was fabricated to fill the gap.'
                    : ' Filing metadata below links directly to the primary SEC document.'}
                </p>
              </>
            ) : (
              <p className="text-xs leading-relaxed text-zinc-600">
                Fresh ingest has not run yet &mdash; figures on this site currently reflect the static verified
                dataset snapshot. Run{' '}
                <code className="rounded border border-zinc-200 bg-white px-1 font-mono">npm run ingest</code>{' '}
                to fetch the latest SEC EDGAR filings (free, no API key required).
              </p>
            )}
          </div>
          <div className="mt-4 flex flex-wrap gap-4 font-mono text-[11px]">
            <a
              href="https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=0001045810&type=8-K"
              target="_blank"
              rel="noopener noreferrer"
              className="link-ledger-strong"
            >
              <span>Verify on SEC EDGAR</span>
              <ExternalLink aria-hidden="true" className="h-2.5 w-2.5" />
            </a>
            <a
              href="https://data.sec.gov/submissions/CIK0001045810.json"
              target="_blank"
              rel="noopener noreferrer"
              className="link-ledger-strong"
            >
              <span>Raw EDGAR submissions JSON</span>
              <ExternalLink aria-hidden="true" className="h-2.5 w-2.5" />
            </a>
          </div>
        </div>

        {/* Ingest volume + citation mix */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="panel p-6">
            <IngestTimeline filings={allFreshFilings} queueCount={freshness.queueCount} />
          </div>
          <div className="panel p-6">
            <PublisherDonut sources={sources} />
          </div>
        </div>

        {/* Fresh SEC filings docket */}
        {freshFilings.length > 0 && (
          <div className="panel space-y-4 p-6">
            <div>
              <h2 className="panel-title">Fresh SEC filings docket ({freshness.filingsCount})</h2>
              <p className="mt-1 text-xs text-zinc-500">
                Real filing metadata from the latest ingest &mdash; review leads only, not verified deals.
                Showing the {freshFilings.length} most recent.
              </p>
            </div>
            <ul className="divide-y divide-zinc-100 text-xs">
              {freshFilings.map((filing) => (
                <li key={filing.accession} className="ledger-row space-y-1 py-3">
                  <div className="flex items-baseline justify-between gap-4">
                    <a
                      href={filing.primary_doc_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded text-sm font-bold text-zinc-950 transition-colors hover:text-emerald-800 hover:underline"
                    >
                      <span>{filing.title}</span>
                      <ExternalLink aria-hidden="true" className="h-3 w-3 shrink-0 text-zinc-500" />
                    </a>
                    <span className="whitespace-nowrap font-mono text-[11px] text-zinc-500">
                      {filing.filed_at}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 font-mono text-[10px] text-zinc-500">
                    <span className="pill pill-neutral px-1.5 text-[9px]">Form {filing.form}</span>
                    <span>CIK {filing.cik}</span>
                    {filing.items && <span>Items {filing.items}</span>}
                    <span className="break-all">{filing.accession}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Monitored adapters */}
        <div className="panel space-y-4 p-6">
          <div>
            <h2 className="panel-title">Monitored regulatory &amp; ingestion adapters</h2>
            <p className="mt-1 text-xs text-zinc-500">
              Public machine-readable endpoints and feeds polled under polite fair-access policies.
            </p>
          </div>

          <div
            role="region"
            aria-label="Monitored source adapters"
            tabIndex={0}
            className="ledger-scroll overflow-x-auto"
          >
            {sourceRegistry.length > 0 ? (
              <table className="min-w-full text-left text-xs">
                <caption className="sr-only">Monitored regulatory and ingestion source adapters</caption>
                <thead>
                  <tr className="ledger-head">
                    <th scope="col" className="ledger-head-cell">Source endpoint</th>
                    <th scope="col" className="ledger-head-cell">Classification</th>
                    <th scope="col" className="ledger-head-cell">Access protocol</th>
                    <th scope="col" className="ledger-head-cell">Compliance status</th>
                    <th scope="col" className="ledger-head-cell">Rate limits &amp; fair access</th>
                    <th scope="col" className="ledger-head-cell text-right">Policy URL</th>
                  </tr>
                </thead>
                <tbody className="ledger-body">
                  {sourceRegistry.map((item) => (
                    <tr key={item.id} className="ledger-row align-top">
                      <td className="px-3 py-3 font-semibold text-zinc-950">
                        <div>{item.name}</div>
                        <div className="break-all font-mono text-[10px] text-zinc-500">{item.base_url}</div>
                      </td>
                      <td className="px-3 py-3 font-mono text-zinc-600">
                        {item.source_category.replace(/_/g, ' ')}
                      </td>
                      <td className="px-3 py-3 font-mono text-[10px] uppercase text-zinc-600">
                        {item.access_method.replace(/_/g, ' ')}
                      </td>
                      <td className="px-3 py-3">
                        {item.is_enabled ? (
                          <span className="pill pill-mint">
                            <CheckCircle2 aria-hidden="true" className="h-3 w-3" />
                            Active
                          </span>
                        ) : (
                          <span className="pill pill-neutral">Manual / queue</span>
                        )}
                      </td>
                      <td className="max-w-xs px-3 py-3 text-[11px] leading-relaxed text-zinc-500">
                        {item.rate_limit_notes || 'Polite rate limits with custom User-Agent'}
                      </td>
                      <td className="px-3 py-3 text-right">
                        {item.terms_url && (
                          <a
                            href={item.terms_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="link-cite"
                          >
                            <span>Terms</span>
                            <ExternalLink aria-hidden="true" className="h-2.5 w-2.5" />
                          </a>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="py-8 text-center font-mono text-xs italic text-zinc-500">
                No registry endpoints match &ldquo;{cleanQuery}&rdquo;.
              </p>
            )}
          </div>
        </div>

        {/* Statutory citation dossier */}
        <div className="panel space-y-4 p-6">
          <div>
            <h2 className="panel-title">Statutory document citations docket ({sources.length})</h2>
            <p className="mt-1 text-xs text-zinc-500">
              Direct regulatory documents, SEC accession entries, and company disclosures.
            </p>
          </div>

          {sources.length > 0 ? (
            <ul className="divide-y divide-zinc-100 text-xs">
              {sources.map((source) => (
                <li key={source.id} className="space-y-1.5 py-3.5">
                  <div className="flex items-baseline justify-between gap-4">
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded text-sm font-bold text-zinc-950 transition-colors hover:text-emerald-800 hover:underline"
                    >
                      <span>{source.title}</span>
                      <ExternalLink aria-hidden="true" className="h-3 w-3 shrink-0 text-zinc-500" />
                    </a>
                    <span className="whitespace-nowrap font-mono text-[11px] text-zinc-500">
                      {source.published_date || 'Date unrecorded'}
                    </span>
                  </div>
                  <p className="leading-normal text-zinc-600">{source.notes}</p>
                  <div className="flex items-center gap-2 font-mono text-[10px] text-zinc-500">
                    <span>Publisher: {source.publisher || 'Unknown'}</span>
                    <span aria-hidden="true">•</span>
                    <span className="uppercase">{source.source_type.replace(/_/g, ' ')}</span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="empty-state space-y-2">
              <p className="font-mono text-label font-bold uppercase text-zinc-500">
                No citations match query
              </p>
              <p className="mx-auto max-w-sm text-xs text-zinc-500">
                Try broadening your search terms or reset the filter.
              </p>
              <Link href="/sources" className="btn btn-primary mt-3">
                Reset search
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}