import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { LiveNewsFeed } from "@/components/LiveNewsFeed";
import type { NewsItem } from "@/app/api/v1/news/route";
import liveNews from "@/data/live-news.json";

/**
 * /news — the research wire.
 *
 * Server component: the headline counts come from the same snapshot the feed
 * serves, so the sentence at the top can never disagree with the list below.
 * Stamps are honest: this is a daily snapshot refreshed by the 24h cron, not a
 * live tape.
 */

/** live-news.json is a flat array of dispatches, newest first. */
const items = (Array.isArray(liveNews) ? liveNews : []) as NewsItem[];
const newest = items.reduce<string | null>(
  (acc, n) => (n.publishedAt && (!acc || n.publishedAt > acc) ? n.publishedAt : acc),
  null
);
const snapshotLabel = newest
  ? new Date(newest).toISOString().replace("T", " ").slice(0, 16) + " UTC"
  : null;
const highImpact = items.filter((n) => n.impact === "High Impact").length;

export default function NewsPage() {
  return (
    <div className="section-sm">
      <header className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
          <span className="label">Research wire</span>
          {/* 2026-10-19 (round-2 consolidation): conditional plural — a single dispatch must not
              read as "1 dispatches". */}
          <span className="pill">{items.length} {items.length === 1 ? "dispatch" : "dispatches"}</span>
          <span className="pill pill-caution">{highImpact} high impact</span>
          {snapshotLabel && <span className="num text-[14px] text-ink-faint">Snapshot {snapshotLabel}</span>}
        </div>

        <h1 className="max-w-reading text-3xl font-bold tracking-tight text-ink sm:text-4xl">
          Capital, debt and infrastructure filings
        </h1>

        <p className="prose prose-lead max-w-reading">
          Verified financial dispatches tracking cloud debt issuances, GPU purchase orders and frontier
          lab capitalization. The list is a daily snapshot refreshed by the 24-hour ingestion run, so the
          timestamps are publication times, not a live tape.
        </p>

        <div className="flex flex-wrap items-center gap-2">
          <Link href="/ledger" className="btn btn-primary min-h-11">
            <span>See the sourced deal ledger</span>
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
          <Link href="/api-docs" className="btn min-h-11">
            <span>Read it over the API</span>
          </Link>
        </div>
      </header>

      <div className="mt-6">
        <LiveNewsFeed items={items} />
      </div>

      <p className="notice mt-6">
        <span className="notice-title">How fresh this is</span>
        <span className="mt-1.5 block text-[14px] leading-relaxed">
          Headlines are collected once per day at 00:00 UTC from public filings and wires. Nothing on
          this page is investment advice.
        </span>
      </p>
    </div>
  );
}