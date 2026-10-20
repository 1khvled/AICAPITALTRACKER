"use client";

import React, { useState, useMemo, useRef, useEffect, useCallback, useId } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  LayoutGrid,
  CircleDot,
  Calendar,
  Sparkles,
  X,
  Maximize2,
  ExternalLink,
  ShieldAlert,
  Layers,
  ArrowRight,
  TrendingUp,
  Play,
  Pause,
  RotateCcw,
  Hand,
  Atom,
  Move,
} from "lucide-react";
import { evaluateBubbleModel, DEFAULT_MODEL_INPUTS } from "@/lib/model/engine";
import { useInView, usePrefersReducedMotion } from "@/components/Reveal";
import {
  getChartAriaProps,
  generateChartDescription,
  ChartDataTable,
  ChartAnnouncer,
} from "@/lib/chart-a11y";

export interface Deal {
  id: string;
  title: string;
  category: string;
  status: string;
  source_type: string;
  amount_display: string;
  amount_usd: number;
  announced_date: string;
  sources_count: number;
  description: string;
  year: number;
  is_debt: boolean;
  is_compute: boolean;
  is_circular: boolean;
  is_mega: boolean;
}

export interface DealRiskProfile {
  riskScorePct: number;
  riskBand: "Critical" | "High" | "Elevated" | "Guarded";
  riskImpactDisplay: string;
  contagionWeight: string;
}

export function computeDealBubbleRisk(deal: Deal): DealRiskProfile {
  // Deterministic empirical risk mapping linked to model factor channels
  let score = 35; // base level
  if (deal.is_debt) score += 30; // Debt reliance & insolvency risk
  if (deal.is_circular) score += 18; // Circular counterparty flow
  if (deal.is_compute) score += 12; // Capex hardware amortization drag
  if (deal.is_mega) score += 10; // Systemic megadeal contagion (>=$10B)

  // Scale by capital magnitude
  if (deal.amount_usd >= 40_000_000_000) score += 14;
  else if (deal.amount_usd >= 10_000_000_000) score += 8;
  else if (deal.amount_usd >= 1_000_000_000) score += 4;

  if (deal.category === "Borrowed") score += 8;
  else if (deal.category === "Big construction") score += 5;

  const clamped = Math.min(96, Math.max(16, score));
  let band: "Critical" | "High" | "Elevated" | "Guarded" = "Guarded";
  if (clamped >= 80) band = "Critical";
  else if (clamped >= 65) band = "High";
  else if (clamped >= 45) band = "Elevated";

  const impactVal = ((clamped / 100) * 2.5).toFixed(1);
  return {
    riskScorePct: clamped,
    riskBand: band,
    riskImpactDisplay: `+${impactVal}% systemic stress`,
    contagionWeight: deal.is_debt
      ? "Debt Solvency"
      : deal.is_circular
      ? "Circular Flow"
      : deal.is_compute
      ? "Hardware Capex"
      : "Equity Multiples",
  };
}

interface DealBubbleChartProps {
  deals: Deal[];
  onSelectDeal: (deal: Deal) => void;
}

export type ViewMode = "treemap" | "bubbles" | "arena" | "timeline";

/**
 * Category colours.
 *
 * 2026-10-19 (design pass): the palette was a rainbow of arbitrary hexes —
 * including a violet and a cyan, both of which the site design system
 * forbids — rendered through radial gradients with a drop-shadow "glow".
 * Colour now means something: the two red steps are borrowed money and the
 * build-out, the amber is power and land, the green is money coming back in
 * through sales, and the four graphite steps are the rest. Every fill is a
 * flat token colour with white text at AA or better, and depth comes from
 * elevation, not from a gradient.
 */
export const CATEGORY_CONFIG: Record<
  string,
  {
    name: string;
    pillBg: string;
    border: string;
    tileBg: string;
    tileBgHover: string;
    badgeBg: string;
    textColor: string;
    accentHex: string;
  }
> = {
  "Borrowed": {
    name: "Debt & Facilities",
    pillBg: "chip chip-risk",
    border: "border-risk-200",
    tileBg: "bg-risk-50",
    tileBgHover: "",
    badgeBg: "bg-risk-500",
    textColor: "text-risk-700",
    accentHex: "#D1433C", // risk-500
  },
  "Bets & rounds": {
    name: "Equity & Strategic Bets",
    pillBg: "chip",
    border: "border-rule",
    tileBg: "bg-surface-2",
    tileBgHover: "",
    badgeBg: "bg-surface-3",
    textColor: "text-ink-muted",
    accentHex: "#4A525C", // ink-muted
  },
  "Compute contracts": {
    name: "Compute & Cloud Clusters",
    pillBg: "chip",
    border: "border-rule",
    tileBg: "bg-surface-2",
    tileBgHover: "",
    badgeBg: "bg-surface-3",
    textColor: "text-ink-muted",
    accentHex: "#646C76", // ink-faint
  },
  "Power & land": {
    name: "Power & Clean Energy",
    pillBg: "chip chip-caution",
    border: "border-caution-200",
    tileBg: "bg-caution-50",
    tileBgHover: "",
    badgeBg: "bg-caution-500",
    textColor: "text-caution-700",
    accentHex: "#966A08", // caution-600
  },
  "Buyouts & mergers": {
    name: "M&A & Buyouts",
    pillBg: "chip",
    border: "border-rule",
    tileBg: "bg-surface-2",
    tileBgHover: "",
    badgeBg: "bg-surface-3",
    textColor: "text-ink-muted",
    /* Was #0C0E11, which is 2/255 from the dark canvas (10 11 13): the 19 M&A
       tiles — including the largest deals on the page — read as holes in the
       treemap and as empty outlines in the bubble pods. A mid neutral keeps
       the category in the ink ramp and visible in both themes. */
    accentHex: "#8A929C", // ink, one step lighter than ink-subtle
  },
  "Big construction": {
    name: "Hyperscale Capex",
    pillBg: "chip chip-caution",
    border: "border-caution-200",
    tileBg: "bg-caution-50",
    tileBgHover: "",
    badgeBg: "bg-caution-500",
    textColor: "text-caution-700",
    accentHex: "#94271F", // risk-700
  },
  "Share sales": {
    name: "Secondary Share Sales",
    pillBg: "chip chip-safe",
    border: "border-safe-200",
    tileBg: "bg-safe-50",
    tileBgHover: "",
    badgeBg: "bg-safe-500",
    textColor: "text-safe-700",
    accentHex: "#0A6648", // safe-700
  },
  "Other": {
    name: "Ecosystem Deals",
    pillBg: "bg-surface-2 text-ink-muted border-rule",
    border: "border-rule",
    tileBg: "bg-surface-2",
    tileBgHover: "",
    badgeBg: "bg-ink",
    textColor: "text-ink-muted",
    accentHex: "#545C66", // ink-subtle
  },
};

/* ── The chart's own numbers ──────────────────────────────────────────────────
 *
 * Everything below reads the SAME data the marks are drawn from, so the
 * description, the data table and the picture can never disagree.
 */

/**
 * The number of disclosed dollars a treemap tile is worth.
 *
 * A deal with no disclosed amount is given a floor of $100M so it still gets
 * a visible tile. The area of a tile IS this number, so the description and
 * the data table have to quote it too — otherwise the table would claim a
 * different figure from the one on screen.
 */
function treemapValue(deal: Deal): number {
  return deal.amount_usd > 0 ? deal.amount_usd : 100e6;
}

/** The number of bubbles the gravity arena draws. */
const ARENA_MAX_DEALS = 42;

/** The id of the gravity arena's single series, for the keyboard model. */
const ARENA_SERIES_ID = "arena";

/** The largest deals the gravity arena draws — the same slice, every time. */
function selectArenaDeals(deals: Deal[]): Deal[] {
  return [...deals]
    .sort((a, b) => b.amount_usd - a.amount_usd)
    .slice(0, ARENA_MAX_DEALS);
}

/**
 * The most marks the keyboard model will ever expose.
 *
 * A chart with hundreds of points is a table, not a maze: walking 169
 * bubbles with the arrow keys is not a journey, it is a chore. So the
 * keyboard model stops at the 40 largest marks of the current view and the
 * data table underneath carries every single one of them.
 */
const KEYBOARD_MARK_CAP = 40;

/** The human name of a category — the label the chart's colour key uses. */
function categoryName(category: string): string {
  return CATEGORY_CONFIG[category]?.name ?? category;
}

/** $38.0B, $250M, $1.2B. */
function formatUsd(value: number): string {
  if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
  if (value >= 1e9) return `$${(value / 1e9).toFixed(1)}B`;
  if (value >= 1e6) return `$${Math.round(value / 1e6)}M`;
  return `$${Math.round(value)}`;
}

/**
 * Fit a treemap tile label into the width the tile actually has.
 *
 * The tile used to cut the string at a fixed character count, so
 * "SoftBank $100 Billion ..." was drawn as "SoftBank $100 Bil" — mid-word, with
 * no ellipsis, which reads as data rather than as a shortened label. This cuts
 * between words and always marks the cut. Width is estimated in viewBox units
 * (the SVG is 1000 units wide and the label is drawn at 13-15 units); an empty
 * string means "no room for a label", and the caller skips the text node.
 */
function fitTileLabel(text: string, maxWidth: number, fontSize: number): string {
  const charWidth = fontSize * 0.62;
  const maxChars = Math.floor(maxWidth / charWidth);
  if (maxChars <= 0) return "";
  if (text.length <= maxChars) return text;
  const cut = text.slice(0, Math.max(0, maxChars - 1));
  const lastSpace = cut.lastIndexOf(" ");
  const stem = lastSpace > 3 ? cut.slice(0, lastSpace) : cut;
  return `${stem.trimEnd()}…`;
}

/**
 * The accessible name of one mark.
 *
 * It carries what the mark shows (title, amount, date), what its colour
 * means (the sector) and what the number printed on the big bubbles means
 * (the modelled bubble exposure), then says what Enter does.
 */
function dealMarkLabel(deal: Deal, sector: string): string {
  const risk = computeDealBubbleRisk(deal);
  return `${deal.title}, ${deal.amount_display}, announced ${deal.announced_date}. ${sector}. Bubble exposure ${risk.riskScorePct}%, ${risk.riskBand}. Press Enter to open in the ledger.`;
}

/* ── The two-mode keyboard model ─────────────────────────────────────────────
 *
 * Browse mode: the <svg> is ONE tab stop and reads as a single image with a
 * title and a description. Nothing inside it is in the accessibility tree.
 *
 * Data mode: the reader presses Enter or Space on the chart and the <svg>
 * becomes a group. The marks are symbols now and the arrow keys walk them —
 * Left and Right along a series, Up and Down between series, Home and End
 * to the first and last, Escape back to the image.
 */
interface NavMark {
  /** The id of the mark (the deal id). */
  id: string;
  /** The value the mark is drawn with — the amount, in dollars. */
  value: number;
}

