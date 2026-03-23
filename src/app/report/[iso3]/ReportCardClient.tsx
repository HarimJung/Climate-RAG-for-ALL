'use client';

import { iso3ToFlag } from '@/lib/iso3ToFlag';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ScrollFadeIn } from '@/components/climate/scroll-fade-in';
import { Flame, Zap, TrendingUp, Globe, Shield, ArrowUpRight } from 'lucide-react';
import type { ReportCardData } from './page';

// ── Constants ────────────────────────────────────────────────────────────────

const CLASS_GRADIENT: Record<string, { from: string; to: string }> = {
  Changer: { from: '#10B981', to: '#0D9488' },
  Starter: { from: '#FBBF24', to: '#F97316' },
  Talker:  { from: '#EF4444', to: '#E11D48' },
};
const DEFAULT_GRADIENT = { from: '#3B82F6', to: '#2563EB' };

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

const DOMAIN_META = [
  { key: 'emissions', label: 'Emissions', weight: '30%', color: '#E5484D', Icon: Flame, desc: 'CO2 per capita and decoupling' },
  { key: 'energy', label: 'Energy', weight: '25%', color: '#0066FF', Icon: Zap, desc: 'Renewable share and grid intensity' },
  { key: 'economy', label: 'Economy', weight: '15%', color: '#8B5CF6', Icon: TrendingUp, desc: 'GDP efficiency and growth' },
  { key: 'responsibility', label: 'Responsibility', weight: '15%', color: '#F59E0B', Icon: Globe, desc: 'Cumulative CO2 share' },
  { key: 'resilience', label: 'Resilience', weight: '15%', color: '#00A67E', Icon: Shield, desc: 'ND-GAIN readiness and vulnerability' },
] as const;

function sColor(s: number | null): string {
  if (s === null) return '#94A3B8';
  if (s >= 70) return '#10B981';
  if (s >= 40) return '#F59E0B';
  return '#EF4444';
}

function perfLabel(s: number | null): string {
  if (s === null) return 'No data';
  if (s >= 70) return 'Top tier';
  if (s >= 50) return 'Moderate';
  if (s >= 40) return 'Below avg';
  return 'Critical';
}

function insightLine(s: number | null): string {
  if (s === null) return 'Insufficient data';
  if (s >= 80) return 'World-class performance';
  if (s >= 70) return 'Above global average';
  if (s >= 50) return 'Room for improvement';
  if (s >= 40) return 'Below average performance';
  return 'Needs urgent attention';
}

function nextGradeInfo(score: number) {
  const t = [
    { min: 25, g: 'D' }, { min: 40, g: 'C' }, { min: 50, g: 'C+' },
    { min: 60, g: 'B' }, { min: 70, g: 'B+' }, { min: 80, g: 'A' }, { min: 90, g: 'A+' },
  ];
  const next = t.find(x => x.min > score);
  return next ? { grade: next.g, pts: Math.ceil(next.min - score) } : null;
}

// ── Gauge Arc (semi-circular, like Credify) ──────────────────────────────────

