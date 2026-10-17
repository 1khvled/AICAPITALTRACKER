import type { Company, Deal, Relationship, Source } from '../types';
import { findCompany } from './dataset';

// LANE C — GPU-CLOUD BACKSTOPS & APP-LAYER RAISES: 5 verified capital events.
// (1) Google backstops Fluidstack's lease obligations at TeraWulf's Lake Mariner
// (CB-3/CB-4, $1.8B initial; CB-5 expansion Aug 18, 2025 lifts total to ~$3.2B and
// warrants to ~14% pro forma) for TeraWulf warrants; (2) same structure at Cipher
// Mining's Barber Lake ($1.4B, ~5.4% warrants; expanded +$333M to $1.73B on Nov 20,
// 2025); (3) Anysphere/Cursor $900M Series C at $9.9B valuation (June 2025);
// (4)+(5) Bloomberg-reported xAI ~$20B SPV package for Colossus 2 split into ~$7.5B
// equity (NVIDIA up to $2B, Valor-led) and up to $12.5B GPU-collateralized SPV debt
// (Apollo, Diameter participating). Only deal IDs ...116-120, source IDs ...158-165,
// relationship IDs ...079-082, and new company IDs ...073/...082/...083/...084 are used.

const ANYSPHERE: Company = {
  id: '00000000-0000-0000-0000-000000000073',
  name: 'Anysphere, Inc.',
  slug: 'anysphere',
  aliases: ['Cursor', 'Anysphere'],
  description:
    'Maker of the AI coding assistant Cursor; raised a $900M Series C at a $9.9B valuation in June 2025 with annualized revenue past $500M and more than half of the Fortune 500 as users.',
  company_type: 'ai_lab',
  headquarters_country: 'United States',
  headquarters_city: 'San Francisco, CA',
  website_url: 'https://cursor.com',
  ticker: null,
  cik: null,
  is_public: false,
};

const FLUIDSTACK: Company = {
  id: '00000000-0000-0000-0000-000000000082',
  name: 'Fluidstack',
  slug: 'fluidstack',
  aliases: ['Fluidstack USA I Inc.', 'Fluidstack USA II Inc.'],
  description:
    'AI cloud platform that builds and operates HPC/GPU clusters for some of the largest AI labs, financing datacenter capacity through long-term leases at partner sites (TeraWulf Lake Mariner, Cipher Barber Lake) with credit backstops from Google.',
  company_type: 'other',
  headquarters_country: 'United States',
  headquarters_city: 'New York, NY',
  website_url: 'https://www.fluidstack.io',
  ticker: null,
  cik: null,
  is_public: false,
};

const TERAWULF: Company = {
  id: '00000000-0000-0000-0000-000000000083',
  name: 'TeraWulf Inc.',
  slug: 'terawulf',
  aliases: ['WULF', 'TeraWulf'],
  description:
    'Owner and operator of vertically integrated, predominantly zero-carbon digital infrastructure pivoting from bitcoin mining to hyperscale AI/HPC hosting at its Lake Mariner campus; Fluidstack leases carry Google lease-obligation backstops paid for with TeraWulf warrants.',
  company_type: 'utility_power',
  headquarters_country: 'United States',
  headquarters_city: 'Easton, MD',
  website_url: 'https://www.terawulf.com',
  ticker: 'WULF',
  cik: '0001083301',
  is_public: true,
};

const CIPHER_MINING: Company = {
  id: '00000000-0000-0000-0000-000000000084',
  name: 'Cipher Mining Inc.',
  slug: 'cipher-mining',
  aliases: ['CIFR', 'Cipher'],
  description:
    'Owner, developer and operator of industrial-scale data centers that pivoted from bitcoin mining to AI/HPC hosting, leasing the full 300 MW Barber Lake site to Fluidstack with a Google backstop and holding a ~2.4 GW pipeline.',
  company_type: 'utility_power',
  headquarters_country: 'United States',
  headquarters_city: 'New York, NY',
  website_url: 'https://ciphermining.com',
  ticker: 'CIFR',
  cik: '0001819989',
  is_public: true,
};

export const EXTRA_COMPANIES: Company[] = [ANYSPHERE, FLUIDSTACK, TERAWULF, CIPHER_MINING];

