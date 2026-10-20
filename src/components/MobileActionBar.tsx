"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, BookOpen, Home, Layers, Search, Target } from "lucide-react";
import { OPEN_PALETTE_EVENT } from "@/components/CommandPalette";

/**
 * Mobile action bar.
 *
 * A phone has no ⌘K and no hover, so the keyboard-first chrome leaves a reader
 * with nothing but a burger menu. This bar puts the things a reader opens the
 * site for one thumb-tap away — search, the verdict, the ledger, the markets,
 * the guides and their own call — pinned to the bottom edge, above the safe
 * area.
 *
 * It is phones only (`sm:hidden`): on a desktop the top chrome already does
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
  { id: "/", label: "Verdict", href: "/", icon: Home },
  { id: "/ledger", label: "Ledger", href: "/ledger", icon: Layers },
  { id: "/markets", label: "Markets", href: "/markets", icon: BarChart3 },
  { id: "/your-call", label: "Your call", href: "/your-call", icon: Target },
  { id: "/guides", label: "Guides", href: "/guides", icon: BookOpen },
];

export function MobileActionBar() {
  const pathname = usePathname();

  const isActive = (href?: string) => {
    if (!href) return false;
    return href === "/" ? pathname === "/" : pathname?.startsWith(href) === true;
  };

  return (
    <nav
      aria-label="Quick actions"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-rule bg-surface/95 backdrop-blur sm:hidden"
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
