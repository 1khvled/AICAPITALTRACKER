import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Clock, AlertCircle, Building2, TrendingUp } from "lucide-react";
import { AnswerPageLayout } from "@/components/answer-pages/AnswerPageLayout";
import { COMPANIES } from "@/app/companies/_components/companyData";
import { getCompanyDeals } from "@/app/companies/_components/ledgerSearchTerms";
import trajectoryHistory from "@/data/trajectory-history.json";
import { formatBillions, formatAsOf } from "@/components/home/copy";
import { POLYMARKET_REFERRAL_CODE } from "@/data/polymarket-data";

export const metadata: Metadata = {
  title: "Will OpenAI IPO by the end of 2026?",
  description:
    "Prediction markets price a 4.3% probability that OpenAI completes an IPO before 2027, with the company restructuring into a public benefit corporation.",
  openGraph: {
    title: "Will OpenAI IPO by the end of 2026?",
    description:
      "Prediction markets price a 4.3% probability that OpenAI completes an IPO before 2027, with the company restructuring into a public benefit corporation.",
    url: "/will-openai-ipo",
    type: "article",
    images: ["/opengraph-image.png"],
  },
  alternates: {
    canonical: "/will-openai-ipo",
  },
};

interface TrajectoryPointLite {
  date?: string;
}

