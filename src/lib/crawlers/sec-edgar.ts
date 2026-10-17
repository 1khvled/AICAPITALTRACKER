import { SafeUrlValidator } from './ssrf-protection';

export interface SecFilingEntry {
  cik: string;
  companyName: string;
  formType: string;
  filingDate: string;
  accessionNumber: string;
  documentUrl: string;
  description?: string;
  /** Raw 8-K item numbers as reported by EDGAR (e.g. "1.01,7.01,9.01"). Empty for 10-K/10-Q. */
  items?: string;
}

export class SecEdgarClient {
  private static BASE_URL = 'https://data.sec.gov';
  private static ALLOWED_HOSTS = ['data.sec.gov', 'www.sec.gov', 'sec.gov'];

  /**
   * Fetches latest company submissions using SEC EDGAR JSON API
   * Formats CIK to 10-digit zero padded.
   */
  public static async getCompanySubmissions(rawCik: string): Promise<SecFilingEntry[]> {
    const paddedCik = rawCik.replace(/^0+/, '').padStart(10, '0');
    const endpoint = `${this.BASE_URL}/submissions/CIK${paddedCik}.json`;

    const userAgent = process.env.SEC_USER_AGENT || 'AICapitalTracker/1.0 (contact@aicapitaltracker.com)';

    const res = await SafeUrlValidator.safeFetch(endpoint, {
      allowedHosts: this.ALLOWED_HOSTS,
      headers: {
        'User-Agent': userAgent,
        'Accept': 'application/json',
      },
      timeoutMs: 10000,
    });

    if (!res.ok) {
      if (res.status === 429) {
        throw new Error('SEC EDGAR rate limit reached. Backing off per SEC fair access rules.');
      }
      throw new Error(`SEC API error: ${res.status} ${res.statusText}`);
    }

    const data = await res.json();
    const recent = data.filings?.recent;
    if (!recent || !recent.accessionNumber) {
      return [];
    }

    const count = recent.accessionNumber.length;
    const filings: SecFilingEntry[] = [];

    // Filter relevant forms for financing, material events, and annual/quarterly reports
    const targetForms = new Set(['8-K', '10-K', '10-Q', 'S-1', '6-K']);

    // Scan the full recent window (usually ~1000 rows, still a single HTTP
    // response). Capping this would silently drop older filings and defeat
    // `--since <old-date>` pulls. Fair-access is preserved: one request/issuer.
    for (let i = 0; i < count; i++) {
      const form = recent.form[i];
      if (targetForms.has(form)) {
        const rawAccession = recent.accessionNumber[i];
        const cleanedAccession = rawAccession.replace(/-/g, '');
        const primaryDoc = recent.primaryDocument[i];

        const docUrl = `https://www.sec.gov/Archives/edgar/data/${rawCik}/${cleanedAccession}/${primaryDoc}`;

        // EDGAR submissions expose 8-K item numbers via filings.recent.items
        // (e.g. "1.01,9.01"). Non-8-K forms report an empty string.
        const rawItems = Array.isArray(recent.items) ? recent.items[i] : undefined;
        const items = typeof rawItems === 'string' ? rawItems.trim() : '';

        filings.push({
          cik: paddedCik,
          companyName: data.name || 'Unknown',
          formType: form,
          filingDate: recent.filingDate[i],
          accessionNumber: rawAccession,
          documentUrl: docUrl,
          description: recent.primaryDocDescription?.[i] || undefined,
          items: items || undefined,
        });
      }
    }

    return filings;
  }
}
