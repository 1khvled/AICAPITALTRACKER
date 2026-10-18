"use client";

import React, { useState, useEffect } from "react";
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
} from "lucide-react";
import { useTheme } from "./ThemeProvider";
import { POLYMARKET_BASE_URL, POLYMARKET_REFERRAL_CODE } from "@/data/polymarket-data";
import { evaluateBubbleModel, DEFAULT_MODEL_INPUTS } from "@/lib/model/engine";

export function Header() {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Dynamically compute live risk score from verified model
  const liveBurstProbability = evaluateBubbleModel(DEFAULT_MODEL_INPUTS).burstProbability;
  const formattedRisk = `${liveBurstProbability.toFixed(1)}%`;

  useEffect(() => {
    setMounted(true);
  }, []);

  const navLinks = [
    { label: "Model", href: "/", icon: ShieldAlert },
    { label: "Ledger", href: "/ledger", badge: "159", icon: Database },
    { label: "Charts", href: "/visualize", icon: BarChart3 },
    { label: "Simulator", href: "/sandbox", icon: Sliders },
    { label: "Companies", href: "/companies", icon: Cpu },
    { label: "API", href: "/api-docs", icon: Code2 },
    { label: "Methodology", href: "/methodology", icon: BookOpen },
  ];

  return (
    <header className="border-b border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#09090b] sticky top-0 z-50 transition-colors w-full">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-1.5 sm:gap-4">
        {/* Brand */}
        <Link href="/" className="flex items-center space-x-2 group shrink-0">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-zinc-900 border border-zinc-700 flex items-center justify-center text-emerald-400 group-hover:border-emerald-500 transition-colors shrink-0 shadow-xs">
            <span className="font-mono text-xs sm:text-sm font-black">AI</span>
          </div>
          <div className="flex flex-col shrink-0">
            <span className="font-black text-slate-900 dark:text-white tracking-tight text-sm sm:text-base md:text-lg whitespace-nowrap leading-tight">
              AI Capital Tracker
            </span>
          </div>
        </Link>

        {/* Primary Desktop Navigation — Compact, perfectly balanced, never wraps or pushes out */}
        <nav className="hidden lg:flex items-center space-x-1 shrink-0">
          {navLinks.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center space-x-1.5 px-2.5 xl:px-3 py-1.5 rounded-lg text-xs xl:text-sm font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? "bg-slate-900 text-white dark:bg-zinc-800 dark:text-white font-bold shadow-xs"
                    : "text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800/60"
                }`}
              >
                <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? "text-emerald-400" : "text-slate-400 dark:text-zinc-500"}`} />
                <span>{item.label}</span>
                {item.badge && (
                  <span
                    className={`text-[11px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
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
        </nav>

        {/* Right side controls: Polymarket + Theme Toggle + Live Risk Badge */}
        <div className="flex items-center space-x-1 sm:space-x-2 shrink-0">
          {/* Polymarket Referral Pill — Compact & high contrast */}
          <a
            href={POLYMARKET_BASE_URL}
            target="_blank"
            rel="noopener noreferrer"
            title={`Trade AI Bubble contracts on Polymarket (Referral: ${POLYMARKET_REFERRAL_CODE})`}
            className="inline-flex items-center space-x-1 sm:space-x-1.5 px-2 sm:px-2.5 py-1.5 rounded-lg border border-indigo-200 dark:border-indigo-900/80 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-xs font-bold transition-all whitespace-nowrap shadow-xs shrink-0"
          >
            <Zap className="w-3.5 h-3.5 fill-current text-indigo-500 shrink-0" />
            <span className="hidden sm:inline">Polymarket</span>
          </a>

          {/* Theme Toggle Button — Clean icon button */}
          {mounted && (
            <button
              onClick={toggleTheme}
              aria-label="Toggle dark/light mode"
              title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              className="p-1.5 sm:p-2 rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-100 dark:bg-zinc-900 text-slate-700 dark:text-zinc-300 hover:bg-slate-200 dark:hover:bg-zinc-800 transition-all shadow-xs flex items-center justify-center shrink-0"
            >
              {theme === "dark" ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-indigo-600" />
              )}
            </button>
          )}

          {/* Live Risk Badge */}
          <Link
            href="/"
            title="Current 12-Month Bubble Burst Probability"
            className="flex items-center space-x-1 sm:space-x-1.5 px-2 sm:px-2.5 py-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 text-xs font-bold text-rose-700 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/60 transition-all whitespace-nowrap shadow-xs shrink-0"
          >
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse shrink-0"></span>
            <span className="font-mono font-black">{formattedRisk}</span>
            <span className="hidden sm:inline text-slate-600 dark:text-zinc-400 text-xs font-medium">Risk</span>
          </Link>
        </div>
      </div>

      {/* Mobile / Tablet Horizontal Navigation Strip */}
      <div className="lg:hidden flex items-center overflow-x-auto px-2.5 py-1.5 border-t border-slate-200 dark:border-zinc-800 space-x-1 scrollbar-none bg-slate-50 dark:bg-[#09090b] touch-pan-x">
        {navLinks.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`whitespace-nowrap px-2.5 py-1 rounded-md text-xs font-semibold transition-colors ${
                isActive
                  ? "bg-slate-900 text-white dark:bg-zinc-800 dark:text-white"
                  : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              {item.label}
              {item.badge && <span className="ml-1 opacity-70">({item.badge})</span>}
            </Link>
          );
        })}
      </div>
    </header>
  );
}
