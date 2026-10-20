"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { Undo2 } from "lucide-react";

/**
 * An undoable action, announced in place.
 *
 * THE PATTERN
 * Something happened that the reader might want to take back - a ticker left
 * the watchlist, a call left the history, a code went to the clipboard. The
 * action is announced in a live region next to the control that caused it, and
 * an UNDO button sits in that region for a few seconds. This is the "action
 * toast" pattern, hand-rolled: there is no toast library on this site and
 * there is not going to be one.
 *
 * THE TIMER
 * The window is five to eight seconds (six by default). It is PAUSED while
 * the pointer is over the region or while the region holds the focus, so a
 * reader who reaches for the undo button does not lose it under their cursor.
 *
 * The pause keeps the REMAINING time, not a fresh window: the region holds
 * two numbers - the time left, and the timestamp of the last resume - and a
 * resume restarts the clock from the time that was left. A reader who brushes
 * the pointer across the region for half a second gets half a second back, not
 * another six seconds. Without that, hovering would quietly extend the window
 * forever and the undo would never be reachable by a reader who is ready.
 *
 * ZERO CLS
 * The region is ALWAYS in the document - a live region that is added to the
 * DOM with its message is not reliably announced. It is never removed, only
 * emptied, so:
 *
 *   - "anchored" placement positions the region absolutely, next to the
 *     control that caused it: it hangs over the page and moves nothing;
 *   - "flow" placement is for a slot the owner has reserved with a fixed
 *     height, so the row that appears does not push the page down.
 *
 * Either way nothing on the page moves when the region appears.
 */

/** The default undo window. Five to eight seconds; six is the house default. */
export const UNDO_WINDOW_MS = 6000;

/** The shortest window the component accepts. */
export const UNDO_WINDOW_MIN_MS = 5000;

/** The longest window the component accepts. */
export const UNDO_WINDOW_MAX_MS = 8000;

export interface UndoActionProps {
  /**
   * What the reader is told. An empty string means there is nothing to say:
   * the region stays in the document, empty, so the next message is announced.
   */
  message: string;
  /** Called when the reader presses UNDO. */
  onUndo: () => void;
  /** Called when the window closes without an undo. */
  onExpire?: () => void;
  /**
   * How long the window stays open. Clamped to five-eight seconds.
   */
  durationMs?: number;
  /**
   * "anchored" - absolutely positioned beside the control that caused it.
   * "flow" - in the flow, inside a slot the owner has reserved.
   */
  placement?: "anchored" | "flow";
  /** The visible label on the undo control. */
  undoLabel?: string;
  /** A screen-reader-only addition to the undo control's name. */
  undoDescription?: string;
  /** Extra classes on the region. */
  className?: string;
}

export function UndoAction({
  message,
  onUndo,
  onExpire,
  durationMs = UNDO_WINDOW_MS,
  placement = "flow",
  undoLabel = "Undo",
  undoDescription,
  className,
}: UndoActionProps) {
  /** The window the reader is given, clamped to the house range. */
  const windowMs = Math.min(
    UNDO_WINDOW_MAX_MS,
    Math.max(UNDO_WINDOW_MIN_MS, durationMs),
  );

  const [paused, setPaused] = useState(false);

  /** The live timer. */
  const timerRef = useRef<number | null>(null);
  /** The moment the window ends. */
  const deadlineRef = useRef(0);
  /** The time left in the window. */
  const remainingRef = useRef(windowMs);
  /** The moment the clock was last restarted. */
  const resumedAtRef = useRef(0);
  /** Whether the clock is currently held. */
  const pausedRef = useRef(false);

  /**
   * The callbacks live in refs so that a parent re-render can never restart
   * the clock: the timer is driven by the MESSAGE, not by the render.
   */
  const onUndoRef = useRef(onUndo);
  onUndoRef.current = onUndo;
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;

  const stopTimer = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  /** Start (or restart) the clock with `ms` left to run. */
  const startTimer = useCallback(
    (ms: number) => {
      stopTimer();
      remainingRef.current = Math.max(0, ms);
      resumedAtRef.current = Date.now();
      deadlineRef.current = resumedAtRef.current + remainingRef.current;
      timerRef.current = window.setTimeout(() => {
        timerRef.current = null;
        onExpireRef.current?.();
      }, remainingRef.current);
    },
    [stopTimer],
  );

  /** Hold the clock where it is and keep the time that was left. */
  const pauseTimer = useCallback(() => {
    if (timerRef.current === null) return;
    window.clearTimeout(timerRef.current);
    timerRef.current = null;
    remainingRef.current = Math.max(0, deadlineRef.current - Date.now());
    pausedRef.current = true;
    setPaused(true);
  }, []);

  /** Let the clock run again, with the time that was left - not a new window. */
  const resumeTimer = useCallback(() => {
    if (!pausedRef.current) return;
    pausedRef.current = false;
    setPaused(false);
    startTimer(remainingRef.current);
  }, [startTimer]);

  /**
   * The window is driven by the message: a new message opens a new window, an
   * empty message closes it.
   */
  useEffect(() => {
    if (!message) {
      stopTimer();
      pausedRef.current = false;
      setPaused(false);
      return undefined;
    }
    pausedRef.current = false;
    setPaused(false);
    startTimer(windowMs);
    return stopTimer;
  }, [message, windowMs, startTimer, stopTimer]);

  /** The pointer is over the region: hold the clock. */
  const onPointerEnter = useCallback(() => pauseTimer(), [pauseTimer]);
  /** The pointer has left: let the clock run again. */
  const onPointerLeave = useCallback(() => resumeTimer(), [resumeTimer]);

  /** Focus moved into the region: hold the clock. */
  const onFocus = useCallback(
    (event: React.FocusEvent<HTMLDivElement>) => {
      const next = event.relatedTarget as Node | null;
      if (next && event.currentTarget.contains(next)) return;
      pauseTimer();
    },
    [pauseTimer],
  );

  /** Focus left the region: let the clock run again. */
  const onBlur = useCallback(
    (event: React.FocusEvent<HTMLDivElement>) => {
      const next = event.relatedTarget as Node | null;
      if (next && event.currentTarget.contains(next)) return;
      resumeTimer();
    },
    [resumeTimer],
  );

  const handleUndo = useCallback(() => {
    stopTimer();
    pausedRef.current = false;
    setPaused(false);
    onUndoRef.current();
  }, [stopTimer]);

  const visible = message.length > 0;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
      onFocus={onFocus}
      onBlur={onBlur}
      className={[
        placement === "anchored"
          ? "absolute right-0 top-full z-40 mt-1 w-max max-w-[17rem] rounded-md border border-rule bg-surface px-2 py-1.5 shadow-raised transition-opacity duration-150"
          : "flex items-center gap-3",
        placement === "anchored" && !visible
          ? "pointer-events-none opacity-0"
          : "opacity-100",
        className ?? "",
      ].join(" ")}
    >
      {visible ? (
        <>
          <span
            className={[
              "min-w-0 truncate text-[13px] leading-snug text-ink-muted",
              placement === "anchored" ? "flex-1" : "",
            ].join(" ")}
          >
            {message}
          </span>
          <button
            type="button"
            onClick={handleUndo}
            className="btn min-h-11 shrink-0 px-2.5 text-[13px]"
          >
            <Undo2 className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{undoLabel}</span>
            {undoDescription ? <span className="sr-only">{undoDescription}</span> : null}
          </button>
        </>
      ) : null}
      {visible && paused ? (
        <span className="sr-only">The undo window is on hold while you are here.</span>
      ) : null}
    </div>
  );
}

export default UndoAction;
