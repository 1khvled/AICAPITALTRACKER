/**
 * Exports the canonical dataset (base + all verified sweep tranches) as
 * normalized CSV tables matching supabase/migrations/20260301000000_init_schema.sql.
 *
 * Output: supabase/export/{companies,deals,deal_parties,sources,deal_sources,relationships,relationship_sources}.csv
 *
 * Usage: npx tsx scripts/export-tables.ts
 */
import { DataRepository } from '../src/lib/data/db';
import fs from 'fs/promises';
import path from 'path';

function csvCell(value: unknown): string {
  if (value === null || value === undefined) return '';
  let s: string;
  if (Array.isArray(value)) s = value.join('|');
  else s = String(value);
  if (/[",\n\r]/.test(s)) s = '"' + s.replace(/"/g, '""') + '"';
  return s;
}

function csvRow(cells: unknown[]): string {
  return cells.map(csvCell).join(',');
}

function writeCsv(header: string[], rows: unknown[][]): string {
  return [csvRow(header), ...rows.map((r) => csvRow(r))].join('\r\n') + '\r\n';
}

async function main() {
  const deals = await DataRepository.getDeals();
  const companies = await DataRepository.getCompanies();
  const rels = await DataRepository.getRelationships();
  const sources = await DataRepository.getSources();

  const out = path.join(process.cwd(), 'supabase', 'export');
  await fs.mkdir(out, { recursive: true });

  // companies.csv — matches public.companies (sans generated search_vector / timestamps)
  await fs.writeFile(
    path.join(out, 'companies.csv'),
    writeCsv(
      ['id', 'name', 'slug', 'aliases', 'description', 'company_type', 'headquarters_country', 'headquarters_city', 'website_url', 'ticker', 'cik', 'is_public'],
      companies.map((c) => [c.id, c.name, c.slug, c.aliases ?? [], c.description, c.company_type, c.headquarters_country, c.headquarters_city, c.website_url, c.ticker, c.cik, c.is_public])
    )
  );

  // deals.csv — matches public.deals
  await fs.writeFile(
    path.join(out, 'deals.csv'),
    writeCsv(
      ['id', 'slug', 'title', 'summary', 'deal_type', 'status', 'announcement_date', 'effective_date', 'maturity_date', 'amount_value', 'amount_currency', 'amount_basis', 'amount_period', 'amount_disclosed', 'geography', 'evidence_level', 'confidence_note', 'is_published', 'published_at', 'last_reviewed_at'],
      deals.map((d) => [
        d.id, d.slug, d.title, d.summary, d.deal_type, d.status, d.announcement_date, d.effective_date ?? null, d.maturity_date ?? null,
        d.amount_value ?? null, d.amount_currency ?? null, d.amount_basis ?? null, d.amount_period ?? null, d.amount_disclosed,
        d.geography ?? null, d.evidence_level, d.confidence_note ?? null, d.is_published, d.published_at ?? null, d.last_reviewed_at ?? null,
      ])
    )
  );

  // deal_parties.csv — matches public.deal_parties
  const partyRows: unknown[][] = [];
  for (const d of deals) {
    for (const p of d.parties ?? []) {
      partyRows.push([p.id, p.deal_id, p.company_id, p.role, p.direction_note ?? null]);
    }
  }
  await fs.writeFile(
    path.join(out, 'deal_parties.csv'),
    writeCsv(['id', 'deal_id', 'company_id', 'role', 'direction_note'], partyRows)
  );

  // sources.csv — matches public.sources (dedup by id; the repository may share sources across deals)
  const srcRows: unknown[][] = [];
  for (const s of sources) {
    srcRows.push([s.id, s.url, s.title, s.publisher ?? null, s.source_type, s.published_date ?? null, s.notes ?? null]);
  }
  await fs.writeFile(
    path.join(out, 'sources.csv'),
    writeCsv(['id', 'url', 'title', 'publisher', 'source_type', 'published_date', 'notes'], srcRows)
  );

  // deal_sources.csv — matches public.deal_sources (PK deal_id+source_id)
  const dsRows: unknown[][] = [];
  const dsSeen = new Set<string>();
  for (const d of deals) {
    for (const ds of d.sources ?? []) {
      const key = `${ds.deal_id}:${ds.source_id}`;
      if (dsSeen.has(key)) continue;
      dsSeen.add(key);
      dsRows.push([ds.deal_id, ds.source_id, ds.supporting_note, ds.is_primary_support]);
    }
  }
  await fs.writeFile(
    path.join(out, 'deal_sources.csv'),
    writeCsv(['deal_id', 'source_id', 'supporting_note', 'is_primary_support'], dsRows)
  );

  // relationships.csv — matches public.relationships
  await fs.writeFile(
    path.join(out, 'relationships.csv'),
    writeCsv(
      ['id', 'from_company_id', 'to_company_id', 'relationship_type', 'start_date', 'end_date', 'description', 'evidence_level', 'is_published'],
      rels.map((r) => [r.id, r.from_company_id, r.to_company_id, r.relationship_type, r.start_date ?? null, r.end_date ?? null, r.description ?? null, r.evidence_level, r.is_published])
    )
  );

  // relationship_sources.csv — matches public.relationship_sources
  const rsRows: unknown[][] = [];
  const rsSeen = new Set<string>();
  for (const r of rels) {
    for (const rs of r.sources ?? []) {
      const key = `${rs.relationship_id}:${rs.source_id}`;
      if (rsSeen.has(key)) continue;
      rsSeen.add(key);
      rsRows.push([rs.relationship_id, rs.source_id, rs.supporting_note]);
    }
  }
  await fs.writeFile(
    path.join(out, 'relationship_sources.csv'),
    writeCsv(['relationship_id', 'source_id', 'supporting_note'], rsRows)
  );

  console.log(
    `exported: companies=${companies.length} deals=${deals.length} deal_parties=${partyRows.length} sources=${srcRows.length} deal_sources=${dsRows.length} relationships=${rels.length} relationship_sources=${rsRows.length}`
  );
  console.log('dir:', out);
}

main();
