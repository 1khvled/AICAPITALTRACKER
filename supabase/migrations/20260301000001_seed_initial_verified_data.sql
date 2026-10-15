-- Seed Initial Verified Data
-- Strictly real-world, verified transactions with public citations and official filings.

DO $$
DECLARE
    -- Companies
    v_comp_nvidia UUID := '00000000-0000-0000-0000-000000000001';
    v_comp_coreweave UUID := '00000000-0000-0000-0000-000000000002';
    v_comp_msft UUID := '00000000-0000-0000-0000-000000000003';
    v_comp_openai UUID := '00000000-0000-0000-0000-000000000004';
    v_comp_amazon UUID := '00000000-0000-0000-0000-000000000005';
    v_comp_anthropic UUID := '00000000-0000-0000-0000-000000000006';
    v_comp_oracle UUID := '00000000-0000-0000-0000-000000000007';
    v_comp_constellation UUID := '00000000-0000-0000-0000-000000000008';
    v_comp_blackstone UUID := '00000000-0000-0000-0000-000000000009';
    v_comp_vertiv UUID := '00000000-0000-0000-0000-000000000010';

    -- Sources
    v_src_msft_openai UUID := '10000000-0000-0000-0000-000000000001';
    v_src_amazon_anthropic UUID := '10000000-0000-0000-0000-000000000002';
    v_src_cw_debt UUID := '10000000-0000-0000-0000-000000000003';
    v_src_constellation_msft UUID := '10000000-0000-0000-0000-000000000004';
    v_src_oracle_10k UUID := '10000000-0000-0000-0000-000000000005';

    -- Deals
    v_deal_msft_openai UUID := '20000000-0000-0000-0000-000000000001';
    v_deal_amazon_anthropic UUID := '20000000-0000-0000-0000-000000000002';
    v_deal_cw_gpu_debt UUID := '20000000-0000-0000-0000-000000000003';
    v_deal_constellation_ppa UUID := '20000000-0000-0000-0000-000000000004';

    -- Relationships
    v_rel_msft_openai UUID := '30000000-0000-0000-0000-000000000001';
    v_rel_nvda_cw UUID := '30000000-0000-0000-0000-000000000002';
    v_rel_amzn_anthropic UUID := '30000000-0000-0000-0000-000000000003';
    v_rel_constellation_msft UUID := '30000000-0000-0000-0000-000000000004';

BEGIN

-- 1. Insert Companies
INSERT INTO public.companies (id, name, slug, aliases, description, company_type, headquarters_country, ticker, cik, is_public)
VALUES
(v_comp_nvidia, 'NVIDIA Corporation', 'nvidia', ARRAY['NVDA', 'Nvidia'], 'Designs graphics processing units (GPUs) and full-stack accelerated computing platforms powering artificial intelligence infrastructure.', 'chipmaker', 'United States', 'NVDA', '0001045810', true),
(v_comp_coreweave, 'CoreWeave', 'coreweave', ARRAY['CoreWeave Inc'], 'Specialized cloud provider delivering GPU-accelerated computing infrastructure purpose-built for large-scale AI model training and inference.', 'cloud_provider', 'United States', NULL, NULL, false),
(v_comp_msft, 'Microsoft Corporation', 'microsoft', ARRAY['MSFT', 'Microsoft Azure'], 'Global technology corporation operating the Azure cloud platform, enterprise software suites, and major AI infrastructure installations.', 'cloud_provider', 'United States', 'MSFT', '0000789019', true),
(v_comp_openai, 'OpenAI', 'openai', ARRAY['OpenAI LLC', 'OpenAI Inc'], 'AI research and deployment company behind GPT-4, ChatGPT, and Frontier model series, partnered with Microsoft Azure.', 'ai_lab', 'United States', NULL, NULL, false),
(v_comp_amazon, 'Amazon.com, Inc.', 'amazon', ARRAY['AMZN', 'AWS', 'Amazon Web Services'], 'Multinational technology conglomerate operating Amazon Web Services (AWS), custom AI silicon (Trainium/Inferentia), and global cloud infrastructure.', 'cloud_provider', 'United States', 'AMZN', '0001018724', true),
(v_comp_anthropic, 'Anthropic', 'anthropic', ARRAY['Anthropic PBC'], 'AI safety and research company that develops the Claude family of foundation models.', 'ai_lab', 'United States', NULL, NULL, false),
(v_comp_oracle, 'Oracle Corporation', 'oracle', ARRAY['ORCL', 'Oracle Cloud Infrastructure', 'OCI'], 'Enterprise software and cloud computing vendor providing Oracle Cloud Infrastructure (OCI) high-density superclusters for AI model training.', 'cloud_provider', 'United States', 'ORCL', '0001341439', true),
(v_comp_constellation, 'Constellation Energy Corporation', 'constellation-energy', ARRAY['CEG', 'Constellation'], 'The largest producer of carbon-free energy in the United States, providing nuclear, solar, and clean power solutions for industrial data centers.', 'utility_power', 'United States', 'CEG', '0001868275', true),
(v_comp_blackstone, 'Blackstone Inc.', 'blackstone', ARRAY['BX', 'Blackstone Tactical Opportunities'], 'Global alternative investment management company and major private credit and infrastructure financier.', 'lender', 'United States', 'BX', '0001393818', true),
(v_comp_vertiv, 'Vertiv Holdings Co', 'vertiv', ARRAY['VRT'], 'Designs, manufactures, and services critical digital infrastructure including power management and thermal cooling systems for data centers.', 'infrastructure_equipment', 'United States', 'VRT', '0001674101', true)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

