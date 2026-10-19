import React from "react";
import Link from "next/link";
import { Reveal } from "@/components/Reveal";

/**
 * Page footer. One sentence of model caveat, then the recipe link.
 * Kept deliberately short: the site footer carries the full legal wording.
 */
export function ModelNote({ asOf }: { asOf: string | null }) {
  return (
    <div className="notice text-[14px] text-ink-faint">
      <Reveal>
        <p className="max-w-3xl leading-relaxed">
          This is a transparent composite indicator built from public filings and reported market prices.
          It is not investment advice.
          {asOf ? ` Inputs as of ${asOf}.` : null}{" "}
          <Link href="/methodology" className="prose-a">
            Read the method
          </Link>
          .
        </p>
      </Reveal>
    </div>
  );
}
