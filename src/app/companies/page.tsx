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
} from "lucide-react";
import { AdSlot } from "@/components/AdSlot";

interface CompanyProfile {
  name: string;
  ticker?: string;
  sector: "Hyperscalers" | "GPU Neoclouds" | "Frontier Labs" | "Semiconductor" | "Nuclear & Energy";
  role: string;
  disclosedDealsCount: number;
  totalVolumeUsd: number;
  debtInvolvedUsd: number;
  valuationUsd: number;
  runRateRevenueUsd?: number;
  psMultiple?: number;
  circularityConnections: string[];
  riskTier: "Critical" | "High" | "Elevated" | "Guarded";
  exposureSummary: string;
}

const COMPANIES: CompanyProfile[] = [
  // 1. HYPERSCALERS
  {
    name: "Oracle",
    ticker: "ORCL",
    sector: "Hyperscalers",
    role: "Hyperscaler & Compute Debt Anchor",
    disclosedDealsCount: 14,
    totalVolumeUsd: 145_000_000_000,
    debtInvolvedUsd: 18_000_000_000,
    valuationUsd: 350_000_000_000,
    runRateRevenueUsd: 53_000_000_000,
    psMultiple: 6.6,
    circularityConnections: ["OpenAI", "Cohere", "CoreWeave", "NVIDIA"],
    riskTier: "Critical",
    exposureSummary: "The market's primary credit benchmark. 5Y CDS jumped from 81bp to 187bp (+131%); issued $18B dedicated AI senior notes in ledger; carries $87.5B total corporate debt with heavy GPU commitments.",
  },
  {
    name: "Microsoft",
    ticker: "MSFT",
    sector: "Hyperscalers",
    role: "Hyperscaler & OpenAI Anchor Cloud",
    disclosedDealsCount: 22,
    totalVolumeUsd: 590_000_000_000,
    debtInvolvedUsd: 0,
    valuationUsd: 3_150_000_000_000,
    runRateRevenueUsd: 245_000_000_000,
    psMultiple: 12.8,
    circularityConnections: ["OpenAI", "Constellation Energy", "QTS Data Centers", "Mistral"],
    riskTier: "Elevated",
    exposureSummary: "Anchor funding for OpenAI ($13B+); signed 20-year Three Mile Island nuclear restart power agreement; massive capex acceleration funded internally via operating cash flow.",
  },
  {
    name: "Amazon AWS",
    ticker: "AMZN",
    sector: "Hyperscalers",
    role: "Hyperscaler & Anthropic Anchor",
    disclosedDealsCount: 16,
    totalVolumeUsd: 220_000_000_000,
    debtInvolvedUsd: 15_000_000_000,
    valuationUsd: 1_950_000_000_000,
    runRateRevenueUsd: 105_000_000_000,
    psMultiple: 18.5,
    circularityConnections: ["Anthropic", "Talen Energy", "Annapurna Labs"],
    riskTier: "Elevated",
    exposureSummary: "Issued $15B bond offering dedicated to AI infrastructure; $8B total commitment to Anthropic with Trainium2 custom silicon; $650M acquisition of Talen nuclear datacenter campus.",
  },
  {
    name: "Alphabet / Google",
    ticker: "GOOGL",
    sector: "Hyperscalers",
    role: "Full-Stack TPU Cloud & Gemini Developer",
    disclosedDealsCount: 18,
    totalVolumeUsd: 240_000_000_000,
    debtInvolvedUsd: 25_000_000_000,
    valuationUsd: 2_050_000_000_000,
    runRateRevenueUsd: 350_000_000_000,
    psMultiple: 5.8,
    circularityConnections: ["Anthropic", "Marvell", "Kairos Power", "Runway"],
    riskTier: "Guarded",
    exposureSummary: "Issued $25B global bond sale for AI capex; TPU v5p/v6 infrastructure lead; signed corporate off-take with Kairos Power for 500MW of Small Modular Nuclear Reactors.",
  },
  {
    name: "Meta Platforms",
    ticker: "META",
    sector: "Hyperscalers",
    role: "Open Weights & Massive Capex Builder",
    disclosedDealsCount: 11,
    totalVolumeUsd: 180_000_000_000,
    debtInvolvedUsd: 30_000_000_000,
    valuationUsd: 1_480_000_000_000,
    runRateRevenueUsd: 160_000_000_000,
    psMultiple: 9.2,
    circularityConnections: ["NVIDIA", "Broadcom", "CoreWeave"],
    riskTier: "Elevated",
    exposureSummary: "Issued $30B senior notes offering for AI infrastructure; targeting 600,000+ H100 equivalents; $40B+ annual capex guide with zero direct enterprise LLM API subscription revenue.",
  },

  // 2. GPU NEOCLOUDS & DEBT ANCHORS
  {
    name: "CoreWeave",
    ticker: "CRWV",
    sector: "GPU Neoclouds",
    role: "Specialized GPU Cloud Provider",
    disclosedDealsCount: 9,
    totalVolumeUsd: 26_700_000_000,
    debtInvolvedUsd: 25_087_500_000,
    valuationUsd: 23_000_000_000,
    runRateRevenueUsd: 2_000_000_000,
    psMultiple: 11.5,
    circularityConnections: ["NVIDIA", "Blackstone", "Magnetar", "OpenAI"],
    riskTier: "Critical",
    exposureSummary: "$25.1B total debt across 5 verified deals: $4.2B 2033 convertibles + $8.5B DDTL 4.0 + $2.59B convertibles + $7.5B Blackstone facility + $2.3B loan collateralized by NVIDIA GPUs.",
  },
  {
    name: "Nebius Group",
    ticker: "NBIS",
    sector: "GPU Neoclouds",
    role: "AI Neocloud & Supercomputing Infrastructure",
    disclosedDealsCount: 4,
    totalVolumeUsd: 19_400_000_000,
    debtInvolvedUsd: 1_000_000_000,
    valuationUsd: 6_200_000_000,
    runRateRevenueUsd: 350_000_000,
    psMultiple: 17.7,
    circularityConnections: ["Microsoft", "NVIDIA", "Accolade"],
    riskTier: "High",
    exposureSummary: "$1.0B convertible notes private placement; secured $17.4B compute infrastructure agreement with Microsoft through 2030.",
  },
  {
    name: "Crusoe Energy",
    ticker: "Private",
    sector: "GPU Neoclouds",
    role: "Clean Compute & Flare Gas Datacenters",
    disclosedDealsCount: 5,
    totalVolumeUsd: 4_800_000_000,
    debtInvolvedUsd: 225_000_000,
    valuationUsd: 3_500_000_000,
    runRateRevenueUsd: 450_000_000,
    psMultiple: 7.7,
    circularityConnections: ["Lancium", "OpenAI", "Blue Owl"],
    riskTier: "High",
    exposureSummary: "$225M GPU asset-backed credit facility from Upper90 plus $3.4B joint venture project financing with Blue Owl Capital for 200MW Abilene datacenter for OpenAI.",
  },
  {
    name: "Lambda Labs",
    ticker: "Private",
    sector: "GPU Neoclouds",
    role: "GPU Cloud & Compute Clustering",
    disclosedDealsCount: 4,
    totalVolumeUsd: 1_820_000_000,
    debtInvolvedUsd: 500_000_000,
    valuationUsd: 1_500_000_000,
    runRateRevenueUsd: 250_000_000,
    psMultiple: 6.0,
    circularityConnections: ["NVIDIA", "Macquarie", "Braidwell"],
    riskTier: "Elevated",
    exposureSummary: "$500M GPU-collateralized asset-backed financing facility backed by NVIDIA H100 inventory, plus $320M Series C equity.",
  },
  {
    name: "Northern Data",
    ticker: "NB2.DE",
    sector: "GPU Neoclouds",
    role: "HPC Cloud & Crypto Infrastructure Pivot",
    disclosedDealsCount: 3,
    totalVolumeUsd: 1_200_000_000,
    debtInvolvedUsd: 610_000_000,
    valuationUsd: 1_400_000_000,
    runRateRevenueUsd: 180_000_000,
    psMultiple: 7.7,
    circularityConnections: ["Tether", "Taiga Cloud"],
    riskTier: "Critical",
    exposureSummary: "$610M (€575M) debt financing facility from stablecoin issuer Tether; pivoting mining infrastructure to host 20,000+ NVIDIA H100 GPUs.",
  },

  // 3. FRONTIER LABS
  {
    name: "OpenAI",
    ticker: "Private",
    sector: "Frontier Labs",
    role: "Frontier Foundation Model Developer",
    disclosedDealsCount: 19,
    totalVolumeUsd: 540_000_000_000,
    debtInvolvedUsd: 4_000_000_000,
    valuationUsd: 157_000_000_000,
    runRateRevenueUsd: 3_700_000_000,
    psMultiple: 42.4,
    circularityConnections: ["Microsoft", "Oracle", "NVIDIA", "SoftBank"],
    riskTier: "High",
    exposureSummary: "$4.0B revolving bank credit facility from JPMorgan/Citi syndicate; valued at $157B at 42.4× run-rate. Anchor tenant for $500B Stargate with massive multi-year compute commitments.",
  },
  {
    name: "Anthropic",
    ticker: "Private",
    sector: "Frontier Labs",
    role: "Frontier Foundation Model Developer & Claude Creator",
    disclosedDealsCount: 14,
    totalVolumeUsd: 185_000_000_000,
    debtInvolvedUsd: 57_000_000_000,
    valuationUsd: 65_000_000_000,
    runRateRevenueUsd: 4_600_000_000,
    psMultiple: 14.1,
    circularityConnections: ["Broadcom", "Amazon", "Google", "Morgan Stanley", "Blackstone"],
    riskTier: "Critical",
    exposureSummary: "$57.0B in verified debt & credit facilities: $42B convertible note facility from Broadcom (underwriting 5-year $125.2B TPU lease) plus $15B multi-bank revolving credit line led by Morgan Stanley, Citi, and JPMorgan against $518B in total cloud commitments.",
  },
  {
    name: "xAI",
    ticker: "Private",
    sector: "Frontier Labs",
    role: "Frontier Model & Colossus Supercluster",
    disclosedDealsCount: 6,
    totalVolumeUsd: 56_000_000_000,
    debtInvolvedUsd: 17_500_000_000,
    valuationUsd: 50_000_000_000,
    runRateRevenueUsd: 500_000_000,
    psMultiple: 100.0,
    circularityConnections: ["NVIDIA", "Valor Equity", "Tesla", "Oracle"],
    riskTier: "Critical",
    exposureSummary: "$17.5B in total debt: $12.5B GPU-collateralized SPV debt for Colossus 2 (Apollo, Diameter participating) plus $5.0B secured debt by Morgan Stanley. Highest debt leverage among frontier labs.",
  },
  {
    name: "Mistral AI",
    ticker: "Private",
    sector: "Frontier Labs",
    role: "European Open Weights Developer",
    disclosedDealsCount: 5,
    totalVolumeUsd: 25_000_000_000,
    debtInvolvedUsd: 0,
    valuationUsd: 23_000_000_000,
    runRateRevenueUsd: 165_000_000,
    psMultiple: 139.4,
    circularityConnections: ["Microsoft", "NVIDIA", "ASML", "CMA CGM"],
    riskTier: "Critical",
    exposureSummary: "Series D closed at €21B ($23B) with ~€150M ($165M) revenue run-rate (139.4× P/S). Highest valuation froth multiple in the model.",
  },
  {
    name: "Databricks",
    ticker: "Private",
    sector: "Frontier Labs",
    role: "Enterprise Data & AI Agent Platform",
    disclosedDealsCount: 6,
    totalVolumeUsd: 28_000_000_000,
    debtInvolvedUsd: 0,
    valuationUsd: 190_000_000_000,
    runRateRevenueUsd: 7_000_000_000,
    psMultiple: 27.1,
    circularityConnections: ["Coatue", "NVIDIA", "Blackstone"],
    riskTier: "Guarded",
    exposureSummary: "$5B strategic round at $190B valuation with $7B revenue run-rate (27.1× P/S) and positive operational cash flow.",
  },
  {
    name: "Scale AI",
    ticker: "Private",
    sector: "Frontier Labs",
    role: "Data Annotation & Evaluation Infrastructure",
    disclosedDealsCount: 4,
    totalVolumeUsd: 15_200_000_000,
    debtInvolvedUsd: 0,
    valuationUsd: 13_800_000_000,
    runRateRevenueUsd: 900_000_000,
    psMultiple: 15.3,
    circularityConnections: ["Meta", "Amazon", "OpenAI", "Defense Dept"],
    riskTier: "Guarded",
    exposureSummary: "$1B Series F at $13.8B valuation; profitable enterprise and government data curation foundation.",
  },

  // 4. HARDWARE & CUSTOM SILICON
  {
    name: "NVIDIA",
    ticker: "NVDA",
    sector: "Semiconductor",
    role: "Accelerator Silicon & Ecosystem",
    disclosedDealsCount: 38,
    totalVolumeUsd: 185_000_000_000,
    debtInvolvedUsd: 0,
    valuationUsd: 3_350_000_000_000,
    runRateRevenueUsd: 120_000_000_000,
    psMultiple: 27.9,
    circularityConnections: ["CoreWeave", "OpenAI", "xAI", "Mistral", "Hugging Face"],
    riskTier: "Elevated",
    exposureSummary: "Primary benefactor of AI capex. Highly circular: invests equity in compute clouds and model labs who use the capital to purchase GPUs.",
  },
  {
    name: "Marvell Technology",
    ticker: "MRVL",
    sector: "Semiconductor",
    role: "Custom AI Accelerators & Interconnect",
    disclosedDealsCount: 4,
    totalVolumeUsd: 120_000_000_000,
    debtInvolvedUsd: 0,
    valuationUsd: 72_000_000_000,
    runRateRevenueUsd: 5_500_000_000,
    psMultiple: 13.0,
    circularityConnections: ["Google", "Amazon", "TPU Ecosystem"],
    riskTier: "Elevated",
    exposureSummary: "Issued Google a $12.2B stock warrant tied to up to $120B of TPU-attached custom silicon purchases through 2033.",
  },
  {
    name: "Supermicro",
    ticker: "SMCI",
    sector: "Semiconductor",
    role: "Liquid-Cooled GPU Server Integration",
    disclosedDealsCount: 6,
    totalVolumeUsd: 22_000_000_000,
    debtInvolvedUsd: 1_725_000_000,
    valuationUsd: 28_000_000_000,
    runRateRevenueUsd: 14_900_000_000,
    psMultiple: 1.9,
    circularityConnections: ["NVIDIA", "xAI", "CoreWeave"],
    riskTier: "High",
    exposureSummary: "Short-seller reports and accounting review delayed 10-K; $1.725B convertible notes face refinancing strain if audit issues persist.",
  },

  // 5. NUCLEAR & CLEAN ENERGY OFF-TAKERS
  {
    name: "Constellation Energy",
    ticker: "CEG",
    sector: "Nuclear & Energy",
    role: "Nuclear Power & Three Mile Island Restart",
    disclosedDealsCount: 3,
    totalVolumeUsd: 16_000_000_000,
    debtInvolvedUsd: 0,
    valuationUsd: 82_000_000_000,
    runRateRevenueUsd: 24_000_000_000,
    psMultiple: 3.4,
    circularityConnections: ["Microsoft", "PJM Interconnection"],
    riskTier: "Guarded",
    exposureSummary: "Signed landmark 20-year Power Purchase Agreement with Microsoft to restart Unit 1 of Three Mile Island (835MW Crane Clean Energy Center).",
  },
  {
    name: "Talen Energy",
    ticker: "TLN",
    sector: "Nuclear & Energy",
    role: "Susquehanna Nuclear Plant Datacenter Campus",
    disclosedDealsCount: 3,
    totalVolumeUsd: 18_800_000_000,
    debtInvolvedUsd: 0,
    valuationUsd: 11_500_000_000,
    runRateRevenueUsd: 2_100_000_000,
    psMultiple: 5.5,
    circularityConnections: ["Amazon AWS", "FERC"],
    riskTier: "Elevated",
    exposureSummary: "Sold Cumulus datacenter campus to AWS for $650M; FERC challenged co-located interconnection agreement on grid cost-allocation grounds.",
  },
];

