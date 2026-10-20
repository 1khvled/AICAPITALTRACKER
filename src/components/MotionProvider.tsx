"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Activity, Check } from "lucide-react";

/**
 * Motion preference.
 *
 * The stylesheet kills every animation when the reader's OS asks for reduced
 * motion — that is correct and it stays the DEFAULT. But an OS-level switch is
 * a blunt instrument: a reader who has "reduce motion" on system-wide may
 * still want the market tape to move, and a reader whose OS setting is stuck
 * on gets a site that looks broken ("why is the top bar dead?").
 *
 * So the OS preference is only the default here. The reader can override it:
 * follow the system, force motion on, or force it off. The choice is stored on
 * the device and applied to <html data-motion="..."> BEFORE first paint by the
 * boot script in the layout, so there is no flash of the wrong state.
 *
 * An explicit "on" re-enables the tape only. The reveal/fade machinery stays
 * as the system asked for it — that is the part that can actually make someone
 * unwell, and a reader who wants it can still scroll.
 */

export type MotionPreference = "auto" | "on" | "off";

const STORAGE_KEY = "aict-motion";
const MOTION_EVENT = "aict:motion-change";

interface MotionContextValue {
  preference: MotionPreference;
  setPreference: (value: MotionPreference) => void;
  /** True when motion is actually running right now. */
  active: boolean;
  /** True when the OS asked for reduced motion and the reader has not overridden it. */
  systemReduced: boolean;
}

const MotionContext = createContext<MotionContextValue | null>(null);

function readStoredPreference(): MotionPreference {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw === "on" || raw === "off" || raw === "auto") return raw;
  } catch {
    /* private mode: fall back to the system preference */
  }
  return "auto";
}

/**
 * Apply the preference to the document. `auto` removes the attribute so the
 * stylesheet's own prefers-reduced-motion block takes over.
 */
export function applyMotionPreference(preference: MotionPreference, systemReduced: boolean) {
  const root = document.documentElement;
  if (preference === "auto") {
    if (systemReduced) root.setAttribute("data-motion", "off");
    else root.removeAttribute("data-motion");
    return;
  }
  root.setAttribute("data-motion", preference);
}

export function MotionProvider({ children }: { children: React.ReactNode }) {
  const [preference, setPreferenceState] = useState<MotionPreference>("auto");
  const [systemReduced, setSystemReduced] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const stored = readStoredPreference();
    setSystemReduced(query.matches);
    setPreferenceState(stored);
    applyMotionPreference(stored, query.matches);

    const onChange = (event: MediaQueryListEvent) => {
      setSystemReduced(event.matches);
      applyMotionPreference(readStoredPreference(), event.matches);
    };
    if (typeof query.addEventListener === "function") {
      query.addEventListener("change", onChange);
      return () => query.removeEventListener("change", onChange);
    }
    return undefined;
  }, []);

  const setPreference = useCallback((value: MotionPreference) => {
    setPreferenceState(value);
    try {
      window.localStorage.setItem(STORAGE_KEY, value);
    } catch {
      /* private mode: the choice simply does not persist */
    }
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    applyMotionPreference(value, reduced);
    window.dispatchEvent(new CustomEvent(MOTION_EVENT));
  }, []);

  const value = useMemo<MotionContextValue>(
    () => ({
      preference,
      setPreference,
      systemReduced,
      active: preference === "on" || (preference === "auto" && !systemReduced),
    }),
    [preference, setPreference, systemReduced],
  );

  return <MotionContext.Provider value={value}>{children}</MotionContext.Provider>;
}

export function useMotionPreference(): MotionContextValue {
  const context = useContext(MotionContext);
  if (!context) {
    return {
      preference: "auto",
      setPreference: () => undefined,
      systemReduced: false,
      active: true,
    };
  }
  return context;
}

/**
 * The control. A single button that cycles follow-system → always on → always
 * off, with the current state in its accessible name and a visible label in the
 * footer copy (the icon alone would not explain the three states).
 */
export function MotionToggle({ className = "" }: { className?: string }) {
  const { preference, setPreference, active } = useMotionPreference();

  /**
   * The cycle is deliberately independent of what the OS asks for:
   * follow the system → always on → always off → follow the system.
   * A reader whose system has motion off must always be able to reach "on"
   * in one press, and the label must never depend on a value that only
   * arrives after hydration.
   */
  const next: MotionPreference =
    preference === "auto" ? "on" : preference === "on" ? "off" : "auto";

  const label =
    preference === "auto"
      ? "Motion: follow the system. Activate to force motion on."
      : preference === "on"
        ? "Motion: always on. Activate to turn motion off."
        : "Motion: always off. Activate to follow the system again.";

  return (
    <button
      type="button"
      onClick={() => setPreference(next)}
      title={label}
      aria-label={label}
      className={[
        "flex h-11 w-11 items-center justify-center rounded-md border border-white/15 text-header-ink transition-colors hover:bg-white/5 hover:text-white",
        className,
      ].join(" ")}
    >
      {active ? (
        <Activity className="h-4 w-4" aria-hidden="true" />
      ) : (
        <Check className="h-4 w-4 opacity-70" aria-hidden="true" />
      )}
    </button>
  );
}

export default MotionProvider;
