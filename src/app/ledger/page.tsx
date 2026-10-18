"use client";

import React, { useState, useMemo } from "react";
import rawDeals from "@/data/deals.json";
import { DealBubbleChart } from "@/components/DealBubbleChart";
import { AdSlot } from "@/components/AdSlot";
import {
  Search,
  Download,
  X,
  ChevronRight,
  CircleDot,
  Layers,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  Share2,
  Sparkles,
  DollarSign,
  TrendingUp,
  Building2,
  Flame,
  ShieldAlert,
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

const deals: Deal[] = rawDeals as Deal[];

export default function LedgerPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedYear, setSelectedYear] = useState<string>("All");
  const [debtOnly, setDebtOnly] = useState(false);
  const [circularOnly, setCircularOnly] = useState(false);
  const [megaOnly, setMegaOnly] = useState(false);
  const [sortBy, setSortBy] = useState<"newest" | "biggest">("newest");
  const [activeDeal, setActiveDeal] = useState<Deal | null>(null);
  const [showBubbleChart, setShowBubbleChart] = useState(true);
  const [pageSize, setPageSize] = useState<number>(25);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [copiedCitation, setCopiedCitation] = useState<boolean>(false);

  const categories = [
    { label: "All", id: "All" },
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

  const filteredDeals = useMemo(() => {
    return deals
      .filter((deal) => {
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchesTitle = deal.title.toLowerCase().includes(q);
          const matchesDesc = deal.description.toLowerCase().includes(q);
          const matchesAmt = deal.amount_display.toLowerCase().includes(q);
          if (!matchesTitle && !matchesDesc && !matchesAmt) return false;
        }

        if (selectedCategory !== "All" && deal.category !== selectedCategory) {
          return false;
        }

        if (selectedYear !== "All") {
          if (selectedYear === "2023 & earlier" && deal.year > 2023) return false;
          if (selectedYear !== "2023 & earlier" && deal.year.toString() !== selectedYear) return false;
        }

        if (debtOnly && !deal.is_debt) return false;
        if (circularOnly && !deal.is_circular) return false;
        if (megaOnly && !deal.is_mega) return false;

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "biggest") {
          return b.amount_usd - a.amount_usd;
        }
        return 0; // Chronological order
      });
  }, [searchQuery, selectedCategory, selectedYear, debtOnly, circularOnly, megaOnly, sortBy]);

  const totalPages = Math.ceil(filteredDeals.length / pageSize);

  const paginatedDeals = useMemo(() => {
    if (pageSize >= filteredDeals.length) return filteredDeals;
    const start = (currentPage - 1) * pageSize;
    return filteredDeals.slice(start, start + pageSize);
  }, [filteredDeals, currentPage, pageSize]);

  const totalVolume = useMemo(() => deals.reduce((acc, d) => acc + d.amount_usd, 0), []);
  const debtVolume = useMemo(() => deals.filter((d) => d.is_debt).reduce((acc, d) => acc + d.amount_usd, 0), []);

  const exportCsv = () => {
    const headers = ["ID", "Title", "Category", "Status", "Amount Disclosed", "Amount USD", "Announced Date", "Year", "Is Debt", "Is Circular", "Description"];
    const rows = filteredDeals.map((d) => [
      d.id,
      `"${d.title.replace(/"/g, '""')}"`,
      `"${d.category}"`,
      `"${d.status}"`,
      `"${d.amount_display}"`,
      d.amount_usd,
      `"${d.announced_date}"`,
      d.year,
      d.is_debt,
      d.is_circular,
      `"${d.description.replace(/"/g, '""')}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `ai-capital-tracker-ledger-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const copyCitation = (deal: Deal) => {
    const text = `${deal.title} (${deal.announced_date}). Disclosed Amount: ${deal.amount_display}. Verification: ${deal.source_type} (${deal.sources_count} primary sources). AI Capital Tracker Verified ID: ${deal.id}.`;
    navigator.clipboard.writeText(text);
    setCopiedCitation(true);
    setTimeout(() => setCopiedCitation(false), 2000);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-200 dark:border-zinc-800">
        <div>
          <div className="flex items-center space-x-2 text-xs sm:text-sm font-semibold text-slate-600 dark:text-zinc-400">
            <span className="text-emerald-600 dark:text-emerald-400">Primary Ledger</span>
            <span>•</span>
            <span className="text-slate-900 dark:text-white font-bold">158 Verified Deals</span>
            <span>•</span>
            <span className="text-slate-900 dark:text-white font-bold">${(totalVolume / 1e12).toFixed(2)}T Disclosed</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-1.5">
            The Verified AI Capital Ledger
          </h1>
          <p className="text-sm sm:text-base text-slate-600 dark:text-zinc-300 font-sans mt-1.5 leading-relaxed">
            Every disclosed investment, debt facility, GPU cloud commitment, and power agreement — newest first.
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={() => setShowBubbleChart(!showBubbleChart)}
            className="flex items-center space-x-2 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold border border-slate-300 dark:border-zinc-700 bg-white dark:bg-[#121214] text-slate-800 dark:text-zinc-200 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-zinc-800/80 transition-all shadow-sm"
          >
            <CircleDot className="w-4 h-4 text-emerald-500" />
            <span>{showBubbleChart ? "Hide Visual Map" : "Show Visual Map"}</span>
            {showBubbleChart ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          <button
            onClick={exportCsv}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-slate-900 dark:bg-white text-white dark:text-zinc-950 hover:opacity-90 transition-opacity shadow-sm"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Top Sponsored Placement */}
      <AdSlot format="leaderboard" slotId="ledger-top" />

      {/* Embedded Deal Bubble Chart */}
      {showBubbleChart && (
        <div className="transition-all">
          <DealBubbleChart
            deals={deals}
            onSelectDeal={(deal) => setActiveDeal(deal)}
          />
        </div>
      )}

      {/* Summary KPI Strip - Redesigned with High Contrast & Large Bolder Typography */}
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
            <span>158 verified transactions</span>
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
              Companies Involved
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

      {/* Search & Filter Bar */}
      <div className="bg-white dark:bg-[#121214] border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 sm:p-6 space-y-4 shadow-sm">
        {/* Search Input & Sort */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-5 h-5 absolute left-3.5 top-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search companies, counterparties, deal names, technologies..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-11 pr-10 py-3 text-sm font-medium rounded-xl border border-slate-300 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-xs sm:text-sm font-bold text-slate-700 dark:text-zinc-300">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as "newest" | "biggest")}
              className="text-xs sm:text-sm font-semibold rounded-xl border border-slate-300 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-white px-3.5 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="newest">Newest First</option>
              <option value="biggest">Disclosed USD (High to Low)</option>
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

        {/* Categories Chips */}
        <div className="flex items-center space-x-2 overflow-x-auto scrollbar-none pb-1">
          {categories.map((cat) => {
            const count = cat.id === "All" ? deals.length : deals.filter((d) => d.category === cat.id).length;
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => {
                  setSelectedCategory(cat.id);
                  setCurrentPage(1);
                }}
                className={`whitespace-nowrap px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                  isSelected
                    ? "bg-slate-900 text-white dark:bg-white dark:text-zinc-950 shadow-sm"
                    : "bg-slate-100 dark:bg-zinc-900 text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/80 dark:hover:bg-zinc-800"
                }`}
              >
                <span>{cat.label}</span>
                <span className="ml-1.5 text-xs opacity-70">({count})</span>
              </button>
            );
          })}
        </div>

        {/* Quick Toggles */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-zinc-800 text-xs sm:text-sm">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                setDebtOnly(!debtOnly);
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                debtOnly
                  ? "bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30 font-bold"
                  : "bg-slate-100 dark:bg-zinc-950 text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              Debt Only ({deals.filter((d) => d.is_debt).length})
            </button>
            <button
              onClick={() => {
                setCircularOnly(!circularOnly);
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                circularOnly
                  ? "bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30 font-bold"
                  : "bg-slate-100 dark:bg-zinc-950 text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              Circular Deals ({deals.filter((d) => d.is_circular).length})
            </button>
            <button
              onClick={() => {
                setMegaOnly(!megaOnly);
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                megaOnly
                  ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 font-bold"
                  : "bg-slate-100 dark:bg-zinc-950 text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              ≥$10B Mega Deals ({deals.filter((d) => d.is_mega).length})
            </button>
          </div>

          <div className="text-slate-600 dark:text-zinc-300 text-xs sm:text-sm font-medium">
            Showing <span className="text-slate-900 dark:text-white font-bold">{filteredDeals.length}</span> deals
          </div>
        </div>
      </div>

      {/* Deals List with Single Tasteful In-Feed Sponsor Placement */}
      <div className="space-y-3">
        {paginatedDeals.map((deal, idx) => {
          return (
            <React.Fragment key={deal.id}>
              {/* Insert In-Feed Partner Callout exactly once on the page */}
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
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-slate-100 dark:bg-zinc-800 text-slate-800 dark:text-zinc-200">
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
                      {deal.is_circular && (
                        <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-blue-500/15 text-blue-600 dark:text-blue-400">
                          Circular Funding
                        </span>
                      )}
                    </div>

                    <h3 className="font-bold text-slate-900 dark:text-white text-lg sm:text-xl group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors leading-snug">
                      {deal.title}
                    </h3>

                    <p className="text-sm sm:text-base text-slate-600 dark:text-zinc-300 leading-relaxed font-sans line-clamp-2">
                      {deal.description}
                    </p>

                    <div className="flex items-center space-x-3 text-xs sm:text-sm text-slate-500 dark:text-zinc-400 font-medium pt-1">
                      <span>{deal.announced_date}</span>
                      <span>•</span>
                      <span>{deal.sources_count} Sourced Citations</span>
                    </div>
                  </div>

                  <div className="text-left md:text-right min-w-[150px] pt-1">
                    <div className="text-2xl sm:text-3xl font-black font-mono text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 font-tabular tracking-tight">
                      {deal.amount_display}
                    </div>
                    {deal.amount_usd > 0 && (
                      <div className="text-xs sm:text-sm font-semibold text-slate-500 dark:text-zinc-400 font-mono font-tabular mt-0.5">
                        ${(deal.amount_usd / 1e9).toFixed(2)}B USD
                      </div>
                    )}
                    <div className="mt-3 text-xs sm:text-sm font-bold text-slate-700 dark:text-zinc-300 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 flex items-center md:justify-end transition-colors">
                      <span>View Details</span>
                      <ChevronRight className="w-4 h-4 ml-0.5 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                </div>
              </div>
            </React.Fragment>
          );
        })}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 rounded-2xl bg-white dark:bg-[#121214] border border-slate-200 dark:border-zinc-800 text-sm font-medium shadow-sm">
          <div className="flex items-center space-x-2 text-slate-600 dark:text-zinc-400">
            <span className="font-semibold">Per page:</span>
            {[25, 50, 100, 158].map((size) => (
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
                {size === 158 ? "All" : size}
              </button>
            ))}
          </div>

          <div className="flex items-center space-x-4">
            <span className="text-slate-600 dark:text-zinc-400 text-xs sm:text-sm font-semibold">
              Page <span className="text-slate-900 dark:text-white font-bold">{currentPage}</span> of {totalPages} ({filteredDeals.length} deals)
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

      {/* Deal Details Modal with Copy Citation */}
      {activeDeal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#121214] border border-slate-200 dark:border-zinc-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-7 space-y-6 shadow-2xl relative">
            <button
              onClick={() => setActiveDeal(null)}
              className="absolute right-5 top-5 text-slate-400 hover:text-slate-900 dark:hover:text-white p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold px-3 py-1 rounded-lg bg-slate-100 dark:bg-zinc-800 text-slate-800 dark:text-zinc-200">
                  {activeDeal.category}
                </span>
                <span className="text-xs font-bold px-3 py-1 rounded-lg bg-slate-50 dark:bg-zinc-950 text-slate-600 dark:text-zinc-400 border border-slate-200 dark:border-zinc-800">
                  {activeDeal.status}
                </span>
                <span className="text-xs font-bold px-3 py-1 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                  {activeDeal.source_type}
                </span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white leading-tight">
                {activeDeal.title}
              </h2>

              <div className="text-3xl sm:text-4xl font-black font-mono text-emerald-600 dark:text-emerald-400 font-tabular pt-1">
                {activeDeal.amount_display}
                {activeDeal.amount_usd > 0 && (
                  <span className="text-sm font-semibold text-slate-500 dark:text-zinc-400 ml-3">
                    (${activeDeal.amount_usd.toLocaleString()} USD)
                  </span>
                )}
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-zinc-950 p-5 rounded-2xl border border-slate-200 dark:border-zinc-800 space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-zinc-400 block">
                Disclosure &amp; Terms
              </span>
              <p className="text-base text-slate-700 dark:text-zinc-200 leading-relaxed font-sans">
                {activeDeal.description}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-slate-50 dark:bg-zinc-950 p-4 rounded-xl border border-slate-200 dark:border-zinc-800">
                <span className="text-slate-500 dark:text-zinc-400 block text-xs font-bold uppercase tracking-wider">Announced</span>
                <span className="text-slate-900 dark:text-white font-bold text-sm sm:text-base mt-0.5 block">{activeDeal.announced_date}</span>
              </div>
              <div className="bg-slate-50 dark:bg-zinc-950 p-4 rounded-xl border border-slate-200 dark:border-zinc-800">
                <span className="text-slate-500 dark:text-zinc-400 block text-xs font-bold uppercase tracking-wider">Verification</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold text-sm sm:text-base mt-0.5 block">{activeDeal.sources_count} Primary Sources</span>
              </div>
              <div className="bg-slate-50 dark:bg-zinc-950 p-4 rounded-xl border border-slate-200 dark:border-zinc-800">
                <span className="text-slate-500 dark:text-zinc-400 block text-xs font-bold uppercase tracking-wider">Debt Structure</span>
                <span className={`text-sm sm:text-base font-bold mt-0.5 block ${activeDeal.is_debt ? "text-rose-600 dark:text-rose-400" : "text-slate-600 dark:text-zinc-300"}`}>
                  {activeDeal.is_debt ? "Borrowed Loan" : "Equity / Contract"}
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <button
                onClick={() => copyCitation(activeDeal)}
                className="w-full sm:w-auto flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold border border-slate-300 dark:border-zinc-700 hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-800 dark:text-zinc-200 transition-colors shadow-sm"
              >
                {copiedCitation ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-500" />
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">Citation Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copy Formatted Citation</span>
                  </>
                )}
              </button>

              <button
                onClick={() => setActiveDeal(null)}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl text-sm font-bold bg-slate-900 dark:bg-white text-white dark:text-zinc-950 hover:opacity-90 transition-opacity shadow-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
