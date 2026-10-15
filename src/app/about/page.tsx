import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { ShieldCheck, ArrowRight, Building2, Scale } from 'lucide-react';

export const metadata: Metadata = {
  title: 'About the Editorial Desk — AI Capital Tracker',
  description: 'Independent research database tracking capital, debt, and energy infrastructure in artificial intelligence.',
};

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      <div className="border-b border-zinc-200 pb-5">
        <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-wider text-zinc-500 font-bold">
          <Building2 className="w-3.5 h-3.5 text-zinc-400" />
          <span>EDITORIAL DESK</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-zinc-950 tracking-tight mt-1">
          About AI Capital Tracker
        </h1>
        <p className="text-sm text-zinc-500 mt-2">
          Bringing statutory financial transparency to artificial intelligence infrastructure financing.
        </p>
      </div>

      <div className="prose prose-zinc max-w-none text-xs sm:text-sm text-zinc-600 space-y-4 leading-relaxed">
        <p className="text-base sm:text-lg text-zinc-900 font-medium leading-relaxed">
          AI Capital Tracker is an independent, non-partisan financial intelligence project documenting capital commitments, credit lines, cloud infrastructure agreements, and clean energy contracts across the AI ecosystem.
        </p>

        <h2 className="text-xl font-bold text-zinc-950 pt-4">The Need for Rigor</h2>
        <p>
          As hundreds of billions of dollars are committed to GPU clusters, gigawatt data centers, and multi-year cloud contracts, the lines between cash equity investments, non-binding supplier commitments, and asset-backed credit facilities frequently blur. We catalog these transactions with transparent source citations, clear evidence levels, and zero fabricated numbers.
        </p>

        <h2 className="text-xl font-bold text-zinc-950 pt-4">Zero-Slop Standard</h2>
        <p>
          We do not deploy automated scraping bots that copy unverified blog posts or generate AI summaries presented as factual research. Every published transaction is audited against primary statutory filings (SEC EDGAR Form 10-K, 10-Q, 8-K), official company releases, or verified tier-1 reporting.
        </p>
      </div>

      <div className="p-6 bg-zinc-50 border border-zinc-200 rounded-lg flex items-center justify-between">
        <div className="space-y-1">
          <div className="font-bold text-zinc-950 text-sm">Review our Evidence Methodology</div>
          <p className="text-xs text-zinc-500">Learn how we distinguish confirmed primary filings from pending commitments.</p>
        </div>
        <Link
          href="/methodology"
          className="px-4 py-2 bg-zinc-950 hover:bg-zinc-800 text-white font-mono text-xs font-semibold uppercase tracking-wider rounded transition-colors inline-flex items-center gap-1.5"
        >
          <span>Methodology</span>
          <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
    </div>
  );
}
