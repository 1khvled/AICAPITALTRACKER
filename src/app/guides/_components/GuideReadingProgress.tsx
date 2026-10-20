"use client";

import React, { useEffect, useState } from "react";

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * The reading-progress rule.
 *
 * A hairline along the top of the screen that fills as the reader moves
 * through the guide's body. Three rules:
 *
 * 1. It is FIXED, not in the page flow. A progress bar that scrolls away with
 *    the header it lives under cannot report progress.
 * 2. It measures the article body (the element marked `data-guide-body`), not
 *    the whole document, so it reaches 100% at the end of the argument and not
 *    at the end of the footer.
 * 3. It is a transform only — `scaleX` on a hairline — so it can never shift
 *    the layout, and it is hidden from assistive technology: the table of
 *    contents already tells a screen-reader user where they are, and a
 *    continuously changing coordinate is noise.
 * ─────────────────────────────────────────────────────────────────────────────
 */
export function GuideReadingProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const body = document.querySelector<HTMLElement>("[data-guide-body]");

    const update = () => {
      if (!body) {
        setProgress(0);
        return;
      }
      const bodyTop = body.getBoundingClientRect().top + window.scrollY;
      const bodyHeight = body.offsetHeight;
      if (bodyHeight <= 0) {
        setProgress(0);
        return;
      }
      // The reader counts as having started once the guide's body has filled
      // the lower quarter of the screen.
      const travelled = window.scrollY + window.innerHeight * 0.25 - bodyTop;
      const ratio = travelled / bodyHeight;
      setProgress(Math.min(1, Math.max(0, ratio)));
    };

    // The update runs straight from the scroll event rather than from a
    // requestAnimationFrame: a browser withholds animation frames from a tab
    // that is not being painted, and a progress bar that only moves while the
    // tab is visible is a progress bar that lies. The work per event is one
    // measurement and one number, which is cheaper than a frame of paint.
    const onScroll = () => update();

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    // A tab that was in the background has not seen its own scrolls.
    document.addEventListener("visibilitychange", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      document.removeEventListener("visibilitychange", onScroll);
    };
  }, []);

  return (
    <div aria-hidden="true" className="fixed inset-x-0 top-0 z-[60] h-[2px]">
      <div
        className="h-full w-full origin-left bg-ink transition-transform duration-150 ease-out"
        style={{ transform: `scaleX(${progress})` }}
      />
    </div>
  );
}
