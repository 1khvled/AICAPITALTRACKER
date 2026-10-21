import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Building, Layers, RefreshCw, ShieldAlert, CheckCircle2, DollarSign } from "lucide-react";
import { AnswerPageLayout } from "@/components/answer-pages/AnswerPageLayout";
import { COMPANIES } from "@/app/companies/_components/companyData";
import { getCompanyDeals } from "@/app/companies/_components/ledgerSearchTerms";
import trajectoryHistory from "@/data/trajectory-history.json";
import { formatBillions, formatAsOf } from "@/components/home/copy";
import { POLYMARKET_REFERRAL_CODE } from "@/data/polymarket-data";

export const metadata: Metadata = {
  title: "Who is funding OpenAI?",
  description:
    "OpenAI is funded by over $305B in cumulative capital commitments from Microsoft, SoftBank, Thrive Capital, and cloud compute credit lines.",
  openGraph: {
    title: "Who is funding OpenAI?",
    description:
      "OpenAI is funded by over $305B in cumulative capital commitments from Microsoft, SoftBank, Thrive Capital, and cloud compute credit lines.",
    url: "/who-is-funding-openai",
    type: "article",
    images: ["/opengraph-image.png"],
  },
  alternates: {
    canonical: "/who-is-funding-openai",
  },
};

interface TrajectoryPointLite {
  date?: string;
}

