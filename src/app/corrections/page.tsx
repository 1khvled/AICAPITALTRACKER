import React from 'react';
import { Metadata } from 'next';
import { Scale, Mail, AlertCircle, FileCheck2 } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Corrections & Dispute Policy — AI Capital Tracker',
  description: 'Submit factual corrections, filing amendments, or dispute a transaction listing.',
};

export default function CorrectionsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      <div className="border-b border-zinc-200 pb-5">
        <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-wider text-zinc-500 font-bold">
          <Scale className="w-3.5 h-3.5 text-zinc-400" />
          <span>EDITORIAL AUDIT PROCESS</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-zinc-950 tracking-tight mt-1">
          Corrections & Dispute Policy
        </h1>
        <p className="text-sm text-zinc-500 mt-2">
          Factual accuracy is the core defensible asset of AICapitalTracker. If you identify an inaccuracy, we audit and correct it promptly.
        </p>
      </div>

      <div className="border border-zinc-200 rounded-lg p-6 bg-zinc-50 space-y-4 shadow-xs">
        <div className="flex items-center gap-2">
          <FileCheck2 className="w-4 h-4 text-zinc-950" />
          <h2 className="text-xs font-mono uppercase tracking-wider text-zinc-950 font-bold">
            How to Submit a Factual Revision
          </h2>
        </div>
        <p className="text-xs text-zinc-600 leading-relaxed">
          Please provide the following information to our research desk so our analysts can verify the underlying primary documentation:
        </p>
        <ul className="text-xs text-zinc-600 list-disc pl-5 space-y-1.5 leading-relaxed">
          <li>The exact slug or URL of the deal or company record on AICapitalTracker.</li>
          <li>The specific factual field in question (e.g., closing status, maturity date, counterparty, debt capacity vs drawn balance).</li>
          <li>A direct statutory link to an SEC Form 8-K/10-Q filing or official company IR release proving the revision.</li>
        </ul>
        <div className="pt-2 text-xs font-mono text-zinc-900 flex items-center gap-2">
          <Mail className="w-3.5 h-3.5 text-zinc-500" />
          <span>Direct email: <strong className="underline">editorial@aicapitaltracker.com</strong></span>
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="text-xl font-bold text-zinc-950">Revision Tracking & Audit Trail</h2>
        <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed">
          Whenever a transaction detail is amended or superseded, we update the timestamp, record the modification in our internal audit logs, and append an editorial revision note explaining the change and referencing the new source document.
        </p>
      </div>
    </div>
  );
}
