'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import type { Deal } from '@/lib/types';
import { formatCurrency } from '@/lib/formatters';
import { DEAL_TYPE_ORDER, UNDISCLOSED_FILL, UNDISCLOSED_STROKE, dealTypeColor, dealTypeLabel } from './chartTheme';
import { ChartLegendToggle, ChartTooltip, TooltipCard, chartHitProps, clampPct, pct } from './chartInteraction';

interface BubbleChartProps {
  deals: Deal[];
  /** Wire up hover/focus highlighting. Default true. */
  interactive?: boolean;
  /**
   * Cross-highlight from a parent filter (e.g. the /visualize deal-type chips):
   * bubbles of other types recede while this one is active. Pass `null`/`'all'`
   * for no emphasis.
   */
  activeType?: string | null;
  /** Clicking a legend entry delegates here. Omit to filter internally. */
  onTypeToggle?: (dealType: string | null) => void;
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

function shortDate(iso: string | null): string {
  if (!iso) return 'Date not disclosed';
  return iso.length >= 10 ? iso.slice(0, 10) : iso;
}

/**
 * Zero-dependency interactive packed bubble chart.
 * Radius scales with sqrt(amount) so bubble AREA is proportional to dollars.
 * Layout is a deterministic grid-scan pack (largest first), responsive via viewBox.
 *
 * Hover or keyboard-focus a bubble for a full record card (company, deal title,
 * amount, date, type); click or Enter opens the deal. Legend entries isolate a
 * deal type, and a parent filter can emphasise one type across the chart.
 */
export function BubbleChart({ deals, interactive = true, activeType = null, onTypeToggle }: BubbleChartProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [soloType, setSoloType] = useState<string | null>(null);

  // Uncontrolled when no parent callback is supplied (e.g. embedded elsewhere).
  const effectiveSolo = onTypeToggle ? (activeType === 'all' ? null : activeType) : soloType;
  const visible = useMemo(
    () => (effectiveSolo ? deals.filter((d) => d.deal_type === effectiveSolo) : deals),
    [deals, effectiveSolo]
  );

  const bubbles = useMemo<PlacedBubble[]>(() => {
    const disclosed = visible.filter((d) => d.amount_disclosed && d.amount_value && d.amount_value > 0);
    const maxAmount = disclosed.reduce((m, d) => Math.max(m, d.amount_value ?? 0), 0);

    const items = [...visible]
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
  }, [visible]);

  const hovered = hoveredId ? bubbles.find((b) => b.deal.id === hoveredId) ?? null : null;
  const presentTypes = useMemo(
    () => DEAL_TYPE_ORDER.filter((t) => deals.some((d) => d.deal_type === t)),
    [deals]
  );
  const undisclosedCount = deals.filter((d) => !d.amount_disclosed || !d.amount_value).length;
  const disclosedTotal = visible.reduce(
    (sum, d) => (d.amount_disclosed && d.amount_value ? sum + d.amount_value : sum),
    0
  );

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

  const toggleType = (t: string) => {
    if (onTypeToggle) onTypeToggle(effectiveSolo === t ? null : t);
    else setSoloType((cur) => (cur === t ? null : t));
  };

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
            const isHovered = hoveredId === deal.id;
            // Two independent recede reasons: another bubble is hovered, or a
            // parent filter is emphasising a different deal type.
            const dimmedByHover = hoveredId !== null && !isHovered;
            const dimmedByType = Boolean(activeType && activeType !== 'all' && deal.deal_type !== activeType);
            const dimmed = dimmedByHover || dimmedByType;
            return (
              <Link
                key={deal.id}
                href={`/deals/${deal.slug}`}
                className="chart-hit"
                data-dim={dimmed ? 'true' : undefined}
                {...chartHitProps<HTMLAnchorElement>({
                  label: `${deal.title} — ${
                    disclosed ? formatCurrency(deal.amount_value, deal.amount_currency) : 'Not disclosed'
                  }, ${dealTypeLabel(deal.deal_type)}, announced ${shortDate(deal.announcement_date)}`,
                  interactive: false,
                  focusable: false,
                  onEnter: () => interactive && setHoveredId(deal.id),
                  onLeave: () => setHoveredId((id) => (id === deal.id ? null : id)),
                })}
              >
                <circle
                  cx={cx}
                  cy={cy}
                  r={r}
                  fill={disclosed ? dealTypeColor(deal.deal_type) : UNDISCLOSED_FILL}
                  fillOpacity={disclosed ? (dimmed ? 0.25 : 0.82) : dimmed ? 0.3 : 0.9}
                  stroke={isHovered ? '#09090b' : disclosed ? dealTypeColor(deal.deal_type) : UNDISCLOSED_STROKE}
                  strokeWidth={isHovered ? 2.5 : 1}
                  strokeDasharray={disclosed ? undefined : '4 3'}
                  style={{
                    cursor: 'pointer',
                    // Area is the encoded value, so the hover lift is a scale
                    // about the bubble centre — never a size change that would
                    // misstate the amount.
                    transformBox: 'fill-box',
                    transformOrigin: 'center',
                    transform: isHovered ? 'scale(1.14)' : 'scale(1)',
                    transition: 'fill-opacity 140ms ease, transform 200ms cubic-bezier(0.22,1,0.36,1), stroke 140ms ease',
                  }}
                >
                  <title>{`${deal.title} — ${disclosed ? formatCurrency(deal.amount_value, deal.amount_currency) : 'Not disclosed'}`}</title>
                </circle>
              </Link>
            );
          })}
        </svg>

        {interactive && hovered && (
          <ChartTooltip
            x={clampPct((hovered.cx / VIEW_W) * 100, 4, 72)}
            y={(yScale(hovered.cy) / viewH) * 100}
            placement={yScale(hovered.cy) / viewH < 0.3 ? 'below' : 'above'}
          >
            <TooltipCard
              eyebrow={dealTypeLabel(hovered.deal.deal_type)}
              title={hovered.deal.title}
              accent={hovered.disclosed ? dealTypeColor(hovered.deal.deal_type) : UNDISCLOSED_STROKE}
              headline={
                hovered.disclosed
                  ? formatCurrency(hovered.deal.amount_value, hovered.deal.amount_currency)
                  : 'Not disclosed'
              }
              rows={[
                { label: 'Announced', value: shortDate(hovered.deal.announcement_date) },
                { label: 'Evidence', value: hovered.deal.evidence_level.replace(/_/g, ' ') },
                {
                  label: 'Parties',
                  value:
                    (hovered.deal.parties ?? [])
                      .slice(0, 3)
                      .map((p) => p.company?.name)
                      .filter(Boolean)
                      .join(' · ') || '—',
                },
              ]}
              footer="Select to open the deal record"
            />
          </ChartTooltip>
        )}
      </div>

      {/* Live readout — reserved height so the panel never jumps. */}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="chart-readout">
          {visible.length} bubble{visible.length === 1 ? '' : 's'}
          {effectiveSolo ? ` · ${dealTypeLabel(effectiveSolo)}` : ''}
        </span>
        <span className="chart-readout">{formatCurrency(disclosedTotal)} disclosed</span>
        {undisclosedCount > 0 && (
          <span className="chart-readout chart-readout-muted">{undisclosedCount} undisclosed</span>
        )}
        <span className="micro-label ml-auto hidden sm:inline">
          Hover or Tab a bubble · click a type to isolate it
        </span>
      </div>

      {/* Legend: click-to-filter by deal type, kept in sync with a parent filter */}
      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-zinc-100 pt-3 font-mono text-[11px] text-zinc-600">
        {presentTypes.map((t) => {
          const count = deals.filter((d) => d.deal_type === t).length;
          const solo = effectiveSolo === t;
          const emphasised = Boolean(activeType && activeType !== 'all' && activeType === t);
          return (
            <ChartLegendToggle
              key={t}
              label={dealTypeLabel(t)}
              color={dealTypeColor(t)}
              count={count}
              pressed={solo || emphasised}
              dimmed={Boolean(activeType && activeType !== 'all') && !emphasised}
              onToggle={interactive ? () => toggleType(t) : undefined}
            />
          );
        })}
        {undisclosedCount > 0 && (
          <span className="chart-legend-btn" data-dim={effectiveSolo ? 'true' : undefined}>
            <span
              className="inline-block h-2.5 w-2.5 rounded-full border border-dashed"
              style={{ backgroundColor: UNDISCLOSED_FILL, borderColor: UNDISCLOSED_STROKE }}
              aria-hidden="true"
            />
            Not disclosed ({undisclosedCount})
          </span>
        )}
        {effectiveSolo && (
          <button
            type="button"
            className="pill pill-neutral transition-colors hover:border-zinc-400 hover:text-zinc-900"
            onClick={() => (onTypeToggle ? onTypeToggle(null) : setSoloType(null))}
          >
            Show all types
          </button>
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
        <span className="ml-auto">
          {hovered && hovered.disclosed && disclosedMax > 0
            ? `${pct(hovered.deal.amount_value ?? 0, disclosedMax, 1)} of the largest disclosed deal`
            : 'Hover a bubble for its record'}
        </span>
      </div>
    </div>
  );
}