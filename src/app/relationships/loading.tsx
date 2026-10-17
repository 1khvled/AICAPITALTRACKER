import React from 'react';
import { HeroSkeleton } from '../loading';

export default function RelationshipsLoading() {
  return (
    <div className="pb-16" aria-busy="true">
      <HeroSkeleton label="Loading relationship map" />
      <div className="mx-auto max-w-7xl space-y-8 px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton h-24 rounded-panel" />
          ))}
        </div>
        <div className="ledger-shell">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-4 py-3.5">
              <div className="skeleton h-3 w-32 rounded" />
              <div className="skeleton h-3 w-24 rounded-full" />
              <div className="skeleton h-3 w-32 rounded" />
              <div className="skeleton ml-auto h-3 w-20 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}