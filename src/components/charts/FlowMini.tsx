import React from 'react';
import Link from 'next/link';

/**
 * Small shared SVG/HTML visuals for detail + flow pages.
 * Server-component safe (no hooks): pure presentational, zero dependencies.
 * Import-only for detail pages — do not add page-specific data fetching here.
 */

function truncate(label: string, max = 44): string {
  return label.length > max ? `${label.slice(0, max - 1)}…` : label;
}

// ---------------------------------------------------------------------------
// MiniDonut: generic 4-ish-way distribution donut with legend.
// ---------------------------------------------------------------------------

export interface DonutSegment {
  label: string;
  value: number;
  color: string;
  href?: string;
}

interface MiniDonutProps {
  segments: DonutSegment[];
  centerLabel: string;
  centerSub?: string;
  size?: number;
  thickness?: number;
}

export function MiniDonut({ segments, centerLabel, centerSub, size = 150, thickness = 28 }: MiniDonutProps) {
  const total = segments.reduce((s, x) => s + x.value, 0);
  if (total <= 0 || segments.length === 0) {
    return (
      <div className="empty-note">
        No values to distribute in this view.
      </div>
    );
  }
  const R = 70;
  const VIEW = 160;
  const C = 2 * Math.PI * R;
  let acc = 0;
  const arcs = segments.map((seg, i) => {
    const frac = seg.value / total;
    const len = Math.max(frac * C - (segments.length > 1 ? 1.5 : 0), 0.5);
    const offset = -acc;
    acc += frac * C;
    return (
      <circle
        key={`${seg.label}-${i}`}
        cx={VIEW / 2}
        cy={VIEW / 2}
        r={R}
        fill="none"
        stroke={seg.color}
        strokeWidth={thickness}
        strokeDasharray={`${len} ${C - len}`}
        strokeDashoffset={offset}
        transform={`rotate(-90 ${VIEW / 2} ${VIEW / 2})`}
      >
        <title>{`${seg.label}: ${seg.value}`}</title>
      </circle>
    );
  });

  return (
    <div className="flex flex-col sm:flex-row items-center gap-5">
      <svg
        viewBox={`0 0 ${VIEW} ${VIEW}`}
        width={size}
        height={size}
        role="img"
        aria-label={`Distribution donut: ${segments.map((s) => `${s.label} ${s.value}`).join(', ')}`}
        className="shrink-0"
      >
        <circle cx={VIEW / 2} cy={VIEW / 2} r={R} fill="none" stroke="#f4f4f5" strokeWidth={thickness} />
        {arcs}
        <text x={VIEW / 2} y={VIEW / 2 - 2} textAnchor="middle" fontSize={26} fontWeight={800} fill="#09090b">
          {centerLabel}
        </text>
        {centerSub && (
          <text x={VIEW / 2} y={VIEW / 2 + 18} textAnchor="middle" fontSize={11} fill="#71717a" fontFamily="monospace">
            {centerSub}
          </text>
        )}
      </svg>
      <ul className="w-full min-w-0 space-y-1.5">
        {segments.map((seg, i) => (
          <li key={`${seg.label}-${i}`} className="flex items-center gap-2 text-xs">
            <span className="inline-block w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: seg.color }} aria-hidden="true" />
            {seg.href ? (
              <Link href={seg.href} className="rounded font-semibold text-zinc-900 transition-colors hover:text-emerald-800 hover:underline truncate">
                {seg.label}
              </Link>
            ) : (
              <span className="font-semibold text-zinc-900 truncate">{seg.label}</span>
            )}
            <span className="ml-auto font-mono text-zinc-600 tabular-nums whitespace-nowrap">
              {seg.value} <span className="text-zinc-500">· {((seg.value / total) * 100).toFixed(0)}%</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sparkline: capital-over-time micro chart (area + line + dots).
// ---------------------------------------------------------------------------

interface SparklineProps {
  points: number[];
  labels?: string[];
  stroke?: string;
  height?: number;
  format?: (v: number) => string;
}

export function Sparkline({ points, labels, stroke = '#2563eb', height = 140, format }: SparklineProps) {
  const W = 520;
  const H = height;
  const PAD = 10;
  if (points.length === 0) {
    return (
      <div className="empty-note">
        No dated deals to plot for this view.
      </div>
    );
  }
  const max = Math.max(...points, 0);
  if (max <= 0) {
    return (
      <div className="empty-note">
        Dated deals exist but none disclose an amount — nothing to size the trend by.
      </div>
    );
  }
  const n = points.length;
  const x = (i: number) => (n === 1 ? W / 2 : PAD + (i / (n - 1)) * (W - PAD * 2));
  const y = (v: number) => H - PAD - (v / max) * (H - PAD * 2 - 14);
  const line = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${x(i).toFixed(1)} ${y(p).toFixed(1)}`).join(' ');
  const area = `${line} L ${x(n - 1).toFixed(1)} ${H - PAD} L ${x(0).toFixed(1)} ${H - PAD} Z`;
  const fmt = format ?? ((v: number) => String(v));
  const labelFor = (i: number) => (labels && labels[i] ? labels[i] : `#${i + 1}`);
  const showIdx = [...new Set([0, Math.floor((n - 1) / 2), n - 1])].filter((i) => i >= 0 && i < n);

  return (
    <div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={`Capital trend across ${n} periods, peaking at ${fmt(max)}.`}
        className="w-full h-auto"
      >
        <path d={area} fill={stroke} fillOpacity={0.12} />
        <path d={line} fill="none" stroke={stroke} strokeWidth={2} strokeLinejoin="round" />
        {points.map((p, i) => (
          <circle key={i} cx={x(i)} cy={y(p)} r={i === n - 1 ? 4 : 2.5} fill={stroke} stroke={i === n - 1 ? '#fff' : 'none'} strokeWidth={1.5}>
            <title>{`${labelFor(i)} — ${fmt(p)}`}</title>
          </circle>
        ))}
      </svg>
      <div className="mt-1 flex items-center justify-between text-[10px] font-mono text-zinc-500">
        {showIdx.map((i) => (
          <span key={i}>{labelFor(i)}</span>
        ))}
      </div>
      <p className="mt-1 text-[11px] font-mono text-zinc-500">
        Peak <span className="font-bold text-zinc-800">{fmt(max)}</span> · {n} period{n === 1 ? '' : 's'} · undisclosed amounts count as $0
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// PeerBars / CountBars: horizontal comparison bars.
// ---------------------------------------------------------------------------

export interface PeerBarRow {
  label: string;
  value: number;
  sub?: string;
  href?: string;
  highlight?: boolean;
  color?: string;
}

export function PeerBars({ rows, format, note }: { rows: PeerBarRow[]; format: (v: number) => string; note?: string }) {
  if (rows.length === 0) {
    return (
      <div className="empty-note">
        No disclosed peer amounts to compare in this view.
      </div>
    );
  }
  const max = Math.max(...rows.map((r) => r.value), 0);
  return (
    <div>
      <ul className="space-y-2.5">
        {rows.map((row, i) => {
          const body = (
            <>
              <div className="flex items-baseline justify-between gap-2 text-xs">
                <span className={`truncate ${row.highlight ? 'font-bold text-zinc-950' : 'font-semibold text-zinc-800'}`}>
                  {row.highlight && <span className="mr-1.5 font-mono text-[9px] uppercase bg-zinc-950 text-white px-1.5 py-0.5 rounded">This deal</span>}
                  {truncate(row.label)}
                </span>
                <span className="font-mono tabular-nums whitespace-nowrap text-zinc-700">
                  {format(row.value)}
                  {row.sub && <span className="text-zinc-500"> · {row.sub}</span>}
                </span>
              </div>
              <div
                className="mt-1 h-3 rounded bg-zinc-100 overflow-hidden"
                role="img"
                aria-label={`${row.label}: ${format(row.value)}`}
              >
                <div
                  className="h-full rounded"
                  style={{
                    width: `${max > 0 ? Math.max((row.value / max) * 100, 1.5) : 0}%`,
                    backgroundColor: row.highlight ? '#09090b' : (row.color ?? '#71717a'),
                  }}
                />
              </div>
            </>
          );
          return (
            <li key={`${row.label}-${i}`} className={row.highlight ? 'p-2 -m-2 rounded-md bg-zinc-50 border border-zinc-200' : undefined}>
              {row.href && !row.highlight ? (
                <Link href={row.href} className="block hover:opacity-80 transition-opacity">{body}</Link>
              ) : row.href ? (
                <Link href={row.href} className="block">{body}</Link>
              ) : (
                body
              )}
            </li>
          );
        })}
      </ul>
      {note && <p className="mt-2 text-[11px] text-zinc-500 font-mono">{note}</p>}
    </div>
  );
}

export interface CountBarRow {
  label: string;
  count: number;
  color?: string;
  href?: string;
}

export function CountBars({ rows, note }: { rows: CountBarRow[]; note?: string }) {
  return (
    <PeerBars
      rows={rows.map((r) => ({
        label: r.label,
        value: r.count,
        href: r.href,
        color: r.color,
        sub: r.count === 1 ? '1 hit' : `${r.count} hits`,
      }))}
      format={(v) => String(v)}
      note={note}
    />
  );
}

// ---------------------------------------------------------------------------
// CounterpartyFlow: party boxes with directional arrows (width by role).
// ---------------------------------------------------------------------------

export interface FlowNode {
  name: string;
  role: string;
  href?: string;
  note?: string;
}

const ROLE_WEIGHT: Record<string, number> = {
  investor: 3,
  lender: 3,
  investee: 3,
  borrower: 3,
  supplier: 2,
  customer: 2,
  cloud_provider: 2,
  utility: 2,
  guarantor: 2,
  project_owner: 2,
  partner: 1.5,
  counterparty: 1.5,
  other: 1,
};

function roleWeight(role: string): number {
  return ROLE_WEIGHT[role] ?? 1;
}

export function CounterpartyFlow({ nodes }: { nodes: FlowNode[] }) {
  if (nodes.length === 0) {
    return (
      <div className="empty-note">
        No counterparties recorded for this transaction.
      </div>
    );
  }
  return (
    <div
      className="flex flex-wrap items-center gap-y-3"
      role="img"
      aria-label={`Capital flow: ${nodes.map((n) => `${n.name} (${n.role})`).join(' → ')}`}
    >
      {nodes.map((node, i) => {
        const w = roleWeight(node.role);
        const box = (
          <div
            className={`min-w-0 max-w-[220px] px-3 py-2 rounded-md bg-white ${w >= 3 ? 'border-2 border-zinc-950' : 'border border-zinc-300'}`}
          >
            <div className="text-xs font-bold text-zinc-950 truncate" title={node.name}>{node.name}</div>
            <div className="mt-1 font-mono text-[10px] uppercase font-semibold text-zinc-500">{node.role.replace(/_/g, ' ')}</div>
            {node.note && <div className="text-[10px] font-mono text-zinc-500 truncate" title={node.note}>{node.note}</div>}
          </div>
        );
        const arrowW = Math.round(((w + roleWeight(nodes[Math.min(i + 1, nodes.length - 1)].role)) / 2) * 1.4 * 10) / 10;
        return (
          <React.Fragment key={`${node.name}-${node.role}-${i}`}>
            {node.href ? (
              <Link href={node.href} className="hover:opacity-75 transition-opacity">{box}</Link>
            ) : (
              box
            )}
            {i < nodes.length - 1 && (
              <svg width="44" height="20" viewBox="0 0 44 20" aria-hidden="true" className="shrink-0">
                <line x1="2" y1="10" x2="34" y2="10" stroke="#52525b" strokeWidth={arrowW} />
                <path d="M 32 4 L 42 10 L 32 16 z" fill="#52525b" />
              </svg>
            )}
          </React.Fragment>
        );
      })}
      <p className="w-full text-[11px] font-mono text-zinc-500">Box emphasis + arrow width encode party role weight (capital source/sink vs facilitator).</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// StarNetwork: center company with spokes to counterparties (width by weight).
// ---------------------------------------------------------------------------

export interface StarSpoke {
  name: string;
  href?: string;
  weight: number;
  label?: string;
}

interface StarNetworkProps {
  center: string;
  sub?: string;
  spokes: StarSpoke[];
  maxSpokes?: number;
}

export function StarNetwork({ center, sub, spokes, maxSpokes = 12 }: StarNetworkProps) {
  if (spokes.length === 0) {
    return (
      <div className="empty-note">
        No counterparty links to map for this entity yet.
      </div>
    );
  }
  const shown = [...spokes].sort((a, b) => b.weight - a.weight).slice(0, maxSpokes);
  const hidden = spokes.length - shown.length;
  const maxW = Math.max(...shown.map((s) => s.weight), 0.5);
  // The viewBox needs horizontal margin for outward-anchored spoke labels;
  // at 560 they ran off the canvas and rendered as a clipped leading ellipsis.
  const W = 660;
  const H = 360;
  const CX = W / 2;
  const CY = H / 2 - 6;
  const RX = 214;
  const RY = 128;

  const coords = shown.map((_, i) => {
    const angle = -Math.PI / 2 + (i / shown.length) * Math.PI * 2;
    return {
      x: CX + RX * Math.cos(angle),
      y: CY + RY * Math.sin(angle),
      angle,
    };
  });

  return (
    <div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={`Counterparty star network for ${center}: ${shown.map((s) => `${s.name} (${s.weight})`).join(', ')}`}
        className="w-full h-auto"
      >
        {shown.map((sp, i) => {
          const p = coords[i];
          const width = 1 + 3.5 * Math.sqrt(sp.weight / maxW);
          return (
            <line key={`e-${i}`} x1={CX} y1={CY} x2={p.x} y2={p.y} stroke="#71717a" strokeWidth={width} strokeOpacity={0.65}>
              <title>{`${center} ⇔ ${sp.name} — weight ${sp.weight}${sp.label ? ` (${sp.label})` : ''}`}</title>
            </line>
          );
        })}
        {shown.map((sp, i) => {
          const p = coords[i];
          const anchor = Math.cos(p.angle) > 0.35 ? 'start' : Math.cos(p.angle) < -0.35 ? 'end' : 'middle';
          const lx = p.x + (anchor === 'middle' ? 0 : Math.cos(p.angle) > 0 ? 14 : -14);
          const ly = p.y + (anchor === 'middle' ? (Math.sin(p.angle) > 0 ? 26 : -16) : 4);
          return (
            <g key={`n-${i}`}>
              <circle cx={p.x} cy={p.y} r={9} fill="white" stroke="#52525b" strokeWidth={2}>
                <title>{`${sp.name} — weight ${sp.weight}${sp.label ? ` (${sp.label})` : ''}`}</title>
              </circle>
              <text x={lx} y={ly} textAnchor={anchor} fontSize={12} fill="#3f3f46">
                {truncate(sp.name, 16)}
              </text>
            </g>
          );
        })}
        <circle cx={CX} cy={CY} r={24} fill="#09090b" />
        <text x={CX} y={CY + 4.5} textAnchor="middle" fontSize={11} fontWeight={800} fill="#fff">
          {center.slice(0, 3).toUpperCase() || 'CO'}
        </text>
        <text x={CX} y={CY + 42} textAnchor="middle" fontSize={13} fontWeight={700} fill="#09090b">
          {truncate(center, 26)}
        </text>
      </svg>
      <ul className="mt-2 grid grid-cols-1 gap-x-5 gap-y-1 text-[11px] 2xl:grid-cols-2">
        {shown.map((sp, i) => (
          <li key={`l-${i}`} className="flex items-center gap-1.5 min-w-0">
            <span className="font-mono text-zinc-500 tabular-nums shrink-0">{sp.weight}×</span>
            {sp.href ? (
              <Link href={sp.href} className="rounded font-semibold text-zinc-800 transition-colors hover:text-emerald-800 hover:underline truncate">
                {sp.name}
              </Link>
            ) : (
              <span className="font-semibold text-zinc-800 truncate">{sp.name}</span>
            )}
            {sp.label && <span className="text-zinc-500 font-mono text-[10px] truncate">· {sp.label}</span>}
          </li>
        ))}
      </ul>
      <p className="mt-2 text-[11px] font-mono text-zinc-500">
        Line width ∝ link weight (shared deals + documented ties){hidden > 0 ? ` · +${hidden} more not drawn` : ''}{sub ? ` · ${sub}` : ''}
      </p>
    </div>
  );
}
