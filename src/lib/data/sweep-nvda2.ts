import { Company, Deal, Relationship, Source } from '../types';
import { findCompany } from './dataset';

// LANE D (NVIDIA/AMD smaller acquisitions and investments - round 2).
// Re-verified 2026-10-17 against primary/secondary sources: NVIDIA's smaller
// completed M&A (Run:ai, Gretel, Lepton AI), its license-plus-hire deal for
// Enfabrica, and AMD's Silo AI buyout. Corrections made during verification
// vs. the assignment brief and the first draft: (1) the EU cleared NVIDIA-Run:ai
// UNCONDITIONALLY on 2024-12-20 (Phase 1, case M.11766 - not M.11537 - after
// Italy's Article 22 referral: AGCM call-in request 2024-09-30, accepted by the
// Commission 2024-10-31, notified 2024-11-15); no remedies were imposed;
// (2) the AMD-Silo AI $665M acquisition is 2024, not 2025 (announced 2024-07-10,
// completed 2024-08-09 per AMD's 10-Q); (3) the hired Enfabrica executive is CEO
// Rochan Sankar; (4) Gretel is San Diego-based, not San Francisco (TechCrunch);
// (5) The Information's Lepton close briefing is dated April 9, 2025
// (per TechNode/Seedtable), not April 7, and its Lepton corroboration source is
// TechNode (Forbes was unverifiable by direct fetch); (6) WIRED/TechCrunch
// describe Gretel as "has acquired" as of 2025-03-19 - no explicit completion
// date, so wording is hedged. A sixth candidate, NVIDIA's real $2B investment
// in Synopsys stock (Synopsys newsroom, 2025-12-01, $414.79/share), was DROPPED:
// Synopsys has no company entry in this dataset and none of this lane's
// reserved company slots covers it. Reported-but-officially-undisclosed figures
// stay out of amount_value per this lane's ledger policy.

const RUN_AI: Company = {
  id: '00000000-0000-0000-0000-000000000094',
  name: 'Run:ai',
  slug: 'run-ai',
  aliases: ['Run:ai Labs Ltd.', 'RunAI', 'run.ai'],
  description:
    'Tel Aviv-based provider of Kubernetes-based GPU orchestration and AI workload management software for scheduling and optimizing AI compute across on-prem, cloud and hybrid clusters; founded by Omri Geller, Ronen Dar and Meir Feder, it raised $118M (Insight Partners, Tiger Global, S Capital, TLV Partners) before NVIDIA announced its acquisition April 24, 2024 and completed it December 30, 2024; Run:ai planned to open-source its software.',
  company_type: 'other',
  headquarters_country: 'Israel',
  headquarters_city: 'Tel Aviv',
  website_url: 'https://www.run.ai',
  ticker: null,
  cik: null,
  is_public: false,
};

const GRETEL: Company = {
  id: '00000000-0000-0000-0000-000000000095',
  name: 'Gretel',
  slug: 'gretel',
  aliases: ['Gretel.ai', 'Gretel Labs Inc.', 'Gretel Technologies'],
  description:
    'San Diego-based synthetic-data platform founded in 2019 (CEO Ali Golshan with Alex Watson, Laszlo Bock, John Myers) that generates privacy-preserving AI training data across tabular, time-series and text modalities; raised ~$67M (Greylock, Anthos Capital, Moonshots Capital); reportedly acquired by NVIDIA in a nine-figure deal that had closed by the March 19, 2025 report, with its ~80 employees folded into NVIDIA.',
  company_type: 'ai_lab',
  headquarters_country: 'United States',
  headquarters_city: 'San Diego, CA',
  website_url: 'https://www.gretel.ai',
  ticker: null,
  cik: null,
  is_public: false,
};

const SILO_AI: Company = {
  id: '00000000-0000-0000-0000-000000000096',
  name: 'Silo AI',
  slug: 'silo-ai',
  aliases: ['Silo AI Oy', 'SiloAI'],
  description:
    "Europe's largest private AI lab (Silo AI Oy), headquartered in Helsinki with operations across Europe and North America; builds end-to-end AI solutions, the SiloGen model platform and open-source multilingual LLMs (Poro, Viking) for customers including Allianz, Philips, Rolls-Royce and Unilever; became an AMD subsidiary in an all-cash ~$665M acquisition announced July 10, 2024 and completed August 9, 2024, with CEO Peter Sarlin continuing under AMD's Artificial Intelligence Group.",
  company_type: 'ai_lab',
  headquarters_country: 'Finland',
  headquarters_city: 'Helsinki',
  website_url: 'https://silo.ai',
  ticker: null,
  cik: null,
  is_public: false,
};

const LEPTON_AI: Company = {
  id: '00000000-0000-0000-0000-000000000097',
  name: 'Lepton AI',
  slug: 'lepton-ai',
  aliases: ['Lepton AI Inc.', 'lepton.ai', 'Lepton'],
  description:
    'AI cloud startup founded in 2023 in Cupertino, CA by Yangqing Jia (creator of the Caffe deep-learning framework, ex-Alibaba VP of technology) and Junjie Bai, both ex-Meta AI researchers; leased NVIDIA GPU servers from cloud providers and provided cloud software for building, deploying and scaling AI applications with a ~20-person team and an $11M seed from CRV and Fusion Fund; reportedly acquired by NVIDIA (The Information, April 9, 2025: several hundred million dollars) with both co-founders joining NVIDIA.',
  company_type: 'other',
  headquarters_country: 'United States',
  headquarters_city: 'Cupertino, CA',
  website_url: 'https://www.lepton.ai',
  ticker: null,
  cik: null,
  is_public: false,
};

