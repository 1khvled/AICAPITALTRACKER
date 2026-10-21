import React from "react";
import Link from "next/link";
import {
  COMPANIES,
  companySlug,
  formatUsd,
  riskTone,
  type CompanyProfile,
} from "../../_components/companyData";

interface CompanyPeerComparisonProps {
  currentCompany: CompanyProfile;
}

export function CompanyPeerComparison({ currentCompany }: CompanyPeerComparisonProps) {
  // Sector peers, ranked by total disclosed volume descending (computed dynamically)
  const peers = COMPANIES.filter((c) => c.sector === currentCompany.sector).sort(
    (a, b) => (b.totalVolumeUsd || 0) - (a.totalVolumeUsd || 0)
  );

  const currentRank = peers.findIndex((c) => c.name === currentCompany.name) + 1;

  return (
    <section className="card space-y-4" aria-labelledby="peer-comparison-title">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-rule pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 id="peer-comparison-title" className="text-lg font-bold tracking-tight text-ink">
              Sector Peer Comparison
            </h2>
            <span className="pill">{currentCompany.sector}</span>
          </div>
          <p className="mt-0.5 text-[14px] text-ink-subtle">
            Ranked by total disclosed deal volume across all {peers.length} tracked companies in {currentCompany.sector}.{" "}
            {currentCompany.name} ranks <span className="num font-semibold text-ink">#{currentRank}</span> of {peers.length}.
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-[14px]">
          <caption className="sr-only">
            Peer comparison of {currentCompany.sector} companies ranked by disclosed volume
          </caption>
          <thead>
            <tr className="border-b border-rule text-ink-subtle">
              <th scope="col" className="py-2.5 pr-3 font-semibold w-12 text-center">#</th>
              <th scope="col" className="py-2.5 pr-4 font-semibold">Company</th>
              <th scope="col" className="py-2.5 pr-4 font-semibold text-right">Committed Volume</th>
              <th scope="col" className="py-2.5 pr-4 font-semibold text-right">Tracked Debt</th>
              <th scope="col" className="py-2.5 pr-4 font-semibold text-right">Valuation</th>
              <th scope="col" className="py-2.5 pr-4 font-semibold text-right">P/S Multiple</th>
              <th scope="col" className="py-2.5 pr-3 font-semibold text-center">Deals</th>
              <th scope="col" className="py-2.5 font-semibold text-right">Risk Tier</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-rule font-tabular">
            {peers.map((peer, idx) => {
              const isCurrent = peer.name === currentCompany.name;
              const slug = companySlug(peer.name);
              const rank = idx + 1;

              return (
                <tr
                  key={peer.name}
                  className={`transition-colors ${
                    isCurrent
                      ? "bg-surface-2 font-semibold border-l-2 border-l-[var(--c-accent)]"
                      : "hover:bg-surface-2"
                  }`}
                >
                  <td className="py-3 pr-3 text-center num text-ink-muted">{rank}</td>
                  <th scope="row" className="py-3 pr-4 font-medium text-ink">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/companies/${slug}`}
                        className={`min-h-[44px] flex items-center transition-colors hover:underline ${
                          isCurrent ? "font-bold text-ink" : "text-ink-muted hover:text-ink"
                        }`}
                      >
                        {peer.name}
                      </Link>
                      {isCurrent ? (
                        <span className="rounded-xs bg-surface-3 px-1.5 py-0.5 text-[12px] font-bold uppercase tracking-wider text-ink">
                          This company
                        </span>
                      ) : null}
                    </div>
                  </th>
                  <td className="num py-3 pr-4 text-right text-ink">
                    {peer.totalVolumeUsd > 0 ? formatUsd(peer.totalVolumeUsd) : "\u2014"}
                  </td>
                  <td
                    className={`num py-3 pr-4 text-right ${
                      peer.debtInvolvedUsd > 0 ? "text-risk-600 dark:text-risk-400 font-semibold" : "text-ink-faint"
                    }`}
                  >
                    {peer.debtInvolvedUsd > 0 ? formatUsd(peer.debtInvolvedUsd) : "None"}
                  </td>
                  <td className="num py-3 pr-4 text-right text-ink">
                    {formatUsd(peer.valuationUsd)}
                  </td>
                  <td className="num py-3 pr-4 text-right text-ink">
                    {peer.psMultiple ? `${peer.psMultiple}\u00d7` : "n/a"}
                  </td>
                  <td className="num py-3 pr-3 text-center text-ink-muted">
                    {peer.disclosedDealsCount}
                  </td>
                  <td className="py-3 text-right">
                    <span className={`pill pill-compact ${riskTone(peer.riskTier)}`}>
                      {peer.riskTier}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
