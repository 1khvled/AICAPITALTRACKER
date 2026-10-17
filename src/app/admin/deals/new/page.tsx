'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { DealFormSchema } from '../../../../lib/validation/deal';
import { DataRepository } from '../../../../lib/data/db';
import type { Company } from '../../../../lib/types';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

const DEAL_TYPE_OPTIONS = [
  { value: 'equity_investment', label: 'Equity Investment' },
  { value: 'debt_credit_facility', label: 'Debt / Credit Facility' },
  { value: 'cloud_compute_contract', label: 'Cloud Compute Contract' },
  { value: 'infrastructure_project_finance', label: 'Project Finance' },
  { value: 'power_purchase_agreement', label: 'Power Purchase Agreement' },
  { value: 'acquisition', label: 'Acquisition' },
  { value: 'strategic_partnership', label: 'Strategic Partnership' },
  { value: 'equipment_purchase', label: 'Equipment Purchase' },
  { value: 'other', label: 'Other' },
];

const STATUS_OPTIONS = [
  { value: 'proposed', label: 'Proposed' },
  { value: 'announced', label: 'Announced' },
  { value: 'signed', label: 'Signed' },
  { value: 'closed', label: 'Closed' },
  { value: 'active', label: 'Active' },
  { value: 'disputed', label: 'Disputed' },
];

const EVIDENCE_OPTIONS = [
  { value: 'confirmed_primary', label: 'Confirmed Primary' },
  { value: 'reported_secondary', label: 'Reported Secondary' },
  { value: 'announced_not_completed', label: 'Announced (Pending)' },
  { value: 'estimated', label: 'Estimated' },
  { value: 'disputed', label: 'Disputed' },
  { value: 'superseded', label: 'Superseded' },
];

const ROLE_OPTIONS = [
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
  'other',
];

const CANDIDATE_PREFILLS: Record<string, { title: string; summary: string }> = {
  'disc-1': {
    title: 'Crusoe Energy $3.4B AI Data Center Joint Venture',
    summary:
      'Discovered mention of a $3.4 billion joint venture to fund high-density AI data centers in Texas. Requires primary filing verification before publishing.',
  },
  'disc-2': {
    title: 'NVIDIA Corp Form 8-K Disclosure',
    summary:
      'Form 8-K disclosure detailing multi-gigawatt power and cluster supply milestones. Verify SEC accession before publishing.',
  },
};

interface PartyRow {
  company_id: string;
  role: string;
  direction_note: string;
}

