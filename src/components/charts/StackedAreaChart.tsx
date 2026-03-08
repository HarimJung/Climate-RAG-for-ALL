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
export interface StackedAreaChartProps {
  years: number[];
  seriesDef: { key: string; label: string; color: string }[];
  data: Record<number, Record<string, number>>;
}

// ── Chart: Stacked Area (Fossil Fuel Breakdown) ───────────────────────────────
export function StackedAreaChart({
  years, seriesDef, data,
}: StackedAreaChartProps) {
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
