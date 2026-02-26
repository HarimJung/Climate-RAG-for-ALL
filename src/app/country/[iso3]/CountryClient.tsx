'use client';

import React, { useState, useEffect, useCallback, useRef, Component, type ErrorInfo, type ReactNode } from 'react';
import { createClient } from '@/lib/supabase/client';
import { ClimateSankey } from '@/components/charts/ClimateSankey';
import { ClimateGap } from '@/components/charts/ClimateGap';
import { NDCGapChart } from '@/components/charts/NDCGapChart';
import { KayaWaterfall } from '@/components/charts/KayaWaterfall';
import { EquityScatter } from '@/components/charts/EquityScatter';
import {
  PageWrapper,
  HeroSection,
  SectionHeader,
  ChartCard,
  ScrollFadeIn,
  SummaryFan,
  StoryBlock,
} from '@/components/climate';

// ── Chart Error Boundary ─────────────────────────────────────────────────────
class ChartErrorBoundary extends Component<
  { children: ReactNode; fallback?: ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: ReactNode; fallback?: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ChartError]', error, info.componentStack);
  }
  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? null;
    }
    return this.props.children;
  }
}

function SafeChart({ children, name }: { children: ReactNode; name?: string }) {
  return (
    <ChartErrorBoundary
      fallback={
        <div className="flex h-40 items-center justify-center rounded-lg bg-slate-50">
          <p className="text-sm text-slate-400">{name ? `${name} chart` : 'Chart'} unavailable</p>
        </div>
      }
    >
      {children}
    </ChartErrorBoundary>
  );
}
import emissionsTrend from '../../../../data/analysis/emissions-trend-6countries.json';
import riskProfileKOR from '../../../../data/analysis/risk-profile-KOR.json';
import riskProfileUSA from '../../../../data/analysis/risk-profile-USA.json';
import riskProfileDEU from '../../../../data/analysis/risk-profile-DEU.json';
import riskProfileBRA from '../../../../data/analysis/risk-profile-BRA.json';
import riskProfileNGA from '../../../../data/analysis/risk-profile-NGA.json';
import riskProfileBGD from '../../../../data/analysis/risk-profile-BGD.json';

const RISK_PROFILES = {
  KOR: riskProfileKOR, USA: riskProfileUSA, DEU: riskProfileDEU,
  BRA: riskProfileBRA, NGA: riskProfileNGA, BGD: riskProfileBGD,
} as const;

// ── CTRACE sector metadata ────────────────────────────────────────────────────
const SECTOR_META: Record<string, { label: string; color: string }> = {
  'CTRACE.POWER':                  { label: 'Power',           color: '#EF4444' },
  'CTRACE.TRANSPORTATION':         { label: 'Transportation',   color: '#F59E0B' },
  'CTRACE.MANUFACTURING':          { label: 'Manufacturing',    color: '#8B5CF6' },
  'CTRACE.AGRICULTURE':            { label: 'Agriculture',      color: '#10B981' },
  'CTRACE.FOSSIL-FUEL-OPERATIONS': { label: 'Fossil Fuel Ops', color: '#78716C' },
  'CTRACE.BUILDINGS':              { label: 'Buildings',        color: '#3B82F6' },
  'CTRACE.WASTE':                  { label: 'Waste',            color: '#6B7280' },
  'CTRACE.FORESTRY':               { label: 'Forestry',         color: '#059669' },
  'CTRACE.MINERAL-EXTRACTION':     { label: 'Minerals',         color: '#D97706' },
};
const CTRACE_CODES = Object.keys(SECTOR_META);

const FUEL_SERIES = [
  { key: 'OWID.COAL_CO2',    label: 'Coal',    color: '#374151' },
  { key: 'OWID.OIL_CO2',     label: 'Oil',     color: '#92400E' },
  { key: 'OWID.GAS_CO2',     label: 'Gas',     color: '#F59E0B' },
  { key: 'OWID.CEMENT_CO2',  label: 'Cement',  color: '#9CA3AF' },
  { key: 'OWID.FLARING_CO2', label: 'Flaring', color: '#DC2626' },
];

// ── Types ─────────────────────────────────────────────────────────────────────
interface ExtraData {
  consumptionCo2: { year: number; value: number }[];
  ctraceByCode: Record<string, number>;
  ctraceYear: number | null;
  fuelSeries: Record<string, { year: number; value: number }[]>;
  cumulativeCo2: number | null;
  shareCumulative: number | null;
  tempGhg: number | null;
  tempCo2: number | null;
  tempCh4: number | null;
  tempN2o: number | null;
  methaneSeries: { year: number; value: number }[];
  n2oSeries: { year: number; value: number }[];
  totalGhgLatest: number | null;
  ghgPerCapitaLatest: number | null;
  co2PerGdpSeries: { year: number; value: number }[];
}

const EMPTY_EXTRA: ExtraData = {
  consumptionCo2: [], ctraceByCode: {}, ctraceYear: null,
  fuelSeries: {}, cumulativeCo2: null, shareCumulative: null,
  tempGhg: null, tempCo2: null, tempCh4: null, tempN2o: null,
  methaneSeries: [], n2oSeries: [], totalGhgLatest: null,
  ghgPerCapitaLatest: null, co2PerGdpSeries: [],
};

export interface CountryClientProps {
  countryName: string;
  iso3: string;
  wbCo2Series: { year: number; value: number }[];
  co2Comparison: { year: number; wb: number; ct: number }[];
  gdpVsCo2: { year: number; gdp: number; co2: number }[];
  emberMix: { renewable: number; fossil: number; other: number; year: number; source: string } | null;
  renewableChange: number | null;
  scatterData: { iso3: string; name: string; vulnerability: number; readiness: number }[];
  decouplingSeries: { year: number; value: number }[];
  decouplingScore: number | null;
  pm25?: number | null;
  carbonIntensity?: number | null;
  initialExtra?: ExtraData;
  climateGapData?: { iso3: string; name: string; pre: number; post: number }[];
}

// ── Inline Helpers ────────────────────────────────────────────────────────────

function SourceLabel({ children }: { children: React.ReactNode }) {
  return <p className="mt-3 text-xs text-slate-400">{children}</p>;
}

function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

function signed(n: number, d = 2): string {
  return (n >= 0 ? '+' : '') + n.toFixed(d);
}

function InsightPanel({ tag, tagColor = 'text-emerald-600', children }: { tag: string; tagColor?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <p className={`text-xs font-semibold uppercase tracking-wider ${tagColor}`}>{tag}</p>
      <div className="text-sm leading-relaxed text-slate-600 md:text-base md:leading-relaxed">{children}</div>
    </div>
  );
}

