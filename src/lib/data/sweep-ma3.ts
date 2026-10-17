import { Company, Deal, Relationship, Source } from '../types';
import { findCompany } from './dataset';

// LANE F (infrastructure/AI-company M&A sweep round 2, verified 2026-10-17).
// Six deals recorded, including the lane's flagship FAILED deal: (1) CoreWeave's
// ~$9B all-stock acquisition of Core Scientific - announced July 7, 2025, then
// REJECTED by Core Scientific stockholders on October 30, 2025 (Two Seas Capital
// campaign; ISS/Glass Lewis against; final tally 20,752,327 for / 203,451,498
// against / 21,588,639 abstain), after which Core Scientific terminated the
// merger effective immediately and stayed public as CORZ; status 'cancelled'.
// (2) CoreWeave's acquisition of Weights & Biases, announced March 4, 2025 and
// completed May 5, 2025; CORRECTION vs an earlier draft of this file: the
// companies did not disclose terms (Reuters) and CoreWeave's announcement page
// does NOT state a price - the ~$1.7B figure is The Information's reporting,
// so amount_disclosed is false. (3) Meta's completed acquisition of PlayAI
// (July 2025, terms undisclosed). (4) Microsoft's ~$650M Inflection AI
// license-plus-hire arrangement (March 2024) - strategic_partnership, NOT an
// acquisition: no Inflection equity changed hands and the company kept running
// Pi. (5) NVIDIA's ~$12.93B definitive agreement to acquire Hugging Face
// (agreement September 2, 2026 per NVIDIA's 8-K; expected close H1 2027; NOT
// closed as of 2026-10-17) - hard fact-check CONFIRMED via the 8-K, NVIDIA's
// blog, Reuters, CNBC, NPR and TechCrunch. (6) SpaceX's all-stock merger with
// xAI (agreement January 31, 2026; closed February 2, 2026) valuing xAI at
// ~$250B in a ~$1.25T combined entity - hard fact-check CONFIRMED via the
// SEC-filed merger agreement, Nevada filings via CNBC, Reuters, AP and The
// Guardian. Verified but NOT recorded here for slot budget, flagged for a
// later lane: SpaceX-Anysphere/Cursor ($60B all-stock; agreement June 16,
// 2026 and completion August 14, 2026, both per SpaceX 8-Ks; an Anysphere
// company is already registered in sweep-backstops.ts) and OpenAI-Statsig
// (definitive agreement September 2, 2025, ~$1.1B all-stock; note the Statsig
// blog states the Statsig product was thereafter acquired by Amplitude on
// May 5, 2026, which needs untangling before recording).

const PLAY_AI: Company = {
  id: '00000000-0000-0000-0000-000000000091',
  name: 'PlayAI',
  slug: 'playai',
  aliases: ['Play AI', 'Play.ht', 'PlayHT'],
  description: 'Voice-AI startup generating human-sounding voices, voice cloning and conversational voice agents for customer-service and creator use cases; acquired by Meta in July 2025 with the entire team joining Meta Superintelligence Labs under voice-AI veteran Johan Schalkwyk.',
  company_type: 'ai_lab',
  headquarters_country: 'United States',
  headquarters_city: 'San Francisco, CA',
  website_url: 'https://play.ai',
  ticker: null,
  cik: null,
  is_public: false,
};

const WEIGHTS_BIASES: Company = {
  id: '00000000-0000-0000-0000-000000000100',
  name: 'Weights & Biases',
  slug: 'weights-biases',
  aliases: ['W&B', 'wandb', 'Weights and Biases', 'Weights & Biases, Inc.'],
  description: 'Machine-learning developer platform for experiment tracking, model and agent evaluation (W&B Weave), datasets and MLOps tooling used by 1,400+ organizations including AstraZeneca, Canva, NVIDIA, Snowflake and 30+ foundation-model builders including OpenAI, Meta and Cohere; acquired by CoreWeave in a deal announced March 4, 2025 and completed May 5, 2025 to form the software layer of CoreWeave\'s AI cloud platform.',
  company_type: 'ai_lab',
  headquarters_country: 'United States',
  headquarters_city: 'San Francisco, CA',
  website_url: 'https://www.wandb.ai',
  ticker: null,
  cik: null,
  is_public: false,
};

const CORE_SCIENTIFIC: Company = {
  id: '00000000-0000-0000-0000-000000000101',
  name: 'Core Scientific, Inc.',
  slug: 'core-scientific',
  aliases: ['CORZ', 'Core Scientific'],
  description: 'Bitcoin-miner-turned-AI-hosting operator of purpose-built data centers for high-density colocation (HPC/AI) and digital-asset mining, converting most facilities to AI workloads; hosts CoreWeave GPU operations under a series of long-duration colocation contracts beginning with ~200 MW announced June 2024 and expanded to ~840 gross MW supporting CoreWeave HPC contracts by July 2025; its stockholders rejected the ~$9B CoreWeave all-stock merger on October 30, 2025 and it remains an independent Nasdaq-listed company (CORZ).',
  company_type: 'data_center_operator',
  headquarters_country: 'United States',
  headquarters_city: 'Austin, TX',
  website_url: 'https://www.corescientific.com',
  ticker: 'CORZ',
  cik: '0001839341',
  is_public: true,
};

const INFLECTION_AI: Company = {
  id: '00000000-0000-0000-0000-000000000102',
  name: 'Inflection AI',
  slug: 'inflection-ai',
  aliases: ['Inflection', 'Pi', 'Pi (Inflection AI)'],
  description: 'AI studio behind the consumer Pi chatbot that raised ~$1.5B including from Microsoft and NVIDIA; in March 2024 Microsoft paid ~$650M to license its models and hired co-founders Mustafa Suleyman and Karen Simonyan plus most of the ~70-person staff into the new Microsoft AI consumer unit, while Inflection continued as an independent operating company with no equity sold.',
  company_type: 'ai_lab',
  headquarters_country: 'United States',
  headquarters_city: 'Palo Alto, CA',
  website_url: 'https://inflection.ai',
  ticker: null,
  cik: null,
  is_public: false,
};

const HUGGING_FACE: Company = {
  id: '00000000-0000-0000-0000-000000000103',
  name: 'Hugging Face, Inc.',
  slug: 'hugging-face',
  aliases: ['HuggingFace', 'HF', 'Hugging Face'],
  description: 'Open-source AI platform and community for developing, sharing and deploying models, datasets and applications - roughly 3 million models, a half-million datasets and 1 million applications used by over 18 million developers; founded in 2016 by CEO Clément Delangue with co-founders Julien Chaumond and Thomas Wolf; agreed on September 2, 2026 to be acquired by NVIDIA for ~$12.93B (close expected first half of 2027), with NVIDIA committing to keep the platform open and independent of NVIDIA hardware.',
  company_type: 'ai_lab',
  headquarters_country: 'United States',
  headquarters_city: 'New York, NY',
  website_url: 'https://huggingface.co',
  ticker: null,
  cik: null,
  is_public: false,
};

