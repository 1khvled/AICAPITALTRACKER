import React from 'react';
import { HeroSkeleton } from '../loading';

export default function DealsLoading() {
  return (
    <div className="pb-16" aria-busy="true">
      <HeroSkeleton label="Loading deal ledger" />
      <div className="mx-auto max-w-7xl space-y-8 px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-wrap gap-1.5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton h-8 w-36 rounded-full" />
          ))}
        </div>
        <div className="panel p-6">
          <div className="skeleton h-3 w-32 rounded" />
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="skeleton h-9 w-full rounded-panel" />
            ))}
          </div>
        </div>
        <div className="ledger-shell">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-4 py-3.5">
              <div className="skeleton h-3 w-20 rounded" />
              <div className="skeleton h-3 flex-1 rounded" />
              <div className="skeleton hidden h-3 w-32 rounded sm:block" />
              <div className="skeleton ml-auto h-3 w-16 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}