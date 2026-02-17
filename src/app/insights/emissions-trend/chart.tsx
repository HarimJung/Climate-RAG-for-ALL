'use client';

import { useRef, useEffect } from 'react';
import * as d3 from 'd3';

interface CountrySeries {
  iso3: string;
  country: string;
  color: string;
  data: { year: number; value: number }[];
}

const SERIES: CountrySeries[] = [
  {
    iso3: 'USA', country: 'United States', color: '#f87171',
    data: [
      { year: 2000, value: 21.01 }, { year: 2002, value: 20.24 }, { year: 2004, value: 20.15 },
      { year: 2006, value: 19.56 }, { year: 2008, value: 18.66 }, { year: 2010, value: 17.56 },
      { year: 2012, value: 16.37 }, { year: 2014, value: 16.52 }, { year: 2016, value: 15.58 },
      { year: 2018, value: 15.82 }, { year: 2020, value: 13.50 }, { year: 2022, value: 14.26 },
      { year: 2023, value: 13.71 },
    ],
  },
  {
    iso3: 'KOR', country: 'South Korea', color: '#60a5fa',
    data: [
      { year: 2000, value: 9.92 }, { year: 2002, value: 10.07 }, { year: 2004, value: 10.39 },
      { year: 2006, value: 10.55 }, { year: 2008, value: 10.68 }, { year: 2010, value: 11.62 },
      { year: 2012, value: 11.85 }, { year: 2014, value: 12.43 }, { year: 2016, value: 12.18 },
      { year: 2018, value: 12.40 }, { year: 2020, value: 10.76 }, { year: 2022, value: 11.39 },
      { year: 2023, value: 11.42 },
    ],
  },
  {
    iso3: 'DEU', country: 'Germany', color: '#fbbf24',
    data: [
      { year: 2000, value: 10.60 }, { year: 2002, value: 10.34 }, { year: 2004, value: 10.22 },
      { year: 2006, value: 10.23 }, { year: 2008, value: 10.02 }, { year: 2010, value: 9.89 },
      { year: 2012, value: 9.72 }, { year: 2014, value: 9.04 }, { year: 2016, value: 9.18 },
      { year: 2018, value: 8.82 }, { year: 2020, value: 7.54 }, { year: 2022, value: 7.55 },
      { year: 2023, value: 7.08 },
    ],
  },
  {
    iso3: 'BRA', country: 'Brazil', color: '#34d399',
    data: [
      { year: 2000, value: 2.01 }, { year: 2002, value: 1.96 }, { year: 2004, value: 2.06 },
      { year: 2006, value: 2.10 }, { year: 2008, value: 2.25 }, { year: 2010, value: 2.49 },
      { year: 2012, value: 2.60 }, { year: 2014, value: 2.76 }, { year: 2016, value: 2.35 },
      { year: 2018, value: 2.25 }, { year: 2020, value: 2.10 }, { year: 2022, value: 2.31 },
      { year: 2023, value: 2.27 },
    ],
  },
  {
    iso3: 'NGA', country: 'Nigeria', color: '#c084fc',
    data: [
      { year: 2000, value: 0.79 }, { year: 2002, value: 0.79 }, { year: 2004, value: 0.88 },
      { year: 2006, value: 0.72 }, { year: 2008, value: 0.77 }, { year: 2010, value: 0.68 },
      { year: 2012, value: 0.63 }, { year: 2014, value: 0.58 }, { year: 2016, value: 0.49 },
      { year: 2018, value: 0.55 }, { year: 2020, value: 0.53 }, { year: 2022, value: 0.56 },
      { year: 2023, value: 0.55 },
    ],
  },
  {
    iso3: 'BGD', country: 'Bangladesh', color: '#fb923c',
    data: [
      { year: 2000, value: 0.20 }, { year: 2002, value: 0.22 }, { year: 2004, value: 0.25 },
      { year: 2006, value: 0.28 }, { year: 2008, value: 0.30 }, { year: 2010, value: 0.34 },
      { year: 2012, value: 0.38 }, { year: 2014, value: 0.42 }, { year: 2016, value: 0.49 },
      { year: 2018, value: 0.55 }, { year: 2020, value: 0.57 }, { year: 2022, value: 0.67 },
      { year: 2023, value: 0.69 },
    ],
  },
];

export function EmissionsTrendChart() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;

    function draw() {
      container.innerHTML = '';

      const margin = { top: 20, right: 120, bottom: 40, left: 60 };
      const width = container.clientWidth;
      const height = 400;
      const innerW = width - margin.left - margin.right;
      const innerH = height - margin.top - margin.bottom;

      const svg = d3.select(container)
        .append('svg')
        .attr('width', width)
        .attr('height', height);

      const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

      const allValues = SERIES.flatMap(s => s.data.map(d => d.value));

      const x = d3.scaleLinear().domain([2000, 2023]).range([0, innerW]);
      const y = d3.scaleLinear().domain([0, d3.max(allValues)! * 1.08]).nice().range([innerH, 0]);

      // Grid
      g.append('g')
        .call(d3.axisLeft(y).tickSize(-innerW).tickFormat(() => ''))
        .call(sel => sel.selectAll('line').attr('stroke', '#1e293b').attr('stroke-dasharray', '2,2'))
        .call(sel => sel.select('.domain').remove());

      // Paris Agreement line
      g.append('line')
        .attr('x1', x(2015)).attr('x2', x(2015))
        .attr('y1', 0).attr('y2', innerH)
        .attr('stroke', '#475569').attr('stroke-dasharray', '4,4');

      g.append('text')
        .attr('x', x(2015) + 4).attr('y', 12)
        .attr('fill', '#64748b').attr('font-size', '10')
        .text('Paris Agreement');

      // Axes
      g.append('g')
        .attr('transform', `translate(0,${innerH})`)
        .call(d3.axisBottom(x).tickFormat(d => String(d)).ticks(8))
        .call(sel => sel.select('.domain').attr('stroke', '#334155'))
        .call(sel => sel.selectAll('text').attr('fill', '#64748b').attr('font-size', '12'));

      g.append('g')
        .call(d3.axisLeft(y).ticks(6))
        .call(sel => sel.select('.domain').attr('stroke', '#334155'))
        .call(sel => sel.selectAll('text').attr('fill', '#64748b').attr('font-size', '12'));

      // Y-axis label
      g.append('text')
        .attr('x', -margin.left + 10).attr('y', -8)
        .attr('fill', '#64748b').attr('font-size', '11')
        .text('metric tons CO2eq per capita');

      const line = d3.line<{ year: number; value: number }>()
        .x(d => x(d.year)).y(d => y(d.value)).curve(d3.curveMonotoneX);

      SERIES.forEach((series) => {
        // Line
        g.append('path')
          .datum(series.data)
          .attr('fill', 'none')
          .attr('stroke', series.color)
          .attr('stroke-width', 2)
          .attr('d', line);

        // End label
        const last = series.data[series.data.length - 1];
        g.append('text')
          .attr('x', x(last.year) + 6)
          .attr('y', y(last.value) + 4)
          .attr('fill', series.color)
          .attr('font-size', '11')
          .attr('font-weight', '500')
          .text(series.iso3);
      });
    }

    draw();
    const observer = new ResizeObserver(() => draw());
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  return <div ref={containerRef} className="w-full" />;
}
