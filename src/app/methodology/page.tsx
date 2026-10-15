import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { ShieldCheck, CheckCircle2, AlertTriangle, Scale, FileText } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Methodology & Evidence Standards — AI Capital Tracker',
  description:
    'Our rigorous research methodology, evidence hierarchy, inclusion criteria, and corrections policy for AI infrastructure financing.',
};

export default function MethodologyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      {/* Masthead */}
      <div className="border-b border-zinc-200 pb-5">
        <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-wider text-zinc-500 font-bold">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>RESEARCH METHODOLOGY</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-zinc-950 tracking-tight mt-1">
          Evidence Standards & Editorial Methodology
        </h1>
        <p className="text-sm text-zinc-500 mt-2">
          How AICapitalTracker audits, verifies, and indexes AI infrastructure capital flows with statutory rigor.
        </p>
      </div>

      {/* Manifesto Callout */}
      <div className="p-6 bg-zinc-950 text-white rounded-lg space-y-3">
        <div className="flex items-center gap-2">
          <Scale className="w-4 h-4 text-emerald-400" />
          <span className="font-mono text-xs uppercase tracking-wider text-zinc-400 font-bold">
            FOUNDATIONAL INTEGRITY PRINCIPLE
          </span>
        </div>
        <h2 className="text-lg sm:text-xl font-bold text-white">
          Clear Semantic Boundaries Between Equity, Debt, and Cloud Credits
        </h2>
        <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
          The financial press and social media frequently conflate cloud consumption commitments with cash equity investments, or equate non-binding letters of intent with closed project finance. AICapitalTracker enforces strict semantic boundaries: we never label an agreement an investment, loan, or power purchase agreement unless the underlying legal filing or official disclosure explicitly substantiates that structure.
        </p>
      </div>

      {/* Evidence Hierarchy */}
      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-bold text-zinc-950 tracking-tight">1. Six-Tier Evidence Classification</h2>
          <p className="text-xs text-zinc-500 mt-1">
            Every deal and counterparty link in our ledger is assigned one of six immutable evidence levels:
          </p>
        </div>

        <div className="space-y-3">
          <div className="p-4 border border-emerald-300/80 bg-emerald-50/40 rounded-lg">
            <div className="flex items-center gap-2 font-mono text-xs font-bold text-emerald-950">
              <span className="w-2 h-2 rounded-full bg-emerald-600" />
              <span>confirmed_primary</span>
              <span className="text-[10px] font-normal text-emerald-700">(Highest Standard)</span>
            </div>
            <p className="text-xs text-emerald-900 mt-1.5 leading-relaxed">
              Verified directly against statutory regulatory filings (such as SEC Form 10-K, 10-Q, 8-K), government public registers, or official company investor relations announcements signed by executive officers.
            </p>
          </div>

          <div className="p-4 border border-sky-300/80 bg-sky-50/40 rounded-lg">
            <div className="flex items-center gap-2 font-mono text-xs font-bold text-sky-950">
              <span className="w-2 h-2 rounded-full bg-sky-600" />
              <span>reported_secondary</span>
            </div>
            <p className="text-xs text-sky-900 mt-1.5 leading-relaxed">
              Reported by recognized financial news organizations (Reuters, Bloomberg, The Wall Street Journal, Financial Times) citing participating lenders, syndicate documents, or term sheets where public statutory filings are not yet available.
            </p>
          </div>

          <div className="p-4 border border-amber-300/80 bg-amber-50/40 rounded-lg">
            <div className="flex items-center gap-2 font-mono text-xs font-bold text-amber-950">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span>announced_not_completed</span>
            </div>
            <p className="text-xs text-amber-900 mt-1.5 leading-relaxed">
              Publicly proposed term sheets, non-binding memorandums of understanding, or regulatory filings subject to governmental or shareholder approvals.
            </p>
          </div>

          <div className="p-4 border border-purple-300/80 bg-purple-50/40 rounded-lg">
            <div className="flex items-center gap-2 font-mono text-xs font-bold text-purple-950">
              <span className="w-2 h-2 rounded-full bg-purple-500" />
              <span>estimated</span>
            </div>
            <p className="text-xs text-purple-900 mt-1.5 leading-relaxed">
              Research estimates or industry benchmark valuations. Estimated amounts are explicitly isolated from confirmed cash totals.
            </p>
          </div>

          <div className="p-4 border border-rose-300/80 bg-rose-50/40 rounded-lg">
            <div className="flex items-center gap-2 font-mono text-xs font-bold text-rose-950">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              <span>disputed</span>
            </div>
            <p className="text-xs text-rose-900 mt-1.5 leading-relaxed">
              Transactions where participating parties provide conflicting representations regarding deal size, scope, or closing status.
            </p>
          </div>
        </div>
      </section>

      {/* Inclusion Criteria */}
      <section id="inclusion" className="space-y-4 pt-4 border-t border-zinc-200">
        <h2 className="text-xl font-bold text-zinc-950 tracking-tight">2. Inclusion Criteria & Anti-Slop Rules</h2>
        <div className="text-xs sm:text-sm text-zinc-600 space-y-3 leading-relaxed">
          <p>
            To be published in AICapitalTracker, a transaction must satisfy all of the following rules:
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong>Direct Infrastructure Materiality:</strong> Directly involves artificial intelligence model development, AI silicon / accelerators (GPUs, TPUs, ASICs), high-density data centers, or dedicated energy off-take contracts.
            </li>
            <li>
              <strong>Mandatory Source Citation:</strong> Accompanied by at least one persistent public citation URL with documented publisher and publication timestamp.
            </li>
            <li>
              <strong>Identified Legal Counterparties:</strong> Must specify at least two legal entities with unambiguous roles (e.g., borrower/lender, investor/investee, supplier/customer).
            </li>
            <li>
              <strong>Zero Fabricated Valuations:</strong> If financial compensation was not disclosed by the parties, the transaction is published with the amount marked as <em>Not Disclosed</em>. We never invent figures to fill database fields.
            </li>
          </ul>
        </div>
      </section>

      {/* Free Data Source Architecture */}
      <section className="space-y-4 pt-4 border-t border-zinc-200">
        <h2 className="text-xl font-bold text-zinc-950 tracking-tight">3. Public Data Source Ingestion</h2>
        <div className="text-xs sm:text-sm text-zinc-600 space-y-2 leading-relaxed">
          <p>
            In accordance with our mission of open and verifiable research, AICapitalTracker relies on authoritative public endpoints:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>SEC EDGAR:</strong> Machine-readable JSON submissions from public issuers, accessed under fair-access rate limits with a descriptive User-Agent.</li>
            <li><strong>Federal Reserve (FRED):</strong> Free macro interest rate context and credit spread references.</li>
            <li><strong>U.S. Energy Information Administration (EIA):</strong> Open grid and regional power generation statistics.</li>
            <li><strong>Company Newsrooms:</strong> Direct public press releases and investor relations archives.</li>
          </ul>
        </div>
      </section>

      {/* Corrections Policy */}
      <section className="space-y-4 pt-4 border-t border-zinc-200">
        <h2 className="text-xl font-bold text-zinc-950 tracking-tight">4. Corrections & Audit Process</h2>
        <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed">
          If a transaction is amended, terminated, or contested, our editorial desk updates the record, adjusts the evidence level, and maintains a public audit log. You can submit corrections or document links to our review desk at{' '}
          <Link href="/corrections" className="text-blue-600 underline font-medium">
            Corrections & Disputes
          </Link>.
        </p>
      </section>
    </div>
  );
}
