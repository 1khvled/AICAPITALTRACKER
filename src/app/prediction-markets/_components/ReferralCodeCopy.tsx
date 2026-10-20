"use client";

import React, { useState } from "react";
import { Check, Copy } from "lucide-react";

/**
 * The referral-code copy button.
 *
 * The same pattern the /markets widget uses (Copy → Check for two seconds),
 * extracted so this page does not have to duplicate that widget. It writes to
 * the clipboard and nothing else: no request leaves the browser, and no state
 * is stored.
 *
 * The button carries a fixed minimum width so the label change on copy never
 * resizes the button and shifts the row (zero CLS).
 */
export function ReferralCodeCopy({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard?.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // A clipboard that refuses (no permission, insecure context) is not an
      // error worth shouting about — the code is printed next to the button.
      setCopied(false);
    }
  };

  return (
    <span className="inline-flex items-center gap-2">
      <button
        type="button"
        onClick={handleCopy}
        className="btn min-h-11 min-w-[11rem] whitespace-nowrap"
      >
        {copied ? (
          <Check className="h-4 w-4 text-safe-600" aria-hidden="true" />
        ) : (
          <Copy className="h-4 w-4" aria-hidden="true" />
        )}
        <span>{copied ? `Copied ${code}` : `Copy code: ${code}`}</span>
      </button>
      <span role="status" className="sr-only">
        {copied ? `Referral code ${code} copied to the clipboard` : ""}
      </span>
    </span>
  );
}
