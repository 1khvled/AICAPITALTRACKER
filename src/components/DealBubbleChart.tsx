"use client";

import React, { useState, useMemo, useRef } from "react";
import {
  Search,
  LayoutGrid,
  CircleDot,
  Calendar,
  Sparkles,
  Maximize2,
  ExternalLink,
  ShieldAlert,
  Layers,
  ArrowRight,
  TrendingUp,
} from "lucide-react";

export interface Deal {
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

interface DealBubbleChartProps {
  deals: Deal[];
  onSelectDeal: (deal: Deal) => void;
}

type ViewMode = "treemap" | "bubbles" | "timeline";

const CATEGORY_CONFIG: Record<
  string,
  {
    name: string;
    pillBg: string;
    border: string;
    tileBg: string;
    tileBgHover: string;
    badgeBg: string;
    textColor: string;
    accentHex: string;
  }
> = {
  "Borrowed": {
    name: "Debt & Facilities",
    pillBg: "bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400 border-rose-200 dark:border-rose-900/60",
    border: "border-rose-200 dark:border-rose-900/50",
    tileBg: "bg-rose-50/70 dark:bg-rose-950/30",
    tileBgHover: "hover:bg-rose-100/80 dark:hover:bg-rose-950/60",
    badgeBg: "bg-rose-600",
    textColor: "text-rose-700 dark:text-rose-400",
    accentHex: "#ef4444",
  },
  "Bets & rounds": {
    name: "Equity & Strategic Bets",
    pillBg: "bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-400 border-purple-200 dark:border-purple-900/60",
    border: "border-purple-200 dark:border-purple-900/50",
    tileBg: "bg-purple-50/70 dark:bg-purple-950/30",
    tileBgHover: "hover:bg-purple-100/80 dark:hover:bg-purple-950/60",
    badgeBg: "bg-purple-600",
    textColor: "text-purple-700 dark:text-purple-400",
    accentHex: "#8b5cf6",
  },
  "Compute contracts": {
    name: "Compute & Cloud Clusters",
    pillBg: "bg-cyan-50 text-cyan-700 dark:bg-cyan-950/50 dark:text-cyan-400 border-cyan-200 dark:border-cyan-900/60",
    border: "border-cyan-200 dark:border-cyan-900/50",
    tileBg: "bg-cyan-50/70 dark:bg-cyan-950/30",
    tileBgHover: "hover:bg-cyan-100/80 dark:hover:bg-cyan-950/60",
    badgeBg: "bg-cyan-600",
    textColor: "text-cyan-700 dark:text-cyan-400",
    accentHex: "#06b6d4",
  },
  "Power & land": {
    name: "Power & Clean Energy",
    pillBg: "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400 border-amber-200 dark:border-amber-900/60",
    border: "border-amber-200 dark:border-amber-900/50",
    tileBg: "bg-amber-50/70 dark:bg-amber-950/30",
    tileBgHover: "hover:bg-amber-100/80 dark:hover:bg-amber-950/60",
    badgeBg: "bg-amber-600",
    textColor: "text-amber-700 dark:text-amber-400",
    accentHex: "#f59e0b",
  },
  "Buyouts & mergers": {
    name: "M&A & Buyouts",
    pillBg: "bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400 border-blue-200 dark:border-blue-900/60",
    border: "border-blue-200 dark:border-blue-900/50",
    tileBg: "bg-blue-50/70 dark:bg-blue-950/30",
    tileBgHover: "hover:bg-blue-100/80 dark:hover:bg-blue-950/60",
    badgeBg: "bg-blue-600",
    textColor: "text-blue-700 dark:text-blue-400",
    accentHex: "#3b82f6",
  },
  "Big construction": {
    name: "Hyperscale Capex",
    pillBg: "bg-orange-50 text-orange-700 dark:bg-orange-950/50 dark:text-orange-400 border-orange-200 dark:border-orange-900/60",
    border: "border-orange-200 dark:border-orange-900/50",
    tileBg: "bg-orange-50/70 dark:bg-orange-950/30",
    tileBgHover: "hover:bg-orange-100/80 dark:hover:bg-orange-950/60",
    badgeBg: "bg-orange-600",
    textColor: "text-orange-700 dark:text-orange-400",
    accentHex: "#f97316",
  },
  "Share sales": {
    name: "Secondary Share Sales",
    pillBg: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/60",
    border: "border-emerald-200 dark:border-emerald-900/50",
    tileBg: "bg-emerald-50/70 dark:bg-emerald-950/30",
    tileBgHover: "hover:bg-emerald-100/80 dark:hover:bg-emerald-950/60",
    badgeBg: "bg-emerald-600",
    textColor: "text-emerald-700 dark:text-emerald-400",
    accentHex: "#10b981",
  },
  "Other": {
    name: "Ecosystem Deals",
    pillBg: "bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-zinc-300 border-slate-200 dark:border-zinc-700",
    border: "border-slate-200 dark:border-zinc-800",
    tileBg: "bg-slate-50/70 dark:bg-zinc-900/30",
    tileBgHover: "hover:bg-slate-100/80 dark:hover:bg-zinc-900/60",
    badgeBg: "bg-slate-600",
    textColor: "text-slate-700 dark:text-zinc-300",
    accentHex: "#64748b",
  },
};

interface TreemapTile {
  deal: Deal;
  x: number;
  y: number;
  w: number;
  h: number;
  category: string;
}

export function DealBubbleChart({ deals, onSelectDeal }: DealBubbleChartProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("treemap");
  const [selectedCat, setSelectedCat] = useState<string>("All");
  const [minVolume, setMinVolume] = useState<"all" | "1b" | "10b" | "50b">("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [hoveredDeal, setHoveredDeal] = useState<Deal | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // 1. Filter deals by category and volume threshold
  const filteredDeals = useMemo(() => {
    return deals.filter((deal) => {
      if (selectedCat !== "All" && deal.category !== selectedCat) return false;
      if (minVolume === "1b" && deal.amount_usd < 1_000_000_000) return false;
      if (minVolume === "10b" && deal.amount_usd < 10_000_000_000) return false;
      if (minVolume === "50b" && deal.amount_usd < 50_000_000_000) return false;
      return true;
    });
  }, [deals, selectedCat, minVolume]);

  const totalFilteredUsd = useMemo(() => {
    return filteredDeals.reduce((sum, d) => sum + d.amount_usd, 0);
  }, [filteredDeals]);

  // Check search match
  const matchesSearch = (deal: Deal) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      deal.title.toLowerCase().includes(q) ||
      deal.description.toLowerCase().includes(q) ||
      deal.amount_display.toLowerCase().includes(q)
    );
  };

