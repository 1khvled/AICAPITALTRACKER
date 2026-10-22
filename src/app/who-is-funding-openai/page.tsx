import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, RefreshCw } from "lucide-react";
import { AnswerPageLayout } from "@/components/answer-pages/AnswerPageLayout";
import { COMPANIES } from "@/app/companies/_components/companyData";
import {
  OPENAI_BACKER_GROUPS,
  OPENAI_MENTION_COUNT,
  OPENAI_NAMED_DEALS,
  OPENAI_NAMED_TOTAL_USD,
  ledgerAmount,
  resolveContracts,
} from "@/components/answer-pages/answerData";
import trajectoryHistory from "@/data/trajectory-history.json";
import { formatBillions, formatTrillions, formatAsOf } from "@/components/home/copy";

/** The funding number in the metadata is the ledger's own number. */
export function generateMetadata(): Metadata {
  const total = formatBillions(OPENAI_NAMED_TOTAL_USD);
  const description = `OpenAI's disclosed funding: ${total} of commitments name OpenAI, led by Microsoft, SoftBank, Thrive Capital, and cloud compute credit lines.`;

  return {
    title: "Who is funding OpenAI?",
    description,
    openGraph: {
      title: "Who is funding OpenAI?",
      description,
      url: "/who-is-funding-openai",
      type: "article",
      images: ["/opengraph-image.png"],
    },
    alternates: {
      canonical: "/who-is-funding-openai",
    },
  };
}

interface TrajectoryPointLite {
  date?: string;
}

