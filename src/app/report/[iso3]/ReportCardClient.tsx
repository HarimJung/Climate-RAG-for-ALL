'use client';

import { iso3ToFlag } from '@/lib/iso3ToFlag';
import Link from 'next/link';
import type { ReportCardData } from './page';

// ── Grade helpers ─────────────────────────────────────────────────────────────

const GRADE_COLOR: Record<string, string> = {
  'A+': '#00A67E', 'A': '#00A67E',
  'B+': '#0066FF', 'B': '#0066FF',
  'C+': '#F59E0B', 'C': '#F59E0B',
  'D': '#E5484D',  'F': '#E5484D',
};

const GRADE_BG: Record<string, string> = {
  'A+': '#ECFDF5', 'A': '#ECFDF5',
  'B+': '#EFF6FF', 'B': '#EFF6FF',
  'C+': '#FFFBEB', 'C': '#FFFBEB',
  'D': '#FFF1F2',  'F': '#FFF1F2',
};

const DOMAIN_META = [
  { key: 'emissions',      label: 'Emissions',       weight: '30%', color: '#E5484D', description: 'CO₂/capita, CO₂/GDP intensity, decoupling trend' },
  { key: 'energy',         label: 'Energy',          weight: '25%', color: '#0066FF', description: 'Renewable electricity share, grid carbon intensity' },
  { key: 'economy',        label: 'Economy',         weight: '15%', color: '#8B5CF6', description: 'GDP per capita, climate economic efficiency' },
  { key: 'responsibility', label: 'Responsibility',  weight: '15%', color: '#F59E0B', description: 'Share of global cumulative CO₂ emissions' },
  { key: 'resilience',     label: 'Resilience',      weight: '15%', color: '#00A67E', description: 'ND-GAIN readiness and vulnerability' },
] as const;

// ── Pentagon (Radar) Chart ────────────────────────────────────────────────────

