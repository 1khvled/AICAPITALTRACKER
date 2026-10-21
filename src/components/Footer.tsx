import React from "react";
import Link from "next/link";
import { AdSlot } from "@/components/AdSlot";
import { CHANGELOG } from "@/lib/model/factors";
import { POLYMARKET_BASE_URL, POLYMARKET_REFERRAL_CODE } from "@/data/polymarket-data";

/**
 * Footer — the site directory. Every route stays reachable from here, which is
 * why the Navbar only has to carry five links.
 *
 * Plain-language copy on purpose: this is the block a first-time visitor reads
 * when they scroll to the bottom to orient themselves.
 *
 * Server component. Numbers arrive as props from the root layout so the model
 * engine is evaluated exactly once per request.
 */

export interface FooterProps {
  /** 12-month burst probability, 0-100. */
  burstProbability?: number;
  /** Count of sourced deals in the ledger. */
  dealCount?: number;
  /** Disclosed capital in trillions, e.g. "2.87". */
  totalDisclosedTrillions?: string;
}

const DIRECTORY: { title: string; links: { label: string; href: string; note?: string }[] }[] = [
  {
    title: "The read",
    links: [
      { label: "Verdict", href: "/", note: "12-month burst probability" },
      { label: "Will it burst?", href: "/will-the-ai-bubble-burst", note: "The 12-month outlook" },
      { label: "AI spending", href: "/how-much-is-being-spent-on-ai", note: "All $2.87T tracked" },
      { label: "AI debt", href: "/how-much-ai-debt-there-is", note: "Loans, bonds & refinancing" },
      { label: "Method", href: "/methodology", note: "Every formula and weight" },
      { label: "Guides", href: "/guides", note: "Plain-language explainers" },
      { label: "Glossary", href: "/glossary", note: "The vocabulary, defined" },
      { label: "2000 vs 2026", href: "/dotcom-vs-ai", note: "Dot-com bubble comparison" },
    ],
  },
  {
    title: "The data",
    links: [
      { label: "Ledger", href: "/ledger", note: "Every sourced AI deal" },
      { label: "Companies", href: "/companies", note: "Debt, revenue, multiples" },
      { label: "Markets", href: "/markets", note: "Live spreads and macro" },
      { label: "Prediction markets", href: "/prediction-markets", note: "What the crowd is pricing" },
      { label: "Charts", href: "/visualize", note: "Interactive figures" },
      { label: "Simulator", href: "/sandbox", note: "Change an input, see the result" },
      { label: "News", href: "/news", note: "Research wire" },
    ],
  },
  {
    title: "Yours",
    links: [
      { label: "Your call", href: "/your-call", note: "Score yourself against the model" },
    ],
  },
];

const API_ENDPOINTS = [
  { label: "GET /api/v1/model", href: "/api/v1/model" },
  { label: "GET /api/v1/deals", href: "/api/v1/deals" },
  { label: "GET /api/v1/factors", href: "/api/v1/factors" },
  { label: "GET /api/v1/news", href: "/api/v1/news" },
];

