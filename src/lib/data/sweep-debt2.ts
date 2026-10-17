import type { Company, Deal, Relationship, Source } from '../types';
import { findCompany } from './dataset';

// LANE DEBT-DROPS follow-up: 4 previously verified deals re-recorded with new
// company slots. Only deal IDs ...081-084, source IDs ...110-117,
// relationship IDs ...048 + ...055-057, and new companies ...074-076 are used.

const FOUNDERS_FUND: Company = {
  id: '00000000-0000-0000-0000-000000000074',
  name: 'Founders Fund',
  slug: 'founders-fund',
  aliases: ['Founders Fund LLC'],
  description:
    'San Francisco venture capital firm investing across AI infrastructure and frontier technology; led Crusoe $600M Series D.',
  company_type: 'investor',
  headquarters_country: 'United States',
  headquarters_city: 'San Francisco, CA',
  website_url: 'https://foundersfund.com',
  ticker: null,
  cik: null,
  is_public: false,
};

const AKER_ASA: Company = {
  id: '00000000-0000-0000-0000-000000000075',
  name: 'Aker ASA',
  slug: 'aker-asa',
  aliases: ['Aker'],
  description:
    'Oslo-listed Norwegian industrial investment company; led Nscale $1.1B Series B with a $285M cash-plus-assets commitment.',
  company_type: 'investor',
  headquarters_country: 'Norway',
  headquarters_city: 'Oslo',
  website_url: 'https://www.akerasa.com',
  ticker: 'AKER.OL',
  cik: null,
  is_public: true,
};

const GOLDMAN_SACHS: Company = {
  id: '00000000-0000-0000-0000-000000000076',
  name: 'Goldman Sachs',
  slug: 'goldman-sachs',
  aliases: ['Goldman Sachs Group', 'GS'],
  description:
    'Global investment bank; Goldman Sachs Bank Europe SE acted as sole placement agent on Nebius $1B convertible notes private placement.',
  company_type: 'lender',
  headquarters_country: 'United States',
  headquarters_city: 'New York, NY',
  website_url: 'https://www.goldmansachs.com',
  ticker: 'GS',
  cik: '0000886982',
  is_public: true,
};

export const EXTRA_COMPANIES: Company[] = [FOUNDERS_FUND, AKER_ASA, GOLDMAN_SACHS];

const SRC_CRUSOE_COMPANY: Source = {
  id: '10000000-0000-0000-0000-000000000110',
  url: 'https://www.crusoe.ai/resources/newsroom/crusoe-closes-series-d-funding',
  title: 'Crusoe closes $600m in Series D round at $2.8 billion valuation to power AI',
  publisher: 'Crusoe Newsroom',
  source_type: 'company_release',
  published_date: '2024-12-12',
  accessed_at: '2026-10-16T00:00:00Z',
  notes:
    'Crusoe announcement: $600M Series D at $2.8B valuation led by Founders Fund with Fidelity, Long Journey Ventures, Mubadala, NVIDIA, Ribbit Capital, and Valor Equity Partners.',
};

const SRC_CRUSOE_REUTERS: Source = {
  id: '10000000-0000-0000-0000-000000000111',
  url: 'https://www.reuters.com/technology/crusoe-secures-600-million-series-d-round-led-by-founders-fund-2024-12-12',
  title: 'Crusoe secures $600 million in Series D round led by Founders Fund',
  publisher: 'Reuters',
  source_type: 'reputable_media',
  published_date: '2024-12-12',
  accessed_at: '2026-10-16T00:00:00Z',
  notes:
    'Reuters report confirming $600M Series D led by Founders Fund at a $2.8B valuation with Fidelity, Mubadala, and Nvidia participating.',
};

