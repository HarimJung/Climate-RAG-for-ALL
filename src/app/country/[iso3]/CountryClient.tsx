'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { ClimateSankey } from '@/components/charts/ClimateSankey';
import { ClimateGap } from '@/components/charts/ClimateGap';
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
function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const a = (angleDeg - 90) * Math.PI / 180;
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
}

function arcPath(cx: number, cy: number, outerR: number, innerR: number, start: number, end: number) {
  const o1 = polarToCartesian(cx, cy, outerR, start);
  const o2 = polarToCartesian(cx, cy, outerR, end);
  const i1 = polarToCartesian(cx, cy, innerR, end);
  const i2 = polarToCartesian(cx, cy, innerR, start);
  const large = end - start > 180 ? 1 : 0;
  return `M${o1.x} ${o1.y} A${outerR} ${outerR} 0 ${large} 1 ${o2.x} ${o2.y} L${i1.x} ${i1.y} A${innerR} ${innerR} 0 ${large} 0 ${i2.x} ${i2.y}Z`;
}

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
  const VW = 760, VH = 280, ML = 54, MR = 16, MT = 20, MB = 36;
  const W = VW - ML - MR, H = VH - MT - MB;
  const sorted = [...production].sort((a, b) => a.year - b.year);
  if (sorted.length === 0) return <div className="flex h-40 items-center justify-center text-sm text-[--text-muted]">No data</div>;
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

  const xtick = xTicks(minYear, maxYear);
  return (
    <svg viewBox={`0 0 ${VW} ${VH}`} className="w-full" role="img" aria-label={`${countryName} CO₂ per capita`}>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#EF4444" stopOpacity={0.12} />
          <stop offset="100%" stopColor="#EF4444" stopOpacity={0} />
        </linearGradient>
      </defs>
      {yTickVals.map(v => <line key={v} x1={ML} y1={ys(v)} x2={VW - MR} y2={ys(v)} stroke="#E8E8ED" strokeWidth={1} />)}
      {yTickVals.map(v => <text key={v} x={ML - 6} y={ys(v)} textAnchor="end" dominantBaseline="middle" fontSize={11} fill="#4A4A6A">{v % 1 === 0 ? v : v.toFixed(1)}</text>)}
      {xtick.map(y => <text key={y} x={xs(y)} y={VH - 10} textAnchor="middle" fontSize={11} fill="#4A4A6A">{y}</text>)}
      <text x={12} y={MT + H / 2} textAnchor="middle" fontSize={10} fill="#6B7280" transform={`rotate(-90,12,${MT + H / 2})`}>t CO₂e/capita</text>
      {minYear <= 2015 && maxYear >= 2015 && <>
        <line x1={xs(2015)} y1={MT} x2={xs(2015)} y2={MT + H} stroke="#94A3B8" strokeWidth={1.5} strokeDasharray="6,4" />
        <text x={xs(2015) + 5} y={MT + 14} fontSize={10} fill="#94A3B8" fontWeight="600">Paris</text>
      </>}
      <path d={areaPath} fill={`url(#${gradId})`} />
      <path d={prodPath} fill="none" stroke="#EF4444" strokeWidth={2.5} strokeLinejoin="round" />
      {/* End-of-line dot + label */}
      {sorted.length > 0 && (() => {
        const last = sorted[sorted.length - 1];
        return (
          <>
            <circle cx={xs(last.year)} cy={ys(last.value)} r={4} fill="#EF4444" stroke="white" strokeWidth={1.5} />
            <text x={xs(last.year) - 5} y={ys(last.value) - 8} textAnchor="end" fontSize={10} fontWeight="600" fill="#EF4444" fontFamily="monospace">
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
    </svg>
  );
}

// ── Chart: Indexed Dual Line (WB vs CT / GDP vs CO₂) ─────────────────────────
function IndexedDualLineChart({
  data, aColor, bColor, aLabel, bLabel,
}: {
  data: { year: number; a: number; b: number }[];
  aColor: string; bColor: string; aLabel: string; bLabel: string;
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
      <text x={12} y={MT + H / 2} textAnchor="middle" fontSize={10} fill="#6B7280" transform={`rotate(-90,12,${MT + H / 2})`}>Index ({data[0].year}=100)</text>
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
  const VW = 760, VH = 280, ML = 54, MR = 16, MT = 18, MB = 36;
  const W = VW - ML - MR, H = VH - MT - MB;
  if (gdpCo2.length === 0) return null;

  // Index co2PerGdp to baseYear
  const cpgBase = co2PerGdp.find(d => d.year === baseYear)?.value;
  const cpgIndexed = cpgBase ? co2PerGdp.map(d => ({ year: d.year, value: (d.value / cpgBase) * 100 })) : [];

  const allVals = [
    ...gdpCo2.flatMap(d => [d.gdp, d.co2]),
    ...cpgIndexed.map(d => d.value),
  ].filter(v => v != null);
  const minVal = Math.min(...allVals) * 0.9;
  const yTickVals = niceMax(Math.max(...allVals) * 1.05);
  const maxVal = yTickVals[yTickVals.length - 1];
  const minYear = gdpCo2[0].year, maxYear = gdpCo2[gdpCo2.length - 1].year;
  const xs = (y: number) => ML + ((y - minYear) / Math.max(maxYear - minYear, 1)) * W;
  const ys = (v: number) => MT + H - ((v - minVal) / (maxVal - minVal)) * H;
  const gdpPath = gdpCo2.map((d, i) => `${i ? 'L' : 'M'}${xs(d.year).toFixed(1)} ${ys(d.gdp).toFixed(1)}`).join(' ');
  const co2Path = gdpCo2.map((d, i) => `${i ? 'L' : 'M'}${xs(d.year).toFixed(1)} ${ys(d.co2).toFixed(1)}`).join(' ');
  const cpgPath = cpgIndexed.map((d, i) => `${i ? 'L' : 'M'}${xs(d.year).toFixed(1)} ${ys(d.value).toFixed(1)}`).join(' ');
  const xt = xTicks(minYear, maxYear);
  const ytv = yTickVals.filter(v => v >= minVal);
  return (
    <svg viewBox={`0 0 ${VW} ${VH}`} className="w-full">
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
            <circle cx={xs(lastD.year)} cy={ys(lastD.gdp)} r={4} fill="#10B981" stroke="white" strokeWidth={1.5} />
            <text x={xs(lastD.year) + 6} y={ys(lastD.gdp) + 4} fontSize={10} fontWeight="600" fill="#10B981" fontFamily="monospace">{lastD.gdp.toFixed(0)}</text>
            <circle cx={xs(lastD.year)} cy={ys(lastD.co2)} r={4} fill="#E5484D" stroke="white" strokeWidth={1.5} />
            <text x={xs(lastD.year) + 6} y={ys(lastD.co2) + 4} fontSize={10} fontWeight="600" fill="#E5484D" fontFamily="monospace">{lastD.co2.toFixed(0)}</text>
          </>
        );
      })()}
      <line x1={ML} y1={MT} x2={ML} y2={MT + H} stroke="#C8C8D0" strokeWidth={1} />
      <line x1={ML} y1={MT + H} x2={VW - MR} y2={MT + H} stroke="#C8C8D0" strokeWidth={1} />
    </svg>
  );
}

