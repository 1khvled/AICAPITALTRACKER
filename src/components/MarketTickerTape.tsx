"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { evaluateBubbleModel, DEFAULT_MODEL_INPUTS } from "@/lib/model/engine";
import { POLYMARKET_REFERRAL_CODE } from "@/data/polymarket-data";
import { LIVE_STOCKS as FALLBACK_STOCKS, StockQuote } from "@/data/live-stocks";
import { useMotionPreference } from "@/components/MotionProvider";
import { usePathname } from "next/navigation";
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

/**
 * The pages a search engine sends a reader to. On these, the tape speaks
 * plain words and does not move.
 */
const PLAIN_PAGES = new Set([
  "/will-the-ai-bubble-burst",
  "/how-much-is-being-spent-on-ai",
  "/how-much-ai-debt-there-is",
  "/will-openai-ipo",
  "/what-is-cpi-doing-to-ai",
  "/who-is-funding-openai",
  "/is-ai-spending-too-much",
]);

export function MarketTickerTape() {
  const { active } = useMotionPreference();
  const pathname = usePathname();
  const isPlainPage = typeof pathname === "string" && PLAIN_PAGES.has(pathname);
  const [statusMessage, setStatusMessage] = useState("");
  const isFirstTapeRender = useRef(true);
  const tapeTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isFirstTapeRender.current) {
      isFirstTapeRender.current = false;
      return;
    }
    if (tapeTimerRef.current) clearTimeout(tapeTimerRef.current);
    tapeTimerRef.current = setTimeout(() => {
      setStatusMessage(active ? "Market tape moving" : "Market tape paused");
    }, 600);
    return () => {
      if (tapeTimerRef.current) clearTimeout(tapeTimerRef.current);
    };
  }, [active]);

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

  /**
   * The order is the page's information hierarchy: the readings that decide
   * the answer come FIRST (the model's own print, the credit prints, the
   * rates, the crowd), and the single-name quotes follow. A reader who lands
   * on the site should meet the numbers the site is about before the tape
   * walks them through twenty-four tickers.
   */
  const items: TickerItem[] = [...macroItems, ...stockItems];

  /**
   * The same readings, said in words. Every number here is the number in the
   * terminal tape above - only the label changes.
   */
  const plainItems: TickerItem[] = [
    {
      id: "plain-bubble",
      label: "Chance the AI build-out breaks within 12 months",
      value: `${model.burstProbability.toFixed(1)}%`,
      href: "/will-the-ai-bubble-burst",
    },
    {
      id: "plain-spending",
      label: "AI spending tracked",
      value: `${(totalDisclosedUsd / 1e12).toFixed(2)}T`,
      change: `${rawDeals.length} verified deals`,
      href: "/how-much-is-being-spent-on-ai",
    },
    {
      id: "plain-debt",
      label: "AI debt raised",
      value: `$${(debtPaceUsd / 1e9).toFixed(0)}B a year`,
      href: "/how-much-ai-debt-there-is",
    },
    {
      id: "plain-yields",
      label: "10-year government bond yield",
      value: `${us10y.toFixed(2)}%`,
      href: "/what-is-cpi-doing-to-ai",
    },
    {
      id: "plain-market",
      label: "The market's price for a 2026 AI bust",
      value: `${crowd2026.toFixed(1)}%`,
      change: "prediction market",
      href: `https://polymarket.com/event/ai-bubble-burst-by?r=${POLYMARKET_REFERRAL_CODE}`,
      isExternal: true,
    },
  ];

  const renderItem = (item: TickerItem, duplicate: boolean, wrap = false) => {
    const body = (
      <span
        className={`flex items-baseline gap-2 px-3 py-1.5 text-[14px] ${
          wrap ? "min-w-0 flex-wrap gap-y-0.5" : "shrink-0 whitespace-nowrap"
        }`}
      >
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

    const itemClass = `-my-1.5 min-h-11 border-r border-rule py-1.5 transition-colors hover:bg-surface-3${
      wrap ? " min-w-0" : ""
    }`;
    return item.isExternal ? (
      <a
        key={item.id}
        href={item.href}
        target="_blank"
        rel="noopener noreferrer"
        tabIndex={tabIndex}
        className={itemClass}
      >
        {body}
      </a>
    ) : (
      <Link key={item.id} href={item.href} tabIndex={tabIndex} className={itemClass}>
        {body}
      </Link>
    );
  };

  const syncStamp = (
    <span className="num flex shrink-0 items-center whitespace-nowrap px-3 py-1.5 text-[14px] text-ink-faint">
      Synced daily 00:00 UTC
    </span>
  );

  if (isPlainPage) {
    return (
      <div className="border-b border-rule bg-surface-2 text-ink-muted">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6">
          <div className="flex min-w-0 flex-wrap items-stretch">
            <span className="label flex shrink-0 items-center border-r border-rule px-3 py-1.5">
              What the site is tracking
            </span>
            {plainItems.map((item) => renderItem(item, false, true))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="border-b border-rule bg-surface-2 text-ink-muted overflow-hidden">
      {/* ONE polite status region per page (role="status", aria-live="polite", aria-atomic="true") */}
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {statusMessage}
      </div>
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