/**
 * Chart accessibility helpers.
 * ---------------------------------------------------------------------------
 * The charts on this site are hand-rolled SVG: no chart library, no
 * dependency to add. That means the accessibility layer is hand-rolled too,
 * and it has to live somewhere the chart components can share.
 *
 * This module is the single place where the three rules live:
 *
 *   1. A chart is ONE image to a screen reader. The <svg> carries
 *      role="img" and points at a <title> (its accessible name) and a <desc>
 *      (its long description). The description is never hand-written: it is
 *      DERIVED from the same data array the marks are drawn from, so it can
 *      never drift from the picture. See generateChartDescription().
 *
 *   2. Every chart also ships a real <table> with the same numbers, so the
 *      data survives an SVG that no screen reader can read. See
 *      ChartDataTable.
 *
 *   3. A chart that changes announces the change politely, never
 *      assertively. See ChartAnnouncer.
 *
 * The house template for all of this is
 * src/app/prediction-markets/_components/CrowdTrendChart.tsx — a <figure>
 * wrapping a role="img" <svg> with a <title>, a <desc>, per-point <title>
 * elements, aria-hidden chrome, and a real <table> fallback underneath.
 *
 * NOTE ON THE FILE LAYOUT: this file is .ts because it holds no JSX. The two
 * React components live next door in chart-a11y-components.tsx (JSX needs a
 * .tsx) and are re-exported from here, so a chart only ever imports from
 * "@/lib/chart-a11y".
 */

import type React from "react";

export { ChartAnnouncer, ChartDataTable } from "./chart-a11y-components";

/* ── 1. The ARIA props for a chart <svg> ──────────────────────────────────── */

/**
 * The role an accessible chart wears.
 *
 * "img" is the default and the right one for a chart that is read as a
 * picture: the screen reader announces the name and the description and
 * leaves the geometry alone.
 *
 * "graphics-document" is the data-mode role — while a reader is walking the
 * marks with the arrow keys the <svg> becomes a graphics document, so the
 * individual marks (role="graphics-symbol") stay in the accessibility tree
 * instead of being flattened into one image. It is also the context role the
 * ARIA graphics module asks for.
 */
export type ChartRole = "img" | "group" | "graphics-document";

export interface ChartAriaOptions {
  /** The accessible name of the chart. */
  title: string;
  /** The long description. Normally generateChartDescription(). */
  description?: string;
  /** The id of the element that holds the accessible name (the <title>). */
  labelledBy?: string;
  /** The id of the element that holds the long description (the <desc>). */
  describedBy?: string;
  /** Defaults to "img". Charts in data mode pass "graphics-document". */
  role?: ChartRole;
}

/**
 * The ARIA props for a chart <svg>: role, aria-labelledby and
 * aria-describedby.
 *
 * The ids are passed in rather than invented here so the caller stays the
 * single owner of the <title> / <desc> elements — the helper cannot fall out
 * of step with the markup that renders them.
 *
 * When no id is given the helper falls back to aria-label (for the name) and
 * aria-description (for the description), so a chart is never left with an
 * unnamed image.
 */
export function getChartAriaProps({
  title,
  description,
  labelledBy,
  describedBy,
  role = "img",
}: ChartAriaOptions): React.SVGProps<SVGSVGElement> {
  const props: Record<string, unknown> = { role };

  if (labelledBy) {
    props["aria-labelledby"] = labelledBy;
  } else {
    props["aria-label"] = title;
  }

  if (describedBy) {
    props["aria-describedby"] = describedBy;
  } else if (description) {
    // ARIA 1.3 fallback for a description that has no element to point at.
    props["aria-description"] = description;
  }

  return props as React.SVGProps<SVGSVGElement>;
}

/* ── 2. The derived chart description ─────────────────────────────────────── */

/** One point on a chart: an x-axis label and a y value. */
export interface ChartPoint {
  /** The x-axis label, e.g. "Jan 2024". */
  x: string;
  /** The y value. */
  y: number;
}

/** One line of a multi-series chart. */
export interface ChartSeries {
  /** The name of the series, e.g. "AI Bubble 2026 odds". */
  name: string;
  /** The points of the series, in the order they are drawn. */
  points: readonly ChartPoint[];
}

/**
 * "line" for a time series, "scatter" for a set of loose points, "category"
 * for a set of sized rectangles (a treemap). The kind only changes the noun
 * and whether the first/last points are named — the shape of the sentence is
 * the same either way.
 */
