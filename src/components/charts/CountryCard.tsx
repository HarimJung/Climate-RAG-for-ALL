'use client';

import { useRef, useCallback, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { exportHtmlAsPng } from '@/lib/exportPng';

interface CountryCardProps {
  country: string;
  iso3: string;
  flag: string;           // emoji flag e.g. "🇰🇷"
  hook: string;           // tagline ≤ 60 chars
  co2: number;            // metric tons per capita
  renewable: number;      // percentage
  pm25: number;           // µg/m³
  vulnerability: number;  // ND-GAIN score
  stripesData: { year: number; value: number }[];
  className?: string;
}

const YEARS = Array.from({ length: 24 }, (_, i) => 2000 + i);
const STRIPE_W = 1080 / YEARS.length;

function makeColorScale(values: number[]) {
  const [min, max] = d3.extent(values) as [number, number];
  if (min === max) return () => d3.interpolateRdBu(0.5);
  return (v: number) => d3.interpolateRdBu(1 - (v - min) / (max - min));
}

export function CountryCard({
  country, iso3, flag, hook, co2, renewable, pm25, vulnerability, stripesData, className = '',
}: CountryCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);

  // Pre-compute color scale for mini stripes
  const colorScale = useMemo(() => makeColorScale(stripesData.map(d => d.value)), [stripesData]);
  const dataMap = useMemo(() => new Map(stripesData.map(d => [d.year, d.value])), [stripesData]);

  const metrics = [
    { icon: '💨', value: co2.toFixed(1), unit: 't/capita', label: 'CO₂ per capita', color: '#EF4444' },
    { icon: '⚡', value: renewable.toFixed(1) + '%', unit: '', label: 'Renewable energy', color: '#3B82F6' },
    { icon: '🌫', value: pm25.toFixed(1), unit: 'µg/m³', label: 'PM2.5 pollution', color: '#94A3B8' },
    { icon: '⚠️', value: vulnerability.toFixed(3), unit: '', label: 'ND-GAIN vulnerability', color: '#F59E0B' },
  ];

  const handleExport = useCallback(async () => {
    if (!cardRef.current || exporting) return;
    setExporting(true);
    try {
      await exportHtmlAsPng(cardRef.current, `visualclimate-${iso3.toLowerCase()}-card.png`);
    } finally {
      setExporting(false);
    }
  }, [iso3, exporting]);

  return (
    <div className={`relative ${className}`}>
      <div
        ref={cardRef}
        style={{
          background: '#FFFFFF',
          borderRadius: '24px',
          border: '1px solid #E8E8ED',
          boxShadow: '0 8px 40px rgba(0,0,0,0.08)',
          padding: '40px',
          display: 'flex',
          flexDirection: 'column',
          aspectRatio: '1 / 1',
          overflow: 'hidden',
          fontFamily: 'Inter, system-ui, sans-serif',
        }}
      >
        {/* Header: flag + name + hook */}
        <div style={{ flexShrink: 0, marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '10px' }}>
            <span style={{ fontSize: '42px', lineHeight: 1 }}>{flag}</span>
            <h2 style={{ fontSize: '28px', fontWeight: 700, color: '#1A1A2E', lineHeight: 1.2, margin: 0 }}>
              {country}
            </h2>
          </div>
          <p style={{ fontSize: '16px', fontStyle: 'italic', color: '#4A4A6A', lineHeight: 1.5, margin: 0, maxWidth: '85%' }}>
            {hook.slice(0, 60)}
          </p>
        </div>

        {/* 2×2 Metrics grid */}
        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', minHeight: 0 }}>
          {metrics.map((m) => (
            <div
              key={m.label}
              style={{
                background: '#F8F9FA',
                borderRadius: '16px',
                padding: '18px 16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
              }}
            >
              <span style={{ fontSize: '22px' }}>{m.icon}</span>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                <span style={{ fontSize: '24px', fontWeight: 700, color: m.color, fontFamily: 'monospace' }}>
                  {m.value}
                </span>
                {m.unit && (
                  <span style={{ fontSize: '12px', color: '#94A3B8' }}>{m.unit}</span>
                )}
              </div>
              <p style={{ fontSize: '12px', color: '#4A4A6A', margin: 0 }}>{m.label}</p>
            </div>
          ))}
        </div>

        {/* Mini climate stripes — inline SVG, no export button */}
        <div style={{ flexShrink: 0, height: '80px', borderRadius: '10px', overflow: 'hidden', marginTop: '20px' }}>
          <svg
            viewBox="0 0 1080 80"
            preserveAspectRatio="none"
            style={{ display: 'block', width: '100%', height: '100%' }}
          >
            {YEARS.map((yr, i) => {
              const v = dataMap.get(yr);
              return (
                <rect
                  key={yr}
                  x={i * STRIPE_W}
                  y={0}
                  width={STRIPE_W + 0.6}
                  height={80}
                  fill={v != null ? colorScale(v) : '#D0D0D8'}
                />
              );
            })}
          </svg>
        </div>

        {/* Watermark */}
        <p style={{ flexShrink: 0, fontSize: '12px', color: '#94A3B8', textAlign: 'right', marginTop: '10px', marginBottom: 0 }}>
          visualclimate.org
        </p>
      </div>

      {/* Export button */}
      <button
        onClick={handleExport}
        disabled={exporting}
        className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 text-xs font-semibold text-[#1A1A2E] shadow transition-all hover:bg-white hover:shadow-md disabled:opacity-50"
        title="Download as PNG"
      >
        {exporting ? '…' : '↓ PNG'}
      </button>
    </div>
  );
}
