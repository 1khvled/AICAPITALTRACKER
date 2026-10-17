import { Company, Deal, Relationship, Source } from '../types';
import { findCompany } from './dataset';

// LANE 5 (marquee equity/filings sweep). Adds blockbuster 2025-2026 AI
// money-raisings and the xAI-X combination: OpenAI's $8.3B Dragoneer-led
// tranche, xAI's all-stock acquisition of X, Databricks' $1B Series K at
// >$100B, and Anthropic's reported IPO prospectus. Investor-side parties
// reuse existing ledger companies only (SoftBank, MGX, Amazon); Dragoneer,
// Thrive, Insight and WCM are not in the ledger so the participating or
// program-level ledger investor is recorded instead.

const X_CORP: Company = {
  id: '00000000-0000-0000-0000-000000000077',
  name: 'X Corp',
  slug: 'x-corp',
  aliases: ['X', 'Twitter'],
  description: 'Social media platform (formerly Twitter) acquired by xAI in an all-stock transaction in March 2025 valuing X at $33 billion in equity ($45B enterprise value less $12B debt).',
  company_type: 'other',
  headquarters_country: 'United States',
  headquarters_city: 'San Francisco, CA',
  website_url: 'https://x.com',
  ticker: null,
  cik: null,
  is_public: false,
};

const DATABRICKS: Company = {
  id: '00000000-0000-0000-0000-000000000078',
  name: 'Databricks',
  slug: 'databricks',
  aliases: ['Databricks Inc.'],
  description: 'Data and AI company whose lakehouse platform powers enterprise AI apps and agents; closed a $1B Series K in September 2025 at a valuation over $100 billion.',
  company_type: 'ai_lab',
  headquarters_country: 'United States',
  headquarters_city: 'San Francisco, CA',
  website_url: 'https://www.databricks.com',
  ticker: null,
  cik: null,
  is_public: false,
};

export const EXTRA_COMPANIES: Company[] = [X_CORP, DATABRICKS];

const SRC_OPENAI_CNBC: Source = {
  id: '10000000-0000-0000-0000-000000000126',
  url: 'https://www.cnbc.com/2025/08/01/openai-raise-chatgpt-users.html',
  title: 'OpenAI raises $8.3 billion as paid ChatGPT biz users reach 5 million',
  publisher: 'CNBC',
  source_type: 'reputable_media',
  published_date: '2025-08-01',
  accessed_at: '2025-08-02T00:00:00Z',
  notes: 'Reports OpenAI secured $8.3B as part of its $40B fundraise, led by Dragoneer with a $2.8B check alongside Blackstone, TPG, T. Rowe Price, Sequoia, a16z and others; SoftBank remains lead backer of the broader effort.',
};

const SRC_OPENAI_TC: Source = {
  id: '10000000-0000-0000-0000-000000000127',
  url: 'https://techcrunch.com/2025/08/01/openai-reportedly-raises-8-3b-at-300b-valuation/',
  title: 'OpenAI reportedly raises $8.3B at $300B valuation',
  publisher: 'TechCrunch',
  source_type: 'reputable_media',
  published_date: '2025-08-01',
  accessed_at: '2025-08-02T00:00:00Z',
  notes: 'Confirms $8.3B close at a $300B valuation months ahead of schedule as part of the SoftBank-spearheaded $40B plan announced in March 2025.',
};

const SRC_XAI_REUTERS: Source = {
  id: '10000000-0000-0000-0000-000000000128',
  url: 'https://www.reuters.com/markets/deals/musks-xai-buys-social-media-platform-x-45-billion-2025-03-28/',
  title: "Musk's social media firm X bought by his AI company, valued at $33 billion",
  publisher: 'Reuters',
  source_type: 'reputable_media',
  published_date: '2025-03-28',
  accessed_at: '2025-03-29T00:00:00Z',
  notes: 'Reports xAI acquired X in an all-stock deal valuing X at $33B ($45B less $12B debt) and xAI at $80B, per Elon Musk announcement.',
};

