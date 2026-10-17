import type { Company, Deal, Relationship, Source } from '../types';
import { findCompany } from './dataset';

// LANE E (2025-2026 mega raises sweep, verified 2026-10-17). Adds the verified
// 2025-2026 mega primary equity rounds not yet in the ledger: xAI $20B Series E
// (Jan 2026), Anthropic $30B Series G at $380B (Feb 2026), OpenAI's record $122B
// round at $852B post-money (closed Mar 31, 2026, after the $110B announcement of
// Feb 27), Anthropic $65B Series H at $965B (May 2026), Anduril $5B Series H at
// $61B (May 2026; supersedes the June 2025 $2.5B/$30.5B Series G, which is cited
// as context) and Mistral AI's €3B Series D at €21B+ (Sep 2026). Investor-side
// parties reuse existing ledger companies only (NVIDIA, MGX, SoftBank, a16z,
// Amazon); leads outside the ledger (Valor, GIC/Coatue, Altimeter/Dragoneer/
// Greenoaks/Sequoia, Samsung/EQT/PSG, Thrive) are named in summaries. The
// verified OpenAI $6.6B employee secondary at $500B (Oct 2025) was dropped from
// this batch in favor of the larger verified 2026 primary rounds (report-only).
// Only deal IDs ...134-139, source IDs ...189-196, relationship IDs ...095-100,
// and new company ...099 (Anduril) are used; company ...106 was not needed
// because every party resolves to an existing ledger company.

const ANDURIL: Company = {
  id: '00000000-0000-0000-0000-000000000099',
  name: 'Anduril Industries',
  slug: 'anduril-industries',
  aliases: ['Anduril', 'Anduril Industries Inc.'],
  description:
    'Defense technology company founded by Palmer Luckey and led by co-founder CEO Brian Schimpf, building the Lattice command-and-control platform and autonomous air, land, and sea systems; closed a $2.5B Series G at $30.5B (June 2025, Founders Fund-led) and a $5B Series H at $61B (May 2026, Thrive Capital and Andreessen Horowitz co-led) after more than doubling revenue to $2.2B in 2025.',
  company_type: 'ai_lab',
  headquarters_country: 'United States',
  headquarters_city: 'Costa Mesa, CA',
  website_url: 'https://www.anduril.com',
  ticker: null,
  cik: null,
  is_public: false,
};

export const EXTRA_COMPANIES: Company[] = [ANDURIL];

const SRC_XAI_RELEASE: Source = {
  id: '10000000-0000-0000-0000-000000000189',
  url: 'https://x.ai/news/series-e',
  title: 'xAI Raises $20B Series E',
  publisher: 'xAI',
  source_type: 'company_release',
  published_date: '2026-01-06',
  accessed_at: '2026-10-17T00:00:00Z',
  notes:
    'Official xAI announcement: upsized Series E completed at $20B, exceeding the $15B target. Participating investors include Valor Equity Partners, StepStone Group, Fidelity Management & Research Company, QIA, MGX and Baron Capital Group; strategic investors are NVIDIA and Cisco Investments. Release notes Colossus I and II ended 2025 with over one million H100 GPU equivalents, Grok 5 in training, and that the financing will accelerate infrastructure buildout, product deployment and research.',
};

const SRC_XAI_BLOOMBERG: Source = {
  id: '10000000-0000-0000-0000-000000000190',
  url: 'https://www.bloomberg.com/news/articles/2026-01-06/musk-s-xai-closed-20-billion-funding-round-with-nvidia-backing',
  title: "Musk's xAI Closed $20 Billion Funding With Nvidia Backing",
  publisher: 'Bloomberg',
  source_type: 'reputable_media',
  published_date: '2026-01-06',
  accessed_at: '2026-10-17T00:00:00Z',
  notes:
    'Bloomberg: NVIDIA among the investors with as much as $2 billion planned (previously reported); company did not specify individual amounts or break out debt vs. equity portions. Bloomberg and Reuters had reported during the round (Oct 7, 2025) a planned split of roughly $7.5B equity plus as much as $12.5B of SPV debt that buys NVIDIA processors leased back to xAI for five years.',
};

