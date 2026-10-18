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
  ShieldAlert,
  Database,
  Layers,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { AdSlot } from "@/components/AdSlot";

interface EndpointDoc {
  id: string;
  name: string;
  method: "GET" | "POST";
  path: string;
  description: string;
  params?: { name: string; type: string; required: boolean; desc: string }[];
  defaultQuery?: string;
}

const ENDPOINTS: EndpointDoc[] = [
  {
    id: "model",
    name: "Live Bubble Probability & Factors",
    method: "GET",
    path: "/api/v1/model",
    description: "Returns the 12-month bubble burst probability (68.4%), linear composite stress score (61.2), risk band, and individual factor contribution readings.",
  },
  {
    id: "deals",
    name: "Verified Deal Ledger",
    method: "GET",
    path: "/api/v1/deals",
    description: "Retrieves verified transaction records from the $2.75T AI capital ledger with support for full-text search, category filtering, and debt tagging.",
    defaultQuery: "?limit=5&category=Borrowed",
    params: [
      { name: "search", type: "string", required: false, desc: "Search title, description, or participants" },
      { name: "category", type: "string", required: false, desc: "Filter by category: Borrowed, Bets & rounds, Compute contracts, etc." },
      { name: "debt_only", type: "boolean", required: false, desc: "Set to true to isolate debt facilities & loans" },
      { name: "limit", type: "integer", required: false, desc: "Number of records per page (default: 50, max: 200)" },
      { name: "page", type: "integer", required: false, desc: "Page index (1-based)" },
      { name: "sort", type: "string", required: false, desc: "Sort order: 'newest' or 'biggest'" },
    ],
  },
  {
    id: "factors",
    name: "Mathematical Factors & Weights",
    method: "GET",
    path: "/api/v1/factors",
    description: "Returns the exact mathematical formulas, calibration anchor score (55), sigmoid steepness (9), and published weights for all 8 factors.",
  },
];

