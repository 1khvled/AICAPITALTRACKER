import React from 'react';
import { EvidenceLevel } from '../lib/types';

interface EvidenceBadgeProps {
  level: EvidenceLevel;
  className?: string;
  size?: 'sm' | 'default';
}

/**
 * Single badge for every evidence tier. Geometry lives in the shared `.pill`
 * primitive; only the tone changes per level, so badges stay identical in
 * shape across the ledger, relationship map and search results.
 *
 * Each tier ships a screen-reader sentence alongside its short label: the
 * `title` tooltip is pointer-only and unreachable by touch or keyboard, so the
 * audit meaning would otherwise be lost to assistive tech.
 */
const TIERS: Record<
  EvidenceLevel,
  { tone: string; dot: string; label: string; title: string; srSuffix: string }
> = {
  confirmed_primary: {
    tone: 'pill-mint',
    dot: 'bg-emerald-600',
    label: 'Primary Filing',
    title:
      'PRIMARY AUDIT: Sourced directly from statutory regulatory filings (SEC 10-K, 10-Q, 8-K) or official company investor releases.',
    srSuffix: 'sourced directly from a statutory regulatory filing or official investor release',
  },
  reported_secondary: {
    tone: 'pill-sky',
    dot: 'bg-sky-600',
    label: 'Secondary Report',
    title:
      'SECONDARY REPORT: Corroborated by tier-1 financial journalism (Reuters, Bloomberg, FT) citing term sheets or participating syndicate lenders.',
    srSuffix: 'corroborated by tier-1 financial journalism',
  },
  announced_not_completed: {
    tone: 'pill-amber',
    dot: 'bg-amber-500',
    label: 'Announced (Pending)',
    title:
      'PENDING / ANNOUNCED: Publicly announced commitment or non-binding framework; closing conditions or final funding tranches pending.',
    srSuffix: 'publicly announced but not yet closed; closing conditions pending',
  },
  estimated: {
    tone: 'pill-violet',
    dot: 'bg-violet-500',
    label: 'Estimated',
    title:
      'ANALYST ESTIMATE: Independent benchmark valuation or calculated estimate; not officially confirmed by counterparties.',
    srSuffix: 'analyst estimate, not officially confirmed by counterparties',
  },
  disputed: {
    tone: 'pill-rose',
    dot: 'bg-rose-600',
    label: 'Disputed',
    title:
      'DISPUTED: Counterparties offer conflicting accounts or terms are legally contested.',
    srSuffix: 'counterparties conflict or the terms are legally contested',
  },
  superseded: {
    tone: 'pill-neutral',
    dot: 'bg-zinc-500',
    label: 'Superseded',
    title:
      'SUPERSEDED: Replaced or amended by a subsequent debt extension or financing restructuring.',
    srSuffix: 'replaced or amended by a later restructuring',
  },
};

export function EvidenceBadge({ level, className = '', size = 'default' }: EvidenceBadgeProps) {
  const isSm = size === 'sm';
  const tier = TIERS[level];
  const base = `pill ${isSm ? 'px-2 text-[10px]' : 'text-[11px]'} ${tier.tone} ${className}`.trim();

  return (
    <span className={base} title={tier.title}>
      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${tier.dot}`} aria-hidden="true" />
      {tier.label}
      <span className="sr-only"> — {tier.srSuffix}</span>
    </span>
  );
}