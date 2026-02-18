'use client';

import { useRef, useEffect, useCallback, useState } from 'react';
import * as d3 from 'd3';
import { exportSvgAsPng } from '@/lib/exportPng';
import emissionsTrend from '../../../data/analysis/emissions-trend-6countries.json';

export interface ClimateGapProps {
  highlightIso3?: string;
  className?: string;
}

const COUNTRY_NAMES: Record<string, string> = {
  KOR: 'South Korea', USA: 'United States', DEU: 'Germany',
  BRA: 'Brazil', NGA: 'Nigeria', BGD: 'Bangladesh',
};

const COUNTRY_COLORS: Record<string, string> = {
  KOR: '#0066FF', USA: '#EF4444', DEU: '#F59E0B',
  BRA: '#10B981', NGA: '#8B5CF6', BGD: '#EC4899',
};

const PILOTS = ['KOR', 'USA', 'DEU', 'BRA', 'NGA', 'BGD'];

export function ClimateGap({ highlightIso3, className = '' }: ClimateGapProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [exporting, setExporting] = useState(false);

  const W = 1080;
  const H = 720;

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    // White background
    svg.append('rect').attr('width', W).attr('height', H).attr('fill', '#FFFFFF');

    // Extract data from JSON
    const parisData = emissionsTrend.pre_paris_vs_post_paris;
    const countries = PILOTS.filter(iso3 => iso3 in parisData).map(iso3 => {
      const d = parisData[iso3 as keyof typeof parisData];
      return {
        iso3,
        name: COUNTRY_NAMES[iso3] ?? iso3,
        pre: d.pre_paris_cagr_pct,
        post: d.post_paris_cagr_pct,
        acceleration: d.acceleration,
      };
    });

    const ML = 200, MR = 200, MT = 100, MB = 80;
    const iW = W - ML - MR;
    const iH = H - MT - MB;

    // Title
    svg.append('text')
      .attr('x', W / 2).attr('y', 45).attr('text-anchor', 'middle')
      .attr('fill', '#1A1A2E').attr('font-size', 28).attr('font-weight', '700')
      .attr('font-family', 'Inter, system-ui, sans-serif')
      .text('Pre-Paris vs Post-Paris Emissions Growth');
    svg.append('text')
      .attr('x', W / 2).attr('y', 72).attr('text-anchor', 'middle')
      .attr('fill', '#94A3B8').attr('font-size', 16)
      .attr('font-family', 'Inter, system-ui, sans-serif')
      .text('CO\u2082 per capita CAGR (%) \u2014 6 pilot countries');

    const g = svg.append('g').attr('transform', `translate(${ML},${MT})`);

    // Y scale
    const allValues = countries.flatMap(c => [c.pre, c.post]);
    const yMin = d3.min(allValues)! * 1.3;
    const yMax = d3.max(allValues)! * 1.3;
    const y = d3.scaleLinear().domain([yMin, yMax]).nice().range([iH, 0]);

    // Two columns
    const colLeft = iW * 0.25;
    const colRight = iW * 0.75;

    // Column headers
    g.append('text')
      .attr('x', colLeft).attr('y', -25).attr('text-anchor', 'middle')
      .attr('fill', '#4A4A6A').attr('font-size', 16).attr('font-weight', '600')
      .attr('font-family', 'Inter, system-ui, sans-serif')
      .text('Pre-Paris (2000\u20132014)');
    g.append('text')
      .attr('x', colRight).attr('y', -25).attr('text-anchor', 'middle')
      .attr('fill', '#4A4A6A').attr('font-size', 16).attr('font-weight', '600')
      .attr('font-family', 'Inter, system-ui, sans-serif')
      .text('Post-Paris (2015\u20132023)');

    // Grid lines
    const gridTicks = y.ticks(8);
    g.selectAll('.grid-line')
      .data(gridTicks)
      .join('line')
      .attr('x1', 0).attr('x2', iW)
      .attr('y1', (d: number) => y(d)).attr('y2', (d: number) => y(d))
      .attr('stroke', '#E8E8ED').attr('stroke-width', 1);

    // Zero line
    g.append('line')
      .attr('x1', 0).attr('x2', iW)
      .attr('y1', y(0)).attr('y2', y(0))
      .attr('stroke', '#94A3B8').attr('stroke-width', 1.5).attr('stroke-dasharray', '6,4');
    g.append('text')
      .attr('x', -12).attr('y', y(0) + 4).attr('text-anchor', 'end')
      .attr('fill', '#94A3B8').attr('font-size', 13).attr('font-family', 'monospace')
      .text('0%');

    // Y axis ticks
    gridTicks.forEach((tick: number) => {
      if (tick === 0) return;
      g.append('text')
        .attr('x', -12).attr('y', y(tick) + 4).attr('text-anchor', 'end')
        .attr('fill', '#C8C8D0').attr('font-size', 12).attr('font-family', 'monospace')
        .text(`${tick > 0 ? '+' : ''}${tick.toFixed(1)}%`);
    });

    // Column lines
    [colLeft, colRight].forEach(cx => {
      g.append('line')
        .attr('x1', cx).attr('x2', cx)
        .attr('y1', -10).attr('y2', iH + 10)
        .attr('stroke', '#E8E8ED').attr('stroke-width', 1);
    });

    // Draw slopes for each country
    countries.forEach((c) => {
      const isHighlight = c.iso3 === highlightIso3;
      const isDeceleration = c.post < c.pre; // post is lower = deceleration (good)
      const lineColor = isHighlight
        ? COUNTRY_COLORS[c.iso3] ?? '#0066FF'
        : isDeceleration
          ? '#00A67E'
          : '#E5484D';
      const opacity = isHighlight ? 1 : 0.7;
      const strokeWidth = isHighlight ? 3.5 : 2;

      // Slope line
      g.append('line')
        .attr('x1', colLeft).attr('y1', y(c.pre))
        .attr('x2', colRight).attr('y2', y(c.post))
        .attr('stroke', lineColor)
        .attr('stroke-width', strokeWidth)
        .attr('opacity', opacity);

      // Left dot + label
      g.append('circle')
        .attr('cx', colLeft).attr('cy', y(c.pre))
        .attr('r', isHighlight ? 7 : 5)
        .attr('fill', lineColor).attr('stroke', '#FFFFFF').attr('stroke-width', 2);

      g.append('text')
        .attr('x', colLeft - 18).attr('y', y(c.pre) + 4)
        .attr('text-anchor', 'end')
        .attr('fill', lineColor).attr('font-size', isHighlight ? 14 : 12)
        .attr('font-weight', isHighlight ? '700' : '500')
        .attr('font-family', 'Inter, system-ui, sans-serif')
        .text(`${c.name} ${c.pre > 0 ? '+' : ''}${c.pre.toFixed(1)}%`);

      // Right dot + label
      g.append('circle')
        .attr('cx', colRight).attr('cy', y(c.post))
        .attr('r', isHighlight ? 7 : 5)
        .attr('fill', lineColor).attr('stroke', '#FFFFFF').attr('stroke-width', 2);

      g.append('text')
        .attr('x', colRight + 18).attr('y', y(c.post) + 4)
        .attr('text-anchor', 'start')
        .attr('fill', lineColor).attr('font-size', isHighlight ? 14 : 12)
        .attr('font-weight', isHighlight ? '700' : '500')
        .attr('font-family', 'Inter, system-ui, sans-serif')
        .text(`${c.post > 0 ? '+' : ''}${c.post.toFixed(1)}%`);

      // Acceleration badge (midpoint)
      if (isHighlight) {
        const midX = (colLeft + colRight) / 2;
        const midY = (y(c.pre) + y(c.post)) / 2;
        const accText = `${c.acceleration > 0 ? '+' : ''}${c.acceleration.toFixed(1)}pp`;

        g.append('rect')
          .attr('x', midX - 45).attr('y', midY - 14)
          .attr('width', 90).attr('height', 28).attr('rx', 14)
          .attr('fill', isDeceleration ? '#ECFDF5' : '#FEF2F2')
          .attr('stroke', isDeceleration ? '#A7F3D0' : '#FECACA')
          .attr('stroke-width', 1);
        g.append('text')
          .attr('x', midX).attr('y', midY + 4).attr('text-anchor', 'middle')
          .attr('fill', isDeceleration ? '#059669' : '#DC2626')
          .attr('font-size', 13).attr('font-weight', '700')
          .attr('font-family', 'monospace')
          .text(accText);
      }
    });

    // Legend
    const legY = H - 35;
    [
      { color: '#00A67E', label: 'Deceleration (post < pre)' },
      { color: '#E5484D', label: 'Acceleration (post > pre)' },
    ].forEach((item, i) => {
      const lx = W / 2 - 170 + i * 260;
      svg.append('line')
        .attr('x1', lx).attr('x2', lx + 24)
        .attr('y1', legY).attr('y2', legY)
        .attr('stroke', item.color).attr('stroke-width', 2.5);
      svg.append('text')
        .attr('x', lx + 32).attr('y', legY + 4)
        .attr('fill', '#4A4A6A').attr('font-size', 13)
        .attr('font-family', 'Inter, system-ui, sans-serif')
        .text(item.label);
    });

    // Watermark
    svg.append('text')
      .attr('x', W - 28).attr('y', H - 18).attr('text-anchor', 'end')
      .attr('fill', '#C8C8D0').attr('font-size', 15)
      .attr('font-family', 'Inter, system-ui, sans-serif')
      .text('visualclimate.org');

  }, [highlightIso3]);

  const handleExport = useCallback(async () => {
    if (!svgRef.current || exporting) return;
    setExporting(true);
    const slug = highlightIso3 ? highlightIso3.toLowerCase() : 'all';
    try {
      await exportSvgAsPng(svgRef.current, `visualclimate-${slug}-gap.png`, W, H);
    } finally {
      setExporting(false);
    }
  }, [highlightIso3, exporting]);

  return (
    <div className={`relative ${className}`}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="xMidYMid meet"
        style={{ display: 'block', width: '100%', height: 'auto' }}
        role="img"
        aria-label="Pre-Paris vs Post-Paris emissions slope chart"
      />
      <button
        onClick={handleExport}
        disabled={exporting}
        className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 text-xs font-semibold text-[#1A1A2E] shadow transition-all hover:bg-white hover:shadow-md disabled:opacity-50"
        title="Download as PNG"
      >
        {exporting ? '\u2026' : '\u2193 PNG'}
      </button>
    </div>
  );
}
