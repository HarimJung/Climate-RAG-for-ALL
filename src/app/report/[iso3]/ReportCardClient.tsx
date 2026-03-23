'use client';

import { iso3ToFlag } from '@/lib/iso3ToFlag';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ScrollFadeIn } from '@/components/climate/scroll-fade-in';
import type { ReportCardData } from './page';

// ── Grade / class color maps ─────────────────────────────────────────────────

const GRADE_COLOR: Record<string, string> = {
  'A+': '#00A67E', A: '#00A67E', 'B+': '#0066FF', B: '#0066FF',
  'C+': '#F59E0B', C: '#F59E0B', D: '#E5484D', F: '#E5484D',
};

const GRADE_BG: Record<string, string> = {
  'A+': '#ECFDF5', A: '#ECFDF5', 'B+': '#EFF6FF', B: '#EFF6FF',
  'C+': '#FFFBEB', C: '#FFFBEB', D: '#FFF1F2', F: '#FFF1F2',
};

const CLASS_STYLE: Record<string, { bg: string; text: string }> = {
  Changer: { bg: '#ECFDF5', text: '#00A67E' },
  Starter: { bg: '#FFFBEB', text: '#F59E0B' },
  Talker:  { bg: '#FEF2F2', text: '#E5484D' },
};

// ── Domain metadata ──────────────────────────────────────────────────────────

const DOMAIN_META = [
  { key: 'emissions',      label: 'Emissions',      weight: '30%', color: '#E5484D', desc: 'CO2/capita, CO2/GDP intensity, decoupling trend' },
  { key: 'energy',         label: 'Energy',          weight: '25%', color: '#0066FF', desc: 'Renewable electricity share, grid carbon intensity' },
  { key: 'economy',        label: 'Economy',         weight: '15%', color: '#8B5CF6', desc: 'GDP per capita, climate economic efficiency' },
  { key: 'responsibility', label: 'Responsibility',  weight: '15%', color: '#F59E0B', desc: 'Share of global cumulative CO2 emissions' },
  { key: 'resilience',     label: 'Resilience',      weight: '15%', color: '#00A67E', desc: 'ND-GAIN readiness and vulnerability' },
] as const;

function scoreColor(score: number | null): string {
  if (score === null) return '#8888A0';
  if (score >= 70) return '#00A67E';
  if (score >= 40) return '#F59E0B';
  return '#E5484D';
}

function insight(score: number | null): string {
  if (score === null) return 'Insufficient data available.';
  if (score >= 80) return 'Excellent. Top tier globally.';
  if (score >= 70) return 'Strong performance. Above global average.';
  if (score >= 50) return 'Moderate. Room for improvement.';
  if (score >= 40) return 'Below average. Action needed.';
  return 'Critical. Urgent improvement required.';
}

// ── Section dot label (matching homepage) ────────────────────────────────────

function SectionDot({ label }: { label: string }) {
  return (
    <p className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-[--text-muted]">
      <span className="inline-block h-2 w-2 rounded-full bg-[--accent-primary]" />
      {label}
    </p>
  );
}

// ── CountUp hook ─────────────────────────────────────────────────────────────

function useCountUp(end: number, duration = 1200) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = end / (duration / 16);
    const t = setInterval(() => {
      start += step;
      if (start >= end) { setCount(end); clearInterval(t); }
      else setCount(start);
    }, 16);
    return () => clearInterval(t);
  }, [end, duration]);
  return count;
}

// ── Radar (Pentagon) chart ───────────────────────────────────────────────────

