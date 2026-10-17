import type { Company, Deal, Relationship, Source } from '../types';
import { findCompany } from './dataset';

// LANE STOCK-SALE RAISES: 4 verified mega capital events involving stock
// sales/issuances (public equity raises, mandatory converts, 144A converts,
// customer stock warrants). Only deal IDs ...103-106, source IDs ...134-141,
// relationship IDs ...066-069, and new companies ...079-080 are used.

const MARVELL: Company = {
  id: '00000000-0000-0000-0000-000000000079',
  name: 'Marvell Technology, Inc.',
  slug: 'marvell',
  aliases: ['MRVL', 'Marvell Technology'],
  description:
    'Fabless designer of custom AI silicon (inference accelerators, network/storage/memory controllers) for hyperscale data centers; issued Google a $12.2B stock warrant tied to up to $120B of TPU-ecosystem chip purchases through FY2033.',
  company_type: 'chipmaker',
  headquarters_country: 'United States',
  headquarters_city: 'Wilmington, DE',
  website_url: 'https://www.marvell.com',
  ticker: 'MRVL',
  cik: '0001835632',
  is_public: true,
};

const BERKSHIRE_HATHAWAY: Company = {
  id: '00000000-0000-0000-0000-000000000080',
  name: 'Berkshire Hathaway Inc.',
  slug: 'berkshire-hathaway',
  aliases: ['Berkshire Hathaway', 'Berkshire', 'BRK.B'],
  description:
    'Multinational conglomerate; agreed a $10B direct stock investment in Alphabet as cornerstone of its June 2026 equity capital raise to fund AI infrastructure.',
  company_type: 'investor',
  headquarters_country: 'United States',
  headquarters_city: 'Omaha, NE',
  website_url: 'https://www.berkshirehathaway.com',
  ticker: 'BRK.B',
  cik: '0001067982',
  is_public: true,
};

export const EXTRA_COMPANIES: Company[] = [MARVELL, BERKSHIRE_HATHAWAY];

const SRC_ALPHABET_INVESTOR_DAY: Source = {
  id: '10000000-0000-0000-0000-000000000134',
  url: 'https://blog.google/alphabet/investor-presentation-june-2026/',
  title: 'Alphabet investor presentation: June 2026',
  publisher: 'Google Keyword (Alphabet)',
  source_type: 'company_release',
  published_date: '2026-06-03',
  accessed_at: '2026-10-16T00:00:00Z',
  notes:
    'Alphabet transcript: $80B proposed equity raise announced June 1, 2026 ($10B Berkshire direct + $30B underwritten offering); underwritten tranche oversubscribed with ~$35B priced and allocated for an expected total of ~$85B; 2026 capex guided to $180-190B.',
};

const SRC_ALPHABET_ALJAZEERA: Source = {
  id: '10000000-0000-0000-0000-000000000135',
  url: 'https://www.aljazeera.com/economy/2026/6/2/google-parent-alphabet-to-sell-80bn-in-stock-to-fund-ai-plans',
  title: 'Google parent Alphabet to sell $80bn in stock to fund AI plans',
  publisher: 'Al Jazeera',
  source_type: 'reputable_media',
  published_date: '2026-06-02',
  accessed_at: '2026-10-16T00:00:00Z',
  notes:
    'Independent report confirming the $80B equity package structure: $10B Berkshire Hathaway direct purchase, $30B underwritten offerings, $40B staggered open-market sales; Alphabet market cap above $4.5T.',
};

const SRC_MARVELL_8K: Source = {
  id: '10000000-0000-0000-0000-000000000136',
  url: 'https://investor.marvell.com/sec-filings/all-sec-filings/content/0001193125-26-356217/d412696d8k.htm',
  title: 'Marvell Technology, Inc. Current Report on Form 8-K (warrant issued to Google)',
  publisher: 'Marvell Technology (SEC EDGAR filing)',
  source_type: 'primary_filing',
  published_date: '2026-08-19',
  accessed_at: '2026-10-16T00:00:00Z',
  notes:
    '8-K: July 29, 2026 commercial agreement for custom TPU-ecosystem silicon; August 18, 2026 warrant to Google for 58,970,907 shares at $206.58 (1,360,867 time-based; remainder vests in 240 x $500M revenue tranches through FY2033); exercisable to August 18, 2033.',
};

