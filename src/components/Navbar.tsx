"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "./ThemeProvider";

/**
 * Navbar — the only five destinations most readers ever need.
 * Everything else (Charts, Simulator, 2000 vs 2026, API, News) is reachable
 * from the footer directory, so the top chrome stays calm and scannable.
 *
 * Server component parents pass the live model reading in as props so the
 * model engine never ships to the browser.
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

  React.useEffect(() => setMounted(true), []);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname === href || pathname?.startsWith(`${href}/`);

  const hasProbability = typeof burstProbability === "number" && !Number.isNaN(burstProbability);
  const tone = BAND_TONE[(band || "").toLowerCase()] ?? "bg-ink-400";

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-[rgb(12_14_17)] text-header-ink">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6">
        <div className="flex min-h-14 flex-wrap items-center justify-between gap-x-4 gap-y-0 py-1.5">
          {/* Brand */}
          <Link
            href="/"
            className="flex shrink-0 items-center gap-2.5 py-1"
            aria-label="AI Capital Tracker, home"
          >
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-white/15 bg-white/5">
              <span className="font-mono text-[14px] font-bold tracking-tight text-white">AI</span>
            </span>
            <span className="truncate text-[14px] font-semibold tracking-tight text-white sm:text-sm">
              AI Capital Tracker
            </span>
          </Link>

          {/* Primary navigation — five destinations, nothing else */}
          <nav
            aria-label="Primary"
            className="order-3 -mx-1 w-full min-w-0 overflow-x-auto scrollbar-none sm:order-none sm:mx-0 sm:w-auto sm:overflow-visible"
          >
            <ul className="flex items-center gap-0.5 px-1 sm:gap-1">
              {PRIMARY_LINKS.map((link) => {
                const active = isActive(link.href);
                return (
                  <li key={link.href} className="shrink-0">
                    <Link
                      href={link.href}
                      title={link.hint}
                      aria-current={active ? "page" : undefined}
                      className={[
                        "flex min-h-11 items-center rounded-md px-2.5 text-[14px] font-medium tracking-tight transition-colors",
                        active
                          ? "bg-white/10 text-white shadow-[inset_0_-2px_0_0_rgb(255_255_255)]"
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

          {/* Live reading + theme control */}
          <div className="flex shrink-0 items-center gap-2">
            {hasProbability ? (
              <Link
                href="/"
                title="Current 12-month bubble burst probability"
                className="flex min-h-11 items-center gap-2 border-l border-white/10 pl-3"
              >
                <span className="hidden text-[13px] font-medium uppercase tracking-[0.14em] text-header-muted lg:inline">
                  12-mo risk
                </span>
                <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${tone}`} aria-hidden="true" />
                <span className="num text-[14px] font-semibold text-white">
                  {burstProbability!.toFixed(1)}%
                </span>
              </Link>
            ) : null}

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
          </div>
        </div>
      </div>
    </header>
  );
}

export default Navbar;