const SRC_ANTHROPIC_G_RELEASE: Source = {
  id: '10000000-0000-0000-0000-000000000191',
  url: 'https://www.anthropic.com/news/anthropic-raises-30-billion-series-g-funding-380-billion-post-money-valuation',
  title: 'Anthropic raises $30 billion in Series G funding at $380 billion post-money valuation',
  publisher: 'Anthropic',
  source_type: 'company_release',
  published_date: '2026-02-12',
  accessed_at: '2026-10-17T00:00:00Z',
  notes:
    'Official Anthropic announcement: $30B Series G at $380B post-money led by GIC and Coatue, co-led by D. E. Shaw Ventures, Dragoneer, Founders Fund, ICONIQ and MGX; significant investors include Accel, Altimeter, Blackstone, Fidelity, General Catalyst, Jane Street, Lightspeed, QIA, Sequoia, Temasek and TPG, and the round "also includes a portion of the previously announced investments from Microsoft and NVIDIA" (up to $5B and $10B announced Nov 18, 2025).',
};

const SRC_OPENAI_RELEASE: Source = {
  id: '10000000-0000-0000-0000-000000000192',
  url: 'https://openai.com/index/accelerating-the-next-phase-ai/',
  title: 'OpenAI raises $122 billion to accelerate the next phase of AI',
  publisher: 'OpenAI',
  source_type: 'company_release',
  published_date: '2026-03-31',
  accessed_at: '2026-10-17T00:00:00Z',
  notes:
    'Official OpenAI announcement: "we closed our latest funding round with $122 billion in committed capital at a post money valuation of $852 billion." Round anchored by strategic partners Amazon ($50B), NVIDIA ($30B) and SoftBank ($30B), with continued participation from Microsoft; SoftBank co-led the round alongside a16z, D. E. Shaw Ventures, MGX, TPG and accounts advised by T. Rowe Price Associates. Expanded NVIDIA collaboration: 3 GW dedicated inference and 2 GW training on Vera Rubin systems.',
};

const SRC_OPENAI_CNBC: Source = {
  id: '10000000-0000-0000-0000-000000000193',
  url: 'https://www.cnbc.com/2026/03/31/openai-funding-round-ipo.html',
  title: 'OpenAI closes record-breaking $122 billion funding round as anticipation builds for IPO',
  publisher: 'CNBC',
  source_type: 'reputable_media',
  published_date: '2026-03-31',
  accessed_at: '2026-10-17T00:00:00Z',
  notes:
    'CNBC: round totaled $122B of committed capital, up from the $110B announced in February (Amazon up to $50B, NVIDIA $30B, SoftBank $30B); the additional $12B came from a broader pool including $3B from individual investors via bank channels for the first time; SoftBank co-led alongside a16z and D. E. Shaw Ventures; Amazon second tranche of $35B conditional. Bloomberg and WSJ carried the close the same day.',
};

const SRC_MISTRAL_RELEASE: Source = {
  id: '10000000-0000-0000-0000-000000000194',
  url: 'https://mistral.ai/news/mistral-makes-sovereign-open-weight-ai-to-frontier/',
  title: 'Mistral raises €3B to make sovereign, open-weight AI the technology frontier',
  publisher: 'Mistral AI',
  source_type: 'company_release',
  published_date: '2026-09-08',
  accessed_at: '2026-10-17T00:00:00Z',
  notes:
    'Official Mistral announcement: €3B Series D at more than €21B post-money, the largest equity fundraising round ever completed by a European technology company. Samsung Electronics led, with co-leads Scaleup Europe Fund (managed by EQT) and existing investor PSG Equity; new investors Advent, BlackRock-managed funds and the Grand Duchy of Luxembourg; existing investors including a16z, ASML, NVIDIA, Lightspeed, General Catalyst, DST Global, Index Ventures, Salesforce Ventures and Bpifrance participated.',
};

const SRC_ANDURIL_RELEASE: Source = {
  id: '10000000-0000-0000-0000-000000000195',
  url: 'https://www.anduril.com/news/anduril-announces-usd5b-series-h-raise',
  title: 'Anduril Announces $5B Series H Raise',
  publisher: 'Anduril Industries',
  source_type: 'company_release',
  published_date: '2026-05-13',
  accessed_at: '2026-10-17T00:00:00Z',
  notes:
    'Official Anduril announcement by co-founder CEO Brian Schimpf: $5B Series H at a $61B valuation led by Thrive Capital and Andreessen Horowitz, funding manufacturing capacity, R&D and the infrastructure to build and field advanced defense systems at scale; the accompanying investor letter reports revenue more than doubled to $2.2B in 2025.',
};

