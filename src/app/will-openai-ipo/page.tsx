import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Clock, AlertCircle } from "lucide-react";
import { AnswerPageLayout } from "@/components/answer-pages/AnswerPageLayout";
import { COMPANIES } from "@/app/companies/_components/companyData";
import {
  OPENAI_NAMED_DEALS,
  OPENAI_NAMED_TOTAL_USD,
  ledgerAmount,
  liveContracts,
  oneInN,
  resolveContracts,
} from "@/components/answer-pages/answerData";
import trajectoryHistory from "@/data/trajectory-history.json";
import { formatBillions, formatTrillions, formatAsOf } from "@/components/home/copy";
import { DEFAULT_MODEL_INPUTS } from "@/lib/model/engine";

/** The odds in the metadata are the live contract prices. */
export function generateMetadata(): Metadata {
  const ipo2026 = liveContracts(["will-openai-ipo-by-december-31-2026"])[0];
  const description = `Prediction markets price a ${
    ipo2026?.probabilityPct.toFixed(1) ?? "0.0"
  }% probability that OpenAI completes an IPO before 2027, with the company restructuring into a public benefit corporation.`;

  return {
    title: "Will OpenAI IPO by the end of 2026?",
    description,
    openGraph: {
      title: "Will OpenAI IPO by the end of 2026?",
      description,
      url: "/will-openai-ipo",
      type: "article",
      images: ["/opengraph-image.png"],
    },
    alternates: {
      canonical: "/will-openai-ipo",
    },
  };
}

interface TrajectoryPointLite {
  date?: string;
}

