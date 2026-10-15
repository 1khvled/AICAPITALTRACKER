import React from 'react';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-24 text-center">
      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-100 text-slate-700 font-mono text-sm font-semibold mb-4">
        404
      </div>
      <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
        Record Not Found
      </h1>
      <p className="mt-3 text-sm text-slate-600 leading-relaxed max-w-md mx-auto">
        The requested deal, company, or research document does not exist or has not met our published evidence criteria.
      </p>
      <div className="mt-8 flex justify-center gap-3">
        <Link
          href="/deals"
          className="px-4 py-2 text-xs font-medium text-white bg-slate-900 rounded-md hover:bg-slate-800 transition-colors"
        >
          Browse Deal Ledger
        </Link>
        <Link
          href="/"
          className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition-colors"
        >
          Return Home
        </Link>
      </div>
    </div>
  );
}