  // 2. High-performance Squarified Treemap Layout (Finviz / Institutional Heatmap Standard)
  const treemapTiles = useMemo(() => {
    if (viewMode !== "treemap") return [];

    const CANVAS_W = 1000;
    const CANVAS_H = 560;

    // Sort descending by amount for best geometric packing
    const sorted = [...filteredDeals].sort((a, b) => {
      const valA = a.amount_usd > 0 ? a.amount_usd : 100e6;
      const valB = b.amount_usd > 0 ? b.amount_usd : 100e6;
      return valB - valA;
    });

    if (sorted.length === 0) return [];

    const tiles: TreemapTile[] = [];

    // Recursive bisection squarify
    function partition(list: Deal[], cx: number, cy: number, cw: number, ch: number) {
      if (list.length === 0 || cw <= 0 || ch <= 0) return;
      if (list.length === 1) {
        tiles.push({
          deal: list[0],
          x: cx,
          y: cy,
          w: cw,
          h: ch,
          category: list[0].category,
        });
        return;
      }

      const totalVal = list.reduce((s, it) => s + (it.amount_usd > 0 ? it.amount_usd : 100e6), 0);
      let runningSum = 0;
      let splitIdx = 0;

      for (let i = 0; i < list.length; i++) {
        runningSum += list[i].amount_usd > 0 ? list[i].amount_usd : 100e6;
        if (runningSum >= totalVal / 2 || i === list.length - 2) {
          splitIdx = i + 1;
          break;
        }
      }

      const left = list.slice(0, splitIdx);
      const right = list.slice(splitIdx);
      const leftRatio = runningSum / totalVal;

      if (cw >= ch) {
        const splitW = cw * leftRatio;
        partition(left, cx, cy, splitW, ch);
        partition(right, cx + splitW, cy, cw - splitW, ch);
      } else {
        const splitH = ch * leftRatio;
        partition(left, cx, cy, cw, splitH);
        partition(right, cx, cy + splitH, cw, ch - splitH);
      }
    }

    partition(sorted, 0, 0, CANVAS_W, CANVAS_H);
    return tiles;
  }, [filteredDeals, viewMode]);

