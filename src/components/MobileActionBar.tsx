"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Layers, Search, Target } from "lucide-react";
import { OPEN_PALETTE_EVENT } from "@/components/CommandPalette";

/**
 * Mobile action bar.
 *
 * A phone has no keyboard and no hover, so the keyboard-first chrome leaves a
 * reader with nothing but a burger menu. This bar puts the actions a reader
 * opens the site for one thumb-tap away: search, the ledger, the markets and
 * their own call. The burger keeps the full menu; the bar deliberately does
 * not repeat its secondary destinations.
 *
 * It is phones only (sm:hidden): on a desktop the top chrome already does
 * the job, and a second navigation bar would just be a second answer to the
 * same question.
 */

interface BarItem {
  id: string;
  label: string;
  href?: string;
  icon: React.ComponentType<{ className?: string }>;
}

const ITEMS: BarItem[] = [
  { id: "search", label: "Search", icon: Search },
  { id: "/ledger", label: "Ledger", href: "/ledger", icon: Layers },
  { id: "/markets", label: "Markets", href: "/markets", icon: BarChart3 },
  { id: "/your-call", label: "Your call", href: "/your-call", icon: Target },
];

export function MobileActionBar() {
  const pathname = usePathname();

  /**
   * The bar gets out of the way while the reader is scrolling down through the
   * page and comes back the moment they scroll up - the gesture phone readers
   * already expect, and it keeps the thumb space free for the content.
   * A transform only: no layout moves, so nothing shifts.
   */
  const [hidden, setHidden] = React.useState(false);
  React.useEffect(() => {
    let lastY = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      const delta = y - lastY;
      if (Math.abs(delta) > 6) {
        setHidden(delta > 0 && y > 120);
        lastY = y;
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    // A background tab is not painted, so it can miss its own scrolls; measure
    // again when it comes back into view.
    document.addEventListener("visibilitychange", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("visibilitychange", onScroll);
    };
  }, []);

  const isActive = (href?: string) => {
    if (!href) return false;
    return href === "/" ? pathname === "/" : pathname?.startsWith(href) === true;
  };

  return (
    <nav
      aria-label="Quick actions"
      className={[
        "fixed inset-x-0 bottom-0 z-40 border-t border-rule bg-surface sm:hidden",
        "transition-transform duration-300 ease-out",
        hidden ? "translate-y-full" : "translate-y-0",
      ].join(" ")}
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="flex items-stretch">
        {ITEMS.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          const inner = (
            <>
              <Icon className="h-[18px] w-[18px] shrink-0" />
              <span className="text-[13px] font-medium leading-none">{item.label}</span>
            </>
          );

          return (
            <li key={item.id} className="min-w-0 flex-1">
              {item.href ? (
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={[
                    "flex min-h-12 flex-col items-center justify-center gap-1 px-1 py-2 transition-colors",
                    active ? "text-ink" : "text-ink-subtle hover:text-ink",
                  ].join(" ")}
                >
                  {inner}
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={() => window.dispatchEvent(new CustomEvent(OPEN_PALETTE_EVENT))}
                  className="flex min-h-12 w-full flex-col items-center justify-center gap-1 px-1 py-2 text-ink-subtle transition-colors hover:text-ink"
                >
                  {inner}
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export default MobileActionBar;
