import React from 'react';
import { HeroSkeleton } from '../loading';

export default function CompaniesLoading() {
  return (
    <div className="pb-16" aria-busy="true">
      <HeroSkeleton label="Loading company directory" />
      <div className="mx-auto max-w-7xl space-y-8 px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-wrap gap-1.5">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="skeleton h-8 w-28 rounded-full" />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="panel space-y-2.5 p-5">
              <div className="flex items-center justify-between gap-2">
                <div className="skeleton h-5 w-28 rounded-full" />
                <div className="skeleton h-5 w-14 rounded-full" />
              </div>
              <div className="skeleton h-5 w-2/3 rounded" />
              <div className="skeleton h-3 w-full rounded" />
              <div className="skeleton h-3 w-5/6 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}