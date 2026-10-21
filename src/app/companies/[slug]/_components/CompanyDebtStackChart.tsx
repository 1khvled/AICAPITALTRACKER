"use client";

import React, { useState } from "react";
import { formatUsd, type CompanyDebtTranche } from "../../_components/companyData";
import { ChevronDown, Info } from "lucide-react";

interface CompanyDebtStackChartProps {
  companyName: string;
  tranches: CompanyDebtTranche[];
  totalDebtUsd: number;
}

export function CompanyDebtStackChart({
  companyName,
  tranches,
  totalDebtUsd,
}: CompanyDebtStackChartProps) {
  const [showTable, setShowTable] = useState(false);

  if (!tranches || tranches.length === 0 || totalDebtUsd <= 0) {
    return (
      <section className="card space-y-3" aria-labelledby="debt-stack-title">
        <div className="flex items-center justify-between border-b border-rule pb-2">
          <h2 id="debt-stack-title" className="text-lg font-bold tracking-tight text-ink">
            Disclosed Debt Stack & Facilities
          </h2>
          <span className="pill pill-safe">Debt Free</span>
        </div>
        <p className="text-[15px] leading-relaxed text-ink-muted">
          No debt tranches or borrowing facilities are disclosed in public regulatory filings or our
          transaction ledger for {companyName}. Operations and infrastructure commitments are funded
          entirely through equity capital, corporate cash flow, or customer pre-payments.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[14px]">
            <caption className="sr-only">Disclosed Debt Facilities for {companyName}</caption>
            <thead>
              <tr className="border-b border-rule text-ink-subtle">
                <th scope="col" className="py-2 pr-4 font-medium">Facility / Tranche</th>
                <th scope="col" className="py-2 pr-4 font-medium">Type</th>
                <th scope="col" className="py-2 pr-4 font-medium text-right">Amount</th>
                <th scope="col" className="py-2 pr-4 font-medium">Creditors</th>
                <th scope="col" className="py-2 font-medium">Terms / Collateral</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={5} className="py-3 text-center text-ink-subtle italic">
                  No debt tranches disclosed. Total tracked debt: $0.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    );
  }

  // Max tranche amount for proportional bar scaling
  const maxTranche = Math.max(...tranches.map((t) => t.amountUsd), 1);

  return (
    <section className="card space-y-4" aria-labelledby="debt-stack-title">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-rule pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 id="debt-stack-title" className="text-lg font-bold tracking-tight text-ink">
              Disclosed Debt Stack & Facilities
            </h2>
            <span className="pill pill-risk num">
              {tranches.length} {tranches.length === 1 ? "tranche" : "tranches"}
            </span>
          </div>
          <p className="mt-0.5 text-[14px] text-ink-subtle">
            Sum of disclosed facilities and filed balance-sheet debt:{" "}
            <span className="num font-semibold text-ink">{formatUsd(totalDebtUsd)}</span>
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowTable((prev) => !prev)}
          aria-expanded={showTable}
          aria-controls="debt-stack-table-fallback"
          className="flex min-h-[44px] items-center gap-1.5 text-[13px] font-medium text-ink-muted transition-colors hover:text-ink focus:outline-hidden focus:underline"
        >
          {showTable ? "Hide data table" : "Show data table fallback"}
          <ChevronDown
            className={`h-4 w-4 transition-transform duration-200 ${showTable ? "rotate-180" : ""}`}
            aria-hidden="true"
          />
        </button>
      </div>

      {/* Visual Debt Stack: One horizontal bar per tranche sized by amount */}
      <div
        className="space-y-4"
        role="region"
        aria-label={`Visual Debt Stack chart for ${companyName}`}
      >
        {tranches.map((tranche, idx) => {
          const pct = Math.max(8, Math.round((tranche.amountUsd / maxTranche) * 100));
          const shareOfTotal = ((tranche.amountUsd / totalDebtUsd) * 100).toFixed(1);

          return (
            <div
              key={`${tranche.label}-${idx}`}
              className="panel space-y-2 p-3 transition-colors hover:border-rule-strong"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <div className="min-w-0">
                  <span className="text-[14px] font-bold text-ink">{tranche.label}</span>
                  <span className="ml-2 inline-block rounded-xs bg-surface-3 px-1.5 py-0.5 text-[12px] font-medium text-ink-muted">
                    {tranche.type}
                  </span>
                </div>
                <div className="num shrink-0 text-[15px] font-semibold text-ink">
                  {formatUsd(tranche.amountUsd)}{" "}
                  <span className="text-[12px] font-normal text-ink-subtle">
                    ({shareOfTotal}% of debt)
                  </span>
                </div>
              </div>

              {/* Bar track and fill */}
              <div
                className="h-2 w-full overflow-hidden rounded-full bg-surface-3"
                role="progressbar"
                aria-valuenow={tranche.amountUsd}
                aria-valuemin={0}
                aria-valuemax={maxTranche}
                aria-label={`${tranche.label}: ${formatUsd(tranche.amountUsd)}`}
              >
                <div
                  className="h-full bg-risk-500 transition-all duration-300"
                  style={{ width: `${pct}%` }}
                />
              </div>

              {/* Creditors and notes */}
              <div className="grid grid-cols-1 gap-1 text-[13px] text-ink-muted sm:grid-cols-2">
                {tranche.creditors ? (
                  <div>
                    <span className="font-medium text-ink-subtle">Creditors / Underwriters: </span>
                    <span className="text-ink">{tranche.creditors}</span>
                  </div>
                ) : null}
                {tranche.notes ? (
                  <div className="sm:col-span-2">
                    <span className="font-medium text-ink-subtle">Terms / Purpose: </span>
                    <span>{tranche.notes}</span>
                  </div>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>

      {/* Table Fallback (always in DOM, toggleable for full screen reader accessibility) */}
      <div
        id="debt-stack-table-fallback"
        className={`${showTable ? "block" : "sr-only focus-within:not-sr-only"} mt-4 overflow-x-auto`}
      >
        <table className="w-full text-left text-[14px]">
          <caption className="py-2 text-left text-[13px] font-semibold uppercase tracking-wider text-ink-subtle">
            Table Fallback: Debt Tranches and Borrowing Stack for {companyName}
          </caption>
          <thead>
            <tr className="border-b border-rule text-ink-subtle">
              <th scope="col" className="py-2.5 pr-4 font-semibold">Tranche</th>
              <th scope="col" className="py-2.5 pr-4 font-semibold">Type</th>
              <th scope="col" className="py-2.5 pr-4 font-semibold text-right">Amount</th>
              <th scope="col" className="py-2.5 pr-4 font-semibold">Creditors</th>
              <th scope="col" className="py-2.5 font-semibold">Notes / Covenants</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-rule font-tabular">
            {tranches.map((t, idx) => (
              <tr key={idx} className="hover:bg-surface-2 transition-colors">
                <th scope="row" className="py-2.5 pr-4 font-medium text-ink">
                  {t.label}
                </th>
                <td className="py-2.5 pr-4 text-ink-muted">{t.type}</td>
                <td className="num py-2.5 pr-4 text-right font-semibold text-ink">
                  {formatUsd(t.amountUsd)}
                </td>
                <td className="py-2.5 pr-4 text-ink-muted">{t.creditors ?? "\u2014"}</td>
                <td className="py-2.5 text-ink-muted">{t.notes ?? "\u2014"}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-rule font-semibold text-ink">
              <th scope="row" colSpan={2} className="py-2.5 pr-4">Total Disclosed Debt</th>
              <td className="num py-2.5 pr-4 text-right font-bold text-ink">{formatUsd(totalDebtUsd)}</td>
              <td colSpan={2} className="py-2.5 text-[12px] text-ink-subtle">Verified regulatory filings & ledger facilities</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </section>
  );
}
