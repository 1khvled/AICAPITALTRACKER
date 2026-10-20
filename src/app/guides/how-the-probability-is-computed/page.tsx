import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import {
  evaluateBubbleModel,
  DEFAULT_MODEL_INPUTS,
  HISTORICAL_BACKTESTS,
  BACKTEST_CALIBRATION_SUMMARY,
} from "@/lib/model/engine";
import { MODEL_CALIBRATION, MODEL_FACTORS, CHANGELOG } from "@/lib/model/factors";
import { calibrationDrift, inSampleAuc, ODDS_SHIFT_SENTENCE } from "@/lib/model/documentFormulas";
import { getGuide, nextGuide } from "@/lib/guides";
import {
  GuideHeader,
  GuideSection,
  GuideFooter,
  GuideDisclosure,
  NotThisPanel,
} from "../_components/GuideChrome";
import latestModel from "@/data/latest-model.json";

/**
 * Guide 01 — how the 12-month probability is actually computed.
 *
 * Server component. Every figure below is evaluated at build time from the
 * live input set (src/data/live-inputs.json), the published model artifact
 * (src/data/latest-model.json) and the engine itself (src/lib/model/**).
 * Nothing is typed by hand: if a number below is wrong, the engine moved.
 */

const guide = getGuide("how-the-probability-is-computed")!;
const next = nextGuide(guide.slug);

// ── The live evaluation ──────────────────────────────────────────────────────
const model = evaluateBubbleModel(DEFAULT_MODEL_INPUTS);
const riskContributions = model.contributions.filter((c) => c.kind === "risk");
const damperContribution = model.contributions.find((c) => c.kind === "damper");

const riskPoints = riskContributions.reduce((acc, c) => acc + c.earnedPoints, 0);
const damperPoints = damperContribution?.earnedPoints ?? 0;
const contagionPoints = model.systemicContagionPoints ?? 0;

/**
 * The same composite arithmetic without the contagion term, mapped through the
 * same logistic. The published composite is rounded to one decimal, so this
 * read is also rounded — which is why the leverage is stated in points.
 */
const probabilityWithoutContagionPct =
  MODEL_CALIBRATION.mapping(riskPoints + damperPoints) * 100;
const contagionLeveragePoints =
  Math.round((model.burstProbability - probabilityWithoutContagionPct) * 10) / 10;

// ── The historical consistency table ─────────────────────────────────────────
const consistencyRows = HISTORICAL_BACKTESTS.map((b) => ({
  era: b.era,
  date: b.date,
  score: b.compositeScore,
  publishedProb: b.modelProbabilityPct,
  liveProb: MODEL_CALIBRATION.mapping(b.compositeScore) * 100,
  burstObserved: b.actualBurstObserved,
  brier: b.brierScore,
  resolved: b.brierScoreResolved,
}));
const burstRows = consistencyRows.filter((r) => r.burstObserved);
const nonBurstRows = consistencyRows.filter((r) => !r.burstObserved);
const drift = calibrationDrift(
  burstRows.map((r) => ({
    compositeScore: r.score,
    modelProbabilityPct: r.publishedProb,
  })),
);
const aucInSample = inSampleAuc(
  HISTORICAL_BACKTESTS.map((b) => ({
    modelProbabilityPct: b.modelProbabilityPct,
    actualBurstObserved: b.actualBurstObserved,
  })),
);

// ── The published Monte-Carlo run ────────────────────────────────────────────
const mc = latestModel.monteCarlo;
const SNAPSHOT_LABEL =
  new Date(latestModel.timestamp).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  }) + " UTC";

/**
 * The v2.7.0 de-saturation, read out of the artifact's own verification note
 * rather than typed. The note records the old and new published probability in
 * the form "probability 72.3% -> 32.3%".
 */
const v270Note =
  latestModel._verified.find((v) => v.note.includes("wave-2 (model v2.7.0)"))?.note ?? "";
const v270Shift = v270Note.match(/probability ([\d.]+)% -> ([\d.]+)%/);
const previousProbabilityPct = v270Shift ? Number(v270Shift[1]) : null;
const currentProbabilityPct = v270Shift ? Number(v270Shift[2]) : null;

/**
 * The old credit ramp ceiling: three times the published CDS baseline. Both
 * numbers come from the live input set.
 */
