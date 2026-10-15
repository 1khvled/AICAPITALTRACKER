import React from 'react';
import { EvidenceLevel } from '../lib/types';

interface EvidenceBadgeProps {
  level: EvidenceLevel;
  className?: string;
}

export function EvidenceBadge({ level, className = '' }: EvidenceBadgeProps) {
  switch (level) {
    case 'confirmed_primary':
      return (
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800 ${className}`}
          title="Verified against official primary documents (SEC Form 10-K/10-Q/8-K or official company IR release)"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5" />
          Confirmed Primary
        </span>
      );
    case 'reported_secondary':
      return (
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-800 border border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800 ${className}`}
          title="Reported by verified reputable financial press (Reuters, Bloomberg, FT, etc.)"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mr-1.5" />
          Reported Secondary
        </span>
      );
    case 'announced_not_completed':
      return (
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800 ${className}`}
          title="Announced commitment or proposal not yet finalized or closed"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1.5" />
          Announced (Pending)
        </span>
      );
    case 'estimated':
      return (
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-50 text-purple-800 border border-purple-200 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-800 ${className}`}
          title="Analyst or industry estimate; not confirmed by parties"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-purple-500 mr-1.5" />
          Estimated
        </span>
      );
    case 'disputed':
      return (
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-rose-50 text-rose-800 border border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800 ${className}`}
          title="Disputed or conflicting reports among parties"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mr-1.5" />
          Disputed
        </span>
      );
    case 'superseded':
      return (
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700 border border-gray-300 dark:bg-gray-800 dark:text-gray-300 ${className}`}
          title="Superseded or amended by newer transaction"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-gray-400 mr-1.5" />
          Superseded
        </span>
      );
  }
}
