import { describe, it, expect } from 'vitest';
import { SafeUrlValidator } from '../src/lib/crawlers/ssrf-protection';

describe('SSRF Protection Extended (obfuscated literals & tricks)', () => {
  it('blocks decimal-integer IP literals (2130706433 = 127.0.0.1)', () => {
    const res = SafeUrlValidator.isSafeUrl('http://2130706433/');
    expect(res.safe).toBe(false);
  });

  it('blocks hex-integer IP literals (0x7F000001 = 127.0.0.1)', () => {
    const res = SafeUrlValidator.isSafeUrl('http://0x7F000001/');
    expect(res.safe).toBe(false);
  });

  it('blocks dotted hex-octet form (0x7f.0.0.1)', () => {
    const res = SafeUrlValidator.isSafeUrl('http://0x7f.0.0.1/');
    expect(res.safe).toBe(false);
  });

  it('blocks dotted octal-octet form (0177.0.0.1)', () => {
    const res = SafeUrlValidator.isSafeUrl('http://0177.0.0.1/');
    expect(res.safe).toBe(false);
  });

  it('blocks username-embedded @ trick (trusted.com@127.0.0.1)', () => {
    const res = SafeUrlValidator.isSafeUrl('http://trusted.com@127.0.0.1/');
    expect(res.safe).toBe(false);
  });

  it('blocks IPv4-mapped IPv6 literals ([::ffff:127.0.0.1])', () => {
    const res = SafeUrlValidator.isSafeUrl('http://[::ffff:127.0.0.1]/');
    expect(res.safe).toBe(false);
  });

  it('blocks IPv6 loopback literal ([::1])', () => {
    const res = SafeUrlValidator.isSafeUrl('http://[::1]/');
    expect(res.safe).toBe(false);
  });

  it('still allows approved public regulatory hosts', () => {
    const res = SafeUrlValidator.isSafeUrl(
      'https://data.sec.gov/submissions/CIK0001045810.json',
      ['data.sec.gov', 'sec.gov']
    );
    expect(res.safe).toBe(true);
  });
});
