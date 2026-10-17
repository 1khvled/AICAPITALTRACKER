import { MetadataRoute } from 'next';
import { DataRepository } from '../lib/data/db';

// Fixed fallback date so static sitemap output is deterministic.
const FALLBACK_LAST_MODIFIED = new Date('2026-10-16T00:00:00.000Z');

// /search is intentionally omitted (noindex query surface).
// /admin is intentionally omitted (private review workspace).

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://aicapitaltracker.com';

  const [deals, companies] = await Promise.all([
    DataRepository.getDeals(),
    DataRepository.getCompanies(),
  ]);

  const publishedDeals = deals.filter((deal) => deal.is_published !== false);

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/`,
      lastModified: FALLBACK_LAST_MODIFIED,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/deals`,
      lastModified: FALLBACK_LAST_MODIFIED,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/companies`,
      lastModified: FALLBACK_LAST_MODIFIED,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/relationships`,
      lastModified: FALLBACK_LAST_MODIFIED,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/visualize`,
      lastModified: FALLBACK_LAST_MODIFIED,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/sources`,
      lastModified: FALLBACK_LAST_MODIFIED,
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/methodology`,
      lastModified: FALLBACK_LAST_MODIFIED,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: FALLBACK_LAST_MODIFIED,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/corrections`,
      lastModified: FALLBACK_LAST_MODIFIED,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: FALLBACK_LAST_MODIFIED,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: FALLBACK_LAST_MODIFIED,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: FALLBACK_LAST_MODIFIED,
      changeFrequency: 'yearly',
      priority: 0.4,
    },
  ];

  const dealRoutes: MetadataRoute.Sitemap = publishedDeals.map((deal) => ({
    url: `${baseUrl}/deals/${deal.slug}`,
    lastModified: deal.last_reviewed_at ? new Date(deal.last_reviewed_at) : FALLBACK_LAST_MODIFIED,
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  const companyRoutes: MetadataRoute.Sitemap = companies.map((company) => ({
    url: `${baseUrl}/companies/${company.slug}`,
    lastModified: FALLBACK_LAST_MODIFIED,
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  return [...staticRoutes, ...dealRoutes, ...companyRoutes];
}
