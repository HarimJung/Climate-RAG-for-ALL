'use client';

export interface ClimateGapProps {
  highlightIso3?: string;
  className?: string;
}

// 6 pilot countries (always shown at normal opacity)
const PILOT_ISO3 = new Set(['KOR', 'USA', 'DEU', 'BRA', 'NGA', 'BGD']);

const COUNTRIES = [
  // ── 6 pilot countries ────────────────────────────────────────
  { iso3: 'KOR', name: 'South Korea',   pre:  1.62, post: -1.25, color: '#0066FF' },
  { iso3: 'USA', name: 'United States', pre: -1.74, post: -1.87, color: '#EF4444' },
  { iso3: 'DEU', name: 'Germany',       pre: -1.48, post: -2.41, color: '#F59E0B' },
  { iso3: 'BRA', name: 'Brazil',        pre:  2.08, post:  0.85, color: '#10B981' },
  { iso3: 'NGA', name: 'Nigeria',       pre:  3.92, post:  2.15, color: '#8B5CF6' },
  { iso3: 'BGD', name: 'Bangladesh',    pre:  6.52, post:  3.28, color: '#EC4899' },
  // ── 14 expanded countries ────────────────────────────────────
  { iso3: 'CHN', name: 'China',         pre:  7.12, post:  1.85, color: '#FF6B35' },
  { iso3: 'IND', name: 'India',         pre:  4.58, post:  3.42, color: '#FF9500' },
  { iso3: 'JPN', name: 'Japan',         pre: -0.52, post: -2.18, color: '#E91E63' },
  { iso3: 'GBR', name: 'United Kingdom',pre: -2.15, post: -4.32, color: '#2196F3' },
  { iso3: 'FRA', name: 'France',        pre: -1.05, post: -2.68, color: '#009688' },
  { iso3: 'CAN', name: 'Canada',        pre: -0.82, post: -1.45, color: '#FF5722' },
  { iso3: 'AUS', name: 'Australia',     pre:  0.35, post: -1.92, color: '#FF9800' },
  { iso3: 'IDN', name: 'Indonesia',     pre:  4.25, post:  2.88, color: '#4CAF50' },
  { iso3: 'SAU', name: 'Saudi Arabia',  pre:  3.15, post:  0.92, color: '#607D8B' },
  { iso3: 'ZAF', name: 'South Africa',  pre:  0.45, post: -0.85, color: '#9C27B0' },
  { iso3: 'MEX', name: 'Mexico',        pre:  0.88, post: -0.52, color: '#795548' },
  { iso3: 'RUS', name: 'Russia',        pre: -0.35, post:  0.28, color: '#F44336' },
  { iso3: 'TUR', name: 'Turkey',        pre:  2.95, post:  1.65, color: '#D81B60' },
  { iso3: 'EGY', name: 'Egypt',         pre:  3.82, post:  2.15, color: '#FFA000' },
];

const W = 900;
const H = 600;
const LEFT_X = 230;
const RIGHT_X = 670;
const MIN_V = -5;
const MAX_V = 8;
const Y_TOP = 90;
const Y_BOT = 530;
const ZERO_Y = Y_TOP + ((MAX_V - 0) / (MAX_V - MIN_V)) * (Y_BOT - Y_TOP);
const TICKS = [-4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6, 7];

function yPos(v: number) {
  return Y_TOP + ((MAX_V - v) / (MAX_V - MIN_V)) * (Y_BOT - Y_TOP);
}

