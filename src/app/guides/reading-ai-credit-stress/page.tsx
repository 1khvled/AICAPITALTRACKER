import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import {
  evaluateBubbleModel,
  DEFAULT_MODEL_INPUTS,
  HISTORICAL_BACKTESTS,
} from "@/lib/model/engine";
import { MODEL_FACTORS } from "@/lib/model/factors";
import { MARKET_IMPLIED_12M_BAND, crowdDivergencePoints } from "@/lib/model/documentFormulas";
import { deals, formatTotal } from "@/app/ledger/_components/ledgerData";
import { getGuide, nextGuide } from "@/lib/guides";
import {
  GuideHeader,
  GuideSection,
  GuideFooter,
  GuideDisclosure,
  NotThisPanel,
} from "../_components/GuideChrome";
import liveInputs from "@/data/live-inputs.json";
import liveStocks from "@/data/live-stocks.json";
import latestModel from "@/data/latest-model.json";

/**
 * Guide 02 — reading AI credit stress.
 *
 * Server component. The three series, the baselines and the model's own
 * readings are pulled from the live input set, the daily market board and the
 * engine at build time. Nothing is typed in.
 */

const guide = getGuide("reading-ai-credit-stress")!;
const next = nextGuide(guide.slug);

const model = evaluateBubbleModel(DEFAULT_MODEL_INPUTS);

// ── The credit series ────────────────────────────────────────────────────────
const cds = DEFAULT_MODEL_INPUTS.cds;
const macro = DEFAULT_MODEL_INPUTS.macro;

const cdsCurrentBps = cds?.currentBps ?? 0;
const cdsBaselineBps = cds?.baselineBps ?? 0;
const cdsPriorBps = cds?.priorBps ?? 0;
const cdsRatio = cdsBaselineBps > 0 ? cdsCurrentBps / cdsBaselineBps : 0;
const cdsExcessBps = cdsCurrentBps - cdsBaselineBps;
const cdsMomentumBps = cdsCurrentBps - cdsPriorBps;

const hySpreadBps = macro?.highYieldSpreadBps ?? 0;
const us10yPct = macro?.us10yYieldPct ?? 0;
const us10yBaselinePct = macro?.us10yBaselinePct ?? 0;
const us10yGapBps = Math.round((us10yPct - us10yBaselinePct) * 100);
const realYield10yPct = macro?.realYield10y ?? 0;
const cpiPct = macro?.cpiInflationYoY ?? 0;
const fedFundsPct = macro?.fedFundsRatePct ?? 0;

// The published formulas, rendered from the factor definitions.
const creditFactor = MODEL_FACTORS.find((f) => f.id === "cds_stress");
const macroFactor = MODEL_FACTORS.find((f) => f.id === "macro_rates");
const creditContribution = model.contributions.find((c) => c.id === "cds_stress");
const macroContribution = model.contributions.find((c) => c.id === "macro_rates");

// ── The published historical trigger the credit argument rests on ───────────
const gfcRow = HISTORICAL_BACKTESTS.find((b) => b.id === "gfc-lehman-2007");
const gfcCdsTrigger = gfcRow?.primaryMacroTriggers.find((t) =>
  t.toLowerCase().includes("cds"),
);
const dotcomRow = HISTORICAL_BACKTESTS.find((b) => b.id === "dot-com-2000");
const dotcomTriggers = dotcomRow?.primaryMacroTriggers ?? [];
const dotcomCdsTriggerCount = dotcomTriggers.filter((t) =>
  t.toLowerCase().includes("cds"),
).length;

// ── The tracked debt facilities, for the anchor comparison ───────────────────
const debtDeals = deals.filter((d) => d.is_debt);
const sumAmounts = (list: typeof deals) =>
  list.reduce((acc, d) => acc + (d.amount_usd || 0), 0);
const largestDebtDeals = [...debtDeals].sort((a, b) => b.amount_usd - a.amount_usd);
const oracleDebtUsd = sumAmounts(debtDeals.filter((d) => d.title.includes("Oracle")));