// ── Chart: Donut (Energy Mix) ─────────────────────────────────────────────────
const DONUT_GRAD: Record<string, [string, string]> = {
  'Fossil':          ['#EF4444', '#DC2626'],
  'Renewable':       ['#10B981', '#059669'],
  'Nuclear':         ['#8B5CF6', '#7C3AED'],
  'Nuclear & Other': ['#8B5CF6', '#7C3AED'],
};

function DonutChart({ segments }: { segments: { label: string; value: number; color: string }[] }) {
  const total = segments.reduce((s, d) => s + d.value, 0);
  if (total === 0) return null;
  const CX = 120, CY = 120, OR = 88, IR = 52;
  const largest = segments.reduce((a, b) => a.value > b.value ? a : b);
  let angle = -90;
  const paths = segments.map((seg, idx) => {
    const sweep = (seg.value / total) * 360;
    const midAngle = angle + sweep / 2;
    const d = arcPath(CX, CY, OR, IR, angle, angle + Math.max(sweep - 0.5, 0));
    const labelPos = polarToCartesian(CX, CY, OR + 18, midAngle);
    angle += sweep;
    const gradColors = DONUT_GRAD[seg.label];
    return { ...seg, d, midAngle, labelPos, gradId: `dnt-${idx}`, gradColors };
  });
  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-start">
      <svg viewBox="0 0 240 240" width={240} height={240}>
        <defs>
          {paths.map(p => p.gradColors ? (
            <radialGradient key={p.gradId} id={p.gradId} cx="50%" cy="50%" r="50%">
              <stop offset="0%"   stopColor={p.gradColors[0]} />
              <stop offset="100%" stopColor={p.gradColors[1]} />
            </radialGradient>
          ) : null)}
        </defs>
        {paths.map(p => (
          <path
            key={p.label}
            d={p.d}
            fill={p.gradColors ? `url(#${p.gradId})` : p.color}
            stroke="white"
            strokeWidth={3}
            style={{ filter: `drop-shadow(0 0 6px ${p.color}50)` }}
          />
        ))}
        {/* Outer segment labels */}
        {paths.map(p => p.value > 4 ? (
          <text
            key={`lbl-${p.label}`}
            x={p.labelPos.x}
            y={p.labelPos.y + 4}
            textAnchor="middle"
            fontSize={10}
            fontWeight="700"
            fill={p.color}
            fontFamily="monospace"
          >
            {p.value.toFixed(0)}%
          </text>
        ) : null)}
        {/* Center text: largest source name + % */}
        <text x={CX} y={CY - 8} textAnchor="middle" fontSize={12} fontWeight="600" fill="#4A4A6A"
          fontFamily="var(--font-jetbrains-mono), monospace">{largest.label.split(' ')[0]}</text>
        <text x={CX} y={CY + 14} textAnchor="middle" fontSize={22} fontWeight="700" fill={largest.color}
          fontFamily="var(--font-jetbrains-mono), monospace">{largest.value.toFixed(0)}%</text>
      </svg>
      <ul className="flex flex-col gap-2.5">
        {segments.map(s => (
          <li key={s.label} className="flex items-center gap-2 text-sm">
            <span className="h-3 w-3 shrink-0 rounded-sm" style={{ backgroundColor: s.color }} />
            <span className="text-[--text-secondary]">{s.label}</span>
            <span className="ml-2 font-mono font-medium text-[--text-primary]">{s.value.toFixed(1)}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ── Chart: Horizontal Bar (CTRACE sectors) ────────────────────────────────────
function HorizontalBarChart({ bars }: { bars: { label: string; value: number; color: string; pct: number }[] }) {
  if (bars.length === 0) return null;
  const maxVal = bars[0].value;
  const ROW = 32, PAD = 12, LBL = 140, VW = 620, BMAX = VW - LBL - PAD - 90;
  const VH = bars.length * ROW + PAD * 2;
  return (
    <svg viewBox={`0 0 ${VW} ${VH}`} className="w-full" role="img" aria-label="Emissions by sector">
      {bars.map((b, i) => {
        const y = PAD + i * ROW;
        const bw = maxVal > 0 ? (b.value / maxVal) * BMAX : 0;
        return (
          <g key={b.label}>
            <text x={LBL - 8} y={y + ROW / 2} textAnchor="end" dominantBaseline="middle" fontSize={12} fill="#4A4A6A">{b.label}</text>
            <rect x={LBL} y={y + 7} width={BMAX} height={ROW - 14} rx={3} fill="#F1F5F9" />
            <rect x={LBL} y={y + 7} width={bw} height={ROW - 14} rx={3} fill={b.color} opacity={0.85} />
            <text x={LBL + bw + 6} y={y + ROW / 2} dominantBaseline="middle" fontSize={11} fill={b.color} fontWeight="600">
              {b.value >= 1 ? b.value.toFixed(1) : b.value.toFixed(3)} Mt · {b.pct.toFixed(1)}%
            </text>
          </g>
        );
      })}
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

  const xt = xTicks(minYear, maxYear);
  return (
    <svg viewBox={`0 0 ${VW} ${VH}`} className="w-full" role="img" aria-label="Fossil fuel CO₂ by fuel type">
      {yTickVals.map(v => <line key={v} x1={ML} y1={ys(v)} x2={VW - MR} y2={ys(v)} stroke="#E8E8ED" strokeWidth={1} />)}
      {yTickVals.map(v => <text key={v} x={ML - 6} y={ys(v)} textAnchor="end" dominantBaseline="middle" fontSize={11} fill="#4A4A6A">{v % 1 === 0 ? v : v.toFixed(1)}</text>)}
      {xt.map(y => <text key={y} x={xs(y)} y={VH - 10} textAnchor="middle" fontSize={11} fill="#4A4A6A">{y}</text>)}
      <text x={12} y={MT + H / 2} textAnchor="middle" fontSize={10} fill="#6B7280" transform={`rotate(-90,12,${MT + H / 2})`}>Mt CO₂</text>
      {areaPaths.map(p => <path key={p.label} d={p.d} fill={p.color} opacity={0.82} />)}
      <line x1={ML} y1={MT} x2={ML} y2={MT + H} stroke="#C8C8D0" strokeWidth={1} />
      <line x1={ML} y1={MT + H} x2={VW - MR} y2={MT + H} stroke="#C8C8D0" strokeWidth={1} />
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
  return (
    <svg viewBox={`0 0 ${VW} ${VH}`} className="w-full">
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
    </svg>
  );
}

// ── Chart: Vulnerability Scatter (pure React SVG) ─────────────────────────────
function VulnerabilityScatter({ data, highlightIso3 }: {
  data: { iso3: string; name: string; vulnerability: number; readiness: number }[];
  highlightIso3: string;
}) {
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
  return (
    <svg viewBox={`0 0 ${VW} ${VH}`} className="w-full">
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
            <circle cx={xs(d.vulnerability)} cy={ys(d.readiness)} r={isHL ? 10 : 7}
              fill={color} stroke={isHL ? '#1A1A2E' : 'white'} strokeWidth={isHL ? 2.5 : 1.5} opacity={isHL ? 1 : 0.8} />
            <text x={xs(d.vulnerability)} y={ys(d.readiness) - 14} textAnchor="middle"
              fontSize={isHL ? 12 : 11} fill={isHL ? '#1A1A2E' : '#4A4A6A'} fontWeight={isHL ? '600' : '400'}>{d.name}</text>
          </g>
        );
      })}
      <line x1={ML} y1={MT} x2={ML} y2={MT + H} stroke="#C8C8D0" strokeWidth={1} />
      <line x1={ML} y1={MT + H} x2={VW - MR} y2={MT + H} stroke="#C8C8D0" strokeWidth={1} />
    </svg>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export function CountryClient({
  countryName, iso3, wbCo2Series, co2Comparison, gdpVsCo2,
  emberMix, renewableChange, scatterData, decouplingSeries, decouplingScore, pm25 = null,
}: CountryClientProps) {

  const [extra, setExtra] = useState<ExtraData>(EMPTY_EXTRA);

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
      });
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

  return (
    <div className="space-y-0">

      {/* ── Section 1: Emissions Trajectory ── */}
      <section className="border-b border-[--border-card] bg-white px-4 py-12">
        <div className="mx-auto max-w-[1200px]">
          <SectionTitle>Emissions Trajectory</SectionTitle>
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
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
              <EmissionsLineChart production={wbCo2Series} consumption={extra.consumptionCo2} countryName={countryName} />
              <SourceLabel>Source: World Bank WDI · EN.GHG.CO2.PC.CE.AR5{extra.consumptionCo2.length > 0 ? ' + OWID Consumption' : ''}</SourceLabel>
            </Card>

            {co2Comparison.length > 0 && (
              <Card>
                <h3 className="mb-2 text-sm font-semibold text-[--text-primary]">World Bank vs Climate TRACE (indexed)</h3>
                <div className="mb-3 flex items-center gap-4 text-xs">
                  <span className="flex items-center gap-1.5">
                    <span className="inline-block h-0.5 w-5 rounded bg-[#0066FF]" />
                    <span className="text-[--text-secondary]">WB CO₂/capita</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="inline-block h-0.5 w-5 rounded bg-[#F59E0B]" />
                    <span className="text-[--text-secondary]">Climate TRACE GHG</span>
                  </span>
                </div>
                <IndexedDualLineChart
                  data={co2Comparison.map(d => ({ year: d.year, a: d.wb, b: d.ct }))}
                  aColor="#0066FF" bColor="#F59E0B"
                  aLabel="WB CO₂/capita" bLabel="Climate TRACE GHG"
                />
                <SourceLabel>Source: World Bank WDI + Climate TRACE (indexed, {co2Comparison[0].year}=100)</SourceLabel>
              </Card>
            )}
          </div>

          {parisData ? (
            <InsightText>
              <strong>{countryName}&apos;s emissions</strong> grew at {signed(parisData.pre_paris_cagr_pct)}%/yr
              pre-Paris (2000–2014), then{' '}
              <strong className={parisData.post_paris_cagr_pct < 0 ? 'text-[--accent-positive]' : 'text-[--accent-negative]'}>
                {signed(parisData.post_paris_cagr_pct)}%/yr
              </strong>{' '}
              post-Paris (2015–2023) — a <strong>{signed(parisData.acceleration)}pp shift</strong>.
              {accelRank !== null && ` This ranks ${ordinal(accelRank)} largest deceleration among tracked countries.`}
              {cagrData && ` Per capita emissions reached ${parisData.value_2023.toFixed(1)} t in 2023 (${cagrData.total_change_pct > 0 ? '+' : ''}${cagrData.total_change_pct.toFixed(1)}% vs 2000).`}
            </InsightText>
          ) : (
            <InsightText>
              <strong>{countryName}&apos;s emissions trajectory</strong> reflects ongoing energy transition dynamics.
              Data sourced from World Bank WDI (2000–2023).
            </InsightText>
          )}

          <Card className="mt-6">
            <h3 className="mb-1 text-sm font-semibold text-[--text-primary]">Pre-Paris vs Post-Paris CAGR</h3>
            <ClimateGap highlightIso3={iso3} />
            <SourceLabel>Source: World Bank WDI · EN.GHG.CO2.PC.CE.AR5</SourceLabel>
          </Card>
        </div>
      </section>

      {/* ── Section 2: Energy Transition ── */}
      {emberMix && (
        <section className="border-b border-[--border-card] bg-[--bg-section] px-4 py-12">
          <div className="mx-auto max-w-[1200px]">
            <SectionTitle>Energy Transition</SectionTitle>
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <h3 className="mb-4 text-sm font-semibold text-[--text-primary]">
                  Electricity Generation Mix ({emberMix.year})
                </h3>
                <ClimateSankey
                  country={countryName}
                  fossil={emberMix.fossil}
                  renewable={emberMix.renewable}
                  nuclear={emberMix.other}
                />
                <details className="mt-3">
                  <summary className="cursor-pointer text-xs text-[--text-muted] hover:text-[--text-secondary]">Donut view</summary>
                  <div className="mt-2">
                    <DonutChart segments={[
                      { label: 'Renewable', value: emberMix.renewable, color: '#10B981' },
                      { label: 'Fossil', value: emberMix.fossil, color: '#78716C' },
                      { label: 'Nuclear & Other', value: emberMix.other, color: '#8B5CF6' },
                    ]} />
                  </div>
                </details>
                <SourceLabel>Source: Ember Global Electricity Review ({emberMix.year})</SourceLabel>
              </Card>

              <Card>
                <h3 className="mb-4 text-sm font-semibold text-[--text-primary]">Transition Progress</h3>
                <div className="space-y-4">
                  {[
                    { label: 'Renewable Share', value: `${emberMix.renewable.toFixed(1)}%`, sub: renewableChange != null ? `${renewableChange > 0 ? '↑ +' : '↓ '}${renewableChange.toFixed(1)}pp over 5 years` : undefined, subColor: renewableChange != null ? (renewableChange > 0 ? 'text-[--accent-positive]' : 'text-[--accent-negative]') : '' },
                    { label: 'Fossil Fuel Share', value: `${emberMix.fossil.toFixed(1)}%` },
                    { label: 'Nuclear & Other', value: `${emberMix.other.toFixed(1)}%` },
                  ].map(row => (
                    <div key={row.label} className="rounded-lg bg-[--bg-section] p-4">
                      <p className="text-sm text-[--text-secondary]">{row.label}</p>
                      <p className="mt-1 font-mono text-2xl font-bold text-[--text-primary]">{row.value}</p>
                      {row.sub && <p className={`mt-1 text-sm font-medium ${row.subColor}`}>{row.sub}</p>}
                    </div>
                  ))}
                </div>
              </Card>
            </div>

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

      {/* ── Section 3 (NEW): Emission Sources ── */}
      {ctraceBarsWithPct.length > 0 && (
        <section className="border-b border-[--border-card] bg-white px-4 py-12">
          <div className="mx-auto max-w-[1200px]">
            <SectionTitle>Where Do Emissions Come From?</SectionTitle>
            <Card>
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
              <HorizontalBarChart bars={ctraceBarsWithPct} />
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

      {/* ── Section 4 (NEW): Fossil Fuel Breakdown ── */}
      {hasFuelData && (
        <section className="border-b border-[--border-card] bg-[--bg-section] px-4 py-12">
          <div className="mx-auto max-w-[1200px]">
            <SectionTitle>What Burns? Fossil CO&#x2082; by Fuel Type</SectionTitle>
            <Card>
              <div className="mb-4 flex flex-wrap items-center gap-4 text-xs">
                {FUEL_SERIES.map(f => (
                  <span key={f.key} className="flex items-center gap-1.5">
                    <span className="inline-block h-3 w-3 rounded-sm" style={{ backgroundColor: f.color }} />
                    <span className="text-[--text-secondary]">{f.label}</span>
                  </span>
                ))}
              </div>
              <StackedAreaChart years={fuelYears} seriesDef={FUEL_SERIES} data={fuelData} />
              <SourceLabel>Source: Our World in Data (OWID) · OWID.COAL_CO2, OWID.OIL_CO2, OWID.GAS_CO2, OWID.CEMENT_CO2, OWID.FLARING_CO2</SourceLabel>
            </Card>
          </div>
        </section>
      )}

      {/* ── Section 5 (NEW): Historical Responsibility ── */}
      {(extra.cumulativeCo2 != null || extra.shareCumulative != null || extra.tempGhg != null) && (
        <section className="border-b border-[--border-card] bg-white px-4 py-12">
          <div className="mx-auto max-w-[1200px]">
            <SectionTitle>Historical Responsibility</SectionTitle>
            <div className="grid gap-4 sm:grid-cols-3">
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

            {tempBar.length > 0 && (
              <Card className="mt-6">
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
          </div>
        </section>
      )}

      {/* ── Section 6 (NEW): Beyond CO₂ ── */}
      {(extra.methaneSeries.length > 0 || extra.n2oSeries.length > 0) && (
        <section className="border-b border-[--border-card] bg-[--bg-section] px-4 py-12">
          <div className="mx-auto max-w-[1200px]">
            <SectionTitle>Beyond CO&#x2082;: Methane &amp; Nitrous Oxide</SectionTitle>
            <div className="mb-6 grid gap-4 sm:grid-cols-2">
              <StatCard
                label="Total GHG (latest)"
                value={extra.totalGhgLatest != null ? extra.totalGhgLatest.toFixed(1) : null}
                unit="Mt CO₂e"
                sub="All greenhouse gases combined"
              />
              <StatCard
                label="GHG per capita (latest)"
                value={extra.ghgPerCapitaLatest != null ? extra.ghgPerCapitaLatest.toFixed(2) : null}
                unit="t CO₂e"
                sub="Total GHG per person"
              />
            </div>

            {extra.methaneSeries.length > 0 && extra.n2oSeries.length > 0 && (
              <Card>
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
                <DualYLineChart
                  leftData={extra.methaneSeries} rightData={extra.n2oSeries}
                  leftColor="#F59E0B" rightColor="#8B5CF6"
                  leftUnit="CH₄ Mt" rightUnit="N₂O Mt"
                />
                <SourceLabel>Source: Our World in Data · OWID.METHANE, OWID.NITROUS_OXIDE</SourceLabel>
              </Card>
            )}
          </div>
        </section>
      )}

      {/* ── Section 7: Economic Decoupling (upgraded) ── */}
      {gdpVsCo2.length > 0 && (
        <section className="border-b border-[--border-card] bg-white px-4 py-12">
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
                    Decoupling Score: +{decouplingScore.toFixed(2)}
                  </span>
                )}
              </div>
              <IndexedTripleLineChart
                gdpCo2={gdpVsCo2}
                co2PerGdp={extra.co2PerGdpSeries}
                baseYear={gdpVsCo2[0].year}
              />
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

      {/* ── Section 8: Climate Vulnerability ── */}
      {scatterData.length > 0 && (
        <section className="border-b border-[--border-card] bg-[--bg-section] px-4 py-12">
          <div className="mx-auto max-w-[1200px]">
            <SectionTitle>Climate Vulnerability</SectionTitle>
            <Card>
              <h3 className="mb-4 text-sm font-semibold text-[--text-primary]">
                Vulnerability vs Readiness (Pilot Countries, 2023)
              </h3>
              <VulnerabilityScatter data={scatterData} highlightIso3={iso3} />
              <SourceLabel>Source: ND-GAIN Country Index (2023). Lower-left = ideal (low vulnerability, high readiness)</SourceLabel>
            </Card>

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
              </InsightText>
            )}

            {riskProfile && (
              <>
                <div className="mt-6 grid gap-4 md:grid-cols-2">
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
                <InsightText>
                  <strong>Assessment ({riskProfile.risk_level} risk):</strong>{' '}{riskProfile.summary}
                </InsightText>
              </>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
