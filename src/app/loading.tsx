import React from "react";

/**
 * Route-level loading state.
 *
 * Reserved boxes, not spinners: the skeleton mirrors the shape of a page head
 * plus two content blocks, so nothing jumps when the real page arrives.
 */
export default function Loading() {
  return (
    <div className="section-sm" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading…</span>

      <div className="max-w-reading space-y-3">
        <div className="skeleton h-3 w-28" />
        <div className="skeleton h-9 w-full max-w-2xl" />
        <div className="skeleton h-4 w-full" />
        <div className="skeleton h-4 w-4/5" />
      </div>

      <div className="mt-8 space-y-3">
        <div className="skeleton h-28 w-full" />
        <div className="skeleton h-48 w-full" />
        <div className="skeleton h-48 w-full" />
      </div>
    </div>
  );
}