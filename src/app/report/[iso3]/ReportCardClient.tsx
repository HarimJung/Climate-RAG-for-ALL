'use client';

import { iso3ToFlag } from '@/lib/iso3ToFlag';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Flame, Zap, TrendingUp, Globe, Shield, ArrowUpRight } from 'lucide-react';
import type { ReportCardData } from './page';

// ── Constants ────────────────────────────────────────────────────────────────

const CLASS_GRADIENT: Record<string, { from: string; to: string }> = {
  Changer: { from: '#10B981', to: '#0D9488' },
  Starter: { from: '#FBBF24', to: '#F97316' },
  Talker:  { from: '#EF4444', to: '#E11D48' },
};
const DEFAULT_GRAD = { from: '#3B82F6', to: '#2563EB' };

const CLASS_PILL: Record<string, { bg: string; text: string }> = {
  Changer: { bg: '#ECFDF5', text: '#047857' },
  Starter: { bg: '#FFFBEB', text: '#B45309' },
  Talker:  { bg: '#FEF2F2', text: '#B91C1C' },
};

const CLASS_EXPLAIN: Record<string, string> = {
  Changer: 'CO2 declining AND renewables rising',
  Starter: 'One condition met (CO2 or renewables)',
  Talker: 'Neither CO2 declining nor renewables rising',
};

const GRADE_LABEL: Record<string, string> = {
  'A+': 'Excellent', A: 'Very Good', 'B+': 'Good', B: 'Above Average',
  'C+': 'Fair', C: 'Below Average', D: 'Poor', F: 'Very Poor',
};

const DOMAINS = [
  { key: 'emissions', label: 'Emissions', weight: '30%', color: '#E5484D', Icon: Flame },
  { key: 'energy', label: 'Energy', weight: '25%', color: '#0066FF', Icon: Zap },
  { key: 'economy', label: 'Economy', weight: '15%', color: '#8B5CF6', Icon: TrendingUp },
  { key: 'responsibility', label: 'Responsibility', weight: '15%', color: '#F59E0B', Icon: Globe },
  { key: 'resilience', label: 'Resilience', weight: '15%', color: '#00A67E', Icon: Shield },
] as const;

function sc(s: number | null) {
  if (s === null) return '#94A3B8';
  if (s >= 70) return '#10B981';
  if (s >= 40) return '#F59E0B';
  return '#EF4444';
}

function perf(s: number | null) {
  if (s === null) return 'No data';
  if (s >= 70) return 'Top tier';
  if (s >= 50) return 'Moderate';
  if (s >= 40) return 'Below avg';
  return 'Critical';
}

function insight(s: number | null) {
  if (s === null) return 'Insufficient data';
  if (s >= 80) return 'World-class performance';
  if (s >= 70) return 'Above global average';
  if (s >= 50) return 'Room for improvement';
  if (s >= 40) return 'Below average';
  return 'Needs urgent attention';
}

function nextGrade(score: number) {
  const t = [
    { min: 25, g: 'D' }, { min: 40, g: 'C' }, { min: 50, g: 'C+' },
    { min: 60, g: 'B' }, { min: 70, g: 'B+' }, { min: 80, g: 'A' }, { min: 90, g: 'A+' },
  ];
  const n = t.find(x => x.min > score);
  return n ? { grade: n.g, pts: Math.ceil(n.min - score) } : null;
}

// ── Gauge ────────────────────────────────────────────────────────────────────

function GaugeArc({ score, grade }: { score: number; grade: string }) {
  const r = 54, circ = 2 * Math.PI * r;
  const arc = circ * (240 / 360), gap = circ - arc;
  const target = arc * (1 - score / 100);
  return (
    <div className="relative mx-auto h-[148px] w-[148px]">
      <svg viewBox="0 0 130 130" className="h-full w-full" style={{ transform: 'rotate(150deg)' }}>
        <circle cx="65" cy="65" r={r} fill="none" stroke="rgba(255,255,255,0.2)"
          strokeWidth="11" strokeDasharray={`${arc} ${gap}`} strokeLinecap="round" />
        <motion.circle cx="65" cy="65" r={r} fill="none" stroke="white" strokeWidth="11" strokeLinecap="round"
          strokeDasharray={`${arc} ${gap}`}
          initial={{ strokeDashoffset: arc }}
          whileInView={{ strokeDashoffset: target }}
          viewport={{ once: true }}
          transition={{ duration: 1.5, ease: 'easeOut' }} />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center pb-3">
        <span className="text-5xl font-black leading-none text-white">{grade}</span>
      </div>
    </div>
  );
}

// ── useCountUp ───────────────────────────────────────────────────────────────

function useCountUp(end: number) {
  const [v, setV] = useState(0);
  useEffect(() => {
    let cur = 0;
    const step = end / 75;
    const t = setInterval(() => { cur += step; if (cur >= end) { setV(end); clearInterval(t); } else setV(cur); }, 16);
    return () => clearInterval(t);
  }, [end]);
  return v;
}