const ENFABRICA: Company = {
  id: '00000000-0000-0000-0000-000000000098',
  name: 'Enfabrica',
  slug: 'enfabrica',
  aliases: ['Enfabrica Corporation', 'Enfabrica Corp.'],
  description:
    'Silicon Valley networking-silicon startup founded in 2019 by Broadcom and Alphabet veterans and led by CEO Rochan Sankar; builds fabric chips and software that tie roughly 100,000 AI accelerators into a single computer while reining in memory costs; raised ~$260M including the NVIDIA-backed $125M Series B (2023); in September 2025 NVIDIA paid a reported >$900M in cash and stock to license its technology and hire Sankar plus other staff.',
  company_type: 'chipmaker',
  headquarters_country: 'United States',
  headquarters_city: null,
  website_url: 'https://www.enfabrica.net',
  ticker: null,
  cik: null,
  is_public: false,
};

export const EXTRA_COMPANIES: Company[] = [RUN_AI, GRETEL, SILO_AI, LEPTON_AI, ENFABRICA];

const SRC_RUNAI_NVDA_BLOG: Source = {
  id: '10000000-0000-0000-0000-000000000179',
  url: 'https://blogs.nvidia.com/blog/runai',
  title: 'NVIDIA to Acquire GPU Orchestration Software Provider Run:ai',
  publisher: 'NVIDIA Blog',
  source_type: 'company_release',
  published_date: '2024-04-24',
  accessed_at: '2026-10-17T00:00:00Z',
  notes:
    'Official NVIDIA blog post (April 24, 2024, by DGX Cloud VP Alexis Bjorlin) announcing the definitive agreement to acquire Run:ai; terms not disclosed; Run:ai products to remain available and be integrated with DGX Cloud.',
};

const SRC_RUNAI_EU: Source = {
  id: '10000000-0000-0000-0000-000000000180',
  url: 'https://ec.europa.eu/commission/presscorner/detail/en/ip_24_6548',
  title: 'Commission approves acquisition of Run:ai by NVIDIA',
  publisher: 'European Commission',
  source_type: 'regulator_document',
  published_date: '2024-12-20',
  accessed_at: '2026-10-17T00:00:00Z',
  notes:
    'EU Merger Regulation Phase 1 clearance (case M.11766) granted UNCONDITIONALLY on December 20, 2024; the deal fell below EUMR turnover thresholds (Run:ai\u2019s revenues are negligible), was referred to the Commission under Article 22(1) via Italy\u2019s AGCM call-in (referral request September 30, 2024, accepted by the Commission October 31, 2024) and was notified to the Commission on November 15, 2024; the Commission found no competition concerns in the EEA or Italy and imposed no remedies.',
};

const SRC_RUNAI_REUTERS_CLOSE: Source = {
  id: '10000000-0000-0000-0000-000000000181',
  url: 'https://www.reuters.com/markets/deals/nvidia-closes-700-mln-runai-acquisition-after-regulatory-hurdles-2024-12-30/',
  title: 'Nvidia closes $700 mln Run:ai acquisition after regulatory hurdles',
  publisher: 'Reuters',
  source_type: 'reputable_media',
  published_date: '2024-12-30',
  accessed_at: '2026-10-17T00:00:00Z',
  notes:
    'Reports NVIDIA completed its acquisition of Israeli AI firm Run:ai on December 30, 2024 after EU antitrust review (unconditional clearance earlier in December) and a reported U.S. DOJ probe (separate EC and DOJ investigations per TechCrunch; Politico reported the DOJ probe in August 2024); headline cites the ~$700M price and Run:ai\u2019s blog post stating the software will be open-sourced.',
};

const SRC_GRETEL_WIRED: Source = {
  id: '10000000-0000-0000-0000-000000000182',
  url: 'https://www.wired.com/story/nvidia-gretel-acquisition-synthetic-training-data',
  title: 'Nvidia Bets Big on Synthetic Data',
  publisher: 'WIRED',
  source_type: 'reputable_media',
  published_date: '2025-03-19',
  accessed_at: '2026-10-17T00:00:00Z',
  notes:
    'Reports (two people with direct knowledge) that NVIDIA acquired synthetic-data startup Gretel for a nine-figure price exceeding Gretel\u2019s most recent $320M valuation; ~80 employees to be folded into NVIDIA; NVIDIA and Gretel spokespeople declined to comment; terms not officially disclosed. Corroborated the same day by TechCrunch (techcrunch.com/2025/03/19/nvidia-reportedly-acquires-synthetic-data-startup-gretel - adding the San Diego HQ, the four founders and the >$67M raise), and referenced within days by DataCenterDynamics and SiliconANGLE (March 27, 2025) as a completed deal above the $320M valuation.',
};

