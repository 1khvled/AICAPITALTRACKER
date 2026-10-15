import React from 'react';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy — AI Capital Tracker',
  description: 'Privacy policy and data handling practices for AI Capital Tracker.',
};

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-6">
      <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Privacy Policy</h1>
      <p className="text-sm text-slate-700 leading-relaxed">
        AICapitalTracker respects your privacy. We operate as an open research database and do not sell personal data.
      </p>

      <h2 className="text-lg font-bold text-slate-900 pt-2">1. Information Collection</h2>
      <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
        Public browsing of our website does not require an account or registration. Standard web server logs (IP address, user agent, requested URL) are processed temporarily to ensure system reliability and security.
      </p>

      <h2 className="text-lg font-bold text-slate-900 pt-2">2. Cookies & Analytics</h2>
      <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
        We do not use invasive cross-site tracking cookies. Any analytics used are strictly aggregated and privacy-respecting to measure search performance and popular research categories.
      </p>

      <h2 className="text-lg font-bold text-slate-900 pt-2">3. Third-Party Links</h2>
      <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
        Our ledger contains links to external primary sources (SEC EDGAR, company newsrooms, reputable news outlets). We are not responsible for the privacy practices of external websites.
      </p>
    </div>
  );
}
