"use client";

import { useEffect, useRef, useState } from "react";

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * A spring for numbers.
 *
 * The Apple rule (Designing Fluid Interfaces): "an interface feels alive when
 * motion starts from the current on-screen value, inherits the user's
 * velocity, projects momentum forward, and can be grabbed and reversed at any
 * instant."
 *
 * A CSS transition cannot do that: it has a fixed duration and a fixed
 * destination, so a value that changes twice in quick succession has to
 * either wait or jump. A spring can. It has no duration at all - the settle
 * time emerges from its parameters - and it re-targets from wherever the
 * value currently is, so the second change continues the first instead of
 * restarting it.
 *
 * The default here is a CRITICALLY damped spring: damping ratio 1.0, which
 * means it arrives quickly and never overshoots. Overshoot is for momentum
 * the reader created with a flick; a number that springs past its target and
 * comes back reads as a mistake, not as physics.
 *
 * Reduced motion is honoured: the value simply IS the target.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export interface SpringOptions {
  /**
   * How hard the spring pulls toward the target. Higher is faster.
   * 170 is roughly "a number that keeps up with a finger".
   */
  stiffness?: number;
  /**
   * The mass being moved. Higher is heavier: slower to start, more inertia.
   */
  mass?: number;
  /**
   * Damping. By default it is set to critical damping for the stiffness and
   * mass, which is the "no overshoot" house style. Pass a value below
   * critical damping (2 * sqrt(stiffness * mass)) only for a deliberate bounce.
   */
  damping?: number;
  /** Below this distance (and this speed) the spring snaps and stops. */
  epsilon?: number;
}

interface SpringState {
  value: number;
  velocity: number;
  target: number;
}

export function useSpringValue(
  target: number,
  options: SpringOptions = {},
  /** Set false when the OS asks for reduced motion: the value IS the target. */
  enabled = true
): number {
  const { stiffness = 170, mass = 1, epsilon = 0.005 } = options;
  const damping = options.damping ?? 2 * Math.sqrt(stiffness * mass);

  const [value, setValue] = useState(target);
  const stateRef = useRef<SpringState>({ value: target, velocity: 0, target });

  useEffect(() => {
    const state = stateRef.current;
    state.target = target;

    if (!enabled) {
      state.value = target;
      state.velocity = 0;
      setValue(target);
      return;
    }

    let frame = 0;
    let last = performance.now();

    const step = (now: number) => {
      // A long frame (a background tab, a slow paint) must not be integrated
      // as one huge step or the spring would explode.
      const dt = Math.min(0.032, Math.max(0, (now - last) / 1000));
      last = now;

      const force = -stiffness * (state.value - state.target) - damping * state.velocity;
      state.velocity += (force / mass) * dt;
      state.value += state.velocity * dt;

      if (
        Math.abs(state.value - state.target) < epsilon &&
        Math.abs(state.velocity) < epsilon
      ) {
        state.value = state.target;
        state.velocity = 0;
        setValue(state.target);
        frame = 0;
        return;
      }

      setValue(state.value);
      frame = window.requestAnimationFrame(step);
    };

    frame = window.requestAnimationFrame(step);
    return () => {
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [target, stiffness, mass, damping, epsilon, enabled]);

  return value;
}
