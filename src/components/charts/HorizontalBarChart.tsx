'use client';

import React, { useState } from 'react';

// ── Props ─────────────────────────────────────────────────────────────────────
export interface HorizontalBarChartProps {
  bars: { label: string; value: number; color: string; pct: number }[];
}

// ── Chart: Horizontal Bar (CTRACE sectors) ────────────────────────────────────
export function HorizontalBarChart({ bars }: HorizontalBarChartProps) {
  const [hover, setHover] = useState<{ idx: number; label: string; value: number; pct: number; color: string; bx: number; by: number } | null>(null);

  if (bars.length === 0) return null;
  const maxVal = bars[0].value;
  const ROW = 32, PAD = 12, LBL = 140, VW = 620, BMAX = VW - LBL - PAD - 90;
  const VH = bars.length * ROW + PAD * 2;
  const TW = 140, TH = 52;

  return (
    <svg viewBox={`0 0 ${VW} ${VH}`} className="w-full" role="img" aria-label="Emissions by sector"
      onMouseLeave={() => setHover(null)} style={{ cursor: 'default' }}>
      <defs>
        {bars.map((b, i) => (
          <linearGradient key={`bar-grad-${i}`} id={`bar-grad-${i}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={b.color} stopOpacity="0.9" />
            <stop offset="100%" stopColor={b.color} stopOpacity="0.7" />
          </linearGradient>
        ))}
      </defs>
      {bars.map((b, i) => {
        const y = PAD + i * ROW;
        const bw = maxVal > 0 ? (b.value / maxVal) * BMAX : 0;
        const isHovered = hover?.idx === i;
        return (
          <g key={b.label}
            onMouseEnter={() => setHover({ idx: i, label: b.label, value: b.value, pct: b.pct, color: b.color, bx: LBL + bw, by: y + ROW / 2 })}
            onMouseLeave={() => setHover(null)}
            style={{ cursor: 'pointer' }}
          >
            <rect x={LBL - 8} y={y} width={VW - LBL + 8} height={ROW} fill="transparent" />
            <text x={LBL - 8} y={y + ROW / 2} textAnchor="end" dominantBaseline="middle" fontSize={12} fill={isHovered ? '#1A1A2E' : '#4A4A6A'} fontWeight={isHovered ? '600' : '400'}>{b.label}</text>
            <rect x={LBL} y={y + 7} width={BMAX} height={ROW - 14} rx={8} fill="#F1F5F9" />
            <rect x={LBL} y={y + 7} width={bw} height={ROW - 14} rx={8} fill={`url(#bar-grad-${i})`}
              style={{ filter: `drop-shadow(0 2px 4px ${b.color}${isHovered ? '60' : '30'})`, transition: 'filter 0.15s ease' }}
              opacity={isHovered ? 1 : 0.85} />
            <text x={LBL + bw + 6} y={y + ROW / 2} dominantBaseline="middle" fontSize={11} fill={b.color} fontWeight="600">
              {b.value >= 1 ? b.value.toFixed(1) : b.value.toFixed(3)} Mt · {b.pct.toFixed(1)}%
            </text>
          </g>
        );
      })}
      {hover && (() => {
        const tx = hover.bx + 8 + TW < VW ? hover.bx + 8 : hover.bx - TW - 8;
        const ty = hover.by - TH / 2;
        const tyClamp = Math.max(2, Math.min(VH - TH - 2, ty));
        return (
          <g style={{ pointerEvents: 'none' }}>
            <line x1={LBL} y1={hover.by} x2={hover.bx} y2={hover.by} stroke={hover.color} strokeWidth={1.5} strokeOpacity={0.3} strokeDasharray="4,3" />
            <rect x={tx} y={tyClamp} width={TW} height={TH} rx={6} fill="rgba(255,255,255,0.97)" stroke="#E2E8F0" strokeWidth={1} style={{ filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.08))' }} />
            <text x={tx + 10} y={tyClamp + 16} fontSize={11} fontWeight="700" fill="#1A1A2E">{hover.label}</text>
            <text x={tx + 10} y={tyClamp + 32} fontSize={10} fill={hover.color} fontFamily="monospace">{hover.value.toFixed(2)} Mt CO₂e</text>
            <text x={tx + 10} y={tyClamp + 46} fontSize={10} fill="#4A4A6A" fontFamily="monospace">{hover.pct.toFixed(1)}% of total</text>
          </g>
        );
      })()}
    </svg>
  );
}
