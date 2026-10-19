import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { evaluateBubbleModel, DEFAULT_MODEL_INPUTS } from "@/lib/model/engine";
import latestModel from "@/data/latest-model.json";

/**
 * /api — the developer landing page.
 *
 * Short by design: what the API is, how to call it, what it returns, and where
 * the full reference lives. No cartoon badges — just the endpoints, in mono.
 * Route metadata lives in ./layout.tsx.
 */

/** Same expression the root layout uses for metadata/canonical URLs. */
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://aicapitaltracker.com";

const ENDPOINTS: { path: string; what: string; params: string }[] = [
  { path: "/api/v1/model", what: "Burst probability, composite score, confidence band and the factor breakdown", params: "—" },
  { path: "/api/v1/deals", what: "The sourced deal ledger with search, category and debt filters", params: "?search=&category=&debt_only=&limit=&page=&sort=" },
  { path: "/api/v1/factors", what: "Published weights, formulas and calibration anchors", params: "—" },
  { path: "/api/v1/news", what: "Research wire dispatches", params: "?category=&impact=" },
  { path: "/api/v1/sync", what: "Pipeline telemetry and data freshness", params: "—" },
];

const CURL = `curl -s ${SITE_URL}/api/v1/model`;

/**
 * The example is recomputed from the SAME inputs the /api/v1/model route uses
 * (src/data/live-inputs.json via DEFAULT_MODEL_INPUTS), so it cannot drift away
 * from the live endpoint. The route is `force-static`: the payload is rebuilt
 * on deploy from the last 24h sync, it is not a live feed.
 *
 * `generatedAt` is the timestamp of the published pipeline snapshot
 * (src/data/latest-model.json) — the dated rebuild this response comes from.
 */
const model = evaluateBubbleModel(DEFAULT_MODEL_INPUTS);

/** "19 Oct 2026" — derived from the published snapshot timestamp, never hardcoded. */
const SNAPSHOT_DATE = new Date(latestModel.timestamp).toLocaleDateString("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

const RESPONSE = `{
  "success": true,
  "data": {
    "burstProbability": ${model.burstProbability},
    "compositeScore": ${model.compositeScore},
    "band": "${model.band}",
    "horizonMonths": ${model.horizonMonths},
    "generatedAt": "${latestModel.timestamp}"
  }
}`;

export default function ApiLandingPage() {
  return (
    <div className="section-sm">
      <header className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
          <span className="label">Public API</span>
          <span className="pill">REST v1</span>
          <span className="pill pill-safe">No key required</span>
        </div>

        <h1 className="max-w-reading text-3xl font-bold tracking-tight text-ink sm:text-4xl">
          Read the tracker over plain JSON
        </h1>

        <p className="prose prose-lead max-w-reading">
          Five unauthenticated endpoints over HTTP. Same numbers the site renders, recomputed once a day
          at 00:00 UTC from public filings and market feeds. No API key, no SDK, CORS is open.
        </p>
      </header>

      <section aria-labelledby="endpoints" className="mt-8">
        <h2 id="endpoints" className="text-lg font-bold tracking-tight text-ink">
          Endpoints
        </h2>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[34rem] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-rule-strong">
                <th className="py-2 pr-4 font-mono text-[13px] uppercase tracking-wider text-ink-subtle">
                  Path
                </th>
                <th className="py-2 pr-4 font-mono text-[13px] uppercase tracking-wider text-ink-subtle">
                  Returns
                </th>
                <th className="py-2 font-mono text-[13px] uppercase tracking-wider text-ink-subtle">
                  Query
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rule">
              {ENDPOINTS.map((e) => (
                <tr key={e.path}>
                  <td className="num py-2.5 pr-4 font-semibold text-ink">{e.path}</td>
                  <td className="py-2.5 pr-4 text-[14px] leading-relaxed text-ink-muted">{e.what}</td>
                  <td className="num py-2.5 text-[14px] text-ink-subtle">{e.params}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section aria-labelledby="example" className="mt-8">
        <h2 id="example" className="text-lg font-bold tracking-tight text-ink">
          One request
        </h2>
        <pre className="prose-mono mt-3">
          <code>{CURL}</code>
        </pre>
        <p className="mt-3 text-[14px] text-ink-subtle">
          Example response — daily snapshot, data as of {SNAPSHOT_DATE}. The route is
          rebuilt on deploy from the last 24-hour sync, so these are the numbers the
          site renders, not a live feed. The block is abbreviated: the endpoint also
          returns the calibration anchors, the per-factor breakdown and the input
          summary.
        </p>
        <pre className="prose-mono mt-3">
          <code>{RESPONSE}</code>
        </pre>
        <p className="notice notice-caution mt-4">
          <span className="notice-title">Before you build on it</span>
          <span className="mt-1.5 block text-[14px] leading-relaxed">
            Figures are a daily snapshot, not a live feed, and nothing returned is investment advice.
            Rate limit is 1,000 requests an hour. The <span className="num text-ink">format</span>{" "}
            query parameter is accepted for forward compatibility, but the endpoint currently
            returns the full payload.
          </span>
        </p>
      </section>

      <div className="mt-8">
        <Link href="/api-docs" className="btn btn-primary min-h-11">
          <span>Full endpoint reference</span>
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}