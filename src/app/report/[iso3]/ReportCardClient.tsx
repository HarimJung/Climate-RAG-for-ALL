'use client';

import { iso3ToFlag } from '@/lib/iso3ToFlag';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Flame, Zap, TrendingUp, Globe, Shield, ArrowRight, ChevronRight } from 'lucide-react';
import type { ReportCardData, PeerContext } from './page';

// ── Constants ────────────────────────────────────────────────────────────────

const CLASS_PILL: Record<string, { bg: string; text: string; border: string }> = {
  Changer: { bg: '#ECFDF5', text: '#047857', border: '#A7F3D0' },
  Starter: { bg: '#FFFBEB', text: '#B45309', border: '#FDE68A' },
  Talker:  { bg: '#FEF2F2', text: '#B91C1C', border: '#FECACA' },
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
  { key: 'emissions', label: 'Emissions', weight: 30, color: '#E5484D', Icon: Flame },
  { key: 'energy', label: 'Energy', weight: 25, color: '#0066FF', Icon: Zap },
  { key: 'economy', label: 'Economy', weight: 15, color: '#8B5CF6', Icon: TrendingUp },
  { key: 'responsibility', label: 'Responsibility', weight: 15, color: '#F59E0B', Icon: Globe },
  { key: 'resilience', label: 'Resilience', weight: 15, color: '#00A67E', Icon: Shield },
] as const;

function scoreColor(s: number | null) {
  if (s === null) return '#94A3B8';
  if (s >= 70) return '#00A67E';
  if (s >= 40) return '#F59E0B';
  return '#E5484D';
}

function perfLabel(s: number | null) {
  if (s === null) return 'No data';
  if (s >= 80) return 'Excellent';
  if (s >= 70) return 'Good';
  if (s >= 50) return 'Fair';
  if (s >= 40) return 'Below avg';
  return 'Critical';
}

function nextGrade(score: number) {
  const t = [
    { min: 25, g: 'D' }, { min: 40, g: 'C' }, { min: 50, g: 'C+' },
    { min: 60, g: 'B' }, { min: 70, g: 'B+' }, { min: 80, g: 'A' }, { min: 90, g: 'A+' },
  ];
  return t.find(x => x.min > score) ?? null;
}

// ── Score Ring ────────────────────────────────────────────────────────────────

function ScoreRing({ score, grade }: { score: number; grade: string }) {
  const r = 80;
  const circ = 2 * Math.PI * r;
  const filled = circ * (score / 100);
  const color = scoreColor(score);

  return (
    <div className="relative mx-auto h-[200px] w-[200px]">
      <svg viewBox="0 0 200 200" className="h-full w-full -rotate-90">
        <circle cx="100" cy="100" r={r} fill="none" stroke="#F1F5F9" strokeWidth="12" />
        <motion.circle
          cx="100" cy="100" r={r} fill="none" stroke={color} strokeWidth="12"
          strokeLinecap="round" strokeDasharray={String(circ)}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: circ - filled }}
          transition={{ duration: 1.4, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="font-mono text-5xl font-black tracking-tight" style={{ color }}>
          {grade}
        </span>
      </div>
    </div>
  );
}

// ── useCountUp ───────────────────────────────────────────────────────────────

function useCountUp(end: number) {
  const [v, setV] = useState(0);
  useEffect(() => {
    let cur = 0;
    const step = end / 60;
    const t = setInterval(() => {
      cur += step;
      if (cur >= end) { setV(end); clearInterval(t); } else setV(cur);
    }, 16);
    return () => clearInterval(t);
  }, [end]);
  return v;
}

// ── Domain Card ──────────────────────────────────────────────────────────────