const SRC_MARVELL_CNBC: Source = {
  id: '10000000-0000-0000-0000-000000000137',
  url: 'https://www.cnbc.com/2026/08/19/marvell-google-ai-chips.html',
  title: "Marvell's stock pops 10% on AI chip deal that lets Google buy up to $12.2 billion in shares",
  publisher: 'CNBC',
  source_type: 'reputable_media',
  published_date: '2026-08-19',
  accessed_at: '2026-10-16T00:00:00Z',
  notes:
    'CNBC confirmation: Google may buy up to 58,970,907 Marvell shares at $206.58 (~$12.2B, ~7% stake) tied to purchasing targets through FY2033; MRVL shares rallied ~10% on the news.',
};

const SRC_COREWEAVE_PRICING: Source = {
  id: '10000000-0000-0000-0000-000000000138',
  url: 'https://investors.coreweave.com/news/news-details/2025/CoreWeave-Prices-Upsized-2-25-Billion-Convertible-Senior-Notes-Offering/default.aspx',
  title: 'CoreWeave Prices Upsized $2.25 Billion Convertible Senior Notes Offering',
  publisher: 'CoreWeave Investor Relations',
  source_type: 'company_release',
  published_date: '2025-12-09',
  accessed_at: '2026-10-16T00:00:00Z',
  notes:
    'CoreWeave pricing release: $2.25B upsized from $2B, 1.75% converts due 2031, conversion price ~$107.80 (25% premium to $86.24), $337.5M greenshoe, settlement December 11, 2025, ~$2,210.6M estimated net proceeds.',
};

const SRC_COREWEAVE_8K: Source = {
  id: '10000000-0000-0000-0000-000000000139',
  url: 'https://www.sec.gov/Archives/edgar/data/1769628/000176962825000105/crwv-20251208.htm',
  title: 'CoreWeave, Inc. Current Report on Form 8-K (December 2025 convertible notes closing)',
  publisher: 'U.S. SEC EDGAR',
  source_type: 'primary_filing',
  published_date: '2025-12-11',
  accessed_at: '2026-10-16T00:00:00Z',
  notes:
    '8-K: closed $2,587,500,000 aggregate principal (greenshoe exercised in full) on December 11, 2025; net ~$2,542.2M; capped-call counterparties named (Wells Fargo, Citibank, Barclays, Morgan Stanley, Societe Generale, TD, Goldman Sachs).',
};

const SRC_SMCI_PACKAGE: Source = {
  id: '10000000-0000-0000-0000-000000000140',
  url: 'https://ir.supermicro.com/news/news-details/2026/Supermicro-Announces-Proposed-7-0-Billion-of-Equity-and-Equity-linked-Financing-Transactions-To-Fund-AI-Orders/default.aspx',
  title: 'Supermicro Announces Proposed $7.0 Billion of Equity and Equity-linked Financing Transactions To Fund AI Orders',
  publisher: 'Supermicro Investor Relations',
  source_type: 'company_release',
  published_date: '2026-06-09',
  accessed_at: '2026-10-16T00:00:00Z',
  notes:
    'Supermicro announcement: $5B concurrent underwritten offerings (~$1.25B common + ~$3.75B mandatory-convert depositary shares) plus a $2B ATM program to fund ~$39B of AI server orders; J.P. Morgan, Goldman Sachs and Citigroup named lead joint bookrunning managers.',
};

const SRC_SMCI_PRICING_8K: Source = {
  id: '10000000-0000-0000-0000-000000000141',
  url: 'https://www.sec.gov/Archives/edgar/data/1375365/000119312526269703/d45696dex992.htm',
  title: 'Supermicro Announces Pricing of Equity and Equity-linked Financing Transactions (Exhibit 99.2)',
  publisher: 'U.S. SEC EDGAR',
  source_type: 'primary_filing',
  published_date: '2026-06-11',
  accessed_at: '2026-10-16T00:00:00Z',
  notes:
    'SEC-filed pricing release: 45,454,545 common shares at $27.50 ($1.25B) plus 75,000,000 depositary shares at $50 ($3.75B, 7% Series A mandatory converts auto-converting ~June 2029); common close June 12, depositary close June 15, 2026; $1.25B ATM distribution agreement with JPM/GS/Citi; confirms JPM/GS/Citi as lead joint bookrunners.',
};

