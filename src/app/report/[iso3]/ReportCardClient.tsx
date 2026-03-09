'use client';

import { iso3ToFlag } from '@/lib/iso3ToFlag';
import Link from 'next/link';
import { useEffect, useState } from 'react';
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

const CLASS_STYLE: Record<string, { bg: string; text: string }> = {
  Changer: { bg: '#ECFDF5', text: '#00A67E' },
  Starter: { bg: '#FFFBEB', text: '#F59E0B' },
  Talker:  { bg: '#FEF2F2', text: '#E5484D' },
};

function getSoWhat(label: string, countryName: string, score: number | null): string {
  if (score === null) return `Insufficient data for ${label} assessment.`;
  if (score >= 70) return `${label} is a relative strength for ${countryName}. Scoring ${score.toFixed(1)}/100 puts them in the top tier among 250 countries.`;
  if (score >= 40) return `${label} shows moderate performance. ${countryName} scores ${score.toFixed(1)}/100 — room for improvement.`;
  return `${label} needs urgent attention. With ${score.toFixed(1)}/100, ${countryName} lags behind peers.`;
}

const DOMAIN_META = [
  { key: 'emissions',      label: 'Emissions',       weight: '30%', color: '#E5484D', description: 'CO₂/capita, CO₂/GDP intensity, decoupling trend' },
  { key: 'energy',         label: 'Energy',          weight: '25%', color: '#0066FF', description: 'Renewable electricity share, grid carbon intensity' },
  { key: 'economy',        label: 'Economy',         weight: '15%', color: '#8B5CF6', description: 'GDP per capita, climate economic efficiency' },
  { key: 'responsibility', label: 'Responsibility',  weight: '15%', color: '#F59E0B', description: 'Share of global cumulative CO₂ emissions' },
  { key: 'resilience',     label: 'Resilience',      weight: '15%', color: '#00A67E', description: 'ND-GAIN readiness and vulnerability' },
] as const;

