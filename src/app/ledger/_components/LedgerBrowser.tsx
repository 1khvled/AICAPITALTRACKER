"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowRight,
  Check,
  ChevronDown,
  Copy,
  Download,
  FileJson,
  FileSpreadsheet,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { AdSlot } from "@/components/AdSlot";
import { LedgerTimelineChart } from "@/components/LedgerTimelineChart";
import { Reveal } from "@/components/Reveal";
import StickyFilterBar from "./StickyFilterBar";
import {
  categoryCopy,
  categoriesInUse,
  deals as allDeals,
  formatTotal,
  formatUsd,
  getDealMeta,
  sortDateKey,
  statusTone,
  statusesInUse,
  yearsInUse,
  type Deal,
} from "./ledgerData";

type SortField = "date" | "amount" | "company" | "sources";
type SortDirection = "asc" | "desc";

const PAGE_SIZES = [25, 50, 100];

/* ── filter state ─────────────────────────────────────────────────────────── */

interface FilterState {
  search: string;
  type: string;
  year: string;
  status: string;
  debtOnly: boolean;
  computeOnly: boolean;
  circularOnly: boolean;
  megaOnly: boolean;
  sortField: SortField;
  sortDir: SortDirection;
}

const EMPTY_FILTERS: FilterState = {
  search: "",
  type: "all",
  year: "all",
  status: "all",
  debtOnly: false,
  computeOnly: false,
  circularOnly: false,
  megaOnly: false,
  sortField: "date",
  sortDir: "desc",
};

/**
 * Reads the query string once, so links from /companies ("open this company's
 * deals"), /markets ("debt facilities") and shared citations all land on a
 * pre-filtered ledger instead of an unfiltered wall.
 */
function fromParams(params: URLSearchParams | null): { filters: FilterState; dealId: string | null } {
  const filters: FilterState = { ...EMPTY_FILTERS };
  if (!params) return { filters, dealId: null };

  const search = params.get("search") ?? params.get("q") ?? "";
  if (search) filters.search = search;

  const type = params.get("type") ?? params.get("category");
  const filter = (params.get("filter") ?? "").toLowerCase();
  const structure = (type ?? filter).toLowerCase();
  if (structure === "debt") filters.debtOnly = true;
  if (structure === "compute") filters.computeOnly = true;
  if (structure === "circular") filters.circularOnly = true;
  if (structure === "mega" || structure === "megadeal") filters.megaOnly = true;
  if (type && categoriesInUse().indexOf(type) !== -1) filters.type = type;

  const year = params.get("year");
  if (year && yearsInUse().includes(year)) filters.year = year;

  const status = params.get("status");
  if (status && statusesInUse().includes(status)) filters.status = status;

  return { filters, dealId: params.get("deal") };
}

function countActive(filters: FilterState): number {
  let n = 0;
  if (filters.search.trim()) n += 1;
  if (filters.type !== "all") n += 1;
  if (filters.year !== "all") n += 1;
  if (filters.status !== "all") n += 1;
  if (filters.debtOnly) n += 1;
  if (filters.computeOnly) n += 1;
  if (filters.circularOnly) n += 1;
  if (filters.megaOnly) n += 1;
  return n;
}

/* ── the browser ──────────────────────────────────────────────────────────── */

