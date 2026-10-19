"use client";

import Script from "next/script";
import { useEffect, useRef, useState } from "react";

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * <AdScript /> — viewport gate for Adsterra invocation scripts.
 * ─────────────────────────────────────────────────────────────────────────────
 * <AdSlot /> server-renders the reserved box; this component only decides WHEN
 * the third-party script is allowed to load. Nothing runs until the slot sits
 * within 400px of the viewport, so a phone pays for the units it actually
 * scrolls past — never for the ones below. When IntersectionObserver is
 * unavailable the script loads immediately (the old behaviour). The reserved
 * height in `.ad-slot__frame` means the page still has zero layout shift when
 * the creative lands.
 *
 * Client-only by necessity: Adsterra is a browser script. SSR renders the
 * empty gate (a display:contents span), and the script element only exists
 * after the effect has run in the browser — no hydration mismatch possible.
 * Scripts below the fold still load after window load via `lazyOnload`.
 */
export function AdScript({
  src,
  strategy,
  id,
  placementId,
  socialBar,
}: {
  src: string;
  strategy: "afterInteractive" | "lazyOnload";
  id: string;
  placementId: string;
  /** Social bar keeps its own opt-in marker; every other format omits it. */
  socialBar?: boolean;
}) {
  const gateRef = useRef<HTMLSpanElement | null>(null);
  const [armed, setArmed] = useState(false);

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") {
      setArmed(true);
      return;
    }
    const node = gateRef.current;
    if (!node) {
      setArmed(true);
      return;
    }
    /**
     * The gate span is `display: contents`, so it generates no box — and an
     * element with no box reports no intersection, which would mean the
     * script NEVER loads. Observe the slot the gate lives in instead: that is
     * the box the reader actually scrolls past.
     */
    const target = node.parentElement ?? node;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setArmed(true);
          observer.disconnect();
        }
      },
      // Start loading just before the slot scrolls into view.
      { rootMargin: "400px 0px" }
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, []);

  return (
    <span ref={gateRef} className="contents" data-ad-gate={placementId}>
      {armed ? (
        <Script
          src={src}
          strategy={strategy}
          async
          data-cfasync="false"
          data-adsterra-placement={placementId}
          id={id}
          {...(socialBar ? { "data-adsterra-social-bar": "1" } : {})}
        />
      ) : null}
    </span>
  );
}