const SPACEX: Company = {
  id: '00000000-0000-0000-0000-000000000104',
  name: 'SpaceX',
  slug: 'spacex',
  aliases: ['Space Exploration Technologies Corp.', 'SpaceX Corp.', 'SPCX'],
  description: 'Elon Musk\'s launch and satellite-internet provider (Falcon 9, Starship, Starlink); acquired his AI company X.AI Holdings Corp. (xAI - Grok and the X social platform) in an all-stock merger agreed January 31, 2026 and completed February 2, 2026, valuing xAI at ~$250B within a combined ~$1.25T entity ahead of its June 2026 Nasdaq IPO (SPCX), and pursuing orbital data-center ambitions; expanded into AI developer tooling with the June 2026 agreement to acquire Anysphere (Cursor).',
  company_type: 'other',
  headquarters_country: 'United States',
  headquarters_city: 'Hawthorne, CA',
  website_url: 'https://www.spacex.com',
  ticker: 'SPCX',
  cik: '0001181412',
  is_public: true,
};

export const EXTRA_COMPANIES: Company[] = [PLAY_AI, WEIGHTS_BIASES, CORE_SCIENTIFIC, INFLECTION_AI, HUGGING_FACE, SPACEX];

const SRC_CORZ_ANNOUNCE_8K: Source = {
  id: '10000000-0000-0000-0000-000000000197',
  url: 'https://www.sec.gov/Archives/edgar/data/1769628/000095010325008496/dp231293_ex9901.htm',
  title: 'CoreWeave to Acquire Core Scientific (Joint Press Release, SEC EDGAR Exhibit 99.1)',
  publisher: 'CoreWeave, Inc. / U.S. SEC EDGAR',
  source_type: 'primary_filing',
  published_date: '2025-07-07',
  accessed_at: '2026-10-17T00:00:00Z',
  notes: 'Joint press release "CoreWeave to Acquire Core Scientific" filed as Exhibit 99.1 to CoreWeave\'s July 7, 2025 SEC communication: definitive all-stock merger agreement, 0.1235 CoreWeave shares per Core Scientific share (fixed ratio), implied total equity value ~$9.0B on a fully diluted basis at CoreWeave\'s 5-day VWAP as of July 3, 2025 ($20.40/share, ~66% premium to the unaffected June 25, 2025 close of $12.30), CoreWeave to own ~1.3 GW of gross power (~840 existing gross MW already supporting CoreWeave HPC contracts plus ~500 gross MW crypto-mining power), 1 GW+ expansion potential, over $10B of lease overhead eliminated, expected Q4 2025 close; Goldman Sachs advising CoreWeave, Moelis and PJT Partners advising Core Scientific. Verified live on 2026-10-17.',
};

const SRC_CORZ_TERM_8K: Source = {
  id: '10000000-0000-0000-0000-000000000198',
  url: 'https://www.sec.gov/Archives/edgar/data/1839341/000114036125039808/0001140361-25-039808-index.htm',
  title: 'Core Scientific, Inc. Form 8-K, Items 1.02/7.01/9.01 - Termination of CoreWeave Merger Agreement (filed October 30, 2025)',
  publisher: 'Core Scientific, Inc. / U.S. SEC EDGAR',
  source_type: 'primary_filing',
  published_date: '2025-10-30',
  accessed_at: '2026-10-17T00:00:00Z',
  notes: 'Core Scientific 8-K (accession 0001140361-25-039808; verified via EDGAR index on 2026-10-17): at the October 30, 2025 special meeting stockholders did not approve the merger agreement (proposal to adopt the July 7, 2025 merger agreement with CoreWeave), and pursuant to the merger agreement Core Scientific terminated it effective immediately; Exhibit 99.1 is the termination press release stating Core Scientific remains publicly traded on Nasdaq as CORZ. Final vote tallies were filed separately on October 31, 2025 (https://www.sec.gov/Archives/edgar/data/1839341/000114036125040020/ef20058085_8k.htm).',
};

const SRC_NVDA_HF_8K: Source = {
  id: '10000000-0000-0000-0000-000000000199',
  url: 'https://www.sec.gov/Archives/edgar/data/1045810/000104581026000078/nvda-20260902.htm',
  title: 'NVIDIA Corporation Form 8-K, Item 8.01 - Definitive Agreement to Acquire Hugging Face (filed September 3, 2026)',
  publisher: 'NVIDIA Corporation / U.S. SEC EDGAR',
  source_type: 'primary_filing',
  published_date: '2026-09-03',
  accessed_at: '2026-10-17T00:00:00Z',
  notes: 'NVIDIA 8-K (verified in full on 2026-10-17): on September 2, 2026 NVIDIA entered into a definitive agreement to acquire Hugging Face, Inc.; approximately $11.9 billion purchase price payable to Hugging Face stockholders (subject to certain adjustments) plus an equity-based retention program of up to approximately $1.0 billion for Hugging Face employees joining NVIDIA; expected to close in the first half of 2027 subject to regulatory approvals; NVIDIA committed to keep the Hugging Face platform open (users upload/download models and datasets of their choosing and other silicon vendors remain supported). Signed by EVP & CFO Colette M. Kress.',
};

const SRC_WB_ANNOUNCE_PR: Source = {
  id: '10000000-0000-0000-0000-000000000200',
  url: 'https://www.coreweave.com/news/coreweave-to-acquire-weights-biases---industry-leading-ai-developer-platform-for-building-and-deploying-ai-applications',
  title: 'CoreWeave Announces Agreement to Acquire Weights & Biases (PRNewswire release, March 4, 2025)',
  publisher: 'CoreWeave, Inc. (PRNewswire)',
  source_type: 'company_release',
  published_date: '2025-03-04',
  accessed_at: '2026-10-17T00:00:00Z',
  notes: 'Official CoreWeave announcement (March 4, 2025) that it "reached an agreement to acquire Weights & Biases, a leading AI developer platform" to extend its purpose-built cloud platform into an end-to-end experience. The release states NO purchase price (verified full text on 2026-10-17: no dollar figure appears); describes W&B as working with 1,400+ organizations (including AstraZeneca, Canva, NVIDIA, Snowflake, Toyota) and 30+ foundation-model builders (including OpenAI, Meta, Cohere). Terms were confirmed undisclosed by Reuters. Deal expected to close in H1 2025 per contemporaneous Reuters/TechCrunch coverage.',
};

const SRC_WB_COMPLETE_PR: Source = {
  id: '10000000-0000-0000-0000-000000000201',
  url: 'https://www.coreweave.com/news/coreweave-completes-acquisition-of-weights-biases-2',
  title: 'CoreWeave Completes Acquisition of Weights & Biases',
  publisher: 'CoreWeave, Inc. (PRNewswire)',
  source_type: 'company_release',
  published_date: '2025-05-05',
  accessed_at: '2026-10-17T00:00:00Z',
  notes: 'Official CoreWeave completion release (May 5, 2025): acquisition of Weights & Biases completed, uniting compute and developer tooling into the "AI Cloud Platform" with W&B interoperability commitments retained; first major acquisition following CoreWeave\'s March 2025 Nasdaq IPO (CEO Michael Intrator and W&B founder Lukas Biewald quoted). Mirrored at CoreWeave IR (investors.coreweave.com) and PRNewswire (news-releases/coreweave-completes-acquisition-of-weights--biases-302445966.html).',
};

