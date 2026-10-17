import React from 'react';

/**
 * Shared dark-hero skeleton so every route loads with the same silhouette.
 * The shimmer itself is `aria-hidden`; the status sentence lives *outside* that
 * subtree so screen readers actually hear it (it used to be nested inside, which
 * silently swallowed the announcement).
 */
export function HeroSkeleton({ label }: { label: string }) {
  return (
    <section className="hero-terminal">
      <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-14 lg:px-8" aria-hidden="true">
        <div className="skeleton-dark h-3 w-44 rounded-full" />
        <div className="skeleton-dark mt-4 h-9 w-3/5 rounded-lg" />
        <div className="skeleton-dark mt-3 h-4 w-2/5 rounded" />
      </div>
      <span className="sr-only">{label}</span>
    </section>
  );
}

export default function Loading() {
  return (
    <div className="pb-16" aria-busy="true">
      <HeroSkeleton label="Loading page" />
      <div className="mx-auto max-w-7xl space-y-8 px-4 py-10 sm:px-6 lg:px-8">
        <span className="sr-only" role="status">
          Loading…
        </span>
        <div className="panel space-y-4 p-6" aria-hidden="true">
          <div className="skeleton h-3 w-40 rounded" />
          <div className="skeleton h-4 w-full rounded" />
          <div className="skeleton h-4 w-11/12 rounded" />
          <div className="skeleton h-4 w-4/5 rounded" />
        </div>
        <div className="panel p-6" aria-hidden="true">
          <div className="skeleton h-64 w-full rounded-lg" />
        </div>
      </div>
    </div>
  );
}