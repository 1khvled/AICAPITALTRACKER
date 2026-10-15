'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { DealFormSchema } from '../../../../lib/validation/deal';
import { ShieldCheck, Plus, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function NewDealPage() {
  const router = useRouter();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  // Counterparty state
  const [companyId, setCompanyId] = useState('00000000-0000-0000-0000-000000000002'); // CoreWeave
  const [role, setRole] = useState('borrower');
  const [directionNote, setDirectionNote] = useState('');

  // Primary source citation state
  const [sourceUrl, setSourceUrl] = useState('');
  const [sourceTitle, setSourceTitle] = useState('');
  const [sourcePublisher, setSourcePublisher] = useState('');
  const [sourceType, setSourceType] = useState<'primary_filing' | 'company_release' | 'reputable_media'>('company_release');
  const [supportingNote, setSupportingNote] = useState('');

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTitle(val);
    const generatedSlug = val
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
    setSlug(generatedSlug);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
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
      parties: [
        {
          company_id: companyId,
          role: role as any,
          direction_note: directionNote || null,
        },
      ],
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
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div>
        <nav className="text-xs text-zinc-500 font-mono flex items-center space-x-2 mb-2">
          <Link href="/admin" className="hover:underline">ADMIN</Link>
          <span>/</span>
          <Link href="/admin/deals" className="hover:underline">DEALS</Link>
          <span>/</span>
          <span className="text-zinc-800 font-medium">NEW TRANSACTION</span>
        </nav>
        <div className="border-b border-zinc-200 pb-4">
          <h1 className="text-2xl sm:text-3xl font-black text-zinc-950 tracking-tight">
            Record New Transaction
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            Publishing requires at least one primary source citation. Undisclosed deals must not contain estimated values.
          </p>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-lg flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8 bg-white p-6 sm:p-8 border border-zinc-200 rounded-lg shadow-xs">
        {/* Section 1: Transaction Core */}
        <div className="space-y-4">
          <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 font-bold border-b border-zinc-100 pb-2">
            1. TRANSACTION IDENTIFICATION
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-mono font-semibold text-zinc-800">Deal Title *</label>
              <input
                type="text"
                required
                value={title}
                onChange={handleTitleChange}
                placeholder="e.g. CoreWeave $2.3B GPU-Collateralized Debt Facility"
                className="mt-1 w-full px-3 py-2 border border-zinc-300 rounded text-xs text-zinc-900 focus:ring-1 focus:ring-zinc-950"
              />
            </div>

            <div>
              <label className="block text-xs font-mono font-semibold text-zinc-800">URL Slug *</label>
              <input
                type="text"
                required
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="coreweave-2-3b-gpu-debt"
                className="mt-1 w-full px-3 py-2 border border-zinc-300 rounded text-xs font-mono text-zinc-900 focus:ring-1 focus:ring-zinc-950"
              />
            </div>

            <div>
              <label className="block text-xs font-mono font-semibold text-zinc-800">Classification *</label>
              <select
                value={dealType}
                onChange={(e) => setDealType(e.target.value)}
                className="mt-1 w-full px-2.5 py-2 border border-zinc-300 rounded text-xs text-zinc-900 bg-white font-mono"
              >
                <option value="debt_credit_facility">Debt / Credit Facility</option>
                <option value="equity_investment">Equity Investment</option>
                <option value="cloud_compute_contract">Cloud Compute Contract</option>
                <option value="power_purchase_agreement">Power Purchase Agreement</option>
                <option value="infrastructure_project_finance">Project Finance</option>
                <option value="strategic_partnership">Strategic Partnership</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-mono font-semibold text-zinc-800">
                Factual Summary * (min 20 chars, neutral tone)
              </label>
              <textarea
                required
                rows={3}
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="State the confirmed contractual and structural terms without editorial hype..."
                className="mt-1 w-full px-3 py-2 border border-zinc-300 rounded text-xs text-zinc-900 focus:ring-1 focus:ring-zinc-950 leading-relaxed"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Audit Standard & Dates */}
        <div className="space-y-4">
          <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 font-bold border-b border-zinc-100 pb-2">
            2. EVIDENCE LEVEL & TIMELINE
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-mono font-semibold text-zinc-800">Audit Standard *</label>
              <select
                value={evidenceLevel}
                onChange={(e) => setEvidenceLevel(e.target.value)}
                className="mt-1 w-full px-2.5 py-2 border border-zinc-300 rounded text-xs text-zinc-900 bg-white font-mono"
              >
                <option value="confirmed_primary">Confirmed Primary</option>
                <option value="reported_secondary">Reported Secondary</option>
                <option value="announced_not_completed">Announced (Pending)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono font-semibold text-zinc-800">Announcement Date</label>
              <input
                type="date"
                value={announcementDate}
                onChange={(e) => setAnnouncementDate(e.target.value)}
                className="mt-1 w-full px-3 py-2 border border-zinc-300 rounded text-xs text-zinc-900 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-mono font-semibold text-zinc-800">Effective Date</label>
              <input
                type="date"
                value={effectiveDate}
                onChange={(e) => setEffectiveDate(e.target.value)}
                className="mt-1 w-full px-3 py-2 border border-zinc-300 rounded text-xs text-zinc-900 font-mono"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Financial Terms */}
        <div className="space-y-4">
          <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 font-bold border-b border-zinc-100 pb-2">
            3. CAPITAL STRUCTURE & AMOUNTS
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="amountDisclosed"
              checked={amountDisclosed}
              onChange={(e) => setAmountDisclosed(e.target.checked)}
              className="rounded border-zinc-300 text-zinc-950 focus:ring-zinc-950"
            />
            <label htmlFor="amountDisclosed" className="text-xs font-semibold text-zinc-900">
              Amount was publicly disclosed (Leave unchecked if terms were undisclosed)
            </label>
          </div>

          {amountDisclosed && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-zinc-50 border border-zinc-200 rounded-lg">
              <div>
                <label className="block text-xs font-mono font-semibold text-zinc-800">Disclosed Numeric Value</label>
                <input
                  type="number"
                  value={amountValue}
                  onChange={(e) => setAmountValue(e.target.value)}
                  placeholder="2300000000"
                  className="mt-1 w-full px-3 py-1.5 border border-zinc-300 rounded text-xs font-mono text-zinc-900"
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-semibold text-zinc-800">Currency</label>
                <input
                  type="text"
                  maxLength={3}
                  value={amountCurrency}
                  onChange={(e) => setAmountCurrency(e.target.value.toUpperCase())}
                  className="mt-1 w-full px-3 py-1.5 border border-zinc-300 rounded text-xs font-mono text-zinc-900"
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-semibold text-zinc-800">Capital Basis</label>
                <select
                  value={amountBasis}
                  onChange={(e) => setAmountBasis(e.target.value)}
                  className="mt-1 w-full px-2.5 py-1.5 border border-zinc-300 rounded text-xs text-zinc-900 bg-white font-mono"
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

        {/* Section 4: Counterparty */}
        <div className="space-y-4">
          <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 font-bold border-b border-zinc-100 pb-2">
            4. PARTICIPATING COUNTERPARTY
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-mono font-semibold text-zinc-800">Entity</label>
              <select
                value={companyId}
                onChange={(e) => setCompanyId(e.target.value)}
                className="mt-1 w-full px-2.5 py-2 border border-zinc-300 rounded text-xs text-zinc-900 bg-white"
              >
                <option value="00000000-0000-0000-0000-000000000001">NVIDIA Corporation</option>
                <option value="00000000-0000-0000-0000-000000000002">CoreWeave</option>
                <option value="00000000-0000-0000-0000-000000000003">Microsoft Corporation</option>
                <option value="00000000-0000-0000-0000-000000000004">OpenAI</option>
                <option value="00000000-0000-0000-0000-000000000005">Amazon</option>
                <option value="00000000-0000-0000-0000-000000000006">Anthropic</option>
                <option value="00000000-0000-0000-0000-000000000008">Constellation Energy</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono font-semibold text-zinc-800">Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="mt-1 w-full px-2.5 py-2 border border-zinc-300 rounded text-xs text-zinc-900 bg-white font-mono"
              >
                <option value="borrower">Borrower</option>
                <option value="lender">Lender</option>
                <option value="investor">Investor</option>
                <option value="investee">Investee</option>
                <option value="supplier">Supplier</option>
                <option value="customer">Customer</option>
                <option value="utility">Utility</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono font-semibold text-zinc-800">Directional Scope</label>
              <input
                type="text"
                value={directionNote}
                onChange={(e) => setDirectionNote(e.target.value)}
                placeholder="e.g. Pledged GPU cluster"
                className="mt-1 w-full px-3 py-2 border border-zinc-300 rounded text-xs text-zinc-900"
              />
            </div>
          </div>
        </div>

        {/* Section 5: Primary Source Citation */}
        <div className="space-y-4">
          <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 font-bold border-b border-zinc-100 pb-2">
            5. PRIMARY AUDIT CITATION (MANDATORY TO PUBLISH)
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-mono font-semibold text-zinc-800">Document URL *</label>
              <input
                type="url"
                value={sourceUrl}
                onChange={(e) => setSourceUrl(e.target.value)}
                placeholder="https://www.sec.gov/Archives/... or official press release"
                className="mt-1 w-full px-3 py-2 border border-zinc-300 rounded text-xs text-zinc-900 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-mono font-semibold text-zinc-800">Document / Headline Title</label>
              <input
                type="text"
                value={sourceTitle}
                onChange={(e) => setSourceTitle(e.target.value)}
                placeholder="SEC Form 8-K / Official IR Release"
                className="mt-1 w-full px-3 py-2 border border-zinc-300 rounded text-xs text-zinc-900"
              />
            </div>

            <div>
              <label className="block text-xs font-mono font-semibold text-zinc-800">Publisher</label>
              <input
                type="text"
                value={sourcePublisher}
                onChange={(e) => setSourcePublisher(e.target.value)}
                placeholder="U.S. SEC / Microsoft Newsroom"
                className="mt-1 w-full px-3 py-2 border border-zinc-300 rounded text-xs text-zinc-900"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-mono font-semibold text-zinc-800">Specific Supporting Note *</label>
              <input
                type="text"
                value={supportingNote}
                onChange={(e) => setSupportingNote(e.target.value)}
                placeholder="What exact contractual or monetary fact does this document verify?"
                className="mt-1 w-full px-3 py-2 border border-zinc-300 rounded text-xs text-zinc-900"
              />
            </div>
          </div>
        </div>

        {/* Publish Action Box */}
        <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isPublished"
                checked={isPublished}
                onChange={(e) => setIsPublished(e.target.checked)}
                className="rounded border-zinc-300 text-zinc-950 focus:ring-zinc-950"
              />
              <label htmlFor="isPublished" className="text-xs font-bold font-mono uppercase text-zinc-950">
                Publish Directly to Live Ledger
              </label>
            </div>
            <p className="text-[11px] text-zinc-500 mt-0.5">
              If unchecked, record is preserved as an internal draft. If checked, source citation is strictly validated.
            </p>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2.5 bg-zinc-950 hover:bg-zinc-800 disabled:bg-zinc-400 text-white font-mono text-xs font-semibold uppercase tracking-wider rounded transition-colors shadow-xs"
          >
            {isSubmitting ? 'Auditing...' : 'Save & Publish Deal'}
          </button>
        </div>
      </form>
    </div>
  );
}
