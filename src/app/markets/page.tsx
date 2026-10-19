import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Info } from "lucide-react";
import { AdSlot } from "@/components/AdSlot";
import { LiveStockMonitor } from "@/components/LiveStockMonitor";
import { PolymarketCharts } from "@/components/PolymarketCharts";
import liveStocks from "@/data/live-stocks.json";

/**
 * /markets — quotes, rates and credit.
 *
 * Server component. Every figure quoted in the copy below is read from the same
 * daily feed the board renders, so the sentences and the board can never
 * disagree.
 */

const feed = liveStocks as unknown as {
  timestamp?: string;
  stocks?: { ticker: string }[];
  macro?: { symbol: string; valueDisplay: string; changeDisplay: string }[];
};

const stockCount = feed.stocks?.length ?? 0;
const macroRows = feed.macro ?? [];

function macroValue(symbol: string, fallback: string): string {
  const row = macroRows.find((m) => m.symbol === symbol);
  return row ? row.valueDisplay : fallback;
}

function macroChange(symbol: string, fallback: string): string {
  const row = macroRows.find((m) => m.symbol === symbol);
  return row ? row.changeDisplay : fallback;
}

const us10y = macroValue("US10Y", "the 10-year Treasury yield");
const hyOas = macroValue("HY-OAS", "the high-yield spread");
const aiDebt = macroValue("AI-DEBT", "annual AI debt issuance");

export const metadata: Metadata = {
  title: "AI markets — listed quotes, Treasury yields and credit spreads",
  description: `Daily quotes for ${stockCount} listed AI companies, plus Treasury yields, high-yield spreads and the AI debt pace that set the cost of building.`,
  openGraph: {
    title: "AI markets — listed quotes, Treasury yields and credit spreads",
    description:
      "Daily market board: AI equities, Treasury yields, high-yield spreads and the AI debt issuance pace.",
    url: "/markets",
    type: "website",
    // 2026-10-19: an explicit openGraph block suppresses the file-convention
    // image cascade (root opengraph-image.png stops merging), so the card must
    // be named here.
    images: ["/opengraph-image.png"],
  },
  alternates: {
    canonical: "/markets",
  },
};

const TERMS: { term: string; plain: string }[] = [
  {
    term: "24h change",
    plain: "How far the last price sits from the previous close. A direction, not a forecast.",
  },
  {
    term: "From high",
    plain: "Drawdown: the fall from the stock's own 52-week high. It says nothing about whether the price is fair.",
  },
  {
    term: "Market cap",
    plain: "Share price multiplied by every share outstanding — what the market values the whole company at.",
  },
  {
    term: "Treasury yield",
    plain: "What the government pays to borrow for ten years. It is the floor every risky investment has to beat.",
  },
  {
    term: "High-yield spread",
    plain: "The extra interest lenders demand over Treasuries to lend to risky borrowers. A wider spread means lenders expect more losses.",
  },
  {
    term: "AI debt issuance",
    plain: "Bonds, convertible notes and private credit lines raised for AI infrastructure over the past year, annualised.",
  },
];

