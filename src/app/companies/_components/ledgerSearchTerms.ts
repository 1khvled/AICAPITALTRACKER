import { deals, getDealMeta, type Deal, type DealMeta } from "../../ledger/_components/ledgerData";

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Ledger search terms for the /companies profile links (added 2026-10-19)
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Every profile card links to /ledger?search=<term>. The ledger matches a term
 * against a record's title, description, amount, category, status and the
 * entity the record is filed under, so a profile whose display name is not a
 * substring of any record used to link to an empty result set. Four profiles
 * were affected: "Amazon AWS", "Alphabet / Google", "SpaceX / xAI" and
 * "Northern Data / Rumble" (zero records each), plus "Marvell Technology",
 * whose display name missed the one record that does exist.
 *
 * `LEDGER_SEARCH_TERMS` maps a profile display name to the term that actually
 * matches its records. Every term below was verified against
 * src/data/deals.json (169 records) on 2026-10-19 by replaying the /ledger
 * filter; where two terms were plausible for the same profile the one with
 * more hits was taken. The hit count is recomputed from the dataset at
 * request time, so the number printed on a card is always the number of
 * records the link opens.
 *
 *   profile                 term              hits
 *   Anthropic               Anthropic            16
 *   OpenAI                  OpenAI               29
 *   Oracle                  Oracle                9
 *   CoreWeave               CoreWeave            14
 *   Blackstone              Blackstone           12
 *   Scale AI                Scale AI             11
 *   Microsoft               Microsoft            21
 *   Amazon AWS              Amazon               15   (AWS alone: 13)
 *   Alphabet / Google       Google               23   (Alphabet alone: 5)
 *   Meta Platforms          Meta                 17   ("Meta Platforms": 3)
 *   SpaceX / xAI            xAI                   8   (SpaceX alone: 4)
 *   NVIDIA                  NVIDIA               56
 *   Nebius Group            Nebius                5   ("Nebius Group": 3)
 *   Crusoe Energy           Crusoe                5   ("Crusoe Energy": 4)
 *   Lambda Labs             Lambda                2   ("Lambda Labs": 1)
 *   Northern Data / Rumble  Northern Data        2   (Rumble: 0)
 *   Mistral AI              Mistral AI            4
 *   Databricks              Databricks            3
 *   Marvell Technology      Marvell               1   ("Marvell Technology": 0)
 *   Supermicro              Supermicro            2
 *   Constellation Energy    Constellation         2   ("Constellation Energy": 1)
 *   Talen Energy            Talen Energy          3   ("Talen": 6 — three of them
 *                                                      match the word "talent")
 *
 * One term was rejected despite scoring more hits, because the extra records
 * are not about the company: "Scale" (29 hits — "at scale", "gigawatt-scale",
 * "Scaleup Europe Fund"). Counts here are a 2026-10-19 snapshot kept for the
 * audit trail; the page always prints the live count.
 */

export interface LedgerLink {
  /** The term to put in /ledger?search=. */
  term: string;
  /** How many ledger records that term currently returns. */
  count: number;
}

export const LEDGER_SEARCH_TERMS: Record<string, string | undefined> = {
  Anthropic: "Anthropic",
  OpenAI: "OpenAI",
  Oracle: "Oracle",
  CoreWeave: "CoreWeave",
  Blackstone: "Blackstone",
  "Scale AI": "Scale AI",
  Microsoft: "Microsoft",
  "Amazon AWS": "Amazon",
  "Alphabet / Google": "Google",
  "Meta Platforms": "Meta",
  "SpaceX / xAI": "xAI",
  NVIDIA: "NVIDIA",
  "Nebius Group": "Nebius",
  "Crusoe Energy": "Crusoe",
  "Lambda Labs": "Lambda",
  "Northern Data / Rumble": "Northern Data",
  "Mistral AI": "Mistral AI",
  Databricks: "Databricks",
  "Marvell Technology": "Marvell",
  Supermicro: "Supermicro",
  "Constellation Energy": "Constellation",
  "Talen Energy": "Talen Energy",
};

/**
 * The /ledger filter, replayed exactly (LedgerBrowser.tsx). A term matches a
 * record when it appears in the title, description, amount, category, status,
 * the primary company or one of the counterparties.
 */
function recordMatches(deal: Deal, meta: DealMeta, query: string): boolean {
  return (
    deal.title.toLowerCase().includes(query) ||
    deal.description.toLowerCase().includes(query) ||
    deal.amount_display.toLowerCase().includes(query) ||
    deal.category.toLowerCase().includes(query) ||
    deal.status.toLowerCase().includes(query) ||
    meta.primaryCompany.toLowerCase().includes(query) ||
    meta.counterparties.some((cp) => cp.toLowerCase().includes(query))
  );
}

/**
 * Build the search term plus the live record count for every profile, keyed
 * by the profile display name. Server side only: it reads the whole ledger, so
 * it stays out of the client bundle. A profile whose mapped term returns
 * nothing falls back to its display name; a profile with no match at all is
 * left out, and the browser keeps the name it already had.
 */
export function buildLedgerLinks(names: string[]): Record<string, LedgerLink> {
  const candidates = new Map<string, string[]>();
  const terms = new Set<string>();

  names.forEach((name) => {
    const mapped = LEDGER_SEARCH_TERMS[name];
    const list = mapped && mapped !== name ? [mapped, name] : [name];
    candidates.set(name, list);
    list.forEach((term) => terms.add(term.toLowerCase()));
  });

  const hits = new Map<string, number>();
  terms.forEach((term) => hits.set(term, 0));

  for (let i = 0; i < deals.length; i += 1) {
    const deal = deals[i];
    const meta = getDealMeta(deal);
    terms.forEach((term) => {
      if (recordMatches(deal, meta, term)) {
        hits.set(term, (hits.get(term) ?? 0) + 1);
      }
    });
  }

  const links: Record<string, LedgerLink> = {};
  candidates.forEach((list, name) => {
    const match = list.find((term) => (hits.get(term.toLowerCase()) ?? 0) > 0);
    if (match) {
      links[name] = { term: match, count: hits.get(match.toLowerCase()) ?? 0 };
    }
  });

  return links;
}
