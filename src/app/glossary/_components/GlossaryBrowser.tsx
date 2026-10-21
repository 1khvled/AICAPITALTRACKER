"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import type { GlossaryTerm } from "@/lib/glossary/terms";

/**
 * /glossary browser.
 *
 * The registry arrives as a prop from the server page, so the term data is
 * never re-imported into the client bundle and the page itself stays a
 * server component. This file owns one thing: the filter.
 *
 * What it does:
 *   - filters live as you type, across the term name, the one-line definition
 *     and the long body
 *   - keeps the terms grouped alphabetically, with a visible letter heading per
 *     group, and drops the empty groups when a filter is on
 *   - announces the result count through a polite live region
 *   - turns the related-term references into in-page links that scroll to the
 *     entry, and clears the filter if the target has been filtered out
 *
 * What it deliberately does not do: no animation on the list, no layout that
 * depends on measurement, no state kept in the URL. The registry is small
 * enough that filtering it costs nothing, and the anchor ids are stable enough
 * that a link to /glossary#cds-spread keeps working for as long as the site
 * exists.
 */

interface GlossaryBrowserProps {
  /** The registry, straight from src/lib/glossary/terms.ts. */
  terms: GlossaryTerm[];
}

interface GlossaryGroup {
  letter: string;
  terms: GlossaryTerm[];
}

/** Groups a term list by the first letter of the term, A to Z. */
function groupByLetter(terms: GlossaryTerm[]): GlossaryGroup[] {
  const order: string[] = [];
  const buckets = new Map<string, GlossaryTerm[]>();
  for (const term of terms) {
    const letter = (term.term.charAt(0) || "#").toUpperCase();
    if (!buckets.has(letter)) {
      buckets.set(letter, []);
      order.push(letter);
    }
    buckets.get(letter)!.push(term);
  }
  return order
    .sort((a, b) => a.localeCompare(b))
    .map((letter) => ({ letter, terms: buckets.get(letter)! }));
}

