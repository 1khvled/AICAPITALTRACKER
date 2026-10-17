import { Company, Deal, Relationship, Source } from '../types';
import { findCompany } from './dataset';

// LANE 1 (cloud mega-deals): new company reserved for Broadcom (069).
const BROADCOM: Company = {
  id: '00000000-0000-0000-0000-000000000069',
  name: 'Broadcom Inc.',
  slug: 'broadcom',
  aliases: ['AVGO', 'Broadcom'],
  description:
    'Semiconductor and infrastructure software company co-developing custom AI accelerators and Ethernet networking systems for hyperscale AI clusters, including a 10 GW collaboration with OpenAI.',
  company_type: 'chipmaker',
  headquarters_country: 'United States',
  headquarters_city: 'Palo Alto, CA',
  website_url: 'https://www.broadcom.com',
  ticker: 'AVGO',
  cik: null,
  is_public: true,
};

export const EXTRA_COMPANIES: Company[] = [BROADCOM];

const SRC_AWS_OPENAI: Source = {
  id: '10000000-0000-0000-0000-000000000084',
  url: 'https://openai.com/index/aws-and-openai-partnership/',
  title: 'AWS and OpenAI announce multi-year strategic partnership',
  publisher: 'OpenAI Newsroom',
  source_type: 'company_release',
  published_date: '2025-11-03',
  accessed_at: '2026-10-01T00:00:00Z',
  notes:
    'Joint OpenAI-AWS announcement of a $38B seven-year cloud capacity commitment on EC2 UltraServers with NVIDIA GPUs.',
};

const SRC_REUTERS_AWS_38B: Source = {
  id: '10000000-0000-0000-0000-000000000085',
  url: 'https://www.reuters.com/business/retail-consumer/openai-amazon-strike-38-billion-agreement-chatgpt-maker-use-aws-2025-11-03/',
  title: 'OpenAI turns to Amazon in $38 billion cloud services deal after restructuring',
  publisher: 'Reuters',
  source_type: 'reputable_media',
  published_date: '2025-11-03',
  accessed_at: '2026-10-01T00:00:00Z',
  notes:
    'Reuters report confirming the signed seven-year $38B AWS deal and immediate OpenAI workload onboarding.',
};

const SRC_NVIDIA_OPENAI: Source = {
  id: '10000000-0000-0000-0000-000000000086',
  url: 'https://openai.com/index/openai-nvidia-systems-partnership/',
  title: 'OpenAI and NVIDIA announce strategic partnership to deploy 10 gigawatts of NVIDIA systems',
  publisher: 'OpenAI Newsroom',
  source_type: 'company_release',
  published_date: '2025-09-22',
  accessed_at: '2026-10-01T00:00:00Z',
  notes:
    'Joint letter-of-intent announcement: at least 10 GW of NVIDIA systems with up to $100B progressive NVIDIA investment.',
};

const SRC_REUTERS_NVIDIA_STALLED: Source = {
  id: '10000000-0000-0000-0000-000000000087',
  url: 'https://www.reuters.com/business/nvidias-plan-invest-up-100-billion-openai-has-stalled-wsj-reports-2026-01-31/',
  title: "Nvidia's plan to invest up to $100 billion in OpenAI has stalled, WSJ reports",
  publisher: 'Reuters',
  source_type: 'reputable_media',
  published_date: '2026-01-31',
  accessed_at: '2026-10-01T00:00:00Z',
  notes:
    'Reuters relay of WSJ reporting that the $100B NVIDIA-OpenAI plan stalled with no definitive agreement signed.',
};

const SRC_AMD_OPENAI: Source = {
  id: '10000000-0000-0000-0000-000000000088',
  url: 'https://ir.amd.com/news-events/press-releases/detail/1260/amd-and-openai-announce-strategic-partnership-to-deploy-6-gigawatts-of-amd-gpus',
  title: 'AMD and OpenAI Announce Strategic Partnership to Deploy 6 Gigawatts of AMD GPUs',
  publisher: 'AMD Investor Relations',
  source_type: 'company_release',
  published_date: '2025-10-06',
  accessed_at: '2026-10-01T00:00:00Z',
  notes:
    'AMD release detailing the 6 GW multi-generation Instinct GPU agreement and warrant for up to 160M shares.',
};

