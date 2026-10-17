import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import {
  ShieldCheck,
  ArrowRight,
  Building2,
  Zap,
  Coins,
  Globe2,
  Layers,
  FileCheck2,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'About the Editorial Desk & Supercycle Ledger — AI Capital Tracker',
  description:
    'Institutional research database tracking debt, equity, gigawatt energy contracts, and sovereign compute in artificial intelligence.',
};

/** One "capital vector" pillar card. */
function PillarCard({
  icon: Icon,
  tone,
  title,
  body,
  representative,
}: {
  icon: typeof Coins;
  tone: 'amber' | 'sky' | 'mint' | 'violet';
  title: string;
  body: string;
  representative: string;
}) {
  const toneClass = {
    amber: 'border-amber-500/20 bg-amber-500/10 text-amber-700',
    sky: 'border-sky-500/20 bg-sky-500/10 text-sky-700',
    mint: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-700',
    violet: 'border-violet-500/20 bg-violet-500/10 text-violet-700',
  }[tone];
  const textClass = {
    amber: 'text-amber-800',
    sky: 'text-sky-800',
    mint: 'text-emerald-800',
    violet: 'text-violet-800',
  }[tone];

  return (
    <div className="panel-interactive space-y-3 p-5">
      <div className={`flex items-center gap-2 font-mono text-xs font-bold uppercase ${textClass}`}>
        <span className={`flex h-7 w-7 items-center justify-center rounded-lg ring-1 ring-inset ${toneClass}`} aria-hidden="true">
          <Icon className="h-4 w-4" />
        </span>
        <span>{title}</span>
      </div>
      <p className="text-xs leading-relaxed text-zinc-600">{body}</p>
      <div className="border-t border-zinc-100 pt-2 font-mono text-[11px] text-zinc-500">
        Representative: {representative}
      </div>
    </div>
  );
}

