'use client';

import { useRef, useEffect } from 'react';
import * as d3 from 'd3';

interface DataPoint {
  year: number;
  value: number;
}

interface LineChartProps {
  data: DataPoint[];
  title?: string;
  unit?: string;
  color?: string;
  height?: number;
}

export function LineChart({ data, title, unit = '', color = '#0066FF', height = 300 }: LineChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || data.length === 0) return;

    const container = containerRef.current;

    function draw() {
      container.innerHTML = '';

      const margin = { top: 20, right: 20, bottom: 40, left: 60 };
      const width = container.clientWidth;
      const innerW = width - margin.left - margin.right;
      const innerH = height - margin.top - margin.bottom;

      const svg = d3.select(container)
        .append('svg')
        .attr('width', width)
        .attr('height', height);

      const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

      const sorted = [...data].sort((a, b) => a.year - b.year);

      const x = d3.scaleLinear()
        .domain(d3.extent(sorted, d => d.year) as [number, number])
        .range([0, innerW]);

      const y = d3.scaleLinear()
        .domain([0, d3.max(sorted, d => d.value)! * 1.1])
        .nice()
        .range([innerH, 0]);

      // Grid
      g.append('g')
        .call(d3.axisLeft(y).tickSize(-innerW).tickFormat(() => ''))
        .call(sel => sel.selectAll('line').attr('stroke', '#E8E8ED').attr('stroke-dasharray', '2,2'))
        .call(sel => sel.select('.domain').remove());

      // X axis
      g.append('g')
        .attr('transform', `translate(0,${innerH})`)
        .call(d3.axisBottom(x).tickFormat(d => String(d)).ticks(Math.min(sorted.length, 8)))
        .call(sel => sel.select('.domain').attr('stroke', '#C8C8D0'))
        .call(sel => sel.selectAll('text').attr('fill', '#4A4A6A').attr('font-size', '12'));

      // Y axis
      g.append('g')
        .call(d3.axisLeft(y).ticks(5))
        .call(sel => sel.select('.domain').attr('stroke', '#C8C8D0'))
        .call(sel => sel.selectAll('text').attr('fill', '#4A4A6A').attr('font-size', '12'));

      // Area gradient
      const gradId = `lg-${Math.random().toString(36).slice(2, 8)}`;
      const defs = svg.append('defs');
      const grad = defs.append('linearGradient').attr('id', gradId)
        .attr('x1', '0').attr('y1', '0').attr('x2', '0').attr('y2', '1');
      grad.append('stop').attr('offset', '0%').attr('stop-color', color).attr('stop-opacity', 0.15);
      grad.append('stop').attr('offset', '100%').attr('stop-color', color).attr('stop-opacity', 0);

      // Area
      const area = d3.area<DataPoint>()
        .x(d => x(d.year)).y0(innerH).y1(d => y(d.value)).curve(d3.curveMonotoneX);

      g.append('path').datum(sorted).attr('fill', `url(#${gradId})`).attr('d', area);

      // Line
      const line = d3.line<DataPoint>()
        .x(d => x(d.year)).y(d => y(d.value)).curve(d3.curveMonotoneX);

      g.append('path').datum(sorted)
        .attr('fill', 'none').attr('stroke', color).attr('stroke-width', 2).attr('d', line);

      // Dots
      g.selectAll('.dot').data(sorted).join('circle')
        .attr('cx', d => x(d.year)).attr('cy', d => y(d.value))
        .attr('r', 3).attr('fill', color).attr('stroke', '#FFFFFF').attr('stroke-width', 1.5);

      // Unit label
      if (unit) {
        g.append('text').attr('x', -margin.left + 10).attr('y', -8)
          .attr('fill', '#4A4A6A').attr('font-size', '11').text(unit);
      }
    }

    draw();

    const observer = new ResizeObserver(() => draw());
    observer.observe(container);
    return () => observer.disconnect();
  }, [data, color, height, unit]);

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center rounded-xl border border-[--border-card] bg-[--bg-section] p-6" style={{ height }}>
        <p className="text-sm text-[--text-muted]">No data available</p>
      </div>
    );
  }

  return (
    <div>
      {title && <h3 className="mb-4 text-sm font-medium text-[--text-secondary]">{title}</h3>}
      <div ref={containerRef} className="w-full" />
    </div>
  );
}