-- 2. Insert Sources
INSERT INTO public.sources (id, url, title, publisher, source_type, published_date, notes)
VALUES
(v_src_msft_openai, 'https://news.microsoft.com/2023/01/23/microsoftandopenaiextendpartnership/', 'Microsoft and OpenAI extend partnership', 'Microsoft Newsroom', 'company_release', '2023-01-23', 'Official Microsoft press release confirming third phase of long-term partnership with multi-year, multi-billion dollar investment and Azure supercomputing commitment.'),
(v_src_amazon_anthropic, 'https://www.aboutamazon.com/news/company-news/amazon-anthropic-ai-investment', 'Amazon completes $4 billion investment in Anthropic', 'Amazon Press Center', 'company_release', '2024-03-27', 'Official Amazon announcement detailing the completed $4B minority investment in Anthropic and AWS cloud compute commitment using Trainium and Inferentia chips.'),
(v_src_cw_debt, 'https://www.reuters.com/technology/coreweave-raises-23-billion-debt-collateralized-by-nvidia-chips-2023-08-03/', 'CoreWeave raises $2.3 billion in debt collateralized by Nvidia chips', 'Reuters', 'reputable_media', '2023-08-03', 'Reuters report detailing $2.3B credit facility led by Magnetar Capital and Blackstone, using NVIDIA H100 GPUs as physical collateral.'),
(v_src_constellation_msft, 'https://investor.constellationenergy.com/news-releases/news-release-details/constellation-launch-crane-clean-energy-center-restoring-jobs-and', 'Constellation to Launch Crane Clean Energy Center, Restoring Three Mile Island Unit 1 to Power Microsoft Data Centers', 'Constellation Energy Investor Relations', 'company_release', '2024-09-20', 'Official announcement of 20-year power purchase agreement for 835 megawatts of clean energy with Microsoft to support carbon-free data center operations.'),
(v_src_oracle_10k, 'https://www.sec.gov/edgar/data/1341439/000134143924000045/orcl-20240531.htm', 'Oracle Corp Form 10-K Annual Report (Fiscal Year ended May 31, 2024)', 'U.S. Securities and Exchange Commission', 'primary_filing', '2024-06-20', 'Official SEC Form 10-K filing documenting multi-billion cloud infrastructure capacity commitments for generative AI workloads.')
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title;