export default function WillOpenAiIpoPage() {
  const history = (Array.isArray(trajectoryHistory) ? trajectoryHistory : []) as TrajectoryPointLite[];
  const latestPoint = history[history.length - 1];
  const asOf = latestPoint?.date ? formatAsOf(latestPoint.date) : "21 Oct 2026";

  const openAiCompany = COMPANIES.find((c) => c.name === "OpenAI");
  const valuationDisplay = openAiCompany ? formatTrillions(openAiCompany.valuationUsd) : "—";
  const revenueDisplay = openAiCompany?.runRateRevenueUsd
    ? formatBillions(openAiCompany.runRateRevenueUsd)
    : "—";
  const psMultipleDisplay = openAiCompany?.psMultiple
    ? `${openAiCompany.psMultiple.toFixed(1)}×`
    : "—";

  const totalVolumeDisplay = formatBillions(OPENAI_NAMED_TOTAL_USD);

  // ── The live contract book, priced today ────────────────────────────────
  const ipo2026 = liveContracts(["will-openai-ipo-by-december-31-2026"])[0];
  const ipoMar2027 = liveContracts(["will-openai-ipo-by-march-31-2027"])[0];
  const ipoJun2027 = liveContracts(["will-openai-ipo-by-june-30-2027"])[0];
  const trillionIpo = resolveContracts(["poly-openai-trillion-ipo"])[0];
  const agiContract = resolveContracts(["poly-openai-agi-2026"])[0];

  const ipoPct = ipo2026?.probabilityPct ?? 0;

  const polymarketContracts = [
    ipo2026,
    ipoMar2027,
    ipoJun2027,
    trillionIpo,
    agiContract,
  ].filter((c): c is NonNullable<typeof c> => !!c);

  // ── The chart rows ──────────────────────────────────────────────────────
  const chartRows = [
    { label: "IPO by Dec 31, 2026", contract: ipo2026 },
    { label: "IPO by Mar 31, 2027", contract: ipoMar2027 },
    { label: "IPO by Jun 30, 2027", contract: ipoJun2027 },
    { label: "$1T+ IPO cap", contract: trillionIpo },
    { label: "AGI announced", contract: agiContract },
  ].filter((row): row is { label: string; contract: NonNullable<typeof row.contract> } =>
    !!row.contract,
  );

  const maxProb = Math.max(
    ...chartRows.map((r) => r.contract.probabilityPct),
    1,
  );

  // ── The peer table: what investors pay for AI revenue today ─────────────
  const labRows = (DEFAULT_MODEL_INPUTS.valuations ?? [])
    .filter((v) => (v.runRateRevenueUsd ?? 0) > 0)
    .map((v) => ({
      company: v.company,
      valuation: v.valuationUsd,
      revenue: v.runRateRevenueUsd as number,
      ps: v.valuationUsd / (v.runRateRevenueUsd as number),
    }))
    .sort((a, b) => b.ps - a.ps);

  const psValues = labRows.map((r) => r.ps).sort((a, b) => a - b);
  const medianPs =
    psValues.length % 2 === 0
      ? (psValues[psValues.length / 2 - 1] + psValues[psValues.length / 2]) / 2
      : psValues[Math.floor(psValues.length / 2)];

  // ── The compute commitments behind the company ──────────────────────────
  const azureUsd = ledgerAmount("deal-039");
  const stargateUsd = ledgerAmount("deal-059");

  const svgWidth = 600;
  const rowHeight = 36;
  const svgHeight = chartRows.length * rowHeight + 20;

  return (
    <AnswerPageLayout
      question="Will OpenAI IPO by the end of 2026?"
      categoryLabel="Frontier Labs"
      asOf={asOf}
      answerLead={`Prediction markets price a ${ipoPct.toFixed(1)}% chance — ${oneInN(
        ipoPct,
      )} — that OpenAI completes an IPO (selling company shares to the public on a stock exchange) before December 31, 2026. The same book prices ${(
        ipoJun2027?.probabilityPct ?? 0
      ).toFixed(1)}% by mid-2027, so the market is not saying never — it is saying not this year.`}
      answerContext={`OpenAI has restructured from a non-profit foundation into a Delaware for-profit public benefit corporation (a corporate structure that balances shareholder profits with a formal public mission) and is negotiating secondary rounds at a ${valuationDisplay} private mark, but it has not published an S-1 registration statement (the mandatory SEC disclosure required before listing shares). Until that document is public, an exit before late 2027 is procedurally improbable.`}
      polymarketContracts={polymarketContracts}
      notThisItems={[
        "It is not a guarantee that OpenAI will never list publicly; it measures the market probability that an IPO completes and trades on an exchange before December 31, 2026.",
        "It is not financial or investment advice to buy or sell private pre-IPO shares, tech equities, or prediction contracts.",
        "Polymarket contract odds reflect crowd liquidity and real-money bets, not an official corporate statement or regulatory schedule from OpenAI.",
        "The odds are a price, not a forecast. A thin book can print a number that moves on a few thousand dollars of trading, so read the traded volume next to every price.",
      ]}
    >
      {/* ── Key Metrics Summary Tiles ───────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="card p-4 space-y-1">
          <span className="label">Polymarket Odds</span>
          <p className="num text-2xl font-bold text-accent-strong dark:text-accent-ink">
            {ipoPct.toFixed(1)}%
          </p>
          <span className="text-[13px] text-ink-subtle">IPO by Dec 2026</span>
        </div>
        <div className="card p-4 space-y-1">
          <span className="label">Private Valuation Mark</span>
          <p className="num text-2xl font-bold text-ink">{valuationDisplay}</p>
          <span className="text-[13px] text-ink-subtle">Last reported private mark</span>
        </div>
        <div className="card p-4 space-y-1">
          <span className="label">Run-Rate Revenue</span>
          <p className="num text-2xl font-bold text-ink">{revenueDisplay}</p>
          <span className="text-[13px] text-ink-subtle">
            {psMultipleDisplay} revenue multiple (price per $1 sales)
          </span>
        </div>
        <div className="card p-4 space-y-1">
          <span className="label">Disclosed Commitments</span>
          <p className="num text-2xl font-bold text-ink">{totalVolumeDisplay}</p>
          <span className="text-[13px] text-ink-subtle">
            {OPENAI_NAMED_DEALS.length} ledger transactions
          </span>
        </div>
      </div>

      {/* ── Section 1: Market Odds Comparison Chart ─────────────────────────── */}
      <section aria-labelledby="polymarket-odds-heading" className="card p-5 space-y-4 shadow-card">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-rule pb-3">
          <div>
            <h2 id="polymarket-odds-heading" className="text-lg font-bold tracking-tight text-ink">
              What money is betting: OpenAI timelines
            </h2>
            <p className="mt-0.5 text-[14px] text-ink-muted">
              Live odds on Polymarket across the 2026 IPO, the 2027 IPO window, a $1 trillion market
              cap, and AGI.
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
            Chart showing {chartRows
              .map((r) => `${r.label} at ${r.contract.probabilityPct.toFixed(1)}%`)
              .join(", ")}.
          </p>

          <svg
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            className="w-full h-auto select-none min-w-[560px]"
            aria-hidden="true"
          >
            {chartRows.map((d, i) => {
              const y = i * rowHeight + 10;
              const barWidth = Math.max(4, (d.contract.probabilityPct / maxProb) * 260);

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
                    fill={i === 0 ? "var(--c-accent)" : "var(--c-cat-steel)"}
                  />
                  <text
                    x={465}
                    y={y + 16}
                    textAnchor="start"
                    className="num font-mono text-[13px] font-bold fill-ink"
                  >
                    {d.contract.probabilityPct.toFixed(1)}%{" "}
                    <tspan className="text-[13px] font-normal fill-ink-faint">
                      ({d.contract.volumeDisplay} traded)
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
              {chartRows.map((d) => (
                <tr key={d.label}>
                  <th scope="row">{d.label}</th>
                  <td>{d.contract.probabilityPct.toFixed(1)}%</td>
                  <td>{d.contract.volumeDisplay}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-[13px] leading-relaxed text-ink-faint">
          The price is what the crowd is paying for YES. It is not a forecast, and it moves with
          every trade.
        </p>
      </section>

      {/* ── Section 2: What the market pays for AI revenue ──────────────────── */}
      <section aria-labelledby="valuation-history-heading" className="card p-5 space-y-4 shadow-card">
        <div className="border-b border-rule pb-3">
          <h2 id="valuation-history-heading" className="text-lg font-bold tracking-tight text-ink">
            What investors pay for AI revenue today
          </h2>
          <p className="mt-0.5 text-[14px] text-ink-muted">
            Private marks against annualised revenue for every lab with a disclosed run-rate. The
            ratio is a price-to-sales multiple: what you pay for a dollar of yearly revenue.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-[14px]">
            <caption className="sr-only">
              Valuation, annualised revenue, and price-to-sales multiples for the tracked AI labs
            </caption>
            <thead>
              <tr className="border-b border-rule text-ink-subtle">
                <th scope="col" className="py-2.5 pr-4 font-semibold">Lab</th>
                <th scope="col" className="py-2.5 pr-4 font-semibold text-right">Private Mark</th>
                <th scope="col" className="py-2.5 pr-4 font-semibold text-right">
                  Annualised Revenue
                </th>
                <th scope="col" className="py-2.5 font-semibold text-right">Price per $1 of sales</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rule font-tabular">
              {labRows.map((row) => {
                const isOpenAi = row.company === "OpenAI";
                return (
                  <tr
                    key={row.company}
                    className={`hover:bg-surface-2 transition-colors ${isOpenAi ? "bg-surface-2" : ""}`}
                  >
                    <th
                      scope="row"
                      className={`py-3 pr-4 font-medium ${isOpenAi ? "font-bold text-ink" : "text-ink"}`}
                    >
                      {row.company}
                    </th>
                    <td
                      className={`py-3 pr-4 num text-right ${
                        isOpenAi ? "font-bold text-accent-strong dark:text-accent-ink" : "text-ink-muted"
                      }`}
                    >
                      {formatTrillions(row.valuation)}
                    </td>
                    <td className="py-3 pr-4 num text-right text-ink-muted">
                      {formatBillions(row.revenue)}
                    </td>
                    <td
                      className={`py-3 num text-right font-mono font-bold ${
                        isOpenAi ? "text-accent-strong dark:text-accent-ink" : "text-ink"
                      }`}
                    >
                      {row.ps.toFixed(1)}×
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="text-[14px] leading-relaxed text-ink-muted">
          The median lab in this set is valued at {medianPs.toFixed(1)} cents for every dollar of
          yearly revenue. OpenAI is at {psMultipleDisplay}, which is why a public listing is a
          question about whether that multiple survives contact with public investors.
        </p>
      </section>

      {/* ── Section 3: The S-1 Regulatory Checklist ─────────────────────────── */}
      <section aria-labelledby="checklist-heading" className="card p-5 space-y-4 shadow-card">
        <div className="border-b border-rule pb-3">
          <h2 id="checklist-heading" className="text-lg font-bold tracking-tight text-ink">
            The IPO process: what must happen before listing
          </h2>
          <p className="mt-0.5 text-[14px] text-ink-muted">
            The mandatory procedural milestones required by the SEC before public shares can trade.
          </p>
        </div>

        <div className="space-y-3">
          <div className="panel p-3.5 flex items-start gap-3">
            <Clock className="h-5 w-5 text-caution-500 shrink-0 mt-0.5" aria-hidden="true" />
            <div className="space-y-0.5 text-[14px]">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold text-ink">1. Restructuring into Delaware For-Profit PBC</span>
                <span className="chip chip-caution text-[13px]">In Progress</span>
              </div>
              <p className="text-ink-muted leading-relaxed">
                OpenAI must convert from its non-profit board control into a standard for-profit
                public benefit corporation to issue common equity shares to public market investors.
              </p>
            </div>
          </div>

          <div className="panel p-3.5 flex items-start gap-3">
            <Clock className="h-5 w-5 text-caution-500 shrink-0 mt-0.5" aria-hidden="true" />
            <div className="space-y-0.5 text-[14px]">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold text-ink">2. Three-Year PCAOB Financial Audit</span>
                <span className="chip chip-caution text-[13px]">In Progress</span>
              </div>
              <p className="text-ink-muted leading-relaxed">
                Independent auditors (overseen by the PCAOB, the US audit watchdog for listed
                companies) must verify and standardise multi-year cloud computing purchase
                commitments ({formatBillions(azureUsd)} with Azure, {formatBillions(stargateUsd)} with
                Stargate) under GAAP — the standard US accounting rules.
              </p>
            </div>
          </div>

          <div className="panel p-3.5 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-ink-muted shrink-0 mt-0.5" aria-hidden="true" />
            <div className="space-y-0.5 text-[14px]">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold text-ink">
                  3. Confidential Draft Registration (Form S-1)
                </span>
                <span className="chip chip-steel text-[13px]">Not Published</span>
              </div>
              <p className="text-ink-muted leading-relaxed">
                Under the JOBS Act (a 2012 US law), companies can submit draft registration statements
                confidentially to the SEC before publishing them. Review and comment cycles typically
                require 4 to 9 months before public filing.
              </p>
            </div>
          </div>

          <div className="panel p-3.5 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-ink-muted shrink-0 mt-0.5" aria-hidden="true" />
            <div className="space-y-0.5 text-[14px]">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold text-ink">
                  4. Public S-1, 30-Day Quiet Period &amp; Roadshow
                </span>
                <span className="chip chip-steel text-[13px]">Pending</span>
              </div>
              <p className="text-ink-muted leading-relaxed">
                Following SEC sign-off, the prospectus becomes public, starting executive institutional
                investor roadshows before price discovery and initial Nasdaq/NYSE listing.
              </p>
            </div>
          </div>
        </div>

        <div className="border-t border-rule pt-3 space-y-1.5">
          <p className="label">What would change the answer</p>
          <ul className="space-y-1.5 text-[14px] leading-relaxed text-ink-muted">
            <li>
              A published S-1. The moment the registration statement becomes public, the company has
              committed to a share count and a price range, and the odds reprice.
            </li>
            <li>
              A signed primary round above the last closed mark of the private market. That sets the
              opening valuation the exchange would be asked to underwrite.
            </li>
            <li>
              The for-profit public benefit corporation restructuring completing, which is the legal
              precondition for issuing shares at all.
            </li>
          </ul>
        </div>
      </section>
    </AnswerPageLayout>
  );
}