export default function AboutPage() {
  return (
    <div className="pb-16">
      {/* Editorial masthead */}
      <section className="hero-terminal">
        <div className="relative mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
          <p className="eyebrow-terminal text-emerald-300">
            <Building2 aria-hidden="true" className="h-3.5 w-3.5" />
            <span>Institutional editorial desk &amp; financial archive</span>
          </p>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-white sm:text-4xl lg:text-5xl">
            About AI Capital Tracker
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-zinc-400 sm:text-base">
            Bringing statutory financial transparency, audited balance-sheet verification, and forensic
            capital tracking to the 2023&ndash;2026 artificial intelligence infrastructure supercycle.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-5xl space-y-12 px-4 pt-12 sm:px-6 lg:px-8">
        {/* Mission & thesis */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="space-y-5 text-sm leading-relaxed text-zinc-700 md:col-span-2">
            <h2 className="text-2xl font-bold tracking-tight text-zinc-950">
              The multi-trillion-dollar physical bottleneck
            </h2>
            <p>
              Between 2023 and 2026, artificial intelligence transitioned from an algorithmic software race
              into the largest physical capital-expenditure deployment in modern financial history. The frontier
              of model capabilities is no longer gated primarily by model architecture, but by physical assets:
              high-density accelerated compute (NVIDIA H100, Blackwell B200, GB200 clusters), multi-hundred-
              megawatt substation interconnects, behind-the-meter nuclear reactors, and specialized
              high-performance data centers.
            </p>
            <p>
              Financing this unprecedented infrastructure buildout has generated novel, highly complex
              transaction structures: GPU-collateralized delayed-draw credit facilities, circular vendor-cloud
              commitments, hyperscaler strategic minority stakes, sovereign AI fund partnerships, and 20-year
              off-take agreements restarting decommissioned commercial nuclear power stations.
            </p>
            <p>
              <strong className="font-semibold text-zinc-950">AICapitalTracker.com</strong> was founded to
              serve as the definitive, source-backed public financial ledger of record for this
              transformation. We cut through press-release hyperbole, anonymous social rumors, and conflated
              non-cash cloud credit announcements to deliver verified, statutory intelligence.
            </p>
          </div>

          <div className="panel flex flex-col justify-between p-6">
            <div className="space-y-3">
              <div className="eyebrow">
                <ShieldCheck aria-hidden="true" className="h-4 w-4 text-emerald-600" />
                <span>Core mandate</span>
              </div>
              <p className="text-xs leading-relaxed text-zinc-600">
                Every figure in our database must withstand institutional due diligence. We require statutory SEC
                filings (10-K, 10-Q, 8-K), regulatory commission orders (FERC), or verified primary corporate
                executed agreements.
              </p>
            </div>
            <dl className="space-y-2 border-t border-zinc-100 pt-4 font-mono text-xs">
              <div className="flex justify-between gap-3 text-zinc-500">
                <dt>Database launch</dt>
                <dd className="num font-bold text-zinc-950">2024</dd>
              </div>
              <div className="flex justify-between gap-3 text-zinc-500">
                <dt>Coverage horizon</dt>
                <dd className="num font-bold text-zinc-950">2023 &ndash; 2026</dd>
              </div>
              <div className="flex justify-between gap-3 text-zinc-500">
                <dt>Audit standard</dt>
                <dd className="num font-bold text-emerald-700">Statutory / 6-tier</dd>
              </div>
            </dl>
          </div>
        </div>

        {/* Four capital vectors */}
        <section className="space-y-5">
          <div>
            <div className="eyebrow">Taxonomic scope</div>
            <h2 className="mt-1 text-2xl font-bold tracking-tight text-zinc-950">
              Four interconnected capital vectors
            </h2>
            <p className="mt-1 text-xs text-zinc-500 sm:text-sm">
              We systematically categorize transactions across the four pillars sustaining modern compute:
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <PillarCard
              icon={Coins}
              tone="amber"
              title="1. Private credit & GPU asset-backed debt"
              body="Tracking non-dilutive delayed-draw term loans (DDTL) where physical NVIDIA GPU silicon and long-term enterprise compute leases are pledged as direct collateral to private credit syndicates led by Blackstone, Magnetar, Blue Owl, and Coatue."
              representative="CoreWeave $8.5B DDTL 4.0, Crusoe $225M Upper90 Facility"
            />
            <PillarCard
              icon={Layers}
              tone="sky"
              title="2. Hyperscaler equity & foundation model stakes"
              body="Monitoring multi-billion-dollar strategic equity injections from Microsoft, Amazon, Google, and NVIDIA into OpenAI, Anthropic, Mistral AI, and xAI, with strict separation between cash equity, debt conversion, and cloud consumption commitments."
              representative="Anthropic $13B Series F, OpenAI $10B SoftBank Tranche"
            />
            <PillarCard
              icon={Zap}
              tone="mint"
              title="3. Baseload nuclear & clean energy off-take PPAs"
              body="Cataloging 15-to-20-year power purchase agreements, small modular reactor (SMR) development prepayments, and commercial nuclear reactor restarts providing dedicated, zero-carbon gigawatt-scale capacity directly to hyperscale campuses."
              representative="Constellation-Microsoft Crane Center (835 MW), Duane Arnold Restart (615 MW)"
            />
            <PillarCard
              icon={Globe2}
              tone="violet"
              title="4. Sovereign compute & hyperscale real estate"
              body="Auditing sovereign AI infrastructure mega-initiatives across the Middle East, Europe, and Asia (UAE MGX, Saudi PIF / Alat, UK Sovereign Compute, French AI compute) and institutional data center joint ventures and asset-backed securitizations (Blackstone AirTrunk A$24B, QTS $25B)."
              representative="Project Stargate $500B JV, SoftBank Project Izanagi $100B, STACK $4.0B Green ABS"
            />
          </div>
        </section>

        {/* Editorial standards */}
        <section className="terminal-panel space-y-5 p-6 sm:p-8">
          <div className="micro-label-terminal gap-2 tracking-wider text-emerald-400">
            <FileCheck2 aria-hidden="true" className="h-4 w-4" />
            <span>The zero-slop institutional standard</span>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
            How we differentiate from aggregator bots
          </h2>
          <div className="grid grid-cols-1 gap-6 text-xs leading-relaxed text-zinc-300 sm:text-sm">
            <div className="space-y-2">
              <h3 className="text-base font-bold text-white">Zero unverified AI hallucinations</h3>
              <p>
                We do not scrape speculative social media rumors or generate artificial deal summaries. Every
                transaction undergoes human editorial review and must be mapped to at least one primary
                statutory filing or corroborated journalistic investigation.
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="text-base font-bold text-white">Unambiguous evidence tagging</h3>
              <p>
                If an agreement is non-binding, pending shareholder vote, or disputed by regulators (such as
                FERC&apos;s rejection of the Talen/AWS Susquehanna colocation ISA), it is visibly labeled as{' '}
                <code className="rounded bg-white/10 px-1 py-0.5 font-mono text-amber-300">
                  announced_not_completed
                </code>{' '}
                or{' '}
                <code className="rounded bg-white/10 px-1 py-0.5 font-mono text-rose-300">disputed</code>.
              </p>
            </div>
          </div>
        </section>

        {/* Supercycle trajectory */}
        <section className="space-y-4">
          <div>
            <div className="eyebrow">Historical trajectory</div>
            <h2 className="mt-1 text-2xl font-bold tracking-tight text-zinc-950">
              Key epochs of AI capital deployment
            </h2>
          </div>

          <div className="panel space-y-4 p-4 sm:p-6">
            <svg
              viewBox="0 0 640 300"
              className="h-auto w-full"
              role="img"
              aria-label="Supercycle trajectory 2023 to 2026: Microsoft 10 billion dollars to OpenAI in early 2023, CoreWeave 2.3 billion dollar GPU loan in 2023, Blackstone AirTrunk 24 billion Australian dollars in 2024, Project Stargate 500 billion dollar proposal in 2025, Anthropic 13 billion dollar Series F in 2025, CoreWeave 8.5 billion dollar facility in March 2026."
            >
              {/* axes */}
              <line x1="40" y1="250" x2="610" y2="250" stroke="#e4e4e7" strokeWidth="1" />
              {['2023', '2024', '2025', '2026'].map((y, i) => (
                <text
                  key={y}
                  x={40 + i * 190}
                  y="268"
                  fontSize="11"
                  fill="#a1a1aa"
                  fontFamily="monospace"
                  textAnchor="middle"
                >
                  {y}
                </text>
              ))}
              <text x="40" y="20" fontSize="10" fill="#a1a1aa" fontFamily="monospace">
                SELECTED DISCLOSED MILESTONES · $ SIZE (SQRT SCALE) · STARGATE CAPPED / PROPOSED
              </text>
              {/* supercycle curve through milestones, chronological */}
              <polyline
                points="40,155 136,194 307,136 360,40 467,144 552,161"
                fill="none"
                stroke="#059669"
                strokeWidth="2.5"
                strokeLinejoin="round"
                strokeLinecap="round"
              />
              {/* milestone dots + labels */}
              <g fontFamily="monospace">
                <circle cx="40" cy="155" r="6" fill="#2563eb" stroke="#fff" strokeWidth="2" />
                <text x="40" y="135" fontSize="10" fill="#18181b" fontWeight="bold" textAnchor="middle">
                  MSFT → OpenAI $10B
                </text>
                <text x="40" y="148" fontSize="9" fill="#71717a" textAnchor="middle">
                  Jan 2023
                </text>

                <circle cx="136" cy="194" r="6" fill="#d97706" stroke="#fff" strokeWidth="2" />
                <text x="136" y="216" fontSize="10" fill="#18181b" fontWeight="bold" textAnchor="middle">
                  CoreWeave $2.3B GPU loan
                </text>
                <text x="136" y="229" fontSize="9" fill="#71717a" textAnchor="middle">
                  2023
                </text>

                <circle cx="307" cy="136" r="6" fill="#4f46e5" stroke="#fff" strokeWidth="2" />
                <text x="307" y="116" fontSize="10" fill="#18181b" fontWeight="bold" textAnchor="middle">
                  AirTrunk A$24B
                </text>
                <text x="307" y="129" fontSize="9" fill="#71717a" textAnchor="middle">
                  Sep 2024
                </text>

                <circle cx="360" cy="40" r="6" fill="none" stroke="#d97706" strokeWidth="2" strokeDasharray="3 2" />
                <text x="360" y="22" fontSize="10" fill="#18181b" fontWeight="bold" textAnchor="middle">
                  Stargate $500B*
                </text>

                <circle cx="467" cy="144" r="6" fill="#2563eb" stroke="#fff" strokeWidth="2" />
                <text x="467" y="124" fontSize="10" fill="#18181b" fontWeight="bold" textAnchor="middle">
                  Anthropic $13B Series F
                </text>
                <text x="467" y="137" fontSize="9" fill="#71717a" textAnchor="middle">
                  2025
                </text>

                <circle cx="552" cy="161" r="7" fill="#059669" stroke="#fff" strokeWidth="2" />
                <text x="552" y="141" fontSize="10" fill="#18181b" fontWeight="bold" textAnchor="middle">
                  CoreWeave $8.5B DDTL 4.0
                </text>
                <text x="552" y="154" fontSize="9" fill="#71717a" textAnchor="middle">
                  Mar 2026 · latest verified
                </text>
              </g>
            </svg>
            <div className="grid grid-cols-1 gap-3 border-t border-zinc-100 pt-4 text-xs sm:grid-cols-3">
              <div className="space-y-1">
                <h4 className="font-mono text-xs font-bold text-zinc-950">
                  2023 — FOUNDATION EQUITY + FIRST GPU DEBT
                </h4>
                <p className="text-[11px] leading-relaxed text-zinc-600">
                  Microsoft $10B OpenAI; Amazon up to $4B Anthropic; CoreWeave $2.3B GPU-collateralized loan sets
                  the collateral template.
                </p>
              </div>
              <div className="space-y-1">
                <h4 className="font-mono text-xs font-bold text-zinc-950">
                  2024 — SOVEREIGN FUNDS + GIGAWATT CAMPUSES
                </h4>
                <p className="text-[11px] leading-relaxed text-zinc-600">
                  Saudi PIF / UAE MGX AI funds; Blackstone A$24B AirTrunk; Crusoe&ndash;Lancium $15B 1.2 GW Texas
                  campus.
                </p>
              </div>
              <div className="space-y-1">
                <h4 className="font-mono text-xs font-bold text-zinc-950">
                  2025&ndash;2026 — NUCLEAR + STARGATE + FRICTION
                </h4>
                <p className="text-[11px] leading-relaxed text-zinc-600">
                  Crane / Duane Arnold restarts; *Stargate $500B proposed (announced_not_completed); FERC
                  ER24-2172 rejection; CoreWeave $8.5B closes Mar 2026.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <div className="panel flex flex-col justify-between gap-4 p-6 sm:flex-row sm:items-center">
          <div className="space-y-1">
            <div className="text-sm font-bold text-zinc-950">Explore the underlying research data</div>
            <p className="text-xs text-zinc-500">
              Inspect our comprehensive methodology or query the full 59+ transaction database.
            </p>
          </div>
          <div className="flex shrink-0 gap-2.5">
            <Link href="/methodology" className="btn btn-outline">
              Methodology
            </Link>
            <Link href="/deals" className="btn btn-primary">
              <span>Query Ledger</span>
              <ArrowRight aria-hidden="true" className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}