import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Layers, DollarSign, Building2, Cpu } from "lucide-react";
import rawDeals from "@/data/deals.json";
import { evaluateBubbleModel, DEFAULT_MODEL_INPUTS } from "@/lib/model/engine";
import { formatTrillions, formatBillions, formatAsOf } from "@/components/home/copy";
import { AnswerPageLayout } from "@/components/answer-pages/AnswerPageLayout";
import trajectoryHistory from "@/data/trajectory-history.json";
import { POLYMARKET_REFERRAL_CODE } from "@/data/polymarket-data";

export const metadata: Metadata = {
  title: "How Much Is Being Spent on AI? — $2.87T in Tracked Deals",
  description:
    "A receipt-backed breakdown of the $2.87 trillion committed to AI data centers, chips, power, and compute deals across 169 verified corporate filings.",
  openGraph: {
    title: "How Much Is Being Spent on AI? — $2.87T in Tracked Deals",
    description:
      "A complete receipt-backed breakdown of the $2.87 trillion spent on AI hardware, data centers, and compute deals.",
    url: "/how-much-is-being-spent-on-ai",
    type: "article",
    images: ["/opengraph-image.png"],
  },
  alternates: {
    canonical: "/how-much-is-being-spent-on-ai",
  },
};

interface TrajectoryPointLite {
  date?: string;
  probability?: number;
}