export default function LedgerBrowser() {
  const params = useSearchParams();
  const initial = useMemo(() => fromParams(params), [params]);

  const [filters, setFilters] = useState<FilterState>(initial.filters);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZES[0]);
  const [openIds, setOpenIds] = useState<string[]>(() => (initial.dealId ? [initial.dealId] : []));
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showExtras, setShowExtras] = useState(false);
  const [showTimeline, setShowTimeline] = useState(true);

  // Sticky condensed bar: shown once the real toolbar has scrolled away. A
  // scroll listener is used rather than an IntersectionObserver so that a fast
  // scroll or an in-page anchor jump can never skip the state change.
  const [condensed, setCondensed] = useState(false);
  const toolbarSentinel = useRef<HTMLDivElement | null>(null);
  const toolbarRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const node = toolbarSentinel.current;
    if (!node) return;
    const update = () => setCondensed(node.getBoundingClientRect().top < 64);
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  // Keep the address bar in step so any view can be shared or bookmarked.
  const filtersRef = useRef(filters);
  filtersRef.current = filters;
  const linkedDeal = initial.dealId;
  useEffect(() => {
    const f = filtersRef.current;
    const query = new URLSearchParams();
    if (f.search.trim()) query.set("search", f.search.trim());
    if (f.type !== "all") query.set("type", f.type);
    if (f.year !== "all") query.set("year", f.year);
    if (f.status !== "all") query.set("status", f.status);
    if (f.debtOnly) query.set("filter", "debt");
    if (linkedDeal) query.set("deal", linkedDeal);
    const qs = query.toString();
    const next = qs ? `${window.location.pathname}?${qs}` : window.location.pathname;
    if (next !== `${window.location.pathname}${window.location.search}`) {
      window.history.replaceState(null, "", next);
    }
  }, [filters, linkedDeal]);

  const categories = useMemo(() => categoriesInUse(), []);
  const years = useMemo(() => yearsInUse(), []);
  const statuses = useMemo(() => statusesInUse(), []);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    allDeals.forEach((d) => {
      counts[d.category] = (counts[d.category] ?? 0) + 1;
    });
    return counts;
  }, []);

  const yearCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    allDeals.forEach((d) => {
      counts[String(d.year)] = (counts[String(d.year)] ?? 0) + 1;
    });
    return counts;
  }, []);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    allDeals.forEach((d) => {
      counts[d.status] = (counts[d.status] ?? 0) + 1;
    });
    return counts;
  }, []);

  const flagCounts = useMemo(
    () => ({
      debt: allDeals.filter((d) => d.is_debt).length,
      compute: allDeals.filter((d) => d.is_compute).length,
      circular: allDeals.filter((d) => d.is_circular).length,
      mega: allDeals.filter((d) => d.is_mega).length,
    }),
    []
  );

  const filtered = useMemo(() => {
    const q = filters.search.trim().toLowerCase();
    const list = allDeals.filter((deal) => {
      if (filters.type !== "all" && deal.category !== filters.type) return false;
      if (filters.year !== "all" && String(deal.year) !== filters.year) return false;
      if (filters.status !== "all" && deal.status !== filters.status) return false;
      if (filters.debtOnly && !deal.is_debt) return false;
      if (filters.computeOnly && !deal.is_compute) return false;
      if (filters.circularOnly && !deal.is_circular) return false;
      if (filters.megaOnly && !deal.is_mega) return false;
      if (!q) return true;

      const meta = getDealMeta(deal);
      return (
        deal.title.toLowerCase().includes(q) ||
        deal.description.toLowerCase().includes(q) ||
        deal.amount_display.toLowerCase().includes(q) ||
        deal.category.toLowerCase().includes(q) ||
        deal.status.toLowerCase().includes(q) ||
        meta.primaryCompany.toLowerCase().includes(q) ||
        meta.counterparties.some((cp) => cp.toLowerCase().includes(q))
      );
    });

    const dir = filters.sortDir === "asc" ? 1 : -1;
    return list.sort((a, b) => {
      let cmp = 0;
      if (filters.sortField === "date") cmp = sortDateKey(a.announced_date) - sortDateKey(b.announced_date);
      else if (filters.sortField === "amount") cmp = a.amount_usd - b.amount_usd;
      else if (filters.sortField === "sources") cmp = a.sources_count - b.sources_count;
      else cmp = getDealMeta(a).primaryCompany.localeCompare(getDealMeta(b).primaryCompany);
      if (cmp === 0) cmp = a.id.localeCompare(b.id);
      return cmp * dir;
    });
  }, [filters]);

  // A deal opened from a citation link must be on the first page.
  useEffect(() => {
    if (initial.dealId) setPage(1);
  }, [initial.dealId]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const visible = useMemo(
    () => filtered.slice((safePage - 1) * pageSize, safePage * pageSize),
    [filtered, safePage, pageSize]
  );

  const shownUsd = useMemo(() => filtered.reduce((sum, d) => sum + (d.amount_usd || 0), 0), [filtered]);
  const activeCount = countActive(filters);

  /**
   * The largest disclosure on the page currently in view. The row micro-bars
   * are sized against it, so the column always reads as a share of the
   * biggest deal the reader is looking at — not of the whole $2.87T.
   */
  const maxVisibleAmount = useMemo(
    () => visible.reduce((max, d) => Math.max(max, d.amount_usd || 0), 0),
    [visible]
  );

  const patch = useCallback((next: Partial<FilterState>) => {
    setFilters((prev) => ({ ...prev, ...next }));
    setPage(1);
  }, []);

  const clearAll = useCallback(() => {
    setFilters((prev) => ({ ...EMPTY_FILTERS, sortField: prev.sortField, sortDir: prev.sortDir }));
    setPage(1);
  }, []);

  const toggleCard = useCallback((id: string) => {
    setOpenIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && openIds.length) setOpenIds([]);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openIds]);

  const exportRows = useCallback(() => {
    return filtered.map((d) => {
      const meta = getDealMeta(d);
      return {
        id: d.id,
        entity: meta.primaryCompany,
        counterparties: meta.counterparties.join("; "),
        title: d.title,
        category: d.category,
        status: d.status,
        amount_display: d.amount_display,
        amount_usd: d.amount_usd,
        announced_date: d.announced_date,
        year: d.year,
        is_debt: d.is_debt,
        is_compute: d.is_compute,
        is_circular: d.is_circular,
        is_mega: d.is_mega,
        source_type: d.source_type,
        sources_count: d.sources_count,
        filing_notes: d.description,
      };
    });
  }, [filtered]);

  const download = useCallback((kind: "csv" | "json") => {
    const rows = exportRows();
    const stamp = new Date().toISOString().slice(0, 10);
    const save = (content: string, filename: string, mime: string) => {
      const blob = new Blob([content], { type: mime });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    };

    if (kind === "json") {
      save(
        JSON.stringify(rows, null, 2),
        `ai-capital-ledger-${stamp}.json`,
        "application/json;charset=utf-8"
      );
      return;
    }
    const headers = Object.keys(rows[0] ?? {});
    const escape = (value: unknown) => {
      const text = value === undefined || value === null ? "" : String(value);
      return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
    };
    const csv = [headers.join(","), ...rows.map((row) => headers.map((h) => escape(row[h as keyof typeof row])).join(","))].join("\n");
    save(`\uFEFF${csv}`, `ai-capital-ledger-${stamp}.csv`, "text/csv;charset=utf-8");
  }, [exportRows]);

  const copyCitation = useCallback((deal: Deal) => {
    const meta = getDealMeta(deal);
    const others = meta.counterparties.length ? ` Counterparties: ${meta.counterparties.join(", ")}.` : "";
    const text = `${deal.title} (${deal.announced_date}). Entity: ${meta.primaryCompany}.${others} Disclosed: ${deal.amount_display}. Category: ${categoryCopy(deal.category).label}. Status: ${deal.status}. Evidence: ${deal.source_type}, ${deal.sources_count} source${
      deal.sources_count === 1 ? "" : "s"
    } counted. Ledger record: ${deal.id} at https://aicapitaltracker.com/ledger?deal=${deal.id}`;
    navigator.clipboard?.writeText(text).then(
      () => {
        setCopiedId(deal.id);
        window.setTimeout(() => setCopiedId((cur) => (cur === deal.id ? null : cur)), 2000);
      },
      () => setCopiedId(null)
    );
  }, []);

  const scrollToToolbar = useCallback(() => {
    toolbarRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const chipClass = (active: boolean) =>
    [
      "chip shrink-0 min-h-11 items-center whitespace-nowrap px-3 transition duration-150 active:scale-[0.97]",
      active
        ? "chip-on"
        : "hover:border-rule-strong hover:bg-surface-2",
    ].join(" ");

  return (
    <div>
      {/* ── Toolbar ──────────────────────────────────────────────────────── */}
      <div ref={toolbarRef} className="scroll-mt-28">
        <div className="card card-flush">
          {/* Search + sort + export */}
          <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
            <div className="relative min-w-0 flex-1">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint"
                aria-hidden="true"
              />
              <label htmlFor="ledger-search" className="sr-only">
                Search the ledger by company, counterparty or note
              </label>
              <input
                id="ledger-search"
                type="search"
                value={filters.search}
                onChange={(event) => patch({ search: event.target.value })}
                placeholder="Search company, counterparty or note"
                autoComplete="off"
                className="min-h-11 w-full rounded-md border border-rule-strong bg-canvas pl-9 pr-11 text-[15px] text-ink placeholder:text-ink-faint"
              />
              {filters.search ? (
                <button
                  type="button"
                  onClick={() => patch({ search: "" })}
                  className="absolute right-0 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-md text-ink-subtle transition-colors hover:bg-surface-2 hover:text-ink"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                  <span className="sr-only">Clear search</span>
                </button>
              ) : null}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <label htmlFor="ledger-sort" className="sr-only">
                Sort the ledger
              </label>
              <select
                id="ledger-sort"
                value={`${filters.sortField}-${filters.sortDir}`}
                onChange={(event) => {
                  const [field, dir] = event.target.value.split("-") as [SortField, SortDirection];
                  patch({ sortField: field, sortDir: dir });
                }}
                className="min-h-11 rounded-md border border-rule-strong bg-surface px-2.5 text-[13px] font-medium text-ink"
              >
                <option value="date-desc">Newest first</option>
                <option value="date-asc">Oldest first</option>
                <option value="amount-desc">Largest amount</option>
                <option value="amount-asc">Smallest amount</option>
                <option value="company-asc">Company A to Z</option>
                <option value="sources-desc">Most sources</option>
              </select>

              <button
                type="button"
                onClick={() => download("csv")}
                className="btn min-h-11 px-2.5"
                title="Download the current view as CSV"
              >
                <FileSpreadsheet className="h-4 w-4" aria-hidden="true" />
                <span className="sr-only sm:not-sr-only">CSV</span>
              </button>
              <button
                type="button"
                onClick={() => download("json")}
                className="btn min-h-11 px-2.5"
                title="Download the current view as JSON"
              >
                <FileJson className="h-4 w-4" aria-hidden="true" />
                <span className="sr-only sm:not-sr-only">JSON</span>
              </button>

              <button
                type="button"
                onClick={() => setShowExtras((v) => !v)}
                aria-expanded={showExtras}
                className="btn min-h-11"
              >
                <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
                More filters
                <ChevronDown
                  className={`h-3.5 w-3.5 transition-transform ${showExtras ? "rotate-180" : ""}`}
                  aria-hidden="true"
                />
              </button>
            </div>
          </div>

          {/* ONE compact filter row: type, then year, then status. It scrolls
              inside its own container, so nothing can push the page sideways. */}
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none border-t border-rule px-4 py-2 lg:flex-wrap lg:overflow-x-visible">
            <div className="flex shrink-0 items-center gap-1.5 lg:shrink lg:flex-wrap">
              <span className="label pr-0.5">Type</span>
              <button
                type="button"
                onClick={() => patch({ type: "all" })}
                aria-pressed={filters.type === "all"}
                className={chipClass(filters.type === "all")}
              >
                All
                <span className="num opacity-70">{allDeals.length}</span>
              </button>
              {categories.map((id) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => patch({ type: filters.type === id ? "all" : id })}
                  aria-pressed={filters.type === id}
                  title={categoryCopy(id).gloss}
                  className={chipClass(filters.type === id)}
                >
                  {categoryCopy(id).label}
                  <span className="num opacity-70">{categoryCounts[id] ?? 0}</span>
                </button>
              ))}
            </div>

            <span className="h-6 w-px shrink-0 bg-rule" aria-hidden="true" />

            <div className="flex shrink-0 items-center gap-1.5 lg:shrink lg:flex-wrap">
              <span className="label pr-0.5">Year</span>
              <button
                type="button"
                onClick={() => patch({ year: "all" })}
                aria-pressed={filters.year === "all"}
                className={chipClass(filters.year === "all")}
              >
                All
              </button>
              {years.map((year) => (
                <button
                  key={year}
                  type="button"
                  onClick={() => patch({ year: filters.year === year ? "all" : year })}
                  aria-pressed={filters.year === year}
                  className={chipClass(filters.year === year)}
                >
                  <span className="num">{year}</span>
                  <span className="num opacity-70">{yearCounts[year] ?? 0}</span>
                </button>
              ))}
            </div>

            <span className="h-6 w-px shrink-0 bg-rule" aria-hidden="true" />

            <div className="flex shrink-0 items-center gap-1.5 lg:shrink lg:flex-wrap">
              <span className="label pr-0.5">Status</span>
              <button
                type="button"
                onClick={() => patch({ status: "all" })}
                aria-pressed={filters.status === "all"}
                className={chipClass(filters.status === "all")}
              >
                All
              </button>
              {statuses.map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => patch({ status: filters.status === status ? "all" : status })}
                  aria-pressed={filters.status === status}
                  className={chipClass(filters.status === status)}
                >
                  {status}
                  <span className="num opacity-70">{statusCounts[status] ?? 0}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Secondary filters, hidden until asked for */}
          {showExtras ? (
            <div className="border-t border-rule p-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="label">Structure</span>
                {[
                  { key: "debtOnly" as const, label: "Debt only", count: flagCounts.debt, hint: "Loans and bonds that must be repaid." },
                  { key: "computeOnly" as const, label: "Compute capacity", count: flagCounts.compute, hint: "Promises to buy cloud or chip capacity." },
                  { key: "circularOnly" as const, label: "Circular financing", count: flagCounts.circular, hint: "Money funded by a party the buyer then pays back." },
                  { key: "megaOnly" as const, label: "$10B+ only", count: flagCounts.mega, hint: "Single commitments of ten billion dollars or more." },
                ].map((flag) => {
                  const active = filters[flag.key];
                  return (
                    <button
                      key={flag.key}
                      type="button"
                      title={flag.hint}
                      aria-pressed={active}
                      onClick={() => patch({ [flag.key]: !active })}
                      className={chipClass(active)}
                    >
                      {flag.label}
                      <span className="num opacity-70">{flag.count}</span>
                    </button>
                  );
                })}
              </div>
              <p className="mt-3 text-[14px] text-ink-subtle">
                Every row here is sourced: {allDeals.length} transactions carrying{" "}
                <span className="num">{allDeals.reduce((sum, d) => sum + (d.sources_count || 0), 0)}</span>{" "}
                counted primary sources.{" "}
                <Link
                  href="/methodology"
                  className="font-medium text-ink underline decoration-rule underline-offset-4 hover:decoration-ink"
                >
                  How we verify a deal
                </Link>
              </p>
            </div>
          ) : null}
        </div>
      </div>

      <div ref={toolbarSentinel} aria-hidden="true" className="h-px" />

      {/* ── Sticky condensed bar ─────────────────────────────────────────── */}
      <StickyFilterBar
        visible={condensed}
        resultLabel={`${filtered.length} of ${allDeals.length} deals`}
        amountLabel={formatTotal(shownUsd)}
        activeCount={activeCount}
        summary={[
          filters.search.trim() ? `“${filters.search.trim()}”` : null,
          filters.type !== "all" ? categoryCopy(filters.type).label : null,
          filters.year !== "all" ? filters.year : null,
          filters.status !== "all" ? filters.status : null,
          filters.debtOnly ? "Debt" : null,
          filters.computeOnly ? "Compute" : null,
          filters.circularOnly ? "Circular" : null,
          filters.megaOnly ? "$10B+" : null,
        ]
          .filter(Boolean)
          .join(" · ")}
        onOpenFilters={() => {
          setShowExtras(true);
          scrollToToolbar();
        }}
        onClear={clearAll}
      />

      {/* ── Capital timeline (collapsible) ───────────────────────────────── */}
      <section className="mt-4" aria-label="Disclosed capital by year">
        <button
          type="button"
          onClick={() => setShowTimeline((v) => !v)}
          aria-expanded={showTimeline}
          className="flex min-h-11 w-full items-center justify-between gap-3 text-left"
        >
          <span className="label">Capital by year</span>
          <span className="flex items-center gap-1.5 text-[14px] font-medium text-ink-muted">
            {showTimeline ? "Hide" : "Show"}
            <ChevronDown
              className={`h-4 w-4 transition-transform ${showTimeline ? "rotate-180" : ""}`}
              aria-hidden="true"
            />
          </span>
        </button>
        {showTimeline ? (
          <div className="mt-1">
            <LedgerTimelineChart
              deals={allDeals}
              selectedYear={filters.year}
              onSelectYear={(year) => patch({ year: filters.year === year ? "all" : year })}
            />
          </div>
        ) : null}
      </section>

      {/* ── Results ──────────────────────────────────────────────────────── */}
      <div className="mt-6 flex flex-col gap-2 border-b border-rule pb-2 sm:flex-row sm:items-baseline sm:justify-between">
        <h2 className="text-lg font-bold tracking-tight text-ink">
          {activeCount ? "Filtered deals" : "Every tracked deal"}
        </h2>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[14px] text-ink-subtle">
          <span>
            <span className="num text-ink">{filtered.length}</span> of{" "}
            <span className="num">{allDeals.length}</span> deals
          </span>
          <span aria-hidden="true">·</span>
          <span>
            <span className="num text-ink">{formatTotal(shownUsd)}</span> disclosed
          </span>
          {activeCount ? (
            <button type="button" onClick={clearAll} className="btn btn-ghost min-h-11 px-2 text-[13px]">
              <X className="h-3.5 w-3.5" aria-hidden="true" />
              Clear {activeCount} {activeCount === 1 ? "filter" : "filters"}
            </button>
          ) : null}
        </div>
      </div>

      {visible.length === 0 ? (
        <div className="card mt-4 text-center">
          <p className="text-[15px] font-semibold text-ink">No deals match those filters.</p>
          <p className="prose prose-p mx-auto max-w-reading text-[15px]">
            Try a shorter search, or clear the filters and start from the full list of{" "}
            <span className="num">{allDeals.length}</span> transactions.
          </p>
          <button type="button" onClick={clearAll} className="btn btn-primary mt-4 min-h-11">
            Clear all filters
          </button>
        </div>
      ) : (
        <ul className="mt-4 space-y-2">
          {visible.map((deal, index) => {
            const meta = getDealMeta(deal);
            const open = openIds.includes(deal.id);
            const panelId = `ledger-panel-${deal.id}`;
            // The micro-bar is a share of the biggest disclosure on screen.
            const barPct =
              maxVisibleAmount > 0 && deal.amount_usd > 0
                ? Math.max(2, Math.round((deal.amount_usd / maxVisibleAmount) * 100))
                : 0;
            const barTone = deal.is_debt ? "bg-risk-500" : "bg-safe-500";
            const amountBlock = (
              <>
                <span className="num block text-[17px] font-semibold leading-tight text-ink">
                  {deal.amount_usd > 0 ? deal.amount_display : "Not disclosed"}
                </span>
                <span className="num mt-0.5 block text-[14px] text-ink-faint">
                  {deal.amount_usd > 0 ? `${formatUsd(deal.amount_usd)} · ` : ""}
                  {deal.sources_count} {deal.sources_count === 1 ? "source" : "sources"}
                </span>
                {/* Size of this deal against the largest one in view. */}
                <span className="mt-1.5 block h-1 w-full bg-surface-3" aria-hidden="true">
                  <span
                    className={`bar-grow block h-1 ${barTone}`}
                    style={{
                      width: `${barPct}%`,
                      transitionDelay: `${Math.min(index, 12) * 30}ms`,
                    }}
                  />
                </span>
              </>
            );
            return (
              <li key={deal.id}>
                {index === 10 ? <AdSlot placementId="ledger-infeed" className="my-2" /> : null}
                {index === 40 ? <AdSlot placementId="ledger-mid" className="my-2" /> : null}
                <Reveal
                  as="article"
                  className={`card card-flush group relative card-lift ${
                    open ? "border-rule-strong" : "hover:border-rule-strong"
                  }`}
                >
                  {/* The rail: a rule that lights in the row's own tone on
                      hover. Absolutely positioned, so it never moves a
                      single pixel of the row. */}
                  <span
                    aria-hidden="true"
                    className={`pointer-events-none absolute inset-y-0 left-0 w-[3px] bg-rule transition-colors duration-150 ${
                      deal.is_debt ? "group-hover:bg-risk-500" : "group-hover:bg-safe-500"
                    }`}
                  />
                  <h3>
                    <button
                      type="button"
                      onClick={() => toggleCard(deal.id)}
                      aria-expanded={open}
                      aria-controls={panelId}
                      className="flex w-full items-start gap-3 p-4 text-left"
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block text-[15px] font-semibold leading-snug text-ink">
                          {deal.title}
                        </span>
                        <span className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[14px] text-ink-subtle">
                          <span className="num">{deal.announced_date}</span>
                          <span aria-hidden="true">·</span>
                          <span className="font-medium text-ink-muted">{meta.primaryCompany}</span>
                          {meta.counterparties.length ? (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="truncate">with {meta.counterparties.join(", ")}</span>
                            </>
                          ) : null}
                        </span>
                        <span className="mt-2 flex flex-wrap items-center gap-1.5">
                          <span className="pill">{categoryCopy(deal.category).label}</span>
                          <span className={`pill ${statusTone(deal.status)}`}>{deal.status}</span>
                          {deal.is_debt && deal.category !== "Borrowed" ? (
                            <span className="chip chip-caution">Debt</span>
                          ) : null}
                          {deal.is_compute && !deal.category.toLowerCase().includes("compute") ? (
                            <span className="chip">Compute</span>
                          ) : null}
                          {deal.is_circular ? <span className="chip chip-risk">Circular</span> : null}
                          {deal.is_mega ? <span className="chip chip-caution">$10B+</span> : null}
                        </span>
                      <span className="mt-2 block sm:hidden">{amountBlock}</span>
                      </span>

                      <span className="hidden shrink-0 text-right sm:block sm:w-28">
                        {amountBlock}
                      </span>

                      <ChevronDown
                        className={`mt-0.5 h-4 w-4 shrink-0 text-ink-faint transition-transform ${
                          open ? "rotate-180" : ""
                        }`}
                        aria-hidden="true"
                      />
                    </button>
                  </h3>

                  {open ? (
                    <div id={panelId} className="border-t border-rule p-4">
                      <p className="prose prose-p mt-0 text-[15px]">{deal.description}</p>

                      {/* Evidence, first class */}
                      <div className="panel mt-4">
                        <p className="notice-title">Evidence</p>
                        <dl className="mt-2 grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-3">
                          <div>
                            <dt className="label">Source type</dt>
                            <dd className="text-[14px] text-ink">{deal.source_type}</dd>
                          </div>
                          <div>
                            <dt className="label">Sources counted</dt>
                            <dd className="num text-[14px] text-ink">{deal.sources_count}</dd>
                          </div>
                          <div>
                            <dt className="label">Ledger record</dt>
                            <dd className="num text-[14px] text-ink">{deal.id}</dd>
                          </div>
                        </dl>
                        <p className="mt-2.5 flex items-start gap-2 text-[14px] text-ink-subtle">
                          <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-safe-500" aria-hidden="true" />
                          <span>
                            Verification here means primary institutional sources: regulatory filings,
                            prospectuses and counterpart disclosures. Full filing notes are in the
                            record above and in the export.
                          </span>
                        </p>
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => copyCitation(deal)}
                            className="btn min-h-11"
                          >
                            {copiedId === deal.id ? (
                              <Check className="h-4 w-4" aria-hidden="true" />
                            ) : (
                              <Copy className="h-4 w-4" aria-hidden="true" />
                            )}
                            {copiedId === deal.id ? "Citation copied" : "Copy citation"}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const blob = new Blob([JSON.stringify({ ...deal, entity: meta.primaryCompany, counterparties: meta.counterparties }, null, 2)], {
                                type: "application/json;charset=utf-8",
                              });
                              const url = URL.createObjectURL(blob);
                              const link = document.createElement("a");
                              link.href = url;
                              link.download = `${deal.id}.json`;
                              document.body.appendChild(link);
                              link.click();
                              document.body.removeChild(link);
                              URL.revokeObjectURL(url);
                            }}
                            className="btn min-h-11"
                          >
                            <Download className="h-4 w-4" aria-hidden="true" />
                            Download record
                          </button>
                        </div>
                      </div>

                      {/* Roles */}
                      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                          <p className="label">Who this is about</p>
                          <p className="mt-1 text-[14px] text-ink-muted">
                            <span className="font-semibold text-ink">{meta.primaryCompany}</span>
                            {meta.counterparties.length ? (
                              <>
                                {" "}financing {meta.counterparties.join(", ")}
                              </>
                            ) : (
                              <> · direct bilateral disclosure</>
                            )}
                          </p>
                        </div>
                        <div>
                          <p className="label">What it is</p>
                          <p className="mt-1 text-[14px] text-ink-muted">
                            {categoryCopy(deal.category).gloss}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-rule pt-3">
                        <Link
                          href={`/companies?search=${encodeURIComponent(meta.primaryCompany)}`}
                          className="btn min-h-11"
                        >
                          {meta.primaryCompany} profile
                          <ArrowRight className="h-4 w-4" aria-hidden="true" />
                        </Link>
                        <Link href="/methodology" className="btn btn-ghost min-h-11">
                          How we verify
                        </Link>
                      </div>
                    </div>
                  ) : null}
                </Reveal>
              </li>
            );
          })}
        </ul>
      )}

      {/* ── Pagination ───────────────────────────────────────────────────── */}
      {filtered.length > pageSize ? (
        <nav className="mt-6 flex flex-col items-center gap-3 border-t border-rule pt-4 sm:flex-row sm:justify-between">
          <div className="flex items-center gap-2 text-[14px] text-ink-subtle">
            <span className="num">
              {(safePage - 1) * pageSize + 1}–{Math.min(safePage * pageSize, filtered.length)}
            </span>
            <span>of</span>
            <span className="num">{filtered.length}</span>
            <label htmlFor="ledger-pagesize" className="sr-only">
              Results per page
            </label>
            <select
              id="ledger-pagesize"
              value={pageSize}
              onChange={(event) => {
                setPageSize(Number(event.target.value));
                setPage(1);
              }}
              className="min-h-11 rounded-md border border-rule-strong bg-surface px-2 text-[13px] text-ink"
            >
              {PAGE_SIZES.map((size) => (
                <option key={size} value={size}>
                  {size} per page
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={safePage === 1}
              className="btn min-h-11 disabled:opacity-40"
            >
              Previous
            </button>
            <span className="num text-[14px] text-ink-subtle">
              Page {safePage} / {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage === totalPages}
              className="btn min-h-11 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </nav>
      ) : null}
    </div>
  );
}