import { Company, Deal, Relationship, Source } from '../types';
import { findCompany } from './dataset';

// LANE 2 (mega cloud-compute contracts, round 2): the largest hyperscaler compute
// commitments reported 2025. No new companies — every party exists in dataset.ts.
export const EXTRA_COMPANIES: Company[] = [];

const SRC_WSJ_ORACLE_300B: Source = {
  id: '10000000-0000-0000-0000-000000000150',
  url: 'https://www.wsj.com/business/openai-oracle-sign-300-billion-computing-deal-among-biggest-in-history-ff27c8fe',
  title: 'Exclusive | Oracle, OpenAI Sign $300 Billion Cloud Deal',
  publisher: 'The Wall Street Journal',
  source_type: 'reputable_media',
  published_date: '2025-09-10',
  accessed_at: '2026-10-17T00:00:00Z',
  notes:
    'WSJ exclusive: OpenAI signed a contract to purchase $300 billion in computing power from Oracle over roughly five years starting in 2027, per people familiar; Oracle declined to comment and OpenAI did not respond before publication.',
};

const SRC_OPENAI_STARGATE_300B: Source = {
  id: '10000000-0000-0000-0000-000000000151',
  url: 'https://openai.com/index/five-new-stargate-sites/',
  title: 'OpenAI, Oracle, and SoftBank expand Stargate with five new AI data center sites',
  publisher: 'OpenAI Newsroom',
  source_type: 'company_release',
  published_date: '2025-09-23',
  accessed_at: '2026-10-17T00:00:00Z',
  notes:
    'OpenAI on the record: the July 4.5 GW Oracle agreement "represents a partnership that exceeds $300 billion between the two companies over the next five years," with the new Oracle Stargate sites delivering over 5.5 GW.',
};

const SRC_MICROSOFT_OPENAI_NEXT: Source = {
  id: '10000000-0000-0000-0000-000000000152',
  url: 'https://blogs.microsoft.com/blog/2025/10/28/the-next-chapter-of-the-microsoft-openai-partnership',
  title: 'The next chapter of the Microsoft–OpenAI partnership',
  publisher: 'Microsoft Official Blog',
  source_type: 'company_release',
  published_date: '2025-10-28',
  accessed_at: '2026-10-17T00:00:00Z',
  notes:
    'Microsoft blog: "OpenAI has contracted to purchase an incremental $250B of Azure services, and Microsoft will no longer have a right of first refusal to be OpenAI\u2019s compute provider." Part of the definitive next-phase agreement.',
};

const SRC_OPENAI_MSFT_NEXT: Source = {
  id: '10000000-0000-0000-0000-000000000153',
  url: 'https://openai.com/index/next-chapter-of-microsoft-openai-partnership',
  title: 'The next chapter of the Microsoft–OpenAI partnership',
  publisher: 'OpenAI Newsroom',
  source_type: 'company_release',
  published_date: '2025-10-28',
  accessed_at: '2026-10-17T00:00:00Z',
  notes:
    'OpenAI blog co-announcement of the new definitive agreement including the incremental $250B Azure services purchase commitment.',
};

const SRC_ANTHROPIC_MSFT_30B: Source = {
  id: '10000000-0000-0000-0000-000000000154',
  url: 'https://www.anthropic.com/news/microsoft-nvidia-anthropic-announce-strategic-partnerships',
  title: 'Microsoft, NVIDIA, and Anthropic announce strategic partnerships',
  publisher: 'Anthropic Newsroom',
  source_type: 'company_release',
  published_date: '2025-11-18',
  accessed_at: '2026-10-17T00:00:00Z',
  notes:
    'Joint announcement: "Anthropic has committed to purchase $30 billion of Azure compute capacity and to contract additional compute capacity up to one gigawatt" on NVIDIA Grace Blackwell and Vera Rubin systems.',
};

const SRC_REUTERS_ANTHROPIC_30B: Source = {
  id: '10000000-0000-0000-0000-000000000155',
  url: 'https://www.reuters.com/technology/anthropic-commits-30-billion-microsoft-azure-compute-2025-11-18/',
  title: 'Microsoft, Nvidia to invest in Anthropic as Claude maker commits $30 billion to Microsoft Azure',
  publisher: 'Reuters',
  source_type: 'reputable_media',
  published_date: '2025-11-18',
  accessed_at: '2026-10-17T00:00:00Z',
  notes:
    'Reuters confirmation of the three-way tie-up including the $30 billion Anthropic commitment to Microsoft Azure compute.',
};

