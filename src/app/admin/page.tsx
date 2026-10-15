import React from 'react';
import Link from 'next/link';
import { DataRepository } from '../../lib/data/db';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  const metrics = await DataRepository.getPlatformMetrics();
  const sourceRegistry = await DataRepository.getSourceRegistry();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Admin Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-slate-900 text-white rounded-lg">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="text-xs font-mono uppercase tracking-wider text-slate-400">
              Editorial Control Center
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white mt-1">
            AICapitalTracker Admin Workspace
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage transactions, inspect discovery leads, and maintain source registry integrity.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/deals/new"
            className="px-3.5 py-2 bg-brand-500 hover:bg-brand-600 text-white text-xs font-medium rounded transition-colors"
          >
            + Create New Deal
          </Link>
          <Link
            href="/admin/discovery"
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 rounded transition-colors"
          >
            Discovery Queue
          </Link>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-white border border-slate-200 rounded-lg shadow-xs">
          <div className="text-xs font-medium text-slate-500">Published Deals</div>
          <div className="text-2xl font-bold font-mono text-slate-900 mt-1">{metrics.totalDeals}</div>
          <div className="text-[11px] text-emerald-600 mt-0.5">Active on public ledger</div>
        </div>

        <div className="p-5 bg-white border border-slate-200 rounded-lg shadow-xs">
          <div className="text-xs font-medium text-slate-500">Tracked Companies</div>
          <div className="text-2xl font-bold font-mono text-slate-900 mt-1">{metrics.totalCompanies}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Labs, chipmakers, hyperscalers</div>
        </div>

        <div className="p-5 bg-white border border-slate-200 rounded-lg shadow-xs">
          <div className="text-xs font-medium text-slate-500">Active Source Adapters</div>
          <div className="text-2xl font-bold font-mono text-slate-900 mt-1">
            {sourceRegistry.filter((s) => s.is_enabled).length} / {sourceRegistry.length}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">SEC EDGAR, company feeds</div>
        </div>

        <div className="p-5 bg-white border border-slate-200 rounded-lg shadow-xs">
          <div className="text-xs font-medium text-slate-500">Discovery Queue</div>
          <div className="text-2xl font-bold font-mono text-slate-900 mt-1">Ready</div>
          <div className="text-[11px] text-amber-600 mt-0.5">Requires primary verification</div>
        </div>
      </div>

      {/* Quick Navigation Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 bg-white border border-slate-200 rounded-lg space-y-3">
          <h2 className="text-base font-bold text-slate-900">Deal Management</h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            Review draft records, perform duplicate detection, verify date chronology, and enforce the mandatory source citation rule before publishing.
          </p>
          <div className="pt-2">
            <Link
              href="/admin/deals"
              className="text-xs font-semibold text-brand-600 hover:text-brand-800"
            >
              Open Deal Manager &rarr;
            </Link>
          </div>
        </div>

        <div className="p-6 bg-white border border-slate-200 rounded-lg space-y-3">
          <h2 className="text-base font-bold text-slate-900">Discovery & Competitor Monitor</h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            Review leads discovered by polite crawlers. Candidates are quarantined in a private queue and never published without independent primary evidence.
          </p>
          <div className="pt-2">
            <Link
              href="/admin/discovery"
              className="text-xs font-semibold text-brand-600 hover:text-brand-800"
            >
              Open Discovery Queue &rarr;
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
