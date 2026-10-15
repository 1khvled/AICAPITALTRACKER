import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { Mail, MessageSquare, ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Contact Editorial Desk — AI Capital Tracker',
  description: 'Contact our research team, suggest public filings, or request information.',
};

export default function ContactPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      <div className="border-b border-zinc-200 pb-5">
        <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-wider text-zinc-500 font-bold">
          <MessageSquare className="w-3.5 h-3.5 text-zinc-400" />
          <span>EDITORIAL CONTACT</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-zinc-950 tracking-tight mt-1">
          Contact the Research Desk
        </h1>
        <p className="text-sm text-zinc-500 mt-2">
          Connect with our analysts, report official SEC filings or company announcements, or suggest new data sources.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-6 bg-white border border-zinc-200 rounded-lg space-y-2">
          <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 font-bold">
            General Inquiries
          </div>
          <div className="text-sm font-mono font-bold text-zinc-950">
            contact@aicapitaltracker.com
          </div>
          <p className="text-xs text-zinc-500">
            Platform inquiries, data methodology questions, and general feedback.
          </p>
        </div>

        <div className="p-6 bg-white border border-zinc-200 rounded-lg space-y-2">
          <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 font-bold">
            Editorial & Audit
          </div>
          <div className="text-sm font-mono font-bold text-zinc-950">
            editorial@aicapitaltracker.com
          </div>
          <p className="text-xs text-zinc-500">
            Submit statutory filings, amendments, or factual corrections.
          </p>
        </div>

        <div className="p-6 bg-white border border-zinc-200 rounded-lg space-y-2">
          <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 font-bold">
            Press & Citations
          </div>
          <div className="text-sm font-mono font-bold text-zinc-950">
            press@aicapitaltracker.com
          </div>
          <p className="text-xs text-zinc-500">
            Academic, journalistic, and institutional research requests.
          </p>
        </div>
      </div>
    </div>
  );
}
