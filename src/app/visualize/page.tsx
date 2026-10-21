"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback, Suspense } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import rawDeals from "@/data/deals.json";
import { evaluateBubbleModel, DEFAULT_MODEL_INPUTS } from "@/lib/model/engine";
import { DealBubbleChart, Deal } from "@/components/DealBubbleChart";
import { CapitalWheelChart } from "@/components/CapitalWheelChart";
import { CircularFinancingChart } from "@/components/CircularFinancingChart";
import {
  SensitivityCurveChart,
  AiRevenueGapChart,
  TokenPriceDeflationChart,
  LabMultiplesChart,
  CapitalCompositionChart,
  CAPITAL_SEGMENT_TOTALS,
  YearlySurgeChart,
  CdsTrajectoryChart,
} from "@/components/VisualCharts";
import { AdSlot } from "@/components/AdSlot";
import { PolymarketCharts } from "@/components/PolymarketCharts";
import { Reveal } from "@/components/Reveal";
import {
  BarChart3,
  PieChart,
  TrendingUp,
  Layers,
  X,
  ChevronRight,
  Sparkles,
  Activity,
  DollarSign,
  AlertTriangle,
  ShieldAlert,
  ArrowUpRight,
  Sliders,
  Filter,
  Info,
  BookOpen,
  ArrowRight,
  Target,
  FileSpreadsheet,
  CircleDot,
  Scale,
  Cpu,
  Flame,
  LineChart,
} from "lucide-react";
import Link from "next/link";

export type VisualTab =
  | "all"
  | "capital-wheel"
  | "circular-financing"
  | "bubble-universe"
  | "sensitivity-sigmoid"
  | "frontier-multiples"
  | "capital-composition"
  | "revenue-gap";

const ALL_CATEGORIES = [
  "All",
  "Compute contracts",
  "Big construction",
  "Bets & rounds",
  "Buyouts & mergers",
  "Power & land",
  "Borrowed",
  "Share sales",
  "Compute & cloud",
  "Other",
];

function formatUsdShort(value: number): string {
  if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
  if (value >= 1e9) return `$${(value / 1e9).toFixed(1)}B`;
  if (value >= 1e6) return `$${Math.round(value / 1e6)}M`;
  return `$${value.toLocaleString()}`;
}