export default function ApiDocsPage() {
  const [activeEndpoint, setActiveEndpoint] = useState<EndpointDoc>(ENDPOINTS[0]);
  const [queryInput, setQueryInput] = useState<string>(activeEndpoint.defaultQuery || "");
  const [loading, setLoading] = useState<boolean>(false);
  const [responseJson, setResponseJson] = useState<any | null>(null);
  const [statusCode, setStatusCode] = useState<number | null>(null);
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [codeLanguage, setCodeLanguage] = useState<"curl" | "js" | "python">("curl");

  const selectEndpoint = (ep: EndpointDoc) => {
    setActiveEndpoint(ep);
    setQueryInput(ep.defaultQuery || "");
    setResponseJson(null);
    setStatusCode(null);
    setLatencyMs(null);
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
    } catch (err: any) {
      setStatusCode(500);
      setResponseJson({ error: err.message || "Failed to fetch API" });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(key);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const fullUrl = `https://aicapitaltracker.org${activeEndpoint.path}${queryInput}`;

  // Code snippets
  const getCodeSnippet = () => {
    if (codeLanguage === "curl") {
      return `curl -X GET "${fullUrl}" \\\n  -H "Accept: application/json"`;
    } else if (codeLanguage === "js") {
      return `// JavaScript / TypeScript Fetch\nconst response = await fetch("${fullUrl}");\nconst data = await response.json();\nconsole.log(data);`;
    } else {
      return `# Python requests\nimport requests\n\nresponse = requests.get("${fullUrl}")\ndata = response.json()\nprint(data)`;
    }
  };

  return (
    <div className="space-y-10">
      {/* Top Banner Ad */}
      <AdSlot format="leaderboard" />

      {/* Header */}
      <div className="pb-6 border-b border-slate-200 dark:border-zinc-800 space-y-3">
        <div className="flex items-center space-x-2 text-xs font-mono text-slate-500 dark:text-zinc-400">
          <Link href="/" className="hover:text-slate-900 dark:hover:text-white">
            Home
          </Link>
          <span>/</span>
          <span className="text-slate-900 dark:text-white font-semibold">API Documentation</span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
              AI Capital Tracker Public API v1
            </h1>
            <p className="text-sm text-slate-600 dark:text-zinc-300 font-sans mt-1 max-w-2xl leading-relaxed">
              Real-time, programmatically accessible financial intelligence on AI infrastructure debt, 
              private valuations, and bubble burst probability.
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-1 rounded-md text-xs font-mono bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/60 font-semibold">
              ● All Systems Operational
            </span>
          </div>
        </div>
      </div>

      {/* Overview Specs Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs font-mono">
        <div className="p-3.5 rounded-xl bg-white dark:bg-[#10141d] border border-slate-200 dark:border-zinc-800">
          <span className="text-slate-500 dark:text-zinc-400 block text-xs font-medium">Architecture</span>
          <span className="text-slate-900 dark:text-white font-bold text-sm mt-0.5 block">REST JSON / CORS</span>
        </div>
        <div className="p-3.5 rounded-xl bg-white dark:bg-[#10141d] border border-slate-200 dark:border-zinc-800">
          <span className="text-slate-500 dark:text-zinc-400 block text-xs font-medium">Base URL</span>
          <span className="text-slate-900 dark:text-white font-bold text-sm mt-0.5 truncate block">/api/v1</span>
        </div>
        <div className="p-3.5 rounded-xl bg-white dark:bg-[#10141d] border border-slate-200 dark:border-zinc-800">
          <span className="text-slate-500 dark:text-zinc-400 block text-xs font-medium">Rate Limit (Free)</span>
          <span className="text-slate-900 dark:text-white font-bold text-sm mt-0.5 block">1,000 req / hour</span>
        </div>
        <div className="p-3.5 rounded-xl bg-white dark:bg-[#10141d] border border-slate-200 dark:border-zinc-800">
          <span className="text-slate-500 dark:text-zinc-400 block text-xs font-medium">Auth Required</span>
          <span className="text-emerald-600 dark:text-emerald-400 font-bold text-sm mt-0.5 block">None (Open Public)</span>
        </div>
      </div>

      {/* Interactive API Explorer Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Endpoint List */}
        <div className="lg:col-span-4 space-y-2">
          <span className="text-xs font-mono font-bold text-slate-600 dark:text-zinc-400 uppercase tracking-wider block mb-1">
            Available Endpoints
          </span>
          {ENDPOINTS.map((ep) => {
            const isSelected = activeEndpoint.id === ep.id;
            return (
              <button
                key={ep.id}
                onClick={() => selectEndpoint(ep)}
                className={`w-full text-left p-3.5 rounded-xl border transition-all space-y-1.5 ${
                  isSelected
                    ? "bg-slate-900 text-white dark:bg-white dark:text-zinc-950 border-transparent shadow-sm"
                    : "bg-white dark:bg-[#10141d] border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 hover:border-slate-300 dark:hover:border-zinc-700"
                }`}
              >
                <div className="flex items-center space-x-2">
                  <span
                    className={`text-xs font-mono px-2 py-0.5 rounded font-bold ${
                      isSelected
                        ? "bg-emerald-500 text-black"
                        : "bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300"
                    }`}
                  >
                    {ep.method}
                  </span>
                  <span className="font-mono text-xs sm:text-sm font-bold">{ep.path}</span>
                </div>
                <div className={`text-xs sm:text-sm font-medium ${isSelected ? "text-slate-200 dark:text-zinc-700" : "text-slate-600 dark:text-zinc-400"}`}>
                  {ep.name}
                </div>
              </button>
            );
          })}
        </div>

        {/* Right Column: Interactive Test Console & Code Snippet */}
        <div className="lg:col-span-8 space-y-5">
          {/* Active Endpoint Info & URL Input Bar */}
          <div className="bg-white dark:bg-[#10141d] border border-slate-200 dark:border-zinc-800 rounded-xl p-5 space-y-4 shadow-sm">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {activeEndpoint.name}
              </h3>
              <p className="text-xs text-slate-600 dark:text-zinc-300 font-sans mt-0.5 leading-relaxed">
                {activeEndpoint.description}
              </p>
            </div>

            {/* URL input and Try It button */}
            <div className="flex items-center space-x-2">
              <div className="flex-1 flex items-center bg-slate-50 dark:bg-[#0c0f16] border border-slate-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs font-mono">
                <span className="text-emerald-600 dark:text-emerald-400 font-bold mr-2">GET</span>
                <span className="text-slate-400 dark:text-zinc-500">{activeEndpoint.path}</span>
                <input
                  type="text"
                  value={queryInput}
                  onChange={(e) => setQueryInput(e.target.value)}
                  placeholder="?param=value..."
                  className="flex-1 bg-transparent text-slate-900 dark:text-white focus:outline-none ml-0.5"
                />
              </div>

              <button
                onClick={executeLiveRequest}
                disabled={loading}
                className="flex items-center space-x-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors disabled:opacity-50 shadow-sm"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>{loading ? "Sending..." : "Test Request"}</span>
              </button>
            </div>

            {/* Query Parameters Table */}
            {activeEndpoint.params && (
              <div className="space-y-1.5 pt-2">
                <span className="text-xs font-mono text-slate-500 dark:text-zinc-400 block font-semibold">
                  Query Parameters:
                </span>
                <div className="border border-slate-100 dark:border-zinc-800 rounded-lg overflow-hidden text-xs">
                  {activeEndpoint.params.map((p, idx) => (
                    <div
                      key={p.name}
                      className={`flex flex-col sm:flex-row sm:items-center justify-between p-3 font-mono ${
                        idx % 2 === 0 ? "bg-slate-50/50 dark:bg-[#0c0f16]/40" : "bg-white dark:bg-[#10141d]"
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <span className="text-slate-900 dark:text-white font-bold text-xs sm:text-sm">{p.name}</span>
                        <span className="text-xs text-slate-500 dark:text-zinc-400">({p.type})</span>
                        {p.required && (
                          <span className="text-xs px-1.5 py-0.5 rounded bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 font-bold border border-rose-200 dark:border-rose-900/60">
                            Required
                          </span>
                        )}
                      </div>
                      <div className="text-xs sm:text-sm text-slate-600 dark:text-zinc-300 font-sans mt-0.5 sm:mt-0">
                        {p.desc}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Code Snippet Tabs */}
          <div className="bg-white dark:bg-[#10141d] border border-slate-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-[#0c0f16]">
              <div className="flex items-center space-x-1">
                {(["curl", "js", "python"] as const).map((lang) => (
                  <button
                    key={lang}
                    onClick={() => setCodeLanguage(lang)}
                    className={`px-2.5 py-1 rounded text-xs font-mono uppercase font-semibold transition-colors ${
                      codeLanguage === lang
                        ? "bg-slate-900 text-white dark:bg-white dark:text-zinc-950"
                        : "text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    {lang}
                  </button>
                ))}
              </div>

              <button
                onClick={() => copyToClipboard(getCodeSnippet(), "code")}
                className="flex items-center space-x-1 text-xs font-mono text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                {copiedCode === "code" ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>

            <pre className="p-4 text-xs font-mono text-slate-800 dark:text-zinc-200 overflow-x-auto bg-slate-50/50 dark:bg-[#090b10] leading-relaxed">
              <code>{getCodeSnippet()}</code>
            </pre>
          </div>

          {/* Live Response Output Viewer */}
          <div className="bg-white dark:bg-[#10141d] border border-slate-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-[#0c0f16]">
              <div className="flex items-center space-x-3 text-xs font-mono">
                <span className="font-semibold text-slate-700 dark:text-zinc-300">Live Response</span>
                {statusCode !== null && (
                  <span
                    className={`px-2 py-0.5 rounded font-bold ${
                      statusCode >= 200 && statusCode < 300
                        ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900"
                        : "bg-rose-50 text-rose-700"
                    }`}
                  >
                    {statusCode} OK
                  </span>
                )}
                {latencyMs !== null && (
                  <span className="text-slate-400 dark:text-zinc-500">
                    {latencyMs} ms
                  </span>
                )}
              </div>

              {responseJson && (
                <button
                  onClick={() => copyToClipboard(JSON.stringify(responseJson, null, 2), "response")}
                  className="flex items-center space-x-1 text-xs font-mono text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  {copiedCode === "response" ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy JSON</span>
                    </>
                  )}
                </button>
              )}
            </div>

            <pre className="p-4 text-xs font-mono text-slate-800 dark:text-emerald-400 overflow-x-auto max-h-[420px] bg-slate-50/50 dark:bg-[#080a0f] leading-relaxed">
              {responseJson ? (
                <code>{JSON.stringify(responseJson, null, 2)}</code>
              ) : (
                <span className="text-slate-400 dark:text-zinc-600 font-sans italic">
                  Click &quot;Test Request&quot; above to execute a live query and view the raw JSON payload.
                </span>
              )}
            </pre>
          </div>
        </div>
      </div>

      {/* Bottom Ad */}
      <AdSlot format="in-feed" />
    </div>
  );
}