const SRC_ANTHROPIC_H_RELEASE: Source = {
  id: '10000000-0000-0000-0000-000000000196',
  url: 'https://www.anthropic.com/news/series-h',
  title: 'Anthropic raises $65B in Series H funding at $965B post-money valuation',
  publisher: 'Anthropic',
  source_type: 'company_release',
  published_date: '2026-05-28',
  accessed_at: '2026-10-17T00:00:00Z',
  notes:
    'Official Anthropic announcement: $65B Series H at $965B post-money led by Altimeter Capital, Dragoneer, Greenoaks and Sequoia Capital; co-led by Capital Group, Coatue, D1 Capital Partners, GIC, ICONIQ and XN; significant investors include Blackstone, Brookfield, D.E. Shaw Ventures, DST Global, Fidelity, General Catalyst, Jane Street, Lightspeed, MGX, T. Rowe Price and Temasek; includes $15B of previously committed hyperscaler investments ($5B from Amazon) plus strategic infrastructure partners Micron, Samsung and SK hynix.',
};

export const EXTRA_SOURCES: Source[] = [
  SRC_XAI_RELEASE,
  SRC_XAI_BLOOMBERG,
  SRC_ANTHROPIC_G_RELEASE,
  SRC_OPENAI_RELEASE,
  SRC_OPENAI_CNBC,
  SRC_MISTRAL_RELEASE,
  SRC_ANDURIL_RELEASE,
  SRC_ANTHROPIC_H_RELEASE,
];

