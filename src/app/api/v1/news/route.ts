import { NextRequest, NextResponse } from "next/server";
import liveNews from "@/data/live-news.json";

export interface NewsItem {
  id: string;
  title: string;
  publisher: string;
  link: string;
  publishedAt: string;
  timeAgo: string;
  category: "Debt & Credit" | "Frontier Labs" | "Hyperscalers" | "Silicon & Power" | "General AI";
  impact: "High Impact" | "Material Filing" | "Market Sentiment";
  summary: string;
}

/**
 * GET /api/v1/news — the daily research snapshot.
 *
 * 19 Oct 2026 honesty rebuild: this route used to fall back to a hand-written
 * list of invented headlines — invented publisher attributions ("Bloomberg
 * Markets"), invented numbers (187bps CDS, $82B of debt, $11.5B ARR) and links
 * to unrelated or dead URLs. It now serves the same ingestion snapshot the
 * /news page renders (src/data/live-news.json), so the API and the page can
 * never tell different stories.
 *
 * The snapshot is written once a day by the 00:00 UTC ingestion run; this
 * endpoint does not and cannot invent a fresher headline.
 */
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");
  const impact = searchParams.get("impact");

  const all = (Array.isArray(liveNews) ? liveNews : []) as NewsItem[];

  const filtered = all.filter(
    (n) =>
      (!category || category === "All" || n.category.toLowerCase() === category.toLowerCase()) &&
      (!impact || impact === "All" || n.impact.toLowerCase() === impact.toLowerCase())
  );

  const newest = all.reduce<string | null>(
    (acc, n) => (n.publishedAt && (!acc || n.publishedAt > acc) ? n.publishedAt : acc),
    null
  );

  return NextResponse.json(
    {
      success: true,
      source: "Daily research snapshot — src/data/live-news.json (ingested 00:00 UTC)",
      updatedAt: newest,
      count: filtered.length,
      news: filtered,
    },
    {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=7200",
      },
    }
  );
}
