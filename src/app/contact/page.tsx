'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Mail,
  MessageSquare,
  ShieldAlert,
  Lock,
  Send,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

export default function ContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [department, setDepartment] = useState('filing');
  const [sourceUrl, setSourceUrl] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('sending');
    setStatusMsg(null);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, message, department, sourceUrl }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Submission failed');
      }
      setStatus('success');
      setStatusMsg('Transmission received. An analyst will review within one business day.');
      setName('');
      setEmail('');
      setSourceUrl('');
      setMessage('');
    } catch (err: unknown) {
      setStatus('error');
      setStatusMsg(err instanceof Error ? err.message : 'Submission failed');
    }
  };

  /** One direct-inbox card. */
  function Inbox({ label, address, body }: { label: string; address: string; body: string }) {
    return (
      <div className="panel-interactive space-y-2 p-5">
        <div className="eyebrow">{label}</div>
        <div className="num text-sm font-bold text-zinc-950">{address}</div>
        <p className="text-xs leading-relaxed text-zinc-500">{body}</p>
      </div>
    );
  }

  return (
    <div className="pb-16">
      {/* Terminal hero */}
      <section className="hero-terminal">
        <div className="relative mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-14 lg:px-8">
          <p className="eyebrow-terminal text-emerald-300">
            <MessageSquare aria-hidden="true" className="h-3.5 w-3.5" />
            <span>Editorial communications &amp; statutory intake</span>
          </p>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-white sm:text-4xl">
            Contact the research desk
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-zinc-400">
            Connect directly with our analysts, submit statutory filings, report capital amendments, or
            securely transmit market intelligence.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-5xl space-y-12 px-4 pt-12 sm:px-6 lg:px-8">
        {/* Channels + dispatch form */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="space-y-4">
            <Inbox
              label="Statutory filings & SEC docket"
              address="filings@aicapitaltracker.com"
              body="Submit newly posted SEC Form 8-K, 10-Q, 10-K, or FERC regulatory docket updates."
            />
            <Inbox
              label="Editorial audit & corrections"
              address="editorial@aicapitaltracker.com"
              body="Submit formal factual revision requests or dispute recorded deal structures under our 48-hour protocol."
            />
            <Inbox
              label="Institutional citations & press"
              address="press@aicapitaltracker.com"
              body="Academic research data access, journalistic citation licensing, and API integrations."
            />

            {/* Secure transmission */}
            <div className="terminal-panel space-y-2.5 p-5">
              <div className="flex items-center gap-2 font-mono text-label font-bold uppercase tracking-wider text-emerald-400">
                <Lock aria-hidden="true" className="h-3.5 w-3.5" />
                <span>Encrypted intelligence intake</span>
              </div>
              <p className="text-xs leading-relaxed text-zinc-300">
                For confidential terms sheets, syndication memorandums, or regulatory briefings, contact our
                secure signal line or use our PGP fingerprint:
              </p>
              <div className="select-all break-all rounded border border-white/10 bg-black/40 p-2 font-mono text-[10px] text-zinc-400">
                4F9B 28E1 C704 90A2 B188 53FE D920 18A6 E33F 71C0
              </div>
            </div>
          </div>

          {/* Dispatch form */}
          <div className="panel space-y-5 p-6 sm:p-8 lg:col-span-2">
            <div>
              <div className="eyebrow eyebrow-mint">Secure intake</div>
              <h2 className="mt-1 text-lg font-bold text-zinc-950">Transmit inquiry or filing lead</h2>
              <p className="mt-1 text-xs text-zinc-500">
                Direct submission to the monitoring analyst on duty. All submissions are reviewed within one
                business day.
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
                  <label htmlFor="contact-name" className="field-label">
                    Your full name / entity affiliation
                  </label>
                  <input
                    id="contact-name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Elena Rostova (Capital Markets Analyst)"
                    className="field mt-1.5"
                  />
                </div>

                <div>
                  <label htmlFor="contact-email" className="field-label">
                    Official email address
                  </label>
                  <input
                    id="contact-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="analyst@firm.com"
                    className="field mt-1.5"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="contact-department" className="field-label">
                    Inquiry department
                  </label>
                  <select
                    id="contact-department"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="field-native mt-1.5"
                  >
                    <option value="filing">Statutory Filing Submission (SEC/FERC)</option>
                    <option value="correction">Deal Detail Revision / Dispute</option>
                    <option value="leak">Market Intelligence / Confidential Lead</option>
                    <option value="academic">Academic Research / Data License</option>
                    <option value="general">General Editorial Inquiry</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="contact-source" className="field-label">
                    Primary source link / accession URL (optional)
                  </label>
                  <input
                    id="contact-source"
                    type="url"
                    value={sourceUrl}
                    onChange={(e) => setSourceUrl(e.target.value)}
                    placeholder="https://www.sec.gov/Archives/edgar/data/..."
                    className="field-mono mt-1.5"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="contact-message" className="field-label">
                  Detailed transmission / notes
                </label>
                <textarea
                  id="contact-message"
                  rows={4}
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Detail the counterparty, exact monetary facility, debt tranche, or specific factual discrepancy..."
                  className="field mt-1.5"
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <span className="font-mono text-[11px] text-zinc-500">
                  Encrypted via TLS 1.3{' '}
                  <span aria-hidden="true">{'//'}</span> strictly confidential
                </span>
                <button type="submit" disabled={status === 'sending'} className="btn btn-primary">
                  <span>{status === 'sending' ? 'Dispatching…' : 'Dispatch submission'}</span>
                  <Send aria-hidden="true" className="h-3.5 w-3.5" />
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Regional desks */}
        <section className="space-y-4 border-t border-zinc-200 pt-10">
          <div>
            <div className="eyebrow eyebrow-mint">Regional desks</div>
            <h2 className="mt-1 text-xl font-bold tracking-tight text-zinc-950">Research coverage desks</h2>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                city: 'New York (HQ)',
                zone: 'Wall Street Financial District',
                body: 'Private credit, syndicate loans, asset-backed securities.',
              },
              {
                city: 'Washington, D.C.',
                zone: 'K Street Regulatory Corridor',
                body: 'FERC grid interconnects, NRC nuclear licensing, antitrust.',
              },
              {
                city: 'San Francisco',
                zone: 'South Park Frontier Cluster',
                body: 'Foundation labs, GPU cloud allocation, neoclouds.',
              },
              {
                city: 'London & Middle East',
                zone: 'Canary Wharf & Riyadh Hub',
                body: 'Sovereign compute funds, Alat, MGX, UKRI infrastructure.',
              },
            ].map((desk) => (
              <div key={desk.city} className="panel-interactive space-y-1 p-4">
                <div className="text-xs font-bold text-zinc-950">{desk.city}</div>
                <div className="font-mono text-[10px] text-zinc-500">{desk.zone}</div>
                <p className="mt-1 text-[11px] leading-relaxed text-zinc-600">{desk.body}</p>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-4 pt-2 font-mono text-[11px]">
            <Link href="/corrections" className="link-ledger">
              <ShieldAlert aria-hidden="true" className="h-3 w-3" />
              <span>Dispute a record under the 48-hour protocol</span>
            </Link>
            <Link href="mailto:editorial@aicapitaltracker.com" className="link-ledger">
              <Mail aria-hidden="true" className="h-3 w-3" />
              <span>editorial@aicapitaltracker.com</span>
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}