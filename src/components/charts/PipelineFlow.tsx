import React from 'react';
import { ArrowRight } from 'lucide-react';

const STEPS: { title: string; desc: string }[] = [
  {
    title: 'Ingest',
    desc: 'Poll SEC EDGAR submissions + company IR feeds under fair-access rate limits.',
  },
  {
    title: 'SSRF check',
    desc: 'Allow-list + DNS validation on every fetched URL before any network call.',
  },
  {
    title: 'Zod validation',
    desc: 'Schema-guard amounts, dates, counterparties and evidence levels at the boundary.',
  },
  {
    title: 'DB trigger',
    desc: 'Candidates land quarantined in the discovery queue — never auto-published.',
  },
  {
    title: 'Publish',
    desc: 'Human editorial review promotes verified items to the public ledger.',
  },
  {
    title: 'Audit',
    desc: 'Corrections log + dispute tracking stay public; superseded terms preserved.',
  },
];

/**
 * Six-step publication pipeline flowchart: Ingest -> SSRF check -> Zod ->
 * DB trigger -> Publish -> Audit. Static, SSR-safe, no client JS.
 */
export function PipelineFlow() {
  return (
    <div
      className="flex flex-col gap-2 md:flex-row md:items-stretch"
      role="img"
      aria-label="Publication pipeline: Ingest, SSRF check, Zod validation, DB trigger quarantine, human publish, public audit."
    >
      {STEPS.map((step, i) => (
        <React.Fragment key={step.title}>
          <div className="panel-sunken flex-1 space-y-1.5 p-4">
            <div className="flex items-center gap-2">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-zinc-950 font-mono text-[10px] font-bold text-emerald-300">
                {i + 1}
              </span>
              <span className="panel-title">
                {step.title}
              </span>
            </div>
            <p className="text-[11px] leading-relaxed text-zinc-600">{step.desc}</p>
          </div>
          {i < STEPS.length - 1 && (
            <div className="flex items-center justify-center md:px-0.5" aria-hidden="true">
              <ArrowRight className="h-4 w-4 w-4 shrink-0 rotate-90 text-zinc-500 md:rotate-0" />
            </div>
          )}
        </React.Fragment>
      ))}
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
 * Local fallback evidence-distribution donut (used when the shared MiniDonut
 * component is unavailable). Renders whatever slices it is given — computed
 * live from the ledger, never hand-drawn.
 */
export function EvidenceDonut({ data, totalLabel }: EvidenceDonutProps) {
  const total = Math.max(
    1,
    data.reduce((a, s) => a + s.value, 0),
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

  return (
    <div className="flex flex-col sm:flex-row items-center gap-5">
      <svg
        width="160"
        height="160"
        viewBox="0 0 160 160"
        role="img"
        aria-label={`Evidence distribution: ${data.map((s) => `${s.label} ${s.value}`).join(', ')}`}
      >
        <circle cx="80" cy="80" r={R} fill="none" stroke="#f4f4f5" strokeWidth="22" />
        {segments.map((s) => (
          <circle
            key={s.label}
            cx="80"
            cy="80"
            r={R}
            fill="none"
            stroke={s.color}
            strokeWidth="22"
            strokeDasharray={`${Math.max(0, s.frac * C - 1.5)} ${C}`}
            strokeDashoffset={s.offset}
            transform="rotate(-90 80 80)"
          />
        ))}
        <text x="80" y="76" textAnchor="middle" className="fill-zinc-950" fontSize="22" fontWeight="800" fontFamily="monospace">
          {data.reduce((a, s) => a + s.value, 0)}
        </text>
        <text x="80" y="94" textAnchor="middle" className="fill-zinc-500" fontSize="10" fontFamily="monospace">
          {totalLabel.toUpperCase().slice(0, 14)}
        </text>
      </svg>
      <ul className="w-full flex-1 space-y-1.5 text-xs">
        {segments.map((s) => (
          <li key={s.label} className="flex items-center gap-2">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full ring-1 ring-inset ring-black/10"
              style={{ backgroundColor: s.color }}
              aria-hidden="true"
            />
            <span className="flex-1 truncate text-zinc-700">{s.label.replace(/_/g, ' ')}</span>
            <span className="num font-bold text-zinc-950">{s.value}</span>
            <span className="num w-10 text-right text-zinc-500">
              {Math.round((s.value / total) * 100)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
