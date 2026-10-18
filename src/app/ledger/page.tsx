"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import Link from "next/link";
import rawDeals from "@/data/deals.json";
import { LedgerTimelineChart } from "@/components/LedgerTimelineChart";
import { AdSlot } from "@/components/AdSlot";
import {
  Search,
  Download,
  X,
  ChevronRight,
  CircleDot,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
  Copy,
  Check,
  Sparkles,
  DollarSign,
  TrendingUp,
  Building2,
  FileSpreadsheet,
  FileJson,
  Cpu,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Table as TableIcon,
  LayoutGrid,
  ShieldCheck,
  AlertTriangle,
  Flame,
  Layers,
  Calendar,
  ExternalLink,
} from "lucide-react";

interface Deal {
  id: string;
  title: string;
  category: string;
  status: string;
  source_type: string;
  amount_display: string;
  amount_usd: number;
  announced_date: string;
  sources_count: number;
  description: string;
  year: number;
  is_debt: boolean;
  is_compute: boolean;
  is_circular: boolean;
  is_mega: boolean;
}

interface DealMeta {
  primaryCompany: string;
  counterparties: string[];
}

const deals: Deal[] = rawDeals as Deal[];

// Known ecosystem entities for clean company & counterparty extraction
const KNOWN_ENTITIES = [
  "OpenAI",
  "Anthropic",
  "Microsoft",
  "NVIDIA",
  "Google",
  "Alphabet",
  "Amazon",
  "AWS",
  "Meta",
  "Oracle",
  "CoreWeave",
  "xAI",
  "Apple",
  "Databricks",
  "Mistral AI",
  "Groq",
  "Hugging Face",
  "Cohere",
  "Scale AI",
  "Crusoe",
  "Lambda Labs",
  "Lambda",
  "Blackstone",
  "SoftBank",
  "Broadcom",
  "Marvell",
  "AMD",
  "Intel",
  "Cisco",
  "Stargate",
  "Vantage",
  "QTS",
  "Equinix",
  "Nebius",
  "Applied Digital",
  "Cipher Mining",
  "TeraWulf",
  "Talen Energy",
  "Constellation Energy",
  "Cameco",
  "Centrus",
  "Kairos Power",
  "Kairos",
  "TerraPower",
  "Oklo",
  "NuScale",
  "Stripe",
  "ByteDance",
  "Tencent",
  "Alibaba",
  "Baidu",
  "Samsung",
  "ASML",
  "TSMC",
  "Tesla",
  "IBM",
  "Snowflake",
  "Palantir",
  "Salesforce",
  "Anduril",
  "Supermicro",
  "Safe Superintelligence",
  "AISLE",
  "OpenRouter",
  "Crusoe Energy",
  "Worldcoin",
  "Figure AI",
  "Figure",
  "Perplexity",
  "Suno",
  "Runway",
  "Together AI",
  "Nscale",
  "Anysphere (Cursor)",
  "Anysphere",
  "SpaceX",
  "Thinking Machines Lab",
  "Thinking Machines",
  "Energy Transfer",
  "CyrusOne",
  "STACK Infrastructure",
  "Alat",
  "Lenovo",
  "Saudi Arabia PIF",
  "PIF",
  "a16z",
  "Yondr Group",
  "Northern Data",
  "Tether",
  "Aker ASA",
  "Coatue",
  "BlackRock",
  "MGX",
  "Silver Lake",
  "EQT",
  "Macquarie",
  "Brookfield",
  "KKR",
  "Goldman Sachs",
  "Morgan Stanley",
  "JPMorgan",
];

// Helper to reliably extract primary company and counterparties
function getDealMeta(deal: Deal): DealMeta {
  const title = deal.title;
  const desc = deal.description;

  let primaryCompany = "";

  // 1. Try matching entity at the start of title
  for (const entity of KNOWN_ENTITIES) {
    if (title.toLowerCase().startsWith(entity.toLowerCase())) {
      primaryCompany = entity;
      break;
    }
  }

  // 2. Try matching entity anywhere in title
  if (!primaryCompany) {
    for (const entity of KNOWN_ENTITIES) {
      if (title.toLowerCase().includes(entity.toLowerCase())) {
        primaryCompany = entity;
        break;
      }
    }
  }

  // 3. Fallback to first capitalized token
  if (!primaryCompany) {
    const firstWordMatch = title.match(/^([A-Z][A-Za-z0-9.&'\-]+(?:\s+[A-Z][A-Za-z0-9.&'\-]+)?)/);
    primaryCompany = firstWordMatch ? firstWordMatch[1] : "Disclosed Entity";
  }

  // Normalize name
  if (primaryCompany === "Anysphere (Cursor)" || primaryCompany === "Anysphere") {
    primaryCompany = "Cursor / Anysphere";
  } else if (primaryCompany === "Alphabet") {
    primaryCompany = "Alphabet / Google";
  }

  // Extract up to 3 distinct counterparties from title or description
  const counterparties: string[] = [];
  const primaryLower = primaryCompany.toLowerCase();

  for (const entity of KNOWN_ENTITIES) {
    const entityLower = entity.toLowerCase();
    if (primaryLower.includes(entityLower) || entityLower.includes(primaryLower)) {
      continue;
    }
    if (title.toLowerCase().includes(entityLower) || desc.toLowerCase().includes(entityLower)) {
      if (!counterparties.includes(entity)) {
        counterparties.push(entity);
      }
      if (counterparties.length >= 3) break;
    }
  }

  return { primaryCompany, counterparties };
}

type SortField = "date" | "amount" | "company" | "category";
type SortDirection = "asc" | "desc";
type ViewMode = "table" | "cards";

