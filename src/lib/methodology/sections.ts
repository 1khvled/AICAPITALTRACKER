/**
 * The methodology article's section registry.
 *
 * ONE list, TWO consumers:
 *   - the article renders its own anchors from it, and
 *   - the table of contents (src/components/MethodologyToc.tsx) renders its
 *     entries from it.
 *
 * Because both read the same array, a section can never exist in the article
 * without a navigation entry (or the other way round): the drift a hand-typed
 * chip bar always suffers from is impossible by construction. The client
 * component still re-reads the live DOM on mount and reconciles against this
 * list, so a section that is added to the page without updating this file
 * still shows up in the table of contents.
 *
 * This module is deliberately free of "use client" and of any browser API, so
 * it can be imported from a server component or a client component alike.
 *
 * The ids are the article's own anchors. They are NOT derived from a slug of
 * the heading text: the page has published these anchors since v2.0 and other
 * routes deep-link into them (/sandbox -> /methodology#classical-models,
 * /visualize -> /methodology#sigmoid), so they are reused verbatim rather
 * than duplicated.
 */

export interface MethodologySection {
  /** The anchor id. Must match the <section id> in the article. */
  id: string;
  /** The article's own section number ("Section 01"). */
  number: string;
  /** The navigation label, carried over from the page's jump bar. */
  label: string;
}

export const METHODOLOGY_SECTIONS: readonly MethodologySection[] = [
  { id: "thesis", number: "01", label: "Empirical Thesis & Axioms" },
  { id: "sigmoid", number: "02", label: "Sigmoid Calibration & Odds" },
  { id: "factors", number: "03", label: "The 9 Mathematical Factors" },
  { id: "contagion", number: "04", label: "Systemic Contagion Synergy" },
  { id: "degradation", number: "05", label: "Degradation Honesty Protocol" },
  { id: "backtests", number: "06", label: "Historical Crisis Backtests" },
  { id: "classical-models", number: "07", label: "Merton, Altman & LPPLS Models" },
  { id: "continuous-pipeline", number: "08", label: "24h Autonomous Execution" },
  { id: "minsky-shiller", number: "09", label: "Minsky Hypothesis & Shiller CAPE" },
];

/** The id of a section by its position, so the page can bind anchors to data. */
export function methodologySectionId(index: number): string {
  return METHODOLOGY_SECTIONS[index]?.id ?? "";
}
