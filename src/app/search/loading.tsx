import React from 'react';
import { HeroSkeleton } from '../loading';

export default function SearchLoading() {
  return (
    <div className="pb-16" aria-busy="true">
      <HeroSkeleton label="Loading search results" />
      <div className="mx-auto max-w-7xl space-y-8 px-4 py-10 sm:px-6 lg:px-8">
        <div className="panel grid grid-cols-1 gap-3 p-6 sm:grid-cols-3">
          <div className="sm:col-span-2">
            <div className="skeleton h-3 w-40 rounded" />
            <div className="skeleton mt-2 h-9 w-full rounded-panel" />
          </div>
          <div className="flex items-end">
            <div className="skeleton h-9 w-full rounded-panel" />
          </div>
        </div>
        <div className="ledger-shell">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-4 py-3.5">
              <div className="skeleton h-3 w-20 rounded" />
              <div className="skeleton h-3 flex-1 rounded" />
              <div className="skeleton ml-auto h-3 w-16 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}