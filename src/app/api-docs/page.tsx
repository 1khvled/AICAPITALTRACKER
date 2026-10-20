"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Code2,
  Play,
  Copy,
  Check,
  Terminal,
  ExternalLink,
  ShieldCheck,
  Database,
  Layers,
  ArrowRight,
  Sparkles,
  Zap,
  Globe,
  Clock,
  CheckCircle2,
  RefreshCw,
  Server,
  FileCode,
} from "lucide-react";
import { AdSlot } from "@/components/AdSlot";
import { evaluateBubbleModel, DEFAULT_MODEL_INPUTS } from "@/lib/model/engine";
import { MODEL_FACTORS, MODEL_VERSION, SUM_RISK_WEIGHT_PCT, DAMPER_WEIGHT_PCT } from "@/lib/model/factors";
import latestModel from "@/data/latest-model.json";

/**
 * Canonical site origin — the same expression the root layout uses for
 * metadata, canonical URLs, the sitemap and robots.txt. NEXT_PUBLIC_* values
 * are inlined at build time, so this resolves in the browser bundle too.
 */
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://aicapitaltracker.com";

/**
 * The documented sample response is generated from the SAME inputs the
 * /api/v1/model route uses (src/data/live-inputs.json via DEFAULT_MODEL_INPUTS),
 * so the reference can never drift from the endpoint. The route is force-static:
 * the payload is rebuilt on deploy from the last 24-hour sync, it is not a live
 * feed. `generatedAt` carries the published pipeline snapshot timestamp
 * (src/data/latest-model.json).
 */
const liveModel = evaluateBubbleModel(DEFAULT_MODEL_INPUTS);

const liveTopContributions = liveModel.contributions
  .filter((c) => c.kind === "risk")
  .sort((a, b) => b.earnedPoints - a.earnedPoints)
  .slice(0, 3)
  .map((c) => ({
    id: c.id,
    label: c.label,
    weightPct: c.weightPct,
    earnedPoints: c.earnedPoints,
    reading: {
      score: c.reading.score,
      reading: c.reading.reading,
      coverage: c.reading.coverage,
    },
  }));

interface EndpointDoc {
  id: string;
  name: string;
  method: "GET" | "POST";
  path: string;
  badge: string;
  description: string;
  params?: { name: string; type: string; required: boolean; defaultVal?: string; desc: string }[];
  defaultQuery?: string;
  sampleResponse: any;
}

