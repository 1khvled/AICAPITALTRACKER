/**
 * The guides' section registries.
 *
 * Each guide is 2,300-2,800 words with eight sections, and a reader who
 * arrives from a search result needs a way to see the shape of the argument
 * before they commit to it. The methodology page already has a scroll-spy
 * table of contents; this is the same navigation for the guides, driven from
 * one registry so the list can never drift from the sections that exist.
 *
 * `label` mirrors the section's own eyebrow ("Section 01 - The print") so the
 * first render matches what the reader sees once the table of contents
 * reconciles itself against the live DOM.
 */

export interface GuideSectionRef {
  /** The section's id, which is also its anchor. */
  id: string;
  /** Two-digit section number, as printed. */
  number: string;
  /** The eyebrow the section prints. */
  label: string;
}

export const GUIDE_SECTIONS: Record<string, GuideSectionRef[]> = {
  "how-the-probability-is-computed": [
    { id: "the-print", number: "01", label: "Section 01 · The print" },
    { id: "factors", number: "02", label: "Section 02 · The factors" },
    { id: "composite", number: "03", label: "Section 03 · The composite" },
    { id: "logistic", number: "04", label: "Section 04 · The mapping" },
    { id: "band", number: "05", label: "Section 05 · The band" },
    { id: "consistency", number: "06", label: "Section 06 · The record" },
    { id: "not-this", number: "07", label: "Section 07 · The disclosure" },
    { id: "check-it", number: "08", label: "Section 08 · The receipts" },
  ],
  "reading-ai-credit-stress": [
    { id: "three-series", number: "01", label: "Section 01 · The series" },
    { id: "why-credit", number: "02", label: "Section 02 · The mechanism" },
    { id: "baselines", number: "03", label: "Section 03 · The readings" },
    { id: "credit-into-composite", number: "04", label: "Section 04 · The mechanism" },
    { id: "rates", number: "05", label: "Section 05 · The mechanism" },
    { id: "model-vs-market", number: "06", label: "Section 06 · The disagreement" },
    { id: "not-this", number: "07", label: "Section 07 · The disclosure" },
    { id: "check-it", number: "08", label: "Section 08 · The receipts" },
  ],
  "how-to-read-the-debt-ledger": [
    { id: "anatomy", number: "01", label: "Section 01 · The record" },
    { id: "aggregates", number: "02", label: "Section 02 · The arithmetic" },
    { id: "announced", number: "03", label: "Section 03 · The statuses" },
    { id: "debt-share", number: "04", label: "Section 04 · The ratio" },
    { id: "receipts", number: "05", label: "Section 05 · The receipts" },
    { id: "not-this", number: "06", label: "Section 06 · The disclosure" },
    { id: "check-it", number: "07", label: "Section 07 · The receipts" },
  ],
};
