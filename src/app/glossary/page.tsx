import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen, Scale } from "lucide-react";
import { GLOSSARY_TERMS } from "@/lib/glossary/terms";
import GlossaryBrowser from "./_components/GlossaryBrowser";

/**
 * /glossary — the vocabulary reference.
 *
 * A searchable, linkable index of every term this site uses without defining
 * it. The registry lives in src/lib/glossary/terms.ts and is handed to the
 * client browser as a prop, so this page stays a server component and the
 * term data is rendered once.
 *
 * The house rule for this page is the same one the guides follow: say what the
 * thing is, say what it is not, and never print a number that is not
 * computed.
 */

const TERM_COUNT = GLOSSARY_TERMS.length;

export const metadata: Metadata = {
  title: "Glossary — the vocabulary behind the AI bubble model",
  description:
    "Plain definitions for every term this site uses: credit default swaps, high-yield spreads, circular financing, GPU depreciation drag, Minsky regimes, CAPE, prediction-market odds and the rest. Searchable, and every entry has a stable link.",
  keywords: [
    "AI bubble glossary",
    "credit default swap explained",
    "CDS spread meaning",
    "circular financing explained",
    "GPU depreciation drag",
    "Minsky hedge speculative ponzi",
    "CAPE ratio explained",
    "high yield OAS explained",
    "distance to default Merton",
    "Altman Z score explained",
    "convertible note meaning",
    "prediction market odds explained",
    "AI bubble definition",
  ],
  alternates: {
    canonical: "/glossary",
  },
  openGraph: {
    title: "Glossary | AI Capital Tracker",
    description:
      "Every term this site uses, defined once in plain language, with a stable link to each entry.",
    url: "/glossary",
    type: "website",
    images: ["/opengraph-image.png"],
  },
};

export default function GlossaryPage() {
  return (
    <div className="section-sm">
      {/* ── Header ───────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
          <span className="label">Glossary</span>
          <span className="pill">{TERM_COUNT} terms</span>
          <span className="num text-[14px] text-ink-faint">
            A–Z · searchable · every entry has a stable link
          </span>
        </div>

        <h1 className="max-w-reading text-3xl font-bold tracking-tight text-ink sm:text-4xl">
          The vocabulary behind the numbers
        </h1>

        <p className="prose prose-lead max-w-reading">
          Every term this site uses, defined once and in plain language — so a reader who lands
          on a chart without reading the method can still know what the words on it mean. Search
          it, or jump from one definition to the next.
        </p>
      </div>

      {/* ── The glossary ──────────────────────────────────────────────────── */}
      <div className="mt-8">
        <GlossaryBrowser terms={GLOSSARY_TERMS} />
      </div>

      {/* ── How the site uses these terms ─────────────────────────────────── */}
      <section className="mt-12 max-w-measure space-y-3" aria-labelledby="glossary-usage">
        <h2 id="glossary-usage" className="text-base font-bold tracking-tight text-ink">
          How this site uses these terms
        </h2>
        <p className="text-[15px] leading-relaxed text-ink-muted">
          A glossary is only useful if the definitions are honest about their own status. Three
          rules govern every entry here, and they are worth stating before you read a single
          one.
        </p>
        <div className="panel space-y-2.5">
          <span className="label">The three rules</span>
          <ul className="space-y-1.5 text-[14px] leading-relaxed text-ink-muted">
            <li>
              • <strong className="text-ink">The definition is the standard one.</strong> Where a
              term has an established meaning in finance or technology, that is the meaning given
              here — not a house version invented to flatter the model.
            </li>
            <li>
              •{" "}
              <strong className="text-ink">Where the site uses a term in a specific way, the
              entry says so</strong> and names the file or the published formula it comes from.
              Every claim on this page is traceable to something this site publishes.
            </li>
            <li>
              • <strong className="text-ink">No live values.</strong> The glossary quotes no
              prints and no current numbers, because the prints move every day and a definition
              that quoted them would be wrong by tomorrow. Every live figure lives on the page
              that owns it.
            </li>
          </ul>
        </div>
      </section>

      {/* ── What this is not ──────────────────────────────────────────────── */}
      <div className="notice mt-8 max-w-measure not-this-body">
        <p className="notice-title">What this glossary is not</p>
        <ul className="mt-2 space-y-1.5 text-[14px] leading-relaxed text-ink-muted">
          <li>
            • Not a glossary of the AI industry. It covers the vocabulary of this site&apos;s
            analysis and nothing else — no product terms, no model families, no company
            shorthand.
          </li>
          <li>
            • Not a source of live figures. The probability, the spreads, the multiples and the
            ledger totals are on their own pages, computed from the daily feed.
          </li>
          <li>
            • Not investment advice, and not a forecast. A definition explains what a number
            means; it never says what the number will do.
          </li>
        </ul>
      </div>

      {/* ── Where to go next ──────────────────────────────────────────────── */}
      <section className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2" aria-label="Related pages">
        <Link
          href="/methodology"
          className="card card-flush flex flex-col gap-1 p-4 transition-colors hover:border-rule-strong"
        >
          <span className="label">The method</span>
          <span className="text-[15px] font-semibold text-ink">Full model specification</span>
          <span className="mt-1 text-[14px] text-ink-subtle">
            The weights, the formulas and the failure cases, written out.
          </span>
          <span className="mt-2 flex items-center gap-1 text-[14px] font-medium text-ink">
            Open the methodology
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </span>
        </Link>

        <Link
          href="/guides"
          className="card card-flush flex flex-col gap-1 p-4 transition-colors hover:border-rule-strong"
        >
          <span className="label">The guides</span>
          <span className="text-[15px] font-semibold text-ink">How to read this site&apos;s numbers</span>
          <span className="mt-1 text-[14px] text-ink-subtle">
            Three long-form explainers for the model print, the credit complex and the debt
            ledger.
          </span>
          <span className="mt-2 flex items-center gap-1 text-[14px] font-medium text-ink">
            Open the guides
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </span>
        </Link>
      </section>

      <p className="mt-8 flex max-w-measure items-start gap-2 text-[14px] leading-relaxed text-ink-subtle">
        <BookOpen className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        <span>
          The glossary is part of this site&apos;s published research. It is not investment advice
          and it does not forecast a price.
        </span>
      </p>

      <p className="mt-3 flex max-w-measure items-start gap-2 text-[14px] leading-relaxed text-ink-subtle">
        <Scale className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        <span>
          Each entry carries the file or the published formula it is drawn from, so a reader can
          check the definition against the model that uses it.
        </span>
      </p>
    </div>
  );
}