function MetricRow({ metrics }: { metrics: { value: string; label: string; sub?: string }[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {metrics.map((m, i) => (
        <ScrollFadeIn key={i} delay={i * 0.06} direction="up" distance={20}>
          <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-4 text-center">
            <p className="text-2xl font-bold text-slate-900">{m.value}</p>
            <p className="text-xs text-slate-500">{m.label}</p>
            {m.sub && <p className="mt-0.5 text-[10px] text-slate-400">{m.sub}</p>}
          </div>
        </ScrollFadeIn>
      ))}
    </div>
  );
}

// ── SVG Helpers ───────────────────────────────────────────────────────────────
function niceMax(val: number, ticks = 5): number[] {
  if (val <= 0) return [0, 1, 2, 3, 4, 5];
  const raw = val / ticks;
  const exp = Math.pow(10, Math.floor(Math.log10(raw)));
  const step = Math.ceil(raw / exp) * exp;
  return Array.from({ length: ticks + 1 }, (_, i) => i * step);
}

function xTicks(minY: number, maxY: number): number[] {
  const span = maxY - minY;
  const step = span <= 8 ? 1 : span <= 15 ? 2 : span <= 24 ? 4 : 5;
  return Array.from({ length: Math.floor(span / step) + 1 }, (_, i) => minY + i * step).filter(y => y <= maxY);
}

// ── Chart: Emissions Line (production + optional consumption) ─────────────────
function EmissionsLineChart({
  production, consumption, countryName, strokeW = 2.5,
}: {
  production: { year: number; value: number }[];
  consumption?: { year: number; value: number }[];
  countryName: string;
  strokeW?: number;
}) {
  const [hover, setHover] = useState<{ year: number; prodVal: number; consVal: number | null; x: number; y: number } | null>(null);

  const VW = 760, VH = 280, ML = 54, MR = 16, MT = 20, MB = 36;
  const W = VW - ML - MR, H = VH - MT - MB;
  const sorted = [...production].sort((a, b) => a.year - b.year);
  if (sorted.length === 0) return <div className="flex h-40 items-center justify-center text-sm text-slate-400">Data not available</div>;
  const sortedCons = consumption ? [...consumption].sort((a, b) => a.year - b.year) : [];
  const allVals = [...sorted.map(d => d.value), ...sortedCons.map(d => d.value)];
  const minYear = sorted[0].year, maxYear = sorted[sorted.length - 1].year;
  const yTickVals = niceMax(Math.max(...allVals) * 1.1);
  const maxVal = yTickVals[yTickVals.length - 1];
  const xs = (y: number) => ML + ((y - minYear) / Math.max(maxYear - minYear, 1)) * W;
  const ys = (v: number) => MT + H - (v / maxVal) * H;
  const prodPath = sorted.map((d, i) => `${i ? 'L' : 'M'}${xs(d.year).toFixed(1)} ${ys(d.value).toFixed(1)}`).join(' ');
  const consPath = sortedCons.map((d, i) => `${i ? 'L' : 'M'}${xs(d.year).toFixed(1)} ${ys(d.value).toFixed(1)}`).join(' ');
  const areaPath = `${prodPath} L${xs(maxYear).toFixed(1)} ${ys(0).toFixed(1)} L${xs(minYear).toFixed(1)} ${ys(0).toFixed(1)} Z`;
  const gradId = `emit-${countryName.replace(/\s/g, '')}`;

  let gapAnnotation: { x: number; ymid: number; label: string } | null = null;
  if (sortedCons.length > 0) {
    let best = { gap: 0, year: 0, ymid: 0 };
    for (const p of sorted) {
      const c = sortedCons.find(d => d.year === p.year);
      if (!c) continue;
      const gap = Math.abs(p.value - c.value) / Math.max(p.value, 0.001);
      if (gap > best.gap) best = { gap, year: p.year, ymid: (p.value + c.value) / 2 };
    }
    if (best.gap > 0.2) {
      gapAnnotation = { x: xs(best.year), ymid: ys(best.ymid), label: `${(best.gap * 100).toFixed(0)}% gap` };
    }
  }

  const handleMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const svgX = ((e.clientX - rect.left) / rect.width) * VW;
    const rawYear = minYear + ((svgX - ML) / W) * (maxYear - minYear);
    const clamped = Math.max(minYear, Math.min(maxYear, Math.round(rawYear)));
    const nearest = sorted.reduce((a, b) => Math.abs(a.year - clamped) <= Math.abs(b.year - clamped) ? a : b);
    const consPoint = sortedCons.find(d => d.year === nearest.year) ?? null;
    setHover({ year: nearest.year, prodVal: nearest.value, consVal: consPoint?.value ?? null, x: xs(nearest.year), y: ys(nearest.value) });
  }, [sorted, sortedCons, minYear, maxYear]); // eslint-disable-line react-hooks/exhaustive-deps

  const xtick = xTicks(minYear, maxYear);
  return (
    <svg viewBox={`0 0 ${VW} ${VH}`} className="w-full" role="img" aria-label={`${countryName} CO₂ per capita`}
      onMouseMove={handleMouseMove} onMouseLeave={() => setHover(null)} style={{ cursor: 'crosshair' }}>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#EF4444" stopOpacity={0.18} />
          <stop offset="60%" stopColor="#EF4444" stopOpacity={0.08} />
          <stop offset="100%" stopColor="#EF4444" stopOpacity={0} />
        </linearGradient>
        <filter id={`glow-${gradId}`}>
          <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      {yTickVals.map(v => <line key={v} x1={ML} y1={ys(v)} x2={VW - MR} y2={ys(v)} stroke="#E8E8ED" strokeWidth={1} />)}
      {yTickVals.map(v => <text key={v} x={ML - 6} y={ys(v)} textAnchor="end" dominantBaseline="middle" fontSize={11} fill="#4A4A6A">{v % 1 === 0 ? v : v.toFixed(1)}</text>)}
      {xtick.map(y => <text key={y} x={xs(y)} y={VH - 10} textAnchor="middle" fontSize={11} fill="#4A4A6A">{y}</text>)}
      <text x={12} y={MT + H / 2} textAnchor="middle" fontSize={10} fill="#6B7280" transform={`rotate(-90,12,${MT + H / 2})`}>t CO₂e/capita</text>
      {minYear <= 2015 && maxYear >= 2015 && <>
        <line x1={xs(2015)} y1={MT} x2={xs(2015)} y2={MT + H} stroke="#94A3B8" strokeWidth={2} strokeDasharray="6,4" />
        <rect x={xs(2015) - 30} y={MT + 4} width={60} height={18} rx={4} fill="#F1F5F9" opacity={0.9} />
        <text x={xs(2015)} y={MT + 16} textAnchor="middle" fontSize={10} fill="#64748B" fontWeight="700">Paris 2015</text>
      </>}
      <path d={areaPath} fill={`url(#${gradId})`} />
      <path d={prodPath} fill="none" stroke="#EF4444" strokeWidth={strokeW} strokeLinejoin="round" filter={`url(#glow-${gradId})`} />
      {sorted.length > 0 && (() => {
        const last = sorted[sorted.length - 1];
        return (
          <>
            <circle cx={xs(last.year)} cy={ys(last.value)} r={5} fill="#EF4444" stroke="white" strokeWidth={2} filter={`url(#glow-${gradId})`} />
            <text x={xs(last.year) - 5} y={ys(last.value) - 10} textAnchor="end" fontSize={11} fontWeight="700" fill="#EF4444" fontFamily="monospace">
              {last.value.toFixed(1)}t
            </text>
          </>
        );
      })()}
      {consPath && <path d={consPath} fill="none" stroke="#8B5CF6" strokeWidth={2} strokeDasharray="6,4" strokeLinejoin="round" />}
      {gapAnnotation && <g>
        <line x1={gapAnnotation.x} y1={gapAnnotation.ymid - 10} x2={gapAnnotation.x} y2={gapAnnotation.ymid + 10} stroke="#94A3B8" strokeWidth={1} />
        <text x={gapAnnotation.x + 6} y={gapAnnotation.ymid + 4} fontSize={10} fill="#94A3B8">{gapAnnotation.label}</text>
      </g>}
      <line x1={ML} y1={MT} x2={ML} y2={MT + H} stroke="#C8C8D0" strokeWidth={1} />
      <line x1={ML} y1={MT + H} x2={VW - MR} y2={MT + H} stroke="#C8C8D0" strokeWidth={1} />
      {hover && (() => {
        const tx = hover.x + 8 + 104 < VW - MR ? hover.x + 8 : hover.x - 112;
        const hascons = hover.consVal != null;
        const th = hascons ? 52 : 38;
        return (
          <g style={{ pointerEvents: 'none' }}>
            <line x1={hover.x} y1={MT} x2={hover.x} y2={MT + H} stroke="#CBD5E1" strokeWidth={1} strokeDasharray="4,3" />
            <circle cx={hover.x} cy={hover.y} r={4} fill="#EF4444" stroke="white" strokeWidth={2} />
            <rect x={tx} y={MT + 4} width={104} height={th} rx={6} fill="rgba(255,255,255,0.97)" stroke="#E2E8F0" strokeWidth={1} />
            <text x={tx + 8} y={MT + 18} fontSize={11} fontWeight="700" fill="#1A1A2E" fontFamily="monospace">{hover.year}</text>
            <text x={tx + 8} y={MT + 32} fontSize={10} fill="#EF4444" fontFamily="monospace">Prod: {hover.prodVal.toFixed(2)}t</text>
            {hascons && <text x={tx + 8} y={MT + 46} fontSize={10} fill="#8B5CF6" fontFamily="monospace">Cons: {hover.consVal!.toFixed(2)}t</text>}
          </g>
        );
      })()}
    </svg>
  );
}

// ── Chart: Indexed Dual Line (WB vs CT / GDP vs CO₂) ─────────────────────────
function IndexedDualLineChart({
  data, aColor, bColor, aLabel, bLabel, yAxisLabel,
}: {
  data: { year: number; a: number; b: number }[];
  aColor: string; bColor: string; aLabel: string; bLabel: string;
  yAxisLabel?: string;
}) {
  const VW = 760, VH = 260, ML = 54, MR = 16, MT = 18, MB = 36;
  const W = VW - ML - MR, H = VH - MT - MB;
  if (data.length === 0) return null;
  const allVals = data.flatMap(d => [d.a, d.b]);
  const minVal = Math.min(...allVals) * 0.95;
  const yTickVals = niceMax(Math.max(...allVals) * 1.05);
  const maxVal = yTickVals[yTickVals.length - 1];
  const minYear = data[0].year, maxYear = data[data.length - 1].year;
  const xs = (y: number) => ML + ((y - minYear) / Math.max(maxYear - minYear, 1)) * W;
  const ys = (v: number) => MT + H - ((v - minVal) / (maxVal - minVal)) * H;
  const pathA = data.map((d, i) => `${i ? 'L' : 'M'}${xs(d.year).toFixed(1)} ${ys(d.a).toFixed(1)}`).join(' ');
  const pathB = data.map((d, i) => `${i ? 'L' : 'M'}${xs(d.year).toFixed(1)} ${ys(d.b).toFixed(1)}`).join(' ');
  const xt = xTicks(minYear, maxYear);
  const ytv = yTickVals.filter(v => v >= minVal);
  return (
    <svg viewBox={`0 0 ${VW} ${VH}`} className="w-full">
      {ytv.map(v => <line key={v} x1={ML} y1={ys(v)} x2={VW - MR} y2={ys(v)} stroke="#E8E8ED" strokeWidth={1} />)}
      {ys(100) >= MT && ys(100) <= MT + H && <line x1={ML} y1={ys(100)} x2={VW - MR} y2={ys(100)} stroke="#CBD5E1" strokeWidth={1} strokeDasharray="4,4" />}
      {ytv.map(v => <text key={v} x={ML - 6} y={ys(v)} textAnchor="end" dominantBaseline="middle" fontSize={11} fill="#4A4A6A">{v}</text>)}
      {xt.map(y => <text key={y} x={xs(y)} y={VH - 10} textAnchor="middle" fontSize={11} fill="#4A4A6A">{y}</text>)}
      <text x={12} y={MT + H / 2} textAnchor="middle" fontSize={10} fill="#6B7280" transform={`rotate(-90,12,${MT + H / 2})`}>{yAxisLabel ?? `Index (${data[0].year}=100)`}</text>
      <path d={pathA} fill="none" stroke={aColor} strokeWidth={2.5} />
      <path d={pathB} fill="none" stroke={bColor} strokeWidth={2.5} />
      <line x1={ML} y1={MT} x2={ML} y2={MT + H} stroke="#C8C8D0" strokeWidth={1} />
      <line x1={ML} y1={MT + H} x2={VW - MR} y2={MT + H} stroke="#C8C8D0" strokeWidth={1} />
    </svg>
  );
}