const SRC_REUTERS_META_GOOGLE: Source = {
  id: '10000000-0000-0000-0000-000000000156',
  url: 'https://www.reuters.com/business/meta-signs-over-10-billion-cloud-deal-with-google-source-says-2025-08-21/',
  title: 'Meta signs over $10 billion cloud deal with Google, source says',
  publisher: 'Reuters',
  source_type: 'reputable_media',
  published_date: '2025-08-21',
  accessed_at: '2026-10-17T00:00:00Z',
  notes:
    'Reuters: Meta has struck a six-year cloud computing deal with Google worth more than $10 billion, per two people familiar; first reported by The Information; deal is mainly AI infrastructure. Neither company officially confirmed.',
};

const SRC_CRWV_META_8K: Source = {
  id: '10000000-0000-0000-0000-000000000157',
  url: 'https://www.sec.gov/Archives/edgar/data/1769628/000176962825000050/crwv-20250925.htm',
  title: 'CoreWeave, Inc. Current Report on Form 8-K (Meta Order Form under Master Services Agreement)',
  publisher: 'U.S. Securities and Exchange Commission (EDGAR)',
  source_type: 'primary_filing',
  published_date: '2025-09-30',
  accessed_at: '2026-10-17T00:00:00Z',
  notes:
    'CoreWeave 8-K (Items 1.01/9.01): on September 25, 2025 Meta entered a new order form under the December 10, 2023 MSA committing "up to approximately $14.2 billion through December 14, 2031," with the option to materially expand its commitment through 2032; redacted Meta MSA filed as Exhibit 10.1.',
};

export const EXTRA_SOURCES: Source[] = [
  SRC_WSJ_ORACLE_300B,
  SRC_OPENAI_STARGATE_300B,
  SRC_MICROSOFT_OPENAI_NEXT,
  SRC_OPENAI_MSFT_NEXT,
  SRC_ANTHROPIC_MSFT_30B,
  SRC_REUTERS_ANTHROPIC_30B,
  SRC_REUTERS_META_GOOGLE,
  SRC_CRWV_META_8K,
];

