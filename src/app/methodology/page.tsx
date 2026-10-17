import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { ShieldCheck, Scale } from 'lucide-react';
import { DataRepository } from '../../lib/data/db';
import { PipelineFlow, EvidenceDonut } from '../../components/charts/PipelineFlow';

export const metadata: Metadata = {
  title: 'Methodology & Evidence Standards — AI Capital Tracker',
  description:
    'Our rigorous research methodology, evidence hierarchy, inclusion criteria, and corrections policy for AI infrastructure financing.',
};

const EVIDENCE_ORDER = [
  { level: 'confirmed_primary', color: '#059669' },
  { level: 'reported_secondary', color: '#0284c7' },
  { level: 'announced_not_completed', color: '#d97706' },
  { level: 'estimated', color: '#7c3aed' },
  { level: 'disputed', color: '#e11d48' },
  { level: 'superseded', color: '#a1a1aa' },
] as const;

/** One immutable evidence tier. */
function TierCard({
  level,
  dot,
  border,
  bg,
  heading,
  body,
  note,
}: {
  level: string;
  dot: string;
  border: string;
  bg: string;
  heading: string;
  body: string;
  note?: string;
}) {
  return (
    <div className={`rounded-panel border p-4 ${border} ${bg}`}>
      <div className={`flex items-center gap-2 font-mono text-xs font-bold ${heading}`}>
        <span className={`h-2 w-2 rounded-full ${dot}`} aria-hidden="true" />
        <span>{level}</span>
        {note && <span className="text-[10px] font-normal opacity-80">{note}</span>}
      </div>
      <p className={`mt-1.5 text-xs leading-relaxed opacity-90 ${heading}`}>{body}</p>
    </div>
  );
}

