'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error for diagnostics
    console.error('AICapitalTracker caught error:', error);
  }, [error]);

  return (
    <div className="max-w-2xl mx-auto px-4 py-24 text-center">
      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-rose-50 text-rose-600 font-mono text-sm font-semibold mb-4">
        !
      </div>
      <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
        Data Loading Exception
      </h1>
      <p className="mt-2 text-xs text-slate-600 max-w-md mx-auto">
        An error occurred while loading this research record. Our systems operate under strict validation to prevent displaying malformed financial figures.
      </p>
      <div className="mt-6 flex justify-center gap-3">
        <button
          onClick={() => reset()}
          className="px-3.5 py-2 text-xs font-medium text-white bg-slate-900 rounded-md hover:bg-slate-800 transition-colors"
        >
          Retry Query
        </button>
        <Link
          href="/"
          className="px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition-colors"
        >
          Return Home
        </Link>
      </div>
    </div>
  );
}
