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
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      {/* Terminal read-out: the query was rejected before it reached the ledger. */}
      <section className="hero-terminal rounded-terminal">
        <div className="relative mx-auto max-w-xl px-6 py-10 text-center sm:px-8 sm:py-12">
          <div className="terminal-card terminal-ring mx-auto flex h-16 w-16 items-center justify-center border-rose-500/30">
            <span className="num text-xl font-bold text-rose-300">!</span>
          </div>
          <p className="micro-label-terminal mt-5 justify-center text-rose-300">Exception</p>
          <h1 className="mt-1.5 text-2xl font-black tracking-tight text-white sm:text-3xl">
            Data loading exception
          </h1>
          <p className="mx-auto mt-3 max-w-md text-xs leading-relaxed text-zinc-400 sm:text-sm">
            An error occurred while loading this research record. Our systems operate under strict validation to
            prevent displaying malformed financial figures.
          </p>
          {error.digest && (
            <p className="caption-terminal mt-4 justify-center">
              TRACE <span className="num text-zinc-300">{error.digest}</span>
            </p>
          )}
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <button type="button" onClick={() => reset()} className="btn btn-accent">
              Retry query
            </button>
            <Link href="/" className="btn btn-terminal">
              Return home
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}