function PentagonChart({ data }: { data: ReportCardData }) {
  const cx = 150, cy = 150, r = 100;
  const n = 5;
  const step = (2 * Math.PI) / n;
  const start = -Math.PI / 2; // top

  const axes = DOMAIN_META.map((d, i) => {
    const angle = start + i * step;
    return {
      ...d,
      cos: Math.cos(angle),
      sin: Math.sin(angle),
      labelX: cx + r * 1.42 * Math.cos(angle),
      labelY: cy + r * 1.42 * Math.sin(angle),
    };
  });

  // Outer pentagon
  const outerPts = axes.map(a => `${cx + r * a.cos},${cy + r * a.sin}`).join(' ');

  // Grid rings at 25%, 50%, 75%
  const gridRings = [0.25, 0.5, 0.75].map(frac =>
    axes.map(a => `${cx + r * frac * a.cos},${cy + r * frac * a.sin}`).join(' ')
  );

  // Score polygon
  const scoreValues: Record<string, number> = {
    emissions:      data.emissions      ?? 0,
    energy:         data.energy         ?? 0,
    economy:        data.economy        ?? 0,
    responsibility: data.responsibility ?? 0,
    resilience:     data.resilience     ?? 0,
  };
  const scorePts = DOMAIN_META.map((d, i) => {
    const frac = scoreValues[d.key] / 100;
    return `${cx + r * frac * axes[i].cos},${cy + r * frac * axes[i].sin}`;
  }).join(' ');

  return (
    <svg viewBox="0 0 300 300" className="w-full max-w-xs mx-auto" aria-label="Radar chart of domain scores">
      {/* Grid rings */}
      {gridRings.map((pts, i) => (
        <polygon key={i} points={pts} fill="none" stroke="#E5E7EB" strokeWidth="1" />
      ))}
      {/* Axis lines */}
      {axes.map((a, i) => (
        <line key={i} x1={cx} y1={cy} x2={cx + r * a.cos} y2={cy + r * a.sin} stroke="#E5E7EB" strokeWidth="1" />
      ))}
      {/* Outer pentagon */}
      <polygon points={outerPts} fill="none" stroke="#D1D5DB" strokeWidth="1.5" />
      {/* Score area */}
      <polygon points={scorePts} fill="#0066FF" fillOpacity="0.15" stroke="#0066FF" strokeWidth="2" />
      {/* Score dots */}
      {DOMAIN_META.map((d, i) => {
        const frac = scoreValues[d.key] / 100;
        return (
          <circle
            key={i}
            cx={cx + r * frac * axes[i].cos}
            cy={cy + r * frac * axes[i].sin}
            r={4}
            fill={d.color}
            stroke="white"
            strokeWidth={1.5}
          />
        );
      })}
      {/* Domain labels */}
      {axes.map((a, i) => (
        <text
          key={i}
          x={a.labelX}
          y={a.labelY}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize="10"
          fontWeight="600"
          fill="#4A4A6A"
        >
          {DOMAIN_META[i].label}
        </text>
      ))}
    </svg>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export function ReportCardClient({ data }: { data: ReportCardData }) {
  const handlePrint = () => window.print();

  return (
    <div>
      {/* Header */}
      <div className="mb-8 flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <span className="text-5xl leading-none">{iso3ToFlag(data.iso3)}</span>
          <div>
            <h1 className="text-2xl font-bold text-[--text-primary] sm:text-3xl">{data.name}</h1>
            <p className="text-[--text-muted]">{data.region} · {data.iso3}</p>
          </div>
        </div>
        {/* Grade badge */}
        <div
          className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-xl font-black"
          style={{ backgroundColor: GRADE_BG[data.grade], color: GRADE_COLOR[data.grade] }}
        >
          {data.grade}
        </div>
      </div>

      {/* Score summary */}
      <div className="mb-8 rounded-2xl border border-[--border-card] bg-white p-6" style={{ boxShadow: 'var(--shadow-card)' }}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-[--text-muted]">Total Climate Score</p>
            <p className="text-4xl font-black text-[--text-primary]">{data.total.toFixed(1)}<span className="text-xl font-medium text-[--text-muted]">/100</span></p>
          </div>
          <button
            onClick={handlePrint}
            className="rounded-lg border border-[--border-card] px-4 py-2 text-sm font-medium text-[--text-secondary] transition-colors hover:border-[--accent-primary] hover:text-[--accent-primary]"
          >
            Print / Save PDF
          </button>
        </div>
        <div className="mt-4 h-3 w-full overflow-hidden rounded-full bg-gray-100">
          <div
            className="h-full rounded-full"
            style={{ width: `${data.total}%`, backgroundColor: GRADE_COLOR[data.grade] }}
          />
        </div>
        <p className="mt-2 text-xs text-[--text-muted]">Score ranges from 0 (worst) to 100 (best). Relative to all countries with available data.</p>
      </div>

      {/* Pentagon + Domain cards */}
      <div className="mb-8 grid gap-6 md:grid-cols-2">
        {/* Pentagon */}
        <div className="flex items-center justify-center rounded-2xl border border-[--border-card] bg-white p-6" style={{ boxShadow: 'var(--shadow-card)' }}>
          <PentagonChart data={data} />
        </div>

        {/* Domain score cards */}
        <div className="flex flex-col gap-3">
          {DOMAIN_META.map(d => {
            const score = (data as unknown as Record<string, number | null>)[d.key] as number | null;
            return (
              <div
                key={d.key}
                className="rounded-xl border border-[--border-card] bg-white p-4"
                style={{ boxShadow: 'var(--shadow-card)' }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full" style={{ backgroundColor: d.color }} />
                    <span className="text-sm font-semibold text-[--text-primary]">{d.label}</span>
                    <span className="text-xs text-[--text-muted]">{d.weight}</span>
                  </div>
                  <span className="text-lg font-bold text-[--text-primary]">
                    {score !== null ? score.toFixed(1) : '—'}
                  </span>
                </div>
                {score !== null && (
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                    <div className="h-full rounded-full" style={{ width: `${score}%`, backgroundColor: d.color }} />
                  </div>
                )}
                <p className="mt-1 text-xs text-[--text-muted]">{d.description}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer links */}
      <div className="flex flex-wrap items-center gap-4 text-sm text-[--text-muted]">
        <Link href={`/country/${data.iso3}`} className="hover:text-[--accent-primary]">
          View full country profile →
        </Link>
        <Link href="/methodology" className="hover:text-[--accent-primary]">
          Methodology
        </Link>
        <Link href="/report" className="hover:text-[--accent-primary]">
          ← All countries
        </Link>
      </div>
    </div>
  );
}
