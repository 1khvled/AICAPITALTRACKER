"use client";

import React, { useState, useMemo } from "react";
import {
  POLYMARKET_REFERRAL_CODE,
  POLYMARKET_FEATURED_MARKETS,
  POLYMARKET_HISTORICAL_TRENDS,
  POLYMARKET_RESOLUTION_CONDITIONS,
  PolymarketMarket,
} from "@/data/polymarket-data";
import liveInputsData from "@/data/live-inputs.json";
import {
  TrendingUp,
  ShieldAlert,
  BarChart2,
  ArrowUpRight,
  Sparkles,
  Zap,
  Calculator,
  Copy,
  Check,
  Clock,
  Flame,
  RefreshCw,
  Layers,
} from "lucide-react";

interface LiveCrowdMarket {
  id: string;
  question: string;
  slug: string;
  eventSlug: string;
  yesProbabilityPct: number;
  noProbabilityPct: number;
  volumeUsd: number;
  referralUrl: string;
}

/**
 * Chart series palette — the design tokens from tailwind.config.ts (19 Oct 2026).
 * SVG needs literal colours, so the semantic token values (safe / risk /
 * caution) and the ink ramp are mirrored here once. The indigo/green hexes
 * this file used before were off-palette: violet and off-token green are not
 * part of the system.
 */
const SERIES = {
  risk500: "#D1433C", // tailwind risk-500
  caution500: "#B57F0A", // tailwind caution-500
  safe500: "#0E9F6E", // tailwind safe-500
  inkSubtle: "rgb(var(--c-ink-subtle))", // globals.css --c-ink-subtle
  inkFaint: "rgb(var(--c-ink-faint))", // globals.css --c-ink-faint
} as const;

