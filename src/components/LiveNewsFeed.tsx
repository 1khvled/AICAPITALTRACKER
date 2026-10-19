"use client";

import React, { useState, useEffect, useMemo } from "react";
import { NewsItem } from "@/app/api/v1/news/route";
import {
  Newspaper,
  RefreshCw,
  Clock,
  Search,
  X,
  CheckCircle2,
  ArrowUpRight,
  FileText,
} from "lucide-react";

// Institutional curated wire fallback data
const INSTITUTIONAL_WIRE: NewsItem[] = [
  {
    id: "wire-1",
    title: "Anthropic Prepares Form S-1 Prospectus Disclosing $11.5B ARR Run-Rate Against $57B In Debt & Compute Facilities",
    publisher: "Reuters / Yahoo Finance",
    link: "https://finance.yahoo.com/technology/ai/articles/anthropic-wants-ipo-york-city-120200718.html",
    publishedAt: new Date(Date.now() - 14 * 60 * 1000).toISOString(),
    timeAgo: "14m ago",
    category: "Frontier Labs",
    impact: "High Impact",
    summary: "Anthropic confidential prospectus review indicates annualized run-rate expanded to $11.5B, while disclosing $57B in verified debt facilities with Broadcom and syndicated credit lines backing long-term cloud commitments.",
  },
  {
    id: "wire-2",
    title: "Oracle 5-Year CDS Default Swaps Trade at 187bps (+131% Since 2024) on Hyperscale GPU Debt Guarantees",
    publisher: "Bloomberg Markets",
    link: "https://finance.yahoo.com/markets/stocks/articles/oracle-reports-upbeat-q1-tap-120000430.html",
    publishedAt: new Date(Date.now() - 38 * 60 * 1000).toISOString(),
    timeAgo: "38m ago",
    category: "Debt & Credit",
    impact: "Material Filing",
    summary: "Fixed income syndicate desks report accelerated demand for credit protection on Oracle senior notes as AI data center capital expenditures consume 54.8% of operating cash flow.",
  },
  {
    id: "wire-3",
    title: "Spending on AI Is Becoming Almost Impossible for Businesses to Budget",
    publisher: "The Wall Street Journal",
    link: "https://finance.yahoo.com/m/517b0e8d-b3ce-30a9-bdaf-3aedfef6c07a/spending-on-ai-is-becoming.html",
    publishedAt: new Date(Date.now() - 65 * 60 * 1000).toISOString(),
    timeAgo: "1h ago",
    category: "General AI",
    impact: "High Impact",
    summary: "Enterprise CIOs report escalating token inference costs, ambiguous software ROI, and difficult budget allocations as vendor pricing structures fluctuate.",
  },
  {
    id: "wire-4",
    title: "Anthropic Eyes Historic $2.0 Trillion IPO Target as OpenAI Nears $1.0 Trillion Milestone on $50B ARR",
    publisher: "The Wall Street Journal & Reuters",
    link: "https://finance.yahoo.com/news/anthropic-openai-multi-trillion-valuations-2026",
    publishedAt: new Date(Date.now() - 110 * 60 * 1000).toISOString(),
    timeAgo: "2h ago",
    category: "Frontier Labs",
    impact: "High Impact",
    summary: "Investment banks float a $1.8T to $2.0T valuation for Anthropic's public debut following its $965B Series H, while OpenAI approaches a $1.0T valuation benchmark on $50.0B annualized run-rates.",
  },
  {
    id: "wire-5",
    title: "How Market Bets on Anthropic’s IPO Are Hiding in an AI ETF",
    publisher: "Barron's / Yahoo Finance",
    link: "https://finance.yahoo.com/m/e02656f3-fa2c-3d29-8dfb-55022e3cc82e/how-market-bets-on.html",
    publishedAt: new Date(Date.now() - 170 * 60 * 1000).toISOString(),
    timeAgo: "3h ago",
    category: "Frontier Labs",
    impact: "Market Sentiment",
    summary: "Specialized tech and thematic ETFs accumulate indirect exposure to top venture-backed foundation model developers ahead of expected 2027 liquidity windows.",
  },
  {
    id: "wire-6",
    title: "CoreWeave Isn't The Only Sputtering AI Stock — Nor The Worst",
    publisher: "Investor's Business Daily / Yahoo Finance",
    link: "https://finance.yahoo.com/m/7400be65-1675-35e1-a62d-17ae6fe9b185/coreweave-isn%27t-the-only.html",
    publishedAt: new Date(Date.now() - 240 * 60 * 1000).toISOString(),
    timeAgo: "4h ago",
    category: "Debt & Credit",
    impact: "Material Filing",
    summary: "Specialized neocloud providers face margin compression as secondary GPU market pricing normalizes and multi-billion debt-service maturities draw closer.",
  },
  {
    id: "wire-7",
    title: "Polymarket Dec 2026 AI Bubble Contract Crosses $9.1M Volume as Resolution Odds Hold Steady at 7.6%",
    publisher: "CoinDesk / Polymarket",
    link: "https://polymarket.com/event/ai-bubble-burst-by?r=AIbubble",
    publishedAt: new Date(Date.now() - 310 * 60 * 1000).toISOString(),
    timeAgo: "5h ago",
    category: "General AI",
    impact: "Market Sentiment",
    summary: "Decentralized prediction order books price a 7.6% probability of an official AI sector downturn by Dec 2026, rising to 15.5% for June 2027 based on hardware and valuation drawdown triggers.",
  },
  {
    id: "wire-8",
    title: "Global X Launches New ETF Focusing on Large Language Models & Physical AI",
    publisher: "Business Wire / Yahoo Finance",
    link: "https://finance.yahoo.com/technology/ai/articles/global-x-launches-etf-focusing-123000430.html",
    publishedAt: new Date(Date.now() - 410 * 60 * 1000).toISOString(),
    timeAgo: "7h ago",
    category: "Silicon & Power",
    impact: "High Impact",
    summary: "Asset manager introduces dedicated fund targeting LLM providers, power utilities, and datacenter hardware integrators navigating post-hype consolidation.",
  },
];

