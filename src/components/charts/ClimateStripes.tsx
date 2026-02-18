'use client';

import { useRef, useEffect, useCallback, useState } from 'react';
import * as d3 from 'd3';
import { exportSvgAsPng } from '@/lib/exportPng';

export interface CountryStripeData {
  country: string;
  iso3: string;
  data: { year: number; value: number }[];
}

interface ClimateStripesProps {
  mode: 'single' | 'stacked';
  // single mode
  country?: string;
  iso3?: string;
  data?: { year: number; value: number }[];
  // stacked mode
  allData?: CountryStripeData[];
  indicator?: string;
  showExport?: boolean;
  className?: string;
}

const YEARS = Array.from({ length: 24 }, (_, i) => 2000 + i);
const W = 1080;

// Color scale: d3.interpolateRdBu reversed — low CO2 = blue, high = red
function makeColorScale(values: number[]) {
  const [min, max] = d3.extent(values) as [number, number];
  if (min === max) return () => d3.interpolateRdBu(0.5);
  return (v: number) => d3.interpolateRdBu(1 - (v - min) / (max - min));
}

export function ClimateStripes({
  mode,
  country,
  iso3,
  data,
  allData,
  indicator = 'CO₂ per capita · 2000–2023',
  showExport = true,
  className = '',
}: ClimateStripesProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [exporting, setExporting] = useState(false);

  const H = mode === 'stacked' ? 1350 : 1080;
  const ROW_H = mode === 'stacked' ? H / 6 : H;
  const STRIPE_W = W / YEARS.length;

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    // Resolve country list
    const countries: CountryStripeData[] =
      mode === 'stacked' && allData
        ? allData
        : country && data
        ? [{ country, iso3: iso3 ?? '', data }]
        : [];

    if (countries.length === 0) return;

    // Unified color domain across all countries
    const allValues = countries.flatMap(c => c.data.map(d => d.value));
    const colorScale = makeColorScale(allValues);

    countries.forEach((c, rowIdx) => {
      const y0 = rowIdx * ROW_H;
      const dataMap = new Map(c.data.map(d => [d.year, d.value]));
      const g = svg.append('g').attr('transform', `translate(0,${y0})`);

      // Stripes — start transparent, animate in left-to-right
      g.selectAll<SVGRectElement, number>('rect.stripe')
        .data(YEARS)
        .join('rect')
        .attr('class', 'stripe')
        .attr('x', (_, i) => i * STRIPE_W)
        .attr('y', 0)
        .attr('width', STRIPE_W + 0.6)   // slight overlap prevents gaps
        .attr('height', ROW_H)
        .attr('fill', yr => {
          const v = dataMap.get(yr);
          return v != null ? colorScale(v) : '#D0D0D8';
        })
        .attr('opacity', 0)
        .transition()
        .delay((_, i) => i * 18)
        .duration(400)
        .attr('opacity', 1);

      // Country name (top-left)
      const fontSize = mode === 'stacked' ? 30 : 48;
      const nameY = mode === 'stacked' ? ROW_H * 0.35 : 80;
      g.append('text')
        .attr('x', 36)
        .attr('y', nameY)
        .attr('fill', '#FFFFFF')
        .attr('font-size', fontSize)
        .attr('font-weight', '700')
        .attr('font-family', 'Inter, system-ui, sans-serif')
        .style('filter', 'drop-shadow(0 1px 3px rgba(0,0,0,0.7))')
        .text(c.country);
    });

    // Bottom-left label (single) or footer (stacked)
    const labelY = mode === 'stacked' ? H - 18 : H - 44;
    const labelSize = mode === 'stacked' ? 18 : 22;
    svg.append('text')
      .attr('x', 36)
      .attr('y', labelY)
      .attr('fill', 'rgba(255,255,255,0.85)')
      .attr('font-size', labelSize)
      .attr('font-family', 'Inter, system-ui, sans-serif')
      .style('filter', 'drop-shadow(0 1px 2px rgba(0,0,0,0.5))')
      .text(indicator);

    // Watermark bottom-right
    svg.append('text')
      .attr('x', W - 28)
      .attr('y', H - 18)
      .attr('text-anchor', 'end')
      .attr('fill', 'rgba(255,255,255,0.65)')
      .attr('font-size', 18)
      .attr('font-family', 'Inter, system-ui, sans-serif')
      .text('visualclimate.org');
  }, [mode, country, iso3, data, allData, indicator, ROW_H, STRIPE_W, H]);

  const handleExport = useCallback(async () => {
    if (!svgRef.current || exporting) return;
    setExporting(true);
    const slug = mode === 'stacked' ? 'all-stacked' : (iso3 ?? 'country').toLowerCase();
    try {
      await exportSvgAsPng(
        svgRef.current,
        `visualclimate-${slug}-stripes.png`,
        W,
        H,
      );
    } finally {
      setExporting(false);
    }
  }, [mode, iso3, exporting, H]);

  return (
    <div className={`relative ${className}`}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="xMidYMid meet"
        style={{ display: 'block', width: '100%', height: 'auto' }}
        role="img"
        aria-label={mode === 'stacked' ? 'Climate stripes — 6 countries' : `${country ?? ''} climate stripes`}
      />
      {showExport && (
        <button
          onClick={handleExport}
          disabled={exporting}
          className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 text-xs font-semibold text-[#1A1A2E] shadow transition-all hover:bg-white hover:shadow-md disabled:opacity-50"
          title="Download as 1080px PNG"
        >
          {exporting ? '…' : '↓ PNG'}
        </button>
      )}
    </div>
  );
}
