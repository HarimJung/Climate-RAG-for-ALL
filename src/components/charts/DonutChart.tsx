'use client';

import { useRef, useEffect } from 'react';
import * as d3 from 'd3';

interface Slice {
  label: string;
  value: number;
  color?: string;
}

interface DonutChartProps {
  data: Slice[];
  title?: string;
  size?: number;
}

const PALETTE = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#a855f7', '#06b6d4', '#f97316', '#ec4899'];

export function DonutChart({ data, title, size = 260 }: DonutChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || data.length === 0) return;

    const container = containerRef.current;

    function draw() {
      container.innerHTML = '';

      const outerR = size / 2;
      const innerR = outerR * 0.55;

      const svg = d3.select(container)
        .append('svg')
        .attr('width', size)
        .attr('height', size)
        .append('g')
        .attr('transform', `translate(${outerR},${outerR})`);

      const pie = d3.pie<Slice>()
        .value(d => d.value)
        .sort(null)
        .padAngle(0.02);

      const arc = d3.arc<d3.PieArcDatum<Slice>>()
        .innerRadius(innerR)
        .outerRadius(outerR)
        .cornerRadius(3);

      const arcs = svg.selectAll('path')
        .data(pie(data))
        .join('path')
        .attr('d', arc)
        .attr('fill', (d, i) => d.data.color || PALETTE[i % PALETTE.length])
        .attr('stroke', '#FFFFFF')
        .attr('stroke-width', 2);

      arcs.on('mouseenter', function () {
        d3.select(this).attr('opacity', 0.8);
      }).on('mouseleave', function () {
        d3.select(this).attr('opacity', 1);
      });

      // Center total
      const total = data.reduce((s, d) => s + d.value, 0);
      svg.append('text')
        .attr('text-anchor', 'middle')
        .attr('dy', '-0.2em')
        .attr('fill', '#f1f5f9')
        .attr('font-size', '22')
        .attr('font-weight', '700')
        .attr('font-family', 'var(--font-jetbrains-mono), monospace')
        .text(`${total.toFixed(0)}%`);

      svg.append('text')
        .attr('text-anchor', 'middle')
        .attr('dy', '1.3em')
        .attr('fill', '#64748b')
        .attr('font-size', '11')
        .text('Total');
    }

    draw();
  }, [data, size]);

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center rounded-xl border border-gray-200 bg-white p-6" style={{ height: size }}>
        <p className="text-sm text-slate-500">No data available</p>
      </div>
    );
  }

  return (
    <div>
      {title && <h3 className="mb-4 text-sm font-medium text-slate-400">{title}</h3>}
      <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
        <div ref={containerRef} />
        {/* Legend */}
        <ul className="flex flex-col gap-2">
          {data.map((d, i) => (
            <li key={d.label} className="flex items-center gap-2 text-sm">
              <span
                className="inline-block h-3 w-3 rounded-sm"
                style={{ backgroundColor: d.color || PALETTE[i % PALETTE.length] }}
              />
              <span className="text-slate-400">{d.label}</span>
              <span className="ml-auto font-mono text-slate-300">{d.value.toFixed(1)}%</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
