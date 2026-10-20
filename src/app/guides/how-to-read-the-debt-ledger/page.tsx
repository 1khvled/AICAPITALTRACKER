import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import {
  deals,
  ledgerStats,
  formatTotal,
  type Deal,
} from "@/app/ledger/_components/ledgerData";
import { MODEL_FACTORS } from "@/lib/model/factors";
import { evaluateBubbleModel, DEFAULT_MODEL_INPUTS } from "@/lib/model/engine";
import { getGuide, nextGuide } from "@/lib/guides";
import { GuideToc } from "@/components/GuideToc";
import { GUIDE_SECTIONS } from "@/lib/guides/sections";
import {
  GuideHeader,
  GuideSection,
  GuideFooter,
  GuideDisclosure,
  NotThisPanel,
} from "../_components/GuideChrome";
import { GuidePager } from "../_components/GuidePager";
import latestModel from "@/data/latest-model.json";

/**
 * Guide 03 — how to read the AI debt ledger.
 *
 * Server component. Every aggregate on this page is recomputed from
 * src/data/deals.json at build time, and the factor reading is taken from the
 * live engine. The ledger is the site's evidentiary base, so the guide shows
 * the arithmetic rather than quoting the answers.
 */

const guide = getGuide("how-to-read-the-debt-ledger")!;
const next = nextGuide(guide.slug);

const stats = ledgerStats();

/** Sum helper that treats a missing amount as zero. */
const sumAmounts = (list: Deal[]) =>
  list.reduce((acc, d) => acc + (d.amount_usd || 0), 0);

// ── The aggregates, recomputed from the file ─────────────────────────────────
const totalDisclosedUsd = sumAmounts(deals);
const debtDeals = deals.filter((d) => d.is_debt);
const computeDeals = deals.filter((d) => d.is_compute);
const circularDeals = deals.filter((d) => d.is_circular);
const topTenDeals = [...deals].sort((a, b) => b.amount_usd - a.amount_usd).slice(0, 10);

const debtTotalUsd = sumAmounts(debtDeals);
const computeTotalUsd = sumAmounts(computeDeals);
const circularTotalUsd = sumAmounts(circularDeals);
const topTenTotalUsd = sumAmounts(topTenDeals);

const share = (part: number, whole: number) => (whole > 0 ? part / whole : 0);

// ── The two announced statuses ───────────────────────────────────────────────
// ── The two announced statuses ───────────────────────────────────────────────
const byYear = Array.from(new Set(deals.map((d) => d.year)))
  .filter((y): y is number => typeof y === "number")
  .sort((a, b) => a - b)
  .map((year) => {
    const rows = deals.filter((d) => d.year === year);
    return { year, count: rows.length, usd: sumAmounts(rows) };
  });
const heaviestYear = byYear.reduce((a, b) => (b.usd > a.usd ? b : a), byYear[0]);

const largestDebtFacilities = [...debtDeals].sort((a, b) => b.amount_usd - a.amount_usd).slice(0, 5);

/** Coarse instrument classification, read from the facility title. */
function instrumentKind(title: string): string {
  if (/convertible/i.test(title)) return "convertible note";
  if (/bond|notes/i.test(title)) return "bond sale";
  if (/facility|term loan|revolving/i.test(title)) return "bank facility";
  return "other facility";
}
const largestDebtKinds = (() => {
  const counts = new Map<string, number>();
  for (const d of largestDebtFacilities) {
    const kind = instrumentKind(d.title);
    counts.set(kind, (counts.get(kind) ?? 0) + 1);
  }
  return Array.from(counts.entries()).map(([kind, n]) => `${n} ${kind}${n > 1 ? "s" : ""}`);
})();

const debtFlagOutsideBorrowedCategory = debtDeals.filter((d) => d.category !== "Borrowed");
const borrowedCategoryWithoutDebtFlag = deals.filter(
  (d) => d.category === "Borrowed" && !d.is_debt,
);

const announcedFamily = deals.filter((d) => d.status.toLowerCase().includes("announced"));
const announcedNotDone = deals.filter((d) => d.status === "Announced, not done");
const announcedOnly = deals.filter((d) => d.status === "Announced");
const announcedFamilyUsd = sumAmounts(announcedFamily);
const largestAnnounced = [...announcedFamily].sort((a, b) => b.amount_usd - a.amount_usd)[0];
const undisclosedAnnounced = announcedFamily.filter((d) => !d.amount_usd).length;

