# AICapitalTracker.com

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

Configure:
- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (Server-only; keep confidential)
- `SEC_USER_AGENT` (Format: `AICapitalTracker/1.0 (contact@aicapitaltracker.com)`)

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