const SRC_TERAWULF_8K_AUG14: Source = {
  id: '10000000-0000-0000-0000-000000000158',
  url: 'https://www.sec.gov/Archives/edgar/data/1083301/000110465925078084/tm2523008d2_8k.htm',
  title: 'TeraWulf Inc. Current Report on Form 8-K (Fluidstack leases, Google backstop and warrants)',
  publisher: 'U.S. SEC EDGAR',
  source_type: 'primary_filing',
  published_date: '2025-08-14',
  accessed_at: '2026-10-17T00:00:00Z',
  notes:
    '8-K Item 1.01: Aug 13, 2025 Recognition Agreements (Akela Data LLC, Fluidstack USA I, Google LLC) for Google BackStop of Fluidstack lease obligations; Warrant Agreements issuing Google warrants for 41,011,803 shares at $0.01 exercise, pledged to project lenders until the backstop becomes effective.',
};

const SRC_TERAWULF_PR_AUG14: Source = {
  id: '10000000-0000-0000-0000-000000000159',
  url: 'https://investors.terawulf.com/news-events/press-releases/detail/112/terawulf-signs-200-mw-10-year-ai-hosting-agreements-with-fluidstack',
  title: 'TeraWulf Signs 200+ MW, 10-Year AI Hosting Agreements with Fluidstack',
  publisher: 'TeraWulf Investor Relations (GlobeNewswire)',
  source_type: 'company_release',
  published_date: '2025-08-14',
  accessed_at: '2026-10-17T00:00:00Z',
  notes:
    'Company release: two 10-year HPC colocation leases for 200+ MW critical IT load (~250 MW gross) at Lake Mariner; ~$3.7B contracted revenue over initial term (~$8.7B with extensions); Google backstops $1.8B of Fluidstack lease obligations for ~8% equity via ~41M warrants.',
};

const SRC_TERAWULF_CB5_8K_AUG18: Source = {
  id: '10000000-0000-0000-0000-000000000160',
  url: 'https://www.sec.gov/Archives/edgar/data/1083301/000110465925079463/tm2523651d3_ex99-1.htm',
  title: 'TeraWulf 8-K Exhibit 99.1: Fluidstack Expansion with 160 MW CB-5 Lease at Lake Mariner',
  publisher: 'U.S. SEC EDGAR',
  source_type: 'primary_filing',
  published_date: '2025-08-18',
  accessed_at: '2026-10-17T00:00:00Z',
  notes:
    'CB-5 lease (Aug 17 agreements; 32,568,197 incremental warrants): incremental $1.4B backstop takes Google total to ~$3.2B and pro forma equity ownership to ~14%; total Fluidstack contracted capacity ~360 MW and ~$6.7B contracted revenue (~$16B with extensions).',
};

const SRC_CIPHER_8K_SEP25: Source = {
  id: '10000000-0000-0000-0000-000000000161',
  url: 'https://www.sec.gov/Archives/edgar/data/1819989/000095010325012168/dp234624_ex9901.htm',
  title: 'Cipher Mining 8-K Exhibit 99.1: 168 MW, 10-Year AI Hosting Agreement with Fluidstack',
  publisher: 'U.S. SEC EDGAR',
  source_type: 'primary_filing',
  published_date: '2025-09-25',
  accessed_at: '2026-10-17T00:00:00Z',
  notes:
    'Cipher press release filed as 8-K exhibit: 10-year lease for 168 MW critical IT load at Barber Lake (Colorado City, TX); ~$3.0B contracted revenue (~$7B with extensions); Google backstops $1.4B of Fluidstack lease obligations for warrants on ~24M shares (~5.4% pro forma); Morgan Stanley sole financial advisor.',
};

const SRC_CIPHER_8K_NOV20: Source = {
  id: '10000000-0000-0000-0000-000000000162',
  url: 'https://www.sec.gov/Archives/edgar/data/1819989/000095010325015073/dp237633_ex9901.htm',
  title: 'Cipher Mining 8-K Exhibit 99.1: Additional 56 MW, 10-Year AI Hosting Agreement with Fluidstack',
  publisher: 'U.S. SEC EDGAR',
  source_type: 'primary_filing',
  published_date: '2025-11-20',
  accessed_at: '2026-10-17T00:00:00Z',
  notes:
    'Expansion 8-K exhibit: additional 39 MW critical IT load (56 MW gross) takes Fluidstack to the full 300 MW Barber Lake site; ~$830M added contracted revenue (~$3.8B partnership total initial term); Google backstop expanded by $333M to $1.73B total via Amended & Restated Recognition Agreement.',
};