export const EXTRA_DEALS: Deal[] = [
  {
    id: '20000000-0000-0000-0000-000000000111',
    slug: 'openai-oracle-300b-stargate-cloud-contract-2025',
    title: 'OpenAI-Oracle $300B Five-Year Stargate Compute Contract',
    summary:
      'OpenAI signed a contract to purchase roughly $300 billion of computing power from Oracle over about five years beginning in 2027, first reported by WSJ on September 10, 2025, supplying the 4.5 GW of additional Stargate capacity agreed in July. OpenAI subsequently confirmed on the record that its Oracle partnership "exceeds $300 billion... over the next five years." This record tracks the reported contract value; the underlying capacity agreements are tracked separately as the June 2025 gigawatt-scale OCI agreement and the July 2025 4.5 GW Stargate expansion.',
    deal_type: 'cloud_compute_contract',
    status: 'signed',
    announcement_date: '2025-09-10',
    effective_date: null,
    maturity_date: null,
    amount_value: 300000000000,
    amount_currency: 'USD',
    amount_basis: 'contract_value',
    amount_period: 'Five-year compute purchase commencing in 2027',
    amount_disclosed: true,
    geography: 'United States',
    evidence_level: 'confirmed_primary',
    confidence_note:
      'WSJ first reported the ~$300B five-year contract on Sept 10, 2025 citing people familiar (Oracle declined to comment). OpenAI then confirmed on the record (Sept 23, 2025 Stargate announcement) that the July 4.5 GW Oracle agreement "represents a partnership that exceeds $300 billion between the two companies over the next five years," so the figure is treated as company-confirmed floor value, recorded at the WSJ-reported $300B. Related value-null records: 20000000-0000-0000-0000-000000000030 (June 2025 gigawatt-scale OCI agreement) and 20000000-0000-0000-0000-000000000073 (July 2025 4.5 GW Stargate expansion).',
    is_published: true,
    published_at: '2025-09-10T16:00:00Z',
    last_reviewed_at: '2026-10-17T00:00:00Z',
    parties: [
      {
        id: 'p-300b-1',
        deal_id: '20000000-0000-0000-0000-000000000111',
        company_id: '00000000-0000-0000-0000-000000000004',
        role: 'customer',
        direction_note: 'Contracts ~$300B of Oracle compute over roughly five years starting in 2027 for Stargate workloads',
        company: findCompany('openai'),
      },
      {
        id: 'p-300b-2',
        deal_id: '20000000-0000-0000-0000-000000000111',
        company_id: '00000000-0000-0000-0000-000000000007',
        role: 'cloud_provider',
        direction_note: 'Supplies OCI capacity supporting 4.5 GW of additional Stargate sites including Abilene',
        company: findCompany('oracle'),
      },
    ],
    sources: [
      {
        deal_id: '20000000-0000-0000-0000-000000000111',
        source_id: '10000000-0000-0000-0000-000000000151',
        supporting_note: 'OpenAI on-record statement that the Oracle partnership exceeds $300 billion over five years.',
        is_primary_support: true,
        source: SRC_OPENAI_STARGATE_300B,
      },
      {
        deal_id: '20000000-0000-0000-0000-000000000111',
        source_id: '10000000-0000-0000-0000-000000000150',
        supporting_note: 'WSJ exclusive reporting the signed $300B contract value and 2027 start per people familiar.',
        is_primary_support: false,
        source: SRC_WSJ_ORACLE_300B,
      },
    ],
  },
  {
    id: '20000000-0000-0000-0000-000000000112',
    slug: 'microsoft-openai-250b-azure-commitment-2025',
    title: 'Microsoft-OpenAI $250B Incremental Azure Commitment',
    summary:
      'As part of the definitive next-phase partnership announced October 28, 2025 alongside OpenAI\u2019s recapitalization into a public benefit corporation, OpenAI contracted to purchase an incremental $250 billion of Microsoft Azure services. Microsoft simultaneously gave up its right of first refusal to be OpenAI\u2019s compute provider, letting OpenAI buy capacity elsewhere while Azure remains its primary cloud.',
    deal_type: 'cloud_compute_contract',
    status: 'signed',
    announcement_date: '2025-10-28',
    effective_date: '2025-10-28',
    maturity_date: null,
    amount_value: 250000000000,
    amount_currency: 'USD',
    amount_basis: 'commitment',
    amount_period: 'Incremental Azure services purchase under the next-phase definitive agreement',
    amount_disclosed: true,
    geography: 'United States',
    evidence_level: 'confirmed_primary',
    confidence_note:
      'Jointly confirmed by Microsoft and OpenAI on Oct 28, 2025: both official blogs state OpenAI "has contracted to purchase an incremental $250B of Azure services." No purchase period was broken out beyond the next-phase partnership framework (IP rights run through 2032), so maturity is left null.',
    is_published: true,
    published_at: '2025-10-28T16:00:00Z',
    last_reviewed_at: '2026-10-17T00:00:00Z',
    parties: [
      {
        id: 'p-250b-1',
        deal_id: '20000000-0000-0000-0000-000000000112',
        company_id: '00000000-0000-0000-0000-000000000004',
        role: 'customer',
        direction_note: 'Contracts an incremental $250B of Azure services under the next-phase agreement',
        company: findCompany('openai'),
      },
      {
        id: 'p-250b-2',
        deal_id: '20000000-0000-0000-0000-000000000112',
        company_id: '00000000-0000-0000-0000-000000000003',
        role: 'cloud_provider',
        direction_note: 'Remains primary cloud provider with the $250B purchase commitment; right of first refusal dropped',
        company: findCompany('microsoft'),
      },
    ],
    sources: [
      {
        deal_id: '20000000-0000-0000-0000-000000000112',
        source_id: '10000000-0000-0000-0000-000000000152',
        supporting_note: 'Microsoft blog stating the incremental $250B contracted Azure purchase.',
        is_primary_support: true,
        source: SRC_MICROSOFT_OPENAI_NEXT,
      },
      {
        deal_id: '20000000-0000-0000-0000-000000000112',
        source_id: '10000000-0000-0000-0000-000000000153',
        supporting_note: 'OpenAI blog co-announcement of the definitive next-phase agreement.',
        is_primary_support: false,
        source: SRC_OPENAI_MSFT_NEXT,
      },
    ],
  },
  {
    id: '20000000-0000-0000-0000-000000000113',
    slug: 'anthropic-microsoft-30b-azure-commitment-2025',
    title: 'Anthropic $30B Microsoft Azure Compute Commitment',
    summary:
      'On November 18, 2025, Microsoft, NVIDIA, and Anthropic announced strategic partnerships under which Anthropic committed to purchase $30 billion of Azure compute capacity, with additional compute contracted up to one gigawatt on NVIDIA Grace Blackwell and Vera Rubin systems, scaling Claude on Azure. Microsoft committed up to $5 billion and NVIDIA up to $10 billion in Anthropic investments as part of the same three-way announcement (tracked separately).',
    deal_type: 'cloud_compute_contract',
    status: 'announced',
    announcement_date: '2025-11-18',
    effective_date: null,
    maturity_date: null,
    amount_value: 30000000000,
    amount_currency: 'USD',
    amount_basis: 'commitment',
    amount_period: 'Azure compute capacity purchase commitment plus up to 1 GW additional; period not disclosed',
    amount_disclosed: true,
    geography: 'United States',
    evidence_level: 'confirmed_primary',
    confidence_note:
      'Figure stated directly in both Anthropic\u2019s and Microsoft\u2019s Nov 18, 2025 releases ("committed to purchase $30 billion of Azure compute capacity") and corroborated by Reuters; purchase period not disclosed. Commitment language kept the deal as announced rather than signed for now.',
    is_published: true,
    published_at: '2025-11-18T16:00:00Z',
    last_reviewed_at: '2026-10-17T00:00:00Z',
    parties: [
      {
        id: 'p-az30b-1',
        deal_id: '20000000-0000-0000-0000-000000000113',
        company_id: '00000000-0000-0000-0000-000000000006',
        role: 'customer',
        direction_note: 'Commits to purchase $30B of Azure compute capacity plus up to 1 GW additional to scale Claude',
        company: findCompany('anthropic'),
      },
      {
        id: 'p-az30b-2',
        deal_id: '20000000-0000-0000-0000-000000000113',
        company_id: '00000000-0000-0000-0000-000000000003',
        role: 'cloud_provider',
        direction_note: 'Supplies Azure capacity on which Anthropic scales Claude, powered by NVIDIA systems',
        company: findCompany('microsoft'),
      },
    ],
    sources: [
      {
        deal_id: '20000000-0000-0000-0000-000000000113',
        source_id: '10000000-0000-0000-0000-000000000154',
        supporting_note: 'Anthropic announcement stating the $30B Azure compute purchase commitment.',
        is_primary_support: true,
        source: SRC_ANTHROPIC_MSFT_30B,
      },
      {
        deal_id: '20000000-0000-0000-0000-000000000113',
        source_id: '10000000-0000-0000-0000-000000000155',
        supporting_note: 'Reuters independent confirmation of the $30B Azure commitment.',
        is_primary_support: false,
        source: SRC_REUTERS_ANTHROPIC_30B,
      },
    ],
  },
  {
    id: '20000000-0000-0000-0000-000000000114',
    slug: 'meta-google-cloud-10b-plus-2025',
    title: 'Meta-Google Cloud $10B+ Six-Year Compute Deal',
    summary:
      'Meta struck a six-year cloud computing deal with Google worth more than $10 billion, mainly for AI infrastructure, per reporting in August 2025. Meta will use Google Cloud for servers, storage, networking and other services, with access to GPUs and TPUs to scale AI workloads, as Meta\u2019s 2025 capex guidance climbed to as high as $72 billion.',
    deal_type: 'cloud_compute_contract',
    status: 'signed',
    announcement_date: '2025-08-21',
    effective_date: null,
    maturity_date: null,
    amount_value: 10000000000,
    amount_currency: 'USD',
    amount_basis: 'contract_value',
    amount_period: 'Six-year Google Cloud services commitment (reported >$10B)',
    amount_disclosed: true,
    geography: 'United States',
    evidence_level: 'reported_secondary',
    confidence_note:
      'First reported by The Information (Aug 21, 2025), then corroborated by Reuters and CNBC citing two people familiar; six-year term, mainly AI infrastructure. Neither Meta nor Alphabet ever officially confirmed the >$10B figure on the record, and no figure was confirmed on Meta\u2019s Q2/Q3 2025 earnings calls, so the value stays media-sourced.',
    is_published: true,
    published_at: '2025-08-21T16:00:00Z',
    last_reviewed_at: '2026-10-17T00:00:00Z',
    parties: [
      {
        id: 'p-gc10b-1',
        deal_id: '20000000-0000-0000-0000-000000000114',
        company_id: '00000000-0000-0000-0000-000000000017',
        role: 'customer',
        direction_note: 'Buys more than $10B of Google Cloud compute over six years for AI infrastructure',
        company: findCompany('meta'),
      },
      {
        id: 'p-gc10b-2',
        deal_id: '20000000-0000-0000-0000-000000000114',
        company_id: '00000000-0000-0000-0000-000000000016',
        role: 'cloud_provider',
        direction_note: 'Supplies Google Cloud servers, storage, networking, GPUs and TPUs to Meta',
        company: findCompany('alphabet'),
      },
    ],
    sources: [
      {
        deal_id: '20000000-0000-0000-0000-000000000114',
        source_id: '10000000-0000-0000-0000-000000000156',
        supporting_note: 'Reuters report of the six-year >$10B Meta-Google Cloud deal per people familiar.',
        is_primary_support: true,
        source: SRC_REUTERS_META_GOOGLE,
      },
    ],
  },
  {
    id: '20000000-0000-0000-0000-000000000115',
    slug: 'meta-coreweave-14-2b-cloud-contract-2025',
    title: 'Meta-CoreWeave $14.2B AI Cloud Capacity Contract',
    summary:
      'CoreWeave disclosed via Form 8-K that Meta entered a new order form on September 25, 2025 under its December 2023 master services agreement, committing up to approximately $14.2 billion for dedicated AI cloud capacity through December 14, 2031, with the option to materially expand its commitment through 2032. The agreement provides Meta access to NVIDIA GB300 systems and lets CoreWeave fill data center capacity beyond its largest customer, Microsoft.',
    deal_type: 'cloud_compute_contract',
    status: 'signed',
    announcement_date: '2025-09-30',
    effective_date: '2025-09-25',
    maturity_date: '2031-12-14',
    amount_value: 14200000000,
    amount_currency: 'USD',
    amount_basis: 'contract_value',
    amount_period: 'Up to ~$14.2B committed through December 14, 2031; option to materially expand through 2032',
    amount_disclosed: true,
    geography: 'United States',
    evidence_level: 'confirmed_primary',
    confidence_note:
      'CoreWeave 8-K (filed Sept 30, 2025, accession 0001769628-25-000050) states the Sept 25, 2025 order form commits Meta "to pay up to approximately $14.2 billion through December 14, 2031," corroborated by Reuters and CNBC. Candidate brief dated this ~Oct 2025; the filing shows Sept 25/30, 2025. A further ~$21B expansion through 2032 was announced April 9, 2026 (CoreWeave IR) and is not re-recorded here.',
    is_published: true,
    published_at: '2025-09-30T16:00:00Z',
    last_reviewed_at: '2026-10-17T00:00:00Z',
    parties: [
      {
        id: 'p-cw14b-1',
        deal_id: '20000000-0000-0000-0000-000000000115',
        company_id: '00000000-0000-0000-0000-000000000017',
        role: 'customer',
        direction_note: 'Committed up to ~$14.2B of AI cloud capacity through Dec 14, 2031 via order form',
        company: findCompany('meta'),
      },
      {
        id: 'p-cw14b-2',
        deal_id: '20000000-0000-0000-0000-000000000115',
        company_id: '00000000-0000-0000-0000-000000000002',
        role: 'cloud_provider',
        direction_note: 'Provides dedicated AI cloud capacity including NVIDIA GB300 systems under the 2023 MSA',
        company: findCompany('coreweave'),
      },
    ],
    sources: [
      {
        deal_id: '20000000-0000-0000-0000-000000000115',
        source_id: '10000000-0000-0000-0000-000000000157',
        supporting_note: 'CoreWeave 8-K disclosing the Meta order form and the up-to-$14.2B commitment through Dec 14, 2031.',
        is_primary_support: true,
        source: SRC_CRWV_META_8K,
      },
    ],
  },
];

