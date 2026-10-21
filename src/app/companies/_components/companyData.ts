/**
 * Company profiles shown on /companies.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * Sourcing rules (re-verified 2026-10-19, data fact-check lane)
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * `committed` / `disclosedDealsCount` are ledger aggregates over
 * `src/data/deals.json` (169 records):
 *   - `totalVolumeUsd`  = sum of the disclosed amounts of the records where the
 *                          company is a named party (it appears in the deal title).
 *   - `disclosedDealsCount` = number of ledger records that mention the company
 *                          (matches what /ledger?search= returns).
 *   Multi-party umbrella deals (Stargate, QTS, NVIDIA/OpenAI) are therefore
 *   counted once per named party — the same money seen from different sides.
 *
 * `valuationUsd` = latest market capitalisation for listed names (EDGAR
 * cover-page share count × the 16 Oct 2026 close, per Yahoo Finance) and the
 * latest reported private valuation for private names.
 *
 * `runRateRevenueUsd` = the company's own latest run-rate disclosure where one
 * exists (ARR, guidance), otherwise trailing-twelve-month revenue from the most
 * recent SEC filing. The basis is named in the exposure text of each profile.
 *
 * `psMultiple` = valuationUsd ÷ runRateRevenueUsd, on the same basis.
 *
 * `debtInvolvedUsd` = the sum of the tranches listed for the company. Named
 * facilities come from our ledger; balance-sheet tranches are the borrowings
 * reported in the company's latest 10-K / 10-Q.
 *
 * Every corrected figure carries a dated source comment. Nothing on this page
 * is investment advice.
 */
export interface CompanyDebtTranche {
  label: string;
  amountUsd: number;
  type: "Senior Notes" | "Convertible Debt" | "Bank Revolver" | "Asset-Backed Facility" | "SPV Debt" | "Project Finance";
  creditors?: string;
  notes?: string;
}

export interface CompanyProfile {
  name: string;
  ticker?: string;
  sector: "Hyperscalers" | "GPU Neoclouds" | "Frontier Labs" | "Private Credit & Infra" | "Semiconductor" | "Nuclear & Energy";
  role: string;
  disclosedDealsCount: number;
  totalVolumeUsd: number;
  debtInvolvedUsd: number;
  debtTranches: CompanyDebtTranche[];
  valuationUsd: number;
  runRateRevenueUsd?: number;
  psMultiple?: number;
  circularityConnections: string[];
  circularRiskLevel: "Severe (Circular)" | "High (Circular)" | "Elevated" | "Moderate" | "Low (Arm's Length)";
  circularitySummary: string;
  riskTier: "Critical" | "High" | "Elevated" | "Guarded";
  exposureSummary: string;
  polymarketOdds?: {
    marketName: string;
    oddsDisplay: string;
    url: string;
  };
}

