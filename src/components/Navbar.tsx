import React from 'react';
import Link from 'next/link';
import { Search, Database, Layers, ShieldCheck, FileText, Lock, BarChart3 } from 'lucide-react';

const primaryLinks = [
  { href: '/deals', label: 'Deal Ledger', Icon: Database },
  { href: '/companies', label: 'Companies', Icon: Layers },
  { href: '/relationships', label: 'Flow Map', Icon: null },
  { href: '/visualize', label: 'Visualizations', Icon: BarChart3 },
  { href: '/sources', label: 'Filings & Sources', Icon: FileText },
  { href: '/methodology', label: 'Methodology', Icon: ShieldCheck },
];

/** Compact ascending-ledger mark. Decorative: the parent link carries the name. */
function LedgerMark({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true" focusable="false">
      <path d="M4 18.5 9.2 12l3.6 3.4L20 6.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M15.4 6.5H20v4.6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.55" />
      <circle cx="20" cy="18.5" r="1.9" fill="currentColor" />
    </svg>
  );
}

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full">
      {/* Intelligence status rail — terminal surface, so zinc-400/300 captions
          clear 8:1 on the near-black bezel. */}
      <div className="hidden border-b border-white/10 bg-zinc-950 sm:block">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-1.5 font-mono text-[10px] tracking-[0.08em] sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 text-zinc-400">
            <span className="flex items-center gap-2 text-zinc-100">
              <span className="live-dot" aria-hidden="true" />
              REGULATORY FEED: ONLINE
            </span>
            <span className="hidden text-zinc-600 sm:inline" aria-hidden="true">
              |
            </span>
            <span className="hidden sm:inline">SEC EDGAR FAIR-ACCESS: COMPLIANT</span>
            <span className="hidden text-zinc-600 lg:inline" aria-hidden="true">
              |
            </span>
            <span className="hidden lg:inline">100% PRIMARY / SECONDARY CITATIONS</span>
          </div>
          <div className="flex shrink-0 items-center gap-3 text-zinc-400">
            <span className="hidden md:inline">NO ESTIMATES PUBLISHED AS FACTS</span>
            <Link
              href="/methodology"
              className="link-terminal text-zinc-300 hover:text-emerald-300 hover:underline"
            >
              AUDIT METHODOLOGY
            </Link>
          </div>
        </div>
      </div>

      {/* Main navigation — frosted ledger bar under the terminal rail */}
      <div className="border-b border-zinc-200/80 bg-white/85 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between gap-4">
            {/* Brand */}
            <div className="flex min-w-0 items-center gap-6 xl:gap-7">
              <Link
                href="/"
                className="group flex items-center gap-2.5 rounded-md"
                aria-label="AI Capital Tracker — home"
              >
                <span className="relative flex h-9 w-9 items-center justify-center rounded-panel bg-zinc-950 text-emerald-400 shadow-panel transition-all duration-200 group-hover:text-emerald-300 group-hover:shadow-glow">
                  <LedgerMark className="h-4 w-4" />
                  <span
                    className="pointer-events-none absolute inset-0 rounded-panel ring-1 ring-inset ring-white/10"
                    aria-hidden="true"
                  />
                </span>
                <span className="flex min-w-0 flex-col">
                  <span className="flex items-center gap-2">
                    <span className="whitespace-nowrap text-sm font-extrabold tracking-tight text-zinc-950">
                      AI CAPITAL TRACKER
                    </span>
                    <span className="pill pill-mint hidden sm:inline-flex">Research</span>
                  </span>
                   {/* The sub-line only earns its place once the desktop rail has
                      cleared the brand; below `xl` it just wraps into noise. */}
                  <span className="mt-1 hidden whitespace-nowrap font-mono text-[10px] leading-none tracking-wide text-zinc-500 xl:block">
                    Financial Ledger of AI Infrastructure
                  </span>
                </span>
              </Link>

              {/* Desktop navigation */}
              <nav aria-label="Primary" className="hidden items-center gap-1 lg:flex xl:gap-0">
                {primaryLinks.map(({ href, label, Icon }) => (
                  <Link
                    key={href}
                    href={href}
                    className="group flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-[13px] font-medium text-zinc-600 transition-colors duration-150 hover:bg-zinc-100 hover:text-zinc-950"
                  >
                    {Icon && (
                      <Icon
                        aria-hidden="true"
                        className="h-3.5 w-3.5 text-zinc-500 transition-colors group-hover:text-emerald-700"
                      />
                    )}
                    <span>{label}</span>
                  </Link>
                ))}
              </nav>
            </div>

            {/* Actions */}
            <div className="flex shrink-0 items-center gap-2">
              <Link
                href="/search"
                className="group flex items-center gap-2 rounded-full border border-zinc-200 bg-zinc-50 py-1.5 pl-3 pr-2 text-xs text-zinc-600 transition-all duration-200 hover:border-zinc-400 hover:bg-white hover:text-zinc-900"
              >
                <Search aria-hidden="true" className="h-3.5 w-3.5 text-zinc-500 group-hover:text-zinc-700" />
                <span className="hidden font-sans sm:inline">Search transactions, tickers…</span>
                <span className="font-sans sm:hidden">Search</span>
                <kbd aria-hidden="true" className="kbd hidden sm:inline-flex">
                  /
                </kbd>
              </Link>

              <Link
                href="/admin"
                title="Secure Admin Review Workspace"
                className="flex items-center gap-1.5 rounded-full border border-zinc-200 px-3 py-1.5 font-mono text-xs font-medium text-zinc-600 transition-colors hover:border-zinc-950 hover:bg-zinc-950 hover:text-white"
              >
                <Lock aria-hidden="true" className="h-3 w-3" />
                <span className="hidden sm:inline">Desk</span>
              </Link>
            </div>
          </div>

          {/* Mobile navigation rail */}
          <nav
            aria-label="Mobile"
            className="ledger-scroll -mt-0.5 flex items-center gap-1.5 overflow-x-auto pb-3 lg:hidden"
          >
            {primaryLinks.map(({ href, label, Icon }) => (
              <Link
                key={href}
                href={href}
                className="flex shrink-0 items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-3 py-1.5 font-mono text-xs text-zinc-600 transition-colors duration-150 hover:border-zinc-400 hover:text-zinc-950"
              >
                {Icon && <Icon aria-hidden="true" className="h-3 w-3 text-zinc-500" />}
                <span>{label}</span>
              </Link>
            ))}
          </nav>
        </div>
        {/* Accent hairline that separates the chrome from the page. */}
        <div
          className="h-px w-full bg-gradient-to-r from-emerald-500/60 via-emerald-500/10 to-transparent"
          aria-hidden="true"
        />
      </div>
    </header>
  );
}