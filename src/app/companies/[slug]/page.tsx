import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  COMPANIES,
  companySlug,
  formatUsd,
  getCompanyBySlug,
  riskTone,
  circularTone,
  type CompanyProfile,
} from "../_components/companyData";
import { getCompanyDeals, LEDGER_SEARCH_TERMS } from "../_components/ledgerSearchTerms";
import { CompanyDebtStackChart } from "./_components/CompanyDebtStackChart";
import { CompanyPeerComparison } from "./_components/CompanyPeerComparison";
import { CompanyCircularityGraph } from "./_components/CompanyCircularityGraph";
import { POLYMARKET_REFERRAL_CODE } from "@/data/polymarket-data";
import {
  ArrowLeft,
  ArrowRight,
  CircleDollarSign,
  ExternalLink,
  Layers,
  LineChart,
  ShieldCheck,
} from "lucide-react";

interface PageProps {
  params: {
    slug: string;
  };
}

export function generateStaticParams() {
  return COMPANIES.map((company) => ({
    slug: companySlug(company.name),
  }));
}

export function generateMetadata({ params }: PageProps): Metadata {
  const company = getCompanyBySlug(params.slug);
  if (!company) {
    return {
      title: "Company Dossier",
      description: "Company profile not found in the AI Capital Tracker register.",
    };
  }

  const title = `${company.name} (${company.ticker || company.sector}) — AI spending, debt and who funds it`;
  const desc = `How much ${company.name} spends on AI (${formatUsd(company.totalVolumeUsd)} tracked), how much debt they carry (${formatUsd(company.debtInvolvedUsd)}), and who is financing them.`;

  return {
    title,
    description: desc,
    openGraph: {
      title,
      description: desc,
      type: "article",
      url: `https://aicapitaltracker.com/companies/${params.slug}`,
      siteName: "AI Capital Tracker",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: desc,
    },
  };
}

function getCompanyPlainPageLink(companyName: string): {
  href: string;
  title: string;
  question: string;
} {
  switch (companyName) {
    case "OpenAI":
      return {
        href: "/who-is-funding-openai",
        title: "Who is funding OpenAI?",
        question: "See the receipt-backed breakdown of who is financing OpenAI and the circular capital loops behind it.",
      };
    case "Anthropic":
    case "Mistral AI":
    case "Scale AI":
    case "Databricks":
      return {
        href: "/will-openai-ipo",
        title: "Will the frontier AI labs IPO?",
        question: "Read the plain answer on private lab liquidity, convertible note debt covenants, and IPO timelines.",
      };
    case "CoreWeave":
    case "Oracle":
    case "Blackstone":
    case "Crusoe Energy":
    case "Nebius Group":
    case "Northern Data / Rumble":
    case "Lambda Labs":
      return {
        href: "/how-much-ai-debt-there-is",
        title: "How much AI debt is there?",
        question: "Read the plain answer on how GPU-backed debt, synthetic leases, and private credit facilities operate across AI infrastructure.",
      };
    case "Microsoft":
    case "Amazon AWS":
    case "Alphabet / Google":
    case "Meta Platforms":
      return {
        href: "/how-much-is-being-spent-on-ai",
        title: "How much is being spent on AI?",
        question: "Read the plain answer tracking hyperscaler capex and where the $2.87T in disclosed infrastructure capital goes.",
      };
    case "NVIDIA":
    case "Supermicro":
    case "Marvell Technology":
    case "SpaceX / xAI":
      return {
        href: "/is-ai-spending-too-much",
        title: "Is AI spending too much?",
        question: "Read the plain answer comparing hardware depreciation, data center power costs, and real commercial revenue.",
      };
    case "Constellation Energy":
    case "Talen Energy":
      return {
        href: "/what-is-cpi-doing-to-ai",
        title: "What is CPI and power inflation doing to AI?",
        question: "Read the plain answer on nuclear power purchase agreements, grid interconnection queues, and real rate pressure.",
      };
    default:
      return {
        href: "/will-the-ai-bubble-burst",
        title: "Will the AI bubble burst in the next 12 months?",
        question: "Read our direct plain answer on the 12-month burst probability and what the empirical model tracks.",
      };
  }
}

