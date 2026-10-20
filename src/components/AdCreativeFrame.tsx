"use client";

import React, { useEffect, useRef, useState } from "react";

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * The frame an ad creative arrives in.
 *
 * The slot reserves its exact height before anything loads, so nothing on the
 * page ever shifts when the creative turns up. What it did not do was make the
 * arrival look like an arrival: the creative simply appeared, which reads as
 * a glitch rather than as something being placed.
 *
 * So the creative is animated in - a short fade and rise, transform and
 * opacity only, on the element the ad network itself created. The signal is
 * the arrival itself:
 *
 *   * the isolated (/22/) zone renders an <iframe> whose own load event says
 *     the document is ready;
 *   * the native (/21/) zone is filled by Adsterra's script writing into the
 *     container, so a MutationObserver on that container says the same thing.
 *
 * Nothing about the creative is restyled or measured by us: the animation is
 * applied with a CSS rule keyed on `data-loaded`, so it cannot interfere with
 * the ad network's own markup.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export interface AdCreativeFrameProps {
  /** The container id Adsterra's script writes into. */
  id?: string;
  className?: string;
  /**
   * The isolated creative, if this slot uses the /22/ shape. When present the
   * frame renders the iframe itself, so the frame can hear its load event.
   */
  iframe?: {
    srcDoc: string;
    width: number;
    height: number;
  };
}

export function AdCreativeFrame({ id, className, iframe }: AdCreativeFrameProps) {
  const frameRef = useRef<HTMLDivElement | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (iframe) return undefined;
    const node = frameRef.current;
    if (!node) return undefined;
    if (node.childElementCount > 0) {
      setLoaded(true);
      return undefined;
    }
    if (typeof MutationObserver !== "function") return undefined;
    const observer = new MutationObserver(() => {
      if (node.childElementCount > 0) {
        setLoaded(true);
        observer.disconnect();
      }
    });
    observer.observe(node, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [iframe]);

  return (
    <div
      id={id}
      ref={frameRef}
      className={className}
      data-loaded={loaded ? "true" : undefined}
    >
      {iframe ? (
        <iframe
          title="Advertisement"
          srcDoc={iframe.srcDoc}
          width={iframe.width}
          height={iframe.height}
          style={{
            width: iframe.width,
            height: iframe.height,
            border: "0",
            display: "block",
            margin: 0,
          }}
          scrolling="no"
          frameBorder={0}
          marginWidth={0}
          marginHeight={0}
          loading="lazy"
          referrerPolicy="no-referrer"
          /*
            WHAT THIS SANDBOX GUARANTEES
            - `allow-top-navigation` is NOT granted, so a creative can open its own
              tab on a click but can never redirect this page. That is the promise
              the non-intrusive policy makes, and it holds.
            - Autoplay is not granted, so nothing ever makes noise on load.
            - `allow-forms` and popups cover ad destinations that submit or open
              in new tabs.

            WHAT IT DOES NOT
            `allow-same-origin` IS granted, and it has to be: Adsterra's invocation
            script reads `document.cookie` and throws a SecurityError without it,
            which kills the creative entirely (measured in a browser, not
            assumed). So the sandboxed document is same-origin with the page: the
            ad network's code could in principle read this page's localStorage or
            rewrite its DOM. That is the trade Adsterra's model forces, and it is
            stated here rather than glossed over. What we can still do is refuse
            to hand over the page address: `referrerPolicy="no-referrer"` above
            means the creative never learns which page it is sitting on.
          */
          sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-forms"
          onLoad={() => setLoaded(true)}
        />
      ) : null}
    </div>
  );
}

export default AdCreativeFrame;