export function Footer({
  burstProbability,
  dealCount,
  totalDisclosedTrillions,
}: FooterProps) {
  const probability =
    typeof burstProbability === "number" && !Number.isNaN(burstProbability)
      ? `${burstProbability.toFixed(1)}%`
      : "n/a";
  const capital =
    // Fallback matches the 19 Oct 2026 ledger: $2,872,873,160,000 across 169
    // deals (src/data/deals.json) → 2.8728T → "2.87".
    typeof totalDisclosedTrillions === "string" ? totalDisclosedTrillions : "2.87";
  const deals = typeof dealCount === "number" ? dealCount : 169;

  return (
    <footer className="mt-16 border-t border-rule bg-surface text-[14px] text-ink-muted sm:mt-24">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6">
        {/* Site-wide billboard. Renders nothing until a zone script is set. */}
        <AdSlot placementId="global-footer-billboard" className="border-b border-rule py-8" />

        <div className="grid grid-cols-1 gap-10 py-12 sm:grid-cols-2 lg:grid-cols-4">
          {/* What this is */}
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded border border-rule-strong">
                <span className="font-mono text-[14px] font-bold text-ink">AI</span>
              </span>
              <span className="text-sm font-semibold tracking-tight text-ink">
                AI Capital Tracker
              </span>
            </div>
            <p className="mt-4 leading-relaxed">
              An independent research desk that reads the filings behind the AI
              spending boom and turns them into one number: the chance the
              bubble bursts within 12 months.
            </p>
            <dl className="mt-5 space-y-1.5 border-t border-rule pt-4">
              <div className="flex items-baseline justify-between gap-3">
                <dt className="label">Tracked deals</dt>
                <dd className="num text-[14px] text-ink">{deals}</dd>
              </div>
              <div className="flex items-baseline justify-between gap-3">
                <dt className="label">Disclosed capital</dt>
                <dd className="num text-[14px] text-ink">${capital}T</dd>
              </div>
              <div className="flex items-baseline justify-between gap-3">
                <dt className="label">12-mo burst odds</dt>
                <dd className="num text-[14px] text-ink">{probability}</dd>
              </div>
            </dl>
          </div>

          {/* Directory */}
          {DIRECTORY.map((column) => (
            <nav key={column.title} aria-label={column.title} className="min-w-0">
              <h2 className="label">{column.title}</h2>
              <ul className="mt-4 space-y-3">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="group block min-h-[44px] py-1 leading-snug transition-colors hover:text-ink"
                    >
                      <span className="font-medium text-ink underline decoration-rule underline-offset-4 group-hover:decoration-ink">
                        {link.label}
                      </span>
                      {link.note ? (
                        <span className="mt-0.5 block text-[14px] text-ink-subtle">{link.note}</span>
                      ) : null}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}

          {/* Developers + disclosure */}
          <div className="min-w-0">
            <h2 className="label">For developers</h2>
            <ul className="mt-4 space-y-3">
              <li>
                <Link href="/api" className="inline-flex min-h-[44px] items-center font-medium text-ink underline decoration-rule underline-offset-4 hover:decoration-ink">
                  API overview
                </Link>
                <span className="mt-0.5 block text-[14px] text-ink-subtle">
                  What the endpoints return
                </span>
              </li>
              <li>
                <Link href="/api-docs" className="font-medium text-ink underline decoration-rule underline-offset-4 hover:decoration-ink">
                  API documentation
                </Link>
                <span className="mt-0.5 block text-[14px] text-ink-subtle">
                  Endpoints, parameters, examples
                </span>
              </li>
            </ul>

            <h2 className="label mt-8">Endpoints</h2>
            <ul className="mt-4 space-y-2">
              {API_ENDPOINTS.map((endpoint) => (
                <li key={endpoint.href}>
                  <a
                    href={endpoint.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-[44px] items-center num text-[14px] text-ink-muted underline decoration-rule underline-offset-4 hover:text-ink hover:decoration-ink"
                  >
                    {endpoint.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Disclosure: we take a referral fee from prediction-market links. */}
        <div className="notice notice-caution">
          <p className="notice-title">Partner disclosure</p>
          <p className="mt-1.5">
            Some outbound links to prediction markets carry referral code{" "}
            <span className="num text-ink">{POLYMARKET_REFERRAL_CODE}</span>. Those
            links pay us a fee. They are marked, they are optional, and they never
            change the numbers on this site. See the{" "}
            <a
              href={POLYMARKET_BASE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-ink underline decoration-rule underline-offset-4 hover:decoration-ink"
            >
              prediction market
            </a>{" "}
            for the full terms.
          </p>
        </div>

        {/* Regulatory notice */}
        <div className="notice notice mt-4">
          <p className="notice-title">Not investment advice</p>
          <p className="mt-1.5">
            Every probability, fragility score and simulation here is an
            informational output computed from public SEC filings, market prices
            and prediction-market quotes as of October 2026. Nothing on this site
            is financial, investment, legal, tax or credit advice. Equity,
            credit and prediction-market positions can lose money. Do your own
            due diligence or talk to a licensed professional before you act.
          </p>
        </div>

        {/* Bottom rule */}
        <div className="flex flex-col gap-4 border-t border-rule py-6 text-[14px] sm:flex-row sm:items-center sm:justify-between">
          <p className="num text-ink-subtle">
            Data as of October 2026 · {deals} sourced deals · ${capital}T disclosed
          </p>
          <ul className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <li>
              <Link href="/methodology" className="hover:text-ink">
                Method
              </Link>
            </li>
            <li>
              <Link href="/api-docs" className="hover:text-ink">
                API
              </Link>
            </li>
            <li>
              <Link href="/news" className="hover:text-ink">
                News
              </Link>
            </li>
            <li className="num text-ink-subtle">v{CHANGELOG[0]?.version ?? "2.7.0"}</li>
          </ul>
        </div>
      </div>
    </footer>
  );
}

export default Footer;