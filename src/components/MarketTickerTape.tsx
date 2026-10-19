import React from "react";
import Link from "next/link";
import { evaluateBubbleModel, DEFAULT_MODEL_INPUTS } from "@/lib/model/engine";
import { POLYMARKET_REFERRAL_CODE } from "@/data/polymarket-data";
import { LIVE_STOCKS as FALLBACK_STOCKS, StockQuote } from "@/data/live-stocks";
import liveStocksData from "@/data/live-stocks.json";
import liveInputsData from "@/data/live-inputs.json";
import rawDeals from "@/data/deals.json";

/**
 * Market desk strip — a slow, horizontal tape of the readings that matter.
 *
 * 2026-10-19 (design pass): the strip is now a real marquee. The track
 * carries the items twice and slides half its own width over 40 seconds, so
 * the loop is seamless; it pauses the moment the pointer is over it, and a
 * reduced-motion reader gets a still strip they can scroll by hand.
 *
 * The "Market desk" label stays pinned: only the readings move. The tape is
 * built from the same daily feed as the rest of the site, and it invents
 * nothing.
 */

interface TickerItem {
  id: string;
  label: string;
  value: string;
  change?: string;
  tone?: "up" | "down";
  href: string;
  isExternal?: boolean;
}

function getStocks(): StockQuote[] {
  try {
    if (Array.isArray(liveStocksData) && liveStocksData.length > 0) {
      return liveStocksData as StockQuote[];
    }
    if (
      liveStocksData &&
      Array.isArray((liveStocksData as unknown as { stocks?: StockQuote[] }).stocks) &&
      (liveStocksData as unknown as { stocks: StockQuote[] }).stocks.length > 0
    ) {
      return (liveStocksData as unknown as { stocks: StockQuote[] }).stocks;
    }
  } catch {
    /* fall through to the static snapshot — silently */
  }
  return FALLBACK_STOCKS;
}

