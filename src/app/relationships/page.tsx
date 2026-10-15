import React from 'react';
import Link from 'next/link';
import { Metadata } from 'next';
import { DataRepository } from '../../lib/data/db';
import { EvidenceBadge } from '../../components/EvidenceBadge';
import { ArrowRight, ExternalLink, Network, Zap, Cpu, Server, Coins } from 'lucide-react';

export const metadata: Metadata = {
  title: 'AI Relationship Explorer & Capital Flow Map',
  description:
    'Search and inspect verified ties connecting AI foundation labs, GPU manufacturers, private lenders, and utility operators.',
};

export const revalidate = 1800;

export default async function RelationshipsPage() {
  const relationships = await DataRepository.getRelationships();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="border-b border-zinc-200 pb-5">
        <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-wider text-zinc-500 font-bold">
          <Network className="w-3.5 h-3.5 text-zinc-400" />
          <span>NETWORK INTELLIGENCE</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-zinc-950 tracking-tight mt-1">
          Counterparty Relationship & Capital Flow Map
        </h1>
        <p className="text-xs sm:text-sm text-zinc-500 mt-1 max-w-3xl">
          Documented interconnections across hardware allocation, cloud commitments, asset-backed debt, and nuclear energy off-take agreements.
        </p>
      </div>

      {/* Relationship Categories Summary Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 bg-white border border-zinc-200 rounded-lg">
          <div className="flex items-center gap-1.5 text-amber-700">
            <Coins className="w-4 h-4" />
            <span className="text-[10px] font-mono uppercase font-bold">Credit & Debt</span>
          </div>
          <div className="text-sm font-bold text-zinc-900 mt-1">GPU Asset-Backed Lines</div>
          <div className="text-[10px] text-zinc-500 mt-0.5">Blackstone & Magnetar &rarr; CoreWeave</div>
        </div>

        <div className="p-4 bg-white border border-zinc-200 rounded-lg">
          <div className="flex items-center gap-1.5 text-blue-700">
            <Server className="w-4 h-4" />
            <span className="text-[10px] font-mono uppercase font-bold">Cloud & Equity</span>
          </div>
          <div className="text-sm font-bold text-zinc-900 mt-1">Hyperscaler Injections</div>
          <div className="text-[10px] text-zinc-500 mt-0.5">Microsoft & OpenAI / Amazon & Anthropic</div>
        </div>

        <div className="p-4 bg-white border border-zinc-200 rounded-lg">
          <div className="flex items-center gap-1.5 text-purple-700">
            <Cpu className="w-4 h-4" />
            <span className="text-[10px] font-mono uppercase font-bold">Hardware Allocation</span>
          </div>
          <div className="text-sm font-bold text-zinc-900 mt-1">Accelerated Silicon</div>
          <div className="text-[10px] text-zinc-500 mt-0.5">NVIDIA &rarr; CoreWeave / Hyperscalers</div>
        </div>

        <div className="p-4 bg-white border border-zinc-200 rounded-lg">
          <div className="flex items-center gap-1.5 text-emerald-700">
            <Zap className="w-4 h-4" />
            <span className="text-[10px] font-mono uppercase font-bold">Energy & Grid</span>
          </div>
          <div className="text-sm font-bold text-zinc-900 mt-1">Nuclear Off-Take PPAs</div>
          <div className="text-[10px] text-zinc-500 mt-0.5">Constellation &rarr; Microsoft (835 MW)</div>
        </div>
      </div>

      {/* Comprehensive Relationship Flow Table */}
      <div className="border border-zinc-200 rounded-lg bg-white overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="min-w-full text-xs text-left">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50 text-[10px] font-mono uppercase text-zinc-500 tracking-wider">
                <th className="py-2.5 px-4 font-semibold">Entity Origin</th>
                <th className="py-2.5 px-4 font-semibold">Relationship Nature</th>
                <th className="py-2.5 px-4 font-semibold">Target Counterparty</th>
                <th className="py-2.5 px-4 font-semibold">Effective Timeline</th>
                <th className="py-2.5 px-4 font-semibold">Verified Scope</th>
                <th className="py-2.5 px-4 font-semibold">Audit Level</th>
                <th className="py-2.5 px-4 font-semibold text-right">Statutory Citation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {relationships.map((rel) => {
                const source = rel.sources?.[0]?.source;

                return (
                  <tr key={rel.id} className="hover:bg-zinc-50/70 transition-colors">
                    {/* From Entity */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <Link
                        href={`/companies/${rel.from_company?.slug}`}
                        className="font-bold text-zinc-950 hover:text-blue-600 transition-colors"
                      >
                        {rel.from_company?.name}
                      </Link>
                      <span className="block text-[10px] font-mono text-zinc-400">
                        {rel.from_company?.company_type.replace(/_/g, ' ')}
                      </span>
                    </td>

                    {/* Relationship Type */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="font-mono text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-zinc-100 text-zinc-800">
                        {rel.relationship_type.replace(/_/g, ' ')}
                      </span>
                    </td>

                    {/* To Entity */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <Link
                        href={`/companies/${rel.to_company?.slug}`}
                        className="font-bold text-zinc-950 hover:text-blue-600 transition-colors"
                      >
                        {rel.to_company?.name}
                      </Link>
                      <span className="block text-[10px] font-mono text-zinc-400">
                        {rel.to_company?.company_type.replace(/_/g, ' ')}
                      </span>
                    </td>

                    {/* Timeline */}
                    <td className="py-3 px-4 whitespace-nowrap font-mono text-[11px] text-zinc-500">
                      {rel.start_date || 'Ongoing'}
                    </td>

                    {/* Scope */}
                    <td className="py-3 px-4 text-zinc-600 max-w-sm leading-normal">
                      {rel.description}
                    </td>

                    {/* Audit */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <EvidenceBadge level={rel.evidence_level} size="sm" />
                    </td>

                    {/* Primary Source */}
                    <td className="py-3 px-4 whitespace-nowrap text-right">
                      {source ? (
                        <a
                          href={source.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-mono text-[11px] text-blue-600 hover:underline inline-flex items-center gap-1"
                        >
                          <span>{source.publisher || 'Filing'}</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      ) : (
                        <span className="text-zinc-300 font-mono">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
