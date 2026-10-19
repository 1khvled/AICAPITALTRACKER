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
  ChevronDown,
} from "lucide-react";
import { Reveal } from "@/components/Reveal";

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
 *
 * Interactivity added on 2026-10-19:
 *   - the filter chips are the snapshot's OWN category values (read from the
 *     data, not guessed) with a live count on each chip;
 *   - a search box over headline and publisher;
 *   - each dispatch expands to its full summary and its publication stamp;
 *   - an explicit empty state and a "showing N of M" count.
 *
 * Nothing here invents text: the categories are the feed's, the publisher is
 * the feed's, and the expanded panel renders only fields that exist on the
 * item.
 */

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

/**
 * The exact publication stamp from the item's own publishedAt. Only a
 * reformatting of a field the feed already carries — nothing is derived.
 */
function formatPublished(publishedAt: string, fallback: string): string {
  const ts = Date.parse(publishedAt);
  if (Number.isNaN(ts)) return fallback;
  const d = new Date(ts);
  return `${d.toISOString().replace("T", " ").slice(0, 16)} UTC`;
}

export function LiveNewsFeed({ items = [] }: { items?: NewsItem[] }) {
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [now, setNow] = useState<number | null>(null);
  // null = use the server snapshot; a populated array = a manual reload.
  const [reloaded, setReloaded] = useState<NewsItem[] | null>(null);
  // The dispatch whose details are open (one at a time keeps the page short).
  const [expandedId, setExpandedId] = useState<string | null>(null);

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

  /**
   * The filter chips are the snapshot's own category values. They are read out
   * of the data rather than hard-coded, so a new category in tomorrow's
   * ingestion gets a chip with no code change — and no category is invented
   * here either.
   */
  const categories = useMemo(() => {
    const seen = new Set<string>();
    news.forEach((item) => {
      if (item && typeof item.category === "string" && item.category) {
        seen.add(item.category);
      }
    });
    return Array.from(seen).sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
  }, [news]);

  // Live count per chip, counted over the whole snapshot.
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { All: news.length };
    news.forEach((item) => {
      if (item && typeof item.category === "string") {
        counts[item.category] = (counts[item.category] ?? 0) + 1;
      }
    });
    return counts;
  }, [news]);

  // Filtering: category, then a headline / publisher search.
  const filteredNews = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return news.filter((item) => {
      if (selectedCategory !== "All" && item.category !== selectedCategory) {
        return false;
      }
      if (!q) return true;
      const title = (item.title || "").toLowerCase();
      const publisher = (item.publisher || "").toLowerCase();
      return title.indexOf(q) !== -1 || publisher.indexOf(q) !== -1;
    });
  }, [news, selectedCategory, searchQuery]);

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

  const resetFilters = () => {
    setSearchQuery("");
    setSelectedCategory("All");
  };

  const chipClass = (active: boolean) =>
    [
      "chip min-h-11 shrink-0 items-center whitespace-nowrap px-3 transition-colors duration-150",
      active ? "chip-on" : "hover:border-rule-strong hover:bg-surface-2",
    ].join(" ");

  return (
    <div className="card card-flush overflow-hidden shadow-card transition-shadow duration-200 hover:shadow-raised">
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

          {/* Search — headline and publisher */}
          <div className="relative w-full lg:w-80">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint"
              aria-hidden="true"
            />
            <label htmlFor="news-search" className="sr-only">
              Search wire dispatches by headline or publisher
            </label>
            <input
              id="news-search"
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search headlines or publishers"
              autoComplete="off"
              className="min-h-11 w-full rounded-md border border-rule-strong bg-canvas pl-9 pr-11 text-[15px] text-ink placeholder:text-ink-faint"
            />
            {searchQuery ? (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-0 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-md text-ink-subtle transition-colors duration-150 hover:bg-surface-2 hover:text-ink"
              >
                <X className="h-4 w-4" aria-hidden="true" />
                <span className="sr-only">Clear the wire search</span>
              </button>
            ) : null}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="-mx-1 flex items-center gap-2 overflow-x-auto px-1 pb-1 scrollbar-none">
            <button
              type="button"
              onClick={() => setSelectedCategory("All")}
              aria-pressed={selectedCategory === "All"}
              className={chipClass(selectedCategory === "All")}
            >
              <span>All</span>
              <span className="num opacity-70">{categoryCounts.All ?? 0}</span>
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                aria-pressed={selectedCategory === cat}
                className={chipClass(selectedCategory === cat)}
              >
                <span>{cat}</span>
                <span className="num opacity-70">{categoryCounts[cat] ?? 0}</span>
              </button>
            ))}
          </div>

          <p className="text-[14px] text-ink-subtle" aria-live="polite">
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
          <div className="panel flex min-h-[12rem] flex-col items-center justify-center gap-3 p-8 text-center">
            <Newspaper className="mx-auto h-7 w-7 text-ink-faint" aria-hidden="true" />
            <p className="text-[15px] font-bold text-ink">No stories match your filters.</p>
            <p className="max-w-reading text-[14px] text-ink-muted">
              {searchQuery.trim() && selectedCategory !== "All" ? (
                <>
                  Nothing in <span>“{selectedCategory}”</span> matches{" "}
                  <span className="num">“{searchQuery.trim()}”</span>.
                </>
              ) : searchQuery.trim() ? (
                <>
                  No story matches <span className="num">“{searchQuery.trim()}”</span>.
                </>
              ) : selectedCategory !== "All" ? (
                <>
                  No dispatch in <span>“{selectedCategory}”</span> in this snapshot.
                </>
              ) : (
                <>This snapshot has no dispatches.</>
              )}{" "}
              Clear the filter to see all {news.length} dispatches.
            </p>
            <button onClick={resetFilters} className="btn min-h-11">
              <X className="h-4 w-4" aria-hidden="true" />
              Clear the filter
            </button>
          </div>
        ) : (
          <ol className="divide-y divide-rule border-y border-rule">
            {filteredNews.map((item, index) => {
              const isHighImpact = item.impact === "High Impact";
              const expanded = expandedId === item.id;
              const detailsId = `news-details-${item.id}`;
              const titleId = `news-title-${item.id}`;

              return (
                <li key={item.id}>
                  <Reveal as="div" delay={Math.min(index, 6) * 40} className="py-4">
                    <article
                      tabIndex={0}
                      aria-labelledby={titleId}
                      className="rounded-md focus-visible:bg-surface-2"
                    >
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                        {/* The publisher, exactly as the feed records it. */}
                        <span className="chip">{item.publisher}</span>
                        {isHighImpact ? <span className="chip chip-risk">HIGH IMPACT</span> : null}
                        <span className="chip">{item.category}</span>
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
                        <h4
                          id={titleId}
                          className="text-[15px] font-semibold leading-snug text-ink underline decoration-rule underline-offset-4 group-hover:decoration-ink"
                        >
                          {item.title}
                        </h4>
                      </a>

                      {item.summary ? (
                        <p
                          className={`prose mt-1.5 text-[14px] ${expanded ? "" : "line-clamp-3"}`}
                        >
                          {item.summary}
                        </p>
                      ) : null}

                      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
                        <button
                          type="button"
                          onClick={() => setExpandedId(expanded ? null : item.id)}
                          aria-expanded={expanded}
                          aria-controls={detailsId}
                          className="inline-flex min-h-11 items-center gap-1.5 text-[13px] font-semibold text-ink transition-[color,transform] duration-150 hover:text-ink-muted"
                        >
                          <span>{expanded ? "Hide details" : "Show details"}</span>
                          <ChevronDown
                            className={`h-4 w-4 ${expanded ? "rotate-180" : ""}`}
                            aria-hidden="true"
                          />
                        </button>

                        <a
                          href={safeHref(item.link)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="prose-a inline-flex min-h-11 items-center gap-1 text-[13px] font-semibold"
                        >
                          <span>Read the original</span>
                          <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                        </a>
                      </div>

                      {expanded ? (
                        <div
                          id={detailsId}
                          className="mt-2 border-t border-rule pt-3"
                        >
                          <dl className="grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2">
                            <div className="flex items-baseline justify-between gap-3 sm:block">
                              <dt className="label">Publisher</dt>
                              <dd className="text-[14px] text-ink sm:mt-0.5">{item.publisher}</dd>
                            </div>
                            <div className="flex items-baseline justify-between gap-3 sm:block">
                              <dt className="label">Category</dt>
                              <dd className="text-[14px] text-ink sm:mt-0.5">{item.category}</dd>
                            </div>
                            <div className="flex items-baseline justify-between gap-3 sm:block">
                              <dt className="label">Impact</dt>
                              <dd className="text-[14px] text-ink sm:mt-0.5">{item.impact}</dd>
                            </div>
                            <div className="flex items-baseline justify-between gap-3 sm:block">
                              <dt className="label">Published</dt>
                              <dd className="num text-[14px] text-ink sm:mt-0.5">
                                {formatPublished(item.publishedAt, item.timeAgo)}
                              </dd>
                            </div>
                          </dl>
                        </div>
                      ) : null}
                    </article>
                  </Reveal>
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </div>
  );
}
