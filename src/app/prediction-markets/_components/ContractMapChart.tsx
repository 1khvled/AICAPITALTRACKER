"use client";

import React, { useState, useMemo, useId, useEffect } from "react";
import {
  getChartAriaProps,
  generateChartDescription,
  ChartAnnouncer,
} from "@/lib/chart-a11y";
import {
  ArrowUpRight,
  Filter,
  ArrowUpDown,
  ExternalLink,
  Layers,
  Sparkles,
  Info,
} from "lucide-react";

export interface ContractPoint {
  id: string;
  title: string;
  category: "Bubble & Downturn" | "Debt & Sovereign" | "Frontier Labs" | "Macro Tech" | string;
  yesProbabilityPct: number;
  volumeUsd: number;
  liquidityUsd: number;
  referralUrl: string;
  closed?: boolean;
  deadline?: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  "Bubble & Downturn": "var(--c-cat-teal)",
  "Debt & Sovereign": "var(--c-cat-olive)",
  "Frontier Labs": "var(--c-cat-navy)",
  "Macro Tech": "var(--c-cat-cyan)",
};

function fmtUsd(v: number): string {
  if (v >= 1e6) return `$${(v / 1e6).toFixed(2)}M`;
  if (v >= 1e3) return `$${(v / 1e3).toFixed(1)}K`;
  return `$${Math.round(v)}`;
}

