"use client";

import React, {
  useEffect,
  useRef,
  useState,
  type ElementType,
  type ReactNode,
  type RefObject,
} from "react";

/**
 * Reveal — the site's one entrance animation.
 *
 * A single IntersectionObserver is shared by every instance on the page
 * (module level, created lazily on the client). When an element crosses the
 * threshold it gets the `reveal-in` class and the CSS transition in
 * globals.css carries it from 10px down / transparent to its resting state.
 * The observer unobserves immediately after the trigger, so the animation
 * never replays.
 *
 * SSR safety:
 *   - The children render on the server with the base `reveal` class, so the
 *     markup and the text are in the HTML for crawlers and no-JS readers.
 *   - The *initial* hidden state lives behind `html.js-reveal`, a class the
 *     pre-paint boot script (src/app/layout.tsx) only adds when JavaScript
 *     is running. Without JS the content is simply there.
 *   - Nothing reads the window during render; the observer is created inside
 *     an effect.
 *   - No layout property is animated, so the reveal cannot shift anything
 *     that follows it (zero CLS).
 */

type RevealTag = "div" | "span" | "section" | "article" | "li" | "ul" | "ol" | "header" | "figure";

export interface RevealProps {
  children: ReactNode;
  /** Element to render. Defaults to a div. */
  as?: RevealTag;
  className?: string;
  /** Stagger in milliseconds. Capped at 600ms in practice by the callers. */
  delay?: number;
  /**
   * Fade only — no 10px lift. Use it for elements that must not move at
   * all (a bar inside a fixed track, a figure inside a fixed box), where
   * the lift would show the element peeking out of its own slot.
   */
  flat?: boolean;
}

type RevealCallback = () => void;

let sharedObserver: IntersectionObserver | null = null;
const pending = new WeakMap<Element, RevealCallback>();

/** The one observer. Created on the client, reused by every caller. */
function getObserver(): IntersectionObserver | null {
  if (typeof window === "undefined") return null;
  if (typeof window.IntersectionObserver !== "function") return null;
  if (sharedObserver) return sharedObserver;

  sharedObserver = new window.IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const fire = pending.get(entry.target);
        if (!fire) continue;
        pending.delete(entry.target);
        sharedObserver?.unobserve(entry.target);
        fire();
      }
    },
    { threshold: 0.15, rootMargin: "0px 0px -6% 0px" }
  );

  return sharedObserver;
}

/**
 * True once the referenced element has scrolled into view. Used where the
 * motion is driven by data (an arc sweeping to its value) rather than by a
 * wrapper class.
 */
export function useInView<T extends Element>(
  ref: RefObject<T | null>,
  onEnter?: () => void
): boolean {
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    // Same rule as the component above: a background tab gets the content
    // straight away, because its observer would never fire.
    if (typeof document !== "undefined" && document.hidden) {
      setInView(true);
      onEnter?.();
      return undefined;
    }

    const observer = getObserver();
    if (!observer) {
      // No IntersectionObserver: show the content rather than hide it.
      setInView(true);
      onEnter?.();
      return;
    }

    const fire = () => {
      setInView(true);
      onEnter?.();
    };
    pending.set(node, fire);
    observer.observe(node);

    return () => {
      pending.delete(node);
      observer.unobserve(node);
    };
    // `onEnter` is intentionally not a dependency: callers pass an inline
    // function and the effect must not re-subscribe on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ref]);

  return inView;
}

/**
 * The reader's motion preference. Read once on mount and on change, never
 * during render (so the server and the browser agree on the first paint).
 */
export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    if (typeof window.matchMedia !== "function") return;
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(query.matches);
    const onChange = (event: MediaQueryListEvent) => setReduced(event.matches);
    if (typeof query.addEventListener === "function") {
      query.addEventListener("change", onChange);
      return () => query.removeEventListener("change", onChange);
    }
    return undefined;
  }, []);

  return reduced;
}

export function Reveal({ children, as = "div", className, delay = 0, flat = false }: RevealProps) {
  const ref = useRef<HTMLElement | null>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    // The boot script's failsafe exists so a failed hydration can never leave
    // a page permanently blank. Once a Reveal mounts we know JS is alive, so
    // the failsafe can stand down.
    const boot = window as unknown as { __aictRevealFailsafe?: number };
    if (typeof boot.__aictRevealFailsafe === "number") {
      window.clearTimeout(boot.__aictRevealFailsafe);
      boot.__aictRevealFailsafe = undefined;
    }

    const node = ref.current;
    if (!node) return;

    // A background tab never fires IntersectionObserver callbacks, and a
    // reader is not looking at it anyway. Show the content immediately
    // rather than hold it in the "not yet arrived" state until the tab is
    // focused — a page that is blank until you click it is a blank page.
    if (typeof document !== "undefined" && document.hidden) {
      setShown(true);
      return undefined;
    }

    const observer = getObserver();
    if (!observer) {
      setShown(true);
      return;
    }

    const fire = () => setShown(true);
    pending.set(node, fire);
    observer.observe(node);

    return () => {
      pending.delete(node);
      observer.unobserve(node);
    };
  }, []);

  const Tag = as as ElementType;
  const classes = ["reveal"];
  if (flat) classes.push("reveal-flat");
  if (shown) classes.push("reveal-in");
  if (className) classes.push(className);

  return (
    <Tag
      ref={ref}
      className={classes.join(" ")}
      data-reveal-delay={delay ? String(delay) : undefined}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </Tag>
  );
}

export default Reveal;