interface NavSeries {
  /** The id of the series (a category, a pod, the arena). */
  id: string;
  /** The marks of the series, in the order they are drawn. */
  marks: NavMark[];
}

interface ChartNav {
  /** True while the reader is walking the marks. */
  dataMode: boolean;
  /** The series the reader is in, if any. */
  activeSeriesId: string | null;
  /** The mark the reader is on, if any. */
  activeMarkId: string | null;
  /** True when the mark is part of the keyboard model. */
  isFocusable: (id: string) => boolean;
  /** Register a mark element (for focus). */
  registerMark: (id: string, el: SVGGElement | null) => void;
  /** Register the <svg> that owns a series (for Escape). */
  registerSeries: (id: string, el: SVGSVGElement | null) => void;
  /** Key handling for the <svg> in browse mode. */
  onChartKeyDown: (e: React.KeyboardEvent<SVGSVGElement>, seriesId?: string) => void;
  /** Key handling for a mark in data mode. */
  onMarkKeyDown: (e: React.KeyboardEvent<SVGGElement>, markId: string) => void;
  /** Leaving the chart returns it to browse mode (one image again). */
  onChartBlur: (e: React.FocusEvent<HTMLElement>) => void;
}

function useChartNav(
  series: NavSeries[],
  onActivate: (markId: string) => void
): ChartNav {
  const markRefs = useRef(new Map<string, SVGGElement>());
  const seriesRefs = useRef(new Map<string, SVGSVGElement>());
  const lastActive = useRef(new Map<string, string>());
  const [active, setActive] = useState<{ seriesId: string; markId: string } | null>(null);

  // The callbacks below are stable, so they read the series through a ref.
  const seriesRef = useRef(series);
  seriesRef.current = series;

  const focusableIds = useMemo(() => {
    const ids = new Set<string>();
    for (const s of series) for (const m of s.marks) ids.add(m.id);
    return ids;
  }, [series]);

  // A new set of marks means the old focus is gone: start over.
  useEffect(() => {
    setActive(null);
  }, [series]);

  // Remember the last mark of each series, so stepping away and back lands
  // where the reader left off.
  useEffect(() => {
    if (!active) return;
    lastActive.current.set(active.seriesId, active.markId);
  }, [active]);

  // Move the real DOM focus onto the active mark. This is what puts the
  // focus ring on the bubble (globals.css draws it on :focus-visible).
  useEffect(() => {
    if (!active) return;
    const el = markRefs.current.get(active.markId);
    if (el && typeof el.focus === "function" && document.activeElement !== el) {
      el.focus();
    }
  }, [active]);

  const enterDataMode = useCallback((seriesId: string, index: number) => {
    const target = seriesRef.current.find((s) => s.id === seriesId);
    if (!target || target.marks.length === 0) return;
    const clamped = Math.min(Math.max(index, 0), target.marks.length - 1);
    setActive({ seriesId, markId: target.marks[clamped].id });
  }, []);

  const moveSeries = useCallback((fromSeriesId: string, delta: number) => {
    const list = seriesRef.current;
    const count = list.length;
    if (count === 0) return;
    const from = list.findIndex((s) => s.id === fromSeriesId);
    if (from < 0) return;
    // Skip past a series that carries no marks of its own.
    for (let step = 1; step <= count; step += 1) {
      const index = (((from + delta * step) % count) + count) % count;
      const candidate = list[index];
      if (!candidate || candidate.marks.length === 0) continue;
      const markId = lastActive.current.get(candidate.id) ?? candidate.marks[0].id;
      setActive({ seriesId: candidate.id, markId });
      return;
    }
  }, []);

  const registerMark = useCallback((id: string, el: SVGGElement | null) => {
    if (el) markRefs.current.set(id, el);
    else markRefs.current.delete(id);
  }, []);

  const registerSeries = useCallback((id: string, el: SVGSVGElement | null) => {
    if (el) seriesRefs.current.set(id, el);
    else seriesRefs.current.delete(id);
  }, []);

  const onChartKeyDown = useCallback(
    (e: React.KeyboardEvent<SVGSVGElement>, seriesId?: string) => {
      const list = seriesRef.current;
      if (list.length === 0) return;
      const target = seriesId ? list.find((s) => s.id === seriesId) : list[0];
      if (!target || target.marks.length === 0) return;

      switch (e.key) {
        case "Enter":
        case " ":
          e.preventDefault();
          enterDataMode(target.id, 0);
          break;
        case "ArrowRight":
          e.preventDefault();
          enterDataMode(target.id, 0);
          break;
        case "ArrowLeft":
          e.preventDefault();
          enterDataMode(target.id, target.marks.length - 1);
          break;
        case "Home":
          e.preventDefault();
          enterDataMode(target.id, 0);
          break;
        case "End":
          e.preventDefault();
          enterDataMode(target.id, target.marks.length - 1);
          break;
        case "ArrowUp":
          e.preventDefault();
          moveSeries(target.id, -1);
          break;
        case "ArrowDown":
          e.preventDefault();
          moveSeries(target.id, 1);
          break;
        default:
          break;
      }
    },
    [enterDataMode, moveSeries]
  );

  const onMarkKeyDown = useCallback(
    (e: React.KeyboardEvent<SVGGElement>, markId: string) => {
      const owner = seriesRef.current.find((s) => s.marks.some((m) => m.id === markId));
      if (!owner || owner.marks.length === 0) return;
      const index = owner.marks.findIndex((m) => m.id === markId);
      if (index < 0) return;

      switch (e.key) {
        case "Enter":
        case " ":
          e.preventDefault();
          onActivate(markId);
          break;
        case "ArrowRight":
          e.preventDefault();
          setActive({
            seriesId: owner.id,
            markId: owner.marks[(index + 1) % owner.marks.length].id,
          });
          break;
        case "ArrowLeft":
          e.preventDefault();
          setActive({
            seriesId: owner.id,
            markId: owner.marks[(index - 1 + owner.marks.length) % owner.marks.length].id,
          });
          break;
        case "Home":
          e.preventDefault();
          setActive({ seriesId: owner.id, markId: owner.marks[0].id });
          break;
        case "End":
          e.preventDefault();
          setActive({ seriesId: owner.id, markId: owner.marks[owner.marks.length - 1].id });
          break;
        case "ArrowUp":
          e.preventDefault();
          moveSeries(owner.id, -1);
          break;
        case "ArrowDown":
          e.preventDefault();
          moveSeries(owner.id, 1);
          break;
        case "Escape":
          e.preventDefault();
          e.stopPropagation();
          setActive(null);
          seriesRefs.current.get(owner.id)?.focus();
          break;
        default:
          break;
      }
    },
    [moveSeries, onActivate]
  );

  /**
   * Leaving the chart returns it to browse mode — one image again.
   *
   * This is wired to the chart's ROOT, not to each <svg>: stepping from one
   * pod to the next is still inside the chart, and must not throw the reader
   * out of data mode.
   */
  const onChartBlur = useCallback((e: React.FocusEvent<HTMLElement>) => {
    // A null relatedTarget means the browser will not say where the focus
    // went, so we leave the mode alone rather than risk throwing the reader
    // out of it.
    const next = e.relatedTarget as Node | null;
    if (next && !e.currentTarget.contains(next)) setActive(null);
  }, []);

  return {
    dataMode: active !== null,
    activeSeriesId: active?.seriesId ?? null,
    activeMarkId: active?.markId ?? null,
    isFocusable: (id: string) => focusableIds.has(id),
    registerMark,
    registerSeries,
    onChartKeyDown,
    onMarkKeyDown,
    onChartBlur,
  };
}

function getSvgPoint(
  e: React.PointerEvent<SVGSVGElement>,
  svg: SVGSVGElement,
  viewBoxW = 300,
  viewBoxH = 190
) {
  const pt = svg.createSVGPoint();
  pt.x = e.clientX;
  pt.y = e.clientY;
  const ctm = svg.getScreenCTM();
  if (ctm) {
    const transformed = pt.matrixTransform(ctm.inverse());
    return { x: transformed.x, y: transformed.y };
  }
  const rect = svg.getBoundingClientRect();
  return {
    x: ((e.clientX - rect.left) / (rect.width || 1)) * viewBoxW,
    y: ((e.clientY - rect.top) / (rect.height || 1)) * viewBoxH,
  };
}

interface TreemapTile {
  deal: Deal;
  x: number;
  y: number;
  w: number;
  h: number;
  category: string;
}

interface PodBubbleNode {
  deal: Deal;
  r: number;
  x: number;
  y: number;
  origX: number;
  origY: number;
}

// ── 1. Interactive Category Bubble Pod with Draggable Physics ──────────────────
interface InteractiveBubblePodProps {
  pod: {
    categoryKey: string;
    config: (typeof CATEGORY_CONFIG)[string];
    deals: Deal[];
    totalUsd: number;
    bubbles: Array<{ deal: Deal; r: number; x: number; y: number }>;
  };
  onSelectDeal: (deal: Deal) => void;
  /** Opens the deal in the ledger, pre-filtered (see DealBubbleChart). */
  onOpenInLedger: (deal: Deal) => void;
  hoveredDeal: Deal | null;
  setHoveredDeal: (deal: Deal | null) => void;
  searchQuery: string;
  matchesSearch: (deal: Deal) => boolean;
  isDriftEnabled: boolean;
  resetCounter: number;
  /** The page-wide two-mode keyboard model. */
  nav: ChartNav;
}

