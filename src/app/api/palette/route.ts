import { NextResponse } from "next/server";
import { buildPaletteIndex } from "@/lib/palette-index";

/**
 * The command palette's search index.
 *
 * It used to be inlined into every page's RSC payload (~250 records, tens of
 * kilobytes on EVERY route, for a palette most readers never open). It is built
 * on the server here instead and fetched the first time the palette opens, so
 * a cold page load carries none of it.
 *
 * `force-static` builds the index at build time and serves it from the CDN —
 * the underlying data files are static, so the index never has to be rebuilt
 * per request.
 */
export const dynamic = "force-static";

export function GET() {
  return NextResponse.json({ items: buildPaletteIndex() });
}
