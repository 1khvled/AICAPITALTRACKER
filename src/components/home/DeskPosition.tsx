"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

/**
 * DeskPosition — the reader's own number, on the same 0-100 line as the model
 * and the market.
 *
 * This is the homepage's one piece of gamification, and it is honest: there
 * are no points, badges or invented streaks. Until the reader moves the line
 * there is no "you" pin and no verdict — the card says "—", not a made-up
 * default. Once placed, the value is stored on this device only. Recording a
 * dated call (and being scored on it later) is the job of /your-call.
 */

interface DeskPositionProps {
  modelPct: number;
  marketPct: number;
  marketLabel: string;
  bandLabel: string;
}

const STORAGE_KEY = "aict-desk-position";

const clamp = (n: number) => Math.min(100, Math.max(0, n));

function signed(n: number): string {
  return `${n >= 0 ? "+" : "−"}${Math.abs(n).toFixed(1)}`;
}

export function DeskPosition({ modelPct, marketPct, marketLabel, bandLabel }: DeskPositionProps) {
  // The thumb starts between the two published numbers, but it is not the
  // reader's position until they touch it.
  const midpoint = Math.round(((modelPct + marketPct) / 2) * 2) / 2;
  const [value, setValue] = useState(midpoint);
  const [touched, setTouched] = useState(false);
  const [ready, setReady] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw != null) {
        const parsed = Number(raw);
        if (Number.isFinite(parsed)) {
          setValue(clamp(parsed));
          setTouched(true);
          setSaved(true);
        }
      }
    } catch {
      /* private mode: the slider still works, it just will not persist */
    }
    setReady(true);
  }, []);

  // Persist after the drag settles, and only claim "saved" if the write worked.
  useEffect(() => {
    if (!ready || !touched) return;
    const timer = window.setTimeout(() => {
      try {
        window.localStorage.setItem(STORAGE_KEY, String(value));
        setSaved(true);
      } catch {
        setSaved(false);
      }
    }, 180);
    return () => window.clearTimeout(timer);
  }, [ready, touched, value]);

  const update = (next: number) => {
    if (!Number.isFinite(next)) return;
    setValue(Math.round(clamp(next) * 2) / 2);
    setTouched(true);
  };

  const setFromClientX = (clientX: number, element: HTMLElement) => {
    const rect = element.getBoundingClientRect();
    if (rect.width <= 0) return;
    const next = ((clientX - rect.left) / rect.width) * 100;
    if (!Number.isFinite(next)) return;
    update(next);
  };

  const gapToModel = value - modelPct;
  const gapToMarket = value - marketPct;
  const closerToModel = Math.abs(gapToModel) < Math.abs(gapToMarket);
  const closerToMarket = Math.abs(gapToMarket) < Math.abs(gapToModel);

  const verdict = closerToModel
    ? "Closer to the model"
    : closerToMarket
      ? "Closer to the market"
      : "Dead centre between the two";

  return (
    <div className="card card-flush overflow-hidden">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-rule px-4 py-3">
        <div>
          <p className="label">Your position</p>
          <p className="text-[15px] font-semibold text-ink">
            Put your own number on the same line
          </p>
        </div>
        <span className="desk-meta">local only / drag</span>
      </div>

      <div className="px-4 py-4">
        <dl className="grid grid-cols-3 gap-3">
          <div className="readout">
            <dt className="readout-key">Market</dt>
            <dd className="readout-value text-[18px]">{marketPct.toFixed(1)}%</dd>
          </div>
          <div className="readout">
            <dt className="readout-key">You</dt>
            <dd className="readout-value text-[18px] text-accent-strong dark:text-accent-ink">
              {touched ? `${value.toFixed(1)}%` : "—"}
            </dd>
          </div>
          <div className="readout">
            <dt className="readout-key">Model</dt>
            <dd className="readout-value text-[18px]">{modelPct.toFixed(1)}%</dd>
          </div>
        </dl>

        <div
          role="slider"
          tabIndex={0}
          aria-label="Your 12-month AI bubble burst probability, in percent"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={value}
          aria-valuetext={
            touched
              ? `${value.toFixed(1)} percent`
              : "Not set. Drag, tap, or use the arrow keys to place yourself."
          }
          className="relative mt-4 h-12 cursor-ew-resize select-none touch-pan-y"
          onPointerDown={(event) => {
            event.currentTarget.setPointerCapture(event.pointerId);
            setFromClientX(event.clientX, event.currentTarget);
          }}
          onPointerMove={(event) => {
            if (event.pointerType === "mouse" && event.buttons !== 1) return;
            setFromClientX(event.clientX, event.currentTarget);
          }}
          onKeyDown={(event) => {
            const step = event.shiftKey ? 5 : 0.5;
            if (event.key === "ArrowLeft" || event.key === "ArrowDown") {
              event.preventDefault();
              update(value - step);
            } else if (event.key === "ArrowRight" || event.key === "ArrowUp") {
              event.preventDefault();
              update(value + step);
            } else if (event.key === "Home") {
              event.preventDefault();
              update(0);
            } else if (event.key === "End") {
              event.preventDefault();
              update(100);
            }
          }}
        >
          <div className="position-line absolute inset-x-0 top-1/2 -translate-y-1/2">
            <span
              className="position-pin"
              data-kind="market"
              style={{ left: `${marketPct}%` }}
              title={`${marketLabel}: ${marketPct.toFixed(1)}%`}
            />
            {touched ? (
              <span
                className="position-pin"
                data-kind="you"
                style={{ left: `${value}%` }}
                title={`You: ${value.toFixed(1)}%`}
              />
            ) : null}
            <span
              className="position-pin"
              data-kind="model"
              style={{ left: `${modelPct}%` }}
              title={`Model: ${modelPct.toFixed(1)}%`}
            />
          </div>
        </div>

        <div className="flex justify-between text-[12px] text-ink-faint">
          <span>0%</span>
          <span>50%</span>
          <span>100%</span>
        </div>

        <div className="mt-2 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-t border-rule pt-3">
          <p className="text-[14px] font-medium text-ink">
            {touched ? verdict : "Move the line to place yourself"}
          </p>
          <p className="num text-[13px] text-ink-muted">
            {touched
              ? `${signed(gapToModel)} pts vs model · ${signed(gapToMarket)} pts vs market`
              : "nothing stored yet"}
          </p>
        </div>

        <p className="mt-2 text-[12px] leading-relaxed text-ink-faint">
          The model reads {bandLabel.toLowerCase()} today. Your number stays in this browser; nothing
          is uploaded. It is a reading, not a prediction.{" "}
          <Link href="/your-call" className="underline decoration-rule-strong underline-offset-2 hover:text-ink">
            Record a dated call and get scored on it
          </Link>
          .
        </p>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-rule pt-3">
          <span className="desk-meta">
            {!touched
              ? `nothing stored / ${marketLabel}`
              : saved
                ? `saved on this device / ${marketLabel}`
                : `not saved in this browser / ${marketLabel}`}
          </span>
          <Link href="/your-call" className="btn min-h-11">
            Your call
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </div>
  );
}

export default DeskPosition;
