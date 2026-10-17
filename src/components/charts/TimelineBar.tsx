'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { chartHitProps } from './chartInteraction';

/**
 * Timeline visuals for detail + flow pages.
 * Every stage dot / tie strip is hover- and focus-reactive, with a live readout
 * below the graphic so the dates are never mouse-only.
 */

function shortDate(iso: string | null): string {
  if (!iso) return 'N/A';
  return iso.length >= 10 ? iso.slice(0, 10) : iso;
}

// ---------------------------------------------------------------------------
// DealTimeline: announce → effective → maturity as SVG dots + line with dates.
// Stages shown in sequence (not to time scale).
// ---------------------------------------------------------------------------

interface DealTimelineProps {
  announce: string | null;
  effective: string | null;
  maturity: string | null;
}

const STAGE_NOTES: Record<string, string> = {
  announce: 'Public disclosure date',
  effective: 'Date the money legally moved / terms took effect',
  maturity: 'Stated end of the facility, contract or term',
};

export function DealTimeline({ announce, effective, maturity }: DealTimelineProps) {
  const [active, setActive] = useState<string | null>(null);
  const stages = [
    { key: 'announce', label: 'ANNOUNCE', date: announce },
    { key: 'effective', label: 'EFFECTIVE', date: effective },
    { key: 'maturity', label: 'MATURITY', date: maturity },
  ];
  const known = stages.filter((s) => s.date).length;
  if (known === 0) {
    return (
      <div className="empty-note">
        No lifecycle dates disclosed for this transaction yet.
      </div>
    );
  }
  const W = 620;
  const LINE_Y = 58;
  const X0 = 34;
  const X1 = W - 34;
  const xs = stages.map((_, i) => X0 + (i / (stages.length - 1)) * (X1 - X0));
  const activeStage = stages.find((s) => s.key === active) ?? null;

  return (
    <div>
      <svg
        viewBox={`0 0 ${W} 132`}
        role="img"
        aria-label={`Transaction lifecycle: announced ${shortDate(announce)}, effective ${shortDate(effective)}, maturity ${shortDate(maturity)}.`}
        className="w-full h-auto"
      >
        <line x1={X0} y1={LINE_Y} x2={X1} y2={LINE_Y} stroke="#d4d4d8" strokeWidth={3} strokeLinecap="round" />
        {stages.map((stage, i) => {
          const present = Boolean(stage.date);
          const on = active === stage.key;
          return (
            <g
              key={stage.key}
              className="chart-hit"
              {...chartHitProps<SVGGElement>({
                label: `${stage.label}: ${shortDate(stage.date)}${
                  present ? '' : ', not disclosed'
                }. ${STAGE_NOTES[stage.key] ?? ''}`,
                interactive: false,
                focusable: true,
                onEnter: () => setActive(stage.key),
                onLeave: () => setActive((cur) => (cur === stage.key ? null : cur)),
              })}
            >
              {/* Track behind the marker picks up the active-stage tint. */}
              <circle
                cx={xs[i]}
                cy={LINE_Y}
                r={16}
                fill={on ? 'rgba(16,185,129,0.12)' : 'transparent'}
                stroke={on ? 'rgba(5,150,105,0.35)' : 'transparent'}
                strokeWidth={1}
              />
              <circle
                cx={xs[i]}
                cy={LINE_Y}
                r={on ? 13 : present ? 10 : 8}
                fill={present ? (on ? '#059669' : '#09090b') : '#fff'}
                stroke={present ? (on ? '#059669' : '#09090b') : '#a1a1aa'}
                strokeWidth={2}
                strokeDasharray={present ? undefined : '4 3'}
                style={{ transition: 'r 200ms cubic-bezier(0.22,1,0.36,1), fill 160ms ease' }}
              >
                <title>{`${stage.label}: ${shortDate(stage.date)}`}</title>
              </circle>
              {present && (
                <circle cx={xs[i]} cy={LINE_Y} r={3.5} fill={on ? '#fff' : '#fff'} />
              )}
              <text
                x={xs[i]}
                y={LINE_Y - 22}
                textAnchor="middle"
                fontSize={11}
                fontWeight={on ? 800 : 700}
                fontFamily="monospace"
                fill={on ? '#047857' : '#52525b'}
                style={{ pointerEvents: 'none' }}
              >
                {stage.label}
              </text>
              <text
                x={xs[i]}
                y={LINE_Y + 30}
                textAnchor="middle"
                fontSize={12.5}
                fontWeight={present ? (on ? 800 : 700) : 400}
                fontFamily="monospace"
                fill={present ? '#09090b' : '#a1a1aa'}
                style={{ pointerEvents: 'none' }}
              >
                {shortDate(stage.date)}
              </text>
            </g>
          );
        })}
      </svg>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <span className={`chart-readout ${activeStage ? '' : 'chart-readout-muted'}`}>
          {activeStage ? (
            <>
              {activeStage.label} · {shortDate(activeStage.date)} ·{' '}
              {activeStage.date ? STAGE_NOTES[activeStage.key] : 'undisclosed'}
            </>
          ) : (
            'Hover, Tab or focus a milestone'
          )}
        </span>
        <span className="micro-label ml-auto hidden sm:inline">
          Stages in sequence, not to time scale · hollow markers = undisclosed · {known} of 3 dated
        </span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// GanttLite: per-relationship start → end bars (timeline strip above tables).
// ---------------------------------------------------------------------------

export interface GanttRow {
  label: string;
  sub?: string;
  start: string | null;
  end: string | null;
  href?: string;
}

interface GanttLiteProps {
  rows: GanttRow[];
  maxRows?: number;
}

function durationDays(start: string | null, end: string | null): number | null {
  const s = start ? Date.parse(start) : NaN;
  const e = end ? Date.parse(end) : NaN;
  if (!Number.isFinite(s)) return null;
  if (!Number.isFinite(e)) return null;
  const days = Math.round((e - s) / 86_400_000);
  return Number.isFinite(days) ? days : null;
}

export function GanttLite({ rows, maxRows = 20 }: GanttLiteProps) {
  const [active, setActive] = useState<number | null>(null);
  const shown = rows.slice(0, maxRows);
  const times = shown
    .flatMap((r) => [r.start, r.end])
    .map((d) => (d ? Date.parse(d) : NaN))
    .filter((t) => Number.isFinite(t));
  if (shown.length === 0 || times.length === 0) {
    return (
      <div className="empty-note">
        No dated ties in this view to place on the timeline.
      </div>
    );
  }
  const min = Math.min(...times);
  const max = Math.max(...times);
  const span = max - min || 1;
  const pct = (t: number) => ((t - min) / span) * 100;
  const axis = (t: number) => new Date(t).toISOString().slice(0, 7);
  const activeRow = active !== null ? shown[active] : undefined;
  const activeDays = activeRow ? durationDays(activeRow.start, activeRow.end) : null;

  return (
    <div role="group" aria-label={`Timeline strip of ${shown.length} ties from ${axis(min)} to ${axis(max)}.`}>
      <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500 mb-2">
        <span>{axis(min)}</span>
        <span>{axis(min + span / 2)}</span>
        <span>{axis(max)}</span>
      </div>
      <ul className="space-y-1.5">
        {shown.map((row, i) => {
          const s = row.start ? Date.parse(row.start) : NaN;
          const e = row.end ? Date.parse(row.end) : NaN;
          const hasStart = Number.isFinite(s);
          const hasEnd = Number.isFinite(e);
          const left = hasStart ? pct(s) : 0;
          const right = hasEnd ? pct(e) : hasStart ? 100 : 0;
          const width = Math.max(right - left, hasStart || hasEnd ? 2.5 : 0);
          const ongoing = hasStart && !hasEnd;
          const on = active === i;
          const label = (
            <span className="block w-40 sm:w-52 shrink-0 truncate text-[11px] font-semibold text-zinc-800" title={row.label}>
              {row.label}
              {row.sub && <span className="block font-mono text-[10px] font-normal text-zinc-500 truncate">{row.sub}</span>}
            </span>
          );
          return (
            <li
              key={`g-${i}`}
              className="chart-row -mx-2 flex items-center gap-2 rounded-r px-2 py-0.5"
              data-active={on ? 'true' : undefined}
              {...chartHitProps<HTMLLIElement>({
                label: `${row.label}: ${shortDate(row.start)} to ${row.end ? shortDate(row.end) : 'ongoing'}${
                  durationDays(row.start, row.end) !== null ? `, about ${durationDays(row.start, row.end)} days` : ''
                }`,
                interactive: !row.href,
                focusable: false,
                onEnter: () => setActive(i),
                onLeave: () => setActive((cur) => (cur === i ? null : cur)),
              })}
            >
              {row.href ? (
                <Link href={row.href} className="contents">
                  {label}
                </Link>
              ) : (
                label
              )}
              <div className="relative flex-1 h-4 rounded bg-zinc-100 overflow-hidden" title={`${row.label}: ${shortDate(row.start)} → ${row.end ? shortDate(row.end) : 'ongoing'}`}>
                {(hasStart || hasEnd) && (
                  <div
                    className="chart-bar chart-bar-x absolute top-1 bottom-1 rounded"
                    style={{
                      left: `${Math.min(left, 97.5)}%`,
                      width: `${Math.min(width, 100 - Math.min(left, 97.5))}%`,
                      backgroundColor: on ? '#059669' : ongoing ? '#a1a1aa' : '#3f3f46',
                      boxShadow: on ? '0 0 16px -4px rgba(5,150,105,0.9)' : undefined,
                    }}
                  />
                )}
                {!hasStart && !hasEnd && <span className="absolute inset-0 flex items-center px-2 text-[10px] font-mono text-zinc-500">undated</span>}
              </div>
              <span className="hidden sm:block w-24 shrink-0 text-right text-[10px] font-mono text-zinc-500 tabular-nums">
                {shortDate(row.start)}
              </span>
            </li>
          );
        })}
      </ul>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <span className={`chart-readout ${activeRow ? '' : 'chart-readout-muted'}`}>
          {activeRow ? (
            <>
              <span className="max-w-[16rem] truncate align-middle">{activeRow.label}</span> ·{' '}
              {shortDate(activeRow.start)} → {activeRow.end ? shortDate(activeRow.end) : 'ongoing'}
              {activeDays !== null ? ` · ~${activeDays} days` : ''}
            </>
          ) : (
            `${shown.length} tie${shown.length === 1 ? '' : 's'} · ${axis(min)} → ${axis(max)}`
          )}
        </span>
        <span className="micro-label ml-auto hidden sm:inline">
          Dark bar = fixed term · grey bar extending right = ongoing (no end date){rows.length > maxRows ? ` · showing ${maxRows} of ${rows.length}` : ''}
        </span>
      </div>
    </div>
  );
}