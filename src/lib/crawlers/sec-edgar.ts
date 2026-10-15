import { SafeUrlValidator } from './ssrf-protection';

export interface SecFilingEntry {
  cik: string;
  companyName: string;
  formType: string;
  filingDate: string;
  accessionNumber: string;
  documentUrl: string;
  description?: string;
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

    for (let i = 0; i < Math.min(count, 30); i++) {
      const form = recent.form[i];
      if (targetForms.has(form)) {
        const rawAccession = recent.accessionNumber[i];
        const cleanedAccession = rawAccession.replace(/-/g, '');
        const primaryDoc = recent.primaryDocument[i];

        const docUrl = `https://www.sec.gov/Archives/edgar/data/${rawCik}/${cleanedAccession}/${primaryDoc}`;

        filings.push({
          cik: paddedCik,
          companyName: data.name || 'Unknown',
          formType: form,
          filingDate: recent.filingDate[i],
          accessionNumber: rawAccession,
          documentUrl: docUrl,
          description: recent.primaryDocDescription?.[i] || undefined,
        });
      }
    }

    return filings;
  }
}