// ── CountUp Hook ──────────────────────────────────────────────────────────────
function useCountUp(end: number, duration = 1500) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let start = 0;
    const increment = end / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(start);
      }
    }, 16);
    return () => clearInterval(timer);
  }, [end, duration]);
  return count;
}

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
    <svg viewBox="0 0 300 300" className="w-full max-w-md mx-auto" aria-label="Radar chart of domain scores">
      <defs>
        <radialGradient id="radar-bg" cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor="#f8fafc" />
          <stop offset="100%" stopColor="#f1f5f9" />
        </radialGradient>
        <radialGradient id="score-gradient" cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor="#0066FF" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#0066FF" stopOpacity="0.05" />
        </radialGradient>
      </defs>
      {/* Radial gradient background */}
      <rect width="300" height="300" fill="url(#radar-bg)" />
      {/* Grid rings — dashed */}
      {gridRings.map((pts, i) => (
        <polygon key={i} points={pts} fill="none" stroke="#E5E7EB" strokeWidth="1" strokeDasharray="4 4" />
      ))}
      {/* Axis lines */}
      {axes.map((a, i) => (
        <line key={i} x1={cx} y1={cy} x2={cx + r * a.cos} y2={cy + r * a.sin} stroke="#E5E7EB" strokeWidth="1" />
      ))}
      {/* Outer pentagon */}
      <polygon points={outerPts} fill="none" stroke="#D1D5DB" strokeWidth="1.5" />
      {/* Score area with gradient fill */}
      <polygon points={scorePts} fill="url(#score-gradient)" stroke="#0066FF" strokeWidth="2.5" />
      {/* Score dots with colored glow */}
      {DOMAIN_META.map((d, i) => {
        const frac = scoreValues[d.key] / 100;
        const dotX = cx + r * frac * axes[i].cos;
        const dotY = cy + r * frac * axes[i].sin;
        return (
          <g key={i}>
            {/* Glow effect */}
            <circle cx={dotX} cy={dotY} r={10} fill={d.color} opacity="0.2" />
            {/* Main dot */}
            <circle cx={dotX} cy={dotY} r={6} fill={d.color} stroke="white" strokeWidth={2.5} />
          </g>
        );
      })}
      {/* Domain labels with score */}
      {axes.map((a, i) => {
        const score = scoreValues[DOMAIN_META[i].key];
        return (
          <text key={i} textAnchor="middle" dominantBaseline="middle">
            <tspan x={a.labelX} dy="-6" fontSize="11" fontWeight="600" fill={DOMAIN_META[i].color}>
              {DOMAIN_META[i].label}
            </tspan>
            <tspan x={a.labelX} dy="16" fontSize="10" fontWeight="700" fill={DOMAIN_META[i].color}
              fontFamily="monospace">
              {score != null ? score.toFixed(1) : '—'}
            </tspan>
          </text>
        );
      })}
    </svg>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export function ReportCardClient({ data }: { data: ReportCardData }) {
  const handlePrint = () => window.print();
  const countUpValue = useCountUp(data.total);

  return (
    <div>
      {/* Header with Grade Badge (120px glow circle) */}
      <div className="mb-12 flex flex-col items-center gap-6">
        <div className="flex items-center gap-4">
          <span className="text-6xl leading-none">{iso3ToFlag(data.iso3)}</span>
          <div>
            <h1 className="text-3xl font-bold text-[--text-primary] sm:text-4xl">{data.name}</h1>
            <p className="text-lg text-[--text-muted]">{data.region} · {data.iso3}</p>
          </div>
        </div>

        {/* Grade badge 120px with glow + class pill */}
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            {/* Glow layers */}
            <div
              className="absolute inset-0 rounded-full blur-2xl opacity-40"
              style={{ backgroundColor: GRADE_COLOR[data.grade], transform: 'scale(1.3)' }}
            />
            <div
              className="absolute inset-0 rounded-full blur-xl opacity-30"
              style={{ backgroundColor: GRADE_COLOR[data.grade], transform: 'scale(1.15)' }}
            />
            {/* Main badge */}
            <div
              className="relative flex h-[120px] w-[120px] items-center justify-center rounded-full text-5xl font-black shadow-2xl"
              style={{ backgroundColor: GRADE_BG[data.grade], color: GRADE_COLOR[data.grade] }}
            >
              {data.grade}
            </div>
          </div>
          {/* Climate Class pill */}
          {data.climateClass && (
            <span
              className="rounded-full px-4 py-1.5 text-sm font-semibold"
              style={{
                backgroundColor: CLASS_STYLE[data.climateClass].bg,
                color: CLASS_STYLE[data.climateClass].text,
              }}
            >
              {data.climateClass}
            </span>
          )}
        </div>

        {/* Total score 72px mono with CountUp */}
        <div className="text-center">
          <p className="mb-2 text-sm font-medium uppercase tracking-wider text-[--text-muted]">Total Climate Score</p>
          <p className="font-mono text-[72px] font-bold leading-none text-[--text-primary]">
            {countUpValue.toFixed(1)}
            <span className="text-3xl font-medium text-[--text-muted]">/100</span>
          </p>
          <button
            onClick={handlePrint}
            className="mt-4 rounded-lg border border-[--border-card] px-5 py-2.5 text-sm font-medium text-[--text-secondary] transition-colors hover:border-[--accent-primary] hover:text-[--accent-primary]"
          >
            Print / Save PDF
          </button>
        </div>
      </div>

      {/* Radar Chart */}
      <div className="mb-10 flex items-center justify-center rounded-2xl border border-[--border-card] bg-white p-8" style={{ boxShadow: 'var(--shadow-card)' }}>
        <PentagonChart data={data} />
      </div>

      {/* 5 Domain Cards with Color + Progress Bar */}
      <div className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {DOMAIN_META.map(d => {
          const score = (data as unknown as Record<string, number | null>)[d.key] as number | null;
          return (
            <div
              key={d.key}
              className="rounded-xl border border-[--border-card] bg-white p-5"
              style={{ boxShadow: 'var(--shadow-card)' }}
            >
              {/* Domain header */}
              <div className="mb-3 flex items-center gap-2">
                <div className="h-4 w-4 rounded-full" style={{ backgroundColor: d.color }} />
                <span className="text-sm font-semibold text-[--text-primary]">{d.label}</span>
              </div>
              {/* Score */}
              <p className="mb-1 font-mono text-3xl font-bold" style={{ color: d.color }}>
                {score !== null ? score.toFixed(1) : '—'}
              </p>
              <p className="mb-3 text-xs text-[--text-muted]">{d.weight} weight</p>
              {/* Progress bar */}
              {score !== null && (
                <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="h-full rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${score}%`, backgroundColor: d.color }}
                  />
                </div>
              )}
              <p className="mt-2 text-xs leading-tight text-[--text-muted]">{d.description}</p>
              {/* So What? insight */}
              <div className="mt-3 border-t border-gray-100 pt-3">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-[--text-muted]">So What?</p>
                <p className="mt-1 text-xs leading-relaxed text-[--text-secondary]">
                  {getSoWhat(d.label, data.name, score)}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* CTA Cards */}
      <div className="mb-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {/* Full country profile */}
        <div className="group relative overflow-hidden rounded-2xl p-8 transition-transform hover:scale-[1.02]" style={{ backgroundColor: '#F0FDF4' }}>
          <div className="absolute right-0 top-0 h-32 w-32 rounded-full bg-green-400 opacity-10 blur-3xl" />
          <div className="relative">
            <div className="mb-4 flex items-center gap-3">
              <span className="text-5xl leading-none">{iso3ToFlag(data.iso3)}</span>
              <span className="text-xl font-bold text-[--text-primary]">{data.name}</span>
            </div>
            <p className="mb-6 text-base leading-relaxed text-[--text-secondary]">
              Explore the full data profile with 9 sections, 44+ indicators, and 23 years of trends.
            </p>
            <Link
              href={`/country/${data.iso3}`}
              className="inline-flex items-center gap-2 rounded-xl px-6 py-3 text-base font-semibold text-white shadow-lg transition-all hover:shadow-xl"
              style={{ backgroundColor: '#10B981' }}
            >
              View Full Country Profile
              <span className="transition-transform group-hover:translate-x-1">→</span>
            </Link>
          </div>
        </div>

        {/* Methodology */}
        <div className="group relative overflow-hidden rounded-2xl p-8 transition-transform hover:scale-[1.02]" style={{ backgroundColor: '#F0F9FF' }}>
          <div className="absolute right-0 top-0 h-32 w-32 rounded-full bg-blue-400 opacity-10 blur-3xl" />
          <div className="relative">
            <div className="mb-4 flex items-center gap-3">
              <span className="text-5xl">📊</span>
              <span className="text-xl font-bold text-[--text-primary]">How We Score</span>
            </div>
            <p className="mb-6 text-base leading-relaxed text-[--text-secondary]">
              Our methodology uses 5 domains, 11 indicators, and min-max normalization across 200+ countries.
            </p>
            <Link
              href="/methodology"
              className="inline-flex items-center gap-2 rounded-xl px-6 py-3 text-base font-semibold text-white shadow-lg transition-all hover:shadow-xl"
              style={{ backgroundColor: '#3B82F6' }}
            >
              Read Methodology
              <span className="transition-transform group-hover:translate-x-1">→</span>
            </Link>
          </div>
        </div>

        {/* Explore All Countries */}
        <div className="group relative overflow-hidden rounded-2xl p-8 transition-transform hover:scale-[1.02]" style={{ backgroundColor: '#FFF7ED' }}>
          <div className="absolute right-0 top-0 h-32 w-32 rounded-full bg-amber-400 opacity-10 blur-3xl" />
          <div className="relative">
            <div className="mb-4 flex items-center gap-3">
              <span className="text-5xl leading-none">🌍</span>
              <span className="text-xl font-bold text-[--text-primary]">250 Countries</span>
            </div>
            <p className="mb-6 text-base leading-relaxed text-[--text-secondary]">
              Browse, filter, and compare climate report cards for every country in the world.
            </p>
            <Link
              href="/explore"
              className="inline-flex items-center gap-2 rounded-xl px-6 py-3 text-base font-semibold text-white shadow-lg transition-all hover:shadow-xl"
              style={{ backgroundColor: '#F59E0B' }}
            >
              Explore All Countries
              <span className="transition-transform group-hover:translate-x-1">→</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Back link */}
      <div className="text-center">
        <Link href="/report" className="text-sm text-[--text-muted] hover:text-[--text-primary]">
          ← Back to All Report Cards
        </Link>
      </div>
    </div>
  );
}