export const EXTRA_SOURCES: Source[] = [
  SRC_ALPHABET_INVESTOR_DAY,
  SRC_ALPHABET_ALJAZEERA,
  SRC_MARVELL_8K,
  SRC_MARVELL_CNBC,
  SRC_COREWEAVE_PRICING,
  SRC_COREWEAVE_8K,
  SRC_SMCI_PACKAGE,
  SRC_SMCI_PRICING_8K,
];

export const EXTRA_DEALS: Deal[] = [
  {
    id: '20000000-0000-0000-0000-000000000103',
    slug: 'alphabet-80b-equity-capital-raise-berkshire-2026',
    title: 'Alphabet ~$85B Equity Capital Raise with $10B Berkshire Cornerstone',
    summary:
      'Alphabet announced a proposed $80 billion equity capital raise on June 1, 2026 to fund AI infrastructure: a $10 billion direct stock purchase by Berkshire Hathaway, a $30 billion underwritten offering tranche, and ~$40 billion of staggered open-market sales. Alphabet said the underwritten tranche was oversubscribed with ~$35 billion priced and allocated, lifting the expected total to ~$85B. Proceeds back record AI capex guided at $180-190B for 2026; Alphabet shares slipped only ~1-2% on a >$4.5T market cap.',
    deal_type: 'equity_investment',
    status: 'announced',
    announcement_date: '2026-06-01',
    effective_date: '2026-06-01',
    maturity_date: null,
    amount_value: 85000000000,
    amount_currency: 'USD',
    amount_basis: 'cash_investment',
    amount_period: 'Equity package: $10B Berkshire direct + ~$30-35B underwritten + ~$40B open-market sales',
    amount_disclosed: true,
    geography: 'United States',
    evidence_level: 'announced_not_completed',
    confidence_note:
      'Company announcement plus company investor-day transcript confirm the $80B package, the $10B Berkshire direct leg, and the ~$85B expected total after the oversubscribed underwritten tranche; full completion of the open-market leg not yet evidenced, hence announced status.',
    is_published: true,
    published_at: '2026-06-01T12:00:00Z',
    last_reviewed_at: '2026-10-16T00:00:00Z',
    parties: [
      {
        id: 'p-ss-103-1',
        deal_id: '20000000-0000-0000-0000-000000000103',
        company_id: '00000000-0000-0000-0000-000000000016',
        role: 'investee',
        direction_note: 'Issuer raising ~$85B of primary equity to fund AI infrastructure capex',
        company: findCompany('alphabet'),
      },
      {
        id: 'p-ss-103-2',
        deal_id: '20000000-0000-0000-0000-000000000103',
        company_id: '00000000-0000-0000-0000-000000000080',
        role: 'investor',
        direction_note: 'Agreed $10B direct stock purchase as cornerstone of the equity package',
        company: BERKSHIRE_HATHAWAY,
      },
    ],
    sources: [
      {
        deal_id: '20000000-0000-0000-0000-000000000103',
        source_id: '10000000-0000-0000-0000-000000000134',
        supporting_note: 'Alphabet investor presentation confirming the $80B raise, $10B Berkshire leg, oversubscribed underwritten tranche, and ~$85B expected total.',
        is_primary_support: true,
        source: SRC_ALPHABET_INVESTOR_DAY,
      },
      {
        deal_id: '20000000-0000-0000-0000-000000000103',
        source_id: '10000000-0000-0000-0000-000000000135',
        supporting_note: 'Independent report confirming the $10B Berkshire / $30B underwritten / $40B open-market structure.',
        is_primary_support: false,
        source: SRC_ALPHABET_ALJAZEERA,
      },
    ],
  },
  {
    id: '20000000-0000-0000-0000-000000000104',
    slug: 'marvell-google-12-2b-warrant-120b-chip-deal-2026',
    title: 'Marvell Issues Google $12.2B Stock Warrant Tied to $120B Chip Purchases',
    summary:
      'Marvell and Google signed a commercial agreement on July 29, 2026 for custom silicon attaching to the TPU ecosystem (AI inference accelerators, storage/network/memory controllers, near-memory compute). On August 18, 2026 Marvell issued Google a warrant for up to 58,970,907 shares (~7% of Marvell) at $206.58 apiece, worth ~$12.2B at exercise: 1,360,867 shares vest quarterly over one year and the rest vests in 240 tranches of $500M of Custom Products revenue, i.e. up to $120B of chip purchases through FY2033. The warrant runs to August 18, 2033; MRVL shares rallied ~10% on the news.',
    deal_type: 'equity_investment',
    status: 'active',
    announcement_date: '2026-08-18',
    effective_date: '2026-08-18',
    maturity_date: null,
    amount_value: 12200000000,
    amount_currency: 'USD',
    amount_basis: 'other',
    amount_period: 'Warrant: 58,970,907 shares at $206.58; vests on up to $120B Custom Products revenue thru FY2033',
    amount_disclosed: true,
    geography: 'United States',
    evidence_level: 'confirmed_primary',
    confidence_note:
      'SEC-filed 8-K gives exact share count, exercise price, vesting tranches, and expiry; CNBC corroborates the ~$12.2B value and ~7% stake. The $120B figure is the maximum purchase program (240 x $500M tranches), not cash invested.',
    is_published: true,
    published_at: '2026-08-19T12:00:00Z',
    last_reviewed_at: '2026-10-16T00:00:00Z',
    parties: [
      {
        id: 'p-ss-104-1',
        deal_id: '20000000-0000-0000-0000-000000000104',
        company_id: '00000000-0000-0000-0000-000000000079',
        role: 'investee',
        direction_note: 'Issuer of warrant for up to 58,970,907 shares (~7% of Marvell) to Google',
        company: MARVELL,
      },
      {
        id: 'p-ss-104-2',
        deal_id: '20000000-0000-0000-0000-000000000104',
        company_id: '00000000-0000-0000-0000-000000000016',
        role: 'investor',
        direction_note: 'Google LLC holds the warrant; exercises into shares as tranches vest on chip purchases',
        company: findCompany('alphabet'),
      },
    ],
    sources: [
      {
        deal_id: '20000000-0000-0000-0000-000000000104',
        source_id: '10000000-0000-0000-0000-000000000136',
        supporting_note: 'Marvell 8-K with exact warrant terms: share count, $206.58 exercise price, vesting tranches, expiry.',
        is_primary_support: true,
        source: SRC_MARVELL_8K,
      },
      {
        deal_id: '20000000-0000-0000-0000-000000000104',
        source_id: '10000000-0000-0000-0000-000000000137',
        supporting_note: 'CNBC confirmation of the ~$12.2B warrant value, ~7% stake, and FY2033 purchasing targets.',
        is_primary_support: false,
        source: SRC_MARVELL_CNBC,
      },
    ],
  },
  {
    id: '20000000-0000-0000-0000-000000000105',
    slug: 'coreweave-2-5875b-convertible-notes-2025',
    title: 'CoreWeave $2.5875B Convertible Senior Notes (Upsized, Dec 2025)',
    summary:
      'CoreWeave announced a $2B convertible notes offering on December 8, 2025, priced an upsized $2.25B tranche on December 9 (1.75% coupon due 2031, conversion price ~$107.80, a 25% premium to $86.24), and closed $2,587,500,000 on December 11, 2025 after initial purchasers exercised the $337.5M greenshoe in full. Net proceeds were ~$2,542.2M for general corporate purposes; ~$340M funded capped-call hedges (cap $215.60) with seven named bank counterparties including Morgan Stanley and Goldman Sachs.',
    deal_type: 'debt_credit_facility',
    status: 'closed',
    announcement_date: '2025-12-08',
    effective_date: '2025-12-11',
    maturity_date: null,
    amount_value: 2587500000,
    amount_currency: 'USD',
    amount_basis: 'credit_facility',
    amount_disclosed: true,
    amount_period: '1.75% convertible senior notes due 2031 (Rule 144A; incl. $337.5M greenshoe)',
    geography: 'United States',
    evidence_level: 'confirmed_primary',
    confidence_note:
      'Company pricing release plus SEC-filed 8-K confirm the upsized amount, full greenshoe exercise, December 11 closing, coupon, conversion price, and named capped-call counterparties; initial purchasers were not named, so the verified bank counterparty is recorded.',
    is_published: true,
    published_at: '2025-12-11T16:00:00Z',
    last_reviewed_at: '2026-10-16T00:00:00Z',
    parties: [
      {
        id: 'p-ss-105-1',
        deal_id: '20000000-0000-0000-0000-000000000105',
        company_id: '00000000-0000-0000-0000-000000000002',
        role: 'borrower',
        direction_note: 'Issuer of $2.5875B convertible senior notes due 2031',
        company: findCompany('coreweave'),
      },
      {
        id: 'p-ss-105-2',
        deal_id: '20000000-0000-0000-0000-000000000105',
        company_id: '00000000-0000-0000-0000-000000000036',
        role: 'counterparty',
        direction_note: 'Morgan Stanley & Co. LLC named capped-call option counterparty (one of seven banks); initial purchasers undisclosed',
        company: findCompany('morgan-stanley'),
      },
    ],
    sources: [
      {
        deal_id: '20000000-0000-0000-0000-000000000105',
        source_id: '10000000-0000-0000-0000-000000000138',
        supporting_note: 'CoreWeave pricing release for the upsized $2.25B offering, coupon, conversion price, and settlement date.',
        is_primary_support: true,
        source: SRC_COREWEAVE_PRICING,
      },
      {
        deal_id: '20000000-0000-0000-0000-000000000105',
        source_id: '10000000-0000-0000-0000-000000000139',
        supporting_note: 'SEC-filed 8-K confirming the $2,587,500,000 closing, full greenshoe exercise, net proceeds, and named option counterparties.',
        is_primary_support: false,
        source: SRC_COREWEAVE_8K,
      },
    ],
  },
  {
    id: '20000000-0000-0000-0000-000000000106',
    slug: 'supermicro-5b-underwritten-equity-package-2026',
    title: 'Supermicro $5B Underwritten Equity Package ($1.25B Common + $3.75B Mandatory Converts)',
    summary:
      'Supermicro announced concurrent equity financings on June 9, 2026 to fund ~$39B of AI server component orders, and priced them on June 11: 45,454,545 common shares at $27.50 ($1.25B gross) plus 75,000,000 depositary shares at $50 ($3.75B gross) representing 7% Series A mandatory convertible preferred auto-converting ~June 2029 (listed SMCIP). The common leg closed June 12 and the depositary leg June 15, 2026, for ~$4.9B net. J.P. Morgan, Goldman Sachs and Citigroup acted as lead joint bookrunners; a separate $1.25B ATM program with the same banks was also signed.',
    deal_type: 'equity_investment',
    status: 'closed',
    announcement_date: '2026-06-09',
    effective_date: '2026-06-15',
    maturity_date: null,
    amount_value: 5000000000,
    amount_currency: 'USD',
    amount_basis: 'cash_investment',
    amount_period: 'Underwritten public offerings: ~$1.25B common + ~$3.75B 7% mandatory-convert depositary shares (plus $1.25B ATM program)',
    amount_disclosed: true,
    geography: 'United States',
    evidence_level: 'confirmed_primary',
    confidence_note:
      'Company announcement plus SEC-filed pricing exhibit confirm share counts, prices, $5B gross underwritten amount, June 12/15 scheduled closings, and JPM/GS/Citi as named lead joint bookrunners. Corrects the lead: no $2B March 2025 stock sale; the June 2025 converts closed at $2.3B and this June 2026 package is the mega stock sale.',
    is_published: true,
    published_at: '2026-06-15T16:00:00Z',
    last_reviewed_at: '2026-10-16T00:00:00Z',
    parties: [
      {
        id: 'p-ss-106-1',
        deal_id: '20000000-0000-0000-0000-000000000106',
        company_id: '00000000-0000-0000-0000-000000000011',
        role: 'investee',
        direction_note: 'Issuer of $1.25B common stock and $3.75B mandatory-convert depositary shares',
        company: findCompany('supermicro'),
      },
      {
        id: 'p-ss-106-2',
        deal_id: '20000000-0000-0000-0000-000000000106',
        company_id: '00000000-0000-0000-0000-000000000035',
        role: 'counterparty',
        direction_note: 'Lead joint bookrunning manager (with Goldman Sachs and Citigroup) for both underwritten offerings',
        company: findCompany('jpmorgan'),
      },
    ],
    sources: [
      {
        deal_id: '20000000-0000-0000-0000-000000000106',
        source_id: '10000000-0000-0000-0000-000000000140',
        supporting_note: 'Supermicro announcement of the $7B equity/equity-linked program and named lead bookrunners.',
        is_primary_support: true,
        source: SRC_SMCI_PACKAGE,
      },
      {
        deal_id: '20000000-0000-0000-0000-000000000106',
        source_id: '10000000-0000-0000-0000-000000000141',
        supporting_note: 'SEC-filed pricing release with exact share counts, prices, closing dates, and bookrunner syndicate.',
        is_primary_support: false,
        source: SRC_SMCI_PRICING_8K,
      },
    ],
  },
];

