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
export interface DualYLineChartProps {
  leftData: { year: number; value: number }[];
  rightData: { year: number; value: number }[];
  leftColor: string;
  rightColor: string;
  leftUnit: string;
  rightUnit: string;
}

// ── Chart: Dual Y-axis Line (Methane + N₂O) ──────────────────────────────────
export function DualYLineChart({
  leftData, rightData, leftColor, rightColor, leftUnit, rightUnit,
}: DualYLineChartProps) {
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