// ── Chart: Indexed Triple Line (GDP / CO₂ / Carbon Intensity) ─────────────────
function IndexedTripleLineChart({
  gdpCo2, co2PerGdp, baseYear,
}: {
  gdpCo2: { year: number; gdp: number; co2: number }[];
  co2PerGdp: { year: number; value: number }[];
  baseYear: number;
}) {
  const [hover, setHover] = useState<{ year: number; gdp: number; co2: number; cpg: number | null; x: number } | null>(null);

  const VW = 760, VH = 280, ML = 54, MR = 16, MT = 18, MB = 36;
  const W = VW - ML - MR, H = VH - MT - MB;
  if (gdpCo2.length === 0) return null;

  const cpgBase = co2PerGdp.find(d => d.year === baseYear)?.value;
  const cpgIndexed = cpgBase ? co2PerGdp.map(d => ({ year: d.year, value: (d.value / cpgBase) * 100 })) : [];

  const allValsRaw = [
    ...gdpCo2.flatMap(d => [d.gdp, d.co2]),
    ...cpgIndexed.map(d => d.value),
  ].filter(v => v != null);
  const rawMax = Math.max(...allValsRaw);
  const isCapped = rawMax > 500;
  const allVals = isCapped ? allValsRaw.map(v => Math.min(v, 500)) : allValsRaw;
  const minVal = Math.min(...allVals) * 0.9;
  const yTickVals = niceMax(Math.max(...allVals) * 1.05);
  const maxVal = yTickVals[yTickVals.length - 1];
  const minYear = gdpCo2[0].year, maxYear = gdpCo2[gdpCo2.length - 1].year;
  const xs = (y: number) => ML + ((y - minYear) / Math.max(maxYear - minYear, 1)) * W;
  const ys = (v: number) => MT + H - ((v - minVal) / (maxVal - minVal)) * H;
  const cap = (v: number) => isCapped ? Math.min(v, 500) : v;
  const gdpPath = gdpCo2.map((d, i) => `${i ? 'L' : 'M'}${xs(d.year).toFixed(1)} ${ys(cap(d.gdp)).toFixed(1)}`).join(' ');
  const co2Path = gdpCo2.map((d, i) => `${i ? 'L' : 'M'}${xs(d.year).toFixed(1)} ${ys(cap(d.co2)).toFixed(1)}`).join(' ');
  const cpgPath = cpgIndexed.map((d, i) => `${i ? 'L' : 'M'}${xs(d.year).toFixed(1)} ${ys(cap(d.value)).toFixed(1)}`).join(' ');
  const xt = xTicks(minYear, maxYear);
  const ytv = yTickVals.filter(v => v >= minVal);
  const handleMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const svgX = ((e.clientX - rect.left) / rect.width) * VW;
    const rawYear = minYear + ((svgX - ML) / W) * (maxYear - minYear);
    const clamped = Math.max(minYear, Math.min(maxYear, Math.round(rawYear)));
    const nearest = gdpCo2.reduce((a, b) => Math.abs(a.year - clamped) <= Math.abs(b.year - clamped) ? a : b);
    const cpgPoint = cpgIndexed.find(d => d.year === nearest.year) ?? null;
    setHover({ year: nearest.year, gdp: nearest.gdp, co2: nearest.co2, cpg: cpgPoint?.value ?? null, x: xs(nearest.year) });
  }, [gdpCo2, cpgIndexed, minYear, maxYear]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <svg viewBox={`0 0 ${VW} ${VH}`} className="w-full"
      onMouseMove={handleMouseMove} onMouseLeave={() => setHover(null)} style={{ cursor: 'crosshair' }}>
      {ytv.map(v => <line key={v} x1={ML} y1={ys(v)} x2={VW - MR} y2={ys(v)} stroke="#E8E8ED" strokeWidth={1} />)}
      {ys(100) >= MT && ys(100) <= MT + H && <line x1={ML} y1={ys(100)} x2={VW - MR} y2={ys(100)} stroke="#CBD5E1" strokeWidth={1} strokeDasharray="4,4" />}
      {ytv.map(v => <text key={v} x={ML - 6} y={ys(v)} textAnchor="end" dominantBaseline="middle" fontSize={11} fill="#4A4A6A">{v}</text>)}
      {xt.map(y => <text key={y} x={xs(y)} y={VH - 10} textAnchor="middle" fontSize={11} fill="#4A4A6A">{y}</text>)}
      <text x={12} y={MT + H / 2} textAnchor="middle" fontSize={10} fill="#6B7280" transform={`rotate(-90,12,${MT + H / 2})`}>Index ({baseYear}=100)</text>
      {gdpCo2.length > 0 && (() => {
        const gdpAreaPath = `${gdpPath} L${xs(gdpCo2[gdpCo2.length-1].year).toFixed(1)} ${ys(minVal).toFixed(1)} L${xs(gdpCo2[0].year).toFixed(1)} ${ys(minVal).toFixed(1)} Z`;
        const co2AreaPath = `${co2Path} L${xs(gdpCo2[gdpCo2.length-1].year).toFixed(1)} ${ys(minVal).toFixed(1)} L${xs(gdpCo2[0].year).toFixed(1)} ${ys(minVal).toFixed(1)} Z`;
        return (
          <>
            <path d={gdpAreaPath} fill="rgba(16,185,129,0.06)" />
            <path d={co2AreaPath} fill="rgba(239,68,68,0.06)" />
          </>
        );
      })()}
      <path d={gdpPath} fill="none" stroke="#10B981" strokeWidth={2.5} />
      <path d={co2Path} fill="none" stroke="#E5484D" strokeWidth={2.5} />
      {cpgPath && <path d={cpgPath} fill="none" stroke="#F59E0B" strokeWidth={2} strokeDasharray="5,3" />}
      {gdpCo2.length > 0 && (() => {
        const lastD = gdpCo2[gdpCo2.length - 1];
        return (
          <>
            <circle cx={xs(lastD.year)} cy={ys(cap(lastD.gdp))} r={4} fill="#10B981" stroke="white" strokeWidth={1.5} />
            <text x={xs(lastD.year) + 6} y={ys(cap(lastD.gdp)) + 4} fontSize={10} fontWeight="600" fill="#10B981" fontFamily="monospace">{cap(lastD.gdp).toFixed(0)}</text>
            <circle cx={xs(lastD.year)} cy={ys(cap(lastD.co2))} r={4} fill="#E5484D" stroke="white" strokeWidth={1.5} />
            <text x={xs(lastD.year) + 6} y={ys(cap(lastD.co2)) + 4} fontSize={10} fontWeight="600" fill="#E5484D" fontFamily="monospace">{cap(lastD.co2).toFixed(0)}</text>
          </>
        );
      })()}
      <line x1={ML} y1={MT} x2={ML} y2={MT + H} stroke="#C8C8D0" strokeWidth={1} />
      <line x1={ML} y1={MT + H} x2={VW - MR} y2={MT + H} stroke="#C8C8D0" strokeWidth={1} />
      {hover && (() => {
        const tx = hover.x + 8 + 118 < VW - MR ? hover.x + 8 : hover.x - 126;
        const hasCpg = hover.cpg != null;
        const th = hasCpg ? 64 : 50;
        return (
          <g style={{ pointerEvents: 'none' }}>
            <line x1={hover.x} y1={MT} x2={hover.x} y2={MT + H} stroke="#CBD5E1" strokeWidth={1} strokeDasharray="4,3" />
            <circle cx={hover.x} cy={ys(cap(hover.gdp))} r={3} fill="#10B981" stroke="white" strokeWidth={1.5} />
            <circle cx={hover.x} cy={ys(cap(hover.co2))} r={3} fill="#E5484D" stroke="white" strokeWidth={1.5} />
            <rect x={tx} y={MT + 4} width={118} height={th} rx={6} fill="rgba(255,255,255,0.97)" stroke="#E2E8F0" strokeWidth={1} />
            <text x={tx + 8} y={MT + 18} fontSize={11} fontWeight="700" fill="#1A1A2E" fontFamily="monospace">{hover.year}</text>
            <text x={tx + 8} y={MT + 32} fontSize={10} fill="#10B981" fontFamily="monospace">GDP: {hover.gdp.toFixed(1)}</text>
            <text x={tx + 8} y={MT + 46} fontSize={10} fill="#E5484D" fontFamily="monospace">CO₂: {hover.co2.toFixed(1)}</text>
            {hasCpg && <text x={tx + 8} y={MT + 60} fontSize={10} fill="#F59E0B" fontFamily="monospace">CI: {hover.cpg!.toFixed(1)}</text>}
          </g>
        );
      })()}
    </svg>
  );
}

// ── Chart: Horizontal Bar (CTRACE sectors) ────────────────────────────────────
function HorizontalBarChart({ bars }: { bars: { label: string; value: number; color: string; pct: number }[] }) {
  const [hover, setHover] = useState<{ idx: number; label: string; value: number; pct: number; color: string; bx: number; by: number } | null>(null);

  if (bars.length === 0) return null;
  const maxVal = bars[0].value;
  const ROW = 32, PAD = 12, LBL = 140, VW = 620, BMAX = VW - LBL - PAD - 90;
  const VH = bars.length * ROW + PAD * 2;
  const TW = 140, TH = 52;

  return (
    <svg viewBox={`0 0 ${VW} ${VH}`} className="w-full" role="img" aria-label="Emissions by sector"
      onMouseLeave={() => setHover(null)} style={{ cursor: 'default' }}>
      <defs>
        {bars.map((b, i) => (
          <linearGradient key={`bar-grad-${i}`} id={`bar-grad-${i}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={b.color} stopOpacity="0.9" />
            <stop offset="100%" stopColor={b.color} stopOpacity="0.7" />
          </linearGradient>
        ))}
      </defs>
      {bars.map((b, i) => {
        const y = PAD + i * ROW;
        const bw = maxVal > 0 ? (b.value / maxVal) * BMAX : 0;
        const isHovered = hover?.idx === i;
        return (
          <g key={b.label}
            onMouseEnter={() => setHover({ idx: i, label: b.label, value: b.value, pct: b.pct, color: b.color, bx: LBL + bw, by: y + ROW / 2 })}
            onMouseLeave={() => setHover(null)}
            style={{ cursor: 'pointer' }}
          >
            <rect x={LBL - 8} y={y} width={VW - LBL + 8} height={ROW} fill="transparent" />
            <text x={LBL - 8} y={y + ROW / 2} textAnchor="end" dominantBaseline="middle" fontSize={12} fill={isHovered ? '#1A1A2E' : '#4A4A6A'} fontWeight={isHovered ? '600' : '400'}>{b.label}</text>
            <rect x={LBL} y={y + 7} width={BMAX} height={ROW - 14} rx={8} fill="#F1F5F9" />
            <rect x={LBL} y={y + 7} width={bw} height={ROW - 14} rx={8} fill={`url(#bar-grad-${i})`}
              style={{ filter: `drop-shadow(0 2px 4px ${b.color}${isHovered ? '60' : '30'})`, transition: 'filter 0.15s ease' }}
              opacity={isHovered ? 1 : 0.85} />
            <text x={LBL + bw + 6} y={y + ROW / 2} dominantBaseline="middle" fontSize={11} fill={b.color} fontWeight="600">
              {b.value >= 1 ? b.value.toFixed(1) : b.value.toFixed(3)} Mt · {b.pct.toFixed(1)}%
            </text>
          </g>
        );
      })}
      {hover && (() => {
        const tx = hover.bx + 8 + TW < VW ? hover.bx + 8 : hover.bx - TW - 8;
        const ty = hover.by - TH / 2;
        const tyClamp = Math.max(2, Math.min(VH - TH - 2, ty));
        return (
          <g style={{ pointerEvents: 'none' }}>
            <line x1={LBL} y1={hover.by} x2={hover.bx} y2={hover.by} stroke={hover.color} strokeWidth={1.5} strokeOpacity={0.3} strokeDasharray="4,3" />
            <rect x={tx} y={tyClamp} width={TW} height={TH} rx={6} fill="rgba(255,255,255,0.97)" stroke="#E2E8F0" strokeWidth={1} style={{ filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.08))' }} />
            <text x={tx + 10} y={tyClamp + 16} fontSize={11} fontWeight="700" fill="#1A1A2E">{hover.label}</text>
            <text x={tx + 10} y={tyClamp + 32} fontSize={10} fill={hover.color} fontFamily="monospace">{hover.value.toFixed(2)} Mt CO₂e</text>
            <text x={tx + 10} y={tyClamp + 46} fontSize={10} fill="#4A4A6A" fontFamily="monospace">{hover.pct.toFixed(1)}% of total</text>
          </g>
        );
      })()}
    </svg>
  );
}

// ── Chart: Stacked Area (Fossil Fuel Breakdown) ───────────────────────────────
function StackedAreaChart({
  years, seriesDef, data,
}: {
  years: number[];
  seriesDef: { key: string; label: string; color: string }[];
  data: Record<number, Record<string, number>>;
}) {
  const [hover, setHover] = useState<{ year: number; values: Record<string, number>; x: number } | null>(null);

  const VW = 760, VH = 280, ML = 54, MR = 16, MT = 18, MB = 36;
  const W = VW - ML - MR, H = VH - MT - MB;
  if (years.length === 0) return null;
  const minYear = years[0], maxYear = years[years.length - 1];
  const totals = years.map(y => seriesDef.reduce((s, d) => s + (data[y]?.[d.key] ?? 0), 0));
  const yTickVals = niceMax(Math.max(...totals) * 1.08);
  const maxVal = yTickVals[yTickVals.length - 1];
  const xs = (y: number) => ML + ((y - minYear) / Math.max(maxYear - minYear, 1)) * W;
  const ys = (v: number) => MT + H - (v / Math.max(maxVal, 1)) * H;

  const areaPaths = seriesDef.map((s, si) => {
    const topY = (y: number) => seriesDef.slice(0, si + 1).reduce((sum, d) => sum + (data[y]?.[d.key] ?? 0), 0);
    const botY = (y: number) => si === 0 ? 0 : seriesDef.slice(0, si).reduce((sum, d) => sum + (data[y]?.[d.key] ?? 0), 0);
    const top = years.map((y, i) => `${i ? 'L' : 'M'}${xs(y).toFixed(1)} ${ys(topY(y)).toFixed(1)}`).join(' ');
    const bot = [...years].reverse().map(y => `L${xs(y).toFixed(1)} ${ys(botY(y)).toFixed(1)}`).join(' ');
    return { color: s.color, label: s.label, d: `${top} ${bot} Z` };
  });

  const handleMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const svgX = ((e.clientX - rect.left) / rect.width) * VW;
    const rawYear = minYear + ((svgX - ML) / W) * (maxYear - minYear);
    const clamped = Math.max(minYear, Math.min(maxYear, Math.round(rawYear)));
    const nearest = years.reduce((a, b) => Math.abs(a - clamped) <= Math.abs(b - clamped) ? a : b);
    const values: Record<string, number> = {};
    for (const s of seriesDef) {
      values[s.label] = data[nearest]?.[s.key] ?? 0;
    }
    setHover({ year: nearest, values, x: xs(nearest) });
  }, [years, seriesDef, data, minYear, maxYear]); // eslint-disable-line react-hooks/exhaustive-deps

  const xt = xTicks(minYear, maxYear);
  return (
    <svg viewBox={`0 0 ${VW} ${VH}`} className="w-full" role="img" aria-label="Fossil fuel CO₂ by fuel type"
      onMouseMove={handleMouseMove} onMouseLeave={() => setHover(null)} style={{ cursor: 'crosshair' }}>
      {yTickVals.map(v => <line key={v} x1={ML} y1={ys(v)} x2={VW - MR} y2={ys(v)} stroke="#E8E8ED" strokeWidth={1} />)}
      {yTickVals.map(v => <text key={v} x={ML - 6} y={ys(v)} textAnchor="end" dominantBaseline="middle" fontSize={11} fill="#4A4A6A">{v % 1 === 0 ? v : v.toFixed(1)}</text>)}
      {xt.map(y => <text key={y} x={xs(y)} y={VH - 10} textAnchor="middle" fontSize={11} fill="#4A4A6A">{y}</text>)}
      <text x={12} y={MT + H / 2} textAnchor="middle" fontSize={10} fill="#6B7280" transform={`rotate(-90,12,${MT + H / 2})`}>Mt CO₂</text>
      {areaPaths.map(p => <path key={p.label} d={p.d} fill={p.color} opacity={0.82} />)}
      <line x1={ML} y1={MT} x2={ML} y2={MT + H} stroke="#C8C8D0" strokeWidth={1} />
      <line x1={ML} y1={MT + H} x2={VW - MR} y2={MT + H} stroke="#C8C8D0" strokeWidth={1} />
      {hover && (() => {
        const entries = seriesDef.map(s => ({ label: s.label, color: s.color, value: hover.values[s.label] ?? 0 })).filter(e => e.value > 0);
        const total = entries.reduce((s, e) => s + e.value, 0);
        const TW = 150, lineH = 15;
        const th = 22 + entries.length * lineH + (entries.length > 0 ? lineH + 4 : 0);
        const tx = hover.x + 10 + TW < VW - MR ? hover.x + 10 : hover.x - TW - 10;
        return (
          <g style={{ pointerEvents: 'none' }}>
            <line x1={hover.x} y1={MT} x2={hover.x} y2={MT + H} stroke="#94A3B8" strokeWidth={1} strokeDasharray="4,3" />
            <rect x={tx} y={MT + 4} width={TW} height={th} rx={6} fill="rgba(255,255,255,0.97)" stroke="#E2E8F0" strokeWidth={1} style={{ filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.08))' }} />
            <text x={tx + 10} y={MT + 18} fontSize={11} fontWeight="700" fill="#1A1A2E" fontFamily="monospace">{hover.year}</text>
            {entries.map((e, i) => (
              <g key={e.label}>
                <rect x={tx + 10} y={MT + 26 + i * lineH} width={8} height={8} rx={2} fill={e.color} opacity={0.85} />
                <text x={tx + 22} y={MT + 33 + i * lineH} fontSize={10} fill="#4A4A6A" fontFamily="monospace">{e.label}</text>
                <text x={tx + TW - 10} y={MT + 33 + i * lineH} textAnchor="end" fontSize={10} fill="#1A1A2E" fontWeight="600" fontFamily="monospace">{e.value.toFixed(1)}</text>
              </g>
            ))}
            {entries.length > 0 && (
              <>
                <line x1={tx + 10} y1={MT + 26 + entries.length * lineH + 1} x2={tx + TW - 10} y2={MT + 26 + entries.length * lineH + 1} stroke="#E2E8F0" strokeWidth={1} />
                <text x={tx + 22} y={MT + 33 + entries.length * lineH + 6} fontSize={10} fill="#4A4A6A" fontWeight="600" fontFamily="monospace">Total</text>
                <text x={tx + TW - 10} y={MT + 33 + entries.length * lineH + 6} textAnchor="end" fontSize={10} fill="#1A1A2E" fontWeight="700" fontFamily="monospace">{total.toFixed(1)}</text>
              </>
            )}
          </g>
        );
      })()}
    </svg>
  );
}

