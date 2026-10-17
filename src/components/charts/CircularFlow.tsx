'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { Company, CompanyType, Deal, Relationship } from '@/lib/types';
import { formatCurrency } from '@/lib/formatters';
import { dealTypeColor, dealTypeLabel } from './chartTheme';
import { ChartTooltip, TooltipCard, chartHitProps, clampPct, pct } from './chartInteraction';

interface CircularFlowProps {
  deals: Deal[];
  relationships: Relationship[];
  companies: Company[];
  /** Render the static diagram with no pointer/keyboard wiring. Default true. */
  interactive?: boolean;
  /** Show the relationship inspector panel under the diagram. Default true. */
  showInspector?: boolean;
  /** Ring size cap. Defaults to 14 — the busiest companies. */
  maxNodes?: number;
  /** Pre-select this company slug in the inspector (deep-linkable highlight). */
  focusCompanySlug?: string;
}

interface FlowEdge {
  from: string;
  to: string;
  kind: 'deal' | 'relationship';
  label: string;
  amount: number | null;
  dealSlug?: string;
  evidence: string;
}

const SOURCE_ROLES = new Set(['investor', 'lender', 'supplier', 'cloud_provider', 'utility', 'guarantor']);
const SINK_ROLES = new Set(['investee', 'borrower', 'customer', 'project_owner']);

const NODE_COLORS: Record<CompanyType, string> = {
  ai_lab: '#2563eb',
  chipmaker: '#7c3aed',
  cloud_provider: '#0284c7',
  data_center_operator: '#4f46e5',
  investor: '#64748b',
  lender: '#d97706',
  utility_power: '#059669',
  infrastructure_equipment: '#ea580c',
  other: '#a3a3a3',
};

const VIEW = 720;
const CENTER = VIEW / 2;
const RING_R = 248;
const MAX_NODES = 14;
const MAX_EDGES = 48;

function shortName(name: string): string {
  return name.length > 18 ? `${name.slice(0, 17)}…` : name;
}

/** Derive directed capital-flow edges from deal party roles (source → sink). */
function dealEdges(deals: Deal[]): FlowEdge[] {
  const edges: FlowEdge[] = [];
  for (const deal of deals) {
    const parties = deal.parties ?? [];
    const sources = parties.filter((p) => SOURCE_ROLES.has(p.role));
    const sinks = parties.filter((p) => SINK_ROLES.has(p.role));
    if (sources.length === 0 || sinks.length === 0) continue;
    for (const s of sources) {
      for (const t of sinks) {
        if (s.company_id === t.company_id) continue;
        edges.push({
          from: s.company_id,
          to: t.company_id,
          kind: 'deal',
          label: deal.title,
          amount: deal.amount_disclosed ? deal.amount_value : null,
          dealSlug: deal.slug,
          evidence: deal.evidence_level,
        });
      }
    }
  }
  return edges;
}

interface Cycle {
  nodes: string[];
  kind: 'bidirectional' | 'loop';
}

function detectCycles(edges: FlowEdge[]): Cycle[] {
  const adj = new Map<string, Set<string>>();
  for (const e of edges) {
    if (!adj.has(e.from)) adj.set(e.from, new Set());
    adj.get(e.from)?.add(e.to);
  }
  const cycles: Cycle[] = [];
  const seen = new Set<string>();

  // 2-cycles: A → B and B → A (bidirectional circular flow).
  for (const e of edges) {
    if (e.from === e.to) continue;
    if (adj.get(e.to)?.has(e.from)) {
      const key = ['2', ...[e.from, e.to].sort()].join('|');
      if (!seen.has(key)) {
        seen.add(key);
        cycles.push({ nodes: [e.from, e.to], kind: 'bidirectional' });
      }
    }
  }

  // 3-cycles: A → B → C → A.
  const ids = [...adj.keys()];
  for (const a of ids) {
    for (const b of adj.get(a) ?? []) {
      if (b === a) continue;
      for (const c of adj.get(b) ?? []) {
        if (c === a || c === b) continue;
        if (adj.get(c)?.has(a)) {
          const key = ['3', ...[a, b, c].sort()].join('|');
          if (!seen.has(key)) {
            seen.add(key);
            cycles.push({ nodes: [a, b, c], kind: 'loop' });
          }
        }
      }
    }
  }
  return cycles;
}

