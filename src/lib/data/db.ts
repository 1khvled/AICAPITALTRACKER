import { Company, Deal, Relationship, Source, SourceRegistry } from '../types';
import {
  VERIFIED_COMPANIES,
  VERIFIED_DEALS,
  VERIFIED_RELATIONSHIPS,
  VERIFIED_SOURCES,
  INITIAL_SOURCE_REGISTRY,
} from './dataset';
import {
  EXTRA_COMPANIES as SWEEP_CLOUD_COMPANIES,
  EXTRA_SOURCES as SWEEP_CLOUD_SOURCES,
  EXTRA_DEALS as SWEEP_CLOUD_DEALS,
  EXTRA_RELATIONSHIPS as SWEEP_CLOUD_RELS,
} from './sweep-cloud';
import {
  EXTRA_COMPANIES as SWEEP_DEBT_COMPANIES,
  EXTRA_SOURCES as SWEEP_DEBT_SOURCES,
  EXTRA_DEALS as SWEEP_DEBT_DEALS,
  EXTRA_RELATIONSHIPS as SWEEP_DEBT_RELS,
} from './sweep-debt';
import {
  EXTRA_COMPANIES as SWEEP_DEBT2_COMPANIES,
  EXTRA_SOURCES as SWEEP_DEBT2_SOURCES,
  EXTRA_DEALS as SWEEP_DEBT2_DEALS,
  EXTRA_RELATIONSHIPS as SWEEP_DEBT2_RELS,
} from './sweep-debt2';
import {
  EXTRA_COMPANIES as SWEEP_BIGTECH_DEBT_COMPANIES,
  EXTRA_SOURCES as SWEEP_BIGTECH_DEBT_SOURCES,
  EXTRA_DEALS as SWEEP_BIGTECH_DEBT_DEALS,
  EXTRA_RELATIONSHIPS as SWEEP_BIGTECH_DEBT_RELS,
} from './sweep-bigtech-debt';
import {
  EXTRA_COMPANIES as SWEEP_EQUITY2_COMPANIES,
  EXTRA_SOURCES as SWEEP_EQUITY2_SOURCES,
  EXTRA_DEALS as SWEEP_EQUITY2_DEALS,
  EXTRA_RELATIONSHIPS as SWEEP_EQUITY2_RELS,
} from './sweep-equity2';
import {
  EXTRA_COMPANIES as SWEEP_STOCK_COMPANIES,
  EXTRA_SOURCES as SWEEP_STOCK_SOURCES,
  EXTRA_DEALS as SWEEP_STOCK_DEALS,
  EXTRA_RELATIONSHIPS as SWEEP_STOCK_RELS,
} from './sweep-stock-sales';
import {
  EXTRA_COMPANIES as SWEEP_LABS_COMPANIES,
  EXTRA_SOURCES as SWEEP_LABS_SOURCES,
  EXTRA_DEALS as SWEEP_LABS_DEALS,
  EXTRA_RELATIONSHIPS as SWEEP_LABS_RELS,
} from './sweep-labs';
import {
  EXTRA_COMPANIES as SWEEP_POWER_COMPANIES,
  EXTRA_SOURCES as SWEEP_POWER_SOURCES,
  EXTRA_DEALS as SWEEP_POWER_DEALS,
  EXTRA_RELATIONSHIPS as SWEEP_POWER_RELS,
} from './sweep-power';
import {
  EXTRA_COMPANIES as SWEEP_STAKES_COMPANIES,
  EXTRA_SOURCES as SWEEP_STAKES_SOURCES,
  EXTRA_DEALS as SWEEP_STAKES_DEALS,
  EXTRA_RELATIONSHIPS as SWEEP_STAKES_RELS,
} from './sweep-stakes';
import {
  EXTRA_COMPANIES as SWEEP_CLOUD2_COMPANIES,
  EXTRA_SOURCES as SWEEP_CLOUD2_SOURCES,
  EXTRA_DEALS as SWEEP_CLOUD2_DEALS,
  EXTRA_RELATIONSHIPS as SWEEP_CLOUD2_RELS,
} from './sweep-cloud2';
import {
  EXTRA_COMPANIES as SWEEP_BACKSTOPS_COMPANIES,
  EXTRA_SOURCES as SWEEP_BACKSTOPS_SOURCES,
  EXTRA_DEALS as SWEEP_BACKSTOPS_DEALS,
  EXTRA_RELATIONSHIPS as SWEEP_BACKSTOPS_RELS,
} from './sweep-backstops';
import {
  EXTRA_COMPANIES as SWEEP_MA_COMPANIES,
  EXTRA_SOURCES as SWEEP_MA_SOURCES,
  EXTRA_DEALS as SWEEP_MA_DEALS,
  EXTRA_RELATIONSHIPS as SWEEP_MA_RELS,
} from './sweep-ma';
import {
  EXTRA_COMPANIES as SWEEP_MA2_COMPANIES,
  EXTRA_SOURCES as SWEEP_MA2_SOURCES,
  EXTRA_DEALS as SWEEP_MA2_DEALS,
  EXTRA_RELATIONSHIPS as SWEEP_MA2_RELS,
} from './sweep-ma2';
import {
  EXTRA_COMPANIES as SWEEP_NVDA2_COMPANIES,
  EXTRA_SOURCES as SWEEP_NVDA2_SOURCES,
  EXTRA_DEALS as SWEEP_NVDA2_DEALS,
  EXTRA_RELATIONSHIPS as SWEEP_NVDA2_RELS,
} from './sweep-nvda2';
import {
  EXTRA_COMPANIES as SWEEP_RAISES2_COMPANIES,
  EXTRA_SOURCES as SWEEP_RAISES2_SOURCES,
  EXTRA_DEALS as SWEEP_RAISES2_DEALS,
  EXTRA_RELATIONSHIPS as SWEEP_RAISES2_RELS,
} from './sweep-raises2';
import {
  EXTRA_COMPANIES as SWEEP_MA3_COMPANIES,
  EXTRA_SOURCES as SWEEP_MA3_SOURCES,
  EXTRA_DEALS as SWEEP_MA3_DEALS,
  EXTRA_RELATIONSHIPS as SWEEP_MA3_RELS,
} from './sweep-ma3';

