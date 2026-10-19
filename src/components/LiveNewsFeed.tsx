"use client";

import React, { useState, useEffect, useMemo } from "react";
import type { NewsItem } from "@/app/api/v1/news/route";
import {
  Newspaper,
  RefreshCw,
  Clock,
  Search,
  X,
  ArrowUpRight,
} from "lucide-react";

/**
 * The wire renders the DAILY INGESTION SNAPSHOT — src/data/live-news.json —
 * which the /news page passes in as props (the page header counts the same
 * array, so the headline can never disagree with the list).
 *
 * 19 Oct 2026 honesty rebuild: this component used to ship a hand-written
 * "institutional wire" of invented headlines with invented publisher
 * attributions, invented numbers ($11.5B ARR, 187bps CDS, $2.0T/$1.0T
 * valuations) and links to unrelated or dead URLs. All of it is deleted. Every
 * headline, publisher, timestamp and link below now comes from the ingestion
 * snapshot, and every age stamp is computed from the item's own publishedAt
 * after mount (never from a module-scope clock).
 */

type TargetCategory = "All" | "Debt Issuance" | "GPU Capex" | "Lab Valuations" | "Fed & Rates";

/**
 * Age stamp. `now` is null until the client has mounted, so the server render
 * and the first client render produce the identical string (no hydration
 * mismatch) and the relative time only appears once the page is live.
 */
