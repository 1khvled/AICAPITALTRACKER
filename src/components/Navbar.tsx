import React from 'react';
import Link from 'next/link';

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center space-x-2.5 group">
              <div className="w-8 h-8 rounded bg-slate-900 flex items-center justify-center text-white font-bold text-sm tracking-wider group-hover:bg-brand-600 transition-colors">
                ACT
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-slate-900 text-base leading-none tracking-tight">
                  AI Capital Tracker
                </span>
                <span className="text-[10px] text-slate-500 font-mono tracking-wide uppercase mt-0.5">
                  Verified Intelligence
                </span>
              </div>
            </Link>

            <nav className="hidden md:flex items-center space-x-1 text-sm font-medium text-slate-600">
              <Link
                href="/deals"
                className="px-3 py-2 rounded-md hover:text-slate-900 hover:bg-slate-100 transition-colors"
              >
                Deal Ledger
              </Link>
              <Link
                href="/companies"
                className="px-3 py-2 rounded-md hover:text-slate-900 hover:bg-slate-100 transition-colors"
              >
                Companies
              </Link>
              <Link
                href="/relationships"
                className="px-3 py-2 rounded-md hover:text-slate-900 hover:bg-slate-100 transition-colors"
              >
                Relationships
              </Link>
              <Link
                href="/sources"
                className="px-3 py-2 rounded-md hover:text-slate-900 hover:bg-slate-100 transition-colors"
              >
                Sources
              </Link>
              <Link
                href="/methodology"
                className="px-3 py-2 rounded-md hover:text-slate-900 hover:bg-slate-100 transition-colors"
              >
                Methodology
              </Link>
            </nav>
          </div>

          <div className="flex items-center space-x-3">
            <Link
              href="/search"
              className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-500 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-md transition-colors"
            >
              <svg className="w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span>Search deals, entities...</span>
              <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] bg-white border border-slate-300 rounded font-mono text-slate-400">
                /
              </kbd>
            </Link>

            <Link
              href="/admin"
              className="px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 border border-slate-300 rounded hover:bg-slate-50 transition-colors"
            >
              Admin
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
