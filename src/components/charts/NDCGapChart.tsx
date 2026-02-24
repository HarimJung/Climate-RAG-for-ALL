'use client';

import { useState, useEffect, useCallback } from 'react';

interface NDCData {
  iso3: string;
  country_name: string;
  historical: { year: number; value: number }[];
  projection: { year: number; value: number }[];
  confidence_band: { year: number; upper: number; lower: number }[];
  ndc_target?: { year: number; value: number; pct_reduction: number; reference_year: number };
  gap?: number;
  gap_pct?: number;
  achievement_probability?: number;
  cagr_2015_2023: number;
  status: 'on_track' | 'off_track' | 'no_target';
}

export function NDCGapChart({ iso3 }: { iso3: string }) {
  const [data, setData] = useState<NDCData | null>(null);
  const [loading, setLoading] = useState(true);
  const [hover, setHover] = useState<{ year: number; value: number; x: number; y: number; type: string } | null>(null);

  useEffect(() => {
    fetch(`/data/ndc-gap/${iso3}.json`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [iso3]);

  if (loading) return <div className="flex h-64 items-center justify-center"><div className="h-6 w-6 animate-spin rounded-full border-2 border-[#3B82F6] border-t-transparent" /></div>;
  if (!data || !data.historical || data.historical.length === 0) return null;

  const VW = 760, VH = 320, ML = 54, MR = 20, MT = 24, MB = 40;
  const W = VW - ML - MR, H = VH - MT - MB;

  const allPoints = [
    ...data.historical.map(d => d.value),
    ...data.projection.map(d => d.value),
    ...(data.confidence_band || []).flatMap(d => [d.upper, d.lower]),
    ...(data.ndc_target ? [data.ndc_target.value] : []),
  ].filter(v => v != null && isFinite(v));

  const minYear = Math.min(...data.historical.map(d => d.year));
  const maxYear = Math.max(
    ...data.projection.map(d => d.year),
    data.ndc_target?.year ?? 2035,
  );
  const maxVal = Math.ceil(Math.max(...allPoints) * 1.15);
  const minVal = Math.max(0, Math.floor(Math.min(...allPoints) * 0.85));

  const xs = (y: number) => ML + ((y - minYear) / Math.max(maxYear - minYear, 1)) * W;
  const ys = (v: number) => MT + H - ((v - minVal) / Math.max(maxVal - minVal, 1)) * H;

  // Y-axis ticks
  const yStep = Math.ceil((maxVal - minVal) / 5);
  const yTicks = Array.from({ length: 6 }, (_, i) => minVal + i * yStep).filter(v => v <= maxVal);

  // X-axis ticks
  const xStep = maxYear - minYear <= 20 ? 5 : 10;
  const xTicks: number[] = [];
  for (let y = Math.ceil(minYear / xStep) * xStep; y <= maxYear; y += xStep) xTicks.push(y);

  // Paths
  const histPath = data.historical
    .sort((a, b) => a.year - b.year)
    .map((d, i) => `${i ? 'L' : 'M'}${xs(d.year).toFixed(1)} ${ys(d.value).toFixed(1)}`)
    .join(' ');

  const projPath = data.projection.length > 0
    ? [
        `M${xs(data.historical[data.historical.length - 1]?.year ?? 2023).toFixed(1)} ${ys(data.historical[data.historical.length - 1]?.value ?? 0).toFixed(1)}`,
        ...data.projection.sort((a, b) => a.year - b.year).map(d => `L${xs(d.year).toFixed(1)} ${ys(d.value).toFixed(1)}`),
      ].join(' ')
    : '';

  // Confidence band
  const bandTop = (data.confidence_band || []).sort((a, b) => a.year - b.year);
  const bandBot = [...bandTop].reverse();
  const bandPath = bandTop.length > 0
    ? [
        ...bandTop.map((d, i) => `${i ? 'L' : 'M'}${xs(d.year).toFixed(1)} ${ys(d.upper).toFixed(1)}`),
        ...bandBot.map(d => `L${xs(d.year).toFixed(1)} ${ys(d.lower).toFixed(1)}`),
        'Z',
      ].join(' ')
    : '';

  // Gap fill between projection endpoint and NDC target
  const gapFillPath = data.ndc_target && data.projection.length > 0
    ? (() => {
        const projEnd = data.projection[data.projection.length - 1];
        const tgtYear = data.ndc_target.year;
        const tgtVal = data.ndc_target.value;
        if (!projEnd || projEnd.value <= tgtVal) return '';
        return `M${xs(tgtYear).toFixed(1)} ${ys(projEnd.value).toFixed(1)} L${xs(tgtYear).toFixed(1)} ${ys(tgtVal).toFixed(1)}`;
      })()
    : '';

  const statusColor = data.status === 'on_track' ? '#10B981' : data.status === 'off_track' ? '#EF4444' : '#94A3B8';
  const statusLabel = data.status === 'on_track' ? 'On Track' : data.status === 'off_track' ? 'Off Track' : 'No NDC Target';

  const handleMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const svgX = ((e.clientX - rect.left) / rect.width) * VW;
    const rawYear = minYear + ((svgX - ML) / W) * (maxYear - minYear);
    const clamped = Math.round(Math.max(minYear, Math.min(maxYear, rawYear)));

    const allData = [...data.historical.map(d => ({ ...d, type: 'historical' })), ...data.projection.map(d => ({ ...d, type: 'projection' }))];
    const nearest = allData.reduce((a, b) => Math.abs(a.year - clamped) <= Math.abs(b.year - clamped) ? a : b);
    setHover({ year: nearest.year, value: nearest.value, x: xs(nearest.year), y: ys(nearest.value), type: nearest.type });
  }, [data, minYear, maxYear]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div>
      <svg viewBox={`0 0 ${VW} ${VH}`} className="w-full" onMouseMove={handleMouseMove} onMouseLeave={() => setHover(null)} style={{ cursor: 'crosshair' }}>
        <defs>
          <linearGradient id={`ndc-area-${iso3}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.15} />
            <stop offset="100%" stopColor="#3B82F6" stopOpacity={0} />
          </linearGradient>
          <linearGradient id={`ndc-gap-fill-${iso3}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#EF4444" stopOpacity={0.25} />
            <stop offset="100%" stopColor="#EF4444" stopOpacity={0.08} />
          </linearGradient>
        </defs>

        {/* Grid */}
        {yTicks.map(v => (
          <line key={v} x1={ML} y1={ys(v)} x2={VW - MR} y2={ys(v)} stroke="#E8E8ED" strokeWidth={1} />
        ))}
        {yTicks.map(v => (
          <text key={v} x={ML - 6} y={ys(v)} textAnchor="end" dominantBaseline="middle" fontSize={11} fill="#64748B" fontFamily="monospace">{v}</text>
        ))}
        {xTicks.map(y => (
          <text key={y} x={xs(y)} y={VH - 12} textAnchor="middle" fontSize={11} fill="#64748B">{y}</text>
        ))}
        <text x={12} y={MT + H / 2} textAnchor="middle" fontSize={10} fill="#64748B" transform={`rotate(-90,12,${MT + H / 2})`}>t CO&#x2082;e/capita</text>

        {/* Confidence band */}
        {bandPath && <path d={bandPath} fill="#94A3B8" opacity={0.12} />}

        {/* Historical area fill */}
        {data.historical.length > 0 && (() => {
          const sorted = [...data.historical].sort((a, b) => a.year - b.year);
          const areaPath = `${histPath} L${xs(sorted[sorted.length - 1].year).toFixed(1)} ${ys(minVal).toFixed(1)} L${xs(sorted[0].year).toFixed(1)} ${ys(minVal).toFixed(1)} Z`;
          return <path d={areaPath} fill={`url(#ndc-area-${iso3})`} />;
        })()}

        {/* Historical line */}
        <path d={histPath} fill="none" stroke="#3B82F6" strokeWidth={2.5} strokeLinejoin="round" />

        {/* Projection line (dashed) */}
        {projPath && <path d={projPath} fill="none" stroke="#3B82F6" strokeWidth={2} strokeDasharray="6,4" opacity={0.7} />}

        {/* Gap fill */}
        {gapFillPath && data.ndc_target && data.projection.length > 0 && (() => {
          const projSorted = [...data.projection].sort((a, b) => a.year - b.year);
          const projEnd = projSorted[projSorted.length - 1];
          const tgtYear = data.ndc_target.year;
          const tgtVal = data.ndc_target.value;
          if (!projEnd || projEnd.value <= tgtVal) return null;
          const gapArea = `M${xs(tgtYear - 2).toFixed(1)} ${ys(projEnd.value).toFixed(1)} L${xs(tgtYear + 2).toFixed(1)} ${ys(projEnd.value).toFixed(1)} L${xs(tgtYear + 2).toFixed(1)} ${ys(tgtVal).toFixed(1)} L${xs(tgtYear - 2).toFixed(1)} ${ys(tgtVal).toFixed(1)} Z`;
          return <path d={gapArea} fill={`url(#ndc-gap-fill-${iso3})`} />;
        })()}

        {/* NDC target diamond */}
        {data.ndc_target && (() => {
          const tx = xs(data.ndc_target.year);
          const ty = ys(data.ndc_target.value);
          return (
            <g>
              <polygon points={`${tx},${ty - 8} ${tx + 6},${ty} ${tx},${ty + 8} ${tx - 6},${ty}`}
                fill="#EF4444" stroke="white" strokeWidth={2} />
              <text x={tx + 10} y={ty - 2} fontSize={11} fontWeight="700" fill="#EF4444" fontFamily="monospace">
                NDC: {data.ndc_target.value.toFixed(1)}t
              </text>
              <text x={tx + 10} y={ty + 12} fontSize={9} fill="#94A3B8">
                ({data.ndc_target.year}, -{data.ndc_target.pct_reduction}%)
              </text>
            </g>
          );
        })()}

        {/* End dot on historical */}
        {data.historical.length > 0 && (() => {
          const last = data.historical[data.historical.length - 1];
          return (
            <circle cx={xs(last.year)} cy={ys(last.value)} r={5} fill="#3B82F6" stroke="white" strokeWidth={2} />
          );
        })()}

        {/* Axes */}
        <line x1={ML} y1={MT} x2={ML} y2={MT + H} stroke="#CBD5E1" strokeWidth={1} />
        <line x1={ML} y1={MT + H} x2={VW - MR} y2={MT + H} stroke="#CBD5E1" strokeWidth={1} />

        {/* 2023 divider */}
        <line x1={xs(2023)} y1={MT} x2={xs(2023)} y2={MT + H} stroke="#94A3B8" strokeWidth={1} strokeDasharray="4,4" opacity={0.5} />
        <text x={xs(2023)} y={MT + 10} textAnchor="middle" fontSize={9} fill="#94A3B8">Now</text>

        {/* Hover tooltip */}
        {hover && (
          <g style={{ pointerEvents: 'none' }}>
            <line x1={hover.x} y1={MT} x2={hover.x} y2={MT + H} stroke="#CBD5E1" strokeWidth={1} strokeDasharray="4,3" />
            <circle cx={hover.x} cy={hover.y} r={4} fill={hover.type === 'historical' ? '#3B82F6' : '#94A3B8'} stroke="white" strokeWidth={2} />
            <rect x={hover.x + (hover.x > VW / 2 ? -100 : 8)} y={MT + 4} width={92} height={36} rx={6} fill="rgba(255,255,255,0.97)" stroke="#E2E8F0" strokeWidth={1} />
            <text x={hover.x + (hover.x > VW / 2 ? -92 : 16)} y={MT + 18} fontSize={11} fontWeight="700" fill="#0F172A" fontFamily="monospace">{hover.year}</text>
            <text x={hover.x + (hover.x > VW / 2 ? -92 : 16)} y={MT + 32} fontSize={10} fill="#3B82F6" fontFamily="monospace">{hover.value.toFixed(2)} t</text>
          </g>
        )}
      </svg>

      {/* Status badge + stats */}
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <span className="rounded-full px-3 py-1 text-xs font-semibold" style={{ backgroundColor: `${statusColor}15`, color: statusColor, border: `1px solid ${statusColor}30` }}>
          {statusLabel}
        </span>
        <span className="text-xs text-[#64748B]">
          CAGR: <span className="font-mono font-medium text-[#0F172A]">{(data.cagr_2015_2023 * 100).toFixed(2)}%/yr</span>
        </span>
        {data.achievement_probability != null && (
          <span className="text-xs text-[#64748B]">
            Achievement: <span className="font-mono font-medium text-[#0F172A]">{data.achievement_probability.toFixed(1)}%</span>
          </span>
        )}
        {data.gap != null && (
          <span className="text-xs text-[#64748B]">
            Gap: <span className="font-mono font-medium text-[#EF4444]">{data.gap > 0 ? '+' : ''}{data.gap.toFixed(2)} t</span>
          </span>
        )}
      </div>
    </div>
  );
}