// The pipeline's own backlog share is a COUNT share, not a dollar share.
const backlogCountShare = deals.length > 0 ? announcedFamily.length / deals.length : 0;
const backlogDollarShare = share(announcedFamilyUsd, totalDisclosedUsd);

// ── Records that carry no price, and records that fell through ──────────────
const undisclosed = deals.filter((d) => !d.amount_usd);
const cancelled = deals.filter((d) => d.status === "Cancelled");
const disputed = deals.filter((d) => d.status === "Disputed");
const cancelledUsd = sumAmounts(cancelled);

// ── Where the receipts come from ─────────────────────────────────────────────
const sourceTypes = Array.from(new Set(deals.map((d) => d.source_type))).map((type) => {
  const rows = deals.filter((d) => d.source_type === type);
  return { type, count: rows.length, usd: sumAmounts(rows) };
});
sourceTypes.sort((a, b) => b.count - a.count);

const sourceCountBuckets = [
  { label: "1 source", n: deals.filter((d) => d.sources_count === 1).length },
  { label: "2 sources", n: deals.filter((d) => d.sources_count === 2).length },
  { label: "3 sources", n: deals.filter((d) => d.sources_count === 3).length },
  { label: "4 or more", n: deals.filter((d) => d.sources_count >= 4).length },
];

// ── What the model does with the debt share ─────────────────────────────────
const debtFactor = MODEL_FACTORS.find((f) => f.id === "debt_reliance");
const debtContribution = evaluateBubbleModel(DEFAULT_MODEL_INPUTS).contributions.find(
  (c) => c.id === "debt_reliance",
);
const averageSourcesPerRecord = stats.sourceCount / deals.length;

const SNAPSHOT_LABEL =
  new Date(latestModel.timestamp).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }) + " UTC";

export const metadata: Metadata = {
  title: "How to read the AI debt ledger",
  description:
    "What a verified facility record contains, what \"announced, not done\" means, why the debt share is computed on a curated sample, and how to spot a number that is not receipt-backed.",
  keywords: [
    "AI debt ledger explained",
    "how to read AI deal records",
    "announced not done AI deals",
    "AI debt share 7.5 percent",
    "circular financing ledger",
    "AI capital tracker ledger method",
  ],
  alternates: {
    canonical: "/guides/how-to-read-the-debt-ledger",
  },
  openGraph: {
    title: "How to read the AI debt ledger | AI Capital Tracker",
    description:
      "What a verified facility record contains, why the debt share is a share of disclosed capital, and how to spot a number that is not receipt-backed.",
    url: "/guides/how-to-read-the-debt-ledger",
    type: "article",
    images: ["/opengraph-image.png"],
  },
};

