// ─────────────────────────────────────────────────────────────────────────────
// The /guides registry.
//
// One file, one job: describe every guide in the section once, so the index
// card, the page header and the "next guide" link at the foot of each article
// can never drift apart. The guide pages import their own entry from here and
// render the same title, standfirst and read time that the index shows.
//
// SERVER-SAFE. No "use client", no browser APIs, no React import — the index
// page, the guide pages and any future server consumer can all read it.
//
// The prose in this file is editorial (titles, promises, questions). Every
// NUMBER lives in the guide pages and is computed there from src/data/*.json
// and the model engine at build time. Nothing here is a figure.
// ─────────────────────────────────────────────────────────────────────────────

export interface GuideEntry {
  /** URL segment under /guides. Also the canonical path. */
  slug: string;
  /** The headline, as it appears on the page and in the index card. */
  title: string;
  /** One line on the index card: what the reader gets out of reading it. */
  promise: string;
  /** The question the guide answers, phrased as a question. */
  question: string;
  /** The deck under the H1 on the guide page itself. */
  standfirst: string;
  /** Estimated reading time, printed as a chip. */
  readTime: string;
  /** Position in the reading order. */
  order: number;
}

export const GUIDES: GuideEntry[] = [
  {
    slug: "how-the-probability-is-computed",
    title: "How the 12-month probability is actually computed",
    promise:
      "Eight factors, one contagion term, one damper and one judgement anchor — and an honest account of where the number stops being a probability.",
    question: "Where does the printed burst probability come from, and what can it not tell me?",
    standfirst:
      "The model turns eight weighted factors into a stress score and maps that score through a logistic curve. Both steps are worth reading closely: the first is arithmetic, the second is a judgement.",
    readTime: "7 min read",
    order: 1,
  },
  {
    slug: "reading-ai-credit-stress",
    title: "Reading AI credit stress: Oracle CDS, high-yield OAS and the 10-year",
    promise:
      "What each of the three credit and rate series measures, why credit leads equities, and how to think about the gap between the model and the prediction market.",
    question: "What are the credit prints actually telling me, and how far should I trust them?",
    standfirst:
      "Three series, three jobs: a single-issuer default swap, a broad junk-bond spread and the government borrowing rate. They are routinely confused with each other, and each one has a blind spot.",
    readTime: "7 min read",
    order: 2,
  },
  {
    slug: "how-to-read-the-debt-ledger",
    title: "How to read the AI debt ledger",
    promise:
      "What a verified facility record contains, what \"announced, not done\" really means, and why the debt share is a share of disclosed capital rather than of the whole market.",
    question: "What does the 169-deal ledger actually measure, and what does it leave out?",
    standfirst:
      "The ledger is the site's evidentiary base: every figure in the model that is not a market price comes from here. It is also a curated sample, and the curation matters.",
    readTime: "6 min read",
    order: 3,
  },
];

/** The canonical path for a guide. */
export function guideHref(slug: string): string {
  return `/guides/${slug}`;
}

/** One guide by slug, or undefined. */
export function getGuide(slug: string): GuideEntry | undefined {
  return GUIDES.find((g) => g.slug === slug);
}

/**
 * The guide that follows this one in reading order. The last guide wraps
 * around to the first, so the foot of every article always offers a way on.
 */
export function nextGuide(slug: string): GuideEntry {
  const index = GUIDES.findIndex((g) => g.slug === slug);
  if (index === -1) return GUIDES[0];
  return GUIDES[(index + 1) % GUIDES.length];
}

/** The guide that comes before this one in reading order. */
export function previousGuide(slug: string): GuideEntry {
  const index = GUIDES.findIndex((g) => g.slug === slug);
  if (index === -1) return GUIDES[GUIDES.length - 1];
  return GUIDES[(index - 1 + GUIDES.length) % GUIDES.length];
}
