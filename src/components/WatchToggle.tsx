"use client";

import React, { useCallback, useRef, useState } from "react";
import { Star } from "lucide-react";
import { UndoAction } from "@/components/UndoAction";

/**
 * The watchlist toggle — one control, used by the /markets quotes board and
 * the /companies browser.
 *
 * Icon plus a word, never icon only, so the control explains itself without a
 * tooltip. The button keeps a fixed minimum width so the label change between
 * "Save" and "Saved" cannot resize it and move anything around it.
 *
 * THE UNDO
 * Taking a ticker off the watchlist used to be a one-way door. The toggle now
 * says what it did in a live region beside it and offers an UNDO button for a
 * few seconds - and the undo really puts the ticker back, because the state
 * the toggle produced is remembered and the watchlist is toggled back only
 * when that state is still the one on screen (if the reader has already
 * toggled the same ticker again, the undo stands down rather than making
 * things worse).
 *
 * ZERO CLS
 * The confirmation hangs over the page - it is absolutely positioned - so
 * nothing moves when it appears. It pauses while the pointer is on it or
 * while it holds the focus, so the reader can reach the undo button without
 * racing a timer.
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
  const [message, setMessage] = useState("");
  /**
   * The state this control produced. The undo only runs when that state is
   * still the one on screen.
   */
  const applied = useRef<boolean | null>(null);

  const handleToggle = useCallback(() => {
    const wasSaved = saved;
    onToggle(ticker);
    applied.current = !wasSaved;
    setMessage(
      wasSaved
        ? `${ticker} removed from your watchlist.`
        : `${ticker} saved to your watchlist.`,
    );
  }, [saved, onToggle, ticker]);

  const handleUndo = useCallback(() => {
    const state = applied.current;
    applied.current = null;
    setMessage("");
    if (state === null) return;
    /** The reader has changed this ticker again: leave it alone. */
    if (saved !== state) return;
    onToggle(ticker);
  }, [saved, onToggle, ticker]);

  const handleExpire = useCallback(() => {
    applied.current = null;
    setMessage("");
  }, []);

  return (
    <span className="relative inline-flex">
      <button
        type="button"
        aria-pressed={saved}
        onClick={handleToggle}
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

      <UndoAction
        placement="anchored"
        message={message}
        onUndo={handleUndo}
        onExpire={handleExpire}
        undoLabel="Undo"
        undoDescription={
          saved
            ? `put ${ticker} back on your watchlist`
            : `take ${ticker} off your watchlist again`
        }
      />
    </span>
  );
}

export default WatchToggle;
