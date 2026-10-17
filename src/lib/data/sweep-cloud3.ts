import { Company, Deal, Relationship, Source } from '../types';
import { findCompany } from './dataset';

// LANE 3 (cloud-commitments, round 3): named-counterparty compute commitments and
// contract EXPANSIONS missing from the ledger after rounds 1-2. No new companies.
export const EXTRA_COMPANIES: Company[] = [];

const SRC_CRWV_META_21B_8K: Source = {
  id: '10000000-0000-0000-0000-000000000207',
  url: 'https://www.sec.gov/Archives/edgar/data/1769628/000176962826000154/crwv-20260331.htm',
  title: 'CoreWeave, Inc. Current Report on Form 8-K ($21 Billion Meta Order Form under Master Services Agreement)',
  publisher: 'U.S. Securities and Exchange Commission (EDGAR)',
  source_type: 'primary_filing',
  published_date: '2026-04-09',
  accessed_at: '2026-10-17T00:00:00Z',
  notes:
    'CoreWeave 8-K (accession 0001769628-26-000154, Items 7.01/8.01/9.01): on March 31, 2026 Meta entered a new order form under the December 10, 2023 MSA and "has initially committed to pay the Company approximately $21 billion, inclusive of (i) access to new computing capacity under the Order Form through December 20, 2032 and (ii) the exercise of an existing option to access additional computing capacity under a previous order form through April 10, 2032"; press release furnished as Exhibit 99.1.',
};

const SRC_REUTERS_CRWV_META_21B: Source = {
  id: '10000000-0000-0000-0000-000000000208',
  url: 'https://www.reuters.com/business/coreweave-signs-21-billion-ai-cloud-deal-with-meta-2026-04-09/',
  title: 'Meta, CoreWeave deepen AI cloud partnership with fresh $21 billion deal',
  publisher: 'Reuters',
  source_type: 'reputable_media',
  published_date: '2026-04-09',
  accessed_at: '2026-10-17T00:00:00Z',
  notes:
    'Reuters: fresh $21 billion deal extending through December 2032, "in addition to a similar $14.2 billion agreement signed in September"; grants Meta early access to NVIDIA Vera Rubin chips and makes Meta one of CoreWeave\u2019s largest customers.',
};

const SRC_CRWV_OPENAI_65B_8K: Source = {
  id: '10000000-0000-0000-0000-000000000209',
  url: 'https://www.sec.gov/Archives/edgar/data/1769628/000119312525216497/d17274d8k.htm',
  title: 'CoreWeave, Inc. Current Report on Form 8-K (OpenAI Order Form under Master Services Agreement dated May 8, 2025)',
  publisher: 'U.S. Securities and Exchange Commission (EDGAR)',
  source_type: 'primary_filing',
  published_date: '2025-09-25',
  accessed_at: '2026-10-17T00:00:00Z',
  notes:
    'CoreWeave 8-K (Item 1.01): on September 23, 2025 OpenAI entered a new order form under the MSA dated May 8, 2025 and "has committed to pay the Company up to approximately $6.5 billion through May 31, 2031"; the filing designates the MSA as a material definitive agreement.',
};

const SRC_CRWV_OPENAI_65B_PR: Source = {
  id: '10000000-0000-0000-0000-000000000210',
  url: 'https://investors.coreweave.com/news/news-details/2025/CoreWeave-Expands-Agreement-with-OpenAI-by-up-to-6-5B/default.aspx',
  title: 'CoreWeave Expands Agreement with OpenAI by up to $6.5B',
  publisher: 'CoreWeave Investor Relations',
  source_type: 'company_release',
  published_date: '2025-09-25',
  accessed_at: '2026-10-17T00:00:00Z',
  notes:
    'CoreWeave release: contract value "up to $6.5 billion"; recaps the March 2025 initial agreement of up to $11.9 billion and the May 2025 expansion of up to $4 billion, and states the new deal "brings the total contract value with OpenAI up to approximately $22.4 billion".',
};