function PentagonChart({ data }: { data: ReportCardData }) {
  const cx = 150, cy = 150, radius = 100;
  const step = (2 * Math.PI) / 5;
  const start = -Math.PI / 2;

  const axes = DOMAIN_META.map((d, i) => {
    const angle = start + i * step;
    return { ...d, cos: Math.cos(angle), sin: Math.sin(angle),
      lx: cx + radius * 1.42 * Math.cos(angle), ly: cy + radius * 1.42 * Math.sin(angle) };
  });

  const scores: Record<string, number> = {
    emissions: data.emissions ?? 0, energy: data.energy ?? 0,
    economy: data.economy ?? 0, responsibility: data.responsibility ?? 0, resilience: data.resilience ?? 0,
  };

  const outerPts = axes.map(a => `${cx + radius * a.cos},${cy + radius * a.sin}`).join(' ');
  const gridRings = [0.25, 0.5, 0.75].map(f => axes.map(a => `${cx + radius * f * a.cos},${cy + radius * f * a.sin}`).join(' '));
  const scorePts = DOMAIN_META.map((d, i) => {
    const f = scores[d.key] / 100;
    return `${cx + radius * f * axes[i].cos},${cy + radius * f * axes[i].sin}`;
  }).join(' ');

  return (
    <svg viewBox="0 0 300 300" className="mx-auto w-full max-w-sm" aria-label="Radar chart">
      <defs>
        <radialGradient id="rg-bg" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor="#f8fafc" /><stop offset="100%" stopColor="#f1f5f9" /></radialGradient>
        <radialGradient id="rg-fill" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor="#0066FF" stopOpacity="0.25" /><stop offset="100%" stopColor="#0066FF" stopOpacity="0.05" /></radialGradient>
      </defs>
      <rect width="300" height="300" fill="url(#rg-bg)" rx="16" />
      {gridRings.map((pts, i) => <polygon key={i} points={pts} fill="none" stroke="#E5E7EB" strokeWidth="1" strokeDasharray="4 4" />)}
      {axes.map((a, i) => <line key={i} x1={cx} y1={cy} x2={cx + radius * a.cos} y2={cy + radius * a.sin} stroke="#E5E7EB" strokeWidth="1" />)}
      <polygon points={outerPts} fill="none" stroke="#D1D5DB" strokeWidth="1.5" />
      <polygon points={scorePts} fill="url(#rg-fill)" stroke="#0066FF" strokeWidth="2.5" />
      {DOMAIN_META.map((d, i) => {
        const f = scores[d.key] / 100;
        const dx = cx + radius * f * axes[i].cos, dy = cy + radius * f * axes[i].sin;
        return (<g key={i}><circle cx={dx} cy={dy} r={10} fill={d.color} opacity="0.2" /><circle cx={dx} cy={dy} r={5} fill={d.color} stroke="white" strokeWidth={2} /></g>);
      })}
      {axes.map((a, i) => (
        <text key={i} textAnchor="middle" dominantBaseline="middle">
          <tspan x={a.lx} dy="-6" fontSize="11" fontWeight="600" fill={DOMAIN_META[i].color}>{DOMAIN_META[i].label}</tspan>
          <tspan x={a.lx} dy="15" fontSize="10" fontWeight="700" fill={DOMAIN_META[i].color} fontFamily="monospace">{scores[DOMAIN_META[i].key].toFixed(1)}</tspan>
        </text>
      ))}
    </svg>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────

export function ReportCardClient({ data }: { data: ReportCardData }) {
  const handlePrint = () => window.print();
  const animScore = useCountUp(data.total);

  return (
    <div className="mx-auto max-w-[1200px] px-6 pb-20">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <ScrollFadeIn>
        <section className="py-16 text-center">
          <span className="text-6xl leading-none">{iso3ToFlag(data.iso3)}</span>
          <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-[--text-primary] sm:text-5xl">
            {data.name}
          </h1>
          <div className="mt-3 flex items-center justify-center gap-3">
            <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-[--text-secondary]">
              {data.region}
            </span>
            <span className="font-mono text-sm text-[--text-muted]">{data.iso3}</span>
            {data.climateClass && (
              <span className="rounded-full px-3 py-1 text-sm font-bold"
                style={{ backgroundColor: CLASS_STYLE[data.climateClass].bg, color: CLASS_STYLE[data.climateClass].text }}>
                {data.climateClass}
              </span>
            )}
          </div>

          {/* Grade badge */}
          <div className="mt-10 flex flex-col items-center gap-6">
            <div className="relative">
              <div className="absolute inset-0 rounded-full blur-2xl opacity-30" style={{ backgroundColor: GRADE_COLOR[data.grade], transform: 'scale(1.4)' }} />
              <div className="relative flex h-28 w-28 items-center justify-center rounded-full border-4 border-white text-5xl font-black shadow-xl"
                style={{ backgroundColor: GRADE_BG[data.grade], color: GRADE_COLOR[data.grade] }}>
                {data.grade}
              </div>
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-[--text-muted]">Total Climate Score</p>
              <p className="mt-1 font-mono text-6xl font-bold leading-none text-[--text-primary]">
                {animScore.toFixed(1)}
                <span className="text-2xl font-medium text-[--text-muted]">/100</span>
              </p>
            </div>
            <button onClick={handlePrint}
              className="rounded-xl border border-[--border-card] px-5 py-2.5 text-sm font-medium text-[--text-secondary] transition-colors hover:border-[--accent-primary] hover:text-[--accent-primary]">
              Print / Save PDF
            </button>
          </div>
        </section>
      </ScrollFadeIn>

      {/* ── Radar Chart ─────────────────────────────────────────────────── */}
      <ScrollFadeIn>
        <section className="py-8">
          <SectionDot label="Overview" />
          <div className="card-hover rounded-2xl border border-[--border-card] bg-white p-8 shadow-sm">
            <PentagonChart data={data} />
          </div>
        </section>
      </ScrollFadeIn>

      {/* ── 5 Domain Score Cards ────────────────────────────────────────── */}
      <section className="py-8">
        <ScrollFadeIn>
          <SectionDot label="Domain Scores" />
        </ScrollFadeIn>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {DOMAIN_META.map((d, i) => {
            const score = (data as unknown as Record<string, number | null>)[d.key] as number | null;
            return (
              <ScrollFadeIn key={d.key} delay={i * 0.08}>
                <div className="card-hover flex h-full flex-col rounded-2xl border border-[--border-card] bg-white p-6">
                  {/* Domain label */}
                  <div className="mb-3 flex items-center gap-2">
                    <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                    <span className="text-sm font-semibold text-[--text-primary]">{d.label}</span>
                    <span className="ml-auto rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-[--text-muted]">{d.weight}</span>
                  </div>

                  {/* Score */}
                  <p className="font-mono text-3xl font-bold" style={{ color: scoreColor(score) }}>
                    {score !== null ? score.toFixed(1) : '--'}
                  </p>

                  {/* Progress bar */}
                  {score !== null && (
                    <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full rounded-full transition-all duration-1000 ease-out" style={{ width: `${score}%`, backgroundColor: d.color }} />
                    </div>
                  )}

                  {/* Description */}
                  <p className="mt-3 text-xs leading-relaxed text-[--text-muted]">{d.desc}</p>

                  {/* Insight */}
                  <div className="mt-auto pt-3">
                    <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs font-medium leading-relaxed" style={{ color: scoreColor(score) }}>
                      {insight(score)}
                    </p>
                  </div>
                </div>
              </ScrollFadeIn>
            );
          })}
        </div>
      </section>

      {/* ── CTA Cards ───────────────────────────────────────────────────── */}
      <section className="py-16">
        <ScrollFadeIn>
          <SectionDot label="Next Steps" />
        </ScrollFadeIn>
        <div className="grid gap-6 sm:grid-cols-3">
          {[
            { icon: iso3ToFlag(data.iso3), title: `${data.name} Deep Dive`, body: 'Full data profile with 9 sections, 44+ indicators, and 23 years of trends.',
              href: `/country/${data.iso3}`, btn: 'View Full Profile', btnColor: '#10B981', bg: '#F0FDF4' },
            { icon: '📊', title: 'How We Score', body: '5 domains, 11 indicators, and min-max normalization across 250 countries.',
              href: '/methodology', btn: 'Read Methodology', btnColor: '#3B82F6', bg: '#F0F9FF' },
            { icon: '🌍', title: 'All 250 Countries', body: 'Browse, filter, and compare climate report cards for every country.',
              href: '/explore', btn: 'Explore Countries', btnColor: '#F59E0B', bg: '#FFF7ED' },
          ].map((c, i) => (
            <ScrollFadeIn key={c.href} delay={i * 0.1}>
              <div className="card-hover flex h-full flex-col rounded-2xl border border-[--border-card] p-7" style={{ backgroundColor: c.bg }}>
                <div className="mb-3 flex items-center gap-3">
                  <span className="text-4xl leading-none">{c.icon}</span>
                  <span className="text-lg font-bold text-[--text-primary]">{c.title}</span>
                </div>
                <p className="mb-6 flex-1 text-sm leading-relaxed text-[--text-secondary]">{c.body}</p>
                <Link href={c.href}
                  className="inline-flex items-center gap-2 self-start rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:opacity-90"
                  style={{ backgroundColor: c.btnColor }}>
                  {c.btn}
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                  </svg>
                </Link>
              </div>
            </ScrollFadeIn>
          ))}
        </div>
      </section>

      {/* ── Back link ───────────────────────────────────────────────────── */}
      <div className="text-center">
        <Link href="/report" className="inline-flex items-center gap-1 text-sm text-[--text-muted] transition-colors hover:text-[--accent-primary]">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
          </svg>
          Back to All Report Cards
        </Link>
      </div>
    </div>
  );
}