function InteractiveBubblePod({
  pod,
  onSelectDeal,
  onOpenInLedger,
  hoveredDeal,
  setHoveredDeal,
  searchQuery,
  matchesSearch,
  isDriftEnabled,
  resetCounter,
  nav,
}: InteractiveBubblePodProps) {
  const [nodes, setNodes] = useState<PodBubbleNode[]>(() =>
    pod.bubbles.map((b) => ({
      ...b,
      origX: b.x,
      origY: b.y,
    }))
  );

  const [draggingId, setDraggingId] = useState<string | null>(null);
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const startClientPosRef = useRef({ x: 0, y: 0 });
  const hasMovedRef = useRef(false);
  const svgRef = useRef<SVGSVGElement | null>(null);

  /**
   * 2026-10-19 (design pass): the pod reveals once, when it scrolls into
   * view — the bubbles pop in by rank (largest first) and then hold still.
   * The hover/focus readout is a plain card; the node itself carries the
   * scale and the elevation.
   */
  const podRef = useRef<HTMLDivElement | null>(null);
  const inView = useInView(podRef);
  const [tip, setTip] = useState<{ deal: Deal; x: number; y: number } | null>(null);

  const showTip = (deal: Deal, x: number, y: number) =>
    setTip({ deal, x: (x / 300) * 100, y: (y / 190) * 100 });
  const hideTip = () => setTip(null);

  /* ── The chart's accessible identity ──────────────────────────────────────
   *
   * The pod is one image to a screen reader: a title, a description derived
   * from the bubbles it draws, and a single tab stop. The bubbles that take
   * part in the keyboard model become symbols while the reader walks them;
   * the rest stay out of the accessibility tree and are carried by the data
   * table under the chart.
   */
  const chartUid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const chartTitleId = `${chartUid}-title`;
  const chartDescId = `${chartUid}-desc`;
  const chartTitle = `the ${pod.config.name} bubble pod`;

  const chartDescription = useMemo(
    () =>
      generateChartDescription({
        title: chartTitle,
        kind: "scatter",
        points: pod.bubbles.map((b) => ({
          x: b.deal.title,
          y: b.deal.amount_usd,
        })),
        formatValue: (value) => (value > 0 ? formatUsd(value) : "amount not disclosed"),
      }),
    [chartTitle, pod.bubbles]
  );

  const chartAria = getChartAriaProps({
    title: chartTitle,
    description: chartDescription,
    labelledBy: chartTitleId,
    describedBy: chartDescId,
    role: nav.activeSeriesId === pod.categoryKey ? "graphics-document" : "img",
  });

  const setSvgRef = useCallback(
    (el: SVGSVGElement | null) => {
      svgRef.current = el;
      nav.registerSeries(pod.categoryKey, el);
    },
    [nav, pod.categoryKey]
  );

  // Sync state whenever underlying deals, layout, or reset counter changes
  useEffect(() => {
    setNodes(
      pod.bubbles.map((b) => ({
        ...b,
        origX: b.x,
        origY: b.y,
      }))
    );
    setDraggingId(null);
  }, [pod.bubbles, resetCounter]);

  const handlePointerDown = (
    e: React.PointerEvent<SVGGElement>,
    node: PodBubbleNode
  ) => {
    e.stopPropagation();
    try {
      (e.currentTarget as Element).setPointerCapture(e.pointerId);
    } catch {
      // Fallback if pointer capture is not supported
    }

    const svg = svgRef.current;
    if (!svg) return;

    const pt = getSvgPoint(e as unknown as React.PointerEvent<SVGSVGElement>, svg, 300, 190);
    dragOffsetRef.current = { x: pt.x - node.x, y: pt.y - node.y };
    startClientPosRef.current = { x: e.clientX, y: e.clientY };
    hasMovedRef.current = false;
    setDraggingId(node.deal.id);
  };

  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!draggingId) return;

    const dist = Math.hypot(
      e.clientX - startClientPosRef.current.x,
      e.clientY - startClientPosRef.current.y
    );
    if (dist > 3) {
      hasMovedRef.current = true;
    }

    const svg = svgRef.current;
    if (!svg) return;

    const pt = getSvgPoint(e, svg, 300, 190);
    const targetX = pt.x - dragOffsetRef.current.x;
    const targetY = pt.y - dragOffsetRef.current.y;

    setNodes((prev) => {
      const next = prev.map((n) => ({ ...n }));
      const dragged = next.find((n) => n.deal.id === draggingId);
      if (!dragged) return prev;

      // Constrain dragged bubble within pod boundary
      dragged.x = Math.max(dragged.r + 4, Math.min(300 - dragged.r - 4, targetX));
      dragged.y = Math.max(dragged.r + 4, Math.min(190 - dragged.r - 4, targetY));

      // Elastic repulsive collision against neighboring bubbles
      for (let i = 0; i < next.length; i++) {
        if (next[i].deal.id === draggingId) continue;
        const other = next[i];
        const dx = other.x - dragged.x;
        const dy = other.y - dragged.y;
        const d = Math.hypot(dx, dy) || 0.1;
        const minDist = dragged.r + other.r + 4;

        if (d < minDist) {
          const overlap = minDist - d;
          const nx = dx / d;
          const ny = dy / d;
          other.x = Math.max(other.r + 4, Math.min(300 - other.r - 4, other.x + nx * overlap * 0.8));
          other.y = Math.max(other.r + 4, Math.min(190 - other.r - 4, other.y + ny * overlap * 0.8));
        }
      }

      return next;
    });
  };

  const handlePointerUp = (
    e: React.PointerEvent<SVGGElement>,
    node: PodBubbleNode
  ) => {
    if (draggingId === node.deal.id) {
      try {
        (e.currentTarget as Element).releasePointerCapture(e.pointerId);
      } catch {
        // Fallback
      }
      if (!hasMovedRef.current) {
        // A tap (not a drag) opens the deal in the ledger, pre-filtered.
        onOpenInLedger(node.deal);
      }
      setDraggingId(null);
    }
  };

  const handleResetPod = () => {
    setNodes((prev) =>
      prev.map((n) => ({
        ...n,
        x: n.origX,
        y: n.origY,
      }))
    );
  };

  return (
    <div ref={podRef} className="panel space-y-3 transition-colors hover:border-rule-strong">
      <div className="flex items-center justify-between pb-2 border-b border-rule">
        <div className="flex items-center space-x-2">
          <span
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: pod.config.accentHex }}
            aria-hidden="true"
          />
          <span className="text-sm font-semibold text-ink">
            {pod.config.name}
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="text-right font-mono text-[14px] sm:text-sm">
            <span className="num text-ink font-semibold">
              ${(pod.totalUsd / 1e9).toFixed(1)}B
            </span>
            <span className="text-ink-subtle ml-1 font-medium text-[14px]">
              ({pod.deals.length})
            </span>
          </div>
          <button
            onClick={handleResetPod}
            title="Reset positions in this pod"
            className="flex h-11 w-11 items-center justify-center rounded-lg text-ink-subtle transition-colors hover:bg-surface-2 hover:text-ink"
          >
            <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className="relative">
        <svg
          ref={setSvgRef}
          viewBox="0 0 300 190"
          className="block h-auto w-full cursor-grab touch-none select-none rounded-lg bg-surface-2 active:cursor-grabbing focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
          style={{ minHeight: "170px" }}
          onPointerMove={handlePointerMove}
          tabIndex={0}
          {...chartAria}
          onKeyDown={(e) => nav.onChartKeyDown(e, pod.categoryKey)}
        >
          <title id={chartTitleId}>{chartTitle}</title>
          <desc id={chartDescId}>
            {chartDescription} Press Enter or Space to step through the bubbles with the arrow
            keys; Escape returns to the chart.
          </desc>
          <defs>
            {/* No gradients, no glow filter: a flat token fill, a hairline
                cut-out against the panel, and elevation from CSS on
                hover/focus. Depth is carried by the surface, not by paint. */}
          </defs>

          {nodes.map((b, idx) => {
            const isHovered = hoveredDeal?.id === b.deal.id;
            const isBeingDragged = draggingId === b.deal.id;
            const matched = matchesSearch(b.deal);
            const opacity = searchQuery.trim() && !matched ? 0.15 : 0.95;
            /* Is this bubble part of the keyboard model? The cap is applied
               by the parent, so there is one answer for the whole chart. */
            const isKeyboardMark = nav.isFocusable(b.deal.id);

            // Fluid sinusoidal floating keyframes when idle
            const floatClass =
              isDriftEnabled && !isBeingDragged
                ? idx % 3 === 0
                  ? "animate-float-1"
                  : idx % 3 === 1
                  ? "animate-float-2"
                  : "animate-float-3"
                : "";

            return (
              <g
                key={b.deal.id}
                ref={(el) => nav.registerMark(b.deal.id, el)}
                className={`bubble-node bubble-pop cursor-grab active:cursor-grabbing${
                  inView ? " bubble-pop-live" : ""
                }`}
                style={{
                  opacity: isHovered || isBeingDragged ? 1 : opacity,
                  animationDelay: `${Math.min(idx, 12) * 24}ms`,
                }}
                /* Roving tabindex: the pod's <svg> is the one tab stop, and
                   only the marks inside the keyboard model are reachable.
                   The rest are hidden from assistive technology and carried by
                   the data table under the chart. */
                tabIndex={isKeyboardMark ? -1 : undefined}
                role={isKeyboardMark ? "graphics-symbol" : undefined}
                aria-label={isKeyboardMark ? dealMarkLabel(b.deal, pod.config.name) : undefined}
                aria-hidden={isKeyboardMark ? undefined : true}
                onKeyDown={(e) => nav.onMarkKeyDown(e, b.deal.id)}
                onPointerDown={(e) => handlePointerDown(e, b)}
                onPointerUp={(e) => handlePointerUp(e, b)}
                onMouseEnter={() => {
                  setHoveredDeal(b.deal);
                  showTip(b.deal, b.x, b.y);
                }}
                onMouseLeave={() => {
                  setHoveredDeal(null);
                  hideTip();
                }}
                onFocus={() => {
                  setHoveredDeal(b.deal);
                  showTip(b.deal, b.x, b.y);
                }}
                onBlur={() => {
                  setHoveredDeal(null);
                  hideTip();
                }}
              >
                <title>
                  {`${b.deal.title} — ${b.deal.amount_display}, ${pod.config.name}`}
                </title>
                {/* The optional drift lives on an inner group so it can never
                    fight the pop-in for the same transform. */}
                <g className={floatClass}>
                {/* Drag elevation aura — a static ruled ring, not a spinner. */}
                {isBeingDragged && (
                  <circle
                    cx={b.x}
                    cy={b.y}
                    r={b.r + 5}
                    fill="none"
                    stroke={pod.config.accentHex}
                    strokeWidth="2"
                    strokeDasharray="4 3"
                    opacity={0.9}
                  />
                )}

                {/* Keyboard focus ring — visible, and drawn under the node */}
                <circle
                  className="bubble-focus-ring"
                  cx={b.x}
                  cy={b.y}
                  r={b.r + 4}
                  fill="none"
                  stroke="rgb(var(--c-ink))"
                  strokeWidth="2"
                />

                <circle
                  className="bubble-core"
                  cx={b.x}
                  cy={b.y}
                  r={isBeingDragged ? b.r + 2 : isHovered ? b.r + 1.5 : b.r}
                  fill={pod.config.accentHex}
                  stroke={isBeingDragged || isHovered ? "#ffffff" : "rgb(var(--c-canvas))"}
                  strokeWidth={isBeingDragged ? 2.5 : isHovered ? 2 : 1}
                />

                {b.r >= 18 && (
                  <text
                    x={b.x}
                    y={b.r >= 26 ? b.y - 2 : b.y + 3.5}
                    textAnchor="middle"
                    fill="#ffffff"
                    fontSize={b.r >= 26 ? 13 : 12}
                    fontWeight="800"
                    fontFamily="JetBrains Mono, monospace"
                    className="pointer-events-none select-none drop-shadow-sm"
                  >
                    {b.deal.amount_display}
                  </text>
                )}
                {b.r >= 26 && (
                  <text
                    x={b.x}
                    y={b.y + 9}
                    textAnchor="middle"
                    fill="#ffffff"
                    fillOpacity="0.92"
                    fontSize={12}
                    fontWeight="800"
                    fontFamily="JetBrains Mono, monospace"
                    className="pointer-events-none select-none drop-shadow-sm"
                  >
                    Prob {computeDealBubbleRisk(b.deal).riskScorePct}%
                  </text>
                )}
                </g>
              </g>
            );
          })}
        </svg>

        {/* Hover / focus readout. Positioned over the chart, never in the
            layout flow, so it cannot move a single pixel of the plot. */}
        {tip ? (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute z-10 w-56 rounded-lg border border-rule bg-surface p-2.5 shadow-float"
            style={{
              left: `${tip.x}%`,
              top: `${tip.y}%`,
              transform: `translate(-50%, ${tip.y < 45 ? "12px" : "calc(-100% - 12px)"})`,
            }}
          >
            <p className="line-clamp-2 text-[14px] font-semibold leading-snug text-ink">
              {tip.deal.title}
            </p>
            <p className="num mt-1 text-[14px] font-semibold text-ink">
              {tip.deal.amount_display}
            </p>
            <p className="num mt-0.5 text-[12px] text-ink-faint">{tip.deal.announced_date}</p>
            <div className="mt-1.5 flex flex-wrap gap-1">
              {tip.deal.is_debt ? <span className="chip chip-risk">Debt</span> : null}
              {tip.deal.is_compute ? <span className="chip">Compute</span> : null}
              {tip.deal.is_circular ? <span className="chip chip-risk">Circular</span> : null}
              {tip.deal.is_mega ? <span className="chip chip-caution">$10B+</span> : null}
            </div>
          </div>
        ) : null}

        <div className="absolute bottom-1.5 right-2 pointer-events-none opacity-40 hover:opacity-80 transition-opacity">
          <span className="text-[14px] font-mono text-ink-subtle flex items-center gap-1">
            <Hand className="w-2.5 h-2.5" aria-hidden="true" /> Draggable
          </span>
        </div>
      </div>
    </div>
  );
}

