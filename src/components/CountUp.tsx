"use client";

import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { usePrefersReducedMotion } from "./Reveal";

/**
 * CountUp — a number that counts to its value instead of snapping to it.
 *
 * Rules:
 *   - The value the server renders is always the TRUE value. The animation
 *     only ever plays in the browser, and it plays from a start point to that
 *     same true value, so the reader always ends on the published number.
 *   - A layout effect runs the first frame before the browser paints, so the
 *     reader never sees the number jump backwards.
 *   - The digits are tabular, so the width does not change while it counts
 *     (no reflow, no CLS).
 *   - Under prefers-reduced-motion the number is simply the value.
 */

const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

export interface UseCountUpOptions {
  /** How long the count takes, in milliseconds. */
  duration?: number;
  /** Where the FIRST count starts from. Later changes count from the last value. */
  startFrom?: number;
  /** Set false to pin the number to its target. */
  enabled?: boolean;
}

/**
 * Returns a number that animates toward `target`.
 * The first animation starts at `startFrom`; every later change animates
 * from the value that was on screen, so a scenario switch reads as a move.
 *
 * `enabled: false` PINS the number to its target and does NOT consume the
 * animation: the start point is left untouched, so flipping `enabled` back
 * on later still counts up from `startFrom`. That is what lets a chart arm
 * its number now and fire it when the reader scrolls it into view.
 */
export function useCountUp(target: number, options: UseCountUpOptions = {}) {
  const { duration = 800, startFrom, enabled = true } = options;
  const [value, setValue] = useState(target);
  const fromRef = useRef<number | null>(null);
  const frameRef = useRef<number | null>(null);

  useIsomorphicLayoutEffect(() => {
    if (!enabled) {
      // Pinned: show the true value, but keep the start point for later.
      setValue(target);
      return undefined;
    }

    const from = fromRef.current ?? startFrom ?? target;
    fromRef.current = target;

    if (from === target) {
      setValue(target);
      return undefined;
    }

    const started = performance.now();
    const step = (now: number) => {
      const t = Math.min(1, (now - started) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(from + (target - from) * eased);
      frameRef.current = t < 1 ? window.requestAnimationFrame(step) : null;
    };
    frameRef.current = window.requestAnimationFrame(step);

    return () => {
      if (frameRef.current !== null) window.cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    };
  }, [target, duration, startFrom, enabled]);

  return value;
}

export interface CountUpProps {
  value: number;
  /** Decimal places. Matches the `.toFixed(n)` the server would have printed. */
  decimals?: number;
  /** Suffix printed after the digits, e.g. "%". */
  suffix?: string;
  /** Prefix printed before the digits. */
  prefix?: string;
  duration?: number;
  startFrom?: number;
  className?: string;
  style?: React.CSSProperties;
}

export function CountUp({
  value,
  decimals = 1,
  suffix = "",
  prefix = "",
  duration = 800,
  startFrom,
  className,
  style,
}: CountUpProps) {
  const reduced = usePrefersReducedMotion();
  const current = useCountUp(value, { duration, startFrom, enabled: !reduced });

  return (
    <span className={className} style={style}>
      {prefix}
      {current.toFixed(decimals)}
      {suffix}
    </span>
  );
}

export default CountUp;
