"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Check, Clock, Info, Lock, Scale, Target, Trash2 } from "lucide-react";
import { useMotionPreference } from "@/components/MotionProvider";
import { useSpringValue } from "@/lib/use-spring-value";
import {
  HORIZON_MONTHS,
  addMonthsUtc,
  appendCall,
  clampProbability,
  clearCalls,
  createCallId,
  evaluateBadges,
  readCalls,
  resolveCall,
  scoreCalls,
  utcDayKey,
  writeCalls,
  type CallRecord,
  type ObservedPrint,
} from "@/lib/predictions";
import { formatAsOf } from "@/components/home/copy";
import { UndoAction } from "@/components/UndoAction";

/**
 * "Your Call" — the reader's own 12-month burst probability, kept next to the
 * model's, with a small badge strip for coming back.
 *
 * The rules this feature is built on, all of them deliberate:
 *
 *   1. It is NOT a leaderboard. There is no account, no server and no
 *      comparison with anybody else. The only thing being measured is the
 *      reader's own distance from the model, on the reader's own device.
 *   2. It is NOT a streak farm. A badge is a property of the calls
 *      themselves — nothing is awarded for visiting, and nothing is awarded
 *      for a timer. Six rules, all derived from the stored records.
 *   3. An open call is not a result. A call is only scored once the model's
 *      own trajectory publishes an observed print dated 12 months after it.
 *      Until then it is labelled open and it is never scored.
 *   4. Nothing may move. The comparison panel, the score panel, the badge
 *      strip and the history all reserve their space, so a submitted call, an
 *      unlocked badge or a growing history cannot shift the page.
 */

export interface YourCallProps {
  /** The model's published print right now, %. */
  modelPrintPct: number;
  /** The model's published band right now, e.g. "guarded". */
  modelBand: string;
  /** The band's plain-English label, e.g. "Guarded". */
  modelBandLabel: string;
  /** The UTC date of that print, "YYYY-MM-DD". */
  modelAsOf: string;
  /** The prediction-market price for the same question, %. */
  marketPct: number;
  /** The contract the market price comes from. */
  marketLabel: string;
  /** The UTC date of that market print, "YYYY-MM-DD". */
  marketAsOf: string;
  /** The model's observed trajectory prints — the resolution source. */
  observedRows: ObservedPrint[];
}

/**
 * Where the slider starts. A round number that is neither the model's print
 * nor the market's, so the reader is not handed an answer.
 */
const DEFAULT_CALL_PCT = 25;

/**
 * An action that can be taken back.
 *
 * The history is the reader's own record, and deleting a row from it used to
 * be a one-way door: the record was gone, the badges it had unlocked were
 * gone, and there was no way back. Both the single-row delete and the
 * clear-all now leave a record of what was removed, so the UNDO button in the
 * history panel can put it back exactly as it was.
 */
type PendingUndo =
  | { kind: "delete"; record: CallRecord }
  | { kind: "clear"; records: CallRecord[] };

/** Signed probability points, house style: "+1.7" / "-7.3". */
function signedPoints(value: number): string {
  return `${value >= 0 ? "+" : "-"}${Math.abs(value).toFixed(1)}`;
}