const SRC_LEPTON_INFO: Source = {
  id: '10000000-0000-0000-0000-000000000183',
  url: 'https://www.theinformation.com/briefings/nvidia-closes-acquisition-gpu-cloud-startup-lepton',
  title: 'Nvidia Closes Acquisition of GPU Cloud Startup Lepton',
  publisher: 'The Information',
  source_type: 'reputable_media',
  published_date: '2025-04-09',
  accessed_at: '2026-10-17T00:00:00Z',
  notes:
    'The Information briefing reporting that NVIDIA closed its acquisition of GPU cloud startup Lepton AI (earlier reporting, March 27, 2025: advanced talks valuing the deal at several hundred million dollars); neither company officially confirmed; co-founders Yangqing Jia and Junjie Bai joined NVIDIA.',
};

const SRC_LEPTON_TECHNODE: Source = {
  id: '10000000-0000-0000-0000-000000000184',
  url: 'https://technode.com/2025/04/09/nvidia-acquires-chinese-gpu-cloud-startup-lepton-ai-report/',
  title: 'NVIDIA acquires Chinese GPU cloud startup Lepton AI: report',
  publisher: 'TechNode',
  source_type: 'reputable_media',
  published_date: '2025-04-09',
  accessed_at: '2026-10-17T00:00:00Z',
  notes:
    'TechNode pick-up of The Information (April 9, 2025): NVIDIA acquired GPU cloud startup Lepton AI in a deal valued at several hundred million dollars; the roughly 20-person startup rented out NVIDIA GPU servers and built cloud management software; co-founders Yangqing Jia and Junjie Bai both joined NVIDIA.',
};

const SRC_ENFABRICA_CNBC: Source = {
  id: '10000000-0000-0000-0000-000000000185',
  url: 'https://www.cnbc.com/2025/09/18/nvidia-spent-over-900-million-on-enfabrica-ceo-ai-startup-technology.html',
  title: 'Nvidia just spent over $900 million to hire Enfabrica CEO, license AI startup\u2019s technology',
  publisher: 'CNBC',
  source_type: 'reputable_media',
  published_date: '2025-09-18',
  accessed_at: '2026-10-17T00:00:00Z',
  notes:
    'CNBC (two people familiar): NVIDIA paid more than $900 million in cash and stock to hire Enfabrica CEO Rochan Sankar and other employees and to license the startup\u2019s networking technology; deal closed the week before the September 18, 2025 report; NVIDIA declined to comment; NVIDIA was also an investor in Enfabrica\u2019s $125M Series B (2023).',
};

const SRC_ENFABRICA_REUTERS: Source = {
  id: '10000000-0000-0000-0000-000000000186',
  url: 'https://www.reuters.com/technology/nvidia-spent-over-900-million-hire-enfabrica-ceo-license-technology-cnbc-reports-2025-09-18/',
  title: 'Nvidia spent over $900 million to hire Enfabrica CEO, license technology, CNBC reports',
  publisher: 'Reuters',
  source_type: 'reputable_media',
  published_date: '2025-09-18',
  accessed_at: '2026-10-17T00:00:00Z',
  notes:
    'Reuters pick-up corroborating CNBC\u2019s >$900M cash-and-stock license-plus-hire report: Enfabrica technologies can string together about 100,000 AI chips; founded by Broadcom and Alphabet veterans; ~$260M raised in venture capital; NVIDIA declined to comment.',
};

const SRC_SILO_AMD_ANNOUNCE: Source = {
  id: '10000000-0000-0000-0000-000000000187',
  url: 'https://ir.amd.com/news-events/press-releases/detail/1206/amd-to-acquire-silo-ai-to-expand-enterprise-ai-solutions-globally',
  title: 'AMD to Acquire Silo AI to Expand Enterprise AI Solutions Globally',
  publisher: 'AMD (Investor Relations)',
  source_type: 'company_release',
  published_date: '2024-07-10',
  accessed_at: '2026-10-17T00:00:00Z',
  notes:
    'Official AMD release (July 10, 2024): definitive agreement to acquire Silo AI, the largest private AI lab in Europe, in an all-cash transaction valued at approximately $665 million; CEO Peter Sarlin to continue leading the team under AMD\u2019s AI Group (Vamsi Boppana); closing expected in H2 2024.',
};

const SRC_SILO_SEC: Source = {
  id: '10000000-0000-0000-0000-000000000188',
  url: 'https://www.sec.gov/Archives/edgar/data/2488/000000248824000163/amd-20240928.htm',
  title: 'AMD Form 10-Q (quarter ended September 28, 2024) - Note 5 Business Combinations: Acquisition of Silo AI',
  publisher: 'Advanced Micro Devices, Inc. / U.S. SEC EDGAR',
  source_type: 'primary_filing',
  published_date: null,
  accessed_at: '2026-10-17T00:00:00Z',
  notes:
    'AMD 10-Q disclosure: the acquisition of Silo AI Oy, an AI lab based in Finland, was completed on August 9, 2024 in an all-cash transaction of $665 million; net of closing adjustments, transaction costs and deferred cash compensation, purchase consideration of $553 million was allocated (including $577M goodwill).',
};

