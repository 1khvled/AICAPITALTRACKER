"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  ShieldAlert,
  Search,
  Filter,
  TrendingUp,
  Cpu,
  Zap,
  Server,
  DollarSign,
  ExternalLink,
  Layers,
  AlertTriangle,
  FileText,
  X,
  CreditCard,
  PieChart,
  Repeat,
  CheckCircle2,
  BadgeAlert,
} from "lucide-react";
import { AdSlot } from "@/components/AdSlot";

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

const COMPANIES: CompanyProfile[] = [
  // 1. ANTHROPIC
  {
    name: "Anthropic",
    ticker: "Private (S-1 Filed)",
    sector: "Frontier Labs",
    role: "Frontier Foundation Model Developer & Claude Creator",
    disclosedDealsCount: 14,
    totalVolumeUsd: 185_000_000_000,
    debtInvolvedUsd: 57_000_000_000,
    debtTranches: [
      {
        label: "Broadcom Custom TPU Underwriting Facility",
        amountUsd: 42_000_000_000,
        type: "Convertible Debt",
        creditors: "Broadcom Inc.",
        notes: "Underwrites 5-year $125.2B custom TPU compute lease, convertible upon qualified liquidity event."
      },
      {
        label: "Multi-Bank Syndicated Revolving Credit Line",
        amountUsd: 15_000_000_000,
        type: "Bank Revolver",
        creditors: "Morgan Stanley, Citi, JPMorgan, Blackstone Syndicate",
        notes: "Secured credit facility backstopping $518B in cumulative long-term cloud datacenter commitments."
      }
    ],
    valuationUsd: 65_000_000_000,
    runRateRevenueUsd: 4_600_000_000,
    psMultiple: 14.1,
    circularityConnections: ["Broadcom", "Amazon AWS", "Google", "Morgan Stanley", "Blackstone"],
    circularRiskLevel: "Severe (Circular)",
    circularitySummary: "Amazon and Google invested $8B+ equity into Anthropic while Anthropic contracted $100B+ multi-year compute on AWS Trainium and Google TPUs. Broadcom underwrites $42B convertible debt tied to custom silicon.",
    riskTier: "Critical",
    exposureSummary: "$57.0B verified debt across 2 major facilities: $42B convertible note facility from Broadcom and $15B multi-bank revolver against $518B in future cloud liabilities.",
    polymarketOdds: {
      marketName: "Anthropic Acquired Before 2027",
      oddsDisplay: "2.6¢ (2.6%)",
      url: "https://polymarket.com/event/anthropic-acquired-before-2027?r=AIbubble"
    }
  },

  // 2. OPENAI
  {
    name: "OpenAI",
    ticker: "Private (Restructuring)",
    sector: "Frontier Labs",
    role: "Frontier Foundation Model Developer (ChatGPT & Stargate)",
    disclosedDealsCount: 19,
    totalVolumeUsd: 540_000_000_000,
    debtInvolvedUsd: 4_000_000_000,
    debtTranches: [
      {
        label: "Syndicated Revolving Credit Facility",
        amountUsd: 4_000_000_000,
        type: "Bank Revolver",
        creditors: "JPMorgan Chase, Citi, Goldman Sachs, Morgan Stanley",
        notes: "Unsecured revolving credit line with zero immediate drawn balance, contingent on corporate restructuring."
      }
    ],
    valuationUsd: 157_000_000_000,
    runRateRevenueUsd: 3_700_000_000,
    psMultiple: 42.4,
    circularityConnections: ["Microsoft", "Oracle", "NVIDIA", "SoftBank", "Crusoe Energy"],
    circularRiskLevel: "High (Circular)",
    circularitySummary: "Microsoft's $13B+ equity/credits are spent on Azure compute; Oracle and Crusoe issue debt to construct gigawatt campuses exclusively leased by OpenAI.",
    riskTier: "High",
    exposureSummary: "$4.0B bank revolver at 42.4× P/S revenue multiple. Anchor tenant driving $500B Stargate initiative with multi-year non-cancellable compute obligations.",
    polymarketOdds: {
      marketName: "OpenAI IPO by Dec 2026",
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
    disclosedDealsCount: 14,
    totalVolumeUsd: 145_000_000_000,
    debtInvolvedUsd: 82_000_000_000,
    debtTranches: [
      {
        label: "Dedicated AI Infrastructure Senior Notes",
        amountUsd: 18_000_000_000,
        type: "Senior Notes",
        creditors: "Institutional Bond Investors",
        notes: "Multi-tranche fixed-rate senior notes specifically earmarked for GPU cluster buildouts."
      },
      {
        label: "Corporate Senior Unsecured Debt Portfolio",
        amountUsd: 64_000_000_000,
        type: "Senior Notes",
        creditors: "Public Debt Markets / Syndicated Credit",
        notes: "Carries $87.5B total corporate debt obligations; 5Y CDS widened from 81bp to 187bp (+131%)."
      }
    ],
    valuationUsd: 350_000_000_000,
    runRateRevenueUsd: 53_000_000_000,
    psMultiple: 6.6,
    circularityConnections: ["OpenAI", "Cohere", "CoreWeave", "NVIDIA"],
    circularRiskLevel: "Severe (Circular)",
    circularitySummary: "Constructing massive gigawatt AI datacenters with fixed balance-sheet debt on behalf of venture-backed model labs (OpenAI, Cohere) without long-term sovereign guarantees.",
    riskTier: "Critical",
    exposureSummary: "The financial system's primary debt thermometer. Carries $82B+ debt load; 5Y CDS jumped to 187bps as fixed-income markets price GPU infrastructure refinancing saturation.",
    polymarketOdds: {
      marketName: "Oracle Debt Default / CDS Stress",
      oddsDisplay: "38.0¢ (38.0%)",
      url: "https://polymarket.com/?r=AIbubble"
    }
  },

  // 4. COREWEAVE
  {
    name: "CoreWeave",
    ticker: "CRWV",
    sector: "GPU Neoclouds",
    role: "Specialized GPU Cloud Provider",
    disclosedDealsCount: 9,
    totalVolumeUsd: 26_700_000_000,
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
    valuationUsd: 23_000_000_000,
    runRateRevenueUsd: 2_000_000_000,
    psMultiple: 11.5,
    circularityConnections: ["NVIDIA", "Blackstone", "Magnetar", "OpenAI", "Microsoft"],
    circularRiskLevel: "Severe (Circular)",
    circularitySummary: "NVIDIA owns an equity stake and guarantees GPU allocations; CoreWeave pledges the GPUs as collateral to borrow billions from Blackstone to purchase more NVIDIA silicon.",
    riskTier: "Critical",
    exposureSummary: "$25.1B total debt across 5 verified credit facilities. 94% of total capital structure is debt-financed, creating extreme sensitivity to GPU depreciation and secondary pricing.",
    polymarketOdds: {
      marketName: "CoreWeave IPO Valuation >$25B",
      oddsDisplay: "44.0¢ (44.0%)",
      url: "https://polymarket.com/?r=AIbubble"
    }
  },

  // 5. BLACKSTONE
  {
    name: "Blackstone",
    ticker: "BX",
    sector: "Private Credit & Infra",
    role: "Alternative Asset Manager & Primary AI Private Credit Kingpin",
    disclosedDealsCount: 8,
    totalVolumeUsd: 70_000_000_000,
    debtInvolvedUsd: 32_500_000_000,
    debtTranches: [
      {
        label: "CoreWeave DDTL 4.0 & Credit Facilities",
        amountUsd: 16_000_000_000,
        type: "Asset-Backed Facility",
        creditors: "Blackstone Credit & Insurance (BXCI)",
        notes: "Direct lending anchor underwriting CoreWeave's $8.5B and $7.5B facilities collateralized by GPUs."
      },
      {
        label: "QTS Data Centers Infrastructure Project Debt",
        amountUsd: 10_000_000_000,
        type: "Project Finance",
        creditors: "Blackstone Real Estate / Infrastructure",
        notes: "Multi-campus project financing constructing gigawatt datacenters for Microsoft and AWS."
      },
      {
        label: "European AI Infrastructure Syndicate",
        amountUsd: 6_500_000_000,
        type: "Bank Revolver",
        creditors: "Blackstone European Credit",
        notes: "Debt syndication for pan-European high-performance computing centers."
      }
    ],
    valuationUsd: 175_000_000_000,
    runRateRevenueUsd: 12_000_000_000,
    psMultiple: 14.6,
    circularityConnections: ["CoreWeave", "QTS Data Centers", "Microsoft", "OpenAI", "Magnetar"],
    circularRiskLevel: "High (Circular)",
    circularitySummary: "Underwrites the shadow banking credit plumbing for AI neoclouds; accepts GPU silicon and non-cancellable pre-IPO cloud contracts as senior collateral.",
    riskTier: "High",
    exposureSummary: "The dominant non-bank credit kingpin of the AI boom. Over $32.5B in debt facilities deployed to GPU neoclouds and datacenter campuses.",
  },

  // 6. SCALE AI
  {
    name: "Scale AI",
    ticker: "Private",
    sector: "Frontier Labs",
    role: "Data Annotation, Fine-Tuning & Evaluation Infrastructure",
    disclosedDealsCount: 5,
    totalVolumeUsd: 15_200_000_000,
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
    valuationUsd: 13_800_000_000,
    runRateRevenueUsd: 900_000_000,
    psMultiple: 15.3,
    circularityConnections: ["Meta Platforms", "Amazon AWS", "OpenAI", "US Department of Defense"],
    circularRiskLevel: "Low (Arm's Length)",
    circularitySummary: "Broad, diversified customer base across defense and competing commercial labs; low dependency on circular vendor financing.",
    riskTier: "Guarded",
    exposureSummary: "$1B Series F at $13.8B valuation (15.3× P/S). Strong unit economics with zero debt overhang, serving as the trusted verification baseline for frontier model labs.",
  },

  // 7. MICROSOFT
  {
    name: "Microsoft",
    ticker: "MSFT",
    sector: "Hyperscalers",
    role: "Hyperscaler, Azure Cloud & OpenAI Anchor",
    disclosedDealsCount: 22,
    totalVolumeUsd: 590_000_000_000,
    debtInvolvedUsd: 47_000_000_000,
    debtTranches: [
      {
        label: "Corporate Senior Unsecured Debt",
        amountUsd: 47_000_000_000,
        type: "Senior Notes",
        creditors: "Public Bond Market (AAA Rated)",
        notes: "Corporate balance-sheet debt; $80B+ annual AI capex funded directly from cloud operating cash flow."
      }
    ],
    valuationUsd: 3_150_000_000_000,
    runRateRevenueUsd: 245_000_000_000,
    psMultiple: 12.8,
    circularityConnections: ["OpenAI", "Constellation Energy", "QTS Data Centers", "Mistral", "Nebius"],
    circularRiskLevel: "High (Circular)",
    circularitySummary: "Committed $13B+ into OpenAI; OpenAI commits to spending billions annually on Azure infrastructure. Signed 20-year Three Mile Island nuclear PPA.",
    riskTier: "Elevated",
    exposureSummary: "Anchor funding provider for OpenAI. Massive balance-sheet cash reserves buffer capex, but extreme compute concentration in OpenAI creates indirect vulnerability.",
  },

  // 8. AMAZON AWS
  {
    name: "Amazon AWS",
    ticker: "AMZN",
    sector: "Hyperscalers",
    role: "Hyperscaler & Anthropic Anchor Cloud",
    disclosedDealsCount: 16,
    totalVolumeUsd: 220_000_000_000,
    debtInvolvedUsd: 15_000_000_000,
    debtTranches: [
      {
        label: "AI Infrastructure Bond Offering",
        amountUsd: 15_000_000_000,
        type: "Senior Notes",
        creditors: "Institutional Bond Holders",
        notes: "Dedicated notes offering funding custom Trainium datacenter capacity and Talen nuclear acquisition."
      }
    ],
    valuationUsd: 1_950_000_000_000,
    runRateRevenueUsd: 105_000_000_000,
    psMultiple: 18.5,
    circularityConnections: ["Anthropic", "Talen Energy", "Annapurna Labs"],
    circularRiskLevel: "High (Circular)",
    circularitySummary: "$8B total commitment to Anthropic conditioned on utilizing AWS Trainium2 silicon and Bedrock platform.",
    riskTier: "Elevated",
    exposureSummary: "Issued $15B bond offering for AI capex; $8B strategic stake in Anthropic with custom silicon and nuclear off-take infrastructure.",
  },

  // 9. ALPHABET / GOOGLE
  {
    name: "Alphabet / Google",
    ticker: "GOOGL",
    sector: "Hyperscalers",
    role: "Full-Stack TPU Cloud & Gemini Developer",
    disclosedDealsCount: 18,
    totalVolumeUsd: 240_000_000_000,
    debtInvolvedUsd: 25_000_000_000,
    debtTranches: [
      {
        label: "Global AI Datacenter Capex Notes",
        amountUsd: 25_000_000_000,
        type: "Senior Notes",
        creditors: "Global Bond Syndicate",
        notes: "Debt offering funding TPU v5p/v6 clusters, subsea fiber routes, and Kairos nuclear SMR off-take agreements."
      }
    ],
    valuationUsd: 2_050_000_000_000,
    runRateRevenueUsd: 350_000_000_000,
    psMultiple: 5.8,
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
    disclosedDealsCount: 11,
    totalVolumeUsd: 180_000_000_000,
    debtInvolvedUsd: 30_000_000_000,
    debtTranches: [
      {
        label: "AI Infrastructure Senior Notes Offering",
        amountUsd: 30_000_000_000,
        type: "Senior Notes",
        creditors: "Public Bond Market",
        notes: "Issued $30B senior notes dedicated to procuring 600,000+ H100 equivalents and datacenter shells."
      }
    ],
    valuationUsd: 1_480_000_000_000,
    runRateRevenueUsd: 160_000_000_000,
    psMultiple: 9.2,
    circularityConnections: ["NVIDIA", "Broadcom", "CoreWeave", "Scale AI"],
    circularRiskLevel: "Elevated",
    circularitySummary: "Advertising cash flows subsidize massive GPU procurement, open-sourcing weights to suppress proprietary LLM pricing power of competing labs.",
    riskTier: "Elevated",
    exposureSummary: "$30B in senior notes for AI capex; guides $40B+ annual infrastructure capex with zero direct enterprise subscription revenue.",
  },

  // 11. xAI
  {
    name: "xAI",
    ticker: "Private",
    sector: "Frontier Labs",
    role: "Frontier Model & Colossus Supercluster",
    disclosedDealsCount: 6,
    totalVolumeUsd: 56_000_000_000,
    debtInvolvedUsd: 17_500_000_000,
    debtTranches: [
      {
        label: "Colossus 2 GPU-Collateralized SPV Debt",
        amountUsd: 12_500_000_000,
        type: "SPV Debt",
        creditors: "Apollo Global Management, Diameter Capital",
        notes: "Special Purpose Vehicle issuing high-yield debt directly collateralized by NVIDIA GPU clusters."
      },
      {
        label: "Secured Credit Facility",
        amountUsd: 5_000_000_000,
        type: "Bank Revolver",
        creditors: "Morgan Stanley Syndicate",
        notes: "Secured credit line underwriting Memphis supercluster infrastructure."
      }
    ],
    valuationUsd: 50_000_000_000,
    runRateRevenueUsd: 500_000_000,
    psMultiple: 100.0,
    circularityConnections: ["NVIDIA", "Valor Equity", "Tesla", "Oracle", "Apollo"],
    circularRiskLevel: "Severe (Circular)",
    circularitySummary: "Highest debt-to-revenue ratio among frontier labs (35× debt/revenue). SPV debt relies directly on GPU hardware maintaining secondary liquidation value.",
    riskTier: "Critical",
    exposureSummary: "$17.5B total debt obligations ($12.5B SPV debt + $5B secured bank loan) against $500M annualized revenue (100× P/S multiple).",
  },

  // 12. NVIDIA
  {
    name: "NVIDIA",
    ticker: "NVDA",
    sector: "Semiconductor",
    role: "Accelerator Silicon & Ecosystem Monopoly",
    disclosedDealsCount: 38,
    totalVolumeUsd: 185_000_000_000,
    debtInvolvedUsd: 8_500_000_000,
    debtTranches: [
      {
        label: "Corporate Senior Unsecured Notes",
        amountUsd: 8_500_000_000,
        type: "Senior Notes",
        creditors: "Institutional Bond Holders",
        notes: "Corporate notes fully covered by $35B+ net cash balance sheet and $60B+ operating cash flows."
      }
    ],
    valuationUsd: 3_350_000_000_000,
    runRateRevenueUsd: 120_000_000_000,
    psMultiple: 27.9,
    circularityConnections: ["CoreWeave", "OpenAI", "xAI", "Mistral", "Supermicro", "Blackstone"],
    circularRiskLevel: "Severe (Circular)",
    circularitySummary: "Epicenter of circular financing: invests corporate venture equity directly into compute startups and labs who remit 80%+ of proceeds to purchase NVIDIA chips.",
    riskTier: "Elevated",
    exposureSummary: "Primary beneficiary of $2.81T capex. Zero net balance-sheet debt, but structurally vulnerable if counterparty debt financing dries up.",
    polymarketOdds: {
      marketName: "AI Bubble Burst 2026",
      oddsDisplay: "7.6¢ (7.6%)",
      url: "https://polymarket.com/event/ai-bubble-burst-by?r=AIbubble"
    }
  },

  // 13. NEBIUS GROUP
  {
    name: "Nebius Group",
    ticker: "NBIS",
    sector: "GPU Neoclouds",
    role: "AI Neocloud & Supercomputing Infrastructure",
    disclosedDealsCount: 4,
    totalVolumeUsd: 19_400_000_000,
    debtInvolvedUsd: 1_000_000_000,
    debtTranches: [
      {
        label: "Convertible Notes Private Placement",
        amountUsd: 1_000_000_000,
        type: "Convertible Debt",
        creditors: "Institutional Private Placement",
        notes: "Convertible debt funding datacenter buildout in Finland and France."
      }
    ],
    valuationUsd: 6_200_000_000,
    runRateRevenueUsd: 350_000_000,
    psMultiple: 17.7,
    circularityConnections: ["Microsoft", "NVIDIA", "Accolade"],
    circularRiskLevel: "High (Circular)",
    circularitySummary: "Secured $17.4B compute agreement with Microsoft through 2030, transforming contract backstop into collateral for infrastructure financing.",
    riskTier: "High",
    exposureSummary: "$1.0B convertible notes with $17.4B long-term Microsoft compute off-take contract.",
  },

  // 14. CRUSOE ENERGY
  {
    name: "Crusoe Energy",
    ticker: "Private",
    sector: "GPU Neoclouds",
    role: "Clean Compute & Flare Gas Datacenters",
    disclosedDealsCount: 5,
    totalVolumeUsd: 4_800_000_000,
    debtInvolvedUsd: 3_625_000_000,
    debtTranches: [
      {
        label: "Abilene Datacenter JV Project Financing",
        amountUsd: 3_400_000_000,
        type: "Project Finance",
        creditors: "Blue Owl Capital Syndicate",
        notes: "Joint venture project debt financing 200MW Abilene facility leased by OpenAI."
      },
      {
        label: "GPU Asset-Backed Facility",
        amountUsd: 225_000_000,
        type: "Asset-Backed Facility",
        creditors: "Upper90",
        notes: "Credit facility collateralized by NVIDIA GPU servers."
      }
    ],
    valuationUsd: 3_500_000_000,
    runRateRevenueUsd: 450_000_000,
    psMultiple: 7.7,
    circularityConnections: ["Blue Owl Capital", "Lancium", "OpenAI"],
    circularRiskLevel: "High (Circular)",
    circularitySummary: "Constructing $3.4B datacenter backed by OpenAI tenant contract; relies on continuous private credit refinancing.",
    riskTier: "High",
    exposureSummary: "$3.6B in project debt and credit facilities backing 200MW datacenter campus for OpenAI.",
  },

  // 15. LAMBDA LABS
  {
    name: "Lambda Labs",
    ticker: "Private",
    sector: "GPU Neoclouds",
    role: "GPU Cloud & Compute Clustering",
    disclosedDealsCount: 4,
    totalVolumeUsd: 1_820_000_000,
    debtInvolvedUsd: 500_000_000,
    debtTranches: [
      {
        label: "GPU Asset-Backed Debt Facility",
        amountUsd: 500_000_000,
        type: "Asset-Backed Facility",
        creditors: "Macquarie Group, Braidwell",
        notes: "Asset-backed credit facility collateralized by NVIDIA H100 hardware inventory."
      }
    ],
    valuationUsd: 1_500_000_000,
    runRateRevenueUsd: 250_000_000,
    psMultiple: 6.0,
    circularityConnections: ["NVIDIA", "Macquarie", "Braidwell"],
    circularRiskLevel: "Elevated",
    circularitySummary: "Financed hardware purchases through asset-backed loans collateralized by fast-depreciating chips.",
    riskTier: "Elevated",
    exposureSummary: "$500M GPU-collateralized loan facility plus $320M Series C equity funding.",
  },

  // 16. NORTHERN DATA
  {
    name: "Northern Data",
    ticker: "NB2.DE",
    sector: "GPU Neoclouds",
    role: "HPC Cloud & Crypto Pivot",
    disclosedDealsCount: 3,
    totalVolumeUsd: 1_200_000_000,
    debtInvolvedUsd: 610_000_000,
    debtTranches: [
      {
        label: "Tether Debt Financing Facility",
        amountUsd: 610_000_000,
        type: "Bank Revolver",
        creditors: "Tether Holdings",
        notes: "Debt financing facility from stablecoin issuer Tether funding procurement of 20,000+ GPUs."
      }
    ],
    valuationUsd: 1_400_000_000,
    runRateRevenueUsd: 180_000_000,
    psMultiple: 7.7,
    circularityConnections: ["Tether", "Taiga Cloud"],
    circularRiskLevel: "Severe (Circular)",
    circularitySummary: "Direct debt financing from stablecoin operator Tether; high leverage relative to operating cash flows.",
    riskTier: "Critical",
    exposureSummary: "$610M debt facility from Tether converting bitcoin mining data centers to host NVIDIA H100 GPUs.",
  },

  // 17. MISTRAL AI
  {
    name: "Mistral AI",
    ticker: "Private",
    sector: "Frontier Labs",
    role: "European Open Weights Developer",
    disclosedDealsCount: 5,
    totalVolumeUsd: 25_000_000_000,
    debtInvolvedUsd: 0,
    debtTranches: [
      {
        label: "Funded via Equity Capital",
        amountUsd: 0,
        type: "Bank Revolver",
        creditors: "None",
        notes: "Zero long-term debt; Series D closed at €21B ($23B) valuation."
      }
    ],
    valuationUsd: 23_000_000_000,
    runRateRevenueUsd: 165_000_000,
    psMultiple: 139.4,
    circularityConnections: ["Microsoft", "NVIDIA", "ASML", "CMA CGM"],
    circularRiskLevel: "High (Circular)",
    circularitySummary: "Multiple tech giants hold equity stakes; revenue multiple (139.4× P/S) represents the highest valuation stretch in the tracker.",
    riskTier: "Critical",
    exposureSummary: "Valued at $23B on ~€150M ($165M) annualized run-rate (139.4× P/S). Highest pure multiple froth in the model.",
  },

  // 18. DATABRICKS
  {
    name: "Databricks",
    ticker: "Private",
    sector: "Frontier Labs",
    role: "Enterprise Data & AI Agent Platform",
    disclosedDealsCount: 6,
    totalVolumeUsd: 28_000_000_000,
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
    valuationUsd: 190_000_000_000,
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
    disclosedDealsCount: 4,
    totalVolumeUsd: 120_000_000_000,
    debtInvolvedUsd: 4_100_000_000,
    debtTranches: [
      {
        label: "Corporate Senior Notes",
        amountUsd: 4_100_000_000,
        type: "Senior Notes",
        creditors: "Public Bond Market",
        notes: "Senior unsecured notes; issued Google a $12.2B stock warrant tied to $120B in custom TPU purchases."
      }
    ],
    valuationUsd: 72_000_000_000,
    runRateRevenueUsd: 5_500_000_000,
    psMultiple: 13.0,
    circularityConnections: ["Google", "Amazon", "TSMC"],
    circularRiskLevel: "Elevated",
    circularitySummary: "Warrant agreements granting customers equity upside in exchange for long-term custom silicon purchase commitments.",
    riskTier: "Elevated",
    exposureSummary: "$4.1B in corporate debt; issued Google a $12.2B warrant tied to $120B of TPU-attached custom silicon purchases through 2033.",
  },

  // 20. SUPERMICRO
  {
    name: "Supermicro",
    ticker: "SMCI",
    sector: "Semiconductor",
    role: "Liquid-Cooled GPU Server Integration",
    disclosedDealsCount: 6,
    totalVolumeUsd: 22_000_000_000,
    debtInvolvedUsd: 1_725_000_000,
    debtTranches: [
      {
        label: "Senior Convertible Notes",
        amountUsd: 1_725_000_000,
        type: "Convertible Debt",
        creditors: "Convertible Arbitrage Funds",
        notes: "Convertible notes facing refinancing vulnerability amidst accounting review and delayed 10-K filings."
      }
    ],
    valuationUsd: 28_000_000_000,
    runRateRevenueUsd: 14_900_000_000,
    psMultiple: 1.9,
    circularityConnections: ["NVIDIA", "xAI", "CoreWeave"],
    circularRiskLevel: "High (Circular)",
    circularitySummary: "Dependent on primary NVIDIA GPU allocations and tight inventory turns; auditor changes caused credit spread widening.",
    riskTier: "High",
    exposureSummary: "Delayed 10-K filings and auditor turnover; $1.725B convertible notes face refinancing strain if audit issues persist.",
  },

  // 21. CONSTELLATION ENERGY
  {
    name: "Constellation Energy",
    ticker: "CEG",
    sector: "Nuclear & Energy",
    role: "Nuclear Power & Three Mile Island (Crane) Restart",
    disclosedDealsCount: 3,
    totalVolumeUsd: 16_000_000_000,
    debtInvolvedUsd: 8_200_000_000,
    debtTranches: [
      {
        label: "Utility Project Bond Financing",
        amountUsd: 8_200_000_000,
        type: "Project Finance",
        creditors: "Utility Debt Markets",
        notes: "Bonds underwritten by 20-year Microsoft Power Purchase Agreement to restart Three Mile Island Unit 1."
      }
    ],
    valuationUsd: 82_000_000_000,
    runRateRevenueUsd: 24_000_000_000,
    psMultiple: 3.4,
    circularityConnections: ["Microsoft", "PJM Interconnection"],
    circularRiskLevel: "Low (Arm's Length)",
    circularitySummary: "Long-term arm's-length power off-take contract with investment-grade counterparty Microsoft.",
    riskTier: "Guarded",
    exposureSummary: "Signed landmark 20-year Power Purchase Agreement with Microsoft to restart Unit 1 of Three Mile Island (835MW Crane Center).",
  },

  // 22. TALEN ENERGY
  {
    name: "Talen Energy",
    ticker: "TLN",
    sector: "Nuclear & Energy",
    role: "Susquehanna Nuclear Plant Datacenter Campus",
    disclosedDealsCount: 3,
    totalVolumeUsd: 18_800_000_000,
    debtInvolvedUsd: 3_500_000_000,
    debtTranches: [
      {
        label: "Corporate Senior Debt",
        amountUsd: 3_500_000_000,
        type: "Senior Notes",
        creditors: "Institutional Bond Investors",
        notes: "Corporate debt supporting nuclear generation; sold Cumulus datacenter campus to AWS for $650M."
      }
    ],
    valuationUsd: 11_500_000_000,
    runRateRevenueUsd: 2_100_000_000,
    psMultiple: 5.5,
    circularityConnections: ["Amazon AWS", "FERC"],
    circularRiskLevel: "Moderate",
    circularitySummary: "Direct co-located interconnection challenged by FERC over grid cost allocation.",
    riskTier: "Elevated",
    exposureSummary: "Sold Cumulus datacenter campus to AWS for $650M; FERC challenged co-located interconnection agreement on grid cost-allocation grounds.",
  },
];

export default function CompaniesPage() {
  const [selectedSector, setSelectedSector] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedRisk, setSelectedRisk] = useState<string>("All");
  const [selectedCircularity, setSelectedCircularity] = useState<string>("All");
  const [inspectCompany, setInspectCompany] = useState<CompanyProfile | null>(null);

  const sectors = [
    "All",
    "Frontier Labs",
    "Hyperscalers",
    "GPU Neoclouds",
    "Private Credit & Infra",
    "Semiconductor",
    "Nuclear & Energy",
  ];

  const filteredCompanies = useMemo(() => {
    return COMPANIES.filter((c) => {
      if (selectedSector !== "All" && c.sector !== selectedSector) return false;
      if (selectedRisk !== "All" && c.riskTier !== selectedRisk) return false;
      if (selectedCircularity === "Circular" && !c.circularRiskLevel.includes("Circular")) return false;
      if (selectedCircularity === "Debt" && c.debtInvolvedUsd === 0) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          c.name.toLowerCase().includes(q) ||
          c.role.toLowerCase().includes(q) ||
          c.exposureSummary.toLowerCase().includes(q) ||
          (c.ticker && c.ticker.toLowerCase().includes(q)) ||
          c.circularityConnections.some((con) => con.toLowerCase().includes(q)) ||
          c.debtTranches.some((t) => t.label.toLowerCase().includes(q) || (t.creditors && t.creditors.toLowerCase().includes(q)))
        );
      }
      return true;
    });
  }, [selectedSector, selectedRisk, selectedCircularity, searchQuery]);

  const totalTrackedUsd = useMemo(() => {
    return COMPANIES.reduce((s, c) => s + c.totalVolumeUsd, 0);
  }, []);

  const totalDebtUsd = useMemo(() => {
    return COMPANIES.reduce((s, c) => s + c.debtInvolvedUsd, 0);
  }, []);

  const circularCount = useMemo(() => {
    return COMPANIES.filter((c) => c.circularRiskLevel.includes("Circular")).length;
  }, []);

  return (
    <div className="space-y-8">
      {/* Top Banner Ad */}
      <AdSlot format="leaderboard" />

      {/* Header */}
      <div className="pb-6 border-b border-slate-200 dark:border-zinc-800 space-y-4">
        <div className="flex items-center space-x-2 text-xs font-mono text-slate-500 dark:text-zinc-400">
          <Link href="/" className="hover:text-slate-900 dark:hover:text-white flex items-center space-x-1">
            <ArrowLeft className="w-3 h-3" />
            <span>Home</span>
          </Link>
          <span>/</span>
          <span className="text-slate-900 dark:text-white font-semibold">Corporate Exposure</span>
        </div>

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
          <div>
            <div className="flex items-center space-x-2 mb-1.5">
              <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                INSTITUTIONAL RISK MATRIX
              </span>
              <span className="text-xs font-mono text-slate-500 dark:text-zinc-400">
                {COMPANIES.length} Profiled Entities
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Corporate AI Debt Exposure &amp; Counterparty Matrix
            </h1>
            <p className="text-sm text-slate-600 dark:text-zinc-300 font-sans mt-1 max-w-2xl leading-relaxed">
              Audited debt breakdowns, balance sheet leverage ratios, valuation multiples, and circular counterparty financing 
              mapping across the foundational companies carrying the $2.81T AI superstructure.
            </p>
          </div>

          {/* Quick Metrics Bar */}
          <div className="flex flex-wrap items-center gap-3 text-sm shrink-0">
            <div className="p-3.5 rounded-xl bg-white dark:bg-[#121214] border border-slate-200 dark:border-zinc-800 shadow-sm">
              <span className="text-slate-500 dark:text-zinc-400 block text-[11px] font-mono font-bold uppercase tracking-wider">
                Tracked Volume
              </span>
              <span className="font-black text-slate-900 dark:text-white font-mono text-xl sm:text-2xl">
                ${(totalTrackedUsd / 1e12).toFixed(2)}T
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-white dark:bg-[#121214] border border-slate-200 dark:border-zinc-800 shadow-sm">
              <span className="text-rose-600 dark:text-rose-400 block text-[11px] font-mono font-bold uppercase tracking-wider">
                Verified Debt
              </span>
              <span className="font-black text-rose-600 dark:text-rose-400 font-mono text-xl sm:text-2xl">
                ${(totalDebtUsd / 1e9).toFixed(1)}B
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-white dark:bg-[#121214] border border-slate-200 dark:border-zinc-800 shadow-sm">
              <span className="text-amber-600 dark:text-amber-400 block text-[11px] font-mono font-bold uppercase tracking-wider">
                Circular Entities
              </span>
              <span className="font-black text-amber-600 dark:text-amber-400 font-mono text-xl sm:text-2xl">
                {circularCount} / {COMPANIES.length}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Toolbar: Search, Sector Tabs, Risk Tier, Circularity */}
      <div className="space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative w-full lg:w-96">
            <Search className="w-4 h-4 text-slate-400 dark:text-zinc-500 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder={`Search ${COMPANIES.length} companies, debt tranches, counterparties...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm font-medium rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-[#09090b] text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-xs"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Quick Filter: Circularity / Debt */}
            <div className="flex items-center space-x-1 text-xs">
              <span className="text-xs font-bold text-slate-500 dark:text-zinc-400 mr-1 hidden sm:inline">Filter:</span>
              <button
                onClick={() => setSelectedCircularity("All")}
                className={`px-2.5 py-1.5 rounded-lg font-bold transition-all ${
                  selectedCircularity === "All"
                    ? "bg-slate-900 text-white dark:bg-white dark:text-zinc-950 shadow-xs"
                    : "bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-zinc-300 hover:bg-slate-200"
                }`}
              >
                All
              </button>
              <button
                onClick={() => setSelectedCircularity("Debt")}
                className={`px-2.5 py-1.5 rounded-lg font-bold transition-all flex items-center space-x-1 ${
                  selectedCircularity === "Debt"
                    ? "bg-rose-600 text-white shadow-xs"
                    : "bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-zinc-300 hover:bg-slate-200"
                }`}
              >
                <CreditCard className="w-3 h-3" />
                <span>Has Debt</span>
              </button>
              <button
                onClick={() => setSelectedCircularity("Circular")}
                className={`px-2.5 py-1.5 rounded-lg font-bold transition-all flex items-center space-x-1 ${
                  selectedCircularity === "Circular"
                    ? "bg-amber-600 text-white shadow-xs"
                    : "bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-zinc-300 hover:bg-slate-200"
                }`}
              >
                <Repeat className="w-3 h-3" />
                <span>Circular Only</span>
              </button>
            </div>

            {/* Risk Tier Quick Filter */}
            <div className="flex items-center space-x-1 text-xs pl-2 border-l border-slate-200 dark:border-zinc-800">
              <span className="text-xs font-bold text-slate-500 dark:text-zinc-400 mr-1 hidden sm:inline">Risk:</span>
              {["All", "Critical", "High", "Elevated", "Guarded"].map((tier) => (
                <button
                  key={tier}
                  onClick={() => setSelectedRisk(tier)}
                  className={`px-2.5 py-1.5 rounded-lg font-bold transition-all ${
                    selectedRisk === tier
                      ? "bg-slate-900 text-white dark:bg-white dark:text-zinc-950 shadow-xs"
                      : "bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-zinc-300 hover:bg-slate-200 dark:hover:bg-zinc-700"
                  }`}
                >
                  {tier}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Sector Tabs */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none text-xs sm:text-sm">
          {sectors.map((sec) => {
            const isSelected = selectedSector === sec;
            const count = sec === "All" ? COMPANIES.length : COMPANIES.filter((c) => c.sector === sec).length;
            return (
              <button
                key={sec}
                onClick={() => setSelectedSector(sec)}
                className={`whitespace-nowrap px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                  isSelected
                    ? "bg-slate-900 text-white dark:bg-white dark:text-zinc-950 font-bold shadow-xs"
                    : "bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-zinc-700"
                }`}
              >
                <span>{sec}</span>
                <span className="text-xs opacity-70 ml-1.5">({count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Grid of Company Profiles */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredCompanies.map((c) => {
          let tierBadge = "bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-zinc-300";
          if (c.riskTier === "Critical") {
            tierBadge = "bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 border border-rose-200 dark:border-rose-900/60";
          } else if (c.riskTier === "High") {
            tierBadge = "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-200 dark:border-amber-900/60";
          } else if (c.riskTier === "Elevated") {
            tierBadge = "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400 border border-blue-200 dark:border-blue-900/60";
          } else if (c.riskTier === "Guarded") {
            tierBadge = "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/60";
          }

          let circularBadge = "bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-zinc-400";
          if (c.circularRiskLevel.includes("Severe")) {
            circularBadge = "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 font-bold border border-rose-300 dark:border-rose-800";
          } else if (c.circularRiskLevel.includes("High")) {
            circularBadge = "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-bold border border-amber-300 dark:border-amber-800";
          } else if (c.circularRiskLevel.includes("Elevated")) {
            circularBadge = "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-400";
          }

          return (
            <div
              key={c.name}
              className="bg-white dark:bg-[#121214] border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 sm:p-6 space-y-4 hover:border-slate-300 dark:hover:border-zinc-700 transition-all shadow-sm hover:shadow-md flex flex-col justify-between group"
            >
              <div className="space-y-3">
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                        {c.name}
                      </h3>
                      {c.ticker && (
                        <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-slate-100 dark:bg-zinc-800 text-slate-800 dark:text-zinc-200 font-bold">
                          {c.ticker}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-zinc-400 font-medium mt-0.5">
                      {c.role}
                    </div>
                  </div>

                  <span className={`text-[11px] font-mono px-2.5 py-0.5 rounded-full font-bold uppercase shrink-0 ${tierBadge}`}>
                    {c.riskTier}
                  </span>
                </div>

                {/* Exposure Summary */}
                <p className="text-xs sm:text-sm text-slate-700 dark:text-zinc-300 leading-relaxed font-sans line-clamp-3">
                  {c.exposureSummary}
                </p>

                {/* Metrics Matrix */}
                <div className="grid grid-cols-3 gap-2 text-xs font-mono pt-1">
                  <div className="bg-slate-50 dark:bg-[#09090b] p-2.5 rounded-xl border border-slate-200/80 dark:border-zinc-800/80">
                    <span className="text-slate-500 dark:text-zinc-400 block text-[10px] font-bold uppercase tracking-wider">
                      Committed
                    </span>
                    <span className="text-slate-900 dark:text-white font-extrabold text-sm sm:text-base mt-0.5 block truncate">
                      ${(c.totalVolumeUsd / 1e9).toFixed(1)}B
                    </span>
                  </div>

                  <div className="bg-slate-50 dark:bg-[#09090b] p-2.5 rounded-xl border border-slate-200/80 dark:border-zinc-800/80">
                    <span className="text-slate-500 dark:text-zinc-400 block text-[10px] font-bold uppercase tracking-wider">
                      Debt
                    </span>
                    <span className={c.debtInvolvedUsd > 0 ? "text-rose-600 dark:text-rose-400 font-extrabold text-sm sm:text-base mt-0.5 block truncate" : "text-slate-400 dark:text-zinc-500 text-sm sm:text-base mt-0.5 block font-bold"}>
                      {c.debtInvolvedUsd > 0 ? `$${(c.debtInvolvedUsd / 1e9).toFixed(1)}B` : "None"}
                    </span>
                  </div>

                  <div className="bg-slate-50 dark:bg-[#09090b] p-2.5 rounded-xl border border-slate-200/80 dark:border-zinc-800/80">
                    <span className="text-slate-500 dark:text-zinc-400 block text-[10px] font-bold uppercase tracking-wider">
                      Multiple
                    </span>
                    <span className={c.psMultiple && c.psMultiple > 35 ? "text-amber-600 dark:text-amber-400 font-extrabold text-sm sm:text-base mt-0.5 block" : "text-slate-900 dark:text-white font-extrabold text-sm sm:text-base mt-0.5 block"}>
                      {c.psMultiple ? `${c.psMultiple}× P/S` : "N/A"}
                    </span>
                  </div>
                </div>

                {/* Circular Risk Tag & Links */}
                <div className="space-y-1.5 pt-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 dark:text-zinc-400 font-medium">Circular Risk:</span>
                    <span className={`text-[11px] font-mono px-2 py-0.5 rounded-md ${circularBadge}`}>
                      {c.circularRiskLevel}
                    </span>
                  </div>

                  <div className="flex items-center space-x-1.5 text-slate-600 dark:text-zinc-400">
                    <span className="text-slate-400 dark:text-zinc-500 font-medium">Ties:</span>
                    <span className="font-semibold text-slate-800 dark:text-zinc-200 truncate">
                      {c.circularityConnections.join(", ")}
                    </span>
                  </div>
                </div>
              </div>

              {/* Card Footer: Inspect Button & Ledger Link */}
              <div className="pt-3 border-t border-slate-100 dark:border-zinc-800/80 space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <button
                    onClick={() => setInspectCompany(c)}
                    className="text-indigo-600 dark:text-indigo-400 hover:underline flex items-center space-x-1"
                  >
                    <span>Inspect Debt Tranches ({c.debtTranches.length})</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>

                  <Link
                    href={`/ledger?search=${encodeURIComponent(c.name)}`}
                    className="text-emerald-600 dark:text-emerald-400 hover:underline flex items-center space-x-1 shrink-0"
                  >
                    <span>{c.disclosedDealsCount} Deals</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>

                {/* Prediction Market Link if available */}
                {c.polymarketOdds && (
                  <div className="pt-2 border-t border-slate-100 dark:border-zinc-800/60 flex items-center justify-between text-xs font-mono">
                    <span className="text-indigo-600 dark:text-indigo-400 flex items-center space-x-1">
                      <Zap className="w-3 h-3 fill-current" />
                      <span>Polymarket:</span>
                    </span>
                    <a
                      href={c.polymarketOdds.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-600 dark:text-indigo-400 hover:underline flex items-center space-x-0.5 font-bold"
                    >
                      <span>{c.polymarketOdds.marketName.slice(0, 24)}… ({c.polymarketOdds.oddsDisplay})</span>
                      <ExternalLink className="w-2.5 h-2.5 ml-0.5" />
                    </a>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Inspect Company Modal Dialog */}
      {inspectCompany && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div
            className="bg-white dark:bg-[#121214] border border-slate-300 dark:border-zinc-700 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 shadow-2xl space-y-6 relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setInspectCompany(null)}
              className="absolute top-5 right-5 p-2 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Header */}
            <div className="space-y-1.5 pr-8">
              <div className="flex items-center space-x-2">
                <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  {inspectCompany.name}
                </h2>
                {inspectCompany.ticker && (
                  <span className="text-xs font-mono px-2.5 py-0.5 rounded-md bg-slate-100 dark:bg-zinc-800 text-slate-800 dark:text-zinc-200 font-bold">
                    {inspectCompany.ticker}
                  </span>
                )}
                <span className="text-xs font-mono px-2.5 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 font-bold border border-indigo-200 dark:border-indigo-800">
                  {inspectCompany.sector}
                </span>
              </div>
              <p className="text-sm text-slate-600 dark:text-zinc-300 font-sans">
                {inspectCompany.role}
              </p>
            </div>

            {/* Key Overview Statistics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
              <div className="p-3 bg-slate-50 dark:bg-[#09090b] rounded-xl border border-slate-200 dark:border-zinc-800">
                <span className="text-slate-500 dark:text-zinc-400 block font-bold uppercase text-[10px]">Total Volume</span>
                <span className="text-slate-900 dark:text-white font-extrabold text-base mt-0.5 block">
                  ${(inspectCompany.totalVolumeUsd / 1e9).toFixed(1)}B
                </span>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-[#09090b] rounded-xl border border-slate-200 dark:border-zinc-800">
                <span className="text-rose-600 dark:text-rose-400 block font-bold uppercase text-[10px]">Verified Debt</span>
                <span className="text-rose-600 dark:text-rose-400 font-extrabold text-base mt-0.5 block">
                  ${(inspectCompany.debtInvolvedUsd / 1e9).toFixed(1)}B
                </span>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-[#09090b] rounded-xl border border-slate-200 dark:border-zinc-800">
                <span className="text-slate-500 dark:text-zinc-400 block font-bold uppercase text-[10px]">Valuation</span>
                <span className="text-slate-900 dark:text-white font-extrabold text-base mt-0.5 block">
                  ${(inspectCompany.valuationUsd / 1e9).toFixed(1)}B
                </span>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-[#09090b] rounded-xl border border-slate-200 dark:border-zinc-800">
                <span className="text-slate-500 dark:text-zinc-400 block font-bold uppercase text-[10px]">P/S Multiple</span>
                <span className="text-slate-900 dark:text-white font-extrabold text-base mt-0.5 block">
                  {inspectCompany.psMultiple ? `${inspectCompany.psMultiple}×` : "N/A"}
                </span>
              </div>
            </div>

            {/* Verified Debt Tranches Breakdown */}
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-1 border-b border-slate-200 dark:border-zinc-800">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase font-mono tracking-wider flex items-center space-x-1.5">
                  <CreditCard className="w-4 h-4 text-rose-500" />
                  <span>Verified Debt Tranches &amp; Facilities ({inspectCompany.debtTranches.length})</span>
                </h4>
                <span className="text-xs font-mono font-bold text-rose-600 dark:text-rose-400">
                  Total: ${(inspectCompany.debtInvolvedUsd / 1e9).toFixed(1)}B
                </span>
              </div>

              <div className="space-y-2.5">
                {inspectCompany.debtTranches.map((t, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl bg-slate-50 dark:bg-[#09090b] border border-slate-200/80 dark:border-zinc-800 space-y-1.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="font-bold text-slate-900 dark:text-white text-sm block">
                          {t.label}
                        </span>
                        <div className="text-xs font-mono text-slate-500 dark:text-zinc-400">
                          Structure: <strong className="text-slate-700 dark:text-zinc-300">{t.type}</strong>
                          {t.creditors && <span> • Creditors: {t.creditors}</span>}
                        </div>
                      </div>
                      <span className="text-sm font-mono font-extrabold text-rose-600 dark:text-rose-400 shrink-0">
                        {t.amountUsd > 0 ? `$${(t.amountUsd / 1e9).toFixed(1)}B` : "None"}
                      </span>
                    </div>

                    {t.notes && (
                      <p className="text-xs text-slate-600 dark:text-zinc-400 font-sans leading-relaxed pt-1">
                        {t.notes}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Circularity Details */}
            <div className="space-y-2.5 p-4 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50">
              <div className="flex items-center space-x-2 text-amber-800 dark:text-amber-400 font-mono text-xs font-bold uppercase tracking-wider">
                <Repeat className="w-3.5 h-3.5" />
                <span>Circular Counterparty Risk: {inspectCompany.circularRiskLevel}</span>
              </div>
              <p className="text-xs text-slate-700 dark:text-zinc-300 font-sans leading-relaxed">
                {inspectCompany.circularitySummary}
              </p>
              <div className="text-xs font-mono text-amber-800 dark:text-amber-300 pt-1">
                Connected Nodes: {inspectCompany.circularityConnections.join(" ↔ ")}
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-zinc-800">
              <Link
                href={`/ledger?search=${encodeURIComponent(inspectCompany.name)}`}
                className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-5 py-2.5 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
              >
                <span>View All {inspectCompany.disclosedDealsCount} Deals in Ledger</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>

              {inspectCompany.polymarketOdds && (
                <a
                  href={inspectCompany.polymarketOdds.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-5 py-2.5 rounded-xl font-bold text-xs bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
                >
                  <Zap className="w-3.5 h-3.5 fill-current" />
                  <span>Trade Contract on Polymarket</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Bottom Ad */}
      <AdSlot format="in-feed" />
    </div>
  );
}