const SRC_CURSOR_BLOG: Source = {
  id: '10000000-0000-0000-0000-000000000163',
  url: 'https://www.cursor.com/blog/series-c',
  title: 'Cursor — Series C and Scale',
  publisher: 'Anysphere (Cursor blog)',
  source_type: 'company_release',
  published_date: '2025-06-06',
  accessed_at: '2026-10-17T00:00:00Z',
  notes:
    'Company announcement: $900 million at a $9.9 billion valuation from Thrive, Accel, Andreessen Horowitz, and DST; Cursor past $500M ARR and used by over half the Fortune 500 including NVIDIA, Uber, and Adobe.',
};

const SRC_CURSOR_TECHCRUNCH: Source = {
  id: '10000000-0000-0000-0000-000000000164',
  url: 'https://techcrunch.com/2025/06/05/cursors-anysphere-nabs-9-9b-valuation-soars-past-500m-arr/',
  title: "Cursor's Anysphere nabs $9.9B valuation, soars past $500M ARR",
  publisher: 'TechCrunch',
  source_type: 'reputable_media',
  published_date: '2025-06-05',
  accessed_at: '2026-10-17T00:00:00Z',
  notes:
    'TechCrunch (citing Bloomberg): $900M raised at $9.9B valuation, led by returning investor Thrive Capital with participation from Andreessen Horowitz, Accel, and DST Global.',
};

const SRC_XAI_REUTERS: Source = {
  id: '10000000-0000-0000-0000-000000000165',
  url: 'https://www.reuters.com/business/musks-xai-nears-20-billion-capital-raise-tied-nvidia-chips-bloomberg-news-2025-10-07/',
  title: "Musk's xAI nears $20 billion capital raise tied to Nvidia chips, Bloomberg News reports",
  publisher: 'Reuters',
  source_type: 'reputable_media',
  published_date: '2025-10-07',
  accessed_at: '2026-10-17T00:00:00Z',
  notes:
    'Reuters relay of Bloomberg (Oct 7-8, 2025): financing lifted to ~$20B via an SPV that buys NVIDIA processors and rents them to xAI for Colossus 2 in Memphis; split of ~$7.5B equity and up to $12.5B SPV debt; NVIDIA investing as much as $2B in the equity portion; Valor leading equity; Apollo and Diameter participating in the debt.',
};

export const EXTRA_SOURCES: Source[] = [
  SRC_TERAWULF_8K_AUG14,
  SRC_TERAWULF_PR_AUG14,
  SRC_TERAWULF_CB5_8K_AUG18,
  SRC_CIPHER_8K_SEP25,
  SRC_CIPHER_8K_NOV20,
  SRC_CURSOR_BLOG,
  SRC_CURSOR_TECHCRUNCH,
  SRC_XAI_REUTERS,
];

