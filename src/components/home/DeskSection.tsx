import React from "react";

/**
 * DeskSection — the desk's numbered section masthead.
 *
 * Every block on the home page opens the same way: a heavy rule, a monospace
 * index, the title, and one right-aligned status line. The numbering is the
 * page's table of contents; the status line says what the block is reading.
 */
export interface DeskSectionProps {
  id: string;
  index: string;
  title: string;
  meta?: string;
  intro?: string;
  children: React.ReactNode;
  className?: string;
}

export function DeskSection({
  id,
  index,
  title,
  meta,
  intro,
  children,
  className,
}: DeskSectionProps) {
  const headingId = `${id}-heading`;
  return (
    <section id={id} aria-labelledby={headingId} className={className}>
      <header className="desk-head">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span className="index-tag">{index}</span>
          <h2
            id={headingId}
            className="text-xl font-bold tracking-[-0.025em] text-ink sm:text-2xl"
          >
            {title}
          </h2>
        </div>
        {meta ? <span className="desk-meta">{meta}</span> : null}
      </header>
      {intro ? (
        <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-ink-muted">{intro}</p>
      ) : null}
      <div className="mt-5">{children}</div>
    </section>
  );
}

export default DeskSection;
