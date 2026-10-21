"use client";

import React, { useId, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  circularTone,
  companySlug,
  formatUsd,
  resolveCompanyProfile,
  type CompanyProfile,
} from "../../_components/companyData";
import rawDeals from "@/data/deals.json";
import { ChevronDown, ExternalLink, Network, ShieldAlert } from "lucide-react";

interface ConnectionDetail {
  name: string;
  resolvedProfile?: CompanyProfile;
  slug?: string;
  isRegistered: boolean;
  disclosedAmount: string;
  isCircular: boolean;
  dealCount: number;
  trancheCount: number;
}

interface CompanyCircularityGraphProps {
  company: CompanyProfile;
}

export function CompanyCircularityGraph({ company }: CompanyCircularityGraphProps) {
  const router = useRouter();
  const [showTable, setShowTable] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

  // Compute structured connection facts from sources
  const connectionDetails: ConnectionDetail[] = useMemo(() => {
    const deals = rawDeals as Array<{
      title: string;
      description: string;
      amount_usd: number;
      is_circular: boolean;
    }>;

    return company.circularityConnections.map((conn) => {
      const resolved = resolveCompanyProfile(conn);
      const isRegistered = !!resolved;
      const slug = resolved ? companySlug(resolved.name) : undefined;

      const connLower = conn.toLowerCase();
      const resolvedLower = resolved ? resolved.name.toLowerCase() : "";
      const cLower = company.name.toLowerCase().split(" ")[0];

      // Check debt tranches
      const matchingTranches = company.debtTranches.filter(
        (t) =>
          t.creditors &&
          (t.creditors.toLowerCase().includes(connLower) ||
            (resolvedLower && t.creditors.toLowerCase().includes(resolvedLower)))
      );
      const trancheSum = matchingTranches.reduce((sum, t) => sum + t.amountUsd, 0);

      // Check ledger deals
      const matchingDeals = deals.filter((d) => {
        const text = (d.title + " " + d.description).toLowerCase();
        const hasConn = text.includes(connLower) || (resolvedLower && text.includes(resolvedLower));
        const hasComp = text.includes(cLower);
        return hasConn && hasComp;
      });
      const dealSum = matchingDeals.reduce((sum, d) => sum + (d.amount_usd || 0), 0);
      const hasCircularDeal = matchingDeals.some((d) => d.is_circular);

      // Check summary for stated amounts
      let summaryAmount: string | null = null;
      const regex = new RegExp(`${conn}[^$]*\\$([0-9.]+[BMK]?)`, "i");
      const match = company.circularitySummary.match(regex);
      if (match) {
        summaryAmount = `$${match[1]}`;
      }

      let disclosedAmount = "Terms not disclosed";
      if (trancheSum > 0) {
        disclosedAmount = formatUsd(trancheSum);
      } else if (dealSum > 0) {
        disclosedAmount = formatUsd(dealSum);
      } else if (summaryAmount) {
        disclosedAmount = summaryAmount;
      }

      const isCircular =
        hasCircularDeal ||
        company.circularRiskLevel.includes("Circular") ||
        (resolved && resolved.circularRiskLevel.includes("Circular"));

      return {
        name: conn,
        resolvedProfile: resolved,
        slug,
        isRegistered,
        disclosedAmount,
        isCircular: !!isCircular,
        dealCount: matchingDeals.length,
        trancheCount: matchingTranches.length,
      };
    });
  }, [company]);

  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const graphTitleId = `${uid}-graph-title`;
  const graphDescId = `${uid}-graph-desc`;

  // Keyboard navigation across nodes
  const handleKeyDown = (e: React.KeyboardEvent, idx: number) => {
    const total = connectionDetails.length;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault();
      const next = (idx + 1) % total;
      setSelectedIdx(next);
      const nextEl = document.getElementById(`${uid}-node-${next}`);
      nextEl?.focus();
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      const prev = (idx - 1 + total) % total;
      setSelectedIdx(prev);
      const prevEl = document.getElementById(`${uid}-node-${prev}`);
      prevEl?.focus();
    } else if (e.key === "Enter" || e.key === " ") {
      const conn = connectionDetails[idx];
      if (conn.slug) {
        e.preventDefault();
        router.push(`/companies/${conn.slug}`);
      }
    }
  };

  // Dimensions for SVG radial network
  const svgWidth = 660;
  const svgHeight = 400;
  const cx = svgWidth / 2;
  const cy = svgHeight / 2;
  const radius = 145;

  return (
    <section className="card space-y-4" aria-labelledby="circularity-section-title">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-rule pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 id="circularity-section-title" className="text-lg font-bold tracking-tight text-ink">
              Circularity & Counterparty Graph
            </h2>
            <span className={`chip ${circularTone(company.circularRiskLevel)}`}>
              {company.circularRiskLevel}
            </span>
          </div>
          <p className="mt-0.5 text-[14px] text-ink-subtle">
            Disclosed funding loops, compute contracts and capital ties across{" "}
            <span className="num font-semibold text-ink">{company.circularityConnections.length}</span>{" "}
            named counterparties.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowTable((prev) => !prev)}
          aria-expanded={showTable}
          aria-controls="circularity-table-fallback"
          className="flex min-h-[44px] items-center gap-1.5 text-[13px] font-medium text-ink-muted transition-colors hover:text-ink focus:outline-hidden focus:underline"
        >
          {showTable ? "Hide data table" : "Show data table fallback"}
          <ChevronDown
            className={`h-4 w-4 transition-transform duration-200 ${showTable ? "rotate-180" : ""}`}
            aria-hidden="true"
          />
        </button>
      </div>

      {/* Published Circularity Narrative */}
      <div className="panel p-3 text-[14px] leading-relaxed text-ink-muted">
        <span className="label block text-ink-subtle mb-1">Disclosed Exposure Pattern</span>
        <p>{company.circularitySummary}</p>
      </div>

      {/* SVG Radial Graph */}
      <div className="relative overflow-hidden rounded-md border border-rule bg-canvas p-2">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-auto select-none font-sans"
          role="img"
          aria-labelledby={`${graphTitleId} ${graphDescId}`}
          tabIndex={0}
          onFocus={() => {
            if (selectedIdx === null && connectionDetails.length > 0) {
              setSelectedIdx(0);
            }
          }}
        >
          <title id={graphTitleId}>{`Circularity network for ${company.name} (${company.circularRiskLevel})`}</title>
          <desc id={graphDescId}>
            {`Radial connectivity graph showing ${company.name} at the center connected to ${connectionDetails.map((c) => `${c.name} (${c.disclosedAmount})`).join(", ")}.`}
          </desc>

          {/* Background concentric guidelines */}
          <circle
            cx={cx}
            cy={cy}
            r={radius}
            fill="none"
            stroke="rgb(var(--c-rule))"
            strokeWidth="1"
            strokeDasharray="3 3"
          />

          {/* Edges connecting center to surrounding nodes */}
          {connectionDetails.map((conn, idx) => {
            const count = connectionDetails.length;
            const angle = (idx * (2 * Math.PI)) / count - Math.PI / 2;
            const nx = cx + radius * Math.cos(angle);
            const ny = cy + radius * Math.sin(angle);
            const midX = (cx + nx) / 2;
            const midY = (cy + ny) / 2;

            const strokeColor = conn.isCircular ? "#d1433c" : "rgb(var(--c-rule-strong))";
            const strokeWidth = conn.isCircular ? 2 : 1.25;

            return (
              <g key={`edge-${conn.name}-${idx}`}>
                <line
                  x1={cx}
                  y1={cy}
                  x2={nx}
                  y2={ny}
                  stroke={strokeColor}
                  strokeWidth={strokeWidth}
                  strokeDasharray={conn.isCircular ? undefined : "4 2"}
                  opacity={0.85}
                />
                {/* Edge Disclosed Amount Badge */}
                {conn.disclosedAmount !== "Terms not disclosed" ? (
                  <g transform={`translate(${midX}, ${midY})`}>
                    <rect
                      x="-28"
                      y="-10"
                      width="56"
                      height="20"
                      rx="4"
                      fill="rgb(var(--c-surface-2))"
                      stroke={conn.isCircular ? "#d1433c" : "rgb(var(--c-rule))"}
                      strokeWidth="1"
                    />
                    <text
                      x="0"
                      y="4"
                      textAnchor="middle"
                      className="num font-bold text-[12px]"
                      fill={conn.isCircular ? "#d1433c" : "rgb(var(--c-ink))"}
                    >
                      {conn.disclosedAmount}
                    </text>
                  </g>
                ) : (
                  <g transform={`translate(${midX}, ${midY})`}>
                    <rect
                      x="-22"
                      y="-8"
                      width="44"
                      height="16"
                      rx="3"
                      fill="rgb(var(--c-surface-2))"
                      stroke="rgb(var(--c-rule))"
                      strokeWidth="0.8"
                    />
                    <text
                      x="0"
                      y="3.5"
                      textAnchor="middle"
                      className="text-[12px]"
                      fill="rgb(var(--c-ink-subtle))"
                    >
                      Disclosed
                    </text>
                  </g>
                )}
              </g>
            );
          })}

          {/* Central Company Node */}
          <g transform={`translate(${cx}, ${cy})`}>
            <circle
              r="44"
              fill="rgb(var(--c-surface))"
              stroke="rgb(var(--c-ink))"
              strokeWidth="2"
            />
            <text
              x="0"
              y="-4"
              textAnchor="middle"
              className="text-[12px] font-bold"
              fill="rgb(var(--c-ink))"
            >
              {company.name.length > 14 ? `${company.name.slice(0, 12)}…` : company.name}
            </text>
            <text
              x="0"
              y="12"
              textAnchor="middle"
              className="text-[12px] font-mono uppercase tracking-wider"
              fill="rgb(var(--c-ink-subtle))"
            >
              {company.riskTier}
            </text>
          </g>

          {/* Surrounding Connected Nodes */}
          {connectionDetails.map((conn, idx) => {
            const count = connectionDetails.length;
            const angle = (idx * (2 * Math.PI)) / count - Math.PI / 2;
            const nx = cx + radius * Math.cos(angle);
            const ny = cy + radius * Math.sin(angle);
            const isFocused = selectedIdx === idx;

            const nodeWidth = 110;
            const nodeHeight = 36;

            return (
              <g
                key={`node-${conn.name}-${idx}`}
                id={`${uid}-node-${idx}`}
                transform={`translate(${nx}, ${ny})`}
                tabIndex={0}
                role="button"
                aria-label={`${conn.name}: ${conn.disclosedAmount}. ${
                  conn.isRegistered ? "Click or press Enter to view company profile." : "External counterparty."
                }`}
                onFocus={() => setSelectedIdx(idx)}
                onKeyDown={(e) => handleKeyDown(e, idx)}
                onClick={() => {
                  if (conn.slug) router.push(`/companies/${conn.slug}`);
                }}
                className={conn.isRegistered ? "cursor-pointer focus:outline-hidden" : "focus:outline-hidden"}
              >
                {/* Node Box */}
                <rect
                  x={-nodeWidth / 2}
                  y={-nodeHeight / 2}
                  width={nodeWidth}
                  height={nodeHeight}
                  rx="6"
                  fill={isFocused ? "rgb(var(--c-surface-3))" : "rgb(var(--c-surface))"}
                  stroke={
                    isFocused
                      ? "rgb(var(--c-ink))"
                      : conn.isCircular
                      ? "#d1433c"
                      : "rgb(var(--c-rule))"
                  }
                  strokeWidth={isFocused ? 2 : 1.25}
                />
                {/* Node Name */}
                <text
                  x="0"
                  y="-2"
                  textAnchor="middle"
                  className="text-[12px] font-bold"
                  fill="rgb(var(--c-ink))"
                >
                  {conn.name.length > 14 ? `${conn.name.slice(0, 12)}…` : conn.name}
                </text>
                {/* Node Subtitle */}
                <text
                  x="0"
                  y="12"
                  textAnchor="middle"
                  className="text-[12px] font-mono text-ink-subtle"
                  fill={conn.isRegistered ? "var(--c-cat-cyan)" : "rgb(var(--c-ink-subtle))"}
                >
                  {conn.isRegistered ? "Profile ↗" : "Counterparty"}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Legend */}
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3 border-t border-rule pt-2 text-[12px] text-ink-muted">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="h-0.5 w-4 bg-risk-500 inline-block" />
              Circular connection (capital/compute loop)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-0.5 w-4 bg-rule-strong inline-block border-t border-dashed" />
              Arm&apos;s-length / standard vendor
            </span>
          </div>
          <span className="text-ink-subtle">
            Use arrow keys or Tab to navigate nodes; press Enter to open profile
          </span>
        </div>
      </div>

      {/* Table Fallback */}
      <div
        id="circularity-table-fallback"
        className={`${showTable ? "block" : "sr-only focus-within:not-sr-only"} mt-4 overflow-x-auto`}
      >
        <table className="w-full text-left text-[14px]">
          <caption className="py-2 text-left text-[13px] font-semibold uppercase tracking-wider text-ink-subtle">
            Table Fallback: Disclosed Circularity and Counterparty Connections for {company.name}
          </caption>
          <thead>
            <tr className="border-b border-rule text-ink-subtle">
              <th scope="col" className="py-2.5 pr-4 font-semibold">Counterparty</th>
              <th scope="col" className="py-2.5 pr-4 font-semibold">Status</th>
              <th scope="col" className="py-2.5 pr-4 font-semibold text-right">Disclosed Amount</th>
              <th scope="col" className="py-2.5 pr-4 font-semibold">Classification</th>
              <th scope="col" className="py-2.5 font-semibold">Evidence Basis</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-rule font-tabular">
            {connectionDetails.map((conn) => (
              <tr key={conn.name} className="hover:bg-surface-2 transition-colors">
                <th scope="row" className="py-2.5 pr-4 font-medium text-ink">
                  {conn.isRegistered && conn.slug ? (
                    <Link
                      href={`/companies/${conn.slug}`}
                      className="min-h-[44px] inline-flex items-center gap-1 font-semibold text-ink hover:underline"
                    >
                      {conn.name}
                      <ExternalLink className="h-3.5 w-3.5 text-ink-muted" aria-hidden="true" />
                    </Link>
                  ) : (
                    <span>{conn.name}</span>
                  )}
                </th>
                <td className="py-2.5 pr-4 text-ink-muted">
                  {conn.isRegistered ? (
                    <span className="pill pill-compact">Tracked Profile</span>
                  ) : (
                    <span className="rounded-xs bg-surface-3 px-1.5 py-0.5 text-[12px] text-ink-subtle">
                      External Entity
                    </span>
                  )}
                </td>
                <td className="num py-2.5 pr-4 text-right font-semibold text-ink">
                  {conn.disclosedAmount}
                </td>
                <td className="py-2.5 pr-4">
                  <span className={`chip ${conn.isCircular ? "chip-risk" : ""}`}>
                    {conn.isCircular ? "Circular Risk" : "Arm's Length"}
                  </span>
                </td>
                <td className="py-2.5 text-ink-muted text-[13px]">
                  {conn.trancheCount > 0
                    ? `${conn.trancheCount} debt facility`
                    : conn.dealCount > 0
                    ? `${conn.dealCount} ledger transaction`
                    : "Public regulatory filing / partnership disclosure"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Honest Scope Disclosure */}
      <p className="flex items-start gap-2 text-[14px] text-ink-subtle">
        <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ink-muted" aria-hidden="true" />
        <span>
          A disclosed connection demonstrates counterparty exposure, joint infrastructure agreements, or
          underwritten borrowing. It does not constitute proof of an artificial financial loop. Amounts
          represent verified public ledger records and debt facility disclosures.
        </span>
      </p>
    </section>
  );
}