export const COMPANIES: CompanyProfile[] = [
  // 1. ANTHROPIC
  {
    name: "Anthropic",
    ticker: "Private (S-1 Filed)",
    sector: "Frontier Labs",
    role: "Frontier Foundation Model Developer & Claude Creator",
    // Ledger aggregates re-derived 2026-10-19 from src/data/deals.json.
    disclosedDealsCount: 16,
    totalVolumeUsd: 224_500_000_000,
    debtInvolvedUsd: 57_000_000_000,
    debtTranches: [
      {
        label: "Broadcom Custom TPU Underwriting Facility",
        amountUsd: 42_000_000_000,
        type: "Convertible Debt",
        creditors: "Broadcom Inc.",
        // Ledger deal-002 (Anthropic S-1, 28 Sep 2026): Broadcom lends up to $42.0B
        // of convertible notes against a five-year, $125.2B TPU capacity commitment.
        notes: "Underwrites 5-year $125.2B custom TPU compute lease, convertible upon qualified liquidity event."
      },
      {
        label: "Multi-Bank Syndicated Revolving Credit Line",
        amountUsd: 15_000_000_000,
        type: "Bank Revolver",
        creditors: "Morgan Stanley, Goldman Sachs, JPMorgan, Citi",
        // Ledger deal-159 (3 Sep 2026). $518B of cloud, compute and infrastructure
        // commitments, nearly all non-cancellable — Reuters, 14 Oct 2026.
        notes: "Secured credit facility backstopping $518B in cumulative long-term cloud datacenter commitments."
      }
    ],
    // $2.0T IPO target; last closed mark $965B Series H (May 2026).
    // FT/Guardian/Reuters, Sep–Oct 2026.
    valuationUsd: 2_000_000_000_000,
    // Annualized revenue run rate topped $65B by end-July 2026, up from $47B in
    // May — Bloomberg / CNBC / Reuters, 17 Aug 2026.
    runRateRevenueUsd: 65_000_000_000,
    psMultiple: 30.8,
    circularityConnections: ["Broadcom", "Amazon AWS", "Google", "Morgan Stanley", "Blackstone"],
    circularRiskLevel: "Severe (Circular)",
    circularitySummary: "Amazon ($8B) and Google ($3B) have put $11B of equity into Anthropic while Anthropic has committed $518B of cloud, compute and infrastructure to AWS, Google, Microsoft, Broadcom and SpaceX, nearly all of it non-cancellable. Broadcom underwrites $42B of convertible debt tied to custom silicon.",
    riskTier: "Critical",
    exposureSummary: "$57.0B verified debt across 2 major facilities: $42B convertible note facility from Broadcom and $15B multi-bank revolver against $518B in future cloud liabilities. Pre-IPO valuation target reaches $2.0T (following the $965B Series H) on $65.0B ARR (30.8× multiple).",
    polymarketOdds: {
      marketName: "Anthropic Acquired Before 2027",
      // Live Polymarket sync, 19 Oct 2026: 2.4% (was 2.6%).
      oddsDisplay: "2.4¢ (2.4%)",
      url: "https://polymarket.com/event/anthropic-acquired-before-2027?r=AIbubble"
    }
  },

  // 2. OPENAI
  {
    name: "OpenAI",
    // Confidential IPO filing (June 2026); listing now expected in 2027.
    // CNBC DevDay live blog, 29 Sep 2026.
    ticker: "Private (IPO Filed)",
    sector: "Frontier Labs",
    role: "Frontier Foundation Model Developer (ChatGPT & Stargate)",
    disclosedDealsCount: 29,
    totalVolumeUsd: 917_400_000_000,
    debtInvolvedUsd: 4_000_000_000,
    debtTranches: [
      {
        label: "Syndicated Revolving Credit Facility",
        amountUsd: 4_000_000_000,
        type: "Bank Revolver",
        creditors: "JPMorgan Chase, Citi, Goldman Sachs, Morgan Stanley, Santander, Wells Fargo, SMBC, UBS, HSBC",
        // OpenAI press release / CNBC / Reuters, 3 Oct 2024: undrawn at closing.
        // Still not a record in our ledger — see the note in the data report.
        notes: "Unsecured revolving credit line, undrawn when it was established in October 2024; no drawdown has been reported since."
      }
    ],
    // Early talks at more than $1.2T post-money — Bloomberg, 15–16 Sep 2026;
    // $30B pre-IPO raise targeting ~$1.4T — The Information, 29 Sep 2026.
    valuationUsd: 1_200_000_000_000,
    // Annualized revenue approaching $50B at end-September on OpenAI's own basis
    // (the $68–70B figure was a partner-gross-up) — FT, 8 Oct 2026.
    runRateRevenueUsd: 50_000_000_000,
    psMultiple: 24.0,
    circularityConnections: ["Microsoft", "Oracle", "NVIDIA", "SoftBank", "Crusoe Energy"],
    circularRiskLevel: "High (Circular)",
    circularitySummary: "Microsoft's $13B+ of equity and credits, plus a $250B incremental Azure commitment, are spent on Azure compute; Oracle and Crusoe issue debt to construct gigawatt campuses leased by OpenAI.",
    riskTier: "High",
    exposureSummary: "$4.0B bank revolver at 24.0× P/S revenue multiple on $50.0B ARR. Last closed mark $852B (Mar 2026); talks now at more than $1.2T (Bloomberg, Sep 16 2026) with a $30B raise targeting about $1.4T. Anchor tenant driving the $500B Stargate program with multi-year compute obligations.",
    polymarketOdds: {
      marketName: "OpenAI IPO by Dec 2026",
      // Live Polymarket sync, 19 Oct 2026: 4.3% (unchanged).
      oddsDisplay: "4.3¢ (4.3%)",
      url: "https://polymarket.com/event/openai-ipo-by?r=AIbubble"
    }
  },

  // 3. ORACLE
  {
    name: "Oracle",
    ticker: "ORCL",
    sector: "Hyperscalers",
    role: "Hyperscaler & Compute Debt Anchor",
    disclosedDealsCount: 9,
    totalVolumeUsd: 340_000_000_000,
    // Total borrowings $130.1B at FY2026 year-end (May 31, 2026) — Oracle 10-K,
    // via SEC EDGAR XBRL (DebtInstrumentCarryingAmount, 2026-05-31).
    debtInvolvedUsd: 130_100_000_000,
    debtTranches: [
      {
        label: "Dedicated AI Infrastructure Senior Notes",
        amountUsd: 18_000_000_000,
        type: "Senior Notes",
        creditors: "Institutional Bond Investors",
        // Ledger deal-052.
        notes: "Multi-tranche fixed-rate senior notes specifically earmarked for GPU cluster buildouts."
      },
      {
        label: "Corporate Senior Unsecured Debt Portfolio",
        amountUsd: 112_100_000_000,
        type: "Senior Notes",
        creditors: "Public Debt Markets / Syndicated Credit",
        // Remainder of Oracle's $130.1B of borrowings (10-K, May 31 2026) after the
        // $18.0B AI notes. 5Y CDS closed at a record 288bp on Oct 15 2026, up
        // from 261bp a week earlier — S&P Global Market Intelligence / LSEG.
        notes: "Total corporate borrowings of $130.1B at FY2026 year-end; 5Y CDS at a record 288bp on Oct 15, 2026, against an 81bp baseline."
      }
    ],
    // 3.0315B shares (10-Q cover, Sep 7 2026) × $128.23 close, Oct 16 2026.
    valuationUsd: 388_700_000_000,
    // TTM revenue $67.5B through Aug 31, 2026 — Oracle 10-Q, via EDGAR XBRL.
    runRateRevenueUsd: 67_500_000_000,
    psMultiple: 5.8,
    circularityConnections: ["OpenAI", "Cohere", "CoreWeave", "NVIDIA"],
    circularRiskLevel: "Severe (Circular)",
    circularitySummary: "Constructing massive gigawatt AI datacenters with fixed balance-sheet debt on behalf of venture-backed model labs (OpenAI, Cohere) without long-term sovereign guarantees. OpenAI alone accounts for roughly half of Oracle's $638B of remaining performance obligations.",
    riskTier: "Critical",
    exposureSummary: "The financial system's primary debt thermometer. Carries $130.1B of borrowings; 5Y CDS hit a record 288bps on Oct 15, 2026 as fixed-income markets price GPU infrastructure refinancing saturation. S&P cut the long-term rating to BBB- in July 2026.",
  },

  // 4. COREWEAVE
  {
    name: "CoreWeave",
    ticker: "CRWV",
    sector: "GPU Neoclouds",
    role: "Specialized GPU Cloud Provider",
    disclosedDealsCount: 14,
    totalVolumeUsd: 96_340_000_000,
    // Five ledger facilities: deal-003, -018, -028, -138, -155. deal-161 was
    // adjudicated a double count on 2026-10-19 (amount_usd 0, is_debt false) and
    // is no longer carried here.
    debtInvolvedUsd: 25_087_500_000,
    debtTranches: [
      {
        label: "Delayed Draw Term Loan (DDTL 4.0)",
        amountUsd: 8_500_000_000,
        type: "Bank Revolver",
        creditors: "Blackstone Credit, Magnetar Capital, Coatue",
        notes: "Drawdown debt facility collateralized by NVIDIA Blackwell and H100 GPU server clusters."
      },
      {
        label: "Blackstone & Coatue Asset-Backed Facility",
        amountUsd: 7_500_000_000,
        type: "Asset-Backed Facility",
        creditors: "Blackstone Tactical Opportunities, Coatue",
        notes: "Collateralized by existing GPU hardware installations and contracted enterprise cloud cash flows."
      },
      {
        label: "2033 Senior Convertible Notes",
        amountUsd: 4_200_000_000,
        type: "Convertible Debt",
        creditors: "Institutional Crossover Funds",
        notes: "Convertible debt with coupon adjustment linked to IPO completion."
      },
      {
        label: "Series B/C Convertible Facility",
        amountUsd: 2_587_500_000,
        type: "Convertible Debt",
        creditors: "Magnetar, Fidelity, BlackRock",
        notes: "Mezzanine debt subordinated to primary asset-backed facilities."
      },
      {
        label: "GPU-Collateralized Senior Secured Debt",
        amountUsd: 2_300_000_000,
        type: "Asset-Backed Facility",
        creditors: "Magnetar Capital, Blackstone",
        notes: "Landmark asset-backed facility using NVIDIA H100 GPUs directly as physical collateral."
      }
    ],
    // 551,536,602 shares outstanding (Class A 458,871,690 + Class B 92,664,912 +
    // Class C 0) per the 10-Q cover page as of Jul 31, 2026 (filed Aug 12, 2026),
    // × the $61.39 close on Oct 16, 2026 (src/data/live-stocks.json) = $33.86B.
    // Rejected $53.2B (866.6M shares): no filing supports that count, and the Sep 17, 2026 35M-share ATM is undrawn capacity, not issued stock.
    valuationUsd: 33_900_000_000,
    // TTM revenue $7.2B through Jun 30, 2026 — CoreWeave Q2 2026 10-Q, via EDGAR
    // XBRL. FY2026 guidance $12.4–13.2B.
    runRateRevenueUsd: 7_200_000_000,
    psMultiple: 4.7,
    circularityConnections: ["NVIDIA", "Blackstone", "Magnetar", "OpenAI", "Microsoft"],
    circularRiskLevel: "Severe (Circular)",
    circularitySummary: "NVIDIA owns an equity stake and guarantees GPU allocations; CoreWeave pledges the GPUs as collateral to borrow billions from Blackstone to purchase more NVIDIA silicon.",
    riskTier: "Critical",
    exposureSummary: "$25.1B total debt across 5 verified credit facilities; the Q2 2026 10-Q (Note 10 - Debt) shows $31.4B of recourse debt and $3.7B non-recourse at Jun 30, 2026. Publicly traded on Nasdaq (CRWV) at ~$33.9B market cap across all share classes, with a $104B revenue backlog at Jun 30, 2026 before $25B+ of new Q3 commitments. Debt-financed to the hilt, creating extreme sensitivity to GPU secondary pricing and power interconnection.",
  },

  // 5. BLACKSTONE
  {
    name: "Blackstone",
    ticker: "BX",
    sector: "Private Credit & Infra",
    role: "Alternative Asset Manager & Primary AI Private Credit Kingpin",
    disclosedDealsCount: 12,
    totalVolumeUsd: 62_000_000_000,
    // Ledger facilities Blackstone leads or co-leads (deal-018, -138, -155)
    // plus the data-center debt financing it provides (Blackstone S-11, 2026).
    debtInvolvedUsd: 28_300_000_000,
    debtTranches: [
      {
        label: "CoreWeave DDTL 4.0 & Credit Facilities",
        amountUsd: 18_300_000_000,
        type: "Asset-Backed Facility",
        creditors: "Blackstone Credit & Insurance (BXCI)",
        // $8.5B DDTL 4.0 (deal-018), $7.5B senior facility (deal-138) and the $2.3B
        // GPU-collateralized facility (deal-155). deal-161 (a $6.5B syndicate
        // expansion) was adjudicated a double count on 2026-10-19 and dropped.
        notes: "Direct lending anchor underwriting CoreWeave's $8.5B, $7.5B and $2.3B facilities collateralized by GPUs."
      },
      {
        label: "QTS Data Centers Infrastructure Project Debt",
        amountUsd: 10_000_000_000,
        type: "Project Finance",
        creditors: "Blackstone Real Estate / Infrastructure",
        // Blackstone S-11 (2026): "over $10 billion in debt financing provided to
        // data center and digital infrastructure developers and operators".
        notes: "Project financing constructing gigawatt datacenters for Microsoft and AWS."
      }
    ],
    // 1.224B shares × $106.61 close, Oct 16 2026.
    valuationUsd: 130_500_000_000,
    // TTM revenue $16.1B through Jun 30, 2026 — Blackstone 10-Q, via EDGAR XBRL.
    runRateRevenueUsd: 16_100_000_000,
    psMultiple: 8.1,
    circularityConnections: ["CoreWeave", "QTS Data Centers", "Microsoft", "OpenAI", "Magnetar"],
    circularRiskLevel: "High (Circular)",
    circularitySummary: "Underwrites the shadow banking credit plumbing for AI neoclouds; accepts GPU silicon and non-cancellable pre-IPO cloud contracts as senior collateral.",
    riskTier: "High",
    // 2026-10-19 (round-2 consolidation): the basis of the $28.3B is now stated explicitly.
    // Blackstone is a LENDER, so for this profile the figure is credit it PROVIDED (an asset on
    // its own book), not debt it owes — and it is not a clean slice of the ledger's $214.9B
    // base: $18.3B of it is ledger-tracked facility debt (deal-018, -138, -155) while the
    // $10.0B project-debt figure comes from Blackstone's own S-11 disclosure and is not a
    // separately tracked deal. (Note: the brief for this pass pointed at a "Meta exposure
    // line" for $28.3B; the $28.3B figure belongs to BLACKSTONE — Meta's own line is the
    // $40.5B of senior notes at deal-037 + deal-160, both ledger-tracked, and is unambiguous.)
    exposureSummary: "The dominant non-bank credit kingpin of the AI boom. $28.3B of AI credit and data-center project debt DEPLOYED to GPU neoclouds and datacenter campuses — that is credit Blackstone provided (an asset on its book), not debt it owes: $18.3B of ledger-tracked facilities (deal-018, deal-138, deal-155) plus a $10.0B project-debt figure from its own S-11, which is not a separately tracked deal.",
  },

  // 6. SCALE AI
  {
    name: "Scale AI",
    ticker: "Private",
    sector: "Frontier Labs",
    role: "Data Annotation, Fine-Tuning & Evaluation Infrastructure",
    disclosedDealsCount: 7,
    totalVolumeUsd: 14_300_000_000,
    debtInvolvedUsd: 0,
    debtTranches: [
      {
        label: "Funded Entirely via Equity & Operating Cash Flows",
        amountUsd: 0,
        type: "Bank Revolver",
        creditors: "None",
        notes: "Zero long-term debt; profitable enterprise operations with government & hyperscaler revenue."
      }
    ],
    // Meta 49% stake benchmark, June 2025 — Reuters, 13 Jun 2025.
    valuationUsd: 29_000_000_000,
    // ~$1.1B ARR; Scale expects to top $1B of revenue in 2026 — Forbes, 14 May 2026.
    runRateRevenueUsd: 1_100_000_000,
    psMultiple: 26.4,
    circularityConnections: ["Meta Platforms", "Amazon AWS", "OpenAI", "US Department of Defense"],
    circularRiskLevel: "Low (Arm's Length)",
    circularitySummary: "Broad, diversified customer base across defense and competing commercial labs; low dependency on circular vendor financing.",
    riskTier: "Guarded",
    exposureSummary: "Meta strategic 49% stake benchmark ($29B valuation, 26.4× P/S multiple). Strong unit economics with zero debt overhang on $1.1B ARR, serving as the trusted verification baseline for frontier model labs.",
  },

  // 7. MICROSOFT
  {
    name: "Microsoft",
    ticker: "MSFT",
    sector: "Hyperscalers",
    role: "Hyperscaler, Azure Cloud & OpenAI Anchor",
    disclosedDealsCount: 21,
    totalVolumeUsd: 360_700_000_000,
    // Total debt principal $46.1B at FY2026 year-end (Jun 30, 2026) — Microsoft
    // 10-K, via EDGAR XBRL (DebtInstrumentCarryingAmount).
    debtInvolvedUsd: 46_100_000_000,
    debtTranches: [
      {
        label: "Corporate Senior Unsecured Debt",
        amountUsd: 46_100_000_000,
        type: "Senior Notes",
        creditors: "Public Bond Market (AAA Rated)",
        // ~$175B of 2026 capex guided, finance leases included — Forbes, 7 Oct 2026.
        notes: "Corporate balance-sheet debt; $175B+ of 2026 capex funded directly from cloud operating cash flow."
      }
    ],
    // 7.426B shares × $529.05 close, Oct 16 2026 (src/data/live-stocks.json).
    valuationUsd: 3_930_000_000_000,
    // FY2026 revenue $331.8B, year ended Jun 30, 2026 — Microsoft 10-K.
    runRateRevenueUsd: 331_800_000_000,
    psMultiple: 11.8,
    circularityConnections: ["OpenAI", "Constellation Energy", "QTS Data Centers", "Mistral", "Nebius"],
    circularRiskLevel: "High (Circular)",
    circularitySummary: "Committed $13B+ into OpenAI and a $250B incremental Azure commitment; OpenAI commits to spending billions annually on Azure infrastructure. Signed 20-year Three Mile Island nuclear PPA.",
    riskTier: "Elevated",
    exposureSummary: "Anchor funding provider for OpenAI. $331.8B of FY2026 revenue and massive balance-sheet cash reserves buffer capex, but extreme compute concentration in OpenAI creates indirect vulnerability.",
  },

  // 8. AMAZON AWS
  {
    name: "Amazon AWS",
    ticker: "AMZN",
    sector: "Hyperscalers",
    role: "Hyperscaler & Anthropic Anchor Cloud",
    disclosedDealsCount: 18,
    totalVolumeUsd: 91_650_000_000,
    debtInvolvedUsd: 15_000_000_000,
    debtTranches: [
      {
        label: "AI Infrastructure Bond Offering",
        amountUsd: 15_000_000_000,
        type: "Senior Notes",
        creditors: "Institutional Bond Holders",
        // Ledger deal-033 (17 Nov 2025): first US dollar bond sale in three years.
        notes: "Six-part investment-grade notes, including a 40-year tranche, funding AI data center and chip capex."
      }
    ],
    // 10.786B shares (10-Q cover, Jul 22 2026) × $250.00 close, Oct 16 2026.
    valuationUsd: 2_696_500_000_000,
    // Amazon consolidated revenue, TTM $775.7B through Jun 30, 2026 — Amazon
    // 10-Q, via EDGAR XBRL. AWS alone: $42.2B in Q2 2026, a $169B annualized
    // run rate with a $496B backlog (Amazon Q2 2026 release, Jul 30 2026).
    runRateRevenueUsd: 775_700_000_000,
    psMultiple: 3.5,
    circularityConnections: ["Anthropic", "Talen Energy", "Annapurna Labs"],
    circularRiskLevel: "High (Circular)",
    circularitySummary: "$8B total commitment to Anthropic conditioned on utilizing AWS Trainium2 silicon and Bedrock platform.",
    riskTier: "Elevated",
    exposureSummary: "Issued $15B bond offering for AI capex; $8B strategic stake in Anthropic with custom silicon and nuclear off-take infrastructure. AWS revenue of $42.2B in Q2 2026 is a $169B annualized run rate with a $496B backlog, on $775.7B of consolidated trailing revenue.",
  },

  // 9. ALPHABET / GOOGLE
  {
    name: "Alphabet / Google",
    ticker: "GOOGL",
    sector: "Hyperscalers",
    role: "Full-Stack TPU Cloud & Gemini Developer",
    disclosedDealsCount: 24,
    totalVolumeUsd: 178_500_000_000,
    debtInvolvedUsd: 25_000_000_000,
    debtTranches: [
      {
        label: "Global AI Datacenter Capex Notes",
        amountUsd: 25_000_000_000,
        type: "Senior Notes",
        creditors: "Global Bond Syndicate",
        // Ledger deal-035 (3 Nov 2025): $17.5B of US dollar notes plus EUR 6.5B.
        notes: "Global bond sale funding record AI-driven cloud capex, including TPU v5p/v6 clusters and the Kairos nuclear SMR off-take."
      }
    ],
    // 12.3B shares × $340.59 close, Oct 16 2026 (src/data/live-stocks.json).
    valuationUsd: 4_190_000_000_000,
    // TTM revenue $445.9B through Jun 30, 2026 — Alphabet 10-Q, via EDGAR XBRL.
    runRateRevenueUsd: 445_900_000_000,
    psMultiple: 9.4,
    circularityConnections: ["Anthropic", "Marvell Technology", "Kairos Power", "Runway"],
    circularRiskLevel: "Moderate",
    circularitySummary: "Self-developed TPU custom silicon significantly reduces gross margins paid to third-party chip suppliers; minor circularity with Anthropic compute credits.",
    riskTier: "Guarded",
    exposureSummary: "$25B global bond sale for AI capex. High internal TPU utilization shields balance sheet from merchant GPU supply inflation.",
  },

  // 10. META PLATFORMS
  {
    name: "Meta Platforms",
    ticker: "META",
    sector: "Hyperscalers",
    role: "Open Weights (Llama) & Capex Supercluster Builder",
    disclosedDealsCount: 17,
    totalVolumeUsd: 159_000_000_000,
    // Two ledger bond issues: deal-037 ($30.0B AI notes) and deal-160 ($10.5B
    // multi-tranche AI datacenter bonds, 22 Oct 2025).
    debtInvolvedUsd: 40_500_000_000,
    debtTranches: [
      {
        label: "AI Infrastructure Senior Notes Offering",
        amountUsd: 30_000_000_000,
        type: "Senior Notes",
        creditors: "Public Bond Market",
        // Ledger deal-037 (30 Oct 2025): biggest US high-grade bond sale of 2025.
        notes: "Six-part senior notes offering funding AI datacenter expansion, including the 600,000+ H100-equivalent cluster buildout."
      },
      {
        label: "Multi-Tranche Corporate Bond Issuance for AI Datacenters",
        amountUsd: 10_500_000_000,
        type: "Senior Notes",
        creditors: "Public Bond Market",
        // Ledger deal-160: 5-, 10-, 30- and 40-year tranches funding AI datacenter
        // infrastructure, custom MTIA silicon and networking fabrics.
        notes: "Second AI-linked bond program, spanning 5- to 40-year tranches for custom MTIA silicon and datacenter fabrics."
      }
    ],
    // 2.52B shares × $709.33 close, Oct 16 2026 (src/data/live-stocks.json).
    valuationUsd: 1_790_000_000_000,
    // TTM revenue $228.3B through Jun 30, 2026 — Meta 10-Q, via EDGAR XBRL.
    runRateRevenueUsd: 228_300_000_000,
    psMultiple: 7.8,
    circularityConnections: ["NVIDIA", "Broadcom", "CoreWeave", "Scale AI"],
    circularRiskLevel: "Elevated",
    circularitySummary: "Advertising cash flows subsidize massive GPU procurement, open-sourcing weights to suppress proprietary LLM pricing power of competing labs.",
    riskTier: "Elevated",
    exposureSummary: "$40.5B of senior notes across two AI-linked programs; guides $130–145B of 2026 infrastructure capex with no direct enterprise subscription revenue.",
  },

  // 11. SPACEX / xAI
  {
    name: "SpaceX / xAI",
    ticker: "SPCX (Nasdaq)",
    sector: "Frontier Labs",
    role: "AI Supercomputing, Starlink & Colossus Megacluster",
    disclosedDealsCount: 11,
    totalVolumeUsd: 400_000_000_000,
    debtInvolvedUsd: 17_500_000_000,
    debtTranches: [
      {
        label: "Colossus 2 GPU-Collateralized SPV Debt",
        amountUsd: 12_500_000_000,
        type: "SPV Debt",
        creditors: "Apollo Global Management, Diameter Capital",
        // Ledger deal-045.
        notes: "Special Purpose Vehicle issuing high-yield debt directly collateralized by NVIDIA GPU clusters."
      },
      {
        label: "Secured Credit Facility",
        amountUsd: 5_000_000_000,
        type: "Bank Revolver",
        creditors: "Morgan Stanley Syndicate",
        // Ledger deal-075.
        notes: "Secured credit line underwriting Memphis supercluster infrastructure."
      }
    ],
    // SPCX market cap $2.05T at the Oct 16, 2026 close of $146.03
    // (src/data/live-stocks.json, 19 Oct 2026).
    valuationUsd: 2_050_000_000_000,
    // SpaceX consolidated revenue: $7.8B in Q2 2026 (+92% YoY), a $31.2B
    // annualized run rate — SpaceX Q2 2026 results, 13 Oct 2026.
    runRateRevenueUsd: 31_200_000_000,
    psMultiple: 65.7,
    circularityConnections: ["NVIDIA", "Valor Equity", "Tesla", "Oracle", "Apollo"],
    circularRiskLevel: "Severe (Circular)",
    circularitySummary: "Consolidates xAI inside SpaceX: the AI segment (Grok, X and Colossus compute) took $2.56B of revenue in Q2 2026, up 247% year on year, and the Colossus supercluster asset was carried at about $250B in the February 2026 all-stock merger. SPV debt relies directly on GPU hardware maintaining secondary liquidation value.",
    riskTier: "Critical",
    exposureSummary: "Publicly traded on Nasdaq (SPCX) at ~$2.05T market cap ($146.03/share) following its June 2026 IPO. Operates the 100k+ GPU Colossus superclusters. Carries $17.5B in debt obligations ($12.5B GPU-collateralized SPV debt + $5B bank revolver) against $31.2B of annualized consolidated revenue.",
  },

  // 12. NVIDIA
  {
    name: "NVIDIA",
    ticker: "NVDA",
    sector: "Semiconductor",
    role: "Accelerator Silicon & Ecosystem Monopoly",
    disclosedDealsCount: 57,
    totalVolumeUsd: 160_480_000_000,
    // Total debt $33.4B at Jul 26, 2026, up from $8.5B in April 2026 —
    // NVIDIA 10-Q, via EDGAR XBRL (LongTermDebt).
    debtInvolvedUsd: 33_400_000_000,
    debtTranches: [
      {
        label: "Corporate Senior Unsecured Notes",
        amountUsd: 33_400_000_000,
        type: "Senior Notes",
        creditors: "Institutional Bond Holders",
        // $32.4B long-term plus $1.0B current at Jul 26, 2026.
        notes: "Corporate notes nearly quadrupled during FY2027 Q2, still covered by a $46.9B debt-securities portfolio and the operating cash flow it generates."
      }
    ],
    // $5.27T market cap at the Oct 16, 2026 close of $214.13
    // (src/data/live-stocks.json, 19 Oct 2026).
    valuationUsd: 5_270_000_000_000,
    // TTM revenue $303.0B through Jul 26, 2026 — NVIDIA 10-Q, via EDGAR XBRL
    // (Q3 FY2026 $57.0B, Q4 $68.1B, Q1 FY2027 $81.6B, Q2 FY2027 $96.2B).
    runRateRevenueUsd: 303_000_000_000,
    psMultiple: 17.4,
    circularityConnections: ["CoreWeave", "OpenAI", "xAI", "Mistral", "Supermicro", "Blackstone"],
    circularRiskLevel: "Severe (Circular)",
    circularitySummary: "Epicenter of circular financing: invests corporate venture equity directly into compute startups and labs who then spend the proceeds on NVIDIA silicon.",
    riskTier: "Elevated",
    exposureSummary: "Primary beneficiary of the $725B of 2026 Big-4 hyperscaler capex. $33.4B of corporate debt against $303.0B of trailing revenue, but structurally vulnerable if counterparty debt financing dries up.",
    polymarketOdds: {
      marketName: "AI Bubble Burst 2026",
      // 2026-10-19 (round-2 consolidation): 9.6¢ (9.6%) → 9.05¢ (9.05%). The 9.6% was a
      // stale intraday read; the published crowd reading is 9.05% on the Dec-2026 bubble
      // contract (Polymarket snapshot, 19 Oct 2026 — src/data/live-inputs.json).
      oddsDisplay: "9.05¢ (9.05%)",
      url: "https://polymarket.com/event/ai-bubble-burst-by?r=AIbubble"
    }
  },

  // 13. NEBIUS GROUP
  {
    name: "Nebius Group",
    ticker: "NBIS",
    sector: "GPU Neoclouds",
    role: "AI Neocloud & Supercomputing Infrastructure",
    disclosedDealsCount: 5,
    totalVolumeUsd: 33_100_000_000,
    debtInvolvedUsd: 1_000_000_000,
    debtTranches: [
      {
        label: "Convertible Notes Private Placement",
        amountUsd: 1_000_000_000,
        type: "Convertible Debt",
        creditors: "Institutional Private Placement",
        // Ledger deal-081.
        notes: "Convertible debt funding datacenter buildout in Finland and France."
      }
    ],
    // 271.9M shares × $165.47 close, Oct 16 2026.
    valuationUsd: 45_000_000_000,
    // AI cloud ARR reached $3.0B in Q2 2026; FY2026 revenue guidance $3.0–3.4B —
    // Nebius Q2 2026 shareholder letter, 12 Aug 2026.
    runRateRevenueUsd: 3_000_000_000,
    psMultiple: 15.0,
    circularityConnections: ["Microsoft", "NVIDIA", "Accolade"],
    circularRiskLevel: "High (Circular)",
    circularitySummary: "Secured $17.4B compute agreement with Microsoft through 2030, transforming contract backstop into collateral for infrastructure financing.",
    riskTier: "High",
    exposureSummary: "Publicly traded on Nasdaq (NBIS) at ~$45.0B market cap ($165.47/share). $1.0B convertible notes backed by a $17.4B long-term Microsoft compute off-take contract, with AI cloud ARR of $3.0B.",
  },

  // 14. CRUSOE ENERGY
  {
    name: "Crusoe Energy",
    ticker: "Private",
    sector: "GPU Neoclouds",
    role: "Clean Compute & Flare Gas Datacenters",
    disclosedDealsCount: 5,
    totalVolumeUsd: 22_625_000_000,
    debtInvolvedUsd: 3_625_000_000,
    debtTranches: [
      {
        label: "Abilene Datacenter JV Project Financing",
        amountUsd: 3_400_000_000,
        type: "Project Finance",
        creditors: "Blue Owl Capital Syndicate",
        // Ledger deal-163.
        notes: "Joint venture project debt financing 200MW Abilene facility leased by OpenAI."
      },
      {
        label: "GPU Asset-Backed Facility",
        amountUsd: 225_000_000,
        type: "Asset-Backed Facility",
        creditors: "Upper90",
        // Ledger deal-093.
        notes: "Credit facility collateralized by NVIDIA GPU servers."
      }
    ],
    // $3.9B Series F at a $30.9B post-money valuation — Crusoe press release,
    // 17 Sep 2026.
    valuationUsd: 30_900_000_000,
    // ~$2.0B of 2026 revenue projected to investors; $276M of actual 2024
    // revenue — Crusoe investor materials, Sept 2026.
    runRateRevenueUsd: 2_000_000_000,
    psMultiple: 15.5,
    circularityConnections: ["Blue Owl Capital", "Lancium", "OpenAI"],
    circularRiskLevel: "High (Circular)",
    circularitySummary: "Constructing $3.4B datacenter backed by OpenAI tenant contract; relies on continuous private credit refinancing.",
    riskTier: "High",
    exposureSummary: "Closed $3.9B Series F at $30.9B post-money valuation co-led by Atreides, Mubadala and Valor Equity, with NVIDIA among the participants. $3.6B in project debt and credit facilities backing multi-gigawatt datacenter campuses for OpenAI.",
  },

  // 15. LAMBDA LABS
  {
    name: "Lambda Labs",
    ticker: "Private (Pre-IPO)",
    sector: "GPU Neoclouds",
    role: "GPU Cloud & Compute Clustering",
    disclosedDealsCount: 2,
    totalVolumeUsd: 980_000_000,
    debtInvolvedUsd: 2_426_000_000,
    debtTranches: [
      {
        label: "GPU Asset-Backed Debt Facility",
        amountUsd: 500_000_000,
        type: "Asset-Backed Facility",
        creditors: "Macquarie Group, Braidwell",
        // Ledger deal-144.
        notes: "Asset-backed credit facility collateralized by NVIDIA H100 hardware inventory."
      },
      {
        label: "Senior Secured Institutional Facilities",
        amountUsd: 1_926_000_000,
        type: "Bank Revolver",
        creditors: "Institutional lenders and insurance companies",
        // Lambda IR: $926M senior secured term loan B (27 Aug 2026) and a $1.0B
        // senior secured fixed-rate facility (1 Oct 2026) — not yet in our ledger.
        notes: "Two institutional facilities closed in Aug and Oct 2026, the first broadly syndicated investment-grade-rated term loan B for a private neocloud."
      }
    ],
    // Pre-money valuation of the reported final pre-IPO round — WSJ, 6 Oct 2026.
    valuationUsd: 14_500_000_000,
    // More than $1.5B of revenue expected in 2026 — Bloomberg via Tech Funding News.
    runRateRevenueUsd: 1_500_000_000,
    psMultiple: 9.7,
    circularityConnections: ["NVIDIA", "Macquarie", "Braidwell"],
    circularRiskLevel: "Elevated",
    circularitySummary: "Financed hardware purchases through asset-backed loans collateralized by fast-depreciating chips.",
    riskTier: "Elevated",
    exposureSummary: "Raising up to $4B in a final pre-IPO round at a $14.5B pre-money valuation, on more than $1.5B of expected 2026 revenue. $2.4B of GPU asset-backed and senior secured facilities collateralized by NVIDIA GPU clusters.",
  },

  // 16. NORTHERN DATA / RUMBLE
  {
    name: "Northern Data / Rumble",
    ticker: "RUM (Nasdaq)",
    sector: "GPU Neoclouds",
    role: "HPC Cloud & Crypto Pivot",
    disclosedDealsCount: 2,
    totalVolumeUsd: 1_058_000_000,
    debtInvolvedUsd: 610_000_000,
    debtTranches: [
      {
        label: "Tether Debt Financing Facility",
        amountUsd: 610_000_000,
        type: "Bank Revolver",
        creditors: "Tether Holdings",
        // Ledger deal-152.
        notes: "Debt financing facility from stablecoin issuer Tether funding procurement of 20,000+ GPUs."
      }
    ],
    // 400.0M shares across all classes × $5.69 close, Oct 16 2026.
    valuationUsd: 2_276_000_000,
    // Q2 2026 consolidated revenue $40.4M, a $161.6M annualized run rate;
    // Northern Data's FY2026 outlook was raised to €170–190M — 10-Q (Jun 30,
    // 2026) and the Northern Data acquisition release, 17 Jun 2026.
    runRateRevenueUsd: 160_000_000,
    psMultiple: 14.2,
    circularityConnections: ["Tether", "Taiga Cloud", "Rumble"],
    circularRiskLevel: "Severe (Circular)",
    circularitySummary: "Direct debt financing from stablecoin operator Tether; high leverage relative to operating cash flows.",
    riskTier: "Critical",
    exposureSummary: "$610M debt facility from Tether, with Northern Data's ~22,000 H100 and H200 GPUs running at about 85% utilization. RUM Group closed its purchase of about 85% of Northern Data AG on June 17, 2026 and reported record Q2 2026 revenue of $40.4M.",
  },

  // 17. MISTRAL AI
  {
    name: "Mistral AI",
    ticker: "Private",
    sector: "Frontier Labs",
    role: "European Open Weights Developer",
    disclosedDealsCount: 4,
    totalVolumeUsd: 7_888_000_000,
    debtInvolvedUsd: 1_650_000_000,
    debtTranches: [
      {
        label: "European Consortium Convertible Note & GPU Compute Facility",
        amountUsd: 1_650_000_000,
        type: "Convertible Debt",
        creditors: "ASML & Sovereign European Infrastructure Consortium",
        // Ledger deal-167: €1.5B structured convertible note and hardware compute
        // facility for sovereign European clusters.
        notes: "€1.5B ($1.65B) structured convertible note and hardware compute facility for sovereign European clusters."
      }
    ],
    // €21B (about $24.0B) Series D, Oct 2026.
    valuationUsd: 24_000_000_000,
    // $450M annualized ARR, scaling toward $1B — Mistral Series D announcement.
    runRateRevenueUsd: 450_000_000,
    psMultiple: 53.3,
    circularityConnections: ["Microsoft", "NVIDIA", "ASML", "CMA CGM"],
    circularRiskLevel: "High (Circular)",
    circularitySummary: "Multiple tech and industrial giants hold equity and compute agreements; €1.5B debt facility tied to European sovereign compute buildout.",
    riskTier: "Critical",
    exposureSummary: "Valued at €21B ($24.0B) Series D on $450M annualized ARR (53.3× P/S multiple), backed by a €1.5B convertible debt facility.",
  },

  // 18. DATABRICKS
  {
    name: "Databricks",
    ticker: "Private",
    sector: "Frontier Labs",
    role: "Enterprise Data & AI Agent Platform",
    disclosedDealsCount: 3,
    totalVolumeUsd: 11_000_000_000,
    debtInvolvedUsd: 0,
    debtTranches: [
      {
        label: "Equity Financed & Cash Flow Positive",
        amountUsd: 0,
        type: "Bank Revolver",
        creditors: "None",
        notes: "Zero funded balance-sheet debt; generated positive operational cash flow."
      }
    ],
    // $5B round at a $190B valuation, 13 Aug 2026 (ledger deal-009).
    valuationUsd: 190_000_000_000,
    // $7B revenue run-rate reported with the round — Databricks, 13 Aug 2026.
    runRateRevenueUsd: 7_000_000_000,
    psMultiple: 27.1,
    circularityConnections: ["Coatue", "NVIDIA", "Blackstone"],
    circularRiskLevel: "Low (Arm's Length)",
    circularitySummary: "High enterprise software revenue base with hundreds of enterprise customers mitigating circular concentration.",
    riskTier: "Guarded",
    exposureSummary: "$5B strategic round at $190B valuation with $7B revenue run-rate (27.1× P/S) and positive operational cash flow.",
  },

  // 19. MARVELL TECHNOLOGY
  {
    name: "Marvell Technology",
    ticker: "MRVL",
    sector: "Semiconductor",
    role: "Custom AI Accelerators & Interconnect",
    disclosedDealsCount: 1,
    totalVolumeUsd: 12_200_000_000,
    // Long-term debt $5.0B at Aug 1, 2026 — Marvell 10-Q, via EDGAR XBRL.
    debtInvolvedUsd: 5_000_000_000,
    debtTranches: [
      {
        label: "Corporate Senior Notes",
        amountUsd: 5_000_000_000,
        type: "Senior Notes",
        creditors: "Public Bond Market",
        // Marvell 8-K / Reuters, 19 Aug 2026: warrant over 58,970,907 shares at
        // $206.58, tied to $120B of custom-chip purchases through fiscal 2033.
        notes: "Senior unsecured notes; issued Google a $12.2B stock warrant tied to $120B in custom TPU purchases."
      }
    ],
    // 898.7M shares × $227.83 close, Oct 16 2026.
    valuationUsd: 204_800_000_000,
    // TTM revenue $9.2B through Aug 1, 2026 — Marvell 10-Q, via EDGAR XBRL.
    runRateRevenueUsd: 9_240_000_000,
    psMultiple: 22.2,
    circularityConnections: ["Google", "Amazon", "TSMC"],
    circularRiskLevel: "Elevated",
    circularitySummary: "Warrant agreements granting customers equity upside in exchange for long-term custom silicon purchase commitments.",
    riskTier: "Elevated",
    exposureSummary: "$5.0B in corporate debt; issued Google a $12.2B warrant tied to $120B of TPU-attached custom silicon purchases through fiscal 2033.",
  },

  // 20. SUPERMICRO
  {
    name: "Supermicro",
    ticker: "SMCI",
    sector: "Semiconductor",
    role: "Liquid-Cooled GPU Server Integration",
    disclosedDealsCount: 2,
    totalVolumeUsd: 5_000_000_000,
    // Bank debt and convertible notes of $8.7B at FY2026 year-end (Jun 30, 2026)
    // — Supermicro 10-K, Aug 31 2026.
    debtInvolvedUsd: 8_700_000_000,
    debtTranches: [
      {
        label: "Convertible Notes (2029, 2028 and 2030 issues)",
        amountUsd: 4_700_000_000,
        type: "Convertible Debt",
        creditors: "Convertible Arbitrage Funds",
        // $1,725.0M 2029 notes, $700.0M 2028 notes, $2.3B 2030 notes — FY2026 10-K.
        notes: "Convertible notes facing refinancing vulnerability; the 2029 issue was amended in FY2026."
      },
      {
        label: "Bank Lines of Credit and Term Loans",
        amountUsd: 4_000_000_000,
        type: "Bank Revolver",
        creditors: "JPMorgan, CTBC",
        // $2.0B JPMorgan revolver plus $1,763.5M CTBC facilities — FY2026 10-K.
        notes: "Drawn bank debt: $2.0B under the JPMorgan revolver and $1,763.5M of CTBC revolving facilities."
      }
    ],
    // 657.0M shares × $31.63 close, Oct 16 2026.
    valuationUsd: 20_800_000_000,
    // FY2026 revenue $39.1B, year ended Jun 30, 2026 — Supermicro 10-K.
    runRateRevenueUsd: 39_060_000_000,
    psMultiple: 0.5,
    circularityConnections: ["NVIDIA", "xAI", "CoreWeave"],
    circularRiskLevel: "High (Circular)",
    circularitySummary: "Dependent on primary NVIDIA GPU allocations and tight inventory turns; auditor changes caused credit spread widening.",
    riskTier: "High",
    exposureSummary: "FY2026 10-K filed Aug 31, 2026 after the 2024–25 filing delays and auditor turnover; $8.7B of bank debt and convertible notes, with $2.0B of the JPMorgan revolver due inside 12 months.",
  },

  // 21. CONSTELLATION ENERGY
  {
    name: "Constellation Energy",
    ticker: "CEG",
    sector: "Nuclear & Energy",
    role: "Nuclear Power & Three Mile Island (Crane) Restart",
    disclosedDealsCount: 2,
    // Both ledger records (Microsoft and Meta PPAs) were announced without
    // disclosed values, so there is no committed amount to report.
    totalVolumeUsd: 0,
    // Total borrowings $19.6B at Jun 30, 2026 — Constellation 10-Q, via EDGAR XBRL.
    debtInvolvedUsd: 19_600_000_000,
    debtTranches: [
      {
        label: "Corporate Debt and Project Financing",
        amountUsd: 19_600_000_000,
        type: "Project Finance",
        creditors: "Utility Debt Markets",
        // $19.1B long-term plus $0.4B current borrowings at Jun 30, 2026.
        notes: "Balance-sheet borrowings backing the Three Mile Island Unit 1 restart, sold to Microsoft under a 20-year power purchase agreement."
      }
    ],
    // 354.3M shares × $271.37 close, Oct 16 2026.
    valuationUsd: 96_100_000_000,
    // TTM revenue $27.6B through Jun 30, 2026 — Constellation 10-Q, via EDGAR XBRL.
    runRateRevenueUsd: 27_600_000_000,
    psMultiple: 3.5,
    circularityConnections: ["Microsoft", "PJM Interconnection"],
    circularRiskLevel: "Low (Arm's Length)",
    circularitySummary: "Long-term arm's-length power off-take contract with investment-grade counterparty Microsoft.",
    riskTier: "Guarded",
    exposureSummary: "Signed a landmark 20-year power purchase agreement with Microsoft to restart Unit 1 of Three Mile Island (835MW Crane Center). Neither the Microsoft nor the Meta power purchase agreements were announced with a value.",
  },

  // 22. TALEN ENERGY
  {
    name: "Talen Energy",
    ticker: "TLN",
    sector: "Nuclear & Energy",
    role: "Susquehanna Nuclear Plant Datacenter Campus",
    disclosedDealsCount: 3,
    totalVolumeUsd: 18_650_000_000,
    // Total borrowings $9.7B at Jun 30, 2026 — Talen 10-Q, via EDGAR XBRL.
    debtInvolvedUsd: 9_700_000_000,
    debtTranches: [
      {
        label: "Corporate Senior Debt",
        amountUsd: 9_700_000_000,
        type: "Senior Notes",
        creditors: "Institutional Bond Investors",
        // $9.5B long-term plus $0.03B current at Jun 30, 2026.
        notes: "Corporate debt supporting nuclear generation; sold the Cumulus datacenter campus to AWS for $650M."
      }
    ],
    // 48M shares × $354.81 close, Oct 16 2026.
    valuationUsd: 17_000_000_000,
    // TTM revenue $4.0B through Jun 30, 2026 — Talen 10-Q, via EDGAR XBRL.
    runRateRevenueUsd: 3_980_000_000,
    psMultiple: 4.3,
    circularityConnections: ["Amazon AWS", "FERC"],
    circularRiskLevel: "Moderate",
    circularitySummary: "Direct co-located interconnection challenged by FERC over grid cost allocation.",
    riskTier: "Elevated",
    exposureSummary: "Sold the Cumulus datacenter campus to AWS for $650M; FERC rejected the co-located interconnection agreement on grid cost-allocation grounds. A revised 17-year, 1,920MW front-of-the-meter nuclear PPA with AWS is valued at about $18B.",
  },
];
export const SECTORS = [
  "Frontier Labs",
  "Hyperscalers",
  "GPU Neoclouds",
  "Private Credit & Infra",
  "Semiconductor",
  "Nuclear & Energy",
] as const;

