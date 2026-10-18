import { NextRequest, NextResponse } from "next/server";
import rawDeals from "@/data/deals.json";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const search = searchParams.get("search")?.toLowerCase();
  const category = searchParams.get("category");
  const year = searchParams.get("year");
  const debtOnly = searchParams.get("debt_only") === "true";
  const circularOnly = searchParams.get("circular_only") === "true";
  const minAmount = searchParams.get("min_amount") ? parseFloat(searchParams.get("min_amount")!) : null;
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limit = Math.min(200, Math.max(1, parseInt(searchParams.get("limit") || "50", 10)));
  const sort = searchParams.get("sort") || "newest"; // "newest" | "biggest"

  let filtered = [...rawDeals];

  if (search) {
    filtered = filtered.filter(
      (d) =>
        d.title.toLowerCase().includes(search) ||
        d.description.toLowerCase().includes(search) ||
        d.category.toLowerCase().includes(search)
    );
  }

  if (category && category !== "All") {
    filtered = filtered.filter((d) => d.category.toLowerCase() === category.toLowerCase());
  }

  if (year && year !== "All") {
    const yr = parseInt(year, 10);
    filtered = filtered.filter((d) => d.year === yr);
  }

  if (debtOnly) {
    filtered = filtered.filter((d) => d.is_debt);
  }

  if (circularOnly) {
    filtered = filtered.filter((d) => d.is_circular);
  }

  if (minAmount !== null && !isNaN(minAmount)) {
    filtered = filtered.filter((d) => d.amount_usd >= minAmount);
  }

  if (sort === "biggest") {
    filtered.sort((a, b) => b.amount_usd - a.amount_usd);
  }

  const total = filtered.length;
  const totalVolumeUsd = filtered.reduce((sum, d) => sum + d.amount_usd, 0);
  const totalDebtUsd = filtered.filter((d) => d.is_debt).reduce((sum, d) => sum + d.amount_usd, 0);

  const startIndex = (page - 1) * limit;
  const paginatedDeals = filtered.slice(startIndex, startIndex + limit);

  return NextResponse.json(
    {
      success: true,
      meta: {
        total_deals: total,
        total_volume_usd: totalVolumeUsd,
        total_debt_usd: totalDebtUsd,
        page,
        limit,
        total_pages: Math.ceil(total / limit),
      },
      deals: paginatedDeals,
    },
    {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=7200",
      },
    }
  );
}