function VisualizeContent() {
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [activeTab, setActiveTab] = useState<VisualTab>("all");

  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const category = searchParams.get("category") || "All";
  const instrument = (searchParams.get("instrument") as "all" | "debt" | "equity") || "all";
  const circular = (searchParams.get("circular") as "all" | "circular_only" | "non_circular") || "all";

  const updateFilters = useCallback(
    (updates: { category?: string; instrument?: string; circular?: string }) => {
      const nextCat = updates.category !== undefined ? updates.category : category;
      const nextInst = updates.instrument !== undefined ? updates.instrument : instrument;
      const nextCirc = updates.circular !== undefined ? updates.circular : circular;

      const params = new URLSearchParams();
      if (nextCat && nextCat !== "All") params.set("category", nextCat);
      if (nextInst && nextInst !== "all") params.set("instrument", nextInst);
      if (nextCirc && nextCirc !== "all") params.set("circular", nextCirc);

      const qs = params.toString();
      const targetUrl = qs ? `${pathname}?${qs}` : pathname;
      router.replace(targetUrl, { scroll: false });
    },
    [category, instrument, circular, pathname, router]
  );

  const clearAllFilters = useCallback(() => {
    router.replace(pathname, { scroll: false });
  }, [pathname, router]);

  const hasActiveFilters = category !== "All" || instrument !== "all" || circular !== "all";

  const filteredDeals = useMemo(() => {
    return (rawDeals as Deal[]).filter((deal) => {
      if (category !== "All" && deal.category !== category) return false;
      if (instrument === "debt" && !deal.is_debt) return false;
      if (instrument === "equity" && deal.is_debt) return false;
      if (circular === "circular_only" && !deal.is_circular) return false;
      if (circular === "non_circular" && deal.is_circular) return false;
      return true;
    });
  }, [category, instrument, circular]);

  const filteredDealsUsd = useMemo(() => {
    return filteredDeals.reduce((sum, d) => sum + (d.amount_usd || 0), 0);
  }, [filteredDeals]);

  const filteredCircularDeals = useMemo(() => {
    return filteredDeals.filter((d) => d.is_circular);
  }, [filteredDeals]);

  const filteredCircularUsd = useMemo(() => {
    return filteredCircularDeals.reduce((sum, d) => sum + (d.amount_usd || 0), 0);
  }, [filteredCircularDeals]);

  // Escape closes the deal detail panel, and focus stays inside it while it is
  // open: a dialog a keyboard user can tab out of is not a dialog.
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const dealTriggerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!selectedDeal) return undefined;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    // Move focus into the panel so the reader is not left behind it.
    const focusFirst = window.setTimeout(() => {
      const focusable = dialogRef.current?.querySelector<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      (focusable ?? dialogRef.current)?.focus();
    }, 0);

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSelectedDeal(null);
        return;
      }
      if (e.key !== "Tab") return;
      const nodes = dialogRef.current
        ? Array.from(
            dialogRef.current.querySelectorAll<HTMLElement>(
              'button:not([disabled]), [href], input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])',
            ),
          ).filter((node) => node.offsetParent !== null || node === document.activeElement)
        : [];
      if (nodes.length === 0) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.clearTimeout(focusFirst);
      window.removeEventListener("keydown", onKeyDown);
      // Send the reader back where they were.
      (dealTriggerRef.current ?? previouslyFocused)?.focus?.();
    };
  }, [selectedDeal]);

  const modelResult = evaluateBubbleModel(DEFAULT_MODEL_INPUTS);
  const totalDeals = rawDeals.length;
  const totalDisclosedUsd = rawDeals.reduce((sum, d) => sum + (d.amount_usd || 0), 0);
  const totalDisclosedT = (totalDisclosedUsd / 1e12).toFixed(2);

  // 19 Oct 2026 fact-check: the CDS fallback was the stale 187bp. The 5Y Oracle
  // CDS closed at a record 288bp on 15 Oct 2026 (S&P Global Market Intelligence),
  // against an 81bp long-run norm and a 203bp print 90 days earlier.
  const orclCds = DEFAULT_MODEL_INPUTS.cds?.currentBps ?? 288;
  const orclBase = DEFAULT_MODEL_INPUTS.cds?.baselineBps ?? 81;
  const orclStressPct = Math.round(((orclCds - orclBase) / orclBase) * 100);

  /**
   * Figures that used to be typed into the copy, computed instead. A figure
   * that is typed is a figure that rots the moment the pipeline runs.
   */
  const topTenSharePct = (() => {
    const sorted = [...rawDeals].sort((a, b) => (b.amount_usd || 0) - (a.amount_usd || 0));
    const topTen = sorted.slice(0, 10).reduce((sum, d) => sum + (d.amount_usd || 0), 0);
    return totalDisclosedUsd > 0 ? ((topTen / totalDisclosedUsd) * 100).toFixed(1) : "0.0";
  })();
  // The inference-cost collapse, from the live multiple the model publishes:
  // the basis is $30 per 1M tokens, so a multiple of N means the price is 30/N.
  const inferenceDeflationPct = (() => {
    const multiple = DEFAULT_MODEL_INPUTS.adoption?.apiPriceDeclineMultiple ?? 670;
    return (100 * (1 - 1 / multiple)).toFixed(2);
  })();

  // Median price-to-sales across the tracked frontier labs (19 Oct 2026: 29.4×),
  // computed from the same inputs the model scores.
  const psValues = (DEFAULT_MODEL_INPUTS.valuations || [])
    .filter((v) => v.runRateRevenueUsd !== null && (v.runRateRevenueUsd as number) >= 100_000_000)
    .map((v) => v.valuationUsd / (v.runRateRevenueUsd as number))
    .sort((a, b) => a - b);
  const psMid = Math.floor(psValues.length / 2);
  const medianPs =
    psValues.length === 0
      ? 29.4
      : psValues.length % 2 !== 0
      ? psValues[psMid]
      : (psValues[psMid - 1] + psValues[psMid]) / 2;

  const probTone =
    modelResult.band === "critical" || modelResult.band === "high"
      ? "text-risk-700"
      : modelResult.band === "elevated"
      ? "text-caution-700"
      : "text-ink";

  const tabs: { id: VisualTab; label: string; icon: React.ReactNode; shortDesc: string }[] = [
    {
      id: "all",
      label: "All Visualizations",
      icon: <Layers className="w-4 h-4" />,
      shortDesc: "Complete diagnostic series across capital, credit, and multiples",
    },
    {
      id: "capital-wheel",
      label: "Capital Wheel",
      icon: <PieChart className="w-4 h-4 text-cat-teal" />,
      shortDesc: "Radial architecture of the 169-deal ledger by category & debt seniority",
    },
    {
      id: "circular-financing",
      label: "Circular Financing",
      icon: <ShieldAlert className="w-4 h-4 text-caution-700" />,
      shortDesc: "7 counterparty loops ($77.8B disclosed of $2.87T total book)",
    },
    {
      id: "bubble-universe",
      label: "Bubble Universe",
      icon: <CircleDot className="w-4 h-4 text-safe-700" />,
      shortDesc: "169 deals mapped by capital volume and sector",
    },
    {
      id: "sensitivity-sigmoid",
      label: "Sensitivity Sigmoid",
      icon: <Activity className="w-4 h-4 text-risk-700" />,
      shortDesc: "Probability response curve against composite stress",
    },
    {
      id: "frontier-multiples",
      label: "Frontier Lab Multiples",
      icon: <TrendingUp className="w-4 h-4 text-caution-700" />,
      shortDesc: "Private valuation multiples against run-rate revenue",
    },
    {
      id: "capital-composition",
      label: "Capital Composition",
      icon: <PieChart className="w-4 h-4 text-ink-muted" />,
      shortDesc: "Distribution of senior debt versus first-loss equity",
    },
    {
      id: "revenue-gap",
      label: "Revenue Gap & Capex",
      icon: <Scale className="w-4 h-4 text-risk-600" />,
      shortDesc: "Capex deficit, CDS spreads, and inference deflation",
    },
  ];

