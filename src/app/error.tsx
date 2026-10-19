"use client";

import React from "react";
import Link from "next/link";

/**
 * Route-level error boundary.
 *
 * Apologetic, plain, and useful: what failed, whether retrying helps, and where
 * to go in the meantime. No drama, no stack traces.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="section-sm">
      <div className="max-w-reading space-y-5">
        <span className="label">Something went wrong</span>
        <h1 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">
          Sorry — this page didn&apos;t load
        </h1>
        <p className="prose prose-lead">
          We hit an error while rendering this page. It is on our side, not yours. Trying again often
          fixes it, because most failures here are a single slow data source timing out.
        </p>

        <div className="flex flex-wrap items-center gap-2">
          <button onClick={() => reset()} className="btn btn-primary min-h-11">
            Try again
          </button>
          <Link href="/" className="btn min-h-11">
            Back to the verdict
          </Link>
          <Link href="/methodology" className="btn min-h-11">
            Read the method
          </Link>
        </div>

        {error.digest && (
          <p className="notice">
            <span className="notice-title">Reference</span>
            <span className="num mt-1.5 block text-[14px] text-ink-muted">
              Error digest: {error.digest}
            </span>
          </p>
        )}

        <p className="text-[14px] text-ink-subtle">
          If it keeps failing, the data snapshot may be mid-refresh — the daily ingestion run rewrites
          the inputs at 00:00 UTC.
        </p>
      </div>
    </div>
  );
}