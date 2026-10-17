import type { Company, Deal, Relationship, Source } from '../types';
import { findCompany } from './dataset';

// LANE BIG-TECH STAKES: 4 verified Big-Tech equity stakes in AI companies and
// chipmakers (NVIDIA→Intel, SoftBank→Intel, NVIDIA→Anthropic,
// Microsoft→Anthropic). Only deal IDs ...107-110, source IDs ...142-149,
// relationship IDs ...070-073, and new company ...081 are used.

const INTEL: Company = {
  id: '00000000-0000-0000-0000-000000000081',
  name: 'Intel Corporation',
  slug: 'intel',
  aliases: ['INTC', 'Intel Corp'],
  description:
    'Designs and manufactures x86 CPUs, AI data center accelerators, and client computing products, and operates one of the leading US-based semiconductor foundries (Intel Foundry).',
  company_type: 'chipmaker',
  headquarters_country: 'United States',
  headquarters_city: 'Santa Clara, CA',
  website_url: 'https://www.intc.com',
  ticker: 'INTC',
  cik: '0000050863',
  is_public: true,
};

export const EXTRA_COMPANIES: Company[] = [INTEL];

const SRC_NV_INTEL_PR: Source = {
  id: '10000000-0000-0000-0000-000000000142',
  url: 'https://nvidianews.nvidia.com/news/nvidia-and-intel-to-develop-ai-infrastructure-and-personal-computing-products',
  title: 'NVIDIA and Intel to Develop AI Infrastructure and Personal Computing Products',
  publisher: 'NVIDIA Newsroom',
  source_type: 'company_release',
  published_date: '2025-09-18',
  accessed_at: '2026-10-17T00:00:00Z',
  notes:
    'NVIDIA press release: NVIDIA to invest $5 billion in Intel common stock at $23.28 per share, alongside a collaboration to jointly develop custom data center x86 CPUs (with NVLink) for NVIDIA AI infrastructure platforms and x86 SOCs integrating NVIDIA RTX GPU chiplets; subject to customary closing conditions including regulatory approvals.',
};

const SRC_INTEL_10K: Source = {
  id: '10000000-0000-0000-0000-000000000143',
  url: 'https://www.sec.gov/Archives/edgar/data/50863/000005086326000011/intc-20251227.htm',
  title: 'Intel Corporation Form 10-K for fiscal year ended December 27, 2025',
  publisher: 'U.S. SEC EDGAR (Intel Corp)',
  source_type: 'primary_filing',
  published_date: null,
  accessed_at: '2026-10-17T00:00:00Z',
  notes:
    "Intel 10-K: 'On September 15, 2025, we entered into an agreement with NVIDIA to issue and sell to NVIDIA 215 million shares of our common stock at $23.28 per share for an aggregate cash purchase price of $5.0 billion. The issuance and sale of the shares was completed on December 26, 2025.' (~214.8M shares per contemporaneous reporting; roughly a 4% stake.)",
};

const SRC_REUTERS_NV_INTEL: Source = {
  id: '10000000-0000-0000-0000-000000000144',
  url: 'https://www.reuters.com/world/asia-pacific/nvidia-bets-big-intel-with-5-billion-stake-chip-partnership-2025-09-18/',
  title: 'Nvidia takes $5 billion stake in Intel, offers chip tech in new partnership',
  publisher: 'Reuters',
  source_type: 'reputable_media',
  published_date: '2025-09-18',
  accessed_at: '2026-10-17T00:00:00Z',
  notes:
    'Independent confirmation: Nvidia said it would pay $23.28 per share for Intel common stock in a $5 billion investment paired with a product technology partnership; CNBC reported Intel shares surged ~22-30% on the news.',
};

