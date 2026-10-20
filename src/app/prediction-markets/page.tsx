import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Info } from "lucide-react";
import { evaluateBubbleModel, DEFAULT_MODEL_INPUTS } from "@/lib/model/engine";
import {
  DAMPER_WEIGHT_PCT,
  MODEL_FACTORS,
  SUM_RISK_WEIGHT_PCT,
} from "@/lib/model/factors";
import {
  BAND_FLOOR_RULE_SENTENCE,
  MARKET_IMPLIED_12M_BAND,
  RISK_FACTOR_COUNT,
  crowdDivergencePoints,
} from "@/lib/model/documentFormulas";
import {
  POLYMARKET_BASE_URL,
  POLYMARKET_FEATURED_MARKETS,
  POLYMARKET_HISTORICAL_TRENDS,
  POLYMARKET_REFERRAL_CODE,
  POLYMARKET_RESOLUTION_CONDITIONS,
} from "@/data/polymarket-data";
import rawLiveInputs from "@/data/live-inputs.json";
import { CrowdTrendChart, type CrowdTrendPoint } from "./_components/CrowdTrendChart";
import { ReferralCodeCopy } from "./_components/ReferralCodeCopy";

/**
 * /prediction-markets — what the crowd is pricing, what the model prints, and
 * how the market's price enters the model.
 *
 * A server component. Every figure below is either (a) read off the daily
 * live-input snapshot, (b) computed by the model engine, (c) a published
 * constant from the model's own library, or (d) the published resolution
 * rulebook. Nothing is typed in by hand, and a field that the daily feed has
 * not published yet prints an em dash rather than an invented number.
 */

// ─────────────────────────────────────────────────────────────────────────────
// The live crowd snapshot — typed, optional where the feed may not publish yet
// ─────────────────────────────────────────────────────────────────────────────

interface LiveCrowdMarket {
  id: string;
  question: string;
  slug: string;
  eventSlug: string;
  yesProbabilityPct: number;
  noProbabilityPct: number;
  volumeUsd: number;
  referralUrl: string;
  endDate?: string;
  closed?: boolean;
  active?: boolean;
  liquidityUsd?: number;
  oneDayPriceChangePct?: number;
  spreadPct?: number;
}

interface LiveCrowd {
  yesProbability?: number;
  volumeUsd?: number;
  bubble2026Probability?: number;
  bubble2027Probability?: number;
  activeContractsCount?: number;
  referralCode?: string;
  referralUrl?: string;
  note?: string;
  markets?: LiveCrowdMarket[];
}

interface LiveInputs {
  crowd?: LiveCrowd;
  meta?: { last_synced_at?: string; sync_mode?: string };
}

const liveInputs = rawLiveInputs as unknown as LiveInputs;
const crowd = liveInputs.crowd ?? null;
const liveMarkets: LiveCrowdMarket[] = Array.isArray(crowd?.markets)
  ? crowd.markets
  : [];

// ─────────────────────────────────────────────────────────────────────────────
// The model — the same call every other surface on the site makes
// ─────────────────────────────────────────────────────────────────────────────

const model = evaluateBubbleModel(DEFAULT_MODEL_INPUTS);
const crowdContribution = model.contributions.find((c) => c.id === "crowd_signal");
const crowdFactor = MODEL_FACTORS.find((f) => f.id === "crowd_signal");
const divergence = crowdDivergencePoints(model.burstProbability);

// ─────────────────────────────────────────────────────────────────────────────
// The two contracts this page is really about, resolved from the published list
// ─────────────────────────────────────────────────────────────────────────────

const featured2027 = POLYMARKET_FEATURED_MARKETS.find((m) => m.id === "poly-bubble-2027");
const featured2026 = POLYMARKET_FEATURED_MARKETS.find((m) => m.id === "poly-bubble-2026");
const contract2027Live = liveMarkets.find((m) => m.slug === featured2027?.slug) ?? null;
const contract2026Live = liveMarkets.find((m) => m.slug === featured2026?.slug) ?? null;

/** The 12-month contract: the one whose window brackets the model's horizon. */
const twelveMonthPct =
  contract2027Live?.yesProbabilityPct ??
  (typeof crowd?.bubble2027Probability === "number"
    ? crowd.bubble2027Probability * 100
    : undefined);
const sixMonthPct =
  contract2026Live?.yesProbabilityPct ??
  (typeof crowd?.bubble2026Probability === "number"
    ? crowd.bubble2026Probability * 100
    : undefined);

/** The model's print minus the market's price for the same question. */
const gapVsMarket =
  typeof twelveMonthPct === "number"
    ? Math.round((model.burstProbability - twelveMonthPct) * 10) / 10
    : null;

// ─────────────────────────────────────────────────────────────────────────────
// How much the crowd's price can move the model — a what-if, computed
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Re-run the engine with the crowd price moved and nothing else changed.
 * This is the honest answer to "does the model just echo the market?": the
 * other seven factors are held still and the crowd leg is the only input
 * that moves.
 */
function crowdScenario(nextProbability: number): number | null {
  const base = crowd?.bubble2026Probability ?? crowd?.yesProbability;
  const baseInputs = DEFAULT_MODEL_INPUTS;
  if (typeof base !== "number" || !baseInputs.crowd) return null;
  const crowdInput = baseInputs.crowd;
  const next = Math.min(1, Math.max(0, nextProbability));
  return evaluateBubbleModel({
    ...baseInputs,
    crowd: {
      ...crowdInput,
      bubble2026Probability: next,
      yesProbability: next,
    },
  }).burstProbability;
}

const crowdBaseProbability = crowd?.bubble2026Probability ?? crowd?.yesProbability;
const scenarioUp =
  typeof crowdBaseProbability === "number" ? crowdScenario(crowdBaseProbability + 0.1) : null;