export const EXTRA_DEALS: Deal[] = [
  {
    id: '20000000-0000-0000-0000-000000000116',
    slug: 'google-terawulf-fluidstack-backstop-warrants-2025',
    title: 'Google $1.8B Backstop of Fluidstack Leases at TeraWulf Lake Mariner for ~8% Warrants (Upsized to ~$3.2B / ~14%)',
    summary:
      'TeraWulf signed two 10-year HPC colocation leases (CB-3/CB-4) with AI cloud platform Fluidstack at its Lake Mariner campus in Western New York, delivering 200+ MW of critical IT load (~250 MW gross) for ~$3.7B of contracted revenue over the initial term (~$8.7B with two five-year extensions). To support the buildout and its project-related debt financing, Google LLC backstops $1.8B of Fluidstack\u2019s lease obligations under Recognition Agreements among Akela Data LLC, Fluidstack USA I and Google, receiving warrants for 41,011,803 TeraWulf shares at $0.01 exercise (~8% pro forma equity), pledged to project lenders until the backstop becomes effective at lease commencement. On August 18, 2025 Fluidstack exercised its CB-5 option for an incremental 160 MW (~$3.0B more contracted revenue); with an added $1.4B backstop and 32,568,197 incremental warrants, Google\u2019s cumulative backstop rose to ~$3.2B and its pro forma warrant position to ~14% of TeraWulf equity.',
    deal_type: 'equity_investment',
    status: 'signed',
    announcement_date: '2025-08-14',
    effective_date: '2025-08-13',
    maturity_date: null,
    amount_value: 1800000000,
    amount_currency: 'USD',
    amount_basis: 'commitment',
    amount_period: 'Initial CB-3/CB-4 backstop of Fluidstack lease obligations; warrants for 41,011,803 shares at $0.01 (~8% pro forma)',
    amount_disclosed: true,
    geography: 'United States (New York)',
    evidence_level: 'confirmed_primary',
    confidence_note:
      'TeraWulf 8-K (Aug 14, 2025) records the Recognition Agreements, Warrant Agreements and exact 41,011,803-share warrant count; company release confirms the $1.8B backstop and ~8% stake. The recorded amount is the initial CB-3/CB-4 commitment; the Aug 18, 2025 CB-5 8-K exhibit confirms the cumulative backstop of ~$3.2B and ~14% pro forma warrants (73,580,000 total warrant shares). The backstop is a lease-obligation guarantee, not cash paid into TeraWulf; the equity leg is the warrant consideration from TeraWulf to Google.',
    is_published: true,
    published_at: '2025-08-14T12:00:00Z',
    last_reviewed_at: '2026-10-17T00:00:00Z',
    parties: [
      {
        id: 'p-bk-116-1',
        deal_id: '20000000-0000-0000-0000-000000000116',
        company_id: '00000000-0000-0000-0000-000000000016',
        role: 'investor',
        direction_note:
          'Google LLC backstops $1.8B of Fluidstack\u2019s lease obligations (later ~$3.2B cumulative with CB-5) supporting project-related debt financing, and receives TeraWulf warrants as consideration',
        company: findCompany('alphabet'),
      },
      {
        id: 'p-bk-116-2',
        deal_id: '20000000-0000-0000-0000-000000000116',
        company_id: '00000000-0000-0000-0000-000000000083',
        role: 'investee',
        direction_note:
          'Site host issuing Google warrants (41,011,803 initially; 73,580,000 total across CB-3/4/5, ~14% pro forma) in consideration for the backstop of Fluidstack\u2019s 10-year leases at Lake Mariner',
        company: TERAWULF,
      },
    ],
    sources: [
      {
        deal_id: '20000000-0000-0000-0000-000000000116',
        source_id: '10000000-0000-0000-0000-000000000158',
        supporting_note:
          '8-K Item 1.01 recording the Google Recognition Agreements (backstop) and Warrant Agreements (41,011,803 shares at $0.01) dated August 13, 2025.',
        is_primary_support: true,
        source: SRC_TERAWULF_8K_AUG14,
      },
      {
        deal_id: '20000000-0000-0000-0000-000000000116',
        source_id: '10000000-0000-0000-0000-000000000159',
        supporting_note:
          'Company release confirming $1.8B backstop, ~8% pro forma equity, 200+ MW of Fluidstack leases and ~$3.7B contracted revenue.',
        is_primary_support: false,
        source: SRC_TERAWULF_PR_AUG14,
      },
      {
        deal_id: '20000000-0000-0000-0000-000000000116',
        source_id: '10000000-0000-0000-0000-000000000160',
        supporting_note:
          'CB-5 expansion exhibit confirming the cumulative ~$3.2B backstop, ~14% pro forma stake and 360 MW total contracted capacity.',
        is_primary_support: false,
        source: SRC_TERAWULF_CB5_8K_AUG18,
      },
    ],
  },
  {
    id: '20000000-0000-0000-0000-000000000117',
    slug: 'google-cipher-fluidstack-backstop-warrants-2025',
    title: 'Google $1.4B Backstop of Fluidstack Leases at Cipher Barber Lake for ~5.4% Warrants (Later $1.73B)',
    summary:
      'Cipher Mining signed a 10-year HPC colocation lease with Fluidstack USA II at its Barber Lake site in Colorado City, Texas, delivering 168 MW of critical IT load (up to 244 MW gross) for ~$3.0B of contracted revenue over the initial term (~$7B if two five-year extensions are exercised). Google LLC agreed to backstop $1.4B of Fluidstack\u2019s lease obligations to support project-related debt financing under a Recognition Agreement among Cipher Barber Lake LLC, Fluidstack and Google, receiving warrants for 24,178,576 Cipher shares at $0.01 exercise (~5.4% pro forma equity, expiring September 24, 2030); Cipher booked the warrants at a $544.5M fair value in its 10-Q. On November 20, 2025 the partnership was expanded — Fluidstack to lease the full 300 MW of Barber Lake with ~$830M of added contracted revenue (~$3.8B partnership total over the initial term) — and Google\u2019s backstop rose by $333M to $1.73B via Amended and Restated Recognition and Warrant Agreements.',
    deal_type: 'equity_investment',
    status: 'signed',
    announcement_date: '2025-09-25',
    effective_date: '2025-09-24',
    maturity_date: null,
    amount_value: 1400000000,
    amount_currency: 'USD',
    amount_basis: 'commitment',
    amount_period: 'Initial backstop of Fluidstack lease obligations; warrants for 24,178,576 shares at $0.01 (~5.4% pro forma)',
    amount_disclosed: true,
    geography: 'United States (Texas)',
    evidence_level: 'confirmed_primary',
    confidence_note:
      'Cipher 8-K (Sept 25, 2025) records the Fluidstack Lease, Google Recognition Agreement, warrant issuance and remedy options; the Q3 2025 10-Q corroborates 24,178,576 warrants, $0.01 exercise, September 24, 2030 expiry and the $544.5M fair value of the backstop consideration. The Nov 20, 2025 8-K confirms the expansion by $333M to a $1.73B total backstop. The backstop is a lease-obligation guarantee, not cash paid into Cipher; the equity leg is the warrant consideration.',
    is_published: true,
    published_at: '2025-09-25T12:00:00Z',
    last_reviewed_at: '2026-10-17T00:00:00Z',
    parties: [
      {
        id: 'p-bk-117-1',
        deal_id: '20000000-0000-0000-0000-000000000117',
        company_id: '00000000-0000-0000-0000-000000000016',
        role: 'investor',
        direction_note:
          'Google LLC backstops $1.4B of Fluidstack\u2019s lease obligations (expanded by $333M to $1.73B on Nov 20, 2025) and receives Cipher warrants as consideration',
        company: findCompany('alphabet'),
      },
      {
        id: 'p-bk-117-2',
        deal_id: '20000000-0000-0000-0000-000000000117',
        company_id: '00000000-0000-0000-0000-000000000084',
        role: 'investee',
        direction_note:
          'Site host issuing Google warrants for 24,178,576 shares (~5.4% pro forma) and leasing 168 MW (later the full 300 MW) at Barber Lake to Fluidstack',
        company: CIPHER_MINING,
      },
    ],
    sources: [
      {
        deal_id: '20000000-0000-0000-0000-000000000117',
        source_id: '10000000-0000-0000-0000-000000000161',
        supporting_note:
          'SEC-filed press release: $1.4B Google backstop, ~5.4% pro forma warrants, 168 MW lease, ~$3.0B contracted revenue.',
        is_primary_support: true,
        source: SRC_CIPHER_8K_SEP25,
      },
      {
        deal_id: '20000000-0000-0000-0000-000000000117',
        source_id: '10000000-0000-0000-0000-000000000162',
        supporting_note:
          'SEC-filed expansion release: +$333M backstop to $1.73B total, full 300 MW leased, ~$3.8B partnership contracted revenue.',
        is_primary_support: false,
        source: SRC_CIPHER_8K_NOV20,
      },
    ],
  },
  {
    id: '20000000-0000-0000-0000-000000000118',
    slug: 'anysphere-cursor-900m-series-c-2025',
    title: 'Anysphere (Cursor) $900M Series C at $9.9B Valuation',
    summary:
      'Anysphere, the maker of AI coding assistant Cursor, raised a $900 million Series C at a $9.9 billion valuation, first reported by Bloomberg on June 5, 2025 and confirmed by the company on June 6. Thrive Capital led the round, with Andreessen Horowitz, Accel and DST Global participating. Anysphere said Cursor had surpassed $500 million in annualized revenue and was used by over half the Fortune 500, including NVIDIA, Uber and Adobe, on tiered $20 Pro / $40 business subscriptions plus newly launched enterprise licenses.',
    deal_type: 'equity_investment',
    status: 'closed',
    announcement_date: '2025-06-05',
    effective_date: '2025-06-05',
    maturity_date: null,
    amount_value: 900000000,
    amount_currency: 'USD',
    amount_basis: 'cash_investment',
    amount_period: 'Series C primary equity at $9.9B valuation',
    amount_disclosed: true,
    geography: 'United States',
    evidence_level: 'confirmed_primary',
    confidence_note:
      'Company blog post (June 6, 2025) confirms the $900M amount, $9.9B valuation and the investor list including Andreessen Horowitz; TechCrunch (June 5, 2025, citing Bloomberg) confirms Thrive Capital as lead. a16z is recorded as the ledger party; lead investor Thrive Capital and co-investors Accel and DST Global are not in the ledger and are named in the summary.',
    is_published: true,
    published_at: '2025-06-06T12:00:00Z',
    last_reviewed_at: '2026-10-17T00:00:00Z',
    parties: [
      {
        id: 'p-bk-118-1',
        deal_id: '20000000-0000-0000-0000-000000000118',
        company_id: '00000000-0000-0000-0000-000000000073',
        role: 'investee',
        direction_note:
          'Issuer of $900M Series C primary equity at a $9.9B valuation to scale Cursor AI coding research and enterprise licensing',
        company: ANYSPHERE,
      },
      {
        id: 'p-bk-118-2',
        deal_id: '20000000-0000-0000-0000-000000000118',
        company_id: '00000000-0000-0000-0000-000000000063',
        role: 'investor',
        direction_note:
          'Participating investor in the $900M Series C alongside lead Thrive Capital, Accel and DST Global',
        company: findCompany('a16z'),
      },
    ],
    sources: [
      {
        deal_id: '20000000-0000-0000-0000-000000000118',
        source_id: '10000000-0000-0000-0000-000000000163',
        supporting_note:
          'Company blog post confirming $900M at $9.9B valuation from Thrive, Accel, Andreessen Horowitz and DST, with $500M+ ARR.',
        is_primary_support: true,
        source: SRC_CURSOR_BLOG,
      },
      {
        deal_id: '20000000-0000-0000-0000-000000000118',
        source_id: '10000000-0000-0000-0000-000000000164',
        supporting_note:
          'TechCrunch report (citing Bloomberg) confirming the raise closed and Thrive Capital as lead with a16z, Accel and DST Global participating.',
        is_primary_support: false,
        source: SRC_CURSOR_TECHCRUNCH,
      },
    ],
  },
  {
    id: '20000000-0000-0000-0000-000000000119',
    slug: 'xai-colossus2-spv-equity-7-5b-2025',
    title: 'xAI ~$7.5B SPV Equity Portion of ~$20B Colossus 2 GPU Financing (NVIDIA up to $2B, Valor-led)',
    summary:
      'Bloomberg reported on October 7-8, 2025 (relayed by Reuters) that Elon Musk\u2019s xAI had expanded its ongoing financing to ~$20 billion for its Colossus 2 data center in Memphis through a special purpose vehicle that purchases NVIDIA processors and leases them back to xAI for five years. The package splits into roughly $7.5 billion of equity and as much as $12.5 billion of SPV debt; NVIDIA is investing as much as $2 billion in the equity portion, and Valor Equity Partners is leading the equity leg. The raise was reported as ongoing and was not confirmed by the company at the time; it is distinct from the company-confirmed upsized $20B Series E announced January 6, 2026.',
    deal_type: 'equity_investment',
    status: 'announced',
    announcement_date: '2025-10-07',
    effective_date: null,
    maturity_date: null,
    amount_value: 7500000000,
    amount_currency: 'USD',
    amount_basis: 'commitment',
    amount_period: 'Equity portion (~$7.5B) of the ~$20B SPV package; NVIDIA committing as much as $2B',
    amount_disclosed: true,
    geography: 'United States (Tennessee)',
    evidence_level: 'reported_secondary',
    confidence_note:
      'Sized from Bloomberg\u2019s October 7-8, 2025 reporting as relayed by Reuters (and carried by Business Standard): ~$7.5B equity versus up to $12.5B SPV debt within the ~$20B package, NVIDIA investing as much as $2B in the equity portion and Valor leading the equity leg. All attribution is to unnamed sources; xAI did not confirm the SPV structure at the time, hence reported_secondary / announced rather than closed. NVIDIA\u2019s equity goes into the SPV that finances Colossus 2 GPUs, not directly into xAI corporate stock.',
    is_published: true,
    published_at: '2025-10-07T16:00:00Z',
    last_reviewed_at: '2026-10-17T00:00:00Z',
    parties: [
      {
        id: 'p-bk-119-1',
        deal_id: '20000000-0000-0000-0000-000000000119',
        company_id: '00000000-0000-0000-0000-000000000001',
        role: 'investor',
        direction_note:
          'NVIDIA reported investing as much as $2B in the equity portion of the SPV financing, a strategy to accelerate customer AI investments',
        company: findCompany('nvidia'),
      },
      {
        id: 'p-bk-119-2',
        deal_id: '20000000-0000-0000-0000-000000000119',
        company_id: '00000000-0000-0000-0000-000000000018',
        role: 'investee',
        direction_note:
          'Beneficiary of the SPV equity leg raising ~$7.5B; Valor Equity Partners leads the equity portion (not in ledger, named here)',
        company: findCompany('xai'),
      },
    ],
    sources: [
      {
        deal_id: '20000000-0000-0000-0000-000000000119',
        source_id: '10000000-0000-0000-0000-000000000165',
        supporting_note:
          'Reuters relay of Bloomberg\u2019s report on the ~$20B, GPU-tied xAI financing package and its equity/debt split.',
        is_primary_support: true,
        source: SRC_XAI_REUTERS,
      },
    ],
  },
  {
    id: '20000000-0000-0000-0000-000000000120',
    slug: 'xai-colossus2-spv-gpu-debt-12-5b-2025',
    title: 'xAI up to $12.5B SPV GPU-Collateralized Debt for Colossus 2 (Apollo, Diameter Participating)',
    summary:
      'As part of the ~$20 billion financing package Bloomberg reported on October 7-8, 2025 (relayed by Reuters), up to $12.5 billion of debt is being raised through a special purpose vehicle that purchases NVIDIA processors and leases them to xAI for five years for its Colossus 2 project in Memphis. The loan is backed by the GPUs rather than the company\u2019s credit, letting Wall Street financiers recoup their investment through the hardware — a structure Bloomberg flagged as a potential playbook for capital-intensive AI ventures. Apollo Global Management and Diameter Capital Partners were reported participating in the debt raise; the financing remained in progress and unconfirmed by the company at the time of reporting.',
    deal_type: 'debt_credit_facility',
    status: 'announced',
    announcement_date: '2025-10-07',
    effective_date: null,
    maturity_date: null,
    amount_value: 12500000000,
    amount_currency: 'USD',
    amount_basis: 'gpu_collateralized_loan',
    amount_period: 'Debt portion (up to $12.5B) of the ~$20B SPV package; five-year GPU lease-back',
    amount_disclosed: true,
    geography: 'United States (Tennessee)',
    evidence_level: 'reported_secondary',
    confidence_note:
      'Sized from Bloomberg\u2019s October 7-8, 2025 reporting as relayed by Reuters (and carried by Business Standard): up to $12.5B of SPV debt within the ~$20B package, collateralized by the purchased NVIDIA GPUs and serviced by xAI\u2019s five-year lease, with Apollo Global Management and Diameter Capital Partners reported as debt participants. Debt sits in the SPV, not on xAI\u2019s balance sheet; lenders are not in the ledger and are named here. Not company-confirmed at the time, hence reported_secondary / announced.',
    is_published: true,
    published_at: '2025-10-07T16:00:00Z',
    last_reviewed_at: '2026-10-17T00:00:00Z',
    parties: [
      {
        id: 'p-bk-120-1',
        deal_id: '20000000-0000-0000-0000-000000000120',
        company_id: '00000000-0000-0000-0000-000000000018',
        role: 'borrower',
        direction_note:
          'Lessee under the SPV: xAI leases the NVIDIA GPUs purchased with up to $12.5B of SPV debt over five years for Colossus 2',
        company: findCompany('xai'),
      },
      {
        id: 'p-bk-120-2',
        deal_id: '20000000-0000-0000-0000-000000000120',
        company_id: '00000000-0000-0000-0000-000000000001',
        role: 'supplier',
        direction_note:
          'GPUs purchased by the SPV (and serving as loan collateral) are NVIDIA processors for the Colossus 2 buildout',
        company: findCompany('nvidia'),
      },
    ],
    sources: [
      {
        deal_id: '20000000-0000-0000-0000-000000000120',
        source_id: '10000000-0000-0000-0000-000000000165',
        supporting_note:
          'Reuters relay of Bloomberg\u2019s report on the up-to-$12.5B GPU-collateralized SPV debt leg with Apollo and Diameter participation.',
        is_primary_support: true,
        source: SRC_XAI_REUTERS,
      },
    ],
  },
];