const SRC_INTEL_SOFTBANK_PR: Source = {
  id: '10000000-0000-0000-0000-000000000145',
  url: 'https://www.intc.com/news-events/press-releases/detail/1746/softbank-group-and-intel-corporation-sign-2b-investment',
  title: 'SoftBank Group and Intel Corporation Sign $2B Investment Agreement',
  publisher: 'Intel Investor Relations (Business Wire)',
  source_type: 'company_release',
  published_date: '2025-08-18',
  accessed_at: '2026-10-17T00:00:00Z',
  notes:
    "Intel IR release (7:10 PM EDT, Aug 18, 2025): definitive securities purchase agreement under which SoftBank will make a $2 billion investment in Intel common stock at $23 per share, subject to customary closing conditions; Masayoshi Son and Lip-Bu Tan quoted on US semiconductor strategy.",
};

const SRC_INTEL_10Q_Q3_2025: Source = {
  id: '10000000-0000-0000-0000-000000000146',
  url: 'https://www.intc.com/filings-reports/all-sec-filings/content/0000050863-25-000179/intc-20250927.htm',
  title: 'Intel Corporation Form 10-Q for the quarter ended September 27, 2025',
  publisher: 'U.S. SEC EDGAR (Intel Corp, via Intel IR)',
  source_type: 'primary_filing',
  published_date: null,
  accessed_at: '2026-10-17T00:00:00Z',
  notes:
    "Intel 10-Q: 'on August 18, 2025, we entered into an agreement with SoftBank ... to issue and sell 87 million shares of our common stock at $23.00 per share. The issuance and sale of the shares was completed on September 26, 2025.' Intel's 8-K reports the precise count of 86,956,522 shares at $23.00.",
};

const SRC_ANTHROPIC_PARTNERSHIP: Source = {
  id: '10000000-0000-0000-0000-000000000147',
  url: 'https://www.anthropic.com/news/microsoft-nvidia-anthropic-announce-strategic-partnerships',
  title: 'Microsoft, NVIDIA, and Anthropic announce strategic partnerships',
  publisher: 'Anthropic',
  source_type: 'company_release',
  published_date: '2025-11-18',
  accessed_at: '2026-10-17T00:00:00Z',
  notes:
    'Anthropic announcement: NVIDIA and Microsoft committing to invest up to $10 billion and up to $5 billion respectively in Anthropic; Anthropic committed to purchase $30 billion of Azure compute capacity and contract additional compute up to one gigawatt, initially on NVIDIA Grace Blackwell and Vera Rubin systems; Amazon remains Anthropic primary cloud provider.',
};

const SRC_MICROSOFT_BLOG: Source = {
  id: '10000000-0000-0000-0000-000000000148',
  url: 'https://blogs.microsoft.com/blog/2025/11/18/microsoft-nvidia-and-anthropic-announce-strategic-partnerships/',
  title: 'Microsoft, NVIDIA and Anthropic announce strategic partnerships',
  publisher: 'Official Microsoft Blog',
  source_type: 'company_release',
  published_date: '2025-11-18',
  accessed_at: '2026-10-17T00:00:00Z',
  notes:
    'Microsoft blog: Anthropic scaling Claude on Azure powered by NVIDIA with a $30 billion Azure compute purchase commitment (plus up to 1 GW additional capacity); NVIDIA and Microsoft committing to invest up to $10 billion and up to $5 billion respectively in Anthropic; Claude to be available in Microsoft Foundry and the Copilot family.',
};

const SRC_REUTERS_ANTHROPIC: Source = {
  id: '10000000-0000-0000-0000-000000000149',
  url: 'https://www.reuters.com/technology/anthropic-commits-30-billion-microsoft-azure-compute-2025-11-18/',
  title: 'Microsoft, Nvidia to invest in Anthropic as Claude maker commits $30 billion to Microsoft Azure',
  publisher: 'Reuters',
  source_type: 'reputable_media',
  published_date: '2025-11-18',
  accessed_at: '2026-10-17T00:00:00Z',
  notes:
    'Independent confirmation: Microsoft and Nvidia plan to invest in Anthropic under a tie-up including a $30 billion commitment by Anthropic to use Microsoft Azure compute; CNBC reported Anthropic valued in the range of ~$350 billion in connection with the deal.',
};

