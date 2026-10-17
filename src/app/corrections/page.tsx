'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Scale,
  Clock,
  Send,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

export default function CorrectionsPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [transactionSlug, setTransactionSlug] = useState('');
  const [field, setField] = useState('amount');
  const [currentValue, setCurrentValue] = useState('');
  const [correctValue, setCorrectValue] = useState('');
  const [proofUrl, setProofUrl] = useState('');
  const [explanation, setExplanation] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('sending');
    setStatusMsg(null);
    try {
      const res = await fetch('/api/corrections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          message: explanation,
          transactionSlug,
          field,
          currentValue,
          correctValue,
          proofUrl,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Submission failed');
      }
      setStatus('success');
      setStatusMsg('Correction dossier received. The senior desk begins the 48-hour audit immediately.');
      setTransactionSlug('');
      setCurrentValue('');
      setCorrectValue('');
      setProofUrl('');
      setExplanation('');
    } catch (err: unknown) {
      setStatus('error');
      setStatusMsg(err instanceof Error ? err.message : 'Submission failed');
    }
  };

  return (
    <div className="pb-16">
      {/* Terminal hero */}
      <section className="hero-terminal">
        <div className="relative mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-14 lg:px-8">
          <p className="eyebrow-terminal text-emerald-300">
            <Scale aria-hidden="true" className="h-3.5 w-3.5" />
            <span>Institutional audit governance</span>
          </p>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-white sm:text-4xl">
            Corrections &amp; dispute resolution policy
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-zinc-400">
            AICapitalTracker adheres to an unyielding standard of balance-sheet truth. If any counterparty,
            lender, off-taker, or market participant identifies a factual error in our ledger, we execute our
            formal 48-hour statutory audit protocol.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-5xl space-y-12 px-4 pt-12 sm:px-6 lg:px-8">
        {/* 48-hour protocol */}
        <div className="terminal-panel space-y-4 p-6 sm:p-8">
          <div className="micro-label-terminal gap-2 tracking-wider text-emerald-400">
            <Clock aria-hidden="true" className="h-4 w-4" />
            <span>The 48-hour statutory review guarantee</span>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
            How every disputed transaction is audited
          </h2>
          <div className="grid grid-cols-1 gap-6 pt-2 text-xs leading-relaxed text-zinc-300 sm:text-sm md:grid-cols-3">
            {[
              {
                stage: 'Stage 1: Ingestion & freeze',
                body: 'Within 4 hours of receiving a verified challenge, our lead analyst places an internal audit hold on the record and cross-references the disputed item against official public EDGAR accessions.',
              },
              {
                stage: 'Stage 2: Primary re-verification',
                body: 'We evaluate the original source material against newly submitted evidence (e.g., Form 8-K/A amendments, credit agreement exhibits, or legal counsel declarations).',
              },
              {
                stage: 'Stage 3: Public log & notice',
                body: 'If an amendment is substantiated, the record is immediately updated with an editorial correction note, preserving historical diffs and attributing the correction.',
              },
            ].map((s) => (
              <div key={s.stage} className="space-y-1.5 border-l-2 border-emerald-500 pl-3">
                <div className="font-mono text-[11px] font-bold uppercase text-white">{s.stage}</div>
                <p>{s.body}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Requirements + form */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="space-y-5">
            <div className="panel space-y-3 p-5">
              <h3 className="text-sm font-bold text-zinc-950">Factual dispute thresholds</h3>
              <p className="text-xs text-zinc-600">We review disputes regarding:</p>
              <ul className="list-disc space-y-1.5 pl-4 text-xs text-zinc-600">
                <li>Mislabeled transaction basis (e.g. cash equity vs credit line).</li>
                <li>Disclosed drawn balance vs maximum facility capacity.</li>
                <li>Inaccurate debt maturity dates or amortization structures.</li>
                <li>Regulatory order mischaracterizations (e.g. FERC decisions).</li>
                <li>Incorrect corporate counterparty affiliations or parent entities.</li>
              </ul>
            </div>

            <div className="panel-sunken space-y-2 p-5">
              <div className="eyebrow">Corporate PR &amp; legal officers</div>
              <p className="text-xs leading-relaxed text-zinc-600">
                Legal representatives or investor relations officers may also dispatch disputes directly from
                corporate domain addresses to:
              </p>
              <div className="num text-xs font-bold text-zinc-950">editorial@aicapitaltracker.com</div>
            </div>
          </div>

          {/* Dossier form */}
          <div className="panel space-y-5 p-6 sm:p-8 lg:col-span-2">
            <div>
              <div className="eyebrow eyebrow-mint">Secure intake</div>
              <h2 className="mt-1 text-lg font-bold text-zinc-950">Submit factual correction dossier</h2>
              <p className="mt-1 text-xs text-zinc-500">
                Provide verifiable statutory citations. Disputed records are reviewed immediately by the
                senior desk editor.
              </p>
            </div>

            {status === 'success' && statusMsg && (
              <div
                role="status"
                aria-live="polite"
                className="notice notice-mint flex items-start gap-2"
              >
                <CheckCircle2 aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{statusMsg}</span>
              </div>
            )}
            {status === 'error' && statusMsg && (
              <div
                role="alert"
                className="notice notice-rose flex items-start gap-2"
              >
                <AlertCircle aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{statusMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="corr-name" className="field-label">
                    Your full name
                  </label>
                  <input
                    id="corr-name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Dana Whitaker (General Counsel)"
                    className="field mt-1.5"
                  />
                </div>
                <div>
                  <label htmlFor="corr-email" className="field-label">
                    Official email address
                  </label>
                  <input
                    id="corr-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="counsel@company.com"
                    className="field mt-1.5"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="corr-slug" className="field-label">
                    Transaction slug or URL
                  </label>
                  <input
                    id="corr-slug"
                    type="text"
                    required
                    value={transactionSlug}
                    onChange={(e) => setTransactionSlug(e.target.value)}
                    placeholder="e.g. coreweave-2-3-billion-gpu-collateralized-debt-facility"
                    className="field-mono mt-1.5"
                  />
                </div>

                <div>
                  <label htmlFor="corr-field" className="field-label">
                    Factual field in question
                  </label>
                  <select
                    id="corr-field"
                    value={field}
                    onChange={(e) => setField(e.target.value)}
                    className="field-native mt-1.5"
                  >
                    <option value="amount">Amount / Basis Conflation</option>
                    <option value="status">Closing Status (Signed vs Closed vs Proposed)</option>
                    <option value="parties">Counterparty Entity / Role</option>
                    <option value="dates">Announcement / Effective Date</option>
                    <option value="evidence">Evidence Classification Level</option>
                    <option value="other">Other Statutory Details</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="corr-current" className="field-label">
                    Current listed value
                  </label>
                  <input
                    id="corr-current"
                    type="text"
                    required
                    value={currentValue}
                    onChange={(e) => setCurrentValue(e.target.value)}
                    placeholder="e.g. $2,300,000,000"
                    className="field mt-1.5"
                  />
                </div>

                <div>
                  <label htmlFor="corr-correct" className="field-label">
                    Substantiated correct value
                  </label>
                  <input
                    id="corr-correct"
                    type="text"
                    required
                    value={correctValue}
                    onChange={(e) => setCorrectValue(e.target.value)}
                    placeholder="e.g. $8,500,000,000 (DDTL 4.0 expansion)"
                    className="field mt-1.5"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="corr-proof" className="field-label">
                  Primary statutory proof (SEC accession link, Form 8-K exhibit, FERC docket)
                </label>
                <input
                  id="corr-proof"
                  type="url"
                  required
                  value={proofUrl}
                  onChange={(e) => setProofUrl(e.target.value)}
                  placeholder="https://www.sec.gov/ix?doc=/Archives/edgar/data/..."
                  className="field-mono mt-1.5"
                />
              </div>

              <div>
                <label htmlFor="corr-explanation" className="field-label">
                  Explanation &amp; context
                </label>
                <textarea
                  id="corr-explanation"
                  rows={3}
                  required
                  value={explanation}
                  onChange={(e) => setExplanation(e.target.value)}
                  placeholder="Cite the exact page, item number, or legal clause establishing this correction..."
                  className="field mt-1.5"
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <span className="font-mono text-[11px] text-zinc-500">
                  Assigned to senior verification desk immediately
                </span>
                <button type="submit" disabled={status === 'sending'} className="btn btn-primary">
                  <span>{status === 'sending' ? 'Filing…' : 'Initiate audit'}</span>
                  <Send aria-hidden="true" className="h-3.5 w-3.5" />
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Audit log */}
        <section className="space-y-4 border-t border-zinc-200 pt-10">
          <div>
            <div className="eyebrow eyebrow-mint">Audit log integrity</div>
            <h2 className="mt-1 text-xl font-bold tracking-tight text-zinc-950">
              Permanent historical revision policy
            </h2>
            <p className="mt-1 text-xs text-zinc-500">
              We never silently delete or alter verified records. Every adjustment is recorded with an
              indelible audit changelog:
            </p>
          </div>

          <div className="panel space-y-3 p-5 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-2 text-[11px] text-zinc-500">
              <span className="uppercase tracking-wider">Audit trail standard example</span>
              <span className="pill pill-neutral">Status: immutable audit trail</span>
            </div>
            <div className="space-y-1.5 text-zinc-700">
              <div>
                <span className="text-zinc-500">[2024-11-04]</span> Record:{' '}
                <span className="break-all font-bold text-zinc-950">
                  talen-energy-aws-susquehanna-480mw-colocation-isa
                </span>
              </div>
              <div>
                <span className="text-zinc-500">[ACTION]</span> Status updated from{' '}
                <code className="rounded bg-zinc-100 px-1 py-0.5 text-zinc-800">signed</code> &rarr;{' '}
                <span className="pill pill-rose">disputed</span>
              </div>
              <div className="leading-relaxed">
                <span className="text-zinc-500">[CITATION]</span> Appended Federal Energy Regulatory
                Commission 2-1 Order Docket ER24-2172 (189 FERC &para; 61,088) rejecting interconnection
                agreement amendment.
              </div>
            </div>
          </div>

          <div className="pt-2 font-mono text-[11px]">
            <Link href="/contact" className="link-ledger">
              <span>Prefer email? Contact the research desk directly</span>
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}