function slugify(val: string): string {
  return val
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

export default function NewDealPage() {
  const router = useRouter();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [candidateId, setCandidateId] = useState<string | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [summary, setSummary] = useState('');
  const [dealType, setDealType] = useState('debt_credit_facility');
  const [status, setStatus] = useState('announced');
  const [evidenceLevel, setEvidenceLevel] = useState('confirmed_primary');
  const [announcementDate, setAnnouncementDate] = useState('');
  const [effectiveDate, setEffectiveDate] = useState('');
  const [amountDisclosed, setAmountDisclosed] = useState(false);
  const [amountValue, setAmountValue] = useState<string>('');
  const [amountCurrency, setAmountCurrency] = useState('USD');
  const [amountBasis, setAmountBasis] = useState('credit_facility');
  const [isPublished, setIsPublished] = useState(false);

  // Companies loaded from the repository (never hardcoded)
  const [companies, setCompanies] = useState<Company[]>([]);
  const [companiesLoading, setCompaniesLoading] = useState(true);

  // Multi-party state (starts with 2 rows)
  const [parties, setParties] = useState<PartyRow[]>([
    { company_id: '', role: 'borrower', direction_note: '' },
    { company_id: '', role: 'lender', direction_note: '' },
  ]);

  // Primary source citation state
  const [sourceUrl, setSourceUrl] = useState('');
  const [sourceTitle, setSourceTitle] = useState('');
  const [sourcePublisher, setSourcePublisher] = useState('');
  const [sourceType, setSourceType] = useState<'primary_filing' | 'company_release' | 'reputable_media'>('company_release');
  const [supportingNote, setSupportingNote] = useState('');

  useEffect(() => {
    let cancelled = false;
    DataRepository.getCompanies()
      .then((list) => {
        if (!cancelled) {
          setCompanies(list);
          setCompaniesLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setCompanies([]);
          setCompaniesLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Default empty party rows to the first companies once loaded
  useEffect(() => {
    if (companies.length >= 2) {
      setParties((prev) => {
        let changed = false;
        const next = prev.map((p, i) => {
          if (!p.company_id && companies[i % companies.length]) {
            changed = true;
            return { ...p, company_id: companies[i % companies.length].id };
          }
          return p;
        });
        return changed ? next : prev;
      });
    }
  }, [companies]);

  // Prefill from discovery queue (?candidate=<id>)
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const cid = params.get('candidate');
      if (cid) {
        setCandidateId(cid);
        const pre = CANDIDATE_PREFILLS[cid];
        if (pre) {
          setTitle(pre.title);
          setSlug(slugify(pre.title));
          setSummary(pre.summary);
        } else {
          setSummary((s) => s || `Imported discovery lead ${cid} — verify primary filing before publishing.`);
        }
      }
    } catch {
      // ignore (non-browser / SSR)
    }
  }, []);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTitle(val);
    setSlug(slugify(val));
  };

  const updateParty = (index: number, field: keyof PartyRow, value: string) => {
    setParties((prev) => prev.map((p, i) => (i === index ? { ...p, [field]: value } : p)));
  };

  const addParty = () => {
    setParties((prev) => [...prev, { company_id: companies[0]?.id ?? '', role: 'counterparty', direction_note: '' }]);
  };

  const removeParty = (index: number) => {
    setParties((prev) => {
      if (prev.length <= 2) {
        return prev;
      }
      return prev.filter((_, i) => i !== index);
    });
  };

  const selectedIds = parties.map((p) => p.company_id).filter(Boolean);
  const hasDuplicates = new Set(selectedIds).size !== selectedIds.length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (hasDuplicates) {
      setErrorMsg('Duplicate guard: each counterparty may appear only once per deal.');
      return;
    }

    setIsSubmitting(true);

    const sources = sourceUrl.trim() !== ''
      ? [
          {
            url: sourceUrl.trim(),
            title: sourceTitle.trim() || 'Official Disclosure',
            publisher: sourcePublisher.trim() || 'Issuer',
            source_type: sourceType,
            supporting_note: supportingNote.trim() || 'Verifies transaction terms',
            is_primary_support: true,
          },
        ]
      : [];

    const payload = {
      title,
      slug,
      summary,
      deal_type: dealType,
      status,
      evidence_level: evidenceLevel,
      announcement_date: announcementDate || null,
      effective_date: effectiveDate || null,
      amount_disclosed: amountDisclosed,
      amount_value: amountDisclosed && amountValue ? parseFloat(amountValue) : null,
      amount_currency: amountCurrency,
      amount_basis: amountBasis,
      is_published: isPublished,
      parties: parties.map((p) => ({
        company_id: p.company_id,
        role: p.role as 'borrower' | 'lender' | 'counterparty',
        direction_note: p.direction_note || null,
      })),
      sources,
    };

    const validation = DealFormSchema.safeParse(payload);
    if (!validation.success) {
      const issue = validation.error.issues[0];
      setErrorMsg(`Validation Rule Error (${issue.path.join('.') || 'root'}): ${issue.message}`);
      setIsSubmitting(false);
      return;
    }

    try {
      const res = await fetch('/api/admin/deals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validation.data),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save deal');
      }

      setSuccessMsg('Transaction audited and validated successfully!');
      setTimeout(() => {
        router.push('/admin/deals');
      }, 1200);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : String(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="space-y-8">
        <div>
          <nav
            aria-label="Breadcrumb"
            className="mb-2 flex items-center gap-2 font-mono text-xs text-zinc-500"
          >
            <Link href="/admin" className="rounded transition-colors hover:text-zinc-900 hover:underline">
              ADMIN
            </Link>
            <span aria-hidden="true">/</span>
            <Link
              href="/admin/deals"
              className="rounded transition-colors hover:text-zinc-900 hover:underline"
            >
              DEALS
            </Link>
            <span aria-hidden="true">/</span>
            <span className="font-medium text-zinc-800">NEW TRANSACTION</span>
          </nav>
          <div className="border-b border-zinc-200 pb-4">
            <h1 className="text-2xl font-black tracking-tight text-zinc-950 sm:text-3xl">
              Record new transaction
            </h1>
            <p className="mt-1 text-xs text-zinc-500">
              Publishing requires at least one primary source citation. Undisclosed deals must not contain
              estimated values.
            </p>
            {candidateId && (
              <p className="pill pill-sky mt-3 inline-flex">
                Prefilled from discovery lead {candidateId} — verify primary evidence before publishing.
              </p>
            )}
          </div>
        </div>

        {errorMsg && (
          <div
            role="alert"
            className="notice notice-rose flex items-start gap-2"
          >
            <AlertCircle aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div
            role="status"
            aria-live="polite"
            className="notice notice-mint flex items-start gap-2"
          >
            <CheckCircle2 aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="panel space-y-8 p-6 sm:p-8">
          {/* Section 1: Transaction core */}
          <div className="space-y-4">
            <h2 className="panel-title border-b border-zinc-100 pb-2">
              1. Transaction identification
            </h2>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label htmlFor="dealTitle" className="field-label">
                  Deal title *
                </label>
                <input
                  id="dealTitle"
                  type="text"
                  required
                  value={title}
                  onChange={handleTitleChange}
                  placeholder="e.g. CoreWeave $2.3B GPU-Collateralized Debt Facility"
                  className="field mt-1.5"
                />
              </div>

              <div>
                <label htmlFor="dealSlug" className="field-label">
                  URL slug *
                </label>
                <input
                  id="dealSlug"
                  type="text"
                  required
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="coreweave-2-3b-gpu-debt"
                  className="field-mono mt-1.5"
                />
              </div>

              <div>
                <label htmlFor="dealClassification" className="field-label">
                  Classification *
                </label>
                <select
                  id="dealClassification"
                  value={dealType}
                  onChange={(e) => setDealType(e.target.value)}
                  className="field-native mt-1.5"
                >
                  {DEAL_TYPE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="dealStatus" className="field-label">
                  Deal status *
                </label>
                <select
                  id="dealStatus"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="field-native mt-1.5"
                >
                  {STATUS_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="dealSummary" className="field-label">
                  Factual summary * (min 20 chars, neutral tone)
                </label>
                <textarea
                  id="dealSummary"
                  required
                  rows={3}
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  placeholder="State the confirmed contractual and structural terms without editorial hype..."
                  className="field mt-1.5 leading-relaxed"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Audit standard & timeline */}
          <div className="space-y-4">
            <h2 className="panel-title border-b border-zinc-100 pb-2">
              2. Evidence level &amp; timeline
            </h2>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label htmlFor="auditStandard" className="field-label">
                  Audit standard *
                </label>
                <select
                  id="auditStandard"
                  value={evidenceLevel}
                  onChange={(e) => setEvidenceLevel(e.target.value)}
                  className="field-native mt-1.5"
                >
                  {EVIDENCE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="announcementDate" className="field-label">
                  Announcement date
                </label>
                <input
                  id="announcementDate"
                  type="date"
                  value={announcementDate}
                  onChange={(e) => setAnnouncementDate(e.target.value)}
                  className="field-mono mt-1.5"
                />
              </div>

              <div>
                <label htmlFor="effectiveDate" className="field-label">
                  Effective date
                </label>
                <input
                  id="effectiveDate"
                  type="date"
                  value={effectiveDate}
                  onChange={(e) => setEffectiveDate(e.target.value)}
                  className="field-mono mt-1.5"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Capital structure */}
          <div className="space-y-4">
            <h2 className="panel-title border-b border-zinc-100 pb-2">
              3. Capital structure &amp; amounts
            </h2>

            <div className="flex items-center gap-2.5">
              <input
                type="checkbox"
                id="amountDisclosed"
                checked={amountDisclosed}
                onChange={(e) => setAmountDisclosed(e.target.checked)}
                className="h-4 w-4 rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500"
              />
              <label htmlFor="amountDisclosed" className="text-xs font-semibold text-zinc-900">
                Amount was publicly disclosed (leave unchecked if terms were undisclosed)
              </label>
            </div>

            {amountDisclosed && (
              <div className="panel-sunken grid grid-cols-1 gap-4 p-4 sm:grid-cols-3">
                <div>
                  <label htmlFor="amountValue" className="field-label">
                    Disclosed numeric value
                  </label>
                  <input
                    id="amountValue"
                    type="number"
                    value={amountValue}
                    onChange={(e) => setAmountValue(e.target.value)}
                    placeholder="2300000000"
                    className="field-mono mt-1.5"
                  />
                </div>

                <div>
                  <label htmlFor="amountCurrency" className="field-label">
                    Currency
                  </label>
                  <input
                    id="amountCurrency"
                    type="text"
                    maxLength={3}
                    value={amountCurrency}
                    onChange={(e) => setAmountCurrency(e.target.value.toUpperCase())}
                    className="field-mono mt-1.5"
                  />
                </div>

                <div>
                  <label htmlFor="amountBasis" className="field-label">
                    Capital basis
                  </label>
                  <select
                    id="amountBasis"
                    value={amountBasis}
                    onChange={(e) => setAmountBasis(e.target.value)}
                    className="field-native mt-1.5"
                  >
                    <option value="credit_facility">Credit Facility</option>
                    <option value="cash_investment">Cash Investment</option>
                    <option value="contract_value">Contract Value</option>
                    <option value="commitment">Commitment</option>
                    <option value="gpu_collateralized_loan">GPU Collateralized Loan</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Section 4: Counterparties */}
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3 border-b border-zinc-100 pb-2">
              <h2 className="panel-title">4. Participating counterparties (min 2)</h2>
              <button type="button" onClick={addParty} className="pill pill-neutral hover:bg-zinc-100">
                + Add party
              </button>
            </div>

            {hasDuplicates && (
              <p className="font-mono text-[11px] text-rose-700">
                Duplicate guard: each counterparty may appear only once per deal.
              </p>
            )}

            <div className="space-y-3">
              {parties.map((party, idx) => (
                <div
                  key={idx}
                  className="panel-sunken grid grid-cols-1 gap-3 p-3 sm:grid-cols-4"
                >
                  <div className="sm:col-span-2">
                    <label htmlFor={`party-entity-${idx}`} className="field-label">
                      Entity {idx + 1}
                    </label>
                    <select
                      id={`party-entity-${idx}`}
                      value={party.company_id}
                      onChange={(e) => updateParty(idx, 'company_id', e.target.value)}
                      className="field-native mt-1.5"
                    >
                      <option value="" disabled>
                        {companiesLoading ? 'Loading entities…' : 'Select entity'}
                      </option>
                      {companies.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor={`party-role-${idx}`} className="field-label">
                      Role
                    </label>
                    <select
                      id={`party-role-${idx}`}
                      value={party.role}
                      onChange={(e) => updateParty(idx, 'role', e.target.value)}
                      className="field-native mt-1.5"
                    >
                      {ROLE_OPTIONS.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor={`party-scope-${idx}`} className="field-label">
                      Directional scope
                    </label>
                    <div className="mt-1.5 flex gap-1.5">
                      <input
                        id={`party-scope-${idx}`}
                        type="text"
                        value={party.direction_note}
                        onChange={(e) => updateParty(idx, 'direction_note', e.target.value)}
                        placeholder="e.g. Pledged GPU cluster"
                        className="field"
                      />
                      <button
                        type="button"
                        onClick={() => removeParty(idx)}
                        disabled={parties.length <= 2}
                        title={parties.length <= 2 ? 'At least 2 parties required' : 'Remove party'}
                        aria-label={`Remove counterparty ${idx + 1}`}
                        className="shrink-0 rounded-panel border border-zinc-300 px-2.5 font-mono text-xs text-rose-600 transition-colors hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 5: Primary audit citation */}
          <div className="space-y-4">
            <h2 className="panel-title border-b border-zinc-100 pb-2">
              5. Primary audit citation (mandatory to publish)
            </h2>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label htmlFor="sourceUrl" className="field-label">
                  Document URL *
                </label>
                <input
                  id="sourceUrl"
                  type="url"
                  value={sourceUrl}
                  onChange={(e) => setSourceUrl(e.target.value)}
                  placeholder="https://www.sec.gov/Archives/... or official press release"
                  className="field-mono mt-1.5"
                />
              </div>

              <div>
                <label htmlFor="sourceTitle" className="field-label">
                  Document / headline title
                </label>
                <input
                  id="sourceTitle"
                  type="text"
                  value={sourceTitle}
                  onChange={(e) => setSourceTitle(e.target.value)}
                  placeholder="SEC Form 8-K / Official IR Release"
                  className="field mt-1.5"
                />
              </div>

              <div>
                <label htmlFor="sourcePublisher" className="field-label">
                  Publisher
                </label>
                <input
                  id="sourcePublisher"
                  type="text"
                  value={sourcePublisher}
                  onChange={(e) => setSourcePublisher(e.target.value)}
                  placeholder="U.S. SEC / Microsoft Newsroom"
                  className="field mt-1.5"
                />
              </div>

              <div>
                <label htmlFor="sourceType" className="field-label">
                  Source type
                </label>
                <select
                  id="sourceType"
                  value={sourceType}
                  onChange={(e) => setSourceType(e.target.value as 'primary_filing' | 'company_release' | 'reputable_media')}
                  className="field-native mt-1.5"
                >
                  <option value="primary_filing">Statutory Filing (SEC 10-K / 10-Q / 8-K)</option>
                  <option value="company_release">Official Company Release (IR Newsroom)</option>
                  <option value="reputable_media">Reputable Financial Media</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="supportingNote" className="field-label">
                  Specific supporting note *
                </label>
                <input
                  id="supportingNote"
                  type="text"
                  value={supportingNote}
                  onChange={(e) => setSupportingNote(e.target.value)}
                  placeholder="What exact contractual or monetary fact does this document verify?"
                  className="field mt-1.5"
                />
              </div>
            </div>
          </div>

          {/* Publish action */}
          <div className="panel-sunken flex flex-col justify-between gap-4 p-4 sm:flex-row sm:items-center">
            <div>
              <div className="flex items-center gap-2.5">
                <input
                  type="checkbox"
                  id="isPublished"
                  checked={isPublished}
                  onChange={(e) => setIsPublished(e.target.checked)}
                  className="h-4 w-4 rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500"
                />
                <label
                  htmlFor="isPublished"
                  className="font-mono text-[11px] font-bold uppercase text-zinc-950"
                >
                  Publish directly to live ledger
                </label>
              </div>
              <p className="mt-1 text-[11px] text-zinc-500">
                If unchecked, record is preserved as an internal draft. If checked, source citation is
                strictly validated.
              </p>
            </div>

            <button type="submit" disabled={isSubmitting} className="btn btn-primary shrink-0">
              {isSubmitting ? 'Auditing…' : 'Save &amp; publish deal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
