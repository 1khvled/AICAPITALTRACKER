import { describe, it, expect } from 'vitest';
import { DealFormSchema } from '../src/lib/validation/deal';

const baseValidDeal = {
  title: 'NVIDIA Equity and Hardware Commitment in AI Infrastructure',
  slug: 'nvidia-equity-hardware-commitment',
  summary: 'Strategic hardware and equity commitment across high-density GPU superclusters.',
  deal_type: 'equity_investment' as const,
  status: 'closed' as const,
  evidence_level: 'confirmed_primary' as const,
  confidence_note: 'Confirmed by primary company release.',
  announcement_date: '2024-01-10',
  effective_date: '2024-01-15',
  amount_disclosed: true,
  amount_value: 500000000,
  amount_currency: 'USD',
  amount_basis: 'cash_investment' as const,
  is_published: true,
  parties: [
    { company_id: '00000000-0000-0000-0000-000000000001', role: 'investor' as const },
    { company_id: '00000000-0000-0000-0000-000000000002', role: 'investee' as const },
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

describe('Data integrity validation', () => {
  it('rejects non-UUID company_id', () => {
    const result = DealFormSchema.safeParse({
      ...baseValidDeal,
      parties: [
        { company_id: 'nvidia', role: 'investor' as const },
        { company_id: '00000000-0000-0000-0000-000000000002', role: 'investee' as const },
      ],
    });
    expect(result.success).toBe(false);
  });

  it('rejects unparsable dates', () => {
    const result = DealFormSchema.safeParse({
      ...baseValidDeal,
      announcement_date: 'not-a-date',
    });
    expect(result.success).toBe(false);
  });

  it('rejects lowercase currency codes', () => {
    const result = DealFormSchema.safeParse({
      ...baseValidDeal,
      amount_currency: 'usd',
    });
    expect(result.success).toBe(false);
  });

  it('rejects a deal with a single party', () => {
    const result = DealFormSchema.safeParse({
      ...baseValidDeal,
      parties: [{ company_id: '00000000-0000-0000-0000-000000000001', role: 'investor' as const }],
    });
    expect(result.success).toBe(false);
  });

  it('rejects duplicate company_id + role pairs', () => {
    const result = DealFormSchema.safeParse({
      ...baseValidDeal,
      parties: [
        { company_id: '00000000-0000-0000-0000-000000000001', role: 'investor' as const },
        { company_id: '00000000-0000-0000-0000-000000000001', role: 'investor' as const },
      ],
    });
    expect(result.success).toBe(false);
  });

  it('rejects SSRF-style source URLs (localhost / private ranges)', () => {
    const badUrls = [
      'http://localhost:3000/api',
      'http://127.0.0.1:8080/metrics',
      'https://10.0.0.5/internal',
      'https://172.16.0.10/database',
      'https://192.168.1.1/admin',
      'http://169.254.169.254/latest/meta-data/',
      'http://0.0.0.0/admin',
    ];
    for (const url of badUrls) {
      const result = DealFormSchema.safeParse({
        ...baseValidDeal,
        sources: [
          {
            url,
            title: 'Internal doc',
            source_type: 'company_release' as const,
            supporting_note: 'Confirms the test fact for SSRF checks.',
            is_primary_support: false,
          },
        ],
      });
      expect(result.success, `expected rejection for ${url}`).toBe(false);
    }
  });

  it('requires confidence_note when evidence is estimated or disputed', () => {
    for (const level of ['estimated', 'disputed'] as const) {
      const result = DealFormSchema.safeParse({
        ...baseValidDeal,
        evidence_level: level,
        confidence_note: '',
      });
      expect(result.success, `expected rejection for ${level} without note`).toBe(false);
    }
    const ok = DealFormSchema.safeParse({
      ...baseValidDeal,
      evidence_level: 'estimated' as const,
      confidence_note: 'Estimate triangulated from two secondary reports.',
    });
    expect(ok.success).toBe(true);
  });

  it('rejects over-long slugs', () => {
    const result = DealFormSchema.safeParse({
      ...baseValidDeal,
      slug: `${'a'.repeat(60)}-${'b'.repeat(60)}-c`,
    });
    expect(result.success).toBe(false);
  });
});