export default async function MethodologyPage() {
  const deals = await DataRepository.getDeals();
  const evidenceData = EVIDENCE_ORDER.map(({ level, color }) => ({
    label: level,
    value: deals.filter((d) => d.evidence_level === level).length,
    color,
  }));

  return (
    <div className="pb-16">
      {/* Terminal hero */}
      <section className="hero-terminal">
        <div className="relative mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-14 lg:px-8">
          <p className="eyebrow-terminal text-emerald-300">
            <ShieldCheck aria-hidden="true" className="h-3.5 w-3.5" />
            <span>Research methodology</span>
          </p>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-white sm:text-4xl">
            Evidence standards &amp; editorial methodology
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-zinc-400">
            How AICapitalTracker audits, verifies, and indexes AI infrastructure capital flows with statutory
            rigor.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-4xl space-y-10 px-4 pt-12 sm:px-6 lg:px-8">
        {/* Foundational principle */}
        <div className="terminal-panel space-y-3 p-6 sm:p-7">
          <div className="flex items-center gap-2">
            <Scale aria-hidden="true" className="h-4 w-4 text-emerald-400" />
            <span className="eyebrow-terminal text-zinc-400">Foundational integrity principle</span>
          </div>
          <h2 className="text-lg font-bold text-white sm:text-xl">
            Clear semantic boundaries between equity, debt, and cloud credits
          </h2>
          <p className="text-xs leading-relaxed text-zinc-300 sm:text-sm">
            The financial press and social media frequently conflate cloud consumption commitments with cash
            equity investments, or equate non-binding letters of intent with closed project finance.
            AICapitalTracker enforces strict semantic boundaries: we never label an agreement an investment,
            loan, or power purchase agreement unless the underlying legal filing or official disclosure
            explicitly substantiates that structure.
          </p>
        </div>

        {/* Publication pipeline */}
        <section className="panel space-y-4 p-6">
          <div>
            <div className="eyebrow eyebrow-mint">Publication pipeline</div>
            <h2 className="mt-1 text-xl font-bold tracking-tight text-zinc-950">
              From filing to ledger
            </h2>
            <p className="mt-1 text-xs text-zinc-500">
              Nothing reaches the ledger automatically &mdash; every record passes six gates, from machine
              ingest to human sign-off to public audit.
            </p>
          </div>
          <PipelineFlow />
        </section>

        {/* Evidence hierarchy */}
        <section className="space-y-4">
          <div>
            <div className="eyebrow eyebrow-mint">01 / Classification</div>
            <h2 className="mt-1 text-xl font-bold tracking-tight text-zinc-950">
              Six-tier evidence classification
            </h2>
            <p className="mt-1 text-xs text-zinc-500">
              Every deal and counterparty link in our ledger is assigned one of six immutable evidence levels:
            </p>
          </div>

          <div className="panel space-y-3 p-5">
            <h3 className="panel-title">Live evidence distribution &mdash; {deals.length} verified deals</h3>
            <EvidenceDonut data={evidenceData} totalLabel="verified deals" />
            <p className="font-mono text-[11px] text-zinc-500">
              Computed live from the ledger database &mdash; never hand-drawn.
            </p>
          </div>

          <div className="space-y-3">
            <TierCard
              level="confirmed_primary"
              note="(Highest standard)"
              dot="bg-emerald-600"
              border="border-emerald-300/80"
              bg="bg-emerald-50/40"
              heading="text-emerald-950"
              body="Verified directly against statutory regulatory filings (such as SEC Form 10-K, 10-Q, 8-K), government public registers, or official company investor relations announcements signed by executive officers."
            />
            <TierCard
              level="reported_secondary"
              dot="bg-sky-600"
              border="border-sky-300/80"
              bg="bg-sky-50/40"
              heading="text-sky-950"
              body="Reported by recognized financial news organizations (Reuters, Bloomberg, The Wall Street Journal, Financial Times) citing participating lenders, syndicate documents, or term sheets where public statutory filings are not yet available."
            />
            <TierCard
              level="announced_not_completed"
              dot="bg-amber-500"
              border="border-amber-300/80"
              bg="bg-amber-50/40"
              heading="text-amber-950"
              body="Publicly proposed term sheets, non-binding memorandums of understanding, or regulatory filings subject to governmental or shareholder approvals."
            />
            <TierCard
              level="estimated"
              dot="bg-violet-500"
              border="border-violet-300/80"
              bg="bg-violet-50/40"
              heading="text-violet-950"
              body="Research estimates or industry benchmark valuations. Estimated amounts are explicitly isolated from confirmed cash totals."
            />
            <TierCard
              level="disputed"
              dot="bg-rose-500"
              border="border-rose-300/80"
              bg="bg-rose-50/40"
              heading="text-rose-950"
              body="Transactions where participating parties provide conflicting representations regarding deal size, scope, or closing status."
            />
            <TierCard
              level="superseded"
              dot="bg-zinc-400"
              border="border-zinc-300/80"
              bg="bg-zinc-100/40"
              heading="text-zinc-800"
              body="Records replaced or amended by a subsequent debt extension, refinancing, or financing restructuring. Prior terms are preserved for audit trail but no longer reflect the active agreement."
            />
          </div>
        </section>

        {/* Inclusion criteria */}
        <section id="inclusion" className="space-y-4 border-t border-zinc-200 pt-8">
          <div className="eyebrow eyebrow-mint">02 / Inclusion</div>
          <h2 className="text-xl font-bold tracking-tight text-zinc-950">Inclusion criteria &amp; anti-slop rules</h2>
          <div className="prose-ledger space-y-3">
            <p>To be published in AICapitalTracker, a transaction must satisfy all of the following rules:</p>
            <ul className="list-disc space-y-2 pl-5">
              <li>
                <strong>Direct infrastructure materiality:</strong> Directly involves artificial intelligence
                model development, AI silicon / accelerators (GPUs, TPUs, ASICs), high-density data centers, or
                dedicated energy off-take contracts.
              </li>
              <li>
                <strong>Mandatory source citation:</strong> Accompanied by at least one persistent public
                citation URL with documented publisher and publication timestamp.
              </li>
              <li>
                <strong>Identified legal counterparties:</strong> Must specify at least two legal entities
                with unambiguous roles (e.g., borrower/lender, investor/investee, supplier/customer).
              </li>
              <li>
                <strong>Zero fabricated valuations:</strong> If financial compensation was not disclosed by the
                parties, the transaction is published with the amount marked as <em>Not Disclosed</em>. We
                never invent figures to fill database fields.
              </li>
            </ul>
          </div>
        </section>

        {/* Source architecture */}
        <section className="space-y-4 border-t border-zinc-200 pt-8">
          <div className="eyebrow eyebrow-mint">03 / Ingestion</div>
          <h2 className="text-xl font-bold tracking-tight text-zinc-950">Public data source ingestion</h2>
          <div className="prose-ledger space-y-2">
            <p>
              In accordance with our mission of open and verifiable research, AICapitalTracker relies on
              authoritative public endpoints:
            </p>
            <ul className="list-disc space-y-1 pl-5">
              <li>
                <strong>SEC EDGAR:</strong> Machine-readable JSON submissions from public issuers, accessed
                under fair-access rate limits with a descriptive User-Agent.
              </li>
              <li>
                <strong>Federal Reserve (FRED):</strong> Free macro interest rate context and credit spread
                references.
              </li>
              <li>
                <strong>U.S. Energy Information Administration (EIA):</strong> Open grid and regional power
                generation statistics.
              </li>
              <li>
                <strong>Company Newsrooms:</strong> Direct public press releases and investor relations archives.
              </li>
            </ul>
          </div>
        </section>

        {/* Corrections */}
        <section className="space-y-4 border-t border-zinc-200 pt-8">
          <div className="eyebrow eyebrow-mint">04 / Audit</div>
          <h2 className="text-xl font-bold tracking-tight text-zinc-950">Corrections &amp; audit process</h2>
          <p className="prose-ledger">
            If a transaction is amended, terminated, or contested, our editorial desk updates the record,
            adjusts the evidence level, and maintains a public audit log. You can submit corrections or document
            links to our review desk at{' '}
            <Link href="/corrections" className="link-ledger-strong">
              corrections &amp; disputes
            </Link>
            .
          </p>
        </section>
      </div>
    </div>
  );
}