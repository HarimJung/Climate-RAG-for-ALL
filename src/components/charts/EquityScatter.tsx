'use client';

import { useState, useEffect } from 'react';

interface EquityCountry {
  iso3: string;
  name: string;
  cumulative_co2_per_capita: number;
  vulnerability: number;
  current_co2_pc: number;
  quadrant: string;
}

interface EquityData {
  metadata: {
    country_count: number;
    median_cumulative_co2_pc: number;
    median_vulnerability: number;
  };
  quadrant_summary: Record<string, number>;
  countries: EquityCountry[];
}

const QUADRANT_COLORS: Record<string, string> = {
  'Historical Polluter': '#3B82F6',
  'Climate Victim': '#EF4444',
  'Double Burden': '#F59E0B',
  'Low Impact': '#10B981',
};

export function EquityScatter({ highlightIso3, onLoad }: { highlightIso3: string; onLoad?: (hasData: boolean) => void }) {
  const [data, setData] = useState<EquityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [hover, setHover] = useState<string | null>(null);

  useEffect(() => {
    fetch('/data/equity-scatter.json')
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        setData(d);
        setLoading(false);
        onLoad?.(d != null && d.countries?.length > 0);
      })
      .catch(() => { setLoading(false); onLoad?.(false); });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) return <div className="flex h-64 items-center justify-center"><div className="h-6 w-6 animate-spin rounded-full border-2 border-[#3B82F6] border-t-transparent" /></div>;
  if (!data || !data.countries || data.countries.length === 0) return null;

  const VW = 760, VH = 400, ML = 54, MR = 20, MT = 24, MB = 52;
  const W = VW - ML - MR, H = VH - MT - MB;

  const countries = data.countries;
  const medX = data.metadata.median_cumulative_co2_pc;
  const medY = data.metadata.median_vulnerability;

  const maxX = Math.max(...countries.map(c => c.cumulative_co2_per_capita)) * 1.1;
  const minX = 0;
  const maxY = Math.max(...countries.map(c => c.vulnerability)) * 1.05;
  const minY = Math.min(...countries.map(c => c.vulnerability)) * 0.95;

  const xs = (v: number) => ML + ((v - minX) / (maxX - minX)) * W;
  const ys = (v: number) => MT + H - ((v - minY) / (maxY - minY)) * H;

  // Bubble radius from current_co2_pc (sqrt scale)
  const maxCo2Pc = Math.max(...countries.map(c => c.current_co2_pc), 1);
  const radius = (v: number) => 4 + Math.sqrt(v / maxCo2Pc) * 18;

  // Y-axis ticks
  const yRange = maxY - minY;
  const yStep = Number((yRange / 5).toPrecision(1));
  const yTicks: number[] = [];
  for (let v = Math.ceil(minY / yStep) * yStep; v <= maxY; v += yStep) yTicks.push(v);

  // X-axis ticks
  const xStep = Math.ceil(maxX / 5 / 100) * 100 || 100;
  const xTicks: number[] = [];
  for (let v = 0; v <= maxX; v += xStep) xTicks.push(v);

  const highlighted = countries.find(c => c.iso3 === highlightIso3);

  return (
    <div>
      <svg viewBox={`0 0 ${VW} ${VH}`} className="w-full">
        <defs>
          <filter id="eq-shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="1" stdDeviation="2" floodColor="#000" floodOpacity="0.1" />
          </filter>
        </defs>

        {/* Grid */}
        {yTicks.map(v => (
          <line key={`yg-${v}`} x1={ML} y1={ys(v)} x2={VW - MR} y2={ys(v)} stroke="#E8E8ED" strokeWidth={1} />
        ))}
        {xTicks.map(v => (
          <line key={`xg-${v}`} x1={xs(v)} y1={MT} x2={xs(v)} y2={MT + H} stroke="#E8E8ED" strokeWidth={1} />
        ))}

        {/* Median crosshairs */}
        <line x1={xs(medX)} y1={MT} x2={xs(medX)} y2={MT + H} stroke="#94A3B8" strokeWidth={1} strokeDasharray="6,4" opacity={0.6} />
        <line x1={ML} y1={ys(medY)} x2={VW - MR} y2={ys(medY)} stroke="#94A3B8" strokeWidth={1} strokeDasharray="6,4" opacity={0.6} />

        {/* Quadrant labels */}
        <text x={xs(medX / 2)} y={MT + 14} textAnchor="middle" fontSize={9} fill="#10B981" fontWeight="600" opacity={0.6}>Low Impact</text>
        <text x={xs(medX + (maxX - medX) / 2)} y={MT + 14} textAnchor="middle" fontSize={9} fill="#3B82F6" fontWeight="600" opacity={0.6}>Historical Polluters</text>
        <text x={xs(medX / 2)} y={MT + H - 6} textAnchor="middle" fontSize={9} fill="#EF4444" fontWeight="600" opacity={0.6}>Climate Victims</text>
        <text x={xs(medX + (maxX - medX) / 2)} y={MT + H - 6} textAnchor="middle" fontSize={9} fill="#F59E0B" fontWeight="600" opacity={0.6}>Double Burden</text>

        {/* Axis labels */}
        {yTicks.map(v => (
          <text key={`yl-${v}`} x={ML - 6} y={ys(v)} textAnchor="end" dominantBaseline="middle" fontSize={10} fill="#64748B" fontFamily="monospace">{v.toFixed(2)}</text>
        ))}
        {xTicks.map(v => (
          <text key={`xl-${v}`} x={xs(v)} y={VH - MB + 16} textAnchor="middle" fontSize={10} fill="#64748B" fontFamily="monospace">{v}</text>
        ))}
        <text x={VW / 2} y={VH - 6} textAnchor="middle" fontSize={10} fill="#64748B">Cumulative CO&#x2082; per capita (t)</text>
        <text x={12} y={MT + H / 2} textAnchor="middle" fontSize={10} fill="#64748B" transform={`rotate(-90,12,${MT + H / 2})`}>ND-GAIN Vulnerability</text>

        {/* Bubbles — non-highlighted first */}
        {countries.filter(c => c.iso3 !== highlightIso3).map(c => {
          const cx = xs(c.cumulative_co2_per_capita);
          const cy = ys(c.vulnerability);
          const r = radius(c.current_co2_pc);
          const color = QUADRANT_COLORS[c.quadrant] || '#94A3B8';
          const isHover = hover === c.iso3;
          return (
            <g key={c.iso3} onMouseEnter={() => setHover(c.iso3)} onMouseLeave={() => setHover(null)} style={{ cursor: 'pointer' }}>
              <circle
                cx={cx} cy={cy} r={r}
                fill={color} fillOpacity={isHover ? 0.35 : 0.2}
                stroke={color} strokeWidth={isHover ? 2 : 1} strokeOpacity={isHover ? 1 : 0.5}
                style={{ transition: 'all 0.15s' }}
              />
              {isHover && (
                <text x={cx} y={cy - r - 4} textAnchor="middle" fontSize={10} fontWeight="600" fill={color}>{c.iso3}</text>
              )}
            </g>
          );
        })}

        {/* Highlighted country on top */}
        {highlighted && (() => {
          const cx = xs(highlighted.cumulative_co2_per_capita);
          const cy = ys(highlighted.vulnerability);
          const r = radius(highlighted.current_co2_pc) + 3;
          const color = QUADRANT_COLORS[highlighted.quadrant] || '#3B82F6';
          return (
            <g>
              <circle cx={cx} cy={cy} r={r + 4} fill="none" stroke={color} strokeWidth={2} strokeDasharray="4,3" opacity={0.5} />
              <circle cx={cx} cy={cy} r={r} fill={color} fillOpacity={0.4} stroke={color} strokeWidth={2.5} filter="url(#eq-shadow)" />
              <text x={cx} y={cy - r - 6} textAnchor="middle" fontSize={12} fontWeight="700" fill={color}>{highlighted.name}</text>
            </g>
          );
        })()}

        {/* Axes */}
        <line x1={ML} y1={MT} x2={ML} y2={MT + H} stroke="#CBD5E1" strokeWidth={1} />
        <line x1={ML} y1={MT + H} x2={VW - MR} y2={MT + H} stroke="#CBD5E1" strokeWidth={1} />

        {/* Hover tooltip */}
        {hover && (() => {
          const c = countries.find(ct => ct.iso3 === hover);
          if (!c) return null;
          const cx = xs(c.cumulative_co2_per_capita);
          const cy = ys(c.vulnerability);
          const tooltipW = 150;
          const tooltipX = cx + tooltipW + 10 > VW ? cx - tooltipW - 10 : cx + 10;
          const tooltipY = Math.max(MT, cy - 40);
          return (
            <g style={{ pointerEvents: 'none' }}>
              <rect x={tooltipX} y={tooltipY} width={tooltipW} height={62} rx={6} fill="rgba(255,255,255,0.97)" stroke="#E2E8F0" strokeWidth={1} />
              <text x={tooltipX + 8} y={tooltipY + 16} fontSize={11} fontWeight="700" fill="#0F172A">{c.name}</text>
              <text x={tooltipX + 8} y={tooltipY + 30} fontSize={9} fill="#64748B" fontFamily="monospace">
                Cumul: {c.cumulative_co2_per_capita.toFixed(0)} t/cap
              </text>
              <text x={tooltipX + 8} y={tooltipY + 42} fontSize={9} fill="#64748B" fontFamily="monospace">
                Vuln: {c.vulnerability.toFixed(3)}
              </text>
              <text x={tooltipX + 8} y={tooltipY + 54} fontSize={9} fill="#64748B" fontFamily="monospace">
                Current: {c.current_co2_pc.toFixed(2)} t/cap
              </text>
            </g>
          );
        })()}
      </svg>

      {/* Legend */}
      <div className="mt-3 flex flex-wrap items-center gap-3">
        {Object.entries(QUADRANT_COLORS).map(([label, color]) => (
          <div key={label} className="flex items-center gap-1.5">
            <div className="h-3 w-3 rounded-full" style={{ backgroundColor: color, opacity: 0.5 }} />
            <span className="text-xs text-[#64748B]">{label}</span>
            {data.quadrant_summary[label] != null && (
              <span className="text-xs font-mono font-medium text-[#0F172A]">({data.quadrant_summary[label]})</span>
            )}
          </div>
        ))}
        <span className="text-xs text-[#94A3B8]">Bubble size = current CO&#x2082;/cap</span>
      </div>
    </div>
  );
}