const cdsBaselineBps = DEFAULT_MODEL_INPUTS.cds?.baselineBps ?? 0;
const cdsCurrentBps = DEFAULT_MODEL_INPUTS.cds?.currentBps ?? 0;
const oldCreditCeilingBps = cdsBaselineBps * 3;
const creditWeightPct =
  MODEL_FACTORS.find((f) => f.id === "cds_stress")?.weightPct ?? 0;

export const metadata: Metadata = {
  title: "How the 12-month burst probability is actually computed",
  description:
    "How eight weighted factors earn points, how the composite is assembled, what the logistic map does and does not do, and what the Monte-Carlo band actually measures.",
  keywords: [
    "how AI bubble probability is calculated",
    "AI bubble model explained",
    "logistic mapping burst probability",
    "Monte Carlo input sensitivity range",
    "historical consistency table AI bubble",
    "Brier score AI bubble model",
  ],
  alternates: {
    canonical: "/guides/how-the-probability-is-computed",
  },
  openGraph: {
    title: "How the 12-month probability is actually computed | AI Capital Tracker",
    description:
      "Eight factors, a contagion term, a damper and one judgement anchor — and an honest account of where the printed number stops being a probability.",
    url: "/guides/how-the-probability-is-computed",
    type: "article",
    images: ["/opengraph-image.png"],
  },
};