const SRC_NSCALE_COMPANY: Source = {
  id: '10000000-0000-0000-0000-000000000112',
  url: 'https://www.nscale.com/press-releases/nscale-series-b',
  title: 'Nscale Raises the Largest Series B in European History, at $1.1 billion',
  publisher: 'Nscale Newsroom',
  source_type: 'company_release',
  published_date: '2025-09-25',
  accessed_at: '2026-10-16T00:00:00Z',
  notes:
    'Nscale announcement: oversubscribed $1.1B Series B led by Aker ASA with Sandton Capital, Blue Owl Managed Funds, Dell, Fidelity, G Squared, Nokia, NVIDIA, Point72, and T.Capital.',
};

const SRC_NSCALE_CNBC: Source = {
  id: '10000000-0000-0000-0000-000000000113',
  url: 'https://www.cnbc.com/2025/09/25/nvidia-backed-uk-ai-firm-nscale-raises-1point1-billion-funding-round.html',
  title: 'British AI firm Nscale raises $1.1 billion in Nvidia-backed funding round',
  publisher: 'CNBC',
  source_type: 'reputable_media',
  published_date: '2025-09-25',
  accessed_at: '2026-10-16T00:00:00Z',
  notes:
    'CNBC report confirming $1.1B Series B led by Aker with backing from Nvidia, Nokia, and Dell; funds Nscale AI infrastructure expansion across Europe.',
};

const SRC_LAMBDA_COMPANY: Source = {
  id: '10000000-0000-0000-0000-000000000114',
  url: 'https://lambda.ai/blog/lambda-raises-480m-to-expand-ai-cloud-platform',
  title: 'Lambda Raises $480M to Expand AI Cloud Platform',
  publisher: 'Lambda Blog',
  source_type: 'company_release',
  published_date: '2025-02-19',
  accessed_at: '2026-10-16T00:00:00Z',
  notes:
    'Lambda announcement: $480M Series D co-led by Andra Capital and SGW with NVIDIA, ARK Invest, G Squared, Andrej Karpathy, and others plus strategic investment from Pegatron, Supermicro, Wistron, and Wiwynn.',
};

const SRC_LAMBDA_CNBC: Source = {
  id: '10000000-0000-0000-0000-000000000115',
  url: 'https://www.cnbc.com/2025/02/19/ai-cloud-startup-lambda-raises-480-million-in-new-round-nvidia-among-investors.html',
  title: 'AI cloud startup Lambda raises $480 million in new round; Nvidia among investors',
  publisher: 'CNBC',
  source_type: 'reputable_media',
  published_date: '2025-02-19',
  accessed_at: '2026-10-16T00:00:00Z',
  notes:
    'CNBC relay of Reuters reporting confirming $480M Series D co-led by Andra Capital and SGW with Nvidia participating; total equity raised $863M.',
};

const SRC_NEBIUS_COMPANY: Source = {
  id: '10000000-0000-0000-0000-000000000116',
  url: 'https://nebius.com/newsroom/nebius-group-announces-private-placement-of-1-billion-in-aggregate-principal-amount-of-convertible-notes',
  title: 'Nebius Group announces private placement of $1 billion in aggregate principal amount of convertible notes',
  publisher: 'Nebius Newsroom',
  source_type: 'company_release',
  published_date: '2025-06-02',
  accessed_at: '2026-10-16T00:00:00Z',
  notes:
    'Nebius announcement: $1B private placement of senior unsecured convertible notes ($500M 2.00% due 2029 + $500M 3.00% due 2031) with Goldman Sachs Bank Europe SE as sole placement agent; settlement expected June 5, 2025.',
};

const SRC_NEBIUS_EDGAR: Source = {
  id: '10000000-0000-0000-0000-000000000117',
  url: 'https://www.sec.gov/Archives/edgar/data/1513845/000110465925055197/tm2516825d1_ex99-1.htm',
  title: 'Nebius Group announces private placement of $1 billion in aggregate principal amount of convertible notes (Exhibit 99.1)',
  publisher: 'U.S. SEC EDGAR',
  source_type: 'primary_filing',
  published_date: '2025-06-02',
  accessed_at: '2026-10-16T00:00:00Z',
  notes:
    'SEC-filed Exhibit 99.1 press release confirming the $1B two-tranche convertible notes private placement terms and Goldman Sachs sole placement agent role.',
};

