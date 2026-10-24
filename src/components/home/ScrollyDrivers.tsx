"use client";

import React, { useEffect, useRef, useState } from "react";
import { usePrefersReducedMotion } from "@/components/Reveal";

/**
 * ScrollyDrivers — the model's risk factors as a scroll-driven briefing.
 *
 * The chart is pinned on a wide screen; the five chapters (the four heaviest
 * risk factors plus the adoption damper) scroll past it. Whichever chapter is
 * in the reading band lights its bar and its readout. Clicking a bar jumps to
 * its chapter.
 *
 * On a phone the pinned chart would eat the screen, so it is replaced by a
 * per-chapter bar: the same reading, attached to the sentence it belongs to.
 * The observer is IntersectionObserver only — no scroll listener, no rAF loop.
 */

export interface DeskDriverRow {
  id: string;
  short: string;
  gloss: string;
  explain: string;
  /** Points added to the composite (negative for the damper). */
  points: number;
  weightPct: number;
  /** Normalized reading, 0-1. */
  score: number;
  reading: string;
  kind: "risk" | "damper";
}

interface ScrollyDriversProps {
  rows: DeskDriverRow[];
  composite: number;
  probability: number;
}

const MAX_CHAPTERS = 5;

export function ScrollyDrivers({ rows, composite, probability }: ScrollyDriversProps) {
  const reduced = usePrefersReducedMotion();
  const chapterRefs = useRef<Map<string, HTMLLIElement>>(new Map());
  const lockUntilRef = useRef(0);

  const riskRows = [...rows]
    .filter((row) => row.kind === "risk")
    .sort((a, b) => b.points - a.points);
  const damper = rows.find((row) => row.kind === "damper") ?? null;

  const chapters = [
    ...riskRows.slice(0, MAX_CHAPTERS - (damper ? 1 : 0)),
    ...(damper ? [damper] : []),
  ];
  const [activeId, setActiveId] = useState(chapters[0]?.id ?? "");
  const chapterKey = chapters.map((row) => row.id).join("|");

  useEffect(() => {
    const nodes = Array.from(chapterRefs.current.values());
    if (nodes.length === 0 || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (Date.now() < lockUntilRef.current) return;
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const id = entry.target.getAttribute("data-chapter");
          if (id) setActiveId(id);
        }
      },
      { rootMargin: "-49% 0px -49% 0px", threshold: 0 }
    );

    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
    // chapterKey covers membership changes; the refs are stable nodes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chapterKey]);

  // Only the chapters appear in the pinned panel: every row there is a real
  // control. The smaller readings are accounted for in the footer and live in
  // the full table below.
  const maxPoints = Math.max(...chapters.map((row) => Math.abs(row.points)), 1);
  const chapterIds = new Set(chapters.map((row) => row.id));
  const restRows = rows.filter((row) => !chapterIds.has(row.id));
  const restPoints = restRows.reduce((sum, row) => sum + row.points, 0);

  const jumpTo = (id: string) => {
    const node = document.getElementById(`chapter-${id}`);
    if (!node) return;
    lockUntilRef.current = Date.now() + 900;
    node.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "center" });
    setActiveId(id);
  };

  if (chapters.length === 0) return null;

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,400px)_minmax(0,1fr)] lg:items-start">
      {/* Pinned instrument panel (desktop). */}
      <div className="hidden lg:sticky lg:top-24 lg:block">
        <figure className="card card-flush overflow-hidden">
          <div className="flex items-baseline justify-between gap-3 border-b border-rule px-4 py-3">
            <div>
              <p className="label">Composite score</p>
              <p className="readout-value mt-1 text-[22px]">
                {composite.toFixed(1)}
                <span className="text-[13px] font-normal text-ink-faint"> / 100</span>
              </p>
            </div>
            <div className="text-right">
              <p className="label">12-mo print</p>
              <p className="num mt-1 text-[22px] font-semibold text-ink">
                {probability.toFixed(1)}%
              </p>
            </div>
          </div>

          <div className="px-4 py-4">
            <p className="label mb-3">What earns most of the points</p>
            <ul className="space-y-3">
              {chapters.map((row) => {
                const active = row.id === activeId;
                const width = Math.max(3, (Math.abs(row.points) / maxPoints) * 100);
                const tone = row.kind === "damper" ? "rgb(var(--c-safe))" : "rgb(var(--c-risk))";
                return (
                  <li key={row.id}>
                    <button
                      type="button"
                      onClick={() => jumpTo(row.id)}
                      aria-pressed={active}
                      aria-controls={`chapter-${row.id}`}
                      className="group block min-h-11 w-full py-2 text-left"
                    >
                      <span className="flex items-baseline justify-between gap-3">
                        <span
                          className={`text-[13px] leading-tight ${
                            active ? "font-semibold text-ink" : "text-ink-muted"
                          }`}
                        >
                          {row.short}
                        </span>
                        <span className="num shrink-0 text-[13px] tabular-nums text-ink-faint">
                          {row.points >= 0 ? "+" : "−"}
                          {Math.abs(row.points).toFixed(1)}
                        </span>
                      </span>
                      <span className="mt-1 block h-[6px] w-full bg-surface-3">
                        <span
                          className="block h-full"
                          style={{
                            width: `${width}%`,
                            backgroundColor: tone,
                            opacity: active ? 1 : 0.32,
                            transition: reduced ? "none" : "opacity 180ms ease-out",
                          }}
                        />
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
            <p className="mt-4 border-t border-rule pt-2 text-[12px] leading-relaxed text-ink-faint">
              Points are the model&rsquo;s own contribution, not a forecast. Click a line to open its
              chapter.
            </p>
            {restRows.length > 0 ? (
              <p className="mt-1 text-[12px] leading-relaxed text-ink-faint">
                The other {restRows.length} readings add {restPoints >= 0 ? "+" : "−"}
                {Math.abs(restPoints).toFixed(1)} pts; all {rows.length} are in the full table below.
              </p>
            ) : null}
          </div>
        </figure>
      </div>

      {/* Chapters. */}
      <ol className="space-y-2 pb-16">
        {chapters.map((row, index) => {
          const active = row.id === activeId;
          const width = Math.max(4, (Math.abs(row.points) / maxPoints) * 100);
          const tone = row.kind === "damper" ? "rgb(var(--c-safe))" : "rgb(var(--c-risk))";
          return (
            <li
              key={row.id}
              id={`chapter-${row.id}`}
              data-chapter={row.id}
              ref={(node) => {
                if (node) chapterRefs.current.set(row.id, node);
                else chapterRefs.current.delete(row.id);
              }}
              className="scroll-mt-24 py-6 first:pt-0"
            >
              <div className="step" data-active={active}>
                <div className="step-body">
                  <div className="flex items-baseline justify-between gap-4">
                    <span className="index-tag">
                      {String(index + 1).padStart(2, "0")} /{" "}
                      {String(chapters.length).padStart(2, "0")}
                    </span>
                    <span className="num text-[13px] tabular-nums text-ink-faint">
                      {row.points >= 0 ? "+" : "−"}
                      {Math.abs(row.points).toFixed(1)} pts · weight {row.weightPct}%
                    </span>
                  </div>

                  <h3 className="mt-2 text-[19px] font-bold leading-tight tracking-[-0.02em] text-ink sm:text-[21px]">
                    {row.short}
                  </h3>
                  <p className="mt-1 text-[13px] font-medium text-ink-subtle">{row.gloss}</p>

                  {/* Phone reading: this chapter's own bar. */}
                  <div className="mt-3 flex items-center gap-2 lg:hidden">
                    <span className="h-[6px] w-full max-w-[220px] bg-surface-3">
                      <span
                        className="block h-full"
                        style={{ width: `${width}%`, backgroundColor: tone }}
                      />
                    </span>
                    <span className="num shrink-0 text-[12px] text-ink-faint">
                      reading {Math.min(100, Math.round(row.score * 100))}/100
                    </span>
                  </div>

                  <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-ink-muted">
                    {row.explain}
                  </p>
                  <p className="num mt-2 max-w-xl text-[13px] leading-relaxed text-ink-subtle">
                    {row.reading}
                  </p>
                  <p className="mt-2 hidden text-[12px] text-ink-faint lg:block">
                    reading {Math.min(100, Math.round(row.score * 100))}/100
                  </p>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

export default ScrollyDrivers;
