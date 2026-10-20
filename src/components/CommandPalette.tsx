"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname, useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, CornerDownLeft, Search, X } from "lucide-react";

/**
 * Global command palette.
 *
 * One keyboard entry point for a site with four content graphs: pages,
 * company profiles, ledger facilities and market tickers. The index is built on
 * the server (src/lib/palette-index.ts) and handed down as props, so the model
 * engine and the raw data files never ship to the browser.
 *
 * Behaviour:
 *   - ⌘K / Ctrl+K opens it from anywhere; "/" opens it when the reader is not
 *     typing in a field.
 *   - ↑ ↓ move the selection, Enter opens it, Escape closes it.
 *   - The list is a combobox with `aria-activedescendant`, so the input keeps
 *     focus and the selection is announced.
 *   - Every number shown comes from the index; the palette never computes a
 *     figure of its own.
 */

export interface PaletteItem {
  /** Stable key for React and for the DOM id. */
  id: string;
  /** What the reader sees. */
  label: string;
  /** One line of context under the label. */
  sub?: string;
  /** Group heading: Pages, Companies, Ledger, Markets. */
  group: string;
  /** Where the item leads. */
  href: string;
  /** Extra terms that should match but are not displayed. */
  keywords?: string;
  /** Default ordering inside a group (lower first). */
  order?: number;
}

const GROUP_ORDER = ["Pages", "Companies", "Ledger", "Markets"];
const MAX_RESULTS = 36;

/**
 * The event any surface can fire to open the palette (the mobile action bar
 * uses it, because the keyboard shortcut does not exist on a phone).
 */
export const OPEN_PALETTE_EVENT = "aict:open-palette";

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9$%.&/-]+/g, " ")
    .trim();
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Ranking. An exact label beats a prefix, a prefix beats a word hit, a word hit
 * beats a substring, and keywords sit below the visible label so a ticker never
 * outranks the company it belongs to.
 */
function scoreItem(item: PaletteItem, query: string): number {
  if (!query) return 1;
  const label = normalize(item.label);
  const keywords = normalize(item.keywords ?? "");
  const sub = normalize(item.sub ?? "");

  if (label === query) return 1000;
  if (label.startsWith(query)) return 900 - Math.min(label.length, 60);
  if (keywords.startsWith(query)) return 700 - Math.min(keywords.indexOf(query), 60);
  if (new RegExp(`\\b${escapeRegExp(query)}`).test(label)) return 600;
  if (label.includes(query)) return 500;
  if (keywords.includes(query)) return 300;
  if (sub.includes(query)) return 200;
  return 0;
}

function groupRank(group: string): number {
  const index = GROUP_ORDER.indexOf(group);
  return index === -1 ? GROUP_ORDER.length : index;
}

