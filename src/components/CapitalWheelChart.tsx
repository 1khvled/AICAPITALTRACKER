"use client";

import React, { useState, useMemo, useId, useCallback, useEffect } from "react";
import Link from "next/link";
import rawDeals from "@/data/deals.json";
import {
  getChartAriaProps,
  generateChartDescription,
  ChartAnnouncer,
} from "@/lib/chart-a11y";
import {
  PieChart,
  ShieldAlert,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  RotateCcw,
  Info,
  Filter,
  CheckCircle2,
  X,
} from "lucide-react";

export interface DealRecord {
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

export interface CategorySummary {
  category: string;
  totalUsd: number;
  sharePct: number;
  dealCount: number;
  debtUsd: number;
  debtSharePct: number;
  equityUsd: number;
  circularCount: number;
  circularUsd: number;
  deals: DealRecord[];
  colorHex: string;
  startAngle: number;
  endAngle: number;
  midAngle: number;
}

const CATEGORY_COLORS: Record<string, string> = {
  "Compute contracts": "var(--c-cat-cyan)",
  "Big construction": "var(--c-cat-steel)",
  "Bets & rounds": "var(--c-cat-navy)",
  "Buyouts & mergers": "var(--c-cat-sand)",
  "Other": "rgb(var(--c-ink-subtle))",
  "Borrowed": "var(--c-cat-teal)",
  "Power & land": "var(--c-cat-olive)",
  "Share sales": "rgb(var(--c-ink-muted))",
  "Compute & cloud": "var(--c-cat-cyan)",
};

function formatUsdShort(value: number): string {
  if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
  if (value >= 1e9) return `$${(value / 1e9).toFixed(1)}B`;
  if (value >= 1e6) return `$${Math.round(value / 1e6)}M`;
  return `$${value.toLocaleString()}`;
}

function polarToCartesian(
  centerX: number,
  centerY: number,
  radius: number,
  angleInDegrees: number
) {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians),
  };
}

function describeArc(
  x: number,
  y: number,
  innerRadius: number,
  outerRadius: number,
  startAngle: number,
  endAngle: number
): string {
  // Clamp to avoid 360-degree SVG full circle degeneracies
  const safeEndAngle = Math.min(endAngle, startAngle + 359.99);
  const startOuter = polarToCartesian(x, y, outerRadius, startAngle);
  const endOuter = polarToCartesian(x, y, outerRadius, safeEndAngle);
  const startInner = polarToCartesian(x, y, innerRadius, safeEndAngle);
  const endInner = polarToCartesian(x, y, innerRadius, startAngle);

  const largeArcFlag = safeEndAngle - startAngle <= 180 ? "0" : "1";

  return [
    `M ${startOuter.x.toFixed(2)} ${startOuter.y.toFixed(2)}`,
    `A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 1 ${endOuter.x.toFixed(2)} ${endOuter.y.toFixed(2)}`,
    `L ${startInner.x.toFixed(2)} ${startInner.y.toFixed(2)}`,
    `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${endInner.x.toFixed(2)} ${endInner.y.toFixed(2)}`,
    "Z",
  ].join(" ");
}

