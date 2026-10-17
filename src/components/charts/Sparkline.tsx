'use client';

import React, { useState } from 'react';
import { chartHitProps, pct } from './chartInteraction';

interface SparklineProps {
  data: number[];
  labels?: string[];
  width?: number;
  height?: number;
  stroke?: string;
  /** Wire up hover/focus highlighting. Default true. */
  interactive?: boolean;
}

/**
 * Zero-dependency tiny time-series SVG (line + area fill).
 * Defaults to the emerald research accent so every sparkline in the product
 * speaks the same colour language. Hovering or focusing a period shows its
 * value and label, with a crosshair and an enlarged marker.
 */
export function Sparkline({
  data,
  labels,
  width = 320,
  height = 64,
  stroke = '#059669',
  interactive = true,
}: SparklineProps) {
  const gradientId = React.useId().replace(/[^a-zA-Z0-9]/g, '');
  const [active, setActive] = useState<number | null>(null);

  if (data.length === 0) {
    return (
      <div className="empty-note">
        <svg width={width} height={height} role="presentation" aria-hidden="true" className="h-auto w-full">
          <line
            x1="0"
            y1={height - 1}
            x2={width}
            y2={height - 1}
            stroke="currentColor"
            strokeWidth="1"
            strokeDasharray="3 3"
            className="text-zinc-300"
          />
        </svg>
        <p className="mt-1">No data in view</p>
      </div>
    );
  }

  const max = Math.max(...data, 0);
  const min = Math.min(...data, 0);
  const span = max - min || 1;
  const padX = 2;
  const padY = 4;

  const pts = data.map((v, i) => {
    const x = data.length === 1 ? width / 2 : padX + (i / (data.length - 1)) * (width - padX * 2);
    const y = padY + (1 - (v - min) / span) * (height - padY * 2);
    return { x, y, v };
  });

  const line = pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const area = `${padX},${height} ${line} ${width - padX},${height}`;
  const last = pts[pts.length - 1];
  const labelFor = (i: number) => (labels && labels[i] ? labels[i] : `P${i + 1}`);
  const bandW = data.length === 1 ? width : (width - padX * 2) / (data.length - 1);

  const desc =
    labels && labels.length === data.length
      ? labels.map((l, i) => `${l}: ${data[i]}`).join(', ')
      : `Values: ${data.join(', ')}`;

  return (
    <div className="relative">
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={`Trend sparkline. ${desc}`}
        className="h-auto w-full overflow-visible"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id={`spark-${gradientId}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={stroke} stopOpacity={0.3} />
            <stop offset="100%" stopColor={stroke} stopOpacity={0.02} />
          </linearGradient>
        </defs>

        {/* Reference grid: hairline rules, never competing with the series. */}
        {[0.25, 0.5, 0.75].map((f) => (
          <line
            key={f}
            x1={padX}
            y1={height * f}
            x2={width - padX}
            y2={height * f}
            stroke="currentColor"
            strokeOpacity={0.1}
            strokeWidth={1}
            strokeDasharray="2 4"
            className="text-zinc-500"
          />
        ))}
        <line
          x1={padX}
          y1={height - 1}
          x2={width - padX}
          y2={height - 1}
          stroke="currentColor"
          strokeOpacity={0.22}
          strokeWidth={1}
          className="text-zinc-500"
        />

        <polygon points={area} fill={`url(#spark-${gradientId})`} />
        <polyline
          points={line}
          fill="none"
          stroke={stroke}
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />

        {/* Crosshair on the active period. */}
        {active !== null && (
          <line
            x1={pts[active].x}
            y1={0}
            x2={pts[active].x}
            y2={height}
            stroke={stroke}
            strokeWidth={1}
            strokeDasharray="2 3"
            opacity={0.6}
            aria-hidden="true"
          />
        )}

        {active !== null && (
          <circle
            cx={pts[active].x}
            cy={pts[active].y}
            r={6}
            fill={stroke}
            opacity={0.25}
            aria-hidden="true"
          />
        )}

        {last && active === null && (
          <g>
            <circle cx={last.x} cy={last.y} r={5} fill={stroke} opacity={0.22} />
            <circle cx={last.x} cy={last.y} r={2.75} fill={stroke} stroke="#fff" strokeWidth={1.25}>
              <title>{`Latest: ${last.v.toLocaleString('en-US')}`}</title>
            </circle>
          </g>
        )}

        {/* One hit band per period: a pointer never has to find a 3px dot. */}
        {interactive &&
          pts.map((p, i) => (
            <rect
              key={`h-${i}`}
              x={p.x - bandW / 2}
              y={0}
              width={bandW}
              height={height}
              fill="transparent"
              {...chartHitProps<SVGRectElement>({
                label: `${labelFor(i)}: ${p.v.toLocaleString('en-US')}`,
                interactive: false,
                focusable: true,
                onEnter: () => setActive(i),
                onLeave: () => setActive((cur) => (cur === i ? null : cur)),
              })}
            />
          ))}
      </svg>

      {interactive && active !== null && (
        <span
          className="chart-readout pointer-events-none absolute top-0 z-10 max-w-[70%] truncate"
          style={{ left: `${Math.min(Math.max((pts[active].x / width) * 100, 2), 62)}%` }}
        >
          {labelFor(active)} · {data[active].toLocaleString('en-US')} · {pct(data[active], max)}
        </span>
      )}
    </div>
  );
}