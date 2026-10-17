import React from 'react';
import Link from 'next/link';
import { DataRepository } from '../../lib/data/db';
import { Database, Plus, ShieldAlert, ArrowRight } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  const metrics = await DataRepository.getPlatformMetrics();
  const sourceRegistry = await DataRepository.getSourceRegistry();

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="space-y-8">
        {/* Secure desk banner */}
        <section className="terminal-panel relative overflow-hidden p-6 sm:p-8">
          <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="live-dot" aria-hidden="true" />
                <span className="eyebrow-terminal text-zinc-400">
                  Editorial workspace <span className="text-zinc-600" aria-hidden="true">{'//'}</span>{' '}
                  secure desk
                </span>
              </div>
              <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
                Editorial control &amp; audit desk
              </h1>
              <p className="max-w-xl text-xs leading-relaxed text-zinc-400">
                Audit candidate transactions, manage statutory citations, and review unverified discovery
                leads.
              </p>
            </div>

            <div className="flex shrink-0 flex-wrap gap-2.5">
              <Link href="/admin/deals/new" className="btn btn-terminal-solid">
                <Plus aria-hidden="true" className="h-3.5 w-3.5" />
                <span>Create deal</span>
              </Link>
              <Link href="/admin/discovery" className="btn btn-terminal">
                <ShieldAlert aria-hidden="true" className="h-3.5 w-3.5 text-amber-400" />
                <span>Discovery queue</span>
              </Link>
            </div>
          </div>
        </section>

        {/* Metrics */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              label: 'Published ledger deals',
              value: metrics.totalDeals,
              note: 'Live on public ledger',
              tone: 'text-emerald-700',
            },
            {
              label: 'Tracked entities',
              value: metrics.totalCompanies,
              note: 'Labs, hyperscalers, lenders',
              tone: 'text-zinc-500',
            },
            {
              label: 'Monitored adapters',
              value: `${sourceRegistry.filter((s) => s.is_enabled).length} / ${sourceRegistry.length}`,
              note: 'SEC EDGAR, company feeds',
              tone: 'text-zinc-500',
            },
            {
              label: 'Quarantine leads',
              value: '2 Pending',
              note: 'Requires primary audit',
              tone: 'text-amber-700',
            },
          ].map((m) => (
            <div key={m.label} className="panel-interactive p-5">
              <div className="stat-label">{m.label}</div>
              <div className="stat-value">{m.value}</div>
              <div className={`stat-note ${m.tone}`}>{m.note}</div>
            </div>
          ))}
        </div>

        {/* Navigation sections */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="panel space-y-3 p-6">
            <div className="flex items-center gap-2">
              <Database aria-hidden="true" className="h-4 w-4 text-emerald-600" />
              <h2 className="panel-title">Deal ledger management</h2>
            </div>
            <p className="text-xs leading-relaxed text-zinc-600">
              Create, audit, and edit deals. The system enforces strict integrity: deals cannot be published
              without at least one primary source citation.
            </p>
            <div className="pt-2">
              <Link href="/admin/deals" className="link-ledger-strong">
                <span>Open deal ledger manager</span>
                <ArrowRight aria-hidden="true" className="h-3 w-3" />
              </Link>
            </div>
          </div>

          <div className="panel space-y-3 p-6">
            <div className="flex items-center gap-2">
              <ShieldAlert aria-hidden="true" className="h-4 w-4 text-amber-500" />
              <h2 className="panel-title">Discovery lead queue</h2>
            </div>
            <p className="text-xs leading-relaxed text-zinc-600">
              Inspect leads discovered by polite crawlers. Candidates are quarantined in a private queue and
              never published without independent primary evidence.
            </p>
            <div className="pt-2">
              <Link href="/admin/discovery" className="link-ledger-strong">
                <span>Open discovery lead queue</span>
                <ArrowRight aria-hidden="true" className="h-3 w-3" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}