'use client';

import { useState, useEffect } from 'react';

interface WaterfallItem {
  label: string;
  value: number;
  type: 'start' | 'increase' | 'decrease' | 'end';
}

interface KayaData {
  iso3: string;
  country_name: string;
  period: { start: number; end: number };
  co2_start: number;
  co2_end: number;
  co2_change: number;
  factors: {
    population: { contribution: number; pct: number };
    gdp_per_capita: { contribution: number; pct: number };
    energy_intensity: { contribution: number; pct: number };
    carbon_intensity: { contribution: number; pct: number };
  };
  biggest_driver: string;
  biggest_driver_label: string;
  residual: number;
  residual_pct: number;
  confidence: 'HIGH' | 'LOW';
  waterfall: WaterfallItem[];
}

const BAR_COLORS: Record<string, string> = {
  start: '#3B82F6',
  end: '#3B82F6',
  increase: '#EF4444',
  decrease: '#10B981',
};

export function KayaWaterfall({ iso3, onLoad }: { iso3: string; onLoad?: (hasData: boolean) => void }) {
  const [data, setData] = useState<KayaData | null>(null);
  const [loading, setLoading] = useState(true);
  const [hover, setHover] = useState<number | null>(null);

  useEffect(() => {
    fetch(`/data/kaya/${iso3}.json`)
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        setData(d);
        setLoading(false);
        onLoad?.(d != null && d.waterfall?.length > 0);
      })
      .catch(() => { setLoading(false); onLoad?.(false); });
  }, [iso3]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) return <div className="flex h-64 items-center justify-center"><div className="h-6 w-6 animate-spin rounded-full border-2 border-[#3B82F6] border-t-transparent" /></div>;
  if (!data || !data.waterfall || data.waterfall.length === 0) return null;

  const items = data.waterfall;
  const VW = 760, VH = 320, ML = 60, MR = 20, MT = 24, MB = 64;
  const W = VW - ML - MR, H = VH - MT - MB;
  const barCount = items.length;
  const barGap = 12;
  const barWidth = Math.min(80, (W - barGap * (barCount - 1)) / barCount);
  const totalBarWidth = barWidth * barCount + barGap * (barCount - 1);
  const offsetX = ML + (W - totalBarWidth) / 2;

  // Calculate running totals for waterfall positioning
  const positions: { x: number; yTop: number; yBot: number; color: string; label: string; value: number; type: string }[] = [];
  let running = 0;

  // Find max/min values for Y scale
  let minVal = Infinity, maxVal = -Infinity;
  let tempRunning = 0;
  for (const item of items) {
    if (item.type === 'start' || item.type === 'end') {
      tempRunning = item.value;
      minVal = Math.min(minVal, 0);
      maxVal = Math.max(maxVal, item.value);
    } else {
      const prev = tempRunning;
      tempRunning += item.value;
      minVal = Math.min(minVal, Math.min(prev, tempRunning));
      maxVal = Math.max(maxVal, Math.max(prev, tempRunning));
    }
  }

  // Add padding
  const range = maxVal - minVal;
  const yMin = Math.max(0, minVal - range * 0.1);
  const yMax = maxVal + range * 0.15;
  const ys = (v: number) => MT + H - ((v - yMin) / (yMax - yMin)) * H;

  running = 0;
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const x = offsetX + i * (barWidth + barGap);

    if (item.type === 'start' || item.type === 'end') {
      positions.push({
        x,
        yTop: ys(item.value),
        yBot: ys(yMin),
        color: BAR_COLORS[item.type],
        label: item.label,
        value: item.value,
        type: item.type,
      });
      running = item.value;
    } else {
      const prevRunning = running;
      running += item.value;
      const top = Math.max(prevRunning, running);
      const bot = Math.min(prevRunning, running);
      positions.push({
        x,
        yTop: ys(top),
        yBot: ys(bot),
        color: BAR_COLORS[item.type],
        label: item.label,
        value: item.value,
        type: item.type,
      });
    }
  }

  // Y-axis ticks
  const yStep = Math.ceil((yMax - yMin) / 5 / 10) * 10 || 1;
  const yTicks: number[] = [];
  for (let v = Math.ceil(yMin / yStep) * yStep; v <= yMax; v += yStep) yTicks.push(v);

  return (
    <div>
      <svg viewBox={`0 0 ${VW} ${VH}`} className="w-full">
        <defs>
          {positions.map((p, i) => (
            <linearGradient key={`wf-g-${i}`} id={`wf-g-${i}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={p.color} stopOpacity={0.9} />
              <stop offset="100%" stopColor={p.color} stopOpacity={0.65} />
            </linearGradient>
          ))}
        </defs>

        {/* Grid lines */}
        {yTicks.map(v => (
          <line key={v} x1={ML} y1={ys(v)} x2={VW - MR} y2={ys(v)} stroke="#E8E8ED" strokeWidth={1} />
        ))}
        {yTicks.map(v => (
          <text key={v} x={ML - 6} y={ys(v)} textAnchor="end" dominantBaseline="middle" fontSize={11} fill="#64748B" fontFamily="monospace">{v}</text>
        ))}
        <text x={12} y={MT + H / 2} textAnchor="middle" fontSize={10} fill="#64748B" transform={`rotate(-90,12,${MT + H / 2})`}>Mt CO&#x2082;</text>

        {/* Connector lines between bars */}
        {positions.map((p, i) => {
          if (i === 0) return null;
          const prev = positions[i - 1];
          const prevEndY = prev.type === 'start' || prev.type === 'end' ? prev.yTop : (prev.type === 'increase' ? prev.yTop : prev.yBot);
          return (
            <line key={`conn-${i}`}
              x1={prev.x + barWidth} y1={prevEndY}
              x2={p.x} y2={prevEndY}
              stroke="#CBD5E1" strokeWidth={1} strokeDasharray="3,3" />
          );
        })}

        {/* Bars */}
        {positions.map((p, i) => (
          <g key={i} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} style={{ cursor: 'pointer' }}>
            <rect
              x={p.x} y={p.yTop}
              width={barWidth}
              height={Math.max(1, p.yBot - p.yTop)}
              rx={4}
              fill={`url(#wf-g-${i})`}
              stroke={hover === i ? '#0F172A' : 'none'}
              strokeWidth={hover === i ? 2 : 0}
              style={{ filter: `drop-shadow(0 2px 4px ${p.color}30)`, transition: 'all 0.2s' }}
            />
            {/* Value label on bar */}
            <text
              x={p.x + barWidth / 2}
              y={p.yTop - 6}
              textAnchor="middle"
              fontSize={11}
              fontWeight="700"
              fill={p.color}
              fontFamily="monospace"
            >
              {p.type === 'start' || p.type === 'end'
                ? p.value.toFixed(1)
                : `${p.value >= 0 ? '+' : ''}${p.value.toFixed(1)}`}
            </text>
            {/* X-axis label */}
            <text
              x={p.x + barWidth / 2}
              y={VH - MB + 14}
              textAnchor="middle"
              fontSize={10}
              fill="#334155"
              fontWeight={p.type === 'start' || p.type === 'end' ? '600' : '400'}
            >
              {p.label}
            </text>
          </g>
        ))}

        {/* Zero line if visible */}
        {yMin <= 0 && yMax >= 0 && (
          <line x1={ML} y1={ys(0)} x2={VW - MR} y2={ys(0)} stroke="#94A3B8" strokeWidth={1} strokeDasharray="4,4" />
        )}

        {/* Axes */}
        <line x1={ML} y1={MT} x2={ML} y2={MT + H} stroke="#CBD5E1" strokeWidth={1} />
        <line x1={ML} y1={MT + H} x2={VW - MR} y2={MT + H} stroke="#CBD5E1" strokeWidth={1} />

        {/* Hover tooltip */}
        {hover !== null && positions[hover] && (() => {
          const p = positions[hover];
          const item = items[hover];
          const tx = p.x + barWidth / 2;
          const ty = p.yTop - 24;
          return (
            <g style={{ pointerEvents: 'none' }}>
              <rect x={tx - 55} y={ty - 12} width={110} height={22} rx={6} fill="rgba(255,255,255,0.97)" stroke="#E2E8F0" strokeWidth={1} />
              <text x={tx} y={ty + 2} textAnchor="middle" fontSize={10} fill="#0F172A" fontFamily="monospace">
                {item.label}: {item.value >= 0 ? '+' : ''}{item.value.toFixed(2)} Mt
              </text>
            </g>
          );
        })()}
      </svg>

      {/* Factor badges */}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="text-xs text-[#64748B]">Biggest driver:</span>
        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-[#3B82F6] border border-blue-100">
          {data.biggest_driver_label}
        </span>
        <span className="rounded-full px-2 py-0.5 text-xs font-medium" style={{
          backgroundColor: data.confidence === 'HIGH' ? '#F0FDF4' : '#FFF7ED',
          color: data.confidence === 'HIGH' ? '#10B981' : '#F59E0B',
          border: `1px solid ${data.confidence === 'HIGH' ? '#BBF7D0' : '#FED7AA'}`,
        }}>
          {data.confidence} confidence
        </span>
        <span className="text-xs text-[#64748B]">
          CO&#x2082; change: <span className="font-mono font-medium" style={{ color: data.co2_change >= 0 ? '#EF4444' : '#10B981' }}>{data.co2_change >= 0 ? '+' : ''}{data.co2_change.toFixed(1)} Mt</span>
        </span>
      </div>
    </div>
  );
}
