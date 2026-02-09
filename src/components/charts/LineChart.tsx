'use client';

import { useRef, useEffect } from 'react';
import * as d3 from 'd3';

interface LineChartProps {
    data: { year: number; value: number }[];
    title: string;
    unit: string;
}

export function LineChart({ data, title, unit }: LineChartProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const svgRef = useRef<SVGSVGElement>(null);

    useEffect(() => {
        if (!svgRef.current || !containerRef.current || data.length === 0) return;

        const container = containerRef.current;
        const width = container.clientWidth;
        const height = 300;
        const margin = { top: 40, right: 30, bottom: 50, left: 60 };
        const innerWidth = width - margin.left - margin.right;
        const innerHeight = height - margin.top - margin.bottom;

        const svg = d3.select(svgRef.current)
            .attr('viewBox', `0 0 ${width} ${height}`)
            .attr('preserveAspectRatio', 'xMidYMid meet');

        svg.selectAll('*').remove();

        const sortedData = [...data].sort((a, b) => a.year - b.year);

        const xScale = d3.scaleLinear()
            .domain(d3.extent(sortedData, d => d.year) as [number, number])
            .range([0, innerWidth]);

        const yScale = d3.scaleLinear()
            .domain([0, d3.max(sortedData, d => d.value) || 0])
            .nice()
            .range([innerHeight, 0]);

        const g = svg.append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);

        // Grid lines
        g.append('g')
            .attr('class', 'grid')
            .call(
                d3.axisLeft(yScale)
                    .tickSize(-innerWidth)
                    .tickFormat(() => '')
            )
            .selectAll('line')
            .attr('stroke', '#334155')
            .attr('stroke-opacity', 0.5);
        g.select('.grid .domain').remove();

        // Area
        const area = d3.area<{ year: number; value: number }>()
            .x(d => xScale(d.year))
            .y0(innerHeight)
            .y1(d => yScale(d.value))
            .curve(d3.curveMonotoneX);

        const gradient = svg.append('defs')
            .append('linearGradient')
            .attr('id', 'areaGradient')
            .attr('x1', '0%')
            .attr('y1', '0%')
            .attr('x2', '0%')
            .attr('y2', '100%');

        gradient.append('stop')
            .attr('offset', '0%')
            .attr('stop-color', '#10b981')
            .attr('stop-opacity', 0.3);

        gradient.append('stop')
            .attr('offset', '100%')
            .attr('stop-color', '#10b981')
            .attr('stop-opacity', 0);

        g.append('path')
            .datum(sortedData)
            .attr('fill', 'url(#areaGradient)')
            .attr('d', area);

        // Line
        const line = d3.line<{ year: number; value: number }>()
            .x(d => xScale(d.year))
            .y(d => yScale(d.value))
            .curve(d3.curveMonotoneX);

        g.append('path')
            .datum(sortedData)
            .attr('fill', 'none')
            .attr('stroke', '#10b981')
            .attr('stroke-width', 2.5)
            .attr('d', line);

        // Dots
        g.selectAll('circle')
            .data(sortedData)
            .enter()
            .append('circle')
            .attr('cx', d => xScale(d.year))
            .attr('cy', d => yScale(d.value))
            .attr('r', 4)
            .attr('fill', '#10b981')
            .attr('stroke', '#0f172a')
            .attr('stroke-width', 2);

        // X Axis
        g.append('g')
            .attr('transform', `translate(0,${innerHeight})`)
            .call(d3.axisBottom(xScale).tickFormat(d => String(d)).ticks(8))
            .selectAll('text')
            .attr('fill', '#94a3b8');

        // Y Axis
        g.append('g')
            .call(d3.axisLeft(yScale).ticks(5))
            .selectAll('text')
            .attr('fill', '#94a3b8');

        g.selectAll('.domain').attr('stroke', '#334155');
        g.selectAll('.tick line').attr('stroke', '#334155');

        // Title
        svg.append('text')
            .attr('x', width / 2)
            .attr('y', 20)
            .attr('text-anchor', 'middle')
            .attr('fill', '#e2e8f0')
            .attr('font-size', '14px')
            .attr('font-weight', '600')
            .text(title);

        // Y Label
        svg.append('text')
            .attr('transform', `translate(15,${height / 2}) rotate(-90)`)
            .attr('text-anchor', 'middle')
            .attr('fill', '#64748b')
            .attr('font-size', '12px')
            .text(unit);

    }, [data, title, unit]);

    return (
        <div ref={containerRef} className="w-full">
            <svg ref={svgRef} className="w-full" />
        </div>
    );
}