  // 3. Category Islands Grouping (Separated & Zero-Overlap Bubble Pods)
  const categoryPods = useMemo(() => {
    if (viewMode !== "bubbles") return [];

    const activeCategories = Object.keys(CATEGORY_CONFIG).filter((cat) => {
      if (selectedCat !== "All" && cat !== selectedCat) return false;
      return deals.some((d) => d.category === cat);
    });

    return activeCategories.map((catKey) => {
      const catDeals = filteredDeals
        .filter((d) => d.category === catKey)
        .sort((a, b) => b.amount_usd - a.amount_usd);

      const catTotal = catDeals.reduce((sum, d) => sum + d.amount_usd, 0);
      const config = CATEGORY_CONFIG[catKey] || CATEGORY_CONFIG["Other"];

      // Layout bubbles inside a clean 300x200 sub-canvas with collision avoidance
      const POD_W = 300;
      const POD_H = 190;

      const bubbles = catDeals.map((deal, idx) => {
        let r = 7;
        if (deal.amount_usd > 0) {
          const log = Math.log10(deal.amount_usd);
          r = Math.max(9, Math.min(38, (log - 6.5) * 6.5));
        }

        // Circular spiral initial placement
        const angle = idx * 1.8;
        const dist = Math.min(80, 15 + idx * 7);
        const x = POD_W / 2 + Math.cos(angle) * dist;
        const y = POD_H / 2 + Math.sin(angle) * dist;

        return { deal, r, x, y };
      });

      // Relaxation passes to push apart overlapping bubbles inside the pod
      for (let iter = 0; iter < 45; iter++) {
        for (let i = 0; i < bubbles.length; i++) {
          for (let j = i + 1; j < bubbles.length; j++) {
            const dx = bubbles[j].x - bubbles[i].x;
            const dy = bubbles[j].y - bubbles[i].y;
            const dist = Math.sqrt(dx * dx + dy * dy) || 0.1;
            const minDist = bubbles[i].r + bubbles[j].r + 3;

            if (dist < minDist) {
              const overlap = (minDist - dist) / dist;
              const px = dx * overlap * 0.45;
              const py = dy * overlap * 0.45;
              bubbles[i].x -= px;
              bubbles[i].y -= py;
              bubbles[j].x += px;
              bubbles[j].y += py;
            }
          }
        }
        // Clamping to pod boundaries
        for (let i = 0; i < bubbles.length; i++) {
          bubbles[i].x = Math.max(bubbles[i].r + 6, Math.min(POD_W - bubbles[i].r - 6, bubbles[i].x));
          bubbles[i].y = Math.max(bubbles[i].r + 6, Math.min(POD_H - bubbles[i].r - 6, bubbles[i].y));
        }
      }

      return {
        categoryKey: catKey,
        config,
        deals: catDeals,
        totalUsd: catTotal,
        bubbles,
      };
    });
  }, [filteredDeals, deals, selectedCat, viewMode]);

