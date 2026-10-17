'use client';

import React from 'react';

/**
 * Shared interaction layer for every chart in the product.
 *
 * One dark terminal card, one set of hover/focus/keyboard semantics, one set
 * of primitives (see the CHART INTERACTION block in `globals.css`). Charts
 * compose these instead of hand-rolling their own `<title>`-only affordances,
 * so a node in the circular-flow diagram and a bar in the quarterly histogram
 * behave identically for pointer, keyboard and screen-reader users alike.
 *
 * Zero dependencies: React state + events + CSS transitions only.
 */

/* ------------------------------------------------------------------ *
 * Tooltip content primitives
 * ------------------------------------------------------------------ */

export type TooltipTone = 'neutral' | 'mint' | 'amber' | 'sky';

export interface TooltipRow {
  label: string;
  value: string;
  tone?: TooltipTone;
  /** Rendered as a link (`<a href>`) instead of plain text. */
  href?: string;
}

const TONE_TEXT: Record<TooltipTone, string> = {
  neutral: 'text-zinc-100',
  mint: 'text-emerald-300',
  amber: 'text-amber-300',
  sky: 'text-sky-300',
};

/** Accent bar on the leading edge of a tooltip card. */
export function TooltipAccent({ color }: { color?: string }) {
  if (!color) return null;
  return (
    <span
      aria-hidden="true"
      className="absolute left-0 top-2 h-[calc(100%-1rem)] w-[3px] rounded-full"
      style={{ backgroundColor: color, boxShadow: `0 0 12px -1px ${color}` }}
    />
  );
}

