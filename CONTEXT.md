# AI Capital Tracker — Engineering, Intelligence & Deployment Log

**Project**: AICapitalTracker.com  
**Repository Working Directory**: `D:\Projects\aicapitaltracker`  
**Current System State**: Fully Compiled & Tested (`17 / 17 tests passed`, `20 / 20 routes rendered`)  
**Server Status**: **STOPPED** (per explicit instruction)

---

## Chronological Project Execution & Milestone Log

### Phase 1: Architecture Inception & Core Foundation
**Date**: October 15, 2026 (Evening Session)

1. **System & Tech Stack Decisions**:
   - **Framework**: Next.js 15 (App Router, React 19, Server Components).
   - **Styling**: Tailwind CSS with custom institutional financial typography (tabular numbers, mono metrics, editorial mastheads).
   - **Validation & Schema Security**: Zod for runtime contract validation, ensuring zero fabricated numbers (`amount_disclosed: false` strictly maps to `amount_value: null`).
   - **Testing**: Vitest for unit & regression testing covering schema invariants, repository queries, and SSRF defense.

2. **Database & Schema Architecture (`src/lib/types.ts`)**:
   - Defined strict domain models for `Company`, `Deal`, `Relationship`, `Source`, and `SourceRegistry`.
   - Structured `EvidenceLevel` across 6 immutable tiers:
     - `confirmed_primary`: Statutory SEC (10-K, 10-Q, 8-K), FERC, or audited company releases.
     - `reported_secondary`: Corroborated tier-1 financial press (Bloomberg, FT, Reuters, WSJ).
     - `announced_not_completed`: Non-binding term sheets, MoUs, pending regulatory approvals.
     - `estimated`: Industry benchmark valuations, isolated from confirmed cash totals.
     - `disputed`: Regulatory injunctions, challenged interconnections (FERC orders).
     - `superseded`: Prior facility tranches replaced by newer amendments.
   - Structured `DealType` across 8 classifications: `equity_investment`, `debt_credit_facility`, `power_purchase_agreement`, `cloud_compute_contract`, `infrastructure_project_finance`, `acquisition`, `strategic_partnership`, `equipment_purchase`.

---

### Phase 2: Ingestion Engine & Automated SEC Crawlers
**Date**: October 15, 2026

