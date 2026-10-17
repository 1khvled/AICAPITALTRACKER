import { describe, it, expect } from 'vitest';
import { DealFormSchema } from '../src/lib/validation/deal';

describe('Deal Validation and Publish Integrity', () => {
  const baseValidDeal = {
    title: 'NVIDIA Equity and Hardware Commitment in AI Infrastructure',
    slug: 'nvidia-equity-hardware-commitment',
    summary: 'Strategic hardware and equity commitment across high-density GPU superclusters.',
    deal_type: 'equity_investment' as const,
    status: 'closed' as const,
    evidence_level: 'confirmed_primary' as const,
    announcement_date: '2024-01-10',
    effective_date: '2024-01-15',
    amount_disclosed: true,
    amount_value: 500000000,
    amount_currency: 'USD',
    amount_basis: 'cash_investment' as const,
    parties: [
      {
        company_id: '00000000-0000-0000-0000-000000000001',
        role: 'investor' as const,
      },
      {
        company_id: '00000000-0000-0000-0000-000000000002',
        role: 'investee' as const,
      },
    ],
    sources: [
      {
        url: 'https://news.nvidia.com/announcement',
        title: 'NVIDIA Official Statement',
        publisher: 'NVIDIA Corporation',
        source_type: 'company_release' as const,
        supporting_note: 'Confirms $500M investment and GPU delivery timeline.',
        is_primary_support: true,
      },
    ],
  };

  it('passes validation for a correctly formed published deal with a source', () => {
    const result = DealFormSchema.safeParse({
      ...baseValidDeal,
      is_published: true,
    });
    expect(result.success).toBe(true);
  });

  it('rejects publishing a deal when no sources are provided', () => {
    const result = DealFormSchema.safeParse({
      ...baseValidDeal,
      is_published: true,
      sources: [],
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find((i) => i.path.includes('sources'));
      expect(issue?.message).toContain('A published deal requires at least one verified source citation');
    }
  });

  it('allows saving an unpublished draft without sources', () => {
    const result = DealFormSchema.safeParse({
      ...baseValidDeal,
      is_published: false,
      sources: [],
    });
    expect(result.success).toBe(true);
  });

  it('rejects an undisclosed deal that includes an invented amount value', () => {
    const result = DealFormSchema.safeParse({
      ...baseValidDeal,
      amount_disclosed: false,
      amount_value: 120000000, // Fabricated amount while marked undisclosed
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find((i) => i.path.includes('amount_value'));
      expect(issue?.message).toContain('Undisclosed deals cannot have a fabricated amount value');
    }
  });

  it('rejects chronological date errors where effective date is before announcement date', () => {
    const result = DealFormSchema.safeParse({
      ...baseValidDeal,
      announcement_date: '2024-05-20',
      effective_date: '2024-05-10', // Invalid: earlier than announcement
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find((i) => i.path.includes('effective_date'));
      expect(issue?.message).toContain('Effective date cannot be prior to announcement date');
    }
  });
});
