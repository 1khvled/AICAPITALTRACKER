import React from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Clock } from "lucide-react";
import { guideHref, nextGuide, previousGuide, type GuideEntry } from "@/lib/guides";
import latestModel from "@/data/latest-model.json";

/**
 * The pager at the foot of every guide.
 *
 * The three guides read as one publication, so the foot of one of them has to
 * offer the other two - and has to say when the thing they were checked
 * against was published. This is the documentation-site pattern, hand-rolled:
 *
 *   - a real navigation region: a <nav> with a visually hidden "Pager" label,
 *     so it is announced as what it is;
 *   - two cards, one back and one forward, carrying `rel="prev"` and
 *     `rel="next"` so the relationship survives into the DOM;
 *   - a "last checked" line carrying the PUBLISHED snapshot date - the
 *     timestamp in src/data/latest-model.json, not the build clock. A guide
 *     is checked against a dated artifact, and the reader is told which one.
 *
 * ZERO CLS
 * The pager is rendered on the server, in the page, every time. It never
 * appears and disappears, so there is nothing to shift: its height is part of
 * the document from the first paint.
 */

/** The published snapshot, in the house format the methodology page uses. */
const SNAPSHOT_LABEL =
  new Date(latestModel.timestamp).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  }) + " UTC";

export function GuidePager({ current }: { current: GuideEntry }) {
  const previous = previousGuide(current.slug);
  const next = nextGuide(current.slug);

  return (
    <nav aria-labelledby="guide-pager-label" className="space-y-3">
      {/* The visually hidden name of the region. */}
      <span id="guide-pager-label" className="sr-only">
        Pager
      </span>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Link
          rel="prev"
          href={guideHref(previous.slug)}
          className="card card-flush flex flex-col gap-1 p-4 transition-colors hover:border-rule-strong"
        >
          <span className="label">
            Previous guide · {String(previous.order).padStart(2, "0")}
          </span>
          <span className="text-[15px] font-semibold leading-snug text-ink">
            {previous.title}
          </span>
          <span className="mt-1 text-[14px] leading-relaxed text-ink-subtle">
            {previous.question}
          </span>
          <span className="mt-2 inline-flex items-center gap-1 text-[13px] font-medium text-ink">
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            Read the previous guide
          </span>
        </Link>

        <Link
          rel="next"
          href={guideHref(next.slug)}
          className="card card-flush flex flex-col gap-1 p-4 transition-colors hover:border-rule-strong"
        >
          <span className="label">
            Next guide · {String(next.order).padStart(2, "0")}
          </span>
          <span className="text-[15px] font-semibold leading-snug text-ink">
            {next.title}
          </span>
          <span className="mt-1 text-[14px] leading-relaxed text-ink-subtle">
            {next.question}
          </span>
          <span className="mt-2 inline-flex items-center gap-1 text-[13px] font-medium text-ink">
            Read the next guide
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </span>
        </Link>
      </div>

      <p className="flex items-start gap-2 text-[13px] leading-relaxed text-ink-subtle">
        <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        <span>
          Last checked{" "}
          <time dateTime={latestModel.timestamp} className="num text-ink-muted">
            {SNAPSHOT_LABEL}
          </time>
          . That is the published model snapshot this guide was checked against &mdash; the dated
          artifact the figures come from, not the moment the page was built.
        </span>
      </p>
    </nav>
  );
}

export default GuidePager;