export function YourCall({
  modelPrintPct,
  modelBand,
  modelBandLabel,
  modelAsOf,
  marketPct,
  marketLabel,
  marketAsOf,
  observedRows,
}: YourCallProps) {
  /* ── Local state ─────────────────────────────────────────────────────── */

  const [sliderValue, setSliderValue] = useState<number>(DEFAULT_CALL_PCT);
  const [numberText, setNumberText] = useState<string>(String(DEFAULT_CALL_PCT));
  const [records, setRecords] = useState<CallRecord[]>([]);
  const [status, setStatus] = useState<string>("");
  const [confirmClear, setConfirmClear] = useState<boolean>(false);
  /** The action that can still be taken back, if the reader has not let it go. */
  const [pendingUndo, setPendingUndo] = useState<PendingUndo | null>(null);

  /**
   * The comparison numbers are LIVE FEEDBACK for a gesture: they answer
   * "where does my number sit" while the thumb is still moving. A number that
   * snaps to its new value at the end of the drag leaves the reader without
   * any sense of the distance they just travelled, so the comparison is
   * carried by a critically damped spring that starts from the value on
   * screen and never overshoots.
   *
   * The recorded call is NOT sprung. `sliderValue` is the truth - it is what
   * gets written to the log - and the headline number shows it exactly.
   */
  const { systemReduced } = useMotionPreference();
  const comparisonValue = useSpringValue(
    sliderValue,
    { stiffness: 380, mass: 1 },
    !systemReduced
  );

  /**
   * The store is read AFTER mount, never during render, so the server markup
   * and the first client render are identical. The history lives in a
   * fixed-height window, so filling it in cannot shift the page either.
   */
  useEffect(() => {
    setRecords(readCalls());
  }, []);

  /* ── Derived state ───────────────────────────────────────────────────── */

  const badges = useMemo(() => evaluateBadges(records), [records]);
  const earnedIds = useMemo(
    () => new Set(badges.filter((b) => b.earned).map((b) => b.id)),
    [badges]
  );
  const score = useMemo(() => scoreCalls(records, observedRows), [records, observedRows]);

  const history = useMemo(() => {
    return [...records]
      .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt))
      .map((record) => {
        const day = utcDayKey(record.submittedAt);
        const outcome = resolveCall(record, observedRows);
        return {
          record,
          day,
          fullDate: day ? formatAsOf(day) : "—",
          shortDate: day ? formatAsOf(day).replace(/ \d{4}$/, "") : "—",
          dueDate: day ? addMonthsUtc(day, HORIZON_MONTHS) : null,
          gap: record.probabilityPct - record.modelPrintPct,
          marketGap: record.probabilityPct - record.marketPct,
          outcome,
          readerError: outcome ? Math.abs(record.probabilityPct - outcome.probability) : null,
          modelError: outcome ? Math.abs(record.modelPrintPct - outcome.probability) : null,
        };
      });
  }, [records, observedRows]);

  /* ── Handlers ────────────────────────────────────────────────────────── */

  const handleSlider = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const next = clampProbability(Number.parseInt(event.target.value, 10));
    setSliderValue(next);
    setNumberText(String(next));
  }, []);

  const handleNumber = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const raw = event.target.value;
    setNumberText(raw);
    const parsed = Number.parseInt(raw, 10);
    if (Number.isFinite(parsed)) setSliderValue(clampProbability(parsed));
  }, []);

  const handleNumberBlur = useCallback(() => {
    setNumberText(String(sliderValue));
  }, [sliderValue]);

  const handleCall = useCallback(() => {
    const record: CallRecord = {
      id: createCallId(),
      probabilityPct: sliderValue,
      submittedAt: new Date().toISOString(),
      modelPrintPct,
      modelBand,
      marketPct,
    };

    const { records: next, persisted } = appendCall(record);
    setRecords(next);

    const unlocked = evaluateBadges(next)
      .filter((badge) => badge.earned && !earnedIds.has(badge.id))
      .map((badge) => badge.name);

    // The message is kept short on purpose: the status line is a fixed two
    // lines high, and a message that ran to three lines would push the page
    // down by a line. Two names at most, a count beyond that.
    let message = `Call recorded at ${record.probabilityPct}%.`;
    if (unlocked.length === 1) message += ` Badge unlocked: ${unlocked[0]}.`;
    else if (unlocked.length > 1) message += ` ${unlocked.length} badges unlocked.`;
    if (!persisted) message += " This browser would not save it.";
    setStatus(message);
  }, [sliderValue, modelPrintPct, modelBand, marketPct, earnedIds]);

  const handleClear = useCallback(() => {
    const cleared = clearCalls();
    const snapshot = records;
    setRecords([]);
    setConfirmClear(false);
    /** The cleared records are kept for a few seconds, in case. */
    setPendingUndo({ kind: "clear", records: snapshot });
    setStatus(
      cleared
        ? "Your calls were cleared from this browser."
        : "Your calls were cleared. This browser would not confirm the deletion."
    );
  }, [records]);

  /**
   * Delete one call from the history - and remember it, so the reader can put
   * it back.
   */
  const handleDeleteCall = useCallback(
    (record: CallRecord) => {
      const next = records.filter((entry) => entry.id !== record.id);
      setRecords(next);
      writeCalls(next);
      setPendingUndo({ kind: "delete", record });
    },
    [records]
  );

  /**
   * Take the last action back.
   *
   * The record is written back to storage exactly as it was, in the same
   * order, so a deleted call comes back with its date, its probability and the
   * model print it was frozen against.
   */
  const handleUndo = useCallback(() => {
    const pending = pendingUndo;
    setPendingUndo(null);
    if (!pending) return;

    if (pending.kind === "delete") {
      const next = [...records, pending.record].sort((a, b) =>
        a.submittedAt.localeCompare(b.submittedAt)
      );
      setRecords(next);
      writeCalls(next);
      return;
    }

    setRecords(pending.records);
    writeCalls(pending.records);
  }, [pendingUndo, records]);

  /** The undo window closed without an undo: the old state is gone for good. */
  const handleUndoExpired = useCallback(() => {
    setPendingUndo(null);
  }, []);

  /** The line the undo region shows. */
  const undoMessage = (() => {
    if (!pendingUndo) return "";
    if (pendingUndo.kind === "delete") {
      const day = utcDayKey(pendingUndo.record.submittedAt);
      return day ? `Call from ${formatAsOf(day)} deleted.` : "Call deleted.";
    }
    const count = pendingUndo.records.length;
    return count === 1 ? "1 call cleared." : `${count} calls cleared.`;
  })();

  /* ── Copy helpers ────────────────────────────────────────────────────── */

  const readerMaeText =
    score.readerMae === null ? "—" : `${score.readerMae.toFixed(1)} pts`;
  const modelMaeText = score.modelMae === null ? "—" : `${score.modelMae.toFixed(1)} pts`;

  const verdictText = (() => {
    if (score.resolvedCalls === 0) {
      return "No call has resolved yet. Nothing is scored until a 12-month print exists.";
    }
    if (score.readerAdvantage === null) return "";
    if (Math.abs(score.readerAdvantage) < 0.05) {
      return "Dead heat: your call and the model landed the same distance away.";
    }
    if (score.readerAdvantage > 0) {
      return `You were ${score.readerAdvantage.toFixed(1)} points closer than the model's own print.`;
    }
    return `The model's own print was ${Math.abs(score.readerAdvantage).toFixed(1)} points closer than yours.`;
  })();

  const earnedCount = badges.filter((b) => b.earned).length;

  /* ── Render ──────────────────────────────────────────────────────────── */

  return (
    <div className="space-y-6">
      {/* ══ 1 · The call ═══════════════════════════════════════════════ */}
      <section aria-labelledby="yc-call-heading" className="card">
        <div className="flex flex-wrap items-center gap-2">
          <span className="label">Your call</span>
          <span className="chip">12-month horizon</span>
          <span className="chip">stored on this device</span>
        </div>

        <h2
          id="yc-call-heading"
          className="mt-2 text-xl font-bold tracking-[-0.025em] text-ink sm:text-2xl"
        >
          Chance the AI build-out breaks within 12 months
        </h2>
        <p id="yc-call-help" className="mt-1.5 max-w-2xl text-[15px] leading-relaxed text-ink-muted">
          Put your own number on the question the model answers. The slider starts at{" "}
          {DEFAULT_CALL_PCT}%. When you record it, the model print and the market price are frozen
          alongside it, so the comparison stays honest in a year.
        </p>

        <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-[minmax(0,1fr)_9rem] sm:items-start">
          {/* Slider */}
          <div className="min-w-0">
            <label
              htmlFor="yc-slider"
              className="block text-[14px] font-semibold text-ink"
            >
              Your probability
            </label>
            <input
              id="yc-slider"
              type="range"
              min={0}
              max={100}
              step={1}
              value={sliderValue}
              onChange={handleSlider}
              aria-describedby="yc-call-help"
              aria-valuetext={`${sliderValue} percent chance the AI build-out breaks within 12 months`}
              className="mt-1 h-11 w-full accent-ink"
            />
            <div className="flex justify-between text-[12px] leading-tight text-ink-faint">
              <span>0%</span>
              <span>50%</span>
              <span>100%</span>
            </div>
          </div>

          {/* Number */}
          <div className="min-w-0">
            <label htmlFor="yc-number" className="block text-[14px] font-semibold text-ink">
              Same number, typed
            </label>
            <div className="mt-1 flex items-center gap-2">
              <input
                id="yc-number"
                type="number"
                inputMode="numeric"
                min={0}
                max={100}
                step={1}
                value={numberText}
                onChange={handleNumber}
                onBlur={handleNumberBlur}
                aria-describedby="yc-call-help"
                className="num h-11 w-full min-w-0 rounded-md border border-rule bg-canvas px-3 text-[15px] text-ink"
              />
              <span className="shrink-0 text-[14px] text-ink-muted">%</span>
            </div>
          </div>
        </div>

        <div className="mt-4">
          <button
            type="button"
            onClick={handleCall}
            aria-describedby="yc-call-help"
            className="btn btn-primary min-h-11 w-full px-5 sm:w-auto"
          >
            <Target className="h-4 w-4" aria-hidden="true" />
            Call it
          </button>
          <p
            role="status"
            aria-live="polite"
            className="mt-2 min-h-[3rem] text-[14px] leading-relaxed text-ink-muted"
          >
            {status}
          </p>
        </div>
      </section>

      {/* ══ 2 · The comparison ══════════════════════════════════════════ */}
      <section aria-labelledby="yc-compare-heading" className="card">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <h2
            id="yc-compare-heading"
            className="text-xl font-bold tracking-[-0.025em] text-ink"
          >
            Where your number sits
          </h2>
          <span className="label">probability points</span>
        </div>

        <div className="mt-3 grid grid-cols-1 gap-px overflow-hidden rounded-md border border-rule bg-rule sm:grid-cols-3">
          {/* The reader */}
          <div className="min-w-0 bg-surface p-3">
            <span className="label inline-flex items-center gap-1.5">
              <Target className="h-3.5 w-3.5" aria-hidden="true" />
              Your call
            </span>
            <p className="num mt-1 text-2xl font-bold leading-none text-ink">
              {sliderValue}
              <span className="text-base font-normal text-ink-faint">%</span>
            </p>
            <p className="mt-1.5 text-[13px] leading-snug text-ink-faint">
              Your own estimate. Kept in this browser, nowhere else.
            </p>
          </div>

          {/* The model */}
          <div className="min-w-0 bg-surface p-3">
            <span className="label">Model print</span>
            <p className="num mt-1 text-2xl font-bold leading-none text-ink">
              {modelPrintPct.toFixed(1)}
              <span className="text-base font-normal text-ink-faint">%</span>
            </p>
            <p className="mt-1.5 text-[13px] leading-snug text-ink-faint">
              {modelBandLabel} band, as of {formatAsOf(modelAsOf)}.
            </p>
          </div>

          {/* The market */}
          <div className="min-w-0 bg-surface p-3">
            <span className="label">Market price</span>
            <p className="num mt-1 text-2xl font-bold leading-none text-ink">
              {marketPct.toFixed(1)}
              <span className="text-base font-normal text-ink-faint">%</span>
            </p>
            <p className="mt-1.5 text-[13px] leading-snug text-ink-faint">
              {marketLabel}, as of {formatAsOf(marketAsOf)}.
            </p>
          </div>
        </div>

        <dl className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
          {(() => {
            const diffModel = comparisonValue - modelPrintPct;
            const diffMarket = comparisonValue - marketPct;
            const diffModelMarket = modelPrintPct - marketPct;
            const tone = (d: number) =>
              d > 0.05
                ? {
                    card: "rule-risk-left bg-[#FDF0EF]/60 dark:bg-[rgb(209_67_60/0.10)]",
                    num: "text-risk-700 dark:text-risk-300",
                  }
                : d < -0.05
                ? {
                    card: "rule-safe-left bg-[#EAF7F1]/60 dark:bg-[rgb(14_159_110/0.10)]",
                    num: "text-safe-700 dark:text-safe-300",
                  }
                : {
                    card: "rule-neutral-left bg-surface-2",
                    num: "text-ink",
                  };
            const tModel = tone(diffModel);
            const tMarket = tone(diffMarket);
            const tMM = tone(diffModelMarket);
            return (
              <>
                <div className={`min-w-0 rounded-md border border-rule px-3 py-2 transition-colors ${tModel.card}`}>
                  <dt className="text-[13px] text-ink-muted">Your call less the model</dt>
                  <dd className={`num mt-0.5 text-[15px] font-semibold ${tModel.num}`}>
                    {signedPoints(diffModel)} pts
                  </dd>
                </div>
                <div className={`min-w-0 rounded-md border border-rule px-3 py-2 transition-colors ${tMarket.card}`}>
                  <dt className="text-[13px] text-ink-muted">Your call less the market</dt>
                  <dd className={`num mt-0.5 text-[15px] font-semibold ${tMarket.num}`}>
                    {signedPoints(diffMarket)} pts
                  </dd>
                </div>
                <div className={`min-w-0 rounded-md border border-rule px-3 py-2 transition-colors ${tMM.card}`}>
                  <dt className="text-[13px] text-ink-muted">Model less the market</dt>
                  <dd className={`num mt-0.5 text-[15px] font-semibold ${tMM.num}`}>
                    {signedPoints(diffModelMarket)} pts
                  </dd>
                </div>
              </>
            );
          })()}
        </dl>

        <p className="mt-3 text-[13px] leading-relaxed text-ink-faint">
          The model print is the site&apos;s own daily run. How each number is built is written out,
          formula by formula, in the methodology.
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <Link
            href="/"
            className="chip min-h-11 px-3 text-[13px] hover:border-rule-strong hover:text-ink"
          >
            See today&apos;s print on the front page
          </Link>
          <Link
            href="/methodology"
            className="chip min-h-11 px-3 text-[13px] hover:border-rule-strong hover:text-ink"
          >
            How the model is built
          </Link>
        </div>
      </section>

      {/* ══ 3 · History ══════════════════════════════════════════════════ */}
      <section aria-labelledby="yc-history-heading" className="card">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <h2
            id="yc-history-heading"
            className="text-xl font-bold tracking-[-0.025em] text-ink"
          >
            Your call history
          </h2>
          <span className="label">
            {records.length} recorded · {score.resolvedCalls} resolved
          </span>
        </div>

        {/*
          The window has a fixed height on purpose: a call being recorded, a
          badge unlocking or the list growing must not move anything below it.
        */}
        <div
          className="mt-3 h-[19rem] overflow-y-auto rounded-md border border-rule bg-canvas"
          style={{ scrollbarGutter: "stable" }}
          role="region"
          aria-label="Your call history, scrollable"
          tabIndex={0}
        >
          <table className="w-full table-fixed border-collapse text-[14px]">
            <caption className="sr-only">
              Every call recorded on this device, newest first: the date, the probability you called,
              the model print on that day, the gap between them, and the outcome once the 12-month
              window has closed.
            </caption>
            <colgroup>
              <col className="w-[21%]" />
              <col className="w-[14%]" />
              <col className="w-[16%]" />
              <col className="w-[12%]" />
              <col className="w-[24%]" />
              <col className="w-[13%]" />
            </colgroup>
            <thead className="sticky top-0 z-10 bg-surface-2">
              <tr>
                <th
                  scope="col"
                  className="px-2 py-2 text-left text-[13px] font-medium uppercase tracking-[0.1em] text-ink-faint"
                >
                  Date
                </th>
                <th
                  scope="col"
                  className="px-1 py-2 text-left text-[13px] font-medium uppercase tracking-[0.1em] text-ink-faint"
                >
                  You
                </th>
                <th
                  scope="col"
                  className="px-1 py-2 text-left text-[13px] font-medium uppercase tracking-[0.1em] text-ink-faint"
                >
                  Model
                </th>
                <th
                  scope="col"
                  className="px-1 py-2 text-left text-[13px] font-medium uppercase tracking-[0.1em] text-ink-faint"
                >
                  Gap
                </th>
                <th
                  scope="col"
                  className="px-2 py-2 text-left text-[13px] font-medium uppercase tracking-[0.1em] text-ink-faint"
                >
                  Outcome
                </th>
                <th
                  scope="col"
                  className="px-1 py-2 text-right text-[13px] font-medium uppercase tracking-[0.1em] text-ink-faint"
                >
                  <span className="sr-only">Delete this call</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {history.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-3 py-8 text-center text-[14px] text-ink-muted">
                    No calls yet. The first one you record will sit here, with the model print and
                    the market price as they stood that day.
                  </td>
                </tr>
              ) : (
                history.map((row) => (
                  <tr key={row.record.id} className="border-t border-rule align-top">
                    <th
                      scope="row"
                      className="px-2 py-2 text-left text-[14px] font-normal leading-snug text-ink-muted"
                    >
                      <span className="sm:hidden">{row.shortDate}</span>
                      <span className="hidden sm:inline">{row.fullDate}</span>
                    </th>
                    <td className="num px-1 py-2 text-[14px] font-semibold text-ink">
                      {row.record.probabilityPct}%
                    </td>
                    <td className="num px-1 py-2 text-[14px] text-ink-muted">
                      {row.record.modelPrintPct.toFixed(1)}%
                    </td>
                    <td className="num px-1 py-2 text-[14px]">
                      <span className={`chip ${row.gap > 0 ? "chip-risk" : row.gap < 0 ? "chip-safe" : ""}`}>
                        {signedPoints(row.gap)}
                      </span>
                    </td>
                    <td className="px-2 py-2 text-[14px] leading-snug text-ink-muted">
                      {row.outcome ? (
                        <>
                          <span className="num font-semibold text-ink">
                            {row.outcome.probability.toFixed(1)}%
                          </span>
                          <span className="mt-0.5 hidden text-[13px] leading-tight text-ink-faint sm:block">
                            you {row.readerError?.toFixed(1)} · model {row.modelError?.toFixed(1)}
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="chip">
                            <Clock className="h-3 w-3" aria-hidden="true" />
                            Open
                          </span>
                          <span className="mt-0.5 hidden text-[13px] leading-tight text-ink-faint sm:block">
                            due {row.dueDate ? formatAsOf(row.dueDate) : "—"}
                          </span>
                        </>
                      )}
                    </td>
                    <td className="px-1 py-2 text-right align-middle">
                      <button
                        type="button"
                        onClick={() => handleDeleteCall(row.record)}
                        aria-label={`Delete the call from ${row.fullDate}`}
                        title={`Delete the call from ${row.fullDate}`}
                        className="inline-flex h-11 w-11 items-center justify-center rounded-md text-ink-faint transition-colors hover:bg-surface-2 hover:text-ink"
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* ── The undo row ───────────────────────────────────────────────── */}
        {/*
          The slot is reserved with a fixed height, so the row that appears
          when an action can be taken back does not push the page down. The
          window is paused while the pointer is on it or it holds the focus.
        */}
        <div className="mt-2 min-h-[2.75rem]">
          <UndoAction
            message={undoMessage}
            onUndo={handleUndo}
            onExpire={handleUndoExpired}
            undoLabel="Undo"
            undoDescription="put the call back on your record"
          />
        </div>

        <p className="mt-2 text-[13px] leading-relaxed text-ink-faint">
          Dates are UTC. &ldquo;Model&rdquo; is the print on the day you called; &ldquo;Gap&rdquo; is
          your call minus that print. A call resolves when the model publishes an observed print
          dated 12 months after it. Until then it is open, and an open call is never scored.
        </p>

        {/* ── Clear control ─────────────────────────────────────────────── */}
        <div className="mt-4 border-t border-rule pt-3">
          <div className="flex min-h-[2.75rem] flex-wrap items-center gap-2">
            {confirmClear ? (
              <>
                <button
                  type="button"
                  onClick={handleClear}
                  className="btn min-h-11 border-rule-strong px-4 text-[14px]"
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                  Yes, clear my calls
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmClear(false)}
                  className="btn btn-ghost min-h-11 text-[14px]"
                >
                  Keep them
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmClear(true)}
                className="btn btn-ghost min-h-11 px-2 text-[14px]"
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
                Clear my calls
              </button>
            )}
          </div>
          <p className="mt-1 text-[13px] leading-snug text-ink-faint">
            Everything you have recorded lives in this browser only. Clearing it can be taken back
            for a few seconds, and so can deleting one call.
          </p>
        </div>
      </section>

      {/* ══ 4 · The personal score ═══════════════════════════════════════ */}
      <section aria-labelledby="yc-score-heading" className="card">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <h2
            id="yc-score-heading"
            className="inline-flex items-center gap-2 text-xl font-bold tracking-[-0.025em] text-ink"
          >
            <Scale className="h-5 w-5 text-ink-muted" aria-hidden="true" />
            Your record against the model
          </h2>
          <span className="label">self-record, this device only</span>
        </div>

        <dl className="mt-3 grid grid-cols-1 gap-px overflow-hidden rounded-md border border-rule bg-rule sm:grid-cols-3">
          <div className="min-w-0 bg-surface p-3">
            <dt className="text-[13px] uppercase tracking-[0.12em] text-ink-faint">
              Your mean error
            </dt>
            <dd className="num mt-0.5 text-lg font-semibold text-ink">{readerMaeText}</dd>
            <p className="mt-1 min-h-[2.5rem] text-[13px] leading-snug text-ink-faint">
              Your call, measured against the model print on the resolution date.
            </p>
          </div>
          <div className="min-w-0 bg-surface p-3">
            <dt className="text-[13px] uppercase tracking-[0.12em] text-ink-faint">
              Model mean error
            </dt>
            <dd className="num mt-0.5 text-lg font-semibold text-ink">{modelMaeText}</dd>
            <p className="mt-1 min-h-[2.5rem] text-[13px] leading-snug text-ink-faint">
              The model&apos;s own print on the day you called, measured the same way.
            </p>
          </div>
          <div className="min-w-0 bg-surface p-3">
            <dt className="text-[13px] uppercase tracking-[0.12em] text-ink-faint">
              Calls resolved
            </dt>
            <dd className="num mt-0.5 text-lg font-semibold text-ink">
              {score.resolvedCalls}
              <span className="text-sm font-normal text-ink-faint"> of {score.totalCalls}</span>
            </dd>
            <p className="mt-1 min-h-[4.25rem] text-[13px] leading-snug text-ink-faint">
              {verdictText}
            </p>
          </div>
        </dl>

        <p className="mt-3 text-[13px] leading-relaxed text-ink-faint">
          This is not a Brier score. The target is the model&apos;s own probability 12 months on, not
          a yes/no event, so it measures how closely a call tracked the model — not whether anybody
          was right.
        </p>
      </section>

      {/* ══ 5 · Badges ═══════════════════════════════════════════════════ */}
      <section aria-labelledby="yc-badges-heading" className="card">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <h2
            id="yc-badges-heading"
            className="text-xl font-bold tracking-[-0.025em] text-ink"
          >
            Badges
          </h2>
          <span className="label">
            {earnedCount} of {badges.length} earned
          </span>
        </div>
        <p className="mt-1.5 max-w-2xl text-[14px] leading-relaxed text-ink-muted">
          Every badge is a property of the calls you have recorded. Nothing is awarded for visiting,
          and a locked badge shows the rule that would open it.
        </p>

        <ul className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {badges.map((badge) => (
            <li
              key={badge.id}
              className="flex min-h-[8.75rem] flex-col rounded-md border border-rule bg-surface p-3"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="text-[14px] font-semibold leading-snug text-ink">
                  {badge.name}
                </span>
                <span className={`chip shrink-0 ${badge.earned ? "chip-safe" : ""}`}>
                  {badge.earned ? (
                    <Check className="h-3 w-3" aria-hidden="true" />
                  ) : (
                    <Lock className="h-3 w-3" aria-hidden="true" />
                  )}
                  {badge.earned ? "Earned" : "Locked"}
                </span>
              </div>
              <p className="mt-1.5 line-clamp-2 min-h-[2.5rem] text-[13px] leading-snug text-ink-muted">
                {badge.rule}
              </p>
              <p className="mt-1 line-clamp-2 min-h-[2.5rem] text-[13px] leading-snug text-ink-faint">
                {badge.earned ? badge.progress : badge.hint}
              </p>
            </li>
          ))}
        </ul>
      </section>

      {/* ══ 6 · Disclosure ══════════════════════════════════════════════ */}
      <section aria-labelledby="yc-disclosure-heading" className="notice notice-caution not-this-body">
        <h3
          id="yc-disclosure-heading"
          className="notice-title inline-flex items-center gap-1.5"
        >
          <Info className="h-3.5 w-3.5" aria-hidden="true" />
          What this is, and what it is not
        </h3>
        <div className="mt-2 space-y-2 text-[14px] leading-relaxed text-ink-muted">
          <p>
            Your calls are not forecasts until the window closes. A call is a record of what you
            believed on a given day, and it is only scored when the model publishes an observed
            print 12 months later. Before that it is open, and an open call is not a result.
          </p>
          <p>
            The scoreboard lives only on this device. There is no account, no leaderboard, no
            comparison with anybody else and nothing uploaded — the records are in this browser&apos;s
            local storage and nowhere else.
          </p>
          <p>
            The model&apos;s own limit applies to any comparison you make here. Its backtest set
            contains five resolved episodes that all burst and no non-bust rows, so the published
            number carries no false-positive validation: it has never been shown a bubble that did
            not break. Measuring yourself against it measures how closely you tracked a model with
            that record, not which of you was right.
          </p>
          <p>
            The badge rules are printed above each badge, they are computed from your own stored
            calls, and nothing is awarded for coming back to the page. If you clear your calls, the
            badges go with them.
          </p>
        </div>
      </section>
    </div>
  );
}

export default YourCall;
