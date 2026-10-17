import { Company, Deal, Relationship, Source } from '../types';
import { findCompany } from './dataset';

// LANE 6b (M&A sweep follow-up): Stripe's acquisition of OpenRouter — the
// event the orchestrator's user half-remembered as "NVIDIA/OpenAI bought
// OpenRouter". Verified 2026-10-17: Stripe announced the deal itself on
// August 19, 2026; official terms were NOT disclosed, so per ledger policy
// the amount stays null while press figures ($7.5B NYT, $8B+ Semafor) live
// in the confidence note only. Recorded as announced (not closed): sources
// as of the review date say "agrees to acquire"; no closing announcement
// was found. OpenRouter is the AI model marketplace/"Stripe for LLMs"
// routing 10T+ tokens/day across 400+ models.

const STRIPE: Company = {
  id: '00000000-0000-0000-0000-000000000092',
  name: 'Stripe, Inc.',
  slug: 'stripe',
  aliases: ['Stripe', 'stripe.com'],
  description:
    'Private U.S. fintech building payments and financial infrastructure for businesses; expanding into agentic-commerce and AI-economy infrastructure, including its largest-ever acquisition: OpenRouter, the AI model marketplace and gateway.',
  company_type: 'other',
  headquarters_country: 'United States',
  headquarters_city: 'San Francisco, CA',
  website_url: 'https://stripe.com',
  ticker: null,
  cik: null,
  is_public: false,
};

const OPENROUTER: Company = {
  id: '00000000-0000-0000-0000-000000000093',
  name: 'OpenRouter',
  slug: 'openrouter',
  aliases: ['OpenRouter Inc.'],
  description:
    'First and largest AI model marketplace and inference gateway ("Stripe for LLMs"), routing 10+ trillion tokens per day across 400+ models for 10M+ developers; agreed to be acquired by Stripe in August 2026, its largest deal on record per Semafor.',
  company_type: 'other',
  headquarters_country: 'United States',
  headquarters_city: 'New York, NY',
  website_url: 'https://openrouter.ai',
  ticker: null,
  cik: null,
  is_public: false,
};

export const EXTRA_COMPANIES: Company[] = [STRIPE, OPENROUTER];

const SRC_STRIPE_NEWSROOM: Source = {
  id: '10000000-0000-0000-0000-000000000176',
  url: 'https://stripe.com/newsroom/news/stripe-agrees-to-acquire-openrouter',
  title: 'Stripe agrees to acquire OpenRouter to help businesses optimize token routing and usage',
  publisher: 'Stripe Newsroom',
  source_type: 'company_release',
  published_date: '2026-08-19',
  accessed_at: '2026-10-17T00:00:00Z',
  notes:
    'Official Stripe announcement that it agrees to acquire OpenRouter; CEO Patrick Collison quoted on building the economic infrastructure for AI. Terms not disclosed in the release.',
};

const SRC_OPENROUTER_BLOG: Source = {
  id: '10000000-0000-0000-0000-000000000177',
  url: 'https://openrouter.ai/blog/announcements/openrouter-is-joining-stripe',
  title: 'OpenRouter is Joining Stripe',
  publisher: 'OpenRouter',
  source_type: 'company_release',
  published_date: '2026-08-19',
  accessed_at: '2026-10-17T00:00:00Z',
  notes:
    "OpenRouter's own announcement of joining Stripe; states 10+ trillion tokens processed daily across 400+ models and 10M+ developers, with 10x yearly growth in inference volume.",
};

const SRC_NYT: Source = {
  id: '10000000-0000-0000-0000-000000000178',
  url: 'https://www.nytimes.com/2026/08/19/business/stripe-openrouter-ai.html',
  title: 'Stripe Buys A.I. Start-Up OpenRouter for $7.5 Billion',
  publisher: 'The New York Times',
  source_type: 'reputable_media',
  published_date: '2026-08-19',
  accessed_at: '2026-10-17T00:00:00Z',
  notes:
    'NYT reports a ~$7.5B price tag citing a person familiar ($1.5B allocated to OpenRouter founders); Stripe officially declined to disclose terms — reported figures stay out of the ledger amount.',
};

export const EXTRA_SOURCES: Source[] = [SRC_STRIPE_NEWSROOM, SRC_OPENROUTER_BLOG, SRC_NYT];

