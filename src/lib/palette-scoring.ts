/**
 * The command palette's ranking.
 *
 * A continuous-character fuzzy scorer, in the spirit of fzf and cmdk:
 *
 *   - a RUN of consecutive matching characters scores highest;
 *   - a match that lands on a WORD BOUNDARY scores slightly less;
 *   - a match that has to CROSS A SEPARATOR scores less again;
 *   - a TRANSPOSITION - the reader typed two characters the wrong way round -
 *     still matches, but it scores low.
 *
 * Every skipped character and every case mismatch decays the score slightly,
 * so "core" against "CoreWave" beats "core" against "Core of the Market" only
 * because the first is a shorter, tighter match - not because one of them was
 * in a hard-coded bucket.
 *
 * TOKENS
 * A token is a run of characters between HARD separators (whitespace, a comma,
 * a bracket, a slash, a dash used as a bullet). A period and a dollar sign are
 * NOT separators: "BRK.B" is one token and "$2.87B" is one token, so a reader
 * can type "brk.b" or "brkb" and reach the same ticker.
 *
 * WHY THIS IS A SEPARATE FILE
 * The scorer is pure: no React, no DOM, no browser APIs. It can be reasoned
 * about (and unit-tested) on its own, and the palette component is left with
 * nothing but the rendering.
 */

/** The shape the scorer needs. The palette's own item type satisfies it. */
export interface PaletteTarget {
  /** Stable key for the DOM id and for React. */
  id: string;
  /** What the reader sees. */
  label: string;
  /** One line of context under the label. */
  sub?: string;
  /** Group heading: Pages, Companies, Ledger, Markets. */
  group: string;
  /** Extra terms that should match but are not displayed. */
  keywords?: string;
  /** Default ordering inside a group (lower first). */
  order?: number;
}

/** The house order of the groups, used to break a tie between two groups. */
export const PALETTE_GROUP_ORDER = ["Pages", "Companies", "Ledger", "Markets"];

/* ── The weights ───────────────────────────────────────────────────────────── */

/** A matched character is worth this much before any bonus. */
const MATCH = 100;
/** The bonus for a run of consecutive characters, plus the extra per character. */
const RUN_BASE = 20;
const RUN_STEP = 8;
/** A match that starts a word. */
const BOUNDARY = 30;
/** A match that starts the token. */
const PREFIX = 60;
/** What one skipped character costs. */
const SKIP = 8;
/** The most the skipped characters can cost in total. */
const SKIP_CAP = 48;
/** What one case-mismatched character costs. */
const CASE_MISMATCH = 6;
/** An exact token. */
const EXACT = 1500;
/** The match reached the end of the token. */
const COVERAGE = 60;
/** A transposition: the reader typed two characters the wrong way round. */
const TRANSPOSITION = 40;

/**
 * The field weights. The visible label always wins inside one item, so a
 * ticker never outranks the company it belongs to: the company matches on its
 * LABEL, the ticker on its KEYWORDS.
 */
const WEIGHT_LABEL = 1;
const WEIGHT_KEYWORDS = 0.9;
const WEIGHT_SUB = 0.65;

/**
 * The characters that END a token.
 *
 * "." and "$" are deliberately absent: "BRK.B" and "$2.87B" are one token
 * each, and a reader must be able to type them as one.
 */
