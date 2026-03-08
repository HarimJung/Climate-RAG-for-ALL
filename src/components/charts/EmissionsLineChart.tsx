'use client';

import React, { useState, useCallback } from 'react';

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

// ── Props ─────────────────────────────────────────────────────────────────────
export interface EmissionsLineChartProps {
  production: { year: number; value: number }[];
  consumption?: { year: number; value: number }[];
  countryName: string;
  strokeW?: number;
}

// ── Chart: Emissions Line (production + optional consumption) ─────────────────
export function EmissionsLineChart({
  production, consumption, countryName, strokeW = 2.5,
}: EmissionsLineChartProps) {
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
