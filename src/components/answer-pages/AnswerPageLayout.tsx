import React from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, ExternalLink, ShieldCheck } from "lucide-react";
import { AdSlot } from "@/components/AdSlot";
import { POLYMARKET_REFERRAL_CODE } from "@/data/polymarket-data";

export interface AnswerPageLayoutProps {
  /** The natural search question typed by an ordinary person */
  question: string;
  /** Short category / pill label (e.g. "Outlook", "Capital", "Debt") */
  categoryLabel: string;
  /** As-of date string (e.g. "21 Oct 2026") */
  asOf: string | null;
  /** Primary bold answer statement displayed prominently before any chart */
  answerLead: string;
  /** Secondary plain-English context following the lead answer */
  answerContext?: string;
  /** Relevant Polymarket contracts to display for betting odds */
  polymarketContracts?: {
    question: string;
    probabilityPct: number;
    volumeDisplay: string;
    url: string;
  }[];
  /** Plain English "What this is not" list */
  notThisItems: string[];
  /** Page content: charts, tables, factor breakdowns */
  children: React.ReactNode;
}

export function AnswerPageLayout({
  question,
  categoryLabel,
  asOf,
  answerLead,
  answerContext,
  polymarketContracts,
  notThisItems,
  children,
}: AnswerPageLayoutProps) {
  return (
    <div className="section-sm space-y-10">
      {/* ── Breadcrumb & Wayfinding ────────────────────────────────────────── */}
      <nav aria-label="Breadcrumb">
        <Link
          href="/"
          className="inline-flex min-h-[44px] items-center gap-1.5 text-[14px] font-medium text-ink-muted transition-colors hover:text-ink focus:outline-hidden focus:underline"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          <span>Back to 12-month model overview</span>
        </Link>
      </nav>

      {/* ── Header & Primary Answer (BEFORE ANY CHART) ─────────────────────── */}
      <header className="space-y-4 max-w-4xl">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
          <span className="label">Plain answer</span>
          <span className="pill">{categoryLabel}</span>
          {asOf && (
            <span className="num text-[14px] text-ink-faint">Updated {asOf}</span>
          )}
          <span className="pill pill-safe">Receipt-backed</span>
        </div>

        <h1 className="text-[30px] font-bold leading-[1.08] tracking-[-0.03em] text-ink sm:text-[44px] sm:leading-[1.04]">
          {question}
        </h1>

        {/* The Answer in the first line */}
        <div className="panel border-l-2 border-l-ink p-5 space-y-2 rule-accent-left">
          <p className="label">The short answer</p>
          <p className="text-[17px] font-semibold leading-snug text-ink sm:text-[19px]">
            {answerLead}
          </p>
          {answerContext && (
            <p className="text-[15px] leading-relaxed text-ink-muted">
              {answerContext}
            </p>
          )}
        </div>
      </header>

      {/* ── Main Content: Charts & Tables ──────────────────────────────────── */}
      <main className="space-y-10 max-w-4xl">{children}</main>

      {/* ── Ad Slot (Reusing existing placement id) ────────────────────────── */}
      <div className="max-w-4xl">
        <AdSlot placementId="home-infeed-1" />
      </div>

      {/* ── Tradeable Prediction Contracts (Honest Affiliate) ──────────────── */}
      {polymarketContracts && polymarketContracts.length > 0 && (
        <section
          aria-labelledby="market-bets-heading"
          className="card card-flush shadow-card max-w-4xl"
        >
          <div className="card-header flex-wrap gap-x-4 gap-y-2">
            <div className="min-w-0">
              <p className="label">What money is betting</p>
              <h2
                id="market-bets-heading"
                className="mt-1 text-[16px] font-bold tracking-tight text-ink"
              >
                Tradeable prediction market contracts
              </h2>
            </div>
            <Link
              href="/prediction-markets"
              className="btn min-h-11 shrink-0 text-sm"
            >
              Full prediction board
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>

          <div className="px-4 py-4 space-y-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {polymarketContracts.map((contract) => (
                <a
                  key={contract.url}
                  href={contract.url}
                  target="_blank"
                  rel="noopener noreferrer sponsored"
                  className="panel block p-3.5 transition-all hover:border-ink focus:outline-hidden focus:ring-1 focus:ring-ink"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-[14px] font-semibold text-ink leading-snug">
                      {contract.question}
                    </p>
                    <ExternalLink className="h-3.5 w-3.5 shrink-0 text-ink-muted mt-0.5" aria-hidden="true" />
                  </div>
                  <div className="mt-2.5 flex items-baseline justify-between border-t border-rule pt-2">
                    <span className="text-[12px] uppercase font-semibold text-ink-faint">
                      Market price
                    </span>
                    <span className="num text-[16px] font-bold text-accent-strong dark:text-accent-ink">
                      {contract.probabilityPct.toFixed(1)}% YES
                    </span>
                  </div>
                  <div className="mt-0.5 text-right text-[12px] text-ink-subtle">
                    {contract.volumeDisplay} traded
                  </div>
                </a>
              ))}
            </div>

            <p className="mt-3 text-[13px] leading-relaxed text-ink-subtle">
              Outbound contract links carry our referral code (<strong className="font-mono text-ink">{POLYMARKET_REFERRAL_CODE}</strong>) and we may be paid a referral fee. Referral compensation never changes a published probability, data point, or editorial ranking on this site.
            </p>
          </div>
        </section>
      )}

      {/* ── What This Is Not Panel ─────────────────────────────────────────── */}
      <section
        aria-labelledby="not-this-heading"
        className="panel max-w-4xl space-y-3"
      >
        <p id="not-this-heading" className="label">
          What this number is not
        </p>
        <ul className="space-y-2 text-[15px] leading-relaxed text-ink-muted">
          {notThisItems.map((item, index) => (
            <li key={index} className="flex items-start gap-2">
              <span className="text-ink-faint select-none font-bold" aria-hidden="true">&bull;</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* ── Ad Slot 2 (Second in-feed placement, natural break before deep research) ── */}
      <div className="max-w-4xl">
        <AdSlot placementId="visualize-infeed" />
      </div>

      {/* ── Deeper Research Links ──────────────────────────────────────────── */}
      <section aria-labelledby="deep-links-heading" className="max-w-4xl space-y-3">
        <h2 id="deep-links-heading" className="label">
          Deeper research &amp; methodology
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
          <Link
            href="/ledger"
            className="card card-flush card-lift p-3.5 transition-shadow hover:shadow-raised"
          >
            <span className="text-[14px] font-semibold text-ink flex items-center justify-between">
              The Ledger
              <ArrowRight className="h-3.5 w-3.5 text-ink-muted shrink-0" aria-hidden="true" />
            </span>
            <span className="mt-1 block text-[13px] text-ink-subtle">
              169 verified AI deals with filings and source documents
            </span>
          </Link>

          <Link
            href="/companies"
            className="card card-flush card-lift p-3.5 transition-shadow hover:shadow-raised"
          >
            <span className="text-[14px] font-semibold text-ink flex items-center justify-between">
              Company Dossiers
              <ArrowRight className="h-3.5 w-3.5 text-ink-muted shrink-0" aria-hidden="true" />
            </span>
            <span className="mt-1 block text-[13px] text-ink-subtle">
              22 profiles tracking debt tranches, multiples and circular ties
            </span>
          </Link>

          <Link
            href="/methodology"
            className="card card-flush card-lift p-3.5 transition-shadow hover:shadow-raised"
          >
            <span className="text-[14px] font-semibold text-ink flex items-center justify-between">
              Methodology
              <ArrowRight className="h-3.5 w-3.5 text-ink-muted shrink-0" aria-hidden="true" />
            </span>
            <span className="mt-1 block text-[13px] text-ink-subtle">
              All 9 quantitative factor formulas, weights and stress tests
            </span>
          </Link>

          <Link
            href="/prediction-markets"
            className="card card-flush card-lift p-3.5 transition-shadow hover:shadow-raised"
          >
            <span className="text-[14px] font-semibold text-ink flex items-center justify-between">
              Prediction Markets
              <ArrowRight className="h-3.5 w-3.5 text-ink-muted shrink-0" aria-hidden="true" />
            </span>
            <span className="mt-1 block text-[13px] text-ink-subtle">
              What money on Polymarket is betting on AI timelines
            </span>
          </Link>
        </div>
      </section>
    </div>
  );
}
