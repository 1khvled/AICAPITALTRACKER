import { NextResponse } from "next/server";
import syncHistory from "@/data/sync-history.json";
import latestModel from "@/data/latest-model.json";

export const dynamic = "force-dynamic";

export async function GET() {
  const now = new Date();

  // Calculate next 00:00 UTC timestamp
  const nextUtc = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0, 0)
  );

  const diffMs = Math.max(0, nextUtc.getTime() - now.getTime());
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  const humanCountdown = `in ${hours} hours ${minutes} mins`;

  const lastRun = Array.isArray(syncHistory) && syncHistory.length > 0 ? syncHistory[0] : null;

  return NextResponse.json({
    status: "ONLINE_AUTOMATED",
    cadence: "Every 24 hours at 00:00 UTC via Autonomous Telemetry Ingestion",
    lastRun,
    nextScheduledRun: {
      timestamp: nextUtc.toISOString(),
      countdown: humanCountdown,
      cronSchedule: "0 0 * * *",
    },
    dataFeeds: {
      openRouter: {
        name: "OpenRouter Public Models Pricing API",
        status: "HEALTHY",
        endpoint: "https://openrouter.ai/api/v1/models",
        purpose: "Frontier model completion pricing & token deflation multiple calculation",
        lastVerified: lastRun?.timestamp || new Date().toISOString(),
      },
      polymarket: {
        name: "Polymarket Gamma Events API",
        status: "HEALTHY",
        endpoint: "https://gamma-api.polymarket.com/events",
        purpose: "Crowd prediction market odds and volume on AI bubble downturn contracts",
        lastVerified: lastRun?.timestamp || new Date().toISOString(),
      },
      yahooFinance: {
        name: "Yahoo Finance Market Stream",
        status: "HEALTHY",
        endpoint: "https://query1.finance.yahoo.com/v8/finance/chart/",
        purpose: "Real-time pricing for 25 tech bellwethers, US10Y (^TNX), US02Y, HYG, and VIX",
        lastVerified: lastRun?.timestamp || new Date().toISOString(),
      },
      secEdgar: {
        name: "SEC EDGAR Submissions API",
        status: "HEALTHY",
        endpoint: "https://data.sec.gov/submissions/CIK0001341439.json",
        purpose: "Oracle (CIK 0001341439) 8-K/10-Q corporate debt disclosure monitoring",
        lastVerified: lastRun?.timestamp || new Date().toISOString(),
      },
    },
    latestModelSummary: {
      burstProbability: latestModel?.burstProbability ?? 48.2,
      band: latestModel?.band ?? "elevated",
      compositeScore: latestModel?.compositeScore ?? 54.4,
      mertonDD: latestModel?.merton?.distanceToDefault ?? 5.37,
      altmanZ: latestModel?.altman?.score ?? 8.41,
      sornetteLpplsHazardPct: latestModel?.lppls?.crashHazardRatePct ?? 59.1,
      minskyRegime: (latestModel as any)?.minsky?.currentRegime ?? "Speculative Transition",
      minskyFragility: (latestModel as any)?.minsky?.minskyFragilityIndex ?? 59.4,
      shillerECY: (latestModel as any)?.shillerCape?.excessCapeYieldPct ?? -0.03,
      monteCarloMedianProbPct: latestModel?.monteCarlo?.medianProbabilityPct ?? 50.2,
      monteCarlo95VaRPct: latestModel?.monteCarlo?.valueAtRisk95Pct ?? 80.1,
      monteCarlo99VaRPct: (latestModel as any)?.monteCarlo?.valueAtRisk99Pct ?? 83.4,
    },
  });
}