const SRC_REUTERS_GOOGLE_ANTHROPIC: Source = {
  id: '10000000-0000-0000-0000-000000000089',
  url: 'https://www.reuters.com/technology/artificial-intelligence/google-invests-1-bln-openai-rival-anthropic-ft-reports-2025-01-22/',
  title: 'Google to invest fresh $1 bln in OpenAI rival Anthropic, FT reports',
  publisher: 'Reuters',
  source_type: 'reputable_media',
  published_date: '2025-01-22',
  accessed_at: '2026-10-01T00:00:00Z',
  notes:
    'Reuters relay of FT reporting on a fresh $1B+ Google investment in Anthropic, separately confirmed to CNBC.',
};

const SRC_BROADCOM_OPENAI: Source = {
  id: '10000000-0000-0000-0000-000000000090',
  url: 'https://openai.com/index/openai-and-broadcom-announce-strategic-collaboration/',
  title: 'OpenAI and Broadcom announce strategic collaboration to deploy 10 gigawatts of OpenAI-designed AI accelerators',
  publisher: 'OpenAI Newsroom',
  source_type: 'company_release',
  published_date: '2025-10-13',
  accessed_at: '2026-10-01T00:00:00Z',
  notes:
    'Joint announcement of 10 GW of OpenAI-designed custom accelerators co-developed and deployed with Broadcom.',
};

export const EXTRA_SOURCES: Source[] = [
  SRC_AWS_OPENAI,
  SRC_REUTERS_AWS_38B,
  SRC_NVIDIA_OPENAI,
  SRC_REUTERS_NVIDIA_STALLED,
  SRC_AMD_OPENAI,
  SRC_REUTERS_GOOGLE_ANTHROPIC,
  SRC_BROADCOM_OPENAI,
];

