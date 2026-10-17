import React from 'react';
import Link from 'next/link';

/**
 * Timeline visuals for detail + flow pages.
 * Server-component safe (no hooks): pure presentational, zero dependencies.
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

export function DealTimeline({ announce, effective, maturity }: DealTimelineProps) {
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
          return (
            <g key={stage.key}>
              <circle
                cx={xs[i]}
                cy={LINE_Y}
                r={present ? 10 : 8}
                fill={present ? '#09090b' : '#fff'}
                stroke={present ? '#09090b' : '#a1a1aa'}
                strokeWidth={2}
                strokeDasharray={present ? undefined : '4 3'}
              >
                <title>{`${stage.label}: ${shortDate(stage.date)}`}</title>
              </circle>
              {present && (
                <circle cx={xs[i]} cy={LINE_Y} r={3.5} fill="#fff" />
              )}
              <text x={xs[i]} y={LINE_Y - 22} textAnchor="middle" fontSize={11} fontWeight={700} fontFamily="monospace" fill="#52525b">
                {stage.label}
              </text>
              <text x={xs[i]} y={LINE_Y + 30} textAnchor="middle" fontSize={12.5} fontWeight={present ? 700 : 400} fontFamily="monospace" fill={present ? '#09090b' : '#a1a1aa'}>
                {shortDate(stage.date)}
              </text>
            </g>
          );
        })}
      </svg>
      <p className="mt-1 text-[11px] font-mono text-zinc-500">
        Stages in sequence, not to time scale · hollow markers = undisclosed · {known} of 3 dated
      </p>
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

export function GanttLite({ rows, maxRows = 20 }: GanttLiteProps) {
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

  return (
    <div role="img" aria-label={`Timeline strip of ${shown.length} ties from ${axis(min)} to ${axis(max)}.`}>
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
          const label = (
            <span className="block w-40 sm:w-52 shrink-0 truncate text-[11px] font-semibold text-zinc-800" title={row.label}>
              {row.label}
              {row.sub && <span className="block font-mono text-[10px] font-normal text-zinc-500 truncate">{row.sub}</span>}
            </span>
          );
          return (
            <li key={`g-${i}`} className="flex items-center gap-2">
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
                    className={`absolute top-1 bottom-1 rounded ${ongoing ? 'bg-zinc-400' : 'bg-zinc-800'}`}
                    style={{ left: `${Math.min(left, 97.5)}%`, width: `${Math.min(width, 100 - Math.min(left, 97.5))}%` }}
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
      <p className="mt-2 text-[11px] font-mono text-zinc-500">
        Dark bar = fixed term · grey bar extending right = ongoing (no end date){rows.length > maxRows ? ` · showing ${maxRows} of ${rows.length}` : ''}
      </p>
    </div>
  );
}
