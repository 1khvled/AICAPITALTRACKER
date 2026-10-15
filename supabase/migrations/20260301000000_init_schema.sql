-- AICapitalTracker.com Initial Schema Migration
-- Designed for PostgreSQL 15+ / Supabase

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- 1. Admin Users Table (Explicit authorization)
CREATE TABLE IF NOT EXISTS public.admin_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL, -- references auth.users(id)
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL DEFAULT 'editor' CHECK (role IN ('superadmin', 'admin', 'editor')),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. Companies Table
CREATE TABLE IF NOT EXISTS public.companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    aliases TEXT[] DEFAULT '{}',
    description TEXT,
    company_type TEXT NOT NULL CHECK (company_type IN (
        'ai_lab',
        'chipmaker',
        'cloud_provider',
        'data_center_operator',
        'investor',
        'lender',
        'utility_power',
        'infrastructure_equipment',
        'other'
    )),
    headquarters_country TEXT,
    headquarters_city TEXT,
    website_url TEXT,
    ticker TEXT,
    cik TEXT,
    is_public BOOLEAN NOT NULL DEFAULT false,
    search_vector TSVECTOR GENERATED ALWAYS AS (
        to_tsvector('english', coalesce(name, '') || ' ' || coalesce(description, '') || ' ' || coalesce(ticker, '') || ' ' || array_to_string(coalesce(aliases, '{}'), ' '))
    ) STORED,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. Deals Table
CREATE TABLE IF NOT EXISTS public.deals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    summary TEXT NOT NULL,
    deal_type TEXT NOT NULL CHECK (deal_type IN (
        'equity_investment',
        'debt_credit_facility',
        'cloud_compute_contract',
        'infrastructure_project_finance',
        'power_purchase_agreement',
        'acquisition',
        'strategic_partnership',
        'equipment_purchase',
        'other'
    )),
    status TEXT NOT NULL DEFAULT 'announced' CHECK (status IN (
        'proposed',
        'announced',
        'signed',
        'closed',
        'active',
        'cancelled',
        'expired',
        'disputed',
        'unknown'
    )),
    announcement_date DATE,
    effective_date DATE,
    maturity_date DATE,
    amount_value NUMERIC(16, 2),
    amount_currency TEXT DEFAULT 'USD' CHECK (char_length(amount_currency) = 3),
    amount_basis TEXT CHECK (amount_basis IN (
        'cash_investment',
        'credit_facility',
        'contract_value',
        'commitment',
        'project_cost',
        'gpu_collateralized_loan',
        'equity_valuation',
        'other'
    )),
    amount_period TEXT,
    amount_disclosed BOOLEAN NOT NULL DEFAULT false,
    geography TEXT,
    evidence_level TEXT NOT NULL CHECK (evidence_level IN (
        'confirmed_primary',
        'reported_secondary',
        'announced_not_completed',
        'estimated',
        'disputed',
        'superseded'
    )),
    confidence_note TEXT,
    is_published BOOLEAN NOT NULL DEFAULT false,
    published_at TIMESTAMPTZ,
    last_reviewed_at TIMESTAMPTZ,
    search_vector TSVECTOR GENERATED ALWAYS AS (
        to_tsvector('english', coalesce(title, '') || ' ' || coalesce(summary, '') || ' ' || coalesce(deal_type, ''))
    ) STORED,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT chk_deal_dates CHECK (
        (effective_date IS NULL OR announcement_date IS NULL OR effective_date >= announcement_date) AND
        (maturity_date IS NULL OR effective_date IS NULL OR maturity_date >= effective_date)
    )
);

-- 4. Deal Parties (Join Table)
CREATE TABLE IF NOT EXISTS public.deal_parties (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    deal_id UUID NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE RESTRICT,
    role TEXT NOT NULL CHECK (role IN (
        'investor',
        'investee',
        'borrower',
        'lender',
        'customer',
        'supplier',
        'cloud_provider',
        'project_owner',
        'guarantor',
        'utility',
        'partner',
        'counterparty',
        'other'
    )),
    direction_note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_deal_party_role UNIQUE (deal_id, company_id, role)
);

-- 5. Relationships Table
CREATE TABLE IF NOT EXISTS public.relationships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    from_company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    to_company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    relationship_type TEXT NOT NULL CHECK (relationship_type IN (
        'equity_shareholder',
        'cloud_customer',
        'chip_supplier',
        'debt_lender',
        'power_offtaker',
        'strategic_partner',
        'infrastructure_host',
        'other'
    )),
    start_date DATE,
    end_date DATE,
    description TEXT,
    evidence_level TEXT NOT NULL CHECK (evidence_level IN (
        'confirmed_primary',
        'reported_secondary',
        'announced_not_completed',
        'estimated',
        'disputed',
        'superseded'
    )),
    is_published BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT chk_no_self_link CHECK (from_company_id <> to_company_id)
);

