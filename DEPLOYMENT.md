# Deployment — AI Capital Tracker

## The database question: Supabase required? **No.**

**Decision: deploy to Vercel without a database. Supabase stays optional and pre-wired.**

### Why static-first wins here

| Concern | Static dataset (current) | Supabase-backed reads |
| --- | --- | --- |
| Page speed | Pages prerendered at build, zero DB round-trip | Every render = DB query (even cached, adds latency + egress) |
| Cost | Free (Vercel Hobby/Pro, no DB) | Supabase usage-based, egress on every read |
| Evidence integrity | Data lives in git — versioned, reviewable, auditable per commit | Mutable rows, harder to audit review history |
| Fail mode | Build fails loudly on bad data (typecheck + tests gate the build) | Silent drift between DB and site |
| Fresh data | Daily CI ingest → JSON → review → dataset commit → redeploy | Ingest writes straight to DB (faster, but bypasses review) |

This is a tracker of *verified, editorially reviewed* facts — ~100 deals, not 100k rows. There is no write-path requirement (no comments, no user accounts, no live tickers) that a public-facing DB earns its keep on. The verification policy (`/methodology`) is easier to honor when every change lands as a reviewable commit.

### What works without Supabase
- **All public reads** (deals, companies, relationships, sources, search, visualize): compiled dataset, SSG/ISR — the full build is 200+ prerendered pages.
- **Contact + corrections forms**: POST validates, then *best-effort* persists — Supabase when configured, otherwise a local JSON queue (`data/contact_queue.json`, `data/corrections_queue.json`), and always returns success. On Vercel the file write is ephemeral; wire Supabase (2 env vars below) when form persistence actually matters.

### What flips on when you add Supabase (optional, later)
- `POST /api/contact` → `contact_submissions` table
- `POST /api/corrections` → `corrections` table
- `/admin` deal creation → `deals` table (gated by admin middleware)

Env vars (Vercel → Project → Settings → Environment Variables):
```
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...   # server-side only, never exposed to the browser
```

## Deploy to Vercel

1. Repo is already at https://github.com/1khvled/AICAPITALTRACKER — Vercel → **Add New → Project** → import the repo.
2. Framework auto-detects **Next.js**. No build-command overrides, no `vercel.json` needed.
3. Deploy with zero env vars → the site runs fully static/ISR exactly like `npm run build && npm run start` locally.
4. Every push to `master` auto-deploys. PRs get preview URLs.

## Supabase data, ready when you are

The dataset is already organized into normalized tables matching `supabase/migrations/20260301000000_init_schema.sql`:

```bash
npx tsx scripts/export-tables.ts
```

writes `supabase/export/`:

| File | Rows | Maps to |
| --- | --- | --- |
| `companies.csv` | 79 | `public.companies` |
| `deals.csv` | 102 | `public.deals` |
| `deal_parties.csv` | 198 | `public.deal_parties` |
| `sources.csv` | 134 | `public.sources` |
| `deal_sources.csv` | 133 | `public.deal_sources` |
| `relationships.csv` | 65 | `public.relationships` |
| `relationship_sources.csv` | 65 | `public.relationship_sources` |

Import order matters (FKs): `companies → sources → deals → deal_parties → deal_sources → relationships → relationship_sources`. Any import path works:
- **Supabase Table Editor / Storage upload**: upload CSVs, use "Import data" per table (IDs are already UUIDs, so no remapping).
- **SQL**: `\copy` or `COPY ... FROM '/path.csv' CSV HEADER` via psql connection string.
- **Reproducibility**: regenerate any time — the dataset in `src/lib/data/*.ts` is always the source of truth; the CSVs are derived.

Note: the CSVs intentionally omit the `search_vector` generated columns and row timestamps — Postgres computes those on insert.