const ENDPOINTS: EndpointDoc[] = [
  {
    id: "model",
    name: "Daily Snapshot: Bubble Probability & Factors",
    method: "GET",
    path: "/api/v1/model",
    badge: "Rebuilt On Deploy",
    description: "Returns the 12-month empirical bubble burst probability, composite stress score (0-100), the published input-sensitivity range (not a probability interval), financial fragility index, systemic contagion synergy, and the breakdown of all 9 factor contributions. The route is force-static: the payload is a daily snapshot rebuilt on deploy from the last 24-hour sync, not a live feed. The sample below is that daily snapshot, in the route's own wire format; use the Live Response tab for the exact payload.",
    defaultQuery: "",
    params: [
      { name: "format", type: "string", required: false, defaultVal: "full", desc: "Response verbosity. The current build always returns the full payload; 'summary' is accepted and ignored (forward-compatible)." },
    ],
    sampleResponse: {
      success: true,
      data: {
        timestamp: latestModel.timestamp,
        model_version: MODEL_VERSION,
        modelVersion: MODEL_VERSION,
        horizon_months: liveModel.horizonMonths,
        burst_probability_pct: liveModel.burstProbability,
        composite_score: liveModel.compositeScore,
        risk_band: liveModel.band,
        data_coverage_pct: Math.round(liveModel.coverage * 100),
        coverage_label: `risk-factor coverage (${SUM_RISK_WEIGHT_PCT} risk points across ${MODEL_FACTORS.filter((f) => f.kind === "risk").length} risk factors); the real-use damper (max −${DAMPER_WEIGHT_PCT} pts) is reported separately and is not part of the risk scale`,
        damper_coverage_pct: Math.round(liveModel.damperCoverage * 100),
        ci_type: latestModel.monteCarlo.ciType,
        input_sensitivity_range: {
          ci_type: latestModel.monteCarlo.ciType,
          ci90_pct: latestModel.monteCarlo.ci90Pct,
          ci95_pct: latestModel.monteCarlo.ci95Pct,
          band_low_pct: latestModel.monteCarlo.bandLowPct,
          iterations: latestModel.monteCarlo.iterationsCount,
          source: "25,000-path Monte Carlo input-sensitivity quantiles (src/data/latest-model.json)",
        },
        financial_fragility_index: liveModel.fragilityIndex,
        financial_fragility_index_basis: liveModel.fragilityIndexBasis,
        systemic_contagion_points: liveModel.systemicContagionPoints,
        top_driver_ids: liveModel.topDriverIds,
        calibration: {
          anchor_score: 55,
          logistic_steepness: 9,
          formula: "P(burst) = 1 / (1 + exp(-(Score - 55) / 9))",
        },
        contributions: liveTopContributions,
        inputs_summary: {
          oracle_cds_5y_bps: DEFAULT_MODEL_INPUTS.cds?.currentBps,
          median_lab_ps_multiple: 29.4,
          debt_share_pct: Math.round((DEFAULT_MODEL_INPUTS.ledger?.debtShare || 0) * 1000) / 10,
          total_tracked_debt_usd: DEFAULT_MODEL_INPUTS.aiDebt?.totalTrackedDebtUsd ?? 214_890_400_000,
          annual_debt_issuance_usd: DEFAULT_MODEL_INPUTS.aiDebt?.annualDebtIssuanceUsd ?? 85_000_000_000,
          us10y_treasury_yield_pct: DEFAULT_MODEL_INPUTS.macro?.us10yYieldPct ?? 5.1,
          cpi_inflation_yoy_pct: DEFAULT_MODEL_INPUTS.macro?.cpiInflationYoY ?? 3.72,
          fed_funds_rate_pct: DEFAULT_MODEL_INPUTS.macro?.fedFundsRatePct ?? 3.75,
          high_yield_spread_bps: DEFAULT_MODEL_INPUTS.macro?.highYieldSpreadBps ?? 323,
          capex_to_ocf_ratio_pct: Math.round((DEFAULT_MODEL_INPUTS.aiDebt?.capexToOcfRatio ?? 0.548) * 1000) / 10,
          token_price_decline_multiple: DEFAULT_MODEL_INPUTS.adoption?.apiPriceDeclineMultiple,
          token_price_decline_multiple_pinned: 670,
          polymarket_yes_probability: DEFAULT_MODEL_INPUTS.crowd?.yesProbability,
        },
      },
    },
  },
  {
    id: "deals",
    name: "Verified Deal Ledger",
    method: "GET",
    path: "/api/v1/deals",
    badge: "$2.87T Superstructure",
    description: "Queries verified capital commitments and debt facilities from the AI capital ledger. Supports full-text search, category tagging, debt isolation, and pagination.",
    defaultQuery: "?limit=2&category=Borrowed",
    params: [
      { name: "search", type: "string", required: false, desc: "Search title, description, or counterparties (e.g., 'Anthropic', 'Oracle', 'Blackstone')" },
      { name: "category", type: "string", required: false, defaultVal: "All", desc: "Filter by category: 'Borrowed', 'Bets & rounds', 'Compute contracts', 'Data center campuses', 'Corporate power & energy'" },
      { name: "debt_only", type: "boolean", required: false, defaultVal: "false", desc: "When true, isolates only debt, convertible notes, and GPU asset-backed credit facilities" },
      { name: "limit", type: "integer", required: false, defaultVal: "50", desc: "Number of records per page (max: 200)" },
      { name: "page", type: "integer", required: false, defaultVal: "1", desc: "Page index (1-based)" },
      { name: "sort", type: "string", required: false, defaultVal: "newest", desc: "Sort order: 'newest' or 'biggest'" }
    ],
    sampleResponse: {
      success: true,
      total: 169,
      page: 1,
      limit: 2,
      totalPages: 85,
      summary: {
        totalDisclosedUsd: 2872873160000,
        totalDebtUsd: 214890400000,
        debtSharePct: 7.5
      },
      deals: [
        {
          id: "deal-002",
          date: "28 Sep 2026",
          entity: "Anthropic",
          counterparty: "Broadcom",
          amountUsd: 42000000000,
          category: "Borrowed",
          structure: "Convertible Note & TPU Underwriting",
          hasDebt: true,
          verifiedSource: "Form S-1 Confidential Filing & Indenture Disclosures",
          summary: "Anthropic's S-1 prospectus revealed Broadcom agreed to lend Anthropic up to $42.0B in convertible notes, funding roughly one-third of Anthropic's five-year, $125.2B TPU compute lease commitment."
        },
        {
          id: "deal-018",
          date: "24 Mar 2026",
          entity: "CoreWeave",
          counterparty: "Blackstone Credit & Insurance + JPMorgan, Morgan Stanley, MUFG",
          amountUsd: 8500000000,
          category: "Borrowed",
          structure: "Delayed Draw Term Loan (DDTL 4.0)",
          hasDebt: true,
          verifiedSource: "Credit Agreement Filed with SEC",
          summary: "CoreWeave closes an $8.5B investment-grade delayed draw credit facility collateralized by GPU compute contracts."
        }
      ]
    }
  },
  {
    id: "factors",
    name: "Mathematical Factors & Weights",
    method: "GET",
    path: "/api/v1/factors",
    badge: "Formulas & Anchors",
    description: "Returns the complete mathematical specification, logistic calibration anchors (anchorScore = 55, steepness = 9), and published weights for all 9 model factors.",
    defaultQuery: "",
    params: [],
    sampleResponse: {
      success: true,
      calibration: {
        anchor_score: 55,
        steepness: 9,
        sigmoid_formula: "P(burst) = 1 / (1 + exp(-(Score - anchorScore) / steepness))",
      },
      // 2026-10-19 (wave 2): the sample is generated from the live MODEL_FACTORS
      // definitions — the same strings /api/v1/factors returns — so it can never
      // publish a formula the engine does not use.
      factors: MODEL_FACTORS.map((f, idx) => ({
        index: idx + 1,
        id: f.id,
        label: f.label,
        kind: f.kind,
        weight_pct: f.weightPct,
        formula: f.formula,
        description: f.explain,
      })),
    },
  },
  {
    id: "news",
    name: "Intelligence Wire & Market Filings",
    method: "GET",
    path: "/api/v1/news",
    // 2026-10-19 (round-2 consolidation): the badge claimed a LIVE wire updated "in real time".
    // /api/v1/news serves src/data/live-news.json — the same dated daily snapshot the /news page
    // renders, written once by the 00:00 UTC ingestion run. Relabelled to say what it actually is.
    badge: "Daily Regulatory Wire",
    description:
      "Serves the daily research snapshot: verified market intelligence, Form 8-K/S-1 regulatory filings, debt syndication announcements, and CDS repricing events collected by the 00:00 UTC ingestion run. The payload is a dated snapshot (src/data/live-news.json), refreshed once per day — it is not a real-time feed, and the endpoint never invents a fresher headline.",
    defaultQuery: "",
    params: [
      { name: "category", type: "string", required: false, desc: "Filter by topic: 'Debt & Credit', 'Frontier Labs', 'Hyperscalers', 'Silicon & Power'" },
      { name: "impact", type: "string", required: false, desc: "Filter by materiality: 'High Impact', 'Material Filing', 'Market Sentiment'" },
    ],
    sampleResponse: {
      success: true,
      source: "Verified Primary Intelligence Wire",
      updatedAt: "2026-10-18T17:28:40.000Z",
      count: 6,
      news: [
        {
          id: "news-1",
          title: "Anthropic Moves Toward Record IPO Following 300-Page Prospectus Review Showing $4.6B Revenue Run-Rate",
          publisher: "Reuters",
          link: "https://www.reuters.com/technology/anthropic-ipo-filing-review-2026-10-18/",
          publishedAt: "2026-10-18T17:10:40.000Z",
          timeAgo: "18m ago",
          category: "Frontier Labs",
          impact: "High Impact",
          summary: "Anthropic confidential Form S-1 filing shows nearly $4.6B annualized run-rate, $42B cumulative compute losses, and $518B in coming cloud infrastructure commitments."
        },
        {
          id: "news-2",
          title: "Oracle 5-Year CDS Default Swaps Widen to 288bps as Fixed-Income Investors Price Hyperscaler Debt Burden",
          publisher: "Bloomberg Markets",
          link: "https://www.bloomberg.com/news/articles/2026-10-18/oracle-cds-spreads-debt-saturation",
          publishedAt: "2026-10-18T16:46:40.000Z",
          timeAgo: "42m ago",
          category: "Debt & Credit",
          impact: "Material Filing",
          summary: "Credit default swap insurance on Oracle senior notes trades at a record 288 basis points (record close Oct 15, 2026; +256% vs the 81bp baseline), tracking $130.1B of total Oracle borrowings (10-K, FY2026 year-end)."
        }
      ]
    }
  },
  {
    id: "sync",
    name: "24h Autonomous Workflow Telemetry",
    method: "GET",
    path: "/api/v1/sync",
    badge: "24h Pipeline Protocol",
    description: "Delivers live operational telemetry, execution health, data freshness, and ingestion audit logs for the autonomous 24-hour quantitative pipeline. Reports the state of the OpenRouter, Polymarket, Yahoo Finance, and SEC EDGAR feeds; the ingestion cycle itself runs once a day at 00:00 UTC.",
    defaultQuery: "",
    params: [
      { name: "limit", type: "integer", required: false, defaultVal: "5", desc: "Number of historical 24h cron execution audit logs to return (max: 30)." },
    ],
    sampleResponse: {
      success: true,
      data: {
        status: "HEALTHY",
        pipeline: "autonomous_quantitative_engine",
        schedule: "0 0 * * * (Daily at 00:00 UTC)",
        last_sync_timestamp: "2026-10-18T21:38:15.716Z",
        next_scheduled_run: "2026-10-19T00:00:00.000Z",
        freshness_status: "OPTIMAL",
        minutes_since_last_sync: 48,
        hours_since_last_sync: 0.8,
        sync_mode: "autonomous_24h_telemetry",
        active_pipelines: [
          {
            id: "openrouter",
            name: "OpenRouter Public Models Pricing API",
            endpoint: "https://openrouter.ai/api/v1/models",
            status: "ONLINE",
            metric: "670× token deflation multiple vs early-2023 GPT-4 input benchmark ($30 → $0.0448 per 1M input, OpenRouter live Oct 19 2026)",
            target: "Real-demand damper (-10 pts max)"
          },
          {
            id: "polymarket",
            name: "Polymarket Gamma Events API",
            endpoint: "https://gamma-api.polymarket.com/events",
            status: "ONLINE",
            metric: "9.05% 2026 bubble burst odds ($9.17M active volume across 16 markets)",
            target: "Crowd consensus risk factor"
          },
          {
            id: "yahoo_finance",
            name: "Yahoo Finance ORCL Market Stream",
            endpoint: "https://query1.finance.yahoo.com/v8/finance/chart/ORCL",
            status: "ONLINE",
            metric: "288 bps Oracle 5Y CDS proxy anchor (record close Oct 15 2026, vs 81bp baseline)",
            target: "Fixed-income credit thermometer"
          },
          {
            id: "sec_edgar",
            name: "SEC EDGAR Automated Submissions",
            endpoint: "https://data.sec.gov/submissions/CIK0001341439.json",
            status: "ONLINE",
            metric: "Oracle Form 8-K / 10-Q & Anthropic S-1 debt filings verified",
            target: "Audited legal receipts (Axiom 1)"
          },
          {
            id: "deal_ledger",
            name: "Verified Primary Capital Ledger",
            endpoint: "src/data/deals.json",
            status: "ONLINE",
            metric: "169 deals ($2.87T volume, 7.5% debt share, 24 debt facilities)",
            target: "Deterministic balance sheet aggregates"
          }
        ],
        recalibrated_models: [
          "Merton Structural Distance-to-Default (5.13σ, default prob: <0.01%)",
          "Altman Z''-Score Tech Classifier (8.41 Safe Zone)",
          "Sornette LPPLS Bubble Singularity (hazard index 81.5 — an index, not a probability, critical window: Q4 2026 - Q2 2027)",
          // 2026-10-19 (wave 2): the VaR pair is re-published from the current
          // artifact (src/data/latest-model.json): VaR95 84.6%, VaR99 92.9%.
          "25,000-Path Monte Carlo Cholesky Copula (VaR95 84.6%, VaR99 92.9%)"
        ],
        // DATED HISTORY — these are the values each past sync actually recorded
        // (19 Oct 2026 00:57Z and 18 Oct 2026 21:38Z). They are intentionally NOT
        // restated to the current calibration: this block is the audit record.
        recent_sync_history: [
          {
            timestamp: "2026-10-19T00:57:21.595Z",
            status: "SUCCESS",
            token_decline_multiple: "24x",
            polymarket_yes_prob: 0.078,
            disclosed_volume_usd: 2858307802026,
            debt_share_pct: "8.0%",
            deals_count: 169
          },
          {
            timestamp: "2026-10-18T21:38:15.717Z",
            status: "SUCCESS",
            token_decline_multiple: "25x",
            polymarket_yes_prob: 0.103,
            disclosed_volume_usd: 2858307802026,
            debt_share_pct: "8.0%",
            deals_count: 169
          }
        ]
      }
    }
  }
];