export const EXTRA_DEALS: Deal[] = [
  {
    id: '20000000-0000-0000-0000-000000000134',
    slug: 'xai-20-billion-series-e-2026',
    title: 'xAI $20 Billion Series E Funding Round',
    summary:
      'xAI completed its upsized $20 billion Series E funding round, exceeding the original $15 billion target. Valor Equity Partners, StepStone Group, Fidelity Management & Research Company, Qatar Investment Authority, MGX and Baron Capital Group participated, with NVIDIA and Cisco Investments joining as strategic investors (NVIDIA had planned as much as $2B per Bloomberg). Bloomberg reported during the round a planned split of roughly $7.5B of equity plus as much as $12.5B of SPV debt to purchase NVIDIA processors leased back to xAI for five years; the company did not break out portions or confirm a valuation, with press reports citing roughly $230B. The release cites Colossus I and II ending 2025 with over one million H100 GPU equivalents and says proceeds accelerate infrastructure buildout, product deployment and research, with Grok 5 in training.',
    deal_type: 'equity_investment',
    status: 'closed',
    announcement_date: '2026-01-06',
    effective_date: '2026-01-06',
    maturity_date: null,
    amount_value: 20000000000,
    amount_currency: 'USD',
    amount_basis: 'cash_investment',
    amount_period: 'Series E equity round including SPV-financed GPU purchase component',
    amount_disclosed: true,
    geography: 'United States',
    evidence_level: 'confirmed_primary',
    confidence_note:
      'Company announcement of January 6, 2026 corroborated by Reuters, Bloomberg, CNBC and TechCrunch the same day; the $20B total is company-confirmed while the equity/SPV-debt split and the ~$230B valuation remain unconfirmed by the company.',
    is_published: true,
    published_at: '2026-01-06T12:00:00Z',
    last_reviewed_at: '2026-10-17T00:00:00Z',
    parties: [
      {
        id: 'p-raise2-134-1',
        deal_id: '20000000-0000-0000-0000-000000000134',
        company_id: '00000000-0000-0000-0000-000000000018',
        role: 'investee',
        direction_note: 'Raised $20B upsized Series E to accelerate infrastructure buildout and Grok 5 development',
        company: findCompany('xai'),
      },
      {
        id: 'p-raise2-134-2',
        deal_id: '20000000-0000-0000-0000-000000000134',
        company_id: '00000000-0000-0000-0000-000000000001',
        role: 'investor',
        direction_note: 'Strategic investor (as much as $2B planned per Bloomberg) alongside Valor, StepStone, Fidelity, QIA, MGX, Baron and Cisco Investments',
        company: findCompany('nvidia'),
      },
    ],
    sources: [
      {
        deal_id: '20000000-0000-0000-0000-000000000134',
        source_id: '10000000-0000-0000-0000-000000000189',
        supporting_note: 'Official xAI announcement of the completed upsized $20B Series E and investor list.',
        is_primary_support: true,
        source: SRC_XAI_RELEASE,
      },
      {
        deal_id: '20000000-0000-0000-0000-000000000134',
        source_id: '10000000-0000-0000-0000-000000000190',
        supporting_note: 'Bloomberg confirmation of the closed round, NVIDIA backing, and equity/SPV-debt structure.',
        is_primary_support: false,
        source: SRC_XAI_BLOOMBERG,
      },
    ],
  },
  {
    id: '20000000-0000-0000-0000-000000000135',
    slug: 'anthropic-30-billion-series-g-2026',
    title: 'Anthropic $30 Billion Series G Funding Round at $380 Billion Valuation',
    summary:
      'Anthropic raised $30 billion in a Series G at a $380 billion post-money valuation, led by GIC and Coatue and co-led by D. E. Shaw Ventures, Dragoneer, Founders Fund, ICONIQ and MGX, with participation from Accel, Altimeter, Blackstone, Fidelity, General Catalyst, Jane Street, Lightspeed, QIA, Sequoia, Temasek, TPG and others. The round includes a portion of the previously announced Microsoft (up to $5B) and NVIDIA (up to $10B) investment commitments. CNBC called it the second-biggest private tech financing on record at announcement, after OpenAI\'s 2025 raise; OpenAI\'s $122B round (March 2026) and Anthropic\'s own $65B Series H (May 2026) have since surpassed it. Proceeds fund frontier research, product development, and infrastructure expansion behind Claude.',
    deal_type: 'equity_investment',
    status: 'closed',
    announcement_date: '2026-02-12',
    effective_date: '2026-02-12',
    maturity_date: null,
    amount_value: 30000000000,
    amount_currency: 'USD',
    amount_basis: 'cash_investment',
    amount_period: 'Series G primary equity round',
    amount_disclosed: true,
    geography: 'United States',
    evidence_level: 'confirmed_primary',
    confidence_note:
      'Confirmed by official Anthropic announcement and corroborated by Bloomberg, CNBC, TechCrunch and Crunchbase the same day; $30B amount, $380B post-money valuation, GIC/Coatue lead, and MGX co-lead all company-stated. Microsoft and NVIDIA participation is limited to a portion of their previously announced November 2025 commitments.',
    is_published: true,
    published_at: '2026-02-12T12:00:00Z',
    last_reviewed_at: '2026-10-17T00:00:00Z',
    parties: [
      {
        id: 'p-raise2-135-1',
        deal_id: '20000000-0000-0000-0000-000000000135',
        company_id: '00000000-0000-0000-0000-000000000006',
        role: 'investee',
        direction_note: 'Raised $30B Series G at $380B post-money for frontier research, product development and infrastructure',
        company: findCompany('anthropic'),
      },
      {
        id: 'p-raise2-135-2',
        deal_id: '20000000-0000-0000-0000-000000000135',
        company_id: '00000000-0000-0000-0000-000000000029',
        role: 'investor',
        direction_note: 'Co-lead investor alongside GIC, Coatue, D. E. Shaw Ventures, Dragoneer, Founders Fund and ICONIQ',
        company: findCompany('mgx'),
      },
    ],
    sources: [
      {
        deal_id: '20000000-0000-0000-0000-000000000135',
        source_id: '10000000-0000-0000-0000-000000000191',
        supporting_note: 'Official Anthropic announcement of the $30B Series G at $380B post-money and investor roster.',
        is_primary_support: true,
        source: SRC_ANTHROPIC_G_RELEASE,
      },
    ],
  },
  {
    id: '20000000-0000-0000-0000-000000000136',
    slug: 'openai-122-billion-round-2026',
    title: 'OpenAI $122 Billion Funding Round at $852 Billion Post-Money Valuation',
    summary:
      'OpenAI closed its latest funding round with $122 billion in committed capital at an $852 billion post-money valuation — the largest private financing in history — after announcing $110 billion at a $730 billion pre-money valuation on February 27, 2026. The round was anchored by strategic partners Amazon ($50B, of which $35B is contingent on an IPO or reaching AGI), NVIDIA ($30B) and SoftBank ($30B), with continued participation from Microsoft; SoftBank co-led alongside Andreessen Horowitz, D. E. Shaw Ventures, MGX, TPG and accounts advised by T. Rowe Price Associates. OpenAI extended participation to individual investors through bank channels for the first time, raising $3 billion. The expanded NVIDIA collaboration includes 3 GW of dedicated inference and 2 GW of Vera Rubin training capacity, and the Amazon partnership expands the $38B AWS compute deal by $100B with AWS as exclusive third-party cloud distributor for OpenAI Frontier.',
    deal_type: 'equity_investment',
    status: 'closed',
    announcement_date: '2026-03-31',
    effective_date: '2026-03-31',
    maturity_date: null,
    amount_value: 122000000000,
    amount_currency: 'USD',
    amount_basis: 'commitment',
    amount_period: 'Funding round announced February 27, 2026 at $110B, closed March 31, 2026 at $122B',
    amount_disclosed: true,
    geography: 'United States',
    evidence_level: 'confirmed_primary',
    confidence_note:
      'Company release of March 31, 2026 states the round closed with $122B in committed capital at $852B post-money; corroborated the same day by CNBC, Bloomberg and WSJ. Recorded as commitment because the company itself describes committed capital, $35B of Amazon\'s $50B is contingent on an IPO or AGI milestone, and additional investors were expected while the round progressed. Per-investor splits are company-stated and Bloomberg-corroborated.',
    is_published: true,
    published_at: '2026-03-31T12:00:00Z',
    last_reviewed_at: '2026-10-17T00:00:00Z',
    parties: [
      {
        id: 'p-raise2-136-1',
        deal_id: '20000000-0000-0000-0000-000000000136',
        company_id: '00000000-0000-0000-0000-000000000004',
        role: 'investee',
        direction_note: 'Closed $122B committed capital at $852B post-money for compute, data centers and talent ahead of a planned IPO',
        company: findCompany('openai'),
      },
      {
        id: 'p-raise2-136-2',
        deal_id: '20000000-0000-0000-0000-000000000136',
        company_id: '00000000-0000-0000-0000-000000000030',
        role: 'investor',
        direction_note: 'Co-lead investor committing $30B alongside Amazon ($50B) and NVIDIA ($30B)',
        company: findCompany('softbank'),
      },
    ],
    sources: [
      {
        deal_id: '20000000-0000-0000-0000-000000000136',
        source_id: '10000000-0000-0000-0000-000000000192',
        supporting_note: 'Official OpenAI release: closed with $122B committed capital at $852B post-money; anchors and co-leads named.',
        is_primary_support: true,
        source: SRC_OPENAI_RELEASE,
      },
      {
        deal_id: '20000000-0000-0000-0000-000000000136',
        source_id: '10000000-0000-0000-0000-000000000193',
        supporting_note: 'CNBC confirmation of the closed $122B round, growth from the $110B February announcement, and investor pool details.',
        is_primary_support: false,
        source: SRC_OPENAI_CNBC,
      },
    ],
  },
  {
    id: '20000000-0000-0000-0000-000000000137',
    slug: 'mistral-3b-eur-series-d-2026',
    title: 'Mistral AI €3 Billion Series D Funding Round at €21B+ Valuation',
    summary:
      'Mistral AI raised €3 billion in a Series D at a post-money valuation above €21 billion — per the company, the largest equity fundraising round ever completed by a European technology company. Samsung Electronics led, joined by co-leads Scaleup Europe Fund (managed by EQT) and existing investor PSG Equity; Advent, BlackRock-managed funds and the Grand Duchy of Luxembourg joined as new investors, and existing holders including ASML, Andreessen Horowitz, NVIDIA, Lightspeed, General Catalyst, DST Global, Index Ventures, Salesforce Ventures and Bpifrance participated. The round funds deeper frontier research, expanded infrastructure and accelerated international growth, nearly doubling the €11.7B valuation set by the ASML-led Series C a year earlier.',
    deal_type: 'equity_investment',
    status: 'closed',
    announcement_date: '2026-09-08',
    effective_date: '2026-09-08',
    maturity_date: null,
    amount_value: 3000000000,
    amount_currency: 'EUR',
    amount_basis: 'cash_investment',
    amount_period: 'Series D primary equity round',
    amount_disclosed: true,
    geography: 'France',
    evidence_level: 'confirmed_primary',
    confidence_note:
      'Confirmed by official Mistral announcement corroborated by CNBC, TechCrunch, WSJ, Crunchbase and FinSMEs the same day; valuation stated as "more than €21 billion" post-money. Samsung, EQT and PSG are not ledger companies, so NVIDIA (existing investor named in the release and coverage) is recorded as the investor party.',
    is_published: true,
    published_at: '2026-09-08T12:00:00Z',
    last_reviewed_at: '2026-10-17T00:00:00Z',
    parties: [
      {
        id: 'p-raise2-137-1',
        deal_id: '20000000-0000-0000-0000-000000000137',
        company_id: '00000000-0000-0000-0000-000000000019',
        role: 'investee',
        direction_note: 'Raised €3B Series D at €21B+ post-money for frontier research, infrastructure and international growth',
        company: findCompany('mistral-ai'),
      },
      {
        id: 'p-raise2-137-2',
        deal_id: '20000000-0000-0000-0000-000000000137',
        company_id: '00000000-0000-0000-0000-000000000001',
        role: 'investor',
        direction_note: 'Participating existing investor alongside lead Samsung Electronics and co-leads EQT/PSG',
        company: findCompany('nvidia'),
      },
    ],
    sources: [
      {
        deal_id: '20000000-0000-0000-0000-000000000137',
        source_id: '10000000-0000-0000-0000-000000000194',
        supporting_note: 'Official Mistral announcement of the €3B Series D, €21B+ post-money valuation, and investor list.',
        is_primary_support: true,
        source: SRC_MISTRAL_RELEASE,
      },
    ],
  },
  {
    id: '20000000-0000-0000-0000-000000000138',
    slug: 'anduril-5-billion-series-h-2026',
    title: 'Anduril $5 Billion Series H Funding Round at $61 Billion Valuation',
    summary:
      'Anduril Industries raised $5 billion in a Series H led by Thrive Capital and Andreessen Horowitz, doubling its valuation to $61 billion from the $30.5 billion set by its June 2025 Founders Fund-led Series G ($2.5B with a $1B Founders Fund check). Co-founder CEO Brian Schimpf said revenue more than doubled to $2.2 billion in 2025; proceeds fund manufacturing capacity, R&D, and the infrastructure required to build and field advanced defense systems at scale.',
    deal_type: 'equity_investment',
    status: 'closed',
    announcement_date: '2026-05-13',
    effective_date: '2026-05-13',
    maturity_date: null,
    amount_value: 5000000000,
    amount_currency: 'USD',
    amount_basis: 'cash_investment',
    amount_period: 'Series H primary equity round',
    amount_disclosed: true,
    geography: 'United States',
    evidence_level: 'confirmed_primary',
    confidence_note:
      'Official Anduril announcement corroborated by Reuters, Bloomberg, CNBC, TechCrunch and NYT on May 13, 2026; $5B amount, $61B valuation, Thrive/a16z co-leads, and the $2.2B 2025 revenue figure are all confirmed. Thrive is not a ledger company, so co-lead Andreessen Horowitz is recorded as the investor party.',
    is_published: true,
    published_at: '2026-05-13T12:00:00Z',
    last_reviewed_at: '2026-10-17T00:00:00Z',
    parties: [
      {
        id: 'p-raise2-138-1',
        deal_id: '20000000-0000-0000-0000-000000000138',
        company_id: '00000000-0000-0000-0000-000000000099',
        role: 'investee',
        direction_note: 'Raised $5B Series H at $61B valuation for manufacturing, R&D and defense systems at scale',
        company: ANDURIL,
      },
      {
        id: 'p-raise2-138-2',
        deal_id: '20000000-0000-0000-0000-000000000138',
        company_id: '00000000-0000-0000-0000-000000000063',
        role: 'investor',
        direction_note: 'Co-lead investor alongside Thrive Capital',
        company: findCompany('a16z'),
      },
    ],
    sources: [
      {
        deal_id: '20000000-0000-0000-0000-000000000138',
        source_id: '10000000-0000-0000-0000-000000000195',
        supporting_note: 'Official Anduril announcement of the $5B Series H at $61B led by Thrive Capital and Andreessen Horowitz.',
        is_primary_support: true,
        source: SRC_ANDURIL_RELEASE,
      },
    ],
  },
  {
    id: '20000000-0000-0000-0000-000000000139',
    slug: 'anthropic-65-billion-series-h-2026',
    title: 'Anthropic $65 Billion Series H Funding Round at $965 Billion Post-Money Valuation',
    summary:
      'Anthropic raised $65 billion in a Series H at a $965 billion post-money valuation — surpassing OpenAI\'s $852B as the most valuable AI startup — led by Altimeter Capital, Dragoneer, Greenoaks and Sequoia Capital, and co-led by Capital Group, Coatue, D1 Capital Partners, GIC, ICONIQ and XN. The round includes $15 billion of previously committed hyperscaler investments ($5 billion from Amazon) and adds strategic infrastructure partners Micron, Samsung and SK hynix; MGX, Blackstone, Brookfield, D.E. Shaw Ventures, DST Global, Fidelity, General Catalyst, Jane Street, Lightspeed, T. Rowe Price and Temasek also participated. Anthropic\'s run-rate revenue crossed $47 billion in May 2026; funding advances safety and interpretability research, compute expansion (new agreements with Amazon for up to 5 GW, Google/Broadcom for 5 GW of TPU capacity, and SpaceX for Colossus GPU access), and product scaling.',
    deal_type: 'equity_investment',
    status: 'closed',
    announcement_date: '2026-05-28',
    effective_date: '2026-05-28',
    maturity_date: null,
    amount_value: 65000000000,
    amount_currency: 'USD',
    amount_basis: 'cash_investment',
    amount_period: 'Series H primary equity round including $15B of previously committed hyperscaler investments',
    amount_disclosed: true,
    geography: 'United States',
    evidence_level: 'confirmed_primary',
    confidence_note:
      'Confirmed by official Anthropic release of May 28, 2026, corroborated by Reuters, Bloomberg, CNBC, AP, WSJ and GIC\'s own newsroom the same day; $65B amount, $965B post-money valuation, and lead/co-lead roster are company-stated. Amazon\'s $5B was previously committed in April 2026 and is included within the round\'s $15B of previously committed hyperscaler investments.',
    is_published: true,
    published_at: '2026-05-28T12:00:00Z',
    last_reviewed_at: '2026-10-17T00:00:00Z',
    parties: [
      {
        id: 'p-raise2-139-1',
        deal_id: '20000000-0000-0000-0000-000000000139',
        company_id: '00000000-0000-0000-0000-000000000006',
        role: 'investee',
        direction_note: 'Raised $65B Series H at $965B post-money, surpassing OpenAI as the most valuable AI startup',
        company: findCompany('anthropic'),
      },
      {
        id: 'p-raise2-139-2',
        deal_id: '20000000-0000-0000-0000-000000000139',
        company_id: '00000000-0000-0000-0000-000000000005',
        role: 'investor',
        direction_note: '$5B of its April 2026 commitment included in the round\'s $15B of previously committed hyperscaler investments',
        company: findCompany('amazon'),
      },
    ],
    sources: [
      {
        deal_id: '20000000-0000-0000-0000-000000000139',
        source_id: '10000000-0000-0000-0000-000000000196',
        supporting_note: 'Official Anthropic Series H announcement with leads, co-leads, and the Amazon inclusion.',
        is_primary_support: true,
        source: SRC_ANTHROPIC_H_RELEASE,
      },
    ],
  },
];