// ── Chart: Dual Y-axis Line (Methane + N₂O) ──────────────────────────────────
function DualYLineChart({
  leftData, rightData, leftColor, rightColor, leftUnit, rightUnit,
}: {
  leftData: { year: number; value: number }[];
  rightData: { year: number; value: number }[];
  leftColor: string; rightColor: string;
  leftUnit: string; rightUnit: string;
}) {
  const [hover, setHover] = useState<{ year: number; left: number | null; right: number | null; x: number } | null>(null);

  const VW = 760, VH = 260, ML = 56, MR = 56, MT = 18, MB = 36;
  const W = VW - ML - MR, H = VH - MT - MB;
  const allYears = [...new Set([...leftData.map(d => d.year), ...rightData.map(d => d.year)])].sort((a, b) => a - b);
  if (allYears.length === 0) return null;
  const minYear = allYears[0], maxYear = allYears[allYears.length - 1];
  const xs = (y: number) => ML + ((y - minYear) / Math.max(maxYear - minYear, 1)) * W;
  const lMax = niceMax(Math.max(...leftData.map(d => d.value)) * 1.1);
  const rMax = niceMax(Math.max(...rightData.map(d => d.value)) * 1.1);
  const lMaxV = lMax[lMax.length - 1], rMaxV = rMax[rMax.length - 1];
  const lys = (v: number) => MT + H - (v / Math.max(lMaxV, 1)) * H;
  const rys = (v: number) => MT + H - (v / Math.max(rMaxV, 1)) * H;
  const sortL = [...leftData].sort((a, b) => a.year - b.year);
  const sortR = [...rightData].sort((a, b) => a.year - b.year);
  const pathL = sortL.map((d, i) => `${i ? 'L' : 'M'}${xs(d.year).toFixed(1)} ${lys(d.value).toFixed(1)}`).join(' ');
  const pathR = sortR.map((d, i) => `${i ? 'L' : 'M'}${xs(d.year).toFixed(1)} ${rys(d.value).toFixed(1)}`).join(' ');
  const xt = xTicks(minYear, maxYear);

  const handleMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const svgX = ((e.clientX - rect.left) / rect.width) * VW;
    const rawYear = minYear + ((svgX - ML) / W) * (maxYear - minYear);
    const clamped = Math.max(minYear, Math.min(maxYear, Math.round(rawYear)));
    const nearest = allYears.reduce((a, b) => Math.abs(a - clamped) <= Math.abs(b - clamped) ? a : b);
    const leftPoint = sortL.find(d => d.year === nearest);
    const rightPoint = sortR.find(d => d.year === nearest);
    setHover({ year: nearest, left: leftPoint?.value ?? null, right: rightPoint?.value ?? null, x: xs(nearest) });
  }, [allYears, sortL, sortR, minYear, maxYear]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <svg viewBox={`0 0 ${VW} ${VH}`} className="w-full"
      onMouseMove={handleMouseMove} onMouseLeave={() => setHover(null)} style={{ cursor: 'crosshair' }}>
      {lMax.map(v => <line key={v} x1={ML} y1={lys(v)} x2={VW - MR} y2={lys(v)} stroke="#E8E8ED" strokeWidth={1} />)}
      {lMax.map(v => <text key={v} x={ML - 6} y={lys(v)} textAnchor="end" dominantBaseline="middle" fontSize={11} fill={leftColor}>{v % 1 === 0 ? v : v.toFixed(1)}</text>)}
      {rMax.map(v => <text key={v} x={VW - MR + 6} y={rys(v)} dominantBaseline="middle" fontSize={11} fill={rightColor}>{v % 1 === 0 ? v : v.toFixed(1)}</text>)}
      {xt.map(y => <text key={y} x={xs(y)} y={VH - 10} textAnchor="middle" fontSize={11} fill="#4A4A6A">{y}</text>)}
      <text x={12} y={MT + H / 2} textAnchor="middle" fontSize={10} fill={leftColor} transform={`rotate(-90,12,${MT + H / 2})`}>{leftUnit}</text>
      <text x={VW - 10} y={MT + H / 2} textAnchor="middle" fontSize={10} fill={rightColor} transform={`rotate(90,${VW - 10},${MT + H / 2})`}>{rightUnit}</text>
      <path d={pathL} fill="none" stroke={leftColor} strokeWidth={2.5} />
      <path d={pathR} fill="none" stroke={rightColor} strokeWidth={2.5} />
      <line x1={ML} y1={MT} x2={ML} y2={MT + H} stroke={leftColor} strokeWidth={1} strokeOpacity={0.4} />
      <line x1={VW - MR} y1={MT} x2={VW - MR} y2={MT + H} stroke={rightColor} strokeWidth={1} strokeOpacity={0.4} />
      <line x1={ML} y1={MT + H} x2={VW - MR} y2={MT + H} stroke="#C8C8D0" strokeWidth={1} />
      {hover && (() => {
        const hasLeft = hover.left != null;
        const hasRight = hover.right != null;
        const TW = 150, lineH = 15;
        const rows = (hasLeft ? 1 : 0) + (hasRight ? 1 : 0);
        const th = 22 + rows * lineH;
        const tx = hover.x + 10 + TW < VW - MR ? hover.x + 10 : hover.x - TW - 10;
        return (
          <g style={{ pointerEvents: 'none' }}>
            <line x1={hover.x} y1={MT} x2={hover.x} y2={MT + H} stroke="#94A3B8" strokeWidth={1} strokeDasharray="4,3" />
            {hasLeft && <circle cx={hover.x} cy={lys(hover.left!)} r={4} fill={leftColor} stroke="white" strokeWidth={2} />}
            {hasRight && <circle cx={hover.x} cy={rys(hover.right!)} r={4} fill={rightColor} stroke="white" strokeWidth={2} />}
            <rect x={tx} y={MT + 4} width={TW} height={th} rx={6} fill="rgba(255,255,255,0.97)" stroke="#E2E8F0" strokeWidth={1} style={{ filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.08))' }} />
            <text x={tx + 10} y={MT + 18} fontSize={11} fontWeight="700" fill="#1A1A2E" fontFamily="monospace">{hover.year}</text>
            {hasLeft && (
              <g>
                <rect x={tx + 10} y={MT + 25} width={8} height={8} rx={2} fill={leftColor} />
                <text x={tx + 22} y={MT + 33} fontSize={10} fill="#4A4A6A" fontFamily="monospace">{leftUnit}</text>
                <text x={tx + TW - 10} y={MT + 33} textAnchor="end" fontSize={10} fill={leftColor} fontWeight="600" fontFamily="monospace">{hover.left!.toFixed(1)}</text>
              </g>
            )}
            {hasRight && (
              <g>
                <rect x={tx + 10} y={MT + 25 + (hasLeft ? lineH : 0)} width={8} height={8} rx={2} fill={rightColor} />
                <text x={tx + 22} y={MT + 33 + (hasLeft ? lineH : 0)} fontSize={10} fill="#4A4A6A" fontFamily="monospace">{rightUnit}</text>
                <text x={tx + TW - 10} y={MT + 33 + (hasLeft ? lineH : 0)} textAnchor="end" fontSize={10} fill={rightColor} fontWeight="600" fontFamily="monospace">{hover.right!.toFixed(1)}</text>
              </g>
            )}
          </g>
        );
      })()}
    </svg>
  );
}

