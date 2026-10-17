import React from 'react';
import Link from 'next/link';
import { ShieldCheck, ArrowUpRight, Activity } from 'lucide-react';

/** Shared footer link: muted mono ledger, emerald on hover, focus ring intact. */
const footLink =
  'inline-flex items-center gap-1 rounded text-zinc-400 transition-colors duration-150 hover:text-emerald-300';
const footColumnTitle = 'eyebrow-terminal mb-3 text-zinc-200';

function LedgerMark({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true" focusable="false">
      <path
        d="M4 18.5 9.2 12l3.6 3.4L20 6.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M15.4 6.5H20v4.6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.55"
      />
      <circle cx="20" cy="18.5" r="1.9" fill="currentColor" />
    </svg>
  );
}

export function Footer() {
  return (
    /* bezel-mint draws the one-pixel phosphor seam where the light ledger canvas
       hands off to the dark terminal. mt-auto keeps the footer pinned to the
       bottom on short pages; every route already carries its own bottom
       padding, so no extra top margin is needed. */
    <footer className="hero-terminal bezel-mint mt-auto">
      {/* Phosphor bloom */}
      <div
        className="pointer-events-none absolute -top-40 left-1/3 h-56 w-[38rem] rounded-full bg-emerald-500/10 blur-[110px]"
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-7xl px-4 pb-12 pt-14 sm:px-6 lg:px-8">
        {/* Masthead */}
        <div className="grid grid-cols-1 gap-10 border-b border-white/10 pb-12 md:grid-cols-12 md:gap-8">
          <div className="space-y-5 md:col-span-5">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-panel border border-white/10 bg-white/[0.05] text-emerald-400">
                <LedgerMark className="h-4 w-4" />
              </span>
              <span className="text-sm font-extrabold tracking-tight text-white">AI CAPITAL TRACKER</span>
              <span className="pill pill-terminal-mint">Research</span>
            </div>
            <p className="max-w-md text-xs leading-relaxed text-zinc-400">
              An independent financial intelligence database documenting capital flows, GPU debt facilities,
              cloud capacity commitments, and nuclear power purchase agreements powering artificial
              intelligence infrastructure.
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <span className="pill pill-terminal-mint">
                <ShieldCheck aria-hidden="true" className="h-3.5 w-3.5" />
                Zero fabricated estimates
              </span>
              <span className="pill pill-terminal">
                <Activity aria-hidden="true" className="h-3.5 w-3.5 text-emerald-400" />
                Ledger status: audited
              </span>
            </div>
          </div>

          <nav aria-label="Research ledger" className="md:col-span-3">
            <h2 className={footColumnTitle}>Research Ledger</h2>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link href="/deals" className={footLink}>
                  All Disclosed Deals
                </Link>
              </li>
              <li>
                <Link href="/companies" className={footLink}>
                  Company Directory
                </Link>
              </li>
              <li>
                <Link href="/relationships" className={footLink}>
                  Relationship Flow Map
                </Link>
              </li>
              <li>
                <Link href="/visualize" className={footLink}>
                  Capital Flow Visualizations
                </Link>
              </li>
              <li>
                <Link href="/sources" className={footLink}>
                  SEC Filings &amp; Source Registry
                </Link>
              </li>
            </ul>
          </nav>

          <nav aria-label="Methodology and audit" className="md:col-span-2">
            <h2 className={footColumnTitle}>Methodology</h2>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link href="/methodology" className={footLink}>
                  Evidence Standards
                </Link>
              </li>
              <li>
                <Link href="/methodology#inclusion" className={footLink}>
                  Inclusion Criteria
                </Link>
              </li>
              <li>
                <Link href="/corrections" className={footLink}>
                  Corrections &amp; Disputes
                </Link>
              </li>
              <li>
                <Link href="/about" className={footLink}>
                  About Editorial Desk
                </Link>
              </li>
            </ul>
          </nav>

          <nav aria-label="Regulatory compliance" className="md:col-span-2">
            <h2 className={footColumnTitle}>Compliance</h2>
            <ul className="space-y-2.5 text-xs">
              <li>
                <a
                  href="https://www.sec.gov/edgar/searchedgar/accessing-edgar-data.htm"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={footLink}
                >
                  <span>SEC EDGAR Access</span>
                  <ArrowUpRight aria-hidden="true" className="h-2.5 w-2.5" />
                </a>
              </li>
              <li>
                <Link href="/terms" className={footLink}>
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/privacy" className={footLink}>
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/contact" className={footLink}>
                  Contact Research Team
                </Link>
              </li>
            </ul>
          </nav>
        </div>

        {/* Statutory disclaimer — zinc-400/zinc-500 because these are 10-11px
            captions on a near-black surface; zinc-500 alone measures 4.3:1. */}
        <div className="space-y-3 pt-8 text-[11px] leading-relaxed text-zinc-400">
          <p>
            <strong className="font-semibold text-zinc-200">Non-investment advice disclaimer:</strong>{' '}
            AICapitalTracker.com operates solely as an educational, journalistic, and academic research
            resource. None of the data, classifications, relationship graphs, or text on this site constitutes
            investment advice, financial advice, credit ratings, valuation targets, or a solicitation to buy
            or sell securities. Published monetary values reflect publicly disclosed figures from statutory
            filings (SEC 10-K, 10-Q, 8-K) or official company releases. If a figure was undisclosed, it is
            marked as such.
          </p>
          <div className="flex flex-col justify-between gap-2 border-t border-white/10 pt-4 font-mono text-[10px] tracking-[0.08em] sm:flex-row sm:items-center">
            <span className="text-zinc-400">&copy; {new Date().getFullYear()} AICapitalTracker.com. Public Research Database.</span>
            <span className="text-zinc-400">Provenance: SEC EDGAR &middot; Company IR &middot; FERC &middot; DOE &middot; EIA</span>
          </div>
        </div>
      </div>
    </footer>
  );
}