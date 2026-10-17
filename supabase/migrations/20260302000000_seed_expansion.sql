-- Seed Expansion: INTENTIONALLY MINIMAL (no bulk reseed)
--
-- Canonical-data note (seed drift decision, 2026-03-02):
--   * `src/lib/data/dataset.ts` is the canonical verified store for static
--     hosting. It holds the full deal/company/source corpus with citations.
--   * `20260301000001_seed_initial_verified_data.sql` is a minimal bootstrap
--     seed (10 companies / 4 deals / 5 sources) so a fresh Supabase project
--     has real, verified rows to smoke-test RLS + publish-integrity triggers.
--   * Deliberately NOT re-seeding all ~59 dataset deals here: bulk SQL ports
--     of editorial content drift out of sync and risk inserting unverified
--     rows that violate the publish-integrity rule (published deal MUST have
--     >= 1 source citation). Full DB parity, when needed, must go through the
--     admin ingestion pipeline with per-deal source verification, not a dump.
--   * To reduce drift without a reseed, keep this seed's slugs/URLs identical
--     to dataset.ts so both stores agree on the bootstrap subset.
--
-- This migration is a no-op marker so the decision is recorded in migration
-- history. Future expansion migrations (20260302xxxxxx_*) must insert
-- companies + sources + deals + deal_sources + deal_parties atomically per
-- deal to satisfy trg_check_deal_publish / trg_check_deal_sources_publish.

DO $$
BEGIN
    RAISE NOTICE 'seed_expansion: bootstrap seed is minimal by design; dataset.ts remains canonical.';
END
$$;