export default function WhoIsFundingOpenAiPage() {
  const history = (Array.isArray(trajectoryHistory) ? trajectoryHistory : []) as TrajectoryPointLite[];
  const latestPoint = history[history.length - 1];
  const asOf = latestPoint?.date ? formatAsOf(latestPoint.date) : "21 Oct 2026";

  const openAiCompany = COMPANIES.find((c) => c.name === "OpenAI");
  const valuationDisplay = openAiCompany ? `$${(openAiCompany.valuationUsd / 1e12).toFixed(1)}T` : "$1.2T";
  const revenueDisplay = openAiCompany?.runRateRevenueUsd
    ? `$${(openAiCompany.runRateRevenueUsd / 1e9).toFixed(1)}B`
    : "$50.0B";
  const psMultipleDisplay = openAiCompany?.psMultiple ? `${openAiCompany.psMultiple.toFixed(1)}×` : "24.0×";

  // Filter OpenAI deals from ledger
  const openAiDeals = getCompanyDeals("OpenAI")
    .sort((a, b) => (b.amount_usd || 0) - (a.amount_usd || 0));

  const totalVolumeUsd = openAiCompany?.totalVolumeUsd ?? 305_900_000_000;
  const totalVolumeDisplay = formatBillions(totalVolumeUsd);

  const polymarketContracts = [
    {
      question: "Will OpenAI complete an IPO by December 31, 2026?",
      probabilityPct: 4.3,
      volumeDisplay: "$1.1M",
      url: `https://polymarket.com/event/openai-ipo-by?r=${POLYMARKET_REFERRAL_CODE}`,
    },
    {
      question: "Will OpenAI IPO with a market cap of $1T+ before 2027?",
      probabilityPct: 2.4,
      volumeDisplay: "$317k",
      url: `https://polymarket.com/event/openai-1t-ipo-before-2027?r=${POLYMARKET_REFERRAL_CODE}`,
    },
    {
      question: "Will OpenAI officially announce achieved AGI before 2027?",
      probabilityPct: 8.5,
      volumeDisplay: "$325k",
      url: `https://polymarket.com/event/openai-announces-it-has-achieved-agi-before-2027?r=${POLYMARKET_REFERRAL_CODE}`,
    },
  ];

  // Capital source categories
  const investorCategories = [
    { category: "Big Tech Cloud Partners", amountDisplay: "$288.0B+", desc: "Microsoft ($13B+ equity + $250B Azure commitment) and Amazon AWS ($38B 7-year compute)" },
    { category: "Sovereign & Strategic", amountDisplay: "$58.3B+", desc: "SoftBank Group ($50B across tranches), MGX (Abu Dhabi), and Dragoneer" },
    { category: "Venture Capital Syndicates", amountDisplay: "$14.9B+", desc: "Thrive Capital, Khosla Ventures, Founders Fund, and Fidelity" },
    { category: "Hardware Supplier LOIs", amountDisplay: "$100.0B+", desc: "NVIDIA (up to $100B 10 GW deployment letter of intent) and Broadcom custom silicon" },
  ];

  return (
    <AnswerPageLayout
      question="Who is funding OpenAI?"
      categoryLabel="Frontier Labs"
      asOf={asOf}
      answerLead={`OpenAI is funded by over ${totalVolumeDisplay} in verified capital rounds, strategic equity investments, and multi-year cloud compute commitments led by Microsoft, SoftBank Group, Thrive Capital, MGX, and Nvidia.`}
      answerContext={`While OpenAI carries zero public bond debt on its balance sheet, its build-out is anchored by circular compute relationships: equity investors such as Microsoft and SoftBank provide capital that is contractually committed back to Microsoft Azure, Oracle Cloud, and Nvidia hardware.`}
      polymarketContracts={polymarketContracts}
      notThisItems={[
        "It is not a complete internal audit of OpenAI's private cap table; employee secondary holdings, private founder shares, and undisclosed bilateral tranches are omitted.",
        "Circularity does not mean illegal or fraudulent conduct; it describes mutual dependencies where software buyers, cloud hosts, and hardware vendors invest in each other's capital raises.",
        "Multi-year compute contracts (such as the $250B Azure commitment) represent operational capacity obligations over 5 to 7 years, not upfront cash deposited into a bank account.",
      ]}
    >
      {/* ── Key Metrics Summary Tiles ───────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="card p-4 space-y-1">
          <span className="label">Total Disclosed</span>
          <p className="num text-2xl font-bold text-ink">{totalVolumeDisplay}</p>
          <span className="text-[13px] text-ink-subtle">{openAiDeals.length} ledger transactions</span>
        </div>
        <div className="card p-4 space-y-1">
          <span className="label">Valuation Mark</span>
          <p className="num text-2xl font-bold text-ink">{valuationDisplay}</p>
          <span className="text-[13px] text-ink-subtle">{psMultipleDisplay} revenue multiple</span>
        </div>
        <div className="card p-4 space-y-1">
          <span className="label">Run-Rate Revenue</span>
          <p className="num text-2xl font-bold text-ink">{revenueDisplay}</p>
          <span className="text-[13px] text-ink-subtle">Approaching $50B ARR</span>
        </div>
        <div className="card p-4 space-y-1">
          <span className="label">Bank Credit Line</span>
          <p className="num text-2xl font-bold text-accent-strong dark:text-accent-ink">$4.0B</p>
          <span className="text-[13px] text-ink-subtle">Undrawn syndicate revolver</span>
        </div>
      </div>

      {/* ── Section 1: Major Disclosed Deals Table ───────────────────────────── */}
      <section aria-labelledby="deals-heading" className="card p-5 space-y-4 shadow-card">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-rule pb-3">
          <div>
            <h2 id="deals-heading" className="text-lg font-bold tracking-tight text-ink">
              Verified Capital Deals &amp; Compute Commitments
            </h2>
            <p className="mt-0.5 text-[14px] text-ink-muted">
              Every discrete equity raise and compute contract recorded in the research ledger.
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
              {openAiDeals.slice(0, 10).map((deal) => (
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
                  <td className="py-3 pr-4 text-ink-muted">
                    {deal.category}
                  </td>
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

      {/* ── Section 2: Capital Sources by Category ──────────────────────────── */}
      <section aria-labelledby="sources-heading" className="card p-5 space-y-4 shadow-card">
        <div className="border-b border-rule pb-3">
          <h2 id="sources-heading" className="text-lg font-bold tracking-tight text-ink">
            Who Supplies the Capital: The Four Backer Groups
          </h2>
          <p className="mt-0.5 text-[14px] text-ink-muted">
            The funding syndicate behind OpenAI spans hyperscalers, venture funds, and hardware vendors.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {investorCategories.map((item) => (
            <div key={item.category} className="panel p-4 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-ink text-[15px]">{item.category}</span>
                <span className="num font-mono font-bold text-accent-strong dark:text-accent-ink">
                  {item.amountDisplay}
                </span>
              </div>
              <p className="text-[14px] text-ink-muted leading-relaxed">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Section 3: The Circularity Question in Plain Words ────────────────── */}
      <section aria-labelledby="circularity-heading" className="panel p-5 space-y-4 rule-accent-left">
        <div className="flex items-center gap-2">
          <RefreshCw className="h-5 w-5 text-accent-strong dark:text-accent-ink shrink-0" aria-hidden="true" />
          <h2 id="circularity-heading" className="text-lg font-bold tracking-tight text-ink">
            The Circularity Question: &ldquo;Is a Lender Also a Customer?&rdquo;
          </h2>
        </div>

        <div className="space-y-3 text-[15px] leading-relaxed text-ink-muted">
          <p>
            In traditional industry financing, an independent bank lends cash to a company, which then buys goods from suppliers at arms-length competitive market rates.
          </p>
          <p>
            <strong className="text-ink font-semibold">OpenAI operates in a circular ecosystem:</strong>
          </p>
          <ul className="space-y-2 pl-4 list-disc text-ink-muted">
            <li>
              <strong className="text-ink">Microsoft</strong> invests $13B+ in cash and Azure credits into OpenAI. OpenAI then commits $250B over multiple years to purchase computing power back from Microsoft Azure.
            </li>
            <li>
              <strong className="text-ink">Oracle</strong> constructs dedicated multi-gigawatt data center campuses financed by corporate debt notes, which OpenAI commits to lease under the Stargate program.
            </li>
            <li>
              <strong className="text-ink">NVIDIA</strong> supplies the GPU hardware powering those data centers, while also participating directly as an equity investor in OpenAI&rsquo;s strategic funding rounds.
            </li>
          </ul>
          <p>
            Our model rates OpenAI&rsquo;s circularity exposure as <span className="chip chip-risk font-semibold">High (Circular)</span> because revenue growth across multiple nodes in the chain depends on the same underlying pool of capital circulating between investors, hosts, and chipmakers.
          </p>
        </div>
      </section>
    </AnswerPageLayout>
  );
}
