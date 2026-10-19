import type { Metadata } from "next";
import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Page not found",
};

/**
 * 404 — deadpan, no drama.
 *
 * Wrong turn. Say so, then offer the three places a reader most likely wanted:
 * the verdict, the sourced ledger, or the method behind the number.
 */

export default function NotFound() {
  return (
    <div className="section-sm">
      <div className="max-w-reading space-y-5">
        <span className="label">Error 404</span>
        <h1 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">
          That page isn&apos;t here
        </h1>
        <p className="prose prose-lead">
          The address you followed doesn&apos;t match anything on this site. Nothing is broken — there is
          just no page at this URL. Here is where most readers were heading:
        </p>

        <div className="flex flex-wrap items-center gap-2">
          <Link href="/" className="btn btn-primary min-h-11">
            <span>The verdict</span>
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
          <Link href="/ledger" className="btn min-h-11">
            <span>The deal ledger</span>
          </Link>
          <Link href="/methodology" className="btn min-h-11">
            <span>The method</span>
          </Link>
        </div>

        <div className="panel">
          <p className="notice-title">Every page on this site</p>
          <ul className="prose-ul mt-2">
            <li className="prose-li">
              <Link href="/" className="prose-a">
                Verdict
              </Link>{" "}
              — the 12-month burst probability and what moves it
            </li>
            <li className="prose-li">
              <Link href="/ledger" className="prose-a">
                Deal ledger
              </Link>{" "}
              — every sourced financing, searchable and exportable
            </li>
            <li className="prose-li">
              <Link href="/markets" className="prose-a">
                Markets
              </Link>{" "}
              — listed quotes, Treasury yields and credit spreads
            </li>
            <li className="prose-li">
              <Link href="/companies" className="prose-a">
                Companies
              </Link>{" "}
              — debt, revenue and multiples by borrower
            </li>
            <li className="prose-li">
              <Link href="/dotcom-vs-ai" className="prose-a">
                2000 vs 2026
              </Link>{" "}
              — the last build-out, measured the same way
            </li>
            <li className="prose-li">
              <Link href="/methodology" className="prose-a">
                Methodology
              </Link>{" "}
              — the weights, the formulas and the backtests
            </li>
            <li className="prose-li">
              <Link href="/api-docs" className="prose-a">
                API
              </Link>{" "}
              — the same numbers over JSON
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}