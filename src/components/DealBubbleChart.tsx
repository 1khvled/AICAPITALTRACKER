"use client";

import React, { useState, useMemo, useRef, useEffect, useCallback } from "react";
import {
  Search,
  LayoutGrid,
  CircleDot,
  Calendar,
  Sparkles,
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

interface DealBubbleChartProps {
  deals: Deal[];
  onSelectDeal: (deal: Deal) => void;
}

export type ViewMode = "treemap" | "bubbles" | "arena" | "timeline";

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
    pillBg: "bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400 border-rose-200 dark:border-rose-900/60",
    border: "border-rose-200 dark:border-rose-900/50",
    tileBg: "bg-rose-50/70 dark:bg-rose-950/30",
    tileBgHover: "hover:bg-rose-100/80 dark:hover:bg-rose-950/60",
    badgeBg: "bg-rose-600",
    textColor: "text-rose-700 dark:text-rose-400",
    accentHex: "#ef4444",
  },
  "Bets & rounds": {
    name: "Equity & Strategic Bets",
    pillBg: "bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-400 border-purple-200 dark:border-purple-900/60",
    border: "border-purple-200 dark:border-purple-900/50",
    tileBg: "bg-purple-50/70 dark:bg-purple-950/30",
    tileBgHover: "hover:bg-purple-100/80 dark:hover:bg-purple-950/60",
    badgeBg: "bg-purple-600",
    textColor: "text-purple-700 dark:text-purple-400",
    accentHex: "#8b5cf6",
  },
  "Compute contracts": {
    name: "Compute & Cloud Clusters",
    pillBg: "bg-cyan-50 text-cyan-700 dark:bg-cyan-950/50 dark:text-cyan-400 border-cyan-200 dark:border-cyan-900/60",
    border: "border-cyan-200 dark:border-cyan-900/50",
    tileBg: "bg-cyan-50/70 dark:bg-cyan-950/30",
    tileBgHover: "hover:bg-cyan-100/80 dark:hover:bg-cyan-950/60",
    badgeBg: "bg-cyan-600",
    textColor: "text-cyan-700 dark:text-cyan-400",
    accentHex: "#06b6d4",
  },
  "Power & land": {
    name: "Power & Clean Energy",
    pillBg: "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400 border-amber-200 dark:border-amber-900/60",
    border: "border-amber-200 dark:border-amber-900/50",
    tileBg: "bg-amber-50/70 dark:bg-amber-950/30",
    tileBgHover: "hover:bg-amber-100/80 dark:hover:bg-amber-950/60",
    badgeBg: "bg-amber-600",
    textColor: "text-amber-700 dark:text-amber-400",
    accentHex: "#f59e0b",
  },
  "Buyouts & mergers": {
    name: "M&A & Buyouts",
    pillBg: "bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400 border-blue-200 dark:border-blue-900/60",
    border: "border-blue-200 dark:border-blue-900/50",
    tileBg: "bg-blue-50/70 dark:bg-blue-950/30",
    tileBgHover: "hover:bg-blue-100/80 dark:hover:bg-blue-950/60",
    badgeBg: "bg-blue-600",
    textColor: "text-blue-700 dark:text-blue-400",
    accentHex: "#3b82f6",
  },
  "Big construction": {
    name: "Hyperscale Capex",
    pillBg: "bg-orange-50 text-orange-700 dark:bg-orange-950/50 dark:text-orange-400 border-orange-200 dark:border-orange-900/60",
    border: "border-orange-200 dark:border-orange-900/50",
    tileBg: "bg-orange-50/70 dark:bg-orange-950/30",
    tileBgHover: "hover:bg-orange-100/80 dark:hover:bg-orange-950/60",
    badgeBg: "bg-orange-600",
    textColor: "text-orange-700 dark:text-orange-400",
    accentHex: "#f97316",
  },
  "Share sales": {
    name: "Secondary Share Sales",
    pillBg: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/60",
    border: "border-emerald-200 dark:border-emerald-900/50",
    tileBg: "bg-emerald-50/70 dark:bg-emerald-950/30",
    tileBgHover: "hover:bg-emerald-100/80 dark:hover:bg-emerald-950/60",
    badgeBg: "bg-emerald-600",
    textColor: "text-emerald-700 dark:text-emerald-400",
    accentHex: "#10b981",
  },
  "Other": {
    name: "Ecosystem Deals",
    pillBg: "bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-zinc-300 border-slate-200 dark:border-zinc-700",
    border: "border-slate-200 dark:border-zinc-800",
    tileBg: "bg-slate-50/70 dark:bg-zinc-900/30",
    tileBgHover: "hover:bg-slate-100/80 dark:hover:bg-zinc-900/60",
    badgeBg: "bg-slate-600",
    textColor: "text-slate-700 dark:text-zinc-300",
    accentHex: "#64748b",
  },
};