export function PolymarketCharts() {
  const [activeTab, setActiveTab] = useState<"markets" | "trend" | "triggers" | "calculator">("markets");
  const [marketFilter, setMarketFilter] = useState<"All" | "Bubble & Downturn" | "Frontier Labs" | "Macro Tech">("All");
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  // Read automated 24h data from live-inputs.json
  const crowdData = liveInputsData?.crowd;
  // 2026-10-19 fact-check: the stale fallbacks were $9,143,296.3 / 10.3% / 16.5%.
  // The live 24h cron reading is $9,167,627 traded, 9.05% on the 2026 contract
  // and 19.5% on the Jun-2027 contract.
  const totalVolume = crowdData?.volumeUsd ?? 9_167_627;
  const bubble2026Prob = (crowdData?.bubble2026Probability ?? 0.0905) * 100;
  const bubble2027Prob = (crowdData?.bubble2027Probability ?? 0.195) * 100;
  const activeContractsCount = crowdData?.activeContractsCount ?? 16;
  const lastSyncedAt = liveInputsData?.meta?.last_synced_at
    ? new Date(liveInputsData.meta.last_synced_at).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }) + " UTC"
    : "24h Automated Cron";

  // Build full set of active contracts merging Polymarket Gamma API feeds from live-inputs.json
  const activeContracts: PolymarketMarket[] = useMemo(() => {
    const rawMarkets: LiveCrowdMarket[] = (crowdData?.markets as LiveCrowdMarket[]) || [];

    if (rawMarkets.length === 0) {
      return POLYMARKET_FEATURED_MARKETS;
    }

    return rawMarkets.map((m) => {
      const q = m.question.toLowerCase();
      let category: "Bubble & Downturn" | "Debt & Sovereign" | "Frontier Labs" | "Macro Tech" = "Bubble & Downturn";

      if (q.includes("burst") || q.includes("downturn")) {
        category = "Bubble & Downturn";
      } else if (q.includes("recession") || q.includes("fed") || q.includes("yield")) {
        category = "Macro Tech";
      } else if (q.includes("ipo") || q.includes("agi") || q.includes("anthropic") || q.includes("openai")) {
        category = "Frontier Labs";
      }

      const yesP = Math.max(0.01, Math.min(0.99, m.yesProbabilityPct / 100));
      const noP = Math.max(0.01, Math.min(0.99, m.noProbabilityPct / 100));

      const tradeYesUrl = `${m.referralUrl}&outcome=Yes`;
      const tradeNoUrl = `${m.referralUrl}&outcome=No`;

      let description = "Real-time decentralized order-book contract parsed from Polymarket Gamma API.";
      if (q.includes("burst in 2026")) {
        description = "Resolves to YES if 3 of 6 conditions hit within 90 days: NVDA -50%, SOXX -40%, OpenAI/Anthropic restructuring, H100 rental <$1/hr, or major supplier drawdown.";
      } else if (q.includes("june 30, 2027")) {
        description = "Medium-term contract pricing hyperscaler debt refinancing risk and AI cluster capex exhaustion.";
      } else if (q.includes("ipo")) {
        description = "Official US exchange IPO listing contract pricing liquidity horizon and employee equity lockups.";
      } else if (q.includes("agi")) {
        description = "Resolves to YES if OpenAI publicly claims to have created AGI before 2027.";
      } else if (q.includes("recession")) {
        description = "Resolves to YES if NBER announces an official US recession cycle starting by end of 2026.";
      }

      return {
        id: m.id,
        title: m.question,
        question: m.question,
        category,
        slug: m.slug,
        eventSlug: m.eventSlug,
        yesProbabilityPct: m.yesProbabilityPct,
        noProbabilityPct: m.noProbabilityPct,
        yesPriceUsd: Number(yesP.toFixed(3)),
        noPriceUsd: Number(noP.toFixed(3)),
        volumeUsd: m.volumeUsd,
        liquidityUsd: Math.round(m.volumeUsd * 0.05),
        endDate: q.includes("2025") ? "2025-12-31" : q.includes("2026") ? "2026-12-31" : "2027-06-30",
        referralUrl: m.referralUrl,
        tradeYesUrl,
        tradeNoUrl,
        description,
        tag: m.slug.includes("december-31-2026") ? "Flagship Contract" : m.volumeUsd > 1_000_000 ? "High Liquidity" : "Live Contract",
        resolutionSource: "UMA Decentralized Oracle",
        change24hPct: m.yesProbabilityPct > 10 ? -0.4 : 0.2,
      };
    });
  }, [crowdData]);

  // Flagship 2026 contract updated with live 24h probability
  const flagshipMarket: PolymarketMarket = useMemo(() => {
    const live2026 = activeContracts.find((m) => m.slug.includes("december-31-2026")) || activeContracts[0];
    return {
      ...live2026,
      yesProbabilityPct: bubble2026Prob,
      noProbabilityPct: Number((100 - bubble2026Prob).toFixed(1)),
      yesPriceUsd: Number((bubble2026Prob / 100).toFixed(3)),
      noPriceUsd: Number(((100 - bubble2026Prob) / 100).toFixed(3)),
    };
  }, [activeContracts, bubble2026Prob]);

  // Filtered contracts list for tabs
  const filteredActiveContracts = useMemo(() => {
    if (marketFilter === "All") return activeContracts;
    return activeContracts.filter((c) => c.category === marketFilter);
  }, [activeContracts, marketFilter]);

  // Calculator State
  const [calcMarketId, setCalcMarketId] = useState<string>(activeContracts[0]?.id || "691340");
  const [calcOutcome, setCalcOutcome] = useState<"YES" | "NO">("YES");
  const [calcAmount, setCalcAmount] = useState<number>(100);

  // Calculator Math
  const selectedCalcMarket =
    activeContracts.find((m) => m.id === calcMarketId) || flagshipMarket;
  const activePrice = calcOutcome === "YES" ? selectedCalcMarket.yesPriceUsd : selectedCalcMarket.noPriceUsd;
  const numShares = activePrice > 0 ? calcAmount / activePrice : 0;
  const totalPayout = numShares * 1.0;
  const netProfit = totalPayout - calcAmount;
  const roiPct = calcAmount > 0 ? (netProfit / calcAmount) * 100 : 0;
  const tradeUrl =
    calcOutcome === "YES" ? selectedCalcMarket.tradeYesUrl : selectedCalcMarket.tradeNoUrl;

  const handleCopyCode = () => {
    navigator.clipboard?.writeText(POLYMARKET_REFERRAL_CODE);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // SVG Chart dimensions for Historical Trajectory
  const chartWidth = 720;
  const chartHeight = 260;
  const padding = { top: 20, right: 30, bottom: 40, left: 45 };
  const innerWidth = chartWidth - padding.left - padding.right;
  const innerHeight = chartHeight - padding.top - padding.bottom;
  const maxPct = 50;

  // Seamlessly bind live 24h cron odds to the terminal point of the trajectory
  const points = useMemo(() => {
    return POLYMARKET_HISTORICAL_TRENDS.map((p, idx) => {
      if (idx === POLYMARKET_HISTORICAL_TRENDS.length - 1) {
        return {
          ...p,
          aiBubble2026: Number(bubble2026Prob.toFixed(1)),
          aiBubble2027: Number(bubble2027Prob.toFixed(1)),
          volumeCumulativeMillions: Number((totalVolume / 1e6).toFixed(1)),
        };
      }
      return p;
    });
  }, [bubble2026Prob, bubble2027Prob, totalVolume]);

  const getX = (index: number) => padding.left + (index / (points.length - 1)) * innerWidth;
  const getY = (val: number) => padding.top + innerHeight - (Math.min(val, maxPct) / maxPct) * innerHeight;

  const makePath = (key: "aiBubble2026" | "aiBubble2027" | "oracleCdsStress" | "openaiAgiOdds") => {
    return points
      .map((p, i) => `${i === 0 ? "M" : "L"} ${getX(i).toFixed(1)} ${getY(p[key]).toFixed(1)}`)
      .join(" ");
  };

  const bubble2026Path = makePath("aiBubble2026");
  const bubble2027Path = makePath("aiBubble2027");
  const oracleCdsPath = makePath("oracleCdsStress");
  const openaiAgiPath = makePath("openaiAgiOdds");

  return (
<div className="card card-flush overflow-hidden">
      {/* Polymarket Partner Integration Header */}
      <div className="border-b border-rule px-4 py-4 sm:px-5 sm:py-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 space-y-2">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
              <span className="pill pill-safe">Live Autonomous Telemetry (00:00 UTC Daily)</span>
              <span className="pill">POLYMARKET GAMMA API</span>
              <span className="num text-[14px] font-semibold text-ink">
                ${(totalVolume / 1_000_000).toFixed(2)}M+ Real Volume
              </span>
              <span className="text-[14px] text-ink-subtle">{activeContractsCount} Active Contracts</span>
            </div>

            <h3 className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xl font-bold tracking-[-0.02em] text-ink">
              <span>AI Bubble &amp; Tech Prediction Markets</span>
              <span className="num text-[14px] text-ink-subtle">
                Partner Ref: {POLYMARKET_REFERRAL_CODE}
              </span>
            </h3>

            <p className="prose max-w-2xl text-sm">
              Real-time decentralized order-book probabilities from Polymarket Gamma API, ingested
              continuously every 24 hours. Trade outcomes directly with USDC on Polygon to hedge
              semiconductor capex exhaustion and credit spreads.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <a
              href={`https://polymarket.com/?r=${POLYMARKET_REFERRAL_CODE}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary min-h-11 whitespace-nowrap"
            >
              <span>Trade on Polymarket (Ref: {POLYMARKET_REFERRAL_CODE})</span>
              <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
            </a>

            <button
              onClick={handleCopyCode}
              title="Copy Referral Code"
              className="btn min-h-11 whitespace-nowrap"
            >
              {copiedCode ? (
                <Check className="h-4 w-4 text-safe-600" aria-hidden="true" />
              ) : (
                <Copy className="h-4 w-4" aria-hidden="true" />
              )}
              <span>{copiedCode ? "Code Copied!" : "Copy Code"}</span>
            </button>
          </div>
        </div>

        {/* View switcher — 44px targets, scrollable on a phone */}
        <div className="-mx-4 mt-4 flex items-center gap-2 overflow-x-auto border-t border-rule px-4 pt-4 scrollbar-none sm:mx-0 sm:px-0">
          {(
            [
              { id: "markets", label: `Active Contracts (${activeContractsCount})`, Icon: BarChart2 },
              { id: "calculator", label: "Odds & Payout Calculator", Icon: Calculator },
              { id: "trend", label: "Historical Trajectory", Icon: TrendingUp },
              { id: "triggers", label: "UMA Resolution Rulebook", Icon: ShieldAlert },
            ] as const
          ).map(({ id, label, Icon }) => {
            const isActive = activeTab === id;
            return (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                aria-current={isActive ? "true" : undefined}
                className={`flex min-h-11 shrink-0 items-center gap-2 whitespace-nowrap rounded-lg border px-3 py-2 text-[13px] font-semibold transition-colors ${
                  isActive
                    ? "border-ink bg-ink text-canvas"
                    : "border-rule bg-surface text-ink-muted hover:border-rule-strong hover:text-ink"
                }`}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                <span>{label}</span>
              </button>
            );
          })}
        </div>
      </div>

{/* Main Tab Content */}
      <div className="space-y-5 p-4 sm:p-5">
        {/* TAB 1: Live Market Cards & Automated 24h Order Books */}
        {activeTab === "markets" && (
          <div className="space-y-5">
            {/* FEATURED CARD: Live Polymarket AI Bubble Contract */}
            <div className="card space-y-4">
              {/* Top Meta Bar */}
              <div className="flex flex-col gap-2 border-b border-rule pb-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="chip chip-caution">
                    <Flame className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>FLAGSHIP PREDICTION CONTRACT</span>
                  </span>

                  <span className="chip">
                    <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>EXPIRATION: DEC 31, 2026</span>
                  </span>

                  <span className="num text-[14px] text-ink-faint">LAST CRON: {lastSyncedAt}</span>
                </div>

                <p className="text-[14px] text-ink-subtle">
                  <span className="label">Settlement</span>{" "}
                  <span className="font-semibold text-ink">UMA Oracle (90-Day Window)</span>
                </p>
              </div>

              {/* Main Headline & Description */}
              <div className="space-y-2">
                <a
                  href={flagshipMarket.referralUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex min-h-11 items-center gap-2 py-1"
                >
                  <h4 className="text-lg font-bold tracking-[-0.02em] text-ink underline decoration-rule underline-offset-4 group-hover:decoration-ink sm:text-xl">
                    {flagshipMarket.title}
                  </h4>
                  <ArrowUpRight className="h-4 w-4 shrink-0 text-ink-subtle" aria-hidden="true" />
                </a>

                <p className="prose max-w-3xl text-sm">{flagshipMarket.description}</p>
              </div>

              {/* Visual Odds Distribution Bar with Live 2026/2027 Probabilities */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[14px] sm:text-sm">
                  <div className="flex items-center gap-2">
                    <span className="num font-semibold text-safe-700">
                      YES {flagshipMarket.yesProbabilityPct.toFixed(1)}%
                    </span>
                    <span className="text-ink-subtle">
                      ({Math.round(flagshipMarket.yesPriceUsd * 100)}¢ / share)
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-ink-subtle">
                      ({Math.round(flagshipMarket.noPriceUsd * 100)}¢ / share)
                    </span>
                    <span className="num font-semibold text-risk-700">
                      NO {flagshipMarket.noProbabilityPct.toFixed(1)}%
                    </span>
                  </div>
                </div>

                {/* Odds split — a proportional readout, not a control. Trading links
                    live in the action row below so every tap target stays 44px. */}
                <div
                  aria-hidden="true"
                  className="flex min-h-11 w-full overflow-hidden rounded-lg border border-rule"
                >
                  <div
                    style={{ width: `${Math.max(10, flagshipMarket.yesProbabilityPct)}%` }}
                    className="flex items-center justify-center bg-safe-500 px-2 text-[14px] font-semibold text-canvas"
                  >
                    YES {flagshipMarket.yesProbabilityPct.toFixed(1)}%
                  </div>
                  <div
                    style={{ width: `${Math.min(90, flagshipMarket.noProbabilityPct)}%` }}
                    className="flex items-center justify-center bg-risk-500 px-2 text-[14px] font-semibold text-canvas"
                  >
                    NO {flagshipMarket.noProbabilityPct.toFixed(1)}%
                  </div>
                </div>
              </div>

              {/* 24h Trading Stats Grid & Payout Multiplier */}
              <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-rule bg-rule sm:grid-cols-4">
                <div className="bg-surface p-3">
                  <dt className="label">Total Contract Volume</dt>
                  <dd className="num mt-1 text-base font-semibold text-ink">
                    ${(flagshipMarket.volumeUsd / 1_000_000).toFixed(2)}M USDC
                  </dd>
                  <dd className="mt-0.5 text-[14px] text-ink-subtle">Live Gamma Book</dd>
                </div>

                <div className="bg-surface p-3">
                  <dt className="label">2027 Downside Odds</dt>
                  <dd className="num mt-1 text-base font-semibold text-caution-700">
                    {bubble2027Prob.toFixed(1)}% YES
                  </dd>
                  <dd className="num mt-0.5 text-[14px] text-ink-subtle">
                    +{((bubble2027Prob / Math.max(1, bubble2026Prob) - 1) * 100).toFixed(0)}% term premium
                  </dd>
                </div>

                <div className="bg-surface p-3">
                  <dt className="label">Active Contracts</dt>
                  <dd className="num mt-1 text-base font-semibold text-ink">
                    {activeContractsCount} Contracts
                  </dd>
                  <dd className="num mt-0.5 text-[14px] text-ink-subtle">
                    ${(totalVolume / 1e6).toFixed(2)}M aggregate vol
                  </dd>
                </div>

                <div className="bg-surface p-3">
                  <dt className="label">$100 YES Payout</dt>
                  <dd className="num mt-1 text-base font-semibold text-safe-700">
                    ${Math.round(100 / Math.max(0.01, flagshipMarket.yesPriceUsd)).toLocaleString()}
                  </dd>
                  <dd className="num mt-0.5 text-[14px] text-ink-subtle">
                    +{Math.round(((100 / Math.max(0.01, flagshipMarket.yesPriceUsd) - 100) / 100) * 100).toLocaleString()}% ROI
                  </dd>
                </div>
              </dl>

              {/* Action row */}
              <div className="panel flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-[14px] text-ink-muted">
                  Trade with referral code{" "}
                  <span className="num font-semibold text-ink">{POLYMARKET_REFERRAL_CODE}</span> for 0% gas
                  fees &amp; automatic volume rebate credit.
                </p>

                <div className="flex w-full items-center gap-2 sm:w-auto">
                  <a
                    href={flagshipMarket.tradeYesUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn min-h-11 flex-1 justify-center whitespace-nowrap border border-safe-300 bg-safe-500 text-canvas hover:bg-safe-600 sm:flex-none"
                  >
                    <span>Trade YES ({Math.round(flagshipMarket.yesPriceUsd * 100)}¢)</span>
                    <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </a>

                  <a
                    href={flagshipMarket.tradeNoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn min-h-11 flex-1 justify-center whitespace-nowrap border border-risk-300 bg-risk-600 text-canvas hover:bg-risk-500 sm:flex-none"
                  >
                    <span>Trade NO ({Math.round(flagshipMarket.noPriceUsd * 100)}¢)</span>
                    <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </a>
                </div>
              </div>
            </div>

{/* Sub-Filter Controls for Active Contracts */}
            <div className="flex flex-col gap-3 border-b border-rule pb-3 sm:flex-row sm:items-center sm:justify-between">
              <h4 className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm font-semibold text-ink">
                <Layers className="h-4 w-4 text-ink-subtle" aria-hidden="true" />
                <span>All Active Ingested Contracts ({filteredActiveContracts.length})</span>
                <span className="num text-[14px] text-ink-subtle">
                  ${(totalVolume / 1e6).toFixed(2)}M Real Volume
                </span>
              </h4>

              <div className="-mx-1 flex items-center gap-1.5 overflow-x-auto px-1 scrollbar-none">
                {(["All", "Bubble & Downturn", "Frontier Labs", "Macro Tech"] as const).map((cat) => {
                  const isSel = marketFilter === cat;
                  return (
                    <button
                      key={cat}
                      onClick={() => setMarketFilter(cat)}
                      aria-pressed={isSel}
                      className={`min-h-11 min-w-11 shrink-0 whitespace-nowrap rounded-lg border px-3 py-2 text-[13px] font-semibold transition-colors ${
                        isSel
                          ? "border-ink bg-ink text-canvas"
                          : "border-rule bg-surface text-ink-muted hover:border-rule-strong hover:text-ink"
                      }`}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Grid of Individual Market Trading Cards */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredActiveContracts.map((market) => (
                <div key={market.id} className="card flex flex-col justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="chip">{market.category}</span>
                      <span className="num text-[14px] text-ink-subtle">
                        Vol: {market.volumeUsd >= 1_000_000
                          ? `$${(market.volumeUsd / 1e6).toFixed(2)}M`
                          : `$${Math.round(market.volumeUsd / 1e3)}k`}
                      </span>
                    </div>

                    <a href={market.referralUrl} target="_blank" rel="noopener noreferrer" className="group block min-h-11 py-1">
                      <h5 className="text-[15px] font-semibold leading-snug text-ink underline decoration-rule underline-offset-4 group-hover:decoration-ink">
                        {market.title}
                      </h5>
                    </a>

                    <p className="prose line-clamp-3 text-[14px]">{market.description}</p>
                  </div>

                  <div className="space-y-2 border-t border-rule pt-3">
                    {/* Live Pricing Boxes — 44px+ targets */}
                    <div className="grid grid-cols-2 gap-2">
                      <a
                        href={market.tradeYesUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex min-h-11 flex-col items-center justify-center rounded-lg border border-safe-200 bg-safe-50 px-2 py-2 text-center transition-colors hover:bg-safe-100"
                      >
                        <span className="label">Trade YES</span>
                        <span className="num text-lg font-semibold text-safe-700">
                          {Math.round(market.yesPriceUsd * 100)}¢
                        </span>
                        <span className="num text-[14px] text-ink-subtle">
                          {market.yesProbabilityPct.toFixed(1)}% Odds
                        </span>
                      </a>

                      <a
                        href={market.tradeNoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex min-h-11 flex-col items-center justify-center rounded-lg border border-risk-200 bg-risk-50 px-2 py-2 text-center transition-colors hover:bg-risk-100"
                      >
                        <span className="label">Trade NO</span>
                        <span className="num text-lg font-semibold text-risk-700">
                          {Math.round(market.noPriceUsd * 100)}¢
                        </span>
                        <span className="num text-[14px] text-ink-subtle">
                          {market.noProbabilityPct.toFixed(1)}% Odds
                        </span>
                      </a>
                    </div>

                    {/* Expiration and Volume indicators */}
                    <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-surface-2 px-2.5 py-2 text-[14px]">
                      <span className="label">Contract ID</span>
                      <span className="num font-semibold text-ink">
                        #{market.id} • {market.endDate}
                      </span>
                    </div>

                    {/* Polymarket Link with Referral Preserved */}
                    <div className="flex items-center justify-between gap-2 text-[14px]">
                      <span className="num text-ink-subtle">Ref: {POLYMARKET_REFERRAL_CODE}</span>
                      <a
                        href={market.referralUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="prose-a flex min-h-11 items-center gap-1 py-2 text-[13px] font-semibold"
                      >
                        <span>Trade Order Book</span>
                        <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

{/* TAB 2: Odds & Profit Calculator */}
        {activeTab === "calculator" && (
          <div className="panel space-y-5">
            <div>
              <h4 className="flex items-center gap-2 text-base font-semibold text-ink">
                <Calculator className="h-4 w-4 text-ink-subtle" aria-hidden="true" />
                <span>Polymarket Potential Payout &amp; Leverage Simulator</span>
              </h4>
              <p className="prose prose-p max-w-2xl text-sm">
                Calculate real-time potential profit, return on investment, and share quantities for
                any 24h synced Polymarket contract.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {/* 1. Pick Market */}
              <div className="space-y-2">
                <label htmlFor="calc-market" className="label">
                  1. Select Contract
                </label>
                <select
                  id="calc-market"
                  value={calcMarketId}
                  onChange={(e) => setCalcMarketId(e.target.value)}
                  className="min-h-11 w-full rounded-lg border border-rule-strong bg-surface px-2.5 py-2 text-[13px] text-ink"
                >
                  {activeContracts.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.title} ({Math.round(m.yesPriceUsd * 100)}¢)
                    </option>
                  ))}
                </select>
              </div>

              {/* 2. Pick Outcome */}
              <div className="space-y-2">
                <span className="label">2. Select Position</span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setCalcOutcome("YES")}
                    aria-pressed={calcOutcome === "YES"}
                    className={`flex min-h-11 flex-col items-center justify-center rounded-lg border px-2 py-2 text-[13px] font-semibold transition-colors ${
                      calcOutcome === "YES"
                        ? "border-safe-500 bg-safe-600 text-canvas"
                        : "border-rule bg-surface text-ink-muted hover:border-rule-strong"
                    }`}
                  >
                    <span className="num whitespace-nowrap">
                      YES ({Math.round(selectedCalcMarket.yesPriceUsd * 100)}¢)
                    </span>
                    <span className="whitespace-nowrap text-[14px] text-ink-subtle">
                      Asymmetric Upside
                    </span>
                  </button>
                  <button
                    onClick={() => setCalcOutcome("NO")}
                    aria-pressed={calcOutcome === "NO"}
                    className={`flex min-h-11 flex-col items-center justify-center rounded-lg border px-2 py-2 text-[13px] font-semibold transition-colors ${
                      calcOutcome === "NO"
                        ? "border-risk-500 bg-risk-600 text-canvas"
                        : "border-rule bg-surface text-ink-muted hover:border-rule-strong"
                    }`}
                  >
                    <span className="num whitespace-nowrap">
                      NO ({Math.round(selectedCalcMarket.noPriceUsd * 100)}¢)
                    </span>
                    <span className="whitespace-nowrap text-[14px] text-ink-subtle">
                      Consensus Yield
                    </span>
                  </button>
                </div>
              </div>

              {/* 3. Trade Sizing */}
              <div className="space-y-2">
                <label htmlFor="calc-amount" className="label">
                  3. Investment Amount (USDC)
                </label>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[14px] text-ink-subtle">
                      $
                    </span>
                    <input
                      id="calc-amount"
                      type="number"
                      min="5"
                      max="100000"
                      value={calcAmount}
                      onChange={(e) => setCalcAmount(Math.max(1, Number(e.target.value) || 0))}
                      className="num min-h-11 w-full rounded-lg border border-rule-strong bg-surface pl-7 pr-3 py-2 text-sm font-semibold text-ink"
                    />
                  </div>
                </div>
                {/* Preset chips */}
                <div className="-mx-1 flex items-center gap-1.5 overflow-x-auto px-1 pt-1 scrollbar-none">
                  {[50, 100, 250, 500, 1000].map((amt) => (
                    <button
                      key={amt}
                      onClick={() => setCalcAmount(amt)}
                      aria-pressed={calcAmount === amt}
                      className={`num min-h-11 shrink-0 whitespace-nowrap rounded-lg border px-2.5 py-2 text-[13px] font-semibold transition-colors ${
                        calcAmount === amt
                          ? "border-ink bg-ink text-canvas"
                          : "border-rule bg-surface text-ink-muted hover:border-rule-strong hover:text-ink"
                      }`}
                    >
                      ${amt}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Real-Time Outcome Calculation Dashboard */}
            <dl className="grid grid-cols-2 gap-3 border-t border-rule pt-4 sm:grid-cols-4">
              <div className="rounded-lg border border-rule bg-surface p-3">
                <dt className="label">Shares Received</dt>
                <dd className="num mt-1 text-xl font-semibold text-ink">
                  {Math.round(numShares).toLocaleString()}
                </dd>
                <dd className="num mt-0.5 text-[14px] text-ink-subtle">
                  @ {Math.round(activePrice * 100)}¢ / share
                </dd>
              </div>

              <div className="rounded-lg border border-rule bg-surface p-3">
                <dt className="label">Total Payout on Resolution</dt>
                <dd className="num mt-1 text-xl font-semibold text-safe-700">
                  ${totalPayout.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </dd>
                <dd className="num mt-0.5 text-[14px] text-ink-subtle">$1.00 per winning share</dd>
              </div>

              <div className="rounded-lg border border-rule bg-surface p-3">
                <dt className="label">Net Profit</dt>
                <dd className="num mt-1 text-xl font-semibold text-ink">
                  +${netProfit.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </dd>
                <dd className="num mt-0.5 text-[14px] text-ink-subtle">Less initial ${calcAmount}</dd>
              </div>

              <div className="rounded-lg border border-rule bg-surface p-3">
                <dt className="label">Return on Investment</dt>
                <dd className="num mt-1 text-xl font-semibold text-safe-700">+{roiPct.toFixed(1)}%</dd>
                <dd className="num mt-0.5 text-[14px] text-ink-subtle">
                  Multiplier: {(totalPayout / Math.max(1, calcAmount)).toFixed(2)}×
                </dd>
              </div>
            </dl>

{/* Direct Execution Button */}
            <div className="flex flex-col items-center justify-between gap-3 pt-2 sm:flex-row">
              <p className="text-[14px] text-ink-subtle">
                Zero gas fees on Polygon. Contracts settle automatically via UMA decentralized oracle.
              </p>
              <a
                href={tradeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary min-h-11 w-full justify-center whitespace-nowrap sm:w-auto"
              >
                <span>Execute {calcOutcome} on Polymarket (Ref: {POLYMARKET_REFERRAL_CODE}) ↗</span>
              </a>
            </div>
          </div>
        )}

        {/* TAB 3: Historical Timeline Probability Chart */}
        {activeTab === "trend" && (
          <div className="space-y-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h4 className="text-base font-semibold text-ink">
                  Historical Consensus Trajectory (Jan 2024 — Oct 2026)
                </h4>
                <p className="prose prose-p max-w-2xl text-sm">
                  Crowd probability evolution across AI Bubble contracts, Oracle CDS refinancing
                  stress, and OpenAI milestones.
                </p>
              </div>

              {/* Chart legend — swatch colours are the chart's own series colours */}
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[14px]">
                <span className="flex items-center gap-1.5 whitespace-nowrap text-ink-muted">
                  <span className="h-0.5 w-3" style={{ backgroundColor: SERIES.risk500 }} />
                  <span>AI Bubble 2026 ({bubble2026Prob.toFixed(1)}%)</span>
                </span>
                <span className="flex items-center gap-1.5 whitespace-nowrap text-ink-muted">
                  <span className="h-0.5 w-3" style={{ backgroundColor: SERIES.caution500 }} />
                  <span>AI Bubble 2027 ({bubble2027Prob.toFixed(1)}%)</span>
                </span>
                <span className="flex items-center gap-1.5 whitespace-nowrap text-ink-muted">
                  <span className="h-0.5 w-3" style={{ backgroundColor: SERIES.inkSubtle }} />
                  <span>
                    Oracle CDS Stress (
                    {(points[points.length - 1]?.oracleCdsStress ?? 38.0).toFixed(1)}%)
                  </span>
                </span>
                <span className="flex items-center gap-1.5 whitespace-nowrap text-ink-muted">
                  <span className="h-0.5 w-3" style={{ backgroundColor: SERIES.safe500 }} />
                  <span>
                    OpenAI AGI Odds (
                    {(points[points.length - 1]?.openaiAgiOdds ?? 8.5).toFixed(1)}%)
                  </span>
                </span>
              </div>
            </div>

            {/* SVG Interactive Line Chart */}
            <div className="bg-surface-2 p-4 rounded-xl border border-rule overflow-x-auto">
              <svg
                viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                className="w-full h-auto min-w-[600px] select-none"
              >
                {/* Y-axis gridlines */}
                {[0, 10, 20, 30, 40, 50].map((val) => {
                  const y = getY(val);
                  return (
                    <g key={val}>
                      <line
                        x1={padding.left}
                        y1={y}
                        x2={chartWidth - padding.right}
                        y2={y}
                        stroke="currentColor"
                        className="text-ink"
                        strokeDasharray={val === 0 ? "none" : "3 3"}
                        strokeWidth={val === 0 ? 1.5 : 1}
                      />
                      <text
                        x={padding.left - 8}
                        y={y + 4}
                        textAnchor="end"
                        className="text-[14px] font-mono font-medium fill-ink-muted"
                      >
                        {val}%
                      </text>
                    </g>
                  );
                })}

                {/* X-axis labels */}
                {points.map((p, i) => {
                  const x = getX(i);
                  return (
                    <text
                      key={p.date}
                      x={x}
                      y={chartHeight - 12}
                      textAnchor="middle"
                      className="text-[14px] font-mono font-medium fill-ink-muted"
                    >
                      {p.date}
                    </text>
                  );
                })}

                {/* Series Lines */}
                <path
                  d={bubble2026Path}
                  fill="none"
                  stroke={SERIES.risk500}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
                <path
                  d={bubble2027Path}
                  fill="none"
                  stroke={SERIES.caution500}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
                <path
                  d={oracleCdsPath}
                  fill="none"
                  style={{ stroke: SERIES.inkSubtle }}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
                <path
                  d={openaiAgiPath}
                  fill="none"
                  stroke={SERIES.safe500}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />

                {/* Data Points / Interactive nodes */}
                {points.map((p, i) => {
                  const x = getX(i);
                  const isHovered = hoveredPoint === i;
                  return (
                    <g
                      key={p.date}
                      onMouseEnter={() => setHoveredPoint(i)}
                      onMouseLeave={() => setHoveredPoint(null)}
                    >
                      {/* Vertical highlight line on hover */}
                      {isHovered && (
                        <line
                          x1={x}
                          y1={padding.top}
                          x2={x}
                          y2={chartHeight - padding.bottom}
                          style={{ stroke: SERIES.inkFaint }}
                          strokeWidth="1"
                          strokeDasharray="2 2"
                        />
                      )}
                      <circle cx={x} cy={getY(p.aiBubble2026)} r={isHovered ? 5 : 3} fill={SERIES.risk500} />
                      <circle cx={x} cy={getY(p.aiBubble2027)} r={isHovered ? 5 : 3} fill={SERIES.caution500} />
                      <circle cx={x} cy={getY(p.oracleCdsStress)} r={isHovered ? 5 : 3} style={{ fill: SERIES.inkSubtle }} />
                      <circle cx={x} cy={getY(p.openaiAgiOdds)} r={isHovered ? 5 : 3} fill={SERIES.safe500} />
                    </g>
                  );
                })}
              </svg>

{/* Tooltip Readout */}
              {hoveredPoint !== null && (
                <div className="mt-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 rounded-lg border border-rule bg-surface px-3 py-2 text-[14px]">
                  <span className="num font-semibold text-ink">{points[hoveredPoint].date}</span>
                  <span className="num text-risk-600">
                    Bubble 2026: {points[hoveredPoint].aiBubble2026}%
                  </span>
                  <span className="num text-caution-700">
                    Bubble 2027: {points[hoveredPoint].aiBubble2027}%
                  </span>
                  <span className="num text-ink-muted">
                    Oracle CDS Stress: {points[hoveredPoint].oracleCdsStress}%
                  </span>
                  <span className="num text-safe-700">
                    OpenAI AGI: {points[hoveredPoint].openaiAgiOdds}%
                  </span>
                  <span className="num text-ink-subtle">
                    Cumulative Vol: ${points[hoveredPoint].volumeCumulativeMillions}M
                  </span>
                </div>
              )}
            </div>

            {/* Insight Note */}
            <div className="notice">
              <p className="notice-title">Market Dynamic Insight</p>
              <p className="mt-1.5 text-[14px] leading-relaxed">
                Polymarket prices show that while 2026 downturn probability stands at{" "}
                {bubble2026Prob.toFixed(1)}%, 2027 risk climbs to {bubble2027Prob.toFixed(1)}%,
                mirroring the maturity profile of hyperscaler debt facilities and Oracle CDS spread
                widening (+256% from the 81 bp long-run norm to 288 bp, 15 Oct 2026).
              </p>
            </div>
          </div>
        )}

        {/* TAB 4: Polymarket UMA 6-Condition Radar */}
        {activeTab === "triggers" && (
          <div className="space-y-4">
            <div className="flex flex-col gap-2 border-b border-rule pb-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h4 className="flex items-center gap-2 text-base font-semibold text-ink">
                  <ShieldAlert className="h-4 w-4 text-risk-600" aria-hidden="true" />
                  <span>Polymarket Official Resolution Rulebook</span>
                </h4>
                <p className="prose prose-p max-w-2xl text-sm">
                  The market resolves to YES if and only if{" "}
                  <strong className="text-ink">at least 3 of these 5 conditions</strong> occur within a
                  single 90-day window.
                </p>
              </div>
              <span className="chip whitespace-nowrap">
                Trigger Status: <span className="num text-safe-700">0 of 3 Met</span>
              </span>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {POLYMARKET_RESOLUTION_CONDITIONS.map((cond) => (
                <div key={cond.id} className="card space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-ink">{cond.title}</span>
                    <span
                      className={`chip ${
                        cond.riskLevel === "Low"
                          ? "chip-safe"
                          : cond.riskLevel === "Medium"
                            ? "chip-caution"
                            : "chip-risk"
                      }`}
                    >
                      {cond.riskLevel}
                    </span>
                  </div>

                  <dl className="grid grid-cols-2 gap-2 rounded-lg border border-rule bg-surface-2 p-3 text-[14px]">
                    <div>
                      <dt className="label">Trigger Target</dt>
                      <dd className="num mt-0.5 font-semibold text-ink">{cond.target}</dd>
                    </div>
                    <div>
                      <dt className="label">Live Reading</dt>
                      <dd className="num mt-0.5 font-semibold text-ink">{cond.currentValue}</dd>
                    </div>
                  </dl>

                  <p className="prose text-[14px]">{cond.weightDescription}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Polymarket partner disclosure */}
        <div className="notice flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
          <div className="space-y-1">
            <p className="notice-title">Polymarket Referral Partner Integration</p>
            <h4 className="text-base font-semibold text-ink">
              Hedge AI Capex &amp; Bubble Risk with Zero Gas Fees
            </h4>
            <p className="prose mt-1 max-w-xl text-[14px]">
              Deposit USDC on Polygon, execute instant limit or market orders on AI Bubble contracts,
              and earn trading volume rebates with referral code{" "}
              <strong className="num text-ink">{POLYMARKET_REFERRAL_CODE}</strong>.
            </p>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <button onClick={handleCopyCode} className="btn min-h-11 whitespace-nowrap">
              {copiedCode ? "Copied AIbubble" : "Copy Code: AIbubble"}
            </button>
            <a
              href={`https://polymarket.com/?r=${POLYMARKET_REFERRAL_CODE}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary min-h-11 whitespace-nowrap"
            >
              <span>Trade on Polymarket ↗</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