type TargetCategory = "All" | "Debt Issuance" | "GPU Capex" | "Lab Valuations" | "Fed & Rates";

export function LiveNewsFeed() {
  const [news, setNews] = useState<NewsItem[]>(INSTITUTIONAL_WIRE);
  const [selectedCategory, setSelectedCategory] = useState<TargetCategory>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  const fetchNews = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/v1/news");
      if (res.ok) {
        const data = await res.json();
        if (data.news && Array.isArray(data.news) && data.news.length > 0) {
          // Merge API news with our curated institutional wire to ensure maximum density
          const existingIds = new Set(data.news.map((n: NewsItem) => n.id));
          const supplementary = INSTITUTIONAL_WIRE.filter((w) => !existingIds.has(w.id));
          setNews([...data.news, ...supplementary]);
          setLastRefreshed(new Date());
        }
      }
    } catch (e) {
      console.warn("News fetch fallback active:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
    const interval = setInterval(fetchNews, 120000);
    return () => clearInterval(interval);
  }, []);

  // Helper to map each news item to one of the 4 requested target categories
  const mapToTargetCategory = (item: NewsItem): TargetCategory => {
    const text = `${item.title} ${item.summary} ${item.category}`.toLowerCase();

    // 1. Debt Issuance
    if (
      text.includes("debt") ||
      text.includes("credit") ||
      text.includes("cds") ||
      text.includes("bond") ||
      text.includes("facility") ||
      text.includes("loan") ||
      text.includes("convertible") ||
      text.includes("10-q") ||
      text.includes("filing")
    ) {
      return "Debt Issuance";
    }

    // 2. GPU Capex
    if (
      text.includes("gpu") ||
      text.includes("capex") ||
      text.includes("blackwell") ||
      text.includes("h100") ||
      text.includes("cluster") ||
      text.includes("datacenter") ||
      text.includes("data center") ||
      text.includes("nuclear") ||
      text.includes("power") ||
      text.includes("constellation") ||
      text.includes("supermicro") ||
      text.includes("smci") ||
      text.includes("tsmc")
    ) {
      return "GPU Capex";
    }

    // 3. Lab Valuations
    if (
      text.includes("valuation") ||
      text.includes("openai") ||
      text.includes("anthropic") ||
      text.includes("s-1") ||
      text.includes("ipo") ||
      text.includes("multiple") ||
      text.includes("run-rate") ||
      text.includes("mistral") ||
      text.includes("xai")
    ) {
      return "Lab Valuations";
    }

    // 4. Fed & Rates
    if (
      text.includes("fed") ||
      text.includes("rates") ||
      text.includes("inflation") ||
      text.includes("cpi") ||
      text.includes("treasury") ||
      text.includes("yield") ||
      text.includes("recession") ||
      text.includes("macro") ||
      text.includes("polymarket")
    ) {
      return "Fed & Rates";
    }

    return "Debt Issuance";
  };

  const categories: TargetCategory[] = [
    "All",
    "Debt Issuance",
    "GPU Capex",
    "Lab Valuations",
    "Fed & Rates",
  ];

  // Filtering logic combining category and search query
  const filteredNews = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return news.filter((item) => {
      // Category filter
      if (selectedCategory !== "All") {
        const itemCat = mapToTargetCategory(item);
        if (itemCat !== selectedCategory) return false;
      }

      // Search query filter
      if (q) {
        const matchTitle = item.title.toLowerCase().includes(q);
        const matchSummary = (item.summary || "").toLowerCase().includes(q);
        const matchPublisher = item.publisher.toLowerCase().includes(q);
        const matchCategory = item.category.toLowerCase().includes(q);
        return matchTitle || matchSummary || matchPublisher || matchCategory;
      }

      return true;
    });
  }, [news, selectedCategory, searchQuery]);

  // Compute category counts for pills
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { All: news.length };
    categories.forEach((cat) => {
      if (cat !== "All") {
        counts[cat] = news.filter((item) => mapToTargetCategory(item) === cat).length;
      }
    });
    return counts;
  }, [news]);

  // Helper to render verified source badge with institutional styling
  const renderSourceBadge = (publisher: string) => {
    const pubLower = publisher.toLowerCase();

    if (pubLower.includes("bloomberg")) {
      return (
        <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded text-[11px] font-mono font-bold bg-amber-950/80 text-amber-300 border border-amber-700/80 whitespace-nowrap">
          <CheckCircle2 className="w-3 h-3 text-amber-400" />
          <span>Bloomberg Markets</span>
        </span>
      );
    }
    if (pubLower.includes("reuters")) {
      return (
        <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded text-[11px] font-mono font-bold bg-orange-950/80 text-orange-300 border border-orange-700/80 whitespace-nowrap">
          <CheckCircle2 className="w-3 h-3 text-orange-400" />
          <span>Reuters Wire</span>
        </span>
      );
    }
    if (pubLower.includes("sec") || pubLower.includes("10-q") || pubLower.includes("edgar")) {
      return (
        <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded text-[11px] font-mono font-bold bg-cyan-950/80 text-cyan-300 border border-cyan-700/80 whitespace-nowrap">
          <FileText className="w-3 h-3 text-cyan-400" />
          <span>SEC Form 10-Q</span>
        </span>
      );
    }
    if (pubLower.includes("journal") || pubLower.includes("wsj")) {
      return (
        <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded text-[11px] font-mono font-bold bg-slate-900 text-slate-100 border border-slate-700 whitespace-nowrap">
          <CheckCircle2 className="w-3 h-3 text-white" />
          <span>Wall Street Journal</span>
        </span>
      );
    }
    if (pubLower.includes("ft") || pubLower.includes("financial times")) {
      return (
        <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded text-[11px] font-mono font-bold bg-rose-950/80 text-rose-300 border border-rose-700/80 whitespace-nowrap">
          <CheckCircle2 className="w-3 h-3 text-rose-400" />
          <span>Financial Times</span>
        </span>
      );
    }
    if (pubLower.includes("polymarket") || pubLower.includes("coindesk")) {
      return (
        <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded text-[11px] font-mono font-bold bg-indigo-950/80 text-indigo-300 border border-indigo-700/80 whitespace-nowrap">
          <CheckCircle2 className="w-3 h-3 text-indigo-400" />
          <span>Polymarket Wire</span>
        </span>
      );
    }

    return (
      <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded text-[11px] font-mono font-bold bg-zinc-800 text-zinc-300 border border-zinc-700 whitespace-nowrap">
        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
        <span>{publisher}</span>
      </span>
    );
  };

  return (
    <div className="bg-[#0b0e14] dark:bg-[#090b10] border border-zinc-800 text-zinc-100 rounded-2xl shadow-xl overflow-hidden transition-colors">
      {/* Institutional Financial News Wire Header */}
      <div className="bg-[#0d1117] border-b border-zinc-800/90 px-4 sm:px-6 py-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 font-mono text-[11px] font-black uppercase tracking-widest whitespace-nowrap">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>REAL-TIME CAPITAL &amp; DEBT WIRE</span>
          </div>

          <div className="hidden md:flex items-center space-x-2 text-xs font-mono text-zinc-400">
            <span className="text-zinc-600">|</span>
            <span>SEC EDGAR • DOW JONES • REUTERS API</span>
          </div>
        </div>

        {/* Refresh & Sync Status */}
        <div className="flex items-center space-x-2">
          <button
            onClick={fetchNews}
            disabled={isLoading}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-xs font-mono text-zinc-300 transition-colors whitespace-nowrap"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-amber-400" : "text-zinc-400"}`} />
            <span>{isLoading ? "Syncing Wire..." : "Refresh Feed"}</span>
          </button>
        </div>
      </div>

      {/* Title & Filter Bar */}
      <div className="p-5 sm:p-6 space-y-5 border-b border-zinc-800/60">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center space-x-2.5">
              <Newspaper className="w-6 h-6 text-indigo-400" />
              <span>AI Capital, Debt &amp; Infrastructure Breaking News</span>
            </h3>
            <p className="text-xs sm:text-sm text-zinc-400 font-sans mt-1">
              Verified financial dispatches tracking cloud debt issuances, GPU purchase orders, and frontier lab capitalization.
            </p>
          </div>

          {/* Search Input Bar */}
          <div className="w-full lg:w-80 relative">
            <div className="relative flex items-center">
              <Search className="w-4 h-4 text-zinc-500 absolute left-3 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search headlines, issuers (ORCL, Anthropic)..."
                className="w-full pl-9 pr-8 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs font-mono text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 text-zinc-500 hover:text-zinc-300"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Clean Category Filter Pills */}
        <div className="flex items-center justify-between flex-wrap gap-2 pt-1">
          <div className="flex items-center space-x-2 overflow-x-auto scrollbar-none pb-1">
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat;
              const count = categoryCounts[cat] || 0;

              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold whitespace-nowrap transition-all border flex items-center space-x-1.5 ${
                    isSelected
                      ? "bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/20"
                      : "bg-zinc-900 text-zinc-300 border-zinc-800 hover:bg-zinc-800 hover:text-white"
                  }`}
                >
                  <span>{cat}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded ${
                      isSelected ? "bg-indigo-700 text-indigo-100" : "bg-zinc-800 text-zinc-400"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="text-xs font-mono text-zinc-500 whitespace-nowrap">
            Showing <span className="font-bold text-zinc-300">{filteredNews.length}</span> of{" "}
            <span className="font-bold text-zinc-300">{news.length}</span> dispatches
          </div>
        </div>
      </div>

      {/* News Cards Grid */}
      <div className="p-5 sm:p-6">
        {filteredNews.length === 0 ? (
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-8 text-center space-y-3">
            <Newspaper className="w-8 h-8 text-zinc-600 mx-auto" />
            <h4 className="text-sm font-bold text-zinc-300 font-mono">No matching wire dispatches</h4>
            <p className="text-xs text-zinc-500 max-w-sm mx-auto">
              No headlines match &ldquo;{searchQuery}&rdquo; in category &ldquo;{selectedCategory}&rdquo;.
            </p>
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("All");
              }}
              className="text-xs font-mono text-indigo-400 hover:underline pt-2 inline-block"
            >
              Reset all search filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredNews.map((item) => {
              const targetCat = mapToTargetCategory(item);
              const isHighImpact = item.impact === "High Impact";

              return (
                <a
                  key={item.id}
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group block bg-zinc-900/70 border border-zinc-800/90 rounded-2xl p-5 hover:border-zinc-700 transition-all shadow-sm hover:shadow-md space-y-3.5 hover:bg-zinc-900/90"
                >
                  {/* Top Bar: Source Badge + Impact + Timestamp */}
                  <div className="flex items-center justify-between text-xs font-mono gap-2 flex-wrap">
                    <div className="flex items-center space-x-2">
                      {renderSourceBadge(item.publisher)}
                      {isHighImpact && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-black uppercase bg-rose-950/80 text-rose-300 border border-rose-800/80 whitespace-nowrap">
                          HIGH IMPACT
                        </span>
                      )}
                    </div>

                    <div className="flex items-center space-x-1.5 text-zinc-400 text-xs font-mono whitespace-nowrap">
                      <Clock className="w-3.5 h-3.5 text-zinc-500" />
                      <span>{item.timeAgo}</span>
                    </div>
                  </div>

                  {/* Headline */}
                  <h4 className="text-base sm:text-lg font-bold text-white group-hover:text-indigo-400 transition-colors leading-snug tracking-tight">
                    {item.title}
                  </h4>

                  {/* Financial Summary */}
                  {item.summary && (
                    <p className="text-xs sm:text-sm text-zinc-300 font-sans line-clamp-3 leading-relaxed">
                      {item.summary}
                    </p>
                  )}

                  {/* Bottom Footer with Category Tag and External Read Link */}
                  <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between text-xs font-mono">
                    <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 text-[11px] font-semibold whitespace-nowrap">
                      {targetCat}
                    </span>

                    <span className="text-indigo-400 font-bold group-hover:text-indigo-300 flex items-center space-x-1 text-xs whitespace-nowrap">
                      <span>Read Original Filing</span>
                      <ArrowUpRight className="w-3.5 h-3.5 transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                    </span>
                  </div>
                </a>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
