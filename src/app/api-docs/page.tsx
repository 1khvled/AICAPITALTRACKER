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
    name: "Live Bubble Probability & Factors",
    method: "GET",
    path: "/api/v1/model",
    badge: "Core Model Engine",
    description: "Returns the 12-month empirical bubble burst probability, composite stress score (0–100), 90% confidence interval, financial fragility index, systemic contagion synergy, and breakdown of all 9 factor contributions.",
    defaultQuery: "",
    params: [
      { name: "format", type: "string", required: false, defaultVal: "full", desc: "Response verbosity: 'full' includes factor details; 'summary' returns top-level probability only." },
    ],
    sampleResponse: {
      success: true,
      data: {
        burstProbability: 68.4,
        compositeScore: 61.2,
        band: "high",
        confidenceInterval: [59.1, 76.8],
        fragilityIndex: 74,
        systemicContagionPoints: 3.4,
        coverage: 1.0,
        horizonMonths: 12,
        macroIndicators: {
          us10yYieldPct: 4.42,
          cpiInflationYoY: 2.9,
          fedFundsRatePct: 4.75,
          annualDebtVelocityUsd: 85000000000,
          totalTrackedDebtUsd: 196822500000
        },
        topDriverIds: ["cds_stress", "debt_reliance", "valuation_stretch"],
        contributions: [
          {
            id: "cds_stress",
            label: "Credit stress (CDS spreads)",
            weightPct: 18,
            earnedPoints: 14.8,
            reading: { score: 0.82, reading: "CDS 187bp vs 81bp baseline (+131% widening)", coverage: 1 }
          },
          {
            id: "valuation_stretch",
            label: "Private valuation stretch",
            weightPct: 16,
            earnedPoints: 10.2,
            reading: { score: 0.64, reading: "Median price/sales across tracked labs: 28.5×", coverage: 1 }
          },
          {
            id: "debt_reliance",
            label: "Debt reliance & issuance pace",
            weightPct: 14,
            earnedPoints: 9.9,
            reading: { score: 0.71, reading: "Borrowed money = 7.0% ($196.8B verified across 20 facilities); Velocity: $85.0B/yr", coverage: 1 }
          }
        ],
        generatedAt: "2026-10-18T17:15:00.000Z"
      }
    }
  },
  {
    id: "deals",
    name: "Verified Deal Ledger",
    method: "GET",
    path: "/api/v1/deals",
    badge: "$2.81T Superstructure",
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
      total: 159,
      page: 1,
      limit: 2,
      totalPages: 80,
      summary: {
        totalDisclosedUsd: 2814500000000,
        totalDebtUsd: 196822500000,
        debtSharePct: 6.99
      },
      deals: [
        {
          id: "deal-anthropic-broadcom-2026",
          date: "2026-10-14",
          entity: "Anthropic",
          counterparty: "Broadcom",
          amountUsd: 42000000000,
          category: "Borrowed",
          structure: "Convertible Note & TPU Underwriting",
          hasDebt: true,
          verifiedSource: "Form S-1 Confidential Filing & Indenture Disclosures",
          summary: "Anthropic secures $42B convertible debt facility from Broadcom underwriting 5-year $125.2B custom TPU compute lease."
        },
        {
          id: "deal-coreweave-ddtl4",
          date: "2026-09-28",
          entity: "CoreWeave",
          counterparty: "Blackstone & Magnetar Syndicate",
          amountUsd: 8500000000,
          category: "Borrowed",
          structure: "Delayed Draw Term Loan (DDTL 4.0)",
          hasDebt: true,
          verifiedSource: "Credit Agreement Filed with SEC",
          summary: "CoreWeave closes $8.5B delayed draw credit facility collateralized by NVIDIA Blackwell GPU clusters."
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
        anchorScore: 55,
        steepness: 9,
        formula: "P(burst) = 1 / (1 + exp(-(S - 55) / 9))"
      },
      factorsCount: 9,
      totalRiskWeightPct: 100,
      damperMaxDiscountPoints: 10,
      factors: [
        {
          id: "cds_stress",
          label: "Credit stress (CDS spreads)",
          kind: "risk",
          weightPct: 18,
          formula: "score = ramp(current ÷ baseline, ×1, ×3)·0.7 + ramp(90-day rise, +0bp, +80bp)·0.3",
          explain: "CDS spread on Oracle debt serves as the primary fixed-income credit thermometer."
        },
        {
          id: "valuation_stretch",
          label: "Private valuation stretch",
          kind: "risk",
          weightPct: 16,
          formula: "PS = median(valuation ÷ run-rate revenue); score = ramp(PS, 8×, 60×)",
          explain: "Frontier lab price-to-sales multiples compared against historical tech bubble multiples."
        },
        {
          id: "debt_reliance",
          label: "Debt reliance & issuance pace",
          kind: "risk",
          weightPct: 14,
          formula: "score = 0.50·ramp(debtShare, 2.5%, 15%) + 0.35·ramp(annualDebtIssuance, $20B, $100B) + 0.15·ramp(totalTrackedDebt, $50B, $250B)",
          explain: "Share of capital composed of borrowed debt and annualized pace of debt issuance."
        },
        {
          id: "adoption_demand",
          label: "Real-use damper",
          kind: "damper",
          weightPct: 10,
          formula: "damper = 0.5·ramp(userGrowth, 10%, 100%) + 0.3·ramp(API price decline multiple, 1×, 50×) + 0.2·(trainingCostBand ≤ falling) · max 10 pts",
          explain: "Direct deduction from composite stress when token pricing drops and user adoption surges."
        }
      ]
    }
  },
  {
    id: "news",
    name: "Intelligence Wire & Market Filings",
    method: "GET",
    path: "/api/v1/news",
    badge: "Live Regulatory Wire",
    description: "Streams verified market intelligence, Form 8-K/S-1 regulatory filings, debt syndication announcements, and CDS repricing events updated in real time.",
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
          title: "Oracle 5-Year CDS Default Swaps Widen to 187bps as Fixed-Income Investors Price Hyperscaler Debt Burden",
          publisher: "Bloomberg Markets",
          link: "https://www.bloomberg.com/news/articles/2026-10-18/oracle-cds-spreads-debt-saturation",
          publishedAt: "2026-10-18T16:46:40.000Z",
          timeAgo: "42m ago",
          category: "Debt & Credit",
          impact: "Material Filing",
          summary: "Credit default swap insurance on Oracle senior notes trades at multi-year peak of 187 basis points (+131% increase), tracking $48B in GPU infrastructure debt guarantees."
        }
      ]
    }
  },
  {
    id: "sync",
    name: "24h Autonomous Workflow Telemetry",
    method: "GET",
    path: "/api/v1/sync",
    badge: "24h Cron Protocol",
    description: "Delivers live operational telemetry, execution health, data freshness, and ingestion audit logs for the autonomous 24-hour GitHub Actions workflow (.github/workflows/update-data.yml). Monitors real-time pipeline status across OpenRouter, Polymarket, Yahoo Finance, and SEC EDGAR.",
    defaultQuery: "",
    params: [
      { name: "limit", type: "integer", required: false, defaultVal: "5", desc: "Number of historical 24h cron execution audit logs to return (max: 30)." },
    ],
    sampleResponse: {
      success: true,
      data: {
        status: "HEALTHY",
        workflow: ".github/workflows/update-data.yml",
        schedule: "0 0 * * * (Daily at 00:00 UTC)",
        last_sync_timestamp: "2026-10-18T21:38:15.716Z",
        next_scheduled_run: "2026-10-19T00:00:00.000Z",
        freshness_status: "OPTIMAL",
        minutes_since_last_sync: 48,
        hours_since_last_sync: 0.8,
        sync_mode: "github_actions_cron_24h",
        active_pipelines: [
          {
            id: "openrouter",
            name: "OpenRouter Public Models Pricing API",
            endpoint: "https://openrouter.ai/api/v1/models",
            status: "ONLINE",
            metric: "25x token deflation multiple vs early-2023 GPT-4 benchmark",
            target: "Real-demand damper (-10 pts max)"
          },
          {
            id: "polymarket",
            name: "Polymarket Gamma Events API",
            endpoint: "https://gamma-api.polymarket.com/events",
            status: "ONLINE",
            metric: "10.3% 2026 bubble burst odds ($9.14M active volume across 16 markets)",
            target: "Crowd consensus risk factor"
          },
          {
            id: "yahoo_finance",
            name: "Yahoo Finance ORCL Market Stream",
            endpoint: "https://query1.finance.yahoo.com/v8/finance/chart/ORCL",
            status: "ONLINE",
            metric: "187 bps Oracle 5Y CDS proxy anchor",
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
            metric: "158 facilities ($2.81T volume, 7.0% debt share)",
            target: "Deterministic balance sheet aggregates"
          }
        ],
        recalibrated_models: [
          "Merton Structural Distance-to-Default (2.84σ, default prob: 2.25%)",
          "Altman Z''-Score Tech Classifier (1.84 Grey Zone, distress risk: 36.8%)",
          "Sornette LPPLS Bubble Singularity (38.2% hazard, critical window: Q4 2026 - Q2 2027)",
          "10,000-Path Monte Carlo Gaussian Copula (VaR95 49.6%, Expected Shortfall 53.4%)"
        ],
        recent_sync_history: [
          {
            timestamp: "2026-10-18T21:38:15.717Z",
            status: "SUCCESS",
            token_decline_multiple: "25x",
            polymarket_yes_prob: 0.103,
            disclosed_volume_usd: 2810757802026,
            debt_share_pct: "7.0%",
            deals_count: 158
          },
          {
            timestamp: "2026-10-18T17:15:00.000Z",
            status: "SUCCESS",
            token_decline_multiple: "40x",
            polymarket_yes_prob: 0.54,
            disclosed_volume_usd: 2810757802026,
            debt_share_pct: "7.0%",
            deals_count: 159
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
      let cls = "text-sky-600 dark:text-sky-400"; // number
      if (/^"/.test(match)) {
        if (/:$/.test(match)) {
          cls = "text-indigo-600 dark:text-indigo-400 font-semibold"; // key
        } else {
          cls = "text-emerald-700 dark:text-emerald-400"; // string
        }
      } else if (/true|false/.test(match)) {
        cls = "text-purple-600 dark:text-purple-400 font-bold"; // boolean
      } else if (/null/.test(match)) {
        cls = "text-slate-400 dark:text-zinc-500 italic"; // null
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

  const fullUrl = `https://aicapitaltracker.org${activeEndpoint.path}${queryInput}`;

  const getCurlCommand = () => {
    return `curl -X GET "${fullUrl}" \\\n  -H "Accept: application/json"`;
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
    <div className="space-y-10">
      {/* Top Banner Ad */}
      <AdSlot format="leaderboard" />

      {/* Header */}
      <div className="pb-6 border-b border-slate-200 dark:border-zinc-800 space-y-4">
        <nav aria-label="Breadcrumb" className="flex items-center space-x-2 text-xs font-mono text-slate-500 dark:text-zinc-400">
          <Link href="/" className="hover:text-slate-900 dark:hover:text-white transition-colors">
            Home
          </Link>
          <span>/</span>
          <span className="text-slate-900 dark:text-white font-semibold">API Documentation</span>
        </nav>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2.5 mb-1.5">
              <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                REST v1.2
              </span>
              <span className="text-xs font-mono text-slate-500 dark:text-zinc-400">
                Open Access Protocol
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              AI Capital Tracker Public API Explorer
            </h1>
            <p className="text-sm text-slate-600 dark:text-zinc-300 font-sans mt-1 max-w-2xl leading-relaxed">
              Programmatic REST access to the quantitative model engine, $2.81T deal ledger, factor formulas, and 
              live regulatory filings. Sourced directly from audited SEC filings.
            </p>
          </div>
          <div className="flex items-center space-x-3 shrink-0">
            <div className="flex items-center space-x-2 px-3 py-1.5 rounded-full text-xs font-mono bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/60 font-semibold shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>{ENDPOINTS.length} Endpoints Active</span>
            </div>
          </div>
        </div>
      </div>

      {/* Architecture Specs Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 text-xs font-mono">
        <div className="p-3.5 rounded-xl bg-white dark:bg-[#121214] border border-slate-200 dark:border-zinc-800 shadow-sm space-y-1">
          <div className="flex items-center space-x-1.5 text-slate-500 dark:text-zinc-400">
            <Server className="w-3.5 h-3.5" />
            <span className="font-semibold uppercase tracking-wider text-[11px]">Architecture</span>
          </div>
          <span className="text-slate-900 dark:text-white font-bold text-sm block">REST JSON / CORS</span>
        </div>

        <div className="p-3.5 rounded-xl bg-white dark:bg-[#121214] border border-slate-200 dark:border-zinc-800 shadow-sm space-y-1">
          <div className="flex items-center space-x-1.5 text-slate-500 dark:text-zinc-400">
            <Globe className="w-3.5 h-3.5" />
            <span className="font-semibold uppercase tracking-wider text-[11px]">Base URL</span>
          </div>
          <span className="text-slate-900 dark:text-white font-bold text-sm truncate block font-mono">
            /api/v1
          </span>
        </div>

        <div className="p-3.5 rounded-xl bg-white dark:bg-[#121214] border border-slate-200 dark:border-zinc-800 shadow-sm space-y-1">
          <div className="flex items-center space-x-1.5 text-slate-500 dark:text-zinc-400">
            <Clock className="w-3.5 h-3.5" />
            <span className="font-semibold uppercase tracking-wider text-[11px]">Rate Limit (Free)</span>
          </div>
          <span className="text-slate-900 dark:text-white font-bold text-sm block">1,000 req / hr</span>
        </div>

        <div className="p-3.5 rounded-xl bg-white dark:bg-[#121214] border border-slate-200 dark:border-zinc-800 shadow-sm space-y-1">
          <div className="flex items-center space-x-1.5 text-slate-500 dark:text-zinc-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span className="font-semibold uppercase tracking-wider text-[11px]">Authentication</span>
          </div>
          <span className="text-emerald-600 dark:text-emerald-400 font-bold text-sm block">None (Open Public)</span>
        </div>
      </div>

      {/* Main Interactive Explorer Layout */}
      <section aria-labelledby="api-endpoints-heading" className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 pb-1">
          <h2 id="api-endpoints-heading" className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            REST API Endpoints &amp; Interactive Explorer
          </h2>
          <span className="text-xs font-mono text-slate-500 dark:text-zinc-400">
            Open JSON API • Free Rate Limits
          </span>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: 4 Endpoint Selector Cards */}
        <div className="lg:col-span-4 space-y-3">
          <div className="flex items-center justify-between pb-1">
            <span className="text-xs font-mono font-bold text-slate-600 dark:text-zinc-400 uppercase tracking-wider">
              Select API Endpoint
            </span>
            <span className="text-xs font-mono text-slate-400 dark:text-zinc-500">
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
                  className={`w-full text-left p-4 rounded-xl border transition-all space-y-2 relative overflow-hidden group ${
                    isSelected
                      ? "bg-slate-900 text-white dark:bg-[#18181b] dark:text-white border-slate-800 dark:border-zinc-700 shadow-md ring-1 ring-emerald-500/40"
                      : "bg-white dark:bg-[#121214] border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 hover:border-slate-300 dark:hover:border-zinc-700 shadow-sm"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center space-x-2">
                      <span
                        className={`text-[11px] font-mono px-2 py-0.5 rounded font-black ${
                          isSelected
                            ? "bg-emerald-500 text-black"
                            : "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"
                        }`}
                      >
                        {ep.method}
                      </span>
                      <span className="font-mono text-xs sm:text-sm font-bold tracking-tight">
                        {ep.path}
                      </span>
                    </div>

                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.5 rounded uppercase tracking-wider font-semibold ${
                        isSelected
                          ? "bg-white/10 text-zinc-300"
                          : "bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400"
                      }`}
                    >
                      {ep.badge}
                    </span>
                  </div>

                  <div className={`text-xs sm:text-sm font-medium ${isSelected ? "text-slate-200 dark:text-zinc-200" : "text-slate-600 dark:text-zinc-400"}`}>
                    {ep.name}
                  </div>

                  <p className={`text-xs line-clamp-2 leading-relaxed font-sans ${isSelected ? "text-slate-300 dark:text-zinc-400" : "text-slate-500 dark:text-zinc-500"}`}>
                    {ep.description}
                  </p>
                </button>
              );
            })}
          </div>

          {/* Quick Copy cURL Shortcut Box */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#121214] border border-slate-200 dark:border-zinc-800 space-y-2 text-xs">
            <div className="flex items-center justify-between text-slate-700 dark:text-zinc-300 font-semibold font-mono">
              <span className="flex items-center space-x-1.5">
                <Terminal className="w-3.5 h-3.5 text-indigo-500" />
                <span>Instant cURL</span>
              </span>
              <button
                onClick={() => copyToClipboard(getCurlCommand(), "quick-curl")}
                className="hover:text-slate-900 dark:hover:text-white transition-colors flex items-center space-x-1 text-emerald-600 dark:text-emerald-400"
              >
                {copiedKey === "quick-curl" ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy cURL</span>
                  </>
                )}
              </button>
            </div>
            <code className="text-[11px] font-mono block bg-slate-100 dark:bg-[#09090b] p-2 rounded border border-slate-200 dark:border-zinc-800 text-slate-800 dark:text-zinc-300 break-all">
              curl -s https://aicapitaltracker.org{activeEndpoint.path}
            </code>
          </div>
        </div>

        {/* Right Column: Interactive Explorer Console */}
        <div className="lg:col-span-8 space-y-5">
          {/* Endpoint Details & Live Execution Bar */}
          <div className="bg-white dark:bg-[#121214] border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 sm:p-6 space-y-5 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                    {activeEndpoint.method}
                  </span>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                    {activeEndpoint.name}
                  </h3>
                </div>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-300 font-sans leading-relaxed">
                  {activeEndpoint.description}
                </p>
              </div>

              {/* Instant Copy cURL Button */}
              <button
                onClick={() => copyToClipboard(getCurlCommand(), "header-curl")}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 transition-colors shrink-0 border border-slate-200 dark:border-zinc-700"
              >
                {copiedKey === "header-curl" ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="text-emerald-600 dark:text-emerald-400">cURL Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy cURL</span>
                  </>
                )}
              </button>
            </div>

            {/* Live Fetch Input Bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="font-semibold text-slate-700 dark:text-zinc-300">
                  Interactive Request URL &amp; Query Params:
                </span>
                <span className="text-slate-400 dark:text-zinc-500">Edit query below</span>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <div className="flex-1 flex items-center bg-slate-50 dark:bg-[#09090b] border border-slate-300 dark:border-zinc-700 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-mono overflow-x-auto shadow-inner">
                  <span className="text-emerald-600 dark:text-emerald-400 font-black mr-2">GET</span>
                  <span className="text-slate-400 dark:text-zinc-500">{activeEndpoint.path}</span>
                  <input
                    type="text"
                    value={queryInput}
                    onChange={(e) => setQueryInput(e.target.value)}
                    placeholder="?param=value..."
                    className="flex-1 bg-transparent text-slate-900 dark:text-white focus:outline-none ml-1 font-mono text-xs sm:text-sm min-w-[140px]"
                  />
                </div>

                <button
                  onClick={executeLiveRequest}
                  disabled={loading}
                  className="flex items-center justify-center space-x-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-all disabled:opacity-50 shadow-md shadow-emerald-600/20 shrink-0"
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
              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-zinc-800">
                <span className="text-xs font-mono font-bold text-slate-600 dark:text-zinc-400 uppercase tracking-wider block">
                  Request Parameters
                </span>
                <div className="border border-slate-200 dark:border-zinc-800 rounded-xl overflow-hidden text-xs">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 dark:bg-[#09090b] border-b border-slate-200 dark:border-zinc-800 text-slate-500 dark:text-zinc-400 font-mono">
                      <tr>
                        <th className="p-3">Parameter</th>
                        <th className="p-3">Type</th>
                        <th className="p-3">Default</th>
                        <th className="p-3">Description</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-zinc-800 font-mono">
                      {activeEndpoint.params.map((p) => (
                        <tr key={p.name} className="bg-white dark:bg-[#121214] hover:bg-slate-50 dark:hover:bg-zinc-900/40">
                          <td className="p-3 font-bold text-slate-900 dark:text-white">
                            {p.name}
                            {p.required && (
                              <span className="ml-1.5 text-[10px] px-1 py-0.5 rounded bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400 border border-rose-200 dark:border-rose-900">
                                Required
                              </span>
                            )}
                          </td>
                          <td className="p-3 text-slate-500 dark:text-zinc-400">{p.type}</td>
                          <td className="p-3 text-slate-500 dark:text-zinc-400">{p.defaultVal || "—"}</td>
                          <td className="p-3 font-sans text-slate-700 dark:text-zinc-300">{p.desc}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Code Snippets Box (cURL / JavaScript / Python) */}
          <div className="bg-white dark:bg-[#121214] border border-slate-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-[#09090b]">
              <div className="flex items-center space-x-1.5">
                {(["curl", "js", "python"] as const).map((lang) => (
                  <button
                    key={lang}
                    onClick={() => setCodeLanguage(lang)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono uppercase font-bold transition-all ${
                      codeLanguage === lang
                        ? "bg-slate-900 text-white dark:bg-white dark:text-zinc-950 shadow-sm"
                        : "text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    {lang === "curl" ? "cURL" : lang === "js" ? "Node.js / TS" : "Python 3"}
                  </button>
                ))}
              </div>

              <button
                onClick={() => copyToClipboard(getCodeSnippet(), "code-snippet")}
                className="flex items-center space-x-1.5 text-xs font-mono font-bold text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white transition-colors"
              >
                {copiedKey === "code-snippet" ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="text-emerald-600 dark:text-emerald-400">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Code</span>
                  </>
                )}
              </button>
            </div>

            <pre className="p-4 sm:p-5 text-xs font-mono text-slate-800 dark:text-zinc-200 overflow-x-auto bg-slate-50/50 dark:bg-[#09090b] leading-relaxed">
              <code>{getCodeSnippet()}</code>
            </pre>
          </div>

          {/* Syntax-Highlighted JSON Response Viewer */}
          <div className="bg-white dark:bg-[#121214] border border-slate-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
            <div className="flex flex-wrap items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-[#09090b] gap-2">
              <div className="flex items-center space-x-3 text-xs font-mono">
                {/* View Mode Toggle */}
                <div className="flex items-center space-x-1 bg-slate-200/60 dark:bg-zinc-800 p-0.5 rounded-lg">
                  <button
                    onClick={() => setResponseViewMode("sample")}
                    className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                      responseViewMode === "sample"
                        ? "bg-white text-slate-900 dark:bg-zinc-900 dark:text-white shadow-xs"
                        : "text-slate-600 dark:text-zinc-400 hover:text-slate-900"
                    }`}
                  >
                    Sample Response
                  </button>
                  <button
                    onClick={() => setResponseViewMode("live")}
                    disabled={responseJson === null}
                    className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                      responseViewMode === "live"
                        ? "bg-white text-slate-900 dark:bg-zinc-900 dark:text-white shadow-xs"
                        : "text-slate-600 dark:text-zinc-400 disabled:opacity-40"
                    }`}
                  >
                    Live Response {responseJson && "●"}
                  </button>
                </div>

                {/* HTTP Status Badge */}
                {responseViewMode === "live" && statusCode !== null && (
                  <span
                    className={`px-2 py-0.5 rounded font-bold ${
                      statusCode >= 200 && statusCode < 300
                        ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"
                        : "bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 border border-rose-200 dark:border-rose-800"
                    }`}
                  >
                    HTTP {statusCode} OK
                  </span>
                )}

                {/* Latency ms Badge */}
                {responseViewMode === "live" && latencyMs !== null && (
                  <span className="text-slate-500 dark:text-zinc-400">
                    ⏱ {latencyMs}ms
                  </span>
                )}
              </div>

              {/* Copy JSON Button */}
              <button
                onClick={() => copyToClipboard(JSON.stringify(displayedJson, null, 2), "json-payload")}
                className="flex items-center space-x-1 text-xs font-mono font-bold text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white transition-colors"
              >
                {copiedKey === "json-payload" ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="text-emerald-600 dark:text-emerald-400">JSON Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy JSON</span>
                  </>
                )}
              </button>
            </div>

            {/* Highlighted JSON Code Display */}
            <pre className="p-4 sm:p-5 text-xs font-mono overflow-x-auto max-h-[460px] bg-slate-50/50 dark:bg-[#09090b] leading-relaxed">
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
      <AdSlot format="in-feed" />
    </div>
  );
}
