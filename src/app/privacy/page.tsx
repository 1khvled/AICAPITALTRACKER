import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { Lock, EyeOff } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Privacy Policy & Data Ethics — AI Capital Tracker',
  description:
    'Institutional privacy policy, server logging practices, zero-tracking philosophy, and GDPR/CCPA disclosures.',
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

export default function PrivacyPage() {
  return (
    <div className="pb-16">
      {/* Terminal hero */}
      <section className="hero-terminal">
        <div className="relative mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-14 lg:px-8">
          <p className="eyebrow-terminal text-emerald-300">
            <Lock aria-hidden="true" className="h-3.5 w-3.5" />
            <span>Data ethics &amp; privacy policy</span>
          </p>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-white sm:text-4xl">
            Privacy policy &amp; information ethics
          </h1>
          <p className="caption-terminal mt-3">
            Last revised: October 2024 (updated for 2026 production release).
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-4xl space-y-10 px-4 pt-12 sm:px-6 lg:px-8">
        {/* Zero-surveillance banner */}
        <div className="terminal-panel space-y-2 p-6">
          <div className="micro-label-terminal gap-2 tracking-wider text-emerald-300">
            <EyeOff aria-hidden="true" className="h-4 w-4" />
            <span>Zero surveillance &amp; no data monetization</span>
          </div>
          <p className="text-xs leading-relaxed text-zinc-300 sm:text-sm">
            AICapitalTracker is an independent research database. We do not sell personal data, do not run
            invasive behavioral tracking pixels, and do not broker user dossiers to third-party ad networks or
            data aggregators.
          </p>
        </div>

        {/* Policy sections */}
        <div className="panel space-y-8 p-6 text-xs leading-relaxed text-zinc-700 sm:text-sm sm:p-8">
          <Section n="1" title="Information we collect">
            <p>
              When you browse AICapitalTracker.com, you do so anonymously. We do not mandate user
              registration, logins, or credit card submissions for public database access.
            </p>
            <ul className="list-disc space-y-2 pl-5 text-zinc-600">
              <li>
                <strong>Operational server telemetry:</strong> Standard web server logs collect temporary
                technical metadata (IP address, browser user-agent, requested endpoint, HTTP status code, and
                referrer) strictly for DDoS mitigation, infrastructure stability, and bot detection.
              </li>
              <li>
                <strong>Editorial intake submissions:</strong> If you voluntarily transmit public filings,
                dispute inquiries, or whistleblower tips via our contact forms or email, we retain those
                records securely to verify the underlying financial documentation.
              </li>
            </ul>
          </Section>

          <Section n="2" title="Cookies &amp; local storage">
            <p>
              We do not use tracking or advertising cookies. Any client-side cookies or browser local storage
              used are strictly functional (such as remembering UI filter settings or display preferences).
            </p>
          </Section>

          <Section n="3" title="GDPR &amp; international privacy rights (EEA / UK / California)">
            <p>
              Under the EU General Data Protection Regulation (GDPR), UK Data Protection Act, and California
              Consumer Privacy Act (CCPA/CPRA), you have rights regarding your personal information, including
              rights of access, rectification, and erasure.
            </p>
            <p>
              Because we do not maintain public consumer account profiles, personal information processed is
              limited to correspondence initiated by you. To exercise any data privacy rights, email our data
              privacy desk at{' '}
              <strong className="font-mono font-semibold text-zinc-950">privacy@aicapitaltracker.com</strong>.
            </p>
          </Section>

          <Section n="4" title="Third-party citations &amp; external links">
            <p>
              Our ledger contains verified hyperlinks pointing to external primary registers (such as SEC EDGAR
              at <code className="rounded bg-zinc-100 px-1 font-mono text-[11px]">sec.gov</code>, FERC public
              dockets at <code className="rounded bg-zinc-100 px-1 font-mono text-[11px]">ferc.gov</code>, and
              corporate investor relations portals). We are not responsible for the privacy policies,
              tracking mechanisms, or terms of third-party domains.
            </p>
          </Section>
        </div>

        {/* Cross-links */}
        <nav aria-label="Policy navigation" className="flex flex-wrap items-center justify-between gap-4 border-t border-zinc-200 pt-6">
          <Link href="/terms" className="link-ledger">
            <span>&larr; Terms of service</span>
          </Link>
          <Link href="/contact" className="link-ledger">
            <span>Contact editorial desk &rarr;</span>
          </Link>
        </nav>
      </div>
    </div>
  );
}