'use client';

export interface ClimateSpiralProps {
  country: string;
  iso3: string;
  data: { year: number; value: number }[];
  className?: string;
}

export function ClimateSpiral({ country, iso3, data, className = '' }: ClimateSpiralProps) {
  const CX = 300;
  const CY = 300;
  const MIN_R = 70;
  const MAX_R = 215;
  const YEARS_PER_REV = 12; // 2 full revolutions for 24 years (2000-2023)

  const sorted = [...data].sort((a, b) => a.year - b.year);
  if (sorted.length === 0) return null;

  const vals = sorted.map(d => d.value);
  const minV = Math.min(...vals);
  const maxV = Math.max(...vals);
  const range = Math.max(maxV - minV, 0.01);

  /** Map (year index, co2 value) → SVG coordinate */
  function toXY(i: number, v: number): { x: number; y: number; r: number } {
    const angle = (i / YEARS_PER_REV) * Math.PI * 2;
    const r = MIN_R + ((v - minV) / range) * (MAX_R - MIN_R);
    return {
      x: CX + r * Math.sin(angle),
      y: CY - r * Math.cos(angle),
      r,
    };
  }

  /** Interpolate: #3B82F6 (blue) → #EF4444 (red) */
  function yearColor(t: number): string {
    const r = Math.round(59  + t * (239 - 59));
    const g = Math.round(130 + t * (68  - 130));
    const b = Math.round(246 + t * (68  - 246));
    return `rgb(${r},${g},${b})`;
  }

  const pts = sorted.map((d, i) => ({
    ...toXY(i, d.value),
    year: d.year,
    value: d.value,
    color: yearColor(i / Math.max(sorted.length - 1, 1)),
  }));

  const parisIdx = sorted.findIndex(d => d.year === 2015);
  const paris    = parisIdx >= 0 ? pts[parisIdx] : null;
  const first    = pts[0];
  const last     = pts[pts.length - 1];

  const gradId = `spLg-${iso3}`;

  return (
    <div className={`relative ${className}`}>
      <svg
        viewBox="0 0 600 600"
        preserveAspectRatio="xMidYMid meet"
        style={{ display: 'block', width: '100%', height: 'auto' }}
        role="img"
        aria-label={`${country} CO2 per capita spiral 2000-2023`}
      >
        {/* Background */}
        <rect width={600} height={600} fill="#FAFAF9" />

        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%"   stopColor="#3B82F6" />
            <stop offset="100%" stopColor="#EF4444" />
          </linearGradient>
        </defs>

        {/* Title */}
        <text x={300} y={28} textAnchor="middle" fontSize={18} fontWeight="700"
          fontFamily="Inter, system-ui, sans-serif" fill="#1A1A2E">
          {country} CO&#x2082; Spiral 2000&#x2013;2023
        </text>
        <text x={300} y={46} textAnchor="middle" fontSize={12}
          fontFamily="Inter, system-ui, sans-serif" fill="#94A3B8">
          CO&#x2082; per capita (t) &#xB7; radius &#x221D; value
        </text>

        {/* Reference circles */}
        <circle cx={CX} cy={CY} r={MIN_R}                fill="none" stroke="#E8E8ED" strokeWidth={0.75} />
        <circle cx={CX} cy={CY} r={(MIN_R + MAX_R) / 2}  fill="none" stroke="#E8E8ED" strokeWidth={0.75} />
        <circle cx={CX} cy={CY} r={MAX_R}                fill="none" stroke="#E8E8ED" strokeWidth={0.75} strokeDasharray="4,3" />

        {/* Year tick marks (every 5 years) */}
        {[2000, 2005, 2010, 2015, 2020].map(yr => {
          const idx = yr - 2000;
          const ang = (idx / YEARS_PER_REV) * Math.PI * 2;
          const sin = Math.sin(ang);
          const cos = Math.cos(ang);
          const r1 = MAX_R + 6;
          const r2 = MAX_R + 14;
          const rl = MAX_R + 28;
          return (
            <g key={yr}>
              <line
                x1={CX + r1 * sin} y1={CY - r1 * cos}
                x2={CX + r2 * sin} y2={CY - r2 * cos}
                stroke="#C8C8D0" strokeWidth={1}
              />
              <text
                x={CX + rl * sin} y={CY - rl * cos + 4}
                textAnchor="middle" fontSize={10} fontFamily="monospace" fill="#94A3B8"
              >{yr}</text>
            </g>
          );
        })}

        {/* Spiral path — colored line segments */}
        {pts.slice(0, -1).map((p, i) => {
          const q = pts[i + 1];
          return (
            <line key={i}
              x1={p.x} y1={p.y} x2={q.x} y2={q.y}
              stroke={p.color} strokeWidth={2.8} strokeLinecap="round"
            />
          );
        })}

        {/* Year dots every 5 years */}
        {pts.filter((_, i) => i % 5 === 0).map(p => (
          <circle key={p.year} cx={p.x} cy={p.y} r={3.5}
            fill={p.color} stroke="#FAFAF9" strokeWidth={1.5} />
        ))}

        {/* Paris 2015 marker */}
        {paris && (
          <g>
            <circle cx={paris.x} cy={paris.y} r={9} fill="none"
              stroke="#F59E0B" strokeWidth={2} strokeDasharray="3,2" />
            <circle cx={paris.x} cy={paris.y} r={4.5} fill="#F59E0B" />
            <text x={paris.x + 14} y={paris.y - 5} fontSize={11} fontWeight="600"
              fontFamily="Inter, system-ui, sans-serif" fill="#F59E0B">2015</text>
            <text x={paris.x + 14} y={paris.y + 8} fontSize={10}
              fontFamily="Inter, system-ui, sans-serif" fill="#D97706">Paris Agreement</text>
          </g>
        )}

        {/* Start (2000) and end (2023) labels */}
        {first && (
          <>
            <circle cx={first.x} cy={first.y} r={5.5} fill={first.color} stroke="#FAFAF9" strokeWidth={2} />
            <text x={first.x} y={first.y - 12} textAnchor="middle" fontSize={11} fontWeight="700"
              fontFamily="Inter, system-ui, sans-serif" fill={first.color}>2000</text>
          </>
        )}
        {last && (
          <>
            <circle cx={last.x} cy={last.y} r={5.5} fill={last.color} stroke="#FAFAF9" strokeWidth={2} />
            <text x={last.x} y={last.y - 12} textAnchor="middle" fontSize={11} fontWeight="700"
              fontFamily="Inter, system-ui, sans-serif" fill={last.color}>2023</text>
          </>
        )}

        {/* Min / max value annotations */}
        <text x={CX} y={CY - MIN_R + 14} textAnchor="middle" fontSize={10}
          fontFamily="monospace" fill="#C8C8D0">{minV.toFixed(1)} t</text>
        <text x={CX} y={CY - MAX_R + 14} textAnchor="middle" fontSize={10}
          fontFamily="monospace" fill="#C8C8D0">{maxV.toFixed(1)} t</text>

        {/* Legend bar */}
        <rect x={220} y={558} width={160} height={7} rx={3.5} fill={`url(#${gradId})`} />
        <text x={220} y={577} fontSize={10} fontFamily="monospace" fill="#94A3B8">Early</text>
        <text x={380} y={577} textAnchor="end" fontSize={10} fontFamily="monospace" fill="#94A3B8">Recent</text>

        {/* Footer */}
        <text x={300} y={594} textAnchor="middle" fontSize={11}
          fontFamily="Inter, system-ui, sans-serif" fill="#C8C8D0">
          Source: World Bank WDI | visualclimate.org
        </text>
      </svg>
    </div>
  );
}