// ── 2. Unified Gravity Arena Physics Universe ─────────────────────────────────
interface ArenaNode {
  deal: Deal;
  r: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  config: (typeof CATEGORY_CONFIG)[string];
  origX: number;
  origY: number;
}

interface GravityArenaProps {
  deals: Deal[];
  onSelectDeal: (deal: Deal) => void;
  hoveredDeal: Deal | null;
  setHoveredDeal: (deal: Deal | null) => void;
  searchQuery: string;
  matchesSearch: (deal: Deal) => boolean;
  isDriftEnabled: boolean;
  resetCounter: number;
  /** The page-wide two-mode keyboard model. */
  nav: ChartNav;
}

function GravityArena({
  deals,
  onSelectDeal,
  hoveredDeal,
  setHoveredDeal,
  searchQuery,
  matchesSearch,
  isDriftEnabled,
  resetCounter,
  nav,
}: GravityArenaProps) {
  const [nodes, setNodes] = useState<ArenaNode[]>([]);
  /**
   * 2026-10-19 (design pass): the arena starts STILL. A chart that never
   * stops moving reads as decoration, not information — and the reader
   * already has a control for it ("Resume Motion"). The physics is the
   * point, not the loop.
   */
  const [isSimRunning, setIsSimRunning] = useState(false);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const reducedMotion = usePrefersReducedMotion();

  const svgRef = useRef<SVGSVGElement | null>(null);
  const nodesRef = useRef<ArenaNode[]>([]);
  const draggingIdRef = useRef<string | null>(null);
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const prevPointerPosRef = useRef({ x: 0, y: 0, time: 0 });
  const startClientPosRef = useRef({ x: 0, y: 0 });
  const hasMovedRef = useRef(false);
  const animFrameRef = useRef<number | null>(null);

  draggingIdRef.current = draggingId;

  // Initialize nodes from top deals
  const initNodes = useCallback(() => {
    const topDeals = selectArenaDeals(deals);

    const CANVAS_W = 1000;
    const CANVAS_H = 560;

    const initialNodes: ArenaNode[] = topDeals.map((deal, idx) => {
      const config = CATEGORY_CONFIG[deal.category] || CATEGORY_CONFIG["Other"];
      let r = 16;
      if (deal.amount_usd > 0) {
        const log = Math.log10(deal.amount_usd);
        r = Math.max(14, Math.min(58, (log - 7) * 13 + 18));
      }

      // Orbital sunflower distribution
      const angle = idx * 2.39996;
      const dist = Math.min(220, 35 + Math.sqrt(idx) * 32);
      const x = CANVAS_W / 2 + Math.cos(angle) * dist * 1.5;
      const y = CANVAS_H / 2 + Math.sin(angle) * dist * 0.95;

      const vx = (Math.random() - 0.5) * 0.5;
      const vy = (Math.random() - 0.5) * 0.5;

      return {
        deal,
        r,
        x,
        y,
        vx,
        vy,
        config,
        origX: x,
        origY: y,
      };
    });

    nodesRef.current = initialNodes;
    setNodes(initialNodes);
  }, [deals]);

  useEffect(() => {
    initNodes();
  }, [initNodes, resetCounter]);

  // Main physics loop. It only runs when the reader has asked for motion,
  // and never for a reduced-motion reader. While it is stopped the nodes
  // still track a drag (handlePointerMove repaints them directly), so the
  // arena is never a dead space.
  useEffect(() => {
    if (!isSimRunning || reducedMotion) return undefined;
    const CANVAS_W = 1000;
    const CANVAS_H = 560;

    const step = () => {
      if (isSimRunning) {
        const currentNodes = nodesRef.current;
        const currentDraggingId = draggingIdRef.current;

        for (let i = 0; i < currentNodes.length; i++) {
          const b = currentNodes[i];

          // Skip integration for currently dragged bubble
          if (b.deal.id === currentDraggingId) continue;

          // Apply velocity
          b.x += b.vx;
          b.y += b.vy;

          // Gentle ambient drag/friction
          b.vx *= 0.992;
          b.vy *= 0.992;

          // Gentle harmonic float oscillation if drift is on
          if (isDriftEnabled) {
            b.vx += (Math.random() - 0.5) * 0.04;
            b.vy += (Math.random() - 0.5) * 0.04;
          }

          // Wall bouncing with restitution
          if (b.x - b.r < 10) {
            b.x = 10 + b.r;
            b.vx = Math.abs(b.vx) * 0.85;
          } else if (b.x + b.r > CANVAS_W - 10) {
            b.x = CANVAS_W - 10 - b.r;
            b.vx = -Math.abs(b.vx) * 0.85;
          }

          if (b.y - b.r < 10) {
            b.y = 10 + b.r;
            b.vy = Math.abs(b.vy) * 0.85;
          } else if (b.y + b.r > CANVAS_H - 10) {
            b.y = CANVAS_H - 10 - b.r;
            b.vy = -Math.abs(b.vy) * 0.85;
          }
        }

        // Mutual collision detection & momentum exchange
        for (let i = 0; i < currentNodes.length; i++) {
          for (let j = i + 1; j < currentNodes.length; j++) {
            const b1 = currentNodes[i];
            const b2 = currentNodes[j];
            const dx = b2.x - b1.x;
            const dy = b2.y - b1.y;
            const dist = Math.hypot(dx, dy) || 0.1;
            const minDist = b1.r + b2.r + 3;

            if (dist < minDist) {
              const overlap = minDist - dist;
              const nx = dx / dist;
              const ny = dy / dist;

              // Positional separation
              if (b1.deal.id !== currentDraggingId && b2.deal.id !== currentDraggingId) {
                b1.x -= nx * overlap * 0.5;
                b1.y -= ny * overlap * 0.5;
                b2.x += nx * overlap * 0.5;
                b2.y += ny * overlap * 0.5;

                // Momentum swap
                const kx = b1.vx - b2.vx;
                const ky = b1.vy - b2.vy;
                const p = 2 * (nx * kx + ny * ky) / 2;
                b1.vx -= p * nx * 0.65;
                b1.vy -= p * ny * 0.65;
                b2.vx += p * nx * 0.65;
                b2.vy += p * ny * 0.65;
              } else if (b1.deal.id === currentDraggingId) {
                b2.x += nx * overlap;
                b2.y += ny * overlap;
                b2.vx += nx * 2;
                b2.vy += ny * 2;
              } else if (b2.deal.id === currentDraggingId) {
                b1.x -= nx * overlap;
                b1.y -= ny * overlap;
                b1.vx -= nx * 2;
                b1.vy -= ny * 2;
              }
            }
          }
        }

        setNodes([...currentNodes]);
      }

      animFrameRef.current = requestAnimationFrame(step);
    };

    animFrameRef.current = requestAnimationFrame(step);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isSimRunning, isDriftEnabled, reducedMotion]);

  // A reduced-motion reader can never start the simulation.
  useEffect(() => {
    if (reducedMotion && isSimRunning) setIsSimRunning(false);
  }, [reducedMotion, isSimRunning]);

  const handlePointerDown = (
    e: React.PointerEvent<SVGGElement>,
    node: ArenaNode
  ) => {
    e.stopPropagation();
    try {
      (e.currentTarget as Element).setPointerCapture(e.pointerId);
    } catch {
      // Fallback
    }

    const svg = svgRef.current;
    if (!svg) return;

    const pt = getSvgPoint(e as unknown as React.PointerEvent<SVGSVGElement>, svg, 1000, 560);
    dragOffsetRef.current = { x: pt.x - node.x, y: pt.y - node.y };
    prevPointerPosRef.current = { x: pt.x, y: pt.y, time: performance.now() };
    startClientPosRef.current = { x: e.clientX, y: e.clientY };
    hasMovedRef.current = false;
    setDraggingId(node.deal.id);
  };

  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!draggingId) return;

    const dist = Math.hypot(
      e.clientX - startClientPosRef.current.x,
      e.clientY - startClientPosRef.current.y
    );
    if (dist > 3) {
      hasMovedRef.current = true;
    }

    const svg = svgRef.current;
    if (!svg) return;

    const pt = getSvgPoint(e, svg, 1000, 560);
    const targetX = pt.x - dragOffsetRef.current.x;
    const targetY = pt.y - dragOffsetRef.current.y;

    const now = performance.now();
    const dt = Math.max(1, now - prevPointerPosRef.current.time);
    const vx = ((pt.x - prevPointerPosRef.current.x) / dt) * 16;
    const vy = ((pt.y - prevPointerPosRef.current.y) / dt) * 16;

    prevPointerPosRef.current = { x: pt.x, y: pt.y, time: now };

    const draggedNode = nodesRef.current.find((n) => n.deal.id === draggingId);
    if (draggedNode) {
      draggedNode.x = Math.max(draggedNode.r + 10, Math.min(1000 - draggedNode.r - 10, targetX));
      draggedNode.y = Math.max(draggedNode.r + 10, Math.min(560 - draggedNode.r - 10, targetY));
      draggedNode.vx = vx;
      draggedNode.vy = vy;
      // The simulation is not running, so this drag has to repaint itself.
      if (!isSimRunning) setNodes([...nodesRef.current]);
    }
  };

  const handlePointerUp = (
    e: React.PointerEvent<SVGGElement>,
    node: ArenaNode
  ) => {
    if (draggingId === node.deal.id) {
      try {
        (e.currentTarget as Element).releasePointerCapture(e.pointerId);
      } catch {
        // Fallback
      }
      if (!hasMovedRef.current) {
        onSelectDeal(node.deal);
      }
      setDraggingId(null);
    }
  };

  /* ── The chart's accessible identity ──────────────────────────────────────
   *
   * The arena is one image to a screen reader: a title, a description
   * derived from the bubbles it draws, and a single tab stop.
   */
  const arenaUid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const arenaTitleId = `${arenaUid}-title`;
  const arenaDescId = `${arenaUid}-desc`;
  const arenaTitle = "the zero-gravity arena of the largest AI infrastructure deals";

  const arenaDescription = useMemo(
    () =>
      generateChartDescription({
        title: arenaTitle,
        kind: "scatter",
        // The same slice the arena initialises itself from — so the
        // description counts the bubbles the arena draws, not the ones it
        // has happened to place yet.
        points: selectArenaDeals(deals).map((deal) => ({
          x: deal.title,
          y: deal.amount_usd,
        })),
        formatValue: (value) => (value > 0 ? formatUsd(value) : "amount not disclosed"),
      }),
    [arenaTitle, deals]
  );

  const arenaAria = getChartAriaProps({
    title: arenaTitle,
    description: arenaDescription,
    labelledBy: arenaTitleId,
    describedBy: arenaDescId,
    role: nav.activeSeriesId === ARENA_SERIES_ID ? "graphics-document" : "img",
  });

  const setArenaSvgRef = useCallback(
    (el: SVGSVGElement | null) => {
      svgRef.current = el;
      nav.registerSeries(ARENA_SERIES_ID, el);
    },
    [nav]
  );

  return (
    <div className="space-y-3">
      {/* HUD Header Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-1">
        <div className="flex items-center space-x-2 text-[14px] sm:text-sm font-semibold text-ink-muted">
          <Atom className="h-4 w-4 text-ink-subtle" aria-hidden="true" />
          <span>Interactive Zero-G Arena: Click &amp; fling any bubble into space!</span>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsSimRunning(!isSimRunning)}
            className="btn min-h-11"
          >
            {isSimRunning ? (
              <>
                <Pause className="w-3.5 h-3.5 text-caution-700" />
                <span>Pause Motion</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 text-safe-700" />
                <span>Resume Motion</span>
              </>
            )}
          </button>
          <button
            onClick={initNodes}
            className="btn min-h-11"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Recenter Arena</span>
          </button>
        </div>
      </div>

      {/* SVG Physics Arena Viewport */}
      <div className="relative w-full rounded-lg border border-rule bg-[rgb(12_14_17)] overflow-hidden shadow-inner">
        <svg
          ref={setArenaSvgRef}
          viewBox="0 0 1000 560"
          className="w-full h-auto block select-none touch-none cursor-grab active:cursor-grabbing focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
          style={{ minHeight: "440px" }}
          onPointerMove={handlePointerMove}
          tabIndex={0}
          {...arenaAria}
          onKeyDown={(e) => nav.onChartKeyDown(e, ARENA_SERIES_ID)}
        >
          <title id={arenaTitleId}>{arenaTitle}</title>
          <desc id={arenaDescId}>
            {arenaDescription} Press Enter or Space to step through the bubbles with the arrow
            keys; Escape returns to the chart.
          </desc>
          <defs>
            {/* Flat token fills only — no gradients, no glow filter. */}
          </defs>

          {/* Background constellation grid lines — decorative chrome. */}
          <g
            aria-hidden="true"
            opacity="0.1"
            stroke="#ffffff"
            strokeWidth="0.5"
            strokeDasharray="3 6"
          >
            <line x1="0" y1="280" x2="1000" y2="280" />
            <line x1="500" y1="0" x2="500" y2="560" />
            <circle cx="500" cy="280" r="140" fill="none" />
            <circle cx="500" cy="280" r="260" fill="none" />
          </g>

          {nodes.map((b) => {
            const isHovered = hoveredDeal?.id === b.deal.id;
            const isBeingDragged = draggingId === b.deal.id;
            const matched = matchesSearch(b.deal);
            const opacity = searchQuery.trim() && !matched ? 0.2 : 0.95;
            /* Is this bubble part of the keyboard model? The cap is applied
               by the parent, so there is one answer for the whole chart. */
            const isKeyboardMark = nav.isFocusable(b.deal.id);

            return (
              <g
                key={b.deal.id}
                ref={(el) => nav.registerMark(b.deal.id, el)}
                className="cursor-grab active:cursor-grabbing"
                style={{ opacity: isHovered || isBeingDragged ? 1 : opacity }}
                tabIndex={isKeyboardMark ? -1 : undefined}
                role={isKeyboardMark ? "graphics-symbol" : undefined}
                aria-label={
                  isKeyboardMark ? dealMarkLabel(b.deal, categoryName(b.deal.category)) : undefined
                }
                aria-hidden={isKeyboardMark ? undefined : true}
                onKeyDown={(e) => nav.onMarkKeyDown(e, b.deal.id)}
                onPointerDown={(e) => handlePointerDown(e, b)}
                onPointerUp={(e) => handlePointerUp(e, b)}
                onMouseEnter={() => setHoveredDeal(b.deal)}
                onMouseLeave={() => setHoveredDeal(null)}
                onFocus={() => setHoveredDeal(b.deal)}
                onBlur={() => setHoveredDeal(null)}
              >
                <title>
                  {`${b.deal.title} — ${b.deal.amount_display}, ${categoryName(b.deal.category)}`}
                </title>
                {/* Dragging elevation halo — a static ruled ring. */}
                {isBeingDragged && (
                  <circle
                    cx={b.x}
                    cy={b.y}
                    r={b.r + 7}
                    fill="none"
                    stroke="#ffffff"
                    strokeWidth="2.5"
                    strokeDasharray="6 4"
                    opacity={0.9}
                  />
                )}

                <circle
                  cx={b.x}
                  cy={b.y}
                  r={isBeingDragged ? b.r + 3 : isHovered ? b.r + 2 : b.r}
                  fill={b.config.accentHex}
                  stroke={isBeingDragged || isHovered ? "#ffffff" : "rgb(var(--c-canvas))"}
                  strokeWidth={isBeingDragged ? 3 : isHovered ? 2.5 : 1.2}
                />

                {/* Bubble Text */}
                {b.r >= 20 && (
                  <text
                    x={b.x}
                    y={b.r >= 34 ? b.y - 7 : b.y + 4}
                    textAnchor="middle"
                    fill="#ffffff"
                    fontSize={Math.min(15, Math.max(13, b.r / 3.4))}
                    fontWeight="800"
                    fontFamily="JetBrains Mono, monospace"
                    className="pointer-events-none select-none drop-shadow-sm"
                  >
                    {b.deal.amount_display}
                  </text>
                )}

                {b.r >= 34 && (
                  <text
                    x={b.x}
                    y={b.y + 5}
                    textAnchor="middle"
                    fill="#ffffff"
                    fillOpacity="0.92"
                    fontSize={Math.min(13, Math.max(12, b.r / 4.4))}
                    fontWeight="700"
                    fontFamily="Inter, sans-serif"
                    className="pointer-events-none select-none drop-shadow-sm"
                  >
                    {b.deal.title.split(" ")[0]}
                  </text>
                )}

                {b.r >= 36 && (
                  <text
                    x={b.x}
                    y={b.y + 17}
                    textAnchor="middle"
                    fill="#ffffff"
                    fillOpacity="0.85"
                    fontSize={12}
                    fontWeight="800"
                    fontFamily="JetBrains Mono, monospace"
                    className="pointer-events-none select-none drop-shadow-sm"
                  >
                    Prob {computeDealBubbleRisk(b.deal).riskScorePct}%
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        <div className="absolute bottom-3 left-4 pointer-events-none">
          <div className="flex items-center space-x-2 text-[14px] font-mono text-ink-muted bg-ink px-3 py-1.5 rounded-lg border border-rule">
            <Hand className="w-3.5 h-3.5 text-safe-700" aria-hidden="true" />
            <span>Fling bubbles to test collision physics • Double click to inspect</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── 3. Main DealBubbleChart Component ─────────────────────────────────────────
export function DealBubbleChart({ deals, onSelectDeal }: DealBubbleChartProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("treemap");
  const [selectedCat, setSelectedCat] = useState<string>("All");
  const [minVolume, setMinVolume] = useState<"all" | "1b" | "10b" | "50b">("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [hoveredDeal, setHoveredDeal] = useState<Deal | null>(null);
  // 2026-10-19 (design pass): the drift is off by default. A finance chart
  // that never stops moving reads as decoration, not information; the reader
  // can still switch it on.
  const [isDriftEnabled, setIsDriftEnabled] = useState(false);
  const [resetCounter, setResetCounter] = useState(0);
  const router = useRouter();

  const containerRef = useRef<HTMLDivElement>(null);

  /**
   * The ledger reads ?search= and filters on title, description, amount,
   * category, status, company and counterparties. The shortest title prefix
   * that still matches a real record is used, so the URL stays readable and
   * lands on exactly one deal; the full title is the fallback.
   */
  const ledgerSearchFor = useCallback(
    (deal: Deal): string => {
      const words = deal.title
        .toLowerCase()
        .replace(/[^a-z0-9 ]+/g, " ")
        .split(/\s+/)
        .filter(Boolean);
      for (let n = Math.min(4, words.length); n >= 2; n -= 1) {
        const probe = words.slice(0, n).join(" ");
        if (deals.some((d) => d.title.toLowerCase().includes(probe))) return probe;
      }
      return deal.title;
    },
    [deals]
  );

  /**
   * Open a deal in the ledger, pre-filtered. This is a client-side push
   * (not a <Link>) because the bubble lives inside an <svg>, where an anchor
   * element is invalid markup.
   */
  const openInLedger = useCallback(
    (deal: Deal) => {
      router.push(`/ledger?search=${encodeURIComponent(ledgerSearchFor(deal))}`);
    },
    [router, ledgerSearchFor]
  );

  // 1. Filter deals by category and volume threshold
  const filteredDeals = useMemo(() => {
    return deals.filter((deal) => {
      if (selectedCat !== "All" && deal.category !== selectedCat) return false;
      if (minVolume === "1b" && deal.amount_usd < 1_000_000_000) return false;
      if (minVolume === "10b" && deal.amount_usd < 10_000_000_000) return false;
      if (minVolume === "50b" && deal.amount_usd < 50_000_000_000) return false;
      return true;
    });
  }, [deals, selectedCat, minVolume]);

  const totalFilteredUsd = useMemo(() => {
    return filteredDeals.reduce((sum, d) => sum + d.amount_usd, 0);
  }, [filteredDeals]);

  const matchesSearch = (deal: Deal) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      deal.title.toLowerCase().includes(q) ||
      deal.description.toLowerCase().includes(q) ||
      deal.amount_display.toLowerCase().includes(q)
    );
  };

  // 2. High-performance Squarified Treemap Layout (Finviz Standard)
  const treemapTiles = useMemo(() => {
    if (viewMode !== "treemap") return [];

    const CANVAS_W = 1000;
    const CANVAS_H = 560;

    const sorted = [...filteredDeals].sort((a, b) => {
      return treemapValue(b) - treemapValue(a);
    });

    if (sorted.length === 0) return [];

    const tiles: TreemapTile[] = [];

    function partition(list: Deal[], cx: number, cy: number, cw: number, ch: number) {
      if (list.length === 0 || cw <= 0 || ch <= 0) return;
      if (list.length === 1) {
        tiles.push({
          deal: list[0],
          x: cx,
          y: cy,
          w: cw,
          h: ch,
          category: list[0].category,
        });
        return;
      }

      const totalVal = list.reduce((s, it) => s + treemapValue(it), 0);
      let runningSum = 0;
      let splitIdx = 0;

      for (let i = 0; i < list.length; i++) {
        runningSum += treemapValue(list[i]);
        if (runningSum >= totalVal / 2 || i === list.length - 2) {
          splitIdx = i + 1;
          break;
        }
      }

      const left = list.slice(0, splitIdx);
      const right = list.slice(splitIdx);
      const leftRatio = runningSum / totalVal;

      if (cw >= ch) {
        const splitW = cw * leftRatio;
        partition(left, cx, cy, splitW, ch);
        partition(right, cx + splitW, cy, cw - splitW, ch);
      } else {
        const splitH = ch * leftRatio;
        partition(left, cx, cy, cw, splitH);
        partition(right, cx, cy + splitH, cw, ch - splitH);
      }
    }

    partition(sorted, 0, 0, CANVAS_W, CANVAS_H);
    return tiles;
  }, [filteredDeals, viewMode]);

  // 3. Category Islands Grouping
  const categoryPods = useMemo(() => {
    if (viewMode !== "bubbles") return [];

    const activeCategories = Object.keys(CATEGORY_CONFIG).filter((cat) => {
      if (selectedCat !== "All" && cat !== selectedCat) return false;
      return deals.some((d) => d.category === cat);
    });

    return activeCategories.map((catKey) => {
      const catDeals = filteredDeals
        .filter((d) => d.category === catKey)
        .sort((a, b) => b.amount_usd - a.amount_usd);

      const catTotal = catDeals.reduce((sum, d) => sum + d.amount_usd, 0);
      const config = CATEGORY_CONFIG[catKey] || CATEGORY_CONFIG["Other"];

      const POD_W = 300;
      const POD_H = 190;

      const bubbles = catDeals.map((deal, idx) => {
        let r = 7;
        if (deal.amount_usd > 0) {
          const log = Math.log10(deal.amount_usd);
          r = Math.max(9, Math.min(38, (log - 6.5) * 6.5));
        }

        const angle = idx * 1.8;
        const dist = Math.min(80, 15 + idx * 7);
        const x = POD_W / 2 + Math.cos(angle) * dist;
        const y = POD_H / 2 + Math.sin(angle) * dist;

        return { deal, r, x, y };
      });

      // Initial relaxation passes to prevent overlapping in pods
      for (let iter = 0; iter < 45; iter++) {
        for (let i = 0; i < bubbles.length; i++) {
          for (let j = i + 1; j < bubbles.length; j++) {
            const dx = bubbles[j].x - bubbles[i].x;
            const dy = bubbles[j].y - bubbles[i].y;
            const dist = Math.sqrt(dx * dx + dy * dy) || 0.1;
            const minDist = bubbles[i].r + bubbles[j].r + 3;

            if (dist < minDist) {
              const overlap = (minDist - dist) / dist;
              const px = dx * overlap * 0.45;
              const py = dy * overlap * 0.45;
              bubbles[i].x -= px;
              bubbles[i].y -= py;
              bubbles[j].x += px;
              bubbles[j].y += py;
            }
          }
        }
        for (let i = 0; i < bubbles.length; i++) {
          bubbles[i].x = Math.max(bubbles[i].r + 6, Math.min(POD_W - bubbles[i].r - 6, bubbles[i].x));
          bubbles[i].y = Math.max(bubbles[i].r + 6, Math.min(POD_H - bubbles[i].r - 6, bubbles[i].y));
        }
      }

      return {
        categoryKey: catKey,
        config,
        deals: catDeals,
        totalUsd: catTotal,
        bubbles,
      };
    });
  }, [filteredDeals, deals, selectedCat, viewMode]);

  // 4. Timeline Columns Data
  const timelineColumns = useMemo(() => {
    if (viewMode !== "timeline") return [];

    const years = [
      { key: "2023", label: "2023 & Prior" },
      { key: "2024", label: "2024 Inflection" },
      { key: "2025", label: "2025 Capex Surge" },
      { key: "2026", label: "2026 Gigawatt Era" },
    ];

    return years.map((y) => {
      const yearDeals = filteredDeals
        .filter((d) => {
          if (y.key === "2023") return d.year <= 2023;
          return d.year.toString() === y.key;
        })
        .sort((a, b) => b.amount_usd - a.amount_usd);

      const total = yearDeals.reduce((sum, d) => sum + d.amount_usd, 0);
      const totalDisplay =
        total >= 1e12
          ? `$${(total / 1e12).toFixed(2)}T Committed`
          : `$${(total / 1e9).toFixed(1)}B Committed`;

      return {
        ...y,
        subtitle: totalDisplay,
        deals: yearDeals,
        totalUsd: total,
      };
    });
  }, [filteredDeals, viewMode]);

  const liveModelResult = useMemo(() => evaluateBubbleModel(DEFAULT_MODEL_INPUTS), []);

  /* ── 5. The chart's accessible identity ────────────────────────────────────
   *
   * One <title> and one <desc> per chart, and a description that is DERIVED
   * from the tiles the treemap actually draws. The keyboard model works on
   * the same data: a series per sector, capped at KEYBOARD_MARK_CAP marks,
   * and the data table underneath carries every last one of them.
   */
  const chartUid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const treemapTitleId = `${chartUid}-treemap-title`;
  const treemapDescId = `${chartUid}-treemap-desc`;
  const treemapTitle =
    "the capital allocation treemap of AI infrastructure deals, area proportional to disclosed amount";

  const treemapDescription = useMemo(
    () =>
      generateChartDescription({
        title: treemapTitle,
        kind: "category",
        points: treemapTiles.map((tile) => ({
          x: tile.deal.title,
          y: treemapValue(tile.deal),
        })),
        formatValue: (value) => formatUsd(value),
      }),
    [treemapTitle, treemapTiles]
  );

  /** The treemap's sectors are its series. */
  const navSeries = useMemo<NavSeries[]>(() => {
    if (viewMode === "treemap") {
      const byCategory = new Map<string, NavMark[]>();
      for (const tile of treemapTiles) {
        const marks = byCategory.get(tile.category) ?? [];
        marks.push({ id: tile.deal.id, value: treemapValue(tile.deal) });
        byCategory.set(tile.category, marks);
      }
      return Array.from(byCategory.entries()).map(([id, marks]) => ({ id, marks }));
    }

    if (viewMode === "bubbles") {
      return categoryPods.map((pod) => ({
        id: pod.categoryKey,
        marks: pod.bubbles.map((b) => ({ id: b.deal.id, value: b.deal.amount_usd })),
      }));
    }

    if (viewMode === "arena") {
      return [
        {
          id: ARENA_SERIES_ID,
          marks: selectArenaDeals(filteredDeals).map((deal) => ({
            id: deal.id,
            value: deal.amount_usd,
          })),
        },
      ];
    }

    return [];
  }, [viewMode, treemapTiles, categoryPods, filteredDeals]);

  /**
   * The keyboard model walks the marks of the current view — but only the
   * largest ones. Everything else is in the table underneath.
   */
  const keyboardSeries = useMemo<NavSeries[]>(() => {
    const largest = navSeries
      .flatMap((s) => s.marks.map((m) => ({ id: m.id, value: m.value })))
      .sort((a, b) => b.value - a.value)
      .slice(0, KEYBOARD_MARK_CAP);
    const keep = new Set(largest.map((m) => m.id));
    return navSeries
      .map((s) => ({ id: s.id, marks: s.marks.filter((m) => keep.has(m.id)) }))
      .filter((s) => s.marks.length > 0);
  }, [navSeries]);

  /**
   * What Enter does on a mark: the bubbles open in the ledger (as they
   * always have), the treemap tiles and the arena bubbles open the
   * disclosure.
   */
  const handleActivateMark = useCallback(
    (markId: string) => {
      const deal = deals.find((d) => d.id === markId);
      if (!deal) return;
      if (viewMode === "bubbles") openInLedger(deal);
      else onSelectDeal(deal);
    },
    [deals, viewMode, openInLedger, onSelectDeal]
  );

  const nav = useChartNav(keyboardSeries, handleActivateMark);

  const treemapAria = getChartAriaProps({
    title: treemapTitle,
    description: treemapDescription,
    labelledBy: treemapTitleId,
    describedBy: treemapDescId,
    // While the reader is walking the tiles the treemap becomes a graphics
    // document, so the tiles (role="graphics-symbol") stay in the
    // accessibility tree instead of being flattened into one image.
    role: nav.dataMode ? "graphics-document" : "img",
  });

  /** The treemap's <svg> is the one tab stop of the treemap. */
  const setTreemapSvgRef = useCallback(
    (el: SVGSVGElement | null) => {
      for (const s of navSeries) nav.registerSeries(s.id, el);
    },
    [nav, navSeries]
  );

  /* ── 6. The data table: the same numbers as the marks ─────────────────────
   *
   * The rows are read off the very arrays the view draws from — the tiles,
   * the bubbles, the arena's slice, the timeline's ten-per-column — so the
   * table cannot claim a deal the chart does not show.
   */
  const tableRows = useMemo<Array<Array<string | number>>>(() => {
    const row = (deal: Deal, sector: string): Array<string | number> => [
      deal.title,
      sector,
      deal.amount_display,
      deal.announced_date,
      `${computeDealBubbleRisk(deal).riskScorePct}%`,
    ];

    if (viewMode === "treemap") {
      return treemapTiles.map((tile) => row(tile.deal, categoryName(tile.category)));
    }
    if (viewMode === "bubbles") {
      return categoryPods.flatMap((pod) =>
        pod.bubbles.map((b) => row(b.deal, pod.config.name))
      );
    }
    if (viewMode === "arena") {
      return selectArenaDeals(filteredDeals).map((deal) =>
        row(deal, categoryName(deal.category))
      );
    }
    return timelineColumns.flatMap((col) =>
      col.deals.slice(0, 10).map((deal) => row(deal, col.label))
    );
  }, [viewMode, treemapTiles, categoryPods, filteredDeals, timelineColumns]);

  const viewLabel =
    viewMode === "treemap"
      ? "capital treemap"
      : viewMode === "bubbles"
        ? "bubble pods"
        : viewMode === "arena"
          ? "gravity arena"
          : "timeline flow";

  /** The filter readout, announced politely when it changes. */
  const filterAnnouncement = useMemo(() => {
    const volume =
      minVolume === "all"
        ? ""
        : `, ${
            minVolume === "1b"
              ? "at least $1 billion"
              : minVolume === "10b"
                ? "at least $10 billion"
                : "at least $50 billion"
          }`;
    const sector = selectedCat === "All" ? "all sectors" : categoryName(selectedCat);
    return `${filteredDeals.length} deals shown, ${sector}${volume}.`;
  }, [filteredDeals.length, minVolume, selectedCat]);

  return (
    <div
      ref={containerRef}
      /* Leaving the chart ends data mode: the chart goes back to being one
         image with a name and a description. */
      onBlur={(e) => nav.onChartBlur(e)}
      className="card card-flush overflow-hidden shadow-card"
    >
      {/* Top Header Bar & Mode Selector */}
      <div className="p-5 sm:p-6 border-b border-rule space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-[14px] sm:text-sm font-semibold text-ink-subtle flex-wrap gap-y-1">
              <span className="label">Capital Allocation Universe</span>
              <span>•</span>
              <span className="text-ink">100% Verified Disclosures</span>
              <span>•</span>
              <span className="num text-ink font-semibold">
                {filteredDeals.length} Deals (${(totalFilteredUsd / 1e12).toFixed(2)}T)
              </span>
              <span>•</span>
              <span className="num text-[14px] font-semibold text-risk-700">
                12M Bubble Prob: {liveModelResult.burstProbability.toFixed(1)}% ({liveModelResult.band.toUpperCase()})
              </span>
            </div>
            <h2 className="mt-1 text-xl font-bold tracking-tight text-ink sm:text-2xl">
              Institutional Capital Allocation Matrix (Area = Disclosed USD)
            </h2>
          </div>

          {/* View Mode Segmented Controls - 2-col on mobile, flex on desktop */}
          <div className="grid w-full grid-cols-2 items-center gap-1 rounded-lg border border-rule bg-surface-2 p-1 sm:flex sm:w-auto sm:p-1.5">
            <button
              onClick={() => setViewMode("treemap")}
              aria-pressed={viewMode === "treemap"}
              className={`flex min-h-11 items-center justify-center gap-2 rounded-lg border px-3 py-2 text-[13px] font-semibold transition-[background-color,border-color,color,transform] duration-150 active:scale-[0.98] ${viewMode === "treemap" ? "border-ink bg-ink text-canvas" : "border-transparent text-ink-muted hover:bg-surface hover:text-ink"}`}
            >
              <LayoutGrid className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>Capital Treemap</span>
            </button>
            <button
              onClick={() => setViewMode("bubbles")}
              aria-pressed={viewMode === "bubbles"}
              className={`flex min-h-11 items-center justify-center gap-2 rounded-lg border px-3 py-2 text-[13px] font-semibold transition-[background-color,border-color,color,transform] duration-150 active:scale-[0.98] ${viewMode === "bubbles" ? "border-ink bg-ink text-canvas" : "border-transparent text-ink-muted hover:bg-surface hover:text-ink"}`}
            >
              <CircleDot className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>Bubble Pods</span>
            </button>
            <button
              onClick={() => setViewMode("arena")}
              aria-pressed={viewMode === "arena"}
              className={`flex min-h-11 items-center justify-center gap-2 rounded-lg border px-3 py-2 text-[13px] font-semibold transition-[background-color,border-color,color,transform] duration-150 active:scale-[0.98] ${viewMode === "arena" ? "border-ink bg-ink text-canvas" : "border-transparent text-ink-muted hover:bg-surface hover:text-ink"}`}
            >
              <Atom className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-ink-muted shrink-0" />
              <span>Gravity Arena</span>
            </button>
            <button
              onClick={() => setViewMode("timeline")}
              aria-pressed={viewMode === "timeline"}
              className={`flex min-h-11 items-center justify-center gap-2 rounded-lg border px-3 py-2 text-[13px] font-semibold transition-[background-color,border-color,color,transform] duration-150 active:scale-[0.98] ${viewMode === "timeline" ? "border-ink bg-ink text-canvas" : "border-transparent text-ink-muted hover:bg-surface hover:text-ink"}`}
            >
              <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-caution-700 shrink-0" />
              <span>Timeline Flow</span>
            </button>
          </div>
        </div>

        {/* Filter Controls: Search & Volume Thresholds */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          {/* Quick Search */}
          <div className="relative w-full sm:w-80">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-subtle" aria-hidden="true" />
            <input
              type="text"
              placeholder="Filter company, project, or amount..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="min-h-11 w-full rounded-lg border border-rule bg-surface py-2 pl-10 pr-11 text-sm text-ink placeholder:text-ink-faint"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-0 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center text-[14px] text-ink-subtle hover:text-ink"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            )}
          </div>

          {/* Size Filter Pills with horizontal scroll on mobile */}
          <div className="-mx-1 flex items-center gap-1.5 overflow-x-auto px-1 pb-0.5 text-[14px] scrollbar-none touch-pan-x sm:text-sm">
            <span className="label mr-1 hidden shrink-0 md:inline">
              Minimum Deal:
            </span>
            {[
              { id: "all", label: "All Deals" },
              { id: "1b", label: "≥ $1B" },
              { id: "10b", label: "≥ $10B" },
              { id: "50b", label: "≥ $50B" },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setMinVolume(t.id as any)}
                aria-pressed={minVolume === t.id}
                className={`min-h-11 min-w-11 shrink-0 whitespace-nowrap rounded-lg border px-3 py-2 text-[13px] font-semibold transition-[background-color,border-color,color,transform] duration-150 active:scale-[0.98] ${minVolume === t.id ? "border-ink bg-ink text-canvas" : "border-rule bg-surface text-ink-muted hover:border-rule-strong hover:text-ink"}`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Sector Pills Strip */}
        <div className="-mx-1 flex items-center gap-2 overflow-x-auto px-1 pb-1 text-[14px] scrollbar-none touch-pan-x sm:text-sm">
          <button
            onClick={() => setSelectedCat("All")}
            aria-pressed={selectedCat === "All"}
            className={`min-h-11 min-w-11 shrink-0 whitespace-nowrap rounded-lg border px-3 py-2 text-[13px] font-semibold transition-[background-color,border-color,color,transform] duration-150 active:scale-[0.98] ${selectedCat === "All" ? "border-ink bg-ink text-canvas" : "border-rule bg-surface text-ink-muted hover:border-rule-strong hover:text-ink"}`}
          >
            All Sectors ({deals.length})
          </button>
          {Object.entries(CATEGORY_CONFIG).map(([key, config]) => {
            const count = deals.filter((d) => d.category === key).length;
            const isSelected = selectedCat === key;
            return (
              <button
                key={key}
                onClick={() => setSelectedCat(key)}
                aria-pressed={isSelected}
                className={`flex min-h-11 shrink-0 items-center gap-2 whitespace-nowrap rounded-lg border px-3 py-2 text-[13px] font-semibold transition-[background-color,border-color,color,transform] duration-150 active:scale-[0.98] ${isSelected ? "border-ink bg-ink text-canvas" : "border-rule bg-surface text-ink-muted hover:border-rule-strong hover:text-ink"}`}
              >
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: config.accentHex }} />
                <span>{config.name}</span>
                <span className="text-[14px] opacity-75">({count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Physics & Drift Controls Bar for Bubble Views */}
      {(viewMode === "bubbles" || viewMode === "arena") && (
        <div className="px-5 sm:px-6 py-2.5 bg-surface-2 border-b border-rule flex flex-wrap items-center justify-between gap-3 text-[14px]">
          <div className="flex items-center space-x-2 text-ink-muted font-medium">
            <Hand className="h-4 w-4 text-ink-subtle" aria-hidden="true" />
            <span>Interactive Drag Physics: Drag any bubble to move it and push other deals.</span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsDriftEnabled(!isDriftEnabled)}
              className="btn min-h-11 cursor-pointer"
            >
              {isDriftEnabled ? (
                <>
                  <Pause className="h-3.5 w-3.5 text-caution-700" aria-hidden="true" />
                  <span>Float Drift: ON</span>
                </>
              ) : (
                <>
                  <Play className="h-3.5 w-3.5 text-safe-700" aria-hidden="true" />
                  <span>Float Drift: PAUSED</span>
                </>
              )}
            </button>
            <button
              onClick={() => setResetCounter((c) => c + 1)}
              className="btn min-h-11 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3 text-ink-subtle" />
              <span>Reset Positions</span>
            </button>
          </div>
        </div>
      )}

      {/* Visual Canvas Viewport */}
      <div className="relative overflow-hidden bg-surface-2 p-3 sm:p-4">
        {/* VIEW 1: SQUARIFIED CAPITAL TREEMAP */}
        {viewMode === "treemap" && (
          <div className="relative w-full overflow-hidden rounded-lg border border-rule bg-surface">
            {/* The height comes from the viewBox aspect ratio alone. A fixed
                min-height used to letterbox this chart on a phone: at 330px of
                width the plot is ~185px tall, so a 440px floor left five
                eighths of the box empty above and below the picture. */}
            <svg
              viewBox="0 0 1000 560"
              className="w-full h-auto block select-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
              ref={setTreemapSvgRef}
              tabIndex={0}
              {...treemapAria}
              onKeyDown={(e) => nav.onChartKeyDown(e)}
            >
              <title id={treemapTitleId}>{treemapTitle}</title>
              <desc id={treemapDescId}>
                {treemapDescription} Press Enter or Space to step through the tiles with the arrow
                keys; Escape returns to the chart.
              </desc>
              {treemapTiles.map((tile) => {
                const config = CATEGORY_CONFIG[tile.category] || CATEGORY_CONFIG["Other"];
                const matched = matchesSearch(tile.deal);
                const isHovered = hoveredDeal?.id === tile.deal.id;
                const opacity = searchQuery.trim() && !matched ? 0.15 : 1;
                /* Is this tile part of the keyboard model? The cap is applied
                   by the parent, so there is one answer for the whole chart. */
                const isKeyboardMark = nav.isFocusable(tile.deal.id);

                let shortTitle = tile.deal.title;
                if (tile.deal.title.includes("Stargate")) shortTitle = "Stargate Project";
                else if (tile.deal.title.includes("OpenAI")) shortTitle = "OpenAI";
                else if (tile.deal.title.includes("Anthropic")) shortTitle = "Anthropic";
                else if (tile.deal.title.includes("CoreWeave")) shortTitle = "CoreWeave";
                else if (tile.deal.title.includes("Oracle")) shortTitle = "Oracle Cloud";
                else if (tile.deal.title.includes("Blackstone")) shortTitle = "Blackstone QTS";
                else if (tile.deal.title.includes("NVIDIA")) shortTitle = "NVIDIA";
                else if (tile.deal.title.includes("Amazon")) shortTitle = "Amazon AWS";
                else if (tile.deal.title.includes("Microsoft")) shortTitle = "Microsoft";
                else if (tile.deal.title.includes("Google")) shortTitle = "Google Cloud";
                else if (tile.deal.title.includes("Meta")) shortTitle = "Meta Platforms";
                else if (tile.deal.title.includes("xAI")) shortTitle = "xAI Colossus";
                else if (tile.deal.title.includes("Three Mile")) shortTitle = "Three Mile Island";

                const titleFontSize = Math.min(15, Math.max(13, tile.w / 11));
                const amountFontSize = Math.min(14, Math.max(13, tile.w / 12));
                /* The label is measured in the same units it is drawn in, so a
                   short tile shows a shortened, ellipsised word rather than a
                   half-word, and a tile too small for text shows none. */
                const titleLabel =
                  tile.w >= 70 && tile.h >= 45
                    ? fitTileLabel(shortTitle, tile.w - 10, titleFontSize)
                    : "";
                const amountFits =
                  tile.w >= 50 &&
                  tile.h >= 32 &&
                  tile.deal.amount_display.length * amountFontSize * 0.62 <= tile.w - 8;

                return (
                  <g
                    key={tile.deal.id}
                    ref={(el) => nav.registerMark(tile.deal.id, el)}
                    className="cursor-pointer transition-opacity duration-150"
                    style={{ opacity }}
                    tabIndex={isKeyboardMark ? -1 : undefined}
                    role={isKeyboardMark ? "graphics-symbol" : undefined}
                    aria-label={
                      isKeyboardMark
                        ? dealMarkLabel(tile.deal, categoryName(tile.category))
                        : undefined
                    }
                    aria-hidden={isKeyboardMark ? undefined : true}
                    onKeyDown={(e) => nav.onMarkKeyDown(e, tile.deal.id)}
                    onClick={() => onSelectDeal(tile.deal)}
                    onMouseEnter={() => setHoveredDeal(tile.deal)}
                    onMouseLeave={() => setHoveredDeal(null)}
                    onFocus={() => setHoveredDeal(tile.deal)}
                    onBlur={() => setHoveredDeal(null)}
                  >
                    <title>
                      {`${tile.deal.title} — ${tile.deal.amount_display}, ${categoryName(
                        tile.category
                      )}`}
                    </title>
                    <rect
                      x={tile.x + 1}
                      y={tile.y + 1}
                      width={Math.max(0, tile.w - 2)}
                      height={Math.max(0, tile.h - 2)}
                      fill={config.accentHex}
                      stroke={isHovered ? "#ffffff" : "rgb(var(--c-canvas))"}
                      strokeWidth={isHovered ? 2 : 1}
                      rx={3}
                    />

                    {titleLabel !== "" && (
                      <text
                        x={tile.x + tile.w / 2}
                        y={amountFits ? tile.y + tile.h / 2 - 5 : tile.y + tile.h / 2 + 4}
                        textAnchor="middle"
                        fill="#ffffff"
                        fontSize={titleFontSize}
                        fontWeight="800"
                        fontFamily="Inter, sans-serif"
                        className="treemap-tile-label pointer-events-none select-none drop-shadow-sm"
                      >
                        {titleLabel}
                      </text>
                    )}

                    {amountFits && (
                      <text
                        x={tile.x + tile.w / 2}
                        y={tile.y + tile.h / 2 + (titleLabel !== "" ? 13 : 4)}
                        textAnchor="middle"
                        fill="#ffffff"
                        fontSize={amountFontSize}
                        fontWeight="800"
                        fontFamily="JetBrains Mono, monospace"
                        opacity={1}
                        className="treemap-tile-label pointer-events-none select-none drop-shadow-sm"
                      >
                        {tile.deal.amount_display}
                      </text>
                    )}
                  </g>
                );
              })}
            </svg>
          </div>
        )}

        {/* VIEW 2: CATEGORY BUBBLE PODS WITH DRAGGABLE PHYSICS */}
        {viewMode === "bubbles" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categoryPods.map((pod) => (
              <InteractiveBubblePod
                key={pod.categoryKey}
                pod={pod}
                onSelectDeal={onSelectDeal}
                onOpenInLedger={openInLedger}
                hoveredDeal={hoveredDeal}
                setHoveredDeal={setHoveredDeal}
                searchQuery={searchQuery}
                matchesSearch={matchesSearch}
                isDriftEnabled={isDriftEnabled}
                resetCounter={resetCounter}
                nav={nav}
              />
            ))}
          </div>
        )}

        {/* VIEW 3: UNIFIED GRAVITY ARENA PHYSICS UNIVERSE */}
        {viewMode === "arena" && (
          <GravityArena
            deals={filteredDeals}
            onSelectDeal={onSelectDeal}
            hoveredDeal={hoveredDeal}
            setHoveredDeal={setHoveredDeal}
            searchQuery={searchQuery}
            matchesSearch={matchesSearch}
            isDriftEnabled={isDriftEnabled}
            resetCounter={resetCounter}
            nav={nav}
          />
        )}

        {/* VIEW 4: TIMELINE FLOW MATRIX */}
        {viewMode === "timeline" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {timelineColumns.map((col) => (
              <div
                key={col.key}
                className="card flex flex-col justify-between gap-3"
              >
                <div className="pb-2 border-b border-rule">
                  <div className="flex items-center justify-between">
                    <span className="num text-base font-semibold text-ink">
                      {col.label}
                    </span>
                    <span className="text-[14px] sm:text-sm font-mono font-extrabold text-safe-700">
                      ${(col.totalUsd / 1e9).toFixed(1)}B
                    </span>
                  </div>
                  <span className="text-[14px] text-ink-subtle font-medium">
                    {col.deals.length} Sourced Deals
                  </span>
                </div>

                <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
                  {col.deals.slice(0, 10).map((deal) => {
                    const config = CATEGORY_CONFIG[deal.category] || CATEGORY_CONFIG["Other"];
                    const matched = matchesSearch(deal);
                    const opacity = searchQuery.trim() && !matched ? 0.2 : 1;

                    return (
                      <div
                        key={deal.id}
                        onClick={() => onSelectDeal(deal)}
                        style={{ opacity }}
                        className="panel min-h-11 cursor-pointer space-y-1 transition-colors hover:border-rule-strong"
                      >
                        <div className="flex items-center justify-between text-[14px] font-mono">
                          <span
                            className="px-2.5 py-0.5 rounded font-bold text-white text-[14px]"
                            style={{ backgroundColor: config.accentHex }}
                          >
                            {deal.amount_display}
                          </span>
                          <span className="text-ink-subtle text-[14px]">
                            {deal.announced_date}
                          </span>
                        </div>
                        <h4 className="text-[14px] sm:text-sm font-semibold text-ink line-clamp-1">
                          {deal.title}
                        </h4>
                      </div>
                    );
                  })}
                  {col.deals.length > 10 && (
                    <div className="text-center text-[14px] font-semibold text-ink-subtle pt-1">
                      + {col.deals.length - 10} more in ledger
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Live Hover Inspection Popover Card */}
        {hoveredDeal && (() => {
          const riskInfo = computeDealBubbleRisk(hoveredDeal);
          return (
            <div className="card mt-3 flex flex-col items-start justify-between gap-3 text-sm sm:flex-row sm:items-center">
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center space-x-2.5 flex-wrap gap-y-1">
                  <span className="text-base font-bold text-ink sm:text-lg">
                    {hoveredDeal.title}
                  </span>
                  <span className="chip chip-safe num text-sm">
                    {hoveredDeal.amount_display}
                  </span>
                  <span
                    className={`chip ${ riskInfo.riskBand === "Critical" ? "chip-risk" : riskInfo.riskBand === "High" ? "chip-caution" : "" }`}
                  >
                    Bubble Exposure: {riskInfo.riskScorePct}% ({riskInfo.riskBand})
                  </span>
                  <span className="font-mono text-[14px] text-ink-subtle font-medium">
                    {riskInfo.riskImpactDisplay} • {riskInfo.contagionWeight}
                  </span>
                </div>
                <p className="text-ink-muted text-sm line-clamp-1 font-sans">
                  {hoveredDeal.description}
                </p>
              </div>

              <div className="flex shrink-0 flex-wrap items-center gap-2">
                <button
                  onClick={() => openInLedger(hoveredDeal)}
                  className="btn min-h-11 shrink-0"
                >
                  <span>Open in ledger</span>
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </button>
                <button
                  onClick={() => onSelectDeal(hoveredDeal)}
                  className="btn btn-primary min-h-11 shrink-0"
                >
                  <span>Inspect Disclosure</span>
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </div>
          );
        })()}
      </div>

      {/* The keyboard model, in words, for the reader who never finds it. The
          timeline has no chart to walk, so it has no keyboard model either —
          its table is the representation. */}
      {viewMode !== "timeline" ? (
        <p className="px-3 pt-3 text-[14px] leading-relaxed text-ink-subtle sm:px-4">
          Keyboard: tab to the chart, press Enter to step through the {viewLabel} with the arrow
          keys, and press Escape to return to the chart.
        </p>
      ) : null}

      {/* The same numbers as the chart, as a real table. It is available to
          assistive technology always, and it is the fallback for every mark
          the keyboard model does not reach. */}
      <ChartDataTable
        caption={`Every deal drawn in the ${viewLabel} view: the same rows and figures as the chart, with the sector, the disclosed amount, the announcement date and the modelled bubble exposure.`}
        columns={["Deal", "Sector", "Amount", "Announced", "Bubble exposure"]}
        rows={tableRows}
      />

      {/* The filter readout, announced politely when it changes. */}
      <ChartAnnouncer message={filterAnnouncement} />

      {/* Footer Meta & Stats */}
      <div className="flex flex-col items-center justify-between gap-3 border-t border-rule bg-surface-2 px-4 py-4 md:flex-row">
        <div className="flex items-center space-x-2 text-[14px] sm:text-sm font-medium text-ink-muted">
          <Layers className="h-4 w-4 text-ink-subtle" aria-hidden="true" />
          <span>Click any block or bubble to inspect SEC filings &amp; audited disclosures.</span>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-[14px] sm:text-sm">
          <span className="chip chip-risk">
            {deals.filter((d) => d.is_debt).length} Debt Deals
          </span>
          <span className="chip">
            {deals.filter((d) => d.category === "Bets & rounds").length} Equity Rounds
          </span>
          <span className="chip chip-safe">
            Total Disclosed: ${(deals.reduce((acc, d) => acc + (d.amount_usd || 0), 0) / 1e12).toFixed(2)}T
          </span>
        </div>
      </div>
    </div>
  );
}