function getDarkerHex(hex: string): string {
  const colorMap: Record<string, string> = {
    "#ef4444": "#991b1b",
    "#8b5cf6": "#5b21b6",
    "#06b6d4": "#0e7490",
    "#f59e0b": "#b45309",
    "#3b82f6": "#1d4ed8",
    "#f97316": "#c2410c",
    "#10b981": "#047857",
    "#64748b": "#334155",
  };
  return colorMap[hex] || "#1e293b";
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
  hoveredDeal: Deal | null;
  setHoveredDeal: (deal: Deal | null) => void;
  searchQuery: string;
  matchesSearch: (deal: Deal) => boolean;
  isDriftEnabled: boolean;
  resetCounter: number;
}

function InteractiveBubblePod({
  pod,
  onSelectDeal,
  hoveredDeal,
  setHoveredDeal,
  searchQuery,
  matchesSearch,
  isDriftEnabled,
  resetCounter,
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
        onSelectDeal(node.deal);
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

  const gradId = `sphere-grad-${pod.categoryKey.replace(/[^a-zA-Z0-9]/g, "")}`;
  const darker = getDarkerHex(pod.config.accentHex);

  return (
    <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#121214] p-4 space-y-3 shadow-sm hover:border-slate-300 dark:hover:border-zinc-700 transition-all">
      <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-zinc-800/80">
        <div className="flex items-center space-x-2">
          <span
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: pod.config.accentHex }}
          />
          <span className="font-bold text-slate-900 dark:text-white text-sm">
            {pod.config.name}
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="text-right font-mono text-xs sm:text-sm">
            <span className="text-slate-900 dark:text-white font-extrabold">
              ${(pod.totalUsd / 1e9).toFixed(1)}B
            </span>
            <span className="text-slate-500 dark:text-zinc-400 ml-1 font-medium text-xs">
              ({pod.deals.length})
            </span>
          </div>
          <button
            onClick={handleResetPod}
            title="Reset positions in this pod"
            className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="relative">
        <svg
          ref={svgRef}
          viewBox="0 0 300 190"
          className="w-full h-auto bg-slate-50/60 dark:bg-[#09090b]/60 rounded-lg select-none block touch-none cursor-grab active:cursor-grabbing"
          style={{ minHeight: "170px" }}
          onPointerMove={handlePointerMove}
        >
          <defs>
            <radialGradient id={gradId} cx="35%" cy="30%" r="70%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.45" />
              <stop offset="35%" stopColor={pod.config.accentHex} stopOpacity="0.9" />
              <stop offset="100%" stopColor={darker} stopOpacity="1" />
            </radialGradient>
            <filter id={`glow-${gradId}`} x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.25" />
            </filter>
          </defs>

          {nodes.map((b, idx) => {
            const isHovered = hoveredDeal?.id === b.deal.id;
            const isBeingDragged = draggingId === b.deal.id;
            const matched = matchesSearch(b.deal);
            const opacity = searchQuery.trim() && !matched ? 0.15 : 0.95;

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
                className={`cursor-grab active:cursor-grabbing ${floatClass}`}
                style={{ opacity: isHovered || isBeingDragged ? 1 : opacity }}
                onPointerDown={(e) => handlePointerDown(e, b)}
                onPointerUp={(e) => handlePointerUp(e, b)}
                onMouseEnter={() => setHoveredDeal(b.deal)}
                onMouseLeave={() => setHoveredDeal(null)}
              >
                {/* Drag elevation aura */}
                {isBeingDragged && (
                  <circle
                    cx={b.x}
                    cy={b.y}
                    r={b.r + 5}
                    fill="none"
                    stroke={pod.config.accentHex}
                    strokeWidth="2"
                    strokeDasharray="4 3"
                    className="animate-spin opacity-80"
                  />
                )}

                <circle
                  cx={b.x}
                  cy={b.y}
                  r={isBeingDragged ? b.r + 2 : isHovered ? b.r + 1.5 : b.r}
                  fill={`url(#${gradId})`}
                  stroke={isBeingDragged ? "#ffffff" : isHovered ? "#ffffff" : pod.config.accentHex}
                  strokeWidth={isBeingDragged ? 2.5 : isHovered ? 2 : 1}
                  filter={`url(#glow-${gradId})`}
                  className="transition-transform duration-75"
                />

                {b.r >= 19 && (
                  <text
                    x={b.x}
                    y={b.y + 3.5}
                    textAnchor="middle"
                    fill="#ffffff"
                    fontSize={b.r >= 26 ? 11 : 9.5}
                    fontWeight="800"
                    fontFamily="Geist Mono, monospace"
                    className="pointer-events-none select-none drop-shadow-sm"
                  >
                    {b.deal.amount_display}
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        <div className="absolute bottom-1.5 right-2 pointer-events-none opacity-40 hover:opacity-80 transition-opacity">
          <span className="text-[10px] font-mono text-slate-500 dark:text-zinc-400 flex items-center gap-1">
            <Hand className="w-2.5 h-2.5" /> Draggable
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
}: GravityArenaProps) {
  const [nodes, setNodes] = useState<ArenaNode[]>([]);
  const [isSimRunning, setIsSimRunning] = useState(true);
  const [draggingId, setDraggingId] = useState<string | null>(null);

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
    const topDeals = [...deals]
      .sort((a, b) => b.amount_usd - a.amount_usd)
      .slice(0, 42);

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

  // Main 60FPS physics loop
  useEffect(() => {
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
  }, [isSimRunning, isDriftEnabled]);

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

  return (
    <div className="space-y-3">
      {/* HUD Header Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-1">
        <div className="flex items-center space-x-2 text-xs sm:text-sm font-semibold text-slate-700 dark:text-zinc-300">
          <Atom className="w-4 h-4 text-purple-500 animate-spin" />
          <span>Interactive Zero-G Arena: Click &amp; fling any bubble into space!</span>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsSimRunning(!isSimRunning)}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-800 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-700 shadow-sm"
          >
            {isSimRunning ? (
              <>
                <Pause className="w-3.5 h-3.5 text-amber-500" />
                <span>Pause Motion</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 text-emerald-500" />
                <span>Resume Motion</span>
              </>
            )}
          </button>
          <button
            onClick={initNodes}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-800 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-700 shadow-sm"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Recenter Arena</span>
          </button>
        </div>
      </div>

      {/* SVG Physics Arena Viewport */}
      <div className="relative w-full rounded-2xl border border-slate-200 dark:border-zinc-800 bg-[#070709] overflow-hidden shadow-inner">
        <svg
          ref={svgRef}
          viewBox="0 0 1000 560"
          className="w-full h-auto block select-none touch-none cursor-grab active:cursor-grabbing"
          style={{ minHeight: "440px" }}
          onPointerMove={handlePointerMove}
        >
          <defs>
            {Object.entries(CATEGORY_CONFIG).map(([key, config]) => {
              const gid = `arena-grad-${key.replace(/[^a-zA-Z0-9]/g, "")}`;
              const darker = getDarkerHex(config.accentHex);
              return (
                <radialGradient key={gid} id={gid} cx="35%" cy="30%" r="70%">
                  <stop offset="0%" stopColor="#ffffff" stopOpacity="0.5" />
                  <stop offset="40%" stopColor={config.accentHex} stopOpacity="0.9" />
                  <stop offset="100%" stopColor={darker} stopOpacity="1" />
                </radialGradient>
              );
            })}
            <filter id="arena-glow" x="-30%" y="-30%" width="160%" height="160%">
              <feDropShadow dx="0" dy="4" stdDeviation="5" floodOpacity="0.4" />
            </filter>
          </defs>

          {/* Background constellation grid lines */}
          <g opacity="0.1" stroke="#ffffff" strokeWidth="0.5" strokeDasharray="3 6">
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
            const gid = `arena-grad-${b.deal.category.replace(/[^a-zA-Z0-9]/g, "")}`;

            return (
              <g
                key={b.deal.id}
                className="cursor-grab active:cursor-grabbing"
                style={{ opacity: isHovered || isBeingDragged ? 1 : opacity }}
                onPointerDown={(e) => handlePointerDown(e, b)}
                onPointerUp={(e) => handlePointerUp(e, b)}
                onMouseEnter={() => setHoveredDeal(b.deal)}
                onMouseLeave={() => setHoveredDeal(null)}
              >
                {/* Dragging elevation halo */}
                {isBeingDragged && (
                  <circle
                    cx={b.x}
                    cy={b.y}
                    r={b.r + 7}
                    fill="none"
                    stroke="#ffffff"
                    strokeWidth="2.5"
                    strokeDasharray="6 4"
                    className="animate-spin opacity-90"
                  />
                )}

                <circle
                  cx={b.x}
                  cy={b.y}
                  r={isBeingDragged ? b.r + 3 : isHovered ? b.r + 2 : b.r}
                  fill={`url(#${gid})`}
                  stroke={isBeingDragged ? "#ffffff" : isHovered ? "#ffffff" : b.config.accentHex}
                  strokeWidth={isBeingDragged ? 3 : isHovered ? 2.5 : 1.2}
                  filter="url(#arena-glow)"
                />

                {/* Bubble Text */}
                {b.r >= 22 && (
                  <text
                    x={b.x}
                    y={b.r >= 34 ? b.y - 4 : b.y + 4}
                    textAnchor="middle"
                    fill="#ffffff"
                    fontSize={Math.min(13, Math.max(10, b.r / 3.4))}
                    fontWeight="800"
                    fontFamily="Geist Mono, monospace"
                    className="pointer-events-none select-none drop-shadow-md"
                  >
                    {b.deal.amount_display}
                  </text>
                )}

                {b.r >= 34 && (
                  <text
                    x={b.x}
                    y={b.y + 13}
                    textAnchor="middle"
                    fill="#ffffff"
                    opacity="0.9"
                    fontSize={Math.min(11, Math.max(9, b.r / 4.4))}
                    fontWeight="700"
                    fontFamily="Geist, sans-serif"
                    className="pointer-events-none select-none drop-shadow-md"
                  >
                    {b.deal.title.split(" ")[0]}
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        <div className="absolute bottom-3 left-4 pointer-events-none">
          <div className="flex items-center space-x-2 text-xs font-mono text-zinc-300 bg-zinc-950 px-3 py-1.5 rounded-lg border border-zinc-800">
            <Hand className="w-3.5 h-3.5 text-emerald-400" />
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
  const [isDriftEnabled, setIsDriftEnabled] = useState(true);
  const [resetCounter, setResetCounter] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);

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
      const valA = a.amount_usd > 0 ? a.amount_usd : 100e6;
      const valB = b.amount_usd > 0 ? b.amount_usd : 100e6;
      return valB - valA;
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

      const totalVal = list.reduce((s, it) => s + (it.amount_usd > 0 ? it.amount_usd : 100e6), 0);
      let runningSum = 0;
      let splitIdx = 0;

      for (let i = 0; i < list.length; i++) {
        runningSum += list[i].amount_usd > 0 ? list[i].amount_usd : 100e6;
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
      { key: "2023", label: "2023 & Prior", subtitle: "Pre-Bubble Base" },
      { key: "2024", label: "2024 Inflection", subtitle: "$382B Disclosed" },
      { key: "2025", label: "2025 Capex Surge", subtitle: "$1.42T Committed" },
      { key: "2026", label: "2026 Gigawatt Era", subtitle: "$920B Run-rate" },
    ];

    return years.map((y) => {
      const yearDeals = filteredDeals
        .filter((d) => {
          if (y.key === "2023") return d.year <= 2023;
          return d.year.toString() === y.key;
        })
        .sort((a, b) => b.amount_usd - a.amount_usd);

      const total = yearDeals.reduce((sum, d) => sum + d.amount_usd, 0);

      return {
        ...y,
        deals: yearDeals,
        totalUsd: total,
      };
    });
  }, [filteredDeals, viewMode]);

  return (
    <div
      ref={containerRef}
      className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#121214] overflow-hidden transition-colors shadow-sm"
    >
      {/* Top Header Bar & Mode Selector */}
      <div className="p-5 sm:p-6 border-b border-slate-200 dark:border-zinc-800 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-xs sm:text-sm font-semibold text-slate-600 dark:text-zinc-400">
              <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center space-x-1.5">
                <Sparkles className="w-4 h-4" />
                <span>Capital Allocation Universe</span>
              </span>
              <span>•</span>
              <span className="text-slate-800 dark:text-zinc-200">100% Verified Disclosures</span>
              <span>•</span>
              <span className="text-slate-900 dark:text-white font-extrabold font-tabular">
                {filteredDeals.length} Deals (${(totalFilteredUsd / 1e12).toFixed(2)}T)
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-1">
              Institutional Capital Allocation Matrix (Area = Disclosed USD)
            </h2>
          </div>

          {/* View Mode Segmented Controls - 2-col on mobile, flex on desktop */}
          <div className="grid grid-cols-2 sm:flex items-center gap-1 p-1 sm:p-1.5 rounded-xl bg-slate-100 dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 w-full sm:w-auto">
            <button
              onClick={() => setViewMode("treemap")}
              className={`flex items-center justify-center space-x-1.5 sm:space-x-2 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-bold transition-all ${
                viewMode === "treemap"
                  ? "bg-white dark:bg-zinc-800 text-slate-900 dark:text-white shadow-xs"
                  : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-500 shrink-0" />
              <span>Capital Treemap</span>
            </button>
            <button
              onClick={() => setViewMode("bubbles")}
              className={`flex items-center justify-center space-x-1.5 sm:space-x-2 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-bold transition-all ${
                viewMode === "bubbles"
                  ? "bg-white dark:bg-zinc-800 text-slate-900 dark:text-white shadow-xs"
                  : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <CircleDot className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-500 shrink-0" />
              <span>Bubble Pods</span>
            </button>
            <button
              onClick={() => setViewMode("arena")}
              className={`flex items-center justify-center space-x-1.5 sm:space-x-2 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-bold transition-all ${
                viewMode === "arena"
                  ? "bg-white dark:bg-zinc-800 text-slate-900 dark:text-white shadow-xs"
                  : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Atom className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-cyan-400 shrink-0" />
              <span>Gravity Arena</span>
            </button>
            <button
              onClick={() => setViewMode("timeline")}
              className={`flex items-center justify-center space-x-1.5 sm:space-x-2 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-bold transition-all ${
                viewMode === "timeline"
                  ? "bg-white dark:bg-zinc-800 text-slate-900 dark:text-white shadow-xs"
                  : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-500 shrink-0" />
              <span>Timeline Flow</span>
            </button>
          </div>
        </div>

        {/* Filter Controls: Search & Volume Thresholds */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          {/* Quick Search */}
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 dark:text-zinc-500 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Filter company, project, or amount..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 sm:py-2.5 text-xs sm:text-sm font-medium rounded-xl border border-slate-300 dark:border-zinc-700 bg-slate-50 dark:bg-[#09090b] text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-white font-bold"
              >
                ✕
              </button>
            )}
          </div>

          {/* Size Filter Pills with horizontal scroll on mobile */}
          <div className="flex items-center space-x-1.5 text-xs sm:text-sm overflow-x-auto scrollbar-none pb-0.5 touch-pan-x">
            <span className="text-xs font-bold text-slate-600 dark:text-zinc-400 mr-1 shrink-0 hidden md:inline">
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
                className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-bold whitespace-nowrap transition-all shrink-0 ${
                  minVolume === t.id
                    ? "bg-slate-900 text-white dark:bg-white dark:text-zinc-950 shadow-xs"
                    : "bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-zinc-300 hover:bg-slate-200 dark:hover:bg-zinc-700"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Sector Pills Strip */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none text-xs sm:text-sm touch-pan-x">
          <button
            onClick={() => setSelectedCat("All")}
            className={`whitespace-nowrap px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              selectedCat === "All"
                ? "bg-slate-900 text-white dark:bg-white dark:text-zinc-950 shadow-sm"
                : "bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-zinc-700"
            }`}
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
                className={`whitespace-nowrap px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center space-x-2 ${
                  isSelected
                    ? "bg-slate-900 text-white dark:bg-white dark:text-zinc-950 shadow-sm"
                    : "bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-zinc-700"
                }`}
              >
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: config.accentHex }} />
                <span>{config.name}</span>
                <span className="text-xs opacity-75">({count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Physics & Drift Controls Bar for Bubble Views */}
      {(viewMode === "bubbles" || viewMode === "arena") && (
        <div className="px-5 sm:px-6 py-2.5 bg-slate-100/70 dark:bg-zinc-900/60 border-b border-slate-200 dark:border-zinc-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-2 text-slate-700 dark:text-zinc-300 font-medium">
            <Hand className="w-4 h-4 text-emerald-500 animate-pulse" />
            <span>Interactive Drag Physics: Drag any bubble to move it and push other deals.</span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsDriftEnabled(!isDriftEnabled)}
              className="flex items-center space-x-1 px-2.5 py-1 rounded-md font-semibold bg-white dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 hover:bg-slate-50 dark:hover:bg-zinc-750 text-slate-800 dark:text-zinc-200 shadow-sm transition-all"
            >
              {isDriftEnabled ? (
                <>
                  <Pause className="w-3 h-3 text-amber-500" />
                  <span>Float Drift: ON</span>
                </>
              ) : (
                <>
                  <Play className="w-3 h-3 text-emerald-500" />
                  <span>Float Drift: PAUSED</span>
                </>
              )}
            </button>
            <button
              onClick={() => setResetCounter((c) => c + 1)}
              className="flex items-center space-x-1 px-2.5 py-1 rounded-md font-semibold bg-white dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 hover:bg-slate-50 dark:hover:bg-zinc-750 text-slate-800 dark:text-zinc-200 shadow-sm transition-all"
            >
              <RotateCcw className="w-3 h-3 text-slate-500" />
              <span>Reset Positions</span>
            </button>
          </div>
        </div>
      )}

      {/* Visual Canvas Viewport */}
      <div className="relative p-3 sm:p-4 bg-slate-50/50 dark:bg-[#09090b] overflow-hidden">
        {/* VIEW 1: SQUARIFIED CAPITAL TREEMAP */}
        {viewMode === "treemap" && (
          <div className="relative w-full overflow-hidden rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#09090b]">
            <svg
              viewBox="0 0 1000 560"
              className="w-full h-auto block select-none"
              style={{ minHeight: "440px" }}
            >
              {treemapTiles.map((tile) => {
                const config = CATEGORY_CONFIG[tile.category] || CATEGORY_CONFIG["Other"];
                const matched = matchesSearch(tile.deal);
                const isHovered = hoveredDeal?.id === tile.deal.id;
                const opacity = searchQuery.trim() && !matched ? 0.15 : 1;

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

                const canShowAmount = tile.w >= 50 && tile.h >= 32;
                const canShowTitle = tile.w >= 70 && tile.h >= 45;

                return (
                  <g
                    key={tile.deal.id}
                    className="cursor-pointer transition-opacity duration-150"
                    style={{ opacity }}
                    onClick={() => onSelectDeal(tile.deal)}
                    onMouseEnter={() => setHoveredDeal(tile.deal)}
                    onMouseLeave={() => setHoveredDeal(null)}
                  >
                    <rect
                      x={tile.x + 1}
                      y={tile.y + 1}
                      width={Math.max(0, tile.w - 2)}
                      height={Math.max(0, tile.h - 2)}
                      fill={config.accentHex}
                      fillOpacity={isHovered ? 0.95 : 0.78}
                      stroke={isHovered ? "#ffffff" : "#09090b"}
                      strokeWidth={isHovered ? 2 : 1}
                      rx={3}
                    />

                    {canShowTitle && (
                      <text
                        x={tile.x + tile.w / 2}
                        y={canShowAmount ? tile.y + tile.h / 2 - 5 : tile.y + tile.h / 2 + 4}
                        textAnchor="middle"
                        fill="#ffffff"
                        fontSize={Math.min(15, Math.max(12, tile.w / 11))}
                        fontWeight="800"
                        fontFamily="Geist, sans-serif"
                        className="pointer-events-none select-none drop-shadow-md"
                      >
                        {shortTitle.slice(0, Math.floor(tile.w / 7.5))}
                      </text>
                    )}

                    {canShowAmount && (
                      <text
                        x={tile.x + tile.w / 2}
                        y={tile.y + tile.h / 2 + (canShowTitle ? 13 : 4)}
                        textAnchor="middle"
                        fill="#ffffff"
                        fontSize={Math.min(14, Math.max(11, tile.w / 12))}
                        fontWeight="800"
                        fontFamily="Geist Mono, monospace"
                        opacity={1}
                        className="pointer-events-none select-none drop-shadow-md"
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
                hoveredDeal={hoveredDeal}
                setHoveredDeal={setHoveredDeal}
                searchQuery={searchQuery}
                matchesSearch={matchesSearch}
                isDriftEnabled={isDriftEnabled}
                resetCounter={resetCounter}
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
          />
        )}

        {/* VIEW 4: TIMELINE FLOW MATRIX */}
        {viewMode === "timeline" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {timelineColumns.map((col) => (
              <div
                key={col.key}
                className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#121214] p-4 space-y-3 shadow-sm flex flex-col justify-between"
              >
                <div className="pb-2 border-b border-slate-100 dark:border-zinc-800">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 dark:text-white text-base">
                      {col.label}
                    </span>
                    <span className="text-xs sm:text-sm font-mono font-extrabold text-emerald-600 dark:text-emerald-400">
                      ${(col.totalUsd / 1e9).toFixed(1)}B
                    </span>
                  </div>
                  <span className="text-xs text-slate-600 dark:text-zinc-400 font-medium">
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
                        className={`p-2.5 rounded-lg border border-slate-100 dark:border-zinc-800/80 bg-slate-50 dark:bg-[#09090b] hover:border-slate-300 dark:hover:border-zinc-700 cursor-pointer transition-all space-y-1`}
                      >
                        <div className="flex items-center justify-between text-xs font-mono">
                          <span
                            className="px-2.5 py-0.5 rounded font-bold text-white text-xs"
                            style={{ backgroundColor: config.accentHex }}
                          >
                            {deal.amount_display}
                          </span>
                          <span className="text-slate-500 dark:text-zinc-400 text-xs">
                            {deal.announced_date}
                          </span>
                        </div>
                        <h4 className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-zinc-200 line-clamp-1">
                          {deal.title}
                        </h4>
                      </div>
                    );
                  })}
                  {col.deals.length > 10 && (
                    <div className="text-center text-xs font-semibold text-slate-500 dark:text-zinc-400 pt-1">
                      + {col.deals.length - 10} more in ledger
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Live Hover Inspection Popover Card */}
        {hoveredDeal && (
          <div className="mt-3 p-4 rounded-2xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-[#121214] shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-sm">
            <div className="space-y-1.5 flex-1">
              <div className="flex items-center space-x-2.5">
                <span className="font-extrabold text-slate-900 dark:text-white text-base sm:text-lg">
                  {hoveredDeal.title}
                </span>
                <span className="font-mono font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-0.5 rounded-lg border border-emerald-200 dark:border-emerald-900/60 text-sm">
                  {hoveredDeal.amount_display}
                </span>
              </div>
              <p className="text-slate-700 dark:text-zinc-300 text-sm line-clamp-1 font-sans">
                {hoveredDeal.description}
              </p>
            </div>

            <button
              onClick={() => onSelectDeal(hoveredDeal)}
              className="shrink-0 flex items-center space-x-1.5 px-4 py-2 rounded-xl text-sm font-bold bg-slate-900 text-white dark:bg-white dark:text-zinc-950 hover:opacity-90 transition-opacity shadow-sm"
            >
              <span>Inspect Disclosure</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </button>
          </div>
        )}
      </div>

      {/* Footer Meta & Stats */}
      <div className="p-4 sm:p-5 border-t border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#121214] flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex items-center space-x-2 text-xs sm:text-sm font-medium text-slate-700 dark:text-zinc-300">
          <Layers className="w-4 h-4 text-emerald-500" />
          <span>Click any block or bubble to inspect SEC filings &amp; audited disclosures.</span>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm">
          <span className="px-3 py-1 rounded-lg font-bold bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900/60">
            {deals.filter((d) => d.is_debt).length} Debt Deals
          </span>
          <span className="px-3 py-1 rounded-lg font-bold bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-900/60">
            {deals.filter((d) => d.category === "Bets & rounds").length} Equity Rounds
          </span>
          <span className="px-3 py-1 rounded-lg font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/60">
            Total Disclosed: ${(deals.reduce((acc, d) => acc + (d.amount_usd || 0), 0) / 1e12).toFixed(2)}T
          </span>
        </div>
      </div>
    </div>
  );
}