export function ContractMapChart({
  contracts,
}: {
  contracts: ContractPoint[];
}) {
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [sortBy, setSortBy] = useState<"volume" | "prob" | "liquidity">("volume");
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSelectedId(null);
        setHoveredId(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const categories = ["All", "Bubble & Downturn", "Debt & Sovereign", "Frontier Labs", "Macro Tech"];

  // Filtered & sorted contracts
  const filtered = useMemo(() => {
    let list = contracts;
    if (selectedCategory !== "All") {
      list = list.filter((c) => c.category === selectedCategory);
    }
    return [...list].sort((a, b) => {
      if (sortBy === "volume") return b.volumeUsd - a.volumeUsd;
      if (sortBy === "prob") return b.yesProbabilityPct - a.yesProbabilityPct;
      if (sortBy === "liquidity") return b.liquidityUsd - a.liquidityUsd;
      return 0;
    });
  }, [contracts, selectedCategory, sortBy]);

  const activeId = hoveredId || selectedId || filtered[0]?.id;
  const activeContract = contracts.find((c) => c.id === activeId) || filtered[0];

  // SVG Geometry
  const width = 860;
  const height = 400;
  const pad = { top: 35, right: 40, bottom: 50, left: 75 };
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;

  // Scale functions: X = YES prob (0% to 45%), Y = Log Volume ($1K to $10M)
  const minX = 0;
  const maxX = 45;
  const scaleX = (prob: number) => pad.left + (Math.min(maxX, Math.max(minX, prob)) / (maxX - minX)) * innerW;

  const minLogVol = 3; // log10(1,000)
  const maxLogVol = 7; // log10(10,000,000)
  const scaleY = (vol: number) => {
    const clamped = Math.max(1000, Math.min(10_000_000, vol));
    const logVal = Math.log10(clamped);
    const fraction = (logVal - minLogVol) / (maxLogVol - minLogVol);
    return pad.top + innerH - fraction * innerH;
  };

  const scaleRadius = (liq: number) => {
    // Sized by liquidity
    return Math.max(6, Math.min(22, Math.sqrt(Math.max(500, liq) / 300)));
  };

  const chartUid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const chartTitleId = `${chartUid}-title`;
  const chartDescId = `${chartUid}-desc`;
  const chartTitle = `Contract Map — ${contracts.length} Polymarket Contracts by YES Probability, Volume and Liquidity`;

  const chartDescription = useMemo(
    () =>
      generateChartDescription({
        title: chartTitle,
        kind: "scatter",
        series: [
          {
            name: "Prediction Contracts",
            points: filtered.map((c) => ({
              x: `${c.title} (${c.yesProbabilityPct.toFixed(1)}%)`,
              y: c.volumeUsd,
            })),
          },
        ],
        formatValue: (v) => fmtUsd(v),
      }),
    [chartTitle, filtered]
  );

  const chartAria = getChartAriaProps({
    title: chartTitle,
    description: chartDescription,
    labelledBy: chartTitleId,
    describedBy: chartDescId,
  });

  const announcerText = activeContract
    ? `${activeContract.title}: ${activeContract.yesProbabilityPct.toFixed(1)}% YES, Volume: ${fmtUsd(activeContract.volumeUsd)}, Liquidity: ${fmtUsd(activeContract.liquidityUsd)} (${activeContract.category}).`
    : `Contract Map displaying ${filtered.length} contracts.`;

  const yTicks = [
    { val: 10_000_000, label: "$10M" },
    { val: 1_000_000, label: "$1M" },
    { val: 100_000, label: "$100K" },
    { val: 10_000, label: "$10K" },
    { val: 1_000, label: "$1K" },
  ];

  const xTicks = [0, 5, 10, 15, 20, 25, 30, 35, 40];

  return (
    <figure className="m-0 space-y-4">
      <ChartAnnouncer message={announcerText} />

      {/* Header bar with filters and sorting */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between border-b border-rule pb-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="label">Capital Reality Visualisation</span>
            <span className="pill">{filtered.length} Contracts</span>
            <span className="num text-[14px] font-semibold text-ink">
              {fmtUsd(filtered.reduce((s, c) => s + c.volumeUsd, 0))} Traded
            </span>
          </div>
          <h3 className="text-lg sm:text-xl font-bold tracking-tight text-ink mt-1">
            Contract Map: Where Real Capital is Committed
          </h3>
          <p className="text-[14px] text-ink-muted">
            YES probability (X) vs. Traded Volume (Y log scale). Bubble radius encodes depth / liquidity.
            Distinguishes high-conviction markets from thin books.
          </p>
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap items-center gap-1.5 self-start lg:self-auto">
          {categories.map((cat) => {
            const active = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`min-h-[44px] px-3 py-1.5 rounded-lg border text-[13px] font-medium transition-colors ${
                  active
                    ? "border-ink bg-ink text-canvas font-semibold"
                    : "border-rule bg-surface text-ink-muted hover:border-rule-strong hover:text-ink"
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Map + Inspector Card */}
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_22rem] gap-6 items-start">
        {/* SVG Scatter/Bubble Canvas */}
        <div className="overflow-x-auto rounded-xl border border-rule bg-surface-2 p-3 sm:p-5">
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="w-full h-auto min-w-[580px] select-none"
            {...chartAria}
          >
            <title id={chartTitleId}>{chartTitle}</title>
            <desc id={chartDescId}>{chartDescription}</desc>

            {/* Y-Axis Gridlines & Labels */}
            {yTicks.map(({ val, label }) => {
              const y = scaleY(val);
              return (
                <g key={val}>
                  <line
                    x1={pad.left}
                    y1={y}
                    x2={width - pad.right}
                    y2={y}
                    stroke="rgb(var(--c-rule))"
                    strokeDasharray="2 3"
                    strokeWidth="1"
                  />
                  <text
                    x={pad.left - 10}
                    y={y + 4}
                    textAnchor="end"
                    className="num fill-ink-muted text-[12px]"
                  >
                    {label}
                  </text>
                </g>
              );
            })}

            {/* X-Axis Gridlines & Labels */}
            {xTicks.map((tick) => {
              const x = scaleX(tick);
              return (
                <g key={tick}>
                  <line
                    x1={x}
                    y1={pad.top}
                    x2={x}
                    y2={height - pad.bottom}
                    stroke="rgb(var(--c-rule))"
                    strokeDasharray="2 3"
                    strokeWidth="1"
                  />
                  <text
                    x={x}
                    y={height - pad.bottom + 20}
                    textAnchor="middle"
                    className="num fill-ink-subtle text-[12px]"
                  >
                    {tick}%
                  </text>
                </g>
              );
            })}

            {/* Axis Titles */}
            <text
              x={pad.left}
              y={20}
              className="num fill-ink-subtle text-[12px] font-semibold uppercase tracking-wider"
            >
              Traded Volume (USD, Log Scale)
            </text>
            <text
              x={width - pad.right}
              y={height - pad.bottom + 38}
              textAnchor="end"
              className="num fill-ink-subtle text-[12px] font-semibold uppercase tracking-wider"
            >
              YES Probability (%)
            </text>

            {/* 1M Volume Benchmark Line */}
            <line
              x1={pad.left}
              y1={scaleY(1_000_000)}
              x2={width - pad.right}
              y2={scaleY(1_000_000)}
              stroke="rgb(var(--c-ink))"
              strokeWidth="1"
              strokeDasharray="4 4"
              opacity="0.4"
            />
            <text
              x={width - pad.right - 5}
              y={scaleY(1_000_000) - 5}
              textAnchor="end"
              className="fill-ink-faint text-[12px] uppercase font-mono"
            >
              $1M Full-Weight Threshold
            </text>

            {/* Bubbles */}
            {filtered.map((c) => {
              const cx = scaleX(c.yesProbabilityPct);
              const cy = scaleY(c.volumeUsd);
              const r = scaleRadius(c.liquidityUsd);
              const isSelected = activeId === c.id;
              const color = CATEGORY_COLORS[c.category] || "var(--c-cat-steel)";

              return (
                <g
                  key={c.id}
                  className="cursor-pointer focus:outline-none"
                  tabIndex={0}
                  role="button"
                  onClick={() => setSelectedId(selectedId === c.id ? null : c.id)}
                  onMouseEnter={() => setHoveredId(c.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  onFocus={() => setSelectedId(c.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setSelectedId(selectedId === c.id ? null : c.id);
                    } else if (e.key === "Escape") {
                      e.preventDefault();
                      setSelectedId(null);
                      setHoveredId(null);
                    }
                  }}
                  aria-label={`${c.title}: ${c.yesProbabilityPct.toFixed(1)}% YES, Volume ${fmtUsd(c.volumeUsd)}`}
                >
                  {/* Selection Ring */}
                  {isSelected && (
                    <circle
                      cx={cx}
                      cy={cy}
                      r={r + 5}
                      fill="none"
                      stroke="rgb(var(--c-ink))"
                      strokeWidth={2}
                      strokeDasharray="3 2"
                    />
                  )}

                  {/* Bubble fill */}
                  <circle
                    cx={cx}
                    cy={cy}
                    r={r}
                    fill={color}
                    fillOpacity={isSelected ? 0.95 : 0.75}
                    stroke="rgb(var(--c-canvas))"
                    strokeWidth={1.5}
                  />

                  {/* Inline label for significant volume */}
                  {c.volumeUsd >= 500_000 && (
                    <text
                      x={cx}
                      y={cy - r - 4}
                      textAnchor="middle"
                      className="fill-ink text-[12px] font-semibold pointer-events-none drop-shadow-sm"
                    >
                      {c.title.length > 20 ? c.title.slice(0, 18) + "…" : c.title}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>

          {/* Legend */}
          <div className="mt-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t border-rule pt-2 text-[13px]">
            <div className="flex flex-wrap items-center gap-3">
              {Object.entries(CATEGORY_COLORS).map(([cat, col]) => (
                <span key={cat} className="flex items-center gap-1.5 text-ink-muted">
                  <span
                    className="w-2.5 h-2.5 rounded-full inline-block shrink-0"
                    style={{ backgroundColor: col }}
                    aria-hidden="true"
                  />
                  <span>{cat}</span>
                </span>
              ))}
            </div>

            <span className="text-ink-subtle text-[12px]">
              Bubble size represents available book liquidity.
            </span>
          </div>
        </div>

        {/* Selected / Hovered Contract Inspector */}
        {activeContract && (
          <div className="card space-y-3.5 border-t-2 border-t-ink">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="pill">{activeContract.category}</span>
                {activeContract.volumeUsd >= 1_000_000 ? (
                  <span className="pill pill-safe">High Volume</span>
                ) : (
                  <span className="pill text-[12px]">Thin Book</span>
                )}
                {activeContract.closed && <span className="pill pill-risk">Closed</span>}
              </div>

              <h4 className="text-base font-bold text-ink leading-snug pt-1">
                {activeContract.title}
              </h4>
            </div>

            <dl className="grid grid-cols-2 gap-2 rounded-lg border border-rule bg-surface-2 p-2.5 text-[13px]">
              <div>
                <dt className="label">YES Odds</dt>
                <dd className="num font-bold text-xl text-ink mt-0.5">
                  {activeContract.yesProbabilityPct.toFixed(1)}%
                </dd>
              </div>
              <div>
                <dt className="label">Traded Volume</dt>
                <dd className="num font-semibold text-lg text-ink mt-0.5">
                  {fmtUsd(activeContract.volumeUsd)}
                </dd>
              </div>
              <div>
                <dt className="label">Liquidity</dt>
                <dd className="num font-medium text-ink mt-0.5">
                  {fmtUsd(activeContract.liquidityUsd)}
                </dd>
              </div>
              <div>
                <dt className="label">Contract Status</dt>
                <dd className="font-medium text-ink mt-0.5">
                  {activeContract.closed ? "Resolved" : "Active Book"}
                </dd>
              </div>
            </dl>

            <div className="pt-1">
              <a
                href={activeContract.referralUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary w-full min-h-[44px] flex items-center justify-center gap-1.5 text-[13px]"
              >
                <span>Trade this Contract on Polymarket</span>
                <ArrowUpRight className="w-4 h-4" aria-hidden="true" />
              </a>
            </div>
          </div>
        )}
      </div>

      {/* Accessible Table Fallback */}
      <div className="overflow-x-auto rounded-xl border border-rule">
        <table className="w-full text-left text-[14px]">
          <caption className="sr-only">
            Contract Map Data: Every Polymarket Contract plotted by YES Probability, Volume, and Liquidity.
          </caption>
          <thead className="bg-surface-2 text-ink-subtle">
            <tr>
              <th scope="col" className="p-3 font-medium">Contract</th>
              <th scope="col" className="p-3 font-medium">Category</th>
              <th scope="col" className="p-3 text-right font-medium">YES (%)</th>
              <th scope="col" className="p-3 text-right font-medium">Volume</th>
              <th scope="col" className="p-3 text-right font-medium">Liquidity</th>
              <th scope="col" className="p-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-rule">
            {filtered.map((c) => (
              <tr key={c.id} className="hover:bg-surface-2/40">
                <th scope="row" className="p-3 font-semibold text-ink max-w-sm">
                  <a
                    href={c.referralUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline flex items-center gap-1"
                  >
                    <span>{c.title}</span>
                    <ExternalLink className="w-3 h-3 text-ink-subtle shrink-0" />
                  </a>
                </th>
                <td className="p-3 text-ink-muted whitespace-nowrap">{c.category}</td>
                <td className="num p-3 text-right font-bold text-ink whitespace-nowrap">
                  {c.yesProbabilityPct.toFixed(1)}%
                </td>
                <td className="num p-3 text-right font-semibold text-ink whitespace-nowrap">
                  {fmtUsd(c.volumeUsd)}
                </td>
                <td className="num p-3 text-right text-ink-muted whitespace-nowrap">
                  {fmtUsd(c.liquidityUsd)}
                </td>
                <td className="p-3 whitespace-nowrap">
                  {c.closed ? (
                    <span className="pill pill-risk text-[13px]">Closed</span>
                  ) : (
                    <span className="pill pill-safe text-[13px]">Open</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </figure>
  );
}