export default function CompanyDossierPage({ params }: PageProps) {
  const company = getCompanyBySlug(params.slug);
  if (!company) {
    notFound();
  }

  const matchedDeals = getCompanyDeals(company.name);
  const ledgerTerm = LEDGER_SEARCH_TERMS[company.name] ?? company.name;
  const plainLink = getCompanyPlainPageLink(company.name);

  return (
    <div className="section-sm space-y-8">
      {/* ── Breadcrumb & Wayfinding ────────────────────────────────────────── */}
      <nav aria-label="Breadcrumb">
        <Link
          href="/companies"
          className="inline-flex min-h-[44px] items-center gap-1.5 text-[14px] font-medium text-ink-muted transition-colors hover:text-ink focus:outline-hidden focus:underline"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          <span>Back to Companies Register</span>
        </Link>
      </nav>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="space-y-3">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
          <span className="label">Company Dossier</span>
          <span className="pill">{company.sector}</span>
          {company.ticker ? (
            <span className="num text-[14px] font-mono text-ink-muted">{company.ticker}</span>
          ) : null}
          <span className={`pill ${riskTone(company.riskTier)}`}>
            {company.riskTier} Risk
          </span>
        </div>

        <h1 className="max-w-reading text-3xl font-bold tracking-tight text-ink sm:text-4xl">
          {company.name}
        </h1>

        <p className="prose prose-lead max-w-reading text-[16px] text-ink-muted">
          {company.role}
        </p>
      </header>

      {/* ── Contextual Link Out to Plain Answer Page ────────────────────────── */}
      <aside aria-label="Plain answer briefing" className="panel p-4 border-l-2 border-l-ink bg-surface-2/60">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-0.5 max-w-2xl">
            <span className="label text-[12px] uppercase text-ink-subtle">Plain Answer Briefing</span>
            <p className="text-[14px] text-ink font-medium leading-relaxed">
              {plainLink.question}
            </p>
          </div>
          <Link
            href={plainLink.href}
            className="inline-flex min-h-[44px] items-center gap-1.5 font-semibold text-ink underline decoration-rule underline-offset-4 hover:decoration-ink shrink-0 text-[14px]"
          >
            <span>{plainLink.title}</span>
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </aside>

      {/* ── The Numbers: 5 Metrics with Disclosed / Not Disclosed Boundaries ── */}
      <section aria-labelledby="metrics-headline" className="space-y-3">
        <h2 id="metrics-headline" className="sr-only">
          Key Capital Metrics for {company.name}
        </h2>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {/* 1. Committed Volume */}
          <div className="card space-y-2">
            <span className="label text-[12px] uppercase text-ink-subtle">Disclosed Volume</span>
            <div className="num text-2xl font-bold tracking-tight text-ink">
              {company.totalVolumeUsd > 0 ? formatUsd(company.totalVolumeUsd) : "\u2014"}
            </div>
            <div className="space-y-1 border-t border-rule pt-2 text-[14px] leading-snug">
              <p className="text-ink font-medium">
                {company.totalVolumeUsd > 0
                  ? `Sum of public transactions where ${company.name} is a named party.`
                  : "Announced infrastructure partnership; financial terms not disclosed."}
              </p>
              <p className="text-ink-subtle">
                What this is NOT: Not total company capex (capital expenditure: cash spent to build physical data centers and buy chips), cash reserves, or balance-sheet equity. See{" "}
                <Link href="/glossary#capex-to-free-cash-flow" className="underline hover:text-ink">
                  capex in glossary
                </Link>
                .
              </p>
            </div>
          </div>

          {/* 2. Debt Involved */}
          <div className="card space-y-2">
            <span className="label text-[12px] uppercase text-ink-subtle">Tracked Borrowing</span>
            <div
              className={`num text-2xl font-bold tracking-tight ${
                company.debtInvolvedUsd > 0 ? "text-risk-600 dark:text-risk-400" : "text-ink"
              }`}
            >
              {company.debtInvolvedUsd > 0 ? formatUsd(company.debtInvolvedUsd) : "None"}
            </div>
            <div className="space-y-1 border-t border-rule pt-2 text-[14px] leading-snug">
              <p className="text-ink font-medium">
                {company.debtInvolvedUsd > 0
                  ? `Sum of ${company.debtTranches.length} disclosed debt tranches and filed borrowings.`
                  : "Funded by equity capital, customer commitments, or operating cash flows."}
              </p>
              <p className="text-ink-subtle">
                What this is NOT: Not total enterprise liabilities; excludes unannounced private bilateral credit.
              </p>
            </div>
          </div>

          {/* 3. Valuation */}
          <div className="card space-y-2">
            <span className="label text-[12px] uppercase text-ink-subtle">Valuation / Market Cap</span>
            <div className="num text-2xl font-bold tracking-tight text-ink">
              {formatUsd(company.valuationUsd)}
            </div>
            <div className="space-y-1 border-t border-rule pt-2 text-[14px] leading-snug">
              <p className="text-ink font-medium">
                {company.ticker && !company.ticker.startsWith("Private")
                  ? "Public market capitalisation based on SEC share count and recent close."
                  : "Latest reported private funding round mark or S-1 target valuation."}
              </p>
              <p className="text-ink-subtle">
                What this is NOT: Not liquid recovery value or asset backing; private marks carry liquidation preferences.
              </p>
            </div>
          </div>

          {/* 4. Multiple & Run Rate */}
          <div className="card space-y-2">
            <span className="label text-[12px] uppercase text-ink-subtle">Revenue Multiple (P/S)</span>
            <div className="num text-2xl font-bold tracking-tight text-ink">
              {company.psMultiple ? `${company.psMultiple}\u00d7 P/S` : "n/a"}
            </div>
            <div className="space-y-1 border-t border-rule pt-2 text-[14px] leading-snug">
              <p className="text-ink font-medium">
                {company.runRateRevenueUsd
                  ? `P/S multiple (price to sales: valuation divided by ${formatUsd(company.runRateRevenueUsd)} annual run-rate revenue; revenue valued at ${company.psMultiple}\u00d7).`
                  : "Run-rate revenue not separately broken out in public disclosures."}
              </p>
              <p className="text-ink-subtle">
                What this is NOT: A P/S multiple is not a valuation, nor does it measure net profit margin or debt service ability. See{" "}
                <Link href="/glossary#price-to-sales" className="underline hover:text-ink">
                  P/S multiple in glossary
                </Link>
                .
              </p>
            </div>
          </div>

          {/* 5. Deal Count */}
          <div className="card space-y-2">
            <span className="label text-[12px] uppercase text-ink-subtle">Disclosed Ledger Deals</span>
            <div className="num text-2xl font-bold tracking-tight text-ink">
              {matchedDeals.length}
            </div>
            <div className="space-y-1 border-t border-rule pt-2 text-[14px] leading-snug">
              <p className="text-ink font-medium">
                Transactions catalogued in the AI Capital Tracker 169-deal ledger.
              </p>
              <p className="text-ink-subtle">
                What this is NOT: Not all corporate contracts; reflects only transactions meeting ledger inclusion rules.
              </p>
            </div>
          </div>

          {/* 6. Circularity Level */}
          <div className="card space-y-2">
            <span className="label text-[12px] uppercase text-ink-subtle">Circularity Exposure</span>
            <div className="text-xl font-bold tracking-tight text-ink">
              <span className={`chip ${circularTone(company.circularRiskLevel)}`}>
                {company.circularRiskLevel}
              </span>
            </div>
            <div className="space-y-1 border-t border-rule pt-2 text-[14px] leading-snug">
              <p className="text-ink font-medium">
                {company.circularityConnections.length} disclosed counterparties in compute or financing loops.
              </p>
              <p className="text-ink-subtle">
                What this is NOT: Not proof of circular booking; reflects mutual vendor or capital dependencies.
              </p>
            </div>
          </div>
        </div>

        {company.polymarketOdds ? (
          <div className="panel p-4 space-y-2 border-l-2 border-l-ink">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <span className="label text-[12px] uppercase text-ink-subtle">What the market is betting about this company</span>
                <p className="text-[15px] font-semibold text-ink mt-0.5">
                  {company.polymarketOdds.marketName}: The market says{" "}
                  <span className="font-bold text-accent-strong dark:text-accent-ink">{company.polymarketOdds.oddsDisplay}</span>
                </p>
              </div>
              <a
                href={company.polymarketOdds.url}
                target="_blank"
                rel="noopener noreferrer sponsored"
                className="btn min-h-11 shrink-0 text-sm"
              >
                Trade this contract on Polymarket
                <ExternalLink className="h-3.5 w-3.5 ml-1.5" aria-hidden="true" />
              </a>
            </div>
            <p className="text-[13px] leading-relaxed text-ink-subtle">
              Outbound contract links carry our referral code (<strong className="font-mono text-ink">{POLYMARKET_REFERRAL_CODE}</strong>) and we may be paid a referral fee. Referral compensation never changes a published figure, tier, or analysis on this site.
            </p>
          </div>
        ) : null}

        {/* ── Related Plain Answer Quick Links ─────────────────────────────── */}
        {company.name === "OpenAI" && (
          <div className="flex flex-wrap items-center gap-2 pt-1 text-[14px]">
            <span className="text-ink-muted">Plain answers:</span>
            <Link
              href="/will-openai-ipo"
              className="inline-flex min-h-[44px] items-center gap-1 font-semibold text-ink underline decoration-rule underline-offset-4 hover:decoration-ink"
            >
              Will OpenAI IPO in 2026?
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
            <span className="text-ink-faint" aria-hidden="true">&middot;</span>
            <Link
              href="/who-is-funding-openai"
              className="inline-flex min-h-[44px] items-center gap-1 font-semibold text-ink underline decoration-rule underline-offset-4 hover:decoration-ink"
            >
              Who is funding OpenAI?
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </div>
        )}
        {["Microsoft", "Alphabet", "Amazon", "Meta"].includes(company.name) && (
          <div className="flex flex-wrap items-center gap-2 pt-1 text-[14px]">
            <span className="text-ink-muted">Plain answer:</span>
            <Link
              href="/is-ai-spending-too-much"
              className="inline-flex min-h-[44px] items-center gap-1 font-semibold text-ink underline decoration-rule underline-offset-4 hover:decoration-ink"
            >
              Is AI spending too much? (The $465B capex vs cash flow gap)
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </div>
        )}
      </section>

      {/* ── Debt Stack Chart ────────────────────────────────────────────────── */}
      <CompanyDebtStackChart
        companyName={company.name}
        tranches={company.debtTranches}
        totalDebtUsd={company.debtInvolvedUsd}
      />

      {/* ── Circularity Graph ───────────────────────────────────────────────── */}
      <CompanyCircularityGraph company={company} />

      {/* ── Peer Comparison ─────────────────────────────────────────────────── */}
      <CompanyPeerComparison currentCompany={company} />

      {/* ── Disclosed Deals Table ───────────────────────────────────────────── */}
      <section className="card space-y-4" aria-labelledby="deals-table-title">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-rule pb-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 id="deals-table-title" className="text-lg font-bold tracking-tight text-ink">
                Disclosed Ledger Deals
              </h2>
              <span className="pill num">{matchedDeals.length} deals</span>
            </div>
            <p className="mt-0.5 text-[14px] text-ink-subtle">
              Every discrete transaction involving {company.name} recorded in the research ledger.
              Click any deal to view the primary sources and full deal sheet.
            </p>
          </div>

          <Link
            href={`/ledger?search=${encodeURIComponent(ledgerTerm)}`}
            className="inline-flex min-h-[44px] items-center gap-1 text-[13px] font-medium text-ink transition-colors hover:text-ink-muted focus:outline-hidden focus:underline"
          >
            Open in ledger view
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </div>

        {matchedDeals.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[14px]">
              <caption className="sr-only">
                Disclosed transactions in the AI Capital Tracker ledger involving {company.name}
              </caption>
              <thead>
                <tr className="border-b border-rule text-ink-subtle">
                  <th scope="col" className="py-2.5 pr-3 font-semibold">Date</th>
                  <th scope="col" className="py-2.5 pr-4 font-semibold">Transaction / Deal</th>
                  <th scope="col" className="py-2.5 pr-4 font-semibold">Category</th>
                  <th scope="col" className="py-2.5 pr-4 font-semibold text-right">Disclosed Amount</th>
                  <th scope="col" className="py-2.5 pr-3 font-semibold text-center">Status</th>
                  <th scope="col" className="py-2.5 font-semibold text-right">Ledger Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-rule font-tabular">
                {matchedDeals.map((deal) => (
                  <tr key={deal.id} className="hover:bg-surface-2 transition-colors">
                    <td className="py-3 pr-3 num text-[13px] text-ink-muted whitespace-nowrap">
                      {deal.announced_date}
                    </td>
                    <th scope="row" className="py-3 pr-4 font-medium text-ink max-w-sm sm:max-w-md">
                      <Link
                        href={`/ledger?deal=${deal.id}`}
                        className="min-h-[44px] flex items-center transition-colors hover:underline"
                      >
                        {deal.title}
                      </Link>
                    </th>
                    <td className="py-3 pr-4 text-ink-muted text-[13px] whitespace-nowrap">
                      {deal.category}
                    </td>
                    <td className="num py-3 pr-4 text-right font-semibold text-ink whitespace-nowrap">
                      {deal.amount_display}
                    </td>
                    <td className="py-3 pr-3 text-center whitespace-nowrap">
                      <span className="rounded-xs bg-surface-3 px-1.5 py-0.5 text-[12px] font-medium text-ink-muted">
                        {deal.status}
                      </span>
                    </td>
                    <td className="py-3 text-right whitespace-nowrap">
                      <Link
                        href={`/ledger?deal=${deal.id}`}
                        className="inline-flex min-h-[44px] items-center gap-1 text-[13px] font-medium text-ink-muted hover:text-ink focus:outline-hidden focus:underline"
                      >
                        <span className="font-mono text-[12px]">{deal.id}</span>
                        <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="py-4 text-center text-[14px] text-ink-muted italic">
            No discrete transactions catalogued in the ledger for this entity.
          </p>
        )}
      </section>

      {/* ── Exposure Summary & Prediction Market Link ───────────────────────── */}
      <section className="card space-y-4" aria-labelledby="exposure-summary-title">
        <h2 id="exposure-summary-title" className="text-lg font-bold tracking-tight text-ink border-b border-rule pb-2">
          Published Exposure Summary
        </h2>
        <p className="text-[15px] leading-relaxed text-ink-muted">
          {company.exposureSummary}
        </p>

        {company.polymarketOdds ? (
          <div className="panel flex flex-wrap items-center justify-between gap-3 p-3">
            <div>
              <span className="label block text-ink-subtle">Prediction Market Contract</span>
              <p className="text-[14px] font-semibold text-ink">
                {company.polymarketOdds.marketName}
              </p>
              <p className="num text-[14px] text-ink-muted">
                Current market implied odds: <span className="font-bold text-ink">{company.polymarketOdds.oddsDisplay}</span>
              </p>
            </div>
            <a
              href={company.polymarketOdds.url}
              target="_blank"
              rel="noopener noreferrer sponsored"
              className="inline-flex min-h-[44px] items-center gap-1.5 btn btn-ghost text-[13px]"
            >
              View Polymarket contract
              <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
            </a>
          </div>
        ) : null}
      </section>

      {/* ── What This Is Not Disclosure Panel ───────────────────────────────── */}
      <section className="panel space-y-2.5 not-this-body" aria-labelledby="not-this-title">
        <h2 id="not-this-title" className="label">
          What this dossier is NOT
        </h2>
        <ul className="space-y-1.5 text-[14px] leading-relaxed text-ink-muted">
          <li>
            • <strong>Not an investment rating or credit evaluation:</strong> Profiles document public filings,
            disclosed facilities, and verified transactions. They do not constitute investment advice or a solvency forecast.
          </li>
          <li>
            • <strong>Disclosed volume is not balance-sheet cash:</strong> Cumulative transaction amounts represent multi-year
            capacity commitments, lease agreements, and silicon procurement rather than unencumbered liquid reserves.
          </li>
          <li>
            • <strong>Valuation is not liquidation recovery:</strong> Private marks and market capitalisations reflect preferred
            round pricing or secondary market quotes, not asset liquidation value in a wind-down or restructuring.
          </li>
          <li>
            • <strong>Circularity is not proof of fraud:</strong> Cross-funding, vendor financing, and reciprocal infrastructure
            deals represent corporate interdependency. A disclosed connection does not establish an illicit financial loop.
          </li>
        </ul>
      </section>

      {/* ── Navigation / Next Steps ─────────────────────────────────────────── */}
      <section className="grid grid-cols-1 gap-3 sm:grid-cols-3 pt-2" aria-label="Next steps">
        <Link
          href={`/ledger?search=${encodeURIComponent(ledgerTerm)}`}
          className="card card-flush flex flex-col gap-1 p-4 transition-colors hover:border-rule-strong"
        >
          <span className="label">Full Ledger</span>
          <span className="text-[15px] font-semibold text-ink">Inspect all transactions</span>
          <span className="mt-1 text-[14px] text-ink-subtle">
            Filter, search and verify source documentation for every deal.
          </span>
          <span className="mt-2 flex items-center gap-1 text-[14px] font-medium text-ink">
            Search {ledgerTerm}
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </span>
        </Link>

        <Link
          href="/visualize"
          className="card card-flush flex flex-col gap-1 p-4 transition-colors hover:border-rule-strong"
        >
          <span className="label">Visual Charts</span>
          <span className="text-[15px] font-semibold text-ink">Capital Wheel & Flow</span>
          <span className="mt-1 text-[14px] text-ink-subtle">
            Explore sector distributions and the radial architecture of AI capital.
          </span>
          <span className="mt-2 flex items-center gap-1 text-[14px] font-medium text-ink">
            Open charts
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </span>
        </Link>

        <Link
          href="/methodology"
          className="card card-flush flex flex-col gap-1 p-4 transition-colors hover:border-rule-strong"
        >
          <span className="label">Methodology</span>
          <span className="text-[15px] font-semibold text-ink">Scoring & Verification</span>
          <span className="mt-1 text-[14px] text-ink-subtle">
            Read the quantitative rules, weighting parameters and failure cases.
          </span>
          <span className="mt-2 flex items-center gap-1 text-[14px] font-medium text-ink">
            Read methodology
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </span>
        </Link>
      </section>

      {/* ── Footer Disclaimer ──────────────────────────────────────────────── */}
      <p className="flex items-start gap-2 text-[14px] text-ink-subtle pt-2">
        <CircleDollarSign className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        <span>
          Company dossiers compile verified public disclosures, SEC filings, and ledger receipts.
          Prediction market links may carry a referral fee; they never change published metrics.
          Nothing on this page is investment advice.
        </span>
      </p>
    </div>
  );
}