const TOKEN_BREAK = /[\s,;|·()[\]<>{}"'/\\—–…]+/g;

/** Leading and trailing punctuation that is trimmed off a token. */
const TOKEN_TRIM = /^[^0-9A-Za-z$]+|[^0-9A-Za-z]+$/g;

/* ── Tokens ────────────────────────────────────────────────────────────────── */

/**
 * Split a string into the tokens the matcher works on. Whitespace and the hard
 * separators break a token; a period, a dollar sign, a hyphen and an ampersand
 * do not.
 */
export function tokenize(value: string): string[] {
  if (!value) return [];
  return value
    .split(TOKEN_BREAK)
    .map((token) => token.replace(TOKEN_TRIM, ""))
    .filter((token) => token.length > 0);
}

/** True when the character is not a letter or a digit. */
function isSeparator(character: string): boolean {
  return !/[0-9A-Za-z]/.test(character);
}

/**
 * True when the character at `index` starts a word: the start of the token, the
 * character after a separator, or the hump of a camelCase name ("CoreWeave").
 */
function isWordStart(token: string, index: number): boolean {
  if (index <= 0) return true;
  const previous = token[index - 1];
  if (isSeparator(previous)) return true;
  const current = token[index];
  return current >= "A" && current <= "Z" && previous >= "a" && previous <= "z";
}

/* ── The matcher ───────────────────────────────────────────────────────────── */

/**
 * Score one query term against one token.
 *
 * Returns 0 when the term does not match at all. The score grows with the
 * tightness of the match: a long consecutive run at the front of the token
 * beats a scattered hit at the back of it.
 */
export function scoreToken(query: string, token: string): number {
  if (!query || !token) return 0;

  const q = query.toLowerCase();
  const t = token.toLowerCase();

  if (q === t) {
    return EXACT + MATCH * q.length + BOUNDARY + PREFIX;
  }

  let score = 0;
  /** Where the next match may start. */
  let cursor = 0;
  /** Where the previous query character matched. */
  let previousIndex = -1;
  /** How long the current run of consecutive characters is. */
  let run = 0;

  for (let qi = 0; qi < q.length; qi += 1) {
    const queryChar = q[qi];

    let found = -1;
    for (let k = cursor; k < t.length; k += 1) {
      if (t[k] === queryChar) {
        found = k;
        break;
      }
    }

    if (found === -1) {
      /**
       * A transposition: the reader typed the last two characters the wrong
       * way round ("co" for "oc"). It still matches - but it matches badly.
       */
      if (
        qi > 0 &&
        previousIndex > 0 &&
        t[previousIndex - 1] === queryChar
      ) {
        score += TRANSPOSITION;
        previousIndex -= 1;
        cursor = previousIndex + 1;
        continue;
      }
      return 0;
    }

    const gap = previousIndex === -1 ? found : found - previousIndex - 1;

    let charScore = MATCH;

    /** A word boundary: the match starts a word. */
    if (isWordStart(token, found)) charScore += BOUNDARY;
    /** A prefix: the match starts the token itself. */
    if (found === 0) charScore += PREFIX;

    if (previousIndex >= 0 && found === previousIndex + 1) {
      /** A run of consecutive characters: the strongest signal there is. */
      run += 1;
      charScore += RUN_BASE + RUN_STEP * run;
    } else {
      run = 0;
      /** Every character the reader skipped costs a little. */
      charScore -= Math.min(gap * SKIP, SKIP_CAP);
    }

    /** A character that matched only because both sides were folded costs a little. */
    if (token[found] !== query[qi]) charScore -= CASE_MISMATCH;

    score += charScore;
    previousIndex = found;
    cursor = found + 1;
  }

  /** The match ran to the end of the token. */
  if (previousIndex === t.length - 1) score += COVERAGE;

  return score;
}

/**
 * Score one query term against a whole field (a label, a keyword string, a
 * subtitle). The term has to match at least one token; the best token wins.
 */
function scoreTerm(field: string, term: string): number {
  const tokens = tokenize(field);
  if (tokens.length === 0) return 0;
  let best = 0;
  for (const token of tokens) {
    const score = scoreToken(term, token);
    if (score > best) best = score;
  }
  return best;
}

/**
 * Score a whole field against every term of the query. A term that matches
 * nothing fails the field: "core we" does not match "CoreWeave" as two terms,
 * it matches it as one.
 */
function scoreField(field: string, terms: string[]): number {
  if (!field) return 0;
  let total = 0;
  for (const term of terms) {
    const best = scoreTerm(field, term);
    if (best === 0) return 0;
    total += best;
  }
  return total;
}

/**
 * Score one item against a query. The visible label is weighted highest, the
 * keywords next, the subtitle last.
 */
export function scorePaletteItem(item: PaletteTarget, terms: string[]): number {
  if (terms.length === 0) return 0;
  const label = scoreField(item.label, terms) * WEIGHT_LABEL;
  const keywords = scoreField(item.keywords ?? "", terms) * WEIGHT_KEYWORDS;
  const sub = scoreField(item.sub ?? "", terms) * WEIGHT_SUB;
  return Math.max(label, keywords, sub);
}

/* ── Ranking ───────────────────────────────────────────────────────────────── */

export interface RankedPaletteItem<T extends PaletteTarget> {
  item: T;
  score: number;
}

export interface PaletteGroup<T extends PaletteTarget> {
  group: string;
  rows: RankedPaletteItem<T>[];
  /** The best score in the group - the group is ordered by this. */
  best: number;
}

/**
 * The query, split into the terms the matcher works on. A query of nothing but
 * separators is an empty query.
 */
export function queryTerms(rawQuery: string): string[] {
  return tokenize(rawQuery);
}

/**
 * Rank the whole index against a query.
 *
 * With an empty query every item scores zero and the house order is kept, so
 * the palette opens on the same list it always did. With a query, the items
 * are ordered by score and everything that does not match is dropped.
 */
export function rankPaletteItems<T extends PaletteTarget>(
  items: T[],
  rawQuery: string,
): RankedPaletteItem<T>[] {
  const terms = queryTerms(rawQuery);

  const scored: RankedPaletteItem<T>[] = [];
  items.forEach((item, index) => {
    const score = terms.length === 0 ? 0 : scorePaletteItem(item, terms);
    if (terms.length > 0 && score <= 0) return;
    scored.push({ item, score });
  });

  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    const groupDiff = groupRank(a.item.group) - groupRank(b.item.group);
    if (groupDiff !== 0) return groupDiff;
    const orderDiff = (a.item.order ?? 0) - (b.item.order ?? 0);
    if (orderDiff !== 0) return orderDiff;
    return a.item.label.localeCompare(b.item.label);
  });

  return scored;
}

