import React from "react";

/**
 * The crowd's price, drawn by hand.
 *
 * No chart library on this site. The geometry is the same idiom the
 * /markets widget uses (one SVG, a grid, two polyline series, dot markers),
 * but this one carries ONLY the two AI-bubble series, because that is the
 * question this page answers.
 *
 * Server component: it renders static SVG, so a crawler, a reader with
 * JavaScript switched off and a print export all see the same chart. There is
 * no animation here at all, so the reduced-motion switch in globals.css has
 * nothing to switch off.
 *
 * COLOURS: SVG needs literal values, so the two semantic series colours are
 * mirrored from tailwind.config.ts (risk-500 for the 2026 contract, caution-500
 * for the 2027 contract). Every axis/gridline colour uses the CSS-variable
 * ink and rule tokens, so the chart reads correctly in BOTH themes.
 */

export interface CrowdTrendPoint {
  /** The published label, e.g. "Jan 2024". */
  date: string;
  /** The axis label — the date without the "(Live)" marker. */
  label: string;
  /** YES odds on the Dec-2026 contract, %. */
  aiBubble2026: number;
  /** YES odds on the Jun-2027 contract, %. */
  aiBubble2027: number;
  /** True for the final point — the live snapshot rather than published history. */
  live: boolean;
}

const SERIES = {
  /** tailwind risk-500 */
  risk500: "#D1433C",
  /** tailwind caution-500 */
  caution500: "#B57F0A",
} as const;

/**
 * The figure is authored at a FIXED pixel size (width === viewBox width), so
 * the SVG never scales: the axis type is always exactly what it is set to
 * (13px / 12px), on every viewport, in both themes. A scaled SVG would shrink
 * its own labels below the site's 12px metadata floor on a phone; instead the
 * figure keeps its size and the panel scrolls sideways on a narrow screen.
 */
const WIDTH = 960;
const HEIGHT = 340;
const PAD = { top: 26, right: 40, bottom: 54, left: 80 };
const INNER_W = WIDTH - PAD.left - PAD.right;
const INNER_H = HEIGHT - PAD.top - PAD.bottom;