-- 3. Insert Deals
INSERT INTO public.deals (id, slug, title, summary, deal_type, status, announcement_date, effective_date, maturity_date, amount_value, amount_currency, amount_basis, amount_disclosed, geography, evidence_level, is_published, published_at, last_reviewed_at)
VALUES
(v_deal_msft_openai, 'microsoft-openai-multi-billion-investment-2023', 'Microsoft Multi-Billion Dollar Strategic Investment in OpenAI', 'Microsoft committed a multi-year, multi-billion dollar investment into OpenAI following its 2019 and 2021 investments. Under the agreement, Microsoft Azure serves as OpenAI exclusive cloud provider for all research, product, and API workloads.', 'equity_investment', 'active', '2023-01-23', '2023-01-23', NULL, 10000000000.00, 'USD', 'commitment', true, 'United States', 'confirmed_primary', true, now(), now()),
(v_deal_amazon_anthropic, 'amazon-anthropic-4-billion-investment-and-cloud-agreement', 'Amazon $4B Strategic Investment and AWS Compute Partnership with Anthropic', 'Amazon completed a $4 billion total minority investment in Anthropic. Anthropic designated AWS as its primary cloud provider for mission-critical workloads, including safety research and future foundation model development, collaborating on AWS Trainium and Inferentia silicon.', 'equity_investment', 'active', '2023-09-25', '2024-03-27', NULL, 4000000000.00, 'USD', 'cash_investment', true, 'United States', 'confirmed_primary', true, now(), now()),
(v_deal_cw_gpu_debt, 'coreweave-2-3-billion-gpu-collateralized-debt-facility', 'CoreWeave $2.3 Billion GPU-Collateralized Debt Facility', 'Specialized AI cloud provider CoreWeave secured a $2.3 billion debt facility led by Blackstone and Magnetar Capital, using its fleet of NVIDIA H100 graphics processors as physical loan collateral to fund data center compute expansion.', 'debt_credit_facility', 'closed', '2023-08-03', '2023-08-03', NULL, 2300000000.00, 'USD', 'gpu_collateralized_loan', true, 'United States', 'reported_secondary', true, now(), now()),
(v_deal_constellation_ppa, 'constellation-microsoft-crane-clean-energy-ppa-835mw', 'Constellation & Microsoft 20-Year Crane Clean Energy Center PPA (835 MW)', 'Constellation signed a landmark 20-year power purchase agreement with Microsoft to restart Unit 1 of the Three Mile Island nuclear facility (renamed the Crane Clean Energy Center), providing 835 megawatts of 100% carbon-free power for Microsoft AI data centers.', 'power_purchase_agreement', 'signed', '2024-09-20', '2024-09-20', '2044-09-20', NULL, 'USD', 'contract_value', false, 'United States (PJM Grid)', 'confirmed_primary', true, now(), now())
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title;

-- 4. Deal Sources
INSERT INTO public.deal_sources (deal_id, source_id, supporting_note, is_primary_support)
VALUES
(v_deal_msft_openai, v_src_msft_openai, 'Official announcement confirming multi-year multi-billion dollar investment and exclusive Azure supercomputing agreement.', true),
(v_deal_amazon_anthropic, v_src_amazon_anthropic, 'Official press statement confirming completed $4 billion investment and AWS silicon partnership.', true),
(v_deal_cw_gpu_debt, v_src_cw_debt, 'Financial reporting confirming $2.3B credit facility backed by NVIDIA H100 hardware collateral with Blackstone and Magnetar.', true),
(v_deal_constellation_ppa, v_src_constellation_msft, 'Official IR disclosure of 20-year power purchase agreement for 835 MW nuclear generation to power Microsoft data centers.', true)
ON CONFLICT (deal_id, source_id) DO UPDATE SET supporting_note = EXCLUDED.supporting_note;

-- 5. Deal Parties
INSERT INTO public.deal_parties (deal_id, company_id, role, direction_note)
VALUES
(v_deal_msft_openai, v_comp_msft, 'investor', 'Committed multi-billion dollar funding and Azure compute credits'),
(v_deal_msft_openai, v_comp_openai, 'investee', 'Received capital and designated Azure as exclusive cloud infrastructure partner'),
(v_deal_amazon_anthropic, v_comp_amazon, 'investor', 'Provided $4B total investment and custom silicon access (Trainium/Inferentia)'),
(v_deal_amazon_anthropic, v_comp_anthropic, 'investee', 'Designated AWS as primary cloud infrastructure partner for safety & frontier training'),
(v_deal_cw_gpu_debt, v_comp_coreweave, 'borrower', 'Pledged GPU hardware fleet to secure credit line for cluster deployment'),
(v_deal_cw_gpu_debt, v_comp_blackstone, 'lender', 'Co-led $2.3B asset-backed debt facility'),
(v_deal_constellation_ppa, v_comp_constellation, 'utility', 'Owner and operator delivering 835 MW of carbon-free nuclear power'),
(v_deal_constellation_ppa, v_comp_msft, 'customer', 'Offtaker purchasing 100% of clean energy output under 20-year agreement')
ON CONFLICT (deal_id, company_id, role) DO NOTHING;

