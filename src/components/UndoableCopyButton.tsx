"use client";

import React, { useCallback, useRef, useState } from "react";
import { Check, Copy } from "lucide-react";
import { UndoAction } from "@/components/UndoAction";

/**
 * A copy button you can take back.
 *
 * The pattern the site uses for a copy that is awkward to undo: the code goes
 * to the clipboard, the confirmation is announced in a live region beside the
 * button, and an UNDO button sits in that region for a few seconds. Pressing
 * it puts the clipboard back the way it was.
 *
 * WHY THE CLIPBOARD IS RESTORED RATHER THAN CLEARED
 * A copy is not destructive, but it is rude to leave a referral code in the
 * clipboard when the reader did not want it there. The contents of the
 * clipboard are read BEFORE the copy (best effort - a browser that refuses to
 * read is never prompted) and written back on undo. When the browser would
 * not let the page read the clipboard, the undo clears what this button put
 * there and says so, rather than pretending it did something it did not.
 *
 * THE ZERO-CLS RULE
 * The button keeps a fixed minimum width, so the label change between
 * "Copy code" and "Copied" never resizes it. The confirmation hangs over the
 * page (absolutely positioned), so nothing moves when it appears.
 *
 * WHERE IT IS USED
 * The referral-code copy button on the prediction-market board
 * (src/app/prediction-markets/_components/ReferralCodeCopy.tsx) is the one
 * this was written for. That file belongs to another agent and is left
 * untouched; this component is the drop-in replacement for it, and the swap is
 * a one-line change when that file is next edited.
 */
export function UndoableCopyButton({
  code,
  label = "Copy code",
  className,
}: {
  /** The text that goes to the clipboard. */
  code: string;
  /** The visible label on the button. */
  label?: string;
  /** Extra classes on the button. */
  className?: string;
}) {
  const [copied, setCopied] = useState(false);
  const [message, setMessage] = useState("");
  /** What the clipboard held before this button wrote to it, if it could be read. */
  const previousClipboard = useRef<string | null>(null);

  const handleCopy = useCallback(async () => {
    try {
      /**
       * Read the clipboard first, but only if the browser has already granted
       * the permission: a reader must never be interrupted by a permission
       * bubble because they pressed a copy button.
       */
      previousClipboard.current = null;
      try {
        if (
          typeof navigator !== "undefined" &&
          navigator.permissions &&
          typeof navigator.permissions.query === "function"
        ) {
          const status = await navigator.permissions.query({
            /** Not in the DOM lib's PermissionName union yet. */
            name: "clipboard-read" as unknown as PermissionName,
          });
          if (status.state === "granted") {
            previousClipboard.current = await navigator.clipboard.readText();
          }
        }
      } catch {
        /** A browser that will not read the clipboard is not an error. */
        previousClipboard.current = null;
      }

      await navigator.clipboard?.writeText(code);
      setCopied(true);
      setMessage(`Referral code ${code} copied to the clipboard.`);
    } catch {
      /**
       * A clipboard that refuses (no permission, insecure context) is not an
       * error worth shouting about - the code is printed next to the button.
       */
      setCopied(false);
      setMessage("The browser would not let this page reach the clipboard.");
    }
  }, [code]);

  const handleUndo = useCallback(async () => {
    const previous = previousClipboard.current;
    previousClipboard.current = null;
    setCopied(false);
    setMessage("");
    try {
      if (previous === null) {
        /** We do not know what was there, so we take back what we put there. */
        await navigator.clipboard?.writeText("");
        return;
      }
      await navigator.clipboard?.writeText(previous);
    } catch {
      /** Nothing more can be done; the code is printed next to the button. */
    }
  }, []);

  return (
    <span className="relative inline-flex">
      <button
        type="button"
        onClick={handleCopy}
        className={[
          "btn min-h-11 min-w-[11rem] whitespace-nowrap",
          className ?? "",
        ].join(" ")}
      >
        {copied ? (
          <Check className="h-4 w-4 text-safe-600" aria-hidden="true" />
        ) : (
          <Copy className="h-4 w-4" aria-hidden="true" />
        )}
        <span>{copied ? `Copied ${code}` : `${label}: ${code}`}</span>
      </button>

      <UndoAction
        placement="anchored"
        message={message}
        onUndo={handleUndo}
        undoLabel="Undo"
        undoDescription={`put the clipboard back the way it was before ${code} was copied`}
      />
    </span>
  );
}

export default UndoableCopyButton;