export default function LedgerPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedYear, setSelectedYear] = useState<string>("All");
  const [debtOnly, setDebtOnly] = useState(false);
  const [computeOnly, setComputeOnly] = useState(false);
  const [circularOnly, setCircularOnly] = useState(false);
  const [megaOnly, setMegaOnly] = useState(false);

  // Sorting state
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  // View state
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [activeDeal, setActiveDeal] = useState<Deal | null>(null);
  const [showTimelineChart, setShowTimelineChart] = useState(true);
  const [pageSize, setPageSize] = useState<number>(25);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [copiedCitation, setCopiedCitation] = useState<boolean>(false);

  // Handle escape key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && activeDeal) {
        setActiveDeal(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeDeal]);

  const categories = [
    { label: "All Categories", id: "All" },
    { label: "Equity Rounds", id: "Bets & rounds" },
    { label: "Borrowed Debt", id: "Borrowed" },
    { label: "Compute Contracts", id: "Compute contracts" },
    { label: "Power & Land", id: "Power & land" },
    { label: "Mergers & Buyouts", id: "Buyouts & mergers" },
    { label: "Big Construction", id: "Big construction" },
    { label: "Share Sales", id: "Share sales" },
    { label: "Other", id: "Other" },
  ];

  const quickPresets = [
    { label: "Stargate ($500B)", query: "Stargate" },
    { label: "OpenAI ($157B)", query: "OpenAI" },
    { label: "Anthropic", query: "Anthropic" },
    { label: "Oracle Cloud", query: "Oracle" },
    { label: "CoreWeave Debt", query: "CoreWeave" },
    { label: "Blackstone / QTS", query: "Blackstone" },
    { label: "Nuclear Power", query: "Nuclear" },
  ];

  const years = ["All", "2026", "2025", "2024", "2023"];

  // Active filters count
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (searchQuery.trim().length > 0) count++;
    if (selectedCategory !== "All") count++;
    if (selectedYear !== "All") count++;
    if (debtOnly) count++;
    if (computeOnly) count++;
    if (circularOnly) count++;
    if (megaOnly) count++;
    return count;
  }, [searchQuery, selectedCategory, selectedYear, debtOnly, computeOnly, circularOnly, megaOnly]);

  const clearAllFilters = useCallback(() => {
    setSearchQuery("");
    setSelectedCategory("All");
    setSelectedYear("All");
    setDebtOnly(false);
    setComputeOnly(false);
    setCircularOnly(false);
    setMegaOnly(false);
    setCurrentPage(1);
  }, []);

  // Filter and sort deals
  const filteredDeals = useMemo(() => {
    return deals
      .filter((deal) => {
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const meta = getDealMeta(deal);
          const matchesTitle = deal.title.toLowerCase().includes(q);
          const matchesDesc = deal.description.toLowerCase().includes(q);
          const matchesAmt = deal.amount_display.toLowerCase().includes(q);
          const matchesCompany = meta.primaryCompany.toLowerCase().includes(q);
          const matchesCounterparties = meta.counterparties.some((cp) =>
            cp.toLowerCase().includes(q)
          );
          const matchesCategory = deal.category.toLowerCase().includes(q);

          if (
            !matchesTitle &&
            !matchesDesc &&
            !matchesAmt &&
            !matchesCompany &&
            !matchesCounterparties &&
            !matchesCategory
          ) {
            return false;
          }
        }

        if (selectedCategory !== "All" && deal.category !== selectedCategory) {
          return false;
        }

        if (selectedYear !== "All" && deal.year.toString() !== selectedYear) {
          return false;
        }

        if (debtOnly && !deal.is_debt) return false;
        if (computeOnly && !deal.is_compute) return false;
        if (circularOnly && !deal.is_circular) return false;
        if (megaOnly && !deal.is_mega) return false;

        return true;
      })
      .sort((a, b) => {
        let comp = 0;
        if (sortField === "date") {
          const dateA = Date.parse(a.announced_date) || 0;
          const dateB = Date.parse(b.announced_date) || 0;
          comp = dateA - dateB;
          if (comp === 0) comp = a.year - b.year;
        } else if (sortField === "amount") {
          comp = a.amount_usd - b.amount_usd;
        } else if (sortField === "company") {
          const companyA = getDealMeta(a).primaryCompany;
          const companyB = getDealMeta(b).primaryCompany;
          comp = companyA.localeCompare(companyB);
        } else if (sortField === "category") {
          comp = a.category.localeCompare(b.category);
        }

        return sortDirection === "desc" ? -comp : comp;
      });
  }, [
    searchQuery,
    selectedCategory,
    selectedYear,
    debtOnly,
    computeOnly,
    circularOnly,
    megaOnly,
    sortField,
    sortDirection,
  ]);

  const totalPages = Math.ceil(filteredDeals.length / pageSize);

  const paginatedDeals = useMemo(() => {
    if (pageSize >= filteredDeals.length) return filteredDeals;
    const start = (currentPage - 1) * pageSize;
    return filteredDeals.slice(start, start + pageSize);
  }, [filteredDeals, currentPage, pageSize]);

  const totalVolume = useMemo(() => deals.reduce((acc, d) => acc + d.amount_usd, 0), []);
  const debtVolume = useMemo(
    () => deals.filter((d) => d.is_debt).reduce((acc, d) => acc + d.amount_usd, 0),
    []
  );

  // Column header sort handler
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection(field === "company" || field === "category" ? "asc" : "desc");
    }
    setCurrentPage(1);
  };

  // Export to CSV
  const exportCsv = () => {
    const headers = [
      "ID",
      "Company",
      "Counterparties",
      "Deal Title",
      "Category",
      "Status",
      "Disclosed Amount",
      "Amount USD",
      "Announced Date",
      "Year",
      "Is Debt",
      "Is Compute Capacity",
      "Is Circular Flow",
      "Is Megadeal (≥$10B)",
      "Source Classification",
      "Verified Sources Count",
      "Filing Notes & Disclosure",
    ];

    const rows = filteredDeals.map((d) => {
      const meta = getDealMeta(d);
      return [
        d.id,
        `"${meta.primaryCompany.replace(/"/g, '""')}"`,
        `"${meta.counterparties.join("; ").replace(/"/g, '""')}"`,
        `"${d.title.replace(/"/g, '""')}"`,
        `"${d.category}"`,
        `"${d.status}"`,
        `"${d.amount_display}"`,
        d.amount_usd,
        `"${d.announced_date}"`,
        d.year,
        d.is_debt ? "YES" : "NO",
        d.is_compute ? "YES" : "NO",
        d.is_circular ? "YES" : "NO",
        d.is_mega ? "YES" : "NO",
        `"${d.source_type}"`,
        d.sources_count,
        `"${d.description.replace(/"/g, '""')}"`,
      ];
    });

    const csvContent =
      "data:text/csv;charset=utf-8,\uFEFF" +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `ai-capital-tracker-ledger-${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export to JSON
  const exportJson = () => {
    const exportData = filteredDeals.map((d) => {
      const meta = getDealMeta(d);
      return {
        id: d.id,
        company: meta.primaryCompany,
        counterparties: meta.counterparties,
        title: d.title,
        category: d.category,
        status: d.status,
        amount_display: d.amount_display,
        amount_usd: d.amount_usd,
        announced_date: d.announced_date,
        year: d.year,
        classification: {
          is_debt: d.is_debt,
          is_compute: d.is_compute,
          is_circular: d.is_circular,
          is_mega: d.is_mega,
        },
        verification: {
          source_type: d.source_type,
          sources_count: d.sources_count,
        },
        filing_notes: d.description,
      };
    });

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `ai-capital-tracker-ledger-${new Date().toISOString().slice(0, 10)}.json`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Formatted citation copy
  const copyCitation = (deal: Deal) => {
    const meta = getDealMeta(deal);
    const cpText = meta.counterparties.length > 0 ? ` [Counterparties: ${meta.counterparties.join(", ")}]` : "";
    const text = `${deal.title} (${deal.announced_date}). Entity: ${meta.primaryCompany}${cpText}. Disclosed: ${deal.amount_display} (${deal.category}). Verification: ${deal.source_type} with ${deal.sources_count} primary institutional sources. Capital Ledger Reference: https://aicapitaltracker.com/ledger?deal=${deal.id}.`;
    navigator.clipboard.writeText(text);
    setCopiedCitation(true);
    setTimeout(() => setCopiedCitation(false), 2000);
  };

  // Helper for Category Badge Color
  const getCategoryBadgeClass = (category: string) => {
    switch (category) {
      case "Borrowed":
        return "bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/30";
      case "Compute contracts":
        return "bg-cyan-500/15 text-cyan-700 dark:text-cyan-400 border-cyan-500/30";
      case "Bets & rounds":
        return "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30";
      case "Power & land":
        return "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30";
      case "Buyouts & mergers":
        return "bg-purple-500/15 text-purple-700 dark:text-purple-400 border-purple-500/30";
      case "Big construction":
        return "bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30";
      case "Share sales":
        return "bg-violet-500/15 text-violet-700 dark:text-violet-400 border-violet-500/30";
      default:
        return "bg-slate-100 dark:bg-zinc-800 text-slate-800 dark:text-zinc-300 border-slate-300 dark:border-zinc-700";
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5 pb-6 border-b border-slate-200 dark:border-zinc-800">
        <div>
          <nav aria-label="Breadcrumb" className="flex items-center space-x-2 text-xs font-mono text-slate-500 dark:text-zinc-400 mb-2">
            <Link href="/" className="hover:text-slate-900 dark:hover:text-white flex items-center space-x-1">
              <ArrowLeft className="w-3 h-3" />
              <span>Home</span>
            </Link>
            <span>/</span>
            <span className="text-slate-900 dark:text-white font-semibold">Deal Ledger</span>
          </nav>
          <div className="flex items-center space-x-2.5 text-xs sm:text-sm font-semibold text-slate-600 dark:text-zinc-400">
            <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/20">
              Institutional Terminal
            </span>
            <span>•</span>
            <span className="text-slate-900 dark:text-white font-bold">{deals.length} Verified Transactions</span>
            <span>•</span>
            <span className="text-slate-900 dark:text-white font-bold font-mono font-tabular">
              ${(totalVolume / 1e12).toFixed(2)}T Disclosed Volume
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-2">
            The Verified AI Capital Ledger
          </h1>
          <p className="text-sm sm:text-base text-slate-600 dark:text-zinc-300 font-sans mt-1.5 leading-relaxed max-w-4xl">
            Institutional ledger of every disclosed investment, debt facility, GPU cloud commitment, power agreement, and strategic warrant across the global frontier AI supply chain.
          </p>
        </div>

        {/* Global Toolbar Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setShowTimelineChart(!showTimelineChart)}
            className="flex items-center space-x-2 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold border border-slate-300 dark:border-zinc-700 bg-white dark:bg-[#121214] text-slate-800 dark:text-zinc-200 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-zinc-800 transition-all shadow-sm"
          >
            <TrendingUp className="w-4 h-4 text-emerald-500" />
            <span>{showTimelineChart ? "Hide Capital Timeline" : "Show Capital Timeline"}</span>
            {showTimelineChart ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {/* Export Dropdown / Buttons */}
          <div className="flex items-center space-x-1.5 bg-slate-100 dark:bg-zinc-900 p-1 rounded-xl border border-slate-200 dark:border-zinc-800">
            <button
              onClick={exportCsv}
              title="Export filtered transactions as CSV"
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold bg-white dark:bg-[#121214] text-slate-900 dark:text-white hover:text-emerald-600 dark:hover:text-emerald-400 shadow-sm border border-slate-200 dark:border-zinc-700 transition-all"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>CSV</span>
            </button>
            <button
              onClick={exportJson}
              title="Export filtered transactions as JSON"
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold bg-white dark:bg-[#121214] text-slate-900 dark:text-white hover:text-cyan-600 dark:hover:text-cyan-400 shadow-sm border border-slate-200 dark:border-zinc-700 transition-all"
            >
              <FileJson className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
              <span>JSON</span>
            </button>
          </div>

          {/* View Toggle (Table vs Cards) */}
          <div className="flex items-center bg-slate-100 dark:bg-zinc-900 p-1 rounded-xl border border-slate-200 dark:border-zinc-800">
            <button
              onClick={() => setViewMode("table")}
              title="Institutional Table View"
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                viewMode === "table"
                  ? "bg-slate-900 text-white dark:bg-white dark:text-zinc-950 shadow-sm"
                  : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <TableIcon className="w-4 h-4" />
              <span>Table</span>
            </button>
            <button
              onClick={() => setViewMode("cards")}
              title="Card View"
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                viewMode === "cards"
                  ? "bg-slate-900 text-white dark:bg-white dark:text-zinc-950 shadow-sm"
                  : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
              <span>Cards</span>
            </button>
          </div>
        </div>
      </div>

      {/* Top Sponsored Placement */}
      <AdSlot format="leaderboard" slotId="ledger-top" />

      {/* Bespoke Ledger Capital Timeline & Velocity Chart */}
      {showTimelineChart && (
        <div className="transition-all">
          <LedgerTimelineChart
            deals={deals}
            selectedYear={selectedYear}
            onSelectYear={(yr) => {
              setSelectedYear(yr);
              setCurrentPage(1);
            }}
            selectedCategory={selectedCategory}
            onSelectCategory={(cat) => {
              setSelectedCategory(cat);
              setCurrentPage(1);
            }}
            debtOnly={debtOnly}
            onToggleDebtOnly={() => {
              setDebtOnly(!debtOnly);
              setCurrentPage(1);
            }}
          />
        </div>
      )}

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#121214] border border-slate-200 dark:border-zinc-800 border-t-2 border-t-emerald-500 p-5 rounded-2xl shadow-sm hover:border-slate-300 dark:hover:border-zinc-700 hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-zinc-300">
              Total Tracked Capital
            </span>
            <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/60">
              <DollarSign className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
          <div className="text-3xl sm:text-4xl font-black font-mono text-slate-900 dark:text-white mt-2 font-tabular tracking-tight">
            ${(totalVolume / 1e12).toFixed(2)}T
          </div>
          <div className="text-xs sm:text-sm font-medium text-slate-600 dark:text-zinc-400 mt-1.5 flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>{deals.length} primary verified transactions</span>
          </div>
        </div>

        <div className="bg-white dark:bg-[#121214] border border-slate-200 dark:border-zinc-800 border-t-2 border-t-rose-500 p-5 rounded-2xl shadow-sm hover:border-slate-300 dark:hover:border-zinc-700 hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
              Borrowed / Debt Share
            </span>
            <div className="p-2 rounded-lg bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800/60">
              <TrendingUp className="w-4 h-4 text-rose-600 dark:text-rose-400" />
            </div>
          </div>
          <div className="text-3xl sm:text-4xl font-black font-mono text-rose-600 dark:text-rose-400 mt-2 font-tabular tracking-tight">
            {((debtVolume / totalVolume) * 100).toFixed(1)}%
          </div>
          <div className="text-xs sm:text-sm font-medium text-slate-600 dark:text-zinc-400 mt-1.5 flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-500"></span>
            <span>${(debtVolume / 1e9).toFixed(0)}B debt commitments</span>
          </div>
        </div>

        <div className="bg-white dark:bg-[#121214] border border-slate-200 dark:border-zinc-800 border-t-2 border-t-indigo-500 p-5 rounded-2xl shadow-sm hover:border-slate-300 dark:hover:border-zinc-700 hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              Largest Deal
            </span>
            <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800/60">
              <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            </div>
          </div>
          <div className="text-3xl sm:text-4xl font-black font-mono text-slate-900 dark:text-white mt-2 font-tabular tracking-tight">
            $500B
          </div>
          <div className="text-xs sm:text-sm font-medium text-slate-600 dark:text-zinc-400 mt-1.5 flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
            <span>The Stargate Project</span>
          </div>
        </div>

        <div className="bg-white dark:bg-[#121214] border border-slate-200 dark:border-zinc-800 border-t-2 border-t-cyan-500 p-5 rounded-2xl shadow-sm hover:border-slate-300 dark:hover:border-zinc-700 hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400">
              Tracked Entities
            </span>
            <div className="p-2 rounded-lg bg-cyan-50 dark:bg-cyan-950/50 border border-cyan-200 dark:border-cyan-800/60">
              <Building2 className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
            </div>
          </div>
          <div className="text-3xl sm:text-4xl font-black font-mono text-cyan-600 dark:text-cyan-400 mt-2 font-tabular tracking-tight">
            108 Entities
          </div>
          <div className="text-xs sm:text-sm font-medium text-slate-600 dark:text-zinc-400 mt-1.5 flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-cyan-500"></span>
            <span>Labs, clouds, utilities, lenders</span>
          </div>
        </div>
      </div>

      {/* Multi-Filter Toolbar & Search Bar */}
      <div className="bg-white dark:bg-[#121214] border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 sm:p-6 space-y-4 shadow-sm">
        {/* Search Input & Quick Sort Dropdown */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-5 h-5 absolute left-3.5 top-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by company, counterparty, or note..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-11 pr-10 py-3 text-sm font-medium rounded-xl border border-slate-300 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setCurrentPage(1);
                }}
                className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-xs sm:text-sm font-bold text-slate-700 dark:text-zinc-300">Sort:</span>
            <select
              value={`${sortField}-${sortDirection}`}
              onChange={(e) => {
                const [f, d] = e.target.value.split("-") as [SortField, SortDirection];
                setSortField(f);
                setSortDirection(d);
                setCurrentPage(1);
              }}
              className="text-xs sm:text-sm font-semibold rounded-xl border border-slate-300 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-white px-3.5 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
            >
              <option value="date-desc">Date (Newest First)</option>
              <option value="date-asc">Date (Oldest First)</option>
              <option value="amount-desc">Amount USD (High to Low)</option>
              <option value="amount-asc">Amount USD (Low to High)</option>
              <option value="company-asc">Company (A to Z)</option>
              <option value="company-desc">Company (Z to A)</option>
              <option value="category-asc">Category (A to Z)</option>
            </select>
          </div>
        </div>

        {/* Quick Search Preset Tags */}
        <div className="flex items-center space-x-2 overflow-x-auto scrollbar-none pt-1">
          <span className="text-xs font-bold text-slate-600 dark:text-zinc-400 flex-shrink-0 flex items-center space-x-1.5 mr-1">
            <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
            <span>Presets:</span>
          </span>
          {quickPresets.map((preset) => (
            <button
              key={preset.label}
              onClick={() => {
                setSearchQuery(preset.query);
                setCurrentPage(1);
              }}
              className={`text-xs font-semibold px-3 py-1.5 rounded-lg border whitespace-nowrap transition-all ${
                searchQuery === preset.query
                  ? "bg-slate-900 text-white dark:bg-white dark:text-zinc-950 border-transparent shadow-sm font-bold"
                  : "bg-slate-100 dark:bg-zinc-900 text-slate-700 dark:text-zinc-300 border-slate-200 dark:border-zinc-800 hover:border-slate-300 hover:bg-slate-200/70 dark:hover:bg-zinc-800"
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>

        {/* Primary Filter Chips Bar: Debt Only ($196B), Compute Capacity, Circular Financing, Megadeals, Years */}
        <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-zinc-800/80">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 mr-1 flex items-center space-x-1">
              <span>Filter Chips:</span>
            </span>

            {/* Debt Only ($196B) */}
            <button
              onClick={() => {
                setDebtOnly(!debtOnly);
                setCurrentPage(1);
              }}
              className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold border transition-all ${
                debtOnly
                  ? "bg-rose-500/20 text-rose-700 dark:text-rose-400 border-rose-500/40 shadow-sm font-bold"
                  : "bg-slate-50 dark:bg-zinc-900 text-slate-700 dark:text-zinc-300 border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 hover:bg-slate-100 dark:hover:bg-zinc-800"
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${debtOnly ? "bg-rose-500 animate-pulse" : "bg-rose-400"}`}></span>
              <span>Debt Only ($196B)</span>
              <span className="text-xs opacity-75 font-mono">({deals.filter((d) => d.is_debt).length})</span>
            </button>

            {/* Compute Capacity */}
            <button
              onClick={() => {
                setComputeOnly(!computeOnly);
                setCurrentPage(1);
              }}
              className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold border transition-all ${
                computeOnly
                  ? "bg-cyan-500/20 text-cyan-700 dark:text-cyan-400 border-cyan-500/40 shadow-sm font-bold"
                  : "bg-slate-50 dark:bg-zinc-900 text-slate-700 dark:text-zinc-300 border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 hover:bg-slate-100 dark:hover:bg-zinc-800"
              }`}
            >
              <Cpu className={`w-3.5 h-3.5 ${computeOnly ? "text-cyan-600 dark:text-cyan-400" : "text-cyan-500"}`} />
              <span>Compute Capacity</span>
              <span className="text-xs opacity-75 font-mono">({deals.filter((d) => d.is_compute).length})</span>
            </button>

            {/* Circular Financing */}
            <button
              onClick={() => {
                setCircularOnly(!circularOnly);
                setCurrentPage(1);
              }}
              className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold border transition-all ${
                circularOnly
                  ? "bg-blue-500/20 text-blue-700 dark:text-blue-400 border-blue-500/40 shadow-sm font-bold"
                  : "bg-slate-50 dark:bg-zinc-900 text-slate-700 dark:text-zinc-300 border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 hover:bg-slate-100 dark:hover:bg-zinc-800"
              }`}
            >
              <AlertTriangle className={`w-3.5 h-3.5 ${circularOnly ? "text-blue-600 dark:text-blue-400" : "text-blue-500"}`} />
              <span>Circular Financing</span>
              <span className="text-xs opacity-75 font-mono">({deals.filter((d) => d.is_circular).length})</span>
            </button>

            {/* Megadeals (≥$10B) */}
            <button
              onClick={() => {
                setMegaOnly(!megaOnly);
                setCurrentPage(1);
              }}
              className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold border transition-all ${
                megaOnly
                  ? "bg-amber-500/20 text-amber-700 dark:text-amber-400 border-amber-500/40 shadow-sm font-bold"
                  : "bg-slate-50 dark:bg-zinc-900 text-slate-700 dark:text-zinc-300 border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 hover:bg-slate-100 dark:hover:bg-zinc-800"
              }`}
            >
              <Sparkles className={`w-3.5 h-3.5 ${megaOnly ? "text-amber-600 dark:text-amber-400" : "text-amber-500"}`} />
              <span>Megadeals (≥$10B)</span>
              <span className="text-xs opacity-75 font-mono">({deals.filter((d) => d.is_mega).length})</span>
            </button>

            {/* Year Selector Chips */}
            <div className="flex items-center space-x-1 pl-1 border-l border-slate-200 dark:border-zinc-800">
              <span className="text-xs font-bold text-slate-500 dark:text-zinc-400 px-1">Year:</span>
              {years.map((yr) => {
                const isSelected = selectedYear === yr;
                const count = yr === "All" ? deals.length : deals.filter((d) => d.year.toString() === yr).length;
                return (
                  <button
                    key={yr}
                    onClick={() => {
                      setSelectedYear(yr);
                      setCurrentPage(1);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                      isSelected
                        ? "bg-slate-900 text-white dark:bg-white dark:text-zinc-950 font-bold shadow-sm"
                        : "bg-slate-100 dark:bg-zinc-900 text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/80 dark:hover:bg-zinc-800"
                    }`}
                  >
                    <span>{yr}</span>
                    <span className="ml-1 opacity-70 font-mono text-[10px]">({count})</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Categories Chips */}
          <div className="flex items-center space-x-2 overflow-x-auto scrollbar-none pb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 mr-1 flex-shrink-0">
              Sector:
            </span>
            {categories.map((cat) => {
              const count =
                cat.id === "All"
                  ? deals.length
                  : deals.filter((d) => d.category === cat.id).length;
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    setSelectedCategory(cat.id);
                    setCurrentPage(1);
                  }}
                  className={`whitespace-nowrap px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                    isSelected
                      ? "bg-slate-900 text-white dark:bg-white dark:text-zinc-950 shadow-sm"
                      : "bg-slate-100 dark:bg-zinc-900 text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/80 dark:hover:bg-zinc-800"
                  }`}
                >
                  <span>{cat.label}</span>
                  <span className="ml-1.5 text-xs opacity-70 font-mono">({count})</span>
                </button>
              );
            })}
          </div>

          {/* Active Filter Count & Quick Clear All */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-zinc-800/80 text-xs sm:text-sm">
            <div className="flex items-center space-x-3">
              {activeFilterCount > 0 ? (
                <div className="flex items-center space-x-2">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
                    {activeFilterCount} {activeFilterCount === 1 ? "Filter" : "Filters"} Active
                  </span>
                  <button
                    onClick={clearAllFilters}
                    className="inline-flex items-center space-x-1 px-3 py-1 rounded-lg text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Clear All Filters</span>
                  </button>
                </div>
              ) : (
                <span className="text-xs font-medium text-slate-500 dark:text-zinc-400">
                  Showing all market categories &amp; structures
                </span>
              )}
            </div>

            <div className="text-slate-600 dark:text-zinc-300 text-xs sm:text-sm font-medium">
              Filtered:{" "}
              <span className="text-slate-900 dark:text-white font-bold font-mono font-tabular">
                {filteredDeals.length}
              </span>{" "}
              of <span className="font-mono font-tabular">{deals.length}</span> transactions (
              <span className="font-mono font-tabular">
                ${(filteredDeals.reduce((acc, d) => acc + d.amount_usd, 0) / 1e9).toFixed(1)}B
              </span>{" "}
              disclosed)
            </div>
          </div>
        </div>
      </div>

      {/* Primary Display: Sourced Deal Table UX or Cards View */}
      <section aria-labelledby="deals-heading" className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 pb-1">
          <h2 id="deals-heading" className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Verified AI Transactions &amp; Financing Facilities ({filteredDeals.length})
          </h2>
          <span className="text-xs font-mono text-slate-500 dark:text-zinc-400">
            SEC EDGAR Form 10-K/Q, Prospectuses &amp; Bilateral Receipts
          </span>
        </div>

        {viewMode === "table" ? (
          <div className="bg-white dark:bg-[#121214] border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto max-h-[820px] overflow-y-auto scrollbar-thin">
            <table className="w-full text-left border-collapse">
              {/* Sticky Header with Sort Indicators */}
              <thead className="sticky top-0 z-10 bg-slate-100 dark:bg-[#161619] border-b border-slate-200 dark:border-zinc-800">
                <tr className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-zinc-300 select-none">
                  {/* Date Column */}
                  <th
                    onClick={() => handleSort("date")}
                    className="py-4 px-4 sm:px-5 cursor-pointer hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors whitespace-nowrap"
                  >
                    <div className="flex items-center space-x-1.5">
                      <span>Date</span>
                      {sortField === "date" ? (
                        sortDirection === "desc" ? (
                          <ArrowDown className="w-3.5 h-3.5 text-emerald-500" />
                        ) : (
                          <ArrowUp className="w-3.5 h-3.5 text-emerald-500" />
                        )
                      ) : (
                        <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 opacity-60" />
                      )}
                    </div>
                  </th>

                  {/* Company & Deal Column */}
                  <th
                    onClick={() => handleSort("company")}
                    className="py-4 px-4 sm:px-5 cursor-pointer hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                  >
                    <div className="flex items-center space-x-1.5">
                      <span>Company &amp; Transaction</span>
                      {sortField === "company" ? (
                        sortDirection === "desc" ? (
                          <ArrowDown className="w-3.5 h-3.5 text-emerald-500" />
                        ) : (
                          <ArrowUp className="w-3.5 h-3.5 text-emerald-500" />
                        )
                      ) : (
                        <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 opacity-60" />
                      )}
                    </div>
                  </th>

                  {/* Category Column */}
                  <th
                    onClick={() => handleSort("category")}
                    className="py-4 px-4 sm:px-5 cursor-pointer hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors whitespace-nowrap"
                  >
                    <div className="flex items-center space-x-1.5">
                      <span>Category</span>
                      {sortField === "category" ? (
                        sortDirection === "desc" ? (
                          <ArrowDown className="w-3.5 h-3.5 text-emerald-500" />
                        ) : (
                          <ArrowUp className="w-3.5 h-3.5 text-emerald-500" />
                        )
                      ) : (
                        <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 opacity-60" />
                      )}
                    </div>
                  </th>

                  {/* Amount USD Column */}
                  <th
                    onClick={() => handleSort("amount")}
                    className="py-4 px-4 sm:px-5 cursor-pointer hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors text-right whitespace-nowrap"
                  >
                    <div className="flex items-center justify-end space-x-1.5">
                      <span>Disclosed ($USD)</span>
                      {sortField === "amount" ? (
                        sortDirection === "desc" ? (
                          <ArrowDown className="w-3.5 h-3.5 text-emerald-500" />
                        ) : (
                          <ArrowUp className="w-3.5 h-3.5 text-emerald-500" />
                        )
                      ) : (
                        <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 opacity-60" />
                      )}
                    </div>
                  </th>

                  {/* Classification Column */}
                  <th className="py-4 px-4 sm:px-5 whitespace-nowrap hidden lg:table-cell">
                    <span>Structure &amp; Flow</span>
                  </th>

                  {/* Verification Column */}
                  <th className="py-4 px-4 sm:px-5 whitespace-nowrap hidden md:table-cell">
                    <span>Verification</span>
                  </th>

                  {/* Action Column */}
                  <th className="py-4 px-4 sm:px-5 text-right whitespace-nowrap">
                    <span>Action</span>
                  </th>
                </tr>
              </thead>

              {/* Table Body with alternating subtle row highlights and monospace tabular figures */}
              <tbody className="divide-y divide-slate-200 dark:divide-zinc-800 text-sm">
                {paginatedDeals.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-500 dark:text-zinc-400">
                      <div className="max-w-md mx-auto space-y-3">
                        <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto" />
                        <p className="text-base font-bold text-slate-800 dark:text-zinc-200">
                          No transactions match your current filters.
                        </p>
                        <p className="text-xs text-slate-500 dark:text-zinc-400">
                          Try clearing active filter chips or adjusting your search query.
                        </p>
                        <button
                          onClick={clearAllFilters}
                          className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 text-white dark:bg-white dark:text-zinc-950 shadow-sm"
                        >
                          Reset All Filters
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedDeals.map((deal, idx) => {
                    const meta = getDealMeta(deal);
                    return (
                      <React.Fragment key={deal.id}>
                        {/* Single Tasteful In-Feed Sponsor Placement after row 10 */}
                        {idx === 10 && (
                          <tr>
                            <td colSpan={7} className="p-3 bg-slate-50 dark:bg-zinc-950">
                              <AdSlot format="in-feed" slotId="ledger-mid" />
                            </td>
                          </tr>
                        )}

                        <tr
                          onClick={() => setActiveDeal(deal)}
                          className="group even:bg-slate-50/50 dark:even:bg-zinc-900/30 odd:bg-white dark:odd:bg-[#121214] hover:bg-emerald-500/5 dark:hover:bg-emerald-500/10 cursor-pointer transition-colors"
                        >
                          {/* Date */}
                          <td className="py-3.5 px-4 sm:px-5 whitespace-nowrap align-middle">
                            <div className="font-medium text-slate-900 dark:text-white">
                              {deal.announced_date}
                            </div>
                            <div className="text-xs font-mono font-tabular text-slate-500 dark:text-zinc-400">
                              {deal.year}
                            </div>
                          </td>

                          {/* Company & Transaction */}
                          <td className="py-3.5 px-4 sm:px-5 align-middle max-w-xs sm:max-w-md">
                            <div className="flex items-center space-x-2">
                              <span className="font-bold text-base text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                                {meta.primaryCompany}
                              </span>
                              {meta.counterparties.length > 0 && (
                                <span className="hidden sm:inline-flex items-center text-xs text-slate-500 dark:text-zinc-400 truncate max-w-[180px]">
                                  w/ {meta.counterparties.slice(0, 2).join(", ")}
                                </span>
                              )}
                            </div>
                            <div className="text-xs sm:text-sm text-slate-600 dark:text-zinc-300 font-sans line-clamp-1 mt-0.5">
                              {deal.title}
                            </div>
                            {/* Badges on mobile/tablet */}
                            <div className="flex flex-wrap items-center gap-1.5 mt-1 lg:hidden">
                              {deal.is_debt && (
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-500/15 text-rose-600 dark:text-rose-400">
                                  Debt
                                </span>
                              )}
                              {deal.is_compute && (
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-cyan-500/15 text-cyan-600 dark:text-cyan-400">
                                  Compute
                                </span>
                              )}
                              {deal.is_circular && (
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-500/15 text-blue-600 dark:text-blue-400">
                                  Circular
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Category */}
                          <td className="py-3.5 px-4 sm:px-5 whitespace-nowrap align-middle">
                            <span
                              className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-md border ${getCategoryBadgeClass(
                                deal.category
                              )}`}
                            >
                              {deal.category}
                            </span>
                            <div className="text-[11px] font-medium text-slate-500 dark:text-zinc-400 mt-1">
                              {deal.status}
                            </div>
                          </td>

                          {/* Disclosed USD Amount */}
                          <td className="py-3.5 px-4 sm:px-5 text-right whitespace-nowrap align-middle">
                            <div className="font-black font-mono font-tabular text-base sm:text-lg text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 tracking-tight">
                              {deal.amount_display}
                            </div>
                            {deal.amount_usd > 0 && (
                              <div className="text-xs font-mono font-tabular text-slate-500 dark:text-zinc-400">
                                ${(deal.amount_usd / 1e9).toFixed(2)}B USD
                              </div>
                            )}
                          </td>

                          {/* Structure & Flow (Desktop) */}
                          <td className="py-3.5 px-4 sm:px-5 whitespace-nowrap align-middle hidden lg:table-cell">
                            <div className="flex flex-wrap items-center gap-1.5">
                              {deal.is_debt && (
                                <span className="text-xs font-bold px-2 py-0.5 rounded bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30">
                                  Debt Facility
                                </span>
                              )}
                              {deal.is_compute && (
                                <span className="text-xs font-bold px-2 py-0.5 rounded bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30">
                                  Compute
                                </span>
                              )}
                              {deal.is_circular && (
                                <span className="text-xs font-bold px-2 py-0.5 rounded bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30">
                                  Circular Flow
                                </span>
                              )}
                              {deal.is_mega && (
                                <span className="text-xs font-bold px-2 py-0.5 rounded bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                                  ≥$10B Mega
                                </span>
                              )}
                              {!deal.is_debt && !deal.is_compute && !deal.is_circular && (
                                <span className="text-xs font-medium px-2 py-0.5 rounded bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400">
                                  Direct Equity
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Verification (Desktop) */}
                          <td className="py-3.5 px-4 sm:px-5 whitespace-nowrap align-middle hidden md:table-cell">
                            <div className="flex items-center space-x-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                              <ShieldCheck className="w-4 h-4 flex-shrink-0" />
                              <span>{deal.sources_count} Sourced</span>
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-zinc-400 truncate max-w-[130px] mt-0.5">
                              {deal.source_type}
                            </div>
                          </td>

                          {/* Action */}
                          <td className="py-3.5 px-4 sm:px-5 text-right whitespace-nowrap align-middle">
                            <span className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-700 dark:text-zinc-300 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 group-hover:bg-emerald-500/10 transition-all">
                              <span>Details</span>
                              <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                            </span>
                          </td>
                        </tr>
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Alternative Card View */
        <div className="space-y-3">
          {paginatedDeals.map((deal, idx) => {
            const meta = getDealMeta(deal);
            return (
              <React.Fragment key={deal.id}>
                {/* In-Feed Partner Callout */}
                {idx === 10 && (
                  <AdSlot format="in-feed" slotId="ledger-mid" />
                )}

                <div
                  onClick={() => setActiveDeal(deal)}
                  className="bg-white dark:bg-[#121214] border border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 rounded-2xl p-5 sm:p-6 transition-all cursor-pointer group shadow-sm hover:shadow-md"
                >
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div className="space-y-2.5 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-slate-100 dark:bg-zinc-800 text-slate-800 dark:text-zinc-200">
                          {meta.primaryCompany}
                        </span>
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-md border ${getCategoryBadgeClass(deal.category)}`}>
                          {deal.category}
                        </span>
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-slate-50 dark:bg-zinc-950 text-slate-600 dark:text-zinc-400 border border-slate-200 dark:border-zinc-800">
                          {deal.status}
                        </span>
                        {deal.is_debt && (
                          <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-rose-500/15 text-rose-600 dark:text-rose-400">
                            Debt Loan
                          </span>
                        )}
                        {deal.is_compute && (
                          <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-cyan-500/15 text-cyan-600 dark:text-cyan-400">
                            Compute Capacity
                          </span>
                        )}
                        {deal.is_circular && (
                          <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-blue-500/15 text-blue-600 dark:text-blue-400">
                            Circular Flow
                          </span>
                        )}
                      </div>

                      <h3 className="font-bold text-slate-900 dark:text-white text-lg sm:text-xl group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors leading-snug">
                        {deal.title}
                      </h3>

                      <p className="text-sm sm:text-base text-slate-600 dark:text-zinc-300 leading-relaxed font-sans line-clamp-2">
                        {deal.description}
                      </p>

                      <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm text-slate-500 dark:text-zinc-400 font-medium pt-1">
                        <span className="font-bold text-slate-700 dark:text-zinc-300">{deal.announced_date}</span>
                        <span>•</span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{deal.sources_count} Sourced Citations</span>
                        {meta.counterparties.length > 0 && (
                          <>
                            <span>•</span>
                            <span>Counterparties: {meta.counterparties.join(", ")}</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="text-left md:text-right min-w-[160px] pt-1">
                      <div className="text-2xl sm:text-3xl font-black font-mono text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 font-tabular tracking-tight">
                        {deal.amount_display}
                      </div>
                      {deal.amount_usd > 0 && (
                        <div className="text-xs sm:text-sm font-semibold text-slate-500 dark:text-zinc-400 font-mono font-tabular mt-0.5">
                          ${(deal.amount_usd / 1e9).toFixed(2)}B USD
                        </div>
                      )}
                      <div className="mt-3 text-xs sm:text-sm font-bold text-slate-700 dark:text-zinc-300 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 flex items-center md:justify-end transition-colors">
                        <span>View Disclosure</span>
                        <ChevronRight className="w-4 h-4 ml-0.5 group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </div>
                  </div>
                </div>
              </React.Fragment>
            );
          })}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 rounded-2xl bg-white dark:bg-[#121214] border border-slate-200 dark:border-zinc-800 text-sm font-medium shadow-sm">
          <div className="flex items-center space-x-2 text-slate-600 dark:text-zinc-400">
            <span className="font-semibold text-xs sm:text-sm">Rows per page:</span>
            {[25, 50, 100, deals.length].map((size) => (
              <button
                key={size}
                onClick={() => {
                  setPageSize(size);
                  setCurrentPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition-all ${
                  pageSize === size
                    ? "bg-slate-900 text-white dark:bg-white dark:text-zinc-950 shadow-sm"
                    : "hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300"
                }`}
              >
                {size === deals.length ? "All" : size}
              </button>
            ))}
          </div>

          <div className="flex items-center space-x-4">
            <span className="text-slate-600 dark:text-zinc-400 text-xs sm:text-sm font-semibold">
              Page <span className="text-slate-900 dark:text-white font-bold">{currentPage}</span> of{" "}
              <span className="font-bold">{totalPages}</span> ({filteredDeals.length} transactions)
            </span>
            <div className="flex items-center space-x-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-900 dark:text-white font-semibold text-xs sm:text-sm transition-all"
              >
                Previous
              </button>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-900 dark:text-white font-semibold text-xs sm:text-sm transition-all"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
      </section>

      {/* Comprehensive Deal Disclosure Modal */}
      {activeDeal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="deal-disclosure-title"
          onClick={() => setActiveDeal(null)}
          className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-in fade-in duration-150"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-[#121214] border border-slate-200 dark:border-zinc-800 rounded-3xl max-w-3xl w-full max-h-[92vh] overflow-y-auto p-6 sm:p-8 space-y-6 shadow-2xl relative text-slate-900 dark:text-white"
          >
            {/* Top Close Button */}
            <button
              onClick={() => setActiveDeal(null)}
              className="absolute right-5 top-5 text-slate-400 hover:text-slate-900 dark:hover:text-white p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Deal Header Section */}
            <div className="space-y-3 pr-8">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold px-3 py-1 rounded-lg bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
                  {getDealMeta(activeDeal).primaryCompany}
                </span>
                <span className={`text-xs font-semibold px-3 py-1 rounded-lg border ${getCategoryBadgeClass(activeDeal.category)}`}>
                  {activeDeal.category}
                </span>
                <span className="text-xs font-semibold px-3 py-1 rounded-lg bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300">
                  {activeDeal.status}
                </span>
                <span className="text-xs font-semibold px-3 py-1 rounded-lg bg-slate-50 dark:bg-zinc-950 text-slate-600 dark:text-zinc-400 border border-slate-200 dark:border-zinc-800">
                  {activeDeal.source_type}
                </span>
              </div>

              <h3 id="deal-disclosure-title" className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white leading-tight">
                {activeDeal.title}
              </h3>

              <div className="pt-2 flex flex-col sm:flex-row sm:items-baseline gap-2">
                <span className="text-3xl sm:text-4xl font-black font-mono text-emerald-600 dark:text-emerald-400 font-tabular tracking-tight">
                  {activeDeal.amount_display}
                </span>
                {activeDeal.amount_usd > 0 && (
                  <span className="text-sm sm:text-base font-semibold font-mono font-tabular text-slate-500 dark:text-zinc-400">
                    (${activeDeal.amount_usd.toLocaleString()} USD Disclosed Value)
                  </span>
                )}
              </div>
            </div>

            {/* Classification & Structure Highlights */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {/* Classification Pill */}
              <div className="bg-slate-50 dark:bg-zinc-950 p-4 rounded-2xl border border-slate-200 dark:border-zinc-800 space-y-1">
                <span className="text-slate-500 dark:text-zinc-400 block text-xs font-bold uppercase tracking-wider">
                  Capital Classification
                </span>
                <div className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                  {activeDeal.is_debt ? (
                    <span className="text-rose-600 dark:text-rose-400 flex items-center space-x-1.5">
                      <TrendingUp className="w-4 h-4" />
                      <span>Debt Loan / Senior Convertible Notes</span>
                    </span>
                  ) : activeDeal.is_compute ? (
                    <span className="text-cyan-600 dark:text-cyan-400 flex items-center space-x-1.5">
                      <Cpu className="w-4 h-4" />
                      <span>Compute Capacity Commitment</span>
                    </span>
                  ) : activeDeal.is_circular ? (
                    <span className="text-blue-600 dark:text-blue-400 flex items-center space-x-1.5">
                      <AlertTriangle className="w-4 h-4" />
                      <span>Circular Financing Mechanism</span>
                    </span>
                  ) : (
                    <span className="text-emerald-600 dark:text-emerald-400 flex items-center space-x-1.5">
                      <DollarSign className="w-4 h-4" />
                      <span>Direct Equity / Strategic Stake</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Counterparties Summary */}
              <div className="bg-slate-50 dark:bg-zinc-950 p-4 rounded-2xl border border-slate-200 dark:border-zinc-800 space-y-1">
                <span className="text-slate-500 dark:text-zinc-400 block text-xs font-bold uppercase tracking-wider">
                  Primary Counterparties
                </span>
                <div className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                  {getDealMeta(activeDeal).counterparties.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5 mt-0.5">
                      {getDealMeta(activeDeal).counterparties.map((cp) => (
                        <span
                          key={cp}
                          className="px-2 py-0.5 rounded-md bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs font-bold text-slate-800 dark:text-zinc-200"
                        >
                          {cp}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-slate-500 dark:text-zinc-400 font-medium text-xs sm:text-sm">
                      Direct bilateral disclosure / proprietary issuer
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Circular Financing Advisory Alert (if active) */}
            {activeDeal.is_circular && (
              <div className="bg-blue-500/10 border border-blue-500/30 text-blue-800 dark:text-blue-300 p-4 rounded-2xl flex items-start space-x-3">
                <AlertTriangle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="text-xs sm:text-sm font-bold uppercase tracking-wider">
                    Circular Financing Structure Alert
                  </h4>
                  <p className="text-xs sm:text-sm leading-relaxed opacity-90">
                    This transaction features vendor financing, warrant-linked cloud spend, or reciprocal compute leaseback commitments between the provider and customer.
                  </p>
                </div>
              </div>
            )}

            {/* Institutional Metadata 4-Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-slate-50 dark:bg-zinc-950 p-3.5 rounded-xl border border-slate-200 dark:border-zinc-800">
                <span className="text-slate-500 dark:text-zinc-400 block text-xs font-bold uppercase tracking-wider">
                  Announced Date
                </span>
                <span className="text-slate-900 dark:text-white font-bold text-sm sm:text-base mt-0.5 block">
                  {activeDeal.announced_date}
                </span>
              </div>
              <div className="bg-slate-50 dark:bg-zinc-950 p-3.5 rounded-xl border border-slate-200 dark:border-zinc-800">
                <span className="text-slate-500 dark:text-zinc-400 block text-xs font-bold uppercase tracking-wider">
                  Filing Year
                </span>
                <span className="text-slate-900 dark:text-white font-bold text-sm sm:text-base mt-0.5 block font-mono font-tabular">
                  {activeDeal.year}
                </span>
              </div>
              <div className="bg-slate-50 dark:bg-zinc-950 p-3.5 rounded-xl border border-slate-200 dark:border-zinc-800">
                <span className="text-slate-500 dark:text-zinc-400 block text-xs font-bold uppercase tracking-wider">
                  Verification
                </span>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold text-sm sm:text-base mt-0.5 block">
                  {activeDeal.sources_count} Primary Sources
                </span>
              </div>
              <div className="bg-slate-50 dark:bg-zinc-950 p-3.5 rounded-xl border border-slate-200 dark:border-zinc-800">
                <span className="text-slate-500 dark:text-zinc-400 block text-xs font-bold uppercase tracking-wider">
                  Ledger ID
                </span>
                <span className="text-slate-800 dark:text-zinc-300 font-mono text-xs sm:text-sm mt-0.5 block truncate">
                  {activeDeal.id}
                </span>
              </div>
            </div>

            {/* Full Filing Notes & Description */}
            <div className="bg-slate-50 dark:bg-zinc-950 p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-zinc-800 space-y-2.5">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 block">
                Filing Notes &amp; Regulatory Disclosures
              </span>
              <p className="text-sm sm:text-base text-slate-700 dark:text-zinc-200 leading-relaxed font-sans">
                {activeDeal.description}
              </p>
            </div>

            {/* Modal Bottom Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <button
                onClick={() => copyCitation(activeDeal)}
                className="w-full sm:w-auto flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold border border-slate-300 dark:border-zinc-700 hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-800 dark:text-zinc-200 transition-colors shadow-sm"
              >
                {copiedCitation ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-500" />
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                      Institutional Citation Copied
                    </span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copy Formatted Citation</span>
                  </>
                )}
              </button>

              <div className="flex items-center space-x-2 w-full sm:w-auto">
                <button
                  onClick={() => {
                    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(activeDeal, null, 2));
                    const link = document.createElement("a");
                    link.setAttribute("href", dataStr);
                    link.setAttribute("download", `${activeDeal.id}-disclosure.json`);
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }}
                  className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold border border-slate-300 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900 text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  Export Deal JSON
                </button>
                <button
                  onClick={() => setActiveDeal(null)}
                  className="flex-1 sm:flex-initial px-6 py-2.5 rounded-xl text-sm font-bold bg-slate-900 dark:bg-white text-white dark:text-zinc-950 hover:opacity-90 transition-opacity shadow-sm"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
