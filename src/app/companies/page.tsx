import React, { Suspense } from "react";
import Link from "next/link";
import { ArrowRight, CircleDollarSign } from "lucide-react";
import { AdSlot } from "@/components/AdSlot";
import CompanyBrowser from "./_components/CompanyBrowser";
import { COMPANIES, companyStats, formatUsd } from "./_components/companyData";
import { buildLedgerLinks } from "./_components/ledgerSearchTerms";
import { ledgerStats } from "../ledger/_components/ledgerData";

/**
 * /companies — the same money, grouped by who borrowed it.
 *
 * Server component: every figure in the header is computed from the profile
 * table at request time. Searching, filtering and opening a company's debt
 * tranches happen in the client browser below.
 *
 * Two debt bases are on show and they are not the same number, so both are
 * labelled (2026-10-19):
 *   · $474.3B — every debt tranche listed on the 22 profiles: ledger facilities
 *     plus balance-sheet borrowings from the latest 10-K / 10-Q.
 *   · $214.9B — the ledger's own debt base: the 24 records in
 *     src/data/deals.json flagged is_debt, which is also what
 *     src/data/live-inputs.json reports as aiDebt.totalTrackedDebtUsd.
 * The tile headline is the wider number, so the label says "Debt tracked" and
 * the sublabel names the narrower ledger base instead of implying one figure
 * covers both.
 */

const stats = companyStats();
const ledger = ledgerStats();
const ledgerLinks = buildLedgerLinks(COMPANIES.map((c) => c.name));
// Committed across profiles against the ledger total: the same capital seen
// from both sides, so the profile sum runs above the ledger sum.
const committedRatio = `${(stats.totalVolumeUsd / ledger.totalUsd).toFixed(2)}\u00d7`;

const TERMS: { term: string; plain: string }[] = [
  {
    term: "Committed",
    plain: "The total value of the disclosed transactions attributed to this company in our ledger.",
  },
  {
    term: "Debt",
    plain: "Borrowed money — loans, bonds and convertible notes that must be repaid with interest.",
  },
  {
    term: "P/S multiple",
    plain: "Price to sales: what investors pay for each dollar of a company's annual revenue. High multiples mean expectations, not cash.",
  },
  {
    term: "Debt tranche",
    plain: "One slice of a company's borrowing, with its own lenders, size and terms.",
  },
  {
    term: "Circular financing",
    plain: "A company funds a customer who then spends that money straight back with the same company or its partner.",
  },
  {
    term: "Risk tier",
    plain: "Our own read of how much of this company's capital is equity, debt or circular, and how exposed that structure is.",
  },
];

function BrowserFallback() {
  return (
    <div className="mt-6 space-y-3" aria-hidden="true">
      <div className="skeleton h-20 w-full" />
      <div className="skeleton h-64 w-full" />
      <div className="skeleton h-64 w-full" />
    </div>
  );
}

