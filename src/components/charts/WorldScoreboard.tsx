'use client';

import { useEffect, useRef, useState } from 'react';
import { geoNaturalEarth1, geoPath } from 'd3-geo';

export interface CountryClass {
  iso3:      string;
  name:      string;
  cls:       'Changer' | 'Starter' | 'Talker' | 'NoData';
  co2?:      number;
  renewable?: number;
}

export interface WorldScoreboardProps {
  countries: CountryClass[];
  width?:    number;
  height?:   number;
  className?: string;
}

const CLASS_COLOR: Record<string, string> = {
  Changer: '#10B981',
  Starter: '#F59E0B',
  Talker:  '#EF4444',
  NoData:  '#E5E7EB',
};
const CLASS_LABEL: Record<string, string> = {
  Changer: 'Changer (↓CO₂ + ↑Renewable)',
  Starter: 'Starter (one condition met)',
  Talker:  'Talker (neither condition)',
  NoData:  'No Data',
};

interface GeoFeature {
  type: string;
  id: string;
  properties: { name: string };
  geometry: unknown;
}

interface TooltipState {
  x: number; y: number;
  iso3: string; name: string;
  cls: string; co2?: number; renewable?: number;
}

export function WorldScoreboard({ countries, width = 900, height = 460, className = '' }: WorldScoreboardProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [features, setFeatures] = useState<GeoFeature[]>([]);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const [paths, setPaths]   = useState<Map<string, string>>(new Map());

  const classMap = new Map<string, CountryClass>(countries.map(c => [c.iso3, c]));

  // Load GeoJSON
  useEffect(() => {
    fetch('/geo/world-110m.json')
      .then(r => r.json())
      .then(geo => setFeatures(geo.features ?? []))
      .catch(e => console.warn('WorldScoreboard: GeoJSON load failed', e));
  }, []);

  // Compute projected paths whenever features or size change
  useEffect(() => {
    if (features.length === 0) return;

    const projection = geoNaturalEarth1()
      .scale(width / 6.28)
      .translate([width / 2, height / 2]);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pathGenerator = geoPath(projection as any);

    const map = new Map<string, string>();
    for (const feat of features) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const d = pathGenerator(feat as any);
        if (d) map.set(feat.id, d);
      } catch { /* skip invalid geometry */ }
    }
    setPaths(map);
  }, [features, width, height]);

  function handleMouseEnter(e: React.MouseEvent<SVGPathElement>, feat: GeoFeature) {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const scaleX = width  / rect.width;
    const scaleY = height / rect.height;
    const cx = (e.clientX - rect.left) * scaleX;
    const cy = (e.clientY - rect.top)  * scaleY;
    const cc = classMap.get(feat.id);
    setTooltip({
      x: cx, y: cy,
      iso3: feat.id,
      name: cc?.name ?? feat.properties.name,
      cls:  cc?.cls  ?? 'NoData',
      co2:  cc?.co2,
      renewable: cc?.renewable,
    });
  }

  const counts = { Changer: 0, Starter: 0, Talker: 0, NoData: 0 };
  for (const cc of countries) counts[cc.cls] = (counts[cc.cls] ?? 0) + 1;

  return (
    <div className={`relative ${className}`} style={{ background: '#FAFAF9', borderRadius: 12 }}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${width} ${height}`}
        style={{ display: 'block', width: '100%', height: 'auto' }}
        onMouseLeave={() => setTooltip(null)}
      >
        {/* Ocean background */}
        <rect width={width} height={height} fill="#EFF6FF" rx={8} />

        {features.length === 0 ? (
          <text x={width / 2} y={height / 2} textAnchor="middle" fontSize={14} fill="#94A3B8">
            Loading map…
          </text>
        ) : (
          features.map(feat => {
            const d = paths.get(feat.id);
            if (!d) return null;
            const cc  = classMap.get(feat.id);
            const cls = cc?.cls ?? 'NoData';
            const color = CLASS_COLOR[cls];
            return (
              <path
                key={feat.id}
                d={d}
                fill={color}
                stroke="#fff"
                strokeWidth={0.4}
                opacity={cls === 'NoData' ? 0.6 : 0.85}
                style={{ cursor: 'pointer', transition: 'opacity 0.15s' }}
                onMouseEnter={e => handleMouseEnter(e, feat)}
                onMouseLeave={() => setTooltip(null)}
              />
            );
          })
        )}

        {/* Legend */}
        {(['Changer', 'Starter', 'Talker', 'NoData'] as const).map((cls, i) => {
          const lx = 16 + i * 210;
          const ly = height - 24;
          return (
            <g key={cls} transform={`translate(${lx}, ${ly})`}>
              <rect width={12} height={12} rx={3} fill={CLASS_COLOR[cls]} opacity={cls === 'NoData' ? 0.6 : 0.85} />
              <text x={17} y={10} fontSize={10} fill="#4A4A6A" fontFamily="Inter, system-ui, sans-serif">
                {cls} ({counts[cls]})
              </text>
            </g>
          );
        })}
      </svg>

      {/* Tooltip */}
      {tooltip && (() => {
        const svgEl = svgRef.current;
        if (!svgEl) return null;
        const rect = svgEl.getBoundingClientRect();
        const px = (tooltip.x / width)  * rect.width  + rect.left;
        const py = (tooltip.y / height) * rect.height + rect.top;
        const toLeft = px > window.innerWidth * 0.65;
        return (
          <div style={{
            position: 'fixed',
            left:  toLeft ? undefined : px + 12,
            right: toLeft ? window.innerWidth - px + 12 : undefined,
            top:   py - 10,
            background: '#1A1A2E', color: '#fff',
            padding: '8px 12px', borderRadius: 8,
            fontSize: 12, pointerEvents: 'none', zIndex: 50,
            fontFamily: 'Inter, system-ui, sans-serif',
            boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
            minWidth: 140,
          }}>
            <div style={{ fontWeight: 700, marginBottom: 4 }}>{tooltip.name}</div>
            <div style={{ color: CLASS_COLOR[tooltip.cls], fontWeight: 600 }}>{tooltip.cls}</div>
            {tooltip.co2  != null && <div style={{ color: '#94A3B8', marginTop: 2 }}>CO₂ {tooltip.co2.toFixed(1)} t/cap</div>}
            {tooltip.renewable != null && <div style={{ color: '#94A3B8' }}>Renewable {tooltip.renewable.toFixed(1)}%</div>}
          </div>
        );
      })()}
    </div>
  );
}