export const EXTRA_SOURCES: Source[] = [
  SRC_CRUSOE_COMPANY,
  SRC_CRUSOE_REUTERS,
  SRC_NSCALE_COMPANY,
  SRC_NSCALE_CNBC,
  SRC_LAMBDA_COMPANY,
  SRC_LAMBDA_CNBC,
  SRC_NEBIUS_COMPANY,
  SRC_NEBIUS_EDGAR,
];

export const EXTRA_DEALS: Deal[] = [
  {
    id: '20000000-0000-0000-0000-000000000081',
    slug: 'crusoe-600m-series-d-founders-fund-2024',
    title: 'Crusoe $600M Series D Led by Founders Fund',
    summary:
      'Crusoe closed a $600 million Series D at a $2.8 billion valuation led by Founders Fund, with participation from Fidelity, Long Journey Ventures, Mubadala, NVIDIA, Ribbit Capital, and Valor Equity Partners. Proceeds fund expansion of its vertically integrated AI cloud and data centers, including the Abilene, Texas campus; Crusoe Cloud reached general availability alongside the raise.',
    deal_type: 'equity_investment',
    status: 'closed',
    announcement_date: '2024-12-12',
    effective_date: '2024-12-12',
    maturity_date: null,
    amount_value: 600000000,
    amount_currency: 'USD',
    amount_basis: 'cash_investment',
    amount_period: 'Series D primary equity',
    amount_disclosed: true,
    geography: 'United States',
    evidence_level: 'confirmed_primary',
    confidence_note:
      'Company announcement corroborated by Reuters on the same date; $600M amount, $2.8B valuation, and Founders Fund lead all confirmed.',
    is_published: true,
    published_at: '2024-12-12T16:00:00Z',
    last_reviewed_at: '2026-10-16T00:00:00Z',
    parties: [
      {
        id: 'p-dd2-081-1',
        deal_id: '20000000-0000-0000-0000-000000000081',
        company_id: '00000000-0000-0000-0000-000000000013',
        role: 'investee',
        direction_note: 'Receives $600M Series D primary capital at $2.8B valuation',
        company: findCompany('crusoe-energy'),
      },
      {
        id: 'p-dd2-081-2',
        deal_id: '20000000-0000-0000-0000-000000000081',
        company_id: '00000000-0000-0000-0000-000000000074',
        role: 'investor',
        direction_note: 'Leads $600M Series D round',
        company: FOUNDERS_FUND,
      },
    ],
    sources: [
      {
        deal_id: '20000000-0000-0000-0000-000000000081',
        source_id: '10000000-0000-0000-0000-000000000110',
        supporting_note: 'Crusoe announcement of the $600M Series D at $2.8B valuation led by Founders Fund.',
        is_primary_support: true,
        source: SRC_CRUSOE_COMPANY,
      },
      {
        deal_id: '20000000-0000-0000-0000-000000000081',
        source_id: '10000000-0000-0000-0000-000000000111',
        supporting_note: 'Reuters confirmation of round size, valuation, lead, and participants.',
        is_primary_support: false,
        source: SRC_CRUSOE_REUTERS,
      },
    ],
  },
  {
    id: '20000000-0000-0000-0000-000000000082',
    slug: 'nscale-1-1b-series-b-aker-2025',
    title: 'Nscale $1.1B Series B Led by Aker ASA',
    summary:
      'Nscale raised an oversubscribed $1.1 billion Series B, the largest in UK and European history, led by Aker ASA with a $285 million cash-plus-assets commitment for a 9.3% fully diluted stake. Other participants included Sandton Capital, Blue Owl Managed Funds, Dell, Fidelity, G Squared, Nokia, NVIDIA, Point72, and T.Capital; proceeds accelerate Nscale AI infrastructure rollout across Europe, North America, and the Middle East.',
    deal_type: 'equity_investment',
    status: 'closed',
    announcement_date: '2025-09-25',
    effective_date: '2025-09-25',
    maturity_date: null,
    amount_value: 1100000000,
    amount_currency: 'USD',
    amount_basis: 'cash_investment',
    amount_period: 'Series B primary equity',
    amount_disclosed: true,
    geography: 'United Kingdom',
    evidence_level: 'confirmed_primary',
    confidence_note:
      'Company announcement corroborated by CNBC/Reuters on the same date; $1.1B total, Aker lead, and $285M Aker commitment per Aker stock-exchange notice.',
    is_published: true,
    published_at: '2025-09-25T12:00:00Z',
    last_reviewed_at: '2026-10-16T00:00:00Z',
    parties: [
      {
        id: 'p-dd2-082-1',
        deal_id: '20000000-0000-0000-0000-000000000082',
        company_id: '00000000-0000-0000-0000-000000000055',
        role: 'investee',
        direction_note: 'Receives $1.1B Series B primary capital for AI infrastructure expansion',
        company: findCompany('nscale'),
      },
      {
        id: 'p-dd2-082-2',
        deal_id: '20000000-0000-0000-0000-000000000082',
        company_id: '00000000-0000-0000-0000-000000000075',
        role: 'investor',
        direction_note: 'Leads round with $285M cash-plus-Narvik-assets commitment for 9.3% stake',
        company: AKER_ASA,
      },
    ],
    sources: [
      {
        deal_id: '20000000-0000-0000-0000-000000000082',
        source_id: '10000000-0000-0000-0000-000000000112',
        supporting_note: 'Nscale announcement of the $1.1B Aker-led Series B and participant list.',
        is_primary_support: true,
        source: SRC_NSCALE_COMPANY,
      },
      {
        deal_id: '20000000-0000-0000-0000-000000000082',
        source_id: '10000000-0000-0000-0000-000000000113',
        supporting_note: 'CNBC confirmation of $1.1B round led by Aker with Nvidia, Nokia, and Dell backing.',
        is_primary_support: false,
        source: SRC_NSCALE_CNBC,
      },
    ],
  },
  {
    id: '20000000-0000-0000-0000-000000000083',
    slug: 'lambda-480m-series-d-2025',
    title: 'Lambda $480M Series D Co-Led by Andra Capital and SGW',
    summary:
      'Lambda raised a $480 million Series D co-led by Andra Capital and SGW (the family office of early Google investor Scott Hassan) with participation from NVIDIA, ARK Invest, G Squared, Andrej Karpathy, Fincadia Advisors, In-Q-Tel, KHK & Partners, and others, plus strategic investment from Pegatron, Supermicro, Wistron, and Wiwynn and existing investors including 1517 and Crescent Cove. Total equity raised reached $863 million; proceeds expand the Lambda Cloud platform, inference API, and AI assistant.',
    deal_type: 'equity_investment',
    status: 'closed',
    announcement_date: '2025-02-19',
    effective_date: '2025-02-19',
    maturity_date: null,
    amount_value: 480000000,
    amount_currency: 'USD',
    amount_basis: 'cash_investment',
    amount_period: 'Series D primary equity',
    amount_disclosed: true,
    geography: 'United States',
    evidence_level: 'confirmed_primary',
    confidence_note:
      'Company blog announcement corroborated by Reuters/CNBC on the same date; $480M amount, co-leads, and NVIDIA participation all confirmed.',
    is_published: true,
    published_at: '2025-02-19T17:00:00Z',
    last_reviewed_at: '2026-10-16T00:00:00Z',
    parties: [
      {
        id: 'p-dd2-083-1',
        deal_id: '20000000-0000-0000-0000-000000000083',
        company_id: '00000000-0000-0000-0000-000000000012',
        role: 'investee',
        direction_note: 'Receives $480M Series D primary capital for AI cloud expansion',
        company: findCompany('lambda-labs'),
      },
      {
        id: 'p-dd2-083-2',
        deal_id: '20000000-0000-0000-0000-000000000083',
        company_id: '00000000-0000-0000-0000-000000000001',
        role: 'investor',
        direction_note: 'Participating investor alongside co-leads Andra Capital and SGW',
        company: findCompany('nvidia'),
      },
    ],
    sources: [
      {
        deal_id: '20000000-0000-0000-0000-000000000083',
        source_id: '10000000-0000-0000-0000-000000000114',
        supporting_note: 'Lambda announcement of the $480M Series D, co-leads, and NVIDIA participation.',
        is_primary_support: true,
        source: SRC_LAMBDA_COMPANY,
      },
      {
        deal_id: '20000000-0000-0000-0000-000000000083',
        source_id: '10000000-0000-0000-0000-000000000115',
        supporting_note: 'CNBC/Reuters confirmation of $480M round with Nvidia among investors.',
        is_primary_support: false,
        source: SRC_LAMBDA_CNBC,
      },
    ],
  },
  {
    id: '20000000-0000-0000-0000-000000000084',
    slug: 'nebius-1b-convertible-notes-2025',
    title: 'Nebius $1B Convertible Notes Private Placement',
    summary:
      'Nebius Group entered definitive agreements on June 2, 2025 for a $1 billion private placement of senior unsecured convertible notes in two tranches: $500 million of 2.00% notes due 2029 and $500 million of 3.00% notes due 2031, settling June 5, 2025. Goldman Sachs Bank Europe SE acted as sole placement agent. Proceeds fund compute capacity, data center expansion, and general corporate purposes.',
    deal_type: 'debt_credit_facility',
    status: 'closed',
    announcement_date: '2025-06-02',
    effective_date: '2025-06-05',
    maturity_date: null,
    amount_value: 1000000000,
    amount_currency: 'USD',
    amount_basis: 'credit_facility',
    amount_period: '$500M 2.00% notes due 2029 + $500M 3.00% notes due 2031',
    amount_disclosed: true,
    geography: 'United States',
    evidence_level: 'confirmed_primary',
    confidence_note:
      'Company announcement plus SEC-filed Exhibit 99.1 confirm the $1B two-tranche terms, June 5 settlement, and Goldman Sachs sole placement agent role.',
    is_published: true,
    published_at: '2025-06-02T12:00:00Z',
    last_reviewed_at: '2026-10-16T00:00:00Z',
    parties: [
      {
        id: 'p-dd2-084-1',
        deal_id: '20000000-0000-0000-0000-000000000084',
        company_id: '00000000-0000-0000-0000-000000000015',
        role: 'borrower',
        direction_note: 'Issuer of $1B senior unsecured convertible notes in two tranches',
        company: findCompany('nebius'),
      },
      {
        id: 'p-dd2-084-2',
        deal_id: '20000000-0000-0000-0000-000000000084',
        company_id: '00000000-0000-0000-0000-000000000076',
        role: 'lender',
        direction_note: 'Goldman Sachs Bank Europe SE sole placement agent for the private placement',
        company: GOLDMAN_SACHS,
      },
    ],
    sources: [
      {
        deal_id: '20000000-0000-0000-0000-000000000084',
        source_id: '10000000-0000-0000-0000-000000000116',
        supporting_note: 'Nebius announcement of the $1B two-tranche notes placement and Goldman Sachs sole placement agent role.',
        is_primary_support: true,
        source: SRC_NEBIUS_COMPANY,
      },
      {
        deal_id: '20000000-0000-0000-0000-000000000084',
        source_id: '10000000-0000-0000-0000-000000000117',
        supporting_note: 'SEC-filed Exhibit 99.1 confirming identical placement terms and settlement date.',
        is_primary_support: false,
        source: SRC_NEBIUS_EDGAR,
      },
    ],
  },
];

