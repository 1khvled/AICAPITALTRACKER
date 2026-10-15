import React from 'react';
import Link from 'next/link';

export function Footer() {
  return (
    <footer className="w-full border-t border-slate-200 bg-slate-50 text-slate-600 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-3 md:col-span-1">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 rounded bg-slate-900 flex items-center justify-center text-white font-bold text-xs">
                ACT
              </div>
              <span className="font-semibold text-slate-900 text-sm">AI Capital Tracker</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Transparent, source-backed intelligence tracking financing, credit facilities, cloud commitments, and power infrastructure for artificial intelligence companies.
            </p>
            <div className="text-[11px] text-slate-400 font-mono">
              Database build v1.0 • Free-tier public research
            </div>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-900 mb-3">
              Research Ledger
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/deals" className="hover:text-slate-900 transition-colors">
                  All Disclosed Deals
                </Link>
              </li>
              <li>
                <Link href="/companies" className="hover:text-slate-900 transition-colors">
                  Company Directory
                </Link>
              </li>
              <li>
                <Link href="/relationships" className="hover:text-slate-900 transition-colors">
                  Relationship Explorer
                </Link>
              </li>
              <li>
                <Link href="/sources" className="hover:text-slate-900 transition-colors">
                  Source Registry & Filings
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-900 mb-3">
              Methodology & Standards
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/methodology" className="hover:text-slate-900 transition-colors">
                  Evidence Standards
                </Link>
              </li>
              <li>
                <Link href="/methodology#inclusion" className="hover:text-slate-900 transition-colors">
                  Inclusion Criteria
                </Link>
              </li>
              <li>
                <Link href="/corrections" className="hover:text-slate-900 transition-colors">
                  Corrections & Dispute Policy
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-slate-900 transition-colors">
                  About the Project
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-900 mb-3">
              Legal & Disclaimers
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/privacy" className="hover:text-slate-900 transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-slate-900 transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-slate-900 transition-colors">
                  Contact / Editorial Desk
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-200 mt-8 pt-8 text-[11px] text-slate-500 leading-normal space-y-2">
          <p>
            <strong>Disclaimer:</strong> AICapitalTracker.com is an independent academic and financial research resource. We do not provide financial advice, investment recommendations, debt ratings, or price targets. Published amounts represent publicly disclosed figures from primary SEC filings or official company statements. Unconfirmed amounts are labeled undisclosed.
          </p>
          <p>
            Data sourced in compliance with SEC EDGAR Fair Access guidelines, official company investor relations releases, and public regulatory dockets.
          </p>
        </div>
      </div>
    </footer>
  );
}
