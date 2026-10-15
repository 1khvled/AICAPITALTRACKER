'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { DealFormSchema } from '../../../../lib/validation/deal';

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
  const [companyId, setCompanyId] = useState('00000000-0000-0000-0000-000000000002'); // CoreWeave default
  const [role, setRole] = useState('borrower');
  const [directionNote, setDirectionNote] = useState('');

  // Primary source citation state
  const [sourceUrl, setSourceUrl] = useState('');
  const [sourceTitle, setSourceTitle] = useState('');
  const [sourcePublisher, setSourcePublisher] = useState('');
  const [sourceType, setSourceType] = useState<'primary_filing' | 'company_release' | 'reputable_media'>('company_release');
  const [supportingNote, setSupportingNote] = useState('');

  // Auto slug generation from title
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
            title: sourceTitle.trim() || 'Official Release',
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

    // Validate using Zod schema
    const validation = DealFormSchema.safeParse(payload);
    if (!validation.success) {
      const issue = validation.error.issues[0];
      setErrorMsg(`Validation Error (${issue.path.join('.') || 'root'}): ${issue.message}`);
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

      setSuccessMsg('Deal successfully saved and validated!');
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
        <nav className="text-xs text-slate-500 flex items-center space-x-2 mb-2">
          <Link href="/admin" className="hover:underline">Admin</Link>
          <span>/</span>
          <Link href="/admin/deals" className="hover:underline">Deals</Link>
          <span>/</span>
          <span className="text-slate-800 font-medium">New</span>
        </nav>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Create & Verify Transaction Record
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Every deal record is strictly validated. A published deal requires at least one primary source citation.
        </p>
      </div>

      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-md">
          {errorMsg}
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-md">
          {successMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 sm:p-8 border border-slate-200 rounded-lg shadow-xs">
        {/* Core Metadata */}
        <div className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-900 border-b border-slate-100 pb-2">
            1. Core Transaction Details
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700">Deal Title *</label>
              <input
                type="text"
                required
                value={title}
                onChange={handleTitleChange}
                placeholder="e.g. CoreWeave $2.3B GPU-Collateralized Debt Facility"
                className="mt-1 w-full px-3 py-2 border border-slate-300 rounded text-xs text-slate-900 focus:ring-1 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700">Unique URL Slug *</label>
              <input
                type="text"
                required
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="e.g. coreweave-2-3b-gpu-debt"
                className="mt-1 w-full px-3 py-2 border border-slate-300 rounded text-xs font-mono text-slate-900 focus:ring-1 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700">Deal Category *</label>
              <select
                value={dealType}
                onChange={(e) => setDealType(e.target.value)}
                className="mt-1 w-full px-2.5 py-2 border border-slate-300 rounded text-xs text-slate-900 bg-white"
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
              <label className="block text-xs font-semibold text-slate-700">Neutral Factual Summary * (min 20 chars)</label>
              <textarea
                required
                rows={3}
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="State the confirmed factual terms without speculation or promotional adjectives..."
                className="mt-1 w-full px-3 py-2 border border-slate-300 rounded text-xs text-slate-900 focus:ring-1 focus:ring-brand-500"
              />
            </div>
          </div>
        </div>

        {/* Classification & Dates */}
        <div className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-900 border-b border-slate-100 pb-2">
            2. Evidence & Timeline
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700">Evidence Level *</label>
              <select
                value={evidenceLevel}
                onChange={(e) => setEvidenceLevel(e.target.value)}
                className="mt-1 w-full px-2.5 py-2 border border-slate-300 rounded text-xs text-slate-900 bg-white"
              >
                <option value="confirmed_primary">Confirmed Primary</option>
                <option value="reported_secondary">Reported Secondary</option>
                <option value="announced_not_completed">Announced (Pending)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700">Announcement Date</label>
              <input
                type="date"
                value={announcementDate}
                onChange={(e) => setAnnouncementDate(e.target.value)}
                className="mt-1 w-full px-3 py-2 border border-slate-300 rounded text-xs text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700">Effective Date</label>
              <input
                type="date"
                value={effectiveDate}
                onChange={(e) => setEffectiveDate(e.target.value)}
                className="mt-1 w-full px-3 py-2 border border-slate-300 rounded text-xs text-slate-900"
              />
            </div>
          </div>
        </div>

        {/* Financial Amounts */}
        <div className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-900 border-b border-slate-100 pb-2">
            3. Financial Disclosures
          </h2>

          <div className="flex items-center gap-2 mb-2">
            <input
              type="checkbox"
              id="amountDisclosed"
              checked={amountDisclosed}
              onChange={(e) => setAmountDisclosed(e.target.checked)}
              className="rounded border-slate-300 text-brand-600 focus:ring-brand-500"
            />
            <label htmlFor="amountDisclosed" className="text-xs font-medium text-slate-700">
              Deal Amount was Publicly Disclosed (Leave unchecked if terms were undisclosed)
            </label>
          </div>

          {amountDisclosed && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-slate-50 border border-slate-200 rounded">
              <div>
                <label className="block text-xs font-semibold text-slate-700">Disclosed Amount (Numeric)</label>
                <input
                  type="number"
                  value={amountValue}
                  onChange={(e) => setAmountValue(e.target.value)}
                  placeholder="e.g. 2300000000"
                  className="mt-1 w-full px-3 py-1.5 border border-slate-300 rounded text-xs font-mono text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">Currency</label>
                <input
                  type="text"
                  maxLength={3}
                  value={amountCurrency}
                  onChange={(e) => setAmountCurrency(e.target.value.toUpperCase())}
                  className="mt-1 w-full px-3 py-1.5 border border-slate-300 rounded text-xs font-mono text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">Amount Basis</label>
                <select
                  value={amountBasis}
                  onChange={(e) => setAmountBasis(e.target.value)}
                  className="mt-1 w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs text-slate-900 bg-white"
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

        {/* Counterparty Role */}
        <div className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-900 border-b border-slate-100 pb-2">
            4. Counterparty Role
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700">Entity</label>
              <select
                value={companyId}
                onChange={(e) => setCompanyId(e.target.value)}
                className="mt-1 w-full px-2.5 py-2 border border-slate-300 rounded text-xs text-slate-900 bg-white"
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
              <label className="block text-xs font-semibold text-slate-700">Transaction Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="mt-1 w-full px-2.5 py-2 border border-slate-300 rounded text-xs text-slate-900 bg-white"
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
              <label className="block text-xs font-semibold text-slate-700">Role Direction Note</label>
              <input
                type="text"
                value={directionNote}
                onChange={(e) => setDirectionNote(e.target.value)}
                placeholder="e.g. Pledged GPU cluster"
                className="mt-1 w-full px-3 py-2 border border-slate-300 rounded text-xs text-slate-900"
              />
            </div>
          </div>
        </div>

        {/* Source Citation (Required if Published) */}
        <div className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-900 border-b border-slate-100 pb-2">
            5. Primary Source Citation (Required for Publishing)
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700">Source Document URL *</label>
              <input
                type="url"
                value={sourceUrl}
                onChange={(e) => setSourceUrl(e.target.value)}
                placeholder="https://news.microsoft.com/... or https://www.sec.gov/..."
                className="mt-1 w-full px-3 py-2 border border-slate-300 rounded text-xs text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700">Document / Headline Title</label>
              <input
                type="text"
                value={sourceTitle}
                onChange={(e) => setSourceTitle(e.target.value)}
                placeholder="e.g. Official Press Release / SEC Form 8-K"
                className="mt-1 w-full px-3 py-2 border border-slate-300 rounded text-xs text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700">Publisher</label>
              <input
                type="text"
                value={sourcePublisher}
                onChange={(e) => setSourcePublisher(e.target.value)}
                placeholder="e.g. Microsoft Newsroom / SEC EDGAR"
                className="mt-1 w-full px-3 py-2 border border-slate-300 rounded text-xs text-slate-900"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700">Specific Supporting Note *</label>
              <input
                type="text"
                value={supportingNote}
                onChange={(e) => setSupportingNote(e.target.value)}
                placeholder="What exact fact does this document substantiate? (e.g. Confirms $10B commitment and Azure exclusivity)"
                className="mt-1 w-full px-3 py-2 border border-slate-300 rounded text-xs text-slate-900"
              />
            </div>
          </div>
        </div>

        {/* Publish Checkbox */}
        <div className="p-4 bg-slate-100 rounded-md flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isPublished"
                checked={isPublished}
                onChange={(e) => setIsPublished(e.target.checked)}
                className="rounded border-slate-300 text-brand-600 focus:ring-brand-500"
              />
              <label htmlFor="isPublished" className="text-xs font-bold text-slate-900">
                Publish to Public Deal Ledger
              </label>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              If unchecked, deal remains a private draft. If checked, source citation is mandatory.
            </p>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white font-medium text-xs rounded transition-colors"
          >
            {isSubmitting ? 'Validating...' : 'Save & Audit Deal'}
          </button>
        </div>
      </form>
    </div>
  );
}
