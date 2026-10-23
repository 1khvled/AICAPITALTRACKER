"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { ArrowUp, ChevronDown, ListTree } from "lucide-react";
import type { MethodologySection } from "@/lib/methodology/sections";

/**
 * The methodology article's navigation layer.
 *
 * A sticky table of contents with scroll-spy highlighting, a per-section deep
 * link on every entry, and a disclosure panel on a phone.
 *
 * HOW THE SECTION LIST IS BUILT
 * The server hands this component the article's section registry
 * (src/lib/methodology/sections.ts) - the same array the page binds its own
 * <section id> anchors to. On mount the component re-reads the LIVE DOM
 * (`main section[id]`), in document order, and reconciles that list against
 * the registry: a section that is in the article but not in the registry is
 * added (its number and label are read from its own heading), a section in
 * the registry with no matching element is dropped. The table of contents is
 * therefore generated from the page's real heading structure and cannot drift
 * away from the article.
 *
 * HOW THE ACTIVE SECTION IS TRACKED
 * The active section is the last one whose own label ("Section 04 - ...")
 * has passed a reading line just under the sticky chrome. The line is
 * compared against CACHED section offsets, so the scroll path never touches
 * the layout: one rAF-throttled listener reads an array, and React only
 * re-renders when the active id really changes - never once per scroll
 * pixel. The cache is refreshed when the article is re-laid out (a
 * ResizeObserver), on a resize, and after the first paint.
 *
 * HOW THE MOBILE PANEL AVOIDS LAYOUT SHIFT
 * The panel is absolutely positioned inside the sticky band, so it hangs over
 * the article instead of pushing it down: opening it moves nothing. The
 * band's own height is reserved in the flow, and the "back to top" control
 * keeps its slot at all times (it is hidden with visibility, not removed), so
 * the row never changes size.
 *
 * MOTION
 * Scrolling is smooth by CSS (`html { scroll-behavior: smooth }`) and is
 * forced to "auto" when the reader asks for reduced motion, both by the
 * stylesheet and by an explicit media query here.
 */

export interface MethodologyTocProps {
  /** The article's section registry, built server-side. */
  sections: readonly MethodologySection[];
}

/** A registry entry plus the heading text read from the live DOM. */
interface TocItem extends MethodologySection {
  /** The article's own <h2> for this section, read from the DOM. */
  heading?: string;
}

/** The site masthead. It is the only sticky thing above the article. */
const HEADER_SELECTOR = "header.sticky";

/** The reading line sits this far below the masthead + the band. */
const READING_LINE_GAP = 12;

function classNames(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(" ");
}

/**
 * The element a section is "read" from: its own eyebrow label
 * ("Section 03 - Mathematical Factor Breakdown"), falling back to its title
 * and then to the section itself.
 *
 * The eyebrow is the topmost thing a reader sees in a section, so it is the
 * point that has to clear the sticky chrome before the section counts as
 * the one being read.
 */
function sectionAnchorElement(section: HTMLElement): HTMLElement {
  const label = Array.from(section.querySelectorAll("span"))
    .slice(0, 24)
    .find((span) => /^Section\s+\d+/i.test((span.textContent ?? "").trim()));
  return label ?? section.querySelector("h2") ?? section;
}