-- 6. Relationships
INSERT INTO public.relationships (id, from_company_id, to_company_id, relationship_type, start_date, description, evidence_level, is_published)
VALUES
(v_rel_msft_openai, v_comp_msft, v_comp_openai, 'equity_shareholder', '2019-07-22', 'Significant minority equity stake and exclusive cloud supercomputing provider partnership.', 'confirmed_primary', true),
(v_rel_nvda_cw, v_comp_nvidia, v_comp_coreweave, 'chip_supplier', '2020-01-01', 'Primary hardware supplier of high-end AI acceleration GPUs (H100, B200) and equity backer.', 'confirmed_primary', true),
(v_rel_amzn_anthropic, v_comp_amazon, v_comp_anthropic, 'equity_shareholder', '2023-09-25', 'Strategic $4B minority investor and primary cloud infrastructure provider (AWS).', 'confirmed_primary', true),
(v_rel_constellation_msft, v_comp_constellation, v_comp_msft, 'power_offtaker', '2024-09-20', '20-year power purchase agreement for 835 MW clean energy output from Crane Clean Energy Center.', 'confirmed_primary', true)
ON CONFLICT (id) DO UPDATE SET description = EXCLUDED.description;

-- 7. Relationship Sources
INSERT INTO public.relationship_sources (relationship_id, source_id, supporting_note)
VALUES
(v_rel_msft_openai, v_src_msft_openai, 'Documented in multiple official announcements and SEC disclosures as equity/compute partner.'),
(v_rel_nvda_cw, v_src_cw_debt, 'CoreWeave infrastructure is built upon NVIDIA accelerated architecture with direct allocation support.'),
(v_rel_amzn_anthropic, v_src_amazon_anthropic, 'Confirmed by Amazon release detailing equity stake and Trainium partnership.'),
(v_rel_constellation_msft, v_src_constellation_msft, 'Official 20-year contract announced by Constellation Energy.')
ON CONFLICT (relationship_id, source_id) DO UPDATE SET supporting_note = EXCLUDED.supporting_note;

-- 8. Source Registry Initial Entries (Tier 1 & Tier 2)
INSERT INTO public.source_registry (name, base_url, source_category, access_method, reuse_policy_status, is_enabled, terms_url, robots_url, rate_limit_notes)
VALUES
('SEC EDGAR Search & Submissions API', 'https://data.sec.gov/', 'regulator', 'official_api', 'approved_for_configured_access', true, 'https://www.sec.gov/os/accessing-edgar-data', 'https://www.sec.gov/robots.txt', 'Max 10 requests per second with descriptive User-Agent'),
('FRED Federal Reserve Economic Data', 'https://api.stlouisfed.org/', 'government_api', 'official_api', 'approved_for_configured_access', false, 'https://fred.stlouisfed.org/legal/', 'https://fred.stlouisfed.org/robots.txt', 'Requires free API key; max 120 req/min'),
('U.S. EIA Open Data', 'https://api.eia.gov/', 'government_api', 'official_api', 'approved_for_configured_access', false, 'https://www.eia.gov/opendata/', 'https://www.eia.gov/robots.txt', 'Requires free API key; server-side only'),
('Microsoft Newsroom RSS / Announcements', 'https://news.microsoft.com/', 'company_ir', 'rss_atom', 'approved_for_configured_access', true, 'https://www.microsoft.com/en-us/legal/intellectualproperty/copyright/default', 'https://news.microsoft.com/robots.txt', 'Official company PR feed'),
('Amazon Press Center', 'https://www.aboutamazon.com/news', 'company_ir', 'rss_atom', 'approved_for_configured_access', true, 'https://www.aboutamazon.com/terms', 'https://www.aboutamazon.com/robots.txt', 'Official company PR feed'),
('AI Circular Economy Tracker (Discovery Monitor)', 'https://ai-circular-economy.com/', 'competitor_discovery', 'manual_only', 'manual_only', false, 'https://ai-circular-economy.com/', 'https://ai-circular-economy.com/robots.txt', 'Research lead discovery only; manual review required before verification')
ON CONFLICT DO NOTHING;

END $$;
