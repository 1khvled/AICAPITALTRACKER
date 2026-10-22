import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, AlertTriangle } from "lucide-react";
import rawDeals from "@/data/deals.json";
import { evaluateBubbleModel, DEFAULT_MODEL_INPUTS } from "@/lib/model/engine";
import { formatBillions, formatTrillions, formatAsOf } from "@/components/home/copy";
import { AnswerPageLayout } from "@/components/answer-pages/AnswerPageLayout";
import { COMPANIES } from "@/app/companies/_components/companyData";
import { resolveContracts } from "@/components/answer-pages/answerData";
import trajectoryHistory from "@/data/trajectory-history.json";

/** The debt number in the metadata is the ledger's own number. */
export function generateMetadata(): Metadata {
  const debtDeals = rawDeals.filter((d) => d.is_debt);
  const debtUsd = debtDeals.reduce((sum, d) => sum + (d.amount_usd || 0), 0);
  const debt = formatBillions(debtUsd);
  const description = `The complete tally of AI debt: ${debt} borrowed across ${debtDeals.length} verified deals, detailing top borrowers and repayment risks.`;

  return {
    title: `How much AI debt is there? All ${debt} in tracked borrowing`,
    description,
    openGraph: {
      title: `How much AI debt is there? All ${debt} in tracked borrowing`,
      description,
      url: "/how-much-ai-debt-there-is",
      type: "article",
      images: ["/opengraph-image.png"],
    },
    alternates: {
      canonical: "/how-much-ai-debt-there-is",
    },
  };
}

interface TrajectoryPointLite {
  date?: string;
  probability?: number;
}

