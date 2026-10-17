'use client';

import React, { useCallback, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { formatCurrency } from '@/lib/formatters';
import {
  ChartReadout,
  ChartTooltip,
  TooltipCard,
  chartHitProps,
  clampPct,
  pct,
} from './chartInteraction';

/**
 * Small shared SVG/HTML visuals for detail + flow pages.
 *
 * Every chart here is interactive: hover *or* keyboard-focus raises the point,
 * recedes its siblings and reveals a value readout (floating card for the SVG
 * views, inline readout for the list views). Data hooks stay in the pages —
 * this module is presentation only. Zero dependencies.
 *
 * Server-rendered pages may import these directly: client components are still
 * prerendered on the server, so the first paint is unchanged.
 */

function truncate(label: string, max = 44): string {
  return label.length > max ? `${label.slice(0, max - 1)}…` : label;
}

/** Two decimals is plenty at chart scale and keeps SSR/hydration bit-identical. */
const r2 = (n: number) => Math.round(n * 100) / 100;

/**
 * Plain-anchor navigation inside an SVG. Next's `<Link>` renders an HTML
 * anchor, which React places in the SVG namespace when nested in a `<svg>` —
 * `href` then stops working. A native SVG anchor keeps real link semantics
 * (Enter, middle-click, "open in new tab") while the left click stays client-side.
 *
 * The handler is typed against `Element` so the same pair spreads cleanly over
 * both SVG and HTML anchors (React's event handlers are bivariant).
 */
function svgLinkProps(href: string, router: ReturnType<typeof useRouter>) {
  return {
    href,
    onClick: (ev: React.MouseEvent<Element>) => {
      if (ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.altKey || ev.button !== 0) return;
      ev.preventDefault();
      router.push(href);
    },
  };
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
  /** Wire up hover/focus highlighting. Default true. */
  interactive?: boolean;
}

export function MiniDonut({
  segments,
  centerLabel,
  centerSub,
  size = 150,
  thickness = 28,
  interactive = true,
}: MiniDonutProps) {
  const [active, setActive] = useState<number | null>(null);
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
  const activeSeg = active !== null ? segments[active] : undefined;
  let acc = 0;
  const arcs = segments.map((seg, i) => {
    const frac = seg.value / total;
    const len = Math.max(frac * C - (segments.length > 1 ? 1.5 : 0), 0.5);
    const offset = -acc;
    acc += frac * C;
    const on = active === i;
    const dim = active !== null && !on;
    return (
      <circle
        key={`${seg.label}-${i}`}
        cx={VIEW / 2}
        cy={VIEW / 2}
        r={R}
        fill="none"
        stroke={seg.color}
        strokeWidth={on ? thickness + 6 : thickness}
        strokeDasharray={`${len} ${C - len}`}
        strokeDashoffset={offset}
        transform={`rotate(-90 ${VIEW / 2} ${VIEW / 2})`}
        className="chart-slice"
        data-dim={dim ? 'true' : undefined}
        {...chartHitProps<SVGCircleElement>({
          label: `${seg.label}: ${seg.value} (${pct(seg.value, total)}) of ${total}`,
          interactive: false,
          focusable: interactive,
          onEnter: () => interactive && setActive(i),
          onLeave: () => setActive((cur) => (cur === i ? null : cur)),
        })}
      >
        <title>{`${seg.label}: ${seg.value} (${pct(seg.value, total)})`}</title>
      </circle>
    );
  });

  return (
    <div className="flex flex-col sm:flex-row items-center gap-5">
      <div className="relative shrink-0">
        <svg
          viewBox={`0 0 ${VIEW} ${VIEW}`}
          width={size}
          height={size}
          role="img"
          aria-label={`Distribution donut: ${segments.map((s) => `${s.label} ${s.value}`).join(', ')}`}
        >
          <circle cx={VIEW / 2} cy={VIEW / 2} r={R} fill="none" stroke="#f4f4f5" strokeWidth={thickness} />
          {arcs}
          {/* Centre readout: totals by default, the hovered slice on demand. */}
          <text
            x={VIEW / 2}
            y={VIEW / 2 - 2}
            textAnchor="middle"
            fontSize={activeSeg ? 17 : 26}
            fontWeight={800}
            fill={activeSeg ? activeSeg.color : '#09090b'}
          >
            {activeSeg ? activeSeg.value : centerLabel}
          </text>
          <text
            x={VIEW / 2}
            y={VIEW / 2 + 18}
            textAnchor="middle"
            fontSize={activeSeg ? 8 : 11}
            fill={activeSeg ? '#71717a' : '#71717a'}
            fontFamily="monospace"
          >
            {activeSeg ? truncate(activeSeg.label.toUpperCase(), 18) : centerSub}
          </text>
        </svg>
        {interactive && activeSeg && (
          <ChartTooltip x={78} y={46} maxX={72}>
            <TooltipCard
              eyebrow="SEGMENT"
              title={activeSeg.label}
              accent={activeSeg.color}
              headline={`${activeSeg.value} · ${pct(activeSeg.value, total)}`}
              rows={[{ label: 'All segments', value: String(total), tone: 'neutral' }]}
              footer={activeSeg.href ? 'Select to open' : undefined}
            />
          </ChartTooltip>
        )}
      </div>
      <ul className="w-full min-w-0 space-y-1.5">
        {segments.map((seg, i) => (
          <li
            key={`${seg.label}-${i}`}
            className="chart-row -mx-1.5 flex items-center gap-2 rounded-r px-1.5 py-1 text-xs"
            data-active={active === i ? 'true' : undefined}
            data-dim={active !== null && active !== i ? 'true' : undefined}
            {...chartHitProps<HTMLLIElement>({
              label: `${seg.label}: ${seg.value}, ${pct(seg.value, total)}`,
              interactive: false,
              focusable: interactive && !seg.href,
              onEnter: () => interactive && setActive(i),
              onLeave: () => setActive((cur) => (cur === i ? null : cur)),
            })}
          >
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
  /** Custom formatter. Defaults to currency when `currency` is supplied. */
  format?: (v: number) => string;
  /** ISO currency for the default formatter. Server-safe: no functions. */
  currency?: string | null;
  /** Readout unit label shown next to the hovered value. */
  unit?: string;
  interactive?: boolean;
}

export function Sparkline({
  points,
  labels,
  stroke = '#2563eb',
  height = 140,
  format,
  currency,
  unit,
  interactive = true,
}: SparklineProps) {
  const [active, setActive] = useState<number | null>(null);
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
  const fmt = format ?? ((v: number) => (currency === undefined ? String(v) : formatCurrency(v, currency)));
  const labelFor = (i: number) => (labels && labels[i] ? labels[i] : `#${i + 1}`);
  const showIdx = [...new Set([0, Math.floor((n - 1) / 2), n - 1])].filter((i) => i >= 0 && i < n);
  // Hit bands: one per period so a pointer never has to find a 3px dot.
  const bandW = n === 1 ? W : (W - PAD * 2) / (n - 1);

  return (
    <div>
      <div className="relative">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          role="img"
          aria-label={`Capital trend across ${n} periods, peaking at ${fmt(max)}.`}
          className="w-full h-auto"
        >
          <path d={area} fill={stroke} fillOpacity={0.12} />
          <path d={line} fill="none" stroke={stroke} strokeWidth={2} strokeLinejoin="round" />
          {/* Crosshair on the active period. */}
          {active !== null && (
            <line
              x1={x(active)}
              y1={PAD}
              x2={x(active)}
              y2={H - PAD}
              stroke={stroke}
              strokeWidth={1}
              strokeDasharray="3 3"
              opacity={0.7}
              aria-hidden="true"
            />
          )}
          {points.map((p, i) => (
            <g key={i}>
              <circle
                cx={x(i)}
                cy={y(p)}
                r={active === i ? 6 : i === n - 1 ? 4 : 2.5}
                fill={stroke}
                stroke={active === i || i === n - 1 ? '#fff' : 'none'}
                strokeWidth={1.5}
                className="chart-marker"
                aria-hidden="true"
              />
              {interactive && (
                <rect
                  x={x(i) - bandW / 2}
                  y={0}
                  width={bandW}
                  height={H}
                  fill="transparent"
                  className="chart-hit"
                  {...chartHitProps<SVGRectElement>({
                    label: `${labelFor(i)} — ${fmt(p)}`,
                    interactive: false,
                    focusable: true,
                    onEnter: () => setActive(i),
                    onLeave: () => setActive((cur) => (cur === i ? null : cur)),
                  })}
                />
              )}
            </g>
          ))}
        </svg>
        {interactive && active !== null && (
          <ChartTooltip
            x={clampPct((x(active) / W) * 100, 8, 68)}
            y={(y(points[active]) / H) * 100}
            placement={y(points[active]) / H < 0.3 ? 'below' : 'above'}
          >
            <TooltipCard
              eyebrow={labelFor(active)}
              title={fmt(points[active])}
              accent={stroke}
              rows={[
                { label: 'Share of peak', value: pct(points[active], max, 1), tone: 'mint' },
                { label: 'Peak', value: fmt(max) },
              ]}
              footer={unit ? `${unit} · period ${active + 1}/${n}` : `Period ${active + 1} of ${n}`}
            />
          </ChartTooltip>
        )}
      </div>
      <div className="mt-1 flex items-center justify-between text-[10px] font-mono text-zinc-500">
        {showIdx.map((i) => (
          <span key={i} className={active === i ? 'font-bold text-emerald-700' : undefined}>
            {labelFor(i)}
          </span>
        ))}
      </div>
      <p className="mt-1 flex flex-wrap items-center gap-2 text-[11px] font-mono text-zinc-500">
        {interactive && active !== null ? (
          <>
            <span className="micro-label">{labelFor(active)}</span>
            <span className="num font-bold text-zinc-950">{fmt(points[active])}</span>
            <ChartReadout>{pct(points[active], max, 1)} of peak</ChartReadout>
          </>
        ) : (
          <>
            Peak <span className="font-bold text-zinc-800">{fmt(max)}</span> · {n} period{n === 1 ? '' : 's'} · undisclosed
            amounts count as $0
          </>
        )}
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

export function PeerBars({
  rows,
  format,
  currency,
  note,
  interactive = true,
}: {
  rows: PeerBarRow[];
  /** Optional formatter. Defaults to currency when `currency` is supplied. */
  format?: (v: number) => string;
  /** ISO currency for the default formatter (server-safe: no functions). */
  currency?: string | null;
  note?: string;
  interactive?: boolean;
}) {
  const [active, setActive] = useState<number | null>(null);
  const max = useMemo(() => rows.reduce((m, r) => Math.max(m, r.value), 0), [rows]);
  const fmt = format ?? ((v: number) => (currency === undefined ? String(v) : formatCurrency(v, currency)));

  if (rows.length === 0) {
    return (
      <div className="empty-note">
        No disclosed peer amounts to compare in this view.
      </div>
    );
  }
  return (
    <div>
      <ul className="space-y-2.5">
        {rows.map((row, i) => {
          const on = active === i;
          const body = (
            <>
              <div className="flex items-baseline justify-between gap-2 text-xs">
                <span className={`truncate ${row.highlight ? 'font-bold text-zinc-950' : 'font-semibold text-zinc-800'}`}>
                  {row.highlight && <span className="mr-1.5 font-mono text-[9px] uppercase bg-zinc-950 text-white px-1.5 py-0.5 rounded">This deal</span>}
                  {truncate(row.label)}
                </span>
                <span className="font-mono tabular-nums whitespace-nowrap text-zinc-700">
                  {fmt(row.value)}
                  {row.sub && <span className="text-zinc-500"> · {row.sub}</span>}
                </span>
              </div>
              <div
                className="mt-1 h-3 rounded bg-zinc-100 overflow-hidden"
                role="img"
                aria-label={`${row.label}: ${fmt(row.value)}`}
              >
                <div
                  className="chart-bar chart-bar-x h-full rounded"
                  style={{
                    width: `${max > 0 ? Math.max((row.value / max) * 100, 1.5) : 0}%`,
                    backgroundColor: row.highlight ? '#09090b' : (row.color ?? '#71717a'),
                    boxShadow: on ? `0 0 18px -6px ${row.highlight ? '#09090b' : (row.color ?? '#71717a')}` : undefined,
                  }}
                />
              </div>
            </>
          );
          return (
            <li
              key={`${row.label}-${i}`}
              className={`chart-row -mx-2 rounded-r px-2 py-1 ${row.highlight ? 'border border-zinc-200 bg-zinc-50' : ''}`}
              data-active={on ? 'true' : undefined}
              {...chartHitProps<HTMLLIElement>({
                label: `${row.label}: ${fmt(row.value)}${row.sub ? `, ${row.sub}` : ''} — ${pct(row.value, max)} of the largest peer`,
                // Rows with an href are activated by their inner <Link>; the
                // hover/focus highlight still reaches them via focusin.
                interactive: !row.href && interactive,
                focusable: false,
                onEnter: () => interactive && setActive(i),
                onLeave: () => setActive((cur) => (cur === i ? null : cur)),
              })}
            >
              {row.href ? (
                <Link href={row.href} className="block transition-opacity hover:opacity-80">{body}</Link>
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
  const [active, setActive] = useState<number | null>(null);
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
        const on = active === i;
        // Neighbours stay lit so the reader sees where the money goes next.
        const near = active !== null && (i === active - 1 || i === active + 1);
        const dim = active !== null && !on && !near;
        const box = (
          <div
            className={`min-w-0 max-w-[220px] px-3 py-2 rounded-md bg-white transition-[transform,box-shadow] duration-200 ${
              w >= 3 ? 'border-2 border-zinc-950' : 'border border-zinc-300'
            } ${on ? 'shadow-[0_0_0_2px_rgba(5,150,105,0.35),0_10px_24px_-14px_rgba(9,9,11,0.5)] -translate-y-0.5' : ''}`}
            style={{ opacity: dim ? 0.45 : 1 }}
          >
            <div className="text-xs font-bold text-zinc-950 truncate" title={node.name}>{node.name}</div>
            <div className="mt-1 font-mono text-[10px] uppercase font-semibold text-zinc-500">{node.role.replace(/_/g, ' ')}</div>
            {node.note && <div className="text-[10px] font-mono text-zinc-500 truncate" title={node.note}>{node.note}</div>}
          </div>
        );
        const arrowW = Math.round(((w + roleWeight(nodes[Math.min(i + 1, nodes.length - 1)].role)) / 2) * 1.4 * 10) / 10;
        const arrowLit = active !== null && (i === active || i === active - 1);
        return (
          <React.Fragment key={`${node.name}-${node.role}-${i}`}>
            {node.href ? (
              <Link
                href={node.href}
                className="chart-hit rounded-md"
                style={{ opacity: dim ? 0.45 : 1 }}
                {...chartHitProps<HTMLAnchorElement>({
                  label: `${node.name}, ${node.role.replace(/_/g, ' ')}${node.note ? `, ${node.note}` : ''}. Opens the company record.`,
                  interactive: false,
                  focusable: false,
                  onEnter: () => setActive(i),
                  onLeave: () => setActive((cur) => (cur === i ? null : cur)),
                })}
              >
                {box}
              </Link>
            ) : (
              <div
                className="chart-hit rounded-md"
                style={{ opacity: dim ? 0.45 : 1 }}
                {...chartHitProps<HTMLDivElement>({
                  label: `${node.name}, ${node.role.replace(/_/g, ' ')}${node.note ? `, ${node.note}` : ''}`,
                  interactive: false,
                  focusable: true,
                  onEnter: () => setActive(i),
                  onLeave: () => setActive((cur) => (cur === i ? null : cur)),
                })}
              >
                {box}
              </div>
            )}
            {i < nodes.length - 1 && (
              <svg
                width="44"
                height="20"
                viewBox="0 0 44 20"
                aria-hidden="true"
                className="shrink-0 transition-opacity duration-200"
                style={{ opacity: dim ? 0.25 : arrowLit ? 1 : 0.9 }}
              >
                <line x1="2" y1="10" x2="34" y2="10" stroke={arrowLit ? '#059669' : '#52525b'} strokeWidth={arrowW} />
                <path d="M 32 4 L 42 10 L 32 16 z" fill={arrowLit ? '#059669' : '#52525b'} />
              </svg>
            )}
          </React.Fragment>
        );
      })}
      <p className="w-full text-[11px] font-mono text-zinc-500">
        {active !== null ? (
          <>
            <span className="font-semibold text-zinc-900">{nodes[active].name}</span>
            {' · '}
            {nodes[active].role.replace(/_/g, ' ')}
            {nodes[active].note ? ` · ${nodes[active].note}` : ''}
            {' · '}
            {active === 0 ? 'originates the flow' : active === nodes.length - 1 ? 'receives the flow' : 'passes capital through'}
          </>
        ) : (
          <>Box emphasis + arrow width encode party role weight (capital source/sink vs facilitator). Hover a party to trace the flow.</>
        )}
      </p>
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
  const router = useRouter();
  const [active, setActive] = useState<number | null>(null);
  // Hooks run before any early return so the component never changes hook count.
  const shown = useMemo(
    () => [...spokes].sort((a, b) => b.weight - a.weight).slice(0, maxSpokes),
    [spokes, maxSpokes]
  );
  const maxW = Math.max(...shown.map((s) => s.weight), 0.5);
  const enter = useCallback((i: number) => setActive(i), []);
  const leave = useCallback((i: number) => setActive((cur) => (cur === i ? null : cur)), []);

  if (spokes.length === 0) {
    return (
      <div className="empty-note">
        No counterparty links to map for this entity yet.
      </div>
    );
  }
  const hidden = spokes.length - shown.length;
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
      // Round like CircularFlow does: the server and the browser can disagree
      // on the last bit of `Math.cos`/`Math.sin`, which surfaces as a React
      // hydration mismatch on the raw attribute.
      x: r2(CX + RX * Math.cos(angle)),
      y: r2(CY + RY * Math.sin(angle)),
      angle,
    };
  });

  const activeSpoke = active !== null ? shown[active] : undefined;
  const activePoint = active !== null ? coords[active] : undefined;

  return (
    <div>
      <div className="relative">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          role="img"
          aria-label={`Counterparty star network for ${center}: ${shown.map((s) => `${s.name} (${s.weight})`).join(', ')}`}
          className="w-full h-auto"
        >
          {/* Spokes first so the markers sit above their own lines. */}
          {shown.map((sp, i) => {
            const p = coords[i];
            const width = 1 + 3.5 * Math.sqrt(sp.weight / maxW);
            const on = active === i;
            const dim = active !== null && !on;
            return (
              <g key={`e-${i}`}>
                <line
                  x1={CX}
                  y1={CY}
                  x2={p.x}
                  y2={p.y}
                  stroke={on ? '#059669' : '#71717a'}
                  strokeWidth={on ? width + 1.5 : width}
                  strokeOpacity={dim ? 0.12 : on ? 0.95 : 0.65}
                  className="chart-edge"
                />
                <line
                  x1={CX}
                  y1={CY}
                  x2={p.x}
                  y2={p.y}
                  stroke="transparent"
                  strokeWidth={Math.max(width + 12, 16)}
                  className="chart-edge-hit"
                  {...chartHitProps<SVGLineElement>({
                    label: `${center} ⇔ ${sp.name} — weight ${sp.weight}${sp.label ? `, ${sp.label}` : ''}`,
                    interactive: false,
                    onEnter: () => enter(i),
                    onLeave: () => leave(i),
                  })}
                />
              </g>
            );
          })}

          {/* Centre hub: brightens and blooms while a spoke is live. */}
          <circle
            cx={CX}
            cy={CY}
            r={active === null ? 24 : 30}
            fill="#09090b"
            className="chart-edge"
          />
          <circle
            cx={CX}
            cy={CY}
            r={34}
            fill="none"
            stroke={active === null ? 'transparent' : '#34d399'}
            strokeOpacity={0.4}
            strokeDasharray="3 4"
            aria-hidden="true"
          />
          <text x={CX} y={CY + 4.5} textAnchor="middle" fontSize={11} fontWeight={800} fill="#fff">
            {center.slice(0, 3).toUpperCase() || 'CO'}
          </text>
          <text x={CX} y={CY + 48} textAnchor="middle" fontSize={13} fontWeight={700} fill="#09090b">
            {truncate(center, 26)}
          </text>

          {shown.map((sp, i) => {
            const p = coords[i];
            const on = active === i;
            const dim = active !== null && !on;
            const anchor = Math.cos(p.angle) > 0.35 ? 'start' : Math.cos(p.angle) < -0.35 ? 'end' : 'middle';
            const lx = p.x + (anchor === 'middle' ? 0 : Math.cos(p.angle) > 0 ? 14 : -14);
            const ly = p.y + (anchor === 'middle' ? (Math.sin(p.angle) > 0 ? 26 : -16) : 4);
            // With a href the SVG <a> below carries the link semantics (and the
            // single tab stop); focus still reaches this group via focusin, so
            // the highlight follows the keyboard exactly as it follows the mouse.
            const label = (
              <g
                className="chart-hit"
                data-dim={dim ? 'true' : undefined}
                {...chartHitProps<SVGGElement>({
                  label: `${sp.name} — weight ${sp.weight}${sp.label ? `, ${sp.label}` : ''}`,
                  interactive: false,
                  focusable: !sp.href,
                  onEnter: () => enter(i),
                  onLeave: () => leave(i),
                })}
              >
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={on ? 13 : 9}
                  fill={on ? '#059669' : 'white'}
                  stroke={on ? '#059669' : '#52525b'}
                  strokeWidth={2}
                  style={{ transition: 'r 200ms cubic-bezier(0.22,1,0.36,1), fill 160ms ease' }}
                >
                  <title>{`${sp.name} — weight ${sp.weight}${sp.label ? ` (${sp.label})` : ''}`}</title>
                </circle>
                <text
                  x={lx}
                  y={ly}
                  textAnchor={anchor}
                  fontSize={12}
                  fontWeight={on ? 700 : 400}
                  fill={on ? '#09090b' : '#3f3f46'}
                  style={{ pointerEvents: 'none' }}
                >
                  {truncate(sp.name, 16)}
                </text>
              </g>
            );
            // A real SVG anchor keeps href + Enter + open-in-new-tab working.
            return sp.href ? (
              <a
                key={`n-${i}`}
                aria-label={`${sp.name} — weight ${sp.weight}. Opens the company record.`}
                {...svgLinkProps(sp.href, router)}
              >
                {label}
              </a>
            ) : (
              <g key={`n-${i}`}>{label}</g>
            );
          })}
        </svg>

        {activeSpoke && activePoint && (
          <ChartTooltip
            x={clampPct((activePoint.x / W) * 100, 6, 62)}
            y={(activePoint.y / H) * 100}
            maxX={62}
            placement={activePoint.y / H < 0.32 ? 'below' : 'above'}
          >
            <TooltipCard
              eyebrow={`COUNTERPARTY ${(active ?? 0) + 1} / ${shown.length}`}
              title={activeSpoke.name}
              accent="#059669"
              headline={`${activeSpoke.weight}× link weight`}
              rows={[
                { label: 'Relationship', value: activeSpoke.label ?? 'documented tie' },
                { label: 'vs strongest', value: pct(activeSpoke.weight, maxW, 1), tone: 'mint' },
              ]}
              footer={activeSpoke.href ? 'Select to open the company record' : `${center} ⇔ ${activeSpoke.name}`}
            />
          </ChartTooltip>
        )}
      </div>

      <ul className="mt-2 grid grid-cols-1 gap-x-5 gap-y-1 text-[11px] 2xl:grid-cols-2">
        {shown.map((sp, i) => (
          <li
            key={`l-${i}`}
            className="chart-row -mx-2 flex items-center gap-1.5 min-w-0 rounded-r px-2 py-0.5"
            data-active={active === i ? 'true' : undefined}
            data-dim={active !== null && active !== i ? 'true' : undefined}
            {...chartHitProps<HTMLLIElement>({
              label: `${sp.name} — weight ${sp.weight}${sp.label ? `, ${sp.label}` : ''}`,
              interactive: false,
              focusable: !sp.href,
              onEnter: () => enter(i),
              onLeave: () => leave(i),
            })}
          >
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
      <p className="mt-2 flex flex-wrap items-center gap-2 text-[11px] font-mono text-zinc-500">
        {activeSpoke ? (
          <>
            <ChartReadout>
              {activeSpoke.name} · {activeSpoke.weight}×{activeSpoke.label ? ` · ${activeSpoke.label}` : ''}
            </ChartReadout>
          </>
        ) : (
          <>
            Line width ∝ link weight (shared deals + documented ties)
            {hidden > 0 ? ` · +${hidden} more not drawn` : ''}
            {sub ? ` · ${sub}` : ''}
          </>
        )}
      </p>
    </div>
  );
}