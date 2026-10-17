// SSRF protection for server-side crawler fetches.
// Uses the global WHATWG URL (no 'url' module import) so validation matches
// the exact parser used by fetch() at runtime.

export interface SafeFetchOptions extends RequestInit {
  timeoutMs?: number;
  maxRedirects?: number;
  allowedHosts?: string[];
}

// Denied IP ranges: Localhost, private RFC 1918 networks, link-local, cloud metadata
const BLOCKED_IP_PATTERNS = [
  /^127\./, // 127.0.0.0/8 (Loopback)
  /^10\./, // 10.0.0.0/8 (Private network)
  /^172\.(1[6-9]|2[0-9]|3[0-1])\./, // 172.16.0.0/12 (Private network)
  /^192\.168\./, // 192.168.0.0/16 (Private network)
  /^169\.254\./, // 169.254.0.0/16 (Link-local / Cloud metadata: 169.254.169.254)
  /^0\./, // 0.0.0.0/8
  /^0x0*$/i, // 0x0 (hex zero)
  /^::1$/, // IPv6 loopback (normalized, brackets stripped)
  /^fc00:/i, // IPv6 Unique Local Address
  /^fe80:/i, // IPv6 Link-Local
];

const BLOCKED_HOSTNAMES = [
  'localhost',
  'metadata.google.internal',
  'metadata',
  'instance-data',
];

/** Strip surrounding brackets from IPv6 literals: "[::1]" -> "::1". */
function normalizeHostname(hostname: string): string {
  const lower = hostname.toLowerCase();
  if (lower.startsWith('[') && lower.endsWith(']')) {
    return lower.slice(1, -1);
  }
  return lower;
}

/**
 * Detects obfuscated IPv4 literals that bypass naive dotted-decimal checks:
 * - Decimal integer form: "2130706433" (= 127.0.0.1)
 * - Hex integer form: "0x7f000001" (= 127.0.0.1)
 * - Dotted parts using hex ("0x7f.0.0.1") or octal ("0177.0.0.1") notation
 */
function isObfuscatedIpLiteral(hostname: string): boolean {
  // Pure decimal integer (e.g. http://2130706433/) or pure hex integer
  if (/^\d+$/.test(hostname)) {
    return true;
  }
  if (/^0x[0-9a-f]+$/i.test(hostname)) {
    return true;
  }

  // Dotted form with non-standard radix parts
  const parts = hostname.split('.');
  if (parts.length === 4 && parts.every((p) => p.length > 0)) {
    for (const part of parts) {
      if (/^0x[0-9a-f]+$/i.test(part)) {
        return true; // Hex octet: 0x7f.0.0.1
      }
      if (/^0\d+$/.test(part)) {
        return true; // Octal octet: 0177.0.0.1 (also catches 00x padding tricks)
      }
    }
  }

  return false;
}

/**
 * Detects IPv4-mapped IPv6 literals such as ::ffff:127.0.0.1, which inherit
 * the restrictions of the embedded IPv4 address.
 */
function embedsBlockedIpv4(normalizedHostname: string): boolean {
  // IPv4-mapped (::ffff:) or translated ranges always wrap a real IPv4 target
  if (normalizedHostname.includes('::ffff:') || normalizedHostname.includes('::ffff:0:')) {
    return true;
  }
  // Any IPv6 literal with an embedded dotted quad (e.g. ::ffff:7f00:1 aside,
  // forms like 64:ff9b::127.0.0.1): extract the trailing quad and test it.
  const embeddedQuad = normalizedHostname.match(/(\d+\.\d+\.\d+\.\d+)$/);
  if (embeddedQuad) {
    const quad = embeddedQuad[1];
    if (isObfuscatedIpLiteral(quad)) {
      return true;
    }
    return BLOCKED_IP_PATTERNS.some((pattern) => pattern.test(quad));
  }
  return false;
}

export class SafeUrlValidator {
  /**
   * Validates whether a target URL is safe to fetch and does not point to internal resources.
   */
  public static isSafeUrl(rawUrl: string, allowedHosts?: string[]): { safe: boolean; reason?: string; parsedUrl?: URL } {
    let parsed: URL;
    try {
      parsed = new URL(rawUrl);
    } catch {
      return { safe: false, reason: 'Invalid URL format' };
    }

    // Only allow HTTP and HTTPS
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return { safe: false, reason: `Disallowed protocol: ${parsed.protocol}` };
    }