const SRC_REUTERS_CRWV_OPENAI_65B: Source = {
  id: '10000000-0000-0000-0000-000000000211',
  url: 'https://www.reuters.com/business/coreweave-expands-openai-pact-with-new-65-billion-contract-2025-09-25/',
  title: 'Exclusive: CoreWeave expands OpenAI pact with new $6.5 billion contract',
  publisher: 'Reuters',
  source_type: 'reputable_media',
  published_date: '2025-09-25',
  accessed_at: '2026-10-17T00:00:00Z',
  notes:
    'Reuters exclusive: third major expansion of the partnership this year after the March $11.9B initial deal and the May $4B add-on, taking total agreements to up to $22.4 billion.',
};

const SRC_REUTERS_CRWV_OPENAI_4B: Source = {
  id: '10000000-0000-0000-0000-000000000212',
  url: 'https://www.reuters.com/business/coreweave-signs-new-4-bln-deal-with-openai-filing-shows-2025-05-15/',
  title: 'CoreWeave signs new $4 bln deal with OpenAI, filing shows',
  publisher: 'Reuters',
  source_type: 'reputable_media',
  published_date: '2025-05-15',
  accessed_at: '2026-10-17T00:00:00Z',
  notes:
    'Reuters: additional agreement under which OpenAI committed to pay CoreWeave up to $4 billion through April 2029, shown in a regulatory filing; CoreWeave had flagged a $4B expansion with an unnamed AI enterprise on its post-earnings call.',
};

const SRC_ANTHROPIC_GOOGLE_TPU: Source = {
  id: '10000000-0000-0000-0000-000000000213',
  url: 'https://www.anthropic.com/news/expanding-our-use-of-google-cloud-tpus-and-services',
  title: 'Expanding our use of Google Cloud TPUs and Services',
  publisher: 'Anthropic Newsroom',
  source_type: 'company_release',
  published_date: '2025-10-23',
  accessed_at: '2026-10-17T00:00:00Z',
  notes:
    'Anthropic announcement: plans to expand use of Google Cloud technologies "including up to one million TPUs"; "the expansion is worth tens of billions of dollars and is expected to bring well over a gigawatt of capacity online in 2026."',
};

const SRC_GOOGLE_ANTHROPIC_TPU: Source = {
  id: '10000000-0000-0000-0000-000000000214',
  url: 'https://www.googlecloudpresscorner.com/2025-10-23-Anthropic-to-Expand-Use-of-Google-Cloud-TPUs-and-Services',
  title: 'Anthropic to Expand Use of Google Cloud TPUs and Services',
  publisher: 'Google Cloud Press Corner',
  source_type: 'company_release',
  published_date: '2025-10-23',
  accessed_at: '2026-10-17T00:00:00Z',
  notes:
    'Google Cloud release: Anthropic "will train and serve Claude models with plans to access up to 1 million TPUs, worth tens of billions of dollars," the largest expansion of Anthropic\u2019s TPU usage to date, with well over a gigawatt of capacity coming online in 2026.',
};

const SRC_REUTERS_META_ORACLE_20B: Source = {
  id: '10000000-0000-0000-0000-000000000215',
  url: 'https://www.reuters.com/business/oracle-talks-with-meta-20-billion-ai-cloud-computing-deal-bloomberg-reports-2025-09-19/',
  title: 'Oracle eyes $20 billion AI cloud computing deal with Meta, source says',
  publisher: 'Reuters',
  source_type: 'reputable_media',
  published_date: '2025-09-19',
  accessed_at: '2026-10-17T00:00:00Z',
  notes:
    'Reuters (citing Bloomberg, which first reported): Oracle in talks with Meta for a multi-year cloud computing deal worth about $20 billion for training and deploying AI models, in addition to Meta\u2019s existing cloud providers; Meta declined to comment and Oracle did not immediately respond.',
};