const SRC_NVDA_HF_REUTERS: Source = {
  id: '10000000-0000-0000-0000-000000000202',
  url: 'https://www.reuters.com/business/nvidia-buy-hugging-face-nearly-13-billion-big-bet-open-ai-models-2026-09-03/',
  title: 'Nvidia bets $13 billion on open AI models with Hugging Face deal',
  publisher: 'Reuters (Aditya Soni, Anhata Rooprai and Harshita Mary Varghese)',
  source_type: 'reputable_media',
  published_date: '2026-09-03',
  accessed_at: '2026-10-17T00:00:00Z',
  notes: 'Reuters (September 3, 2026): Nvidia will buy developer platform Hugging Face for $12.93 billion - about $11.9 billion to Hugging Face investors with an equity-based retention program of up to $1 billion for employees joining Nvidia - betting on open-source models; CEO Jensen Huang says Hugging Face will remain an open platform and will not require Nvidia chips. Corroborates NVIDIA\'s 8-K point-for-point.',
};

const SRC_SPACEX_XAI_MERGER_EX: Source = {
  id: '10000000-0000-0000-0000-000000000203',
  url: 'https://www.sec.gov/Archives/edgar/data/1181412/000162828026036936/exhibit21-sx1.htm',
  title: 'Agreement and Plan of Merger and Reorganization, dated January 31, 2026 (SpaceX / X.AI Holdings Corp.), SEC Exhibit 2.1',
  publisher: 'Space Exploration Technologies Corp. / X.AI Holdings Corp. / U.S. SEC EDGAR',
  source_type: 'primary_filing',
  published_date: '2026-01-31',
  accessed_at: '2026-10-17T00:00:00Z',
  notes: 'Agreement and Plan of Merger and Reorganization among Space Exploration Technologies Corp. (SpaceX, Texas), X.AI Holdings Corp. (xAI, Nevada), K2 Merger Sub Inc. and K2 Merger Sub 2 LLC: two-step Nevada merger ending with xAI as a wholly owned SpaceX subsidiary; Section 1.3 fixes the Closing for February 2, 2026; intended to qualify as a tax-free reorganization under IRC Section 368 (Rev. Rul. 2001-46); stock exchange mechanics with Cash/Low Vote/High Vote Merger Consideration elections; signed for SpaceX by CFO Bret Johnsen and for xAI by Elon R. Musk (President). Filed with the SEC as Exhibit 2.1 to SpaceX\'s Form S-1 (CIK 1181412). Verified live on 2026-10-17.',
};

const SRC_SPACEX_XAI_CNBC: Source = {
  id: '10000000-0000-0000-0000-000000000204',
  url: 'https://www.cnbc.com/2026/02/02/elon-musk-spacex-xai-ipo.html',
  title: 'Elon Musk\'s SpaceX acquiring AI startup xAI ahead of potential IPO',
  publisher: 'CNBC',
  source_type: 'reputable_media',
  published_date: '2026-02-02',
  accessed_at: '2026-10-17T00:00:00Z',
  notes: 'CNBC (February 2, 2026): Elon Musk announced the combination of SpaceX and xAI in a blog post framing "the most ambitious, vertically-integrated innovation engine on (and off) Earth" ahead of a massive IPO that Bloomberg reported would price at a ~$1.25 trillion valuation; CNBC\'s review of Nevada public records indicates the deal was completed on Feb. 2, with Space Exploration Technologies Corp. listed as the "managing member" of X.AI Holdings; cites SpaceX\'s $800B secondary-marking and xAI\'s ~$230B valuation in a $20B round that closed earlier in 2026; notes the February 2026 deal follows the 2025 xAI-X merger.',
};

const SRC_PLAYAI_BLOOMBERG: Source = {
  id: '10000000-0000-0000-0000-000000000205',
  url: 'https://www.bloomberg.com/news/articles/2025-07-11/meta-acquires-voice-ai-startup-playai-continuing-to-add-talent',
  title: 'Meta Acquires Voice AI Startup PlayAI, Continuing to Add Talent',
  publisher: 'Bloomberg News (Kurt Wagner)',
  source_type: 'reputable_media',
  published_date: '2025-07-11',
  accessed_at: '2026-10-17T00:00:00Z',
  notes: 'First report of the completed deal (July 11, 2025): Meta Platforms "has completed a deal to acquire PlayAI," the voice-AI startup; an internal memo says the entire PlayAI team joins Meta the following week reporting to Johan Schalkwyk (ex-Sesame AI, previously overseeing speech AI research at Google); Meta spokesperson confirmed the acquisition; financial terms not disclosed. Wall-to-wall echo coverage: TechCrunch (https://techcrunch.com/2025/07/13/meta-acquires-voice-startup-play-ai), Business Standard, Engadget, Economic Times.',
};

const SRC_INFLECTION_REUTERS: Source = {
  id: '10000000-0000-0000-0000-000000000206',
  url: 'https://www.reuters.com/technology/microsoft-agreed-pay-inflection-650-mln-while-hiring-its-staff-information-2024-03-21/',
  title: 'Microsoft pays Inflection $650 mln in licensing deal while hiring its staff, source says',
  publisher: 'Reuters (Krystal Hu, Harshita Mary Varghese)',
  source_type: 'reputable_media',
  published_date: '2024-03-21',
  accessed_at: '2026-10-17T00:00:00Z',
  notes: 'Reuters (March 21, 2024, person familiar; The Information first): Microsoft agreed to pay Inflection AI about $650M in cash in an unusual deal allowing Microsoft to use Inflection\'s models (to be available on Azure) and hire most of the ~70-person staff including co-founders Mustafa Suleyman (CEO of the new Microsoft AI consumer unit) and Karen Simonyan (chief scientist); licensing fee used to make Greylock, Dragoneer and other investors whole (early-round investors ~1.5x). Bloomberg corroborated same day (https://www.bloomberg.com/news/articles/2024-03-21/microsoft-to-pay-inflection-ai-650-million-after-scooping-up-most-of-staff) and TechCrunch reported the reported split: ~$620M non-exclusive license + ~$30M legal-claims waiver (https://techcrunch.com/2024/03/21/microsoft-inflection-ai-investors-reid-hoffman-bill-gates/).',
};

export const EXTRA_SOURCES: Source[] = [
  SRC_CORZ_ANNOUNCE_8K,
  SRC_CORZ_TERM_8K,
  SRC_NVDA_HF_8K,
  SRC_WB_ANNOUNCE_PR,
  SRC_WB_COMPLETE_PR,
  SRC_NVDA_HF_REUTERS,
  SRC_SPACEX_XAI_MERGER_EX,
  SRC_SPACEX_XAI_CNBC,
  SRC_PLAYAI_BLOOMBERG,
  SRC_INFLECTION_REUTERS,
];