export const EXTRA_RELATIONSHIPS: Relationship[] = [
  {
    id: '30000000-0000-0000-0000-000000000095',
    from_company_id: '00000000-0000-0000-0000-000000000029',
    to_company_id: '00000000-0000-0000-0000-000000000018',
    relationship_type: 'equity_shareholder',
    start_date: '2026-01-06',
    end_date: null,
    description: 'MGX participating investor in xAI $20B Series E alongside Valor Equity Partners, StepStone, Fidelity, QIA and Baron.',
    evidence_level: 'confirmed_primary',
    is_published: true,
    from_company: findCompany('mgx'),
    to_company: findCompany('xai'),
    sources: [
      {
        relationship_id: '30000000-0000-0000-0000-000000000095',
        source_id: '10000000-0000-0000-0000-000000000189',
        supporting_note: 'Official xAI Series E announcement names MGX among the investors.',
        source: SRC_XAI_RELEASE,
      },
    ],
  },
  {
    id: '30000000-0000-0000-0000-000000000096',
    from_company_id: '00000000-0000-0000-0000-000000000029',
    to_company_id: '00000000-0000-0000-0000-000000000006',
    relationship_type: 'equity_shareholder',
    start_date: '2026-02-12',
    end_date: null,
    description: 'MGX co-lead equity investor in Anthropic $30B Series G at a $380B post-money valuation.',
    evidence_level: 'confirmed_primary',
    is_published: true,
    from_company: findCompany('mgx'),
    to_company: findCompany('anthropic'),
    sources: [
      {
        relationship_id: '30000000-0000-0000-0000-000000000096',
        source_id: '10000000-0000-0000-0000-000000000191',
        supporting_note: 'Official Anthropic announcement lists MGX among the Series G co-leads.',
        source: SRC_ANTHROPIC_G_RELEASE,
      },
    ],
  },
  {
    id: '30000000-0000-0000-0000-000000000097',
    from_company_id: '00000000-0000-0000-0000-000000000029',
    to_company_id: '00000000-0000-0000-0000-000000000004',
    relationship_type: 'equity_shareholder',
    start_date: '2026-03-31',
    end_date: null,
    description: 'MGX co-led OpenAI\'s record $122B funding round closed March 31, 2026 at an $852B post-money valuation.',
    evidence_level: 'confirmed_primary',
    is_published: true,
    from_company: findCompany('mgx'),
    to_company: findCompany('openai'),
    sources: [
      {
        relationship_id: '30000000-0000-0000-0000-000000000097',
        source_id: '10000000-0000-0000-0000-000000000192',
        supporting_note: 'Official OpenAI release names MGX among the round co-leads.',
        source: SRC_OPENAI_RELEASE,
      },
    ],
  },
  {
    id: '30000000-0000-0000-0000-000000000098',
    from_company_id: '00000000-0000-0000-0000-000000000063',
    to_company_id: '00000000-0000-0000-0000-000000000099',
    relationship_type: 'equity_shareholder',
    start_date: '2026-05-13',
    end_date: null,
    description: 'Andreessen Horowitz co-led Anduril $5B Series H at a $61B valuation alongside Thrive Capital.',
    evidence_level: 'confirmed_primary',
    is_published: true,
    from_company: findCompany('a16z'),
    to_company: ANDURIL,
    sources: [
      {
        relationship_id: '30000000-0000-0000-0000-000000000098',
        source_id: '10000000-0000-0000-0000-000000000195',
        supporting_note: 'Official Anduril announcement naming Andreessen Horowitz as Series H co-lead.',
        source: SRC_ANDURIL_RELEASE,
      },
    ],
  },
  {
    id: '30000000-0000-0000-0000-000000000099',
    from_company_id: '00000000-0000-0000-0000-000000000001',
    to_company_id: '00000000-0000-0000-0000-000000000004',
    relationship_type: 'equity_shareholder',
    start_date: '2026-03-31',
    end_date: null,
    description: 'NVIDIA invested $30 billion in OpenAI\'s $122B round at an $852B post-money valuation, alongside the expanded compute collaboration (3 GW dedicated inference and 2 GW Vera Rubin training).',
    evidence_level: 'confirmed_primary',
    is_published: true,
    from_company: findCompany('nvidia'),
    to_company: findCompany('openai'),
    sources: [
      {
        relationship_id: '30000000-0000-0000-0000-000000000099',
        source_id: '10000000-0000-0000-0000-000000000192',
        supporting_note: 'Official OpenAI release names NVIDIA ($30B) among the strategic anchors of the closed round.',
        source: SRC_OPENAI_RELEASE,
      },
    ],
  },
  {
    id: '30000000-0000-0000-0000-000000000100',
    from_company_id: '00000000-0000-0000-0000-000000000005',
    to_company_id: '00000000-0000-0000-0000-000000000004',
    relationship_type: 'equity_shareholder',
    start_date: '2026-03-31',
    end_date: null,
    description: 'Amazon committed $50 billion in OpenAI\'s $122B round ($15B initial, $35B contingent on an IPO or AGI), alongside a strategic partnership making AWS the exclusive third-party cloud distributor for OpenAI Frontier and expanding the $38B AWS deal by $100B.',
    evidence_level: 'confirmed_primary',
    is_published: true,
    from_company: findCompany('amazon'),
    to_company: findCompany('openai'),
    sources: [
      {
        relationship_id: '30000000-0000-0000-0000-000000000100',
        source_id: '10000000-0000-0000-0000-000000000192',
        supporting_note: 'Official OpenAI release names Amazon ($50B) among the strategic anchors of the closed round.',
        source: SRC_OPENAI_RELEASE,
      },
    ],
  },
];