interface TooltipCardProps {
  title: string;
  /** Small uppercase mono kicker above the title. */
  eyebrow?: string;
  /** Accent colour for the leading edge (deal type, company type…). */
  accent?: string;
  /** Headline figure — the number the eye should land on first. */
  headline?: string;
  headlineTone?: TooltipTone;
  rows?: TooltipRow[];
  body?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * The single tooltip surface used across the visualisation layer. Dark
 * instrument glass, mono figures, phosphor-tinted key numbers.
 */
export function TooltipCard({
  title,
  eyebrow,
  accent,
  headline,
  headlineTone = 'mint',
  rows,
  body,
  footer,
  className,
  style,
}: TooltipCardProps) {
  return (
    <div className={`chart-card ${className ?? ''}`} style={style}>
      <TooltipAccent color={accent} />
      <div className="pl-1">
        {eyebrow && <div className="micro-label-terminal text-emerald-400/90">{eyebrow}</div>}
        <div className="mt-0.5 text-xs font-bold leading-snug text-white">{title}</div>
        {headline && (
          <div className={`num mt-1 text-sm font-bold leading-none ${TONE_TEXT[headlineTone]}`}>{headline}</div>
        )}
        {rows && rows.length > 0 && (
          <dl className="mt-2 space-y-1">
            {rows.map((row, i) => (
              <div key={`${row.label}-${i}`} className="flex items-baseline gap-3">
                <dt className="micro-label-terminal shrink-0 text-zinc-400">{row.label}</dt>
                <dd
                  className={`num ml-auto text-right font-semibold ${TONE_TEXT[row.tone ?? 'neutral']}`}
                >
                  {row.href ? (
                    <span className="underline decoration-white/25 underline-offset-2">{row.value}</span>
                  ) : (
                    row.value
                  )}
                </dd>
              </div>
            ))}
          </dl>
        )}
        {body}
        {footer && <div className="micro-label-terminal mt-2 text-zinc-400">{footer}</div>}
      </div>
    </div>
  );
}

interface ChartTooltipProps {
  /** 0–100, as a percentage of the positioned container. */
  x: number;
  y: number;
  /** Largest allowed `x` so a card near the right edge stays on screen. */
  maxX?: number;
  /** `below` for anchors near the top edge, so the card never covers them. */
  placement?: 'above' | 'below';
  children: React.ReactNode;
  className?: string;
}

/**
 * Positions a `TooltipCard` inside a `position: relative` wrapper. The card
 * sits above-left of the anchor (or below-left when flipped) using the same
 * offsets everywhere, so the CSS rise-in keyframes stay one shared animation.
 */
export function ChartTooltip({
  x,
  y,
  maxX = 74,
  placement = 'above',
  children,
  className,
}: ChartTooltipProps) {
  const left = Math.min(Math.max(x, 3), maxX);
  const top = placement === 'below' ? Math.min(Math.max(y, 2), 74) : Math.min(Math.max(y, 20), 94);
  return (
    <div
      className={`chart-tooltip ${className ?? ''}`}
      data-placement={placement}
      style={{
        left: `${left}%`,
        top: `${top}%`,
        transform: placement === 'below' ? 'translate(-8px, 12px)' : 'translate(-8px, calc(-100% - 12px))',
      }}
    >
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Keyboard / pointer parity
 * ------------------------------------------------------------------ */

export type ChartHitProps<E extends HTMLElement | SVGElement = HTMLElement> = React.HTMLAttributes<E> &
  React.SVGAttributes<E> & {
    role?: string;
    tabIndex?: number;
    'aria-label'?: string;
  };

/**
 * Builds the hover + focus + keyboard contract for one data point.
 *
 * `interactive: true` (the default) makes the point a real control:
 * role=button, tab stop, Enter/Space + click activation via `onActivate`.
 *
 * `interactive: false` keeps the hover/focus highlight but leaves navigation to
 * whatever is underneath (a `<Link>`, an SVG `<a>`), so we never shadow a
 * browser-native Enter/Space behaviour with a synthetic one. Pass
 * `focusable: true` when that underlying element is not natively focusable —
 * e.g. a donut slice, which carries information but has no action of its own.
 */
export function chartHitProps<E extends HTMLElement | SVGElement = HTMLElement>(opts: {
  label: string;
  interactive?: boolean;
  focusable?: boolean;
  onEnter?: () => void;
  onLeave?: () => void;
  /** Click / Enter / Space. */
  onActivate?: () => void;
}): ChartHitProps<E> {
  const { label, interactive = true, focusable = false, onEnter, onLeave, onActivate } = opts;
  if (!interactive) {
    return {
      'aria-label': label,
      ...(focusable ? { role: 'img', tabIndex: 0 } : null),
      onMouseEnter: onEnter,
      onMouseLeave: onLeave,
      onFocus: onEnter,
      onBlur: onLeave,
    } as ChartHitProps<E>;
  }
  return {
    role: 'button',
    tabIndex: 0,
    'aria-label': label,
    onMouseEnter: onEnter,
    onMouseLeave: onLeave,
    onFocus: onEnter,
    onBlur: onLeave,
    onClick: onActivate,
    onKeyDown: (ev: React.KeyboardEvent<E>) => {
      if (ev.key === 'Enter' || ev.key === ' ' || ev.key === 'Spacebar') {
        ev.preventDefault();
        onActivate?.();
      }
    },
  } as ChartHitProps<E>;
}

/* ------------------------------------------------------------------ *
 * Shared visual bits
 * ------------------------------------------------------------------ */

/** Coloured dot used by interactive legends and tooltips. */
export function ChartDot({ color, size = 10 }: { color: string; size?: number }) {
  return (
    <span
      aria-hidden="true"
      className="inline-block shrink-0 rounded-full ring-1 ring-inset ring-black/10"
      style={{ backgroundColor: color, width: size, height: size }}
    />
  );
}

/**
 * Inline readout that swaps a static caption for the hovered/focused value.
 * `muted` renders the placeholder state so the row never jumps height.
 */
export function ChartReadout({
  children,
  muted = false,
  className = '',
}: {
  children: React.ReactNode;
  muted?: boolean;
  className?: string;
}) {
  return (
    <span className={`chart-readout ${muted ? 'chart-readout-muted' : ''} ${className}`.trim()}>
      {children}
    </span>
  );
}

/**
 * Legend entry that toggles a filter. Renders a `<button>` with
 * `aria-pressed` so the on/off state is announced, never implied by colour.
 */
export function ChartLegendToggle({
  label,
  color,
  pressed,
  dimmed,
  count,
  onToggle,
}: {
  label: string;
  color?: string;
  pressed?: boolean;
  dimmed?: boolean;
  count?: number | string;
  onToggle?: () => void;
}) {
  const inner = (
    <>
      {color && <ChartDot color={color} />}
      <span className="truncate">{label}</span>
      {count !== undefined && <span className="num opacity-70">{count}</span>}
    </>
  );
  if (!onToggle) {
    return (
      <span className="chart-legend-btn" data-dim={dimmed ? 'true' : undefined}>
        {inner}
      </span>
    );
  }
  return (
    <button
      type="button"
      className="chart-legend-btn"
      aria-pressed={pressed ? 'true' : 'false'}
      data-dim={dimmed ? 'true' : undefined}
      aria-label={`${label}${pressed ? ', filter active' : ''}`}
      onClick={onToggle}
    >
      {inner}
    </button>
  );
}

/** Percentage helper for legends and tooltips (guarded against 0/0). */
export function pct(part: number, whole: number, digits = 0): string {
  if (!whole) return '0%';
  return `${((part / whole) * 100).toFixed(digits)}%`;
}

/** Clamp helper for tooltip positioning inside a responsive wrapper. */
export function clampPct(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}