return (
    <div className="section-sm">
      {/* Top banner ad */}
      <AdSlot placementId="visualize-top" />

      {/* Page head */}
      <header className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
          <span className="label">Charts</span>
          <span className="pill">{totalDeals} deals plotted</span>
          <span className="num text-[14px] text-ink-faint">${totalDisclosedT}T disclosed volume</span>
        </div>

        <h1 className="max-w-reading text-3xl font-bold tracking-tight text-ink sm:text-4xl">
          Visualizing the ${totalDisclosedT}T AI Infrastructure Superstructure
        </h1>

        <p className="prose prose-lead max-w-reading">
          Institutional visual diagnostics tracking the $706B hyperscaler capex gap, private valuation
          multiples, credit default swap contagion, and non-linear bubble burst probability.
        </p>

        <div className="flex flex-wrap items-center gap-2">
          <Link href="/ledger" className="btn btn-primary min-h-11">
            <FileSpreadsheet className="h-4 w-4" aria-hidden="true" />
            <span>Open {totalDeals}-Deal Ledger</span>
            <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
          <Link href="/methodology" className="btn min-h-11">
            <BookOpen className="h-4 w-4" aria-hidden="true" />
            <span>Factor Methodology</span>
          </Link>
        </div>
      </header>

      {/* Macroeconomic KPI band */}
      <dl className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-rule bg-rule md:grid-cols-3 lg:grid-cols-5">
        <div className="bg-surface p-3">
          <dt className="label">Total Capital</dt>
          <dd className="num mt-1 text-xl font-semibold text-ink">${totalDisclosedT}T</dd>
          <dd className="num mt-0.5 truncate text-[14px] text-ink-subtle">
            {totalDeals} verified transactions
          </dd>
        </div>

        <div className="bg-surface p-3">
          <dt className="label">Annual Capex Gap</dt>
          <dd className="num mt-1 text-xl font-semibold text-risk-700">-$706B</dd>
          <dd className="num mt-0.5 text-[14px] text-risk-700">5.4× Outlay</dd>
          <dd className="num mt-0.5 truncate text-[14px] text-ink-subtle">$865B Outlay vs $159B Rev</dd>
        </div>

        <div className="bg-surface p-3">
          <dt className="label">Median AI Multiple</dt>
          <dd className="num mt-1 text-xl font-semibold text-caution-700">{medianPs.toFixed(1)}× P/S</dd>
          <dd className="mt-0.5 text-[14px] text-caution-700">vs 10× SaaS</dd>
          <dd className="mt-0.5 truncate text-[14px] text-ink-subtle">Frontier lab equity stretch</dd>
        </div>

        <div className="bg-surface p-3">
          <dt className="label">Oracle 5Y CDS</dt>
          <dd className="num mt-1 text-xl font-semibold text-risk-700">{orclCds} bp</dd>
          <dd className="num mt-0.5 text-[14px] text-risk-700">+{orclStressPct}% Wide</dd>
          <dd className="mt-0.5 truncate text-[14px] text-ink-subtle">Anchor debt insurance cost</dd>
        </div>

        <div className="col-span-2 bg-surface p-3 md:col-span-1">
          <dt className="label">Burst Probability</dt>
          <dd className={`num mt-1 text-xl font-semibold ${probTone}`}>
            {modelResult.burstProbability.toFixed(1)}%
          </dd>
          <dd className={`num mt-0.5 text-[14px] ${probTone}`}>
            S={modelResult.compositeScore.toFixed(1)} pts
          </dd>
          <dd className="mt-0.5 truncate text-[14px] text-ink-subtle">
            {modelResult.band.toUpperCase()} stress regime
          </dd>
        </div>
      </dl>

      {/* Quiet section switch */}
      <nav aria-label="Visualization sections" className="mt-6 border-b border-rule">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="-mx-1 flex max-w-full items-center gap-1 overflow-x-auto px-1 scrollbar-none">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  aria-pressed={isActive}
                  className={`flex min-h-11 shrink-0 items-center gap-2 whitespace-nowrap border-b-2 px-3 py-2 text-[13px] font-medium transition-colors ${
                    isActive
                      ? "-mb-px border-ink text-ink font-semibold"
                      : "-mb-px border-transparent text-ink-muted hover:border-rule-strong hover:text-ink"
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          <p className="hidden shrink-0 px-2 text-[13px] text-ink-subtle lg:block">
            {tabs.find((t) => t.id === activeTab)?.shortDesc}
          </p>
        </div>
      </nav>

      {/* ── Unified Filter Toolbar: drives Capital Wheel, Treemap, Bubble Universe, and Circular Financing ── */}
      <div className="mt-6 rounded-xl border border-rule bg-surface p-4 shadow-card space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-rule pb-2.5">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-[var(--c-accent)]" aria-hidden="true" />
            <h2 className="text-[14px] font-bold text-ink uppercase tracking-wider">
              Unified Ledger Filter Instrument
            </h2>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="pill text-[12px] font-semibold text-ink">
              Showing {filteredDeals.length} of {totalDeals} records
            </span>
            <span className="num text-[13px] font-mono font-semibold text-ink">
              {formatUsdShort(filteredDealsUsd)}
            </span>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearAllFilters}
                className="btn min-h-[44px] px-3 text-[13px] font-medium text-risk-600 hover:text-risk-700"
              >
                Reset All Filters
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {/* Category Filter */}
          <div className="space-y-1">
            <label htmlFor="filter-cat" className="label block">
              Category ({ALL_CATEGORIES.length - 1} sectors)
            </label>
            <select
              id="filter-cat"
              value={category}
              onChange={(e) => updateFilters({ category: e.target.value })}
              className="select min-h-[44px] w-full rounded-lg border border-rule bg-surface-2 px-3 py-2 text-[13px] font-medium text-ink focus:outline-none focus:ring-2 focus:ring-ink"
            >
              {ALL_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat === "All" ? "All Categories (169 deals)" : cat}
                </option>
              ))}
            </select>
          </div>

          {/* Instrument Filter */}
          <div className="space-y-1">
            <span className="label block">Financing Instrument</span>
            <div className="grid grid-cols-3 gap-1 rounded-lg border border-rule bg-surface-2 p-1">
              {[
                { id: "all", label: "All" },
                { id: "debt", label: "Senior Debt" },
                { id: "equity", label: "Equity" },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => updateFilters({ instrument: opt.id })}
                  aria-pressed={instrument === opt.id}
                  className={`min-h-[44px] rounded-md px-2 text-[12px] font-semibold transition-colors ${
                    instrument === opt.id
                      ? "bg-ink text-canvas shadow-sm"
                      : "text-ink-muted hover:text-ink"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Circularity Filter */}
          <div className="space-y-1">
            <span className="label block">Counterparty Flow</span>
            <div className="grid grid-cols-3 gap-1 rounded-lg border border-rule bg-surface-2 p-1">
              {[
                { id: "all", label: "All" },
                { id: "circular_only", label: "Circular (7)" },
                { id: "non_circular", label: "Open Market" },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => updateFilters({ circular: opt.id })}
                  aria-pressed={circular === opt.id}
                  className={`min-h-[44px] rounded-md px-2 text-[12px] font-semibold transition-colors ${
                    circular === opt.id
                      ? "bg-ink text-canvas shadow-sm"
                      : "text-ink-muted hover:text-ink"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Active Filter Chips strip */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[13px]">
            <span className="label mr-1">Active filters:</span>
            {category !== "All" && (
              <button
                type="button"
                onClick={() => updateFilters({ category: "All" })}
                className="chip min-h-[44px] gap-1 hover:bg-surface-3 transition-colors"
                title="Clear category filter"
              >
                <span>Category: {category}</span>
                <X className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            )}
            {instrument !== "all" && (
              <button
                type="button"
                onClick={() => updateFilters({ instrument: "all" })}
                className="chip min-h-[44px] gap-1 hover:bg-surface-3 transition-colors"
                title="Clear instrument filter"
              >
                <span>Instrument: {instrument === "debt" ? "Senior Debt" : "Equity"}</span>
                <X className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            )}
            {circular !== "all" && (
              <button
                type="button"
                onClick={() => updateFilters({ circular: "all" })}
                className="chip min-h-[44px] gap-1 hover:bg-surface-3 transition-colors"
                title="Clear flow filter"
              >
                <span>Flow: {circular === "circular_only" ? "Circular Only" : "Non-Circular"}</span>
                <X className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* ==================================================================== */}
      {/* 1. THE CAPITAL WHEEL: Radial Architecture of the 169-Deal Ledger */}
      {/* ==================================================================== */}
      {(activeTab === "all" || activeTab === "capital-wheel") && (
        <section id="capital-wheel" className="space-y-4">
          <Reveal>
            <div className="flex flex-col gap-2 border-b border-rule pb-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <PieChart className="w-5 h-5 text-cat-teal" />
                <h2 className="text-xl sm:text-2xl font-bold text-ink">
                  The Capital Wheel: Radial Architecture of the ${totalDisclosedT}T Ledger
                </h2>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="pill text-[13px] font-semibold text-ink">
                  Showing {filteredDeals.length} of {totalDeals} records ({formatUsdShort(filteredDealsUsd)})
                </span>
                {category !== "All" && (
                  <button
                    type="button"
                    onClick={() => updateFilters({ category: "All" })}
                    className="chip text-[12px] flex items-center gap-1 hover:bg-surface-3 transition-colors"
                    title="Clear category filter"
                  >
                    Category: {category} <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          </Reveal>
          <CapitalWheelChart
            deals={filteredDeals as unknown as any}
            selectedCategory={category === "All" ? null : category}
            onSelectCategory={(cat) => updateFilters({ category: cat ?? "All" })}
            onSelectDeal={(d) => setSelectedDeal(d as unknown as Deal)}
          />
        </section>
      )}

      {/* ==================================================================== */}
      {/* 2. CIRCULAR FINANCING: Counterparty Capital Loops */}
      {/* ==================================================================== */}
      {(activeTab === "all" || activeTab === "circular-financing") && (
        <section id="circular-financing" className="space-y-4">
          <Reveal>
            <div className="flex flex-col gap-2 border-b border-rule pb-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-caution-700" />
                <h2 className="text-xl sm:text-2xl font-bold text-ink">
                  Circular Financing: Counterparty Capital Loops
                </h2>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="pill pill-caution text-[13px] font-semibold">
                  Showing {filteredCircularDeals.length} of 7 circular records ({formatUsdShort(filteredCircularUsd)} of $77.8B)
                </span>
              </div>
            </div>
          </Reveal>
          <CircularFinancingChart
            deals={filteredDeals as unknown as any}
            onSelectDeal={(d) => setSelectedDeal(d as unknown as Deal)}
          />
        </section>
      )}

      {/* ==================================================================== */}
      {/* 3. BUBBLE UNIVERSE: Interactive DealBubbleChart Physics Map */}
      {/* ==================================================================== */}
      {(activeTab === "all" || activeTab === "bubble-universe") && (
        <section id="bubble-universe" className="space-y-4">
          <Reveal>
            <div className="flex flex-col gap-2 border-b border-rule pb-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <CircleDot className="w-5 h-5 text-safe-700" />
                <h2 className="text-xl sm:text-2xl font-bold text-ink">
                  Bubble Universe: Interactive Deal Map &amp; Treemap
                </h2>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="pill text-[13px] font-semibold text-ink">
                  Showing {filteredDeals.length} of {totalDeals} records ({formatUsdShort(filteredDealsUsd)})
                </span>
                {category !== "All" && (
                  <button
                    type="button"
                    onClick={() => updateFilters({ category: "All" })}
                    className="chip text-[12px] flex items-center gap-1 hover:bg-surface-3 transition-colors"
                    title="Clear category filter"
                  >
                    Category: {category} <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          </Reveal>

          {/* Interpretation Callout for Bubble Universe */}
          <div className="notice flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start space-x-3.5">
              <div className="p-2.5 rounded-xl bg-safe-500/10 text-safe-700 shrink-0">
                <Target className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[13px] font-semibold tracking-wider uppercase text-safe-700">
                    PORTFOLIO RISK ANALYSIS
                  </span>
                  <span className="text-[14px] text-ink-subtle">• Counterparty Geometry</span>
                </div>
                <h3 className="font-bold text-ink text-sm sm:text-base">
                  Reading the Deal Universe Map
                </h3>
                <p className="text-[14px] sm:text-sm text-ink-muted leading-relaxed max-w-4xl">
                  Analysts examine cluster density and counterparty concentration: the top 10 deals command <strong>{topTenSharePct}%</strong> of the total ${totalDisclosedT} volume.
                  When bubble pods group around vendor-financed take-or-pay capacity agreements (CoreWeave, Oracle, Crusoe), it signals circular capital loops
                  where equity froth is converting into debt service obligations.
                </p>
              </div>
            </div>
            <Link
              href="/ledger"
              className="prose-a flex min-h-11 shrink-0 items-center gap-1 text-[13px] font-semibold"
            >
              <span>Audit Raw Deal Ledger</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Interactive Physics / Treemap / Timeline Chart */}
          <DealBubbleChart
            deals={filteredDeals}
            selectedCategory={category}
            onCategoryChange={(cat) => updateFilters({ category: cat })}
            onSelectDeal={(d) => setSelectedDeal(d)}
          />
        </section>
      )}

      {/* ==================================================================== */}
      {/* 2. SENSITIVITY SIGMOID: Non-Linear Mathematical Response */}
      {/* ==================================================================== */}
      {(activeTab === "all" || activeTab === "sensitivity-sigmoid") && (
        <section id="sensitivity-sigmoid" className="space-y-4">
          <Reveal>
            <div className="flex flex-col gap-2 border-b border-rule pb-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-risk-700" />
                <h2 className="text-xl sm:text-2xl font-bold text-ink">
                  Sensitivity Sigmoid: Non-Linear Fragility &amp; Confidence Bands
                </h2>
              </div>
              <span className="text-[14px] text-ink-subtle">
                Non-linear cubic response curve with the published input-sensitivity range
              </span>
            </div>
          </Reveal>

          {/* Interpretation Callout for Sigmoid Curve */}
          <div className="notice notice-risk flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start space-x-3.5">
              <div className="p-2.5 rounded-xl bg-risk-500/10 text-risk-700 shrink-0">
                <Activity className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[13px] font-semibold tracking-wider uppercase text-risk-700">
                    CONVEX RISK DYNAMICS
                  </span>
                  <span className="text-[14px] text-ink-faint">• Inflection Physics</span>
                </div>
                <h3 className="font-bold text-ink text-sm sm:text-base">
                  Why Fragility Accelerates Past 55 Points
                </h3>
                <p className="text-[15px] text-ink-muted leading-relaxed max-w-4xl">
                  Linear models fail in financial super-cycles because debt refinancing fragility accelerates non-linearly. Below 50 points, liquidity absorbs shocks smoothly.
                  Beyond the 55-point Kelly anchor, probability spikes hyperbolically (moving from 55 to 61.2 points vaults probability from 50.0% to 68.4%).
                  Quantitative desks use first derivative dP/dS to dynamically ramp tail-risk hedge ratios before markets re-price credit illiquidity.
                </p>
              </div>
            </div>
            <Link
              href="/methodology#sigmoid"
              className="prose-a flex min-h-11 shrink-0 items-center gap-1 text-[13px] font-semibold"
            >
              <span>Read Model Math</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Upgraded Cubic Bezier Sensitivity Chart */}
          <SensitivityCurveChart
            currentScore={modelResult.compositeScore}
            currentProb={modelResult.burstProbability}
          />
        </section>
      )}

      {/* ==================================================================== */}
      {/* 3. FRONTIER LAB MULTIPLES: 2D Valuation vs Revenue Scatter Plot */}
      {/* ==================================================================== */}
      {(activeTab === "all" || activeTab === "frontier-multiples") && (
        <section id="frontier-multiples" className="space-y-4">
          <Reveal>
            <div className="flex flex-col gap-2 border-b border-rule pb-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-caution-700" />
                <h2 className="text-xl sm:text-2xl font-bold text-ink">
                  Frontier Lab Multiples: Valuation vs Run-Rate Revenue (2D Scatter)
                </h2>
              </div>
              <span className="text-[14px] text-ink-subtle">
                Valuation vs. revenue scatter (median {medianPs.toFixed(1)}× P/S across tracked labs)
              </span>
            </div>
          </Reveal>

          {/* Interpretation Callout for Multiples */}
          <div className="notice notice-caution flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start space-x-3.5">
              <div className="p-2.5 rounded-xl bg-caution-500/10 text-caution-700 shrink-0">
                <Scale className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[13px] font-semibold tracking-wider uppercase text-caution-700">
                    VALUATION MULTIPLE COMPRESSION
                  </span>
                  <span className="text-[14px] text-ink-faint">• Multiple Compression</span>
                </div>
                <h3 className="font-bold text-ink text-sm sm:text-base">
                  The Impossibility of Sustaining 30×+ P/S at a 5.1% Risk-Free Rate
                </h3>
                <p className="text-[15px] text-ink-muted leading-relaxed max-w-4xl">
                  Frontier labs trade at a {medianPs.toFixed(1)}× median P/S multiple (with labs like Mistral at 53.3× and Perplexity at 40×). Even with OpenAI scaling to $50.0B ARR and Anthropic to $65.0B ARR, justifying these valuations
                  without massive multiple contraction toward the 10× historical SaaS equilibrium requires continuous hypergrowth.
                  In a 5.10% US10Y regime, tech cash flows face severe duration discount penalties whenever growth deceleration hits.
                </p>
              </div>
            </div>
            <Link
              href="/dotcom-vs-ai"
              className="prose-a flex min-h-11 shrink-0 items-center gap-1 text-[13px] font-semibold"
            >
              <span>Compare 2000 vs 2026</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Upgraded 2D Scatter Plot */}
          <LabMultiplesChart />
        </section>
      )}

      {/* Mid-Page In-Feed Sponsored Placement */}
      <AdSlot placementId="visualize-infeed" />

      {/* ==================================================================== */}
      {/* 4. CAPITAL COMPOSITION: Stacked Allocation & Creditor Claims */}
      {/* ==================================================================== */}
      {(activeTab === "all" || activeTab === "capital-composition") && (
        <section id="capital-composition" className="space-y-4">
          <Reveal>
            <div className="flex flex-col gap-2 border-b border-rule pb-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <PieChart className="w-5 h-5 text-ink-muted" />
                <h2 className="text-xl sm:text-2xl font-bold text-ink">
                  Capital Composition: Debt vs Equity in the ${totalDisclosedT} Superstructure
                </h2>
              </div>
              <span className="text-[14px] text-ink-subtle">
                Proportional capital stack: {CAPITAL_SEGMENT_TOTALS.debt.amount} senior debt vs. {CAPITAL_SEGMENT_TOTALS.equity.amount} first-loss equity
              </span>
            </div>
          </Reveal>

          {/* Interpretation Callout for Capital Composition */}
          <div className="p-4 sm:p-5 rounded-lg bg-surface-2/50 bg-surface-2/15 border border-rule/80 border-rule/50 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start space-x-3.5">
              <div className="p-2.5 rounded-xl bg-surface-2 text-ink-muted shrink-0">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[13px] font-semibold tracking-wider uppercase text-ink-muted">
                    CAPITAL STACK SENIORITY
                  </span>
                  <span className="text-[14px] text-ink-faint">• Seniority Hierarchy</span>
                </div>
                <h3 className="font-bold text-ink text-sm sm:text-base">
                  Senior Creditor Claims vs First-Loss Equity Cushions
                </h3>
                <p className="text-[14px] sm:text-sm text-ink-muted leading-relaxed max-w-4xl">
                  Credit desks partition the ${totalDisclosedT} stack into two regimes: {CAPITAL_SEGMENT_TOTALS.equity.amount} in private equity acts as loss-absorbing cushion, but the {CAPITAL_SEGMENT_TOTALS.debt.amount} in borrowed debt
                  (Broadcom, Blackstone, CoreWeave) and {CAPITAL_SEGMENT_TOTALS.compute.amount} in take-or-pay compute leases carry rigid cash interest and delivery penalties.
                  When debt share crosses 8% (it stands at 7.5% today) during an era of 5% terminal rates, default cascades can be triggered even while models remain technically impressive.
                </p>
              </div>
            </div>
            <Link
              href="/ledger?type=debt"
              className="prose-a flex min-h-11 shrink-0 items-center gap-1 text-[13px] font-semibold"
            >
              <span>Inspect {CAPITAL_SEGMENT_TOTALS.debt.amount} Debt Facilities</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Upgraded Stacked Distribution Bar & Category Grid */}
          <CapitalCompositionChart />
        </section>
      )}

      {/* ==================================================================== */}
      {/* 5. REVENUE GAP & CAPEX: Deficit, CDS Spreads & Token Collapse */}
      {/* ==================================================================== */}
      {(activeTab === "all" || activeTab === "revenue-gap") && (
        <section id="revenue-gap" className="space-y-4">
          <Reveal>
            <div className="flex flex-col gap-2 border-b border-rule pb-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <Scale className="w-5 h-5 text-risk-700" />
                <h2 className="text-xl sm:text-2xl font-bold text-ink">
                  Revenue Gap, Credit Default Swaps &amp; Token Price Deflation
                </h2>
              </div>
              <span className="text-[14px] text-ink-subtle">
                -$706B Deficit • {orclCds} bp Oracle CDS • -{inferenceDeflationPct}% Inference Cost
              </span>
            </div>
          </Reveal>

          {/* Interpretation Callout for Revenue Gap & CDS */}
          <div className="notice flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start space-x-3.5">
              <div className="p-2.5 rounded-xl bg-risk-50 bg-risk-50/50 text-risk-700 shrink-0">
                <Flame className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[13px] font-semibold tracking-wider uppercase text-risk-700">
                    CREDIT SPREAD WARNING SIGNAL
                  </span>
                  <span className="text-[14px] text-ink-faint">• Leading Indicator</span>
                </div>
                <h3 className="font-bold text-ink text-sm sm:text-base">
                  Why Credit Default Swaps Precede Equity Deratings
                </h3>
                <p className="text-[14px] sm:text-sm text-ink-muted leading-relaxed max-w-4xl">
                  With hyperscalers and neoclouds deploying $865B on compute and power — $725B guided CY2026 capex (Amazon ~$220B, Alphabet $195–205B, Microsoft ~$175B, Meta $130–145B, Jul 2026 calls) plus a $140B power/depreciation run-rate — against $159B of reported enterprise AI ARR, the $706B annual cash deficit is sustained
                  by Big Tech balance sheets. Bond investors re-price first: Oracle 5Y CDS widening {orclStressPct}% (from {orclBase} bp to {orclCds} bp) signals credit market skepticism.
                  In both 2000 and 2008, credit widening preceded stock market contractions by 3 to 6 months. Conversely, token price collapse (-{inferenceDeflationPct}% input-basis)
                  acts as a critical economic damper that accelerates real-world utility.
                </p>
              </div>
            </div>
            <Link
              href="/companies"
              className="prose-a flex min-h-11 shrink-0 items-center gap-1 text-[13px] font-semibold"
            >
              <span>Examine Oracle CDS History</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Grid of Microeconomic Charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <AiRevenueGapChart />
            <TokenPriceDeflationChart />
          </div>

          {/* Credit Radar & Velocity Surge */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <CdsTrajectoryChart />
            <YearlySurgeChart />
          </div>
        </section>
      )}

      {/* Polymarket Prediction Markets Intelligence */}
      {(activeTab === "all" || activeTab === "sensitivity-sigmoid") && (
        <section className="space-y-3 pt-4 border-t border-rule">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-surface-3" />
              <h2 className="text-lg font-bold text-ink">
                Prediction Market Crowdsourced Intelligence (Polymarket)
              </h2>
            </div>
            <span className="text-[14px] text-ink-subtle">
              Real-Money Volume Weighted Odds
            </span>
          </div>
          <PolymarketCharts />
        </section>
      )}

      {/* Deal Details Modal */}
      {selectedDeal && (
        <div
          className="fixed inset-0 bg-ink/70 z-50 flex items-center justify-center p-4"
          role="presentation"
          onClick={() => setSelectedDeal(null)}
        >
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="deal-detail-heading"
            tabIndex={-1}
            className="bg-surface border border-rule rounded-lg max-w-xl w-full p-6 space-y-5 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedDeal(null)}
              aria-label="Close deal detail"
              className="absolute right-3 top-3 flex h-11 w-11 items-center justify-center rounded-lg text-ink-subtle hover:bg-surface-2 hover:text-ink"
            >
              <X className="w-5 h-5" aria-hidden="true" />
            </button>

            <div className="space-y-1.5">
              <span className="text-[14px] font-mono font-semibold px-2.5 py-1 rounded bg-surface-2 text-ink-muted">
                {selectedDeal.category}
              </span>
              <h2 id="deal-detail-heading" className="text-xl font-bold text-ink leading-snug">
                {selectedDeal.title}
              </h2>
              <div className="num pt-1 text-2xl font-semibold text-safe-700">
                {selectedDeal.amount_display}
              </div>
            </div>

            <p className="panel text-sm leading-relaxed">
              {selectedDeal.description}
            </p>

            <div className="flex items-center justify-between pt-2">
              <Link
                href={`/ledger?search=${encodeURIComponent(selectedDeal.title)}`}
                className="text-[14px] font-mono text-safe-700 hover:underline flex items-center space-x-1"
              >
                <span>View in complete {totalDeals}-deal ledger</span>
                <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
              </Link>
              <button
                onClick={() => setSelectedDeal(null)}
                className="btn min-h-11 text-[14px]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <AdSlot placementId="visualize-bottom" className="mt-8" />

      {/* Where to go next */}
      <section className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-3" aria-label="Next steps">
        <Link href="/ledger" className="card card-flush flex flex-col gap-1 p-4 transition-colors hover:border-rule-strong">
          <span className="label">Raw records</span>
          <span className="text-[15px] font-semibold text-ink">169-deal debt ledger</span>
          <span className="mt-1 text-[14px] text-ink-subtle">
            Every verified debt facility, cluster lease, and strategic round with source filings.
          </span>
          <span className="mt-2 flex items-center gap-1 text-[14px] font-medium text-ink">
            Open ledger
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </span>
        </Link>

        <Link href="/methodology" className="card card-flush flex flex-col gap-1 p-4 transition-colors hover:border-rule-strong">
          <span className="label">Model formula</span>
          <span className="text-[15px] font-semibold text-ink">Factor methodology</span>
          <span className="mt-1 text-[14px] text-ink-subtle">
            The 10-factor mathematical specification, Merton distance-to-default, and stress weights.
          </span>
          <span className="mt-2 flex items-center gap-1 text-[14px] font-medium text-ink">
            Read methodology
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </span>
        </Link>

        <Link href="/prediction-markets" className="card card-flush flex flex-col gap-1 p-4 transition-colors hover:border-rule-strong">
          <span className="label">Live consensus</span>
          <span className="text-[15px] font-semibold text-ink">Prediction-market board</span>
          <span className="mt-1 text-[14px] text-ink-subtle">
            Real-money contract pricing on AI timelines, semiconductor capacity, and company solvency.
          </span>
          <span className="mt-2 flex items-center gap-1 text-[14px] font-medium text-ink">
            View contracts
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </span>
        </Link>
      </section>
    </div>
  );
}

export default function VisualizePage() {
  return (
    <Suspense
      fallback={
        <div className="section-sm">
          <div className="p-12 text-center text-[15px] text-ink-muted">
            Loading visual instruments...
          </div>
        </div>
      }
    >
      <VisualizeContent />
    </Suspense>
  );
}