function GaugeArc({ score, grade }: { score: number; grade: string }) {
  const r = 54, circ = 2 * Math.PI * r;
  const arcLen = circ * (240 / 360);   // 240-degree arc
  const gapLen = circ - arcLen;         // 120-degree gap at bottom
  const target = arcLen * (1 - score / 100);

  return (
    <div className="relative mx-auto h-[160px] w-[160px]">
      <svg viewBox="0 0 130 130" className="h-full w-full" style={{ transform: 'rotate(150deg)' }}>
        <circle cx="65" cy="65" r={r} fill="none" stroke="rgba(255,255,255,0.2)"
          strokeWidth="12" strokeDasharray={`${arcLen} ${gapLen}`} strokeLinecap="round" />
        <motion.circle cx="65" cy="65" r={r} fill="none" stroke="white"
          strokeWidth="12" strokeLinecap="round"
          strokeDasharray={`${arcLen} ${gapLen}`}
          initial={{ strokeDashoffset: arcLen }}
          whileInView={{ strokeDashoffset: target }}
          viewport={{ once: true }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center pb-4">
        <span className="text-5xl font-black leading-none text-white">{grade}</span>
      </div>
    </div>
  );
}

// ── useCountUp ───────────────────────────────────────────────────────────────

function useCountUp(end: number, dur = 1200) {
  const [v, setV] = useState(0);
  useEffect(() => {
    let cur = 0;
    const step = end / (dur / 16);
    const t = setInterval(() => {
      cur += step;
      if (cur >= end) { setV(end); clearInterval(t); } else setV(cur);
    }, 16);
    return () => clearInterval(t);
  }, [end, dur]);
  return v;
}

// ── Main Component ───────────────────────────────────────────────────────────

export function ReportCardClient({ data }: { data: ReportCardData }) {
  const animScore = useCountUp(data.total);
  const grad = data.climateClass ? CLASS_GRADIENT[data.climateClass] : DEFAULT_GRADIENT;
  const pill = data.climateClass ? CLASS_PILL[data.climateClass] : null;
  const nextG = nextGradeInfo(data.total);
  const getScore = (key: string) => (data as unknown as Record<string, number | null>)[key] as number | null;

  const scored = DOMAIN_META.map(d => ({ ...d, score: getScore(d.key) })).filter(d => d.score !== null);
  const strongest = scored.length > 0 ? scored.reduce((a, b) => a.score! > b.score! ? a : b) : null;
  const weakest = scored.length > 0 ? scored.reduce((a, b) => a.score! < b.score! ? a : b) : null;

  return (
    <div className="mx-auto max-w-[1200px] px-6 pb-20">

      {/* ── Section 1: Header ─────────────────────────────────────────── */}
      <ScrollFadeIn>
        <section className="pb-10 pt-8">
          <div className="flex items-center gap-3">
            <span className="text-5xl leading-none">{iso3ToFlag(data.iso3)}</span>
            <h1 className="text-3xl font-bold text-slate-900">{data.name}</h1>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">{data.region}</span>
            <span className="rounded-full bg-slate-100 px-3 py-1 font-mono text-xs text-slate-600">{data.iso3}</span>
            {data.climateClass && pill && (
              <span className="rounded-full px-3 py-1 text-xs font-medium"
                style={{ backgroundColor: pill.bg, color: pill.text }}>
                {data.climateClass}
              </span>
            )}
          </div>
        </section>
      </ScrollFadeIn>

      {/* ── Section 2: Score Dashboard ────────────────────────────────── */}
      <section className="pb-16">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:grid-rows-[1fr_1fr]">

          {/* Hero Score Card — gradient, spans 2 rows */}
          <ScrollFadeIn>
            <div className="flex h-full flex-col items-center justify-center rounded-2xl p-8 text-center text-white lg:row-span-2"
              style={{ background: `linear-gradient(to bottom right, ${grad.from}, ${grad.to})` }}>
              <GaugeArc score={data.total} grade={data.grade} />
              <p className="mt-4 text-5xl font-bold leading-none" style={{ fontVariantNumeric: 'tabular-nums' }}>
                {animScore.toFixed(1)}
              </p>
              <p className="mt-1.5 text-sm text-white/70">Based on 67 indicators</p>
              {nextG && (
                <p className="text-sm text-white/70">{nextG.pts} pts to reach {nextG.grade}</p>
              )}
              <span className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-1.5 text-sm font-medium backdrop-blur-sm">
                {data.grade} — {GRADE_LABEL[data.grade] ?? 'N/A'}
              </span>
              <Link href="/methodology"
                className="mt-5 inline-flex items-center gap-1 text-sm text-white/80 transition-colors hover:text-white">
                View Methodology
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                </svg>
              </Link>
            </div>
          </ScrollFadeIn>

          {/* 4 Domain cards — 2x2 on right */}
          {DOMAIN_META.slice(0, 4).map((d, i) => {
            const s = getScore(d.key);
            const sc = sColor(s);
            return (
              <motion.div key={d.key}
                className="group rounded-2xl border border-slate-200 bg-white p-6 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.15 + i * 0.08, duration: 0.5 }}>
                <div className="mb-3 flex items-start justify-between">
                  <d.Icon className="h-5 w-5" style={{ color: sc }} />
                  <ArrowUpRight className="h-4 w-4 text-slate-300 transition-colors group-hover:text-slate-500" />
                </div>
                <p className="text-sm font-medium text-slate-500">{d.label}</p>
                <p className="mt-1 font-mono text-3xl font-bold" style={{ color: sc, fontVariantNumeric: 'tabular-nums' }}>
                  {s !== null ? s.toFixed(1) : '--'}
                </p>
                <p className="mt-1 text-sm text-slate-400">{insightLine(s)}</p>
                <span className="mt-3 inline-block rounded-full px-2.5 py-0.5 text-[11px] font-medium"
                  style={{ backgroundColor: `${sc}15`, color: sc }}>
                  {perfLabel(s)}
                </span>
              </motion.div>
            );
          })}
        </div>

        {/* Resilience — full-width horizontal card */}
        {(() => {
          const d = DOMAIN_META[4];
          const s = getScore(d.key);
          const sc = sColor(s);
          return (
            <ScrollFadeIn delay={0.3}>
              <div className="mt-4 flex flex-wrap items-center gap-6 rounded-2xl border border-slate-200 bg-white p-6 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg sm:flex-nowrap">
                <div className="flex shrink-0 items-center gap-3">
                  <d.Icon className="h-6 w-6" style={{ color: sc }} />
                  <div>
                    <p className="text-sm font-medium text-slate-500">{d.label}</p>
                    <p className="font-mono text-3xl font-bold" style={{ color: sc, fontVariantNumeric: 'tabular-nums' }}>
                      {s !== null ? s.toFixed(1) : '--'}
                    </p>
                  </div>
                </div>
                <div className="hidden flex-1 sm:block">
                  <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                    <motion.div className="h-full rounded-full" style={{ backgroundColor: d.color }}
                      initial={{ width: 0 }}
                      whileInView={{ width: `${s ?? 0}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 1, ease: 'easeOut' }} />
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-sm text-slate-400">{insightLine(s)}</p>
                  <span className="mt-1 inline-block rounded-full px-2.5 py-0.5 text-[11px] font-medium"
                    style={{ backgroundColor: `${sc}15`, color: sc }}>
                    {perfLabel(s)}
                  </span>
                </div>
              </div>
            </ScrollFadeIn>
          );
        })()}
      </section>

      {/* ── Section 3: Bottom row ─────────────────────────────────────── */}
      <section className="pb-16">
        <div className="grid gap-4 sm:grid-cols-2">

          {/* What This Means */}
          <ScrollFadeIn>
            <div className="h-full rounded-2xl border border-slate-200 bg-white p-8">
              <h2 className="text-lg font-semibold text-slate-900">What This Means</h2>
              <div className="mt-6 space-y-5">
                {strongest && (
                  <div className="flex gap-3">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100">
                      <svg className="h-3.5 w-3.5 text-emerald-600" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                      </svg>
                    </div>
                    <p className="text-sm text-slate-600">
                      <span className="font-semibold">{strongest.label}</span> is a strength at {strongest.score!.toFixed(1)}/100
                    </p>
                  </div>
                )}
                {weakest && (
                  <div className="flex gap-3">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red-100">
                      <svg className="h-3.5 w-3.5 text-red-600" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                      </svg>
                    </div>
                    <p className="text-sm text-slate-600">
                      <span className="font-semibold">{weakest.label}</span> needs attention at {weakest.score!.toFixed(1)}/100
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
                className="mt-6 inline-flex items-center gap-1 text-sm font-semibold text-[--accent-primary] hover:underline">
                See Full Country Profile
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                </svg>
              </Link>
            </div>
          </ScrollFadeIn>

          {/* Explore More */}
          <ScrollFadeIn delay={0.1}>
            <div className="h-full rounded-2xl border border-slate-200 bg-white p-8">
              <h2 className="text-lg font-semibold text-slate-900">Explore More</h2>
              <div className="mt-6 divide-y divide-slate-100">
                {[
                  { icon: iso3ToFlag(data.iso3), title: `${data.name} Deep Dive`, sub: '9 sections, 44+ indicators, 23 years of data', href: `/country/${data.iso3}` },
                  { icon: '\uD83D\uDCCA', title: 'Methodology', sub: 'How we calculate scores', href: '/methodology' },
                  { icon: '\uD83C\uDF0D', title: 'All 250 Countries', sub: 'Browse and compare', href: '/explore' },
                ].map(row => (
                  <Link key={row.href} href={row.href}
                    className="-mx-3 flex items-center gap-4 rounded-lg px-3 py-4 transition-colors hover:bg-slate-50">
                    <span className="text-2xl">{row.icon}</span>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-slate-900">{row.title}</p>
                      <p className="text-xs text-slate-400">{row.sub}</p>
                    </div>
                    <svg className="h-4 w-4 text-slate-300" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                    </svg>
                  </Link>
                ))}
              </div>
            </div>
          </ScrollFadeIn>
        </div>
      </section>

      {/* ── Section 4: Back link ──────────────────────────────────────── */}
      <div className="py-12 text-center">
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
