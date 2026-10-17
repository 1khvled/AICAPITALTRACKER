import type { Company, Deal, Relationship, Source } from '../types';
import { findCompany } from './dataset';

// LANE 2 (debt and mega-financing sweep). Only deal/source/relationship IDs
// from this lane's allocated blocks are used below. No new companies.

export const EXTRA_COMPANIES: Company[] = [];

export const EXTRA_SOURCES: Source[] = [
  {
    id: '10000000-0000-0000-0000-000000000091',
    url: 'https://www.reuters.com/business/musks-xai-raises-5-billion-each-fresh-debt-equity-morgan-stanley-says-2025-07-01/',
    title: "Musk's xAI raises $5 billion each in fresh debt and equity, Morgan Stanley says",
    publisher: 'Reuters',
    source_type: 'reputable_media',
    published_date: '2025-07-01',
    accessed_at: '2026-10-16T00:00:00Z',
    notes: 'Reuters report on Morgan Stanley statement confirming xAI completed a $5 billion secured debt raise (notes and term loans) alongside a separate $5 billion strategic equity investment.',
  },
  {
    id: '10000000-0000-0000-0000-000000000092',
    url: 'https://www.cnbc.com/2025/07/01/elon-musk-xai-raises-10-billion-in-debt-and-equity.html',
    title: "Elon Musk's xAI raises $10 billion in debt and equity",
    publisher: 'CNBC',
    source_type: 'reputable_media',
    published_date: '2025-07-01',
    accessed_at: '2026-10-16T00:00:00Z',
    notes: 'CNBC report confirming $5B debt via secured notes and term loans plus $5B strategic equity; debt offering oversubscribed; proceeds fund Colossus data center expansion and Grok development.',
  },
];

export const EXTRA_DEALS: Deal[] = [
  // xAI $5B secured debt financing arranged by Morgan Stanley (Jul 2025)
  {
    id: '20000000-0000-0000-0000-000000000080',
    slug: 'xai-5-billion-secured-debt-financing-morgan-stanley-2025',
    title: 'xAI $5 Billion Secured Debt Financing Arranged by Morgan Stanley',
    summary:
      'xAI completed a $5 billion debt raise structured as secured notes and term loans arranged by Morgan Stanley; the offering was oversubscribed with prominent global debt investors and proceeds support Colossus data center expansion and Grok development. A parallel $5 billion strategic equity investment closed alongside the debt and is noted here for context only; it is not counted in this deal amount.',
    deal_type: 'debt_credit_facility',
    status: 'closed',
    announcement_date: '2025-07-01',
    effective_date: '2025-07-01',
    maturity_date: null,
    amount_value: 5000000000,
    amount_currency: 'USD',
    amount_basis: 'credit_facility',
    amount_period: 'Senior secured notes and term loans',
    amount_disclosed: true,
    geography: 'United States',
    evidence_level: 'reported_secondary',
    confidence_note:
      'No issuer primary release located; corroborated by Morgan Stanley arranger statement as reported independently by Reuters and CNBC on 2025-07-01.',
    is_published: true,
    published_at: '2025-07-01T12:00:00Z',
    last_reviewed_at: '2026-10-16T00:00:00Z',
    parties: [
      {
        id: 'p-sweep-debt-080-1',
        deal_id: '20000000-0000-0000-0000-000000000080',
        company_id: '00000000-0000-0000-0000-000000000018',
        role: 'borrower',
        direction_note: 'Borrower raising secured debt capacity for AI data center buildout',
        company: findCompany('xai'),
      },
      {
        id: 'p-sweep-debt-080-2',
        deal_id: '20000000-0000-0000-0000-000000000080',
        company_id: '00000000-0000-0000-0000-000000000036',
        role: 'lender',
        direction_note: 'Sole arranger of secured notes and term loan offering',
        company: findCompany('morgan-stanley'),
      },
    ],
    sources: [
      {
        deal_id: '20000000-0000-0000-0000-000000000080',
        source_id: '10000000-0000-0000-0000-000000000091',
        supporting_note: 'Reuters account of Morgan Stanley statement confirming $5B debt plus $5B equity raise terms.',
        is_primary_support: true,
        source: EXTRA_SOURCES[0],
      },
      {
        deal_id: '20000000-0000-0000-0000-000000000080',
        source_id: '10000000-0000-0000-0000-000000000092',
        supporting_note: 'CNBC independent corroboration of debt structure, oversubscription, and use of proceeds.',
        is_primary_support: false,
        source: EXTRA_SOURCES[1],
      },
    ],
  },
];

export const EXTRA_RELATIONSHIPS: Relationship[] = [
  {
    id: '30000000-0000-0000-0000-000000000047',
    from_company_id: '00000000-0000-0000-0000-000000000036',
    to_company_id: '00000000-0000-0000-0000-000000000018',
    relationship_type: 'debt_lender',
    start_date: '2025-07-01',
    end_date: null,
    description: 'Morgan Stanley acted as arranger and lender syndicate lead for xAI $5 billion secured notes and term loan financing.',
    evidence_level: 'reported_secondary',
    is_published: true,
    from_company: findCompany('morgan-stanley'),
    to_company: findCompany('xai'),
    sources: [
      {
        relationship_id: '30000000-0000-0000-0000-000000000047',
        source_id: '10000000-0000-0000-0000-000000000091',
        supporting_note: 'Reuters reports Morgan Stanley statement on completed $5B xAI debt financing.',
        source: EXTRA_SOURCES[0],
      },
    ],
  },
];