// ---------------------------------------------------------------------------
// Unified verified store: base dataset plus independently-verified sweep
// tranches (cloud contracts, debt, labs equity, power, stakes, backstops, M&A).
// Sweep modules only ADD rows with reserved ID blocks, so concatenation is
// collision-free.
// ---------------------------------------------------------------------------
const ALL_COMPANIES: Company[] = [
  ...VERIFIED_COMPANIES,
  ...SWEEP_CLOUD_COMPANIES,
  ...SWEEP_DEBT_COMPANIES,
  ...SWEEP_DEBT2_COMPANIES,
  ...SWEEP_BIGTECH_DEBT_COMPANIES,
  ...SWEEP_EQUITY2_COMPANIES,
  ...SWEEP_STOCK_COMPANIES,
  ...SWEEP_LABS_COMPANIES,
  ...SWEEP_POWER_COMPANIES,
  ...SWEEP_STAKES_COMPANIES,
  ...SWEEP_CLOUD2_COMPANIES,
  ...SWEEP_BACKSTOPS_COMPANIES,
  ...SWEEP_MA_COMPANIES,
  ...SWEEP_MA2_COMPANIES,
  ...SWEEP_NVDA2_COMPANIES,
  ...SWEEP_RAISES2_COMPANIES,
  ...SWEEP_MA3_COMPANIES,
];

const ALL_SOURCES: Source[] = [
  ...VERIFIED_SOURCES,
  ...SWEEP_CLOUD_SOURCES,
  ...SWEEP_DEBT_SOURCES,
  ...SWEEP_DEBT2_SOURCES,
  ...SWEEP_BIGTECH_DEBT_SOURCES,
  ...SWEEP_EQUITY2_SOURCES,
  ...SWEEP_STOCK_SOURCES,
  ...SWEEP_LABS_SOURCES,
  ...SWEEP_POWER_SOURCES,
  ...SWEEP_STAKES_SOURCES,
  ...SWEEP_CLOUD2_SOURCES,
  ...SWEEP_BACKSTOPS_SOURCES,
  ...SWEEP_MA_SOURCES,
  ...SWEEP_MA2_SOURCES,
  ...SWEEP_NVDA2_SOURCES,
  ...SWEEP_RAISES2_SOURCES,
  ...SWEEP_MA3_SOURCES,
];

const ALL_DEALS: Deal[] = [
  ...VERIFIED_DEALS,
  ...SWEEP_CLOUD_DEALS,
  ...SWEEP_DEBT_DEALS,
  ...SWEEP_DEBT2_DEALS,
  ...SWEEP_BIGTECH_DEBT_DEALS,
  ...SWEEP_EQUITY2_DEALS,
  ...SWEEP_STOCK_DEALS,
  ...SWEEP_LABS_DEALS,
  ...SWEEP_POWER_DEALS,
  ...SWEEP_STAKES_DEALS,
  ...SWEEP_CLOUD2_DEALS,
  ...SWEEP_BACKSTOPS_DEALS,
  ...SWEEP_MA_DEALS,
  ...SWEEP_MA2_DEALS,
  ...SWEEP_NVDA2_DEALS,
  ...SWEEP_RAISES2_DEALS,
  ...SWEEP_MA3_DEALS,
];

