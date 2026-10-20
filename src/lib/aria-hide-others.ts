/**
 * "Mark others" — take the rest of the document out of the accessibility tree
 * while an overlay is open.
 *
 * THE RULE THIS FILE EXISTS TO ENFORCE
 * An overlay that says `aria-modal="true"` is a promise: the page behind it
 * is not reachable with a screen reader. Without this, a reader who opens the
 * command palette can still walk into the page behind it with the virtual
 * cursor, and the promise is a lie.
 *
 * HOW IT IS DONE
 *   1. The overlay's own subtree is excluded - it must stay visible.
 *   2. Anything that is ALREADY `aria-hidden` is left exactly as it is. We
 *      never save an original value and we never restore one: we only ever
 *      remove the attribute from the elements we added it to.
 *   3. A live region is never hidden, and neither is the chain of ancestors
 *      that leads to one - otherwise the announcement would be swallowed.
 *   4. OVERLAPPING OVERLAYS NEVER CLOBBER EACH OTHER. Every element carries a
 *      COUNT of the overlays that are currently hiding it. The attribute comes
 *      off only when that count falls back to zero, so the first overlay to
 *      close leaves the second one's hiding in place.
 *
 * The count is the whole trick. A "save the original value and put it back"
 * implementation breaks the moment two overlays overlap: the first one to
 * close restores the page while the second overlay is still open.
 */

/**
 * The elements that must keep talking. A live region is never hidden, because
 * hiding it would silence the announcement it exists to make.
 */
const LIVE_SELECTOR =
  '[aria-live], [role="status"], [role="alert"], [role="log"], [role="timer"]';

/**
 * How many overlays are hiding each element right now.
 *
 * This is a COUNTER, never a saved original value: an element that was already
 * `aria-hidden` is never in here, and an element hidden by two overlays is
 * only un-hidden when the second one lets go.
 */
const hiddenCounts = new Map<HTMLElement, number>();

/** True when the element is a live region. */
function isLiveRegion(element: Element): boolean {
  return element.matches(LIVE_SELECTOR);
}

/** True when the element holds a live region somewhere inside it. */
function holdsLiveRegion(element: Element): boolean {
  return element.querySelector(LIVE_SELECTOR) !== null;
}

/**
 * True when the element holds nothing at all: no children, no text, no
 * accessible name of its own.
 *
 * An inert element contributes nothing to the accessibility tree, so hiding it
 * is pointless - and it may hold a live region LATER. Next's route announcer
 * is an empty element until a navigation happens, and a hidden ancestor would
 * silence the announcement it is about to make.
 */
function isInert(element: HTMLElement): boolean {
  if (element.children.length > 0) return false;
  if ((element.textContent ?? "").trim().length > 0) return false;
  if (element.hasAttribute("aria-label")) return false;
  if (element.hasAttribute("aria-labelledby")) return false;
  if (element.hasAttribute("title")) return false;
  return true;
}

/**
 * Collect the elements that can be hidden.
 *
 * The walk is depth-first and stops at anything that has to stay: the
 * overlay's own subtree, an element that is already hidden, and the chain of
 * ancestors around a live region.
 */
function collectHideable(root: HTMLElement, exclude: HTMLElement | null): HTMLElement[] {
  const hideable: HTMLElement[] = [];

  const walk = (parent: HTMLElement): void => {
    for (const child of Array.from(parent.children)) {
      if (!(child instanceof HTMLElement)) continue;
      /** The overlay itself, and anything that holds it. */
      if (exclude && (child === exclude || child.contains(exclude))) continue;
      /** A live region is never hidden. */
      if (isLiveRegion(child)) continue;
      /** An element that is already hidden keeps its own hiding. */
      if (child.getAttribute("aria-hidden") === "true") continue;
      /** An inert element has nothing to hide, and may hold one later. */
      if (isInert(child)) continue;
      /**
       * An element with a live region inside it stays visible, but what it
       * holds is still walked: the page behind goes away, the announcement
       * does not.
       */
      if (holdsLiveRegion(child)) {
        walk(child);
        continue;
      }
      hideable.push(child);
    }
  };

  walk(root);
  return hideable;
}

/**
 * Hide the document behind an overlay.
 *
 * Returns the function that puts it back. Calling it twice is harmless.
 *
 * @param exclude The overlay's own element. It is never hidden.
 */
export function hideOthers(exclude: HTMLElement | null): () => void {
  if (typeof document === "undefined" || !document.body) return () => {};

  const hidden = collectHideable(document.body, exclude);

  for (const element of hidden) {
    hiddenCounts.set(element, (hiddenCounts.get(element) ?? 0) + 1);
    element.setAttribute("aria-hidden", "true");
  }

  let released = false;
  return () => {
    if (released) return;
    released = true;
    for (const element of hidden) {
      const count = (hiddenCounts.get(element) ?? 1) - 1;
      if (count <= 0) {
        hiddenCounts.delete(element);
        /** Restore exactly what we added: the attribute, and nothing else. */
        element.removeAttribute("aria-hidden");
      } else {
        hiddenCounts.set(element, count);
      }
    }
  };
}

export default hideOthers;