const SRC_CNBC_ORACLE_CONFIRMS_META: Source = {
  id: '10000000-0000-0000-0000-000000000216',
  url: 'https://www.cnbc.com/2025/10/16/oracle-confirms-meta-cloud-deal-.html',
  title: 'Oracle stock rises as company confirms Meta cloud deal',
  publisher: 'CNBC',
  source_type: 'reputable_media',
  published_date: '2025-10-16',
  accessed_at: '2026-10-17T00:00:00Z',
  notes:
    'Oracle CEO Clay Magouyrk on the record: in 30 days of the current quarter Oracle contracted $65 billion of new cloud infrastructure commitments "across seven different contracts from four different customers. None of those customers are OpenAI" \u2014 and Meta is one of the four customers. CNBC notes Bloomberg reported the two were discussing a $20 billion deal in September.',
};

export const EXTRA_SOURCES: Source[] = [
  SRC_CRWV_META_21B_8K,
  SRC_REUTERS_CRWV_META_21B,
  SRC_CRWV_OPENAI_65B_8K,
  SRC_CRWV_OPENAI_65B_PR,
  SRC_REUTERS_CRWV_OPENAI_65B,
  SRC_REUTERS_CRWV_OPENAI_4B,
  SRC_ANTHROPIC_GOOGLE_TPU,
  SRC_GOOGLE_ANTHROPIC_TPU,
  SRC_REUTERS_META_ORACLE_20B,
  SRC_CNBC_ORACLE_CONFIRMS_META,
];