export default function HowMuchAiDebtThereIsPage() {
  const result = evaluateBubbleModel(DEFAULT_MODEL_INPUTS);
  const history = (Array.isArray(trajectoryHistory) ? trajectoryHistory : []) as TrajectoryPointLite[];
  const latestPoint = history[history.length - 1];
  const asOf = latestPoint?.date ? formatAsOf(latestPoint.date) : "21 Oct 2026";

  // ── Compute Debt Aggregates ──────────────────────────────────────────────
  const debtDeals = rawDeals
    .filter((d) => d.is_debt)
    .sort((a, b) => (b.amount_usd || 0) - (a.amount_usd || 0));

  const totalDebtUsd = debtDeals.reduce((sum, d) => sum + (d.amount_usd || 0), 0);
  const debtCount = debtDeals.length;
  const debtTotalDisplay = formatBillions(totalDebtUsd);

  const totalDisclosedUsd = rawDeals.reduce((sum, d) => sum + (d.amount_usd || 0), 0);
  const debtSharePct = (totalDebtUsd / totalDisclosedUsd) * 100;

  const annualIssuanceUsd = DEFAULT_MODEL_INPUTS.aiDebt?.annualDebtIssuanceUsd ?? 0;
  const annualIssuanceDisplay = formatBillions(annualIssuanceUsd);
  const depreciationDragUsd = DEFAULT_MODEL_INPUTS.aiDebt?.gpuDepreciationDragUsd ?? 0;

  // The largest single facility, named from the ledger record itself.
  const largestFacility = debtDeals[0];
  const largestFacilityLabel = largestFacility
    ? largestFacility.title.split("$")[0].trim()
    : "";

  // Group debt by company profile
  const companiesWithDebt = [...COMPANIES]
    .filter((c) => c.debtInvolvedUsd > 0)
    .sort((a, b) => b.debtInvolvedUsd - a.debtInvolvedUsd);

  const topBorrowers = companiesWithDebt.slice(0, 8);
  const maxBorrowerDebt = topBorrowers[0]?.debtInvolvedUsd || 1;

  // The largest disclosed convertible-note facility and the public bond band —
  // both read from the ledger, never typed.
  const largestConvertibleUsd = debtDeals.find((d) => /convertible/i.test(d.title))?.amount_usd ?? 0;
  const publicBondDeals = debtDeals.filter(
    (d) =>
      /senior notes|bond offering|bond sale|bond issuance/i.test(d.title) &&
      !/convertible/i.test(d.title),
  );
  const publicBondMinUsd = publicBondDeals.length
    ? Math.min(...publicBondDeals.map((d) => d.amount_usd || 0))
    : 0;
  const publicBondMaxUsd = publicBondDeals.length
    ? Math.max(...publicBondDeals.map((d) => d.amount_usd || 0))
    : 0;

  // Polymarket betting contracts matching AI debt & credit stress
  const polymarketContracts = resolveContracts([
    "poly-bubble-2027",
    "poly-us-recession-2026",
  ]);

  // SVG dimensions for top borrowers horizontal bar chart
  const barSvgWidth = 600;
  const rowHeight = 32;
  const barSvgHeight = topBorrowers.length * rowHeight + 20;

  return (
    <AnswerPageLayout
      question="How much AI debt is there?"
      categoryLabel="Corporate Borrowing"
      asOf={asOf}
      answerLead={`${debtTotalDisplay} of debt has been raised to build AI, across ${debtCount} verified credit facilities, private loans and bond issues. That is ${debtSharePct.toFixed(1)}% of the ${formatTrillions(totalDisclosedUsd)} of AI spending we track.`}
      answerContext={`New AI debt is being issued at roughly ${annualIssuanceDisplay} a year. Unlike ordinary corporate borrowing, much of this debt is collateralised by GPU server clusters — racks of specialised chips that run AI models, and which are worth much less after three to four years as newer chips arrive.`}
      polymarketContracts={polymarketContracts}
      notThisItems={[
        "It is not total global corporate debt; it reflects verified borrowings, convertible notes, private credit lines, and bond sales tied specifically to AI computing capacity and data center infrastructure.",
        "It does not assume all borrowing is insolvent; major hyperscalers (Microsoft, Alphabet, Meta) hold high investment-grade credit ratings, but smaller specialized cloud providers carry substantial leverage.",
        "It excludes informal, unannounced, or non-binding letters of credit that have not yet closed or funded.",
        "It is not the debt of the AI industry as a whole — it is the debt attached to AI build-out we could verify in a filing. Borrowings for other corporate purposes are not counted.",
      ]}
    >
      {/* ── Key Metrics Summary Tiles ───────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="card p-4 space-y-1">
          <span className="label">Total AI Debt</span>
          <p className="num text-2xl font-bold text-risk-600 dark:text-risk-400">
            {debtTotalDisplay}
          </p>
          <span className="text-[13px] text-ink-subtle">{debtCount} filed facilities</span>
        </div>
        <div className="card p-4 space-y-1">
          <span className="label">Annual Run-Rate</span>
          <p className="num text-2xl font-bold text-ink">{annualIssuanceDisplay}/yr</p>
          <span className="text-[13px] text-ink-subtle">This year&rsquo;s pace, annualised</span>
        </div>
        <div className="card p-4 space-y-1">
          <span className="label">Largest Facility</span>
          <p className="num text-2xl font-bold text-ink">
            {largestFacility ? formatBillions(largestFacility.amount_usd || 0) : "—"}
          </p>
          <span className="text-[13px] text-ink-subtle">{largestFacilityLabel}</span>
        </div>
        <div className="card p-4 space-y-1">
          <span className="label">12-Mo Burst Odds</span>
          <p className="num text-2xl font-bold text-accent-strong dark:text-accent-ink">
            {result.burstProbability.toFixed(1)}%
          </p>
          <span className="text-[13px] text-ink-subtle">From credit &amp; cash flows</span>
        </div>
      </div>

      {/* ── Section 1: The Biggest Borrowers Chart ──────────────────────────── */}
      <section aria-labelledby="borrowers-heading" className="card p-5 space-y-4 shadow-card">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-rule pb-3">
          <div>
            <h2 id="borrowers-heading" className="text-lg font-bold tracking-tight text-ink">
              Who is borrowing: the biggest AI debt balances
            </h2>
            <p className="mt-0.5 text-[14px] text-ink-muted">
              Includes filed corporate bond offerings, convertible note facilities, and bank
              syndicates.
            </p>
          </div>
          <Link
            href="/companies"
            className="inline-flex min-h-[44px] items-center gap-1 text-[13px] font-medium text-ink underline decoration-rule underline-offset-4 hover:decoration-ink"
          >
            See all {COMPANIES.length} company dossiers
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </div>

        {/* SVG Horizontal Bar Chart */}
        <div
          role="img"
          aria-labelledby="borrower-chart-title"
          aria-describedby="borrower-chart-desc"
          className="overflow-x-auto"
        >
          <p id="borrower-chart-title" className="sr-only">
            Top AI corporate borrowers bar chart
          </p>
          <p id="borrower-chart-desc" className="sr-only">
            Bar chart showing {topBorrowers
              .slice(0, 3)
              .map((b) => `${b.name} at ${formatBillions(b.debtInvolvedUsd)}`)
              .join(", ")}.
          </p>

          <svg
            viewBox={`0 0 ${barSvgWidth} ${barSvgHeight}`}
            className="w-full h-auto select-none min-w-[560px]"
            aria-hidden="true"
          >
            {topBorrowers.map((b, i) => {
              const y = i * rowHeight + 10;
              const barWidth = Math.max(4, (b.debtInvolvedUsd / maxBorrowerDebt) * 260);

              return (
                <g key={b.name}>
                  {/* Company Name */}
                  <text
                    x={160}
                    y={y + 16}
                    textAnchor="end"
                    className="text-[13px] font-semibold fill-ink"
                  >
                    {b.name}
                  </text>

                  {/* Track */}
                  <rect
                    x={170}
                    y={y + 4}
                    width={260}
                    height={16}
                    rx={3}
                    className="fill-surface-3"
                  />

                  {/* Active Bar */}
                  <rect
                    x={170}
                    y={y + 4}
                    width={barWidth}
                    height={16}
                    rx={3}
                    fill={i < 2 ? "var(--c-accent)" : "var(--c-cat-steel)"}
                  />

                  {/* Debt Amount Display */}
                  <text
                    x={445}
                    y={y + 16}
                    textAnchor="start"
                    className="num font-mono text-[13px] font-bold fill-ink"
                  >
                    {formatBillions(b.debtInvolvedUsd)}{" "}
                    <tspan className="text-[13px] font-normal fill-ink-faint">
                      ({b.debtTranches.length}{" "}
                      {b.debtTranches.length === 1 ? "tranche" : "tranches"})
                    </tspan>
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Accessible Table Fallback */}
        <div className="sr-only">
          <table>
            <caption>Tracked debt commitments by company</caption>
            <thead>
              <tr>
                <th scope="col">Company</th>
                <th scope="col">Tracked Debt</th>
                <th scope="col">Debt Tranches</th>
              </tr>
            </thead>
            <tbody>
              {topBorrowers.map((b) => (
                <tr key={b.name}>
                  <th scope="row">{b.name}</th>
                  <td>{formatBillions(b.debtInvolvedUsd)}</td>
                  <td>{b.debtTranches.length}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── Section 2: The Refinancing Question in Plain Words ────────────────── */}
      <section aria-labelledby="refinancing-heading" className="panel p-5 space-y-3 rule-accent-left">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-accent-strong dark:text-accent-ink shrink-0" aria-hidden="true" />
          <h2 id="refinancing-heading" className="text-lg font-bold tracking-tight text-ink">
            The refinancing question in plain words
          </h2>
        </div>
        <div className="space-y-2.5 text-[15px] leading-relaxed text-ink-muted">
          <p>
            When a real estate company borrows money to build an apartment building, the building
            lasts 50 years. Even if rental income dips for a year, the physical collateral retains
            value.
          </p>
          <p>
            <strong className="text-ink font-semibold">AI data centers are different:</strong> GPU
            silicon fleets (racks of Nvidia H100 and B200 chips) lose economic value fast, over three
            to four years. By the time a 2024 or 2025 loan matures in 2027&ndash;2029, the chips
            securing that loan will be two generations behind and worth a fraction of their purchase
            price. We put the annual write-down on the tracked chip fleet at{" "}
            {formatBillions(depreciationDragUsd)} a year.
          </p>
          <p>
            If high-yield credit spreads widen (the extra interest charged to riskier corporate
            borrowers) or AI software revenues do not generate enough operating profit to pay down
            principal, refinancing this debt will require either heavy equity dilution (selling new
            shares at a steep discount) or punitive interest rates. That is why credit default
            swaps (CDS — debt default insurance contracts) on anchors like Oracle have climbed to
            record highs.
          </p>
        </div>
      </section>

      {/* ── Section 3: The Tracked Debt Facilities Table ─────────────────────── */}
      <section aria-labelledby="deals-heading" className="card p-5 space-y-4 shadow-card">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-rule pb-3">
          <div>
            <h2 id="deals-heading" className="text-lg font-bold tracking-tight text-ink">
              The {debtCount} verified AI debt facilities
            </h2>
            <p className="mt-0.5 text-[14px] text-ink-muted">
              Every loan, convertible note, and bond facility recorded in the research ledger.
              Showing the 12 largest of {debtCount}; the rest are filterable in the ledger.
            </p>
          </div>
          <Link
            href="/ledger?filter=debt"
            className="inline-flex min-h-[44px] items-center gap-1 text-[13px] font-medium text-ink underline decoration-rule underline-offset-4 hover:decoration-ink"
          >
            Filter in ledger
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-[14px]">
            <caption className="sr-only">
              Verified corporate debt facilities and bond issuances in the AI Capital Tracker ledger
            </caption>
            <thead>
              <tr className="border-b border-rule text-ink-subtle">
                <th scope="col" className="py-2.5 pr-4 font-semibold">Deal / Facility</th>
                <th scope="col" className="py-2.5 pr-4 font-semibold">Date</th>
                <th scope="col" className="py-2.5 pr-4 font-semibold text-right">Disclosed Amount</th>
                <th scope="col" className="py-2.5 font-semibold text-right">Ledger Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rule font-tabular">
              {debtDeals.slice(0, 12).map((deal) => (
                <tr key={deal.id} className="hover:bg-surface-2 transition-colors">
                  <th scope="row" className="py-3 pr-4 font-medium text-ink max-w-sm sm:max-w-md">
                    <Link
                      href={`/ledger?deal=${deal.id}`}
                      className="min-h-[44px] flex items-center transition-colors hover:underline"
                    >
                      {deal.title}
                    </Link>
                  </th>
                  <td className="py-3 pr-4 num text-ink-muted whitespace-nowrap">
                    {deal.announced_date}
                  </td>
                  <td className="py-3 pr-4 font-mono font-bold text-ink text-right whitespace-nowrap">
                    {deal.amount_display || formatBillions(deal.amount_usd || 0)}
                  </td>
                  <td className="py-3 text-right">
                    <Link
                      href={`/ledger?deal=${deal.id}`}
                      className="inline-flex min-h-[44px] items-center text-[13px] font-medium text-ink underline decoration-rule underline-offset-4 hover:decoration-ink"
                    >
                      Receipt
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── Section 4: Debt Tranche Types ───────────────────────────────────── */}
      <section aria-labelledby="tranches-heading" className="card p-5 space-y-3">
        <h2 id="tranches-heading" className="text-lg font-bold tracking-tight text-ink">
          How AI debt is structured: the four kinds
        </h2>
        <p className="text-[14px] leading-relaxed text-ink-muted">
          A tranche is one slice of a financing — the piece that gets repaid first, or the piece
          that converts into shares. Four kinds account for the tracked facilities.
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 text-[14px] leading-relaxed text-ink-muted">
          <div className="panel p-3.5 space-y-1">
            <h3 className="font-semibold text-ink">1. Convertible Notes &amp; Vendor Credit</h3>
            <p>
              Loans provided by hardware suppliers or partners (the largest tracked example is{" "}
              {formatBillions(largestConvertibleUsd)} from Broadcom to Anthropic) that can convert
              into equity shares at IPO if not repaid.
            </p>
          </div>
          <div className="panel p-3.5 space-y-1">
            <h3 className="font-semibold text-ink">2. Asset-Backed GPU Debt</h3>
            <p>
              Special-purpose facilities (e.g. CoreWeave and xAI) where lenders like Blackstone and
              Apollo hold direct security liens (legal rights to seize physical hardware) on Nvidia
              GPU server clusters.
            </p>
          </div>
          <div className="panel p-3.5 space-y-1">
            <h3 className="font-semibold text-ink">3. Senior Investment-Grade Notes</h3>
            <p>
              Public corporate bonds issued by established, credit-worthy corporations (rated
              investment-grade, meaning agencies judge default unlikely) like Meta, Alphabet, and
              Oracle, in tranches of {formatBillions(publicBondMinUsd)} to{" "}
              {formatBillions(publicBondMaxUsd)}, used to finance data center campuses and energy
              utility hookups.
            </p>
          </div>
          <div className="panel p-3.5 space-y-1">
            <h3 className="font-semibold text-ink">4. Bank Syndicate Revolvers</h3>
            <p>
              Flexible revolving credit lines arranged by groups of commercial banks (JPMorgan,
              Goldman Sachs, Morgan Stanley) providing working capital while labs wait for model
              subscription cash.
            </p>
          </div>
        </div>
      </section>
    </AnswerPageLayout>
  );
}