export const EXTRA_SOURCES: Source[] = [
  SRC_NV_INTEL_PR,
  SRC_INTEL_10K,
  SRC_REUTERS_NV_INTEL,
  SRC_INTEL_SOFTBANK_PR,
  SRC_INTEL_10Q_Q3_2025,
  SRC_ANTHROPIC_PARTNERSHIP,
  SRC_MICROSOFT_BLOG,
  SRC_REUTERS_ANTHROPIC,
];

export const EXTRA_DEALS: Deal[] = [
  {
    id: '20000000-0000-0000-0000-000000000107',
    slug: 'nvidia-5b-equity-investment-intel-2025',
    title: 'NVIDIA $5 Billion Equity Investment in Intel at $23.28/Share',
    summary:
      'NVIDIA announced a collaboration with Intel on September 18, 2025 to jointly develop multiple generations of custom data center and PC products: Intel-built NVIDIA-custom x86 CPUs integrated into NVIDIA AI infrastructure platforms, and x86 system-on-chips with NVIDIA RTX GPU chiplets. Alongside the product agreement, NVIDIA committed to invest $5 billion in newly issued Intel common stock at $23.28 per share (~214.8M shares). Intel completed the issuance and sale on December 26, 2025 after regulatory clearance, taking NVIDIA to roughly a 4% equity stake.',
    deal_type: 'equity_investment',
    status: 'closed',
    announcement_date: '2025-09-18',
    effective_date: '2025-12-26',
    maturity_date: null,
    amount_value: 5000000000,
    amount_currency: 'USD',
    amount_basis: 'cash_investment',
    amount_period: 'Primary common stock private placement (~214.8M shares at $23.28)',
    amount_disclosed: true,
    geography: 'United States',
    evidence_level: 'confirmed_primary',
    confidence_note:
      'Directly supported by the NVIDIA newsroom press release ($5B at $23.28/share) and Intel SEC filings: Intel 10-K states the September 15, 2025 agreement (announced September 18) for 215 million shares at $23.28 ($5.0B aggregate) with issuance completed December 26, 2025. Reuters/CNBC independently corroborate.',
    is_published: true,
    published_at: '2025-09-18T17:00:00Z',
    last_reviewed_at: '2026-10-17T00:00:00Z',
    parties: [
      {
        id: 'p-st-107-1',
        deal_id: '20000000-0000-0000-0000-000000000107',
        company_id: '00000000-0000-0000-0000-000000000081',
        role: 'investee',
        direction_note: 'Issuer of ~214.8M new common shares to NVIDIA at $23.28/share alongside x86/NVLink product collaboration',
        company: INTEL,
      },
      {
        id: 'p-st-107-2',
        deal_id: '20000000-0000-0000-0000-000000000107',
        company_id: '00000000-0000-0000-0000-000000000001',
        role: 'investor',
        direction_note: 'Purchased $5.0B of newly issued Intel common stock to cement x86-NVIDIA product collaboration',
        company: findCompany('nvidia'),
      },
    ],
    sources: [
      {
        deal_id: '20000000-0000-0000-0000-000000000107',
        source_id: '10000000-0000-0000-0000-000000000142',
        supporting_note: 'NVIDIA press release announcing the $5B investment at $23.28/share and the product collaboration.',
        is_primary_support: true,
        source: SRC_NV_INTEL_PR,
      },
      {
        deal_id: '20000000-0000-0000-0000-000000000107',
        source_id: '10000000-0000-0000-0000-000000000143',
        supporting_note: 'Intel Form 10-K confirming the September 15, 2025 agreement and December 26, 2025 completion.',
        is_primary_support: true,
        source: SRC_INTEL_10K,
      },
      {
        deal_id: '20000000-0000-0000-0000-000000000107',
        source_id: '10000000-0000-0000-0000-000000000144',
        supporting_note: 'Reuters independent reporting of the $5B stake and price per share.',
        is_primary_support: false,
        source: SRC_REUTERS_NV_INTEL,
      },
    ],
  },
  {
    id: '20000000-0000-0000-0000-000000000108',
    slug: 'softbank-2b-equity-investment-intel-2025',
    title: 'SoftBank $2 Billion Equity Investment in Intel at $23.00/Share',
    summary:
      'SoftBank Group and Intel announced a definitive securities purchase agreement on August 18, 2025 under which SoftBank invested $2 billion in newly issued Intel common stock at $23.00 per share (86,956,522 shares). Both CEOs framed the investment as deepening commitment to US semiconductor manufacturing. The issuance and sale completed on September 26, 2025; Reuters/LSEG noted SoftBank would become Intel roughly sixth-largest shareholder.',
    deal_type: 'equity_investment',
    status: 'closed',
    announcement_date: '2025-08-18',
    effective_date: '2025-09-26',
    maturity_date: null,
    amount_value: 2000000000,
    amount_currency: 'USD',
    amount_basis: 'cash_investment',
    amount_period: 'Primary common stock private placement (86,956,522 shares at $23.00)',
    amount_disclosed: true,
    geography: 'United States',
    evidence_level: 'confirmed_primary',
    confidence_note:
      'Directly supported by the Intel investor relations release ($2B at $23/share) and Intel 10-Q disclosure that the August 18, 2025 agreement completed on September 26, 2025 (86,956,522 shares at $23.00 per Intel 8-K). Reuters/CNBC independently corroborate.',
    is_published: true,
    published_at: '2025-08-18T23:10:00Z',
    last_reviewed_at: '2026-10-17T00:00:00Z',
    parties: [
      {
        id: 'p-st-108-1',
        deal_id: '20000000-0000-0000-0000-000000000108',
        company_id: '00000000-0000-0000-0000-000000000081',
        role: 'investee',
        direction_note: 'Issuer of 86,956,522 new common shares to SoftBank at $23.00/share',
        company: INTEL,
      },
      {
        id: 'p-st-108-2',
        deal_id: '20000000-0000-0000-0000-000000000108',
        company_id: '00000000-0000-0000-0000-000000000030',
        role: 'investor',
        direction_note: 'Strategic investor acquiring $2.0B of newly issued Intel common stock',
        company: findCompany('softbank'),
      },
    ],
    sources: [
      {
        deal_id: '20000000-0000-0000-0000-000000000108',
        source_id: '10000000-0000-0000-0000-000000000145',
        supporting_note: 'Intel IR press release announcing the $2B SoftBank investment at $23/share.',
        is_primary_support: true,
        source: SRC_INTEL_SOFTBANK_PR,
      },
      {
        deal_id: '20000000-0000-0000-0000-000000000108',
        source_id: '10000000-0000-0000-0000-000000000146',
        supporting_note: 'Intel Form 10-Q confirming the August 18, 2025 agreement and September 26, 2025 completion.',
        is_primary_support: true,
        source: SRC_INTEL_10Q_Q3_2025,
      },
    ],
  },
  {
    id: '20000000-0000-0000-0000-000000000109',
    slug: 'nvidia-10b-commitment-anthropic-2025',
    title: 'NVIDIA Up to $10 Billion Investment Commitment in Anthropic',
    summary:
      'On November 18, 2025, NVIDIA and Anthropic announced a deep technology partnership: Anthropic adopting NVIDIA architectures (initially up to one gigawatt of Grace Blackwell and Vera Rubin systems) and committing to purchase $30 billion of Microsoft Azure compute powered by NVIDIA, while NVIDIA committed to invest up to $10 billion in Anthropic alongside Microsoft. Anthropic was valued in the range of ~$350 billion in connection with the deal (CNBC). Deployment of the phased investment was not yet evidenced as completed in primary filings at review time.',
    deal_type: 'equity_investment',
    status: 'announced',
    announcement_date: '2025-11-18',
    effective_date: null,
    maturity_date: null,
    amount_value: 10000000000,
    amount_currency: 'USD',
    amount_basis: 'commitment',
    amount_period: 'Up to $10B phased investment commitment alongside technology partnership',
    amount_disclosed: true,
    geography: 'United States',
    evidence_level: 'announced_not_completed',
    confidence_note:
      'The up-to-$10B commitment is directly confirmed by the Anthropic and Microsoft co-announcements (and NVIDIA blog) of November 18, 2025; because the releases state an up-to commitment and full deployment is not yet evidenced in primary filings, the deal is carried as announced_not_completed. NVIDIA FY2026 Q4 earnings call referenced the $10B investment announcement, and Reuters (Sept 2026) reported NVIDIA weighing up to $10B in Anthropic IPO participation.',
    is_published: true,
    published_at: '2025-11-18T14:30:00Z',
    last_reviewed_at: '2026-10-17T00:00:00Z',
    parties: [
      {
        id: 'p-st-109-1',
        deal_id: '20000000-0000-0000-0000-000000000109',
        company_id: '00000000-0000-0000-0000-000000000006',
        role: 'investee',
        direction_note: 'Frontier AI lab scaling Claude on Azure with NVIDIA Grace Blackwell/Vera Rubin compute',
        company: findCompany('anthropic'),
      },
      {
        id: 'p-st-109-2',
        deal_id: '20000000-0000-0000-0000-000000000109',
        company_id: '00000000-0000-0000-0000-000000000001',
        role: 'investor',
        direction_note: 'Committing to invest up to $10B in Anthropic alongside deep technology partnership',
        company: findCompany('nvidia'),
      },
    ],
    sources: [
      {
        deal_id: '20000000-0000-0000-0000-000000000109',
        source_id: '10000000-0000-0000-0000-000000000147',
        supporting_note: 'Anthropic announcement confirming NVIDIA committing up to $10B and the technology partnership.',
        is_primary_support: true,
        source: SRC_ANTHROPIC_PARTNERSHIP,
      },
      {
        deal_id: '20000000-0000-0000-0000-000000000109',
        source_id: '10000000-0000-0000-0000-000000000148',
        supporting_note: 'Microsoft blog co-announcement stating the up to $10B (NVIDIA) and up to $5B (Microsoft) investments.',
        is_primary_support: true,
        source: SRC_MICROSOFT_BLOG,
      },
      {
        deal_id: '20000000-0000-0000-0000-000000000109',
        source_id: '10000000-0000-0000-0000-000000000149',
        supporting_note: 'Reuters independent reporting of the investment plans and $30B Azure commitment.',
        is_primary_support: false,
        source: SRC_REUTERS_ANTHROPIC,
      },
    ],
  },
  {
    id: '20000000-0000-0000-0000-000000000110',
    slug: 'microsoft-5b-commitment-anthropic-2025',
    title: 'Microsoft Up to $5 Billion Investment Commitment in Anthropic',
    summary:
      'On November 18, 2025, Microsoft and Anthropic announced an expanded partnership bringing Claude to Microsoft Foundry and the Copilot family, with Anthropic committing to purchase $30 billion of Azure compute capacity (plus up to one additional gigawatt) powered by NVIDIA systems. As part of the same three-way announcement, Microsoft committed to invest up to $5 billion in Anthropic, alongside NVIDIA up to $10 billion. Anthropic was valued in the range of ~$350 billion in connection with the deal (CNBC); Microsoft later recorded a ~$3.2B mark-up gain on its Anthropic holding in its July 2026 results (TechCrunch), consistent with deployment of the commitment.',
    deal_type: 'equity_investment',
    status: 'announced',
    announcement_date: '2025-11-18',
    effective_date: null,
    maturity_date: null,
    amount_value: 5000000000,
    amount_currency: 'USD',
    amount_basis: 'commitment',
    amount_period: 'Up to $5B investment commitment alongside expanded Claude/Azure partnership',
    amount_disclosed: true,
    geography: 'United States',
    evidence_level: 'announced_not_completed',
    confidence_note:
      'The up-to-$5B commitment is directly confirmed by the Microsoft Official Blog and Anthropic co-announcements of November 18, 2025; because the releases state an up-to commitment and completion is not evidenced in a primary filing, the deal is carried as announced_not_completed. Microsoft FY2026 Q4 earnings later recorded a $3.2B gain on the Anthropic investment (TechCrunch, July 29, 2026) as reported-secondary corroboration of deployment.',
    is_published: true,
    published_at: '2025-11-18T14:30:00Z',
    last_reviewed_at: '2026-10-17T00:00:00Z',
    parties: [
      {
        id: 'p-st-110-1',
        deal_id: '20000000-0000-0000-0000-000000000110',
        company_id: '00000000-0000-0000-0000-000000000006',
        role: 'investee',
        direction_note: 'Frontier AI lab committing $30B of Azure compute purchases while expanding Claude distribution',
        company: findCompany('anthropic'),
      },
      {
        id: 'p-st-110-2',
        deal_id: '20000000-0000-0000-0000-000000000110',
        company_id: '00000000-0000-0000-0000-000000000003',
        role: 'investor',
        direction_note: 'Committing to invest up to $5B in Anthropic alongside Claude distribution across Foundry and Copilot',
        company: findCompany('microsoft'),
      },
    ],
    sources: [
      {
        deal_id: '20000000-0000-0000-0000-000000000110',
        source_id: '10000000-0000-0000-0000-000000000148',
        supporting_note: 'Microsoft Official Blog co-announcement stating Microsoft committing up to $5B in Anthropic.',
        is_primary_support: true,
        source: SRC_MICROSOFT_BLOG,
      },
      {
        deal_id: '20000000-0000-0000-0000-000000000110',
        source_id: '10000000-0000-0000-0000-000000000147',
        supporting_note: 'Anthropic announcement confirming the partnership and the respective up-to investment commitments.',
        is_primary_support: true,
        source: SRC_ANTHROPIC_PARTNERSHIP,
      },
      {
        deal_id: '20000000-0000-0000-0000-000000000110',
        source_id: '10000000-0000-0000-0000-000000000149',
        supporting_note: 'Reuters independent reporting of Microsoft and Nvidia planned investments in Anthropic.',
        is_primary_support: false,
        source: SRC_REUTERS_ANTHROPIC,
      },
    ],
  },
];

