import React from 'react';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Corrections & Dispute Policy — AI Capital Tracker',
  description: 'Submit factual corrections, filing amendments, or dispute a transaction listing.',
};

export default function CorrectionsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-6">
      <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Corrections & Dispute Policy</h1>
      <p className="text-sm text-slate-700 leading-relaxed">
        Accuracy is paramount to AICapitalTracker. If you identify an inaccuracy in a deal amount, date, party role, or citation, or if a reported agreement was subsequently amended, terminated, or superseded, our editorial desk will review the documentation promptly.
      </p>

      <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 space-y-3">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">How to Submit a Correction</h2>
        <p className="text-xs text-slate-600 leading-relaxed">
          Please provide the following details so our editorial team can audit the record:
        </p>
        <ul className="text-xs text-slate-600 list-disc pl-5 space-y-1">
          <li>The URL or slug of the deal or company record on AICapitalTracker.</li>
          <li>The specific factual field in question (e.g., amount, closing status, counterparty).</li>
          <li>A direct link to the primary source or regulatory filing (SEC 8-K, 10-Q, official company IR release) proving the updated fact.</li>
        </ul>
        <div className="pt-2 text-xs font-mono text-slate-800">
          Direct submissions: <span className="underline">editorial@aicapitaltracker.com</span>
        </div>
      </div>

      <h2 className="text-xl font-bold text-slate-900 pt-4">Correction Log & Audit Process</h2>
      <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
        When an edit is confirmed, we update the record, set the updated timestamp, and log the action in our internal audit logs. Material revisions are recorded with an editorial note explaining what was changed and citing the superseding document.
      </p>
    </div>
  );
}
