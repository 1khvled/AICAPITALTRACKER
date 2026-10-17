import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { Scale, ShieldAlert } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Terms of Service & Research License — AI Capital Tracker',
  description:
    'Institutional terms of service, acceptable research use, intellectual property, and non-investment advice disclaimers.',
};

/** Shared legal-page section. */
function Section({ n, title, children }: { n: string; title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className="panel-title">
        <span className="text-emerald-700">{n}.</span> {title}
      </h2>
      {children}
    </section>
  );
}

export default function TermsPage() {
  return (
    <div className="pb-16">
      {/* Terminal hero */}
      <section className="hero-terminal">
        <div className="relative mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-14 lg:px-8">
          <p className="eyebrow-terminal text-emerald-300">
            <Scale aria-hidden="true" className="h-3.5 w-3.5" />
            <span>Legal governance &amp; research license</span>
          </p>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-white sm:text-4xl">
            Terms of service &amp; research terms
          </h1>
          <p className="caption-terminal mt-3">
            Effective date: October 2024 (updated for 2026 database expansion).
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-4xl space-y-10 px-4 pt-12 sm:px-6 lg:px-8">
        {/* Statutory disclaimer */}
        <div className="notice notice-amber space-y-3">
          <div className="micro-label flex items-center gap-2 text-amber-900">
            <ShieldAlert aria-hidden="true" className="h-4 w-4 text-amber-600" />
            <span>Critical statutory disclaimer &mdash; not investment advice</span>
          </div>
          <p className="text-xs font-medium leading-relaxed text-amber-900">
            The records, data models, deal ledgers, counterparty maps, and commentary provided on
            AICapitalTracker.com are published solely for journalistic, academic, and informational research
            purposes. Nothing on this platform constitutes financial, legal, credit rating, tax, or investment
            advice.
          </p>
          <p className="text-xs leading-relaxed text-amber-800">
            AICapitalTracker is not a broker-dealer, registered investment advisor, credit rating agency, or
            commodity trading advisor under United States or international securities laws. No data point or
            metric should be construed as an endorsement or solicitation to buy, sell, or hold any security,
            loan, bond, derivative, or compute asset.
          </p>
        </div>

        {/* Sections */}
        <div className="panel space-y-8 p-6 text-xs leading-relaxed text-zinc-700 sm:text-sm sm:p-8">
          <Section n="1" title="Acceptance of terms">
            <p>
              By accessing, browsing, querying, or downloading content from AICapitalTracker.com, you agree to
              be legally bound by these Terms of Service. If you do not agree to these terms, you must
              immediately cease accessing the platform.
            </p>
          </Section>

          <Section n="2" title="Research data integrity &amp; as-is warranty">
            <p>
              While our editorial desk exerts rigorous due diligence to cross-reference every published record
              against statutory filings (SEC EDGAR Forms 10-K, 10-Q, 8-K), government registers (FERC), or
              verified company IR releases, all materials are provided strictly on an &ldquo;as is&rdquo; and
              &ldquo;as available&rdquo; basis.
            </p>
            <p>
              AICapitalTracker expressly disclaims all warranties of any kind, whether express or implied,
              including but not limited to the implied warranties of merchantability, fitness for a particular
              commercial purpose, and non-infringement.
            </p>
          </Section>

          <Section n="3" title="Intellectual property &amp; citation licensing">
            <p>
              The underlying factual data points (dates, disclosed amounts, statutory accession numbers) are
              public facts. However, the proprietary database schema, normalized entity relationships,
              editorial taxonomy, software code, and structured analytical summaries are the intellectual
              property of AICapitalTracker.
            </p>
            <div className="panel-sunken space-y-1.5 p-4 font-mono text-xs">
              <div className="font-bold text-zinc-900">Permitted attribution requirements:</div>
              <p className="text-zinc-600">
                Journalists, academic researchers, and financial analysts are authorized to quote and cite
                ledger records, provided that AICapitalTracker is cited as the source with a direct hyperlink
                to the relevant record page (e.g., &ldquo;Source: AI Capital Tracker,
                aicapitaltracker.com&rdquo;).
              </p>
            </div>
          </Section>

          <Section n="4" title="Automated access &amp; fair query policy">
            <p>
              You agree not to engage in abusive querying, high-frequency scraping that degrades service
              performance for other researchers, or distributed denial-of-service activities. Automated
              queries must adhere to polite rate limits (maximum 10 requests per second) and disclose a
              descriptive <code className="rounded bg-zinc-100 px-1 font-mono text-[11px]">User-Agent</code>{' '}
              header including contact email.
            </p>
          </Section>

          <Section n="5" title="Limitation of liability">
            <p>
              To the maximum extent permitted by applicable law, in no event shall AICapitalTracker, its
              founders, analysts, or contributors be liable for any direct, indirect, incidental, special,
              consequential, or punitive damages arising from the use of, or inability to use, this platform or
              any decisions made based on data contained herein.
            </p>
          </Section>
        </div>

        {/* Cross-links */}
        <nav aria-label="Policy navigation" className="flex flex-wrap items-center justify-between gap-4 border-t border-zinc-200 pt-6">
          <Link href="/privacy" className="link-ledger">
            <span>&larr; View privacy policy</span>
          </Link>
          <Link href="/methodology" className="link-ledger">
            <span>Evidence standards &rarr;</span>
          </Link>
        </nav>
      </div>
    </div>
  );
}