export default function MarketsPage() {
  return (
    <div className="section-sm">
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
          <span className="label">Markets</span>
          <span className="pill">{stockCount} listed names</span>
          <span className="pill">{macroRows.length} rate and credit series</span>
        </div>

        <h1 className="max-w-reading text-3xl font-bold tracking-tight text-ink sm:text-4xl">
          What the AI build-out costs today
        </h1>

        <p className="prose prose-lead max-w-reading">
          {stockCount} listed AI companies with their last close, plus the macro numbers that decide
          what a borrowed dollar costs: the {us10y} Treasury yield, a {hyOas} high-yield spread, and{" "}
          {aiDebt} of annual AI debt issuance.
        </p>

        <div className="flex flex-wrap items-center gap-2">
          <Link href="/ledger?filter=debt" className="btn btn-primary min-h-11">
            See the debt facilities
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
          <Link href="/companies" className="btn min-h-11">
            Company profiles
          </Link>
          <Link href="/dotcom-vs-ai" className="btn min-h-11">
            Compare with 2000
          </Link>
        </div>

        <AdSlot placementId="markets-top" className="mt-1" />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="min-w-0 space-y-6">
          <LiveStockMonitor />

          <AdSlot placementId="markets-infeed" />

          <section aria-label="Prediction market odds" className="min-w-0">
            <h2 className="text-[15px] font-bold tracking-tight text-ink">
              What the crowd is betting on
            </h2>
            <p className="prose prose-p max-w-reading text-[15px]">
              Prediction markets trade the same question our model answers: odds are the price of a
              contract, so they are a live opinion, not a fact.
            </p>
            <div className="mt-3">
              <PolymarketCharts />
            </div>
          </section>
        </div>

        {/* Sidebar: ad slot + glossary, no filler */}
        <aside className="min-w-0 space-y-5">
          <AdSlot placementId="markets-sidebar-mpu" className="xl:sticky xl:top-24" />

          <div className="card shadow-card">
            <h2 className="text-[14px] font-bold tracking-tight text-ink">
              What these numbers mean
            </h2>
            <dl className="mt-3 space-y-2.5">
              {TERMS.map((term) => (
                <div key={term.term}>
                  <dt className="text-[14px] font-semibold text-ink">{term.term}</dt>
                  <dd className="mt-0.5 text-[14px] leading-relaxed text-ink-muted">{term.plain}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="notice">
            <p className="notice-title">Reading the credit side</p>
            <p className="mt-1.5 text-[14px] leading-relaxed">
              Equity prices move first and loudest, but lenders reprice quietly. When the{" "}
              {hyOas} high-yield spread widens, borrowers are being asked for more interest on the
              same debt — the pressure shows up in interest expense long before it shows up in a
              share price.
            </p>
          </div>
        </aside>
      </div>

      {/* Where to go next */}
      <section className="mt-10 grid grid-cols-1 gap-3 sm:grid-cols-3" aria-label="Next steps">
        <Link
          href="/dotcom-vs-ai"
          className="card card-flush card-lift flex flex-col gap-1 p-4 shadow-card transition-shadow duration-200 hover:shadow-raised"
        >
          <span className="label">Context</span>
          <span className="text-[15px] font-semibold text-ink">The last build-out, side by side</span>
          <span className="mt-1 text-[14px] text-ink-subtle">
            What the 2000 infrastructure build looked like against this one, on the same measures.
          </span>
          <span className="mt-2 flex items-center gap-1 text-[14px] font-medium text-ink">
            Open the comparison
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </span>
        </Link>

        <Link
          href="/ledger?filter=debt"
          className="card card-flush card-lift flex flex-col gap-1 p-4 shadow-card transition-shadow duration-200 hover:shadow-raised"
        >
          <span className="label">Behind the quotes</span>
          <span className="text-[15px] font-semibold text-ink">Every debt facility we sourced</span>
          <span className="mt-1 text-[14px] text-ink-subtle">
            The loans, bonds and convertible notes behind these balance sheets.
          </span>
          <span className="mt-2 flex items-center gap-1 text-[14px] font-medium text-ink">
            Filter the ledger
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </span>
        </Link>

        <Link
          href="/methodology"
          className="card card-flush card-lift flex flex-col gap-1 p-4 shadow-card transition-shadow duration-200 hover:shadow-raised"
        >
          <span className="label">Method</span>
          <span className="text-[15px] font-semibold text-ink">How these inputs feed the model</span>
          <span className="mt-1 text-[14px] text-ink-subtle">
            Which series moves the probability, and by how much.
          </span>
          <span className="mt-2 flex items-center gap-1 text-[14px] font-medium text-ink">
            Read the method
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </span>
        </Link>
      </section>

      <AdSlot placementId="markets-bottom" className="mt-10" />

      <p className="mt-8 flex items-start gap-2 text-[14px] text-ink-subtle">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        <span>
          Quotes come from a daily market feed and are delayed; the last high-yield spread moved{" "}
          <span className="num">{macroChange("HY-OAS", "n/a")}</span>, the 10-year Treasury moved{" "}
          <span className="num">{macroChange("US10Y", "n/a")}</span> on the same snapshot. Nothing on
          this page is investment advice.
        </span>
      </p>
    </div>
  );
}