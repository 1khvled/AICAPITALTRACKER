"use client";

import React, { useState, useEffect } from "react";
import { NewsItem } from "@/app/api/v1/news/route";
import {
  Newspaper,
  ExternalLink,
  RefreshCw,
  Clock,
  Sparkles,
  Building2,
  ShieldAlert,
  Zap,
  ArrowUpRight,
} from "lucide-react";

export function LiveNewsFeed() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  const fetchNews = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/v1/news");
      if (res.ok) {
        const data = await res.json();
        if (data.news && Array.isArray(data.news)) {
          setNews(data.news);
          setLastRefreshed(new Date());
        }
      }
    } catch (e) {
      console.warn("News fetch failed:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
    // Auto-refresh news every 2 minutes
    const interval = setInterval(fetchNews, 120000);
    return () => clearInterval(interval);
  }, []);

  const categories = [
    "All",
    "Debt & Credit",
    "Frontier Labs",
    "Hyperscalers",
    "Silicon & Power",
  ];

  const filteredNews = news.filter((item) => {
    if (selectedCategory !== "All" && item.category !== selectedCategory) return false;
    return true;
  });

  return (
    <div className="bg-white dark:bg-[#121214] border border-slate-200 dark:border-zinc-800 rounded-xl p-5 sm:p-6 space-y-5 transition-colors shadow-sm">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-200 dark:border-zinc-800">
        <div>
          <div className="flex items-center space-x-2 text-xs font-mono text-slate-500 dark:text-zinc-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="font-semibold text-slate-800 dark:text-zinc-200">Live News Wire</span>
            <span>•</span>
            <span>Free Public API Feeds</span>
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight mt-0.5 flex items-center space-x-2">
            <Newspaper className="w-5 h-5 text-indigo-500" />
            <span>AI Capital &amp; Infrastructure Breaking News</span>
          </h3>
        </div>

        <div className="flex items-center space-x-2">
          {/* Refresh Button */}
          <button
            onClick={fetchNews}
            disabled={isLoading}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 hover:bg-slate-100 dark:hover:bg-zinc-800 text-xs font-mono text-slate-700 dark:text-zinc-300 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-indigo-500" : ""}`} />
            <span>{isLoading ? "Syncing..." : "Refresh Feed"}</span>
          </button>
        </div>
      </div>

      {/* Category Filter Chips */}
      <div className="flex items-center space-x-2 overflow-x-auto scrollbar-none text-xs sm:text-sm pb-1">
        {categories.map((cat) => {
          const count = cat === "All" ? news.length : news.filter((n) => n.category === cat).length;
          return (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? "bg-slate-900 text-white dark:bg-white dark:text-zinc-950 font-bold shadow-sm"
                  : "bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-zinc-700"
              }`}
            >
              <span>{cat}</span>
              {count > 0 && <span className="ml-1.5 opacity-70 text-xs">({count})</span>}
            </button>
          );
        })}
      </div>

      {/* News Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredNews.map((item) => (
          <a
            key={item.id}
            href={item.link}
            target="_blank"
            rel="noopener noreferrer"
            className="group block bg-slate-50/80 dark:bg-[#09090b] border border-slate-200/90 dark:border-zinc-800 rounded-2xl p-5 hover:border-slate-300 dark:hover:border-zinc-700 transition-all shadow-sm hover:shadow-md space-y-3"
          >
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="px-2.5 py-1 rounded-md bg-slate-200/90 dark:bg-zinc-800 text-slate-800 dark:text-zinc-200 font-bold text-xs">
                {item.publisher}
              </span>
              <div className="flex items-center space-x-1.5 text-slate-500 dark:text-zinc-400 text-xs font-medium">
                <Clock className="w-3.5 h-3.5" />
                <span>{item.timeAgo}</span>
              </div>
            </div>

            <h4 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors leading-snug">
              {item.title}
            </h4>

            {item.summary && (
              <p className="text-sm text-slate-700 dark:text-zinc-300 font-sans line-clamp-2 leading-relaxed">
                {item.summary}
              </p>
            )}

            <div className="pt-2.5 border-t border-slate-200/70 dark:border-zinc-800/80 flex items-center justify-between text-xs">
              <span className="text-slate-600 dark:text-zinc-400 text-xs font-semibold">
                {item.category}
              </span>
              <span className="text-indigo-600 dark:text-indigo-400 font-bold group-hover:underline flex items-center space-x-1 text-xs sm:text-sm">
                <span>Read Full Wire</span>
                <ArrowUpRight className="w-4 h-4" />
              </span>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
