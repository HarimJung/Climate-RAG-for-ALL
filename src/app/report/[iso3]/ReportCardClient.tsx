'use client';

import { iso3ToFlag } from '@/lib/iso3ToFlag';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ScrollFadeIn } from '@/components/climate/scroll-fade-in';
import type { ReportCardData } from './page';

// ── Color maps ───────────────────────────────────────────────────────────────

const GRADE_COLOR: Record<string, string> = {
  'A+': '#00A67E', A: '#00A67E', 'B+': '#10B981', B: '#10B981',
  'C+': '#F59E0B', C: '#F59E0B', D: '#E5484D', F: '#E5484D',
};

const CLASS_STYLE: Record<string, { bg: string; text: string }> = {
  Changer: { bg: '#ECFDF5', text: '#00A67E' },
  Starter: { bg: '#FFFBEB', text: '#F59E0B' },
  Talker:  { bg: '#FEF2F2', text: '#E5484D' },
};

const DOMAIN_META = [
  { key: 'emissions',      label: 'Emissions',      weight: '30%', color: '#E5484D', icon: '\uD83C\uDFED', desc: 'CO2 per capita, CO2/GDP intensity, decoupling trend' },
  { key: 'energy',         label: 'Energy',          weight: '25%', color: '#0066FF', icon: '\u26A1',       desc: 'Renewable electricity share, grid carbon intensity' },
  { key: 'economy',        label: 'Economy',         weight: '15%', color: '#8B5CF6', icon: '\uD83D\uDCB0', desc: 'GDP per capita, climate economic efficiency' },
  { key: 'responsibility', label: 'Responsibility',  weight: '15%', color: '#F59E0B', icon: '\uD83C\uDF21\uFE0F', desc: 'Share of global cumulative CO2 emissions' },
  { key: 'resilience',     label: 'Resilience',      weight: '15%', color: '#00A67E', icon: '\uD83D\uDEE1\uFE0F', desc: 'ND-GAIN readiness and vulnerability scores' },
] as const;

function scoreColor(s: number | null): string {
  if (s === null) return '#8888A0';
  if (s >= 70) return '#00A67E';
  if (s >= 40) return '#F59E0B';
  return '#E5484D';
}

function insightLine(s: number | null): string {
  if (s === null) return 'Insufficient data';
  if (s >= 80) return 'Excellent — top tier globally';
  if (s >= 70) return 'Strong — above average';
  if (s >= 50) return 'Moderate — room for improvement';
  if (s >= 40) return 'Below average — action needed';
  return 'Urgent — lags behind peers';
}

function perfLabel(s: number | null): { text: string; color: string } {
  if (s === null) return { text: 'No data', color: '#8888A0' };
  if (s >= 70) return { text: 'Top tier', color: '#00A67E' };
  if (s >= 50) return { text: 'Moderate', color: '#F59E0B' };
  if (s >= 40) return { text: 'Below avg', color: '#F59E0B' };
  return { text: 'Needs attention', color: '#E5484D' };
}

// ── Shared UI ────────────────────────────────────────────────────────────────

function SectionDot({ label }: { label: string }) {
  return (
    <p className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-[--text-muted]">
      <span className="inline-block h-2 w-2 rounded-full bg-[--accent-primary]" />
      {label}
    </p>
  );
}

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

// ── Score Gauge (donut arc) ──────────────────────────────────────────────────

function ScoreGauge({ score, grade, color }: { score: number; grade: string; color: string }) {
  const r = 52;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - score / 100);

  return (
    <div className="relative mx-auto h-[140px] w-[140px]">
      <svg viewBox="0 0 120 120" className="h-full w-full" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="60" cy="60" r={r} fill="none" stroke="#f1f5f9" strokeWidth="10" />
        <motion.circle
          cx="60" cy="60" r={r} fill="none" stroke={color} strokeWidth="10"
          strokeLinecap="round" strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          whileInView={{ strokeDashoffset: offset }}
          viewport={{ once: true }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-black leading-none" style={{ color }}>{grade}</span>
      </div>
    </div>
  );
}

// ── Animated progress bar ────────────────────────────────────────────────────

