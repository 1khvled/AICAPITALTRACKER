"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ShieldAlert,
  Database,
  Sliders,
  Cpu,
  BookOpen,
  BarChart3,
  Sun,
  Moon,
  Code2,
  Zap,
  TrendingUp,
  Newspaper,
  ChevronDown,
} from "lucide-react";
import { useTheme } from "./ThemeProvider";
import { POLYMARKET_BASE_URL, POLYMARKET_REFERRAL_CODE } from "@/data/polymarket-data";
import { evaluateBubbleModel, DEFAULT_MODEL_INPUTS } from "@/lib/model/engine";
import rawDeals from "@/data/deals.json";

export function Header() {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Dynamically compute live risk score from verified model
  const liveBurstProbability = evaluateBubbleModel(DEFAULT_MODEL_INPUTS).burstProbability;
  const formattedRisk = `${liveBurstProbability.toFixed(1)}%`;

  useEffect(() => {
    setMounted(true);
    // Close dropdown on outside click
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setMoreOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Primary desktop links that always stay visible without crowding
  const primaryLinks = [
    { label: "Model", href: "/", icon: ShieldAlert },
    { label: "Ledger", href: "/ledger", badge: String(rawDeals.length), icon: Database },
    { label: "Charts", href: "/visualize", icon: BarChart3 },
    { label: "Markets", href: "/markets", icon: TrendingUp },
    { label: "News", href: "/news", icon: Newspaper },
  ];

  // Secondary tools in clean "More" dropdown to guarantee 100% visibility on all screens
  const secondaryLinks = [
    { label: "Simulator", href: "/sandbox", desc: "Interactive sensitivity sliders", icon: Sliders },
    { label: "Companies", href: "/companies", desc: "Corporate debt sheets & multiples", icon: Cpu },
    { label: "Methodology", href: "/methodology", desc: "Merton, Altman & 8-factor math", icon: BookOpen },
    { label: "Developer API", href: "/api-docs", desc: "REST endpoints & cURL explorer", icon: Code2 },
  ];

  // All links for mobile horizontal scroll strip
  const allMobileLinks = [
    ...primaryLinks,
    { label: "Simulator", href: "/sandbox", icon: Sliders },
    { label: "Companies", href: "/companies", icon: Cpu },
    { label: "Methodology", href: "/methodology", icon: BookOpen },
    { label: "API", href: "/api-docs", icon: Code2 },
  ];

  const isSecondaryActive = secondaryLinks.some((l) => pathname === l.href);
  const activeSecondaryItem = secondaryLinks.find((l) => pathname === l.href);

  return (
    <header className="border-b border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#09090b] sticky top-0 z-50 transition-colors w-full">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 h-14 sm:h-16 flex items-center justify-between gap-1 sm:gap-2">
        {/* Brand */}
        <Link href="/" className="flex items-center space-x-2 group shrink-0">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-zinc-900 border border-zinc-700 flex items-center justify-center text-emerald-400 group-hover:border-emerald-500 transition-colors shrink-0 shadow-xs">
            <span className="font-mono text-xs sm:text-sm font-black">AI</span>
          </div>
          <div className="flex flex-col shrink-0">
            <span className="font-black text-slate-900 dark:text-white tracking-tight text-xs sm:text-sm md:text-base whitespace-nowrap leading-tight">
              AI Capital Tracker
            </span>
          </div>
        </Link>

        {/* Primary Desktop Navigation — Guaranteed never to overflow or squeeze right controls */}
        <nav className="hidden lg:flex items-center space-x-1 shrink min-w-0">
          {primaryLinks.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center space-x-1 px-2 xl:px-2.5 py-1.5 rounded-lg text-xs xl:text-sm font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? "bg-slate-900 text-white dark:bg-zinc-800 dark:text-white font-bold shadow-xs"
                    : "text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800/60"
                }`}
              >
                <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? "text-emerald-400" : "text-slate-400 dark:text-zinc-500"}`} />
                <span>{item.label}</span>
                {item.badge && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                      isActive
                        ? "bg-slate-800 text-slate-200 dark:bg-zinc-700 dark:text-zinc-200"
                        : "bg-slate-200 text-slate-700 dark:bg-zinc-800 dark:text-zinc-300"
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}

          {/* Secondary "More Tools" Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setMoreOpen(!moreOpen)}
              className={`flex items-center space-x-1 px-2 xl:px-2.5 py-1.5 rounded-lg text-xs xl:text-sm font-semibold whitespace-nowrap transition-all cursor-pointer ${
                isSecondaryActive || moreOpen
                  ? "bg-slate-900 text-white dark:bg-zinc-800 dark:text-white font-bold shadow-xs"
                  : "text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800/60"
              }`}
            >
              <span>{isSecondaryActive ? activeSecondaryItem?.label : "More"}</span>
              <ChevronDown className={`w-3 h-3 transition-transform ${moreOpen ? "rotate-180" : ""}`} />
            </button>

            {moreOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-xl bg-white dark:bg-[#121214] border border-slate-200 dark:border-zinc-800 p-1.5 shadow-xl z-50 space-y-0.5 animate-in fade-in zoom-in-95 duration-100">
                {secondaryLinks.map((sub) => {
                  const SubIcon = sub.icon;
                  const isSubActive = pathname === sub.href;
                  return (
                    <Link
                      key={sub.href}
                      href={sub.href}
                      onClick={() => setMoreOpen(false)}
                      className={`flex items-start space-x-2.5 p-2 rounded-lg text-xs transition-colors ${
                        isSubActive
                          ? "bg-slate-100 dark:bg-zinc-800 text-slate-900 dark:text-white font-bold"
                          : "text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800/60"
                      }`}
                    >
                      <SubIcon className={`w-4 h-4 mt-0.5 shrink-0 ${isSubActive ? "text-emerald-500" : "text-slate-400 dark:text-zinc-500"}`} />
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-900 dark:text-white">{sub.label}</span>
                        <span className="text-[10px] text-slate-500 dark:text-zinc-400 font-sans">{sub.desc}</span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </nav>

        {/* Right side controls: Polymarket + Theme Toggle + Live Risk Badge (ALWAYS 100% VISIBLE) */}
        <div className="flex items-center space-x-1 sm:space-x-1.5 shrink-0">
          {/* Polymarket Referral Pill */}
          <a
            href={POLYMARKET_BASE_URL}
            target="_blank"
            rel="noopener noreferrer"
            title={`Trade AI Bubble contracts on Polymarket (Referral: ${POLYMARKET_REFERRAL_CODE})`}
            className="inline-flex items-center space-x-1 px-2 py-1.5 rounded-lg border border-indigo-200 dark:border-indigo-900/80 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-xs font-bold transition-all whitespace-nowrap shadow-xs shrink-0"
          >
            <Zap className="w-3.5 h-3.5 fill-current text-indigo-500 shrink-0" />
            <span className="hidden md:inline">Polymarket</span>
          </a>

          {/* Theme Toggle Button */}
          {mounted && (
            <button
              onClick={toggleTheme}
              aria-label="Toggle dark/light mode"
              title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-100 dark:bg-zinc-900 text-slate-700 dark:text-zinc-300 hover:bg-slate-200 dark:hover:bg-zinc-800 transition-all shadow-xs flex items-center justify-center shrink-0"
            >
              {theme === "dark" ? (
                <Sun className="w-3.5 h-3.5 text-amber-400" />
              ) : (
                <Moon className="w-3.5 h-3.5 text-indigo-600" />
              )}
            </button>
          )}

          {/* Autonomous 24H Cron Live Feed Indicator Badge */}
          <div
            title="Updated daily via GitHub Actions 00:00 UTC"
            className="inline-flex items-center space-x-1.5 px-2 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-900/80 text-xs font-bold text-emerald-700 dark:text-emerald-400 whitespace-nowrap shadow-xs shrink-0 cursor-default"
          >
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="font-mono text-[11px] uppercase tracking-wider hidden sm:inline">24H CRON ACTIVE</span>
            <span className="font-mono text-[11px] uppercase tracking-wider sm:hidden">24H</span>
          </div>

          {/* Live Risk Badge — Guaranteed never clipped */}
          <Link
            href="/"
            title="Current 12-Month Bubble Burst Probability"
            className="flex items-center space-x-1 px-2 py-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 text-xs font-bold text-rose-700 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/60 transition-all whitespace-nowrap shadow-xs shrink-0"
          >
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse shrink-0" />
            <span className="font-mono font-black">{formattedRisk}</span>
            <span className="hidden sm:inline text-slate-600 dark:text-zinc-400 text-xs font-medium">Risk</span>
          </Link>
        </div>
      </div>

      {/* Mobile / Tablet Horizontal Navigation Strip */}
      <div className="lg:hidden flex items-center overflow-x-auto px-2.5 py-1.5 border-t border-slate-200 dark:border-zinc-800 space-x-1 scrollbar-none bg-slate-50 dark:bg-[#09090b] touch-pan-x">
        {allMobileLinks.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center space-x-1 px-2.5 py-1 rounded-md text-xs font-semibold whitespace-nowrap transition-colors shrink-0 ${
                isActive
                  ? "bg-slate-900 text-white dark:bg-zinc-800 dark:text-white font-bold"
                  : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-zinc-800"
              }`}
            >
              <span>{item.label}</span>
              {item.badge && (
                <span className="text-[10px] px-1 rounded-full bg-slate-200 dark:bg-zinc-700 text-slate-800 dark:text-zinc-200 font-mono font-bold">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </header>
  );
}