/** Risk tier -> pill tone. Only safe / caution / risk / neutral are used. */
export function riskTone(tier: CompanyProfile["riskTier"]): string {
  if (tier === "Critical") return "pill-risk";
  if (tier === "High") return "pill-caution";
  if (tier === "Elevated") return "pill";
  return "pill-safe";
}

export function circularTone(level: CompanyProfile["circularRiskLevel"]): string {
  if (level.indexOf("Severe") === 0) return "chip-risk";
  if (level.indexOf("High") === 0) return "chip-caution";
  if (level.indexOf("Elevated") === 0) return "chip";
  return "chip";
}

/** "$2.87T" / "$214.9B" / "$540.0B" / "$0.9B" — always tabular. */
export function formatUsd(usd: number): string {
  if (!usd || usd <= 0) return "None";
  if (usd >= 1e12) return `$${(usd / 1e12).toFixed(2)}T`;
  if (usd >= 1e9) return `$${(usd / 1e9).toFixed(1)}B`;
  if (usd >= 1e6) return `$${(usd / 1e6).toFixed(0)}M`;
  return `$${usd.toFixed(0)}`;
}

export function sectorSlug(sector: string): string {
  return sector.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export function companySlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function getCompanyBySlug(slug: string): CompanyProfile | undefined {
  const target = slug.toLowerCase();
  return COMPANIES.find((c) => companySlug(c.name) === target);
}

/** Known name aliases used in circularity connections that map to register profiles. */
export const COMPANY_ALIASES: Record<string, string> = {
  Google: "Alphabet / Google",
  Alphabet: "Alphabet / Google",
  Amazon: "Amazon AWS",
  AWS: "Amazon AWS",
  xAI: "SpaceX / xAI",
  SpaceX: "SpaceX / xAI",
  Mistral: "Mistral AI",
  Marvell: "Marvell Technology",
  Nebius: "Nebius Group",
  "Northern Data": "Northern Data / Rumble",
  Rumble: "Northern Data / Rumble",
};

export function resolveCompanyProfile(name: string): CompanyProfile | undefined {
  const direct = COMPANIES.find((c) => c.name.toLowerCase() === name.toLowerCase());
  if (direct) return direct;
  const alias = COMPANY_ALIASES[name];
  if (alias) {
    return COMPANIES.find((c) => c.name.toLowerCase() === alias.toLowerCase());
  }
  return undefined;
}


export interface CompanyStats {
  count: number;
  totalVolumeUsd: number;
  totalDebtUsd: number;
  circularCount: number;
  debtFreeCount: number;
  bySector: { sector: string; count: number; volumeUsd: number }[];
}

export function companyStats(list: CompanyProfile[] = COMPANIES): CompanyStats {
  let totalVolumeUsd = 0;
  let totalDebtUsd = 0;
  let circularCount = 0;
  let debtFreeCount = 0;
  const sectors = new Map<string, { count: number; volumeUsd: number }>();

  list.forEach((c) => {
    totalVolumeUsd += c.totalVolumeUsd || 0;
    totalDebtUsd += c.debtInvolvedUsd || 0;
    if (c.circularRiskLevel.indexOf("Circular") !== -1) circularCount += 1;
    if (!c.debtInvolvedUsd) debtFreeCount += 1;
    const row = sectors.get(c.sector) ?? { count: 0, volumeUsd: 0 };
    row.count += 1;
    row.volumeUsd += c.totalVolumeUsd || 0;
    sectors.set(c.sector, row);
  });

  return {
    count: list.length,
    totalVolumeUsd,
    totalDebtUsd,
    circularCount,
    debtFreeCount,
    bySector: Array.from(sectors.entries())
      .map(([sector, row]) => ({ sector, count: row.count, volumeUsd: row.volumeUsd }))
      .sort((a, b) => b.volumeUsd - a.volumeUsd),
  };
}