export const EXTRA_RELATIONSHIPS: Relationship[] = [
  {
    id: '30000000-0000-0000-0000-000000000070',
    from_company_id: '00000000-0000-0000-0000-000000000001',
    to_company_id: '00000000-0000-0000-0000-000000000081',
    relationship_type: 'equity_shareholder',
    start_date: '2025-12-26',
    end_date: null,
    description:
      'NVIDIA purchased $5.0B of newly issued Intel common stock (~214.8M shares at $23.28) in a private placement completed December 26, 2025, roughly a 4% stake, tied to the NVIDIA-Intel x86/NVLink product collaboration.',
    evidence_level: 'confirmed_primary',
    is_published: true,
    from_company: findCompany('nvidia'),
    to_company: INTEL,
    sources: [
      {
        relationship_id: '30000000-0000-0000-0000-000000000070',
        source_id: '10000000-0000-0000-0000-000000000143',
        supporting_note: 'Intel Form 10-K confirming the completed NVIDIA share issuance.',
        source: SRC_INTEL_10K,
      },
      {
        relationship_id: '30000000-0000-0000-0000-000000000070',
        source_id: '10000000-0000-0000-0000-000000000142',
        supporting_note: 'NVIDIA press release announcing the investment terms.',
        source: SRC_NV_INTEL_PR,
      },
    ],
  },
  {
    id: '30000000-0000-0000-0000-000000000071',
    from_company_id: '00000000-0000-0000-0000-000000000030',
    to_company_id: '00000000-0000-0000-0000-000000000081',
    relationship_type: 'equity_shareholder',
    start_date: '2025-09-26',
    end_date: null,
    description:
      'SoftBank purchased $2.0B of newly issued Intel common stock (86,956,522 shares at $23.00) in a private placement completed September 26, 2025.',
    evidence_level: 'confirmed_primary',
    is_published: true,
    from_company: findCompany('softbank'),
    to_company: INTEL,
    sources: [
      {
        relationship_id: '30000000-0000-0000-0000-000000000071',
        source_id: '10000000-0000-0000-0000-000000000146',
        supporting_note: 'Intel Form 10-Q confirming the completed SoftBank share issuance.',
        source: SRC_INTEL_10Q_Q3_2025,
      },
      {
        relationship_id: '30000000-0000-0000-0000-000000000071',
        source_id: '10000000-0000-0000-0000-000000000145',
        supporting_note: 'Intel IR press release announcing the $2B investment terms.',
        source: SRC_INTEL_SOFTBANK_PR,
      },
    ],
  },
  {
    id: '30000000-0000-0000-0000-000000000072',
    from_company_id: '00000000-0000-0000-0000-000000000001',
    to_company_id: '00000000-0000-0000-0000-000000000006',
    relationship_type: 'equity_shareholder',
    start_date: '2025-11-18',
    end_date: null,
    description:
      'NVIDIA committed to invest up to $10B in Anthropic alongside a deep technology partnership optimizing Claude for NVIDIA Grace Blackwell/Vera Rubin architectures.',
    evidence_level: 'announced_not_completed',
    is_published: true,
    from_company: findCompany('nvidia'),
    to_company: findCompany('anthropic'),
    sources: [
      {
        relationship_id: '30000000-0000-0000-0000-000000000072',
        source_id: '10000000-0000-0000-0000-000000000147',
        supporting_note: 'Anthropic announcement of the partnership and NVIDIA up to $10B commitment.',
        source: SRC_ANTHROPIC_PARTNERSHIP,
      },
      {
        relationship_id: '30000000-0000-0000-0000-000000000072',
        source_id: '10000000-0000-0000-0000-000000000148',
        supporting_note: 'Microsoft blog co-announcement confirming the respective investment commitments.',
        source: SRC_MICROSOFT_BLOG,
      },
    ],
  },
  {
    id: '30000000-0000-0000-0000-000000000073',
    from_company_id: '00000000-0000-0000-0000-000000000003',
    to_company_id: '00000000-0000-0000-0000-000000000006',
    relationship_type: 'equity_shareholder',
    start_date: '2025-11-18',
    end_date: null,
    description:
      'Microsoft committed to invest up to $5B in Anthropic as part of the expanded partnership scaling Claude on Azure and across Microsoft Foundry/Copilot.',
    evidence_level: 'announced_not_completed',
    is_published: true,
    from_company: findCompany('microsoft'),
    to_company: findCompany('anthropic'),
    sources: [
      {
        relationship_id: '30000000-0000-0000-0000-000000000073',
        source_id: '10000000-0000-0000-0000-000000000148',
        supporting_note: 'Microsoft Official Blog announcement of the up to $5B commitment.',
        source: SRC_MICROSOFT_BLOG,
      },
      {
        relationship_id: '30000000-0000-0000-0000-000000000073',
        source_id: '10000000-0000-0000-0000-000000000147',
        supporting_note: 'Anthropic co-announcement confirming the partnership and investment commitments.',
        source: SRC_ANTHROPIC_PARTNERSHIP,
      },
    ],
  },
];
