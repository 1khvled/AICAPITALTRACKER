import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Contact Editorial Desk — AI Capital Tracker',
  description: 'Contact our research team, suggest public filings, or request information.',
};

export default function ContactPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-6">
      <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Contact the Editorial Desk</h1>
      <p className="text-sm text-slate-700 leading-relaxed">
        Have questions about our data, want to report an official SEC filing or company announcement, or have inquiries regarding our research methodology? Reach out directly.
      </p>

      <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-4">
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">General Editorial Inquiries</h2>
          <p className="text-sm font-mono text-slate-900 mt-0.5">contact@aicapitaltracker.com</p>
        </div>

        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Corrections & Dispute Verification</h2>
          <p className="text-sm font-mono text-slate-900 mt-0.5">editorial@aicapitaltracker.com</p>
          <div className="mt-1">
            <Link href="/corrections" className="text-xs text-brand-600 hover:underline">
              Review Corrections Policy &rarr;
            </Link>
          </div>
        </div>

        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Press & Research Access</h2>
          <p className="text-sm font-mono text-slate-900 mt-0.5">press@aicapitaltracker.com</p>
        </div>
      </div>
    </div>
  );
}