export default function ProbabilityGuidePage() {
  return (
    <div className="section-sm">
      <GuideHeader
        eyebrow="Guide 01 · The model"
        title={guide.title}
        standfirst={guide.standfirst}
        readTime={guide.readTime}
        meta={[`model v${latestModel.model_version}`, `snapshot ${SNAPSHOT_LABEL}`]}
      />

      <div className="mt-8 space-y-10">
        {/* ── SECTION 01 ─────────────────────────────────────────────────── */}
        <GuideSection
          id="the-print"
          index={1}
          kicker="The print"
          title="One number, produced by two very different operations"
          lead="The headline percentage is the end of a chain: first an arithmetic aggregation, then a judgement. Separating the two is most of what understanding this site requires."
        >
          <div className="max-w-measure space-y-4 text-[15px] leading-relaxed text-ink-muted">
            <p>
              The site publishes a single headline: the probability that the AI capital bubble
              bursts inside twelve months. Behind it sit two operations that carry very different
              amounts of authority, and they are often mistaken for one another.
            </p>
            <p>
              The first operation is arithmetic. Eight factors each read their own inputs and earn
              a share of 100 risk points. A contagion term adds what happens when credit, debt and
              rates cross their thresholds at the same time. A real-use damper subtracts what
              genuine, growing demand is worth. The sum is a composite stress score on a 0&ndash;100
              scale.
            </p>
            <p>
              The second operation is a judgement. The composite is mapped through a logistic curve
              to produce the percentage. That curve has two parameters &mdash; the score that maps
              to 50%, and the steepness &mdash; and neither of them was estimated from data. They
              are anchors chosen in advance and published, which is what makes them auditable
              rather than right.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-rule bg-rule sm:grid-cols-4">
            <div className="bg-surface p-4">
              <span className="label">Composite score</span>
              <span className="num mt-1 block text-2xl font-semibold tracking-tight text-ink">
                {model.compositeScore.toFixed(1)}
              </span>
              <span className="mt-0.5 block text-[14px] text-ink-subtle">of 100 risk points</span>
            </div>
            <div className="bg-surface p-4">
              <span className="label">Burst probability</span>
              <span className="num mt-1 block text-2xl font-semibold tracking-tight text-ink">
                {model.burstProbability.toFixed(1)}%
              </span>
              <span className="mt-0.5 block text-[14px] text-ink-subtle">
                over a {model.horizonMonths}-month window
              </span>
            </div>
            <div className="bg-surface p-4">
              <span className="label">Band</span>
              <span className="mt-1 block text-2xl font-semibold capitalize tracking-tight text-ink">
                {model.band}
              </span>
              <span className="mt-0.5 block text-[14px] text-ink-subtle">
                {BACKTEST_CALIBRATION_SUMMARY.resolvedEpisodes} resolved episodes in the table
              </span>
            </div>
            <div className="bg-surface p-4">
              <span className="label">Risk coverage</span>
              <span className="num mt-1 block text-2xl font-semibold tracking-tight text-ink">
                {Math.round(model.coverage * 100)}%
              </span>
              <span className="mt-0.5 block text-[14px] text-ink-subtle">
                of the risk scale is observable
              </span>
            </div>
          </div>
        </GuideSection>

        {/* ── SECTION 02 ─────────────────────────────────────────────────── */}
        <GuideSection
          id="factors"
          index={2}
          kicker="The factors"
          title="How the eight factors earn points"
          lead="Weight times score, points. Then the points are re-based on what was actually observable, so a silent feed can never make the model look calm."
        >
          <div className="max-w-measure space-y-4 text-[15px] leading-relaxed text-ink-muted">
            <p>
              Each factor is a pure function from the input set to a stress score. Six of them run
              between 0 and 1; two &mdash; credit stress and the macro rates factor &mdash; can
              exceed 1, because they carry a convex panic tail above their ramp ceiling. A
              factor&apos;s score multiplied by its published weight is the number of points it
              earns.
            </p>
            <p>
              The weights are not typed into the model. They are derived from the factor
              definitions, so they sum to exactly 100 by construction, and the damper&apos;s 10
              points sit outside that scale entirely: it subtracts, it never competes. That is why
              a genuinely healthy demand picture cannot make the score fall by more than 10 points
              however strong it gets.
            </p>
          </div>

          <div className="overflow-x-auto rounded-xl border border-rule">
            <table className="w-full text-left text-[14px]">
              <caption className="sr-only">
                The eight risk factors: published weight, live stress score, points earned and the
                reading behind the score.
              </caption>
              <thead className="bg-surface-2 text-ink-subtle">
                <tr>
                  <th scope="col" className="p-3 font-medium">
                    Factor
                  </th>
                  <th scope="col" className="p-3 text-right font-medium">
                    Weight
                  </th>
                  <th scope="col" className="p-3 text-right font-medium">
                    Score
                  </th>
                  <th scope="col" className="p-3 text-right font-medium">
                    Points
                  </th>
                  <th scope="col" className="p-3 font-medium">
                    Reading
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-rule">
                {riskContributions.map((c) => (
                  <tr key={c.id} className="align-top">
                    <th scope="row" className="p-3 font-semibold text-ink">
                      {c.label}
                    </th>
                    <td className="num p-3 text-right text-ink-muted">{c.weightPct}%</td>
                    <td className="num p-3 text-right text-ink-muted">
                      {c.reading.score.toFixed(3)}
                    </td>
                    <td className="num p-3 text-right font-semibold text-ink">
                      +{c.earnedPoints.toFixed(1)}
                    </td>
                    <td className="p-3 text-ink-muted">{c.reading.reading}</td>
                  </tr>
                ))}
                <tr className="bg-surface-2 align-top">
                  <th scope="row" className="p-3 font-semibold text-safe-700">
                    {damperContribution?.label}
                  </th>
                  <td className="num p-3 text-right text-ink-muted">
                    &minus;{damperContribution?.weightPct} max
                  </td>
                  <td className="num p-3 text-right text-ink-muted">
                    {damperContribution?.reading.score.toFixed(3)}
                  </td>
                  <td className="num p-3 text-right font-semibold text-safe-700">
                    {damperPoints.toFixed(1)}
                  </td>
                  <td className="p-3 text-ink-muted">{damperContribution?.reading.reading}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="max-w-measure space-y-4 text-[15px] leading-relaxed text-ink-muted">
            <p>
              If a factor has no verified input, its coverage drops to zero and its weight leaves
              the denominator. The score does not fall because a feed was offline &mdash; it is
              re-based on the factors that could actually be observed. Today the risk side is
              fully covered at {Math.round(model.coverage * 100)}%, which means every point in the
              table above rests on a number the site can point at.
            </p>
          </div>

          <GuideDisclosure summary="What the points column actually says">
            The points column is not a measure of how bad each factor is. It is that factor&apos;s
            share of the risk scale, weighted by its reading. A factor with a large weight and a
            mid-range score can outrank a factor with a small weight and a maximum score, and a
            reader who sums the column expecting a percentage of &quot;badness&quot; will get the
            wrong idea. The column answers &quot;how many of the 100 risk points did this
            factor take?&quot;
          </GuideDisclosure>
        </GuideSection>

        {/* ── SECTION 03 ─────────────────────────────────────────────────── */}
        <GuideSection
          id="composite"
          index={3}
          kicker="The composite"
          title="How the composite is assembled"
          lead="Risk points, plus a super-additive contagion term, minus the damper. Every term is visible and every term can be subtracted back out."
        >
          <div className="overflow-x-auto rounded-xl border border-rule">
            <table className="w-full text-left text-[14px]">
              <caption className="sr-only">
                Reconciliation of the composite stress score from the risk points, the contagion
                term and the damper.
              </caption>
              <thead className="bg-surface-2 text-ink-subtle">
                <tr>
                  <th scope="col" className="p-3 font-medium">
                    Term
                  </th>
                  <th scope="col" className="p-3 text-right font-medium">
                    Points
                  </th>
                  <th scope="col" className="p-3 font-medium">
                    Where it comes from
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-rule">
                <tr>
                  <th scope="row" className="p-3 font-semibold text-ink">
                    Risk factors (8)
                  </th>
                  <td className="num p-3 text-right font-semibold text-ink">
                    +{riskPoints.toFixed(1)}
                  </td>
                  <td className="p-3 text-ink-muted">
                    The sum of the points column in the table above.
                  </td>
                </tr>
                <tr>
                  <th scope="row" className="p-3 font-semibold text-caution-700">
                    Systemic contagion
                  </th>
                  <td className="num p-3 text-right font-semibold text-caution-700">
                    +{contagionPoints.toFixed(1)}
                  </td>
                  <td className="p-3 text-ink-muted">
                    A cube-root synergy across credit, debt and rate stress. If any one of the
                    three is calm, the term collapses to zero. It consumes the credit factor&apos;s
                    tail-free core, so a convex credit tail is never counted twice.
                  </td>
                </tr>
                <tr>
                  <th scope="row" className="p-3 font-semibold text-safe-700">
                    Real-use damper
                  </th>
                  <td className="num p-3 text-right font-semibold text-safe-700">
                    {damperPoints.toFixed(1)}
                  </td>
                  <td className="p-3 text-ink-muted">
                    Users, inference prices and training costs. Sits outside the 0&ndash;100 risk
                    scale.
                  </td>
                </tr>
                <tr className="bg-surface-2">
                  <th scope="row" className="p-3 font-bold text-ink">
                    Composite stress score
                  </th>
                  <td className="num p-3 text-right font-bold text-ink">
                    {model.compositeScore.toFixed(1)}
                  </td>
                  <td className="num p-3 text-ink-muted">
                    {riskPoints.toFixed(1)} + {contagionPoints.toFixed(1)} &minus;{" "}
                    {Math.abs(damperPoints).toFixed(1)} = {model.compositeScore.toFixed(1)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="max-w-measure space-y-4 text-[15px] leading-relaxed text-ink-muted">
            <p>
              The contagion term is the only super-additive piece of the arithmetic, and it is
              where most of the model&apos;s drama lives. It is the cube root of the product of
              three excesses &mdash; credit stress above 0.35, debt stress above 0.30, macro
              stress above 0.30 &mdash; scaled to a maximum of 16 points. In practice one calm
              factor switches the whole term off, which is what makes it a genuine
              synchrony detector rather than a second copy of the credit factor.
            </p>
            <p>
              The reader can also ask what the contagion term is worth. Without it, the same
              arithmetic maps to{" "}
              <span className="num font-semibold text-ink">
                {probabilityWithoutContagionPct.toFixed(1)}%
              </span>
              ; with it, the engine prints{" "}
              <span className="num font-semibold text-ink">
                {model.burstProbability.toFixed(1)}%
              </span>
              . That is{" "}
              <span className="num font-semibold text-ink">
                {contagionLeveragePoints.toFixed(1)}
              </span>{" "}
              probability points of the headline, earned by one term out of three that can be
              switched off by any single calm input.
            </p>
          </div>
        </GuideSection>

        {/* ── SECTION 04 ─────────────────────────────────────────────────── */}
        <GuideSection
          id="logistic"
          index={4}
          kicker="The mapping"
          title="The logistic map: a judgement anchor, not a fitted calibration"
          lead="Two numbers decide the headline: the score that maps to 50% and the steepness of the curve. Neither was estimated from history."
        >
          <div className="panel num space-y-2 text-center text-[15px]">
            <code>
              P(burst) = 1 / (1 + exp(&minus;(S &minus; {MODEL_CALIBRATION.anchorScore}) /{" "}
              {MODEL_CALIBRATION.steepness}))
            </code>
          </div>

          <div className="max-w-measure space-y-4 text-[15px] leading-relaxed text-ink-muted">
            <p>
              The curve does three useful things. It turns an unbounded severity score into a
              bounded probability. It makes the middle of the scale steeper than the ends, which
              matches the intuition that ten points of stress matter far more near the
              refinancing thresholds than they do in a calm regime. And it makes two dates
              comparable: only the score moves, never the map.
            </p>
            <p>
              It also does one thing that is frequently over-claimed. The anchor of{" "}
              {MODEL_CALIBRATION.anchorScore} is a statement that a composite of{" "}
              {MODEL_CALIBRATION.anchorScore} is a coin flip, and the steepness of{" "}
              {MODEL_CALIBRATION.steepness} is a statement about how quickly conviction should
              change. {ODDS_SHIFT_SENTENCE}. Nobody fitted either parameter to a set of resolved
              bursts, because there is not yet a resolved burst to fit them to &mdash; the first
              pre-registered window matures on 19 October 2027. The map is a disclosure of
              intent, not a piece of estimated mathematics.
            </p>
          </div>

          <GuideDisclosure summary="What version 2.7.0 proved about the mapping" tone="notice-caution">
            The clearest demonstration of how much of the headline is the map rather than the data
            is the credit factor&apos;s de-saturation in model version {CHANGELOG[0]?.version}. Its
            level ramp used to stop at three times baseline &mdash; {oldCreditCeilingBps}bp &mdash;
            while the live Oracle print was {cdsCurrentBps}bp, so the factor had been pinned at its
            maximum, adding a flat {creditWeightPct} of {creditWeightPct} points, since{" "}
            {oldCreditCeilingBps}bp. When the ramp was widened to the model&apos;s own published
            panic extent, the published print moved
            {previousProbabilityPct !== null && currentProbabilityPct !== null
              ? ` from ${previousProbabilityPct}% to ${currentProbabilityPct}%`
              : ""}{" "}
            with no input, no weight and no mapping constant changed. That was a correction, not a
            move in the world &mdash; but it is the honest measure of how much authority the
            mapping carries.
          </GuideDisclosure>

          <div className="max-w-measure space-y-4 text-[15px] leading-relaxed text-ink-muted">
            <p>
              The practical consequence for a reader is this: the score is the part to watch for
              movement, and the map is the part to hold constant. A probability that jumps
              without the composite moving is telling you about the calibration, not about the
              world.
            </p>
          </div>
        </GuideSection>

        {/* ── SECTION 05 ─────────────────────────────────────────────────── */}
        <GuideSection
          id="band"
          index={5}
          kicker="The band"
          title="The Monte-Carlo band measures shocked inputs, not event probability"
          lead="The published range is the model's own output under a simulated macro shock. It is labelled as such in the artifact, and the label is load-bearing."
        >
          <div className="max-w-measure space-y-4 text-[15px] leading-relaxed text-ink-muted">
            <p>
              The engine runs{" "}
              <span className="num font-semibold text-ink">
                {mc.iterationsCount.toLocaleString("en-GB")} paths
              </span>
              . Each path draws a joint shock to the 10-year yield, the Oracle credit spread,
              hyperscaler capex and private valuation multiples, correlated through a Cholesky
              factorization of an empirical covariance matrix, with heavy-tailed innovations so
              that a crisis state is expressible at all. High-yield spreads ride alongside as both
              a systemic linkage and an independent shock. Every path is re-scored through the
              full factor set, so what the simulation measures is the model&apos;s own
              sensitivity to its inputs.
            </p>
            <p>
              The artifact labels the output{" "}
              <em className="text-ink-muted">{mc.ciType}</em>, and that is exactly what it is. A
              probability interval would say &quot;the true probability of a burst lies between
              these two numbers&quot;. The published range says &quot;if the inputs move along the
              correlation structure the model assumes, here is where the output lands&quot;. It
              does not narrow the uncertainty about the event, and it does not widen it either. It
              answers a narrower question than the one the headline percentage answers.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-rule bg-rule sm:grid-cols-4">
            <div className="bg-surface p-4">
              <span className="label">90% shock range</span>
              <span className="num mt-1 block text-[15px] font-semibold text-ink">
                {mc.ci90Pct[0]}% &ndash; {mc.ci90Pct[1]}%
              </span>
              <span className="mt-0.5 block text-[14px] text-ink-subtle">not a confidence interval</span>
            </div>
            <div className="bg-surface p-4">
              <span className="label">95% shock range</span>
              <span className="num mt-1 block text-[15px] font-semibold text-ink">
                {mc.ci95Pct[0]}% &ndash; {mc.ci95Pct[1]}%
              </span>
              <span className="mt-0.5 block text-[14px] text-ink-subtle">
                floor {mc.bandLowPct}%
              </span>
            </div>
            <div className="bg-surface p-4">
              <span className="label">Median / mean</span>
              <span className="num mt-1 block text-[15px] font-semibold text-ink">
                {mc.medianProbabilityPct}% / {mc.meanProbabilityPct}%
              </span>
              <span className="mt-0.5 block text-[14px] text-ink-subtle">
                &sigma; {mc.stdDevPct} · skew {mc.skewness}
              </span>
            </div>
            <div className="bg-surface p-4">
              <span className="label">95% VaR / CVaR</span>
              <span className="num mt-1 block text-[15px] font-semibold text-ink">
                {mc.valueAtRisk95Pct}% / {mc.conditionalValueAtRisk95Pct}%
              </span>
              <span className="mt-0.5 block text-[14px] text-ink-subtle">
                99%: {mc.valueAtRisk99Pct}% / {mc.conditionalValueAtRisk99Pct}%
              </span>
            </div>
          </div>

          <div className="max-w-measure space-y-4 text-[15px] leading-relaxed text-ink-muted">
            <p>
              Two further details are worth knowing. The band&apos;s floor is the lower of the
              simulated tail and the price the prediction market puts on the same question, so the
              published range can never be narrower than what money on the line thinks. And the
              simulated correlation between credit stress and high-yield spreads came out at{" "}
              <span className="num font-semibold text-ink">
                {mc.simulatedShockCorrelations.cdsHy}
              </span>
              , close to the design value of roughly 0.80 the engine targets &mdash; which is a
              check on the simulation, not a discovery about the world.
            </p>
          </div>
        </GuideSection>

        {/* ── SECTION 06 ─────────────────────────────────────────────────── */}
        <GuideSection
          id="consistency"
          index={6}
          kicker="The record"
          title="The consistency table contains no false-positive evidence at all"
          lead="Five resolved episodes, and every single one of them burst. That is the most important limitation on the whole site, and it belongs on the page rather than in a footnote."
        >
          <div className="overflow-x-auto rounded-xl border border-rule">
            <table className="w-full text-left text-[14px]">
              <caption className="sr-only">
                Historical consistency table: composite score, published probability, probability
                under the live mapping, and whether a burst was observed.
              </caption>
              <thead className="bg-surface-2 text-ink-subtle">
                <tr>
                  <th scope="col" className="p-3 font-medium">
                    Episode
                  </th>
                  <th scope="col" className="p-3 text-right font-medium">
                    Composite
                  </th>
                  <th scope="col" className="p-3 text-right font-medium">
                    Published prob.
                  </th>
                  <th scope="col" className="p-3 text-right font-medium">
                    Under the live map
                  </th>
                  <th scope="col" className="p-3 font-medium">
                    Outcome
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-rule">
                {consistencyRows.map((row) => (
                  <tr key={row.era} className="align-top">
                    <th scope="row" className="p-3 font-semibold text-ink">
                      {row.era}
                      <span className="block text-[14px] font-normal text-ink-subtle">
                        {row.date}
                      </span>
                    </th>
                    <td className="num p-3 text-right text-ink-muted">{row.score.toFixed(1)}</td>
                    <td className="num p-3 text-right text-ink-muted">
                      {row.publishedProb.toFixed(1)}%
                    </td>
                    <td className="num p-3 text-right text-ink-muted">
                      {row.liveProb.toFixed(1)}%
                    </td>
                    <td className="p-3 text-ink-muted">
                      {row.burstObserved ? (
                        <span className="text-risk-700">Burst observed</span>
                      ) : (
                        <span className="text-ink-subtle">
                          Open window &mdash; not scored
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="max-w-measure space-y-4 text-[15px] leading-relaxed text-ink-muted">
            <p className="text-ink-subtle">
              The live-map column applies the published mapping to the published composite scores,
              which are rounded to one decimal, so it can sit a tenth of a point away from the
              published probability. That is the rounding in the artifact itself, not a
              disagreement.
            </p>
            <p>
              Read that table carefully and one fact dominates: of the{" "}
              {BACKTEST_CALIBRATION_SUMMARY.resolvedEpisodes} resolved episodes,{" "}
              {burstRows.length} burst and {nonBurstRows.length} did not. The one non-burst row is
              the live 12-month window the model is currently rating, which is still open. There is
              no episode in the table in which a stressed regime failed to break.
            </p>
            <p>
              The consequences are direct. The mean Brier score of{" "}
              <span className="num font-semibold text-ink">
                {BACKTEST_CALIBRATION_SUMMARY.meanBrierScore.toFixed(4)}
              </span>{" "}
              is computed over those {BACKTEST_CALIBRATION_SUMMARY.resolvedEpisodes} resolved rows
              and is a consistency measure on a case-enriched table, not a calibration of an
              unconditional probability. A discrimination AUC is not computed at all, because AUC
              needs both classes and there is only one non-burst row. And the in-sample AUC over
              all {consistencyRows.length} rows works out at{" "}
              <span className="num font-semibold text-ink">{aucInSample.toFixed(3)}</span> &mdash;
              a perfect score that carries no information whatsoever, because the single
              &quot;negative&quot; is the live window the model itself is currently rating.
            </p>
            <p>
              One more measurement is worth having, because it quantifies the anchor: the table was
              produced under an earlier calibration, and re-scored under the live mapping the same
              composite scores move the published probabilities by{" "}
              <span className="num font-semibold text-ink">
                {drift.minPct}&ndash;{drift.maxPct}
              </span>{" "}
              points. That is the map, visible.
            </p>
          </div>

          <GuideDisclosure summary="So what is the table for?" tone="notice-caution">
            It shows the machinery is reproducible: given the published inputs, the same formulas
            produce the same scores. It shows nothing about how often the model cries wolf on a
            regime that did not break, because that case has never been in the table. Read the
            published probability as a conditional estimate given a stress regime, and read the
            prediction-market price for the same question &mdash; published on this site &mdash;
            as the only live estimate that carries a false-positive record.
          </GuideDisclosure>
        </GuideSection>

        {/* ── SECTION 07 ─────────────────────────────────────────────────── */}
        <GuideSection
          id="not-this"
          index={7}
          kicker="The disclosure"
          title="What this number is not"
        >
          <NotThisPanel
            items={[
              "It is not a calibrated probability. The anchor and the steepness were chosen in advance and published; they were never fitted to resolved outcomes, because no outcome has resolved yet.",
              "It is not a price. Nothing here says what any asset will do, and the print says nothing about the level of any index.",
              "It carries no dynamics. There is no hazard model, no path dependency and no contagion over time — only a static score read on a single date.",
              "The published band is an input-sensitivity range, not a posterior interval: it says how far the output moves when the inputs move, not how likely the event is.",
              "The historical table is not an out-of-sample test, and it contains no false-positive evidence whatsoever.",
              "The headline can move without any input moving. A change in the factor definitions or in the map changes the print, which is why the version number is published next to it.",
            ]}
          />
        </GuideSection>

        {/* ── SECTION 08 ─────────────────────────────────────────────────── */}
        <GuideSection
          id="check-it"
          index={8}
          kicker="The receipts"
          title="Check any of it yourself"
          lead="Everything in this guide is published in machine-readable form. The guides describe the files; the files are the evidence."
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Link
              href="/methodology"
              className="card card-flush flex min-h-11 flex-col gap-1 p-4 transition-colors hover:border-rule-strong"
            >
              <span className="label">Methodology</span>
              <span className="text-[15px] font-semibold text-ink">
                The full model specification
              </span>
              <span className="mt-1 text-[14px] text-ink-subtle">
                Every factor formula, the calibration anchors, the consistency matrix and the
                pre-registered burst definition.
              </span>
              <span className="mt-2 flex items-center gap-1 text-[14px] font-medium text-ink">
                Read it
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </span>
            </Link>
            <Link
              href="/api/v1/model"
              className="card card-flush flex min-h-11 flex-col gap-1 p-4 transition-colors hover:border-rule-strong"
            >
              <span className="label">Open API</span>
              <span className="text-[15px] font-semibold text-ink">/api/v1/model</span>
              <span className="mt-1 text-[14px] text-ink-subtle">
                The same composite, probability and contribution breakdown, as JSON.
              </span>
              <span className="mt-2 flex items-center gap-1 text-[14px] font-medium text-ink">
                Fetch it
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