export const EXTRA_RELATIONSHIPS: Relationship[] = [
  {
    id: '30000000-0000-0000-0000-000000000048',
    from_company_id: '00000000-0000-0000-0000-000000000074',
    to_company_id: '00000000-0000-0000-0000-000000000013',
    relationship_type: 'equity_shareholder',
    start_date: '2024-12-12',
    end_date: null,
    description: 'Founders Fund led Crusoe $600M Series D at a $2.8B valuation.',
    evidence_level: 'confirmed_primary',
    is_published: true,
    from_company: FOUNDERS_FUND,
    to_company: findCompany('crusoe-energy'),
    sources: [
      {
        relationship_id: '30000000-0000-0000-0000-000000000048',
        source_id: '10000000-0000-0000-0000-000000000110',
        supporting_note: 'Crusoe announcement naming Founders Fund as Series D lead.',
        source: SRC_CRUSOE_COMPANY,
      },
    ],
  },
  {
    id: '30000000-0000-0000-0000-000000000055',
    from_company_id: '00000000-0000-0000-0000-000000000075',
    to_company_id: '00000000-0000-0000-0000-000000000055',
    relationship_type: 'equity_shareholder',
    start_date: '2025-09-25',
    end_date: null,
    description: 'Aker ASA led Nscale $1.1B Series B with a $285M commitment for a 9.3% fully diluted stake.',
    evidence_level: 'confirmed_primary',
    is_published: true,
    from_company: AKER_ASA,
    to_company: findCompany('nscale'),
    sources: [
      {
        relationship_id: '30000000-0000-0000-0000-000000000055',
        source_id: '10000000-0000-0000-0000-000000000112',
        supporting_note: 'Nscale announcement naming Aker ASA as Series B lead.',
        source: SRC_NSCALE_COMPANY,
      },
    ],
  },
  {
    id: '30000000-0000-0000-0000-000000000056',
    from_company_id: '00000000-0000-0000-0000-000000000001',
    to_company_id: '00000000-0000-0000-0000-000000000012',
    relationship_type: 'equity_shareholder',
    start_date: '2025-02-19',
    end_date: null,
    description: 'NVIDIA participated in Lambda $480M Series D co-led by Andra Capital and SGW.',
    evidence_level: 'confirmed_primary',
    is_published: true,
    from_company: findCompany('nvidia'),
    to_company: findCompany('lambda-labs'),
    sources: [
      {
        relationship_id: '30000000-0000-0000-0000-000000000056',
        source_id: '10000000-0000-0000-0000-000000000114',
        supporting_note: 'Lambda announcement naming NVIDIA as a Series D participant.',
        source: SRC_LAMBDA_COMPANY,
      },
    ],
  },
  {
    id: '30000000-0000-0000-0000-000000000057',
    from_company_id: '00000000-0000-0000-0000-000000000076',
    to_company_id: '00000000-0000-0000-0000-000000000015',
    relationship_type: 'debt_lender',
    start_date: '2025-06-05',
    end_date: null,
    description: 'Goldman Sachs Bank Europe SE acted as sole placement agent on Nebius $1B convertible notes private placement.',
    evidence_level: 'confirmed_primary',
    is_published: true,
    from_company: GOLDMAN_SACHS,
    to_company: findCompany('nebius'),
    sources: [
      {
        relationship_id: '30000000-0000-0000-0000-000000000057',
        source_id: '10000000-0000-0000-0000-000000000117',
        supporting_note: 'SEC-filed Exhibit 99.1 confirming Goldman Sachs sole placement agent role.',
        source: SRC_NEBIUS_EDGAR,
      },
    ],
  },
];
