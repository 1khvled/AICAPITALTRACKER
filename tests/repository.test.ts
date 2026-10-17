import { describe, it, expect } from 'vitest';
import { DataRepository } from '../src/lib/data/db';

describe('Data Repository', () => {
  it('loads verified deals correctly', async () => {
    const deals = await DataRepository.getDeals();
    expect(deals.length).toBeGreaterThan(0);

    const msftDeal = deals.find((d) => d.slug.includes('microsoft-openai'));
    expect(msftDeal).toBeDefined();
    expect(msftDeal?.evidence_level).toBe('confirmed_primary');
    expect(msftDeal?.sources?.length).toBeGreaterThan(0);
  });

  it('filters deals by dealType', async () => {
    const debtDeals = await DataRepository.getDeals({ dealType: 'debt_credit_facility' });
    expect(debtDeals.length).toBeGreaterThan(0);
    expect(debtDeals.every((d) => d.deal_type === 'debt_credit_facility')).toBe(true);
  });

  it('filters deals by free text query', async () => {
    const results = await DataRepository.getDeals({ query: 'CoreWeave' });
    expect(results.length).toBeGreaterThan(0);
    expect(
      results.some(
        (d) =>
          d.title.includes('CoreWeave') ||
          d.parties?.some((p) => p.company?.name.includes('CoreWeave'))
      )
    ).toBe(true);
  });

  it('retrieves single deal by slug', async () => {
    const deal = await DataRepository.getDealBySlug('coreweave-2-3-billion-gpu-collateralized-debt-facility');
    expect(deal).toBeDefined();
    expect(deal?.slug).toBe('coreweave-2-3-billion-gpu-collateralized-debt-facility');
    expect(deal?.amount_value).toBe(2300000000);
  });

  it('retrieves company by slug and its related counterparties', async () => {
    const company = await DataRepository.getCompanyBySlug('nvidia');
    expect(company).toBeDefined();
    expect(company?.name).toBe('NVIDIA Corporation');
    expect(company?.ticker).toBe('NVDA');

    const relationships = await DataRepository.getRelationships('nvidia');
    expect(relationships.length).toBeGreaterThan(0);
  });

  it('embeds the correct company for every deal party (FK integrity)', async () => {
    const deals = await DataRepository.getDeals();
    expect(deals.length).toBeGreaterThan(0);
    for (const deal of deals) {
      for (const party of deal.parties ?? []) {
        expect(party.company).toBeDefined();
        expect(party.company?.id).toBe(party.company_id);
      }
    }
  });

  it('embeds the correct companies for every relationship (FK integrity)', async () => {
    const relationships = await DataRepository.getRelationships();
    expect(relationships.length).toBeGreaterThan(0);
    for (const rel of relationships) {
      expect(rel.from_company).toBeDefined();
      expect(rel.to_company).toBeDefined();
      expect(rel.from_company?.id).toBe(rel.from_company_id);
      expect(rel.to_company?.id).toBe(rel.to_company_id);
    }
  });

  it('filters deals by companySlug via company_id fallback and getDealsByCompanyId', async () => {
    const bySlug = await DataRepository.getDeals({ companySlug: 'nvidia' });
    expect(bySlug.length).toBeGreaterThan(0);
    expect(
      bySlug.every((d) => d.parties?.some((p) => p.company?.slug === 'nvidia'))
    ).toBe(true);

    const nvidia = await DataRepository.getCompanyBySlug('nvidia');
    expect(nvidia).toBeDefined();
    const byId = await DataRepository.getDealsByCompanyId(nvidia!.id);
    expect(byId.length).toBeGreaterThan(0);
    expect(byId.every((d) => d.parties?.some((p) => p.company_id === nvidia!.id))).toBe(true);
  });

  it('only returns published deals', async () => {
    const deals = await DataRepository.getDeals();
    expect(deals.every((d) => d.is_published !== false)).toBe(true);
  });

  it('calculates platform metrics accurately', async () => {
    const metrics = await DataRepository.getPlatformMetrics();
    expect(metrics.totalDeals).toBeGreaterThan(0);
    expect(metrics.totalCompanies).toBeGreaterThan(0);
    expect(metrics.totalDisclosedVolume).toBeGreaterThan(0);
  });
});
