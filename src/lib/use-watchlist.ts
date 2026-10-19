"use client";

/**
 * One watchlist for the whole site.
 *
 * The /markets quotes board and the /companies browser used to keep their own
 * copy of the same idea. They now share this hook, and therefore one list:
 * saving ORCL on /markets shows Oracle as saved on /companies, because both
 * pages read and write the same key.
 *
 * The rules that came with the storage:
 *   1. localStorage is NEVER touched during render. The list is read in an
 *      effect (after mount) and written only from the toggle handler, so the
 *      server markup and the first client render agree and there is no
 *      hydration mismatch.
 *   2. JSON.parse is guarded. A corrupted value is treated as an empty list.
 *   3. A private-mode browser, a disabled storage API or a full quota must
 *      never break a page. Every storage call is wrapped; if the write fails,
 *      the in-memory list still works for the session.
 *   4. Tickers are stored as symbols, upper-cased and trimmed. A profile that
 *      has not listed has no symbol, so it is never given one here — see
 *      `listedTicker` in the companies browser.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

/** The one storage key both pages read and write. */
export const WATCHLIST_STORAGE_KEY = "aict-watchlist-v1";

export interface WatchlistApi {
  /** The saved ticker symbols, in the order they were saved. */
  watchlist: string[];
  /** True when the ticker is on the list. */
  isWatched: (ticker: string) => boolean;
  /** Add the ticker if it is missing, remove it if it is there. */
  toggle: (ticker: string) => void;
  /** How many tickers are saved. */
  count: number;
}

/** Symbols are stored upper-cased and trimmed, so one name has one key. */
export function normalizeTicker(ticker: string): string {
  return ticker.trim().toUpperCase();
}

/** Read the stored list. Any failure — no storage, bad JSON — is an empty list. */
function readWatchlist(): string[] {
  try {
    const raw = window.localStorage.getItem(WATCHLIST_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const list: string[] = [];
    parsed.forEach((entry) => {
      if (typeof entry !== "string") return;
      const ticker = normalizeTicker(entry);
      if (!ticker) return;
      if (list.indexOf(ticker) === -1) list.push(ticker);
    });
    return list;
  } catch {
    return [];
  }
}

/** Write the list. A failure here is swallowed on purpose. */
function writeWatchlist(tickers: string[]): void {
  try {
    window.localStorage.setItem(WATCHLIST_STORAGE_KEY, JSON.stringify(tickers));
  } catch {
    /* storage unavailable (private mode, quota) — the in-memory list still works */
  }
}

/**
 * The shared watchlist.
 *
 *   const { watchlist, isWatched, toggle, count } = useWatchlist();
 */
export function useWatchlist(): WatchlistApi {
  const [watchlist, setWatchlist] = useState<string[]>([]);
  /**
   * The same list, readable synchronously. The handlers need the current
   * value at the moment they run, and a ref is the honest way to read it
   * without closing over a stale copy.
   */
  const listRef = useRef<string[]>([]);

  // Read AFTER mount — never during render, so the server markup and the
  // first client render are identical.
  useEffect(() => {
    const stored = readWatchlist();
    listRef.current = stored;
    setWatchlist(stored);
  }, []);

  // Another tab changed the list. Adopt it so both pages stay in step.
  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key !== null && event.key !== WATCHLIST_STORAGE_KEY) return;
      const stored = readWatchlist();
      listRef.current = stored;
      setWatchlist(stored);
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const isWatched = useCallback((ticker: string) => {
    const key = normalizeTicker(ticker);
    if (!key) return false;
    return listRef.current.indexOf(key) !== -1;
  }, []);

  const toggle = useCallback((ticker: string) => {
    const key = normalizeTicker(ticker);
    if (!key) return;
    const current = listRef.current;
    const next =
      current.indexOf(key) === -1
        ? [...current, key]
        : current.filter((entry) => entry !== key);
    listRef.current = next;
    writeWatchlist(next);
    setWatchlist(next);
  }, []);

  return useMemo(
    () => ({ watchlist, isWatched, toggle, count: watchlist.length }),
    [watchlist, isWatched, toggle]
  );
}

export default useWatchlist;