// ── The market board ─────────────────────────────────────────────────────────
const feed = liveStocks as unknown as {
  timestamp?: string;
  stocks?: {
    ticker: string;
    name: string;
    priceUsd: number;
    drawdownFromAthPct: number;
    marketCapDisplay: string;
    role: string;
  }[];
  macro?: { symbol: string; name: string; valueDisplay: string; changeDisplay: string }[];
};
const boardRows = feed.macro ?? [];
const board = (symbol: string) => boardRows.find((m) => m.symbol === symbol);
const orcl = feed.stocks?.find((s) => s.ticker === "ORCL");

// ── The prediction market ────────────────────────────────────────────────────
const crowdMarkets = liveInputs.crowd.markets;
const contract2026 = crowdMarkets.find((m) => m.slug.includes("december-31-2026"));
const contract2027 = crowdMarkets.find((m) => m.slug === "ai-bubble-burst-by-june-30-2027");
const crowdVolumeUsd = liveInputs.crowd.volumeUsd;

const divergence = crowdDivergencePoints(model.burstProbability);
const gapVsContract2026 =
  contract2026 !== undefined
    ? Math.round((model.burstProbability - contract2026.yesProbabilityPct) * 10) / 10
    : null;
const gapVsContract2027 =
  contract2027 !== undefined
    ? Math.round((model.burstProbability - contract2027.yesProbabilityPct) * 10) / 10
    : null;

const SNAPSHOT_LABEL =
  new Date(latestModel.timestamp).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }) + " UTC";

export const metadata: Metadata = {
  title: "Reading AI credit stress: Oracle CDS, high-yield OAS and the 10-year",
  description:
    "What Oracle's 5-year CDS, the US high-yield spread and the 10-year Treasury yield each measure, why credit leads equities, and how to read the gap between the model and the prediction market.",
  keywords: [
    "Oracle CDS explained",
    "high yield OAS AI credit stress",
    "10 year Treasury AI bubble",
    "why credit leads equities",
    "AI credit spreads reading guide",
    "prediction market vs model probability",
  ],
  alternates: {
    canonical: "/guides/reading-ai-credit-stress",
  },
  openGraph: {
    title: "Reading AI credit stress: Oracle CDS, high-yield OAS and the 10-year | AI Capital Tracker",
    description:
      "What each credit and rate series measures, why credit leads equities, and how to think about the gap between the model print and the market price.",
    url: "/guides/reading-ai-credit-stress",
    type: "article",
    images: ["/opengraph-image.png"],
  },
};

