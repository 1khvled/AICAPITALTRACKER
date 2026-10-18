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

export function Header() {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const navLinks = [
    { label: "Model & Odds", href: "/", icon: ShieldAlert },
    { label: "Ledger", href: "/ledger", badge: "158", icon: Database },
    { label: "Charts", href: "/visualize", icon: BarChart3 },
    { label: "Simulator", href: "/sandbox", icon: Sliders },
    { label: "Companies", href: "/companies", icon: Cpu },
    { label: "API", href: "/api-docs", icon: Code2 },
    { label: "Methodology", href: "/methodology", icon: BookOpen },
  ];

  return (
    <header className="border-b border-slate-200 dark:border-zinc-800 bg-white/95 dark:bg-[#090b10]/95 backdrop-blur-md sticky top-0 z-50 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand — Protected with flex-shrink-0 and whitespace-nowrap so it NEVER squishes or wraps */}
        <Link href="/" className="flex items-center space-x-3 group flex-shrink-0">
          <div className="w-8 h-8 rounded-lg bg-slate-900 dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700 flex items-center justify-center text-emerald-400 group-hover:border-emerald-500 transition-colors flex-shrink-0 shadow-sm">
            <span className="font-mono text-sm font-bold">AI</span>
          </div>
          <div className="flex flex-col flex-shrink-0">
            <span className="font-bold text-slate-900 dark:text-white tracking-tight text-base sm:text-lg whitespace-nowrap leading-tight">
              AI Capital Tracker
            </span>
            <p className="text-xs text-slate-500 dark:text-zinc-400 font-sans hidden xl:block whitespace-nowrap leading-normal">
              Receipt-backed bubble probability model
            </p>
          </div>
        </Link>

        {/* Primary Navigation — Streamlined so it fits smoothly across viewports */}
        <nav className="hidden lg:flex items-center space-x-1 flex-shrink-0">
          {navLinks.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center space-x-1.5 px-3 xl:px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? "bg-slate-900 text-white dark:bg-zinc-800 dark:text-white font-bold shadow-sm"
                    : "text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-900"
                }`}
              >
                <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? "text-emerald-400" : "text-slate-400 dark:text-zinc-500"}`} />
                <span>{item.label}</span>
                {item.badge && (
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-mono font-bold ${
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

        {/* Right side controls: Polymarket Partner Button + Theme toggle + Risk badge */}
        <div className="flex items-center space-x-2 sm:space-x-2.5 flex-shrink-0">
          {/* Polymarket Referral Button */}
          <a
            href={POLYMARKET_BASE_URL}
            target="_blank"
            rel="noopener noreferrer"
            title="Trade AI Bubble & ORCL contracts on Polymarket"
            className="hidden md:inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/80 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-950/80 text-xs sm:text-sm font-bold transition-all whitespace-nowrap shadow-sm"
          >
            <Zap className="w-4 h-4 fill-current text-indigo-500" />
            <span>Polymarket</span>
            <span className="hidden xl:inline text-xs text-indigo-600 dark:text-indigo-400 font-bold">(Ref: {POLYMARKET_REFERRAL_CODE})</span>
          </a>

          {/* Theme Toggle Button */}
          {mounted && (
            <button
              onClick={toggleTheme}
              aria-label="Toggle dark/light mode"
              title={theme === "dark" ? "Switch to crisp light mode" : "Switch to dark mode"}
              className="flex items-center space-x-1.5 px-3 py-2 rounded-xl border border-slate-300 dark:border-zinc-700 bg-slate-100 dark:bg-zinc-900 text-slate-800 dark:text-zinc-200 hover:bg-slate-200 dark:hover:bg-zinc-800 text-xs sm:text-sm font-semibold transition-all shadow-sm"
            >
              {theme === "dark" ? (
                <>
                  <Sun className="w-4 h-4 text-amber-400" />
                  <span className="hidden sm:inline">Light</span>
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4 text-indigo-600" />
                  <span className="hidden sm:inline">Dark</span>
                </>
              )}
            </button>
          )}

          {/* Live Risk Badge */}
          <Link
            href="/"
            className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 text-xs sm:text-sm font-bold text-rose-700 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-950/80 transition-all whitespace-nowrap shadow-sm"
          >
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
            <span className="font-mono font-black">68.4%</span>
            <span className="text-slate-600 dark:text-zinc-300 text-xs uppercase font-bold">Stress</span>
          </Link>
        </div>
      </div>

      {/* Mobile Nav Bar */}
      <div className="lg:hidden flex items-center overflow-x-auto px-4 py-2 border-t border-slate-200 dark:border-zinc-800 space-x-1 scrollbar-none bg-slate-50 dark:bg-[#0c0f16]">
        {navLinks.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`whitespace-nowrap px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                isActive
                  ? "bg-slate-900 text-white dark:bg-zinc-800 dark:text-white font-semibold"
                  : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
        <a
          href={POLYMARKET_BASE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="whitespace-nowrap px-3 py-1 rounded-md text-xs font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 flex items-center space-x-1"
        >
          <Zap className="w-3 h-3 fill-current" />
          <span>Polymarket (Ref: {POLYMARKET_REFERRAL_CODE})</span>
        </a>
      </div>
    </header>
  );
}
