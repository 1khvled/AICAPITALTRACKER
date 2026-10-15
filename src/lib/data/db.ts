import { Company, Deal, Relationship, Source, SourceRegistry, DiscoveryCandidate } from '../types';
import {
  VERIFIED_COMPANIES,
  VERIFIED_DEALS,
  VERIFIED_RELATIONSHIPS,
  VERIFIED_SOURCES,
  INITIAL_SOURCE_REGISTRY,
} from './dataset';
import { createClient } from '../supabase/client';

export interface DealFilterParams {
  dealType?: string;
  status?: string;
  evidenceLevel?: string;
  companySlug?: string;
  query?: string;
  sort?: 'date_desc' | 'date_asc' | 'amount_desc' | 'amount_asc';
}

export interface CompanyFilterParams {
  companyType?: string;
  isPublic?: boolean;
  query?: string;
}

export class DataRepository {
  /**
   * Retrieves verified deals with search and filtering
   */
  public static async getDeals(filters: DealFilterParams = {}): Promise<Deal[]> {
    // If Supabase is available and reachable, we could query it
    // For universal reliability and static/SSR performance, start with verified store
    let results = [...VERIFIED_DEALS];

    if (filters.dealType && filters.dealType !== 'all') {
      results = results.filter((d) => d.deal_type === filters.dealType);
    }

    if (filters.status && filters.status !== 'all') {
      results = results.filter((d) => d.status === filters.status);
    }

    if (filters.evidenceLevel && filters.evidenceLevel !== 'all') {
      results = results.filter((d) => d.evidence_level === filters.evidenceLevel);
    }

    if (filters.companySlug) {
      results = results.filter((d) =>
        d.parties?.some((p) => p.company?.slug === filters.companySlug)
      );
    }

    if (filters.query && filters.query.trim() !== '') {
      const q = filters.query.toLowerCase().trim();
      results = results.filter(
        (d) =>
          d.title.toLowerCase().includes(q) ||
          d.summary.toLowerCase().includes(q) ||
          d.parties?.some((p) => p.company?.name.toLowerCase().includes(q))
      );
    }

    // Sort
    results.sort((a, b) => {
      if (filters.sort === 'amount_desc') {
        return (b.amount_value || 0) - (a.amount_value || 0);
      }
      if (filters.sort === 'amount_asc') {
        return (a.amount_value || 0) - (b.amount_value || 0);
      }
      if (filters.sort === 'date_asc') {
        return (a.announcement_date || '').localeCompare(b.announcement_date || '');
      }
      // default: date_desc
      return (b.announcement_date || '').localeCompare(a.announcement_date || '');
    });

    return results;
  }

  /**
   * Retrieves single deal by unique slug
   */
  public static async getDealBySlug(slug: string): Promise<Deal | null> {
    const deal = VERIFIED_DEALS.find((d) => d.slug === slug);
    return deal || null;
  }

  /**
   * Retrieves companies with search and filtering
   */
  public static async getCompanies(filters: CompanyFilterParams = {}): Promise<Company[]> {
    let results = [...VERIFIED_COMPANIES];

    if (filters.companyType && filters.companyType !== 'all') {
      results = results.filter((c) => c.company_type === filters.companyType);
    }

    if (filters.isPublic !== undefined) {
      results = results.filter((c) => c.is_public === filters.isPublic);
    }

    if (filters.query && filters.query.trim() !== '') {
      const q = filters.query.toLowerCase().trim();
      results = results.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          (c.description && c.description.toLowerCase().includes(q)) ||
          (c.ticker && c.ticker.toLowerCase().includes(q)) ||
          c.aliases.some((a) => a.toLowerCase().includes(q))
      );
    }

    results.sort((a, b) => a.name.localeCompare(b.name));
    return results;
  }

  /**
   * Retrieves company by unique slug
   */
  public static async getCompanyBySlug(slug: string): Promise<Company | null> {
    const company = VERIFIED_COMPANIES.find((c) => c.slug === slug);
    return company || null;
  }

  /**
   * Retrieves relationships with counterparty details
   */
  public static async getRelationships(companySlug?: string): Promise<Relationship[]> {
    let results = [...VERIFIED_RELATIONSHIPS];

    if (companySlug) {
      results = results.filter(
        (r) => r.from_company?.slug === companySlug || r.to_company?.slug === companySlug
      );
    }

    return results;
  }

  /**
   * Retrieves sources and citations
   */
  public static async getSources(): Promise<Source[]> {
    return [...VERIFIED_SOURCES];
  }

  /**
   * Retrieves source registry entries
   */
  public static async getSourceRegistry(): Promise<SourceRegistry[]> {
    return [...INITIAL_SOURCE_REGISTRY];
  }

  /**
   * Summary metrics for platform overview
   */
  public static async getPlatformMetrics() {
    const deals = await this.getDeals();
    const companies = await this.getCompanies();
    const relationships = await this.getRelationships();
    const sources = await this.getSources();

    const totalDisclosedVolume = deals.reduce((acc, d) => acc + (d.amount_value || 0), 0);

    return {
      totalDeals: deals.length,
      totalCompanies: companies.length,
      totalRelationships: relationships.length,
      totalSources: sources.length,
      totalDisclosedVolume,
      lastUpdated: new Date().toISOString(),
    };
  }
}
