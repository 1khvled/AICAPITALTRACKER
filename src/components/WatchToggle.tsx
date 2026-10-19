"use client";

import React from "react";
import { Star } from "lucide-react";

/**
 * The watchlist toggle — one control, used by the /markets quotes board and
 * the /companies browser.
 *
 * Icon plus a word, never icon only, so the control explains itself without a
 * tooltip. The button keeps a fixed minimum width so the label change between
 * "Save" and "Saved" cannot resize it and move anything around it.
 */
export function WatchToggle({
  ticker,
  saved,
  onToggle,
}: {
  ticker: string;
  saved: boolean;
  onToggle: (ticker: string) => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={saved}
      onClick={() => onToggle(ticker)}
      title={
        saved
          ? `Remove ${ticker} from your watchlist`
          : `Save ${ticker} to your watchlist`
      }
      className={[
        "inline-flex min-h-11 min-w-[4.75rem] items-center justify-center gap-1.5 whitespace-nowrap rounded-md border px-2 text-[13px] font-semibold transition-colors duration-150",
        saved
          ? "border-ink bg-ink text-canvas hover:bg-ink-muted hover:border-ink-muted"
          : "border-rule bg-surface text-ink-muted hover:border-rule-strong hover:bg-surface-2 hover:text-ink",
      ].join(" ")}
    >
      <Star className={`h-4 w-4 ${saved ? "fill-current" : ""}`} aria-hidden="true" />
      <span>{saved ? "Saved" : "Save"}</span>
      <span className="sr-only">
        {saved ? ` — remove ${ticker} from your watchlist` : ` — add ${ticker} to your watchlist`}
      </span>
    </button>
  );
}

export default WatchToggle;
