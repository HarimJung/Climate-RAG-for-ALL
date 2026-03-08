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
export interface IndexedDualLineChartProps {
  data: { year: number; a: number; b: number }[];
  aColor: string;
  bColor: string;
  aLabel: string;
  bLabel: string;
  yAxisLabel?: string;
}

export interface IndexedTripleLineChartProps {
  gdpCo2: { year: number; gdp: number; co2: number }[];
  co2PerGdp: { year: number; value: number }[];
  baseYear: number;
}

// ── Chart: Indexed Dual Line (WB vs CT / GDP vs CO₂) ─────────────────────────
export function IndexedDualLineChart({
  data, aColor, bColor, aLabel, bLabel, yAxisLabel,
}: IndexedDualLineChartProps) {
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
export function IndexedTripleLineChart({
  gdpCo2, co2PerGdp, baseYear,
}: IndexedTripleLineChartProps) {
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
