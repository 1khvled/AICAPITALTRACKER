"use client";

import React from "react";
import { UndoableCopyButton } from "@/components/UndoableCopyButton";

/**
 * The referral-code copy button.
 *
 * 2026-10-20: this is now the undoable variant. A referral code is not
 * destructive, but leaving one in the clipboard when the reader did not want
 * it there is rude - so the copy can be taken back: the clipboard is read
 * BEFORE the copy (best effort; a browser that refuses to read is never
 * prompted) and written back on undo.
 *
 * The button keeps a fixed minimum width, so the label change between
 * "Copy code" and "Copied" never resizes it and shifts the row (zero CLS).
 */
export function ReferralCodeCopy({ code }: { code: string }) {
  return <UndoableCopyButton code={code} label={`Copy code: ${code}`} />;
}
