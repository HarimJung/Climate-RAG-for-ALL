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

/** Cubic-bezier filled band from (x1, y1top..y1bot) → (x2, y2top..y2bot) */
function band(x1: number, y1t: number, y1b: number, x2: number, y2t: number, y2b: number) {
  const cx = (x1 + x2) / 2;
  return `M${x1},${y1t} C${cx},${y1t} ${cx},${y2t} ${x2},${y2t} L${x2},${y2b} C${cx},${y2b} ${cx},${y1b} ${x1},${y1b} Z`;
}

export function ClimateSankey({ country, fossil, renewable, nuclear, className = '' }: ClimateSankeyProps) {
  const [hovered, setHovered] = useState<string | null>(null);

  // Layout
  const LX = 200; // left column node x
  const MX = 490; // electricity node x
  const RX = 790; // right column node x
  const NW = 24;  // node width
  const S = 3;    // scale: px per %

  // Left column — heights and y positions follow user formula
  const fossilH = Math.max(fossil * S, 3);
  const renewableH = Math.max(renewable * S, 3);
  const nuclearH = Math.max(nuclear * S, 3);
  const fossilY = 50;
  const renewableY = fossil * S + 70;             // fossilY + fossilH + 20 gap
  const nuclearY = fossil * S + renewable * S + 90; // renewableY + renewableH + 20 gap

  // Electricity (middle) — compact, no internal gaps
  const elecY = 50;
  const elecH = (fossil + renewable + nuclear) * S;

  // Right column
  const co2H = fossil * S;
  const cleanY = fossil * S + 70;
  const cleanH = (renewable + nuclear) * S;

  // Slot boundaries in the electricity node for link alignment
  const eFT = elecY;
  const eFB = elecY + fossil * S;
  const eRT = eFB;
  const eRB = eFB + renewable * S;
  const eNT = eRB;
  const eNB = eNT + nuclear * S;

  const lo = (id: string) => (!hovered || hovered === id) ? 0.68 : 0.18;
  const no = (id: string) => (!hovered || hovered === id) ? 1 : 0.3;
  const bind = (id: string) => ({
    onMouseEnter: () => setHovered(id),
    onMouseLeave: () => setHovered(null),
    style: { cursor: 'pointer' } as React.CSSProperties,
  });

  return (
    <div className={`relative ${className}`}>
      <svg
        viewBox="0 0 1030 500"
        preserveAspectRatio="xMidYMid meet"
        style={{ display: 'block', width: '100%', height: 'auto' }}
        role="img"
        aria-label={`${country} energy flow Sankey diagram`}
      >
        <defs>
          <linearGradient id="sg-fossil" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={C.fossil} stopOpacity="0.6" />
            <stop offset="100%" stopColor={C.electricity} stopOpacity="0.4" />
          </linearGradient>
          <linearGradient id="sg-renewable" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={C.renewable} stopOpacity="0.6" />
            <stop offset="100%" stopColor={C.electricity} stopOpacity="0.4" />
          </linearGradient>
          <linearGradient id="sg-nuclear" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={C.nuclear} stopOpacity="0.6" />
            <stop offset="100%" stopColor={C.electricity} stopOpacity="0.4" />
          </linearGradient>
          <linearGradient id="sg-co2" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={C.electricity} stopOpacity="0.4" />
            <stop offset="100%" stopColor={C.co2} stopOpacity="0.6" />
          </linearGradient>
          <linearGradient id="sg-clean" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={C.electricity} stopOpacity="0.4" />
            <stop offset="100%" stopColor={C.clean} stopOpacity="0.6" />
          </linearGradient>
        </defs>

        {/* Titles */}
        <text x={515} y={27} textAnchor="middle" fontSize={17} fontWeight="700"
          fontFamily="Inter, system-ui, sans-serif" fill="#1A1A2E">{country} — Energy Flow</text>
        <text x={515} y={43} textAnchor="middle" fontSize={11}
          fontFamily="Inter, system-ui, sans-serif" fill="#94A3B8">Electricity generation mix · carbon output</text>

        {/* Links */}
        <path d={band(LX + NW, fossilY, fossilY + fossilH, MX, eFT, eFB)}
          fill="url(#sg-fossil)" opacity={lo('lk-fossil')} {...bind('lk-fossil')} />

        {renewable > 0 && (
          <path d={band(LX + NW, renewableY, renewableY + renewableH, MX, eRT, eRB)}
            fill="url(#sg-renewable)" opacity={lo('lk-renewable')} {...bind('lk-renewable')} />
        )}

        {nuclear > 0 && (
          <path d={band(LX + NW, nuclearY, nuclearY + nuclearH, MX, eNT, eNB)}
            fill="url(#sg-nuclear)" opacity={lo('lk-nuclear')} {...bind('lk-nuclear')} />
        )}

        <path d={band(MX + NW, eFT, eFB, RX, elecY, elecY + co2H)}
          fill="url(#sg-co2)" opacity={lo('lk-co2')} {...bind('lk-co2')} />

        {(renewable + nuclear) > 0 && (
          <path d={band(MX + NW, eRT, eNB, RX, cleanY, cleanY + cleanH)}
            fill="url(#sg-clean)" opacity={lo('lk-clean')} {...bind('lk-clean')} />
        )}

        {/* Left nodes */}
        <rect x={LX} y={fossilY} width={NW} height={fossilH} rx={4} fill={C.fossil}
          opacity={no('nd-fossil')} {...bind('nd-fossil')} />
        <text x={LX - 10} y={fossilY + fossilH / 2 - 6} textAnchor="end" fontSize={13}
          fontFamily="Inter, system-ui, sans-serif" fill="#1A1A2E">Fossil</text>
        <text x={LX - 10} y={fossilY + fossilH / 2 + 10} textAnchor="end" fontSize={12}
          fontFamily="monospace" fontWeight="700" fill={C.fossil}>{fossil.toFixed(1)}%</text>

        <rect x={LX} y={renewableY} width={NW} height={renewableH} rx={4} fill={C.renewable}
          opacity={no('nd-renewable')} {...bind('nd-renewable')} />
        <text x={LX - 10} y={renewableY + renewableH / 2 - 6} textAnchor="end" fontSize={13}
          fontFamily="Inter, system-ui, sans-serif" fill="#1A1A2E">Renewable</text>
        <text x={LX - 10} y={renewableY + renewableH / 2 + 10} textAnchor="end" fontSize={12}
          fontFamily="monospace" fontWeight="700" fill={C.renewable}>{renewable.toFixed(1)}%</text>

        <rect x={LX} y={nuclearY} width={NW} height={nuclearH} rx={4} fill={C.nuclear}
          opacity={no('nd-nuclear')} {...bind('nd-nuclear')} />
        <text x={LX - 10} y={nuclearY + nuclearH / 2 - 6} textAnchor="end" fontSize={13}
          fontFamily="Inter, system-ui, sans-serif" fill="#1A1A2E">Nuclear &amp; Other</text>
        <text x={LX - 10} y={nuclearY + nuclearH / 2 + 10} textAnchor="end" fontSize={12}
          fontFamily="monospace" fontWeight="700" fill={C.nuclear}>{nuclear.toFixed(1)}%</text>

        {/* Middle node */}
        <rect x={MX} y={elecY} width={NW} height={elecH} rx={4} fill={C.electricity} />
        <text x={MX + NW / 2} y={elecY - 8} textAnchor="middle" fontSize={12}
          fontFamily="Inter, system-ui, sans-serif" fill="#1A1A2E">Electricity</text>

        {/* Right nodes */}
        <rect x={RX} y={elecY} width={NW} height={co2H} rx={4} fill={C.co2}
          opacity={no('nd-co2')} {...bind('nd-co2')} />
        <text x={RX + NW + 10} y={elecY + co2H / 2 - 6} fontSize={13}
          fontFamily="Inter, system-ui, sans-serif" fill="#1A1A2E">CO&#x2082; Output</text>
        <text x={RX + NW + 10} y={elecY + co2H / 2 + 10} fontSize={12}
          fontFamily="monospace" fontWeight="700" fill={C.co2}>{fossil.toFixed(1)}%</text>

        {(renewable + nuclear) > 0 && (
          <>
            <rect x={RX} y={cleanY} width={NW} height={cleanH} rx={4} fill={C.clean}
              opacity={no('nd-clean')} {...bind('nd-clean')} />
            <text x={RX + NW + 10} y={cleanY + cleanH / 2 - 6} fontSize={13}
              fontFamily="Inter, system-ui, sans-serif" fill="#1A1A2E">Clean Output</text>
            <text x={RX + NW + 10} y={cleanY + cleanH / 2 + 10} fontSize={12}
              fontFamily="monospace" fontWeight="700" fill={C.clean}>{(renewable + nuclear).toFixed(1)}%</text>
          </>
        )}

        {/* Watermark */}
        <text x={1010} y={490} textAnchor="end" fontSize={10}
          fontFamily="Inter, system-ui, sans-serif" fill="#C8C8D0">visualclimate.org</text>
      </svg>
    </div>
  );
}
