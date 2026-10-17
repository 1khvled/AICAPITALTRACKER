# AICapitalTracker.com

<!-- TODO: replace OWNER/REPO with your GitHub org/repo slug -->
[![CI](https://github.com/OWNER/REPO/actions/workflows/ci.yml/badge.svg)](https://github.com/OWNER/REPO/actions/workflows/ci.yml)
[![Daily Ingest](https://github.com/OWNER/REPO/actions/workflows/ingest.yml/badge.svg)](https://github.com/OWNER/REPO/actions/workflows/ingest.yml)

**Transparent, source-backed intelligence tracking financing, credit facilities, cloud commitments, and power agreements for artificial intelligence companies and data center infrastructure.**

---

## 1. Project Overview

AICapitalTracker is a financial intelligence research website and normalized searchable database that answers:
- **Who is financing AI companies and infrastructure?**
- **Which hyperscalers invest in, lend to, or supply services to foundation labs?**
- **What GPU-backed debt facilities, cloud contracts, and power agreements (PPAs) have been publicly disclosed?**
- **What is the exact evidence level behind each claim (`confirmed_primary`, `reported_secondary`, etc.)?**

### Core Principles
- **No Fabricated Estimates:** If a deal amount was undisclosed, it is recorded as *Not Disclosed*. We never convert analyst speculation into confirmed cash amounts.
- **Mandatory Source Citations:** Every published deal requires at least one primary statutory filing (SEC Form 10-K, 10-Q, 8-K), company investor relations release, or verified news citation.
- **Free-Tier Infrastructure:** Built entirely with free-tier infrastructure (Next.js, Supabase Postgres with RLS, Vercel) and public, machine-readable official endpoints (SEC EDGAR, FRED, EIA). No paid APIs or paywalled data brokers.

---

## 2. Technical Stack

- **Framework:** Next.js 15 (App Router, Server-rendered and statically generated SEO pages)
- **Language:** TypeScript 5.7 (Strict mode enabled)
- **Styling:** Tailwind CSS 3.4
- **Backend / Database:** Supabase (PostgreSQL 15+ with pg_trgm, tsvector, and Row Level Security)
- **Validation:** Zod 3.24
- **Testing:** Vitest 3.0
- **Hosting:** Vercel

---

## 3. Directory Structure

```
aicapitaltracker/
├── supabase/
│   └── migrations/
│       ├── 20260301000000_init_schema.sql         # Core schema, RLS policies, full-text indexes
│       └── 20260301000001_seed_initial_verified_data.sql # Verified seed transactions with citations
├── src/
│   ├── app/
│   │   ├── (public pages)
│   │   │   ├── page.tsx                           # Homepage with hero, metrics, deal ledger
│   │   │   ├── deals/                             # /deals and /deals/[slug]
│   │   │   ├── companies/                         # /companies and /companies/[slug]
│   │   │   ├── relationships/                     # /relationships explorer
│   │   │   ├── sources/                           # /sources registry & citations
│   │   │   ├── methodology/                       # /methodology & evidence hierarchy
│   │   │   ├── search/                            # /search global search
│   │   │   ├── about/, corrections/, terms/, privacy/, contact/
│   │   ├── admin/
│   │   │   ├── page.tsx                           # Admin dashboard overview
│   │   │   ├── deals/                             # Deal manager & creation form
│   │   │   └── discovery/                         # Discovery Monitor queue (Section 16)
│   │   ├── api/
│   │   │   ├── admin/deals/route.ts               # Transaction validation & audit API
│   │   │   └── crawlers/sec/route.ts              # SEC EDGAR submissions crawler
│   │   ├── sitemap.ts                             # Dynamic XML sitemap
│   │   ├── robots.ts                              # Robots.txt protecting admin routes
│   │   ├── layout.tsx, globals.css, not-found.tsx, error.tsx, loading.tsx
│   ├── components/
│   │   ├── Navbar.tsx, Footer.tsx, DealTable.tsx, EvidenceBadge.tsx
│   ├── lib/
│   │   ├── types.ts                               # Full TypeScript definitions
│   │   ├── data/db.ts, dataset.ts                 # Unified repository with verified dataset
│   │   ├── validation/deal.ts                     # Zod publish integrity schemas
│   │   └── crawlers/                              # SSRF protection, SEC EDGAR client, discovery monitor
├── tests/
│   ├── deal-validation.test.ts                    # Publish rules, date chronology, amounts
│   ├── ssrf-protection.test.ts                    # Loopback, cloud metadata, IP range checks
│   └── repository.test.ts                         # Querying, filtering, and metric tests
├── package.json, tsconfig.json, tailwind.config.ts, vitest.config.ts, vercel.json
└── README.md
```

---

## 4. Setup and Local Development

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

Configure (see `.env.example` for the full list):
- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (Server-only; keep confidential)
- `NEXT_PUBLIC_SITE_URL` (canonical origin used for sitemap, robots, and metadata)
- `ADMIN_BOOTSTRAP_EMAIL` (one-time first-admin login; see Section 7)
- `SEC_USER_AGENT` (Format: `AICapitalTracker/1.0 (contact@aicapitaltracker.com)`)
- `FRED_API_KEY`, `EIA_API_KEY` (optional; free keys for macro/energy context)

### 3. Run Automated Tests
```bash
npm run test
```

### 4. Typecheck & Build
```bash
npm run typecheck
npm run build
```

### 5. Launch Local Dev Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the application.

---

## 5. Database Migrations (Supabase)

To apply migrations to your Supabase project:
1. Link your Supabase project:
   ```bash
   npx supabase link --project-ref <your-project-ref>
   ```
2. Apply the version-controlled SQL migrations:
   ```bash
   npx supabase db push
   ```
   Or run `supabase/migrations/20260301000000_init_schema.sql` and `supabase/migrations/20260301000001_seed_initial_verified_data.sql` in the Supabase SQL Editor.

---

## 6. Vercel Deployment

1. Push your repository to GitHub.
2. In the Vercel Dashboard, select **Import Project** and choose the repository.
3. Configure the environment variables from `.env.example` in Vercel Project Settings.
4. Deploy!

---

## 7. Admin Bootstrap (First Admin Access)

`/admin` and `/api/admin/*` are gated by Supabase Auth plus the `admin_users`
table (see `middleware.ts` and `src/app/api/admin/deals/route.ts`).
To grant the first admin:

1. Create the user in Supabase Auth (Dashboard → Authentication → Add user).
2. Set `ADMIN_BOOTSTRAP_EMAIL` to that user's email in `.env.local` / Vercel.
3. Sign in with that email — the bootstrap address bypasses the
   `admin_users` check exactly once for setup.
4. Insert a permanent row so access survives bootstrap removal:
   ```sql
   insert into public.admin_users (user_id, email, role)
   values ('<auth.users.id>', 'admin@aicapitaltracker.com', 'superadmin');
   ```
5. Remove or rotate `ADMIN_BOOTSTRAP_EMAIL` after the first admin row exists.
   All subsequent admins are added via `admin_users` rows only.

Without Supabase configured, the site runs in local dataset mode and
admin writes return `persisted: false` (validated but not stored).

---

## 8. Data Source of Truth (Dataset vs Seed Drift Rule)

Public pages (`/`, `/deals`, `/companies`, sitemap, `generateStaticParams`)
read exclusively from the versioned local store
`src/lib/data/dataset.ts` (`VERIFIED_DEALS`, `VERIFIED_COMPANIES`,
`VERIFIED_RELATIONSHIPS`, `VERIFIED_SOURCES`). Supabase is the durable
write target for admin-created deals, not the public read path.

Keep the two in sync or the public site drifts from the database:

- Every admin-published deal must also be appended to `dataset.ts`
  (and to `supabase/migrations/20260301000001_seed_initial_verified_data.sql`
  for fresh environments).
- `npm run build` statically generates deal/company paths from the dataset
  (currently 59 deals / 64 companies) — redeploy after dataset edits.
- `tests/data-integrity.test.ts` guards slug uniqueness, counterparty
  references, and citation presence; run `npm run test` before publishing.

---

## 9. Fresh-Data Ingestion (`npm run ingest`)

`scripts/ingest.ts` is the single entry point for fresh SEC EDGAR data. It is
free (no API key), cross-platform (`tsx` is a committed devDependency, so the
`npm run ingest` script works unchanged on Windows, macOS, and Linux), and
safe to run on a schedule via `.github/workflows/ingest.yml` (daily 06:00 UTC).

```bash
npm run ingest                        # last 30 days, writes data/*.json
npm run ingest -- --since 2026-09-16  # explicit cutoff date (YYYY-MM-DD)
npm run ingest -- --since 7           # last 7 days (days count also accepted)
npm run ingest -- --since 7 --dry-run # fetch + log only, writes nothing
npx tsx scripts/ingest.ts --help      # full CLI reference
```

What it does:

- Fetches SEC EDGAR submissions JSON for 9 tracked issuers (NVDA, MSFT, AMZN,
  GOOGL, META, ORCL, CEG, TLN, VST) with polite fair-access delays
  (~300 ms between requests) and a `SEC_USER_AGENT` header (see `.env.example`).
- Keeps forms 8-K / 10-Q / 10-K filed since the cutoff, and flags the
  AI-infra-relevant subset via 8-K items (1.01, 7.01, 8.01) or keywords
  (AI / data center / GPU / power / ...) matched against EDGAR descriptions.
- Writes `data/fresh_filings.json` (filing metadata), merges review candidates
  into `data/discovery_queue.json` (deduplicated by accession number), and
  records every attempt in `data/ingest_status.json` — including SEC blocks
  (403/429), which preserve existing files instead of wiping them.
- **Never fabricates deals or amounts**: only real filing metadata
  (`cik`, `form`, `filed_at`, `accession`, `primary_doc_url`, `items`, `title`)
  is stored. Candidates stay quarantined until an editor verifies the primary
  document and creates a deal manually.

The public site reads these files via `src/lib/data/fresh.ts`
(`getFreshFilings()`, `getFreshDiscovery()`, `getPlatformFreshness()`), which
powers the "Data as of" badge on the homepage hero and the freshness panel on
`/sources`. When the JSON files are absent, both surfaces fall back gracefully
to the static verified dataset — nothing crashes.