export const EXTRA_DEALS: Deal[] = [
  {
    id: '20000000-0000-0000-0000-000000000074',
    slug: 'openai-aws-38b-cloud-contract-2025',
    title: 'OpenAI $38B Seven-Year AWS Cloud Compute Contract',
    summary:
      'OpenAI signed a seven-year, $38 billion agreement to run core AI workloads on Amazon Web Services, accessing hundreds of thousands of NVIDIA GPUs (GB200/GB300 via EC2 UltraServers) with all initial capacity targeted for deployment before end of 2026. The deal marks OpenAI’s first major AWS partnership following the end of Microsoft’s exclusive cloud arrangement.',
    deal_type: 'cloud_compute_contract',
    status: 'signed',
    announcement_date: '2025-11-03',
    effective_date: '2025-11-03',
    maturity_date: '2032-11-03',
    amount_value: 38000000000,
    amount_currency: 'USD',
    amount_basis: 'contract_value',
    amount_period: 'Seven-year cloud capacity commitment',
    amount_disclosed: true,
    geography: 'United States',
    evidence_level: 'confirmed_primary',
    confidence_note:
      'Jointly announced by OpenAI and AWS and corroborated by Reuters; signed seven-year $38B commitment.',
    is_published: true,
    published_at: '2025-11-03T16:00:00Z',
    last_reviewed_at: '2026-10-01T00:00:00Z',
    parties: [
      {
        id: 'p-aws38-1',
        deal_id: '20000000-0000-0000-0000-000000000074',
        company_id: '00000000-0000-0000-0000-000000000004',
        role: 'customer',
        direction_note: 'Purchases $38B of AWS compute capacity for training and inference workloads',
        company: findCompany('openai'),
      },
      {
        id: 'p-aws38-2',
        deal_id: '20000000-0000-0000-0000-000000000074',
        company_id: '00000000-0000-0000-0000-000000000005',
        role: 'cloud_provider',
        direction_note: 'Supplies EC2 UltraServer GPU clusters, scaling to tens of millions of CPUs',
        company: findCompany('amazon'),
      },
    ],
    sources: [
      {
        deal_id: '20000000-0000-0000-0000-000000000074',
        source_id: '10000000-0000-0000-0000-000000000084',
        supporting_note: 'Joint OpenAI-AWS announcement of the $38B seven-year commitment.',
        is_primary_support: true,
        source: SRC_AWS_OPENAI,
      },
      {
        deal_id: '20000000-0000-0000-0000-000000000074',
        source_id: '10000000-0000-0000-0000-000000000085',
        supporting_note: 'Reuters confirmation of the signed seven-year $38B AWS deal.',
        is_primary_support: false,
        source: SRC_REUTERS_AWS_38B,
      },
    ],
  },
  {
    id: '20000000-0000-0000-0000-000000000075',
    slug: 'nvidia-openai-100b-loi-10gw-2025',
    title: 'NVIDIA-OpenAI Up-to-$100B Letter of Intent for 10 GW Deployment',
    summary:
      'NVIDIA and OpenAI signed a non-binding letter of intent for at least 10 gigawatts of NVIDIA systems (starting with Vera Rubin in H2 2026), with NVIDIA intending to invest up to $100B progressively as each gigawatt deploys. The arrangement was never finalized: WSJ reporting relayed by Reuters in January 2026 described the megadeal as stalled/on ice, and NVIDIA’s CEO later stated the $100B figure was never a firm commitment.',
    deal_type: 'strategic_partnership',
    status: 'announced',
    announcement_date: '2025-09-22',
    effective_date: null,
    maturity_date: null,
    amount_value: 100000000000,
    amount_currency: 'USD',
    amount_basis: 'commitment',
    amount_period: 'Up to $100B progressive investment as each gigawatt deploys',
    amount_disclosed: true,
    geography: 'United States',
    evidence_level: 'announced_not_completed',
    confidence_note:
      'Announced only as a non-binding LOI; WSJ/Reuters (Jan 2026) report talks stalled with no definitive agreement signed. Amount is a conditional ceiling, not a closed investment.',
    is_published: true,
    published_at: '2025-09-22T16:00:00Z',
    last_reviewed_at: '2026-10-01T00:00:00Z',
    parties: [
      {
        id: 'p-nv100-1',
        deal_id: '20000000-0000-0000-0000-000000000075',
        company_id: '00000000-0000-0000-0000-000000000001',
        role: 'investor',
        direction_note: 'Intends progressive up-to-$100B investment tied to gigawatt deployment milestones',
        company: findCompany('nvidia'),
      },
      {
        id: 'p-nv100-2',
        deal_id: '20000000-0000-0000-0000-000000000075',
        company_id: '00000000-0000-0000-0000-000000000004',
        role: 'investee',
        direction_note: 'Builds and deploys at least 10 GW of NVIDIA-system data centers',
        company: findCompany('openai'),
      },
    ],
    sources: [
      {
        deal_id: '20000000-0000-0000-0000-000000000075',
        source_id: '10000000-0000-0000-0000-000000000086',
        supporting_note: 'Joint LOI announcement of 10 GW deployment and up-to-$100B investment plan.',
        is_primary_support: true,
        source: SRC_NVIDIA_OPENAI,
      },
      {
        deal_id: '20000000-0000-0000-0000-000000000075',
        source_id: '10000000-0000-0000-0000-000000000087',
        supporting_note: 'Later reporting that the $100B plan stalled with no definitive agreement.',
        is_primary_support: false,
        source: SRC_REUTERS_NVIDIA_STALLED,
      },
    ],
  },
  {
    id: '20000000-0000-0000-0000-000000000076',
    slug: 'amd-openai-6gw-gpu-partnership-2025',
    title: 'AMD-OpenAI 6 GW Strategic GPU Partnership with Share Warrants',
    summary:
      'AMD and OpenAI signed a definitive multi-year agreement for OpenAI to deploy 6 gigawatts of AMD Instinct GPUs across multiple generations, starting with a 1 GW MI450 rollout in H2 2026. AMD issued OpenAI a warrant for up to 160 million shares (~10%) at $0.01 vesting on deployment and share-price milestones. No hard dollar purchase figure was disclosed.',
    deal_type: 'strategic_partnership',
    status: 'signed',
    announcement_date: '2025-10-06',
    effective_date: '2025-10-06',
    maturity_date: null,
    amount_value: null,
    amount_currency: null,
    amount_basis: null,
    amount_period: null,
    amount_disclosed: false,
    geography: 'United States',
    evidence_level: 'confirmed_primary',
    confidence_note:
      'Definitive agreement confirmed by AMD release; dollar value undisclosed so amount stays null.',
    is_published: true,
    published_at: '2025-10-06T16:00:00Z',
    last_reviewed_at: '2026-10-01T00:00:00Z',
    parties: [
      {
        id: 'p-amd6g-1',
        deal_id: '20000000-0000-0000-0000-000000000076',
        company_id: '00000000-0000-0000-0000-000000000004',
        role: 'customer',
        direction_note: 'Committed buyer of initial 1 GW MI450 deployment, scaling toward 6 GW',
        company: findCompany('openai'),
      },
      {
        id: 'p-amd6g-2',
        deal_id: '20000000-0000-0000-0000-000000000076',
        company_id: '00000000-0000-0000-0000-000000000068',
        role: 'supplier',
        direction_note: 'Supplies Instinct GPUs and issued up-to-160M-share warrant to OpenAI',
        company: findCompany('amd'),
      },
    ],
    sources: [
      {
        deal_id: '20000000-0000-0000-0000-000000000076',
        source_id: '10000000-0000-0000-0000-000000000088',
        supporting_note: 'AMD announcement of the 6 GW agreement and 160M-share warrant terms.',
        is_primary_support: true,
        source: SRC_AMD_OPENAI,
      },
    ],
  },
  {
    id: '20000000-0000-0000-0000-000000000077',
    slug: 'google-anthropic-1b-investment-2025',
    title: 'Google $1B Additional Investment in Anthropic',
    summary:
      'Google agreed a fresh investment of more than $1 billion in Anthropic, reported January 22, 2025 (FT reporting relayed by Reuters and confirmed to CNBC), lifting Google’s total Anthropic backing above $3 billion on top of its earlier $2B commitment and cloud contract. Neither company officially confirmed the figure.',
    deal_type: 'equity_investment',
    status: 'announced',
    announcement_date: '2025-01-22',
    effective_date: '2025-01-22',
    maturity_date: null,
    amount_value: 1000000000,
    amount_currency: 'USD',
    amount_basis: 'cash_investment',
    amount_period: 'Primary equity top-up',
    amount_disclosed: true,
    geography: 'United States',
    evidence_level: 'reported_secondary',
    confidence_note:
      'Figure per FT reporting relayed by Reuters and confirmed to CNBC by a source familiar; neither Google nor Anthropic officially confirmed. Candidate brief said March 2025 but all corroborating reports date it January 22, 2025.',
    is_published: true,
    published_at: '2025-01-22T16:00:00Z',
    last_reviewed_at: '2026-10-01T00:00:00Z',
    parties: [
      {
        id: 'p-goo1b-1',
        deal_id: '20000000-0000-0000-0000-000000000077',
        company_id: '00000000-0000-0000-0000-000000000016',
        role: 'investor',
        direction_note: 'Fresh $1B+ commitment on top of existing $2B backing and cloud contract',
        company: findCompany('alphabet'),
      },
      {
        id: 'p-goo1b-2',
        deal_id: '20000000-0000-0000-0000-000000000077',
        company_id: '00000000-0000-0000-0000-000000000006',
        role: 'investee',
        direction_note: 'Receives additional primary capital alongside Lightspeed-led $2B round',
        company: findCompany('anthropic'),
      },
    ],
    sources: [
      {
        deal_id: '20000000-0000-0000-0000-000000000077',
        source_id: '10000000-0000-0000-0000-000000000089',
        supporting_note: 'Reuters relay of FT reporting on the fresh $1B+ Google investment.',
        is_primary_support: true,
        source: SRC_REUTERS_GOOGLE_ANTHROPIC,
      },
    ],
  },
  {
    id: '20000000-0000-0000-0000-000000000078',
    slug: 'openai-broadcom-10gw-custom-chip-2025',
    title: 'OpenAI-Broadcom 10 GW Custom AI Accelerator Collaboration',
    summary:
      'OpenAI and Broadcom announced a multi-year collaboration for 10 gigawatts of OpenAI-designed custom AI accelerators with Broadcom Ethernet networking, signing a term sheet for rack deployment starting H2 2026 through end of 2029. Financial terms were not disclosed.',
    deal_type: 'strategic_partnership',
    status: 'announced',
    announcement_date: '2025-10-13',
    effective_date: null,
    maturity_date: null,
    amount_value: null,
    amount_currency: null,
    amount_basis: null,
    amount_period: null,
    amount_disclosed: false,
    geography: 'United States',
    evidence_level: 'confirmed_primary',
    confidence_note:
      'Jointly announced by both companies; term sheet signed but financial terms undisclosed so amount stays null.',
    is_published: true,
    published_at: '2025-10-13T16:00:00Z',
    last_reviewed_at: '2026-10-01T00:00:00Z',
    parties: [
      {
        id: 'p-avgo10-1',
        deal_id: '20000000-0000-0000-0000-000000000078',
        company_id: '00000000-0000-0000-0000-000000000004',
        role: 'customer',
        direction_note: 'Designs custom accelerators and deploys racks across its facilities',
        company: findCompany('openai'),
      },
      {
        id: 'p-avgo10-2',
        deal_id: '20000000-0000-0000-0000-000000000078',
        company_id: '00000000-0000-0000-0000-000000000069',
        role: 'supplier',
        direction_note: 'Co-develops and deploys accelerator racks with Ethernet networking systems',
        company: BROADCOM,
      },
    ],
    sources: [
      {
        deal_id: '20000000-0000-0000-0000-000000000078',
        source_id: '10000000-0000-0000-0000-000000000090',
        supporting_note: 'Joint OpenAI-Broadcom announcement of the 10 GW custom accelerator plan.',
        is_primary_support: true,
        source: SRC_BROADCOM_OPENAI,
      },
    ],
  },
];

