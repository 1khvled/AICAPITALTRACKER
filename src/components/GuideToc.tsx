import { MethodologyToc } from "@/components/MethodologyToc";
import type { GuideSectionRef } from "@/lib/guides/sections";

/**
 * The guides' table of contents.
 *
 * The same scroll-spy navigation the methodology page uses - sticky on a
 * desktop, a disclosure on a phone, one deep link per section, and a
 * back-to-top once the reader is more than a screen down. A guide is a long
 * read; a reader needs to see its shape before they commit to it, and a way
 * back to the top when they are done.
 */
export function GuideToc({ sections }: { sections: GuideSectionRef[] }) {
  return <MethodologyToc sections={sections} />;
}

export default GuideToc;