/** One counterparty tie as shown in the node inspector. */
interface NeighborRow {
  otherId: string;
  otherName: string;
  otherSlug: string | null;
  direction: 'out' | 'in';
  kind: FlowEdge['kind'];
  label: string;
  amount: number | null;
  dealSlug?: string;
  evidence: string;
  isCycle: boolean;
}

interface NodeStats {
  out: number;
  in: number;
  dealFlows: number;
  documented: number;
  disclosed: number;
  cycleEdges: number;
}

/**
 * Zero-dependency interactive circular capital-flow diagram.
 *
 * Companies sit on a ring; deal flows are curved chords (width ∝ $),
 * documented relationships are dashed chords. Detected circular loops
 * (A→B→A, A→B→C→A) are highlighted amber and listed below.
 *
 * Interaction: hover *or* keyboard-focus a node to raise it and its chords
 * while everything else recedes; a floating card names the company and its
 * biggest counterparties, and the inspector panel below lists every tie with
 * its deal type, amount and counterpart party. Enter / Space / click opens the
 * company record; ← → walk the ring without a pointer.
 */
export function CircularFlow({
  deals,
  relationships,
  companies,
  interactive = true,
  showInspector = true,
  maxNodes = MAX_NODES,
  focusCompanySlug,
}: CircularFlowProps) {
  const router = useRouter();
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [hoveredEdge, setHoveredEdge] = useState<number | null>(null);
  const [pinnedNode, setPinnedNode] = useState<string | null>(null);
  const nodeRefs = useRef<Record<string, SVGGElement | null>>({});

  const nameById = useMemo(() => new Map(companies.map((c) => [c.id, c.name])), [companies]);
  const companyById = useMemo(() => new Map(companies.map((c) => [c.id, c])), [companies]);

  const model = useMemo(() => {
    const allEdges: FlowEdge[] = [
      ...dealEdges(deals),
      ...relationships.map((r) => ({
        from: r.from_company_id,
        to: r.to_company_id,
        kind: 'relationship' as const,
        label: r.relationship_type.replace(/_/g, ' '),
        amount: null,
        evidence: r.evidence_level,
      })),
    ];

    // Rank companies by flow degree, keep the busiest on the ring.
    const degree = new Map<string, number>();
    for (const e of allEdges) {
      degree.set(e.from, (degree.get(e.from) ?? 0) + 1);
      degree.set(e.to, (degree.get(e.to) ?? 0) + 1);
    }
    const ranked = [...degree.entries()]
      .filter(([id]) => nameById.has(id))
      .sort((a, b) => b[1] - a[1] || (nameById.get(a[0]) ?? '').localeCompare(nameById.get(b[0]) ?? ''))
      .slice(0, maxNodes)
      .map(([id]) => id);
    const nodeSet = new Set(ranked);

    const inScope = allEdges.filter((e) => nodeSet.has(e.from) && nodeSet.has(e.to) && e.from !== e.to);
    inScope.sort((a, b) => (b.amount ?? -1) - (a.amount ?? -1));
    const edges = inScope.slice(0, MAX_EDGES);

    const cycles = detectCycles(edges).slice(0, 8);
    const cyclePair = new Set<string>();
    for (const c of cycles) {
      for (let i = 0; i < c.nodes.length; i++) {
        cyclePair.add(`${c.nodes[i]}→${c.nodes[(i + 1) % c.nodes.length]}`);
      }
    }

    const maxAmount = edges.reduce((m, e) => Math.max(m, e.amount ?? 0), 0);

    // Per-node adjacency + stats power the tooltip and the inspector panel.
    const adjacency = new Map<string, NeighborRow[]>();
    const stats = new Map<string, NodeStats>();
    const ensure = (id: string) => {
      if (!adjacency.has(id)) adjacency.set(id, []);
      if (!stats.has(id)) {
        stats.set(id, { out: 0, in: 0, dealFlows: 0, documented: 0, disclosed: 0, cycleEdges: 0 });
      }
    };
    for (const id of ranked) ensure(id);
    for (const e of edges) {
      if (!adjacency.has(e.from) || !adjacency.has(e.to)) continue;
      const isCycle = cyclePair.has(`${e.from}→${e.to}`) || cyclePair.has(`${e.to}→${e.from}`);
      const fromName = nameById.get(e.from) ?? e.from;
      const toName = nameById.get(e.to) ?? e.to;
      adjacency.get(e.from)?.push({
        otherId: e.to,
        otherName: toName,
        otherSlug: companyById.get(e.to)?.slug ?? null,
        direction: 'out',
        kind: e.kind,
        label: e.label,
        amount: e.amount,
        dealSlug: e.dealSlug,
        evidence: e.evidence,
        isCycle,
      });
      adjacency.get(e.to)?.push({
        otherId: e.from,
        otherName: fromName,
        otherSlug: companyById.get(e.from)?.slug ?? null,
        direction: 'in',
        kind: e.kind,
        label: e.label,
        amount: e.amount,
        dealSlug: e.dealSlug,
        evidence: e.evidence,
        isCycle,
      });
      const fs = stats.get(e.from);
      const ts = stats.get(e.to);
      if (fs) {
        fs.out += 1;
        if (e.kind === 'deal') fs.dealFlows += 1;
        else fs.documented += 1;
        fs.disclosed += e.amount ?? 0;
        if (isCycle) fs.cycleEdges += 1;
      }
      if (ts) {
        ts.in += 1;
        ts.disclosed += e.amount ?? 0;
        if (isCycle) ts.cycleEdges += 1;
      }
    }
    for (const rows of adjacency.values()) {
      rows.sort((a, b) => (b.amount ?? -1) - (a.amount ?? -1) || a.otherName.localeCompare(b.otherName));
    }

    return { nodes: ranked, edges, cycles, cyclePair, maxAmount, adjacency, stats };
  }, [deals, relationships, nameById, companyById, maxNodes]);

  /**
   * Round every emitted coordinate. Node and the browser can disagree on the
   * last floating-point bit of `Math.cos` / `Math.hypot`, which surfaces as a
   * React hydration mismatch on the raw `d` attribute — and full-precision
   * floats bloat the DOM for no visual gain at this scale.
   */
  const r2 = (n: number) => Math.round(n * 100) / 100;

  const pos = (index: number, total: number) => {
    const angle = -Math.PI / 2 + (index / Math.max(total, 1)) * Math.PI * 2;
    return { x: r2(CENTER + RING_R * Math.cos(angle)), y: r2(CENTER + RING_R * Math.sin(angle)), angle };
  };

  const chordPath = (a: { x: number; y: number }, b: { x: number; y: number }, bend: number) => {
    const mx = (a.x + b.x) / 2;
    const my = (a.y + b.y) / 2;
    // Pull the control point toward the center so chords arc inside the ring.
    const cx = mx + (CENTER - mx) * 0.55;
    const cy = my + (CENTER - my) * 0.55;
    // Perpendicular offset separates bidirectional pairs to opposite sides.
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len = Math.hypot(dx, dy) || 1;
    return `M ${r2(a.x)} ${r2(a.y)} Q ${r2(cx + (-dy / len) * bend)} ${r2(cy + (dx / len) * bend)} ${r2(b.x)} ${r2(b.y)}`;
  };

  const openCompany = useCallback(
    (id: string) => {
      const slug = companyById.get(id)?.slug;
      if (slug) router.push(`/companies/${slug}`);
    },
    [companyById, router]
  );

  const activeNode = hoveredNode ?? pinnedNode;

  const setActive = useCallback(
    (id: string | null) => {
      if (!interactive) return;
      setHoveredNode(id);
    },
    [interactive]
  );

  // Deep-link highlight: when the host page knows which entity the reader is
  // looking at, preselect it so the inspector opens with content.
  useEffect(() => {
    if (!focusCompanySlug) return;
    const match = companies.find((c) => c.slug === focusCompanySlug);
    if (match && model.nodes.includes(match.id)) setPinnedNode(match.id);
  }, [focusCompanySlug, companies, model.nodes]);

  if (model.nodes.length < 2 || model.edges.length === 0) {
    return (
      <div className="empty-note">
        Not enough connected flows to draw the circular diagram for the current filters.
      </div>
    );
  }

  const idx = new Map(model.nodes.map((id, i) => [id, i]));
  const coords = new Map(model.nodes.map((id, i) => [id, pos(i, model.nodes.length)]));
  const connectedEdges = activeNode
    ? new Set(
        model.edges
          .map((e, i) => ({ e, i }))
          .filter(({ e }) => e.from === activeNode || e.to === activeNode)
          .map(({ i }) => i)
      )
    : null;

  const activeCompany = activeNode ? companyById.get(activeNode) : undefined;
  const activeRows = activeNode ? model.adjacency.get(activeNode) ?? [] : [];
  const activeStats = activeNode ? model.stats.get(activeNode) : undefined;
  const totalDisclosed = model.edges.reduce((s, e) => s + (e.amount ?? 0), 0);
  const activePoint = activeNode ? coords.get(activeNode) : undefined;

  return (
    <div>
      {/* Live readouts — reserved height so nothing jumps while hovering. */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="chart-readout">
          {model.nodes.length} entities · {model.edges.length} flows
        </span>
        <span className="chart-readout">
          {formatCurrency(totalDisclosed)} on the chords
        </span>
        <span className={`chart-readout ${model.cycles.length === 0 ? 'chart-readout-muted' : ''}`}>
          {model.cycles.length} circular loop{model.cycles.length === 1 ? '' : 's'}
        </span>
        <span className="micro-label ml-auto hidden sm:inline">
          {interactive ? 'Hover, Tab or click a node' : 'Static diagram'}
        </span>
      </div>

      <div className="relative">
        <svg
          viewBox={`0 0 ${VIEW} ${VIEW}`}
          role="img"
          aria-label="Circular diagram of capital flows between the most connected companies. Amber chords mark circular loops."
          className="w-full h-auto max-h-[640px]"
        >
          <defs>
            <marker id="cf-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M 0 1 L 9 5 L 0 9 z" fill="#71717a" />
            </marker>
            <marker id="cf-arrow-cycle" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M 0 1 L 9 5 L 0 9 z" fill="#b45309" />
            </marker>
            <filter id="cf-glow" x="-60%" y="-60%" width="220%" height="220%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Faint ring guide — gives the hover target an implied centre. */}
          <circle
            cx={CENTER}
            cy={CENTER}
            r={RING_R}
            fill="none"
            stroke="#e4e4e7"
            strokeWidth={1}
            strokeDasharray="2 6"
            aria-hidden="true"
          />

          {/* Edges: a fat transparent path carries the hit geometry, the visible
              stroke stays non-interactive so the two never disagree. */}
          {model.edges.map((e, i) => {
            const a = coords.get(e.from);
            const b = coords.get(e.to);
            if (!a || !b) return null;
            const isCycle = model.cyclePair.has(`${e.from}→${e.to}`);
            const lifted = activeNode !== null && connectedEdges?.has(i);
            const dim = activeNode !== null && !lifted;
            const width =
              e.kind === 'deal'
                ? 1.2 + (e.amount && model.maxAmount > 0 ? 4.5 * Math.sqrt(e.amount / model.maxAmount) : 0.8)
                : 1.2;
            const side = (idx.get(e.from) ?? 0) < (idx.get(e.to) ?? 0) ? 1 : -1;
            const d = chordPath(a, b, 22 * side);
            const stroke = isCycle ? '#b45309' : e.kind === 'deal' ? dealTypeColor('debt_credit_facility') : '#a1a1aa';
            return (
              <g key={`${e.from}-${e.to}-${i}`}>
                <path
                  d={d}
                  fill="none"
                  stroke={stroke}
                  className="chart-edge"
                  strokeOpacity={isCycle ? (dim ? 0.12 : 0.95) : lifted ? 0.95 : activeNode ? 0.05 : e.kind === 'deal' ? 0.55 : 0.5}
                  strokeWidth={isCycle ? width + 1.5 : width}
                  strokeDasharray={e.kind === 'relationship' && !isCycle ? '6 4' : undefined}
                  markerEnd={isCycle ? 'url(#cf-arrow-cycle)' : 'url(#cf-arrow)'}
                  filter={lifted ? 'url(#cf-glow)' : undefined}
                />
                {/* Hit layer + tooltip. Pointer-only by design: the same facts
                    are reachable by keyboard through the node inspector and
                    to screen readers through the chord's <title>. */}
                <path
                  d={d}
                  fill="none"
                  stroke="transparent"
                  strokeWidth={Math.max(width + 10, 14)}
                  className="chart-edge-hit"
                  onMouseEnter={() => interactive && setHoveredEdge(i)}
                  onMouseLeave={() => setHoveredEdge((cur) => (cur === i ? null : cur))}
                >
                  <title>
                    {`${nameById.get(e.from) ?? e.from} → ${nameById.get(e.to) ?? e.to} — ${e.label}${
                      e.amount ? ` (${formatCurrency(e.amount)})` : ''
                    }`}
                  </title>
                </path>
              </g>
            );
          })}

          {model.nodes.map((id, i) => {
            const p = coords.get(id);
            if (!p) return null;
            const company = companyById.get(id);
            const name = nameById.get(id) ?? id;
            const isFocused = activeNode === id;
            const dimmed = activeNode !== null && !isFocused;
            const pinned = pinnedNode === id;
            const outward = { x: Math.cos(p.angle), y: Math.sin(p.angle) };
            const labelX = r2(p.x + outward.x * 30);
            const labelY = r2(p.y + outward.y * 24);
            const stats = model.stats.get(id);
            const ties = stats ? stats.out + stats.in : 0;
            const nodeColor = company ? NODE_COLORS[company.company_type] : '#a3a3a3';
            // One hit box enclosing marker + caption (approximate 12px sans
            // width ≈ 6.5px/char). A single shape — rather than a disc plus a
            // caption box — means no click can land in the gap between them,
            // and a marker later in DOM order always wins over a neighbour's
            // caption box, so the visible circle stays the primary target.
            const capW = shortName(name).length * 6.5 + 6;
            const capRight =
              outward.x > 0.3 ? labelX + capW : outward.x < -0.3 ? labelX - capW : labelX + capW / 2;
            const hitBox = {
              x: Math.min(p.x - 27, labelX - (outward.x > 0.3 ? 3 : outward.x < -0.3 ? capW - 3 : capW / 2)),
              y: Math.min(p.y - 27, labelY - 13),
              w: Math.max(p.x + 27, capRight) - Math.min(p.x - 27, labelX - (outward.x > 0.3 ? 3 : outward.x < -0.3 ? capW - 3 : capW / 2)),
              h: Math.max(p.y + 27, labelY + 7) - Math.min(p.y - 27, labelY - 13),
            };
            return (
              <g
                key={id}
                ref={(el) => {
                  nodeRefs.current[id] = el;
                }}
                className="chart-hit"
                data-dim={dimmed ? 'true' : undefined}
                focusable="true"
                style={{ outlineOffset: '4px' }}
                {...chartHitProps<SVGGElement>({
                  label: `${name}${company ? `, ${company.company_type.replace(/_/g, ' ')}` : ''}. Index ${i + 1} of ${model.nodes.length}. ${ties} tie${ties === 1 ? '' : 's'}. ${pinned ? 'Pinned. ' : ''}Press Enter to open the company record.`,
                  interactive,
                  onEnter: () => setActive(id),
                  onLeave: () => setActive(null),
                  onActivate: () => {
                    if (!interactive) return;
                    setPinnedNode((cur) => (cur === id ? null : id));
                    openCompany(id);
                  },
                })}
                onKeyDown={(ev) => {
                  /* This handler REPLACES the one chartHitProps attaches (a
                     later prop wins), so Enter/Space activation is handled
                     here too — otherwise keyboard users could focus and walk
                     the ring but never open a record. */
                  if (ev.key === 'Enter' || ev.key === ' ' || ev.key === 'Spacebar') {
                    if (!interactive) return;
                    ev.preventDefault();
                    setPinnedNode((cur) => (cur === id ? null : id));
                    openCompany(id);
                    return;
                  }
                  // Left/Right walks the ring without needing a pointer.
                  const forward = ev.key === 'ArrowRight' || ev.key === 'ArrowDown';
                  const backward = ev.key === 'ArrowLeft' || ev.key === 'ArrowUp';
                  if (!forward && !backward && ev.key !== 'Home' && ev.key !== 'End' && ev.key !== 'Escape') {
                    return;
                  }
                  ev.preventDefault();
                  if (ev.key === 'Escape') {
                    setHoveredNode(null);
                    setPinnedNode(null);
                    return;
                  }
                  const total = model.nodes.length;
                  const next =
                    ev.key === 'Home'
                      ? 0
                      : ev.key === 'End'
                        ? total - 1
                        : (i + (forward ? 1 : -1) + total) % total;
                  const nextId = model.nodes[next];
                  setHoveredNode(nextId);
                  nodeRefs.current[nextId]?.focus();
                }}
              >
                {/* Hit area: one box covering the marker and its caption, so the
                    whole drawn node is a target — never the empty canvas that
                    sits between the two. */}
                <rect
                  x={r2(hitBox.x)}
                  y={r2(hitBox.y)}
                  width={r2(hitBox.w)}
                  height={r2(hitBox.h)}
                  fill="transparent"
                />
                {/* Halo behind the marker: the "powered" tell on hover. */}
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={isFocused ? 26 : 20}
                  fill={nodeColor}
                  fillOpacity={isFocused ? 0.16 : 0}
                  stroke={nodeColor}
                  strokeOpacity={isFocused ? 0.35 : 0}
                  strokeWidth={1}
                />
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={isFocused ? 17 : 15}
                  fill="white"
                  stroke={nodeColor}
                  strokeWidth={isFocused ? 3 : 2}
                  style={{
                    transition: 'r 200ms cubic-bezier(0.22,1,0.36,1), stroke-width 200ms ease',
                  }}
                />
                {pinned && (
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={23}
                    fill="none"
                    stroke="#059669"
                    strokeWidth={1.5}
                    strokeDasharray="3 3"
                    aria-hidden="true"
                  />
                )}
                <text
                  x={p.x}
                  y={p.y + 4}
                  textAnchor="middle"
                  fontSize={11}
                  fontWeight="bold"
                  fill="#18181b"
                  style={{ pointerEvents: 'none' }}
                >
                  {i + 1}
                </text>
                <text
                  x={labelX}
                  y={labelY}
                  textAnchor={outward.x > 0.3 ? 'start' : outward.x < -0.3 ? 'end' : 'middle'}
                  fontSize={12}
                  fontWeight={isFocused ? 'bold' : 'normal'}
                  fill={isFocused ? '#09090b' : '#3f3f46'}
                  style={{ pointerEvents: 'none' }}
                >
                  {`${i + 1}. ${shortName(name)}`}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Floating card — the fast read. Full detail lives in the inspector.
            Anchors in the upper band flip the card below so it never covers the
            node it is describing. */}
        {interactive && activePoint && activeNode && (
          <ChartTooltip
            x={clampPct((activePoint.x / VIEW) * 100, 4, 70)}
            y={(activePoint.y / VIEW) * 100}
            placement={activePoint.y / VIEW < 0.34 ? 'below' : 'above'}
          >
            <TooltipCard
              eyebrow={`NODE ${(idx.get(activeNode) ?? 0) + 1} / ${model.nodes.length}`}
              title={nameById.get(activeNode) ?? activeNode}
              accent={activeCompany ? NODE_COLORS[activeCompany.company_type] : undefined}
              headline={activeStats ? `${activeStats.out + activeStats.in} ties` : undefined}
              headlineTone="mint"
              rows={[
                {
                  label: 'Type',
                  value: activeCompany ? activeCompany.company_type.replace(/_/g, ' ') : '—',
                },
                { label: 'Deal flows', value: activeStats ? String(activeStats.dealFlows) : '0' },
                {
                  label: 'Documented',
                  value: activeStats ? String(activeStats.documented) : '0',
                },
                {
                  label: 'Disclosed $',
                  value: activeStats && activeStats.disclosed > 0 ? formatCurrency(activeStats.disclosed) : '—',
                  tone: 'mint',
                },
              ]}
              footer={
                activeRows.length > 0
                  ? `Top tie: ${activeRows[0].otherName}${activeRows[0].amount ? ` · ${formatCurrency(activeRows[0].amount)}` : ''}`
                  : 'No counterparties in view'
              }
            />
          </ChartTooltip>
        )}

        {/* Edge detail on hover — pointer refinement over the node readout. */}
        {interactive && hoveredEdge !== null && !activeNode && model.edges[hoveredEdge] && (
          <ChartTooltip x={50} y={50} maxX={60}>
            <TooltipCard
              eyebrow="FLOW"
              title={`${nameById.get(model.edges[hoveredEdge].from) ?? ''} → ${
                nameById.get(model.edges[hoveredEdge].to) ?? ''
              }`}
              accent={model.cyclePair.has(`${model.edges[hoveredEdge].from}→${model.edges[hoveredEdge].to}`) ? '#b45309' : '#2563eb'}
              headline={model.edges[hoveredEdge].amount ? formatCurrency(model.edges[hoveredEdge].amount) : undefined}
              rows={[
                {
                  label: 'Type',
                  value:
                    model.edges[hoveredEdge].kind === 'deal'
                      ? dealTypeLabel('capital flow')
                      : 'documented tie',
                },
                { label: 'Evidence', value: model.edges[hoveredEdge].evidence.replace(/_/g, ' ') },
              ]}
              footer={model.edges[hoveredEdge].label}
            />
          </ChartTooltip>
        )}
      </div>

      {/* Legend */}
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-zinc-100 pt-3 font-mono text-[11px] text-zinc-600">
        <span className="inline-flex items-center gap-1.5">
          <svg width="34" height="8" aria-hidden="true"><line x1="0" y1="4" x2="30" y2="4" stroke="#d97706" strokeWidth="3" /></svg>
          Deal flow (width ∝ $)
        </span>
        <span className="inline-flex items-center gap-1.5">
          <svg width="34" height="8" aria-hidden="true"><line x1="0" y1="4" x2="30" y2="4" stroke="#a1a1aa" strokeWidth="1.5" strokeDasharray="6 4" /></svg>
          Documented relationship
        </span>
        <span className="inline-flex items-center gap-1.5">
          <svg width="34" height="8" aria-hidden="true"><line x1="0" y1="4" x2="30" y2="4" stroke="#b45309" strokeWidth="3" /></svg>
          Circular loop segment
        </span>
        <span className="micro-label ml-auto hidden sm:inline">
          {interactive ? '← → walks the ring · Enter opens the record' : 'Tab to walk the ring'}
        </span>
      </div>

      {/* Inspector: every tie of the active node, with counterparty, deal type,
          amount and the linked records. Keyboard-reachable, unlike the chords. */}
      {showInspector && interactive && (
        <div className="mt-4">
          <div className="flex items-center justify-between gap-2">
            <h3 className="panel-title">
              {activeNode ? `Counterparties — ${nameById.get(activeNode) ?? ''}` : 'Node inspector'}
            </h3>
            {activeNode && (
              <button
                type="button"
                className="pill pill-neutral transition-colors hover:border-zinc-400 hover:text-zinc-900"
                onClick={() => {
                  setPinnedNode(null);
                  setHoveredNode(null);
                }}
              >
                Clear
              </button>
            )}
          </div>

          {!activeNode ? (
            <p className="mt-2 caption">
              Hover, focus or click any node to list its counterparties, deal types and disclosed amounts
              in full. Click a node to open its company record.
            </p>
          ) : (
            <div className="mt-2">
              <div className="flex flex-wrap items-center gap-2">
                {activeCompany && (
                  <>
                    <span className="pill pill-neutral">
                      {activeCompany.company_type.replace(/_/g, ' ')}
                    </span>
                    {activeCompany.ticker && <span className="pill pill-mint">{activeCompany.ticker}</span>}
                    {activeCompany.headquarters_country && (
                      <span className="pill pill-neutral">{activeCompany.headquarters_country}</span>
                    )}
                  </>
                )}
                <Link
                  href={`/companies/${activeCompany?.slug ?? nameById.get(activeNode) ?? ''}`}
                  className="link-ledger-strong"
                  onClick={(ev) => {
                    // Plain clicks stay client-side; modified clicks keep the
                    // browser's native "open in new tab" behaviour.
                    if (!ev.metaKey && !ev.ctrlKey && !ev.shiftKey && ev.button === 0) {
                      ev.preventDefault();
                      router.push(`/companies/${activeCompany?.slug ?? ''}`);
                    }
                  }}
                >
                  Open company record →
                </Link>
              </div>

              <ul className="mt-3 space-y-1.5">
                {activeRows.map((row, i) => (
                  <li
                    key={`${row.otherId}-${row.direction}-${i}`}
                    className={`chart-row -mx-2 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-r px-2 py-1.5`}
                  >
                    <span
                      className={`num shrink-0 rounded px-1 text-[10px] font-bold ${
                        row.isCycle
                          ? 'bg-amber-100 text-amber-800'
                          : row.direction === 'out'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-zinc-100 text-zinc-700'
                      }`}
                      title={row.direction === 'out' ? 'Capital leaves this company' : 'Capital arrives at this company'}
                    >
                      {row.direction === 'out' ? '→ OUT' : '← IN'}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-xs font-semibold text-zinc-900">
                      {row.otherSlug ? (
                        <Link
                          href={`/companies/${row.otherSlug}`}
                          className="rounded transition-colors hover:text-emerald-800 hover:underline"
                        >
                          {row.otherName}
                        </Link>
                      ) : (
                        row.otherName
                      )}
                    </span>
                    <span className="micro-label shrink-0 truncate">
                      {row.kind === 'deal' ? 'deal flow' : row.label}
                    </span>
                    <span className="num shrink-0 whitespace-nowrap text-[11px] font-semibold text-zinc-700">
                      {row.amount ? formatCurrency(row.amount) : 'undisclosed'}
                    </span>
                    {row.isCycle && <span className="pill pill-amber shrink-0">loop</span>}
                    {row.dealSlug && (
                      <Link href={`/deals/${row.dealSlug}`} className="link-cite shrink-0">
                        deal →
                      </Link>
                    )}
                  </li>
                ))}
              </ul>

              {activeStats && activeRows.length > 0 && (
                <p className="mt-2 caption">
                  {activeRows.length} tie{activeRows.length === 1 ? '' : 's'} drawn ·{' '}
                  {pct(activeStats.disclosed, totalDisclosed)} of the disclosed capital on these chords ·{' '}
                  {activeStats.cycleEdges > 0
                    ? `${activeStats.cycleEdges} edge${activeStats.cycleEdges === 1 ? '' : 's'} inside a detected loop`
                    : 'not part of a detected loop'}
                  .
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Detected cycles */}
      <div className="mt-4">
        <h3 className="panel-title">Detected circular financing ({model.cycles.length})</h3>
        {model.cycles.length === 0 ? (
          <p className="mt-1 text-xs text-zinc-500">
            No A→B→A or A→B→C→A loops among the displayed companies under the current filters.
            Capital here flows one way — e.g. lender → neocloud → GPU vendor.
          </p>
        ) : (
          <ul className="mt-2 space-y-2">
            {model.cycles.map((c, i) => {
              const names = c.nodes.map((id) => nameById.get(id) ?? id);
              const chain = c.kind === 'bidirectional'
                ? `${names[0]} ⇄ ${names[1]}`
                : `${names.join(' → ')} → ${names[0]}`;
              return (
                <li
                  key={i}
                  className="notice notice-amber"
                  onMouseEnter={() => interactive && setActive(c.nodes[0])}
                  onMouseLeave={() => interactive && setActive(null)}
                >
                  <span className="block font-semibold">{chain}</span>
                  <span className="micro-label mt-1 block text-amber-700">
                    {c.kind === 'bidirectional'
                      ? 'Bidirectional pair — capital flows both ways'
                      : '3-node loop — follow the amber chords'}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
        <p className="caption mt-2.5">
          Edges combine documented relationships with deal party roles (investor/lender &rarr; investee/borrower).
          A loop means money — or binding commitments — travel in a circle, the classic round-tripping pattern
          to watch.
        </p>
      </div>
    </div>
  );
}