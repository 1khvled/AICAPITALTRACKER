import React from 'react';
import Link from 'next/link';
import { ShieldCheck, ArrowUpRight } from 'lucide-react';

export function Footer() {
  return (
    <footer className="w-full border-t border-zinc-200 bg-white text-zinc-600 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        {/* Masthead grid */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8 pb-12 border-b border-zinc-200">
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-zinc-950 flex items-center justify-center text-white font-mono font-bold text-xs">
                ▲
              </div>
              <span className="font-extrabold text-zinc-950 text-sm tracking-tight">
                AI CAPITAL TRACKER
              </span>
              <span className="text-[9px] font-mono font-semibold px-1.5 py-0.2 rounded bg-zinc-100 text-zinc-600 border border-zinc-200">
                RESEARCH
              </span>
            </div>
            <p className="text-xs text-zinc-500 leading-relaxed max-w-sm">
              An independent financial intelligence database documenting capital flows, GPU debt facilities, cloud capacity commitments, and nuclear power purchase agreements powering artificial intelligence infrastructure.
            </p>
            <div className="flex items-center gap-2 text-[11px] font-mono text-zinc-400 pt-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Zero fabricated estimates • 100% cited facts</span>
            </div>
          </div>

          <div>
            <h4 className="text-[11px] font-mono uppercase tracking-wider text-zinc-950 font-bold mb-3">
              Research Ledger
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/deals" className="hover:text-zinc-950 transition-colors">
                  All Disclosed Deals
                </Link>
              </li>
              <li>
                <Link href="/companies" className="hover:text-zinc-950 transition-colors">
                  Company Directory
                </Link>
              </li>
              <li>
                <Link href="/relationships" className="hover:text-zinc-950 transition-colors">
                  Relationship Flow Map
                </Link>
              </li>
              <li>
                <Link href="/sources" className="hover:text-zinc-950 transition-colors">
                  SEC Filings & Source Registry
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-[11px] font-mono uppercase tracking-wider text-zinc-950 font-bold mb-3">
              Methodology & Audit
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/methodology" className="hover:text-zinc-950 transition-colors">
                  Evidence Standards
                </Link>
              </li>
              <li>
                <Link href="/methodology#inclusion" className="hover:text-zinc-950 transition-colors">
                  Inclusion Criteria
                </Link>
              </li>
              <li>
                <Link href="/corrections" className="hover:text-zinc-950 transition-colors">
                  Corrections & Disputes
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-zinc-950 transition-colors">
                  About Editorial Desk
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-[11px] font-mono uppercase tracking-wider text-zinc-950 font-bold mb-3">
              Regulatory Compliance
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <a
                  href="https://www.sec.gov/edgar/searchedgar/accessing-edgar-data.htm"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-zinc-950 transition-colors inline-flex items-center gap-1"
                >
                  <span>SEC EDGAR Access</span>
                  <ArrowUpRight className="w-2.5 h-2.5" />
                </a>
              </li>
              <li>
                <Link href="/terms" className="hover:text-zinc-950 transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-zinc-950 transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-zinc-950 transition-colors">
                  Contact Research Team
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Legal Disclaimer Box */}
        <div className="pt-8 text-[11px] text-zinc-400 space-y-2 leading-relaxed">
          <p>
            <strong>NON-INVESTMENT ADVICE DISCLAIMER:</strong> AICapitalTracker.com operates solely as an educational, journalistic, and academic research resource. None of the data, classifications, relationship graphs, or text on this site constitutes investment advice, financial advice, credit ratings, valuation targets, or a solicitation to buy or sell securities. Published monetary values reflect publicly disclosed figures from statutory filings (SEC 10-K, 10-Q, 8-K) or official company releases. If a figure was undisclosed, it is marked as such.
          </p>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-zinc-100 font-mono text-[10px]">
            <span>© {new Date().getFullYear()} AICapitalTracker.com. Public Research Database.</span>
            <span>DATA PROVENANCE: SEC EDGAR • COMPANY IR • FERC • DOE • EIA</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
