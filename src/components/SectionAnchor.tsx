import React from "react";
import { Link2 } from "lucide-react";
import { METHODOLOGY_SECTIONS } from "@/lib/methodology/sections";

/**
 * The per-section deep link.
 *
 * Every section of the methodology article carries one of these next to its
 * section number, so a reader can point at a single section instead of the
 * whole page: the link resolves to /methodology#<section-id> and lands under
 * the sticky chrome (the table of contents sets the scroll margin for it).
 *
 * It is a plain anchor on purpose - no JavaScript, no copy button, no
 * clipboard permission prompt. Right-click -> "copy link address" gives the
 * reader the deep link, and a plain left click moves the page.
 *
 * The 44x44 target is achieved with a transparent hit area: the negative
 * margins keep the section's own header row exactly the height it was, so
 * adding the link changes nothing in the article's layout.
 */
export interface SectionAnchorProps {
  /** The section's anchor id. Must match the <section id> in the article. */
  id: string;
}

export function SectionAnchor({ id }: SectionAnchorProps) {
  const number = METHODOLOGY_SECTIONS.find((section) => section.id === id)?.number;
  const label = number ? `Link to Section ${number}` : "Link to this section";

  return (
    <a
      href={`#${id}`}
      aria-label={label}
      title={label}
      className="-my-2 ml-1 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-md text-ink-faint transition-colors hover:bg-surface-2 hover:text-ink"
    >
      <Link2 className="h-3.5 w-3.5" aria-hidden="true" />
    </a>
  );
}

export default SectionAnchor;