export type ChartDescriptionKind = "line" | "scatter" | "category";

export interface ChartDescriptionOptions {
  /** The chart title. The description is built around it. */
  title: string;
  /** The points of a single-series chart. */
  points?: readonly ChartPoint[];
  /** The series of a multi-series chart. */
  series?: readonly ChartSeries[];
  /** Defaults to "line". */
  kind?: ChartDescriptionKind;
  /** The unit appended by the default formatter, e.g. "%". */
  unit?: string;
  /** Formats a value for the sentence. Defaults to a plain number + unit. */
  formatValue?: (value: number) => string;
}

const KIND_NOUN: Record<ChartDescriptionKind, string> = {
  line: "Line chart",
  scatter: "Scatter plot",
  category: "Category chart",
};

/** 2.4 -> "2.4", 10 -> "10", 9.05 -> "9.05". */
function defaultFormatNumber(value: number): string {
  if (!Number.isFinite(value)) return "not available";
  if (Number.isInteger(value)) return String(value);
  return value.toFixed(4).replace(/0+$/, "").replace(/\.$/, "");
}

/**
 * Build the long description of a chart FROM THE DATA THE CHART DRAWS.
 *
 * The caller passes the same array it maps over to place the marks, so the
 * sentence cannot drift from the picture: a point that is added to the chart
 * is a point that is counted here, and the first, last, minimum and maximum
 * are read off the same array.
 *
 *   line:     "Line chart of <title>. N points. First <x> (<y>), last <x> (<y>), range <min> to <max>."
 *   scatter:  "Scatter plot of <title>. N points. Values range from <min> to <max>."
 *   category: "Category chart of <title>. N points. Values range from <min> to <max>."
 *
 * A multi-series chart gets one clause per series.
 */
export function generateChartDescription({
  title,
  points,
  series,
  kind = "line",
  unit = "",
  formatValue,
}: ChartDescriptionOptions): string {
  const fmt = formatValue ?? ((value: number) => `${defaultFormatNumber(value)}${unit}`);
  const noun = KIND_NOUN[kind];

  const list: readonly ChartSeries[] =
    series && series.length > 0 ? series : [{ name: "", points: points ?? [] }];

  const first0 = list[0];
  if (!first0 || first0.points.length === 0) {
    return `${noun} of ${title}. No data points.`;
  }

  if (list.length === 1) {
    const s = first0;
    const values = s.points.map((p) => p.y);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const first = s.points[0];
    const last = s.points[s.points.length - 1];

    if (kind === "line") {
      return `${noun} of ${title}. ${s.points.length} points. First ${first.x} (${fmt(
        first.y
      )}), last ${last.x} (${fmt(last.y)}), range ${fmt(min)} to ${fmt(max)}.`;
    }
    return `${noun} of ${title}. ${s.points.length} points. Values range from ${fmt(
      min
    )} to ${fmt(max)}.`;
  }

  const clauses = list.map((s) => {
    const values = s.points.map((p) => p.y);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const first = s.points[0];
    const last = s.points[s.points.length - 1];
    return `${s.name}: ${s.points.length} points, first ${first.x} (${fmt(
      first.y
    )}), last ${last.x} (${fmt(last.y)}), range ${fmt(min)} to ${fmt(max)}.`;
  });

  return `${noun} of ${title}. ${list.length} series. ${clauses.join(" ")}`;
}

/* ── 3. The two React components ──────────────────────────────────────────── */

export interface ChartDataTableProps {
  /** The caption. It is the table's accessible name and is always hidden visually. */
  caption: string;
  /** The column headers, in order. */
  columns: readonly string[];
  /** The rows. The first cell of every row becomes that row's header. */
  rows: ReadonlyArray<ReadonlyArray<string | number>>;
  /**
   * Show the table. When false (the default) the table is available to
   * assistive technology only — which is what a 169-row chart wants.
   */
  visible?: boolean;
  /**
   * The indices of the columns that hold figures. They are right-aligned
   * and set in the tabular-figures face, like every other number on the
   * site. A cell that is a plain number is aligned this way anyway.
   */
  numericColumns?: readonly number[];
  /** Extra classes for the visible wrapper. */
  className?: string;
}

export interface ChartAnnouncerProps {
  /** The message to announce. */
  message: string;
  /** The classes of the region. Defaults to a visually hidden region. */
  className?: string;
}
