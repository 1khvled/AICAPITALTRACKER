'use client';

import React, { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { chartHitProps, pct } from './chartInteraction';

const STEPS: { title: string; desc: string; guarantee: string }[] = [
  {
    title: 'Ingest',
    desc: 'Poll SEC EDGAR submissions + company IR feeds under fair-access rate limits.',
    guarantee: 'Every item starts life as a filing, never as an assertion.',
  },
  {
    title: 'SSRF check',
    desc: 'Allow-list + DNS validation on every fetched URL before any network call.',
    guarantee: 'No outbound request is made to an unvalidated host.',
  },
  {
    title: 'Zod validation',
    desc: 'Schema-guard amounts, dates, counterparties and evidence levels at the boundary.',
    guarantee: 'Undisclosed amounts stay undisclosed — never imputed.',
  },
  {
    title: 'DB trigger',
    desc: 'Candidates land quarantined in the discovery queue — never auto-published.',
    guarantee: 'Nothing reaches the public ledger without a human.',
  },
  {
    title: 'Publish',
    desc: 'Human editorial review promotes verified items to the public ledger.',
    guarantee: 'Each deal carries at least one cited source.',
  },
  {
    title: 'Audit',
    desc: 'Corrections log + dispute tracking stay public; superseded terms preserved.',
    guarantee: 'History is append-only and visible to everyone.',
  },
];

/**
 * Six-step publication pipeline flowchart: Ingest -> SSRF check -> Zod ->
 * DB trigger -> Publish -> Audit. Each step is a focusable control that
 * reports the guarantee it enforces, so the pipeline explains itself without
 * a hover-only affordance.
 */
export function PipelineFlow() {
  const [active, setActive] = useState<number | null>(null);
  const activeStep = active !== null ? STEPS[active] : null;

  return (
    <div className="space-y-3">
      <div
        className="flex flex-col gap-2 md:flex-row md:items-stretch"
        role="group"
        aria-label="Publication pipeline: Ingest, SSRF check, Zod validation, DB trigger quarantine, human publish, public audit."
      >
        {STEPS.map((step, i) => {
          const on = active === i;
          const near = active !== null && Math.abs(active - i) === 1;
          return (
            <React.Fragment key={step.title}>
              <div
                className={`panel-sunken flex-1 space-y-1.5 p-4 transition-[transform,box-shadow,opacity] duration-200 ${
                  on ? 'border-emerald-500/40 shadow-[0_0_0_2px_rgba(5,150,105,0.28),0_18px_40px_-24px_rgba(9,9,11,0.6)] -translate-y-0.5' : ''
                }`}
                style={{ opacity: active !== null && !on && !near ? 0.5 : 1 }}
                {...chartHitProps<HTMLDivElement>({
                  label: `Step ${i + 1} of ${STEPS.length}: ${step.title}. ${step.desc} Guarantee: ${step.guarantee}`,
                  interactive: false,
                  focusable: true,
                  onEnter: () => setActive(i),
                  onLeave: () => setActive((cur) => (cur === i ? null : cur)),
                })}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full font-mono text-[10px] font-bold transition-colors ${
                      on ? 'bg-emerald-500 text-white' : 'bg-zinc-950 text-emerald-300'
                    }`}
                  >
                    {i + 1}
                  </span>
                  <span className="panel-title">
                    {step.title}
                  </span>
                </div>
                <p className="text-[11px] leading-relaxed text-zinc-600">{step.desc}</p>
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className="flex items-center justify-center transition-opacity duration-200 md:px-0.5"
                  style={{ opacity: active === i || active === i + 1 ? 1 : 0.45 }}
                  aria-hidden="true"
                >
                  <ArrowRight className="h-4 w-4 w-4 shrink-0 rotate-90 text-zinc-500 md:rotate-0" />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <span className={`chart-readout ${activeStep ? '' : 'chart-readout-muted'}`}>
          {activeStep ? (
            <>
              {STEPS[active ?? 0].title} · {activeStep.guarantee}
            </>
          ) : (
            'Hover, Tab or focus a step'
          )}
        </span>
      </div>
    </div>
  );
}

export interface EvidenceSlice {
  label: string;
  value: number;
  color: string;
}

interface EvidenceDonutProps {
  data: EvidenceSlice[];
  totalLabel: string;
}

/**
 * Local evidence-distribution donut. Renders whatever slices it is given —
 * computed live from the ledger, never hand-drawn. Slices are focusable and
 * swap the centre readout for the hovered evidence level.
 */
export function EvidenceDonut({ data, totalLabel }: EvidenceDonutProps) {
  const [active, setActive] = useState<number | null>(null);
  const total = Math.max(
    1,
    data.reduce((a, s) => a + s.value, 0)
  );

  const R = 60;
  const C = 2 * Math.PI * R;
  let acc = 0;
  const segments = data.map((s) => {
    const frac = s.value / total;
    const seg = { ...s, frac, offset: -acc * C };
    acc += frac;
    return seg;
  });
  const activeSeg = active !== null ? segments[active] : undefined;

  return (
    <div className="flex flex-col sm:flex-row items-center gap-5">
      <svg
        width="160"
        height="160"
        viewBox="0 0 160 160"
        role="img"
        aria-label={`Evidence distribution: ${data.map((s) => `${s.label} ${s.value}`).join(', ')}`}
      >
        <circle cx="80" cy="80" r={R} fill="none" stroke="#f4f4f5" strokeWidth={22} />
        {segments.map((s, i) => {
          const on = active === i;
          const dim = active !== null && !on;
          return (
            <circle
              key={s.label}
              cx="80"
              cy="80"
              r={R}
              fill="none"
              stroke={s.color}
              strokeWidth={on ? 28 : 22}
              strokeDasharray={`${Math.max(0, s.frac * C - 1.5)} ${C}`}
              strokeDashoffset={s.offset}
              transform="rotate(-90 80 80)"
              className="chart-slice"
              data-dim={dim ? 'true' : undefined}
              {...chartHitProps<SVGCircleElement>({
                label: `${s.label.replace(/_/g, ' ')}: ${s.value} of ${data.reduce((a, x) => a + x.value, 0)}, ${pct(
                  s.value,
                  total
                )}`,
                interactive: false,
                focusable: true,
                onEnter: () => setActive(i),
                onLeave: () => setActive((cur) => (cur === i ? null : cur)),
              })}
            >
              <title>{`${s.label.replace(/_/g, ' ')}: ${s.value}`}</title>
            </circle>
          );
        })}
        <text
          x="80"
          y="76"
          textAnchor="middle"
          className={activeSeg ? '' : 'fill-zinc-950'}
          fontSize={activeSeg ? 17 : 22}
          fontWeight={800}
          fontFamily="monospace"
          fill={activeSeg?.color}
        >
          {activeSeg ? activeSeg.value : data.reduce((a, s) => a + s.value, 0)}
        </text>
        <text x="80" y="94" textAnchor="middle" className="fill-zinc-500" fontSize="10" fontFamily="monospace">
          {activeSeg ? activeSeg.label.replace(/_/g, ' ').slice(0, 14).toUpperCase() : totalLabel.toUpperCase().slice(0, 14)}
        </text>
      </svg>
      <ul className="w-full flex-1 space-y-1.5 text-xs">
        {segments.map((s, i) => {
          const on = active === i;
          return (
            <li
              key={s.label}
              className="chart-row -mx-2 flex items-center gap-2 rounded-r px-2 py-1"
              data-active={on ? 'true' : undefined}
              data-dim={active !== null && !on ? 'true' : undefined}
              {...chartHitProps<HTMLLIElement>({
                label: `${s.label.replace(/_/g, ' ')}: ${s.value}, ${pct(s.value, total)} of the total`,
                interactive: false,
                focusable: true,
                onEnter: () => setActive(i),
                onLeave: () => setActive((cur) => (cur === i ? null : cur)),
              })}
            >
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full ring-1 ring-inset ring-black/10"
                style={{ backgroundColor: s.color }}
                aria-hidden="true"
              />
              <span className="flex-1 truncate text-zinc-700">{s.label.replace(/_/g, ' ')}</span>
              <span className="num font-bold text-zinc-950">{s.value}</span>
              <span className="num w-10 text-right text-zinc-500">
                {pct(s.value, total)}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}