export const EXTRA_RELATIONSHIPS: Relationship[] = [
  {
    id: '30000000-0000-0000-0000-000000000044',
    from_company_id: '00000000-0000-0000-0000-000000000005',
    to_company_id: '00000000-0000-0000-0000-000000000004',
    relationship_type: 'cloud_customer',
    start_date: '2025-11-03',
    end_date: null,
    description: 'Seven-year $38B AWS compute commitment for OpenAI training and inference workloads.',
    evidence_level: 'confirmed_primary',
    is_published: true,
    from_company: findCompany('amazon'),
    to_company: findCompany('openai'),
    sources: [
      {
        relationship_id: '30000000-0000-0000-0000-000000000044',
        source_id: '10000000-0000-0000-0000-000000000084',
        supporting_note: 'Joint announcement of the $38B seven-year AWS partnership.',
        source: SRC_AWS_OPENAI,
      },
    ],
  },
  {
    id: '30000000-0000-0000-0000-000000000045',
    from_company_id: '00000000-0000-0000-0000-000000000001',
    to_company_id: '00000000-0000-0000-0000-000000000004',
    relationship_type: 'strategic_partner',
    start_date: '2025-09-22',
    end_date: null,
    description:
      'Non-binding LOI for 10 GW NVIDIA-system deployment with up-to-$100B progressive investment; reported stalled with no definitive agreement as of early 2026.',
    evidence_level: 'announced_not_completed',
    is_published: true,
    from_company: findCompany('nvidia'),
    to_company: findCompany('openai'),
    sources: [
      {
        relationship_id: '30000000-0000-0000-0000-000000000045',
        source_id: '10000000-0000-0000-0000-000000000086',
        supporting_note: 'Joint LOI announcement of the 10 GW / up-to-$100B plan.',
        source: SRC_NVIDIA_OPENAI,
      },
    ],
  },
  {
    id: '30000000-0000-0000-0000-000000000046',
    from_company_id: '00000000-0000-0000-0000-000000000068',
    to_company_id: '00000000-0000-0000-0000-000000000004',
    relationship_type: 'chip_supplier',
    start_date: '2025-10-06',
    end_date: null,
    description:
      'Multi-generation Instinct GPU supply up to 6 GW with warrant for up to 160M AMD shares.',
    evidence_level: 'confirmed_primary',
    is_published: true,
    from_company: findCompany('amd'),
    to_company: findCompany('openai'),
    sources: [
      {
        relationship_id: '30000000-0000-0000-0000-000000000046',
        source_id: '10000000-0000-0000-0000-000000000088',
        supporting_note: 'AMD announcement of the 6 GW supply agreement and warrant.',
        source: SRC_AMD_OPENAI,
      },
    ],
  },
];
