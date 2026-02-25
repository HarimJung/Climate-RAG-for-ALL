'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

export interface ClimateGapProps {
  highlightIso3?: string;
  className?: string;
}

interface CountryCagr {
  iso3: string;
  name: string;
  pre: number;
  post: number;
}

export function ClimateGap({ highlightIso3, className = '' }: ClimateGapProps) {
  const [countries, setCountries] = useState<CountryCagr[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      try {
        // Fetch CO2 per capita for key years (with ±2yr fallback range)
        const { data: rows, error } = await supabase
          .from('country_data')
          .select('country_iso3, year, value')
          .eq('indicator_code', 'EN.GHG.CO2.PC.CE.AR5')
          .gte('year', 1998)
          .lte('year', 2023)
          .order('year')
          .limit(10000);

        if (error || !rows || rows.length === 0) {
          setLoading(false);
          return;
        }

        // Get country names
        const { data: countryRows } = await supabase
          .from('countries')
          .select('iso3, name')
          .limit(500);
        const nameMap: Record<string, string> = {};
        for (const c of countryRows || []) nameMap[c.iso3] = c.name;

        // Group by country
        const byCountry: Record<string, Record<number, number>> = {};
        for (const r of rows) {
          if (r.value == null) continue;
          const v = Number(r.value);
          if (isNaN(v)) continue;
          if (!byCountry[r.country_iso3]) byCountry[r.country_iso3] = {};
          byCountry[r.country_iso3][r.year] = v;
        }

        // Calculate CAGR for each country
        const results: CountryCagr[] = [];
        for (const [iso3, yearData] of Object.entries(byCountry)) {
          // Find value at target year, with ±2 year fallback
          const findValue = (target: number): number | null => {
            for (const offset of [0, 1, -1, 2, -2]) {
              const v = yearData[target + offset];
              if (v != null && v > 0) return v;
            }
            return null;
          };

          const v2000 = findValue(2000);
          const v2014 = findValue(2014);
          const v2015 = findValue(2015);
          const v2023 = findValue(2023);

          if (!v2000 || !v2014 || !v2015 || !v2023) continue;

          const pre = (Math.pow(v2014 / v2000, 1 / 14) - 1) * 100;
          const post = (Math.pow(v2023 / v2015, 1 / 8) - 1) * 100;

          // Skip extreme outliers
          if (Math.abs(pre) > 20 || Math.abs(post) > 20) continue;

          results.push({ iso3, name: nameMap[iso3] || iso3, pre, post });
        }

        setCountries(results);
      } catch (err) {
        console.error('[ClimateGap] fetch error:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className={`flex h-64 items-center justify-center ${className}`}>
        <p className="text-sm text-[#94A3B8]">Loading comparison data&#8230;</p>
      </div>
    );
  }

  if (countries.length === 0) {
    return (
      <div className={`flex h-40 items-center justify-center rounded-lg bg-[#F8F9FA] ${className}`}>
        <p className="text-sm text-[#4A4A6A]">No comparison data available</p>
      </div>
    );
  }

  const highlighted = countries.find(c => c.iso3 === highlightIso3);

  // Chart dimensions
  const W = 900, H = 600;
  const LEFT_X = 230, RIGHT_X = 670;
  const Y_TOP = 90, Y_BOT = 530;

  // Auto-range from data
  const allValues = countries.flatMap(c => [c.pre, c.post]);
  const dataMin = Math.min(...allValues);
  const dataMax = Math.max(...allValues);
  const MIN_V = Math.floor(dataMin) - 1;
  const MAX_V = Math.ceil(dataMax) + 1;

  const ZERO_Y = Y_TOP + ((MAX_V - 0) / (MAX_V - MIN_V)) * (Y_BOT - Y_TOP);

  const TICKS: number[] = [];
  for (let t = Math.ceil(MIN_V); t <= Math.floor(MAX_V); t++) TICKS.push(t);

  function yPos(v: number) {
    return Y_TOP + ((MAX_V - v) / (MAX_V - MIN_V)) * (Y_BOT - Y_TOP);
  }

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="xMidYMid meet"
      style={{ display: 'block', width: '100%', height: 'auto' }}
      className={className}
      role="img"
      aria-label="Pre-Paris vs Post-Paris emissions slope chart"
    >
      <rect width={W} height={H} fill="#FFFFFF" />

      {/* Title */}
      <text x={W / 2} y={38} textAnchor="middle" fontSize={22} fontWeight="700"
        fontFamily="Inter, system-ui, sans-serif" fill="#1A1A2E">
        Pre-Paris vs Post-Paris Emissions Growth
      </text>
      <text x={W / 2} y={60} textAnchor="middle" fontSize={13}
        fontFamily="Inter, system-ui, sans-serif" fill="#94A3B8">
        CO&#x2082; per capita CAGR (%) &#8212; {countries.length} countries
      </text>

      {/* Column headers */}
      <text x={LEFT_X} y={82} textAnchor="middle" fontSize={13} fontWeight="600"
        fontFamily="Inter, system-ui, sans-serif" fill="#4A4A6A">Pre-Paris (2000&#8211;2014)</text>
      <text x={RIGHT_X} y={82} textAnchor="middle" fontSize={13} fontWeight="600"
        fontFamily="Inter, system-ui, sans-serif" fill="#4A4A6A">Post-Paris (2015&#8211;2023)</text>

      {/* Grid lines */}
      {TICKS.map(tick => (
        <g key={tick}>
          <line x1={LEFT_X - 50} x2={RIGHT_X + 50} y1={yPos(tick)} y2={yPos(tick)}
            stroke="#E8E8ED" strokeWidth={1} />
          {tick !== 0 && (
            <text x={LEFT_X - 58} y={yPos(tick) + 4} textAnchor="end" fontSize={11}
              fontFamily="monospace" fill="#C8C8D0">
              {tick > 0 ? `+${tick}` : tick}%
            </text>
          )}
        </g>
      ))}

      {/* Zero line */}
      <line x1={LEFT_X - 50} x2={RIGHT_X + 50} y1={ZERO_Y} y2={ZERO_Y}
        stroke="#94A3B8" strokeWidth={1.5} strokeDasharray="6,4" />
      <text x={LEFT_X - 58} y={ZERO_Y + 4} textAnchor="end" fontSize={11}
        fontFamily="monospace" fill="#94A3B8">0%</text>

      {/* Column axis lines */}
      <line x1={LEFT_X} x2={LEFT_X} y1={Y_TOP - 8} y2={Y_BOT + 8} stroke="#E8E8ED" strokeWidth={1} />
      <line x1={RIGHT_X} x2={RIGHT_X} y1={Y_TOP - 8} y2={Y_BOT + 8} stroke="#E8E8ED" strokeWidth={1} />

      {/* Background country lines (thin, faded) */}
      {countries.map(c => {
        if (c.iso3 === highlightIso3) return null;
        const y1 = yPos(c.pre);
        const y2 = yPos(c.post);
        const isDecel = c.post < c.pre;
        return (
          <g key={c.iso3} opacity={0.15}>
            <line x1={LEFT_X} y1={y1} x2={RIGHT_X} y2={y2}
              stroke={isDecel ? '#10B981' : '#EF4444'} strokeWidth={1.5} />
            <circle cx={LEFT_X} cy={y1} r={3} fill={isDecel ? '#10B981' : '#EF4444'} />
            <circle cx={RIGHT_X} cy={y2} r={3} fill={isDecel ? '#10B981' : '#EF4444'} />
          </g>
        );
      })}

      {/* Highlighted country (rendered last = on top) */}
      {highlighted && (() => {
        const y1 = yPos(highlighted.pre);
        const y2 = yPos(highlighted.post);
        const isDecel = highlighted.post < highlighted.pre;
        const color = '#0066FF';
        const acc = highlighted.post - highlighted.pre;
        const accText = (acc >= 0 ? '+' : '') + acc.toFixed(2) + 'pp';
        const midX = (LEFT_X + RIGHT_X) / 2;
        const midY = (y1 + y2) / 2;

        return (
          <g>
            <line x1={LEFT_X} y1={y1} x2={RIGHT_X} y2={y2}
              stroke={color} strokeWidth={3.5} />

            {/* Left dot + label */}
            <circle cx={LEFT_X} cy={y1} r={7} fill={color} stroke="#FFFFFF" strokeWidth={2} />
            <text x={LEFT_X - 14} y={y1 + 4} textAnchor="end" fontSize={13}
              fontWeight="700" fill={color} fontFamily="Inter, system-ui, sans-serif">
              {highlighted.name} {highlighted.pre >= 0 ? '+' : ''}{highlighted.pre.toFixed(2)}%
            </text>

            {/* Right dot + label */}
            <circle cx={RIGHT_X} cy={y2} r={7} fill={color} stroke="#FFFFFF" strokeWidth={2} />
            <text x={RIGHT_X + 14} y={y2 + 4} fontSize={13}
              fontWeight="700" fill={color} fontFamily="Inter, system-ui, sans-serif">
              {highlighted.post >= 0 ? '+' : ''}{highlighted.post.toFixed(2)}%  {highlighted.iso3}
            </text>

            {/* Acceleration badge */}
            <rect x={midX - 44} y={midY - 13} width={88} height={26} rx={13}
              fill={isDecel ? '#ECFDF5' : '#FEF2F2'}
              stroke={isDecel ? '#A7F3D0' : '#FECACA'} strokeWidth={1} />
            <text x={midX} y={midY + 4} textAnchor="middle" fontSize={12} fontWeight="700"
              fontFamily="monospace" fill={isDecel ? '#059669' : '#DC2626'}>
              {accText}
            </text>
          </g>
        );
      })()}

      {/* Legend */}
      <g transform={`translate(${W / 2 - 180}, ${H - 36})`}>
        <line x1={0} x2={22} y1={0} y2={0} stroke="#10B981" strokeWidth={2.5} />
        <text x={30} y={4} fontSize={12} fill="#4A4A6A" fontFamily="Inter, system-ui, sans-serif">
          Deceleration (post &lt; pre)
        </text>
        <line x1={230} x2={252} y1={0} y2={0} stroke="#EF4444" strokeWidth={2.5} />
        <text x={260} y={4} fontSize={12} fill="#4A4A6A" fontFamily="Inter, system-ui, sans-serif">
          Acceleration (post &gt; pre)
        </text>
      </g>

      {/* Watermark */}
      <text x={W - 20} y={H - 16} textAnchor="end" fontSize={12}
        fontFamily="Inter, system-ui, sans-serif" fill="#C8C8D0">visualclimate.org</text>
    </svg>
  );
}
