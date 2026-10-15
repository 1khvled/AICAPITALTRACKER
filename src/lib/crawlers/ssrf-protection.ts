import { URL } from 'url';

// Denied IP ranges: Localhost, private RFC 1918 networks, link-local, cloud metadata
const BLOCKED_IP_PATTERNS = [
  /^127\./, // 127.0.0.0/8 (Loopback)
  /^10\./, // 10.0.0.0/8 (Private network)
  /^172\.(1[6-9]|2[0-9]|3[0-1])\./, // 172.16.0.0/12 (Private network)
  /^192\.168\./, // 192.168.0.0/16 (Private network)
  /^169\.254\./, // 169.254.0.0/16 (Link-local / Cloud metadata: 169.254.169.254)
  /^0\./, // 0.0.0.0/8
  /^::1$/, // IPv6 loopback
  /^fc00:/i, // IPv6 Unique Local Address
  /^fe80:/i, // IPv6 Link-Local
];

const BLOCKED_HOSTNAMES = [
  'localhost',
  'metadata.google.internal',
  'metadata',
  'instance-data',
];

export interface SafeFetchOptions extends RequestInit {
  timeoutMs?: number;
  maxRedirects?: number;
  allowedHosts?: string[];
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

    const hostname = parsed.hostname.toLowerCase();

    // Check blocked hostnames
    if (BLOCKED_HOSTNAMES.includes(hostname) || hostname.endsWith('.local') || hostname.endsWith('.internal')) {
      return { safe: false, reason: 'Target hostname is blocked by SSRF policy' };
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
   */
  public static async safeFetch(rawUrl: string, options: SafeFetchOptions = {}): Promise<Response> {
    const { timeoutMs = 8000, maxRedirects = 3, allowedHosts, headers, ...restOptions } = options;

    let currentUrl = rawUrl;
    let redirectCount = 0;

    while (redirectCount <= maxRedirects) {
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

          // Resolve relative redirect against current URL
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
