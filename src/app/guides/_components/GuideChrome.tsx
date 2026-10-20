import React from "react";
import Link from "next/link";
import { ArrowRight, FileText, Scale } from "lucide-react";
import type { GuideEntry } from "@/lib/guides";
import { GuideReadingProgress } from "./GuideReadingProgress";

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Shared chrome for the /guides section.
 *
 * Four small pieces — a page header, a numbered section, the disclosure panel
 * the site uses everywhere ("what this is not") and the article footer — so
 * the three guides read as one publication rather than three unrelated pages.
 *
 * Server components. No state, no effects, no client JavaScript: every guide
 * is static HTML that a crawler, a reader with JavaScript switched off and a
 * print export all see identically.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export function GuideHeader({
  eyebrow,
  title,
  standfirst,
  readTime,
  meta,
}: {
  /** The section kicker above the H1, e.g. "Guide 01 · The model". */
  eyebrow: string;
  title: string;
  standfirst: string;
  readTime: string;
  /** Extra factual chips on the header row (dates, versions, counts). */
  meta: string[];
}) {
  return (
    <header className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
        <span className="label">Guides</span>
        <span className="pill">{eyebrow}</span>
        <span className="pill">{readTime}</span>
        {meta.map((m) => (
          <span key={m} className="num text-[14px] text-ink-faint">
            {m}
          </span>
        ))}
      </div>

      <h1 className="max-w-reading text-3xl font-bold tracking-tight text-ink sm:text-4xl">
        {title}
      </h1>

      <p className="prose prose-lead max-w-reading">{standfirst}</p>

      {/* The reading-progress rule: fixed to the top of the screen so it stays
          in view for the whole guide, and measured against the guide body. */}
      <GuideReadingProgress />
    </header>
  );
}

/** A numbered section. The kicker is a span, the section title is the H2. */
export function GuideSection({
  id,
  index,
  kicker,
  title,
  lead,
  children,
}: {
  id: string;
  index: number;
  /** Short section label for the mono kicker line. */
  kicker: string;
  /** The H2. */
  title: string;
  /** Optional one-line deck under the H2. */
  lead?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="space-y-5">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-rule pb-2">
        <span className="text-[13px] font-mono font-bold uppercase tracking-wider text-ink-muted">
          Section {String(index).padStart(2, "0")} · {kicker}
        </span>
      </div>
      <h2 className="text-xl font-bold tracking-tight text-ink sm:text-2xl">{title}</h2>
      {lead ? <p className="max-w-measure text-[15px] leading-relaxed text-ink-muted">{lead}</p> : null}
      {children}
    </section>
  );
}

/**
 * The disclosure panel. Every guide on this site ends its argument with the
 * things the argument is NOT — the site's house habit, and the reason a reader
 * can quote a guide without being misled.
 */
export function NotThisPanel({ items, title }: { items: string[]; title?: string }) {
  return (
    <div className="panel space-y-2.5">
      <span className="label">{title ?? "What this is not"}</span>
      <ul className="space-y-1.5 text-[14px] leading-relaxed text-ink-muted">
        {items.map((item) => (
          <li key={item}>• {item}</li>
        ))}
      </ul>
    </div>
  );
}

/**
 * The article footer: the method behind the claims, and the next guide.
 * Both links are block-level so the tap target is the whole card, not the
 * underline.
 */
export function GuideFooter({
  current,
  next,
}: {
  current: GuideEntry;
  next: GuideEntry;
}) {
  return (
    <section className="space-y-4" aria-label="Continue reading">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Link
          href="/methodology"
          className="card card-flush flex flex-col gap-1 p-4 transition-colors hover:border-rule-strong"
        >
          <span className="label">The method</span>
          <span className="text-[15px] font-semibold text-ink">Read the full specification</span>
          <span className="mt-1 text-[14px] text-ink-subtle">
            Weights, formulas, calibration anchors and the historical consistency table, written
            out in full.
          </span>
          <span className="mt-2 flex items-center gap-1 text-[14px] font-medium text-ink">
            Open the methodology
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </span>
        </Link>

        <Link
          href={`/guides/${next.slug}`}
          className="card card-flush flex flex-col gap-1 p-4 transition-colors hover:border-rule-strong"
        >
          <span className="label">Next guide</span>
          <span className="text-[15px] font-semibold text-ink">{next.title}</span>
          <span className="mt-1 text-[14px] text-ink-subtle">{next.question}</span>
          <span className="mt-2 flex items-center gap-1 text-[14px] font-medium text-ink">
            Read it next
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </span>
        </Link>
      </div>

      <p className="flex items-start gap-2 text-[14px] leading-relaxed text-ink-subtle">
        <FileText className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        <span>
          Every figure in this guide is computed from the site&apos;s own published files at build
          time. Nothing on this page is investment advice.
        </span>
      </p>
    </section>
  );
}

/** A small inline disclosure, matching the site's `details` pattern. */
export function GuideDisclosure({
  summary,
  children,
  tone = "",
}: {
  summary: string;
  children: React.ReactNode;
  tone?: "" | "notice-safe" | "notice-caution" | "notice-risk";
}) {
  return (
    <details className={tone ? `notice ${tone}` : "notice"}>
      <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-2 py-1 [&::-webkit-details-marker]:hidden">
        <span className="text-[14px] font-semibold text-ink">{summary}</span>
        <Scale className="h-4 w-4 shrink-0 text-ink-subtle" aria-hidden="true" />
      </summary>
      <div className="mt-2.5 border-t border-rule pt-2.5 text-[14px] leading-relaxed text-ink-muted">
        {children}
      </div>
    </details>
  );
}