export const EXTRA_DEALS: Deal[] = [
  {
    id: '20000000-0000-0000-0000-000000000146',
    slug: 'coreweave-meta-21b-expansion-2026',
    title: 'Meta-CoreWeave $21B AI Cloud Capacity Expansion (2026)',
    summary:
      'Expansion of the Meta-CoreWeave relationship recorded separately from the September 2025 $14.2B order form (20000000-0000-0000-0000-000000000115): per CoreWeave\u2019s Form 8-K, Meta entered a new order form on March 31, 2026 under the same December 2023 master services agreement, initially committing approximately $21 billion for dedicated AI cloud capacity \u2014 inclusive of new capacity through December 20, 2032 and the exercise of an existing option for additional capacity through April 10, 2032. The dedicated capacity spans multiple locations and includes some of the first deployments of the NVIDIA Vera Rubin platform, scaling Meta\u2019s AI inference workloads.',
    deal_type: 'cloud_compute_contract',
    status: 'signed',
    announcement_date: '2026-04-09',
    effective_date: '2026-03-31',
    maturity_date: '2032-12-20',
    amount_value: 21000000000,
    amount_currency: 'USD',
    amount_basis: 'contract_value',
    amount_period:
      '~$21B initial commitment: new capacity through December 20, 2032 plus exercised option capacity through April 10, 2032',
    amount_disclosed: true,
    geography: 'United States',
    evidence_level: 'confirmed_primary',
    confidence_note:
      'CoreWeave 8-K filed April 9, 2026 (accession 0001769628-26-000154) states Meta "has initially committed to pay the Company approximately $21 billion," corroborated by CoreWeave\u2019s announcement and Reuters, which frame the deal as in addition to the September 2025 $14.2B order form. Double-count check against deal 20000000-0000-0000-0000-000000000115: the $21B covers the new order form plus the exercise of an expansion option (which the Sept 2025 8-K described as the option to materially expand through 2032) and does not re-count the $14.2B base commitment, so the two records track distinct commitments under the same MSA as anticipated in that deal\u2019s confidence_note.',
    is_published: true,
    published_at: '2026-04-09T16:00:00Z',
    last_reviewed_at: '2026-10-17T00:00:00Z',
    parties: [
      {
        id: 'p-cwm21b-1',
        deal_id: '20000000-0000-0000-0000-000000000146',
        company_id: '00000000-0000-0000-0000-000000000017',
        role: 'customer',
        direction_note: 'Initially committed ~$21B for dedicated AI cloud capacity through December 2032, scaling inference workloads',
        company: findCompany('meta'),
      },
      {
        id: 'p-cwm21b-2',
        deal_id: '20000000-0000-0000-0000-000000000146',
        company_id: '00000000-0000-0000-0000-000000000002',
        role: 'cloud_provider',
        direction_note: 'Provides dedicated multi-site AI cloud capacity including initial NVIDIA Vera Rubin deployments under the 2023 MSA',
        company: findCompany('coreweave'),
      },
    ],
    sources: [
      {
        deal_id: '20000000-0000-0000-0000-000000000146',
        source_id: '10000000-0000-0000-0000-000000000207',
        supporting_note: 'CoreWeave 8-K disclosing the March 31, 2026 order form and the ~$21B initial commitment through December 20, 2032.',
        is_primary_support: true,
        source: SRC_CRWV_META_21B_8K,
      },
      {
        deal_id: '20000000-0000-0000-0000-000000000146',
        source_id: '10000000-0000-0000-0000-000000000208',
        supporting_note: 'Reuters confirmation that the $21B deal is incremental to the September 2025 $14.2B agreement.',
        is_primary_support: false,
        source: SRC_REUTERS_CRWV_META_21B,
      },
    ],
  },
  {
    id: '20000000-0000-0000-0000-000000000147',
    slug: 'coreweave-openai-6-5b-expansion-2025',
    title: 'OpenAI-CoreWeave $6.5B Compute Expansion (Total ~$22.4B)',
    summary:
      'Expansion of the OpenAI-CoreWeave base contract recorded as 20000000-0000-0000-0000-000000000061 ($11.9B, March 2025): per CoreWeave\u2019s Form 8-K, OpenAI entered a new order form on September 23, 2025 under the May 8, 2025 master services agreement, committing to pay up to approximately $6.5 billion through May 31, 2031 for cloud computing capacity to train its most advanced next-generation models. Together with the March 2025 base contract and a May 2025 expansion of up to $4 billion, total OpenAI-CoreWeave contract value reached approximately $22.4 billion.',
    deal_type: 'cloud_compute_contract',
    status: 'signed',
    announcement_date: '2025-09-25',
    effective_date: '2025-09-23',
    maturity_date: '2031-05-31',
    amount_value: 6500000000,
    amount_currency: 'USD',
    amount_basis: 'contract_value',
    amount_period:
      'Up to ~$6.5B through May 31, 2031; cumulative OpenAI-CoreWeave agreements reach ~$22.4B including the $11.9B base and May 2025 $4B add-on',
    amount_disclosed: true,
    geography: 'United States',
    evidence_level: 'confirmed_primary',
    confidence_note:
      'CoreWeave 8-K (accession 0001193125-25-216497) states OpenAI "has committed to pay the Company up to approximately $6.5 billion through May 31, 2031" under the September 23, 2025 order form; CoreWeave\u2019s release and Reuters both state the total relationship value reached ~$22.4 billion. Per lane instruction this is the single expansion record for the OpenAI-CoreWeave contract: the separately verified May 2025 add-on (up to $4B through April 2029, Reuters May 15, 2025, and recapped in CoreWeave\u2019s own release) is noted here rather than double-recorded as its own deal, alongside the $11.9B base (20000000-0000-0000-0000-000000000061).',
    is_published: true,
    published_at: '2025-09-25T16:00:00Z',
    last_reviewed_at: '2026-10-17T00:00:00Z',
    parties: [
      {
        id: 'p-cwo65b-1',
        deal_id: '20000000-0000-0000-0000-000000000147',
        company_id: '00000000-0000-0000-0000-000000000004',
        role: 'customer',
        direction_note: 'Committed up to ~$6.5B through May 31, 2031 for capacity to train next-generation models',
        company: findCompany('openai'),
      },
      {
        id: 'p-cwo65b-2',
        deal_id: '20000000-0000-0000-0000-000000000147',
        company_id: '00000000-0000-0000-0000-000000000002',
        role: 'cloud_provider',
        direction_note: 'Supplies reserved cloud computing capacity under the May 2025 MSA, diversifying CoreWeave revenue beyond Microsoft',
        company: findCompany('coreweave'),
      },
    ],
    sources: [
      {
        deal_id: '20000000-0000-0000-0000-000000000147',
        source_id: '10000000-0000-0000-0000-000000000209',
        supporting_note: 'CoreWeave 8-K disclosing the September 23, 2025 order form and the up-to-$6.5B commitment through May 31, 2031.',
        is_primary_support: true,
        source: SRC_CRWV_OPENAI_65B_8K,
      },
      {
        deal_id: '20000000-0000-0000-0000-000000000147',
        source_id: '10000000-0000-0000-0000-000000000210',
        supporting_note: 'CoreWeave release stating the $6.5B contract value, the May 2025 $4B expansion, and the ~$22.4B cumulative total.',
        is_primary_support: true,
        source: SRC_CRWV_OPENAI_65B_PR,
      },
      {
        deal_id: '20000000-0000-0000-0000-000000000147',
        source_id: '10000000-0000-0000-0000-000000000211',
        supporting_note: 'Reuters exclusive confirming the $6.5B expansion and ~$22.4B total.',
        is_primary_support: false,
        source: SRC_REUTERS_CRWV_OPENAI_65B,
      },
      {
        deal_id: '20000000-0000-0000-0000-000000000147',
        source_id: '10000000-0000-0000-0000-000000000212',
        supporting_note: 'Reuters report on the May 2025 up-to-$4B add-on through April 2029, referenced for expansion context.',
        is_primary_support: false,
        source: SRC_REUTERS_CRWV_OPENAI_4B,
      },
    ],
  },
  {
    id: '20000000-0000-0000-0000-000000000148',
    slug: 'anthropic-google-tpu-expansion-2025',
    title: 'Anthropic-Google Cloud TPU Expansion (Up to 1M TPUs)',
    summary:
      'Jointly announced October 23, 2025: Anthropic will expand its use of Google Cloud with access to up to one million TPUs plus additional Google Cloud services to train and serve the next generations of Claude \u2014 the largest expansion of Anthropic\u2019s TPU usage to date. Both companies described the expansion as worth tens of billions of dollars and expected to bring well over a gigawatt of capacity online in 2026. No specific dollar figure was disclosed, so no cash value is recorded.',
    deal_type: 'cloud_compute_contract',
    status: 'announced',
    announcement_date: '2025-10-23',
    effective_date: null,
    maturity_date: null,
    amount_value: null,
    amount_currency: 'USD',
    amount_basis: 'commitment',
    amount_period:
      'Up to 1M TPUs plus additional Google Cloud services; well over 1 GW of capacity online in 2026; value described only as "tens of billions of dollars"',
    amount_disclosed: false,
    geography: 'United States',
    evidence_level: 'confirmed_primary',
    confidence_note:
      'Both parties published the announcement on Oct 23, 2025: Anthropic states the expansion "is worth tens of billions of dollars" with up to one million TPUs, and Google Cloud\u2019s release states Anthropic "will train and serve Claude models with plans to access up to 1 million TPUs, worth tens of billions of dollars." Reuters, Bloomberg, CNBC and AP corroborated. The exact dollar value is officially undisclosed by both parties, so amount_value stays null with the "tens of billions" characterization recorded; status kept as announced pending evidence of execution.',
    is_published: true,
    published_at: '2025-10-23T16:00:00Z',
    last_reviewed_at: '2026-10-17T00:00:00Z',
    parties: [
      {
        id: 'p-agtpu-1',
        deal_id: '20000000-0000-0000-0000-000000000148',
        company_id: '00000000-0000-0000-0000-000000000006',
        role: 'customer',
        direction_note: 'Expands Google Cloud usage to up to 1M TPUs and well over 1 GW online in 2026 to train and serve Claude',
        company: findCompany('anthropic'),
      },
      {
        id: 'p-agtpu-2',
        deal_id: '20000000-0000-0000-0000-000000000148',
        company_id: '00000000-0000-0000-0000-000000000016',
        role: 'cloud_provider',
        direction_note: 'Supplies TPU capacity and Google Cloud services described as worth tens of billions of dollars',
        company: findCompany('alphabet'),
      },
    ],
    sources: [
      {
        deal_id: '20000000-0000-0000-0000-000000000148',
        source_id: '10000000-0000-0000-0000-000000000213',
        supporting_note: 'Anthropic announcement of up to 1M TPUs and the "tens of billions of dollars" expansion.',
        is_primary_support: true,
        source: SRC_ANTHROPIC_GOOGLE_TPU,
      },
      {
        deal_id: '20000000-0000-0000-0000-000000000148',
        source_id: '10000000-0000-0000-0000-000000000214',
        supporting_note: 'Google Cloud release confirming the up-to-1M-TPU expansion and 2026 capacity timeline.',
        is_primary_support: true,
        source: SRC_GOOGLE_ANTHROPIC_TPU,
      },
    ],
  },
  {
    id: '20000000-0000-0000-0000-000000000149',
    slug: 'meta-oracle-20b-cloud-contract-2025',
    title: 'Meta-Oracle ~$20B Multi-Year AI Cloud Contract',
    summary:
      'Oracle and Meta struck a multi-year cloud computing deal worth about $20 billion under which Oracle provides Meta computing capacity for training and deploying AI models, in addition to Meta\u2019s existing cloud providers. Bloomberg first reported the talks on September 19, 2025, and Oracle confirmed the deal\u2019s existence on October 16, 2025, when CEO Clay Magouyrk said Meta was one of four customers behind $65 billion of new OCI commitments contracted in 30 days. The commitment contributed to Oracle\u2019s RPO surge, including Q2 FY26 growth Oracle attributed to "new commitments from Meta, NVIDIA, and others."',
    deal_type: 'cloud_compute_contract',
    status: 'signed',
    announcement_date: '2025-09-19',
    effective_date: null,
    maturity_date: null,
    amount_value: 20000000000,
    amount_currency: 'USD',
    amount_basis: 'contract_value',
    amount_period: 'Multi-year OCI commitment reported at about $20B; term length not disclosed',
    amount_disclosed: true,
    geography: 'United States',
    evidence_level: 'reported_secondary',
    confidence_note:
      'Deal existence is company-confirmed: Oracle\u2019s CEO said on the record (CNBC, Oct 16, 2025) that Meta is one of four customers in $65B of new cloud commitments across seven contracts in 30 days, explicitly noting "none of those customers are OpenAI." However, the ~$20B value and multi-year term were never officially confirmed by either party \u2014 they rest on Bloomberg\u2019s first report and Reuters\u2019 corroboration of Sept 19, 2025 citing people familiar ("total deal amount may rise and the terms could still change"), so evidence stays reported_secondary and the value is recorded as reported. No dedicated SEC filing discloses the Meta-Oracle contract value; Meta referenced third-party cloud spend but not Oracle by name on its Q3 2025 earnings call.',
    is_published: true,
    published_at: '2025-09-19T16:00:00Z',
    last_reviewed_at: '2026-10-17T00:00:00Z',
    parties: [
      {
        id: 'p-mo20b-1',
        deal_id: '20000000-0000-0000-0000-000000000149',
        company_id: '00000000-0000-0000-0000-000000000017',
        role: 'customer',
        direction_note: 'Buys reported ~$20B of multi-year OCI capacity for AI training and deployment beyond its existing cloud providers',
        company: findCompany('meta'),
      },
      {
        id: 'p-mo20b-2',
        deal_id: '20000000-0000-0000-0000-000000000149',
        company_id: '00000000-0000-0000-0000-000000000007',
        role: 'cloud_provider',
        direction_note: 'Confirmed Meta as one of four customers in $65B of new OCI commitments; supplies AI training/deployment capacity',
        company: findCompany('oracle'),
      },
    ],
    sources: [
      {
        deal_id: '20000000-0000-0000-0000-000000000149',
        source_id: '10000000-0000-0000-0000-000000000216',
        supporting_note: 'CNBC report of Oracle\u2019s on-record confirmation that Meta is one of four customers in $65B of new cloud commitments.',
        is_primary_support: true,
        source: SRC_CNBC_ORACLE_CONFIRMS_META,
      },
      {
        deal_id: '20000000-0000-0000-0000-000000000149',
        source_id: '10000000-0000-0000-0000-000000000215',
        supporting_note: 'Reuters/Bloomberg reporting of the ~$20B multi-year deal value per people familiar.',
        is_primary_support: false,
        source: SRC_REUTERS_META_ORACLE_20B,
      },
    ],
  },
];

