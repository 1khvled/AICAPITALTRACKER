"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname, useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, CornerDownLeft, Search, X } from "lucide-react";
import {
  groupRankedItems,
  rankPaletteItems,
} from "@/lib/palette-scoring";
import { hideOthers } from "@/lib/aria-hide-others";

/**
 * Global command palette.
 *
 * One keyboard entry point for a site with four content graphs: pages,
 * company profiles, ledger facilities and market tickers. The index is built on
 * the server (src/lib/palette-index.ts) and fetched from /api/palette the
 * first time the palette opens, so the model engine and the raw data files
 * never ship to the browser.
 *
 * THE KEYS
 *   - ⌘K / Ctrl+K opens it from anywhere; "/" opens it when the reader is not
 *     typing in a field.
 *   - ↑ ↓ move the selection, Enter opens it, Escape closes it.
 *   - Tab is trapped inside the panel: the palette is a single-purpose
 *     overlay and the reader cannot tab out of it into the page behind.
 *
 * THE RANKING
 * The scorer is a continuous-character fuzzy matcher
 * (src/lib/palette-scoring.ts), not a set of buckets: a run of consecutive
 * matching characters beats a word-boundary hit, which beats a match that has
 * to cross a separator. The GROUPS are ordered by their best matching item,
 * so a query that strongly matches a ledger facility puts Ledger first. The
 * selection is tracked by ID, never by index, so `aria-activedescendant` can
 * only ever point at the element that is actually on screen.
 *
 * THE OVERLAY
 * Three rules, hand-rolled from the Radix dismissable-layer / focus-scope
 * behaviour:
 *   1. The palette closes on a real outside PRESS, not on any mousedown. A
 *      press that starts inside the panel is never a dismissal - not on the
 *      scrollbar of the results list, which used to be a dead end.
 *   2. The page behind leaves the accessibility tree while the palette is
 *      open (src/lib/aria-hide-others.ts), with a COUNTER so two overlapping
 *      overlays cannot clobber each other and an already-hidden element
 *      keeps its own hiding.
 *   3. Focus is trapped inside the panel and restored on close. If the
 *      trigger has unmounted - a route change can do that - focus falls back
 *      to the body rather than being dropped on the floor.
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

/** How many results are shown at once. */
const MAX_RESULTS = 36;

/** Everything the focus trap can land on inside the panel. */
const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * The event any surface can fire to open the palette (the mobile action bar
 * uses it, because the keyboard shortcut does not exist on a phone).
 */
export const OPEN_PALETTE_EVENT = "aict:open-palette";

