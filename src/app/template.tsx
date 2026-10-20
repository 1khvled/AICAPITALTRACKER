import React from "react";

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * The route transition.
 *
 * A template re-mounts on every navigation, which is exactly what an entrance
 * animation needs: the new page arrives instead of being swapped in.
 *
 * Two rules, both learned the hard way:
 *
 * 1. OPACITY ONLY. A transform on this wrapper would make it the containing
 *    block for every fixed and sticky descendant, so the ledger's sticky
 *    filter bar and the guides' contents panel would jump for the length of
 *    the animation. A cross-fade moves nothing.
 *
 * 2. NOT ON THE FIRST LOAD. The first paint is the LCP; fading it in would
 *    delay the page the reader came for and make a crawler see an empty
 *    document for a moment. Only a navigation - a second mount - animates.
 *
 * The animation is a transform-free opacity change, so it cannot shift
 * anything (zero CLS) and it is killed with the rest of the motion layer by
 * prefers-reduced-motion.
 * ─────────────────────────────────────────────────────────────────────────────
 */

/** How many times this template has mounted. The first one is the first load. */
let mountedOnce = false;

export default function Template({ children }: { children: React.ReactNode }) {
  const isFirstMount = !mountedOnce;
  mountedOnce = true;

  return (
    <div className={isFirstMount ? undefined : "route-enter"}>{children}</div>
  );
}
