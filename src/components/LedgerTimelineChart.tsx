"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Calendar,
  TrendingUp,
  Layers,
  ArrowRight,
  Filter,
  RefreshCw,
  Building2,
  DollarSign,
  Cpu,
  ShieldAlert,
} from "lucide-react";

export interface DealData {
  id: string;
  title: string;
  category: string;
  amount_display: string;
  amount_usd: number;
  announced_date: string;
  year?: number;
  is_debt?: boolean;
  is_compute?: boolean;
  is_circular?: boolean;
  is_mega?: boolean;
}

interface LedgerTimelineChartProps {
  deals: DealData[];
  selectedYear?: string;
  onSelectYear?: (year: string) => void;
  selectedCategory?: string;
  onSelectCategory?: (category: string) => void;
  debtOnly?: boolean;
  onToggleDebtOnly?: () => void;
}

interface YearStats {
  year: number;
  dealCount: number;
  totalVolume: number;
  debtVolume: number;
  computeVolume: number;
  equityVolume: number;
  cumulativeVolume: number;
  largestDealTitle: string;
  largestDealAmount: string;
}

export function LedgerTimelineChart({
  deals,
  selectedYear = "All",
  onSelectYear,
  selectedCategory = "All",
  onSelectCategory,
  debtOnly = false,
  onToggleDebtOnly,
}: LedgerTimelineChartProps) {
  const [hoveredYear, setHoveredYear] = useState<number | null>(null);

  // Group deals by year
  const { yearStats, totalVolumeAll, totalDebtAll } = useMemo(() => {
    const years = [2023, 2024, 2025, 2026];
    const stats: Record<number, YearStats> = {
      2023: {
        year: 2023,
        dealCount: 0,
        totalVolume: 0,
        debtVolume: 0,
        computeVolume: 0,
        equityVolume: 0,
        cumulativeVolume: 0,
        largestDealTitle: "",
        largestDealAmount: "",
      },
      2024: {
        year: 2024,
        dealCount: 0,
        totalVolume: 0,
        debtVolume: 0,
        computeVolume: 0,
        equityVolume: 0,
        cumulativeVolume: 0,
        largestDealTitle: "",
        largestDealAmount: "",
      },
      2025: {
        year: 2025,
        dealCount: 0,
        totalVolume: 0,
        debtVolume: 0,
        computeVolume: 0,
        equityVolume: 0,
        cumulativeVolume: 0,
        largestDealTitle: "",
        largestDealAmount: "",
      },
      2026: {
        year: 2026,
        dealCount: 0,
        totalVolume: 0,
        debtVolume: 0,
        computeVolume: 0,
        equityVolume: 0,
        cumulativeVolume: 0,
        largestDealTitle: "",
        largestDealAmount: "",
      },
    };

    let totalVolume = 0;
    let totalDebt = 0;

    const maxDealsByYear: Record<number, { amount: number; title: string; display: string }> = {
      2023: { amount: 0, title: "", display: "" },
      2024: { amount: 0, title: "", display: "" },
      2025: { amount: 0, title: "", display: "" },
      2026: { amount: 0, title: "", display: "" },
    };

    deals.forEach((deal) => {
      // Determine year
      let yr = deal.year;
      if (!yr && deal.announced_date) {
        const match = deal.announced_date.match(/\b(202[3-6])\b/);
        if (match) yr = parseInt(match[1], 10);
      }
      if (!yr || yr < 2023) yr = 2023;
      if (yr > 2026) yr = 2026;

      const amt = deal.amount_usd || 0;
      totalVolume += amt;
      if (deal.is_debt) totalDebt += amt;

      if (stats[yr]) {
        stats[yr].dealCount++;
        stats[yr].totalVolume += amt;
        if (deal.is_debt) stats[yr].debtVolume += amt;
        if (deal.is_compute) stats[yr].computeVolume += amt;
        if (!deal.is_debt && !deal.is_compute) stats[yr].equityVolume += amt;

        if (amt > maxDealsByYear[yr].amount) {
          maxDealsByYear[yr] = { amount: amt, title: deal.title, display: deal.amount_display };
        }
      }
    });

    let runningCumulative = 0;
    const sortedStats = years.map((y) => {
      runningCumulative += stats[y].totalVolume;
      return {
        ...stats[y],
        cumulativeVolume: runningCumulative,
        largestDealTitle: maxDealsByYear[y].title,
        largestDealAmount: maxDealsByYear[y].display,
      };
    });

    return {
      yearStats: sortedStats,
      totalVolumeAll: totalVolume,
      totalDebtAll: totalDebt,
    };
  }, [deals]);

  // Category breakdown for proportional distribution
  const categoryStats = useMemo(() => {
    const cats: Record<string, { label: string; count: number; volume: number; color: string }> = {
      "Compute contracts": { label: "Compute Capacity", count: 0, volume: 0, color: "bg-cyan-500" },
      "Big construction": { label: "Datacenter Buildout", count: 0, volume: 0, color: "bg-blue-500" },
      "Bets & rounds": { label: "Equity Rounds", count: 0, volume: 0, color: "bg-emerald-500" },
      "Buyouts & mergers": { label: "M&A / Buyouts", count: 0, volume: 0, color: "bg-purple-500" },
      Borrowed: { label: "Debt & Converts", count: 0, volume: 0, color: "bg-rose-500" },
      Other: { label: "Other Facilities", count: 0, volume: 0, color: "bg-slate-400 dark:bg-zinc-600" },
      "Power & land": { label: "Power & Land", count: 0, volume: 0, color: "bg-amber-500" },
      "Share sales": { label: "Share Sales", count: 0, volume: 0, color: "bg-violet-500" },
    };

    deals.forEach((d) => {
      const catKey = cats[d.category] ? d.category : "Other";
      cats[catKey].count++;
      cats[catKey].volume += d.amount_usd || 0;
    });

    return Object.entries(cats).map(([id, info]) => ({
      id,
      ...info,
      sharePct: totalVolumeAll > 0 ? (info.volume / totalVolumeAll) * 100 : 0,
    }));
  }, [deals, totalVolumeAll]);

  // Max volume for bar scaling
  const maxYearVolume = Math.max(...yearStats.map((y) => y.totalVolume), 1);

  return (
    <div className="bg-white dark:bg-[#121214] border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 sm:p-6 space-y-6 shadow-sm transition-colors">
      {/* Top Header Strip with Distinct Visual Charts Redirection */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-zinc-800/80">
        <div className="space-y-1">
          <div className="flex items-center space-x-2 text-xs font-mono font-semibold">
            <span className="px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
              LEDGER TIMELINE
            </span>
            <span className="text-slate-500 dark:text-zinc-400">
              Verified Capital Velocity 2023–2026
            </span>
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight">
            AI Capital Deployment Trajectory &amp; Debt Ramp
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-400 font-sans leading-relaxed max-w-2xl">
            Interactive breakdown of disclosed volume by vintage year and financing structure. Click any bar or category pill to filter the ledger table below.
          </p>
        </div>

        {/* Cross-Link to Visualize Page */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2.5 shrink-0">
          <Link
            href="/visualize"
            className="inline-flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-mono font-bold bg-slate-900 dark:bg-white text-white dark:text-zinc-950 hover:bg-slate-800 dark:hover:bg-zinc-200 transition-colors shadow-sm"
          >
            <Layers className="w-3.5 h-3.5 text-emerald-400 dark:text-emerald-600" />
            <span>Open Finviz Treemap &amp; Bubble Pods</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* 4 Summary Strip Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-xs font-mono">
        <div className="p-3.5 bg-slate-50 dark:bg-[#09090b] rounded-xl border border-slate-200/80 dark:border-zinc-800">
          <span className="text-slate-500 dark:text-zinc-400 block font-bold uppercase text-[10px] tracking-wider">
            Total Disclosed
          </span>
          <span className="text-slate-900 dark:text-white font-extrabold text-base sm:text-lg block mt-0.5 font-tabular">
            ${(totalVolumeAll / 1e12).toFixed(2)}T
          </span>
          <span className="text-[11px] text-slate-500 dark:text-zinc-500 block">
            {deals.length} Sourced Deals
          </span>
        </div>

        <div className="p-3.5 bg-slate-50 dark:bg-[#09090b] rounded-xl border border-slate-200/80 dark:border-zinc-800">
          <span className="text-rose-600 dark:text-rose-400 block font-bold uppercase text-[10px] tracking-wider">
            Verified Debt Involved
          </span>
          <span className="text-rose-600 dark:text-rose-400 font-extrabold text-base sm:text-lg block mt-0.5 font-tabular">
            ${(totalDebtAll / 1e9).toFixed(1)}B
          </span>
          <span className="text-[11px] text-slate-500 dark:text-zinc-500 block">
            20 Debt Facilities
          </span>
        </div>

        <div className="p-3.5 bg-slate-50 dark:bg-[#09090b] rounded-xl border border-slate-200/80 dark:border-zinc-800">
          <span className="text-indigo-600 dark:text-indigo-400 block font-bold uppercase text-[10px] tracking-wider">
            Peak Capital Epoch
          </span>
          <span className="text-slate-900 dark:text-white font-extrabold text-base sm:text-lg block mt-0.5 font-tabular">
            2025 ($1.72T)
          </span>
          <span className="text-[11px] text-slate-500 dark:text-zinc-500 block">
            77 Deals (61.2% Share)
          </span>
        </div>

        <div className="p-3.5 bg-slate-50 dark:bg-[#09090b] rounded-xl border border-slate-200/80 dark:border-zinc-800">
          <span className="text-emerald-600 dark:text-emerald-400 block font-bold uppercase text-[10px] tracking-wider">
            2026 YTD Run-rate
          </span>
          <span className="text-slate-900 dark:text-white font-extrabold text-base sm:text-lg block mt-0.5 font-tabular">
            $769.2B
          </span>
          <span className="text-[11px] text-slate-500 dark:text-zinc-500 block">
            26 Mega-facilities
          </span>
        </div>
      </div>

      {/* Main Interactive Yearly Velocity Bar & Trajectory Chart */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs font-mono">
          <div className="flex items-center space-x-4">
            <span className="font-bold text-slate-700 dark:text-zinc-300">
              Yearly Capital Breakdown ($B Disclosed)
            </span>
            <div className="hidden sm:flex items-center space-x-3 text-[11px]">
              <span className="flex items-center space-x-1 text-slate-600 dark:text-zinc-400">
                <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block" />
                <span>Equity &amp; Capex</span>
              </span>
              <span className="flex items-center space-x-1 text-slate-600 dark:text-zinc-400">
                <span className="w-2.5 h-2.5 rounded-sm bg-rose-500 inline-block" />
                <span>Debt &amp; Converts</span>
              </span>
              <span className="flex items-center space-x-1 text-slate-600 dark:text-zinc-400">
                <span className="w-2.5 h-2.5 rounded-sm bg-indigo-500 inline-block" />
                <span>Cumulative Pace</span>
              </span>
            </div>
          </div>

          {selectedYear !== "All" && (
            <button
              onClick={() => onSelectYear && onSelectYear("All")}
              className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center space-x-1"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Reset Year Filter ({selectedYear})</span>
            </button>
          )}
        </div>

        {/* Responsive Bar Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-1">
          {yearStats.map((ys) => {
            const isSelected = selectedYear === ys.year.toString();
            const isHovered = hoveredYear === ys.year;
            const volumeBillions = (ys.totalVolume / 1e9).toFixed(1);
            const debtBillions = (ys.debtVolume / 1e9).toFixed(1);
            const heightPercent = Math.max(12, Math.round((ys.totalVolume / maxYearVolume) * 100));
            const debtHeightPercent = ys.totalVolume > 0 ? (ys.debtVolume / ys.totalVolume) * 100 : 0;

            return (
              <div
                key={ys.year}
                onMouseEnter={() => setHoveredYear(ys.year)}
                onMouseLeave={() => setHoveredYear(null)}
                onClick={() => {
                  if (onSelectYear) {
                    onSelectYear(selectedYear === ys.year.toString() ? "All" : ys.year.toString());
                  }
                }}
                className={`p-4 rounded-xl border cursor-pointer transition-all flex flex-col justify-between space-y-3 relative group ${
                  isSelected
                    ? "bg-slate-900 text-white dark:bg-[#18181b] dark:text-white border-emerald-500 shadow-md ring-2 ring-emerald-500/30"
                    : "bg-slate-50/70 dark:bg-[#09090b]/80 border-slate-200 dark:border-zinc-800/80 hover:border-slate-300 dark:hover:border-zinc-700 hover:bg-slate-100/60 dark:hover:bg-zinc-900/50"
                }`}
              >
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1.5">
                    <Calendar className={`w-3.5 h-3.5 ${isSelected ? "text-emerald-400" : "text-slate-400 dark:text-zinc-500"}`} />
                    <span className="font-mono font-black text-sm tracking-tight">{ys.year}</span>
                  </div>
                  <span
                    className={`text-[11px] font-mono px-2 py-0.5 rounded-full font-bold ${
                      isSelected
                        ? "bg-emerald-500 text-zinc-950"
                        : "bg-slate-200 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300"
                    }`}
                  >
                    {ys.dealCount} deals
                  </span>
                </div>

                {/* Visual Bar Container */}
                <div className="space-y-1.5 pt-2">
                  <div className="h-28 w-full bg-slate-200/70 dark:bg-zinc-800/60 rounded-lg overflow-hidden flex flex-col justify-end relative">
                    {/* Bar Fill */}
                    <div
                      style={{ height: `${heightPercent}%` }}
                      className={`w-full rounded-b-md transition-all duration-300 relative overflow-hidden ${
                        isSelected ? "bg-emerald-500" : "bg-emerald-600 dark:bg-emerald-500/80"
                      }`}
                    >
                      {/* Debt Overlay Sub-segment */}
                      {debtHeightPercent > 0 && (
                        <div
                          style={{ height: `${debtHeightPercent}%` }}
                          title={`Debt portion: $${debtBillions}B`}
                          className="w-full bg-rose-500/90 dark:bg-rose-500 absolute top-0 left-0 border-b border-black/20"
                        />
                      )}
                    </div>
                  </div>

                  {/* Volume Label */}
                  <div className="flex items-baseline justify-between font-mono pt-1">
                    <span className="text-[11px] text-slate-500 dark:text-zinc-400">Total:</span>
                    <span className="font-bold text-sm font-tabular">
                      ${volumeBillions}B
                    </span>
                  </div>

                  {/* Debt Portion */}
                  <div className="flex items-baseline justify-between font-mono text-[11px]">
                    <span className="text-rose-600 dark:text-rose-400 font-semibold">Debt:</span>
                    <span className="font-semibold text-rose-600 dark:text-rose-400 font-tabular">
                      ${debtBillions}B
                    </span>
                  </div>
                </div>

                {/* Largest deal hint */}
                <div className="pt-2 border-t border-slate-200/80 dark:border-zinc-800/80 text-[10px] font-sans text-slate-500 dark:text-zinc-400 truncate">
                  <span className="font-semibold">Top: </span>
                  <span className="truncate">{ys.largestDealTitle || "Undisclosed bilateral"}</span>
                </div>

                {/* Click to filter hint */}
                <div className="text-[10px] font-mono text-center pt-1 font-semibold text-emerald-600 dark:text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity">
                  {isSelected ? "Click to clear filter" : `Click to filter ${ys.year}`}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Proportional Category Distribution Bar */}
      <div className="space-y-3 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono">
          <span className="font-bold text-slate-700 dark:text-zinc-300 flex items-center space-x-1.5">
            <Filter className="w-3.5 h-3.5 text-indigo-500" />
            <span>Category Flow Allocation ($2.86T Total)</span>
          </span>
          <span className="text-slate-500 dark:text-zinc-400 text-[11px]">
            Click any category pill to filter the ledger
          </span>
        </div>

        {/* Stacked Proportional Bar */}
        <div className="h-3 w-full bg-slate-200 dark:bg-zinc-800 rounded-full overflow-hidden flex shadow-inner">
          {categoryStats.map((cat) => (
            <div
              key={cat.id}
              style={{ width: `${cat.sharePct}%` }}
              title={`${cat.label}: $${(cat.volume / 1e9).toFixed(1)}B (${cat.sharePct.toFixed(1)}%)`}
              className={`${cat.color} h-full transition-all hover:opacity-85 cursor-pointer`}
              onClick={() => onSelectCategory && onSelectCategory(selectedCategory === cat.id ? "All" : cat.id)}
            />
          ))}
        </div>

        {/* Category Pills List */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          {categoryStats.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => onSelectCategory && onSelectCategory(isSelected ? "All" : cat.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono font-medium transition-all flex items-center space-x-1.5 ${
                  isSelected
                    ? "bg-slate-900 text-white dark:bg-white dark:text-zinc-950 font-bold shadow-xs ring-1 ring-emerald-500"
                    : "bg-slate-100 dark:bg-zinc-800/80 text-slate-700 dark:text-zinc-300 hover:bg-slate-200 dark:hover:bg-zinc-700"
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${cat.color}`} />
                <span>{cat.label}</span>
                <span className="text-[10px] opacity-70">
                  (${(cat.volume / 1e9).toFixed(0)}B)
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