export default function CompaniesPage() {
  const [selectedSector, setSelectedSector] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedRisk, setSelectedRisk] = useState<string>("All");

  const sectors = ["All", "Hyperscalers", "GPU Neoclouds", "Frontier Labs", "Semiconductor", "Nuclear & Energy"];

  const filteredCompanies = useMemo(() => {
    return COMPANIES.filter((c) => {
      if (selectedSector !== "All" && c.sector !== selectedSector) return false;
      if (selectedRisk !== "All" && c.riskTier !== selectedRisk) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          c.name.toLowerCase().includes(q) ||
          c.role.toLowerCase().includes(q) ||
          c.exposureSummary.toLowerCase().includes(q) ||
          (c.ticker && c.ticker.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [selectedSector, selectedRisk, searchQuery]);

  const totalTrackedUsd = useMemo(() => {
    return COMPANIES.reduce((s, c) => s + c.totalVolumeUsd, 0);
  }, []);

  const totalDebtUsd = useMemo(() => {
    return COMPANIES.reduce((s, c) => s + c.debtInvolvedUsd, 0);
  }, []);

  return (
    <div className="space-y-8">
      {/* Top Banner Ad */}
      <AdSlot format="leaderboard" />

      {/* Header */}
      <div className="pb-6 border-b border-slate-200 dark:border-zinc-800 space-y-3">
        <div className="flex items-center space-x-2 text-xs font-mono text-slate-500 dark:text-zinc-400">
          <Link href="/" className="hover:text-slate-900 dark:hover:text-white flex items-center space-x-1">
            <ArrowLeft className="w-3 h-3" />
            <span>Home</span>
          </Link>
          <span>/</span>
          <span className="text-slate-900 dark:text-white font-semibold">Corporate Exposure</span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
              Corporate AI Exposure &amp; Risk Matrix
            </h1>
            <p className="text-sm text-slate-600 dark:text-zinc-300 font-sans mt-1 max-w-2xl leading-relaxed">
              Systemic risk mapping, debt leverage ratios, and circular counterparty exposure across the {COMPANIES.length} companies 
              carrying the $2.81T AI capital superstructure.
            </p>
          </div>
          <div className="flex items-center space-x-3 text-sm">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#121214] border border-slate-200 dark:border-zinc-800">
              <span className="text-slate-500 dark:text-zinc-400 block text-xs font-bold uppercase tracking-wider">Tracked Volume</span>
              <span className="font-black text-slate-900 dark:text-white font-mono text-xl sm:text-2xl">${(totalTrackedUsd / 1e12).toFixed(2)}T</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#121214] border border-slate-200 dark:border-zinc-800">
              <span className="text-rose-600 dark:text-rose-400 block text-xs font-bold uppercase tracking-wider">Debt Involved</span>
              <span className="font-black text-rose-600 dark:text-rose-400 font-mono text-xl sm:text-2xl">${(totalDebtUsd / 1e9).toFixed(1)}B</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Toolbar: Search, Sector Tabs, Risk Tier */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 dark:text-zinc-500 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder={`Search ${COMPANIES.length} tracked companies...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm font-medium rounded-xl border border-slate-300 dark:border-zinc-700 bg-slate-50 dark:bg-[#09090b] text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Risk Tier Quick Filter */}
          <div className="flex items-center space-x-1.5 text-xs sm:text-sm">
            <span className="text-xs font-bold text-slate-600 dark:text-zinc-400 mr-1 hidden sm:inline">Risk Band:</span>
            {["All", "Critical", "High", "Elevated", "Guarded"].map((tier) => (
              <button
                key={tier}
                onClick={() => setSelectedRisk(tier)}
                className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition-all ${
                  selectedRisk === tier
                    ? "bg-slate-900 text-white dark:bg-white dark:text-zinc-950 shadow-sm"
                    : "bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-zinc-300 hover:bg-slate-200 dark:hover:bg-zinc-700"
                }`}
              >
                {tier}
              </button>
            ))}
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
                    ? "bg-slate-900 text-white dark:bg-white dark:text-zinc-950 font-bold shadow-sm"
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

      {/* Grid of 20 Company Profiles */}
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

          return (
            <div
              key={c.name}
              className="bg-white dark:bg-[#121214] border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 sm:p-6 space-y-4 hover:border-slate-300 dark:hover:border-zinc-700 transition-all shadow-sm hover:shadow-md flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                        {c.name}
                      </h3>
                      {c.ticker && (
                        <span className="text-xs font-mono px-2 py-0.5 rounded-md bg-slate-100 dark:bg-zinc-800 text-slate-800 dark:text-zinc-200 font-bold">
                          {c.ticker}
                        </span>
                      )}
                    </div>
                    <div className="text-xs sm:text-sm text-slate-600 dark:text-zinc-400 font-medium mt-0.5">
                      {c.role}
                    </div>
                  </div>

                  <span className={`text-xs font-mono px-2.5 py-1 rounded-full font-bold uppercase shrink-0 ${tierBadge}`}>
                    {c.riskTier}
                  </span>
                </div>

                <p className="text-sm text-slate-700 dark:text-zinc-300 leading-relaxed font-sans line-clamp-3">
                  {c.exposureSummary}
                </p>

                {/* Metrics Matrix */}
                <div className="grid grid-cols-3 gap-2.5 text-xs font-mono pt-1">
                  <div className="bg-slate-50 dark:bg-[#09090b] p-2.5 rounded-xl border border-slate-200/80 dark:border-zinc-800/80">
                    <span className="text-slate-500 dark:text-zinc-400 block text-xs font-bold uppercase tracking-wider">Deals</span>
                    <span className="text-slate-900 dark:text-white font-extrabold font-tabular text-sm sm:text-base mt-0.5 block">
                      ${(c.totalVolumeUsd / 1e9).toFixed(1)}B
                    </span>
                  </div>
                  <div className="bg-slate-50 dark:bg-[#09090b] p-2.5 rounded-xl border border-slate-200/80 dark:border-zinc-800/80">
                    <span className="text-slate-500 dark:text-zinc-400 block text-xs font-bold uppercase tracking-wider">Debt</span>
                    <span className={c.debtInvolvedUsd > 0 ? "text-rose-600 dark:text-rose-400 font-extrabold font-tabular text-sm sm:text-base mt-0.5 block" : "text-slate-400 dark:text-zinc-500 text-sm sm:text-base mt-0.5 block font-bold"}>
                      {c.debtInvolvedUsd > 0 ? `$${(c.debtInvolvedUsd / 1e9).toFixed(1)}B` : "None"}
                    </span>
                  </div>
                  <div className="bg-slate-50 dark:bg-[#09090b] p-2.5 rounded-xl border border-slate-200/80 dark:border-zinc-800/80">
                    <span className="text-slate-500 dark:text-zinc-400 block text-xs font-bold uppercase tracking-wider">P/S</span>
                    <span className={c.psMultiple && c.psMultiple > 35 ? "text-amber-600 dark:text-amber-400 font-extrabold font-tabular text-sm sm:text-base mt-0.5 block" : "text-slate-900 dark:text-white font-extrabold font-tabular text-sm sm:text-base mt-0.5 block"}>
                      {c.psMultiple ? `${c.psMultiple}×` : "N/A"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Card Footer: Circular Links, Polymarket Trade Links & Ledger Link */}
              <div className="pt-3 border-t border-slate-100 dark:border-zinc-800/80 space-y-2">
                <div className="flex items-center justify-between text-xs sm:text-sm font-medium text-slate-600 dark:text-zinc-400">
                  <div className="truncate max-w-[170px]" title={c.circularityConnections.join(", ")}>
                    <span className="text-slate-400 dark:text-zinc-500">Links: </span>
                    <span className="text-slate-700 dark:text-zinc-300 font-semibold">{c.circularityConnections.slice(0, 2).join(", ")}{c.circularityConnections.length > 2 ? "…" : ""}</span>
                  </div>
                  <Link
                    href={`/ledger?search=${encodeURIComponent(c.name)}`}
                    className="text-emerald-600 dark:text-emerald-400 hover:underline flex items-center space-x-1 font-bold shrink-0"
                  >
                    <span>{c.disclosedDealsCount} Deals</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                {/* Contextual Polymarket Odds Shortcut */}
                {(c.name === "Oracle" || c.name === "OpenAI" || c.name === "NVIDIA" || c.name === "Anthropic") && (
                  <div className="pt-2 border-t border-slate-100 dark:border-zinc-800/60 flex items-center justify-between text-xs font-semibold">
                    <span className="text-indigo-600 dark:text-indigo-400 flex items-center space-x-1">
                      <Zap className="w-3 h-3 fill-current" />
                      <span>Prediction Market:</span>
                    </span>
                    {c.name === "Oracle" && (
                      <a
                        href="https://polymarket.com/?r=AIbubble"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-600 dark:text-indigo-400 hover:underline flex items-center space-x-0.5"
                      >
                        <span>Trade ORCL CDS (38¢)</span>
                        <ExternalLink className="w-2.5 h-2.5 ml-0.5" />
                      </a>
                    )}
                    {c.name === "OpenAI" && (
                      <a
                        href="https://polymarket.com/event/openai-ipo-by?r=AIbubble"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-600 dark:text-indigo-400 hover:underline flex items-center space-x-0.5"
                      >
                        <span>Trade IPO Odds (4.3¢)</span>
                        <ExternalLink className="w-2.5 h-2.5 ml-0.5" />
                      </a>
                    )}
                    {c.name === "NVIDIA" && (
                      <a
                        href="https://polymarket.com/event/ai-bubble-burst-by?r=AIbubble"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-600 dark:text-indigo-400 hover:underline flex items-center space-x-0.5"
                      >
                        <span>Trade AI Downturn (7.6¢)</span>
                        <ExternalLink className="w-2.5 h-2.5 ml-0.5" />
                      </a>
                    )}
                    {c.name === "Anthropic" && (
                      <a
                        href="https://polymarket.com/event/anthropic-acquired-before-2027?r=AIbubble"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-600 dark:text-indigo-400 hover:underline flex items-center space-x-0.5"
                      >
                        <span>Trade Buyout Odds (2.6¢)</span>
                        <ExternalLink className="w-2.5 h-2.5 ml-0.5" />
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Ad */}
      <AdSlot format="in-feed" />
    </div>
  );
}
