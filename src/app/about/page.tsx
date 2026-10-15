import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'About — AI Capital Tracker',
  description: 'Independent research database tracking capital, debt, and energy infrastructure in artificial intelligence.',
};

export default function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-6">
      <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">About AI Capital Tracker</h1>
      <p className="text-sm text-slate-700 leading-relaxed">
        AI Capital Tracker is an independent financial intelligence website built to bring institutional-grade transparency to the financing, debt facilities, cloud capacity commitments, and energy agreements powering the artificial intelligence transition.
      </p>

      <h2 className="text-xl font-bold text-slate-900 pt-4">Our Mission</h2>
      <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
        As hundreds of billions of dollars are committed to GPU clusters, gigawatt data centers, and multi-year cloud contracts, the lines between cash equity investments, non-binding supplier commitments, and asset-backed credit facilities frequently blur. We catalog these transactions with transparent source citations, clear evidence levels, and zero fabricated numbers.
      </p>

      <h2 className="text-xl font-bold text-slate-900 pt-4">Financial Neutrality</h2>
      <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
        We do not provide investment advice, credit opinions, or price targets. Our sole goal is to maintain an accurate, accessible, and source-backed public ledger.
      </p>

      <div className="pt-6 border-t border-slate-200">
        <Link href="/methodology" className="text-brand-600 font-medium text-xs hover:underline">
          Read our Verification Methodology &rarr;
        </Link>
      </div>
    </div>
  );
}
