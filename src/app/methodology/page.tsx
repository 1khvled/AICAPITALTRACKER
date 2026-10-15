import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Methodology & Evidence Standards — AI Capital Tracker',
  description:
    'Our rigorous research methodology, evidence hierarchy, inclusion criteria, and corrections policy for AI infrastructure financing.',
};

export default function MethodologyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight sm:text-4xl">
          Methodology & Evidence Standards
        </h1>
        <p className="text-sm text-slate-500 mt-2">
          How AICapitalTracker curates, verifies, and audits artificial intelligence infrastructure financing.
        </p>
      </div>

      {/* Core Principle */}
      <div className="p-6 bg-slate-900 text-white rounded-lg space-y-3">
        <h2 className="text-lg font-bold text-white">Core Principle: Evidence-First Intelligence</h2>
        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
          The financial press and social media frequently conflate cloud consumption commitments with cash equity investments, or equate non-binding letters of intent with closed project finance. AICapitalTracker enforces strict semantic boundaries: we never label an agreement an investment, loan, or power purchase agreement unless the underlying legal filing or official disclosure explicitly substantiates that structure.
        </p>
      </div>

      {/* Evidence Hierarchy */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-slate-900">1. Evidence Level Classification</h2>
        <p className="text-xs text-slate-600 leading-relaxed">
          Every deal, loan, and relationship in our ledger is tagged with one of six standardized evidence levels:
        </p>

        <div className="space-y-3">
          <div className="p-4 border border-emerald-200 bg-emerald-50/50 rounded-md">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <h3 className="text-sm font-bold text-emerald-950 font-mono">confirmed_primary</h3>
            </div>
            <p className="text-xs text-emerald-800 mt-1 leading-relaxed">
              Verified directly against statutory regulatory filings (such as SEC Form 10-K, 10-Q, 8-K), government public registers, or official company investor relations announcements signed by executive officers.
            </p>
          </div>

          <div className="p-4 border border-blue-200 bg-blue-50/50 rounded-md">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              <h3 className="text-sm font-bold text-blue-950 font-mono">reported_secondary</h3>
            </div>
            <p className="text-xs text-blue-800 mt-1 leading-relaxed">
              Reported by recognized financial news organizations (Reuters, Bloomberg, The Wall Street Journal, Financial Times) citing participating lenders, syndicate documents, or term sheets where public statutory filings are not yet available.
            </p>
          </div>

          <div className="p-4 border border-amber-200 bg-amber-50/50 rounded-md">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <h3 className="text-sm font-bold text-amber-950 font-mono">announced_not_completed</h3>
            </div>
            <p className="text-xs text-amber-800 mt-1 leading-relaxed">
              Publicly proposed term sheets, non-binding memorandums of understanding, or regulatory filings subject to governmental or shareholder approvals.
            </p>
          </div>

          <div className="p-4 border border-purple-200 bg-purple-50/50 rounded-md">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-purple-500" />
              <h3 className="text-sm font-bold text-purple-950 font-mono">estimated</h3>
            </div>
            <p className="text-xs text-purple-800 mt-1 leading-relaxed">
              Research estimates or industry benchmark valuations. Estimated amounts are explicitly isolated from confirmed cash totals.
            </p>
          </div>

          <div className="p-4 border border-rose-200 bg-rose-50/50 rounded-md">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              <h3 className="text-sm font-bold text-rose-950 font-mono">disputed</h3>
            </div>
            <p className="text-xs text-rose-800 mt-1 leading-relaxed">
              Transactions where participating parties provide conflicting representations regarding deal size, scope, or closing status.
            </p>
          </div>
        </div>
      </section>

      {/* Inclusion Criteria */}
      <section id="inclusion" className="space-y-4">
        <h2 className="text-xl font-bold text-slate-900">2. Inclusion Criteria</h2>
        <div className="text-xs sm:text-sm text-slate-600 space-y-2 leading-relaxed">
          <p>
            To be published in AICapitalTracker, a transaction must satisfy all of the following rules:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Relevance:</strong> Directly involves artificial intelligence model development, AI silicon / accelerators (GPUs, TPUs, ASICs), high-density data centers, or dedicated energy off-take contracts.</li>
            <li><strong>Verifiable Citation:</strong> Accompanied by at least one persistent public citation URL with documented publisher and publication timestamp.</li>
            <li><strong>Identified Parties:</strong> Must specify at least two legal entities with unambiguous roles (e.g., borrower/lender, investor/investee, supplier/customer).</li>
            <li><strong>Amount Integrity:</strong> If financial compensation was not disclosed by the parties, the transaction is published with the amount marked as <em>Not Disclosed</em>. We never invent figures to fill database fields.</li>
          </ul>
        </div>
      </section>

      {/* Free Data Source Strategy */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-slate-900">3. Free Data Source Architecture</h2>
        <div className="text-xs sm:text-sm text-slate-600 space-y-3 leading-relaxed">
          <p>
            In accordance with our mission of open and verifiable research, AICapitalTracker relies entirely on free, authoritative public endpoints and primary disclosures:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>SEC EDGAR:</strong> Machine-readable JSON submissions from public issuers, accessed in strict compliance with SEC Fair Access rate limits (10 req/s) with a registered User-Agent.</li>
            <li><strong>Federal Reserve (FRED):</strong> Free macro interest rate context and credit spread references.</li>
            <li><strong>U.S. Energy Information Administration (EIA):</strong> Open grid and regional power generation statistics.</li>
            <li><strong>Company Newsrooms:</strong> Direct public press releases and investor relations archives.</li>
          </ul>
        </div>
      </section>

      {/* Corrections Policy */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-slate-900">4. Editorial Corrections Policy</h2>
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
          If a transaction is amended, terminated, or contested, our editorial desk updates the record, adjusts the evidence level, and maintains a public audit log. You can submit corrections or document links to our review desk at{' '}
          <Link href="/corrections" className="text-brand-600 underline font-medium">
            Corrections & Disputes
          </Link>.
        </p>
      </section>
    </div>
  );
}
