import { SafeUrlValidator } from './ssrf-protection';

export interface DiscoveryCrawlerResult {
  sourceSite: string;
  sourceUrl: string;
  pageTitle: string | null;
  candidateCompanies: string[];
  candidateSummary: string;
  outboundUrls: string[];
  status: 'new' | 'needs_verification' | 'blocked_by_policy';
  policyReason?: string;
}

export class DiscoveryMonitor {
  /**
   * Evaluates robots.txt on the target origin to verify polite access permissions.
   */
  public static async checkRobotsAllowed(targetUrl: string): Promise<{ allowed: boolean; reason?: string }> {
    try {
      const url = new URL(targetUrl);
      const robotsUrl = `${url.protocol}//${url.host}/robots.txt`;

      const res = await SafeUrlValidator.safeFetch(robotsUrl, { timeoutMs: 5000 });
      if (!res.ok) {
        // If 404, standard crawl rules consider it permitted
        return { allowed: true };
      }

      const text = await res.text();
      const lines = text.split('\n').map((l) => l.trim().toLowerCase());

      // Simple robots parser looking for universal Disallow: /
      let isGlobalUserAgent = false;
      for (const line of lines) {
        if (line.startsWith('user-agent: *')) {
          isGlobalUserAgent = true;
        } else if (line.startsWith('user-agent:') && !line.includes('*')) {
          isGlobalUserAgent = false;
        }

        if (isGlobalUserAgent && line.startsWith('disallow: /') && line.length === 11) {
          return { allowed: false, reason: 'Site robots.txt disallows all crawling under User-Agent: *' };
        }
      }

      return { allowed: true };
    } catch (err: unknown) {
      return { allowed: false, reason: `Failed to inspect robots.txt: ${err instanceof Error ? err.message : String(err)}` };
    }
  }

  /**
   * Scans an approved source URL for research lead discovery.
   * Only stores minimal candidate metadata, outbound links, and entities.
   * NEVER copies article prose or full competitor datasets.
   */
  public static async scanDiscoveryLead(targetUrl: string, allowedHosts: string[]): Promise<DiscoveryCrawlerResult> {
    const robotsCheck = await this.checkRobotsAllowed(targetUrl);
    if (!robotsCheck.allowed) {
      return {
        sourceSite: new URL(targetUrl).hostname,
        sourceUrl: targetUrl,
        pageTitle: null,
        candidateCompanies: [],
        candidateSummary: 'Blocked by robots.txt policy',
        outboundUrls: [],
        status: 'blocked_by_policy',
        policyReason: robotsCheck.reason,
      };
    }

    const response = await SafeUrlValidator.safeFetch(targetUrl, {
      allowedHosts,
      timeoutMs: 8000,
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch discovery target: ${response.status} ${response.statusText}`);
    }

    const html = await response.text();

    // Extract page title
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const pageTitle = titleMatch ? titleMatch[1].trim() : null;

    // Detect outbound citation URLs (e.g. sec.gov, reuters, prnewswire)
    const urlMatches = html.matchAll(/href="(https:\/\/[^"#\s]+)"/gi);
    const outboundSet = new Set<string>();

    for (const match of urlMatches) {
      const foundUrl = match[1];
      if (
        foundUrl.includes('sec.gov') ||
        foundUrl.includes('reuters.com') ||
        foundUrl.includes('bloomberg.com') ||
        foundUrl.includes('prnewswire.com') ||
        foundUrl.includes('businesswire.com')
      ) {
        outboundSet.add(foundUrl);
      }
    }

    // Identify candidate company names from known tracker keywords
    const candidateKeywords = [
      'NVIDIA', 'CoreWeave', 'Microsoft', 'OpenAI', 'Anthropic',
      'Amazon', 'Oracle', 'xAI', 'Meta', 'Alphabet', 'Google',
      'Constellation Energy', 'Vertiv', 'Blackstone', 'Crusoe Energy'
    ];

    const detectedCompanies = candidateKeywords.filter((name) =>
      new RegExp(`\\b${name}\\b`, 'i').test(html)
    );

    return {
      sourceSite: new URL(targetUrl).hostname,
      sourceUrl: targetUrl,
      pageTitle,
      candidateCompanies: detectedCompanies,
      candidateSummary: `Discovered potential transaction mentions referencing ${detectedCompanies.join(', ') || 'AI infrastructure entities'}. Requires independent verification.`,
      outboundUrls: Array.from(outboundSet).slice(0, 10),
      status: 'needs_verification',
    };
  }
}