export const EXTRA_RELATIONSHIPS: Relationship[] = [
  {
    id: '30000000-0000-0000-0000-000000000066',
    from_company_id: '00000000-0000-0000-0000-000000000080',
    to_company_id: '00000000-0000-0000-0000-000000000016',
    relationship_type: 'equity_shareholder',
    start_date: '2026-06-01',
    end_date: null,
    description: 'Berkshire Hathaway agreed a $10B direct stock purchase as cornerstone of Alphabet June 2026 equity capital raise.',
    evidence_level: 'announced_not_completed',
    is_published: true,
    from_company: BERKSHIRE_HATHAWAY,
    to_company: findCompany('alphabet'),
    sources: [
      {
        relationship_id: '30000000-0000-0000-0000-000000000066',
        source_id: '10000000-0000-0000-0000-000000000134',
        supporting_note: 'Alphabet investor presentation confirming the $10B Berkshire direct investment.',
        source: SRC_ALPHABET_INVESTOR_DAY,
      },
    ],
  },
  {
    id: '30000000-0000-0000-0000-000000000067',
    from_company_id: '00000000-0000-0000-0000-000000000016',
    to_company_id: '00000000-0000-0000-0000-000000000079',
    relationship_type: 'equity_shareholder',
    start_date: '2026-08-18',
    end_date: null,
    description: 'Google holds a Marvell warrant for up to 58,970,907 shares (~7%, ~$12.2B) vesting on chip purchases through FY2033.',
    evidence_level: 'confirmed_primary',
    is_published: true,
    from_company: findCompany('alphabet'),
    to_company: MARVELL,
    sources: [
      {
        relationship_id: '30000000-0000-0000-0000-000000000067',
        source_id: '10000000-0000-0000-0000-000000000136',
        supporting_note: 'Marvell 8-K recording the warrant issuance to Google.',
        source: SRC_MARVELL_8K,
      },
    ],
  },
  {
    id: '30000000-0000-0000-0000-000000000068',
    from_company_id: '00000000-0000-0000-0000-000000000036',
    to_company_id: '00000000-0000-0000-0000-000000000002',
    relationship_type: 'other',
    start_date: '2025-12-11',
    end_date: null,
    description: 'Morgan Stanley & Co. LLC acted as named capped-call option counterparty on CoreWeave $2.5875B convertible notes.',
    evidence_level: 'confirmed_primary',
    is_published: true,
    from_company: findCompany('morgan-stanley'),
    to_company: findCompany('coreweave'),
    sources: [
      {
        relationship_id: '30000000-0000-0000-0000-000000000068',
        source_id: '10000000-0000-0000-0000-000000000139',
        supporting_note: 'CoreWeave 8-K naming Morgan Stanley among the seven capped-call option counterparties.',
        source: SRC_COREWEAVE_8K,
      },
    ],
  },
  {
    id: '30000000-0000-0000-0000-000000000069',
    from_company_id: '00000000-0000-0000-0000-000000000035',
    to_company_id: '00000000-0000-0000-0000-000000000011',
    relationship_type: 'other',
    start_date: '2026-06-09',
    end_date: null,
    description: 'J.P. Morgan acted as lead joint bookrunning manager on Supermicro $5B underwritten equity package.',
    evidence_level: 'confirmed_primary',
    is_published: true,
    from_company: findCompany('jpmorgan'),
    to_company: findCompany('supermicro'),
    sources: [
      {
        relationship_id: '30000000-0000-0000-0000-000000000069',
        source_id: '10000000-0000-0000-0000-000000000141',
        supporting_note: 'SEC-filed pricing release naming J.P. Morgan as lead joint bookrunner.',
        source: SRC_SMCI_PRICING_8K,
      },
    ],
  },
];
