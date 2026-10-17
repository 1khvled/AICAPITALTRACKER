'use client';

import React, { useMemo, useState } from 'react';
import type { Company, CompanyType, Deal, Relationship } from '@/lib/types';
import { formatCurrency } from '@/lib/formatters';
import { dealTypeColor } from './chartTheme';

interface CircularFlowProps {
  deals: Deal[];
  relationships: Relationship[];
  companies: Company[];
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

/**
 * Zero-dependency circular capital-flow diagram.
 * Companies sit on a ring; deal flows are curved chords (width ∝ $),
 * documented relationships are dashed chords. Detected circular loops
 * (A→B→A, A→B→C→A) are highlighted amber and listed below.
 */
export function CircularFlow({ deals, relationships, companies }: CircularFlowProps) {
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

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
      .slice(0, MAX_NODES)
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
    return { nodes: ranked, edges, cycles, cyclePair, maxAmount };
  }, [deals, relationships, nameById]);

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

  if (model.nodes.length < 2 || model.edges.length === 0) {
    return (
      <div className="empty-note">
        Not enough connected flows to draw the circular diagram for the current filters.
      </div>
    );
  }

  const idx = new Map(model.nodes.map((id, i) => [id, i]));
  const coords = new Map(model.nodes.map((id, i) => [id, pos(i, model.nodes.length)]));

  return (
    <div>
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
        </defs>

        {model.edges.map((e, i) => {
          const a = coords.get(e.from);
          const b = coords.get(e.to);
          if (!a || !b) return null;
          const isCycle = model.cyclePair.has(`${e.from}→${e.to}`);
          const connected = hoveredNode === null || e.from === hoveredNode || e.to === hoveredNode;
          const width =
            e.kind === 'deal'
              ? 1.2 + (e.amount && model.maxAmount > 0 ? 4.5 * Math.sqrt(e.amount / model.maxAmount) : 0.8)
              : 1.2;
          const side = (idx.get(e.from) ?? 0) < (idx.get(e.to) ?? 0) ? 1 : -1;
          return (
            <path
              key={`${e.from}-${e.to}-${i}`}
              d={chordPath(a, b, 22 * side)}
              fill="none"
              stroke={isCycle ? '#b45309' : e.kind === 'deal' ? dealTypeColor('debt_credit_facility') : '#a1a1aa'}
              strokeOpacity={isCycle ? 0.95 : connected ? (e.kind === 'deal' ? 0.55 : 0.5) : 0.08}
              strokeWidth={isCycle ? width + 1.5 : width}
              strokeDasharray={e.kind === 'relationship' && !isCycle ? '6 4' : undefined}
              markerEnd={isCycle ? 'url(#cf-arrow-cycle)' : 'url(#cf-arrow)'}
            >
              <title>
                {`${nameById.get(e.from) ?? e.from} → ${nameById.get(e.to) ?? e.to} — ${e.label}${
                  e.amount ? ` (${formatCurrency(e.amount)})` : ''
                }`}
              </title>
            </path>
          );
        })}

        {model.nodes.map((id, i) => {
          const p = coords.get(id);
          if (!p) return null;
          const company = companyById.get(id);
          const name = nameById.get(id) ?? id;
          const isFocused = hoveredNode === id;
          const dimmed = hoveredNode !== null && !isFocused;
          const outward = { x: Math.cos(p.angle), y: Math.sin(p.angle) };
          const labelX = r2(p.x + outward.x * 30);
          const labelY = r2(p.y + outward.y * 24);
          return (
            <g
              key={id}
              /* Keyboard parity with hover: the SVG exposes an interactive
                 highlight, so every node must be reachable by Tab. Without
                 this the whole "who is connected to whom" affordance was
                 mouse-only. `focusable` keeps older Edge/IE happy. */
              tabIndex={0}
              focusable="true"
              role="button"
              aria-label={`${name}${company ? `, ${company.company_type.replace(/_/g, ' ')}` : ''}. Index ${i + 1} of ${model.nodes.length}.`}
              onFocus={() => setHoveredNode(id)}
              onBlur={() => setHoveredNode((n) => (n === id ? null : n))}
              onMouseEnter={() => setHoveredNode(id)}
              onMouseLeave={() => setHoveredNode((n) => (n === id ? null : n))}
              onKeyDown={(ev) => {
                // Left/Right walks the ring without needing a pointer.
                if (ev.key !== 'ArrowLeft' && ev.key !== 'ArrowRight') return;
                ev.preventDefault();
                const dir = ev.key === 'ArrowRight' ? 1 : -1;
                const next = (i + dir + model.nodes.length) % model.nodes.length;
                setHoveredNode(model.nodes[next]);
              }}
              opacity={dimmed ? 0.4 : 1}
              style={{ cursor: 'pointer' }}
            >
              <circle
                cx={p.x}
                cy={p.y}
                r={isFocused ? 17 : 15}
                fill="white"
                stroke={company ? NODE_COLORS[company.company_type] : '#a3a3a3'}
                strokeWidth={isFocused ? 3 : 2}
              />
              <text
                x={p.x}
                y={p.y + 4}
                textAnchor="middle"
                fontSize={11}
                fontWeight="bold"
                fill="#18181b"
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
              >
                {`${i + 1}. ${shortName(name)}`}
              </text>
            </g>
          );
        })}
      </svg>

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
        <span className="micro-label ml-auto hidden sm:inline">Tab to walk the ring</span>
      </div>

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
                <li key={i} className="notice notice-amber">
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
