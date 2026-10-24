"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Moon, Sun, Menu, X } from "lucide-react";
import { useTheme } from "./ThemeProvider";
import { CommandPalette } from "./CommandPalette";
import { MotionToggle } from "./MotionProvider";

/**
 * Navbar — the destinations a reader opens the site for, in one row.
 *
 * The row scrolls horizontally on a narrow screen (the nav has its own
 * overflow-x-auto), so a phone reaches every destination by swiping rather
 * than by hunting through a menu.
 */

export interface NavbarProps {
  /** 12-month burst probability, 0-100, one decimal. */
  burstProbability?: number;
  /** Model band: calm | guarded | elevated | high | critical. */
  band?: string;
}

const PRIMARY_LINKS: { label: string; href: string; hint: string }[] = [
  { label: "Verdict", href: "/", hint: "Will the AI bubble burst in the next 12 months?" },
  { label: "Ledger", href: "/ledger", hint: "Every AI deal we can source from filings" },
  { label: "Companies", href: "/companies", hint: "Debt, revenue and multiples by company" },
  { label: "Markets", href: "/markets", hint: "Live credit spreads and macro inputs" },
  { label: "Predictions", href: "/prediction-markets", hint: "What the prediction market is pricing" },
  { label: "Your call", href: "/your-call", hint: "Put your own number on the record" },
  { label: "Guides", href: "/guides", hint: "Plain-language explainers" },
  { label: "Glossary", href: "/glossary", hint: "The vocabulary, defined" },
  { label: "Method", href: "/methodology", hint: "How the probability is calculated" },
];

const BAND_TONE: Record<string, string> = {
  calm: "bg-safe-400",
  guarded: "bg-safe-400",
  elevated: "bg-caution-400",
  high: "bg-risk-400",
  critical: "bg-risk-400",
};

