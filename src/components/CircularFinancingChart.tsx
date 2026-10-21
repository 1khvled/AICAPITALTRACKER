"use client";

import React, { useState, useMemo, useId } from "react";
import Link from "next/link";
import rawDeals from "@/data/deals.json";
import {
  getChartAriaProps,
  generateChartDescription,
  ChartAnnouncer,
} from "@/lib/chart-a11y";
import {
  ShieldAlert,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  Info,
  Calendar,
  Layers,
  Sparkles,
} from "lucide-react";

export interface CircularDeal {
  id: string;
  title: string;
  category: string;
  amount_display: string;
  amount_usd: number;
  announced_date: string;
  description: string;
  is_debt: boolean;
  is_circular: boolean;
  year: number;
}

function formatUsd(value: number): string {
  if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
  if (value >= 1e9) return `$${(value / 1e9).toFixed(1)}B`;
  if (value >= 1e6) return `$${Math.round(value / 1e6)}M`;
  return `$${value.toLocaleString()}`;
}

const CATEGORY_COLORS: Record<string, string> = {
  "Borrowed": "var(--c-cat-teal)",
  "Bets & rounds": "var(--c-cat-navy)",
  "Other": "rgb(var(--c-ink-subtle))",
};

export function CircularFinancingChart({
  deals,
  onSelectDeal,
}: {
  deals?: CircularDeal[];
  onSelectDeal?: (deal: CircularDeal) => void;
} = {}) {
  const [selectedDealId, setSelectedDealId] = useState<string | null>(null);
  const [hoveredDealId, setHoveredDealId] = useState<string | null>(null);

  const allDeals = (deals ?? rawDeals) as unknown as CircularDeal[];
  const circularDeals = useMemo(
    () => allDeals.filter((d) => d.is_circular).sort((a, b) => b.amount_usd - a.amount_usd),
    [allDeals]
  );

  const grandTotal = useMemo(
    () => allDeals.reduce((sum, d) => sum + (d.amount_usd || 0), 0),
    [allDeals]
  );

  const circularTotalUsd = useMemo(
    () => circularDeals.reduce((sum, d) => sum + (d.amount_usd || 0), 0),
    [circularDeals]
  );

  // Layout positions for the 7 bubbles in an institutional terminal map
  // Coordinated packed circles with ample breathing room
  const bubbleLayout = useMemo(() => {
    // Sized by sqrt of amount, with floor for undisclosed
    // Max amount is $42B, min disclosed is $350M, one is $0
    return [
      // 1. Anthropic & Broadcom ($42B)
      { id: "deal-002", x: 230, y: 190, r: 108 },
      // 2. NVIDIA Groq ($20B)
      { id: "deal-026", x: 440, y: 155, r: 76 },
      // 3. Marvell Google Warrant ($12.2B)
      { id: "deal-007", x: 605, y: 190, r: 60 },
      // 4. Google TeraWulf ($1.8B)
      { id: "deal-066", x: 410, y: 275, r: 35 },
      // 5. Google Cipher ($1.4B)
      { id: "deal-049", x: 500, y: 285, r: 32 },
      // 6. Groq Series A ($350M)
      { id: "deal-008", x: 580, y: 295, r: 24 },
      // 7. AMD-OpenAI 6 GW (Undisclosed)
      { id: "deal-046", x: 650, y: 295, r: 24 },
    ];
  }, []);

  const chartUid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const chartTitleId = `${chartUid}-title`;
  const chartDescId = `${chartUid}-desc`;
  const chartTitle = `Circular Financing Records — 7 of ${allDeals.length} Deals ($${(circularTotalUsd / 1e9).toFixed(1)}B Disclosed)`;

  const chartDescription = useMemo(() => {
    return generateChartDescription({
      title: chartTitle,
      kind: "scatter",
      series: [
        {
          name: "Circular Deals",
          points: circularDeals.map((d) => ({
            x: d.title,
            y: d.amount_usd,
          })),
        },
      ],
      formatValue: (v) => formatUsd(v),
    });
  }, [chartTitle, circularDeals]);

  const chartAria = getChartAriaProps({
    title: chartTitle,
    description: chartDescription,
    labelledBy: chartTitleId,
    describedBy: chartDescId,
  });

  const activeDealId = hoveredDealId || selectedDealId || circularDeals[0]?.id;
  const activeDeal = circularDeals.find((d) => d.id === activeDealId) || circularDeals[0];

  const announcerText = activeDeal
    ? `${activeDeal.title}: ${activeDeal.amount_display} (${activeDeal.category}, ${activeDeal.announced_date}). ${activeDeal.is_debt ? "Senior debt" : "Equity/warrant commitments"}.`
    : `Circular financing map showing 7 records totaling ${formatUsd(circularTotalUsd)}.`;

  const svgWidth = 740;
  const svgHeight = 360;

  return (
    <figure className="m-0 space-y-4">
      <ChartAnnouncer message={announcerText} />

      {/* Header bar */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-rule pb-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="label">Systemic Risk Diagnostic</span>
            <span className="pill pill-caution">
              {circularDeals.length} of {allDeals.length} Records
            </span>
            <span className="num text-[14px] font-semibold text-ink">
              {formatUsd(circularTotalUsd)} Disclosed Volume
            </span>
          </div>
          <h3 className="text-lg sm:text-xl font-bold tracking-tight text-ink mt-1">
            Circular Financing: Counterparty Capital Loops
          </h3>
          <p className="text-[14px] text-ink-muted">
            The wheel marks circular records; this view examines the {circularDeals.length} transactions where
            vendor financing, warrants, or take-or-pay leases tie buyers to sellers in closed capital loops.
          </p>
        </div>

        <Link
          href="/ledger?type=circular"
          className="btn btn-ghost min-h-11 self-start sm:self-auto text-[13px] text-ink-muted hover:text-ink flex items-center gap-1.5"
        >
          <span>Audit in Ledger</span>
          <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
        </Link>
      </div>

      {/* Institutional Disclosure Box */}
      <div className="notice notice-caution space-y-2">
        <div className="flex items-center gap-1.5 font-bold text-caution-700 text-[14px]">
          <ShieldAlert className="w-4 h-4 shrink-0" />
          <span>Accounting Reality: 7 of 169 Records ({formatUsd(circularTotalUsd)} of {formatUsd(grandTotal)} Total Book)</span>
        </div>
        <p className="text-[13px] text-ink-muted leading-relaxed">
          Seven records in the 169-deal ledger carry the <code className="num font-semibold text-ink">is_circular</code> flag.
          Between them, they account for <strong className="text-ink">{formatUsd(circularTotalUsd)}</strong> in disclosed capital
          ({((circularTotalUsd / grandTotal) * 100).toFixed(1)}% of the ${formatUsd(grandTotal)} infrastructure superstructure).
          Circular financing denotes deals where capital is provided by an entity that the recipient then compensates through
          hardware purchases, capacity lease agreements, or convertible equity warrants. One deal (AMD-OpenAI 6 GW GPU partnership)
          carries an undisclosed cash amount, and subsequent filing up-sizings (e.g. Google TeraWulf upsized to ~$3.2B / ~14% warrants;
          Google Cipher upsized to $1.73B) expand the true structural exposure beyond the base print.
        </p>
      </div>

      {/* Main Grid: SVG Map + Active Deal Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_22rem] gap-6 items-start">
        {/* SVG Bubble Map */}
        <div className="rounded-xl border border-rule bg-surface-2 p-3 sm:p-5 flex flex-col items-center justify-center overflow-x-auto">
          <svg
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            className="w-full h-auto min-w-[560px] select-none"
            {...chartAria}
          >
            <title id={chartTitleId}>{chartTitle}</title>
            <desc id={chartDescId}>{chartDescription}</desc>

            {/* Background Grid Lines */}
            <line x1={40} y1={svgHeight - 40} x2={svgWidth - 40} y2={svgHeight - 40} stroke="rgb(var(--c-rule))" strokeWidth="1" />
            <line x1={40} y1={40} x2={40} y2={svgHeight - 40} stroke="rgb(var(--c-rule))" strokeWidth="1" />

            {/* Bubble rendering */}
            {circularDeals.map((deal) => {
              const layout = bubbleLayout.find((b) => b.id === deal.id);
              if (!layout) return null;

              const isSelected = activeDealId === deal.id;
              const color = CATEGORY_COLORS[deal.category] || "var(--c-cat-steel)";

              return (
                <g
                  key={deal.id}
                  className="cursor-pointer transition-transform duration-150"
                  onClick={() => setSelectedDealId(deal.id)}
                  onMouseEnter={() => setHoveredDealId(deal.id)}
                  onMouseLeave={() => setHoveredDealId(null)}
                  role="graphics-symbol"
                  aria-label={`${deal.title}: ${deal.amount_display} (${deal.category})`}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setSelectedDealId(deal.id);
                    }
                  }}
                >
                  {/* Outer ring on selection / hover */}
                  {isSelected && (
                    <circle
                      cx={layout.x}
                      cy={layout.y}
                      r={layout.r + 5}
                      fill="none"
                      stroke="rgb(var(--c-ink))"
                      strokeWidth={2}
                      strokeDasharray="4 3"
                    />
                  )}

                  {/* Bubble body */}
                  <circle
                    cx={layout.x}
                    cy={layout.y}
                    r={layout.r}
                    fill={color}
                    fillOpacity={isSelected ? 0.95 : 0.82}
                    stroke="rgb(var(--c-canvas))"
                    strokeWidth={1.5}
                  />

                  {/* Circular indicator accent notch on border */}
                  <circle
                    cx={layout.x + layout.r * 0.707}
                    cy={layout.y - layout.r * 0.707}
                    r={4}
                    fill="#D1433C"
                    stroke="rgb(var(--c-canvas))"
                    strokeWidth={1}
                  />

                  {/* Labels on bubbles (scaled by size) */}
                  {layout.r >= 50 ? (
                    <>
                      <text
                        x={layout.x}
                        y={layout.y - 12}
                        textAnchor="middle"
                        className="num fill-white text-[18px] font-bold pointer-events-none"
                      >
                        {deal.amount_display}
                      </text>
                      <text
                        x={layout.x}
                        y={layout.y + 10}
                        textAnchor="middle"
                        className="fill-white text-[12px] font-medium pointer-events-none opacity-90"
                      >
                        {deal.title.length > 24 ? deal.title.slice(0, 22) + "…" : deal.title}
                      </text>
                      <text
                        x={layout.x}
                        y={layout.y + 26}
                        textAnchor="middle"
                        className="num fill-white text-[12px] pointer-events-none opacity-80"
                      >
                        {deal.category}
                      </text>
                    </>
                  ) : layout.r >= 30 ? (
                    <>
                      <text
                        x={layout.x}
                        y={layout.y - 2}
                        textAnchor="middle"
                        className="num fill-white text-[13px] font-bold pointer-events-none"
                      >
                        {deal.amount_display}
                      </text>
                      <text
                        x={layout.x}
                        y={layout.y + 13}
                        textAnchor="middle"
                        className="fill-white text-[12px] pointer-events-none opacity-90 truncate max-w-[60px]"
                      >
                        {deal.announced_date.split(" ").slice(1).join(" ")}
                      </text>
                    </>
                  ) : (
                    <text
                      x={layout.x}
                      y={layout.y + 4}
                      textAnchor="middle"
                      className="num fill-white text-[12px] font-bold pointer-events-none"
                    >
                      {deal.amount_display === "Not disclosed" ? "ND" : deal.amount_display}
                    </text>
                  )}
                </g>
              );
            })}

            {/* Static baseline legend inside SVG */}
            <g aria-hidden="true" className="select-none text-[12px]">
              <text x={45} y={30} className="fill-ink-muted text-[12px] font-medium">
                Bubble radius proportional to capital volume • Red pip = circular counterparty loop
              </text>
            </g>
          </svg>

          <p className="mt-2 text-[12px] text-ink-subtle text-center">
            Click or focus any bubble to inspect the transaction terms and counterparty flows.
          </p>
        </div>

        {/* Selected / Active Deal Inspector Card */}
        {activeDeal && (
          <div className="card space-y-3.5 border-t-2 border-t-ink">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="pill pill-caution">Circular Loop</span>
                <span className="pill">
                  {activeDeal.is_debt ? "Senior Debt" : "Equity / Warrants"}
                </span>
                <span className="num text-[12px] text-ink-subtle">{activeDeal.id}</span>
              </div>
              <h4 className="text-base font-bold text-ink leading-snug pt-1">
                {activeDeal.title}
              </h4>
              <div className="num text-2xl font-bold text-ink pt-0.5">
                {activeDeal.amount_display}
              </div>
            </div>

            <dl className="grid grid-cols-2 gap-2 rounded-lg border border-rule bg-surface-2 p-2.5 text-[13px]">
              <div>
                <dt className="label">Category</dt>
                <dd className="font-semibold text-ink mt-0.5 truncate">{activeDeal.category}</dd>
              </div>
              <div>
                <dt className="label">Date</dt>
                <dd className="num font-semibold text-ink mt-0.5">{activeDeal.announced_date}</dd>
              </div>
            </dl>

            <div className="space-y-1">
              <span className="label">Counterparty &amp; Structural Mechanics</span>
              <p className="text-[13px] leading-relaxed text-ink-muted bg-surface-2 p-3 rounded-lg border border-rule">
                {activeDeal.description}
              </p>
            </div>

            <div className="pt-1 flex items-center justify-between gap-2">
              <Link
                href={`/ledger?search=${encodeURIComponent(activeDeal.title)}`}
                className="prose-a text-[13px] font-semibold text-ink flex items-center gap-1 hover:underline min-h-[44px]"
              >
                <span>View Full Receipt in Ledger</span>
                <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
              </Link>
              {onSelectDeal && (
                <button
                  type="button"
                  onClick={() => onSelectDeal(activeDeal)}
                  className="btn btn-primary min-h-[44px] text-[13px] px-3"
                >
                  Inspect Deal
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Accessible Table Fallback */}
      <div className="overflow-x-auto rounded-xl border border-rule">
        <table className="w-full text-left text-[14px]">
          <caption className="sr-only">
            The 7 Circular Financing Deals in the AI Capital Tracker Ledger: Title, Category, Disclosed Amount, Date, Debt Status, and Terms.
          </caption>
          <thead className="bg-surface-2 text-ink-subtle">
            <tr>
              <th scope="col" className="p-3 font-medium">Deal Title</th>
              <th scope="col" className="p-3 font-medium">Category</th>
              <th scope="col" className="p-3 text-right font-medium">Amount</th>
              <th scope="col" className="p-3 font-medium">Date</th>
              <th scope="col" className="p-3 font-medium">Instrument</th>
              <th scope="col" className="p-3 font-medium">Loop Nature</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-rule">
            {circularDeals.map((d) => (
              <tr key={d.id} className="hover:bg-surface-2/40">
                <th scope="row" className="p-3 font-semibold text-ink">
                  <Link href={`/ledger?search=${encodeURIComponent(d.title)}`} className="hover:underline">
                    {d.title}
                  </Link>
                </th>
                <td className="p-3 text-ink-muted whitespace-nowrap">{d.category}</td>
                <td className="num p-3 text-right font-semibold text-ink whitespace-nowrap">
                  {d.amount_display}
                </td>
                <td className="num p-3 text-ink-muted whitespace-nowrap text-[13px]">{d.announced_date}</td>
                <td className="p-3 whitespace-nowrap">
                  {d.is_debt ? (
                    <span className="pill pill-risk text-[13px]">Senior Debt</span>
                  ) : (
                    <span className="pill text-[13px]">Equity / Commitments</span>
                  )}
                </td>
                <td className="p-3 text-ink-muted text-[13px] max-w-sm truncate" title={d.description}>
                  {d.description}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-surface-3/60 font-semibold text-ink border-t border-rule">
            <tr>
              <th scope="row" className="p-3">Total Circular Volume Disclosed</th>
              <td className="p-3">3 Categories</td>
              <td className="num p-3 text-right">{formatUsd(circularTotalUsd)}</td>
              <td className="p-3" colSpan={3}>
                7 of {allDeals.length} ledger records ({((circularTotalUsd / grandTotal) * 100).toFixed(1)}% of ${formatUsd(grandTotal)} total book)
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </figure>
  );
}