const SRC_XAI_SC: Source = {
  id: '10000000-0000-0000-0000-000000000129',
  url: 'https://www.sullcrom.com/About/News-and-Events/Highlights/2025/March/xAI-X-Merge-113-Billion-Transaction',
  title: 'xAI and X Merge in a $113 Billion Transaction',
  publisher: 'Sullivan & Cromwell',
  source_type: 'company_release',
  published_date: '2025-03-28',
  accessed_at: '2025-03-29T00:00:00Z',
  notes: 'Deal counsel advisory confirming the xAI-X merger valuing xAI at $80B and X at $33B ($45B enterprise value less $12B of debt).',
};

const SRC_DATABRICKS_CLOSE: Source = {
  id: '10000000-0000-0000-0000-000000000130',
  url: 'https://www.databricks.com/company/newsroom/press-releases/databricks-surpasses-4b-revenue-run-rate-exceeding-1b-ai-revenue',
  title: 'Databricks Surpasses $4B Revenue Run-Rate; Closing $1B Series K at >$100B Valuation',
  publisher: 'Databricks',
  source_type: 'company_release',
  published_date: '2025-09-08',
  accessed_at: '2025-09-09T00:00:00Z',
  notes: 'Official Databricks announcement that the $1B Series K at over $100B valuation is closing, co-led by Andreessen Horowitz, Insight Partners, MGX, Thrive Capital and WCM Investment Management.',
};

const SRC_DATABRICKS_REUTERS: Source = {
  id: '10000000-0000-0000-0000-000000000131',
  url: 'https://www.reuters.com/business/autos-transportation/databricks-closes-1-billion-round-projects-4-billion-annualized-revenue-surging-2025-09-08/',
  title: 'Databricks closes $1 billion round, projects $4 billion in annualized revenue on surging AI demand',
  publisher: 'Reuters',
  source_type: 'reputable_media',
  published_date: '2025-09-08',
  accessed_at: '2025-09-09T00:00:00Z',
  notes: 'Confirms Databricks closed the $1B Series K at a $100B valuation, co-led by existing investors a16z, Insight, MGX, Thrive and WCM.',
};

const SRC_ANTHROPIC_REUTERS: Source = {
  id: '10000000-0000-0000-0000-000000000132',
  url: 'https://www.reuters.com/business/finance/anthropics-ipo-prospectus-shows-sweeping-ai-vision-surging-costs-2026-09-28/',
  title: "Anthropic's IPO prospectus shows sweeping AI vision, surging costs",
  publisher: 'Reuters',
  source_type: 'reputable_media',
  published_date: '2026-09-28',
  accessed_at: '2026-09-29T00:00:00Z',
  notes: 'Reuters review of the confidential IPO prospectus: ~$4.6B 2025 revenue, $42B net loss, $518B of coming cloud/compute obligations, potential $2T+ IPO valuation; follows a confidential June 2026 filing.',
};

const SRC_ANTHROPIC_CNBC: Source = {
  id: '10000000-0000-0000-0000-000000000133',
  url: 'https://www.cnbc.com/2026/09/28/anthropics-ipo-prospectus-shows-sweeping-ai-vision-surging-costs-reuters.html',
  title: "Anthropic's IPO prospectus shows sweeping AI vision, surging costs: Reuters",
  publisher: 'CNBC',
  source_type: 'reputable_media',
  published_date: '2026-09-28',
  accessed_at: '2026-09-29T00:00:00Z',
  notes: 'Corroborates the Reuters prospectus review and notes the public debut would follow SpaceX and target a record valuation above $2 trillion.',
};

export const EXTRA_SOURCES: Source[] = [
  SRC_OPENAI_CNBC,
  SRC_OPENAI_TC,
  SRC_XAI_REUTERS,
  SRC_XAI_SC,
  SRC_DATABRICKS_CLOSE,
  SRC_DATABRICKS_REUTERS,
  SRC_ANTHROPIC_REUTERS,
  SRC_ANTHROPIC_CNBC,
];

