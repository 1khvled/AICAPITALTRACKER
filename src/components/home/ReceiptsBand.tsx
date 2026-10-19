import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

interface ReceiptsBandProps {
  trackedLabel: string;
  dealsCount: number;
}

/**
 * Section 4 — receipts.
 *
 * Two destinations only: the deal ledger and the 2000 comparison. Both exist to
 * prove the number above, not to compete with it.
 */
export function ReceiptsBand({ trackedLabel, dealsCount }: ReceiptsBandProps) {
  return (
    <section
      aria-labelledby="receipts-heading"
      className="panel rounded-md border-l-2 border-l-ink p-5 sm:p-6"
    >
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-xl">
          <span className="label">The receipts</span>
          <h2
            id="receipts-heading"
            className="mt-1.5 text-xl font-bold tracking-[-0.025em] text-ink sm:text-2xl"
          >
            Every number here is a tracked deal
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-ink-muted">
            {trackedLabel} of disclosed capital across {dealsCount} verified filings. The ledger shows
            the source, date and counterparty behind each figure, with no estimates mixed in.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row lg:shrink-0">
          <Link href="/ledger" className="btn btn-primary min-h-11 justify-center">
            <span>See the {dealsCount} deals</span>
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
          <Link href="/dotcom-vs-ai" className="btn min-h-11 justify-center">
            <span>Compare with 2000</span>
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
}
