import React from 'react';
import { HeroSkeleton } from '../loading';

export default function SourcesLoading() {
  return (
    <div className="pb-16" aria-busy="true">
      <HeroSkeleton label="Loading source registry" />
      <div className="mx-auto max-w-7xl space-y-8 px-4 py-10 sm:px-6 lg:px-8">
        <div className="panel space-y-3 p-6">
          <div className="skeleton h-3 w-40 rounded" />
          <div className="skeleton h-4 w-full rounded" />
          <div className="skeleton h-4 w-10/12 rounded" />
        </div>
        <div className="panel p-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton mb-3 h-10 w-full rounded last:mb-0" />
          ))}
        </div>
      </div>
    </div>
  );
}