1. **SSRF-Protected SEC Ingestion API (`src/app/api/crawlers/sec/route.ts`)**:
   - Built a secure SEC EDGAR submission fetcher querying official `data.sec.gov` endpoints.
   - Implemented strict SSRF protections in `src/lib/security.ts`:
     - Disallowed loopback (`127.0.0.1`, `localhost`), link-local (`169.254.0.0/16`), and private RFC 1918 subnets (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`).
     - Enforced domain allowlists (`data.sec.gov`, `www.sec.gov`).
     - Required user-agent compliance with SEC fair-access standards (`User-Agent: AICapitalTracker ResearchDesk/1.0 (contact@aicapitaltracker.com)`).
   - Tested and verified with 6 dedicated SSRF security test cases in `tests/ssrf-protection.test.ts`.

2. **Automated GitHub Actions Synchronization (`.github/workflows/sec-ingestion.yml`)**:
   - Configured recurring GitHub Actions workflow triggered on a daily cron schedule (`0 6 * * *`) and on manual `workflow_dispatch`.
   - Automated ingestion of public Form 8-K filings for public AI bellwethers (NVIDIA, Microsoft, Amazon, Alphabet, Meta, Oracle, Constellation Energy, Talen Energy, Vistra).

---

### Phase 3: Comprehensive Dataset Expansion (2023 – 2026)
**Date**: October 15 – October 16, 2026

Expanded [`src/lib/data/dataset.ts`](file:///D:/Projects/aicapitaltracker/src/lib/data/dataset.ts) into an institutional database comprising **64 Companies**, **60 Primary Sources**, **59 Multi-Billion-Dollar Deals**, and **36 Corporate Relationships**.

#### 1. Hardware, Chipmakers & Compute Infrastructure
- **NVIDIA Corporation** (`NVDA`): Dominant AI hardware provider; strategic equity backer across CoreWeave, Mistral AI, and Nebius Group.
- **Apple Inc.** (`AAPL`): Project ACDC (Apple Chips in Data Centers) deploying custom server-grade M2/M4 Ultra silicon for Private Cloud Compute AI inference.
- **Arm Holdings plc** (`ARM`): Architectural core for SoftBank's Project Izanagi custom AI silicon.
- **Groq**: $640M Series D ($2.8B val) led by BlackRock; $1.5B Aramco partnership for Dammam inference supercluster.
- **Vertiv Holdings** (`VRT`), **Supermicro** (`SMCI`), **Cisco** (`CSCO`), **Lenovo** (`0992.HK`).

#### 2. Specialized Neoclouds & GPU-Collateralized Debt
- **CoreWeave**: $2.3B initial GPU credit facility (2023) expanding to landmark $8.5B DDTL 4.0 (May 2024) led by Blackstone, Magnetar, and Coatue, plus $650M secondary liquidity tranche.
- **Nebius Group** (`NBIS`): Emerged from Yandex international restructuring; secured $2.0B NVIDIA equity placement (March 2026) to scale 100k+ GPU clusters across Europe and North America.
- **Crusoe Energy**: $225M Upper90 GPU-collateralized loan; $15B joint venture with Lancium for 1.2 GW Texas AI campus.
- **Northern Data Group** (`NB2.DE`) / **Taiga Cloud**: €575M debt facility backed by Tether; €400M Damoon H100 GPU fleet acquisition.
- **Together AI**: $305M Series B ($3.3B valuation) led by Prosperity7.
- **Nscale**: $155M Series A for vertically integrated Nordic liquid-cooled compute clusters.

#### 3. Hyperscalers & Foundation Labs
- **Microsoft** (`MSFT`): $10B+ multi-year equity/cloud injections into OpenAI; 20-year nuclear PPA with Constellation Energy.
- **Amazon AWS** (`AMZN`): $4B strategic investment into Anthropic; Virginia SMR agreement with Dominion Energy.
- **Anthropic**: $13B Series F mega-round co-led by AWS and Google Cloud.
- **xAI**: $6B Series B & $6B Series C financing rounds valuing the company at $50B+ to scale Colossus 100k GPU cluster in Memphis.
- **Mistral AI**: €600M Series B (€5.8B valuation) backed by General Catalyst, NVIDIA, and DST Global.
- **DeepSeek**: Incubation by High-Flyer Quant, low-cost cluster architectures (R1 reasoning model).
- **ByteDance Ltd.**: Offshore GPU procurement leasing tens of thousands of NVIDIA H100s via Oracle Cloud Infrastructure (OCI) spending >$2.0B.

#### 4. Power Utilities, Baseload Nuclear & SMR Restarts
- **Constellation Energy** (`CEG`): 20-year PPA restarting the 835 MW Three Mile Island Unit 1 (Crane Clean Energy Center) for Microsoft.
- **Talen Energy** (`TLN`): 960 MW Susquehanna nuclear colocation campus with AWS ($18B cumulative cloud commitment).
- **NextEra Energy** (`NEE`): 615 MW Duane Arnold nuclear power plant recommissioning in Palo, Iowa, contracted to Google.
- **Dominion Energy** (`D`): Agreement exploring Small Modular Reactor (SMR) development at North Anna Power Station (>500 MW) for Amazon.
- **Oklo Inc.** (`OKLO`): 500 MW advanced fast fission reactor prepayment framework with Equinix.
- **Vistra Corp** (`VST`): 2,609 MW solar and battery energy storage off-take framework for Meta hyperscale campuses.
- **Energy Transfer** (`ET`): 1.2 GW behind-the-meter natural gas turbine PPA for dedicated Texas AI data center campuses.
- **Kairos Power**, **Helion Energy** (commercial fusion PPA with Microsoft).

#### 5. Hyperscale Real Estate, Infrastructure JVs & Sovereign Funds
- **AirTrunk Buyout**: A$24B acquisition by Blackstone and CPP Investments.
- **QTS Data Centers / Blackstone**: $25B ongoing capital development program for North American hyperscale builds.
- **CyrusOne / KKR / ECP**: $4.0B Texas joint venture for the Bosque County AI gigawatt hub.
- **STACK Infrastructure**: $4.0B in green data center asset-backed securitized (ABS) debt notes.
- **Digital Realty / Blackstone**: $7.0B joint venture constructing 500 MW of hyperscale campuses in Northern Virginia, Frankfurt, and Paris.
- **Project Stargate**: $500B joint venture between SoftBank, OpenAI, and Oracle to construct 5 GW of US supercomputing infrastructure.
- **Saudi Arabia PIF / Alat**: $2.0B convertible bond agreement with Lenovo to establish AI server production in Riyadh.

#### 6. Market Leaks, Unconfirmed Negotiations & Regulatory Disputes
- **FERC Rejection Order (Docket ER24-2172)**: Landmark 2-1 Federal Energy Regulatory Commission ruling denying PJM Interconnection amendment for Talen/AWS 480 MW direct nuclear colocation.
- **SoftBank "Project Izanagi"**: Masayoshi Son's proposed $100B AI chip venture seeking $30B from SoftBank and $70B from Middle Eastern sovereign funds.
- **Saudi PIF & a16z "Project Transcendence"**: Bilateral negotiations for a $40B artificial intelligence mega-fund.
- **OpenAI & Jony Ive (LoveFrom) "io"**: $1.0B+ hardware startup talks involving Laurene Powell Jobs and Masayoshi Son.
- **Meta Aborted Nuclear Colocation**: Nuclear site cancelled following discovery of an endangered bee species.
- **Meta 1–4 GW Nuclear RFP**: Public procurement solicitation seeking 1 to 4 GW of carbon-free nuclear capacity starting early 2030s.

---

### Phase 4: Full Institutional Web Portal Construction
**Date**: October 16, 2026

Transformed the web application from basic stubs into a fully populated, multi-faceted intelligence portal:

1. **Homepage (`src/app/page.tsx`)**:
   - Upgraded to a 6-card interactive **Capital Taxonomy**: GPU Debt Facilities, Hyperscaler Strategic Equity, Baseload Nuclear PPAs, Sovereign Compute & Custom Silicon, Hyperscale Real Estate & ABS, and Regulatory Disputes & Leaks.
   - Added dedicated **Market Intelligence & Regulatory Desk Marquee** featuring unconfirmed negotiations, leaked term sheets, and FERC orders.
   - Expanded **Ecosystem Participants** matrix from 8 to 16 featured counterparties across all sectors.
   - Added live terminal search and quick filter chips.

2. **Company Directory (`src/app/companies/page.tsx`)**:
   - Cataloged all 64 companies with Sector Quick Filter Pills (AI Labs, Neoclouds & Hyperscalers, Chipmakers, Power & Nuclear, Data Center REITs, Credit & Lenders, Sovereign & Strategic, Thermal & Hardware).
   - Added dynamic sector counters and search filters.

3. **Deal Ledger (`src/app/deals/page.tsx`)**:
   - Multi-field filtering supporting all 8 deal classifications, all 6 evidence audit tiers, and deal statuses (`closed`, `signed`, `active`, `announced`, `proposed`, `disputed`).
   - Integrated live volume calculator tabulating total capital across filtered subsets.

4. **About Desk (`src/app/about/page.tsx`)**:
   - Authored deep institutional briefing on the 2023–2026 physical compute bottleneck, the multi-trillion-dollar capital supercycle, and our anti-slop statutory verification standard.

5. **Contact Communications Desk (`src/app/contact/page.tsx`)**:
   - Built interactive dispatch form for SEC filings, deal corrections, and research licensing.
   - Published PGP encrypted transmission key (`4F9B 28E1 C704 90A2 B188 53FE D920 18A6 E33F 71C0`) for anonymous whistleblowers.
   - Cataloged regional desks in New York, Washington D.C., San Francisco, and London.

6. **Corrections & Dispute Policy (`src/app/corrections/page.tsx`)**:
   - Published the formal **48-Hour Statutory Review Protocol** (Ingestion & Freeze, Primary Re-Verification, Public Log & Notice).
   - Implemented dispute filing intake form and immutable audit changelog example.

7. **Terms of Service (`src/app/terms/page.tsx`) & Privacy Policy (`src/app/privacy/page.tsx`)**:
   - Institutional non-investment advice disclaimers, intellectual property citation licensing guidelines, fair query rate limits, zero-surveillance data ethics, and GDPR/CCPA disclosures.

---

### Phase 5: Verification, Testing & Server Deactivation
**Date**: October 16, 2026

1. **Vitest Unit Test Suite**:
   - `tests/deal-validation.test.ts`: 5 tests passed.
   - `tests/ssrf-protection.test.ts`: 6 tests passed.
   - `tests/repository.test.ts`: 6 tests passed.
   - **Result**: `17 / 17 tests passed (100% success rate)`.

2. **Next.js Production Compilation**:
   - 20 / 20 static pages compiled with zero build or lint warnings.
   - Server-rendered endpoints and static pages verified.

3. **Server Control**:
   - Production server processes stopped and killed per explicit user command.
