"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowUpRight, TrendingUp, TrendingDown, ShieldAlert, Zap, Activity } from "lucide-react";
import { POLYMARKET_REFERRAL_CODE } from "@/data/polymarket-data";
import { LIVE_STOCKS } from "@/data/live-stocks";

interface TickerItem {
  id: string;
  label: string;
  value: string;
  change?: string;
  isPositive?: boolean;
  type: "stock" | "risk" | "polymarket" | "damper" | "deal";
  href: string;
  isExternal?: boolean;
}

export function MarketTickerTape() {
  const [isPaused, setIsPaused] = useState(false);

  // Combine macro factors with live stock prices
  const stockItems: TickerItem[] = LIVE_STOCKS.map((s) => ({
    id: `stock-${s.ticker}`,
    label: s.ticker,
    value: `$${s.priceUsd.toFixed(2)}`,
    change: `${s.change24hPct >= 0 ? "+" : ""}${s.change24hPct.toFixed(1)}%`,
    isPositive: s.change24hPct >= 0,
    type: "stock",
    href: `/companies?search=${encodeURIComponent(s.ticker)}`,
  }));

  const macroItems: TickerItem[] = [
    {
      id: "us10y",
      label: "US 10Y YIELD",
      value: "4.42%",
      change: "+8.4 bps",
      isPositive: false,
      type: "risk",
      href: "/sandbox",
    },
    {
      id: "prob",
      label: "BUBBLE PROB (12M)",
      value: "68.4%",
      change: "HIGH STRESS",
      type: "risk",
      href: "/",
    },
    {
      id: "ai-debt-pace",
      label: "AI DEBT ISSUANCE",
      value: "$85.0B/yr",
      change: "+215% YoY",
      isPositive: false,
      type: "risk",
      href: "/companies",
    },
    {
      id: "cpi",
      label: "INFLATION (CPI)",
      value: "2.9% YoY",
      change: "+0.2% sticky",
      isPositive: false,
      type: "risk",
      href: "/sandbox",
    },
    {
      id: "fedfunds",
      label: "FED FUNDS RATE",
      value: "4.75%",
      change: "+25bp hike risk",
      isPositive: false,
      type: "risk",
      href: "/sandbox",
    },
    {
      id: "poly-26",
      label: "POLYMARKET '26 AI BURST",
      value: "7.6% YES",
      change: "8¢/sh",
      type: "polymarket",
      href: `https://polymarket.com/event/ai-bubble-burst-by?r=${POLYMARKET_REFERRAL_CODE}`,
      isExternal: true,
    },
    {
      id: "orcl-cds",
      label: "ORCL 5Y CDS",
      value: "187 bps",
      change: "+131% stress",
      type: "risk",
      href: "/companies",
    },
    {
      id: "poly-27",
      label: "POLYMARKET '27 AI BURST",
      value: "15.5% YES",
      change: "16¢/sh",
      type: "polymarket",
      href: `https://polymarket.com/event/ai-bubble-burst-by?r=${POLYMARKET_REFERRAL_CODE}`,
      isExternal: true,
    },
    {
      id: "tokens",
      label: "TOKEN DEFLATION",
      value: "25× cheaper",
      change: "Unit economics",
      type: "damper",
      href: "/visualize",
    },
    {
      id: "ledger",
      label: "DISCLOSED CAPITAL",
      value: "$2.810T",
      change: "159 deals",
      type: "deal",
      href: "/ledger",
    },
  ];

  // Interleave macro items and stock quotes
  const combinedItems: TickerItem[] = [];
  const maxLen = Math.max(stockItems.length, macroItems.length);
  for (let i = 0; i < maxLen; i++) {
    if (i < stockItems.length) combinedItems.push(stockItems[i]);
    if (i < macroItems.length) combinedItems.push(macroItems[i]);
  }

  // Duplicate for seamless 100% infinite marquee animation
  const displayItems = [...combinedItems, ...combinedItems];

  const renderBadge = (item: TickerItem) => {
    if (item.type === "stock") {
      return (
        <span
          className={`text-xs font-mono font-bold px-2 py-0.5 rounded-md flex items-center space-x-1 ${
            item.isPositive
              ? "bg-emerald-950/90 text-emerald-400 border border-emerald-800"
              : "bg-rose-950/90 text-rose-400 border border-rose-800"
          }`}
        >
          <span>{item.change}</span>
        </span>
      );
    }
    if (item.type === "polymarket") {
      return (
        <span className="text-xs font-bold text-indigo-400 font-mono flex items-center space-x-1 bg-indigo-950/70 px-2 py-0.5 rounded-md border border-indigo-800">
          <Zap className="w-3 h-3 fill-current" />
          <span>{item.change}</span>
        </span>
      );
    }
    if (item.type === "risk") {
      return (
        <span className="text-xs font-bold text-rose-400 font-mono bg-rose-950/70 px-2 py-0.5 rounded-md border border-rose-800">
          {item.change}
        </span>
      );
    }
    if (item.type === "damper") {
      return (
        <span className="text-xs font-bold text-emerald-400 font-mono bg-emerald-950/70 px-2 py-0.5 rounded-md border border-emerald-800">
          {item.change}
        </span>
      );
    }
    return (
      <span className="text-xs text-cyan-400 font-mono bg-cyan-950/70 px-2 py-0.5 rounded-md border border-cyan-800">
        {item.change}
      </span>
    );
  };

  return (
    <div
      className="bg-[#09090b] border-b border-zinc-800 text-slate-300 text-xs sm:text-sm py-2.5 overflow-hidden select-none relative z-40 transition-colors shadow-inner"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="max-w-7xl mx-auto flex items-center px-4">
        {/* Left Fixed Badge */}
        <div className="flex-shrink-0 flex items-center space-x-2 pr-3.5 sm:pr-4 border-r border-zinc-800 z-10 bg-[#09090b]">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <span className="font-mono text-xs sm:text-sm font-extrabold tracking-wider text-slate-200 uppercase flex items-center space-x-1.5">
            <Activity className="w-4 h-4 text-emerald-400" />
            <span>LIVE MARKETS</span>
          </span>
        </div>

        {/* Continuous Smooth Marquee */}
        <div className="overflow-hidden whitespace-nowrap w-full ml-3 sm:ml-4">
          <div
            className={`inline-flex items-center space-x-6 sm:space-x-8 ${
              isPaused ? "" : "animate-marquee"
            }`}
          >
            {displayItems.map((item, index) => {
              const content = (
                <div className="inline-flex items-center space-x-2 group cursor-pointer hover:opacity-80 transition-opacity">
                  <span className="text-xs sm:text-sm font-mono font-bold text-slate-300 group-hover:text-white transition-colors">
                    {item.label}
                  </span>
                  <span className="font-mono font-black text-white font-tabular text-xs sm:text-sm">
                    {item.value}
                  </span>
                  {item.change && renderBadge(item)}
                  {item.isExternal && (
                    <ArrowUpRight className="w-3.5 h-3.5 text-indigo-400 opacity-80 group-hover:opacity-100" />
                  )}
                  <span className="text-zinc-700 ml-4 font-mono">•</span>
                </div>
              );

              return item.isExternal ? (
                <a
                  key={`${item.id}-${index}`}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block"
                >
                  {content}
                </a>
              ) : (
                <Link key={`${item.id}-${index}`} href={item.href} className="inline-block">
                  {content}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
