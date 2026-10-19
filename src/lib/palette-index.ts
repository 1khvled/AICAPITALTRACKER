import rawDeals from "@/data/deals.json";
import liveStocks from "@/data/live-stocks.json";
import { COMPANIES } from "@/app/companies/_components/companyData";
import type { PaletteItem } from "@/components/CommandPalette";

/**
 * Search index for the global command palette.
 *
 * Built on the server, once per request, and handed to the client as plain
 * props: the palette can then find a page, a company, a debt facility or a
 * ticker without the browser ever seeing the model engine or the raw records.
 *
 * Every field below is copied from a published data file. Nothing is computed,
 * scored or re-derived here.
 */

interface DealRecord {
  id: string;
  title: string;
  category?: string;
  status?: string;
  amount_display?: string | null;
  amount_usd?: number;
  announced_date?: string;
}

interface StockRecord {
  ticker: string;
  name: string;
  role?: string;
  category?: string;
}

const PAGES: { href: string; label: string; sub: string; keywords?: string }[] = [
  {
    href: "/",
    label: "Verdict — will the AI bubble burst?",
    sub: "The 12-month probability, with the receipts",
    keywords: "home probability verdict answer",
  },
  {
    href: "/ledger",
    label: "Debt ledger",
    sub: "Every AI financing we can source from filings",
    keywords: "deals facilities bonds notes convertible",
  },
  {
    href: "/companies",
    label: "Companies",
    sub: "Debt, revenue and multiples by company",
    keywords: "profiles tickers creditors",
  },
  {
    href: "/markets",
    label: "Markets",
    sub: "Quotes, Treasury yields and credit spreads",
    keywords: "stocks quotes treasury yield spread cds",
  },
  {
    href: "/methodology",
    label: "Method",
    sub: "How the probability is calculated",
    keywords: "model formula factors weights methodology",
  },
  {
    href: "/sandbox",
    label: "Simulator",
    sub: "Move the inputs and watch the print move",
    keywords: "sandbox sensitivity what if simulator",
  },
  {
    href: "/visualize",
    label: "Charts",
    sub: "Every published series in one place",
    keywords: "charts graphs series visualize",
  },
  {
    href: "/dotcom-vs-ai",
    label: "2000 vs 2026",
    sub: "The last build-out, side by side",
    keywords: "dotcom comparison 2000 nasdaq telecom",
  },
  {
    href: "/news",
    label: "News",
    sub: "What moved the inputs today",
    keywords: "news stories press",
  },
  {
    href: "/api",
    label: "API",
    sub: "Read the published model as JSON",
    keywords: "api json endpoint",
  },
  {
    href: "/api-docs",
    label: "API documentation",
    sub: "Endpoints, fields and examples",
    keywords: "api docs reference fields",
  },
];

function companyItems(): PaletteItem[] {
  return COMPANIES.map((company, index) => {
    const ticker = company.ticker ?? "";
    // Private companies carry a filing status in the ticker slot ("Private (S-1
    // Filed)") — that is not a searchable symbol, so it stays out of keywords.
    const isListed = ticker.length > 0 && !ticker.toLowerCase().startsWith("private");
    return {
      id: `company-${index}`,
      label: company.name,
      sub: [company.sector, company.riskTier].filter(Boolean).join(" · "),
      group: "Companies",
      href: `/companies?search=${encodeURIComponent(company.name)}`,
      keywords: [isListed ? ticker : "", company.sector, company.riskTier]
        .filter(Boolean)
        .join(" "),
      order: index,
    };
  });
}

function ledgerItems(): PaletteItem[] {
  const deals = rawDeals as unknown as DealRecord[];
  return deals.map((deal, index) => ({
    id: `deal-${deal.id}`,
    label: deal.title,
    sub: [deal.amount_display, deal.category, deal.announced_date]
      .filter(Boolean)
      .join(" · "),
    group: "Ledger",
    href: `/ledger?deal=${encodeURIComponent(deal.id)}`,
    keywords: [deal.category, deal.status, deal.amount_display].filter(Boolean).join(" "),
    order: index,
  }));
}

function marketItems(): PaletteItem[] {
  const feed = liveStocks as unknown as { stocks?: StockRecord[] };
  const stocks = feed.stocks ?? [];
  return stocks.map((stock, index) => ({
    id: `stock-${stock.ticker}`,
    label: stock.ticker,
    sub: [stock.name, stock.role].filter(Boolean).join(" · "),
    group: "Markets",
    href: `/companies?search=${encodeURIComponent(stock.ticker)}`,
    keywords: [stock.name, stock.role, stock.category].filter(Boolean).join(" "),
    order: index,
  }));
}

/**
 * The full palette index. Pages first, then companies, then the ledger and the
 * tickers — the order a reader is most likely to want them in.
 */
export function buildPaletteIndex(): PaletteItem[] {
  const pages: PaletteItem[] = PAGES.map((page, index) => ({
    id: `page-${page.href}`,
    label: page.label,
    sub: page.sub,
    group: "Pages",
    href: page.href,
    keywords: page.keywords,
    order: index,
  }));

  return [...pages, ...companyItems(), ...ledgerItems(), ...marketItems()];
}
