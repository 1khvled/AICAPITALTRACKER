import React from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';
import { DataRepository } from '../lib/data/db';
import { getPlatformFreshness } from '../lib/data/fresh';
import { DealTable } from '../components/DealTable';
import { formatCurrency } from '../lib/formatters';
import { MiniDonut } from '../components/charts/MiniDonut';
import { Sparkline } from '../components/charts/Sparkline';
import { DateHistogram } from '../components/charts/DateHistogram';
import { DEAL_TYPE_ORDER, dealTypeColor, dealTypeLabel } from '../components/charts/chartTheme';
import {
  ArrowRight,
  ShieldCheck,
  Zap,
  Cpu,
  Server,
  Coins,
  Search,
  CheckCircle2,
  TrendingUp,
  Terminal,
} from 'lucide-react';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'AI Capital Tracker — Follow the Capital Flows Behind AI Infrastructure',
  description:
    'Transparent, source-backed research database tracking GPU-collateralized debt, hyperscaler equity, cloud compute contracts, and nuclear power agreements behind AI infrastructure.',
  alternates: { canonical: '/' },
  openGraph: {
    title: 'AI Capital Tracker — Financial Intelligence & Capital Flow Database',
    description:
      'Transparent, source-backed tracking of capital flows into AI companies, data centers, and power infrastructure.',
    url: '/',
    siteName: 'AI Capital Tracker',
    locale: 'en_US',
    type: 'website',
    images: [{ url: '/opengraph-default.png', width: 1200, height: 630, alt: 'AI Capital Tracker' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AI Capital Tracker',
    description: 'Transparent, source-backed database of AI infrastructure financing.',
    images: ['/opengraph-default.png'],
  },
};

export default async function HomePage() {
  const metrics = await DataRepository.getPlatformMetrics();
  const latestDeals = await DataRepository.getDeals();
  const companies = await DataRepository.getCompanies();
  const freshness = getPlatformFreshness();

  // Aggregates computed inline from the single deals fetch above (no extra queries).
  const byTypeCounts = new Map<string, number>();
  const quarterlyVolume = new Map<string, number>();
  for (const d of latestDeals) {
    byTypeCounts.set(d.deal_type, (byTypeCounts.get(d.deal_type) ?? 0) + 1);
    if (
      d.amount_disclosed &&
      d.amount_value &&
      d.amount_value > 0 &&
      d.announcement_date &&
      d.announcement_date.length >= 7
    ) {
      const year = d.announcement_date.slice(0, 4);
      const month = parseInt(d.announcement_date.slice(5, 7), 10);
      if (/^\d{4}$/.test(year) && month >= 1 && month <= 12) {
        const key = `${year}Q${Math.floor((month - 1) / 3) + 1}`;
        quarterlyVolume.set(key, (quarterlyVolume.get(key) ?? 0) + (d.amount_value ?? 0));
      }
    }
  }
  const typeDonut = DEAL_TYPE_ORDER.filter((t) => byTypeCounts.has(t)).map((t) => ({
    label: dealTypeLabel(t),
    value: byTypeCounts.get(t) ?? 0,
    color: dealTypeColor(t),
  }));
  const sortedQuarters = [...quarterlyVolume.entries()].sort(([a], [b]) => a.localeCompare(b));
  const sparkData = sortedQuarters.map(([, v]) => v);
  const sparkLabels = sortedQuarters.map(([k]) => k);
  const sparkTotal = sparkData.reduce((m, v) => m + v, 0);

  return (
    <div className="pb-16">
      {/* Flagship terminal hero — visual-first */}
      <section className="hero-terminal">
        <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
          <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
            {/* Left: headline + query */}
             {/* `min-w-0` lets the track shrink below the intrinsic width of the
                nowrap freshness pill instead of overflowing the viewport. */}
            <div className="min-w-0 max-w-2xl space-y-6">
              {/* `.pill` is nowrap by default; this one carries two clauses so it opts
                  back into wrapping on narrow viewports. */}
              <span className="pill pill-terminal-mint max-w-full whitespace-normal text-center sm:whitespace-nowrap">
                <span className="live-dot" aria-hidden="true" />
                Independent research database
                <span className="text-emerald-500/60" aria-hidden="true">
                  •
                </span>
                <span className="text-emerald-200/80">100% cited disclosures</span>
              </span>

              <div>
                {(() => {
                  // Ledger-vs-live: MAX(announcement_date) is the newest VERIFIED
                  // deal, while ingest freshness is the newest SEC filing check.
                  // Shown side-by-side so readers stop conflating the two dates.
                  let latestDate: string | null = null;
                  let latestTitle = '';
                  for (const d of latestDeals) {
                    if (d.announcement_date && (!latestDate || d.announcement_date > latestDate)) {
                      latestDate = d.announcement_date;
                      latestTitle = d.title;
                    }
                  }
                  const fmtLong = (ymd: string | null): string => {
                    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(ymd ?? '');
                    if (!m) return '—';
                    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                    return `${months[Number(m[2]) - 1]} ${Number(m[3])} ${m[1]}`;
                  };
                  const shortTitle = (() => {
                    const m = /([A-Za-z][\w&.'-]*)\b[^$()]{0,48}\$\s?([\d.,]+)\s?B/i.exec(latestTitle);
                    if (m) return `${m[1]} $${m[2]}B`;
                    return latestTitle.length > 48 ? `${latestTitle.slice(0, 48)}…` : latestTitle || 'untitled deal';
                  })();
                  return (
                    <Link
                      href="/sources"
                      title="See data sources and last ingest time"
                      className="pill pill-terminal w-full max-w-full py-1.5 text-[11px] normal-case transition-colors hover:border-emerald-400/40 hover:bg-emerald-500/10 hover:text-emerald-200 sm:w-auto"
                    >
                      <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-400" aria-hidden="true" />
                      <span className="truncate">
                        DATA-AS-OF {fmtLong(latestDate).toUpperCase()} ({shortTitle})
                        <span className="text-emerald-500"> • </span>
                        {freshness.source === 'live-ingest' && freshness.lastIngestAt ? (
                          <span>
                            LIVE SEC FILINGS AS OF {fmtLong(freshness.lastIngestAt.slice(0, 10)).toUpperCase()} (
                            {freshness.filingsCount} new)
                          </span>
                        ) : (
                          <span>RUN INGEST FOR FRESH FILINGS</span>
                        )}
                      </span>
                    </Link>
                  );
                })()}
              </div>

              <h1 className="text-4xl font-black leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
                Follow the{' '}
                <span className="bg-gradient-to-r from-emerald-300 via-teal-200 to-sky-300 bg-clip-text text-transparent">
                  capital flows
                </span>{' '}
                behind AI infrastructure.
              </h1>

              <p className="max-w-xl text-sm leading-relaxed text-zinc-400 sm:text-base">
                A transparent, source-backed research database tracking GPU-collateralized private debt,
                hyperscaler equity commitments, specialized cloud compute contracts, and multi-gigawatt
                nuclear off-take agreements.
              </p>

              {/* Terminal command bar */}
              <div className="pt-1">
                <form
                  action="/search"
                  method="GET"
                  role="search"
                  aria-label="Site search"
                  className="flex max-w-xl flex-col gap-2 sm:flex-row"
                >
                  <div className="relative flex-1">
                    <Search aria-hidden="true" className="absolute left-3.5 top-3.5 h-4 w-4 text-zinc-500" />
                    <label htmlFor="homepage-search" className="sr-only">
                      Search by counterparty, ticker, or deal type
                    </label>
                    <input
                      id="homepage-search"
                      type="text"
                      name="q"
                      placeholder="Search by counterparty, ticker, or deal type (e.g. CoreWeave, NVIDIA, GPU debt)…"
                      className="field-terminal pl-10"
                    />
                  </div>
                  <button type="submit" className="btn btn-accent">
                    Query Ledger
                  </button>
                </form>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-3 font-mono text-[11px] text-zinc-400">
                  <span className="micro-label-terminal">Quick filters:</span>
                  <Link href="/deals?dealType=debt_credit_facility" className="link-terminal text-zinc-300 hover:text-emerald-300 hover:underline">
                    GPU debt facilities
                  </Link>
                  <span aria-hidden="true">/</span>
                  <Link href="/deals?dealType=equity_investment" className="link-terminal text-zinc-300 hover:text-emerald-300 hover:underline">
                    Hyperscaler strategic equity
                  </Link>
                  <span aria-hidden="true">/</span>
                  <Link href="/deals?dealType=power_purchase_agreement" className="link-terminal text-zinc-300 hover:text-emerald-300 hover:underline">
                    Nuclear PPAs (Three Mile Island)
                  </Link>
                </div>
              </div>
            </div>

            {/* Right: live ledger terminal */}
            <div className="terminal-card terminal-ring min-w-0 overflow-hidden">
              <div className="flex items-center justify-between border-b border-white/10 bg-white/[0.02] px-4 py-2.5">
                <div className="flex items-center gap-2">
                  <span className="flex gap-1.5" aria-hidden="true">
                    <span className="h-2.5 w-2.5 rounded-full bg-rose-500/80" />
                    <span className="h-2.5 w-2.5 rounded-full bg-amber-400/80" />
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/90" />
                  </span>
                  <span className="micro-label-terminal ml-1 tracking-[0.14em]">
                    <Terminal aria-hidden="true" className="h-3 w-3" />
                    LIVE_LEDGER — QTR VOLUME
                  </span>
                </div>
                <span className="micro-label-terminal text-emerald-300">
                  <span className="live-dot" aria-hidden="true" />
                  STREAMING
                </span>
              </div>

              <div className="space-y-4 p-4">
                <div className="panel p-4">
                  <div className="flex items-center justify-between gap-2 border-b border-zinc-100 pb-2">
                    <h2 className="panel-title flex items-center gap-1.5">
                      <TrendingUp aria-hidden="true" className="h-3 w-3" />
                      Disclosed volume by quarter
                    </h2>
                    <span className="pill pill-mint num">{formatCurrency(sparkTotal)}</span>
                  </div>
                  <div className="mt-3">
                    <Sparkline data={sparkData} labels={sparkLabels} stroke="#059669" />
                  </div>
                  {sparkLabels.length > 0 && (
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <span className="micro-label">{sparkLabels[0]}</span>
                      <span className="micro-label text-zinc-500">
                        {sparkLabels.length} quarters
                      </span>
                      <span className="micro-label">{sparkLabels[sparkLabels.length - 1]}</span>
                    </div>
                  )}
                </div>

                <div className="panel p-4">
                  <h2 className="panel-title border-b border-zinc-100 pb-2">
                    Deals by type
                  </h2>
                  <div className="mt-3">
                    <MiniDonut data={typeDonut} centerLabel="deals" />
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/10 bg-white/[0.02] px-4 py-2.5">
                <span className="micro-label-terminal">0 ESTIMATES · 100% CITED</span>
                <Link href="/visualize" className="link-terminal text-emerald-300 hover:text-emerald-200">
                  Open visual terminal <ArrowRight aria-hidden="true" className="h-3 w-3" />
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Live capital stats rail */}
        <div className="relative border-t border-white/10 bg-black/40 backdrop-blur">
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            <div className="stat-rail">
              <div>
                <div className="stat-label-terminal">Disclosed volume documented</div>
                <div className="stat-value-terminal">{formatCurrency(metrics.totalDisclosedVolume)}</div>
                <div className="stat-note-terminal">Primary SEC &amp; IR releases</div>
              </div>

              <div>
                <div className="stat-label-terminal">Verified transactions</div>
                <div className="stat-value-terminal">{metrics.totalDeals}</div>
                <div className="stat-note-terminal text-emerald-400">100% cited &amp; audited</div>
              </div>

              <div>
                <div className="stat-label-terminal">Tracked counterparties</div>
                <div className="stat-value-terminal">{metrics.totalCompanies}</div>
                <div className="stat-note-terminal">Labs, hyperscalers, lenders</div>
              </div>

              <div>
                <div className="stat-label-terminal">Primary statutory sources</div>
                <div className="stat-value-terminal">{metrics.totalSources}</div>
                <div className="stat-note-terminal">SEC 10-K, 10-Q, 8-K &amp; IR</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl space-y-14 px-4 pt-14 sm:px-6 lg:px-8">
        {/* AI capital allocation blueprint */}
        <section className="space-y-6">
          <div className="section-head">
            <div>
              <div className="eyebrow eyebrow-mint">Capital taxonomy</div>
              <h2>How capital flows across the AI ecosystem</h2>
            </div>
            <Link href="/relationships" className="link-ledger">
              <span>Inspect counterparty flow map</span>
              <ArrowRight aria-hidden="true" className="h-3 w-3" />
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            <TaxonomyCard
              icon={Coins}
              iconTone="icon-tile-amber"
              pill="pill-amber"
              pillLabel="Credit facility"
              title="GPU-collateralized debt facilities"
              body="Specialized AI neoclouds (CoreWeave, Crusoe, Northern Data) pledge physical NVIDIA H100 GPU clusters as tangible collateral to syndicate lenders (Blackstone, Magnetar, Coatue, Tether) to fund continuous cluster expansion."
              benchmark="CoreWeave"
              href="/deals/coreweave-8-5-billion-delayed-draw-term-loan-facility-4"
              cta="$8.5B DDTL 4.0 →"
            />
            <TaxonomyCard
              icon={Server}
              iconTone="icon-tile-sky"
              pill="pill-sky"
              pillLabel="Equity + cloud"
              title="Strategic equity & compute injections"
              body="Hyperscalers (Microsoft, Amazon, Google, NVIDIA) provide multi-billion dollar capital rounds to foundation model labs (OpenAI, Anthropic, Mistral AI, xAI), structured with primary cloud infrastructure consumption terms."
              benchmark="Anthropic"
              href="/deals/anthropic-series-f-13-billion-funding-round"
              cta="$13.0B Series F →"
            />
            <TaxonomyCard
              icon={Zap}
              iconTone="icon-tile-mint"
              pill="pill-mint"
              pillLabel="Power purchase"
              title="Nuclear & clean power off-take PPAs"
              body="20-year power purchase agreements restarting commercial nuclear reactors (Crane Clean Energy Center / Three Mile Island Unit 1, Duane Arnold 615 MW) to provide dedicated carbon-free baseload energy for gigawatt data center clusters."
              benchmark="CEG / MSFT"
              href="/deals/constellation-microsoft-crane-clean-energy-ppa-835mw"
              cta="835 MW PPA →"
            />
            <TaxonomyCard
              icon={Cpu}
              iconTone="icon-tile-violet"
              pill="pill-violet"
              pillLabel="Sovereign compute"
              title="Sovereign funds & custom silicon"
              body="Sovereign capital initiatives from Saudi Arabia (PIF, Alat), the UAE (MGX), and Japan (SoftBank) deploying tens of billions into national compute hubs, custom AI foundries, and server manufacturing."
              benchmark="SoftBank / Arm"
              href="/deals/softbank-project-izanagi-100-billion-ai-chip-venture"
              cta="$100B Izanagi →"
            />
            <TaxonomyCard
              icon={Server}
              iconTone="icon-tile-indigo"
              pill="pill-indigo"
              pillLabel="Real estate & ABS"
              title="Hyperscale real estate & green ABS"
              body="Institutional buyouts and asset-backed securitizations funding gigawatt digital infrastructure campuses (Blackstone AirTrunk A$24B, QTS $25B capital program, CyrusOne-KKR $4B JV, STACK $4B Green ABS)."
              benchmark="AirTrunk buyout"
              href="/deals/blackstone-cpp-investments-airtrunk-acquisition-24-billion-aud"
              cta="A$24.0B acquisition →"
            />
            <TaxonomyCard
              icon={ShieldCheck}
              iconTone="icon-tile-rose"
              pill="pill-rose"
              pillLabel="Regulatory & leaks"
              title="Regulatory injunctions & market leaks"
              body="Tracking critical grid disputes (FERC rejection of Talen/AWS Susquehanna nuclear colocation Docket ER24-2172), confidential hardware partnerships (OpenAI io), and offshore GPU procurement (ByteDance OCI)."
              benchmark="FERC ER24-2172"
              href="/deals/ferc-rejection-talen-energy-aws-susquehanna-nuclear-colocation-isa"
              cta="FERC rejection order →"
              ctaClass="text-rose-700"
            />
          </div>
        </section>

        {/* Market intelligence marquee */}
        <section className="space-y-4">
          <div className="section-head">
            <div>
              <div className="eyebrow eyebrow-rose">
                <span className="h-2 w-2 animate-pulse-soft rounded-full bg-rose-500" aria-hidden="true" />
                Market intelligence
                <span className="opacity-50" aria-hidden="true">
                  {'//'}
                </span>{' '}
                leaks &amp; regulatory orders
              </div>
              <h2>Unconfirmed negotiations, leaked deals &amp; grid disputes</h2>
            </div>
            <Link href="/deals?evidenceLevel=disputed" className="link-ledger text-rose-700 hover:text-rose-900">
              <span>View all regulatory &amp; intelligence items</span>
              <ArrowRight aria-hidden="true" className="h-3 w-3" />
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <IntelCard
              href="/deals/ferc-rejection-talen-energy-aws-susquehanna-nuclear-colocation-isa"
              pill="pill-rose"
              pillLabel="FERC order"
              meta="Docket ER24-2172"
              title="FERC Rejection of Talen / AWS Susquehanna 480 MW Colocation"
              hoverClass="group-hover:text-rose-700"
              cardClass="border-rose-200 hover:border-rose-400"
              body="Federal Energy Regulatory Commission 2-1 decision denying PJM Interconnection amendment, forcing behind-the-meter colocation restructuring."
            />
            <IntelCard
              href="/deals/softbank-project-izanagi-100-billion-ai-chip-venture"
              pill="pill-violet"
              pillLabel="Project Izanagi"
              meta="$100B est."
              title="SoftBank $100B AI Semiconductor Venture"
              hoverClass="group-hover:text-violet-700"
              body="Masayoshi Son seeking $30B from SoftBank and $70B from Middle Eastern sovereign funds to rival NVIDIA using Arm architecture."
            />
            <IntelCard
              href="/deals/saudi-arabia-pif-a16z-40-billion-ai-fund-negotiations"
              pill="pill-amber"
              pillLabel="Transcendence"
              meta="$40B target"
              title="Saudi PIF &amp; a16z $40B AI Mega-Fund"
              hoverClass="group-hover:text-amber-700"
              body="Bilateral negotiations to create a $40 billion global artificial intelligence fund for chip manufacturing and gigawatt data centers."
            />
            <IntelCard
              href="/deals/bytedance-oracle-cloud-infrastructure-gpu-leasing"
              pill="pill-sky"
              pillLabel="Offshore lease"
              meta="$2.0B+ est."
              title="ByteDance Offshore GPU Procurement via OCI"
              hoverClass="group-hover:text-sky-700"
              body="Procuring tens of thousands of NVIDIA H100 GPUs via Oracle Cloud Infrastructure to comply with US semiconductor export constraints."
            />
          </div>
        </section>

        {/* Ledger table */}
        <section className="space-y-4">
          <div className="section-head">
            <div>
              <div className="eyebrow eyebrow-mint">Verified ledger</div>
              <h2>Recent disclosed transactions</h2>
            </div>
            <Link href="/deals" className="link-ledger-strong">
              <span>Open searchable deal ledger ({latestDeals.length})</span>
              <ArrowRight aria-hidden="true" className="h-3 w-3" />
            </Link>
          </div>

          <div className="panel p-4 sm:p-5">
            <DateHistogram deals={latestDeals} title="Deal flow per quarter" />
          </div>

          <DealTable deals={latestDeals} />
        </section>

        {/* Counterparty matrix */}
        <section className="space-y-6">
          <div className="section-head">
            <div>
              <div className="eyebrow">Entity directory</div>
              <h2>Ecosystem participants</h2>
            </div>
            <Link href="/companies" className="link-ledger">
              <span>View all entities ({companies.length})</span>
              <ArrowRight aria-hidden="true" className="h-3 w-3" />
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {companies.slice(0, 16).map((company) => (
              <Link
                key={company.id}
                href={`/companies/${company.slug}`}
                className="panel-interactive group flex flex-col justify-between p-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2 font-mono text-[10px]">
                    <span className="pill pill-neutral">{company.company_type.replace(/_/g, ' ')}</span>
                    {company.ticker ? (
                      <span className="pill pill-neutral num text-zinc-900">${company.ticker}</span>
                    ) : (
                      <span className="text-zinc-500">Private</span>
                    )}
                  </div>
                  <h3 className="text-sm font-bold text-zinc-950 transition-colors group-hover:text-emerald-800">
                    {company.name}
                  </h3>
                  <p className="line-clamp-2 text-xs leading-relaxed text-zinc-500">{company.description}</p>
                </div>

                <div className="mt-4 flex items-center justify-between gap-2 border-t border-zinc-100 pt-3">
                  <span className="micro-label">{company.headquarters_country || 'Global'}</span>
                  <span className="font-mono text-[11px] font-semibold text-zinc-700 transition-colors group-hover:text-emerald-800">
                    Profile &rarr;
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Integrity guarantee */}
        <section>
          <div className="terminal-panel terminal-ring relative space-y-6 overflow-hidden p-8 text-zinc-100 sm:p-10">
            <div className="pointer-events-none absolute -right-10 -top-20 h-72 w-72 rounded-full bg-emerald-500/15 blur-[90px]" aria-hidden="true" />
            <div className="relative flex items-center gap-2">
              <ShieldCheck aria-hidden="true" className="h-5 w-5 text-emerald-400" />
              <span className="micro-label-terminal tracking-wider">
                Audit integrity standard
              </span>
            </div>

            <div className="relative max-w-3xl space-y-3">
              <h2 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
                Zero fabricated deal amounts. Zero uncorroborated social speculation.
              </h2>
              <p className="text-xs leading-relaxed text-zinc-400 sm:text-sm">
                Unlike generic news scrapers and speculative blogs, AICapitalTracker treats financial records
                with statutory rigor. If a deal term is undisclosed by the parties, we record it as{' '}
                <em>Not Disclosed</em>. We never invent implied valuations or present analyst gossip as
                verified cash flows.
              </p>
            </div>

            <div className="relative grid grid-cols-1 gap-4 border-t border-white/10 pt-6 text-xs sm:grid-cols-3">
              {[
                {
                  title: 'SEC EDGAR first',
                  body: 'Official Form 10-K, 10-Q, 8-K filings anchor every corporate disclosure.',
                },
                {
                  title: 'Primary citations',
                  body: 'Every deal requires a persistent public URL and publication timestamp.',
                },
                {
                  title: 'Audit logs',
                  body: 'Transparent editorial review process with documented dispute tracking.',
                },
              ].map((item) => (
                <div key={item.title} className="terminal-card flex items-start gap-2.5 p-3.5">
                  <CheckCircle2 aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                  <div>
                    <strong className="block font-mono text-[11px] font-semibold text-white">{item.title}</strong>
                    <span className="text-[11px] leading-relaxed text-zinc-400">{item.body}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

/** One taxonomy card in the capital-allocation blueprint grid. */
function TaxonomyCard({
  icon: Icon,
  iconTone,
  pill,
  pillLabel,
  title,
  body,
  benchmark,
  href,
  cta,
  ctaClass = 'text-zinc-900',
}: {
  icon: typeof Coins;
  iconTone: string;
  pill: string;
  pillLabel: string;
  title: string;
  body: string;
  benchmark: string;
  href: string;
  cta: string;
  ctaClass?: string;
}) {
  return (
    <div className="panel-interactive flex flex-col justify-between space-y-4 p-5">
      <div className="space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <span className={`icon-tile ${iconTone}`} aria-hidden="true">
            <Icon className="h-4 w-4" />
          </span>
          <span className={`pill ${pill}`}>{pillLabel}</span>
        </div>
        <h3 className="text-sm font-bold text-zinc-950">{title}</h3>
        <p className="text-xs leading-relaxed text-zinc-500">{body}</p>
      </div>
      <div className="flex items-center justify-between border-t border-zinc-100 pt-3 font-mono text-[11px]">
        <span className="text-zinc-500">Benchmark: {benchmark}</span>
        <Link
          href={href}
          className={`rounded font-semibold underline-offset-2 transition-colors hover:underline hover:text-emerald-800 ${ctaClass}`}
        >
          {cta}
        </Link>
      </div>
    </div>
  );
}

/** One market-intelligence card in the leaks / regulatory marquee. */
function IntelCard({
  href,
  pill,
  pillLabel,
  meta,
  title,
  body,
  hoverClass = 'group-hover:text-emerald-800',
  cardClass = 'hover:border-zinc-400',
}: {
  href: string;
  pill: string;
  pillLabel: string;
  meta: string;
  title: string;
  body: string;
  hoverClass?: string;
  cardClass?: string;
}) {
  return (
    <Link href={href} className={`panel-interactive group space-y-2 p-4 ${cardClass}`}>
      <div className="flex items-center justify-between gap-2 font-mono text-[10px]">
        <span className={`pill ${pill}`}>{pillLabel}</span>
        <span className="text-zinc-500">{meta}</span>
      </div>
      <h4 className={`text-xs font-bold text-zinc-950 transition-colors ${hoverClass}`}>{title}</h4>
      <p className="line-clamp-3 text-[11px] leading-normal text-zinc-500">{body}</p>
    </Link>
  );
}