export const EXTRA_SOURCES: Source[] = [
  SRC_RUNAI_NVDA_BLOG,
  SRC_RUNAI_EU,
  SRC_RUNAI_REUTERS_CLOSE,
  SRC_GRETEL_WIRED,
  SRC_LEPTON_INFO,
  SRC_LEPTON_TECHNODE,
  SRC_ENFABRICA_CNBC,
  SRC_ENFABRICA_REUTERS,
  SRC_SILO_AMD_ANNOUNCE,
  SRC_SILO_SEC,
];

export const EXTRA_DEALS: Deal[] = [
  {
    id: '20000000-0000-0000-0000-000000000128',
    slug: 'nvidia-acquires-run-ai-2024',
    title: 'NVIDIA Acquires GPU Orchestration Startup Run:ai (Reported ~$700M)',
    summary:
      'NVIDIA announced a definitive agreement to acquire Run:ai, the Tel Aviv-based maker of Kubernetes-based GPU orchestration and AI workload management software, on April 24, 2024. After the deal was referred to the European Commission under Article 22 on Italy\u2019s request, the Commission cleared it unconditionally on December 20, 2024 (case M.11766), and NVIDIA completed the acquisition on December 30, 2024. Terms were not officially disclosed; sources put the price at ~$700 million. Run:ai\u2019s software continues under NVIDIA and was slated to be open-sourced.',
    deal_type: 'acquisition',
    status: 'closed',
    announcement_date: '2024-04-24',
    effective_date: '2024-12-30',
    maturity_date: null,
    amount_value: null,
    amount_currency: 'USD',
    amount_basis: null,
    amount_period: 'Reported ~$700M purchase price (TechCrunch/CTech at announcement; Reuters headline at close); officially undisclosed',
    amount_disclosed: false,
    geography: 'Israel',
    evidence_level: 'confirmed_primary',
    confidence_note:
      'Existence and closing confirmed by primary sources: NVIDIA\u2019s own blog announcement of the definitive agreement (April 24, 2024), the European Commission\u2019s December 20, 2024 unconditional Phase 1 clearance (case M.11766, after Italy\u2019s Article 22 referral - NO remedies were imposed, contrary to some secondary summaries), and Reuters reporting completion on December 30, 2024 per the startup\u2019s announcement. The ~$700M figure was never officially disclosed: TechCrunch (two sources) and CTech reported it at announcement and Reuters\u2019 closing headline carried it, so per ledger policy the amount stays null with the reported figure in note fields.',
    is_published: true,
    published_at: '2024-04-24T12:00:00Z',
    last_reviewed_at: '2026-10-17T00:00:00Z',
    parties: [
      {
        id: 'p-nvda2-run-1',
        deal_id: '20000000-0000-0000-0000-000000000128',
        company_id: '00000000-0000-0000-0000-000000000001',
        role: 'investor',
        direction_note: 'Acquirer; completed the purchase December 30, 2024 after EU clearance',
        company: findCompany('00000000-0000-0000-0000-000000000001'),
      },
      {
        id: 'p-nvda2-run-2',
        deal_id: '20000000-0000-0000-0000-000000000128',
        company_id: '00000000-0000-0000-0000-000000000094',
        role: 'investee',
        direction_note: 'Acquired AI workload orchestration software provider; joining NVIDIA with plans to open-source its software',
        company: RUN_AI,
      },
    ],
    sources: [
      {
        deal_id: '20000000-0000-0000-0000-000000000128',
        source_id: '10000000-0000-0000-0000-000000000179',
        supporting_note: 'Official NVIDIA announcement of the definitive agreement to acquire Run:ai (April 24, 2024).',
        is_primary_support: true,
        source: SRC_RUNAI_NVDA_BLOG,
      },
      {
        deal_id: '20000000-0000-0000-0000-000000000128',
        source_id: '10000000-0000-0000-0000-000000000180',
        supporting_note: 'European Commission unconditional Phase 1 clearance under the EU Merger Regulation (December 20, 2024).',
        is_primary_support: true,
        source: SRC_RUNAI_EU,
      },
      {
        deal_id: '20000000-0000-0000-0000-000000000128',
        source_id: '10000000-0000-0000-0000-000000000181',
        supporting_note: 'Reuters on the completed acquisition (December 30, 2024) and the ~$700M reported price.',
        is_primary_support: true,
        source: SRC_RUNAI_REUTERS_CLOSE,
      },
    ],
  },
  {
    id: '20000000-0000-0000-0000-000000000129',
    slug: 'nvidia-acquires-gretel-2025',
    title: 'NVIDIA Acquires Synthetic Data Startup Gretel in Reported Nine-Figure Deal',
    summary:
      'NVIDIA acquired Gretel, the San Diego-based synthetic-data platform that generates privacy-preserving AI training data, in a deal that had closed by the time of WIRED\u2019s March 19, 2025 report. The price was a nine-figure sum exceeding Gretel\u2019s most recent $320 million valuation, per two people with direct knowledge; NVIDIA never disclosed terms. Gretel\u2019s roughly 80 employees were folded into NVIDIA, where the technology feeds NVIDIA\u2019s generative-AI services and synthetic-data initiatives alongside Omniverse Replicator and Nemotron data-generation models.',
    deal_type: 'acquisition',
    status: 'closed',
    announcement_date: '2025-03-19',
    effective_date: '2025-03-19',
    maturity_date: null,
    amount_value: null,
    amount_currency: 'USD',
    amount_basis: null,
    amount_period: 'Reported nine figures, above Gretel\u2019s $320M prior valuation (WIRED, two people with direct knowledge); officially undisclosed',
    amount_disclosed: false,
    geography: 'United States',
    evidence_level: 'reported_secondary',
    confidence_note:
      'Acquisition reported March 19, 2025 by WIRED (two people with direct knowledge of the deal; NVIDIA and Gretel spokespeople declined to comment) and corroborated same-day by TechCrunch, with DataCenterDynamics and SiliconANGLE subsequently (March 27, 2025) describing it as a completed deal valued above $320M. WIRED and TechCrunch both describe NVIDIA as having acquired Gretel as of March 19, 2025, so the deal had closed by the report date, though no completion date or terms were officially confirmed. Recorded as reported_secondary with amount null; the reported figure (nine figures, above the $320M valuation) lives in note fields only.',
    is_published: true,
    published_at: '2025-03-19T12:00:00Z',
    last_reviewed_at: '2026-10-17T00:00:00Z',
    parties: [
      {
        id: 'p-nvda2-gre-1',
        deal_id: '20000000-0000-0000-0000-000000000129',
        company_id: '00000000-0000-0000-0000-000000000001',
        role: 'investor',
        direction_note: 'Acquirer; Gretel\u2019s team and synthetic-data technology folded into NVIDIA',
        company: findCompany('00000000-0000-0000-0000-000000000001'),
      },
      {
        id: 'p-nvda2-gre-2',
        deal_id: '20000000-0000-0000-0000-000000000129',
        company_id: '00000000-0000-0000-0000-000000000095',
        role: 'investee',
        direction_note: 'Acquired synthetic-data platform; ~80 employees joined NVIDIA',
        company: GRETEL,
      },
    ],
    sources: [
      {
        deal_id: '20000000-0000-0000-0000-000000000129',
        source_id: '10000000-0000-0000-0000-000000000182',
        supporting_note: 'WIRED\u2019s report that NVIDIA had acquired Gretel for nine figures (above the $320M valuation).',
        is_primary_support: true,
        source: SRC_GRETEL_WIRED,
      },
    ],
  },
  {
    id: '20000000-0000-0000-0000-000000000130',
    slug: 'nvidia-acquires-lepton-ai-2025',
    title: 'NVIDIA Acquires GPU Cloud Reseller Lepton AI (Reported Several Hundred Million)',
    summary:
      'NVIDIA acquired Lepton AI, the Cupertino-based startup that rented out NVIDIA GPU servers and offered cloud software for building and scaling AI applications, in a deal The Information reported closed on April 9, 2025 at a value of several hundred million dollars. Neither company officially confirmed the transaction. Co-founders Yangqing Jia (creator of Caffe, ex-Alibaba VP) and Junjie Bai (ex-Meta AI researcher) joined NVIDIA, with Jia listed as VP, System Software from April 2025; NVIDIA relaunched the product as DGX Cloud Lepton in June 2025, deepening its control of how its chips are rented and consumed versus cloud rivals and GPU-cloud partners.',
    deal_type: 'acquisition',
    status: 'closed',
    announcement_date: '2025-03-27',
    effective_date: null,
    maturity_date: null,
    amount_value: null,
    amount_currency: 'USD',
    amount_basis: null,
    amount_period: 'Reported several-hundred-million-dollar deal (The Information); officially undisclosed',
    amount_disclosed: false,
    geography: 'United States',
    evidence_level: 'reported_secondary',
    confidence_note:
      'Single-original-outlet reporting: The Information (March 27, 2025: advanced talks at several hundred million dollars; April 9, 2025 briefing: acquisition closed). Corroborations found and verified: SiliconANGLE and DataCenterDynamics same-day coverage of the March 27, 2025 talks report (several-hundred-million-dollar value; Lepton founded 2023 with an $11M seed from CRV and Fusion Fund; ~20 employees), TechNode (April 9, 2025: acquisition at several hundred million dollars, both co-founders joined NVIDIA), Seedtable (deal reported April 9, 2025; product relaunched as DGX Cloud Lepton in June 2025), a GuruFocus syndication, and Yangqing Jia\u2019s own LinkedIn showing NVIDIA VP, System Software since April 2025. No official confirmation from NVIDIA or Lepton AI and no disclosed terms, so the amount stays null with the reported figure in note fields.',
    is_published: true,
    published_at: '2025-04-09T12:00:00Z',
    last_reviewed_at: '2026-10-17T00:00:00Z',
    parties: [
      {
        id: 'p-nvda2-lep-1',
        deal_id: '20000000-0000-0000-0000-000000000130',
        company_id: '00000000-0000-0000-0000-000000000001',
        role: 'investor',
        direction_note: 'Acquirer of the GPU cloud reseller; no official comment on the transaction',
        company: findCompany('00000000-0000-0000-0000-000000000001'),
      },
      {
        id: 'p-nvda2-lep-2',
        deal_id: '20000000-0000-0000-0000-000000000130',
        company_id: '00000000-0000-0000-0000-000000000097',
        role: 'investee',
        direction_note: 'Acquired GPU-rental cloud; co-founders Yangqing Jia and Junjie Bai joined NVIDIA',
        company: LEPTON_AI,
      },
    ],
    sources: [
      {
        deal_id: '20000000-0000-0000-0000-000000000130',
        source_id: '10000000-0000-0000-0000-000000000183',
        supporting_note: 'The Information briefing reporting NVIDIA closed the Lepton AI acquisition (April 9, 2025).',
        is_primary_support: true,
        source: SRC_LEPTON_INFO,
      },
      {
        deal_id: '20000000-0000-0000-0000-000000000130',
        source_id: '10000000-0000-0000-0000-000000000184',
        supporting_note: 'TechNode corroboration of the acquisition (several hundred million dollars) and the co-founders joining NVIDIA.',
        is_primary_support: false,
        source: SRC_LEPTON_TECHNODE,
      },
    ],
  },
  {
    id: '20000000-0000-0000-0000-000000000131',
    slug: 'nvidia-enfabrica-license-2025',
    title: 'NVIDIA Pays Reported >$900M to License Enfabrica Technology and Hire Its CEO',
    summary:
      'NVIDIA spent more than $900 million in a cash-and-stock package to license the technology of networking-silicon startup Enfabrica and hire its CEO Rochan Sankar plus other employees, per CNBC (two people familiar with the arrangement). The deal, which closed the week before the September 18, 2025 report, is a license-plus-hire rather than an equity acquisition: Enfabrica\u2019s fabric technology - which can tie roughly 100,000 AI accelerators into a single computer while cutting memory costs - is being folded into NVIDIA\u2019s AI-factory networking stack. NVIDIA had already backed Enfabrica\u2019s $125M Series B in 2023.',
    deal_type: 'strategic_partnership',
    status: 'closed',
    announcement_date: '2025-09-18',
    effective_date: null,
    maturity_date: null,
    amount_value: null,
    amount_currency: 'USD',
    amount_basis: null,
    amount_period: 'Reported >$900M in cash and stock for the technology license plus CEO/staff hires (CNBC/Reuters); officially undisclosed',
    amount_disclosed: false,
    geography: 'United States',
    evidence_level: 'reported_secondary',
    confidence_note:
      'Transaction corroborated across outlets on September 18, 2025: CNBC\u2019s original report (two people familiar; >$900M cash and stock; CEO Rochan Sankar and other employees hired; technology licensed; deal closed the week prior) and Reuters\u2019 same-day pick-up, also syndicated by Yahoo Finance, The Hindu and Economic Times; a Warren-Blumenthal Senate letter subsequently cited CNBC\u2019s reporting. NVIDIA declined to comment and Enfabrica did not respond, so the amount stays null with the reported figure in note fields. Structure is license-plus-hire, not an equity acquisition; CNBC also notes NVIDIA was an existing Enfabrica investor via its 2023 $125M Series B.',
    is_published: true,
    published_at: '2025-09-18T12:00:00Z',
    last_reviewed_at: '2026-10-17T00:00:00Z',
    parties: [
      {
        id: 'p-nvda2-enf-1',
        deal_id: '20000000-0000-0000-0000-000000000131',
        company_id: '00000000-0000-0000-0000-000000000001',
        role: 'counterparty',
        direction_note: 'Pays the reported >$900M cash-and-stock package; licenses the networking technology and hires CEO Rochan Sankar plus staff',
        company: findCompany('00000000-0000-0000-0000-000000000001'),
      },
      {
        id: 'p-nvda2-enf-2',
        deal_id: '20000000-0000-0000-0000-000000000131',
        company_id: '00000000-0000-0000-0000-000000000098',
        role: 'partner',
        direction_note: 'Grants the technology license and loses its CEO plus other employees; not reported acquired',
        company: ENFABRICA,
      },
    ],
    sources: [
      {
        deal_id: '20000000-0000-0000-0000-000000000131',
        source_id: '10000000-0000-0000-0000-000000000185',
        supporting_note: 'CNBC\u2019s original report of the >$900M license-plus-hire package and the closing.',
        is_primary_support: true,
        source: SRC_ENFABRICA_CNBC,
      },
      {
        deal_id: '20000000-0000-0000-0000-000000000131',
        source_id: '10000000-0000-0000-0000-000000000186',
        supporting_note: 'Reuters corroboration of the >$900M cash-and-stock license-plus-hire report.',
        is_primary_support: false,
        source: SRC_ENFABRICA_REUTERS,
      },
    ],
  },
  {
    id: '20000000-0000-0000-0000-000000000132',
    slug: 'amd-acquires-silo-ai-2024',
    title: 'AMD Acquires Europe\u2019s Largest Private AI Lab Silo AI for $665 Million',
    summary:
      'AMD signed a definitive agreement on July 10, 2024 to acquire Silo AI, Europe\u2019s largest private AI lab, in an all-cash transaction valued at approximately $665 million, and completed the acquisition on August 9, 2024 (completion announced August 12). The Helsinki-based lab behind the SiloGen platform and open-source multilingual LLMs Poro and Viking joined AMD\u2019s Artificial Intelligence Group under Vamsi Boppana, with CEO and co-founder Peter Sarlin continuing to lead the team. Per AMD\u2019s 10-Q, net of closing adjustments, transaction costs and deferred cash compensation, purchase consideration was $553 million, allocated largely to goodwill.',
    deal_type: 'acquisition',
    status: 'closed',
    announcement_date: '2024-07-10',
    effective_date: '2024-08-09',
    maturity_date: null,
    amount_value: 665000000,
    amount_currency: 'USD',
    amount_basis: 'cash_investment',
    amount_period: 'All-cash acquisition consideration (approx. $665M; net purchase consideration $553M per AMD 10-Q)',
    amount_disclosed: true,
    geography: 'Finland',
    evidence_level: 'confirmed_primary',
    confidence_note:
      'Confirmed by AMD\u2019s own releases (definitive agreement July 10, 2024; completion announced August 12, 2024) and by AMD\u2019s SEC Form 10-Q for the quarter ended September 28, 2024, which states the acquisition of Silo AI Oy (Finland) was completed August 9, 2024 in an all-cash transaction of $665 million (net purchase consideration $553 million). NOTE: the deal is 2024, not 2025 as sometimes miscited.',
    is_published: true,
    published_at: '2024-07-10T12:00:00Z',
    last_reviewed_at: '2026-10-17T00:00:00Z',
    parties: [
      {
        id: 'p-nvda2-sil-1',
        deal_id: '20000000-0000-0000-0000-000000000132',
        company_id: '00000000-0000-0000-0000-000000000068',
        role: 'investor',
        direction_note: 'Acquirer; ~$665M all-cash purchase completed August 9, 2024',
        company: findCompany('00000000-0000-0000-0000-000000000068'),
      },
      {
        id: 'p-nvda2-sil-2',
        deal_id: '20000000-0000-0000-0000-000000000132',
        company_id: '00000000-0000-0000-0000-000000000096',
        role: 'investee',
        direction_note: 'Acquired European AI lab; team joined AMD\u2019s Artificial Intelligence Group under Peter Sarlin',
        company: SILO_AI,
      },
    ],
    sources: [
      {
        deal_id: '20000000-0000-0000-0000-000000000132',
        source_id: '10000000-0000-0000-0000-000000000187',
        supporting_note: 'Official AMD announcement of the ~$665M all-cash definitive agreement (July 10, 2024).',
        is_primary_support: true,
        source: SRC_SILO_AMD_ANNOUNCE,
      },
      {
        deal_id: '20000000-0000-0000-0000-000000000132',
        source_id: '10000000-0000-0000-0000-000000000188',
        supporting_note: 'AMD 10-Q: Silo AI Oy acquisition completed August 9, 2024 for $665M all-cash ($553M net).',
        is_primary_support: true,
        source: SRC_SILO_SEC,
      },
    ],
  },
];

