import React from 'react';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service — AI Capital Tracker',
  description: 'Terms of service and acceptable use for AI Capital Tracker.',
};

export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-6">
      <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Terms of Service</h1>
      <p className="text-sm text-slate-700 leading-relaxed">
        By accessing AICapitalTracker.com, you agree to these terms.
      </p>

      <h2 className="text-lg font-bold text-slate-900 pt-2">1. Informational & Research Use Only</h2>
      <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
        The information provided on this website is for informational and educational research purposes only. Nothing on this website constitutes investment advice, financial advice, credit ratings, legal advice, or a recommendation to purchase or sell securities.
      </p>

      <h2 className="text-lg font-bold text-slate-900 pt-2">2. Accuracy and Disclaimers</h2>
      <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
        While we strive for factual accuracy by citing public regulatory filings and verified sources, data is provided on an &ldquo;as is&rdquo; basis without warranties of completeness or fitness for a particular purpose.
      </p>

      <h2 className="text-lg font-bold text-slate-900 pt-2">3. Acceptable Use & Scraping</h2>
      <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
        Polite, rate-limited research queries are permitted. Automated abusive querying, denial-of-service attempts, or bypassing security controls is strictly prohibited.
      </p>
    </div>
  );
}
