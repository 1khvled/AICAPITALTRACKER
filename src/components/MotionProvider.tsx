"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Activity, Check } from "lucide-react";

/**
 * Motion preference — the market desk tape.
 *
 * The stylesheet silences the DECORATIVE motion when the reader's OS asks for
 * reduced motion: that is correct and it stays. The tape is different — it
 * carries the live readings, so it is information, not decoration. It runs by
 * default, it pauses the moment the pointer is over it, and a reader who wants
 * it still has this control.
 *
 * So the preference here is simply: is the tape moving? The choice is stored
 * on the device and applied to <html data-motion="off"> before first paint by
 * the boot script in the layout, so there is no flash of the wrong state.
 */

export type MotionPreference = "on" | "off";

const STORAGE_KEY = "aict-motion";
const MOTION_EVENT = "aict:motion-change";

interface MotionContextValue {
  preference: MotionPreference;
  setPreference: (value: MotionPreference) => void;
  /** True when the tape is actually running right now. */
  active: boolean;
  /** True when the OS asked for reduced motion (the decorative motion obeys it). */
  systemReduced: boolean;
}

const MotionContext = createContext<MotionContextValue | null>(null);

function readStoredPreference(): MotionPreference {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw === "off") return "off";
  } catch {
    /* private mode: the tape runs */
  }
  return "on";
}

/**
 * Apply the preference to the document. "on" removes the attribute so the
 * stylesheet's default applies (the tape runs); "off" stops it.
 */
export function applyMotionPreference(preference: MotionPreference) {
  const root = document.documentElement;
  if (preference === "off") {
    root.setAttribute("data-motion", "off");
    return;
  }
  root.removeAttribute("data-motion");
}

export function MotionProvider({ children }: { children: React.ReactNode }) {
  const [preference, setPreferenceState] = useState<MotionPreference>("on");
  const [systemReduced, setSystemReduced] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const stored = readStoredPreference();
    setSystemReduced(query.matches);
    setPreferenceState(stored);
    applyMotionPreference(stored);

    const onChange = (event: MediaQueryListEvent) => setSystemReduced(event.matches);
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
    applyMotionPreference(value);
    window.dispatchEvent(new CustomEvent(MOTION_EVENT));
  }, []);

  const value = useMemo<MotionContextValue>(
    () => ({
      preference,
      setPreference,
      systemReduced,
      active: preference === "on",
    }),
    [preference, setPreference, systemReduced],
  );

  return <MotionContext.Provider value={value}>{children}</MotionContext.Provider>;
}

export function useMotionPreference(): MotionContextValue {
  const context = useContext(MotionContext);
  if (!context) {
    return {
      preference: "on",
      setPreference: () => undefined,
      systemReduced: false,
      active: true,
    };
  }
  return context;
}

/**
 * The control: one button that starts and stops the tape. The icon alone
 * would not explain the two states, so the accessible name says it in words.
 */
export function MotionToggle({ className = "" }: { className?: string }) {
  const { preference, setPreference, active } = useMotionPreference();

  const label = active
    ? "Market tape: moving. Activate to stop it."
    : "Market tape: still. Activate to move it.";

  return (
    <button
      type="button"
      onClick={() => setPreference(active ? "off" : "on")}
      title={label}
      aria-label={label}
      aria-pressed={active}
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