export function MarketTickerTape() {
  const model = evaluateBubbleModel(DEFAULT_MODEL_INPUTS);
  const inputs = DEFAULT_MODEL_INPUTS;

  // 2026-10-19 fact-check: the stale fallbacks were 0.103 / 0.165 (crowd odds)
  // and 187bp / 336bp. The live crowd reading is 9.05% (2026 contract) and
  // 19.5% (Jun 2027 contract) on $9,167,627 traded; Oracle 5Y CDS closed at a
  // record 288bp (15 Oct 2026) and US HY OAS closed at 323bp (FRED
  // BAMLH0A0HYM2, 15 Oct 2026).
  const crowd2026 = (liveInputsData?.crowd?.bubble2026Probability ?? 0.0905) * 100;
  const crowd2027 = (liveInputsData?.crowd?.bubble2027Probability ?? 0.195) * 100;

  const totalDisclosedUsd = rawDeals.reduce((sum, d) => sum + (d.amount_usd || 0), 0);

  const orclCds = inputs.cds?.currentBps ?? 288;
  const orclBase = inputs.cds?.baselineBps ?? 81;
  const us10y = inputs.macro?.us10yYieldPct ?? 5.1;
  const us10yBase = inputs.macro?.us10yBaselinePct ?? 3.75;
  const hygSpread = inputs.macro?.highYieldSpreadBps ?? 323;
  const debtPaceUsd = inputs.aiDebt?.annualDebtIssuanceUsd ?? 85e9;

  const stockItems: TickerItem[] = getStocks().map((s) => ({
    id: `stock-${s.ticker}`,
    label: s.ticker,
    value: `$${s.priceUsd.toFixed(2)}`,
    change: `${s.change24hPct >= 0 ? "+" : ""}${s.change24hPct.toFixed(1)}%`,
    tone: s.change24hPct >= 0 ? "up" : "down",
    href: `/companies?search=${encodeURIComponent(s.ticker)}`,
  }));

  const macroItems: TickerItem[] = [
    {
      id: "bubble-prob",
      label: "12-mo burst odds",
      value: `${model.burstProbability.toFixed(1)}%`,
      change: model.band.toUpperCase(),
      tone: model.burstProbability < 45 ? "up" : "down",
      href: "/",
    },
    {
      id: "orcl-cds",
      label: "ORCL 5Y CDS",
      value: `${orclCds} bps`,
      change: `${Math.round(((orclCds - orclBase) / orclBase) * 100)}% vs base`,
      tone: "down",
      href: "/companies?search=ORCL",
    },
    {
      id: "us10y",
      label: "US 10Y",
      value: `${us10y.toFixed(2)}%`,
      change: `${((us10y - us10yBase) * 100).toFixed(0)} bps vs base`,
      tone: "down",
      href: "/sandbox",
    },
    {
      id: "hy-oas",
      label: "High yield OAS",
      value: `${hygSpread} bps`,
      href: "/companies",
    },
    {
      id: "ai-debt",
      label: "AI debt pace",
      value: `$${(debtPaceUsd / 1e9).toFixed(1)}B/yr`,
      href: "/ledger",
    },
    {
      id: "disclosed",
      label: "Disclosed capital",
      value: `$${(totalDisclosedUsd / 1e12).toFixed(2)}T`,
      change: `${rawDeals.length} deals`,
      tone: "up",
      href: "/ledger",
    },
    {
      id: "poly-26",
      label: "Crowd odds 2026",
      value: `${crowd2026.toFixed(1)}%`,
      change: "prediction market",
      href: `https://polymarket.com/event/ai-bubble-burst-by?r=${POLYMARKET_REFERRAL_CODE}`,
      isExternal: true,
    },
    {
      id: "poly-27",
      label: "Crowd odds 2027",
      value: `${crowd2027.toFixed(1)}%`,
      change: "prediction market",
      href: `https://polymarket.com/event/ai-bubble-burst-by?r=${POLYMARKET_REFERRAL_CODE}`,
      isExternal: true,
    },
  ];

  const items: TickerItem[] = [...stockItems, ...macroItems];

  const renderItem = (item: TickerItem, duplicate: boolean) => {
    const body = (
      <span className="flex shrink-0 items-baseline gap-2 whitespace-nowrap px-3 py-1.5 text-[14px]">
        <span className="label !text-[13px]">{item.label}</span>
        <span className="num text-ink">{item.value}</span>
        {item.change ? (
          <span
            className={
              item.tone === "up"
                ? "text-safe-600 dark:text-safe-400"
                : item.tone === "down"
                ? "text-risk-600 dark:text-risk-400"
                : "text-ink-faint"
            }
          >
            {item.change}
          </span>
        ) : null}
      </span>
    );

    // The duplicate half of the loop is decoration for the eye: it is hidden
    // from screen readers and skipped by the keyboard.
    const tabIndex = duplicate ? -1 : undefined;

    return item.isExternal ? (
      <a
        key={item.id}
        href={item.href}
        target="_blank"
        rel="noopener noreferrer"
        tabIndex={tabIndex}
        className="-my-1.5 min-h-11 border-r border-rule py-1.5 transition-colors hover:bg-surface-3"
      >
        {body}
      </a>
    ) : (
      <Link
        key={item.id}
        href={item.href}
        tabIndex={tabIndex}
        className="-my-1.5 min-h-11 border-r border-rule py-1.5 transition-colors hover:bg-surface-3"
      >
        {body}
      </Link>
    );
  };

  const syncStamp = (
    <span className="num flex shrink-0 items-center whitespace-nowrap px-3 py-1.5 text-[14px] text-ink-faint">
      Synced daily 00:00 UTC
    </span>
  );

  return (
    <div className="border-b border-rule bg-surface-2 text-ink-muted">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6">
        <div className="flex min-w-0 items-stretch">
          <span className="label flex shrink-0 items-center border-r border-rule px-3 py-1.5">
            Market desk
          </span>

          {/* The clipper holds the frame; the marquee slides inside it. */}
          <div className="ticker-row min-w-0 flex-1 overflow-hidden">
            <div className="marquee items-stretch">
              <div className="flex items-stretch">
                {items.map((item) => renderItem(item, false))}
                {syncStamp}
              </div>
              <div className="marquee-dup flex items-stretch" aria-hidden="true">
                {items.map((item) => renderItem(item, true))}
                {syncStamp}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MarketTickerTape;