export function CommandPalette() {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  /** The selected item, by ID. Never by index. */
  const [activeId, setActiveId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  /**
   * The search index is NOT inlined into every page — it is fetched from
   * /api/palette the first time the palette opens. Inlining it cost every
   * route tens of kilobytes of RSC payload for a panel most readers never open.
   */
  const [items, setItems] = useState<PaletteItem[]>([]);
  const [loading, setLoading] = useState(false);

  const inputRef = useRef<HTMLInputElement | null>(null);
  /** The dialog panel. The outside-press test is made against this. */
  const panelRef = useRef<HTMLDivElement | null>(null);
  /** The portal wrapper. It is the one thing that stays visible. */
  const overlayRef = useRef<HTMLDivElement | null>(null);
  /** Where the focus came from, so it can be put back. */
  const restoreFocusRef = useRef<HTMLElement | null>(null);
  /** Whether the palette is open, readable synchronously from an event handler. */
  const openRef = useRef(false);
  const loadedRef = useRef(false);

  useEffect(() => setMounted(true), []);

  /* ── The ranking ──────────────────────────────────────────────────────── */

  const groups = useMemo(() => {
    const ranked = rankPaletteItems(items, query);
    return groupRankedItems(ranked, MAX_RESULTS);
  }, [items, query]);

  /** The flat list, in the order it is drawn. */
  const results = useMemo(
    () => groups.flatMap((group) => group.rows.map((row) => row.item)),
    [groups],
  );

  /**
   * Where the selection is. The ID is the truth; the index is derived from it,
   * so a stale ID can never leave `aria-activedescendant` pointing at an
   * element that is not on screen.
   */
  const activeIndex = useMemo(() => {
    if (results.length === 0) return -1;
    const index = results.findIndex((item) => item.id === activeId);
    return index === -1 ? 0 : index;
  }, [results, activeId]);

  const activeItem = activeIndex >= 0 ? results[activeIndex] : undefined;

  /** Keep the selection on something that exists. */
  useEffect(() => {
    if (results.length === 0) {
      if (activeId !== null) setActiveId(null);
      return;
    }
    if (activeId === null || !results.some((item) => item.id === activeId)) {
      setActiveId(results[0].id);
    }
  }, [results, activeId]);

  /* ── Opening and closing ──────────────────────────────────────────────── */

  const openPalette = useCallback(() => {
    /**
     * Remember where the focus came from, so it can be put back. Only the
     * FIRST open records it: a second open would record the palette's own
     * field, which is gone by the time the palette closes.
     */
    if (!openRef.current && typeof document !== "undefined") {
      const active = document.activeElement;
      restoreFocusRef.current = active instanceof HTMLElement ? active : null;
    }
    openRef.current = true;
    setOpen(true);
    setQuery("");
    setActiveId(null);
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
    openRef.current = false;
    setOpen(false);
    setQuery("");
    setActiveId(null);
  }, []);

  /**
   * Put the focus back where it came from. The trigger can be gone by the
   * time the palette closes - a route change unmounts it - so the fallback is
   * the body, never a silent loss of focus.
   */
  const restoreFocus = useCallback(() => {
    const previous = restoreFocusRef.current;
    restoreFocusRef.current = null;

    if (previous && previous.isConnected && typeof previous.focus === "function") {
      previous.focus();
      if (document.activeElement === previous) return;
    }

    const body = document.body;
    if (!body) return;
    const hadTabIndex = body.hasAttribute("tabindex");
    if (!hadTabIndex) body.setAttribute("tabindex", "-1");
    body.focus();
    if (!hadTabIndex) {
      window.setTimeout(() => {
        if (body.getAttribute("tabindex") === "-1") body.removeAttribute("tabindex");
      }, 0);
    }
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
  const lastPathname = useRef(pathname);
  useEffect(() => {
    if (lastPathname.current === pathname) return;
    lastPathname.current = pathname;
    closePalette();
  }, [pathname, closePalette]);

  /**
   * The overlay's own lifecycle: the page behind leaves the accessibility
   * tree, the focus moves into the field, and on close the page comes back
   * and the focus goes home.
   */
  useEffect(() => {
    if (!open) return undefined;

    // 1. The page behind is hidden from assistive technology - with a counter,
    //    so an overlapping overlay cannot clobber this one.
    const release = hideOthers(overlayRef.current);

    // 2. The page behind must not scroll while the palette is open. The
    //    scrollbar's width is given back as padding, so nothing shifts.
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    const previousOverflow = document.body.style.overflow;
    const previousPadding = document.body.style.paddingRight;
    document.body.style.overflow = "hidden";
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    // 3. Move the focus into the field.
    const id = window.setTimeout(() => inputRef.current?.focus(), 0);

    return () => {
      window.clearTimeout(id);
      document.body.style.overflow = previousOverflow;
      document.body.style.paddingRight = previousPadding;
      // Restore exactly what was hidden, and only then give the focus back:
      // a focus target inside a hidden subtree is a focus target nobody can
      // reach.
      release();
      restoreFocus();
    };
  }, [open, restoreFocus]);

  /**
   * The dismissable layer.
   *
   * The palette closes on a press that STARTS OUTSIDE the panel. A press that
   * starts inside is ignored - which is what makes the scrollbar of the
   * results list a scrollbar and not a dead end.
   */
  useEffect(() => {
    if (!open) return undefined;
    const onPointerDown = (event: PointerEvent) => {
      const panel = panelRef.current;
      const target = event.target;
      if (panel && target instanceof Node && panel.contains(target)) return;
      closePalette();
    };
    document.addEventListener("pointerdown", onPointerDown, true);
    return () => document.removeEventListener("pointerdown", onPointerDown, true);
  }, [open, closePalette]);

  /**
   * The focus scope. If the focus leaves the panel - a pointer press on the
   * page behind, a programmatic focus() somewhere else - it is pulled back
   * into the field.
   */
  useEffect(() => {
    if (!open) return undefined;
    const onFocusIn = (event: FocusEvent) => {
      if (!openRef.current) return;
      const panel = panelRef.current;
      const target = event.target;
      if (panel && target instanceof Node && panel.contains(target)) return;
      const input = inputRef.current;
      if (input && document.activeElement !== input) input.focus();
    };
    document.addEventListener("focusin", onFocusIn, true);
    return () => document.removeEventListener("focusin", onFocusIn, true);
  }, [open]);

  // Keep the selected row inside the scroll window.
  useEffect(() => {
    if (!open || !activeItem) return;
    const node = document.getElementById(`palette-option-${activeItem.id}`);
    node?.scrollIntoView({ block: "nearest" });
  }, [activeItem, open]);

  /* ── The selection ────────────────────────────────────────────────────── */

  const moveSelection = useCallback(
    (delta: number) => {
      if (results.length === 0) return;
      const from = activeIndex === -1 ? 0 : activeIndex;
      const next = (from + delta + results.length) % results.length;
      setActiveId(results[next].id);
    },
    [activeIndex, results],
  );

  const choose = useCallback(
    (item: PaletteItem) => {
      openRef.current = false;
      setOpen(false);
      setQuery("");
      setActiveId(null);
      router.push(item.href);
    },
    [router],
  );

  /** Keep Tab inside the panel: it is a single-purpose overlay. */
  const trapTab = useCallback((event: React.KeyboardEvent<HTMLDivElement>) => {
    const panel = panelRef.current;
    if (!panel) return;
    const focusables = Array.from(
      panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
    ).filter(
      (element) =>
        element.offsetWidth > 0 ||
        element.offsetHeight > 0 ||
        element === document.activeElement,
    );
    if (focusables.length === 0) {
      event.preventDefault();
      inputRef.current?.focus();
      return;
    }
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    const current = document.activeElement;
    const inside = current instanceof Node && panel.contains(current);
    if (event.shiftKey) {
      if (!inside || current === first) {
        event.preventDefault();
        last.focus();
      }
    } else if (!inside || current === last) {
      event.preventDefault();
      first.focus();
    }
  }, []);

  const onPanelKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      moveSelection(1);
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      moveSelection(-1);
      return;
    }
    if (event.key === "Enter") {
      event.preventDefault();
      if (activeItem) choose(activeItem);
      return;
    }
    if (event.key === "Escape") {
      event.preventDefault();
      closePalette();
      return;
    }
    if (event.key === "Tab") {
      trapTab(event);
    }
  };

  return (
    <>
      <button
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
              ref={overlayRef}
              className="palette-scrim palette-dim fixed inset-0 z-[70] flex justify-center px-4"
            >
              <div
                ref={panelRef}
                role="dialog"
                aria-modal="true"
                aria-label="Search the tracker"
                onKeyDown={onPanelKeyDown}
                className="palette-panel glass-strong mt-[10vh] flex max-h-[70vh] w-full max-w-xl flex-col overflow-hidden rounded-lg border border-rule shadow-float"
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
                      activeItem ? `palette-option-${activeItem.id}` : undefined
                    }
                    aria-label="Search pages, companies, ledger facilities and tickers"
                    placeholder="Search pages, companies, deals and tickers"
                    value={query}
                    onChange={(event) => {
                      setQuery(event.target.value);
                      setActiveId(null);
                    }}
                    className="h-12 min-w-0 flex-1 bg-transparent text-[15px] text-ink outline-none placeholder:text-ink-faint"
                  />
                  {query ? (
                    <button
                      type="button"
                      onClick={() => {
                        setQuery("");
                        setActiveId(null);
                        inputRef.current?.focus();
                      }}
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md text-ink-subtle transition-colors hover:bg-surface-2 hover:text-ink"
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
                    <ul id="palette-listbox" role="listbox" aria-label="Search results">
                      {groups.map((group) => (
                        <li key={group.group} role="presentation">
                          <p className="label px-4 pb-1 pt-3" aria-hidden="true">
                            {group.group}
                          </p>
                          <ul role="presentation">
                            {group.rows.map((row) => {
                              const item = row.item;
                              const selected = activeItem?.id === item.id;
                              return (
                                <li
                                  key={item.id}
                                  id={`palette-option-${item.id}`}
                                  role="option"
                                  aria-selected={selected}
                                  onMouseEnter={() => setActiveId(item.id)}
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