export const EXTRA_DEALS: Deal[] = [
  {
    id: '20000000-0000-0000-0000-000000000127',
    slug: 'stripe-acquires-openrouter-2026',
    title: 'Stripe Agrees to Acquire OpenRouter, the AI Model Marketplace',
    summary:
      'Stripe announced on August 19, 2026 that it agreed to acquire OpenRouter, the largest AI model marketplace and inference gateway, routing 10+ trillion tokens daily across 400+ models and marketed by observers as "Stripe for LLMs." Stripe positions the deal as building "the economic infrastructure for AI": payments plus intelligent token routing so businesses maximize profitability across AI spend and AI revenue. Official terms were not disclosed; press reports put the price around $7.5 billion (NYT) to $8 billion-plus (Semafor), roughly 6x OpenRouter\u2019s May 2026 $1.3B Series B valuation. This is Stripe\u2019s largest acquisition on record.',
    deal_type: 'acquisition',
    status: 'announced',
    announcement_date: '2026-08-19',
    effective_date: null,
    maturity_date: null,
    amount_value: null,
    amount_currency: 'USD',
    amount_basis: null,
    amount_period: 'Reported consideration ~$7.5B-$8B+ (NYT/Semafor/Bloomberg); officially undisclosed',
    amount_disclosed: false,
    geography: 'United States',
    evidence_level: 'confirmed_primary',
    confidence_note:
      'Deal existence confirmed_primary by both parties\u2019 own announcements (Stripe newsroom + OpenRouter blog, both August 19, 2026). Amount NOT confirmed by either party: NYT reported ~$7.5B (Aug 19) citing a person familiar; Bloomberg/TechCrunch first reported "$7B-plus" (Aug 16 talks leak); Semafor reported $8B+ (Aug 21). Per ledger policy the cash amount stays null and reported figures live in note fields only. Status recorded as announced: sources as of last review (2026-10-17) describe an agreement; no completion announcement verified.',
    is_published: true,
    published_at: '2026-08-19T12:00:00Z',
    last_reviewed_at: '2026-10-17T00:00:00Z',
    parties: [
      {
        id: 'p-ma2-or-1',
        deal_id: '20000000-0000-0000-0000-000000000127',
        company_id: '00000000-0000-0000-0000-000000000092',
        role: 'investor',
        direction_note: 'Acquirer; unconfirmed reported consideration ~$7.5B-$8B+; its largest deal on record',
        company: STRIPE,
      },
      {
        id: 'p-ma2-or-2',
        deal_id: '20000000-0000-0000-0000-000000000127',
        company_id: '00000000-0000-0000-0000-000000000093',
        role: 'investee',
        direction_note: 'AI model marketplace and gateway joining Stripe to power agentic-AI payments infrastructure',
        company: OPENROUTER,
      },
    ],
    sources: [
      {
        deal_id: '20000000-0000-0000-0000-000000000127',
        source_id: '10000000-0000-0000-0000-000000000176',
        supporting_note: 'Official Stripe announcement of the agreement to acquire OpenRouter.',
        is_primary_support: true,
        source: SRC_STRIPE_NEWSROOM,
      },
      {
        deal_id: '20000000-0000-0000-0000-000000000127',
        source_id: '10000000-0000-0000-0000-000000000177',
        supporting_note: "OpenRouter's own announcement confirming it is joining Stripe.",
        is_primary_support: true,
        source: SRC_OPENROUTER_BLOG,
      },
      {
        deal_id: '20000000-0000-0000-0000-000000000127',
        source_id: '10000000-0000-0000-0000-000000000178',
        supporting_note: 'NYT reported price context (~$7.5B, founders\u2019 allocation) — reported-secondary, not ledger cash.',
        is_primary_support: false,
        source: SRC_NYT,
      },
    ],
  },
];

export const EXTRA_RELATIONSHIPS: Relationship[] = [
  {
    id: '30000000-0000-0000-0000-000000000088',
    from_company_id: '00000000-0000-0000-0000-000000000092',
    to_company_id: '00000000-0000-0000-0000-000000000093',
    relationship_type: 'strategic_partner',
    start_date: '2026-08-19',
    end_date: null,
    description:
      'Stripe agreed to acquire OpenRouter (announced August 19, 2026, terms undisclosed); recorded as strategic_partner rather than equity_shareholder because no completion was confirmed as of the last review.',
    evidence_level: 'confirmed_primary',
    is_published: true,
    from_company: STRIPE,
    to_company: OPENROUTER,
    sources: [
      {
        relationship_id: '30000000-0000-0000-0000-000000000088',
        source_id: '10000000-0000-0000-0000-000000000176',
        supporting_note: 'Official Stripe announcement of the agreement.',
        source: SRC_STRIPE_NEWSROOM,
      },
    ],
  },
];