// 2026-10-19 security audit 2.1: feed links arrive from upstream JSON. Only https:
// may become an href — React does not strip javascript: hrefs on its own.
const safeHref = (url: string): string => (/^https:\/\//i.test(url) ? url : "#");

function formatAge(publishedAt: string, now: number | null, fallback: string): string {
  if (now === null) return fallback;
  const ts = Date.parse(publishedAt);
  if (Number.isNaN(ts)) return fallback;
  const minutes = Math.max(1, Math.round((now - ts) / 60000));
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

export function LiveNewsFeed({ items = [] }: { items?: NewsItem[] }) {
  const [selectedCategory, setSelectedCategory] = useState<TargetCategory>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [now, setNow] = useState<number | null>(null);
  // null = use the server snapshot; a populated array = a manual reload.
  const [reloaded, setReloaded] = useState<NewsItem[] | null>(null);

  const news = reloaded ?? items;

  useEffect(() => {
    setNow(Date.now());
  }, []);

  // Reload the same daily snapshot from the API. The endpoint serves the
  // ingestion file, so this can never fabricate a newer headline — it only
  // re-reads what the pipeline last wrote.
  const fetchNews = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/v1/news");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.news) && data.news.length > 0) {
          setReloaded(data.news as NewsItem[]);
        }
      }
    } catch {
      /* keep the snapshot we already have — a snapshot is never a stream */
    } finally {
      setIsLoading(false);
    }
  };

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

  // Newest publication stamp in the snapshot (the "how fresh is this" label).
  const snapshotLabel = useMemo(() => {
    const newest = news.reduce<string | null>(
      (acc, n) => (n.publishedAt && (!acc || n.publishedAt > acc) ? n.publishedAt : acc),
      null
    );
    if (!newest) return null;
    const d = new Date(newest);
    return Number.isNaN(d.getTime())
      ? null
      : `${d.toISOString().replace("T", " ").slice(0, 16)} UTC`;
  }, [news]);

  // Helper to render verified source badge with institutional styling
  const renderSourceBadge = (publisher: string) => {
    const pubLower = publisher.toLowerCase();

    if (pubLower.includes("bloomberg")) {
      return <span className="chip chip-caution">Bloomberg</span>;
    }
    if (pubLower.includes("reuters")) {
      return <span className="chip chip-caution">Reuters</span>;
    }
    if (pubLower.includes("sec") || pubLower.includes("10-q") || pubLower.includes("edgar")) {
      return <span className="chip">SEC Form 10-Q</span>;
    }
    if (pubLower.includes("journal") || pubLower.includes("wsj")) {
      return <span className="chip">Wall Street Journal</span>;
    }
    if (pubLower.includes("ft") || pubLower.includes("financial times")) {
      return <span className="chip chip-risk">Financial Times</span>;
    }
    if (pubLower.includes("polymarket") || pubLower.includes("coindesk")) {
      return <span className="chip">Polymarket Wire</span>;
    }

    return <span className="chip">{publisher}</span>;
  };

  return (
    <div className="card card-flush overflow-hidden">
      {/* Wire header — snapshot wording, no pulsing dot */}
      <div className="flex flex-col gap-3 border-b border-rule px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
          <span className="pill">RESEARCH WIRE SNAPSHOT</span>
          <span className="text-[14px] text-ink-subtle">
            Daily ingestion (00:00 UTC) — a dated snapshot, not a live tape
          </span>
        </div>

        <button onClick={fetchNews} disabled={isLoading} className="btn min-h-11">
          <RefreshCw
            className={`h-4 w-4 ${isLoading ? "animate-spin text-caution-700" : ""}`}
            aria-hidden="true"
          />
          <span>{isLoading ? "Reloading..." : "Reload snapshot"}</span>
        </button>
      </div>

      {/* Title & filter bar */}
      <div className="space-y-4 border-b border-rule px-4 py-4 sm:px-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h3 className="flex items-center gap-2 text-lg font-bold tracking-tight text-ink">
              <Newspaper className="h-5 w-5 text-ink-subtle" aria-hidden="true" />
              <span>AI Capital, Debt &amp; Infrastructure Coverage</span>
            </h3>
            <p className="prose prose-p max-w-2xl text-sm">
              Publicly reported market coverage on cloud debt issuances, GPU purchase orders, and
              frontier lab capitalization. Headlines are collected once a day and are reproduced
              with their original publisher and publication time.
            </p>
          </div>

          {/* Search */}
          <div className="relative w-full lg:w-80">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-subtle"
              aria-hidden="true"
            />
            <input
              type="text"
              aria-label="Search wire dispatches"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search headlines, issuers (ORCL, Anthropic)..."
              className="min-h-11 w-full rounded-lg border border-rule bg-surface py-2 pl-9 pr-9 text-sm text-ink placeholder:text-ink-faint"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                aria-label="Clear search"
                className="absolute right-1 top-1/2 flex h-11 w-8 -translate-y-1/2 items-center justify-center text-ink-subtle hover:text-ink"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="-mx-1 flex items-center gap-2 overflow-x-auto px-1 pb-1 scrollbar-none">
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat;
              const count = categoryCounts[cat] || 0;

              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  aria-pressed={isSelected}
                  className={`flex min-h-11 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg border px-3 py-2 text-[13px] font-semibold transition-colors ${
                    isSelected
                      ? "border-ink bg-ink text-canvas"
                      : "border-rule bg-surface text-ink-muted hover:border-rule-strong hover:text-ink"
                  }`}
                >
                  <span>{cat}</span>
                  <span className={`num text-[14px] ${isSelected ? "text-canvas" : "text-ink-subtle"}`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          <p className="text-[14px] text-ink-subtle">
            Showing <span className="num font-semibold text-ink">{filteredNews.length}</span> of{" "}
            <span className="num font-semibold text-ink">{news.length}</span> dispatches
            {snapshotLabel ? (
              <>
                {" "}
                · <span className="num">newest {snapshotLabel}</span>
              </>
            ) : null}
          </p>
        </div>
      </div>

      {/* Dispatches */}
      <div className="px-4 py-4 sm:px-5">
        {filteredNews.length === 0 ? (
          <div className="panel space-y-3 p-8 text-center">
            <Newspaper className="mx-auto h-8 w-8 text-ink-faint" aria-hidden="true" />
            <h4 className="text-sm font-bold text-ink">No matching wire dispatches</h4>
            <p className="text-[14px] text-ink-muted">
              No headlines match &ldquo;{searchQuery}&rdquo; in category &ldquo;{selectedCategory}&rdquo;.
            </p>
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("All");
              }}
              className="btn btn-ghost min-h-11"
            >
              Reset all search filters
            </button>
          </div>
        ) : (
          <ol className="divide-y divide-rule border-y border-rule">
            {filteredNews.map((item) => {
              const targetCat = mapToTargetCategory(item);
              const isHighImpact = item.impact === "High Impact";

              return (
                <li key={item.id} className="py-4">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                    {renderSourceBadge(item.publisher)}
                    {isHighImpact && <span className="chip chip-risk">HIGH IMPACT</span>}
                    <span className="chip">{targetCat}</span>
                    <span className="num flex items-center gap-1.5 text-[14px] text-ink-subtle">
                      <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                      {formatAge(item.publishedAt, now, item.timeAgo)}
                    </span>
                  </div>

                  <a
                    href={safeHref(item.link)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group mt-1 block min-h-11 py-0.5"
                  >
                    <h4 className="text-[15px] font-semibold leading-snug text-ink underline decoration-rule underline-offset-4 group-hover:decoration-ink">
                      {item.title}
                    </h4>
                  </a>

                  {item.summary && (
                    <p className="prose line-clamp-3 mt-1.5 text-[14px]">{item.summary}</p>
                  )}

                  <a
                    href={safeHref(item.link)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="prose-a mt-2 inline-flex min-h-11 items-center gap-1 text-[13px] font-semibold"
                  >
                    <span>Read the original</span>
                    <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </a>
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </div>
  );
}
