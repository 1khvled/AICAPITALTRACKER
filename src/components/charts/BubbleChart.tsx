'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import type { Deal } from '@/lib/types';
import { formatCurrency } from '@/lib/formatters';
import { DEAL_TYPE_ORDER, UNDISCLOSED_FILL, UNDISCLOSED_STROKE, dealTypeColor, dealTypeLabel } from './chartTheme';

interface BubbleChartProps {
  deals: Deal[];
}

interface PlacedBubble {
  deal: Deal;
  cx: number;
  cy: number;
  r: number;
  disclosed: boolean;
}

const VIEW_W = 960;
const VIEW_H = 600;
// Floor for the trimmed canvas. The packer fills top-down, so the used
// height is often far below VIEW_H; a tall floor would leave the panel mostly
// empty. Purely presentational — packing still scans the full VIEW_H.
const MIN_VIEW_H = 150;
const MAX_R = 56;
const MIN_R = 7;
const UNDISCLOSED_R = 10;
const GAP = 4;
const GRID_STEP = 10;

/**
 * Zero-dependency packed bubble chart.
 * Radius scales with sqrt(amount) so bubble AREA is proportional to dollars.
 * Layout is a deterministic grid-scan pack (largest first), responsive via viewBox.
 */
export function BubbleChart({ deals }: BubbleChartProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const bubbles = useMemo<PlacedBubble[]>(() => {
    const disclosed = deals.filter((d) => d.amount_disclosed && d.amount_value && d.amount_value > 0);
    const maxAmount = disclosed.reduce((m, d) => Math.max(m, d.amount_value ?? 0), 0);

    const items = [...deals]
      .map((deal) => {
        const disclosed = deal.amount_disclosed && deal.amount_value && deal.amount_value > 0;
        const r = disclosed
          ? MIN_R + (Math.sqrt((deal.amount_value ?? 0) / Math.max(maxAmount, 1)) * (MAX_R - MIN_R))
          : UNDISCLOSED_R;
        return { deal, r, disclosed: Boolean(disclosed) };
      })
      .sort((a, b) => b.r - a.r);

    const placed: PlacedBubble[] = [];
    for (const item of items) {
      let best: { cx: number; cy: number } | null = null;
      // Scan rows top-to-bottom, left-to-right for the first non-overlapping slot.
      outer: for (let cy = item.r + GAP; cy <= VIEW_H - item.r; cy += GRID_STEP) {
        for (let cx = item.r + GAP; cx <= VIEW_W - item.r; cx += GRID_STEP) {
          const overlap = placed.some(
            (p) => Math.hypot(p.cx - cx, p.cy - cy) < p.r + item.r + GAP
          );
          if (!overlap) {
            best = { cx, cy };
            break outer;
          }
        }
      }
      // Fallback (canvas full): stack in the bottom-right corner area.
      if (!best) {
        const i = placed.length;
        best = {
          cx: VIEW_W - item.r - GAP - (i % 8) * (item.r * 2 + GAP),
          cy: VIEW_H - item.r - GAP - Math.floor(i / 8) * (item.r * 2 + GAP),
        };
      }
      placed.push({ deal: item.deal, cx: best.cx, cy: best.cy, r: item.r, disclosed: item.disclosed });
    }
    return placed;
  }, [deals]);

  const hovered = hoveredId ? bubbles.find((b) => b.deal.id === hoveredId) ?? null : null;
  const presentTypes = DEAL_TYPE_ORDER.filter((t) => deals.some((d) => d.deal_type === t));
  const undisclosedCount = deals.filter((d) => !d.amount_disclosed || !d.amount_value).length;

  // The packer fills top-down, so the drawn area is usually much shorter than
  // VIEW_H. Trim the canvas to what is actually used instead of rendering a
  // mostly-empty panel. Purely presentational — packing logic is untouched.
  const usedHeight = bubbles.reduce((m, b) => Math.max(m, b.cy + b.r), 0);
  const viewH = Math.max(MIN_VIEW_H, Math.min(VIEW_H, usedHeight + GAP * 2));
  const yScale = (v: number) => (v / VIEW_H) * viewH;
  const viewBox = `0 0 ${VIEW_W} ${viewH}`;

  // Reference radii for the size scale (recomputed against this dataset's max).
  const disclosedMax = deals
    .filter((d) => d.amount_disclosed && d.amount_value)
    .reduce((m, d) => Math.max(m, d.amount_value ?? 0), 0);
  const refFor = (amount: number) =>
    disclosedMax > 0
      ? MIN_R + Math.sqrt(amount / disclosedMax) * (MAX_R - MIN_R)
      : MIN_R;
  const sizeRefs = [
    { label: '$500M', amount: 500_000_000 },
    { label: '$5B', amount: 5_000_000_000 },
    { label: '$50B', amount: 50_000_000_000 },
  ];

  if (deals.length === 0) {
    return (
      <div className="empty-state" role="status">
        <p className="micro-label">No deals match the current filters</p>
        <p className="mx-auto mt-2 max-w-sm text-xs text-zinc-500">
          Adjust search, deal type, or evidence level to repopulate this view.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="relative">
        <svg
          viewBox={viewBox}
          role="img"
          aria-label="Bubble chart of disclosed deal sizes. Bubble area is proportional to dollars."
          className="h-auto w-full"
        >
          {bubbles.map(({ deal, cx, cy, r, disclosed }) => {
            const dimmed = hoveredId !== null && hoveredId !== deal.id;
            return (
              <Link key={deal.id} href={`/deals/${deal.slug}`} aria-label={`${deal.title} — ${formatCurrency(deal.amount_value, deal.amount_currency)}`}>
                <circle
                  cx={cx}
                  cy={cy}
                  r={r}
                  fill={disclosed ? dealTypeColor(deal.deal_type) : UNDISCLOSED_FILL}
                  fillOpacity={disclosed ? (dimmed ? 0.25 : 0.82) : dimmed ? 0.3 : 0.9}
                  stroke={disclosed ? dealTypeColor(deal.deal_type) : UNDISCLOSED_STROKE}
                  strokeWidth={hoveredId === deal.id ? 2.5 : 1}
                  strokeDasharray={disclosed ? undefined : '4 3'}
                  style={{ cursor: 'pointer', transition: 'fill-opacity 120ms' }}
                  onMouseEnter={() => setHoveredId(deal.id)}
                  onMouseLeave={() => setHoveredId((id) => (id === deal.id ? null : id))}
                  onFocus={() => setHoveredId(deal.id)}
                  onBlur={() => setHoveredId((id) => (id === deal.id ? null : id))}
                >
                  <title>{`${deal.title} — ${disclosed ? formatCurrency(deal.amount_value, deal.amount_currency) : 'Not disclosed'}`}</title>
                </circle>
              </Link>
            );
          })}
        </svg>

        {hovered && (
          /* Purely a visual amplifier of the bubble's own `aria-label` and
             `<title>`. `role="status"` here re-announced the whole card on
             every pointer move, so it is hidden from assistive tech instead. */
          <div
            aria-hidden="true"
            className="terminal-card terminal-ring pointer-events-none absolute z-10 max-w-[260px] p-3 text-[11px] leading-relaxed text-white"
            style={{
              left: `${Math.min(Math.max((hovered.cx / VIEW_W) * 100, 2), 72)}%`,
              top: `${Math.min(Math.max(yScale(hovered.cy) / viewH, 0.05), 0.9)}`,
              transform: 'translate(-8px, calc(-100% - 14px))',
            }}
          >
            <div className="text-xs font-bold leading-snug text-white">{hovered.deal.title}</div>
            <div className="num mt-1 font-semibold text-emerald-300">
              {hovered.disclosed
                ? formatCurrency(hovered.deal.amount_value, hovered.deal.amount_currency)
                : 'Not disclosed'}
            </div>
            <div className="mt-1 text-zinc-300">
              {(hovered.deal.parties ?? []).slice(0, 3).map((p) => p.company?.name).filter(Boolean).join(' · ') || '—'}
            </div>
            <div className="micro-label-terminal mt-1">
              {dealTypeLabel(hovered.deal.deal_type)} · {hovered.deal.evidence_level.replace(/_/g, ' ')}
            </div>
          </div>
        )}
      </div>

      {/* Legend: color by deal type + size scale */}
      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-zinc-100 pt-3 font-mono text-[11px] text-zinc-600">
        {presentTypes.map((t) => (
          <span key={t} className="inline-flex items-center gap-1.5">
            <span
              className="inline-block h-3 w-3 rounded-full ring-1 ring-inset ring-black/10"
              style={{ backgroundColor: dealTypeColor(t) }}
              aria-hidden="true"
            />
            {dealTypeLabel(t)}
          </span>
        ))}
        {undisclosedCount > 0 && (
          <span className="inline-flex items-center gap-1.5">
            <span
              className="inline-block h-3 w-3 rounded-full border border-dashed"
              style={{ backgroundColor: UNDISCLOSED_FILL, borderColor: UNDISCLOSED_STROKE }}
              aria-hidden="true"
            />
            Not disclosed ({undisclosedCount})
          </span>
        )}
      </div>
      <div className="mt-2.5 flex items-end gap-4 font-mono text-[10px] text-zinc-500">
        <span className="micro-label">Area ∝ $</span>
        {sizeRefs.map((s) => (
          <span key={s.label} className="inline-flex items-center gap-1.5">
            <svg width={refFor(s.amount) * 2 + 2} height={refFor(s.amount) * 2 + 2} aria-hidden="true">
              <circle
                cx={refFor(s.amount) + 1}
                cy={refFor(s.amount) + 1}
                r={Math.max(refFor(s.amount), 2)}
                fill="none"
                stroke="#a1a1aa"
                strokeWidth="1"
              />
            </svg>
            {s.label}
          </span>
        ))}
      </div>
    </div>
  );
}