export const EXTRA_DEALS: Deal[] = [
  {
    id: '20000000-0000-0000-0000-000000000099',
    slug: 'openai-8-3-billion-dragoneer-tranche-2025',
    title: 'OpenAI $8.3 Billion Tranche at $300B Valuation Led by Dragoneer',
    summary: 'OpenAI secured $8.3 billion at a $300 billion valuation as part of its $40 billion 2025 fundraise, led by Dragoneer Investment Group with a $2.8 billion check alongside Blackstone, TPG, T. Rowe Price, Sequoia, Andreessen Horowitz and others, closing months ahead of schedule amid fivefold oversubscription.',
    deal_type: 'equity_investment',
    status: 'closed',
    announcement_date: '2025-08-01',
    effective_date: '2025-08-01',
    maturity_date: null,
    amount_value: 8300000000,
    amount_currency: 'USD',
    amount_basis: 'cash_investment',
    amount_period: 'Growth equity tranche of $40B program',
    amount_disclosed: true,
    geography: 'United States',
    evidence_level: 'reported_secondary',
    confidence_note: 'First reported by NYT DealBook and confirmed by CNBC/TechCrunch; Dragoneer led with $2.8B but is not in the ledger, so SoftBank (lead backer of the broader $40B program) is recorded as the investor party.',
    is_published: true,
    published_at: '2025-08-01T12:00:00Z',
    last_reviewed_at: '2025-09-01T00:00:00Z',
    parties: [
      {
        id: 'p-oai83-1',
        deal_id: '20000000-0000-0000-0000-000000000099',
        company_id: '00000000-0000-0000-0000-000000000004',
        role: 'investee',
        direction_note: 'Received $8.3B at $300B valuation toward the $40B 2025 fundraising program',
        company: findCompany('00000000-0000-0000-0000-000000000004'),
      },
      {
        id: 'p-oai83-2',
        deal_id: '20000000-0000-0000-0000-000000000099',
        company_id: '00000000-0000-0000-0000-000000000030',
        role: 'investor',
        direction_note: 'Lead backer of the broader $40B fundraising program of which this tranche is part',
        company: findCompany('00000000-0000-0000-0000-000000000030'),
      },
    ],
    sources: [
      {
        deal_id: '20000000-0000-0000-0000-000000000099',
        source_id: '10000000-0000-0000-0000-000000000126',
        supporting_note: 'Reports $8.3B secured led by Dragoneer ($2.8B) with SoftBank remaining lead backer of the $40B effort.',
        is_primary_support: true,
        source: SRC_OPENAI_CNBC,
      },
      {
        deal_id: '20000000-0000-0000-0000-000000000099',
        source_id: '10000000-0000-0000-0000-000000000127',
        supporting_note: 'Confirms $8.3B close at $300B valuation as part of the SoftBank-spearheaded $40B plan.',
        is_primary_support: false,
        source: SRC_OPENAI_TC,
      },
    ],
  },
  {
    id: '20000000-0000-0000-0000-000000000100',
    slug: 'xai-acquires-x-2025',
    title: 'xAI Acquires X in All-Stock Deal Valuing X at $33B',
    summary: 'xAI acquired social media platform X in an all-stock transaction valuing X at $33 billion in equity ($45 billion enterprise value less $12 billion of debt) and xAI at $80 billion, combining data, models, compute, distribution and talent under a single entity.',
    deal_type: 'acquisition',
    status: 'closed',
    announcement_date: '2025-03-28',
    effective_date: '2025-03-28',
    maturity_date: null,
    amount_value: 33000000000,
    amount_currency: 'USD',
    amount_basis: 'equity_valuation',
    amount_period: 'All-stock acquisition equity value',
    amount_disclosed: true,
    geography: 'United States',
    evidence_level: 'confirmed_primary',
    confidence_note: 'Announced by Elon Musk and confirmed by deal counsel Sullivan & Cromwell; $33B equity value equals $45B enterprise value less $12B debt, with xAI valued at $80B.',
    is_published: true,
    published_at: '2025-03-28T12:00:00Z',
    last_reviewed_at: '2025-04-15T00:00:00Z',
    parties: [
      {
        id: 'p-xaix-1',
        deal_id: '20000000-0000-0000-0000-000000000100',
        company_id: '00000000-0000-0000-0000-000000000018',
        role: 'investor',
        direction_note: 'Acquirer in the all-stock transaction, valued at $80B in the combination',
        company: findCompany('00000000-0000-0000-0000-000000000018'),
      },
      {
        id: 'p-xaix-2',
        deal_id: '20000000-0000-0000-0000-000000000100',
        company_id: '00000000-0000-0000-0000-000000000077',
        role: 'investee',
        direction_note: 'Acquired social platform valued at $33B equity ($45B EV less $12B debt)',
        company: X_CORP,
      },
    ],
    sources: [
      {
        deal_id: '20000000-0000-0000-0000-000000000100',
        source_id: '10000000-0000-0000-0000-000000000128',
        supporting_note: 'Reports the all-stock acquisition valuing X at $33B and xAI at $80B.',
        is_primary_support: true,
        source: SRC_XAI_REUTERS,
      },
      {
        deal_id: '20000000-0000-0000-0000-000000000100',
        source_id: '10000000-0000-0000-0000-000000000129',
        supporting_note: 'Deal counsel confirms merger terms: xAI $80B, X $33B ($45B EV less $12B debt).',
        is_primary_support: true,
        source: SRC_XAI_SC,
      },
    ],
  },
  {
    id: '20000000-0000-0000-0000-000000000101',
    slug: 'databricks-1-billion-series-k-2025',
    title: 'Databricks $1 Billion Series K at Over $100B Valuation',
    summary: 'Databricks closed a $1 billion Series K funding round at a valuation over $100 billion, co-led by existing investors Andreessen Horowitz, Insight Partners, MGX, Thrive Capital and WCM Investment Management, on the back of a $4 billion revenue run-rate and $1 billion AI revenue run-rate.',
    deal_type: 'equity_investment',
    status: 'closed',
    announcement_date: '2025-09-08',
    effective_date: '2025-09-08',
    maturity_date: null,
    amount_value: 1000000000,
    amount_currency: 'USD',
    amount_basis: 'cash_investment',
    amount_period: 'Series K equity round',
    amount_disclosed: true,
    geography: 'United States',
    evidence_level: 'confirmed_primary',
    confidence_note: 'Confirmed by official Databricks announcement and Reuters; term sheet signed August 19, 2025 and round closed September 8, 2025; MGX (co-lead, in-ledger) is recorded as the investor party.',
    is_published: true,
    published_at: '2025-09-08T12:00:00Z',
    last_reviewed_at: '2025-09-20T00:00:00Z',
    parties: [
      {
        id: 'p-dbk1b-1',
        deal_id: '20000000-0000-0000-0000-000000000101',
        company_id: '00000000-0000-0000-0000-000000000078',
        role: 'investee',
        direction_note: 'Received $1B at >$100B valuation to scale AI products and global growth',
        company: DATABRICKS,
      },
      {
        id: 'p-dbk1b-2',
        deal_id: '20000000-0000-0000-0000-000000000101',
        company_id: '00000000-0000-0000-0000-000000000029',
        role: 'investor',
        direction_note: 'Co-lead investor in the Series K alongside a16z, Insight, Thrive and WCM',
        company: findCompany('00000000-0000-0000-0000-000000000029'),
      },
    ],
    sources: [
      {
        deal_id: '20000000-0000-0000-0000-000000000101',
        source_id: '10000000-0000-0000-0000-000000000130',
        supporting_note: 'Official Databricks announcement of the closing $1B Series K at >$100B co-led by a16z, Insight, MGX, Thrive and WCM.',
        is_primary_support: true,
        source: SRC_DATABRICKS_CLOSE,
      },
      {
        deal_id: '20000000-0000-0000-0000-000000000101',
        source_id: '10000000-0000-0000-0000-000000000131',
        supporting_note: 'Confirms the closed $1B round at $100B valuation and co-lead investor list.',
        is_primary_support: false,
        source: SRC_DATABRICKS_REUTERS,
      },
    ],
  },
  {
    id: '20000000-0000-0000-0000-000000000102',
    slug: 'anthropic-ipo-prospectus-2026',
    title: 'Anthropic IPO Prospectus Reported Ahead of Potential Record Listing',
    summary: 'Anthropic moved toward what could be the largest IPO in history after Reuters reviewed its roughly 300-page IPO prospectus, showing nearly $4.6 billion of 2025 revenue, a $42 billion net loss, $518 billion of coming cloud and infrastructure obligations, and a potential valuation above $2 trillion; the confidential filing was made in June 2026 with a public prospectus expected in late September 2026.',
    deal_type: 'other',
    status: 'announced',
    announcement_date: '2026-09-28',
    effective_date: null,
    maturity_date: null,
    amount_value: null,
    amount_currency: null,
    amount_basis: null,
    amount_period: 'Planned initial public offering',
    amount_disclosed: false,
    geography: 'United States',
    evidence_level: 'reported_secondary',
    confidence_note: 'Prospectus not yet public; details per Reuters review of the confidential filing with CNBC/NYT corroboration. Offer size and pricing undisclosed; Amazon (existing major investor per the same reporting) is recorded as the investor party.',
    is_published: true,
    published_at: '2026-09-28T12:00:00Z',
    last_reviewed_at: '2026-10-10T00:00:00Z',
    parties: [
      {
        id: 'p-antipo-1',
        deal_id: '20000000-0000-0000-0000-000000000102',
        company_id: '00000000-0000-0000-0000-000000000006',
        role: 'investee',
        direction_note: 'Prospective issuer pursuing a record public listing at a reported $2T+ valuation target',
        company: findCompany('00000000-0000-0000-0000-000000000006'),
      },
      {
        id: 'p-antipo-2',
        deal_id: '20000000-0000-0000-0000-000000000102',
        company_id: '00000000-0000-0000-0000-000000000005',
        role: 'investor',
        direction_note: 'Existing major investor and cloud partner confirmed in the prospectus reporting, not an IPO underwriter',
        company: findCompany('00000000-0000-0000-0000-000000000005'),
      },
    ],
    sources: [
      {
        deal_id: '20000000-0000-0000-0000-000000000102',
        source_id: '10000000-0000-0000-0000-000000000132',
        supporting_note: 'Reuters exclusive review of the IPO prospectus detailing financials, obligations and valuation target.',
        is_primary_support: true,
        source: SRC_ANTHROPIC_REUTERS,
      },
      {
        deal_id: '20000000-0000-0000-0000-000000000102',
        source_id: '10000000-0000-0000-0000-000000000133',
        supporting_note: 'Corroborates prospectus details and record-listing valuation expectations.',
        is_primary_support: false,
        source: SRC_ANTHROPIC_CNBC,
      },
    ],
  },
];

