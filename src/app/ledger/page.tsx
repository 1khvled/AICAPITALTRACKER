import React, { Suspense } from "react";
import Link from "next/link";
import { ArrowRight, FileText } from "lucide-react";
import { AdSlot } from "@/components/AdSlot";
import LedgerBrowser from "./_components/LedgerBrowser";
import { GLOSSARY, formatTotal, ledgerStats } from "./_components/ledgerData";

/**
 * /ledger — the sourced record.
 *
 * Server component: the counts, totals and headline are computed from the deal
 * dataset at request time, so the sentence at the top of the page is never a
 * stale hardcoded number. Filtering, sorting and expanding all happen in the
 * client browser below.
 */

const stats = ledgerStats();

function BrowserFallback() {
  return (
    <div className="mt-6 space-y-3" aria-hidden="true">
      <div className="skeleton h-14 w-full" />
      <div className="skeleton h-40 w-full" />
      <div className="skeleton h-40 w-full" />
    </div>
  );
}

export default function LedgerPage() {
  return (
    <div className="section-sm">
      <div className="flex flex-col gap-4">
        {/* What this page is, in one line, before anything else */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
          <span className="label">Deal ledger</span>
          <span className="pill">
            {stats.dealCount} deals
          </span>
          <span className="num text-[14px] text-ink-faint">
            {stats.firstYear}–{stats.lastYear}
          </span>
        </div>

        <h1 className="max-w-reading text-3xl font-bold tracking-tight text-ink sm:text-4xl">
          Every AI financing we could source
        </h1>

        <p className="prose prose-lead max-w-reading">
          {stats.dealCount} disclosed transactions worth{" "}
          <span className="num font-semibold text-ink">{formatTotal(stats.totalUsd)}</span> in total —
          equity rounds, loans, chip and cloud contracts, power deals and property. Each row opens
          into the filing notes and the evidence behind it.
        </p>

        {/* The four numbers a reader actually wants */}
        <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-rule bg-rule sm:grid-cols-4">
          <div className="bg-surface p-4">
            <dt className="label">Tracked capital</dt>
            <dd className="num mt-1 text-2xl font-semibold tracking-tight text-ink">
              {formatTotal(stats.totalUsd)}
            </dd>
          </div>
          <div className="bg-surface p-4">
            <dt className="label">Debt committed</dt>
            <dd className="num mt-1 text-2xl font-semibold tracking-tight text-ink">
              {formatTotal(stats.debtUsd)}
            </dd>
            <dd className="mt-0.5 text-[14px] text-ink-subtle">
              <span className="num">{stats.debtCount}</span> facilities
            </dd>
          </div>
          <div className="bg-surface p-4">
            <dt className="label">Largest single deal</dt>
            <dd className="num mt-1 text-2xl font-semibold tracking-tight text-ink">
              {stats.largest ? stats.largest.display : "—"}
            </dd>
            <dd className="mt-0.5 line-clamp-1 text-[14px] text-ink-subtle">
              {stats.largest ? stats.largest.title : "No disclosed amounts"}
            </dd>
          </div>
          <div className="bg-surface p-4">
            <dt className="label">Entities tracked</dt>
            <dd className="num mt-1 text-2xl font-semibold tracking-tight text-ink">
              {stats.entityCount}
            </dd>
            <dd className="mt-0.5 text-[14px] text-ink-subtle">
              <span className="num">{stats.sourceCount}</span> sources counted
            </dd>
          </div>
        </dl>

        <AdSlot placementId="ledger-top" className="mt-1" />
      </div>

      {/* Filter, sort and read the records */}
      <Suspense fallback={<BrowserFallback />}>
        <LedgerBrowser />
      </Suspense>

      {/* The words on this page, defined once */}
      <section className="mt-10 max-w-measure" aria-labelledby="ledger-glossary">
        <h2 id="ledger-glossary" className="text-sm font-bold tracking-tight text-ink">
          The words used above, in plain English
        </h2>
        <dl className="mt-3 divide-y divide-rule border-y border-rule">
          {GLOSSARY.map((item) => (
            <div key={item.term} className="grid grid-cols-1 gap-1 py-2.5 sm:grid-cols-[11rem_1fr] sm:gap-4">
              <dt className="text-[14px] font-semibold text-ink">{item.term}</dt>
              <dd className="text-[14px] leading-relaxed text-ink-muted">{item.plain}</dd>
            </div>
          ))}
        </dl>
      </section>

      <AdSlot placementId="ledger-bottom" className="mt-10" />

      {/* Where to go next */}
      <section className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-3" aria-label="Next steps">
        <Link href="/companies" className="card card-flush flex flex-col gap-1 p-4 transition-colors hover:border-rule-strong">
          <span className="label">By company</span>
          <span className="text-[15px] font-semibold text-ink">Debt, revenue and multiples</span>
          <span className="mt-1 text-[14px] text-ink-subtle">
            The same money grouped by who borrowed it and who profited.
          </span>
          <span className="mt-2 flex items-center gap-1 text-[14px] font-medium text-ink">
            Open companies
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </span>
        </Link>

        <Link href="/methodology" className="card card-flush flex flex-col gap-1 p-4 transition-colors hover:border-rule-strong">
          <span className="label">Sourcing rules</span>
          <span className="text-[15px] font-semibold text-ink">How a deal gets in</span>
          <span className="mt-1 text-[14px] text-ink-subtle">
            What counts as a primary source, and what we refuse to publish.
          </span>
          <span className="mt-2 flex items-center gap-1 text-[14px] font-medium text-ink">
            Read the method
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </span>
        </Link>

        <Link href="/markets" className="card card-flush flex flex-col gap-1 p-4 transition-colors hover:border-rule-strong">
          <span className="label">Market check</span>
          <span className="text-[15px] font-semibold text-ink">Live quotes and spreads</span>
          <span className="mt-1 text-[14px] text-ink-subtle">
            What the listed companies and credit markets are doing today.
          </span>
          <span className="mt-2 flex items-center gap-1 text-[14px] font-medium text-ink">
            Open markets
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </span>
        </Link>
      </section>

      <p className="mt-8 flex items-start gap-2 text-[14px] text-ink-subtle">
        <FileText className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        <span>
          Amounts are what the parties disclosed, in the currency of the filing. Undisclosed deals
          are listed as events with no invented figure. Nothing here is investment advice.
        </span>
      </p>
    </div>
  );
}