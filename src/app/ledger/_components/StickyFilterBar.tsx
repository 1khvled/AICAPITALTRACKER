"use client";

import React from "react";
import { SlidersHorizontal, X } from "lucide-react";

/**
 * Sticky condensed filter bar.
 *
 * Appears only once the real toolbar has scrolled out of view, and stays to one
 * line: how much you are looking at, what is filtering it, and two ways out
 * (edit filters, clear them). It renders nothing at all on the server and on
 * first paint, so hydration never sees a difference.
 */
interface StickyFilterBarProps {
  visible: boolean;
  resultLabel: string;
  amountLabel: string;
  activeCount: number;
  summary: string;
  onOpenFilters: () => void;
  onClear: () => void;
}

export default function StickyFilterBar({
  visible,
  resultLabel,
  amountLabel,
  activeCount,
  summary,
  onOpenFilters,
  onClear,
}: StickyFilterBarProps) {
  return (
    <div
      className={[
        "sticky top-[82px] z-40 -mx-4 mt-2 hidden border-y border-rule bg-surface/95 px-4 backdrop-blur sm:-mx-6 sm:px-6 md:top-14",
        visible ? "!block" : "",
      ].join(" ")}
      aria-hidden={!visible}
    >
      <div className="mx-auto flex max-w-7xl items-center gap-3 py-2">
        <p className="min-w-0 flex-1 truncate text-[14px] text-ink-muted">
          <span className="num font-semibold text-ink">{resultLabel}</span>
          <span aria-hidden="true"> · </span>
          <span className="num">{amountLabel}</span>
          {summary ? (
            <span className="text-ink-subtle">
              <span aria-hidden="true"> · </span>
              {summary}
            </span>
          ) : null}
        </p>

        {activeCount ? (
          <button
            type="button"
            onClick={onClear}
            className="btn btn-ghost min-h-11 shrink-0 px-2 text-[13px]"
            tabIndex={visible ? 0 : -1}
          >
            <X className="h-3.5 w-3.5" aria-hidden="true" />
            Clear
          </button>
        ) : null}

        <button
          type="button"
          onClick={onOpenFilters}
          className="btn min-h-11 shrink-0 px-2.5 text-[13px]"
          tabIndex={visible ? 0 : -1}
        >
          <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden="true" />
          Filters
        </button>
      </div>
    </div>
  );
}