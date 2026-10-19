"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowRight, ChevronDown, ExternalLink, Search, Star, X } from "lucide-react";
import { AdSlot } from "@/components/AdSlot";
import { WatchToggle } from "@/components/WatchToggle";
import { useWatchlist } from "@/lib/use-watchlist";
import {
  COMPANIES,
  SECTORS,
  circularTone,
  companyStats,
  formatUsd,
  riskTone,
  sectorSlug,
  type CompanyProfile,
} from "./companyData";
import type { LedgerLink } from "./ledgerSearchTerms";

/**
 * /companies browser.
 *
 * Search, sector, risk and structure filters all read from the query string on
 * arrival, so a link from /markets ("CRWV") or /ledger lands on the right card
 * instead of an unfiltered wall, and the resulting view can be shared.
 *
 * `ledgerLinks` carries the ledger search term for each profile and the number
 * of records that term currently returns (computed on the server from
 * src/data/deals.json). Without it the "N deals" link would search on the
 * display name, which returns nothing for merged profiles such as
 * "Amazon AWS" or "SpaceX / xAI".
 */

interface CompanyBrowserProps {
  /** Server-computed ledger search terms and hit counts, keyed by profile name. */
  ledgerLinks?: Record<string, LedgerLink>;
}

interface CompanyFilters {
  search: string;
  sector: string;
  risk: string;
  structure: string; // all | debt | circular
}

const EMPTY: CompanyFilters = { search: "", sector: "all", risk: "all", structure: "all" };

const RISK_TIERS = ["Critical", "High", "Elevated", "Guarded"] as const;

function fromParams(params: URLSearchParams | null): CompanyFilters {
  if (!params) return { ...EMPTY };
  const sector = params.get("sector") ?? "";
  const risk = params.get("risk") ?? "";
  const structure = (params.get("filter") ?? "").toLowerCase();
  return {
    search: params.get("search") ?? params.get("q") ?? "",
    sector: SECTORS.indexOf(sector as (typeof SECTORS)[number]) !== -1 ? sector : "all",
    risk: RISK_TIERS.indexOf(risk as (typeof RISK_TIERS)[number]) !== -1 ? risk : "all",
    structure:
      structure === "debt" || structure === "circular" ? structure : "all",
  };
}

function matches(company: CompanyProfile, filters: CompanyFilters): boolean {
  if (filters.sector !== "all" && company.sector !== filters.sector) return false;
  if (filters.risk !== "all" && company.riskTier !== filters.risk) return false;
  if (filters.structure === "debt" && !company.debtInvolvedUsd) return false;
  if (filters.structure === "circular" && company.circularRiskLevel.indexOf("Circular") === -1) {
    return false;
  }
  const q = filters.search.trim().toLowerCase();
  if (!q) return true;
  return (
    company.name.toLowerCase().indexOf(q) !== -1 ||
    company.role.toLowerCase().indexOf(q) !== -1 ||
    company.exposureSummary.toLowerCase().indexOf(q) !== -1 ||
    company.circularitySummary.toLowerCase().indexOf(q) !== -1 ||
    (company.ticker ? company.ticker.toLowerCase().indexOf(q) !== -1 : false) ||
    company.sector.toLowerCase().indexOf(q) !== -1 ||
    company.circularityConnections.some((c) => c.toLowerCase().indexOf(q) !== -1) ||
    company.debtTranches.some(
      (t) =>
        t.label.toLowerCase().indexOf(q) !== -1 ||
        (t.creditors ? t.creditors.toLowerCase().indexOf(q) !== -1 : false)
    )
  );
}

/**
 * The listed ticker for a profile, or null when the profile has not listed.
 *
 * The `ticker` field carries two different things: a real exchange symbol
 * ("ORCL", "SPCX (Nasdaq)") and a filing status for a name that has not
 * listed yet ("Private", "Private (S-1 Filed)"). Only the first kind can be
 * watchlisted — a filing status is not a symbol, and none is invented here.
 *
 * The symbol it returns is the plain ticker ("SPCX"), which is also what the
 * /markets board stores, so one name is one key on both pages.
 */
function listedTicker(raw: string | undefined): string | null {
  if (!raw) return null;
  const value = raw.trim();
  if (!value) return null;
  if (/^private\b/i.test(value)) return null;
  const symbol = value.replace(/\s*\([^)]*\)\s*$/, "").trim().toUpperCase();
  if (!/^[A-Z][A-Z0-9.\-]{0,5}$/.test(symbol)) return null;
  return symbol;
}