// ── Card animation wrapper ───────────────────────────────────────────────────

const card = (i: number) => ({
  initial: { opacity: 0, y: 16 } as const,
  whileInView: { opacity: 1, y: 0 } as const,
  viewport: { once: true } as const,
  transition: { delay: i * 0.06, duration: 0.45 },
});

// ── Main Component ───────────────────────────────────────────────────────────

export function ReportCardClient({ data }: { data: ReportCardData }) {
  const anim = useCountUp(data.total);
  const grad = data.climateClass ? CLASS_GRADIENT[data.climateClass] : DEFAULT_GRAD;
  const pill = data.climateClass ? CLASS_PILL[data.climateClass] : null;
  const ng = nextGrade(data.total);
  const gs = (k: string) => (data as unknown as Record<string, number | null>)[k] as number | null;

  const scored = DOMAINS.map(d => ({ ...d, s: gs(d.key) })).filter(d => d.s !== null);
  const best = scored.length > 0 ? scored.reduce((a, b) => a.s! > b.s! ? a : b) : null;
  const worst = scored.length > 0 ? scored.reduce((a, b) => a.s! < b.s! ? a : b) : null;

  return (
    <div className="mx-auto max-w-[1200px] px-6 pb-20">

      {/* ── Header ────────────────────────────────────────────────────── */}
      <section className="pb-6 pt-6">
        <div className="flex items-center gap-3">
          <span className="text-5xl leading-none">{iso3ToFlag(data.iso3)}</span>
          <h1 className="text-3xl font-bold text-slate-900">{data.name}</h1>
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">{data.region}</span>
          <span className="rounded-full bg-slate-100 px-3 py-1 font-mono text-xs text-slate-600">{data.iso3}</span>
          {data.climateClass && pill && (
            <span className="rounded-full px-3 py-1 text-xs font-medium" style={{ backgroundColor: pill.bg, color: pill.text }}>
              {data.climateClass}
            </span>
          )}
        </div>
      </section>

      {/* ── Bento Grid ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">

        {/* Hero Score Card — gradient, spans 2 rows */}
        <motion.div {...card(0)}
          className="flex flex-col items-center justify-center rounded-2xl p-8 text-center text-white sm:col-span-2 lg:col-span-1 lg:row-span-2"
          style={{ background: `linear-gradient(to bottom right, ${grad.from}, ${grad.to})` }}>
          <GaugeArc score={data.total} grade={data.grade} />
          <p className="mt-3 text-5xl font-bold leading-none" style={{ fontVariantNumeric: 'tabular-nums' }}>
            {anim.toFixed(1)}
          </p>
          <p className="mt-1 text-sm text-white/70">Based on 67 indicators</p>
          {ng && <p className="text-sm text-white/70">{ng.pts} pts to reach {ng.grade}</p>}
          <span className="mt-3 rounded-full bg-white/20 px-4 py-1.5 text-sm font-medium backdrop-blur-sm">
            {data.grade} — {GRADE_LABEL[data.grade] ?? 'N/A'}
          </span>
          <Link href="/methodology" className="mt-4 inline-flex items-center gap-1 text-sm text-white/80 hover:text-white">
            View Methodology
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </motion.div>

        {/* 4 Domain cards */}
        {DOMAINS.slice(0, 4).map((d, i) => {
          const s = gs(d.key);
          const c = sc(s);
          return (
            <motion.div key={d.key} {...card(i + 1)}>
              <Link href={`/country/${data.iso3}`}
                className="group flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-6 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg">
                <div className="mb-2 flex items-start justify-between">
                  <d.Icon className="h-5 w-5" style={{ color: c }} />
                  <div className="flex items-center gap-2">
                    <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-400">{d.weight}</span>
                    <ArrowUpRight className="h-4 w-4 text-slate-300 transition-colors group-hover:text-slate-500" />
                  </div>
                </div>
                <p className="text-sm font-medium text-slate-500">{d.label}</p>
                <p className="mt-1 font-mono text-4xl font-bold leading-tight" style={{ color: c, fontVariantNumeric: 'tabular-nums' }}>
                  {s !== null ? s.toFixed(1) : '--'}
                </p>
                <p className="mt-1 text-sm text-slate-400">{insight(s)}</p>
                {s !== null && (
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                    <motion.div className="h-full rounded-full" style={{ backgroundColor: d.color }}
                      initial={{ width: 0 }} whileInView={{ width: `${s}%` }}
                      viewport={{ once: true }} transition={{ duration: 0.8, ease: 'easeOut', delay: 0.3 }} />
                  </div>
                )}
                <span className="mt-2 inline-block self-start rounded-full px-2.5 py-0.5 text-[11px] font-medium"
                  style={{ backgroundColor: `${c}15`, color: c }}>
                  {perf(s)}
                </span>
              </Link>
            </motion.div>
          );
        })}

        {/* Resilience — normal card in grid */}
        {(() => {
          const d = DOMAINS[4], s = gs(d.key), c = sc(s);
          return (
            <motion.div {...card(5)}>
              <Link href={`/country/${data.iso3}`}
                className="group flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-6 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg">
                <div className="mb-2 flex items-start justify-between">
                  <d.Icon className="h-5 w-5" style={{ color: c }} />
                  <div className="flex items-center gap-2">
                    <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-400">{d.weight}</span>
                    <ArrowUpRight className="h-4 w-4 text-slate-300 transition-colors group-hover:text-slate-500" />
                  </div>
                </div>
                <p className="text-sm font-medium text-slate-500">{d.label}</p>
                <p className="mt-1 font-mono text-4xl font-bold leading-tight" style={{ color: c, fontVariantNumeric: 'tabular-nums' }}>
                  {s !== null ? s.toFixed(1) : '--'}
                </p>
                <p className="mt-1 text-sm text-slate-400">{insight(s)}</p>
                {s !== null && (
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                    <motion.div className="h-full rounded-full" style={{ backgroundColor: d.color }}
                      initial={{ width: 0 }} whileInView={{ width: `${s}%` }}
                      viewport={{ once: true }} transition={{ duration: 0.8, ease: 'easeOut', delay: 0.3 }} />
                  </div>
                )}
                <span className="mt-2 inline-block self-start rounded-full px-2.5 py-0.5 text-[11px] font-medium"
                  style={{ backgroundColor: `${c}15`, color: c }}>
                  {perf(s)}
                </span>
              </Link>
            </motion.div>
          );
        })()}

        {/* What This Means */}
        <motion.div {...card(6)} className="rounded-2xl border border-slate-200 bg-white p-6 transition-all duration-200 hover:shadow-lg">
          <h2 className="text-base font-semibold text-slate-900">What This Means</h2>
          <div className="mt-4 space-y-4">
            {best && (
              <div className="flex gap-3">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100">
                  <svg className="h-3.5 w-3.5 text-emerald-600" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                  </svg>
                </div>
                <p className="text-sm text-slate-600">
                  <span className="font-semibold">{best.label}</span> is a strength at {best.s!.toFixed(1)}
                </p>
              </div>
            )}
            {worst && (
              <div className="flex gap-3">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red-100">
                  <svg className="h-3.5 w-3.5 text-red-600" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                  </svg>
                </div>
                <p className="text-sm text-slate-600">
                  <span className="font-semibold">{worst.label}</span> needs attention at {worst.s!.toFixed(1)}
                </p>
              </div>
            )}
            {data.climateClass && (
              <div className="flex gap-3">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100">
                  <svg className="h-3.5 w-3.5 text-blue-600" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
                  </svg>
                </div>
                <p className="text-sm text-slate-600">
                  <span className="font-semibold">{data.climateClass}:</span> {CLASS_EXPLAIN[data.climateClass]}
                </p>
              </div>
            )}
          </div>
          <Link href={`/country/${data.iso3}`}
            className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-[--accent-primary] hover:underline">
            Full Country Profile <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </motion.div>

        {/* Explore More */}
        <motion.div {...card(7)} className="rounded-2xl border border-slate-200 bg-white p-6 transition-all duration-200 hover:shadow-lg">
          <h2 className="text-base font-semibold text-slate-900">Explore More</h2>
          <div className="mt-4 divide-y divide-slate-100">
            {[
              { icon: iso3ToFlag(data.iso3), title: `${data.name} Deep Dive`, sub: '9 sections, 44+ indicators', href: `/country/${data.iso3}` },
              { icon: '\uD83D\uDCCA', title: 'Methodology', sub: 'How we calculate scores', href: '/methodology' },
              { icon: '\uD83C\uDF0D', title: 'All 250 Countries', sub: 'Browse and compare', href: '/explore' },
            ].map(row => (
              <Link key={row.href} href={row.href}
                className="-mx-2 flex items-center gap-3 rounded-lg px-2 py-3 transition-colors hover:bg-slate-50">
                <span className="text-xl">{row.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900">{row.title}</p>
                  <p className="text-xs text-slate-400">{row.sub}</p>
                </div>
                <ArrowUpRight className="h-4 w-4 shrink-0 text-slate-300" />
              </Link>
            ))}
          </div>
        </motion.div>

      </div>

      {/* ── Back link ─────────────────────────────────────────────────── */}
      <div className="py-10 text-center">
        <Link href="/report" className="inline-flex items-center gap-1 text-sm text-slate-400 transition-colors hover:text-slate-600">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
          </svg>
          Back to All Report Cards
        </Link>
      </div>
    </div>
  );
}