  // 4. Timeline Columns Data
  const timelineColumns = useMemo(() => {
    if (viewMode !== "timeline") return [];

    const years = [
      { key: "2023", label: "2023 & Prior", subtitle: "Pre-Bubble Base" },
      { key: "2024", label: "2024 Inflection", subtitle: "$382B Disclosed" },
      { key: "2025", label: "2025 Capex Surge", subtitle: "$1.42T Committed" },
      { key: "2026", label: "2026 Gigawatt Era", subtitle: "$920B Run-rate" },
    ];

    return years.map((y) => {
      const yearDeals = filteredDeals
        .filter((d) => {
          if (y.key === "2023") return d.year <= 2023;
          return d.year.toString() === y.key;
        })
        .sort((a, b) => b.amount_usd - a.amount_usd);

      const total = yearDeals.reduce((sum, d) => sum + d.amount_usd, 0);

      return {
        ...y,
        deals: yearDeals,
        totalUsd: total,
      };
    });
  }, [filteredDeals, viewMode]);

  return (
    <div
      ref={containerRef}
      className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#10141d] overflow-hidden transition-colors shadow-sm"
    >
      {/* Top Header Bar & Mode Selector */}
      <div className="p-5 sm:p-6 border-b border-slate-200 dark:border-zinc-800 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-xs sm:text-sm font-semibold text-slate-600 dark:text-zinc-400">
              <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center space-x-1.5">
                <Sparkles className="w-4 h-4" />
                <span>Capital Allocation Universe</span>
              </span>
              <span>•</span>
              <span className="text-slate-800 dark:text-zinc-200">100% Verified Disclosures</span>
              <span>•</span>
              <span className="text-slate-900 dark:text-white font-extrabold font-tabular">
                {filteredDeals.length} Deals (${(totalFilteredUsd / 1e12).toFixed(2)}T)
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-1">
              Institutional Capital Allocation Matrix (Area = Disclosed USD)
            </h2>
          </div>

          {/* View Mode Segmented Controls */}
          <div className="flex items-center space-x-1 p-1.5 rounded-xl bg-slate-100 dark:bg-[#0c0f16] border border-slate-200 dark:border-zinc-800 self-start sm:self-auto shadow-inner">
            <button
              onClick={() => setViewMode("treemap")}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all ${
                viewMode === "treemap"
                  ? "bg-white dark:bg-zinc-800 text-slate-900 dark:text-white shadow-sm"
                  : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <LayoutGrid className="w-4 h-4 text-emerald-500" />
              <span>Capital Treemap</span>
            </button>
            <button
              onClick={() => setViewMode("bubbles")}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all ${
                viewMode === "bubbles"
                  ? "bg-white dark:bg-zinc-800 text-slate-900 dark:text-white shadow-sm"
                  : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <CircleDot className="w-4 h-4 text-purple-500" />
              <span>Category Bubble Pods</span>
            </button>
            <button
              onClick={() => setViewMode("timeline")}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all ${
                viewMode === "timeline"
                  ? "bg-white dark:bg-zinc-800 text-slate-900 dark:text-white shadow-sm"
                  : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Calendar className="w-4 h-4 text-cyan-500" />
              <span>Timeline Flow</span>
            </button>
          </div>
        </div>

        {/* Filter Controls: Search & Volume Thresholds */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          {/* Quick Search with clear button */}
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 dark:text-zinc-500 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Filter company, project, or amount..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm font-medium rounded-xl border border-slate-300 dark:border-zinc-700 bg-slate-50 dark:bg-[#0c0f16] text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-white font-bold"
              >
                ✕
              </button>
            )}
          </div>

          {/* Size Filter Pills */}
          <div className="flex items-center space-x-1.5 text-xs sm:text-sm">
            <span className="text-xs font-bold text-slate-600 dark:text-zinc-400 mr-1 hidden md:inline">
              Minimum Deal:
            </span>
            {[
              { id: "all", label: "All Deals" },
              { id: "1b", label: "≥ $1B" },
              { id: "10b", label: "≥ $10B" },
              { id: "50b", label: "≥ $50B Megadeals" },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setMinVolume(t.id as any)}
                className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition-all ${
                  minVolume === t.id
                    ? "bg-slate-900 text-white dark:bg-white dark:text-zinc-950 shadow-sm"
                    : "bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-zinc-300 hover:bg-slate-200 dark:hover:bg-zinc-700"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Category Pills Strip */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none text-xs sm:text-sm">
          <button
            onClick={() => setSelectedCat("All")}
            className={`whitespace-nowrap px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              selectedCat === "All"
                ? "bg-slate-900 text-white dark:bg-white dark:text-zinc-950 shadow-sm"
                : "bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-zinc-700"
            }`}
          >
            All Sectors ({deals.length})
          </button>
          {Object.entries(CATEGORY_CONFIG).map(([key, config]) => {
            const count = deals.filter((d) => d.category === key).length;
            const isSelected = selectedCat === key;
            return (
              <button
                key={key}
                onClick={() => setSelectedCat(key)}
                className={`whitespace-nowrap px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center space-x-2 ${
                  isSelected
                    ? "bg-slate-900 text-white dark:bg-white dark:text-zinc-950 shadow-sm"
                    : "bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-zinc-700"
                }`}
              >
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: config.accentHex }} />
                <span>{config.name}</span>
                <span className="text-xs opacity-75">({count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Visual Canvas Viewport */}
      <div className="relative p-3 sm:p-4 bg-slate-50/50 dark:bg-[#0a0d14] overflow-hidden">
        {/* VIEW 1: FINVIZ-STYLE SQUARIFIED CAPITAL TREEMAP */}
        {viewMode === "treemap" && (
          <div className="relative w-full overflow-hidden rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#0c0f16]">
            <svg
              viewBox="0 0 1000 560"
              className="w-full h-auto block select-none"
              style={{ minHeight: "440px" }}
            >
              {treemapTiles.map((tile) => {
                const config = CATEGORY_CONFIG[tile.category] || CATEGORY_CONFIG["Other"];
                const matched = matchesSearch(tile.deal);
                const isHovered = hoveredDeal?.id === tile.deal.id;
                const opacity = searchQuery.trim() && !matched ? 0.15 : 1;

                // Title extraction
                let shortTitle = tile.deal.title;
                if (tile.deal.title.includes("Stargate")) shortTitle = "Stargate Project";
                else if (tile.deal.title.includes("OpenAI")) shortTitle = "OpenAI";
                else if (tile.deal.title.includes("Anthropic")) shortTitle = "Anthropic";
                else if (tile.deal.title.includes("CoreWeave")) shortTitle = "CoreWeave";
                else if (tile.deal.title.includes("Oracle")) shortTitle = "Oracle Cloud";
                else if (tile.deal.title.includes("Blackstone")) shortTitle = "Blackstone QTS";
                else if (tile.deal.title.includes("NVIDIA")) shortTitle = "NVIDIA";
                else if (tile.deal.title.includes("Amazon")) shortTitle = "Amazon AWS";
                else if (tile.deal.title.includes("Microsoft")) shortTitle = "Microsoft";
                else if (tile.deal.title.includes("Google")) shortTitle = "Google Cloud";
                else if (tile.deal.title.includes("Meta")) shortTitle = "Meta Platforms";
                else if (tile.deal.title.includes("xAI")) shortTitle = "xAI Colossus";
                else if (tile.deal.title.includes("Three Mile")) shortTitle = "Three Mile Island";

                const canShowAmount = tile.w >= 50 && tile.h >= 32;
                const canShowTitle = tile.w >= 70 && tile.h >= 45;

                return (
                  <g
                    key={tile.deal.id}
                    className="cursor-pointer transition-opacity duration-150"
                    style={{ opacity }}
                    onClick={() => onSelectDeal(tile.deal)}
                    onMouseEnter={() => setHoveredDeal(tile.deal)}
                    onMouseLeave={() => setHoveredDeal(null)}
                  >
                    {/* Tile Rectangle */}
                    <rect
                      x={tile.x + 1}
                      y={tile.y + 1}
                      width={Math.max(0, tile.w - 2)}
                      height={Math.max(0, tile.h - 2)}
                      fill={config.accentHex}
                      fillOpacity={isHovered ? 0.95 : 0.78}
                      stroke={isHovered ? "#ffffff" : "#090b10"}
                      strokeWidth={isHovered ? 2 : 1}
                      rx={3}
                    />

                    {/* Text Labels inside large enough tiles */}
                    {canShowTitle && (
                      <text
                        x={tile.x + tile.w / 2}
                        y={canShowAmount ? tile.y + tile.h / 2 - 5 : tile.y + tile.h / 2 + 4}
                        textAnchor="middle"
                        fill="#ffffff"
                        fontSize={Math.min(15, Math.max(12, tile.w / 11))}
                        fontWeight="800"
                        fontFamily="Geist, sans-serif"
                        className="pointer-events-none select-none drop-shadow-md"
                      >
                        {shortTitle.slice(0, Math.floor(tile.w / 7.5))}
                      </text>
                    )}

                    {canShowAmount && (
                      <text
                        x={tile.x + tile.w / 2}
                        y={tile.y + tile.h / 2 + (canShowTitle ? 13 : 4)}
                        textAnchor="middle"
                        fill="#ffffff"
                        fontSize={Math.min(14, Math.max(11, tile.w / 12))}
                        fontWeight="800"
                        fontFamily="Geist Mono, monospace"
                        opacity={1}
                        className="pointer-events-none select-none drop-shadow-md"
                      >
                        {tile.deal.amount_display}
                      </text>
                    )}
                  </g>
                );
              })}
            </svg>
          </div>
        )}

        {/* VIEW 2: CATEGORY BUBBLE PODS (SEPARATED & ORGANIZED) */}
        {viewMode === "bubbles" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categoryPods.map((pod) => (
              <div
                key={pod.categoryKey}
                className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#10141d] p-4 space-y-3 shadow-sm"
              >
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-zinc-800/80">
                  <div className="flex items-center space-x-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: pod.config.accentHex }}
                    />
                    <span className="font-bold text-slate-900 dark:text-white text-sm">
                      {pod.config.name}
                    </span>
                  </div>
                  <div className="text-right font-mono text-xs sm:text-sm">
                    <span className="text-slate-900 dark:text-white font-extrabold">
                      ${(pod.totalUsd / 1e9).toFixed(1)}B
                    </span>
                    <span className="text-slate-500 dark:text-zinc-400 ml-1.5 font-medium">
                      ({pod.deals.length})
                    </span>
                  </div>
                </div>

                {/* Pod SVG Canvas */}
                <svg
                  viewBox="0 0 300 190"
                  className="w-full h-auto bg-slate-50/50 dark:bg-[#0c0f16]/60 rounded-lg select-none block"
                  style={{ minHeight: "170px" }}
                >
                  {pod.bubbles.map((b) => {
                    const isHovered = hoveredDeal?.id === b.deal.id;
                    const matched = matchesSearch(b.deal);
                    const opacity = searchQuery.trim() && !matched ? 0.15 : 0.85;

                    return (
                      <g
                        key={b.deal.id}
                        className="cursor-pointer"
                        style={{ opacity: isHovered ? 1 : opacity }}
                        onClick={() => onSelectDeal(b.deal)}
                        onMouseEnter={() => setHoveredDeal(b.deal)}
                        onMouseLeave={() => setHoveredDeal(null)}
                      >
                        <circle
                          cx={b.x}
                          cy={b.y}
                          r={b.r}
                          fill={pod.config.accentHex}
                          stroke={isHovered ? "#ffffff" : pod.config.accentHex}
                          strokeWidth={isHovered ? 2 : 1}
                          className="transition-all duration-150"
                        />
                        {/* Only print text if bubble is large enough (>= 18px radius) */}
                        {b.r >= 19 && (
                          <text
                            x={b.x}
                            y={b.y + 3}
                            textAnchor="middle"
                            fill="#ffffff"
                            fontSize={b.r >= 26 ? 11 : 9.5}
                            fontWeight="bold"
                            fontFamily="Geist Mono, monospace"
                            className="pointer-events-none select-none drop-shadow-sm"
                          >
                            {b.deal.amount_display}
                          </text>
                        )}
                      </g>
                    );
                  })}
                </svg>
              </div>
            ))}
          </div>
        )}

        {/* VIEW 3: TIMELINE FLOW MATRIX */}
        {viewMode === "timeline" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {timelineColumns.map((col) => (
              <div
                key={col.key}
                className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#10141d] p-4 space-y-3 shadow-sm flex flex-col justify-between"
              >
                <div className="pb-2 border-b border-slate-100 dark:border-zinc-800">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 dark:text-white text-base">
                      {col.label}
                    </span>
                    <span className="text-xs sm:text-sm font-mono font-extrabold text-emerald-600 dark:text-emerald-400">
                      ${(col.totalUsd / 1e9).toFixed(1)}B
                    </span>
                  </div>
                  <span className="text-xs text-slate-600 dark:text-zinc-400 font-medium">
                    {col.deals.length} Sourced Deals
                  </span>
                </div>

                {/* Deals Stack */}
                <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
                  {col.deals.slice(0, 10).map((deal) => {
                    const config = CATEGORY_CONFIG[deal.category] || CATEGORY_CONFIG["Other"];
                    const matched = matchesSearch(deal);
                    const opacity = searchQuery.trim() && !matched ? 0.2 : 1;

                    return (
                      <div
                        key={deal.id}
                        onClick={() => onSelectDeal(deal)}
                        style={{ opacity }}
                        className={`p-2.5 rounded-lg border border-slate-100 dark:border-zinc-800/80 bg-slate-50 dark:bg-[#0c0f16] hover:border-slate-300 dark:hover:border-zinc-700 cursor-pointer transition-all space-y-1`}
                      >
                        <div className="flex items-center justify-between text-xs font-mono">
                          <span
                            className="px-2.5 py-0.5 rounded font-bold text-white text-xs"
                            style={{ backgroundColor: config.accentHex }}
                          >
                            {deal.amount_display}
                          </span>
                          <span className="text-slate-500 dark:text-zinc-400 text-xs">
                            {deal.announced_date}
                          </span>
                        </div>
                        <h4 className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-zinc-200 line-clamp-1">
                          {deal.title}
                        </h4>
                      </div>
                    );
                  })}
                  {col.deals.length > 10 && (
                    <div className="text-center text-xs font-semibold text-slate-500 dark:text-zinc-400 pt-1">
                      + {col.deals.length - 10} more in ledger
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Live Hover Inspection Popover Card */}
        {hoveredDeal && (
          <div className="mt-3 p-4 rounded-2xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-[#121620] shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-sm">
            <div className="space-y-1.5 flex-1">
              <div className="flex items-center space-x-2.5">
                <span className="font-extrabold text-slate-900 dark:text-white text-base sm:text-lg">
                  {hoveredDeal.title}
                </span>
                <span className="font-mono font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-0.5 rounded-lg border border-emerald-200 dark:border-emerald-900/60 text-sm">
                  {hoveredDeal.amount_display}
                </span>
              </div>
              <p className="text-slate-700 dark:text-zinc-300 text-sm line-clamp-1 font-sans">
                {hoveredDeal.description}
              </p>
            </div>

            <button
              onClick={() => onSelectDeal(hoveredDeal)}
              className="shrink-0 flex items-center space-x-1.5 px-4 py-2 rounded-xl text-sm font-bold bg-slate-900 text-white dark:bg-white dark:text-zinc-950 hover:opacity-90 transition-opacity shadow-sm"
            >
              <span>Inspect Disclosure</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </button>
          </div>
        )}
      </div>

      {/* Footer Meta & Stats - High Contrast, Large Bold Text & Badges */}
      <div className="p-4 sm:p-5 border-t border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#10141d] flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex items-center space-x-2 text-xs sm:text-sm font-medium text-slate-700 dark:text-zinc-300">
          <Layers className="w-4 h-4 text-emerald-500" />
          <span>Click any block to inspect SEC filings &amp; audited disclosures.</span>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm">
          <span className="px-3 py-1 rounded-lg font-bold bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900/60">
            {deals.filter((d) => d.is_debt).length} Debt Deals
          </span>
          <span className="px-3 py-1 rounded-lg font-bold bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-900/60">
            {deals.filter((d) => d.category === "Bets & rounds").length} Equity Rounds
          </span>
          <span className="px-3 py-1 rounded-lg font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/60">
            Total Disclosed: $2.75T
          </span>
        </div>
      </div>
    </div>
  );
}
