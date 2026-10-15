export type CompanyType =
  | 'ai_lab'
  | 'chipmaker'
  | 'cloud_provider'
  | 'data_center_operator'
  | 'investor'
  | 'lender'
  | 'utility_power'
  | 'infrastructure_equipment'
  | 'other';

export type DealType =
  | 'equity_investment'
  | 'debt_credit_facility'
  | 'cloud_compute_contract'
  | 'infrastructure_project_finance'
  | 'power_purchase_agreement'
  | 'acquisition'
  | 'strategic_partnership'
  | 'equipment_purchase'
  | 'other';

export type DealStatus =
  | 'proposed'
  | 'announced'
  | 'signed'
  | 'closed'
  | 'active'
  | 'cancelled'
  | 'expired'
  | 'disputed'
  | 'unknown';

export type AmountBasis =
  | 'cash_investment'
  | 'credit_facility'
  | 'contract_value'
  | 'commitment'
  | 'project_cost'
  | 'gpu_collateralized_loan'
  | 'equity_valuation'
  | 'other';

export type EvidenceLevel =
  | 'confirmed_primary'
  | 'reported_secondary'
  | 'announced_not_completed'
  | 'estimated'
  | 'disputed'
  | 'superseded';

export type DealPartyRole =
  | 'investor'
  | 'investee'
  | 'borrower'
  | 'lender'
  | 'customer'
  | 'supplier'
  | 'cloud_provider'
  | 'project_owner'
  | 'guarantor'
  | 'utility'
  | 'partner'
  | 'counterparty'
  | 'other';

export type RelationshipType =
  | 'equity_shareholder'
  | 'cloud_customer'
  | 'chip_supplier'
  | 'debt_lender'
  | 'power_offtaker'
  | 'strategic_partner'
  | 'infrastructure_host'
  | 'other';

export type SourceType =
  | 'primary_filing'
  | 'company_release'
  | 'government_data'
  | 'regulator_document'
  | 'reputable_media'
  | 'research_report'
  | 'other';

export interface Company {
  id: string;
  name: string;
  slug: string;
  aliases: string[];
  description: string | null;
  company_type: CompanyType;
  headquarters_country: string | null;
  headquarters_city?: string | null;
  website_url?: string | null;
  ticker: string | null;
  cik: string | null;
  is_public: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Source {
  id: string;
  url: string;
  title: string;
  publisher: string | null;
  source_type: SourceType;
  published_date: string | null;
  accessed_at: string;
  content_hash?: string | null;
  notes?: string | null;
  created_at?: string;
}

export interface DealSource {
  deal_id: string;
  source_id: string;
  supporting_note: string;
  is_primary_support: boolean;
  source?: Source;
}

export interface DealParty {
  id: string;
  deal_id: string;
  company_id: string;
  role: DealPartyRole;
  direction_note?: string | null;
  company?: Company;
}

export interface Deal {
  id: string;
  slug: string;
  title: string;
  summary: string;
  deal_type: DealType;
  status: DealStatus;
  announcement_date: string | null;
  effective_date: string | null;
  maturity_date: string | null;
  amount_value: number | null;
  amount_currency: string | null;
  amount_basis: AmountBasis | null;
  amount_period: string | null;
  amount_disclosed: boolean;
  geography: string | null;
  evidence_level: EvidenceLevel;
  confidence_note: string | null;
  is_published: boolean;
  published_at: string | null;
  last_reviewed_at: string | null;
  parties?: DealParty[];
  sources?: DealSource[];
  created_at?: string;
  updated_at?: string;
}

export interface Relationship {
  id: string;
  from_company_id: string;
  to_company_id: string;
  relationship_type: RelationshipType;
  start_date: string | null;
  end_date: string | null;
  description: string | null;
  evidence_level: EvidenceLevel;
  is_published: boolean;
  from_company?: Company;
  to_company?: Company;
  sources?: {
    relationship_id: string;
    source_id: string;
    supporting_note: string;
    source?: Source;
  }[];
  created_at?: string;
  updated_at?: string;
}

export interface SourceRegistry {
  id: string;
  name: string;
  base_url: string;
  source_category:
    | 'company_ir'
    | 'regulator'
    | 'government_api'
    | 'grid_operator'
    | 'press_release_wire'
    | 'news_publisher'
    | 'research_site'
    | 'competitor_discovery'
    | 'other';
  access_method: 'official_api' | 'rss_atom' | 'bulk_download' | 'public_html' | 'manual_only';
  terms_url?: string | null;
  robots_url?: string | null;
  reuse_policy_status: 'approved_for_configured_access' | 'manual_only' | 'blocked' | 'needs_review';
  rate_limit_notes?: string | null;
  attribution_requirements?: string | null;
  adapter_key?: string | null;
  is_enabled: boolean;
  last_policy_checked_at?: string | null;
  last_successful_run_at?: string | null;
}

export interface DiscoveryCandidate {
  id: string;
  source_site: string;
  source_url: string;
  page_title: string | null;
  discovered_at: string;
  candidate_type: string | null;
  candidate_company_names: string[];
  candidate_summary: string | null;
  outbound_source_urls: string[];
  review_status: 'new' | 'needs_verification' | 'verified' | 'rejected' | 'blocked_by_policy';
  review_notes: string | null;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
}
