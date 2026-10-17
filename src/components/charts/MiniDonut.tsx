import React from 'react';

export interface MiniDonutSlice {
  label: string;
  value: number;
  color: string;
}

interface MiniDonutProps {
  data: MiniDonutSlice[];
  size?: number;
  thickness?: number;
  centerLabel?: string;
}

/**
 * Zero-dependency donut: slices rendered as SVG circle stroke segments,
 * legend rendered as plain HTML. Works in server components (no hooks).
 */
export function MiniDonut({ data, size = 140, thickness = 22, centerLabel }: MiniDonutProps) {
  const total = data.reduce((m, d) => m + d.value, 0);
  const r = (size - thickness) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const C = 2 * Math.PI * r;

  const nonzero = data.filter((d) => d.value > 0);

  if (total <= 0 || nonzero.length === 0) {
    return (
      <div className="empty-note flex items-center gap-4 text-left">
        <svg width={size} height={size} role="presentation" aria-hidden="true" className="shrink-0 opacity-60">
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke="#e4e4e7"
            strokeWidth={thickness}
            strokeDasharray="3 5"
          />
        </svg>
        <p>No data under current filters.</p>
      </div>
    );
  }

  let acc = 0;
  const gap = nonzero.length > 1 ? 2 : 0;
  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          role="img"
          aria-label={`Donut chart. Total ${total}. ${nonzero.map((d) => `${d.label}: ${d.value}`).join(', ')}`}
          className="drop-shadow-[0_2px_8px_rgba(9,9,11,0.08)]"
        >
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f4f4f5" strokeWidth={thickness} />
          {nonzero.map((d) => {
            const frac = d.value / total;
            const len = Math.max(frac * C - gap, 0.5);
            const el = (
              <circle
                key={d.label}
                cx={cx}
                cy={cy}
                r={r}
                fill="none"
                stroke={d.color}
                strokeWidth={thickness}
                strokeDasharray={`${len} ${C - len}`}
                strokeDashoffset={-acc * C}
                strokeLinecap="butt"
                transform={`rotate(-90 ${cx} ${cy})`}
              >
                <title>{`${d.label}: ${d.value} (${((frac * 100).toFixed(1))}%)`}</title>
              </circle>
            );
            acc += frac;
            return el;
          })}
        </svg>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="num text-xl font-bold leading-none text-zinc-950">{total}</span>
          {centerLabel && (
            <span className="micro-label mt-1">{centerLabel}</span>
          )}
        </div>
      </div>
      <ul className="w-full min-w-0 space-y-0.5">
        {nonzero.map((d) => (
          <li
            key={d.label}
            className="-mx-1.5 flex min-w-0 items-center gap-2 rounded-md px-1.5 py-1 transition-colors hover:bg-zinc-50"
          >
            <span
              className="inline-block h-2.5 w-2.5 shrink-0 rounded-full ring-1 ring-inset ring-black/10"
              style={{ backgroundColor: d.color }}
              aria-hidden="true"
            />
            <span className="flex-1 truncate text-xs font-medium text-zinc-700">{d.label}</span>
            <span className="whitespace-nowrap font-mono text-xs tabular-nums text-zinc-600">
              {d.value} <span className="text-zinc-500">&middot; {((d.value / total) * 100).toFixed(0)}%</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}