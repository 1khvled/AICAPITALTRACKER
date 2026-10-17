import { describe, it, expect } from 'vitest';
import robots from '../src/app/robots';
import sitemap from '../src/app/sitemap';

describe('Sitemap & Robots SEO Guards', () => {
  it('robots disallows admin and admin-API paths', () => {
    const rules = robots();
    const ruleList = Array.isArray(rules.rules) ? rules.rules : [rules.rules];
    const global = ruleList.find((r) => r.userAgent === '*');
    expect(global).toBeDefined();
    const disallow = Array.isArray(global!.disallow)
      ? global!.disallow
      : [global!.disallow as string];
    expect(disallow).toContain('/admin/');
    expect(disallow).toContain('/api/admin/');
  });

  it('robots references the sitemap', () => {
    const rules = robots();
    expect(rules.sitemap).toContain('/sitemap.xml');
  });

  it('sitemap omits /admin routes and covers public pages', async () => {
    const entries = await sitemap();
    expect(entries.length).toBeGreaterThan(0);
    for (const entry of entries) {
      expect(entry.url).not.toContain('/admin');
    }
    const urls = entries.map((e) => e.url);
    expect(urls.some((u) => u.endsWith('/deals'))).toBe(true);
    expect(urls.some((u) => u.endsWith('/companies'))).toBe(true);
  });
});
