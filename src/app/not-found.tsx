import React from 'react';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      {/* Terminal read-out: the record was not found in the ledger. */}
      <section className="hero-terminal rounded-terminal">
        <div className="relative mx-auto max-w-xl px-6 py-10 text-center sm:px-8 sm:py-12">
          <div className="terminal-card terminal-ring mx-auto flex h-16 w-16 items-center justify-center">
            <span className="num text-xl font-bold text-emerald-300">404</span>
          </div>
          <p className="micro-label-terminal mt-5 justify-center">Record not found</p>
          <h1 className="mt-1.5 text-2xl font-black tracking-tight text-white sm:text-3xl">
            This record is not in the ledger
          </h1>
          <p className="mx-auto mt-3 max-w-md text-xs leading-relaxed text-zinc-400 sm:text-sm">
            The requested deal, company, or research document does not exist or has not met our published
            evidence criteria.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Link href="/deals" className="btn btn-accent">
              Browse deal ledger
            </Link>
            <Link href="/" className="btn btn-terminal">
              Return home
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}