export const EXTRA_DEALS: Deal[] = [
  {
    id: '20000000-0000-0000-0000-000000000140',
    slug: 'coreweave-core-scientific-terminated-2025',
    title: 'CoreWeave\'s ~$9B All-Stock Acquisition of Core Scientific - Announced July 2025, Rejected by Stockholders and Terminated',
    summary: 'CoreWeave and Core Scientific signed a definitive agreement on July 7, 2025 under which CoreWeave would acquire Core Scientific in an all-stock transaction: 0.1235 newly issued CoreWeave Class A shares per Core Scientific share, implying a total equity value of approximately $9.0 billion ($20.40 per share, a ~66% premium to the unaffected June 25, 2025 price of $12.30), giving CoreWeave ownership of ~1.3 GW of gross power across Core Scientific\'s footprint (including ~840 existing gross MW already supporting CoreWeave HPC contracts plus ~500 gross MW of crypto-mining capacity) with 1 GW+ expansion potential, and eliminating over $10 billion of projected 12-year lease overhead. The deal was expected to close in Q4 2025, but activist holder Two Seas Capital (~6.2%, its largest active shareholder) campaigned against the fixed, uncollared exchange-ratio structure and valuation, ISS and Glass Lewis recommended voting no, and on October 30, 2025 Core Scientific stockholders failed to approve the merger - casting 20,752,327 votes for versus 203,451,498 against (with 21,588,639 abstentions) - the rare large AI-era deal killed by a target-side shareholder vote. Pursuant to the merger agreement, Core Scientific terminated it effective immediately the same day; no termination fee was payable by Core Scientific for a pure vote-failure termination; and the company remains independent and Nasdaq-listed (CORZ). The commercial relationship survived the failed deal: CoreWeave remains Core Scientific\'s anchor HPC colocation customer, and CoreWeave CEO Michael Intrator said "We respect the views of Core Scientific stockholders and look forward to continuing our commercial partnership."',
    deal_type: 'acquisition',
    status: 'cancelled',
    announcement_date: '2025-07-07',
    effective_date: null,
    maturity_date: null,
    amount_value: 9000000000,
    amount_currency: 'USD',
    amount_basis: 'equity_valuation',
    amount_period: 'All-stock exchange: 0.1235 CRWV per CORZ share (~$20.40/share, ~66% premium at announcement; final value was to be set at close)',
    amount_disclosed: true,
    geography: 'United States',
    evidence_level: 'confirmed_primary',
    confidence_note: 'Both ends of the arc are confirmed by primary sources: the July 7, 2025 definitive agreement by the joint press release filed as Exhibit 99.1 to CoreWeave\'s SEC communication (0.1235 fixed ratio, ~$9.0B implied equity value at CoreWeave\'s 5-day VWAP as of July 3, 2025, Q4 2025 expected close, ~840 existing gross MW supporting CoreWeave HPC contracts), and the October 30, 2025 termination by Core Scientific\'s Form 8-K, Items 1.02/7.01/9.01 (accession 0001140361-25-039808: stockholders did not approve; termination effective immediately). The final tallies in Core Scientific\'s vote-results 8-K (https://www.sec.gov/Archives/edgar/data/1839341/000114036125040020/ef20058085_8k.htm) show the decisive rejection: 20,752,327 for / 203,451,498 against / 21,588,639 abstain. Reuters (October 30, 2025, https://www.reuters.com/business/core-scientific-terminates-9-billion-merger-deal-with-coreweave-2025-10-30) and WSJ corroborated the failed vote; Bloomberg and CNBC corroborated the announcement. Two Seas Capital (~6.2% per its proxy filings) publicly urged a no vote and was joined by Van Eck; ISS and Glass Lewis both recommended against, criticizing the fixed, uncollared exchange ratio; CoreWeave\'s October 16, 2025 open letter confirmed the July 7 offer was "best and final" and would not be raised. Per Core Scientific\'s contested DEFC14A proxy (September 29, 2025), no termination fee is payable by Core Scientific on a vote-failure termination (a $270M fee would apply only if a competing acquisition were consummated within 12 months). Recorded as status \'cancelled\': a fully sourced, terminated acquisition - Core Scientific was never acquired and remains public.',
    is_published: true,
    published_at: '2025-07-07T12:00:00Z',
    last_reviewed_at: '2026-10-17T00:00:00Z',
    parties: [
      {
        id: 'p-ma3-corz-1',
        deal_id: '20000000-0000-0000-0000-000000000140',
        company_id: '00000000-0000-0000-0000-000000000002',
        role: 'investor',
        direction_note: 'Acquirer whose ~$9B all-stock offer (described as "best and final") died when target stockholders voted it down; CoreWeave then reaffirmed "opportunistic and strategic M&A" while remaining Core Scientific\'s anchor colocation customer',
        company: findCompany('00000000-0000-0000-0000-000000000002'),
      },
      {
        id: 'p-ma3-corz-2',
        deal_id: '20000000-0000-0000-0000-000000000140',
        company_id: '00000000-0000-0000-0000-000000000101',
        role: 'investee',
        direction_note: 'Target whose stockholders rejected the merger on October 30, 2025 (20.75M for / 203.45M against), triggering same-day termination; remains independent and Nasdaq-listed (CORZ)',
        company: CORE_SCIENTIFIC,
      },
    ],
    sources: [
      {
        deal_id: '20000000-0000-0000-0000-000000000140',
        source_id: '10000000-0000-0000-0000-000000000197',
        supporting_note: 'SEC-filed joint press release announcing the ~$9B all-stock definitive agreement on July 7, 2025.',
        is_primary_support: true,
        source: SRC_CORZ_ANNOUNCE_8K,
      },
      {
        deal_id: '20000000-0000-0000-0000-000000000140',
        source_id: '10000000-0000-0000-0000-000000000198',
        supporting_note: 'Core Scientific 8-K reporting the failed stockholder vote and the effective-immediately termination on October 30, 2025.',
        is_primary_support: true,
        source: SRC_CORZ_TERM_8K,
      },
    ],
  },
  {
    id: '20000000-0000-0000-0000-000000000141',
    slug: 'coreweave-acquires-weights-biases-2025',
    title: 'CoreWeave Acquires ML Developer Platform Weights & Biases (Press-Reported ~$1.7B, Terms Undisclosed)',
    summary: 'CoreWeave announced on March 4, 2025 that it had reached an agreement to acquire Weights & Biases, the leading ML developer platform for experiment tracking, model/agent evaluation and dataset/versioning tooling, two weeks before CoreWeave\'s March 2025 Nasdaq IPO. Neither company disclosed the purchase price; technology outlet The Information valued the deal at around $1.7 billion, a figure echoed by Reuters, TechCrunch and CoinDesk. The purchase verticalizes software onto CoreWeave\'s GPU cloud - an "end-to-end AI cloud platform" from compute to model management, evaluation and monitoring for AI labs and enterprises. The acquisition was completed on May 5, 2025, within the first-half 2025 closing window press reports anticipated, with the Weights & Biases team joining CoreWeave and W&B capabilities positioned as a new entry point into the CoreWeave Cloud platform.',
    deal_type: 'acquisition',
    status: 'closed',
    announcement_date: '2025-03-04',
    effective_date: '2025-05-05',
    maturity_date: null,
    amount_value: 1700000000,
    amount_currency: 'USD',
    amount_basis: 'equity_valuation',
    amount_period: 'Press-reported purchase price for the ML developer platform (~$1.7B per The Information; officially undisclosed)',
    amount_disclosed: false,
    geography: 'United States',
    evidence_level: 'confirmed_primary',
    confidence_note: 'Deal existence and closing are confirmed by CoreWeave\'s own releases: the March 4, 2025 announcement (PRNewswire; verified full text on 2026-10-17 - it states NO purchase price) and the May 5, 2025 "CoreWeave Completes Acquisition of Weights & Biases" release confirming completion after the IPO, within the H1 2025 window press reports anticipated. Amount: the companies did not disclose terms (Reuters, March 5, 2025: "The companies did not disclose financial terms of the deal"); the ~$1.7B figure is The Information\'s reporting, echoed by Reuters (https://www.reuters.com/markets/deals/nvidia-backed-cloud-firm-coreweave-acquire-ai-developer-platform-weights-biases-2025-03-05), TechCrunch and CoinDesk, so amount_value carries the press figure with amount_disclosed=false.',
    is_published: true,
    published_at: '2025-03-04T12:00:00Z',
    last_reviewed_at: '2026-10-17T00:00:00Z',
    parties: [
      {
        id: 'p-ma3-wb-1',
        deal_id: '20000000-0000-0000-0000-000000000141',
        company_id: '00000000-0000-0000-0000-000000000002',
        role: 'investor',
        direction_note: 'Acquirer; first major acquisition after its March 2025 IPO, folding W&B tooling into its AI cloud platform',
        company: findCompany('00000000-0000-0000-0000-000000000002'),
      },
      {
        id: 'p-ma3-wb-2',
        deal_id: '20000000-0000-0000-0000-000000000141',
        company_id: '00000000-0000-0000-0000-000000000100',
        role: 'investee',
        direction_note: 'Acquired ML developer platform; team joined CoreWeave and W&B became the software/developer-tooling layer of the platform',
        company: WEIGHTS_BIASES,
      },
    ],
    sources: [
      {
        deal_id: '20000000-0000-0000-0000-000000000141',
        source_id: '10000000-0000-0000-0000-000000000200',
        supporting_note: 'Official CoreWeave announcement (March 4, 2025) of the agreement to acquire Weights & Biases (terms not stated).',
        is_primary_support: true,
        source: SRC_WB_ANNOUNCE_PR,
      },
      {
        deal_id: '20000000-0000-0000-0000-000000000141',
        source_id: '10000000-0000-0000-0000-000000000201',
        supporting_note: 'Official CoreWeave completion release (May 5, 2025) confirming the acquisition closed.',
        is_primary_support: true,
        source: SRC_WB_COMPLETE_PR,
      },
    ],
  },
  {
    id: '20000000-0000-0000-0000-000000000142',
    slug: 'meta-acquires-playai-2025',
    title: 'Meta Acquires Voice-AI Startup PlayAI; Entire Team Joins Meta Superintelligence Labs',
    summary: 'Meta completed its acquisition of PlayAI, the voice-AI startup behind human-sounding voice generation, voice cloning and conversational voice agents, first reported as a completed deal by Bloomberg on July 11, 2025 and confirmed by a Meta spokesperson. An internal memo said the entire PlayAI team would join Meta the following week, reporting to voice-AI veteran Johan Schalkwyk (who had just joined Meta from Sesame AI after overseeing speech AI research at Google), with PlayAI\'s "natural voices" work mapped onto Meta AI characters, Meta AI, wearables and audio content creation. Financial terms were not disclosed; the deal continued Meta\'s mid-2025 superintelligence talent spree (Scale AI/Alexandr Wang, aggressive OpenAI recruiting).',
    deal_type: 'acquisition',
    status: 'closed',
    announcement_date: '2025-07-11',
    effective_date: null,
    maturity_date: null,
    amount_value: null,
    amount_currency: 'USD',
    amount_basis: null,
    amount_period: 'Terms not disclosed',
    amount_disclosed: false,
    geography: 'United States',
    evidence_level: 'reported_secondary',
    confidence_note: 'The completed acquisition is reported by Bloomberg (July 11, 2025: Meta "has completed a deal to acquire PlayAI"; Meta spokesperson confirmed; internal memo reviewed) and echoed by TechCrunch (July 13, 2025, https://techcrunch.com/2025/07/13/meta-acquires-voice-startup-play-ai), Business Standard and Engadget; Meta published no release and neither party disclosed terms, so per ledger policy the amount stays null. Completion timing is Bloomberg-reported rather than SEC-confirmed (PlayAI was private and immaterial to Meta\'s filings); the team-joining date ("next week") is from the leaked memo. Talks were rumored since late June 2025 (Bloomberg, echoed by TechCrunch).',
    is_published: true,
    published_at: '2025-07-11T12:00:00Z',
    last_reviewed_at: '2026-10-17T00:00:00Z',
    parties: [
      {
        id: 'p-ma3-playai-1',
        deal_id: '20000000-0000-0000-0000-000000000142',
        company_id: '00000000-0000-0000-0000-000000000017',
        role: 'investor',
        direction_note: 'Acquirer; absorbed the whole PlayAI team into Meta Superintelligence Labs to bolster voice features across Meta AI, AI Characters, wearables and audio',
        company: findCompany('00000000-0000-0000-0000-000000000017'),
      },
      {
        id: 'p-ma3-playai-2',
        deal_id: '20000000-0000-0000-0000-000000000142',
        company_id: '00000000-0000-0000-0000-000000000091',
        role: 'investee',
        direction_note: 'Acquired voice-AI startup; entire team joined Meta the week after July 11, 2025 reporting to Johan Schalkwyk',
        company: PLAY_AI,
      },
    ],
    sources: [
      {
        deal_id: '20000000-0000-0000-0000-000000000142',
        source_id: '10000000-0000-0000-0000-000000000205',
        supporting_note: 'Bloomberg first reported the completed PlayAI acquisition with Meta spokesperson confirmation and the team-transfer memo.',
        is_primary_support: true,
        source: SRC_PLAYAI_BLOOMBERG,
      },
    ],
  },
  {
    id: '20000000-0000-0000-0000-000000000143',
    slug: 'microsoft-inflection-ai-license-hiring-2024',
    title: 'Microsoft Pays ~$650M to License Inflection AI Models and Hire Its Founders and Staff - Not an Acquisition',
    summary: 'On March 19, 2024 Microsoft announced it had hired Inflection AI co-founders Mustafa Suleyman (to run the newly created Microsoft AI consumer unit as CEO) and Karén Simonyan (chief scientist), along with most of the ~70-person team. Days later, Reuters and Bloomberg reported (person familiar; The Information first) that Microsoft agreed to pay Inflection about $650 million in cash - roughly $620M to license Inflection\'s models and ~$30M to waive legal claims arising from the mass hiring - in an unusual structure that gave Microsoft the models and the people without buying the company. Inflection\'s investors were made whole with a modest return (early-round investors around 1.5x per Reuters), no equity changed hands, and Inflection AI continued operating its Pi chatbot independently. The structure drew regulatory attention in both the US (a reported FTC document inquiry) and the UK (a CMA merger review, cleared in September 2024). The license-plus-hire template pioneered here was quickly copied (Amazon-Adept, Google-Character.AI, Meta-Scale AI).',
    deal_type: 'strategic_partnership',
    status: 'closed',
    announcement_date: '2024-03-19',
    effective_date: null,
    maturity_date: null,
    amount_value: 650000000,
    amount_currency: 'USD',
    amount_basis: 'contract_value',
    amount_period: '~$650M reported: ~$620M non-exclusive model license + ~$30M legal-claims waiver',
    amount_disclosed: false,
    geography: 'United States',
    evidence_level: 'reported_secondary',
    confidence_note: 'The hiring and new Microsoft AI unit are officially confirmed (Microsoft\'s March 19, 2024 announcement); the financial terms are NOT officially disclosed by either company - the ~$650M figure comes from Reuters and Bloomberg (March 21, 2024, person familiar), after The Information first reported it, with the ~$620M license / ~$30M waiver split reported by TechCrunch via The Information (https://techcrunch.com/2024/03/21/microsoft-inflection-ai-investors-reid-hoffman-bill-gates/). Recorded with status \'closed\' (the license was agreed and the hires onboarded in March 2024) and evidence \'reported_secondary\' accordingly. Regulatory aftermath: UK CMA launched a merger inquiry and cleared it in September 2024; a reported FTC document probe followed (WSJ via MarketWatch). Explicitly NOT an acquisition: Microsoft bought no Inflection equity and Inflection continued as an independent company running Pi.',
    is_published: true,
    published_at: '2024-03-19T12:00:00Z',
    last_reviewed_at: '2026-10-17T00:00:00Z',
    parties: [
      {
        id: 'p-ma3-infl-1',
        deal_id: '20000000-0000-0000-0000-000000000143',
        company_id: '00000000-0000-0000-0000-000000000003',
        role: 'counterparty',
        direction_note: 'Paid ~$650M (reported) to license Inflection\'s models and onboard co-founders Suleyman/Simonyan plus most staff into the new Microsoft AI unit; took no equity',
        company: findCompany('00000000-0000-0000-0000-000000000003'),
      },
      {
        id: 'p-ma3-infl-2',
        deal_id: '20000000-0000-0000-0000-000000000143',
        company_id: '00000000-0000-0000-0000-000000000102',
        role: 'partner',
        direction_note: 'Licensed its models to Microsoft and saw most of its staff hired away; investors made whole and the company continued operating Pi independently',
        company: INFLECTION_AI,
      },
    ],
    sources: [
      {
        deal_id: '20000000-0000-0000-0000-000000000143',
        source_id: '10000000-0000-0000-0000-000000000206',
        supporting_note: 'Reuters reports the ~$650M license-plus-hire structure and the Suleyman/Simonyan move (The Information first reported).',
        is_primary_support: true,
        source: SRC_INFLECTION_REUTERS,
      },
    ],
  },
  {
    id: '20000000-0000-0000-0000-000000000144',
    slug: 'nvidia-acquires-hugging-face-2026',
    title: 'NVIDIA Agrees to Acquire Hugging Face for ~$12.93 Billion (Signed; Close Expected H1 2027)',
    summary: 'On September 2, 2026 NVIDIA entered a definitive agreement to acquire Hugging Face, Inc. - the open-source AI platform hosting roughly 3 million models, a half-million datasets and 1 million applications used by over 18 million developers - for approximately $12.93 billion: about $11.9 billion payable to Hugging Face stockholders plus an equity-based retention program of up to about $1.0 billion for employees joining NVIDIA. Announced September 3, 2026 (NVIDIA Form 8-K; Jensen Huang blog), the deal is a massive software/platform bet on open AI models and NVIDIA\'s second-largest purchase ever, after the ~$20B Groq asset purchase in December 2025. NVIDIA committed publicly to keep Hugging Face an open platform: model makers and developers choose their models, frameworks, clouds and computing platforms, NVIDIA compute will not be required, and support for other silicon vendors continues. Hugging Face CEO Clément Delangue told CNBC the company approached Huang over the summer and a deal came together weeks later. Closing is expected in the first half of 2027, subject to regulatory approvals.',
    deal_type: 'acquisition',
    status: 'signed',
    announcement_date: '2026-09-03',
    effective_date: null,
    maturity_date: null,
    amount_value: 12930300000,
    amount_currency: 'USD',
    amount_basis: 'equity_valuation',
    amount_period: 'Total ~$12.93B: ~$11.9B purchase price to Hugging Face stockholders (subject to adjustments) + up to ~$1.0B employee equity-based retention',
    amount_disclosed: true,
    geography: 'United States',
    evidence_level: 'announced_not_completed',
    confidence_note: 'Definitive agreement confirmed by NVIDIA\'s own SEC filing: Form 8-K filed September 3, 2026 (Item 8.01; agreement entered September 2, 2026, signed by CFO Colette Kress) stating the ~$11.9B purchase price, up to ~$1.0B retention, H1 2027 expected close and the open-platform/non-NVIDIA-silicon commitments. NVIDIA\'s blog (Jensen Huang, September 3, 2026) states the total as $12,930,300,000 (https://blogs.nvidia.com/blog/nvidia-to-acquire-hugging-face/). Hard fact-check: CONFIRMED by the primary 8-K plus at least three strong independent outlets - Reuters (recorded source), CNBC (https://www.cnbc.com/2026/09/03/nvidia-agrees-to-buy-hugging-face-for-almost-13-billion-ai-expansion.html, which also notes the ranking after the ~$20B December 2025 Groq asset purchase), NPR and TechCrunch (https://techcrunch.com/2026/09/03/nvidia-confirms-it-will-buy-hugging-face-for-12-9-billion/). NOT yet closed as of the October 17, 2026 review: recorded with status \'signed\' and evidence \'announced_not_completed\'; ownership transfers at the expected H1 2027 close, so the platform remains an independent company for now.',
    is_published: true,
    published_at: '2026-09-03T12:00:00Z',
    last_reviewed_at: '2026-10-17T00:00:00Z',
    parties: [
      {
        id: 'p-ma3-nvda-hf-1',
        deal_id: '20000000-0000-0000-0000-000000000144',
        company_id: '00000000-0000-0000-0000-000000000001',
        role: 'investor',
        direction_note: 'Acquirer under a definitive agreement signed September 2, 2026; paying ~$11.9B to stockholders plus up to ~$1B retention; commits to keeping the platform open and supportive of competing silicon',
        company: findCompany('00000000-0000-0000-0000-000000000001'),
      },
      {
        id: 'p-ma3-nvda-hf-2',
        deal_id: '20000000-0000-0000-0000-000000000144',
        company_id: '00000000-0000-0000-0000-000000000103',
        role: 'investee',
        direction_note: 'Pending acquiree: open-source AI hub to remain an open platform post-close, with stockholders paid ~$11.9B and employees offered up to ~$1B retention equity',
        company: HUGGING_FACE,
      },
    ],
    sources: [
      {
        deal_id: '20000000-0000-0000-0000-000000000144',
        source_id: '10000000-0000-0000-0000-000000000199',
        supporting_note: 'NVIDIA Form 8-K (Item 8.01) disclosing the definitive agreement, price components and H1 2027 expected close.',
        is_primary_support: true,
        source: SRC_NVDA_HF_8K,
      },
      {
        deal_id: '20000000-0000-0000-0000-000000000144',
        source_id: '10000000-0000-0000-0000-000000000202',
        supporting_note: 'Reuters independent corroboration of the ~$12.93B deal terms and the open-platform commitment.',
        is_primary_support: false,
        source: SRC_NVDA_HF_REUTERS,
      },
    ],
  },
  {
    id: '20000000-0000-0000-0000-000000000145',
    slug: 'spacex-acquires-xai-2026',
    title: 'SpaceX Acquires xAI in All-Stock ~$1.25T Merger (Signed January 31, 2026; Closed February 2, 2026)',
    summary: 'Elon Musk combined his rocket, satellite-internet and AI empires: SpaceX signed an Agreement and Plan of Merger and Reorganization with X.AI Holdings Corp. (xAI) on January 31, 2026 and completed the all-stock merger on February 2, 2026, announced the same day - making xAI (developer of Grok and owner of the X social platform following the 2025 xAI-X merger) a wholly owned SpaceX subsidiary through a two-step Nevada merger (K2 Merger Sub Inc., then K2 Merger Sub 2 LLC). The transaction valued xAI at approximately $250 billion within a combined company valued around $1 trillion, with the combined entity reported at roughly $1.25 trillion ahead of a planned IPO (Reuters, citing Bloomberg, called it the biggest M&A transaction of all time), positioning the combination to fund Musk\'s ambitions for data centers in space. The structure was an intended tax-free reorganization (IRC Section 368) that avoided repayment triggers on xAI\'s debt and shielded SpaceX from xAI legal liabilities, per Reuters\' follow-up on completed-deal mechanics. Musk framed the merger as "the most ambitious, vertically-integrated innovation engine on (and off) Earth, with AI, rockets, space-based internet" and the X platform.',
    deal_type: 'acquisition',
    status: 'closed',
    announcement_date: '2026-02-02',
    effective_date: '2026-02-02',
    maturity_date: null,
    amount_value: 250000000000,
    amount_currency: 'USD',
    amount_basis: 'equity_valuation',
    amount_period: 'All-stock merger valuing xAI at ~$250B (SpaceX ~$1.0T; ~$1.25T combined valuation reported ahead of planned IPO)',
    amount_disclosed: true,
    geography: 'United States',
    evidence_level: 'confirmed_primary',
    confidence_note: 'Confirmed at both ends: the Agreement and Plan of Merger and Reorganization dated January 31, 2026 (recorded source; signed by SpaceX CFO Bret Johnsen and Elon Musk as President of X.AI Holdings Corp.) fixes the closing for February 2, 2026 (Section 1.3) in a two-step Nevada merger with intended 368 tax-free reorganization treatment, and completion is separately evidenced by Nevada public filings the same day - CNBC reported Space Exploration Technologies Corp. as the new "managing member" of X.AI Holdings (https://www.cnbc.com/2026/02/02/elon-musk-spacex-xai-ipo.html) - plus Musk\'s own announcement and contemporaneous coverage by Reuters (https://www.reuters.com/business/musks-spacex-merge-with-xai-combined-valuation-125-trillion-bloomberg-news-2026-02-02/; xAI at $250B in a ~$1.25T combined valuation, "biggest M&A transaction of all time"), AP (https://apnews.com/40e21d8df6c50ba21b3fbf0f10362962 - "Elon Musk says he is merging SpaceX with his AI company xAI") and The Guardian. Reuters\' February 6, 2026 follow-up (https://www.reuters.com/business/finance/sale-xai-comes-with-tax-financial-legal-benefits-xai-spacex-investors-2026-02-06/) documents the completed deal\'s triangular-merger mechanics (debt-avoidance, liability shielding, tax-free reorg). Because SpaceX was not yet an SEC reporter at closing there is no completion 8-K: the \'closed\' status rests on the agreement\'s fixed closing date, the Nevada records reported by CNBC, and the company/Musk announcements; the merger agreement was later SEC-filed as Exhibit 2.1 to SpaceX\'s S-1 (CIK 1181412), corroborated by SpaceX\'s June 16, 2026 Form 8-K noting the February acquisition.',
    is_published: true,
    published_at: '2026-02-02T21:00:00Z',
    last_reviewed_at: '2026-10-17T00:00:00Z',
    parties: [
      {
        id: 'p-ma3-spx-xai-1',
        company_id: '00000000-0000-0000-0000-000000000104',
        deal_id: '20000000-0000-0000-0000-000000000145',
        role: 'investor',
        direction_note: 'Acquirer: absorbed xAI as a wholly owned subsidiary via a two-step Nevada merger (K2 Merger Subs), becoming managing member of X.AI Holdings; the largest M&A transaction on record',
        company: SPACEX,
      },
      {
        id: 'p-ma3-spx-xai-2',
        company_id: '00000000-0000-0000-0000-000000000018',
        deal_id: '20000000-0000-0000-0000-000000000145',
        role: 'investee',
        direction_note: 'Acquired AI company (Grok, X platform): shareholders exchanged xAI shares for SpaceX stock in a tax-free reorganization valuing xAI at ~$250B',
        company: findCompany('00000000-0000-0000-0000-000000000018'),
      },
    ],
    sources: [
      {
        deal_id: '20000000-0000-0000-0000-000000000145',
        source_id: '10000000-0000-0000-0000-000000000203',
        supporting_note: 'SEC-filed merger agreement (January 31, 2026, Exhibit 2.1 to SpaceX\'s S-1): parties, two-step merger structure and the February 2, 2026 closing.',
        is_primary_support: true,
        source: SRC_SPACEX_XAI_MERGER_EX,
      },
      {
        deal_id: '20000000-0000-0000-0000-000000000145',
        source_id: '10000000-0000-0000-0000-000000000204',
        supporting_note: 'CNBC on the same-day announcement and the completion evidence in Nevada public records (SpaceX as managing member of X.AI Holdings).',
        is_primary_support: false,
        source: SRC_SPACEX_XAI_CNBC,
      },
    ],
  },
];