export default function CompanyBrowser({ ledgerLinks }: CompanyBrowserProps) {
  const params = useSearchParams();
  const initial = useMemo(() => fromParams(params), [params]);

  const [filters, setFilters] = useState<CompanyFilters>(initial);
  const [openId, setOpenId] = useState<string | null>(null);
  const [stuck, setStuck] = useState(false);
  const sentinel = useRef<HTMLDivElement | null>(null);

  /**
   * The shared watchlist — ONE list for the whole site, under the key
   * `aict-watchlist-v1`. A ticker saved on /markets shows as saved here.
   *
   * The filter is deliberately kept out of the URL: the list lives on the
   * reader's device, so a link cannot carry it.
   */
  const { watchlist, isWatched, toggle: toggleTicker } = useWatchlist();
  const [watchOnly, setWatchOnly] = useState(false);

  useEffect(() => {
    const node = sentinel.current;
    if (!node) return;
    const update = () => setStuck(node.getBoundingClientRect().top < 64);
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  // Keep the URL in step with the view.
  const filtersRef = useRef(filters);
  filtersRef.current = filters;
  useEffect(() => {
    const f = filtersRef.current;
    const query = new URLSearchParams();
    if (f.search.trim()) query.set("search", f.search.trim());
    if (f.sector !== "all") query.set("sector", f.sector);
    if (f.risk !== "all") query.set("risk", f.risk);
    if (f.structure !== "all") query.set("filter", f.structure);
    const qs = query.toString();
    const next = qs ? `${window.location.pathname}?${qs}` : window.location.pathname;
    if (next !== `${window.location.pathname}${window.location.search}`) {
      window.history.replaceState(null, "", next);
    }
  }, [filters]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpenId(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const patch = useCallback((next: Partial<CompanyFilters>) => {
    setFilters((prev) => ({ ...prev, ...next }));
  }, []);

  /**
   * The cards on screen: the filters first, then the watchlist filter on
   * top. A profile is only on the list when it has a real ticker — a name
   * that has not listed cannot be saved, so it never appears here.
   */
  const visible = useMemo(() => {
    const base = COMPANIES.filter((c) => matches(c, filters));
    if (!watchOnly) return base;
    return base.filter((c) => {
      const ticker = listedTicker(c.ticker);
      return ticker ? isWatched(ticker) : false;
    });
  }, [filters, watchOnly, watchlist, isWatched]);

  const grouped =
    filters.sector === "all" &&
    filters.risk === "all" &&
    filters.structure === "all" &&
    filters.search.trim() === "" &&
    !watchOnly;

  const groups = useMemo(() => {
    if (!grouped) return [];
    return SECTORS.map((sector) => ({
      sector,
      companies: visible.filter((c) => c.sector === sector),
    })).filter((group) => group.companies.length > 0);
  }, [grouped, visible]);

  const stats = useMemo(() => companyStats(), []);
  const sectorCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    COMPANIES.forEach((c) => {
      counts[c.sector] = (counts[c.sector] ?? 0) + 1;
    });
    return counts;
  }, []);

  /** How many companies are on the reader's watchlist. */
  const savedCount = useMemo(
    () =>
      COMPANIES.filter((c) => {
        const ticker = listedTicker(c.ticker);
        return ticker ? isWatched(ticker) : false;
      }).length,
    [watchlist, isWatched]
  );

  const activeCount =
    (filters.search.trim() ? 1 : 0) +
    (filters.sector !== "all" ? 1 : 0) +
    (filters.risk !== "all" ? 1 : 0) +
    (filters.structure !== "all" ? 1 : 0) +
    (watchOnly ? 1 : 0);

  const visibleVolume = useMemo(
    () => visible.reduce((sum, c) => sum + (c.totalVolumeUsd || 0), 0),
    [visible]
  );

  const chip = (active: boolean) =>
    [
      "chip shrink-0 min-h-11 items-center whitespace-nowrap px-3 transition-colors",
      active
        ? "border-ink bg-ink text-canvas hover:bg-ink-muted hover:border-ink-muted"
        : "hover:border-rule-strong hover:bg-surface-2",
    ].join(" ");

  const renderCard = (company: CompanyProfile) => {
    const open = openId === company.name;
    const panelId = `company-panel-${sectorSlug(company.name)}`;
    // The ledger link searches on a term that actually matches records (the
    // server passes it in with the live count), so the number printed on the
    // card is the number of records the link opens. Merged profiles such as
    // "Amazon AWS" or "SpaceX / xAI" have no display-name match of their own.
    const ledgerLink = ledgerLinks?.[company.name];
    const ledgerTerm = ledgerLink?.term ?? company.name;
    const ledgerCount = ledgerLink?.count ?? company.disclosedDealsCount;
    const dealWord = ledgerCount === 1 ? "deal" : "deals";
    /**
     * Only a listed name can be saved. A profile whose ticker is a filing
     * status ("Private (S-1 Filed)") gets no watchlist button at all, and
     * no ticker is invented for it.
     */
    const watchTicker = listedTicker(company.ticker);
    const saved = watchTicker ? isWatched(watchTicker) : false;
    return (
      <li key={company.name} className="min-w-0">
        <article
          className={`card card-flush h-full transition-colors ${
            open ? "border-rule-strong" : "hover:border-rule-strong"
          }`}
        >
          {/* Head */}
          <div className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="text-[17px] font-bold leading-tight tracking-tight text-ink">
                  {company.name}
                </h3>
                <p className="mt-1 text-[14px] leading-snug text-ink-subtle">{company.role}</p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1.5">
                {company.ticker ? (
                  <span className="num text-[14px] text-ink-muted">{company.ticker}</span>
                ) : null}
                <span className={`pill ${riskTone(company.riskTier)}`}>{company.riskTier}</span>
              </div>
            </div>

            {/* Money, tabular */}
            <dl className="mt-3 grid grid-cols-3 gap-px overflow-hidden rounded-md border border-rule bg-rule">
              <div className="bg-surface-2 px-2.5 py-2">
                <dt className="label text-[13px]">Committed</dt>
                <dd className="num mt-0.5 text-[15px] font-semibold text-ink">
                  {company.totalVolumeUsd > 0 ? formatUsd(company.totalVolumeUsd) : "\u2014"}
                </dd>
                {company.totalVolumeUsd > 0 ? null : (
                  // Both of Constellation's ledger records (the Microsoft and
                  // Meta power purchase agreements) were announced without a
                  // value, so there is nothing to sum — say so rather than
                  // leave a bare dash that reads like missing data.
                  <p className="mt-0.5 text-[12px] leading-tight text-ink-faint">
                    announced, no disclosed value
                  </p>
                )}
              </div>
              <div className="bg-surface-2 px-2.5 py-2">
                <dt className="label text-[13px]">Debt</dt>
                <dd
                  className={`num mt-0.5 text-[15px] font-semibold ${
                    company.debtInvolvedUsd > 0 ? "text-risk-600 dark:text-risk-300" : "text-ink-faint"
                  }`}
                >
                  {company.debtInvolvedUsd > 0 ? formatUsd(company.debtInvolvedUsd) : "None"}
                </dd>
              </div>
              <div className="bg-surface-2 px-2.5 py-2">
                <dt className="label text-[13px]">Multiple</dt>
                <dd className="num mt-0.5 text-[15px] font-semibold text-ink">
                  {company.psMultiple ? `${company.psMultiple}\u00d7` : "n/a"}
                </dd>
              </div>
            </dl>

            <p className="mt-3 text-[14px] leading-relaxed text-ink-muted">
              <span className="text-ink-subtle">Circular risk:</span>{" "}
              <span className={`chip ${circularTone(company.circularRiskLevel)}`}>
                {company.circularRiskLevel}
              </span>
            </p>
          </div>

          {/* Footer: expand + cross-links + the watchlist */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-rule px-4 py-2">
            <button
              type="button"
              onClick={() => setOpenId(open ? null : company.name)}
              aria-expanded={open}
              aria-controls={panelId}
              className="flex min-h-11 items-center gap-1.5 text-[13px] font-medium text-ink transition-colors hover:text-ink-muted"
            >
              {open ? "Hide detail" : `Debt detail (${company.debtTranches.length})`}
              <ChevronDown
                className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`}
                aria-hidden="true"
              />
            </button>
            <div className="flex items-center gap-2">
              {watchTicker ? (
                <WatchToggle
                  ticker={watchTicker}
                  saved={saved}
                  onToggle={toggleTicker}
                />
              ) : null}
              <Link
                href={`/ledger?search=${encodeURIComponent(ledgerTerm)}`}
                className="flex min-h-11 shrink-0 items-center gap-1 text-[13px] font-medium text-ink-muted transition-colors hover:text-ink"
              >
                <span className="num">{ledgerCount}</span> {dealWord}
                <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            </div>
          </div>

          {open ? (
            <div id={panelId} className="border-t border-rule p-4">
              <p className="text-[14px] leading-relaxed text-ink-muted">{company.exposureSummary}</p>

              <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-4">
                <div>
                  <dt className="label">Valuation</dt>
                  <dd className="num text-[14px] text-ink">{formatUsd(company.valuationUsd)}</dd>
                </div>
                <div>
                  <dt className="label">Annual revenue</dt>
                  <dd className="num text-[14px] text-ink">
                    {company.runRateRevenueUsd ? formatUsd(company.runRateRevenueUsd) : "n/a"}
                  </dd>
                </div>
                <div>
                  <dt className="label">Revenue multiple</dt>
                  <dd className="num text-[14px] text-ink">
                    {company.psMultiple ? `${company.psMultiple}\u00d7 P/S` : "n/a"}
                  </dd>
                </div>
                <div>
                  <dt className="label">Sector</dt>
                  <dd className="text-[14px] text-ink">{company.sector}</dd>
                </div>
              </dl>

              <div className="mt-4">
                <p className="label">Debt tranches and facilities</p>
                <ul className="mt-2 space-y-2">
                  {company.debtTranches.map((tranche, index) => (
                    <li key={`${company.name}-${index}`} className="panel p-3">
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-[14px] font-semibold text-ink">{tranche.label}</p>
                        <p className="num shrink-0 text-[14px] font-semibold text-ink">
                          {tranche.amountUsd > 0 ? formatUsd(tranche.amountUsd) : "None"}
                        </p>
                      </div>
                      <p className="mt-1 text-[13px] uppercase tracking-[0.08em] text-ink-faint">
                        {tranche.type}
                        {tranche.creditors ? ` · ${tranche.creditors}` : ""}
                      </p>
                      {tranche.notes ? (
                        <p className="mt-1.5 text-[14px] leading-relaxed text-ink-muted">
                          {tranche.notes}
                        </p>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-4">
                <p className="label">Circular counterparty risk</p>
                <p className="mt-1 text-[14px] leading-relaxed text-ink-muted">
                  {company.circularitySummary}
                </p>
                <p className="mt-1.5 flex flex-wrap gap-1.5">
                  {company.circularityConnections.map((connection) => (
                    <span key={connection} className="chip">
                      {connection}
                    </span>
                  ))}
                </p>
              </div>

              {company.polymarketOdds ? (
                <div className="mt-4 border-t border-rule pt-3 text-[14px]">
                  <p className="label">Prediction market</p>
                  <a
                    href={company.polymarketOdds.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 inline-flex items-center gap-1.5 font-medium text-ink underline decoration-rule underline-offset-4 hover:decoration-ink"
                  >
                    {company.polymarketOdds.marketName} · {company.polymarketOdds.oddsDisplay}
                    <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                  </a>
                </div>
              ) : null}

              <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-rule pt-3">
                <Link
                  href={`/ledger?search=${encodeURIComponent(ledgerTerm)}`}
                  className="btn min-h-11"
                >
                  All {ledgerCount} {dealWord} in the ledger
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
                <Link href="/methodology" className="btn btn-ghost min-h-11">
                  How we score risk
                </Link>
              </div>
            </div>
          ) : null}
        </article>
      </li>
    );
  };

  return (
    <div>
      {/* ── Filters ──────────────────────────────────────────────────────── */}
      <div className="card card-flush">
        <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
          <div className="relative min-w-0 flex-1">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint"
              aria-hidden="true"
            />
            <label htmlFor="companies-search" className="sr-only">
              Search companies, tickers, creditors or tranches
            </label>
            <input
              id="companies-search"
              type="search"
              value={filters.search}
              onChange={(event) => patch({ search: event.target.value })}
              placeholder={`Search ${COMPANIES.length} companies, tickers or creditors`}
              autoComplete="off"
              className="min-h-11 w-full rounded-md border border-rule-strong bg-canvas pl-9 pr-9 text-[15px] text-ink placeholder:text-ink-faint"
            />
            {filters.search ? (
              <button
                type="button"
                onClick={() => patch({ search: "" })}
                className="absolute right-1.5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-md text-ink-subtle transition-colors hover:bg-surface-2 hover:text-ink"
              >
                <X className="h-4 w-4" aria-hidden="true" />
                <span className="sr-only">Clear search</span>
              </button>
            ) : null}
          </div>

          {activeCount ? (
            <button
              type="button"
              onClick={() => {
                setFilters({ ...EMPTY });
                setWatchOnly(false);
              }}
              className="btn min-h-11 shrink-0"
            >
              <X className="h-4 w-4" aria-hidden="true" />
              Clear {activeCount} {activeCount === 1 ? "filter" : "filters"}
            </button>
          ) : null}
        </div>

        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none border-t border-rule px-4 py-2 lg:flex-wrap lg:overflow-x-visible">
          <div className="flex shrink-0 items-center gap-1.5 lg:shrink lg:flex-wrap">
            <span className="label pr-0.5">Sector</span>
            <button
              type="button"
              onClick={() => patch({ sector: "all" })}
              aria-pressed={filters.sector === "all"}
              className={chip(filters.sector === "all")}
            >
              All
              <span className="num opacity-70">{COMPANIES.length}</span>
            </button>
            {SECTORS.map((sector) => (
              <button
                key={sector}
                type="button"
                onClick={() => patch({ sector: filters.sector === sector ? "all" : sector })}
                aria-pressed={filters.sector === sector}
                className={chip(filters.sector === sector)}
              >
                {sector}
                <span className="num opacity-70">{sectorCounts[sector] ?? 0}</span>
              </button>
            ))}
          </div>

          <span className="h-6 w-px shrink-0 bg-rule" aria-hidden="true" />

          <div className="flex shrink-0 items-center gap-1.5 lg:shrink lg:flex-wrap">
            <span className="label pr-0.5">Risk</span>
            <button
              type="button"
              onClick={() => patch({ risk: "all" })}
              aria-pressed={filters.risk === "all"}
              className={chip(filters.risk === "all")}
            >
              All
            </button>
            {RISK_TIERS.map((tier) => (
              <button
                key={tier}
                type="button"
                onClick={() => patch({ risk: filters.risk === tier ? "all" : tier })}
                aria-pressed={filters.risk === tier}
                className={chip(filters.risk === tier)}
              >
                {tier}
                <span className="num opacity-70">
                  {COMPANIES.filter((c) => c.riskTier === tier).length}
                </span>
              </button>
            ))}
          </div>

          <span className="h-6 w-px shrink-0 bg-rule" aria-hidden="true" />

          <div className="flex shrink-0 items-center gap-1.5 lg:shrink lg:flex-wrap">
            <span className="label pr-0.5">Structure</span>
            <button
              type="button"
              onClick={() => patch({ structure: "all" })}
              aria-pressed={filters.structure === "all"}
              className={chip(filters.structure === "all")}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => patch({ structure: filters.structure === "debt" ? "all" : "debt" })}
              aria-pressed={filters.structure === "debt"}
              title="Companies carrying verified debt facilities."
              className={chip(filters.structure === "debt")}
            >
              Has debt
              <span className="num opacity-70">
                {COMPANIES.filter((c) => c.debtInvolvedUsd > 0).length}
              </span>
            </button>
            <button
              type="button"
              onClick={() =>
                patch({ structure: filters.structure === "circular" ? "all" : "circular" })
              }
              aria-pressed={filters.structure === "circular"}
              title="Money funded by a party the buyer then pays back."
              className={chip(filters.structure === "circular")}
            >
              Circular
              <span className="num opacity-70">{stats.circularCount}</span>
            </button>
          </div>

          <span className="h-6 w-px shrink-0 bg-rule" aria-hidden="true" />

          {/* The watchlist — one list for the whole site, shared with /markets. */}
          <div className="flex shrink-0 items-center gap-1.5 lg:shrink lg:flex-wrap">
            <button
              type="button"
              onClick={() => {
                if (savedCount > 0) setWatchOnly((on) => !on);
              }}
              aria-pressed={watchOnly}
              aria-disabled={savedCount === 0}
              title={
                savedCount === 0
                  ? "Save a ticker on a card to build a watchlist"
                  : `Show the ${savedCount} compan${savedCount === 1 ? "y" : "ies"} you saved`
              }
              className={[
                chip(watchOnly),
                savedCount === 0 && !watchOnly ? "cursor-not-allowed text-ink-faint" : "",
              ].join(" ")}
            >
              <Star
                className={`h-3.5 w-3.5 ${watchOnly ? "fill-current" : ""}`}
                aria-hidden="true"
              />
              Watchlist
              <span className="num opacity-70">{savedCount}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Condensed result line, pinned once the filters scroll away */}
      <div ref={sentinel} aria-hidden="true" className="h-px" />
      <div
        className={`sticky top-[82px] z-40 -mx-4 mt-2 hidden border-y border-rule bg-surface/95 px-4 backdrop-blur sm:-mx-6 sm:px-6 md:top-14 ${
          stuck ? "!block" : ""
        }`}
        aria-hidden={!stuck}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 py-2">
          <p className="min-w-0 truncate text-[14px] text-ink-muted">
            <span className="num font-semibold text-ink">
              {visible.length} of {COMPANIES.length}
            </span>{" "}
            companies
            <span aria-hidden="true"> · </span>
            <span className="num">{formatUsd(visibleVolume)}</span> committed
          </p>
          {activeCount ? (
            <button
              type="button"
              onClick={() => {
                setFilters({ ...EMPTY });
                setWatchOnly(false);
              }}
              className="btn btn-ghost min-h-11 shrink-0 px-2 text-[13px]"
              tabIndex={stuck ? 0 : -1}
            >
              Clear
            </button>
          ) : null}
        </div>
      </div>

      {/* ── Results ──────────────────────────────────────────────────────── */}
      <div className="mt-6 flex flex-col gap-1 border-b border-rule pb-2 sm:flex-row sm:items-baseline sm:justify-between">
        <h2 className="text-lg font-bold tracking-tight text-ink">
          {grouped ? "Companies by sector" : "Matching companies"}
        </h2>
        <p className="text-[14px] text-ink-subtle">
          <span className="num text-ink">{visible.length}</span> of{" "}
          <span className="num">{COMPANIES.length}</span> shown ·{" "}
          <span className="num text-ink">{formatUsd(visibleVolume)}</span> committed
        </p>
      </div>

      {visible.length === 0 ? (
        <div className="card mt-4 text-center">
          <p className="text-[15px] font-semibold text-ink">
            {watchOnly
              ? "No saved company matches those filters."
              : "No company matches that search."}
          </p>
          <p className="prose prose-p mx-auto max-w-reading text-[15px]">
            {watchOnly
              ? "Your watchlist holds nothing that clears these filters. Save a ticker on a card, or clear the filters to see all "
              : "Try a shorter term, or clear the filters to see all "}
            {COMPANIES.length} profiles.
          </p>
          <button
            type="button"
            onClick={() => {
              setFilters({ ...EMPTY });
              setWatchOnly(false);
            }}
            className="btn btn-primary mt-4 min-h-11"
          >
            Clear all filters
          </button>
        </div>
      ) : grouped ? (
        <>
          {/* Sector shortcuts */}
          <nav aria-label="Jump to sector" className="mt-1 flex flex-wrap items-center gap-x-2 text-[14px]">
            <span className="label">Jump to</span>
            {groups.map((group) => (
              <a
                key={group.sector}
                href={"#sector-" + sectorSlug(group.sector)}
                className="inline-flex min-h-11 items-center text-ink-muted underline decoration-rule underline-offset-4 transition-colors hover:text-ink hover:decoration-ink"
              >
                {group.sector} <span className="num text-ink-faint">{group.companies.length}</span>
              </a>
            ))}
          </nav>

          {groups.map((group) => (
            <section
              key={group.sector}
              id={`sector-${sectorSlug(group.sector)}`}
              aria-labelledby={`sector-${sectorSlug(group.sector)}-heading`}
              className="mt-8 scroll-mt-28"
            >
              <div className="flex items-baseline justify-between gap-3 border-b border-rule pb-2">
                <h3
                  id={`sector-${sectorSlug(group.sector)}-heading`}
                  className="text-[15px] font-bold tracking-tight text-ink"
                >
                  {group.sector}
                </h3>
                <p className="num text-[14px] text-ink-subtle">
                  {group.companies.length} ·{" "}
                  {formatUsd(group.companies.reduce((s, c) => s + c.totalVolumeUsd, 0))}
                </p>
              </div>
              <ul className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                {group.companies.map(renderCard)}
              </ul>
            </section>
          ))}

          <AdSlot placementId="companies-infeed" className="mt-8" />
        </>
      ) : (
        <ul className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {visible.map(renderCard)}
          <li className="min-w-0 md:col-span-2 xl:col-span-3">
            <AdSlot placementId="companies-infeed" />
          </li>
        </ul>
      )}
    </div>
  );
}