    // Reject URLs with embedded credentials/userinfo ("@ trick"),
    // e.g. http://trusted.com@127.0.0.1/ where the visible host is a decoy.
    if (parsed.username !== '' || parsed.password !== '') {
      return { safe: false, reason: 'URL contains embedded credentials/userinfo (@ trick) and is blocked by SSRF policy' };
    }

    const hostname = normalizeHostname(parsed.hostname);

    // Check blocked hostnames
    if (BLOCKED_HOSTNAMES.includes(hostname) || hostname.endsWith('.local') || hostname.endsWith('.internal')) {
      return { safe: false, reason: 'Target hostname is blocked by SSRF policy' };
    }

    // Check IPv4-mapped / embedded IPv6 tricks before plain pattern matching
    if (hostname.includes(':') && embedsBlockedIpv4(hostname)) {
      return { safe: false, reason: `Target IPv6 literal embeds a blocked internal IPv4 address: ${hostname}` };
    }

    // Check obfuscated numeric IP literals (decimal / hex / octal)
    if (isObfuscatedIpLiteral(hostname)) {
      return { safe: false, reason: `Target hostname is an obfuscated numeric IP literal: ${hostname}` };
    }

    // Check blocked IP patterns
    for (const pattern of BLOCKED_IP_PATTERNS) {
      if (pattern.test(hostname)) {
        return { safe: false, reason: `Target IP address matches internal/private network pattern: ${hostname}` };
      }
    }

    // If an explicit allowlist is provided, enforce it
    if (allowedHosts && allowedHosts.length > 0) {
      const isAllowed = allowedHosts.some(
        (allowed) => hostname === allowed.toLowerCase() || hostname.endsWith('.' + allowed.toLowerCase())
      );
      if (!isAllowed) {
        return { safe: false, reason: `Host ${hostname} is not in the allowed hosts registry` };
      }
    }

    return { safe: true, parsedUrl: parsed };
  }

  /**
   * Performs an SSRF-safe HTTP request with redirect validation and timeouts.
   * Every redirect Location is resolved and re-validated through isSafeUrl
   * before it is followed, so redirect chains cannot escape to internal hosts.
   */
  public static async safeFetch(rawUrl: string, options: SafeFetchOptions = {}): Promise<Response> {
    const { timeoutMs = 8000, maxRedirects = 3, allowedHosts, headers, ...restOptions } = options;

    let currentUrl = rawUrl;
    let redirectCount = 0;

    while (redirectCount <= maxRedirects) {
      // Re-validate on every hop: initial URL and each redirect target alike.
      const validation = this.isSafeUrl(currentUrl, allowedHosts);
      if (!validation.safe) {
        throw new Error(`SSRF Prevention: Refusing to fetch ${currentUrl}. Reason: ${validation.reason}`);
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      try {
        const response = await fetch(currentUrl, {
          ...restOptions,
          headers: {
            'User-Agent': process.env.SEC_USER_AGENT || 'AICapitalTracker-Bot/1.0 (+https://aicapitaltracker.com)',
            'Accept': 'text/html,application/xhtml+xml,application/xml,application/json;q=0.9',
            ...headers,
          },
          signal: controller.signal,
          redirect: 'manual', // Manual handling to validate destination on every redirect
        });

        clearTimeout(timeoutId);

        // Check for redirect (301, 302, 307, 308)
        if (response.status >= 300 && response.status < 400) {
          const location = response.headers.get('location');
          if (!location) {
            return response;
          }

          redirectCount++;
          if (redirectCount > maxRedirects) {
            throw new Error(`Exceeded maximum allowed redirects (${maxRedirects})`);
          }

          // Resolve relative redirect against current URL; the loop top
          // re-validates the resolved target before following it.
          currentUrl = new URL(location, currentUrl).toString();
          continue;
        }

        return response;
      } catch (err: unknown) {
        clearTimeout(timeoutId);
        if (err instanceof Error && err.name === 'AbortError') {
          throw new Error(`Request timed out after ${timeoutMs}ms: ${currentUrl}`);
        }
        throw err;
      }
    }

    throw new Error('Too many redirects');
  }
}