export const EXTRA_RELATIONSHIPS: Relationship[] = [
  {
    id: '30000000-0000-0000-0000-000000000074',
    from_company_id: '00000000-0000-0000-0000-000000000003',
    to_company_id: '00000000-0000-0000-0000-000000000004',
    relationship_type: 'cloud_customer',
    start_date: '2025-10-28',
    end_date: null,
    description:
      'OpenAI contracted an incremental $250B purchase of Azure services under the next-phase partnership; Microsoft dropped its right of first refusal as OpenAI\u2019s compute provider.',
    evidence_level: 'confirmed_primary',
    is_published: true,
    from_company: findCompany('microsoft'),
    to_company: findCompany('openai'),
    sources: [
      {
        relationship_id: '30000000-0000-0000-0000-000000000074',
        source_id: '10000000-0000-0000-0000-000000000152',
        supporting_note: 'Microsoft blog stating the $250B contracted Azure purchase.',
        source: SRC_MICROSOFT_OPENAI_NEXT,
      },
    ],
  },
  {
    id: '30000000-0000-0000-0000-000000000075',
    from_company_id: '00000000-0000-0000-0000-000000000003',
    to_company_id: '00000000-0000-0000-0000-000000000006',
    relationship_type: 'cloud_customer',
    start_date: '2025-11-18',
    end_date: null,
    description:
      'Anthropic committed to purchase $30B of Azure compute capacity with up to 1 GW additional capacity, scaling Claude on Azure powered by NVIDIA systems.',
    evidence_level: 'confirmed_primary',
    is_published: true,
    from_company: findCompany('microsoft'),
    to_company: findCompany('anthropic'),
    sources: [
      {
        relationship_id: '30000000-0000-0000-0000-000000000075',
        source_id: '10000000-0000-0000-0000-000000000154',
        supporting_note: 'Anthropic announcement of the $30B Azure compute commitment.',
        source: SRC_ANTHROPIC_MSFT_30B,
      },
    ],
  },
  {
    id: '30000000-0000-0000-0000-000000000076',
    from_company_id: '00000000-0000-0000-0000-000000000016',
    to_company_id: '00000000-0000-0000-0000-000000000017',
    relationship_type: 'cloud_customer',
    start_date: '2025-08-21',
    end_date: null,
    description:
      'Reported six-year >$10B Google Cloud commitment by Meta for AI infrastructure (GPUs/TPUs, servers, storage, networking).',
    evidence_level: 'reported_secondary',
    is_published: true,
    from_company: findCompany('alphabet'),
    to_company: findCompany('meta'),
    sources: [
      {
        relationship_id: '30000000-0000-0000-0000-000000000076',
        source_id: '10000000-0000-0000-0000-000000000156',
        supporting_note: 'Reuters reporting of the six-year >$10B Meta-Google Cloud deal.',
        source: SRC_REUTERS_META_GOOGLE,
      },
    ],
  },
  {
    id: '30000000-0000-0000-0000-000000000077',
    from_company_id: '00000000-0000-0000-0000-000000000002',
    to_company_id: '00000000-0000-0000-0000-000000000017',
    relationship_type: 'cloud_customer',
    start_date: '2025-09-25',
    end_date: '2031-12-14',
    description:
      'Meta order form under the December 2023 MSA committing up to ~$14.2B of dedicated AI cloud capacity through December 14, 2031, with option to materially expand through 2032.',
    evidence_level: 'confirmed_primary',
    is_published: true,
    from_company: findCompany('coreweave'),
    to_company: findCompany('meta'),
    sources: [
      {
        relationship_id: '30000000-0000-0000-0000-000000000077',
        source_id: '10000000-0000-0000-0000-000000000157',
        supporting_note: 'CoreWeave 8-K disclosing the Meta order form commitment.',
        source: SRC_CRWV_META_8K,
      },
    ],
  },
];
