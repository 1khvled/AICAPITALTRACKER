
import React from 'react';
import { EvidenceLevel } from '../lib/types';

interface EvidenceBadgeProps {
  level: EvidenceLevel;
  className?: string;
  size?: 'sm' | 'default';
}

export function EvidenceBadge({ level, className = '', size = 'default' }: EvidenceBadgeProps) {
  const isSm = size === 'sm';
  const py = isSm ? 'py-0.5' : 'py-1';
  const px = isSm ? 'px-2' : 'px-2.5';
  const textSize = isSm ? 'text-[10px]' : 'text-[11px]';

  switch (level) {
    case 'confirmed_primary':
      return (
        <span
          className={`inline-flex items-center gap-1.5 ${px} ${py} rounded border font-mono ${textSize} font-medium tracking-tight bg-emerald-500/10 text-emerald-800 border-emerald-600/25 ${className}`}
          title="PRIMARY AUDIT: Sourced directly from statutory regulatory filings (SEC 10-K, 10-Q, 8-K) or official company investor releases."
        >
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-600"></span>
          </span>
          Primary Filing
        </span>
      );
    case 'reported_secondary':
      return (
        <span
          className={`inline-flex items-center gap-1.5 ${px} ${py} rounded border font-mono ${textSize} font-medium tracking-tight bg-sky-500/10 text-sky-800 border-sky-600/25 ${className}`}
          title="SECONDARY REPORT: Corroborated by tier-1 financial journalism (Reuters, Bloomberg, FT) citing term sheets or participating syndicate lenders."
        >
          <span className="h-1.5 w-1.5 rounded-full bg-sky-600" />
          Secondary Report
        </span>
      );
    case 'announced_not_completed':
      return (
        <span
          className={`inline-flex items-center gap-1.5 ${px} ${py} rounded border font-mono ${textSize} font-medium tracking-tight bg-amber-500/10 text-amber-900 border-amber-600/25 ${className}`}
          title="PENDING / ANNOUNCED: Publicly announced commitment or non-binding framework; closing conditions or final funding tranches pending."
        >
          <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
          Announced (Pending)
        </span>
      );
    case 'estimated':
      return (
        <span
          className={`inline-flex items-center gap-1.5 ${px} ${py} rounded border font-mono ${textSize} font-medium tracking-tight bg-purple-500/10 text-purple-900 border-purple-600/25 ${className}`}
          title="ANALYST ESTIMATE: Independent benchmark valuation or calculated estimate; not officially confirmed by counterparties."
        >
          <span className="h-1.5 w-1.5 rounded-full bg-purple-500" />
          Estimated
        </span>
      );
    case 'disputed':
      return (
        <span
          className={`inline-flex items-center gap-1.5 ${px} ${py} rounded border font-mono ${textSize} font-medium tracking-tight bg-rose-500/10 text-rose-900 border-rose-600/25 ${className}`}
          title="DISPUTED: Counterparties offer conflicting accounts or terms are legally contested."
        >
          <span className="h-1.5 w-1.5 rounded-full bg-rose-600" />
          Disputed
        </span>
      );
    case 'superseded':
      return (
        <span
          className={`inline-flex items-center gap-1.5 ${px} ${py} rounded border font-mono ${textSize} font-medium tracking-tight bg-zinc-100 text-zinc-700 border-zinc-300 ${className}`}
          title="SUPERSEDED: Replaced or amended by a subsequent debt extension or financing restructuring."
        >
          <span className="h-1.5 w-1.5 rounded-full bg-zinc-400" />
          Superseded
        </span>
      );
  }
}