export default function CompaniesPage() {
  return (
    <div className="section-sm">
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
          <span className="label">Companies</span>
          <span className="pill">{stats.count} profiles</span>
          <span className="num text-[14px] text-ink-faint">{stats.bySector.length} sectors</span>
        </div>

        <h1 className="max-w-reading text-3xl font-bold tracking-tight text-ink sm:text-4xl">
          Who borrowed the money, and who has to repay it
        </h1>

        <p className="prose prose-lead max-w-reading">
          {stats.count} companies that carry the AI build-out: what each one has committed, how much
          of it is borrowed money, what the valuation implies, and where the funding loops back on
          itself. Totals here count a deal once per company involved, so they run{" "}
          <span className="num">{committedRatio}</span> the ledger total of{" "}
          <span className="num">{formatUsd(ledger.totalUsd)}</span> — the same capital seen from
          different sides.
        </p>

        <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-rule bg-rule sm:grid-cols-4">
          <div className="bg-surface p-4">
            <dt className="label">Committed across profiles</dt>
            <dd className="num mt-1 text-2xl font-semibold tracking-tight text-ink">
              {formatUsd(stats.totalVolumeUsd)}
            </dd>
            <dd className="mt-0.5 text-[14px] text-ink-subtle">counts shared deals twice</dd>
          </div>
          <div className="bg-surface p-4">
            {/* Two honest bases, two different totals (both computed at request
                time from src/data/deals.json and the 10-K / 10-Q figures in
                companyData.ts, re-checked 2026-10-19):
                  · headline = sum of every debt tranche on the 22 profiles,
                    i.e. ledger facilities + filed balance-sheet borrowings.
                  · ledger-only = the 24 is_debt records in the ledger, the same
                    base as /ledger's "Debt committed" tile and
                    live-inputs.json aiDebt.totalTrackedDebtUsd.
                The label says "Debt tracked" and the sublabel names the second
                base, so neither number pretends to cover both. */}
            <dt className="label">Debt tracked</dt>
            <dd className="num mt-1 text-2xl font-semibold tracking-tight text-ink">
              {formatUsd(stats.totalDebtUsd)}
            </dd>
            <dd className="mt-0.5 text-[14px] text-ink-subtle">
              ledger facilities + filed borrowings · ledger-only total{" "}
              <span className="num">{formatUsd(ledger.debtUsd)}</span>
            </dd>
            <dd className="mt-0.5 text-[14px] text-ink-subtle">
              <span className="num">
                {COMPANIES.filter((c) => c.debtInvolvedUsd > 0).length}
              </span>{" "}
              of {stats.count} carry debt
            </dd>
          </div>
          <div className="bg-surface p-4">
            <dt className="label">Circular financing</dt>
            <dd className="num mt-1 text-2xl font-semibold tracking-tight text-ink">
              {stats.circularCount} / {stats.count}
            </dd>
            <dd className="mt-0.5 text-[14px] text-ink-subtle">money that loops back</dd>
          </div>
          <div className="bg-surface p-4">
            <dt className="label">Debt free</dt>
            <dd className="num mt-1 text-2xl font-semibold tracking-tight text-ink">
              {stats.debtFreeCount}
            </dd>
            <dd className="mt-0.5 text-[14px] text-ink-subtle">funded by equity or cash flow</dd>
          </div>
        </dl>

        <AdSlot placementId="companies-top" className="mt-1" />
      </div>

      <Suspense fallback={<BrowserFallback />}>
        <CompanyBrowser ledgerLinks={ledgerLinks} />
      </Suspense>

      <AdSlot placementId="companies-mid" className="mt-10" />

      <section className="mt-10 max-w-measure" aria-labelledby="companies-terms">
        <h2 id="companies-terms" className="text-sm font-bold tracking-tight text-ink">
          The terms used on this page
        </h2>
        <dl className="mt-3 divide-y divide-rule border-y border-rule">
          {TERMS.map((item) => (
            <div key={item.term} className="grid grid-cols-1 gap-1 py-2.5 sm:grid-cols-[11rem_1fr] sm:gap-4">
              <dt className="text-[14px] font-semibold text-ink">{item.term}</dt>
              <dd className="text-[14px] leading-relaxed text-ink-muted">{item.plain}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-3" aria-label="Next steps">
        <Link
          href="/ledger"
          className="card card-flush flex flex-col gap-1 p-4 transition-colors hover:border-rule-strong"
        >
          <span className="label">The raw deals</span>
          <span className="text-[15px] font-semibold text-ink">Every transaction behind these totals</span>
          <span className="mt-1 text-[14px] text-ink-subtle">
            Search the full ledger by company, type, year or status.
          </span>
          <span className="mt-2 flex items-center gap-1 text-[14px] font-medium text-ink">
            Open the ledger
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </span>
        </Link>

        <Link
          href="/markets"
          className="card card-flush flex flex-col gap-1 p-4 transition-colors hover:border-rule-strong"
        >
          <span className="label">Live prices</span>
          <span className="text-[15px] font-semibold text-ink">What these companies trade at</span>
          <span className="mt-1 text-[14px] text-ink-subtle">
            Daily quotes for listed names, plus the credit spreads behind the debt.
          </span>
          <span className="mt-2 flex items-center gap-1 text-[14px] font-medium text-ink">
            Open markets
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </span>
        </Link>

        <Link
          href="/methodology"
          className="card card-flush flex flex-col gap-1 p-4 transition-colors hover:border-rule-strong"
        >
          <span className="label">Scoring rules</span>
          <span className="text-[15px] font-semibold text-ink">How risk tiers are assigned</span>
          <span className="mt-1 text-[14px] text-ink-subtle">
            The weights, the thresholds and the failure cases, written out.
          </span>
          <span className="mt-2 flex items-center gap-1 text-[14px] font-medium text-ink">
            Read the method
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </span>
        </Link>
      </section>

      <AdSlot placementId="companies-bottom" className="mt-10" />

      <p className="mt-8 flex items-start gap-2 text-[14px] text-ink-subtle">
        <CircleDollarSign className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        <span>
          Profiles summarise public filings, prospectuses and counterpart disclosures. Prediction
          market links may carry a referral fee; they never change the numbers here. Nothing on
          this page is investment advice.
        </span>
      </p>
    </div>
  );
}