export function Navbar({ burstProbability, band }: NavbarProps) {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  /**
   * The masthead is the terminal's own black and it tightens once the reader
   * has started scrolling (a hairline arrives). It is the one surface on the
   * site that floats over the content, and it is deliberately opaque: see the
   * note on the scroll listener below.
   */
  const [scrolled, setScrolled] = React.useState(false);
  /**
   * 2026-10-19 (design pass): on a phone the five destinations move into a
   * disclosure panel under the masthead. The panel is absolutely positioned
   * and animates on opacity + transform only, so opening it can never push
   * the page down — and the answer stays where the reader left it.
   */
  const [menuOpen, setMenuOpen] = React.useState(false);

  React.useEffect(() => setMounted(true), []);

  // The masthead tightens on scroll. The handler reads one number and sets one
  // flag, so it runs straight from the scroll event: a browser withholds
  // animation frames from a tab that is not being painted, and a masthead that
  // only tightens while the tab is visible is a masthead that lies.
  //
  // The masthead itself is OPAQUE - the terminal's own black, nothing behind
  // it. A translucent black over a light page does not read as black, it reads
  // as gray, and a gray masthead is a grayer site.
  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", onScroll, { passive: true });
    // A tab that was in the background has not seen its own scrolls.
    document.addEventListener("visibilitychange", onScroll);
    onScroll();
    return () => {
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("visibilitychange", onScroll);
    };
  }, []);

  // A destination was chosen: close the panel behind it.
  React.useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  // Escape closes the panel, the way every disclosure on the site closes.
  React.useEffect(() => {
    if (!menuOpen) return undefined;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [menuOpen]);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname === href || pathname?.startsWith(`${href}/`);

  /**
   * The active-page marker SLIDES.
   *
   * One element, positioned out of the flow, is moved under whichever
   * destination the reader is on. It is the difference between a page that
   * changes and a page that arrives: the reader can see where they went.
   *
   * The marker is absolutely positioned, so animating its width cannot reflow
   * anything around it - the nav's own layout never moves, so there is no
   * layout shift (the one rule the motion layer keeps without exception).
   */
  const navListRef = React.useRef<HTMLUListElement | null>(null);
  const linkRefs = React.useRef<Map<string, HTMLAnchorElement>>(new Map());
  const [marker, setMarker] = React.useState<{ left: number; width: number } | null>(null);

  const measureMarker = React.useCallback(() => {
    const list = navListRef.current;
    if (!list) return;
    const activeLink = PRIMARY_LINKS.find((link) => isActive(link.href));
    const element = activeLink ? linkRefs.current.get(activeLink.href) : undefined;
    if (!element) {
      setMarker(null);
      return;
    }
    // Measured from the LIST, not from offsetParent: the list item is
    // positioned, so offsetLeft would be relative to the item and always 0.
    const listRect = list.getBoundingClientRect();
    const itemRect = element.getBoundingClientRect();
    setMarker({
      left: itemRect.left - listRect.left + list.scrollLeft,
      width: itemRect.width,
    });
  }, [pathname]);

  React.useLayoutEffect(() => {
    measureMarker();
    // The webfont can land after the first paint and change the widths.
    if (typeof document !== "undefined" && document.fonts?.ready) {
      void document.fonts.ready.then(measureMarker).catch(() => undefined);
    }
    if (typeof ResizeObserver === "undefined") return undefined;
    const observer = new ResizeObserver(() => measureMarker());
    if (navListRef.current) observer.observe(navListRef.current);
    return () => observer.disconnect();
  }, [measureMarker]);

  const hasProbability = typeof burstProbability === "number" && !Number.isNaN(burstProbability);
  const tone = BAND_TONE[(band || "").toLowerCase()] ?? "bg-ink-400";

  return (
    <header
      className={[
        "sticky top-0 z-50 w-full border-b bg-[rgb(12_14_17)] text-header-ink",
        "transition-[border-color] duration-200 ease-out",
        scrolled ? "border-white/15" : "border-white/10",
      ].join(" ")}
    >
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6">
        <div className="flex min-h-14 flex-wrap items-center justify-between gap-x-4 gap-y-0 py-1.5">
          {/* Brand */}
          <Link
            href="/"
            className="flex min-h-11 min-w-11 shrink-0 items-center gap-2.5 py-1"
            aria-label="AI Capital Tracker, home"
          >
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-white/15 bg-white/5">
              <span className="font-mono text-[14px] font-bold tracking-tight text-white">AI</span>
            </span>
            {/* On phones the tile is the mark: dropping the wordmark is what
                lets the readout and controls share the first row. */}
            <span className="hidden truncate text-[14px] font-semibold tracking-tight text-white sm:inline sm:text-sm">
              AI Capital Tracker
            </span>
          </Link>

          {/* Primary navigation — five destinations, nothing else */}
          <nav
            aria-label="Primary"
            className="order-3 -mx-1 hidden w-full min-w-0 overflow-x-auto scrollbar-none sm:order-none sm:mx-0 sm:block sm:w-auto sm:overflow-visible"
          >
            <ul ref={navListRef} className="relative flex items-center gap-0.5 px-1 sm:gap-1">
              {marker ? (
                <span
                  aria-hidden="true"
                  className="nav-marker pointer-events-none absolute left-0 top-0 z-0 rounded-md bg-white/10 shadow-[inset_0_-2px_0_0_var(--c-accent)]"
                  style={{
                    width: marker.width,
                    transform: `translateX(${marker.left}px)`,
                  }}
                />
              ) : null}
              {PRIMARY_LINKS.map((link) => {
                const active = isActive(link.href);
                return (
                  <li key={link.href} className="relative z-10 shrink-0">
                    <Link
                      href={link.href}
                      title={link.hint}
                      aria-current={active ? "page" : undefined}
                      ref={(element) => {
                        if (element) linkRefs.current.set(link.href, element);
                        else linkRefs.current.delete(link.href);
                      }}
                      className={[
                        "flex min-h-11 items-center rounded-md px-2.5 text-[14px] font-medium tracking-tight transition-colors",
                        active ? "text-white" : "text-header-muted hover:bg-white/5 hover:text-white",
                      ].join(" ")}
                    >
                      {link.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Live reading + theme control */}
          <div className="flex shrink-0 items-center gap-2">
            {hasProbability ? (
              <Link
                href="/"
                title="Current 12-month bubble burst probability"
                className="flex min-h-11 items-center gap-2 border-l border-white/10 pl-3 lg:hidden 2xl:flex"
              >
                <span className="hidden text-[13px] font-medium uppercase tracking-[0.14em] text-header-muted lg:inline">
                  12-mo risk
                </span>
                <span
                  className="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--c-accent)]"
                  aria-hidden="true"
                />
                <span className="num text-[14px] font-semibold text-[var(--c-accent-ink)]">
                  {burstProbability!.toFixed(1)}%
                </span>
              </Link>
            ) : null}

            {/* Global search — one keyboard entry point to every graph on the site */}
            <CommandPalette />

            {/* Motion: follow the system, force it on, force it off. The OS
                preference is the default; this is the reader's override. */}
            <MotionToggle />

            <button
              type="button"
              onClick={toggleTheme}
              aria-label={mounted && theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              title={mounted && theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              className="flex h-11 w-11 items-center justify-center rounded-md border border-white/15 text-header-ink transition-colors hover:bg-white/5 hover:text-white"
            >
              {mounted && theme === "dark" ? (
                <Sun className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Moon className="h-4 w-4" aria-hidden="true" />
              )}
            </button>

            {/* Phone menu — the same five destinations, in a panel */}
            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              aria-expanded={menuOpen}
              aria-controls="primary-menu"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              className="flex h-11 w-11 items-center justify-center rounded-md border border-white/15 text-header-ink transition-colors hover:bg-white/5 hover:text-white sm:hidden"
            >
              {menuOpen ? (
                <X className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Menu className="h-4 w-4" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* The phone panel. It hangs off the masthead, never inside the flow,
          so it cannot move the answer. */}
      <div
        id="primary-menu"
        className={`nav-panel absolute inset-x-0 top-full z-40 border-b border-white/10 bg-[rgb(12_14_17)] shadow-float sm:hidden${
          menuOpen ? " nav-panel-open" : ""
        }`}
      >
        <nav aria-label="Primary, mobile">
          <ul className="mx-auto w-full max-w-7xl px-4 py-2">
            {PRIMARY_LINKS.map((link) => {
              const active = isActive(link.href);
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    title={link.hint}
                    aria-current={active ? "page" : undefined}
                    className={[
                      "flex min-h-11 items-center rounded-md px-2 text-[14px] font-medium tracking-tight transition-colors",
                      active
                        ? "bg-white/10 text-white"
                        : "text-header-muted hover:bg-white/5 hover:text-white",
                    ].join(" ")}
                  >
                    {link.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </header>
  );
}

export default Navbar;