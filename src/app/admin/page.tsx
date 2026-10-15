import React from 'react';
import Link from 'next/link';
import { DataRepository } from '../../lib/data/db';
import { Database, Plus, ShieldAlert, Layers, ArrowRight, Lock, CheckCircle2 } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  const metrics = await DataRepository.getPlatformMetrics();
  const sourceRegistry = await DataRepository.getSourceRegistry();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Admin Masthead Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 sm:p-8 bg-zinc-950 text-white rounded-lg border border-zinc-800 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 font-bold">
              EDITORIAL WORKSPACE // SECURE DESK
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Editorial Control & Audit Desk
          </h1>
          <p className="text-xs text-zinc-400 mt-1 max-w-xl">
            Audit candidate transactions, manage statutory citations, and review unverified discovery leads.
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <Link
            href="/admin/deals/new"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-zinc-100 text-zinc-950 text-xs font-mono font-semibold uppercase tracking-wider rounded transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Deal</span>
          </Link>
          <Link
            href="/admin/discovery"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-mono font-semibold uppercase tracking-wider border border-zinc-700 rounded transition-colors"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
            <span>Discovery Queue</span>
          </Link>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-white border border-zinc-200 rounded-lg shadow-xs">
          <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 font-bold">
            Published Ledger Deals
          </div>
          <div className="text-2xl font-bold font-mono text-zinc-950 tabular-nums mt-1">
            {metrics.totalDeals}
          </div>
          <div className="text-[10px] text-emerald-600 font-mono mt-0.5">Live on public ledger</div>
        </div>

        <div className="p-5 bg-white border border-zinc-200 rounded-lg shadow-xs">
          <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 font-bold">
            Tracked Entities
          </div>
          <div className="text-2xl font-bold font-mono text-zinc-950 tabular-nums mt-1">
            {metrics.totalCompanies}
          </div>
          <div className="text-[10px] text-zinc-400 font-mono mt-0.5">Labs, hyperscalers, lenders</div>
        </div>

        <div className="p-5 bg-white border border-zinc-200 rounded-lg shadow-xs">
          <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 font-bold">
            Monitored Adapters
          </div>
          <div className="text-2xl font-bold font-mono text-zinc-950 tabular-nums mt-1">
            {sourceRegistry.filter((s) => s.is_enabled).length} / {sourceRegistry.length}
          </div>
          <div className="text-[10px] text-zinc-400 font-mono mt-0.5">SEC EDGAR, company feeds</div>
        </div>

        <div className="p-5 bg-white border border-zinc-200 rounded-lg shadow-xs">
          <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 font-bold">
            Quarantine Leads
          </div>
          <div className="text-2xl font-bold font-mono text-amber-700 tabular-nums mt-1">
            2 Pending
          </div>
          <div className="text-[10px] text-amber-600 font-mono mt-0.5">Requires primary audit</div>
        </div>
      </div>

      {/* Navigation Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 bg-white border border-zinc-200 rounded-lg space-y-3 shadow-xs">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-zinc-500" />
            <h2 className="text-sm font-mono uppercase tracking-wider text-zinc-950 font-bold">
              Deal Ledger Management
            </h2>
          </div>
          <p className="text-xs text-zinc-600 leading-relaxed">
            Create, audit, and edit deals. The system enforces strict integrity: deals cannot be published without at least one primary source citation.
          </p>
          <div className="pt-2">
            <Link
              href="/admin/deals"
              className="text-xs font-mono font-semibold text-blue-600 hover:underline inline-flex items-center gap-1"
            >
              <span>Open Deal Ledger Manager</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        <div className="p-6 bg-white border border-zinc-200 rounded-lg space-y-3 shadow-xs">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-500" />
            <h2 className="text-sm font-mono uppercase tracking-wider text-zinc-950 font-bold">
              Discovery Lead Queue
            </h2>
          </div>
          <p className="text-xs text-zinc-600 leading-relaxed">
            Inspect leads discovered by polite crawlers. Candidates are quarantined in a private queue and never published without independent primary evidence.
          </p>
          <div className="pt-2">
            <Link
              href="/admin/discovery"
              className="text-xs font-mono font-semibold text-blue-600 hover:underline inline-flex items-center gap-1"
            >
              <span>Open Discovery Lead Queue</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
