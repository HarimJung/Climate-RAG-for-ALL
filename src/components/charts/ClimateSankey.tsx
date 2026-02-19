'use client';

import { useState } from 'react';

export interface ClimateSankeyProps {
  country: string;
  fossil: number;
  renewable: number;
  nuclear: number;
  className?: string;
}

const C = {
  fossil: '#78716C',
  renewable: '#10B981',
  nuclear: '#8B5CF6',
  electricity: '#3B82F6',
  co2: '#EF4444',
  clean: '#06B6D4',
};

/** Cubic-bezier filled band: (x1, y1top..y1bot) to (x2, y2top..y2bot) */
function band(x1: number, y1t: number, y1b: number, x2: number, y2t: number, y2b: number): string {
  const cx = (x1 + x2) / 2;
  return `M${x1},${y1t} C${cx},${y1t} ${cx},${y2t} ${x2},${y2t} L${x2},${y2b} C${cx},${y2b} ${cx},${y1b} ${x1},${y1b} Z`;
}

export function ClimateSankey({ country, fossil, renewable, nuclear, className = '' }: ClimateSankeyProps) {
  const [hovered, setHovered] = useState<string | null>(null);

  // Layout constants
  const S   = 3.2; // scale: px per %
  const GAP = 16;  // gap between nodes in left/right columns
  const NW  = 30;  // node width
  const LX  = 160; // left node x
  const MX  = 420; // middle (electricity) node x
  const RX  = 680; // right node x
  const TOP = 78;  // y where nodes start (leaves room for title + column headers)

  // Unique gradient ID prefix per country — prevents DOM ID conflicts on multi-instance pages
  const gid = `sk-${country.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;

  // Left column geometry
  const fossilH    = Math.max(fossil * S, 4);
  const renewableH = Math.max(renewable * S, 4);
  const nuclearH   = Math.max(nuclear * S, 4);
  const fossilY    = TOP;
  const renewableY = fossilY + fossilH + GAP;
  const nuclearY   = renewableY + renewableH + GAP;

  // Middle node — compact, no gaps — spans full height of all inputs
  const elecY = TOP;
  const elecH = (fossil + renewable + nuclear) * S;

  // Electricity slot boundaries for band alignment
  const eFT = elecY;
  const eFB = elecY + fossil * S;
  const eRT = eFB;
  const eRB = eFB + renewable * S;
  const eNT = eRB;
  const eNB = eNT + nuclear * S;

  // Right column geometry (gap mirrors left)
  const co2H   = Math.max(fossil * S, 4);
  const co2Y   = TOP;
  const cleanH = Math.max((renewable + nuclear) * S, 4);
  const cleanY = co2Y + co2H + GAP;

  // Opacity: default 0.35; on hover → hovered=0.72, others=0.08
  const lo = (id: string) => hovered === null ? 0.35 : hovered === id ? 0.72 : 0.08;
  const no = (id: string) => hovered === null ? 1    : hovered === id ? 1    : 0.25;
  const bind = (id: string) => ({
    onMouseEnter: () => setHovered(id),
    onMouseLeave: () => setHovered(null),
    style: { cursor: 'pointer' } as React.CSSProperties,
  });

  // Y center of a node for label placement
  function cy(nodeY: number, nodeH: number): number {
    return nodeY + Math.max(nodeH / 2, 8);
  }

  return (
    <div className={`relative ${className}`}>
      <svg
        viewBox="0 0 900 500"
        preserveAspectRatio="xMidYMid meet"
        style={{ display: 'block', width: '100%', height: 'auto' }}
        role="img"
        aria-label={`${country} energy flow Sankey diagram`}
      >
        {/* White background */}
        <rect width={900} height={500} fill="#FAFAF9" />

        <defs>
          <linearGradient id={`${gid}-fossil`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%"   stopColor={C.fossil}      stopOpacity="0.9" />
            <stop offset="100%" stopColor={C.electricity}  stopOpacity="0.6" />
          </linearGradient>
          <linearGradient id={`${gid}-renewable`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%"   stopColor={C.renewable}   stopOpacity="0.9" />
            <stop offset="100%" stopColor={C.electricity}  stopOpacity="0.6" />
          </linearGradient>
          <linearGradient id={`${gid}-nuclear`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%"   stopColor={C.nuclear}     stopOpacity="0.9" />
            <stop offset="100%" stopColor={C.electricity}  stopOpacity="0.6" />
          </linearGradient>
          <linearGradient id={`${gid}-co2`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%"   stopColor={C.electricity}  stopOpacity="0.6" />
            <stop offset="100%" stopColor={C.co2}          stopOpacity="0.9" />
          </linearGradient>
          <linearGradient id={`${gid}-clean`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%"   stopColor={C.electricity}  stopOpacity="0.6" />
            <stop offset="100%" stopColor={C.clean}        stopOpacity="0.9" />
          </linearGradient>
        </defs>

        {/* Title */}
        <text x={450} y={28} textAnchor="middle" fontSize={20} fontWeight="700"
          fontFamily="Inter, system-ui, sans-serif" fill="#1A1A2E">
          {country} &#8212; Energy Flow 2023
        </text>
        <text x={450} y={47} textAnchor="middle" fontSize={12}
          fontFamily="Inter, system-ui, sans-serif" fill="#94A3B8">
          Electricity generation mix &#xB7; carbon output
        </text>

        {/* Column headers */}
        <text x={LX + NW / 2} y={64} textAnchor="middle" fontSize={10} fontWeight="600"
          fontFamily="Inter, system-ui, sans-serif" fill="#CBD5E1">INPUT</text>
        <text x={MX + NW / 2} y={64} textAnchor="middle" fontSize={10} fontWeight="600"
          fontFamily="Inter, system-ui, sans-serif" fill="#CBD5E1">GRID</text>
        <text x={RX + NW / 2} y={64} textAnchor="middle" fontSize={10} fontWeight="600"
          fontFamily="Inter, system-ui, sans-serif" fill="#CBD5E1">OUTPUT</text>

        {/* ── LINKS ── */}

        {/* Fossil → Electricity */}
        <path d={band(LX + NW, fossilY, fossilY + fossilH, MX, eFT, eFB)}
          fill={`url(#${gid}-fossil)`} opacity={lo('lk-fossil')} {...bind('lk-fossil')} />

        {/* Renewable → Electricity */}
        {renewable > 0 && (
          <path d={band(LX + NW, renewableY, renewableY + renewableH, MX, eRT, eRB)}
            fill={`url(#${gid}-renewable)`} opacity={lo('lk-renewable')} {...bind('lk-renewable')} />
        )}

        {/* Nuclear → Electricity */}
        {nuclear > 0 && (
          <path d={band(LX + NW, nuclearY, nuclearY + nuclearH, MX, eNT, eNB)}
            fill={`url(#${gid}-nuclear)`} opacity={lo('lk-nuclear')} {...bind('lk-nuclear')} />
        )}

        {/* Electricity → CO2 Output */}
        <path d={band(MX + NW, eFT, eFB, RX, co2Y, co2Y + co2H)}
          fill={`url(#${gid}-co2)`} opacity={lo('lk-co2')} {...bind('lk-co2')} />

        {/* Electricity → Clean Output */}
        {(renewable + nuclear) > 0 && (
          <path d={band(MX + NW, eRT, eNB, RX, cleanY, cleanY + cleanH)}
            fill={`url(#${gid}-clean)`} opacity={lo('lk-clean')} {...bind('lk-clean')} />
        )}

        {/* ── LEFT NODES ── */}

        {/* Fossil */}
        <rect x={LX} y={fossilY} width={NW} height={fossilH} rx={4} fill={C.fossil}
          opacity={no('nd-fossil')} {...bind('nd-fossil')} />
        <text x={LX - 12} y={cy(fossilY, fossilH) - 7} textAnchor="end" fontSize={13}
          fontFamily="Inter, system-ui, sans-serif" fill="#1A1A2E" fontWeight="500">Fossil</text>
        <text x={LX - 12} y={cy(fossilY, fossilH) + 9} textAnchor="end" fontSize={12}
          fontFamily="monospace" fontWeight="700" fill={C.fossil}>{fossil.toFixed(1)}%</text>

        {/* Renewable */}
        <rect x={LX} y={renewableY} width={NW} height={renewableH} rx={4} fill={C.renewable}
          opacity={no('nd-renewable')} {...bind('nd-renewable')} />
        <text x={LX - 12} y={cy(renewableY, renewableH) - 7} textAnchor="end" fontSize={13}
          fontFamily="Inter, system-ui, sans-serif" fill="#1A1A2E" fontWeight="500">Renewable</text>
        <text x={LX - 12} y={cy(renewableY, renewableH) + 9} textAnchor="end" fontSize={12}
          fontFamily="monospace" fontWeight="700" fill={C.renewable}>{renewable.toFixed(1)}%</text>

        {/* Nuclear (only when > 0) */}
        {nuclear > 0 && (
          <>
            <rect x={LX} y={nuclearY} width={NW} height={nuclearH} rx={4} fill={C.nuclear}
              opacity={no('nd-nuclear')} {...bind('nd-nuclear')} />
            <text x={LX - 12} y={cy(nuclearY, nuclearH) - 7} textAnchor="end" fontSize={13}
              fontFamily="Inter, system-ui, sans-serif" fill="#1A1A2E" fontWeight="500">Nuclear</text>
            <text x={LX - 12} y={cy(nuclearY, nuclearH) + 9} textAnchor="end" fontSize={12}
              fontFamily="monospace" fontWeight="700" fill={C.nuclear}>{nuclear.toFixed(1)}%</text>
          </>
        )}

        {/* ── MIDDLE NODE ── */}
        <rect x={MX} y={elecY} width={NW} height={elecH} rx={4} fill={C.electricity} />
        <text x={MX + NW / 2} y={elecY - 10} textAnchor="middle" fontSize={12}
          fontFamily="Inter, system-ui, sans-serif" fill="#1A1A2E">Electricity</text>

        {/* ── RIGHT NODES ── */}

        {/* CO2 Output */}
        <rect x={RX} y={co2Y} width={NW} height={co2H} rx={4} fill={C.co2}
          opacity={no('nd-co2')} {...bind('nd-co2')} />
        <text x={RX + NW + 12} y={cy(co2Y, co2H) - 7} fontSize={13}
          fontFamily="Inter, system-ui, sans-serif" fill="#1A1A2E" fontWeight="500">CO2 Output</text>
        <text x={RX + NW + 12} y={cy(co2Y, co2H) + 9} fontSize={12}
          fontFamily="monospace" fontWeight="700" fill={C.co2}>{fossil.toFixed(1)}%</text>

        {/* Clean Output */}
        {(renewable + nuclear) > 0 && (
          <>
            <rect x={RX} y={cleanY} width={NW} height={cleanH} rx={4} fill={C.clean}
              opacity={no('nd-clean')} {...bind('nd-clean')} />
            <text x={RX + NW + 12} y={cy(cleanY, cleanH) - 7} fontSize={13}
              fontFamily="Inter, system-ui, sans-serif" fill="#1A1A2E" fontWeight="500">Clean Output</text>
            <text x={RX + NW + 12} y={cy(cleanY, cleanH) + 9} fontSize={12}
              fontFamily="monospace" fontWeight="700" fill={C.clean}>{(renewable + nuclear).toFixed(1)}%</text>
          </>
        )}

        {/* Footer */}
        <text x={450} y={490} textAnchor="middle" fontSize={11}
          fontFamily="Inter, system-ui, sans-serif" fill="#C8C8D0">
          Source: Ember Global Electricity Review 2023 | visualclimate.org
        </text>
      </svg>
    </div>
  );
}