/** The house position of a group; an unknown group goes last. */
function groupRank(group: string): number {
  const index = PALETTE_GROUP_ORDER.indexOf(group);
  return index === -1 ? PALETTE_GROUP_ORDER.length : index;
}

/**
 * Group the ranked items.
 *
 * The GROUPS are ordered by their best matching item, not by a hard-coded
 * array: a query that strongly matches a ledger facility puts Ledger first.
 * Inside a group the items keep the score order. The whole list is capped, and
 * the cap is applied in the grouped order so the best group is never the one
 * that gets cut.
 */
export function groupRankedItems<T extends PaletteTarget>(
  ranked: RankedPaletteItem<T>[],
  max: number,
): PaletteGroup<T>[] {
  const byGroup = new Map<string, RankedPaletteItem<T>[]>();
  for (const entry of ranked) {
    const rows = byGroup.get(entry.item.group);
    if (rows) rows.push(entry);
    else byGroup.set(entry.item.group, [entry]);
  }

  const groups: PaletteGroup<T>[] = [];
  byGroup.forEach((rows, group) => {
    let best = 0;
    for (const row of rows) if (row.score > best) best = row.score;
    groups.push({ group, rows, best });
  });

  groups.sort((a, b) => {
    if (b.best !== a.best) return b.best - a.best;
    return groupRank(a.group) - groupRank(b.group);
  });

  const capped: PaletteGroup<T>[] = [];
  let count = 0;
  for (const group of groups) {
    if (count >= max) break;
    const room = max - count;
    const rows = group.rows.slice(0, room);
    if (rows.length === 0) continue;
    count += rows.length;
    capped.push({ group: group.group, rows, best: group.best });
  }

  return capped;
}