export const EXTRA_RELATIONSHIPS: Relationship[] = [
  {
    id: '30000000-0000-0000-0000-000000000089',
    from_company_id: '00000000-0000-0000-0000-000000000001',
    to_company_id: '00000000-0000-0000-0000-000000000094',
    relationship_type: 'equity_shareholder',
    start_date: '2024-12-30',
    end_date: null,
    description:
      'NVIDIA owns Run:ai following the acquisition completed December 30, 2024, after the European Commission\u2019s unconditional Phase 1 clearance (case M.11766) on December 20, 2024; Run:ai\u2019s GPU orchestration software remains available and was slated to be open-sourced.',
    evidence_level: 'confirmed_primary',
    is_published: true,
    from_company: findCompany('00000000-0000-0000-0000-000000000001'),
    to_company: RUN_AI,
    sources: [
      {
        relationship_id: '30000000-0000-0000-0000-000000000089',
        source_id: '10000000-0000-0000-0000-000000000180',
        supporting_note: 'European Commission decision document clearing the NVIDIA-Run:ai concentration.',
        source: SRC_RUNAI_EU,
      },
      {
        relationship_id: '30000000-0000-0000-0000-000000000089',
        source_id: '10000000-0000-0000-0000-000000000181',
        supporting_note: 'Reuters on the completed acquisition (December 30, 2024).',
        source: SRC_RUNAI_REUTERS_CLOSE,
      },
    ],
  },
  {
    id: '30000000-0000-0000-0000-000000000090',
    from_company_id: '00000000-0000-0000-0000-000000000001',
    to_company_id: '00000000-0000-0000-0000-000000000095',
    relationship_type: 'equity_shareholder',
    start_date: '2025-03-19',
    end_date: null,
    description:
      'NVIDIA reportedly owns Gretel after acquiring the synthetic-data startup in a nine-figure deal that had closed by the March 19, 2025 report (per WIRED, two people with direct knowledge); Gretel\u2019s ~80 employees were folded into NVIDIA.',
    evidence_level: 'reported_secondary',
    is_published: true,
    from_company: findCompany('00000000-0000-0000-0000-000000000001'),
    to_company: GRETEL,
    sources: [
      {
        relationship_id: '30000000-0000-0000-0000-000000000090',
        source_id: '10000000-0000-0000-0000-000000000182',
        supporting_note: 'WIRED\u2019s report that NVIDIA had acquired Gretel (nine figures).',
        source: SRC_GRETEL_WIRED,
      },
    ],
  },
  {
    id: '30000000-0000-0000-0000-000000000091',
    from_company_id: '00000000-0000-0000-0000-000000000001',
    to_company_id: '00000000-0000-0000-0000-000000000097',
    relationship_type: 'equity_shareholder',
    start_date: '2025-04-09',
    end_date: null,
    description:
      'NVIDIA reportedly owns Lepton AI after closing its acquisition of the GPU cloud reseller (The Information, April 9, 2025); co-founders Yangqing Jia and Junjie Bai joined NVIDIA, with Jia as VP, System Software.',
    evidence_level: 'reported_secondary',
    is_published: true,
    from_company: findCompany('00000000-0000-0000-0000-000000000001'),
    to_company: LEPTON_AI,
    sources: [
      {
        relationship_id: '30000000-0000-0000-0000-000000000091',
        source_id: '10000000-0000-0000-0000-000000000183',
        supporting_note: 'The Information briefing reporting the closed acquisition.',
        source: SRC_LEPTON_INFO,
      },
      {
        relationship_id: '30000000-0000-0000-0000-000000000091',
        source_id: '10000000-0000-0000-0000-000000000184',
        supporting_note: 'TechNode corroboration of the April 2025 acquisition and the founders joining NVIDIA.',
        source: SRC_LEPTON_TECHNODE,
      },
    ],
  },
  {
    id: '30000000-0000-0000-0000-000000000092',
    from_company_id: '00000000-0000-0000-0000-000000000001',
    to_company_id: '00000000-0000-0000-0000-000000000098',
    relationship_type: 'strategic_partner',
    start_date: '2025-09-18',
    end_date: null,
    description:
      'NVIDIA licensed Enfabrica\u2019s networking-silicon technology in a reported >$900M cash-and-stock package (closed the week before the September 18, 2025 CNBC report) and hired CEO Rochan Sankar plus other employees; Enfabrica was not reported acquired.',
    evidence_level: 'reported_secondary',
    is_published: true,
    from_company: findCompany('00000000-0000-0000-0000-000000000001'),
    to_company: ENFABRICA,
    sources: [
      {
        relationship_id: '30000000-0000-0000-0000-000000000092',
        source_id: '10000000-0000-0000-0000-000000000185',
        supporting_note: 'CNBC\u2019s original report of the license-plus-hire package.',
        source: SRC_ENFABRICA_CNBC,
      },
      {
        relationship_id: '30000000-0000-0000-0000-000000000092',
        source_id: '10000000-0000-0000-0000-000000000186',
        supporting_note: 'Reuters corroboration of the license-plus-hire transaction.',
        source: SRC_ENFABRICA_REUTERS,
      },
    ],
  },
  {
    id: '30000000-0000-0000-0000-000000000093',
    from_company_id: '00000000-0000-0000-0000-000000000001',
    to_company_id: '00000000-0000-0000-0000-000000000098',
    relationship_type: 'equity_shareholder',
    start_date: null,
    end_date: null,
    description:
      'NVIDIA has been a minority equity investor in Enfabrica since participating in the startup\u2019s $125M Series B in 2023 (exact stake and dates undisclosed); the September 2025 >$900M license-plus-hire package was separate and paid in cash and NVIDIA stock.',
    evidence_level: 'reported_secondary',
    is_published: true,
    from_company: findCompany('00000000-0000-0000-0000-000000000001'),
    to_company: ENFABRICA,
    sources: [
      {
        relationship_id: '30000000-0000-0000-0000-000000000093',
        source_id: '10000000-0000-0000-0000-000000000185',
        supporting_note: 'CNBC notes NVIDIA invested in Enfabrica as part of its $125M Series B (2023).',
        source: SRC_ENFABRICA_CNBC,
      },
    ],
  },
  {
    id: '30000000-0000-0000-0000-000000000094',
    from_company_id: '00000000-0000-0000-0000-000000000068',
    to_company_id: '00000000-0000-0000-0000-000000000096',
    relationship_type: 'equity_shareholder',
    start_date: '2024-08-09',
    end_date: null,
    description:
      'AMD owns Silo AI following the ~$665M all-cash acquisition completed August 9, 2024 (per AMD\u2019s 10-Q); the lab operates within AMD\u2019s Artificial Intelligence Group under CEO Peter Sarlin reporting to Vamsi Boppana.',
    evidence_level: 'confirmed_primary',
    is_published: true,
    from_company: findCompany('00000000-0000-0000-0000-000000000068'),
    to_company: SILO_AI,
    sources: [
      {
        relationship_id: '30000000-0000-0000-0000-000000000094',
        source_id: '10000000-0000-0000-0000-000000000187',
        supporting_note: 'AMD\u2019s official announcement of the ~$665M all-cash acquisition agreement.',
        source: SRC_SILO_AMD_ANNOUNCE,
      },
      {
        relationship_id: '30000000-0000-0000-0000-000000000094',
        source_id: '10000000-0000-0000-0000-000000000188',
        supporting_note: 'AMD 10-Q confirming completion of the Silo AI Oy acquisition on August 9, 2024.',
        source: SRC_SILO_SEC,
      },
    ],
  },
];
