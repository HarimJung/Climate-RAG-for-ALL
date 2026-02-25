'use client';

import React, { useState, useEffect, useCallback, useRef, Component, type ErrorInfo, type ReactNode } from 'react';
import { createClient } from '@/lib/supabase/client';
import { ClimateSankey } from '@/components/charts/ClimateSankey';
import { ClimateGap } from '@/components/charts/ClimateGap';
import { NDCGapChart } from '@/components/charts/NDCGapChart';
import { KayaWaterfall } from '@/components/charts/KayaWaterfall';
import { EquityScatter } from '@/components/charts/EquityScatter';

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
        <div className="flex h-40 items-center justify-center rounded-lg bg-[--bg-section]">
          <p className="text-sm text-[--text-muted]">{name ? `${name} chart` : 'Chart'} unavailable</p>
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

// ── useInView hook (IntersectionObserver) ─────────────────────────────────────
function useInView(options = {}) {
  const ref = useRef<HTMLDivElement>(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsInView(true);
        observer.unobserve(entry.target);
      }
    }, { threshold: 0.1, ...options });

    observer.observe(el);

    return () => {
      observer.unobserve(el);
    };
  }, []);

  return { ref, isInView };
}

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
}

// ── UI Primitives ─────────────────────────────────────────────────────────────
function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl border border-[--border-card] bg-white p-6 ${className}`}
      style={{ boxShadow: 'var(--shadow-card)' }}>
      {children}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="mb-6 text-xl font-semibold text-[--text-primary]">{children}</h2>;
}

function InsightText({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-4 rounded-lg border border-blue-100 bg-blue-50 p-4 text-sm leading-relaxed text-[--text-secondary]">
      {children}
    </div>
  );
}

function SourceLabel({ children }: { children: React.ReactNode }) {
  return <p className="mt-3 text-xs text-[--text-muted]">{children}</p>;
}

function StatCard({ label, value, unit, sub }: { label: string; value: string | null; unit: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-[--border-card] bg-white p-5" style={{ boxShadow: 'var(--shadow-card)' }}>
      <p className="text-xs font-medium uppercase tracking-wider text-[--text-muted]">{label}</p>
      <p className="mt-2 font-mono text-2xl font-bold text-[--text-primary]">{value ?? '—'}<span className="ml-1 text-sm font-normal text-[--text-muted]">{unit}</span></p>
      {sub && <p className="mt-1 text-xs text-[--text-secondary]">{sub}</p>}
    </div>
  );
}

function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

function signed(n: number, d = 2): string {
  return (n >= 0 ? '+' : '') + n.toFixed(d);
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
  production, consumption, countryName,
}: {
  production: { year: number; value: number }[];
  consumption?: { year: number; value: number }[];
  countryName: string;
}) {
  const [hover, setHover] = useState<{ year: number; prodVal: number; consVal: number | null; x: number; y: number } | null>(null);

  const VW = 760, VH = 280, ML = 54, MR = 16, MT = 20, MB = 36;
  const W = VW - ML - MR, H = VH - MT - MB;
  const sorted = [...production].sort((a, b) => a.year - b.year);
  if (sorted.length === 0) return <div className="flex h-40 items-center justify-center text-sm text-[--text-muted]">Data not available</div>;
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

  // Gap annotation: year with max relative gap > 20%
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
      <path d={prodPath} fill="none" stroke="#EF4444" strokeWidth={2.5} strokeLinejoin="round" filter={`url(#glow-${gradId})`} />
      {/* End-of-line dot + label */}
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
      {/* Hover tooltip */}
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

  // Index co2PerGdp to baseYear
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
      {/* Area fills under GDP and CO2 lines */}
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
      {/* End-of-line dots */}
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
      {/* Hover tooltip */}
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
  const [hover, setHover] = useState<{ label: string; value: number; pct: number; y: number } | null>(null);

  if (bars.length === 0) return null;
  const maxVal = bars[0].value;
  const ROW = 32, PAD = 12, LBL = 140, VW = 620, BMAX = VW - LBL - PAD - 90;
  const VH = bars.length * ROW + PAD * 2;

  const handleMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const my = ((e.clientY - rect.top) / rect.height) * VH;
    const idx = Math.floor((my - PAD) / ROW);
    if (idx >= 0 && idx < bars.length) {
      const b = bars[idx];
      setHover({ label: b.label, value: b.value, pct: b.pct, y: PAD + idx * ROW + ROW / 2 });
    } else {
      setHover(null);
    }
  }, [bars]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <svg viewBox={`0 0 ${VW} ${VH}`} className="w-full" role="img" aria-label="Emissions by sector"
      onMouseMove={handleMouseMove} onMouseLeave={() => setHover(null)} style={{ cursor: 'crosshair' }}>
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
        return (
          <g key={b.label}>
            <text x={LBL - 8} y={y + ROW / 2} textAnchor="end" dominantBaseline="middle" fontSize={12} fill="#4A4A6A">{b.label}</text>
            <rect x={LBL} y={y + 7} width={BMAX} height={ROW - 14} rx={8} fill="#F1F5F9" />
            <rect x={LBL} y={y + 7} width={bw} height={ROW - 14} rx={8} fill={`url(#bar-grad-${i})`}
              style={{ filter: `drop-shadow(0 2px 4px ${b.color}30)` }} />
            <text x={LBL + bw + 6} y={y + ROW / 2} dominantBaseline="middle" fontSize={11} fill={b.color} fontWeight="600">
              {b.value >= 1 ? b.value.toFixed(1) : b.value.toFixed(3)} Mt · {b.pct.toFixed(1)}%
            </text>
          </g>
        );
      })}
      {/* Hover tooltip */}
      {hover && (
        <g style={{ pointerEvents: 'none' }}>
          <rect x={10} y={hover.y - 28} width={120} height={48} rx={6} fill="rgba(255,255,255,0.97)" stroke="#E2E8F0" strokeWidth={1} />
          <text x={18} y={hover.y - 14} fontSize={11} fontWeight="700" fill="#1A1A2E">{hover.label}</text>
          <text x={18} y={hover.y} fontSize={10} fill="#4A4A6A" fontFamily="monospace">{hover.value.toFixed(2)} Mt</text>
          <text x={18} y={hover.y + 14} fontSize={10} fill="#4A4A6A" fontFamily="monospace">{hover.pct.toFixed(1)}% of total</text>
        </g>
      )}
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
      {/* Hover tooltip */}
      {hover && (() => {
        const entries = Object.entries(hover.values).filter(([, v]) => v > 0);
        const th = 18 + entries.length * 14;
        const tx = hover.x + 8 + 100 < VW - MR ? hover.x + 8 : hover.x - 108;
        return (
          <g style={{ pointerEvents: 'none' }}>
            <line x1={hover.x} y1={MT} x2={hover.x} y2={MT + H} stroke="#CBD5E1" strokeWidth={1} strokeDasharray="4,3" />
            <rect x={tx} y={MT + 4} width={100} height={th} rx={6} fill="rgba(255,255,255,0.97)" stroke="#E2E8F0" strokeWidth={1} />
            <text x={tx + 8} y={MT + 18} fontSize={11} fontWeight="700" fill="#1A1A2E" fontFamily="monospace">{hover.year}</text>
            {entries.map(([label, value], i) => (
              <text key={label} x={tx + 8} y={MT + 32 + i * 14} fontSize={9} fill="#4A4A6A" fontFamily="monospace">
                {label}: {value.toFixed(1)}
              </text>
            ))}
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
      {/* Hover tooltip */}
      {hover && (() => {
        const hasLeft = hover.left != null;
        const hasRight = hover.right != null;
        const th = 18 + (hasLeft ? 14 : 0) + (hasRight ? 14 : 0);
        const tx = hover.x + 8 + 110 < VW - MR ? hover.x + 8 : hover.x - 118;
        return (
          <g style={{ pointerEvents: 'none' }}>
            <line x1={hover.x} y1={MT} x2={hover.x} y2={MT + H} stroke="#CBD5E1" strokeWidth={1} strokeDasharray="4,3" />
            {hasLeft && <circle cx={hover.x} cy={lys(hover.left!)} r={3} fill={leftColor} stroke="white" strokeWidth={1.5} />}
            {hasRight && <circle cx={hover.x} cy={rys(hover.right!)} r={3} fill={rightColor} stroke="white" strokeWidth={1.5} />}
            <rect x={tx} y={MT + 4} width={110} height={th} rx={6} fill="rgba(255,255,255,0.97)" stroke="#E2E8F0" strokeWidth={1} />
            <text x={tx + 8} y={MT + 18} fontSize={11} fontWeight="700" fill="#1A1A2E" fontFamily="monospace">{hover.year}</text>
            {hasLeft && <text x={tx + 8} y={MT + 32} fontSize={10} fill={leftColor} fontFamily="monospace">CH₄: {hover.left!.toFixed(1)}</text>}
            {hasRight && <text x={tx + 8} y={MT + (hasLeft ? 46 : 32)} fontSize={10} fill={rightColor} fontFamily="monospace">N₂O: {hover.right!.toFixed(1)}</text>}
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
  const [hover, setHover] = useState<{ name: string; vuln: number; ready: number; x: number; y: number } | null>(null);

  const VW = 640, VH = 320, ML = 60, MR = 20, MT = 16, MB = 50;
  const W = VW - ML - MR, H = VH - MT - MB;
  if (data.length === 0) return null;
  const vulns = data.map(d => d.vulnerability), reads = data.map(d => d.readiness);
  const minV = Math.min(...vulns) * 0.9, maxV = Math.max(...vulns) * 1.1;
  const minR = Math.min(...reads) * 0.88, maxR = Math.max(...reads) * 1.08;
  const xs = (v: number) => ML + ((v - minV) / (maxV - minV)) * W;
  const ys = (r: number) => MT + H - ((r - minR) / (maxR - minR)) * H;
  const COLORS: Record<string, string> = { KOR: '#0066FF', USA: '#E5484D', DEU: '#F59E0B', BRA: '#00A67E', NGA: '#8B5CF6', BGD: '#EC4899' };
  const vt = [minV, (minV + maxV) / 2, maxV].map(v => Math.round(v * 1000) / 1000);
  const rt = [minR, (minR + maxR) / 2, maxR].map(v => Math.round(v * 1000) / 1000);

  const handleMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const mx = ((e.clientX - rect.left) / rect.width) * VW;
    const my = ((e.clientY - rect.top) / rect.height) * VH;
    let closest = data[0];
    let minDist = Infinity;
    for (const d of data) {
      const dx = xs(d.vulnerability) - mx;
      const dy = ys(d.readiness) - my;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < minDist) { minDist = dist; closest = d; }
    }
    if (minDist < 40) {
      setHover({ name: closest.name, vuln: closest.vulnerability, ready: closest.readiness, x: xs(closest.vulnerability), y: ys(closest.readiness) });
    } else {
      setHover(null);
    }
  }, [data]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <svg viewBox={`0 0 ${VW} ${VH}`} className="w-full" onMouseMove={handleMouseMove} onMouseLeave={() => setHover(null)} style={{ cursor: 'crosshair' }}>
      <defs>
        <filter id="scatter-glow">
          <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
        <filter id="scatter-highlight">
          <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
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
      <text x={VW / 2} y={VH - 8} textAnchor="middle" fontSize={12} fill="#4A4A6A">Vulnerability →</text>
      <text x={14} y={MT + H / 2} textAnchor="middle" fontSize={12} fill="#4A4A6A" transform={`rotate(-90,14,${MT + H / 2})`}>Readiness →</text>
      {data.map(d => {
        const color = COLORS[d.iso3] || '#64748B';
        const isHL = d.iso3 === highlightIso3;
        return (
          <g key={d.iso3}>
            {isHL && (
              <circle cx={xs(d.vulnerability)} cy={ys(d.readiness)} r={16}
                fill={color} opacity={0.15} filter="url(#scatter-highlight)" />
            )}
            <circle cx={xs(d.vulnerability)} cy={ys(d.readiness)} r={isHL ? 10 : 7}
              fill={color} stroke={isHL ? '#1A1A2E' : 'white'} strokeWidth={isHL ? 3 : 1.5}
              opacity={isHL ? 1 : 0.8} filter={isHL ? 'url(#scatter-glow)' : undefined}
              style={isHL ? { filter: `drop-shadow(0 2px 8px ${color}60)` } : undefined} />
            <text x={xs(d.vulnerability)} y={ys(d.readiness) - (isHL ? 16 : 14)} textAnchor="middle"
              fontSize={isHL ? 13 : 11} fill={isHL ? '#1A1A2E' : '#4A4A6A'} fontWeight={isHL ? '700' : '500'}>{d.name}</text>
          </g>
        );
      })}
      <line x1={ML} y1={MT} x2={ML} y2={MT + H} stroke="#C8C8D0" strokeWidth={1} />
      <line x1={ML} y1={MT + H} x2={VW - MR} y2={MT + H} stroke="#C8C8D0" strokeWidth={1} />
      {/* Hover tooltip */}
      {hover && (() => {
        const tx = hover.x + 8 + 130 < VW - MR ? hover.x + 8 : hover.x - 138;
        return (
          <g style={{ pointerEvents: 'none' }}>
            <rect x={tx} y={hover.y - 28} width={130} height={48} rx={6} fill="rgba(255,255,255,0.97)" stroke="#E2E8F0" strokeWidth={1} />
            <text x={tx + 8} y={hover.y - 14} fontSize={11} fontWeight="700" fill="#1A1A2E">{hover.name}</text>
            <text x={tx + 8} y={hover.y} fontSize={10} fill="#8B5CF6" fontFamily="monospace">Vuln: {hover.vuln.toFixed(3)}</text>
            <text x={tx + 8} y={hover.y + 14} fontSize={10} fill="#10B981" fontFamily="monospace">Ready: {hover.ready.toFixed(3)}</text>
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
  carbonIntensity = null,
}: CountryClientProps) {

  const [extra, setExtra] = useState<ExtraData>(EMPTY_EXTRA);
  const [showNdcGap, setShowNdcGap] = useState(false);
  const [showKaya, setShowKaya] = useState(false);
  const [showEquity, setShowEquity] = useState(false);

  useEffect(() => {
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

    supabase
      .from('country_data')
      .select('indicator_code, year, value')
      .eq('country_iso3', iso3)
      .in('indicator_code', codes)
      .order('year', { ascending: true })
      .then(({ data: rows }) => {
        if (!rows) return;
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
      }, (err) => console.error('[Supabase extra fetch]', err));

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
  }, [iso3]);

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
    { label: 'CO₂', value: extra.tempCo2 ?? 0, color: '#EF4444' },
    { label: 'CH₄', value: extra.tempCh4 ?? 0, color: '#F59E0B' },
    { label: 'N₂O', value: extra.tempN2o ?? 0, color: '#8B5CF6' },
  ] : [];

  // ── Scene hooks for scrollytelling ──────────────────────────────────────────
  const scene1 = useInView();
  const scene2 = useInView();
  const scene3 = useInView();
  const scene4 = useInView();
  const scene5 = useInView();
  const scene6 = useInView();
  const scene7 = useInView();
  const scene8 = useInView();

  const latestCo2 = wbCo2Series.length > 0 ? wbCo2Series[wbCo2Series.length - 1].value : null;
  const latestYear = wbCo2Series.length > 0 ? wbCo2Series[wbCo2Series.length - 1].year : 2023;
  const latestRenewable = emberMix?.renewable ?? null;

  return (
    <div className="space-y-0">

      {/* ══════════════════════════════════════════════════════════════════════════
          SCENE 1 - HERO
      ══════════════════════════════════════════════════════════════════════════ */}
      <section
        id="scene-hero"
        className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-white px-4"
      >
        {/* Background decorative chart */}
        <div className="absolute inset-0 flex items-center justify-center" style={{ opacity: 0.3, pointerEvents: 'none' }}>
          <div className="w-full max-w-[1400px]">
            <SafeChart name="Emissions">
              <EmissionsLineChart production={wbCo2Series} consumption={extra.consumptionCo2} countryName={countryName} />
            </SafeChart>
          </div>
        </div>

        {/* Center content */}
        <div className="relative z-10 text-center">
          <h1 className="mb-4 font-mono text-7xl font-bold text-[--text-primary] md:text-8xl">
            {latestCo2 != null ? latestCo2.toFixed(1) : '—'}
          </h1>
          <p className="text-lg text-[--text-secondary]">CO₂ per capita, {latestYear}</p>
        </div>

        {/* Bottom stat pills */}
        <div className="absolute bottom-32 flex flex-wrap items-center justify-center gap-4 px-4">
          <div className="flex items-center gap-2 rounded-full border border-white/20 bg-white/80 px-5 py-3 shadow-lg backdrop-blur-md">
            <span className="text-sm text-[--text-secondary]">CO₂/capita</span>
            <span className="font-mono text-base font-bold text-[--text-primary]">{latestCo2 != null ? `${latestCo2.toFixed(1)}t` : '—'}</span>
          </div>
          {latestRenewable != null && (
            <div className="flex items-center gap-2 rounded-full border border-white/20 bg-white/80 px-5 py-3 shadow-lg backdrop-blur-md">
              <span className="text-sm text-[--text-secondary]">Renewable</span>
              <span className="font-mono text-base font-bold text-[--accent-positive]">{latestRenewable.toFixed(1)}%</span>
            </div>
          )}
          {decouplingScore != null && (
            <div className="flex items-center gap-2 rounded-full border border-white/20 bg-white/80 px-5 py-3 shadow-lg backdrop-blur-md">
              <span className="text-sm text-[--text-secondary]">Decoupling</span>
              <span className="font-mono text-base font-bold text-[--accent-positive]">{signed(decouplingScore)}</span>
            </div>
          )}
        </div>

        {/* Scroll cue */}
        <div className="absolute bottom-8 flex flex-col items-center gap-2">
          <p className="text-sm text-[--text-muted]">Scroll to see the full story</p>
          <svg className="h-6 w-6 animate-bounce text-[--text-muted]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════════
          SCENE 2 - EMISSIONS (Trajectory + Pre/Post Paris + NDC Gap)
      ══════════════════════════════════════════════════════════════════════════ */}
      <section
        id="scene-emissions"
        ref={scene2.ref}
        className="border-b border-[--border-card] bg-[--bg-section] px-4 py-16"
      >
        <div className="mx-auto max-w-[1200px]">
          <SectionTitle>Emissions Trajectory</SectionTitle>

          {/* Insight text FIRST */}
          {parisData ? (
            <Card className="mb-6 bg-blue-50 p-6 text-lg leading-relaxed">
              <strong>{countryName}&apos;s emissions</strong> grew at {signed(parisData.pre_paris_cagr_pct)}%/yr
              pre-Paris (2000–2014), then{' '}
              <strong className={parisData.post_paris_cagr_pct < 0 ? 'text-[--accent-positive]' : 'text-[--accent-negative]'}>
                {signed(parisData.post_paris_cagr_pct)}%/yr
              </strong>{' '}
              post-Paris (2015–2023) — a <strong>{signed(parisData.acceleration)}pp shift</strong>.
              {accelRank !== null && ` This ranks ${ordinal(accelRank)} largest deceleration among tracked countries.`}
              {cagrData && ` Per capita emissions reached ${parisData.value_2023.toFixed(1)} t in 2023 (${cagrData.total_change_pct > 0 ? '+' : ''}${cagrData.total_change_pct.toFixed(1)}% vs 2000).`}
            </Card>
          ) : (
            <Card className="mb-6 bg-blue-50 p-6 text-lg leading-relaxed">
              <strong>{countryName}&apos;s emissions trajectory</strong> reflects ongoing energy transition dynamics.
              Data sourced from World Bank WDI (2000–2023).
            </Card>
          )}

          {/* Emissions line chart */}
          <Card className="mb-6">
            <h3 className="mb-2 text-sm font-semibold text-[--text-primary]">
              {countryName} — CO&#x2082; per capita (2000–2023)
            </h3>
            <div className="mb-3 flex flex-wrap items-center gap-4 text-xs">
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-0.5 w-5 rounded bg-[#0066FF]" />
                <span className="text-[--text-secondary]">Production-based</span>
              </span>
              {extra.consumptionCo2.length > 0 && (
                <span className="flex items-center gap-1.5">
                  <span className="inline-block h-0.5 w-5 rounded bg-[#8B5CF6]" style={{ borderTop: '2px dashed #8B5CF6', background: 'transparent' }} />
                  <span className="text-[--text-secondary]">Consumption-based</span>
                </span>
              )}
            </div>
            <SafeChart name="Emissions">
              <EmissionsLineChart production={wbCo2Series} consumption={extra.consumptionCo2} countryName={countryName} />
            </SafeChart>
            <SourceLabel>Source: World Bank WDI · EN.GHG.CO2.PC.CE.AR5{extra.consumptionCo2.length > 0 ? ' + OWID Consumption' : ''}</SourceLabel>
          </Card>

          {/* WB vs Climate TRACE comparison */}
          {co2Comparison.length > 0 && (
            <Card className="mb-6">
              <h3 className="mb-2 text-sm font-semibold text-[--text-primary]">
                World Bank vs Climate TRACE — CO&#x2082; per capita
              </h3>
              <div className="mb-3 flex flex-wrap items-center gap-4 text-xs">
                <span className="flex items-center gap-1.5">
                  <span className="inline-block h-0.5 w-5 rounded bg-[#0066FF]" />
                  <span className="text-[--text-secondary]">World Bank (WDI)</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="inline-block h-0.5 w-5 rounded bg-[#EF4444]" style={{ borderTop: '2px dashed #EF4444', background: 'transparent' }} />
                  <span className="text-[--text-secondary]">Climate TRACE</span>
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
            </Card>
          )}

          {/* Climate Gap */}
          <Card className="mb-6">
            <h3 className="mb-1 text-sm font-semibold text-[--text-primary]">Pre-Paris vs Post-Paris CAGR</h3>
            <SafeChart name="Climate Gap">
              <ClimateGap highlightIso3={iso3} />
            </SafeChart>
            <SourceLabel>Source: World Bank WDI · EN.GHG.CO2.PC.CE.AR5</SourceLabel>
          </Card>

          {/* NDC Gap if available */}
          {showNdcGap && (
            <Card>
              <h3 className="mb-2 text-sm font-semibold text-[--text-primary]">
                {countryName} — CO&#x2082; per capita projection vs NDC target
              </h3>
              <SafeChart name="NDC Gap">
                <NDCGapChart iso3={iso3} />
              </SafeChart>
              <SourceLabel>Source: World Bank WDI · EN.GHG.CO2.PC.CE.AR5 + UNFCCC NDC Registry</SourceLabel>
            </Card>
          )}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════════
          SCENE 3 - ENERGY (Sankey + Transition Progress)
      ══════════════════════════════════════════════════════════════════════════ */}
      {emberMix && (
        <section
          id="scene-energy"
          ref={scene3.ref}
          className="border-b border-[--border-card] bg-white px-4 py-16"
        >
          <div className="mx-auto max-w-[1200px]">
            <SectionTitle>Energy Transition</SectionTitle>

            {/* Sankey chart - large and centered */}
            <Card className="mb-6">
              <h3 className="mb-4 text-sm font-semibold text-[--text-primary]">
                Electricity Generation Mix ({emberMix.year})
              </h3>
              <SafeChart name="Sankey">
                <ClimateSankey
                  country={countryName}
                  fossil={emberMix.fossil}
                  renewable={emberMix.renewable}
                  nuclear={emberMix.other}
                />
              </SafeChart>
              <SourceLabel>Source: Ember Global Electricity Review ({emberMix.year})</SourceLabel>
            </Card>

            {/* Transition progress as grid */}
            <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl border border-[--border-card] bg-white p-5" style={{ boxShadow: 'var(--shadow-card)' }}>
                <p className="text-sm text-[--text-secondary]">Renewable Share</p>
                <p className="mt-2 font-mono text-2xl font-bold text-[--text-primary]">{emberMix.renewable.toFixed(1)}%</p>
                {renewableChange != null && (
                  <p className={`mt-1 text-sm font-medium ${renewableChange > 0 ? 'text-[--accent-positive]' : 'text-[--accent-negative]'}`}>
                    {renewableChange > 0 ? '↑ +' : '↓ '}{renewableChange.toFixed(1)}pp over 5 years
                  </p>
                )}
              </div>
              <div className="rounded-xl border border-[--border-card] bg-white p-5" style={{ boxShadow: 'var(--shadow-card)' }}>
                <p className="text-sm text-[--text-secondary]">Fossil Fuel Share</p>
                <p className="mt-2 font-mono text-2xl font-bold text-[--text-primary]">{emberMix.fossil.toFixed(1)}%</p>
              </div>
              <div className="rounded-xl border border-[--border-card] bg-white p-5" style={{ boxShadow: 'var(--shadow-card)' }}>
                <p className="text-sm text-[--text-secondary]">Nuclear & Other</p>
                <p className="mt-2 font-mono text-2xl font-bold text-[--text-primary]">{emberMix.other.toFixed(1)}%</p>
              </div>
              {carbonIntensity != null && (
                <div className="rounded-xl border border-[--border-card] bg-white p-5" style={{ boxShadow: 'var(--shadow-card)' }}>
                  <p className="text-sm text-[--text-secondary]">Carbon Intensity</p>
                  <p className="mt-2 font-mono text-2xl font-bold text-[--text-primary]">{carbonIntensity.toFixed(0)} <span className="text-sm font-normal">gCO₂/kWh</span></p>
                  <p className={`mt-1 text-sm font-medium ${carbonIntensity < 100 ? 'text-[--accent-positive]' : carbonIntensity < 300 ? 'text-amber-600' : 'text-[--accent-negative]'}`}>
                    {carbonIntensity < 100 ? 'Low-carbon grid' : carbonIntensity < 300 ? 'Moderate carbon grid' : 'High-carbon grid'}
                  </p>
                </div>
              )}
            </div>

            {/* Insight */}
            {transitionEntry ? (
              <InsightText>
                <strong>{countryName}&apos;s renewable share ({emberMix.renewable.toFixed(1)}%)</strong> ranks{' '}
                {ordinal(transitionEntry.rank)} in the group, adding{' '}
                <strong>{signed(transitionEntry.energy_transition_value, 1)}pp</strong> over 5 years.
                {transitionEntry.rank === 1
                  ? ' Leading the group in renewable transition speed.'
                  : ` The group leader (Germany) reached ${emissionsTrend.energy_transition_ranking[0].renewable_pct_latest.toFixed(1)}% renewable.`}
              </InsightText>
            ) : (
              <InsightText>
                <strong>{countryName}&apos;s electricity mix:</strong> {emberMix.renewable.toFixed(1)}% renewable,{' '}
                {emberMix.fossil.toFixed(1)}% fossil, {emberMix.other.toFixed(1)}% nuclear & other ({emberMix.year}).
              </InsightText>
            )}
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════════════════════════════════════════
          SCENE 4 - EMISSION SOURCES (Sector Breakdown)
      ══════════════════════════════════════════════════════════════════════════ */}
      {ctraceBarsWithPct.length > 0 && (
        <section
          id="scene-emission-sources"
          ref={scene4.ref}
          className="border-b border-[--border-card] bg-[--bg-section] px-4 py-16"
        >
          <div className="mx-auto max-w-[1200px]">
            <SectionTitle>Emission Sources</SectionTitle>

            <Card className="mb-6">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-[--text-primary]">
                  Emissions by Sector {extra.ctraceYear ? `(${extra.ctraceYear})` : ''}
                </h3>
                {ctraceTotal > 0 && (
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-[--text-secondary]">
                    Total: {ctraceTotal >= 1000 ? `${(ctraceTotal / 1000).toFixed(2)} Gt` : `${ctraceTotal.toFixed(1)} Mt`} CO₂e
                  </span>
                )}
              </div>
              <SafeChart name="Sector Emissions">
                <HorizontalBarChart bars={ctraceBarsWithPct} />
              </SafeChart>
              <SourceLabel>Source: Climate TRACE v7 ({extra.ctraceYear ?? 'latest'})</SourceLabel>
            </Card>

            <InsightText>
              {ctraceBarsWithPct[0] && (
                <>
                  <strong>{ctraceBarsWithPct[0].label}</strong> is the largest emissions source at{' '}
                  <strong>{ctraceBarsWithPct[0].pct.toFixed(1)}%</strong> of total.{' '}
                </>
              )}
              {ctraceBarsWithPct[1] && (
                <>
                  <strong>{ctraceBarsWithPct[1].label}</strong> follows at{' '}
                  <strong>{ctraceBarsWithPct[1].pct.toFixed(1)}%</strong>.
                </>
              )}
              {' '}Data from Climate TRACE satellite-based sector analysis.
            </InsightText>
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════════════════════════════════════════
          SCENE 4b - FOSSIL FUEL BREAKDOWN (Stacked Area)
      ══════════════════════════════════════════════════════════════════════════ */}
      {hasFuelData && (
        <section
          id="scene-fossil-fuel"
          className="border-b border-[--border-card] bg-white px-4 py-16"
        >
          <div className="mx-auto max-w-[1200px]">
            <SectionTitle>Fossil Fuel Breakdown</SectionTitle>

            <Card className="mb-6">
              <h3 className="mb-2 text-sm font-semibold text-[--text-primary]">Fossil CO₂ by Fuel Type</h3>
              <div className="mb-4 flex flex-wrap items-center gap-4 text-xs">
                {FUEL_SERIES.map(f => (
                  <span key={f.key} className="flex items-center gap-1.5">
                    <span className="inline-block h-3 w-3 rounded-sm" style={{ backgroundColor: f.color }} />
                    <span className="text-[--text-secondary]">{f.label}</span>
                  </span>
                ))}
              </div>
              <SafeChart name="Fuel Breakdown">
                <StackedAreaChart years={fuelYears} seriesDef={FUEL_SERIES} data={fuelData} />
              </SafeChart>
              <SourceLabel>Source: Our World in Data (OWID) · OWID.COAL_CO2, OWID.OIL_CO2, OWID.GAS_CO2, OWID.CEMENT_CO2, OWID.FLARING_CO2</SourceLabel>
            </Card>

            <InsightText>
              Historical fossil fuel CO₂ breakdown shows the evolving energy mix.
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
            </InsightText>
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════════════════════════════════════════
          SCENE 5 - HISTORICAL RESPONSIBILITY (Stat Cards + Temperature Bar)
      ══════════════════════════════════════════════════════════════════════════ */}
      {(extra.cumulativeCo2 != null || extra.shareCumulative != null || extra.tempGhg != null) && (
        <section
          id="scene-historical"
          ref={scene5.ref}
          className="border-b border-[--border-card] bg-[--bg-section] px-4 py-16"
        >
          <div className="mx-auto max-w-[1200px]">
            <SectionTitle>Historical Responsibility</SectionTitle>

            {/* 3 stat cards */}
            <div className="mb-6 grid gap-4 sm:grid-cols-3">
              <StatCard
                label="Cumulative CO₂"
                value={extra.cumulativeCo2 != null ? (extra.cumulativeCo2 / 1000).toFixed(1) : null}
                unit="Gt CO₂"
                sub="Total CO₂ emitted since 1850"
              />
              <StatCard
                label="Share of Global"
                value={extra.shareCumulative != null ? extra.shareCumulative.toFixed(2) : null}
                unit="% of all human CO₂"
                sub="Cumulative share since 1850"
              />
              <StatCard
                label="Temperature Contribution"
                value={extra.tempGhg != null ? extra.tempGhg.toFixed(3) : null}
                unit="°C"
                sub="Warming caused by this country"
              />
            </div>

            {/* Temperature bar */}
            {tempBar.length > 0 && (
              <Card className="mb-6">
                <h3 className="mb-4 text-sm font-semibold text-[--text-primary]">
                  Temperature Contribution by Gas
                </h3>
                <div className="space-y-3">
                  {tempBar.map(g => (
                    <div key={g.label}>
                      <div className="mb-1 flex items-center justify-between text-xs">
                        <span className="flex items-center gap-1.5">
                          <span className="inline-block h-3 w-3 rounded-sm" style={{ backgroundColor: g.color }} />
                          <span className="text-[--text-secondary]">{g.label}</span>
                        </span>
                        <span className="font-mono font-medium text-[--text-primary]">{g.value.toFixed(3)}°C ({tempTotal > 0 ? ((g.value / tempTotal) * 100).toFixed(0) : 0}%)</span>
                      </div>
                      <div className="h-4 rounded-full bg-[--bg-section]">
                        <div className="h-4 rounded-full" style={{ width: `${tempTotal > 0 ? (g.value / tempTotal) * 100 : 0}%`, backgroundColor: g.color, opacity: 0.85 }} />
                      </div>
                    </div>
                  ))}
                </div>
                <SourceLabel>Source: Our World in Data · OWID.TEMPERATURE_CHANGE_FROM_GHG/CO2/CH4/N2O</SourceLabel>
              </Card>
            )}

            <InsightText>
              <strong>{countryName}</strong> has cumulatively emitted{' '}
              <strong>{extra.cumulativeCo2 != null ? (extra.cumulativeCo2 / 1000).toFixed(1) : '—'} Gt CO₂</strong> since 1850,
              accounting for <strong>{extra.shareCumulative != null ? extra.shareCumulative.toFixed(2) : '—'}%</strong> of all human CO₂ emissions.
              {extra.tempGhg != null && ` This contributes an estimated ${extra.tempGhg.toFixed(3)}°C to global warming.`}
            </InsightText>
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════════════════════════════════════════
          SCENE 5b - BEYOND CO₂ (Methane + N₂O + Total GHG)
      ══════════════════════════════════════════════════════════════════════════ */}
      {(extra.methaneSeries.length > 0 || extra.n2oSeries.length > 0 || extra.totalGhgLatest != null) && (
        <section
          id="scene-beyond-co2"
          className="border-b border-[--border-card] bg-white px-4 py-16"
        >
          <div className="mx-auto max-w-[1200px]">
            <SectionTitle>Beyond CO₂</SectionTitle>

            {/* GHG stat cards */}
            {(extra.totalGhgLatest != null || extra.ghgPerCapitaLatest != null) && (
              <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {extra.totalGhgLatest != null && (
                  <StatCard
                    label="Total GHG Emissions"
                    value={extra.totalGhgLatest >= 1000 ? (extra.totalGhgLatest / 1000).toFixed(2) : extra.totalGhgLatest.toFixed(1)}
                    unit={extra.totalGhgLatest >= 1000 ? 'Gt CO₂e' : 'Mt CO₂e'}
                    sub="All greenhouse gases (latest year)"
                  />
                )}
                {extra.ghgPerCapitaLatest != null && (
                  <StatCard
                    label="GHG per Capita"
                    value={extra.ghgPerCapitaLatest.toFixed(1)}
                    unit="t CO₂e/capita"
                    sub="Total GHG per person"
                  />
                )}
                {extra.tempGhg != null && (
                  <StatCard
                    label="GHG Temperature Impact"
                    value={extra.tempGhg.toFixed(3)}
                    unit="°C"
                    sub="Warming from all GHGs"
                  />
                )}
              </div>
            )}

            {/* Methane + N2O chart */}
            {extra.methaneSeries.length > 0 && extra.n2oSeries.length > 0 && (
              <Card className="mb-6">
                <h3 className="mb-2 text-sm font-semibold text-[--text-primary]">Methane &amp; Nitrous Oxide</h3>
                <div className="mb-3 flex flex-wrap items-center gap-4 text-xs">
                  <span className="flex items-center gap-1.5">
                    <span className="inline-block h-3 w-3 rounded-sm bg-[#F59E0B]" />
                    <span className="text-[--text-secondary]">Methane (left axis)</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="inline-block h-3 w-3 rounded-sm bg-[#8B5CF6]" />
                    <span className="text-[--text-secondary]">Nitrous Oxide (right axis)</span>
                  </span>
                </div>
                <SafeChart name="Methane & N₂O">
                  <DualYLineChart
                    leftData={extra.methaneSeries} rightData={extra.n2oSeries}
                    leftColor="#F59E0B" rightColor="#8B5CF6"
                    leftUnit="CH₄ Mt" rightUnit="N₂O Mt"
                  />
                </SafeChart>
                <SourceLabel>Source: Our World in Data · OWID.METHANE, OWID.NITROUS_OXIDE</SourceLabel>
              </Card>
            )}

            <InsightText>
              CO₂ is the dominant greenhouse gas, but methane (CH₄) and nitrous oxide (N₂O) have significant warming potential.
              {extra.totalGhgLatest != null && ` ${countryName}'s total GHG emissions are ${extra.totalGhgLatest >= 1000 ? (extra.totalGhgLatest / 1000).toFixed(2) + ' Gt' : extra.totalGhgLatest.toFixed(1) + ' Mt'} CO₂e.`}
              {extra.ghgPerCapitaLatest != null && ` Per capita GHG: ${extra.ghgPerCapitaLatest.toFixed(1)} t CO₂e.`}
            </InsightText>
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════════════════════════════════════════
          SCENE 6 - ECONOMY (Economic Decoupling)
      ══════════════════════════════════════════════════════════════════════════ */}
      {gdpVsCo2.length > 0 && (
        <section
          id="scene-economy"
          ref={scene6.ref}
          className="border-b border-[--border-card] bg-[--bg-section] px-4 py-16"
        >
          <div className="mx-auto max-w-[1200px]">
            <SectionTitle>Economic Decoupling</SectionTitle>
            <Card>
              <div className="mb-4 flex flex-wrap items-center gap-4">
                <h3 className="text-sm font-semibold text-[--text-primary]">GDP vs CO&#x2082; Growth</h3>
                <div className="flex flex-wrap items-center gap-4 text-xs">
                  <span className="flex items-center gap-1.5">
                    <span className="inline-block h-2 w-2 rounded-full bg-[#00A67E]" />
                    <span className="text-[--text-secondary]">GDP per capita</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="inline-block h-2 w-2 rounded-full bg-[#E5484D]" />
                    <span className="text-[--text-secondary]">CO₂ per capita</span>
                  </span>
                  {extra.co2PerGdpSeries.length > 0 && (
                    <span className="flex items-center gap-1.5">
                      <span className="inline-block h-2 w-2 rounded-full bg-[#F59E0B]" />
                      <span className="text-[--text-secondary]">Carbon Intensity of GDP</span>
                    </span>
                  )}
                </div>
                {decouplingScore != null && (
                  <span className="ml-auto rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-[--accent-positive]">
                    Decoupling Score: {decouplingScore >= 0 ? '+' : ''}{decouplingScore.toFixed(2)}
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
              <SourceLabel>Source: World Bank WDI (GDP + CO₂ per capita){extra.co2PerGdpSeries.length > 0 ? ' + OWID CO₂/GDP' : ''}, indexed to {gdpVsCo2[0].year}=100</SourceLabel>
            </Card>

            {decouplingEntry ? (
              <InsightText>
                <strong>{countryName} shows {decouplingEntry.interpretation.toLowerCase()}.</strong>{' '}
                GDP grew faster than emissions by <strong>{signed(decouplingEntry.avg_decoupling_2015_2023)}pp/yr</strong> since 2015{' '}
                ({ordinal(decouplingEntry.rank)} among tracked countries).{' '}
                The divergence between green (GDP) and red (CO₂) lines shows economic growth is increasingly less carbon-intensive.
              </InsightText>
            ) : (
              <InsightText>
                <strong>{countryName}&apos;s economic decoupling</strong> reflects the relationship between GDP growth and emissions.
                Chart shows indexed trajectories since {gdpVsCo2[0].year}.
                {decouplingScore != null && ` Current decoupling score: ${signed(decouplingScore)}pp/yr (2015–2023).`}
              </InsightText>
            )}
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════════════════════════════════════════
          SCENE 7 - VULNERABILITY (Kaya + Vulnerability + Equity + Risk Profile)
      ══════════════════════════════════════════════════════════════════════════ */}
      <section
        id="scene-vulnerability"
        ref={scene7.ref}
        className="border-b border-[--border-card] bg-white px-4 py-16"
      >
        <div className="mx-auto max-w-[1200px]">
          <SectionTitle>Climate Vulnerability &amp; Resilience</SectionTitle>

          {/* Kaya Waterfall if available */}
          {showKaya && (
            <Card className="mb-6">
              <h3 className="mb-2 text-sm font-semibold text-[--text-primary]">
                Why Did Emissions Change? — {countryName} LMDI Factor Decomposition
              </h3>
              <SafeChart name="Kaya Waterfall">
                <KayaWaterfall iso3={iso3} />
              </SafeChart>
              <SourceLabel>Source: World Bank WDI + Ember + OWID · LMDI additive decomposition (Kaya Identity)</SourceLabel>
            </Card>
          )}

          {/* Vulnerability Scatter */}
          <Card className="mb-6">
            <h3 className="mb-4 text-sm font-semibold text-[--text-primary]">
              Vulnerability vs Readiness (Pilot Countries, 2023)
            </h3>
            {scatterData.length > 0 ? (
              <SafeChart name="Vulnerability Scatter">
                <VulnerabilityScatter data={scatterData} highlightIso3={iso3} />
              </SafeChart>
            ) : (
              <div className="flex h-40 items-center justify-center rounded-lg bg-[--bg-section]">
                <p className="text-sm text-[--text-muted]">Data not available</p>
              </div>
            )}
            <SourceLabel>Source: ND-GAIN Country Index (2023). Lower-left = ideal (low vulnerability, high readiness)</SourceLabel>
          </Card>

          {/* Equity Scatter if available */}
          {showEquity && (
            <Card className="mb-6">
              <h3 className="mb-2 text-sm font-semibold text-[--text-primary]">
                Climate Equity: Who Polluted vs Who Suffers
              </h3>
              <SafeChart name="Equity Scatter">
                <EquityScatter highlightIso3={iso3} />
              </SafeChart>
              <SourceLabel>Source: OWID Cumulative CO₂ + ND-GAIN Vulnerability Index</SourceLabel>
            </Card>
          )}

          {/* Risk Profile cards */}
          {riskProfile && (
            <div className="mb-6 grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-[--border-card] bg-white p-5" style={{ boxShadow: 'var(--shadow-card)' }}>
                <h3 className="mb-3 text-sm font-semibold text-[--text-primary]">Key Vulnerabilities</h3>
                <ul className="space-y-2">
                  {riskProfile.key_vulnerabilities.map((v, i) => (
                    <li key={i} className="flex gap-2 text-sm text-[--text-secondary]">
                      <span className="mt-0.5 shrink-0 text-[--accent-negative]">▸</span>{v}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-xl border border-[--border-card] bg-white p-5" style={{ boxShadow: 'var(--shadow-card)' }}>
                <h3 className="mb-3 text-sm font-semibold text-[--text-primary]">Strengths</h3>
                <ul className="space-y-2">
                  {riskProfile.strengths.map((s, i) => (
                    <li key={i} className="flex gap-2 text-sm text-[--text-secondary]">
                      <span className="mt-0.5 shrink-0 text-[--accent-positive]">▸</span>{s}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Insight sentence */}
          {myScatter && (
            <InsightText>
              <strong>{countryName} ranks {ordinal(readinessRank!)} in climate readiness (score: {myScatter.readiness.toFixed(3)})</strong>{' '}
              among pilot countries.{' '}
              Vulnerability stands at <strong>{myScatter.vulnerability.toFixed(3)}</strong> —{' '}
              {myScatter.vulnerability < 0.35
                ? 'in the lower range, indicating relatively stronger resilience.'
                : myScatter.vulnerability < 0.45
                  ? 'in the medium range, indicating moderate climate exposure.'
                  : 'in the higher range, reflecting significant climate exposure.'}
              {emberMix && ` Fossil fuel dependency (${emberMix.fossil.toFixed(1)}%) remains a key driver.`}
              {riskProfile && ` Assessment: ${riskProfile.risk_level} risk. ${riskProfile.summary}`}
            </InsightText>
          )}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════════
          DATA SOURCES (Bottom)
      ══════════════════════════════════════════════════════════════════════════ */}
      <section
        id="scene-data-sources"
        ref={scene8.ref}
        className="bg-[--bg-section] px-4 py-16"
      >
        <div className="mx-auto max-w-[1200px]">
          <div className="rounded-xl border border-[--border-card] bg-white p-8" style={{ boxShadow: 'var(--shadow-card)' }}>
            <h3 className="mb-2 text-lg font-semibold text-[--text-primary]">Data Sources</h3>
            <p className="mb-6 text-sm text-[--text-secondary]">
              All data for {countryName} sourced from World Bank WDI, Ember, ND-GAIN, Our World in Data, and Climate TRACE (2000–2023).
            </p>

            {/* Action buttons */}
            <div className="mb-6 flex flex-wrap gap-4">
              <button className="rounded-lg bg-[#0066FF] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#0052CC]">
                Download as PNG
              </button>
              <a
                href="/compare"
                className="inline-block rounded-lg border border-[--border-card] bg-white px-6 py-3 text-sm font-semibold text-[--text-primary] transition-colors hover:bg-[--bg-section]"
              >
                Compare with other countries
              </a>
            </div>

            {/* Collapsible source details */}
            <details className="group">
              <summary className="cursor-pointer text-sm font-medium text-[--text-primary] hover:text-[#0066FF]">
                View detailed source list
              </summary>
              <div className="mt-4 space-y-3 rounded-lg bg-[--bg-section] p-4 text-sm text-[--text-secondary]">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 shrink-0 font-semibold text-[--text-primary]">WDI</span>
                  <span>World Bank World Development Indicators — CO₂/capita (EN.GHG.CO2.PC.CE.AR5), GDP/capita, forest area, energy use, PM2.5</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 shrink-0 font-semibold text-[--text-primary]">Ember</span>
                  <span>Ember Global Electricity Review — Renewable %, fossil %, carbon intensity (gCO₂/kWh)</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 shrink-0 font-semibold text-[--text-primary]">ND-GAIN</span>
                  <span>Notre Dame Global Adaptation Initiative — Vulnerability index, readiness index</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 shrink-0 font-semibold text-[--text-primary]">OWID</span>
                  <span>Our World in Data — Consumption CO₂, fuel breakdown, cumulative CO₂, temperature contribution, methane, N₂O, total GHG</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 shrink-0 font-semibold text-[--text-primary]">CTRACE</span>
                  <span>Climate TRACE v7 — Satellite-based sector emissions (power, transport, manufacturing, agriculture, etc.)</span>
                </div>
              </div>
            </details>
          </div>
        </div>
      </section>

    </div>
  );
}