export function ClimateGap({ highlightIso3, className = '' }: ClimateGapProps) {
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
        CO&#x2082; per capita CAGR (%) &#8212; 20 countries
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

      {/* Slope lines + labels — background countries rendered first (z-order) */}
      {COUNTRIES.map(c => {
        const isPilot = PILOT_ISO3.has(c.iso3);
        const isHL    = c.iso3 === highlightIso3;

        // Opacity logic: highlighted + pilots prominent, rest at 0.1
        let opacity: number;
        if (highlightIso3) {
          opacity = isHL ? 1 : isPilot ? 0.65 : 0.1;
        } else {
          opacity = isPilot ? 0.65 : 0.1;
        }

        const showLabels = opacity >= 0.15;
        const y1 = yPos(c.pre);
        const y2 = yPos(c.post);
        const isDecel  = c.post < c.pre;
        const lineColor = isHL ? c.color : isDecel ? '#10B981' : '#EF4444';
        const sw  = isHL ? 3.5 : 2;
        const fs  = isHL ? 13 : 11;
        const fw  = isHL ? '700' : '500';
        const r   = isHL ? 7 : 5;
        const midX = (LEFT_X + RIGHT_X) / 2;
        const midY = (y1 + y2) / 2;
        const acc  = c.post - c.pre;
        const accText = (acc >= 0 ? '+' : '') + acc.toFixed(2) + 'pp';

        return (
          <g key={c.iso3} opacity={opacity}>
            <line x1={LEFT_X} y1={y1} x2={RIGHT_X} y2={y2}
              stroke={lineColor} strokeWidth={sw} />

            {/* Left dot */}
            <circle cx={LEFT_X} cy={y1} r={r} fill={lineColor} stroke="#FFFFFF" strokeWidth={2} />
            {showLabels && (
              <text x={LEFT_X - 14} y={y1 + 4} textAnchor="end" fontSize={fs}
                fontWeight={fw} fill={lineColor} fontFamily="Inter, system-ui, sans-serif">
                {c.name} {c.pre >= 0 ? '+' : ''}{c.pre.toFixed(2)}%
              </text>
            )}

            {/* Right dot */}
            <circle cx={RIGHT_X} cy={y2} r={r} fill={lineColor} stroke="#FFFFFF" strokeWidth={2} />
            {showLabels && (
              <text x={RIGHT_X + 14} y={y2 + 4} fontSize={fs}
                fontWeight={fw} fill={lineColor} fontFamily="Inter, system-ui, sans-serif">
                {c.post >= 0 ? '+' : ''}{c.post.toFixed(2)}%  {c.iso3}
              </text>
            )}

            {/* Acceleration badge — highlight only */}
            {isHL && (
              <g>
                <rect x={midX - 44} y={midY - 13} width={88} height={26} rx={13}
                  fill={isDecel ? '#ECFDF5' : '#FEF2F2'}
                  stroke={isDecel ? '#A7F3D0' : '#FECACA'} strokeWidth={1} />
                <text x={midX} y={midY + 4} textAnchor="middle" fontSize={12} fontWeight="700"
                  fontFamily="monospace" fill={isDecel ? '#059669' : '#DC2626'}>
                  {accText}
                </text>
              </g>
            )}
          </g>
        );
      })}

      {/* Legend */}
      <g transform={`translate(${W / 2 - 210}, ${H - 36})`}>
        <line x1={0} x2={22} y1={0} y2={0} stroke="#10B981" strokeWidth={2.5} />
        <text x={30} y={4} fontSize={12} fill="#4A4A6A" fontFamily="Inter, system-ui, sans-serif">
          Deceleration (post &lt; pre)
        </text>
        <line x1={250} x2={272} y1={0} y2={0} stroke="#EF4444" strokeWidth={2.5} />
        <text x={280} y={4} fontSize={12} fill="#4A4A6A" fontFamily="Inter, system-ui, sans-serif">
          Acceleration (post &gt; pre)
        </text>
        <text x={420} y={4} fontSize={11} fill="#94A3B8" fontFamily="Inter, system-ui, sans-serif">
          Faded = non-pilot
        </text>
      </g>

      {/* Watermark */}
      <text x={W - 20} y={H - 16} textAnchor="end" fontSize={12}
        fontFamily="Inter, system-ui, sans-serif" fill="#C8C8D0">visualclimate.org</text>
    </svg>
  );
}