export const EXTRA_RELATIONSHIPS: Relationship[] = [
  {
    id: '30000000-0000-0000-0000-000000000062',
    from_company_id: '00000000-0000-0000-0000-000000000018',
    to_company_id: '00000000-0000-0000-0000-000000000077',
    relationship_type: 'equity_shareholder',
    start_date: '2025-03-28',
    end_date: null,
    description: 'xAI owns X Corp following the March 2025 all-stock acquisition valuing X at $33B in equity.',
    evidence_level: 'confirmed_primary',
    is_published: true,
    from_company: findCompany('00000000-0000-0000-0000-000000000018'),
    to_company: X_CORP,
    sources: [
      {
        relationship_id: '30000000-0000-0000-0000-000000000062',
        source_id: '10000000-0000-0000-0000-000000000128',
        supporting_note: 'Reuters reports xAI acquired X in an all-stock deal at a $33B equity valuation.',
        source: SRC_XAI_REUTERS,
      },
    ],
  },
  {
    id: '30000000-0000-0000-0000-000000000063',
    from_company_id: '00000000-0000-0000-0000-000000000029',
    to_company_id: '00000000-0000-0000-0000-000000000078',
    relationship_type: 'equity_shareholder',
    start_date: '2025-09-08',
    end_date: null,
    description: 'MGX co-lead equity investor in Databricks Series K at a valuation over $100 billion.',
    evidence_level: 'confirmed_primary',
    is_published: true,
    from_company: findCompany('00000000-0000-0000-0000-000000000029'),
    to_company: DATABRICKS,
    sources: [
      {
        relationship_id: '30000000-0000-0000-0000-000000000063',
        source_id: '10000000-0000-0000-0000-000000000130',
        supporting_note: 'Databricks names MGX among the Series K co-leads.',
        source: SRC_DATABRICKS_CLOSE,
      },
    ],
  },
];