// ── Chart: Vulnerability Scatter (pure React SVG) ─────────────────────────────
function VulnerabilityScatter({ data, highlightIso3 }: {
  data: { iso3: string; name: string; vulnerability: number; readiness: number }[];
  highlightIso3: string;
}) {
  const [hover, setHover] = useState<{ iso3: string; name: string; vuln: number; ready: number; color: string; x: number; y: number } | null>(null);

  const VW = 640, VH = 320, ML = 60, MR = 20, MT = 16, MB = 50;
  const W = VW - ML - MR, H = VH - MT - MB;
  if (data.length === 0) return null;
  const vulns = data.map(d => d.vulnerability), reads = data.map(d => d.readiness);
  const minV = Math.min(...vulns) * 0.95, maxV = Math.max(...vulns) * 1.05;
  const minR = Math.min(...reads) * 0.95, maxR = Math.max(...reads) * 1.05;
  const xs = (v: number) => ML + ((v - minV) / (maxV - minV)) * W;
  const ys = (r: number) => MT + H - ((r - minR) / (maxR - minR)) * H;
  const vt = [minV, (minV + maxV) / 2, maxV].map(v => Math.round(v * 1000) / 1000);
  const rt = [minR, (minR + maxR) / 2, maxR].map(v => Math.round(v * 1000) / 1000);

  return (
    <svg viewBox={`0 0 ${VW} ${VH}`} className="w-full" onMouseLeave={() => setHover(null)} style={{ cursor: 'default' }}>
      <defs>
        <filter id="scatter-glow">
          <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      {[0.33, 0.66].map(f => {
        const v = minV + f * (maxV - minV), r = minR + f * (maxR - minR);
        return <g key={f}>
          <line x1={ML} y1={ys(r)} x2={VW - MR} y2={ys(r)} stroke="#E8E8ED" strokeWidth={1} />
          <line x1={xs(v)} y1={MT} x2={xs(v)} y2={MT + H} stroke="#E8E8ED" strokeWidth={1} />
        </g>;
      })}
      {vt.map(v => <text key={v} x={xs(v)} y={MT + H + 16} textAnchor="middle" fontSize={11} fill="#4A4A6A">{v}</text>)}
      {rt.map(r => <text key={r} x={ML - 6} y={ys(r)} textAnchor="end" dominantBaseline="middle" fontSize={11} fill="#4A4A6A">{r}</text>)}
      <text x={VW / 2} y={VH - 8} textAnchor="middle" fontSize={12} fill="#4A4A6A">Vulnerability &#x2192;</text>
      <text x={14} y={MT + H / 2} textAnchor="middle" fontSize={12} fill="#4A4A6A" transform={`rotate(-90,14,${MT + H / 2})`}>Readiness &#x2192;</text>

      {data.filter(d => d.iso3 !== highlightIso3).map(d => {
        const cx = xs(d.vulnerability), cy = ys(d.readiness);
        const isHov = hover?.iso3 === d.iso3;
        return (
          <g key={d.iso3} style={{ cursor: 'pointer' }}
            onMouseEnter={() => setHover({ iso3: d.iso3, name: d.name, vuln: d.vulnerability, ready: d.readiness, color: '#94A3B8', x: cx, y: cy })}
            onMouseLeave={() => setHover(null)}
          >
            <circle cx={cx} cy={cy} r={16} fill="transparent" />
            <circle cx={cx} cy={cy} r={isHov ? 6 : 4}
              fill="#94A3B8" stroke={isHov ? '#1A1A2E' : 'white'} strokeWidth={isHov ? 2 : 1}
              opacity={isHov ? 1 : 0.6} />
            {isHov && (
              <text x={cx} y={cy - 10} textAnchor="middle"
                fontSize={11} fill="#1A1A2E" fontWeight="600">{d.name}</text>
            )}
          </g>
        );
      })}

      {data.filter(d => d.iso3 === highlightIso3).map(d => {
        const cx = xs(d.vulnerability), cy = ys(d.readiness);
        const color = '#0066FF';
        return (
          <g key={d.iso3}
            onMouseEnter={() => setHover({ iso3: d.iso3, name: d.name, vuln: d.vulnerability, ready: d.readiness, color, x: cx, y: cy })}
            onMouseLeave={() => setHover(null)}
          >
            <circle cx={cx} cy={cy} r={16}
              fill={color} opacity={0.15} filter="url(#scatter-glow)" />
            <circle cx={cx} cy={cy} r={8}
              fill={color} stroke="#1A1A2E" strokeWidth={3}
              style={{ filter: `drop-shadow(0 2px 8px ${color}60)` }} />
            <text x={cx} y={cy - 16} textAnchor="middle"
              fontSize={13} fill="#1A1A2E" fontWeight="700">{d.name}</text>
          </g>
        );
      })}

      <line x1={ML} y1={MT} x2={ML} y2={MT + H} stroke="#C8C8D0" strokeWidth={1} />
      <line x1={ML} y1={MT + H} x2={VW - MR} y2={MT + H} stroke="#C8C8D0" strokeWidth={1} />
      {hover && (() => {
        const TW = 160, TH = 52;
        const tx = hover.x + 12 + TW < VW - MR ? hover.x + 12 : hover.x - TW - 12;
        const ty = Math.max(MT + 2, Math.min(MT + H - TH - 2, hover.y - TH / 2));
        return (
          <g style={{ pointerEvents: 'none' }}>
            <line x1={ML} y1={hover.y} x2={VW - MR} y2={hover.y} stroke="#CBD5E1" strokeWidth={1} strokeDasharray="3,3" strokeOpacity={0.5} />
            <line x1={hover.x} y1={MT} x2={hover.x} y2={MT + H} stroke="#CBD5E1" strokeWidth={1} strokeDasharray="3,3" strokeOpacity={0.5} />
            <rect x={tx} y={ty} width={TW} height={TH} rx={6} fill="rgba(255,255,255,0.97)" stroke="#E2E8F0" strokeWidth={1} style={{ filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.08))' }} />
            <circle cx={tx + 14} cy={ty + 14} r={5} fill={hover.color} />
            <text x={tx + 24} y={ty + 18} fontSize={11} fontWeight="700" fill="#1A1A2E">{hover.name}</text>
            <text x={tx + 10} y={ty + 34} fontSize={10} fill="#4A4A6A" fontFamily="monospace">Vuln</text>
            <text x={tx + TW / 2 - 4} y={ty + 34} textAnchor="end" fontSize={10} fill="#8B5CF6" fontWeight="600" fontFamily="monospace">{hover.vuln.toFixed(3)}</text>
            <text x={tx + TW / 2 + 4} y={ty + 34} fontSize={10} fill="#4A4A6A" fontFamily="monospace">Ready</text>
            <text x={tx + TW - 10} y={ty + 34} textAnchor="end" fontSize={10} fill="#10B981" fontWeight="600" fontFamily="monospace">{hover.ready.toFixed(3)}</text>
            <text x={tx + 10} y={ty + 47} fontSize={9} fill="#94A3B8" fontFamily="monospace">
              {hover.vuln < 0.35 ? 'Low vulnerability' : hover.vuln < 0.45 ? 'Moderate vulnerability' : 'High vulnerability'}
            </text>
          </g>
        );
      })()}
    </svg>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export function CountryClient({
  countryName, iso3, wbCo2Series, co2Comparison, gdpVsCo2,
  emberMix, renewableChange, scatterData, decouplingSeries, decouplingScore, pm25 = null,
  carbonIntensity = null, initialExtra, climateGapData,
}: CountryClientProps) {

  const [extra, setExtra] = useState<ExtraData>(initialExtra ?? EMPTY_EXTRA);
  const [showNdcGap, setShowNdcGap] = useState(false);
  const [showKaya, setShowKaya] = useState(false);
  const [showEquity, setShowEquity] = useState(false);

  useEffect(() => {
    // Skip OWID/CTRACE client-side fetch if server provided initial data
    const hasServerExtra = initialExtra &&
      (Object.keys(initialExtra.ctraceByCode).length > 0 ||
       initialExtra.methaneSeries.length > 0 ||
       initialExtra.cumulativeCo2 != null ||
       Object.values(initialExtra.fuelSeries).some(s => s.length > 0));

    if (!hasServerExtra) {
    const supabase = createClient();
    const codes = [
      'OWID.CONSUMPTION_CO2_PER_CAPITA',
      ...CTRACE_CODES,
      'CTRACE.TOTAL',
      ...FUEL_SERIES.map(f => f.key),
      'OWID.CUMULATIVE_CO2', 'OWID.SHARE_GLOBAL_CUMULATIVE_CO2',
      'OWID.TEMPERATURE_CHANGE_FROM_GHG', 'OWID.TEMPERATURE_CHANGE_FROM_CO2',
      'OWID.TEMPERATURE_CHANGE_FROM_CH4', 'OWID.TEMPERATURE_CHANGE_FROM_N2O',
      'OWID.METHANE', 'OWID.NITROUS_OXIDE', 'OWID.TOTAL_GHG', 'OWID.GHG_PER_CAPITA',
      'OWID.CO2_PER_GDP',
    ];

    (async () => {
      try {
        const { data: rows, error } = await supabase
          .from('country_data')
          .select('indicator_code, year, value')
          .eq('country_iso3', iso3)
          .in('indicator_code', codes)
          .order('year', { ascending: true });
        if (error) {
          console.error('[Supabase extra fetch] API error:', error.message, error);
          return;
        }
        if (!rows || rows.length === 0) {
          console.warn('[Supabase extra fetch] no rows for', iso3);
          return;
        }
        const grouped: Record<string, { year: number; value: number }[]> = {};
        const latest: Record<string, { year: number; value: number }> = {};
        for (const r of rows) {
          if (r.value == null) continue;
          const v = Number(r.value);
          if (isNaN(v)) continue;
          if (!grouped[r.indicator_code]) grouped[r.indicator_code] = [];
          grouped[r.indicator_code].push({ year: r.year, value: v });
          if (!latest[r.indicator_code] || r.year > latest[r.indicator_code].year) {
            latest[r.indicator_code] = { year: r.year, value: v };
          }
        }
        const ctraceByCode: Record<string, number> = {};
        for (const code of CTRACE_CODES) {
          if (latest[code]) ctraceByCode[code] = latest[code].value;
        }
        const fuelSeries: Record<string, { year: number; value: number }[]> = {};
        for (const f of FUEL_SERIES) { fuelSeries[f.key] = grouped[f.key] ?? []; }
        setExtra({
          consumptionCo2: grouped['OWID.CONSUMPTION_CO2_PER_CAPITA'] ?? [],
          ctraceByCode, ctraceYear: latest['CTRACE.POWER']?.year ?? null,
          fuelSeries,
          cumulativeCo2: latest['OWID.CUMULATIVE_CO2']?.value ?? null,
          shareCumulative: latest['OWID.SHARE_GLOBAL_CUMULATIVE_CO2']?.value ?? null,
          tempGhg: latest['OWID.TEMPERATURE_CHANGE_FROM_GHG']?.value ?? null,
          tempCo2: latest['OWID.TEMPERATURE_CHANGE_FROM_CO2']?.value ?? null,
          tempCh4: latest['OWID.TEMPERATURE_CHANGE_FROM_CH4']?.value ?? null,
          tempN2o: latest['OWID.TEMPERATURE_CHANGE_FROM_N2O']?.value ?? null,
          methaneSeries: grouped['OWID.METHANE'] ?? [],
          n2oSeries: grouped['OWID.NITROUS_OXIDE'] ?? [],
          totalGhgLatest: latest['OWID.TOTAL_GHG']?.value ?? null,
          ghgPerCapitaLatest: latest['OWID.GHG_PER_CAPITA']?.value ?? null,
          co2PerGdpSeries: grouped['OWID.CO2_PER_GDP'] ?? [],
        });
      } catch (err) {
        console.error('[Supabase extra fetch] caught:', err);
      }
    })();
    } // end if (!hasServerExtra)

    // Check for NDC Gap data
    fetch(`/data/ndc-gap/${iso3}.json`)
      .then(res => res.ok ? res.json() : null)
      .then(d => { if (d?.historical?.length > 0) setShowNdcGap(true); })
      .catch(() => { /* no NDC data */ });

    // Check for Kaya data
    fetch(`/data/kaya/${iso3}.json`)
      .then(res => res.ok ? res.json() : null)
      .then(d => { if (d?.waterfall?.length > 0) setShowKaya(true); })
      .catch(() => { /* no Kaya data */ });

    // Check for Equity data
    fetch('/data/equity-scatter.json')
      .then(res => res.ok ? res.json() : null)
      .then(d => { if (d?.countries?.length > 0) setShowEquity(true); })
      .catch(() => { /* no equity data */ });
  }, [iso3]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Derived: emissions-trend JSON ───────────────────────────────────────────
  const preParisRaw = emissionsTrend.pre_paris_vs_post_paris;
  const parisData = iso3 in preParisRaw ? preParisRaw[iso3 as keyof typeof preParisRaw] : null;
  const cagrRaw = emissionsTrend.cagr_2000_2023;
  const cagrData = iso3 in cagrRaw ? cagrRaw[iso3 as keyof typeof cagrRaw] : null;
  const decouplingRaw = emissionsTrend.decoupling_score;
  const decouplingEntry = iso3 in decouplingRaw ? decouplingRaw[iso3 as keyof typeof decouplingRaw] : null;
  const transitionEntry = emissionsTrend.energy_transition_ranking.find(d => d.country === iso3) ?? null;
  const sortedAccels = Object.values(preParisRaw).map(d => d.acceleration).sort((a, b) => a - b);
  const accelRank = parisData ? sortedAccels.indexOf(parisData.acceleration) + 1 : null;
  const riskProfile = iso3 in RISK_PROFILES ? RISK_PROFILES[iso3 as keyof typeof RISK_PROFILES] : null;
  const myScatter = scatterData.find(d => d.iso3 === iso3) ?? null;
  const readinessRank = myScatter
    ? [...scatterData].sort((a, b) => b.readiness - a.readiness).findIndex(d => d.iso3 === iso3) + 1
    : null;

  // ── Derived: CTRACE bars ────────────────────────────────────────────────────
  const ctraceBars = Object.entries(extra.ctraceByCode)
    .filter(([code]) => SECTOR_META[code])
    .map(([code, value]) => ({
      label: SECTOR_META[code].label,
      color: SECTOR_META[code].color,
      value,
    }))
    .sort((a, b) => b.value - a.value);
  const ctraceTotal = extra.ctraceByCode['CTRACE.TOTAL'] ?? ctraceBars.reduce((s, b) => s + b.value, 0);
  const ctraceBarsWithPct = ctraceBars.map(b => ({ ...b, pct: ctraceTotal > 0 ? (b.value / ctraceTotal) * 100 : 0 }));

  // ── Derived: Fuel stacked area ──────────────────────────────────────────────
  const fuelYears = [...new Set(
    FUEL_SERIES.flatMap(f => (extra.fuelSeries[f.key] ?? []).map(d => d.year))
  )].sort((a, b) => a - b);
  const fuelData: Record<number, Record<string, number>> = {};
  for (const y of fuelYears) {
    fuelData[y] = {};
    for (const f of FUEL_SERIES) {
      const row = (extra.fuelSeries[f.key] ?? []).find(d => d.year === y);
      if (row) fuelData[y][f.key] = row.value;
    }
  }
  const hasFuelData = fuelYears.length > 0;

  // ── Derived: Temperature contribution stack bar ─────────────────────────────
  const tempTotal = (extra.tempCo2 ?? 0) + (extra.tempCh4 ?? 0) + (extra.tempN2o ?? 0);
  const tempBar = tempTotal > 0 ? [
    { label: 'CO\u2082', value: extra.tempCo2 ?? 0, color: '#EF4444' },
    { label: 'CH\u2084', value: extra.tempCh4 ?? 0, color: '#F59E0B' },
    { label: 'N\u2082O', value: extra.tempN2o ?? 0, color: '#8B5CF6' },
  ] : [];

  const latestCo2 = wbCo2Series.length > 0 ? wbCo2Series[wbCo2Series.length - 1].value : null;
  const latestYear = wbCo2Series.length > 0 ? wbCo2Series[wbCo2Series.length - 1].year : 2023;
  const latestRenewable = emberMix?.renewable ?? null;

  // Build hero stats dynamically
  const heroStats: { label: string; value: string }[] = [];
  if (latestCo2 != null) heroStats.push({ label: 'CO\u2082/capita', value: `${latestCo2.toFixed(1)}t` });
  if (latestRenewable != null) heroStats.push({ label: 'Renewable', value: `${latestRenewable.toFixed(1)}%` });
  if (decouplingScore != null) heroStats.push({ label: 'Decoupling', value: signed(decouplingScore) });

  return (
    <PageWrapper>
      {/* ═══════════════════════════════════════ HERO ═══════════════════════════════════════ */}
      <HeroSection
        countryName={countryName}
        heroNumber={latestCo2 ?? 0}
        heroDecimals={1}
        heroSuffix="t"
        heroLabel={`CO\u2082 per capita, ${latestYear}`}
        stats={heroStats}
        backgroundContent={
          <div className="w-full max-w-[1400px]">
            <SafeChart name="Emissions">
              <EmissionsLineChart production={wbCo2Series} consumption={extra.consumptionCo2} countryName={countryName} strokeW={3} />
            </SafeChart>
          </div>
        }
      />

      {/* ═══════════════════════════════════════ EMISSIONS ═══════════════════════════════════════ */}
      <SectionHeader
        category="emissions"
        title="Emissions Trajectory"
        subtitle="Emissions are shifting. But is it enough?"
      />

      {/* CO₂ per capita line chart */}
      <StoryBlock
        layout="text-left"
        insight={
          <InsightPanel tag="Pre-Paris (2000-2014)" tagColor="text-emerald-600">
            <p>
              {parisData
                ? <><strong>{countryName}&apos;s emissions</strong> grew at <span className="font-mono font-bold">{signed(parisData.pre_paris_cagr_pct)}%/yr</span>.{cagrData ? ` The long-term CAGR (2000-2023) was ${signed(cagrData.cagr_pct)}%/yr.` : ''}</>
                : <>{countryName}&apos;s emissions trajectory is being tracked across multiple data sources.</>
              }
            </p>
            {parisData && (
              <p className="mt-3">
                Post-Paris, the rate shifted to{' '}
                <strong className={parisData.post_paris_cagr_pct < 0 ? 'text-emerald-600' : 'text-red-600'}>
                  {signed(parisData.post_paris_cagr_pct)}%/yr
                </strong>{' '}
                &mdash; a <strong>{signed(parisData.acceleration)}pp shift</strong>.
                {cagrData ? ` Per capita emissions reached ${parisData.value_2023.toFixed(1)}t in 2023.` : ''}
              </p>
            )}
          </InsightPanel>
        }
      >
        <ChartCard
          category="emissions"
          title={`${countryName} \u2014 CO\u2082 per capita (2000-${latestYear})`}
          subtitle={`Source: World Bank WDI${extra.consumptionCo2.length > 0 ? ' + OWID Consumption' : ''}`}
        >
          <div className="mb-3 flex flex-wrap items-center gap-4 text-xs">
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-0.5 w-5 rounded bg-[#EF4444]" />
              <span className="text-slate-500">Production-based</span>
            </span>
            {extra.consumptionCo2.length > 0 && (
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-0.5 w-5 rounded bg-[#8B5CF6]" style={{ borderTop: '2px dashed #8B5CF6', background: 'transparent' }} />
                <span className="text-slate-500">Consumption-based</span>
              </span>
            )}
          </div>
          <SafeChart name="Emissions">
            <EmissionsLineChart production={wbCo2Series} consumption={extra.consumptionCo2} countryName={countryName} />
          </SafeChart>
        </ChartCard>
      </StoryBlock>

      {/* Pre-Paris vs Post-Paris */}
      <StoryBlock
        layout="text-right"
        delay={0.05}
        insight={
          <InsightPanel tag="Post-Paris Shift" tagColor="text-emerald-600">
            <p>
              {accelRank !== null
                ? `This ranks ${ordinal(accelRank)} largest deceleration among tracked countries.`
                : `${countryName}'s emissions trajectory reflects ongoing energy transition dynamics.`}
              {cagrData ? ` Overall change since 2000: ${cagrData.total_change_pct > 0 ? '+' : ''}${cagrData.total_change_pct.toFixed(1)}%.` : ''}
            </p>
          </InsightPanel>
        }
      >
        <ChartCard
          category="emissions"
          title="Pre-Paris vs Post-Paris CAGR"
          badge="Key Comparison"
        >
          <SafeChart name="Climate Gap">
            <ClimateGap highlightIso3={iso3} serverData={climateGapData} />
          </SafeChart>
          <SourceLabel>Source: World Bank WDI</SourceLabel>
        </ChartCard>
      </StoryBlock>

      {/* WB vs Climate TRACE comparison */}
      {co2Comparison.length > 0 && (
        <StoryBlock layout="full" delay={0.05}>
          <ChartCard
            category="emissions"
            title="World Bank vs Climate TRACE"
            subtitle="CO₂ per capita comparison"
          >
            <div className="mb-3 flex flex-wrap items-center gap-4 text-xs">
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-0.5 w-5 rounded bg-[#0066FF]" />
                <span className="text-slate-500">World Bank (WDI)</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-0.5 w-5 rounded bg-[#EF4444]" style={{ borderTop: '2px dashed #EF4444', background: 'transparent' }} />
                <span className="text-slate-500">Climate TRACE</span>
              </span>
            </div>
            <SafeChart name="WB vs CT">
              <IndexedDualLineChart
                data={co2Comparison.map(d => ({ year: d.year, a: d.wb, b: d.ct }))}
                aColor="#0066FF" bColor="#EF4444"
                aLabel="World Bank" bLabel="Climate TRACE"
                yAxisLabel="t CO₂e/capita"
              />
            </SafeChart>
            <SourceLabel>Source: World Bank WDI vs Climate TRACE v7</SourceLabel>
          </ChartCard>
        </StoryBlock>
      )}

      {/* NDC Gap if available */}
      {showNdcGap && (
        <StoryBlock layout="full" delay={0.05}>
          <ChartErrorBoundary fallback={null}>
            <ChartCard
              category="emissions"
              title={`${countryName} \u2014 NDC Target vs Projection`}
              subtitle="Source: UNFCCC NDC Registry"
            >
              <NDCGapChart iso3={iso3} />
            </ChartCard>
          </ChartErrorBoundary>
        </StoryBlock>
      )}

      {/* Emissions by Sector */}
      {ctraceBarsWithPct.length > 0 && (
        <>
          <StoryBlock
            layout="text-left"
            delay={0.05}
            insight={
              <InsightPanel tag="Sector Breakdown" tagColor="text-emerald-600">
                <p>
                  {ctraceBarsWithPct[0] && (
                    <><strong>{ctraceBarsWithPct[0].label}</strong> dominates at <strong>{ctraceBarsWithPct[0].pct.toFixed(1)}%</strong> of total emissions. </>
                  )}
                  {ctraceBarsWithPct[1] && (
                    <><strong>{ctraceBarsWithPct[1].label}</strong> follows at <strong>{ctraceBarsWithPct[1].pct.toFixed(1)}%</strong>.</>
                  )}
                  {ctraceTotal > 0 && (
                    <> Total: {ctraceTotal >= 1000 ? `${(ctraceTotal / 1000).toFixed(2)} Gt` : `${ctraceTotal.toFixed(1)} Mt`} CO₂e.</>
                  )}
                </p>
              </InsightPanel>
            }
          >
            <ChartCard
              category="emissions"
              title={`Emissions by Sector ${extra.ctraceYear ? `(${extra.ctraceYear})` : ''}`}
              subtitle="Source: Climate TRACE v7"
              badge={ctraceTotal > 0 ? `${ctraceTotal >= 1000 ? `${(ctraceTotal / 1000).toFixed(2)} Gt` : `${ctraceTotal.toFixed(1)} Mt`}` : undefined}
            >
              <SafeChart name="Sector Emissions">
                <HorizontalBarChart bars={ctraceBarsWithPct} />
              </SafeChart>
            </ChartCard>
          </StoryBlock>
        </>
      )}

      {/* Fossil CO₂ by Fuel */}
      {hasFuelData && (
        <StoryBlock
          layout="text-left"
          delay={0.05}
          insight={
            <InsightPanel tag="Fossil Fuel Mix" tagColor="text-emerald-600">
              <p>
                {emberMix ? (
                  <>Fossil fuels still make up <strong>{emberMix.fossil.toFixed(1)}%</strong> of the electricity mix.</>
                ) : (
                  <>Historical fossil fuel CO₂ breakdown shows the evolving energy mix.</>
                )}
                {FUEL_SERIES[0] && fuelYears.length > 0 && (() => {
                  const lastYear = fuelYears[fuelYears.length - 1];
                  const vals = FUEL_SERIES.map(f => ({
                    label: f.label,
                    value: fuelData[lastYear]?.[f.key] ?? 0,
                  })).sort((a, b) => b.value - a.value);
                  const top = vals[0];
                  return top.value > 0
                    ? ` In ${lastYear}, ${top.label} was the dominant source at ${top.value.toFixed(1)} Mt CO₂.`
                    : '';
                })()}
              </p>
            </InsightPanel>
          }
        >
          <ChartCard
            category="emissions"
            title="Fossil CO₂ by Fuel Type"
            subtitle="Source: Our World in Data"
          >
            <div className="mb-4 flex flex-wrap items-center gap-4 text-xs">
              {FUEL_SERIES.map(f => (
                <span key={f.key} className="flex items-center gap-1.5">
                  <span className="inline-block h-3 w-3 rounded-sm" style={{ backgroundColor: f.color }} />
                  <span className="text-slate-500">{f.label}</span>
                </span>
              ))}
            </div>
            <SafeChart name="Fuel Breakdown">
              <StackedAreaChart years={fuelYears} seriesDef={FUEL_SERIES} data={fuelData} />
            </SafeChart>
          </ChartCard>
        </StoryBlock>
      )}

      {/* ═══════════════════════════════════════ ENERGY ═══════════════════════════════════════ */}
      {emberMix && (
        <>
          <SectionHeader
            category="energy"
            title="Energy Transition"
            subtitle="The energy transition is underway."
          />

          <StoryBlock
            layout="text-right"
            insight={
              <InsightPanel tag="Renewables Progress" tagColor="text-amber-600">
                <p>
                  <strong className="text-emerald-600">{emberMix.renewable.toFixed(1)}%</strong> of electricity
                  comes from renewables.
                  {renewableChange != null && (
                    <> That is <strong className={renewableChange > 0 ? 'text-emerald-600' : 'text-red-600'}>
                      {renewableChange > 0 ? '+' : ''}{renewableChange.toFixed(1)}pp
                    </strong> over 5 years.</>
                  )}
                  {' '}Fossil fuels still make up <strong>{emberMix.fossil.toFixed(1)}%</strong>.
                </p>
                <p className="mt-3">
                  {carbonIntensity != null ? (
                    <>Carbon intensity: <strong className={carbonIntensity < 100 ? 'text-emerald-600' : carbonIntensity < 300 ? 'text-amber-600' : 'text-red-600'}>{carbonIntensity.toFixed(0)} gCO₂/kWh</strong>.</>
                  ) : (
                    <>Nuclear and other sources make up <strong>{emberMix.other.toFixed(1)}%</strong> of the mix.</>
                  )}
                  {transitionEntry && ` Renewable transition ranks ${ordinal(transitionEntry.rank)}.`}
                </p>
              </InsightPanel>
            }
          >
            <ChartCard
              category="energy"
              title={`Electricity Generation Mix (${emberMix.year})`}
              subtitle={`Source: Ember Global Electricity Review (${emberMix.year})`}
            >
              <SafeChart name="Sankey">
                <ClimateSankey
                  country={countryName}
                  fossil={emberMix.fossil}
                  renewable={emberMix.renewable}
                  nuclear={emberMix.other}
                />
              </SafeChart>
            </ChartCard>
          </StoryBlock>

          {/* Energy stat metrics */}
          <StoryBlock layout="full" delay={0.05}>
            <MetricRow
              metrics={[
                { value: `${emberMix.renewable.toFixed(1)}%`, label: 'Renewable Share', sub: renewableChange != null ? `${renewableChange > 0 ? '+' : ''}${renewableChange.toFixed(1)}pp over 5yr` : undefined },
                { value: `${emberMix.fossil.toFixed(1)}%`, label: 'Fossil Fuel Share' },
                { value: `${emberMix.other.toFixed(1)}%`, label: 'Nuclear & Other' },
                ...(carbonIntensity != null ? [{ value: `${carbonIntensity.toFixed(0)}`, label: 'gCO₂/kWh', sub: carbonIntensity < 100 ? 'Low-carbon' : carbonIntensity < 300 ? 'Moderate' : 'High-carbon' }] : []),
              ]}
            />
          </StoryBlock>
        </>
      )}

      {/* ═══════════════════════════════════════ ECONOMY ═══════════════════════════════════════ */}
      {(gdpVsCo2.length > 0 || extra.cumulativeCo2 != null || extra.methaneSeries.length > 0) && (
        <>
          <SectionHeader
            category="economy"
            title="Economic Decoupling"
            subtitle="Is GDP growth decoupled from emissions growth?"
          />

          {/* GDP vs CO₂ Triple Line */}
          {gdpVsCo2.length > 0 && (
            <StoryBlock
              layout="text-right"
              insight={
                <InsightPanel tag="Decoupling Score" tagColor="text-blue-600">
                  <p>
                    {decouplingScore != null ? (
                      <>Score: <strong className="text-emerald-600">{signed(decouplingScore)}</strong>.</>
                    ) : (
                      <>GDP and CO₂ trends reveal the decoupling trajectory.</>
                    )}
                    {decouplingEntry && (
                      <> {countryName} shows <strong>{decouplingEntry.interpretation.toLowerCase()}</strong>. GDP grew faster than emissions by <strong>{signed(decouplingEntry.avg_decoupling_2015_2023)}pp/yr</strong> since 2015 ({ordinal(decouplingEntry.rank)} among tracked countries).</>
                    )}
                  </p>
                </InsightPanel>
              }
            >
              <ChartCard
                category="economy"
                title="GDP vs CO₂ Growth"
                badge="Decoupling"
                subtitle={`Indexed to ${gdpVsCo2[0]?.year ?? 2000}=100`}
              >
                <div className="mb-3 flex flex-wrap items-center gap-4 text-xs">
                  <span className="flex items-center gap-1.5">
                    <span className="inline-block h-2 w-2 rounded-full bg-[#00A67E]" />
                    <span className="text-slate-500">GDP per capita</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="inline-block h-2 w-2 rounded-full bg-[#E5484D]" />
                    <span className="text-slate-500">CO₂ per capita</span>
                  </span>
                  {extra.co2PerGdpSeries.length > 0 && (
                    <span className="flex items-center gap-1.5">
                      <span className="inline-block h-2 w-2 rounded-full bg-[#F59E0B]" />
                      <span className="text-slate-500">Carbon Intensity of GDP</span>
                    </span>
                  )}
                </div>
                <SafeChart name="GDP vs CO₂">
                  <IndexedTripleLineChart
                    gdpCo2={gdpVsCo2}
                    co2PerGdp={extra.co2PerGdpSeries}
                    baseYear={gdpVsCo2[0]?.year ?? 2000}
                  />
                </SafeChart>
                <SourceLabel>Source: World Bank WDI{extra.co2PerGdpSeries.length > 0 ? ' + OWID CO₂/GDP' : ''}</SourceLabel>
              </ChartCard>
            </StoryBlock>
          )}

          {/* Historical Responsibility Metrics */}
          {(extra.cumulativeCo2 != null || extra.shareCumulative != null || extra.tempGhg != null) && (
            <StoryBlock layout="full" delay={0.05}>
              <MetricRow
                metrics={[
                  { value: extra.cumulativeCo2 != null ? `${(extra.cumulativeCo2 / 1000).toFixed(1)} Gt` : '\u2014', label: 'Cumulative CO₂', sub: 'Total since 1850' },
                  { value: extra.shareCumulative != null ? `${extra.shareCumulative.toFixed(2)}%` : '\u2014', label: 'Share of global', sub: 'Cumulative share since 1850' },
                  { value: extra.tempGhg != null ? `${extra.tempGhg.toFixed(3)}\u00B0C` : '\u2014', label: 'Warming caused', sub: 'by this country' },
                ]}
              />
            </StoryBlock>
          )}

          {/* Temperature Contribution by Gas */}
          {tempBar.length > 0 && (
            <StoryBlock
              layout="text-left"
              delay={0.05}
              insight={
                <InsightPanel tag="Gas Breakdown" tagColor="text-amber-600">
                  <p>
                    CO₂ dominates the warming contribution, followed by methane. N₂O contribution is relatively small.
                    {extra.tempGhg != null && ` Total warming contribution: ${extra.tempGhg.toFixed(3)}°C.`}
                  </p>
                </InsightPanel>
              }
            >
              <ChartCard
                category="energy"
                title="Temperature Contribution by Gas"
                subtitle="Source: Our World in Data"
              >
                <div className="space-y-3">
                  {tempBar.map(g => (
                    <div key={g.label}>
                      <div className="mb-1 flex items-center justify-between text-xs">
                        <span className="flex items-center gap-1.5">
                          <span className="inline-block h-3 w-3 rounded-sm" style={{ backgroundColor: g.color }} />
                          <span className="text-slate-500">{g.label}</span>
                        </span>
                        <span className="font-mono font-medium text-slate-700">{g.value.toFixed(3)}°C ({tempTotal > 0 ? ((g.value / tempTotal) * 100).toFixed(0) : 0}%)</span>
                      </div>
                      <div className="h-4 rounded-full bg-slate-100">
                        <div className="h-4 rounded-full" style={{ width: `${tempTotal > 0 ? (g.value / tempTotal) * 100 : 0}%`, backgroundColor: g.color, opacity: 0.85 }} />
                      </div>
                    </div>
                  ))}
                </div>
              </ChartCard>
            </StoryBlock>
          )}

          {/* GHG Stats */}
          {(extra.totalGhgLatest != null || extra.ghgPerCapitaLatest != null) && (
            <StoryBlock layout="full" delay={0.05}>
              <MetricRow
                metrics={[
                  ...(extra.totalGhgLatest != null ? [{
                    value: extra.totalGhgLatest >= 1000 ? `${(extra.totalGhgLatest / 1000).toFixed(2)} Gt` : `${extra.totalGhgLatest.toFixed(1)} Mt`,
                    label: 'Total GHG',
                    sub: 'All greenhouse gases',
                  }] : []),
                  ...(extra.ghgPerCapitaLatest != null ? [{
                    value: `${extra.ghgPerCapitaLatest.toFixed(1)}`,
                    label: 'tCO₂e/capita',
                    sub: 'Total GHG per person',
                  }] : []),
                  ...(accelRank != null ? [{
                    value: ordinal(accelRank),
                    label: 'Global rank',
                    sub: 'Largest deceleration',
                  }] : []),
                ]}
              />
            </StoryBlock>
          )}

          {/* Methane & N₂O */}
          {extra.methaneSeries.length > 0 && extra.n2oSeries.length > 0 && (
            <StoryBlock layout="full" delay={0.05}>
              <ChartCard
                category="energy"
                title="Methane & Nitrous Oxide"
                subtitle="Source: Our World in Data"
              >
                <div className="mb-3 flex flex-wrap items-center gap-4 text-xs">
                  <span className="flex items-center gap-1.5">
                    <span className="inline-block h-3 w-3 rounded-sm bg-[#F59E0B]" />
                    <span className="text-slate-500">Methane (left axis)</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="inline-block h-3 w-3 rounded-sm bg-[#8B5CF6]" />
                    <span className="text-slate-500">Nitrous Oxide (right axis)</span>
                  </span>
                </div>
                <SafeChart name="Methane & N₂O">
                  <DualYLineChart
                    leftData={extra.methaneSeries} rightData={extra.n2oSeries}
                    leftColor="#F59E0B" rightColor="#8B5CF6"
                    leftUnit="CH₄ Mt" rightUnit="N₂O Mt"
                  />
                </SafeChart>
              </ChartCard>
            </StoryBlock>
          )}
        </>
      )}

      {/* ═══════════════════════════════════════ VULNERABILITY ═══════════════════════════════════════ */}
      <SectionHeader
        category="vulnerability"
        title="Climate Vulnerability & Resilience"
        subtitle={`How prepared is ${countryName}?`}
      />

      {/* Kaya Waterfall */}
      {showKaya && (
        <StoryBlock layout="full">
          <ChartCard
            category="vulnerability"
            title={`Why Did Emissions Change? \u2014 ${countryName} LMDI Factor Decomposition`}
            subtitle="Source: World Bank WDI + Ember + OWID (Kaya Identity)"
          >
            <SafeChart name="Kaya Waterfall">
              <KayaWaterfall iso3={iso3} />
            </SafeChart>
          </ChartCard>
        </StoryBlock>
      )}

      {/* Vulnerability Scatter */}
      <StoryBlock
        layout="text-left"
        insight={
          <InsightPanel tag="Readiness & Vulnerability" tagColor="text-rose-600">
            <p>
              {myScatter ? (
                <>
                  <strong>{countryName} ranks {ordinal(readinessRank!)} in climate readiness</strong> (score: {myScatter.readiness.toFixed(3)}).{' '}
                  Vulnerability stands at <strong>{myScatter.vulnerability.toFixed(3)}</strong> &mdash;{' '}
                  {myScatter.vulnerability < 0.35
                    ? 'indicating relatively stronger resilience.'
                    : myScatter.vulnerability < 0.45
                      ? 'indicating moderate climate exposure.'
                      : 'reflecting significant climate exposure.'}
                </>
              ) : (
                <>{countryName}&apos;s vulnerability and readiness data is being updated.</>
              )}
            </p>
            {riskProfile && (
              <p className="mt-3">
                <strong>{riskProfile.risk_level} risk.</strong> {riskProfile.summary}
                {emberMix && ` Fossil fuel dependency (${emberMix.fossil.toFixed(1)}%) remains a key driver.`}
              </p>
            )}
          </InsightPanel>
        }
      >
        <ChartCard
          category="vulnerability"
          title="Vulnerability vs Readiness"
          subtitle="Source: ND-GAIN Country Index 2023"
        >
          {scatterData.length > 0 ? (
            <SafeChart name="Vulnerability Scatter">
              <VulnerabilityScatter data={scatterData} highlightIso3={iso3} />
            </SafeChart>
          ) : (
            <div className="flex h-40 items-center justify-center rounded-lg bg-slate-50">
              <p className="text-sm text-slate-400">Data not available</p>
            </div>
          )}
        </ChartCard>
      </StoryBlock>

      {/* Climate Equity */}
      {showEquity && (
        <StoryBlock layout="full" delay={0.05}>
          <ChartCard
            category="vulnerability"
            title="Climate Equity: Who Polluted vs Who Suffers"
            subtitle="Source: OWID Cumulative CO₂ + ND-GAIN Vulnerability"
          >
            <SafeChart name="Equity Scatter">
              <EquityScatter highlightIso3={iso3} />
            </SafeChart>
          </ChartCard>
        </StoryBlock>
      )}

      {/* Risk Profile cards */}
      {riskProfile && (
        <StoryBlock layout="full" delay={0.05}>
          <div className="grid gap-4 md:grid-cols-2">
            <ScrollFadeIn delay={0} direction="left">
              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <h3 className="mb-3 text-sm font-semibold text-slate-900">Key Vulnerabilities</h3>
                <ul className="space-y-2">
                  {riskProfile.key_vulnerabilities.map((v: string, i: number) => (
                    <li key={i} className="flex gap-2 text-sm text-slate-600">
                      <span className="mt-0.5 shrink-0 text-red-500">&#x25B8;</span>{v}
                    </li>
                  ))}
                </ul>
              </div>
            </ScrollFadeIn>
            <ScrollFadeIn delay={0.1} direction="right">
              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <h3 className="mb-3 text-sm font-semibold text-slate-900">Strengths</h3>
                <ul className="space-y-2">
                  {riskProfile.strengths.map((s: string, i: number) => (
                    <li key={i} className="flex gap-2 text-sm text-slate-600">
                      <span className="mt-0.5 shrink-0 text-emerald-500">&#x25B8;</span>{s}
                    </li>
                  ))}
                </ul>
              </div>
            </ScrollFadeIn>
          </div>
        </StoryBlock>
      )}

      {/* ═══════════════════════════════════════ KEY TAKEAWAYS ═══════════════════════════════════════ */}
      <SummaryFan
        title="Key Takeaways"
        subtitle={`${countryName} at a glance`}
        cards={[
          {
            title: 'Emissions',
            content: (
              <p>
                {`CO₂/capita: ${latestCo2 != null ? latestCo2.toFixed(1) + 't' : '\u2014'}. ${parisData ? `Post-Paris trend: ${signed(parisData.post_paris_cagr_pct)}%/yr.` : 'Emissions trajectory under review.'}`}
              </p>
            ),
            bgClass: 'bg-emerald-600',
            textClass: 'text-white',
          },
          {
            title: 'Diagnosis',
            content: (
              <div className="space-y-1.5">
                <p>{emberMix ? `Renewable: ${emberMix.renewable.toFixed(1)}%` : 'Energy data pending.'}</p>
                <p>{emberMix ? `Fossil: ${emberMix.fossil.toFixed(1)}%` : ''}</p>
                <p>{decouplingScore != null ? `Decoupling: ${signed(decouplingScore)}.` : ''}</p>
              </div>
            ),
            bgClass: 'bg-blue-700',
            textClass: 'text-white',
          },
          {
            title: 'Outlook',
            content: (
              <p>
                {`${myScatter ? `Vulnerability: ${myScatter.vulnerability.toFixed(3)}. Readiness: ${myScatter.readiness.toFixed(3)}.` : 'Vulnerability data pending.'} ${riskProfile ? `${riskProfile.risk_level} risk.` : ''}`}
              </p>
            ),
            bgClass: 'bg-amber-500',
            textClass: 'text-white',
          },
        ]}
      />

      {/* ═══════════════════════════════════════ DATA SOURCES ═══════════════════════════════════════ */}
      <ScrollFadeIn className="mt-16" scale>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 md:p-8">
          <h3 className="mb-4 text-base font-semibold text-slate-900">Data Sources</h3>
          <p className="mb-5 text-xs text-slate-400">
            All data for {countryName} sourced from World Bank WDI, Ember, ND-GAIN, Our World in Data, and Climate TRACE (2000-2023).
          </p>

          <div className="mb-6 flex flex-wrap gap-4">
            <button className="rounded-lg bg-[#0066FF] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#0052CC]">
              Download as PNG
            </button>
            <a
              href="/compare"
              className="inline-block rounded-lg border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
            >
              Compare with other countries
            </a>
          </div>

          <details className="group">
            <summary className="cursor-pointer text-sm font-medium text-slate-700 hover:text-[#0066FF]">
              View detailed source list
            </summary>
            <div className="mt-4 space-y-3 rounded-lg bg-slate-50 p-4 text-sm text-slate-600">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 shrink-0 font-semibold text-slate-900">WDI</span>
                <span>World Bank World Development Indicators — CO₂/capita (EN.GHG.CO2.PC.CE.AR5), GDP/capita, forest area, energy use, PM2.5</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="mt-0.5 shrink-0 font-semibold text-slate-900">Ember</span>
                <span>Ember Global Electricity Review — Renewable %, fossil %, carbon intensity (gCO₂/kWh)</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="mt-0.5 shrink-0 font-semibold text-slate-900">ND-GAIN</span>
                <span>Notre Dame Global Adaptation Initiative — Vulnerability index, readiness index</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="mt-0.5 shrink-0 font-semibold text-slate-900">OWID</span>
                <span>Our World in Data — Consumption CO₂, fuel breakdown, cumulative CO₂, temperature contribution, methane, N₂O, total GHG</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="mt-0.5 shrink-0 font-semibold text-slate-900">CTRACE</span>
                <span>Climate TRACE v7 — Satellite-based sector emissions (power, transport, manufacturing, agriculture, etc.)</span>
              </div>
            </div>
          </details>
        </div>
      </ScrollFadeIn>

      {/* Footer CTA */}
      <ScrollFadeIn className="mt-12 flex justify-center" scale>
        <a
          href="/"
          className="group inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-medium text-slate-700 transition-all hover:border-slate-300 hover:shadow-md"
        >
          View all countries
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="transition-transform group-hover:translate-x-1"
          >
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </a>
      </ScrollFadeIn>
    </PageWrapper>
  );
}