const scenarioZero = typeof crowdBaseProbability === "number" ? crowdScenario(0) : null;

// ─────────────────────────────────────────────────────────────────────────────
// The published crowd coverage rule (src/lib/model/factors.ts, crowd factor)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * The factor's own coverage ladder: volume at or above $1M is carried at full
 * weight, $100K to $1M is down-weighted, and anything thinner is carried at
 * 0.40. The band edges below are the published thresholds; the live coverage
 * the engine actually assigned is printed next to them.
 */
const CROWD_COVERAGE_TIERS = [
  { from: 1_000_000, to: Number.POSITIVE_INFINITY, coverage: 1, label: "full weight" },
  { from: 100_000, to: 1_000_000, coverage: 0.7, label: "down-weighted" },
  { from: 0, to: 100_000, coverage: 0.4, label: "thin book" },
];

function crowdCoverageTier(volumeUsd: number | undefined) {
  if (typeof volumeUsd !== "number") return null;
  return (
    CROWD_COVERAGE_TIERS.find(
      (t) => volumeUsd >= t.from && volumeUsd < t.to,
    ) ?? null
  );
}

function coverageRuleLabel(tier: (typeof CROWD_COVERAGE_TIERS)[number]): string {
  if (tier.to === Number.POSITIVE_INFINITY) return `${fmtUsdShort(tier.from)} and above`;
  if (tier.from === 0) return `below ${fmtUsdShort(tier.to)}`;
  return `${fmtUsdShort(tier.from)} to ${fmtUsdShort(tier.to)}`;
}

const trackedVolumeUsd = crowd?.volumeUsd;
const coverageTier = crowdCoverageTier(trackedVolumeUsd);

// ─────────────────────────────────────────────────────────────────────────────
// The live book — closed contracts are flagged, never deleted
// ─────────────────────────────────────────────────────────────────────────────

interface BookRow {
  market: LiveCrowdMarket;
  yesUrl: string;
  noUrl: string;
  closed: boolean;
  closedReason: string;
  deadline: string;
  /** The deadline as a timestamp, or null when the feed publishes none. */
  deadlineMs: number | null;
}

/** Every outbound link carries the referral code and the outcome selector. */
function polymarketOutcomeUrl(base: string, outcome: "Yes" | "No"): string {
  let url = base && base.length > 0 ? base : POLYMARKET_BASE_URL;
  if (!url.includes(`r=${POLYMARKET_REFERRAL_CODE}`)) {
    url = `${url}${url.includes("?") ? "&" : "?"}r=${POLYMARKET_REFERRAL_CODE}`;
  }
  if (!url.includes("outcome=")) {
    url = `${url}${url.includes("?") ? "&" : "?"}outcome=${outcome}`;
  }
  return url;
}

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

/**
 * A deadline as a date. The feed publishes either a plain ISO date
 * ("2027-01-01") or a full ISO timestamp ("2027-01-01T04:59:00Z"); both are
 * read as UTC so the server and the reader's calendar agree.
 */
function parseDeadline(endDate: string | undefined): number | null {
  if (typeof endDate !== "string" || endDate.trim() === "") return null;
  const ms = Date.parse(endDate);
  return Number.isFinite(ms) ? ms : null;
}

function formatDeadline(ms: number | null, raw: string | undefined): string {
  if (ms === null) return "—";
  const iso = new Date(ms).toISOString().slice(0, 10);
  const [y, m, d] = iso.split("-").map((n) => Number.parseInt(n, 10));
  if (!y || !m || !d) return raw ?? "—";
  return `${d} ${MONTHS[m - 1]} ${y}`;
}

function classifyContract(
  m: LiveCrowdMarket,
  deadlineMs: number | null,
): { closed: boolean; reason: string } {
  if (m.closed === true) return { closed: true, reason: "Feed marks it closed" };
  if (m.active === false) return { closed: true, reason: "Feed marks it inactive" };
  if (deadlineMs !== null && deadlineMs < Date.now()) {
    return { closed: true, reason: "Deadline passed" };
  }
  if (m.yesProbabilityPct === 0) {
    return { closed: true, reason: "Book resolved at zero" };
  }
  return { closed: false, reason: "" };
}

const bookRows: BookRow[] = liveMarkets.map((m) => {
  const deadlineMs = parseDeadline(m.endDate);
  const { closed, reason } = classifyContract(m, deadlineMs);
  return {
    market: m,
    yesUrl: polymarketOutcomeUrl(m.referralUrl, "Yes"),
    noUrl: polymarketOutcomeUrl(m.referralUrl, "No"),
    closed,
    closedReason: reason,
    deadline: formatDeadline(deadlineMs, m.endDate),
    deadlineMs,
  };
});

const byVolume = (a: BookRow, b: BookRow) =>
  (b.market.volumeUsd ?? 0) - (a.market.volumeUsd ?? 0);

const openRows = bookRows.filter((r) => !r.closed).sort(byVolume);
const closedRows = bookRows.filter((r) => r.closed).sort(byVolume);

const thinnestOpenVolume = openRows.length
  ? Math.min(...openRows.map((r) => r.market.volumeUsd ?? 0))
  : undefined;
const liquidityPublished = liveMarkets.some(
  (m) => typeof m.liquidityUsd === "number",
);
const deadlinePublished = liveMarkets.some((m) => typeof m.endDate === "string");

// ─────────────────────────────────────────────────────────────────────────────
// The published history, with the live snapshot bound to the last point
// ─────────────────────────────────────────────────────────────────────────────