export default function HowMuchIsBeingSpentOnAiPage() {
  const result = evaluateBubbleModel(DEFAULT_MODEL_INPUTS);
  const history = (Array.isArray(trajectoryHistory) ? trajectoryHistory : []) as TrajectoryPointLite[];
  const latestPoint = history[history.length - 1];
  const asOf = latestPoint?.date ? formatAsOf(latestPoint.date) : "21 Oct 2026";

  // ── Compute Ledger Aggregates Dynamically ────────────────────────────────
  const totalDeals = rawDeals.length;
  const totalDisclosedUsd = rawDeals.reduce((sum, d) => sum + (d.amount_usd || 0), 0);
  const trackedTotalDisplay = formatTrillions(totalDisclosedUsd);

  // Group by category
  const categoryTotals: Record<string, number> = {};
  rawDeals.forEach((d) => {
    const cat = d.category || "Other";
    categoryTotals[cat] = (categoryTotals[cat] || 0) + (d.amount_usd || 0);
  });

  const categoriesSorted = Object.entries(categoryTotals)
    .map(([category, amount]) => ({
      category,
      amount,
      pct: (amount / totalDisclosedUsd) * 100,
    }))
    .sort((a, b) => b.amount - a.amount);

  // Group by year
  const annualTotals: Record<number, number> = {};
  rawDeals.forEach((d) => {
    if (d.year) {
      annualTotals[d.year] = (annualTotals[d.year] || 0) + (d.amount_usd || 0);
    }
  });

  const years = [2023, 2024, 2025, 2026];
  const annualData = years.map((y) => ({
    year: y,
    amount: annualTotals[y] || 0,
    label: formatTrillions(annualTotals[y] || 0),
  }));

  // Debt slice
  const debtDeals = rawDeals.filter((d) => d.is_debt);
  const totalDebtUsd = debtDeals.reduce((sum, d) => sum + (d.amount_usd || 0), 0);
  const debtSharePct = (totalDebtUsd / totalDisclosedUsd) * 100;

  // Compute contract slice
  const computeDeals = rawDeals.filter((d) => d.is_compute);
  const totalComputeUsd = computeDeals.reduce((sum, d) => sum + (d.amount_usd || 0), 0);

  // Top 8 Deals by dollar value
  const topDeals = [...rawDeals]
    .sort((a, b) => (b.amount_usd || 0) - (a.amount_usd || 0))
    .slice(0, 8);

  const polymarketContracts = [
    {
      question: "Will the AI bubble burst before June 2027?",
      probabilityPct: 19.5,
      volumeDisplay: "$9.2M",
      url: `https://polymarket.com/event/ai-bubble-burst-by?r=${POLYMARKET_REFERRAL_CODE}`,
    },
    {
      question: "Will OpenAI announce an IPO before 2027?",
      probabilityPct: 4.6,
      volumeDisplay: "$1.1M",
      url: `https://polymarket.com/event/openai-ipo-by?r=${POLYMARKET_REFERRAL_CODE}`,
    },
  ];

  // SVG dimensions for category horizontal bar chart
  const catSvgWidth = 600;
  const catRowHeight = 28;
  const catSvgHeight = categoriesSorted.length * catRowHeight + 20;
  const maxCatAmount = categoriesSorted[0]?.amount || 1;

  // SVG dimensions for annual spending column chart
  const colSvgWidth = 500;
  const colSvgHeight = 160;
  const maxYearAmount = Math.max(...annualData.map((d) => d.amount));

  return (
    <AnswerPageLayout
      question="How much is being spent on AI?"
      categoryLabel="Capital Expenditure"
      asOf={asOf}
      answerLead={`Across ${totalDeals} verified corporate filings and agreements, companies, investors, and cloud providers have committed ${trackedTotalDisplay} to artificial intelligence infrastructure, compute hardware, and data centers.`}
      answerContext={`Every dollar comes from primary filed sources in our 169-deal ledger. The spending is split between tech giants' operating cash flows, multi-year cloud leasing commitments, and $214.9B of debt facilities.`}
      polymarketContracts={polymarketContracts}
      notThisItems={[
        "It is not an estimate of global GDP impact or total consumer spending; it tracks disclosed corporate capital commitments, data center construction, GPU purchase contracts, and debt facilities.",
        "It is not double-counted: transactions involving equity investments that subsequently fund vendor hardware purchases are flagged and audited in the ledger's circularity factor.",
        "It is not a guess: deals with undisclosed terms are recorded with an amount of $0 rather than an invented estimate.",
      ]}
    >
      {/* ── Key Metrics Summary Tiles ───────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="card p-4 space-y-1">
          <span className="label">Total Disclosed</span>
          <p className="num text-2xl font-bold text-ink">{trackedTotalDisplay}</p>
          <span className="text-[13px] text-ink-subtle">{totalDeals} verified filings</span>
        </div>
        <div className="card p-4 space-y-1">
          <span className="label">Borrowed Debt</span>
          <p className="num text-2xl font-bold text-risk-600 dark:text-risk-400">
            {formatBillions(totalDebtUsd)}
          </p>
          <span className="text-[13px] text-ink-subtle">{debtSharePct.toFixed(1)}% of total</span>
        </div>
        <div className="card p-4 space-y-1">
          <span className="label">Compute Contracts</span>
          <p className="num text-2xl font-bold text-ink">
            {formatTrillions(totalComputeUsd)}
          </p>
          <span className="text-[13px] text-ink-subtle">Cloud &amp; GPU leases</span>
        </div>
        <div className="card p-4 space-y-1">
          <span className="label">Big-4 Capex (2026)</span>
          <p className="num text-2xl font-bold text-ink">$725B</p>
          <span className="text-[13px] text-ink-subtle">Guided by Big Tech</span>
        </div>
      </div>

      {/* ── Section 1: Where Does the Money Go? (Categories Chart) ─────────── */}
      <section aria-labelledby="categories-heading" className="card p-5 space-y-4 shadow-card">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-rule pb-3">
          <div>
            <h2 id="categories-heading" className="text-lg font-bold tracking-tight text-ink">
              Where the Money Goes: Spending by Category
            </h2>
            <p className="mt-0.5 text-[14px] text-ink-muted">
              Compute capacity contracts and physical data center construction account for nearly half of all spending.
            </p>
          </div>
          <Link
            href="/ledger"
            className="inline-flex min-h-[44px] items-center gap-1 text-[13px] font-medium text-ink underline decoration-rule underline-offset-4 hover:decoration-ink"
          >
            Explore all categories in ledger
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </div>

        {/* SVG Horizontal Bar Chart */}
        <div
          role="img"
          aria-labelledby="category-chart-title"
          aria-describedby="category-chart-desc"
          className="overflow-x-auto"
        >
          <p id="category-chart-title" className="sr-only">
            AI spending breakdown by category bar chart
          </p>
          <p id="category-chart-desc" className="sr-only">
            Horizontal bar chart showing compute contracts at {formatTrillions(categoryTotals["Compute contracts"] || 0)}, big construction at {formatTrillions(categoryTotals["Big construction"] || 0)}, and other categories.
          </p>

          <svg
            viewBox={`0 0 ${catSvgWidth} ${catSvgHeight}`}
            className="w-full h-auto select-none"
            aria-hidden="true"
          >
            {categoriesSorted.map((cat, i) => {
              const y = i * catRowHeight + 10;
              const barWidth = Math.max(4, (cat.amount / maxCatAmount) * 280);

              return (
                <g key={cat.category}>
                  {/* Category Label */}
                  <text
                    x={170}
                    y={y + 14}
                    textAnchor="end"
                    className="text-[13px] font-medium fill-ink"
                  >
                    {cat.category}
                  </text>

                  {/* Bar Background Track */}
                  <rect
                    x={180}
                    y={y + 3}
                    width={280}
                    height={14}
                    rx={3}
                    className="fill-surface-3"
                  />

                  {/* Active Value Bar */}
                  <rect
                    x={180}
                    y={y + 3}
                    width={barWidth}
                    height={14}
                    rx={3}
                    fill={i === 0 ? "var(--c-accent)" : "var(--c-cat-steel)"}
                  />

                  {/* Amount Text */}
                  <text
                    x={475}
                    y={y + 14}
                    textAnchor="start"
                    className="num font-mono text-[13px] font-semibold fill-ink"
                  >
                    {cat.amount >= 1e12
                      ? formatTrillions(cat.amount)
                      : formatBillions(cat.amount)}{" "}
                    <tspan className="text-[12px] font-normal fill-ink-faint">
                      ({cat.pct.toFixed(1)}%)
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
            <caption>Disclosed AI capital expenditure by category</caption>
            <thead>
              <tr>
                <th scope="col">Category</th>
                <th scope="col">Disclosed Capital</th>
                <th scope="col">Share of Total</th>
              </tr>
            </thead>
            <tbody>
              {categoriesSorted.map((cat) => (
                <tr key={cat.category}>
                  <th scope="row">{cat.category}</th>
                  <td>{formatBillions(cat.amount)}</td>
                  <td>{cat.pct.toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── Section 2: Annual Trajectory (2023 - 2026) ───────────────────────── */}
      <section aria-labelledby="annual-heading" className="card p-5 space-y-4 shadow-card">
        <h2 id="annual-heading" className="text-lg font-bold tracking-tight text-ink">
          The Acceleration: Annual Disclosed Commitments
        </h2>
        <p className="text-[15px] text-ink-muted leading-relaxed">
          AI spending exploded from $26.4B in 2023 to over $1.7T in 2025 as frontier labs signed multi-gigawatt infrastructure contracts and Big Tech accelerated capex budgets.
        </p>

        {/* SVG Column Chart */}
        <div
          role="img"
          aria-labelledby="annual-chart-title"
          aria-describedby="annual-chart-desc"
          className="overflow-x-auto"
        >
          <p id="annual-chart-title" className="sr-only">
            Annual AI capital commitments 2023 to 2026
          </p>
          <p id="annual-chart-desc" className="sr-only">
            Column chart showing $26.4B in 2023, $294.6B in 2024, $1.74T in 2025, and $812.5B in 2026 so far.
          </p>

          <svg
            viewBox={`0 0 ${colSvgWidth} ${colSvgHeight}`}
            className="w-full h-auto select-none"
            aria-hidden="true"
          >
            {annualData.map((d, i) => {
              const barW = 54;
              const spacing = 110;
              const x = 50 + i * spacing;
              const barH = Math.max(6, (d.amount / maxYearAmount) * 95);
              const y = colSvgHeight - 35 - barH;

              return (
                <g key={d.year}>
                  {/* Column Bar */}
                  <rect
                    x={x}
                    y={y}
                    width={barW}
                    height={barH}
                    rx={4}
                    fill={d.year === 2025 ? "var(--c-accent)" : "var(--c-cat-navy)"}
                  />

                  {/* Value on top of bar */}
                  <text
                    x={x + barW / 2}
                    y={y - 8}
                    textAnchor="middle"
                    className="num font-mono text-[13px] font-bold fill-ink"
                  >
                    {d.label}
                  </text>

                  {/* Year label below */}
                  <text
                    x={x + barW / 2}
                    y={colSvgHeight - 12}
                    textAnchor="middle"
                    className="num text-[14px] font-medium fill-ink-muted"
                  >
                    {d.year}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Accessible Table Fallback */}
        <div className="sr-only">
          <table>
            <caption>Annual AI capital commitments by year</caption>
            <thead>
              <tr>
                <th scope="col">Year</th>
                <th scope="col">Disclosed Total</th>
              </tr>
            </thead>
            <tbody>
              {annualData.map((d) => (
                <tr key={d.year}>
                  <th scope="row">{d.year}</th>
                  <td>{d.label}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── Section 3: The Biggest Disclosed Deals ───────────────────────────── */}
      <section aria-labelledby="top-deals-heading" className="card p-5 space-y-4 shadow-card">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-rule pb-3">
          <div>
            <h2 id="top-deals-heading" className="text-lg font-bold tracking-tight text-ink">
              The Largest Disclosed AI Transactions
            </h2>
            <p className="mt-0.5 text-[14px] text-ink-muted">
              The top 10 transactions represent over 60% of all disclosed capital in the ledger.
            </p>
          </div>
          <Link
            href="/ledger"
            className="inline-flex min-h-[44px] items-center gap-1 text-[13px] font-medium text-ink underline decoration-rule underline-offset-4 hover:decoration-ink"
          >
            View all 169 deals
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-[14px]">
            <caption className="sr-only">
              The largest disclosed artificial intelligence transactions in the ledger
            </caption>
            <thead>
              <tr className="border-b border-rule text-ink-subtle">
                <th scope="col" className="py-2.5 pr-4 font-semibold">Deal / Transaction</th>
                <th scope="col" className="py-2.5 pr-4 font-semibold">Category</th>
                <th scope="col" className="py-2.5 pr-4 font-semibold">Year</th>
                <th scope="col" className="py-2.5 font-semibold text-right">Disclosed Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rule font-tabular">
              {topDeals.map((deal) => (
                <tr key={deal.id} className="hover:bg-surface-2 transition-colors">
                  <th scope="row" className="py-3 pr-4 font-medium text-ink max-w-sm sm:max-w-md">
                    <Link
                      href={`/ledger?deal=${deal.id}`}
                      className="min-h-[44px] flex items-center transition-colors hover:underline"
                    >
                      {deal.title}
                    </Link>
                  </th>
                  <td className="py-3 pr-4 text-ink-muted">{deal.category}</td>
                  <td className="py-3 pr-4 num text-ink-muted">{deal.year}</td>
                  <td className="py-3 font-mono font-bold text-ink text-right whitespace-nowrap">
                    {deal.amount_display || formatBillions(deal.amount_usd || 0)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── Section 4: Who Is Funding It? ───────────────────────────────────── */}
      <section aria-labelledby="funding-heading" className="panel p-5 space-y-3">
        <h2 id="funding-heading" className="text-lg font-bold tracking-tight text-ink">
          Who Is Funding the Build-Out?
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 text-[14px] leading-relaxed text-ink-muted">
          <div className="space-y-1">
            <h3 className="font-semibold text-ink">1. Big-4 Hyperscalers</h3>
            <p>
              Microsoft, Alphabet, Amazon, and Meta guide roughly $725B in 2026 capex. They fund the bulk of their chips and data center shells out of $260B in annual operating cash flows.
            </p>
          </div>
          <div className="space-y-1">
            <h3 className="font-semibold text-ink">2. Private Credit &amp; Debt</h3>
            <p>
              Companies like CoreWeave, Anthropic, and Oracle have raised $214.9B in debt facilities, asset-backed loans against GPU servers, and convertible notes from Blackstone, Magnetar, and Broadcom.
            </p>
          </div>
          <div className="space-y-1">
            <h3 className="font-semibold text-ink">3. Equity &amp; Sovereign Funds</h3>
            <p>
              Frontier labs like OpenAI and Anthropic have raised hundreds of billions in venture and sovereign rounds (SoftBank, MGX, Thrive) at valuations reaching $1.2T to $2.0T.
            </p>
          </div>
        </div>
      </section>
    </AnswerPageLayout>
  );
}