-- 6. Sources Table
CREATE TABLE IF NOT EXISTS public.sources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    url TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    publisher TEXT,
    source_type TEXT NOT NULL CHECK (source_type IN (
        'primary_filing',
        'company_release',
        'government_data',
        'regulator_document',
        'reputable_media',
        'research_report',
        'other'
    )),
    published_date DATE,
    accessed_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    content_hash TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 7. Deal Sources (Join Table)
CREATE TABLE IF NOT EXISTS public.deal_sources (
    deal_id UUID NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
    source_id UUID NOT NULL REFERENCES public.sources(id) ON DELETE RESTRICT,
    supporting_note TEXT NOT NULL,
    is_primary_support BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    PRIMARY KEY (deal_id, source_id)
);

-- 8. Relationship Sources (Join Table)
CREATE TABLE IF NOT EXISTS public.relationship_sources (
    relationship_id UUID NOT NULL REFERENCES public.relationships(id) ON DELETE CASCADE,
    source_id UUID NOT NULL REFERENCES public.sources(id) ON DELETE RESTRICT,
    supporting_note TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    PRIMARY KEY (relationship_id, source_id)
);

-- 9. Filings Table (SEC / Official Filings)
CREATE TABLE IF NOT EXISTS public.filings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
    source_id UUID NOT NULL REFERENCES public.sources(id) ON DELETE RESTRICT,
    filing_type TEXT,
    accession_number TEXT,
    filing_date DATE,
    document_url TEXT NOT NULL,
    summary TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 10. Source Registry (Configurable Discovery Sources)
CREATE TABLE IF NOT EXISTS public.source_registry (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    base_url TEXT NOT NULL,
    source_category TEXT NOT NULL CHECK (source_category IN (
        'company_ir',
        'regulator',
        'government_api',
        'grid_operator',
        'press_release_wire',
        'news_publisher',
        'research_site',
        'competitor_discovery',
        'other'
    )),
    access_method TEXT NOT NULL CHECK (access_method IN (
        'official_api',
        'rss_atom',
        'bulk_download',
        'public_html',
        'manual_only'
    )),
    terms_url TEXT,
    robots_url TEXT,
    reuse_policy_status TEXT NOT NULL DEFAULT 'needs_review' CHECK (reuse_policy_status IN (
        'approved_for_configured_access',
        'manual_only',
        'blocked',
        'needs_review'
    )),
    rate_limit_notes TEXT,
    attribution_requirements TEXT,
    adapter_key TEXT,
    is_enabled BOOLEAN NOT NULL DEFAULT false,
    last_policy_checked_at TIMESTAMPTZ,
    last_successful_run_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 11. Discovery Candidates (Private review queue for discovery monitor)
CREATE TABLE IF NOT EXISTS public.discovery_candidates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_site TEXT NOT NULL,
    source_url TEXT NOT NULL,
    page_title TEXT,
    discovered_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    candidate_type TEXT,
    candidate_company_names TEXT[] DEFAULT '{}',
    candidate_summary TEXT,
    outbound_source_urls TEXT[] DEFAULT '{}',
    review_status TEXT NOT NULL DEFAULT 'new' CHECK (review_status IN (
        'new',
        'needs_verification',
        'verified',
        'rejected',
        'blocked_by_policy'
    )),
    review_notes TEXT,
    reviewed_by UUID REFERENCES public.admin_users(id),
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 12. Ingestion / Crawler Runs Log
CREATE TABLE IF NOT EXISTS public.ingestion_runs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_name TEXT NOT NULL,
    adapter_version TEXT,
    started_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    finished_at TIMESTAMPTZ,
    status TEXT NOT NULL CHECK (status IN ('running', 'success', 'failed', 'stopped_by_policy', 'rate_limited')),
    records_seen INTEGER DEFAULT 0,
    records_added INTEGER DEFAULT 0,
    records_updated INTEGER DEFAULT 0,
    error_summary TEXT
);

-- 13. Audit Log
CREATE TABLE IF NOT EXISTS public.audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    actor_user_id UUID,
    entity_type TEXT NOT NULL,
    entity_id UUID NOT NULL,
    action TEXT NOT NULL CHECK (action IN ('insert', 'update', 'delete', 'publish', 'unpublish', 'archive')),
    before_data JSONB,
    after_data JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- =========================================================================
-- INDEXES
-- =========================================================================

CREATE INDEX IF NOT EXISTS idx_companies_slug ON public.companies(slug);
CREATE INDEX IF NOT EXISTS idx_companies_type ON public.companies(company_type);
CREATE INDEX IF NOT EXISTS idx_companies_search ON public.companies USING GIN (search_vector);

CREATE INDEX IF NOT EXISTS idx_deals_slug ON public.deals(slug);
CREATE INDEX IF NOT EXISTS idx_deals_published ON public.deals(is_published);
CREATE INDEX IF NOT EXISTS idx_deals_type ON public.deals(deal_type);
CREATE INDEX IF NOT EXISTS idx_deals_status ON public.deals(status);
CREATE INDEX IF NOT EXISTS idx_deals_announcement_date ON public.deals(announcement_date DESC);
CREATE INDEX IF NOT EXISTS idx_deals_search ON public.deals USING GIN (search_vector);

