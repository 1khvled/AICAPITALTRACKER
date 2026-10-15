import React from 'react';

export default function Loading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-pulse space-y-8">
      <div className="h-8 bg-slate-200 rounded w-1/4" />
      <div className="h-4 bg-slate-200 rounded w-2/4" />
      <div className="border border-slate-200 rounded-lg p-6 bg-white space-y-4">
        <div className="h-10 bg-slate-100 rounded w-full" />
        <div className="h-12 bg-slate-50 rounded w-full" />
        <div className="h-12 bg-slate-50 rounded w-full" />
        <div className="h-12 bg-slate-50 rounded w-full" />
      </div>
    </div>
  );
}