function AnimBar({ score, color, delay = 0 }: { score: number; color: string; delay?: number }) {
  return (
    <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-slate-100">
      <motion.div
        className="h-full rounded-full"
        style={{ backgroundColor: color }}
        initial={{ width: 0 }}
        whileInView={{ width: `${score}%` }}
        viewport={{ once: true }}
        transition={{ duration: 1, ease: 'easeOut', delay }}
      />
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────

export function ReportCardClient({ data }: { data: ReportCardData }) {
  const animScore = useCountUp(data.total);
  const gradeColor = GRADE_COLOR[data.grade] ?? '#E5484D';

  const getScore = (key: string) => (data as unknown as Record<string, number | null>)[key] as number | null;

  return (
    <div className="mx-auto max-w-[1200px] px-6 pb-20">

      {/* ── Section 1: Hero (compact) ─────────────────────────────────── */}
      <ScrollFadeIn>
        <section className="pb-8 pt-10 text-center">
          <span className="text-6xl leading-none">{iso3ToFlag(data.iso3)}</span>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-[--text-primary] sm:text-4xl">
            {data.name}
          </h1>
          <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
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
        </section>
      </ScrollFadeIn>

      {/* ── Section 2: Score Display (centerpiece) ────────────────────── */}
      <ScrollFadeIn>
        <section className="py-8">
          <SectionDot label="Score" />
          <div className="rounded-2xl border border-[--border-card] bg-white p-8 shadow-sm">
            <div className="grid items-start gap-10 lg:grid-cols-[38%_62%]">

              {/* LEFT: Gauge + Score + Print */}
              <div className="flex flex-col items-center text-center">
                <ScoreGauge score={data.total} grade={data.grade} color={gradeColor} />
                <p className="mt-5 font-mono text-5xl font-bold leading-none text-[--text-primary]">
                  {animScore.toFixed(1)}
                  <span className="text-xl font-medium text-[--text-muted]"> / 100</span>
                </p>
                <p className="mt-2 text-sm font-semibold uppercase tracking-wider text-[--text-muted]">
                  Total Climate Score
                </p>
                <button onClick={() => window.print()}
                  className="mt-5 rounded-xl border border-[--border-card] px-5 py-2.5 text-sm font-medium text-[--text-secondary] transition-colors hover:border-[--accent-primary] hover:text-[--accent-primary]">
                  Print / Save PDF
                </button>
              </div>

              {/* RIGHT: 5 domain rows */}
              <div className="space-y-5">
                {DOMAIN_META.map((d, i) => {
                  const s = getScore(d.key);
                  return (
                    <div key={d.key}>
                      <div className="mb-1.5 flex items-center gap-2">
                        <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                        <span className="text-sm font-semibold text-[--text-primary]">{d.label}</span>
                        <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-[--text-muted]">{d.weight}</span>
                        <span className="ml-auto font-mono text-sm font-bold" style={{ color: scoreColor(s) }}>
                          {s !== null ? s.toFixed(1) : '--'}
                        </span>
                      </div>
                      {s !== null ? (
                        <AnimBar score={s} color={d.color} delay={i * 0.1} />
                      ) : (
                        <div className="h-2.5 rounded-full bg-slate-100" />
                      )}
                      <p className="mt-1 text-xs text-[--text-muted]">{insightLine(s)}</p>
                    </div>
                  );
                })}
              </div>

            </div>
          </div>
        </section>
      </ScrollFadeIn>

      {/* ── Section 3: Domain Detail Cards ─────────────────────────────── */}
      <section className="py-16">
        <ScrollFadeIn><SectionDot label="Breakdown" /></ScrollFadeIn>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {DOMAIN_META.map((d, i) => {
            const s = getScore(d.key);
            const perf = perfLabel(s);
            return (
              <ScrollFadeIn key={d.key} delay={i * 0.08}>
                <div className="card-hover flex h-full flex-col rounded-2xl border border-[--border-card] bg-white p-5">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-2xl">{d.icon}</span>
                    <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-[--text-muted]">{d.weight}</span>
                  </div>
                  <p className="text-sm font-semibold text-[--text-primary]">{d.label}</p>
                  <p className="mt-1 font-mono text-[32px] font-bold leading-none" style={{ color: scoreColor(s) }}>
                    {s !== null ? s.toFixed(1) : '--'}
                  </p>
                  <p className="mt-3 text-xs leading-relaxed text-[--text-muted]">{d.desc}</p>
                  <div className="mt-auto pt-3">
                    <span className="inline-block rounded-full px-2.5 py-1 text-[11px] font-bold" style={{ backgroundColor: `${perf.color}15`, color: perf.color }}>
                      {perf.text}
                    </span>
                  </div>
                </div>
              </ScrollFadeIn>
            );
          })}
        </div>
      </section>

      {/* ── Section 4: Next Steps ──────────────────────────────────────── */}
      <section className="py-8">
        <ScrollFadeIn><SectionDot label="Next Steps" /></ScrollFadeIn>
        <div className="grid gap-6 sm:grid-cols-3">
          {[
            { icon: iso3ToFlag(data.iso3), title: `${data.name} Deep Dive`,
              body: 'Full data profile with 9 sections, 44+ indicators, and 23 years of trends.',
              href: `/country/${data.iso3}`, btn: 'View Full Profile', btnColor: '#10B981', bg: '#F0FDF4' },
            { icon: '\uD83D\uDCCA', title: 'How We Score',
              body: '5 domains, 11 indicators, and min-max normalization across 250 countries.',
              href: '/methodology', btn: 'Read Methodology', btnColor: '#3B82F6', bg: '#F0F9FF' },
            { icon: '\uD83C\uDF0D', title: 'All 250 Countries',
              body: 'Browse, filter, and compare climate report cards for every country.',
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

      {/* ── Back link ─────────────────────────────────────────────────── */}
      <div className="pt-4 text-center">
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