const ALL_RELATIONSHIPS: Relationship[] = [
  ...VERIFIED_RELATIONSHIPS,
  ...SWEEP_CLOUD_RELS,
  ...SWEEP_DEBT_RELS,
  ...SWEEP_DEBT2_RELS,
  ...SWEEP_BIGTECH_DEBT_RELS,
  ...SWEEP_EQUITY2_RELS,
  ...SWEEP_STOCK_RELS,
  ...SWEEP_LABS_RELS,
  ...SWEEP_POWER_RELS,
  ...SWEEP_STAKES_RELS,
  ...SWEEP_CLOUD2_RELS,
  ...SWEEP_BACKSTOPS_RELS,
  ...SWEEP_MA_RELS,
  ...SWEEP_MA2_RELS,
  ...SWEEP_NVDA2_RELS,
  ...SWEEP_RAISES2_RELS,
  ...SWEEP_MA3_RELS,
];

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

export interface RelationshipFilterParams {
  companySlug?: string;
  query?: string;
  relationshipType?: string;
}

export interface SourceFilterParams {
  query?: string;
}

// ---------------------------------------------------------------------------
// In-memory cache with TTL.
//
// `dataset.ts` plus sweep tranches (~85 deals + 72 companies) is imported fresh per request
// in dev, and every page hit re-ran filter + sort + aggregation from scratch.
// The homepage was worst: getPlatformMetrics() internally re-fetched deals,
// companies, relationships and sources on top of the page's own getDeals() /
// getCompanies() calls. Module-level caching collapses repeat hits within the
// TTL to a Map lookup. Safe for dev + single-instance prod; data only changes
// on redeploy.
// ---------------------------------------------------------------------------
const CACHE_TTL_MS = 60_000;

interface CacheEntry {
  expiresAt: number;
  data: unknown;
}

const cache = new Map<string, CacheEntry>();

function cacheGet<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  return entry.data as T;
}

function cacheSet<T>(key: string, data: T): T {
  cache.set(key, { expiresAt: Date.now() + CACHE_TTL_MS, data });
  return data;
}

/** Test hook: clears the repository cache. */
export function clearRepositoryCache(): void {
  cache.clear();
}

export class DataRepository {
  /**
   * Retrieves verified deals with search and filtering
   */
  public static async getDeals(filters: DealFilterParams = {}): Promise<Deal[]> {
    const cacheKey = `deals:${JSON.stringify(filters)}`;
    const cached = cacheGet<Deal[]>(cacheKey);
    // Return a shallow copy so callers can't mutate the cached ordering.
    if (cached) return [...cached];
    // If Supabase is available and reachable, we could query it
    // For universal reliability and static/SSR performance, start with verified store
    // Only return published deals (is_published !== false preserves legacy rows).
    let results = ALL_DEALS.filter((d) => d.is_published !== false);

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
      const company = ALL_COMPANIES.find((c) => c.slug === filters.companySlug);
      const companyId = company?.id;
      results = results.filter((d) =>
        d.parties?.some(
          (p) => p.company?.slug === filters.companySlug || (companyId !== undefined && p.company_id === companyId)
        )
      );
    }

