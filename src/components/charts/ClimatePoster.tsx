'use client';

import { useRef, useEffect, useCallback, useState } from 'react';
import * as d3 from 'd3';
import { exportSvgAsPng } from '@/lib/exportPng';

export interface ClimatePosterProps {
  country: string;
  iso3: string;
  flag: string;
  hook: string;
  co2: number;
  renewable: number;
  pm25: number;
  vulnerability: number;
  stripesData: { year: number; value: number }[];
  className?: string;
}

const YEARS = Array.from({ length: 24 }, (_, i) => 2000 + i);

function makeColorScale(values: number[]) {
  const [min, max] = d3.extent(values) as [number, number];
  if (min === max) return () => d3.interpolateRdBu(0.5);
  return (v: number) => d3.interpolateRdBu(1 - (v - min) / (max - min));
}

export function ClimatePoster({
  country, iso3, flag, hook, co2, renewable, pm25, vulnerability, stripesData, className = '',
}: ClimatePosterProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [exporting, setExporting] = useState(false);

  const W = 1080;
  const H = 1080;
  const BG = '#0F172A';

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    // Dark background
    svg.append('rect').attr('width', W).attr('height', H).attr('fill', BG).attr('rx', 0);

    // Subtle gradient overlay
    const defs = svg.append('defs');
    const grad = defs.append('linearGradient').attr('id', 'poster-bg-grad')
      .attr('x1', '0').attr('y1', '0').attr('x2', '0').attr('y2', '1');
    grad.append('stop').attr('offset', '0%').attr('stop-color', '#1E293B').attr('stop-opacity', 0.4);
    grad.append('stop').attr('offset', '100%').attr('stop-color', BG).attr('stop-opacity', 0);
    svg.append('rect').attr('width', W).attr('height', H).attr('fill', 'url(#poster-bg-grad)');

    const px = 60;

    // Flag + Country name
    svg.append('text')
      .attr('x', px).attr('y', 100)
      .attr('fill', '#FFFFFF').attr('font-size', 56).attr('font-weight', '800')
      .attr('font-family', 'Inter, system-ui, sans-serif')
      .text(`${flag}  ${country}`);

    // ISO3 badge
    svg.append('rect')
      .attr('x', px).attr('y', 120).attr('width', 70).attr('height', 32).attr('rx', 6)
      .attr('fill', 'rgba(255,255,255,0.1)');
    svg.append('text')
      .attr('x', px + 35).attr('y', 142).attr('text-anchor', 'middle')
      .attr('fill', 'rgba(255,255,255,0.6)').attr('font-size', 16).attr('font-weight', '600')
      .attr('font-family', 'monospace')
      .text(iso3);

    // Headline
    svg.append('text')
      .attr('x', px).attr('y', 200)
      .attr('fill', 'rgba(255,255,255,0.7)').attr('font-size', 22)
      .attr('font-style', 'italic')
      .attr('font-family', 'Inter, system-ui, sans-serif')
      .text(hook.slice(0, 70));

    // 2x2 Metrics
    const metrics = [
      { label: 'CO\u2082 per capita', value: co2.toFixed(1), unit: 't CO\u2082e', color: '#EF4444' },
      { label: 'Renewable energy', value: renewable.toFixed(1) + '%', unit: '', color: '#10B981' },
      { label: 'PM2.5 pollution', value: pm25.toFixed(1), unit: '\u00B5g/m\u00B3', color: '#94A3B8' },
      { label: 'ND-GAIN vulnerability', value: vulnerability.toFixed(3), unit: '', color: '#F59E0B' },
    ];

    const cardW = 440;
    const cardH = 180;
    const gap = 40;
    const startY = 280;

    metrics.forEach((m, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const cx = px + col * (cardW + gap);
      const cy = startY + row * (cardH + gap);

      // Card bg
      svg.append('rect')
        .attr('x', cx).attr('y', cy)
        .attr('width', cardW).attr('height', cardH)
        .attr('rx', 16)
        .attr('fill', 'rgba(255,255,255,0.05)')
        .attr('stroke', 'rgba(255,255,255,0.08)')
        .attr('stroke-width', 1);

      // Label
      svg.append('text')
        .attr('x', cx + 30).attr('y', cy + 40)
        .attr('fill', 'rgba(255,255,255,0.5)').attr('font-size', 18)
        .attr('font-family', 'Inter, system-ui, sans-serif')
        .text(m.label);

      // Value
      svg.append('text')
        .attr('x', cx + 30).attr('y', cy + 100)
        .attr('fill', m.color).attr('font-size', 48).attr('font-weight', '800')
        .attr('font-family', 'monospace')
        .text(m.value);

      // Unit
      if (m.unit) {
        svg.append('text')
          .attr('x', cx + 30).attr('y', cy + 140)
          .attr('fill', 'rgba(255,255,255,0.35)').attr('font-size', 16)
          .attr('font-family', 'Inter, system-ui, sans-serif')
          .text(m.unit);
      }
    });

    // Mini climate stripes
    const stripesY = 760;
    const stripesH = 180;
    const stripeW = (W - px * 2) / YEARS.length;

    const allValues = stripesData.map(d => d.value);
    const colorScale = makeColorScale(allValues);
    const dataMap = new Map(stripesData.map(d => [d.year, d.value]));

    // Stripes background container
    svg.append('rect')
      .attr('x', px).attr('y', stripesY)
      .attr('width', W - px * 2).attr('height', stripesH)
      .attr('rx', 12)
      .attr('fill', 'rgba(255,255,255,0.03)');

    // Stripes
    YEARS.forEach((yr, i) => {
      const v = dataMap.get(yr);
      svg.append('rect')
        .attr('x', px + i * stripeW).attr('y', stripesY)
        .attr('width', stripeW + 0.5).attr('height', stripesH)
        .attr('fill', v != null ? colorScale(v) : '#334155')
        .attr('opacity', 0)
        .transition()
        .delay(i * 15)
        .duration(300)
        .attr('opacity', 1);
    });

    // Year labels on stripes
    svg.append('text')
      .attr('x', px + 8).attr('y', stripesY + stripesH - 8)
      .attr('fill', 'rgba(255,255,255,0.7)').attr('font-size', 14)
      .attr('font-family', 'monospace')
      .text('2000');
    svg.append('text')
      .attr('x', W - px - 8).attr('y', stripesY + stripesH - 8)
      .attr('text-anchor', 'end')
      .attr('fill', 'rgba(255,255,255,0.7)').attr('font-size', 14)
      .attr('font-family', 'monospace')
      .text('2023');

    // Stripes label
    svg.append('text')
      .attr('x', px).attr('y', stripesY - 14)
      .attr('fill', 'rgba(255,255,255,0.5)').attr('font-size', 16)
      .attr('font-family', 'Inter, system-ui, sans-serif')
      .text('CO\u2082 per capita trend (blue = low, red = high)');

    // Source + watermark
    svg.append('text')
      .attr('x', px).attr('y', H - 40)
      .attr('fill', 'rgba(255,255,255,0.3)').attr('font-size', 15)
      .attr('font-family', 'Inter, system-ui, sans-serif')
      .text('Source: World Bank, Ember, ND-GAIN');
    svg.append('text')
      .attr('x', W - px).attr('y', H - 40).attr('text-anchor', 'end')
      .attr('fill', 'rgba(255,255,255,0.4)').attr('font-size', 17)
      .attr('font-weight', '600')
      .attr('font-family', 'Inter, system-ui, sans-serif')
      .text('visualclimate.org');

  }, [country, iso3, flag, hook, co2, renewable, pm25, vulnerability, stripesData]);

  const handleExport = useCallback(async () => {
    if (!svgRef.current || exporting) return;
    setExporting(true);
    try {
      await exportSvgAsPng(svgRef.current, `visualclimate-${iso3.toLowerCase()}-poster.png`, W, H);
    } finally {
      setExporting(false);
    }
  }, [iso3, exporting]);

  return (
    <div className={`relative ${className}`}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="xMidYMid meet"
        style={{ display: 'block', width: '100%', height: 'auto', borderRadius: '16px' }}
        role="img"
        aria-label={`${country} climate poster`}
      />
      <button
        onClick={handleExport}
        disabled={exporting}
        className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 text-xs font-semibold text-[#1A1A2E] shadow transition-all hover:bg-white hover:shadow-md disabled:opacity-50"
        title="Download as 1080x1080 PNG"
      >
        {exporting ? '\u2026' : '\u2193 PNG'}
      </button>
    </div>
  );
}
