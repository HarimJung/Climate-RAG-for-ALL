'use client';

import { useRef, useEffect } from 'react';
import * as d3 from 'd3';

interface BarDatum {
  label: string;
  value: number;
  color?: string;
  href?: string;
}

interface BarChartProps {
  data: BarDatum[];
  title?: string;
  unit?: string;
  height?: number;
}

const DEFAULT_COLORS = ['#0066FF', '#00A67E', '#F59E0B', '#E5484D', '#8B5CF6', '#EC4899'];

export function BarChart({ data, title, unit = '', height: fixedHeight }: BarChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || data.length === 0) return;

    const container = containerRef.current;

    function draw() {
      container.innerHTML = '';

      const barH = 36;
      const gap = 8;
      const margin = { top: 10, right: 60, bottom: 10, left: 110 };
      const computedH = fixedHeight ?? (data.length * (barH + gap) + margin.top + margin.bottom);
      const width = container.clientWidth;
      const innerW = width - margin.left - margin.right;

      const svg = d3.select(container)
        .append('svg')
        .attr('width', width)
        .attr('height', computedH);

      const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

      const sorted = [...data].sort((a, b) => b.value - a.value);

      const x = d3.scaleLinear()
        .domain([0, d3.max(sorted, d => d.value)! * 1.15])
        .range([0, innerW]);

      const y = d3.scaleBand()
        .domain(sorted.map(d => d.label))
        .range([0, sorted.length * (barH + gap)])
        .padding(0.15);

      // Bars
      g.selectAll('rect')
        .data(sorted)
        .join('rect')
        .attr('x', 0)
        .attr('y', d => y(d.label)!)
        .attr('width', d => x(d.value))
        .attr('height', y.bandwidth())
        .attr('rx', 4)
        .attr('fill', (d, i) => d.color || DEFAULT_COLORS[i % DEFAULT_COLORS.length])
        .attr('cursor', d => d.href ? 'pointer' : 'default')
        .on('mouseenter', function () {
          d3.select(this).attr('opacity', 0.8);
        })
        .on('mouseleave', function () {
          d3.select(this).attr('opacity', 1);
        })
        .on('click', (_, d) => {
          if (d.href) window.location.href = d.href;
        });

      // Country labels
      g.selectAll('.label')
        .data(sorted)
        .join('text')
        .attr('x', -8)
        .attr('y', d => y(d.label)! + y.bandwidth() / 2)
        .attr('dy', '0.35em')
        .attr('text-anchor', 'end')
        .attr('fill', '#4A4A6A')
        .attr('font-size', '13')
        .text(d => d.label);

      // Value labels
      g.selectAll('.val')
        .data(sorted)
        .join('text')
        .attr('x', d => x(d.value) + 6)
        .attr('y', d => y(d.label)! + y.bandwidth() / 2)
        .attr('dy', '0.35em')
        .attr('fill', '#1A1A2E')
        .attr('font-size', '12')
        .attr('font-family', 'var(--font-jetbrains-mono), monospace')
        .text(d => d.value.toLocaleString(undefined, { maximumFractionDigits: 1 }));
    }

    draw();

    const observer = new ResizeObserver(() => draw());
    observer.observe(container);
    return () => observer.disconnect();
  }, [data, fixedHeight]);

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center rounded-xl border border-[--border-card] bg-[--bg-section] p-6" style={{ height: 200 }}>
        <p className="text-sm text-[--text-muted]">No data available</p>
      </div>
    );
  }

  return (
    <div>
      {title && (
        <h3 className="mb-4 text-sm font-medium text-[--text-secondary]">
          {title}{unit && <span className="ml-1 text-[--text-muted]">({unit})</span>}
        </h3>
      )}
      <div ref={containerRef} className="w-full" />
    </div>
  );
}