export default function DebtLedgerGuidePage() {
  return (
    <div className="section-sm">
      <GuideHeader
        eyebrow="Guide 03 · The ledger"
        title={guide.title}
        standfirst={guide.standfirst}
        readTime={guide.readTime}
        meta={[`${deals.length} records`, `snapshot ${SNAPSHOT_LABEL}`]}
      />

      {/* The navigation layer: a sticky, scroll-spy contents with a deep link
          per section, so a reader who lands here from a search result can see
          the shape of the argument before committing to it. */}
      <GuideToc sections={GUIDE_SECTIONS["how-to-read-the-debt-ledger"]} />

      <div className="mt-8 space-y-10">
        {/* ── SECTION 01 ─────────────────────────────────────────────────── */}
        <GuideSection
          id="anatomy"
          index={1}
          kicker="The record"
          title="What a verified facility record contains"
          lead="Every row in the ledger is the same shape. Knowing which fields are extracted from a filing and which are editorial is the difference between reading the ledger and being misled by it."
        >
          <div className="overflow-x-auto rounded-xl border border-rule">
            <table className="w-full text-left text-[14px]">
              <caption className="sr-only">
                The fields of a ledger record, what each one contains and whether it is extracted
                from a receipt or maintained by the research desk.
              </caption>
              <thead className="bg-surface-2 text-ink-subtle">
                <tr>
                  <th scope="col" className="p-3 font-medium">
                    Field
                  </th>
                  <th scope="col" className="p-3 font-medium">
                    What it holds
                  </th>
                  <th scope="col" className="p-3 font-medium">
                    Where it comes from
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-rule">
                <tr>
                  <th scope="row" className="p-3 font-semibold text-ink">
                    title, description
                  </th>
                  <td className="p-3 text-ink-muted">
                    The transaction in plain language, with the size, the instrument and the
                    counterparty spelled out.
                  </td>
                  <td className="p-3 text-ink-muted">
                    Written from the receipt. This is a summary, not a quotation.
                  </td>
                </tr>
                <tr>
                  <th scope="row" className="p-3 font-semibold text-ink">
                    source_type
                  </th>
                  <td className="p-3 text-ink-muted">
                    Which kind of receipt the record rests on: a regulatory filing, a verified
                    press report, or a verified announcement.
                  </td>
                  <td className="p-3 text-ink-muted">
                    The sourcing rule, applied at entry.
                  </td>
                </tr>
                <tr>
                  <th scope="row" className="p-3 font-semibold text-ink">
                    amount_usd, amount_display
                  </th>
                  <td className="p-3 text-ink-muted">
                    The disclosed figure in US dollars, and the figure as the parties stated it.
                  </td>
                  <td className="p-3 text-ink-muted">
                    The receipt. When no figure was disclosed, the amount is zero and the display
                    reads &quot;Not disclosed&quot; &mdash; never an estimate.
                  </td>
                </tr>
                <tr>
                  <th scope="row" className="p-3 font-semibold text-ink">
                    status, announced_date
                  </th>
                  <td className="p-3 text-ink-muted">
                    Where the transaction has got to, and when it was announced.
                  </td>
                  <td className="p-3 text-ink-muted">
                    The receipt, checked against later filings for cancellations and disputes.
                  </td>
                </tr>
                <tr>
                  <th scope="row" className="p-3 font-semibold text-ink">
                    is_debt, is_compute, is_mega
                  </th>
                  <td className="p-3 text-ink-muted">
                    Whether the money is borrowed, whether it is a capacity commitment, and whether
                    it is a $10B-plus deal.
                  </td>
                  <td className="p-3 text-ink-muted">
                    Classification rules applied by the desk to the instrument named in the filing.
                  </td>
                </tr>
                <tr>
                  <th scope="row" className="p-3 font-semibold text-ink">
                    is_circular
                  </th>
                  <td className="p-3 text-ink-muted">
                    Whether the same money effectively funds a customer who then spends it back
                    with the vendor or its partner.
                  </td>
                  <td className="p-3 text-ink-muted">
                    Maintained by hand from the tracked relationships. This is an editorial
                    judgement, not an extracted field.
                  </td>
                </tr>
                <tr>
                  <th scope="row" className="p-3 font-semibold text-ink">
                    sources_count
                  </th>
                  <td className="p-3 text-ink-muted">
                    How many independent sources back the record.
                  </td>
                  <td className="p-3 text-ink-muted">
                    The receipt count at entry.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="max-w-measure space-y-4 text-[15px] leading-relaxed text-ink-muted">
            <p>
              The row you are most likely to meet is the deal with no price in it. There are{" "}
              <span className="num font-semibold text-ink">{undisclosed.length}</span> such records
              in the ledger today &mdash; a Meta nuclear request for proposals, a proposed
              acquisition with terms unannounced, a FERC order. They are in the ledger because the
              event is real and citable; they carry no amount, and they contribute nothing to any
              total.
            </p>
          </div>
        </GuideSection>

        {/* ── SECTION 02 ─────────────────────────────────────────────────── */}
        <GuideSection
          id="aggregates"
          index={2}
          kicker="The arithmetic"
          title="The four aggregates, recomputed from the file"
          lead="The ledger publishes four ratios and they are all the same shape: a subset of records divided by the total of every disclosed amount. The subset is where the judgement lives."
        >
          <div className="overflow-x-auto rounded-xl border border-rule">
            <table className="w-full text-left text-[14px]">
              <caption className="sr-only">
                The four published ledger aggregates: the records that make each one up, the dollar
                amount and the share of disclosed capital.
              </caption>
              <thead className="bg-surface-2 text-ink-subtle">
                <tr>
                  <th scope="col" className="p-3 font-medium">
                    Aggregate
                  </th>
                  <th scope="col" className="p-3 text-right font-medium">
                    Records
                  </th>
                  <th scope="col" className="p-3 text-right font-medium">
                    Amount
                  </th>
                  <th scope="col" className="p-3 text-right font-medium">
                    Share of disclosed
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-rule">
                <tr>
                  <th scope="row" className="p-3 font-semibold text-ink">
                    Total disclosed capital
                  </th>
                  <td className="num p-3 text-right text-ink-muted">{deals.length}</td>
                  <td className="num p-3 text-right font-semibold text-ink">
                    {formatTotal(totalDisclosedUsd)}
                  </td>
                  <td className="num p-3 text-right text-ink-muted">100%</td>
                </tr>
                <tr>
                  <th scope="row" className="p-3 font-semibold text-ink">
                    Debt facilities
                  </th>
                  <td className="num p-3 text-right text-ink-muted">{debtDeals.length}</td>
                  <td className="num p-3 text-right font-semibold text-ink">
                    {formatTotal(debtTotalUsd)}
                  </td>
                  <td className="num p-3 text-right font-semibold text-caution-700">
                    {(share(debtTotalUsd, totalDisclosedUsd) * 100).toFixed(1)}%
                  </td>
                </tr>
                <tr>
                  <th scope="row" className="p-3 font-semibold text-ink">
                    Compute-capacity contracts
                  </th>
                  <td className="num p-3 text-right text-ink-muted">{computeDeals.length}</td>
                  <td className="num p-3 text-right font-semibold text-ink">
                    {formatTotal(computeTotalUsd)}
                  </td>
                  <td className="num p-3 text-right font-semibold text-ink-muted">
                    {(share(computeTotalUsd, totalDisclosedUsd) * 100).toFixed(1)}%
                  </td>
                </tr>
                <tr>
                  <th scope="row" className="p-3 font-semibold text-ink">
                    Circular money
                  </th>
                  <td className="num p-3 text-right text-ink-muted">{circularDeals.length}</td>
                  <td className="num p-3 text-right font-semibold text-ink">
                    {formatTotal(circularTotalUsd)}
                  </td>
                  <td className="num p-3 text-right text-ink-muted">
                    {(share(circularTotalUsd, totalDisclosedUsd) * 100).toFixed(1)}%
                  </td>
                </tr>
                <tr>
                  <th scope="row" className="p-3 font-semibold text-ink">
                    Ten largest deals
                  </th>
                  <td className="num p-3 text-right text-ink-muted">{topTenDeals.length}</td>
                  <td className="num p-3 text-right font-semibold text-ink">
                    {formatTotal(topTenTotalUsd)}
                  </td>
                  <td className="num p-3 text-right font-semibold text-ink-muted">
                    {(share(topTenTotalUsd, totalDisclosedUsd) * 100).toFixed(1)}%
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="max-w-measure space-y-4 text-[15px] leading-relaxed text-ink-muted">
            <p>
              Each share is the same calculation with a different subset: the sum of the disclosed
              amounts of the flagged records, divided by the sum of the disclosed amounts of all{" "}
              {deals.length} records. Nothing is weighted, nothing is annualised, nothing is
              converted to a net figure. The concentration number is worth pausing on: the ten
              largest records account for{" "}
              <span className="num font-semibold text-ink">
                {(share(topTenTotalUsd, totalDisclosedUsd) * 100).toFixed(1)}%
              </span>{" "}
              of everything the ledger has priced, which is the single most important structural
              fact about the dataset. It is a small number of enormous transactions, not a broad
              market.
            </p>
            <p>
              The largest single record is{" "}
              <span className="num font-semibold text-ink">
                {stats.largest?.display ?? "—"}
              </span>
              , and the ledger spans {stats.firstYear} to {stats.lastYear}. Across{" "}
              {stats.entityCount} identified entities and {stats.sourceCount} counted sources, the
              average record rests on{" "}
              <span className="num font-semibold text-ink">
                {(stats.sourceCount / deals.length).toFixed(1)}
              </span>{" "}
              sources.
            </p>
          </div>

          <div className="overflow-x-auto rounded-xl border border-rule">
            <table className="w-full text-left text-[14px]">
              <caption className="sr-only">
                Disclosed capital by announcement year: the number of records and the total
                disclosed amount.
              </caption>
              <thead className="bg-surface-2 text-ink-subtle">
                <tr>
                  <th scope="col" className="p-3 font-medium">
                    Year
                  </th>
                  <th scope="col" className="p-3 text-right font-medium">
                    Records
                  </th>
                  <th scope="col" className="p-3 text-right font-medium">
                    Disclosed
                  </th>
                  <th scope="col" className="p-3 text-right font-medium">
                    Share of ledger
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-rule">
                {byYear.map((row) => (
                  <tr key={row.year}>
                    <th scope="row" className="num p-3 font-semibold text-ink">
                      {row.year}
                    </th>
                    <td className="num p-3 text-right text-ink-muted">{row.count}</td>
                    <td className="num p-3 text-right font-semibold text-ink">
                      {formatTotal(row.usd)}
                    </td>
                    <td className="num p-3 text-right text-ink-muted">
                      {(share(row.usd, totalDisclosedUsd) * 100).toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="max-w-measure space-y-4 text-[15px] leading-relaxed text-ink-muted">
            <p>
              The year split is the most useful shape in the dataset, because it tells you how
              fast the book grew. The heaviest single year, {heaviestYear?.year}, carries{" "}
              <span className="num font-semibold text-ink">
                {(share(heaviestYear?.usd ?? 0, totalDisclosedUsd) * 100).toFixed(1)}%
              </span>{" "}
              of the disclosed total on its own, from {heaviestYear?.count} records, and the
              ledger&apos;s dollar weight is heavily concentrated in the years since 2024. A reader
              who takes a five-year average, or who treats the ledger as a steady flow, will
              misread the shape of the build-out completely.
            </p>
          </div>
        </GuideSection>

        {/* ── SECTION 03 ─────────────────────────────────────────────────── */}
        <GuideSection
          id="announced"
          index={3}
          kicker="The statuses"
          title="What &quot;announced, not done&quot; means, and the 10.1% that is not a dollar share"
          lead="Two statuses in this ledger describe money that has been promised but not yet handed over. The model&apos;s backlog figure counts them by record, not by dollars, and the difference is large."
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="panel space-y-2">
              <span className="label">Announced</span>
              <p className="num text-[15px] font-semibold text-ink">
                {announcedOnly.length} records · {formatTotal(sumAmounts(announcedOnly))}
              </p>
              <p className="text-[14px] leading-relaxed text-ink-muted">
                Terms disclosed, money not yet moved. The largest unclosed number in the ledger
                sits here, at {largestAnnounced?.amount_display ?? "—"}.
              </p>
            </div>
            <div className="panel space-y-2">
              <span className="label">Announced, not done</span>
              <p className="num text-[15px] font-semibold text-ink">
                {announcedNotDone.length} records · {formatTotal(sumAmounts(announcedNotDone))}
              </p>
              <p className="text-[14px] leading-relaxed text-ink-muted">
                Promised and not yet completed, with the transaction itself still ahead. Two of
                these records carry no disclosed figure at all.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-rule">
            <table className="w-full text-left text-[14px]">
              <caption className="sr-only">
                Every record in the ledger with the status announced, not done: its identifier,
                disclosed amount and source type.
              </caption>
              <thead className="bg-surface-2 text-ink-subtle">
                <tr>
                  <th scope="col" className="p-3 font-medium">
                    Record
                  </th>
                  <th scope="col" className="p-3 font-medium">
                    Transaction
                  </th>
                  <th scope="col" className="p-3 text-right font-medium">
                    Amount
                  </th>
                  <th scope="col" className="p-3 font-medium">
                    Receipt
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-rule">
                {announcedNotDone.map((d) => (
                  <tr key={d.id} className="align-top">
                    <th scope="row" className="num p-3 font-semibold text-ink">
                      {d.id}
                    </th>
                    <td className="p-3 text-ink-muted">{d.title}</td>
                    <td className="num p-3 text-right font-semibold text-ink">
                      {d.amount_display}
                    </td>
                    <td className="p-3 text-ink-muted">{d.source_type}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="max-w-measure space-y-4 text-[15px] leading-relaxed text-ink-muted">
            <p>
              Now the number the model prints. The funding-velocity factor reports a{" "}
              <span className="num font-semibold text-ink">
                {(backlogCountShare * 100).toFixed(1)}%
              </span>{" "}
              backlog, and it is tempting to read that as a share of capital still to come. It is
              not. It is{" "}
              <span className="num font-semibold text-ink">
                {announcedFamily.length} of {deals.length}
              </span>{" "}
              records &mdash; a count, not a dollar amount. Measured in money, the announced
              family is{" "}
              <span className="num font-semibold text-ink">
                {formatTotal(announcedFamilyUsd)}
              </span>
              , or{" "}
              <span className="num font-semibold text-ink">
                {(backlogDollarShare * 100).toFixed(1)}%
              </span>{" "}
              of disclosed capital. A reader who carries the count version into a dollar question
              will be wrong by a wide margin, which is why this guide puts it in writing.
            </p>
            <p>
              The reason for the difference is the shape of the announced family: it contains both
              a {largestAnnounced?.amount_display ?? "—"} letter of intent and{" "}
              {undisclosedAnnounced} records with no price at all. A count treats those{" "}
              {undisclosedAnnounced + 1} records the same way.
            </p>
          </div>
        </GuideSection>

        {/* ── SECTION 04 ─────────────────────────────────────────────────── */}
        <GuideSection
          id="debt-share"
          index={4}
          kicker="The ratio"
          title="Why the debt share is a share of disclosed capital"
          lead="7.5% is a precise number with a narrow denominator. Knowing what sits outside that denominator is the difference between using it and misusing it."
        >
          <div className="max-w-measure space-y-4 text-[15px] leading-relaxed text-ink-muted">
            <p>
              The numerator is {debtDeals.length} records flagged as borrowed money, totalling{" "}
              <span className="num font-semibold text-ink">{formatTotal(debtTotalUsd)}</span>. The
              denominator is every disclosed dollar in the ledger,{" "}
              <span className="num font-semibold text-ink">{formatTotal(totalDisclosedUsd)}</span>
              , which includes equity rounds, compute contracts, power and land, construction and
              acquisitions. Three consequences follow, and all three cut in the same direction.
            </p>
            <p>
              First, the denominator is a curated sample. It is capital this site could find a
              receipt for, not capital that exists. Private balance-sheet borrowing that was never
              disclosed, retained earnings and vendor credit all sit outside it. Second,{" "}
              {undisclosed.length} records carry no price at all, so a transaction of unknown size
              contributes zero to both sides of the ratio &mdash; the ratio is not skewed by them,
              but it is not a measure of them either. Third, the denominator still contains the{" "}
              {cancelled.length} cancelled records worth{" "}
              <span className="num font-semibold text-ink">{formatTotal(cancelledUsd)}</span> and
              the {disputed.length} disputed record, because the ledger publishes the transaction
              and its status rather than quietly deleting the row.
            </p>
            <p>
              So the honest description of the ratio is this:{" "}
              <strong className="text-ink">
                borrowed money as a share of the capital we were able to price
              </strong>
              , not leverage, not debt to equity, and not a sector-wide figure. It is a useful
              number because it is stable and sourced. It is not a balance-sheet metric, and
              nothing in the model treats it as one.
            </p>
          </div>

          <div className="overflow-x-auto rounded-xl border border-rule">
            <table className="w-full text-left text-[14px]">
              <caption className="sr-only">
                The five largest tracked debt facilities: identifier, disclosed amount and the
                transaction.
              </caption>
              <thead className="bg-surface-2 text-ink-subtle">
                <tr>
                  <th scope="col" className="p-3 font-medium">
                    Record
                  </th>
                  <th scope="col" className="p-3 font-medium">
                    Facility
                  </th>
                  <th scope="col" className="p-3 text-right font-medium">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-rule">
                {largestDebtFacilities.map((d) => (
                  <tr key={d.id} className="align-top">
                    <th scope="row" className="num p-3 font-semibold text-ink">
                      {d.id}
                    </th>
                    <td className="p-3 text-ink-muted">{d.title}</td>
                    <td className="num p-3 text-right font-semibold text-ink">
                      {d.amount_display}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="max-w-measure space-y-4 text-[15px] leading-relaxed text-ink-muted">
            <p>
              What the {formatTotal(debtTotalUsd)} is made of matters as much as the total. The
              five largest facilities above are{" "}
              {(share(sumAmounts(largestDebtFacilities), debtTotalUsd) * 100).toFixed(1)}% of it,
              and they are {largestDebtKinds.join(" and ")} &mdash; claims on a balance sheet
              rather than on a single asset. That is why the model treats the credit complex as
              the transmission channel for this build-out rather than the construction cycle.
            </p>
            <p>
              One more detail is worth a reader&apos;s attention, because it shows the desk taking
              a number out rather than putting one in. The debt flag and the ledger&apos;s
              &quot;Borrowed&quot; category are not the same thing:{" "}
              {debtFlagOutsideBorrowedCategory.length} facilities carry the debt flag while sitting
              in another category, and {borrowedCategoryWithoutDebtFlag.length} sits in the
              Borrowed category without the flag because it restates an existing facility rather
              than raising new money. That record is published as{" "}
              <span className="num">&ldquo;{borrowedCategoryWithoutDebtFlag[0]?.amount_display}&rdquo;</span>{" "}
              and contributes no amount to any total, so restating a facility can never
              double-count it.
            </p>
          </div>

          <div className="panel space-y-2">
            <span className="label">What the model does with it</span>
            <code className="num block text-[14px] leading-relaxed text-ink">
              {debtFactor?.formula}
            </code>
          </div>

          <div className="max-w-measure space-y-4 text-[15px] leading-relaxed text-ink-muted">
            <p>
              The factor reads three things: the share of tracked money that is borrowed, the
              annual pace of new issuance, and the cumulative stock of tracked debt. The share
              carries half the factor&apos;s weight, but it is the leg with the least range,
              because the published ramp treats anything up to 15% as the extreme end. At today&apos;s
              share the factor scores{" "}
              <span className="num font-semibold text-ink">
                {debtContribution?.reading.score.toFixed(3)}
              </span>
              , worth{" "}
              <span className="num font-semibold text-ink">
                {debtContribution?.earnedPoints.toFixed(1)}
              </span>{" "}
              of its {debtContribution?.weightPct} points &mdash; and the engine&apos;s own reading
              puts it plainly:{" "}
              <span className="text-ink">{debtContribution?.reading.reading}</span>.
            </p>
          </div>
        </GuideSection>

        {/* ── SECTION 05 ─────────────────────────────────────────────────── */}
        <GuideSection
          id="receipts"
          index={5}
          kicker="The receipts"
          title="How to spot a number that is not receipt-backed"
          lead="Five checks, in the order the desk applies them."
        >
          <div className="overflow-x-auto rounded-xl border border-rule">
            <table className="w-full text-left text-[14px]">
              <caption className="sr-only">
                Where the ledger&apos;s receipts come from: the source type of every record and the
                number of independent sources behind each one.
              </caption>
              <thead className="bg-surface-2 text-ink-subtle">
                <tr>
                  <th scope="col" className="p-3 font-medium">
                    Receipt
                  </th>
                  <th scope="col" className="p-3 text-right font-medium">
                    Records
                  </th>
                  <th scope="col" className="p-3 text-right font-medium">
                    Disclosed amount
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-rule">
                {sourceTypes.map((s) => (
                  <tr key={s.type}>
                    <th scope="row" className="p-3 font-semibold text-ink">
                      {s.type}
                    </th>
                    <td className="num p-3 text-right text-ink-muted">{s.count}</td>
                    <td className="num p-3 text-right text-ink-muted">{formatTotal(s.usd)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="max-w-measure space-y-4 text-[15px] leading-relaxed text-ink-muted">
            <p>
              <strong className="text-ink">One: check the source type.</strong>{" "}
              {sourceTypes[0]?.count} of the {deals.length} records rest on a regulatory filing,
              which is the strongest receipt there is. The rest rest on a verified press report or
              a verified announcement. None of those are anonymous tips, but they are not filings
              either, and a reader using this ledger for anything consequential should know which
              is which.
            </p>
            <p>
              <strong className="text-ink">Two: check the source count.</strong>{" "}
              {sourceCountBuckets.map((b) => `${b.n} records with ${b.label}`).join(", ")}. A record
              backed by one source is a single receipt, and single receipts are wrong sometimes.
            </p>
            <p>
              <strong className="text-ink">Three: check whether there is a figure at all.</strong>{" "}
              {undisclosed.length} records have no disclosed amount. That is not a data gap to be
              filled in with an estimate &mdash; it is the honest state of the record, and the
              ledger says so in the display field rather than in a footnote.
            </p>
            <p>
              <strong className="text-ink">Four: check the status, and check for flags that are
              judgements.</strong>{" "}
              {cancelled.length} records are cancelled and {disputed.length} is disputed, and
              both remain in the totals. The circularity flag is maintained by hand from the tracked
              relationships rather than extracted from a filing, so it is the one classification in
              the ledger that a reader has to take on trust from the desk.
            </p>
            <p>
              <strong className="text-ink">Five: check the arithmetic.</strong>{" "}
              {formatTotal(totalDisclosedUsd)} is the sum of {deals.length} amounts. Every
              published aggregate on this page divides into it. If a number elsewhere on the site
              does not reconcile to that sum, it is not from this ledger.
            </p>
          </div>

          <GuideDisclosure summary="What the ledger refuses to publish" tone="notice-caution">
            The ledger does not carry an estimated amount for a deal whose price was not disclosed,
            and it does not carry an inferred amount for a deal whose filing it could not read. It
            logs the event and leaves the figure empty. The consequence for the model is that the
            debt share is a floor rather than a complete census, and any factor reading built on
            it inherits that floor.
          </GuideDisclosure>
        </GuideSection>

        {/* ── SECTION 06 ─────────────────────────────────────────────────── */}
        <GuideSection id="not-this" index={6} kicker="The disclosure" title="What this is not">
          <NotThisPanel
            items={[
              "The ledger is not a census of AI capital. It is a record of what could be sourced, and what could not be sourced is missing without being estimated.",
              "The 7.5% debt share is not leverage and not a balance-sheet ratio. It is borrowed money over the capital the site was able to price.",
              "The $2.87T total is not money spent. Most of it is contractual capacity, announced consideration and announced intent.",
              "The circularity flag is an editorial judgement maintained by the desk, not a field extracted from a filing.",
              "Cancelled and disputed transactions remain inside the totals. A reader who wants closed capital only should filter by status on the ledger page.",
              "Deal counts mean nothing on their own. The model's backlog share is a count of records, and the dollar share of the same records is several points higher.",
            ]}
          />
        </GuideSection>

        {/* ── SECTION 07 ─────────────────────────────────────────────────── */}
        <GuideSection
          id="check-it"
          index={7}
          kicker="The receipts"
          title="Open the ledger and check the arithmetic"
          lead="Every row in this guide is one click away, and the site publishes the same dataset as a file."
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Link
              href="/ledger"
              className="card card-flush flex min-h-11 flex-col gap-1 p-4 transition-colors hover:border-rule-strong"
            >
              <span className="label">The ledger</span>
              <span className="text-[15px] font-semibold text-ink">
                Every record, searchable
              </span>
              <span className="mt-1 text-[14px] text-ink-subtle">
                Filter by company, type, year and status, and open any row into its source notes.
              </span>
              <span className="mt-2 flex items-center gap-1 text-[14px] font-medium text-ink">
                Open the ledger
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </span>
            </Link>
            <Link
              href="/api/v1/deals"
              className="card card-flush flex min-h-11 flex-col gap-1 p-4 transition-colors hover:border-rule-strong"
            >
              <span className="label">Open API</span>
              <span className="text-[15px] font-semibold text-ink">/api/v1/deals</span>
              <span className="mt-1 text-[14px] text-ink-subtle">
                The same {deals.length} records as JSON, with CSV export from the ledger page.
              </span>
              <span className="mt-2 flex items-center gap-1 text-[14px] font-medium text-ink">
                Fetch the file
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </span>
            </Link>
          </div>
        </GuideSection>
      </div>

      <div className="mt-10">
        <GuideFooter current={guide} next={next} />
      </div>

      {/* The pager: the other two guides, and the date this one was checked
          against the published snapshot. */}
      <div className="mt-8">
        <GuidePager current={guide} />
      </div>
    </div>
  );
}
