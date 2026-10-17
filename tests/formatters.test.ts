import { describe, it, expect } from 'vitest';
import { formatCurrency, formatDealType } from '../src/lib/formatters';

describe('Currency & Deal-Type Formatters', () => {
  it('formats sub-million USD amounts with the $ symbol', () => {
    expect(formatCurrency(500000, 'USD')).toContain('$');
  });

  it('formats sub-million EUR amounts with the € symbol', () => {
    expect(formatCurrency(500000, 'EUR')).toContain('€');
  });

  it('formats sub-million GBP amounts with the £ symbol', () => {
    expect(formatCurrency(500000, 'GBP')).toContain('£');
  });

  it('returns "Not disclosed" for null amounts', () => {
    expect(formatCurrency(null)).toBe('Not disclosed');
  });

  it('abbreviates billions with a B suffix', () => {
    expect(formatCurrency(2500000000)).toBe('$2.50B');
    expect(formatCurrency(10000000000)).toBe('$10B');
  });

  it('abbreviates millions with an M suffix', () => {
    expect(formatCurrency(2300000000 / 1000)).toBe('$2.3M');
  });

  it('humanizes snake_case deal types', () => {
    expect(formatDealType('debt_credit_facility')).toBe('Debt Credit Facility');
    expect(formatDealType('power_purchase_agreement')).toBe('Power Purchase Agreement');
  });
});