function highlightJsonToHtml(json: any): string {
  const str = typeof json === "string" ? json : JSON.stringify(json, null, 2);
  const escaped = str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return escaped.replace(
    /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
    (match) => {
      let cls = "text-ink"; // number
      if (/^"/.test(match)) {
        if (/:$/.test(match)) {
          cls = "text-ink font-semibold"; // key
        } else {
          cls = "text-safe-700"; // string
        }
      } else if (/true|false/.test(match)) {
        cls = "text-caution-700 font-bold"; // boolean
      } else if (/null/.test(match)) {
        cls = "text-ink-faint italic"; // null
      }
      return `<span class="${cls}">${match}</span>`;
    }
  );
}

export default function ApiDocsPage() {
  const [activeEndpoint, setActiveEndpoint] = useState<EndpointDoc>(ENDPOINTS[0]);
  const [queryInput, setQueryInput] = useState<string>(activeEndpoint.defaultQuery || "");
  const [loading, setLoading] = useState<boolean>(false);
  const [responseJson, setResponseJson] = useState<any | null>(null);
  const [statusCode, setStatusCode] = useState<number | null>(null);
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [codeLanguage, setCodeLanguage] = useState<"curl" | "js" | "python">("curl");
  const [responseViewMode, setResponseViewMode] = useState<"live" | "sample">("sample");

  const selectEndpoint = (ep: EndpointDoc) => {
    setActiveEndpoint(ep);
    setQueryInput(ep.defaultQuery || "");
    setResponseJson(null);
    setStatusCode(null);
    setLatencyMs(null);
    setResponseViewMode("sample");
  };

  const executeLiveRequest = async () => {
    setLoading(true);
    setResponseJson(null);
    const start = performance.now();
    try {
      const url = `${activeEndpoint.path}${queryInput}`;
      const res = await fetch(url);
      const end = performance.now();
      setLatencyMs(Math.round(end - start));
      setStatusCode(res.status);
      const data = await res.json();
      setResponseJson(data);
      setResponseViewMode("live");
    } catch (err: any) {
      setStatusCode(500);
      setResponseJson({ error: err.message || "Failed to execute fetch request" });
      setResponseViewMode("live");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const fullUrl = `${SITE_URL}${activeEndpoint.path}${queryInput}`;

  const getCurlCommand = () => {
    return `curl -X GET "${fullUrl}" \\\n -H "Accept: application/json"`;
  };

  const getCodeSnippet = () => {
    if (codeLanguage === "curl") {
      return getCurlCommand();
    } else if (codeLanguage === "js") {
      return `// JavaScript / TypeScript Fetch
const res = await fetch("${fullUrl}", {
  headers: { "Accept": "application/json" }
});
const data = await res.json();
console.log(data);`;
    } else {
      return `# Python 3 with requests
import requests

url = "${fullUrl}"
headers = {"Accept": "application/json"}

response = requests.get(url, headers=headers)
data = response.json()
print(data)`;
    }
  };

  const displayedJson = responseViewMode === "live" && responseJson !== null
    ? responseJson
    : activeEndpoint.sampleResponse;

return (
    <div className="section-sm">
      {/* Top banner ad */}
      <AdSlot placementId="api-docs-top" />

      {/* Page head */}
      <header className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
          <span className="label">API documentation</span>
          <span className="pill">REST v1.2</span>
          <span className="pill pill-safe">{ENDPOINTS.length} endpoints, no key</span>
        </div>

        <h1 className="max-w-reading text-3xl font-bold tracking-tight text-ink sm:text-4xl">
          AI Capital Tracker Public API Explorer
        </h1>

        <p className="prose prose-lead max-w-reading">
          Programmatic REST access to the quantitative model engine, $2.87T deal ledger, factor formulas,
          and live regulatory filings. Sourced directly from audited SEC filings.
        </p>
      </header>

      {/* Specs */}
      <dl className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-rule bg-rule md:grid-cols-4">
        <div className="bg-surface p-3">
          <dt className="label flex items-center gap-1.5">
            <Server className="h-3.5 w-3.5" aria-hidden="true" />
            Architecture
          </dt>
          <dd className="mt-1 text-sm font-semibold text-ink">REST JSON / CORS</dd>
        </div>

        <div className="bg-surface p-3">
          <dt className="label flex items-center gap-1.5">
            <Globe className="h-3.5 w-3.5" aria-hidden="true" />
            Base URL
          </dt>
          <dd className="num mt-1 truncate text-sm font-semibold text-ink">/api/v1</dd>
        </div>

        <div className="bg-surface p-3">
          <dt className="label flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" aria-hidden="true" />
            Rate limit (free)
          </dt>
          <dd className="num mt-1 text-sm font-semibold text-ink">1,000 req / hr</dd>
        </div>

        <div className="bg-surface p-3">
          <dt className="label flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-safe-700" aria-hidden="true" />
            Authentication
          </dt>
          <dd className="mt-1 text-sm font-semibold text-safe-700">None (open public)</dd>
        </div>
      </dl>

      {/* Main Interactive Explorer Layout */}
      <section aria-labelledby="api-endpoints-heading" className="mt-8 space-y-4">
        <div className="flex flex-col gap-1 border-b border-rule pb-2 sm:flex-row sm:items-baseline sm:justify-between">
          <h2 id="api-endpoints-heading" className="text-xl font-bold tracking-tight text-ink">
            REST API Endpoints &amp; Interactive Explorer
          </h2>
          <span className="text-[14px] text-ink-subtle">Open JSON API • Free rate limits</span>
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Column: endpoint selector */}
        <div className="space-y-3 lg:col-span-4">
          <div className="flex items-center justify-between pb-1">
            <span className="text-[13px] font-semibold uppercase tracking-wider text-ink-muted">
              Select API Endpoint
            </span>
            <span className="text-[14px] font-mono text-ink-faint">
              v1.2
            </span>
          </div>

          <div className="space-y-2.5">
            {ENDPOINTS.map((ep) => {
              const isSelected = activeEndpoint.id === ep.id;
              return (
                <button
                  key={ep.id}
                  onClick={() => selectEndpoint(ep)}
                  className={`card w-full space-y-2 text-left transition-colors ${
                    isSelected ? "!border-ink bg-ink text-canvas" : "hover:border-rule-strong"
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1.5">
                    <div className="flex min-w-0 items-center gap-2">
                      <span
                        className={`chip ${
                          isSelected ? "bg-canvas text-ink" : "chip-safe"
                        }`}
                      >
                        {ep.method}
                      </span>
                      <span className="num truncate text-[14px] font-semibold sm:text-sm">
                        {ep.path}
                      </span>
                    </div>

                    <span
                      className={`chip text-[13px] uppercase tracking-wider ${
                        isSelected ? "bg-canvas text-ink" : ""
                      }`}
                    >
                      {ep.badge}
                    </span>
                  </div>

                  <div className={`text-[14px] font-medium ${isSelected ? "text-canvas" : "text-ink-muted"}`}>
                    {ep.name}
                  </div>

                  <p className={`text-[14px] leading-relaxed line-clamp-2 ${isSelected ? "text-canvas/80" : "text-ink-subtle"}`}>
                    {ep.description}
                  </p>
                </button>
              );
            })}
          </div>

          {/* Quick Copy cURL Shortcut Box */}
          <div className="panel space-y-2 text-[14px]">
            <div className="flex items-center justify-between text-ink-muted font-semibold font-mono">
              <span className="flex items-center space-x-1.5">
                <Terminal className="w-3.5 h-3.5 text-ink-muted" />
                <span>Instant cURL</span>
              </span>
              <button
                onClick={() => copyToClipboard(getCurlCommand(), "quick-curl")}
                className="prose-a flex min-h-11 items-center gap-1"
              >
                {copiedKey === "quick-curl" ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Copy cURL</span>
                  </>
                )}
              </button>
            </div>
            <code className="prose-mono block break-all text-[14px]">
              curl -s {SITE_URL}{activeEndpoint.path}
            </code>
          </div>
        </div>

        {/* Right Column: Interactive Explorer Console */}
        <div className="lg:col-span-8 space-y-5">
          {/* Endpoint Details & Live Execution Bar */}
          <div className="card space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="chip chip-safe">
                    {activeEndpoint.method}
                  </span>
                  <h3 className="text-base sm:text-lg font-bold text-ink">
                    {activeEndpoint.name}
                  </h3>
                </div>
                <p className="prose max-w-2xl text-sm">
                  {activeEndpoint.description}
                </p>
              </div>

              {/* Instant Copy cURL Button */}
              <button
                onClick={() => copyToClipboard(getCurlCommand(), "header-curl")}
                className="btn min-h-11 shrink-0"
              >
                {copiedKey === "header-curl" ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-safe-700" aria-hidden="true" />
                    <span className="text-safe-700">cURL Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Copy cURL</span>
                  </>
                )}
              </button>
            </div>

            {/* Live Fetch Input Bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2 text-[14px]">
                <span className="font-semibold text-ink-muted">
                  Interactive Request URL &amp; Query Params:
                </span>
                <span className="text-ink-subtle">Edit query below</span>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <div className="prose-mono flex min-h-11 flex-1 items-center overflow-x-auto px-3.5 py-2.5 text-[13px] sm:text-sm">
                  <span className="mr-2 font-semibold text-safe-700">GET</span>
                  <span className="text-ink-faint">{activeEndpoint.path}</span>
                  <input
                    type="text"
                    value={queryInput}
                    onChange={(e) => setQueryInput(e.target.value)}
                    placeholder="?param=value..."
                    className="num ml-1 min-w-[140px] flex-1 bg-transparent text-[14px] text-ink sm:text-sm"
                  />
                </div>

                <button
                  onClick={executeLiveRequest}
                  disabled={loading}
                  className="btn btn-primary min-h-11 shrink-0 justify-center disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Fetching...</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-current" />
                      <span>Try It Live</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Query Parameters Specification */}
            {activeEndpoint.params && activeEndpoint.params.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-rule">
                <span className="text-[13px] font-semibold text-ink-muted uppercase tracking-wider block">
                  Request Parameters
                </span>
                <div className="overflow-x-auto text-[14px]">
                  <table className="w-full text-left">
                    <caption className="sr-only">
                      Request parameters for the selected endpoint: parameter name, type, default
                      value and description.
                    </caption>
                    <thead className="bg-surface-2 border-b border-rule text-ink-subtle font-mono">
                      <tr>
                        <th scope="col" className="p-3">Parameter</th>
                        <th scope="col" className="p-3">Type</th>
                        <th scope="col" className="p-3">Default</th>
                        <th scope="col" className="p-3">Description</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-rule font-mono">
                      {activeEndpoint.params.map((p) => (
                        <tr key={p.name} className="bg-surface hover:bg-surface-2 hover:bg-surface-2/40">
                          <th scope="row" className="p-3 font-bold text-ink">
                            {p.name}
                            {p.required && (
                              <span className="ml-1.5 text-ink px-1 py-0.5 rounded bg-risk-50 text-risk-700 bg-risk-50/60 text-risk-600 border border-risk-200 border-risk-500">
                                Required
                              </span>
                            )}
                          </th>
                          <td className="p-3 text-ink-subtle">{p.type}</td>
                          <td className="p-3 text-ink-subtle">{p.defaultVal || "—"}</td>
                          <td className="p-3 font-sans text-ink-muted">{p.desc}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Code Snippets Box (cURL / JavaScript / Python) */}
<div className="card card-flush overflow-hidden">
              <div className="flex items-center justify-between gap-2 border-b border-rule bg-surface-2 px-3 py-2">
                <div className="flex items-center gap-1">
                  {(["curl", "js", "python"] as const).map((lang) => (
                    <button
                      key={lang}
                      onClick={() => setCodeLanguage(lang)}
                      aria-pressed={codeLanguage === lang}
                      className={`min-h-11 whitespace-nowrap rounded-lg px-3 py-2 text-[13px] font-semibold uppercase transition-colors ${
                        codeLanguage === lang ? "bg-ink text-canvas" : "text-ink-muted hover:text-ink"
                      }`}
                    >
                      {lang === "curl" ? "cURL" : lang === "js" ? "Node.js / TS" : "Python 3"}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => copyToClipboard(getCodeSnippet(), "code-snippet")}
                  className="flex min-h-11 min-w-11 items-center justify-center gap-1.5 px-2 text-[13px] font-semibold text-ink-muted hover:text-ink"
                >
                  {copiedKey === "code-snippet" ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-safe-700" aria-hidden="true" />
                      <span className="text-safe-700">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>Copy Code</span>
                    </>
                  )}
                </button>
              </div>

              <pre className="num overflow-x-auto bg-surface-2 px-3 py-4 text-[14px] leading-relaxed text-ink sm:px-4">
                <code>{getCodeSnippet()}</code>
              </pre>
            </div>

            {/* Syntax-highlighted JSON response viewer */}
            <div className="card card-flush overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-rule bg-surface-2 px-3 py-2">
                <div className="flex flex-wrap items-center gap-3 text-[14px]">
                  {/* View mode toggle */}
                  <div className="flex items-center gap-1 rounded-lg border border-rule bg-surface p-0.5">
                    <button
                      onClick={() => setResponseViewMode("sample")}
                      aria-pressed={responseViewMode === "sample"}
                      className={`min-h-11 whitespace-nowrap rounded-md px-2.5 py-2 text-[13px] font-semibold transition-colors ${
                        responseViewMode === "sample" ? "bg-ink text-canvas" : "text-ink-muted hover:text-ink"
                      }`}
                    >
                      Sample Response
                    </button>
                    <button
                      onClick={() => setResponseViewMode("live")}
                      disabled={responseJson === null}
                      aria-pressed={responseViewMode === "live"}
                      className={`min-h-11 whitespace-nowrap rounded-md px-2.5 py-2 text-[13px] font-semibold transition-colors disabled:opacity-40 ${
                        responseViewMode === "live" ? "bg-ink text-canvas" : "text-ink-muted hover:text-ink"
                      }`}
                    >
                      Live Response{responseJson ? " ●" : ""}
                    </button>
                  </div>
                {/* HTTP Status Badge */}
                {responseViewMode === "live" && statusCode !== null && (
                  <span
                    className={`chip num ${
                      statusCode >= 200 && statusCode < 300 ? "chip-safe" : "chip-risk"
                    }`}
                  >
                    HTTP {statusCode} OK
                  </span>
                )}

                {/* Latency ms Badge */}
                {responseViewMode === "live" && latencyMs !== null && (
                  <span className="num text-ink-subtle">{latencyMs}ms latency</span>
                )}
              </div>

              {/* Copy JSON Button */}
              <button
                onClick={() => copyToClipboard(JSON.stringify(displayedJson, null, 2), "json-payload")}
                className="flex min-h-11 items-center gap-1 text-[13px] font-semibold text-ink-muted hover:text-ink"
              >
                {copiedKey === "json-payload" ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-safe-700" aria-hidden="true" />
                    <span className="text-safe-700">JSON Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Copy JSON</span>
                  </>
                )}
              </button>
            </div>

            {/* Highlighted JSON Code Display */}
            <pre className="num max-h-[460px] overflow-x-auto bg-surface-2 px-3 py-4 text-[14px] leading-relaxed sm:px-4">
              <code
                dangerouslySetInnerHTML={{
                  __html: highlightJsonToHtml(displayedJson),
                }}
              />
            </pre>
          </div>
        </div>
        </div>
      </section>

      {/* Bottom Ad */}
      <AdSlot placementId="global-infeed" className="mt-8" />

      <AdSlot placementId="api-docs-bottom" className="mt-6" />
    </div>
  );
}
