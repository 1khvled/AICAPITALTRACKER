import type { DealType } from '@/lib/types';
import { formatDealType } from '@/lib/formatters';

/** Shared zero-dependency chart theme: one color per deal type. */
export const DEAL_TYPE_COLORS: Record<DealType, string> = {
  equity_investment: '#2563eb',
  debt_credit_facility: '#d97706',
  cloud_compute_contract: '#0d9488',
  infrastructure_project_finance: '#7c3aed',
  power_purchase_agreement: '#059669',
  acquisition: '#db2777',
  strategic_partnership: '#4f46e5',
  equipment_purchase: '#64748b',
  other: '#a3a3a3',
};

export const DEAL_TYPE_ORDER: DealType[] = [
  'equity_investment',
  'debt_credit_facility',
  'cloud_compute_contract',
  'infrastructure_project_finance',
  'power_purchase_agreement',
  'acquisition',
  'strategic_partnership',
  'equipment_purchase',
  'other',
];

export function dealTypeColor(dealType: string): string {
  return (DEAL_TYPE_COLORS as Record<string, string>)[dealType] ?? '#a3a3a3';
}

export function dealTypeLabel(dealType: string): string {
  return formatDealType(dealType);
}

/** Grey used for undisclosed-amount bubbles / nodes. */
export const UNDISCLOSED_FILL = '#d4d4d8';
export const UNDISCLOSED_STROKE = '#a1a1aa';