export default function WillOpenAiIpoPage() {
  const history = (Array.isArray(trajectoryHistory) ? trajectoryHistory : []) as TrajectoryPointLite[];
  const latestPoint = history[history.length - 1];
  const asOf = latestPoint?.date ? formatAsOf(latestPoint.date) : "21 Oct 2026";

  const openAiCompany = COMPANIES.find((c) => c.name === "OpenAI");
  const valuationDisplay = openAiCompany ? `$${(openAiCompany.valuationUsd / 1e12).toFixed(1)}T` : "$1.2T";
  const revenueDisplay = openAiCompany?.runRateRevenueUsd
    ? `$${(openAiCompany.runRateRevenueUsd / 1e9).toFixed(1)}B`
    : "$50.0B";
  const psMultipleDisplay = openAiCompany?.psMultiple ? `${openAiCompany.psMultiple.toFixed(1)}×` : "24.0×";

  const openAiDeals = getCompanyDeals("OpenAI");
  const totalVolumeDisplay = openAiCompany ? formatBillions(openAiCompany.totalVolumeUsd) : "$305.9B";

  const polymarketContracts = [
    {
      question: "Will OpenAI complete an IPO by December 31, 2026?",
      probabilityPct: 4.3,
      volumeDisplay: "$1.1M",
      url: `https://polymarket.com/event/openai-ipo-by?r=${POLYMARKET_REFERRAL_CODE}`,
    },
    {
      question: "Will OpenAI IPO with a market cap of $1T+ before 2027?",
      probabilityPct: 2.4,
      volumeDisplay: "$317k",
      url: `https://polymarket.com/event/openai-1t-ipo-before-2027?r=${POLYMARKET_REFERRAL_CODE}`,
    },
    {
      question: "Will OpenAI officially announce achieved AGI before 2027?",
      probabilityPct: 8.5,
      volumeDisplay: "$325k",
      url: `https://polymarket.com/event/openai-announces-it-has-achieved-agi-before-2027?r=${POLYMARKET_REFERRAL_CODE}`,
    },
  ];

  // SVG bar chart data
  const barChartData = [
    { label: "IPO by Dec 31, 2026", prob: 4.3, volume: "$1.1M", color: "var(--c-accent)" },
    { label: "$1T+ IPO Market Cap", prob: 2.4, volume: "$317k", color: "var(--c-cat-steel)" },
    { label: "Announce AGI by 2027", prob: 8.5, volume: "$325k", color: "var(--c-cat-navy)" },
  ];

  const svgWidth = 600;
  const rowHeight = 36;
  const svgHeight = barChartData.length * rowHeight + 20;
  const maxProb = 12.0;

  return (
    <AnswerPageLayout
      question="Will OpenAI IPO by the end of 2026?"
      categoryLabel="Frontier Labs"
      asOf={asOf}
      answerLead="Prediction markets price only a 4.3% probability that OpenAI completes an initial public offering (IPO) before December 31, 2026, with traders pricing a 2.4% chance of a $1 trillion-plus public debut."
      answerContext={`While OpenAI has begun restructuring from a non-profit foundation into a Delaware for-profit public benefit corporation and is negotiating secondary rounds at a ${valuationDisplay} private mark, the company has not filed a public S-1 registration statement with the SEC, making an exit before late 2027 procedurally improbable.`}
      polymarketContracts={polymarketContracts}
      notThisItems={[
        "It is not a guarantee that OpenAI will never list publicly; it measures the market probability that an IPO completes and trades on an exchange before December 31, 2026.",
        "It is not financial or investment advice to buy or sell private pre-IPO shares, tech equities, or prediction contracts.",
        "Polymarket contract odds reflect crowd liquidity and real-money bets, not an official corporate statement or regulatory schedule from OpenAI.",
      ]}
    >
      {/* ── Key Metrics Summary Tiles ───────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="card p-4 space-y-1">
          <span className="label">Polymarket Odds</span>
          <p className="num text-2xl font-bold text-accent-strong dark:text-accent-ink">4.3%</p>
          <span className="text-[13px] text-ink-subtle">IPO by Dec 2026</span>
        </div>
        <div className="card p-4 space-y-1">
          <span className="label">Benchmark Valuation</span>
          <p className="num text-2xl font-bold text-ink">{valuationDisplay}</p>
          <span className="text-[13px] text-ink-subtle">Talks at &gt;$1.2T</span>
        </div>
        <div className="card p-4 space-y-1">
          <span className="label">Run-Rate Revenue</span>
          <p className="num text-2xl font-bold text-ink">{revenueDisplay}</p>
          <span className="text-[13px] text-ink-subtle">{psMultipleDisplay} revenue multiple</span>
        </div>
        <div className="card p-4 space-y-1">
          <span className="label">Disclosed Commitments</span>
          <p className="num text-2xl font-bold text-ink">{totalVolumeDisplay}</p>
          <span className="text-[13px] text-ink-subtle">{openAiDeals.length} ledger transactions</span>
        </div>
      </div>

      {/* ── Section 1: Market Odds Comparison Chart ─────────────────────────── */}
      <section aria-labelledby="polymarket-odds-heading" className="card p-5 space-y-4 shadow-card">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-rule pb-3">
          <div>
            <h2 id="polymarket-odds-heading" className="text-lg font-bold tracking-tight text-ink">
              What Money Is Betting: OpenAI Timelines
            </h2>
            <p className="mt-0.5 text-[14px] text-ink-muted">
              Live odds on Polymarket across 2026 IPO, $1T market cap, and AGI milestones.
            </p>
          </div>
          <Link
            href="/companies/openai"
            className="inline-flex min-h-[44px] items-center gap-1 text-[13px] font-medium text-ink underline decoration-rule underline-offset-4 hover:decoration-ink"
          >
            OpenAI company dossier
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </div>

        {/* SVG Horizontal Bar Chart */}
        <div
          role="img"
          aria-labelledby="chart-title"
          aria-describedby="chart-desc"
          className="overflow-x-auto"
        >
          <p id="chart-title" className="sr-only">
            OpenAI Polymarket milestone probabilities
          </p>
          <p id="chart-desc" className="sr-only">
            Chart showing 4.3% probability for 2026 IPO, 2.4% for $1T market cap, and 8.5% for AGI before 2027.
          </p>

          <svg
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            className="w-full h-auto select-none"
            aria-hidden="true"
          >
            {barChartData.map((d, i) => {
              const y = i * rowHeight + 10;
              const barWidth = Math.max(4, (d.prob / maxProb) * 260);

              return (
                <g key={d.label}>
                  <text
                    x={180}
                    y={y + 16}
                    textAnchor="end"
                    className="text-[13px] font-semibold fill-ink"
                  >
                    {d.label}
                  </text>
                  <rect
                    x={190}
                    y={y + 4}
                    width={260}
                    height={18}
                    rx={3}
                    className="fill-surface-3"
                  />
                  <rect
                    x={190}
                    y={y + 4}
                    width={barWidth}
                    height={18}
                    rx={3}
                    fill={d.color}
                  />
                  <text
                    x={465}
                    y={y + 16}
                    textAnchor="start"
                    className="num font-mono text-[13px] font-bold fill-ink"
                  >
                    {d.prob.toFixed(1)}%{" "}
                    <tspan className="text-[12px] font-normal fill-ink-faint">
                      ({d.volume} volume)
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
            <caption>OpenAI milestone prediction contract prices</caption>
            <thead>
              <tr>
                <th scope="col">Milestone Contract</th>
                <th scope="col">Probability</th>
                <th scope="col">Volume Traded</th>
              </tr>
            </thead>
            <tbody>
              {barChartData.map((d) => (
                <tr key={d.label}>
                  <th scope="row">{d.label}</th>
                  <td>{d.prob.toFixed(1)}%</td>
                  <td>{d.volume}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── Section 2: Valuation and Revenue Trajectory Table ─────────────────── */}
      <section aria-labelledby="valuation-history-heading" className="card p-5 space-y-4 shadow-card">
        <div className="border-b border-rule pb-3">
          <h2 id="valuation-history-heading" className="text-lg font-bold tracking-tight text-ink">
            Valuation Multiple Trajectory: 2023 to 2026
          </h2>
          <p className="mt-0.5 text-[14px] text-ink-muted">
            Tracked valuation marks versus annualized revenue run-rates from filed deals.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-[14px]">
            <caption className="sr-only">
              Historical valuations, revenue run-rates, and price-to-sales multiples for OpenAI
            </caption>
            <thead>
              <tr className="border-b border-rule text-ink-subtle">
                <th scope="col" className="py-2.5 pr-4 font-semibold">Round / Horizon</th>
                <th scope="col" className="py-2.5 pr-4 font-semibold">Post-Money Valuation</th>
                <th scope="col" className="py-2.5 pr-4 font-semibold">Reported ARR</th>
                <th scope="col" className="py-2.5 pr-4 font-semibold text-right">P/S Multiple</th>
                <th scope="col" className="py-2.5 font-semibold text-right">Primary Backers</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rule font-tabular">
              <tr className="hover:bg-surface-2 transition-colors">
                <th scope="row" className="py-3 pr-4 font-medium text-ink">Early 2023 (Tender)</th>
                <td className="py-3 pr-4 num text-ink-muted">$29.0B</td>
                <td className="py-3 pr-4 num text-ink-muted">~$1.0B</td>
                <td className="py-3 pr-4 num text-right font-mono font-bold text-ink">29.0×</td>
                <td className="py-3 text-right text-[13px] text-ink-muted">Microsoft ($10B)</td>
              </tr>
              <tr className="hover:bg-surface-2 transition-colors">
                <th scope="row" className="py-3 pr-4 font-medium text-ink">Early 2024 (Secondary)</th>
                <td className="py-3 pr-4 num text-ink-muted">$86.0B</td>
                <td className="py-3 pr-4 num text-ink-muted">~$3.7B</td>
                <td className="py-3 pr-4 num text-right font-mono font-bold text-ink">23.2×</td>
                <td className="py-3 text-right text-[13px] text-ink-muted">Thrive Capital</td>
              </tr>
              <tr className="hover:bg-surface-2 transition-colors">
                <th scope="row" className="py-3 pr-4 font-medium text-ink">Late 2024 (Strategic)</th>
                <td className="py-3 pr-4 num text-ink-muted">$157.0B</td>
                <td className="py-3 pr-4 num text-ink-muted">~$11.6B</td>
                <td className="py-3 pr-4 num text-right font-mono font-bold text-ink">13.5×</td>
                <td className="py-3 text-right text-[13px] text-ink-muted">Khosla, MGX, NVIDIA</td>
              </tr>
              <tr className="hover:bg-surface-2 transition-colors">
                <th scope="row" className="py-3 pr-4 font-medium text-ink">March 2026 (Series G)</th>
                <td className="py-3 pr-4 num text-ink-muted">$852.0B</td>
                <td className="py-3 pr-4 num text-ink-muted">~$25.0B</td>
                <td className="py-3 pr-4 num text-right font-mono font-bold text-ink">34.1×</td>
                <td className="py-3 text-right text-[13px] text-ink-muted">SoftBank, Sovereign Tranches</td>
              </tr>
              <tr className="hover:bg-surface-2 transition-colors bg-surface-2">
                <th scope="row" className="py-3 pr-4 font-bold text-ink">Current Benchmark Talks</th>
                <td className="py-3 pr-4 num font-bold text-accent-strong dark:text-accent-ink">{valuationDisplay}</td>
                <td className="py-3 pr-4 num font-bold text-ink">{revenueDisplay}</td>
                <td className="py-3 pr-4 num text-right font-mono font-bold text-accent-strong dark:text-accent-ink">{psMultipleDisplay}</td>
                <td className="py-3 text-right text-[13px] font-medium text-ink">Pre-IPO syndicate</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* ── Section 3: The S-1 Regulatory Checklist ─────────────────────────── */}
      <section aria-labelledby="checklist-heading" className="card p-5 space-y-4 shadow-card">
        <div className="border-b border-rule pb-3">
          <h2 id="checklist-heading" className="text-lg font-bold tracking-tight text-ink">
            The IPO Process: What Must Happen Before Listing
          </h2>
          <p className="mt-0.5 text-[14px] text-ink-muted">
            The mandatory procedural milestones required by the SEC before public shares can trade.
          </p>
        </div>

        <div className="space-y-3">
          <div className="panel p-3.5 flex items-start gap-3">
            <Clock className="h-5 w-5 text-caution-500 shrink-0 mt-0.5" aria-hidden="true" />
            <div className="space-y-0.5 text-[14px]">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-ink">1. Restructuring into Delaware For-Profit PBC</span>
                <span className="chip chip-caution text-[13px]">In Progress</span>
              </div>
              <p className="text-ink-muted leading-relaxed">
                OpenAI must convert from its non-profit board control into a standard for-profit public benefit corporation to issue common equity shares to public market investors.
              </p>
            </div>
          </div>

          <div className="panel p-3.5 flex items-start gap-3">
            <Clock className="h-5 w-5 text-caution-500 shrink-0 mt-0.5" aria-hidden="true" />
            <div className="space-y-0.5 text-[14px]">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-ink">2. Three-Year PCAOB Financial Audit</span>
                <span className="chip chip-caution text-[13px]">In Progress</span>
              </div>
              <p className="text-ink-muted leading-relaxed">
                Auditors must verify and standardize multi-year cloud computing purchase commitments ($250B with Azure, $300B with Stargate) under GAAP revenue recognition rules.
              </p>
            </div>
          </div>

          <div className="panel p-3.5 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-ink-muted shrink-0 mt-0.5" aria-hidden="true" />
            <div className="space-y-0.5 text-[14px]">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-ink">3. Confidential Draft Registration (Form S-1)</span>
                <span className="chip chip-steel text-[13px]">Not Yet Filed</span>
              </div>
              <p className="text-ink-muted leading-relaxed">
                Under the JOBS Act, companies submit draft registration statements confidentially to the SEC. Review and comment cycles typically require 4 to 9 months before public filing.
              </p>
            </div>
          </div>

          <div className="panel p-3.5 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-ink-muted shrink-0 mt-0.5" aria-hidden="true" />
            <div className="space-y-0.5 text-[14px]">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-ink">4. Public S-1, 30-Day Quiet Period &amp; Roadshow</span>
                <span className="chip chip-steel text-[13px]">Pending</span>
              </div>
              <p className="text-ink-muted leading-relaxed">
                Following SEC sign-off, the prospectus becomes public, starting executive institutional investor roadshows before price discovery and initial Nasdaq/NYSE listing.
              </p>
            </div>
          </div>
        </div>
      </section>
    </AnswerPageLayout>
  );
}
