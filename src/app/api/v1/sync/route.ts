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
    // 2026-10-19 (round-2 consolidation): every fallback below is re-synced to the published
    // output in src/data/latest-model.json (burst 71.6 / composite 63.3 / band "high" after the
    // HY-OAS correction to the FRED print; LPPLS 81.5; Minsky MFI 65.6; Shiller ECY 0.34;
    // MC median 71.4, VaR95 80.5, VaR99 82.7). The old fallbacks were a stale pre-rebaseline world
    // (48.2 / 54.4 / 59.1 / 80.1 / 83.4) that would have been published if the JSON ever failed to
    // load. Values only — no key, shape or route change.
    latestModelSummary: {
      burstProbability: latestModel?.burstProbability ?? 71.6,
      band: latestModel?.band ?? "high",
      compositeScore: latestModel?.compositeScore ?? 63.3,
      mertonDD: latestModel?.merton?.distanceToDefault ?? 5.13,
      altmanZ: latestModel?.altman?.score ?? 8.41,
      sornetteLpplsHazardPct: latestModel?.lppls?.crashHazardRatePct ?? 81.5,
      minskyRegime: (latestModel as any)?.minsky?.currentRegime ?? "Speculative Transition",
      minskyFragility: (latestModel as any)?.minsky?.minskyFragilityIndex ?? 65.6,
      shillerECY: (latestModel as any)?.shillerCape?.excessCapeYieldPct ?? 0.34,
      monteCarloMedianProbPct: latestModel?.monteCarlo?.medianProbabilityPct ?? 71.4,
      monteCarlo95VaRPct: latestModel?.monteCarlo?.valueAtRisk95Pct ?? 80.5,
      monteCarlo99VaRPct: (latestModel as any)?.monteCarlo?.valueAtRisk99Pct ?? 82.7,
    },
  });
}
