import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen } from "lucide-react";
import { GUIDES } from "@/lib/guides";
import { evaluateBubbleModel, DEFAULT_MODEL_INPUTS } from "@/lib/model/engine";
import latestModel from "@/data/latest-model.json";

/**
 * /guides — the editorial layer.
 *
 * Three long-form explainers, each of which teaches the reader to read one
 * part of the site's own output: the model print, the credit complex, and the
 * deal ledger.
 *
 * Server component. The three cards come from the shared registry
 * (src/lib/guides/index.ts) so the index and the article headers cannot
 * drift apart, and the live print below them is evaluated by the model engine
 * at build time.
 */

const model = evaluateBubbleModel(DEFAULT_MODEL_INPUTS);

const SNAPSHOT_LABEL =
  new Date(latestModel.timestamp).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }) + " UTC";

export const metadata: Metadata = {
  title: "Guides — how to read AI bubble risks, credit stress and debt",
  description:
    "Three plain-language guides explaining how the bubble probability is calculated, how to read credit markets, and how to inspect the debt ledger.",
  keywords: [
    "AI bubble guides",
    "how to read AI bubble probability",
    "AI credit stress guide",
    "AI debt ledger guide",
    "Oracle CDS explained",
    "high yield OAS explained",
    "AI capital tracker methodology guide",
  ],
  alternates: {
    canonical: "/guides",
  },
  openGraph: {
    title: "Guides — how to read AI bubble risks, credit stress and debt",
    description:
      "Three plain-language guides explaining how the bubble probability is calculated, how to read credit markets, and how to inspect the debt ledger.",
    url: "/guides",
    type: "website",
    images: ["/opengraph-image.png"],
  },
};

export default function GuidesIndexPage() {
  return (
    <div className="section-sm">
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
          <span className="label">Guides</span>
          <span className="pill">{GUIDES.length} guides</span>
          <span className="num text-[14px] text-ink-faint">
            live print {model.burstProbability.toFixed(1)}% · composite{" "}
            {model.compositeScore.toFixed(1)}
          </span>
        </div>

        <h1 className="max-w-reading text-3xl font-bold tracking-tight text-ink sm:text-4xl">
          How to read this site&rsquo;s numbers
        </h1>

        <p className="prose prose-lead max-w-reading">
          Three guides, each one taking apart a single part of the published output: the model that
          produces the probability, the credit and rate series that feed it, and the ledger of{" "}
          <span className="num">169</span> sourced financings that everything else is built on.
        </p>

        <p className="max-w-reading panel p-3.5 border-l-2 border-l-ink text-[15px] leading-relaxed text-ink font-medium">
          Looking for a quick answer before reading the guides? See{" "}
          <Link href="/will-the-ai-bubble-burst" className="underline decoration-rule underline-offset-4 hover:decoration-ink">
            Will the AI bubble burst in the next 12 months?
          </Link>
          {" "}or inspect{" "}
          <Link href="/how-much-ai-debt-there-is" className="underline decoration-rule underline-offset-4 hover:decoration-ink">
            how much AI debt there is
          </Link>
          .
        </p>
      </div>

      {/* The three guides */}
      <section className="mt-8 grid grid-cols-1 gap-4 lg:grid-cols-3" aria-label="The guides">
        {GUIDES.map((guide, i) => (
          <article key={guide.slug} className="card flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <span className="num text-[13px] font-bold text-ink-faint">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="text-[13px] font-mono font-bold uppercase tracking-wider text-ink-muted">
                Guide
              </span>
              <span className="chip">{guide.readTime}</span>
            </div>

            <h2 className="text-lg font-bold leading-snug tracking-tight text-ink">
              <Link
                href={`/guides/${guide.slug}`}
                className="prose-a decoration-rule-strong hover:decoration-2"
              >
                {guide.title}
              </Link>
            </h2>

            <p className="text-[15px] leading-relaxed text-ink-muted">{guide.promise}</p>

            <div className="mt-auto border-t border-rule pt-3">
              <span className="label">The question it answers</span>
              <p className="mt-1 text-[14px] leading-relaxed text-ink-subtle">{guide.question}</p>
              <Link
                href={`/guides/${guide.slug}`}
                className="mt-3 inline-flex min-h-11 items-center gap-1 text-[14px] font-medium text-ink"
              >
                <span>Read the guide</span>
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            </div>
          </article>
        ))}
      </section>

      {/* The house rule, stated once */}
      <section className="mt-8 max-w-measure space-y-3" aria-labelledby="guides-sourcing">
        <h2 id="guides-sourcing" className="text-base font-bold tracking-tight text-ink">
          Where the numbers in these guides come from
        </h2>
        <p className="text-[15px] leading-relaxed text-ink-muted">
          Every figure in every guide is computed from this site&apos;s own published files at build
          time — the daily model artifact, the live input set, the deal ledger and the model engine
          itself. Nothing is transcribed by hand, nothing is estimated for the sake of a sentence,
          and where a number is not in the data it is not printed. Each guide ends with a{" "}
          <strong className="text-ink">what this is not</strong> panel, because the useful part of
          a number is knowing what it does not establish.
        </p>
        <dl className="grid grid-cols-1 gap-px overflow-hidden rounded-lg border border-rule bg-rule sm:grid-cols-3">
          <div className="bg-surface p-4">
            <dt className="label">Model artifact</dt>
            <dd className="num mt-1 text-[15px] font-semibold text-ink">
              v{latestModel.model_version} · {SNAPSHOT_LABEL}
            </dd>
          </div>
          <div className="bg-surface p-4">
            <dt className="label">Live print</dt>
            <dd className="num mt-1 text-[15px] font-semibold text-ink">
              {model.burstProbability.toFixed(1)}% · composite{" "}
              {model.compositeScore.toFixed(1)} · {model.band}
            </dd>
          </div>
          <div className="bg-surface p-4">
            <dt className="label">Open data</dt>
            <dd className="mt-1 text-[14px] text-ink-muted">
              <Link href="/api/v1/model" className="prose-a">
                /api/v1/model
              </Link>{" "}
              returns the same numbers this site renders.
            </dd>
          </div>
        </dl>
      </section>

      {/* Where to go next */}
      <section className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-3" aria-label="Related pages">
        <Link href="/methodology" className="card card-flush flex flex-col gap-1 p-4 transition-colors hover:border-rule-strong">
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

        <Link href="/ledger" className="card card-flush flex flex-col gap-1 p-4 transition-colors hover:border-rule-strong">
          <span className="label">The records</span>
          <span className="text-[15px] font-semibold text-ink">Every sourced deal</span>
          <span className="mt-1 text-[14px] text-ink-subtle">
            The ledger the third guide is about, searchable by company, type and year.
          </span>
          <span className="mt-2 flex items-center gap-1 text-[14px] font-medium text-ink">
            Open the ledger
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </span>
        </Link>

        <Link href="/api-docs" className="card card-flush flex flex-col gap-1 p-4 transition-colors hover:border-rule-strong">
          <span className="label">The data</span>
          <span className="text-[15px] font-semibold text-ink">Open endpoints</span>
          <span className="mt-1 text-[14px] text-ink-subtle">
            Model, factors, deals and sync telemetry, documented.
          </span>
          <span className="mt-2 flex items-center gap-1 text-[14px] font-medium text-ink">
            Open the API docs
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </span>
        </Link>
      </section>

      <p className="mt-8 flex items-start gap-2 text-[14px] leading-relaxed text-ink-subtle">
        <BookOpen className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        <span>
          These guides explain research published on this site. They are not investment advice and
          they do not forecast a price.
        </span>
      </p>
    </div>
  );
}