export function CrowdTrendChart({
  points,
  caption,
  liveNote,
}: {
  points: CrowdTrendPoint[];
  /** The caption printed under the figure. */
  caption: string;
  /** The live snapshot note printed beside the legend. */
  liveNote: string;
}) {
  if (points.length < 2) return null;

  // The y-axis is scaled to the data with 10% headroom, rounded to a 5-point
  // step. Nothing is clipped and nothing is exaggerated.
  const peak = Math.max(
    ...points.map((p) => Math.max(p.aiBubble2026, p.aiBubble2027)),
  );
  const yMax = Math.max(10, Math.ceil((peak * 1.1) / 5) * 5);
  const ticks: number[] = [];
  for (let v = 0; v <= yMax; v += 5) ticks.push(v);

  const x = (i: number) => PAD.left + (i / (points.length - 1)) * INNER_W;
  const y = (v: number) => PAD.top + INNER_H - (v / yMax) * INNER_H;

  const polyline = (key: "aiBubble2026" | "aiBubble2027") =>
    points
      .map(
        (p, i) =>
          `${i === 0 ? "M" : "L"} ${x(i).toFixed(1)} ${y(p[key]).toFixed(1)}`,
      )
      .join(" ");

  const last = points[points.length - 1];

  return (
    <figure className="m-0 space-y-3">
      {/* Legend */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[14px]">
        <span className="flex items-center gap-1.5 whitespace-nowrap text-ink-muted">
          <span
            className="h-0.5 w-4 shrink-0"
            style={{ backgroundColor: SERIES.risk500 }}
            aria-hidden="true"
          />
          <span>AI bubble 2026 — {last.aiBubble2026.toFixed(1)}% today</span>
        </span>
        <span className="flex items-center gap-1.5 whitespace-nowrap text-ink-muted">
          <span
            className="h-0.5 w-4 shrink-0"
            style={{ backgroundColor: SERIES.caution500 }}
            aria-hidden="true"
          />
          <span>AI bubble 2027 — {last.aiBubble2027.toFixed(1)}% today</span>
        </span>
        <span className="num text-ink-faint">{liveNote}</span>
      </div>

      <div className="overflow-x-auto rounded-xl border border-rule bg-surface-2 p-3 sm:p-4">
        <svg
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          width={WIDTH}
          height={HEIGHT}
          className="mx-auto block select-none"
          role="img"
          aria-labelledby="crowd-trend-title crowd-trend-desc"
        >
          <title id="crowd-trend-title">
            Prediction-market odds on an AI industry bubble, 2026 and 2027 contracts
          </title>
          <desc id="crowd-trend-desc">
            {points
              .map(
                (p) =>
                  `${p.date}: ${p.aiBubble2026.toFixed(1)}% on the 2026 contract, ${p.aiBubble2027.toFixed(1)}% on the 2027 contract.`,
              )
              .join(" ")}
          </desc>

          {/* Horizontal gridlines + the y axis */}
          {ticks.map((v) => (
            <g key={v}>
              <line
                x1={PAD.left}
                y1={y(v)}
                x2={WIDTH - PAD.right}
                y2={y(v)}
                stroke="rgb(var(--c-rule))"
                strokeDasharray={v === 0 ? "none" : "3 3"}
                strokeWidth={v === 0 ? 1.5 : 1}
              />
              <text
                x={PAD.left - 10}
                y={y(v) + 4}
                textAnchor="end"
                className="num fill-ink-muted"
              >
                {v}%
              </text>
            </g>
          ))}

          {/* The x axis: one date label per published observation. Every label
              is centred, and the padding is wide enough that the first and
              last labels still sit inside the frame. */}
          {points.map((p, i) => (
            <text
              key={p.date}
              x={x(i)}
              y={HEIGHT - PAD.bottom + 20}
              textAnchor="middle"
              className="num fill-ink-subtle"
              style={{ fontSize: 13 }}
            >
              {p.label}
            </text>
          ))}

          {/* Axis titles */}
          <text
            x={PAD.left}
            y={14}
            textAnchor="start"
            className="num fill-ink-faint"
            style={{ fontSize: 12 }}
          >
            YES odds (%)
          </text>
          <text
            x={WIDTH - PAD.right}
            y={HEIGHT - 8}
            textAnchor="end"
            className="num fill-ink-faint"
            style={{ fontSize: 12 }}
          >
            Date
          </text>

          {/* The two series */}
          <path
            d={polyline("aiBubble2026")}
            fill="none"
            stroke={SERIES.risk500}
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d={polyline("aiBubble2027")}
            fill="none"
            stroke={SERIES.caution500}
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Point markers — the last one is ringed, because it is the live one */}
          {points.map((p, i) => (
            <g key={p.date}>
              <title>
                {`${p.date} — 2026 contract ${p.aiBubble2026.toFixed(1)}% YES, 2027 contract ${p.aiBubble2027.toFixed(1)}% YES`}
              </title>
              {p.live ? (
                <circle
                  cx={x(i)}
                  cy={y(p.aiBubble2026)}
                  r={6}
                  fill="none"
                  stroke={SERIES.risk500}
                  strokeWidth={1.5}
                />
              ) : null}
              {p.live ? (
                <circle
                  cx={x(i)}
                  cy={y(p.aiBubble2027)}
                  r={6}
                  fill="none"
                  stroke={SERIES.caution500}
                  strokeWidth={1.5}
                />
              ) : null}
              <circle cx={x(i)} cy={y(p.aiBubble2026)} r={3} fill={SERIES.risk500} />
              <circle cx={x(i)} cy={y(p.aiBubble2027)} r={3} fill={SERIES.caution500} />
            </g>
          ))}
        </svg>
      </div>

      <figcaption className="text-[14px] leading-relaxed text-ink-subtle">
        {caption}
      </figcaption>

      {/* The same numbers as a table, so every point on the chart is readable
          without an SVG and a screen reader. */}
      <div className="overflow-x-auto rounded-xl border border-rule">
        <table className="w-full text-left text-[14px]">
          <caption className="sr-only">
            The published prediction-market history: the YES price of the December 2026 and
            June 2027 AI bubble contracts at each observation date.
          </caption>
          <thead className="bg-surface-2 text-ink-subtle">
            <tr>
              <th scope="col" className="p-3 font-medium">
                Date
              </th>
              <th scope="col" className="p-3 text-right font-medium">
                2026 contract
              </th>
              <th scope="col" className="p-3 text-right font-medium">
                2027 contract
              </th>
              <th scope="col" className="p-3 text-right font-medium">
                Source
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-rule">
            {points.map((p) => (
              <tr key={p.date}>
                <th scope="row" className="p-3 font-semibold text-ink">
                  {p.date}
                </th>
                <td className="num p-3 text-right text-ink-muted">
                  {p.aiBubble2026.toFixed(1)}%
                </td>
                <td className="num p-3 text-right text-ink-muted">
                  {p.aiBubble2027.toFixed(1)}%
                </td>
                <td className="p-3 text-right text-ink-subtle">
                  {p.live ? "Live snapshot" : "Published history"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </figure>
  );
}