const live2026Pct =
  typeof crowd?.bubble2026Probability === "number"
    ? crowd.bubble2026Probability * 100
    : undefined;
const live2027Pct =
  typeof crowd?.bubble2027Probability === "number"
    ? crowd.bubble2027Probability * 100
    : undefined;

const trendPoints: CrowdTrendPoint[] = POLYMARKET_HISTORICAL_TRENDS.map((p, i) => {
  const isLast = i === POLYMARKET_HISTORICAL_TRENDS.length - 1;
  const label = p.date.replace(/\s*\(Live\)\s*$/, "");
  if (!isLast) {
    return {
      date: p.date,
      label,
      aiBubble2026: p.aiBubble2026,
      aiBubble2027: p.aiBubble2027,
      live: false,
    };
  }
  // The final point is the live snapshot. If the feed has not published one,
  // the published point stands and is labelled as published history.
  if (live2026Pct === undefined && live2027Pct === undefined) {
    return {
      date: p.date,
      label,
      aiBubble2026: p.aiBubble2026,
      aiBubble2027: p.aiBubble2027,
      live: false,
    };
  }
  return {
    date: p.date,
    label,
    aiBubble2026: live2026Pct ?? p.aiBubble2026,
    aiBubble2027: live2027Pct ?? p.aiBubble2027,
    live: true,
  };
});

const SNAPSHOT_ISO = liveInputs.meta?.last_synced_at ?? "";
const SNAPSHOT_DATE = SNAPSHOT_ISO ? SNAPSHOT_ISO.slice(0, 10) : "not published";