export default function WhoIsFundingOpenAiPage() {
  const history = (Array.isArray(trajectoryHistory) ? trajectoryHistory : []) as TrajectoryPointLite[];
  const latestPoint = history[history.length - 1];
  const asOf = latestPoint?.date ? formatAsOf(latestPoint.date) : "21 Oct 2026";

  const openAiCompany = COMPANIES.find((c) => c.name === "OpenAI");
  const valuationDisplay = openAiCompany ? formatTrillions(openAiCompany.valuationUsd) : "—";
  const revenueDisplay = openAiCompany?.runRateRevenueUsd
    ? formatBillions(openAiCompany.runRateRevenueUsd)
    : "—";
  const psMultipleDisplay = openAiCompany?.psMultiple
    ? `${openAiCompany.psMultiple.toFixed(1)}×`
    : "—";
  const revolverUsd = openAiCompany?.debtInvolvedUsd ?? 0;

  // ── The four backer groups, summed from the ledger ───────────────────────
  const groups = OPENAI_BACKER_GROUPS.map((group) => {
    const usd = group.dealIds.reduce((sum, id) => sum + ledgerAmount(id), 0);
    return {
      ...group,
      usd,
      display: formatBillions(usd),
      pct: (usd / OPENAI_NAMED_TOTAL_USD) * 100,
    };
  });

  const equityGroup = groups.find((g) => g.key === "equity");
  const computeGroup = groups.find((g) => g.key === "compute");
  const equityPct = equityGroup?.pct ?? 0;

  const openAiDeals = [...OPENAI_NAMED_DEALS].sort(
    (a, b) => (b.amount_usd || 0) - (a.amount_usd || 0),
  );

  const totalVolumeDisplay = formatBillions(OPENAI_NAMED_TOTAL_USD);

  const polymarketContracts = resolveContracts([
    "poly-openai-ipo-2026",
    "poly-openai-1t-ipo",
    "poly-bubble-2027",
  ]);

  // ── The circularity numbers, read from the ledger ────────────────────────
  const microsoftEquityUsd = ledgerAmount("deal-158");
  const microsoftAzureUsd = ledgerAmount("deal-039");
  const oracleStargateUsd = ledgerAmount("deal-059");
  const nvidiaLoiUsd = ledgerAmount("deal-053");

  return (
    <AnswerPageLayout
      question="Who is funding OpenAI?"
      categoryLabel="Frontier Labs"
      asOf={asOf}
      answerLead={`SoftBank, Microsoft, NVIDIA and a syndicate of venture funds have put ${equityGroup?.display ?? "—"} of equity into OpenAI. But ${computeGroup?.display ?? "—"} of the ${totalVolumeDisplay} of disclosed commitments that name OpenAI is OpenAI BUYING compute — from the same companies. Only ${equityPct.toFixed(0)}% of the money is capital investors actually handed over.`}
      answerContext={`OpenAI carries no public bond on its balance sheet, but its build-out is anchored by circular compute relationships (investors who are also suppliers and customers). Equity investors such as Microsoft and SoftBank provide capital that is contractually committed back to Microsoft Azure, Oracle Cloud and Nvidia hardware.`}
      polymarketContracts={polymarketContracts}
      notThisItems={[
        "It is not a complete internal audit of OpenAI's private cap table (the full list of who owns what); employee secondary holdings, private founder shares, and undisclosed bilateral tranches are omitted.",
        "Circularity does not mean illegal or fraudulent conduct; it describes mutual dependencies where software buyers, cloud hosts, and hardware vendors invest in each other's capital raises.",
        "Multi-year compute contracts represent operational capacity obligations over 5 to 7 years, not upfront cash deposited into a bank account.",
        `Only ledger records where OpenAI is named in the transaction title are counted here — ${OPENAI_NAMED_DEALS.length} of them. The wider ledger mentions OpenAI inside ${OPENAI_MENTION_COUNT} records, but several of those are other companies' rounds and data-centre programmes that merely quote OpenAI in the description.`,
      ]}
    >
      {/* ── Key Metrics Summary Tiles ───────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="card p-4 space-y-1">
          <span className="label">Total Disclosed</span>
          <p className="num text-2xl font-bold text-ink">{totalVolumeDisplay}</p>
          <span className="text-[13px] text-ink-subtle">
            {openAiDeals.length} ledger transactions
          </span>
        </div>
        <div className="card p-4 space-y-1">
          <span className="label">Valuation Mark</span>
          <p className="num text-2xl font-bold text-ink">{valuationDisplay}</p>
          <span className="text-[13px] text-ink-subtle">
            {psMultipleDisplay} revenue multiple (price per $1 sales)
          </span>
        </div>
        <div className="card p-4 space-y-1">
          <span className="label">Run-Rate Revenue</span>
          <p className="num text-2xl font-bold text-ink">{revenueDisplay}</p>
          <span className="text-[13px] text-ink-subtle">
            Annualised (a full year of sales, if this quarter held)
          </span>
        </div>
        <div className="card p-4 space-y-1">
          <span className="label">Bank Credit Line</span>
          <p className="num text-2xl font-bold text-accent-strong dark:text-accent-ink">
            {formatBillions(revolverUsd)}
          </p>
          <span className="text-[13px] text-ink-subtle">Undrawn revolver (a flexible credit line)</span>
        </div>
      </div>

      {/* ── Section 1: Where the money comes from ───────────────────────────── */}
      <section aria-labelledby="sources-heading" className="card p-5 space-y-4 shadow-card">
        <div className="border-b border-rule pb-3">
          <h2 id="sources-heading" className="text-lg font-bold tracking-tight text-ink">
            Who supplies the capital: the four backer groups
          </h2>
          <p className="mt-0.5 text-[14px] text-ink-muted">
            Every figure below is summed from the {openAiDeals.length} ledger records that name
            OpenAI.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {groups.map((item) => (
            <div key={item.key} className="panel p-4 space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold text-ink text-[15px]">{item.label}</span>
                <span className="num font-mono font-bold text-accent-strong dark:text-accent-ink">
                  {item.display}
                </span>
              </div>
              <p className="num text-[12px] text-ink-faint">
                {item.pct.toFixed(0)}% of OpenAI&rsquo;s disclosed commitments
              </p>
              <p className="text-[14px] text-ink-muted leading-relaxed">{item.plain}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Section 2: Major Disclosed Deals Table ───────────────────────────── */}
      <section aria-labelledby="deals-heading" className="card p-5 space-y-4 shadow-card">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-rule pb-3">
          <div>
            <h2 id="deals-heading" className="text-lg font-bold tracking-tight text-ink">
              Verified capital deals &amp; compute commitments
            </h2>
            <p className="mt-0.5 text-[14px] text-ink-muted">
              Every ledger record where OpenAI is a named party, largest first.
            </p>
          </div>
          <Link
            href="/ledger?search=OpenAI"
            className="inline-flex min-h-[44px] items-center gap-1 text-[13px] font-medium text-ink underline decoration-rule underline-offset-4 hover:decoration-ink"
          >
            Filter OpenAI in ledger
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-[14px]">
            <caption className="sr-only">
              Verified financial rounds, compute leases, and equity investments involving OpenAI
            </caption>
            <thead>
              <tr className="border-b border-rule text-ink-subtle">
                <th scope="col" className="py-2.5 pr-4 font-semibold">Deal / Transaction</th>
                <th scope="col" className="py-2.5 pr-4 font-semibold">Date</th>
                <th scope="col" className="py-2.5 pr-4 font-semibold">Category</th>
                <th scope="col" className="py-2.5 pr-4 font-semibold text-right">Disclosed Amount</th>
                <th scope="col" className="py-2.5 font-semibold text-right">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rule font-tabular">
              {openAiDeals.slice(0, 12).map((deal) => (
                <tr key={deal.id} className="hover:bg-surface-2 transition-colors">
                  <th scope="row" className="py-3 pr-4 font-medium text-ink max-w-sm sm:max-w-md">
                    <Link
                      href={`/ledger?deal=${deal.id}`}
                      className="min-h-[44px] flex items-center transition-colors hover:underline"
                    >
                      {deal.title}
                    </Link>
                  </th>
                  <td className="py-3 pr-4 num text-ink-muted whitespace-nowrap">
                    {deal.announced_date}
                  </td>
                  <td className="py-3 pr-4 text-ink-muted">{deal.category}</td>
                  <td className="py-3 pr-4 font-mono font-bold text-ink text-right whitespace-nowrap">
                    {deal.amount_display || (deal.amount_usd ? formatBillions(deal.amount_usd) : "Not disclosed")}
                  </td>
                  <td className="py-3 text-right">
                    <Link
                      href={`/ledger?deal=${deal.id}`}
                      className="inline-flex min-h-[44px] items-center text-[13px] font-medium text-ink underline decoration-rule underline-offset-4 hover:decoration-ink"
                    >
                      Receipt
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── Section 3: The Circularity Question in Plain Words ────────────────── */}
      <section aria-labelledby="circularity-heading" className="panel p-5 space-y-4 rule-accent-left">
        <div className="flex items-center gap-2">
          <RefreshCw className="h-5 w-5 text-accent-strong dark:text-accent-ink shrink-0" aria-hidden="true" />
          <h2 id="circularity-heading" className="text-lg font-bold tracking-tight text-ink">
            The circularity question: is a lender also a customer?
          </h2>
        </div>

        <div className="space-y-3 text-[15px] leading-relaxed text-ink-muted">
          <p>
            In traditional industry financing, an independent bank lends cash to a company, which
            then buys goods from suppliers at arms-length competitive market rates.
          </p>
          <p>
            <strong className="text-ink font-semibold">
              OpenAI operates in a circular ecosystem:
            </strong>
          </p>
          <ul className="space-y-2 pl-4 list-disc text-ink-muted">
            <li>
              <strong className="text-ink">Microsoft</strong> has put at least{" "}
              {formatBillions(microsoftEquityUsd)} of disclosed cash into OpenAI and has committed to
              sell OpenAI {formatBillions(microsoftAzureUsd)} of Azure computing services. The money
              comes back to the same balance sheet.
            </li>
            <li>
              <strong className="text-ink">Oracle</strong> constructs dedicated multi-gigawatt data
              center campuses financed by corporate debt notes, which OpenAI commits to lease over
              five years under the Stargate program &mdash; {formatBillions(oracleStargateUsd)} of
              it.
            </li>
            <li>
              <strong className="text-ink">NVIDIA</strong> supplies the GPU hardware powering those
              data centers, while also participating directly as an equity investor in
              OpenAI&rsquo;s strategic funding rounds &mdash; its letter of intent alone is worth{" "}
              {formatBillions(nvidiaLoiUsd)}.
            </li>
          </ul>
          <p>
            Our model rates OpenAI&rsquo;s circularity exposure as{" "}
            <span className="chip chip-risk font-semibold">
              {openAiCompany?.circularRiskLevel ?? "High (Circular)"}
            </span>{" "}
            because revenue growth across multiple nodes in the chain depends on the same underlying
            pool of capital circulating between investors, hosts, and chipmakers.
          </p>
        </div>
      </section>
    </AnswerPageLayout>
  );
}
