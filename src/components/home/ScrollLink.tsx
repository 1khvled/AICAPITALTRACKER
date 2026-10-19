"use client";

import React from "react";

interface ScrollLinkProps {
  /** Id of the section to scroll to. */
  targetId: string;
  className?: string;
  children: React.ReactNode;
}

/**
 * Anchor that scrolls to a section instead of jumping, clearing the sticky
 * header by its measured height.
 *
 * Hydration-safe: no state, no timers, no locale reads. If the section is
 * missing, the plain hash navigation still runs.
 */
export function ScrollLink({ targetId, className, children }: ScrollLinkProps) {
  const handleClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    const target = document.getElementById(targetId);
    if (!target) return;

    event.preventDefault();

    const reduceMotion =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const header = document.querySelector("header");
    const offset = (header?.getBoundingClientRect().height ?? 0) + 12;
    const top = window.scrollY + target.getBoundingClientRect().top - offset;

    window.scrollTo({ top: Math.max(0, top), behavior: reduceMotion ? "auto" : "smooth" });

    if (window.history && typeof window.history.replaceState === "function") {
      window.history.replaceState(null, "", `#${targetId}`);
    }
  };

  return (
    <a href={`#${targetId}`} onClick={handleClick} className={className}>
      {children}
    </a>
  );
}