export const EXTRA_RELATIONSHIPS: Relationship[] = [
  {
    id: '30000000-0000-0000-0000-000000000079',
    from_company_id: '00000000-0000-0000-0000-000000000016',
    to_company_id: '00000000-0000-0000-0000-000000000083',
    relationship_type: 'equity_shareholder',
    start_date: '2025-08-13',
    end_date: null,
    description:
      'Google holds TeraWulf warrants for 73,580,000 shares at $0.01 exercise (~14% pro forma equity) received in consideration for backstopping Fluidstack\u2019s Lake Mariner lease obligations (CB-3/CB-4 then CB-5).',
    evidence_level: 'confirmed_primary',
    is_published: true,
    from_company: findCompany('alphabet'),
    to_company: TERAWULF,
    sources: [
      {
        relationship_id: '30000000-0000-0000-0000-000000000079',
        source_id: '10000000-0000-0000-0000-000000000160',
        supporting_note:
          'Aug 18, 2025 8-K exhibit confirms cumulative warrants of 73,580,000 shares (41,011,803 + 32,568,197) and ~14% pro forma ownership.',
        source: SRC_TERAWULF_CB5_8K_AUG18,
      },
    ],
  },
  {
    id: '30000000-0000-0000-0000-000000000080',
    from_company_id: '00000000-0000-0000-0000-000000000016',
    to_company_id: '00000000-0000-0000-0000-000000000084',
    relationship_type: 'equity_shareholder',
    start_date: '2025-09-24',
    end_date: null,
    description:
      'Google holds Cipher warrants for 24,178,576 shares at $0.01 exercise (~5.4% pro forma equity, expiring September 24, 2030) received for backstopping Fluidstack\u2019s Barber Lake lease obligations.',
    evidence_level: 'confirmed_primary',
    is_published: true,
    from_company: findCompany('alphabet'),
    to_company: CIPHER_MINING,
    sources: [
      {
        relationship_id: '30000000-0000-0000-0000-000000000080',
        source_id: '10000000-0000-0000-0000-000000000161',
        supporting_note:
          'Sept 25, 2025 8-K exhibit records the Google Warrant Agreement issued in consideration for the $1.4B backstop.',
        source: SRC_CIPHER_8K_SEP25,
      },
    ],
  },
  {
    id: '30000000-0000-0000-0000-000000000081',
    from_company_id: '00000000-0000-0000-0000-000000000063',
    to_company_id: '00000000-0000-0000-0000-000000000073',
    relationship_type: 'equity_shareholder',
    start_date: '2025-06-05',
    end_date: null,
    description:
      'Andreessen Horowitz participated in Anysphere\u2019s $900M Series C at a $9.9B valuation (June 2025), alongside lead Thrive Capital, Accel and DST Global.',
    evidence_level: 'confirmed_primary',
    is_published: true,
    from_company: findCompany('a16z'),
    to_company: ANYSPHERE,
    sources: [
      {
        relationship_id: '30000000-0000-0000-0000-000000000081',
        source_id: '10000000-0000-0000-0000-000000000163',
        supporting_note: 'Company blog post naming Andreessen Horowitz among the Series C investors.',
        source: SRC_CURSOR_BLOG,
      },
    ],
  },
  {
    id: '30000000-0000-0000-0000-000000000082',
    from_company_id: '00000000-0000-0000-0000-000000000001',
    to_company_id: '00000000-0000-0000-0000-000000000018',
    relationship_type: 'other',
    start_date: '2025-10-07',
    end_date: null,
    description:
      'NVIDIA reported investing as much as $2B in the equity portion of the ~$20B SPV financing that purchases NVIDIA processors and leases them to xAI for the Colossus 2 Memphis data center.',
    evidence_level: 'reported_secondary',
    is_published: true,
    from_company: findCompany('nvidia'),
    to_company: findCompany('xai'),
    sources: [
      {
        relationship_id: '30000000-0000-0000-0000-000000000082',
        source_id: '10000000-0000-0000-0000-000000000165',
        supporting_note:
          'Reuters relay of Bloomberg\u2019s report on NVIDIA\u2019s up-to-$2B equity commitment in the GPU-tied SPV package.',
        source: SRC_XAI_REUTERS,
      },
    ],
  },
];