export function CommandPalette() {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [mounted, setMounted] = useState(false);
  /**
   * The search index is NOT inlined into every page — it is fetched from
   * /api/palette the first time the palette opens. Inlining it cost every
   * route tens of kilobytes of RSC payload for a panel most readers never open.
   */
  const [items, setItems] = useState<PaletteItem[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const listRef = useRef<HTMLUListElement | null>(null);
  const loadedRef = useRef(false);

  useEffect(() => setMounted(true), []);

  const results = useMemo(() => {
    const query_ = normalize(query);
    const scored = items
      .map((item, index) => ({ item, index, score: scoreItem(item, query_) }))
      .filter((entry) => entry.score > 0);

    scored.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      const groupDiff = groupRank(a.item.group) - groupRank(b.item.group);
      if (groupDiff !== 0) return groupDiff;
      const orderDiff = (a.item.order ?? a.index) - (b.item.order ?? b.index);
      if (orderDiff !== 0) return orderDiff;
      return a.item.label.localeCompare(b.item.label);
    });

    return scored.slice(0, MAX_RESULTS).map((entry) => entry.item);
  }, [items, query]);

  /** Grouped view of the flat result list, in the same order. */
  const grouped = useMemo(() => {
    const groups: { group: string; rows: PaletteItem[] }[] = [];
    for (const item of results) {
      const last = groups[groups.length - 1];
      if (last && last.group === item.group) last.rows.push(item);
      else groups.push({ group: item.group, rows: [item] });
    }
    return groups;
  }, [results]);

  const openPalette = useCallback(() => {
    setOpen(true);
    setQuery("");
    setActiveIndex(0);
    // Fetch the index once, the first time the palette opens.
    if (!loadedRef.current) {
      loadedRef.current = true;
      setLoading(true);
      fetch("/api/palette")
        .then((response) => (response.ok ? response.json() : { items: [] }))
        .then((payload: { items?: PaletteItem[] }) => setItems(payload.items ?? []))
        .catch(() => setItems([]))
        .finally(() => setLoading(false));
    }
  }, []);

  const closePalette = useCallback(() => {
    setOpen(false);
    setQuery("");
    setActiveIndex(0);
    // Send the reader back to where they were.
    triggerRef.current?.focus();
  }, []);

  // The mobile action bar (and anything else) can open the palette.
  useEffect(() => {
    const onRequest = () => openPalette();
    window.addEventListener(OPEN_PALETTE_EVENT, onRequest);
    return () => window.removeEventListener(OPEN_PALETTE_EVENT, onRequest);
  }, [openPalette]);

  // Global shortcuts: ⌘K / Ctrl+K anywhere, "/" when not typing in a field.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const typing =
        !!target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable);

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        if (open) closePalette();
        else openPalette();
        return;
      }

      if (event.key === "/" && !typing && !open && !event.metaKey && !event.ctrlKey) {
        event.preventDefault();
        openPalette();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, openPalette, closePalette]);

  // A route change closes the palette (the reader has arrived somewhere).
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Move the focus into the field when the palette opens.
  useEffect(() => {
    if (!open) return undefined;
    const id = window.setTimeout(() => inputRef.current?.focus(), 0);
    return () => window.clearTimeout(id);
  }, [open]);

  // The page behind must not scroll while the palette is open.
  useEffect(() => {
    if (!open) return undefined;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  // Keep the selected row inside the scroll window.
  useEffect(() => {
    if (!open || !listRef.current) return;
    const node = listRef.current.querySelector<HTMLElement>(`[data-index="${activeIndex}"]`);
    node?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, open]);

  const choose = useCallback(
    (item: PaletteItem) => {
      setOpen(false);
      setQuery("");
      router.push(item.href);
    },
    [router],
  );

  const onPanelKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) => (results.length ? (index + 1) % results.length : 0));
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) =>
        results.length ? (index - 1 + results.length) % results.length : 0,
      );
      return;
    }
    if (event.key === "Enter") {
      event.preventDefault();
      const item = results[activeIndex];
      if (item) choose(item);
      return;
    }
    if (event.key === "Escape") {
      event.preventDefault();
      closePalette();
      return;
    }
    if (event.key === "Tab") {
      // One focus stop: the field. The palette is a single-purpose overlay.
      event.preventDefault();
      inputRef.current?.focus();
    }
  };

  const flatIndex = new Map<string, number>();
  results.forEach((item, index) => flatIndex.set(item.id, index));

  let runningIndex = -1;

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={openPalette}
        aria-label="Search the tracker"
        title="Search — ⌘K"
        className="flex h-11 items-center gap-2 rounded-md border border-white/15 px-2.5 text-[13px] font-medium text-header-muted transition-colors hover:bg-white/5 hover:text-white md:px-3"
      >
        <Search className="h-4 w-4 shrink-0" aria-hidden="true" />
        <span className="hidden md:inline">Search</span>
        <kbd className="hidden rounded border border-white/15 px-1.5 py-0.5 font-mono text-[12px] leading-none text-header-muted md:inline">
          ⌘K
        </kbd>
      </button>

      {mounted && open
        ? createPortal(
            <div
              className="fixed inset-0 z-[70] flex justify-center px-4"
              onMouseDown={(event) => {
                if (event.target === event.currentTarget) closePalette();
              }}
            >
              <div
                role="dialog"
                aria-modal="true"
                aria-label="Search the tracker"
                onKeyDown={onPanelKeyDown}
                className="mt-[10vh] flex max-h-[70vh] w-full max-w-xl flex-col overflow-hidden rounded-lg border border-rule bg-surface shadow-float"
              >
                <div className="flex items-center gap-2 border-b border-rule px-3">
                  <Search className="h-4 w-4 shrink-0 text-ink-faint" aria-hidden="true" />
                  <input
                    ref={inputRef}
                    type="text"
                    role="combobox"
                    aria-expanded="true"
                    aria-controls="palette-listbox"
                    aria-autocomplete="list"
                    aria-activedescendant={
                      results[activeIndex] ? `palette-option-${results[activeIndex].id}` : undefined
                    }
                    aria-label="Search pages, companies, ledger facilities and tickers"
                    placeholder="Search pages, companies, deals and tickers"
                    value={query}
                    onChange={(event) => {
                      setQuery(event.target.value);
                      setActiveIndex(0);
                    }}
                    className="h-12 min-w-0 flex-1 bg-transparent text-[15px] text-ink outline-none placeholder:text-ink-faint"
                  />
                  {query ? (
                    <button
                      type="button"
                      onClick={() => {
                        setQuery("");
                        setActiveIndex(0);
                        inputRef.current?.focus();
                      }}
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-ink-subtle transition-colors hover:bg-surface-2 hover:text-ink"
                      aria-label="Clear search"
                    >
                      <X className="h-4 w-4" aria-hidden="true" />
                    </button>
                  ) : null}
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
                  {loading && items.length === 0 ? (
                    <div className="px-4 py-8 text-center">
                      <p className="text-[14px] font-semibold text-ink">Loading the index…</p>
                      <p className="mt-1 text-[14px] text-ink-subtle">
                        Pages, companies, ledger facilities and tickers, in one list.
                      </p>
                    </div>
                  ) : results.length === 0 ? (
                    <div className="px-4 py-8 text-center">
                      <p className="text-[14px] font-semibold text-ink">
                        Nothing matches “{query.trim()}”
                      </p>
                      <p className="mt-1 text-[14px] text-ink-subtle">
                        Try a ticker, a company name or a counterparty — CoreWeave, Oracle, Broadcom.
                      </p>
                    </div>
                  ) : (
                    <ul id="palette-listbox" role="listbox" ref={listRef} aria-label="Search results">
                      {grouped.map((group) => (
                        <li key={group.group} role="presentation">
                          <p className="label px-4 pb-1 pt-3" aria-hidden="true">
                            {group.group}
                          </p>
                          <ul role="presentation">
                            {group.rows.map((item) => {
                              runningIndex += 1;
                              const index = runningIndex;
                              const selected = index === activeIndex;
                              return (
                                <li
                                  key={item.id}
                                  id={`palette-option-${item.id}`}
                                  role="option"
                                  aria-selected={selected}
                                  data-index={index}
                                  onMouseEnter={() => setActiveIndex(index)}
                                  onClick={() => choose(item)}
                                  className={[
                                    "flex cursor-pointer items-center justify-between gap-3 px-4 py-2.5 transition-colors",
                                    selected ? "bg-surface-2" : "bg-transparent",
                                  ].join(" ")}
                                >
                                  <span className="min-w-0">
                                    <span className="block truncate text-[14px] font-medium text-ink">
                                      {item.label}
                                    </span>
                                    {item.sub ? (
                                      <span className="block truncate text-[13px] text-ink-subtle">
                                        {item.sub}
                                      </span>
                                    ) : null}
                                  </span>
                                  <span className="pill shrink-0">{item.group}</span>
                                </li>
                              );
                            })}
                          </ul>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-rule px-4 py-2">
                  <p className="flex items-center gap-3 text-[12px] text-ink-faint">
                    <span className="flex items-center gap-1">
                      <kbd className="rounded border border-rule px-1 py-0.5 font-mono leading-none">
                        <ArrowUp className="h-2.5 w-2.5" aria-hidden="true" />
                      </kbd>
                      <kbd className="rounded border border-rule px-1 py-0.5 font-mono leading-none">
                        <ArrowDown className="h-2.5 w-2.5" aria-hidden="true" />
                      </kbd>
                      move
                    </span>
                    <span className="flex items-center gap-1">
                      <kbd className="rounded border border-rule px-1 py-0.5 font-mono leading-none">
                        <CornerDownLeft className="h-2.5 w-2.5" aria-hidden="true" />
                      </kbd>
                      open
                    </span>
                    <span className="flex items-center gap-1">
                      <kbd className="rounded border border-rule px-1 py-0.5 font-mono leading-none">
                        Esc
                      </kbd>
                      close
                    </span>
                  </p>
                  <p className="num text-[12px] text-ink-faint">
                    {results.length} result{results.length === 1 ? "" : "s"}
                  </p>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}

export default CommandPalette;