export const EXTRA_RELATIONSHIPS: Relationship[] = [
  {
    id: '30000000-0000-0000-0000-000000000101',
    from_company_id: '00000000-0000-0000-0000-000000000002',
    to_company_id: '00000000-0000-0000-0000-000000000100',
    relationship_type: 'equity_shareholder',
    start_date: '2025-05-05',
    end_date: null,
    description: 'CoreWeave owns Weights & Biases following its acquisition, completed May 5, 2025 (agreed March 4, 2025; press-reported ~$1.7B, terms officially undisclosed); W&B tooling is positioned as the developer-platform entry point into the CoreWeave Cloud.',
    evidence_level: 'confirmed_primary',
    is_published: true,
    from_company: findCompany('00000000-0000-0000-0000-000000000002'),
    to_company: WEIGHTS_BIASES,
    sources: [
      {
        relationship_id: '30000000-0000-0000-0000-000000000101',
        source_id: '10000000-0000-0000-0000-000000000201',
        supporting_note: 'CoreWeave\'s official completion release of the W&B acquisition (May 5, 2025).',
        source: SRC_WB_COMPLETE_PR,
      },
      {
        relationship_id: '30000000-0000-0000-0000-000000000101',
        source_id: '10000000-0000-0000-0000-000000000200',
        supporting_note: 'CoreWeave\'s original announcement of the acquisition agreement (March 4, 2025).',
        source: SRC_WB_ANNOUNCE_PR,
      },
    ],
  },
  {
    id: '30000000-0000-0000-0000-000000000102',
    from_company_id: '00000000-0000-0000-0000-000000000017',
    to_company_id: '00000000-0000-0000-0000-000000000091',
    relationship_type: 'equity_shareholder',
    start_date: '2025-07-11',
    end_date: null,
    description: 'Meta completed its acquisition of PlayAI (reported July 11, 2025); the entire PlayAI team joined Meta Superintelligence Labs reporting to Johan Schalkwyk. Terms undisclosed; ownership inferred from Bloomberg\'s "completed a deal to acquire" reporting, so evidence is reported_secondary.',
    evidence_level: 'reported_secondary',
    is_published: true,
    from_company: findCompany('00000000-0000-0000-0000-000000000017'),
    to_company: PLAY_AI,
    sources: [
      {
        relationship_id: '30000000-0000-0000-0000-000000000102',
        source_id: '10000000-0000-0000-0000-000000000205',
        supporting_note: 'Bloomberg\'s report of the completed PlayAI acquisition and team transfer.',
        source: SRC_PLAYAI_BLOOMBERG,
      },
    ],
  },
  {
    id: '30000000-0000-0000-0000-000000000103',
    from_company_id: '00000000-0000-0000-0000-000000000003',
    to_company_id: '00000000-0000-0000-0000-000000000102',
    relationship_type: 'strategic_partner',
    start_date: '2024-03-19',
    end_date: null,
    description: 'Microsoft\'s ~$650M license-plus-hire arrangement with Inflection AI (March 2024): Microsoft licenses Inflection\'s models (~$620M reported non-exclusive license) after hiring co-founders Mustafa Suleyman and Karen Simonyan plus most of the ~70-person team; recorded as strategic_partner rather than equity_shareholder because Microsoft took no Inflection equity and the company continued operating independently.',
    evidence_level: 'reported_secondary',
    is_published: true,
    from_company: findCompany('00000000-0000-0000-0000-000000000003'),
    to_company: INFLECTION_AI,
    sources: [
      {
        relationship_id: '30000000-0000-0000-0000-000000000103',
        source_id: '10000000-0000-0000-0000-000000000206',
        supporting_note: 'Reuters on the ~$650M licensing deal and mass hiring.',
        source: SRC_INFLECTION_REUTERS,
      },
    ],
  },
  {
    id: '30000000-0000-0000-0000-000000000104',
    from_company_id: '00000000-0000-0000-0000-000000000101',
    to_company_id: '00000000-0000-0000-0000-000000000002',
    relationship_type: 'infrastructure_host',
    start_date: '2024-06-03',
    end_date: null,
    description: 'Core Scientific hosts CoreWeave\'s NVIDIA GPU/HPC operations under a series of long-duration colocation contracts beginning with ~200 MW announced June 2024 and expanded to ~840 gross MW supporting CoreWeave HPC contracts by July 2025 (funded by CoreWeave capex with revenue credits); the commercial relationship survived the terminated merger on October 30, 2025, with both companies publicly committing to continue the partnership.',
    evidence_level: 'confirmed_primary',
    is_published: true,
    from_company: CORE_SCIENTIFIC,
    to_company: findCompany('00000000-0000-0000-0000-000000000002'),
    sources: [
      {
        relationship_id: '30000000-0000-0000-0000-000000000104',
        source_id: '10000000-0000-0000-0000-000000000197',
        supporting_note: 'The July 7, 2025 SEC-filed joint release describes ~840 existing gross MW supporting CoreWeave\'s HPC contracts and Core Scientific CEO Adam Sullivan calling CoreWeave a "longstanding partner".',
        source: SRC_CORZ_ANNOUNCE_8K,
      },
      {
        relationship_id: '30000000-0000-0000-0000-000000000104',
        source_id: '10000000-0000-0000-0000-000000000198',
        supporting_note: 'Core Scientific\'s Form 8-K reporting the failed stockholder vote and effective-immediately termination documents the post-vote state: the company remains an independent Nasdaq-listed operator, and same-day announcements from both companies committed to continuing the commercial partnership (CoreWeave: "look forward to continuing our commercial partnership" - https://investors.coreweave.com/news/news-details/2025/CoreWeave-Comments-on-Core-Scientific-Stockholder-Vote/default.aspx).',
        source: SRC_CORZ_TERM_8K,
      },
    ],
  },
  {
    id: '30000000-0000-0000-0000-000000000105',
    from_company_id: '00000000-0000-0000-0000-000000000001',
    to_company_id: '00000000-0000-0000-0000-000000000103',
    relationship_type: 'other',
    start_date: '2026-09-02',
    end_date: null,
    description: 'NVIDIA signed a definitive agreement on September 2, 2026 to acquire Hugging Face for ~$12.93B (~$11.9B to stockholders plus up to ~$1.0B employee retention); closing is expected in the first half of 2027 pending regulatory approvals, so NVIDIA is a prospective - not yet current - equity holder. Typed as \'other\' rather than \'equity_shareholder\' until the acquisition completes.',
    evidence_level: 'announced_not_completed',
    is_published: true,
    from_company: findCompany('00000000-0000-0000-0000-000000000001'),
    to_company: HUGGING_FACE,
    sources: [
      {
        relationship_id: '30000000-0000-0000-0000-000000000105',
        source_id: '10000000-0000-0000-0000-000000000199',
        supporting_note: 'NVIDIA\'s Form 8-K disclosing the definitive agreement, price components, open-platform commitments and H1 2027 expected close.',
        source: SRC_NVDA_HF_8K,
      },
    ],
  },
  {
    id: '30000000-0000-0000-0000-000000000106',
    from_company_id: '00000000-0000-0000-0000-000000000104',
    to_company_id: '00000000-0000-0000-0000-000000000018',
    relationship_type: 'equity_shareholder',
    start_date: '2026-02-02',
    end_date: null,
    description: 'Space Exploration Technologies Corp. (SpaceX) completed its all-stock acquisition of X.AI Holdings Corp. (xAI) on February 2, 2026 via a two-step Nevada merger (K2 Merger Subs), making xAI - the Grok developer that owns the X social platform - a wholly owned SpaceX subsidiary (SpaceX is also the managing member of X.AI Holdings per Nevada filings reported by CNBC).',
    evidence_level: 'confirmed_primary',
    is_published: true,
    from_company: SPACEX,
    to_company: findCompany('00000000-0000-0000-0000-000000000018'),
    sources: [
      {
        relationship_id: '30000000-0000-0000-0000-000000000106',
        source_id: '10000000-0000-0000-0000-000000000203',
        supporting_note: 'SEC-filed merger agreement establishing the two-step merger with xAI surviving as a wholly owned SpaceX subsidiary, closed February 2, 2026.',
        source: SRC_SPACEX_XAI_MERGER_EX,
      },
      {
        relationship_id: '30000000-0000-0000-0000-000000000106',
        source_id: '10000000-0000-0000-0000-000000000204',
        supporting_note: 'CNBC on the completion (Nevada records; SpaceX as managing member of X.AI Holdings) and the announcement.',
        source: SRC_SPACEX_XAI_CNBC,
      },
    ],
  },
];