export default function CreditStressGuidePage() {
  return (
    <div className="section-sm">
      <GuideHeader
        eyebrow="Guide 02 · Credit"
        title={guide.title}
        standfirst={guide.standfirst}
        readTime={guide.readTime}
        meta={[`snapshot ${SNAPSHOT_LABEL}`, `model print ${model.burstProbability.toFixed(1)}%`]}
      />

      <div className="mt-8 space-y-10">
        {/* ── SECTION 01 ─────────────────────────────────────────────────── */}
        <GuideSection
          id="three-series"
          index={1}
          kicker="The series"
          title="Three series, three different jobs"
          lead="A single-issuer default swap, a broad junk-bond spread and the government's own borrowing rate are routinely quoted as if they measured the same thing. They do not."
        >
          <div className="overflow-x-auto rounded-xl border border-rule">
            <table className="w-full text-left text-[14px]">
              <caption className="sr-only">
                The three credit and rate series the model reads: what each prices, its latest
                print, the reference level the model uses and what it does not price.
              </caption>
              <thead className="bg-surface-2 text-ink-subtle">
                <tr>
                  <th scope="col" className="p-3 font-medium">
                    Series
                  </th>
                  <th scope="col" className="p-3 font-medium">
                    What it prices
                  </th>
                  <th scope="col" className="p-3 text-right font-medium">
                    Latest print
                  </th>
                  <th scope="col" className="p-3 font-medium">
                    What it does not price
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-rule">
                <tr className="align-top">
                  <th scope="row" className="p-3 font-semibold text-ink">
                    Oracle 5Y CDS
                    <span className="block text-[14px] font-normal text-ink-subtle">
                      5-year default swap, single issuer
                    </span>
                  </th>
                  <td className="p-3 text-ink-muted">
                    The annual cost of insuring Oracle&apos;s debt against default, and therefore
                    what lenders and insurers think the risk is.
                  </td>
                  <td className="num p-3 text-right font-semibold text-ink">
                    {cdsCurrentBps}bp
                    <span className="block text-[14px] font-normal text-ink-subtle">
                      baseline {cdsBaselineBps}bp
                    </span>
                  </td>
                  <td className="p-3 text-ink-muted">
                    It prices one issuer. It says nothing about the AI capital structure as a
                    whole, and nothing about the firms that never issue bonds.
                  </td>
                </tr>
                <tr className="align-top">
                  <th scope="row" className="p-3 font-semibold text-ink">
                    US high-yield OAS
                    <span className="block text-[14px] font-normal text-ink-subtle">
                      broad junk-bond market
                    </span>
                  </th>
                  <td className="p-3 text-ink-muted">
                    The extra yield lenders demand over Treasuries across the whole US high-yield
                    market, adjusted for embedded options.
                  </td>
                  <td className="num p-3 text-right font-semibold text-ink">
                    {hySpreadBps}bp
                    <span className="block text-[14px] font-normal text-ink-subtle">
                      {board("HY-OAS")?.changeDisplay ?? "—"}
                    </span>
                  </td>
                  <td className="p-3 text-ink-muted">
                    It is a market-wide risk appetite series. It moves for reasons that have
                    nothing to do with AI, and it can stay flat while AI-specific credit is
                    repricing.
                  </td>
                </tr>
                <tr className="align-top">
                  <th scope="row" className="p-3 font-semibold text-ink">
                    US 10-year Treasury
                    <span className="block text-[14px] font-normal text-ink-subtle">
                      discount rate
                    </span>
                  </th>
                  <td className="p-3 text-ink-muted">
                    What the government pays to borrow for ten years. It is the floor every risky
                    investment has to clear, and the discount rate applied to long-dated cash
                    flows.
                  </td>
                  <td className="num p-3 text-right font-semibold text-ink">
                    {us10yPct.toFixed(2)}%
                    <span className="block text-[14px] font-normal text-ink-subtle">
                      real {realYield10yPct.toFixed(2)}% · CPI{" "}
                      {cpiPct.toFixed(2)}%
                    </span>
                  </td>
                  <td className="p-3 text-ink-muted">
                    It prices neither credit nor AI. It is the cost of money for everything, and
                    a rise in it is a discount-rate event before it is a default event.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="max-w-measure space-y-4 text-[15px] leading-relaxed text-ink-muted">
            <p>
              The model reads all three, but it does not average them. Credit stress is the
              largest weighted risk factor at {creditContribution?.weightPct}% of the risk scale;
              the macro factor, which carries the 10-year and the high-yield spread, is worth{" "}
              {macroContribution?.weightPct}%. The distinction matters because the two answer
              different questions. A CDS widening asks &quot;is this borrower in trouble?&quot;. A
              10-year at {us10yPct.toFixed(2)}% asks &quot;what does every future cash flow get
              discounted at?&quot;
            </p>
          </div>
        </GuideSection>

        {/* ── SECTION 02 ─────────────────────────────────────────────────── */}
        <GuideSection
          id="why-credit"
          index={2}
          kicker="The mechanism"
          title="Why the model treats credit as the earlier warning system"
          lead="The bond market reprices a borrower before the equity market does, because bondholders get repaid on a contractual schedule whether or not the story still works."
        >
          <div className="max-w-measure space-y-4 text-[15px] leading-relaxed text-ink-muted">
            <p>
              The site&apos;s second axiom is that credit precedes equity, and the model&apos;s own
              historical rows are where that comes from. The 2007 episode in the consistency table
              is scored on a trigger list that includes{" "}
              <span className="text-ink">{gfcCdsTrigger ?? "a credit-spread blow-out"}</span>{" "}
              alongside the repo haircuts and the sector leverage that made them contagious. Credit
              was the series that moved first and moved furthest.
            </p>
            <p>
              Oracle is the model&apos;s credit anchor, and it is worth being precise about why.
              It is a large investment-grade issuer funding AI datacenter capex with bonds, and
              a liquid five-year CDS on it exists &mdash; a rare thing in this market. It is not,
              however, the largest borrower in the ledger. Among the tracked debt facilities,
              Oracle&apos;s {oracleDebtUsd > 0 ? formatTotal(oracleDebtUsd) : "—"} senior-notes
              deal sits behind{" "}
              {largestDebtDeals
                .filter((d) => !d.title.includes("Oracle"))
                .slice(0, 3)
                .map((d) => d.amount_display)
                .join(", ")}
              . Those facilities are convertible notes, term loans and secured GPU-collateral
              financings, whose prices are set in private negotiations rather than on a public tape.
              That is precisely the gap the anchor fills.
            </p>
            <p>
              The 2000 episode in the same table is the useful contrast, because the mechanism is
              different: its trigger list is capex, circular vendor financing and a peak
              multiple, and it contains no credit-spread leg at all ({dotcomCdsTriggerCount} of{" "}
              {dotcomTriggers.length} triggers). The question underneath is the same one. Who is on
              the hook if the cash flow does not arrive? In 2000 the answer was a bondholder; in
              this cycle, for most of the capacity, it is a lender with no public spread to
              watch.
            </p>
            <p>
              The rating is in the model&apos;s own source note on the credit input, which records
              that S&amp;P cut Oracle to BBB&minus; in July 2026. So a wide spread here is a
              statement about a mid-grade balance sheet carrying a large build-out, not a
              prediction of default.
            </p>
            <p>
              There is a live illustration in the board. Oracle&apos;s equity is{" "}
              <span className="num font-semibold text-ink">
                {Math.abs(orcl?.drawdownFromAthPct ?? 0).toFixed(1)}% below
              </span>{" "}
              its 52-week high, at {orcl?.marketCapDisplay} of market value, while the credit
              market is printing a record wide spread at the same time. Those are two different
              markets answering two different questions, and the model&apos;s choice to weight
              credit at {creditContribution?.weightPct}% is a bet that the credit print is the
              forward-looking one.
            </p>
          </div>

          <GuideDisclosure summary="The honest counterpoint" tone="notice-caution">
            One issuer is one issuer. The Oracle spread is a proxy for the AI credit complex, not
            a measurement of it, and a single print can move on company-specific news that has
            nothing to do with the build-out. The model limits the damage in two ways: it reads
            the spread against its own published baseline rather than in isolation, and it never
            lets the credit leg alone dominate the composite &mdash; the contagion term that
            multiplies stress consumes the credit factor&apos;s tail-free core, so a spread
            widening alone adds points without ever switching the super-additive term on.
          </GuideDisclosure>
        </GuideSection>

        {/* ── SECTION 03 ─────────────────────────────────────────────────── */}
        <GuideSection
          id="baselines"
          index={3}
          kicker="The readings"
          title="Where today's prints sit against their references"
          lead="A level on its own means nothing. A level against a published reference is the whole signal."
        >
          <div className="overflow-x-auto rounded-xl border border-rule">
            <table className="w-full text-left text-[14px]">
              <caption className="sr-only">
                Today's credit and rate prints measured against the reference levels the model
                uses.
              </caption>
              <thead className="bg-surface-2 text-ink-subtle">
                <tr>
                  <th scope="col" className="p-3 font-medium">
                    Measure
                  </th>
                  <th scope="col" className="p-3 text-right font-medium">
                    Print
                  </th>
                  <th scope="col" className="p-3 text-right font-medium">
                    Reference
                  </th>
                  <th scope="col" className="p-3 text-right font-medium">
                    Gap
                  </th>
                  <th scope="col" className="p-3 font-medium">
                    Read
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-rule">
                <tr>
                  <th scope="row" className="p-3 font-semibold text-ink">
                    Oracle 5Y CDS vs baseline
                  </th>
                  <td className="num p-3 text-right font-semibold text-ink">{cdsCurrentBps}bp</td>
                  <td className="num p-3 text-right text-ink-muted">{cdsBaselineBps}bp</td>
                  <td className="num p-3 text-right font-semibold text-risk-700">
                    +{cdsExcessBps}bp ({cdsRatio.toFixed(2)}&times;)
                  </td>
                  <td className="p-3 text-ink-muted">
                    The widest the spread has closed. The baseline is the model&apos;s own long-run
                    assumption, not an observed market rate.
                  </td>
                </tr>
                <tr>
                  <th scope="row" className="p-3 font-semibold text-ink">
                    Oracle 5Y CDS vs 90 days ago
                  </th>
                  <td className="num p-3 text-right font-semibold text-ink">{cdsCurrentBps}bp</td>
                  <td className="num p-3 text-right text-ink-muted">{cdsPriorBps}bp</td>
                  <td className="num p-3 text-right font-semibold text-risk-700">
                    +{cdsMomentumBps}bp
                  </td>
                  <td className="p-3 text-ink-muted">
                    The momentum leg of the factor is what turns a wide level into a rising one.
                  </td>
                </tr>
                <tr>
                  <th scope="row" className="p-3 font-semibold text-ink">
                    US 10-year vs neutral
                  </th>
                  <td className="num p-3 text-right font-semibold text-ink">
                    {us10yPct.toFixed(2)}%
                  </td>
                  <td className="num p-3 text-right text-ink-muted">
                    {us10yBaselinePct.toFixed(2)}%
                  </td>
                  <td className="num p-3 text-right font-semibold text-caution-700">
                    +{us10yGapBps}bp
                  </td>
                  <td className="p-3 text-ink-muted">
                    The neutral level is the model&apos;s own assumption, and it is the most
                    contestable number on this page.
                  </td>
                </tr>
                <tr>
                  <th scope="row" className="p-3 font-semibold text-ink">
                    Fed funds
                  </th>
                  <td className="num p-3 text-right font-semibold text-ink">
                    {fedFundsPct.toFixed(2)}%
                  </td>
                  <td className="num p-3 text-right text-ink-muted">—</td>
                  <td className="num p-3 text-right text-ink-subtle">—</td>
                  <td className="p-3 text-ink-muted">
                    Display-only. No factor weights the policy rate today; it is carried for a
                    future regime multiplier.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="max-w-measure space-y-4 text-[15px] leading-relaxed text-ink-muted">
            <p>
              Of the three reference levels above, one is an observation &mdash; the 90-day-ago
              spread &mdash; and two are assumptions: the CDS baseline of {cdsBaselineBps}bp and the{" "}
              {us10yBaselinePct.toFixed(2)}% neutral yield. Both assumptions are stated in the
              model&apos;s own inputs, and neither is a market print. They are the two numbers a
              critic should argue with first, because a different baseline produces a different
              score from identical data.
            </p>
          </div>
        </GuideSection>

        {/* ── SECTION 04 ─────────────────────────────────────────────────── */}
        <GuideSection
          id="credit-into-composite"
          index={4}
          kicker="The mechanism"
          title="How the credit print becomes points"
          lead="The credit factor reads a level, a momentum and a convex tail. This is the formula the engine runs, printed from the factor definition."
        >
          <div className="panel space-y-2">
            <span className="label">Published formula</span>
            <code className="num block text-[14px] leading-relaxed text-ink">
              {creditFactor?.formula}
            </code>
          </div>

          <div className="max-w-measure space-y-4 text-[15px] leading-relaxed text-ink-muted">
            <p>
              Three inputs go in: the current print of {cdsCurrentBps}bp, the baseline of{" "}
              {cdsBaselineBps}bp, and the 90-day-ago print of {cdsPriorBps}bp. The level ramp
              scales the ratio of the first to the second across the whole crisis range; the
              momentum multiplier rewards a print that is still rising and gives relief to one that
              has gone flat; the tail prices the panic region on top. Today the factor scores{" "}
              <span className="num font-semibold text-ink">
                {creditContribution?.reading.score.toFixed(3)}
              </span>
              , which is {creditContribution?.earnedPoints.toFixed(1)} of its{" "}
              {creditContribution?.weightPct} points &mdash; which is why the credit factor is no
              longer the largest single contributor to the composite.
            </p>
            <p>
              That last sentence is a correction, not a forecast. Before model version 2.7.0 the
              level ramp stopped at three times baseline, which was below the live print, so the
              factor had been pinned at its maximum for weeks. Widening the ramp to the
              model&rsquo;s own published panic extent released it, and the credit factor now
              measures stress instead of adding a constant. The engine&rsquo;s own reading for
              today is:{" "}
              <span className="text-ink">{creditContribution?.reading.reading}</span>.
            </p>
          </div>
        </GuideSection>

        {/* ── SECTION 05 ─────────────────────────────────────────────────── */}
        <GuideSection
          id="rates"
          index={5}
          kicker="The mechanism"
          title="The 10-year is a discount-rate problem, not a default problem"
          lead="The macro factor is four legs in one number: the yield, inflation, the real yield and the high-yield spread. Only the last one is about credit."
        >
          <div className="panel space-y-2">
            <span className="label">Published formula</span>
            <code className="num block text-[14px] leading-relaxed text-ink">
              {macroFactor?.formula}
            </code>
          </div>

          <div className="max-w-measure space-y-4 text-[15px] leading-relaxed text-ink-muted">
            <p>
              The largest single leg is the 10-year yield itself, weighted at 40% of the factor.
              It matters for a specific reason: AI infrastructure is a long-duration asset. A
              datacenter bought with borrowed money has to repay the debt out of cash flow
              generated over years, and the price of every dollar of that cash flow is set by the
              long end of the curve. At a real yield of{" "}
              <span className="num font-semibold text-ink">
                {realYield10yPct.toFixed(2)}%
              </span>{" "}
              there is very little room between a buyer of compute and a lender before the
              arithmetic stops working.
            </p>
            <p>
              The Shiller cross-check on this site makes the same point in a different unit. The
              AI sector trades at{" "}
              <span className="num font-semibold text-ink">
                {latestModel.shillerCape.aiCapeMultiple.toFixed(1)}&times;
              </span>{" "}
              cyclically adjusted earnings against a historical median of{" "}
              <span className="num font-semibold text-ink">
                {latestModel.shillerCape.historicalMedianCape.toFixed(1)}&times;
              </span>
              , an earnings yield of{" "}
              <span className="num font-semibold text-ink">
                {latestModel.shillerCape.earningsYieldPct.toFixed(2)}%
              </span>{" "}
              against a real 10-year of{" "}
              <span className="num font-semibold text-ink">
                {latestModel.shillerCape.real10yYieldPct.toFixed(2)}%
              </span>{" "}
              . The excess yield is{" "}
              <span className="num font-semibold text-ink">
                {latestModel.shillerCape.excessCapeYieldPct >= 0 ? "+" : ""}
                {latestModel.shillerCape.excessCapeYieldPct.toFixed(2)}%
              </span>
              , in the {latestModel.shillerCape.equityRiskPremiumBand} band. That is the cushion
              an equity holder is being paid to absorb hardware obsolescence and a fall in
              earnings.
            </p>
            <p>
              The high-yield leg is the smallest at 20% and the only credit leg inside the macro
              factor. It is there to catch a broad credit shock, which a single-issuer spread
              cannot see, and the two do different jobs: one prices one borrower&apos;s default
              risk, the other prices the market&apos;s appetite for risk in general. The contagion
              term is the only place where the macro score and the credit score meet.
            </p>
            <p>
              A reader watching all three series should also watch them on different clocks. The
              Oracle spread prints as a dated close; the high-yield spread and the 10-year are
              daily index and Treasury series. The market board shows the day&apos;s change for
              each &mdash; {board("US10Y")?.changeDisplay ?? "—"} on the 10-year and{" "}
              {board("HY-OAS")?.changeDisplay ?? "—"} on the high-yield spread &mdash; and a
              single day of those two prints tells you almost nothing. The level against the
              published baseline is the signal; the day&apos;s change is colour.
            </p>
          </div>
        </GuideSection>

        {/* ── SECTION 06 ─────────────────────────────────────────────────── */}
        <GuideSection
          id="model-vs-market"
          index={6}
          kicker="The disagreement"
          title="The model print against the market price"
          lead="The model and the prediction market disagree by a wide margin. Most of that gap is definitional, and the rest is worth taking seriously."
        >
          <div className="overflow-x-auto rounded-xl border border-rule">
            <table className="w-full text-left text-[14px]">
              <caption className="sr-only">
                The model print compared with the published market-implied 12-month reading and
                with the raw prediction-market contracts.
              </caption>
              <thead className="bg-surface-2 text-ink-subtle">
                <tr>
                  <th scope="col" className="p-3 font-medium">
                    Reading
                  </th>
                  <th scope="col" className="p-3 text-right font-medium">
                    Probability
                  </th>
                  <th scope="col" className="p-3 font-medium">
                    What it prices
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-rule">
                <tr>
                  <th scope="row" className="p-3 font-semibold text-ink">
                    This model
                  </th>
                  <td className="num p-3 text-right font-semibold text-ink">
                    {model.burstProbability.toFixed(1)}%
                  </td>
                  <td className="p-3 text-ink-muted">
                    An AI capital bubble bursts inside twelve months, defined by the model&apos;s
                    pre-registered triggers.
                  </td>
                </tr>
                <tr>
                  <th scope="row" className="p-3 font-semibold text-ink">
                    Market-implied 12-month read
                  </th>
                  <td className="num p-3 text-right font-semibold text-ink">
                    {MARKET_IMPLIED_12M_BAND.centralPct.toFixed(1)}%
                    <span className="block text-[14px] font-normal text-ink-subtle">
                      {MARKET_IMPLIED_12M_BAND.lowPct.toFixed(1)}%&ndash;{" "}
                      {MARKET_IMPLIED_12M_BAND.highPct.toFixed(1)}% across the bias correction
                      (&alpha; {MARKET_IMPLIED_12M_BAND.alphaRange[0].toFixed(2)}&ndash;{" "}
                      {MARKET_IMPLIED_12M_BAND.alphaRange[1].toFixed(2)})
                    </span>
                  </td>
                  <td className="p-3 text-ink-muted">
                    The same question, priced by money, with a horizon and bias correction applied
                    to the tracked contracts.
                  </td>
                </tr>
                <tr>
                  <th scope="row" className="p-3 font-semibold text-ink">
                    {contract2026?.question ?? "2026 contract"}
                  </th>
                  <td className="num p-3 text-right font-semibold text-ink">
                    {contract2026?.yesProbabilityPct.toFixed(1)}%
                    <span className="block text-[14px] font-normal text-ink-subtle">
                      ${((contract2026?.volumeUsd ?? 0) / 1e6).toFixed(2)}M traded
                    </span>
                  </td>
                  <td className="p-3 text-ink-muted">
                    An industry downturn by a fixed calendar date. A narrower question with a
                    shorter horizon than the model&apos;s.
                  </td>
                </tr>
                <tr>
                  <th scope="row" className="p-3 font-semibold text-ink">
                    {contract2027?.question ?? "2027 contract"}
                  </th>
                  <td className="num p-3 text-right font-semibold text-ink">
                    {contract2027?.yesProbabilityPct.toFixed(1)}%
                    <span className="block text-[14px] font-normal text-ink-subtle">
                      ${((contract2027?.volumeUsd ?? 0) / 1e3).toFixed(1)}K traded
                    </span>
                  </td>
                  <td className="p-3 text-ink-muted">
                    The longer-dated contract, and the thinnest book in the set. Thin books move on
                    small money.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="max-w-measure space-y-4 text-[15px] leading-relaxed text-ink-muted">
            <p>
              The model sits {divergence.vsBandHigh.toFixed(1)} probability points above the top
              of the market-implied band and {divergence.vsBandLow.toFixed(1)} points above its
              bottom
              {gapVsContract2026 !== null ? (
                <>
                  , and {gapVsContract2026.toFixed(1)} points above the raw 2026 contract
                </>
              ) : null}
              {gapVsContract2027 !== null ? (
                <> and {gapVsContract2027.toFixed(1)} points above the raw 2027 contract</>
              ) : null}
              . Three things explain it, and only the third is a disagreement about the world.
            </p>
            <p>
              First, definition. The contracts ask whether an <em>industry downturn</em> arrives by
              a calendar date; the model asks whether an AI <em>capital bubble</em> bursts inside
              twelve months. A capital bubble bursting and an industry downturn arriving are
              different events, and the model&apos;s own pre-registered definition is wider: any
              of a 30% peak-to-trough fall in the tracked basket, a 100bp rise in Oracle&apos;s
              5-year CDS, or a 50% fall in tracked debt issuance, inside the window. Second,
              calibration. The model maps its score through a judgement anchor that was never
              fitted to anything, so a difference of tens of points is entirely ordinary for a
              different question. Third, and only third, the two might simply be wrong about the
              same thing.
            </p>
            <p>
              The market side is not a truth machine either. The tracked books carry roughly $
              {(crowdVolumeUsd / 1e6).toFixed(2)}M of total volume, and the longer-dated contract
              that matters most to a twelve-month question is the thinnest one in the set. The
              model has the opposite problem: it is built on filed receipts and daily market
              prints, but it has no false-positive record at all, because every episode in its
              historical table broke.
            </p>
          </div>

          <GuideDisclosure summary="How to read a disagreement like this">
            Treat it as a difference in what is being priced, not as a trading signal. The useful
            question is not who is right but which trigger moves first: the model&rsquo;s
            pre-registered burst definition is dominated by the credit leg, so a 100bp rise in
            Oracle&apos;s 5-year spread inside the window is the single most direct path from the
            model&rsquo;s print to its trigger. If that spread is already {cdsCurrentBps}bp, the
            question is not whether it is wide but where it goes from here.
          </GuideDisclosure>
        </GuideSection>

        {/* ── SECTION 07 ─────────────────────────────────────────────────── */}
        <GuideSection id="not-this" index={7} kicker="The disclosure" title="What this is not">
          <NotThisPanel
            items={[
              "The Oracle spread is one issuer, not the AI credit market. It is a proxy, and the site publishes it as one.",
              "The high-yield spread is a market-wide risk-appetite series. It can stay calm while AI-specific credit is repricing, and it can widen for reasons that have nothing to do with AI.",
              "The 10-year is a discount rate, not a default forecast. It is the same number a mortgage or a pension fund is priced off.",
              "The baseline and neutral levels used against these prints are the model's own assumptions. They are not observed market rates, and they are the first thing worth arguing with.",
              "A widening spread is not a default. It is the price of insurance rising, and insurers and lenders can be wrong in both directions.",
              "The model print and the market price are answers to different questions. Part of the gap between them is definitional and will not close.",
            ]}
          />
        </GuideSection>

        {/* ── SECTION 08 ─────────────────────────────────────────────────── */}
        <GuideSection
          id="check-it"
          index={8}
          kicker="The receipts"
          title="Check the prints yourself"
          lead="Every spread and yield on this page comes from a live feed that is published daily."
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Link
              href="/markets"
              className="card card-flush flex min-h-11 flex-col gap-1 p-4 transition-colors hover:border-rule-strong"
            >
              <span className="label">Market board</span>
              <span className="text-[15px] font-semibold text-ink">
                Live quotes, yields and spreads
              </span>
              <span className="mt-1 text-[14px] text-ink-subtle">
                The daily board these readings come from, including the high-yield spread and the
                10-year.
              </span>
              <span className="mt-2 flex items-center gap-1 text-[14px] font-medium text-ink">
                Open markets
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </span>
            </Link>
            <Link
              href="/methodology"
              className="card card-flush flex min-h-11 flex-col gap-1 p-4 transition-colors hover:border-rule-strong"
            >
              <span className="label">The method</span>
              <span className="text-[15px] font-semibold text-ink">
                How credit enters the composite
              </span>
              <span className="mt-1 text-[14px] text-ink-subtle">
                The credit and macro factor specifications, the contagion term and the
                pre-registered burst definition.
              </span>
              <span className="mt-2 flex items-center gap-1 text-[14px] font-medium text-ink">
                Read the methodology
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </span>
            </Link>
          </div>
        </GuideSection>
      </div>

      <div className="mt-10">
        <GuideFooter current={guide} next={next} />
      </div>
    </div>
  );
}