CREATE INDEX IF NOT EXISTS idx_deal_parties_deal ON public.deal_parties(deal_id);
CREATE INDEX IF NOT EXISTS idx_deal_parties_company ON public.deal_parties(company_id);

CREATE INDEX IF NOT EXISTS idx_relationships_from ON public.relationships(from_company_id);
CREATE INDEX IF NOT EXISTS idx_relationships_to ON public.relationships(to_company_id);
CREATE INDEX IF NOT EXISTS idx_relationships_published ON public.relationships(is_published);

CREATE INDEX IF NOT EXISTS idx_sources_url ON public.sources(url);
CREATE INDEX IF NOT EXISTS idx_discovery_status ON public.discovery_candidates(review_status);

-- =========================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =========================================================================

-- Enable RLS on all tables
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deal_parties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deal_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.relationship_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.filings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.source_registry ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discovery_candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ingestion_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- Helper function: check if authenticated user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.admin_users
        WHERE user_id = auth.uid() AND is_active = true
    );
$$;

-- PUBLIC / ANONYMOUS READ POLICIES

-- Companies: readable if public
CREATE POLICY "Public companies are readable by everyone"
    ON public.companies FOR SELECT
    USING (true);

-- Deals: only published deals are readable by public
CREATE POLICY "Published deals are readable by everyone"
    ON public.deals FOR SELECT
    USING (is_published = true OR public.is_admin());

-- Deal parties: readable if associated deal is published
CREATE POLICY "Deal parties readable if deal is accessible"
    ON public.deal_parties FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.deals d
            WHERE d.id = deal_parties.deal_id AND (d.is_published = true OR public.is_admin())
        )
    );

-- Relationships: only published relationships are readable
CREATE POLICY "Published relationships are readable by everyone"
    ON public.relationships FOR SELECT
    USING (is_published = true OR public.is_admin());

-- Sources: readable by everyone
CREATE POLICY "Sources are readable by everyone"
    ON public.sources FOR SELECT
    USING (true);

-- Deal sources: readable if deal is published
CREATE POLICY "Deal sources readable if deal is accessible"
    ON public.deal_sources FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.deals d
            WHERE d.id = deal_sources.deal_id AND (d.is_published = true OR public.is_admin())
        )
    );

-- Relationship sources: readable if relationship is published
CREATE POLICY "Relationship sources readable if relationship accessible"
    ON public.relationship_sources FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.relationships r
            WHERE r.id = relationship_sources.relationship_id AND (r.is_published = true OR public.is_admin())
        )
    );

-- Filings: readable by everyone
CREATE POLICY "Filings are readable by everyone"
    ON public.filings FOR SELECT
    USING (true);

-- Source registry: public can read enabled sources for transparency
CREATE POLICY "Enabled sources readable by everyone"
    ON public.source_registry FOR SELECT
    USING (is_enabled = true OR public.is_admin());

-- Discovery candidates: NEVER readable by public. Only admin.
CREATE POLICY "Discovery candidates only visible to admins"
    ON public.discovery_candidates FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- Ingestion runs: only visible to admins
CREATE POLICY "Ingestion runs only visible to admins"
    ON public.ingestion_runs FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- Audit log: only visible to admins
CREATE POLICY "Audit logs only visible to admins"
    ON public.audit_log FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- Admin users table: readable/writable only by superadmin or active admin
CREATE POLICY "Admin users visible only to admins"
    ON public.admin_users FOR SELECT
    TO authenticated
    USING (public.is_admin());

-- ADMIN MUTATION POLICIES (INSERT / UPDATE / DELETE)

CREATE POLICY "Admins have full access to companies"
    ON public.companies FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

CREATE POLICY "Admins have full access to deals"
    ON public.deals FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

CREATE POLICY "Admins have full access to deal_parties"
    ON public.deal_parties FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

CREATE POLICY "Admins have full access to relationships"
    ON public.relationships FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

CREATE POLICY "Admins have full access to sources"
    ON public.sources FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

CREATE POLICY "Admins have full access to deal_sources"
    ON public.deal_sources FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

CREATE POLICY "Admins have full access to relationship_sources"
    ON public.relationship_sources FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

CREATE POLICY "Admins have full access to filings"
    ON public.filings FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

CREATE POLICY "Admins have full access to source_registry"
    ON public.source_registry FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- Integrity trigger: published deal MUST have at least one source
CREATE OR REPLACE FUNCTION public.check_deal_publish_integrity()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.is_published = true THEN
        IF NOT EXISTS (SELECT 1 FROM public.deal_sources WHERE deal_id = NEW.id) THEN
            RAISE EXCEPTION 'Cannot publish deal % without at least one verified source citation.', NEW.id;
        END IF;
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_check_deal_publish ON public.deals;
CREATE CONSTRAINT TRIGGER trg_check_deal_publish
    AFTER INSERT OR UPDATE OF is_published ON public.deals
    DEFERRABLE INITIALLY DEFERRED
    FOR EACH ROW
    EXECUTE FUNCTION public.check_deal_publish_integrity();
