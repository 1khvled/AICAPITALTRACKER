import { describe, it, expect } from 'vitest';
import { SafeUrlValidator } from '../src/lib/crawlers/ssrf-protection';

describe('SSRF Protection & URL Validator', () => {
  it('blocks loopback localhost URLs', () => {
    const res1 = SafeUrlValidator.isSafeUrl('http://localhost:3000/api');
    expect(res1.safe).toBe(false);

    const res2 = SafeUrlValidator.isSafeUrl('http://127.0.0.1:8080/metrics');
    expect(res2.safe).toBe(false);
  });

  it('blocks cloud metadata endpoints (169.254.169.254)', () => {
    const res = SafeUrlValidator.isSafeUrl('http://169.254.169.254/latest/meta-data/');
    expect(res.safe).toBe(false);
    expect(res.reason).toContain('internal/private network pattern');
  });

  it('blocks private network RFC 1918 IPs', () => {
    const res1 = SafeUrlValidator.isSafeUrl('https://10.0.0.5/internal');
    expect(res1.safe).toBe(false);

    const res2 = SafeUrlValidator.isSafeUrl('https://192.168.1.1/admin');
    expect(res2.safe).toBe(false);

    const res3 = SafeUrlValidator.isSafeUrl('https://172.16.0.10/database');
    expect(res3.safe).toBe(false);
  });

  it('blocks non-HTTP protocols (file://, gopher://, ftp://)', () => {
    const res = SafeUrlValidator.isSafeUrl('file:///etc/passwd');
    expect(res.safe).toBe(false);
    expect(res.reason).toContain('Disallowed protocol');
  });

  it('allows approved public regulatory domains', () => {
    const res = SafeUrlValidator.isSafeUrl(
      'https://data.sec.gov/submissions/CIK0001045810.json',
      ['data.sec.gov', 'sec.gov']
    );
    expect(res.safe).toBe(true);
  });

  it('enforces host allowlist when provided', () => {
    const res = SafeUrlValidator.isSafeUrl('https://unapproved-domain.org/data', ['sec.gov']);
    expect(res.safe).toBe(false);
    expect(res.reason).toContain('not in the allowed hosts registry');
  });
});
