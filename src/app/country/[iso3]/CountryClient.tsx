'use client';

import { useRef, useEffect } from 'react';
import * as d3 from 'd3';
import { LineChart } from '@/components/charts/LineChart';
import { DonutChart } from '@/components/charts/DonutChart';

interface CountryClientProps {
  wbCo2Series: { year: number; value: number }[];
  co2Comparison: { year: number; wb: number; ct: number }[];
  countryName: string;
  emberMix: { renewable: number; fossil: number; other: number; year: number; source: string } | null;
  forestPercent: number | null;
  forestSource?: string;
  forestYear?: number;
}

function ComparisonChart({ data }: { data: { year: number; wb: number; ct: number }[] }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || data.length === 0) return;
    const container = containerRef.current;

    function draw() {
      container.innerHTML = '';
      const margin = { top: 20, right: 20, bottom: 40, left: 50 };
      const width = container.clientWidth;
      const height = 300;
      const innerW = width - margin.left - margin.right;
      const innerH = height - margin.top - margin.bottom;

      const svg = d3.select(container).append('svg').attr('width', width).attr('height', height);
      const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

      const x = d3.scaleLinear()
        .domain(d3.extent(data, d => d.year) as [number, number])
        .range([0, innerW]);

      const allVals = data.flatMap(d => [d.wb, d.ct]);
      const y = d3.scaleLinear()
        .domain([d3.min(allVals)! * 0.95, d3.max(allVals)! * 1.05])
        .nice()
        .range([innerH, 0]);

      // Grid
      g.append('g')
        .call(d3.axisLeft(y).tickSize(-innerW).tickFormat(() => ''))
        .call(sel => sel.selectAll('line').attr('stroke', '#1e293b').attr('stroke-dasharray', '2,2'))
        .call(sel => sel.select('.domain').remove());

      // X axis
      g.append('g')
        .attr('transform', `translate(0,${innerH})`)
        .call(d3.axisBottom(x).tickFormat(d => String(d)).ticks(Math.min(data.length, 8)))
        .call(sel => sel.select('.domain').attr('stroke', '#334155'))
        .call(sel => sel.selectAll('text').attr('fill', '#64748b').attr('font-size', '12'));

      // Y axis
      g.append('g')
        .call(d3.axisLeft(y).ticks(5))
        .call(sel => sel.select('.domain').attr('stroke', '#334155'))
        .call(sel => sel.selectAll('text').attr('fill', '#64748b').attr('font-size', '12'));

      // Reference line at 100
      g.append('line')
        .attr('x1', 0).attr('x2', innerW)
        .attr('y1', y(100)).attr('y2', y(100))
        .attr('stroke', '#475569').attr('stroke-dasharray', '4,4').attr('stroke-width', 1);

      // WB line (emerald)
      const wbLine = d3.line<typeof data[0]>().x(d => x(d.year)).y(d => y(d.wb)).curve(d3.curveMonotoneX);
      g.append('path').datum(data).attr('fill', 'none').attr('stroke', '#34d399').attr('stroke-width', 2).attr('d', wbLine);
      g.selectAll('.wb-dot').data(data).join('circle')
        .attr('cx', d => x(d.year)).attr('cy', d => y(d.wb))
        .attr('r', 3).attr('fill', '#34d399').attr('stroke', '#0f172a').attr('stroke-width', 1.5);

      // CT line (amber)
      const ctLine = d3.line<typeof data[0]>().x(d => x(d.year)).y(d => y(d.ct)).curve(d3.curveMonotoneX);
      g.append('path').datum(data).attr('fill', 'none').attr('stroke', '#f59e0b').attr('stroke-width', 2).attr('d', ctLine);
      g.selectAll('.ct-dot').data(data).join('circle')
        .attr('cx', d => x(d.year)).attr('cy', d => y(d.ct))
        .attr('r', 3).attr('fill', '#f59e0b').attr('stroke', '#0f172a').attr('stroke-width', 1.5);

      // Unit label
      g.append('text').attr('x', -margin.left + 10).attr('y', -8)
        .attr('fill', '#64748b').attr('font-size', '11').text(`Index (${data[0].year} = 100)`);
    }

    draw();
    const observer = new ResizeObserver(() => draw());
    observer.observe(container);
    return () => observer.disconnect();
  }, [data]);

  return <div ref={containerRef} className="w-full" />;
}

export function CountryClient({
  wbCo2Series,
  co2Comparison,
  countryName,
  emberMix,
  forestPercent,
  forestSource,
  forestYear,
}: CountryClientProps) {
  const energyMixData = emberMix
    ? [
        { label: 'Renewable', value: emberMix.renewable, color: '#22c55e' },
        { label: 'Fossil', value: emberMix.fossil, color: '#64748b' },
        { label: 'Nuclear & Other', value: emberMix.other, color: '#3b82f6' },
      ]
    : [];

  const landUse = forestPercent != null
    ? [
        { label: 'Forest', value: forestPercent, color: '#22c55e' },
        { label: 'Other land', value: Math.max(0, 100 - forestPercent), color: '#64748b' },
      ]
    : [];

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* WB CO2 per capita line chart */}
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
        <LineChart
          data={wbCo2Series}
          title={`${countryName} — CO\u2082 per capita (2000\u20132023)`}
          unit="metric tons"
          color="#34d399"
        />
        <p className="mt-2 text-xs text-slate-600">Source: World Bank WDI (2023)</p>
      </div>

      {/* WB vs Climate TRACE comparison */}
      {co2Comparison.length > 0 && (
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
          <h3 className="mb-4 text-sm font-medium text-slate-400">
            World Bank vs Climate TRACE — Emissions Trend
          </h3>
          <div className="mb-3 flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-0.5 w-4 rounded bg-emerald-400" />
              <span className="text-slate-400">World Bank CO\u2082/capita</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-0.5 w-4 rounded bg-amber-400" />
              <span className="text-slate-400">Climate TRACE Total GHG</span>
            </span>
          </div>
          <ComparisonChart data={co2Comparison} />
          <p className="mt-2 text-xs text-slate-600">
            Source: World Bank WDI + Climate TRACE (normalized index, {co2Comparison[0].year} = 100)
          </p>
        </div>
      )}

      {/* Ember Electricity Mix Donut */}
      {energyMixData.length > 0 && (
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
          <DonutChart data={energyMixData} title="Electricity Generation Mix" />
          <p className="mt-2 text-xs text-slate-600">Source: Ember ({emberMix!.year})</p>
        </div>
      )}

      {/* Land Use Donut */}
      {landUse.length > 0 && (
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
          <DonutChart data={landUse} title="Land Cover" />
          <p className="mt-2 text-xs text-slate-600">
            Source: {forestSource || 'World Bank WDI'} ({forestYear || 'latest'})
          </p>
        </div>
      )}
    </div>
  );
}