export const metadata: Metadata = {
  title: "Prediction markets — what Polymarket is pricing for the AI bubble",
  description:
    "What the prediction market is pricing for the AI build-out: the live Polymarket book, the odds on a 12-month AI bubble burst, the gap against the model's own print, and how the market's price enters the model as one factor of eight.",
  keywords: [
    "AI bubble odds",
    "Polymarket AI bubble",
    "will AI bubble burst",
    "prediction market AI bubble probability",
    "AI bubble burst odds",
    "Polymarket AI bubble 2026",
    "AI bubble prediction market",
  ],
  alternates: {
    canonical: "/prediction-markets",
  },
  openGraph: {
    title: "Prediction markets — what Polymarket is pricing for the AI bubble",
    description:
      "The live book, the odds on a 12-month AI bubble burst, the gap against the model's print, and how the market's price enters the model as one factor of eight.",
    url: "/prediction-markets",
    type: "website",
    // 2026-10-19: an explicit openGraph block suppresses the file-convention
    // image cascade (root opengraph-image.png stops merging), so the card must
    // be named here.
    images: ["/opengraph-image.png"],
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Small formatters — an absent number prints an em dash, never a guess
// ─────────────────────────────────────────────────────────────────────────────

function fmtPct(value: number | undefined | null, digits = 1): string {
  if (typeof value !== "number" || !Number.isFinite(value)) return "—";
  return `${value.toFixed(digits)}%`;
}

function fmtUsd(value: number | undefined | null): string {
  if (typeof value !== "number" || !Number.isFinite(value)) return "—";
  if (value >= 1_000_000) return `$${(value / 1e6).toFixed(2)}M`;
  if (value >= 1_000) return `$${(value / 1e3).toFixed(1)}K`;
  return `$${Math.round(value)}`;
}

/** The same, without decimals — for a threshold. */
function fmtUsdShort(value: number): string {
  if (value >= 1_000_000) return `$${value / 1e6}M`;
  if (value >= 1_000) return `$${value / 1e3}K`;
  return `$${value}`;
}

function fmtPoints(value: number | undefined | null): string {
  if (typeof value !== "number" || !Number.isFinite(value)) return "—";
  return `${value >= 0 ? "+" : ""}${value.toFixed(1)}`;
}

/** A numbered section, in the house rhythm. */
function Section({
  id,
  kicker,
  title,
  lead,
  children,
}: {
  id: string;
  kicker: string;
  title: string;
  lead?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="space-y-5 scroll-mt-24">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-rule pb-2">
        <span className="text-[13px] font-mono font-bold uppercase tracking-wider text-ink-muted">
          {kicker}
        </span>
      </div>
      <h2 className="text-xl font-bold tracking-tight text-ink sm:text-2xl">{title}</h2>
      {lead ? <p className="max-w-measure text-[15px] leading-relaxed text-ink-muted">{lead}</p> : null}
      {children}
    </section>
  );
}

export default function PredictionMarketsPage() {
  const marketLabel = contract2027Live?.question ?? featured2027?.title ?? "the June 2027 contract";
  const marketLabelClean = marketLabel.replace(/\?+$/, "");

  return (
    <div className="section-sm space-y-10">
      {/* ── HEADER ─────────────────────────────────────────────────────── */}
      <header className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
          <span className="label">Prediction markets</span>
          <span className="pill">Polymarket</span>
          <span className="pill pill-caution">Affiliate links on this page</span>
          <span className="num text-[14px] text-ink-faint">
            snapshot {SNAPSHOT_DATE}
          </span>
        </div>

        <h1 className="max-w-reading text-3xl font-bold tracking-tight text-ink sm:text-4xl">
          What the prediction market is pricing for the AI build-out
        </h1>

        <p className="prose prose-lead max-w-reading">
          The crowd prices a twelve-month AI bubble at{" "}
          <span className="num font-semibold text-ink">{fmtPct(twelveMonthPct)}</span> YES on{" "}
          {marketLabelClean}. This site&rsquo;s model prints{" "}
          <span className="num font-semibold text-ink">
            {model.burstProbability.toFixed(1)}%
          </span>{" "}
          for the same question. The gap is{" "}
          {gapVsMarket !== null ? (
            <span className="num font-semibold text-ink">
              {fmtPoints(gapVsMarket)} probability points
            </span>
          ) : (
            <span className="num font-semibold text-ink">not published</span>
          )}{" "}
          &mdash; and it exists because the crowd&rsquo;s price is one factor of eight in the
          model, not the model itself.
        </p>

        <div className="flex flex-wrap items-center gap-2">
          <a
            href={polymarketOutcomeUrl(
              contract2027Live?.referralUrl ?? POLYMARKET_BASE_URL,
              "Yes",
            )}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary min-h-11"
          >
            <span>Trade on Polymarket: {marketLabelClean}</span>
            <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
          </a>
          <Link href="#the-live-book" className="btn min-h-11">
            See the live book
          </Link>
          <Link href="/methodology" className="btn min-h-11">
            How the model works
          </Link>
        </div>
      </header>

      {/* ── 01 · MODEL AND MARKET ──────────────────────────────────────── */}
      <Section
        id="model-and-market"
        kicker="Section 01 · The comparison"
        title="The model and the market, side by side"
        lead="One number is computed from filed receipts and daily market prints. The other is computed from money that people put at risk. They are answering slightly different questions, and they disagree."
      >
        <div className="overflow-x-auto rounded-xl border border-rule">
          <table className="w-full text-left text-[14px]">
            <caption className="sr-only">
              The model&rsquo;s 12-month print compared with the prediction-market price for the
              same question and with the published market-implied band.
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
                  What it is
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rule">
              <tr>
                <th scope="row" className="p-3 font-semibold text-ink">
                  This model, {model.horizonMonths}-month print
                </th>
                <td className="num p-3 text-right font-semibold text-ink">
                  {model.burstProbability.toFixed(1)}%
                  <span className="block text-[14px] font-normal text-ink-subtle">
                    composite {model.compositeScore.toFixed(1)} · model v{model.modelVersion}
                  </span>
                </td>
                <td className="p-3 text-ink-muted">
                  The site&rsquo;s own estimate that an AI capital bubble bursts inside twelve
                  months, computed from {RISK_FACTOR_COUNT} weighted risk factors less one
                  real-use damper. It is the number this site publishes everywhere else.
                </td>
              </tr>
              <tr>
                <th scope="row" className="p-3 font-semibold text-ink">
                  The market, same question
                </th>
                <td className="num p-3 text-right font-semibold text-ink">
                  {fmtPct(twelveMonthPct)}
                  <span className="block text-[14px] font-normal text-ink-subtle">
                    YES on {marketLabelClean}
                  </span>
                </td>
                <td className="p-3 text-ink-muted">
                  What money is priced at on the contract whose window brackets the
                  model&rsquo;s twelve months. It is the market&rsquo;s number, not ours.
                </td>
              </tr>
              <tr>
                <th scope="row" className="p-3 font-semibold text-ink">
                  Published market-implied band
                </th>
                <td className="num p-3 text-right font-semibold text-ink">
                  {MARKET_IMPLIED_12M_BAND.lowPct.toFixed(1)}%&ndash;{" "}
                  {MARKET_IMPLIED_12M_BAND.highPct.toFixed(1)}%
                  <span className="block text-[14px] font-normal text-ink-subtle">
                    central {MARKET_IMPLIED_12M_BAND.centralPct.toFixed(1)}% at &alpha;{" "}
                    {MARKET_IMPLIED_12M_BAND.alphaCentral.toFixed(2)} (
                    {MARKET_IMPLIED_12M_BAND.alphaRange[0].toFixed(2)}&ndash;
                    {MARKET_IMPLIED_12M_BAND.alphaRange[1].toFixed(2)})
                  </span>
                </td>
                <td className="p-3 text-ink-muted">
                  The tracked contracts re-expressed as a twelve-month read with the published
                  horizon and bias correction applied.
                </td>
              </tr>
              <tr>
                <th scope="row" className="p-3 font-semibold text-ink">
                  The market, shorter window
                </th>
                <td className="num p-3 text-right font-semibold text-ink">
                  {fmtPct(sixMonthPct)}
                  <span className="block text-[14px] font-normal text-ink-subtle">
                    YES on the December 2026 contract
                  </span>
                </td>
                <td className="p-3 text-ink-muted">
                  The flagship 2026 contract. A shorter question than the model asks, and the
                  leg the model actually scores.
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <div className="panel space-y-4">
            <div>
              <span className="label">How far apart they are</span>
              <dl className="mt-2 space-y-2 text-[14px]">
                <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-rule pb-2">
                  <dt className="text-ink-muted">
                    Model print above the top of the published band
                  </dt>
                  <dd className="num font-semibold text-ink">
                    {fmtPoints(divergence.vsBandHigh)} pts
                  </dd>
                </div>
                <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-rule pb-2">
                  <dt className="text-ink-muted">
                    Model print above the bottom of the published band
                  </dt>
                  <dd className="num font-semibold text-ink">
                    {fmtPoints(divergence.vsBandLow)} pts
                  </dd>
                </div>
                <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-rule pb-2">
                  <dt className="text-ink-muted">
                    Model print above the raw December 2026 contract
                  </dt>
                  <dd className="num font-semibold text-ink">
                    {fmtPoints(divergence.vsRawContract)} pts
                  </dd>
                </div>
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <dt className="text-ink-muted">
                    Model print above the market&rsquo;s twelve-month price
                  </dt>
                  <dd className="num font-semibold text-ink">{fmtPoints(gapVsMarket)} pts</dd>
                </div>
              </dl>
              <p className="mt-2 text-[14px] leading-relaxed text-ink-subtle">
                The raw-contract line above is measured against the 9.05% contract print carried
                in the model library; today&rsquo;s live December 2026 contract prints{" "}
                {fmtPct(sixMonthPct)}. The rule behind the band is published in the model
                library: {BAND_FLOOR_RULE_SENTENCE}
              </p>
            </div>

            <div className="border-t border-rule pt-4">
              <span className="label">Why the two numbers differ</span>
              <p className="mt-2 text-[15px] leading-relaxed text-ink-muted">
                Part of the gap is definitional and will not close. The contracts ask whether an
                <em> industry downturn</em> arrives by a calendar date; the model asks whether an
                AI <em>capital bubble</em> bursts inside twelve months, on its own pre-registered
                triggers. Part of it is calibration: the model maps its score through a judgment
                anchor that was never fitted to anything, so tens of points between two
                differently-framed questions are ordinary. Only the remainder is a real
                disagreement about the world.
              </p>
            </div>
          </div>

          {/* The crowd factor panel — one factor of eight */}
          <div className="card space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="chip">Factor {crowdFactor?.id ?? "crowd_signal"}</span>
              <span className="chip chip-caution">
                {crowdFactor?.weightPct ?? "—"} of {SUM_RISK_WEIGHT_PCT} risk points
              </span>
            </div>

            <h3 className="text-[15px] font-bold text-ink">
              The crowd is one of {RISK_FACTOR_COUNT} risk factors
            </h3>

            <p className="text-[14px] leading-relaxed text-ink-muted">
              {crowdFactor?.explain}
            </p>

            <div className="panel space-y-2">
              <span className="label">Published formula</span>
              <code className="num block text-[14px] leading-relaxed text-ink">
                {crowdFactor?.formula}
              </code>
            </div>

            <div className="panel space-y-2">
              <span className="label">Coverage rule, by traded volume</span>
              <ul className="space-y-1 text-[14px] leading-relaxed text-ink-muted">
                {CROWD_COVERAGE_TIERS.map((tier) => (
                  <li key={tier.from}>
                    {coverageRuleLabel(tier)} &rarr; coverage{" "}
                    <span className="num font-semibold text-ink">
                      {tier.coverage.toFixed(2)}
                    </span>{" "}
                    ({tier.label})
                  </li>
                ))}
              </ul>
              <p className="text-[14px] leading-relaxed text-ink-subtle">
                Tracked volume today is{" "}
                <span className="num font-semibold text-ink">
                  {fmtUsd(trackedVolumeUsd)}
                </span>
                {coverageTier ? (
                  <>
                    , so the engine carries this factor at coverage{" "}
                    <span className="num font-semibold text-ink">
                      {(crowdContribution?.reading.coverage ?? coverageTier.coverage).toFixed(2)}
                    </span>
                    .
                  </>
                ) : (
                  "."
                )}
              </p>
            </div>

            <div className="panel space-y-2">
              <span className="label">The engine&rsquo;s own reading today</span>
              <p className="text-[14px] leading-relaxed text-ink">
                {crowdContribution?.reading.reading ?? "Not published"}
              </p>
              <p className="text-[14px] leading-relaxed text-ink-subtle">
                It earns{" "}
                <span className="num font-semibold text-ink">
                  {crowdContribution?.earnedPoints.toFixed(1) ?? "—"}
                </span>{" "}
                of its {crowdFactor?.weightPct ?? "—"} points today. The damper is separate and
                subtracts up to {DAMPER_WEIGHT_PCT} points from the composite; it is not part of
                the {SUM_RISK_WEIGHT_PCT}-point risk scale.
              </p>
            </div>

            {/* The what-if: the crowd price moved and nothing else did */}
            {scenarioUp !== null ? (
              <div className="panel space-y-2">
                <span className="label">What-if: the crowd price moved, nothing else</span>
                <p className="text-[14px] leading-relaxed text-ink-muted">
                  The same engine, the same inputs, with only the crowd leg changed.
                </p>
                <dl className="space-y-1 text-[14px]">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <dt className="text-ink-muted">Crowd price as published</dt>
                    <dd className="num font-semibold text-ink">
                      {model.burstProbability.toFixed(1)}%
                    </dd>
                  </div>
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <dt className="text-ink-muted">Crowd price 10 points higher</dt>
                    <dd className="num font-semibold text-ink">
                      {scenarioUp.toFixed(1)}%
                    </dd>
                  </div>
                  {scenarioZero !== null ? (
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <dt className="text-ink-muted">Crowd price at zero</dt>
                      <dd className="num font-semibold text-ink">
                        {scenarioZero.toFixed(1)}%
                      </dd>
                    </div>
                  ) : null}
                </dl>
                <p className="text-[14px] leading-relaxed text-ink-subtle">
                  A ten-point move in the crowd price is worth{" "}
                  <span className="num font-semibold text-ink">
                    {Math.abs(scenarioUp - model.burstProbability).toFixed(1)}
                  </span>{" "}
                  points of probability — the rest of the print is the other seven factors and
                  the damper. The model weighs the market; it does not repeat it.
                </p>
              </div>
            ) : null}
          </div>
        </div>
      </Section>

      {/* ── 02 · THE LIVE BOOK ─────────────────────────────────────────── */}
      <Section
        id="the-live-book"
        kicker="Section 02 · The book"
        title="The live book"
        lead="Every tracked contract, with the price the market is printing right now and the money behind it. Closed contracts stay in the table and are marked as closed — they are not quietly dropped."
      >
        <div className="overflow-x-auto rounded-xl border border-rule">
          <table className="w-full text-left text-[14px]">
            <caption className="sr-only">
              The tracked prediction-market contracts: the question, the deadline, the YES and NO
              prices, the traded volume, the liquidity where published, and an outbound link to
              trade the contract on Polymarket. Contracts that have closed are marked as closed
              and kept in the table.
            </caption>
            <thead className="bg-surface-2 text-ink-subtle">
              <tr>
                <th scope="col" className="p-3 font-medium">
                  Contract
                </th>
                <th scope="col" className="p-3 font-medium">
                  Deadline
                </th>
                <th scope="col" className="p-3 text-right font-medium">
                  YES
                </th>
                <th scope="col" className="p-3 text-right font-medium">
                  NO
                </th>
                <th scope="col" className="p-3 text-right font-medium">
                  Traded volume
                </th>
                <th scope="col" className="p-3 text-right font-medium">
                  Liquidity
                </th>
                <th scope="col" className="p-3 text-right font-medium">
                  Trade on Polymarket
                </th>
              </tr>
            </thead>

            {openRows.length > 0 ? (
              <tbody className="divide-y divide-rule">
                <tr>
                  <th
                    scope="colgroup"
                    colSpan={7}
                    className="bg-surface-2 px-3 py-2 text-left text-[13px] font-semibold text-ink-muted"
                  >
                    Open contracts ({openRows.length}) — sorted by traded volume, largest first
                  </th>
                </tr>
                {openRows.map((row) => (
                  <tr key={row.market.id} className="align-top">
                    <th scope="row" className="p-3 font-semibold text-ink">
                      {row.market.question}
                      <span className="block text-[14px] font-normal text-ink-subtle">
                        #{row.market.id}
                      </span>
                    </th>
                    <td className="num p-3 text-ink-muted">{row.deadline}</td>
                    <td className="num p-3 text-right font-semibold text-ink">
                      {fmtPct(row.market.yesProbabilityPct)}
                    </td>
                    <td className="num p-3 text-right text-ink-muted">
                      {fmtPct(row.market.noProbabilityPct)}
                    </td>
                    <td className="num p-3 text-right text-ink-muted">
                      {fmtUsd(row.market.volumeUsd)}
                    </td>
                    <td className="num p-3 text-right text-ink-muted">
                      {typeof row.market.liquidityUsd === "number"
                        ? fmtUsd(row.market.liquidityUsd)
                        : "—"}
                    </td>
                    <td className="p-3">
                      <div className="flex flex-wrap justify-end gap-2">
                        <a
                          href={row.yesUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn min-h-11 whitespace-nowrap"
                        >
                          <span aria-hidden="true">YES</span>
                          <span className="sr-only">
                            Trade on Polymarket: {row.market.question} — YES
                          </span>
                        </a>
                        <a
                          href={row.noUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn min-h-11 whitespace-nowrap"
                        >
                          <span aria-hidden="true">NO</span>
                          <span className="sr-only">
                            Trade on Polymarket: {row.market.question} — NO
                          </span>
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            ) : null}

            {closedRows.length > 0 ? (
              <tbody className="divide-y divide-rule bg-surface-2">
                <tr>
                  <th
                    scope="colgroup"
                    colSpan={7}
                    className="bg-surface-3 px-3 py-2 text-left text-[13px] font-semibold text-ink-muted"
                  >
                    Closed contracts ({closedRows.length}) — kept for the record, not tradeable
                  </th>
                </tr>
                {closedRows.map((row) => (
                  <tr key={row.market.id} className="align-top">
                    <th scope="row" className="p-3 font-semibold text-ink-subtle">
                      {row.market.question}
                      <span className="mt-1 flex flex-wrap items-center gap-2">
                        <span className="chip">Closed</span>
                        <span className="text-[14px] font-normal text-ink-faint">
                          {row.closedReason}
                        </span>
                        <span className="block text-[14px] font-normal text-ink-subtle">
                          #{row.market.id}
                        </span>
                      </span>
                    </th>
                    <td className="num p-3 text-ink-subtle">{row.deadline}</td>
                    <td className="num p-3 text-right text-ink-subtle">
                      {fmtPct(row.market.yesProbabilityPct)}
                    </td>
                    <td className="num p-3 text-right text-ink-subtle">
                      {fmtPct(row.market.noProbabilityPct)}
                    </td>
                    <td className="num p-3 text-right text-ink-subtle">
                      {fmtUsd(row.market.volumeUsd)}
                    </td>
                    <td className="num p-3 text-right text-ink-subtle">
                      {typeof row.market.liquidityUsd === "number"
                        ? fmtUsd(row.market.liquidityUsd)
                        : "—"}
                    </td>
                    <td className="p-3">
                      <div className="flex flex-wrap justify-end gap-2">
                        <a
                          href={row.yesUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn min-h-11 whitespace-nowrap"
                        >
                          <span aria-hidden="true">YES</span>
                          <span className="sr-only">
                            Trade on Polymarket: {row.market.question} — YES
                          </span>
                        </a>
                        <a
                          href={row.noUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn min-h-11 whitespace-nowrap"
                        >
                          <span aria-hidden="true">NO</span>
                          <span className="sr-only">
                            Trade on Polymarket: {row.market.question} — NO
                          </span>
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            ) : null}
          </table>
        </div>

        <div className="notice">
          <p className="notice-title">How to read the book</p>
          <p className="mt-1.5 text-[14px] leading-relaxed">
            {openRows.length} of {bookRows.length} tracked contracts are open and{" "}
            {closedRows.length} are closed. A contract is marked{" "}
            <strong className="text-ink">Closed</strong> when the feed marks it closed or
            inactive, when its deadline has passed, or when its book sits at zero YES against
            100 NO &mdash; a resolved market, not a live one. Closed rows keep their last
            printed price and their volume, because a book that has stopped trading is part of
            the record.
            {!deadlinePublished
              ? " The current feed publishes no deadline field, so that column reads “—” for every row and the expiry is written into the question itself."
              : ""}{" "}
            {!liquidityPublished
              ? " The current feed publishes no per-contract liquidity figure either, so that column reads “—” throughout."
              : ""}{" "}
            {trackedVolumeUsd
              ? `Across the tracked set, ${fmtUsd(trackedVolumeUsd)} has traded.`
              : ""}{" "}
            {thinnestOpenVolume !== undefined
              ? `The thinnest open book in the set has traded ${fmtUsd(thinnestOpenVolume)} — a price that thin moves on very little money.`
              : ""}{" "}
            Deadlines are the expiry the feed publishes for each contract. For a contract that
            has already closed, that date can post-date the contract&rsquo;s own expiry, which
            is one more reason the closed flag is printed rather than inferred.
          </p>
        </div>
      </Section>

      {/* ── 03 · HOW THE PRICE HAS MOVED ───────────────────────────────── */}
      <Section
        id="price-history"
        kicker="Section 03 · The history"
        title="How the crowd's price has moved"
        lead="Two series, drawn from the published history: what the December 2026 and June 2027 contracts have been priced at since the first of them."
      >
        <CrowdTrendChart
          points={trendPoints}
          liveNote={`last point = live snapshot ${SNAPSHOT_DATE}`}
          caption="The history before the current snapshot is published by this site and is unchanged between runs; the final point is the live snapshot taken from today&rsquo;s feed. The 2026 series is the December 2026 contract and the 2027 series is the June 2027 contract &mdash; two different questions, so the gap between them is the market&rsquo;s term structure, not a disagreement."
        />
      </Section>

      {/* ── 04 · WHAT RESOLVING MEANS ──────────────────────────────────── */}
      <Section
        id="resolution"
        kicker="Section 04 · The rulebook"
        title="What resolving means"
        lead="The contract does not ask whether the AI bubble burst. It asks whether a specific list of drawdowns happened inside ninety days. That distinction is the single most useful thing on this page."
      >
        <div className="panel space-y-2">
          <span className="label">The published rule</span>
          <p className="text-[15px] leading-relaxed text-ink">
            Three of the five published conditions have to be met inside a single 90-day window
            for the December 2026 contract to resolve YES.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {POLYMARKET_RESOLUTION_CONDITIONS.map((cond) => (
            <div key={cond.id} className="card space-y-2.5">
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-[15px] font-semibold leading-snug text-ink">
                  {cond.title}
                </h3>
                <span
                  className={`chip ${
                    cond.riskLevel === "Low"
                      ? "chip-safe"
                      : cond.riskLevel === "Medium"
                        ? "chip-caution"
                        : "chip-risk"
                  }`}
                >
                  {cond.riskLevel}
                </span>
              </div>

              <dl className="grid grid-cols-2 gap-2 rounded-lg border border-rule bg-surface-2 p-3 text-[14px]">
                <div>
                  <dt className="label">Trigger target</dt>
                  <dd className="num mt-0.5 font-semibold text-ink">{cond.target}</dd>
                </div>
                <div>
                  <dt className="label">Latest reading</dt>
                  <dd className="num mt-0.5 font-semibold text-ink">{cond.currentValue}</dd>
                </div>
              </dl>

              <p className="prose text-[14px]">{cond.weightDescription}</p>
              <p className="text-[14px] text-ink-subtle">{cond.status}</p>
            </div>
          ))}
        </div>

        <div className="max-w-measure space-y-4 text-[15px] leading-relaxed text-ink-muted">
          <p>
            Read those five conditions as a machine. A 50% fall in NVIDIA from its record, a 40%
            fall in the semiconductor ETF, a bankruptcy or acquisition of a frontier lab, GPU
            rentals down to a dollar an hour, or a 50% collapse in one of the critical suppliers
            &mdash; any three of them, inside ninety days, and the contract is worth a dollar.
            There is no judgement in that, and no opinion about whether the industry feels like
            a bubble.
          </p>
          <p>
            The model&rsquo;s definition is different again. It resolves on its own pre-registered
            triggers &mdash; a 30% peak-to-trough fall in the tracked basket, a 100bp rise in
            Oracle&rsquo;s five-year credit default swap, or a 50% fall in tracked debt issuance
            &mdash; inside a twelve-month window. The rules are published in full on the{" "}
            <Link href="/methodology" className="prose-a">
              methodology page
            </Link>
            .
          </p>
          <p>
            So the two can part company in both directions, and it is worth saying exactly how.
            A contract can resolve <em>YES</em> on a mechanical drawdown that the model would
            not call a bubble &mdash; one supplier collapsing is not the build-out breaking. And
            the model can print a high number on grounds that resolve none of these five
            conditions at all, because credit can reprice long before a 50% drawdown prints. A
            market price on a different question is not a forecast of this one.
          </p>
        </div>

        <div className="notice notice-caution">
          <p className="notice-title">What a YES resolution would not mean</p>
          <p className="mt-1.5 text-[14px] leading-relaxed">
            A contract resolving YES would say that a specific set of mechanical triggers fired.
            It would not say that the AI capital cycle ended, that the build-out was irrational,
            or that this site&rsquo;s model was right. Those are separate claims, and this site
            keeps them separate.
          </p>
        </div>
      </Section>

      {/* ── 05 · THE DISCLOSURE ────────────────────────────────────────── */}
      <Section
        id="disclosure"
        kicker="Section 05 · The disclosure"
        title="What we get, and what it does not change"
        lead="The links on this page are affiliate links. Here is the whole arrangement, in plain terms."
      >
        <div className="card space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="chip chip-caution">Referral code {POLYMARKET_REFERRAL_CODE}</span>
            <span className="chip">Polymarket partner link</span>
          </div>

          <div className="max-w-measure space-y-4 text-[15px] leading-relaxed text-ink-muted">
            <p>
              Every outbound Polymarket link on this page carries the referral code{" "}
              <span className="num font-semibold text-ink">{POLYMARKET_REFERRAL_CODE}</span>.
              Polymarket may pay us a share of the fees on trades that arrive through it. That is
              the entire arrangement, and it is why the links are labelled rather than hidden.
            </p>
            <p>
              It does not change a number on this site. The model reads the odds and the odds
              only &mdash; it has never seen a referral code, and there is one model, one input
              set and one output. The print published on the home page, on{" "}
              <Link href="/methodology" className="prose-a">
                the methodology page
              </Link>{" "}
              and here is the same print with or without the referral attached.
            </p>
            <p>
              The odds themselves are Polymarket&rsquo;s, not ours, and they are a snapshot rather
              than a live quote: the site reads them once a day, while the order book moves
              continuously. Several contracts in the tracked set are thin &mdash;{" "}
              {thinnestOpenVolume !== undefined
                ? `the thinnest open book has traded ${fmtUsd(thinnestOpenVolume)}`
                : "some books are very small"}
              , which means the price can move on a small amount of money and can be wrong in
              either direction. Read it as one opinion with money behind it, not as a fact.
            </p>
            <p>
              Finally: the affiliate link is a way for a reader to take a position. It is not a
              recommendation. Nothing on this page is investment advice, and a position taken on
              the market&rsquo;s price is not a position on this site&rsquo;s model.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 border-t border-rule pt-4">
            <ReferralCodeCopy code={POLYMARKET_REFERRAL_CODE} />
            <a
              href={POLYMARKET_BASE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary min-h-11"
            >
              <span>Trade on Polymarket (opens in a new tab)</span>
              <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
            </a>
          </div>
        </div>

        <div className="panel space-y-2">
          <span className="label">What we are not</span>
          <ul className="space-y-1.5 text-[14px] leading-relaxed text-ink-muted">
            <li>&bull; Not a broker. We do not take custody, route orders or execute trades.</li>
            <li>&bull; Not a market maker. We do not set, quote or support any of these prices.</li>
            <li>&bull; Not a research provider for the contracts themselves. The rulebook above is Polymarket&rsquo;s; the resolution is decided by its own oracle process.</li>
            <li>&bull; Not investment advice. The odds on this page are somebody else&rsquo;s opinion.</li>
          </ul>
        </div>
      </Section>

      {/* ── 06 · WHERE TO GO NEXT ──────────────────────────────────────── */}
      <section aria-label="Where to go next" className="space-y-4">
        <h2 className="text-xl font-bold tracking-tight text-ink sm:text-2xl">
          Where to go next
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Link
            href="/methodology"
            className="card card-flush flex min-h-11 flex-col gap-1 p-4 transition-colors hover:border-rule-strong"
          >
            <span className="label">The method</span>
            <span className="text-[15px] font-semibold text-ink">
              How the crowd price enters the model
            </span>
            <span className="mt-1 text-[14px] text-ink-subtle">
              The {RISK_FACTOR_COUNT} risk factors, their published weights and formulas, the
              calibration anchor, and the band rule this page quotes.
            </span>
            <span className="mt-2 flex items-center gap-1 text-[14px] font-medium text-ink">
              Read the methodology
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </span>
          </Link>

          <Link
            href="/your-call"
            className="card card-flush flex min-h-11 flex-col gap-1 p-4 transition-colors hover:border-rule-strong"
          >
            <span className="label">Your call</span>
            <span className="text-[15px] font-semibold text-ink">
              Put your own number on the record
            </span>
            <span className="mt-1 text-[14px] text-ink-subtle">
              Keep your own twelve-month estimate next to the model&rsquo;s print and the market
              price, and see who tracked it once the window closes. Stored on your own device.
            </span>
            <span className="mt-2 flex items-center gap-1 text-[14px] font-medium text-ink">
              Record your call
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </span>
          </Link>

          <Link
            href="/guides/reading-ai-credit-stress"
            className="card card-flush flex min-h-11 flex-col gap-1 p-4 transition-colors hover:border-rule-strong"
          >
            <span className="label">Guide 02</span>
            <span className="text-[15px] font-semibold text-ink">
              Reading AI credit stress
            </span>
            <span className="mt-1 text-[14px] text-ink-subtle">
              Why the credit leg dominates the model, and how to read the gap between the model
              print and the market price.
            </span>
            <span className="mt-2 flex items-center gap-1 text-[14px] font-medium text-ink">
              Open the guide
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </span>
          </Link>

          <Link
            href="/markets"
            className="card card-flush flex min-h-11 flex-col gap-1 p-4 transition-colors hover:border-rule-strong"
          >
            <span className="label">The board</span>
            <span className="text-[15px] font-semibold text-ink">
              Quotes, yields and spreads
            </span>
            <span className="mt-1 text-[14px] text-ink-subtle">
              The daily market board behind the model&rsquo;s inputs, including the high-yield
              spread and the 10-year Treasury.
            </span>
            <span className="mt-2 flex items-center gap-1 text-[14px] font-medium text-ink">
              Open markets
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </span>
          </Link>
        </div>

        <p className="flex items-start gap-2 pt-2 text-[14px] leading-relaxed text-ink-subtle">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span>
            Every figure on this page is computed from the site&rsquo;s own published files at
            build time &mdash; the daily live-input snapshot, the model engine and the published
            rulebook. Nothing here is investment advice.
          </span>
        </p>
      </section>
    </div>
  );
}