function DomainCard(
  { domain, score, globalAvg, index }: {
    domain: typeof DOMAINS[number]; score: number | null;
    globalAvg: number | null; index: number;
  },
) {
  const color = scoreColor(score);
  const { Icon, label, weight, color: dc } = domain;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: 0.15 + index * 0.07, duration: 0.4 }}
      className="rounded-2xl border border-[#E8E8ED] bg-white p-5"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg"
            style={{ backgroundColor: `${dc}10` }}>
            <Icon className="h-4 w-4" style={{ color: dc }} />
          </div>
          <span className="text-sm font-semibold text-[--text-primary]">{label}</span>
        </div>
        <span className="rounded-md bg-slate-50 px-2 py-0.5 font-mono text-[10px] text-slate-400">
          {weight}%
        </span>
      </div>

      <div className="mt-4 flex items-baseline gap-1.5">
        <span className="font-mono text-3xl font-bold"
          style={{ color, fontVariantNumeric: 'tabular-nums' }}>
          {score !== null ? score.toFixed(1) : '\u2014'}
        </span>
        <span className="text-sm text-slate-400">/100</span>
      </div>

      {score !== null && (
        <div className="mt-3">
          <div className="relative h-2 overflow-hidden rounded-full bg-slate-100">
            <motion.div
              className="absolute inset-y-0 left-0 rounded-full"
              style={{ backgroundColor: dc }}
              initial={{ width: 0 }}
              whileInView={{ width: `${score}%` }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, ease: 'easeOut', delay: 0.3 + index * 0.07 }}
            />
            {globalAvg !== null && (
              <div
                className="absolute top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-full bg-slate-900/40"
                style={{ left: `${Math.min(globalAvg, 100)}%` }}
                title={`Global avg: ${globalAvg.toFixed(1)}`}
              />
            )}
          </div>
          <div className="mt-1.5 flex items-center justify-between text-[11px]">
            <span className="font-medium" style={{ color }}>{perfLabel(score)}</span>
            {globalAvg !== null && (
              <span className="text-slate-400">avg {globalAvg.toFixed(0)}</span>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────

export function ReportCardClient(
  { data, peerContext }: { data: ReportCardData; peerContext: PeerContext | null },
) {
  const animScore = useCountUp(data.total);
  const ng = nextGrade(data.total);
  const pill = data.climateClass ? CLASS_PILL[data.climateClass] : null;

  const gs = (k: string) =>
    (data as unknown as Record<string, number | null>)[k] as number | null;
  const ga = (k: string) =>
    peerContext?.globalAvg
      ? ((peerContext.globalAvg as unknown as Record<string, number | null>)[k] ?? null)
      : null;

  const scored = DOMAINS.map(d => ({ ...d, s: gs(d.key) })).filter(d => d.s !== null);
  const best  = scored.length ? scored.reduce((a, b) => (a.s! > b.s! ? a : b)) : null;
  const worst = scored.length ? scored.reduce((a, b) => (a.s! < b.s! ? a : b)) : null;

  return (
    <div className="mx-auto max-w-[960px] px-6 pb-20">

      {/* ── Country Header ─────────────────────────────────────────────── */}
      <section className="pb-2 pt-6">
        <div className="flex items-center gap-3">
          <span className="text-4xl leading-none">{iso3ToFlag(data.iso3)}</span>
          <div>
            <h1 className="text-2xl font-bold text-[--text-primary]">{data.name}</h1>
            <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-[--text-muted]">
              <span>{data.region}</span>
              <span className="text-slate-300">&middot;</span>
              <span className="font-mono">{data.iso3}</span>
              {peerContext?.incomeGroup && (
                <>
                  <span className="text-slate-300">&middot;</span>
                  <span>{peerContext.incomeGroup}</span>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── Score Hero ─────────────────────────────────────────────────── */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mt-4 rounded-3xl border border-[#E8E8ED] bg-white p-8 text-center sm:p-10"
      >
        <ScoreRing score={data.total} grade={data.grade} />

        <p className="mt-2 font-mono text-4xl font-bold text-[--text-primary]"
          style={{ fontVariantNumeric: 'tabular-nums' }}>
          {animScore.toFixed(1)}
          <span className="text-lg font-normal text-[--text-muted]"> /100</span>
        </p>

        <p className="mt-1 text-sm text-[--text-secondary]">
          {GRADE_LABEL[data.grade] ?? 'N/A'}
        </p>

        {/* Badges */}
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          {pill && data.climateClass && (
            <span
              className="rounded-full border px-3 py-1 text-xs font-semibold"
              style={{ backgroundColor: pill.bg, color: pill.text, borderColor: pill.border }}
            >
              {data.climateClass}
            </span>
          )}
          {ng && (
            <span className="rounded-full bg-slate-50 px-3 py-1 text-xs text-[--text-muted]">
              {Math.ceil(ng.min - data.total)} pts to {ng.g}
            </span>
          )}
        </div>

        {/* Peer context */}
        {peerContext && peerContext.globalRank > 0 && (
          <div className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-sm text-[--text-secondary]">
            <span>
              <span className="font-semibold text-[--text-primary]">
                #{peerContext.globalRank}
              </span>{' '}
              of {peerContext.globalTotal} globally
            </span>
            {peerContext.incomeGroupRank != null && peerContext.incomeGroupTotal != null && (
              <span>
                <span className="font-semibold text-[--text-primary]">
                  #{peerContext.incomeGroupRank}
                </span>{' '}
                of {peerContext.incomeGroupTotal} in {peerContext.incomeGroup}
              </span>
            )}
          </div>
        )}
      </motion.section>

      {/* ── Domain Breakdown ───────────────────────────────────────────── */}
      <section className="mt-6">
        <h2 className="mb-4 text-lg font-semibold text-[--text-primary]">
          Domain Breakdown
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {DOMAINS.map((d, i) => (
            <DomainCard
              key={d.key} domain={d} score={gs(d.key)}
              globalAvg={ga(d.key)} index={i}
            />
          ))}
        </div>
      </section>

      {/* ── Insights ───────────────────────────────────────────────────── */}
      <section className="mt-6 rounded-2xl border border-[#E8E8ED] bg-white p-6">
        <h2 className="text-base font-semibold text-[--text-primary]">Key Insights</h2>
        <div className="mt-4 space-y-3">
          {best && (
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-50">
                <svg className="h-3 w-3 text-emerald-500" fill="none" viewBox="0 0 24 24"
                  strokeWidth={3} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                </svg>
              </div>
              <p className="text-sm text-[--text-secondary]">
                <span className="font-semibold text-[--text-primary]">{best.label}</span> is
                the strongest domain at {best.s!.toFixed(1)}/100
                {ga(best.key) !== null && (
                  <span className="text-[--text-muted]">
                    {' '}(global avg {ga(best.key)!.toFixed(0)})
                  </span>
                )}
              </p>
            </div>
          )}

          {worst && best && worst.key !== best.key && (
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-50">
                <svg className="h-3 w-3 text-amber-500" fill="none" viewBox="0 0 24 24"
                  strokeWidth={3} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                </svg>
              </div>
              <p className="text-sm text-[--text-secondary]">
                <span className="font-semibold text-[--text-primary]">{worst.label}</span> needs
                attention at {worst.s!.toFixed(1)}/100
                {ga(worst.key) !== null && (
                  <span className="text-[--text-muted]">
                    {' '}(global avg {ga(worst.key)!.toFixed(0)})
                  </span>
                )}
              </p>
            </div>
          )}

          {data.climateClass && (
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-50">
                <svg className="h-3 w-3 text-blue-500" fill="none" viewBox="0 0 24 24"
                  strokeWidth={2.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
                </svg>
              </div>
              <p className="text-sm text-[--text-secondary]">
                Classified as{' '}
                <span className="font-semibold text-[--text-primary]">{data.climateClass}</span>
                : {CLASS_EXPLAIN[data.climateClass]}
              </p>
            </div>
          )}
        </div>
      </section>

      {/* ── CTA ────────────────────────────────────────────────────────── */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.2, duration: 0.4 }}
        className="mt-6"
      >
        <Link
          href={`/country/${data.iso3}`}
          className="group flex items-center justify-between rounded-2xl border border-[#E8E8ED] bg-white p-6 transition-all hover:border-[--accent-primary] hover:shadow-md"
        >
          <div>
            <p className="text-lg font-semibold text-[--text-primary]">
              Explore {data.name}&apos;s Full Profile
            </p>
            <p className="mt-0.5 text-sm text-[--text-muted]">
              9 sections &middot; 44+ indicators &middot; interactive charts
            </p>
          </div>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[--accent-primary] text-white transition-transform group-hover:translate-x-1">
            <ArrowRight className="h-5 w-5" />
          </div>
        </Link>

        <div className="mt-3 flex items-center justify-center gap-4">
          <Link href="/methodology"
            className="flex items-center gap-1 text-sm text-[--text-muted] transition-colors hover:text-[--accent-primary]">
            Methodology <ChevronRight className="h-3.5 w-3.5" />
          </Link>
          <Link href="/explore"
            className="flex items-center gap-1 text-sm text-[--text-muted] transition-colors hover:text-[--accent-primary]">
            All Countries <ChevronRight className="h-3.5 w-3.5" />
          </Link>
          <Link href="/report"
            className="flex items-center gap-1 text-sm text-[--text-muted] transition-colors hover:text-[--accent-primary]">
            All Report Cards <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </motion.section>
    </div>
  );
}