    if (filters.query && filters.query.trim() !== '') {
      const q = filters.query.toLowerCase().trim();
      results = results.filter(
        (d) =>
          d.title.toLowerCase().includes(q) ||
          d.summary.toLowerCase().includes(q) ||
          (d.geography && d.geography.toLowerCase().includes(q)) ||
          d.parties?.some((p) => p.company?.name.toLowerCase().includes(q)) ||
          d.sources?.some(
            (s) =>
              s.source?.title.toLowerCase().includes(q) ||
              s.supporting_note.toLowerCase().includes(q)
          )
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

    cacheSet(cacheKey, results);
    return [...results];
  }

  /**
   * Retrieves single deal by unique slug (published only)
   */
  public static async getDealBySlug(slug: string): Promise<Deal | null> {
    const deal = ALL_DEALS.find((d) => d.slug === slug && d.is_published !== false);
    return deal || null;
  }

  /**
   * Retrieves all published deals involving a company UUID.
   */
  public static async getDealsByCompanyId(companyId: string): Promise<Deal[]> {
    return ALL_DEALS.filter(
      (d) => d.is_published !== false && d.parties?.some((p) => p.company_id === companyId)
    );
  }

  /**
   * Retrieves companies with search and filtering
   */
  public static async getCompanies(filters: CompanyFilterParams = {}): Promise<Company[]> {
    const cacheKey = `companies:${JSON.stringify(filters)}`;
    const cached = cacheGet<Company[]>(cacheKey);
    if (cached) return [...cached];

    let results = [...ALL_COMPANIES];

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
    cacheSet(cacheKey, results);
    return [...results];
  }

  /**
   * Retrieves company by unique slug
   */
  public static async getCompanyBySlug(slug: string): Promise<Company | null> {
    const company = ALL_COMPANIES.find((c) => c.slug === slug);
    return company || null;
  }

  /**
   * Retrieves relationships with counterparty details.
   * Accepts either a company slug (legacy positional form) or a filter object
   * supporting company slug + free-text query + relationship type.
   */
  public static async getRelationships(
    companySlugOrFilters?: string | RelationshipFilterParams
  ): Promise<Relationship[]> {
    const filters: RelationshipFilterParams =
      typeof companySlugOrFilters === 'string'
        ? { companySlug: companySlugOrFilters }
        : (companySlugOrFilters ?? {});
    const cacheKey = `relationships:${JSON.stringify(filters)}`;
    const cached = cacheGet<Relationship[]>(cacheKey);
    if (cached) return [...cached];

    let results = ALL_RELATIONSHIPS.filter((r) => r.is_published !== false);

    const companySlug = filters.companySlug;
    if (companySlug) {
      const company = ALL_COMPANIES.find((c) => c.slug === companySlug);
      const companyId = company?.id;
      results = results.filter(
        (r) =>
          r.from_company?.slug === companySlug ||
          r.to_company?.slug === companySlug ||
          (companyId !== undefined &&
            (r.from_company_id === companyId || r.to_company_id === companyId))
      );
    }

    if (filters.relationshipType && filters.relationshipType !== 'all') {
      results = results.filter((r) => r.relationship_type === filters.relationshipType);
    }

    if (filters.query && filters.query.trim() !== '') {
      const q = filters.query.toLowerCase().trim();
      results = results.filter(
        (r) =>
          (r.description && r.description.toLowerCase().includes(q)) ||
          r.relationship_type.replace(/_/g, ' ').includes(q) ||
          r.from_company?.name.toLowerCase().includes(q) ||
          r.to_company?.name.toLowerCase().includes(q)
      );
    }

    cacheSet(cacheKey, results);
    return [...results];
  }

  /**
   * Retrieves sources and citations, optionally filtered by free-text query.
   */
  public static async getSources(filters: SourceFilterParams = {}): Promise<Source[]> {
    const cacheKey = `sources:${JSON.stringify(filters)}`;
    const cached = cacheGet<Source[]>(cacheKey);
    if (cached) return [...cached];

    let results = [...ALL_SOURCES];

    if (filters.query && filters.query.trim() !== '') {
      const q = filters.query.toLowerCase().trim();
      results = results.filter(
        (s) =>
          s.title.toLowerCase().includes(q) ||
          (s.publisher && s.publisher.toLowerCase().includes(q)) ||
          (s.notes && s.notes.toLowerCase().includes(q)) ||
          s.source_type.replace(/_/g, ' ').includes(q)
      );
    }

    cacheSet(cacheKey, results);
    return [...results];
  }

  /**
   * Retrieves source registry entries, optionally filtered by free-text query.
   */
  public static async getSourceRegistry(filters: SourceFilterParams = {}): Promise<SourceRegistry[]> {
    const cacheKey = `registry:${JSON.stringify(filters)}`;
    const cached = cacheGet<SourceRegistry[]>(cacheKey);
    if (cached) return [...cached];

    let results = [...INITIAL_SOURCE_REGISTRY];

    if (filters.query && filters.query.trim() !== '') {
      const q = filters.query.toLowerCase().trim();
      results = results.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          r.base_url.toLowerCase().includes(q) ||
          r.source_category.replace(/_/g, ' ').includes(q)
      );
    }

    cacheSet(cacheKey, results);
    return [...results];
  }

  /**
   * Summary metrics for platform overview.
   * Cached for 60s and computed in parallel: previously every homepage hit
   * re-ran four full scans sequentially on top of the page's own queries.
   */
  public static async getPlatformMetrics() {
    const cached = cacheGet<{
      totalDeals: number;
      totalCompanies: number;
      totalRelationships: number;
      totalSources: number;
      totalDisclosedVolume: number;
      lastUpdated: string;
    }>('metrics');
    if (cached) return cached;

    const [deals, companies, relationships, sources] = await Promise.all([
      this.getDeals(),
      this.getCompanies(),
      this.getRelationships(),
      this.getSources(),
    ]);

    const totalDisclosedVolume = deals.reduce((acc, d) => acc + (d.amount_value || 0), 0);

    const metrics = {
      totalDeals: deals.length,
      totalCompanies: companies.length,
      totalRelationships: relationships.length,
      totalSources: sources.length,
      totalDisclosedVolume,
      lastUpdated: new Date().toISOString(),
    };
    cacheSet('metrics', metrics);
    return metrics;
  }
}
