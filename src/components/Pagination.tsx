import React from 'react';
import Link from 'next/link';

interface PaginationProps {
  page: number;
  totalPages: number;
  basePath: string;
  /** Current query params (filters) to preserve across page links. Excludes `page`. */
  params: Record<string, string | undefined>;
}

function buildHref(basePath: string, params: Record<string, string | undefined>, page: number): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '' && value !== 'all') {
      search.set(key, value);
    }
  }
  if (page > 1) {
    search.set('page', String(page));
  }
  const qs = search.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}

/**
 * Server-component pagination strip. Preserves active filters via `params`
 * and drops `page=1` for canonical cleanliness.
 */
export function Pagination({ page, totalPages, basePath, params }: PaginationProps) {
  if (totalPages <= 1) return null;

  const pageNumbers: number[] = [];
  const start = Math.max(1, Math.min(page - 2, totalPages - 4));
  const end = Math.min(totalPages, start + 4);
  for (let p = Math.max(1, end - 4); p <= end; p++) {
    pageNumbers.push(p);
  }

  const step =
    'min-w-9 rounded-full border px-2.5 py-1.5 text-center font-mono text-xs tabular-nums transition duration-150';
  const stepIdle = `${step} border-zinc-200 bg-white text-zinc-600 hover:border-zinc-400 hover:bg-zinc-50 hover:text-zinc-950`;
  const stepActive = `${step} border-zinc-950 bg-zinc-950 font-bold text-white shadow-panel`;

  return (
    <nav aria-label="Pagination" className="flex flex-wrap items-center justify-center gap-1.5 pt-4">
      {page > 1 && (
        <Link
          href={buildHref(basePath, params, page - 1)}
          rel="prev"
          aria-label="Previous page"
          className={stepIdle}
        >
          <span aria-hidden="true">&larr;</span> Prev
        </Link>
      )}

      {pageNumbers.map((p) => (
        <Link
          key={p}
          href={buildHref(basePath, params, p)}
          aria-current={p === page ? 'page' : undefined}
          aria-label={`Page ${p} of ${totalPages}`}
          className={p === page ? stepActive : stepIdle}
        >
          {p}
        </Link>
      ))}

      {page < totalPages && (
        <Link
          href={buildHref(basePath, params, page + 1)}
          rel="next"
          aria-label="Next page"
          className={stepIdle}
        >
          Next <span aria-hidden="true">&rarr;</span>
        </Link>
      )}

      {/* Orientation readout — the numbered steps alone never say "of N". */}
      <span className="micro-label ml-2 whitespace-nowrap">
        Page {page} / {totalPages}
      </span>
    </nav>
  );
}

/** Clamp a raw `?page=` value to [1, totalPages]. */
export function parsePageParam(raw: string | undefined, totalPages: number): number {
  const n = Number.parseInt(raw || '1', 10);
  if (!Number.isFinite(n) || n < 1) return 1;
  return Math.min(n, Math.max(1, totalPages));
}