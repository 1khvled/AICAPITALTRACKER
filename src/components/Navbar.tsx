
import React from 'react';
import Link from 'next/link';
import { Search, Database, Layers, ShieldCheck, FileText, Lock } from 'lucide-react';

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-zinc-200/90 bg-white/90 backdrop-blur-md">
      {/* Top micro intelligence status bar */}
      <div className="hidden sm:flex items-center justify-between px-4 sm:px-6 lg:px-8 py-1 bg-zinc-950 text-zinc-400 text-[10px] font-mono tracking-wider border-b border-zinc-800">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 text-zinc-300">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            REGULATORY FEED: ONLINE
          </span>
          <span className="text-zinc-600">|</span>
          <span>SEC EDGAR FAIR-ACCESS: COMPLIANT</span>
          <span className="text-zinc-600">|</span>
          <span className="text-zinc-400">100% PRIMARY/SECONDARY CITATIONS</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-zinc-400">NO ESTIMATES PUBLISHED AS CONFIRMED FACTS</span>
          <span className="text-zinc-600">|</span>
          <Link href="/methodology" className="hover:text-white transition-colors underline decoration-zinc-600">
            AUDIT METHODOLOGY
          </Link>
        </div>
      </div>

      {/* Main navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Logo and brand identity */}
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-7 h-7 rounded bg-zinc-900 border border-zinc-700 flex items-center justify-center text-white font-mono font-bold text-xs group-hover:bg-zinc-800 transition-colors shadow-xs">
                ▲
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-zinc-950 text-sm tracking-tight">
                    AI CAPITAL TRACKER
                  </span>
                  <span className="text-[9px] font-mono font-semibold px-1.5 py-0.2 rounded bg-zinc-100 text-zinc-600 border border-zinc-200">
                    RESEARCH
                  </span>
                </div>
                <span className="text-[10px] text-zinc-400 font-mono tracking-normal leading-none mt-0.5">
                  Financial Ledger of AI Infrastructure
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center space-x-1 text-xs font-medium text-zinc-600">
              <Link
                href="/deals"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded hover:text-zinc-950 hover:bg-zinc-100/80 transition-colors"
              >
                <Database className="w-3.5 h-3.5 text-zinc-400" />
                <span>Deal Ledger</span>
              </Link>
              <Link
                href="/companies"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded hover:text-zinc-950 hover:bg-zinc-100/80 transition-colors"
              >
                <Layers className="w-3.5 h-3.5 text-zinc-400" />
                <span>Companies</span>
              </Link>
              <Link
                href="/relationships"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded hover:text-zinc-950 hover:bg-zinc-100/80 transition-colors"
              >
                <span>Flow Map</span>
              </Link>
              <Link
                href="/sources"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded hover:text-zinc-950 hover:bg-zinc-100/80 transition-colors"
              >
                <FileText className="w-3.5 h-3.5 text-zinc-400" />
                <span>Filings & Sources</span>
              </Link>
              <Link
                href="/methodology"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded hover:text-zinc-950 hover:bg-zinc-100/80 transition-colors"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-zinc-400" />
                <span>Methodology</span>
              </Link>
            </nav>
          </div>

          {/* Right actions: search & admin */}
          <div className="flex items-center gap-2.5">
            <Link
              href="/search"
              className="flex items-center gap-2 px-3 py-1.5 text-xs text-zinc-500 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 rounded transition-colors group"
            >
              <Search className="w-3.5 h-3.5 text-zinc-400 group-hover:text-zinc-700" />
              <span className="hidden sm:inline font-sans">Search transactions, tickers...</span>
              <span className="sm:hidden font-sans">Search</span>
              <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono text-zinc-400 bg-white border border-zinc-200 rounded">
                /
              </kbd>
            </Link>

            <Link
              href="/admin"
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-mono font-medium text-zinc-600 hover:text-zinc-900 border border-zinc-200 rounded hover:bg-zinc-50 transition-colors"
              title="Secure Admin Review Workspace"
            >
              <Lock className="w-3 h-3 text-zinc-400" />
              <span className="hidden sm:inline">Desk</span>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