export default function GlossaryBrowser({ terms }: GlossaryBrowserProps) {
  const [query, setQuery] = useState("");
  /**
   * A related-term link that points at an entry the current filter has hidden.
   * The click clears the filter and the effect below does the scrolling, because
   * the target does not exist in the DOM until the filter is gone.
   */
  const [pendingAnchor, setPendingAnchor] = useState<string | null>(null);

  const byId = useMemo(() => {
    const map: Record<string, GlossaryTerm> = {};
    for (const term of terms) map[term.id] = term;
    return map;
  }, [terms]);

  const needle = query.trim().toLowerCase();

  const filtered = useMemo(() => {
    if (!needle) return terms;
    return terms.filter(
      (term) =>
        term.term.toLowerCase().includes(needle) ||
        term.short.toLowerCase().includes(needle) ||
        term.body.toLowerCase().includes(needle),
    );
  }, [terms, needle]);

  const groups = useMemo(() => groupByLetter(filtered), [filtered]);

  /**
   * The letter index is built from the FULL registry, not from the filtered
   * list, so it never changes shape while the reader types. The list below it
   * shrinks and the index above it does not move.
   */
  const allGroups = useMemo(() => groupByLetter(terms), [terms]);

  /**
   * Scroll to a target the browser could not reach on its own, because the
   * filter was hiding it. The motion follows the reader's system preference:
   * the global stylesheet kills smooth scrolling for reduced-motion readers,
   * and "instant" is the explicit version of that.
   */
  useEffect(() => {
    if (!pendingAnchor) return;
    const target = document.getElementById(pendingAnchor);
    if (target) {
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      target.scrollIntoView({ behavior: reduced ? "instant" : "smooth", block: "start" });
      (target as HTMLElement).focus?.({ preventScroll: true });
    }
    setPendingAnchor(null);
  }, [pendingAnchor, filtered]);

  const clearFilter = useCallback(() => {
    setQuery("");
  }, []);

  /**
   * A related-term link. When the target is on screen the browser handles the
   * hash jump natively. When the current filter has hidden it, the click
   * clears the filter first and the effect above takes over the scroll.
   */
  const onRelatedClick = useCallback(
    (event: React.MouseEvent<HTMLAnchorElement>, id: string) => {
      if (document.getElementById(id)) return; // visible: let the browser do it
      event.preventDefault();
      setQuery("");
      setPendingAnchor(id);
      if (typeof window !== "undefined") {
        window.history.replaceState(null, "", `#${id}`);
      }
    },
    [],
  );

  const resultLabel = needle
    ? `${filtered.length} of ${terms.length} terms match`
    : `${terms.length} terms`;

  return (
    <div>
      {/* ── The filter ─────────────────────────────────────────────────── */}
      <div className="md:sticky md:top-14 md:z-30 md:bg-canvas md:pb-3">
        <div className="card card-flush">
          <div className="p-3 sm:p-4">
            <div className="flex items-baseline justify-between gap-3">
              <label
                htmlFor="glossary-search"
                className="text-[13px] font-medium text-ink-muted"
              >
                Search the glossary
              </label>
              {/* The count is the live region. It announces the result size
                  without stealing focus, and it never changes the height of
                  the row, so the filter never shifts the list under it. */}
              <p
                className="num whitespace-nowrap text-[13px] text-ink-subtle"
                role="status"
                aria-live="polite"
                aria-atomic="true"
              >
                {resultLabel}
              </p>
            </div>

            <div className="relative mt-1.5">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint"
                aria-hidden="true"
              />
              <input
                id="glossary-search"
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="e.g. CDS, circular financing"
                autoComplete="off"
                spellCheck={false}
                aria-describedby="glossary-search-hint"
                className="min-h-11 w-full appearance-none rounded-md border border-rule-strong bg-canvas pl-9 pr-11 text-[15px] text-ink placeholder:text-ink-faint [&::-webkit-search-cancel-button]:hidden"
              />
              {query ? (
                <button
                  type="button"
                  onClick={clearFilter}
                  className="absolute right-0 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-md text-ink-subtle transition-colors hover:bg-surface-2 hover:text-ink"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                  <span className="sr-only">Clear the search</span>
                </button>
              ) : null}
            </div>

            <p id="glossary-search-hint" className="sr-only">
              Filters the glossary as you type, matching the term name, the one-line
              definition and the full explanation.
            </p>
          </div>
        </div>
      </div>

      {/* ── Letter index ───────────────────────────────────────────────── */}
      {allGroups.length > 1 ? (
        <nav
          aria-label="Jump to a letter"
          className="mt-3 flex max-w-5xl flex-wrap items-center gap-1"
        >
          <span className="label mr-1">Jump to</span>
          {allGroups.map((group) => {
            const anchor = `letter-${group.letter.toLowerCase()}`;
            return (
              <a
                key={group.letter}
                href={`#${anchor}`}
                onClick={(event) => onRelatedClick(event, anchor)}
                className="chip min-h-11 min-w-11 items-center justify-center px-2.5 transition-colors hover:border-rule-strong hover:bg-surface-2"
              >
                <span className="sr-only">
                  Jump to the terms beginning with {group.letter}
                </span>
                <span aria-hidden="true" className="num">
                  {group.letter}
                </span>
                <span aria-hidden="true" className="num opacity-70">
                  {group.terms.length}
                </span>
              </a>
            );
          })}
        </nav>
      ) : null}

      {/* ── The terms ──────────────────────────────────────────────────── */}
      {groups.length === 0 ? (
        <div className="card mt-6 text-center">
          <p className="text-[15px] font-semibold text-ink">
            No term matches &ldquo;{query.trim()}&rdquo;.
          </p>
          <p className="prose prose-p mx-auto max-w-reading text-[15px]">
            Try a shorter search, a single word, or clear the filter and browse the
            full list of{" "}
            <span className="num">{terms.length}</span> terms.
          </p>
          <button type="button" onClick={clearFilter} className="btn btn-primary mt-4 min-h-11">
            Clear the filter
          </button>
        </div>
      ) : (
        <div className="mt-6 max-w-5xl space-y-8">
          {groups.map((group) => {
            const anchor = `letter-${group.letter.toLowerCase()}`;
            return (
              <section
                key={group.letter}
                id={anchor}
                tabIndex={-1}
                aria-labelledby={`${anchor}-heading`}
                className="scroll-mt-28"
              >
                <div className="flex items-baseline justify-between gap-3 border-b border-rule pb-2">
                  <h2
                    id={`${anchor}-heading`}
                    className="text-[18px] font-bold tracking-tight text-ink"
                  >
                    {group.letter}
                  </h2>
                  <p className="num text-[13px] text-ink-subtle">
                    {group.terms.length} {group.terms.length === 1 ? "term" : "terms"}
                  </p>
                </div>

                <ul className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                  {group.terms.map((term) => {
                    const headingId = `${term.id}-heading`;
                    const related = (term.related ?? []).filter((id) => byId[id]);
                    return (
                      <li key={term.id} className="min-w-0">
                        <article
                          id={term.id}
                          tabIndex={-1}
                          aria-labelledby={headingId}
                          className="card card-flush h-full scroll-mt-28 transition-colors hover:border-rule-strong"
                        >
                          <div className="p-4">
                            <h3
                              id={headingId}
                              className="text-[15px] font-bold leading-snug tracking-tight text-ink"
                            >
                              {term.term}
                            </h3>

                            <p className="mt-1.5 text-[15px] leading-relaxed text-ink glossary-explanation">
                              {term.short}
                            </p>

                            <p className="mt-2 text-[15px] leading-relaxed text-ink-muted glossary-explanation">
                              {term.body}
                            </p>

                            {related.length > 0 ? (
                              <div className="mt-3 border-t border-rule pt-3">
                                <span className="label">Related</span>
                                <div className="mt-1.5 flex flex-wrap gap-1.5">
                                  {related.map((id) => (
                                    <a
                                      key={id}
                                      href={`#${id}`}
                                      onClick={(event) => onRelatedClick(event, id)}
                                      className="chip min-h-11 items-center transition-colors hover:border-rule-strong hover:bg-surface-2"
                                    >
                                      <span className="sr-only">
                                        Go to the glossary entry for{" "}
                                      </span>
                                      {byId[id]?.term ?? id}
                                    </a>
                                  ))}
                                </div>
                              </div>
                            ) : null}

                            {term.source ? (
                              <p className="mt-3 font-mono text-[12px] leading-relaxed text-ink-faint">
                                {term.source}
                              </p>
                            ) : null}
                          </div>
                        </article>
                      </li>
                    );
                  })}
                </ul>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