export function CapitalWheelChart({
  onSelectCategory,
  selectedCategory: externalSelectedCategory,
  deals: externalDeals,
  onSelectDeal,
}: {
  onSelectCategory?: (category: string | null) => void;
  selectedCategory?: string | null;
  deals?: DealRecord[];
  onSelectDeal?: (deal: DealRecord) => void;
}) {
  const [internalSelected, setInternalSelected] = useState<string | null>(null);
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const [keyboardIndex, setKeyboardIndex] = useState<number | null>(null);

  const activeCategory = externalSelectedCategory !== undefined
    ? externalSelectedCategory
    : internalSelected;

  const deals = (externalDeals ?? rawDeals) as unknown as DealRecord[];

  const { categories, grandTotal, totalDealsCount, totalCircularCount, totalCircularUsd, totalDebtUsd } = useMemo(() => {
    const map = new Map<string, { total: number; count: number; debt: number; circularCount: number; circularSum: number; deals: DealRecord[] }>();

    let gTotal = 0;
    let circCount = 0;
    let circSum = 0;
    let debtSum = 0;

    deals.forEach((d) => {
      const cat = d.category || "Other";
      const amt = d.amount_usd || 0;
      gTotal += amt;
      if (d.is_debt) debtSum += amt;
      if (d.is_circular) {
        circCount += 1;
        circSum += amt;
      }

      if (!map.has(cat)) {
        map.set(cat, { total: 0, count: 0, debt: 0, circularCount: 0, circularSum: 0, deals: [] });
      }
      const entry = map.get(cat)!;
      entry.total += amt;
      entry.count += 1;
      entry.deals.push(d);
      if (d.is_debt) entry.debt += amt;
      if (d.is_circular) {
        entry.circularCount += 1;
        entry.circularSum += amt;
      }
    });

    // Sort categories descending by volume
    const sorted = Array.from(map.entries()).sort((a, b) => b[1].total - a[1].total);

    let currentAngle = 0;
    const paddingAngle = 1.2; // degrees gap between segments

    const catList: CategorySummary[] = sorted.map(([category, data]) => {
      const sharePct = gTotal > 0 ? (data.total / gTotal) * 100 : 0;
      const angleSpan = (sharePct / 100) * 360;
      const startAngle = currentAngle + paddingAngle / 2;
      const endAngle = currentAngle + angleSpan - paddingAngle / 2;
      const midAngle = (startAngle + endAngle) / 2;
      currentAngle += angleSpan;

      const debtSharePct = data.total > 0 ? (data.debt / data.total) * 100 : 0;

      return {
        category,
        totalUsd: data.total,
        sharePct,
        dealCount: data.count,
        debtUsd: data.debt,
        debtSharePct,
        equityUsd: data.total - data.debt,
        circularCount: data.circularCount,
        circularUsd: data.circularSum,
        deals: data.deals,
        colorHex: CATEGORY_COLORS[category] || "var(--c-cat-steel)",
        startAngle,
        endAngle,
        midAngle,
      };
    });

    return {
      categories: catList,
      grandTotal: gTotal,
      totalDealsCount: deals.length,
      totalCircularCount: circCount,
      totalCircularUsd: circSum,
      totalDebtUsd: debtSum,
    };
  }, [deals]);

  const selectCat = useCallback(
    (cat: string | null) => {
      setInternalSelected(cat);
      onSelectCategory?.(cat);
    },
    [onSelectCategory]
  );

  // Keyboard navigation across segments
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (categories.length === 0) return;
    if (e.key === "Escape") {
      selectCat(null);
      setHoveredCategory(null);
      setKeyboardIndex(null);
      return;
    }
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault();
      const nextIdx = keyboardIndex === null ? 0 : (keyboardIndex + 1) % categories.length;
      setKeyboardIndex(nextIdx);
      setHoveredCategory(categories[nextIdx].category);
      return;
    }
    if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      const prevIdx =
        keyboardIndex === null ? categories.length - 1 : (keyboardIndex - 1 + categories.length) % categories.length;
      setKeyboardIndex(prevIdx);
      setHoveredCategory(categories[prevIdx].category);
      return;
    }
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (keyboardIndex !== null) {
        const cat = categories[keyboardIndex].category;
        selectCat(activeCategory === cat ? null : cat);
      }
    }
  };

  const chartUid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const chartTitleId = `${chartUid}-title`;
  const chartDescId = `${chartUid}-desc`;
  const chartTitle = `Capital Wheel — Radial Architecture of the ${totalDealsCount}-Deal Ledger ($${(grandTotal / 1e12).toFixed(2)}T)`;

  const chartDescription = useMemo(() => {
    return generateChartDescription({
      title: chartTitle,
      kind: "category",
      series: [
        {
          name: "Ledger Categories",
          points: categories.map((c) => ({
            x: c.category,
            y: c.totalUsd,
          })),
        },
      ],
      formatValue: (v) => formatUsdShort(v),
    });
  }, [chartTitle, categories]);

  const chartAria = getChartAriaProps({
    title: chartTitle,
    description: chartDescription,
    labelledBy: chartTitleId,
    describedBy: chartDescId,
  });

  // Current display details: hovered, selected, or grand total
  const displayedCat = useMemo(() => {
    if (hoveredCategory) {
      return categories.find((c) => c.category === hoveredCategory) || null;
    }
    if (activeCategory) {
      return categories.find((c) => c.category === activeCategory) || null;
    }
    return null;
  }, [hoveredCategory, activeCategory, categories]);

  const announcerText = useMemo(() => {
    if (displayedCat) {
      return `${displayedCat.category}: ${formatUsdShort(displayedCat.totalUsd)} (${displayedCat.sharePct.toFixed(1)}% of total, ${displayedCat.dealCount} deals). Borrowed debt: ${formatUsdShort(displayedCat.debtUsd)} (${displayedCat.debtSharePct.toFixed(1)}%). Circular financing: ${displayedCat.circularCount} records (${formatUsdShort(displayedCat.circularUsd)}).`;
    }
    return `Capital Wheel overview. Total capital: ${formatUsdShort(grandTotal)} across ${totalDealsCount} deals in ${categories.length} categories. Total senior debt: ${formatUsdShort(totalDebtUsd)}. Circular financing: ${totalCircularCount} of ${totalDealsCount} records (${formatUsdShort(totalCircularUsd)}).`;
  }, [displayedCat, grandTotal, totalDealsCount, categories.length, totalDebtUsd, totalCircularCount, totalCircularUsd]);

  // Dimensions
  const size = 560;
  const center = size / 2;
  const outerR = 230;
  const outerInnerR = 170;
  const innerBandOuterR = 162;
  const innerBandInnerR = 120;
  const circRingInnerR = 236;
  const circRingOuterR = 246;

  return (
    <figure className="m-0 space-y-4">
      {/* Screen reader live announcer */}
      <ChartAnnouncer message={announcerText} />

      {/* Header bar with controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-rule pb-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="label">169-Deal Radial Map</span>
            <span className="pill">Build-Time Computed</span>
            <span className="pill pill-caution">
              {totalCircularCount} of {totalDealsCount} Circular ({formatUsdShort(totalCircularUsd)})
            </span>
          </div>
          <h3 className="text-lg sm:text-xl font-bold tracking-tight text-ink mt-1">
            Capital Wheel: Where the Money Comes From
          </h3>
          <p className="text-[14px] text-ink-muted">
            Arc length represents capital share. Inner band exposes borrowed senior debt vs equity/commitments.
            Distinct notches highlight the {totalCircularCount} circular-financing records.
          </p>
        </div>

        {activeCategory && (
          <button
            onClick={() => selectCat(null)}
            className="btn btn-ghost min-h-11 self-start sm:self-auto text-[13px] text-ink-muted hover:text-ink flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Reset filter ({activeCategory})</span>
          </button>
        )}
      </div>

      {/* Main Wheel SVG and Inspector Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_22rem] gap-6 items-start">
        {/* SVG Canvas Container */}
        <div
          className="relative rounded-xl border border-rule bg-surface-2 p-3 sm:p-5 flex flex-col items-center justify-center overflow-hidden"
          onKeyDown={handleKeyDown}
          tabIndex={0}
          role="region"
          aria-label="Interactive Capital Wheel. Use Arrow keys to navigate categories, Enter to filter, Escape to reset."
        >
          <svg
            viewBox={`0 0 ${size} ${size}`}
            width={size}
            height={size}
            className="w-full max-w-[480px] h-auto select-none"
            {...chartAria}
          >
            <title id={chartTitleId}>{chartTitle}</title>
            <desc id={chartDescId}>{chartDescription}</desc>

            {/* Central Guide Rings */}
            <circle cx={center} cy={center} r={outerR} fill="none" stroke="rgb(var(--c-rule))" strokeWidth="0.5" strokeDasharray="2 3" />
            <circle cx={center} cy={center} r={outerInnerR} fill="none" stroke="rgb(var(--c-rule))" strokeWidth="0.5" />
            <circle cx={center} cy={center} r={innerBandInnerR} fill="none" stroke="rgb(var(--c-rule))" strokeWidth="0.5" />

            {/* Slices rendering */}
            {categories.map((cat, idx) => {
              const isHovered = hoveredCategory === cat.category;
              const isSelected = activeCategory === cat.category;
              const isDimmed = (hoveredCategory && !isHovered) || (activeCategory && !isSelected && !hoveredCategory);

              const categoryArc = describeArc(
                center,
                center,
                outerInnerR,
                outerR,
                cat.startAngle,
                cat.endAngle
              );

              // Inner band: calculate debt fraction angle
              const totalAngleSpan = cat.endAngle - cat.startAngle;
              const debtFraction = cat.totalUsd > 0 ? cat.debtUsd / cat.totalUsd : 0;
              const debtSpan = totalAngleSpan * debtFraction;

              const debtArc =
                debtSpan > 0.05
                  ? describeArc(
                      center,
                      center,
                      innerBandInnerR,
                      innerBandOuterR,
                      cat.startAngle,
                      cat.startAngle + debtSpan
                    )
                  : null;

              const equityArc =
                totalAngleSpan - debtSpan > 0.05
                  ? describeArc(
                      center,
                      center,
                      innerBandInnerR,
                      innerBandOuterR,
                      cat.startAngle + debtSpan,
                      cat.endAngle
                    )
                  : null;

              // Circular notch mark
              const circularNotch =
                cat.circularCount > 0
                  ? describeArc(
                      center,
                      center,
                      circRingInnerR,
                      circRingOuterR,
                      cat.startAngle,
                      cat.endAngle
                    )
                  : null;

              return (
                <g
                  key={cat.category}
                  className="transition-opacity duration-150 cursor-pointer"
                  style={{ opacity: isDimmed ? 0.35 : 1 }}
                  onMouseEnter={() => setHoveredCategory(cat.category)}
                  onMouseLeave={() => setHoveredCategory(null)}
                  onClick={() => selectCat(activeCategory === cat.category ? null : cat.category)}
                  role="graphics-symbol"
                  aria-label={`${cat.category}: ${formatUsdShort(cat.totalUsd)} (${cat.sharePct.toFixed(1)}%)`}
                >
                  {/* Outer category arc */}
                  <path
                    d={categoryArc}
                    fill={cat.colorHex}
                    stroke={isSelected ? "rgb(var(--c-ink))" : "rgb(var(--c-canvas))"}
                    strokeWidth={isSelected ? 2 : 1}
                  />

                  {/* Inner band debt slice (if present) */}
                  {debtArc && (
                    <path
                      d={debtArc}
                      fill="var(--c-cat-teal)"
                      stroke="rgb(var(--c-canvas))"
                      strokeWidth={0.8}
                    />
                  )}

                  {/* Inner band equity / non-debt slice */}
                  {equityArc && (
                    <path
                      d={equityArc}
                      fill="rgb(var(--c-surface-3))"
                      stroke="rgb(var(--c-canvas))"
                      strokeWidth={0.8}
                    />
                  )}

                  {/* Circular financing distinct outer notch */}
                  {circularNotch && (
                    <path
                      d={circularNotch}
                      fill="#D1433C"
                      stroke="rgb(var(--c-canvas))"
                      strokeWidth={1}
                    />
                  )}
                </g>
              );
            })}

            {/* Circular Markers Indicators */}
            {categories.filter((c) => c.circularCount > 0).map((c) => {
              const pt = polarToCartesian(center, center, (circRingInnerR + circRingOuterR) / 2, c.midAngle);
              return (
                <circle
                  key={`circ-pt-${c.category}`}
                  cx={pt.x}
                  cy={pt.y}
                  r={3.5}
                  fill="rgb(var(--c-canvas))"
                  stroke="#D1433C"
                  strokeWidth={1.5}
                  aria-hidden="true"
                />
              );
            })}

            {/* Central Readout */}
            <g aria-hidden="true" className="pointer-events-none select-none text-center">
              {displayedCat ? (
                <>
                  <text
                    x={center}
                    y={center - 32}
                    textAnchor="middle"
                    className="fill-ink text-[13px] font-semibold tracking-tight"
                  >
                    {displayedCat.category.length > 18
                      ? displayedCat.category.slice(0, 16) + "…"
                      : displayedCat.category}
                  </text>
                  <text
                    x={center}
                    y={center - 2}
                    textAnchor="middle"
                    className="num fill-ink text-2xl font-bold"
                  >
                    {formatUsdShort(displayedCat.totalUsd)}
                  </text>
                  <text
                    x={center}
                    y={center + 20}
                    textAnchor="middle"
                    className="num fill-ink-muted text-[13px]"
                  >
                    {displayedCat.sharePct.toFixed(1)}% of book • {displayedCat.dealCount} deals
                  </text>
                  <text
                    x={center}
                    y={center + 38}
                    textAnchor="middle"
                    className="num fill-ink-subtle text-[12px]"
                  >
                    Debt: {formatUsdShort(displayedCat.debtUsd)} ({displayedCat.debtSharePct.toFixed(0)}%)
                    {displayedCat.circularCount > 0 ? ` • ${displayedCat.circularCount} circ` : ""}
                  </text>
                </>
              ) : (
                <>
                  <text
                    x={center}
                    y={center - 30}
                    textAnchor="middle"
                    className="fill-ink-muted text-[13px] font-medium uppercase tracking-wider"
                  >
                    Total Ledger Capital
                  </text>
                  <text
                    x={center}
                    y={center + 4}
                    textAnchor="middle"
                    className="num fill-ink text-3xl font-bold"
                  >
                    {formatUsdShort(grandTotal)}
                  </text>
                  <text
                    x={center}
                    y={center + 26}
                    textAnchor="middle"
                    className="num fill-ink-muted text-[14px]"
                  >
                    {totalDealsCount} Disclosed Deals
                  </text>
                  <text
                    x={center}
                    y={center + 44}
                    textAnchor="middle"
                    className="num fill-risk-600 text-[12px] font-semibold"
                  >
                    {totalCircularCount} Circular ({formatUsdShort(totalCircularUsd)})
                  </text>
                </>
              )}
            </g>
          </svg>

          {/* Instructions caption */}
          <div className="mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[13px] text-ink-subtle">
            <span>Hover or use arrow keys to inspect arcs</span>
            <span>•</span>
            <span>Click to trace deals</span>
            <span>•</span>
            <span>Escape to clear</span>
          </div>
        </div>

        {/* Diagnostic Breakdown Sidebar */}
        <div className="space-y-4">
          <div className="card space-y-3">
            <div className="flex items-center justify-between border-b border-rule pb-2">
              <span className="label">Category Share &amp; Seniority</span>
              <span className="num text-[13px] text-ink-subtle">9 Segments</span>
            </div>

            <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
              {categories.map((c) => {
                const isSelected = activeCategory === c.category;
                return (
                  <button
                    key={c.category}
                    onClick={() => selectCat(isSelected ? null : c.category)}
                    className={`w-full text-left p-2.5 rounded-lg border transition-colors flex items-center justify-between min-h-[44px] ${
                      isSelected
                        ? "border-ink bg-surface-3 font-semibold"
                        : "border-rule bg-surface hover:border-rule-strong hover:bg-surface-2"
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: c.colorHex }}
                        aria-hidden="true"
                      />
                      <span className="text-[14px] text-ink truncate">{c.category}</span>
                      {c.circularCount > 0 && (
                        <span className="pill pill-caution text-[13px] py-0 px-1 shrink-0">
                          {c.circularCount} circ
                        </span>
                      )}
                    </div>

                    <div className="text-right shrink-0">
                      <div className="num text-[14px] font-semibold text-ink">
                        {formatUsdShort(c.totalUsd)}
                      </div>
                      <div className="num text-[12px] text-ink-subtle">
                        {c.sharePct.toFixed(1)}% • {c.dealCount} d
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Circular Financing Disclosure Box */}
          <div className="notice notice-caution space-y-1.5">
            <div className="flex items-center gap-1.5 text-caution-700 font-semibold text-[13px]">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>Circular Financing Disclosure ({totalCircularCount} of {totalDealsCount} records)</span>
            </div>
            <p className="text-[13px] text-ink-muted leading-relaxed">
              Exactly <strong className="text-ink">{totalCircularCount} of {totalDealsCount}</strong> ledger records
              carry the <code className="num font-semibold text-ink">is_circular</code> flag (
              <strong className="text-ink">{formatUsdShort(totalCircularUsd)}</strong> disclosed volume across
              Borrowed, Bets &amp; rounds, and Other). This flag marks counterparty arrangements where capital
              is advanced by a party the recipient subsequently reimburses through compute leases, equity warrants,
              or license obligations.
            </p>
          </div>
        </div>
      </div>

      {/* Traceable Deals Drawer (shown when category is selected or active) */}
      {activeCategory && displayedCat && (
        <div className="card space-y-3 pt-4 border-t-2 border-t-ink">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-rule pb-2">
            <div>
              <div className="flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: displayedCat.colorHex }}
                  aria-hidden="true"
                />
                <h4 className="text-base font-bold text-ink">
                  Traceable Deals in {displayedCat.category}
                </h4>
                <span className="pill">{displayedCat.deals.length} deals</span>
                <span className="num text-[14px] font-semibold text-ink">
                  {formatUsdShort(displayedCat.totalUsd)}
                </span>
              </div>
              <p className="text-[13px] text-ink-muted mt-0.5">
                Every arc on the wheel traces back to verified transactions in the debt ledger.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href={`/ledger?category=${encodeURIComponent(displayedCat.category)}`}
                className="btn btn-ghost min-h-11 text-[13px] text-ink-muted hover:text-ink flex items-center gap-1"
              >
                <span>Open in Ledger</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
              <button
                onClick={() => selectCat(null)}
                aria-label="Close deal list"
                className="btn min-h-11 text-[13px] px-3"
              >
                <X className="w-4 h-4" />
                <span>Close</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto rounded-lg border border-rule">
            <table className="w-full text-left text-[14px]">
              <thead className="bg-surface-2 text-ink-subtle">
                <tr>
                  <th scope="col" className="p-2.5 font-medium">Deal Title</th>
                  <th scope="col" className="p-2.5 text-right font-medium">Amount</th>
                  <th scope="col" className="p-2.5 font-medium">Date</th>
                  <th scope="col" className="p-2.5 font-medium">Structure</th>
                  <th scope="col" className="p-2.5 font-medium">Circular</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-rule">
                {displayedCat.deals.map((d) => (
                  <tr key={d.id} className="hover:bg-surface-2/60 transition-colors">
                    <td className="p-2.5 font-medium text-ink max-w-md">
                      <div className="flex items-center gap-1.5">
                        <Link
                          href={`/ledger?search=${encodeURIComponent(d.title)}`}
                          className="prose-a text-ink hover:underline truncate"
                        >
                          {d.title}
                        </Link>
                        {onSelectDeal && (
                          <button
                            type="button"
                            onClick={() => onSelectDeal(d)}
                            className="chip text-[12px] shrink-0 hover:bg-surface-3 transition-colors"
                            title="Inspect deal details"
                          >
                            Inspect
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="num p-2.5 text-right font-semibold text-ink whitespace-nowrap">
                      {d.amount_display || formatUsdShort(d.amount_usd)}
                    </td>
                    <td className="p-2.5 text-ink-muted whitespace-nowrap text-[13px]">
                      {d.announced_date}
                    </td>
                    <td className="p-2.5 whitespace-nowrap">
                      {d.is_debt ? (
                        <span className="pill pill-risk text-[13px]">Senior Debt</span>
                      ) : (
                        <span className="pill text-[13px]">Equity / Commitments</span>
                      )}
                    </td>
                    <td className="p-2.5 whitespace-nowrap">
                      {d.is_circular ? (
                        <span className="pill pill-caution text-[13px]">Circular Loop</span>
                      ) : (
                        <span className="text-ink-faint text-[12px]">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Accessible Table Fallback */}
      <div className="overflow-x-auto rounded-xl border border-rule">
        <table className="w-full text-left text-[14px]">
          <caption className="sr-only">
            Capital Wheel Category Composition: share of total $2.87T volume, deal count, borrowed debt amount, and circular financing records computed from deals.json.
          </caption>
          <thead className="bg-surface-2 text-ink-subtle">
            <tr>
              <th scope="col" className="p-3 font-medium">Category</th>
              <th scope="col" className="p-3 text-right font-medium">Disclosed Capital</th>
              <th scope="col" className="p-3 text-right font-medium">Share (%)</th>
              <th scope="col" className="p-3 text-right font-medium">Deals</th>
              <th scope="col" className="p-3 text-right font-medium">Senior Debt</th>
              <th scope="col" className="p-3 text-right font-medium">Debt Share (%)</th>
              <th scope="col" className="p-3 text-right font-medium">Circular Records</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-rule">
            {categories.map((c) => (
              <tr key={c.category} className="hover:bg-surface-2/40">
                <th scope="row" className="p-3 font-semibold text-ink flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: c.colorHex }}
                    aria-hidden="true"
                  />
                  <span>{c.category}</span>
                </th>
                <td className="num p-3 text-right font-semibold text-ink">
                  {formatUsdShort(c.totalUsd)}
                </td>
                <td className="num p-3 text-right text-ink-muted">
                  {c.sharePct.toFixed(2)}%
                </td>
                <td className="num p-3 text-right text-ink-muted">
                  {c.dealCount}
                </td>
                <td className="num p-3 text-right text-ink-muted">
                  {formatUsdShort(c.debtUsd)}
                </td>
                <td className="num p-3 text-right text-ink-muted">
                  {c.debtSharePct.toFixed(1)}%
                </td>
                <td className="num p-3 text-right text-ink-muted">
                  {c.circularCount > 0 ? `${c.circularCount} (${formatUsdShort(c.circularUsd)})` : "0"}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-surface-3/60 font-semibold text-ink border-t border-rule">
            <tr>
              <th scope="row" className="p-3">Total Ledger Volume</th>
              <td className="num p-3 text-right">{formatUsdShort(grandTotal)}</td>
              <td className="num p-3 text-right">100.0%</td>
              <td className="num p-3 text-right">{totalDealsCount}</td>
              <td className="num p-3 text-right">{formatUsdShort(totalDebtUsd)}</td>
              <td className="num p-3 text-right">
                {grandTotal > 0 ? ((totalDebtUsd / grandTotal) * 100).toFixed(1) : "0"}%
              </td>
              <td className="num p-3 text-right">
                {totalCircularCount} ({formatUsdShort(totalCircularUsd)})
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </figure>
  );
}
