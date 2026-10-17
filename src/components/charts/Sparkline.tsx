import React from 'react';

interface SparklineProps {
  data: number[];
  labels?: string[];
  width?: number;
  height?: number;
  stroke?: string;
}

/**
 * Zero-dependency tiny time-series SVG (line + area fill).
 * Works in server components (no hooks). Defaults to the emerald research
 * accent so every sparkline in the product speaks the same colour language.
 */
export function Sparkline({
  data,
  labels,
  width = 320,
  height = 64,
  stroke = '#059669',
}: SparklineProps) {
  const gradientId = React.useId().replace(/[^a-zA-Z0-9]/g, '');
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

  const desc =
    labels && labels.length === data.length
      ? labels.map((l, i) => `${l}: ${data[i]}`).join(', ')
      : `Values: ${data.join(', ')}`;

  return (
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

      {last && (
        <g>
          <circle cx={last.x} cy={last.y} r={5} fill={stroke} opacity={0.22} />
          <circle cx={last.x} cy={last.y} r={2.75} fill={stroke} stroke="#fff" strokeWidth={1.25}>
            <title>{`Latest: ${last.v.toLocaleString('en-US')}`}</title>
          </circle>
        </g>
      )}
    </svg>
  );
}