export function MethodologyToc({ sections }: MethodologyTocProps) {
  const [items, setItems] = useState<TocItem[]>(() => sections.map((s) => ({ ...s })));
  const [activeId, setActiveId] = useState<string>(sections[0]?.id ?? "");
  const [panelOpen, setPanelOpen] = useState(false);
  const [headerHeight, setHeaderHeight] = useState(57);
  const [bandHeight, setBandHeight] = useState(54);
  const [showTop, setShowTop] = useState(false);
  const [measured, setMeasured] = useState(false);

  const bandRef = useRef<HTMLDivElement | null>(null);
  const stripRef = useRef<HTMLUListElement | null>(null);
  const hashCorrected = useRef(false);

  /** Distance from the top of the viewport to the top of a section. */
  const scrollOffset = headerHeight + bandHeight + READING_LINE_GAP;

  /**
   * 1. Reconcile the registry with the live document. The registry is the
   *    server-rendered seed; the DOM is the truth about what the page
   *    actually renders.
   */
  useEffect(() => {
    const nodes = Array.from(document.querySelectorAll<HTMLElement>("main section[id]"));
    if (nodes.length === 0) return;

    /** Keep the outermost sections only: the article's sections are siblings. */
    const top = nodes.filter(
      (node) => !node.parentElement?.closest("main section[id]"),
    );
    if (top.length === 0) return;

    const known = new Map(sections.map((section) => [section.id, section]));
    const reconciled: TocItem[] = [];

    top.forEach((node, index) => {
      const entry = known.get(node.id);
      const heading = node.querySelector("h2")?.textContent?.trim();
      if (entry) {
        reconciled.push({
          ...entry,
          label: heading || entry.label,
          heading: heading || entry.label,
        });
        known.delete(node.id);
        return;
      }
      /** A section the registry has never heard of: read its own heading. */
      const anchor = sectionAnchorElement(node);
      const number = /^Section\s+(\d+)/i.exec(
        (anchor.textContent ?? "").trim(),
      )?.[1];
      reconciled.push({
        id: node.id,
        number: number ?? String(index + 1).padStart(2, "0"),
        label: heading || node.id,
        heading,
      });
    });

    setItems(reconciled);
  }, [sections]);

  /**
   * 2. Measure the chrome above the article. The masthead is taller on a
   *    phone (it wraps), so the offset is measured, never assumed.
   */
  useEffect(() => {
    const header = document.querySelector<HTMLElement>(HEADER_SELECTOR);
    const band = bandRef.current;
    if (!header || !band) return;

    const measure = () => {
      setHeaderHeight(Math.round(header.getBoundingClientRect().height));
      setBandHeight(Math.round(band.getBoundingClientRect().height));
      setMeasured(true);
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(header);
    observer.observe(band);
    window.addEventListener("resize", measure);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  /**
   * 3. Scroll-spy.
   *
   *    The active section is the last one whose own LABEL has passed a
   *    reading line that sits just under the sticky chrome - the same place
   *    a jump lands a label. That rule has no gaps: when the line falls
   *    between two sections the reader is still in the one they finished,
   *    and the table of contents says so.
   *
   *    It is computed from CACHED offsets (the sections' document
   *    positions), so the scroll path never touches the layout: the handler
   *    reads an array, and React only re-renders when the active id really
   *    changes - never once per scroll pixel. The cache is refreshed when
   *    the article is re-laid out (a ResizeObserver on the page), on a
   *    resize, and after the fonts and the first paint land.
   */
  useEffect(() => {
    const targets = items
      .map((item) => document.getElementById(item.id))
      .filter((el): el is HTMLElement => el !== null);
    if (targets.length === 0) return;

    const line = Math.max(0, scrollOffset + 1);
    /** The sections' document positions, refreshed when the layout moves. */
    let offsets: { id: string; top: number; title: number }[] = [];

    const measure = () => {
      offsets = targets
        .map((target) => {
          const top = Math.round(target.getBoundingClientRect().top + window.scrollY);
          /** A section's own label is the reference point: the table of
           *  contents switches when the LABEL clears the sticky chrome. */
          const heading = sectionAnchorElement(target);
          const title = Math.round(
            heading.getBoundingClientRect().top + window.scrollY,
          );
          return { id: target.id, top, title };
        })
        .sort((a, b) => a.top - b.top);
    };

    const update = () => {
      const limit = window.scrollY + line + 2;
      let next = "";
      for (const section of offsets) {
        if (section.title <= limit) {
          next = section.id;
        } else {
          break;
        }
      }
      if (!next) next = offsets[0]?.id ?? "";
      if (!next) return;
      setActiveId((previous) => (previous === next ? previous : next));

      /** "Back to top" once the reader is well down the article. The flag
       *  only ever flips, so this is not a per-pixel re-render either. */
      const far = window.scrollY > Math.max(1200, window.innerHeight * 1.5);
      setShowTop((previous) => (previous === far ? previous : far));
    };

    let frame = 0;
    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        update();
      });
    };

    measure();
    update();

    const page = document.querySelector("main");
    const observer = new ResizeObserver(() => {
      measure();
      update();
    });
    if (page) observer.observe(page);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", measure);
    window.addEventListener("load", measure);

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", measure);
      window.removeEventListener("load", measure);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [items, scrollOffset]);

  /**
   * 4. Keep the active entry in view inside the horizontal strip. The strip
   *    is scrolled directly (not with scrollIntoView) so the page itself is
   *    never moved.
   */
  useEffect(() => {
    const strip = stripRef.current;
    if (!strip) return;
    const entry = strip.querySelector<HTMLElement>(`[data-toc-id="${activeId}"]`);
    if (!entry) return;
    const stripBox = strip.getBoundingClientRect();
    const entryBox = entry.getBoundingClientRect();
    const delta =
      entryBox.left - stripBox.left - (strip.clientWidth - entryBox.width) / 2;
    strip.scrollTo({ left: Math.max(0, strip.scrollLeft + delta), behavior: "auto" });
  }, [activeId, items]);

  /**
   * 5. Native in-page anchors (the article's own deep links, the "Jump to
   *    Formulas" button, a cold /methodology#section load) must clear the
   *    sticky chrome too. The stylesheet reserves 5rem of scroll padding; the
   *    extra offset is added per target as a scroll margin, sized so the
   *    section's TITLE lands on the same reading line a jump lands it on.
   */
  useEffect(() => {
    if (!measured) return;
    const root = document.documentElement;
    const housePadding =
      Number.parseFloat(getComputedStyle(root).scrollPaddingTop || "0") || 0;
    const line = Math.max(0, scrollOffset + 1);
    const targets = items
      .map((item) => document.getElementById(item.id))
      .filter((el): el is HTMLElement => el !== null);
    targets.forEach((target) => {
      const box = target.getBoundingClientRect();
      const heading = sectionAnchorElement(target);
      const titleOffset = heading.getBoundingClientRect().top - box.top;
      const margin = Math.max(0, line - housePadding - titleOffset);
      target.style.scrollMarginTop = `${margin}px`;
    });
    return () => {
      targets.forEach((target) => {
        target.style.scrollMarginTop = "";
      });
    };
  }, [items, scrollOffset, measured]);

  /**
   * 6. A cold load with a hash: the browser scrolls before the chrome is
   *    measured, so the landing is corrected once, then left alone.
   */
  useEffect(() => {
    if (!measured || hashCorrected.current) return;
    const hash = window.location.hash.replace(/^#/, "");
    if (!hash || !items.some((item) => item.id === hash)) return;
    hashCorrected.current = true;
    const frame = window.requestAnimationFrame(() => {
      const target = document.getElementById(hash);
      if (!target) return;
      const heading = sectionAnchorElement(target);
      const top =
        heading.getBoundingClientRect().top + window.scrollY - (scrollOffset + 1);
      window.scrollTo({ top: Math.max(0, top), behavior: "auto" });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [items, measured, scrollOffset]);

  /**
   * 7. Escape closes the phone panel, and a click outside it closes it too.
   */
  useEffect(() => {
    if (!panelOpen) return undefined;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setPanelOpen(false);
    };
    const onPointerDown = (event: PointerEvent) => {
      const band = bandRef.current;
      if (band && event.target instanceof Node && !band.contains(event.target)) {
        setPanelOpen(false);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [panelOpen]);

  const prefersReducedMotion = useCallback(() => {
    if (typeof window === "undefined" || !window.matchMedia) return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  /** Scroll to a section and keep the URL shareable. */
  const goToSection = useCallback(
    (id: string) => {
      const target = document.getElementById(id);
      if (!target) return;
      /** The section's LABEL lands on the reading line, the same place the
       *  scroll spy and the native anchors use. */
      const heading = sectionAnchorElement(target);
      const top =
        heading.getBoundingClientRect().top + window.scrollY - (scrollOffset + 1);
      window.scrollTo({
        top: Math.max(0, top),
        behavior: prefersReducedMotion() ? "auto" : "smooth",
      });
      window.history.replaceState(
        window.history.state,
        "",
        `${window.location.pathname}#${id}`,
      );
      setPanelOpen(false);
    },
    [scrollOffset, prefersReducedMotion],
  );

  const onLinkClick = useCallback(
    (event: React.MouseEvent<HTMLAnchorElement>, id: string) => {
      /** Let the browser handle modified clicks (new tab, download, ...). */
      if (
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey ||
        event.button !== 0
      ) {
        return;
      }
      event.preventDefault();
      goToSection(id);
    },
    [goToSection],
  );

  const backToTop = useCallback(() => {
    window.scrollTo({
      top: 0,
      behavior: prefersReducedMotion() ? "auto" : "smooth",
    });
  }, [prefersReducedMotion]);

  const active = items.find((item) => item.id === activeId) ?? items[0];

  if (items.length === 0) return null;

  return (
    <div
      ref={bandRef}
      className="sticky z-40 border-y border-rule bg-canvas"
      style={{ top: headerHeight }}
    >
      <div className="flex items-center gap-2 py-1 sm:gap-3 sm:px-0">
        {/* Phone: a disclosure. The panel hangs below the band, so opening
            it never moves the article. */}
        <button
          type="button"
          onClick={() => setPanelOpen((open) => !open)}
          aria-expanded={panelOpen}
          aria-controls="methodology-toc-panel"
          className="btn min-h-11 shrink-0 px-2.5 md:hidden"
        >
          <ListTree className="h-4 w-4" aria-hidden="true" />
          <span className="text-[13px]">Sections</span>
          <ChevronDown
            className={classNames(
              "h-4 w-4 transition-transform",
              panelOpen && "rotate-180",
            )}
            aria-hidden="true"
          />
        </button>

        {/* Where the reader is. Phone only - the strip below carries it on a
            desktop. */}
        <p className="line-clamp-2 min-w-0 flex-1 text-[13px] leading-snug text-ink-muted md:hidden">
          {active ? (
            <>
              <span className="num text-ink">{active.number}</span>
              <span aria-hidden="true"> · </span>
              <span>{active.label}</span>
            </>
          ) : null}
        </p>

        {/* Desktop: every section, in one row, with the active one filled in. */}
        <nav aria-label="Methodology sections" className="hidden min-w-0 flex-1 md:block">
          <ul
            ref={stripRef}
            className="flex items-center gap-1.5 overflow-x-auto scrollbar-none"
          >
            {items.map((item) => {
              const isActive = item.id === activeId;
              return (
                <li key={item.id} className="shrink-0">
                  <a
                    href={`#${item.id}`}
                    data-toc-id={item.id}
                    onClick={(event) => onLinkClick(event, item.id)}
                    aria-current={isActive ? "true" : undefined}
                    title={item.heading ?? item.label}
                    className={classNames(
                      "chip min-h-11 max-w-[280px] no-underline",
                      isActive && "chip-on",
                    )}
                  >
                    <span className="num text-[13px] shrink-0">{item.number}</span>
                    <span className="truncate">{item.label}</span>
                  </a>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Back to top. The slot is always reserved, so the row never
            changes height when the control appears. */}
        <button
          type="button"
          onClick={backToTop}
          tabIndex={showTop ? 0 : -1}
          aria-hidden={!showTop}
          className={classNames(
            "btn btn-ghost min-h-11 w-11 shrink-0 justify-center transition-opacity duration-150 md:w-auto",
            showTop ? "opacity-100" : "pointer-events-none invisible opacity-0",
          )}
        >
          <ArrowUp className="h-4 w-4" aria-hidden="true" />
          <span className="hidden text-[13px] md:inline">Top</span>
          <span className="sr-only">Back to top</span>
        </button>
      </div>

      {/* The phone panel. Absolutely positioned, so it covers the article
          rather than pushing it down. It bleeds to the screen edges, the
          way the masthead's own phone panel does. */}
      <div
        id="methodology-toc-panel"
        className={classNames(
          "nav-panel absolute inset-x-0 top-full z-50 -mx-4 max-h-[70dvh] overflow-y-auto border-b border-rule bg-surface shadow-float sm:-mx-6 md:hidden",
          panelOpen && "nav-panel-open",
        )}
      >
        <nav aria-label="Methodology sections">
          <ul className="py-1">
            {items.map((item) => {
              const isActive = item.id === activeId;
              return (
                <li key={item.id}>
                  <a
                    href={`#${item.id}`}
                    onClick={(event) => onLinkClick(event, item.id)}
                    aria-current={isActive ? "true" : undefined}
                    className={classNames(
                      "flex min-h-11 items-center gap-3 px-4 py-2.5 text-[14px] no-underline transition-colors",
                      isActive
                        ? "bg-surface-2 font-semibold text-ink"
                        : "text-ink-muted hover:bg-surface-2 hover:text-ink",
                    )}
                  >
                    <span className="num text-[13px] shrink-0 text-ink-faint">{item.number}</span>
                    <span className="min-w-0 flex-1 leading-snug">{item.label}</span>
                  </a>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </div>
  );
}

export default MethodologyToc;