export const EXTRA_RELATIONSHIPS: Relationship[] = [
  {
    id: '30000000-0000-0000-0000-000000000107',
    from_company_id: '00000000-0000-0000-0000-000000000007',
    to_company_id: '00000000-0000-0000-0000-000000000017',
    relationship_type: 'cloud_customer',
    start_date: '2025-09-19',
    end_date: null,
    description:
      'Multi-year OCI commitment reported at ~$20B for Meta AI training and deployment; Oracle\u2019s CEO confirmed Meta among four customers in $65B of new cloud commitments (Oct 16, 2025), and Oracle attributed Q2 FY26 RPO growth to commitments including Meta.',
    evidence_level: 'reported_secondary',
    is_published: true,
    from_company: findCompany('oracle'),
    to_company: findCompany('meta'),
    sources: [
      {
        relationship_id: '30000000-0000-0000-0000-000000000107',
        source_id: '10000000-0000-0000-0000-000000000216',
        supporting_note: 'Oracle\u2019s on-record confirmation of the Meta cloud deal and the $65B/four-customer context.',
        source: SRC_CNBC_ORACLE_CONFIRMS_META,
      },
      {
        relationship_id: '30000000-0000-0000-0000-000000000107',
        source_id: '10000000-0000-0000-0000-000000000215',
        supporting_note: 'Reuters/Bloomberg reporting of the ~$20B multi-year commitment value.',
        source: SRC_REUTERS_META_ORACLE_20B,
      },
    ],
  },
  {
    id: '30000000-0000-0000-0000-000000000108',
    from_company_id: '00000000-0000-0000-0000-000000000016',
    to_company_id: '00000000-0000-0000-0000-000000000006',
    relationship_type: 'cloud_customer',
    start_date: '2025-10-23',
    end_date: null,
    description:
      'Anthropic expanding use of Google Cloud with access to up to one million TPUs plus additional services, worth tens of billions of dollars, bringing well over a gigawatt of capacity online in 2026 to train and serve Claude.',
    evidence_level: 'confirmed_primary',
    is_published: true,
    from_company: findCompany('alphabet'),
    to_company: findCompany('anthropic'),
    sources: [
      {
        relationship_id: '30000000-0000-0000-0000-000000000108',
        source_id: '10000000-0000-0000-0000-000000000213',
        supporting_note: 'Anthropic announcement of the up-to-1M-TPU expansion.',
        source: SRC_ANTHROPIC_GOOGLE_TPU,
      },
      {
        relationship_id: '30000000-0000-0000-0000-000000000108',
        source_id: '10000000-0000-0000-0000-000000000214',
        supporting_note: 'Google Cloud release confirming the TPU expansion.',
        source: SRC_GOOGLE_ANTHROPIC_TPU,
      },
    ],
  },
];
